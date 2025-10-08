#!/bin/bash

# Railway Deployment Script for Hibernation Proxy
# This script will create and configure Railway service correctly

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Railway Hibernation Proxy Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Не авторизовані в Railway"
    echo ""
    echo "Виконайте спочатку:"
    echo "  railway login"
    echo ""
    exit 1
fi

echo "✅ Авторизовані в Railway"
echo ""

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "📁 Робоча директорія: $SCRIPT_DIR"
echo ""

# Check if already linked to a project
if railway status &> /dev/null; then
    echo "⚠️  Вже прив'язано до проекту Railway"
    echo ""
    read -p "Створити новий проект? (y/n): " CREATE_NEW
    if [[ $CREATE_NEW != "y" ]]; then
        echo "Використовуємо існуючий проект..."
    else
        echo "Створюємо новий проект..."
        railway init --name "hibernation-proxy"
    fi
else
    echo "📋 Створюємо новий Railway проект..."
    railway init --name "hibernation-proxy"
fi

echo ""
echo "✅ Проект створено/прив'язано"
echo ""

# Set environment variables
echo "🔧 Налаштування змінних оточення..."
railway variables set DO_API_TOKEN="YOUR_DIGITALOCEAN_API_TOKEN"

echo "✅ Змінні встановлено"
echo ""

# Deploy
echo "📦 Деплой на Railway..."
railway up --detach

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Деплой завершено!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for deployment
echo "⏳ Очікуємо завершення деплою (30 секунд)..."
sleep 30

# Get domain
echo ""
echo "🌐 Отримання Railway URL..."
RAILWAY_URL=$(railway domain 2>&1 | grep -o 'https://[^ ]*' | head -1)

if [ -z "$RAILWAY_URL" ]; then
    echo "📡 Railway URL ще генерується..."
    echo ""
    echo "Виконайте через хвилину:"
    echo "  railway domain"
else
    echo "✅ Railway URL: $RAILWAY_URL"
    echo ""

    # Test health check
    echo "🏥 Перевірка health endpoint..."
    sleep 5

    if curl -s "${RAILWAY_URL}/health" | grep -q "ok"; then
        echo "✅ Health check пройдено!"
        echo ""
        curl -s "${RAILWAY_URL}/health" | python3 -m json.tool
    else
        echo "⏳ Сервіс ще запускається..."
        echo "Перевірте через хвилину:"
        echo "  curl ${RAILWAY_URL}/health"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Наступні кроки:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Додати custom domain:"
echo "   railway domain messenger.kaminskyi.chat"
echo ""
echo "2. Налаштувати CNAME в CloudFlare:"
echo "   - Type: CNAME"
echo "   - Name: messenger"
echo "   - Target: [Railway URL без https://]"
echo "   - Proxy: ❌ DNS only"
echo ""
echo "3. Переглянути логи:"
echo "   railway logs"
echo ""
echo "4. Відкрити dashboard:"
echo "   railway open"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
