document.addEventListener('DOMContentLoaded', () => {
    console.log('[APP] Call page loaded');

    // UI Elements
    const callContainer = document.getElementById('callContainer');
    const chatPanel = document.getElementById('chatPanel');
    const chatBtn = document.getElementById('chatBtn');
    const backToCall = document.getElementById('backToCall');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatBubble = document.getElementById('chatBubble');
    const endCall = document.getElementById('endCall');
    const micBtn = document.getElementById('micBtn');
    const videoBtn = document.getElementById('videoBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const pipBtn = document.getElementById('pipBtn');

    // Settings panel elements
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const closeSettings = document.getElementById('closeSettings');
    const applySettings = document.getElementById('applySettings');
    const cancelSettings = document.getElementById('cancelSettings');
    const videoQualitySelect = document.getElementById('videoQuality');
    const frameRateSelect = document.getElementById('frameRate');
    const audioQualitySelect = document.getElementById('audioQuality');
    const cameraSelect = document.getElementById('cameraSelect');
    const microphoneSelect = document.getElementById('microphoneSelect');

    // State
    let socket = null;
    let webrtc = null;
    let isMicOn = true;
    let isVideoOn = true;
    let callStartTime = null;
    let timerInterval = null;
    let wakeLock = null;
    let isInitiator = false;
    let peerConnected = false;

    // Get room ID from URL path
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

    // Prevent accidental page refresh/close
    window.addEventListener('beforeunload', (e) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            e.preventDefault();
            return '';
        }
    });

    // Wake Lock functions
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('[APP] Wake Lock acquired');

                wakeLock.addEventListener('release', () => {
                    console.log('[APP] Wake Lock released');
                });
            }
        } catch (err) {
            console.warn('[APP] Wake Lock not supported:', err);
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
            document.querySelector('.timer-value').textContent =
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Connect to room and initialize WebRTC
    async function connectToRoom(roomId) {
        try {
            // Get guest name from sessionStorage
            const guestName = sessionStorage.getItem('guestName') || 'Guest';

            const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws?room=${roomId}&name=${encodeURIComponent(guestName)}`;
            socket = new WebSocket(wsUrl);

            socket.onopen = async () => {
                console.log('[APP] ✅ WebSocket connected to room:', roomId);

                // Initialize WebRTC
                webrtc = new WebRTCManager(socket, roomId);
                const initialized = await webrtc.initialize();

                if (initialized) {
                    // Load available devices
                    await loadDevices();

                    // Send join message
                    socket.send(JSON.stringify({
                        type: 'join',
                        room: roomId
                    }));

                    // Set initiator flag (first person creates offer)
                    setTimeout(() => {
                        if (!peerConnected) {
                            isInitiator = true;
                            console.log('[APP] I am the initiator');
                        }
                    }, 1000);
                }
            };

            socket.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                console.log('[APP] Message received:', message.type);

                switch (message.type) {
                    case 'join':
                        console.log('[APP] Partner joined');
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
                        document.querySelector('.chat-text').textContent = message.data;
                        break;

                    case 'leave':
                        console.log('[APP] Partner left');
                        webrtc.updateStatus('Partner disconnected', 'error');
                        document.getElementById('remotePlaceholder').classList.remove('hidden');
                        break;
                }
            };

            socket.onclose = () => {
                console.log('[APP] WebSocket disconnected');
                webrtc.updateStatus('Disconnected', 'error');
            };

            socket.onerror = (error) => {
                console.error('[APP] WebSocket error:', error);
            };

        } catch (err) {
            console.error('[APP] Connection error:', err);
            alert('Failed to connect. Please try again.');
        }
    }

    // Load available devices
    async function loadDevices() {
        const { cameras, microphones } = await webrtc.getDevices();

        // Populate camera select
        cameraSelect.innerHTML = '';
        cameras.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            if (index === 0) option.selected = true;
            cameraSelect.appendChild(option);
        });

        // Populate microphone select
        microphoneSelect.innerHTML = '';
        microphones.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${index + 1}`;
            if (index === 0) option.selected = true;
            microphoneSelect.appendChild(option);
        });
    }

    // Settings panel
    settingsBtn.addEventListener('click', () => {
        settingsPanel.classList.add('active');
        settingsBackdrop.classList.add('active');
    });

    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
        settingsBackdrop.classList.remove('active');
    });

    cancelSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
        settingsBackdrop.classList.remove('active');
    });

    settingsBackdrop.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
        settingsBackdrop.classList.remove('active');
    });

    applySettings.addEventListener('click', async () => {
        const videoQuality = videoQualitySelect.value;
        const frameRate = parseInt(frameRateSelect.value);
        const audioQuality = audioQualitySelect.value;
        const cameraId = cameraSelect.value;
        const microphoneId = microphoneSelect.value;

        console.log('[APP] Applying settings:', { videoQuality, frameRate, audioQuality });

        // Change quality
        const success = await webrtc.changeQuality(videoQuality, frameRate, audioQuality);

        if (success) {
            // Switch devices if changed
            if (cameraId) {
                await webrtc.switchCamera(cameraId);
            }
            if (microphoneId) {
                await webrtc.switchMicrophone(microphoneId);
            }

            // Close settings
            settingsPanel.classList.remove('active');
            settingsBackdrop.classList.remove('active');

            alert('Settings applied successfully!');
        } else {
            alert('Failed to apply settings. Please try again.');
        }
    });

    // Chat functions
    function appendMessage(text, type) {
        const div = document.createElement('div');
        div.classList.add('message', type);
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatBtn.addEventListener('click', () => {
        chatPanel.style.display = 'flex';
    });

    backToCall.addEventListener('click', () => {
        chatPanel.style.display = 'none';
    });

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

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

    chatBubble.addEventListener('click', () => {
        chatPanel.style.display = 'flex';
    });

    // Toggle mic
    micBtn.addEventListener('click', () => {
        isMicOn = !isMicOn;
        micBtn.querySelector('span').textContent = isMicOn ? '🎤' : '🔇';
        webrtc.toggleAudio(isMicOn);
    });

    // Toggle video
    videoBtn.addEventListener('click', () => {
        isVideoOn = !isVideoOn;
        videoBtn.querySelector('span').textContent = isVideoOn ? '📹' : '📷';
        webrtc.toggleVideo(isVideoOn);
    });

    // End call
    endCall.addEventListener('click', () => {
        if (confirm('End the call?')) {
            cleanupCall();
            window.location.href = '/';
        }
    });

    function cleanupCall() {
        console.log('[APP] Cleaning up call...');

        if (socket) socket.close();
        if (timerInterval) clearInterval(timerInterval);
        if (webrtc) webrtc.cleanup();

        releaseWakeLock();

        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(e => console.log(e));
        }
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
    }

    // Fullscreen
    fullscreenBtn.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement) {
                await callContainer.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('[APP] Fullscreen error:', err);
        }
    });

    // Picture-in-Picture
    pipBtn.addEventListener('click', async () => {
        try {
            const remoteVideo = document.getElementById('remoteVideo');

            if (!remoteVideo.srcObject) {
                alert('Picture-in-Picture requires active video connection.');
                return;
            }

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await remoteVideo.requestPictureInPicture();
                console.log('[APP] ✅ Entered PiP mode');
            }
        } catch (err) {
            console.error('[APP] PiP error:', err);
            alert('Picture-in-Picture not supported on this device');
        }
    });

    // Check PiP support
    if (!document.pictureInPictureEnabled) {
        pipBtn.disabled = true;
        pipBtn.style.opacity = '0.3';
    }
});
