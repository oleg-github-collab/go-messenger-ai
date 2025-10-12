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
        this.dom.chatBtn.addEventListener('click', () => this.toggleChat());
        this.dom.pollBtn.addEventListener('click', () => this.showPollCreator());
        this.dom.whiteboardBtn.addEventListener('click', () => this.toggleWhiteboard());
        this.dom.recordBtn.addEventListener('click', () => this.toggleRecording());
        this.dom.endCallBtn.addEventListener('click', () => this.endCall());
        this.dom.backBtn.addEventListener('click', () => this.endCall());

        // Transcript
        this.dom.togglePanelBtn.addEventListener('click', () => this.toggleTranscriptPanel());
        this.dom.bookmarkBtn.addEventListener('click', () => this.addBookmark());
        this.dom.exportBtn.addEventListener('click', () => this.exportTranscript());

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => this.filterTranscript(tab.dataset.filter));
        });

        // AI Modal
        this.dom.closeAiModalBtn.addEventListener('click', () => this.hideAIModal());
        this.dom.aiModalBackdrop.addEventListener('click', () => this.hideAIModal());

        // Chat
        this.dom.closeChatBtn.addEventListener('click', () => this.toggleChat());
        this.dom.sendChatBtn.addEventListener('click', () => this.sendChatMessage());
        this.dom.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Poll
        this.dom.closePollBtn.addEventListener('click', () => this.hidePollCreator());
        this.dom.createPollBtn.addEventListener('click', () => this.createPoll());

        // Whiteboard
        this.dom.closeWhiteboardBtn.addEventListener('click', () => this.toggleWhiteboard());
        this.setupWhiteboard();
    }

    async init100ms() {
        try {
            console.log('[100MS] Initializing SDK...');

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
            console.error('[100MS] ❌ Failed:', error);
            alert('Failed to join call: ' + error.message);
        }
    }

    async createRoom() {
        try {
            const response = await fetch('/api/professional/create-room', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
        this.dom.aiModalBackdrop.style.display = 'none';
        this.dom.aiRecommendationModal.style.display = 'none';
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
        const isEnabled = await this.hmsActions.setLocalAudioEnabled(!this.localPeer.audioEnabled);
        this.dom.micBtn.dataset.active = isEnabled ? 'true' : 'false';
    }

    async toggleCamera() {
        const isEnabled = await this.hmsActions.setLocalVideoEnabled(!this.localPeer.videoEnabled);
        this.dom.cameraBtn.dataset.active = isEnabled ? 'true' : 'false';
    }

    async toggleScreenShare() {
        try {
            const isSharing = this.localPeer?.auxiliaryTracks?.some(t => t.source === 'screen');
            await this.hmsActions.setScreenShareEnabled(!isSharing);
        } catch (error) {
            console.error('[SCREEN SHARE] Error:', error);
        }
    }

    toggleChat() {
        this.dom.chatPanel.classList.toggle('open');
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
        this.dom.pollModal.style.display = 'block';
        this.dom.aiModalBackdrop.style.display = 'block';
    }

    hidePollCreator() {
        this.dom.pollModal.style.display = 'none';
        this.dom.aiModalBackdrop.style.display = 'none';
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
            // Use 100ms polls API
            await this.hmsActions.interactivityCenter.startPoll({
                question,
                options: options.map(text => ({text})),
                type: 'single-choice'
            });

            this.hidePollCreator();
            alert('Poll created!');
        } catch (error) {
            console.error('[POLL] Error:', error);
            alert('Failed to create poll');
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
            if (this.dom.recordingIndicator.style.display === 'none') {
                await this.hmsActions.startRTMPOrRecording({record: true});
                this.dom.recordingIndicator.style.display = 'flex';
            } else {
                await this.hmsActions.stopRTMPAndRecording();
                this.dom.recordingIndicator.style.display = 'none';
            }
        } catch (error) {
            console.error('[RECORDING] Error:', error);
        }
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

        if (this.hmsActions) {
            await this.hmsActions.leave();
        }

        window.location.href = '/static/landing.html';
    }
}

// Initialize
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new Professional1on1Call();
    window.app = app; // For inline onclick handlers
});
