// Meeting Configuration Manager
class MeetingConfigManager {
    constructor() {
        this.config = {
            context: {
                goal: '',
                partnerInfo: '',
                meetingType: 'general',
                keyPoints: ''
            },
            categories: this.getDefaultCategories(),
            activeFilters: new Set(['all'])
        };

        this.initUI();
        this.loadSavedConfig();
        this.initEventListeners();
        this.initTemplates();
    }

    getDefaultCategories() {
        return [
            {
                id: 'prices',
                name: 'Prices & Numbers',
                description: 'Any prices, costs, numbers, percentages mentioned',
                color: '#10b981', // Green
                enabled: true
            },
            {
                id: 'dates',
                name: 'Dates & Deadlines',
                description: 'Time frames, deadlines, schedules, appointments',
                color: '#f59e0b', // Orange
                enabled: true
            },
            {
                id: 'commitments',
                name: 'Commitments & Promises',
                description: 'Promises, guarantees, things they commit to do',
                color: '#3b82f6', // Blue
                enabled: true
            },
            {
                id: 'objections',
                name: 'Objections & Concerns',
                description: 'Problems, doubts, hesitations, concerns raised',
                color: '#ef4444', // Red
                enabled: true
            },
            {
                id: 'questions',
                name: 'Key Questions',
                description: 'Important questions that need answers',
                color: '#8b5cf6', // Purple
                enabled: true
            },
            {
                id: 'agreements',
                name: 'Agreements & Decisions',
                description: 'Things you both agree on, decisions made',
                color: '#06b6d4', // Cyan
                enabled: true
            }
        ];
    }

    initUI() {
        // Main toggle
        this.configToggleBtn = document.getElementById('configToggleBtn');
        this.configContent = document.getElementById('configContent');

        // Context inputs
        this.meetingGoalInput = document.getElementById('meetingGoal');
        this.partnerInfoInput = document.getElementById('partnerInfo');
        this.meetingTypeSelect = document.getElementById('meetingType');
        this.keyPointsInput = document.getElementById('keyPoints');

        // Category management
        this.categoriesList = document.getElementById('categoriesList');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');

        // Templates
        this.templatesGrid = document.getElementById('templatesGrid');

        // Real-time filter chips
        this.rtCategoryChips = document.getElementById('rtCategoryChips');
        this.rtCategoryFilter = document.getElementById('rtCategoryFilter');
    }

