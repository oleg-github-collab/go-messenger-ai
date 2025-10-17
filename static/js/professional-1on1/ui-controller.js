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
        this.reactionsPanel = document.getElementById('reactionsPanel');
        this.reactionsFloatingPanel = document.getElementById('reactionsFloatingPanel');
        this.reactionsDesktopBtn = document.getElementById('reactionsDesktopBtn');
        this.mobileMoreBtn = document.getElementById('mobileMoreBtn');
        this.mobileMoreMenu = document.getElementById('mobileMoreMenu');
        this.closeMobileMenu = document.getElementById('closeMobileMenu');

        // Control buttons
        this.micBtn = document.getElementById('micBtn');
        this.cameraBtn = document.getElementById('cameraBtn');

        // Chat
        this.chatMessages = document.querySelector('.chat-messages');
        this.chatInput = document.getElementById('chatInput');
        this.chatBadge = document.getElementById('chatBadge');

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
        this.trackRetryTimers = { video: new Map(), audio: new Map() };
        this.callStartTime = null;
        this.callTimerInterval = null;
        this.notetakerInterval = null;
        this.notetakerPaused = false;
        this.notetakerStartTimestamp = null;
        this.isScreenSharing = false;
        this.isRemoteAudioMuted = false;
        this.reactionTimeout = null;
        this.reactionOverlay = document.getElementById('reactionOverlay');
        this.isRecording = false;
        this.recordingMode = null;
        this.localRecorder = null;
        this.localRecordingChunks = [];
        this.localRecordingStart = null;
        this.localRecordingTracks = [];
        this.latestLocalRecordingId = null;
        this.notetakerStatusPoll = null;
        this.controlsVisible = true;
        this.controlsAutoHideTimer = null;
        this.engagementInitialized = false;
        this.wakeLock = null;
        this.boundHandleInteraction = this.handleUserInteraction.bind(this);
        this.boundHandleStageTap = this.handleStageTap.bind(this);
        this.boundFullscreenChange = this.onFullscreenChange.bind(this);
        this.boundVisibilityChange = this.handleVisibilityChange.bind(this);

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

    applyRecordingUI(isRecording, mode = 'cloud') {
        if (this.recordBtn) {
            this.recordBtn.classList.toggle('active', isRecording);
            this.recordBtn.dataset.active = isRecording ? 'true' : 'false';
        }

        if (this.recordingIndicatorEl) {
            this.recordingIndicatorEl.style.display = isRecording ? 'flex' : 'none';
            const label = this.recordingIndicatorEl.querySelector('span:last-child');
            if (label) {
                label.textContent = mode === 'local' ? 'REC · LOCAL' : 'REC';
            }
        }
    }

    async startLocalRecording() {
        if (typeof window.MediaRecorder === 'undefined') {
            throw new Error('MediaRecorder API is not supported in this browser.');
        }
        if (this.localRecorder) {
            this.logWarn('Local recorder already active, ignoring duplicate start');
            return 'local';
        }

        const combinedStream = new MediaStream();
        const clonedTracks = [];

        const addTracks = stream => {
            stream.getTracks().forEach(track => {
                try {
                    const clone = track.clone();
                    clonedTracks.push(clone);
                    combinedStream.addTrack(clone);
                } catch (error) {
                    this.logWarn('Failed to clone track for recording', error);
                }
            });
        };

        const remoteStream = this.remoteVideoEl?.srcObject;
        if (remoteStream instanceof MediaStream) {
            addTracks(remoteStream);
        }

        const localStream = this.localVideoEl?.srcObject;
        if (localStream instanceof MediaStream) {
            addTracks(localStream);
        }

        if (!combinedStream.getTracks().length) {
            throw new Error('No media tracks available for local recording.');
        }

        const preferredTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm'
        ];
        const mimeType = preferredTypes.find(type => {
            return typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type);
        });

        const options = mimeType ? { mimeType } : undefined;
        const recorder = new MediaRecorder(combinedStream, options);
        this.localRecordingChunks = [];

        recorder.addEventListener('dataavailable', event => {
            if (event.data && event.data.size > 0) {
                this.localRecordingChunks.push(event.data);
            }
        });

        recorder.addEventListener('error', event => {
            this.logError('Local recorder error', event.error || event);
        });

        recorder.start(2000);

        this.localRecorder = recorder;
        this.localRecordingTracks = clonedTracks;
        this.localRecordingStart = Date.now();

        this.logDebug('Local MediaRecorder started', mimeType || 'default');
        return 'local';
    }

    async stopLocalRecording() {
        if (!this.localRecorder) {
            this.logDebug('Local recorder already stopped');
            return;
        }

        await new Promise((resolve, reject) => {
            const recorder = this.localRecorder;

            const handleStop = async () => {
                try {
                    const blob = new Blob(this.localRecordingChunks, { type: recorder.mimeType || 'video/webm' });
                    await this.uploadLocalRecording(blob);
                    resolve();
                } catch (error) {
                    reject(error);
                } finally {
                    this.localRecordingTracks.forEach(track => {
                        try {
                            track.stop();
                        } catch (trackError) {
                            this.logWarn('Failed to stop cloned track', trackError);
                        }
                    });
                    this.localRecordingTracks = [];
                    this.localRecorder = null;
                    this.localRecordingChunks = [];
                    this.localRecordingStart = null;
                }
            };

            recorder.addEventListener('stop', handleStop, { once: true });
            recorder.addEventListener('error', event => {
                reject(event.error || new Error('MediaRecorder error'));
            }, { once: true });

            try {
                recorder.stop();
            } catch (error) {
                reject(error);
            }
        });
    }

    async uploadLocalRecording(blob) {
        if (!blob || !blob.size) {
            this.logWarn('Local recording blob empty, skipping upload');
            return;
        }

        const arrayBuffer = await blob.arrayBuffer();
        const base64Data = this.arrayBufferToBase64(arrayBuffer);
        const durationSeconds = this.localRecordingStart
            ? Math.max(1, Math.round((Date.now() - this.localRecordingStart) / 1000))
            : 0;

        const payload = {
            meetingId: this.sdk?.hmsRoomId || this.roomCode,
            roomCode: this.roomCode,
            hostId: this.sdk?.userId || 'host',
            mimeType: blob.type || 'video/webm',
            size: blob.size,
            durationSeconds,
            startedAt: this.localRecordingStart ? new Date(this.localRecordingStart).toISOString() : new Date().toISOString(),
            endedAt: new Date().toISOString(),
            data: base64Data,
            participants: this.getParticipantNames()
        };

        const response = await fetch('/api/recordings/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(`Failed to upload recording: ${response.status} ${message}`);
        }

        const result = await response.json();
        this.latestLocalRecordingId = result?.recordingId || null;
        this.logInfo('Local recording uploaded', result);
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode.apply(null, chunk);
        }
        return btoa(binary);
    }

    getParticipantNames() {
        const names = new Set();
        if (this.sdk?.userName) {
            names.add(this.sdk.userName);
        }
        if (typeof this.sdk?.getRemotePeers === 'function') {
            try {
                const remotePeers = this.sdk.getRemotePeers();
                remotePeers.forEach(peer => {
                    if (peer?.name) {
                        names.add(peer.name);
                    } else if (peer?.userName) {
                        names.add(peer.userName);
                    }
                });
            } catch (error) {
                this.logWarn('Failed to collect remote peer names', error);
            }
        }
        return Array.from(names);
    }

    /**
     * Initialize as HOST
     */
    async initializeAsHost(inviteCode = null) {
        console.log('[UI Controller] Initializing as HOST');
        this.isHost = true;
        document.body.setAttribute('data-is-host', 'true');
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
        document.body.setAttribute('data-is-host', 'false');
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
            this.startNotetakerStatusPolling();

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
                this.micBtn.dataset.active = joinPreferences.audioEnabled ? 'true' : 'false';
            }
            if (this.cameraBtn) {
                this.cameraBtn.classList.toggle('active', joinPreferences.videoEnabled);
                this.cameraBtn.dataset.active = joinPreferences.videoEnabled ? 'true' : 'false';
            }

            this.hideLoading();
            this.showCallUI();
            this.initializeEngagementFeatures();

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

    initializeEngagementFeatures() {
        if (this.engagementInitialized) {
            return;
        }

        if (this.callContainer) {
            ['pointerdown', 'mousemove', 'touchstart', 'keydown'].forEach(eventName => {
                this.callContainer.addEventListener(eventName, this.boundHandleInteraction, { passive: true });
            });
            this.callContainer.classList.add('controls-visible');
        }

        if (this.remoteVideoContainer) {
            this.remoteVideoContainer.addEventListener('click', this.boundHandleStageTap, { passive: true });
        }

        if (typeof document !== 'undefined') {
            document.addEventListener('fullscreenchange', this.boundFullscreenChange);
            document.addEventListener('webkitfullscreenchange', this.boundFullscreenChange);
            document.addEventListener('visibilitychange', this.boundVisibilityChange);
        }

        this.showControls(true);
        this.startControlsAutoHideTimer();
        this.requestWakeLock();
        this.engagementInitialized = true;
    }

    cleanupEngagementFeatures() {
        if (!this.engagementInitialized) {
            return;
        }

        if (this.callContainer) {
            ['pointerdown', 'mousemove', 'touchstart', 'keydown'].forEach(eventName => {
                this.callContainer.removeEventListener(eventName, this.boundHandleInteraction);
            });
            this.callContainer.classList.remove('controls-hidden');
            this.callContainer.classList.remove('controls-visible');
        }

        if (this.remoteVideoContainer) {
            this.remoteVideoContainer.removeEventListener('click', this.boundHandleStageTap);
        }

        if (typeof document !== 'undefined') {
            document.removeEventListener('fullscreenchange', this.boundFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', this.boundFullscreenChange);
            document.removeEventListener('visibilitychange', this.boundVisibilityChange);
        }

        this.stopControlsAutoHideTimer();
        this.releaseWakeLock();
        this.engagementInitialized = false;
    }

    handleUserInteraction() {
        this.showControls();
    }

    handleStageTap() {
        this.showControls();
        if (!this.isFullscreenActive() && this.isMobileViewport()) {
            this.enterFullscreen();
        } else if (this.controlsVisible) {
            this.hideControls();
        } else {
            this.showControls();
        }
    }

    isMobileViewport() {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return false;
        }
        return window.matchMedia('(max-width: 1024px)').matches;
    }

    showControls(force = false) {
        if (!this.callContainer) return;
        this.controlsVisible = true;
        this.callContainer.classList.add('controls-visible');
        this.callContainer.classList.remove('controls-hidden');
        if (force) {
            this.startControlsAutoHideTimer();
        } else {
            this.restartControlsAutoHideTimer();
        }
    }

    hideControls() {
        if (!this.callContainer) return;
        if (this.isOverlayActive()) {
            return;
        }
        this.controlsVisible = false;
        this.callContainer.classList.add('controls-hidden');
        this.callContainer.classList.remove('controls-visible');
        this.stopControlsAutoHideTimer();
    }

    isOverlayActive() {
        if (this.chatPanel && !this.chatPanel.classList.contains('hidden') && this.chatPanel.style.display !== 'none') {
            return true;
        }
        if (this.pollModal && this.pollModal.classList.contains('visible')) {
            return true;
        }
        if (this.aiPanel && this.aiPanel.style.display !== 'none') {
            return true;
        }
        if (this.customAlertVisible()) {
            return true;
        }
        return false;
    }

    customAlertVisible() {
        const alertEl = document.getElementById('customAlert');
        const confirmEl = document.getElementById('customConfirm');
        return (alertEl && alertEl.style.display !== 'none') || (confirmEl && confirmEl.style.display !== 'none');
    }

    startControlsAutoHideTimer() {
        this.stopControlsAutoHideTimer();
        this.controlsAutoHideTimer = setTimeout(() => this.hideControls(), 6000);
    }

    restartControlsAutoHideTimer() {
        this.stopControlsAutoHideTimer();
        this.controlsAutoHideTimer = setTimeout(() => this.hideControls(), 6000);
    }

    stopControlsAutoHideTimer() {
        if (this.controlsAutoHideTimer) {
            clearTimeout(this.controlsAutoHideTimer);
            this.controlsAutoHideTimer = null;
        }
    }

    isFullscreenActive() {
        return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    }

    async enterFullscreen() {
        if (!this.remoteVideoContainer) return;
        try {
            if (this.remoteVideoContainer.requestFullscreen) {
                await this.remoteVideoContainer.requestFullscreen();
            } else if (this.remoteVideoContainer.webkitRequestFullscreen) {
                await this.remoteVideoContainer.webkitRequestFullscreen();
            }
        } catch (error) {
            this.logWarn('Fullscreen request failed', error);
        }
    }

    async exitFullscreen() {
        if (!this.isFullscreenActive()) return;
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen();
            }
        } catch (error) {
            this.logWarn('Fullscreen exit failed', error);
        }
    }

    onFullscreenChange() {
        if (this.isFullscreenActive()) {
            document.body.classList.add('fullscreen-active');
            this.callContainer?.classList.add('fullscreen-active');
        } else {
            document.body.classList.remove('fullscreen-active');
            this.callContainer?.classList.remove('fullscreen-active');
            this.showControls(true);
        }
    }

    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            this.requestWakeLock();
        } else {
            this.releaseWakeLock();
        }
    }

    async requestWakeLock() {
        if (!('wakeLock' in navigator) || typeof navigator.wakeLock.request !== 'function') {
            return;
        }
        try {
            if (this.wakeLock) {
                await this.wakeLock.release();
            }
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.wakeLock.addEventListener('release', () => {
                this.wakeLock = null;
            });
        } catch (error) {
            this.logWarn('Wake lock request failed', error);
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
            } catch (error) {
                this.logWarn('Wake lock release failed', error);
            }
            this.wakeLock = null;
        }
    }

    /**
     * Handle track updates - render video/audio
     */
    onTrackUpdate(peers) {
        let peerValues = [];
        if (!peers) {
            peerValues = [];
        } else if (Array.isArray(peers)) {
            peerValues = peers;
        } else if (typeof Map !== 'undefined' && peers instanceof Map) {
            peerValues = Array.from(peers.values());
        } else if (typeof peers === 'object') {
            peerValues = Object.values(peers);
        }
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
                delete this.remoteVideoEl.dataset.trackId;
            }
            if (this.remoteAudioEl) {
                this.remoteAudioEl.srcObject = null;
                delete this.remoteAudioEl.dataset.trackId;
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
            if (this.micBtn.disabled) return;

            this.micBtn.disabled = true;
            try {
                this.logDebug('Mic toggle requested');
                const enabled = await this.sdk.toggleAudio();
                if (typeof enabled === 'boolean') {
                    this.micBtn.classList.toggle('active', enabled);
                    this.micBtn.dataset.active = enabled ? 'true' : 'false';

                    // Toggle icons
                    const iconOn = this.micBtn.querySelector('.icon-on');
                    const iconOff = this.micBtn.querySelector('.icon-off');
                    if (iconOn && iconOff) {
                        iconOn.style.display = enabled ? 'block' : 'none';
                        iconOff.style.display = enabled ? 'none' : 'block';
                    }

                    this.logDebug('Mic state', enabled);
                } else {
                    this.logWarn('Mic toggle skipped - track not ready');
                }
            } catch (error) {
                this.logError('Mic toggle failed', error);
            } finally {
                this.micBtn.disabled = false;
            }
        });

        // Camera toggle
        this.cameraBtn?.addEventListener('click', async () => {
            if (!this.sdk) {
                this.logWarn('Camera toggle ignored - SDK not initialized');
                return;
            }
            if (this.cameraBtn.disabled) return;

            this.cameraBtn.disabled = true;
            try {
                this.logDebug('Camera toggle requested');
                const enabled = await this.sdk.toggleVideo();
                if (typeof enabled === 'boolean') {
                    this.cameraBtn.classList.toggle('active', enabled);
                    this.cameraBtn.dataset.active = enabled ? 'true' : 'false';

                    // Toggle icons
                    const iconOn = this.cameraBtn.querySelector('.icon-on');
                    const iconOff = this.cameraBtn.querySelector('.icon-off');
                    if (iconOn && iconOff) {
                        iconOn.style.display = enabled ? 'block' : 'none';
                        iconOff.style.display = enabled ? 'none' : 'block';
                    }

                    this.logDebug('Camera state', enabled);
                } else {
                    this.logWarn('Camera toggle skipped - track not ready');
                }
            } catch (error) {
                this.logError('Camera toggle failed', error);
            } finally {
                this.cameraBtn.disabled = false;
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
            if (this.screenShareBtn.disabled) return;

            this.screenShareBtn.disabled = true;
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

                const errorMsg = error?.message || String(error);
                // Don't show error if user simply cancelled
                if (errorMsg.includes('denied') || errorMsg.includes('Permission') || errorMsg.includes('cancelled')) {
                    this.logDebug('Screenshare cancelled by user');
                } else {
                    this.logError('Screenshare toggle failed', error);
                    alert('Screen sharing is not available. Please try again or use a different browser.');
                }
            } finally {
                this.screenShareBtn.disabled = false;
            }
        });

        // Chat send with Enter key
        this.chatInput?.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();

                const messageText = this.chatInput.value.trim();
                if (!messageText) return;

                if (!this.sdk) {
                    this.logWarn('Chat send ignored - SDK not initialized');
                    return;
                }

                this.chatInput.value = '';

                try {
                    this.logDebug('Sending chat message via Enter');
                    // Add message immediately to UI (optimistic update)
                    this.addChatMessage(this.sdk.userName || 'You', messageText, Date.now());
                    await this.sdk.sendMessage(messageText);
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

        // Reactions (desktop)
        this.reactionsDesktopBtn?.addEventListener('click', () => this.toggleReactions());

        // Mobile More Menu
        this.mobileMoreBtn?.addEventListener('click', () => {
            if (this.mobileMoreMenu) {
                this.mobileMoreMenu.style.display = 'block';
            }
        });

        this.closeMobileMenu?.addEventListener('click', () => {
            if (this.mobileMoreMenu) {
                this.mobileMoreMenu.style.display = 'none';
            }
        });

        // Mobile menu items (placeholders for future features)
        document.getElementById('mobileBlurBtn')?.addEventListener('click', () => {
            alert('Blur background feature coming soon!');
            if (this.mobileMoreMenu) this.mobileMoreMenu.style.display = 'none';
        });

        document.getElementById('mobileVirtualBtn')?.addEventListener('click', () => {
            alert('Virtual background feature coming soon!');
            if (this.mobileMoreMenu) this.mobileMoreMenu.style.display = 'none';
        });

        document.getElementById('mobileSpeakerBtn')?.addEventListener('click', () => {
            // Toggle speaker
            this.isRemoteAudioMuted = !this.isRemoteAudioMuted;
            if (this.remoteAudioEl) {
                this.remoteAudioEl.muted = this.isRemoteAudioMuted;
            }
            if (this.mobileMoreMenu) this.mobileMoreMenu.style.display = 'none';
        });

        document.getElementById('mobileRaiseHandBtn')?.addEventListener('click', async () => {
            if (this.sdk) {
                try {
                    await this.sdk.sendMessage('✋ Raised hand');
                    this.showReactionOverlay('✋', 'You');
                } catch (error) {
                    this.logError('Raise hand failed', error);
                }
            }
            if (this.mobileMoreMenu) this.mobileMoreMenu.style.display = 'none';
        });

        // Notetaker controls
        this.notetakerStartBtn?.addEventListener('click', () => this.startNotetaker());
        this.notetakerPauseBtn?.addEventListener('click', () => this.pauseNotetaker());
        this.notetakerStopBtn?.addEventListener('click', () => this.stopNotetaker());

        // End call buttons
        this.endCallBtn?.addEventListener('click', () => this.leaveCall());
        document.getElementById('backBtn')?.addEventListener('click', () => this.leaveCall());

        this.setupReactionButtons();

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

        this.trackRetryTimers.video.forEach(timeoutId => clearTimeout(timeoutId));
        this.trackRetryTimers.audio.forEach(timeoutId => clearTimeout(timeoutId));
        this.trackRetryTimers = { video: new Map(), audio: new Map() };

        this.stopCallTimer();
        this.stopNotetakerStatusPolling();
        this.cleanupEngagementFeatures();
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
        if (this.reactionsPanel) {
            this.reactionsPanel.classList.remove('visible');
            this.reactionsPanel.style.display = 'none';
        }
        if (this.reactionOverlay) {
            this.reactionOverlay.classList.remove('visible');
            this.reactionOverlay.textContent = '';
        }
        if (this.chatBadge) {
            this.chatBadge.style.display = 'none';
            this.chatBadge.textContent = '0';
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
        const selectTracks = (state) => state?.tracks || {};
        const selectMessages = (state) => state?.messages || null;

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

        try {
            const initialPeers = hmsStore.getState(selectPeers) || [];
            this.onPeersUpdate(initialPeers);
            this.onTrackUpdate(initialPeers);
        } catch (error) {
            this.logWarn('Failed to process initial peer state', error);
        }

        try {
            const initialMessages = hmsStore.getState(selectMessages);
            if (initialMessages) {
                this.onMessage(initialMessages);
            }
        } catch (error) {
            this.logWarn('Failed to process initial message state', error);
        }
    }

    /**
     * Handle chat messages
     */
    onMessage(messagesState) {
        const normalizeMessageList = (source) => {
            if (!source) return [];
            if (Array.isArray(source)) {
                return source;
            }

            if (typeof source !== 'object') {
                return [];
            }

            const aggregates = [];
            const buckets = [
                source.broadcastMessages,
                source.broadCastMessages,
                source.directMessages,
                source.groupMessages,
                source.privateMessages,
                source.messages
            ];

            buckets.forEach(bucket => {
                if (Array.isArray(bucket)) {
                    aggregates.push(...bucket);
                }
            });

            if (aggregates.length > 0) {
                return aggregates;
            }

            return Object.values(source)
                .filter(item => item && typeof item === 'object')
                .reduce((acc, item) => acc.concat(normalizeMessageList(item)), []);
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

            if (text.startsWith('REACTION::')) {
                const reaction = text.replace('REACTION::', '');
                this.renderedMessageIds.add(messageKey);
                this.showReactionOverlay(reaction, sender);
                return;
            }

            this.renderedMessageIds.add(messageKey);
            this.addChatMessage(sender, text, timestamp);

            if (this.chatBadge && sender !== this.sdk?.userName) {
                const current = parseInt(this.chatBadge.textContent || '0', 10) || 0;
                this.chatBadge.textContent = String(current + 1);
                this.chatBadge.style.display = 'inline-flex';
            }
        });
    }

    /**
     * Handle peer updates
     */
    onPeersUpdate(peers) {
        const peerList = Array.isArray(peers) ? peers : Object.values(peers || {});
        const peerCount = peerList.length;
        const participantLabel = document.querySelector('.participant-name');

        if (participantLabel) {
            if (peerCount <= 1) {
                participantLabel.textContent = 'Waiting for guest...';
            } else {
                const remotePeers = peerList.filter(p => !p.isLocal);
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

        const displaySender = sender === this.sdk?.userName ? 'You' : sender;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.innerHTML = `
            <div class="message-header">
                <strong>${displaySender}</strong>
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
        if (this.isHost) {
            // Show host options
            const choice = confirm(
                'Choose how to leave:\n\n' +
                'OK = Leave (meeting continues for others)\n' +
                'Cancel = Stay in meeting'
            );

            if (!choice) return; // User cancelled

            // Ask if they want to end for everyone
            const endForAll = confirm(
                'Do you want to END the meeting for everyone?\n\n' +
                'OK = End meeting for all\n' +
                'Cancel = Just leave (others can continue)'
            );

            this.logDebug('Leave call - host', { endForAll });

            // Clean up local resources
            this.clearStoreSubscriptions();
            if (this.renderedMessageIds) {
                this.renderedMessageIds.clear();
            }
            this.stopCallTimer();
            this.stopNotetakerStatusPolling();

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

            if (endForAll && this.sdk?.hmsActions) {
                try {
                    // End room for everyone
                    await this.sdk.hmsActions.endRoom(true, 'Host ended the meeting');
                    this.logDebug('Room ended for all participants');
                } catch (error) {
                    this.logError('Error ending room', error);
                }
            }

            await this.sdk.leaveRoom();
            window.location.href = '/home';
        } else {
            // Guest - simple leave
            if (confirm('Are you sure you want to leave the call?')) {
                this.logDebug('Leave call confirmed - guest');
                this.clearStoreSubscriptions();
                if (this.renderedMessageIds) {
                    this.renderedMessageIds.clear();
                }
                this.stopCallTimer();

                await this.sdk.leaveRoom();
                window.location.href = '/';
            }
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
                const audioEnabled = state.audio !== false;
                const videoEnabled = state.video !== false;
                if (this.micBtn) {
                    this.micBtn.classList.toggle('active', audioEnabled);
                    this.micBtn.dataset.active = audioEnabled ? 'true' : 'false';
                }
                if (this.cameraBtn) {
                    this.cameraBtn.classList.toggle('active', videoEnabled);
                    this.cameraBtn.dataset.active = videoEnabled ? 'true' : 'false';
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

    resolveTrack(trackRef, type = 'video') {
        if (!trackRef) {
            return { track: null, trackId: null };
        }

        if (typeof trackRef === 'object' && trackRef !== null && trackRef.id) {
            return { track: trackRef, trackId: trackRef.id };
        }

        const trackId = typeof trackRef === 'string'
            ? trackRef
            : (trackRef && (trackRef.trackId || trackRef.id)) || null;

        if (!trackId || !this.sdk?.hmsStore) {
            return { track: null, trackId };
        }

        const track = this.sdk.hmsStore.getState(state => {
            const collections = [
                state?.tracks,
                type === 'video' ? state?.videoTracks : null,
                type === 'audio' ? state?.audioTracks : null
            ];

            for (const collection of collections) {
                if (!collection) continue;
                if (typeof collection.get === 'function') {
                    const value = collection.get(trackId);
                    if (value) return value;
                }
                if (collection && typeof collection === 'object' && trackId in collection) {
                    return collection[trackId];
                }
            }
            return null;
        });

        return { track, trackId };
    }

    safeAttachVideo(trackRef, element, label = 'video') {
        if (!trackRef || !element) {
            return;
        }

        const { track, trackId } = this.resolveTrack(trackRef, 'video');

        if (!track) {
            const key = trackId || (trackRef && trackRef.id) || label;
            this.logDebug(`Track ${key} not ready for attach (${label})`);
            this.scheduleTrackRetry('video', trackRef, () => this.safeAttachVideo(trackRef, element, label));
            return;
        }

        try {
            this.clearTrackRetry('video', trackRef);

            // Check if already attached - PREVENT FLICKERING
            const currentTrackId = element.dataset.trackId;
            const newTrackId = track.id || trackId || '';
            if (currentTrackId === newTrackId && currentTrackId !== '') {
                // Track already attached, skip
                return;
            }

            // Use HMS SDK attachVideo if available
            if (typeof this.sdk?.hmsActions?.attachVideo === 'function') {
                try {
                    this.sdk.hmsActions.attachVideo(newTrackId, element);
                    element.dataset.trackId = newTrackId;
                    element.style.display = 'block';
                    this.logDebug(`Attached ${label} video via HMS attachVideo`, trackId);
                    return;
                } catch (hmsError) {
                    this.logWarn('HMS attachVideo failed, falling back to manual stream', hmsError);
                }
            }

            // Fallback: manual stream attachment
            const media = this.getTrackMedia(track, 'video', label);
            if (!media) {
                this.logDebug('Video media unavailable yet', trackId);
                this.scheduleTrackRetry('video', trackRef, () => this.safeAttachVideo(trackRef, element, label));
                return;
            }

            const { stream, mediaTrack } = media;
            if (!stream || !mediaTrack) {
                this.logDebug('Video media incomplete', { trackId, hasStream: !!stream, hasTrack: !!mediaTrack });
                this.scheduleTrackRetry('video', trackRef, () => this.safeAttachVideo(trackRef, element, label));
                return;
            }

            if (element.dataset.trackId === (track.id || trackId) && element.srcObject === stream) {
                return;
            }

            element.srcObject = stream;
            element.dataset.trackId = track.id || trackId || '';
            element.playsInline = true;
            element.muted = label === 'local';
            element.autoplay = true;
            element.style.display = 'block';
            element.play?.().catch(err => this.logWarn('Video play() failed', err));

            this.logDebug(`Attached ${label} video track`, {
                trackId: track.id || trackId,
                label,
                readyState: mediaTrack.readyState,
                enabled: mediaTrack.enabled
            });
        } catch (error) {
            this.logError(`Failed to attach ${label} video`, error);
            this.scheduleTrackRetry('video', trackRef, () => this.safeAttachVideo(trackRef, element, label), true);
        }
    }

    safeAttachAudio(trackRef, element, label = 'audio') {
        if (!trackRef || !element) {
            return;
        }

        const { track, trackId } = this.resolveTrack(trackRef, 'audio');

        if (!track) {
            const key = trackId || (trackRef && trackRef.id) || label;
            this.logDebug(`Track ${key} not ready for attach (${label})`);
            this.scheduleTrackRetry('audio', trackRef, () => this.safeAttachAudio(trackRef, element, label));
            return;
        }

        try {
            this.clearTrackRetry('audio', trackRef);

            // Check if already attached - PREVENT FLICKERING
            const currentTrackId = element.dataset.trackId;
            const newTrackId = track.id || trackId || '';
            if (currentTrackId === newTrackId && currentTrackId !== '') {
                // Track already attached, skip
                return;
            }

            // Use HMS SDK attachAudio if available
            if (typeof this.sdk?.hmsActions?.attachAudio === 'function') {
                try {
                    this.sdk.hmsActions.attachAudio(track.id || trackId, element);
                    element.dataset.trackId = track.id || trackId || '';
                    this.logDebug(`Attached ${label} audio via HMS attachAudio`, trackId);
                    return;
                } catch (hmsError) {
                    this.logWarn('HMS attachAudio failed, falling back to manual stream', hmsError);
                }
            }

            // Fallback: manual stream attachment
            const media = this.getTrackMedia(track, 'audio', label);
            if (!media) {
                this.logDebug('Audio media unavailable yet', trackId);
                this.scheduleTrackRetry('audio', trackRef, () => this.safeAttachAudio(trackRef, element, label));
                return;
            }

            const { stream, mediaTrack } = media;
            if (!stream || !mediaTrack) {
                this.logDebug('Audio media incomplete', { trackId, hasStream: !!stream, hasTrack: !!mediaTrack });
                this.scheduleTrackRetry('audio', trackRef, () => this.safeAttachAudio(trackRef, element, label));
                return;
            }

            if (element.dataset.trackId === (track.id || trackId) && element.srcObject === stream) {
                return;
            }

            element.srcObject = stream;
            element.dataset.trackId = track.id || trackId || '';
            element.autoplay = true;
            element.playsInline = true;
            element.muted = label === 'local';
            element.volume = 1.0;
            element.play?.().catch(err => this.logWarn('Audio play() failed', err));
            this.logDebug(`Attached ${label} audio track`, {
                trackId: track.id || trackId,
                label,
                readyState: mediaTrack.readyState,
                enabled: mediaTrack.enabled
            });
        } catch (error) {
            this.logError(`Failed to attach ${label} audio`, error);
            this.scheduleTrackRetry('audio', trackRef, () => this.safeAttachAudio(trackRef, element, label), true);
        }
    }

    getTrackMedia(track, type = 'video', label = 'remote') {
        if (!track) {
            return null;
        }

        const isVideo = type === 'video';
        const matchesKind = mediaTrack => !!mediaTrack && mediaTrack.kind === type && mediaTrack.readyState === 'live';

        const candidates = [];
        const pushCandidate = (stream, mediaTrack) => {
            if (!stream || !mediaTrack || !matchesKind(mediaTrack)) {
                return;
            }
            candidates.push({ stream, mediaTrack });
        };

        const ensureStream = mediaTrack => {
            if (!matchesKind(mediaTrack)) return;
            pushCandidate(new MediaStream([mediaTrack]), mediaTrack);
        };

        const inspectStream = stream => {
            if (!(stream instanceof MediaStream)) return;
            const tracks = isVideo ? stream.getVideoTracks() : stream.getAudioTracks();
            if (!tracks || tracks.length === 0) return;
            pushCandidate(stream, tracks[0]);
        };

        ensureStream(track.nativeTrack || track.track || track.sourceTrack || track.mediaStreamTrack);
        inspectStream(track.stream);
        inspectStream(track.mediaStream);
        inspectStream(track.nativeStream);

        const resolvedId = track.id || track.trackId || track.streamId;
        if (resolvedId && this.sdk?.hmsStore) {
            try {
                const state = this.sdk.hmsStore.getState(s => s);
                const collections = [state?.videoTracks, state?.audioTracks, state?.tracks];
                for (const collection of collections) {
                    if (!collection) continue;
                    const entry = typeof collection.get === 'function'
                        ? collection.get(resolvedId)
                        : collection?.[resolvedId];
                    if (!entry) continue;
                    ensureStream(entry.nativeTrack || entry.track || entry.sourceTrack || entry.mediaStreamTrack);
                    inspectStream(entry.stream);
                    inspectStream(entry.mediaStream);
                    inspectStream(entry.nativeStream);
                }
            } catch (error) {
                this.logWarn('Failed to inspect HMS store for track media', error);
            }
        }

        if (label === 'local') {
            inspectStream(this.localVideoEl?.srcObject);
            inspectStream(this.previewStream);
        }

        for (const candidate of candidates) {
            if (candidate?.stream && candidate?.mediaTrack) {
                return candidate;
            }
        }

        return null;
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
            this.refreshNotetakerStatus(true);
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
                const payload = { room_id: this.sdk.hmsRoomId };
                if (this.latestLocalRecordingId) {
                    payload.recording_asset_id = this.latestLocalRecordingId;
                }
                await fetch('/api/notetaker/stop', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    credentials: 'include',
                    body: JSON.stringify(payload)
                });
                this.latestLocalRecordingId = null;
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
        this.refreshNotetakerStatus(true);
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
                this.notetakerStartBtn.dataset.active = 'false';
                this.notetakerPauseBtn.dataset.active = 'true';
                this.notetakerStopBtn.dataset.active = 'true';
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
                this.notetakerStartBtn.dataset.active = 'false';
                this.notetakerPauseBtn.dataset.active = 'true';
                this.notetakerStopBtn.dataset.active = 'true';
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
                this.notetakerStartBtn.dataset.active = 'true';
                this.notetakerPauseBtn.dataset.active = 'false';
                this.notetakerStopBtn.dataset.active = 'false';
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
        this.ensureNotetakerTimerRunning();
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

    ensureNotetakerTimerRunning() {
        if (this.notetakerPaused || !this.notetakerStartTimestamp) {
            if (this.notetakerInterval) {
                clearInterval(this.notetakerInterval);
                this.notetakerInterval = null;
            }
            return;
        }

        if (!this.notetakerInterval) {
            this.notetakerInterval = setInterval(() => this.updateNotetakerTimer(), 1000);
        }
        this.updateNotetakerTimer();
    }

    startCallTimer() {
        if (this.callTimerInterval) {
            return;
        }
        this.callStartTime = Date.now();
        this.callTimerInterval = setInterval(() => {
            if (!this.callTimerEl || !this.callStartTime) {
                return;
            }
            const elapsed = Date.now() - this.callStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            if (hours > 0) {
                this.callTimerEl.textContent = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                this.callTimerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
        this.logDebug('Call timer started');
    }

    stopCallTimer() {
        if (this.callTimerInterval) {
            clearInterval(this.callTimerInterval);
            this.callTimerInterval = null;
        }
        this.callStartTime = null;
        if (this.callTimerEl) {
            this.callTimerEl.textContent = '00:00';
        }
        this.logDebug('Call timer stopped');
    }

    startNotetakerStatusPolling() {
        if (!this.isHost || this.notetakerStatusPoll) {
            return;
        }
        this.notetakerStatusPoll = setInterval(() => {
            this.refreshNotetakerStatus(false);
        }, 5000);
        this.logDebug('Notetaker status polling started');
    }

    stopNotetakerStatusPolling() {
        if (this.notetakerStatusPoll) {
            clearInterval(this.notetakerStatusPoll);
            this.notetakerStatusPoll = null;
        }
        this.logDebug('Notetaker status polling stopped');
    }

    async refreshNotetakerStatus(force = false) {
        if (!this.isHost || !this.sdk?.hmsRoomId) {
            return;
        }
        try {
            const res = await fetch(`/api/notetaker/status?room_id=${this.sdk.hmsRoomId}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.active && !this.notetakerStartTimestamp) {
                    this.notetakerStartTimestamp = Date.now() - (data.elapsed_seconds || 0) * 1000;
                    this.updateNotetakerUI('recording');
                    this.ensureNotetakerTimerRunning();
                } else if (!data.active && this.notetakerStartTimestamp) {
                    this.notetakerStartTimestamp = null;
                    this.updateNotetakerUI('stopped');
                }
            }
        } catch (error) {
            if (force) {
                this.logError('Failed to refresh notetaker status', error);
            }
        }
    }

    toggleChatPanel() {
        if (!this.chatPanel) return;
        const isHidden = this.chatPanel.classList.contains('hidden');
        if (isHidden) {
            this.chatPanel.classList.remove('hidden');
            this.chatPanel.style.display = 'flex';
            if (this.chatBtn) {
                this.chatBtn.classList.add('active');
                this.chatBtn.dataset.active = 'true';
            }
            if (this.chatBadge) {
                this.chatBadge.style.display = 'none';
                this.chatBadge.textContent = '0';
            }
        } else {
            this.chatPanel.classList.add('hidden');
            this.chatPanel.style.display = 'none';
            if (this.chatBtn) {
                this.chatBtn.classList.remove('active');
                this.chatBtn.dataset.active = 'false';
            }
        }
        this.logDebug('Chat panel toggled', !isHidden);
    }

    togglePollModal() {
        if (!this.pollModal) return;
        const isVisible = this.pollModal.classList.contains('visible');
        if (isVisible) {
            this.pollModal.classList.remove('visible');
            this.pollModal.style.display = 'none';
            if (this.pollBtn) {
                this.pollBtn.classList.remove('active');
                this.pollBtn.dataset.active = 'false';
            }
        } else {
            this.pollModal.classList.add('visible');
            this.pollModal.style.display = 'flex';
            if (this.pollBtn) {
                this.pollBtn.classList.add('active');
                this.pollBtn.dataset.active = 'true';
            }
        }
        this.logDebug('Poll modal toggled', !isVisible);
    }

    toggleWhiteboard() {
        if (!this.whiteboardContainer) return;
        const isVisible = this.whiteboardContainer.classList.contains('visible');
        if (isVisible) {
            this.whiteboardContainer.classList.remove('visible');
            this.whiteboardContainer.style.display = 'none';
            if (this.whiteboardBtn) {
                this.whiteboardBtn.classList.remove('active');
                this.whiteboardBtn.dataset.active = 'false';
            }
        } else {
            this.whiteboardContainer.classList.add('visible');
            this.whiteboardContainer.style.display = 'flex';
            if (this.whiteboardBtn) {
                this.whiteboardBtn.classList.add('active');
                this.whiteboardBtn.dataset.active = 'true';
            }
        }
        this.logDebug('Whiteboard toggled', !isVisible);
    }

    async toggleRecording() {
        if (!this.isHost) {
            alert('Only the host can start/stop recording');
            return;
        }

        this.isRecording = !this.isRecording;

        if (this.isRecording) {
            try {
                this.recordingMode = 'local';
                await this.startLocalRecording();
                this.applyRecordingUI(true, this.recordingMode);
                this.logDebug('Recording started', this.recordingMode);
            } catch (error) {
                this.isRecording = false;
                this.recordingMode = null;
                this.applyRecordingUI(false);
                this.logError('Recording start failed', error);
                alert('Failed to start recording: ' + error.message);
            }
        } else {
            try {
                if (this.recordingMode === 'local') {
                    await this.stopLocalRecording();
                }
                this.applyRecordingUI(false);
                this.recordingMode = null;
                this.logDebug('Recording stopped');
            } catch (error) {
                this.logError('Recording stop failed', error);
                alert('Failed to stop recording: ' + error.message);
            }
        }
    }

    toggleReactions() {
        const panel = this.reactionsFloatingPanel || this.reactionsPanel;
        if (!panel) return;

        const isVisible = panel.style.display !== 'none' && panel.style.display !== '';
        if (isVisible) {
            panel.style.display = 'none';
            if (this.reactionsBtn) {
                this.reactionsBtn.classList.remove('active');
                this.reactionsBtn.dataset.active = 'false';
            }
        } else {
            panel.style.display = 'flex';
            if (this.reactionsBtn) {
                this.reactionsBtn.classList.add('active');
                this.reactionsBtn.dataset.active = 'true';
            }
        }
        this.logDebug('Reactions panel toggled', !isVisible);
    }

    setupReactionButtons() {
        const reactionButtons = document.querySelectorAll('.reaction-btn, .reaction-quick-btn');
        reactionButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const reaction = btn.dataset.reaction;
                if (reaction && this.sdk) {
                    try {
                        await this.sdk.sendMessage(`REACTION::${reaction}`);
                        this.showReactionOverlay(reaction, 'You');
                        // Auto-hide floating panel after selection
                        if (this.reactionsFloatingPanel) {
                            this.reactionsFloatingPanel.style.display = 'none';
                        }
                        if (this.reactionsBtn) {
                            this.reactionsBtn.classList.remove('active');
                            this.reactionsBtn.dataset.active = 'false';
                        }
                    } catch (error) {
                        this.logError('Failed to send reaction', error);
                    }
                }
            });
        });
    }

    showReactionOverlay(reaction, sender) {
        // Create floating animated reaction
        this.createFloatingReaction(reaction);

        // Also show in overlay
        if (!this.reactionOverlay) return;
        this.reactionOverlay.textContent = reaction;
        this.reactionOverlay.classList.add('visible');
        if (this.reactionTimeout) {
            clearTimeout(this.reactionTimeout);
        }
        this.reactionTimeout = setTimeout(() => {
            if (this.reactionOverlay) {
                this.reactionOverlay.classList.remove('visible');
                this.reactionOverlay.textContent = '';
            }
        }, 3000);
        this.logDebug('Reaction overlay shown', { reaction, sender });
    }

    createFloatingReaction(emoji) {
        const el = document.createElement('div');
        el.className = 'floating-reaction';
        el.textContent = emoji;

        // Random horizontal position (center area)
        const centerX = window.innerWidth / 2;
        const randomX = centerX + (Math.random() - 0.5) * 300;
        el.style.left = randomX + 'px';
        el.style.bottom = '20%';

        // Random animation speed
        const speeds = ['fast', '', 'slow'];
        el.classList.add(speeds[Math.floor(Math.random() * speeds.length)]);

        document.body.appendChild(el);

        // Remove after animation
        setTimeout(() => {
            el.remove();
        }, 4000);
    }

    disableHostOnlyControls() {
        const hostOnlyButtons = [
            this.recordBtn,
            this.notetakerStartBtn,
            this.notetakerPauseBtn,
            this.notetakerStopBtn
        ];
        hostOnlyButtons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        });
        this.logDebug('Host-only controls disabled');
    }

    isTrackEnabled(trackRef) {
        if (!trackRef) return false;
        const { track } = this.resolveTrack(trackRef);
        if (!track) return false;
        if (typeof track.enabled === 'boolean') return track.enabled;
        const nativeTrack = track.nativeTrack || track.track || track.mediaStreamTrack;
        if (nativeTrack && typeof nativeTrack.enabled === 'boolean') {
            return nativeTrack.enabled && nativeTrack.readyState === 'live';
        }
        return false;
    }

    scheduleTrackRetry(type, trackRef, callback, isError = false) {
        const key = (trackRef && trackRef.id) || JSON.stringify(trackRef);
        const map = type === 'video' ? this.trackRetryTimers.video : this.trackRetryTimers.audio;

        if (map.has(key)) {
            return;
        }

        const delay = isError ? 2000 : 500;
        const timeoutId = setTimeout(() => {
            map.delete(key);
            if (typeof callback === 'function') {
                callback();
            }
        }, delay);

        map.set(key, timeoutId);
        this.logDebug(`Scheduled ${type} retry for track`, key);
    }

    clearTrackRetry(type, trackRef) {
        const key = (trackRef && trackRef.id) || JSON.stringify(trackRef);
        const map = type === 'video' ? this.trackRetryTimers.video : this.trackRetryTimers.audio;

        if (map.has(key)) {
            clearTimeout(map.get(key));
            map.delete(key);
            this.logDebug(`Cleared ${type} retry for track`, key);
        }
    }

    logInfo(...args) {
        console.info('[UI Controller][INFO]', ...args);
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
