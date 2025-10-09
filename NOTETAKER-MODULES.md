# AI Notetaker Modular Architecture

## Overview

The AI Notetaker has been refactored into a complete modular system with 6 specialized modules working together through event-driven architecture.

## Module Structure

```
static/js/notetaker/
├── index.js              # Main orchestrator - coordinates all modules
├── ui-manager.js         # UI layer - all DOM manipulation and display
├── audio-mixer.js        # Audio layer - WebAudio API for mixing streams
├── recognition.js        # Speech-to-text using Web Speech API
├── transcription.js      # Data layer - conversation history management
├── ai-analysis.js        # AI layer - sentiment, keywords, role presets
└── persistence.js        # Storage layer - save/load/download transcripts
```

## Module Responsibilities

### 1. **index.js** - Main Orchestrator
**Purpose:** Coordinates all notetaker modules and manages state

**Key Features:**
- Initializes all modules in correct order
- Manages recording state (start/stop/pause/resume)
- Routes events between modules
- Handles audio stream management
- Provides public API for external integration

**Usage:**
```javascript
import { createNotetaker } from '/static/js/notetaker/index.js';

const notetaker = createNotetaker(roomID, isHost);
await notetaker.initialize();

// Start recording
await notetaker.startRecording();

// Add audio streams for transcription
await notetaker.addAudioStream(localStream, 'local');
await notetaker.addAudioStream(remoteStream, 'remote');

// Change language
notetaker.setLanguage('uk-UA');

// Change role preset
notetaker.setRolePreset('therapist');

// Stop and save
await notetaker.stopRecording();
await notetaker.saveTranscript();
```

### 2. **ui-manager.js** - UI Layer
**Purpose:** All DOM manipulation and visual updates

**Key Features:**
- Recording state visualization (recording/paused/stopped)
- Real-time transcript display with sentiment highlighting
- Editor modal for reviewing/editing transcripts
- Stats display (duration, word count)
- Panel collapse/expand functionality
- Save notifications

**Public Methods:**
```javascript
ui.show()                           // Show panel (host only)
ui.hide()                           // Hide panel
ui.setRecordingState(isRecording)   // Update recording UI
ui.setPausedState(isPaused)         // Update pause UI
ui.addTranscriptEntry(entry)        // Add entry to live transcript
ui.updateStats(duration, wordCount) // Update stats display
ui.showEditor()                     // Show editor modal
ui.populateEditor(history)          // Fill editor with transcript
ui.showSaveNotification(id)         // Show save success notification
```

### 3. **audio-mixer.js** - Audio Layer
**Purpose:** Mix multiple audio streams for transcription

**Key Features:**
- WebAudio API integration
- Combine local + remote audio streams
- Dynamic stream addition/removal
- Automatic gain control

**Public Methods:**
```javascript
await audioMixer.addStream(stream, 'local')    // Add stream
audioMixer.removeStream('local')               // Remove stream
const mixedStream = audioMixer.getStream()     // Get mixed output
audioMixer.cleanup()                           // Cleanup resources
```

**How it works:**
```
LocalStream ──┐
              ├──> AudioContext ──> Destination ──> Mixed Stream ──> Recognition
RemoteStream ─┘
```

### 4. **recognition.js** - Speech Recognition
**Purpose:** Speech-to-text using Web Speech API

**Key Features:**
- Continuous recognition
- Interim and final results
- Multi-language support
- Auto-restart on unexpected end
- Confidence scoring

**Public Methods:**
```javascript
recognition.start()                 // Start recognition
recognition.stop()                  // Stop recognition
recognition.setLanguage('uk-UA')    // Change language

// Event handlers
recognition.onResult = (result) => {
    console.log('Final:', result.final);
    console.log('Interim:', result.interim);
};
recognition.onError = (error) => { /* ... */ };
recognition.onEnd = () => { /* ... */ };
```

### 5. **transcription.js** - Data Layer
**Purpose:** Manage conversation history and metadata

**Key Features:**
- Conversation history tracking
- Speaker identification and tracking
- Word count and duration stats
- Entry search and filtering
- Export formatting (Markdown, JSON, display)
- Session statistics

**Public Methods:**
```javascript
transcription.startSession()                    // Start new session
transcription.addEntry(text, speaker, meta)     // Add transcript entry
transcription.getHistory()                      // Get all entries
transcription.getHistoryBySpeaker('John')       // Filter by speaker
transcription.getHistoryBySentiment('positive') // Filter by sentiment
transcription.getSessionStats()                 // Get stats
transcription.formatForDownload()               // Markdown export
transcription.formatForJSON()                   // JSON export
transcription.getSummary()                      // Get summary
transcription.search('keyword')                 // Search entries
transcription.endSession()                      // End session
```

