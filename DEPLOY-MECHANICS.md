# Механіка Рекомпіляції, Редеплою та Рестарту Серверів

## Огляд Архітектури

### Сервери:
1. **Messenger Droplet** (64.227.116.250) - ID: 522123497
   - Основний Go-додаток
   - WebRTC SFU
   - Redis для сесій
   - Nginx reverse proxy (443 → 8080)
   - Systemd service: `messenger.service`

2. **TURN Droplet** (64.226.72.235) - ID: 522123449
   - Coturn TURN/STUN сервер
   - Для WebRTC з'єднань через NAT/Firewall

3. **Railway Proxy** (hibernation-proxy-production.up.railway.app)
   - Node.js проксі для пробудження дроплетів
   - Auto-deploy з GitHub при push до `main`
   - Folder: `hibernation-proxy/`

---

## Повна Механіка Deployment

### 1. ЛОКАЛЬНА РОЗРОБКА (MacOS)

#### a) Редагування коду:
```bash
cd /Users/olehkaminskyi/Desktop/go\ messenger
# Редагуємо файли: main.go, sfu/*.go, static/*.{html,js,css}
```

#### b) Локальне тестування:
```bash
# Запуск локально (НЕ для продакшну!)
go run main.go
# або
go build -o messenger && ./messenger
```

#### c) Видалення macOS атрибутів (КРИТИЧНО!):
```bash
# ОБОВ'ЯЗКОВО перед кожним білдом!
xattr -cr static/
```

---

### 2. БІЛД ДЛЯ LINUX (Cross-compilation)

#### a) Компіляція для Linux:
```bash
# Змінні середовища
export GOOS=linux
export GOARCH=amd64
export CGO_ENABLED=0

# Компіляція з оптимізацією
go build -o main -ldflags="-s -w" -trimpath .

# Перевірка файлу
file main
# Має показати: ELF 64-bit LSB executable, x86-64, static
```

**Параметри білду:**
- `-ldflags="-s -w"` - видаляє debug символи (зменшує розмір)
- `-trimpath` - видаляє повні шляхи (безпека)
- `CGO_ENABLED=0` - статична компіляція (без залежностей)

#### b) Перевірка embed файлів:
```bash
# Переконатися що статичні файли вбудовані
strings main | grep "role-preset-buttons"
# Має знайти: role-preset-buttons.css, role-preset-buttons.js
```

---

### 3. GIT COMMIT & PUSH

#### a) Стандартний workflow:
```bash
# Додати змінені файли
git add main.go sfu/ static/ hibernation-proxy/

# Commit з детальним описом
git commit -m "$(cat <<'EOF'
Опис змін

Технічні деталі:
- Що змінено
- Чому змінено
- Як це впливає

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push до GitHub
git push origin main
```

#### b) Auto-deploy Railway:
Railway автоматично:
1. Детектує зміни в `hibernation-proxy/`
2. Запускає `npm install`
3. Деплоїть новий контейнер
4. Оновлює проксі (0 downtime)

---

### 4. DEPLOY НА MESSENGER DROPLET

#### a) SCP файлу на сервер:
```bash
# Копіюємо скомпільований binary
scp -o StrictHostKeyChecking=no \
    main \
    root@64.227.116.250:/opt/messenger/main-new

# Альтернатива з timeout:
timeout 120 scp -o ConnectTimeout=30 \
    main \
    root@64.227.116.250:/opt/messenger/main-new
```

#### b) SSH на сервер і заміна binary:
```bash
ssh root@64.227.116.250

# Перевірка нового файлу
ls -lh /opt/messenger/main-new
file /opt/messenger/main-new

# КРИТИЧНО: Перевірка версії (якщо додано endpoint)
curl http://localhost:8080/api/health
# Має показати: {"status":"ready","version":"v1.1.0-role-presets-ui"}

# Backup старого binary
cp /opt/messenger/messenger /opt/messenger/messenger.backup

# Заміна binary
cp /opt/messenger/main-new /opt/messenger/messenger
chmod +x /opt/messenger/messenger

# Рестарт сервісу
systemctl restart messenger

# Перевірка статусу
systemctl status messenger

# Перевірка логів
journalctl -u messenger -f --lines=50
```

#### c) Перевірка що все працює:
```bash
# Health check
curl https://messenger.kaminskyi.chat/api/health

# WebSocket перевірка
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     https://messenger.kaminskyi.chat/ws

# Nginx статус
systemctl status nginx

# Redis статус
redis-cli ping
# Має відповісти: PONG
```

---

### 5. DEPLOY НА TURN DROPLET (якщо потрібно)

```bash
ssh root@64.226.72.235

# Перевірка Coturn
systemctl status coturn

# Рестарт якщо потрібно
systemctl restart coturn

# Перевірка портів
netstat -tulpn | grep 3478
netstat -tulpn | grep 5349
```

---

## Systemd Service Configuration

### Файл: `/etc/systemd/system/messenger.service`

```ini
[Unit]
Description=Go Messenger WebRTC Application
After=network.target redis.service nginx.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/messenger
ExecStart=/opt/messenger/messenger
Restart=always
RestartSec=10

# Environment
Environment="REDIS_URL=localhost:6379"
Environment="PORT=8080"

# Limits
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

### Команди systemd:
```bash
# Reload config після змін
systemctl daemon-reload

# Старт
systemctl start messenger

# Стоп
systemctl stop messenger

# Рестарт
systemctl restart messenger

# Статус
systemctl status messenger

# Автозапуск при boot
systemctl enable messenger

