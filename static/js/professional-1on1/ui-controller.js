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

        // Video containers
        this.videoContainer = document.querySelector('.video-container');
        this.localVideoEl = null;
        this.remoteVideoEl = null;

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

        console.log('[UI Controller] Initialized');
    }

    /**
     * Initialize as HOST
     */
    async initializeAsHost() {
        console.log('[UI Controller] Initializing as HOST');
        this.isHost = true;

        try {
            this.showLoading('Creating professional room...');
            this.updateStep(1);

            // Create SDK instance
            this.sdk = new ProfessionalMeetingSDK();

            // Initialize as host
            const result = await this.sdk.initAsHost('Oleh');
            this.roomCode = result.roomId;
            this.pendingShareLink = result.shareLink;

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

        try {
            this.showLoading('Joining meeting...');
            this.updateStep(1);

            // Create SDK instance
            this.sdk = new ProfessionalMeetingSDK();

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

        // Create video elements if not exist
        if (!this.videoContainer) {
            console.error('[UI Controller] Video container not found');
            return;
        }

        // Clear existing videos
        this.videoContainer.innerHTML = '';

        // Subscribe to track updates
        this.sdk.hmsStore.subscribe(this.onTrackUpdate.bind(this), state => state.peers);
    }

    /**
     * Handle track updates - render video/audio
     */
    onTrackUpdate(peers) {
        console.log('[UI Controller] Track update, peers:', Object.keys(peers).length);

        Object.values(peers).forEach(peer => {
            // Get or create video element for this peer
            let videoEl = document.getElementById(`video-${peer.id}`);

            if (!videoEl) {
                videoEl = document.createElement('div');
                videoEl.id = `video-${peer.id}`;
                videoEl.className = peer.isLocal ? 'local-video' : 'remote-video';

                const video = document.createElement('video');
                video.autoplay = true;
                video.playsInline = true;
                video.muted = peer.isLocal; // Mute local to avoid echo

                videoEl.appendChild(video);
                this.videoContainer.appendChild(videoEl);

                console.log('[UI Controller] Created video element for peer:', peer.name);
            }

            // Attach video track
            if (peer.videoTrack) {
                const video = videoEl.querySelector('video');
                this.sdk.hmsActions.attachVideo(peer.videoTrack, video);
            }

            // Attach audio track
            if (peer.audioTrack && !peer.isLocal) {
                const audio = document.createElement('audio');
                audio.autoplay = true;
                this.sdk.hmsActions.attachAudio(peer.audioTrack, audio);
            }
        });
    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        // Mic toggle
        if (this.micBtn) {
            this.micBtn.addEventListener('click', async () => {
                const enabled = await this.sdk.toggleAudio();
                this.micBtn.classList.toggle('active', enabled);
                console.log('[UI Controller] Mic:', enabled ? 'ON' : 'OFF');
            });
        }

        // Camera toggle
        if (this.cameraBtn) {
            this.cameraBtn.addEventListener('click', async () => {
                const enabled = await this.sdk.toggleVideo();
                this.cameraBtn.classList.toggle('active', enabled);
                console.log('[UI Controller] Camera:', enabled ? 'ON' : 'OFF');
            });
        }

        // Chat send
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && this.chatInput.value.trim()) {
                    await this.sdk.sendMessage(this.chatInput.value.trim());
                    this.chatInput.value = '';
                }
            });
        }

        // Leave call
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.leaveCall());
        }

        console.log('[UI Controller] Event listeners attached');
    }

    /**
     * Subscribe to room updates (peers, messages, etc)
     */
    subscribeToRoomUpdates() {
        // Subscribe to messages
        this.sdk.hmsStore.subscribe(this.onMessage.bind(this), state => state.messages);

        // Subscribe to peers for participant count
        this.sdk.hmsStore.subscribe(this.onPeersUpdate.bind(this), state => state.peers);

        console.log('[UI Controller] Subscribed to room updates');
    }

    /**
     * Handle chat messages
     */
    onMessage(messages) {
        if (!messages || messages.length === 0) return;

        messages.forEach(msg => {
            this.addChatMessage(msg.senderName, msg.message, msg.time);
        });
    }

    /**
     * Handle peer updates
     */
    onPeersUpdate(peers) {
        const peerCount = Object.keys(peers).length;
        const participantLabel = document.querySelector('.participant-name');

        if (participantLabel) {
            if (peerCount <= 1) {
                participantLabel.textContent = 'Waiting for guest...';
            } else {
                const remotePeers = Object.values(peers).filter(p => !p.isLocal);
                if (remotePeers.length > 0) {
                    participantLabel.textContent = remotePeers[0].name;
                }
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
        // TODO: Show modal with share link
        console.log('[UI Controller] Share link:', shareLink);
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
        if (this.callContainer) {
            this.callContainer.style.display = 'flex';
        }
    }

    /**
     * Leave call
     */
    async leaveCall() {
        if (confirm('Are you sure you want to leave the call?')) {
            await this.sdk.leaveRoom();
            window.location.href = this.isHost ? '/home' : '/';
        }
    }
}

// Export for global use
window.ProfessionalUIController = ProfessionalUIController;
console.log('[UI Controller] ✅ ProfessionalUIController loaded');
