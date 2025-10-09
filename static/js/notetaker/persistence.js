/**
 * Notetaker Persistence - Save and load transcripts to/from server
 * @module notetaker/persistence
 */

import { Logger } from '../core/logger.js';
import { api } from '../core/api.js';
import { globalEvents } from '../core/events.js';

const logger = new Logger('NOTETAKER:PERSIST');

export class PersistenceManager {
    constructor(roomID) {
        this.roomID = roomID;
        this.currentTranscriptId = null;
        this.autoSaveEnabled = false;
        this.autoSaveInterval = null;
        this.autoSaveIntervalTime = 60000; // 1 minute

        logger.log('Persistence Manager initialized', { roomID });
    }

    /**
     * Save transcript to server
     */
    async saveTranscript(conversationHistory, metadata = {}) {
        try {
            logger.log('💾 Saving transcript...', {
                entries: conversationHistory.length,
                roomID: this.roomID
            });

            const payload = {
                room_id: this.roomID,
                conversation: conversationHistory,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    version: '2.0'
                }
            };

            const response = await api.post('/notetaker/save', payload);

            if (response.success) {
                this.currentTranscriptId = response.transcript_id;

                logger.success('✅ Transcript saved', {
                    id: response.transcript_id
                });

                globalEvents.emit('persistence:transcript-saved', {
                    transcriptId: response.transcript_id,
                    url: response.url
                });

                return {
                    success: true,
                    transcriptId: response.transcript_id,
                    url: response.url
                };
            } else {
                throw new Error(response.error || 'Failed to save transcript');
            }

        } catch (error) {
            logger.error('❌ Failed to save transcript:', error);

            globalEvents.emit('persistence:save-failed', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load transcript from server
     */
    async loadTranscript(transcriptId) {
        try {
            logger.log('📂 Loading transcript...', { transcriptId });

            const response = await api.get(`/notetaker/load/${transcriptId}`);

            if (response.success) {
                logger.success('✅ Transcript loaded', {
                    entries: response.conversation?.length || 0
                });

                globalEvents.emit('persistence:transcript-loaded', {
                    transcriptId,
                    conversation: response.conversation,
                    metadata: response.metadata
                });

                return {
                    success: true,
                    conversation: response.conversation || [],
                    metadata: response.metadata || {}
                };
            } else {
                throw new Error(response.error || 'Failed to load transcript');
            }

        } catch (error) {
            logger.error('❌ Failed to load transcript:', error);

            globalEvents.emit('persistence:load-failed', {
                error: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Delete transcript from server
     */
    async deleteTranscript(transcriptId) {
        try {
            logger.log('🗑️ Deleting transcript...', { transcriptId });

            const response = await api.delete(`/notetaker/delete/${transcriptId}`);

            if (response.success) {
                logger.success('✅ Transcript deleted');

                globalEvents.emit('persistence:transcript-deleted', { transcriptId });

                return { success: true };
            } else {
                throw new Error(response.error || 'Failed to delete transcript');
            }

        } catch (error) {
            logger.error('❌ Failed to delete transcript:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * List all transcripts for current room
     */
    async listTranscripts() {
        try {
            logger.log('📋 Listing transcripts for room...', { roomID: this.roomID });

            const response = await api.get(`/notetaker/list/${this.roomID}`);

            if (response.success) {
                logger.success('✅ Transcripts listed', {
                    count: response.transcripts?.length || 0
                });

                return {
                    success: true,
                    transcripts: response.transcripts || []
                };
            } else {
                throw new Error(response.error || 'Failed to list transcripts');
            }

        } catch (error) {
            logger.error('❌ Failed to list transcripts:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Download transcript as file
     */
    downloadTranscript(content, filename = null) {
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const defaultFilename = `transcript-${this.roomID}-${timestamp}.md`;

            const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename || defaultFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            logger.success('✅ Transcript downloaded', { filename: link.download });

            globalEvents.emit('persistence:transcript-downloaded', {
                filename: link.download
            });

            return { success: true };

        } catch (error) {
            logger.error('❌ Failed to download transcript:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export transcript to JSON file
     */
    downloadJSON(data, filename = null) {
        try {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const defaultFilename = `transcript-${this.roomID}-${timestamp}.json`;

            const content = JSON.stringify(data, null, 2);
            const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename || defaultFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            logger.success('✅ JSON downloaded', { filename: link.download });

            return { success: true };

        } catch (error) {
            logger.error('❌ Failed to download JSON:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Copy transcript to clipboard
     */
    async copyToClipboard(content) {
        try {
            await navigator.clipboard.writeText(content);

            logger.success('✅ Copied to clipboard');

            globalEvents.emit('persistence:copied-to-clipboard');

            return { success: true };

        } catch (error) {
            logger.error('❌ Failed to copy to clipboard:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Enable auto-save
     */
    enableAutoSave(conversationHistoryGetter, intervalTime = null) {
        if (this.autoSaveInterval) {
            this.disableAutoSave();
        }

        if (intervalTime) {
            this.autoSaveIntervalTime = intervalTime;
        }

        this.autoSaveEnabled = true;

        this.autoSaveInterval = setInterval(async () => {
            const history = conversationHistoryGetter();

            if (history && history.length > 0) {
                logger.log('⏰ Auto-saving transcript...');

                await this.saveTranscript(history, {
                    autoSave: true,
                    autoSaveTime: new Date().toISOString()
                });
            }
        }, this.autoSaveIntervalTime);

        logger.log('✅ Auto-save enabled', {
            interval: `${this.autoSaveIntervalTime / 1000}s`
        });

        globalEvents.emit('persistence:auto-save-enabled');
    }

    /**
     * Disable auto-save
     */
    disableAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }

        this.autoSaveEnabled = false;

        logger.log('Auto-save disabled');

        globalEvents.emit('persistence:auto-save-disabled');
    }

    /**
     * Check if auto-save is enabled
     */
    isAutoSaveEnabled() {
        return this.autoSaveEnabled;
    }

    /**
     * Get current transcript ID
     */
    getCurrentTranscriptId() {
        return this.currentTranscriptId;
    }

    /**
     * Set current transcript ID
     */
    setCurrentTranscriptId(transcriptId) {
        this.currentTranscriptId = transcriptId;
    }

    /**
     * Save to localStorage as backup
     */
    saveToLocalStorage(conversationHistory, metadata = {}) {
        try {
            const key = `notetaker_backup_${this.roomID}`;

            const data = {
                conversation: conversationHistory,
                metadata: {
                    ...metadata,
                    savedAt: new Date().toISOString(),
                    roomID: this.roomID
                }
            };

            localStorage.setItem(key, JSON.stringify(data));

            logger.debug('Saved to localStorage backup');

            return { success: true };

        } catch (error) {
            logger.error('Failed to save to localStorage:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load from localStorage backup
     */
    loadFromLocalStorage() {
        try {
            const key = `notetaker_backup_${this.roomID}`;
            const data = localStorage.getItem(key);

            if (!data) {
                return {
                    success: false,
                    error: 'No backup found'
                };
            }

            const parsed = JSON.parse(data);

            logger.log('✅ Loaded from localStorage backup', {
                entries: parsed.conversation?.length || 0
            });

            return {
                success: true,
                conversation: parsed.conversation || [],
                metadata: parsed.metadata || {}
            };

        } catch (error) {
            logger.error('Failed to load from localStorage:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clear localStorage backup
     */
    clearLocalStorageBackup() {
        try {
            const key = `notetaker_backup_${this.roomID}`;
            localStorage.removeItem(key);

            logger.log('localStorage backup cleared');

            return { success: true };

        } catch (error) {
            logger.error('Failed to clear localStorage:', error);

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Cleanup - stop auto-save, clear references
     */
    cleanup() {
        this.disableAutoSave();
        this.currentTranscriptId = null;

        logger.log('Persistence manager cleaned up');
    }
}

export default PersistenceManager;
