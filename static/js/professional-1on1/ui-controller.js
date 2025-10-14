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

        console.log('[UI Controller] Initialized');
    }

    /**
     * Initialize as HOST
     */
    async initializeAsHost() {
        console.log('[UI Controller] Initializing as HOST');
        this.isHost = true;

        try {
            // Show loading
            this.showLoading('Creating professional room...');
            this.updateStep(1);

            // Create SDK instance
            this.sdk = new ProfessionalMeetingSDK();

            // Initialize as host
            const result = await this.sdk.initAsHost('Oleh');
            this.roomCode = result.roomId;

            this.updateStep(2);
            this.showLoading('Setting up video...');

            // Join room
            await this.sdk.joinRoom();

            this.updateStep(3);
            this.showLoading('Activating AI features...');

            // Setup UI
            await this.setupVideoUI();
            this.setupEventListeners();
            this.subscribeToRoomUpdates();

            // Show share link
            this.showShareLink(result.shareLink);

            // Show call UI
            setTimeout(() => {
                this.hideLoading();
                this.showCallUI();
            }, 500);

            console.log('[UI Controller] ✅ Host initialized successfully');

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
            // Show loading
            this.showLoading('Joining meeting...');
            this.updateStep(1);

            // Create SDK instance
            this.sdk = new ProfessionalMeetingSDK();

            // Initialize as guest
            await this.sdk.initAsGuest(roomCode, userName);

            this.updateStep(2);
            this.showLoading('Setting up video...');

            // Join room
            await this.sdk.joinRoom();

            this.updateStep(3);

            // Setup UI
            await this.setupVideoUI();
            this.setupEventListeners();
            this.subscribeToRoomUpdates();

            // Hide AI panel for guests
            if (this.aiPanel) {
                this.aiPanel.style.display = 'none';
            }

            // Show call UI
            setTimeout(() => {
                this.hideLoading();
                this.showCallUI();
            }, 500);

            console.log('[UI Controller] ✅ Guest initialized successfully');

        } catch (error) {
            console.error('[UI Controller] ❌ Guest initialization failed:', error);
            alert('Failed to join room: ' + error.message);
            window.location.href = '/';
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
