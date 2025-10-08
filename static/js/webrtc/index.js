/**
 * WebRTC Manager - Main entry point for WebRTC functionality
 * Combines all WebRTC modules into a unified interface
 * @module webrtc
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';
import { getICEConfiguration } from './ice-config.js';
import { MediaManager } from './media-manager.js';
import { PeerConnectionManager } from './peer-connection.js';
import { SignalingManager } from './signaling.js';

const logger = new Logger('WEBRTC');

export class WebRTCManager {
    constructor(socket, roomID) {
        this.socket = socket;
        this.roomID = roomID;

        // Managers
        this.mediaManager = new MediaManager();
        this.peerManager = null;
        this.signalingManager = new SignalingManager(socket, roomID);

        // State
        this.isInitialized = false;
        this.isConnected = false;

        // Setup global event listeners
        this.setupGlobalEvents();

        logger.log(`WebRTC Manager created for room: ${roomID}`);
    }

    /**
     * Initialize WebRTC with media and peer connection
     */
    async initialize(mediaConstraints = null) {
        try {
            logger.log('Initializing WebRTC...');

            // Get user media
            const stream = await this.mediaManager.getUserMedia(mediaConstraints);

            // Load ICE configuration
            const iceConfig = await getICEConfiguration();

            // Create peer connection
            this.peerManager = new PeerConnectionManager(iceConfig);
            this.peerManager.createPeerConnection();

            // Setup callbacks
            this.setupPeerCallbacks();

            // Add local stream to peer connection
            this.peerManager.addStream(stream);

            // Join room via signaling
            this.signalingManager.joinRoom();

            this.isInitialized = true;
            logger.success('WebRTC initialized successfully');

            return {
                localStream: stream,
                peerConnection: this.peerManager.peerConnection
            };

        } catch (error) {
            logger.error('Failed to initialize WebRTC:', error);
            throw error;
        }
    }

    /**
     * Setup peer connection callbacks
     */
    setupPeerCallbacks() {
        this.peerManager.onIceCandidate = (candidate) => {
            this.signalingManager.sendIceCandidate(candidate);
        };

        this.peerManager.onNegotiationNeeded = (description) => {
            if (description.type === 'offer') {
                this.signalingManager.sendOffer(description);
            } else if (description.type === 'answer') {
                this.signalingManager.sendAnswer(description);
            }
        };

        this.peerManager.onTrack = (event) => {
            logger.log('Remote track received');
            globalEvents.emit('remote-stream-ready', this.peerManager.getRemoteStream());
        };

        this.peerManager.onConnectionStateChange = (state) => {
            this.isConnected = (state === 'connected');
            globalEvents.emit('webrtc-connection-state', state);
        };
    }

    /**
     * Setup global event listeners for signaling
     */
    setupGlobalEvents() {
        // Handle incoming offer
        globalEvents.on('webrtc:offer', async (data) => {
            try {
                const answer = await this.peerManager.handleOffer(data.offer);
                if (answer) {
                    this.signalingManager.sendAnswer(answer, data.from);
                }
            } catch (error) {
                logger.error('Error handling offer:', error);
            }
        });

        // Handle incoming answer
        globalEvents.on('webrtc:answer', async (data) => {
            try {
                await this.peerManager.handleAnswer(data.answer);
            } catch (error) {
                logger.error('Error handling answer:', error);
            }
        });

        // Handle incoming ICE candidate
        globalEvents.on('webrtc:ice-candidate', async (data) => {
            try {
                await this.peerManager.handleIceCandidate(data.candidate);
            } catch (error) {
                logger.error('Error handling ICE candidate:', error);
            }
        });

        // Handle user connected
        globalEvents.on('user-connected', async (data) => {
            logger.log('New user connected, initiating connection...');
            // Peer connection will trigger negotiation automatically
        });

        // Handle user disconnected
        globalEvents.on('user-disconnected', (data) => {
            logger.log('User disconnected, cleaning up...');
            this.isConnected = false;
        });
    }

    /**
     * Get local media stream
     */
    getLocalStream() {
        return this.mediaManager.getStream();
    }

    /**
     * Get remote media stream
     */
    getRemoteStream() {
        return this.peerManager?.getRemoteStream();
    }

    /**
     * Switch camera
     */
    async switchCamera(deviceId) {
        return await this.mediaManager.switchCamera(deviceId);
    }

    /**
     * Switch microphone
     */
    async switchMicrophone(deviceId) {
        return await this.mediaManager.switchMicrophone(deviceId);
    }

    /**
     * Toggle video
     */
    toggleVideo(enabled) {
        return this.mediaManager.toggleVideo(enabled);
    }

    /**
     * Toggle audio
     */
    toggleAudio(enabled) {
        return this.mediaManager.toggleAudio(enabled);
    }

    /**
     * Enumerate media devices
     */
    async enumerateDevices() {
        return await this.mediaManager.enumerateDevices();
    }

    /**
     * Get connection stats
     */
    async getStats() {
        return await this.peerManager?.getStats();
    }

    /**
     * Cleanup and close connections
     */
    cleanup() {
        logger.log('Cleaning up WebRTC...');

        // Stop media tracks
        this.mediaManager.stopAllTracks();

        // Close peer connection
        if (this.peerManager) {
            this.peerManager.close();
        }

        // Leave room
        this.signalingManager.leaveRoom();

        this.isInitialized = false;
        this.isConnected = false;

        logger.success('WebRTC cleanup complete');
    }

    /**
     * Check if initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Check if peer is connected
     */
    isPeerConnected() {
        return this.isConnected;
    }
}

// Export all modules
export { MediaManager } from './media-manager.js';
export { PeerConnectionManager } from './peer-connection.js';
export { SignalingManager } from './signaling.js';
export { getICEConfiguration, DEFAULT_ICE_CONFIG } from './ice-config.js';

export default WebRTCManager;
