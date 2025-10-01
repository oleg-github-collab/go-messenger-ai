# 🚀 ШВИДКИЙ СТАРТ - Розгортання за 15 хвилин

## Передумови

- ✅ GitHub обліковий запис
- ✅ DigitalOcean обліковий запис ($200 кредиту для нових користувачів)
- ✅ Railway обліковий запис (безкоштовний старт)

---

## 🎯 5 ПРОСТИХ КРОКІВ

### 1️⃣ ЗГЕНЕРУЙТЕ ПАРОЛІ (1 хв)

```bash
cd infrastructure/secrets
./generate-passwords.sh | tee credentials.txt
chmod 600 credentials.txt
```

✅ **Збережіть credentials.txt** - він містить всі необхідні паролі!

---

### 2️⃣ DIGITALOCEAN - TURN СЕРВЕР (5 хв)

```bash
cd infrastructure/digitalocean

# 1. Отримайте DigitalOcean API token тут:
# https://cloud.digitalocean.com/account/api/tokens

# 2. Створіть SSH ключ
ssh-keygen -t ed25519 -f ~/.ssh/turn_server
# Додайте публічний ключ в DigitalOcean:
# https://cloud.digitalocean.com/account/security

# 3. Отримайте fingerprint
ssh-keygen -lf ~/.ssh/turn_server.pub -E md5 | awk '{print $2}' | cut -d: -f2-

# 4. Створіть terraform.tfvars
cat > terraform.tfvars <<'EOF'
do_token              = "ВАШ_DO_TOKEN"
ssh_key_fingerprint   = "ВАШ_FINGERPRINT"
turn_username         = "TURN_USERNAME з credentials.txt"
turn_password         = "TURN_PASSWORD з credentials.txt"
environment           = "production"
EOF

chmod 600 terraform.tfvars

# 5. Розгорніть (займе ~5 хв)
terraform init
terraform apply -auto-approve

# 6. Збережіть IP
terraform output turn_server_ip
```

✅ **TURN сервер готовий!** IP збережено.

---

### 3️⃣ RAILWAY - ЗАСТОСУНОК (5 хв)

1. **Створіть проект**
   - Перейдіть на https://railway.app
   - New Project → Deploy from GitHub
   - Виберіть `go-messenger`

2. **Додайте Redis**
   - У проекті: + New → Database → Redis
   - Railway автоматично створить REDIS_URL

3. **Додайте змінні** (Railway Dashboard → Variables):
   ```
   HOST_USERNAME=oleh
   HOST_PASSWORD=<з credentials.txt>
   JWT_SECRET=<з credentials.txt>
   SESSION_SECRET=<з credentials.txt>
   TURN_SERVER=turn:<IP_З_TERRAFORM>:3478
   TURN_USERNAME=<з credentials.txt>
   TURN_PASSWORD=<з credentials.txt>
   PORT=8080
   ENVIRONMENT=production
   MAX_CALL_DURATION=28800
   ```

4. **Отримайте токени для GitHub**
   ```bash
   npm install -g @railway/cli
   railway login
   railway tokens create
   ```

✅ **Застосунок деплоїться!** URL: https://go-messenger-production.up.railway.app

---

### 4️⃣ GITHUB ACTIONS (2 хв)

GitHub repo → Settings → Secrets → додайте:

```
RAILWAY_TOKEN=<з railway tokens create>
RAILWAY_PROJECT_ID=<з railway status>
DIGITALOCEAN_TOKEN=<ВАШ DO TOKEN>
DO_SSH_KEY_FINGERPRINT=<ВАШ FINGERPRINT>
TURN_USERNAME=<з credentials.txt>
TURN_PASSWORD=<з credentials.txt>
```

✅ **Автодеплой налаштовано!** При кожному push → автоматичний деплой.

---

### 5️⃣ ПЕРЕВІРКА (2 хв)

```bash
# 1. Перевірте застосунок
curl https://go-messenger-production.up.railway.app/health

# 2. Перевірте TURN
npm install -g turn-tester
turn-tester <TURN_IP> 3478 <TURN_USERNAME> <TURN_PASSWORD>

# 3. Відкрийте браузер
# https://go-messenger-production.up.railway.app
# Логін: oleh / <HOST_PASSWORD з credentials.txt>
```

✅ **ВСЕ ПРАЦЮЄ!**

---

## 🎉 ГОТОВО!

Ваш production messenger розгорнуто!

### Що маєте:

- ✅ WebRTC відео/аудіо дзвінки (1-на-1)
- ✅ Вибір формату зустрічі (1-на-1 або група до 20)
- ✅ TURN сервер для NAT traversal
- ✅ Redis для сесій (8 годин)
- ✅ Автодеплой через GitHub
- ✅ Чат з GIF та Emoji
- ✅ Панель налаштувань якості
- ✅ Адаптивна якість відео

### Вартість:
- **$27/місяць** (Railway $5 + DigitalOcean $22)

### Наступні кроки (опціонально):

1. **Налаштуйте домен для TURN**
   ```bash
   # Додайте DNS запис: turn.ВАШ_ДОМЕН.com → TURN_IP
   # SSH на сервер і налаштуйте SSL:
   ssh root@<TURN_IP>
   certbot certonly --standalone -d turn.ВАШ_ДОМЕН.com
   nano /etc/turnserver.conf  # Розкоментуйте cert/pkey
   systemctl restart coturn
   ```

2. **Імплементуйте SFU для групових дзвінків**
   - UI вже готове (вибір 1-на-1 vs Група)
   - Backend routing готовий
   - Потрібно: SFU сервер (pion/webrtc в Go)

3. **Додайте моніторинг**
   - Grafana + Prometheus
   - Alerts для downtime
   - Usage analytics

---

## 📚 Детальна документація

- 🏗️ Архітектура: `ARCHITECTURE.md`
- 🚀 Повне розгортання: `DIGITAL_OCEAN_COMPLETE_SETUP.md`
- ⚙️ TURN сервер: `infrastructure/digitalocean/README.md`
- 🧪 Тестування: `PRODUCTION_TEST.md`

---

## 🐛 Проблеми?

1. **Застосунок не запускається**
   ```bash
   railway logs | grep ERROR
   ```

2. **TURN не працює**
   ```bash
   ssh root@<TURN_IP>
   systemctl status coturn
   tail -f /var/log/turnserver.log
   ```

3. **Дзвінки відключаються**
   - Перевірте TURN credentials в Railway
   - Перевірте Redis: `railway logs --service redis`

---

## 📞 Підтримка

- Email: work.olegkaminskyi@gmail.com
- GitHub Issues: [створити issue](https://github.com/YOUR_USERNAME/go-messenger/issues)

---

**Успішного розгортання! 🚀**
