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
        this.transcript = '';
        this.recognition = null;
        this.conversationHistory = [];
        this.durationTimer = null;
        this.wordCount = 0;

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
            if (event.error === 'no-speech' && this.isRecording && !this.isPaused) {
                // Restart silently
                setTimeout(() => {
                    if (this.isRecording && !this.isPaused) {
                        try {
                            this.recognition.start();
                        } catch (err) {
                            // Already started
                        }
                    }
                }, 1000);
            } else if (['not-allowed', 'service-not-allowed'].includes(event.error)) {
                console.error('[PRO-NOTETAKER] ❌ Microphone access denied');
                this.updateStatus('Microphone access denied', 'error');
            }
        };

        this.recognition.onend = () => {
            if (this.isRecording && !this.isPaused) {
                setTimeout(() => {
                    if (this.isRecording && !this.isPaused) {
                        try {
                            this.recognition.start();
                        } catch (err) {
                            // Already started
                        }
                    }
                }, 500);
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
        if (this.isRecording) {
            console.warn('[PRO-NOTETAKER] Already recording');
            return;
        }

        try {
            console.log('[PRO-NOTETAKER] 🎙️ Starting recording...');

            // Notify backend
            const response = await fetch('/api/notetaker/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: this.roomID })
            });

            if (!response.ok) {
                throw new Error('Failed to start notetaker on backend');
            }

            // Start HMS audio recording
            const hmsRecordingResult = await this.hmsRecording.startRecording();
            if (!hmsRecordingResult.success) {
                console.warn('[PRO-NOTETAKER] HMS recording failed:', hmsRecordingResult.error);
                // Continue anyway with speech recognition
            }

            // Start speech recognition
            if (this.recognition) {
                try {
                    this.recognition.start();
                    console.log('[PRO-NOTETAKER] 🗣️ Speech recognition started');
                } catch (err) {
                    console.warn('[PRO-NOTETAKER] Speech recognition error:', err);
                }
            }

            this.isRecording = true;
            this.startTime = Date.now();
            this.transcript = '';
            this.wordCount = 0;
            this.conversationHistory = [];

            // Start timer
            this.startDurationTimer();

            // Update UI
            this.updateUIRecording();
            this.updateStatus('Recording in progress...', 'recording');

            console.log('[PRO-NOTETAKER] ✅ Recording started');

        } catch (error) {
            console.error('[PRO-NOTETAKER] ❌ Failed to start recording:', error);
            alert('Failed to start AI Notetaker: ' + error.message);
        }
    }

    async stopRecording() {
        if (!this.isRecording) {
            console.warn('[PRO-NOTETAKER] Not recording');
            return;
        }

        try {
            console.log('[PRO-NOTETAKER] 🛑 Stopping recording...');

            this.isRecording = false;

            // Stop speech recognition
            if (this.recognition) {
                try {
                    this.recognition.stop();
                    console.log('[PRO-NOTETAKER] 🗣️ Speech recognition stopped');
                } catch (err) {
                    console.warn('[PRO-NOTETAKER] Speech recognition stop error:', err);
                }
            }

            // Stop HMS recording
            const hmsRecordingResult = await this.hmsRecording.stopRecording();
            console.log('[PRO-NOTETAKER] HMS recording result:', hmsRecordingResult);

            // Stop timer
            this.stopDurationTimer();

            const duration = this.startTime ? Date.now() - this.startTime : 0;
            const durationStr = this.formatDuration(duration);

            // Update UI
            this.updateUIStopped();
            this.updateStatus('Processing transcript...', 'processing');

            // Notify backend
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
                console.warn('[PRO-NOTETAKER] Backend stop error:', err);
            }

            console.log('[PRO-NOTETAKER] ✅ Recording stopped');

            // Show analysis modal
            await this.showAnalysisModal(durationStr);

            this.updateStatus('Ready', 'ready');

        } catch (error) {
            console.error('[PRO-NOTETAKER] ❌ Failed to stop recording:', error);
            alert('Failed to stop AI Notetaker: ' + error.message);
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
}

// Export for global use
window.ProfessionalAINotetaker = ProfessionalAINotetaker;
console.log('[PRO-NOTETAKER] ✅ ProfessionalAINotetaker loaded');
