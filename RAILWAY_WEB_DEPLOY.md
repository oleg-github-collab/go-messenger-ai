# Railway Деплой через Web Dashboard (Найпростіший Спосіб)

## Крок 1: Підготовка Git Репозиторію

Спочатку додамо hibernation-proxy до Git:

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"

# Додаємо файли до git
git add hibernation-proxy/
git add sleep-controller.sh
git add RAILWAY_*.md
git add HIBERNATION_*.md
git add СТАРТ_ТУТ.md

# Коміт
git commit -m "Add hibernation system with Railway proxy"

# Пуш (якщо є remote)
git push origin main
```

## Крок 2: Створення Проекту на Railway

### Варіант A: Деплой з GitHub (Рекомендовано)

1. **Відкрийте**: https://railway.app
2. **Увійдіть** через GitHub
3. Натисніть **"New Project"**
4. Виберіть **"Deploy from GitHub repo"**
5. Авторизуйте Railway доступ до вашого GitHub (якщо ще не зробили)
6. Виберіть репозиторій з messenger проектом
7. Railway автоматично виявить Node.js проект

### Варіант B: Деплой з Локальної Папки

Якщо репозиторій не на GitHub, використайте Railway CLI:

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"

# Відкрийте браузер для логіну
railway login

# Після успішного логіну:
railway init

# Введіть назву проекту:
# > hibernation-proxy

# Деплой
railway up
```

## Крок 3: Налаштування Root Directory

Якщо деплоїли весь репозиторій, а не тільки `hibernation-proxy`:

1. В Railway Dashboard → Ваш проект
2. **Settings** → **General**
3. Знайдіть **"Root Directory"**
4. Встановіть: `hibernation-proxy`
5. **Save Changes**

## Крок 4: Налаштування Environment Variables

1. В Railway Dashboard → Ваш проект
2. **Variables** (в лівому меню)
3. Натисніть **"+ New Variable"**
4. Додайте:

```
DO_API_TOKEN = YOUR_DIGITALOCEAN_API_TOKEN
```

5. **Add** → Railway автоматично передеплоїть

## Крок 5: Отримання Railway URL

1. В Railway Dashboard → Ваш проект
2. **Settings** → **Domains**
3. Ви побачите згенерований URL типу:
   ```
   hibernation-proxy-production-abc123.up.railway.app
   ```
4. Скопіюйте його

## Крок 6: Перевірка Health Check

Відкрийте в браузері або curl:

```bash
curl https://ваш-railway-url.up.railway.app/health
```

Очікуваний результат:
```json
{
  "status": "ok",
  "service": "hibernation-proxy",
  "timestamp": 1759864868,
  "uptime": 123.45
}
```

## Крок 7: Додавання Custom Domains

### В Railway Dashboard:

1. **Settings** → **Domains**
2. Натисніть **"+ Custom Domain"**
3. Введіть: `messenger.kaminskyi.chat`
4. Railway покаже CNAME запис для DNS
5. Повторіть для `turn.kaminskyi.chat`

### В CloudFlare DNS:

1. Відкрийте https://dash.cloudflare.com
2. Виберіть домен `kaminskyi.chat`
3. **DNS** → **Records** → **Add record**

