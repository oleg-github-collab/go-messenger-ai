# 🚀 Інструкція по Deployment для Kaminskyi Messenger

## 📋 Поточна Конфігурація

### DigitalOcean Droplets (у тебе ДВА окремих сервери!)

**Droplet 1: kaminskyi-messenger-production** (Messenger додаток)
```
Публічні IP: 64.227.116.250 та 157.230.79.144
Приватна IP: 10.114.0.5
Сервіси: Go Messenger (порт 8080) + Nginx + Coturn (backup)
SSH: ssh root@64.227.116.250
```

**Droplet 2: kaminskyi-turn-production** (Окремий TURN сервер)
```
Публічні IP: 64.226.72.235 та 164.90.242.199
Приватна IP: 10.114.0.6
Сервіси: Coturn TURN server (порт 3478)
SSH: немає доступу (працює автономно)
```

### DNS Записи в Namecheap (поточний стан)
```
messenger.kaminskyi.chat  →  157.230.79.144  ✅ (Messenger сервер)
turn.kaminskyi.chat       →  164.90.242.199  ✅ (TURN сервер)
```

**ВАЖЛИВО:**
- У тебе **ДВА різних сервери** - не плутай їх!
- Messenger та TURN - на різних дроплетах
- Кожен дроплет має по ДВІ публічні IP адреси

---

## 🎯 Namecheap DNS - ПРАВИЛЬНА конфігурація

### Зайди в Namecheap → Domain List → kaminskyi.chat → Manage → Advanced DNS

### Поточні записи (можна залишити як є, вони працюють!):

| Тип запису | Host | Value | Призначення | Статус |
|------------|------|-------|-------------|--------|
| **A Record** | `messenger` | `157.230.79.144` | Messenger додаток | ✅ Працює |
| **A Record** | `turn` | `164.90.242.199` | TURN сервер | ✅ Працює |

### Опціонально - додай для корневого домену:

| Тип запису | Host | Value | TTL | Призначення |
|------------|------|-------|-----|-------------|
| **A Record** | `@` | `64.227.116.250` | Automatic | kaminskyi.chat → редірект на messenger |
| **A Record** | `www` | `64.227.116.250` | Automatic | www.kaminskyi.chat → редірект на messenger |

### Пояснення:
- `messenger → 157.230.79.144` - це ПРАВИЛЬНО, це публічна IP твого Messenger сервера
- `turn → 164.90.242.199` - це ПРАВИЛЬНО, це публічна IP твого TURN сервера
- `@` і `www` - опціонально, для доступу через корневий домен

**НЕ ПОТРІБНО НІЧОГО МІНЯТИ - все налаштовано правильно!**

---

## 🔄 Процес Deployment (використовуй ЦЮ команду ЗАВЖДИ)

### Крок 1: Збір бінарника
```bash
cd "/Users/olehkaminskyi/Desktop/go messenger"
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main -ldflags="-s -w" -trimpath .
```

### Крок 2: Створення архіву
```bash
tar -czf deploy.tar.gz main static/
```

### Крок 3: Завантаження на сервер
```bash
scp -o StrictHostKeyChecking=no deploy.tar.gz root@64.227.116.250:/tmp/
```

### Крок 4: Deployment на сервері
```bash
ssh -o StrictHostKeyChecking=no root@64.227.116.250 'systemctl stop messenger && mv /tmp/deploy.tar.gz /opt/messenger/ && cd /opt/messenger && tar -xzf deploy.tar.gz && cp main messenger && systemctl start messenger'
```

### Крок 5: ОБОВ'ЯЗКОВА ПЕРЕВІРКА
```bash
# Локальний MD5
md5 main

# Серверний MD5
ssh root@64.227.116.250 'md5sum /opt/messenger/messenger'

# MD5 МАЮТЬ СПІВПАДАТИ! Якщо ні - деплой не виконався правильно.
```

### Крок 6: Перевірка працездатності
```bash
# Перевір що сервіс запустився
ssh root@64.227.116.250 'systemctl status messenger | head -15'

# Перевір що сайт відповідає
curl -I https://messenger.kaminskyi.chat/
```

---

## 🔧 Альтернативний метод (одна команда)

Створи файл `deploy.sh` з таким вмістом:

```bash
#!/bin/bash
set -e

echo "🔨 Building binary..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main -ldflags="-s -w" -trimpath .

echo "📦 Creating archive..."
tar -czf deploy.tar.gz main static/

echo "📤 Uploading to server..."
scp -o StrictHostKeyChecking=no deploy.tar.gz root@64.227.116.250:/tmp/

echo "🚀 Deploying..."
ssh -o StrictHostKeyChecking=no root@64.227.116.250 'systemctl stop messenger && mv /tmp/deploy.tar.gz /opt/messenger/ && cd /opt/messenger && tar -xzf deploy.tar.gz && cp main messenger && systemctl start messenger'

echo "✅ Verifying deployment..."
LOCAL_MD5=$(md5 main | awk '{print $4}')
REMOTE_MD5=$(ssh root@64.227.116.250 'md5sum /opt/messenger/messenger' | awk '{print $1}')

echo "Local MD5:  $LOCAL_MD5"
echo "Remote MD5: $REMOTE_MD5"

if [ "$LOCAL_MD5" = "$REMOTE_MD5" ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Check: https://messenger.kaminskyi.chat/"
else
    echo "❌ MD5 mismatch! Deployment may have failed."
    exit 1
fi
```