    initEventListeners() {
        // Config toggle
        if (this.configToggleBtn) {
            this.configToggleBtn.addEventListener('click', () => this.toggleConfig());
        }

        // Tab switching
        const tabs = document.querySelectorAll('.config-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Context inputs - auto-save
        if (this.meetingGoalInput) {
            this.meetingGoalInput.addEventListener('input', () => this.saveContext());
        }
        if (this.partnerInfoInput) {
            this.partnerInfoInput.addEventListener('input', () => this.saveContext());
        }
        if (this.meetingTypeSelect) {
            this.meetingTypeSelect.addEventListener('change', () => this.saveContext());
        }
        if (this.keyPointsInput) {
            this.keyPointsInput.addEventListener('input', () => this.saveContext());
        }

        // Add category button
        if (this.addCategoryBtn) {
            this.addCategoryBtn.addEventListener('click', () => this.addCategory());
        }
    }

    toggleConfig() {
        const isVisible = this.configContent.classList.contains('visible');
        if (isVisible) {
            this.configContent.classList.remove('visible');
            this.configToggleBtn.classList.remove('expanded');
        } else {
            this.configContent.classList.add('visible');
            this.configToggleBtn.classList.add('expanded');
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.config-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.config-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
    }

    saveContext() {
        this.config.context = {
            goal: this.meetingGoalInput?.value || '',
            partnerInfo: this.partnerInfoInput?.value || '',
            meetingType: this.meetingTypeSelect?.value || 'general',
            keyPoints: this.keyPointsInput?.value || ''
        };

        // Save to localStorage
        localStorage.setItem('meetingConfig', JSON.stringify(this.config));

        console.log('[CONFIG] Context saved:', this.config.context);
    }

    renderCategories() {
        if (!this.categoriesList) return;

        this.categoriesList.innerHTML = '';

        this.config.categories.forEach((category, index) => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.dataset.categoryId = category.id;

            item.innerHTML = `
                <div class="category-color-picker" style="background: ${category.color};" data-index="${index}"></div>
                <div class="category-info">
                    <input type="text" class="category-name-input" value="${category.name}" placeholder="Category name" data-index="${index}" data-field="name">
                    <textarea class="category-description-input" placeholder="What should AI look for?" data-index="${index}" data-field="description">${category.description}</textarea>
                </div>
                <div class="category-actions">
                    <button class="category-action-btn" data-index="${index}" data-action="toggle" title="${category.enabled ? 'Disable' : 'Enable'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            ${category.enabled ?
                                '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>' :
                                '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>'
                            }
                        </svg>
                    </button>
                    <button class="category-action-btn delete" data-index="${index}" data-action="delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;

            // Color picker click
            const colorPicker = item.querySelector('.category-color-picker');
            colorPicker.addEventListener('click', () => this.openColorPicker(index));

            // Name and description inputs
            const nameInput = item.querySelector('.category-name-input');
            const descInput = item.querySelector('.category-description-input');

            nameInput.addEventListener('input', (e) => {
                this.config.categories[index].name = e.target.value;
                this.saveConfig();
                this.updateCategoryChips();
            });

            descInput.addEventListener('input', (e) => {
                this.config.categories[index].description = e.target.value;
                this.saveConfig();
            });

            // Action buttons
            const toggleBtn = item.querySelector('[data-action="toggle"]');
            const deleteBtn = item.querySelector('[data-action="delete"]');

            toggleBtn.addEventListener('click', () => this.toggleCategory(index));
            deleteBtn.addEventListener('click', () => this.deleteCategory(index));

            // Apply opacity if disabled
            if (!category.enabled) {
                item.style.opacity = '0.5';
            }

            this.categoriesList.appendChild(item);
        });

        // Update filter chips
        this.updateCategoryChips();
    }

    openColorPicker(index) {
        // Create temporary color input
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.config.categories[index].color;

        input.addEventListener('change', (e) => {
            this.config.categories[index].color = e.target.value;
            this.saveConfig();
            this.renderCategories();
        });

        input.click();
    }

    addCategory() {
        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newCategory = {
            id: `custom_${Date.now()}`,
            name: 'New Category',
            description: 'Describe what AI should look for...',
            color: randomColor,
            enabled: true
        };

        this.config.categories.push(newCategory);
        this.saveConfig();
        this.renderCategories();

        // Auto-focus the new category name input
        setTimeout(() => {
            const lastInput = this.categoriesList.querySelector('.category-item:last-child .category-name-input');
            if (lastInput) {
                lastInput.focus();
                lastInput.select();
            }
        }, 100);
    }

    toggleCategory(index) {
        this.config.categories[index].enabled = !this.config.categories[index].enabled;
        this.saveConfig();
        this.renderCategories();
    }

    deleteCategory(index) {
        if (confirm(`Delete category "${this.config.categories[index].name}"?`)) {
            this.config.categories.splice(index, 1);
            this.saveConfig();
            this.renderCategories();
        }
    }

    updateCategoryChips() {
        if (!this.rtCategoryChips) return;

        // Get current active filter
        const currentActive = Array.from(this.config.activeFilters)[0] || 'all';

        // Clear existing chips (except "All")
        this.rtCategoryChips.innerHTML = `
            <button class="rt-category-chip ${currentActive === 'all' ? 'active' : ''}" data-category="all">
                <span class="chip-dot" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6);"></span>
                All
            </button>
        `;

        // Add chips for enabled categories
        this.config.categories.filter(cat => cat.enabled).forEach(category => {
            const chip = document.createElement('button');
            chip.className = `rt-category-chip ${currentActive === category.id ? 'active' : ''}`;
            chip.dataset.category = category.id;
            chip.innerHTML = `
                <span class="chip-dot" style="background: ${category.color};"></span>
                ${category.name}
            `;

            chip.addEventListener('click', () => this.filterByCategory(category.id));
            this.rtCategoryChips.appendChild(chip);
        });

        // Show category filter if categories exist
        if (this.config.categories.filter(cat => cat.enabled).length > 0) {
            this.rtCategoryFilter.style.display = 'flex';
        }

        // Add click handler for "All" chip
        const allChip = this.rtCategoryChips.querySelector('[data-category="all"]');
        if (allChip) {
            allChip.addEventListener('click', () => this.filterByCategory('all'));
        }
    }

    filterByCategory(categoryId) {
        // Update active filter
        this.config.activeFilters.clear();
        this.config.activeFilters.add(categoryId);

        // Update chip states
        document.querySelectorAll('.rt-category-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === categoryId);
        });

        // Filter transcript entries
        const allEntries = document.querySelectorAll('.rt-transcript-entry');
        allEntries.forEach(entry => {
            if (categoryId === 'all') {
                entry.style.display = '';
            } else {
                const hasCategory = entry.classList.contains(`cat-${categoryId}`);
                entry.style.display = hasCategory ? '' : 'none';
            }
        });

        console.log('[CONFIG] Filter by category:', categoryId);
    }

    initTemplates() {
        if (!this.templatesGrid) return;

        const templates = [
            {
                icon: '💰',
                name: 'Sales Call',
                description: 'Focus on pricing, objections, commitments',
                config: {
                    meetingType: 'sales',
                    categories: [
                        { ...this.getDefaultCategories().find(c => c.id === 'prices'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'objections'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'commitments'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'agreements'), enabled: true }
                    ]
                }
            },
            {
                icon: '🤝',
                name: 'Partnership',
                description: 'Track agreements and deadlines',
                config: {
                    meetingType: 'partnership',
                    categories: [
                        { ...this.getDefaultCategories().find(c => c.id === 'agreements'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'dates'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'commitments'), enabled: true }
                    ]
                }
            },
            {
                icon: '⚡',
                name: 'Negotiation',
                description: 'Monitor all numbers and objections',
                config: {
                    meetingType: 'sales',
                    categories: [
                        { ...this.getDefaultCategories().find(c => c.id === 'prices'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'objections'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'dates'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'agreements'), enabled: true }
                    ]
                }
            },
            {
                icon: '🎧',
                name: 'Support Call',
                description: 'Focus on questions and solutions',
                config: {
                    meetingType: 'support',
                    categories: [
                        { ...this.getDefaultCategories().find(c => c.id === 'questions'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'objections'), enabled: true },
                        { ...this.getDefaultCategories().find(c => c.id === 'commitments'), enabled: true }
                    ]
                }
            },
            {
                icon: '📋',
                name: 'Full Tracking',
                description: 'Enable all categories',
                config: {
                    meetingType: 'general',
                    categories: this.getDefaultCategories().map(c => ({ ...c, enabled: true }))
                }
            },
            {
                icon: '🎯',
                name: 'Custom',
                description: 'Start from scratch',
                config: {
                    meetingType: 'general',
                    categories: []
                }
            }
        ];

        templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.description}</div>
            `;

            card.addEventListener('click', () => this.applyTemplate(template));
            this.templatesGrid.appendChild(card);
        });
    }

