
# 🤖 AI Notetaker Integration Guide

## Огляд

Універсальний AI Notetaker для 1-on-1 та групових дзвінків з:
- ✅ 14 role presets (General, Language Teacher, Therapist, Business Coach, тощо)
- ✅ Вибір учасників для запису (групові дзвінки)
- ✅ Real-time транскрипція з колірним кодуванням
- ✅ OpenAI інтеграція для AI insights
- ✅ Повний редактор транскрипту з можливістю редагування
- ✅ Кастомізація колірної схеми
- ✅ Share links для транскриптів
- ✅ Автозбереження
- ✅ Багатомовна підтримка

## Файлова Структура

```
static/
├── css/
│   └── notetaker-complete.css              # Всі стилі ноуттейкера
├── js/
│   ├── core/
│   │   ├── logger.js                       # Логування
│   │   ├── events.js                       # Event emitter
│   │   ├── storage.js                      # LocalStorage wrapper
│   │   ├── api.js                          # API client
│   │   └── dom.js                          # DOM helpers
│   └── notetaker/
│       ├── index-enhanced.js               # 🔥 ГОЛОВНИЙ модуль
│       ├── ui-manager.js                   # UI управління
│       ├── audio-mixer.js                  # Змішування аудіо стрімів
│       ├── recognition.js                  # Speech recognition
│       ├── transcription.js                # Управління транскриптом
│       ├── ai-analyzer-enhanced.js         # 🔥 AI аналіз + OpenAI
│       ├── persistence.js                  # Збереження/завантаження
│       ├── participant-selector.js         # 🔥 Вибір учасників (групи)
│       ├── full-transcript-viewer.js       # 🔥 Повний перегляд
│       └── color-scheme-editor.js          # 🔥 Редактор кольорів
└── notetaker-ui-component.html             # HTML компонент

Backend:
├── main.go                                  # Основний файл (routes додані)
└── notetaker_handlers.go                   # 🔥 НОВИЙ: OpenAI endpoints
```

## Швидкий Старт

### 1. Додати CSS до HTML сторінки

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Existing head content -->

    <!-- Notetaker CSS -->
    <link rel="stylesheet" href="/static/css/notetaker-complete.css">
</head>
```

### 2. Додати HTML компонент

Скопіюйте весь вміст `static/notetaker-ui-component.html` перед закриваючим `</body>` тегом.

### 3. Ініціалізувати в JavaScript

```javascript
import { createEnhancedNotetaker } from '/static/js/notetaker/index-enhanced.js';
import { globalEvents } from '/static/js/core/events.js';

// Отримати інформацію про кімнату
const roomID = getRoomIDFromURL(); // Ваша функція
const isHost = sessionStorage.getItem('isHost') === 'true';
const isGroupCall = false; // true для групових дзвінків

// Створити ноуттейкер
window.notetaker = createEnhancedNotetaker(roomID, isHost, isGroupCall);

// Ініціалізувати
await notetaker.initialize();

console.log('✅ Notetaker ready:', notetaker.getState());
```

### 4. Додати аудіо стріми

#### Для 1-on-1 дзвінків:

```javascript
// Коли локальний стрім готовий
globalEvents.on('webrtc:local-stream-ready', async (localStream) => {
    await notetaker.addAudioStream(localStream, 'local', 'You');
});

// Коли віддалений стрім готовий
globalEvents.on('webrtc:remote-stream-ready', async (remoteStream) => {
    await notetaker.addAudioStream(remoteStream, 'remote', 'Guest');
});
```

#### Для групових дзвінків:

```javascript
// Локальний учасник (себе)
const myUserID = 'user_123';
const myName = 'John Doe';

notetaker.addParticipant(myUserID, myName, localStream, true); // true = self
await notetaker.addAudioStream(localStream, myUserID, myName);

