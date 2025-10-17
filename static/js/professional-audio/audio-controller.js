/**
 * Professional Audio Call Controller
 * Uses HMS SDK for WebRTC audio-only calls with beautiful animations
 */

class AudioCallController {
    constructor() {
        // DOM Elements
        this.loadingScreen = document.getElementById('loadingScreen');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.audioContainer = document.getElementById('audioCallContainer');

        // Top bar
        this.callDurationEl = document.getElementById('callDuration');
        this.connectionStatusEl = document.getElementById('connectionStatus');

        // Avatars
        this.localAvatar = document.querySelector('.local-avatar');
        this.remoteAvatar = document.getElementById('remoteAvatar');
        this.localInitial = document.getElementById('localInitial');
        this.remoteInitial = document.getElementById('remoteInitial');
        this.localName = document.getElementById('localName');
        this.remoteName = document.getElementById('remoteName');
        this.localMicIcon = document.getElementById('localMicIcon');
        this.remoteStatus = document.getElementById('remoteStatus');
        this.localAudioRing = document.getElementById('localAudioRing');
        this.remoteAudioRing = document.getElementById('remoteAudioRing');

        // Visualizer
        this.centerVisualizer = document.getElementById('centerVisualizer');
        this.waitingMessage = document.getElementById('waitingMessage');

        // Controls
        this.micBtn = document.getElementById('micBtn');
        this.speakerBtn = document.getElementById('speakerBtn');
        this.leaveBtn = document.getElementById('leaveBtn');
        this.settingsBtn = document.getElementById('settingsBtn');

        // Audio elements
        this.localAudioEl = document.getElementById('localAudio');
        this.remoteAudioEl = document.getElementById('remoteAudio');

        // State
        this.sdk = null;
        this.isHost = false;
        this.roomCode = null;
        this.userName = 'User';
        this.isAudioEnabled = true;
        this.isSpeakerEnabled = true;
        this.callStartTime = null;
        this.callDurationInterval = null;
        this.audioAnalysisInterval = null;
        this.remoteUserJoined = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('[Audio Controller] Initialized');
    }

    setupEventListeners() {
        this.micBtn?.addEventListener('click', () => this.toggleMic());
        this.speakerBtn?.addEventListener('click', () => this.toggleSpeaker());
        this.leaveBtn?.addEventListener('click', () => this.leaveCall());
        this.settingsBtn?.addEventListener('click', () => this.openSettings());
    }

    async initializeAsHost(inviteCode = null) {
        console.log('[Audio Controller] Initializing as HOST');
        this.isHost = true;

        try {
            this.showLoading('Creating audio room...');

            // Create HMS SDK instance
            this.sdk = new ProfessionalMeetingSDK();
            window.__AUDIO_SDK__ = this.sdk;

            // Initialize as host
            const result = await this.sdk.initAsHost('Oleh', inviteCode ? { inviteCode } : {});
            this.roomCode = this.sdk.roomCode || result.roomId;
            this.userName = 'Oleh';

            console.log('[Audio Controller] Room created:', this.roomCode);

            await this.joinRoom();

        } catch (error) {
            console.error('[Audio Controller] Host initialization failed:', error);
            alert('Failed to create audio room: ' + error.message);
            window.location.href = '/home';
        }
    }

    async initializeAsGuest(roomCode, userName) {
        console.log('[Audio Controller] Initializing as GUEST');
        this.isHost = false;
        this.roomCode = roomCode;
        this.userName = userName || 'Guest';

        try {
            this.showLoading('Joining audio call...');

            // Create HMS SDK instance
            this.sdk = new ProfessionalMeetingSDK();
            window.__AUDIO_SDK__ = this.sdk;

            // Initialize as guest
            await this.sdk.initAsGuest(roomCode, this.userName);

            console.log('[Audio Controller] Joining room:', roomCode);

            await this.joinRoom();

        } catch (error) {
            console.error('[Audio Controller] Guest initialization failed:', error);
            alert('Failed to join audio call: ' + error.message);
            window.location.href = '/';
        }
    }

