/**
 * Professional Video Call - 100ms SDK Implementation
 * Strictly following official 100ms documentation
 */

class ProfessionalCall {
    constructor() {
        // 100ms SDK instances
        this.hmsActions = null;
        this.hmsStore = null;
        this.hmsNotifications = null;

        // State
        this.roomID = null;
        this.isHost = false;
        this.authToken = null;
        this.userName = null;

        // Media state
        this.isAudioMuted = false;
        this.isVideoMuted = false;
        this.isScreenSharing = false;
        this.isRemoteAudioMuted = false;

        // AI Notetaker
        this.notetaker = null;

        // DOM elements - Preview
        this.previewScreen = document.getElementById('preview-screen');
        this.previewVideo = document.getElementById('preview-video');
        this.previewMicBtn = document.getElementById('preview-mic-btn');
        this.previewCameraBtn = document.getElementById('preview-camera-btn');
        this.joinBtn = document.getElementById('join-btn');

        // DOM elements - Call
        this.callScreen = document.getElementById('call-screen');
        this.localVideo = document.getElementById('local-video');
        this.remoteVideo = document.getElementById('remote-video');
        this.micBtn = document.getElementById('mic-btn');
        this.cameraBtn = document.getElementById('camera-btn');
        this.speakerBtn = document.getElementById('speaker-btn');
        this.screenShareBtn = document.getElementById('screen-share-btn');
        this.endCallBtn = document.getElementById('end-call-btn');
        this.loading = document.getElementById('loading');

        // DOM elements - Notetaker
        this.notetakerTrigger = document.getElementById('notetaker-trigger');
        this.notetakerPanel = document.getElementById('notetaker-panel');
        this.closeNotetaker = document.getElementById('close-notetaker');
        this.notetakerStart = document.getElementById('notetaker-start');
        this.notetakerPause = document.getElementById('notetaker-pause');
        this.notetakerStop = document.getElementById('notetaker-stop');
        this.notetakerStatus = document.getElementById('notetaker-status');
        this.transcriptContainer = document.getElementById('transcript-container');
    }

    async init() {
        console.log('[App] Initializing Professional Call');

        // Get room info from URL path: /professional/{inviteCode}?host=true
        const pathParts = window.location.pathname.split('/');
        this.roomID = pathParts[2]; // Get invite code from path

        const params = new URLSearchParams(window.location.search);
        this.isHost = params.get('host') === 'true';
        this.userName = this.isHost ? 'Host' : 'Guest';

        console.log('[App] Room ID:', this.roomID, 'Is Host:', this.isHost);

        if (!this.roomID) {
            alert('Room ID missing');
            window.location.href = '/';
            return;
        }

        // Initialize 100ms SDK - EXACTLY as per docs
        try {
            const { HMSReactiveStore } = await import('https://sdk.100ms.live/beta/hms.js');
            const hms = new HMSReactiveStore();

            this.hmsActions = hms.getHMSActions();
            this.hmsStore = hms.getStore();
            this.hmsNotifications = hms.getNotifications();

            console.log('[App] ✅ 100ms SDK initialized');
        } catch (error) {
            console.error('[App] ❌ SDK init failed:', error);
            alert('Failed to initialize SDK');
            return;
        }

        // Setup listeners
        this.setupHMSListeners();
        this.setupUIListeners();

        // Get auth token and start preview
        await this.getAuthToken();
        await this.startPreview();

        // Initialize AI Notetaker
        this.notetaker = new AINotetaker(this.roomID, this.transcriptContainer, this.notetakerStatus);
    }

