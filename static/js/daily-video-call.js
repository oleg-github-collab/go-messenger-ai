/**
 * Daily.co Video Call Integration
 * Handles group video calls using Daily.co embedded iframe
 */

class DailyVideoCall {
    constructor(config) {
        this.roomUrl = config.roomUrl;
        this.userName = config.userName || 'Guest';
        this.isHost = config.isHost || false;
        this.callFrame = null;
        this.participants = new Map();
        this.eventHandlers = {
            joined: [],
            left: [],
            participantJoined: [],
            participantLeft: [],
            error: []
        };
    }

    /**
     * Join the Daily.co call
     * @param {HTMLElement} container - Container element for the call frame
     */
    async join(container) {
        try {
            console.log('[DAILY] Joining call:', this.roomUrl);

            // Load Daily.co SDK if not already loaded
            if (!window.DailyIframe) {
                await this.loadDailySDK();
            }

            // Create call frame
            this.callFrame = window.DailyIframe.createFrame(container, {
                iframeStyle: {
                    width: '100%',
                    height: '100%',
                    border: '0',
                    borderRadius: '8px'
                },
                showLeaveButton: true,
                showFullscreenButton: true,
                showLocalVideo: true,
                showParticipantsBar: true,
                theme: {
                    colors: {
                        accent: '#4ECDC4',
                        accentText: '#FFFFFF',
                        background: '#1a1a2e',
                        backgroundAccent: '#16213e',
                        baseText: '#FFFFFF',
                        border: '#0f3460',
                        mainAreaBg: '#0f3460',
                        mainAreaBgAccent: '#16213e',
                        mainAreaText: '#FFFFFF',
                        supportiveText: '#94a1b2'
                    }
                }
            });

            // Setup event listeners BEFORE joining
            this.setupEventListeners();

            // Join the call
            await this.callFrame.join({
                url: this.roomUrl,
                userName: this.userName
            });

            console.log('[DAILY] ✅ Joined successfully');

            return this.callFrame;
        } catch (error) {
            console.error('[DAILY] ❌ Failed to join:', error);
            this.triggerEvent('error', { error: error.message });
            throw error;
        }
    }

