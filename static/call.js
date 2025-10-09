document.addEventListener('DOMContentLoaded', async () => {
    console.log('[CALL] Page loaded');

    // UI Elements
    const callContainer = document.getElementById('callContainer');
    const remoteVideo = document.getElementById('remoteVideo');
    const localVideo = document.getElementById('localVideo');
    const remotePlaceholder = document.getElementById('remotePlaceholder');
    const localPip = document.getElementById('localPip');

    // Buttons - with validation
    const backButton = document.getElementById('backButton');
    const cameraBtn = document.getElementById('cameraBtn');
    const microphoneBtn = document.getElementById('microphoneBtn');
    const flipCameraBtn = document.getElementById('flipCameraBtn');
    const endCallButton = document.getElementById('endCallButton');
    const chatIconBtn = document.getElementById('chatIconBtn');
    const chatBadge = document.getElementById('chatBadge');

    // Validate required elements
    if (!backButton || !endCallButton) {
        console.error('[CALL] Critical UI elements missing');
    }

    // Chat
    const chatPanel = document.getElementById('chatPanel');
    const chatBackBtn = document.getElementById('chatBackBtn');
    const chatMessages = document.getElementById('chatMessages');
    const chatEmpty = document.getElementById('chatEmpty');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const recipientSelect = document.getElementById('recipientSelect');

    // Timer
    const timerText = document.getElementById('timerText');

    // User name elements
    const userNameDisplay = document.getElementById('userName');
    const userLabel = document.getElementById('userLabel');

    const mediaHealthBadge = createMediaHealthBadge();
    updateMediaHealthBadge('warning', 'Checking devices…');

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
    let maxReconnectAttempts = 10;
    let reconnectTimeout = null;
    let adaptiveQuality = null;
    let heartbeatInterval = null;
    let localParticipantId = null;
    const participantDirectory = new Map();

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'room') {
        alert('No room ID found. Please create a meeting first.');
        window.location.href = '/';
        return;
    }

    // Get user info from sessionStorage
    let guestName = sessionStorage.getItem('guestName');
    const isHostSession = sessionStorage.getItem('isHost') === 'true';

    // If host, try to get name from hostName_roomID storage first
    if (isHostSession) {
        const hostName = sessionStorage.getItem('hostName_' + roomID);
        if (hostName) {
            guestName = hostName;
            sessionStorage.setItem('guestName', hostName);
            console.log('[CALL] ✅ Host name from storage:', hostName);
        }
    }

    // If still no guestName, try to get from API
    if (!guestName) {
        try {
            const response = await fetch(`/api/meeting/${roomID}`);
            const meeting = await response.json();
            if (meeting.host_name) {
                guestName = meeting.host_name;
                sessionStorage.setItem('guestName', guestName);
                console.log('[CALL] ✅ Got name from API:', guestName);
            }
        } catch (e) {
            console.error('[CALL] Failed to get name from API:', e);
        }
    }

    // Fallback to default if still no name
    if (!guestName) {
        guestName = isHostSession ? 'Host' : 'Guest';
        console.warn('[CALL] ⚠️ Using fallback name:', guestName);
    }

    // Set user name in UI
    if (userNameDisplay) {
        userNameDisplay.textContent = guestName;
    }
    if (userLabel) {
        userLabel.textContent = isHostSession ? 'Host' : 'Guest';
    }

    participantDirectory.set('self', guestName);

    // Initialize Modern AI Notetaker
    let aiNotetaker = null;
    if (typeof AINotetaker !== 'undefined') {
        aiNotetaker = new AINotetaker(roomID, guestName, isHostSession);
        console.log('[CALL] 🤖 Modern AI Notetaker initialized');
    }

    // Legacy notetaker for compatibility
    if (typeof AINotetaker !== 'undefined' && window.AINotetaker !== AINotetaker) {
        notetaker = new window.AINotetaker(roomID, isHostSession);
        console.log('[CALL] 🤖 Legacy AI Notetaker initialized');
    }

    emitNotetakerParticipants();

    window.addEventListener('notetaker-sync-request', (event) => {
        if (!event.detail || event.detail.roomID !== roomID) return;
        emitNotetakerParticipants();
    });

    function emitNotetakerParticipants() {
        if (!notetaker) return;
        const roster = [];
        participantDirectory.forEach((name, id) => {
            roster.push({ id, name, isLocal: id === localParticipantId });
        });
        window.dispatchEvent(new CustomEvent('notetaker-participants', {
            detail: { roomID, participants: roster, mode: 'direct' }
        }));
    }

    function emitNotetakerMessage(payload) {
        if (!notetaker) return;
        window.dispatchEvent(new CustomEvent('notetaker-message', {
            detail: {
                roomID,
                ...payload,
                timestamp: payload.timestamp || Date.now()
            }
        }));
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
        // Cleanup AI Notetaker
        if (aiNotetaker) {
            aiNotetaker.destroy();
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            e.preventDefault();
            return '';
        }
    });

    window.addEventListener('media-health', (event) => {
        const detail = event.detail;
        if (!detail || detail.context !== 'direct') return;
        updateMediaHealthBadge(detail.status || 'ok', detail.message || 'Devices ready');
    });

    window.addEventListener('offline', () => {
        updateMediaHealthBadge('offline', 'No internet connection');
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            socket.close(4000, 'offline');
        }
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }
        reconnectAttempts = 0;
    });

    window.addEventListener('online', () => {
        updateMediaHealthBadge('warning', 'Reconnecting…');
        reconnectAttempts = 0;

        if (!socket || socket.readyState >= WebSocket.CLOSING) {
            connectToRoom(roomID);
        }

        if (window.MediaHealth && webrtc && webrtc.localStream) {
            window.MediaHealth.analyzeStream(webrtc.localStream, 'direct', {
                expectsAudio: webrtc.expectedAudio,
                expectsVideo: webrtc.expectedVideo
            });
        }

        if (webrtc && typeof webrtc.ensureLocalTracksActive === 'function') {
            webrtc.ensureLocalTracksActive().catch(err => {
                console.warn('[CALL] ⚠️ Failed to ensure local tracks after reconnect:', err);
            });
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
                console.log('[CALL] ✅ WebSocket connected');

                // Reset reconnect counter
                reconnectAttempts = 0;

                // Start heartbeat to keep connection alive
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                heartbeatInterval = setInterval(() => {
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 30000); // Ping every 30 seconds

                // Initialize WebRTC for EVERYONE immediately
                console.log('[CALL] Initializing WebRTC...');
                webrtc = new WebRTCManager(socket, roomId);
                const initialized = await webrtc.initialize();

                if (initialized) {
                    console.log('[CALL] ✅ WebRTC initialized successfully');

                    // Update media health badge
                    updateMediaHealthBadge('ok', 'Camera & microphone ready');

                    // Initialize adaptive quality
                    if (window.AdaptiveQuality) {
                        adaptiveQuality = new window.AdaptiveQuality(webrtc);
                        window.adaptiveQuality = adaptiveQuality;
                    }

                    window.webrtc = webrtc;

                    // Send join message
                    socket.send(JSON.stringify({
                        type: 'join',
                        room: roomId
                    }));

                    // Set initiator flag
                    setTimeout(() => {
                        if (!peerConnected && isHostSession) {
                            isInitiator = true;
                            console.log('[CALL] I am the initiator (host)');
                        }
                    }, 500);
                } else {
                    console.error('[CALL] ❌ Failed to initialize WebRTC');
                    updateMediaHealthBadge('error', 'Failed to access camera');
                }
            };

            socket.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                console.log('[CALL] Message received:', message.type, 'Full message:', message);

                switch (message.type) {
                    case 'joined':
                        console.log('[CALL] ✅ Joined room successfully');
                        try {
                            const joinInfo = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                            if (joinInfo && joinInfo.id) {
                                localParticipantId = joinInfo.id;
                                participantDirectory.set(localParticipantId, joinInfo.name || guestName);
                                participantDirectory.delete('self');
                                emitNotetakerParticipants();
                            }
                        } catch (err) {
                            console.warn('[CALL] ⚠️ Failed to parse join payload', err);
                        }
                        break;

                    case 'join':
                        console.log('[CALL] 🎯 Partner joined! isInitiator:', isInitiator, 'isHostSession:', isHostSession);

                        try {
                            const joinInfo = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                            if (joinInfo && joinInfo.id) {
                                participantDirectory.set(joinInfo.id, joinInfo.name || 'Partner');
                                emitNotetakerParticipants();
                            }
                        } catch (err) {
                            console.warn('[CALL] ⚠️ Failed to parse partner join payload', err);
                        }

                        // Host should always create offer when guest joins
                        if (isHostSession && webrtc) {
                            console.log('[CALL] 🎯 HOST creating offer for guest...');
                            await webrtc.createOffer();
                            peerConnected = true;
                        } else if (isInitiator && webrtc) {
                            console.log('[CALL] 🔄 Initiator creating offer...');
                            await webrtc.createOffer();
                            peerConnected = true;
                        } else {
                            console.log('[CALL] 👤 Waiting for offer from host...');
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
                        const appended = appendMessage(message.data, 'received');
                        if (!chatPanel.classList.contains('active')) {
                            unreadMessages++;
                            updateChatBadge();

                            const senderName = appended?.fromName || 'Partner';
                            const text = appended?.text || '';
                            const isGif = text.startsWith('[GIF]');
                            const displayText = isGif ? text.substring(5) : text;
                            showFlyingMessage(senderName, displayText, isGif);
                        }
                        break;

                    case 'leave':
                        console.log('[CALL] Partner left');
                        remotePlaceholder.style.display = 'flex';
                        if (message.user) {
                            participantDirectory.delete(message.user);
                            emitNotetakerParticipants();
                        }
                        break;
                }
            };

            socket.onclose = (event) => {
                console.log('[CALL] 🔌 WebSocket disconnected', event.code, event.reason);

                if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                    heartbeatInterval = null;
                }

                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = null;
                }

                // Update status
                updateMediaHealthBadge('warning', 'Connection lost - reconnecting...');

                // Check if offline
                if (!navigator.onLine) {
                    console.warn('[CALL] 📡 Offline detected. Waiting for network...');
                    updateMediaHealthBadge('error', 'No internet connection');

                    // Listen for online event
                    const onlineHandler = () => {
                        console.log('[CALL] 📡 Network restored! Reconnecting...');
                        window.removeEventListener('online', onlineHandler);
                        reconnectAttempts = 0;
                        connectToRoom(roomID);
                    };
                    window.addEventListener('online', onlineHandler);

                    socket = null;
                    return;
                }

                // Clean disconnect - attempt immediate reconnect
                const isCleanDisconnect = event.code === 1000 || event.code === 1001;

                // Attempt to reconnect with smart backoff
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;

                    // Faster reconnect for clean disconnects, exponential for errors
                    const delay = isCleanDisconnect
                        ? 500  // Immediate retry for clean disconnects
                        : Math.min(1000 * Math.pow(1.5, reconnectAttempts - 1), 10000);

                    console.log(`[CALL] 🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

                    // Show user-friendly message
                    if (remotePlaceholder) {
                        const reconnectMsg = remotePlaceholder.querySelector('.placeholder-text');
                        if (reconnectMsg) {
                            const countdown = Math.ceil(delay/1000);
                            reconnectMsg.textContent = countdown > 1
                                ? `Reconnecting in ${countdown}s...`
                                : 'Reconnecting...';
                        }
                    }

                    reconnectTimeout = setTimeout(() => {
                        console.log('[CALL] 🔄 Attempting reconnection...');
                        connectToRoom(roomID);
                    }, delay);
                } else {
                    console.error('[CALL] ⚠️ Max reconnection attempts reached - resetting...');
                    updateMediaHealthBadge('error', 'Connection lost');

                    // Auto-reset and retry after 5s
                    setTimeout(() => {
                        console.log('[CALL] 🔄 Auto-retry after cooldown...');
                        reconnectAttempts = 0;
                        connectToRoom(roomID);
                    }, 5000);
                }

                socket = null;
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
    // Mini-browser modal for URLs
    function openMiniBrowser(url) {
        // Validate URL
        let validUrl = url;
        try {
            // Ensure URL has protocol
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                validUrl = 'https://' + url;
            }
            new URL(validUrl); // Validate URL format
        } catch (e) {
            alert('Invalid URL: ' + url);
            return;
        }

        // Detect if in-app browser (Telegram, Instagram, etc.)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isInAppBrowser = /FBAN|FBAV|Instagram|Line|WhatsApp|Telegram/i.test(navigator.userAgent);

        // Force external browser on mobile or in-app browsers
        if (isMobile || isInAppBrowser) {
            // Try to open in external browser
            const a = document.createElement('a');
            a.href = validUrl;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';

            // For iOS - try to force Safari
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                // Show confirmation with option to copy
                if (confirm(`Open link in browser?\n\n${validUrl}\n\nClick OK to open, or Cancel to copy the link.`)) {
                    window.open(validUrl, '_blank', 'noopener,noreferrer');
                } else {
                    // Copy to clipboard
                    navigator.clipboard.writeText(validUrl).then(() => {
                        alert('Link copied to clipboard!');
                    }).catch(() => {
                        prompt('Copy this link:', validUrl);
                    });
                }
                return;
            }

            // For Android - open directly
            window.open(validUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        // Create modal overlay
        const modal = document.createElement('div');
        modal.className = 'mini-browser-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.2s ease;
        `;

        // Header with controls
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        `;

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        `;
        closeBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 68, 68, 0.2);
            border: 1px solid rgba(255, 68, 68, 0.4);
            color: #ff4444;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        `;
        closeBtn.onmouseover = () => {
            closeBtn.style.background = 'rgba(255, 68, 68, 0.3)';
            closeBtn.style.transform = 'scale(1.05)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.background = 'rgba(255, 68, 68, 0.2)';
            closeBtn.style.transform = 'scale(1)';
        };
        closeBtn.onclick = () => {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => document.body.removeChild(modal), 200);
        };

        // URL display with copy button
        const urlContainer = document.createElement('div');
        urlContainer.style.cssText = `
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.3);
            padding: 8px 16px;
            border-radius: 20px;
            min-width: 0;
        `;

        const urlDisplay = document.createElement('div');
        urlDisplay.textContent = validUrl;
        urlDisplay.style.cssText = `
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
            font-family: monospace;
        `;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = '📋';
        copyBtn.title = 'Copy URL';
        copyBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 16px;
            padding: 4px;
            opacity: 0.7;
            transition: opacity 0.2s;
        `;
        copyBtn.onmouseover = () => copyBtn.style.opacity = '1';
        copyBtn.onmouseout = () => copyBtn.style.opacity = '0.7';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(validUrl).then(() => {
                copyBtn.textContent = '✅';
                setTimeout(() => copyBtn.textContent = '📋', 1500);
            });
        };

        urlContainer.appendChild(urlDisplay);
        urlContainer.appendChild(copyBtn);

        // Open in new tab button
        const openBtn = document.createElement('button');
        openBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
        `;
        openBtn.title = 'Open in new tab';
        openBtn.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.2);
            border: 1px solid rgba(59, 130, 246, 0.4);
            color: #3b82f6;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
        `;
        openBtn.onmouseover = () => {
            openBtn.style.background = 'rgba(59, 130, 246, 0.3)';
            openBtn.style.transform = 'scale(1.05)';
        };
        openBtn.onmouseout = () => {
            openBtn.style.background = 'rgba(59, 130, 246, 0.2)';
            openBtn.style.transform = 'scale(1)';
        };
        openBtn.onclick = () => window.open(validUrl, '_blank');

        header.appendChild(closeBtn);
        header.appendChild(urlContainer);
        header.appendChild(openBtn);

        // Content area with iframe and fallback
        const contentArea = document.createElement('div');
        contentArea.style.cssText = `
            flex: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            background: #1a1a1a;
        `;

        // Loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            z-index: 1;
        `;
        loadingDiv.innerHTML = `
            <div style="
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            "></div>
            <div>Loading page...</div>
        `;

        // iframe
        const iframe = document.createElement('iframe');
        iframe.src = validUrl;
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        `;

        // Error/fallback message
        const fallbackDiv = document.createElement('div');
        fallbackDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            color: white;
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
            gap: 20px;
        `;
        fallbackDiv.innerHTML = `
            <div style="font-size: 48px;">🔒</div>
            <div style="font-size: 20px; font-weight: 600;">Cannot display this page</div>
            <div style="font-size: 14px; color: rgba(255, 255, 255, 0.6); max-width: 400px;">
                This website doesn't allow embedding in frames for security reasons.
            </div>
            <button id="openExternalBtn" style="
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s;
            ">Open in New Tab</button>
        `;

        contentArea.appendChild(loadingDiv);
        contentArea.appendChild(iframe);
        contentArea.appendChild(fallbackDiv);

        modal.appendChild(header);
        modal.appendChild(contentArea);

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // iframe load handlers
        iframe.onload = () => {
            loadingDiv.style.display = 'none';
            // Try to detect if iframe loaded successfully
            try {
                // If we can access contentWindow, it loaded
                if (iframe.contentWindow) {
                    console.log('[MINI-BROWSER] Page loaded successfully');
                }
            } catch (e) {
                // Cross-origin - but that's okay, iframe still loaded
                console.log('[MINI-BROWSER] Page loaded (cross-origin)');
            }
        };

        iframe.onerror = () => {
            console.error('[MINI-BROWSER] Failed to load page');
            loadingDiv.style.display = 'none';
            fallbackDiv.style.display = 'flex';
        };

        // Detect X-Frame-Options blocking (timeout fallback)
        const blockDetectTimeout = setTimeout(() => {
            // If still loading after 8 seconds, assume blocked
            if (loadingDiv.style.display !== 'none') {
                console.warn('[MINI-BROWSER] Page may be blocked by X-Frame-Options');
                loadingDiv.style.display = 'none';
                fallbackDiv.style.display = 'flex';
            }
        }, 8000);

        // Clear timeout if loaded successfully
        iframe.addEventListener('load', () => clearTimeout(blockDetectTimeout), { once: true });

        // Fallback open button
        setTimeout(() => {
            const openExternalBtn = document.getElementById('openExternalBtn');
            if (openExternalBtn) {
                openExternalBtn.onclick = () => window.open(validUrl, '_blank');
                openExternalBtn.onmouseover = () => openExternalBtn.style.transform = 'scale(1.05)';
                openExternalBtn.onmouseout = () => openExternalBtn.style.transform = 'scale(1)';
            }
        }, 100);

        document.body.appendChild(modal);

        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modal.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    document.body.removeChild(modal);
                    document.removeEventListener('keydown', handleEsc);
                }, 200);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }

    // Detect URLs in text
    function detectAndLinkifyURLs(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex);

        if (urls && urls.length > 0) {
            return text.replace(urlRegex, (url) => {
                return `<a href="#" onclick="event.preventDefault(); openMiniBrowserFromChat('${url}');" style="color: #4a9eff; text-decoration: underline;">${url}</a>`;
            });
        }
        return text;
    }

    // Make openMiniBrowser globally accessible
    window.openMiniBrowserFromChat = openMiniBrowser;

    function normalizeChatPayload(raw, direction = 'received') {
        let payload = raw;
        if (typeof raw === 'string') {
            try {
                payload = JSON.parse(raw);
            } catch (err) {
                payload = { text: raw };
            }
        }

        if (!payload || typeof payload !== 'object') {
            return {
                text: typeof raw === 'string' ? raw : '',
                fromId: direction === 'sent' ? localParticipantId || 'self' : 'remote',
                fromName: direction === 'sent' ? guestName : 'Partner',
                isPrivate: false,
                raw,
            };
        }

        const text = payload.text || '';
        const fromId = payload.from || (direction === 'sent' ? localParticipantId || 'self' : payload.user || 'remote');
        let fromName = payload.fromName || payload.userName || null;
        if (!fromName && fromId && participantDirectory.has(fromId)) {
            fromName = participantDirectory.get(fromId);
        }
        if (!fromName) {
            fromName = direction === 'sent' ? guestName : 'Partner';
        }

        return {
            text,
            fromId,
            fromName,
            to: payload.to,
            isPrivate: payload.to && payload.to !== 'everyone',
            raw: payload,
        };
    }

    function appendMessage(rawPayload, type) {
        const payload = normalizeChatPayload(rawPayload, type);
        const { text, fromName, fromId, isPrivate } = payload;

        if (!text) {
            console.warn('[CALL] ⚠️ Skipping empty chat payload', payload);
            return null;
        }

        if (chatEmpty) {
            chatEmpty.style.display = 'none';
        }

        const wrapper = document.createElement('div');
        wrapper.classList.add('message', type);
        wrapper.dataset.fromId = fromId || '';
        wrapper.dataset.fromName = fromName;

        const header = document.createElement('div');
        header.className = 'message-header';
        const senderSpan = document.createElement('span');
        senderSpan.className = 'message-sender';
        senderSpan.textContent = fromName;
        header.appendChild(senderSpan);

        if (isPrivate) {
            const badge = document.createElement('span');
            badge.className = 'message-private-badge';
            badge.textContent = 'Private';
            header.appendChild(badge);
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        header.appendChild(timeSpan);
        wrapper.appendChild(header);

        const content = document.createElement('div');
        content.className = 'message-bubble';

        if (text.startsWith('[GIF]')) {
            const gifUrl = text.substring(5);
            const img = document.createElement('img');
            img.src = gifUrl;
            img.alt = 'GIF';
            img.loading = 'lazy';
            img.style.maxWidth = '220px';
            img.style.borderRadius = '12px';
            content.appendChild(img);
        } else {
            const processed = detectAndLinkifyURLs(text);
            const textDiv = document.createElement('div');
            textDiv.className = 'message-content';
            if (processed !== text) {
                textDiv.innerHTML = processed;
            } else {
                textDiv.textContent = text;
            }
            content.appendChild(textDiv);
        }

        wrapper.appendChild(content);
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        emitNotetakerMessage({
            fromId: fromId || (type === 'sent' ? localParticipantId || 'self' : 'remote'),
            fromName,
            text,
            direction: type,
            kind: 'chat',
        });

        return { fromId, fromName, text };
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

        const payload = {
            text,
            from: localParticipantId || 'self',
            fromName: guestName,
            to: recipientSelect && recipientSelect.value !== 'everyone' ? recipientSelect.value : undefined,
        };

        socket.send(JSON.stringify({
            type: 'chat',
            data: payload
        }));

        appendMessage(payload, 'sent');
        messageInput.value = '';
    }

    // Expose sendMessage for GIF functionality
    window.sendChatMessage = function(text) {
        console.log('[CALL] sendChatMessage called with:', text);
        if (!text || !socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('[CALL] Cannot send message - socket not ready');
            return;
        }

        const payload = {
            text,
            from: localParticipantId || 'self',
            fromName: guestName,
        };

        socket.send(JSON.stringify({
            type: 'chat',
            data: payload
        }));

        appendMessage(payload, 'sent');
        if (messageInput) {
            messageInput.value = '';
        }
    };

    // Button handlers with null checks
    if (backButton) {
        backButton.addEventListener('click', () => {
            if (confirm('Leave the call?')) {
                cleanupCall();
                window.location.href = '/';
            }
        });
    }

    if (cameraBtn) {
        cameraBtn.addEventListener('click', () => {
            isCameraOn = !isCameraOn;
            cameraBtn.dataset.active = isCameraOn;

            const iconOn = cameraBtn.querySelector('.icon-camera-on');
            const iconOff = cameraBtn.querySelector('.icon-camera-off');
            if (iconOn) iconOn.style.display = isCameraOn ? 'block' : 'none';
            if (iconOff) iconOff.style.display = isCameraOn ? 'none' : 'block';

            if (webrtc) webrtc.toggleVideo(isCameraOn);
        });
    }

    if (microphoneBtn) {
        microphoneBtn.addEventListener('click', () => {
            isMicOn = !isMicOn;
            microphoneBtn.dataset.active = isMicOn;

            const iconOn = microphoneBtn.querySelector('.icon-mic-on');
            const iconOff = microphoneBtn.querySelector('.icon-mic-off');
            if (iconOn) iconOn.style.display = isMicOn ? 'block' : 'none';
            if (iconOff) iconOff.style.display = isMicOn ? 'none' : 'block';

            if (webrtc) {
                webrtc.toggleAudio(isMicOn);
                console.log('[CALL] 🎤 Microphone toggled:', isMicOn ? 'ON' : 'OFF');
            }
        });
    }

    if (flipCameraBtn) {
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
    }

    // Picture-in-Picture
    const pipBtn = document.getElementById('pipBtn');
    if (pipBtn) {
        pipBtn.addEventListener('click', async () => {
            if (remoteVideo && remoteVideo.srcObject && document.pictureInPictureEnabled) {
                try {
                    if (document.pictureInPictureElement) {
                        await document.exitPictureInPicture();
                        console.log('[CALL] ✅ Exited PiP');
                    } else {
                        await remoteVideo.requestPictureInPicture();
                        console.log('[CALL] ✅ Entered PiP');
                    }
                } catch (err) {
                    console.error('[CALL] ❌ PiP failed:', err);
                }
            } else {
                console.warn('[CALL] ⚠️ PiP not supported or no video');
            }
        });
    }

    if (endCallButton) {
        endCallButton.addEventListener('click', () => {
            if (confirm('End the call?')) {
                cleanupCall();
                window.location.href = '/';
            }
        });
    }

    if (chatIconBtn) {
        chatIconBtn.addEventListener('click', () => {
            if (chatPanel) chatPanel.classList.add('active');
            unreadMessages = 0;
            updateChatBadge();
        });
    }

    if (chatBackBtn) {
        chatBackBtn.addEventListener('click', () => {
            if (chatPanel) chatPanel.classList.remove('active');
        });
    }

    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Settings panel
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const settingsClose = document.getElementById('settingsClose');
    const audioOutputSelect = document.getElementById('audioOutputSelect');

    // Populate audio output devices
    async function loadAudioOutputDevices() {
        if (!audioOutputSelect) return;

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioOutputs = devices.filter(device => device.kind === 'audiooutput');

            audioOutputSelect.innerHTML = '<option value="">Default Device</option>';

            audioOutputs.forEach(device => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Speaker ${audioOutputSelect.options.length}`;
                audioOutputSelect.appendChild(option);
            });

            console.log('[CALL] 🔊 Loaded', audioOutputs.length, 'audio output devices');
        } catch (err) {
            console.error('[CALL] Error loading audio devices:', err);
        }
    }

    // Handle audio output change
    if (audioOutputSelect) {
        audioOutputSelect.addEventListener('change', async () => {
            const deviceId = audioOutputSelect.value;
            if (remoteVideo && typeof remoteVideo.setSinkId === 'function') {
                try {
                    await remoteVideo.setSinkId(deviceId);
                    console.log('[CALL] 🔊 Switched audio output to:', deviceId || 'default');
                } catch (err) {
                    console.error('[CALL] Error switching audio output:', err);
                }
            }
        });
    }

    // Settings panel open/close
    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', () => {
            if (settingsPanel) settingsPanel.classList.add('active');
            if (settingsBackdrop) settingsBackdrop.classList.add('active');
            loadAudioOutputDevices(); // Refresh devices when opening
        });
    }

    if (settingsClose) {
        settingsClose.addEventListener('click', () => {
            if (settingsPanel) settingsPanel.classList.remove('active');
            if (settingsBackdrop) settingsBackdrop.classList.remove('active');
        });
    }

    if (settingsBackdrop) {
        settingsBackdrop.addEventListener('click', () => {
            settingsPanel.classList.remove('active');
            settingsBackdrop.classList.remove('active');
        });
    }

    // Make local PiP draggable
    if (localPip) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }

            if (e.target === localPip || localPip.contains(e.target)) {
                isDragging = true;
                localPip.classList.add('dragging');
            }
        };

        const dragEnd = () => {
            isDragging = false;
            localPip.classList.remove('dragging');

            // Snap to edges
            const container = callContainer.getBoundingClientRect();
            const pip = localPip.getBoundingClientRect();

            const snapThreshold = 50;
            let finalX = currentX;
            let finalY = currentY;

            // Snap to left or right
            if (pip.left < snapThreshold) {
                finalX = 16;
            } else if (container.width - pip.right < snapThreshold) {
                finalX = container.width - pip.width - 16;
            }

            // Snap to top or bottom
            if (pip.top < snapThreshold) {
                finalY = 16;
            } else if (container.height - pip.bottom < snapThreshold) {
                finalY = container.height - pip.height - 16;
            }

            setTranslate(finalX, finalY, localPip);
            xOffset = finalX;
            yOffset = finalY;
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();

                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                setTranslate(currentX, currentY, localPip);
            }
        };

        const setTranslate = (xPos, yPos, el) => {
            // Get boundaries
            const container = callContainer.getBoundingClientRect();
            const pip = el.getBoundingClientRect();

            // Constrain to container
            xPos = Math.max(0, Math.min(xPos, container.width - pip.width));
            yPos = Math.max(0, Math.min(yPos, container.height - pip.height));

            el.style.left = xPos + "px";
            el.style.top = yPos + "px";
            el.style.right = "auto";
        };

        // Add event listeners
        localPip.addEventListener("mousedown", dragStart, false);
        localPip.addEventListener("touchstart", dragStart, false);

        document.addEventListener("mouseup", dragEnd, false);
        document.addEventListener("touchend", dragEnd, false);

        document.addEventListener("mousemove", drag, false);
        document.addEventListener("touchmove", drag, { passive: false });
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

    // Auto-hide controls
    let controlsHideTimer = null;
    let controlsVisible = true;
    let fullscreenHintShown = false;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    function showControls() {
        const backButton = document.querySelector('.back-button');
        const userInfoBox = document.querySelector('.user-info-box');
        const callTimerBox = document.querySelector('.call-timer-box');
        const rightSideControls = document.querySelector('.right-side-controls');
        const bottomControlBar = document.querySelector('.bottom-control-bar');

        if (backButton) backButton.classList.remove('hidden');
        if (userInfoBox) userInfoBox.classList.remove('hidden');
        if (callTimerBox) callTimerBox.classList.remove('hidden');
        if (rightSideControls) rightSideControls.classList.remove('hidden');
        if (bottomControlBar) bottomControlBar.classList.remove('hidden');
        controlsVisible = true;

        // Exit fullscreen when showing controls
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.log('[CALL] Fullscreen exit error:', err));
        }

        // Hide hint if visible
        const hint = document.getElementById('fullscreenHint');
        if (hint) hint.remove();

        // Reset hide timer
        clearTimeout(controlsHideTimer);
        controlsHideTimer = setTimeout(() => {
            hideControls();
        }, 5000);
    }

    function hideControls() {
        const backButton = document.querySelector('.back-button');
        const userInfoBox = document.querySelector('.user-info-box');
        const callTimerBox = document.querySelector('.call-timer-box');
        const rightSideControls = document.querySelector('.right-side-controls');
        const bottomControlBar = document.querySelector('.bottom-control-bar');

        if (backButton) backButton.classList.add('hidden');
        if (userInfoBox) userInfoBox.classList.add('hidden');
        if (callTimerBox) callTimerBox.classList.add('hidden');
        if (rightSideControls) rightSideControls.classList.add('hidden');
        if (bottomControlBar) bottomControlBar.classList.add('hidden');
        controlsVisible = false;

        // Enter fullscreen when hiding controls
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                console.log('[CALL] Entered fullscreen');
                showFullscreenHint();
            }).catch(err => {
                console.log('[CALL] Fullscreen request failed:', err);
            });
        }
    }

    function showFullscreenHint() {
        // Only show hint once per session
        if (fullscreenHintShown) return;
        fullscreenHintShown = true;

        const hint = document.createElement('div');
        hint.id = 'fullscreenHint';
        hint.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            z-index: 9999;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideDown 0.3s ease;
        `;

        const message = isMobile
            ? '👆 Tap screen or press Back to exit fullscreen'
            : '⌨️ Press ESC to exit fullscreen';

        hint.textContent = message;
        document.body.appendChild(hint);

        // Auto-hide hint after 4 seconds
        setTimeout(() => {
            hint.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => hint.remove(), 300);
        }, 4000);
    }

    // Add CSS animations for hint
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { opacity: 0; transform: translate(-50%, -20px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes slideUp {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, -20px); }
        }
    `;
    document.head.appendChild(style);

    // Show controls on mouse move (PC) or tap (mobile)
    if (isMobile) {
        callContainer.addEventListener('touchstart', (e) => {
            // Don't hide controls when tapping buttons
            if (!e.target.closest('button')) {
                if (controlsVisible) {
                    // Hide if visible
                    hideControls();
                    clearTimeout(controlsHideTimer);
                } else {
                    // Show if hidden
                    showControls();
                }
            }
        });
    } else {
        // PC: show on mouse move
        document.addEventListener('mousemove', showControls);
    }

    // Listen for ESC key to exit fullscreen
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && !controlsVisible) {
            // Exited fullscreen, show controls
            showControls();
        }
    });

    // Initial hide after 5 seconds
    setTimeout(() => {
        hideControls();
    }, 5000);

    function createMediaHealthBadge() {
        if (!callContainer) return null;

        const badge = document.createElement('div');
        badge.id = 'mediaHealthBadge';
        badge.className = 'media-health-badge';
        badge.innerHTML = `
            <span class="badge-dot"></span>
            <span class="badge-text">Checking devices…</span>
        `;

        callContainer.appendChild(badge);
        return badge;
    }

    function updateMediaHealthBadge(state = 'ok', message = 'Devices ready') {
        if (!mediaHealthBadge) return;

        const states = ['ok', 'warning', 'error', 'offline'];
        const normalized = states.includes(state) ? state : 'warning';

        mediaHealthBadge.classList.remove('ok', 'warning', 'error', 'offline');
        mediaHealthBadge.classList.add(normalized);
        mediaHealthBadge.dataset.state = normalized;

        const textEl = mediaHealthBadge.querySelector('.badge-text');
        if (textEl) {
            textEl.textContent = message;
        }
    }

    function cleanupCall() {
        console.log('[CALL] Cleaning up call...');

        if (heartbeatInterval) clearInterval(heartbeatInterval);
        if (socket) socket.close();
        if (timerInterval) clearInterval(timerInterval);
        if (reconnectTimeout) clearTimeout(reconnectTimeout);
        if (adaptiveQuality) adaptiveQuality.stop();
        if (webrtc) webrtc.cleanup();
        releaseWakeLock();
        clearTimeout(controlsHideTimer);
    }
});

// Flying messages for 1-on-1 calls
function showFlyingMessage(sender, text, isGif = false) {
    const container = document.getElementById('flyingMessagesContainer');
    if (!container) return;

    const messageEl = document.createElement('div');
    messageEl.className = 'flying-message';

    if (isGif) {
        messageEl.innerHTML = `<span class="flying-message-sender">${sender}:</span><img src="${text}" alt="GIF">`;
    } else {
        messageEl.innerHTML = `<span class="flying-message-sender">${sender}:</span>${text}`;
    }

    container.appendChild(messageEl);

    // Auto remove after 3 seconds
    setTimeout(() => {
        messageEl.remove();
    }, 3000);
}

// Export for use in other parts
window.showFlyingMessage = showFlyingMessage;
