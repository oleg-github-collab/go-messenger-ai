console.log('[GROUP-CALL] Script loaded! Starting initialization...');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('[GROUP-CALL] DOM ready - Initializing...');

    // UI Elements - Settings Screen
    const settingsScreen = document.getElementById('settingsScreen');
    const groupCallContainer = document.getElementById('groupCallContainer');
    const previewVideo = document.getElementById('previewVideo');
    const previewStatus = document.getElementById('previewStatus');
    const nameInput = document.getElementById('nameInput');
    const cameraToggle = document.getElementById('cameraToggle');
    const micToggle = document.getElementById('micToggle');
    const joinButton = document.getElementById('joinButton');

    // UI Elements - Call Screen
    const participantsGrid = document.getElementById('participantsGrid');
    const localVideo = document.getElementById('localVideo');
    const participantCount = document.getElementById('participantCount');
    const callTimer = document.getElementById('callTimer');
    const backButton = document.getElementById('backButton');
    const cameraBtn = document.getElementById('cameraBtn');
    const micBtn = document.getElementById('micBtn');
    const endCallBtn = document.getElementById('endCallBtn');
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatBtnLabel = document.getElementById('chatBtnLabel');
    const chatBadge = document.getElementById('chatBadge');
    const subtitleOverlay = document.getElementById('subtitleOverlay');
    const participantsBtn = document.getElementById('participantsBtn');
    const participantsModal = document.getElementById('participantsModal');
    const participantsModalClose = document.getElementById('participantsModalClose');
    const participantsList = document.getElementById('participantsList');

    // Validate all elements exist
    if (!settingsScreen || !groupCallContainer || !previewVideo || !joinButton) {
        console.error('[GROUP-CALL] ❌ Critical elements missing!');
        alert('Failed to load group call interface. Please refresh.');
        return;
    }

    let notetakerUIReadyPromise = null;
    async function ensureNotetakerUI() {
        if (notetakerUIReadyPromise) {
            return notetakerUIReadyPromise;
        }

        notetakerUIReadyPromise = (async () => {
            if (!groupCallContainer) {
                console.warn('[GROUP-CALL] ⚠️ Cannot inject notetaker UI: container missing');
                return;
            }

            try {
                const [panelResp, modalsResp] = await Promise.all([
                    fetch('/static/notetaker-panel.html'),
                    fetch('/static/notetaker-modals.html')
                ]);

                if (!panelResp.ok || !modalsResp.ok) {
                    console.warn('[GROUP-CALL] ⚠️ Failed to load notetaker partials', panelResp.status, modalsResp.status);
                    return;
                }

                const parser = new DOMParser();
                const panelDoc = parser.parseFromString(await panelResp.text(), 'text/html');
                const modalsDoc = parser.parseFromString(await modalsResp.text(), 'text/html');

                const fragment = document.createDocumentFragment();
                Array.from(panelDoc.body.children).forEach(node => fragment.appendChild(node.cloneNode(true)));
                Array.from(modalsDoc.body.children).forEach(node => fragment.appendChild(node.cloneNode(true)));

                document.body.appendChild(fragment);
                console.log('[GROUP-CALL] ✅ Notetaker UI injected');
            } catch (err) {
                console.error('[GROUP-CALL] ❌ Failed to inject notetaker UI:', err);
            }
        })();

        return notetakerUIReadyPromise;
    }

    // State
    let socket = null;
    let localStream = null;
    let peerConnection = null;
    let participants = new Map(); // participantId -> { name, videoElement, stream }
    let orphanStreams = new Map(); // streamId -> MediaStream (streams waiting for participant)
    let isCameraOn = true;
    let isMicOn = true;
    let callStartTime = Date.now();
    let timerInterval = null;
    let myParticipantId = null;
    let myName = 'User';
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 10;
    let reconnectTimeout = null;
    let isChatVisible = false;
    let isChatSideBySide = false; // Split view on desktop
    let audioContexts = new Map(); // For speaking detection
    let pendingIceCandidates = []; // Queue for ICE candidates that arrive before offer

    // Connection quality tracking
    let currentQuality = 'excellent'; // excellent, good, poor, critical
    let qualityScoreHistory = [];
    let adaptiveBitrateEnabled = true;
    let currentBitrateLevel = 'high'; // low, medium, high
    let lastMeasuredRTT = 0;
    let lastMeasuredPacketLoss = 0;
    let lastMeasuredJitter = 0;
    let heartbeatInterval = null;
    let lastSentQualityLevel = null;
    let pendingQualityLevel = null;

    // Dynacast - track visibility optimization
    let visibilityCheckInterval = null;
    let participantVisibility = new Map(); // participantId -> boolean

    function buildAudioConstraints(extra = {}) {
        return {
            channelCount: 1,
            sampleRate: 32000,
            sampleSize: 16,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            ...extra,
        };
    }

    function notifyQualityChange(level) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            pendingQualityLevel = level;
            return;
        }

        if (lastSentQualityLevel === level) {
            pendingQualityLevel = null;
            return;
        }

        try {
            socket.send(JSON.stringify({
                type: 'quality-update',
                data: JSON.stringify({ level })
            }));
            lastSentQualityLevel = level;
            pendingQualityLevel = null;
            console.log('[QUALITY] 📤 Notified SFU about quality level:', level);
        } catch (err) {
            console.warn('[QUALITY] ⚠️ Failed to notify quality change:', err);
            pendingQualityLevel = level;
        }
    }

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'room') {
        alert('No room ID found');
        window.location.href = '/';
        return;
    }

    const hostStorageKey = `isHost_${roomID}`;
    const storedHostFlag = sessionStorage.getItem(hostStorageKey);
    if (storedHostFlag === 'true') {
        sessionStorage.setItem('isHost', 'true');
    } else if (storedHostFlag === 'false' || storedHostFlag === null) {
        sessionStorage.setItem('isHost', 'false');
    }

    const isCurrentUserHost = () =>
        sessionStorage.getItem('isHost') === 'true' || sessionStorage.getItem(hostStorageKey) === 'true';

    // Set default name from sessionStorage
    const savedName = sessionStorage.getItem('guestName') || sessionStorage.getItem('userName') || '';
    if (savedName) {
        nameInput.value = savedName;
        myName = savedName;
    }
    console.log('[GROUP-CALL] 👤 Default name:', myName);

    // WebRTC configuration - optimized for speed and reliability (with TURN for Germany-Ukraine)
    const config = {
        iceServers: [
            { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
            {
                urls: [
                    'turn:turn.cloudflare.com:3478',
                    'turn:turn.cloudflare.com:3478?transport=udp',
                    'turns:turn.cloudflare.com:5349?transport=tcp'
                ],
                username: 'cloudflare',
                credential: 'cloudflare'
            }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceTransportPolicy: 'all',
        sdpSemantics: 'unified-plan'
    };

    let hasPrimaryTurn = false;
    let forcedRelayMode = false;
    let relayRecoveryTimer = null;

    console.log('[GROUP-CALL] 🌍 Configured with', config.iceServers.length, 'ICE servers for global connectivity');

    // Fetch TURN credentials
    try {
        console.log('[GROUP-CALL] 📡 Fetching TURN credentials...');
        const response = await fetch('/api/turn-credentials');
        const creds = await response.json();
        console.log('[GROUP-CALL] 📡 TURN credentials received:', { host: creds.host, username: creds.username, hasPassword: !!creds.password });

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

            console.log('[GROUP-CALL] 🔧 TURN server URLs:', turnServer.urls);

            config.iceServers = [turnServer, ...config.iceServers];
            hasPrimaryTurn = true;
            console.log('[GROUP-CALL] ✅ Primary TURN server configured:', host);
        } else {
            console.warn('[GROUP-CALL] ⚠️  TURN credentials incomplete:', creds);
        }
    } catch (err) {
        console.error('[GROUP-CALL] ❌ Failed to fetch TURN credentials:', err);
    }

    console.log('[GROUP-CALL] 🔧 Total ICE servers configured:', config.iceServers.length);


    // Initialize WebRTC peer connection
    async function initPeerConnection() {
        console.log('[GROUP-CALL] 🔧 Initializing peer connection...');
        console.log('[GROUP-CALL] 🔧 localStream exists:', !!localStream);

        if (localStream) {
            const tracks = localStream.getTracks();
            console.log('[GROUP-CALL] 🔧 localStream has', tracks.length, 'tracks:', tracks.map(t => t.kind));
        }

        if (forcedRelayMode && config.iceTransportPolicy !== 'relay') {
            config.iceTransportPolicy = 'relay';
        }
        if (forcedRelayMode) {
            console.log('[GROUP-CALL] 🚦 Relay-only mode active for ICE transport');
        }

        peerConnection = new RTCPeerConnection(config);

        // Optimize jitter buffer for lower latency
        console.log('[JITTER] 🎯 Configuring jitter buffer optimization...');
        const receivers = peerConnection.getReceivers();
        receivers.forEach(receiver => {
            if (receiver.track && receiver.track.kind === 'video') {
                try {
                    // Set jitter buffer target to minimize latency while maintaining quality
                    const params = receiver.getParameters();
                    if (params) {
                        // Target 50ms jitter buffer (lower = less latency, but needs stable connection)
                        const target = computeJitterTarget(lastMeasuredRTT);
                        receiver.jitterBufferTarget = target;
                        console.log(`[JITTER] ✅ Set jitter buffer target to ${target}ms for video`);
                    }
                } catch (err) {
                    console.warn('[JITTER] ⚠️  Could not set jitter buffer:', err);
                }
            }
        });

        // CRITICAL: Add transceivers explicitly for sendrecv to ensure SFU receives tracks
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            const videoTrack = localStream.getVideoTracks()[0];

            if (audioTrack) {
                console.log('[GROUP-CALL] 🎤 Adding audio transceiver (sendrecv)');
                peerConnection.addTransceiver(audioTrack, {
                    direction: 'sendrecv',
                    streams: [localStream]
                });
            } else {
                console.log('[GROUP-CALL] 🎤 Adding audio-only receive transceiver');
                peerConnection.addTransceiver('audio', { direction: 'recvonly' });
            }

            if (videoTrack) {
                console.log('[GROUP-CALL] 📹 Adding video transceiver (sendrecv)');
                const videoSender = peerConnection.addTransceiver(videoTrack, {
                    direction: 'sendrecv',
                    streams: [localStream]
                });

                // Enable simulcast for video
                try {
                    const params = videoSender.sender.getParameters();
                    params.degradationPreference = 'maintain-framerate';
                    if (!params.encodings || params.encodings.length === 0) {
                        params.encodings = [
                            { rid: 'h', maxBitrate: 1200000, scaleResolutionDownBy: 1 },
                            { rid: 'm', maxBitrate: 500000, scaleResolutionDownBy: 2 },
                            { rid: 'l', maxBitrate: 150000, scaleResolutionDownBy: 4 }
                        ];
                        await videoSender.sender.setParameters(params);
                        console.log('[SIMULCAST] ✅ Enabled 3-layer simulcast');
                    } else {
                        params.encodings.forEach(encoding => {
                            if (encoding.rid === 'h') {
                                encoding.maxBitrate = 1200000;
                                encoding.scaleResolutionDownBy = 1;
                            } else if (encoding.rid === 'm') {
                                encoding.maxBitrate = 500000;
                                encoding.scaleResolutionDownBy = 2;
                            } else if (encoding.rid === 'l') {
                                encoding.maxBitrate = 150000;
                                encoding.scaleResolutionDownBy = 4;
                            }
                        });
                        await videoSender.sender.setParameters(params);
                        console.log('[SIMULCAST] 🔄 Updated sender parameters with maintain-framerate preference');
                    }
                } catch (err) {
                    console.warn('[SIMULCAST] ⚠️  Simulcast failed:', err);
                }
            } else {
                console.log('[GROUP-CALL] 📹 Adding video-only receive transceiver');
                peerConnection.addTransceiver('video', { direction: 'recvonly' });
            }

            console.log('[GROUP-CALL] ✅ Transceivers configured with local tracks');
        } else {
            // No local stream yet - add receive-only transceivers
            console.log('[GROUP-CALL] ⚠️  No localStream - adding receive-only transceivers');
            peerConnection.addTransceiver('audio', { direction: 'recvonly' });
            peerConnection.addTransceiver('video', { direction: 'recvonly' });
        }

        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
            console.log('[GROUP-CALL] 🎥 ========== INCOMING TRACK ==========');
            console.log('[GROUP-CALL] 🎥 Track kind:', event.track.kind);
            console.log('[GROUP-CALL] 🎥 Track ID:', event.track.id);
            console.log('[GROUP-CALL] 🎥 Track enabled:', event.track.enabled);
            console.log('[GROUP-CALL] 🎥 Track readyState:', event.track.readyState);
            console.log('[GROUP-CALL] 🎥 Track muted:', event.track.muted);
            console.log('[GROUP-CALL] 🎥 Streams count:', event.streams?.length || 0);
            console.log('[GROUP-CALL] 🎥 Transceiver direction:', event.transceiver?.direction);
            console.log('[GROUP-CALL] 🎥 Receiver:', !!event.receiver);

            if (event.receiver && typeof event.receiver.playoutDelayHint === 'number') {
                try {
                    event.receiver.playoutDelayHint = 0.12;
                    console.log('[GROUP-CALL] 🎯 Reduced playout delay hint to 120ms for low latency');
                } catch (err) {
                    console.warn('[GROUP-CALL] ⚠️ Could not set playout delay hint:', err);
                }
            }

            // Optimize jitter buffer for this receiver
            if (event.receiver && event.track.kind === 'video') {
                try {
                    const target = computeJitterTarget(lastMeasuredRTT);
                    event.receiver.jitterBufferTarget = target;
                    console.log(`[JITTER] ✅ Set jitter buffer target (${target}ms) for incoming track`);
                } catch (err) {
                    console.warn('[JITTER] ⚠️  Could not set jitter buffer for receiver:', err);
                }
            }

            if (event.streams && event.streams.length > 0) {
                const stream = event.streams[0];
                const streamId = stream.id;

                console.log('[GROUP-CALL] 📺 Stream ID:', streamId);
                console.log('[GROUP-CALL] 📺 Stream active:', stream.active);
                console.log('[GROUP-CALL] 📺 Stream tracks:', stream.getTracks().map(t => `${t.kind}(${t.readyState})`).join(', '));
                console.log('[GROUP-CALL] 📺 All participants:', Array.from(participants.keys()).join(', '));

                // Try to find participant by stream ID pattern (stream-{participantId})
                const match = streamId.match(/stream-(.+)/);
                if (match) {
                    const participantId = match[1];
                    console.log('[GROUP-CALL] 📺 Extracted participant ID:', participantId);

                    // Function to attach stream to participant
                    const attachStream = () => {
                        const participant = participants.get(participantId);
                        console.log('[GROUP-CALL] 📺 Participant found:', !!participant, 'has videoElement:', !!participant?.videoElement);

                        if (participant && participant.videoElement) {
                            const videoElement = participant.videoElement;

                            // ALWAYS set the full stream object
                            videoElement.srcObject = stream;
                            videoElement.playsInline = true;
                            videoElement.muted = false;

                            console.log('[GROUP-CALL] ✅ Attached stream to participant:', participant.name);
                            console.log('[GROUP-CALL] 📺 Video element srcObject set. Stream has', stream.getTracks().length, 'tracks');

                            // Force video element to play with mobile-friendly approach
                            const tryPlay = () => {
                                videoElement.play()
                                    .then(() => {
                                        console.log('[GROUP-CALL] ✅ Video playing for', participant.name);
                                    })
                                    .catch(e => {
                                        console.error('[GROUP-CALL] ❌ Video play failed:', e);
                                        // Mobile workaround: try again on user interaction
                                        const playOnInteraction = () => {
                                            videoElement.play().catch(() => {});
                                            document.removeEventListener('touchstart', playOnInteraction);
                                            document.removeEventListener('click', playOnInteraction);
                                        };
                                        document.addEventListener('touchstart', playOnInteraction, { once: true });
                                        document.addEventListener('click', playOnInteraction, { once: true });
                                    });
                            };

                            // Try immediately and after short delay
                            setTimeout(tryPlay, 100);
                            setTimeout(tryPlay, 500);

                            return true;
                        }
                        return false;
                    };

                    // Try to attach immediately
                    if (!attachStream()) {
                        // Save as orphan stream - participant will arrive soon
                        console.warn('[GROUP-CALL] ⚠️ Participant not found yet, saving orphan stream:', participantId);
                        orphanStreams.set(participantId, stream);

                        // Retry after a delay
                        setTimeout(() => {
                            if (orphanStreams.has(participantId)) {
                                console.log('[GROUP-CALL] 🔄 Retrying attach for:', participantId);
                                if (attachStream()) {
                                    orphanStreams.delete(participantId);
                                }
                            }
                        }, 500);
                    }
                } else {
                    console.warn('[GROUP-CALL] ⚠️ Could not parse participant ID from stream:', streamId);
                }
            } else {
                console.warn('[GROUP-CALL] ⚠️ Track event has no streams!');
            }
        };

        // ICE candidate handling - improved with logging
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[GROUP-CALL] 🧊 Sending ICE candidate:', event.candidate.type, event.candidate.protocol);
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'ice-candidate',
                        data: JSON.stringify(event.candidate)
                    }));
                } else {
                    console.warn('[GROUP-CALL] ⚠️  Cannot send ICE candidate - WebSocket not ready');
                }
            } else {
                console.log('[GROUP-CALL] 🧊 ICE gathering complete');
            }
        };

        // Connection state monitoring with aggressive reconnection
        let reconnectTimer = null;
        peerConnection.onconnectionstatechange = () => {
            console.log('[GROUP-CALL] 🔌 Connection state:', peerConnection.connectionState);

            switch (peerConnection.connectionState) {
                case 'connecting':
                    console.log('[GROUP-CALL] 🔄 Connecting to peers...');
                    break;
                case 'connected':
                    console.log('[GROUP-CALL] ✅ Peer connection established');
                    if (forcedRelayMode) {
                        console.log('[GROUP-CALL] 🛡️ Connection stabilized while using relay-only transport');
                        if (!relayRecoveryTimer) {
                            relayRecoveryTimer = setTimeout(() => {
                                config.iceTransportPolicy = 'all';
                                forcedRelayMode = false;
                                relayRecoveryTimer = null;
                                console.log('[GROUP-CALL] ♻️ Restored ICE transport policy to allow direct routes');
                            }, 45000);
                        }
                    }
                    reconnectAttempts = 0;
                    if (reconnectTimer) {
                        clearTimeout(reconnectTimer);
                        reconnectTimer = null;
                    }
                    break;
                case 'disconnected':
                    console.warn('[GROUP-CALL] ⚠️  Connection disconnected, attempting reconnect...');
                    if (relayRecoveryTimer) {
                        clearTimeout(relayRecoveryTimer);
                        relayRecoveryTimer = null;
                    }
                    if (!reconnectTimer) {
                        reconnectTimer = setTimeout(() => {
                            if (peerConnection && peerConnection.connectionState === 'disconnected') {
                                console.log('[GROUP-CALL] 🔄 Triggering ICE restart...');
                                if (peerConnection.restartIce) {
                                    peerConnection.restartIce();
                                }
                                attemptReconnection();
                            }
                        }, 2000);
                    }
                    break;
                case 'failed':
                    console.error('[GROUP-CALL] ❌ Connection failed, immediate reconnect...');
                    if (relayRecoveryTimer) {
                        clearTimeout(relayRecoveryTimer);
                        relayRecoveryTimer = null;
                    }
                    attemptReconnection();
                    break;
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('[GROUP-CALL] 🧊 ICE connection state:', peerConnection.iceConnectionState);

            switch (peerConnection.iceConnectionState) {
                case 'checking':
                    console.log('[GROUP-CALL] 🧊 ICE checking connectivity...');
                    break;
                case 'connected':
                case 'completed':
                    console.log('[GROUP-CALL] ✅ ICE connection established!');
                    reconnectAttempts = 0;
                    break;
                case 'failed':
                    console.error('[GROUP-CALL] ❌ ICE connection failed - triggering reconnect');
                    attemptReconnection();
                    break;
                case 'disconnected':
                    console.warn('[GROUP-CALL] ⚠️  ICE disconnected, waiting to reconnect...');
                    setTimeout(() => {
                        if (peerConnection && peerConnection.iceConnectionState === 'disconnected') {
                            console.log('[GROUP-CALL] 🔄 ICE restart after disconnect');
                            if (peerConnection.restartIce) {
                                peerConnection.restartIce();
                            }
                        }
                    }, 3000);
                    break;
            }
        };

        peerConnection.onicegatheringstatechange = () => {
            console.log('[GROUP-CALL] 🧊 ICE gathering state:', peerConnection.iceGatheringState);

            if (peerConnection.iceGatheringState === 'complete') {
                console.log('[GROUP-CALL] 🧊 All ICE candidates gathered');
            }
        };

        return peerConnection;
    }

    // ============================================
    // ADAPTIVE BITRATE CONTROL & QUALITY MONITORING
    // ============================================

    // Calculate connection quality score (0-1)
    const MIN_JITTER_TARGET = 20;
    const MAX_JITTER_TARGET = 30;

    function computeJitterTarget(rttMs) {
        if (rttMs > 200) return MAX_JITTER_TARGET;
        if (rttMs > 140) return 28;
        if (rttMs > 90) return 25;
        return MIN_JITTER_TARGET;
    }

    function applyAdaptiveJitter(rttMs) {
        if (!peerConnection) {
            return;
        }

        const target = computeJitterTarget(rttMs);
        peerConnection.getReceivers().forEach(receiver => {
            if (!receiver || typeof receiver.jitterBufferTarget === 'undefined') return;
            try {
                receiver.jitterBufferTarget = target;
            } catch (err) {
                console.warn('[JITTER] ⚠️  Unable to set adaptive jitter buffer:', err);
            }
        });
    }

    function enhanceOpusSdp(sdp) {
        if (!sdp) return sdp;

        const opusMatch = sdp.match(/a=rtpmap:(\d+)\s+opus/i);
        if (!opusMatch) {
            return sdp;
        }

        const payloadType = opusMatch[1];
        const fmtpRegex = new RegExp(`a=fmtp:${payloadType} ([^\\r\\n]*)`);
        if (fmtpRegex.test(sdp)) {
            sdp = sdp.replace(fmtpRegex, (_line, params) => {
                const parts = params.split(';').map(part => part.trim()).filter(Boolean);
                const opts = new Set(parts);
                opts.add('useinbandfec=1');
                opts.add('stereo=0');
                opts.add('maxplaybackrate=32000');
                opts.add('sprop-maxcapturerate=32000');
                opts.add('ptime=20');
                return `a=fmtp:${payloadType} ${Array.from(opts).join(';')}`;
            });
        } else {
            sdp = sdp.replace(
                new RegExp(`a=rtpmap:${payloadType}\\s+opus/\\d+`, 'i'),
                match => `${match}\na=fmtp:${payloadType} useinbandfec=1;stereo=0;maxplaybackrate=32000;sprop-maxcapturerate=32000;ptime=20`,
            );
        }

        sdp = sdp.replace(/a=ptime:\d+/g, 'a=ptime:20');
        return sdp;
    }

    function enableOpusOptions(description) {
        if (!description) {
            return description;
        }

        const enhanced = {
            type: description.type,
            sdp: enhanceOpusSdp(description.sdp),
        };

        return enhanced;
    }

    async function createEnhancedOffer(options) {
        if (!peerConnection) {
            throw new Error('peerConnection not ready');
        }
        const offer = await peerConnection.createOffer(options);
        const enhancedOffer = enableOpusOptions(offer);
        await peerConnection.setLocalDescription(enhancedOffer);
        return peerConnection.localDescription;
    }

    async function calculateConnectionQuality() {
        if (!peerConnection) return 1;

        try {
            const stats = await peerConnection.getStats();
            let totalPacketsReceived = 0;
            let totalPacketsLost = 0;
            let avgRTT = 0;
            let rttCount = 0;
            let avgJitter = 0;
            let jitterCount = 0;

            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    totalPacketsReceived += report.packetsReceived || 0;
                    totalPacketsLost += report.packetsLost || 0;

                    if (report.jitter !== undefined) {
                        avgJitter += report.jitter;
                        jitterCount++;
                    }
                }

                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    if (report.currentRoundTripTime !== undefined) {
                        avgRTT += report.currentRoundTripTime;
                        rttCount++;
                    }
                }
            });

            // Calculate metrics
            const packetLossRate = totalPacketsReceived > 0 ?
                totalPacketsLost / (totalPacketsReceived + totalPacketsLost) : 0;
            const rtt = rttCount > 0 ? (avgRTT / rttCount) * 1000 : 0; // Convert to ms
            const jitter = jitterCount > 0 ? (avgJitter / jitterCount) * 1000 : 0;

            lastMeasuredRTT = rtt;
            lastMeasuredPacketLoss = packetLossRate;
            lastMeasuredJitter = jitter;

            // Calculate quality score (0-1)
            let qualityScore = 1.0;

            // Packet loss penalty (0-30% loss)
            if (packetLossRate > 0.30) qualityScore -= 0.5;
            else if (packetLossRate > 0.15) qualityScore -= 0.3;
            else if (packetLossRate > 0.05) qualityScore -= 0.15;

            // RTT penalty (0-500ms)
            if (rtt > 500) qualityScore -= 0.3;
            else if (rtt > 300) qualityScore -= 0.2;
            else if (rtt > 150) qualityScore -= 0.1;

            // Jitter penalty (0-100ms)
            if (jitter > 100) qualityScore -= 0.2;
            else if (jitter > 50) qualityScore -= 0.1;

            qualityScore = Math.max(0, Math.min(1, qualityScore));

            return {
                score: qualityScore,
                packetLoss: packetLossRate,
                rtt: rtt,
                jitter: jitter,
                quality: qualityScore > 0.8 ? 'excellent' :
                        qualityScore > 0.6 ? 'good' :
                        qualityScore > 0.3 ? 'poor' : 'critical'
            };
        } catch (err) {
            console.warn('[QUALITY] Failed to calculate quality:', err);
            return { score: 1, quality: 'excellent', packetLoss: 0, rtt: 0, jitter: 0 };
        }
    }

    // Adjust bitrate based on quality (works with simulcast)
    async function adjustBitrate(level) {
        if (!peerConnection || !adaptiveBitrateEnabled) return;

        currentBitrateLevel = level;

        const bitrateSettings = {
            low: {
                video: { h: 600000, m: 300000, l: 150000 },
                audio: 32000
            },
            medium: {
                video: { h: 900000, m: 500000, l: 200000 },
                audio: 48000
            },
            high: {
                video: { h: 1200000, m: 600000, l: 250000 },
                audio: 64000
            }
        };

        const settings = bitrateSettings[level] || bitrateSettings.high;

        console.log(`[BITRATE] Adjusting to ${level}: high=${settings.video.h/1000}kbps, medium=${settings.video.m/1000}kbps, low=${settings.video.l/1000}kbps`);

        try {
            const senders = peerConnection.getSenders();

            for (const sender of senders) {
                if (!sender.track) continue;

                const params = sender.getParameters();

                if (sender.track.kind === 'video') {
                    // If simulcast is enabled (multiple encodings)
                    if (params.encodings && params.encodings.length > 1) {
                        // Update simulcast layers
                        params.encodings.forEach((encoding, idx) => {
                            if (encoding.rid === 'h') {
                                encoding.maxBitrate = settings.video.h;
                                encoding.scaleResolutionDownBy = 1;
                                encoding.maxFramerate = level === 'high' ? 30 : 24;
                            } else if (encoding.rid === 'm') {
                                encoding.maxBitrate = settings.video.m;
                                encoding.scaleResolutionDownBy = 2;
                                encoding.maxFramerate = level === 'high' ? 24 : 20;
                            } else if (encoding.rid === 'l') {
                                encoding.maxBitrate = settings.video.l;
                                encoding.scaleResolutionDownBy = 4;
                                encoding.maxFramerate = 15;
                            }
                        });
                        console.log('[SIMULCAST] ✅ Updated all simulcast layers');
                    } else {
                        // Fallback: single stream mode
                        if (!params.encodings) {
                            params.encodings = [{}];
                        }
                        params.encodings[0].maxBitrate = settings.video.h;

                        if (level === 'low') {
                            params.encodings[0].scaleResolutionDownBy = 2;
                            params.encodings[0].maxFramerate = 15;
                        } else if (level === 'medium') {
                            params.encodings[0].scaleResolutionDownBy = 1.5;
                            params.encodings[0].maxFramerate = 24;
                        } else {
                            params.encodings[0].scaleResolutionDownBy = 1;
                            params.encodings[0].maxFramerate = 30;
                        }
                    }
                } else if (sender.track.kind === 'audio') {
                    // Audio bitrate
                    if (!params.encodings) {
                        params.encodings = [{}];
                    }
                    params.encodings[0].maxBitrate = settings.audio;
                }

                await sender.setParameters(params);
            }

        console.log(`[BITRATE] ✅ Bitrate adjusted to ${level}`);
        notifyQualityChange(level);
    } catch (err) {
        console.error('[BITRATE] Failed to adjust bitrate:', err);
    }
}

    // Monitor connection quality and adjust bitrate
    let qualityMonitorInterval = null;
    let consecutiveBadQuality = 0;
    let consecutiveGoodQuality = 0;

    function startQualityMonitoring() {
        if (qualityMonitorInterval) {
            clearInterval(qualityMonitorInterval);
        }

        console.log('[QUALITY] 📊 Starting quality monitoring...');

        qualityMonitorInterval = setInterval(async () => {
            const quality = await calculateConnectionQuality();
            applyAdaptiveJitter(quality.rtt);

            qualityScoreHistory.push(quality.score);
            if (qualityScoreHistory.length > 10) {
                qualityScoreHistory.shift();
            }

            const avgScore = qualityScoreHistory.reduce((a, b) => a + b, 0) / qualityScoreHistory.length;
            const previousQuality = currentQuality;
            currentQuality = quality.quality;

            // Log quality metrics
            console.log(`[QUALITY] Score: ${quality.score.toFixed(2)} (avg: ${avgScore.toFixed(2)}) | Loss: ${(quality.packetLoss * 100).toFixed(1)}% | RTT: ${quality.rtt.toFixed(0)}ms | Jitter: ${quality.jitter.toFixed(1)}ms | Status: ${quality.quality}`);

            // Adaptive bitrate adjustment
            if (adaptiveBitrateEnabled) {
                if (quality.packetLoss > 0.05 || quality.score < 0.4) {
                    consecutiveBadQuality++;
                    consecutiveGoodQuality = 0;

                    if (consecutiveBadQuality >= 1) {
                        if (currentBitrateLevel !== 'low') {
                            await adjustBitrate('low');
                            showSubtitle('Connection', 'Reducing quality due to poor connection', false);
                        }
                        consecutiveBadQuality = 0;
                    }
                } else if (quality.packetLoss > 0.02 || quality.score < 0.7) {
                    consecutiveBadQuality = 0;

                    if (currentBitrateLevel === 'high') {
                        await adjustBitrate('medium');
                    }
                } else {
                    consecutiveBadQuality = 0;
                    consecutiveGoodQuality++;

                    if (consecutiveGoodQuality >= 3 && currentBitrateLevel !== 'high') {
                        await adjustBitrate('high');
                        showSubtitle('Connection', 'Connection improved, restoring quality', false);
                    }
                }
            }

            // Update UI quality indicator (if exists)
            updateQualityIndicator(quality.quality);

            // Quality change notification
            if (previousQuality !== currentQuality && currentQuality === 'critical') {
                console.warn('[QUALITY] ⚠️  Connection quality is CRITICAL!');
            }

        }, 1000); // Check every second
    }

    function stopQualityMonitoring() {
        if (qualityMonitorInterval) {
            clearInterval(qualityMonitorInterval);
            qualityMonitorInterval = null;
            console.log('[QUALITY] 🛑 Quality monitoring stopped');
        }
    }

    // Update quality indicator in UI
    function updateQualityIndicator(quality) {
        const indicator = document.getElementById('qualityIndicator');
        if (!indicator) return;

        const icons = {
            excellent: '🟢',
            good: '🟡',
            poor: '🟠',
            critical: '🔴'
        };

        indicator.textContent = icons[quality] || '⚪';
        indicator.title = `Connection: ${quality}`;
    }

    // ============================================
    // PREEMPTIVE RECONNECTION (HYPER-RELIABLE)
    // ============================================

    let preemptiveReconnectTimer = null;
    let lastIceRestartTime = 0;
    let consecutiveCriticalQuality = 0;

    function startPreemptiveReconnection() {
        if (preemptiveReconnectTimer) {
            clearInterval(preemptiveReconnectTimer);
        }

        console.log('[RECONNECT] 🔄 Starting hyper-reliable preemptive reconnection monitoring...');

        preemptiveReconnectTimer = setInterval(async () => {
            if (!peerConnection) return;

            const quality = await calculateConnectionQuality();
            const now = Date.now();

            // Track consecutive critical quality
            if (quality.score < 0.3 || quality.packetLoss > 0.05) {
                consecutiveCriticalQuality++;
            } else {
                consecutiveCriticalQuality = 0;
            }

            // AGGRESSIVE: Trigger ICE restart when quality remains critical twice in a row
            if ((quality.score < 0.3 || quality.packetLoss > 0.05) && consecutiveCriticalQuality >= 2) {
                const timeSinceLastRestart = now - lastIceRestartTime;

                // Don't restart too frequently (minimum 10s between restarts)
                if (timeSinceLastRestart > 10000) {
                    console.warn('[RECONNECT] ⚠️  POOR QUALITY DETECTED!');
                    console.warn(`[RECONNECT] Quality: ${quality.quality} (score: ${quality.score.toFixed(2)})`);
                    console.warn(`[RECONNECT] Packet Loss: ${(quality.packetLoss * 100).toFixed(1)}%, RTT: ${quality.rtt.toFixed(0)}ms, Jitter: ${quality.jitter.toFixed(1)}ms`);
                    console.warn('[RECONNECT] 🔄 Triggering PREEMPTIVE ICE RESTART...');

                    if (peerConnection.restartIce) {
                        peerConnection.restartIce();
                        lastIceRestartTime = now;
                        consecutiveCriticalQuality = 0;

                        showSubtitle('Connection', 'Reconnecting to improve quality...', false);

                        // If still bad after 5 seconds, try full reconnection
                        setTimeout(async () => {
                            const recheckQuality = await calculateConnectionQuality();
                            if (recheckQuality.score < 0.2) {
                                console.error('[RECONNECT] ❌ ICE restart did not help, quality still critical');
                                console.error(`[RECONNECT] Attempting FULL RECONNECTION...`);
                                attemptReconnection();
                            } else {
                                console.log('[RECONNECT] ✅ ICE restart successful, quality improved to', recheckQuality.quality);
                            }
                        }, 5000);
                    }
                } else {
                    console.log(`[RECONNECT] ⏳ Waiting before next restart (${((10000 - timeSinceLastRestart) / 1000).toFixed(0)}s)`);
                }
            }

            // CRITICAL: If quality is extremely bad (< 0.2) and getting worse
            if ((quality.score < 0.2 || quality.packetLoss > 0.08) && consecutiveCriticalQuality >= 2) {
                console.error('[RECONNECT] 🚨 CRITICAL QUALITY - Immediate full reconnection!');
                attemptReconnection();
                consecutiveCriticalQuality = 0;
            }

        }, 1000); // Check every second
    }

    function stopPreemptiveReconnection() {
        if (preemptiveReconnectTimer) {
            clearInterval(preemptiveReconnectTimer);
            preemptiveReconnectTimer = null;
            console.log('[RECONNECT] 🛑 Preemptive reconnection monitoring stopped');
        }
    }

    // ============================================
    // DYNACAST - DYNAMIC TRACK MANAGEMENT
    // ============================================

    // Check if participant video tile is visible on screen
    function isParticipantVisible(participantId) {
        const participant = participants.get(participantId);
        if (!participant || !participant.tile) return false;

        const rect = participant.tile.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        // Check if tile is in viewport
        const isVisible = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= windowHeight &&
            rect.right <= windowWidth
        );

        return isVisible;
    }

    // Manage track subscriptions based on visibility
    function updateTrackSubscriptions() {
        if (!peerConnection) return;

        participants.forEach((participant, participantId) => {
            const isVisible = isParticipantVisible(participantId);
            const wasVisible = participantVisibility.get(participantId) || false;

            // State changed
            if (isVisible !== wasVisible) {
                participantVisibility.set(participantId, isVisible);

                // Find video element
                if (participant.videoElement && participant.videoElement.srcObject) {
                    const stream = participant.videoElement.srcObject;
                    const videoTracks = stream.getVideoTracks();

                    videoTracks.forEach(track => {
                        if (!isVisible) {
                            // Participant scrolled out of view - disable video track to save bandwidth
                            track.enabled = false;
                            console.log(`[DYNACAST] 📴 Disabled video for ${participant.name} (not visible)`);
                        } else {
                            // Participant back in view - enable video track
                            track.enabled = true;
                            console.log(`[DYNACAST] 📺 Enabled video for ${participant.name} (visible)`);
                        }
                    });
                }
            }
        });
    }

    // Start dynacast monitoring
    function startDynacast() {
        if (visibilityCheckInterval) {
            clearInterval(visibilityCheckInterval);
        }

        console.log('[DYNACAST] 🎯 Starting dynamic track management...');

        // Check visibility every 500ms
        visibilityCheckInterval = setInterval(() => {
            updateTrackSubscriptions();
        }, 500);

        // Also check on scroll/resize
        window.addEventListener('scroll', updateTrackSubscriptions);
        window.addEventListener('resize', updateTrackSubscriptions);
        participantsGrid.addEventListener('scroll', updateTrackSubscriptions);
    }

    function stopDynacast() {
        if (visibilityCheckInterval) {
            clearInterval(visibilityCheckInterval);
            visibilityCheckInterval = null;
            console.log('[DYNACAST] 🛑 Dynamic track management stopped');
        }

        window.removeEventListener('scroll', updateTrackSubscriptions);
        window.removeEventListener('resize', updateTrackSubscriptions);
        participantsGrid.removeEventListener('scroll', updateTrackSubscriptions);
    }

    // Attempt reconnection with exponential backoff
    async function attemptReconnection() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('[GROUP-CALL] ❌ Max reconnect attempts reached');
            showSubtitle('Connection Lost', 'Unable to reconnect. Please refresh.', false);
            return;
        }

        if (relayRecoveryTimer) {
            clearTimeout(relayRecoveryTimer);
            relayRecoveryTimer = null;
        }

        reconnectAttempts++;
        if (reconnectAttempts === 3 && !forcedRelayMode) {
            forcedRelayMode = true;
            config.iceTransportPolicy = 'relay';
            console.warn('[GROUP-CALL] 🚨 Switching ICE transport policy to relay-only for stability');
        }

        const baseDelay = forcedRelayMode ? 700 : 900;
        const delay = Math.min(baseDelay * Math.pow(1.35, reconnectAttempts - 1), 4000);
        console.log(`[GROUP-CALL] 🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

        await new Promise(resolve => setTimeout(resolve, delay));

        try {
            // Close old connection
            if (peerConnection) {
                peerConnection.close();
            }

            // Recreate peer connection
            await initPeerConnection();

            // Create new offer
            const offer = await createEnhancedOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true,
                iceRestart: true
            });

            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'offer',
                    data: JSON.stringify(offer)
                }));
                console.log('[GROUP-CALL] ✅ Reconnection offer sent');
            } else {
                console.error('[GROUP-CALL] ❌ WebSocket not ready for reconnection');
                // Reconnect WebSocket too
                connectToSFU();
            }
        } catch (err) {
            console.error('[GROUP-CALL] ❌ Reconnection failed:', err);
            attemptReconnection(); // Retry
        }
    }

    // Connect to SFU via WebSocket
    function clearHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }

    function connectToSFU() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const isHostSession = isCurrentUserHost();
        const wsUrl = `${protocol}//${window.location.host}/ws-sfu?room=${roomID}&name=${encodeURIComponent(myName)}&isHost=${isHostSession}`;

        console.log('[GROUP-CALL] ========== CONNECTING TO SFU ==========');
        console.log('[GROUP-CALL] Protocol:', protocol);
        console.log('[GROUP-CALL] Host:', window.location.host);
        console.log('[GROUP-CALL] RoomID:', roomID);
        console.log('[GROUP-CALL] Name:', myName);
        console.log('[GROUP-CALL] IsHost:', isHostSession);
        console.log('[GROUP-CALL] Full WS URL:', wsUrl);
        console.log('[GROUP-CALL] Creating WebSocket...');

        clearHeartbeat();

        try {
            socket = new WebSocket(wsUrl);
            console.log('[GROUP-CALL] ✅ WebSocket object created, waiting for connection...');
        } catch (err) {
            console.error('[GROUP-CALL] ❌ Failed to create WebSocket:', err);
            alert('Failed to connect to server. Please refresh.');
            return;
        }

        socket.onopen = async () => {
            console.log('[GROUP-CALL] ✅ WebSocket connected');

            heartbeatInterval = setInterval(() => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'ping', data: Date.now() }));
                }
            }, 15000);

            notifyQualityChange(pendingQualityLevel || currentBitrateLevel);

            // CRITICAL: Ensure localStream exists with tracks before proceeding
            if (!localStream || localStream.getTracks().length === 0) {
                console.error('[GROUP-CALL] ❌ CRITICAL: localStream not available or has no tracks!');
                console.error('[GROUP-CALL] This should not happen - preview should have set localStream');

                // Try to recover by getting media again
                try {
                    console.log('[GROUP-CALL] 🔄 Attempting emergency media recovery...');
                    localStream = await navigator.mediaDevices.getUserMedia({
                        video: isCameraOn,
                        audio: isMicOn ? buildAudioConstraints() : false
                    });
                    console.log('[GROUP-CALL] ✅ Emergency recovery successful, got', localStream.getTracks().length, 'tracks');
                } catch (recoveryErr) {
                    console.error('[GROUP-CALL] ❌ Emergency recovery failed:', recoveryErr);
                    alert('Failed to access camera/microphone. Please refresh and try again.');
                    return;
                }
            }

            console.log('[GROUP-CALL] 📊 LocalStream status:', {
                exists: !!localStream,
                tracks: localStream ? localStream.getTracks().length : 0,
                trackDetails: localStream ? localStream.getTracks().map(t => ({
                    kind: t.kind,
                    enabled: t.enabled,
                    readyState: t.readyState,
                    muted: t.muted
                })) : []
            });

            // Initialize peer connection WITH local tracks
            await initPeerConnection();

            // Wait a bit for all event handlers to be set up
            await new Promise(resolve => setTimeout(resolve, 100));

            // CLIENT creates offer with tracks, SFU will answer
            console.log('[GROUP-CALL] 🔄 Creating offer with local tracks...');
            const sendersBeforeOffer = peerConnection.getSenders();
            console.log('[GROUP-CALL] 📊 Senders before offer:', sendersBeforeOffer.length, sendersBeforeOffer.map(s => s.track ? s.track.kind : 'no-track'));

            // CRITICAL: Log transceivers to see their direction
            const transceivers = peerConnection.getTransceivers();
            console.log('[GROUP-CALL] 📊 Transceivers before offer:', transceivers.length);
            transceivers.forEach((t, i) => {
                console.log(`[GROUP-CALL] 📊 Transceiver ${i}: kind=${t.sender.track?.kind || 'none'}, direction=${t.direction}, currentDirection=${t.currentDirection}`);
            });

            try {
                const offer = await createEnhancedOffer();

                console.log('[GROUP-CALL] 📄 Offer created, SDP length:', offer.sdp.length);
                console.log('[GROUP-CALL] 📊 Offer contains video:', offer.sdp.includes('m=video'));
                console.log('[GROUP-CALL] 📊 Offer contains audio:', offer.sdp.includes('m=audio'));

                const sdpLines = offer.sdp.split('\n');
                const mediaLines = sdpLines.filter(line => line.startsWith('m=') || line.startsWith('a=sendrecv') || line.startsWith('a=sendonly') || line.startsWith('a=recvonly'));
                console.log('[GROUP-CALL] 📊 Offer SDP media lines:', mediaLines);

                const localDescription = peerConnection.localDescription || offer;

                console.log('[GROUP-CALL] 📤 Sending offer to SFU with', peerConnection.getSenders().length, 'tracks');
                socket.send(JSON.stringify({
                    type: 'offer',
                    data: JSON.stringify(localDescription)
                }));

                // Start quality monitoring, preemptive reconnection, and dynacast
                setTimeout(() => {
                    startQualityMonitoring();
                    startPreemptiveReconnection();
                    startDynacast();
                }, 3000); // Wait 3s for connection to establish

            } catch (err) {
                console.error('[GROUP-CALL] ❌ Failed to create/send offer:', err);
                console.error('[GROUP-CALL] ❌ Error details:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
            }
        };

        socket.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('[GROUP-CALL] ← Received:', message.type, message);
                await handleSignalingMessage(message);
            } catch (err) {
                console.error('[GROUP-CALL] Failed to parse message:', err);
            }
        };

        socket.onerror = (error) => {
            clearHeartbeat();
            console.error('[GROUP-CALL] ❌❌❌ WebSocket ERROR ❌❌❌');
            console.error('[GROUP-CALL] Error object:', error);
            console.error('[GROUP-CALL] Error type:', error.type);
            console.error('[GROUP-CALL] Socket readyState:', socket.readyState);
            alert('WebSocket connection failed! Check console for details.');
        };

        socket.onclose = (event) => {
            clearHeartbeat();
            console.log('[GROUP-CALL] ❌ WebSocket CLOSED');
            console.log('[GROUP-CALL] Close code:', event.code);
            console.log('[GROUP-CALL] Close reason:', event.reason);
            console.log('[GROUP-CALL] Was clean:', event.wasClean);

            pendingQualityLevel = currentBitrateLevel;
            lastSentQualityLevel = null;

            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 15000);
                console.log(`[GROUP-CALL] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

                reconnectTimeout = setTimeout(() => {
                    console.log('[GROUP-CALL] Attempting reconnection...');
                    connectToSFU();
                }, delay);
            } else {
                console.error('[GROUP-CALL] Max reconnection attempts reached - auto retrying in 5s');
                setTimeout(() => {
                    reconnectAttempts = 0; // Reset and retry automatically
                    connectToSFU();
                }, 5000);
            }
        };
    }

    // Handle signaling messages from SFU
    async function handleSignalingMessage(message) {
        console.log('[GROUP-CALL] Received message:', message.type);

        switch (message.type) {
            case 'joined':
                // We successfully joined
                const data = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                myParticipantId = data.id;
                myName = data.name || 'You';
                updateParticipantCount(data.participantCount || 1);
                console.log('[GROUP-CALL] Joined as:', myParticipantId);
                break;

            case 'answer':
                // SFU sent answer to our offer
                const answer = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                if (peerConnection.signalingState === 'have-local-offer') {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    console.log('[GROUP-CALL] ✅ Set remote description (answer)');
                } else {
                    console.warn('[GROUP-CALL] ⚠️ Cannot set answer, signaling state:', peerConnection.signalingState);
                }
                break;

            case 'ice-candidate':
                // SFU sent ICE candidate
                const candidate = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;

                // Check if we have remote description set
                if (!peerConnection.remoteDescription) {
                    console.log('[GROUP-CALL] 🧊 Queueing ICE candidate (no remote description yet)');
                    pendingIceCandidates.push(candidate);
                } else {
                    try {
                        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log('[GROUP-CALL] ✅ Added ICE candidate');
                    } catch (err) {
                        console.error('[GROUP-CALL] ❌ Failed to add ICE candidate:', err);
                    }
                }
                break;

            case 'participants-list':
                // List of existing participants
                const existingParticipants = message.data || [];
                console.log('[GROUP-CALL] 📋 Existing participants:', existingParticipants.length);
                existingParticipants.forEach(p => {
                    addParticipantTileEnhanced(p.id, p.name);
                });
                updateParticipantCount(existingParticipants.length + 1);
                break;

            case 'participant-joined':
                // New participant joined
                const joined = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                addParticipantTileEnhanced(joined.id, joined.name);
                updateParticipantCount(participants.size + 1);
                break;

            case 'participant-left':
                // Participant left
                const left = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                removeParticipantTileEnhanced(left.id);
                updateParticipantCount(participants.size + 1);
                break;

            case 'pong':
                // Keep-alive acknowledgement
                break;

            case 'offer':
                // SFU sent us an offer (initial or renegotiation)
                const offer = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[GROUP-CALL] 📥 Received offer from SFU');
                console.log('[GROUP-CALL] 📊 Current signaling state:', peerConnection.signalingState);

                try {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                    console.log('[GROUP-CALL] ✅ Set remote description (offer)');

                    // Add any pending ICE candidates
                    if (pendingIceCandidates.length > 0) {
                        console.log('[GROUP-CALL] 🧊 Adding', pendingIceCandidates.length, 'pending ICE candidates');
                        for (const candidate of pendingIceCandidates) {
                            try {
                                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                                console.log('[GROUP-CALL] ✅ Added pending ICE candidate');
                            } catch (err) {
                                console.error('[GROUP-CALL] ❌ Failed to add pending ICE candidate:', err);
                            }
                        }
                        pendingIceCandidates = []; // Clear the queue
                    }

                    const answer = await peerConnection.createAnswer();
                    const enhancedAnswer = enableOpusOptions(answer);
                    await peerConnection.setLocalDescription(enhancedAnswer);

                    socket.send(JSON.stringify({
                        type: 'answer',
                        data: JSON.stringify(peerConnection.localDescription || enhancedAnswer)
                    }));
                    console.log('[GROUP-CALL] ✅ Sent answer to SFU');
                } catch (err) {
                    console.error('[GROUP-CALL] ❌ Failed to handle offer:', err);
                }
                break;

            case 'track-published':
                // A participant published a new track
                const trackInfo = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[GROUP-CALL] 🎥 Track published:', trackInfo);
                // The SFU will automatically forward this track to us via renegotiation
                break;

            case 'chat':
                // Chat message received
                const chatData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                const isPrivate = chatData.to && chatData.to !== 'everyone';
                const isForMe = !chatData.to || chatData.to === 'everyone' || chatData.to === myParticipantId;

                if (isForMe) {
                    const isGif = chatData.text.startsWith('[GIF]');
                    const displayText = isGif ? chatData.text.substring(5) : chatData.text;

                    appendMessage(chatData.text, 'received', chatData.from, chatData.fromName, isPrivate, chatData.replyTo);

                    // Show cinematic subtitle if chat is not visible (video-only view)
                    if (!isChatVisible && !isPrivate) {
                        showSubtitle(chatData.fromName, displayText, isGif);
                    }

                    // Show badge if chat is closed
                    if (!isChatVisible) {
                        const currentCount = parseInt(chatBadge.textContent) || 0;
                        chatBadge.textContent = currentCount + 1;
                        chatBadge.style.display = 'block';
                    }
                }
                break;

            case 'reaction':
                // Reaction received from another participant
                const reactionData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[REACTIONS] Received reaction:', reactionData.emoji, 'from', reactionData.user_name);
                createFlyingReaction(reactionData.emoji);
                break;

            case 'raise_hand':
                // Raise hand notification from another participant
                const handData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[RAISE-HAND] Received from', handData.user_name, ':', handData.raised);
                updateRaisedHandIndicator(handData.user_name, handData.raised);
                break;

            case 'message_reaction':
                // Message reaction received from another participant
                const msgReactionData = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[MESSAGE-REACTIONS] Received:', msgReactionData.emoji, 'for message:', msgReactionData.message_id);

                // Update local state
                if (!messageReactions.has(msgReactionData.message_id)) {
                    messageReactions.set(msgReactionData.message_id, {});
                }
                const reactions = messageReactions.get(msgReactionData.message_id);
                reactions[msgReactionData.emoji] = (reactions[msgReactionData.emoji] || 0) + 1;

                // Update UI
                updateMessageReactionsUI(msgReactionData.message_id);
                break;

            case 'host-mute-request':
                // Host requested to mute our media
                const muteRequest = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[GROUP-CALL] 🔇 Host requested to mute:', muteRequest.mediaType);

                if (muteRequest.mediaType === 'audio' && localStream) {
                    const audioTrack = localStream.getAudioTracks()[0];
                    if (audioTrack && audioTrack.enabled) {
                        audioTrack.enabled = false;
                        micBtn.dataset.active = 'false';
                        micBtn.querySelector('.icon-mic-on').style.display = 'none';
                        micBtn.querySelector('.icon-mic-off').style.display = 'block';
                        localMicIndicator.classList.remove('active');
                        console.log('[GROUP-CALL] Microphone muted by host');

                        // Show notification
                        showSubtitle('Host', 'Your microphone has been muted', false);
                    }
                } else if (muteRequest.mediaType === 'video' && localStream) {
                    const videoTrack = localStream.getVideoTracks()[0];
                    if (videoTrack && videoTrack.enabled) {
                        videoTrack.enabled = false;
                        cameraBtn.dataset.active = 'false';
                        cameraBtn.querySelector('.icon-camera-on').style.display = 'none';
                        cameraBtn.querySelector('.icon-camera-off').style.display = 'block';
                        console.log('[GROUP-CALL] Camera disabled by host');

                        // Show notification
                        showSubtitle('Host', 'Your camera has been disabled', false);
                    }
                }
                break;

            case 'error':
                // Server validation error
                const errorMsg = message.error || 'An error occurred';
                console.error('[GROUP-CALL] ❌ Server error:', errorMsg);

                // Show error notification to user
                showSubtitle('Error', errorMsg, false);

                // Also log to console with details
                console.error('[GROUP-CALL] Error details:', message);
                break;

            default:
                console.warn('[GROUP-CALL] Unknown message type:', message.type);
        }
    }

    // Chat functionality elements
    const chatPanel = document.getElementById('chatPanel');
    const chatBackBtn = document.getElementById('chatBackBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatEmpty = document.getElementById('chatEmpty');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const recipientSelect = document.getElementById('recipientSelect');

    // Track message reactions
    const messageReactions = new Map(); // messageId -> {emoji -> count}
    let messageIdCounter = 0;

    function appendMessage(text, type, fromId, fromName, isPrivate, replyTo = null) {
        if (chatEmpty) {
            chatEmpty.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        if (isPrivate) {
            messageDiv.classList.add('private');
        }

        // Generate unique message ID
        const messageId = `msg_${messageIdCounter++}_${Date.now()}`;
        messageDiv.dataset.messageId = messageId;
        messageDiv.dataset.fromId = fromId;
        messageDiv.dataset.fromName = fromName || 'You';

        // Add header with sender and time
        if (type === 'received') {
            const header = document.createElement('div');
            header.className = 'message-header';

            const sender = document.createElement('span');
            sender.className = 'message-sender';
            sender.textContent = fromName || `Participant ${fromId}`;
            header.appendChild(sender);

            if (isPrivate) {
                const badge = document.createElement('span');
                badge.className = 'message-private-badge';
                badge.textContent = 'Private';
                header.appendChild(badge);
            }

            const time = document.createElement('span');
            time.className = 'message-time';
            const now = new Date();
            time.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            header.appendChild(time);

            messageDiv.appendChild(header);
        }

        // Create message bubble
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        // Add reply/quote if exists
        if (replyTo && replyTo.messageId) {
            const replyDiv = document.createElement('div');
            replyDiv.className = 'message-reply';

            const replySender = document.createElement('div');
            replySender.className = 'message-reply-sender';
            replySender.textContent = replyTo.senderName || 'Someone';
            replyDiv.appendChild(replySender);

            const replyText = document.createElement('div');
            replyText.className = 'message-reply-text';
            replyText.textContent = replyTo.text || '';
            replyDiv.appendChild(replyText);

            bubble.appendChild(replyDiv);
        }

        // Message content
        const content = document.createElement('div');
        content.className = 'message-content';

        // Check if message is a GIF
        if (text.startsWith('[GIF]')) {
            const gifUrl = text.substring(5);
            const img = document.createElement('img');
            img.src = gifUrl;
            img.alt = 'GIF';
            img.loading = 'lazy';
            img.style.maxWidth = '240px';
            img.style.maxHeight = '240px';
            img.style.borderRadius = '12px';
            img.style.marginTop = '4px';
            content.appendChild(img);
        } else {
            content.textContent = text;
        }

        bubble.appendChild(content);
        messageDiv.appendChild(bubble);

        // Add reactions container
        const reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'message-reactions';
        messageDiv.appendChild(reactionsContainer);

        // Add message actions (reply, react)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';

        const replyBtn = document.createElement('button');
        replyBtn.className = 'message-action-btn';
        replyBtn.innerHTML = '↩️ Reply';
        replyBtn.onclick = () => setReplyTo(messageId, fromName || 'You', text);
        actionsDiv.appendChild(replyBtn);

        const reactBtn = document.createElement('button');
        reactBtn.className = 'message-action-btn';
        reactBtn.innerHTML = '❤️ React';
        reactBtn.onclick = (e) => {
            e.stopPropagation();
            showMessageReactionPicker(messageId, reactBtn);
        };
        actionsDiv.appendChild(reactBtn);

        messageDiv.appendChild(actionsDiv);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Store message data for replies
        messageDiv.dataset.text = text.startsWith('[GIF]') ? 'GIF' : text;

        return messageId;
    }

    // Show quick reaction picker for a message
    function showMessageReactionPicker(messageId, buttonElement) {
        // Remove any existing picker
        const existingPicker = document.querySelector('.message-reaction-picker');
        if (existingPicker) existingPicker.remove();

        const picker = document.createElement('div');
        picker.className = 'message-reaction-picker';

        const quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
        quickEmojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'message-reaction-option';
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                addMessageReaction(messageId, emoji);
                picker.remove();
            });
            picker.appendChild(btn);
        });

        // Position picker near button
        const rect = buttonElement.getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.top = (rect.top - 50) + 'px';
        picker.style.left = rect.left + 'px';

        document.body.appendChild(picker);

        // Close picker when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePicker(e) {
                if (!picker.contains(e.target) && e.target !== buttonElement) {
                    picker.remove();
                    document.removeEventListener('click', closePicker);
                }
            });
        }, 10);
    }

    // Add reaction to a message
    function addMessageReaction(messageId, emoji) {
        console.log('[MESSAGE-REACTIONS] Adding reaction:', emoji, 'to message:', messageId);

        // Client-side validation
        if (!messageId || messageId.length > 100) {
            console.error('[MESSAGE-REACTIONS] Invalid message ID');
            showSubtitle('Error', 'Invalid message ID', false);
            return;
        }

        if (!emoji || emoji.length > 20) {
            console.error('[MESSAGE-REACTIONS] Invalid emoji');
            showSubtitle('Error', 'Invalid emoji', false);
            return;
        }

        // Validate message ID format
        if (!messageId.startsWith('msg_')) {
            console.error('[MESSAGE-REACTIONS] Invalid message ID format');
            showSubtitle('Error', 'Invalid message format', false);
            return;
        }

        // Update local state
        if (!messageReactions.has(messageId)) {
            messageReactions.set(messageId, {});
        }
        const reactions = messageReactions.get(messageId);
        reactions[emoji] = (reactions[emoji] || 0) + 1;

        // Update UI
        updateMessageReactionsUI(messageId);

        // Broadcast to other participants
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'message_reaction',
                room_id: roomID,
                message_id: messageId,
                emoji: emoji,
                user_name: userName
            }));
        } else {
            console.error('[MESSAGE-REACTIONS] Socket not ready');
            showSubtitle('Error', 'Connection not ready', false);
        }
    }

    // Update message reactions UI
    function updateMessageReactionsUI(messageId) {
        const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
        if (!messageDiv) return;

        const reactionsContainer = messageDiv.querySelector('.message-reactions');
        if (!reactionsContainer) return;

        reactionsContainer.innerHTML = '';

        const reactions = messageReactions.get(messageId);
        if (!reactions) return;

        Object.entries(reactions).forEach(([emoji, count]) => {
            const reactionItem = document.createElement('div');
            reactionItem.className = 'reaction-item';

            const reactionEmoji = document.createElement('span');
            reactionEmoji.className = 'reaction-emoji';
            reactionEmoji.textContent = emoji;
            reactionItem.appendChild(reactionEmoji);

            const reactionCount = document.createElement('span');
            reactionCount.className = 'reaction-count';
            reactionCount.textContent = count;
            reactionItem.appendChild(reactionCount);

            reactionItem.addEventListener('click', () => {
                addMessageReaction(messageId, emoji);
            });

            reactionsContainer.appendChild(reactionItem);
        });
    }

    // Reply functionality
    let currentReplyTo = null;

    function setReplyTo(messageId, senderName, text) {
        currentReplyTo = { messageId, senderName, text };

        const replyPreview = document.getElementById('replyPreview');
        const replyToName = document.getElementById('replyToName');
        const replyToText = document.getElementById('replyToText');

        if (replyPreview && replyToName && replyToText) {
            replyToName.textContent = senderName;
            replyToText.textContent = text.length > 50 ? text.substring(0, 50) + '...' : text;
            replyPreview.style.display = 'flex';
        }

        // Focus input
        if (messageInput) {
            messageInput.focus();
        }
    }

    function clearReplyTo() {
        currentReplyTo = null;
        const replyPreview = document.getElementById('replyPreview');
        if (replyPreview) {
            replyPreview.style.display = 'none';
        }
    }

    // Reply preview close button
    const replyPreviewClose = document.getElementById('replyPreviewClose');
    if (replyPreviewClose) {
        replyPreviewClose.addEventListener('click', clearReplyTo);
    }

    function sendMessage(textOverride = null) {
        const text = textOverride || messageInput.value.trim();
        const recipient = recipientSelect.value;

        console.log('[GROUP-CALL] 💬 Sending message:', text, 'to:', recipient, 'socket:', socket?.readyState);

        if (!text) {
            console.warn('[GROUP-CALL] Empty message, not sending');
            return;
        }

        // Client-side validation
        const isGif = text.startsWith('[GIF]');
        const maxLength = isGif ? 2000 : 5000;

        if (text.length > maxLength) {
            console.error('[GROUP-CALL] Message too long:', text.length);
            showSubtitle('Error', `Message too long (max ${maxLength} characters)`, false);
            return;
        }

        // Validate GIF URL
        if (isGif) {
            const gifUrl = text.substring(5);
            if (!gifUrl.startsWith('https://')) {
                console.error('[GROUP-CALL] Invalid GIF URL');
                showSubtitle('Error', 'Invalid GIF URL: must use HTTPS', false);
                return;
            }
        }

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error('[GROUP-CALL] Cannot send message, socket not ready. State:', socket?.readyState);
            showSubtitle('Error', 'Connection not ready. Please wait...', false);
            return;
        }

        if (!myParticipantId) {
            console.error('[GROUP-CALL] Cannot send message, no participant ID');
            return;
        }

        try {
            const chatMessage = {
                type: 'chat',
                data: JSON.stringify({
                    text: text,
                    to: recipient,
                    from: myParticipantId,
                    fromName: myName,
                    replyTo: currentReplyTo // Include reply data
                })
            };

            socket.send(JSON.stringify(chatMessage));
            console.log('[GROUP-CALL] ✅ Message sent successfully');

            // Display sent message
            const isPrivate = recipient !== 'everyone';
            const recipientName = isPrivate ? recipientSelect.options[recipientSelect.selectedIndex].text : null;

            const displayText = isPrivate ? `To ${recipientName}: ${text}` : text;
            appendMessage(displayText, 'sent', myParticipantId, myName, isPrivate, currentReplyTo);

            if (!textOverride) {
                messageInput.value = '';
            }

            // Clear reply after sending
            clearReplyTo();
        } catch (error) {
            console.error('[GROUP-CALL] ❌ Failed to send message:', error);
            alert('Failed to send message. Please try again.');
        }
    }

    function updateRecipientList() {
        // Clear existing options except "Everyone"
        recipientSelect.innerHTML = '<option value="everyone">Everyone</option>';

        // Add each participant as an option
        participants.forEach((participant, participantId) => {
            const option = document.createElement('option');
            option.value = participantId;
            option.textContent = participant.name;
            recipientSelect.appendChild(option);
        });
    }

    // Add participant tile to grid
    function addParticipantTile(participantId, participantName) {
        console.log('[GROUP-CALL] 👤 Adding participant tile:', participantName, 'ID:', participantId);

        if (participants.has(participantId)) {
            console.log('[GROUP-CALL] ⚠️ Participant already exists:', participantId);
            return; // Already exists
        }

        const tile = document.createElement('div');
        tile.className = 'participant-tile';
        tile.id = `participant-${participantId}`;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsinline = true;
        video.muted = false; // Remote video should NOT be muted
        video.id = `video-${participantId}`;

        const speakingIndicator = document.createElement('div');
        speakingIndicator.className = 'speaking-indicator';
        speakingIndicator.innerHTML = `
            🎤 Speaking
            <div class="speaking-wave"></div>
            <div class="speaking-wave"></div>
            <div class="speaking-wave"></div>
        `;

        const name = document.createElement('div');
        name.className = 'participant-name';
        name.textContent = participantName;

        const status = document.createElement('div');
        status.className = 'participant-status';

        const micIndicator = document.createElement('span');
        micIndicator.className = 'mic-indicator active';
        status.appendChild(micIndicator);

        // Add host controls if current user is host
        const isHost = isCurrentUserHost();
        if (isHost) {
            const hostControls = document.createElement('div');
            hostControls.className = 'host-controls';

            const muteMicBtn = document.createElement('button');
            muteMicBtn.className = 'host-control-btn mute-mic-btn';
            muteMicBtn.title = 'Mute microphone';
            muteMicBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                </svg>
            `;
            muteMicBtn.onclick = (e) => {
                e.stopPropagation();
                requestMuteParticipant(participantId, 'audio');
            };

            const muteVideoBtn = document.createElement('button');
            muteVideoBtn.className = 'host-control-btn mute-video-btn';
            muteVideoBtn.title = 'Disable camera';
            muteVideoBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
                </svg>
            `;
            muteVideoBtn.onclick = (e) => {
                e.stopPropagation();
                requestMuteParticipant(participantId, 'video');
            };

            hostControls.appendChild(muteMicBtn);
            hostControls.appendChild(muteVideoBtn);
            tile.appendChild(hostControls);
        }

        tile.appendChild(video);
        tile.appendChild(speakingIndicator);
        tile.appendChild(name);
        tile.appendChild(status);

        participantsGrid.appendChild(tile);

        participants.set(participantId, {
            name: participantName,
            videoElement: video,
            tile: tile
        });

        console.log('[GROUP-CALL] 👤 Participant stored. Total participants:', participants.size);

        // Check if there's an orphan stream waiting for this participant
        if (orphanStreams.has(participantId)) {
            const stream = orphanStreams.get(participantId);
            console.log('[GROUP-CALL] 📺 Found orphan stream for:', participantName, 'tracks:', stream.getTracks().length);
            video.srcObject = stream;
            video.playsInline = true;
            video.muted = false;
            orphanStreams.delete(participantId);
            console.log('[GROUP-CALL] ✅ Attached orphan stream to participant:', participantName);

            // Force play with mobile-friendly approach
            const tryPlay = () => {
                video.play()
                    .then(() => console.log('[GROUP-CALL] ✅ Orphan video playing for', participantName))
                    .catch(e => {
                        console.error('[GROUP-CALL] ❌ Orphan video play failed:', e);
                        const playOnInteraction = () => {
                            video.play().catch(() => {});
                            document.removeEventListener('touchstart', playOnInteraction);
                            document.removeEventListener('click', playOnInteraction);
                        };
                        document.addEventListener('touchstart', playOnInteraction, { once: true });
                        document.addEventListener('click', playOnInteraction, { once: true });
                    });
            };
            setTimeout(tryPlay, 100);
            setTimeout(tryPlay, 500);
        } else {
            console.log('[GROUP-CALL] ℹ️ No orphan stream yet for:', participantName);
        }

        updateGridLayout();
        console.log('[GROUP-CALL] ✅ Added participant tile:', participantName);
    }

    function addParticipantTileEnhanced(participantId, participantName) {
        addParticipantTile(participantId, participantName);
        updateRecipientList();
    }

    // Remove participant tile
    function removeParticipantTile(participantId) {
        const participant = participants.get(participantId);
        if (participant) {
            // Clean up audio context if exists
            const audioContext = audioContexts.get(participantId);
            if (audioContext) {
                audioContext.close().catch(e => console.warn('[GROUP-CALL] Failed to close audio context:', e));
                audioContexts.delete(participantId);
            }

            // Clean up video stream
            if (participant.videoElement && participant.videoElement.srcObject) {
                const tracks = participant.videoElement.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                participant.videoElement.srcObject = null;
            }

            participant.tile.remove();
            participants.delete(participantId);
            updateGridLayout();
            console.log('[GROUP-CALL] ✅ Removed participant and cleaned up:', participant.name);
        }
    }

    function removeParticipantTileEnhanced(participantId) {
        removeParticipantTile(participantId);
        updateRecipientList();
    }

    // Update grid layout based on participant count
    function updateGridLayout() {
        const count = participants.size + 1; // +1 for local tile
        participantsGrid.setAttribute('data-count', count.toString());
    }

    // Update participant count display
    function updateParticipantCount(count) {
        participantCount.textContent = count === 1 ? '1 participant' : `${count} participants`;
    }

    // Toggle camera
    async function toggleCamera() {
        if (!localStream || localStream.getVideoTracks().length === 0) {
            // Camera is off - need to request it
            try {
                const cameraId = sessionStorage.getItem('cameraId');
                const videoStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        deviceId: cameraId ? { exact: cameraId } : undefined,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                const videoTrack = videoStream.getVideoTracks()[0];
                localVideo.srcObject = videoStream;

                // Add track to peer connection and trigger renegotiation
                if (peerConnection) {
                    const sender = peerConnection.addTrack(videoTrack, videoStream);
                    console.log('[GROUP-CALL] 📹 Added video track to peer connection, sender:', sender);

                    // Create new offer with video track
                    try {
                        const offer = await createEnhancedOffer();

                        socket.send(JSON.stringify({
                            type: 'offer',
                            data: JSON.stringify(offer)
                        }));
                        console.log('[GROUP-CALL] 📤 Sent renegotiation offer with video track');
                    } catch (err) {
                        console.error('[GROUP-CALL] ❌ Failed to renegotiate:', err);
                    }
                }

                // Merge streams
                if (!localStream) {
                    localStream = videoStream;
                } else {
                    localStream.addTrack(videoTrack);
                }

                isCameraOn = true;
                cameraBtn.dataset.active = 'true';
                cameraBtn.querySelector('.icon-camera-on').style.display = 'block';
                cameraBtn.querySelector('.icon-camera-off').style.display = 'none';
                console.log('[GROUP-CALL] ✅ Camera turned ON');
            } catch (err) {
                console.error('[GROUP-CALL] ❌ Failed to turn on camera:', err);
                alert('Failed to access camera');
            }
        } else {
            // Camera is on - toggle it
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                isCameraOn = videoTrack.enabled;
                cameraBtn.dataset.active = isCameraOn.toString();
                cameraBtn.querySelector('.icon-camera-on').style.display = isCameraOn ? 'block' : 'none';
                cameraBtn.querySelector('.icon-camera-off').style.display = isCameraOn ? 'none' : 'block';
            }
        }
    }

    // Toggle microphone
    async function toggleMic() {
        if (!localStream || localStream.getAudioTracks().length === 0) {
            // Mic is off - need to request it
            try {
                const microphoneId = sessionStorage.getItem('microphoneId');
                const audioConstraints = microphoneId
                    ? buildAudioConstraints({ deviceId: { exact: microphoneId } })
                    : buildAudioConstraints();
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: audioConstraints
                });

                const audioTrack = audioStream.getAudioTracks()[0];

                // Add track to peer connection and trigger renegotiation
                if (peerConnection) {
                    const sender = peerConnection.addTrack(audioTrack, audioStream);
                    console.log('[GROUP-CALL] 🎤 Added audio track to peer connection, sender:', sender);

                    // Create new offer with audio track
                    try {
                        const offer = await createEnhancedOffer();
                        socket.send(JSON.stringify({
                            type: 'offer',
                            data: JSON.stringify(offer)
                        }));
                        console.log('[GROUP-CALL] 📤 Sent renegotiation offer with audio track');
                    } catch (err) {
                        console.error('[GROUP-CALL] ❌ Failed to renegotiate:', err);
                    }
                }

                // Merge streams
                if (!localStream) {
                    localStream = audioStream;
                } else {
                    localStream.addTrack(audioTrack);
                }

                isMicOn = true;
                micBtn.dataset.active = 'true';
                micBtn.querySelector('.icon-mic-on').style.display = 'block';
                micBtn.querySelector('.icon-mic-off').style.display = 'none';
                console.log('[GROUP-CALL] ✅ Microphone turned ON');
            } catch (err) {
                console.error('[GROUP-CALL] ❌ Failed to turn on microphone:', err);
                alert('Failed to access microphone');
            }
        } else {
            // Mic is on - toggle it
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                isMicOn = audioTrack.enabled;
                micBtn.dataset.active = isMicOn.toString();
                micBtn.querySelector('.icon-mic-on').style.display = isMicOn ? 'block' : 'none';
                micBtn.querySelector('.icon-mic-off').style.display = isMicOn ? 'none' : 'block';
            }
        }
    }

    // Cleanup function - thoroughly clean up all resources
    function cleanupCall() {
        console.log('[GROUP-CALL] 🧹 Cleaning up call resources...');

        // Stop monitoring
        stopQualityMonitoring();
        stopPreemptiveReconnection();
        stopDynacast();

        // Stop all local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
                console.log('[GROUP-CALL] 🛑 Stopped local track:', track.kind);
            });
            localStream = null;
        }

        // Close peer connection
        if (peerConnection) {
            peerConnection.getSenders().forEach(sender => {
                if (sender.track) {
                    sender.track.stop();
                }
            });
            peerConnection.close();
            peerConnection = null;
            console.log('[GROUP-CALL] 🛑 Closed peer connection');
        }

        // Close WebSocket
        if (socket) {
            clearHeartbeat();
            socket.close();
            socket = null;
            console.log('[GROUP-CALL] 🛑 Closed WebSocket');
        }

        // Clear all timers
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        if (controlsHideTimer) {
            clearTimeout(controlsHideTimer);
            controlsHideTimer = null;
        }

        // Close all audio contexts
        audioContexts.forEach((context, participantId) => {
            context.close().catch(e => console.warn('[GROUP-CALL] Failed to close audio context:', e));
        });
        audioContexts.clear();

        // Clear participants and their streams
        participants.forEach((participant, participantId) => {
            if (participant.videoElement && participant.videoElement.srcObject) {
                participant.videoElement.srcObject.getTracks().forEach(track => track.stop());
                participant.videoElement.srcObject = null;
            }
        });
        participants.clear();

        // Clear orphan streams
        orphanStreams.forEach((stream, streamId) => {
            stream.getTracks().forEach(track => track.stop());
        });
        orphanStreams.clear();

        // Reset state
        reconnectAttempts = 0;
        myParticipantId = null;
        isChatVisible = false;
        isChatSideBySide = false;

        console.log('[GROUP-CALL] ✅ Cleanup complete');
    }

    // End call
    function endCall() {
        cleanupCall();
        window.location.href = '/';
    }

    // Start call timer
    function startTimer() {
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            callTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // ============================================
    // CINEMATIC SUBTITLE SYSTEM
    // ============================================
    function showSubtitle(authorName, text, isGif = false) {
        if (!subtitleOverlay) {
            console.warn('[GROUP-CALL] Subtitle overlay not available');
            return;
        }

        const subtitle = document.createElement('div');
        subtitle.className = 'subtitle-message';

        if (isGif) {
            const author = document.createElement('span');
            author.className = 'subtitle-author';
            author.textContent = authorName + ':';
            subtitle.appendChild(author);

            const img = document.createElement('img');
            img.src = text;
            img.alt = 'GIF';
            img.loading = 'eager';
            subtitle.appendChild(img);
        } else {
            const author = document.createElement('span');
            author.className = 'subtitle-author';
            author.textContent = authorName + ':';
            subtitle.appendChild(author);

            const textNode = document.createTextNode(text);
            subtitle.appendChild(textNode);
        }

        subtitleOverlay.appendChild(subtitle);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            subtitle.classList.add('fade-out');
            setTimeout(() => {
                if (subtitle.parentElement) {
                    subtitle.remove();
                }
            }, 300);
        }, 5000);

        // Limit number of subtitles shown
        const subtitles = subtitleOverlay.children;
        if (subtitles.length > 3) {
            subtitles[0].remove();
        }
    }

    // ============================================
    // SPEAKING DETECTION
    // ============================================
    function setupSpeakingDetection(participantId, stream) {
        if (!stream || !stream.getAudioTracks().length) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioSource = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.8;
            audioSource.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            let speakingTimeout = null;

            function detectSpeaking() {
                analyser.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                const participant = participants.get(participantId);
                if (participant && participant.tile) {
                    if (average > 30) { // Speaking threshold
                        participant.tile.classList.add('speaking');
                        clearTimeout(speakingTimeout);
                        speakingTimeout = setTimeout(() => {
                            participant.tile.classList.remove('speaking');
                        }, 500);
                    }
                }

                requestAnimationFrame(detectSpeaking);
            }

            detectSpeaking();
            audioContexts.set(participantId, audioContext);
        } catch (err) {
            console.warn('[GROUP-CALL] Failed to setup speaking detection:', err);
        }
    }

    // ============================================
    // PARTICIPANTS MODAL
    // ============================================
    function updateParticipantsList() {
        participantsList.innerHTML = '';

        // Add self
        const selfItem = document.createElement('div');
        selfItem.className = 'participant-item';
        selfItem.innerHTML = `
            <div class="participant-avatar">${myName.charAt(0).toUpperCase()}</div>
            <div class="participant-info">
                <div class="participant-info-name">${myName} (You)</div>
                <div class="participant-info-status">Connected</div>
            </div>
            <div class="participant-speaking"></div>
        `;
        participantsList.appendChild(selfItem);

        // Add other participants
        participants.forEach((participant, participantId) => {
            const item = document.createElement('div');
            item.className = 'participant-item';
            item.innerHTML = `
                <div class="participant-avatar">${participant.name.charAt(0).toUpperCase()}</div>
                <div class="participant-info">
                    <div class="participant-info-name">${participant.name}</div>
                    <div class="participant-info-status">Connected</div>
                </div>
                <div class="participant-speaking"></div>
            `;
            participantsList.appendChild(item);
        });
    }

    // ============================================
    // SIMPLE CHAT TOGGLE SYSTEM
    // ============================================
    function toggleChat() {
        const isDesktop = window.innerWidth >= 769;

        if (!isChatVisible) {
            // Open chat
            isChatVisible = true;
            chatPanel.classList.add('active');

            if (isDesktop) {
                // Desktop: offer side-by-side after 1 second
                setTimeout(() => {
                    if (isChatVisible && !isChatSideBySide) {
                        showSideBySideHint();
                    }
                }, 1000);
            }

            chatBtnLabel.textContent = 'Close';
            chatBadge.style.display = 'none';
            chatBadge.textContent = '0';
            console.log('[GROUP-CALL] 💬 Chat opened');
        } else {
            // Close chat
            isChatVisible = false;
            isChatSideBySide = false;
            chatPanel.classList.remove('active');
            groupCallContainer.classList.remove('split-view');
            chatBtnLabel.textContent = 'Chat';
            console.log('[GROUP-CALL] 💬 Chat closed');
        }
    }

    function showSideBySideHint() {
        // Show subtle hint for split view
        const hint = document.createElement('div');
        hint.className = 'split-view-hint';
        hint.innerHTML = `
            <div class="hint-content">
                <span>💡 Tip: Click here to see video and chat side-by-side</span>
                <button class="hint-button" id="enableSplitView">Enable Split View</button>
                <button class="hint-close">✕</button>
            </div>
        `;
        chatPanel.insertBefore(hint, chatPanel.firstChild);

        // Enable split view
        hint.querySelector('#enableSplitView').addEventListener('click', () => {
            enableSplitView();
            hint.remove();
        });

        // Close hint
        hint.querySelector('.hint-close').addEventListener('click', () => {
            hint.remove();
        });

        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (hint.parentElement) {
                hint.remove();
            }
        }, 8000);
    }

    function enableSplitView() {
        const isDesktop = window.innerWidth >= 769;
        if (!isDesktop) return; // Only on desktop

        isChatSideBySide = true;
        groupCallContainer.classList.add('split-view');
        console.log('[GROUP-CALL] 📐 Split view enabled');
    }

    // Event listeners
    backButton.addEventListener('click', endCall);
    cameraBtn.addEventListener('click', toggleCamera);
    micBtn.addEventListener('click', toggleMic);
    endCallBtn.addEventListener('click', endCall);

    // AI Notetaker initialization
    if (isCurrentUserHost()) {
        await ensureNotetakerUI();
    }
    const notetakerBtn = document.getElementById('notetakerBtn');
    if (notetakerBtn) {
        console.log('[GROUP-CALL] 🤖 Initializing AI Notetaker...');

        // Check if host
        const isHost = isCurrentUserHost();

        if (isHost) {
            notetakerBtn.style.display = 'flex';
            const notetakerUIRoot = document.getElementById('notetakerGroup');
            if (!notetakerUIRoot) {
                console.error('[GROUP-CALL] ❌ Notetaker UI root missing after injection');
                notetakerBtn.style.display = 'none';
                console.warn('[GROUP-CALL] ⚠️ Hiding notetaker button because UI failed to load');
                return;
            }

            // Initialize notetaker for host - ONLY if classes are available
            if (typeof AINotetaker !== 'undefined' && typeof ConfigModalManager !== 'undefined') {
                console.log('[GROUP-CALL] ✅ AINotetaker and ConfigModalManager classes available');

                // Initialize after joining call
                notetakerBtn.addEventListener('click', () => {
                    console.log('[GROUP-CALL] 🎤 Notetaker button clicked');

                    if (!window.groupNotetaker) {
                        console.log('[GROUP-CALL] 📝 Creating new AINotetaker instance for group call...');
                        if (!document.getElementById('notetakerToggleBtn')) {
                            console.error('[GROUP-CALL] ❌ Notetaker controls missing');
                            alert('AI Notetaker UI not ready. Please reload the page.');
                            return;
                        }
                        try {
                            window.groupNotetaker = new AINotetaker(roomID, true);
                            console.log('[GROUP-CALL] ✅ AINotetaker instance created');

                            // Wait for modal manager to be initialized in AINotetaker constructor
                            setTimeout(() => {
                                if (window.configModalManager) {
                                    console.log('[GROUP-CALL] 🎨 Opening config modal');
                                    window.configModalManager.open();
                                } else {
                                    console.warn('[GROUP-CALL] ⚠️ Config modal manager not initialized yet');
                                    alert('AI Notetaker initialized! Click the button again to configure.');
                                }
                            }, 100);
                        } catch (err) {
                            console.error('[GROUP-CALL] ❌ Failed to create AINotetaker:', err);
                            alert('Failed to initialize AI Notetaker: ' + err.message);
                        }
                    } else {
                        console.log('[GROUP-CALL] 🎨 Opening existing config modal');
                        // Notetaker already exists, open config modal
                        if (window.configModalManager) {
                            window.configModalManager.open();
                        } else {
                            console.error('[GROUP-CALL] ❌ Config modal manager not found');
                            alert('Config modal not available. Please reload the page.');
                        }
                    }
                });
                console.log('[GROUP-CALL] ✅ Notetaker button configured for host');
            } else {
                console.warn('[GROUP-CALL] ⚠️ Required classes not found:', {
                    AINotetaker: typeof AINotetaker !== 'undefined',
                    ConfigModalManager: typeof ConfigModalManager !== 'undefined'
                });
                if (notetakerBtn) notetakerBtn.style.display = 'none';
            }
        } else {
            // Hide for guests
            if (notetakerBtn) notetakerBtn.style.display = 'none';
            console.log('[GROUP-CALL] Notetaker hidden for guest');
        }
    } else {
        console.warn('[GROUP-CALL] ⚠️ Notetaker button not found in DOM');
    }

    // Picture-in-Picture
    const pipBtn = document.getElementById('pipBtn');
    if (pipBtn) {
        pipBtn.addEventListener('click', async () => {
            try {
                // Try to enable PiP on local video or participants grid
                const videoElement = localVideo || document.querySelector('.participant-tile video');
                if (videoElement && document.pictureInPictureEnabled) {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                        console.log('[GROUP-CALL] PiP disabled');
                    } else {
                        await videoElement.requestPictureInPicture();
                        console.log('[GROUP-CALL] PiP enabled');
                    }
                } else {
                    alert('Picture-in-Picture not supported');
                }
            } catch (err) {
                console.error('[GROUP-CALL] PiP error:', err);
                alert('Could not enable Picture-in-Picture');
            }
        });
    }

    // Chat toggle - simple and reliable
    chatToggleBtn.addEventListener('click', toggleChat);

    chatBackBtn.addEventListener('click', () => {
        if (isChatSideBySide) {
            // In split view, back button disables split
            isChatSideBySide = false;
            groupCallContainer.classList.remove('split-view');
        } else {
            // In overlay, back button closes chat
            toggleChat();
        }
    });

    // Participants modal
    if (participantsBtn && participantsModal && participantsModalClose) {
        participantsBtn.addEventListener('click', () => {
            updateParticipantsList();
            participantsModal.style.display = 'flex';
        });

        participantsModalClose.addEventListener('click', () => {
            participantsModal.style.display = 'none';
        });

        participantsModal.addEventListener('click', (e) => {
            if (e.target === participantsModal) {
                participantsModal.style.display = 'none';
            }
        });
    }

    sendMessageBtn.addEventListener('click', () => sendMessage());
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });


    // Visibility change handler - keep connections alive in background
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('[GROUP-CALL] 📱 App backgrounded, keeping connections alive');
        } else {
            console.log('[GROUP-CALL] 📱 App foregrounded');
        }
    });

    // Page Before Unload - cleanup and warn about leaving call
    window.addEventListener('beforeunload', (e) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            cleanupCall();
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Initialize Emoji/GIF Picker
    let emojiGifPicker = null;
    if (window.EmojiGifPicker) {
        emojiGifPicker = new window.EmojiGifPicker({
            panelId: 'emojiPickerPanel',
            emojiBtnId: 'emojiBtn',
            gifBtnId: 'gifBtn',
            closeBtnId: 'emojiPickerClose',
            messageInputId: 'messageInput',
            sendCallback: (text) => {
                console.log('[GROUP-CALL] Emoji/GIF picker callback:', text);
                // Send the message (emoji or GIF)
                sendMessage(text);
            }
        });
        console.log('[GROUP-CALL] Emoji/GIF picker initialized');
    }

    // ============================================
    // FLYING REACTIONS & RAISE HAND
    // ============================================

    const reactionsBtn = document.getElementById('reactionsBtn');
    const raiseHandBtn = document.getElementById('raiseHandBtn');
    const quickReactionsPanel = document.getElementById('quickReactionsPanel');
    const flyingReactionsContainer = document.getElementById('flyingReactions');

    // Track raised hands state
    const raisedHands = new Set();
    let isHandRaised = false;

    // Toggle quick reactions panel
    if (reactionsBtn && quickReactionsPanel) {
        reactionsBtn.addEventListener('click', () => {
            const isVisible = quickReactionsPanel.style.display !== 'none';
            quickReactionsPanel.style.display = isVisible ? 'none' : 'flex';

            // Auto-hide after 5 seconds
            if (!isVisible) {
                setTimeout(() => {
                    quickReactionsPanel.style.display = 'none';
                }, 5000);
            }
        });

        // Send reaction when clicked
        const reactionButtons = quickReactionsPanel.querySelectorAll('.reaction-option');
        reactionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.dataset.emoji;
                console.log('[REACTIONS] Sending reaction:', emoji);

                // Client-side validation
                if (!emoji || emoji.length > 20) {
                    console.error('[REACTIONS] Invalid emoji');
                    showSubtitle('Error', 'Invalid reaction', false);
                    return;
                }

                // Send via WebSocket
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'reaction',
                        room_id: roomID,
                        emoji: emoji,
                        user_name: myName
                    }));
                } else {
                    console.error('[REACTIONS] Socket not ready');
                    showSubtitle('Error', 'Connection not ready', false);
                    return;
                }

                // Show locally immediately
                createFlyingReaction(emoji);

                // Hide panel
                quickReactionsPanel.style.display = 'none';
            });
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!reactionsBtn.contains(e.target) && !quickReactionsPanel.contains(e.target)) {
                quickReactionsPanel.style.display = 'none';
            }
        });
    }

    // Create flying reaction animation
    function createFlyingReaction(emoji, startX = null, startY = null) {
        if (!flyingReactionsContainer) return;

        const reaction = document.createElement('div');
        reaction.className = 'flying-reaction';
        reaction.textContent = emoji;

        // Random start position if not specified
        const x = startX !== null ? startX : Math.random() * (window.innerWidth - 100) + 50;
        const y = startY !== null ? startY : window.innerHeight - 100;

        // Random drift (-50px to +50px)
        const driftX = (Math.random() - 0.5) * 100;

        reaction.style.left = x + 'px';
        reaction.style.top = y + 'px';
        reaction.style.setProperty('--drift-x', driftX + 'px');

        flyingReactionsContainer.appendChild(reaction);

        // Remove after animation
        setTimeout(() => {
            reaction.remove();
        }, 3000);
    }

    // Raise hand toggle
    if (raiseHandBtn) {
        raiseHandBtn.addEventListener('click', () => {
            isHandRaised = !isHandRaised;

            console.log('[RAISE-HAND]', isHandRaised ? 'Raising hand' : 'Lowering hand');

            // Update button state
            raiseHandBtn.style.background = isHandRaised
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : '';

            // Send via WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'raise_hand',
                    room_id: roomID,
                    user_name: myName,
                    raised: isHandRaised
                }));
            }

            // Update local UI
            updateRaisedHandIndicator(myName, isHandRaised);
        });
    }

    // Update raised hand indicator on participant tile
    function updateRaisedHandIndicator(participantName, raised) {
        // Find the participant tile
        const participantTiles = document.querySelectorAll('.participant-tile');

        participantTiles.forEach(tile => {
            const nameLabel = tile.querySelector('.participant-name');
            if (nameLabel && nameLabel.textContent === participantName) {
                // Remove existing indicator
                const existingIndicator = tile.querySelector('.raised-hand-indicator');
                if (existingIndicator) {
                    existingIndicator.remove();
                }

                // Add indicator if hand is raised
                if (raised) {
                    const indicator = document.createElement('div');
                    indicator.className = 'raised-hand-indicator';
                    indicator.innerHTML = '✋ <span>HAND</span>';
                    tile.appendChild(indicator);

                    raisedHands.add(participantName);
                } else {
                    raisedHands.delete(participantName);
                }
            }
        });
    }

    // ============================================
    // SETTINGS SCREEN LOGIC
    // ============================================

    // Start camera preview immediately
    async function startPreview() {
        try {
            previewStatus.textContent = 'Starting camera...';

            // Mobile-friendly constraints
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            const constraints = {
                video: isCameraOn ? (isMobile ? {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }) : false,
                audio: isMicOn ? buildAudioConstraints() : false
            };

            console.log('[GROUP-CALL] 📱 Device:', isMobile ? 'Mobile' : 'Desktop', 'Requesting media...');

            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            previewVideo.srcObject = localStream;

            // Log tracks
            const tracks = localStream.getTracks();
            console.log('[GROUP-CALL] ✅ Got', tracks.length, 'tracks:', tracks.map(t => `${t.kind} (enabled: ${t.enabled})`).join(', '));

            previewStatus.textContent = isCameraOn ? 'Camera ready' : 'Camera off';
            console.log('[GROUP-CALL] ✅ Preview started - Camera:', isCameraOn, 'Mic:', isMicOn);
        } catch (err) {
            console.error('[GROUP-CALL] ❌ Preview failed:', err.name, '-', err.message);
            previewStatus.textContent = 'Failed to access camera/mic';

            // Try fallback with basic constraints
            try {
                console.log('[GROUP-CALL] 🔄 Trying fallback (basic constraints)...');
                const fallbackConstraints = { video: isCameraOn, audio: isMicOn ? buildAudioConstraints() : false };
                localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
                previewVideo.srcObject = localStream;
                previewStatus.textContent = 'Using basic quality';
                console.log('[GROUP-CALL] ✅ Fallback succeeded');
            } catch (fallbackErr) {
                console.error('[GROUP-CALL] ❌ Fallback also failed:', fallbackErr.name, '-', fallbackErr.message);
            }
        }
    }

    // Toggle camera in preview
    cameraToggle.addEventListener('change', async () => {
        isCameraOn = cameraToggle.checked;

        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.stop();
                localStream.removeTrack(videoTrack);
            }

            if (isCameraOn) {
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    localStream.addTrack(newVideoTrack);
                    previewVideo.srcObject = localStream;
                    previewStatus.textContent = 'Camera ready';
                } catch (err) {
                    console.error('[GROUP-CALL] Failed to enable camera:', err);
                    previewStatus.textContent = 'Camera unavailable';
                }
            } else {
                previewVideo.srcObject = null;
                previewStatus.textContent = 'Camera off';
            }
        }
    });

    // Toggle mic in preview
    micToggle.addEventListener('change', async () => {
        isMicOn = micToggle.checked;

        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.stop();
                localStream.removeTrack(audioTrack);
            }

            if (isMicOn) {
                try {
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        audio: buildAudioConstraints()
                    });
                    const newAudioTrack = newStream.getAudioTracks()[0];
                    localStream.addTrack(newAudioTrack);
                } catch (err) {
                    console.error('[GROUP-CALL] Failed to enable mic:', err);
                }
            }
        }
    });

    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        // Load saved language or default to Ukrainian
        const savedLang = localStorage.getItem('preferredLanguage') || 'uk';
        languageSelect.value = savedLang;

        languageSelect.addEventListener('change', (e) => {
            const lang = e.target.value;
            localStorage.setItem('preferredLanguage', lang);
            console.log('[GROUP-CALL] Language changed to:', lang);
        });
    }

    // Join button - hide settings, show call screen, connect
    joinButton.addEventListener('click', async () => {
        // Get name
        myName = nameInput.value.trim() || 'User';
        sessionStorage.setItem('guestName', myName);

        // Save selected language
        if (languageSelect) {
            const selectedLang = languageSelect.value;
            localStorage.setItem('preferredLanguage', selectedLang);
        }

        if (!localStream) {
            alert('Please enable camera or microphone');
            return;
        }

        console.log('[GROUP-CALL] 🚀🚀🚀 JOIN BUTTON - Joining call as:', myName);

        // Hide settings, show call
        settingsScreen.style.display = 'none';
        groupCallContainer.style.display = 'flex';
        console.log('[GROUP-CALL] ✅ UI switched to call screen');

        // Copy stream to local video
        localVideo.srcObject = localStream;
        console.log('[GROUP-CALL] ✅ Local video set');

        // Update button states - SAFE with null checks
        try {
            cameraBtn.dataset.active = isCameraOn;
            const camOn = cameraBtn.querySelector('.icon-camera-on');
            const camOff = cameraBtn.querySelector('.icon-camera-off');
            if (camOn && camOff) {
                camOn.style.display = isCameraOn ? 'block' : 'none';
                camOff.style.display = isCameraOn ? 'none' : 'block';
            }

            micBtn.dataset.active = isMicOn;
            const micOn = micBtn.querySelector('.icon-mic-on');
            const micOff = micBtn.querySelector('.icon-mic-off');
            if (micOn && micOff) {
                micOn.style.display = isMicOn ? 'block' : 'none';
                micOff.style.display = isMicOn ? 'none' : 'block';
            }
            console.log('[GROUP-CALL] ✅ Buttons updated');
        } catch (err) {
            console.error('[GROUP-CALL] ❌ Button update failed:', err);
        }

        // Connect to SFU
        console.log('[GROUP-CALL] 🔥🔥🔥 CALLING connectToSFU()...');
        connectToSFU();
        console.log('[GROUP-CALL] ✅ connectToSFU() called');
        startTimer();
        updateGridLayout();

        // Initialize auto-hide controls
        initAutoHideControls();
    });

    // Host control functions
    function requestMuteParticipant(participantId, mediaType) {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('[GROUP-CALL] Cannot send mute request - socket not open');
            return;
        }

        console.log(`[GROUP-CALL] Host requesting to mute ${mediaType} for participant:`, participantId);

        socket.send(JSON.stringify({
            type: 'host-mute-request',
            data: JSON.stringify({
                targetParticipantId: participantId,
                mediaType: mediaType // 'audio' or 'video'
            })
        }));
    }

    // Auto-hide controls logic
    let controlsHideTimer = null;
    let controlsVisible = true;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    function initAutoHideControls() {
        const topControls = document.querySelector('.top-controls');
        const bottomControls = document.querySelector('.bottom-controls');

        if (!topControls || !bottomControls) {
            console.warn('[GROUP-CALL] Controls not found for auto-hide');
            return;
        }

        function showControls() {
            if (!controlsVisible) {
                topControls.classList.remove('hidden');
                bottomControls.classList.remove('hidden');
                controlsVisible = true;
            }

            // Clear existing timer
            if (controlsHideTimer) {
                clearTimeout(controlsHideTimer);
            }

            // Auto-hide after 5 seconds (both desktop and mobile)
            controlsHideTimer = setTimeout(() => {
                topControls.classList.add('hidden');
                bottomControls.classList.add('hidden');
                controlsVisible = false;
            }, 5000);
        }

        function toggleControls() {
            if (controlsVisible) {
                topControls.classList.add('hidden');
                bottomControls.classList.add('hidden');
                controlsVisible = false;
                if (controlsHideTimer) {
                    clearTimeout(controlsHideTimer);
                }
            } else {
                showControls();
            }
        }

        // Desktop: mouse movement shows controls
        if (!isMobile) {
            groupCallContainer.addEventListener('mousemove', showControls);
            showControls(); // Show initially
        }

        // Mobile: tap on video area toggles controls
        if (isMobile) {
            groupCallContainer.addEventListener('click', (e) => {
                // Don't toggle if clicking on buttons, controls, or chat
                if (e.target.closest('button') ||
                    e.target.closest('.control-btn') ||
                    e.target.closest('.top-controls') ||
                    e.target.closest('.bottom-controls') ||
                    e.target.closest('#chatPanel')) {
                    return;
                }
                toggleControls();
            });

            groupCallContainer.addEventListener('touchend', (e) => {
                // Don't toggle if touching buttons or controls
                if (e.target.closest('button') ||
                    e.target.closest('.control-btn') ||
                    e.target.closest('.top-controls') ||
                    e.target.closest('.bottom-controls') ||
                    e.target.closest('#chatPanel')) {
                    return;
                }
                e.preventDefault(); // Prevent double-firing
                toggleControls();
            }, { passive: false });

            // Start with controls visible on mobile
            showControls();
        }

        console.log('[GROUP-CALL] ✅ Auto-hide controls initialized');
    }

    // Export sendMessage for GIF picker
    window.sendChatMessage = function(text) {
        console.log('[GROUP-CALL] sendChatMessage called with:', text);
        sendMessage(text);
    };

    // GIF button handler
    const gifBtn = document.getElementById('gifBtn');
    if (gifBtn && window.EmojiGifPicker) {
        gifBtn.addEventListener('click', () => {
            const picker = new window.EmojiGifPicker(messageInput, (type, value) => {
                if (type === 'gif') {
                    // Send GIF with [GIF] prefix
                    console.log('[GROUP-CALL] 🎬 Sending GIF:', value);
                    sendMessage(`[GIF]${value}`);
                } else {
                    // Insert emoji at cursor
                    messageInput.value += value;
                    messageInput.focus();
                }
            });
            picker.show();
        });
    }

    // Emoji button handler
    const emojiBtn = document.getElementById('emojiBtn');
    if (emojiBtn && window.EmojiGifPicker) {
        emojiBtn.addEventListener('click', () => {
            const picker = new window.EmojiGifPicker(messageInput, (type, value) => {
                if (type === 'emoji') {
                    // Insert emoji at cursor
                    messageInput.value += value;
                    messageInput.focus();
                }
            });
            picker.show();
        });
    }

    // Start preview on page load
    startPreview();
});
