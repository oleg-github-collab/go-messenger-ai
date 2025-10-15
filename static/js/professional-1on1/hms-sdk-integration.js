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
        this.inviteURL = null;
        this.hostURL = null;
        this.maxParticipants = 20;
        this.participantCount = 0;
        this.participantRegistered = false;
        this.isScreenSharing = false;
        this.isRecording = false;

        console.log('[HMS SDK] Initializing Professional Meeting SDK');
    }

    /**
     * Initialize for HOST (Oleh)
     * Creates a new room and gets auth token
     */
    async initAsHost(userName = 'Oleh', options = {}) {
        console.log('[HMS SDK] Initializing as HOST');
        this.role = 'host';
        this.userName = userName;
        this.userId = 'host-' + Date.now();
        this.roomCode = options.inviteCode || this.roomCode;
        this.participantRegistered = false;

        try {
            if (this.roomCode) {
                console.log('[HMS SDK] Step 1: Loading existing invite...');
                const invite = await this.fetchInviteDetails(this.roomCode);

                if (!invite || !invite.hms_room_id) {
                    throw new Error('Invite not found or invalid');
                }

                this.hmsRoomId = invite.hms_room_id;
                this.inviteURL = invite.invite_url || this.inviteURL;
                this.hostURL = invite.host_url || this.hostURL;
                this.maxParticipants = invite.max_participants || this.maxParticipants;
                this.participantCount = invite.participant_count || this.participantCount;
                console.log('[HMS SDK] ✅ Invite loaded:', this.roomCode, '→ HMS room', this.hmsRoomId);

                await this.registerParticipant(this.userName, 'host');
            } else {
                // Step 1: Create room via backend
                console.log('[HMS SDK] Step 1: Creating room...');
                const roomResponse = await this.createRoom();

                if (!roomResponse || !roomResponse.id) {
                    throw new Error('Failed to create room - no room ID returned');
                }

                this.hmsRoomId = roomResponse.id;
                this.roomCode = roomResponse.invite_code || this.roomCode;
                this.inviteURL = roomResponse.invite_url || this.inviteURL;
                this.hostURL = roomResponse.host_url || this.hostURL;
                this.maxParticipants = roomResponse.max_participants || this.maxParticipants;
                this.participantCount = roomResponse.participant_count || this.participantCount;

                console.log('[HMS SDK] ✅ Room created:', this.hmsRoomId, 'Invite:', this.roomCode);

                await this.registerParticipant(this.userName, 'host');
            }

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
                shareLink: this.getShareLink(),
                hostLink: this.getHostLink(),
                inviteCode: this.roomCode
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
        this.participantRegistered = false;

        try {
            // Step 1: Get room info from backend
            console.log('[HMS SDK] Step 1: Getting invite info...');
            const roomInfo = await this.fetchInviteDetails(this.roomCode);

            if (!roomInfo || !roomInfo.hms_room_id) {
                throw new Error('Room not found or invalid room code');
            }

            this.hmsRoomId = roomInfo.hms_room_id;
            this.inviteURL = roomInfo.invite_url || this.inviteURL;
            this.hostURL = roomInfo.host_url || this.hostURL;
            this.maxParticipants = roomInfo.max_participants || this.maxParticipants;
            this.participantCount = roomInfo.participant_count || this.participantCount;
            console.log('[HMS SDK] ✅ Room found:', this.hmsRoomId);

            // Step 2: Register participant to enforce capacity
            console.log('[HMS SDK] Step 2: Registering participant...');
            await this.registerParticipant(this.userName, 'guest');

            // Step 3: Get auth token for guest
            console.log('[HMS SDK] Step 3: Getting auth token...');
            this.authToken = await this.getAuthToken();

            if (!this.authToken) {
                throw new Error('Failed to get auth token');
            }

            console.log('[HMS SDK] ✅ Auth token received');

            // Step 4: Initialize HMS SDK
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

        const data = await response.json();

        if (data) {
            this.roomCode = data.invite_code || this.roomCode;
            this.inviteURL = data.invite_url || this.inviteURL;
            this.hostURL = data.host_url || this.hostURL;
            this.maxParticipants = data.max_participants || this.maxParticipants;
            this.participantCount = data.participant_count || this.participantCount;
        }

        return data;
    }

    /**
     * Get room info by room code
     */
    async getRoomInfo() {
        if (!this.roomCode) {
            throw new Error('No invite code set');
        }

        return await this.fetchInviteDetails(this.roomCode);
    }

    async fetchInviteDetails(code) {
        const response = await fetch(`/api/professional/invite/${code}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Invite lookup failed');
        }

        const data = await response.json();

        if (data) {
            this.roomCode = data.code || this.roomCode;
            this.hmsRoomId = data.hms_room_id || this.hmsRoomId;
            this.inviteURL = data.invite_url || this.inviteURL;
            this.hostURL = data.host_url || this.hostURL;
            if (typeof data.max_participants === 'number') {
                this.maxParticipants = data.max_participants;
            }
            if (typeof data.participant_count === 'number') {
                this.participantCount = data.participant_count;
            }
        }

        return data;
    }

    async registerParticipant(name, role = this.role || 'guest') {
        if (!this.roomCode) {
            throw new Error('No invite code set for registration');
        }

        const response = await fetch(`/api/professional/invite/${this.roomCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name,
                role
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to register participant');
        }

        const data = await response.json();

        if (data) {
            if (typeof data.participant_count === 'number') {
                this.participantCount = data.participant_count;
            }
            if (typeof data.max_participants === 'number') {
                this.maxParticipants = data.max_participants;
            }
        }

        this.participantRegistered = true;
        return data;
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
    getShareLink(type = 'guest') {
        const baseUrl = window.location.origin;

        if (type === 'host') {
            if (this.hostURL) {
                return this.hostURL;
            }
            if (this.roomCode) {
                return `${baseUrl}/professional/${this.roomCode}?host=true`;
            }
            return null;
        }

        if (this.inviteURL) {
            return this.inviteURL;
        }

        if (this.roomCode) {
            return `${baseUrl}/professional/${this.roomCode}`;
        }

        return null;
    }

    getHostLink() {
        return this.getShareLink('host');
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
        console.debug('[HMS SDK] Local audio set to', enabled);
        return enabled;
    }

    /**
     * Toggle local video
     */
    async toggleVideo() {
        if (!this.hmsActions) return;
        const enabled = !this.hmsStore.getState(state => state.localPeer?.videoEnabled);
        await this.hmsActions.setLocalVideoEnabled(enabled);
        console.debug('[HMS SDK] Local video set to', enabled);
        return enabled;
    }

    async toggleScreenshare(enable) {
        if (!this.hmsActions) return;
        try {
            if (enable) {
                if (typeof this.hmsActions.startScreenShare === 'function') {
                    await this.hmsActions.startScreenShare();
                    this.isScreenSharing = true;
                } else {
                    throw new Error('Screenshare is not supported in this build');
                }
            } else {
                if (typeof this.hmsActions.stopScreenShare === 'function') {
                    await this.hmsActions.stopScreenShare();
                }
                this.isScreenSharing = false;
            }
        } catch (error) {
            this.isScreenSharing = false;
            throw error;
        }
    }

    async toggleRecording(enable) {
        if (!this.hmsActions) return;
        try {
            if (enable) {
                if (typeof this.hmsActions.startRTMPOrRecording === 'function') {
                    await this.hmsActions.startRTMPOrRecording({
                        meetingURL: window.location.href,
                        record: true,
                        rtmpURLs: []
                    });
                    this.isRecording = true;
                } else {
                    throw new Error('Recording is not supported in this build');
                }
            } else {
                if (typeof this.hmsActions.stopRTMPAndRecording === 'function') {
                    await this.hmsActions.stopRTMPAndRecording();
                }
                this.isRecording = false;
            }
        } catch (error) {
            this.isRecording = false;
            throw error;
        }
    }

    /**
     * Send chat message
     */
    async sendMessage(message) {
        if (!this.hmsActions) return;
        await this.hmsActions.sendBroadcastMessage(message);
        console.debug('[HMS SDK] Broadcast message sent');
    }
}

// Export for global use
window.ProfessionalMeetingSDK = ProfessionalMeetingSDK;
console.log('[HMS SDK] ✅ ProfessionalMeetingSDK loaded');
