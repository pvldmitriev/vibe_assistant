# Vibe Assistant — Полный Code Review

Версия отчёта: 1.0  
Дата: 2025-11-08  

Репозиторий: Vibe Assistant (frontend + backend + telegram-bot + infra)

---

## 1. Общая архитектура

Проект разделён на три основных сервиса:
- `frontend` — Next.js 14, SPA-мастер сессий (Cursor AI Guide).
- `backend` — Node.js/Express API, AI-интеграция, сессии, экспорт.
- `telegram-bot` — Telegraf бот, использующий backend API.
- Дополнительно: Docker Compose, `.cursor` правила, документация.

Сильные стороны:
- Чёткое разделение по директориям и областям ответственности.
- Простая точка входа backend ([`backend/server.js`](backend/server.js:1)) и явная регистрация маршрутов ([`backend/src/routes/index.js`](backend/src/routes/index.js:1)).
- Наличие сервис-слоя (AI, сессии, вопросы, проекты), что снижает связность роутов.
- Использование промптов из файлов через [`promptLoader.render()`](backend/src/services/promptLoader.js:58) — удобно для итераций.

Основные архитектурные риски:
- Отсутствие персистентного хранилища: [`ProjectService`](backend/src/services/projectService.js:7) и [`SessionService`](backend/src/services/sessionService.js:7) используют in-memory Map. Для MVP допустимо, но:
  - Потеря данных при рестарте.
  - Горизонтальное масштабирование невозможно без shared storage.
- AI-логика и HTTP-слой частично смешаны: временные решения в [`AIService`](backend/src/services/aiService.js:4) завязаны на конкретные промпты, нет чёткого разделения моделей/DTO.
- Отсутствуют единые контракты ответа (response schema) между фронтом, бэком и ботом — виден микс форматов:
  - Новые wizard эндпоинты часто возвращают «сырой» JSON.
  - Старые эндпоинты используют `{ success, data, error }`.

Рекомендации:
1. Ввести единый формат ответа API:
   - Условный формат:
     - success: boolean
     - data: {...} (если success)
     - error: { code, message, details? } (если !success)
2. Спроектировать слой персистентности:
   - Для production: PostgreSQL/SQLite + Prisma или TypeORM.
   - Для MVP: абстрактный репозиторий, чтобы легко заменить Map.
3. Явно задокументировать публичные API в `docs/API.md` (эндпоинты wizard + legacy).

---

## 2. Backend

### 2.1. Точка входа и middleware

[`server.js`](backend/server.js:1):
- Плюсы:
  - Подключен `dotenv`.
  - CORS включен глобально, JSON body парсинг, health-check `/health`.
  - Логирование запросов с timestamp.
  - Глобальные обработчики 404 и 500.

Проблемы и замечания:
- CORS без ограничений (по умолчанию `*`):
  - Для публичного продакшена рекомендуется явно ограничить `origin`.
- Логирование:
  - Используется `console.log`/`console.error`. Для продакшена стоит внедрить структурированный логгер (pino/winston).
- Error handler:
  - Возвращает только `err.message`. Нет `errorId`, нет логики маскировки внутренних ошибок.

Рекомендации:
- Ввести конфиг CORS:
  - example: `ALLOWED_ORIGINS` в `.env` и проверка.
- В error handler добавить:
  - `requestId`, `path`, `method`.
  - Маскирование внутренних ошибок: наружу не выдавать stack/низкоуровневые сообщения.

### 2.2. Роуты и API-слой

[`src/routes/index.js`](backend/src/routes/index.js:1):
- Новые wizard-роуты как основной интерфейс.
- Старые роуты помечены как deprecated — это плюс.

[`wizardRoutes.js`](backend/src/routes/wizardRoutes.js:1):
- Сильные стороны:
  - Чётко структурированные endpoint'ы: sessions, questions, analyze-category, generate-*.
  - Унифицированная обработка ошибок через [`handleError()`](backend/src/routes/wizardRoutes.js:11).
  - Проверка обязательных полей с 400.
  - Отличный UX для экспорта ZIP через `archiver`.
- Риски:
  - `handleError` всегда возвращает 500, даже при ожидаемых ошибках домена (например, невалидные данные, лимиты и т.п.), если исключение брошено из сервисов.
  - Нет явного rate limiting / защиты от злоупотребления AI-эндпоинтами.
  - Повторение валидаций и сообщений — можно вынести константы.

