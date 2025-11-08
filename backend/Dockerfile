# Multi-stage build для оптимизации размера образа

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN npm install --production

# Stage 2: Production
FROM node:18-alpine AS runner
WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressuser

# Копируем node_modules из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules

# Копируем исходный код
COPY . .

# Копируем промпты (важно для production)
COPY prompts/ ./prompts/

# Устанавливаем права
RUN chown -R expressuser:nodejs /app

USER expressuser

EXPOSE 3001

ENV NODE_ENV=production
ENV BACKEND_PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]

