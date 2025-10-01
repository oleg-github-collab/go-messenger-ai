# 🧪 Testing Guide - Kaminskyi Messenger

## Швидка перевірка після деплою

### 1. Базова перевірка (2 хв)

**Login Test:**
```
URL: https://your-app.railway.app/login
Username: Oleh
Password: QwertY24$
```

✅ Має перенаправити на головну сторінку
✅ Має показати "Video Meetings" як заголовок
✅ Кнопка "Create Meeting" має бути видимою

### 2. Створення зустрічі (3 хв)

**Крок 1:** Натисніть "Create Meeting"
✅ Має відкритись модальне вікно з двома опціями:
- "1-on-1 Call" (👥)
- "Group Call" (👨‍👩‍👧‍👦)

**Крок 2:** Введіть своє ім'я (наприклад "Oleh")

**Крок 3:** Виберіть "1-on-1 Call"
✅ Модалка має закритись
✅ Кнопка має показати "Creating..."
✅ Має з'явитись Share Link секція з URL
✅ URL має бути типу: `https://your-app.railway.app/join/UUID`

**Крок 4:** Скопіюйте link і відкрийте в інкогніто/іншому браузері

### 3. Guest Join Flow (5 хв)

**Відкрийте link як гість:**

✅ Має показати сторінку "Join Meeting"
✅ Має бути поле "Your Name"
✅ Має бути video preview (якщо камера дозволена)
✅ Checkbox "Join with Video" та "Join with Audio"
✅ Селектори камери та мікрофона

**Введіть ім'я і натисніть "Join Meeting":**

✅ Має перенаправити на `/room/UUID`
✅ Має показати waiting room modal "Waiting for Host"
✅ Гість має чекати approval

### 4. Host Approval (2 хв)

**На сторінці хоста (перший браузер):**

✅ Має з'явитись Join Request modal
✅ Має показати ім'я гостя
✅ Має відтворитись звуковий сигнал
✅ Кнопки "Admit" та "Reject"

**Натисніть "Admit":**

✅ Modal має зникнути
✅ Гість має приєднатись до дзвінка
✅ Відео обох учасників має відобразитись

### 5. 1-on-1 Call Features (5 хв)

**Тестуйте кнопки:**

✅ Camera toggle (on/off)
✅ Microphone toggle (on/off)
✅ Chat (відкриття панелі)
✅ Settings (emoji, gif, screen share)
✅ End Call (має перенаправити на головну)

**Перевірте chat:**

✅ Відправте повідомлення
✅ Має з'явитись в обох вікнах
✅ Emoji picker працює
✅ GIF search працює

### 6. Group Call Test (10 хв)

**Створіть group meeting:**

1. Logout → Login
2. Create Meeting
3. Виберіть "Group Call"
4. Отримайте link

**Відкрийте в 3+ вкладках/браузерах:**

✅ Всі учасники бачать один одного
✅ Grid layout адаптується (2x1, 2x2, 3x2, etc.)
✅ Participant count відображається правильно
✅ Camera/Mic controls працюють для кожного
✅ Call timer працює

---

## Детальне тестування

### A. TURN Server Test

**Використайте Trickle ICE:**
```
URL: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/

TURN URI: turn:157.245.20.158:3478
Username: kaminskyi-25a04450ce8b905b
Credential: Q2dzXnKfA8WYhO6HRV3TUhldD0DRQZMu
```

✅ Gather candidates
✅ Має показати `relay` candidates
✅ Якщо є relay - TURN працює!

### B. WebSocket Connection Test

**Відкрийте Browser DevTools (F12) → Network → WS:**

**Для 1-on-1:**
✅ З'єднання до `/ws?room=UUID&name=NAME`
✅ Status: 101 Switching Protocols
✅ Messages: offer, answer, ice-candidate

**Для групових:**
✅ З'єднання до `/ws-sfu?room=UUID&name=NAME`
✅ Messages: joined, participants-list, participant-joined

