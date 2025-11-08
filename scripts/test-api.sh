#!/bin/bash

# Скрипт для тестирования API эндпоинтов

API_URL="http://localhost:3001"

echo "🧪 Тестирование API эндпоинтов..."
echo ""

# Test 1: Health check
echo "1. Проверка health endpoint..."
curl -s "$API_URL/health" | jq .
echo ""

# Test 2: Analyze idea
echo "2. Тестирование analyze-idea..."
RESPONSE=$(curl -s -X POST "$API_URL/api/analyze-idea" \
  -H "Content-Type: application/json" \
  -d '{"idea":"Создать простое приложение для учета расходов с категоризацией"}')

PROJECT_ID=$(echo $RESPONSE | jq -r '.data.projectId')

if [ "$PROJECT_ID" != "null" ]; then
    echo "✓ Проект создан: $PROJECT_ID"
    echo ""
    
    # Test 3: Generate plan
    echo "3. Тестирование generate-plan..."
    curl -s -X POST "$API_URL/api/generate-plan" \
      -H "Content-Type: application/json" \
      -d "{\"projectId\":\"$PROJECT_ID\"}" | jq .
    echo ""
    
    # Test 4: Get steps
    echo "4. Получение шагов проекта..."
    curl -s "$API_URL/api/steps/$PROJECT_ID" | jq .
    echo ""
else
    echo "❌ Ошибка создания проекта"
    echo $RESPONSE | jq .
fi

echo "✅ Тестирование завершено"