    async getAuthToken() {
        console.log('[App] Fetching auth token for invite code:', this.roomID);

        try {
            // First, get invite details to get HMS room_id
            const inviteResponse = await fetch(`/api/professional/invite/${this.roomID}`);
            if (!inviteResponse.ok) {
                throw new Error('Invite not found');
            }

            const inviteData = await inviteResponse.json();
            const hmsRoomID = inviteData.hms_room_id;

            console.log('[App] HMS Room ID:', hmsRoomID);

            // Now get the auth token
            const tokenResponse = await fetch('/api/professional/create-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: hmsRoomID,
                    user_id: this.isHost ? 'host' : 'guest-' + Date.now(),
                    role: this.isHost ? 'host' : 'guest',
                    user_name: this.userName
                })
            });

            if (!tokenResponse.ok) {
                throw new Error('Token fetch failed');
            }

            const tokenData = await tokenResponse.json();
            this.authToken = tokenData.token;
            console.log('[App] ✅ Auth token received');
        } catch (error) {
            console.error('[App] ❌ Token fetch failed:', error);
            alert('Failed to get authentication token: ' + error.message);
            throw error;
        }
    }

    async startPreview() {
        console.log('[App] Starting preview...');

        try {
            // Get local media stream for preview
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            this.previewVideo.srcObject = stream;
            console.log('[App] ✅ Preview started');
        } catch (error) {
            console.error('[App] ❌ Preview failed:', error);
            alert('Could not access camera/microphone');
        }
    }

    setupHMSListeners() {
        console.log('[App] Setting up HMS listeners');

        // Listen for notifications - EXACTLY as per docs
        this.hmsNotifications.onNotification((notification) => {
            console.log('[HMS Notification]', notification.type, notification);

            if (notification.type === 'RECONNECTING') {
                this.showLoading('Reconnecting...');
            } else if (notification.type === 'RECONNECTED') {
                this.hideLoading();
            } else if (notification.type === 'ERROR') {
                console.error('[HMS Error]', notification.data);
                alert('Call error: ' + notification.data?.message);
            }
        });

        // Subscribe to peers changes - EXACTLY as per docs
        this.hmsStore.subscribe((peers) => {
            console.log('[HMS] Peers update:', peers);
            this.handlePeersUpdate(peers);
        }, selectPeers);

        // Subscribe to local peer audio state
        this.hmsStore.subscribe((enabled) => {
            if (enabled !== undefined) {
                this.isAudioMuted = !enabled;
                this.updateMicUI();
            }
        }, selectIsLocalAudioEnabled);

        // Subscribe to local peer video state
        this.hmsStore.subscribe((enabled) => {
            if (enabled !== undefined) {
                this.isVideoMuted = !enabled;
                this.updateCameraUI();
            }
        }, selectIsLocalVideoEnabled);

        // Subscribe to screen share state
        this.hmsStore.subscribe((isSharing) => {
            if (isSharing !== undefined) {
                this.isScreenSharing = isSharing;
                this.updateScreenShareUI();
            }
        }, selectIsLocalScreenShared);
    }

    setupUIListeners() {
        console.log('[App] Setting up UI listeners');

        // Preview controls
        this.previewMicBtn.onclick = () => this.togglePreviewAudio();
        this.previewCameraBtn.onclick = () => this.togglePreviewVideo();
        this.joinBtn.onclick = () => this.joinCall();

        // Call controls
        this.micBtn.onclick = () => this.toggleMic();
        this.cameraBtn.onclick = () => this.toggleCamera();
        this.speakerBtn.onclick = () => this.toggleSpeaker();
        this.screenShareBtn.onclick = () => this.toggleScreenShare();
        this.endCallBtn.onclick = () => this.leaveCall();

        // Notetaker controls
        this.notetakerTrigger.onclick = () => this.notetakerPanel.classList.add('open');
        this.closeNotetaker.onclick = () => this.notetakerPanel.classList.remove('open');
        this.notetakerStart.onclick = () => this.notetaker.start();
        this.notetakerPause.onclick = () => this.notetaker.pause();
        this.notetakerStop.onclick = () => this.notetaker.stop();
    }

    async togglePreviewAudio() {
        const stream = this.previewVideo.srcObject;
        if (!stream) return;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            this.isAudioMuted = !audioTracks[0].enabled;

            if (this.isAudioMuted) {
                this.previewMicBtn.classList.remove('active');
                this.previewMicBtn.classList.add('muted');
            } else {
                this.previewMicBtn.classList.add('active');
                this.previewMicBtn.classList.remove('muted');
            }
        }
    }

    async togglePreviewVideo() {
        const stream = this.previewVideo.srcObject;
        if (!stream) return;

        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            this.isVideoMuted = !videoTracks[0].enabled;

            if (this.isVideoMuted) {
                this.previewCameraBtn.classList.remove('active');
                this.previewCameraBtn.classList.add('muted');
            } else {
                this.previewCameraBtn.classList.add('active');
                this.previewCameraBtn.classList.remove('muted');
            }
        }
    }

    async joinCall() {
        console.log('[App] Joining call...');
        this.showLoading('Joining call...');

        try {
            // Join configuration - EXACTLY as per 100ms docs
            const config = {
                userName: this.userName,
                authToken: this.authToken,
                settings: {
                    isAudioMuted: this.isAudioMuted,
                    isVideoMuted: this.isVideoMuted
                },
                rememberDeviceSelection: true
            };

            // Join room - EXACTLY as per docs
            await this.hmsActions.join(config);

            console.log('[App] ✅ Joined successfully');

            // Stop preview stream
            const stream = this.previewVideo.srcObject;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            // Switch to call screen
            this.previewScreen.classList.add('hidden');
            this.callScreen.classList.add('active');
            this.hideLoading();

        } catch (error) {
            console.error('[App] ❌ Join failed:', error);
            this.hideLoading();
            alert('Failed to join call: ' + error.message);
        }
    }

    handlePeersUpdate(peers) {
        console.log('[App] Handling peers update, count:', peers.length);

        // Find local and remote peers
        const localPeer = peers.find(p => p.isLocal);
        const remotePeer = peers.find(p => !p.isLocal);

        // Attach local video - EXACTLY as per docs
        if (localPeer && localPeer.videoTrack) {
            this.attachTrack(localPeer.videoTrack, this.localVideo);
        }

        // Attach remote video - EXACTLY as per docs
        if (remotePeer && remotePeer.videoTrack) {
            this.attachTrack(remotePeer.videoTrack, this.remoteVideo);
        }

        // Attach remote audio - EXACTLY as per docs
        if (remotePeer && remotePeer.audioTrack) {
            this.attachTrack(remotePeer.audioTrack, this.remoteVideo);
        }
    }

    attachTrack(track, element) {
        console.log('[App] Attaching track:', track.type, 'to', element.id);

        try {
            // EXACTLY as per 100ms docs
            if (track.enabled) {
                const mediaStream = new MediaStream();
                mediaStream.addTrack(track);
                element.srcObject = mediaStream;
                console.log('[App] ✅ Track attached');
            }
        } catch (error) {
            console.error('[App] ❌ Track attachment failed:', error);
        }
    }

    // Call controls - EXACTLY as per 100ms docs
    async toggleMic() {
        console.log('[App] Toggling mic...');

        try {
            const enabled = this.hmsStore.getState(selectIsLocalAudioEnabled);
            await this.hmsActions.setLocalAudioEnabled(!enabled);
            console.log('[App] ✅ Mic toggled to:', !enabled);
        } catch (error) {
            console.error('[App] ❌ Mic toggle failed:', error);
        }
    }

    async toggleCamera() {
        console.log('[App] Toggling camera...');

        try {
            const enabled = this.hmsStore.getState(selectIsLocalVideoEnabled);
            await this.hmsActions.setLocalVideoEnabled(!enabled);
            console.log('[App] ✅ Camera toggled to:', !enabled);
        } catch (error) {
            console.error('[App] ❌ Camera toggle failed:', error);
        }
    }

    toggleSpeaker() {
        console.log('[App] Toggling speaker...');

        this.isRemoteAudioMuted = !this.isRemoteAudioMuted;
        this.remoteVideo.muted = this.isRemoteAudioMuted;
        this.updateSpeakerUI();

        console.log('[App] ✅ Speaker toggled to:', !this.isRemoteAudioMuted);
    }

    async toggleScreenShare() {
        console.log('[App] Toggling screen share...');

        try {
            // EXACTLY as per 100ms docs
            const newState = !this.isScreenSharing;
            await this.hmsActions.setScreenShareEnabled(newState);
            console.log('[App] ✅ Screen share toggled to:', newState);
        } catch (error) {
            console.error('[App] ❌ Screen share toggle failed:', error);

            // Don't show error if user cancelled
            if (!error.message.includes('denied') && !error.message.includes('Permission')) {
                alert('Screen share failed: ' + error.message);
            }
        }
    }

    async leaveCall() {
        console.log('[App] Leaving call...');

        try {
            // Stop notetaker if running
            if (this.notetaker) {
                this.notetaker.stop();
            }

            // Leave room - EXACTLY as per 100ms docs
            await this.hmsActions.leave();
            console.log('[App] ✅ Left call');

            // Redirect to home
            window.location.href = '/';
        } catch (error) {
            console.error('[App] ❌ Leave failed:', error);
            // Force redirect anyway
            window.location.href = '/';
        }
    }

    // UI updates
    updateMicUI() {
        if (this.isAudioMuted) {
            this.micBtn.classList.remove('active');
            this.micBtn.classList.add('muted');
        } else {
            this.micBtn.classList.add('active');
            this.micBtn.classList.remove('muted');
        }
    }

    updateCameraUI() {
        if (this.isVideoMuted) {
            this.cameraBtn.classList.remove('active');
            this.cameraBtn.classList.add('muted');
        } else {
            this.cameraBtn.classList.add('active');
            this.cameraBtn.classList.remove('muted');
        }
    }

    updateSpeakerUI() {
        if (this.isRemoteAudioMuted) {
            this.speakerBtn.classList.remove('active');
            this.speakerBtn.classList.add('muted');
        } else {
            this.speakerBtn.classList.add('active');
            this.speakerBtn.classList.remove('muted');
        }
    }

    updateScreenShareUI() {
        if (this.isScreenSharing) {
            this.screenShareBtn.classList.add('active');
        } else {
            this.screenShareBtn.classList.remove('active');
        }
    }

    showLoading(message) {
        this.loading.querySelector('.loading-text').textContent = message;
        this.loading.classList.add('active');
    }

    hideLoading() {
        this.loading.classList.remove('active');
    }
}

