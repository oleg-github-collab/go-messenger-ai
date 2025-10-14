/**
 * 100ms SDK Integration for Professional AI Mode
 * Based on official 100ms documentation
 * https://www.100ms.live/docs/javascript/v2/foundation/basics
 */

class ProfessionalMeetingSDK {
    constructor() {
        this.roomCode = null;
        this.hmsRoomId = null;
        this.authToken = null;
        this.role = null; // 'host' or 'guest'
        this.userName = null;
        this.userId = null;
        this.hmsActions = null;
        this.hmsStore = null;
        this.hmsReactiveStore = null;
        this.hmsNotifications = null;
        this.isJoined = false;

        console.log('[HMS SDK] Initializing Professional Meeting SDK');
    }

    /**
     * Initialize for HOST (Oleh)
     * Creates a new room and gets auth token
     */
    async initAsHost(userName = 'Oleh') {
        console.log('[HMS SDK] Initializing as HOST');
        this.role = 'host';
        this.userName = userName;
        this.userId = 'host-' + Date.now();

        try {
            // Step 1: Create room via backend
            console.log('[HMS SDK] Step 1: Creating room...');
            const roomResponse = await this.createRoom();

            if (!roomResponse || !roomResponse.id) {
                throw new Error('Failed to create room - no room ID returned');
            }

            this.hmsRoomId = roomResponse.id;
            console.log('[HMS SDK] ✅ Room created:', this.hmsRoomId);

            // Step 2: Get auth token for host
            console.log('[HMS SDK] Step 2: Getting auth token...');
            this.authToken = await this.getAuthToken();

            if (!this.authToken) {
                throw new Error('Failed to get auth token');
            }

            console.log('[HMS SDK] ✅ Auth token received');

            // Step 3: Initialize HMS SDK
            await this.initializeSDK();

            return {
                success: true,
                roomId: this.hmsRoomId,
                shareLink: this.getShareLink()
            };

        } catch (error) {
            console.error('[HMS SDK] ❌ Host initialization failed:', error);
            throw error;
        }
    }

    /**
     * Initialize for GUEST
     * Joins existing room with room code
     */
    async initAsGuest(roomCode, userName) {
        console.log('[HMS SDK] Initializing as GUEST');
        this.role = 'guest';
        this.userName = userName || 'Guest';
        this.userId = 'guest-' + Date.now();
        this.roomCode = roomCode;

        try {
            // Step 1: Get room info from backend
            console.log('[HMS SDK] Step 1: Getting room info...');
            const roomInfo = await this.getRoomInfo();

            if (!roomInfo || !roomInfo.hms_room_id) {
                throw new Error('Room not found or invalid room code');
            }

            this.hmsRoomId = roomInfo.hms_room_id;
            console.log('[HMS SDK] ✅ Room found:', this.hmsRoomId);

            // Step 2: Get auth token for guest
            console.log('[HMS SDK] Step 2: Getting auth token...');
            this.authToken = await this.getAuthToken();

            if (!this.authToken) {
                throw new Error('Failed to get auth token');
            }

            console.log('[HMS SDK] ✅ Auth token received');

            // Step 3: Initialize HMS SDK
            await this.initializeSDK();

            return {
                success: true,
                roomId: this.hmsRoomId
            };

        } catch (error) {
            console.error('[HMS SDK] ❌ Guest initialization failed:', error);
            throw error;
        }
    }

    /**
     * Create new room (HOST only)
     */
    async createRoom() {
        const response = await fetch('/api/professional/create-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: `Professional Meeting ${Date.now()}`,
                description: 'AI-powered professional meeting'
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Room creation failed: ${response.status} - ${error}`);
        }

        return await response.json();
    }

    /**
     * Get room info by room code
     */
    async getRoomInfo() {
        const response = await fetch(`/api/rooms/${this.roomCode}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Room not found');
        }

        return await response.json();
    }

