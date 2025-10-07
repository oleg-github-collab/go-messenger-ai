# Railway Деплой - Команди для Виконання

## Крок за Кроком

### 1. Авторизація в Railway

Відкрийте термінал та виконайте:

```bash
railway login
```

Це відкриє браузер. Авторизуйтесь через GitHub або email.

### 2. Перехід в Директорію Проекту

```bash
cd "/Users/olehkaminskyi/Desktop/go messenger/hibernation-proxy"
```

### 3. Ініціалізація Railway Проекту

```bash
railway init
```

Коли запитає назву проекту, введіть:
```
hibernation-proxy
```

### 4. Встановлення Змінних Оточення

```bash
railway variables set DO_API_TOKEN=YOUR_DIGITALOCEAN_API_TOKEN
```

### 5. Деплой на Railway

```bash
railway up
```

Railway покаже прогрес:
- ✓ Uploading project
- ✓ Building
- ✓ Deploying
- ✓ Success!

### 6. Отримання Public URL

```bash
railway domain
```

Збережіть URL - він виглядатиме як:
```
https://hibernation-proxy-production-abc123.up.railway.app
```

### 7. Додавання Custom Domains

```bash
railway domain messenger.kaminskyi.chat
railway domain turn.kaminskyi.chat
```

Railway покаже інструкції для DNS налаштування.

### 8. Налаштування DNS в CloudFlare

1. Відкрийте https://dash.cloudflare.com
2. Виберіть домен `kaminskyi.chat`
3. DNS → Add record