    async joinRoom() {
        try {
            this.showLoading('Connecting...');

            // Join with audio only
            await this.sdk.joinRoom({
                userName: this.userName,
                audioEnabled: true,
                videoEnabled: false
            });

            console.log('[Audio Controller] Joined successfully');

            // Setup UI
            this.setupAudioUI();
            this.subscribeToRoomUpdates();
            this.startCallDuration();
            this.startAudioAnalysis();

            this.hideLoading();
            this.showAudioUI();

        } catch (error) {
            console.error('[Audio Controller] Failed to join room:', error);
            alert('Failed to join call: ' + error.message);
            window.location.href = this.isHost ? '/home' : '/';
        }
    }

    setupAudioUI() {
        // Set local user info
        if (this.localName) {
            this.localName.textContent = this.userName;
        }
        if (this.localInitial) {
            this.localInitial.textContent = this.userName.charAt(0).toUpperCase();
        }

        // Mic button state
        if (this.micBtn) {
            this.micBtn.dataset.active = 'true';
        }
    }

    subscribeToRoomUpdates() {
        if (!this.sdk?.hmsStore) return;

        // Subscribe to remote peers
        this.sdk.hmsStore.subscribe((peers) => {
            const remotePeers = peers.filter(peer => !peer.isLocal);

            if (remotePeers.length > 0 && !this.remoteUserJoined) {
                this.remoteUserJoined = true;
                this.onRemoteUserJoined(remotePeers[0]);
            } else if (remotePeers.length === 0 && this.remoteUserJoined) {
                this.remoteUserJoined = false;
                this.onRemoteUserLeft();
            }

            // Update remote peer audio track
            if (remotePeers.length > 0) {
                const remotePeer = remotePeers[0];
                if (remotePeer.audioTrack) {
                    this.attachRemoteAudio(remotePeer.audioTrack);
                }

                // Update mic status
                this.updateRemoteMicStatus(remotePeer.audioEnabled);
            }
        }, this.sdk.selectRemotePeers);

        console.log('[Audio Controller] Subscribed to room updates');
    }

    onRemoteUserJoined(peer) {
        console.log('[Audio Controller] Remote user joined:', peer.name);

        if (this.waitingMessage) {
            this.waitingMessage.style.display = 'none';
        }

        if (this.remoteAvatar) {
            this.remoteAvatar.style.display = 'flex';
        }

        if (this.remoteName) {
            this.remoteName.textContent = peer.name || 'Guest';
        }

        if (this.remoteInitial) {
            this.remoteInitial.textContent = (peer.name || 'Guest').charAt(0).toUpperCase();
        }

        // Animate in
        setTimeout(() => {
            if (this.remoteAvatar) {
                this.remoteAvatar.style.animation = 'fadeInUp 0.6s ease-out';
            }
        }, 100);
    }

    onRemoteUserLeft() {
        console.log('[Audio Controller] Remote user left');

        if (this.remoteAvatar) {
            this.remoteAvatar.style.display = 'none';
        }

        if (this.waitingMessage) {
            this.waitingMessage.style.display = 'block';
        }
    }

    attachRemoteAudio(audioTrack) {
        if (!this.remoteAudioEl || !audioTrack) return;

        try {
            // Try HMS SDK method first
            if (this.sdk?.hmsActions?.attachAudio) {
                this.sdk.hmsActions.attachAudio(audioTrack.id, this.remoteAudioEl);
                console.log('[Audio Controller] Remote audio attached via HMS');
            } else {
                // Fallback: manual stream attachment
                const stream = new MediaStream([audioTrack]);
                this.remoteAudioEl.srcObject = stream;
                this.remoteAudioEl.play().catch(err => {
                    console.warn('[Audio Controller] Remote audio play failed:', err);
                });
                console.log('[Audio Controller] Remote audio attached manually');
            }
        } catch (error) {
            console.error('[Audio Controller] Failed to attach remote audio:', error);
        }
    }

    updateRemoteMicStatus(isEnabled) {
        if (!this.remoteStatus) return;

        const micIcon = this.remoteStatus.querySelector('.mic-icon');
        if (micIcon) {
            micIcon.textContent = isEnabled ? '🎤' : '🔇';
        }
    }