    /**
     * Get auth token for joining room
     */
    async getAuthToken() {
        const response = await fetch('/api/professional/create-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                room_id: this.hmsRoomId,
                user_id: this.userId,
                role: this.role,
                user_name: this.userName
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token generation failed: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.token;
    }

    /**
     * Initialize 100ms SDK
     * https://www.100ms.live/docs/javascript/v2/foundation/basics
     */
    async initializeSDK() {
        console.log('[HMS SDK] Initializing 100ms SDK...');

        // Check if HMS SDK is loaded
        if (typeof window.HMSReactiveStore === 'undefined') {
            throw new Error('HMS SDK not loaded. Please include hms-bundle.js');
        }

        // Create HMS store
        this.hmsReactiveStore = new window.HMSReactiveStore();
        this.hmsActions = this.hmsReactiveStore.getActions();
        if (typeof this.hmsReactiveStore.triggerOnSubscribe === 'function') {
            this.hmsReactiveStore.triggerOnSubscribe();
        }
        this.hmsStore = this.hmsReactiveStore.getStore();
        this.hmsNotifications = this.hmsReactiveStore.getNotifications();

        console.log('[HMS SDK] ✅ SDK initialized');
    }

    /**
     * Join the room
     */
    async joinRoom(preferences = {}) {
        const {
            audioEnabled = true,
            videoEnabled = true
        } = preferences;

        if (!this.authToken) {
            throw new Error('Cannot join room: no auth token');
        }

        console.log('[HMS SDK] Joining room...');

        try {
            await this.hmsActions.join({
                userName: this.userName,
                authToken: this.authToken,
                settings: {
                    isAudioMuted: !audioEnabled,
                    isVideoMuted: !videoEnabled
                }
            });

            this.isJoined = true;
            console.log('[HMS SDK] ✅ Joined room successfully');

        } catch (error) {
            console.error('[HMS SDK] ❌ Failed to join room:', error);
            throw error;
        }
    }

    /**
     * Leave the room
     */
    async leaveRoom() {
        if (this.hmsActions && this.isJoined) {
            await this.hmsActions.leave();
            this.isJoined = false;
            console.log('[HMS SDK] Left room');
        }
    }

    /**
     * Get share link for guests
     */
    getShareLink() {
        if (!this.roomCode) {
            return null;
        }
        const baseUrl = window.location.origin;
        return `${baseUrl}/guest/${this.roomCode}`;
    }

    /**
     * Subscribe to room state changes
     */
    subscribeToRoom(callback) {
        if (!this.hmsStore) {
            console.error('[HMS SDK] Store not initialized');
            return;
        }

        // Subscribe to room state
        this.hmsStore.subscribe(callback, state => state);
    }

    /**
     * Get local peer (yourself)
     */
    getLocalPeer() {
        if (!this.hmsStore) return null;
        return this.hmsStore.getState(state => state.localPeer);
    }

    /**
     * Get all remote peers
     */
    getRemotePeers() {
        if (!this.hmsStore) return [];
        return this.hmsStore.getState(state => state.remotePeers);
    }

    /**
     * Toggle local audio
     */
    async toggleAudio() {
        if (!this.hmsActions) return;
        const enabled = !this.hmsStore.getState(state => state.localPeer?.audioEnabled);
        await this.hmsActions.setLocalAudioEnabled(enabled);
        return enabled;
    }

    /**
     * Toggle local video
     */
    async toggleVideo() {
        if (!this.hmsActions) return;
        const enabled = !this.hmsStore.getState(state => state.localPeer?.videoEnabled);
        await this.hmsActions.setLocalVideoEnabled(enabled);
        return enabled;
    }

    /**
     * Send chat message
     */
    async sendMessage(message) {
        if (!this.hmsActions) return;
        await this.hmsActions.sendBroadcastMessage(message);
    }
}

// Export for global use
window.ProfessionalMeetingSDK = ProfessionalMeetingSDK;
console.log('[HMS SDK] ✅ ProfessionalMeetingSDK loaded');
