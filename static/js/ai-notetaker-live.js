/**
 * AI Notetaker - Live Transcription Component
 * Professional real-time transcription with speaker detection
 */

class AINotetaker {
    constructor(roomId, userName, isHost) {
        this.roomId = roomId;
        this.userName = userName;
        this.isHost = isHost;
        this.isRecording = false;
        this.isPaused = false;
        this.transcript = [];
        this.currentPreset = 'detailed';
        this.mediaRecorder = null;
        this.audioChunks = [];

        this.presets = {
            quick: {
                name: '⚡ Quick Notes',
                description: 'Key points only',
                detail: 'low'
            },
            detailed: {
                name: '📝 Detailed',
                description: 'Full conversation',
                detail: 'medium'
            },
            minutes: {
                name: '📋 Meeting Minutes',
                description: 'Professional format',
                detail: 'high'
            }
        };

        this.init();
    }

    init() {
        this.createUI();
        this.attachEventListeners();
        console.log('[NOTETAKER] ✅ Initialized');
    }

    createUI() {
        const container = document.createElement('div');
        container.className = 'ai-notetaker minimized';
        container.innerHTML = `
            <div class="notetaker-header">
                <div class="header-left">
                    <div class="ai-icon">🤖</div>
                    <div class="header-title">
                        <h3>AI Notetaker</h3>
                        <div class="header-status" id="notetakerStatus">Ready</div>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="header-btn" id="minimizeBtn" title="Minimize/Expand">▼</button>
                </div>
            </div>

            <div class="presets-bar" id="presetsBar">
                <button class="preset-btn" data-preset="quick">⚡ Quick Notes</button>
                <button class="preset-btn active" data-preset="detailed">📝 Detailed</button>
                <button class="preset-btn" data-preset="minutes">📋 Minutes</button>
            </div>

            <div class="notetaker-controls">
                <button class="control-btn start" id="startBtn">
                    <span>▶</span> Start
                </button>
                <button class="control-btn pause" id="pauseBtn" style="display: none;">
                    <span>⏸</span> Pause
                </button>
                <button class="control-btn resume" id="resumeBtn" style="display: none;">
                    <span>▶</span> Resume
                </button>
                <button class="control-btn stop" id="stopBtn" style="display: none;">
                    <span>⏹</span> Stop
                </button>
            </div>

            <div class="transcript-container" id="transcriptContainer">
                <div class="empty-state">
                    <div class="empty-state-icon">🎙️</div>
                    <div class="empty-state-text">
                        Click <strong>Start</strong> to begin recording<br>
                        AI will transcribe in real-time
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this.container = container;

        // Create post-call editor (hidden by default)
        this.createPostCallEditor();
    }

    createPostCallEditor() {
        const editor = document.createElement('div');
        editor.className = 'post-call-editor';
        editor.innerHTML = `
            <div class="editor-panel">
                <div class="editor-header">
                    <h2>Edit & Save Transcript</h2>
                    <div class="editor-subtitle">Review and edit your meeting notes</div>
                </div>
                <div class="editor-content">
                    <textarea class="editor-textarea" id="editorTextarea" placeholder="Your transcript will appear here..."></textarea>
                </div>
                <div class="editor-actions">
                    <button class="editor-btn secondary" id="editorClose">Cancel</button>
                    <button class="editor-btn secondary" id="editorCopy">📋 Copy</button>
                    <button class="editor-btn primary" id="editorSave">💾 Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(editor);
        this.editor = editor;

        // Attach editor event listeners
        document.getElementById('editorClose').addEventListener('click', () => this.closeEditor());
        document.getElementById('editorCopy').addEventListener('click', () => this.copyTranscript());
        document.getElementById('editorSave').addEventListener('click', () => this.saveTranscript());
    }