[`ideaRoutes.js`](backend/src/routes/ideaRoutes.js:1), [`planRoutes.js`](backend/src/routes/planRoutes.js:1), [`stepRoutes.js`](backend/src/routes/stepRoutes.js:1):
- Структурированы, с базовой валидацией.
- Используют `projectService` и `aiService`.
- Проблемы:
  - `AIService` в текущей версии не содержит методов `analyzeIdea`, `generatePlan` (они либо в другой части кода, либо удалены). Это создаёт риск «мертвого кода».
  - Разный формат ответов (`success` / без `success`).

Рекомендации:
- Либо удалить legacy-маршруты и соответствующий фронтовый/бот-код, либо восстановить методы в [`AIService`](backend/src/services/aiService.js:4) и зафиксировать контракт.
- Централизовать error mapping: бизнес-ошибки → 4xx, технические → 5xx.

### 2.3. Сервисный слой

#### 2.3.1. AIService

[`AIService`](backend/src/services/aiService.js:4):
- Плюсы:
  - Поддержка OpenRouter и OpenAI через единый клиент.
  - Логирование выбора модели и max_tokens.
  - Отдельный метод [`handleAIError()`](backend/src/services/aiService.js:53) с user-friendly сообщениями.
  - Чёткая логика для:
    - [`analyzeIdeaCategory()`](backend/src/services/aiService.js:94) — строго JSON, проверка confidence.
    - [`generateAdaptiveQuestions()`](backend/src/services/aiService.js:150)
    - [`generatePRD()`](backend/src/services/aiService.js:189)
    - [`generatePrompts()`](backend/src/services/aiService.js:225)
    - [`generateDebugPrompt()`](backend/src/services/aiService.js:279)

Риски/замечания:
- Потенциальная несогласованность с фактическими моделями и лимитами токенов:
  - Жёстко выставлен `maxTokens = 64000`, что может не поддерживаться конкретной моделью.
- Использование эвристик парсинга JSON (`match(/\{[\s\S]*\}/)` / `match(/\[[\s\S]*\]/)`):
  - Хрупко: любые лишние символы, markdown или пояснения «сломают» парсинг.
- Нет явного логирования промптов (в целях отладки) — но логирование промптов может привести к утечке чувствительных данных.
- При отсутствии API-ключа используется dummy key `sk-or-v1-dummy`:
  - Это удобно для дев, но может маскировать на проде отсутствие корректного конфига.

Рекомендации:
- Ввести конфигурационный слой:
  - Явные `ALLOWED_MODELS`, проверка, что `max_tokens` не превышает лимиты.
- Ужесточить протокол с AI:
  - Добавить системное сообщение «верни только JSON без пояснений».
  - Валидация JSON-схемы и fallback для невалидного ответа.
- Для production:
  - Запретить использование dummy key вне `NODE_ENV=development`.

#### 2.3.2. SessionService

[`SessionService`](backend/src/services/sessionService.js:7):
- Плюсы:
  - Чистый API: create/get/update/reset/delete/getStats.
  - Автоочистка старых сессий каждые 24 часа.
- Риски:
  - setInterval без clear при hot reload в dev (но есть graceful shutdown в [`promptLoader`](backend/src/services/promptLoader.js:213), а не здесь).
  - In-memory + нет ограничения на объём.

Рекомендации:
- Добавить:
  - Ограничение числа активных сессий / LRU.
  - Логирование размера при очистке.
- В будущем:
  - Перевести на Redis/БД, вынеся интерфейс.

#### 2.3.3. ProjectService

[`ProjectService`](backend/src/services/projectService.js:7):
- Структурированный CRUD с шагами, прогрессом и логированием.
- Риски:
  - Нет валидации входных данных шагов (предполагаются корректными от AI).
  - Нет проверки коллизий `order`.
- Рекомендации:
  - Добавить runtime-валидацию структуры шагов.
  - Выделить DTO для шагов/проекта.

#### 2.3.4. QuestionService

[`QuestionService`](backend/src/services/questionService.js:70):
- Отлично структурированы базовые вопросы и правила.
- Понятная валидация.
- Связан логикой с frontend (значения goal).

Рекомендация:
- Закрепить значения goal и категорий в общем модуле (shared types) между фронтом и бэком.

#### 2.3.5. PromptLoader

[`PromptLoader`](backend/src/services/promptLoader.js:18):
- Плюсы:
  - Кэширование промптов.
  - Hot reload в dev через `chokidar`.
  - Собственный мини-шаблонизатор с условиями.
