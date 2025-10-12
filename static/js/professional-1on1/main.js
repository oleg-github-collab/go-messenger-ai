/**
 * Professional 1-on-1 Call with AI Assistant
 * Full integration: 100ms SDK + GPT-4o + Polls + Whiteboard
 */

class Professional1on1Call {
    constructor() {
        this.hmsManager = null;
        this.hmsActions = null;
        this.hmsStore = null;
        this.localPeer = null;
        this.remotePeer = null;

        // State
        this.isHost = true; // For testing, always host
        this.callStartTime = null;
        this.timerInterval = null;
        this.transcriptEntries = [];
        this.bookmarks = [];
        this.chatMessages = [];

        // Whiteboard
        this.whiteboardCtx = null;
        this.isDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#4facfe';

        this.init();
    }

    async init() {
        console.log('[1-ON-1] Initializing...');

        // Show loading steps
        await this.showLoadingSteps();

        // Cache DOM
        this.cacheDOM();

        // Setup events
        this.setupEvents();

        // Initialize 100ms
        await this.init100ms();

        // Hide loading
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('callContainer').style.display = 'flex';

        // Start call timer
        this.startCallTimer();
    }

    async showLoadingSteps() {
        const steps = ['step1', 'step2', 'step3'];
        for (let i = 0; i < steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            document.getElementById(steps[i]).classList.add('active');
        }
    }

    cacheDOM() {
        this.dom = {
            // Videos
            remoteVideo: document.getElementById('remoteVideo'),
            localVideo: document.getElementById('localVideo'),
            remotePlaceholder: document.getElementById('remotePlaceholder'),

            // Controls
            micBtn: document.getElementById('micBtn'),
            cameraBtn: document.getElementById('cameraBtn'),
            screenShareBtn: document.getElementById('screenShareBtn'),
            reactionsBtn: document.getElementById('reactionsBtn'),
            chatBtn: document.getElementById('chatBtn'),
            pollBtn: document.getElementById('pollBtn'),
            whiteboardBtn: document.getElementById('whiteboardBtn'),
            recordBtn: document.getElementById('recordBtn'),
            endCallBtn: document.getElementById('endCallBtn'),
            backBtn: document.getElementById('backBtn'),

            // Transcript
            transcriptList: document.getElementById('transcriptList'),
            togglePanelBtn: document.getElementById('togglePanelBtn'),
            transcriptPanel: document.getElementById('transcriptPanel'),
            bookmarkBtn: document.getElementById('bookmarkBtn'),
            exportBtn: document.getElementById('exportBtn'),

            // AI Modal
            aiModalBackdrop: document.getElementById('aiModalBackdrop'),
            aiRecommendationModal: document.getElementById('aiRecommendationModal'),
            closeAiModalBtn: document.getElementById('closeAiModalBtn'),
            aiModalBody: document.getElementById('aiModalBody'),

            // Chat
            chatPanel: document.getElementById('chatPanel'),
            chatMessages: document.getElementById('chatMessages'),
            chatInput: document.getElementById('chatInput'),
            sendChatBtn: document.getElementById('sendChatBtn'),
            closeChatBtn: document.getElementById('closeChatBtn'),

            // Poll
            pollModal: document.getElementById('pollModal'),
            closePollBtn: document.getElementById('closePollBtn'),
            createPollBtn: document.getElementById('createPollBtn'),

            // Whiteboard
            whiteboardContainer: document.getElementById('whiteboardContainer'),
            whiteboardCanvas: document.getElementById('whiteboardCanvas'),
            closeWhiteboardBtn: document.getElementById('closeWhiteboardBtn'),

            // Timer
            callTimer: document.getElementById('callTimer'),
            recordingIndicator: document.getElementById('recordingIndicator'),
            participantLabel: document.getElementById('participantLabel')
        };
    }

