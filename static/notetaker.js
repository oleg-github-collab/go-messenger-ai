// AI Notetaker - WebRTC Audio Recording & Analysis
class NotetakerAudioMixer {
    constructor() {
        this.audioContext = null;
        this.destination = null;
        this.sources = new Map();
    }

    async init() {
        if (this.audioContext) return;
        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
            throw new Error('AudioContext not supported in this browser');
        }
        this.audioContext = new AudioContextCtor();
        this.destination = this.audioContext.createMediaStreamDestination();
        await this.audioContext.resume().catch(() => {});
    }

    async addStream(stream, key = `stream_${Date.now()}`) {
        if (!stream || this.sources.has(key)) return;
        await this.init();
        try {
            const sourceNode = this.audioContext.createMediaStreamSource(stream);
            sourceNode.connect(this.destination);
            this.sources.set(key, { sourceNode, stream });
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to add stream to mixer:', err);
        }
    }

    removeStream(key) {
        const entry = this.sources.get(key);
        if (!entry) return;
        try {
            entry.sourceNode.disconnect();
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to disconnect source node:', err);
        }
        this.sources.delete(key);
    }

    getStream() {
        return this.destination ? this.destination.stream : null;
    }

    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume().catch(() => {});
        }
    }

    cleanup() {
        this.sources.forEach(({ sourceNode }) => {
            try {
                sourceNode.disconnect();
            } catch (err) {
                console.warn('[NOTETAKER] ⚠️ Failed to disconnect source during cleanup:', err);
            }
        });
        this.sources.clear();

        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (err) {
                console.warn('[NOTETAKER] ⚠️ Failed to close audio context:', err);
            }
        }
        this.audioContext = null;
        this.destination = null;
    }
}

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

        // Speaker controls
        this.speakerSelect = document.getElementById('notetakerSpeakerSelect');
        this.cycleSpeakerBtn = document.getElementById('notetakerCycleSpeakerBtn');
        this.bookmarkBtn = document.getElementById('notetakerBookmarkBtn');
        this.highlightBtn = document.getElementById('notetakerHighlightBtn');
        this.floatingPanel = document.getElementById('notetakerFloatingPanel');
        this.collapseBtn = document.getElementById('notetakerCollapseBtn');
        this.expandBtn = document.getElementById('notetakerExpandBtn');

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

        this.analysisMeta = null;
        this.loadingDefaultHTML = '';

        // Participants & speaker mapping
        this.participants = new Map();
        this.speakerAssignments = new Map();
        this.lastEntryBySpeaker = new Map();
        this.entryElements = new Map();
        this.activeSpeakerId = null;
        this.localParticipantId = null;
        this.lastAddedEntryId = null;

        // Audio mixing
        this.remoteStreams = new Map();
        this.pendingRemoteStreams = new Map();
        this.audioMixer = null;

        // Panel state
        this.isPanelCollapsed = false;

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
        this.registerGlobalListeners();
        this.restorePanelCollapsedState();
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

        if (this.speakerSelect) {
            this.speakerSelect.addEventListener('change', (e) => this.setActiveSpeaker(e.target.value));
        }

        if (this.cycleSpeakerBtn) {
            this.cycleSpeakerBtn.addEventListener('click', () => this.cycleActiveSpeaker());
        }

        if (this.bookmarkBtn) {
            this.bookmarkBtn.addEventListener('click', () => this.bookmarkCurrentMoment());
        }

        if (this.highlightBtn) {
            this.highlightBtn.addEventListener('click', () => this.toggleHighlightLastEntry());
        }

        if (this.collapseBtn) {
            this.collapseBtn.addEventListener('click', () => this.setPanelCollapsed(true));
        }

        if (this.expandBtn) {
            this.expandBtn.addEventListener('click', () => this.setPanelCollapsed(false));
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

            // Release audio capture resources
            this.releaseRecordingResources();

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

        if (!this.loadingDefaultHTML) {
            this.loadingDefaultHTML = this.loading.innerHTML;
        } else {
            this.loading.innerHTML = this.loadingDefaultHTML;
        }

        let analysis;
        let analysisMeta = { isFallback: false, error: null };

        try {
            const participants = [sessionStorage.getItem('guestName') || 'Host'];
            analysis = await this.requestServerAnalysis(participants, duration);
        } catch (error) {
            console.error('[NOTETAKER] ❌ Analysis failed:', error);
            analysisMeta = {
                isFallback: true,
                error: error?.message || 'Unknown analysis error'
            };
            analysis = this.generateLocalAnalysis(duration);
        }

        this.currentAnalysis = analysis;
        this.displayAnalysis(analysis, analysisMeta);

        if (analysisMeta.isFallback) {
            this.statusText.textContent = 'Local summary ready (server unavailable)';
            this.statusText.style.color = '#facc15';
        } else {
            this.statusText.textContent = 'Record and analyze meeting with AI';
            this.statusText.style.color = '#94a3b8';
        }
    }

    async requestServerAnalysis(participants, duration) {
        try {
            const response = await fetch('/api/notetaker/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript: this.transcript,
                    participants,
                    duration
                })
            });

            if (!response.ok) {
                let errorDetail = '';
                try {
                    const data = await response.json();
                    errorDetail = data?.error || data?.message || '';
                } catch (parseErr) {
                    // Ignore parse error, fallback to status text
                }

                const message = errorDetail
                    ? `Server error (${response.status}): ${errorDetail}`
                    : `Failed to analyze transcript (status ${response.status})`;

                const error = new Error(message);
                error.status = response.status;
                throw error;
            }

            const analysis = await response.json();
            if (!analysis || typeof analysis !== 'object') {
                throw new Error('Server returned an empty analysis payload');
            }

            analysis.source = 'server';
            return analysis;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Analysis request was aborted. Please try again.');
            }
            throw error;
        }
    }

    generateLocalAnalysis(duration) {
        const transcriptText = (this.transcript || '').trim();
        const entries = Array.isArray(this.conversationHistory) ? [...this.conversationHistory] : [];

        if (!entries.length && transcriptText) {
            entries.push({
                speakerName: 'Participant',
                text: transcriptText
            });
        }

        const speakers = Array.from(new Set(entries.map(entry => entry.speakerName || entry.speaker || '').filter(Boolean)));
        const categories = new Map();
        const uniqueSentences = [];
        const actionItems = [];

        const actionRegex = /(action|todo|follow up|deadline|assign|next step|deliver|should|need to)/i;

        entries.forEach(entry => {
            const text = (entry.text || '').trim();
            if (!text) return;

            if (!uniqueSentences.includes(text)) {
                uniqueSentences.push(text);
            }

            if (actionRegex.test(text) && !actionItems.includes(text)) {
                actionItems.push(text);
            }

            if (Array.isArray(entry.categories)) {
                entry.categories.forEach(cat => {
                    const id = cat.id || cat.name || cat;
                    if (!id) return;
                    const name = cat.name || cat.id || id;
                    categories.set(id, name);
                });
            }
        });

        const keyPoints = uniqueSentences.slice(0, 5);
        const summaryParts = [];

        if (speakers.length > 0) {
            summaryParts.push(`Participants: ${speakers.join(', ')}.`);
        }

        if (duration) {
            summaryParts.push(`Meeting duration: ${duration}.`);
        }

        if (categories.size > 0) {
            summaryParts.push(`Focus areas captured: ${Array.from(categories.values()).slice(0, 6).join(', ')}.`);
        }

        if (uniqueSentences.length > 0) {
            summaryParts.push('Top highlights are listed below for quick review.');
        }

        const fallbackSummary = summaryParts.join(' ');

        return {
            summary: fallbackSummary || 'Meeting transcript captured. Review the highlights and transcript below.',
            key_points: keyPoints.length ? keyPoints : ['No distinct highlights detected automatically.'],
            action_items: actionItems.length ? actionItems.slice(0, 5) : ['No explicit action items detected.'],
            decisions: [],
            transcript: transcriptText || entries.map(entry => `${entry.speakerName || entry.speaker || 'Speaker'}: ${entry.text}`).join('\n'),
            source: 'local-fallback'
        };
    }

    displayAnalysis(analysis, meta = {}) {
        this.analysisMeta = meta;
        this.loading.style.display = 'none';
        this.results.style.display = 'block';

        const banner = document.getElementById('analysisStatusBanner');
        if (banner) {
            if (meta.isFallback) {
                banner.style.display = 'flex';
                banner.classList.remove('info', 'success', 'warning', 'error');
                banner.classList.add('warning');

                const message = meta.error ? `Server analysis unavailable. Generated a local summary instead. (${meta.error})` : 'Server analysis unavailable. Generated a local summary instead.';
                banner.textContent = message;
            } else {
                banner.style.display = 'none';
            }
        }

        // Hide loading, show results
        const summaryText = analysis.summary || 'No summary available';
        document.getElementById('analysisSummary').textContent = summaryText;

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
        const meta = this.analysisMeta || {};

        const escapeHtml = (str) => {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        };

        const fallbackNotice = meta.isFallback
            ? `<div class="fallback-notice" style="background:#fff4ce;border:1px solid #facc15;padding:12px 16px;border-radius:8px;margin-bottom:24px;color:#92400e;font-size:14px;">
                <strong>Note:</strong> This summary was generated locally because the analysis service was unavailable.${meta.error ? ` Error: ${escapeHtml(meta.error)}.` : ''}
              </div>`
            : '';

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

    ${fallbackNotice}

    <h2>📋 Executive Summary</h2>
    <p>${escapeHtml(analysis.summary)}</p>

    <h2>💡 Key Discussion Points</h2>
    <ul>
        ${analysis.key_points ? analysis.key_points.map(p => `<li>${escapeHtml(p)}</li>`).join('') : '<li>None</li>'}
    </ul>

    <h2>✅ Action Items & Decisions</h2>
    <ul>
        ${analysis.action_items ? analysis.action_items.map(i => `<li>${escapeHtml(i)}</li>`).join('') : '<li>None</li>'}
    </ul>

    <h2>📄 Full Transcript</h2>
    <div class="transcript">${escapeHtml(analysis.transcript)}</div>
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

    registerGlobalListeners() {
        this.participantsListener = (event) => {
            if (!event || !event.detail) return;
            this.updateParticipants(event.detail);
        };
        this.messageListener = (event) => {
            if (!event || !event.detail) return;
            this.handleExternalMessage(event.detail);
        };
        this.remoteTrackListener = (event) => {
            if (!event || !event.detail) return;
            this.trackRemoteStream(event.detail);
        };

        window.addEventListener('notetaker-participants', this.participantsListener);
        window.addEventListener('notetaker-message', this.messageListener);
        window.addEventListener('notetaker-remote-track', this.remoteTrackListener);

        // Request initial data
        try {
            window.dispatchEvent(new CustomEvent('notetaker-sync-request', {
                detail: { roomID: this.roomID }
            }));
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to request participants sync:', err);
        }
    }

    updateParticipants(detail) {
        if (!detail || detail.roomID !== this.roomID || !Array.isArray(detail.participants)) {
            return;
        }

        this.participants.clear();
        let detectedLocal = null;

        detail.participants.forEach(participant => {
            if (!participant || !participant.id) return;
            const info = {
                name: participant.name || `Participant ${participant.id}`,
                isLocal: !!participant.isLocal
            };
            this.participants.set(participant.id, info);
            if (info.isLocal) {
                detectedLocal = participant.id;
            }
        });

        if (detectedLocal) {
            this.localParticipantId = detectedLocal;
        } else if (!this.localParticipantId && this.isHost && detail.participants.length > 0) {
            this.localParticipantId = detail.participants[0].id;
        }

        this.refreshSpeakerSelect();
    }

    refreshSpeakerSelect() {
        if (!this.speakerSelect) return;

        const previouslySelected = this.activeSpeakerId || this.speakerSelect.value;
        this.speakerSelect.innerHTML = '';

        if (this.participants.size === 0) {
            const option = document.createElement('option');
            option.value = this.localParticipantId || 'host';
            option.textContent = 'You';
            this.speakerSelect.appendChild(option);
            this.activeSpeakerId = option.value;
            return;
        }

        this.participants.forEach((info, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = info.isLocal ? `${info.name} (You)` : info.name;
            this.speakerSelect.appendChild(option);
        });

        let defaultId = previouslySelected;
        if (!defaultId || !this.participants.has(defaultId)) {
            defaultId = this.localParticipantId || this.participants.keys().next().value;
        }

        if (defaultId) {
            this.speakerSelect.value = defaultId;
            this.setActiveSpeaker(defaultId);
        }
    }

    setActiveSpeaker(speakerId) {
        if (!speakerId) return;
        this.activeSpeakerId = speakerId;
        if (this.speakerSelect && this.speakerSelect.value !== speakerId) {
            this.speakerSelect.value = speakerId;
        }
    }

    cycleActiveSpeaker() {
        if (this.participants.size === 0) return;
        const ids = Array.from(this.participants.keys());
        if (this.localParticipantId && !ids.includes(this.localParticipantId)) {
            ids.unshift(this.localParticipantId);
        }

        const currentIndex = ids.indexOf(this.activeSpeakerId || this.localParticipantId);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % ids.length;
        const nextId = ids[nextIndex];
        this.setActiveSpeaker(nextId);
    }

    getParticipantDisplayName(participantId) {
        if (!participantId) return 'Unknown';
        if (participantId === this.localParticipantId || participantId === 'host') {
            const local = this.participants.get(participantId);
            return local ? `${local.name} (You)` : 'You';
        }
        const info = this.participants.get(participantId);
        if (info) return info.name;
        return `Participant ${participantId}`;
    }

    getFirstRemoteParticipantId() {
        for (const [id, info] of this.participants.entries()) {
            if (!info.isLocal) return id;
        }
        return null;
    }

    handleExternalMessage(detail) {
        if (!detail || detail.roomID !== this.roomID || !detail.text) return;

        const isLocalDirection = detail.direction === 'sent';
        let speakerId = detail.fromId;

        if (!speakerId) {
            speakerId = isLocalDirection ? (this.localParticipantId || 'host') : (this.getFirstRemoteParticipantId() || 'remote');
        }

        const speakerName = detail.fromName || this.getParticipantDisplayName(speakerId);

        this.addToRealtime({
            speakerId,
            speakerName,
            text: detail.text,
            timestamp: detail.timestamp || Date.now(),
            source: detail.kind || 'chat',
            metadata: {
                direction: detail.direction,
                isPrivate: detail.isPrivate,
                messageId: detail.messageId || null
            }
        });
    }

    trackRemoteStream(detail) {
        if (!detail || detail.roomID !== this.roomID || !detail.stream) {
            return;
        }

        const streamKey = detail.participantId || detail.participantStreamId || `remote-${Date.now()}`;
        this.remoteStreams.set(streamKey, detail.stream);

        if (this.audioMixer) {
            this.audioMixer.addStream(detail.stream, streamKey).catch(err => {
                console.warn('[NOTETAKER] ⚠️ Failed to add remote stream to mixer:', err);
            });
        } else {
            this.pendingRemoteStreams.set(streamKey, detail.stream);
        }
    }

    async prepareRecordingStream(localStream) {
        if (!localStream) throw new Error('Local audio stream missing for notetaker');

        this.localCaptureStream = localStream;
        this.audioMixer = new NotetakerAudioMixer();

        await this.audioMixer.addStream(localStream, 'local');

        const addPromises = [];
        this.remoteStreams.forEach((stream, key) => {
            addPromises.push(this.audioMixer.addStream(stream, key));
        });
        this.pendingRemoteStreams.forEach((stream, key) => {
            addPromises.push(this.audioMixer.addStream(stream, key));
            this.pendingRemoteStreams.delete(key);
        });

        if (addPromises.length) {
            await Promise.all(addPromises).catch(err => {
                console.warn('[NOTETAKER] ⚠️ Failed to add some streams to mixer:', err);
            });
        }

        await this.audioMixer.resume();
        const mixedStream = this.audioMixer.getStream();
        this.recordingStream = mixedStream || localStream;

        return this.recordingStream;
    }

    releaseRecordingResources() {
        if (this.audioMixer) {
            this.audioMixer.cleanup();
            this.audioMixer = null;
        }

        if (this.localCaptureStream) {
            try {
                this.localCaptureStream.getTracks().forEach(track => track.stop());
            } catch (err) {
                console.warn('[NOTETAKER] ⚠️ Failed to stop local capture stream:', err);
            }
            this.localCaptureStream = null;
        }

        this.recordingStream = null;
    }

    resolveCategoryData(category) {
        if (!category) return null;
        const categoryId = typeof category === 'string' ? category : category.id;

        if (typeof meetingConfig !== 'undefined' && meetingConfig) {
            const config = meetingConfig.getConfig ? meetingConfig.getConfig() : meetingConfig.config;
            const categories = config?.categories || meetingConfig.categories || [];
            const found = categories.find(cat => cat.id === categoryId || cat.name === categoryId);
            if (found) {
                return {
                    id: found.id,
                    name: found.name,
                    color: found.color || '#3b82f6'
                };
            }
        }

        return {
            id: categoryId,
            name: typeof category === 'string' ? category : (category.name || categoryId),
            color: category.color || '#3b82f6'
        };
    }

    applyCategoriesToEntry(entryId, categories = []) {
        if (!entryId || !Array.isArray(categories) || categories.length === 0) return;
        const entryEl = this.entryElements.get(entryId);
        if (!entryEl) return;

        const normalized = categories.map(cat => this.resolveCategoryData(cat)).filter(Boolean);
        if (normalized.length === 0) return;

        const badge = entryEl.querySelector('.rt-category-badge');
        const primary = normalized[0];

        if (badge) {
            badge.textContent = normalized.map(cat => cat.name).join(' • ');
            badge.style.display = 'inline-block';
            badge.style.background = `${primary.color}33`;
            badge.style.color = primary.color;
        }

        entryEl.classList.add(`cat-${primary.id}`);
        entryEl.style.borderLeftColor = primary.color;
        entryEl.style.background = `linear-gradient(135deg, ${primary.color}15 0%, ${primary.color}08 100%)`;

        const historyEntry = this.conversationHistory.find(item => item.id === entryId);
        if (historyEntry) {
            historyEntry.categories = normalized;
        }

        if (window.transcriptManager && typeof window.transcriptManager.categorizeEntry === 'function') {
            normalized.forEach(cat => {
                window.transcriptManager.categorizeEntry(entryId, cat.id, 0.9);
            });
        }
    }

    updateEntryHighlightState(entryId, isHighlighted) {
        const entryEl = this.entryElements.get(entryId);
        if (entryEl) {
            entryEl.classList.toggle('highlighted', isHighlighted);
        }

        const historyEntry = this.conversationHistory.find(item => item.id === entryId);
        if (historyEntry) {
            historyEntry.isHighlight = isHighlighted;
        }
    }

    updateBookmarkState(entryId, isBookmarked) {
        const entryEl = this.entryElements.get(entryId);
        if (entryEl) {
            entryEl.classList.toggle('rt-bookmarked', isBookmarked);
        }

        const historyEntry = this.conversationHistory.find(item => item.id === entryId);
        if (historyEntry) {
            historyEntry.metadata = historyEntry.metadata || {};
            historyEntry.metadata.bookmarked = isBookmarked;
        }
    }

    getLastEntryIdForSpeaker(speakerId) {
        if (speakerId && this.lastEntryBySpeaker.has(speakerId)) {
            return this.lastEntryBySpeaker.get(speakerId);
        }
        return this.lastAddedEntryId;
    }

    bookmarkCurrentMoment() {
        const entryId = this.getLastEntryIdForSpeaker(this.activeSpeakerId || this.localParticipantId);
        if (!entryId) {
            alert('No transcript entries to bookmark yet.');
            return;
        }

        const historyEntry = this.conversationHistory.find(item => item.id === entryId);
        const isBookmarked = !(historyEntry?.metadata?.bookmarked);
        this.updateBookmarkState(entryId, isBookmarked);
    }

    toggleHighlightLastEntry() {
        const entryId = this.getLastEntryIdForSpeaker(this.activeSpeakerId || this.localParticipantId);
        if (!entryId) {
            alert('No transcript entries to highlight yet.');
            return;
        }

        let highlighted = false;
        if (window.transcriptManager && typeof window.transcriptManager.toggleHighlight === 'function') {
            highlighted = window.transcriptManager.toggleHighlight(entryId);
        } else {
            const historyEntry = this.conversationHistory.find(item => item.id === entryId);
            highlighted = !(historyEntry?.isHighlight);
        }

        this.updateEntryHighlightState(entryId, highlighted);
    }

    setPanelCollapsed(collapsed) {
        if (!this.floatingPanel) return;

        if (collapsed) {
            this.floatingPanel.classList.add('collapsed');
            if (this.collapseBtn) this.collapseBtn.style.display = 'none';
            if (this.expandBtn) this.expandBtn.style.display = 'inline-flex';
        } else {
            this.floatingPanel.classList.remove('collapsed');
            if (this.collapseBtn) this.collapseBtn.style.display = 'inline-flex';
            if (this.expandBtn) this.expandBtn.style.display = 'none';
        }

        this.isPanelCollapsed = collapsed;
        this.savePanelCollapsedState(collapsed);
    }

    restorePanelCollapsedState() {
        if (!this.floatingPanel) return;
        const stored = localStorage.getItem('notetaker_panel_collapsed');
        const collapsed = stored === 'true';
        if (collapsed) {
            this.setPanelCollapsed(true);
        } else {
            this.setPanelCollapsed(false);
        }
    }

    savePanelCollapsedState(collapsed) {
        try {
            localStorage.setItem('notetaker_panel_collapsed', collapsed ? 'true' : 'false');
        } catch (err) {
            console.warn('[NOTETAKER] ⚠️ Failed to persist panel collapse state:', err);
        }
    }

    resolveSpeakerId(label) {
        if (!label) {
            return this.localParticipantId || 'host';
        }

        if (this.speakerAssignments.has(label)) {
            return this.speakerAssignments.get(label);
        }

        const normalized = label.toLowerCase();
        if (normalized.includes('1') || normalized.includes('host')) {
            const localId = this.localParticipantId || 'host';
            this.speakerAssignments.set(label, localId);
            return localId;
        }

        const assignedIds = new Set(this.speakerAssignments.values());
        let candidate = null;
        for (const [id, info] of this.participants.entries()) {
            if (!info.isLocal && !assignedIds.has(id)) {
                candidate = id;
                break;
            }
        }
        if (!candidate) {
            candidate = this.getFirstRemoteParticipantId();
        }
        if (!candidate) {
            candidate = `speaker-${this.speakerAssignments.size + 1}`;
        }
        this.speakerAssignments.set(label, candidate);
        return candidate;
    }

    ingestTranscriptionResult(result, options = {}) {
        if (!result || !result.text) return;

        const baseTimestamp = options.capturedAt || Date.now();
        const segments = Array.isArray(result.segments) && result.segments.length > 0
            ? result.segments
            : [{ text: result.text, start: 0, speaker: 'Speaker 1' }];

        const createdEntryIds = [];

        segments.forEach(segment => {
            const segmentText = (segment.text || '').trim();
            if (!segmentText) return;

            const speakerId = this.resolveSpeakerId(segment.speaker || segment.spk || segment.speaker_tag || 'Speaker 1');
            const speakerName = this.getParticipantDisplayName(speakerId);
            const relativeMs = typeof segment.start === 'number' ? segment.start * 1000 : 0;
            const timestamp = baseTimestamp + relativeMs;

            const entryData = this.addToRealtime({
                speakerId,
                speakerName,
                text: segmentText,
                timestamp,
                source: 'speech',
                metadata: {
                    segmentStart: segment.start,
                    segmentEnd: segment.end,
                    segmentId: segment.id || null,
                    confidence: segment.avg_logprob || null,
                    language: result.language || options.language || null
                }
            });

            if (entryData && entryData.id) {
                createdEntryIds.push(entryData.id);
            }
        });

        // Auto categorization with keyword heuristic
        if (segments && segments.length) {
            segments.forEach((segment, index) => {
                if (!createdEntryIds[index]) return;
                if (!segment.text) return;

                const lowerText = segment.text.toLowerCase();
                const autoCategories = [];
                if (lowerText.match(/action|todo|need to|необхідно|маємо зробити/)) {
                    autoCategories.push('action');
                }
                if (lowerText.match(/decided|agree|вирішили|домовились|decision/)) {
                    autoCategories.push('decision');
                }
                if (lowerText.match(/\?|how|what|why|коли|чому|яким чином/)) {
                    autoCategories.push('question');
                }
                if (lowerText.match(/concern|problem|issue|хвилює|переживаю|ризик/)) {
                    autoCategories.push('concern');
                }

                if (autoCategories.length > 0) {
                    this.applyCategoriesToEntry(createdEntryIds[index], autoCategories);
                }
            });
        }
    }

    async addToRealtime(entryInput) {
        if (!entryInput || !entryInput.text) {
            return null;
        }

        const speakerId = entryInput.speakerId || this.localParticipantId || 'host';
        const speakerName = entryInput.speakerName || this.getParticipantDisplayName(speakerId);
        const timestamp = entryInput.timestamp ? new Date(entryInput.timestamp) : new Date();
        const source = entryInput.source || 'speech';

        if (this.speakerFilter !== 'both') {
            const isLocal = speakerId === this.localParticipantId || speakerId === 'host';
            if (this.speakerFilter === 'me' && !isLocal) {
                return null;
            }
            if (this.speakerFilter === 'partner' && isLocal) {
                return null;
            }
        }

        const emptyState = this.rtContent.querySelector('.rt-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        let transcriptEntry = null;
        if (window.transcriptManager && typeof window.transcriptManager.addEntry === 'function') {
            transcriptEntry = window.transcriptManager.addEntry(
                entryInput.text,
                timestamp.getTime(),
                speakerName,
                {
                    speakerId,
                    source,
                    metadata: entryInput.metadata || {}
                }
            );
        }

        const entryId = transcriptEntry?.id || entryInput.id || `nt-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const entryData = {
            id: entryId,
            speakerId,
            speakerName,
            text: entryInput.text,
            timestamp,
            source,
            metadata: entryInput.metadata || {},
            categories: entryInput.categories ? [...entryInput.categories] : [],
            isHighlight: !!entryInput.isHighlight
        };

        this.conversationHistory.push(entryData);
        this.lastEntryBySpeaker.set(speakerId, entryId);
        this.lastAddedEntryId = entryId;

        const entry = document.createElement('div');
        entry.className = `rt-transcript-entry clickable ${speakerId === this.localParticipantId ? 'local-speaker' : 'remote-speaker'}`;
        entry.dataset.entryId = entryId;
        entry.dataset.speakerId = speakerId;

        const timeLabel = timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        entry.innerHTML = `
            <div class="rt-speaker">${speakerName}<span class="rt-category-badge" style="${entryData.categories.length ? '' : 'display:none;'}"></span></div>
            <div class="rt-text">${entryData.text}</div>
            <div class="rt-timestamp">${timeLabel}</div>
        `;

        this.rtContent.appendChild(entry);
        this.entryElements.set(entryId, entry);

        this.rtContent.scrollTop = this.rtContent.scrollHeight;

        const words = entryData.text.split(/\s+/).filter(Boolean);
        this.wordCount += words.length;
        if (this.rtWordCount) {
            this.rtWordCount.textContent = `${this.wordCount} words`;
        }

        this.transcript += `${speakerName}: ${entryData.text}\n`;

        if (entryData.categories.length > 0) {
            this.applyCategoriesToEntry(entryId, entryData.categories);
        }

        if (entryData.isHighlight) {
            this.updateEntryHighlightState(entryId, true);
        }

        if (entryData.metadata?.bookmarked) {
            this.updateBookmarkState(entryId, true);
        }

        if (this.meetingContext.goal || this.meetingContext.partnerInfo) {
            this.analyzeStatementRealtime(entry, entryData);
        }

        entry.addEventListener('click', () => {
            this.showAIRecommendation(entryData);
        });

        return entryData;
    }

    async analyzeStatementRealtime(entry, entryData) {
        try {
            const config = meetingConfig ? meetingConfig.getConfig() : null;
            if (!config) return;

            const enabledCategories = meetingConfig.getEnabledCategories();
            if (enabledCategories.length === 0) return;

            const aiPrompt = meetingConfig.buildAIPrompt();

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
                            content: `Statement by ${entryData.speakerName}: "${entryData.text}"`
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

            const matchedCategory = enabledCategories.find(cat => cat.id === categoryId);

            if (matchedCategory) {
                this.applyCategoriesToEntry(entryData.id, [matchedCategory.id]);
                console.log('[NOTETAKER] 🤖 Categorized as:', matchedCategory.name);
            }
        } catch (error) {
            console.warn('[NOTETAKER] AI analysis error:', error);
        }
    }

    async showAIRecommendation(entryData) {
        this.aiRecModal.classList.add('active');
        this.aiRecBackdrop.classList.add('active');
        this.aiRecBody.innerHTML = `
            <div class="ai-rec-loading">
                <div class="spinner"></div>
                <p style="color: #94a3b8;">Analyzing statement and generating recommendations...</p>
            </div>
        `;

        try {
            const recentHistory = this.conversationHistory.slice(-10).map(entry =>
                `${entry.speakerName || entry.speakerId}: ${entry.text}`
            ).join('\n');

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
                            content: `Recent conversation:
${recentHistory}

Analyze this statement by ${entryData.speakerName}: "${entryData.text}"

Provide specific recommendations on how to respond.`
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

            this.displayAIRecommendation(entryData, recommendation);

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

    displayAIRecommendation(entryData, recommendation) {
        const speakerName = entryData.speakerName || this.getParticipantDisplayName(entryData.speakerId);

        let html = `
            <div class="ai-rec-quote">
                "${entryData.text}"
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
            const historySnapshot = this.conversationHistory.map(entry => ({
                ...entry,
                timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp,
                categories: Array.isArray(entry.categories) ? entry.categories.map(cat => {
                    if (!cat) return null;
                    if (typeof cat === 'string') {
                        return { id: cat, name: cat };
                    }
                    return {
                        id: cat.id || cat.name,
                        name: cat.name || cat.id,
                        color: cat.color || '#3b82f6'
                    };
                }).filter(Boolean) : []
            }));

            const state = {
                sessionId: this.sessionId,
                roomID: this.roomID,
                startTime: this.startTime ? this.startTime.getTime() : null,
                transcript: this.transcript,
                conversationHistory: historySnapshot,
                wordCount: this.wordCount,
                meetingContext: this.meetingContext,
                savedAt: Date.now()
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
                this.conversationHistory = Array.isArray(state.conversationHistory) ? state.conversationHistory.map(entry => ({
                    ...entry,
                    timestamp: entry.timestamp ? new Date(entry.timestamp) : null,
                    categories: Array.isArray(entry.categories) ? entry.categories.map(cat => ({
                        id: cat.id || cat.name,
                        name: cat.name || cat.id,
                        color: cat.color || '#3b82f6'
                    })) : []
                })) : [];
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

        // Remove global listeners
        if (this.participantsListener) {
            window.removeEventListener('notetaker-participants', this.participantsListener);
            this.participantsListener = null;
        }
        if (this.messageListener) {
            window.removeEventListener('notetaker-message', this.messageListener);
            this.messageListener = null;
        }
        if (this.remoteTrackListener) {
            window.removeEventListener('notetaker-remote-track', this.remoteTrackListener);
            this.remoteTrackListener = null;
        }

        // Release audio resources
        this.releaseRecordingResources();
        this.pendingRemoteStreams.clear();
        this.remoteStreams.clear();
        this.entryElements.clear();
        this.lastEntryBySpeaker.clear();

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
                speaker: entry.speakerName || this.getParticipantDisplayName(entry.speakerId) || 'Participant',
                text: entry.text || '',
                timestamp: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) : '',
                categories: Array.isArray(entry.categories) ? entry.categories.map(cat => cat.name || cat.id || cat) : []
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
