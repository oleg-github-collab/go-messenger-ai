// Notetaker UI Manager - Enhanced interface management
// Handles tabs, categories, presets, and all UI interactions

class NotetakerUIManager {
    constructor(notetaker) {
        this.notetaker = notetaker;
        this.currentTab = 'basic';
        this.categories = [];
        this.selectedPreset = null;

        this.initializeUI();
        this.initializeEventListeners();
        this.loadSavedState();

        console.log('[NOTETAKER-UI] UI Manager initialized');
    }

    initializeUI() {
        // Cache DOM elements
        this.tabButtons = document.querySelectorAll('.notetaker-tab');
        this.tabPanels = document.querySelectorAll('.notetaker-tab-panel');
        this.statusBadge = document.getElementById('notetakerStatusBadge');
        this.quickStats = document.getElementById('notetakerQuickStats');
        this.categoriesList = document.getElementById('categoriesList');
        this.presetsGrid = document.getElementById('presetsGrid');
        this.realtimeTranscript = document.getElementById('realtimeTranscript');

        // Stats elements
        this.wordCountEl = document.getElementById('transcriptWordCount');
        this.durationEl = document.getElementById('transcriptDuration');
        this.entriesEl = document.getElementById('transcriptEntries');
        this.highlightsEl = document.getElementById('transcriptHighlights');

        // Initialize categories list
        this.renderCategoriesList();

        // Initialize presets grid
        this.renderPresetsGrid();
    }

