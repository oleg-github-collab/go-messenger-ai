/**
 * AI Notetaker - НАПИСАНО З НУЛЯ
 * Real-time transcription через Web Speech API
 */

class ProfessionalAINotetaker {
    constructor(roomID, isHost, hmsSDK) {
        this.roomID = roomID;
        this.isHost = isHost;
        this.hmsSDK = hmsSDK;

        // State
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.transcript = [];
        this.wordCount = 0;

        // Speech Recognition
        this.recognition = null;
        this.interimTranscript = '';

        // UI Elements
        this.panel = document.getElementById('notetakerPanel');
        this.startBtn = document.getElementById('startNotetakerBtn');
        this.pauseBtn = document.getElementById('pauseNotetakerBtn');
        this.stopBtn = document.getElementById('stopNotetakerBtn');
        this.statusText = document.getElementById('notetakerStatus');
        this.statusDot = document.getElementById('notetakerStatusDot');
        this.timerEl = document.getElementById('notetakerTimer');
        this.transcriptList = document.getElementById('notetakerTranscriptList');
        this.statDuration = document.getElementById('statDuration');
        this.statWords = document.getElementById('statWords');

        // Timer
        this.timerInterval = null;

        if (this.isHost) {
            this.init();
        }

        console.log('[AI NOTETAKER] Initialized');
    }

    init() {
        // Setup Speech Recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('[AI NOTETAKER] Speech Recognition not supported');
            this.setStatus('Not supported', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configure
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Default

        // Auto-detect language
        const userLang = navigator.language || 'en-US';
        if (userLang.startsWith('uk')) {
            this.recognition.lang = 'uk-UA';
        } else if (userLang.startsWith('ru')) {
            this.recognition.lang = 'ru-RU';
        } else if (userLang.startsWith('es')) {
            this.recognition.lang = 'es-ES';
        } else if (userLang.startsWith('fr')) {
            this.recognition.lang = 'fr-FR';
        } else if (userLang.startsWith('de')) {
            this.recognition.lang = 'de-DE';
        }

        console.log('[AI NOTETAKER] Language:', this.recognition.lang);

        // Events
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();

        // Button events
        this.startBtn.onclick = () => this.start();
        this.pauseBtn.onclick = () => this.pause();
        this.stopBtn.onclick = () => this.stop();

        this.setStatus('Ready', 'ready');
    }

    start() {
        if (this.isRecording) {
            console.warn('[AI NOTETAKER] Already recording');
            return;
        }

        console.log('[AI NOTETAKER] Starting...');

        try {
            this.recognition.start();
            this.isRecording = true;
            this.isPaused = false;
            this.startTime = Date.now();

            // Update UI
            this.startBtn.style.display = 'none';
            this.pauseBtn.style.display = 'inline-flex';
            this.stopBtn.style.display = 'inline-flex';

            this.setStatus('Recording', 'recording');

            // Start timer
            this.startTimer();

            // Clear empty state
            if (this.transcriptList.querySelector('.transcript-empty')) {
                this.transcriptList.innerHTML = '';
            }

            console.log('[AI NOTETAKER] Recording started');

        } catch (error) {
            console.error('[AI NOTETAKER] Start error:', error);
            this.setStatus('Error', 'error');
        }
    }

    pause() {
        if (!this.isRecording) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.recognition.stop();
            this.stopTimer();
            this.setStatus('Paused', 'paused');
            this.pauseBtn.textContent = '▶ Resume';
        } else {
            this.recognition.start();
            this.startTimer();
            this.setStatus('Recording', 'recording');
            this.pauseBtn.textContent = '⏸ Pause';
        }
    }

    stop() {
        if (!this.isRecording) return;

        console.log('[AI NOTETAKER] Stopping...');

        this.recognition.stop();
        this.isRecording = false;
        this.isPaused = false;

        // Stop timer
        this.stopTimer();

        // Update UI
        this.startBtn.style.display = 'inline-flex';
        this.pauseBtn.style.display = 'none';
        this.stopBtn.style.display = 'none';
        this.pauseBtn.textContent = '⏸ Pause';

        this.setStatus('Stopped', 'ready');

        // Save transcript
        this.saveTranscript();

        console.log('[AI NOTETAKER] Stopped');
    }