**Entry Structure:**
```javascript
{
    id: 'entry-1234567890-abc123',
    timestamp: 1234567890000,
    speaker: 'John Doe',
    text: 'This is what was said',
    wordCount: 5,
    sentiment: 'positive',        // or 'negative', 'question', 'action', 'neutral'
    aiComment: 'Action item identified',
    keywords: ['action', 'deadline'],
    confidence: 0.95
}
```

### 6. **ai-analysis.js** - AI Layer
**Purpose:** Sentiment detection, keyword extraction, role-based AI commenting

**Key Features:**
- Multi-language sentiment analysis (positive/negative/question/action/neutral)
- Keyword extraction from text
- Category detection (technical/business/learning/emotional/medical)
- Role-based AI commenting (6 role presets)
- Confidence scoring

**Role Presets:**
1. **General Meeting** - Basic action item and question tracking
2. **Language Teacher** - Grammar, vocabulary, learning progress
3. **Therapist** - Emotional insights, breakthrough moments
4. **Business Coach** - Goals, obstacles, strategy, metrics
5. **Medical Consultant** - Symptoms, treatment, health tracking
6. **Academic Tutor** - Understanding, confusion, learning outcomes

**Public Methods:**
```javascript
const analysis = aiAnalyzer.analyze(text);
// Returns: { sentiment, keywords, aiComment, categories, confidence }

aiAnalyzer.setRolePreset('therapist')          // Change role
aiAnalyzer.setLanguage('uk-UA')                // Change language
aiAnalyzer.getRolePresets()                    // Get available roles
aiAnalyzer.batchAnalyze(entries)               // Analyze multiple entries
```

**Example Analysis Output:**
```javascript
{
    sentiment: 'question',
    keywords: ['understand', 'explain', 'how'],
    aiComment: 'Student asking for clarification - opportunity to explain',
    categories: ['learning'],
    confidence: 0.85
}
```

### 7. **persistence.js** - Storage Layer
**Purpose:** Save/load/download transcripts

**Key Features:**
- Server-side persistence via API
- Auto-save every 1 minute
- localStorage backup
- Download as Markdown or JSON
- Copy to clipboard
- Transcript list/delete

**Public Methods:**
```javascript
// Server operations
await persistence.saveTranscript(history, metadata)
await persistence.loadTranscript(transcriptId)
await persistence.deleteTranscript(transcriptId)
await persistence.listTranscripts()

// File downloads
persistence.downloadTranscript(markdown)
persistence.downloadJSON(data)

// Clipboard
await persistence.copyToClipboard(content)

// Auto-save
persistence.enableAutoSave(historyGetter, interval)
persistence.disableAutoSave()

// localStorage backup
persistence.saveToLocalStorage(history, metadata)
persistence.loadFromLocalStorage()
```

## Event System

All modules communicate through the global event emitter:

### Notetaker Events
```javascript
globalEvents.on('notetaker:initialized', () => {});
globalEvents.on('notetaker:recording-started', () => {});
globalEvents.on('notetaker:recording-stopped', ({ history, stats }) => {});
globalEvents.on('notetaker:paused', () => {});
globalEvents.on('notetaker:resumed', () => {});
globalEvents.on('notetaker:language-changed', (language) => {});
globalEvents.on('notetaker:role-preset-changed', (preset) => {});
```

### Transcription Events
```javascript
globalEvents.on('transcription:session-started', () => {});
globalEvents.on('transcription:entry-added', (entry) => {});
globalEvents.on('transcription:entry-updated', (entry) => {});
globalEvents.on('transcription:stats-updated', (stats) => {});
globalEvents.on('transcription:session-ended', ({ history, duration, wordCount }) => {});
```

### Persistence Events
```javascript
globalEvents.on('persistence:transcript-saved', ({ transcriptId, url }) => {});
globalEvents.on('persistence:transcript-loaded', ({ transcriptId, conversation, metadata }) => {});
globalEvents.on('persistence:transcript-deleted', ({ transcriptId }) => {});
globalEvents.on('persistence:save-failed', ({ error }) => {});
globalEvents.on('persistence:auto-save-enabled', () => {});
```

## Integration Example

### In call-modular.html

