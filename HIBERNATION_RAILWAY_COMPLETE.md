# ✅ Система Гібернації на Railway - Готово до Деплойменту

## Що Було Створено

### 1. Railway Proxy Server (Node.js/Express)
- **Файл**: `hibernation-proxy/server.js` (15KB, 500+ рядків)
- **Функціонал**:
  - ✅ Перевірка статусу дроплетів через DigitalOcean API
  - ✅ Автоматичне прокидання (power_on) через DO API
  - ✅ Health check моніторинг
  - ✅ Проксіювання всіх запитів
  - ✅ Красива сторінка завантаження з таймером
  - ✅ Кешування статусу (10 секунд)
  - ✅ Підтримка множинних дроплетів
  - ✅ Детальне логування

### 2. Package Configuration
- **Файл**: `hibernation-proxy/package.json`
- **Залежності**:
  - `express` - Web server
  - `axios` - HTTP client для DO API
  - `node-cache` - In-memory кешування

### 3. Deploy Script
- **Файл**: `hibernation-proxy/DEPLOY.sh`
- **Функціонал**: Автоматичний деплой одною командою

### 4. Documentation
- **Файл**: `RAILWAY_DEPLOYMENT_GUIDE.md` (18KB)
  - Повна інструкція крок за кроком
  - Налаштування DNS
  - Troubleshooting
  - Моніторинг

- **Файл**: `RAILWAY_DEPLOY_COMMANDS.md` (11KB)
  - Готові команди для копіювання
  - Чеклист виконання
  - Корисні команди

- **Файл**: `hibernation-proxy/README.md` (4KB)
  - Опис проекту
  - Quick start
  - Configuration

### 5. Sleep Controller (Без змін)
- **Файл**: `sleep-controller.sh`
- Готовий до встановлення на дроплети

### 6. Health Check Endpoint (Вже Задеплоєно)
- **Endpoint**: `https://messenger.kaminskyi.chat/api/health`
- **Статус**: ✅ Працює
- **Відповідь**:
  ```json
  {
    "status": "ready",
    "redis": true,
    "sfu": true,
    "uptime": 150.84,
    "timestamp": 1759863839
  }
  ```

## Структура Проекту

```
hibernation-proxy/
├── server.js           # Основний код проксі
├── package.json        # NPM конфігурація
├── .gitignore         # Git ignore правила
├── .env.example       # Приклад змінних оточення
├── DEPLOY.sh          # Скрипт швидкого деплойменту
└── README.md          # Документація проекту
```

## Швидкий Старт

### Варіант 1: Автоматичний Деплой

```bash
# 1. Перейти в директорію
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"

# 2. Виконати скрипт деплойменту
./DEPLOY.sh
```

Скрипт автоматично:
- ✅ Перевірить Railway CLI
- ✅ Авторизує (відкриє браузер)
- ✅ Створить проект
- ✅ Встановить змінні оточення
- ✅ Задеплоїть на Railway
- ✅ Покаже Railway URL

### Варіант 2: Ручний Деплой

```bash
# 1. Авторизація
railway login

# 2. Ініціалізація
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"
railway init

# 3. Змінні оточення
railway variables set DO_API_TOKEN=YOUR_DIGITALOCEAN_API_TOKEN

# 4. Деплой
railway up

# 5. Отримати URL
railway domain
```

## Налаштування Custom Domains

### 1. Додати домени в Railway

```bash
railway domain messenger.kaminskyi.chat
railway domain turn.kaminskyi.chat
```

### 2. Налаштувати DNS в CloudFlare

1. Відкрийте https://dash.cloudflare.com
2. Виберіть `kaminskyi.chat`
3. DNS → Add record

