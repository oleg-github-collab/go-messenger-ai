// Group Call Mobile Enhancements
// - Wake Lock to prevent screen sleep
// - Picture-in-Picture mode
// - Background audio/video persistence

class GroupMobileEnhancements {
    constructor() {
        this.wakeLock = null;
        this.pipEnabled = false;
        this.videoElement = null;

        console.log('[MOBILE-ENH] Initializing mobile enhancements');
        this.init();
    }

    init() {
        // Auto-request wake lock when call starts
        this.requestWakeLock();

        // Handle visibility change to maintain media
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // Re-request wake lock if released
        if ('wakeLock' in navigator) {
            document.addEventListener('visibilitychange', async () => {
                if (this.wakeLock !== null && document.visibilityState === 'visible') {
                    await this.requestWakeLock();
                }
            });
        }

        // Add PiP button if supported
        if (document.pictureInPictureEnabled) {
            this.addPiPButton();
        }

        console.log('[MOBILE-ENH] ✅ Mobile enhancements active');
    }

    async requestWakeLock() {
        if (!('wakeLock' in navigator)) {
            console.log('[MOBILE-ENH] ⚠️ Wake Lock API not supported');
            return;
        }

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
            console.log('[MOBILE-ENH] ✅ Wake lock acquired');

            this.wakeLock.addEventListener('release', () => {
                console.log('[MOBILE-ENH] Wake lock released');
            });
        } catch (err) {
            console.error('[MOBILE-ENH] ❌ Wake lock request failed:', err);
        }
    }

    releaseWakeLock() {
        if (this.wakeLock !== null) {
            this.wakeLock.release();
            this.wakeLock = null;
            console.log('[MOBILE-ENH] Wake lock manually released');
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            console.log('[MOBILE-ENH] Page hidden - maintaining media streams');

            // Ensure local tracks stay enabled
            if (window.dailyCall) {
                const localParticipant = window.dailyCall.participants().local;
                if (localParticipant) {
                    // Keep audio/video enabled in background
                    const currentAudio = localParticipant.audio;
                    const currentVideo = localParticipant.video;

                    console.log('[MOBILE-ENH] Current state:', { audio: currentAudio, video: currentVideo });

                    // Store state to restore later
                    sessionStorage.setItem('backgroundAudio', currentAudio);
                    sessionStorage.setItem('backgroundVideo', currentVideo);
                }
            }
        } else {
            console.log('[MOBILE-ENH] Page visible - restoring if needed');

            // Re-request wake lock
            this.requestWakeLock();
        }
    }

    addPiPButton() {
        // Find main video element or create PiP trigger
        const findVideoElement = () => {
            // Try to find the main remote video
            const remoteVideos = document.querySelectorAll('video:not([id*="local"])');
            if (remoteVideos.length > 0) {
                return remoteVideos[0];
            }

            // Fallback to any video
            const anyVideo = document.querySelector('video');
            return anyVideo;
        };

        // Wait for video elements to be ready
        const checkInterval = setInterval(() => {
            this.videoElement = findVideoElement();

            if (this.videoElement) {
                clearInterval(checkInterval);
                this.setupPiP();
            }
        }, 1000);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    }

    setupPiP() {
        if (!this.videoElement || !document.pictureInPictureEnabled) {
            console.log('[MOBILE-ENH] PiP not available');
            return;
        }

        // Add PiP button to controls
        const pipButton = document.createElement('button');
        pipButton.className = 'control-btn pip-btn';
        pipButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
            </svg>
        `;
        pipButton.title = 'Picture-in-Picture';
        pipButton.onclick = () => this.togglePiP();

        // Find controls container
        const controlsContainer = document.querySelector('.controls-container') ||
                                  document.querySelector('.call-controls') ||
                                  document.querySelector('.bottom-controls');

        if (controlsContainer) {
            controlsContainer.appendChild(pipButton);
            console.log('[MOBILE-ENH] ✅ PiP button added');
        }
    }

    async togglePiP() {
        if (!this.videoElement) {
            console.log('[MOBILE-ENH] No video element for PiP');
            return;
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                this.pipEnabled = false;
                console.log('[MOBILE-ENH] Exited PiP');
            } else {
                await this.videoElement.requestPictureInPicture();
                this.pipEnabled = true;
                console.log('[MOBILE-ENH] ✅ Entered PiP');
            }
        } catch (err) {
            console.error('[MOBILE-ENH] ❌ PiP toggle failed:', err);
        }
    }

    // Cleanup when call ends
    cleanup() {
        this.releaseWakeLock();

        if (this.pipEnabled && document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(err => {
                console.error('[MOBILE-ENH] PiP exit error:', err);
            });
        }

        console.log('[MOBILE-ENH] Cleaned up');
    }
}

// Auto-initialize when Daily call is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.groupMobileEnhancements = new GroupMobileEnhancements();
    });
} else {
    window.groupMobileEnhancements = new GroupMobileEnhancements();
}
