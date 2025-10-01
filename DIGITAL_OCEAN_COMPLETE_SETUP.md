# 🚀 ПОВНЕ АВТОМАТИЧНЕ РОЗГОРТАННЯ НА DIGITALOCEAN + RAILWAY

## 📋 ЩО БУДЕ РОЗГОРНУТО

✅ **Railway (Застосунок)**
- Go Backend з WebRTC
- Redis для сесій (8 годин TTL)
- Auto-deploy при push в GitHub

✅ **DigitalOcean (TURN Server)**
- Coturn TURN server для NAT traversal
- SSL/TLS сертифікати
- Firewall та безпека
- Моніторинг

✅ **GitHub Actions (CI/CD)**
- Автоматичне тестування
- Автоматичний deploy
- Health checks

---

## 🔐 КРОК 1: ГЕНЕРАЦІЯ ПАРОЛІВ

```bash
cd infrastructure/secrets
./generate-passwords.sh | tee credentials.txt
chmod 600 credentials.txt
```

**ЗБЕРЕЖІТЬ ЦІ ПАРОЛІ!** Вони потрібні для всіх наступних кроків.

Згенеровано:
- `TURN_USERNAME`: kaminskyi-2de5d9b17eeb4c73
- `TURN_PASSWORD`: Tg3uvSF3wD1eHLy4ficYlRVCZPLEiPcY
- `REDIS_PASSWORD`: SUssYg3HIhslRXJwJVPR9ocngq7lcLK5
- `JWT_SECRET`: 7jkJ11tFuk0HqUYNYRXaAKj0QA0x2QWE1QjCaGHWKoIGaWi64kcG4cP7tnlKC0QyNphR2eEEaCKpo2Y92Q
- `SESSION_SECRET`: GH7BoBZ0SInikRMpOPphcgmNiiSq0RCPf8FuS5gNdNb3SlPUtaug2IBekf3nsXteuOfbcYG3vTOsERexUbTw
- `HOST_PASSWORD`: avkZmR31qAqJ8ntQYhfqhSSJ
- `API_KEY`: sz1JgTSEqSrr4fRCZ6yR9Ma40LjIvvHS

---

## 🎯 КРОК 2: DIGITALOCEAN - СТВОРЕННЯ ІНФРАСТРУКТУРИ

### 2.1 Створення облікового запису

1. Перейдіть на https://digitalocean.com
2. Створіть обліковий запис
3. Отримайте $200 кредиту (якщо новий користувач)

### 2.2 Генерація API токену

```
1. Settings → API → Personal Access Tokens
2. Generate New Token
   Name: kaminskyi-messenger
   Scopes: Read & Write
3. ЗБЕРЕЖІТЬ TOKEN!
```

### 2.3 Додавання SSH ключа

```bash
# Генеруйте ключ (якщо немає)
ssh-keygen -t ed25519 -C "turn-server" -f ~/.ssh/turn_server

# Показати публічний ключ
cat ~/.ssh/turn_server.pub

# Додайте в DigitalOcean: Settings → Security → SSH Keys

# Отримати fingerprint
ssh-keygen -lf ~/.ssh/turn_server.pub -E md5 | awk '{print $2}' | cut -d: -f2-
```

### 2.4 Розгортання TURN сервера (Terraform)

```bash
cd infrastructure/digitalocean

# Створити файл з параметрами
cat > terraform.tfvars <<'EOF'
do_token              = "dop_v1_ВААШАШ_DIGITALOCEAN_API_TOKEN"
ssh_key_fingerprint   = "ВАШ_SSH_FINGERPRINT"
turn_username         = "kaminskyi-2de5d9b17eeb4c73"
turn_password         = "Tg3uvSF3wD1eHLy4ficYlRVCZPLEiPcY"
environment           = "production"
region                = "fra1"
droplet_size          = "s-2vcpu-4gb"
EOF

chmod 600 terraform.tfvars

# Ініціалізація
terraform init

# Перевірка плану
terraform plan

# РОЗГОРТАННЯ (займе ~5 хвилин)
terraform apply

# Отримати IP
terraform output turn_server_ip
```

**ЗБЕРЕЖІТЬ IP TURN СЕРВЕРА!**