**Messenger:**
- Type: `CNAME`
- Name: `messenger`
- Target: `[ваш-railway-url].up.railway.app` (без https://)
- Proxy: **❌ DNS only** (сіра хмарка)
- Save

**TURN:**
- Type: `CNAME`
- Name: `turn`
- Target: `[ваш-railway-url].up.railway.app` (той самий)
- Proxy: **❌ DNS only**
- Save

### 3. Зачекати DNS Propagation

```bash
# Перевірка DNS (може зайняти 5-10 хвилин)
dig messenger.kaminskyi.chat

# Має показувати CNAME на Railway
```

## Встановлення Sleep Controller на Дроплети

### Messenger Droplet

```bash
# Завантажити скрипт
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.227.116.250:/usr/local/bin/sleep-controller.sh

# Підключитись та налаштувати
ssh root@64.227.116.250

# На дроплеті:
chmod +x /usr/local/bin/sleep-controller.sh

cat > /etc/systemd/system/sleep-controller.service << 'EOF'
[Unit]
Description=Droplet Sleep Controller
After=network.target messenger.service redis-server.service

[Service]
Type=simple
ExecStart=/usr/local/bin/sleep-controller.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sleep-controller.service
systemctl start sleep-controller.service
systemctl status sleep-controller.service

# Вийти
exit
```

### TURN Droplet

```bash
# Те саме для TURN
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.226.72.235:/usr/local/bin/sleep-controller.sh

ssh root@64.226.72.235
# ... виконати ті самі команди
```

## Тестування Системи

### Тест 1: Railway Health Check

```bash
# Отримати Railway URL
railway domain

# Перевірити health
curl https://[ваш-url].up.railway.app/health

# Очікуваний результат:
{
  "status": "ok",
  "service": "hibernation-proxy",
  "timestamp": 1759863702,
  "uptime": 123.45
}
```

### Тест 2: Custom Domain

```bash
curl https://messenger.kaminskyi.chat/api/health

# Має повернути той самий JSON що і дроплет
```

### Тест 3: Wake-Up Flow

```bash
# 1. Вимкнути дроплет
ssh root@64.227.116.250 "shutdown -h now"

# 2. Зачекати 30 секунд
sleep 30

# 3. Відкрити в браузері або curl
curl https://messenger.kaminskyi.chat

# Очікуваний результат:
# - HTML сторінка "Запуск сервера..."
# - Таймер зворотного відліку
# - Через ~20 секунд - автоматичний редирект
```

### Тест 4: Автоматичне Засинання

```bash
# Перегляд логів sleep controller
ssh root@64.227.116.250 "journalctl -u sleep-controller.service -f"

# Через 1 годину неактивності побачите:
# 🌙 INITIATING GRACEFUL SHUTDOWN
# 💾 Saving Redis data...
# 🛑 Stopping services gracefully...
# 💤 Going to sleep. Goodbye!
```

## Моніторинг

### Railway Logs

```bash
# Реальний час
railway logs

# Останні 100 рядків
railway logs --tail 100

# Фільтр по тексту
railway logs | grep "Wake-up"
```

### Railway Dashboard

```bash
# Відкрити dashboard в браузері
railway open
```

Там побачите:
- 📊 Metrics (CPU, Memory, Network)
- 📋 Deployments history
- 📝 Real-time logs
- ⚙️ Settings & domains

### Sleep Controller Logs

```bash
# Messenger
ssh root@64.227.116.250 "journalctl -u sleep-controller -n 50"

# TURN
ssh root@64.226.72.235 "journalctl -u sleep-controller -n 50"
```

## Архітектура Системи

```
User Request (https://messenger.kaminskyi.chat)
    ↓
CloudFlare DNS
    ↓ (CNAME)
Railway Proxy Server (Always On, $0/month)
    ↓
    1. Check Droplet Status (DigitalOcean API)
    ↓
    ├─→ If OFF:
    │   ├─→ Send power_on command
    │   ├─→ Show loading page to user
    │   ├─→ Wait for health check (max 2 min)
    │   └─→ Proxy request when ready
    │
    ├─→ If ACTIVE:
    │   ├─→ Check health endpoint
    │   ├─→ If healthy: Proxy request
    │   └─→ If not ready: Show loading page
    │
    └─→ If STARTING:
        └─→ Show loading page, retry
    ↓
Droplet (64.227.116.250)
    ↓
Application (Go Messenger)
    ↓
Response to User

On Droplet:
    ↓
Sleep Controller (Systemd Service)
    ↓
Monitor Every 5 Minutes:
    - Network connections
    - Redis sessions
    - Service status
    ↓
If Idle > 1 Hour:
    ↓
    1. Save Redis data (SAVE)
    2. Stop messenger service
    3. Stop nginx service
    4. Create wake marker
    5. Shutdown droplet
```

## Вартість і Економія

### До Гібернації:
- **DigitalOcean**: 2 дроплети × $12/міс = **$24/міс**
- **Загалом**: **$24/міс** ($288/рік)

### З Гібернацією:
- **Railway Proxy**: $0/міс (free tier 500 годин)
- **DigitalOcean** (20% uptime): 2 × $2.40/міс = **$4.80/міс**
- **Загалом**: **$4.80/міс** ($57.60/рік)

### Економія:
- **На місяць**: $19.20 (80%)
- **На рік**: $230.40 (80%)

### Різні Сценарії:

| Сценарій | Uptime | Вартість/міс | Економія |
|----------|--------|--------------|----------|
| Розробка (мало трафіку) | 20% | $4.80 | $19.20 (80%) |
| Тестування | 40% | $9.60 | $14.40 (60%) |
| Пре-продакшн | 60% | $14.40 | $9.60 (40%) |
| Легкий продакшн | 80% | $19.20 | $4.80 (20%) |
| Повний продакшн | 100% | $24.00 | $0 (0%) |

**Висновок**: Ідеально для розробки та тестування!

## Налаштування Idle Timeout

За замовчуванням: **1 година** неактивності

Щоб змінити:

```bash
ssh root@64.227.116.250
nano /usr/local/bin/sleep-controller.sh

# Знайти:
IDLE_TIMEOUT=3600

# Змінити на:
IDLE_TIMEOUT=7200   # 2 години
IDLE_TIMEOUT=1800   # 30 хвилин
IDLE_TIMEOUT=300    # 5 хвилин (для тестів)

# Зберегти (Ctrl+O, Enter, Ctrl+X)
systemctl restart sleep-controller.service
exit
```

## Безпека

✅ **Що Захищено:**
- DO API токен зберігається тільки в Railway environment variables
- Не експонується в коді або логах
- HTTPS автоматично через Railway
- Headers правильно форвардяться (X-Forwarded-For, X-Real-IP)
- Health endpoint публічний але без sensitive data

✅ **Best Practices:**
- Sleep controller запускається як systemd service (auto-restart)
- Redis SAVE перед shutdown (збереження даних)
- Graceful shutdown сервісів
- Wake marker для audit trail
- Детальне логування всіх операцій

## Rollback Plan

Якщо щось піде не так:

### Видалити Railway Деплой:

```bash
railway delete
```

### Вимкнути Sleep Controller:

```bash
# На обох дроплетах
ssh root@64.227.116.250 "systemctl stop sleep-controller && systemctl disable sleep-controller"
ssh root@64.226.72.235 "systemctl stop sleep-controller && systemctl disable sleep-controller"
```

### Повернути DNS:

В CloudFlare змінити CNAME назад на A records з прямими IP.

## Troubleshooting

### Railway не стартує:

```bash
# Перегляд логів
railway logs

# Перевірка змінних
railway variables

# Перезапуск
railway up --detach
```

### DNS не резолвиться:

```bash
# Перевірка DNS
dig messenger.kaminskyi.chat

# Має показувати CNAME на Railway
# Якщо ні - перевірте CloudFlare DNS settings
```

### Дроплет не прокидається:

```bash
# Railway логи
railway logs | grep "Wake"

# Перевірка DO API
curl -H "Authorization: Bearer dop_v1_..." \
  https://api.digitalocean.com/v2/droplets/522123497
```

### Sleep Controller не працює:

```bash
ssh root@64.227.116.250 "systemctl status sleep-controller"
ssh root@64.227.116.250 "journalctl -u sleep-controller -n 100"
```

## Чеклист Деплойменту

- [ ] 1. Встановлено Railway CLI
- [ ] 2. Авторизовані в Railway (`railway login`)
- [ ] 3. Ініціалізовано проект (`railway init`)
- [ ] 4. Встановлено DO_API_TOKEN (`railway variables set`)
- [ ] 5. Задеплоєно на Railway (`railway up`)
- [ ] 6. Отримано Railway URL (`railway domain`)
- [ ] 7. Додано custom domains в Railway
- [ ] 8. Налаштовано CNAME в CloudFlare
- [ ] 9. Перевірено health endpoint Railway
- [ ] 10. Перевірено health endpoint через custom domain
- [ ] 11. Встановлено sleep-controller на messenger дроплет
- [ ] 12. Встановлено sleep-controller на TURN дроплет
- [ ] 13. Протестовано wake-up flow
- [ ] 14. Налаштовано idle timeout (опціонально)
- [ ] 15. Перевірено логи Railway
- [ ] 16. Перевірено логи sleep-controller
- [ ] 17. Протестовано автоматичне засинання
- [ ] 18. Моніторинг перші 24 години

## Статус Системи

### ✅ Готово:
- Railway proxy server (Node.js/Express)
- Package configuration (package.json)
- Deploy script (DEPLOY.sh)
- Complete documentation (3 detailed guides)
- Health check endpoint (deployed on droplet)
- Sleep controller script (ready for installation)

### ⏳ Потрібно Виконати:
1. Railway login та deploy (~5 хвилин)
2. DNS configuration в CloudFlare (~2 хвилини)
3. Sleep controller installation на дроплети (~10 хвилин)
4. Testing (~5 хвилин)

**Загальний час**: ~25 хвилин

## Підсумок

✅ **Система повністю готова до деплойменту**

**Переваги Railway над CloudFlare Worker:**
- ✅ Простіше налаштування (Railway CLI)
- ✅ Краща підтримка проксіювання
- ✅ Зрозуміліші логи
- ✅ Node.js замість Workers JS API
- ✅ Локальне тестування (npm run dev)
- ✅ Безкоштовний tier більш ніж достатній

**Очікувані Результати:**
- 🌙 Автоматичне засинання через 1 годину
- 🌅 Прокидання за 15-20 секунд
- 💰 Економія $230/рік на хостингу
- 📊 Повний моніторинг та логування
- 🔒 Безпечне зберігання API токенів

**Готово до старту!** 🚀

Виконайте команду:
```bash
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"
./DEPLOY.sh
```

Або слідуйте детальній інструкції в `RAILWAY_DEPLOYMENT_GUIDE.md`
