// Full Transcript Viewer with Highlights and Export
// Shows complete meeting transcript with categories, highlights, and analysis

class TranscriptViewer {
    constructor() {
        this.transcriptData = [];
        this.highlights = [];
        this.categories = [];
        this.filter = 'all'; // all, highlights, category
        this.modal = null;

        console.log('[TRANSCRIPT-VIEWER] Initialized');
    }

    show(transcriptData = [], highlights = [], categories = []) {
        this.transcriptData = transcriptData;
        this.highlights = highlights;
        this.categories = categories;

        this.createModal();
        this.render();
    }

    createModal() {
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'transcript-viewer-modal';
        this.modal.innerHTML = `
            <div class="transcript-backdrop" id="transcriptBackdrop"></div>
            <div class="transcript-container">
                <div class="transcript-header">
                    <h2>📝 Meeting Transcript</h2>
                    <button class="transcript-close" id="transcriptClose">✕</button>
                </div>

                <div class="transcript-toolbar">
                    <div class="transcript-filters">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="highlights">Highlights</button>
                        <button class="filter-btn" data-filter="categories">Categories</button>
                    </div>

                    <div class="transcript-actions">
                        <button id="exportTxt" title="Export as TXT">💾 TXT</button>
                        <button id="exportPdf" title="Export as PDF">📄 PDF</button>
                        <button id="copyTranscript" title="Copy to Clipboard">📋 Copy</button>
                    </div>
                </div>

                <div class="transcript-stats">
                    <div class="stat"><strong id="totalWords">0</strong> <span>words</span></div>
                    <div class="stat"><strong id="totalEntries">0</strong> <span>entries</span></div>
                    <div class="stat"><strong id="totalHighlights">0</strong> <span>highlights</span></div>
                    <div class="stat"><strong id="totalDuration">0:00</strong> <span>duration</span></div>
                </div>

                <div class="transcript-content" id="transcriptContent">
                    <div class="transcript-loading">Loading transcript...</div>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Event listeners
        document.getElementById('transcriptClose').addEventListener('click', () => this.close());
        document.getElementById('transcriptBackdrop').addEventListener('click', () => this.close());
        document.getElementById('exportTxt').addEventListener('click', () => this.exportTXT());
        document.getElementById('exportPdf').addEventListener('click', () => this.exportPDF());
        document.getElementById('copyTranscript').addEventListener('click', () => this.copyToClipboard());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filter = btn.dataset.filter;
                this.render();
            });
        });

        this.injectStyles();
    }

    render() {
        const content = document.getElementById('transcriptContent');

        // Update stats
        document.getElementById('totalWords').textContent = this.countWords();
        document.getElementById('totalEntries').textContent = this.transcriptData.length;
        document.getElementById('totalHighlights').textContent = this.highlights.length;

        if (this.transcriptData.length === 0) {
            content.innerHTML = '<div class="transcript-empty">No transcript available yet</div>';
            return;
        }

        let filtered = this.transcriptData;

        if (this.filter === 'highlights') {
            filtered = this.transcriptData.filter(entry => entry.isHighlight);
        } else if (this.filter === 'categories' && this.categories.length > 0) {
            filtered = this.transcriptData.filter(entry => entry.category);
        }

        content.innerHTML = filtered.map((entry, index) => {
            const isHighlight = entry.isHighlight || this.highlights.some(h => h.text === entry.text);
            const categoryTag = entry.category ? `<span class="category-tag">${entry.category}</span>` : '';

            return `
                <div class="transcript-entry ${isHighlight ? 'highlight' : ''}">
                    <div class="entry-header">
                        <span class="entry-speaker">${entry.speaker || 'Unknown'}</span>
                        <span class="entry-time">${entry.timestamp || this.formatTime(index * 5)}</span>
                        ${categoryTag}
                    </div>
                    <div class="entry-text">${this.highlightKeywords(entry.text)}</div>
                </div>
            `;
        }).join('');
    }

    highlightKeywords(text) {
        const keywords = ['important', 'action', 'decision', 'todo', 'deadline', 'follow-up'];
        let result = text;

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            result = result.replace(regex, `<mark>$&</mark>`);
        });

        return result;
    }

    countWords() {
        return this.transcriptData.reduce((count, entry) => {
            return count + (entry.text || '').split(/\s+/).length;
        }, 0);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    exportTXT() {
        const text = this.transcriptData.map(entry => {
            return `[${entry.timestamp || ''}] ${entry.speaker || 'Unknown'}: ${entry.text}`;
        }).join('\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[TRANSCRIPT-VIEWER] Exported as TXT');
    }

    exportPDF() {
        alert('PDF export coming soon! Use TXT export for now.');
        // TODO: Implement PDF generation with jsPDF
    }

    async copyToClipboard() {
        const text = this.transcriptData.map(entry => {
            return `[${entry.timestamp || ''}] ${entry.speaker || 'Unknown'}: ${entry.text}`;
        }).join('\n\n');

        try {
            await navigator.clipboard.writeText(text);
            const btn = document.getElementById('copyTranscript');
            btn.textContent = '✅ Copied!';
            setTimeout(() => {
                btn.textContent = '📋 Copy';
            }, 2000);
        } catch (err) {
            console.error('[TRANSCRIPT-VIEWER] Failed to copy:', err);
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => {
                this.modal.remove();
                this.modal = null;
            }, 200);
        }
    }

    injectStyles() {
        if (document.getElementById('transcript-viewer-styles')) return;

        const style = document.createElement('style');
        style.id = 'transcript-viewer-styles';
        style.textContent = `
            .transcript-viewer-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 100000;
                animation: fadeIn 0.2s ease;
            }