- Риски:
  - Использование `process.on('SIGTERM'/'SIGINT')` внутри модуля — может конфликтовать при тестах / нескольких инстансах.
  - `evaluateCondition` использует ручной парсер, но без eval — это безопасно, но ограниченно.
- Рекомендации:
  - Вынести signal-handling в отдельный bootstrap-файл.
  - Документировать синтаксис шаблонов.

---

## 3. Frontend (Next.js)

Основной файл: [`src/pages/index.js`](frontend/src/pages/index.js:1)

Сильные стороны:
- Чёткий пошаговый мастер (10 шагов) с хорошим UX-текстом.
- Состояние сессии синхронизировано с backend через [`apiClient`](frontend/src/services/apiClient.js:5):
  - Хранение `sessionId` в `localStorage`.
  - Восстановление состояния при перезагрузке.
- Разделение UI на компоненты (`Checklist`, `PromptCard`, `Onboarding`, `ExportButton` и др.).
- Подробные инструкции для пользователя, сильный продуктовый UX.

Проблемы/замечания:
1. Размер и сложность [`index.js`](frontend/src/pages/index.js:1):
   - 1000+ строк, множество step-компонентов в одном файле.
   - Тяжело поддерживать, сложно тестировать.
2. API-клиенты:
   - Есть два клиента:
     - [`frontend/src/services/api.js`](frontend/src/services/api.js:1) — axios, «legacy» для старых эндпоинтов.
     - [`frontend/src/services/apiClient.js`](frontend/src/services/apiClient.js:5) — fetch-базированный для wizard.
   - Риски:
     - Дублирование логики.
     - [`apiClient.exportSession()`](frontend/src/services/apiClient.js:156) использует `this.baseURL`, который не определён (baseURL вычисляется только в `getBaseURL()`), это явный баг.
3. Работа с `localStorage`:
   - Используется внутри `useEffect` — корректно.
   - Нет обработки `JSON`/parse ошибок (но значения простые строки — нормально).
4. Обработка ошибок:
   - В мастере ошибки отображаются, но не дифференцированы (AI, сеть, валидация).
5. SSR:
   - Код зависит от `window` только внутри `useEffect`, что безопасно.
   - Но `apiClient` поддерживает SSR URL, хотя master-страница в основном client-side.

Рекомендации:
- Разбить `index.js`:
  - Вынести Step1–Step10 в `/components/wizard` (часть уже есть, но в текущем файле тоже объявлены компоненты; нужно унифицировать).
  - Вынести логику работы с session/API в custom hook: `useWizardSession()`.
- Объединить API-клиенты:
  - Либо оставить только один (`apiClient`) и привести к единому стилю.
  - Исправить баг в `exportSession()`:
    - baseURL должен получаться через `getBaseURL()`.
- Ввести типизацию:
  - Переход на TypeScript для ключевых частей (DTO, API-клиент, steps).

---

## 4. Telegram Bot

Файлы: [`telegram-bot/src/services/apiClient.js`](telegram-bot/src/services/apiClient.js:1) и обработчики.

Сильные стороны:
- Использует axios instance с:
  - Конфигурируемым `BACKEND_URL`.
  - Таймаутом 60 секунд.
  - Логированием запросов/ответов.
- Поддерживает те же эндпоинты, что и legacy backend (analyze-idea, generate-plan, steps).

Риски:
- Привязан к старым эндпоинтам (`/api/analyze-idea`, `/api/generate-plan` и т.д.), в то время как основной UI уже переехал на wizard-роуты.
- Нет retry/backoff при временных ошибках.
- Нет централизованного маппинга ошибок в человекочитаемые сообщения для пользователя TG.

Рекомендации:
- Явно зафиксировать, какие эндпоинты остаются поддерживаемыми.
- Добавить слой адаптации ошибок:
  - Технические → «Сервис временно недоступен, попробуйте позже».
  - Валидационные → показать причину.

---

## 5. Безопасность

Наблюдения:
- `.env.example` используется, чувствительных данных в репозитории не видно.
- AI ключи ожидаются из окружения, но:
  - Есть dummy key для OpenRouter.
- CORS открыт.
- Нет:
  - Rate limiting.
  - Auth.
  - Input sanitization (кроме базовой валидации строк).
- Export ZIP:
  - Архив формируется из данных сессии, без чтения произвольных файлов — безопасно.

Рекомендации (для продакшена):
1. Включить `helmet` на backend.
2. Добавить rate limiting на AI-эндпоинты.
3. Ограничить CORS по доменам.
4. Убрать dummy ключ или отключать его вне dev.
5. Добавить базовую нормализацию/ограничение размеров входных полей:
   - Максимальная длина `ideaDescription`, `errorDescription` и т.п. (частично есть, стоит унифицировать).

