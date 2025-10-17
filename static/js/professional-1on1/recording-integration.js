/**
 * HMS Recording Integration for Professional AI Notetaker
 * Connects HMS audio tracks with browser-based recording
 * Since HMS free tier doesn't support cloud recording, we use MediaRecorder API
 */

class HMSRecordingIntegration {
    constructor() {
        this.hmsSDK = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioContext = null;
        this.destination = null;
        this.sources = [];
        this.stream = null;

        console.log('[HMS-RECORDING] Initialization ready');
    }

    /**
     * Initialize with HMS SDK instance
     */
    setHMSSDK(hmsSDK) {
        this.hmsSDK = hmsSDK;
        console.log('[HMS-RECORDING] HMS SDK connected');
    }

    /**
     * Start recording all audio from the HMS call
     */
    async startRecording() {
        if (this.isRecording) {
            console.warn('[HMS-RECORDING] Already recording');
            return { success: false, error: 'Already recording' };
        }

        if (!this.hmsSDK || !this.hmsSDK.hmsStore) {
            console.error('[HMS-RECORDING] HMS SDK not initialized');
            return { success: false, error: 'HMS SDK not ready' };
        }

        try {
            console.log('[HMS-RECORDING] 🎙️ Starting recording...');

            // Initialize audio context
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContextClass();
            await this.audioContext.resume();

            // Create destination for mixed audio
            this.destination = this.audioContext.createMediaStreamDestination();

            // Get all audio tracks from HMS
            const state = this.hmsSDK.hmsStore.getState();
            const peers = Object.values(state.peers || {});

            console.log('[HMS-RECORDING] Found', peers.length, 'peers');

            // Mix all audio tracks
            for (const peer of peers) {
                if (peer.audioTrack && !peer.audioTrack.enabled === false) {
                    await this.addPeerAudio(peer);
                }
            }

            // Get the mixed stream
            this.stream = this.destination.stream;

            // If no tracks were added, create a silent track
            if (this.sources.length === 0) {
                console.warn('[HMS-RECORDING] No audio tracks found, using microphone as fallback');
                try {
                    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    const micSource = this.audioContext.createMediaStreamSource(micStream);
                    micSource.connect(this.destination);
                    this.sources.push({ source: micSource, track: micStream.getAudioTracks()[0] });
                } catch (err) {
                    console.error('[HMS-RECORDING] Failed to get microphone:', err);
                    return { success: false, error: 'No audio sources available' };
                }
            }

            // Create MediaRecorder
            const mimeType = this.getSupportedMimeType();
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });

            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log('[HMS-RECORDING] 📦 Chunk received:', event.data.size, 'bytes');
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('[HMS-RECORDING] ❌ MediaRecorder error:', event.error);
            };

            this.mediaRecorder.onstop = () => {
                console.log('[HMS-RECORDING] MediaRecorder stopped, chunks:', this.audioChunks.length);
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;

            console.log('[HMS-RECORDING] ✅ Recording started with', this.sources.length, 'audio sources');
            return { success: true };

        } catch (error) {
            console.error('[HMS-RECORDING] ❌ Failed to start recording:', error);
            this.cleanup();
            return { success: false, error: error.message };
        }
    }

    /**
     * Add a peer's audio to the mix
     */
    async addPeerAudio(peer) {
        try {
            // Get the native MediaStreamTrack from HMS
            const audioTrack = peer.audioTrack;
            if (!audioTrack) return;

            // For HMS SDK, we need to get the actual MediaStreamTrack
            // HMS wraps tracks, so we need to access the underlying track
            let nativeTrack = null;

            if (audioTrack.nativeTrack) {
                nativeTrack = audioTrack.nativeTrack;
            } else if (audioTrack.track) {
                nativeTrack = audioTrack.track;
            } else if (typeof audioTrack.getMediaStreamTrack === 'function') {
                nativeTrack = audioTrack.getMediaStreamTrack();
            }

            if (!nativeTrack) {
                console.warn('[HMS-RECORDING] Could not get native track for peer:', peer.name);
                return;
            }

            // Create a MediaStream from the track
            const mediaStream = new MediaStream([nativeTrack]);

            // Create audio source
            const source = this.audioContext.createMediaStreamSource(mediaStream);
            source.connect(this.destination);

            this.sources.push({ source, track: nativeTrack, peerId: peer.id });
            console.log('[HMS-RECORDING] ✅ Added audio from:', peer.name);

        } catch (error) {
            console.error('[HMS-RECORDING] ❌ Failed to add peer audio:', error);
        }
    }

    /**
     * Stop recording and get audio blob
     */
    async stopRecording() {
        if (!this.isRecording) {
            console.warn('[HMS-RECORDING] Not recording');
            return { success: false, error: 'Not recording' };
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                try {
                    const mimeType = this.getSupportedMimeType();
                    const audioBlob = new Blob(this.audioChunks, { type: mimeType });

                    console.log('[HMS-RECORDING] ✅ Recording stopped, blob size:', audioBlob.size, 'bytes');

                    this.cleanup();

                    resolve({
                        success: true,
                        blob: audioBlob,
                        duration: this.audioChunks.length, // Approximate duration in seconds
                        size: audioBlob.size
                    });
                } catch (error) {
                    console.error('[HMS-RECORDING] ❌ Error creating blob:', error);
                    this.cleanup();
                    resolve({ success: false, error: error.message });
                }
            };

            this.isRecording = false;
            this.mediaRecorder.stop();
        });
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Disconnect all sources
        this.sources.forEach(({ source, track }) => {
            try {
                source.disconnect();
                if (track && track.stop) {
                    track.stop();
                }
            } catch (err) {
                console.warn('[HMS-RECORDING] Error disconnecting source:', err);
            }
        });
        this.sources = [];

        // Close audio context
        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (err) {
                console.warn('[HMS-RECORDING] Error closing audio context:', err);
            }
            this.audioContext = null;
        }

        this.destination = null;
        this.stream = null;
        this.audioChunks = [];
        this.mediaRecorder = null;
        this.isRecording = false;

        console.log('[HMS-RECORDING] 🧹 Cleanup complete');
    }

    /**
     * Get supported MIME type for recording
     */
    getSupportedMimeType() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/mp4',
            'audio/mpeg'
        ];

        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('[HMS-RECORDING] Using MIME type:', type);
                return type;
            }
        }

        console.warn('[HMS-RECORDING] No supported MIME type found, using default');
        return 'audio/webm';
    }

    /**
     * Get current recording status
     */
    getStatus() {
        return {
            isRecording: this.isRecording,
            sourcesCount: this.sources.length,
            chunksCollected: this.audioChunks.length
        };
    }
}

// Export for global use
window.HMSRecordingIntegration = HMSRecordingIntegration;
console.log('[HMS-RECORDING] ✅ HMSRecordingIntegration loaded');