# Логи
journalctl -u messenger -f
```

---

## Nginx Configuration

### Файл: `/etc/nginx/sites-available/messenger`

```nginx
server {
    listen 443 ssl http2;
    server_name messenger.kaminskyi.chat;

    ssl_certificate /etc/letsencrypt/live/messenger.kaminskyi.chat/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/messenger.kaminskyi.chat/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Команди Nginx:
```bash
# Перевірка конфігу
nginx -t

# Reload (без downtime)
systemctl reload nginx

# Рестарт
systemctl restart nginx

# Логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Sleep Controller (Hibernation)

### Файл: `/usr/local/bin/sleep-controller.sh`

```bash
#!/bin/bash
# Auto-sleep після 1 години неактивності

IDLE_TIMEOUT=3600  # 1 година
CHECK_INTERVAL=300 # 5 хвилин

while true; do
    CONNECTIONS=$(netstat -an | grep :443 | grep ESTABLISHED | wc -l)

    if [ $CONNECTIONS -eq 0 ]; then
        echo "No connections, shutting down..."
        /usr/sbin/shutdown -h now
        exit 0
    fi

    sleep $CHECK_INTERVAL
done
```

### Systemd service: `/etc/systemd/system/sleep-controller.service`

```ini
[Unit]
Description=Droplet Sleep Controller
After=network.target messenger.service

[Service]
Type=simple
ExecStart=/usr/local/bin/sleep-controller.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Troubleshooting

### 1. Статичні файли не завантажуються (404)
```bash
# Причина: macOS extended attributes або файли не embed
xattr -cr static/
go build -o main -ldflags="-s -w" -trimpath .
strings main | grep -i "role-preset"  # Перевірка embed
```

### 2. Сервіс не стартує
```bash
journalctl -u messenger -n 100  # Останні 100 логів
systemctl status messenger
lsof -i :8080  # Чи зайнятий порт?
```

### 3. Nginx 502 Bad Gateway
```bash
curl http://localhost:8080/api/health  # Чи працює Go app?
systemctl status messenger
tail -f /var/log/nginx/error.log
```

### 4. Redis connection failed
```bash
redis-cli ping
systemctl status redis
redis-cli MONITOR  # Дивитися реал-тайм команди
```

### 5. WebSocket не працює
```bash
# Nginx має підтримувати Upgrade header
grep -i upgrade /etc/nginx/sites-available/messenger
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" https://...
```

---

## Швидкий Deploy (All-in-One Script)

```bash
#!/bin/bash
# quick-deploy.sh

set -e

echo "🧹 Cleaning macOS attributes..."
xattr -cr static/

echo "🔨 Building for Linux..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main -ldflags="-s -w" -trimpath .

echo "📦 Checking embedded files..."
strings main | grep "role-preset-buttons" || echo "⚠️  Warning: Files not embedded!"

echo "🚀 Uploading to server..."
scp -o ConnectTimeout=30 main root@64.227.116.250:/opt/messenger/main-new

echo "🔄 Deploying on server..."
ssh root@64.227.116.250 << 'ENDSSH'
    cp /opt/messenger/main-new /opt/messenger/messenger
    chmod +x /opt/messenger/messenger
    systemctl restart messenger
    sleep 3
    systemctl status messenger --no-pager
    curl -s http://localhost:8080/api/health | jq
ENDSSH

echo "✅ Deployment complete!"
echo "🌐 Testing: https://messenger.kaminskyi.chat/api/health"
curl -s https://messenger.kaminskyi.chat/api/health | jq
```

---

## Checklist Перед Deployment

- [ ] Видалено macOS attributes: `xattr -cr static/`
- [ ] Код скомпільовано для Linux: `GOOS=linux`
- [ ] Статичні файли embedded: `strings main | grep "new-file"`
- [ ] Локально протестовано: `./main` (або `go run`)
- [ ] Git commit & push: `git push origin main`
- [ ] Railway auto-deploy completed (якщо змінено `hibernation-proxy/`)
- [ ] Binary загружено на сервер: `scp main root@...`
- [ ] Backup створено: `cp messenger messenger.backup`
- [ ] Systemd service перезапущено: `systemctl restart messenger`
- [ ] Health check OK: `curl .../api/health`
- [ ] WebSocket працює: Test з браузера
- [ ] Redis з'єднання OK: `redis-cli ping`
- [ ] Nginx працює: `systemctl status nginx`
- [ ] Логи чисті: `journalctl -u messenger -f`

---

## Versioning Strategy

### Формат версії: `v{major}.{minor}.{patch}-{feature}`

Приклад: `v1.1.0-role-presets-ui`

```go
// main.go
const (
    buildVersion = "v1.1.0-role-presets-ui"
    buildDate    = "2025-10-08"
)

// Health endpoint
app.Get("/api/health", func(c *fiber.Ctx) error {
    return c.JSON(fiber.Map{
        "status": "ready",
        "version": buildVersion,
        "buildDate": buildDate,
    })
})
```

---

## Monitoring & Logs

### Команди для моніторингу:

```bash
# Real-time логи messenger
journalctl -u messenger -f

# Логи за останню годину
journalctl -u messenger --since "1 hour ago"

# Логи з фільтром по ERROR
journalctl -u messenger | grep ERROR

# Nginx access log
tail -f /var/log/nginx/access.log

# Redis monitoring
redis-cli MONITOR

# System resources
htop
df -h
free -h

# Network connections
netstat -tulpn | grep LISTEN
ss -tuln
```

---

## Emergency Rollback

```bash
# Якщо щось пішло не так:
ssh root@64.227.116.250

# Відкат до backup
cp /opt/messenger/messenger.backup /opt/messenger/messenger
systemctl restart messenger

# Або до попередньої версії з Git:
git checkout HEAD~1
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main -ldflags="-s -w" -trimpath .
# ... deploy ...
```

---

**Документ створено:** 2025-10-08
**Версія:** 1.0
**Автор:** Claude Code + Oleh Kaminskyi
