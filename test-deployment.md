# Deployment Testing Checklist

## ✅ Завершені виправлення

### Backend (SFU):
- ✅ Додано TURN credentials до SFU peer connections
- ✅ Додано автоматичну renegotiation при додаванні нових треків
- ✅ Виправлено чат для групових дзвінків (підтримка private messages)
- ✅ Покращено логування для відлагодження

### Frontend (Group Calls):
- ✅ Додано обробку renegotiation offer від SFU
- ✅ Додано правильне прив'язування remote tracks до participant tiles
- ✅ Виправлено signaling state перевірки
- ✅ Додано детальне логування для відлагодження

### Mobile UI:
- ✅ Адаптовано групові дзвінки для мобільних (768px, 400px breakpoints)
- ✅ Адаптовано 1-on-1 дзвінки для мобільних
- ✅ Додано safe-area-inset для iPhone з вирізом
- ✅ Оптимізовано розміри кнопок для touch інтерфейсу

## 🧪 Тестування

### 1. Локальне тестування (перед deploy):
```bash
# Встановити змінні оточення
export REDIS_URL="redis://localhost:6379"
export TURN_HOST="157.245.20.158"
export TURN_USERNAME="kaminskyi-25a04450ce8b905b"
export TURN_PASSWORD="Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu"

# Запустити сервер
./main -addr=:8080
```

### 2. Перевірка функцій:

#### 1-on-1 дзвінки:
- [ ] Створити зустріч як host
- [ ] Приєднатися як guest
- [ ] Перевірити video/audio
- [ ] Перевірити camera flip
- [ ] Перевірити mute/unmute
- [ ] Перевірити чат
- [ ] Перевірити GIF
- [ ] Перевірити на мобільному браузері

#### Групові дзвінки:
- [ ] Створити групову зустріч
- [ ] Приєднатися з 3+ пристроїв
- [ ] Перевірити що всі бачать один одного
- [ ] Перевірити video/audio від всіх
- [ ] Перевірити чат (broadcast)
- [ ] Перевірити private messages
- [ ] Перевірити participant count
- [ ] Перевірити на мобільному браузері

### 3. Cross-browser тестування:
- [ ] Chrome Desktop
- [ ] Firefox Desktop
- [ ] Safari Desktop
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

## 🚀 Production Deployment

### Railway Environment Variables:
```
REDIS_URL=<Railway Redis URL>
TURN_HOST=157.245.20.158
TURN_USERNAME=kaminskyi-25a04450ce8b905b
TURN_PASSWORD=Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu
PORT=8080
```

### Deploy команди:
```bash
# 1. Commit changes
git add .
git commit -m "Fix SFU group calls, improve mobile UI, fix chat"

# 2. Push to Railway (auto-deploy)
git push origin main
```

## 📊 Очікувані результати:

### SFU Connection:
- Participants should see each other's video/audio
- Renegotiation should happen automatically when new tracks added
- TURN server should be used for NAT traversal

### Chat:
- Broadcast messages to everyone work
- Private messages to specific participants work
- Message display with sender name

### Mobile UI:
- All buttons visible and touchable on mobile
- Safe area respected on iPhone X+
- Grid layout adapts to screen size
- Controls properly sized for touch

## 🐛 Відомі обмеження:
- Максимум 20 учасників у груповому дзвінку
- Meetings expire after 8 hours
- Sessions expire after 24 hours

## 📝 Changelog:
- Fixed SFU renegotiation for multi-party calls
- Added TURN credentials to SFU peer connections
- Improved mobile UI responsiveness (group + 1-on-1)
- Fixed private messaging in group chat
- Enhanced logging for debugging
- Optimized touch targets for mobile devices