    handleResult(event) {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript;

            if (result.isFinal) {
                finalText += text + ' ';
            } else {
                interimText += text;
            }
        }

        // Add final transcript
        if (finalText.trim()) {
            this.addTranscriptEntry(finalText.trim());
        }

        // Update interim display (optional - показує що говориться ЗАРАЗ)
        this.interimTranscript = interimText;
    }

    addTranscriptEntry(text) {
        const timestamp = Date.now();
        const speaker = this.hmsSDK.userName || 'Speaker';

        // Add to array
        this.transcript.push({
            text,
            speaker,
            timestamp,
            time: this.formatTime(timestamp - this.startTime)
        });

        // Update word count
        this.wordCount += text.split(/\s+/).length;
        this.statWords.textContent = this.wordCount;

        // Add to UI
        const entry = document.createElement('div');
        entry.className = 'transcript-entry';
        entry.innerHTML = `
            <div class="transcript-meta">
                <span class="transcript-speaker">${speaker}</span>
                <span class="transcript-time">${this.formatTime(timestamp - this.startTime)}</span>
            </div>
            <p class="transcript-text">${text}</p>
        `;

        this.transcriptList.appendChild(entry);

        // Scroll to bottom
        this.transcriptList.scrollTop = this.transcriptList.scrollHeight;

        console.log('[AI NOTETAKER] Added:', text.substring(0, 50) + '...');
    }

    handleError(event) {
        console.error('[AI NOTETAKER] Recognition error:', event.error);

        if (event.error === 'no-speech') {
            // Просто тиша - нормально
            return;
        }

        if (event.error === 'aborted') {
            // Користувач зупинив - OK
            return;
        }

        // Інші помилки
        if (this.isRecording && !this.isPaused) {
            // Auto-restart
            setTimeout(() => {
                if (this.isRecording && !this.isPaused) {
                    try {
                        this.recognition.start();
                    } catch (err) {
                        console.error('[AI NOTETAKER] Restart failed:', err);
                    }
                }
            }, 1000);
        }
    }

    handleEnd() {
        // Recognition ended
        if (this.isRecording && !this.isPaused) {
            // Auto-restart якщо recording active
            try {
                this.recognition.start();
            } catch (err) {
                console.error('[AI NOTETAKER] Auto-restart failed:', err);
            }
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.startTime) {
                const elapsed = Date.now() - this.startTime;
                const formatted = this.formatTime(elapsed);
                this.timerEl.textContent = formatted;
                this.statDuration.textContent = formatted;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    setStatus(text, state) {
        this.statusText.textContent = text;

        // Update dot
        this.statusDot.className = 'status-dot';
        if (state === 'recording') {
            this.statusDot.classList.add('recording');
        } else if (state === 'paused') {
            this.statusDot.classList.add('paused');
        }
    }

    async saveTranscript() {
        if (this.transcript.length === 0) {
            console.log('[AI NOTETAKER] No transcript to save');
            return;
        }

        const fullText = this.transcript.map(entry =>
            `[${entry.time}] ${entry.speaker}: ${entry.text}`
        ).join('\n\n');

        console.log('[AI NOTETAKER] Saving transcript:', fullText.length, 'chars');

        // Send to backend
        try {
            await fetch('/api/notetaker/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: this.roomID,
                    transcript: fullText,
                    entries: this.transcript,
                    word_count: this.wordCount,
                    language: this.recognition.lang
                })
            });

            console.log('[AI NOTETAKER] Transcript saved');

        } catch (error) {
            console.error('[AI NOTETAKER] Save error:', error);
        }
    }

    cleanup() {
        if (this.isRecording) {
            this.stop();
        }

        if (this.recognition) {
            this.recognition.abort();
        }

        this.stopTimer();
    }
}

// Export
window.ProfessionalAINotetaker = ProfessionalAINotetaker;
