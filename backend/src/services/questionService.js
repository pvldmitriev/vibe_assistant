/**
 * Question Service - базовые вопросы для генерации PRD
 * Все вопросы на русском языке
 */

// Категории продуктов
const CATEGORIES = {
  WEB_APP: 'WEB_APP',
  BOT: 'BOT',
  MOBILE_APP: 'MOBILE_APP'
};

// 4 базовых вопроса (для всех категорий одинаковые)
const BASE_QUESTIONS = [
  {
    id: 'audience',
    question: 'Для кого этот продукт?',
    explanation: 'Понимание аудитории определит UI/UX, сложность интерфейса и терминологию в коде.',
    placeholder: 'Например: для студентов, для себя, для малого бизнеса...',
    type: 'text',
    required: true
  },
  {
    id: 'problem',
    question: 'Какую конкретную проблему он решает?',
    explanation: 'Это ядро PRD. Помогает определить главные функции и отсечь лишнее в MVP.',
    placeholder: 'Опишите проблему или задачу...',
    type: 'text',
    required: true
  },
  {
    id: 'result',
    question: 'Какой главный результат получит пользователь?',
    explanation: 'Определяет критерий успеха продукта и помогает приоритизировать фичи.',
    placeholder: 'Что изменится для пользователя после использования?',
    type: 'text',
    required: true
  },
  {
    id: 'goal',
    question: 'Какую цель вы преследуете этим проектом?',
    explanation: 'Влияет на уровень качества кода, нужны ли тесты, документация и production-деплой.',
    type: 'select',
    required: true,
    options: [
      {
        value: 'Обучение и практика',
        label: 'Обучение и практика',
        description: 'Простой код, без тестов, локальный запуск'
      },
      {
        value: 'Использовать самому',
        label: 'Использовать самому',
        description: 'Рабочий код, опциональные тесты'
      },
      {
        value: 'Для пользователей',
        label: 'Для пользователей',
        description: 'Production-ready, тесты обязательны, облачный деплой'
      },
      {
        value: 'Портфолио',
        label: 'Портфолио',
        description: 'Идеальный код, полное покрытие тестами, красивый деплой'
      }
    ]
  }
];

class QuestionService {
  constructor() {
    this.categories = CATEGORIES;
    this.baseQuestions = BASE_QUESTIONS;
  }

  /**
   * Получить базовые вопросы (4 штуки)
   */
  getBaseQuestions() {
    return this.baseQuestions;
  }

  /**
   * Получить все категории
   */
  getCategories() {
    return Object.values(this.categories);
  }

  /**
   * Получить название категории на русском
   */
  getCategoryName(category) {
    const names = {
      [CATEGORIES.WEB_APP]: 'Web приложение',
      [CATEGORIES.BOT]: 'Telegram бот',
      [CATEGORIES.MOBILE_APP]: 'Мобильное приложение'
    };

    return names[category] || category;
  }

  /**
   * Получить эмодзи для категории
   */
  getCategoryEmoji(category) {
    const emojis = {
      [CATEGORIES.WEB_APP]: '🌐',
      [CATEGORIES.BOT]: '🤖',
      [CATEGORIES.MOBILE_APP]: '📱'
    };

    return emojis[category] || '📦';
  }

  /**
   * Валидация базовых ответов
   */
  validateBaseAnswers(answers) {
    const errors = [];

    this.baseQuestions.forEach(question => {
      if (question.required && !answers[question.id]) {
        errors.push({
          field: question.id,
          message: `Поле "${question.question}" обязательно для заполнения`
        });
      }

      // Проверка минимальной длины для текстовых полей
      if (question.type === 'text' && answers[question.id]) {
        const text = answers[question.id].trim();
        if (text.length < 3) {
          errors.push({
            field: question.id,
            message: `Поле "${question.question}" слишком короткое (минимум 3 символа)`
          });
        }
      }

      // Проверка что выбрано значение для select
      if (question.type === 'select' && answers[question.id]) {
        const validOptions = question.options.map(o => o.value);
        if (!validOptions.includes(answers[question.id])) {
          errors.push({
            field: question.id,
            message: `Некорректное значение для "${question.question}"`
          });
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Получить описание цели проекта
   */
  getGoalDescription(goal) {
    const question = this.baseQuestions.find(q => q.id === 'goal');
    if (!question) return null;

    const option = question.options.find(o => o.value === goal);
    return option ? option.description : null;
  }

  /**
   * Получить рекомендованный тип деплоя для цели
   */
  getRecommendedDeployType(goal) {
    const recommendations = {
      'Обучение и практика': 'local',
      'Использовать самому': 'docker',
      'Для пользователей': 'vercel',
      'Портфолио': 'vercel'
    };

    return recommendations[goal] || 'local';
  }

  /**
   * Определить нужны ли тесты для данной цели
   */
  areTestsRequired(goal) {
    return goal === 'Для пользователей' || goal === 'Портфолио';
  }

  /**
   * Определить нужна ли детальная документация
   */
  isDocumentationRequired(goal) {
    return goal === 'Портфолио';
  }
}

// Singleton instance
const questionService = new QuestionService();

module.exports = questionService;
module.exports.CATEGORIES = CATEGORIES;

