# Vibe Assistant - ИИ-наставник для вайбкодинга

## О проекте

Vibe Assistant — это сервис-помощник для запуска проектов с использованием нейронных сетей. Наша цель — снизить порог вхождения в вайбкодинг и помочь большему числу людей создать первую версию своего продукта.

## Как это работает

1. **Описание идеи**: Пользователь описывает свою идею или потребность
2. **Анализ и образ продукта**: AI анализирует запрос и предлагает образ MVP продукта
3. **Генерация плана**: После согласования образа система генерирует пошаговый план разработки
4. **Выполнение шагов**: Для каждого шага предоставляется готовый промпт для IDE (Cursor/Replit) и Definition of Done

## Архитектура

```
vibe_assistant/
├── frontend/          # Next.js приложение (React)
├── backend/           # Node.js/Express API
├── telegram-bot/      # Telegram бот
├── .cursor/rules/     # Правила для Cursor AI
├── docs/              # Документация
└── scripts/           # Вспомогательные скрипты
```

### Технологии

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Node.js, Express
- **Telegram Bot**: Telegraf
- **AI**: OpenAI API (GPT-4)
- **Развертывание**: Docker Compose

## Быстрый старт

### Требования

- Docker и Docker Compose
- OpenAI API ключ (получите на https://platform.openai.com/api-keys)
- Telegram Bot Token (опционально, для Telegram бота)

### Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/pvldmitriev/vibe_assistant.git
cd vibe_assistant
```

2. Создайте `.env` файл из примера:
```bash
cp .env.example .env
```

3. Добавьте ваши ключи в `.env`:
```env
OPENAI_API_KEY=sk-your-key-here
BOT_TOKEN=your-telegram-bot-token  # опционально
```

4. Запустите приложение:
```bash
npm run dev
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Telegram Bot: автоматически подключится к @your_bot

### Команды

- `npm run dev` - Запуск в режиме разработки
- `npm run build` - Сборка Docker образов
- `npm run start` - Запуск в production режиме
- `npm run stop` - Остановка контейнеров
- `npm run clean` - Полная очистка (контейнеры + volumes)

## Основной сценарий использования

### Веб-интерфейс

1. Откройте приложение в браузере (http://localhost:3000)
2. Введите описание вашей идеи в текстовое поле
3. Нажмите "Анализировать"
4. Изучите предложенный образ продукта
5. При необходимости скорректируйте и уточните
6. Получите пошаговый план разработки
7. Для каждого шага:
   - Скопируйте промпт
   - Вставьте в Cursor или Replit
   - Выполните инструкции
   - Проверьте Definition of Done
   - Отметьте шаг как выполненный

### Telegram бот

1. Найдите вашего бота в Telegram
2. Отправьте `/start`
3. Опишите вашу идею
4. Получите образ продукта и план
5. Следуйте шагам в боте

## API Эндпоинты

- `POST /api/analyze-idea` - Анализ идеи пользователя
- `POST /api/generate-plan` - Генерация плана разработки
- `GET /api/steps/:projectId` - Получение шагов проекта
- `POST /api/steps/:stepId/complete` - Отметка шага как выполненного

## Разработка

### Структура проекта

См. файл `.cursor/rules/project-structure.mdc`

### Стандарты кодирования

См. файл `.cursor/rules/code-standards.mdc`

### Рабочий процесс

См. файл `.cursor/rules/development-workflow.mdc`

## MVP Scope

В текущую MVP версию входит:
- ✅ Анализ идеи с помощью AI
- ✅ Генерация образа продукта
- ✅ Создание пошагового плана
- ✅ Промпты для IDE агентов
- ✅ Отслеживание прогресса

Не входит в MVP:
- ❌ Аутентификация пользователей
- ❌ Постоянное хранение (БД)
- ❌ История проектов
- ❌ Совместная работа

## Лицензия

MIT

