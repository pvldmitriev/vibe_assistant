const OpenAI = require('openai');
const promptLoader = require('./promptLoader');

class AIService {
  constructor() {
    // Определяем какой API использовать
    const useOpenRouter = process.env.DEFAULT_MODEL && process.env.DEFAULT_MODEL.includes('/');
    
    if (useOpenRouter) {
      // OpenRouter API
      const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
      
      if (!apiKey || apiKey === 'your_openrouter_key_here' || apiKey === 'your_openai_api_key_here') {
        console.error('❌ OPENROUTER_API_KEY не установлен! Получите ключ на https://openrouter.ai/keys');
        console.error('   Для бесплатных моделей достаточно создать аккаунт и получить ключ.');
        console.error('   Некоторые модели доступны без ключа через OPENAI_API_KEY (пустой строкой).');
      }
      
      this.client = new OpenAI({
        apiKey: apiKey || 'sk-or-v1-dummy',  // Некоторые бесплатные модели работают с любым ключом
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://vibe-assistant.local',
          'X-Title': 'Vibe Assistant'
        }
      });
      
      this.model = process.env.DEFAULT_MODEL || 'alibaba/tongyi-deepresearch-30b-a3b:free';
      console.log(`🤖 Использую OpenRouter модель: ${this.model}`);
      console.log(`🔑 API Key статус: ${apiKey ? 'установлен' : 'не установлен'}`);
    } else {
      // OpenAI API
      if (!process.env.OPENAI_API_KEY) {
        console.warn('⚠️  OPENAI_API_KEY не найден в переменных окружения');
      }
      
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      this.model = process.env.AI_MODEL || 'gpt-4';
      console.log(`🤖 Использую OpenAI модель: ${this.model}`);
    }
    
    // Устанавливаем max_tokens = 64000 (из памяти пользователя)
    this.maxTokens = 64000;
    console.log(`⚙️  Max tokens: ${this.maxTokens}`);
  }

  /**
   * Обработка ошибок AI API с понятными сообщениями
   */
  handleAIError(error, context = 'AI запрос') {
    console.error(`❌ Ошибка ${context}:`, error);

    // Rate limit
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      throw new Error('Превышен лимит запросов. Подождите минуту и попробуйте снова.');
    }

    // Timeout
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Превышено время ожидания. Проверьте интернет-соединение и попробуйте снова.');
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Нет связи с сервером AI. Проверьте интернет-соединение.');
    }

    // Authentication
    if (error.status === 401 || error.status === 403) {
      throw new Error('Ошибка аутентификации. Проверьте API ключ в настройках.');
    }

    // Invalid request
    if (error.status === 400) {
      throw new Error('Некорректный запрос к AI. Попробуйте переформулировать или обратитесь в поддержку.');
    }

    // Server errors
    if (error.status >= 500) {
      throw new Error('Ошибка сервера AI. Попробуйте позже.');
    }

    // Generic error
    throw new Error(`Ошибка AI: ${error.message || 'Неизвестная ошибка'}`);
  }

  /**
   * Определить категорию продукта по описанию идеи
   * Возвращает { category, confidence } или null если уверенности < 0.7
   */
  async analyzeIdeaCategory(ideaDescription) {
    try {
      const prompt = `Определи категорию продукта на основе описания идеи.

ИДЕЯ: "${ideaDescription}"

ДОСТУПНЫЕ КАТЕГОРИИ:
- WEB_APP - веб-приложение (сайт, веб-сервис)
- BOT - Telegram бот
- MOBILE_APP - мобильное приложение (iOS или Android)

Ответь ТОЛЬКО валидным JSON:
{
  "category": "WEB_APP" | "BOT" | "MOBILE_APP",
  "confidence": 0.0-1.0,
  "reasoning": "короткое объяснение почему эта категория"
}`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Ты эксперт по классификации типов программных продуктов.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // низкая температура для более точной классификации
        max_tokens: 500,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.warn('Не удалось получить JSON ответ от AI');
        return null;
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // FALLBACK: если уверенность < 0.7, возвращаем null
      // Пользователю придется выбрать категорию вручную
      if (result.confidence < 0.7) {
        console.log(`⚠️  Низкая уверенность в категории: ${result.confidence}`);
        return null;
      }

      console.log(`✅ Категория определена: ${result.category} (уверенность: ${result.confidence})`);
      return result;

    } catch (error) {
      this.handleAIError(error, 'определение категории');
    }
  }

  /**
   * Сгенерировать адаптивные вопросы на основе идеи и категории
   */
  async generateAdaptiveQuestions(ideaDescription, category, baseAnswers) {
    try {
      const prompt = await promptLoader.render('generate-adaptive-questions', {
        ideaDescription,
        category,
        baseAnswers: JSON.stringify(baseAnswers, null, 2)
      });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Ты эксперт по product discovery. Задаешь правильные вопросы о продукте.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: this.maxTokens,
      });

      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (!jsonMatch) {
        throw new Error('AI не вернул валидный JSON массив вопросов');
      }

      const questions = JSON.parse(jsonMatch[0]);
      console.log(`✅ Сгенерировано ${questions.length} адаптивных вопросов`);
      
      return questions;

    } catch (error) {
      this.handleAIError(error, 'генерация адаптивных вопросов');
    }
  }

  /**
   * Сгенерировать PRD на основе всех ответов
   * Использует max_tokens = 64000
   */
  async generatePRD(ideaDescription, category, allAnswers, goal) {
    try {
      const prompt = await promptLoader.render('generate-prd', {
        ideaDescription,
        category,
        allAnswers: JSON.stringify(allAnswers, null, 2),
        goal
      });

      const startTime = Date.now();
      
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'Ты опытный product manager и архитектор. Пишешь детальные PRD на русском языке.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: this.maxTokens, // 64000 tokens
      });

      const duration = Date.now() - startTime;
      const prd = response.choices[0].message.content;
      
      console.log(`✅ PRD сгенерирован за ${duration}ms (${prd.length} символов)`);
      
      return prd;

    } catch (error) {
      this.handleAIError(error, 'генерация PRD');
    }
  }

  /**
   * Сгенерировать промпты для всех шагов (setup, planning, implementation, deploy)
   */
  async generatePrompts(prd, goal, category) {
    try {
      const prompts = {};

      // Setup prompt
      prompts.setup = await promptLoader.render('setup-prompt', {
        prd,
        goal,
        category
      });

      // Planning prompt
      prompts.planning = await promptLoader.render('planning-prompt', {
        prd,
        goal
      });

      // Implementation prompt
      prompts.implementation = await promptLoader.render('implementation-prompt', {
        prd,
        goal
      });

      // Deploy prompts (3 варианта)
      prompts.deployVercel = await promptLoader.render('deploy-vercel', {
        prd,
        goal,
        category
      });

      prompts.deployDocker = await promptLoader.render('deploy-docker', {
        prd,
        goal,
        category
      });

      prompts.deployLocal = await promptLoader.render('deploy-local', {
        prd,
        goal,
        category
      });

      console.log(`✅ Все промпты сгенерированы`);
      
      return prompts;

    } catch (error) {
      this.handleAIError(error, 'генерация промптов');
    }
  }

  /**
   * Сгенерировать debug промпт на основе описания ошибки
   */
  async generateDebugPrompt(errorDescription, prd) {
    try {
      const prompt = await promptLoader.render('debug-prompt', {
        errorDescription,
        prd
      });

      return prompt;

    } catch (error) {
      this.handleAIError(error, 'генерация debug промпта');
    }
  }

}

module.exports = new AIService();