    applyTemplate(template) {
        if (this.meetingTypeSelect) {
            this.meetingTypeSelect.value = template.config.meetingType;
        }

        this.config.categories = template.config.categories;
        this.saveContext();
        this.saveConfig();
        this.renderCategories();

        // Switch to categories tab
        this.switchTab('categories');

        console.log('[CONFIG] Template applied:', template.name);
    }

    saveConfig() {
        localStorage.setItem('meetingConfig', JSON.stringify(this.config));
    }

    loadSavedConfig() {
        const saved = localStorage.getItem('meetingConfig');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.config = {
                    ...this.config,
                    ...parsed
                };

                // Restore context inputs
                if (this.meetingGoalInput) this.meetingGoalInput.value = this.config.context.goal || '';
                if (this.partnerInfoInput) this.partnerInfoInput.value = this.config.context.partnerInfo || '';
                if (this.meetingTypeSelect) this.meetingTypeSelect.value = this.config.context.meetingType || 'general';
                if (this.keyPointsInput) this.keyPointsInput.value = this.config.context.keyPoints || '';

                console.log('[CONFIG] Loaded saved configuration');
            } catch (e) {
                console.error('[CONFIG] Failed to load saved config:', e);
            }
        }

        // Render categories
        this.renderCategories();
    }

    // Get config for AI analysis
    getConfig() {
        return this.config;
    }

    // Get enabled categories only
    getEnabledCategories() {
        return this.config.categories.filter(cat => cat.enabled);
    }

    // Build AI prompt based on config
    buildAIPrompt() {
        const { context } = this.config;
        const enabledCategories = this.getEnabledCategories();

        let prompt = `You are analyzing a ${context.meetingType} meeting.\n\n`;

        if (context.goal) {
            prompt += `Meeting objective: ${context.goal}\n`;
        }

        if (context.partnerInfo) {
            prompt += `Partner information: ${context.partnerInfo}\n`;
        }

        if (context.keyPoints) {
            prompt += `Key points to watch: ${context.keyPoints}\n`;
        }

        if (enabledCategories.length > 0) {
            prompt += `\nCategorize statements into these categories:\n`;
            enabledCategories.forEach(cat => {
                prompt += `- ${cat.id}: ${cat.description}\n`;
            });
        }

        prompt += `\nRespond with only the category ID if the statement matches one, or "neutral" if it doesn't match any category.`;

        return prompt;
    }
}

