const { Markup } = require('telegraf');
const apiClient = require('../services/apiClient');
const { formatProductVision } = require('../utils/formatter');

module.exports = {
  /**
   * Обработка идеи от пользователя
   */
  async handleIdea(ctx, state) {
    const idea = ctx.message.text;
    const userId = ctx.from.id;

    // Валидация
    if (idea.length < 20) {
      await ctx.reply(
        '⚠️ Описание слишком короткое.\n\n' +
        'Опишите идею подробнее (минимум 20 символов).'
      );
      return;
    }

    if (idea.length > 2000) {
      await ctx.reply(
        '⚠️ Описание слишком длинное.\n\n' +
        'Сократите до 2000 символов.'
      );
      return;
    }

    // Отправляем сообщение о процессе
    const statusMsg = await ctx.reply('⏳ Анализирую вашу идею...\n\nЭто может занять несколько секунд.');

    try {
      // Анализ идеи через API
      const response = await apiClient.analyzeIdea(idea);

      if (!response.success) {
        throw new Error(response.error || 'Ошибка анализа идеи');
      }

      const { projectId, productVision, keyFeatures } = response.data;

      // Сохраняем в состоянии
      ctx.userState.set(userId, {
        stage: 'reviewing_vision',
        projectId,
        productVision,
        keyFeatures,
        originalIdea: idea
      });

      // Удаляем сообщение о процессе
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);

      // Отправляем образ продукта
      const visionText = formatProductVision(productVision, keyFeatures);
      
      await ctx.reply(
        visionText,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Принять и создать план', 'accept_vision')],
            [Markup.button.callback('✏️ Скорректировать', 'correct_vision')],
            [Markup.button.callback('❌ Отменить', 'start_new')]
          ])
        }
      );

    } catch (error) {
      console.error('Error analyzing idea:', error);
      
      // Удаляем сообщение о процессе
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch (e) {}

      await ctx.reply(
        '❌ Произошла ошибка при анализе идеи.\n\n' +
        `Детали: ${error.message}\n\n` +
        'Попробуйте еще раз или используйте /cancel для отмены.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Попробовать снова', 'start_new')]
        ])
      );

      // Сбрасываем состояние
      ctx.userState.delete(userId);
    }
  },

  /**
   * Обработка корректировок образа продукта
   */
  async handleCorrection(ctx, state) {
    const corrections = ctx.message.text;
    const userId = ctx.from.id;

    if (!state.projectId) {
      await ctx.reply('Ошибка: проект не найден. Используйте /start чтобы начать заново.');
      ctx.userState.delete(userId);
      return;
    }

    // Отправляем сообщение о процессе
    const statusMsg = await ctx.reply('⏳ Обновляю образ продукта...');

    try {
      // Обновление через API
      const response = await apiClient.updateProductVision(state.projectId, corrections);

      if (!response.success) {
        throw new Error(response.error || 'Ошибка обновления образа продукта');
      }

      const { productVision, keyFeatures } = response.data;

      // Обновляем состояние
      ctx.userState.set(userId, {
        ...state,
        stage: 'reviewing_vision',
        productVision,
        keyFeatures
      });

      // Удаляем сообщение о процессе
      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);

      // Отправляем обновленный образ
      const visionText = formatProductVision(productVision, keyFeatures);
      
      await ctx.reply(
        '✨ *Образ продукта обновлен*\n\n' + visionText,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('✅ Принять и создать план', 'accept_vision')],
            [Markup.button.callback('✏️ Скорректировать еще', 'correct_vision')],
            [Markup.button.callback('❌ Отменить', 'start_new')]
          ])
        }
      );

    } catch (error) {
      console.error('Error updating vision:', error);
      
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
      } catch (e) {}

      await ctx.reply(
        '❌ Произошла ошибка при обновлении образа.\n\n' +
        `Детали: ${error.message}\n\n` +
        'Попробуйте еще раз или используйте /cancel.',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Вернуться к образу', 'accept_vision')]
        ])
      );
    }
  }
};

