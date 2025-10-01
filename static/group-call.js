document.addEventListener('DOMContentLoaded', async () => {
    console.log('[GROUP-CALL] Initializing...');

    // UI Elements
    const participantsGrid = document.getElementById('participantsGrid');
    const localVideo = document.getElementById('localVideo');
    const participantCount = document.getElementById('participantCount');
    const callTimer = document.getElementById('callTimer');
    const backButton = document.getElementById('backButton');
    const cameraBtn = document.getElementById('cameraBtn');
    const micBtn = document.getElementById('micBtn');
    const endCallBtn = document.getElementById('endCallBtn');
    const chatBtn = document.getElementById('chatBtn');
    const chatBadge = document.getElementById('chatBadge');

    // State
    let socket = null;
    let localStream = null;
    let peerConnection = null;
    let participants = new Map(); // participantId -> { name, videoElement, stream }
    let isCameraOn = true;
    let isMicOn = true;
    let callStartTime = Date.now();
    let timerInterval = null;
    let myParticipantId = null;
    let myName = 'You';

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'room') {
        alert('No room ID found');
        window.location.href = '/';
        return;
    }

    // WebRTC configuration
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Fetch TURN credentials
    try {
        const response = await fetch('/api/turn-credentials');
        const creds = await response.json();
        if (creds.host && creds.username && creds.password) {
            config.iceServers.push({
                urls: [`turn:${creds.host}:3478`],
                username: creds.username,
                credential: creds.password
            });
            console.log('[GROUP-CALL] TURN server configured');
        }
    } catch (err) {
        console.warn('[GROUP-CALL] Failed to fetch TURN credentials:', err);
    }

    // Initialize local media
    async function initLocalMedia() {
        try {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: true
            });
            localVideo.srcObject = localStream;
            console.log('[GROUP-CALL] Local media initialized');
            return true;
        } catch (err) {
            console.error('[GROUP-CALL] Failed to get local media:', err);
            alert('Failed to access camera/microphone');
            return false;
        }
    }

    // Initialize WebRTC peer connection
    function initPeerConnection() {
        peerConnection = new RTCPeerConnection(config);

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
                console.log('[GROUP-CALL] Added local track:', track.kind);
            });
        }

        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
            console.log('[GROUP-CALL] Received remote track:', event.track.kind);
            // In SFU, we'll receive tracks from all participants
            // The SFU will tell us which participant each track belongs to via signaling
        };

        // ICE candidate handling
        peerConnection.onicecandidate = (event) => {
            if (event.candidate && socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'ice-candidate',
                    data: JSON.stringify(event.candidate)
                }));
            }
        };

        // Connection state monitoring
        peerConnection.onconnectionstatechange = () => {
            console.log('[GROUP-CALL] Connection state:', peerConnection.connectionState);
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('[GROUP-CALL] ICE state:', peerConnection.iceConnectionState);
        };

        return peerConnection;
    }

    // Connect to SFU via WebSocket
    function connectToSFU() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws-sfu?room=${roomID}&name=${encodeURIComponent(myName)}`;

        socket = new WebSocket(wsUrl);

        socket.onopen = async () => {
            console.log('[GROUP-CALL] WebSocket connected');

            // Initialize peer connection and create offer
            initPeerConnection();

            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);

                socket.send(JSON.stringify({
                    type: 'offer',
                    data: JSON.stringify(offer)
                }));
                console.log('[GROUP-CALL] Sent offer to SFU');
            } catch (err) {
                console.error('[GROUP-CALL] Failed to create offer:', err);
            }
        };

        socket.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                await handleSignalingMessage(message);
            } catch (err) {
                console.error('[GROUP-CALL] Failed to parse message:', err);
            }
        };

        socket.onerror = (error) => {
            console.error('[GROUP-CALL] WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('[GROUP-CALL] WebSocket closed');
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
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('[GROUP-CALL] Set remote description (answer)');
                break;

            case 'ice-candidate':
                // SFU sent ICE candidate
                const candidate = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[GROUP-CALL] Added ICE candidate');
                break;

            case 'participants-list':
                // List of existing participants
                const existingParticipants = message.data || [];
                existingParticipants.forEach(p => {
                    addParticipantTile(p.id, p.name);
                });
                break;

            case 'participant-joined':
                // New participant joined
                const joined = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                addParticipantTile(joined.id, joined.name);
                updateParticipantCount(participants.size + 1);
                break;

            case 'participant-left':
                // Participant left
                const left = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                removeParticipantTile(left.id);
                updateParticipantCount(participants.size + 1);
                break;

            case 'track-published':
                // A participant published a new track
                const trackInfo = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[GROUP-CALL] Track published:', trackInfo);
                // The SFU will automatically forward this track to us
                break;

            case 'chat':
                // Chat message received
                console.log('[GROUP-CALL] Chat from', message.from, ':', message.data);
                // TODO: Handle chat UI
                break;

            default:
                console.warn('[GROUP-CALL] Unknown message type:', message.type);
        }
    }

    // Add participant tile to grid
    function addParticipantTile(participantId, participantName) {
        if (participants.has(participantId)) {
            return; // Already exists
        }

        const tile = document.createElement('div');
        tile.className = 'participant-tile';
        tile.id = `participant-${participantId}`;

        const video = document.createElement('video');
        video.autoplay = true;
        video.playsinline = true;
        video.id = `video-${participantId}`;

        const name = document.createElement('div');
        name.className = 'participant-name';
        name.textContent = participantName;

        const status = document.createElement('div');
        status.className = 'participant-status';

        const micIndicator = document.createElement('span');
        micIndicator.className = 'mic-indicator active';
        status.appendChild(micIndicator);

        tile.appendChild(video);
        tile.appendChild(name);
        tile.appendChild(status);

        participantsGrid.appendChild(tile);

        participants.set(participantId, {
            name: participantName,
            videoElement: video,
            tile: tile
        });

        updateGridLayout();
        console.log('[GROUP-CALL] Added participant:', participantName);
    }

    // Remove participant tile
    function removeParticipantTile(participantId) {
        const participant = participants.get(participantId);
        if (participant) {
            participant.tile.remove();
            participants.delete(participantId);
            updateGridLayout();
            console.log('[GROUP-CALL] Removed participant:', participant.name);
        }
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
    function toggleCamera() {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                isCameraOn = videoTrack.enabled;
                cameraBtn.setAttribute('data-active', isCameraOn.toString());
            }
        }
    }

    // Toggle microphone
    function toggleMic() {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                isMicOn = audioTrack.enabled;
                micBtn.setAttribute('data-active', isMicOn.toString());
            }
        }
    }

    // End call
    function endCall() {
        if (socket) {
            socket.close();
        }
        if (peerConnection) {
            peerConnection.close();
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
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

    // Event listeners
    backButton.addEventListener('click', endCall);
    cameraBtn.addEventListener('click', toggleCamera);
    micBtn.addEventListener('click', toggleMic);
    endCallBtn.addEventListener('click', endCall);
    chatBtn.addEventListener('click', () => {
        console.log('[GROUP-CALL] Chat clicked');
        // TODO: Open chat panel
    });

    // Initialize
    const mediaReady = await initLocalMedia();
    if (mediaReady) {
        connectToSFU();
        startTimer();
        updateGridLayout();
    }
});
