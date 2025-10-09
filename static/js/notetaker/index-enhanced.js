/**
 * Enhanced Notetaker Main Module - Universal for 1-on-1 and Group Calls
 * @module notetaker/enhanced
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';
import { localStore } from '../core/storage.js';

import { NotetakerUIManager } from './ui-manager.js';
import { NotetakerAudioMixer } from './audio-mixer.js';
import { SpeechRecognitionManager } from './recognition.js';
import { TranscriptionManager } from './transcription.js';
import { EnhancedAIAnalyzer } from './ai-analyzer-enhanced.js';
import { PersistenceManager } from './persistence.js';
import { ParticipantSelector } from './participant-selector.js';
import { FullTranscriptViewer } from './full-transcript-viewer.js';
import { ColorSchemeEditor } from './color-scheme-editor.js';

const logger = new Logger('NOTETAKER:ENHANCED');

export class EnhancedNotetakerManager {
    constructor(roomID, isHost = false, isGroupCall = false) {
        this.roomID = roomID;
        this.isHost = isHost;
        this.isGroupCall = isGroupCall;

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
        this.participantSelector = null; // For group calls
        this.transcriptViewer = null;
        this.colorEditor = null;

        // Configuration
        this.config = {
            language: localStore.get('notetaker_language', 'en-US'),
            rolePreset: localStore.get('notetaker_role_preset', ''),
            autoSave: localStore.get('notetaker_auto_save', true),
            autoSaveInterval: 60000, // 1 minute
            useOpenAI: localStore.get('notetaker_use_openai', false),
            openAIKey: localStore.get('notetaker_openai_key', null),
            customColors: localStore.get('notetaker_color_scheme', null)
        };

        logger.log('Enhanced Notetaker Manager created', {
            roomID,
            isHost,
            isGroupCall,
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
            logger.log('🚀 Initializing Enhanced Notetaker...');

            // Initialize Color Editor (always available)
            this.colorEditor = new ColorSchemeEditor();

            // Initialize UI Manager
            this.ui = new NotetakerUIManager();

            // Initialize Participant Selector (for group calls)
            if (this.isGroupCall) {
                this.participantSelector = new ParticipantSelector();
                this.participantSelector.init();
                logger.log('Participant selector initialized');
            }

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

            // Initialize Enhanced AI Analyzer
            this.aiAnalyzer = new EnhancedAIAnalyzer({
                rolePreset: this.config.rolePreset,
                language: this.config.language,
                useOpenAI: this.config.useOpenAI,
                openAIKey: this.config.openAIKey,
                customColors: this.config.customColors
            });

            // Initialize Persistence Manager
            this.persistence = new PersistenceManager(this.roomID);

            // Initialize Full Transcript Viewer
            this.transcriptViewer = new FullTranscriptViewer();
            this.transcriptViewer.init();

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
                onCloseEditor: () => this.ui.hideEditor(),
                onViewFullTranscript: () => this.showFullTranscript(),
                onEditColors: () => this.editColorScheme(),
                onChangePreset: (presetId) => this.setRolePreset(presetId),
                onChangeLanguage: (lang) => this.setLanguage(lang)
            });

            // Set initial language and colors in UI
            this.ui.setLanguage(this.config.language);
            this.updateUIColors();

            this.isInitialized = true;

            logger.success('✅ Enhanced Notetaker initialized successfully');

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
        this.recognition.onResult = async (result) => {
            if (result.final && !this.isPaused) {
                await this.handleTranscriptionResult(result.final);
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

        // Participant selector events (group calls only)
        if (this.participantSelector) {
            globalEvents.on('participant-selector:selection-changed', () => {
                this.updateAudioMixing();
            });
        }

        // Color scheme events
        globalEvents.on('color-scheme:updated', (colors) => {
            this.config.customColors = colors;
            this.aiAnalyzer.setCustomColors(colors);
            this.updateUIColors();
            localStore.set('notetaker_color_scheme', colors);
        });

        logger.log('Event handlers setup complete');
    }

    /**
     * Handle transcription result from recognition with AI analysis
     */
    async handleTranscriptionResult(text) {
        if (!text || text.trim().length === 0) {
            return;
        }

        logger.debug('Transcription result:', text.substring(0, 50) + '...');

        // Determine speaker
        let speaker = 'Speaker';

        if (this.isGroupCall && this.participantSelector) {
            // In group calls, we need to identify speaker
            // This would be enhanced with voice recognition in production
            speaker = 'Unknown Speaker';
        } else {
            speaker = 'Speaker';
        }

        // Analyze text with AI (local + OpenAI if enabled)
        const analysis = await this.aiAnalyzer.analyze(text, speaker);

        // Add entry to transcription with analysis
        const entry = this.transcription.addEntry(text, speaker, {
            sentiment: analysis?.sentiment,
            aiComment: analysis?.aiComment || analysis?.openAIComment,
            keywords: analysis?.keywords,
            confidence: analysis?.confidence,
            categories: analysis?.categories,
            color: analysis?.color
        });

        logger.debug('Entry processed:', {
            id: entry.id,
            sentiment: entry.sentiment,
            hasComment: !!entry.aiComment,
            source: analysis?.source
        });
    }

    /**
     * Add participant (group calls only)
     */
    addParticipant(participantId, name, stream = null, isSelf = false) {
        if (!this.isGroupCall || !this.participantSelector) {
            logger.warn('Not a group call or participant selector not initialized');
            return;
        }

        this.participantSelector.addParticipant(participantId, name, stream, isSelf);

        logger.log(`Participant added: ${name} (${participantId})`);
    }

    /**
     * Remove participant (group calls only)
     */
    removeParticipant(participantId) {
        if (!this.isGroupCall || !this.participantSelector) {
            return;
        }

        this.participantSelector.removeParticipant(participantId);

        // Remove from audio mixer
        this.audioMixer.removeStream(participantId);

        logger.log(`Participant removed: ${participantId}`);
    }

    /**
     * Add audio stream
     */
    async addAudioStream(stream, streamKey, participantName = null) {
        if (!this.audioMixer) {
            logger.warn('Audio mixer not initialized');
            return;
        }

        try {
            // If group call, update participant stream
            if (this.isGroupCall && this.participantSelector) {
                this.participantSelector.updateParticipantStream(streamKey, stream);
            }

            // Only add to mixer if recording or if participant is selected (in group calls)
            const shouldAdd = !this.isGroupCall ||
                             (this.participantSelector && this.participantSelector.isSelected(streamKey));

            if (shouldAdd) {
                await this.audioMixer.addStream(stream, streamKey);
                logger.log(`Audio stream added: ${streamKey}`);

                // If recording, restart recognition with new mixed stream
                if (this.isRecording) {
                    await this.restartRecognitionWithMixedAudio();
                }
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
     * Update audio mixing based on participant selection (group calls)
     */
    async updateAudioMixing() {
        if (!this.isGroupCall || !this.participantSelector || !this.audioMixer) {
            return;
        }

        logger.log('Updating audio mixing based on participant selection...');

        // Get selected streams
        const selectedStreams = this.participantSelector.getSelectedStreams();

        // Clear current mixer
        this.audioMixer.cleanup();
        this.audioMixer = new NotetakerAudioMixer();

        // Add selected streams
        for (const { id, stream } of selectedStreams) {
            await this.audioMixer.addStream(stream, id);
        }

        logger.log(`Audio mixing updated: ${selectedStreams.length} streams`);

        // Restart recognition if recording
        if (this.isRecording) {
            await this.restartRecognitionWithMixedAudio();
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

            // In group calls, ensure at least one participant is selected
            if (this.isGroupCall && this.participantSelector) {
                const selectedCount = this.participantSelector.getSelectedCount();
                if (selectedCount === 0) {
                    logger.error('No participants selected');
                    this.ui.updateStatus('Please select participants to record', '#ef4444');
                    return;
                }

                // Update audio mixing with selected participants
                await this.updateAudioMixing();
            }

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

            // Show full transcript viewer with results
            const history = this.transcription.getHistory();
            if (history.length > 0) {
                const stats = this.transcription.getSessionStats();
                const colorScheme = this.aiAnalyzer.getColorScheme();

                // Show full transcript viewer
                setTimeout(() => {
                    this.transcriptViewer.show(
                        history,
                        stats,
                        this.config.rolePreset,
                        colorScheme
                    );
                }, 300);
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
     * Show full transcript viewer
     */
    showFullTranscript() {
        const history = this.transcription.getHistory();
        const stats = this.transcription.getSessionStats();
        const colorScheme = this.aiAnalyzer.getColorScheme();

        this.transcriptViewer.show(history, stats, this.config.rolePreset, colorScheme);
    }

    /**
     * Edit color scheme
     */
    editColorScheme() {
        const currentColors = this.aiAnalyzer.getColorScheme();
        this.colorEditor.show(currentColors);
    }

    /**
     * Update UI colors
     */
    updateUIColors() {
        const colorScheme = this.aiAnalyzer.getColorScheme();

        // Update CSS variables
        const root = document.documentElement;
        Object.entries(colorScheme).forEach(([sentiment, color]) => {
            root.style.setProperty(`--notetaker-color-${sentiment}`, color);
        });

        logger.log('UI colors updated');
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
            language: this.config.language,
            colorScheme: this.aiAnalyzer.getColorScheme(),
            isGroupCall: this.isGroupCall,
            participants: this.isGroupCall && this.participantSelector
                ? this.participantSelector.getAllParticipants()
                : []
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
        this.updateUIColors(); // Update colors for new preset

        logger.log(`Role preset changed to: ${rolePreset}`);

        globalEvents.emit('notetaker:role-preset-changed', rolePreset);
    }

    /**
     * Enable/disable OpenAI integration
     */
    setOpenAI(enabled, apiKey = null) {
        this.config.useOpenAI = enabled;

        if (apiKey) {
            this.config.openAIKey = apiKey;
            localStore.set('notetaker_openai_key', apiKey);
        }

        localStore.set('notetaker_use_openai', enabled);

        if (enabled && this.config.openAIKey) {
            this.aiAnalyzer.enableOpenAI(this.config.openAIKey);
        } else {
            this.aiAnalyzer.disableOpenAI();
        }

        logger.log(`OpenAI integration: ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Get current state
     */
    getState() {
        return {
            isRecording: this.isRecording,
            isPaused: this.isPaused,
            isInitialized: this.isInitialized,
            isGroupCall: this.isGroupCall,
            config: this.config,
            stats: this.transcription?.getSessionStats() || null,
            historyLength: this.transcription?.getHistory().length || 0,
            selectedParticipants: this.isGroupCall && this.participantSelector
                ? this.participantSelector.getSelectedCount()
                : 0
        };
    }

    /**
     * Get available role presets
     */
    getRolePresets() {
        return this.aiAnalyzer.getRolePresets();
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
export function createEnhancedNotetaker(roomID, isHost = false, isGroupCall = false) {
    return new EnhancedNotetakerManager(roomID, isHost, isGroupCall);
}

export default EnhancedNotetakerManager;
