/**
 * Call Controls - НАПИСАНО З НУЛЯ
 * Управління всіма кнопками дзвінка
 */

class ProfessionalCallControls {
    constructor(uiController, hmsSDK) {
        this.ui = uiController;
        this.sdk = hmsSDK;

        // Buttons
        this.micBtn = document.getElementById('micBtn');
        this.cameraBtn = document.getElementById('cameraBtn');
        this.speakerBtn = document.getElementById('speakerBtn');
        this.screenShareBtn = document.getElementById('screenShareBtn');
        this.raiseHandBtn = document.getElementById('raiseHandBtn');
        this.endCallBtn = document.getElementById('endCallBtn');

        // State
        this.isScreenSharing = false;

        this.init();
        console.log('[CALL CONTROLS] Initialized');
    }

    init() {
        this.setupMicButton();
        this.setupCameraButton();
        this.setupSpeakerButton();
        this.setupScreenShareButton();
        this.setupRaiseHandButton();
        this.setupEndCallButton();
        this.subscribeToStateChanges();
    }

    // ==================== MICROPHONE ====================
    setupMicButton() {
        if (!this.micBtn) return;

        this.micBtn.onclick = async () => {
            if (this.micBtn.disabled) return;
            this.micBtn.disabled = true;

            try {
                console.log('[CONTROLS] Mic button clicked');

                // Get current state
                const currentState = this.sdk.hmsStore.getState(state => state.localPeer?.audioEnabled);
                console.log('[CONTROLS] Current audio state:', currentState);

                // Toggle
                const newState = !currentState;
                await this.sdk.hmsActions.setLocalAudioEnabled(newState);

                console.log('[CONTROLS] Audio toggled to:', newState);

            } catch (error) {
                console.error('[CONTROLS] Mic toggle error:', error);
            } finally {
                setTimeout(() => {
                    this.micBtn.disabled = false;
                }, 150);
            }
        };

        console.log('[CONTROLS] Mic button ready');
    }

    // ==================== CAMERA ====================
    setupCameraButton() {
        if (!this.cameraBtn) return;

        this.cameraBtn.onclick = async () => {
            if (this.cameraBtn.disabled) return;
            this.cameraBtn.disabled = true;

            try {
                console.log('[CONTROLS] Camera button clicked');

                // Get current state
                const currentState = this.sdk.hmsStore.getState(state => state.localPeer?.videoEnabled);
                console.log('[CONTROLS] Current video state:', currentState);

                // Toggle
                const newState = !currentState;
                await this.sdk.hmsActions.setLocalVideoEnabled(newState);

                console.log('[CONTROLS] Video toggled to:', newState);

            } catch (error) {
                console.error('[CONTROLS] Camera toggle error:', error);
            } finally {
                setTimeout(() => {
                    this.cameraBtn.disabled = false;
                }, 150);
            }
        };

        console.log('[CONTROLS] Camera button ready');
    }

    // ==================== SPEAKER ====================
    setupSpeakerButton() {
        if (!this.speakerBtn) return;

        this.speakerBtn.onclick = () => {
            const remoteAudio = document.querySelector('audio[data-peer-id]');

            if (remoteAudio) {
                remoteAudio.muted = !remoteAudio.muted;
                const isMuted = remoteAudio.muted;

                this.speakerBtn.classList.toggle('active', !isMuted);
                this.speakerBtn.dataset.active = !isMuted ? 'true' : 'false';

                console.log('[CONTROLS] Speaker:', !isMuted ? 'ON' : 'OFF');
            }
        };

        console.log('[CONTROLS] Speaker button ready');
    }

    // ==================== SCREEN SHARE ====================
    setupScreenShareButton() {
        if (!this.screenShareBtn) return;

        this.screenShareBtn.onclick = async () => {
            if (this.screenShareBtn.disabled) return;
            this.screenShareBtn.disabled = true;

            try {
                console.log('[CONTROLS] Screen share clicked');

                this.isScreenSharing = !this.isScreenSharing;

                await this.sdk.hmsActions.setScreenShareEnabled(this.isScreenSharing);

                this.screenShareBtn.classList.toggle('active', this.isScreenSharing);
                this.screenShareBtn.dataset.active = this.isScreenSharing ? 'true' : 'false';

                console.log('[CONTROLS] Screen share:', this.isScreenSharing ? 'ON' : 'OFF');

            } catch (error) {
                console.error('[CONTROLS] Screen share error:', error);
                this.isScreenSharing = false;
                this.screenShareBtn.classList.remove('active');
                this.screenShareBtn.dataset.active = 'false';

                // Don't alert if user cancelled
                if (!error.message?.includes('denied') && !error.message?.includes('cancel')) {
                    alert('Screen share not available');
                }
            } finally {
                setTimeout(() => {
                    this.screenShareBtn.disabled = false;
                }, 150);
            }
        };

        console.log('[CONTROLS] Screen share button ready');
    }

