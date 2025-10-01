# 🚂 Railway Setup Instructions

## Швидке налаштування (5 хвилин)

### 1. Додайте Environment Variables

Перейдіть в Railway Dashboard → Your Project → Variables і додайте:

```bash
TURN_HOST=157.245.20.158
TURN_USERNAME=kaminskyi-25a04450ce8b905b
TURN_PASSWORD=Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu
```

**Важливо**: `REDIS_URL` Railway додасть автоматично після підключення Redis.

### 2. Підключіть Redis

1. В Railway Dashboard натисніть "+ New"
2. Виберіть "Database" → "Redis"
3. Railway автоматично створить `REDIS_URL`

### 3. Push код на GitHub

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"

# Спробуйте push (якщо SSH не працює, див. нижче)
git push origin main
```

**Якщо SSH не працює:**
```bash
# Використайте HTTPS
git remote set-url origin https://github.com/oleg-github-collab/go-messenger-ai.git
git push origin main
```

Railway автоматично задеплоїть після push.

---

## ✅ Перевірка після деплою

### 1. Перевірте URL
Railway дасть вам URL типу: `https://your-app.railway.app`

### 2. Протестуйте login
Перейдіть на: `https://your-app.railway.app/login`

Credentials:
- Username: `Oleh`
- Password: `QwertY24$`

### 3. Перевірте TURN server

Відвідайте: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

Додайте TURN server:
- **TURN URI**: `turn:157.245.20.158:3478`
- **Username**: `kaminskyi-25a04450ce8b905b`
- **Credential**: `Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu`

Натисніть **"Gather candidates"**

Якщо бачите `relay` candidates - TURN працює! ✅

---

## 🎯 Що працює після деплою

✅ **1-на-1 дзвінки** (P2P)
- Host створює meeting
- Гість приєднується через share link
- Waiting room з approval
- Камера, мікрофон, chat

✅ **Групові дзвінки** (SFU)
- До 20 учасників
- Grid layout (авто-адаптується)
- Adaptive bitrate
- TURN relay для NAT traversal

---

## 🐛 Troubleshooting

### Railway не деплоїть?
1. Перевірте Build Logs в Railway
2. Переконайтесь що `go.mod` і `main.go` є в root
3. Railway використовує Nixpacks для Go проектів

### Не можу залогінитись?
Credentials:
- Username: `Oleh`
- Password: `QwertY24$`

### TURN не працює?
```bash
# Перевірте на сервері
ssh root@157.245.20.158
systemctl status coturn
journalctl -u coturn -f
```

### Дзвінки не з'єднуються?
1. Перевірте Browser Console (F12)
2. Подивіться на WebSocket з'єднання
3. Переконайтесь що TURN credentials в Railway

---

## 💡 Корисні команди

### Restart Railway app:
```bash
# В Railway Dashboard → Settings → Restart
```

### Check logs:
```bash
# В Railway Dashboard → View Logs
```

### Test locally:
```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"

# Set env vars
export REDIS_URL="redis://localhost:6379"
export TURN_HOST="157.245.20.158"
export TURN_USERNAME="kaminskyi-25a04450ce8b905b"
export TURN_PASSWORD="Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu"

# Run
go run main.go

# Visit http://localhost:8080
```

---

## 📞 Потрібна допомога?

Всі credentials в файлі: `DEPLOYMENT_SUMMARY.md`

**Хороших дзвінків! 🎉**