    attachEventListeners() {
        // Header toggle
        document.querySelector('.notetaker-header').addEventListener('click', (e) => {
            if (!e.target.closest('.header-btn')) {
                this.toggleMinimize();
            }
        });

        // Minimize button
        document.getElementById('minimizeBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMinimize();
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPreset = btn.dataset.preset;
                console.log('[NOTETAKER] Preset changed to:', this.currentPreset);
            });
        });

        // Control buttons
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resumeBtn').addEventListener('click', () => this.resume());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());
    }

    toggleMinimize() {
        this.container.classList.toggle('minimized');
        const btn = document.getElementById('minimizeBtn');
        btn.textContent = this.container.classList.contains('minimized') ? '▼' : '▲';
    }

    async start() {
        try {
            console.log('[NOTETAKER] Starting recording...');

            // Get audio stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.processAudio(audioBlob);
            };

            // Start recording (collect data every 5 seconds for real-time processing)
            this.mediaRecorder.start(5000);
            this.isRecording = true;
            this.isPaused = false;

            this.updateUI();
            this.updateStatus('Recording', true);

            // Simulate real-time transcription for demo
            this.startSimulatedTranscription();

        } catch (error) {
            console.error('[NOTETAKER] ❌ Failed to start:', error);
            alert('Failed to access microphone');
        }
    }

    pause() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.updateUI();
            this.updateStatus('Paused', false);
            console.log('[NOTETAKER] Paused');
        }
    }

    resume() {
        if (this.mediaRecorder && this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.updateUI();
            this.updateStatus('Recording', true);
            console.log('[NOTETAKER] Resumed');
        }
    }

    async stop() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            this.isPaused = false;
            this.updateUI();
            this.updateStatus('Processing...', false);
            console.log('[NOTETAKER] Stopped');

            // Stop simulated transcription
            if (this.simulationInterval) {
                clearInterval(this.simulationInterval);
            }

            // Show post-call editor after a short delay
            setTimeout(() => {
                this.showEditor();
            }, 1000);
        }
    }

    updateUI() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (this.isRecording) {
            startBtn.style.display = 'none';
            resumeBtn.style.display = 'none';
            pauseBtn.style.display = this.isPaused ? 'none' : 'block';
            stopBtn.style.display = 'block';
        } else if (this.isPaused) {
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'block';
            stopBtn.style.display = 'block';
        } else {
            startBtn.style.display = 'block';
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'none';
            stopBtn.style.display = 'none';
        }
    }

    updateStatus(text, isRecording = false) {
        const status = document.getElementById('notetakerStatus');
        status.textContent = text;
        status.className = 'header-status' + (isRecording ? ' recording' : '');
    }

    addTranscriptLine(speaker, text, timestamp = new Date()) {
        const line = {
            speaker,
            text,
            timestamp: timestamp.toLocaleTimeString()
        };

        this.transcript.push(line);

        // Update UI
        const container = document.getElementById('transcriptContainer');

        // Remove empty state if present
        if (container.querySelector('.empty-state')) {
            container.innerHTML = '';
        }

        // Add new line with animation
        const lineElement = document.createElement('div');
        lineElement.className = 'transcript-line';

        const speakerClass = speaker === this.userName ? 'speaker-host' : 'speaker-guest';
        const speakerLabel = speaker === this.userName ? 'You' : speaker;

        lineElement.innerHTML = `
            <div class="transcript-speaker ${speakerClass}">
                <span class="speaker-dot"></span>
                ${speakerLabel}
            </div>
            <div class="transcript-text">${text}</div>
            <div class="transcript-timestamp">${line.timestamp}</div>
        `;

        container.appendChild(lineElement);

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    // Simulated transcription for demo purposes
    startSimulatedTranscription() {
        const samplePhrases = [
            { speaker: this.userName, text: "Thanks for joining the call today." },
            { speaker: "Guest", text: "Happy to be here! Let's discuss the project." },
            { speaker: this.userName, text: "We need to finalize the timeline and deliverables." },
            { speaker: "Guest", text: "I've prepared some estimates based on our last discussion." },
            { speaker: this.userName, text: "Great! Let's review them together." },
            { speaker: "Guest", text: "The first phase should take about 2 weeks." },
            { speaker: this.userName, text: "That sounds reasonable. What about the budget?" },
            { speaker: "Guest", text: "I'll send you the detailed breakdown after this call." }
        ];

        let phraseIndex = 0;
        this.simulationInterval = setInterval(() => {
            if (phraseIndex < samplePhrases.length && this.isRecording && !this.isPaused) {
                const phrase = samplePhrases[phraseIndex];
                this.addTranscriptLine(phrase.speaker, phrase.text);
                phraseIndex++;
            } else if (phraseIndex >= samplePhrases.length) {
                clearInterval(this.simulationInterval);
            }
        }, 3000); // Add a line every 3 seconds
    }

    async processAudio(audioBlob) {
        console.log('[NOTETAKER] Processing audio...', audioBlob.size, 'bytes');

        // TODO: Send to backend for real Whisper transcription
        // For now, we're using simulated transcription

        this.updateStatus('Completed', false);
    }

    showEditor() {
        // Format transcript for editing
        const formattedTranscript = this.transcript.map(line =>
            `[${line.timestamp}] ${line.speaker}:\n${line.text}\n`
        ).join('\n');

        document.getElementById('editorTextarea').value = formattedTranscript;
        this.editor.classList.add('active');
    }

    closeEditor() {
        this.editor.classList.remove('active');
    }

    copyTranscript() {
        const textarea = document.getElementById('editorTextarea');
        textarea.select();
        document.execCommand('copy');

        const btn = document.getElementById('editorCopy');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }

    async saveTranscript() {
        const text = document.getElementById('editorTextarea').value;

        // Create downloadable file
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${this.roomId}-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[NOTETAKER] 💾 Transcript saved');

        // Close editor
        setTimeout(() => this.closeEditor(), 500);
    }

    destroy() {
        if (this.mediaRecorder && this.isRecording) {
            this.stop();
        }
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        if (this.container) {
            this.container.remove();
        }
        if (this.editor) {
            this.editor.remove();
        }
        console.log('[NOTETAKER] 🗑️ Destroyed');
    }
}

// Export for use in call.html
window.AINotetaker = AINotetaker;
