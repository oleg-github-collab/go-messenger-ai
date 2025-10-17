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
        this.activeRecordingMode = null;

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
        if (!this.hmsActions) {
            console.error('[HMS SDK] toggleAudio - hmsActions not available');
            return false;
        }

        try {
            const peer = this.hmsStore?.getState(state => state.localPeer);
            const currentState = peer?.audioEnabled ?? true;
            const targetState = !currentState;

            console.debug('[HMS SDK] Audio toggle:', { currentState, targetState, hasTrack: !!peer?.audioTrack });

            // If enabling and no track exists, we need to request media permissions first
            if (targetState && !peer?.audioTrack) {
                console.log('[HMS SDK] No audio track - requesting media permissions');

                try {
                    // Request audio track through navigator
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

                    // Replace the audio track in HMS
                    const audioTrack = stream.getAudioTracks()[0];
                    if (audioTrack) {
                        await this.hmsActions.setLocalAudioEnabled(true);
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Verify track was added
                        const verifyPeer = this.hmsStore?.getState(state => state.localPeer);
                        console.log('[HMS SDK] Audio track added:', { hasTrack: !!verifyPeer?.audioTrack, enabled: verifyPeer?.audioEnabled });
                        return verifyPeer?.audioEnabled ?? true;
                    }
                } catch (mediaError) {
                    console.error('[HMS SDK] Failed to get audio permissions:', mediaError);
                    return false;
                }
            }

            // Normal toggle
            await this.hmsActions.setLocalAudioEnabled(targetState);

            // Wait for state propagation
            await new Promise(resolve => setTimeout(resolve, 300));

            // Verify the change
            const updatedPeer = this.hmsStore?.getState(state => state.localPeer);
            const actualState = updatedPeer?.audioEnabled ?? targetState;

            console.debug('[HMS SDK] Audio toggle complete:', { actualState, hasTrack: !!updatedPeer?.audioTrack });
            return actualState;

        } catch (error) {
            console.error('[HMS SDK] Audio toggle failed:', error);
            const peer = this.hmsStore?.getState(state => state.localPeer);
            return peer?.audioEnabled ?? false;
        }
    }

    /**
     * Toggle local video
     */
    async toggleVideo() {
        if (!this.hmsActions) {
            console.error('[HMS SDK] toggleVideo - hmsActions not available');
            return false;
        }

        try {
            const peer = this.hmsStore?.getState(state => state.localPeer);
            const currentState = peer?.videoEnabled ?? true;
            const targetState = !currentState;

            console.debug('[HMS SDK] Video toggle:', { currentState, targetState, hasTrack: !!peer?.videoTrack });

            // If enabling and no track exists, we need to request media permissions first
            if (targetState && !peer?.videoTrack) {
                console.log('[HMS SDK] No video track - requesting media permissions');

                try {
                    // Request video track through navigator
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: 'user'
                        }
                    });

                    // Replace the video track in HMS
                    const videoTrack = stream.getVideoTracks()[0];
                    if (videoTrack) {
                        await this.hmsActions.setLocalVideoEnabled(true);
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // Verify track was added
                        const verifyPeer = this.hmsStore?.getState(state => state.localPeer);
                        console.log('[HMS SDK] Video track added:', { hasTrack: !!verifyPeer?.videoTrack, enabled: verifyPeer?.videoEnabled });
                        return verifyPeer?.videoEnabled ?? true;
                    }
                } catch (mediaError) {
                    console.error('[HMS SDK] Failed to get video permissions:', mediaError);
                    return false;
                }
            }

            // Normal toggle
            await this.hmsActions.setLocalVideoEnabled(targetState);

            // Wait for state propagation
            await new Promise(resolve => setTimeout(resolve, 300));

            // Verify the change
            const updatedPeer = this.hmsStore?.getState(state => state.localPeer);
            const actualState = updatedPeer?.videoEnabled ?? targetState;

            console.debug('[HMS SDK] Video toggle complete:', { actualState, hasTrack: !!updatedPeer?.videoTrack });
            return actualState;

        } catch (error) {
            console.error('[HMS SDK] Video toggle failed:', error);
            const peer = this.hmsStore?.getState(state => state.localPeer);
            return peer?.videoEnabled ?? false;
        }
    }

    async toggleScreenshare(enable) {
        if (!this.hmsActions) return;
        try {
            if (enable) {
                // Try HMS SDK method first
                if (typeof this.hmsActions.setScreenShareEnabled === 'function') {
                    await this.hmsActions.setScreenShareEnabled(true);
                    this.isScreenSharing = true;
                    console.debug('[HMS SDK] Screen share enabled via HMS');
                } else if (typeof this.hmsActions.startScreenshare === 'function') {
                    await this.hmsActions.startScreenshare();
                    this.isScreenSharing = true;
                    console.debug('[HMS SDK] Screen share started via HMS');
                } else {
                    // Fallback: use native getDisplayMedia
                    console.debug('[HMS SDK] Using native screen share fallback');
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({
                        video: {
                            cursor: 'always',
                            displaySurface: 'monitor'
                        }
                    });

                    // Replace video track with screen share track
                    const screenTrack = screenStream.getVideoTracks()[0];
                    if (screenTrack) {
                        // Stop when user clicks browser's "Stop sharing" button
                        screenTrack.addEventListener('ended', () => {
                            this.isScreenSharing = false;
                            console.debug('[HMS SDK] Screen share ended by user');
                        });

                        // Try to replace track in HMS
                        if (typeof this.hmsActions.setScreenShareEnabled === 'function') {
                            await this.hmsActions.setScreenShareEnabled(true, screenTrack);
                        }
                        this.isScreenSharing = true;
                    }
                }
            } else {
                // Stop screen share
                if (typeof this.hmsActions.setScreenShareEnabled === 'function') {
                    await this.hmsActions.setScreenShareEnabled(false);
                } else if (typeof this.hmsActions.stopScreenshare === 'function') {
                    await this.hmsActions.stopScreenshare();
                }
                this.isScreenSharing = false;
                console.debug('[HMS SDK] Screen share stopped');
            }
        } catch (error) {
            this.isScreenSharing = false;
            console.error('[HMS SDK] Screen share error:', error);
            throw error;
        }
    }

    async toggleRecording(enable) {
        if (!this.hmsActions) {
            return { success: false, mode: null };
        }
        try {
            if (enable) {
                if (typeof this.hmsActions.startRTMPOrRecording === 'function') {
                    await this.hmsActions.startRTMPOrRecording({
                        meetingURL: window.location.href,
                        record: true,
                        rtmpURLs: []
                    });
                    this.isRecording = true;
                    this.activeRecordingMode = 'cloud';
                    return { success: true, mode: 'cloud' };
                }
                const err = new Error('Cloud recording is not available on this account.');
                err.code = 'CLOUD_RECORDING_UNAVAILABLE';
                throw err;
            } else {
                if (this.activeRecordingMode === 'cloud' &&
                    typeof this.hmsActions.stopRTMPAndRecording === 'function' &&
                    this.isRecording) {
                    await this.hmsActions.stopRTMPAndRecording();
                }
                this.isRecording = false;
                const previousMode = this.activeRecordingMode || 'cloud';
                this.activeRecordingMode = null;
                return { success: true, mode: previousMode };
            }
        } catch (error) {
            this.isRecording = false;
            this.activeRecordingMode = null;
            if (!error.code) {
                error.code = 'CLOUD_RECORDING_FAILED';
            }
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
