# 🔧 Виправлення DNS в Namecheap

## Проблема
`messenger.kaminskyi.chat` вказує на мертвий Railway proxy через CNAME запис.

## Рішення (5 хвилин)

### Крок 1: Зайти в Namecheap
1. Відкрити: https://www.namecheap.com/
2. Залогінитись
3. Account → Domain List

### Крок 2: Відкрити налаштування домену
1. Знайти домен: `kaminskyi.chat`
2. Натиснути кнопку **MANAGE** (праворуч від домену)

### Крок 3: Advanced DNS
1. Перейти на вкладку **Advanced DNS** (зверху)
2. Прокрутити до секції **Host Records**

### Крок 4: Видалити старий CNAME
Знайти запис:
```
Type: CNAME Record
Host: messenger
Value: hibernation-proxy-production.up.railway.app
```
**→ Натиснути іконку КОРЗИНИ (🗑️) → Delete**

### Крок 5: Додати новий A Record
Натиснути **ADD NEW RECORD**, заповнити:
```
Type: A Record
Host: messenger
Value: 64.227.116.250
TTL: Automatic
```
**→ Натиснути зелену галочку (✓) → Save**

### Крок 6: Зберегти зміни
Внизу сторінки натиснути: **SAVE ALL CHANGES**

### Крок 7: Зачекати
DNS оновиться за **1-5 хвилин**.

---

## Перевірка

Після збереження перевірте:
```bash
# Через 2-3 хвилини:
dig messenger.kaminskyi.chat +short

# Має показати:
64.227.116.250
```

Потім відкрийте в браузері:
```
https://messenger.kaminskyi.chat
```

---

## Тимчасовий доступ (до виправлення DNS)

Відкрийте прямо зараз:
```
http://64.227.116.250:8080
```

Або додайте в `/etc/hosts`:
```
64.227.116.250 messenger.kaminskyi.chat
```

---

✅ **Все інше вже готове і працює!**
- Сервер: v1.1.0-role-presets-ui
- Features: Interactive role presets, WebRTC optimization, тощо
- SSL: Certificates ready
