/**
 * Professional 1-on-1 Video Call Application
 * Clean implementation with 100ms SDK
 */

class VideoCallApp {
    constructor() {
        this.hmsVideo = new HMSVideoCall();
        this.roomCode = null;
        this.roomInfo = null;
        this.isHost = false;
        this.previewStream = null;

        this.init();
    }

    async init() {
        console.log('[APP] Starting...');

        // Parse URL
        this.parseURL();

        // Load room info
        await this.loadRoomInfo();

        // Show preview
        this.showPreview();
    }

    parseURL() {
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'room' && pathParts[2]) {
            this.roomCode = pathParts[2];
            this.isHost = new URLSearchParams(window.location.search).get('host') === 'true';
            console.log('[APP] Room:', this.roomCode, '| Host:', this.isHost);
        }
    }

    async loadRoomInfo() {
        if (!this.roomCode) return;

        try {
            const response = await fetch(`/api/rooms/info?room_id=${this.roomCode}`);
            if (response.ok) {
                this.roomInfo = await response.json();
                console.log('[APP] Room info loaded');
            }
        } catch (error) {
            console.error('[APP] Failed to load room:', error);
        }
    }

    async showPreview() {
        const previewVideo = document.getElementById('previewVideo');
        const previewPlaceholder = document.getElementById('previewPlaceholder');
        const joinBtn = document.getElementById('joinCallBtn');

        // Get media
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
            previewPlaceholder.innerHTML = '<p style="color: white;">Camera/Mic access denied</p>';
        }

        // Preview controls
        this.setupPreviewControls();

        // Join button
        joinBtn.addEventListener('click', () => this.joinCall());
    }

    setupPreviewControls() {
        const micBtn = document.getElementById('previewMicBtn');
        const cameraBtn = document.getElementById('previewCameraBtn');

        micBtn.addEventListener('click', () => {
            const active = micBtn.dataset.active === 'true';
            micBtn.dataset.active = !active;
            if (this.previewStream) {
                this.previewStream.getAudioTracks().forEach(t => t.enabled = !active);
            }
        });

        cameraBtn.addEventListener('click', () => {
            const active = cameraBtn.dataset.active === 'true';
            cameraBtn.dataset.active = !active;
            if (this.previewStream) {
                this.previewStream.getVideoTracks().forEach(t => t.enabled = !active);
            }
        });
    }

    async joinCall() {
        console.log('[APP] Joining call...');

        // Hide preview, show loading
        document.getElementById('previewScreen').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'flex';

        try {
            // Initialize HMS
            await this.hmsVideo.initialize();

            // Get auth token
            const userName = this.isHost ? 'Oleh' : `Guest-${Date.now().toString().slice(-4)}`;
            const userId = this.isHost ? 'host-oleh' : `guest-${Date.now()}`;
            const role = this.isHost ? 'host' : 'guest';

            console.log('[APP] 🔍 Room info:', this.roomInfo);
            console.log('[APP] 🔍 HMS room ID:', this.roomInfo?.hms_room_id);

            if (!this.roomInfo || !this.roomInfo.hms_room_id) {
                throw new Error('Room info not loaded or missing hms_room_id');
            }

            const token = await this.getAuthToken(
                this.roomInfo.hms_room_id,
                userId,
                role,
                userName
            );

            if (!token) {
                throw new Error('Failed to get auth token');
            }

            // Join room
            await this.hmsVideo.joinRoom(token, userName);

            // Stop preview stream
            if (this.previewStream) {
                this.previewStream.getTracks().forEach(t => t.stop());
            }

            // Show call UI
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('callContainer').style.display = 'flex';

            // Setup controls
            this.setupCallControls();

            console.log('[APP] ✅ Call started');

        } catch (error) {
            console.error('[APP] ❌ Join failed:', error);
            alert('Failed to join call: ' + error.message);
            window.location.reload();
        }
    }

    async getAuthToken(roomId, userId, role, userName) {
        try {
            const response = await fetch('/api/professional/create-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    setupCallControls() {
        // Mic button
        document.getElementById('micBtn').addEventListener('click', async () => {
            const btn = document.getElementById('micBtn');
            const active = btn.dataset.active === 'true';
            await this.hmsVideo.toggleAudio(active);
            btn.dataset.active = !active;
        });

        // Camera button
        document.getElementById('cameraBtn').addEventListener('click', async () => {
            const btn = document.getElementById('cameraBtn');
            const active = btn.dataset.active === 'true';
            await this.hmsVideo.toggleVideo(active);
            btn.dataset.active = !active;
        });

        // End call button
        document.getElementById('endCallBtn').addEventListener('click', async () => {
            await this.hmsVideo.leave();
            window.location.href = '/';
        });

        // Chat button
        const chatBtn = document.getElementById('chatBtn');
        if (chatBtn) {
            chatBtn.addEventListener('click', () => {
                const chatPanel = document.getElementById('chatPanel');
                if (chatPanel) {
                    const isVisible = chatPanel.style.display === 'flex';
                    chatPanel.style.display = isVisible ? 'none' : 'flex';
                }
            });
        }
    }
}

// Start app when DOM ready
window.addEventListener('DOMContentLoaded', () => {
    console.log('[APP] DOM ready, starting application');
    new VideoCallApp();
});
