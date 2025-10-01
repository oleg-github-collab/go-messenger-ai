// WebRTC Implementation for Kaminskyi AI Messenger

class WebRTCManager {
    constructor(socket, roomID) {
        this.socket = socket;
        this.roomID = roomID;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.currentCameraId = null;
        this.turnConfigLoaded = false;

        // Video/Audio elements (support both old and new UI)
        this.localVideo = document.getElementById('localVideo');
        this.remoteVideo = document.getElementById('remoteVideo');
        this.localPlaceholder = document.getElementById('localPlaceholder');
        this.remotePlaceholder = document.getElementById('remotePlaceholder');
        this.connectionStatus = document.getElementById('connectionStatus');

        // ICE servers for STUN/TURN (multiple for reliability)
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
                { urls: 'stun:stun.services.mozilla.com' },
                { urls: 'stun:stun.voip.blackberry.com:3478' }
            ],
            iceCandidatePoolSize: 10
        };

        // Load TURN credentials
        this.loadTURNCredentials();

        // Current quality settings
        this.currentConstraints = this.getConstraints('1080p', 30, 'high');
    }

    async loadTURNCredentials() {
        try {
            const response = await fetch('/api/turn-credentials');
            const creds = await response.json();

            if (creds.host && creds.username && creds.password) {
                const turnServer = {
                    urls: [
                        `turn:${creds.host}:3478?transport=udp`,
                        `turn:${creds.host}:3478?transport=tcp`
                    ],
                    username: creds.username,
                    credential: creds.password
                };

                this.iceServers.iceServers.push(turnServer);
                this.turnConfigLoaded = true;
                console.log('[WebRTC] ✅ TURN server configured:', creds.host);
            } else {
                console.warn('[WebRTC] ⚠️  TURN credentials not available');
            }
        } catch (err) {
            console.error('[WebRTC] Failed to load TURN credentials:', err);
        }
    }

    getConstraints(videoQuality, frameRate, audioQuality) {
        const videoResolutions = {
            '4k': { width: 3840, height: 2160 },
            '1080p': { width: 1920, height: 1080 },
            '720p': { width: 1280, height: 720 },
            '480p': { width: 854, height: 480 }
        };

        const audioSettings = {
            'high': { sampleRate: 48000, channelCount: 2 },
            'medium': { sampleRate: 44100, channelCount: 2 },
            'low': { sampleRate: 32000, channelCount: 1 }
        };

        const resolution = videoResolutions[videoQuality];
        const audio = audioSettings[audioQuality];

        return {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: audio.sampleRate,
                channelCount: audio.channelCount
            },
            video: {
                width: { ideal: resolution.width },
                height: { ideal: resolution.height },
                frameRate: { ideal: frameRate },
                facingMode: 'user'
            }
        };
    }

    async initialize() {
        try {
            console.log('[WebRTC] Initializing with constraints:', this.currentConstraints);

            // Wait for TURN credentials (max 2 seconds)
            if (!this.turnConfigLoaded) {
                console.log('[WebRTC] Waiting for TURN credentials...');
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia(this.currentConstraints);

            // Show local video
            this.localVideo.srcObject = this.localStream;
            if (this.localPlaceholder) {
                this.localPlaceholder.classList.add('hidden');
                this.localPlaceholder.style.display = 'none';
            }

            console.log('[WebRTC] ✅ Local stream acquired');

            // Create peer connection
            this.createPeerConnection();

            // Add local tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
                console.log('[WebRTC] Added track:', track.kind);
            });

            return true;
        } catch (error) {
            console.error('[WebRTC] Failed to initialize:', error);
            this.updateStatus('Camera/microphone access denied', 'error');
            return false;
        }
    }

    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection(this.iceServers);

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Sending ICE candidate');
                this.socket.send(JSON.stringify({
                    type: 'ice-candidate',
                    data: JSON.stringify(event.candidate)
                }));
            }
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTC] ✅ Received remote track:', event.track.kind);

            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                this.remoteVideo.srcObject = this.remoteStream;
            }

            this.remoteStream.addTrack(event.track);
            if (this.remotePlaceholder) {
                this.remotePlaceholder.classList.add('hidden');
                this.remotePlaceholder.style.display = 'none';
            }
            this.updateStatus('Connected', 'success');
        };

        // Handle connection state
        this.peerConnection.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', this.peerConnection.connectionState);

            switch (this.peerConnection.connectionState) {
                case 'connected':
                    this.updateStatus('Connected', 'success');
                    break;
                case 'disconnected':
                    this.updateStatus('Disconnected', 'warning');
                    break;
                case 'failed':
                    this.updateStatus('Connection failed', 'error');
                    this.reconnect();
                    break;
            }
        };

        // Handle ICE connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE state:', this.peerConnection.iceConnectionState);
        };
    }

    async createOffer() {
        try {
            console.log('[WebRTC] Creating offer...');
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            await this.peerConnection.setLocalDescription(offer);

            this.socket.send(JSON.stringify({
                type: 'offer',
                data: JSON.stringify(offer)
            }));

            console.log('[WebRTC] ✅ Offer sent');
        } catch (error) {
            console.error('[WebRTC] Failed to create offer:', error);
        }
    }

    async handleOffer(offer) {
        try {
            console.log('[WebRTC] Received offer');

            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);

            this.socket.send(JSON.stringify({
                type: 'answer',
                data: JSON.stringify(answer)
            }));

            console.log('[WebRTC] ✅ Answer sent');
        } catch (error) {
            console.error('[WebRTC] Failed to handle offer:', error);
        }
    }

    async handleAnswer(answer) {
        try {
            console.log('[WebRTC] Received answer');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[WebRTC] ✅ Answer processed');
        } catch (error) {
            console.error('[WebRTC] Failed to handle answer:', error);
        }
    }

    async handleICECandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('[WebRTC] ✅ ICE candidate added');
        } catch (error) {
            console.error('[WebRTC] Failed to add ICE candidate:', error);
        }
    }

    async changeQuality(videoQuality, frameRate, audioQuality) {
        try {
            console.log('[WebRTC] Changing quality to:', { videoQuality, frameRate, audioQuality });

            // Stop current tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
            }

            // Get new constraints
            this.currentConstraints = this.getConstraints(videoQuality, frameRate, audioQuality);

            // Get new stream
            this.localStream = await navigator.mediaDevices.getUserMedia(this.currentConstraints);
            this.localVideo.srcObject = this.localStream;

            // Replace tracks in peer connection
            const videoTrack = this.localStream.getVideoTracks()[0];
            const audioTrack = this.localStream.getAudioTracks()[0];

            const senders = this.peerConnection.getSenders();

            senders.forEach(sender => {
                if (sender.track.kind === 'video' && videoTrack) {
                    sender.replaceTrack(videoTrack);
                } else if (sender.track.kind === 'audio' && audioTrack) {
                    sender.replaceTrack(audioTrack);
                }
            });

            console.log('[WebRTC] ✅ Quality changed successfully');
            return true;
        } catch (error) {
            console.error('[WebRTC] Failed to change quality:', error);
            return false;
        }
    }

    toggleAudio(enabled) {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = enabled;
                console.log('[WebRTC] Audio:', enabled ? 'ON' : 'OFF');
            }
        }
    }

    toggleVideo(enabled) {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = enabled;
                console.log('[WebRTC] Video:', enabled ? 'ON' : 'OFF');

                if (this.localPlaceholder) {
                    if (!enabled) {
                        this.localPlaceholder.classList.remove('hidden');
                        this.localPlaceholder.style.display = 'flex';
                    } else {
                        this.localPlaceholder.classList.add('hidden');
                        this.localPlaceholder.style.display = 'none';
                    }
                }
            }
        }
    }

    async getDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const cameras = devices.filter(d => d.kind === 'videoinput');
            const microphones = devices.filter(d => d.kind === 'audioinput');

            return { cameras, microphones };
        } catch (error) {
            console.error('[WebRTC] Failed to get devices:', error);
            return { cameras: [], microphones: [] };
        }
    }

    async switchCamera(deviceId) {
        try {
            const constraints = {
                ...this.currentConstraints,
                video: {
                    ...this.currentConstraints.video,
                    deviceId: { exact: deviceId }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const videoTrack = stream.getVideoTracks()[0];

            const senders = this.peerConnection.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');

            if (videoSender) {
                await videoSender.replaceTrack(videoTrack);

                // Update local stream
                const oldTrack = this.localStream.getVideoTracks()[0];
                oldTrack.stop();
                this.localStream.removeTrack(oldTrack);
                this.localStream.addTrack(videoTrack);

                console.log('[WebRTC] ✅ Camera switched');
            }
        } catch (error) {
            console.error('[WebRTC] Failed to switch camera:', error);
        }
    }

    async switchMicrophone(deviceId) {
        try {
            const constraints = {
                ...this.currentConstraints,
                audio: {
                    ...this.currentConstraints.audio,
                    deviceId: { exact: deviceId }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            const audioTrack = stream.getAudioTracks()[0];

            const senders = this.peerConnection.getSenders();
            const audioSender = senders.find(s => s.track && s.track.kind === 'audio');

            if (audioSender) {
                await audioSender.replaceTrack(audioTrack);

                // Update local stream
                const oldTrack = this.localStream.getAudioTracks()[0];
                oldTrack.stop();
                this.localStream.removeTrack(oldTrack);
                this.localStream.addTrack(audioTrack);

                console.log('[WebRTC] ✅ Microphone switched');
            }
        } catch (error) {
            console.error('[WebRTC] Failed to switch microphone:', error);
        }
    }

    reconnect() {
        console.log('[WebRTC] Attempting to reconnect...');
        this.updateStatus('Reconnecting...', 'warning');

        // Close existing connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        // Create new connection
        this.createPeerConnection();

        // Re-add tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
        }

        // Create new offer
        this.createOffer();
    }

    updateStatus(message, type = 'info') {
        if (this.connectionStatus) {
            this.connectionStatus.textContent = message;
            this.connectionStatus.className = `status status-${type}`;
        }
    }

    cleanup() {
        console.log('[WebRTC] Cleaning up...');

        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
        }

        // Clear video elements
        if (this.localVideo) {
            this.localVideo.srcObject = null;
        }

        if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
        }
    }
}
