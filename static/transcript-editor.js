// Advanced Transcript Viewer & Editor
class TranscriptEditor {
    constructor() {
        this.selectedFragments = new Set();
        this.allEntries = [];
        this.filterMode = 'all'; // 'all', 'selected', 'category'
        this.currentCategory = null;
        this.initUI();
    }

    initUI() {
        this.editorPanel = document.getElementById('transcriptEditorPanel');
        this.entriesList = document.getElementById('transcriptEntriesList');
        this.selectionInfo = document.getElementById('selectionInfo');

        // Toolbar buttons
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.deselectAllBtn = document.getElementById('deselectAllBtn');
        this.exportSelectedBtn = document.getElementById('exportSelectedBtn');
        this.copySelectedBtn = document.getElementById('copySelectedBtn');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

        // Filter buttons
        this.filterAllBtn = document.getElementById('filterAllBtn');
        this.filterSelectedBtn = document.getElementById('filterSelectedBtn');
        this.categoryFilterSelect = document.getElementById('categoryFilterSelect');

        // Search
        this.searchInput = document.getElementById('transcriptSearchInput');

        this.initEventListeners();
    }

    initEventListeners() {
        // Toolbar actions
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => this.selectAll());
        }
        if (this.deselectAllBtn) {
            this.deselectAllBtn.addEventListener('click', () => this.deselectAll());
        }
        if (this.exportSelectedBtn) {
            this.exportSelectedBtn.addEventListener('click', () => this.exportSelected());
        }
        if (this.copySelectedBtn) {
            this.copySelectedBtn.addEventListener('click', () => this.copySelected());
        }
        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.addEventListener('click', () => this.deleteSelected());
        }

        // Filters
        if (this.filterAllBtn) {
            this.filterAllBtn.addEventListener('click', () => this.setFilter('all'));
        }
        if (this.filterSelectedBtn) {
            this.filterSelectedBtn.addEventListener('click', () => this.setFilter('selected'));
        }
        if (this.categoryFilterSelect) {
            this.categoryFilterSelect.addEventListener('change', (e) => this.filterByCategory(e.target.value));
        }

        // Search
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.search(e.target.value));
        }
    }

    syncFromRealtime() {
        // Sync all entries from real-time transcript panel
        const rtEntries = document.querySelectorAll('.rt-transcript-entry');
        this.allEntries = [];

        rtEntries.forEach((entry, index) => {
            const speaker = entry.querySelector('.rt-speaker')?.textContent || 'Unknown';
            const text = entry.querySelector('.rt-text')?.textContent || '';
            const timestamp = entry.querySelector('.rt-timestamp')?.textContent || '';
            const categoryBadge = entry.querySelector('.rt-category-badge');
            const category = categoryBadge?.textContent || null;
            const categoryColor = categoryBadge?.style.color || null;

            // Get all category classes
            const categories = [];
            entry.classList.forEach(cls => {
                if (cls.startsWith('cat-')) {
                    categories.push(cls.replace('cat-', ''));
                }
            });

            this.allEntries.push({
                id: `entry-${index}`,
                speaker,
                text,
                timestamp,
                category,
                categoryColor,
                categories,
                selected: this.selectedFragments.has(`entry-${index}`),
                element: entry
            });
        });

        this.renderEntries();
        this.updateSelectionInfo();
        this.updateCategoryFilter();
    }

    renderEntries() {
        if (!this.entriesList) return;

        const filteredEntries = this.getFilteredEntries();
        this.entriesList.innerHTML = '';

        if (filteredEntries.length === 0) {
            this.entriesList.innerHTML = '<div class="editor-empty-state">No entries match your filter</div>';
            return;
        }

        filteredEntries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = `editor-entry ${entry.selected ? 'selected' : ''}`;
            entryEl.dataset.entryId = entry.id;

            entryEl.innerHTML = `
                <div class="editor-entry-checkbox">
                    <input type="checkbox" ${entry.selected ? 'checked' : ''} data-entry-id="${entry.id}">
                </div>
                <div class="editor-entry-content">
                    <div class="editor-entry-header">
                        <span class="editor-speaker">${entry.speaker}</span>
                        <span class="editor-timestamp">${entry.timestamp}</span>
                        ${entry.category ? `<span class="editor-category-badge" style="color: ${entry.categoryColor};">${entry.category}</span>` : ''}
                    </div>
                    <div class="editor-entry-text" contenteditable="true">${entry.text}</div>
                </div>
                <div class="editor-entry-actions">
                    <button class="editor-action-btn" data-action="edit" data-entry-id="${entry.id}" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="editor-action-btn" data-action="delete" data-entry-id="${entry.id}" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;

            // Checkbox handler
            const checkbox = entryEl.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', (e) => {
                this.toggleSelection(entry.id, e.target.checked);
            });

            // Text editing handler
            const textEl = entryEl.querySelector('.editor-entry-text');
            textEl.addEventListener('blur', () => {
                entry.text = textEl.textContent;
                this.updateOriginalEntry(entry.id, textEl.textContent);
            });

            // Action buttons
            const editBtn = entryEl.querySelector('[data-action="edit"]');
            editBtn.addEventListener('click', () => {
                textEl.focus();
            });

            const deleteBtn = entryEl.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', () => {
                this.deleteEntry(entry.id);
            });

            this.entriesList.appendChild(entryEl);
        });
    }

    getFilteredEntries() {
        let filtered = [...this.allEntries];

        // Apply filter mode
        if (this.filterMode === 'selected') {
            filtered = filtered.filter(e => e.selected);
        } else if (this.filterMode === 'category' && this.currentCategory) {
            filtered = filtered.filter(e => e.categories.includes(this.currentCategory));
        }

        // Apply search
        if (this.searchInput && this.searchInput.value) {
            const query = this.searchInput.value.toLowerCase();
            filtered = filtered.filter(e =>
                e.text.toLowerCase().includes(query) ||
                e.speaker.toLowerCase().includes(query)
            );
        }

        return filtered;
    }

    toggleSelection(entryId, selected) {
        if (selected) {
            this.selectedFragments.add(entryId);
        } else {
            this.selectedFragments.delete(entryId);
        }

        const entry = this.allEntries.find(e => e.id === entryId);
        if (entry) {
            entry.selected = selected;
        }

        this.updateSelectionInfo();
        this.renderEntries();
    }

    selectAll() {
        const filteredEntries = this.getFilteredEntries();
        filteredEntries.forEach(entry => {
            this.selectedFragments.add(entry.id);
            entry.selected = true;
        });
        this.updateSelectionInfo();
        this.renderEntries();
    }

    deselectAll() {
        this.selectedFragments.clear();
        this.allEntries.forEach(entry => {
            entry.selected = false;
        });
        this.updateSelectionInfo();
        this.renderEntries();
    }

    updateSelectionInfo() {
        if (!this.selectionInfo) return;

        const count = this.selectedFragments.size;
        const total = this.allEntries.length;

        if (count === 0) {
            this.selectionInfo.innerHTML = `<span class="selection-count">No items selected</span>`;
        } else {
            this.selectionInfo.innerHTML = `
                <span class="selection-count">${count} of ${total} selected</span>
                <span class="selection-words">(~${this.countWords()} words)</span>
            `;
        }
    }

    countWords() {
        let total = 0;
        this.allEntries.forEach(entry => {
            if (entry.selected) {
                total += entry.text.split(/\s+/).length;
            }
        });
        return total;
    }

    setFilter(mode) {
        this.filterMode = mode;

        // Update UI
        if (this.filterAllBtn) this.filterAllBtn.classList.toggle('active', mode === 'all');
        if (this.filterSelectedBtn) this.filterSelectedBtn.classList.toggle('active', mode === 'selected');

        this.renderEntries();
    }

    filterByCategory(categoryId) {
        if (categoryId === 'all') {
            this.filterMode = 'all';
            this.currentCategory = null;
        } else {
            this.filterMode = 'category';
            this.currentCategory = categoryId;
        }
        this.renderEntries();
    }

    updateCategoryFilter() {
        if (!this.categoryFilterSelect) return;

        // Get unique categories from entries
        const categories = new Set();
        this.allEntries.forEach(entry => {
            entry.categories.forEach(cat => categories.add(cat));
        });

        // Build select options
        let options = '<option value="all">All Categories</option>';

        if (meetingConfig) {
            const enabledCategories = meetingConfig.getEnabledCategories();
            enabledCategories.forEach(cat => {
                if (categories.has(cat.id)) {
                    options += `<option value="${cat.id}">${cat.name}</option>`;
                }
            });
        }

        this.categoryFilterSelect.innerHTML = options;
    }

    search(query) {
        this.renderEntries();
    }

    exportSelected() {
        const selected = this.allEntries.filter(e => e.selected);
        if (selected.length === 0) {
            alert('No items selected');
            return;
        }

        // Format as text
        let text = '# Meeting Transcript (Selected Fragments)\n\n';
        text += `Generated: ${new Date().toLocaleString()}\n`;
        text += `Total fragments: ${selected.length}\n\n`;
        text += '---\n\n';

        selected.forEach((entry, index) => {
            text += `## Fragment ${index + 1}\n`;
            text += `**${entry.speaker}** (${entry.timestamp})`;
            if (entry.category) {
                text += ` [${entry.category}]`;
            }
            text += `\n\n${entry.text}\n\n---\n\n`;
        });

        // Download as file
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-selected-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('[TRANSCRIPT EDITOR] Exported', selected.length, 'fragments');
    }

    copySelected() {
        const selected = this.allEntries.filter(e => e.selected);
        if (selected.length === 0) {
            alert('No items selected');
            return;
        }

        let text = '';
        selected.forEach(entry => {
            text += `${entry.speaker}: ${entry.text}\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            if (this.copySelectedBtn) {
                const originalText = this.copySelectedBtn.innerHTML;
                this.copySelectedBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg> Copied!';
                setTimeout(() => {
                    this.copySelectedBtn.innerHTML = originalText;
                }, 2000);
            }
            console.log('[TRANSCRIPT EDITOR] Copied', selected.length, 'fragments');
        });
    }

    deleteSelected() {
        const selected = this.allEntries.filter(e => e.selected);
        if (selected.length === 0) {
            alert('No items selected');
            return;
        }

        if (!confirm(`Delete ${selected.length} selected fragments?`)) {
            return;
        }

        // Remove from real-time transcript
        selected.forEach(entry => {
            if (entry.element) {
                entry.element.remove();
            }
        });

        // Remove from our list
        this.allEntries = this.allEntries.filter(e => !e.selected);
        this.selectedFragments.clear();

        this.renderEntries();
        this.updateSelectionInfo();
        console.log('[TRANSCRIPT EDITOR] Deleted', selected.length, 'fragments');
    }

    deleteEntry(entryId) {
        if (!confirm('Delete this entry?')) {
            return;
        }

        const entry = this.allEntries.find(e => e.id === entryId);
        if (entry && entry.element) {
            entry.element.remove();
        }

        this.allEntries = this.allEntries.filter(e => e.id !== entryId);
        this.selectedFragments.delete(entryId);

        this.renderEntries();
        this.updateSelectionInfo();
    }

    updateOriginalEntry(entryId, newText) {
        const entry = this.allEntries.find(e => e.id === entryId);
        if (entry && entry.element) {
            const textEl = entry.element.querySelector('.rt-text');
            if (textEl) {
                textEl.textContent = newText;
            }
        }
    }

    exportAll() {
        let text = '# Meeting Transcript (Full)\n\n';
        text += `Generated: ${new Date().toLocaleString()}\n`;
        text += `Total entries: ${this.allEntries.length}\n\n`;
        text += '---\n\n';

        this.allEntries.forEach((entry, index) => {
            text += `## Entry ${index + 1}\n`;
            text += `**${entry.speaker}** (${entry.timestamp})`;
            if (entry.category) {
                text += ` [${entry.category}]`;
            }
            text += `\n\n${entry.text}\n\n---\n\n`;
        });

        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-full-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Global instance
let transcriptEditor = null;