    initializeEventListeners() {
        // Tab switching
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Add category button
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.addCategory());
        }

        // Clear transcript button
        const clearTranscriptBtn = document.getElementById('clearTranscriptBtn');
        if (clearTranscriptBtn) {
            clearTranscriptBtn.addEventListener('click', () => this.clearTranscript());
        }

        // Advanced settings
        const confidenceSlider = document.getElementById('confidenceThreshold');
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceSlider && confidenceValue) {
            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = e.target.value + '%';
            });
        }

        // Data management buttons
        const exportSettingsBtn = document.getElementById('exportSettingsBtn');
        const importSettingsBtn = document.getElementById('importSettingsBtn');
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');

        if (exportSettingsBtn) {
            exportSettingsBtn.addEventListener('click', () => this.exportSettings());
        }
        if (importSettingsBtn) {
            importSettingsBtn.addEventListener('click', () => this.importSettings());
        }
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        }

        // Meeting context input
        const contextInput = document.getElementById('meetingContextInput');
        if (contextInput) {
            contextInput.addEventListener('change', () => {
                this.saveMeetingContext();
            });
        }
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        // Update tab buttons
        this.tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab panels
        this.tabPanels.forEach(panel => {
            if (panel.dataset.panel === tabName) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        console.log('[NOTETAKER-UI] Switched to tab:', tabName);
    }

    renderCategoriesList() {
        if (!this.categoriesList) return;

        this.categoriesList.innerHTML = '';

        if (this.categories.length === 0) {
            this.categoriesList.innerHTML = `
                <div class="empty-state">
                    <p style="text-align: center; color: #64748b; padding: 20px;">
                        No custom categories yet. Click "Add Category" to create one.
                    </p>
                </div>
            `;
            return;
        }

        this.categories.forEach((category, index) => {
            const categoryEl = this.createCategoryElement(category, index);
            this.categoriesList.appendChild(categoryEl);
        });
    }

    createCategoryElement(category, index) {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.dataset.index = index;

        div.innerHTML = `
            <div class="category-header">
                <input type="checkbox" class="category-toggle" ${category.enabled ? 'checked' : ''}>
                <input type="color" class="category-color" value="${category.color}">
                <input type="text" class="category-name" placeholder="Category name" value="${category.name}" maxlength="50">
                <button class="btn-icon-danger btn-remove-category">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
            <textarea class="category-description" placeholder="What should AI look for? (keywords, phrases, context...)" rows="2" maxlength="200">${category.description || ''}</textarea>
        `;

        // Event listeners
        const toggle = div.querySelector('.category-toggle');
        const colorInput = div.querySelector('.category-color');
        const nameInput = div.querySelector('.category-name');
        const descInput = div.querySelector('.category-description');
        const removeBtn = div.querySelector('.btn-remove-category');

        toggle.addEventListener('change', () => {
            this.categories[index].enabled = toggle.checked;
            this.saveCategories();
        });

        colorInput.addEventListener('change', () => {
            this.categories[index].color = colorInput.value;
            this.saveCategories();
        });

        nameInput.addEventListener('input', () => {
            this.categories[index].name = nameInput.value;
            this.saveCategories();
        });

        descInput.addEventListener('input', () => {
            this.categories[index].description = descInput.value;
            this.saveCategories();
        });

        removeBtn.addEventListener('click', () => {
            this.removeCategory(index);
        });

        return div;
    }

    addCategory() {
        const newCategory = {
            id: `custom_${Date.now()}`,
            name: 'New Category',
            description: '',
            color: this.getRandomColor(),
            enabled: true
        };

        this.categories.push(newCategory);
        this.renderCategoriesList();
        this.saveCategories();

        console.log('[NOTETAKER-UI] Added new category');

        // Focus on the new category name input
        setTimeout(() => {
            const lastCategoryName = this.categoriesList.querySelector('.category-item:last-child .category-name');
            if (lastCategoryName) {
                lastCategoryName.focus();
                lastCategoryName.select();
            }
        }, 100);
    }

    removeCategory(index) {
        if (confirm('Remove this category?')) {
            this.categories.splice(index, 1);
            this.renderCategoriesList();
            this.saveCategories();
            console.log('[NOTETAKER-UI] Removed category');
        }
    }

    getRandomColor() {
        const colors = [
            '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
            '#10b981', '#06b6d4', '#6366f1', '#f97316'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    renderPresetsGrid() {
        if (!this.presetsGrid) return;
        if (typeof rolePresetsManager === 'undefined') {
            console.warn('[NOTETAKER-UI] Role presets manager not available');
            return;
        }

        this.presetsGrid.innerHTML = '';

        const presets = rolePresetsManager.getAllPresets();
        presets.forEach(preset => {
            const presetEl = this.createPresetCard(preset);
            this.presetsGrid.appendChild(presetEl);
        });
    }

    createPresetCard(preset) {
        const div = document.createElement('div');
        div.className = 'preset-card';
        div.dataset.presetId = preset.id;

        div.innerHTML = `
            <div class="preset-icon">${preset.icon}</div>
            <div class="preset-name">${preset.name}</div>
            <div class="preset-description">${preset.description}</div>
        `;

        div.addEventListener('click', () => {
            this.selectPreset(preset);
        });

        return div;
    }

    selectPreset(preset) {
        console.log('[NOTETAKER-UI] Selected preset:', preset.name);

        // Update selected state
        this.selectedPreset = preset;
        document.querySelectorAll('.preset-card').forEach(card => {
            if (card.dataset.presetId === preset.id) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Load preset categories
        this.categories = preset.categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            description: cat.description,
            color: cat.color,
            enabled: cat.enabled
        }));

        // Update meeting context
        const contextInput = document.getElementById('meetingContextInput');
        if (contextInput && preset.fullDescription) {
            contextInput.value = preset.fullDescription;
        }

        this.renderCategoriesList();
        this.saveCategories();

        // Switch to categories tab to show loaded preset
        this.switchTab('categories');

        // Show success feedback
        this.showNotification(`✅ Loaded ${preset.name} preset with ${preset.categories.length} categories`);
    }

    clearTranscript() {
        if (!confirm('Clear all transcript entries?')) return;

        if (this.realtimeTranscript) {
            this.realtimeTranscript.innerHTML = `
                <div class="transcript-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                    </svg>
                    <p>Start recording to see live transcript</p>
                </div>
            `;
        }

        // Reset notetaker data
        if (this.notetaker) {
            this.notetaker.transcript = '';
            this.notetaker.conversationHistory = [];
            this.notetaker.wordCount = 0;
        }

        this.updateStats();
        console.log('[NOTETAKER-UI] Transcript cleared');
    }

    updateStats() {
        if (!this.notetaker) return;

        // Word count
        const wordCount = this.notetaker.wordCount || 0;
        if (this.wordCountEl) {
            this.wordCountEl.textContent = wordCount.toLocaleString();
        }

        // Duration
        if (this.notetaker.startTime && this.durationEl) {
            const duration = Date.now() - this.notetaker.startTime.getTime();
            this.durationEl.textContent = this.formatDuration(duration);
        }

        // Entries
        const entries = this.notetaker.conversationHistory?.length || 0;
        if (this.entriesEl) {
            this.entriesEl.textContent = entries;
        }

        // Highlights (entries with categories)
        const highlights = this.notetaker.conversationHistory?.filter(e =>
            e.categories && e.categories.length > 0
        ).length || 0;
        if (this.highlightsEl) {
            this.highlightsEl.textContent = highlights;
        }

        // Show/hide stats panel
        if (this.quickStats) {
            if (this.notetaker.isRecording || wordCount > 0) {
                this.quickStats.style.display = 'grid';
            } else {
                this.quickStats.style.display = 'none';
            }
        }
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
    }

    updateStatusBadge(status, text) {
        if (!this.statusBadge) return;

        const statusText = this.statusBadge.querySelector('.status-text');
        if (statusText) {
            statusText.textContent = text;
        }

        // Update badge color
        this.statusBadge.classList.remove('recording', 'processing', 'ready');
        this.statusBadge.classList.add(status);
    }

    exportSettings() {
        const settings = {
            categories: this.categories,
            meetingContext: document.getElementById('meetingContextInput')?.value || '',
            language: document.getElementById('notetakerLangSelect')?.value || 'en-US',
            aiAnalysis: document.getElementById('enableAIAnalysis')?.checked || true,
            autoSave: document.getElementById('enableAutoSave')?.checked || true,
            timestamps: document.getElementById('includeTimestamps')?.checked || true,
            speakerDetection: document.getElementById('detectSpeakers')?.checked || true,
            confidenceThreshold: document.getElementById('confidenceThreshold')?.value || 70,
            exportedAt: new Date().toISOString()
        };

        const json = JSON.stringify(settings, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notetaker-settings-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('✅ Settings exported');
        console.log('[NOTETAKER-UI] Settings exported');
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const settings = JSON.parse(text);

                // Apply settings
                if (settings.categories) {
                    this.categories = settings.categories;
                    this.renderCategoriesList();
                }

                if (settings.meetingContext) {
                    const contextInput = document.getElementById('meetingContextInput');
                    if (contextInput) contextInput.value = settings.meetingContext;
                }

                if (settings.language) {
                    const langSelect = document.getElementById('notetakerLangSelect');
                    if (langSelect) langSelect.value = settings.language;
                }

                // Advanced settings
                const checkboxes = [
                    ['enableAIAnalysis', settings.aiAnalysis],
                    ['enableAutoSave', settings.autoSave],
                    ['includeTimestamps', settings.timestamps],
                    ['detectSpeakers', settings.speakerDetection]
                ];

                checkboxes.forEach(([id, value]) => {
                    const el = document.getElementById(id);
                    if (el && value !== undefined) el.checked = value;
                });

                if (settings.confidenceThreshold) {
                    const slider = document.getElementById('confidenceThreshold');
                    const valueDisplay = document.getElementById('confidenceValue');
                    if (slider) slider.value = settings.confidenceThreshold;
                    if (valueDisplay) valueDisplay.textContent = settings.confidenceThreshold + '%';
                }

                this.saveCategories();
                this.showNotification('✅ Settings imported successfully');
                console.log('[NOTETAKER-UI] Settings imported');

            } catch (err) {
                console.error('[NOTETAKER-UI] Import failed:', err);
                alert('Failed to import settings: ' + err.message);
            }
        };

        input.click();
    }

    resetSettings() {
        if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;

        this.categories = [];
        this.selectedPreset = null;
        this.renderCategoriesList();

        // Reset all inputs
        const contextInput = document.getElementById('meetingContextInput');
        if (contextInput) contextInput.value = '';

        const langSelect = document.getElementById('notetakerLangSelect');
        if (langSelect) langSelect.value = 'en-US';

        // Reset checkboxes
        ['enableAIAnalysis', 'enableAutoSave', 'includeTimestamps', 'detectSpeakers'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.checked = true;
        });

        // Reset slider
        const slider = document.getElementById('confidenceThreshold');
        const valueDisplay = document.getElementById('confidenceValue');
        if (slider) slider.value = 70;
        if (valueDisplay) valueDisplay.textContent = '70%';

        this.saveCategories();
        this.showNotification('✅ Settings reset to defaults');
        console.log('[NOTETAKER-UI] Settings reset');
    }

    saveCategories() {
        try {
            localStorage.setItem('notetaker_categories', JSON.stringify(this.categories));
            console.log('[NOTETAKER-UI] Categories saved');
        } catch (err) {
            console.error('[NOTETAKER-UI] Failed to save categories:', err);
        }
    }

    saveMeetingContext() {
        const contextInput = document.getElementById('meetingContextInput');
        if (contextInput) {
            try {
                localStorage.setItem('notetaker_context', contextInput.value);
                console.log('[NOTETAKER-UI] Meeting context saved');
            } catch (err) {
                console.error('[NOTETAKER-UI] Failed to save context:', err);
            }
        }
    }

    loadSavedState() {
        try {
            // Load categories
            const savedCategories = localStorage.getItem('notetaker_categories');
            if (savedCategories) {
                this.categories = JSON.parse(savedCategories);
                this.renderCategoriesList();
                console.log('[NOTETAKER-UI] Loaded', this.categories.length, 'saved categories');
            }

            // Load meeting context
            const savedContext = localStorage.getItem('notetaker_context');
            const contextInput = document.getElementById('meetingContextInput');
            if (savedContext && contextInput) {
                contextInput.value = savedContext;
            }

        } catch (err) {
            console.error('[NOTETAKER-UI] Failed to load saved state:', err);
        }
    }

    showNotification(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'notetaker-toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10000;
            animation: slideInUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Call this method periodically while recording
    updateLiveStats() {
        this.updateStats();
    }
}

// Global instance (will be created by notetaker)
let notetakerUIManager = null;