---

## 6. Качество кода и поддерживаемость

Сильные стороны:
- Читаемые имена переменных и методов.
- Комментарии на русском с объяснением бизнес-логики.
- Логическое разделение сервисов.
- Отсутствие «магических» побочных эффектов (кроме сигналов в `promptLoader`).

Проблемы:
- Несогласованность API-стиля между разными частями.
- Смешение responsibilities в крупных файлах (`index.js` на фронте).
- Нет линтинга/форматирования, объединённого на весь монорепозиторий (есть `next lint` для фронта, но нет ESLint конфигурации видимой для backend/bot).
- Нет тестов:
  - Ни unit, ни интеграционных.

Рекомендации:
1. Добавить общую ESLint/Prettier конфигурацию для всех пакетов.
2. Ввести базовые unit-тесты:
   - `QuestionService`, `PromptLoader`, `AIService` (частично через mock клиента).
   - `SessionService`/`ProjectService`.
3. В документации описать жизненный цикл сессии и ожидаемые поля.

---

## 7. Инфраструктура и конфигурация

Наблюдения:
- Есть `docker-compose.yml` и `docker-compose.dev.yml` (не были полностью просмотрены в выведенных фрагментах, но упомянуты).
- Frontend использует `NEXT_PUBLIC_API_URL`/`BACKEND_URL`.
- Telegram bot использует `BACKEND_URL=http://backend:3001` по умолчанию.

Потенциальные проблемы:
- Несогласованность переменных окружения:
  - `NEXT_PUBLIC_API_URL`, `BACKEND_URL`, `BACKEND_PORT` должны быть задокументированы единообразно.
- Нужно убедиться, что в Compose:
  - backend доступен как `backend:3001`,
  - frontend знает корректный URL.

Рекомендации:
1. Добавить в корневой `README` раздел:
   - Полный список env:
     - BACKEND_PORT
     - BACKEND_URL
     - NEXT_PUBLIC_API_URL
     - OPENAI_API_KEY / OPENROUTER_API_KEY
     - BOT_TOKEN
2. Проверить и синхронизировать `docker-compose*`:
   - healthchecks.
   - restart policy.

---

## 8. Приоритетный план улучшений

Список отсортирован по практической ценности и риску.

1) API и контракты:
- Унифицировать формат ответов во всех эндпоинтах.
- Привести фронт, бэк и бота к согласованным маршрутам:
  - Зафиксировать, какие legacy эндпоинты официально поддерживаются.
  - Для wizard — добавить документацию.

2) Безопасность и конфигурация:
- Ограничить CORS production-доменами.
- Убрать dummy ключ в prod.
- Добавить `helmet` и базовый rate limiting для AI-роутов.
- Документировать переменные окружения.

3) Надёжность:
- Исправить баг в [`apiClient.exportSession()`](frontend/src/services/apiClient.js:156) — использовать `getBaseURL()`.
- Добавить ограничения длин входных полей и размерностей данных.
- В будущем: вынести сессии и проекты в персистентный стор.

4) Поддерживаемость фронтенда:
- Разбить [`index.js`](frontend/src/pages/index.js:1) на:
  - `pages/index.js` (обвязка)
  - `hooks/useWizardSession.js`
  - `components/wizard/StepX.js`.
- Объединить API-клиенты или чётко развести их области применения.

5) Тесты и качество:
- Добавить unit-тесты для:
  - QuestionService
  - PromptLoader
  - SessionService / ProjectService
  - AIService (через mock OpenAI/OpenRouter клиента)
- Настроить общий ESLint + Prettier.

6) Telegram Bot:
- Синхронизировать с актуальной моделью (wizard или legacy).
- Добавить человекочитаемые сообщения об ошибках и базовый retry.

---

## 9. Итоговая оценка

В целом:
- Архитектура проекта продуманная, ориентирована на реальный user flow и удобство работы с AI.
- Код читаемый, с понятными сущностями и хорошими комментариями.
- Главные проблемы:
  - Несогласованность и дублирование API-клиентов.
  - Неполная синхронизация wizard/legacy-эндпоинтов.
  - Отсутствие тестов и минимальной production-защиты (CORS, rate limit, персистентность).

Проект готов к использованию как MVP и может быть доведён до production-уровня с относительно небольшим количеством целевых улучшений, перечисленных выше.