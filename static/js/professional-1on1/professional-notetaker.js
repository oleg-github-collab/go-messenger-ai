/**
 * Professional AI Notetaker for HMS Calls
 * Extends the base AINotetaker with HMS-specific recording
 */

class ProfessionalAINotetaker {
    constructor(roomID, isHost, hmsSDK) {
        this.roomID = roomID;
        this.isHost = isHost;
        this.hmsSDK = hmsSDK;
        this.isRecording = false;
        this.isPaused = false;
        this.startTime = null;
        this.pausedDuration = 0;
        this.pauseStartTime = null;
        this.transcript = '';
        this.recognition = null;
        this.conversationHistory = [];
        this.durationTimer = null;
        this.wordCount = 0;
        this.recordingInProgress = false; // Prevent race conditions
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // HMS Recording integration
        this.hmsRecording = new HMSRecordingIntegration();
        this.hmsRecording.setHMSSDK(hmsSDK);

        // UI elements
        this.initUIElements();

        // Only show for host
        if (this.isHost) {
            this.showNotetakerUI();
            this.initEventListeners();
            this.initSpeechRecognition();
        }

        console.log('[PRO-NOTETAKER] ✅ Professional AI Notetaker initialized');
    }

    initUIElements() {
        this.startBtn = document.getElementById('startNotetakerBtn');
        this.pauseBtn = document.getElementById('pauseNotetakerBtn');
        this.stopBtn = document.getElementById('stopNotetakerBtn');
        this.statusEl = document.getElementById('notetakerStatus');
        this.timerEl = document.getElementById('notetakerTimer');
        this.panelEl = document.getElementById('notetakerPanel');
    }

    showNotetakerUI() {
        if (this.panelEl) {
            this.panelEl.style.display = 'block';
        }
    }

