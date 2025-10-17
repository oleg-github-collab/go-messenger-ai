// Full-Screen Post-Call Transcript Viewer with Color Highlights
// Ultra-powerful scrollable interface for reviewing entire transcripts

class TranscriptViewer {
    constructor() {
        this.transcriptData = [];
        this.categories = new Map(); // category name -> color
        this.filterCategory = null;
        this.searchQuery = '';
        this.createUI();
    }

    createUI() {
        // Create full-screen modal overlay
        const modal = document.createElement('div');
        modal.id = 'transcriptViewerModal';
        modal.className = 'transcript-viewer-modal';
        modal.innerHTML = `
            <div class="transcript-viewer-container">
                <!-- Header -->
                <div class="transcript-viewer-header">
                    <div class="header-left">
                        <h2>📜 Complete Transcript</h2>
                        <span class="transcript-stats">
                            <span id="tvTotalEntries">0</span> entries •
                            <span id="tvTotalWords">0</span> words •
                            <span id="tvDuration">0:00</span>
                        </span>
                    </div>
                    <div class="header-actions">
                        <button id="tvExportBtn" class="tv-btn tv-btn-primary">
                            📥 Export
                        </button>
                        <button id="tvPrintBtn" class="tv-btn tv-btn-secondary">
                            🖨️ Print
                        </button>
                        <button id="tvCloseBtn" class="tv-btn tv-btn-close">
                            ✕
                        </button>
                    </div>
                </div>

                <!-- Controls Bar -->
                <div class="transcript-viewer-controls">
                    <div class="controls-left">
                        <!-- Search -->
                        <div class="tv-search-box">
                            <input
                                type="text"
                                id="tvSearchInput"
                                placeholder="🔍 Search transcript..."
                                autocomplete="off"
                            />
                            <span id="tvSearchResults" class="search-results-count"></span>
                        </div>

                        <!-- Category Filter -->
                        <select id="tvCategoryFilter" class="tv-select">
                            <option value="">All Categories</option>
                        </select>
                    </div>

                    <div class="controls-right">
                        <!-- View Mode -->
                        <div class="tv-view-mode">
                            <button id="tvViewCompact" class="tv-view-btn active" title="Compact View">
                                ☰ Compact
                            </button>
                            <button id="tvViewDetailed" class="tv-view-btn" title="Detailed View">
                                📄 Detailed
                            </button>
                            <button id="tvViewHighlightsOnly" class="tv-view-btn" title="Highlights Only">
                                ⭐ Highlights
                            </button>
                        </div>

                        <!-- Font Size -->
                        <div class="tv-font-controls">
                            <button id="tvFontDecrease" class="tv-icon-btn" title="Decrease font size">A-</button>
                            <span id="tvFontSize">16px</span>
                            <button id="tvFontIncrease" class="tv-icon-btn" title="Increase font size">A+</button>
                        </div>
                    </div>
                </div>

                <!-- Legend (Category Colors) -->
                <div class="transcript-viewer-legend" id="tvLegend">
                    <!-- Dynamically populated with category badges -->
                </div>

                <!-- Transcript Content (Scrollable) -->
                <div class="transcript-viewer-content" id="tvContent">
                    <div class="transcript-entries" id="tvEntries">
                        <!-- Transcript entries will be rendered here -->
                    </div>
                </div>

                <!-- Footer -->
                <div class="transcript-viewer-footer">
                    <div class="footer-info">
                        Showing <span id="tvVisibleEntries">0</span> of <span id="tvTotalEntriesFooter">0</span> entries
                    </div>
                    <div class="footer-actions">
                        <button id="tvScrollTop" class="tv-btn tv-btn-ghost">
                            ↑ Top
                        </button>
                        <button id="tvScrollBottom" class="tv-btn tv-btn-ghost">
                            ↓ Bottom
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Cache DOM elements
        this.modal = modal;
        this.content = document.getElementById('tvContent');
        this.entriesContainer = document.getElementById('tvEntries');
        this.searchInput = document.getElementById('tvSearchInput');
        this.categoryFilter = document.getElementById('tvCategoryFilter');
        this.legend = document.getElementById('tvLegend');

        this.initEventListeners();
    }

    initEventListeners() {
        // Close button
        document.getElementById('tvCloseBtn').addEventListener('click', () => this.close());

        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Export
        document.getElementById('tvExportBtn').addEventListener('click', () => this.export());

        // Print
        document.getElementById('tvPrintBtn').addEventListener('click', () => this.print());

        // Search
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.render();
        });

        // Category filter
        this.categoryFilter.addEventListener('change', (e) => {
            this.filterCategory = e.target.value || null;
            this.render();
        });

        // View mode buttons
        document.getElementById('tvViewCompact').addEventListener('click', () => this.setViewMode('compact'));
        document.getElementById('tvViewDetailed').addEventListener('click', () => this.setViewMode('detailed'));
        document.getElementById('tvViewHighlightsOnly').addEventListener('click', () => this.setViewMode('highlights'));

        // Font size
        document.getElementById('tvFontDecrease').addEventListener('click', () => this.changeFontSize(-2));
        document.getElementById('tvFontIncrease').addEventListener('click', () => this.changeFontSize(2));

        // Scroll buttons
        document.getElementById('tvScrollTop').addEventListener('click', () => this.scrollToTop());
        document.getElementById('tvScrollBottom').addEventListener('click', () => this.scrollToBottom());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('active')) return;

            if (e.key === 'Escape') {
                this.close();
            } else if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.searchInput.focus();
            } else if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.print();
            }
        });
    }

    open(transcriptData, categories) {
        console.log('[TRANSCRIPT-VIEWER] Opening with', transcriptData.length, 'entries');

        this.transcriptData = transcriptData || [];
        this.categories = new Map(Object.entries(categories || {}));

        // Populate category filter
        this.populateCategoryFilter();

        // Populate legend
        this.populateLegend();

        // Render transcript
        this.render();

        // Show modal
        this.modal.classList.add('active');

        // Focus search
        setTimeout(() => this.searchInput.focus(), 100);
    }

    close() {
        this.modal.classList.remove('active');
        this.searchQuery = '';
        this.filterCategory = null;
        this.searchInput.value = '';
        this.categoryFilter.value = '';
    }

    populateCategoryFilter() {
        // Clear existing options except first
        this.categoryFilter.innerHTML = '<option value="">All Categories</option>';

        // Add category options
        this.categories.forEach((color, categoryName) => {
            const option = document.createElement('option');
            option.value = categoryName;
            option.textContent = categoryName;
            this.categoryFilter.appendChild(option);
        });
    }

    populateLegend() {
        this.legend.innerHTML = '';

        if (this.categories.size === 0) {
            this.legend.style.display = 'none';
            return;
        }

        this.legend.style.display = 'flex';

        // Add "All" badge
        const allBadge = document.createElement('div');
        allBadge.className = 'legend-badge';
        allBadge.innerHTML = `<span class="legend-color" style="background: #888;"></span> All Categories (${this.transcriptData.length})`;
        this.legend.appendChild(allBadge);

        // Add category badges
        this.categories.forEach((color, categoryName) => {
            const count = this.transcriptData.filter(entry =>
                entry.categories && entry.categories.includes(categoryName)
            ).length;

            const badge = document.createElement('div');
            badge.className = 'legend-badge clickable';
            badge.innerHTML = `
                <span class="legend-color" style="background: ${color};"></span>
                ${categoryName} (${count})
            `;
            badge.addEventListener('click', () => {
                this.categoryFilter.value = categoryName;
                this.filterCategory = categoryName;
                this.render();
            });
            this.legend.appendChild(badge);
        });
    }

    render() {
        console.log('[TRANSCRIPT-VIEWER] Rendering transcript...');

        // Filter data
        let filteredData = this.transcriptData;

        // Apply category filter
        if (this.filterCategory) {
            filteredData = filteredData.filter(entry =>
                entry.categories && entry.categories.includes(this.filterCategory)
            );
        }

        // Apply search filter
        if (this.searchQuery) {
            filteredData = filteredData.filter(entry =>
                entry.text.toLowerCase().includes(this.searchQuery) ||
                entry.speaker.toLowerCase().includes(this.searchQuery)
            );

            document.getElementById('tvSearchResults').textContent =
                `${filteredData.length} result${filteredData.length !== 1 ? 's' : ''}`;
        } else {
            document.getElementById('tvSearchResults').textContent = '';
        }

        // Render entries
        this.entriesContainer.innerHTML = '';

        if (filteredData.length === 0) {
            this.entriesContainer.innerHTML = `
                <div class="tv-empty-state">
                    <div class="empty-icon">📭</div>
                    <div class="empty-text">No transcript entries found</div>
                </div>
            `;
        } else {
            filteredData.forEach((entry, index) => {
                this.entriesContainer.appendChild(this.createEntryElement(entry, index));
            });
        }

        // Update stats
        this.updateStats(filteredData);
    }

    createEntryElement(entry, index) {
        const div = document.createElement('div');
        div.className = 'tv-entry';

        // Add category classes for styling
        if (entry.categories && entry.categories.length > 0) {
            entry.categories.forEach(cat => {
                div.classList.add(`tv-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`);
            });
        }

        // Highlight search terms
        let displayText = entry.text;
        if (this.searchQuery) {
            const regex = new RegExp(`(${this.searchQuery})`, 'gi');
            displayText = entry.text.replace(regex, '<mark>$1</mark>');
        }

        // Build category badges
        let categoryBadges = '';
        if (entry.categories && entry.categories.length > 0) {
            categoryBadges = entry.categories.map(cat => {
                const color = this.categories.get(cat) || '#888';
                return `<span class="tv-category-badge" style="background: ${color};">${cat}</span>`;
            }).join('');
        }

        div.innerHTML = `
            <div class="tv-entry-header">
                <span class="tv-entry-index">#${index + 1}</span>
                <span class="tv-entry-speaker">${entry.speaker}</span>
                <span class="tv-entry-timestamp">${entry.timestamp || ''}</span>
            </div>
            <div class="tv-entry-text">${displayText}</div>
            ${categoryBadges ? `<div class="tv-entry-categories">${categoryBadges}</div>` : ''}
        `;

        return div;
    }

    updateStats(filteredData) {
        const totalEntries = this.transcriptData.length;
        const visibleEntries = filteredData.length;

        // Count words
        const totalWords = filteredData.reduce((sum, entry) =>
            sum + entry.text.split(/\s+/).length, 0
        );

        document.getElementById('tvTotalEntries').textContent = totalEntries;
        document.getElementById('tvTotalEntriesFooter').textContent = totalEntries;
        document.getElementById('tvVisibleEntries').textContent = visibleEntries;
        document.getElementById('tvTotalWords').textContent = totalWords;

        // Calculate duration (if timestamps available)
        if (filteredData.length > 0 && filteredData[0].timestamp) {
            // This would need proper timestamp parsing
            document.getElementById('tvDuration').textContent = 'N/A';
        }
    }

    setViewMode(mode) {
        // Remove active class from all view buttons
        document.querySelectorAll('.tv-view-btn').forEach(btn => btn.classList.remove('active'));

        // Add active class to selected button
        if (mode === 'compact') {
            document.getElementById('tvViewCompact').classList.add('active');
            this.entriesContainer.classList.remove('detailed', 'highlights-only');
        } else if (mode === 'detailed') {
            document.getElementById('tvViewDetailed').classList.add('active');
            this.entriesContainer.classList.add('detailed');
            this.entriesContainer.classList.remove('highlights-only');
        } else if (mode === 'highlights') {
            document.getElementById('tvViewHighlightsOnly').classList.add('active');
            this.entriesContainer.classList.add('highlights-only');
            this.entriesContainer.classList.remove('detailed');

            // Filter to show only highlighted (categorized) entries
            this.render();
        }
    }

    changeFontSize(delta) {
        const currentSize = parseInt(window.getComputedStyle(this.entriesContainer).fontSize);
        const newSize = Math.max(12, Math.min(24, currentSize + delta));
        this.entriesContainer.style.fontSize = newSize + 'px';
        document.getElementById('tvFontSize').textContent = newSize + 'px';
    }

    scrollToTop() {
        this.content.scrollTo({ top: 0, behavior: 'smooth' });
    }

    scrollToBottom() {
        this.content.scrollTo({ top: this.content.scrollHeight, behavior: 'smooth' });
    }

    export() {
        // Export as JSON, TXT, or HTML
        const exportMenu = document.createElement('div');
        exportMenu.className = 'tv-export-menu';
        exportMenu.innerHTML = `
            <button class="tv-export-option" data-format="json">JSON</button>
            <button class="tv-export-option" data-format="txt">Plain Text</button>
            <button class="tv-export-option" data-format="html">HTML</button>
            <button class="tv-export-option" data-format="markdown">Markdown</button>
        `;

        exportMenu.addEventListener('click', (e) => {
            if (e.target.classList.contains('tv-export-option')) {
                const format = e.target.dataset.format;
                this.exportAs(format);
                exportMenu.remove();
            }
        });

        document.getElementById('tvExportBtn').appendChild(exportMenu);

        // Close menu on outside click
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!exportMenu.contains(e.target)) {
                    exportMenu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    exportAs(format) {
        let content = '';
        let filename = `transcript-${new Date().toISOString().slice(0,10)}`;
        let mimeType = 'text/plain';

        if (format === 'json') {
            content = JSON.stringify(this.transcriptData, null, 2);
            filename += '.json';
            mimeType = 'application/json';
        } else if (format === 'txt') {
            content = this.transcriptData.map(entry =>
                `[${entry.timestamp || ''}] ${entry.speaker}: ${entry.text}`
            ).join('\n\n');
            filename += '.txt';
        } else if (format === 'html') {
            content = this.generateHTML();
            filename += '.html';
            mimeType = 'text/html';
        } else if (format === 'markdown') {
            content = this.generateMarkdown();
            filename += '.md';
        }

        // Download
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[TRANSCRIPT-VIEWER] Exported as', format);
    }

    generateHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Transcript Export</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { color: #333; }
        .entry { margin: 20px 0; padding: 15px; border-left: 3px solid #ddd; }
        .speaker { font-weight: bold; color: #0066cc; }
        .timestamp { color: #888; font-size: 0.9em; }
        .text { margin-top: 8px; line-height: 1.6; }
        .category { display: inline-block; padding: 2px 8px; margin: 4px 2px 0 0; border-radius: 3px; font-size: 0.85em; color: white; }
    </style>
</head>
<body>
    <h1>📜 Transcript Export</h1>
    <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Entries:</strong> ${this.transcriptData.length}</p>
    <hr>
    ${this.transcriptData.map((entry, i) => `
        <div class="entry">
            <div>
                <span class="speaker">${entry.speaker}</span>
                <span class="timestamp">${entry.timestamp || ''}</span>
            </div>
            <div class="text">${entry.text}</div>
            ${entry.categories ? entry.categories.map(cat =>
                `<span class="category" style="background: ${this.categories.get(cat) || '#888'};">${cat}</span>`
            ).join('') : ''}
        </div>
    `).join('')}
</body>
</html>`;
    }

    generateMarkdown() {
        let md = `# 📜 Transcript Export\n\n`;
        md += `**Date:** ${new Date().toLocaleString()}\n`;
        md += `**Entries:** ${this.transcriptData.length}\n\n`;
        md += `---\n\n`;

        this.transcriptData.forEach((entry, i) => {
            md += `### ${entry.speaker}\n`;
            if (entry.timestamp) md += `*${entry.timestamp}*\n\n`;
            md += `${entry.text}\n\n`;
            if (entry.categories && entry.categories.length > 0) {
                md += `🏷️ ${entry.categories.join(', ')}\n\n`;
            }
            md += `---\n\n`;
        });

        return md;
    }

    print() {
        window.print();
    }
}

// Global instance
let transcriptViewer = null;

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        transcriptViewer = new TranscriptViewer();
        console.log('[TRANSCRIPT-VIEWER] Initialized');
    });
} else {
    transcriptViewer = new TranscriptViewer();
    console.log('[TRANSCRIPT-VIEWER] Initialized');
}