    /**
     * Load Daily.co SDK from CDN
     */
    loadDailySDK() {
        return new Promise((resolve, reject) => {
            if (window.DailyIframe) {
                resolve();
                return;
            }

            console.log('[DAILY] Loading SDK...');

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@daily-co/daily-js';
            script.onload = () => {
                console.log('[DAILY] ✅ SDK loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('[DAILY] ❌ Failed to load SDK');
                reject(new Error('Failed to load Daily.co SDK'));
            };
            document.head.appendChild(script);
        });
    }

    /**
     * Setup event listeners for call events
     */
    setupEventListeners() {
        this.callFrame
            .on('joined-meeting', (event) => {
                console.log('[DAILY] 👤 Joined meeting:', event);
                this.participants.set(event.participants.local.session_id, {
                    ...event.participants.local,
                    isLocal: true
                });
                this.triggerEvent('joined', event);
            })
            .on('participant-joined', (event) => {
                console.log('[DAILY] 👥 Participant joined:', event.participant);
                this.participants.set(event.participant.session_id, {
                    ...event.participant,
                    isLocal: false
                });
                this.triggerEvent('participantJoined', event.participant);
            })
            .on('participant-left', (event) => {
                console.log('[DAILY] 👋 Participant left:', event.participant);
                this.participants.delete(event.participant.session_id);
                this.triggerEvent('participantLeft', event.participant);
            })
            .on('left-meeting', (event) => {
                console.log('[DAILY] 🚪 Left meeting');
                this.participants.clear();
                this.triggerEvent('left', event);
            })
            .on('error', (event) => {
                console.error('[DAILY] ❌ Error:', event);
                this.triggerEvent('error', event);
            })
            .on('recording-started', (event) => {
                console.log('[DAILY] 🔴 Recording started');
                this.showNotification('Recording started', 'info');
            })
            .on('recording-stopped', (event) => {
                console.log('[DAILY] ⏹️ Recording stopped');
                this.showNotification('Recording stopped', 'info');
            })
            .on('track-started', (event) => {
                console.log('[DAILY] 🎥 Track started:', event.participant?.user_name, event.track);
            })
            .on('track-stopped', (event) => {
                console.log('[DAILY] 🎥 Track stopped:', event.participant?.user_name, event.track);
            });
    }

    /**
     * Leave the call
     */
    async leave() {
        if (this.callFrame) {
            try {
                await this.callFrame.leave();
                this.callFrame.destroy();
                this.callFrame = null;
                console.log('[DAILY] ✅ Left and destroyed call frame');
            } catch (error) {
                console.error('[DAILY] ❌ Error leaving call:', error);
            }
        }
    }

    /**
     * Toggle local camera
     */
    async toggleCamera() {
        if (!this.callFrame) return false;

        try {
            const current = this.callFrame.localVideo();
            await this.callFrame.setLocalVideo(!current);
            console.log('[DAILY] 📹 Camera:', !current ? 'ON' : 'OFF');
            return !current;
        } catch (error) {
            console.error('[DAILY] ❌ Error toggling camera:', error);
            return null;
        }
    }

    /**
     * Toggle local microphone
     */
    async toggleMicrophone() {
        if (!this.callFrame) return false;

        try {
            const current = this.callFrame.localAudio();
            await this.callFrame.setLocalAudio(!current);
            console.log('[DAILY] 🎤 Microphone:', !current ? 'ON' : 'OFF');
            return !current;
        } catch (error) {
            console.error('[DAILY] ❌ Error toggling microphone:', error);
            return null;
        }
    }

    /**
     * Start screen sharing
     */
    async startScreenShare() {
        if (!this.callFrame) return;

        try {
            await this.callFrame.startScreenShare();
            console.log('[DAILY] 🖥️ Screen share started');
        } catch (error) {
            console.error('[DAILY] ❌ Error starting screen share:', error);
            this.showNotification('Failed to start screen share', 'error');
        }
    }

    /**
     * Stop screen sharing
     */
    async stopScreenShare() {
        if (!this.callFrame) return;

        try {
            await this.callFrame.stopScreenShare();
            console.log('[DAILY] 🖥️ Screen share stopped');
        } catch (error) {
            console.error('[DAILY] ❌ Error stopping screen share:', error);
        }
    }

    /**
     * Start recording (host only)
     */
    async startRecording() {
        if (!this.callFrame) return;

        try {
            await this.callFrame.startRecording();
            console.log('[DAILY] 🔴 Recording started');
            this.showNotification('Recording started', 'success');
        } catch (error) {
            console.error('[DAILY] ❌ Error starting recording:', error);
            this.showNotification('Failed to start recording', 'error');
        }
    }

    /**
     * Stop recording
     */
    async stopRecording() {
        if (!this.callFrame) return;

        try {
            await this.callFrame.stopRecording();
            console.log('[DAILY] ⏹️ Recording stopped');
            this.showNotification('Recording stopped. Processing transcript...', 'info');
        } catch (error) {
            console.error('[DAILY] ❌ Error stopping recording:', error);
            this.showNotification('Failed to stop recording', 'error');
        }
    }

    /**
     * Get current participants
     */
    getParticipants() {
        return Array.from(this.participants.values());
    }

    /**
     * Get participant count
     */
    getParticipantCount() {
        return this.participants.size;
    }

    /**
     * Register event handler
     */
    on(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].push(handler);
        }
    }

    /**
     * Trigger event
     */
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Try to use browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Kaminskyi Messenger', {
                body: message,
                icon: '/static/assets/logo.png'
            });
        }

        // Also log to console
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        }[type] || 'ℹ️';

        console.log(`[DAILY] ${emoji} ${message}`);

        // Trigger custom event for UI updates
        window.dispatchEvent(new CustomEvent('daily-notification', {
            detail: { message, type }
        }));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DailyVideoCall;
}