    initEventListeners() {
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.toggleRecording());
        }

        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.togglePause());
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopRecording());
        }
    }

    initSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('[PRO-NOTETAKER] Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US'; // Default, can be changed

        // Auto-detect language
        const browserLang = navigator.language || navigator.userLanguage || 'en-US';
        if (browserLang.startsWith('uk')) {
            this.recognition.lang = 'uk-UA';
        } else if (browserLang.startsWith('ru')) {
            this.recognition.lang = 'ru-RU';
        } else if (browserLang.startsWith('de')) {
            this.recognition.lang = 'de-DE';
        } else if (browserLang.startsWith('es')) {
            this.recognition.lang = 'es-ES';
        } else if (browserLang.startsWith('fr')) {
            this.recognition.lang = 'fr-FR';
        }

        console.log('[PRO-NOTETAKER] 🌍 Speech recognition language:', this.recognition.lang);

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }

            if (finalTranscript) {
                this.transcript += finalTranscript;
                this.wordCount += finalTranscript.trim().split(/\s+/).length;
                this.conversationHistory.push({
                    timestamp: Date.now(),
                    speaker: 'Host',
                    text: finalTranscript.trim()
                });
                console.log('[PRO-NOTETAKER] 📝 Transcript:', finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.log('[PRO-NOTETAKER] Recognition error:', event.error);

            if (event.error === 'no-speech') {
                // No speech detected - restart silently
                if (this.isRecording && !this.isPaused) {
                    this.attemptRecognitionReconnect(1000);
                }
            } else if (event.error === 'aborted') {
                // Aborted - normal stop, don't restart
                console.log('[PRO-NOTETAKER] Recognition aborted normally');
            } else if (['not-allowed', 'service-not-allowed'].includes(event.error)) {
                console.error('[PRO-NOTETAKER] ❌ Microphone access denied');
                this.updateStatus('Microphone access denied', 'error');
                this.isRecording = false;
            } else if (event.error === 'network') {
                console.warn('[PRO-NOTETAKER] Network error, reconnecting...');
                if (this.isRecording && !this.isPaused) {
                    this.attemptRecognitionReconnect(2000);
                }
            } else if (event.error === 'audio-capture') {
                console.error('[PRO-NOTETAKER] Audio capture failed');
                this.updateStatus('Audio capture failed', 'error');
            } else {
                console.warn('[PRO-NOTETAKER] Recognition error:', event.error);
                if (this.isRecording && !this.isPaused) {
                    this.attemptRecognitionReconnect(1500);
                }
            }
        };

        this.recognition.onend = () => {
            console.log('[PRO-NOTETAKER] Recognition ended');
            // Auto-restart if still recording and not paused
            if (this.isRecording && !this.isPaused) {
                this.attemptRecognitionReconnect(500);
            }
        };
    }

    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    async startRecording() {
        if (this.isRecording || this.recordingInProgress) {
            console.warn('[PRO-NOTETAKER] Recording already in progress');
            return;
        }

        this.recordingInProgress = true;
        this.updateStatus('Starting...', 'loading');

        try {
            console.log('[PRO-NOTETAKER] 🎙️ Starting recording...');

            // 1. Notify backend
            try {
                const response = await fetch('/api/notetaker/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ room_id: this.roomID }),
                    signal: AbortSignal.timeout(5000) // 5s timeout
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Backend start failed');
                }

                console.log('[PRO-NOTETAKER] ✅ Backend notified');
            } catch (backendError) {
                console.error('[PRO-NOTETAKER] Backend error:', backendError);
                this.updateStatus('Backend unavailable, continuing...', 'warning');
                // Continue with local recording even if backend fails
            }

            // 2. Start HMS audio recording (if available)
            if (this.hmsRecording) {
                try {
                    const hmsResult = await this.hmsRecording.startRecording();
                    if (hmsResult.success) {
                        console.log('[PRO-NOTETAKER] ✅ HMS recording started');
                    } else {
                        console.warn('[PRO-NOTETAKER] HMS recording unavailable:', hmsResult.error);
                    }
                } catch (hmsError) {
                    console.warn('[PRO-NOTETAKER] HMS recording error:', hmsError);
                }
            }

            // 3. Start speech recognition
            if (this.recognition) {
                try {
                    this.recognition.start();
                    console.log('[PRO-NOTETAKER] 🗣️ Speech recognition started');
                    this.reconnectAttempts = 0; // Reset reconnect counter
                } catch (recognitionError) {
                    if (recognitionError.message.includes('already started')) {
                        console.log('[PRO-NOTETAKER] Recognition already active');
                    } else {
                        throw recognitionError;
                    }
                }
            }

            // 4. Initialize state
            this.isRecording = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.pausedDuration = 0;
            this.pauseStartTime = null;
            this.transcript = '';
            this.conversationHistory = [];
            this.wordCount = 0;

            // 5. Start UI timer
            this.startDurationTimer();

            // 6. Update UI
            this.updateUIRecording();
            this.updateStatus('Recording', 'recording');

            console.log('[PRO-NOTETAKER] ✅ Recording started successfully');

        } catch (error) {
            console.error('[PRO-NOTETAKER] ❌ Failed to start recording:', error);
            this.updateStatus('Failed to start', 'error');
            this.isRecording = false;
        } finally {
            this.recordingInProgress = false;
        }
    }

    async stopRecording() {
        if (!this.isRecording) {
            console.warn('[PRO-NOTETAKER] Not recording');
            return;
        }

        console.log('[PRO-NOTETAKER] 🛑 Stop button clicked');

        this.updateStatus('Stopping...', 'loading');

        try {
            // 1. Mark as not recording immediately
            this.isRecording = false;
            this.isPaused = false;

            // 2. Stop speech recognition first
            if (this.recognition) {
                try {
                    this.recognition.stop();
                    console.log('[PRO-NOTETAKER] Speech recognition stopped');
                } catch (err) {
                    console.warn('[PRO-NOTETAKER] Recognition already stopped');
                }
            }

            // 3. Stop timer
            this.stopDurationTimer();

            // 4. Calculate duration
            const duration = this.startTime ? Date.now() - this.startTime - this.pausedDuration : 0;
            const durationStr = this.formatDuration(duration);

            // 5. Update UI immediately
            this.updateUIStopped();

            // 6. Stop HMS recording (if available)
            if (this.hmsRecording) {
                try {
                    await this.hmsRecording.stopRecording();
                    console.log('[PRO-NOTETAKER] HMS recording stopped');
                } catch (err) {
                    console.warn('[PRO-NOTETAKER] HMS stop error:', err);
                }
            }

            // 7. Notify backend
            try {
                await fetch('/api/notetaker/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: this.roomID,
                        transcript: this.transcript || 'No transcript available',
                        audio_data: ''
                    })
                });
            } catch (err) {
                console.warn('[PRO-NOTETAKER] Backend error:', err);
            }

            // 8. Show analysis modal
            this.updateStatus('Processing...', 'processing');
            await this.showAnalysisModal(durationStr);

            // 9. Reset to ready state
            this.updateStatus('Ready', 'ready');
            console.log('[PRO-NOTETAKER] ✅ Stopped successfully');

        } catch (error) {
            console.error('[PRO-NOTETAKER] Stop error:', error);
            this.updateStatus('Ready', 'ready');
            this.updateUIStopped();
        }
    }

    togglePause() {
        if (!this.isRecording) return;

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pause speech recognition
            if (this.recognition) {
                try {
                    this.recognition.stop();
                } catch (err) {
                    console.warn('[PRO-NOTETAKER] Recognition stop error:', err);
                }
            }
            this.stopDurationTimer();
            this.updateStatus('Paused', 'paused');
        } else {
            // Resume speech recognition
            if (this.recognition) {
                try {
                    this.recognition.start();
                } catch (err) {
                    console.warn('[PRO-NOTETAKER] Recognition start error:', err);
                }
            }
            this.startDurationTimer();
            this.updateStatus('Recording in progress...', 'recording');
        }

        this.updateUIPaused();
    }

    startDurationTimer() {
        if (this.durationTimer) return;

        this.durationTimer = setInterval(() => {
            if (this.startTime && this.timerEl) {
                const duration = Date.now() - this.startTime;
                this.timerEl.textContent = this.formatDuration(duration);
            }
        }, 1000);
    }

    stopDurationTimer() {
        if (this.durationTimer) {
            clearInterval(this.durationTimer);
            this.durationTimer = null;
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        const s = seconds % 60;
        const m = minutes % 60;

        if (hours > 0) {
            return `${hours}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    updateUIRecording() {
        if (this.startBtn) {
            this.startBtn.style.display = 'none';
        }
        if (this.pauseBtn) {
            this.pauseBtn.style.display = 'inline-flex';
        }
        if (this.stopBtn) {
            this.stopBtn.style.display = 'inline-flex';
        }
        if (this.timerEl) {
            this.timerEl.style.display = 'block';
            this.timerEl.textContent = '0:00';
        }
    }

    updateUIStopped() {
        if (this.startBtn) {
            this.startBtn.style.display = 'inline-flex';
        }
        if (this.pauseBtn) {
            this.pauseBtn.style.display = 'none';
        }
        if (this.stopBtn) {
            this.stopBtn.style.display = 'none';
        }
        if (this.timerEl) {
            this.timerEl.style.display = 'none';
        }
    }

    updateUIPaused() {
        if (this.pauseBtn) {
            const icon = this.pauseBtn.querySelector('.notetaker-icon');
            if (icon) {
                icon.textContent = this.isPaused ? '▶️' : '⏸️';
            }
        }
    }

    updateStatus(text, state = 'ready') {
        if (!this.statusEl) return;

        this.statusEl.textContent = text;

        const colors = {
            ready: '#94a3b8',
            recording: '#ef4444',
            paused: '#f59e0b',
            processing: '#3b82f6',
            error: '#ef4444'
        };

        this.statusEl.style.color = colors[state] || colors.ready;
    }

    async showAnalysisModal(duration) {
        try {
            // Request AI analysis from backend
            const response = await fetch('/api/notetaker/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: this.roomID,
                    transcript: this.transcript,
                    participants: ['Host', 'Guest'],
                    duration: duration,
                    role_preset: localStorage.getItem('notetaker_role_preset') || null
                })
            });

            if (response.ok) {
                const analysis = await response.json();
                this.displayAnalysisResult(analysis, duration);
            } else {
                throw new Error('Failed to analyze transcript');
            }

        } catch (error) {
            console.error('[PRO-NOTETAKER] ❌ Analysis failed:', error);
            // Fallback: show basic summary
            this.displayBasicSummary(duration);
        }
    }

    displayAnalysisResult(analysis, duration) {
        const modal = document.createElement('div');
        modal.className = 'notetaker-analysis-modal';
        modal.innerHTML = `
            <div class="analysis-backdrop"></div>
            <div class="analysis-content">
                <div class="analysis-header">
                    <h2>Meeting Analysis</h2>
                    <button class="close-analysis-btn">✕</button>
                </div>
                <div class="analysis-body">
                    <div class="analysis-stats">
                        <div class="stat-item">
                            <span class="stat-label">Duration</span>
                            <span class="stat-value">${duration}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Words</span>
                            <span class="stat-value">${this.wordCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Characters</span>
                            <span class="stat-value">${this.transcript.length}</span>
                        </div>
                    </div>

                    <div class="analysis-section">
                        <h3>Summary</h3>
                        <p>${analysis.summary || 'No summary available'}</p>
                    </div>

                    ${analysis.key_points && analysis.key_points.length > 0 ? `
                        <div class="analysis-section">
                            <h3>Key Points</h3>
                            <ul>
                                ${analysis.key_points.map(point => `<li>${point}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${analysis.action_items && analysis.action_items.length > 0 ? `
                        <div class="analysis-section">
                            <h3>Action Items</h3>
                            <ul>
                                ${analysis.action_items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${analysis.decisions && analysis.decisions.length > 0 ? `
                        <div class="analysis-section">
                            <h3>Decisions</h3>
                            <ul>
                                ${analysis.decisions.map(decision => `<li>${decision}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                <div class="analysis-footer">
                    <button class="btn-primary" id="downloadAnalysisBtn">Download</button>
                    <button class="btn-secondary" id="closeAnalysisBtn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-analysis-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.analysis-backdrop').addEventListener('click', () => modal.remove());
        modal.querySelector('#closeAnalysisBtn').addEventListener('click', () => modal.remove());
        modal.querySelector('#downloadAnalysisBtn').addEventListener('click', () => {
            this.downloadAnalysis(analysis, duration);
        });
    }

    displayBasicSummary(duration) {
        const modal = document.createElement('div');
        modal.className = 'notetaker-analysis-modal';
        modal.innerHTML = `
            <div class="analysis-backdrop"></div>
            <div class="analysis-content">
                <div class="analysis-header">
                    <h2>Recording Complete</h2>
                    <button class="close-analysis-btn">✕</button>
                </div>
                <div class="analysis-body">
                    <div class="analysis-stats">
                        <div class="stat-item">
                            <span class="stat-label">Duration</span>
                            <span class="stat-value">${duration}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Words</span>
                            <span class="stat-value">${this.wordCount}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Characters</span>
                            <span class="stat-value">${this.transcript.length}</span>
                        </div>
                    </div>

                    <div class="analysis-section">
                        <h3>Transcript Preview</h3>
                        <p>${this.transcript.substring(0, 500)}${this.transcript.length > 500 ? '...' : ''}</p>
                    </div>
                </div>
                <div class="analysis-footer">
                    <button class="btn-primary" id="downloadTranscriptBtn">Download Transcript</button>
                    <button class="btn-secondary" id="closeSummaryBtn">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-analysis-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('.analysis-backdrop').addEventListener('click', () => modal.remove());
        modal.querySelector('#closeSummaryBtn').addEventListener('click', () => modal.remove());
        modal.querySelector('#downloadTranscriptBtn').addEventListener('click', () => {
            this.downloadTranscript();
            modal.remove();
        });
    }

    downloadAnalysis(analysis, duration) {
        const content = `Meeting Analysis\n${'='.repeat(50)}\n\nDuration: ${duration}\nWords: ${this.wordCount}\n\nSummary:\n${analysis.summary || 'N/A'}\n\nKey Points:\n${(analysis.key_points || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\nAction Items:\n${(analysis.action_items || []).map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\nDecisions:\n${(analysis.decisions || []).map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nFull Transcript:\n${this.transcript}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting-analysis-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    downloadTranscript() {
        const content = `Meeting Transcript\n${'='.repeat(50)}\n\nDuration: ${this.formatDuration(Date.now() - this.startTime)}\nWords: ${this.wordCount}\n\n${this.transcript}`;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    cleanup() {
        this.stopDurationTimer();
        if (this.hmsRecording) {
            this.hmsRecording.cleanup();
        }
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (err) {
                // Ignore
            }
        }
        console.log('[PRO-NOTETAKER] 🧹 Cleanup complete');
    }

    // Reconnect speech recognition with exponential backoff
    attemptRecognitionReconnect(baseDelay = 500) {
        if (!this.isRecording || this.isPaused) {
            return; // Don't reconnect if not recording
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[PRO-NOTETAKER] Max reconnect attempts reached');
            this.updateStatus('Recognition failed - please restart', 'error');
            return;
        }

        this.reconnectAttempts++;
        const delay = baseDelay * Math.pow(1.5, this.reconnectAttempts - 1);

        console.log(`[PRO-NOTETAKER] Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

        setTimeout(() => {
            if (this.isRecording && !this.isPaused && this.recognition) {
                try {
                    this.recognition.start();
                    console.log('[PRO-NOTETAKER] ✅ Recognition reconnected');
                    this.reconnectAttempts = 0; // Reset on successful restart
                } catch (err) {
                    if (err.message && err.message.includes('already started')) {
                        console.log('[PRO-NOTETAKER] Recognition already running');
                        this.reconnectAttempts = 0;
                    } else {
                        console.error('[PRO-NOTETAKER] Reconnect failed:', err);
                        // Try again with next attempt
                        this.attemptRecognitionReconnect(baseDelay);
                    }
                }
            }
        }, delay);
    }
}

// Export for global use
window.ProfessionalAINotetaker = ProfessionalAINotetaker;
console.log('[PRO-NOTETAKER] ✅ ProfessionalAINotetaker loaded');
