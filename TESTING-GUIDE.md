# Testing Guide - Modular WebRTC Implementation

## 🎯 Як протестувати нову модульну версію

### Крок 1: Створити meeting через стандартний інтерфейс

1. Відкрити https://kaminskyi.chat
2. Залогінитись (Oleh / QwertY24$)
3. Натиснути "Start New Call"
4. Скопіювати посилання для гостя (наприклад: `https://kaminskyi.chat/room/abc123xyz`)

### Крок 2: Відкрити модульну версію

**Замість старого URL:**
```
https://kaminskyi.chat/room/abc123xyz
```

**Використати модульний URL:**
```
https://kaminskyi.chat/room-modular/abc123xyz
```

> ⚠️ ВАЖЛИВО: Просто додайте `-modular` після `room`

### Крок 3: Тестування в двох вкладках

**Вкладка 1 (Хост):**
```
https://kaminskyi.chat/room-modular/abc123xyz
```

**Вкладка 2 (Гість):**
```
https://kaminskyi.chat/room-modular/abc123xyz
```

---

## 🔍 Debug інформація

### Що побачите на сторінці:

**Ліворуч зверху - Debug Panel:**
- 🟢 Зелений текст = Успіх
- 🔴 Червоний текст = Помилка
- ⚪ Білий текст = Інформація
- 🟡 Жовтий текст = Попередження

**Праворуч зверху - Connection Status:**
- "Connecting..." - З'єднання встановлюється
- "Connected" - З'єднання успішне
- "Failed" - Помилка з'єднання

### Що має працювати:

✅ **Media Access:**
- Запит дозволу на камеру/мікрофон
- Локальне відео в малому вікні (праворуч зверху)

✅ **WebRTC Connection:**
- Автоматичне з'єднання через WebSocket
- ICE candidate обмін
- Встановлення peer connection

✅ **Remote Video:**
- Відео співрозмовника на весь екран
- Синхронізація аудіо/відео

✅ **Controls:**
- Кнопка End Call (червона, знизу по центру)
- Toggle Camera (праворуч)
- Toggle Microphone (праворуч)
- Back button (ліворуч зверху)

✅ **Call Timer:**
- Таймер викликі (зверху по центру)
- Формат: MM:SS

---

## 🐛 Що перевіряти

### Сценарій 1: Базове з'єднання
1. Відкрити в двох браузерах/вкладках
2. Перевірити що обидва бачать один одного
3. Перевірити що чується звук
4. Перевірити що відео синхронізовано

### Сценарій 2: Controls
1. Вимкнути камеру - має зникнути відео
2. Увімкнути назад - має з'явитись
3. Вимкнути мікрофон - має пропасти звук
4. End Call - має закрити з'єднання

### Сценарій 3: Reconnection
1. Закрити одну вкладку
2. Status має показати "Disconnected"
3. Відкрити знову - має переконнектитись

### Сценарій 4: Різні браузери
- Chrome + Chrome
- Chrome + Firefox
- Chrome + Safari
- Mobile Safari + Desktop Chrome

### Сценарій 5: Різні мережі
- Локальна мережа (LAN)
- Різні WiFi мережі
- Mobile 4G/5G
- Germany ↔ Ukraine (критично!)

---

## 📊 Що логується в Debug Panel

```
[HH:MM:SS] Starting initialization...
[HH:MM:SS] Room ID: abc123xyz
[HH:MM:SS] Video controls initialized
[HH:MM:SS] Connection status initialized
[HH:MM:SS] Socket connected
[HH:MM:SS] Socket ready, initializing WebRTC...
[HH:MM:SS] Requesting media...
[HH:MM:SS] Media acquired
[HH:MM:SS] Waiting for peer connection...
[HH:MM:SS] Connection state: connecting
[HH:MM:SS] Connection state: connected
[HH:MM:SS] Remote stream ready
```

---

## ❌ Можливі помилки

### "No room ID found in URL"
- Перевірте що URL правильний: `/room-modular/abc123`
- Room ID має бути після `/room-modular/`

### "Camera/Microphone access denied"
- Натисніть "Allow" коли браузер запитує дозвіл
- Перевірте налаштування браузера (Settings > Privacy)
- Переконайтесь що сайт використовує HTTPS

### "Socket connection error"
- Перевірте інтернет з'єднання
- Переконайтесь що сервер працює
- Спробуйте перезавантажити сторінку

### "Failed to initialize WebRTC"
- Перевірте чи підтримує браузер WebRTC
- Спробуйте інший браузер (Chrome, Firefox)
- Перевірте firewall налаштування

### "Connection state: failed"
- TURN сервер може бути недоступний
- Спробуйте з іншої мережі
- Перевірте чи не блокує корпоративний firewall

---

## 🔧 Server Logs

Щоб побачити server-side логи:

```bash
ssh root@64.227.116.250
journalctl -u messenger -f
```

Шукайте рядки з `[ROOM-MODULAR]`:
```
[ROOM-MODULAR] 📱 Request for room: abc123
[ROOM-MODULAR] ✅ Meeting found and active
[ROOM-MODULAR] 🚀 Serving call-modular.html
```

---

## 📝 Що репортувати

При знаходженні проблем, вкажіть:

1. **URL** який використовували
2. **Браузер** і версія (Chrome 119, Firefox 120, etc)
3. **OS** (Windows 11, macOS 14, Ubuntu 22.04, iOS 17)
4. **Мережа** (WiFi, 4G, VPN, Corporate)
5. **Debug log** - скріншот debug panel
6. **Connection Status** - що показав статус
7. **Console errors** (F12 → Console tab)
8. **Що очікували** vs **що сталось**

---

## ✅ Success Criteria

Тест вважається успішним якщо:

- ✅ Обидва учасники бачать відео один одного
- ✅ Чути аудіо з обох сторін
- ✅ Відео не лагає
- ✅ Controls працюють (camera/mic toggle)
- ✅ Connection встановлюється < 5 секунд
- ✅ Працює на різних браузерах
- ✅ Працює Germany ↔ Ukraine

---

## 🚀 Production Deployment Plan

Після успішних тестів:

1. **Phase 1:** Тестування модульної версії (поточний етап)
2. **Phase 2:** Виправлення знайдених багів
3. **Phase 3:** Додавання AI Notetaker до модульної версії
4. **Phase 4:** Повна міграція - замінити `/room/` на модульний код
5. **Phase 5:** Видалити старий монолітний код

---

**ВАЖЛИВО:** Поточна версія `/room/` (стара) продовжує працювати як раніше.
Модульна версія `/room-modular/` - це окрема тестова версія для перевірки нового коду.
