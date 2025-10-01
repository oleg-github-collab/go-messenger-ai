# 🚀 ПОВНА ІНСТРУКЦІЯ З РОЗГОРТАННЯ

## КРОК 1: RAILWAY - ГОЛОВНИЙ ЗАСТОСУНОК

### 1.1 Deploy Go Application

```bash
# 1. Перейдіть в Railway Dashboard
https://railway.app/

# 2. New Project → Deploy from GitHub
# Виберіть цей репозиторій

# 3. Railway автоматично:
- Виявить Dockerfile
- Побудує контейнер
- Запустить застосунок
- Надасть публічний URL

# 4. Налаштування Environment Variables:
PORT=8080  # Railway встановить автоматично
REDIS_URL=redis://...  # Додамо нижче
TURN_SERVER=...  # Додамо нижче
```

### 1.2 Add Redis Database

```bash
# В Railway Dashboard:
1. New → Database → Redis
2. Connect to your project
3. Redis автоматично створить змінні:
   - REDIS_URL
   - REDIS_HOST
   - REDIS_PORT
   - REDIS_PASSWORD

# Ці змінні автоматично будуть доступні в Go app
```

### 1.3 Отримати URL застосунку

```
Railway надасть URL типу:
https://kaminskyi-messenger-production.up.railway.app

Збережіть його!
```

---

## КРОК 2: DIGITALOCEAN - TURN/STUN SERVER

### 2.1 Створення API Token

```bash
# 1. Зайдіть в DigitalOcean Dashboard
https://cloud.digitalocean.com/

# 2. API → Tokens → Generate New Token
Назва: kaminskyi-turn-server
Права: Read + Write

# 3. Скопіюйте токен (показується один раз!)
```

### 2.2 Автоматичне Розгортання (Terraform)

**Створіть файл:** `deploy-turn.sh`

```bash
#!/bin/bash

# DigitalOcean Token
export DO_TOKEN="your_digitalocean_token_here"

# SSH Key (створіть якщо немає)
ssh-keygen -t ed25519 -C "kaminskyi@turn-server" -f ~/.ssh/turn_server

# Upload SSH key to DigitalOcean
doctl compute ssh-key import turn-server --public-key-file ~/.ssh/turn_server.pub

# Get SSH key ID
SSH_KEY_ID=$(doctl compute ssh-key list --format ID --no-header)

# Create Terraform variables
cat > infrastructure/digitalocean/terraform.tfvars <<EOF
do_token = "$DO_TOKEN"
ssh_key_id = "$SSH_KEY_ID"
admin_ip = "$(curl -s ifconfig.me)/32"
environment = "production"
EOF

# Deploy!
cd infrastructure/digitalocean
terraform init
terraform plan
terraform apply -auto-approve

# Get TURN server IP
TURN_IP=$(terraform output -raw turn_server_ip)
echo "TURN Server IP: $TURN_IP"

# Wait for setup to complete (2-3 minutes)
echo "Waiting for TURN server setup..."
sleep 180

# Get TURN credentials
ssh -i ~/.ssh/turn_server root@$TURN_IP "cat /root/turn-credentials.txt"
```

### 2.3 Запустіть розгортання:

```bash
chmod +x deploy-turn.sh
./deploy-turn.sh
```

### 2.4 Перевірка TURN Server:

```bash
# Test TURN connectivity
npm install -g turn-tester

turn-tester \
  --host YOUR_TURN_IP \
  --port 3478 \
  --username kaminskyi \
  --password YOUR_TURN_PASSWORD
```

---

## КРОК 3: DNS НАЛАШТУВАННЯ (ОПЦІОНАЛЬНО)

### 3.1 Для TURN Server:

```bash
# В вашому DNS провайдері (Cloudflare/Namecheap/etc):
A Record:
  Name: turn
  Value: YOUR_TURN_IP
  TTL: 300

# Результат: turn.yourdomain.com → TURN Server
```

### 3.2 Для Railway App:

```bash
# В Railway Dashboard → Settings → Domains:
Додайте ваш домен: messenger.yourdomain.com

# В DNS:
CNAME Record:
  Name: messenger
  Value: kaminskyi-messenger-production.up.railway.app
  TTL: 300
```