// Коли інші учасники приєднуються
socket.on('user-joined', async ({ userID, userName, stream }) => {
    // Додати до participant selector
    notetaker.addParticipant(userID, userName, stream, false);

    // Додати стрім (буде доданий до мікшера тільки якщо вибраний)
    await notetaker.addAudioStream(stream, userID, userName);
});

// Коли учасники виходять
socket.on('user-left', ({ userID }) => {
    notetaker.removeParticipant(userID);
});
```

### 5. Cleanup при виході

```javascript
window.addEventListener('beforeunload', async () => {
    await notetaker.cleanup();
});
```

## API Methods

### Основні методи

```javascript
// Ініціалізація
await notetaker.initialize();

// Контроль запису
await notetaker.startRecording();
await notetaker.stopRecording();
notetaker.pauseRecording();
notetaker.resumeRecording();

// Налаштування
notetaker.setLanguage('uk-UA');
notetaker.setRolePreset('therapist');
notetaker.setOpenAI(true, 'sk-your-api-key');

// Збереження
await notetaker.saveTranscript();
notetaker.downloadTranscript();

// Перегляд
notetaker.showFullTranscript();
notetaker.editColorScheme();

// Стан
const state = notetaker.getState();
const presets = notetaker.getRolePresets();

// Cleanup
await notetaker.cleanup();
```

### Методи для групових дзвінків

```javascript
// Учасники
notetaker.addParticipant(userID, name, stream, isSelf);
notetaker.removeParticipant(userID);

// Аудіо стріми
await notetaker.addAudioStream(stream, streamKey, participantName);
notetaker.removeAudioStream(streamKey);
```

## Events

Підписка на події:

```javascript
import { globalEvents } from '/static/js/core/events.js';

// Ноуттейкер події
globalEvents.on('notetaker:initialized', () => {
    console.log('Notetaker ready');
});

globalEvents.on('notetaker:recording-started', () => {
    console.log('Recording started');
});

globalEvents.on('notetaker:recording-stopped', ({ history, stats }) => {
    console.log(`Stopped: ${history.length} entries, ${stats.totalWords} words`);
});

globalEvents.on('notetaker:paused', () => {
    console.log('Recording paused');
});

globalEvents.on('notetaker:resumed', () => {
    console.log('Recording resumed');
});

// Транскрипція події
globalEvents.on('transcription:entry-added', (entry) => {
    console.log('New entry:', entry.text);
    console.log('Sentiment:', entry.sentiment);
    console.log('AI Comment:', entry.aiComment);
});

globalEvents.on('transcription:stats-updated', (stats) => {
    console.log('Duration:', stats.durationFormatted);
    console.log('Words:', stats.totalWords);
});

// Учасники (групові дзвінки)
globalEvents.on('participant-selector:selection-changed', ({ id, selected, selectedCount }) => {
    console.log(`${id} ${selected ? 'selected' : 'deselected'}`);
    console.log(`Total selected: ${selectedCount}`);
});

// Збереження
globalEvents.on('persistence:transcript-saved', ({ transcriptId, url }) => {
    console.log(`Saved: ${transcriptId}`);
    console.log(`URL: ${url}`);
});

// Share link
globalEvents.on('transcript-viewer:share-link-created', ({ url }) => {
    console.log(`Share link: ${url}`);
});

