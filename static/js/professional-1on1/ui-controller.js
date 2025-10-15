/**
 * UI Controller for Professional AI Mode
 * Connects custom glassmorphic UI with 100ms SDK
 */

class ProfessionalUIController {
    constructor() {
        this.sdk = null;
        this.isHost = false;
        this.roomCode = null;

        // UI Elements
        this.previewScreen = document.getElementById('previewScreen');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.callContainer = document.getElementById('callContainer');
        this.previewVideoEl = document.getElementById('previewVideo');
        this.previewPlaceholder = document.getElementById('previewPlaceholder');
        this.previewMicBtn = document.getElementById('previewMicBtn');
        this.previewCameraBtn = document.getElementById('previewCameraBtn');
        this.joinCallBtn = document.getElementById('joinCallBtn');

        // Live call elements
        this.localVideoEl = document.getElementById('localVideo');
        this.localVideoPip = document.getElementById('localVideoPip');
        this.remoteVideoEl = document.getElementById('remoteVideo');
        this.remoteVideoContainer = document.getElementById('remoteVideoContainer');
        this.remotePlaceholderEl = document.getElementById('remotePlaceholder');
        this.remoteSpeakingEl = document.getElementById('remoteSpeaking');
        this.localSpeakingEl = document.getElementById('localSpeaking');
        this.remoteAudioEl = null;
        this.shareLinkContainer = document.getElementById('shareLinkContainer');
        this.shareGuestItem = document.getElementById('shareGuestItem');
        this.shareHostItem = document.getElementById('shareHostItem');
        this.shareGuestInput = document.getElementById('shareGuestLink');
        this.shareHostInput = document.getElementById('shareHostLink');
        this.copyGuestBtn = document.getElementById('copyGuestLinkBtn');
        this.copyHostBtn = document.getElementById('copyHostLinkBtn');
        this.shareLinkStatus = document.getElementById('shareLinkStatus');

        // Control buttons
        this.micBtn = document.getElementById('micBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        this.speakerBtn = document.getElementById('speakerBtn');
        this.raiseHandBtn = document.getElementById('raiseHandBtn');

        // Chat
        this.chatPanel = document.querySelector('.chat-panel');
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.getElementById('chatInput');

        // AI Panel (host only)
        this.aiPanel = document.querySelector('.ai-panel');

        // Preview state
        this.previewStream = null;
        this.previewAudioEnabled = true;
        this.previewVideoEnabled = true;
        this.previewControlsBound = false;
        this.isJoining = false;
        this.pendingShareLink = null;
        this.storeSubscriptions = [];
        this.remotePeerId = null;
        this.localPeerId = null;
        this.renderedMessageIds = new Set();
        this.pendingInviteCode = null;
        this.shareStatusTimeout = null;
        this.shareBaseStatus = '';
        this.isShowingCopyStatus = false;
        this.controlsBound = false;

        window.__PRO_UI__ = this;

        [this.micBtn, this.cameraBtn, this.speakerBtn, this.raiseHandBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
            }
        });

