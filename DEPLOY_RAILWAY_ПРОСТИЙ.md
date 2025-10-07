# 🚀 Деплой на Railway - Найпростіший Спосіб (Без CLI!)

## Метод 1: Drag & Drop (5 хвилин) ⭐ НАЙПРОСТІШЕ

### 1. Відкрийте Railway

Перейдіть на https://railway.app

### 2. Увійдіть

Натисніть **"Login"** → **"Login with GitHub"**

### 3. Створіть Проект

1. Натисніть **"New Project"**
2. Виберіть **"Empty Project"**
3. Назвіть проект: `hibernation-proxy`

### 4. Завантажте Код

**Варіант A: Через Git (Рекомендовано)**

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"

# Ініціалізація git репозиторію (якщо ще немає)
git init
git add .
git commit -m "Add hibernation system"

# Створіть репозиторій на GitHub
# Потім:
git remote add origin https://github.com/ВАШ_USERNAME/go-messenger.git
git push -u origin main
```

Тепер в Railway:
1. В проекті натисніть **"+ New"**
2. Виберіть **"GitHub Repo"**
3. Авторизуйте Railway (якщо потрібно)
4. Виберіть ваш репозиторій
5. Railway почне деплой

**Варіант B: Локальний деплой (потрібен Railway CLI)**

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"
railway login
railway link  # Прив'яжіть до проекту
railway up
```

### 5. Налаштуйте Root Directory (Тільки якщо деплоїли весь репозиторій)

1. В Railway → Ваш сервіс
2. **Settings** → **Service Settings**
3. **Root Directory**: `hibernation-proxy`
4. **Deploy**

### 6. Додайте Environment Variable

1. В Railway → **Variables**
2. Натисніть **"+ New Variable"**
3. Введіть:
   - Name: `DO_API_TOKEN`
   - Value: `YOUR_DIGITALOCEAN_API_TOKEN`
4. Натисніть **"Add"**

Railway автоматично передеплоїть проект.

### 7. Отримайте Public URL

1. **Settings** → **Networking**
2. Натисніть **"Generate Domain"**
3. Скопіюйте URL (типу `hibernation-proxy-production-abc123.up.railway.app`)

### 8. Перевірте Health Check

Відкрийте в браузері:
```
https://ваш-railway-url.up.railway.app/health
```

Має показати:
```json
{
  "status": "ok",
  "service": "hibernation-proxy",
  "uptime": 123.45
}
```

### 9. Додайте Custom Domains

#### В Railway:

1. **Settings** → **Networking** → **Custom Domains**
2. Натисніть **"+ Add Domain"**
3. Введіть: `messenger.kaminskyi.chat`
4. Railway покаже CNAME для DNS
5. Повторіть для `turn.kaminskyi.chat`

#### В CloudFlare:

1. Відкрийте https://dash.cloudflare.com
2. Виберіть `kaminskyi.chat`
3. **DNS** → **Add record**

**Messenger:**
- Type: **CNAME**
- Name: `messenger`
- Target: `ваш-railway-url.up.railway.app`
- Proxy: ❌ **DNS only** (СІРА хмарка!)
- Save

**TURN:**
- Type: **CNAME**
- Name: `turn`
- Target: `ваш-railway-url.up.railway.app`
- Proxy: ❌ **DNS only**
- Save

### 10. Готово! ✅

Перевірте:
```bash
curl https://messenger.kaminskyi.chat/api/health
```

---

## Метод 2: Railway CLI (Альтернатива)

### 1. Встановіть Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Авторизуйтесь

```bash
railway login
```

Відкриється браузер для OAuth.

### 3. Деплой

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"

# Створити проект
railway init

# Встановити змінну
railway variables set DO_API_TOKEN=YOUR_DIGITALOCEAN_API_TOKEN

# Деплой
railway up

# Отримати URL
railway domain
```

### 4. Додати Custom Domains

```bash
railway domain messenger.kaminskyi.chat
railway domain turn.kaminskyi.chat
```

Потім налаштуйте DNS в CloudFlare (як вище).

---

## Що Далі?

### Встановіть Sleep Controller на Дроплети

```bash
# Messenger
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.227.116.250:/usr/local/bin/

ssh root@64.227.116.250
chmod +x /usr/local/bin/sleep-controller.sh

cat > /etc/systemd/system/sleep-controller.service << 'EOF'
[Unit]
Description=Droplet Sleep Controller
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sleep-controller.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable sleep-controller
systemctl start sleep-controller
systemctl status sleep-controller
exit
```

Повторіть для TURN дроплета (IP: 64.226.72.235).

---

## Тестування

### 1. Health Check Railway

```bash
curl https://ваш-railway-url.up.railway.app/health
```

### 2. Health через Custom Domain

```bash
curl https://messenger.kaminskyi.chat/api/health
```

### 3. Wake-Up Test

```bash
# Вимкнути дроплет
ssh root@64.227.116.250 "shutdown -h now"

# Зачекати 30 сек
sleep 30

# Відкрити в браузері
open https://messenger.kaminskyi.chat
```

Має показати сторінку "Запуск сервера..." → через 15-20 сек завантажиться.

---

## Моніторинг

### Railway Dashboard

1. **Deployments** → **View Logs**
2. **Metrics** → CPU, Memory, Network

### Railway CLI

```bash
railway logs
railway status
```

### Sleep Controller

```bash
ssh root@64.227.116.250 "journalctl -u sleep-controller -f"
```

---

## Troubleshooting

**Railway не деплоїться:**
- Перевірте логи: Deployments → View Logs
- Перевірте package.json існує
- Перевірте Node.js >= 18

**Custom domain не працює:**
- CloudFlare proxy має бути ВИМКНЕНИЙ (сіра хмарка)
- Зачекайте 5-10 хвилин
- Перевірте: `dig messenger.kaminskyi.chat`

**502 Bad Gateway:**
- Перевірте Railway логи
- Перевірте DO_API_TOKEN встановлений
- Перевірте /health endpoint

---

## ✅ Результат

- 💰 Економія $230/рік
- 🌙 Автоматичне засинання
- 🌅 Прокидання за 15-20 сек
- 📊 Повний моніторинг

**Готово! Система працює! 🚀**

---

**Час**: 10-15 хвилин через web
**Складність**: Дуже просто
**Вартість**: $0 (Railway free tier)
