# Modular Code Structure

## Overview

This document describes the new modular code organization for the messenger application. The goal is to split large monolithic files into smaller, maintainable modules while preserving all existing functionality.

## Status: Phase 1 Complete ✅

**Phase 1** (Safe foundation) has been completed:
- ✅ Folder structure created
- ✅ Base CSS modules (variables, reset, animations)
- ✅ Core JS utilities (logger, storage, events, API, DOM)

**Phase 2-3** (Migration) is pending to avoid breaking existing code.

---

## Directory Structure

```
static/
├── css/
│   ├── base/              # Foundation styles
│   │   ├── variables.css  # CSS custom properties
│   │   └── reset.css      # CSS reset and base styles
│   ├── components/        # Reusable UI components (future)
│   ├── pages/             # Page-specific styles (future)
│   ├── utils/             # Utility styles
│   │   └── animations.css # Keyframe animations
│   └── main.css           # Main CSS entry point
│
├── js/
│   ├── core/              # Core utilities (READY TO USE)
│   │   ├── logger.js      # Centralized logging
│   │   ├── storage.js     # localStorage/sessionStorage wrapper
│   │   ├── events.js      # Event emitter for pub/sub
│   │   ├── api.js         # API client with error handling
│   │   ├── dom.js         # DOM manipulation helpers
│   │   └── index.js       # Core module exports
│   ├── webrtc/            # WebRTC modules (future migration)
│   ├── call/              # Call page modules (future migration)
│   ├── notetaker/         # AI Notetaker modules (future migration)
│   ├── ui/                # UI components (future migration)
│   └── guest/             # Guest page modules (future migration)
│
└── [existing files remain unchanged]
```

---

## Core Utilities (Available Now)

### Logger (`js/core/logger.js`)

Centralized logging with prefixes and emoji indicators.

```javascript
import { Logger, loggers } from '/static/js/core/logger.js';

// Use pre-configured loggers
loggers.webrtc.log('Connection established');    // [WEBRTC] Connection established
loggers.notetaker.success('Recording started');  // [NOTETAKER] ✅ Recording started
loggers.call.error('Failed to connect');         // [CALL] ❌ Failed to connect

// Create custom logger
const logger = new Logger('MY-MODULE');
logger.info('Initialized');     // [MY-MODULE] ℹ️ Initialized
logger.warn('Slow response');   // [MY-MODULE] ⚠️ Slow response
logger.debug('State:', state);  // [MY-MODULE] 🔍 State: {...}
```

### Storage (`js/core/storage.js`)

Unified localStorage/sessionStorage with JSON serialization.

```javascript
import { localStore, sessionStore } from '/static/js/core/storage.js';

// Local storage (persists across sessions)
localStore.set('userPrefs', { theme: 'dark', lang: 'en' });
const prefs = localStore.get('userPrefs', { theme: 'light' }); // with default

// Session storage (cleared on tab close)
sessionStore.set('guestName', 'John Doe');
const name = sessionStore.get('guestName');

// Check existence
if (localStore.has('userPrefs')) { /* ... */ }

// Remove
localStore.remove('userPrefs');
```

### Event Emitter (`js/core/events.js`)

Pub/sub pattern for inter-module communication.

```javascript
import { EventEmitter, globalEvents } from '/static/js/core/events.js';

// Subscribe to events
globalEvents.on('call:connected', (peer) => {
    console.log('Peer connected:', peer);
});

// Emit events from anywhere
globalEvents.emit('call:connected', { id: 'peer-123', name: 'John' });

// One-time listener
globalEvents.once('call:ended', () => {
    console.log('Call ended');
});

// Unsubscribe
const unsubscribe = globalEvents.on('message', handler);
unsubscribe(); // Remove listener
```

### API Client (`js/core/api.js`)

Centralized API calls with error handling.

```javascript
import { api } from '/static/js/core/api.js';

// GET request
const meeting = await api.get('/meeting/room-123');

// POST request
const result = await api.post('/transcript/save', {
    room_id: 'room-123',
    transcript: [...]
});

// Error handling
try {
    await api.post('/notetaker/start', { room_id: 'xyz' });
} catch (error) {
    if (error.status === 403) {
        console.log('Unauthorized');
    }
}
```

### DOM Helpers (`js/core/dom.js`)

Utility functions for DOM manipulation.