    // ==================== RAISE HAND ====================
    setupRaiseHandButton() {
        if (!this.raiseHandBtn) return;

        this.raiseHandBtn.onclick = async () => {
            try {
                const isRaised = this.raiseHandBtn.classList.contains('active');
                const newState = !isRaised;

                this.raiseHandBtn.classList.toggle('active', newState);
                this.raiseHandBtn.dataset.active = newState ? 'true' : 'false';

                // Send message
                const userName = this.sdk.userName || 'User';
                const message = newState ? `${userName} raised hand ✋` : `${userName} lowered hand`;

                await this.sdk.hmsActions.sendBroadcastMessage(message);

                console.log('[CONTROLS] Raise hand:', newState);

            } catch (error) {
                console.error('[CONTROLS] Raise hand error:', error);
            }
        };

        console.log('[CONTROLS] Raise hand button ready');
    }

    // ==================== END CALL ====================
    setupEndCallButton() {
        if (!this.endCallBtn) return;

        this.endCallBtn.onclick = async () => {
            if (confirm('End call?')) {
                try {
                    console.log('[CONTROLS] Ending call...');

                    await this.sdk.hmsActions.leave();

                    // Redirect
                    setTimeout(() => {
                        window.location.href = '/home';
                    }, 500);

                } catch (error) {
                    console.error('[CONTROLS] End call error:', error);
                    window.location.href = '/home';
                }
            }
        };

        console.log('[CONTROLS] End call button ready');
    }

    // ==================== REACTIVE UPDATES ====================
    subscribeToStateChanges() {
        if (!this.sdk?.hmsStore) {
            console.warn('[CONTROLS] HMS store not available');
            return;
        }

        // Subscribe to audio state changes
        this.sdk.hmsStore.subscribe(
            (audioEnabled) => {
                if (audioEnabled !== undefined && this.micBtn) {
                    this.updateMicUI(audioEnabled);
                }
            },
            state => state.localPeer?.audioEnabled
        );

        // Subscribe to video state changes
        this.sdk.hmsStore.subscribe(
            (videoEnabled) => {
                if (videoEnabled !== undefined && this.cameraBtn) {
                    this.updateCameraUI(videoEnabled);
                }
            },
            state => state.localPeer?.videoEnabled
        );

        console.log('[CONTROLS] Subscribed to state changes');
    }

    // ==================== UI UPDATES ====================
    updateMicUI(enabled) {
        if (!this.micBtn) return;

        this.micBtn.classList.toggle('active', enabled);
        this.micBtn.dataset.active = enabled ? 'true' : 'false';

        const iconOn = this.micBtn.querySelector('.icon-on');
        const iconOff = this.micBtn.querySelector('.icon-off');

        if (iconOn) iconOn.style.display = enabled ? 'block' : 'none';
        if (iconOff) iconOff.style.display = enabled ? 'none' : 'block';

        console.log('[CONTROLS] Mic UI updated:', enabled);
    }

    updateCameraUI(enabled) {
        if (!this.cameraBtn) return;

        this.cameraBtn.classList.toggle('active', enabled);
        this.cameraBtn.dataset.active = enabled ? 'true' : 'false';

        const iconOn = this.cameraBtn.querySelector('.icon-on');
        const iconOff = this.cameraBtn.querySelector('.icon-off');

        if (iconOn) iconOn.style.display = enabled ? 'block' : 'none';
        if (iconOff) iconOff.style.display = enabled ? 'none' : 'block';

        console.log('[CONTROLS] Camera UI updated:', enabled);
    }

    // ==================== ENABLE/DISABLE ====================
    enableAll() {
        [this.micBtn, this.cameraBtn, this.speakerBtn, this.screenShareBtn, this.raiseHandBtn, this.endCallBtn].forEach(btn => {
            if (btn) {
                btn.disabled = false;
            }
        });
        console.log('[CONTROLS] All buttons enabled');
    }

    disableAll() {
        [this.micBtn, this.cameraBtn, this.speakerBtn, this.screenShareBtn, this.raiseHandBtn, this.endCallBtn].forEach(btn => {
            if (btn) {
                btn.disabled = true;
            }
        });
        console.log('[CONTROLS] All buttons disabled');
    }

    // ==================== CLEANUP ====================
    cleanup() {
        // Remove all event listeners by setting onclick to null
        if (this.micBtn) this.micBtn.onclick = null;
        if (this.cameraBtn) this.cameraBtn.onclick = null;
        if (this.speakerBtn) this.speakerBtn.onclick = null;
        if (this.screenShareBtn) this.screenShareBtn.onclick = null;
        if (this.raiseHandBtn) this.raiseHandBtn.onclick = null;
        if (this.endCallBtn) this.endCallBtn.onclick = null;

        console.log('[CONTROLS] Cleaned up');
    }
}

// Export
window.ProfessionalCallControls = ProfessionalCallControls;