// Global instance
let meetingConfig = null;

// Modal UI Manager
class ConfigModalManager {
    constructor(configManager) {
        this.configManager = configManager;
        this.initModalElements();
        this.initModalEvents();
    }

    initModalElements() {
        this.modal = document.getElementById('configModal');
        this.backdrop = document.getElementById('configModalBackdrop');
        this.openBtn = document.getElementById('configOpenBtn');
        this.closeBtn = document.getElementById('configModalClose');
        this.cancelBtn = document.getElementById('configModalCancel');
        this.saveBtn = document.getElementById('configModalSave');

        // Modal inputs
        this.modalGoal = document.getElementById('modalMeetingGoal');
        this.modalPartnerInfo = document.getElementById('modalPartnerInfo');
        this.modalType = document.getElementById('modalMeetingType');
        this.modalKeyPoints = document.getElementById('modalKeyPoints');

        // Modal lists
        this.modalCategoriesList = document.getElementById('modalCategoriesList');
        this.modalTemplatesGrid = document.getElementById('modalTemplatesGrid');
        this.modalAddCategoryBtn = document.getElementById('modalAddCategoryBtn');
    }

    initModalEvents() {
        // Open/Close
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.open());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.close());
        }

        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveAndClose());
        }

        if (this.backdrop) {
            this.backdrop.addEventListener('click', () => this.close());
        }

        // Tabs
        const tabs = document.querySelectorAll('.config-modal-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Add category
        if (this.modalAddCategoryBtn) {
            this.modalAddCategoryBtn.addEventListener('click', () => this.addCategory());
        }
    }

    open() {
        // Sync current config to modal inputs
        const config = this.configManager.getConfig();

        if (this.modalGoal) this.modalGoal.value = config.context.goal || '';
        if (this.modalPartnerInfo) this.modalPartnerInfo.value = config.context.partnerInfo || '';
        if (this.modalType) this.modalType.value = config.context.meetingType || 'general';
        if (this.modalKeyPoints) this.modalKeyPoints.value = config.context.keyPoints || '';

        // Render all tabs
        this.renderRolePresets();
        this.renderCategories();
        this.renderTemplates();
        this.initTranscriptEditor();

        // Show modal
        this.modal.classList.add('active');
        this.backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('active');
        this.backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    saveAndClose() {
        // Save context from modal inputs
        this.configManager.config.context = {
            goal: this.modalGoal?.value || '',
            partnerInfo: this.modalPartnerInfo?.value || '',
            meetingType: this.modalType?.value || 'general',
            keyPoints: this.modalKeyPoints?.value || ''
        };

        // Save to localStorage
        this.configManager.saveConfig();

        // Update old inputs (if they exist)
        if (this.configManager.meetingGoalInput) {
            this.configManager.meetingGoalInput.value = this.configManager.config.context.goal;
        }
        if (this.configManager.partnerInfoInput) {
            this.configManager.partnerInfoInput.value = this.configManager.config.context.partnerInfo;
        }
        if (this.configManager.meetingTypeSelect) {
            this.configManager.meetingTypeSelect.value = this.configManager.config.context.meetingType;
        }
        if (this.configManager.keyPointsInput) {
            this.configManager.keyPointsInput.value = this.configManager.config.context.keyPoints;
        }

        this.close();
        console.log('[CONFIG MODAL] Configuration saved');
    }

    switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.config-modal-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update panels
        document.querySelectorAll('.config-modal-tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });

        const targetPanel = document.getElementById(`modal${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
    }

    renderCategories() {
        if (!this.modalCategoriesList) return;

        this.modalCategoriesList.innerHTML = '';

        this.configManager.config.categories.forEach((category, index) => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.style.opacity = category.enabled ? '1' : '0.5';

            item.innerHTML = `
                <div class="category-color-picker" style="background: ${category.color};" data-index="${index}"></div>
                <div class="category-info">
                    <input type="text" class="category-name-input" value="${category.name}" placeholder="Category name" data-index="${index}">
                    <textarea class="category-description-input" placeholder="What should AI look for?" data-index="${index}">${category.description}</textarea>
                </div>
                <div class="category-actions">
                    <button class="category-action-btn" data-index="${index}" data-action="toggle" title="${category.enabled ? 'Disable' : 'Enable'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            ${category.enabled ?
                                '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>' :
                                '<path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>'
                            }
                        </svg>
                    </button>
                    <button class="category-action-btn delete" data-index="${index}" data-action="delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            `;

            // Event listeners
            const colorPicker = item.querySelector('.category-color-picker');
            colorPicker.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = this.configManager.config.categories[index].color;
                input.addEventListener('change', (e) => {
                    this.configManager.config.categories[index].color = e.target.value;
                    this.renderCategories();
                });
                input.click();
            });

            const nameInput = item.querySelector('.category-name-input');
            nameInput.addEventListener('input', (e) => {
                this.configManager.config.categories[index].name = e.target.value;
            });

            const descInput = item.querySelector('.category-description-input');
            descInput.addEventListener('input', (e) => {
                this.configManager.config.categories[index].description = e.target.value;
            });

            const toggleBtn = item.querySelector('[data-action="toggle"]');
            toggleBtn.addEventListener('click', () => {
                this.configManager.config.categories[index].enabled = !this.configManager.config.categories[index].enabled;
                this.renderCategories();
            });

            const deleteBtn = item.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Delete category "${this.configManager.config.categories[index].name}"?`)) {
                    this.configManager.config.categories.splice(index, 1);
                    this.renderCategories();
                }
            });

            this.modalCategoriesList.appendChild(item);
        });
    }

    addCategory() {
        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        this.configManager.config.categories.push({
            id: `custom_${Date.now()}`,
            name: 'New Category',
            description: 'Describe what AI should look for...',
            color: randomColor,
            enabled: true
        });

        this.renderCategories();

        // Auto-focus new category
        setTimeout(() => {
            const lastInput = this.modalCategoriesList.querySelector('.category-item:last-child .category-name-input');
            if (lastInput) {
                lastInput.focus();
                lastInput.select();
            }
        }, 100);
    }

    renderTemplates() {
        if (!this.modalTemplatesGrid) return;

        const templates = [
            {
                icon: '💰',
                name: 'Sales Call',
                description: 'Prices, objections, commitments',
                categories: ['prices', 'objections', 'commitments', 'agreements']
            },
            {
                icon: '🤝',
                name: 'Partnership',
                description: 'Agreements & deadlines',
                categories: ['agreements', 'dates', 'commitments']
            },
            {
                icon: '⚡',
                name: 'Negotiation',
                description: 'All numbers & objections',
                categories: ['prices', 'objections', 'dates', 'agreements']
            },
            {
                icon: '🎧',
                name: 'Support',
                description: 'Questions & solutions',
                categories: ['questions', 'objections', 'commitments']
            },
            {
                icon: '📋',
                name: 'Full Tracking',
                description: 'All categories enabled',
                categories: 'all'
            },
            {
                icon: '🎯',
                name: 'Custom',
                description: 'Start from scratch',
                categories: []
            }
        ];

        this.modalTemplatesGrid.innerHTML = '';

        templates.forEach(template => {
            const card = document.createElement('div');
            card.className = 'template-card';
            card.innerHTML = `
                <div class="template-icon">${template.icon}</div>
                <div class="template-name">${template.name}</div>
                <div class="template-desc">${template.description}</div>
            `;

            card.addEventListener('click', () => this.applyTemplate(template));
            this.modalTemplatesGrid.appendChild(card);
        });
    }

    applyTemplate(template) {
        const defaults = this.configManager.getDefaultCategories();

        if (template.categories === 'all') {
            this.configManager.config.categories = defaults.map(c => ({...c, enabled: true}));
        } else if (template.categories.length === 0) {
            this.configManager.config.categories = [];
        } else {
            this.configManager.config.categories = defaults
                .filter(c => template.categories.includes(c.id))
                .map(c => ({...c, enabled: true}));
        }

        this.renderCategories();
        this.switchTab('categories');
        console.log('[CONFIG MODAL] Template applied:', template.name);
    }

    // Role presets integration
    renderRolePresets() {
        const grid = document.getElementById('rolePresetsGrid');
        if (!grid || !rolePresetsManager) return;

        grid.innerHTML = '';

        rolePresetsManager.presets.forEach(role => {
            const card = document.createElement('div');
            card.className = 'role-preset-card';
            card.innerHTML = `
                <div class="role-preset-icon">${role.icon}</div>
                <div class="role-preset-name">${role.name}</div>
                <div class="role-preset-description">${role.description}</div>
                <div class="role-preset-details">${role.fullDescription}</div>
                <div class="role-preset-categories-count">${role.categories.length} specialized categories</div>
            `;

            card.addEventListener('click', () => {
                rolePresetsManager.applyRolePreset(role.id, this.configManager);
                this.renderCategories();
                this.updateRolePreview(role);
            });

            grid.appendChild(card);
        });
    }

    updateRolePreview(role) {
        const preview = document.getElementById('currentRolePreview');
        const icon = document.getElementById('previewRoleIcon');
        const name = document.getElementById('previewRoleName');
        const desc = document.getElementById('previewRoleDesc');
        const chips = document.getElementById('previewCategoryChips');

        if (!preview) return;

        preview.style.display = 'block';
        if (icon) icon.textContent = role.icon;
        if (name) name.textContent = role.name;
        if (desc) desc.textContent = role.fullDescription;

        if (chips) {
            chips.innerHTML = '';
            role.categories.forEach(cat => {
                const chip = document.createElement('span');
                chip.className = 'preview-category-chip';
                chip.style.background = `${cat.color}33`;
                chip.style.color = cat.color;
                chip.textContent = cat.name;
                chips.appendChild(chip);
            });
        }

        // Setup clear button
        const clearBtn = document.getElementById('clearRoleBtn');
        if (clearBtn) {
            clearBtn.onclick = () => {
                rolePresetsManager.clearRole(this.configManager);
                preview.style.display = 'none';
                this.renderCategories();
            };
        }
    }

    // Transcript editor integration
    initTranscriptEditor() {
        const syncBtn = document.getElementById('syncTranscriptBtn');
        const exportAllBtn = document.getElementById('exportAllBtn');

        if (syncBtn && transcriptEditor) {
            syncBtn.addEventListener('click', () => {
                transcriptEditor.syncFromRealtime();
                console.log('[TRANSCRIPT EDITOR] Synced from realtime');
            });
        }

        if (exportAllBtn && transcriptEditor) {
            exportAllBtn.addEventListener('click', () => {
                transcriptEditor.exportAll();
            });
        }
    }
}

// Global modal manager
let configModalManager = null;