```javascript
import { $, $$, createElement, show, hide, escapeHtml } from '/static/js/core/dom.js';

// Query selectors (shorthand)
const button = $('#myButton');
const items = $$('.list-item');

// Create elements
const div = createElement('div',
    { class: 'card', id: 'card-1' },
    ['Hello ', createElement('strong', {}, ['World'])]
);

// Show/hide
show('#modal');
hide('#modal');

// Escape HTML (prevent XSS)
element.innerHTML = escapeHtml(userInput);
```

---

## CSS Variables

All colors, spacing, and design tokens are now centralized in `css/base/variables.css`:

```css
/* Use in your CSS */
.my-button {
    background: var(--color-primary);
    padding: var(--spacing-lg);
    border-radius: var(--radius-md);
    transition: all var(--transition-normal);
}

.my-button:hover {
    background: var(--color-primary-dark);
    box-shadow: var(--shadow-lg);
}
```

**Available variables:**
- Colors: `--color-primary`, `--color-success`, `--color-warning`, `--color-danger`
- Backgrounds: `--color-bg-primary`, `--color-bg-secondary`
- Text: `--color-text-primary`, `--color-text-secondary`
- Spacing: `--spacing-xs` through `--spacing-2xl`
- Radius: `--radius-sm` through `--radius-xl`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Transitions: `--transition-fast`, `--transition-normal`, `--transition-slow`

---

## Animations

Reusable animations in `css/utils/animations.css`:

```css
/* Apply utility classes */
.my-element {
    /* Use predefined animations */
    animation: fadeIn 300ms ease;
    animation: slideInUp 300ms ease;
    animation: pulse-glow 2s ease-in-out infinite;
}

/* Or use utility classes */
<div class="animate-fade-in">...</div>
<div class="animate-slide-in-up">...</div>
```

**Available animations:**
- `fadeIn` / `fadeOut`
- `slideInUp` / `slideInDown`
- `pulse-glow`
- `shimmer`
- `spin`
- `bounce`

---

## Migration Guide

### Using Core Utilities in Existing Code

The new utilities are **backward compatible**. You can start using them in existing files:

**Example: Migrating console.log to Logger**

```javascript
// OLD CODE (still works)
console.log('[WEBRTC] Creating offer...');
console.error('[WEBRTC] ❌ Connection failed:', error);

// NEW CODE (better)
import { loggers } from '/static/js/core/logger.js';
loggers.webrtc.log('Creating offer...');
loggers.webrtc.error('Connection failed:', error);
```

**Example: Migrating localStorage to Storage**

```javascript
// OLD CODE (still works)
const preset = localStorage.getItem('notetaker_role_preset');
localStorage.setItem('notetaker_role_preset', 'interviewer');

// NEW CODE (better - handles JSON automatically)
import { localStore } from '/static/js/core/storage.js';
const preset = localStore.get('notetaker_role_preset');
localStore.set('notetaker_role_preset', 'interviewer');
```

---

## Next Steps (Phase 2-3 - Not Started)

**⚠️ DO NOT proceed with these steps without user approval:**

1. **Extract CSS Components** (Week 1)
   - Create `css/components/buttons.css`
   - Create `css/components/modals.css`
   - Extract from existing CSS files

2. **Split notetaker.js** (Week 2)
   - `notetaker/core.js` - Main class
   - `notetaker/recognition.js` - Speech recognition
   - `notetaker/transcription.js` - Transcript management
   - `notetaker/ai-analysis.js` - AI highlighting
   - `notetaker/ui.js` - UI components
   - `notetaker/editor.js` - Transcript editor
   - `notetaker/persistence.js` - Save/load

3. **Split call.js, guest.js, group-call.js** (Week 3)

---

## Important Notes

✅ **Safe to use now:**
- All `js/core/*` modules
- All `css/base/*` and `css/utils/*` styles
- Import in any new code

⚠️ **Not ready yet:**
- Component modules (buttons, modals, etc.)
- Page-specific modules
- Splitting existing large files

🔒 **Existing code unchanged:**
- All current `.js` and `.css` files work exactly as before
- No breaking changes introduced
- Can be adopted gradually

---

## Benefits

1. **Easier Maintenance** - Find code faster, smaller files
2. **Reusability** - Use utilities across all modules
3. **Type Safety** - ESM imports enable better IDE support
4. **Performance** - Tree-shaking removes unused code
5. **Testing** - Isolated modules easier to test
6. **Collaboration** - Multiple devs can work on different modules

---

## Questions?

See [CODE-RESTRUCTURING-PLAN.md](../CODE-RESTRUCTURING-PLAN.md) for the complete 3-week migration plan.