```html
<script type="module">
import { createNotetaker } from '/static/js/notetaker/index.js';
import { globalEvents } from '/static/js/core/events.js';

// Get room info
const roomID = getRoomIDFromURL();
const isHost = sessionStorage.getItem('isHost') === 'true';

// Create notetaker instance
const notetaker = createNotetaker(roomID, isHost);

// Initialize
await notetaker.initialize();

// Listen for events
globalEvents.on('notetaker:recording-started', () => {
    console.log('Recording started!');
});

globalEvents.on('transcription:entry-added', (entry) => {
    console.log('New entry:', entry.text);
    if (entry.sentiment === 'action') {
        console.log('Action item detected!', entry.aiComment);
    }
});

// When WebRTC streams are ready
globalEvents.on('webrtc:local-stream-ready', async (stream) => {
    await notetaker.addAudioStream(stream, 'local');
});

globalEvents.on('webrtc:remote-stream-ready', async (stream) => {
    await notetaker.addAudioStream(stream, 'remote');
});

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
    await notetaker.cleanup();
});
</script>
```

## Data Flow

```
User Speech
    ↓
[Audio Mixer] ← Local Stream + Remote Stream
    ↓
[Speech Recognition] ← Mixed Audio Stream
    ↓
[Transcription Manager] ← Final Text
    ↓
[AI Analyzer] ← Text Analysis
    ↓
[Transcription Entry] ← Sentiment + Keywords + Comment
    ↓
[UI Manager] ← Display Entry
    ↓
[Persistence] ← Auto-save to localStorage + Server
```

## Configuration

### Language Settings
Supported languages:
- `en-US` - English (United States)
- `uk-UA` - Ukrainian
- `es-ES` - Spanish
- `fr-FR` - French
- `de-DE` - German
- And all languages supported by Web Speech API

### Role Presets
```javascript
const rolePresets = [
    { id: '', name: 'General Meeting' },
    { id: 'language-teacher', name: 'Language Teacher' },
    { id: 'therapist', name: 'Therapist' },
    { id: 'business-coach', name: 'Business Coach' },
    { id: 'medical-consultant', name: 'Medical Consultant' },
    { id: 'tutor', name: 'Academic Tutor' }
];
```

### Auto-Save Settings
```javascript
const config = {
    autoSave: true,              // Enable auto-save
    autoSaveInterval: 60000      // Save every 60 seconds
};
```

## File Size Reduction

**Before Refactoring:**
- `notetaker.js` - 2464 lines (monolithic)

**After Refactoring:**
- `index.js` - 380 lines (orchestrator)
- `ui-manager.js` - 423 lines (UI)
- `audio-mixer.js` - 85 lines (audio)
- `recognition.js` - 120 lines (speech)
- `transcription.js` - 420 lines (data)
- `ai-analysis.js` - 445 lines (AI)
- `persistence.js` - 380 lines (storage)

**Total:** 2253 lines across 7 focused modules

**Benefits:**
- ✅ Each module < 450 lines
- ✅ Clear separation of concerns
- ✅ Easy to test individual modules
- ✅ Easy to find and fix bugs
- ✅ Reusable components
- ✅ Event-driven architecture
- ✅ No module dependencies (except core utilities)

## Testing Each Module

### Test UI Manager
```javascript
const ui = new NotetakerUIManager();
ui.show();
ui.setRecordingState(true);
ui.addTranscriptEntry({
    speaker: 'Test',
    text: 'Hello world',
    sentiment: 'positive',
    aiComment: 'Test comment'
});
```

### Test Transcription Manager
```javascript
const transcription = new TranscriptionManager();
transcription.startSession();
transcription.addEntry('Hello world', 'John');
console.log(transcription.getHistory());
console.log(transcription.getSessionStats());
```

### Test AI Analyzer
```javascript
const ai = new AIAnalyzer({ rolePreset: 'therapist' });
const analysis = ai.analyze('I feel anxious about the presentation');
console.log(analysis);
// { sentiment: 'negative', keywords: ['feel', 'anxious'], aiComment: '...', ... }
```

### Test Persistence
```javascript
const persistence = new PersistenceManager(roomID);
const result = await persistence.saveTranscript(history);
console.log(result.transcriptId);
```

## Next Steps

✅ **Phase 6 Complete: AI Notetaker Modular Integration**

**Remaining Phases:**

**Phase 7:** Group Call Modular Version
- Create `group-call-modular.html`
- Integrate SFU with modular structure
- Multi-participant video layout

**Phase 8:** Migrate Remaining Utilities
- Chat module
- GIF picker module
- Emoji picker module
- Waiting room module

**Phase 9:** Replace Old Routes
- Test modular versions thoroughly
- Gradually replace `/room/` with `/room-modular/`
- Migration plan for users

**Phase 10:** Remove Old Monolithic Files
- Clean up after migration complete

**Phase 11:** Performance Optimization
- Code splitting, lazy loading

**Phase 12:** Production Testing
- Germany-Ukraine connection tests
- Mobile testing
- Cross-browser testing

## Conclusion

The AI Notetaker is now fully modular, maintainable, and ready for integration with the call system. Each module has a clear responsibility and can be developed, tested, and debugged independently.