    async toggleMic() {
        if (!this.sdk) return;

        try {
            this.micBtn.disabled = true;

            const newState = await this.sdk.toggleAudio();
            this.isAudioEnabled = newState;

            // Update UI
            if (this.micBtn) {
                this.micBtn.dataset.active = newState ? 'true' : 'false';
                const iconOn = this.micBtn.querySelector('.icon-on');
                const iconOff = this.micBtn.querySelector('.icon-off');
                if (iconOn && iconOff) {
                    iconOn.style.display = newState ? 'block' : 'none';
                    iconOff.style.display = newState ? 'none' : 'block';
                }
            }

            if (this.localMicIcon) {
                this.localMicIcon.textContent = newState ? '🎤' : '🔇';
            }

            console.log('[Audio Controller] Mic toggled:', newState);

        } catch (error) {
            console.error('[Audio Controller] Mic toggle failed:', error);
        } finally {
            this.micBtn.disabled = false;
        }
    }

    toggleSpeaker() {
        this.isSpeakerEnabled = !this.isSpeakerEnabled;

        if (this.remoteAudioEl) {
            this.remoteAudioEl.volume = this.isSpeakerEnabled ? 1.0 : 0.0;
        }

        if (this.speakerBtn) {
            this.speakerBtn.style.opacity = this.isSpeakerEnabled ? '1' : '0.5';
        }

        console.log('[Audio Controller] Speaker toggled:', this.isSpeakerEnabled);
    }

    async leaveCall() {
        try {
            console.log('[Audio Controller] Leaving call');

            this.stopCallDuration();
            this.stopAudioAnalysis();

            if (this.sdk) {
                await this.sdk.leaveRoom();
            }

            window.location.href = this.isHost ? '/home' : '/';

        } catch (error) {
            console.error('[Audio Controller] Leave call failed:', error);
            window.location.href = this.isHost ? '/home' : '/';
        }
    }

    openSettings() {
        alert('Settings panel - coming soon!');
    }

    startCallDuration() {
        this.callStartTime = Date.now();
        this.callDurationInterval = setInterval(() => {
            const elapsed = Date.now() - this.callStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            const formatted = hours > 0
                ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (this.callDurationEl) {
                this.callDurationEl.textContent = formatted;
            }
        }, 1000);
    }

    stopCallDuration() {
        if (this.callDurationInterval) {
            clearInterval(this.callDurationInterval);
            this.callDurationInterval = null;
        }
    }

    startAudioAnalysis() {
        // Animate visualizer bars based on audio activity
        let localSpeaking = false;
        let remoteSpeaking = false;

        this.audioAnalysisInterval = setInterval(() => {
            // Simulate audio activity (in real app, use Web Audio API)
            const isLocalActive = this.isAudioEnabled && Math.random() > 0.7;
            const isRemoteActive = this.remoteUserJoined && Math.random() > 0.7;

            // Update local avatar
            if (isLocalActive !== localSpeaking) {
                localSpeaking = isLocalActive;
                if (this.localAvatar) {
                    this.localAvatar.classList.toggle('speaking', localSpeaking);
                }
            }

            // Update remote avatar
            if (isRemoteActive !== remoteSpeaking) {
                remoteSpeaking = isRemoteActive;
                if (this.remoteAvatar) {
                    this.remoteAvatar.classList.toggle('speaking', remoteSpeaking);
                }
            }

            // Update center visualizer
            if (this.centerVisualizer) {
                this.centerVisualizer.classList.toggle('active', localSpeaking || remoteSpeaking);
            }
        }, 500);
    }

    stopAudioAnalysis() {
        if (this.audioAnalysisInterval) {
            clearInterval(this.audioAnalysisInterval);
            this.audioAnalysisInterval = null;
        }
    }

    showLoading(message) {
        if (this.loadingMessage) {
            this.loadingMessage.textContent = message;
        }
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingScreen) {
            this.loadingScreen.style.display = 'none';
        }
    }

    showAudioUI() {
        if (this.audioContainer) {
            this.audioContainer.style.display = 'flex';
        }
    }
}
