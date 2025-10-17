/**
 * Professional Mode - 100ms Integration
 * Complete group video conferencing with AI transcription
 */

class ProfessionalModeApp {
    constructor() {
        this.hmsManager = null;
        this.room = null;
        this.localPeer = null;
        this.remotePeers = new Map();

        // Transcription
        this.transcriptEntries = [];
        this.bookmarks = [];

        // Chat
        this.chatMessages = [];

        // State
        this.isTranscriptionEnabled = false;
        this.isRecording = false;
        this.meetingStartTime = null;
        this.meetingTimer = null;

        // DOM Elements
        this.elements = {};

        this.init();
    }

    async init() {
        console.log('[PROFESSIONAL] Initializing...');

        // Cache DOM elements
        this.cacheElements();

        // Setup event listeners
        this.setupEventListeners();

        // Initialize 100ms
        await this.initialize100ms();

        // Hide loading, show main container
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('professionalContainer').style.display = 'flex';
        }, 2000);
    }

    cacheElements() {
        this.elements = {
            // Navigation
            backBtn: document.getElementById('backBtn'),
            layoutBtn: document.getElementById('layoutBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            meetingTitle: document.getElementById('meetingTitle'),
            meetingTimer: document.getElementById('meetingTimer'),
            participantsCount: document.getElementById('participantNumber'),
            recordingIndicator: document.getElementById('recordingIndicator'),

            // Video
            videoGrid: document.getElementById('videoGrid'),
            screenshareContainer: document.getElementById('screenshareContainer'),
            reactionsOverlay: document.getElementById('reactionsOverlay'),

            // Side Panel
            sidePanel: document.getElementById('sidePanel'),
            transcriptList: document.getElementById('transcriptList'),
            chatMessages: document.getElementById('chatMessages'),
            participantsList: document.getElementById('participantsList'),
            chatInput: document.getElementById('chatInput'),
            sendChatBtn: document.getElementById('sendChatBtn'),

            // Controls
            micBtn: document.getElementById('micBtn'),
            cameraBtn: document.getElementById('cameraBtn'),
            screenShareBtn: document.getElementById('screenShareBtn'),
            reactionsBtn: document.getElementById('reactionsBtn'),
            raiseHandBtn: document.getElementById('raiseHandBtn'),
            pollBtn: document.getElementById('pollBtn'),
            whiteboardBtn: document.getElementById('whiteboardBtn'),
            recordBtn: document.getElementById('recordBtn'),
            leaveBtn: document.getElementById('leaveBtn'),

            // Reactions Picker
            reactionsPicker: document.getElementById('reactionsPicker'),
            closeReactionsBtn: document.getElementById('closeReactionsBtn'),

            // Transcript Controls
            speakerFilter: document.getElementById('speakerFilter'),
            bookmarkBtn: document.getElementById('bookmarkBtn'),
            exportTranscriptBtn: document.getElementById('exportTranscriptBtn')
        };
    }

    setupEventListeners() {
        // Navigation
        this.elements.backBtn?.addEventListener('click', () => this.leave());
        this.elements.layoutBtn?.addEventListener('click', () => this.changeLayout());
        this.elements.settingsBtn?.addEventListener('click', () => this.openSettings());

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });

        // Controls
        this.elements.micBtn?.addEventListener('click', () => this.toggleMic());
        this.elements.cameraBtn?.addEventListener('click', () => this.toggleCamera());
        this.elements.screenShareBtn?.addEventListener('click', () => this.toggleScreenShare());
        this.elements.reactionsBtn?.addEventListener('click', () => this.showReactionsPicker());
        this.elements.raiseHandBtn?.addEventListener('click', () => this.toggleRaiseHand());
        this.elements.pollBtn?.addEventListener('click', () => this.createPoll());
        this.elements.whiteboardBtn?.addEventListener('click', () => this.openWhiteboard());
        this.elements.recordBtn?.addEventListener('click', () => this.toggleRecording());
        this.elements.leaveBtn?.addEventListener('click', () => this.leave());

        // Chat
        this.elements.sendChatBtn?.addEventListener('click', () => this.sendChatMessage());
        this.elements.chatInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Transcript
        this.elements.bookmarkBtn?.addEventListener('click', () => this.addBookmark());
        this.elements.exportTranscriptBtn?.addEventListener('click', () => this.exportTranscript());
        this.elements.speakerFilter?.addEventListener('change', (e) => this.filterTranscript(e.target.value));

        // Reactions
        this.elements.closeReactionsBtn?.addEventListener('click', () => this.hideReactionsPicker());
        document.querySelectorAll('.reaction-item').forEach(item => {
            item.addEventListener('click', () => this.sendReaction(item.dataset.reaction));
        });
    }

    async initialize100ms() {
        try {
            console.log('[100MS] Initializing SDK...');

            // Get room details from URL params
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('room') || 'demo-room';
            const userName = urlParams.get('name') || 'Guest';
            const authToken = urlParams.get('token');

            if (!authToken) {
                throw new Error('No auth token provided');
            }

            // Initialize HMS
            this.hmsManager = new HMSReactiveStore();
            this.hmsManager.triggerOnSubscribe();

            const hmsActions = this.hmsManager.getActions();
            const hmsStore = this.hmsManager.getStore();

            // Subscribe to store updates
            this.subscribeToStore(hmsStore);

            // Join room
            console.log('[100MS] Joining room...', { roomId, userName });

            await hmsActions.join({
                userName,
                authToken,
                settings: {
                    isAudioMuted: false,
                    isVideoMuted: false
                },
                rememberDeviceSelection: true
            });

            console.log('[100MS] ✅ Joined successfully');

            this.hmsActions = hmsActions;
            this.hmsStore = hmsStore;

            // Start meeting timer
            this.startMeetingTimer();

            // Enable transcription
            await this.enableTranscription();

        } catch (error) {
            console.error('[100MS] ❌ Failed to initialize:', error);
            alert('Failed to join meeting: ' + error.message);
        }
    }

    subscribeToStore(store) {
        // Local peer updates
        store.subscribe((peer) => {
            if (peer) {
                console.log('[100MS] Local peer updated:', peer);
                this.localPeer = peer;
                this.updateLocalVideo();
            }
        }, selectLocalPeer);

        // Remote peers updates
        store.subscribe((peers) => {
            console.log('[100MS] Peers updated:', peers);
            this.updateRemotePeers(peers);
            this.updateParticipantsList(peers);
            this.updateParticipantsCount();
        }, selectPeers);

        // Messages (Chat)
        store.subscribe((messages) => {
            console.log('[100MS] Messages:', messages);
            this.handleChatMessages(messages);
        }, selectHMSMessages);

        // Transcription updates
        store.subscribe((transcriptions) => {
            console.log('[100MS] Transcriptions:', transcriptions);
            this.handleTranscription(transcriptions);
        }, selectTranscriptionsState);

        // Recording status
        store.subscribe((recording) => {
            console.log('[100MS] Recording status:', recording);
            this.updateRecordingStatus(recording);
        }, selectRecordingState);

        // Screen share
        store.subscribe((presentation) => {
            console.log('[100MS] Screen share:', presentation);
            this.handleScreenShare(presentation);
        }, selectIsPeerScreenSharing);
    }

    updateLocalVideo() {
        if (!this.localPeer) return;

        const existingTile = document.querySelector('[data-peer-id="local"]');
        if (existingTile) {
            this.updateVideoTile(existingTile, this.localPeer);
        } else {
            const tile = this.createVideoTile(this.localPeer, true);
            this.elements.videoGrid.appendChild(tile);
        }
    }

    updateRemotePeers(peers) {
        const remotePeers = peers.filter(p => p.id !== this.localPeer?.id);

        // Remove tiles for peers that left
        document.querySelectorAll('.video-tile:not([data-peer-id="local"])').forEach(tile => {
            const peerId = tile.dataset.peerId;
            if (!remotePeers.find(p => p.id === peerId)) {
                tile.remove();
            }
        });

        // Add/update tiles for current peers
        remotePeers.forEach(peer => {
            const existingTile = document.querySelector(`[data-peer-id="${peer.id}"]`);
            if (existingTile) {
                this.updateVideoTile(existingTile, peer);
            } else {
                const tile = this.createVideoTile(peer, false);
                this.elements.videoGrid.appendChild(tile);
            }
        });
    }

    createVideoTile(peer, isLocal) {
        const tile = document.createElement('div');
        tile.className = 'video-tile';
        tile.dataset.peerId = isLocal ? 'local' : peer.id;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = isLocal;
        video.id = `video-${peer.id}`;

        // Attach track
        if (peer.videoTrack) {
            this.hmsActions.attachVideo(peer.videoTrack, video);
        }

        const overlay = document.createElement('div');
        overlay.className = 'video-tile-overlay';
        overlay.innerHTML = `
            <div class="participant-name">${peer.name}</div>
            <div class="participant-status">
                ${!peer.audioEnabled ? '<span class="status-icon">🔇</span>' : ''}
                ${!peer.videoEnabled ? '<span class="status-icon">📹</span>' : ''}
            </div>
        `;

        tile.appendChild(video);
        tile.appendChild(overlay);

        return tile;
    }

    updateVideoTile(tile, peer) {
        const video = tile.querySelector('video');
        const overlay = tile.querySelector('.video-tile-overlay');

        // Update video track
        if (peer.videoTrack) {
            this.hmsActions.attachVideo(peer.videoTrack, video);
        }

        // Update speaking indicator
        if (peer.audioLevel > 0.1) {
            tile.classList.add('speaking');
        } else {
            tile.classList.remove('speaking');
        }

        // Update status icons
        overlay.innerHTML = `
            <div class="participant-name">${peer.name}</div>
            <div class="participant-status">
                ${!peer.audioEnabled ? '<span class="status-icon">🔇</span>' : ''}
                ${!peer.videoEnabled ? '<span class="status-icon">📹</span>' : ''}
                ${peer.isHandRaised ? '<span class="status-icon">✋</span>' : ''}
            </div>
        `;
    }

    updateParticipantsList(peers) {
        if (!this.elements.participantsList) return;

        this.elements.participantsList.innerHTML = '';

        peers.forEach(peer => {
            const item = document.createElement('div');
            item.className = 'participant-item';

            const initial = peer.name.charAt(0).toUpperCase();
            const isHost = peer.roleName === 'host';

            item.innerHTML = `
                <div class="participant-avatar">${initial}</div>
                <div class="participant-info">
                    <div class="participant-name-text">${peer.name}</div>
                    <div class="participant-role">${isHost ? 'Host' : 'Participant'}</div>
                </div>
                <div class="participant-actions">
                    ${!peer.audioEnabled ? '<span class="status-icon">🔇</span>' : ''}
                    ${peer.isHandRaised ? '<span class="status-icon">✋</span>' : ''}
                </div>
            `;

            this.elements.participantsList.appendChild(item);
        });
    }

    updateParticipantsCount() {
        const count = document.querySelectorAll('.video-tile').length;
        if (this.elements.participantsCount) {
            this.elements.participantsCount.textContent = count;
        }
    }

    async enableTranscription() {
        try {
            console.log('[TRANSCRIPTION] Enabling...');

            // Check if transcription is available
            const canTranscribe = this.hmsStore.getState(selectIsTranscriptionEnabled);

            if (!canTranscribe) {
                console.warn('[TRANSCRIPTION] Not available in this room');
                return;
            }

            // Start transcription
            await this.hmsActions.startTranscription({
                mode: 'live', // or 'recorded'
                outputModes: ['caption'], // Live captions
            });

            this.isTranscriptionEnabled = true;
            console.log('[TRANSCRIPTION] ✅ Enabled');

        } catch (error) {
            console.error('[TRANSCRIPTION] ❌ Failed:', error);
        }
    }

    handleTranscription(transcriptions) {
        if (!transcriptions || transcriptions.length === 0) return;

        transcriptions.forEach(item => {
            // Add to transcript entries
            const entry = {
                id: Date.now() + Math.random(),
                speaker: item.peerId,
                speakerName: this.getPeerName(item.peerId),
                text: item.transcript,
                timestamp: new Date(),
                isFinal: item.isFinal
            };

            if (item.isFinal) {
                this.transcriptEntries.push(entry);
                this.addTranscriptToUI(entry);

                // Send to AI analyzer
                this.analyzeWithAI(entry);
            }
        });

        // Update transcript badge
        this.updateTranscriptBadge();
    }

    addTranscriptToUI(entry) {
        if (!this.elements.transcriptList) return;

        // Remove empty state
        const emptyState = this.elements.transcriptList.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        const item = document.createElement('div');
        item.className = 'transcript-item';
        item.dataset.entryId = entry.id;

        const time = entry.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const initial = entry.speakerName.charAt(0).toUpperCase();

        item.innerHTML = `
            <div class="transcript-speaker">
                <div class="speaker-avatar">${initial}</div>
                <div class="speaker-name">${entry.speakerName}</div>
                <div class="transcript-time">${time}</div>
            </div>
            <div class="transcript-text">${entry.text}</div>
        `;

        this.elements.transcriptList.appendChild(item);

        // Auto-scroll
        this.elements.transcriptList.scrollTop = this.elements.transcriptList.scrollHeight;
    }

    async analyzeWithAI(entry) {
        try {
            const response = await fetch('/api/analyze-transcript', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    speaker: entry.speakerName,
                    text: entry.text,
                    timestamp: entry.timestamp,
                    meetingId: this.getMeetingId()
                })
            });

            if (response.ok) {
                const analysis = await response.json();

                // Highlight if important
                if (analysis.category) {
                    const item = document.querySelector(`[data-entry-id="${entry.id}"]`);
                    if (item) {
                        item.classList.add('highlighted');
                        item.style.borderColor = analysis.color;
                    }
                }
            }
        } catch (error) {
            console.error('[AI] Analysis failed:', error);
        }
    }

    getPeerName(peerId) {
        const peers = this.hmsStore.getState(selectPeers);
        const peer = peers.find(p => p.id === peerId);
        return peer?.name || 'Unknown';
    }

    getMeetingId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('room') || 'demo-room';
    }

    async toggleMic() {
        const isEnabled = await this.hmsActions.setLocalAudioEnabled(!this.localPeer.audioEnabled);
        this.elements.micBtn.dataset.active = isEnabled ? 'true' : 'false';
    }

    async toggleCamera() {
        const isEnabled = await this.hmsActions.setLocalVideoEnabled(!this.localPeer.videoEnabled);
        this.elements.cameraBtn.dataset.active = isEnabled ? 'true' : 'false';
    }

    async toggleScreenShare() {
        try {
            const isSharing = this.localPeer?.auxiliaryTracks?.some(t => t.source === 'screen');

            if (isSharing) {
                await this.hmsActions.setScreenShareEnabled(false);
            } else {
                await this.hmsActions.setScreenShareEnabled(true);
            }
        } catch (error) {
            console.error('[SCREEN SHARE] Error:', error);
            alert('Screen sharing failed: ' + error.message);
        }
    }

    handleScreenShare(presentation) {
        if (presentation) {
            // Someone is sharing screen
            this.elements.screenshareContainer.style.display = 'flex';

            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;

            // Attach screen share track
            const track = presentation.videoTrack;
            if (track) {
                this.hmsActions.attachVideo(track, video);
            }

            this.elements.screenshareContainer.querySelector('.screenshare-video').innerHTML = '';
            this.elements.screenshareContainer.querySelector('.screenshare-video').appendChild(video);

            document.getElementById('screenshareOwner').textContent = `${presentation.name} is sharing`;
        } else {
            this.elements.screenshareContainer.style.display = 'none';
        }
    }

    async toggleRaiseHand() {
        try {
            const isRaised = this.localPeer.isHandRaised;
            await this.hmsActions.setHandRaiseState(!isRaised);

            // Update button state
            if (!isRaised) {
                this.elements.raiseHandBtn.style.background = 'var(--gradient-warning)';
            } else {
                this.elements.raiseHandBtn.style.background = '';
            }
        } catch (error) {
            console.error('[HAND RAISE] Error:', error);
        }
    }

    async sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;

        try {
            await this.hmsActions.sendBroadcastMessage(message);
            this.elements.chatInput.value = '';
        } catch (error) {
            console.error('[CHAT] Failed to send:', error);
        }
    }

    handleChatMessages(messages) {
        if (!messages || messages.length === 0) return;

        // Remove empty state
        const emptyState = this.elements.chatMessages.querySelector('.empty-state');
        if (emptyState) emptyState.remove();

        // Add new messages
        messages.forEach(msg => {
            if (this.chatMessages.find(m => m.id === msg.id)) return;

            this.chatMessages.push(msg);
            this.addChatMessageToUI(msg);
        });

        // Update badge
        this.updateChatBadge();
    }

    addChatMessageToUI(msg) {
        const isOwn = msg.senderUserId === this.localPeer.id;

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isOwn ? 'own' : ''}`;

        const time = new Date(msg.time).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
            ${!isOwn ? `<div class="message-sender">${msg.senderName}</div>` : ''}
            <div class="message-bubble">
                <div class="message-text">${msg.message}</div>
                <div class="message-time">${time}</div>
            </div>
        `;

        this.elements.chatMessages.appendChild(messageEl);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    showReactionsPicker() {
        this.elements.reactionsPicker.style.display = 'block';
        setTimeout(() => {
            this.elements.reactionsPicker.style.opacity = '1';
            this.elements.reactionsPicker.style.transform = 'translateX(-50%) translateY(0)';
        }, 10);
    }

    hideReactionsPicker() {
        this.elements.reactionsPicker.style.opacity = '0';
        this.elements.reactionsPicker.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => {
            this.elements.reactionsPicker.style.display = 'none';
        }, 300);
    }

    async sendReaction(emoji) {
        try {
            // Send as broadcast message with special prefix
            await this.hmsActions.sendBroadcastMessage(`REACTION:${emoji}`);

            // Show floating reaction locally
            this.showFloatingReaction(emoji);

            // Hide picker
            this.hideReactionsPicker();
        } catch (error) {
            console.error('[REACTION] Failed to send:', error);
        }
    }

    showFloatingReaction(emoji) {
        const reaction = document.createElement('div');
        reaction.className = 'floating-reaction';
        reaction.textContent = emoji;
        reaction.style.left = `${Math.random() * 80 + 10}%`;

        this.elements.reactionsOverlay.appendChild(reaction);

        setTimeout(() => {
            reaction.remove();
        }, 3000);
    }

    async toggleRecording() {
        try {
            if (this.isRecording) {
                await this.hmsActions.stopRTMPAndRecording();
                this.elements.recordBtn.style.background = '';
            } else {
                await this.hmsActions.startRTMPOrRecording({
                    meetingURL: window.location.href,
                    rtmpURLs: [], // Add RTMP URLs if needed
                    record: true
                });
                this.elements.recordBtn.style.background = 'var(--gradient-danger)';
            }
            this.isRecording = !this.isRecording;
        } catch (error) {
            console.error('[RECORDING] Error:', error);
            alert('Recording failed: ' + error.message);
        }
    }

    updateRecordingStatus(recording) {
        if (recording && recording.browser?.running) {
            this.elements.recordingIndicator.style.display = 'flex';
            this.isRecording = true;
        } else {
            this.elements.recordingIndicator.style.display = 'none';
            this.isRecording = false;
        }
    }

    addBookmark() {
        const bookmark = {
            id: Date.now(),
            timestamp: new Date(),
            timeInMeeting: this.getMeetingDuration(),
            note: prompt('Add a note for this bookmark:') || 'Important moment'
        };

        this.bookmarks.push(bookmark);
        alert('Bookmark added at ' + bookmark.timeInMeeting);
    }

    async exportTranscript() {
        try {
            const transcript = {
                meeting: this.getMeetingId(),
                startTime: this.meetingStartTime,
                duration: this.getMeetingDuration(),
                entries: this.transcriptEntries,
                bookmarks: this.bookmarks
            };

            const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transcript-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[EXPORT] Failed:', error);
        }
    }

    filterTranscript(speakerId) {
        const items = this.elements.transcriptList.querySelectorAll('.transcript-item');

        items.forEach(item => {
            if (speakerId === 'all') {
                item.style.display = '';
            } else {
                const entryId = item.dataset.entryId;
                const entry = this.transcriptEntries.find(e => e.id == entryId);

                if (entry && entry.speaker === speakerId) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            }
        });
    }

    switchTab(tabName) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    startMeetingTimer() {
        this.meetingStartTime = new Date();

        this.meetingTimer = setInterval(() => {
            const duration = this.getMeetingDuration();
            if (this.elements.meetingTimer) {
                this.elements.meetingTimer.textContent = duration;
            }
        }, 1000);
    }

    getMeetingDuration() {
        if (!this.meetingStartTime) return '00:00';

        const diff = Date.now() - this.meetingStartTime.getTime();
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateTranscriptBadge() {
        const badge = document.getElementById('transcriptBadge');
        if (badge) {
            badge.textContent = this.transcriptEntries.length;
            badge.style.display = this.transcriptEntries.length > 0 ? 'block' : 'none';
        }
    }

    updateChatBadge() {
        const badge = document.getElementById('chatBadge');
        if (badge) {
            badge.textContent = this.chatMessages.length;
            badge.style.display = this.chatMessages.length > 0 ? 'block' : 'none';
        }
    }

    async leave() {
        if (confirm('Are you sure you want to leave the meeting?')) {
            if (this.meetingTimer) clearInterval(this.meetingTimer);

            if (this.hmsActions) {
                await this.hmsActions.leave();
            }

            window.location.href = '/static/landing.html';
        }
    }

    createPoll() {
        alert('Poll feature coming soon!');
    }

    openWhiteboard() {
        alert('Whiteboard feature coming soon!');
    }

    changeLayout() {
        alert('Layout switcher coming soon!');
    }

    openSettings() {
        alert('Settings coming soon!');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ProfessionalModeApp();
});
