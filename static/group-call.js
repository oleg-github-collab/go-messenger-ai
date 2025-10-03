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
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatBtnLabel = document.getElementById('chatBtnLabel');
    const chatBadge = document.getElementById('chatBadge');
    const subtitleOverlay = document.getElementById('subtitleOverlay');
    const participantsBtn = document.getElementById('participantsBtn');
    const participantsModal = document.getElementById('participantsModal');
    const participantsModalClose = document.getElementById('participantsModalClose');
    const participantsList = document.getElementById('participantsList');
    const groupCallContainer = document.querySelector('.group-call-container');

    // Validate all elements exist
    if (!participantsGrid || !localVideo || !chatToggleBtn) {
        console.error('[GROUP-CALL] ❌ Critical elements missing!');
        alert('Failed to load group call interface. Please refresh.');
        return;
    }

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
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 10;
    let reconnectTimeout = null;
    let isChatVisible = false;
    let isChatSideBySide = false; // Split view on desktop
    let audioContexts = new Map(); // For speaking detection

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
                urls: [
                    `turn:${creds.host}:3478?transport=udp`,
                    `turn:${creds.host}:3478?transport=tcp`,
                    `turns:${creds.host}:5349?transport=tcp`
                ],
                username: creds.username,
                credential: creds.password
            });
            console.log('[GROUP-CALL] ✅ TURN server configured:', creds.host);
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
            console.log('[GROUP-CALL] 🎥 Received remote track:', event.track.kind, 'streams:', event.streams.length);

            if (event.streams && event.streams.length > 0) {
                const stream = event.streams[0];
                const streamId = stream.id;

                console.log('[GROUP-CALL] Stream ID:', streamId);

                // Try to find participant by stream ID pattern (stream-{participantId})
                const match = streamId.match(/stream-(.+)/);
                if (match) {
                    const participantId = match[1];
                    const participant = participants.get(participantId);

                    if (participant && participant.videoElement) {
                        // Attach stream to participant's video element
                        if (!participant.videoElement.srcObject) {
                            participant.videoElement.srcObject = stream;
                            console.log('[GROUP-CALL] ✅ Attached stream to participant:', participant.name);
                        } else {
                            // Add track to existing stream
                            console.log('[GROUP-CALL] ✅ Added track to existing stream for:', participant.name);
                        }
                    } else {
                        console.warn('[GROUP-CALL] ⚠️ Participant not found for stream:', streamId);
                    }
                } else {
                    console.warn('[GROUP-CALL] ⚠️ Could not parse participant ID from stream:', streamId);
                }
            }
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
            console.log('[GROUP-CALL] 🔌 Connection state:', peerConnection.connectionState);

            if (peerConnection.connectionState === 'connected') {
                console.log('[GROUP-CALL] ✅ Peer connection established');
                reconnectAttempts = 0; // Reset reconnect counter
            } else if (peerConnection.connectionState === 'failed') {
                console.error('[GROUP-CALL] ❌ Connection failed, attempting to reconnect...');
                // Try to restart ICE
                peerConnection.restartIce();
            }
        };

        peerConnection.oniceconnectionstatechange = () => {
            console.log('[GROUP-CALL] 🧊 ICE state:', peerConnection.iceConnectionState);

            if (peerConnection.iceConnectionState === 'connected' ||
                peerConnection.iceConnectionState === 'completed') {
                console.log('[GROUP-CALL] ✅ ICE connection established');
            } else if (peerConnection.iceConnectionState === 'failed') {
                console.error('[GROUP-CALL] ❌ ICE connection failed');
            }
        };

        peerConnection.onicegatheringstatechange = () => {
            console.log('[GROUP-CALL] 🧊 ICE gathering state:', peerConnection.iceGatheringState);
        };

        return peerConnection;
    }

    // Connect to SFU via WebSocket
    function connectToSFU() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const isHostSession = sessionStorage.getItem('isHost') === 'true';
        const wsUrl = `${protocol}//${window.location.host}/ws-sfu?room=${roomID}&name=${encodeURIComponent(myName)}&isHost=${isHostSession}`;

        console.log('[GROUP-CALL] Connecting as:', isHostSession ? 'HOST' : 'PARTICIPANT', 'Name:', myName);

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
                console.log('[GROUP-CALL] ← Received:', message.type, message);
                await handleSignalingMessage(message);
            } catch (err) {
                console.error('[GROUP-CALL] Failed to parse message:', err);
            }
        };

        socket.onerror = (error) => {
            console.error('[GROUP-CALL] WebSocket error:', error);
        };

        socket.onclose = (event) => {
            console.log('[GROUP-CALL] WebSocket closed', event.code, event.reason);

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
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('[GROUP-CALL] Added ICE candidate');
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

            case 'offer':
                // SFU sent us a new offer (renegotiation)
                const renegotiationOffer = typeof message.data === 'string' ? JSON.parse(message.data) : message.data;
                console.log('[GROUP-CALL] 🔄 Received renegotiation offer');

                await peerConnection.setRemoteDescription(new RTCSessionDescription(renegotiationOffer));
                const renegotiationAnswer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(renegotiationAnswer);

                socket.send(JSON.stringify({
                    type: 'answer',
                    data: JSON.stringify(renegotiationAnswer)
                }));
                console.log('[GROUP-CALL] ✅ Sent renegotiation answer');
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

                    appendMessage(chatData.text, 'received', chatData.from, chatData.fromName, isPrivate);

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

    function appendMessage(text, type, fromId, fromName, isPrivate) {
        if (chatEmpty) {
            chatEmpty.style.display = 'none';
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);
        if (isPrivate) {
            messageDiv.classList.add('private');
        }

        // Add header if received message
        if (type === 'received') {
            const header = document.createElement('div');
            header.className = 'message-header';
            header.textContent = fromName || `Participant ${fromId}`;
            if (isPrivate) {
                const badge = document.createElement('span');
                badge.className = 'message-private-badge';
                badge.textContent = 'PRIVATE';
                header.appendChild(badge);
            }
            messageDiv.appendChild(header);
        }

        const content = document.createElement('div');

        // Check if message is a GIF
        if (text.startsWith('[GIF]')) {
            const gifUrl = text.substring(5); // Remove [GIF] prefix
            const img = document.createElement('img');
            img.src = gifUrl;
            img.alt = 'GIF';
            img.loading = 'lazy';
            content.appendChild(img);
        } else {
            content.textContent = text;
        }

        messageDiv.appendChild(content);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage(textOverride = null) {
        const text = textOverride || messageInput.value.trim();
        const recipient = recipientSelect.value;

        console.log('[GROUP-CALL] 💬 Sending message:', text, 'to:', recipient, 'socket:', socket?.readyState);

        if (!text) {
            console.warn('[GROUP-CALL] Empty message, not sending');
            return;
        }

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error('[GROUP-CALL] Cannot send message, socket not ready. State:', socket?.readyState);
            alert('Connection not ready. Please wait...');
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
                    fromName: myName
                })
            };

            socket.send(JSON.stringify(chatMessage));
            console.log('[GROUP-CALL] ✅ Message sent successfully');

            // Display sent message
            const isPrivate = recipient !== 'everyone';
            const recipientName = isPrivate ? recipientSelect.options[recipientSelect.selectedIndex].text : null;

            const displayText = isPrivate ? `To ${recipientName}: ${text}` : text;
            appendMessage(displayText, 'sent', myParticipantId, myName, isPrivate);

            if (!textOverride) {
                messageInput.value = '';
            }
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

        updateGridLayout();
        console.log('[GROUP-CALL] Added participant:', participantName);
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

    // Page Before Unload - warn about leaving call
    window.addEventListener('beforeunload', (e) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
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

    // Initialize
    const mediaReady = await initLocalMedia();
    if (mediaReady) {
        connectToSFU();
        startTimer();
        updateGridLayout();
    }
});
