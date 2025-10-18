/**
 * Enhanced Features for AI Notetaker
 * Adds waveform visualization, bookmarks, enhanced speaker control
 */

class NotetakerEnhancedFeatures {
    constructor(notetaker) {
        this.notetaker = notetaker;
        this.bookmarks = new Set();
        this.highlights = new Set();
        this.waveformBars = [];
        this.audioAnalyzer = null;
        this.animationFrameId = null;
        this.exportFormat = 'txt';

        this.init();
    }

    init() {
        this.createEnhancedUI();
        this.setupAudioVisualization();
        this.attachEventListeners();
        console.log('[NOTETAKER-ENHANCED] ✅ Enhanced features initialized');
    }

    createEnhancedUI() {
        const container = this.notetaker.container || document.querySelector('.ai-notetaker');
        if (!container) {
            console.warn('[NOTETAKER-ENHANCED] Container not found');
            return;
        }

        // Add recording glow effect
        const glowDiv = document.createElement('div');
        glowDiv.className = 'recording-glow';
        container.appendChild(glowDiv);

        // Add quick actions toolbar
        const toolbar = document.createElement('div');
        toolbar.className = 'quick-actions-toolbar';
        toolbar.innerHTML = `
            <button class="quick-action-btn" id="toggleWaveform" title="Toggle Waveform">
                <span class="icon">📊</span>
                <span class="label">Waveform</span>
            </button>
            <button class="quick-action-btn" id="toggleSpeakerMode" title="Speaker Selection">
                <span class="icon">👥</span>
                <span class="label">Speakers</span>
            </button>
            <button class="quick-action-btn" id="toggleBookmarks" title="Bookmarks">
                <span class="icon">🔖</span>
                <span class="label">Bookmarks</span>
            </button>
            <button class="quick-action-btn" id="toggleExport" title="Export Options">
                <span class="icon">📥</span>
                <span class="label">Export</span>
            </button>
        `;

        // Insert after header
        const header = container.querySelector('.notetaker-header');
        if (header) {
            header.after(toolbar);
        }

        // Add waveform visualization
        const waveform = document.createElement('div');
        waveform.className = 'waveform-container';
        waveform.id = 'waveformContainer';
        waveform.innerHTML = `
            <div class="waveform-bars" id="waveformBars">
                ${Array(24).fill(0).map(() => '<div class="waveform-bar"></div>').join('')}
            </div>
        `;
        toolbar.after(waveform);

        // Add enhanced speaker selector
        const speakerSelector = document.createElement('div');
        speakerSelector.className = 'speaker-selector-enhanced';
        speakerSelector.id = 'speakerSelectorEnhanced';
        speakerSelector.innerHTML = `
            <div class="speaker-option selected" data-speaker="both">
                <div class="speaker-avatar">👥</div>
                <div class="speaker-name">Both</div>
                <div class="speaker-status">All participants</div>
            </div>
            <div class="speaker-option" data-speaker="me">
                <div class="speaker-avatar">🙋</div>
                <div class="speaker-name">Me</div>
                <div class="speaker-status">Host only</div>
            </div>
            <div class="speaker-option" data-speaker="partner">
                <div class="speaker-avatar">🤝</div>
                <div class="speaker-name">Partner</div>
                <div class="speaker-status">Guest only</div>
            </div>
        `;
        waveform.after(speakerSelector);

        // Add stats bar
        const statsBar = document.createElement('div');
        statsBar.className = 'stats-bar';
        statsBar.id = 'statsBar';
        statsBar.innerHTML = `
            <div class="stat-item">
                <div class="stat-value" id="statDuration">00:00</div>
                <div class="stat-label">Duration</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="statWords">0</div>
                <div class="stat-label">Words</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="statBookmarks">0</div>
                <div class="stat-label">Bookmarks</div>
            </div>
        `;
        speakerSelector.after(statsBar);

        // Add export options panel
        const exportPanel = document.createElement('div');
        exportPanel.className = 'export-options-panel';
        exportPanel.id = 'exportOptionsPanel';
        exportPanel.innerHTML = `
            <div class="export-format-options">
                <button class="export-format-btn selected" data-format="txt">TXT</button>
                <button class="export-format-btn" data-format="pdf">PDF</button>
                <button class="export-format-btn" data-format="docx">DOCX</button>
                <button class="export-format-btn" data-format="json">JSON</button>
            </div>
            <button class="export-action-btn" id="exportTranscriptBtn">
                Download Transcript
            </button>
        `;
        statsBar.after(exportPanel);

        // Cache references
        this.waveformBars = Array.from(document.querySelectorAll('.waveform-bar'));
        this.statsElements = {
            duration: document.getElementById('statDuration'),
            words: document.getElementById('statWords'),
            bookmarks: document.getElementById('statBookmarks')
        };
    }

