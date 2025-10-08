/**
 * Speech Recognition Module - Handles browser speech-to-text
 * @module notetaker/recognition
 */

import { Logger } from '../core/logger.js';

const logger = new Logger('NOTETAKER:RECOGNITION');

export class SpeechRecognitionManager {
    constructor(config = {}) {
        this.recognition = null;
        this.isActive = false;
        this.lang = config.lang || 'en-US';
        this.continuous = config.continuous !== false;
        this.interimResults = config.interimResults !== false;

        // Callbacks
        this.onResult = config.onResult || null;
        this.onError = config.onError || null;
        this.onEnd = config.onEnd || null;

        this.initialize();
    }

    initialize() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            logger.warn('Speech Recognition not supported in this browser');
            return false;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = this.continuous;
        this.recognition.interimResults = this.interimResults;
        this.recognition.lang = this.lang;
        this.recognition.maxAlternatives = 1;

        // Prevent browser beeping sounds
        this.createSilentAudioContext();

        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onend = () => this.handleEnd();

        logger.success(`Speech Recognition initialized (lang: ${this.lang})`);
        return true;
    }

    createSilentAudioContext() {
        try {
            if (!window.silentAudioContext) {
                window.silentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = window.silentAudioContext.createOscillator();
                oscillator.connect(window.silentAudioContext.destination);
                oscillator.start(0);
                oscillator.stop(0.001);
            }
        } catch (e) {
            // Ignore if AudioContext not available
        }
    }

    handleResult(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }

        if (this.onResult) {
            this.onResult({
                final: finalTranscript.trim(),
                interim: interimTranscript,
                isFinal: !!finalTranscript
            });
        }
    }

    handleError(event) {
        // Suppress browser notification sounds
        event.stopPropagation();
        event.preventDefault();

        const criticalErrors = ['not-allowed', 'service-not-allowed', 'network'];

        if (criticalErrors.includes(event.error)) {
            logger.error(`Critical error: ${event.error}`);
            if (this.onError) {
                this.onError(event.error, true);
            }
        } else {
            // Silently ignore common errors
            logger.debug(`Non-critical error: ${event.error}`);
            if (this.onError) {
                this.onError(event.error, false);
            }
        }

        // Auto-restart on 'no-speech' error
        if (event.error === 'no-speech' && this.isActive) {
            setTimeout(() => {
                if (this.isActive) {
                    this.start(true);
                }
            }, 1000);
        }
    }

    handleEnd() {
        if (this.isActive) {
            setTimeout(() => {
                if (this.isActive) {
                    this.start(true);
                }
            }, 500);
        }

        if (this.onEnd) {
            this.onEnd();
        }
    }

    start(isRestart = false) {
        if (!this.recognition) {
            logger.error('Recognition not initialized');
            return false;
        }

        try {
            this.recognition.start();
            this.isActive = true;
            if (!isRestart) {
                logger.log('Recognition started');
            }
            return true;
        } catch (err) {
            // Silently ignore if already started
            if (!isRestart) {
                logger.warn('Failed to start recognition:', err.message);
            }
            return false;
        }
    }

    stop() {
        if (!this.recognition) return;

        this.isActive = false;

        try {
            this.recognition.stop();
            logger.log('Recognition stopped');
        } catch (err) {
            logger.warn('Failed to stop recognition:', err.message);
        }
    }

    setLanguage(lang) {
        this.lang = lang;
        if (this.recognition) {
            this.recognition.lang = lang;
            logger.log(`Language changed to: ${lang}`);
        }
    }

    isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }
}

export default SpeechRecognitionManager;