// Кольори
globalEvents.on('color-scheme:updated', (colors) => {
    console.log('Colors updated:', colors);
});
```

## Role Presets

14 доступних пресетів:

| ID | Name | Description | Особливості |
|----|------|-------------|-------------|
| `""` | 🎯 General Meeting | Загальні зустрічі | Action items, питання |
| `language-teacher` | 📚 Language Teacher | Навчання мов | Граматика, словник, вимова |
| `therapist` | 🧠 Therapist | Терапія/консультації | Емоції, breakthrough moments |
| `business-coach` | 💼 Business Coach | Бізнес-коучинг | Цілі, метрики, стратегія |
| `medical-consultant` | ⚕️ Medical Consultant | Медичні консультації | Симптоми, лікування |
| `tutor` | 🎓 Academic Tutor | Навчання/репетиторство | Розуміння концепцій |
| `sales-training` | 📈 Sales Training | Продажі/тренінги | Objections, buying signals |
| `interview` | 🎤 Job Interview | Співбесіди | Досвід, навички, досягнення |
| `legal-consultation` | ⚖️ Legal Consultation | Юридичні консультації | Терміни, дедлайни |
| `brainstorming` | 💡 Brainstorming | Мозковий штурм | Ідеї, інновації |
| `project-planning` | 📋 Project Planning | Планування проектів | Milestones, ресурси, ризики |
| `customer-support` | 🛟 Customer Support | Підтримка клієнтів | Проблеми, рішення |
| `performance-review` | 📊 Performance Review | Оцінка продуктивності | Досягнення, покращення |
| `investor-pitch` | 💰 Investor Pitch | Презентація інвесторам | Traction, ринок, funding |

## OpenAI Integration

### Backend Setup

1. Встановити змінну середовища:

```bash
export OPENAI_API_KEY="sk-your-openai-api-key"
```

2. Перезапустити сервер:

```bash
go run .
```

### Frontend Usage

```javascript
// Увімкнути OpenAI
notetaker.setOpenAI(true, 'sk-your-api-key'); // або null якщо на backend

// Перевірити стан
const state = notetaker.getState();
console.log('OpenAI enabled:', state.config.useOpenAI);
```

### Features з OpenAI:

1. **Real-time Analysis** - Покращений аналіз кожної реплікиї
2. **AI Insights** - Кнопка "Get AI Insights" в Full Transcript Viewer:
   - Summary
   - Key Points
   - Action Items
   - Questions Raised
   - Overall Sentiment
   - Recommendations

## Backend Endpoints

### OpenAI Endpoints

```
POST /api/openai/analyze
Body: {
    "prompt": "Analysis prompt",
    "text": "Text to analyze",
    "rolePreset": "therapist"
}
Response: {
    "success": true,
    "analysis": {
        "sentiment": "positive",
        "aiInsight": "...",
        "actionItems": [...],
        "keywords": [...]
    }
}
```

```
POST /api/openai/insights
Body: {
    "transcript": [...entries...],
    "rolePreset": "business-coach"
}
Response: {
    "success": true,
    "insights": {
        "summary": "...",
        "keyPoints": [...],
        "actionItems": [...],
        "questions": [...],
        "overallSentiment": "...",
        "sentimentDistribution": {...},
        "recommendations": [...]
    }
}
```

### Notetaker Endpoints

```
POST /api/notetaker/save
Body: {
    "transcript": [...entries...],
    "insights": {...},
    "rolePreset": "therapist",
    "metadata": {...}
}
Response: {
    "success": true,
    "transcriptId": "uuid",
    "url": "/transcript/uuid"
}
```

```
POST /api/notetaker/share
Body: {
    "transcript": [...entries...],
    "insights": {...},
    "rolePreset": "therapist"
}
Response: {
    "success": true,
    "shareId": "uuid",
    "shareUrl": "https://your-domain.com/shared-transcript/uuid"
}
```

```
GET /shared-transcript/{shareId}
Response: HTML сторінка з транскриптом (30 днів TTL)
```

## Customization

### Колірні Схеми

8 готових пресетів:
- Default
- Vibrant
- Pastel
- Dark Mode
- Ocean
- Sunset
- Forest
- Purple Dream

Або створити власну:

```javascript
notetaker.editColorScheme(); // Відкриває редактор

// Або програмно:
const customColors = {
    positive: '#22c55e',
    negative: '#ef4444',
    question: '#3b82f6',
    action: '#f59e0b',
    neutral: '#6b7280'
};

