// AI Notetaker - WebRTC Audio Recording & Analysis
class AINotetaker {
    constructor(roomID, isHost) {
        this.roomID = roomID;
        this.isHost = isHost;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.startTime = null;
        this.transcript = '';
        this.recognition = null;
        this.conversationHistory = []; // Store full conversation for AI analysis

        // Initialize UI elements
        this.toggleBtn = document.getElementById('notetakerToggleBtn');
        this.statusText = document.getElementById('notetakerStatus');
        this.container = document.getElementById('notetakerFloatingPanel');
        this.notetakerGroup = document.getElementById('notetakerGroup');
        this.langSelect = document.getElementById('notetakerLangSelect');
        this.modal = document.getElementById('notetakerModal');
        this.modalBackdrop = document.getElementById('notetakerModalBackdrop');
        this.modalClose = document.getElementById('notetakerModalClose');
        this.loading = document.getElementById('notetakerLoading');
        this.results = document.getElementById('notetakerResults');

        // Real-time panel elements
        this.rtPanel = document.getElementById('realtimeTranscriptPanel');
        this.rtContent = document.getElementById('rtTranscriptContent');
        this.rtMinimizeBtn = document.getElementById('rtMinimizeBtn');
        this.rtCloseBtn = document.getElementById('rtCloseBtn');
        this.rtDuration = document.getElementById('rtDuration');
        this.rtWordCount = document.getElementById('rtWordCount');

        // Pre-meeting setup elements
        this.setupToggleBtn = document.getElementById('setupToggleBtn');
        this.setupContent = document.getElementById('setupContent');
        this.meetingGoal = document.getElementById('meetingGoal');
        this.partnerInfo = document.getElementById('partnerInfo');
        this.meetingType = document.getElementById('meetingType');

        // AI recommendation modal
        this.aiRecModal = document.getElementById('aiRecommendationModal');
        this.aiRecBackdrop = document.getElementById('aiRecBackdrop');
        this.aiRecClose = document.getElementById('aiRecClose');
        this.aiRecBody = document.getElementById('aiRecBody');

        // Filter state
        this.speakerFilter = 'both'; // 'both', 'me', 'partner'
        this.wordCount = 0;
        this.durationTimer = null;

        // Meeting context for AI
        this.meetingContext = {
            goal: '',
            partnerInfo: '',
            type: 'general'
        };

        // Long-session persistence (for 8-hour calls)
        this.persistenceTimer = null;
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.lastSaveTime = null;

        // Show notetaker only for host
        if (this.isHost && this.notetakerGroup) {
            if (this.container) {
                this.container.style.display = 'block';
            }
            this.notetakerGroup.style.display = 'block';

            // Auto-select language based on browser
            if (this.langSelect) {
                const browserLang = navigator.language || navigator.userLanguage || 'en-US';
                if (browserLang.startsWith('uk')) {
                    this.langSelect.value = 'uk-UA';
                } else if (browserLang.startsWith('ru')) {
                    this.langSelect.value = 'ru-RU';
                } else if (browserLang.startsWith('de')) {
                    this.langSelect.value = 'de-DE';
                } else if (browserLang.startsWith('es')) {
                    this.langSelect.value = 'es-ES';
                } else if (browserLang.startsWith('fr')) {
                    this.langSelect.value = 'fr-FR';
                } else {
                    this.langSelect.value = 'en-US';
                }
            }

            // Initialize meeting config manager
            if (typeof MeetingConfigManager !== 'undefined') {
                meetingConfig = new MeetingConfigManager();
                console.log('[NOTETAKER] ⚙️ Meeting config manager initialized');
            }

            // Initialize modal manager (expose globally for group calls)
            if (typeof ConfigModalManager !== 'undefined' && meetingConfig) {
                window.configModalManager = new ConfigModalManager(meetingConfig);
                console.log('[NOTETAKER] 🎨 Config modal manager initialized and exposed globally');
            }

            // Initialize role presets manager
            if (typeof RolePresetsManager !== 'undefined') {
                rolePresetsManager = new RolePresetsManager();
                console.log('[NOTETAKER] 👔 Role presets manager initialized');
            }

            // Initialize transcript editor
            if (typeof TranscriptEditor !== 'undefined') {
                transcriptEditor = new TranscriptEditor();
                console.log('[NOTETAKER] ✏️ Transcript editor initialized');
            }
        }

        this.initEventListeners();
        this.initSpeechRecognition();
    }