    setupAudioVisualization() {
        // Will be initialized when recording starts
        this.visualizationReady = false;
    }

    initializeAudioAnalyzer(stream) {
        if (!stream) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.audioAnalyzer = this.audioContext.createAnalyser();
            this.audioAnalyzer.fftSize = 64;
            this.audioAnalyzer.smoothingTimeConstant = 0.8;

            const source = this.audioContext.createMediaStreamSource(stream);
            source.connect(this.audioAnalyzer);

            this.dataArray = new Uint8Array(this.audioAnalyzer.frequencyBinCount);
            this.visualizationReady = true;

            console.log('[NOTETAKER-ENHANCED] Audio analyzer initialized');
        } catch (error) {
            console.error('[NOTETAKER-ENHANCED] Failed to initialize audio analyzer:', error);
        }
    }

    startWaveformVisualization() {
        if (!this.visualizationReady || !this.audioAnalyzer) return;

        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);

            this.audioAnalyzer.getByteFrequencyData(this.dataArray);

            // Update waveform bars
            this.waveformBars.forEach((bar, index) => {
                const dataIndex = Math.floor((index / this.waveformBars.length) * this.dataArray.length);
                const value = this.dataArray[dataIndex] || 0;
                const height = Math.max(4, (value / 255) * 60);

                bar.style.height = `${height}px`;

                // Add active class to bars with high amplitude
                if (value > 150) {
                    bar.classList.add('active');
                } else {
                    bar.classList.remove('active');
                }
            });
        };

        animate();
    }

    stopWaveformVisualization() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Reset bars
        this.waveformBars.forEach(bar => {
            bar.style.height = '4px';
            bar.classList.remove('active');
        });
    }

    attachEventListeners() {
        // Toggle waveform
        const toggleWaveformBtn = document.getElementById('toggleWaveform');
        if (toggleWaveformBtn) {
            toggleWaveformBtn.addEventListener('click', () => {
                const container = document.getElementById('waveformContainer');
                if (container) {
                    const isActive = container.classList.toggle('active');
                    toggleWaveformBtn.classList.toggle('active', isActive);
                }
            });
        }

        // Toggle speaker mode
        const toggleSpeakerBtn = document.getElementById('toggleSpeakerMode');
        if (toggleSpeakerBtn) {
            toggleSpeakerBtn.addEventListener('click', () => {
                const selector = document.getElementById('speakerSelectorEnhanced');
                if (selector) {
                    const isVisible = selector.style.display !== 'none';
                    selector.style.display = isVisible ? 'none' : 'flex';
                    toggleSpeakerBtn.classList.toggle('active', !isVisible);
                }
            });
        }

        // Speaker options
        document.querySelectorAll('.speaker-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected from all
                document.querySelectorAll('.speaker-option').forEach(o => o.classList.remove('selected'));

                // Add selected to clicked
                option.classList.add('selected');

                // Update speaker filter
                const speaker = option.dataset.speaker;
                if (this.notetaker && this.notetaker.speakerFilter !== undefined) {
                    this.notetaker.speakerFilter = speaker;
                    console.log('[NOTETAKER-ENHANCED] Speaker filter:', speaker);
                }
            });
        });

        // Toggle export panel
        const toggleExportBtn = document.getElementById('toggleExport');
        if (toggleExportBtn) {
            toggleExportBtn.addEventListener('click', () => {
                const panel = document.getElementById('exportOptionsPanel');
                if (panel) {
                    const isActive = panel.classList.toggle('active');
                    toggleExportBtn.classList.toggle('active', isActive);
                }
            });
        }

        // Export format selection
        document.querySelectorAll('.export-format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.export-format-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.exportFormat = btn.dataset.format;
            });
        });

        // Export button
        const exportBtn = document.getElementById('exportTranscriptBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTranscript());
        }

        // Bookmark toggle
        const toggleBookmarksBtn = document.getElementById('toggleBookmarks');
        if (toggleBookmarksBtn) {
            toggleBookmarksBtn.addEventListener('click', () => {
                this.showBookmarksOnly = !this.showBookmarksOnly;
                toggleBookmarksBtn.classList.toggle('active', this.showBookmarksOnly);
                this.filterTranscriptByBookmarks();
            });
        }
    }

    addBookmark(entryId) {
        this.bookmarks.add(entryId);
        this.updateStats();

        const entry = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (entry) {
            entry.classList.add('bookmarked');
        }

        console.log('[NOTETAKER-ENHANCED] Bookmark added:', entryId);
    }

    removeBookmark(entryId) {
        this.bookmarks.delete(entryId);
        this.updateStats();

        const entry = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (entry) {
            entry.classList.remove('bookmarked');
        }
    }

    toggleBookmark(entryId) {
        if (this.bookmarks.has(entryId)) {
            this.removeBookmark(entryId);
        } else {
            this.addBookmark(entryId);
        }
    }

    highlightEntry(entryId) {
        const entry = document.querySelector(`[data-entry-id="${entryId}"]`);
        if (entry) {
            entry.classList.toggle('highlighted');

            if (entry.classList.contains('highlighted')) {
                this.highlights.add(entryId);
            } else {
                this.highlights.delete(entryId);
            }
        }
    }

    updateStats() {
        if (this.statsElements.bookmarks) {
            this.statsElements.bookmarks.textContent = this.bookmarks.size;
        }

        // Update words count if available
        if (this.notetaker && this.notetaker.wordCount !== undefined && this.statsElements.words) {
            this.statsElements.words.textContent = this.notetaker.wordCount;
        }
    }

    updateDuration(seconds) {
        if (!this.statsElements.duration) return;

        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.statsElements.duration.textContent =
            `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    filterTranscriptByBookmarks() {
        const entries = document.querySelectorAll('.transcript-entry');

        entries.forEach(entry => {
            if (this.showBookmarksOnly) {
                entry.style.display = entry.classList.contains('bookmarked') ? 'block' : 'none';
            } else {
                entry.style.display = 'block';
            }
        });
    }

    async exportTranscript() {
        if (!this.notetaker || !this.notetaker.conversationHistory) {
            console.warn('[NOTETAKER-ENHANCED] No transcript to export');
            return;
        }

        const transcript = this.notetaker.conversationHistory;
        const fileName = `transcript_${Date.now()}`;

        switch (this.exportFormat) {
            case 'txt':
                this.exportAsTXT(transcript, fileName);
                break;
            case 'json':
                this.exportAsJSON(transcript, fileName);
                break;
            case 'pdf':
                alert('PDF export coming soon!');
                break;
            case 'docx':
                alert('DOCX export coming soon!');
                break;
        }
    }

    exportAsTXT(transcript, fileName) {
        let text = `AI Notetaker Transcript\n`;
        text += `Generated: ${new Date().toLocaleString()}\n`;
        text += `Room ID: ${this.notetaker.roomID}\n`;
        text += `\n${'='.repeat(50)}\n\n`;

        transcript.forEach((entry, index) => {
            text += `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.speaker}:\n`;
            text += `${entry.text}\n\n`;

            if (this.bookmarks.has(entry.id)) {
                text += `🔖 BOOKMARKED\n\n`;
            }
        });

        const blob = new Blob([text], { type: 'text/plain' });
        this.downloadFile(blob, `${fileName}.txt`);
    }

    exportAsJSON(transcript, fileName) {
        const data = {
            metadata: {
                generatedAt: new Date().toISOString(),
                roomID: this.notetaker.roomID,
                language: this.notetaker.langSelect?.value || 'uk',
                bookmarks: Array.from(this.bookmarks),
                highlights: Array.from(this.highlights)
            },
            transcript: transcript
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `${fileName}.json`);
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[NOTETAKER-ENHANCED] Downloaded:', filename);
    }

    // Hook into notetaker recording lifecycle
    onRecordingStart(stream) {
        console.log('[NOTETAKER-ENHANCED] Recording started');
        this.initializeAudioAnalyzer(stream);
        this.startWaveformVisualization();

        // Show waveform by default
        const container = document.getElementById('waveformContainer');
        if (container) {
            container.classList.add('active');
        }
    }

    onRecordingStop() {
        console.log('[NOTETAKER-ENHANCED] Recording stopped');
        this.stopWaveformVisualization();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    cleanup() {
        this.stopWaveformVisualization();

        if (this.audioContext) {
            this.audioContext.close();
        }

        this.bookmarks.clear();
        this.highlights.clear();
    }
}

// Auto-initialize when notetaker is ready
window.addEventListener('load', () => {
    // Wait for notetaker to be initialized
    const checkNotetaker = setInterval(() => {
        if (window.aiNotetaker) {
            window.notetakerEnhanced = new NotetakerEnhancedFeatures(window.aiNotetaker);
            clearInterval(checkNotetaker);
        }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => clearInterval(checkNotetaker), 10000);
});

console.log('[NOTETAKER-ENHANCED] ✅ Enhanced features module loaded');
