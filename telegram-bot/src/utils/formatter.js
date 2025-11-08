/**
 * Утилиты для форматирования сообщений Telegram
 */

/**
 * Форматирование образа продукта
 */
function formatProductVision(vision, features = []) {
  let text = '📦 *Образ вашего продукта*\n\n';
  text += `${vision}\n\n`;
  
  if (features && features.length > 0) {
    text += '*Основные функции MVP:*\n';
    features.forEach(feature => {
      text += `✓ ${feature}\n`;
    });
  }

  return text;
}

/**
 * Форматирование плана разработки
 */
function formatPlan(steps, progress) {
  let text = '📋 *План разработки*\n\n';
  text += formatProgress(progress);
  text += '\n\n*Шаги разработки:*\n';
  text += `_Всего шагов: ${steps.length}_\n\n`;
  text += 'Нажмите на шаг для просмотра деталей 👇';
  
  return text;
}

/**
 * Форматирование конкретного шага
 */
function formatStep(step) {
  const icon = step.completed ? '✅' : '📝';
  
  let text = `${icon} *Шаг ${step.order}: ${step.title}*\n\n`;
  
  if (step.estimatedMinutes) {
    text += `⏱ _Примерное время: ${step.estimatedMinutes} мин_\n\n`;
  }
  
  // Промпт
  text += '*Промпт для IDE:*\n';
  text += '```\n';
  text += escapeMarkdown(step.prompt);
  text += '\n```\n\n';
  
  // DoD
  if (step.dod && step.dod.length > 0) {
    text += '*Definition of Done:*\n';
    step.dod.forEach(criterion => {
      text += `✓ ${criterion}\n`;
    });
  }
  
  if (step.completed) {
    text += '\n✅ _Шаг отмечен как выполненный_';
  }

  return text;
}

/**
 * Форматирование прогресса
 */
function formatProgress(progress) {
  const { total, completed } = progress;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const progressBar = generateProgressBar(percentage);
  
  let text = `*Прогресс:* ${completed}/${total} шагов (${percentage}%)\n`;
  text += progressBar;
  
  if (percentage === 100) {
    text += '\n\n🎉 *Все шаги выполнены!*';
  }
  
  return text;
}

/**
 * Генерация прогресс-бара
 */
function generateProgressBar(percentage) {
  const filledBlocks = Math.round(percentage / 10);
  const emptyBlocks = 10 - filledBlocks;
  
  return '▓'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
}

/**
 * Экранирование специальных символов Markdown
 */
function escapeMarkdown(text) {
  // Для code blocks не нужно экранировать
  return text;
}

/**
 * Обрезка текста с добавлением многоточия
 */
function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

module.exports = {
  formatProductVision,
  formatPlan,
  formatStep,
  formatProgress,
  generateProgressBar,
  escapeMarkdown,
  truncate
};

