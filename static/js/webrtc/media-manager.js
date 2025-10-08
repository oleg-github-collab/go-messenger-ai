/**
 * Media Manager - Handles camera and microphone access
 * @module webrtc/media-manager
 */

import { Logger } from '../core/logger.js';
import { sessionStore } from '../core/storage.js';

const logger = new Logger('WEBRTC:MEDIA');

export class MediaManager {
    constructor() {
        this.localStream = null;
        this.currentCameraId = null;
        this.currentMicrophoneId = null;
        this.devices = {
            cameras: [],
            microphones: []
        };
    }

    /**
     * Get user media with specified constraints
     */
    async getUserMedia(constraints = null) {
        try {
            // Use stored preferences if no constraints provided
            if (!constraints) {
                constraints = this.getMediaConstraints();
            }

            logger.log('Requesting user media:', constraints);

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.localStream = stream;

            // Store device IDs
            const videoTrack = stream.getVideoTracks()[0];
            const audioTrack = stream.getAudioTracks()[0];

            if (videoTrack) {
                this.currentCameraId = videoTrack.getSettings().deviceId;
                logger.log(`Camera: ${videoTrack.label}`);
            }

            if (audioTrack) {
                this.currentMicrophoneId = audioTrack.getSettings().deviceId;
                logger.log(`Microphone: ${audioTrack.label}`);
            }

            logger.success('Media stream acquired');
            return stream;

        } catch (error) {
            logger.error('Failed to get user media:', error);
            throw new Error(`Camera/Microphone access denied: ${error.message}`);
        }
    }

    /**
     * Build media constraints from session storage preferences
     */
    getMediaConstraints() {
        const enableVideo = sessionStore.get('enableVideo', true);
        const enableAudio = sessionStore.get('enableAudio', true);
        const cameraId = sessionStore.get('cameraId');
        const microphoneId = sessionStore.get('microphoneId');

        const constraints = {
            video: enableVideo ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            } : false,
            audio: enableAudio ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            } : false
        };

        // Apply specific device IDs if available
        if (enableVideo && cameraId && constraints.video) {
            constraints.video.deviceId = { exact: cameraId };
        }

        if (enableAudio && microphoneId && constraints.audio) {
            constraints.audio.deviceId = { exact: microphoneId };
        }

        return constraints;
    }

    /**
     * Enumerate available media devices
     */
    async enumerateDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            this.devices.cameras = devices.filter(d => d.kind === 'videoinput');
            this.devices.microphones = devices.filter(d => d.kind === 'audioinput');

            logger.log(`Found ${this.devices.cameras.length} cameras, ${this.devices.microphones.length} microphones`);

            return this.devices;

        } catch (error) {
            logger.error('Failed to enumerate devices:', error);
            return { cameras: [], microphones: [] };
        }
    }

    /**
     * Switch to a different camera
     */
    async switchCamera(deviceId) {
        if (!this.localStream) {
            logger.warn('No local stream to switch camera');
            return false;
        }

        try {
            logger.log(`Switching to camera: ${deviceId}`);

            // Stop current video track
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.stop();
            }

            // Get new video track
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                }
            });

            const newVideoTrack = newStream.getVideoTracks()[0];

            // Replace track in stream
            if (videoTrack) {
                this.localStream.removeTrack(videoTrack);
            }
            this.localStream.addTrack(newVideoTrack);

            this.currentCameraId = deviceId;
            sessionStore.set('cameraId', deviceId);

            logger.success('Camera switched successfully');
            return true;

        } catch (error) {
            logger.error('Failed to switch camera:', error);
            return false;
        }
    }

    /**
     * Switch to a different microphone
     */
    async switchMicrophone(deviceId) {
        if (!this.localStream) {
            logger.warn('No local stream to switch microphone');
            return false;
        }

        try {
            logger.log(`Switching to microphone: ${deviceId}`);

            // Stop current audio track
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.stop();
            }

            // Get new audio track
            const newStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: { exact: deviceId },
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            const newAudioTrack = newStream.getAudioTracks()[0];

            // Replace track in stream
            if (audioTrack) {
                this.localStream.removeTrack(audioTrack);
            }
            this.localStream.addTrack(newAudioTrack);

            this.currentMicrophoneId = deviceId;
            sessionStore.set('microphoneId', deviceId);

            logger.success('Microphone switched successfully');
            return true;

        } catch (error) {
            logger.error('Failed to switch microphone:', error);
            return false;
        }
    }

    /**
     * Toggle video track enabled state
     */
    toggleVideo(enabled) {
        if (!this.localStream) return false;

        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = enabled;
            logger.log(`Video ${enabled ? 'enabled' : 'disabled'}`);
            return true;
        }

        return false;
    }

    /**
     * Toggle audio track enabled state
     */
    toggleAudio(enabled) {
        if (!this.localStream) return false;

        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = enabled;
            logger.log(`Audio ${enabled ? 'enabled' : 'disabled'}`);
            return true;
        }

        return false;
    }

    /**
     * Stop all media tracks and release resources
     */
    stopAllTracks() {
        if (!this.localStream) return;

        logger.log('Stopping all media tracks...');

        this.localStream.getTracks().forEach(track => {
            track.stop();
            logger.debug(`Stopped ${track.kind} track: ${track.label}`);
        });

        this.localStream = null;
        this.currentCameraId = null;
        this.currentMicrophoneId = null;

        logger.success('All media tracks stopped');
    }

    /**
     * Get current stream
     */
    getStream() {
        return this.localStream;
    }

    /**
     * Check if media is supported
     */
    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
}

export default MediaManager;
