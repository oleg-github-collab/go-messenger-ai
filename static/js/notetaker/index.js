/**
 * Notetaker Main Module - Orchestrates all notetaker functionality
 * @module notetaker
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';
import { localStore } from '../core/storage.js';

import { NotetakerUIManager } from './ui-manager.js';
import { NotetakerAudioMixer } from './audio-mixer.js';
import { SpeechRecognitionManager } from './recognition.js';
import { TranscriptionManager } from './transcription.js';
import { AIAnalyzer } from './ai-analysis.js';
import { PersistenceManager } from './persistence.js';

const logger = new Logger('NOTETAKER:MAIN');

export class NotetakerManager {
    constructor(roomID, isHost = false) {
        this.roomID = roomID;
        this.isHost = isHost;

        // State
        this.isRecording = false;
        this.isPaused = false;
        this.isInitialized = false;

        // Modules
        this.ui = null;
        this.audioMixer = null;
        this.recognition = null;
        this.transcription = null;
        this.aiAnalyzer = null;
        this.persistence = null;

        // Configuration
        this.config = {
            language: localStore.get('notetaker_language', 'en-US'),
            rolePreset: localStore.get('notetaker_role_preset', ''),
            autoSave: localStore.get('notetaker_auto_save', true),
            autoSaveInterval: 60000 // 1 minute
        };

        logger.log('Notetaker Manager created', {
            roomID,
            isHost,
            config: this.config
        });
    }

    /**
     * Initialize all notetaker modules
     */
    async initialize() {
        if (this.isInitialized) {
            logger.warn('Already initialized');
            return;
        }

        try {
            logger.log('🚀 Initializing Notetaker...');

            // Initialize UI Manager
            this.ui = new NotetakerUIManager();

            // Show panel only for host
            if (this.isHost) {
                this.ui.show();
            } else {
                this.ui.hide();
                logger.log('Not host - UI hidden');
            }

            // Initialize Audio Mixer
            this.audioMixer = new NotetakerAudioMixer();

            // Initialize Speech Recognition
            this.recognition = new SpeechRecognitionManager({
                lang: this.config.language,
                continuous: true,
                interimResults: true
            });

            // Initialize Transcription Manager
            this.transcription = new TranscriptionManager();

            // Initialize AI Analyzer
            this.aiAnalyzer = new AIAnalyzer({
                rolePreset: this.config.rolePreset,
                language: this.config.language
            });

            // Initialize Persistence Manager
            this.persistence = new PersistenceManager(this.roomID);

            // Setup event handlers
            this.setupEventHandlers();

            // Setup UI event listeners
            this.ui.setupEventListeners({
                onToggleRecording: () => this.toggleRecording(),
                onTogglePause: () => this.togglePause(),
                onClose: () => this.ui.collapse(),
                onReopen: () => this.ui.expand(),
                onMinimize: () => this.ui.toggleMinimize(),
                onCloseTranscript: () => this.ui.hideTranscriptPanel(),
                onSave: () => this.saveTranscript(),
                onDownload: () => this.downloadTranscript(),
                onCloseEditor: () => this.ui.hideEditor()
            });

            // Set initial language in UI
            this.ui.setLanguage(this.config.language);

            this.isInitialized = true;

            logger.success('✅ Notetaker initialized successfully');

            globalEvents.emit('notetaker:initialized');

        } catch (error) {
            logger.error('❌ Failed to initialize notetaker:', error);
            throw error;
        }
    }

    /**
     * Setup event handlers between modules
     */
    setupEventHandlers() {
        // Recognition events
        this.recognition.onResult = (result) => {
            if (result.final && !this.isPaused) {
                this.handleTranscriptionResult(result.final);
            }
        };

        this.recognition.onError = (error) => {
            logger.error('Recognition error:', error);
            this.ui.updateStatus('Recognition error', '#ef4444');
        };

        this.recognition.onEnd = () => {
            if (this.isRecording && !this.isPaused) {
                logger.log('Recognition ended unexpectedly, restarting...');
                this.recognition.start();
            }
        };

        // Transcription events
        globalEvents.on('transcription:entry-added', (entry) => {
            this.ui.addTranscriptEntry(entry);

            // Auto-save to localStorage as backup
            this.persistence.saveToLocalStorage(
                this.transcription.getHistory(),
                this.transcription.getSessionStats()
            );
        });

        globalEvents.on('transcription:stats-updated', (stats) => {
            this.ui.updateStats(
                stats.durationFormatted,
                stats.totalWords
            );
        });

        // Persistence events
        globalEvents.on('persistence:transcript-saved', (data) => {
            this.ui.showSaveNotification(data.transcriptId);
        });

        logger.log('Event handlers setup complete');
    }

    /**
     * Handle transcription result from recognition
     */
    handleTranscriptionResult(text) {
        if (!text || text.trim().length === 0) {
            return;
        }

        logger.debug('Transcription result:', text.substring(0, 50) + '...');

        // Analyze text with AI
        const analysis = this.aiAnalyzer.analyze(text);

        // Add entry to transcription
        const entry = this.transcription.addEntry(text, 'Speaker', {
            sentiment: analysis?.sentiment,
            aiComment: analysis?.aiComment,
            keywords: analysis?.keywords,
            confidence: analysis?.confidence
        });

        logger.debug('Entry processed:', {
            id: entry.id,
            sentiment: entry.sentiment,
            hasComment: !!entry.aiComment
        });
    }

    /**
     * Add audio stream to mixer
     */
    async addAudioStream(stream, streamKey) {
        if (!this.audioMixer) {
            logger.warn('Audio mixer not initialized');
            return;
        }

        try {
            await this.audioMixer.addStream(stream, streamKey);
            logger.log(`Audio stream added: ${streamKey}`);

            // If recording, restart recognition with new mixed stream
            if (this.isRecording) {
                await this.restartRecognitionWithMixedAudio();
            }

        } catch (error) {
            logger.error('Failed to add audio stream:', error);
        }
    }

    /**
     * Remove audio stream from mixer
     */
    removeAudioStream(streamKey) {
        if (!this.audioMixer) {
            return;
        }

        this.audioMixer.removeStream(streamKey);
        logger.log(`Audio stream removed: ${streamKey}`);

        // If recording, restart recognition
        if (this.isRecording) {
            this.restartRecognitionWithMixedAudio();
        }
    }

    /**
     * Restart recognition with current mixed audio
     */
    async restartRecognitionWithMixedAudio() {
        try {
            this.recognition.stop();

            const mixedStream = this.audioMixer.getStream();
            if (mixedStream) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay
                this.recognition.start();
            }

        } catch (error) {
            logger.error('Failed to restart recognition:', error);
        }
    }

    /**
     * Toggle recording on/off
     */
    async toggleRecording() {
        if (this.isRecording) {
            await this.stopRecording();
        } else {
            await this.startRecording();
        }
    }

    /**
     * Start recording
     */
    async startRecording() {
        if (this.isRecording) {
            logger.warn('Already recording');
            return;
        }

        try {
            logger.log('🎙️ Starting recording...');

            // Start transcription session
            this.transcription.startSession();

            // Start recognition
            this.recognition.start();

            // Update state
            this.isRecording = true;
            this.isPaused = false;

            // Update UI
            this.ui.setRecordingState(true);
            this.ui.showTranscriptPanel();
            this.ui.clearTranscript();

            // Enable auto-save if configured
            if (this.config.autoSave) {
                this.persistence.enableAutoSave(
                    () => this.transcription.getHistory(),
                    this.config.autoSaveInterval
                );
            }

            logger.success('✅ Recording started');

            globalEvents.emit('notetaker:recording-started');

        } catch (error) {
            logger.error('❌ Failed to start recording:', error);
            this.ui.updateStatus('Failed to start recording', '#ef4444');
        }
    }

    /**
     * Stop recording
     */
    async stopRecording() {
        if (!this.isRecording) {
            logger.warn('Not recording');
            return;
        }

        try {
            logger.log('⏹️ Stopping recording...');

            // Stop recognition
            this.recognition.stop();

            // End transcription session
            this.transcription.endSession();

            // Disable auto-save
            this.persistence.disableAutoSave();

            // Update state
            this.isRecording = false;
            this.isPaused = false;

            // Update UI
            this.ui.setRecordingState(false);

            // Show editor with transcript
            const history = this.transcription.getHistory();
            if (history.length > 0) {
                this.ui.populateEditor(history);
                this.ui.showEditor();
            }

            logger.success('✅ Recording stopped', {
                entries: history.length,
                words: this.transcription.totalWords
            });

            globalEvents.emit('notetaker:recording-stopped', {
                history,
                stats: this.transcription.getSessionStats()
            });

        } catch (error) {
            logger.error('❌ Failed to stop recording:', error);
        }
    }

    /**
     * Toggle pause/resume
     */
    togglePause() {
        if (this.isPaused) {
            this.resumeRecording();
        } else {
            this.pauseRecording();
        }
    }

    /**
     * Pause recording
     */
    pauseRecording() {
        if (!this.isRecording || this.isPaused) {
            return;
        }

        logger.log('⏸️ Pausing recording...');

        this.recognition.stop();
        this.isPaused = true;

        this.ui.setPausedState(true);

        globalEvents.emit('notetaker:paused');
    }

    /**
     * Resume recording
     */
    resumeRecording() {
        if (!this.isRecording || !this.isPaused) {
            return;
        }

        logger.log('▶️ Resuming recording...');

        this.recognition.start();
        this.isPaused = false;

        this.ui.setPausedState(false);

        globalEvents.emit('notetaker:resumed');
    }

    /**
     * Save transcript to server
     */
    async saveTranscript() {
        const history = this.transcription.getHistory();

        if (history.length === 0) {
            logger.warn('No transcript to save');
            return;
        }

        logger.log('💾 Saving transcript...');

        const stats = this.transcription.getSessionStats();
        const summary = this.transcription.getSummary();

        const result = await this.persistence.saveTranscript(history, {
            stats,
            summary,
            rolePreset: this.config.rolePreset,
            language: this.config.language
        });

        if (result.success) {
            logger.success('✅ Transcript saved successfully');
        } else {
            logger.error('❌ Failed to save transcript:', result.error);
            this.ui.updateStatus('Failed to save transcript', '#ef4444');
        }

        return result;
    }

    /**
     * Download transcript as markdown file
     */
    downloadTranscript() {
        const history = this.transcription.getHistory();

        if (history.length === 0) {
            logger.warn('No transcript to download');
            return;
        }

        logger.log('📥 Downloading transcript...');

        const markdown = this.transcription.formatForDownload();
        const result = this.persistence.downloadTranscript(markdown);

        if (result.success) {
            logger.success('✅ Transcript downloaded');
        } else {
            logger.error('❌ Failed to download transcript:', result.error);
        }

        return result;
    }

    /**
     * Change language
     */
    setLanguage(language) {
        this.config.language = language;
        localStore.set('notetaker_language', language);

        this.recognition.setLanguage(language);
        this.aiAnalyzer.setLanguage(language);
        this.ui.setLanguage(language);

        logger.log(`Language changed to: ${language}`);

        globalEvents.emit('notetaker:language-changed', language);
    }

    /**
     * Change role preset
     */
    setRolePreset(rolePreset) {
        this.config.rolePreset = rolePreset;
        localStore.set('notetaker_role_preset', rolePreset);

        this.aiAnalyzer.setRolePreset(rolePreset);

        logger.log(`Role preset changed to: ${rolePreset}`);

        globalEvents.emit('notetaker:role-preset-changed', rolePreset);
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            isInitialized: this.isInitialized,
            config: this.config,
            stats: this.transcription?.getSessionStats() || null,
            historyLength: this.transcription?.getHistory().length || 0
        };
    }

    /**
     * Cleanup - stop recording, cleanup modules
     */
    async cleanup() {
        logger.log('🧹 Cleaning up notetaker...');

        if (this.isRecording) {
            await this.stopRecording();
        }

        if (this.recognition) {
            this.recognition.stop();
        }

        if (this.audioMixer) {
            this.audioMixer.cleanup();
        }

        if (this.persistence) {
            this.persistence.cleanup();
        }

        if (this.transcription?.statsInterval) {
            clearInterval(this.transcription.statsInterval);
        }

        this.isInitialized = false;

        logger.log('✅ Notetaker cleanup complete');

        globalEvents.emit('notetaker:cleaned-up');
    }
}

// Export singleton instance factory
export function createNotetaker(roomID, isHost = false) {
    return new NotetakerManager(roomID, isHost);
}

export default NotetakerManager;
