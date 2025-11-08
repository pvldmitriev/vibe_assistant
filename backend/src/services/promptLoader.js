const fs = require('fs').promises;
const path = require('path');

// Условная загрузка chokidar только в dev режиме
let chokidar = null;
if (process.env.NODE_ENV !== 'production') {
  try {
    chokidar = require('chokidar');
  } catch (e) {
    console.warn('⚠️  chokidar не установлен, hot reload отключен');
  }
}

/**
 * Prompt Loader Service - загрузка и рендеринг промптов из .txt файлов
 * С поддержкой hot reload в development режиме
 */
class PromptLoader {
  constructor() {
    this.promptsDir = path.join(__dirname, '../../prompts');
    this.cache = new Map(); // Map<promptName, promptContent>
    this.watcher = null;

    // Автоматически инициализируем hot reload в dev режиме
    if (process.env.NODE_ENV !== 'production') {
      this.startHotReload();
    }
  }

  /**
   * Загрузить промпт из файла
   */
  async load(promptName) {
    // Проверяем кэш
    if (this.cache.has(promptName)) {
      return this.cache.get(promptName);
    }

    // Загружаем из файла
    const filePath = path.join(this.promptsDir, `${promptName}.txt`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.cache.set(promptName, content);
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Промпт "${promptName}" не найден в ${this.promptsDir}`);
      }
      throw error;
    }
  }

  /**
   * Рендерить промпт с переменными
   * Поддерживает {{variable}} и {{#if condition}}...{{/if}}
   */
  async render(promptName, variables = {}) {
    const template = await this.load(promptName);
    
    // Заменяем простые переменные {{variable}}
    let rendered = template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });

    // Обрабатываем условия {{#if condition}}...{{/if}}
    rendered = this.processConditions(rendered, variables);

    return rendered;
  }

  /**
   * Обработка условных блоков {{#if condition}}...{{/if}}
   */
  processConditions(template, variables) {
    // Паттерн для условий: {{#if variable == "value"}}...{{/if}}
    const conditionPattern = /\{\{#if\s+(.+?)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return template.replace(conditionPattern, (match, condition, content) => {
      const isTrue = this.evaluateCondition(condition.trim(), variables);
      return isTrue ? content : '';
    });
  }

  /**
   * Оценить условие (парсер с поддержкой логических операторов)
   */
  evaluateCondition(condition, variables) {
    // Поддержка OR (||)
    if (condition.includes('||')) {
      const parts = condition.split('||').map(p => p.trim());
      return parts.some(part => this.evaluateCondition(part, variables));
    }
    
    // Поддержка AND (&&)
    if (condition.includes('&&')) {
      const parts = condition.split('&&').map(p => p.trim());
      return parts.every(part => this.evaluateCondition(part, variables));
    }

    // Поддерживаем условия вида: variable == "value"
    const eqMatch = condition.match(/^(\w+)\s*==\s*["'](.+?)["']$/);
    if (eqMatch) {
      const [, varName, value] = eqMatch;
      return variables[varName] === value;
    }

    // Поддерживаем условия вида: variable === "value"
    const strictEqMatch = condition.match(/^(\w+)\s*===\s*["'](.+?)["']$/);
    if (strictEqMatch) {
      const [, varName, value] = strictEqMatch;
      return variables[varName] === value;
    }

    // Поддерживаем логическое значение переменной
    if (condition in variables) {
      return Boolean(variables[condition]);
    }

    // По умолчанию false
    return false;
  }

  /**
   * Очистить кэш промптов
   */
  clearCache() {
    const cacheSize = this.cache.size;
    this.cache.clear();
    console.log(`🗑️  Кэш промптов очищен (${cacheSize} файлов)`);
  }

  /**
   * Перезагрузить конкретный промпт
   */
  async reload(promptName) {
    this.cache.delete(promptName);
    console.log(`🔄 Промпт "${promptName}" перезагружен`);
  }

  /**
   * Запустить hot reload в dev режиме
   */
  startHotReload() {
    if (this.watcher) {
      console.log('⚠️  Hot reload уже запущен');
      return;
    }

    if (!chokidar) {
      console.log('⚠️  chokidar не доступен, hot reload отключен');
      return;
    }

    console.log(`👀 Отслеживаю изменения промптов в ${this.promptsDir}`);

    this.watcher = chokidar.watch(`${this.promptsDir}/*.txt`, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('change', (filePath) => {
        const promptName = path.basename(filePath, '.txt');
        this.cache.delete(promptName);
        console.log(`🔥 Hot reload: ${promptName}.txt изменен`);
      })
      .on('add', (filePath) => {
        const promptName = path.basename(filePath, '.txt');
        console.log(`➕ Новый промпт добавлен: ${promptName}.txt`);
      })
      .on('unlink', (filePath) => {
        const promptName = path.basename(filePath, '.txt');
        this.cache.delete(promptName);
        console.log(`➖ Промпт удален: ${promptName}.txt`);
      })
      .on('error', (error) => {
        console.error('❌ Ошибка hot reload:', error);
      });
  }

  /**
   * Остановить hot reload
   */
  stopHotReload() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('🛑 Hot reload остановлен');
    }
  }

  /**
   * Получить список доступных промптов
   */
  async listPrompts() {
    try {
      const files = await fs.readdir(this.promptsDir);
      return files
        .filter(file => file.endsWith('.txt'))
        .map(file => path.basename(file, '.txt'));
    } catch (error) {
      console.error('Ошибка чтения папки промптов:', error);
      return [];
    }
  }
}

// Singleton instance
const promptLoader = new PromptLoader();

// Graceful shutdown
process.on('SIGTERM', () => {
  promptLoader.stopHotReload();
});

process.on('SIGINT', () => {
  promptLoader.stopHotReload();
});

module.exports = promptLoader;

