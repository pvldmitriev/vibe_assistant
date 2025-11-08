# Multi-stage build для Telegram бота

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --production

# Stage 2: Production
FROM node:18-alpine AS runner
WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 botuser

# Копируем node_modules
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Устанавливаем права
RUN chown -R botuser:nodejs /app

USER botuser

ENV NODE_ENV=production

CMD ["node", "bot.js"]