Зроби його виконуваним:
```bash
chmod +x deploy.sh
```

Використовуй:
```bash
./deploy.sh
```

---

## 🔐 Після оновлення DNS (коли зміниш записи в Namecheap)

### Отримання SSL сертифікатів для всіх доменів:

```bash
# Зачекай 5-10 хвилин після зміни DNS, потім:
ssh root@64.227.116.250

# Отримай SSL для корневого домену
certbot certonly --nginx -d kaminskyi.chat -d www.kaminskyi.chat --non-interactive --agree-tos --email oleh@kaminskyi.chat

# Оновлення nginx конфігурації для підтримки всіх доменів
cat > /etc/nginx/sites-available/kaminskyi-all-domains << 'EOF'
# Redirect HTTP to HTTPS for all domains
server {
    listen 80;
    listen [::]:80;
    server_name kaminskyi.chat www.kaminskyi.chat messenger.kaminskyi.chat;
    return 301 https://messenger.kaminskyi.chat$request_uri;
}

# Main HTTPS server for messenger
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name messenger.kaminskyi.chat;

    ssl_certificate /etc/letsencrypt/live/messenger.kaminskyi.chat/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/messenger.kaminskyi.chat/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 7d;
    proxy_send_timeout 7d;
    proxy_read_timeout 7d;

    location / {
        proxy_pass http://localhost:8080;
    }
}

# Root domain redirect
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name kaminskyi.chat www.kaminskyi.chat;

    ssl_certificate /etc/letsencrypt/live/kaminskyi.chat/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kaminskyi.chat/privkey.pem;

    return 301 https://messenger.kaminskyi.chat$request_uri;
}

# TURN server info
server {
    listen 80;
    listen [::]:80;
    server_name turn.kaminskyi.chat;

    location / {
        return 200 "TURN server running on UDP/TCP 3478\nServer: 64.227.116.250";
        add_header Content-Type text/plain;
    }
}
EOF

# Активувати нову конфігурацію
rm -f /etc/nginx/sites-enabled/*
ln -s /etc/nginx/sites-available/kaminskyi-all-domains /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

---

## 📊 Діагностика проблем

### Перевірка DNS (дочекайся поширення DNS, зазвичай 5-30 хвилин)
```bash
dig @8.8.8.8 +short kaminskyi.chat
dig @8.8.8.8 +short messenger.kaminskyi.chat
dig @8.8.8.8 +short www.kaminskyi.chat
dig @8.8.8.8 +short turn.kaminskyi.chat

# Всі мають повертати: 64.227.116.250
```

### Перевірка процесу на сервері
```bash
ssh root@64.227.116.250 'systemctl status messenger'
ssh root@64.227.116.250 'ps aux | grep messenger'
```

### Перевірка логів
```bash
ssh root@64.227.116.250 'journalctl -u messenger -n 50 --no-pager'
```

### Перевірка портів
```bash
ssh root@64.227.116.250 'ss -tlnp | grep 8080'
```

### Перевірка MD5 бінарників
```bash
# На сервері
ssh root@64.227.116.250 'ls -lh /opt/messenger/messenger && md5sum /opt/messenger/messenger'

# Локально
ls -lh main && md5 main
```

---

## ⚠️ Важливі правила

1. **ЗАВЖДИ** перевіряй MD5 після деплою
2. **НІКОЛИ** не запускай бінарник вручну з `/root/` - використовуй systemd
3. **ЗАВЖДИ** використовуй `/opt/messenger/messenger` як фінальний бінарник
4. **ПЕРЕВІРЯЙ** що systemd сервіс працює після деплою
5. **ЧЕКАЙ** 5-10 хвилин після зміни DNS перед отриманням SSL сертифікатів

---

## 🎯 Чек-лист перед кожним deployment

- [ ] Код скомпільовано локально
- [ ] Створено deploy.tar.gz
- [ ] Завантажено на сервер
- [ ] Systemd сервіс зупинено
- [ ] Бінарник розпаковано та скопійовано в `/opt/messenger/messenger`
- [ ] Systemd сервіс запущено
- [ ] MD5 локального та серверного бінарника співпадають
- [ ] Сервіс відповідає на https://messenger.kaminskyi.chat/
- [ ] Перевірено логи на наявність помилок

---

## 📞 Контакти та доступи

- **Сервер IP:** 64.227.116.250
- **SSH:** `ssh root@64.227.116.250`
- **Systemd сервіс:** `messenger.service`
- **Робоча директорія:** `/opt/messenger/`
- **Nginx конфіг:** `/etc/nginx/sites-available/`
- **SSL сертифікати:** `/etc/letsencrypt/live/`

---

Створено: 7 жовтня 2025
Оновлено: 7 жовтня 2025
