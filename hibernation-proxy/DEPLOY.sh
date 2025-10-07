#!/bin/bash

# Railway Hibernation Proxy - Quick Deploy Script
# Виконайте цей скрипт для швидкого деплойменту

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Railway Hibernation Proxy - Деплой"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Перевірка Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI не встановлений"
    echo "Встановіть командою: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI встановлений"

# Перевірка авторизації
if ! railway whoami &> /dev/null; then
    echo ""
    echo "🔐 Потрібна авторизація в Railway"
    echo "Відкриється браузер для логіну..."
    railway login
fi

echo "✅ Авторизовані в Railway"

# Ініціалізація проекту (якщо ще не ініціалізовано)
if [ ! -f ".railway" ]; then
    echo ""
    echo "📋 Ініціалізація Railway проекту..."
    railway init --name hibernation-proxy
else
    echo "✅ Railway проект вже ініціалізовано"
fi

# Встановлення змінних оточення
echo ""
echo "🔧 Налаштування змінних оточення..."
railway variables set DO_API_TOKEN=YOUR_DIGITALOCEAN_API_TOKEN

# Деплой
echo ""
echo "📦 Деплой на Railway..."
railway up --detach

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Деплой завершено!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Отримання URL
echo "📡 Отримання Railway URL..."
RAILWAY_URL=$(railway domain 2>&1 | head -1)
echo ""
echo "🌐 Railway URL: $RAILWAY_URL"
echo ""

# Інструкції для custom domain
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Наступні кроки:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Додати custom domains:"
echo "   railway domain messenger.kaminskyi.chat"
echo "   railway domain turn.kaminskyi.chat"
echo ""
echo "2. Налаштувати DNS в CloudFlare:"
echo "   - Type: CNAME"
echo "   - Name: messenger"
echo "   - Target: [Railway URL без https://]"
echo "   - Proxy: ❌ DNS only (ВАЖЛИВО!)"
echo ""
echo "3. Перевірити деплой:"
echo "   curl $RAILWAY_URL/health"
echo ""
echo "4. Переглянути логи:"
echo "   railway logs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