### C. Redis Connection Test

**В Railway Dashboard:**
1. Go to Redis service
2. Check Metrics
3. Should see:
   - Connected clients > 0
   - Commands/sec > 0
   - Memory usage increasing with meetings

### D. Performance Test

**Stress test з 10 учасниками:**

1. Відкрийте group call
2. Join з 10 різних вкладок (різні імена)
3. Перевірте:
   - ✅ CPU usage < 80%
   - ✅ Відео не лагає
   - ✅ Audio синхронізовано
   - ✅ Grid layout правильний (4x3)

---

## Troubleshooting

### ❌ "Failed to create meeting"

**Причина:** Auth проблеми

**Fix:**
1. Очистіть cookies
2. Logout → Login знову
3. Перевірте Railway logs для auth errors

### ❌ Waiting room не показується

**Причина:** WebSocket не підключається

**Fix:**
1. F12 → Console → перевірте errors
2. Перевірте `/ws` endpoint доступний
3. Перевірте Railway logs

### ❌ No video/audio

**Причина:** Browser permissions або WebRTC issue

**Fix:**
1. Дайте permissions для camera/mic
2. Перевірте TURN server working (Trickle ICE test)
3. Спробуйте інший браузер (Chrome recommended)

### ❌ Group call shows call.html instead of group-call.html

**Причина:** Meeting mode не збережено в Redis

**Check Railway logs:**
```
[ROOM] Mode detected: group
[ROOM] Serving group-call.html
```

Якщо бачите "1on1" - перевірте:
1. Redis connection в Railway
2. REDIS_URL environment variable
3. Meeting creation logs

### ❌ TURN server not working

**SSH to server:**
```bash
ssh root@157.245.20.158
systemctl status coturn
journalctl -u coturn -f
```

**Check coturn running:**
```bash
ps aux | grep turnserver
```

**Restart if needed:**
```bash
systemctl restart coturn
```

---

## Browser DevTools Debugging

### Console должен показувати:

**Home page:**
```
[HOME] Page loaded
[HOME] Create meeting response: 200
[HOME] ✅ Meeting URL: https://...
[HOME] URL auto-copied
```

**Guest page:**
```
[GUEST] Page loaded
[GUEST] Preview started
```

**Call page:**
```
[CALL] Page loaded
[WS] ✅ Connected
[WS] 📨 Received: joined
[WebRTC] ✅ Offer sent
[WebRTC] ✅ Answer received
[WebRTC] ✅ ICE connected
```

### Network tab має показувати:

- ✅ `/create` → 200 OK → Response: URL
- ✅ `/ws` або `/ws-sfu` → 101 Switching Protocols
- ✅ Static files (JS, CSS) → 200 OK
- ✅ No 404 errors

---

## Acceptance Criteria

### ✅ Must Work:

- [ ] Login with Oleh / QwertY24$
- [ ] Create 1-on-1 meeting
- [ ] Create group meeting
- [ ] Guest can join via link
- [ ] Waiting room appears for guest
- [ ] Host can approve/reject guest
- [ ] Video/audio works both directions
- [ ] Chat works
- [ ] Camera/mic toggle works
- [ ] End call works
- [ ] Group call supports 3+ people
- [ ] Grid layout adapts correctly
- [ ] TURN server provides relay candidates

### ⚠️ Known Issues (acceptable):

- First meeting might take 2-3 sec to establish (ICE gathering)
- Mobile Safari may need manual camera permission
- Very old browsers (IE) not supported

---

## Performance Benchmarks

### Expected metrics:

**1-on-1 call:**
- Setup time: < 3 seconds
- Video latency: < 200ms
- Audio latency: < 100ms
- CPU usage: < 30%

**Group call (5 people):**
- Setup time: < 5 seconds
- Video latency: < 500ms
- CPU usage: < 60%

**Group call (20 people):**
- Setup time: < 10 seconds
- Video latency: < 1s
- CPU usage: < 80%

---

**Happy Testing! 🧪**