### 3.3 SSL для TURN (після DNS):

```bash
# SSH to TURN server
ssh -i ~/.ssh/turn_server root@YOUR_TURN_IP

# Get SSL certificate
certbot certonly --standalone \
  -d turn.yourdomain.com \
  --email your@email.com \
  --agree-tos

# Update turnserver.conf
sed -i 's|# cert=|cert=|' /etc/turnserver.conf
sed -i 's|# pkey=|pkey=|' /etc/turnserver.conf

# Restart coturn
systemctl restart coturn
```

---

## КРОК 4: ОНОВЛЕННЯ GO APP

### 4.1 Додайте змінні в Railway:

```bash
# Railway Dashboard → Variables:
TURN_HOST=turn.yourdomain.com  # або IP
TURN_USERNAME=kaminskyi
TURN_PASSWORD=your_turn_password_from_server
REDIS_URL=redis://...  # Вже є автоматично
```

### 4.2 Оновіть main.go:

```go
// Add to main.go
var (
    turnHost     = os.Getenv("TURN_HOST")
    turnUsername = os.Getenv("TURN_USERNAME")
    turnPassword = os.Getenv("TURN_PASSWORD")
    redisURL     = os.Getenv("REDIS_URL")
)

// API endpoint для TURN credentials
http.HandleFunc("/api/turn-credentials", authMiddleware(func(w http.ResponseWriter, r *http.Request) {
    json.NewEncoder(w).Encode(map[string]string{
        "host":     turnHost,
        "username": turnUsername,
        "password": turnPassword,
    })
}))
```

---

## КРОК 5: CI/CD AUTOMATION

### 5.1 GitHub Actions Setup:

```bash
# В GitHub Repository → Settings → Secrets:
Додайте:
- RAILWAY_TOKEN (отримайте з Railway Dashboard)
- DIGITALOCEAN_TOKEN (ваш DO токен)
```

### 5.2 Створіть `.github/workflows/deploy.yml`:

```yaml
name: Auto Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - run: go test ./...

  deploy:
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        run: |
          npm install -g @railway/cli
          railway up --detach

      - name: Notify Success
        run: echo "✅ Deployed successfully!"
```

### 5.3 Тепер кожен push в main автоматично деплоїться!

---

## КРОК 6: ТЕСТУВАННЯ

### 6.1 Локальне Тестування:

```bash
# Встановіть залежності
go mod download

# Запустіть локально
export REDIS_URL="redis://localhost:6379"
export TURN_HOST="turn.yourdomain.com"
export TURN_USERNAME="kaminskyi"
export TURN_PASSWORD="your_password"

go run main.go

# Відкрийте: http://localhost:8080/login
```

### 6.2 Production Тестування:

```bash
# 1. Логін як хост:
https://your-railway-url.railway.app/login
Oleh / QwertY24$

# 2. Створіть зустріч
Натисніть "Create Meeting"

# 3. Скопіюйте посилання для гостя
https://your-railway-url.railway.app/join/xyz-789

# 4. Відкрийте на іншому пристрої/браузері
Введіть ім'я, увімкніть камеру/мікрофон
Натисніть "Join Meeting"

# 5. Перевірте з'єднання
- Локальне відео видно?
- Віддалене відео з'являється?
- Аудіо працює?
- Чат працює?
```

### 6.3 Load Testing (20 учасників):

```bash
# Встановіть artillery
npm install -g artillery

# Створіть artillery.yml:
cat > artillery.yml <<EOF
config:
  target: 'wss://your-railway-url.railway.app'
  phases:
    - duration: 600  # 10 minutes
      arrivalRate: 2  # 2 users per second
      maxUsers: 20

scenarios:
  - name: "Join Meeting"
    engine: ws
    flow:
      - connect:
          url: "/ws?room=test-room-123"
      - think: 1
      - send:
          type: "join"
          room: "test-room-123"
      - think: 600  # Stay in call for 10 minutes
EOF

# Запустіть тест
artillery run artillery.yml
```

---

## КРОК 7: МОНІТОРИНГ

### 7.1 Railway Logs:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# View logs in real-time
railway logs --follow
```

### 7.2 DigitalOcean Monitoring:

```bash
# SSH to TURN server
ssh -i ~/.ssh/turn_server root@YOUR_TURN_IP

