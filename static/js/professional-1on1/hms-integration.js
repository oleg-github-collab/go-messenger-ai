/**
 * 100ms Video Integration
 * Based on official 100ms documentation
 */

class HMSVideoCall {
    constructor() {
        this.hms = null;
        this.hmsActions = null;
        this.hmsStore = null;
        this.hmsNotifications = null;
        this.roomCode = null;
        this.isHost = false;
    }

    async initialize() {
        console.log('[HMS] Initializing SDK...');

        // Wait for SDK to load
        await this.waitForSDK();

        // Import from global HMS
        const { HMSReactiveStore } = window;

        // Initialize HMS
        this.hms = new HMSReactiveStore();
        this.hms.triggerOnSubscribe();

        this.hmsActions = this.hms.getActions();
        this.hmsStore = this.hms.getStore();
        this.hmsNotifications = this.hms.getNotifications();

        console.log('[HMS] ✅ SDK initialized');

        // Subscribe to peer updates
        this.subscribeToPeers();
    }

    async waitForSDK() {
        for (let i = 0; i < 50; i++) {
            if (window.HMSReactiveStore) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        throw new Error('100ms SDK failed to load');
    }

    subscribeToPeers() {
        // Subscribe to all peers
        this.hmsStore.subscribe((peers) => {
            console.log('[HMS] Peers updated:', peers.length);
            this.renderPeers(peers);
        }, this.hmsStore.getState().peers ?
            (state) => Object.values(state.peers) :
            null
        );
    }

    renderPeers(peers) {
        if (!Array.isArray(peers)) {
            peers = Object.values(peers || {});
        }

        console.log('[HMS] Rendering', peers.length, 'peers');

        // Find local and remote peers
        const localPeer = peers.find(p => p.isLocal);
        const remotePeers = peers.filter(p => !p.isLocal);

        // Render local video
        if (localPeer && localPeer.videoTrack) {
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                this.attachVideo(localPeer.videoTrack, localVideo);
            }
        }

        // Render remote videos
        if (remotePeers.length > 0) {
            const remotePeer = remotePeers[0]; // First remote peer
            if (remotePeer.videoTrack) {
                const remoteVideo = document.getElementById('remoteVideo');
                const remotePlaceholder = document.getElementById('remotePlaceholder');

                if (remoteVideo) {
                    this.attachVideo(remotePeer.videoTrack, remoteVideo);
                    remoteVideo.style.display = 'block';
                    if (remotePlaceholder) {
                        remotePlaceholder.style.display = 'none';
                    }
                }
            }
        }
    }

    attachVideo(track, videoElement) {
        if (!track || !videoElement) {
            console.warn('[HMS] Cannot attach video: missing track or element');
            return;
        }

        try {
            // Use track ID for attachment (official API)
            this.hmsActions.attachVideo(track.id, videoElement);
            console.log('[HMS] ✅ Video attached:', track.id);
        } catch (error) {
            console.error('[HMS] ❌ Failed to attach video:', error);
        }
    }

    async joinRoom(authToken, userName) {
        try {
            console.log('[HMS] Joining room as:', userName);

            await this.hmsActions.join({
                authToken: authToken,
                userName: userName,
                settings: {
                    isAudioMuted: false,
                    isVideoMuted: false
                }
            });

            console.log('[HMS] ✅ Joined successfully');
            return true;
        } catch (error) {
            console.error('[HMS] ❌ Join failed:', error);
            throw error;
        }
    }

    async toggleAudio(enabled) {
        await this.hmsActions.setLocalAudioEnabled(enabled);
        console.log('[HMS] Audio:', enabled ? 'ON' : 'OFF');
    }

    async toggleVideo(enabled) {
        await this.hmsActions.setLocalVideoEnabled(enabled);
        console.log('[HMS] Video:', enabled ? 'ON' : 'OFF');
    }

    async leave() {
        await this.hmsActions.leave();
        console.log('[HMS] Left room');
    }
}

// Export to window
window.HMSVideoCall = HMSVideoCall;
