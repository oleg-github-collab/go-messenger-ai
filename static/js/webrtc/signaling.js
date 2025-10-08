/**
 * WebSocket Signaling - Handles WebRTC signaling over WebSocket
 * @module webrtc/signaling
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';

const logger = new Logger('WEBRTC:SIGNALING');

export class SignalingManager {
    constructor(socket, roomID) {
        this.socket = socket;
        this.roomID = roomID;
        this.connected = false;

        this.setupSocketListeners();
    }

    /**
     * Setup WebSocket event listeners for signaling
     */
    setupSocketListeners() {
        if (!this.socket) {
            logger.error('No socket provided');
            return;
        }

        // WebRTC signaling messages
        this.socket.on('offer', (data) => {
            logger.log('Received offer from:', data.from);
            globalEvents.emit('webrtc:offer', data);
        });

        this.socket.on('answer', (data) => {
            logger.log('Received answer from:', data.from);
            globalEvents.emit('webrtc:answer', data);
        });

        this.socket.on('ice-candidate', (data) => {
            logger.debug('Received ICE candidate from:', data.from);
            globalEvents.emit('webrtc:ice-candidate', data);
        });

        // Room events
        this.socket.on('user-connected', (data) => {
            logger.log('User connected:', data.userID);
            globalEvents.emit('user-connected', data);
        });

        this.socket.on('user-disconnected', (data) => {
            logger.log('User disconnected:', data.userID);
            globalEvents.emit('user-disconnected', data);
        });

        // Connection status
        this.socket.on('connect', () => {
            logger.success('WebSocket connected');
            this.connected = true;
            globalEvents.emit('socket-connected');
        });

        this.socket.on('disconnect', (reason) => {
            logger.warn('WebSocket disconnected:', reason);
            this.connected = false;
            globalEvents.emit('socket-disconnected', reason);
        });

        this.socket.on('connect_error', (error) => {
            logger.error('WebSocket connection error:', error);
            globalEvents.emit('socket-error', error);
        });

        logger.log('Signaling listeners setup complete');
    }

    /**
     * Send SDP offer to peer
     */
    sendOffer(offer, targetUserID = null) {
        if (!this.connected) {
            logger.error('Cannot send offer: socket not connected');
            return false;
        }

        logger.log('Sending offer...');

        this.socket.emit('offer', {
            room: this.roomID,
            offer: offer,
            to: targetUserID
        });

        return true;
    }

    /**
     * Send SDP answer to peer
     */
    sendAnswer(answer, targetUserID = null) {
        if (!this.connected) {
            logger.error('Cannot send answer: socket not connected');
            return false;
        }

        logger.log('Sending answer...');

        this.socket.emit('answer', {
            room: this.roomID,
            answer: answer,
            to: targetUserID
        });

        return true;
    }

    /**
     * Send ICE candidate to peer
     */
    sendIceCandidate(candidate, targetUserID = null) {
        if (!this.connected) {
            logger.error('Cannot send ICE candidate: socket not connected');
            return false;
        }

        logger.debug('Sending ICE candidate...');

        this.socket.emit('ice-candidate', {
            room: this.roomID,
            candidate: candidate,
            to: targetUserID
        });

        return true;
    }

    /**
     * Join room
     */
    joinRoom() {
        if (!this.connected) {
            logger.error('Cannot join room: socket not connected');
            return false;
        }

        logger.log(`Joining room: ${this.roomID}`);

        this.socket.emit('join-room', {
            room: this.roomID
        });

        return true;
    }

    /**
     * Leave room
     */
    leaveRoom() {
        if (!this.connected) {
            logger.warn('Socket not connected, cannot leave room');
            return false;
        }

        logger.log(`Leaving room: ${this.roomID}`);

        this.socket.emit('leave-room', {
            room: this.roomID
        });

        return true;
    }

    /**
     * Send custom message
     */
    sendMessage(event, data) {
        if (!this.connected) {
            logger.error(`Cannot send ${event}: socket not connected`);
            return false;
        }

        logger.debug(`Sending ${event}:`, data);

        this.socket.emit(event, {
            room: this.roomID,
            ...data
        });

        return true;
    }

    /**
     * Check if socket is connected
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Get socket instance
     */
    getSocket() {
        return this.socket;
    }
}

export default SignalingManager;
