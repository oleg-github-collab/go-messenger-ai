/**
 * Notetaker UI Manager - Handles all UI interactions for AI Notetaker
 * @module notetaker/ui-manager
 */

import { Logger } from '../core/logger.js';
import { $ } from '../core/dom.js';

const logger = new Logger('NOTETAKER:UI');

export class NotetakerUIManager {
    constructor() {
        // Main UI elements
        this.container = $('#notetakerFloatingPanel');
        this.toggleBtn = $('#notetakerToggleBtn');
        this.pauseBtn = $('#notetakerPauseBtn');
        this.statusText = $('#notetakerStatus');
        this.closeBtn = $('#notetakerCloseBtn');
        this.reopenBtn = $('#reopenNotetakerBtn');

        // Transcript elements
        this.transcriptContent = $('#rtTranscriptContent');
        this.rtPanel = $('#realtimeTranscriptPanel');
        this.rtMinimizeBtn = $('#rtMinimizeBtn');
        this.rtCloseBtn = $('#rtCloseBtn');
        this.rtDuration = $('#rtDuration');
        this.rtWordCount = $('#rtWordCount');

        // Editor elements
        this.editorModal = $('#transcriptEditorModal');
        this.editorContent = $('#transcriptEditorContent');
        this.saveTranscriptBtn = $('#saveTranscriptBtn');
        this.downloadTranscriptBtn = $('#downloadTranscriptBtn');
        this.closeEditorBtn = $('#closeEditorBtn');
        this.saveNotification = $('#saveNotification');
        this.transcriptLink = $('#transcriptLink');

        // Language selector
        this.langSelect = $('#notetakerLangSelect');

        // State
        this.isMinimized = false;
        this.isPanelCollapsed = false;

        logger.log('UI Manager initialized');
    }

    /**
     * Show notetaker panel (only for host)
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            logger.log('Notetaker panel shown');
        }
    }

    /**
     * Hide notetaker panel
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            logger.log('Notetaker panel hidden');
        }
    }

    /**
     * Update status text
     */
    updateStatus(text, color = null) {
        if (this.statusText) {
            this.statusText.textContent = text;
            if (color) {
                this.statusText.style.color = color;
            }
        }
    }

    /**
     * Set recording state
     */
    setRecordingState(isRecording) {
        if (!this.toggleBtn) return;

        if (isRecording) {
            this.toggleBtn.classList.add('recording');
            this.toggleBtn.querySelector('.notetaker-text').textContent = 'Stop Recording';
            this.toggleBtn.querySelector('.notetaker-icon').textContent = '⏺️';
            this.updateStatus('Recording in progress...', '#ef4444');

            // Show pause button
            if (this.pauseBtn) {
                this.pauseBtn.style.display = 'inline-flex';
            }
        } else {
            this.toggleBtn.classList.remove('recording');
            this.toggleBtn.querySelector('.notetaker-text').textContent = 'Start Recording';
            this.toggleBtn.querySelector('.notetaker-icon').textContent = '🎙️';
            this.updateStatus('AI Assistant stopped', '#94a3b8');

            // Hide pause button
            if (this.pauseBtn) {
                this.pauseBtn.style.display = 'none';
            }
        }

        logger.log(`Recording state: ${isRecording}`);
    }

    /**
     * Set paused state
     */
    setPausedState(isPaused) {
        if (!this.pauseBtn) return;

        if (isPaused) {
            this.pauseBtn.querySelector('.notetaker-icon').textContent = '▶️';
            this.pauseBtn.querySelector('.notetaker-text').textContent = 'Resume';
            this.pauseBtn.classList.add('resumed');
            this.updateStatus('⏸️ Recording paused', '#f59e0b');
        } else {
            this.pauseBtn.querySelector('.notetaker-icon').textContent = '⏸️';
            this.pauseBtn.querySelector('.notetaker-text').textContent = 'Pause';
            this.pauseBtn.classList.remove('resumed');
            this.updateStatus('🎙️ Recording...', '#ef4444');
        }

        logger.log(`Paused state: ${isPaused}`);
    }

    /**
     * Show realtime transcript panel
     */
    showTranscriptPanel() {
        if (this.rtPanel) {
            this.rtPanel.classList.add('active');
            logger.log('Transcript panel shown');
        }
    }

    /**
     * Hide realtime transcript panel
     */
    hideTranscriptPanel() {
        if (this.rtPanel) {
            this.rtPanel.classList.remove('active');
            logger.log('Transcript panel hidden');
        }
    }

    /**
     * Add transcript entry to UI
     */
    addTranscriptEntry(entry) {
        if (!this.transcriptContent) return;

        const entryEl = this.createTranscriptEntry(entry);
        this.transcriptContent.appendChild(entryEl);

        // Auto-scroll to bottom
        this.transcriptContent.scrollTop = this.transcriptContent.scrollHeight;

        logger.debug('Transcript entry added');
    }

