/**
 * Notetaker Transcription Manager - Manages conversation history and transcript entries
 * @module notetaker/transcription
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';

const logger = new Logger('NOTETAKER:TRANSCRIPT');

export class TranscriptionManager {
    constructor() {
        // Conversation history
        this.conversationHistory = [];

        // Session metadata
        this.sessionStartTime = null;
        this.sessionDuration = 0;
        this.totalWords = 0;

        // Speaker tracking
        this.speakers = new Map(); // Map<speakerId, speakerName>
        this.currentSpeaker = null;

        // Stats update interval
        this.statsInterval = null;

        logger.log('Transcription Manager initialized');
    }

    /**
     * Start new transcription session
     */
    startSession() {
        this.sessionStartTime = Date.now();
        this.conversationHistory = [];
        this.totalWords = 0;
        this.speakers.clear();

        // Update stats every second
        this.statsInterval = setInterval(() => {
            this.updateSessionStats();
        }, 1000);

        logger.log('📝 Session started');
        globalEvents.emit('transcription:session-started');
    }

    /**
     * End transcription session
     */
    endSession() {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }

        this.sessionDuration = this.getSessionDuration();

        logger.log('📝 Session ended', {
            duration: this.formatDuration(this.sessionDuration),
            entries: this.conversationHistory.length,
            words: this.totalWords
        });

        globalEvents.emit('transcription:session-ended', {
            history: this.conversationHistory,
            duration: this.sessionDuration,
            wordCount: this.totalWords
        });
    }

    /**
     * Add transcript entry
     */
    addEntry(text, speaker = null, metadata = {}) {
        if (!text || text.trim().length === 0) {
            logger.warn('Attempted to add empty transcript entry');
            return null;
        }

        const entry = {
            id: this.generateEntryId(),
            timestamp: Date.now(),
            speaker: speaker || this.currentSpeaker || 'Unknown',
            text: text.trim(),
            wordCount: this.countWords(text),
            sentiment: metadata.sentiment || null,
            aiComment: metadata.aiComment || null,
            keywords: metadata.keywords || [],
            confidence: metadata.confidence || 1.0
        };

        this.conversationHistory.push(entry);
        this.totalWords += entry.wordCount;

        // Track speaker
        if (speaker) {
            this.addSpeaker(speaker);
        }

        logger.debug('Entry added:', {
            speaker: entry.speaker,
            words: entry.wordCount,
            text: entry.text.substring(0, 50) + '...'
        });

        globalEvents.emit('transcription:entry-added', entry);

        return entry;
    }

    /**
     * Update existing entry (for sentiment/AI analysis)
     */
    updateEntry(entryId, updates) {
        const entry = this.conversationHistory.find(e => e.id === entryId);

        if (!entry) {
            logger.warn(`Entry not found: ${entryId}`);
            return false;
        }

        Object.assign(entry, updates);

        logger.debug('Entry updated:', entryId, updates);
        globalEvents.emit('transcription:entry-updated', entry);

        return true;
    }

    /**
     * Add speaker to tracking
     */
    addSpeaker(speakerName) {
        if (!this.speakers.has(speakerName)) {
            this.speakers.set(speakerName, {
                name: speakerName,
                firstSeen: Date.now(),
                totalEntries: 0,
                totalWords: 0
            });
            logger.log(`New speaker: ${speakerName}`);
        }

        const speaker = this.speakers.get(speakerName);
        speaker.totalEntries++;
        speaker.totalWords += this.conversationHistory[this.conversationHistory.length - 1]?.wordCount || 0;
    }

    /**
     * Set current speaker
     */
    setCurrentSpeaker(speakerName) {
        this.currentSpeaker = speakerName;
        logger.log(`Current speaker set to: ${speakerName}`);
    }

    /**
     * Get conversation history
     */
    getHistory() {
        return [...this.conversationHistory];
    }

    /**
     * Get history filtered by speaker
     */
    getHistoryBySpeaker(speakerName) {
        return this.conversationHistory.filter(entry => entry.speaker === speakerName);
    }

    /**
     * Get history filtered by sentiment
     */
    getHistoryBySentiment(sentiment) {
        return this.conversationHistory.filter(entry => entry.sentiment === sentiment);
    }

    /**
     * Get speaker statistics
     */
    getSpeakerStats() {
        return Array.from(this.speakers.entries()).map(([name, data]) => ({
            name,
            ...data,
            percentage: ((data.totalWords / this.totalWords) * 100).toFixed(1)
        }));
    }

    /**
     * Get session statistics
     */
    getSessionStats() {
        return {
            duration: this.getSessionDuration(),
            durationFormatted: this.formatDuration(this.getSessionDuration()),
            totalEntries: this.conversationHistory.length,
            totalWords: this.totalWords,
            totalSpeakers: this.speakers.size,
            averageWordsPerEntry: this.conversationHistory.length > 0
                ? Math.round(this.totalWords / this.conversationHistory.length)
                : 0,
            startTime: this.sessionStartTime
        };
    }

    /**
     * Update session stats (called by interval)
     */
    updateSessionStats() {
        const stats = this.getSessionStats();
        globalEvents.emit('transcription:stats-updated', stats);
    }

    /**
     * Get session duration in seconds
     */
    getSessionDuration() {
        if (!this.sessionStartTime) return 0;
        return Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }

    /**
     * Format duration as HH:MM:SS
     */
    formatDuration(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Count words in text
     */
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Generate unique entry ID
     */
    generateEntryId() {
        return `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Format transcript for display
     */
    formatForDisplay() {
        return this.conversationHistory.map(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            return `[${time}] ${entry.speaker}: ${entry.text}`;
        }).join('\n');
    }

    /**
     * Format transcript for download (Markdown)
     */
    formatForDownload() {
        const stats = this.getSessionStats();
        const speakers = this.getSpeakerStats();

        let markdown = `# Transcript\n\n`;
        markdown += `**Date:** ${new Date().toLocaleString('uk-UA')}\n`;
        markdown += `**Duration:** ${stats.durationFormatted}\n`;
        markdown += `**Total Words:** ${stats.totalWords}\n`;
        markdown += `**Total Speakers:** ${stats.totalSpeakers}\n\n`;

        // Speaker breakdown
        if (speakers.length > 0) {
            markdown += `## Speaker Breakdown\n\n`;
            speakers.forEach(speaker => {
                markdown += `- **${speaker.name}**: ${speaker.totalWords} words (${speaker.percentage}%)\n`;
            });
            markdown += `\n`;
        }

        // Conversation
        markdown += `## Conversation\n\n`;
        this.conversationHistory.forEach(entry => {
            const time = new Date(entry.timestamp).toLocaleTimeString('uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            markdown += `**[${time}] ${entry.speaker}:**\n`;
            markdown += `${entry.text}\n`;

            if (entry.sentiment) {
                markdown += `*Sentiment: ${entry.sentiment}*\n`;
            }

            if (entry.aiComment) {
                markdown += `💡 *${entry.aiComment}*\n`;
            }

            markdown += `\n`;
        });

        return markdown;
    }

    /**
     * Format transcript for JSON export
     */
    formatForJSON() {
        return {
            meta: {
                exportDate: new Date().toISOString(),
                sessionStats: this.getSessionStats(),
                speakers: this.getSpeakerStats()
            },
            conversation: this.conversationHistory
        };
    }

    /**
     * Clear all transcript data
     */
    clear() {
        this.conversationHistory = [];
        this.totalWords = 0;
        this.speakers.clear();
        this.currentSpeaker = null;

        logger.log('Transcript cleared');
        globalEvents.emit('transcription:cleared');
    }

    /**
     * Search transcript
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.conversationHistory.filter(entry =>
            entry.text.toLowerCase().includes(lowerQuery) ||
            entry.speaker.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Get transcript summary
     */
    getSummary() {
        const stats = this.getSessionStats();
        const speakers = this.getSpeakerStats();

        // Get sentiment distribution
        const sentiments = {
            positive: 0,
            negative: 0,
            neutral: 0,
            question: 0,
            action: 0
        };

        this.conversationHistory.forEach(entry => {
            if (entry.sentiment && sentiments.hasOwnProperty(entry.sentiment)) {
                sentiments[entry.sentiment]++;
            }
        });

        return {
            stats,
            speakers,
            sentiments,
            totalEntries: this.conversationHistory.length,
            hasData: this.conversationHistory.length > 0
        };
    }
}

export default TranscriptionManager;
