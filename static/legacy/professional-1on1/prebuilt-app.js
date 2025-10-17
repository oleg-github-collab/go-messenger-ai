/**
 * 100ms Prebuilt Integration - Using iframe
 * Bypasses SDK issues, uses ready-made UI
 */

class PrebuiltApp {
    constructor() {
        this.roomCode = null;
        this.isHost = false;
        this.authToken = null;

        this.init();
    }

    async init() {
        console.log('[PREBUILT] Starting...');

        // Parse URL
        this.parseURL();

        // Get auth token from backend
        await this.getAuthToken();

        // Show prebuilt iframe
        this.loadPrebuilt();
    }

    parseURL() {
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'room' && pathParts[2]) {
            this.roomCode = pathParts[2];
            this.isHost = new URLSearchParams(window.location.search).get('host') === 'true';
            console.log('[PREBUILT] Room:', this.roomCode, '| Host:', this.isHost);
        }
    }

    async getAuthToken() {
        if (!this.roomCode) return;

        try {
            const userName = this.isHost ? 'Oleh' : `Guest-${Date.now().toString().slice(-4)}`;
            const userId = this.isHost ? 'host-oleh' : `guest-${Date.now()}`;
            const role = this.isHost ? 'host' : 'guest';

            // Get room info first
            const roomResp = await fetch(`/api/rooms/info?room_id=${this.roomCode}`);
            if (!roomResp.ok) {
                throw new Error('Room not found');
            }

            const roomInfo = await roomResp.json();
            console.log('[PREBUILT] Room info:', roomInfo);

            // If no hms_room_id, we need to create one first
            if (!roomInfo.hms_room_id) {
                console.log('[PREBUILT] No HMS room - using room code directly');
                // For iframe, we can use room code as subdomain
                this.loadPrebuiltWithCode();
                return;
            }

            // Get auth token
            const tokenResp = await fetch('/api/professional/create-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    room_id: roomInfo.hms_room_id,
                    user_id: userId,
                    role: role,
                    user_name: userName
                })
            });

            if (!tokenResp.ok) {
                throw new Error('Failed to get token');
            }

            const tokenData = await tokenResp.json();
            this.authToken = tokenData.token;

            console.log('[PREBUILT] ✅ Auth token obtained');

        } catch (error) {
            console.error('[PREBUILT] ❌ Auth failed:', error);
            alert('Failed to join: ' + error.message);
        }
    }

    loadPrebuilt() {
        if (!this.authToken) {
            console.error('[PREBUILT] No auth token');
            return;
        }

        // Hide all UI, show iframe
        document.getElementById('previewScreen').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('callContainer').style.display = 'none';

        // Create iframe container
        const container = document.createElement('div');
        container.id = 'prebuilt-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            background: #000;
        `;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;

        // 100ms prebuilt URL with auth token
        iframe.src = `https://kaminskyi-25a04450ce8b905b.app.100ms.live/preview/${this.roomCode}?token=${this.authToken}&skip_preview=true`;

        console.log('[PREBUILT] Loading iframe:', iframe.src);

        container.appendChild(iframe);
        document.body.appendChild(container);
    }

    loadPrebuiltWithCode() {
        // Fallback: use room code directly
        const subdomain = 'kaminskyi-25a04450ce8b905b'; // Your 100ms subdomain

        // Hide all UI
        document.getElementById('previewScreen').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('callContainer').style.display = 'none';

        // Create iframe
        const container = document.createElement('div');
        container.id = 'prebuilt-container';
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            background: #000;
        `;

        const iframe = document.createElement('iframe');
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;

        const userName = this.isHost ? 'Oleh' : `Guest-${Date.now().toString().slice(-4)}`;

        // Use direct room link
        iframe.src = `https://${subdomain}.app.100ms.live/meeting/${this.roomCode}?name=${userName}&skip_preview=false`;

        console.log('[PREBUILT] Loading direct iframe:', iframe.src);

        container.appendChild(iframe);
        document.body.appendChild(container);
    }
}

// Start app
if (window.use100msPrebuilt) {
    new PrebuiltApp();
}
