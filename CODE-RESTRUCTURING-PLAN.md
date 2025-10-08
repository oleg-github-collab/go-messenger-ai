# План Реструктуризації Коду

## 📊 Поточний Стан

### Проблеми:
1. **main.go** - 2030+ рядків (занадто великий!)
2. **call.js** - 900+ рядків
3. **notetaker.js** - 2450+ рядків (КРИТИЧНО!)
4. **webrtc.js** - 800+ рядків
5. Дублювання коду між файлами
6. Складно знайти конкретну функцію
7. Важко тестувати окремі модулі
8. Git conflicts при паралельній розробці

---

## 🎯 Цілі Реструктуризації

1. **Модульність** - кожен файл < 500 рядків
2. **Читабельність** - зрозуміла структура папок
3. **Підтримуваність** - легко знайти і змінити код
4. **Тестованість** - можливість unit тестів
5. **Масштабованість** - легко додавати нові функції

---

## 📁 Нова Структура Проекту

```
go-messenger/
├── cmd/
│   └── server/
│       └── main.go                    # Тільки bootstrap (50 рядків)
│
├── internal/                          # Backend (Go)
│   ├── config/
│   │   ├── config.go                  # Конфігурація
│   │   └── env.go                     # ENV variables
│   │
│   ├── models/
│   │   ├── meeting.go                 # Meeting struct
│   │   ├── participant.go             # Participant struct
│   │   ├── room.go                    # Room struct
│   │   └── notetaker.go               # Notetaker structs
│   │
│   ├── storage/
│   │   ├── redis.go                   # Redis client
│   │   └── memory.go                  # In-memory store
│   │
│   ├── handlers/
│   │   ├── auth.go                    # Auth handlers
│   │   ├── meeting.go                 # Meeting CRUD
│   │   ├── websocket.go               # WebSocket handler
│   │   ├── notetaker.go               # AI Notetaker handlers
│   │   ├── transcript.go              # Transcript save/load
│   │   └── health.go                  # Health check
│   │
│   ├── middleware/
│   │   ├── auth.go                    # Auth middleware
│   │   ├── cors.go                    # CORS middleware
│   │   └── logging.go                 # Request logging
│   │
│   ├── services/
│   │   ├── meeting_service.go         # Meeting business logic
│   │   ├── ai_service.go              # OpenAI integration
│   │   ├── turn_service.go            # TURN credentials
│   │   └── notification_service.go    # Email/SMS notifications
│   │
│   ├── websocket/
│   │   ├── hub.go                     # WebSocket hub
│   │   ├── client.go                  # Client connection
│   │   ├── message.go                 # Message types
│   │   └── handlers.go                # Message handlers
│   │
│   └── sfu/
│       ├── sfu.go                     # SFU server
│       ├── peer.go                    # Peer connection
│       └── track.go                   # Media track management
│
├── static/                            # Frontend (JS/CSS/HTML)
│   ├── pages/
│   │   ├── landing.html               # Landing page
│   │   ├── login.html                 # Login page
│   │   ├── home.html                  # Host dashboard
│   │   ├── guest.html                 # Guest entry
│   │   └── call.html                  # Call interface
│   │
│   ├── js/
│   │   ├── core/                      # Core functionality
│   │   │   ├── config.js              # Global config
│   │   │   ├── utils.js               # Utility functions
│   │   │   ├── api.js                 # API client
│   │   │   └── events.js              # Event bus
│   │   │
│   │   ├── webrtc/                    # WebRTC module
│   │   │   ├── manager.js             # Main WebRTC manager
│   │   │   ├── peer-connection.js     # RTCPeerConnection wrapper
│   │   │   ├── media-devices.js       # Camera/mic selection
│   │   │   ├── ice-handler.js         # ICE candidate handling
│   │   │   ├── signaling.js           # Offer/answer signaling
│   │   │   ├── quality-monitor.js     # Connection quality
│   │   │   └── adaptive-quality.js    # Adaptive bitrate
│   │   │
│   │   ├── call/                      # Call interface
│   │   │   ├── call-controller.js     # Main call logic
│   │   │   ├── ui-manager.js          # UI state management
│   │   │   ├── chat.js                # Chat functionality
│   │   │   ├── reactions.js           # Emoji reactions
│   │   │   ├── screen-share.js        # Screen sharing
│   │   │   └── recording.js           # Call recording
│   │   │
│   │   ├── notetaker/                 # AI Notetaker module
│   │   │   ├── notetaker-manager.js   # Main notetaker (300 lines)
│   │   │   ├── speech-recognition.js  # Speech-to-text
│   │   │   ├── transcript-store.js    # Transcript storage
│   │   │   ├── ai-analyzer.js         # AI analysis & highlighting
│   │   │   ├── editor.js              # Transcript editor
│   │   │   ├── role-presets.js        # Role preset logic
│   │   │   ├── audio-mixer.js         # Audio mixing
│   │   │   └── export.js              # Export/download
│   │   │
│   │   ├── ui/                        # UI components
│   │   │   ├── modal.js               # Modal dialogs
│   │   │   ├── notifications.js       # Toast notifications
│   │   │   ├── dropdown.js            # Dropdown menus
│   │   │   ├── tooltip.js             # Tooltips
│   │   │   └── settings-panel.js      # Settings UI
│   │   │
│   │   ├── guest/                     # Guest entry
│   │   │   ├── guest-controller.js    # Guest flow logic
│   │   │   └── device-setup.js        # Device selection
│   │   │
│   │   └── vendor/                    # Third-party libraries
│   │       ├── gif-picker.js          # GIF picker
│   │       └── emoji-picker.js        # Emoji picker
│   │
│   └── css/
│       ├── base/
│       │   ├── reset.css              # CSS reset
│       │   ├── variables.css          # CSS variables
│       │   └── typography.css         # Fonts
│       │
│       ├── components/
│       │   ├── buttons.css            # Button styles
│       │   ├── forms.css              # Form styles
│       │   ├── modals.css             # Modal styles
│       │   ├── cards.css              # Card styles
│       │   └── badges.css             # Badge styles
│       │
│       ├── pages/
│       │   ├── landing.css            # Landing page
│       │   ├── guest.css              # Guest entry
│       │   ├── call.css               # Call interface
│       │   └── notetaker.css          # Notetaker UI
│       │
│       └── utils/
│           ├── animations.css         # Animations
│           └── responsive.css         # Media queries
│
├── tests/                             # Tests
│   ├── unit/
│   │   ├── backend/
│   │   │   ├── meeting_service_test.go
│   │   │   ├── ai_service_test.go
│   │   │   └── websocket_test.go
│   │   │
│   │   └── frontend/
│   │       ├── webrtc.test.js
│   │       ├── notetaker.test.js
│   │       └── api.test.js
│   │
│   └── integration/
│       ├── call_flow_test.go
│       └── notetaker_flow_test.go
│
├── docs/                              # Documentation
│   ├── API.md                         # API documentation
│   ├── DEPLOYMENT.md                  # Deployment guide
│   ├── ARCHITECTURE.md                # Architecture overview
│   └── CONTRIBUTING.md                # Contribution guide
│
├── scripts/                           # Build/deploy scripts
│   ├── build.sh                       # Build script
│   ├── deploy.sh                      # Deployment script
│   ├── test.sh                        # Test runner
│   └── migrate.sh                     # DB migration
│
├── infrastructure/                    # Infrastructure as Code
│   ├── terraform/                     # Terraform configs
│   ├── docker/                        # Docker files
│   └── k8s/                           # Kubernetes manifests
│
├── go.mod
├── go.sum
├── README.md
└── .gitignore
```

