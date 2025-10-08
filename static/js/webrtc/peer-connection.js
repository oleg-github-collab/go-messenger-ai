/**
 * Peer Connection Manager - Handles WebRTC peer connections
 * @module webrtc/peer-connection
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';

const logger = new Logger('WEBRTC:PEER');

export class PeerConnectionManager {
    constructor(iceConfig) {
        this.iceConfig = iceConfig;
        this.peerConnection = null;
        this.remoteStream = new MediaStream();
        this.makingOffer = false;
        this.ignoreOffer = false;
        this.isSettingRemoteAnswerPending = false;

        // Callbacks
        this.onIceCandidate = null;
        this.onNegotiationNeeded = null;
        this.onTrack = null;
        this.onConnectionStateChange = null;
    }

    /**
     * Create new RTCPeerConnection
     */
    createPeerConnection() {
        if (this.peerConnection) {
            logger.warn('Peer connection already exists, closing old one');
            this.close();
        }

        try {
            logger.log('Creating peer connection with ICE config:', {
                servers: this.iceConfig.iceServers.length
            });

            this.peerConnection = new RTCPeerConnection(this.iceConfig);

            // Setup event handlers
            this.setupEventHandlers();

            logger.success('Peer connection created');
            return this.peerConnection;

        } catch (error) {
            logger.error('Failed to create peer connection:', error);
            throw error;
        }
    }

    /**
     * Setup WebRTC event handlers
     */
    setupEventHandlers() {
        const pc = this.peerConnection;

        // ICE candidate event
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                logger.debug('New ICE candidate:', event.candidate.candidate);
                if (this.onIceCandidate) {
                    this.onIceCandidate(event.candidate);
                }
                globalEvents.emit('ice-candidate', event.candidate);
            }
        };

        // ICE connection state change
        pc.oniceconnectionstatechange = () => {
            logger.log(`ICE connection state: ${pc.iceConnectionState}`);
            globalEvents.emit('ice-state-change', pc.iceConnectionState);

            if (pc.iceConnectionState === 'failed') {
                logger.error('ICE connection failed, attempting restart');
                pc.restartIce();
            }
        };

        // Connection state change
        pc.onconnectionstatechange = () => {
            logger.log(`Connection state: ${pc.connectionState}`);
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(pc.connectionState);
            }
            globalEvents.emit('connection-state-change', pc.connectionState);

            if (pc.connectionState === 'connected') {
                logger.success('Peer connected!');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                logger.error(`Connection ${pc.connectionState}`);
            }
        };

        // Track event (remote media)
        pc.ontrack = (event) => {
            logger.log('Received remote track:', event.track.kind);

            event.streams[0].getTracks().forEach(track => {
                this.remoteStream.addTrack(track);
            });

            if (this.onTrack) {
                this.onTrack(event);
            }

            globalEvents.emit('remote-track', {
                track: event.track,
                stream: this.remoteStream
            });
        };

        // Negotiation needed
        pc.onnegotiationneeded = async () => {
            try {
                logger.log('Negotiation needed');
                this.makingOffer = true;

                await pc.setLocalDescription();
                logger.log('Created offer:', pc.localDescription.type);

                if (this.onNegotiationNeeded) {
                    this.onNegotiationNeeded(pc.localDescription);
                }

                globalEvents.emit('negotiation-needed', pc.localDescription);

            } catch (error) {
                logger.error('Error during negotiation:', error);
            } finally {
                this.makingOffer = false;
            }
        };

        // ICE gathering state
        pc.onicegatheringstatechange = () => {
            logger.debug(`ICE gathering state: ${pc.iceGatheringState}`);
        };

        // Signaling state
        pc.onsignalingstatechange = () => {
            logger.debug(`Signaling state: ${pc.signalingState}`);
        };
    }

    /**
     * Add local stream tracks to peer connection
     */
    addStream(stream) {
        if (!this.peerConnection) {
            logger.error('No peer connection to add stream to');
            return false;
        }

        try {
            stream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, stream);
                logger.log(`Added ${track.kind} track to peer connection`);
            });

            logger.success('Local stream added to peer connection');
            return true;

        } catch (error) {
            logger.error('Failed to add stream:', error);
            return false;
        }
    }

    /**
     * Handle incoming SDP offer
     */
    async handleOffer(offer) {
        try {
            logger.log('Handling offer...');

            const offerCollision = (this.peerConnection.signalingState !== 'stable') ||
                                  this.makingOffer;

            this.ignoreOffer = !this.polite && offerCollision;

            if (this.ignoreOffer) {
                logger.warn('Ignoring offer due to collision');
                return;
            }

            this.isSettingRemoteAnswerPending = true;

            await this.peerConnection.setRemoteDescription(offer);
            logger.log('Remote description (offer) set');

            await this.peerConnection.setLocalDescription();
            logger.log('Created answer');

            this.isSettingRemoteAnswerPending = false;

            globalEvents.emit('answer-created', this.peerConnection.localDescription);

            return this.peerConnection.localDescription;

        } catch (error) {
            logger.error('Error handling offer:', error);
            this.isSettingRemoteAnswerPending = false;
            throw error;
        }
    }

    /**
     * Handle incoming SDP answer
     */
    async handleAnswer(answer) {
        try {
            logger.log('Handling answer...');

            if (this.isSettingRemoteAnswerPending) {
                logger.warn('Already setting remote answer, skipping');
                return;
            }

            this.isSettingRemoteAnswerPending = true;

            await this.peerConnection.setRemoteDescription(answer);
            logger.success('Remote description (answer) set');

            this.isSettingRemoteAnswerPending = false;

        } catch (error) {
            logger.error('Error handling answer:', error);
            this.isSettingRemoteAnswerPending = false;
            throw error;
        }
    }

    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(candidate);
            logger.debug('ICE candidate added');

        } catch (error) {
            if (!this.ignoreOffer) {
                logger.error('Error adding ICE candidate:', error);
            }
        }
    }

    /**
     * Get remote stream
     */
    getRemoteStream() {
        return this.remoteStream;
    }

    /**
     * Get connection stats
     */
    async getStats() {
        if (!this.peerConnection) return null;

        try {
            const stats = await this.peerConnection.getStats();
            return stats;
        } catch (error) {
            logger.error('Failed to get stats:', error);
            return null;
        }
    }

    /**
     * Close peer connection
     */
    close() {
        if (!this.peerConnection) return;

        logger.log('Closing peer connection...');

        this.peerConnection.close();
        this.peerConnection = null;
        this.remoteStream = new MediaStream();

        logger.success('Peer connection closed');
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.peerConnection?.connectionState === 'connected';
    }
}

export default PeerConnectionManager;