---

## 🚂 КРОК 3: RAILWAY - ЗАСТОСУНОК ТА REDIS

### 3.1 Створення проекту

```
1. https://railway.app
2. New Project → Deploy from GitHub repo
3. Виберіть: go-messenger
4. Railway автоматично виявить Dockerfile
```

### 3.2 Додавання Redis

```
1. У проекті: + New
2. Database → Redis
3. Railway створить REDIS_URL автоматично
```

### 3.3 Налаштування змінних середовища

У Railway Dashboard → Variables, додайте:

```bash
# Автентифікація
HOST_USERNAME=oleh
HOST_PASSWORD=avkZmR31qAqJ8ntQYhfqhSSJ
JWT_SECRET=7jkJ11tFuk0HqUYNYRXaAKj0QA0x2QWE1QjCaGHWKoIGaWi64kcG4cP7tnlKC0QyNphR2eEEaCKpo2Y92Q
SESSION_SECRET=GH7BoBZ0SInikRMpOPphcgmNiiSq0RCPf8FuS5gNdNb3SlPUtaug2IBekf3nsXteuOfbcYG3vTOsERexUbTw

# Redis (автоматично з Railway Redis)
# REDIS_URL=redis://... (вже встановлено)

# TURN Server (IP з Terraform output)
TURN_SERVER=turn:YOUR_DIGITALOCEAN_IP:3478
TURN_USERNAME=kaminskyi-2de5d9b17eeb4c73
TURN_PASSWORD=Tg3uvSF3wD1eHLy4ficYlRVCZPLEiPcY

# Застосунок
PORT=8080
ENVIRONMENT=production
MAX_CALL_DURATION=28800
```

### 3.4 Отримання токенів для GitHub Actions

```bash
# Встановіть Railway CLI
npm install -g @railway/cli

# Увійдіть
railway login

# Отримайте project ID
railway status

# Згенеруйте deployment token
railway tokens create

# ЗБЕРЕЖІТЬ TOKEN!
```

---

## 🔧 КРОК 4: НАЛАШТУВАННЯ TURN СЕРВЕРА

### 4.1 SSH підключення

```bash
ssh root@YOUR_DIGITALOCEAN_IP
```

### 4.2 Перевірка статусу

```bash
# Перевірка роботи coturn
systemctl status coturn

# Перегляд логів
tail -f /var/log/turnserver.log

# Інформація про сервер
cat /root/turn-server-info.txt
```

### 4.3 Налаштування DNS (опціонально, але рекомендовано)

Додайте DNS записи до вашого домену:

```
Type  Name                Value
A     turn.kaminskyi.ai   YOUR_DIGITALOCEAN_IP
```

### 4.4 Налаштування SSL (якщо є домен)

```bash
# Дочекайтесь поширення DNS (перевірте: dig turn.kaminskyi.ai)

# Отримайте сертифікат
certbot certonly --standalone \
  -d turn.kaminskyi.ai \
  --non-interactive \
  --agree-tos \
  --email your@email.com

# Оновіть конфіг coturn
nano /etc/turnserver.conf

# Розкоментуйте рядки:
cert=/etc/letsencrypt/live/turn.kaminskyi.ai/fullchain.pem
pkey=/etc/letsencrypt/live/turn.kaminskyi.ai/privkey.pem

# Перезапустіть
systemctl restart coturn

# Автопродовження
echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl restart coturn'" | crontab -
```

### 4.5 Оновлення Railway з TURN URLs

Якщо SSL налаштовано, оновіть у Railway:

```bash
TURN_URLS=turn:YOUR_IP:3478?transport=udp,turn:YOUR_IP:3478?transport=tcp,turns:turn.kaminskyi.ai:5349?transport=tcp
```

---

## 🤖 КРОК 5: GITHUB ACTIONS (АВТОДЕПЛОЙ)

### 5.1 Додавання GitHub Secrets

Перейдіть: GitHub repo → Settings → Secrets and variables → Actions

Додайте:

```
RAILWAY_TOKEN=rwtk_ВААШАШАШАШАШАШАШАШАШАШ
RAILWAY_PROJECT_ID=ВАШ_PROJECT_ID
DIGITALOCEAN_TOKEN=dop_v1_ВААШАШАШАШАШАШАШАШ
DO_SSH_KEY_FINGERPRINT=ВАШ_FINGERPRINT
TURN_USERNAME=kaminskyi-2de5d9b17eeb4c73
TURN_PASSWORD=Tg3uvSF3wD1eHLy4ficYlRVCZPLEiPcY
```

### 5.2 Перший деплой

```bash
# Закомітьте та запуште зміни
git add -A
git commit -m "Production deployment setup [turn]"
git push origin main
```

Дивіться прогрес: https://github.com/YOUR_USERNAME/go-messenger/actions

---

## ✅ КРОК 6: ПЕРЕВІРКА РОЗГОРТАННЯ

### 6.1 Перевірка застосунку

```bash
# Перевірте health endpoint
curl https://go-messenger-production.up.railway.app/health

# Очікуваний результат:
{"status":"healthy","timestamp":"...","redis":"connected"}
```

### 6.2 Тест TURN сервера

```bash
# Встановіть тестер
npm install -g turn-tester

# Тестуйте
turn-tester YOUR_DIGITALOCEAN_IP 3478 kaminskyi-2de5d9b17eeb4c73 Tg3uvSF3wD1eHLy4ficYlRVCZPLEiPcY

# Очікується: Success
```

### 6.3 Тест WebRTC

1. Відкрийте https://go-messenger-production.up.railway.app
2. Увійдіть: `oleh` / `avkZmR31qAqJ8ntQYhfqhSSJ`
3. Створіть зустріч
4. Відкрийте посилання в режимі інкогніто
5. Приєднайтесь як гість

Перевірте:
- ✅ Відео/аудіо працює
- ✅ Чат працює
- ✅ З'єднання стабільне
- ✅ GIF відображаються
- ✅ Emoji picker працює
- ✅ Панель налаштувань відкривається

---

## 📊 МОНІТОРИНГ

### Railway

```bash
railway login
railway link YOUR_PROJECT_ID
railway logs
railway status
```

### TURN Server

```bash
ssh root@YOUR_DIGITALOCEAN_IP

# Статус
systemctl status coturn

# Логи
tail -f /var/log/turnserver.log

# Моніторинг
/usr/local/bin/turn-monitor.sh
```

---

## 💰 ВАРТІСТЬ

| Сервіс | План | Ціна/місяць |
|--------|------|-------------|
| Railway | Hobby | $5 |
| Railway Redis | Вкл. | $0 |
| DO Droplet | s-2vcpu-4gb | $18 |
| DO Reserved IP | Standard | $4 |
| **ВСЬОГО** | | **$27/міс** |

---

## 🔧 НАЛАШТУВАННЯ

### Для 20 одночасних дзвінків

Поточна конфігурація підходить ✅

### Для 50+ дзвінків

```hcl
# infrastructure/digitalocean/terraform.tfvars
droplet_size = "s-4vcpu-8gb"
```

```bash
terraform apply
```

---

## 🐛 ВИРІШЕННЯ ПРОБЛЕМ

### Застосунок не запускається

```bash
railway logs | grep ERROR
railway variables
```

### TURN сервер не працює

```bash
ssh root@IP
systemctl status coturn
ufw status
netstat -tulpn | grep turnserver
```

### Дзвінки відключаються

- Перевірте Redis: `railway logs --service redis`
- Перевірте TURN credentials
- Перевірте Railway metrics

---

## 🎉 ГОТОВО!

Ваш messenger розгорнуто!

**URL**: https://go-messenger-production.up.railway.app
**Логін**: oleh / avkZmR31qAqJ8ntQYhfqhSSJ

### Наступні кроки:

- [ ] Налаштуйте DNS для TURN сервера
- [ ] Встановіть SSL сертифікат
- [ ] Налаштуйте моніторинг
- [ ] Тестуйте з реальними користувачами
- [ ] Імплементуйте SFU для групових дзвінків (20 осіб)

---

## 📞 ПІДТРИМКА

- 📧 Email: work.olegkaminskyi@gmail.com
- 🐛 Issues: https://github.com/YOUR_USERNAME/go-messenger/issues
- 📚 Архітектура: `ARCHITECTURE.md`
