/**
 * Full Transcript Viewer - Complete transcript view with AI insights and editing
 * @module notetaker/full-transcript-viewer
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';
import { api } from '../core/api.js';

const logger = new Logger('NOTETAKER:VIEWER');

export class FullTranscriptViewer {
    constructor() {
        // UI elements
        this.modal = null;
        this.contentArea = null;
        this.insightsPanel = null;
        this.toolbar = null;

        // State
        this.transcript = [];
        this.insights = null;
        this.editMode = false;
        this.rolePreset = '';
        this.colorScheme = {};

        logger.log('Full Transcript Viewer initialized');
    }

    /**
     * Initialize viewer
     */
    init() {
        this.createModal();
        this.setupEventListeners();

        logger.log('Viewer UI initialized');
    }

    /**
     * Create modal structure
     */
    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('fullTranscriptModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'fullTranscriptModal';
        modal.className = 'transcript-modal';
        modal.innerHTML = `
            <div class="transcript-modal-backdrop"></div>
            <div class="transcript-modal-container">
                <!-- Header -->
                <div class="transcript-modal-header">
                    <h2>📝 Full Transcript</h2>
                    <div class="transcript-header-actions">
                        <button class="transcript-btn" id="getInsightsBtn">
                            <span>🤖 Get AI Insights</span>
                        </button>
                        <button class="transcript-btn" id="editTranscriptBtn">
                            <span>✏️ Edit</span>
                        </button>
                        <button class="transcript-btn" id="saveTranscriptBtn">
                            <span>💾 Save</span>
                        </button>
                        <button class="transcript-btn" id="downloadTranscriptBtn">
                            <span>📥 Download</span>
                        </button>
                        <button class="transcript-btn-close" id="closeTranscriptBtn">✕</button>
                    </div>
                </div>

                <!-- Content Area -->
                <div class="transcript-modal-body">
                    <!-- Left: Transcript -->
                    <div class="transcript-content-area" id="transcriptContentArea">
                        <!-- Stats Bar -->
                        <div class="transcript-stats-bar">
                            <div class="stat-item">
                                <span class="stat-label">Duration:</span>
                                <span class="stat-value" id="transcriptDuration">--:--</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Words:</span>
                                <span class="stat-value" id="transcriptWordCount">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Speakers:</span>
                                <span class="stat-value" id="transcriptSpeakerCount">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Entries:</span>
                                <span class="stat-value" id="transcriptEntryCount">0</span>
                            </div>
                        </div>

                        <!-- Transcript Content -->
                        <div class="transcript-content" id="transcriptContent">
                            <div class="transcript-empty">
                                <p>No transcript available</p>
                            </div>
                        </div>
                    </div>

                    <!-- Right: AI Insights Panel -->
                    <div class="transcript-insights-panel" id="transcriptInsightsPanel">
                        <h3>🤖 AI Insights</h3>
                        <div class="insights-content" id="insightsContent">
                            <div class="insights-empty">
                                <p>Click "Get AI Insights" to analyze this transcript with AI</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Actions -->
                <div class="transcript-modal-footer">
                    <div class="footer-left">
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeTimestamps">
                            <span>Include timestamps in export</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeInsights" checked>
                            <span>Include AI insights</span>
                        </label>
                    </div>
                    <div class="footer-right">
                        <button class="transcript-btn secondary" id="copyTranscriptBtn">
                            📋 Copy to Clipboard
                        </button>
                        <button class="transcript-btn secondary" id="shareTranscriptBtn">
                            🔗 Get Share Link
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        this.modal = modal;
        this.contentArea = document.getElementById('transcriptContent');
        this.insightsPanel = document.getElementById('insightsContent');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close modal
        document.getElementById('closeTranscriptBtn')?.addEventListener('click', () => this.hide());
        this.modal.querySelector('.transcript-modal-backdrop')?.addEventListener('click', () => this.hide());

        // Get insights
        document.getElementById('getInsightsBtn')?.addEventListener('click', () => this.getAIInsights());

        // Edit mode
        document.getElementById('editTranscriptBtn')?.addEventListener('click', () => this.toggleEditMode());

        // Save
        document.getElementById('saveTranscriptBtn')?.addEventListener('click', () => this.saveTranscript());

        // Download
        document.getElementById('downloadTranscriptBtn')?.addEventListener('click', () => this.downloadTranscript());

        // Copy
        document.getElementById('copyTranscriptBtn')?.addEventListener('click', () => this.copyToClipboard());

        // Share link
        document.getElementById('shareTranscriptBtn')?.addEventListener('click', () => this.getShareLink());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.hide();
            }
        });
    }

    /**
     * Show modal with transcript
     */
    show(transcript, stats = {}, rolePreset = '', colorScheme = {}) {
        this.transcript = transcript || [];
        this.rolePreset = rolePreset;
        this.colorScheme = colorScheme;

        this.renderTranscript();
        this.renderStats(stats);

        this.modal.classList.add('show');

        logger.log('Showed transcript viewer', {
            entries: this.transcript.length,
            rolePreset
        });

        globalEvents.emit('transcript-viewer:shown');
    }

    /**
     * Hide modal
     */
    hide() {
        this.modal.classList.remove('show');
        this.editMode = false;

        logger.log('Hid transcript viewer');

        globalEvents.emit('transcript-viewer:hidden');
    }

    /**
     * Render transcript content
     */
    renderTranscript() {
        if (!this.contentArea) return;

        if (!this.transcript || this.transcript.length === 0) {
            this.contentArea.innerHTML = `
                <div class="transcript-empty">
                    <p>No transcript available</p>
                </div>
            `;
            return;
        }

        // Group by speaker for better readability
        const grouped = this.groupBySpeaker(this.transcript);

        this.contentArea.innerHTML = grouped.map(group => `
            <div class="transcript-group ${this.editMode ? 'editable' : ''}">
                <!-- Speaker Header -->
                <div class="transcript-speaker-header">
                    <div class="speaker-name">${this.escapeHtml(group.speaker)}</div>
                    <div class="speaker-stats">
                        ${group.entries.length} entries • ${group.totalWords} words
                    </div>
                </div>

                <!-- Entries -->
                <div class="transcript-entries">
                    ${group.entries.map(entry => this.renderEntry(entry)).join('')}
                </div>
            </div>
        `).join('');

        if (this.editMode) {
            this.attachEditListeners();
        }
    }

    /**
     * Render single entry
     */
    renderEntry(entry) {
        const color = this.colorScheme[entry.sentiment] || '#6b7280';
        const time = new Date(entry.timestamp).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `
            <div class="transcript-entry ${this.editMode ? 'editable' : ''}"
                 data-entry-id="${entry.id}"
                 data-sentiment="${entry.sentiment}">
                <!-- Time -->
                <div class="entry-time">${time}</div>

                <!-- Content -->
                <div class="entry-content"
                     style="border-left-color: ${color}">
                    <div class="entry-text ${this.editMode ? 'contenteditable' : ''}"
                         contenteditable="${this.editMode}">
                        ${this.escapeHtml(entry.text)}
                    </div>

                    <!-- Sentiment Badge -->
                    ${entry.sentiment !== 'neutral' ? `
                        <span class="entry-sentiment-badge"
                              style="background: ${color}">
                            ${this.getSentimentIcon(entry.sentiment)} ${entry.sentiment}
                        </span>
                    ` : ''}

                    <!-- AI Comment -->
                    ${entry.aiComment ? `
                        <div class="entry-ai-comment">
                            💡 ${this.escapeHtml(entry.aiComment)}
                        </div>
                    ` : ''}

                    <!-- Keywords -->
                    ${entry.keywords && entry.keywords.length > 0 ? `
                        <div class="entry-keywords">
                            ${entry.keywords.map(k => `
                                <span class="keyword-tag">${this.escapeHtml(k)}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Group entries by speaker
     */
    groupBySpeaker(entries) {
        const groups = [];
        let currentSpeaker = null;
        let currentGroup = null;

        entries.forEach(entry => {
            if (entry.speaker !== currentSpeaker) {
                if (currentGroup) {
                    groups.push(currentGroup);
                }

                currentGroup = {
                    speaker: entry.speaker,
                    entries: [],
                    totalWords: 0
                };

                currentSpeaker = entry.speaker;
            }

            currentGroup.entries.push(entry);
            currentGroup.totalWords += entry.wordCount || 0;
        });

        if (currentGroup) {
            groups.push(currentGroup);
        }

        return groups;
    }

    /**
     * Render stats
     */
    renderStats(stats) {
        document.getElementById('transcriptDuration').textContent = stats.durationFormatted || '--:--';
        document.getElementById('transcriptWordCount').textContent = stats.totalWords || 0;
        document.getElementById('transcriptSpeakerCount').textContent = stats.totalSpeakers || 0;
        document.getElementById('transcriptEntryCount').textContent = this.transcript.length;
    }

    /**
     * Get AI insights for transcript
     */
    async getAIInsights() {
        if (!this.transcript || this.transcript.length === 0) {
            logger.warn('No transcript to analyze');
            return;
        }

        logger.log('Getting AI insights...');

        this.insightsPanel.innerHTML = '<div class="insights-loading">🤖 Analyzing transcript...</div>';

        try {
            const response = await api.post('/api/openai/insights', {
                transcript: this.transcript,
                rolePreset: this.rolePreset
            });

            if (response.success && response.insights) {
                this.insights = response.insights;
                this.renderInsights(response.insights);

                logger.success('AI insights received');

                globalEvents.emit('transcript-viewer:insights-received', response.insights);
            } else {
                throw new Error(response.error || 'Failed to get insights');
            }

        } catch (error) {
            logger.error('Failed to get AI insights:', error);

            this.insightsPanel.innerHTML = `
                <div class="insights-error">
                    <p>❌ Failed to get AI insights</p>
                    <p class="error-details">${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * Render AI insights
     */
    renderInsights(insights) {
        this.insightsPanel.innerHTML = `
            <!-- Summary -->
            ${insights.summary ? `
                <div class="insight-section">
                    <h4>📋 Summary</h4>
                    <p>${this.escapeHtml(insights.summary)}</p>
                </div>
            ` : ''}

            <!-- Key Points -->
            ${insights.keyPoints && insights.keyPoints.length > 0 ? `
                <div class="insight-section">
                    <h4>💡 Key Points</h4>
                    <ul class="insights-list">
                        ${insights.keyPoints.map(point => `
                            <li>${this.escapeHtml(point)}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Action Items -->
            ${insights.actionItems && insights.actionItems.length > 0 ? `
                <div class="insight-section">
                    <h4>⚡ Action Items</h4>
                    <ul class="insights-list action-items">
                        ${insights.actionItems.map(item => `
                            <li>
                                <label class="action-checkbox">
                                    <input type="checkbox">
                                    <span>${this.escapeHtml(item)}</span>
                                </label>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Questions Raised -->
            ${insights.questions && insights.questions.length > 0 ? `
                <div class="insight-section">
                    <h4>❓ Questions Raised</h4>
                    <ul class="insights-list">
                        ${insights.questions.map(q => `
                            <li>${this.escapeHtml(q)}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Sentiment Analysis -->
            ${insights.overallSentiment ? `
                <div class="insight-section">
                    <h4>📊 Overall Sentiment</h4>
                    <div class="sentiment-breakdown">
                        <div class="sentiment-bar">
                            ${Object.entries(insights.sentimentDistribution || {}).map(([sentiment, percentage]) => `
                                <div class="sentiment-bar-segment"
                                     style="width: ${percentage}%;
                                            background: ${this.colorScheme[sentiment] || '#6b7280'}">
                                    <span>${sentiment}: ${percentage}%</span>
                                </div>
                            `).join('')}
                        </div>
                        <p class="sentiment-summary">${this.escapeHtml(insights.overallSentiment)}</p>
                    </div>
                </div>
            ` : ''}

            <!-- Recommendations -->
            ${insights.recommendations && insights.recommendations.length > 0 ? `
                <div class="insight-section">
                    <h4>💡 Recommendations</h4>
                    <ul class="insights-list">
                        ${insights.recommendations.map(rec => `
                            <li>${this.escapeHtml(rec)}</li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        this.editMode = !this.editMode;

        const btn = document.getElementById('editTranscriptBtn');

        if (this.editMode) {
            btn.innerHTML = '<span>✓ Done Editing</span>';
            btn.classList.add('active');
        } else {
            btn.innerHTML = '<span>✏️ Edit</span>';
            btn.classList.remove('active');
        }

        this.renderTranscript();

        logger.log(`Edit mode: ${this.editMode ? 'enabled' : 'disabled'}`);
    }

    /**
     * Attach edit listeners
     */
    attachEditListeners() {
        const editableElements = this.contentArea.querySelectorAll('.entry-text[contenteditable="true"]');

        editableElements.forEach(el => {
            el.addEventListener('blur', (e) => {
                const entryId = e.target.closest('.transcript-entry').dataset.entryId;
                const newText = e.target.textContent.trim();

                // Update transcript entry
                const entry = this.transcript.find(e => e.id === entryId);
                if (entry) {
                    entry.text = newText;
                    logger.log(`Updated entry ${entryId}`);
                }
            });
        });
    }

    /**
     * Save transcript to server
     */
    async saveTranscript() {
        logger.log('Saving transcript...');

        try {
            const response = await api.post('/api/notetaker/save', {
                transcript: this.transcript,
                insights: this.insights,
                rolePreset: this.rolePreset
            });

            if (response.success) {
                logger.success('Transcript saved');

                globalEvents.emit('transcript-viewer:saved', {
                    transcriptId: response.transcriptId,
                    url: response.url
                });

                this.showNotification('✓ Transcript saved successfully');
            } else {
                throw new Error(response.error || 'Save failed');
            }

        } catch (error) {
            logger.error('Save failed:', error);
            this.showNotification('❌ Failed to save transcript', 'error');
        }
    }

    /**
     * Download transcript
     */
    downloadTranscript() {
        const includeTimestamps = document.getElementById('includeTimestamps').checked;
        const includeInsights = document.getElementById('includeInsights').checked;

        let markdown = `# Transcript\n\n`;
        markdown += `**Date:** ${new Date().toLocaleString('uk-UA')}\n`;
        markdown += `**Role:** ${this.rolePreset || 'General'}\n\n`;

        // Transcript content
        this.transcript.forEach(entry => {
            if (includeTimestamps) {
                const time = new Date(entry.timestamp).toLocaleTimeString('uk-UA');
                markdown += `**[${time}] ${entry.speaker}:**\n`;
            } else {
                markdown += `**${entry.speaker}:**\n`;
            }

            markdown += `${entry.text}\n\n`;

            if (entry.aiComment) {
                markdown += `💡 *${entry.aiComment}*\n\n`;
            }
        });

        // Insights
        if (includeInsights && this.insights) {
            markdown += `\n---\n\n## 🤖 AI Insights\n\n`;

            if (this.insights.summary) {
                markdown += `### Summary\n${this.insights.summary}\n\n`;
            }

            if (this.insights.keyPoints && this.insights.keyPoints.length > 0) {
                markdown += `### Key Points\n`;
                this.insights.keyPoints.forEach(p => markdown += `- ${p}\n`);
                markdown += `\n`;
            }

            if (this.insights.actionItems && this.insights.actionItems.length > 0) {
                markdown += `### Action Items\n`;
                this.insights.actionItems.forEach(a => markdown += `- [ ] ${a}\n`);
                markdown += `\n`;
            }
        }

        // Download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `transcript-${Date.now()}.md`;
        link.click();
        URL.revokeObjectURL(url);

        logger.log('Transcript downloaded');

        this.showNotification('✓ Transcript downloaded');
    }

    /**
     * Copy to clipboard
     */
    async copyToClipboard() {
        const text = this.transcript.map(e => `${e.speaker}: ${e.text}`).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            logger.log('Copied to clipboard');
            this.showNotification('✓ Copied to clipboard');
        } catch (error) {
            logger.error('Copy failed:', error);
            this.showNotification('❌ Failed to copy', 'error');
        }
    }

    /**
     * Get share link
     */
    async getShareLink() {
        logger.log('Generating share link...');

        try {
            const response = await api.post('/api/notetaker/share', {
                transcript: this.transcript,
                insights: this.insights,
                rolePreset: this.rolePreset
            });

            if (response.success && response.shareUrl) {
                await navigator.clipboard.writeText(response.shareUrl);

                logger.success('Share link generated');

                this.showNotification(`✓ Share link copied: ${response.shareUrl}`);

                globalEvents.emit('transcript-viewer:share-link-created', {
                    url: response.shareUrl
                });
            } else {
                throw new Error(response.error || 'Failed to create share link');
            }

        } catch (error) {
            logger.error('Share link failed:', error);
            this.showNotification('❌ Failed to create share link', 'error');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `transcript-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Get sentiment icon
     */
    getSentimentIcon(sentiment) {
        const icons = {
            positive: '✓',
            negative: '✕',
            question: '?',
            action: '⚡',
            neutral: '•'
        };
        return icons[sentiment] || '•';
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Get current transcript
     */
    getTranscript() {
        return this.transcript;
    }

    /**
     * Get current insights
     */
    getInsights() {
        return this.insights;
    }
}

export default FullTranscriptViewer;
