/**
 * Direct 100ms Room Creation from Frontend
 * Bypasses backend - creates room directly via Management API
 */

class DirectHMS {
    constructor() {
        this.roomCode = null;
        this.isHost = false;
        this.hmsRoomId = null;
        this.authToken = null;

        // HMS credentials (from backend or hardcoded for testing)
        this.HMS_ACCESS_KEY = '68ec2229bd0dab5f9a0140ef';
        this.HMS_APP_SECRET = 'Fd_7l_n2qDA709eCvzyh5Wb6fLtDJxyaqNYDmvKzo2HWPHM-tl5SQxmDQ2_nouEAO5hOng4oWbHXhgkBwlGu7Q3fHtmVaH9yi34Xd7YWtEUUwDOBggChj3_IjZ_xnSGB0nhPSypp4BsDDHKGuI0dc74d-vs0vRoEFzEi5BOYqWY=';
        this.HMS_TEMPLATE_ID = '68ec229574147bd574bb5dd7';

        this.init();
    }

    async init() {
        console.log('[DIRECT-HMS] Starting...');

        this.parseURL();

        // If host - create room
        if (this.isHost) {
            await this.createHMSRoom();
        } else {
            // Guest - get room info
            await this.getRoomInfo();
        }

        // Generate auth token
        await this.generateAuthToken();

        // Load prebuilt
        this.loadPrebuilt();
    }

    parseURL() {
        const pathParts = window.location.pathname.split('/');
        if (pathParts[1] === 'room' && pathParts[2]) {
            this.roomCode = pathParts[2];
            this.isHost = new URLSearchParams(window.location.search).get('host') === 'true';
            console.log('[DIRECT-HMS] Room:', this.roomCode, '| Host:', this.isHost);
        }
    }

    async createHMSRoom() {
        try {
            console.log('[DIRECT-HMS] Creating HMS room via backend...');

            // Use backend endpoint which has proper Management Token
            const response = await fetch('/api/professional/create-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: `Professional-${this.roomCode}`,
                    description: 'AI-powered professional meeting',
                    template_id: this.HMS_TEMPLATE_ID
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Backend error: ${response.status} - ${error}`);
            }

            const roomData = await response.json();
            this.hmsRoomId = roomData.id;

            console.log('[DIRECT-HMS] ✅ HMS Room created:', this.hmsRoomId);

            // Save to our room manager
            await this.saveRoomInfo();

        } catch (error) {
            console.error('[DIRECT-HMS] ❌ Room creation failed:', error);
            alert('Failed to create video room: ' + error.message);
        }
    }

    async saveRoomInfo() {
        // Update backend with HMS room ID
        try {
            await fetch(`/api/rooms/update-hms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    room_code: this.roomCode,
                    hms_room_id: this.hmsRoomId
                })
            });
            console.log('[DIRECT-HMS] Room info saved to backend');
        } catch (err) {
            console.warn('[DIRECT-HMS] Could not save to backend:', err);
        }
    }

    async getRoomInfo() {
        try {
            const response = await fetch(`/api/rooms/info?room_id=${this.roomCode}`);
            if (!response.ok) throw new Error('Room not found');

            const roomInfo = await response.json();
            this.hmsRoomId = roomInfo.hms_room_id;

            if (!this.hmsRoomId) {
                throw new Error('HMS room not created yet - host must join first');
            }

            console.log('[DIRECT-HMS] Got HMS room ID:', this.hmsRoomId);
        } catch (error) {
            console.error('[DIRECT-HMS] ❌ Failed to get room info:', error);
            alert('Room not ready. Please wait for host to start the meeting.');
        }
    }

    async generateAuthToken() {
        if (!this.hmsRoomId) {
            console.error('[DIRECT-HMS] No HMS room ID');
            return;
        }

        try {
            const userName = this.isHost ? 'Oleh' : `Guest-${Date.now().toString().slice(-4)}`;
            const userId = this.isHost ? 'host-oleh' : `guest-${Date.now()}`;
            const role = this.isHost ? 'host' : 'guest';

            // Generate JWT token locally using HMS secret
            const payload = {
                access_key: this.HMS_ACCESS_KEY,
                room_id: this.hmsRoomId,
                user_id: userId,
                role: role,
                type: 'app',
                version: 2,
                iat: Math.floor(Date.now() / 1000),
                nbf: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 86400,
                user_name: userName
            };

            // Use backend to sign JWT (need server for HMAC-SHA256)
            const response = await fetch('/api/professional/create-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    room_id: this.hmsRoomId,
                    user_id: userId,
                    role: role,
                    user_name: userName
                })
            });

            if (!response.ok) {
                throw new Error('Token generation failed');
            }

            const tokenData = await response.json();
            this.authToken = tokenData.token;

            console.log('[DIRECT-HMS] ✅ Auth token generated');

        } catch (error) {
            console.error('[DIRECT-HMS] ❌ Token generation failed:', error);
        }
    }

    loadPrebuilt() {
        if (!this.authToken) {
            console.error('[DIRECT-HMS] No auth token - cannot load prebuilt');
            this.showError();
            return;
        }

        // Hide all UI
        document.getElementById('previewScreen').style.display = 'none';
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('callContainer').style.display = 'none';

        // Create iframe
        const container = document.createElement('div');
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

        iframe.src = `https://kaminskyi-25a04450ce8b905b.app.100ms.live/preview/${this.hmsRoomId}?token=${this.authToken}&skip_preview=true`;

        console.log('[DIRECT-HMS] Loading prebuilt:', iframe.src);

        container.appendChild(iframe);
        document.body.appendChild(container);
    }

    showError() {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #0a0a0f; display: flex; align-items: center; justify-content: center; z-index: 10000;">
                <div style="text-align: center; color: white; padding: 40px;">
                    <h1 style="font-size: 48px; margin-bottom: 20px;">❌</h1>
                    <h2 style="color: #4facfe; margin-bottom: 16px;">Failed to Join</h2>
                    <p style="opacity: 0.8; margin-bottom: 24px;">Could not create or join video room</p>
                    <button onclick="window.location.href='/home'" style="background: #4facfe; color: white; border: none; padding: 12px 32px; border-radius: 8px; font-size: 16px; cursor: pointer;">← Back to Home</button>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Auto-start if enabled
if (window.useDirectHMS) {
    new DirectHMS();
}
