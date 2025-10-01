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
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 5;
    let reconnectTimeout = null;
    let adaptiveQuality = null;

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'room') {
        alert('No room ID found. Please create a meeting first.');
        window.location.href = '/';
        return;
    }

    // Initialize waiting room UI
    let waitingRoomUI = null;
    let joinRequestUI = null;

    if (window.WaitingRoomUI) {
        waitingRoomUI = new window.WaitingRoomUI();
    }

    if (window.JoinRequestUI) {
        joinRequestUI = new window.JoinRequestUI(
            (guestId) => {
                // Approve join
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'approve-join',
                        data: JSON.stringify({ id: guestId })
                    }));
                }
            },
            (guestId) => {
                // Reject join
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'reject-join',
                        data: JSON.stringify({ id: guestId })
                    }));
                }
            }
        );
    }

    // Initialize
    connectToRoom(roomID);
    startCallTimer();
    requestWakeLock();

    // Initialize features from call-features.js
    if (window.initEmojiPicker) {
        window.initEmojiPicker();
    }
    if (window.initSettingsPanel) {
        window.initSettingsPanel();
    }

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
            const isHostSession = sessionStorage.getItem('isHost') === 'true';
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws?room=${roomId}&name=${encodeURIComponent(guestName)}&isHost=${isHostSession}`;
            socket = new WebSocket(wsUrl);

            console.log('[CALL] Connecting as:', isHostSession ? 'HOST' : 'GUEST', 'Name:', guestName);

            socket.onopen = async () => {
                console.log('[CALL] WebSocket connected');

                // Initialize WebRTC
                webrtc = new WebRTCManager(socket, roomId);
                const initialized = await webrtc.initialize();

                if (initialized) {
                    // Reset reconnect counter on successful connection
                    reconnectAttempts = 0;

                    // Initialize adaptive quality if available
                    if (window.AdaptiveQuality) {
                        adaptiveQuality = new window.AdaptiveQuality(webrtc);
                        window.adaptiveQuality = adaptiveQuality; // Make globally accessible
                    }

                    // Make webrtc globally accessible for settings panel
                    window.webrtc = webrtc;

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
                    case 'waiting':
                        console.log('[CALL] In waiting room');
                        if (waitingRoomUI) {
                            waitingRoomUI.show();
                        }
                        break;

                    case 'approved':
                        console.log('[CALL] Approved by host');
                        if (waitingRoomUI) {
                            waitingRoomUI.hide();
                        }
                        break;

                    case 'rejected':
                        console.log('[CALL] Rejected by host');
                        if (waitingRoomUI) {
                            waitingRoomUI.hide();
                        }
                        alert('The host rejected your join request');
                        window.location.href = '/';
                        break;

                    case 'join-request':
                        const requestData = JSON.parse(message.data);
                        console.log('[CALL] 🔔 Join request from:', requestData.name, 'Data:', requestData);
                        console.log('[CALL] joinRequestUI exists?', !!joinRequestUI);
                        if (joinRequestUI) {
                            console.log('[CALL] Showing join request UI...');
                            joinRequestUI.show(requestData);
                        } else {
                            console.error('[CALL] ❌ joinRequestUI is NULL!');
                            // Fallback: show browser alert
                            if (confirm(`${requestData.name} wants to join. Admit?`)) {
                                socket.send(JSON.stringify({
                                    type: 'approve-join',
                                    data: JSON.stringify({ id: requestData.id })
                                }));
                            } else {
                                socket.send(JSON.stringify({
                                    type: 'reject-join',
                                    data: JSON.stringify({ id: requestData.id })
                                }));
                            }
                        }
                        break;

                    case 'meeting-ended':
                        console.log('[CALL] Meeting ended by host');
                        alert('The host ended the meeting');
                        cleanupCall();
                        window.location.href = '/';
                        break;

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

                // Attempt to reconnect
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                    console.log(`[CALL] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

                    reconnectTimeout = setTimeout(() => {
                        connectToRoom(roomID);
                    }, delay);
                } else {
                    console.error('[CALL] Max reconnection attempts reached');
                    alert('Connection lost. Please refresh the page.');
                }
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

        // Check if message is a GIF
        if (text.startsWith('[GIF]')) {
            const gifUrl = text.substring(5); // Remove [GIF] prefix
            const img = document.createElement('img');
            img.src = gifUrl;
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            img.style.borderRadius = '8px';
            img.style.marginTop = '4px';
            img.alt = 'GIF';
            div.appendChild(img);
        } else {
            div.textContent = text;
        }

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

    // Expose sendMessage for GIF functionality
    window.sendChatMessage = function(text) {
        console.log('[CALL] sendChatMessage called with:', text);
        if (!text || !socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('[CALL] Cannot send message - socket not ready');
            return;
        }

        socket.send(JSON.stringify({
            type: 'chat',
            data: text
        }));

        appendMessage(text, 'sent');
        if (messageInput) {
            messageInput.value = '';
        }
    };

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
    const pipExpandBtn = document.getElementById('pipExpandBtn');
    if (pipExpandBtn) {
        pipExpandBtn.addEventListener('click', () => {
            // Swap remote and local videos
            const remoteContainer = document.querySelector('.call-container');

            if (localVideo.parentElement === localPip) {
                // Move local to main, remote to PiP
                remoteContainer.insertBefore(localVideo, localPip);
                localPip.appendChild(remoteVideo);
            } else {
                // Move remote to main, local to PiP
                remoteContainer.insertBefore(remoteVideo, localPip);
                localPip.appendChild(localVideo);
            }
        });
    }

    // Share screen button
    const shareScreenBtn = document.getElementById('shareScreenBtn');
    if (shareScreenBtn) {
        shareScreenBtn.addEventListener('click', async () => {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false
                });

                const screenTrack = screenStream.getVideoTracks()[0];

                // Replace video track
                const senders = webrtc.peerConnection.getSenders();
                const videoSender = senders.find(s => s.track && s.track.kind === 'video');

                if (videoSender) {
                    await videoSender.replaceTrack(screenTrack);

                    // When user stops sharing
                    screenTrack.onended = () => {
                        // Switch back to camera
                        const cameraTrack = webrtc.localStream.getVideoTracks()[0];
                        if (cameraTrack) {
                            videoSender.replaceTrack(cameraTrack);
                        }
                    };
                }
            } catch (err) {
                console.error('[CALL] Screen share failed:', err);
            }
        });
    }

    // Switch camera button (desktop)
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    if (switchCameraBtn) {
        switchCameraBtn.addEventListener('click', async () => {
            if (webrtc) {
                const { cameras } = await webrtc.getDevices();
                if (cameras.length > 1) {
                    const currentIndex = cameras.findIndex(c => c.deviceId === webrtc.currentCameraId);
                    const nextIndex = (currentIndex + 1) % cameras.length;
                    await webrtc.switchCamera(cameras[nextIndex].deviceId);
                }
            }
        });
    }

    // More options button - now handled by initSettingsPanel in call-features.js

    function cleanupCall() {
        console.log('[CALL] Cleaning up call...');

        if (socket) socket.close();
        if (timerInterval) clearInterval(timerInterval);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (adaptiveQuality) adaptiveQuality.stop();
        if (webrtc) webrtc.cleanup();
        releaseWakeLock();
    }
});