# Check coturn status
systemctl status coturn

# View logs
tail -f /var/log/turnserver.log

# Check active connections
netstat -an | grep 3478 | wc -l
```

### 7.3 Redis Monitoring:

```bash
# In Railway Dashboard:
Redis → Metrics

# Or via CLI:
redis-cli -u $REDIS_URL
> INFO stats
> CLIENT LIST
```

---

## КРОК 8: АВТОМАТИЧНЕ МАСШТАБУВАННЯ TURN

### 8.1 Створіть monitoring script:

**File:** `scripts/turn-autoscale.sh`

```bash
#!/bin/bash

DROPLET_ID="your_droplet_id"
DO_TOKEN="your_do_token"

while true; do
    # Get active connections from Railway
    ACTIVE_CALLS=$(curl -s https://your-railway-url.railway.app/api/stats | jq '.active_calls')

    if [ $ACTIVE_CALLS -gt 5 ]; then
        echo "Scaling UP: $ACTIVE_CALLS active calls"

        # Power on TURN server
        curl -X POST \
          -H "Authorization: Bearer $DO_TOKEN" \
          -H "Content-Type: application/json" \
          https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions \
          -d '{"type":"power_on"}'

    elif [ $ACTIVE_CALLS -eq 0 ]; then
        echo "Scaling DOWN: No active calls"

        # Wait 10 minutes before powering off
        sleep 600

        ACTIVE_CALLS=$(curl -s https://your-railway-url.railway.app/api/stats | jq '.active_calls')
        if [ $ACTIVE_CALLS -eq 0 ]; then
            # Power off TURN server
            curl -X POST \
              -H "Authorization: Bearer $DO_TOKEN" \
              -H "Content-Type: application/json" \
              https://api.digitalocean.com/v2/droplets/$DROPLET_ID/actions \
              -d '{"type":"power_off"}'
        fi
    fi

    # Check every 30 seconds
    sleep 30
done
```

### 8.2 Запустіть як systemd service:

```bash
# Create service file
cat > /etc/systemd/system/turn-autoscale.service <<EOF
[Unit]
Description=TURN Server Auto Scaler
After=network.target

[Service]
Type=simple
User=root
ExecStart=/root/scripts/turn-autoscale.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
systemctl enable turn-autoscale
systemctl start turn-autoscale
```

---

## 🎯 ФІНАЛЬНИЙ ЧЕКЛИСТ

### Railway:
- [ ] Go app deployed і працює
- [ ] Redis database підключена
- [ ] Environment variables налаштовані
- [ ] Custom domain (опціонально)
- [ ] SSL certificate активний

### DigitalOcean:
- [ ] TURN server створений
- [ ] Coturn запущений і працює
- [ ] Firewall правила налаштовані
- [ ] SSL certificate встановлений (якщо domain)
- [ ] Auto-scaling script працює

### GitHub:
- [ ] Repository створений
- [ ] CI/CD workflow налаштований
- [ ] Secrets додані
- [ ] Auto-deploy працює

### Testing:
- [ ] Локальне тестування пройдено
- [ ] Production тестування пройдено
- [ ] Load test з 20 учасниками
- [ ] 8-годинний тест стабільності

### Monitoring:
- [ ] Railway logs accessible
- [ ] TURN server logs accessible
- [ ] Redis monitoring active
- [ ] Alert notifications (опціонально)

---

## 📞 SUPPORT

Якщо щось не працює:

1. **Перевірте Railway logs:**
   ```bash
   railway logs --follow
   ```

2. **Перевірте TURN server:**
   ```bash
   ssh root@YOUR_TURN_IP
   systemctl status coturn
   ```

3. **Перевірте Redis:**
   ```bash
   redis-cli -u $REDIS_URL ping
   ```

4. **Перевірте Browser Console:**
   F12 → Console (шукайте [APP], [WebRTC], [WS] логи)

---

## 🚀 READY TO DEPLOY!

Всі файли підготовлені, інструкції готові.
Запустіть крок за кроком і все спрацює!

**ПРОДАКШН-READY АРХІТЕКТУРА! ✅**
