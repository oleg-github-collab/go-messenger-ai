/**
 * Audio Mixer - Combines multiple audio streams for recording
 * @module notetaker/audio-mixer
 */

import { Logger } from '../core/logger.js';

const logger = new Logger('NOTETAKER:AUDIO');

export class NotetakerAudioMixer {
    constructor() {
        this.audioContext = null;
        this.destination = null;
        this.sources = new Map();
    }

    async init() {
        if (this.audioContext) return;

        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
            throw new Error('AudioContext not supported in this browser');
        }

        this.audioContext = new AudioContextCtor();
        this.destination = this.audioContext.createMediaStreamDestination();
        await this.audioContext.resume().catch(() => {});

        logger.success('Audio mixer initialized');
    }

    async addStream(stream, key = `stream_${Date.now()}`) {
        if (!stream || this.sources.has(key)) return;

        await this.init();

        try {
            const sourceNode = this.audioContext.createMediaStreamSource(stream);
            sourceNode.connect(this.destination);
            this.sources.set(key, { sourceNode, stream });
            logger.log(`Added stream: ${key}`);
        } catch (err) {
            logger.warn('Failed to add stream to mixer:', err);
        }
    }

    removeStream(key) {
        const entry = this.sources.get(key);
        if (!entry) return;

        try {
            entry.sourceNode.disconnect();
            logger.log(`Removed stream: ${key}`);
        } catch (err) {
            logger.warn('Failed to disconnect source node:', err);
        }

        this.sources.delete(key);
    }

    getStream() {
        return this.destination ? this.destination.stream : null;
    }

    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume().catch(() => {});
            logger.log('Audio context resumed');
        }
    }

    cleanup() {
        logger.log('Cleaning up audio mixer...');

        this.sources.forEach(({ sourceNode }, key) => {
            try {
                sourceNode.disconnect();
            } catch (err) {
                logger.warn(`Failed to disconnect source during cleanup: ${key}`, err);
            }
        });
        this.sources.clear();

        if (this.audioContext) {
            try {
                this.audioContext.close();
            } catch (err) {
                logger.warn('Failed to close audio context:', err);
            }
        }

        this.audioContext = null;
        this.destination = null;
        logger.success('Audio mixer cleaned up');
    }
}

export default NotetakerAudioMixer;
