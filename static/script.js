document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = '/login';
        return;
    }

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

    let socket = null;
    let localStream = null;
    let isMicOn = true;
    let isVideoOn = true;
    let callStartTime = null;
    let timerInterval = null;
    let wakeLock = null;
    let videoElement = null; // For PiP functionality

    // Get room ID from URL path (format: /room/uuid)
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'room') {
        alert('No room ID found. Please create a meeting first.');
        window.location.href = '/';
    } else {
        connectToRoom(roomID);
        startCallTimer();
    }

    // Prevent accidental page refresh/close
    window.addEventListener('beforeunload', (e) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Request wake lock to prevent screen from sleeping
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock acquired');

                wakeLock.addEventListener('release', () => {
                    console.log('Wake Lock released');
                });
            }
        } catch (err) {
            console.warn('Wake Lock not supported or failed:', err);
        }
    }

    // Release wake lock
    function releaseWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release()
                .then(() => {
                    wakeLock = null;
                });
        }
    }

    // Re-request wake lock when page becomes visible
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });

    // Request wake lock when call starts
    requestWakeLock();

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

    async function connectToRoom(roomId) {
        try {
            // Request high-quality media with optimized settings
            const constraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2
                },
                video: {
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 60 },
                    facingMode: 'user'
                }
            };

            localStream = await navigator.mediaDevices.getUserMedia(constraints);
            // In real app: attach to <video> element with proper codecs
            console.log('Media stream acquired with high quality settings');
        } catch (err) {
            console.warn('Camera/mic not available:', err);
            // UI stays in placeholder mode
        }

        const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws?room=${roomId}`;
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('Connected to room:', roomId);
            document.querySelector('.status').textContent = 'Connected';
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'chat') {
                appendMessage(data.data, 'received');
                // Update chat bubble
                document.querySelector('.chat-text').textContent = data.data;
            }
        };

        socket.onclose = () => {
            document.querySelector('.status').textContent = 'Disconnected';
        };
    }

    function appendMessage(text, type) {
        const div = document.createElement('div');
        div.classList.add('message', type);
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Toggle chat panel
    chatBtn.addEventListener('click', () => {
        chatPanel.style.display = 'flex';
    });

    backToCall.addEventListener('click', () => {
        chatPanel.style.display = 'none';
    });

    // Send message
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

        const msg = { type: 'chat', data: text };
        socket.send(JSON.stringify(msg));
        appendMessage(text, 'sent');
        messageInput.value = '';
    }

    // Toggle mic
    micBtn.addEventListener('click', () => {
        isMicOn = !isMicOn;
        micBtn.querySelector('span').textContent = isMicOn ? '🎤' : '🔇';

        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMicOn;
            }
        }
    });

    // Toggle video
    videoBtn.addEventListener('click', () => {
        isVideoOn = !isVideoOn;
        videoBtn.querySelector('span').textContent = isVideoOn ? '📹' : '📷';

        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoOn;
            }
        }
    });

    // End call
    endCall.addEventListener('click', () => {
        if (confirm('End the call?')) {
            cleanupCall();
            window.location.href = '/';
        }
    });

    function cleanupCall() {
        if (socket) socket.close();
        if (timerInterval) clearInterval(timerInterval);
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        releaseWakeLock();
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(e => console.log(e));
        }
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
    }

    // Settings
    settingsBtn.addEventListener('click', () => {
        alert('Settings menu (not implemented)');
    });

    // Chat bubble click
    chatBubble.addEventListener('click', () => {
        chatPanel.style.display = 'flex';
    });

    // Fullscreen functionality
    fullscreenBtn.addEventListener('click', async () => {
        try {
            if (!document.fullscreenElement) {
                await callContainer.requestFullscreen();
                fullscreenBtn.querySelector('span').textContent = '⛶';
            } else {
                await document.exitFullscreen();
                fullscreenBtn.querySelector('span').textContent = '⛶';
            }
        } catch (err) {
            console.error('Fullscreen error:', err);
            alert('Fullscreen not supported on this device');
        }
    });

    // Handle fullscreen change
    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.querySelector('span').textContent = '⛶';
        } else {
            fullscreenBtn.querySelector('span').textContent = '⛶';
        }
    });

    // Picture-in-Picture functionality
    pipBtn.addEventListener('click', async () => {
        try {
            // Create a video element if not exists (for future WebRTC implementation)
            if (!videoElement) {
                // For now, show message that video is needed
                alert('Picture-in-Picture requires active video stream. This will work when video streaming is fully implemented.');
                return;
            }

            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await videoElement.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP error:', err);
            alert('Picture-in-Picture not supported on this device');
        }
    });

    // Handle PiP change
    if ('pictureInPictureEnabled' in document) {
        pipBtn.disabled = false;

        videoElement?.addEventListener('enterpictureinpicture', () => {
            console.log('Entered PiP mode');
        });

        videoElement?.addEventListener('leavepictureinpicture', () => {
            console.log('Left PiP mode');
        });
    } else {
        pipBtn.disabled = true;
        pipBtn.style.opacity = '0.3';
    }

});