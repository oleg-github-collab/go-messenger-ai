/**
 * Professional 1-on-1 Call - SIMPLE 100ms Implementation
 * Based on official 100ms documentation
 */

class Professional1on1Call {
    constructor() {
        this.hmsActions = null;
        this.hmsStore = null;
        this.roomCode = null;
        this.roomInfo = null;
        this.isHost = false;
        this.previewStream = null;

        this.init();
    }

    async init() {
        console.log('[INIT] Starting...');

        // Get room code from URL
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'room' && pathParts[2]) {
            this.roomCode = pathParts[2];
            this.isHost = new URLSearchParams(window.location.search).get('host') === 'true';
            console.log('[INIT] Room:', this.roomCode, 'Host:', this.isHost);

            // Load room info
            await this.loadRoomInfo();
        }

        // Show preview
        await this.showPreview();
    }

    async loadRoomInfo() {
        try {
            const response = await fetch(`/api/rooms/info?room_id=${this.roomCode}`);
            if (response.ok) {
                this.roomInfo = await response.json();
                console.log('[ROOM] Info loaded:', this.roomInfo);
            }
        } catch (error) {
            console.error('[ROOM] Failed to load info:', error);
        }
    }

    async showPreview() {
        console.log('[PREVIEW] Showing preview...');

        const joinBtn = document.getElementById('joinCallBtn');
        const previewVideo = document.getElementById('previewVideo');
        const previewPlaceholder = document.getElementById('previewPlaceholder');

        // Get media for preview
        try {
            this.previewStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            previewVideo.srcObject = this.previewStream;
            previewPlaceholder.style.display = 'none';
            console.log('[PREVIEW] ✅ Media ready');
        } catch (error) {
            console.error('[PREVIEW] ❌ Media failed:', error);
        }

        // Preview controls
        document.getElementById('previewMicBtn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const active = btn.dataset.active === 'true';
            btn.dataset.active = !active;
            if (this.previewStream) {
                this.previewStream.getAudioTracks().forEach(t => t.enabled = !active);
            }
        });

        document.getElementById('previewCameraBtn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const active = btn.dataset.active === 'true';
            btn.dataset.active = !active;
            if (this.previewStream) {
                this.previewStream.getVideoTracks().forEach(t => t.enabled = !active);
            }
        });

        // Join button
        joinBtn.addEventListener('click', async () => {
            console.log('[JOIN] Joining call...');
            document.getElementById('previewScreen').style.display = 'none';
            document.getElementById('loadingScreen').style.display = 'flex';

            // Initialize 100ms
            await this.init100ms();

            // Show call UI
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('callContainer').style.display = 'flex';

            // Setup controls
            this.setupControls();
        });
    }

    async init100ms() {
        try {
            console.log('[100MS] Initializing...');

            // Check if SDK loaded
            if (typeof HMSReactiveStore === 'undefined') {
                throw new Error('100ms SDK not loaded');
            }

            // Check room info
            if (!this.roomInfo || !this.roomInfo.hms_room_id) {
                throw new Error('No room info available');
            }

            // Get auth token
            const userName = this.isHost ? 'Oleh' : `Guest-${Date.now().toString().slice(-4)}`;
            const userId = this.isHost ? 'host-oleh' : `guest-${Date.now()}`;
            const role = this.isHost ? 'host' : 'guest';

            console.log('[100MS] Getting token for:', role, userName);

            const token = await this.getAuthToken(this.roomInfo.hms_room_id, userId, role, userName);

            if (!token) {
                throw new Error('Failed to get auth token');
            }

            // Initialize HMS Store
            const hms = new HMSReactiveStore();
            hms.triggerOnSubscribe();

            this.hmsActions = hms.getActions();
            this.hmsStore = hms.getStore();

            console.log('[100MS] Store initialized');

            // Subscribe to peers
            this.hmsStore.subscribe((peers) => {
                console.log('[100MS] Peers update:', peers);
                this.updatePeers(peers);
            }, selectPeers);

            // Subscribe to local peer
            this.hmsStore.subscribe((peer) => {
                if (peer) {
                    console.log('[100MS] Local peer:', peer);
                    this.updateLocalPeer(peer);
                }
            }, selectLocalPeer);

            // Join room
            await this.hmsActions.join({
                userName,
                authToken: token,
                settings: {
                    isAudioMuted: false,
                    isVideoMuted: false
                }
            });

            console.log('[100MS] ✅ Joined successfully');

        } catch (error) {
            console.error('[100MS] ❌ Failed:', error);
            alert('Failed to join video call: ' + error.message);
        }
    }

    async getAuthToken(roomId, userId, role, userName) {
        try {
            const response = await fetch('/api/professional/create-token', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    room_id: roomId,
                    user_id: userId,
                    role: role,
                    user_name: userName
                })
            });

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('[TOKEN] ✅ Received');
            return data.token;
        } catch (error) {
            console.error('[TOKEN] ❌ Failed:', error);
            return null;
        }
    }

    updatePeers(peers) {
        if (!peers || peers.length === 0) return;

        const remoteVideo = document.getElementById('remoteVideo');
        const remotePlaceholder = document.getElementById('remotePlaceholder');

        // Find remote peer
        const remotePeer = peers.find(p => !p.isLocal);

        if (remotePeer && remotePeer.videoTrack) {
            console.log('[VIDEO] Attaching remote peer:', remotePeer.name);
            this.hmsActions.attachVideo(remotePeer.videoTrack, remoteVideo);
            remotePlaceholder.style.display = 'none';
            remoteVideo.style.display = 'block';
        } else {
            console.log('[VIDEO] No remote peer with video');
            remotePlaceholder.style.display = 'flex';
            remoteVideo.style.display = 'none';
        }
    }

    updateLocalPeer(peer) {
        if (!peer || !peer.videoTrack) return;

        const localVideo = document.getElementById('localVideo');
        console.log('[VIDEO] Attaching local peer');
        this.hmsActions.attachVideo(peer.videoTrack, localVideo);
    }

    setupControls() {
        // Mic button
        document.getElementById('micBtn').addEventListener('click', async () => {
            const btn = document.getElementById('micBtn');
            const active = btn.dataset.active === 'true';
            await this.hmsActions.setLocalAudioEnabled(active);
            btn.dataset.active = !active;
            console.log('[MIC]', !active ? 'Enabled' : 'Disabled');
        });

        // Camera button
        document.getElementById('cameraBtn').addEventListener('click', async () => {
            const btn = document.getElementById('cameraBtn');
            const active = btn.dataset.active === 'true';
            await this.hmsActions.setLocalVideoEnabled(active);
            btn.dataset.active = !active;
            console.log('[CAMERA]', !active ? 'Enabled' : 'Disabled');
        });

        // End call button
        document.getElementById('endCallBtn').addEventListener('click', async () => {
            await this.hmsActions.leave();
            window.location.href = '/';
        });

        // Chat button
        document.getElementById('chatBtn')?.addEventListener('click', () => {
            const chatPanel = document.getElementById('chatPanel');
            if (chatPanel) {
                chatPanel.style.display = chatPanel.style.display === 'flex' ? 'none' : 'flex';
            }
        });
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('[APP] Initializing Professional 1-on-1 Call');
    new Professional1on1Call();
});
