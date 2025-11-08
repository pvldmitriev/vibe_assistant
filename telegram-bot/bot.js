require('dotenv').config();
const { Telegraf } = require('telegraf');
const commandHandler = require('./src/handlers/commandHandler');

// Проверка токена бота
if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в переменных окружения');
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware для логирования
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[${new Date().toISOString()}] ${ctx.updateType} - ${ms}ms`);
});

// Команды - только /start
bot.start(commandHandler.start);

// Обработка любых других сообщений
bot.on('message', async (ctx) => {
  await ctx.reply(
    'Используйте команду /start для информации о боте.',
    { parse_mode: 'Markdown' }
  );
});

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err);
  ctx.reply('Произошла ошибка. Попробуйте /start для перезапуска.');
});

// Graceful shutdown
process.once('SIGINT', () => {
  console.log('🛑 Stopping bot...');
  bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
  console.log('🛑 Stopping bot...');
  bot.stop('SIGTERM');
});

// Запуск бота
bot.launch()
  .then(() => {
    console.log('🤖 Telegram бот запущен!');
    console.log(`📝 Backend URL: ${process.env.BACKEND_URL}`);
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
    process.exit(1);
  });