**Для messenger.kaminskyi.chat:**
- Type: `CNAME`
- Name: `messenger`
- Target: `ваш-railway-url.up.railway.app` (без https://)
- Proxy status: ❌ **DNS only** (ВАЖЛИВО! Сіра хмарка)
- TTL: Auto
- **Save**

**Для turn.kaminskyi.chat:**
- Type: `CNAME`
- Name: `turn`
- Target: `ваш-railway-url.up.railway.app` (той самий)
- Proxy status: ❌ **DNS only**
- TTL: Auto
- **Save**

**КРИТИЧНО:** Вимкніть CloudFlare proxy (хмарка має бути СІРА, не помаранчева)!

## Крок 8: Верифікація Custom Domain

Поверніться в Railway Dashboard:

1. **Settings** → **Domains**
2. Біля вашого custom domain має з'явитися зелена галочка ✓
3. Якщо ні, зачекайте 5-10 хвилин на DNS propagation

Перевірка:

```bash
# Перевірте DNS
dig messenger.kaminskyi.chat

# Має показувати CNAME на Railway

# Тест через custom domain
curl https://messenger.kaminskyi.chat/health
```

Якщо працює - перейдіть до наступного кроку.

## Крок 9: Моніторинг Логів

В Railway Dashboard:

1. **Deployments** (в лівому меню)
2. Виберіть останній deployment
3. **View Logs**

Або через CLI:

```bash
railway logs
```

## Крок 10: Встановлення Sleep Controller

Тепер встановимо Sleep Controller на дроплети:

### Messenger Droplet:

```bash
# 1. Завантажити скрипт
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.227.116.250:/usr/local/bin/sleep-controller.sh

# 2. Підключитись
ssh root@64.227.116.250

# 3. На дроплеті виконати:
chmod +x /usr/local/bin/sleep-controller.sh

# 4. Створити systemd service
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

# 5. Запустити
systemctl daemon-reload
systemctl enable sleep-controller.service
systemctl start sleep-controller.service

# 6. Перевірити
systemctl status sleep-controller.service

# 7. Переглянути логи
journalctl -u sleep-controller.service -f

# 8. Вийти
exit
```

### TURN Droplet:

```bash
# Те саме для TURN
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.226.72.235:/usr/local/bin/sleep-controller.sh

ssh root@64.226.72.235

# Виконати команди 3-8 з вище
```

## Крок 11: Повне Тестування

### Тест 1: Railway Health Check

```bash
curl https://messenger.kaminskyi.chat/api/health
```

Має повернути:
```json
{
  "status": "ready",
  "redis": true,
  "sfu": true,
  "uptime": 1179.34
}
```

### Тест 2: Wake-Up Flow

```bash
# 1. Вимкнути дроплет
ssh root@64.227.116.250 "shutdown -h now"

# 2. Зачекати 30 секунд
sleep 30

# 3. Відкрити в браузері
open https://messenger.kaminskyi.chat
```

Очікуваний результат:
1. Показується сторінка "Запуск сервера..."
2. Таймер зворотного відліку від 20 секунд
3. Прогрес-бар
4. Через ~15-20 секунд - автоматичний редирект
5. Сайт працює нормально

### Тест 3: Перевірка Логів

Railway:
```bash
railway logs | grep "Wake-up"
```

Sleep Controller:
```bash
ssh root@64.227.116.250 "journalctl -u sleep-controller -n 50"
```

### Тест 4: Автоматичне Засинання

1. Переконайтесь що на сайті немає активності
2. Зачекайте 1 годину (або змініть timeout для тесту)
3. Перевірте логи:

```bash
ssh root@64.227.116.250 "journalctl -u sleep-controller -f"
```

Має з'явитись:
```
🌙 INITIATING GRACEFUL SHUTDOWN
💾 Saving Redis data...
🛑 Stopping services gracefully...
💤 Going to sleep. Goodbye!
```

## Альтернатива: Railway CLI (Якщо Web не працює)

### 1. Встановлення Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Авторизація

```bash
railway login
```

Це відкриє браузер для OAuth авторизації.

### 3. Ініціалізація

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"
railway init
```

### 4. Встановлення Змінних

```bash
railway variables set DO_API_TOKEN=YOUR_DIGITALOCEAN_API_TOKEN
```

### 5. Деплой

```bash
railway up
```

### 6. Отримання URL

```bash
railway domain
```

### 7. Додавання Custom Domains

```bash
railway domain messenger.kaminskyi.chat
railway domain turn.kaminskyi.chat
```

## Troubleshooting

### Проблема: Railway не знаходить package.json

**Рішення:** Встановіть Root Directory в Settings → General → `hibernation-proxy`

### Проблема: Build fails

**Рішення:** Перевірте логи в Deployments → View Logs. Переконайтесь що:
- `package.json` існує
- Node.js версія >= 18
- Всі залежності доступні

### Проблема: Custom domain не верифікується

**Рішення:**
1. Переконайтесь що CloudFlare proxy ВИМКНЕНИЙ (сіра хмарка)
2. Перевірте CNAME: `dig messenger.kaminskyi.chat`
3. Зачекайте 5-10 хвилин на DNS propagation
4. В Railway Settings → Domains → натисніть "Verify"

### Проблема: 502 Bad Gateway

**Рішення:**
1. Перевірте що сервер запустився: Railway Logs
2. Перевірте health check: `/health` endpoint
3. Перевірте environment variables: `DO_API_TOKEN` встановлений

### Проблема: Дроплет не прокидається

**Рішення:**
1. Перевірте Railway logs: `railway logs | grep Wake`
2. Перевірте DO API token
3. Тест вручну:
```bash
curl -H "Authorization: Bearer dop_v1_..." \
  https://api.digitalocean.com/v2/droplets/522123497
```

## Моніторинг

### Railway Dashboard:

1. **Metrics** - CPU, Memory, Network usage
2. **Deployments** - History та logs
3. **Observability** - Detailed metrics

### Railway CLI:

```bash
# Логи в реальному часі
railway logs

# Останні 100 рядків
railway logs --tail 100

# Статус
railway status

# Відкрити dashboard
railway open
```

## Вартість

Railway Free Tier включає:
- ✅ 500 годин/місяць ($5 кредиту)
- ✅ Необмежені deployments
- ✅ Custom domains
- ✅ HTTPS автоматично
- ✅ Достатньо для цього проекту

Ваш proxy буде використовувати:
- ~50MB RAM
- Мінімальне CPU
- **Вартість: $0/місяць** (в межах free tier)

## Підсумок

✅ **Що ви зробили:**
1. Створили проект на Railway
2. Налаштували environment variables
3. Додали custom domains
4. Налаштували DNS в CloudFlare
5. Встановили sleep controller на дроплети
6. Протестували wake-up flow

✅ **Результат:**
- 💰 Економія $230/рік
- 🌙 Автоматичне засинання
- 🌅 Прокидання за 15-20 сек
- 📊 Повний моніторинг

**Система працює! 🚀**

## Наступні Кроки

1. Моніторте логи перші 24 години
2. Налаштуйте idle timeout під ваші потреби
3. Перевірте DigitalOcean billing наприкінці місяця
4. Насолоджуйтесь економією!

---

**Час деплою**: ~15 хвилин через web dashboard
**Складність**: Дуже проста (без CLI взагалі)
**Підтримка**: https://railway.app/help
