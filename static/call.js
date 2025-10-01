document.addEventListener('DOMContentLoaded', () => {
    console.log('[CALL] Page loaded');

    // UI Elements
    const callContainer = document.getElementById('callContainer');
    const remoteVideo = document.getElementById('remoteVideo');
    const localVideo = document.getElementById('localVideo');
    const remotePlaceholder = document.getElementById('remotePlaceholder');
    const localPip = document.getElementById('localPip');

    // Buttons
    const backButton = document.getElementById('backButton');
    const cameraBtn = document.getElementById('cameraBtn');
    const microphoneBtn = document.getElementById('microphoneBtn');
    const flipCameraBtn = document.getElementById('flipCameraBtn');
    const endCallButton = document.getElementById('endCallButton');
    const chatIconBtn = document.getElementById('chatIconBtn');
    const chatBadge = document.getElementById('chatBadge');

    // Chat
    const chatPanel = document.getElementById('chatPanel');
    const chatBackBtn = document.getElementById('chatBackBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatEmpty = document.getElementById('chatEmpty');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');

    // Timer
    const timerText = document.getElementById('timerText');

    // State
    let socket = null;
    let webrtc = null;
    let isCameraOn = true;
    let isMicOn = true;
    let callStartTime = null;
    let timerInterval = null;
    let wakeLock = null;
    let isInitiator = false;
    let peerConnected = false;
    let unreadMessages = 0;

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'room') {
        alert('No room ID found. Please create a meeting first.');
        window.location.href = '/';
        return;
    }

    // Initialize
    connectToRoom(roomID);
    startCallTimer();
    requestWakeLock();

    // Prevent accidental page close
    window.addEventListener('beforeunload', (e) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            e.preventDefault();
            return '';
        }
    });

    // Wake Lock
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('[CALL] Wake Lock acquired');
            }
        } catch (err) {
            console.warn('[CALL] Wake Lock not supported:', err);
        }
    }

    function releaseWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release().then(() => {
                wakeLock = null;
            });
        }
    }

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });

    // Call timer
    function startCallTimer() {
        callStartTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            timerText.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Connect to room and initialize WebRTC
    async function connectToRoom(roomId) {
        try {
            const guestName = sessionStorage.getItem('guestName') || 'Guest';
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws?room=${roomId}&name=${encodeURIComponent(guestName)}`;
            socket = new WebSocket(wsUrl);

            socket.onopen = async () => {
                console.log('[CALL] WebSocket connected');

                // Initialize WebRTC
                webrtc = new WebRTCManager(socket, roomId);
                const initialized = await webrtc.initialize();

                if (initialized) {
                    socket.send(JSON.stringify({
                        type: 'join',
                        room: roomId
                    }));

                    setTimeout(() => {
                        if (!peerConnected) {
                            isInitiator = true;
                            console.log('[CALL] I am the initiator');
                        }
                    }, 1000);
                }
            };

            socket.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                console.log('[CALL] Message received:', message.type);

                switch (message.type) {
                    case 'join':
                        console.log('[CALL] Partner joined');
                        if (isInitiator && webrtc) {
                            await webrtc.createOffer();
                        }
                        break;

                    case 'offer':
                        const offer = JSON.parse(message.data);
                        await webrtc.handleOffer(offer);
                        peerConnected = true;
                        break;

                    case 'answer':
                        const answer = JSON.parse(message.data);
                        await webrtc.handleAnswer(answer);
                        peerConnected = true;
                        break;

                    case 'ice-candidate':
                        const candidate = JSON.parse(message.data);
                        await webrtc.handleICECandidate(candidate);
                        break;

                    case 'chat':
                        appendMessage(message.data, 'received');
                        if (!chatPanel.classList.contains('active')) {
                            unreadMessages++;
                            updateChatBadge();
                        }
                        break;

                    case 'leave':
                        console.log('[CALL] Partner left');
                        remotePlaceholder.style.display = 'flex';
                        break;
                }
            };

            socket.onclose = () => {
                console.log('[CALL] WebSocket disconnected');
            };

            socket.onerror = (error) => {
                console.error('[CALL] WebSocket error:', error);
            };

        } catch (err) {
            console.error('[CALL] Connection error:', err);
            alert('Failed to connect. Please try again.');
        }
    }

    // Chat functions
    function appendMessage(text, type) {
        if (chatEmpty) {
            chatEmpty.style.display = 'none';
        }

        const div = document.createElement('div');
        div.classList.add('message', type);
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateChatBadge() {
        if (unreadMessages > 0) {
            chatBadge.textContent = unreadMessages > 9 ? '9+' : unreadMessages;
            chatBadge.style.display = 'flex';
        } else {
            chatBadge.style.display = 'none';
        }
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

        socket.send(JSON.stringify({
            type: 'chat',
            data: text
        }));

        appendMessage(text, 'sent');
        messageInput.value = '';
    }

    // Button handlers
    backButton.addEventListener('click', () => {
        if (confirm('Leave the call?')) {
            cleanupCall();
            window.location.href = '/';
        }
    });

    cameraBtn.addEventListener('click', () => {
        isCameraOn = !isCameraOn;
        cameraBtn.dataset.active = isCameraOn;

        const iconOn = cameraBtn.querySelector('.icon-camera-on');
        const iconOff = cameraBtn.querySelector('.icon-camera-off');
        iconOn.style.display = isCameraOn ? 'block' : 'none';
        iconOff.style.display = isCameraOn ? 'none' : 'block';

        webrtc.toggleVideo(isCameraOn);
    });

    microphoneBtn.addEventListener('click', () => {
        isMicOn = !isMicOn;
        microphoneBtn.dataset.active = isMicOn;

        const iconOn = microphoneBtn.querySelector('.icon-mic-on');
        const iconOff = microphoneBtn.querySelector('.icon-mic-off');
        iconOn.style.display = isMicOn ? 'block' : 'none';
        iconOff.style.display = isMicOn ? 'none' : 'block';

        webrtc.toggleAudio(isMicOn);
    });

    flipCameraBtn.addEventListener('click', async () => {
        if (webrtc) {
            // Get available cameras
            const { cameras } = await webrtc.getDevices();
            if (cameras.length > 1) {
                // Switch to next camera
                const currentIndex = cameras.findIndex(c => c.deviceId === webrtc.currentCameraId);
                const nextIndex = (currentIndex + 1) % cameras.length;
                await webrtc.switchCamera(cameras[nextIndex].deviceId);
            }
        }
    });

    endCallButton.addEventListener('click', () => {
        if (confirm('End the call?')) {
            cleanupCall();
            window.location.href = '/';
        }
    });

    chatIconBtn.addEventListener('click', () => {
        chatPanel.classList.add('active');
        unreadMessages = 0;
        updateChatBadge();
    });

    chatBackBtn.addEventListener('click', () => {
        chatPanel.classList.remove('active');
    });

    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // PiP expand (swap videos)
    document.getElementById('pipExpandBtn').addEventListener('click', () => {
        // Swap remote and local videos
        const remoteParent = remoteVideo.parentElement;
        const localParent = localVideo.parentElement;

        if (localVideo.parentElement === localPip) {
            // Move local to main, remote to PiP
            remoteParent.appendChild(localVideo);
            localPip.appendChild(remoteVideo);
        } else {
            // Move remote to main, local to PiP
            localPip.appendChild(localVideo);
            remoteParent.appendChild(remoteVideo);
        }
    });

    function cleanupCall() {
        console.log('[CALL] Cleaning up call...');

        if (socket) socket.close();
        if (timerInterval) clearInterval(timerInterval);
        if (webrtc) webrtc.cleanup();
        releaseWakeLock();
    }
});
