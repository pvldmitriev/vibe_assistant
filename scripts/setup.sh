#!/bin/bash

# Скрипт первоначальной настройки проекта

echo "🚀 Настройка Vibe Assistant..."

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "📝 Создание .env файла из .env.example..."
    cp .env.example .env
    echo "⚠️  Не забудьте добавить ваш OPENAI_API_KEY в .env файл!"
else
    echo "✓ .env файл уже существует"
fi

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker для продолжения."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose для продолжения."
    exit 1
fi

echo "✓ Docker и Docker Compose установлены"

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "Следующие шаги:"
echo "1. Отредактируйте .env и добавьте ваш OPENAI_API_KEY"
echo "2. Запустите приложение: npm run dev"
echo ""