---

## 🔄 Етапи Міграції

### Phase 1: Backend (Go) - Week 1

#### Day 1-2: Підготовка
```bash
# Створити нову структуру папок
mkdir -p internal/{config,models,storage,handlers,middleware,services,websocket,sfu}
mkdir -p cmd/server
```

#### Day 3-4: Розділити main.go
**main.go (2030 lines) → Розбити на:**

1. **cmd/server/main.go** (50 lines)
   - Bootstrap додатку
   - Ініціалізація конфігурації
   - Запуск HTTP сервера

2. **internal/config/config.go** (100 lines)
   - Завантаження ENV
   - Структура конфігурації
   - Валідація

3. **internal/models/** (150 lines total)
   - meeting.go - Meeting struct
   - participant.go - Participant struct
   - room.go - Room struct
   - notetaker.go - Notetaker structs

4. **internal/storage/redis.go** (200 lines)
   - Redis connection
   - Meeting CRUD operations
   - Session management

5. **internal/handlers/** (800 lines total)
   - auth.go - Login/logout handlers
   - meeting.go - Meeting create/get/update
   - websocket.go - WebSocket upgrade
   - notetaker.go - AI Notetaker endpoints
   - transcript.go - Transcript save/load
   - health.go - Health check

6. **internal/middleware/auth.go** (100 lines)
   - Auth middleware
   - Session validation

7. **internal/services/** (400 lines total)
   - meeting_service.go - Business logic
   - ai_service.go - OpenAI integration
   - turn_service.go - TURN credentials

8. **internal/websocket/** (300 lines)
   - hub.go - Connection hub
   - client.go - Client management
   - handlers.go - Message routing

#### Day 5: Тестування Backend
- Unit tests для кожного сервісу
- Integration tests для API endpoints
- Перевірка що все працює

---

### Phase 2: Frontend (JavaScript) - Week 2

#### Day 1-2: WebRTC Module
**webrtc.js (800 lines) → Розбити на:**

1. **js/webrtc/manager.js** (150 lines)
   - Main WebRTCManager class
   - Initialize/destroy lifecycle

2. **js/webrtc/peer-connection.js** (150 lines)
   - RTCPeerConnection wrapper
   - Track management

3. **js/webrtc/media-devices.js** (100 lines)
   - Camera/microphone selection
   - Device enumeration
   - Preview management

4. **js/webrtc/ice-handler.js** (80 lines)
   - ICE candidate handling
   - ICE restart logic

5. **js/webrtc/signaling.js** (120 lines)
   - Offer/answer creation
   - SDP exchange

6. **js/webrtc/quality-monitor.js** (100 lines)
   - Connection quality monitoring
   - Stats collection

7. **js/webrtc/adaptive-quality.js** (100 lines)
   - Adaptive bitrate control
   - Quality adjustment

#### Day 3-4: Call Interface
**call.js (900 lines) → Розбити на:**

1. **js/call/call-controller.js** (200 lines)
   - Main call lifecycle
   - WebSocket connection
   - Participant management

2. **js/call/ui-manager.js** (150 lines)
   - UI state management
   - Video layout
   - Status indicators

3. **js/call/chat.js** (100 lines)
   - Chat functionality
   - Message display

4. **js/call/reactions.js** (80 lines)
   - Emoji reactions
   - Animation handling

5. **js/call/screen-share.js** (120 lines)
   - Screen sharing
   - Display media handling

6. **js/call/recording.js** (100 lines)
   - Call recording
   - Media recorder API

#### Day 5-7: AI Notetaker Module
**notetaker.js (2450 lines) → Розбити на:** ⚠️ НАЙБІЛЬШИЙ ФАЙЛ!

1. **js/notetaker/notetaker-manager.js** (300 lines)
   - Main NotetakerManager class
   - Lifecycle management
   - UI coordination

2. **js/notetaker/speech-recognition.js** (250 lines)
   - Speech recognition setup
   - Real-time transcription
   - Language handling

3. **js/notetaker/transcript-store.js** (200 lines)
   - Transcript storage
   - Entry management
   - Conversation history

4. **js/notetaker/ai-analyzer.js** (300 lines)
   - AI sentiment analysis
   - Keyword detection
   - Color highlighting logic

5. **js/notetaker/editor.js** (400 lines)
   - Transcript editor UI
   - Entry rendering
   - AI comment display

6. **js/notetaker/role-presets.js** (200 lines)
   - Role preset logic
   - Preset selection
   - Analysis customization

7. **js/notetaker/audio-mixer.js** (300 lines)
   - Audio mixing
   - Remote stream handling
   - Audio context management

8. **js/notetaker/export.js** (200 lines)
   - Save to server
   - Download functionality
   - Format conversion

9. **js/notetaker/ui-controller.js** (300 lines)
   - Panel management
   - Pause/resume UI
   - Real-time display

---

### Phase 3: CSS Restructuring - Week 3 Day 1-2

**Розбити монолітні CSS файли:**

1. **css/base/** - базові стилі
2. **css/components/** - компоненти (кнопки, форми)
3. **css/pages/** - специфічні стилі сторінок
4. **css/utils/** - утиліти (анімації, responsive)

---

### Phase 4: HTML Pages - Week 3 Day 3

**Винести спільні компоненти:**

1. Створити template системмер (Go html/template)
2. Спільні header/footer
3. Переиспользуемые UI компоненти

---

### Phase 5: Testing & Documentation - Week 3 Day 4-5

1. Unit tests для кожного модуля
2. Integration tests
3. E2E tests (Playwright)
4. API documentation
5. Code documentation (JSDoc, GoDoc)

---

### Phase 6: Build System - Week 3 Day 6-7

1. **Webpack/Vite** для JavaScript bundling
2. **Rollup** для tree-shaking
3. **PostCSS** для CSS processing
4. **Minification** і compression
5. **Source maps** для debug
6. **Hot reload** для development

---

## 🛠️ Інструменти

### Backend (Go):
- **Wire** - dependency injection
- **Testify** - testing framework
- **Mockery** - mock generation
- **GoDoc** - documentation
- **golangci-lint** - linting

### Frontend (JavaScript):
- **Webpack/Vite** - bundler
- **ESLint** - linting
- **Prettier** - formatting
- **Jest** - unit testing
- **Playwright** - E2E testing
- **JSDoc** - documentation

### Build & Deploy:
- **Make** - build automation
- **Docker** - containerization
- **Terraform** - infrastructure
- **GitHub Actions** - CI/CD

---

## 📋 Міграційний Чеклист

### Backend:
- [ ] Створити internal/ structure
- [ ] Розбити main.go на модулі
- [ ] Додати dependency injection
- [ ] Написати unit tests
- [ ] Написати integration tests
- [ ] Оновити документацію
- [ ] Перевірити що все працює

### Frontend:
- [ ] Створити js/modules structure
- [ ] Розбити webrtc.js
- [ ] Розбити call.js
- [ ] Розбити notetaker.js (ПРІОРИТЕТ!)
- [ ] Налаштувати bundler
- [ ] Написати unit tests
- [ ] Написати E2E tests
- [ ] Мінімізація production bundle

### CSS:
- [ ] Розбити на base/components/pages
- [ ] CSS variables для кольорів
- [ ] Responsive utilities
- [ ] Animation library

### Build System:
- [ ] Налаштувати Webpack/Vite
- [ ] Hot reload для dev
- [ ] Production build optimization
- [ ] CI/CD pipeline

---

## 📊 Метрики Успіху

### Розмір Файлів:
| Файл | До | Після | Поліпшення |
|------|----|----|-----------|
| main.go | 2030 lines | <100 lines | 95% ↓ |
| call.js | 900 lines | <200 lines | 78% ↓ |
| notetaker.js | 2450 lines | <300 lines | 88% ↓ |
| webrtc.js | 800 lines | <150 lines | 81% ↓ |

### Code Quality:
- [ ] Test coverage > 80%
- [ ] No files > 500 lines
- [ ] Cyclomatic complexity < 10
- [ ] Documentation coverage > 90%

### Performance:
- [ ] Bundle size < 500KB (gzipped)
- [ ] First contentful paint < 1s
- [ ] Time to interactive < 2s
- [ ] Lighthouse score > 90

---

## 🚀 Quick Start (Після Міграції)

### Development:
```bash
# Backend
make dev-backend

# Frontend
make dev-frontend

# Both (parallel)
make dev
```

### Testing:
```bash
# Unit tests
make test-unit

# Integration tests
make test-integration

# E2E tests
make test-e2e

# All
make test
```

### Build:
```bash
# Development build
make build-dev

# Production build
make build-prod
```

### Deploy:
```bash
# Deploy to staging
make deploy-staging

# Deploy to production
make deploy-prod
```

---

## 💡 Переваги Після Реструктуризації

### 1. Швидкість Розробки:
- Легко знайти потрібний код
- Менше конфліктів у Git
- Паралельна розробка модулів

### 2. Якість Коду:
- Кожен модуль можна тестувати окремо
- Легше знайти баги
- Code review простіший

### 3. Продуктивність:
- Tree-shaking видаляє неиспользуемый код
- Code splitting для lazy loading
- Minification і compression

### 4. Підтримка:
- Нові розробники швидше розбираються
- Документація в кожному модулі
- Зрозуміла архітектура

### 5. Масштабованість:
- Легко додавати нові фічі
- Можна замінити окремі модулі
- Готовність до microservices

---

## ⚠️ Ризики і Мітігація

### Ризик 1: Зламати існуючу функціональність
**Мітігація:**
- Extensive testing на кожному етапі
- Feature flags для rollback
- Staging environment

### Ризик 2: Занадто довго
**Мітігація:**
- Розбити на малі інкременти
- 1 модуль = 1 день
- Continuous deployment

### Ризик 3: Breaking changes для users
**Мітігація:**
- Zero downtime deployment
- Backward compatibility
- Gradual rollout

---

## 📅 Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| Week 1 | Backend restructuring | Modular Go code |
| Week 2 | Frontend JS modules | Split JS files |
| Week 3 | CSS/HTML/Tests | Complete restructure |

**Total Time:** 3 weeks (15 робочих днів)
**Effort:** 1 developer full-time

---

**Створено:** 2025-10-08
**Автор:** Claude Code + Oleh Kaminskyi
**Версія:** 1.0