**Для messenger.kaminskyi.chat:**
- Type: CNAME
- Name: messenger
- Target: `hibernation-proxy-production-abc123.up.railway.app` (без https://)
- Proxy status: ❌ DNS only (ВАЖЛИВО!)
- TTL: Auto
- Save

**Для turn.kaminskyi.chat:**
- Type: CNAME
- Name: turn
- Target: `hibernation-proxy-production-abc123.up.railway.app` (той самий)
- Proxy status: ❌ DNS only
- TTL: Auto
- Save

### 9. Перевірка Деплойменту

```bash
# Перевірка Railway health
curl https://ВАША-RAILWAY-URL.up.railway.app/health

# Очікуваний результат:
{
  "status": "ok",
  "service": "hibernation-proxy",
  "timestamp": 1759863702,
  "uptime": 123.45
}
```

### 10. Перегляд Логів

```bash
railway logs
```

Або в реальному часі:
```bash
railway logs --tail
```

### 11. Тест Wake-Up Flow

```bash
# Вимкнути дроплет вручну
ssh root@64.227.116.250 "shutdown -h now"

# Зачекати 30 секунд
sleep 30

# Відкрити в браузері (або curl)
curl https://messenger.kaminskyi.chat
# Має показати сторінку "Запуск сервера..."

# Через 20 секунд повторити
curl https://messenger.kaminskyi.chat
# Тепер має працювати нормально
```

### 12. Моніторинг

```bash
# Логи в реальному часі
railway logs

# Статус проекту
railway status

# Список змінних
railway variables

# Відкрити Railway dashboard в браузері
railway open
```

## Деплой Sleep Controller на Дроплети

### Messenger Droplet (64.227.116.250)

```bash
# 1. Завантажити скрипт
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.227.116.250:/usr/local/bin/sleep-controller.sh

# 2. Підключитись до дроплета
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

# 5. Запустити сервіс
systemctl daemon-reload
systemctl enable sleep-controller.service
systemctl start sleep-controller.service

# 6. Перевірити статус
systemctl status sleep-controller.service

# 7. Переглянути логи
journalctl -u sleep-controller.service -f

# 8. Вийти з дроплета
exit
```

### TURN Droplet (64.226.72.235)

```bash
# 1. Завантажити скрипт
scp "/Users/olehkaminskyi/Desktop/go messenger/sleep-controller.sh" root@64.226.72.235:/usr/local/bin/sleep-controller.sh

# 2. Підключитись до дроплета
ssh root@64.226.72.235

# 3-8. Виконати ті самі команди що і для messenger дроплета
chmod +x /usr/local/bin/sleep-controller.sh

cat > /etc/systemd/system/sleep-controller.service << 'EOF'
[Unit]
Description=Droplet Sleep Controller
After=network.target coturn.service redis-server.service

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
journalctl -u sleep-controller.service -f
exit
```

## Налаштування Idle Timeout (Опціонально)

Якщо хочете змінити час до засинання:

```bash
# Підключитись до дроплета
ssh root@64.227.116.250

# Відредагувати скрипт
nano /usr/local/bin/sleep-controller.sh

# Знайти рядок:
# IDLE_TIMEOUT=3600

# Змінити на потрібне (в секундах):
# IDLE_TIMEOUT=7200  # 2 години
# IDLE_TIMEOUT=1800  # 30 хвилин
# IDLE_TIMEOUT=300   # 5 хвилин (для тестування)

# Зберегти: Ctrl+O, Enter, Ctrl+X

# Перезапустити
systemctl restart sleep-controller.service

# Вийти
exit
```

## Корисні Команди

### Railway:

```bash
# Логи
railway logs

# Статус
railway status

# Перезапуск
railway up --detach

# Відкрити dashboard
railway open

# Список проектів
railway list

# Змінні оточення
railway variables

# Видалити проект (ОБЕРЕЖНО!)
railway delete
```

### Sleep Controller:

```bash
# Статус на messenger
ssh root@64.227.116.250 "systemctl status sleep-controller"

# Логи на messenger
ssh root@64.227.116.250 "journalctl -u sleep-controller -n 50"

# Перезапуск на messenger
ssh root@64.227.116.250 "systemctl restart sleep-controller"

# Зупинити (тимчасово відключити гібернацію)
ssh root@64.227.116.250 "systemctl stop sleep-controller"

# Запустити знову
ssh root@64.227.116.250 "systemctl start sleep-controller"
```

### Health Checks:

```bash
# Railway proxy health
curl https://ВАША-RAILWAY-URL.up.railway.app/health

# Messenger droplet health
curl https://messenger.kaminskyi.chat/api/health

# TURN droplet (якщо налаштований health endpoint)
curl http://64.226.72.235/health
```

### DigitalOcean API:

```bash
# Статус messenger дроплета
curl -H "Authorization: Bearer YOUR_DIGITALOCEAN_API_TOKEN" \
  https://api.digitalocean.com/v2/droplets/522123497 | python3 -m json.tool

# Ручний power on
curl -X POST \
  -H "Authorization: Bearer YOUR_DIGITALOCEAN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"power_on"}' \
  https://api.digitalocean.com/v2/droplets/522123497/actions

# Ручний power off (для тестування)
curl -X POST \
  -H "Authorization: Bearer YOUR_DIGITALOCEAN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"power_off"}' \
  https://api.digitalocean.com/v2/droplets/522123497/actions
```

## Порядок Виконання (Швидкий Чеклист)

- [ ] 1. `railway login` - Авторизація
- [ ] 2. `cd hibernation-proxy` - Перейти в директорію
- [ ] 3. `railway init` - Ініціалізувати проект
- [ ] 4. `railway variables set DO_API_TOKEN=...` - Встановити токен
- [ ] 5. `railway up` - Задеплоїти
- [ ] 6. `railway domain` - Отримати URL
- [ ] 7. `railway domain messenger.kaminskyi.chat` - Додати custom domain
- [ ] 8. Налаштувати DNS в CloudFlare
- [ ] 9. Зачекати 5-10 хвилин на DNS propagation
- [ ] 10. `curl https://messenger.kaminskyi.chat/health` - Перевірити
- [ ] 11. Встановити sleep-controller на обидва дроплети
- [ ] 12. Протестувати wake-up flow
- [ ] 13. Моніторити логи 24 години

## Очікувані Результати

✅ Railway проксі працює 24/7
✅ Health endpoint відповідає
✅ Дроплет засинає після 1 години неактивності
✅ Дроплет прокидається за ~15 секунд при запиті
✅ Економія 80-90% на хостингу

## Troubleshooting

**Railway не деплоїться:**
- Перевірте `railway logs`
- Перевірте що `package.json` існує
- Перевірте змінні: `railway variables`

**DNS не працює:**
- Переконайтесь що CloudFlare proxy ВИМКНЕНИЙ (сіра хмарка)
- Зачекайте 5-10 хвилин на DNS propagation
- Перевірте: `dig messenger.kaminskyi.chat`

**Дроплет не прокидається:**
- Перевірте Railway логи: `railway logs | grep Wake`
- Перевірте DO API токен
- Тест вручну через curl до DO API

**Sleep controller не працює:**
- Перевірте статус: `systemctl status sleep-controller`
- Перегляньте логи: `journalctl -u sleep-controller -n 100`
- Перезапустіть: `systemctl restart sleep-controller`

---

**Час виконання**: ~20 хвилин
**Складність**: Легко (Railway все робить автоматично)
**Результат**: Економія $230/рік на хостингу