            .transcript-backdrop {
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(10px);
            }

            .transcript-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 900px;
                max-height: 90vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .transcript-header {
                padding: 24px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .transcript-header h2 {
                margin: 0;
                color: white;
                font-size: 24px;
            }

            .transcript-close {
                width: 40px;
                height: 40px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .transcript-close:hover {
                background: rgba(255, 68, 68, 0.3);
                transform: scale(1.1);
            }

            .transcript-toolbar {
                padding: 16px 24px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255, 255, 255, 0.03);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .transcript-filters {
                display: flex;
                gap: 8px;
            }

            .filter-btn {
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.05);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 14px;
            }

            .filter-btn:hover,
            .filter-btn.active {
                background: rgba(102, 126, 234, 0.3);
                border-color: #667eea;
            }

            .transcript-actions {
                display: flex;
                gap: 8px;
            }

            .transcript-actions button {
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.05);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 13px;
            }

            .transcript-actions button:hover {
                background: rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
            }

            .transcript-stats {
                padding: 16px 24px;
                display: flex;
                gap: 24px;
                background: rgba(255, 255, 255, 0.02);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .transcript-stats .stat {
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
            }

            .transcript-stats .stat strong {
                color: #667eea;
                font-size: 18px;
                display: block;
                margin-bottom: 4px;
            }

            .transcript-content {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .transcript-entry {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                transition: all 0.2s;
            }

            .transcript-entry:hover {
                background: rgba(255, 255, 255, 0.08);
                transform: translateX(4px);
            }

            .transcript-entry.highlight {
                background: rgba(255, 215, 0, 0.1);
                border-color: rgba(255, 215, 0, 0.3);
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
            }

            .entry-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }

            .entry-speaker {
                color: #667eea;
                font-weight: 600;
                font-size: 14px;
            }

            .entry-time {
                color: rgba(255, 255, 255, 0.5);
                font-size: 12px;
            }

            .category-tag {
                padding: 4px 12px;
                background: rgba(102, 126, 234, 0.2);
                color: #667eea;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .entry-text {
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.6;
                font-size: 15px;
            }

            .entry-text mark {
                background: rgba(255, 215, 0, 0.3);
                color: #ffd700;
                padding: 2px 4px;
                border-radius: 3px;
            }

            .transcript-empty,
            .transcript-loading {
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 255, 255, 0.5);
                font-size: 16px;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @media (max-width: 768px) {
                .transcript-container {
                    width: 95%;
                    max-height: 95vh;
                }

                .transcript-toolbar {
                    flex-direction: column;
                    gap: 12px;
                }

                .transcript-stats {
                    flex-wrap: wrap;
                    gap: 12px;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize global instance
window.transcriptViewer = new TranscriptViewer();
console.log('[TRANSCRIPT-VIEWER] ✅ Transcript Viewer ready');
