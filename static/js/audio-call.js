/**
 * 1-on-1 Audio Call (P2P WebRTC)
 * Simple peer-to-peer audio calls without video
 */

class AudioCall {
    constructor(config) {
        this.roomId = config.roomId;
        this.userName = config.userName || 'Guest';
        this.isHost = config.isHost || false;
        this.ws = null;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;

        // Event handlers
        this.onConnected = config.onConnected || (() => {});
        this.onDisconnected = config.onDisconnected || (() => {});
        this.onError = config.onError || ((error) => console.error(error));
        this.onRemoteStream = config.onRemoteStream || (() => {});
    }

    /**
     * Start the audio call
     */
    async start() {
        try {
            console.log('[AUDIO] Starting call...');

            // Get user microphone
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false
            });

            console.log('[AUDIO] ✅ Got microphone access');

            // Create peer connection
            this.createPeerConnection();

            // Add audio track
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });

            // Connect WebSocket for signaling
            await this.connectWebSocket();

            console.log('[AUDIO] ✅ Call started');

        } catch (error) {
            console.error('[AUDIO] ❌ Failed to start call:', error);
            this.onError(error);
            throw error;
        }
    }

    /**
     * Create WebRTC peer connection
     */
    createPeerConnection() {
        // STUN servers (free, no TURN needed for audio)
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };

        this.peerConnection = new RTCPeerConnection(configuration);

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[AUDIO] 🧊 Sending ICE candidate');
                this.sendSignal({
                    type: 'ice-candidate',
                    data: JSON.stringify(event.candidate)
                });
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('[AUDIO] 🎵 Received remote audio stream');
            this.remoteStream = event.streams[0];
            this.onRemoteStream(this.remoteStream);
        };

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection.connectionState;
            console.log('[AUDIO] Connection state:', state);

            if (state === 'connected') {
                this.onConnected();
            } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
                this.onDisconnected();
            }
        };

        console.log('[AUDIO] ✅ Peer connection created');
    }

    /**
     * Connect WebSocket for signaling
     */
    connectWebSocket() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws-audio?room=${this.roomId}&name=${encodeURIComponent(this.userName)}&isHost=${this.isHost}`;

            console.log('[AUDIO] Connecting to:', wsUrl);

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('[AUDIO] ✅ WebSocket connected');
                resolve();
            };

            this.ws.onmessage = async (event) => {
                try {
                    const message = JSON.parse(event.data);
                    await this.handleSignal(message);
                } catch (error) {
                    console.error('[AUDIO] ❌ Error handling message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[AUDIO] ❌ WebSocket error:', error);
                reject(error);
            };

            this.ws.onclose = () => {
                console.log('[AUDIO] 🚪 WebSocket closed');
                this.onDisconnected();
            };
        });
    }

    /**
     * Handle incoming signaling messages
     */
    async handleSignal(message) {
        console.log('[AUDIO] 📨 Received signal:', message.type);

        switch (message.type) {
            case 'joined':
                // Successfully joined room
                console.log('[AUDIO] ✅ Joined room:', message.data);
                break;

            case 'peer-joined':
                // Another peer joined, create and send offer
                console.log('[AUDIO] 👥 Peer joined, creating offer...');
                await this.createOffer();
                break;

            case 'offer':
                // Received offer, create answer
                console.log('[AUDIO] 📥 Received offer');
                await this.handleOffer(JSON.parse(message.data));
                break;

            case 'answer':
                // Received answer
                console.log('[AUDIO] 📥 Received answer');
                await this.handleAnswer(JSON.parse(message.data));
                break;

            case 'ice-candidate':
                // Received ICE candidate
                console.log('[AUDIO] 🧊 Received ICE candidate');
                await this.handleIceCandidate(JSON.parse(message.data));
                break;

            case 'peer-left':
                // Peer left
                console.log('[AUDIO] 👋 Peer left');
                this.onDisconnected();
                break;

            default:
                console.log('[AUDIO] ⚠️  Unknown message type:', message.type);
        }
    }

    /**
     * Create and send offer
     */
    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            this.sendSignal({
                type: 'offer',
                data: JSON.stringify(offer)
            });

            console.log('[AUDIO] ✅ Offer sent');
        } catch (error) {
            console.error('[AUDIO] ❌ Error creating offer:', error);
        }
    }

    /**
     * Handle incoming offer
     */
    async handleOffer(offer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.sendSignal({
                type: 'answer',
                data: JSON.stringify(answer)
            });

            console.log('[AUDIO] ✅ Answer sent');
        } catch (error) {
            console.error('[AUDIO] ❌ Error handling offer:', error);
        }
    }

    /**
     * Handle incoming answer
     */
    async handleAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[AUDIO] ✅ Answer processed');
        } catch (error) {
            console.error('[AUDIO] ❌ Error handling answer:', error);
        }
    }

    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[AUDIO] ✅ ICE candidate added');
        } catch (error) {
            console.error('[AUDIO] ❌ Error adding ICE candidate:', error);
        }
    }

    /**
     * Send signaling message via WebSocket
     */
    sendSignal(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.error('[AUDIO] ❌ WebSocket not ready');
        }
    }

    /**
     * Toggle microphone mute
     */
    toggleMute() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                console.log('[AUDIO] 🎤 Microphone:', audioTrack.enabled ? 'ON' : 'OFF');
                return audioTrack.enabled;
            }
        }
        return false;
    }

    /**
     * Get microphone mute status
     */
    isMuted() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            return audioTrack ? !audioTrack.enabled : true;
        }
        return true;
    }

    /**
     * End the call
     */
    async end() {
        console.log('[AUDIO] Ending call...');

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Close WebSocket
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        console.log('[AUDIO] ✅ Call ended');
    }

    /**
     * Get call statistics
     */
    async getStats() {
        if (!this.peerConnection) return null;

        try {
            const stats = await this.peerConnection.getStats();
            const result = {
                audio: {},
                connection: {}
            };

            stats.forEach(stat => {
                if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
                    result.audio.bytesReceived = stat.bytesReceived;
                    result.audio.packetsReceived = stat.packetsReceived;
                    result.audio.packetsLost = stat.packetsLost;
                } else if (stat.type === 'outbound-rtp' && stat.kind === 'audio') {
                    result.audio.bytesSent = stat.bytesSent;
                    result.audio.packetsSent = stat.packetsSent;
                } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
                    result.connection.currentRoundTripTime = stat.currentRoundTripTime;
                    result.connection.availableOutgoingBitrate = stat.availableOutgoingBitrate;
                }
            });

            return result;
        } catch (error) {
            console.error('[AUDIO] ❌ Error getting stats:', error);
            return null;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioCall;
}
