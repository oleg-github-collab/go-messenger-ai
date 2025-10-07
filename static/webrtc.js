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

        // ICE servers for STUN/TURN (optimized for Germany-Ukraine connections)
        this.iceServers = {
            iceServers: [
                // Multiple STUN servers for redundancy
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },

                // Cloudflare TURN (global anycast - excellent for EU-UA)
                {
                    urls: [
                        'turn:turn.cloudflare.com:3478',
                        'turn:turn.cloudflare.com:3478?transport=tcp',
                        'turns:turn.cloudflare.com:5349?transport=tcp'
                    ],
                    username: 'cloudflare',
                    credential: 'cloudflare'
                },

                // Twilio TURN (multi-region with EU presence)
                {
                    urls: [
                        'turn:global.turn.twilio.com:3478?transport=udp',
                        'turn:global.turn.twilio.com:3478?transport=tcp',
                        'turn:global.turn.twilio.com:443?transport=tcp'
                    ],
                    username: 'free',
                    credential: 'free'
                },

                // OpenRelay (Canada, but reliable fallback)
                {
                    urls: [
                        'turn:openrelay.metered.ca:80',
                        'turn:openrelay.metered.ca:443',
                        'turn:openrelay.metered.ca:443?transport=tcp'
                    ],
                    username: 'openrelayproject',
                    credential: 'openrelayproject'
                },

                // Metered (multiple regions)
                {
                    urls: [
                        'turn:a.relay.metered.ca:80',
                        'turn:a.relay.metered.ca:80?transport=tcp',
                        'turn:a.relay.metered.ca:443',
                        'turns:a.relay.metered.ca:443?transport=tcp'
                    ],
                    username: 'e8b7cb41726a21f41ffa0deb',
                    credential: 'M0xzGvuqQJFeKvIv'
                },

                // Numb TURN (Europe)
                {
                    urls: [
                        'turn:numb.viagenie.ca:3478',
                        'turn:numb.viagenie.ca:3478?transport=tcp'
                    ],
                    username: 'webrtc@live.com',
                    credential: 'muazkh'
                },

                // Stunprotocol (another reliable option)
                {
                    urls: 'turn:turn.stunprotocol.org:3478',
                    username: 'free',
                    credential: 'free'
                }
            ],
            iceCandidatePoolSize: 20, // Increased for better candidate gathering
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require',
            iceTransportPolicy: 'all' // Use both STUN and TURN aggressively
        };

        // Load TURN credentials
        this.loadTURNCredentials();

        // Current quality settings
        this.currentConstraints = this.getConstraints('1080p', 30, 'high');

        // Connection quality monitoring
        this.qualityMonitorInterval = null;
        this.currentBitrateLevel = 'high';
        this.consecutiveCriticalQuality = 0;
        this.lastQualityCheck = null;
    }

    async loadTURNCredentials() {
        try {
            console.log('[WebRTC] 📡 Fetching TURN credentials...');
            const response = await fetch('/api/turn-credentials');
            const creds = await response.json();
            console.log('[WebRTC] 📡 TURN credentials received:', { host: creds.host, username: creds.username, hasPassword: !!creds.password });

            if (creds.host && creds.username && creds.password) {
                // Ensure host doesn't contain port
                const host = creds.host.split(':')[0];

                const turnServer = {
                    urls: [
                        `turn:${host}:3478`,
                        `turn:${host}:3478?transport=tcp`
                    ],
                    username: creds.username,
                    credential: creds.password
                };

                console.log('[WebRTC] 🔧 TURN server URLs:', turnServer.urls);

                this.iceServers.iceServers.push(turnServer);
                this.turnConfigLoaded = true;
                console.log('[WebRTC] ✅ TURN server configured:', host);
                console.log('[WebRTC] 🔧 Total ICE Servers:', this.iceServers.iceServers.length);
            } else {
                console.warn('[WebRTC] ⚠️  TURN credentials incomplete:', creds);
            }
        } catch (err) {
            console.error('[WebRTC] ❌ Failed to load TURN credentials:', err);
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
            // Get user preferences from sessionStorage
            const enableVideo = sessionStorage.getItem('enableVideo') !== 'false';
            const enableAudio = sessionStorage.getItem('enableAudio') !== 'false';
            const cameraId = sessionStorage.getItem('cameraId');
            const microphoneId = sessionStorage.getItem('microphoneId');

            console.log('[WebRTC] 🎥 Media preferences:', { enableVideo, enableAudio, cameraId, microphoneId });

            // Override constraints with user preferences
            const constraints = {
                audio: enableAudio ? {
                    deviceId: microphoneId ? { exact: microphoneId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false,
                video: enableVideo ? {
                    deviceId: cameraId ? { exact: cameraId } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user'
                } : false
            };

            console.log('[WebRTC] Initializing with constraints:', constraints);

            // Wait for TURN credentials (max 3 seconds for better reliability)
            if (!this.turnConfigLoaded) {
                console.log('[WebRTC] Waiting for TURN credentials...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Create peer connection FIRST (before getting user media)
            this.createPeerConnection();
            console.log('[WebRTC] ✅ Peer connection created with', this.iceServers.iceServers.length, 'ICE servers');

            // Get user media
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Store current camera ID
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                this.currentCameraId = videoTrack.getSettings().deviceId;
                console.log('[WebRTC] 📹 Initial camera ID:', this.currentCameraId);
            }

            // Show local video
            this.localVideo.srcObject = this.localStream;
            if (this.localPlaceholder) {
                this.localPlaceholder.classList.add('hidden');
                this.localPlaceholder.style.display = 'none';
            }

            console.log('[WebRTC] ✅ Local stream acquired');

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

        // Handle ICE candidates - with null check
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] 🧊 Sending ICE candidate:', event.candidate.type);
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        type: 'ice-candidate',
                        data: JSON.stringify(event.candidate)
                    }));
                }
            } else {
                console.log('[WebRTC] 🧊 ICE gathering complete');
            }
        };

        // Handle ICE gathering state
        this.peerConnection.onicegatheringstatechange = () => {
            console.log('[WebRTC] 🧊 ICE gathering state:', this.peerConnection.iceGatheringState);
        };

        // Handle remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTC] ✅ Received remote track:', event.track.kind, 'readyState:', event.track.readyState);

            if (!this.remoteStream) {
                this.remoteStream = new MediaStream();
                this.remoteVideo.srcObject = this.remoteStream;
            }

            this.remoteStream.addTrack(event.track);

            // Monitor track state
            event.track.onended = () => {
                console.log('[WebRTC] ⚠️  Remote track ended:', event.track.kind);
            };

            event.track.onmute = () => {
                console.log('[WebRTC] 🔇 Remote track muted:', event.track.kind);
            };

            event.track.onunmute = () => {
                console.log('[WebRTC] 🔊 Remote track unmuted:', event.track.kind);
            };

            if (this.remotePlaceholder) {
                this.remotePlaceholder.classList.add('hidden');
                this.remotePlaceholder.style.display = 'none';
            }
            this.updateStatus('Connected', 'success');

            // Configure jitter buffer when track is added
            this.configureJitterBuffer();
        };

        // Handle connection state
        this.peerConnection.onconnectionstatechange = () => {
            console.log('[WebRTC] 🔗 Connection state:', this.peerConnection.connectionState);

            switch (this.peerConnection.connectionState) {
                case 'connecting':
                    this.updateStatus('Connecting...', 'warning');
                    break;
                case 'connected':
                    this.updateStatus('Connected', 'success');
                    console.log('[WebRTC] ✅ Peer connection established!');
                    // Start quality monitoring when connected
                    this.startQualityMonitoring();
                    break;
                case 'disconnected':
                    this.updateStatus('Disconnected', 'warning');
                    console.warn('[WebRTC] ⚠️  Connection disconnected');
                    break;
                case 'failed':
                    this.updateStatus('Connection failed', 'error');
                    console.error('[WebRTC] ❌ Connection failed');
                    // Try ICE restart first (faster than full reconnect)
                    this.restartIce();
                    break;
            }
        };

        // Handle ICE connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('[WebRTC] 🧊 ICE connection state:', this.peerConnection.iceConnectionState);

            switch (this.peerConnection.iceConnectionState) {
                case 'checking':
                    console.log('[WebRTC] 🧊 ICE checking...');
                    break;
                case 'connected':
                    console.log('[WebRTC] ✅ ICE connected!');
                    break;
                case 'completed':
                    console.log('[WebRTC] ✅ ICE completed!');
                    break;
                case 'failed':
                    console.error('[WebRTC] ❌ ICE connection failed');
                    this.updateStatus('Connection failed - recovering...', 'error');
                    // Immediate aggressive restart for Germany-Ukraine
                    this.restartIce();
                    break;
                case 'disconnected':
                    console.warn('[WebRTC] ⚠️  ICE disconnected');
                    this.updateStatus('Disconnected - reconnecting...', 'warning');
                    // Reduced timeout for faster recovery (1s instead of 3s)
                    setTimeout(() => {
                        if (this.peerConnection && this.peerConnection.iceConnectionState === 'disconnected') {
                            console.log('[WebRTC] Still disconnected after 1s, restarting ICE...');
                            this.restartIce();
                        }
                    }, 1000);
                    break;
            }
        };

        // Handle signaling state
        this.peerConnection.onsignalingstatechange = () => {
            console.log('[WebRTC] 📡 Signaling state:', this.peerConnection.signalingState);
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
                console.log('[WebRTC] 🎤 Audio track enabled:', audioTrack.enabled, 'readyState:', audioTrack.readyState);
            } else {
                console.warn('[WebRTC] ⚠️  No audio track found in localStream');
            }
        } else {
            console.warn('[WebRTC] ⚠️  No localStream available');
        }
    }

    async toggleVideo(enabled) {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                if (!enabled) {
                    // Turning OFF - just disable
                    videoTrack.enabled = false;
                    console.log('[WebRTC] Video: OFF');
                } else {
                    // Turning ON - restart track to ensure visibility
                    console.log('[WebRTC] Video: ON - Restarting track');

                    // Stop old track
                    videoTrack.stop();

                    try {
                        // Get fresh video stream
                        const newStream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: { ideal: 1920 },
                                height: { ideal: 1080 },
                                frameRate: { ideal: 30 },
                                facingMode: 'user'
                            }
                        });

                        const newVideoTrack = newStream.getVideoTracks()[0];

                        // Replace track in peer connection
                        const senders = this.peerConnection.getSenders();
                        const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                        if (videoSender) {
                            await videoSender.replaceTrack(newVideoTrack);
                        }

                        // Update local stream
                        this.localStream.removeTrack(videoTrack);
                        this.localStream.addTrack(newVideoTrack);

                        // Update video element
                        this.localVideo.srcObject = this.localStream;

                        console.log('[WebRTC] ✅ Video track restarted successfully');
                    } catch (error) {
                        console.error('[WebRTC] Failed to restart video:', error);
                        // Fallback: just enable the track
                        videoTrack.enabled = true;
                    }
                }

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

                // Update local video element
                this.localVideo.srcObject = this.localStream;

                // Store current camera ID
                this.currentCameraId = deviceId;

                console.log('[WebRTC] ✅ Camera switched to:', deviceId);
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

    async restartIce() {
        console.log('[WebRTC] 🔄 Attempting ICE restart (fast recovery)...');
        this.updateStatus('Reconnecting...', 'warning');

        try {
            // ICE restart - much faster than full reconnect
            const offer = await this.peerConnection.createOffer({ iceRestart: true });
            await this.peerConnection.setLocalDescription(offer);

            this.socket.send(JSON.stringify({
                type: 'offer',
                data: JSON.stringify(offer)
            }));

            console.log('[WebRTC] ✅ ICE restart offer sent');
        } catch (error) {
            console.error('[WebRTC] ICE restart failed, trying full reconnect:', error);
            this.reconnect();
        }
    }

    reconnect() {
        console.log('[WebRTC] Attempting full reconnect...');
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

    // Start connection quality monitoring
    startQualityMonitoring() {
        if (this.qualityMonitorInterval) {
            clearInterval(this.qualityMonitorInterval);
        }

        console.log('[WebRTC] 📊 Starting quality monitoring');

        this.qualityMonitorInterval = setInterval(async () => {
            if (!this.peerConnection) return;

            const quality = await this.calculateConnectionQuality();

            if (quality) {
                this.lastQualityCheck = quality;

                // Adaptive bitrate control based on quality
                if (quality.score < 0.3 && this.currentBitrateLevel !== 'low') {
                    console.log('[WebRTC] ⚠️ Poor connection, switching to low bitrate');
                    this.adjustBitrate('low');
                } else if (quality.score >= 0.3 && quality.score < 0.6 && this.currentBitrateLevel !== 'medium') {
                    console.log('[WebRTC] 📉 Fair connection, switching to medium bitrate');
                    this.adjustBitrate('medium');
                } else if (quality.score >= 0.6 && this.currentBitrateLevel !== 'high') {
                    console.log('[WebRTC] 📈 Good connection, switching to high bitrate');
                    this.adjustBitrate('high');
                }

                // Preemptive reconnection for critical quality
                if (quality.score < 0.3) {
                    this.consecutiveCriticalQuality++;
                    if (this.consecutiveCriticalQuality >= 3) {
                        console.log('[WebRTC] 🔄 Critical quality detected, initiating preemptive ICE restart');
                        this.peerConnection.restartIce();
                        this.consecutiveCriticalQuality = 0;
                    }
                } else {
                    this.consecutiveCriticalQuality = 0;
                }

                // Update UI with quality status
                let statusMessage = 'Connected';
                let statusType = 'success';

                if (quality.rating === 'excellent') {
                    statusMessage = 'Excellent connection';
                } else if (quality.rating === 'good') {
                    statusMessage = 'Good connection';
                } else if (quality.rating === 'poor') {
                    statusMessage = 'Poor connection';
                    statusType = 'warning';
                } else if (quality.rating === 'critical') {
                    statusMessage = 'Critical connection';
                    statusType = 'error';
                }

                this.updateStatus(statusMessage, statusType);
            }
        }, 2000); // Check every 2 seconds
    }

    // Calculate connection quality
    async calculateConnectionQuality() {
        if (!this.peerConnection) return null;

        try {
            const stats = await this.peerConnection.getStats();
            let packetLoss = 0;
            let rtt = 0;
            let jitter = 0;
            let bytesReceived = 0;

            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
                        const totalPackets = report.packetsLost + report.packetsReceived;
                        if (totalPackets > 0) {
                            packetLoss = (report.packetsLost / totalPackets) * 100;
                        }
                    }
                    if (report.jitter !== undefined) {
                        jitter = report.jitter * 1000; // Convert to ms
                    }
                    if (report.bytesReceived !== undefined) {
                        bytesReceived = report.bytesReceived;
                    }
                }

                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    if (report.currentRoundTripTime !== undefined) {
                        rtt = report.currentRoundTripTime * 1000; // Convert to ms
                    }
                }
            });

            // Calculate quality score (0-1)
            let score = 1.0;

            // Penalty for packet loss (0-5% = good, >10% = bad)
            if (packetLoss > 10) {
                score -= 0.5;
            } else if (packetLoss > 5) {
                score -= 0.3;
            } else if (packetLoss > 2) {
                score -= 0.1;
            }

            // Penalty for RTT (0-100ms = good, >300ms = bad)
            if (rtt > 300) {
                score -= 0.3;
            } else if (rtt > 200) {
                score -= 0.2;
            } else if (rtt > 100) {
                score -= 0.1;
            }

            // Penalty for jitter (0-30ms = good, >100ms = bad)
            if (jitter > 100) {
                score -= 0.2;
            } else if (jitter > 50) {
                score -= 0.1;
            }

            score = Math.max(0, Math.min(1, score));

            let rating = 'excellent';
            if (score < 0.3) rating = 'critical';
            else if (score < 0.6) rating = 'poor';
            else if (score < 0.8) rating = 'good';

            console.log(`[WebRTC] 📊 Quality: ${rating} (${(score * 100).toFixed(0)}%) | Loss: ${packetLoss.toFixed(1)}% | RTT: ${rtt.toFixed(0)}ms | Jitter: ${jitter.toFixed(1)}ms`);

            return { score, rating, packetLoss, rtt, jitter, bytesReceived };
        } catch (error) {
            console.error('[WebRTC] Failed to calculate quality:', error);
            return null;
        }
    }

    // Adjust bitrate based on connection quality
    async adjustBitrate(level) {
        if (!this.peerConnection) return;

        this.currentBitrateLevel = level;

        const bitrateSettings = {
            low: { video: 200000, audio: 32000, fps: 15 },      // 200 Kbps video, 32 Kbps audio
            medium: { video: 600000, audio: 48000, fps: 24 },   // 600 Kbps video, 48 Kbps audio
            high: { video: 1500000, audio: 64000, fps: 30 }     // 1.5 Mbps video, 64 Kbps audio
        };

        const settings = bitrateSettings[level];

        try {
            const senders = this.peerConnection.getSenders();

            for (const sender of senders) {
                if (!sender.track) continue;

                const params = sender.getParameters();
                if (!params.encodings || params.encodings.length === 0) {
                    params.encodings = [{}];
                }

                if (sender.track.kind === 'video') {
                    params.encodings[0].maxBitrate = settings.video;
                    params.encodings[0].maxFramerate = settings.fps;
                } else if (sender.track.kind === 'audio') {
                    params.encodings[0].maxBitrate = settings.audio;
                }

                await sender.setParameters(params);
            }

            console.log(`[WebRTC] 📊 Bitrate adjusted to ${level}:`, settings);
        } catch (error) {
            console.error('[WebRTC] Failed to adjust bitrate:', error);
        }
    }

    // Configure jitter buffer for lower latency
    configureJitterBuffer() {
        if (!this.peerConnection) return;

        try {
            const receivers = this.peerConnection.getReceivers();
            receivers.forEach(receiver => {
                if (receiver.track && receiver.track.kind === 'audio') {
                    // Try to set jitter buffer target to 50ms for lower latency
                    if (receiver.jitterBufferTarget) {
                        receiver.jitterBufferTarget = 50;
                        console.log('[WebRTC] 🎯 Jitter buffer set to 50ms');
                    }
                }
            });
        } catch (error) {
            console.warn('[WebRTC] Could not configure jitter buffer:', error);
        }
    }

    cleanup() {
        console.log('[WebRTC] Cleaning up...');

        // Stop quality monitoring
        if (this.qualityMonitorInterval) {
            clearInterval(this.qualityMonitorInterval);
            this.qualityMonitorInterval = null;
        }

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