    initEventListeners() {
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleRecording());
        }

        // View full transcript button
        const viewFullTranscriptBtn = document.getElementById('viewFullTranscriptBtn');
        if (viewFullTranscriptBtn) {
            viewFullTranscriptBtn.addEventListener('click', () => this.openFullTranscriptViewer());
        }

        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }

        if (this.modalBackdrop) {
            this.modalBackdrop.addEventListener('click', () => this.closeModal());
        }

        // Export buttons
        const exportDocxBtn = document.getElementById('exportDocxBtn');
        const copyTranscriptBtn = document.getElementById('copyTranscriptBtn');

        if (exportDocxBtn) {
            exportDocxBtn.addEventListener('click', () => this.exportDOCX());
        }

        if (copyTranscriptBtn) {
            copyTranscriptBtn.addEventListener('click', () => this.copyToClipboard());
        }

        // Real-time panel controls
        if (this.rtMinimizeBtn) {
            this.rtMinimizeBtn.addEventListener('click', () => this.toggleMinimize());
        }

        if (this.rtCloseBtn) {
            this.rtCloseBtn.addEventListener('click', () => this.closeRTPanel());
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('.rt-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.speakerFilter = btn.dataset.filter;
                console.log('[NOTETAKER] Filter changed to:', this.speakerFilter);
            });
        });

        // Setup toggle button
        if (this.setupToggleBtn) {
            this.setupToggleBtn.addEventListener('click', () => {
                const isVisible = this.setupContent.classList.contains('visible');
                if (isVisible) {
                    this.setupContent.classList.remove('visible');
                    this.setupToggleBtn.classList.remove('expanded');
                } else {
                    this.setupContent.classList.add('visible');
                    this.setupToggleBtn.classList.add('expanded');
                    // Save meeting context
                    this.saveMeetingContext();
                }
            });
        }

        // Save meeting context on input change
        if (this.meetingGoal) {
            this.meetingGoal.addEventListener('change', () => this.saveMeetingContext());
        }
        if (this.partnerInfo) {
            this.partnerInfo.addEventListener('change', () => this.saveMeetingContext());
        }
        if (this.meetingType) {
            this.meetingType.addEventListener('change', () => this.saveMeetingContext());
        }

        // AI recommendation modal controls
        if (this.aiRecClose) {
            this.aiRecClose.addEventListener('click', () => this.closeAIRecModal());
        }
        if (this.aiRecBackdrop) {
            this.aiRecBackdrop.addEventListener('click', () => this.closeAIRecModal());
        }
    }

    saveMeetingContext() {
        if (this.meetingGoal) {
            this.meetingContext.goal = this.meetingGoal.value;
        }
        if (this.partnerInfo) {
            this.meetingContext.partnerInfo = this.partnerInfo.value;
        }
        if (this.meetingType) {
            this.meetingContext.type = this.meetingType.value;
        }
        console.log('[NOTETAKER] 📋 Meeting context saved:', this.meetingContext);
    }

    initSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('[NOTETAKER] Speech Recognition not supported');
            return;
        }

        // Get selected language or auto-detect
        let recognitionLang = 'en-US';
        if (this.langSelect && this.langSelect.value) {
            recognitionLang = this.langSelect.value;
        } else {
            const browserLang = navigator.language || navigator.userLanguage || 'en-US';
            if (browserLang.startsWith('uk')) {
                recognitionLang = 'uk-UA';
            } else if (browserLang.startsWith('ru')) {
                recognitionLang = 'ru-RU';
            } else if (browserLang.startsWith('de')) {
                recognitionLang = 'de-DE';
            } else if (browserLang.startsWith('es')) {
                recognitionLang = 'es-ES';
            } else if (browserLang.startsWith('fr')) {
                recognitionLang = 'fr-FR';
            } else {
                recognitionLang = 'en-US';
            }
        }

        console.log('[NOTETAKER] 🌍 Language:', recognitionLang);

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = recognitionLang;

        // ВАЖЛИВО: Відключити звуки браузера
        this.recognition.maxAlternatives = 1; // Зменшити обробку для швидшості

        // Prevent browser beeping sounds by muting audio context if possible
        try {
            // Create silent audio context to prevent beeps
            if (!window.silentAudioContext) {
                window.silentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = window.silentAudioContext.createOscillator();
                oscillator.connect(window.silentAudioContext.destination);
                oscillator.start(0);
                oscillator.stop(0.001);
            }
        } catch (e) {
            // Ignore if AudioContext not available
        }

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
                this.addToRealtime('me', finalTranscript.trim());
                console.log('[NOTETAKER] 📝 Transcript:', finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            // Suppress ALL browser notification sounds
            event.stopPropagation();
            event.preventDefault();

            // Silent error handling - only log critical errors
            const criticalErrors = ['not-allowed', 'service-not-allowed', 'network'];
            if (criticalErrors.includes(event.error)) {
                console.error('[NOTETAKER] Critical error:', event.error);
                // Show user-friendly message for critical errors
                if (this.statusText) {
                    this.statusText.textContent = 'Microphone access denied';
                }
            } else {
                // Completely ignore common errors silently (no logs, no sounds)
                // These include: 'no-speech', 'audio-capture', 'aborted'
            }

            // Gentle restart logic without spam
            if (event.error === 'no-speech' && this.isRecording && !this.isTogglingRecording) {
                // Wait 1 second before restart to avoid spam
                setTimeout(() => {
                    if (this.isRecording && !this.isTogglingRecording) {
                        try {
                            this.recognition.start();
                        } catch (err) {
                            // Silently ignore if already started
                        }
                    }
                }, 1000);
            }
        };

        this.recognition.onend = () => {
            // Only restart if explicitly recording and not in the middle of toggling
            if (this.isRecording && !this.isTogglingRecording) {
                setTimeout(() => {
                    if (this.isRecording && !this.isTogglingRecording) {
                        try {
                            this.recognition.start();
                        } catch (err) {
                            // Silently ignore if already started
                            console.log('[NOTETAKER] Recognition already active');
                        }
                    }
                }, 500);
            }
        };
    }

    async toggleRecording() {
        // Prevent double-clicking
        if (this.isTogglingRecording) {
            console.log('[NOTETAKER] ⚠️ Already toggling, please wait...');
            return;
        }

        this.isTogglingRecording = true;

        try {
            if (this.isRecording) {
                await this.stopRecording();
            } else {
                await this.startRecording();
            }
        } catch (err) {
            console.error('[NOTETAKER] ❌ Toggle error:', err);
            alert('Error toggling recording: ' + err.message);
        } finally {
            this.isTogglingRecording = false;
        }
    }

    async startRecording() {
        try {
            console.log('[NOTETAKER] 🎙️ Starting recording...');

            // Check if already recording
            if (this.isRecording) {
                console.log('[NOTETAKER] ⚠️ Already recording');
                return;
            }

            // Notify backend
            const response = await fetch('/api/notetaker/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ room_id: this.roomID })
            });

            if (!response.ok) {
                throw new Error('Failed to start notetaker');
            }

            this.isRecording = true;
            this.startTime = new Date();
            this.audioChunks = [];
            this.transcript = '';
            this.wordCount = 0;

            // Start speech recognition
            if (this.recognition) {
                try {
                    // Stop first if running (cleanup)
                    try {
                        this.recognition.stop();
                    } catch (e) {
                        // Ignore if not running
                    }

                    // Wait a bit then start
                    await new Promise(resolve => setTimeout(resolve, 100));
                    this.recognition.start();
                    console.log('[NOTETAKER] 🗣️ Speech recognition started');
                } catch (err) {
                    console.warn('[NOTETAKER] Speech recognition error:', err);
                }
            }

            // Show real-time panel
            this.showRTPanel();
            this.startDurationTimer();

            // Start auto-save for long sessions
            this.startPersistenceTimer();

            // Update UI
            this.toggleBtn.classList.add('recording');
            this.toggleBtn.querySelector('.notetaker-text').textContent = 'Stop Recording';
            this.toggleBtn.querySelector('.notetaker-icon').textContent = '⏺️';
            this.statusText.textContent = 'Recording in progress...';
            this.statusText.style.color = '#ef4444';

            console.log('[NOTETAKER] ✅ Recording started with persistence enabled');
        } catch (error) {
            console.error('[NOTETAKER] ❌ Failed to start recording:', error);
            alert('Failed to start AI Notetaker. Please try again.');
        }
    }

    async stopRecording() {
        try {
            console.log('[NOTETAKER] 🛑 Stopping recording...');

            // Check if not recording
            if (!this.isRecording) {
                console.log('[NOTETAKER] ⚠️ Not recording');
                return;
            }

            this.isRecording = false;

            // Stop speech recognition safely
            if (this.recognition) {
                try {
                    this.recognition.stop();
                    console.log('[NOTETAKER] 🗣️ Speech recognition stopped');
                } catch (err) {
                    console.warn('[NOTETAKER] Speech recognition stop error:', err);
                }
            }

            // Stop duration timer
            this.stopDurationTimer();

            const duration = this.startTime ? new Date() - this.startTime : 0;
            const durationStr = this.formatDuration(duration);

            // Update UI
            this.toggleBtn.classList.remove('recording');
            this.toggleBtn.querySelector('.notetaker-text').textContent = 'Start Recording';
            this.toggleBtn.querySelector('.notetaker-icon').textContent = '🎙️';
            this.statusText.textContent = 'Processing transcript...';
            this.statusText.style.color = '#3b82f6';

            // Notify backend
            try {
                const stopResponse = await fetch('/api/notetaker/stop', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: this.roomID,
                        transcript: this.transcript || 'No transcript available',
                        audio_data: ''
                    })
                });

                if (!stopResponse.ok) {
                    console.warn('[NOTETAKER] ⚠️ Backend stop failed, but continuing...');
                }
            } catch (err) {
                console.warn('[NOTETAKER] ⚠️ Backend stop error:', err);
            }

            console.log('[NOTETAKER] ✅ Recording stopped');

            // Show analysis modal
            this.showAnalysisModal(durationStr);

        } catch (error) {
            console.error('[NOTETAKER] ❌ Failed to stop recording:', error);
            alert('Failed to stop AI Notetaker. Please try again.');
        }
    }

    async showAnalysisModal(duration) {
        // Show modal with loading state
        this.modal.classList.add('active');
        this.modalBackdrop.classList.add('active');
        this.loading.style.display = 'block';
        this.results.style.display = 'none';

        try {
            // Get participant names (you can enhance this)
            const participants = [sessionStorage.getItem('guestName') || 'Host'];

            // Call analysis API
            const response = await fetch('/api/notetaker/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: this.transcript,
                    participants: participants,
                    duration: duration
                })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze transcript');
            }

            const analysis = await response.json();

            // Display results
            this.displayAnalysis(analysis);

            // Store for export
            this.currentAnalysis = analysis;

        } catch (error) {
            console.error('[NOTETAKER] ❌ Analysis failed:', error);
            this.loading.innerHTML = `
                <p style="color: #ef4444;">❌ Analysis failed. Please try again.</p>
                <button onclick="notetaker.closeModal()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; border: none; color: white; border-radius: 8px; cursor: pointer;">Close</button>
            `;
        } finally {
            this.statusText.textContent = 'Record and analyze meeting with AI';
            this.statusText.style.color = '#94a3b8';
        }
    }

    displayAnalysis(analysis) {
        // Hide loading, show results
        this.loading.style.display = 'none';
        this.results.style.display = 'block';

        // Summary
        document.getElementById('analysisSummary').textContent = analysis.summary || 'No summary available';

        // Key Points
        const keyPointsList = document.getElementById('analysisKeyPoints');
        keyPointsList.innerHTML = '';
        if (analysis.key_points && analysis.key_points.length > 0) {
            analysis.key_points.forEach(point => {
                const li = document.createElement('li');
                li.textContent = point;
                keyPointsList.appendChild(li);
            });
        } else {
            keyPointsList.innerHTML = '<li>No key points identified</li>';
        }

        // Action Items
        const actionItemsList = document.getElementById('analysisActionItems');
        actionItemsList.innerHTML = '';
        if (analysis.action_items && analysis.action_items.length > 0) {
            analysis.action_items.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                actionItemsList.appendChild(li);
            });
        } else {
            actionItemsList.innerHTML = '<li>No action items identified</li>';
        }

        // Transcript
        document.getElementById('analysisTranscript').textContent = analysis.transcript || 'No transcript available';

        console.log('[NOTETAKER] ✅ Analysis displayed');
    }

    closeModal() {
        this.modal.classList.remove('active');
        this.modalBackdrop.classList.remove('active');
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    async copyToClipboard() {
        if (!this.currentAnalysis) return;

        const text = this.formatAnalysisText(this.currentAnalysis);

        try {
            await navigator.clipboard.writeText(text);

            // Visual feedback
            const btn = document.getElementById('copyTranscriptBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Copied!
            `;
            btn.style.background = '#10b981';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);

            console.log('[NOTETAKER] 📋 Copied to clipboard');
        } catch (err) {
            console.error('[NOTETAKER] Failed to copy:', err);
            alert('Failed to copy to clipboard');
        }
    }

    formatAnalysisText(analysis) {
        let text = '📝 MEETING ANALYSIS\n';
        text += '='.repeat(50) + '\n\n';

        text += '📋 EXECUTIVE SUMMARY\n';
        text += analysis.summary + '\n\n';

        text += '💡 KEY DISCUSSION POINTS\n';
        if (analysis.key_points && analysis.key_points.length > 0) {
            analysis.key_points.forEach((point, i) => {
                text += `${i + 1}. ${point}\n`;
            });
        }
        text += '\n';

        text += '✅ ACTION ITEMS & DECISIONS\n';
        if (analysis.action_items && analysis.action_items.length > 0) {
            analysis.action_items.forEach((item, i) => {
                text += `${i + 1}. ${item}\n`;
            });
        }
        text += '\n';

        text += '📄 FULL TRANSCRIPT\n';
        text += '='.repeat(50) + '\n';
        text += analysis.transcript + '\n';

        return text;
    }

    async exportDOCX() {
        if (!this.currentAnalysis) return;

        try {
            // Generate HTML content for conversion
            const htmlContent = this.generateHTMLReport(this.currentAnalysis);

            // Create a simple text-based DOCX (for now, we'll use a workaround)
            // In production, you'd use a library like docx.js
            const blob = new Blob([htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);

            // Download
            const a = document.createElement('a');
            a.href = url;
            a.download = `meeting-analysis-${new Date().toISOString().split('T')[0]}.doc`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Visual feedback
            const btn = document.getElementById('exportDocxBtn');
            const originalText = btn.innerHTML;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                Downloaded!
            `;
            btn.style.background = '#10b981';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 2000);

            console.log('[NOTETAKER] 📥 Exported DOCX');
        } catch (err) {
            console.error('[NOTETAKER] Failed to export:', err);
            alert('Failed to export document');
        }
    }

    generateHTMLReport(analysis) {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Meeting Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
        h2 { color: #334155; margin-top: 30px; }
        ul { line-height: 1.8; }
        .transcript { background: #f1f5f9; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-family: monospace; }
        .date { color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <h1>📝 Meeting Analysis</h1>
    <p class="date">Generated on ${new Date().toLocaleString()}</p>

    <h2>📋 Executive Summary</h2>
    <p>${analysis.summary}</p>

    <h2>💡 Key Discussion Points</h2>
    <ul>
        ${analysis.key_points ? analysis.key_points.map(p => `<li>${p}</li>`).join('') : '<li>None</li>'}
    </ul>

    <h2>✅ Action Items & Decisions</h2>
    <ul>
        ${analysis.action_items ? analysis.action_items.map(i => `<li>${i}</li>`).join('') : '<li>None</li>'}
    </ul>

    <h2>📄 Full Transcript</h2>
    <div class="transcript">${analysis.transcript}</div>
</body>
</html>
        `;
    }

    // Real-time panel methods
    showRTPanel() {
        if (this.rtPanel) {
            this.rtPanel.classList.add('active');
        }
    }

    closeRTPanel() {
        if (this.rtPanel) {
            this.rtPanel.classList.remove('active');
            this.rtPanel.classList.remove('minimized');
        }
    }

    toggleMinimize() {
        if (this.rtPanel) {
            this.rtPanel.classList.toggle('minimized');
        }
    }

    async addToRealtime(speaker, text) {
        // Check filter
        if (this.speakerFilter !== 'both' && this.speakerFilter !== speaker) {
            return; // Skip if filtered out
        }

        // Remove empty state if exists
        const emptyState = this.rtContent.querySelector('.rt-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        // Store in conversation history
        const conversationEntry = { speaker, text, timestamp: new Date() };
        this.conversationHistory.push(conversationEntry);

        // Create transcript entry
        const entry = document.createElement('div');
        entry.className = `rt-transcript-entry ${speaker} clickable`;

        const speakerName = speaker === 'me' ? 'You' : 'Partner';
        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        entry.innerHTML = `
            <div class="rt-speaker">${speakerName}<span class="rt-category-badge" style="display:none;"></span></div>
            <div class="rt-text">${text}</div>
            <div class="rt-timestamp">${timestamp}</div>
        `;

        this.rtContent.appendChild(entry);

        // Auto-scroll to bottom
        this.rtContent.scrollTop = this.rtContent.scrollHeight;

        // Update word count
        const words = text.split(/\s+/).filter(w => w.length > 0);
        this.wordCount += words.length;
        if (this.rtWordCount) {
            this.rtWordCount.textContent = `${this.wordCount} words`;
        }

        // Analyze with AI if meeting context is set
        if (this.meetingContext.goal || this.meetingContext.partnerInfo) {
            this.analyzeStatementRealtime(entry, text, speaker);
        }

        // Add click handler for AI recommendations
        entry.addEventListener('click', () => {
            this.showAIRecommendation(text, speaker);
        });
    }

    async analyzeStatementRealtime(entry, text, speaker) {
        try {
            // Get config from meeting config manager
            const config = meetingConfig ? meetingConfig.getConfig() : null;
            if (!config) return;

            const enabledCategories = meetingConfig.getEnabledCategories();
            if (enabledCategories.length === 0) return;

            // Build AI prompt
            const aiPrompt = meetingConfig.buildAIPrompt();

            // Call OpenAI for quick categorization
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: aiPrompt
                        },
                        {
                            role: 'user',
                            content: `Statement by ${speaker}: "${text}"`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 20
                })
            });

            if (!response.ok) {
                console.warn('[NOTETAKER] AI analysis failed:', response.status);
                return;
            }

            const data = await response.json();
            const categoryId = data.choices[0].message.content.trim().toLowerCase();

            // Find matching category
            const matchedCategory = enabledCategories.find(cat => cat.id === categoryId);

            if (matchedCategory) {
                // Apply custom color and class
                entry.classList.add(`cat-${categoryId}`);
                entry.style.borderLeftColor = matchedCategory.color;
                entry.style.background = `linear-gradient(135deg, ${matchedCategory.color}15 0%, ${matchedCategory.color}08 100%)`;

                // Update badge
                const badge = entry.querySelector('.rt-category-badge');
                if (badge) {
                    badge.textContent = matchedCategory.name;
                    badge.style.background = `${matchedCategory.color}33`;
                    badge.style.color = matchedCategory.color;
                    badge.style.display = 'inline-block';
                }

                // Store category in conversationHistory for proper data flow
                const historyEntry = this.conversationHistory.find(h => h.text === text && h.speaker === speaker);
                if (historyEntry) {
                    if (!historyEntry.categories) {
                        historyEntry.categories = [];
                    }
                    if (!historyEntry.categories.includes(matchedCategory.name)) {
                        historyEntry.categories.push(matchedCategory.name);
                    }
                }

                console.log('[NOTETAKER] 🤖 Categorized as:', matchedCategory.name);
            }
        } catch (error) {
            console.warn('[NOTETAKER] AI analysis error:', error);
        }
    }

    async showAIRecommendation(text, speaker) {
        // Show modal with loading state
        this.aiRecModal.classList.add('active');
        this.aiRecBackdrop.classList.add('active');
        this.aiRecBody.innerHTML = `
            <div class="ai-rec-loading">
                <div class="spinner"></div>
                <p style="color: #94a3b8;">Analyzing statement and generating recommendations...</p>
            </div>
        `;

        try {
            // Build conversation context
            const recentHistory = this.conversationHistory.slice(-10).map(entry =>
                `${entry.speaker === 'me' ? 'You' : 'Partner'}: ${entry.text}`
            ).join('\n');

            // Call OpenAI for detailed recommendation
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_OPENAI_API_KEY'
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert meeting advisor. Meeting type: ${this.meetingContext.type}. Goal: ${this.meetingContext.goal || 'Not specified'}. Partner info: ${this.meetingContext.partnerInfo || 'Not specified'}. Provide actionable advice in JSON format with: interpretation, suggested_responses (array of 3), conflict_resolution (if applicable), and next_steps.`
                        },
                        {
                            role: 'user',
                            content: `Recent conversation:\n${recentHistory}\n\nAnalyze this statement by ${speaker}: "${text}"\n\nProvide specific recommendations on how to respond.`
                        }
                    ],
                    temperature: 0.7,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                throw new Error('AI recommendation failed');
            }

            const data = await response.json();
            const recommendation = JSON.parse(data.choices[0].message.content);

            // Display recommendation
            this.displayAIRecommendation(text, speaker, recommendation);

        } catch (error) {
            console.error('[NOTETAKER] AI recommendation error:', error);
            this.aiRecBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #ef4444; font-size: 16px;">❌ Failed to generate recommendation</p>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Please try again</p>
                </div>
            `;
        }
    }

    displayAIRecommendation(text, speaker, recommendation) {
        const speakerName = speaker === 'me' ? 'You' : 'Partner';

        let html = `
            <div class="ai-rec-quote">
                "${text}"
                <div style="margin-top: 8px; color: #64748b; font-size: 12px;">— ${speakerName}</div>
            </div>

            <div class="ai-rec-section">
                <h4>🎯 Interpretation</h4>
                <p>${recommendation.interpretation || 'No interpretation available'}</p>
            </div>

            <div class="ai-rec-section">
                <h4>💬 Suggested Responses</h4>
                <ul>
                    ${recommendation.suggested_responses ? recommendation.suggested_responses.map(r => `<li>${r}</li>`).join('') : '<li>No suggestions available</li>'}
                </ul>
            </div>
        `;

        if (recommendation.conflict_resolution) {
            html += `
                <div class="ai-rec-section">
                    <h4>🤝 Conflict Resolution</h4>
                    <p>${recommendation.conflict_resolution}</p>
                </div>
            `;
        }

        if (recommendation.next_steps) {
            html += `
                <div class="ai-rec-section">
                    <h4>📋 Next Steps</h4>
                    <p>${recommendation.next_steps}</p>
                </div>
            `;
        }

        this.aiRecBody.innerHTML = html;
    }

    closeAIRecModal() {
        if (this.aiRecModal) {
            this.aiRecModal.classList.remove('active');
        }
        if (this.aiRecBackdrop) {
            this.aiRecBackdrop.classList.remove('active');
        }
    }

    startDurationTimer() {
        this.durationTimer = setInterval(() => {
            if (!this.startTime || !this.rtDuration) return;

            const elapsed = Date.now() - this.startTime.getTime();
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            const displayMinutes = minutes % 60;
            const displaySeconds = seconds % 60;

            if (hours > 0) {
                this.rtDuration.textContent = `${hours}:${displayMinutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
            } else {
                this.rtDuration.textContent = `${displayMinutes}:${displaySeconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    stopDurationTimer() {
        if (this.durationTimer) {
            clearInterval(this.durationTimer);
            this.durationTimer = null;
        }
    }

    // Auto-save for long sessions (5 minutes interval)
    startPersistenceTimer() {
        // Save every 5 minutes
        this.persistenceTimer = setInterval(() => {
            this.saveSessionState();
        }, 5 * 60 * 1000);

        console.log('[NOTETAKER] 💾 Auto-save enabled (5min interval)');
    }

    stopPersistenceTimer() {
        if (this.persistenceTimer) {
            clearInterval(this.persistenceTimer);
            this.persistenceTimer = null;
            console.log('[NOTETAKER] 💾 Auto-save disabled');
        }
    }

    saveSessionState() {
        try {
            const state = {
                sessionId: this.sessionId,
                roomID: this.roomID,
                startTime: this.startTime ? this.startTime.getTime() : null,
                transcript: this.transcript,
                conversationHistory: this.conversationHistory,
                wordCount: this.wordCount,
                meetingContext: this.meetingContext,
                savedAt: new Date().getTime()
            };

            // Save to localStorage with session ID
            localStorage.setItem(`notetaker_${this.sessionId}`, JSON.stringify(state));
            this.lastSaveTime = new Date();

            console.log(`[NOTETAKER] 💾 Session auto-saved (${this.conversationHistory.length} entries, ${this.wordCount} words)`);
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to save session:', err);
        }
    }

    restoreSessionState() {
        try {
            const saved = localStorage.getItem(`notetaker_${this.sessionId}`);
            if (saved) {
                const state = JSON.parse(saved);

                this.startTime = state.startTime ? new Date(state.startTime) : null;
                this.transcript = state.transcript || '';
                this.conversationHistory = state.conversationHistory || [];
                this.wordCount = state.wordCount || 0;
                this.meetingContext = state.meetingContext || this.meetingContext;

                console.log(`[NOTETAKER] 🔄 Session restored (${this.conversationHistory.length} entries)`);
                return true;
            }
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to restore session:', err);
        }
        return false;
    }

    clearSessionState() {
        try {
            localStorage.removeItem(`notetaker_${this.sessionId}`);
            console.log('[NOTETAKER] 🗑️ Session state cleared');
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to clear session:', err);
        }
    }

    // Cleanup method for safe shutdown
    cleanup() {
        console.log('[NOTETAKER] 🧹 Cleaning up...');

        // Save final state before cleanup
        if (this.isRecording) {
            this.saveSessionState();
        }

        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording().catch(err => {
                console.warn('[NOTETAKER] Cleanup stop error:', err);
            });
        }

        // Stop recognition
        if (this.recognition) {
            try {
                this.recognition.stop();
                this.recognition.abort();
            } catch (err) {
                // Ignore errors
            }
            this.recognition = null;
        }

        // Stop timers
        if (this.durationTimer) {
            clearInterval(this.durationTimer);
            this.durationTimer = null;
        }

        // Stop persistence timer
        this.stopPersistenceTimer();

        // Reset state
        this.isRecording = false;
        this.isTogglingRecording = false;
        this.audioChunks = [];
        this.transcript = '';
        this.conversationHistory = [];

        console.log('[NOTETAKER] ✅ Cleanup complete');
    }

    // Open full-screen transcript viewer
    openFullTranscriptViewer() {
        console.log('[NOTETAKER] 📜 Opening full transcript viewer...');

        if (typeof transcriptViewer === 'undefined' || !transcriptViewer) {
            console.error('[NOTETAKER] ❌ TranscriptViewer not available');
            alert('Transcript viewer is not loaded. Please refresh the page.');
            return;
        }

        // PRIORITY 1: Use conversationHistory (most reliable)
        let entries = [];

        if (this.conversationHistory && this.conversationHistory.length > 0) {
            console.log('[NOTETAKER] ✅ Using conversationHistory data (', this.conversationHistory.length, 'entries)');

            entries = this.conversationHistory.map(entry => ({
                speaker: entry.speaker === 'me' ? 'You' : 'Partner',
                text: entry.text || '',
                timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : '',
                categories: entry.categories || []
            }));
        } else {
            // FALLBACK: Scrape from DOM if conversationHistory is empty
            console.log('[NOTETAKER] ⚠️ conversationHistory empty, falling back to DOM scraping');

            const rtEntries = document.querySelectorAll('.rt-transcript-entry');

            rtEntries.forEach((entry) => {
                const speaker = entry.querySelector('.rt-speaker')?.textContent || 'Unknown';
                const text = entry.querySelector('.rt-text')?.textContent || '';
                const timestamp = entry.querySelector('.rt-timestamp')?.textContent || '';

                // Get categories from badges
                const categories = [];
                const categoryBadges = entry.querySelectorAll('.rt-category-badge');
                categoryBadges.forEach(badge => {
                    const catName = badge.textContent.trim();
                    if (catName) categories.push(catName);
                });

                entries.push({
                    speaker,
                    text,
                    timestamp,
                    categories
                });
            });
        }

        // Validate we have entries
        if (entries.length === 0) {
            console.warn('[NOTETAKER] ⚠️ No transcript entries to display');
            alert('No transcript entries to display. Start recording first.');
            return;
        }

        // Get category colors from meeting config with fallback
        const categoryColors = {};

        if (typeof meetingConfig !== 'undefined' && meetingConfig && meetingConfig.categories) {
            meetingConfig.categories.forEach(cat => {
                if (cat.enabled && cat.name) {
                    categoryColors[cat.name] = cat.color || this.getDefaultCategoryColor(cat.id);
                }
            });
        } else {
            // Generate default category colors if config not available
            console.log('[NOTETAKER] ⚠️ Meeting config not available, using default category colors');
            const defaultCategories = ['Action Items', 'Decisions', 'Questions', 'Concerns', 'Ideas'];
            const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

            defaultCategories.forEach((catName, index) => {
                categoryColors[catName] = defaultColors[index];
            });
        }

        console.log('[NOTETAKER] 📊 Opening viewer with', entries.length, 'entries and', Object.keys(categoryColors).length, 'category colors');

        // Open viewer with validated data
        transcriptViewer.open(entries, categoryColors);
    }

    // Helper to generate default category colors
    getDefaultCategoryColor(categoryId) {
        const colorMap = {
            'action': '#3b82f6',
            'decision': '#10b981',
            'question': '#f59e0b',
            'concern': '#ef4444',
            'idea': '#8b5cf6',
            'blocker': '#dc2626',
            'agreement': '#059669'
        };

        return colorMap[categoryId] || '#64748b';
    }
}

// Global instance (will be initialized in call.js)
let notetaker = null;