notetaker.aiAnalyzer.setCustomColors(customColors);
```

### Мови

Підтримка Web Speech API:
- English (US, UK, AU, etc.)
- Українська
- Español
- Français
- Deutsch
- Italiano
- Português
- Русский
- Polski
- Čeština
- І багато інших

## Приклад Повної Інтеграції

### call-modular.html

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Call - Messenger</title>

    <!-- Existing CSS -->
    <link rel="stylesheet" href="/static/css/base/variables.css">
    <link rel="stylesheet" href="/static/css/base/reset.css">

    <!-- Notetaker CSS -->
    <link rel="stylesheet" href="/static/css/notetaker-complete.css">
</head>
<body>
    <!-- Existing call UI -->
    <div id="videoContainer">
        <!-- Video elements, controls, etc. -->
    </div>

    <!-- Notetaker UI Component -->
    <!-- Paste full content of notetaker-ui-component.html here -->

    <script type="module">
        import { createEnhancedNotetaker } from '/static/js/notetaker/index-enhanced.js';
        import { WebRTCManager } from '/static/js/webrtc/index.js';
        import { globalEvents } from '/static/js/core/events.js';

        const roomID = getRoomIDFromURL();
        const isHost = sessionStorage.getItem('isHost') === 'true';

        // Initialize WebRTC
        const webrtc = new WebRTCManager(socket, roomID);
        const { localStream } = await webrtc.initialize();

        // Initialize Notetaker
        window.notetaker = createEnhancedNotetaker(roomID, isHost, false);
        await notetaker.initialize();

        // Add local stream
        await notetaker.addAudioStream(localStream, 'local', 'You');

        // Add remote stream when ready
        globalEvents.on('remote-stream-ready', async (stream) => {
            await notetaker.addAudioStream(stream, 'remote', 'Guest');
        });

        // Cleanup
        window.addEventListener('beforeunload', async () => {
            await notetaker.cleanup();
        });
    </script>
</body>
</html>
```

## Troubleshooting

### Notetaker не з'являється

```javascript
// Перевірити чи є host
console.log('Is host:', notetaker.isHost);

// Якщо не host, UI буде прихована
// Показати вручну:
notetaker.ui.show();
```

### Speech Recognition не працює

```javascript
// Перевірити підтримку браузера
if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Browser does not support Speech Recognition');
}

// Перевірити permissions
navigator.permissions.query({ name: 'microphone' }).then((result) => {
    console.log('Microphone permission:', result.state);
});
```

### OpenAI не відповідає

```javascript
// Перевірити API key
console.log('OpenAI enabled:', notetaker.config.useOpenAI);
console.log('Has API key:', !!notetaker.config.openAIKey);

// Перевірити backend
fetch('/api/openai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        prompt: 'Test',
        text: 'Hello world',
        rolePreset: ''
    })
}).then(r => r.json()).then(console.log);
```

### Participant Selector не показується

```javascript
// Тільки для групових дзвінків
console.log('Is group call:', notetaker.isGroupCall);

// Якщо потрібно показати:
document.getElementById('notetakerParticipantSelector').classList.remove('hidden');
```

## Performance Tips

1. **Обмежити кількість учасників для запису** - У великих групах виберіть тільки ключових спікерів
2. **Використовувати локальний аналіз** - OpenAI швидший але потребує інтернет і коштує гроші
3. **Auto-save інтервал** - За замовчуванням 60 секунд, можна збільшити для великих транскриптів

```javascript
notetaker.config.autoSaveInterval = 120000; // 2 хвилини
```

## Готово! 🎉

Тепер у вас є повністю функціональний AI Notetaker з:
- ✅ 14 role presets
- ✅ Real-time транскрипція з AI
- ✅ OpenAI інтеграція
- ✅ Вибір учасників (групи)
- ✅ Повний редактор
- ✅ Share links
- ✅ Кастомізація

**Приклади використання:**
- `/test-modular` - Швидкий тест
- `/room-modular/{roomID}` - 1-on-1 дзвінок
- `/group-call/{roomID}` - Груповий дзвінок (коли буде готовий)

**Наступні кроки:**
1. Додати до call-modular.html
2. Створити group-call-modular.html
3. Тестувати різні сценарії
4. Зібрати та задеплоїти

Успіхів! 🚀
