const { Markup } = require('telegraf');
const apiClient = require('../services/apiClient');
const { formatPlan, formatStep, formatProgress } = require('../utils/formatter');

module.exports = {
  /**
   * Принять образ продукта и создать план
   */
  async acceptVision(ctx) {
    const userId = ctx.from.id;
    const state = ctx.userState.get(userId);

    if (!state || !state.projectId) {
      await ctx.answerCbQuery('Ошибка: проект не найден');
      return;
    }

    await ctx.answerCbQuery();
    const statusMsg = await ctx.reply('⏳ Генерирую план разработки...\n\nЭто может занять 10-15 секунд.');

    try {
      // Генерация плана через API
      const response = await apiClient.generatePlan(state.projectId);

      if (!response.success || !response.data.steps) {
        throw new Error('Не удалось сгенерировать план');
      }

      const { steps } = response.data;

      // Обновляем состояние
      ctx.userState.set(userId, {
        ...state,
        stage: 'viewing_plan',
        steps
      });

      // Удаляем сообщение о процессе
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);

      // Отправляем план
      const planText = formatPlan(steps, { total: steps.length, completed: 0 });
      
      await ctx.reply(
        planText,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(
            generateStepButtons(steps)
          )
        }
      );

    } catch (error) {
      console.error('Error generating plan:', error);
      
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch (e) {}

      await ctx.reply(
        '❌ Произошла ошибка при генерации плана.\n\n' +
        `Детали: ${error.message}\n\n` +
        'Попробуйте еще раз.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Попробовать снова', 'accept_vision')]
        ])
      );
    }
  },

  /**
   * Запросить корректировку образа
   */
  async correctVision(ctx) {
    const userId = ctx.from.id;
    const state = ctx.userState.get(userId);

    if (!state) {
      await ctx.answerCbQuery('Ошибка: состояние не найдено');
      return;
    }

    // Меняем состояние
    ctx.userState.set(userId, {
      ...state,
      stage: 'waiting_correction'
    });

    await ctx.answerCbQuery();
    await ctx.reply(
      '✏️ *Что нужно изменить или дополнить?*\n\n' +
      'Опишите ваши корректировки, например:\n' +
      '• Добавьте функцию экспорта данных\n' +
      '• Упростите интерфейс\n' +
      '• Сделайте акцент на мобильной версии',
      { parse_mode: 'Markdown' }
    );
  },

  /**
   * Показать детали шага
   */
  async viewStep(ctx) {
    const stepId = ctx.match[1];
    const userId = ctx.from.id;
    const state = ctx.userState.get(userId);

    if (!state || !state.steps) {
      await ctx.answerCbQuery('Ошибка: план не найден');
      return;
    }

    const step = state.steps.find(s => s.id === stepId);
    
    if (!step) {
      await ctx.answerCbQuery('Шаг не найден');
      return;
    }

    await ctx.answerCbQuery();

    const stepText = formatStep(step);
    
    await ctx.reply(
      stepText,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(
            step.completed ? '❌ Отменить выполнение' : '✅ Отметить выполненным',
            step.completed ? `uncomplete_step_${stepId}` : `complete_step_${stepId}`
          )],
          [Markup.button.callback('📋 Вернуться к плану', `show_plan_${state.projectId}`)]
        ])
      }
    );
  },

  /**
   * Отметить шаг как выполненный
   */
  async completeStep(ctx) {
    const stepId = ctx.match[1];
    const userId = ctx.from.id;
    const state = ctx.userState.get(userId);

    if (!state) {
      await ctx.answerCbQuery('Ошибка: состояние не найдено');
      return;
    }

    try {
      const response = await apiClient.completeStep(stepId);
      
      if (response.success) {
        // Обновляем локальное состояние
        const updatedSteps = state.steps.map(s => 
          s.id === stepId ? { ...s, completed: true } : s
        );
        
        ctx.userState.set(userId, {
          ...state,
          steps: updatedSteps
        });

        await ctx.answerCbQuery('✅ Шаг отмечен как выполненный!');
        
        // Обновляем сообщение
        const step = updatedSteps.find(s => s.id === stepId);
        const stepText = formatStep(step);
        
        await ctx.editMessageText(
          stepText,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('❌ Отменить выполнение', `uncomplete_step_${stepId}`)],
              [Markup.button.callback('📋 Вернуться к плану', `show_plan_${state.projectId}`)]
            ])
          }
        );
      }
    } catch (error) {
      console.error('Error completing step:', error);
      await ctx.answerCbQuery('❌ Ошибка отметки шага');
    }
  },

  /**
   * Отменить выполнение шага
   */
  async uncompleteStep(ctx) {
    const stepId = ctx.match[1];
    const userId = ctx.from.id;
    const state = ctx.userState.get(userId);

    if (!state) {
      await ctx.answerCbQuery('Ошибка: состояние не найдено');
      return;
    }

    try {
      const response = await apiClient.uncompleteStep(stepId);
      
      if (response.success) {
        // Обновляем локальное состояние
        const updatedSteps = state.steps.map(s => 
          s.id === stepId ? { ...s, completed: false } : s
        );
        
        ctx.userState.set(userId, {
          ...state,
          steps: updatedSteps
        });

        await ctx.answerCbQuery('Отметка снята');
        
        // Обновляем сообщение
        const step = updatedSteps.find(s => s.id === stepId);
        const stepText = formatStep(step);
        
        await ctx.editMessageText(
          stepText,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('✅ Отметить выполненным', `complete_step_${stepId}`)],
              [Markup.button.callback('📋 Вернуться к плану', `show_plan_${state.projectId}`)]
            ])
          }
        );
      }
    } catch (error) {
      console.error('Error uncompleting step:', error);
      await ctx.answerCbQuery('❌ Ошибка отмены шага');
    }
  },

  /**
   * Показать план
   */
  async showPlan(ctx) {
    const userId = ctx.from.id;
    const state = ctx.userState.get(userId);

    if (!state || !state.steps) {
      await ctx.answerCbQuery('Ошибка: план не найден');
      return;
    }

    await ctx.answerCbQuery();

    const completed = state.steps.filter(s => s.completed).length;
    const planText = formatPlan(state.steps, { total: state.steps.length, completed });
    
    await ctx.reply(
      planText,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(
          generateStepButtons(state.steps)
        )
      }
    );
  },
};

/**
 * Генерация кнопок для шагов
 */
function generateStepButtons(steps) {
    const buttons = steps.slice(0, 10).map(step => {
      const icon = step.completed ? '✅' : '⏸️';
      return [Markup.button.callback(
        `${icon} Шаг ${step.order}: ${step.title}`,
        `view_step_${step.id}`
      )];
    });

    return buttons;
}