/**
 * Simple Notetaker - Manual text notes (no auto-transcription, no HMS recording)
 */
class AINotetaker {
    constructor(roomID, container, statusEl) {
        this.roomID = roomID;
        this.container = container;
        this.statusEl = statusEl;
        this.notes = [];
        this.startTime = null;

        // Add manual note input
        this.setupManualInput();
    }

    setupManualInput() {
        // Add input field to container
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = 'padding: 12px; border-top: 1px solid rgba(255,255,255,0.1);';
        inputContainer.innerHTML = `
            <div style="display: flex; gap: 8px;">
                <input type="text" id="manual-note-input" placeholder="Type a note..."
                    style="flex: 1; padding: 8px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: white; font-size: 14px;">
                <button id="add-note-btn" style="padding: 8px 16px; background: #4ade80; border: none; border-radius: 6px; color: #000; font-weight: 600; cursor: pointer;">Add</button>
            </div>
        `;

        this.container.parentElement.insertBefore(inputContainer, this.container);

        const noteInput = document.getElementById('manual-note-input');
        const addNoteBtn = document.getElementById('add-note-btn');

        addNoteBtn.onclick = () => this.addManualNote(noteInput);
        noteInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                this.addManualNote(noteInput);
            }
        };
    }

    addManualNote(input) {
        const text = input.value.trim();
        if (!text) return;

        this.addNoteEntry(text);
        input.value = '';
    }

    start() {
        console.log('[Notetaker] Started (manual mode)');
        this.startTime = Date.now();
        this.updateStatus('Ready - Type notes manually', 'recording');
        this.updateButtons();
    }

    pause() {
        console.log('[Notetaker] Paused');
        this.updateStatus('Paused', 'paused');
        this.updateButtons();
    }

    stop() {
        console.log('[Notetaker] Stopped');
        this.updateStatus('Stopped', 'stopped');
        this.updateButtons();
        this.saveNotes();
    }

    addNoteEntry(text) {
        const entry = {
            text: text,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString()
        };

        this.notes.push(entry);

        // Add to UI
        const entryEl = document.createElement('div');
        entryEl.className = 'transcript-entry';
        entryEl.innerHTML = `
            <div class="transcript-time">${entry.time}</div>
            <div class="transcript-text">${this.escapeHtml(entry.text)}</div>
        `;

        this.container.appendChild(entryEl);
        this.container.scrollTop = this.container.scrollHeight;

        console.log('[Notetaker] Note added:', text);
    }

    async saveNotes() {
        if (this.notes.length === 0) {
            console.log('[Notetaker] No notes to save');
            return;
        }

        console.log('[Notetaker] Saving notes...');

        try {
            const response = await fetch('/api/save-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: this.roomID,
                    notes: this.notes,
                    saved_at: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('[Notetaker] ✅ Notes saved');
                alert('Notes saved successfully!');
            } else {
                console.error('[Notetaker] ❌ Save failed:', response.status);
            }
        } catch (error) {
            console.error('[Notetaker] ❌ Save error:', error);
        }
    }

    updateStatus(text, className) {
        this.statusEl.textContent = text;
        this.statusEl.className = 'notetaker-status';
        if (className) {
            this.statusEl.classList.add(className);
        }
    }

    updateButtons() {
        const startBtn = document.getElementById('notetaker-start');
        const pauseBtn = document.getElementById('notetaker-pause');
        const stopBtn = document.getElementById('notetaker-stop');

        // Simple mode - hide pause/stop, only show clear
        if (startBtn) startBtn.style.display = 'none';
        if (pauseBtn) {
            pauseBtn.textContent = 'Clear All';
            pauseBtn.disabled = false;
            pauseBtn.onclick = () => this.clearNotes();
        }
        if (stopBtn) {
            stopBtn.textContent = 'Save Notes';
            stopBtn.disabled = false;
            stopBtn.onclick = () => this.saveNotes();
        }
    }

    clearNotes() {
        if (confirm('Clear all notes?')) {
            this.notes = [];
            this.container.innerHTML = '';
            console.log('[Notetaker] Notes cleared');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 100ms Selectors - EXACTLY as per docs
const selectPeers = (state) => state.peers;
const selectIsLocalAudioEnabled = (state) => state.localPeer?.audioEnabled;
const selectIsLocalVideoEnabled = (state) => state.localPeer?.videoEnabled;
const selectIsLocalScreenShared = (state) => state.localPeer?.auxiliaryTracks?.length > 0;

// Initialize app
const app = new ProfessionalCall();
app.init();

console.log('[App] ✅ Loaded');
