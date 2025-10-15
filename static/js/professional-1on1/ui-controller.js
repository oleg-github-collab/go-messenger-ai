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
        this.screenShareBtn = document.getElementById('screenShareBtn');
        this.reactionsBtn = document.getElementById('reactionsBtn');
        this.endCallBtn = document.getElementById('endCallBtn');
        this.chatBtn = document.getElementById('chatBtn');
        this.pollBtn = document.getElementById('pollBtn');
        this.whiteboardBtn = document.getElementById('whiteboardBtn');
        this.recordBtn = document.getElementById('recordBtn');
        this.speakerBtn = document.getElementById('speakerBtn');
        this.raiseHandBtn = document.getElementById('raiseHandBtn');

        // Status elements
        this.callTimerEl = document.getElementById('callTimer');
        this.recordingIndicatorEl = document.getElementById('recordingIndicator');
        this.notetakerStatusEl = document.getElementById('notetakerStatus');
        this.notetakerTimerEl = document.getElementById('notetakerTimer');
        this.notetakerStartBtn = document.getElementById('startNotetakerBtn');
        this.notetakerPauseBtn = document.getElementById('pauseNotetakerBtn');
        this.notetakerStopBtn = document.getElementById('stopNotetakerBtn');
        this.chatPanel = document.querySelector('.chat-panel');
        this.pollModal = document.getElementById('pollModal');
        this.whiteboardContainer = document.getElementById('whiteboardContainer');
        this.reactionsPanel = document.getElementById('reactionsPanel');

        // Control buttons
        this.micBtn = document.getElementById('micBtn');
        this.cameraBtn = document.getElementById('cameraBtn');

        // Chat
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
        this.trackRetryTimers = { video: {}, audio: {} };
        this.callStartTime = null;
        this.callTimerInterval = null;
        this.notetakerInterval = null;
        this.notetakerPaused = false;
        this.notetakerStartTimestamp = null;
        this.isScreenSharing = false;
        this.isRemoteAudioMuted = false;
        this.reactionTimeout = null;

        window.__PRO_UI__ = this;

        [this.micBtn, this.cameraBtn, this.speakerBtn, this.raiseHandBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.remove('active');
                btn.dataset.active = 'false';
            }
        });

        if (this.speakerBtn) {
            this.speakerBtn.dataset.active = 'true';
        }

        if (this.notetakerStatusEl) {
            this.updateNotetakerUI('stopped');
        }

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
            this.startCallTimer();

            if (!this.isHost && this.aiPanel) {
                this.aiPanel.style.display = 'none';
            }

            if (!this.isHost) {
                this.disableHostOnlyControls();
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
            this.stopCallTimer();
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

        if (localPeer) {
            this.localPeerId = localPeer.id;
            if (localPeer.videoTrack && this.localVideoEl && typeof this.sdk?.hmsActions?.attachVideo === 'function') {
                this.logDebug('Attaching local video track', localPeer.videoTrack);
                this.safeAttachVideo(localPeer.videoTrack, this.localVideoEl, 'local');
            }

            if (this.localSpeakingEl) {
                const show = Boolean(localPeer.isSpeaking) || Boolean(this.isTrackEnabled(localPeer.audioTrack));
                this.localSpeakingEl.style.display = show ? 'block' : 'none';
            }
        }

        if (remotePeer) {
            this.remotePeerId = remotePeer.id;
            if (remotePeer.videoTrack && this.remoteVideoEl && typeof this.sdk?.hmsActions?.attachVideo === 'function') {
                this.logDebug('Attaching remote video track', remotePeer.videoTrack);
                this.safeAttachVideo(remotePeer.videoTrack, this.remoteVideoEl, 'remote');
                this.remoteVideoEl.style.display = 'block';
            } else if (this.remoteVideoEl && this.remoteVideoEl.srcObject) {
                this.remoteVideoEl.srcObject = null;
            }

            if (remotePeer.audioTrack && this.remoteAudioEl && typeof this.sdk?.hmsActions?.attachAudio === 'function') {
                this.logDebug('Attaching remote audio track', remotePeer.audioTrack);
                this.safeAttachAudio(remotePeer.audioTrack, this.remoteAudioEl, 'remote');
            } else if (this.remoteAudioEl && this.remoteAudioEl.srcObject) {
                this.remoteAudioEl.srcObject = null;
            }

            if (this.remotePlaceholderEl) {
                this.remotePlaceholderEl.style.display = this.isTrackEnabled(remotePeer.videoTrack) ? 'none' : 'flex';
            }

            if (this.remoteSpeakingEl) {
                const showRemote = Boolean(remotePeer.isSpeaking) || Boolean(this.isTrackEnabled(remotePeer.audioTrack));
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
        this.micBtn?.addEventListener('click', async () => {
            if (!this.sdk) {
                this.logWarn('Mic toggle ignored - SDK not initialized');
                return;
            }
            try {
                this.logDebug('Mic toggle requested');
                const enabled = await this.sdk.toggleAudio();
                this.micBtn.classList.toggle('active', enabled);
                this.micBtn.dataset.active = enabled ? 'true' : 'false';
                this.logDebug('Mic state', enabled);
            } catch (error) {
                this.logError('Mic toggle failed', error);
            }
        });

        // Camera toggle
        this.cameraBtn?.addEventListener('click', async () => {
            if (!this.sdk) {
                this.logWarn('Camera toggle ignored - SDK not initialized');
                return;
            }
            try {
                this.logDebug('Camera toggle requested');
                const enabled = await this.sdk.toggleVideo();
                this.cameraBtn.classList.toggle('active', enabled);
                this.cameraBtn.dataset.active = enabled ? 'true' : 'false';
                this.logDebug('Camera state', enabled);
            } catch (error) {
                this.logError('Camera toggle failed', error);
            }
        });

        // Speaker toggle
        this.speakerBtn?.addEventListener('click', () => {
            this.isRemoteAudioMuted = !this.isRemoteAudioMuted;
            if (this.remoteAudioEl) {
                this.remoteAudioEl.muted = this.isRemoteAudioMuted;
            }
            this.speakerBtn.classList.toggle('active', !this.isRemoteAudioMuted);
            this.speakerBtn.dataset.active = !this.isRemoteAudioMuted ? 'true' : 'false';
            this.logDebug('Speaker state', !this.isRemoteAudioMuted);
        });

        // Raise hand
        this.raiseHandBtn?.addEventListener('click', async () => {
            if (!this.sdk) {
                this.logWarn('Raise hand ignored - SDK not initialized');
                return;
            }
            const raised = !this.raiseHandBtn.classList.contains('active');
            this.raiseHandBtn.classList.toggle('active', raised);
            this.raiseHandBtn.dataset.active = raised ? 'true' : 'false';
            try {
                await this.sdk.sendMessage(`${this.sdk.userName} ${raised ? 'raised a hand ✋' : 'lowered the hand'}`);
                this.logDebug('Raise hand toggled', raised);
            } catch (error) {
                this.logError('Raise hand failed', error);
            }
        });

        // Screenshare
        this.screenShareBtn?.addEventListener('click', async () => {
            if (!this.sdk) {
                this.logWarn('Screenshare ignored - SDK not initialized');
                return;
            }
            try {
                this.isScreenSharing = !this.isScreenSharing;
                await this.sdk.toggleScreenshare(this.isScreenSharing);
                this.screenShareBtn.classList.toggle('active', this.isScreenSharing);
                this.screenShareBtn.dataset.active = this.isScreenSharing ? 'true' : 'false';
                this.logDebug('Screenshare state', this.isScreenSharing);
            } catch (error) {
                this.isScreenSharing = false;
                this.screenShareBtn.classList.remove('active');
                this.screenShareBtn.dataset.active = 'false';
                this.logError('Screenshare toggle failed', error);
                alert('Screen share is not available on this device.');
            }
        });

        // Chat send
        this.chatInput?.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && this.chatInput.value.trim()) {
                if (!this.sdk) {
                    this.logWarn('Chat send ignored - SDK not initialized');
                    return;
                }
                try {
                    this.logDebug('Sending chat message');
                    await this.sdk.sendMessage(this.chatInput.value.trim());
                    this.chatInput.value = '';
                    this.logDebug('Chat message sent');
                } catch (error) {
                    this.logError('Chat send failed', error);
                }
            }
        });

        // Chat toggle
        this.chatBtn?.addEventListener('click', () => this.toggleChatPanel());
        document.getElementById('closeChatBtn')?.addEventListener('click', () => this.toggleChatPanel());

        // Poll toggle
        this.pollBtn?.addEventListener('click', () => this.togglePollModal());
        document.getElementById('closePollBtn')?.addEventListener('click', () => this.togglePollModal());

        // Whiteboard toggle
        this.whiteboardBtn?.addEventListener('click', () => this.toggleWhiteboard());
        document.getElementById('closeWhiteboardBtn')?.addEventListener('click', () => this.toggleWhiteboard());

        // Record toggle
        this.recordBtn?.addEventListener('click', () => this.toggleRecording());

        // Reactions (mobile)
        this.reactionsBtn?.addEventListener('click', () => this.toggleReactions());

        // Notetaker controls
        this.notetakerStartBtn?.addEventListener('click', () => this.startNotetaker());
        this.notetakerPauseBtn?.addEventListener('click', () => this.pauseNotetaker());
        this.notetakerStopBtn?.addEventListener('click', () => this.stopNotetaker());

        // End call buttons
        this.endCallBtn?.addEventListener('click', () => this.leaveCall());
        document.getElementById('backBtn')?.addEventListener('click', () => this.leaveCall());

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

        Object.keys(this.trackRetryTimers.video).forEach(trackId => {
            clearTimeout(this.trackRetryTimers.video[trackId]);
        });
        Object.keys(this.trackRetryTimers.audio).forEach(trackId => {
            clearTimeout(this.trackRetryTimers.audio[trackId]);
        });
        this.trackRetryTimers = { video: {}, audio: {} };

        this.stopCallTimer();
        this.isScreenSharing = false;
        this.isRecording = false;
        this.isRemoteAudioMuted = false;
        if (this.remoteAudioEl) {
            this.remoteAudioEl.muted = false;
        }
        if (this.screenShareBtn) {
            this.screenShareBtn.classList.remove('active');
            this.screenShareBtn.dataset.active = 'false';
        }
        if (this.recordBtn) {
            this.recordBtn.classList.remove('active');
            this.recordBtn.dataset.active = 'false';
        }
        if (this.speakerBtn) {
            this.speakerBtn.classList.add('active');
            this.speakerBtn.dataset.active = 'true';
        }
        if (this.raiseHandBtn) {
            this.raiseHandBtn.classList.remove('active');
            this.raiseHandBtn.dataset.active = 'false';
        }
        if (this.notetakerStartTimestamp) {
            this.notetakerStartTimestamp = null;
            this.notetakerPaused = false;
            this.updateNotetakerUI('stopped');
        }
        if (this.chatPanel) {
            this.chatPanel.classList.add('hidden');
            this.chatPanel.style.display = 'none';
            if (this.chatBtn) {
                this.chatBtn.classList.remove('active');
                this.chatBtn.dataset.active = 'false';
            }
        }
        if (this.pollModal) {
            this.pollModal.classList.remove('visible');
            this.pollModal.style.display = 'none';
            if (this.pollBtn) {
                this.pollBtn.classList.remove('active');
                this.pollBtn.dataset.active = 'false';
            }
        }
        if (this.whiteboardContainer) {
            this.whiteboardContainer.classList.remove('visible');
            this.whiteboardContainer.style.display = 'none';
            if (this.whiteboardBtn) {
                this.whiteboardBtn.classList.remove('active');
                this.whiteboardBtn.dataset.active = 'false';
            }
        }
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
        const selectTracks = (state) => state?.tracks || {};

        this.storeSubscriptions.push(
            hmsStore.subscribe(this.onTrackUpdate.bind(this), selectPeers)
        );

        this.storeSubscriptions.push(
            hmsStore.subscribe(this.onPeersUpdate.bind(this), selectPeers)
        );

        this.storeSubscriptions.push(
            hmsStore.subscribe(this.onMessage.bind(this), selectMessages)
        );

        this.storeSubscriptions.push(
            hmsStore.subscribe(() => {
                try {
                    const peerMap = this.sdk.hmsStore.getState(state => state?.peers || {});
                    this.onTrackUpdate(peerMap);
                } catch (error) {
                    this.logWarn('Track subscription refresh failed', error);
                }
            }, selectTracks)
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
            this.stopCallTimer();
            if (this.notetakerStartTimestamp) {
                await this.stopNotetaker();
            }
            if (this.isRecording) {
                await this.toggleRecording();
            }
            if (this.isScreenSharing) {
                try {
                    await this.sdk.toggleScreenshare(false);
                } catch (error) {
                    this.logWarn('Error stopping screenshare during leave', error);
                }
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

        if (this.sdk?.hmsStore) {
            try {
                const state = this.sdk.hmsStore.getState(s => ({
                    audio: s.localPeer?.audioEnabled,
                    video: s.localPeer?.videoEnabled
                }));
                if (this.micBtn) {
                    this.micBtn.classList.toggle('active', Boolean(state.audio));
                    this.micBtn.dataset.active = state.audio ? 'true' : 'false';
                }
                if (this.cameraBtn) {
                    this.cameraBtn.classList.toggle('active', Boolean(state.video));
                    this.cameraBtn.dataset.active = state.video ? 'true' : 'false';
                }
            } catch (error) {
                this.logWarn('Unable to sync control state from store', error);
            }
        }

        if (this.speakerBtn) {
            this.speakerBtn.dataset.active = this.isRemoteAudioMuted ? 'false' : 'true';
        }
        if (this.raiseHandBtn) {
            this.raiseHandBtn.dataset.active = this.raiseHandBtn.classList.contains('active') ? 'true' : 'false';
        }

        this.logDebug('Call controls enabled');
    }

    safeAttachVideo(trackId, element, label = 'video') {
        if (!trackId || !element || !this.sdk?.hmsActions || !this.sdk?.hmsStore) {
            return;
        }

        const track = this.sdk.hmsStore.getState(s => s?.tracks?.[trackId] || s?.videoTracks?.[trackId]);

        if (!track) {
            this.logDebug(`Track ${trackId} not ready for attach (${label})`);
            this.scheduleTrackRetry('video', trackId, () => this.safeAttachVideo(trackId, element, label));
            return;
        }
        try {
            this.clearTrackRetry('video', trackId);
            this.sdk.hmsActions.attachVideo(track, element);
            this.logDebug(`Attached ${label} video track`, trackId);
        } catch (error) {
            this.logError(`attachVideo failed for ${label}`, error);
            this.scheduleTrackRetry('video', trackId, () => this.safeAttachVideo(trackId, element, label), true);
        }
    }

    safeAttachAudio(trackId, element, label = 'audio') {
        if (!trackId || !element || !this.sdk?.hmsActions || !this.sdk?.hmsStore) {
            return;
        }

        const track = this.sdk.hmsStore.getState(s => s?.tracks?.[trackId] || s?.audioTracks?.[trackId]);

        if (!track) {
            this.logDebug(`Track ${trackId} not ready for attach (${label})`);
            this.scheduleTrackRetry('audio', trackId, () => this.safeAttachAudio(trackId, element, label));
            return;
        }

        try {
            this.clearTrackRetry('audio', trackId);
            this.sdk.hmsActions.attachAudio(track, element);
            this.logDebug(`Attached ${label} audio track`, trackId);
        } catch (error) {
            this.logError(`attachAudio failed for ${label}`, error);
            this.scheduleTrackRetry('audio', trackId, () => this.safeAttachAudio(trackId, element, label), true);
        }
    }

    isTrackEnabled(trackId) {
        if (!trackId || !this.sdk?.hmsStore) {
            return false;
        }

        try {
            const track = this.sdk.hmsStore.getState(s => s?.tracks?.[trackId] || s?.videoTracks?.[trackId] || s?.audioTracks?.[trackId]);
            if (!track) return false;
            if (track.type === 'audio') {
                return track.enabled !== false && track.muted !== true;
            }
            return track.enabled !== false;
        } catch (error) {
            this.logWarn('Unable to read track state', trackId, error);
            return false;
        }
    }

    scheduleTrackRetry(type, trackId, callback, immediate = false) {
        if (!trackId) return;
        const registry = this.trackRetryTimers[type];
        if (!registry) return;
        if (registry[trackId]) {
            return;
        }

        const delay = immediate ? 300 : 600;
        registry[trackId] = setTimeout(() => {
            delete registry[trackId];
            callback();
        }, delay);
    }

    clearTrackRetry(type, trackId) {
        if (!trackId) return;
        const registry = this.trackRetryTimers[type];
        if (registry && registry[trackId]) {
            clearTimeout(registry[trackId]);
            delete registry[trackId];
        }
    }

    disableHostOnlyControls() {
        if (this.notetakerStartBtn) {
            this.notetakerStartBtn.setAttribute('disabled', 'disabled');
            this.notetakerStartBtn.classList.add('disabled');
        }
        if (this.notetakerStatusEl) {
            this.notetakerStatusEl.classList.add('guest-mode');
        }
        this.notetakerPauseBtn?.setAttribute('disabled', 'disabled');
        this.notetakerStopBtn?.setAttribute('disabled', 'disabled');
        this.recordBtn?.setAttribute('disabled', 'disabled');
        if (this.recordBtn) {
            this.recordBtn.dataset.active = 'false';
        }
        this.pollBtn?.setAttribute('disabled', 'disabled');
        if (this.pollBtn) {
            this.pollBtn.dataset.active = 'false';
        }
        this.whiteboardBtn?.setAttribute('disabled', 'disabled');
        if (this.whiteboardBtn) {
            this.whiteboardBtn.dataset.active = 'false';
        }
        if (this.shareLinkContainer) {
            this.shareLinkContainer.style.display = 'none';
        }
    }

    startCallTimer() {
        this.stopCallTimer();
        this.callStartTime = Date.now();
        this.updateCallTimer();
        this.callTimerInterval = setInterval(() => this.updateCallTimer(), 1000);
    }

    stopCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
    }

    updateCallTimer() {
        if (!this.callTimerEl || !this.callStartTime) return;
        const diff = Date.now() - this.callStartTime;
        const minutes = Math.floor(diff / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        this.callTimerEl.textContent = `${minutes}:${seconds}`;
    }

    toggleChatPanel() {
        if (!this.chatPanel) return;
        const hidden = this.chatPanel.classList.toggle('hidden');
        this.chatPanel.style.display = hidden ? 'none' : 'flex';
        this.chatBtn?.classList.toggle('active', !hidden);
        if (this.chatBtn) {
            this.chatBtn.dataset.active = !hidden ? 'true' : 'false';
        }
        if (!hidden) {
            const badge = document.getElementById('chatBadge');
            if (badge) {
                badge.style.display = 'none';
            }
        }
    }

    togglePollModal() {
        if (!this.pollModal) return;
        const visible = this.pollModal.classList.toggle('visible');
        this.pollModal.style.display = visible ? 'flex' : 'none';
        this.pollBtn?.classList.toggle('active', visible);
        if (this.pollBtn) {
            this.pollBtn.dataset.active = visible ? 'true' : 'false';
        }
    }

    toggleWhiteboard() {
        if (!this.whiteboardContainer) return;
        const visible = this.whiteboardContainer.classList.toggle('visible');
        this.whiteboardContainer.style.display = visible ? 'flex' : 'none';
        this.whiteboardBtn?.classList.toggle('active', visible);
        if (this.whiteboardBtn) {
            this.whiteboardBtn.dataset.active = visible ? 'true' : 'false';
        }
    }

    toggleReactions() {
        if (!this.reactionsPanel) {
            alert('Reactions are coming soon.');
            return;
        }
        const visible = this.reactionsPanel.classList.toggle('visible');
        this.reactionsPanel.style.display = visible ? 'flex' : 'none';
        if (this.reactionsBtn) {
            this.reactionsBtn.classList.toggle('active', visible);
            this.reactionsBtn.dataset.active = visible ? 'true' : 'false';
        }
        if (visible) {
            clearTimeout(this.reactionTimeout);
            this.reactionTimeout = setTimeout(() => {
                this.reactionsPanel.classList.remove('visible');
                this.reactionsPanel.style.display = 'none';
            }, 4000);
        }
    }

    async toggleRecording() {
        if (!this.isHost) {
            alert('Only the host can control recording.');
            return;
        }
        if (!this.sdk) {
            this.logWarn('Recording ignored - SDK not initialized');
            return;
        }
        try {
            this.isRecording = !this.isRecording;
            await this.sdk.toggleRecording(this.isRecording);
            this.recordBtn?.classList.toggle('active', this.isRecording);
            if (this.recordBtn) {
                this.recordBtn.dataset.active = this.isRecording ? 'true' : 'false';
            }
            if (this.recordingIndicatorEl) {
                this.recordingIndicatorEl.style.display = this.isRecording ? 'flex' : 'none';
            }
            this.logDebug('Recording state', this.isRecording);
        } catch (error) {
            this.isRecording = false;
            this.recordBtn?.classList.remove('active');
            if (this.recordingIndicatorEl) {
                this.recordingIndicatorEl.style.display = 'none';
            }
            this.logError('Recording toggle failed', error);
            alert('Recording is not available in this environment.');
        }
    }

    async startNotetaker() {
        if (!this.isHost) {
            alert('Only the host can start the AI Notetaker');
            return;
        }
        if (!this.sdk?.hmsRoomId) {
            this.logWarn('Cannot start notetaker - room ID unavailable');
            return;
        }
        try {
            const res = await fetch('/api/notetaker/start', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({ room_id: this.sdk.hmsRoomId })
            });
            if (!res.ok) {
                throw new Error(await res.text());
            }
            this.notetakerStartTimestamp = Date.now();
            this.notetakerPaused = false;
            this.updateNotetakerUI('recording');
            this.updateNotetakerTimer();
            this.notetakerInterval = setInterval(() => this.updateNotetakerTimer(), 1000);
            this.logDebug('Notetaker started');
        } catch (error) {
            this.logError('Notetaker start failed', error);
            this.updateNotetakerUI('stopped');
            alert('Failed to start Notetaker: ' + error.message);
        }
    }

    pauseNotetaker() {
        if (!this.isHost) {
            return;
        }
        if (!this.notetakerStartTimestamp) {
            return;
        }
        this.notetakerPaused = !this.notetakerPaused;
        this.updateNotetakerUI(this.notetakerPaused ? 'paused' : 'recording');
        if (!this.notetakerPaused && this.notetakerPauseBtn) {
            this.notetakerPauseBtn.innerHTML = `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                </svg>
                <span>Pause</span>
            `;
        }
        this.logDebug('Notetaker pause toggled', this.notetakerPaused);
    }

    async stopNotetaker() {
        if (!this.isHost && this.notetakerStartTimestamp) {
            return;
        }
        if (!this.notetakerStartTimestamp) {
            return;
        }
        try {
            if (this.isHost && this.sdk?.hmsRoomId) {
                await fetch('/api/notetaker/stop', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify({ room_id: this.sdk.hmsRoomId })
                });
            }
        } catch (error) {
            this.logError('Notetaker stop failed', error);
        }

        if (this.notetakerInterval) {
            clearInterval(this.notetakerInterval);
            this.notetakerInterval = null;
        }
        this.notetakerStartTimestamp = null;
        this.updateNotetakerUI('stopped');
        this.logDebug('Notetaker stopped');
    }

    updateNotetakerUI(state) {
        if (!this.notetakerStatusEl || !this.notetakerTimerEl) {
            return;
        }
        switch (state) {
            case 'recording':
                this.notetakerStatusEl.textContent = 'Recording';
                this.notetakerStatusEl.classList.add('recording');
                this.notetakerStatusEl.classList.remove('paused');
                this.notetakerTimerEl.style.display = 'block';
                this.notetakerStartBtn.style.display = 'none';
                this.notetakerPauseBtn.style.display = 'flex';
                this.notetakerStopBtn.style.display = 'flex';
                if (this.recordingIndicatorEl) {
                    this.recordingIndicatorEl.style.display = 'flex';
                }
                if (this.notetakerPauseBtn) {
                    this.notetakerPauseBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                        </svg>
                        <span>Pause</span>
                    `;
                }
                break;
            case 'paused':
                this.notetakerStatusEl.textContent = 'Paused';
                this.notetakerStatusEl.classList.remove('recording');
                this.notetakerStatusEl.classList.add('paused');
                if (this.recordingIndicatorEl) {
                    this.recordingIndicatorEl.style.display = 'flex';
                }
                if (this.notetakerPauseBtn) {
                    this.notetakerPauseBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                        <span>Resume</span>
                    `;
                }
                break;
            case 'stopped':
                this.notetakerStatusEl.textContent = 'Ready';
                this.notetakerStatusEl.classList.remove('recording', 'paused');
                this.notetakerTimerEl.style.display = 'none';
                this.notetakerTimerEl.textContent = '00:00';
                this.notetakerStartBtn.style.display = 'flex';
                this.notetakerPauseBtn.style.display = 'none';
                this.notetakerStopBtn.style.display = 'none';
                if (this.notetakerPauseBtn) {
                    this.notetakerPauseBtn.innerHTML = `
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
                        </svg>
                        <span>Pause</span>
                    `;
                }
                if (this.recordingIndicatorEl) {
                    this.recordingIndicatorEl.style.display = 'none';
                }
                break;
            default:
                break;
        }
    }

    updateNotetakerTimer() {
        if (!this.notetakerTimerEl || !this.notetakerStartTimestamp || this.notetakerPaused) {
            return;
        }
        const elapsed = Date.now() - this.notetakerStartTimestamp;
        const minutes = Math.floor(elapsed / 60000).toString().padStart(2, '0');
        const seconds = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
        this.notetakerTimerEl.textContent = `${minutes}:${seconds}`;
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
