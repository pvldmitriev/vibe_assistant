/**
 * Генератор промптов для различных типов шагов разработки
 */
class PromptGenerator {
  
  /**
   * Генерирует шаблонные промпты для стандартных шагов
   */
  generateTemplatePrompt(stepType, context = {}) {
    const templates = {
      'project-structure': this.projectStructurePrompt,
      'backend-setup': this.backendSetupPrompt,
      'frontend-setup': this.frontendSetupPrompt,
      'api-endpoints': this.apiEndpointsPrompt,
      'ui-components': this.uiComponentsPrompt,
      'database': this.databasePrompt,
      'deployment': this.deploymentPrompt
    };

    const generator = templates[stepType];
    if (generator) {
      return generator.call(this, context);
    }

    return this.genericPrompt(context);
  }

  projectStructurePrompt(context) {
    return `Создай базовую структуру проекта для приложения "${context.projectName || 'мое приложение'}".

Требования:
1. Создай папки для frontend и backend
2. Настрой package.json для обеих частей
3. Создай базовые конфигурационные файлы (.gitignore, README.md)
4. Инициализируй Git репозиторий

Структура должна быть простой и готовой к разработке.`;
  }

  backendSetupPrompt(context) {
    const tech = context.backend || 'Node.js + Express';
    return `Настрой backend на ${tech}.

Требования:
1. Создай основной сервер с базовой конфигурацией
2. Настрой middleware (CORS, body-parser, логирование)
3. Создай структуру для routes, services, models
4. Добавь обработку ошибок
5. Настрой переменные окружения (.env)

Backend должен запускаться и отвечать на health check запросы.`;
  }

  frontendSetupPrompt(context) {
    const tech = context.frontend || 'React/Next.js';
    return `Настрой frontend на ${tech}.

Требования:
1. Инициализируй проект с базовыми зависимостями
2. Создай структуру папок (components, pages, services, styles)
3. Настрой роутинг
4. Создай базовый layout
5. Настрой подключение к API backend

Приложение должно запускаться и отображать базовую страницу.`;
  }

  apiEndpointsPrompt(context) {
    const endpoints = context.endpoints || ['GET /api/items', 'POST /api/items'];
    return `Создай API эндпоинты для backend:

${endpoints.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Требования:
1. Каждый эндпоинт должен иметь валидацию входных данных
2. Обработка ошибок с понятными сообщениями
3. Возврат данных в JSON формате
4. Логирование запросов
5. Документируй каждый эндпоинт в комментариях

Протестируй эндпоинты с помощью curl или Postman.`;
  }

  uiComponentsPrompt(context) {
    const components = context.components || ['Header', 'Footer', 'Card'];
    return `Создай UI компоненты для frontend:

${components.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Требования:
1. Функциональные React компоненты с хуками
2. Переиспользуемые и гибкие (через props)
3. Базовая стилизация (CSS или TailwindCSS)
4. Responsive дизайн
5. Понятная структура и именование

Компоненты должны быть готовы к использованию в страницах.`;
  }

  databasePrompt(context) {
    const db = context.database || 'MongoDB';
    return `Настрой базу данных ${db}.

Требования:
1. Установи и настрой подключение к БД
2. Создай схемы/модели для основных сущностей
3. Реализуй базовые CRUD операции
4. Добавь обработку ошибок подключения
5. Настрой переменные окружения для connection string

База данных должна успешно подключаться и выполнять операции.`;
  }

  deploymentPrompt(context) {
    const platform = context.platform || 'Docker';
    return `Настрой развертывание приложения на ${platform}.

Требования:
1. Создай Dockerfile для backend и frontend
2. Настрой docker-compose.yml
3. Добавь переменные окружения для production
4. Настрой volumes и сети
5. Протестируй запуск через Docker

Приложение должно запускаться одной командой docker-compose up.`;
  }

  genericPrompt(context) {
    return `Реализуй следующую функциональность: ${context.description || 'описание не предоставлено'}

Требования:
1. Следуй best practices
2. Добавь обработку ошибок
3. Напиши понятный и читаемый код
4. Протестируй работоспособность
5. Добавь комментарии для сложной логики`;
  }

  /**
   * Улучшить существующий промпт, добавив технические детали
   */
  enhancePrompt(basePrompt, technicalContext) {
    let enhanced = basePrompt;

    if (technicalContext.technologies && technicalContext.technologies.length > 0) {
      enhanced += `\n\nИспользуемые технологии: ${technicalContext.technologies.join(', ')}`;
    }

    if (technicalContext.files && technicalContext.files.length > 0) {
      enhanced += `\n\nФайлы для работы:\n${technicalContext.files.map(f => `- ${f}`).join('\n')}`;
    }

    if (technicalContext.dependencies && technicalContext.dependencies.length > 0) {
      enhanced += `\n\nНеобходимые зависимости:\n${technicalContext.dependencies.map(d => `- ${d}`).join('\n')}`;
    }

    return enhanced;
  }
}

module.exports = new PromptGenerator();