    /**
     * Create transcript entry element
     */
    createTranscriptEntry(entry) {
        const div = document.createElement('div');
        div.className = 'transcript-entry';

        // Apply sentiment highlighting
        if (entry.sentiment) {
            div.classList.add(`highlight-${entry.sentiment}`);
        }

        const time = new Date(entry.timestamp || Date.now()).toLocaleTimeString('uk-UA', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        div.innerHTML = `
            <div class="transcript-entry-time">${time}</div>
            <div class="transcript-entry-speaker">${this.escapeHtml(entry.speaker || 'Unknown')}</div>
            <div class="transcript-entry-text">${this.escapeHtml(entry.text)}</div>
            ${entry.aiComment ? `<div class="transcript-entry-ai-comment" data-comment="${this.escapeHtml(entry.aiComment)}">💡</div>` : ''}
            ${entry.sentiment ? `<span class="transcript-entry-ai-tag ${entry.sentiment}">${entry.sentiment}</span>` : ''}
        `;

        return div;
    }

    /**
     * Clear transcript entries
     */
    clearTranscript() {
        if (this.transcriptContent) {
            this.transcriptContent.innerHTML = '';
            logger.log('Transcript cleared');
        }
    }

    /**
     * Update stats (duration, word count)
     */
    updateStats(duration, wordCount) {
        if (this.rtDuration) {
            this.rtDuration.textContent = duration;
        }
        if (this.rtWordCount) {
            this.rtWordCount.textContent = wordCount.toString();
        }
    }

    /**
     * Show transcript editor modal
     */
    showEditor() {
        if (this.editorModal) {
            this.editorModal.classList.add('active');
            logger.log('Editor modal shown');
        }
    }

    /**
     * Hide transcript editor modal
     */
    hideEditor() {
        if (this.editorModal) {
            this.editorModal.classList.remove('active');
            logger.log('Editor modal hidden');
        }
    }

    /**
     * Populate editor with transcript
     */
    populateEditor(conversationHistory) {
        if (!this.editorContent) return;

        this.editorContent.innerHTML = '';

        conversationHistory.forEach((entry, index) => {
            const entryEl = this.createEditorEntry(entry, index);
            this.editorContent.appendChild(entryEl);
        });

        logger.log(`Editor populated with ${conversationHistory.length} entries`);
    }

    /**
     * Create editor entry element
     */
    createEditorEntry(entry, index) {
        const div = document.createElement('div');
        div.className = 'transcript-editor-entry';

        // Apply highlighting
        if (entry.sentiment) {
            div.classList.add(`highlight-${entry.sentiment}`);
        }

        div.innerHTML = `
            <div class="transcript-entry-speaker">${this.escapeHtml(entry.speaker || 'Unknown')}</div>
            <div class="transcript-entry-text">${this.escapeHtml(entry.text)}</div>
            ${entry.aiComment ? `<div class="transcript-entry-ai-comment" data-comment="${this.escapeHtml(entry.aiComment)}">💡</div>` : ''}
            ${entry.sentiment ? `<span class="transcript-entry-ai-tag ${entry.sentiment}">${entry.sentiment}</span>` : ''}
        `;

        return div;
    }

    /**
     * Show save notification
     */
    showSaveNotification(transcriptId) {
        if (this.saveNotification) {
            this.saveNotification.classList.add('active');

            if (this.transcriptLink) {
                this.transcriptLink.textContent = `Link: ${window.location.origin}/transcript/${transcriptId}`;
            }

            // Hide after 5 seconds
            setTimeout(() => {
                this.saveNotification.classList.remove('active');
            }, 5000);

            logger.success('Save notification shown');
        }
    }

    /**
     * Get selected language
     */
    getSelectedLanguage() {
        return this.langSelect ? this.langSelect.value : 'en-US';
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        if (this.langSelect) {
            this.langSelect.value = lang;
            logger.log(`Language set to: ${lang}`);
        }
    }

    /**
     * Toggle minimize state
     */
    toggleMinimize() {
        this.isMinimized = !this.isMinimized;

        if (this.rtPanel) {
            if (this.isMinimized) {
                this.rtPanel.classList.add('minimized');
            } else {
                this.rtPanel.classList.remove('minimized');
            }
        }

        logger.log(`Panel minimized: ${this.isMinimized}`);
    }

    /**
     * Collapse panel
     */
    collapse() {
        if (this.container) {
            this.container.style.display = 'none';
        }

        if (this.reopenBtn) {
            this.reopenBtn.style.display = 'flex';
        }

        this.isPanelCollapsed = true;
        logger.log('Panel collapsed');
    }

    /**
     * Expand panel
     */
    expand() {
        if (this.container) {
            this.container.style.display = 'block';
        }

        if (this.reopenBtn) {
            this.reopenBtn.style.display = 'none';
        }

        this.isPanelCollapsed = false;
        logger.log('Panel expanded');
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners(callbacks) {
        // Toggle recording
        if (this.toggleBtn && callbacks.onToggleRecording) {
            this.toggleBtn.addEventListener('click', callbacks.onToggleRecording);
        }

        // Pause/Resume
        if (this.pauseBtn && callbacks.onTogglePause) {
            this.pauseBtn.addEventListener('click', callbacks.onTogglePause);
        }

        // Close panel
        if (this.closeBtn && callbacks.onClose) {
            this.closeBtn.addEventListener('click', callbacks.onClose);
        }

        // Reopen panel
        if (this.reopenBtn && callbacks.onReopen) {
            this.reopenBtn.addEventListener('click', callbacks.onReopen);
        }

        // Minimize transcript panel
        if (this.rtMinimizeBtn && callbacks.onMinimize) {
            this.rtMinimizeBtn.addEventListener('click', callbacks.onMinimize);
        }

        // Close transcript panel
        if (this.rtCloseBtn && callbacks.onCloseTranscript) {
            this.rtCloseBtn.addEventListener('click', callbacks.onCloseTranscript);
        }

        // Editor buttons
        if (this.saveTranscriptBtn && callbacks.onSave) {
            this.saveTranscriptBtn.addEventListener('click', callbacks.onSave);
        }

        if (this.downloadTranscriptBtn && callbacks.onDownload) {
            this.downloadTranscriptBtn.addEventListener('click', callbacks.onDownload);
        }

        if (this.closeEditorBtn && callbacks.onCloseEditor) {
            this.closeEditorBtn.addEventListener('click', callbacks.onCloseEditor);
        }

        logger.success('Event listeners setup complete');
    }
}

export default NotetakerUIManager;