    setupEvents() {
        // Controls
        this.dom.micBtn.addEventListener('click', () => this.toggleMic());
        this.dom.cameraBtn.addEventListener('click', () => this.toggleCamera());
        this.dom.screenShareBtn?.addEventListener('click', () => this.toggleScreenShare());
        this.dom.reactionsBtn?.addEventListener('click', () => this.showReactions());
        this.dom.chatBtn.addEventListener('click', () => this.toggleChat());
        this.dom.pollBtn.addEventListener('click', () => this.showPollCreator());
        this.dom.whiteboardBtn.addEventListener('click', () => this.toggleWhiteboard());
        this.dom.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.dom.endCallBtn.addEventListener('click', () => this.endCall());
        this.dom.backBtn.addEventListener('click', () => this.endCall());

        // Settings
        const settingsBtn = document.getElementById('settingsBtn');
        settingsBtn?.addEventListener('click', () => this.toggleSettings());
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        closeSettingsBtn?.addEventListener('click', () => this.toggleSettings());

        // Language switcher
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.lang-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                applyTranslations(btn.dataset.lang);
            });
        });

        // Transcript
        this.dom.togglePanelBtn.addEventListener('click', () => this.toggleTranscriptPanel());
        this.dom.bookmarkBtn.addEventListener('click', () => this.addBookmark());
        this.dom.exportBtn.addEventListener('click', () => this.exportTranscript());

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => this.filterTranscript(tab.dataset.filter));
        });

        // AI Modal
        this.dom.closeAiModalBtn?.addEventListener('click', () => this.hideAIModal());
        this.dom.aiModalBackdrop?.addEventListener('click', (e) => {
            if (e.target === this.dom.aiModalBackdrop) {
                this.hideAIModal();
                this.hidePollCreator();
            }
        });

        // Chat
        this.dom.closeChatBtn?.addEventListener('click', () => this.toggleChat());
        this.dom.sendChatBtn?.addEventListener('click', () => this.sendChatMessage());
        this.dom.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Poll
        this.dom.closePollBtn?.addEventListener('click', () => this.hidePollCreator());
        this.dom.createPollBtn?.addEventListener('click', () => this.createPoll());
        document.getElementById('addPollOption')?.addEventListener('click', () => this.addPollOption());
        document.getElementById('cancelPollBtn')?.addEventListener('click', () => this.hidePollCreator());

        // Whiteboard
        this.dom.closeWhiteboardBtn.addEventListener('click', () => this.toggleWhiteboard());
        this.setupWhiteboard();

        // Notetaker
        document.getElementById('startNotetakerBtn')?.addEventListener('click', () => this.startNotetaker());
        document.getElementById('pauseNotetakerBtn')?.addEventListener('click', () => this.pauseNotetaker());
        document.getElementById('stopNotetakerBtn')?.addEventListener('click', () => this.stopNotetaker());
    }

    async init100ms() {
        try {
            console.log('[VIDEO] Initializing...');

            // Check if 100ms SDK is loaded
            if (typeof HMSReactiveStore === 'undefined') {
                console.warn('[VIDEO] 100ms SDK not loaded, using fallback WebRTC');
                await this.initFallbackWebRTC();
                return;
            }

            // Get credentials from URL or use demo
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room') || await this.createRoom();
            const userName = urlParams.get('name') || 'Host (Oleh)';

            // Get auth token from backend
            const token = await this.getAuthToken(roomId, userName, 'host');

            // Initialize HMS
            this.hmsManager = new HMSReactiveStore();
            this.hmsManager.triggerOnSubscribe();

            this.hmsActions = this.hmsManager.getActions();
            this.hmsStore = this.hmsManager.getStore();

            // Subscribe to updates
            this.subscribeToStore();

            // Join room
            await this.hmsActions.join({
                userName,
                authToken: token,
                settings: {
                    isAudioMuted: false,
                    isVideoMuted: false
                }
            });

            console.log('[100MS] ✅ Joined room:', roomId);

            // Enable transcription
            await this.enableTranscription();

        } catch (error) {
            console.error('[VIDEO] ❌ Failed:', error);
            console.warn('[VIDEO] Falling back to WebRTC');
            await this.initFallbackWebRTC();
        }
    }

    async initFallbackWebRTC() {
        console.log('[WEBRTC] Starting fallback mode...');

        try {
            // Get local media
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Display local video
            this.dom.localVideo.srcObject = this.localStream;
            await this.dom.localVideo.play();

            console.log('[WEBRTC] ✅ Local media started');
            console.log('[WEBRTC] Audio tracks:', this.localStream.getAudioTracks().length);
            console.log('[WEBRTC] Video tracks:', this.localStream.getVideoTracks().length);

            // Show placeholder for remote
            this.dom.remotePlaceholder.style.display = 'flex';

            // Mark buttons as active
            this.dom.micBtn.dataset.active = 'true';
            this.dom.cameraBtn.dataset.active = 'true';

        } catch (error) {
            console.error('[WEBRTC] ❌ Failed:', error);
            alert('Could not access camera/microphone: ' + error.message);
        }
    }

    async createRoom() {
        try {
            const response = await fetch('/api/professional/create-room', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    name: `1-on-1 Call ${Date.now()}`,
                    description: 'Professional 1-on-1 call with AI'
                })
            });

            const data = await response.json();
            return data.id;
        } catch (error) {
            console.error('[ROOM] Failed to create:', error);
            return 'demo-room';
        }
    }

    async getAuthToken(roomId, userName, role) {
        try {
            const response = await fetch('/api/professional/create-token', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    room_id: roomId,
                    user_id: `user_${Date.now()}`,
                    role: role,
                    user_name: userName
                })
            });

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('[TOKEN] Failed:', error);
            throw error;
        }
    }

    subscribeToStore() {
        // Local peer
        this.hmsStore.subscribe((peer) => {
            if (peer) {
                this.localPeer = peer;
                this.updateLocalVideo();
            }
        }, selectLocalPeer);

        // Remote peers
        this.hmsStore.subscribe((peers) => {
            const remotePeers = peers.filter(p => p.id !== this.localPeer?.id);
            if (remotePeers.length > 0) {
                this.remotePeer = remotePeers[0];
                this.updateRemoteVideo();
                this.dom.participantLabel.innerHTML = `<span class="participant-name">${this.remotePeer.name}</span>`;
            }
        }, selectPeers);

        // Transcription
        this.hmsStore.subscribe((transcriptions) => {
            this.handleTranscription(transcriptions);
        }, selectTranscriptionsState);

        // Chat
        this.hmsStore.subscribe((messages) => {
            this.handleChatMessages(messages);
        }, selectHMSMessages);
    }

    updateLocalVideo() {
        if (this.localPeer?.videoTrack) {
            this.hmsActions.attachVideo(this.localPeer.videoTrack, this.dom.localVideo);
        }
    }

    updateRemoteVideo() {
        if (this.remotePeer) {
            this.dom.remotePlaceholder.style.display = 'none';

            if (this.remotePeer.videoTrack) {
                this.hmsActions.attachVideo(this.remotePeer.videoTrack, this.dom.remoteVideo);
            }

            // Show speaking indicator
            if (this.remotePeer.audioLevel > 0.1) {
                document.getElementById('remoteSpeaking').style.display = 'block';
            } else {
                document.getElementById('remoteSpeaking').style.display = 'none';
            }
        }
    }

    async enableTranscription() {
        try {
            await this.hmsActions.startTranscription({
                mode: 'live',
                outputModes: ['caption']
            });
            console.log('[TRANSCRIPTION] ✅ Enabled');
        } catch (error) {
            console.error('[TRANSCRIPTION] ❌ Failed:', error);
        }
    }

    async handleTranscription(transcriptions) {
        if (!transcriptions || transcriptions.length === 0) return;

        transcriptions.forEach(async item => {
            if (!item.isFinal) return;

            const entry = {
                id: Date.now() + Math.random(),
                speaker: item.peerId === this.localPeer.id ? 'me' : 'guest',
                speakerName: item.peerId === this.localPeer.id ? 'You' : (this.remotePeer?.name || 'Guest'),
                text: item.transcript,
                timestamp: new Date(),
                category: null,
                urgency: null
            };

            this.transcriptEntries.push(entry);
            this.addTranscriptToUI(entry);

            // Analyze with GPT-4o
            await this.analyzeWithAI(entry);
        });
    }

    addTranscriptToUI(entry) {
        // Remove empty state
        const emptyState = this.dom.transcriptList.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const entryEl = document.createElement('div');
        entryEl.className = 'transcript-entry';
        entryEl.dataset.entryId = entry.id;
        entryEl.dataset.speaker = entry.speaker;

        const time = entry.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const initial = entry.speakerName.charAt(0).toUpperCase();
        const avatarClass = entry.speaker === 'me' ? 'speaker-avatar-me' : 'speaker-avatar-guest';

        entryEl.innerHTML = `
            <div class="transcript-header">
                <div class="speaker-avatar ${avatarClass}">${initial}</div>
                <div class="speaker-name">${entry.speakerName}</div>
                <div class="timestamp">${time}</div>
            </div>
            <div class="transcript-text">${entry.text}</div>
            <div class="ai-indicator" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Analyzing...
            </div>
        `;

        this.dom.transcriptList.appendChild(entryEl);
        this.dom.transcriptList.scrollTop = this.dom.transcriptList.scrollHeight;
    }

    async analyzeWithAI(entry) {
        try {
            // Show analyzing indicator
            const entryEl = document.querySelector(`[data-entry-id="${entry.id}"]`);
            const aiIndicator = entryEl?.querySelector('.ai-indicator');
            if (aiIndicator) aiIndicator.style.display = 'flex';

            // Call backend with GPT-4o
            const response = await fetch('/api/analyze-transcript', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    speaker: entry.speakerName,
                    text: entry.text,
                    timestamp: entry.timestamp,
                    meetingId: 'current-meeting'
                })
            });

            if (!response.ok) {
                throw new Error('AI analysis failed');
            }

            const analysis = await response.json();

            // Update entry with AI analysis
            entry.category = analysis.category;
            entry.urgency = analysis.urgency;
            entry.recommendation = analysis.recommendation;
            entry.suggestedResponses = analysis.suggested_responses;

            // Update UI
            if (entryEl) {
                if (analysis.category && analysis.category !== 'general') {
                    entryEl.classList.add('ai-detected');

                    if (analysis.urgency === 'high') {
                        entryEl.classList.add('ai-urgent');
                    }

                    // Make clickable
                    entryEl.style.cursor = 'pointer';
                    entryEl.addEventListener('click', () => this.showAIRecommendation(entry));

                    // Update indicator
                    if (aiIndicator) {
                        aiIndicator.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            ${analysis.category} detected - Click for advice
                        `;
                        aiIndicator.style.color = analysis.color || 'var(--accent-green)';
                    }
                } else {
                    // Hide indicator for general
                    if (aiIndicator) aiIndicator.style.display = 'none';
                }
            }

            console.log('[AI] ✅ Analysis:', analysis);

        } catch (error) {
            console.error('[AI] ❌ Failed:', error);
            const entryEl = document.querySelector(`[data-entry-id="${entry.id}"]`);
            const aiIndicator = entryEl?.querySelector('.ai-indicator');
            if (aiIndicator) aiIndicator.style.display = 'none';
        }
    }

    showAIRecommendation(entry) {
        if (!entry.recommendation) return;

        const categoryEmoji = {
            'objection': '🚨',
            'pricing': '💰',
            'agreement': '✅',
            'question': '❓'
        };

        const emoji = categoryEmoji[entry.category] || '🤖';

        this.dom.aiModalBody.innerHTML = `
            <div class="category-badge ${entry.category}">
                ${emoji} ${entry.category.toUpperCase()} DETECTED
            </div>

            <div class="recommendation-text">
                ${entry.recommendation}
            </div>

            ${entry.suggestedResponses && entry.suggestedResponses.length > 0 ? `
                <div class="quick-responses">
                    <h4>💡 Suggested Responses:</h4>
                    ${entry.suggestedResponses.map(response => `
                        <div class="response-item" onclick="app.sendQuickResponse('${response.replace(/'/g, "\\'")}')">
                            <p>${response}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="modal-actions">
                <button class="btn-secondary" onclick="app.hideAIModal()">Close</button>
                <button class="btn-primary" onclick="app.copyRecommendation('${entry.recommendation.replace(/'/g, "\\'")}')">
                    📋 Copy
                </button>
            </div>
        `;

        this.dom.aiModalBackdrop.style.display = 'block';
        this.dom.aiRecommendationModal.style.display = 'block';
    }

    hideAIModal() {
        this.dom.aiRecommendationModal.style.display = 'none';
        // Only hide backdrop if poll modal is also closed
        if (this.dom.pollModal.style.display === 'none') {
            this.dom.aiModalBackdrop.style.display = 'none';
        }
    }

    async sendQuickResponse(text) {
        await this.hmsActions.sendBroadcastMessage(text);
        this.hideAIModal();
    }

    copyRecommendation(text) {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    }

    async toggleMic() {
        try {
            if (this.hmsActions && this.localPeer) {
                const newState = !this.localPeer.audioEnabled;
                await this.hmsActions.setLocalAudioEnabled(newState);
                this.updateButtonState(this.dom.micBtn, newState);
                console.log('[MIC] HMS:', newState ? 'ON' : 'OFF');
            } else if (this.localStream) {
                // Fallback WebRTC mode
                const audioTracks = this.localStream.getAudioTracks();
                if (audioTracks.length > 0) {
                    const newState = !audioTracks[0].enabled;
                    audioTracks[0].enabled = newState;
                    this.updateButtonState(this.dom.micBtn, newState);
                    console.log('[MIC] WebRTC:', newState ? 'ON' : 'OFF');
                } else {
                    console.error('[MIC] No audio tracks available');
                }
            } else {
                console.error('[MIC] No stream available');
            }
        } catch (error) {
            console.error('[MIC] Error:', error);
            alert('Microphone error: ' + error.message);
        }
    }

    async toggleCamera() {
        try {
            if (this.hmsActions && this.localPeer) {
                const newState = !this.localPeer.videoEnabled;
                await this.hmsActions.setLocalVideoEnabled(newState);
                this.updateButtonState(this.dom.cameraBtn, newState);
                console.log('[CAMERA] HMS:', newState ? 'ON' : 'OFF');
            } else if (this.localStream) {
                // Fallback WebRTC mode
                const videoTracks = this.localStream.getVideoTracks();
                if (videoTracks.length > 0) {
                    const newState = !videoTracks[0].enabled;
                    videoTracks[0].enabled = newState;
                    this.updateButtonState(this.dom.cameraBtn, newState);
                    console.log('[CAMERA] WebRTC:', newState ? 'ON' : 'OFF');
                } else {
                    console.error('[CAMERA] No video tracks available');
                }
            } else {
                console.error('[CAMERA] No stream available');
            }
        } catch (error) {
            console.error('[CAMERA] Error:', error);
            alert('Camera error: ' + error.message);
        }
    }

    updateButtonState(button, isActive) {
        button.dataset.active = isActive ? 'true' : 'false';
        const iconOn = button.querySelector('.icon-on');
        const iconOff = button.querySelector('.icon-off');
        if (iconOn && iconOff) {
            iconOn.style.display = isActive ? 'block' : 'none';
            iconOff.style.display = isActive ? 'none' : 'block';
        }
    }

    async toggleScreenShare() {
        try {
            if (this.hmsActions && this.localPeer) {
                const isSharing = this.localPeer?.auxiliaryTracks?.some(t => t.source === 'screen');
                await this.hmsActions.setScreenShareEnabled(!isSharing);
            } else {
                // Fallback WebRTC mode
                if (!this.screenStream) {
                    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                        video: true,
                        audio: false
                    });
                    console.log('[SCREEN SHARE] Started');
                    alert('Screen sharing started (demo mode)');

                    this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                        this.screenStream = null;
                        console.log('[SCREEN SHARE] Stopped');
                    });
                } else {
                    this.screenStream.getTracks().forEach(track => track.stop());
                    this.screenStream = null;
                    console.log('[SCREEN SHARE] Stopped');
                }
            }
        } catch (error) {
            console.error('[SCREEN SHARE] Error:', error);
        }
    }

    toggleChat() {
        const panel = this.dom.chatPanel;
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'flex';
            // Reset unread badge
            const badge = document.getElementById('chatBadge');
            badge.textContent = '0';
            badge.style.display = 'none';
        } else {
            panel.style.display = 'none';
        }
    }

    async sendChatMessage() {
        const message = this.dom.chatInput.value.trim();
        if (!message) return;

        await this.hmsActions.sendBroadcastMessage(message);
        this.dom.chatInput.value = '';
    }

    handleChatMessages(messages) {
        if (!messages || messages.length === 0) return;

        this.dom.chatMessages.innerHTML = '';

        messages.forEach(msg => {
            const isMe = msg.sender === this.localPeer?.name;
            const msgDiv = document.createElement('div');
            msgDiv.className = `chat-message ${isMe ? 'me' : 'other'}`;

            const time = new Date(msg.time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            msgDiv.innerHTML = `
                <div class="message-header">
                    <span class="sender-name">${isMe ? 'You' : msg.sender}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.escapeHtml(msg.message)}</div>
            `;

            this.dom.chatMessages.appendChild(msgDiv);
        });

        // Scroll to bottom
        this.dom.chatMessages.scrollTop = this.dom.chatMessages.scrollHeight;

        // Update badge
        if (!this.dom.chatPanel.classList.contains('open')) {
            const badge = document.getElementById('chatBadge');
            const unreadCount = parseInt(badge.textContent || '0') + 1;
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showPollCreator() {
        this.dom.pollModal.style.display = 'flex';
        this.dom.aiModalBackdrop.style.display = 'block';
    }

    hidePollCreator() {
        this.dom.pollModal.style.display = 'none';
        // Only hide backdrop if AI modal is also closed
        if (this.dom.aiRecommendationModal.style.display === 'none') {
            this.dom.aiModalBackdrop.style.display = 'none';
        }
    }

    addPollOption() {
        const optionsContainer = document.getElementById('pollOptions');
        const optionCount = optionsContainer.querySelectorAll('input').length + 1;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'poll-input';
        input.placeholder = `Option ${optionCount}`;

        optionsContainer.appendChild(input);
    }

    async createPoll() {
        const question = document.getElementById('pollQuestion').value;
        const options = Array.from(document.querySelectorAll('.poll-options input'))
            .map(input => input.value)
            .filter(v => v.trim());

        if (!question || options.length < 2) {
            alert('Please enter a question and at least 2 options');
            return;
        }

        try {
            // Use 100ms polls API if available
            if (this.hmsActions?.interactivityCenter) {
                await this.hmsActions.interactivityCenter.startPoll({
                    question,
                    options: options.map(text => ({text})),
                    type: 'single-choice'
                });
            } else {
                console.log('[POLL] Created (fallback mode):', {question, options});
                // In fallback mode, just log the poll
            }

            this.hidePollCreator();
            alert('Poll created!');

            // Clear inputs
            document.getElementById('pollQuestion').value = '';
            document.querySelectorAll('.poll-options input').forEach(input => input.value = '');
        } catch (error) {
            console.error('[POLL] Error:', error);
            alert('Failed to create poll: ' + error.message);
        }
    }

    toggleWhiteboard() {
        const container = this.dom.whiteboardContainer;

        if (container.style.display === 'none' || !container.style.display) {
            container.style.display = 'block';
            this.resizeWhiteboardCanvas();
        } else {
            container.style.display = 'none';
        }
    }

    toggleSettings() {
        const panel = document.getElementById('settingsPanel');
        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'flex';
        } else {
            panel.style.display = 'none';
        }
    }

    setupWhiteboard() {
        const canvas = this.dom.whiteboardCanvas;
        this.whiteboardCtx = canvas.getContext('2d');

        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.tool) {
                    this.currentTool = btn.dataset.tool;
                    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });

        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });

        document.getElementById('clearWbBtn').addEventListener('click', () => {
            this.whiteboardCtx.clearRect(0, 0, canvas.width, canvas.height);
        });

        // Drawing
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mousemove', (e) => this.draw(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseout', () => this.stopDrawing());
    }

    resizeWhiteboardCanvas() {
        const canvas = this.dom.whiteboardCanvas;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 80;
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.whiteboardCtx.beginPath();
        this.whiteboardCtx.moveTo(e.offsetX, e.offsetY);
    }

    draw(e) {
        if (!this.isDrawing) return;

        this.whiteboardCtx.lineWidth = this.currentTool === 'eraser' ? 20 : 2;
        this.whiteboardCtx.lineCap = 'round';
        this.whiteboardCtx.strokeStyle = this.currentTool === 'eraser' ? '#000' : this.currentColor;

        this.whiteboardCtx.lineTo(e.offsetX, e.offsetY);
        this.whiteboardCtx.stroke();
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    async toggleRecording() {
        try {
            const isRecording = this.dom.recordingIndicator.style.display === 'flex';

            if (this.hmsActions) {
                if (!isRecording) {
                    // Start recording with 100ms
                    console.log('[RECORDING] Starting 100ms recording...');

                    const recordingConfig = {
                        meetingURL: window.location.href,
                        rtmpURLs: [],
                        record: true
                    };

                    await this.hmsActions.startRTMPOrRecording(recordingConfig);
                    this.dom.recordingIndicator.style.display = 'flex';
                    this.dom.recordBtn.classList.add('recording');
                    console.log('[RECORDING] ✅ Started successfully');
                } else {
                    // Stop recording
                    console.log('[RECORDING] Stopping recording...');
                    await this.hmsActions.stopRTMPAndRecording();
                    this.dom.recordingIndicator.style.display = 'none';
                    this.dom.recordBtn.classList.remove('recording');
                    console.log('[RECORDING] ✅ Stopped successfully');
                }
            } else {
                // Fallback mode with MediaRecorder API
                if (!isRecording) {
                    if (this.localStream) {
                        this.mediaRecorder = new MediaRecorder(this.localStream, {
                            mimeType: 'video/webm;codecs=vp8,opus'
                        });

                        this.recordedChunks = [];

                        this.mediaRecorder.ondataavailable = (event) => {
                            if (event.data.size > 0) {
                                this.recordedChunks.push(event.data);
                            }
                        };

                        this.mediaRecorder.onstop = () => {
                            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `recording-${Date.now()}.webm`;
                            a.click();
                            console.log('[RECORDING] ✅ Saved locally');
                        };

                        this.mediaRecorder.start(1000);
                        this.dom.recordingIndicator.style.display = 'flex';
                        this.dom.recordBtn.classList.add('recording');
                        console.log('[RECORDING] ✅ Started (local recording)');
                    } else {
                        alert('No media stream available for recording');
                    }
                } else {
                    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                        this.mediaRecorder.stop();
                        this.dom.recordingIndicator.style.display = 'none';
                        this.dom.recordBtn.classList.remove('recording');
                        console.log('[RECORDING] ✅ Stopped (local recording)');
                    }
                }
            }
        } catch (error) {
            console.error('[RECORDING] ❌ Error:', error);
            alert('Recording error: ' + error.message);
        }
    }

    showReactions() {
        const reactions = ['👍', '👏', '❤️', '😂', '😮', '🎉', '👋', '🔥'];
        const reactionHTML = reactions.map(emoji =>
            `<button class="reaction-emoji" onclick="app.sendReaction('${emoji}')">${emoji}</button>`
        ).join('');

        if (!this.reactionsPanel) {
            const panel = document.createElement('div');
            panel.className = 'reactions-panel glassmorphic';
            panel.innerHTML = `
                <div class="panel-header">
                    <span>Quick Reactions</span>
                    <button class="close-btn" onclick="app.hideReactions()">✕</button>
                </div>
                <div class="reactions-grid">${reactionHTML}</div>
            `;
            document.body.appendChild(panel);
            this.reactionsPanel = panel;
        }

        this.reactionsPanel.style.display = 'flex';
    }

    hideReactions() {
        if (this.reactionsPanel) {
            this.reactionsPanel.style.display = 'none';
        }
    }

    sendReaction(emoji) {
        console.log('[REACTION] Sent:', emoji);

        // Show floating reaction animation
        const reactionEl = document.createElement('div');
        reactionEl.className = 'floating-reaction';
        reactionEl.textContent = emoji;
        reactionEl.style.left = Math.random() * 80 + 10 + '%';
        document.querySelector('.call-container').appendChild(reactionEl);

        setTimeout(() => reactionEl.remove(), 3000);

        // Send via 100ms if available
        if (this.hmsActions?.sendBroadcastMessage) {
            this.hmsActions.sendBroadcastMessage(`REACTION:${emoji}`);
        }

        this.hideReactions();
    }

    toggleTranscriptPanel() {
        this.dom.transcriptPanel.classList.toggle('hidden');
    }

    addBookmark() {
        const bookmark = {
            id: Date.now(),
            timestamp: new Date(),
            timeInCall: this.getCallDuration(),
            note: prompt('Add a note:') || 'Important moment'
        };

        this.bookmarks.push(bookmark);
        alert(`Bookmark added at ${bookmark.timeInCall}`);
    }

    async exportTranscript() {
        const data = {
            meeting: 'Professional 1-on-1',
            duration: this.getCallDuration(),
            entries: this.transcriptEntries,
            bookmarks: this.bookmarks
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${Date.now()}.json`;
        a.click();
    }

    filterTranscript(filter) {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');

        document.querySelectorAll('.transcript-entry').forEach(entry => {
            if (filter === 'both') {
                entry.style.display = '';
            } else {
                entry.style.display = entry.dataset.speaker === filter ? '' : 'none';
            }
        });
    }

    startCallTimer() {
        this.callStartTime = new Date();

        this.timerInterval = setInterval(() => {
            this.dom.callTimer.textContent = this.getCallDuration();
        }, 1000);
    }

    getCallDuration() {
        if (!this.callStartTime) return '00:00';

        const diff = Date.now() - this.callStartTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    async endCall() {
        if (!confirm('End the call?')) return;

        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.notetakerInterval) clearInterval(this.notetakerInterval);

        if (this.hmsActions) {
            await this.hmsActions.leave();
        }

        window.location.href = '/static/landing.html';
    }

    // Notetaker Methods
    async startNotetaker() {
        console.log('[NOTETAKER] Starting...');

        const statusEl = document.getElementById('notetakerStatus');
        const timerEl = document.getElementById('notetakerTimer');
        const startBtn = document.getElementById('startNotetakerBtn');
        const pauseBtn = document.getElementById('pauseNotetakerBtn');
        const stopBtn = document.getElementById('stopNotetakerBtn');

        statusEl.textContent = 'Recording';
        statusEl.classList.add('recording');
        timerEl.style.display = 'block';

        startBtn.style.display = 'none';
        pauseBtn.style.display = 'flex';
        stopBtn.style.display = 'flex';

        this.notetakerStartTime = Date.now();
        this.notetakerPaused = false;

        this.notetakerInterval = setInterval(() => {
            if (!this.notetakerPaused) {
                const elapsed = Date.now() - this.notetakerStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);

        // Start recording with 100ms API
        try {
            if (this.hmsActions?.startRTMPOrRecording) {
                const recordingConfig = {
                    meetingURL: window.location.href,
                    rtmpURLs: [],
                    record: true
                };
                await this.hmsActions.startRTMPOrRecording(recordingConfig);
                console.log('[NOTETAKER] ✅ 100ms recording started');
            } else if (this.localStream) {
                // Fallback to MediaRecorder
                this.notetakerRecorder = new MediaRecorder(this.localStream, {
                    mimeType: 'video/webm;codecs=vp8,opus'
                });
                this.notetakerChunks = [];

                this.notetakerRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.notetakerChunks.push(event.data);
                    }
                };

                this.notetakerRecorder.start(1000);
                console.log('[NOTETAKER] ✅ Local recording started');
            }
        } catch (error) {
            console.warn('[NOTETAKER] Recording failed:', error);
        }
    }

    pauseNotetaker() {
        console.log('[NOTETAKER] Pausing...');

        const statusEl = document.getElementById('notetakerStatus');
        const pauseBtn = document.getElementById('pauseNotetakerBtn');

        if (!this.notetakerPaused) {
            this.notetakerPaused = true;
            this.notetakerPausedAt = Date.now();
            statusEl.textContent = 'Paused';
            statusEl.classList.remove('recording');
            statusEl.classList.add('paused');
            pauseBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <span data-i18n="resume">Resume</span>
            `;

            // Pause local recording if available
            if (this.notetakerRecorder?.state === 'recording') {
                this.notetakerRecorder.pause();
                console.log('[NOTETAKER] ⏸ Paused');
            }
        } else {
            this.notetakerPaused = false;
            const pauseDuration = Date.now() - this.notetakerPausedAt;
            this.notetakerStartTime += pauseDuration;
            statusEl.textContent = 'Recording';
            statusEl.classList.remove('paused');
            statusEl.classList.add('recording');
            pauseBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                <span data-i18n="pause">Pause</span>
            `;

            // Resume local recording if available
            if (this.notetakerRecorder?.state === 'paused') {
                this.notetakerRecorder.resume();
                console.log('[NOTETAKER] ▶️ Resumed');
            }
        }
    }

    async stopNotetaker() {
        console.log('[NOTETAKER] Stopping...');

        if (this.notetakerInterval) {
            clearInterval(this.notetakerInterval);
            this.notetakerInterval = null;
        }

        const statusEl = document.getElementById('notetakerStatus');
        const timerEl = document.getElementById('notetakerTimer');
        const startBtn = document.getElementById('startNotetakerBtn');
        const pauseBtn = document.getElementById('pauseNotetakerBtn');
        const stopBtn = document.getElementById('stopNotetakerBtn');

        statusEl.textContent = 'Ready';
        statusEl.classList.remove('recording', 'paused');
        timerEl.style.display = 'none';
        timerEl.textContent = '00:00';

        startBtn.style.display = 'flex';
        pauseBtn.style.display = 'none';
        stopBtn.style.display = 'none';

        this.notetakerPaused = false;
        this.notetakerStartTime = null;

        // Stop recording
        try {
            if (this.hmsActions?.stopRTMPAndRecording) {
                await this.hmsActions.stopRTMPAndRecording();
                console.log('[NOTETAKER] ✅ 100ms recording stopped');
            } else if (this.notetakerRecorder?.state === 'recording' || this.notetakerRecorder?.state === 'paused') {
                this.notetakerRecorder.onstop = () => {
                    const blob = new Blob(this.notetakerChunks, { type: 'video/webm' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `notetaker-${Date.now()}.webm`;
                    a.click();
                    console.log('[NOTETAKER] ✅ Recording saved');
                };
                this.notetakerRecorder.stop();
            }
        } catch (error) {
            console.warn('[NOTETAKER] Stop recording failed:', error);
        }

        alert('Notetaker stopped. Recording saved.');
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new Professional1on1Call();
    window.app = app; // For inline onclick handlers
});