        console.log('[UI Controller] Initialized');
    }

    /**
     * Initialize as HOST
     */
    async initializeAsHost(inviteCode = null) {
        console.log('[UI Controller] Initializing as HOST');
        this.isHost = true;
        this.pendingInviteCode = inviteCode;

        try {
            const loadingMessage = inviteCode ? 'Loading professional room...' : 'Creating professional room...';
            this.showLoading(loadingMessage);
            this.updateStep(1);

            // Create SDK instance
            this.sdk = new ProfessionalMeetingSDK();
            window.__PRO_SDK__ = this.sdk;

            // Initialize as host
            const result = await this.sdk.initAsHost('Oleh', inviteCode ? { inviteCode } : {});
            this.roomCode = this.sdk.roomCode || result.roomId;
            this.pendingShareLink = {
                guest: this.sdk.getShareLink(),
                host: this.sdk.getHostLink(),
                maxParticipants: this.sdk.maxParticipants,
                participantCount: this.sdk.participantCount
            };

            await this.setupPreviewStage();
            console.log('[UI Controller] ✅ Host preview ready');

        } catch (error) {
            console.error('[UI Controller] ❌ Host initialization failed:', error);
            alert('Failed to create room: ' + error.message);
            window.location.href = '/home';
        }
    }

    /**
     * Initialize as GUEST
     */
    async initializeAsGuest(roomCode, userName) {
        console.log('[UI Controller] Initializing as GUEST');
        this.isHost = false;
        this.roomCode = roomCode;
        this.pendingShareLink = null;

        try {
            this.showLoading('Joining meeting...');
            this.updateStep(1);

            // Create SDK instance
            this.sdk = new ProfessionalMeetingSDK();
            window.__PRO_SDK__ = this.sdk;

            // Initialize as guest
            await this.sdk.initAsGuest(roomCode, userName);

            await this.setupPreviewStage();
            console.log('[UI Controller] ✅ Guest preview ready');

        } catch (error) {
            console.error('[UI Controller] ❌ Guest initialization failed:', error);
            alert('Failed to join room: ' + error.message);
            window.location.href = '/';
        }
    }

    /**
     * Prepare pre-join preview UI and media
     */
    async setupPreviewStage() {
        this.bindPreviewControls();

        if (this.previewScreen) {
            this.previewScreen.style.display = 'flex';
        }
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
        if (this.callContainer) {
            this.callContainer.style.display = 'none';
        }

        if (!this.isHost && this.shareLinkContainer) {
            this.shareLinkContainer.style.display = 'none';
        }

        if (this.joinCallBtn) {
            this.joinCallBtn.disabled = true;
            this.joinCallBtn.textContent = 'Preparing...';
        }

        await this.startPreviewStream();

        if (this.joinCallBtn) {
            this.joinCallBtn.disabled = false;
            this.joinCallBtn.textContent = 'Join Call';
            this.joinCallBtn.onclick = () => this.handleJoin();
        }

        if (this.isHost && this.pendingShareLink) {
            this.showShareLink(this.pendingShareLink);
        }
    }

    /**
     * Bind preview controls (mic/camera toggles)
     */
    bindPreviewControls() {
        if (this.previewControlsBound) {
            return;
        }

        if (this.previewMicBtn) {
            this.previewMicBtn.addEventListener('click', () => this.togglePreviewAudio());
        }

        if (this.previewCameraBtn) {
            this.previewCameraBtn.addEventListener('click', () => this.togglePreviewVideo());
        }

        this.previewControlsBound = true;
    }

    /**
     * Start local media preview
     */
    async startPreviewStream() {
        this.previewAudioEnabled = true;
        this.previewVideoEnabled = true;

        const baseConstraints = {
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
        };

        const applyPreviewState = (hasVideo, hasAudio) => {
            this.previewVideoEnabled = hasVideo;
            this.previewAudioEnabled = hasAudio;

            if (this.previewCameraBtn) {
                this.previewCameraBtn.dataset.active = hasVideo ? 'true' : 'false';
            }
            if (this.previewMicBtn) {
                this.previewMicBtn.dataset.active = hasAudio ? 'true' : 'false';
            }

            if (this.previewVideoEl) {
                if (hasVideo) {
                    this.previewVideoEl.style.display = 'block';
                } else {
                    this.previewVideoEl.style.display = 'none';
                }
            }
            if (this.previewPlaceholder) {
                this.previewPlaceholder.style.display = hasVideo ? 'none' : 'flex';
            }
        };

        try {
            this.previewStream = await navigator.mediaDevices.getUserMedia(baseConstraints);
        } catch (error) {
            console.warn('[UI Controller] ⚠️ Preview (audio+video) failed, retrying with video only:', error);
            try {
                this.previewStream = await navigator.mediaDevices.getUserMedia({
                    video: baseConstraints.video,
                    audio: false
                });
                applyPreviewState(true, false);
            } catch (videoError) {
                console.error('[UI Controller] ❌ Failed to start camera preview:', videoError);
                this.previewStream = null;
                applyPreviewState(false, false);
                if (this.previewPlaceholder) {
                    this.previewPlaceholder.style.display = 'flex';
                    const placeholderText = this.previewPlaceholder.querySelector('p');
                    if (placeholderText) {
                        placeholderText.textContent = 'Camera unavailable';
                    }
                }
                if (this.joinCallBtn) {
                    this.joinCallBtn.textContent = 'Join without camera';
                }
                return;
            }
        }

        if (this.previewStream) {
            const hasVideo = this.previewStream.getVideoTracks().length > 0;
            const hasAudio = this.previewStream.getAudioTracks().length > 0;
            applyPreviewState(hasVideo, hasAudio);

            if (this.previewVideoEl && hasVideo) {
                this.previewVideoEl.srcObject = this.previewStream;
                await this.previewVideoEl.play().catch(() => {});
            }
        }
    }

    /**
     * Stop preview media stream
     */
    stopPreviewStream() {
        if (this.previewStream) {
            this.previewStream.getTracks().forEach(track => track.stop());
            this.previewStream = null;
        }
        if (this.previewVideoEl) {
            this.previewVideoEl.srcObject = null;
        }
    }

    /**
     * Toggle preview audio state
     */
    togglePreviewAudio() {
        if (!this.previewStream || this.previewStream.getAudioTracks().length === 0) {
            console.warn('[UI Controller] No audio track available for preview');
            this.previewAudioEnabled = false;
            if (this.previewMicBtn) {
                this.previewMicBtn.dataset.active = 'false';
            }
            return;
        }

        this.previewAudioEnabled = !this.previewAudioEnabled;

        this.previewStream.getAudioTracks().forEach(track => {
            track.enabled = this.previewAudioEnabled;
        });

        if (this.previewMicBtn) {
            this.previewMicBtn.dataset.active = this.previewAudioEnabled ? 'true' : 'false';
        }
    }

    /**
     * Toggle preview video state
     */
    togglePreviewVideo() {
        if (!this.previewStream || this.previewStream.getVideoTracks().length === 0) {
            console.warn('[UI Controller] No video track available for preview');
            this.previewVideoEnabled = false;
            if (this.previewCameraBtn) {
                this.previewCameraBtn.dataset.active = 'false';
            }
            return;
        }

        this.previewVideoEnabled = !this.previewVideoEnabled;

        this.previewStream.getVideoTracks().forEach(track => {
            track.enabled = this.previewVideoEnabled;
        });

        if (this.previewCameraBtn) {
            this.previewCameraBtn.dataset.active = this.previewVideoEnabled ? 'true' : 'false';
        }

        if (this.previewVideoEl) {
            this.previewVideoEl.style.display = this.previewVideoEnabled ? 'block' : 'none';
        }
        if (this.previewPlaceholder) {
            this.previewPlaceholder.style.display = this.previewVideoEnabled ? 'none' : 'flex';
        }
    }

    /**
     * Handle joining the call after preview
     */
    async handleJoin() {
        if (this.isJoining) {
            return;
        }
        this.isJoining = true;

        this.clearStoreSubscriptions();

        if (this.joinCallBtn) {
            this.joinCallBtn.disabled = true;
            this.joinCallBtn.textContent = 'Joining...';
        }

        const joinPreferences = {
            audioEnabled: this.previewAudioEnabled,
            videoEnabled: this.previewVideoEnabled
        };

        try {
            this.showLoading('Setting up video...');
            this.updateStep(2);

            this.stopPreviewStream();

            await this.sdk.joinRoom(joinPreferences);

            this.updateStep(3);
            this.showLoading('Activating AI features...');

            await this.setupVideoUI();
            this.setupEventListeners();
            this.subscribeToRoomUpdates();
            if (this.renderedMessageIds) {
                this.renderedMessageIds.clear();
            }
            this.enableCallControls();

            if (!this.isHost && this.aiPanel) {
                this.aiPanel.style.display = 'none';
            }

            if (this.isHost && this.pendingShareLink) {
                this.showShareLink(this.pendingShareLink);
            }

            if (this.micBtn) {
                this.micBtn.classList.toggle('active', joinPreferences.audioEnabled);
            }
            if (this.cameraBtn) {
                this.cameraBtn.classList.toggle('active', joinPreferences.videoEnabled);
            }

            this.hideLoading();
            this.showCallUI();

            console.log('[UI Controller] ✅ Joined call successfully');
        } catch (error) {
            console.error('[UI Controller] ❌ Failed to join after preview:', error);
            alert('Failed to join room: ' + error.message);
            window.location.href = this.isHost ? '/home' : '/';
        } finally {
            this.isJoining = false;
            if (this.joinCallBtn) {
                this.joinCallBtn.disabled = false;
                this.joinCallBtn.textContent = 'Join Call';
            }
        }
    }

    /**
     * Setup video UI - render peer tracks
     */
    async setupVideoUI() {
        console.log('[UI Controller] Setting up video UI');

        if (!this.localVideoEl || !this.remoteVideoEl) {
            console.error('[UI Controller] Video elements not found');
            return;
        }

        if (this.remoteVideoEl) {
            this.remoteVideoEl.style.display = 'none';
            this.remoteVideoEl.srcObject = null;
        }

        if (!this.remoteAudioEl) {
            this.remoteAudioEl = document.createElement('audio');
            this.remoteAudioEl.id = 'remoteAudio';
            this.remoteAudioEl.autoplay = true;
            this.remoteAudioEl.playsInline = true;
            this.remoteAudioEl.style.display = 'none';

            if (this.remoteVideoContainer) {
                this.remoteVideoContainer.appendChild(this.remoteAudioEl);
            } else {
                document.body.appendChild(this.remoteAudioEl);
            }
        }

        if (this.remotePlaceholderEl) {
            this.remotePlaceholderEl.style.display = 'flex';
        }
    }

    /**
     * Handle track updates - render video/audio
     */
    onTrackUpdate(peers) {
        const peerValues = Object.values(peers || {});
        this.logDebug('Track update', peerValues.length);

        const localPeer = peerValues.find(peer => peer.isLocal);
        const remotePeer = peerValues.find(peer => !peer.isLocal);

        const getTrackByID = (trackId) => {
            if (!trackId || !this.sdk?.hmsStore || typeof this.sdk.hmsStore.getState !== 'function') {
                return null;
            }
            try {
                return this.sdk.hmsStore.getState(state => {
                    if (!state) return null;
                    if (state.tracks && state.tracks[trackId]) return state.tracks[trackId];
                    if (state.videoTracks && state.videoTracks[trackId]) return state.videoTracks[trackId];
                    if (state.audioTracks && state.audioTracks[trackId]) return state.audioTracks[trackId];
                    return null;
                });
            } catch (error) {
                this.logWarn('Failed to resolve track by ID', trackId, error);
                return null;
            }
        };

        if (localPeer) {
            this.localPeerId = localPeer.id;
            const localVideoTrack = getTrackByID(localPeer.videoTrack);
            const localAudioTrack = getTrackByID(localPeer.audioTrack);
            if (localVideoTrack && this.localVideoEl && typeof this.sdk?.hmsActions?.attachVideo === 'function') {
                this.sdk.hmsActions.attachVideo(localVideoTrack, this.localVideoEl);
            }

            if (this.localSpeakingEl) {
                const show = Boolean(localPeer.isSpeaking) || Boolean(localAudioTrack && localAudioTrack.enabled && !localAudioTrack.muted);
                this.localSpeakingEl.style.display = show ? 'block' : 'none';
            }
        }

        if (remotePeer) {
            this.remotePeerId = remotePeer.id;
            const remoteVideoTrack = getTrackByID(remotePeer.videoTrack);
            const remoteAudioTrack = getTrackByID(remotePeer.audioTrack);
            if (remoteVideoTrack && this.remoteVideoEl && typeof this.sdk?.hmsActions?.attachVideo === 'function') {
                this.sdk.hmsActions.attachVideo(remoteVideoTrack, this.remoteVideoEl);
                this.remoteVideoEl.style.display = 'block';
            } else if (this.remoteVideoEl && this.remoteVideoEl.srcObject) {
                this.remoteVideoEl.srcObject = null;
            }

            if (remoteAudioTrack && this.remoteAudioEl && typeof this.sdk?.hmsActions?.attachAudio === 'function') {
                this.sdk.hmsActions.attachAudio(remoteAudioTrack, this.remoteAudioEl);
            } else if (this.remoteAudioEl && this.remoteAudioEl.srcObject) {
                this.remoteAudioEl.srcObject = null;
            }

            if (this.remotePlaceholderEl) {
                this.remotePlaceholderEl.style.display = remoteVideoTrack ? 'none' : 'flex';
            }

            if (this.remoteSpeakingEl) {
                const showRemote = Boolean(remotePeer.isSpeaking) || Boolean(remoteAudioTrack && remoteAudioTrack.enabled && !remoteAudioTrack.muted);
                this.remoteSpeakingEl.style.display = showRemote ? 'block' : 'none';
            }
        } else {
            if (this.remotePlaceholderEl) {
                this.remotePlaceholderEl.style.display = 'flex';
            }
            if (this.remoteVideoEl) {
                this.remoteVideoEl.style.display = 'none';
                this.remoteVideoEl.srcObject = null;
            }
            if (this.remoteAudioEl) {
                this.remoteAudioEl.srcObject = null;
            }
            this.remotePeerId = null;
        }
    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        if (this.controlsBound) {
            this.logDebug('Controls already initialized, skipping rebinding');
            return;
        }

        // Mic toggle
        if (this.micBtn) {
            this.micBtn.addEventListener('click', async () => {
                if (!this.sdk) {
                    this.logWarn('Mic toggle ignored - SDK not initialized');
                    return;
                }
                try {
                    const enabled = await this.sdk.toggleAudio();
                    this.micBtn.classList.toggle('active', enabled);
                    this.logDebug('Mic state', enabled);
                } catch (error) {
                    this.logError('Mic toggle failed', error);
                }
            });
        }

        // Camera toggle
        if (this.cameraBtn) {
            this.cameraBtn.addEventListener('click', async () => {
                if (!this.sdk) {
                    this.logWarn('Camera toggle ignored - SDK not initialized');
                    return;
                }
                try {
                    const enabled = await this.sdk.toggleVideo();
                    this.cameraBtn.classList.toggle('active', enabled);
                    this.logDebug('Camera state', enabled);
                } catch (error) {
                    this.logError('Camera toggle failed', error);
                }
            });
        }

        // Chat send
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && this.chatInput.value.trim()) {
                    if (!this.sdk) {
                        this.logWarn('Chat send ignored - SDK not initialized');
                        return;
                    }
                    try {
                        await this.sdk.sendMessage(this.chatInput.value.trim());
                        this.chatInput.value = '';
                        this.logDebug('Chat message sent');
                    } catch (error) {
                        this.logError('Chat send failed', error);
                    }
                }
            });
        }

        // Leave call
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.leaveCall());
        }

        this.controlsBound = true;
        this.logDebug('Event listeners attached');
    }

    clearStoreSubscriptions() {
        if (!this.storeSubscriptions) {
            return;
        }

        this.storeSubscriptions.forEach(unsub => {
            try {
                if (typeof unsub === 'function') {
                    unsub();
                }
            } catch (error) {
                console.warn('[UI Controller] Failed to remove subscription', error);
            }
        });

        this.storeSubscriptions = [];
    }

    /**
     * Subscribe to room updates (peers, messages, etc)
     */
    subscribeToRoomUpdates() {
        const storeAPI = this.sdk?.hmsReactiveStore;
        const hmsStore = typeof storeAPI?.getStore === 'function'
            ? storeAPI.getStore()
            : this.sdk?.hmsStore;

        if (!hmsStore || typeof hmsStore.subscribe !== 'function') {
            this.logError('HMS store not available for subscriptions', new Error('subscribe missing'));
            return;
        }

        this.sdk.hmsStore = hmsStore;

        this.clearStoreSubscriptions();

        const selectPeers = (state) => state?.peers || {};
        const selectMessages = (state) => state?.messages || [];

        this.storeSubscriptions.push(
            hmsStore.subscribe(this.onTrackUpdate.bind(this), selectPeers)
        );

        this.storeSubscriptions.push(
            hmsStore.subscribe(this.onPeersUpdate.bind(this), selectPeers)
        );

        this.storeSubscriptions.push(
            hmsStore.subscribe(this.onMessage.bind(this), selectMessages)
        );

        this.logDebug('Subscribed to HMS store updates');
    }

    /**
     * Handle chat messages
     */
    onMessage(messagesState) {
        const normalizeMessageList = (source) => {
            if (!source) return [];
            if (Array.isArray(source)) return source;
            if (Array.isArray(source.messages)) return source.messages;
            if (Array.isArray(source.broadcastMessages)) return source.broadcastMessages;
            if (Array.isArray(source.privateMessages)) return source.privateMessages;
            if (typeof source === 'object') {
                return Object.values(source).filter(item => item && typeof item === 'object' && 'message' in item);
            }
            return [];
        };

        const messages = normalizeMessageList(messagesState);
        if (messages.length === 0) return;

        messages.forEach(msg => {
            const sender = msg.senderName || msg.sender || 'Anonymous';
            const text = msg.message || msg.text || '';
            const timestamp = msg.time || msg.timestamp || Date.now();
            const messageKey = msg.id || `${timestamp}-${sender}-${text}`;

            if (!text || this.renderedMessageIds.has(messageKey)) {
                return;
            }

            this.renderedMessageIds.add(messageKey);
            this.addChatMessage(sender, text, timestamp);
        });
    }

    /**
     * Handle peer updates
     */
    onPeersUpdate(peers) {
        const peerMap = peers || {};
        const peerCount = Object.keys(peerMap).length;
        const participantLabel = document.querySelector('.participant-name');

        if (participantLabel) {
            if (peerCount <= 1) {
                participantLabel.textContent = 'Waiting for guest...';
            } else {
                const remotePeers = Object.values(peerMap).filter(p => !p.isLocal);
                if (remotePeers.length > 0) {
                    participantLabel.textContent = remotePeers[0].name;
                }
            }
        }

        if (this.isHost && this.shareLinkStatus) {
            const maxParticipants = this.sdk?.maxParticipants || 20;
            const slotsLeft = Math.max(0, maxParticipants - peerCount);
            const baseMessage = `Share with up to ${maxParticipants} participants. ${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left.`;
            this.shareBaseStatus = baseMessage;
            if (!this.isShowingCopyStatus) {
                this.updateShareStatus(baseMessage);
            }
        }
    }

    /**
     * Add chat message to UI
     */
    addChatMessage(sender, message, timestamp) {
        if (!this.chatMessages) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.innerHTML = `
            <div class="message-header">
                <strong>${sender}</strong>
                <span class="message-time">${new Date(timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="message-text">${message}</div>
        `;

        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    /**
     * Show share link modal
     */
    showShareLink(shareLink) {
        if (!this.isHost || !this.shareLinkContainer) {
            return;
        }

        const shareData = typeof shareLink === 'object' ? shareLink : { guest: shareLink };
        const guestLink = shareData.guest || this.sdk?.getShareLink() || '';
        const hostLink = shareData.host || this.sdk?.getHostLink() || '';
        const maxParticipants = shareData.maxParticipants || this.sdk?.maxParticipants || 20;
        const participantCount = shareData.participantCount ?? this.sdk?.participantCount ?? 1;
        const slotsLeft = Math.max(0, maxParticipants - participantCount);

        if (this.shareGuestInput) {
            this.shareGuestInput.value = guestLink;
        }

        if (this.shareHostInput) {
            this.shareHostInput.value = hostLink;
        }

        if (this.shareGuestItem) {
            this.shareGuestItem.style.display = guestLink ? 'block' : 'none';
        }

        if (this.shareHostItem) {
            this.shareHostItem.style.display = hostLink ? 'block' : 'none';
        }

        if (this.copyGuestBtn) {
            this.copyGuestBtn.onclick = () => this.copyInviteLink(guestLink, 'guest');
            this.copyGuestBtn.disabled = !guestLink;
        }

        if (this.copyHostBtn) {
            this.copyHostBtn.onclick = () => this.copyInviteLink(hostLink, 'host');
            this.copyHostBtn.disabled = !hostLink;
        }

        if (this.shareLinkContainer) {
            this.shareLinkContainer.style.display = guestLink ? 'block' : 'none';
        }

        const statusMessage = `Share with up to ${maxParticipants} participants. ${slotsLeft} slot${slotsLeft === 1 ? '' : 's'} left.`;
        this.shareBaseStatus = statusMessage;
        this.updateShareStatus(statusMessage);
        this.isShowingCopyStatus = false;

        this.logDebug('Share link ready', {
            guestLink,
            hostLink,
            maxParticipants,
            participantCount,
            slotsLeft
        });
    }

    updateShareStatus(message) {
        if (!this.shareLinkStatus) {
            return;
        }

        this.shareLinkStatus.textContent = message;
        this.shareLinkStatus.classList.add('visible');
    }

    showShareStatus(message) {
        if (!this.shareLinkStatus) {
            return;
        }

        this.updateShareStatus(message);
        this.isShowingCopyStatus = true;

        if (this.shareStatusTimeout) {
            clearTimeout(this.shareStatusTimeout);
        }

        if (this.shareBaseStatus) {
            this.shareStatusTimeout = setTimeout(() => {
                this.isShowingCopyStatus = false;
                this.updateShareStatus(this.shareBaseStatus);
            }, 2400);
        }
    }

    async copyInviteLink(link, type = 'guest') {
        if (!link) {
            return;
        }

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(link);
            } else {
                const targetInput = type === 'host' ? this.shareHostInput : this.shareGuestInput;
                if (targetInput) {
                    targetInput.focus();
                    targetInput.select();
                    document.execCommand('copy');
                    targetInput.setSelectionRange(0, 0);
                }
            }

            this.showShareStatus(type === 'host' ? 'Host link copied!' : 'Guest link copied!');
        } catch (error) {
            console.error('[UI Controller] Failed to copy link:', error);
            this.showShareStatus('Copy failed. Try manually selecting the link.');
        }
    }

    /**
     * Show loading screen
     */
    showLoading(message) {
        if (this.loadingScreen) {
            const subtitle = this.loadingScreen.querySelector('.loading-subtitle');
            if (subtitle) subtitle.textContent = message;

            this.loadingScreen.style.display = 'flex';
            this.previewScreen.style.display = 'none';
            this.callContainer.style.display = 'none';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    /**
     * Update loading step
     */
    updateStep(stepNumber) {
        for (let i = 1; i <= 3; i++) {
            const step = document.getElementById(`step${i}`);
            if (step) {
                step.classList.toggle('active', i <= stepNumber);
            }
        }
    }

    /**
     * Show call UI
     */
    showCallUI() {
        if (this.previewScreen) {
            this.previewScreen.style.display = 'none';
        }
        if (this.callContainer) {
            this.callContainer.style.display = 'flex';
        }
    }

    /**
     * Leave call
     */
    async leaveCall() {
        if (confirm('Are you sure you want to leave the call?')) {
            this.logDebug('Leave call confirmed');
            this.clearStoreSubscriptions();
            if (this.renderedMessageIds) {
                this.renderedMessageIds.clear();
            }
            await this.sdk.leaveRoom();
            window.location.href = this.isHost ? '/home' : '/';
        }
    }

    enableCallControls() {
        const controls = [this.micBtn, this.cameraBtn, this.speakerBtn, this.raiseHandBtn];
        controls.forEach(btn => {
            if (btn) {
                btn.disabled = false;
            }
        });
        this.logDebug('Call controls enabled');
    }

    logDebug(...args) {
        console.debug('[UI Controller][DEBUG]', ...args);
    }

    logWarn(...args) {
        console.warn('[UI Controller][WARN]', ...args);
    }

    logError(message, error) {
        console.error('[UI Controller][ERROR]', message, error);
    }
}

// Export for global use
window.ProfessionalUIController = ProfessionalUIController;
console.log('[UI Controller] ✅ ProfessionalUIController loaded');
