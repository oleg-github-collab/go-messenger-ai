/**
 * Color Scheme Editor - Customize sentiment highlight colors
 * @module notetaker/color-scheme-editor
 */

import { Logger } from '../core/logger.js';
import { globalEvents } from '../core/events.js';
import { localStore } from '../core/storage.js';

const logger = new Logger('NOTETAKER:COLORS');

export class ColorSchemeEditor {
    constructor() {
        this.currentScheme = this.loadScheme();
        this.presetSchemes = this.initializePresets();

        logger.log('Color Scheme Editor initialized');
    }

    /**
     * Initialize preset color schemes
     */
    initializePresets() {
        return {
            default: {
                name: 'Default',
                colors: {
                    positive: '#10b981',
                    negative: '#ef4444',
                    question: '#3b82f6',
                    action: '#f59e0b',
                    neutral: '#6b7280'
                }
            },
            vibrant: {
                name: 'Vibrant',
                colors: {
                    positive: '#22c55e',
                    negative: '#f43f5e',
                    question: '#6366f1',
                    action: '#f97316',
                    neutral: '#64748b'
                }
            },
            pastel: {
                name: 'Pastel',
                colors: {
                    positive: '#86efac',
                    negative: '#fca5a5',
                    question: '#93c5fd',
                    action: '#fde047',
                    neutral: '#cbd5e1'
                }
            },
            dark: {
                name: 'Dark Mode',
                colors: {
                    positive: '#059669',
                    negative: '#dc2626',
                    question: '#2563eb',
                    action: '#ea580c',
                    neutral: '#475569'
                }
            },
            ocean: {
                name: 'Ocean',
                colors: {
                    positive: '#06b6d4',
                    negative: '#be123c',
                    question: '#0284c7',
                    action: '#16a34a',
                    neutral: '#64748b'
                }
            },
            sunset: {
                name: 'Sunset',
                colors: {
                    positive: '#fbbf24',
                    negative: '#dc2626',
                    question: '#f472b6',
                    action: '#f97316',
                    neutral: '#78716c'
                }
            },
            forest: {
                name: 'Forest',
                colors: {
                    positive: '#22c55e',
                    negative: '#7c2d12',
                    question: '#0d9488',
                    action: '#ca8a04',
                    neutral: '#57534e'
                }
            },
            purple: {
                name: 'Purple Dream',
                colors: {
                    positive: '#a78bfa',
                    negative: '#f87171',
                    question: '#c084fc',
                    action: '#fbbf24',
                    neutral: '#9ca3af'
                }
            }
        };
    }

    /**
     * Show color scheme editor
     */
    show(currentColors = null) {
        if (currentColors) {
            this.currentScheme = { ...currentColors };
        }

        this.createEditorModal();

        logger.log('Showed color scheme editor');
    }

    /**
     * Create editor modal
     */
    createEditorModal() {
        // Remove existing
        const existing = document.getElementById('colorSchemeEditorModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'colorSchemeEditorModal';
        modal.className = 'color-editor-modal';
        modal.innerHTML = `
            <div class="color-editor-backdrop"></div>
            <div class="color-editor-container">
                <div class="color-editor-header">
                    <h3>🎨 Customize Colors</h3>
                    <button class="btn-close" id="closeColorEditor">✕</button>
                </div>

                <div class="color-editor-body">
                    <!-- Preset Selection -->
                    <div class="color-presets-section">
                        <h4>Quick Presets</h4>
                        <div class="color-presets-grid">
                            ${Object.entries(this.presetSchemes).map(([id, preset]) => `
                                <button class="preset-card" data-preset-id="${id}">
                                    <div class="preset-name">${preset.name}</div>
                                    <div class="preset-colors">
                                        ${Object.values(preset.colors).map(color => `
                                            <span class="preset-color-dot" style="background: ${color}"></span>
                                        `).join('')}
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Custom Colors -->
                    <div class="color-custom-section">
                        <h4>Custom Colors</h4>
                        <div class="color-inputs-grid">
                            <div class="color-input-group">
                                <label>✓ Positive</label>
                                <div class="color-input-wrapper">
                                    <input type="color"
                                           id="colorPositive"
                                           value="${this.currentScheme.positive || '#10b981'}">
                                    <input type="text"
                                           class="color-hex-input"
                                           value="${this.currentScheme.positive || '#10b981'}">
                                </div>
                            </div>

                            <div class="color-input-group">
                                <label>✕ Negative</label>
                                <div class="color-input-wrapper">
                                    <input type="color"
                                           id="colorNegative"
                                           value="${this.currentScheme.negative || '#ef4444'}">
                                    <input type="text"
                                           class="color-hex-input"
                                           value="${this.currentScheme.negative || '#ef4444'}">
                                </div>
                            </div>

                            <div class="color-input-group">
                                <label>? Question</label>
                                <div class="color-input-wrapper">
                                    <input type="color"
                                           id="colorQuestion"
                                           value="${this.currentScheme.question || '#3b82f6'}">
                                    <input type="text"
                                           class="color-hex-input"
                                           value="${this.currentScheme.question || '#3b82f6'}">
                                </div>
                            </div>

                            <div class="color-input-group">
                                <label>⚡ Action</label>
                                <div class="color-input-wrapper">
                                    <input type="color"
                                           id="colorAction"
                                           value="${this.currentScheme.action || '#f59e0b'}">
                                    <input type="text"
                                           class="color-hex-input"
                                           value="${this.currentScheme.action || '#f59e0b'}">
                                </div>
                            </div>

                            <div class="color-input-group">
                                <label>• Neutral</label>
                                <div class="color-input-wrapper">
                                    <input type="color"
                                           id="colorNeutral"
                                           value="${this.currentScheme.neutral || '#6b7280'}">
                                    <input type="text"
                                           class="color-hex-input"
                                           value="${this.currentScheme.neutral || '#6b7280'}">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Preview -->
                    <div class="color-preview-section">
                        <h4>Preview</h4>
                        <div class="color-preview-samples">
                            <div class="preview-sample" style="border-left-color: ${this.currentScheme.positive || '#10b981'}">
                                <span class="preview-badge" style="background: ${this.currentScheme.positive || '#10b981'}">Positive</span>
                                This is how positive sentiment will look
                            </div>
                            <div class="preview-sample" style="border-left-color: ${this.currentScheme.negative || '#ef4444'}">
                                <span class="preview-badge" style="background: ${this.currentScheme.negative || '#ef4444'}">Negative</span>
                                This is how negative sentiment will look
                            </div>
                            <div class="preview-sample" style="border-left-color: ${this.currentScheme.question || '#3b82f6'}">
                                <span class="preview-badge" style="background: ${this.currentScheme.question || '#3b82f6'}">Question</span>
                                This is how questions will look
                            </div>
                            <div class="preview-sample" style="border-left-color: ${this.currentScheme.action || '#f59e0b'}">
                                <span class="preview-badge" style="background: ${this.currentScheme.action || '#f59e0b'}">Action</span>
                                This is how action items will look
                            </div>
                        </div>
                    </div>
                </div>

                <div class="color-editor-footer">
                    <button class="btn secondary" id="resetColorsBtn">Reset to Default</button>
                    <div class="footer-right">
                        <button class="btn secondary" id="cancelColorsBtn">Cancel</button>
                        <button class="btn primary" id="saveColorsBtn">Save Colors</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => modal.classList.add('show'), 10);

        this.attachEditorListeners();
    }

    /**
     * Attach editor event listeners
     */
    attachEditorListeners() {
        // Close
        document.getElementById('closeColorEditor')?.addEventListener('click', () => this.hide());
        document.getElementById('cancelColorsBtn')?.addEventListener('click', () => this.hide());

        // Save
        document.getElementById('saveColorsBtn')?.addEventListener('click', () => this.saveColors());

        // Reset
        document.getElementById('resetColorsBtn')?.addEventListener('click', () => this.resetColors());

        // Preset selection
        document.querySelectorAll('.preset-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const presetId = e.currentTarget.dataset.presetId;
                this.applyPreset(presetId);
            });
        });

        // Color picker sync
        ['positive', 'negative', 'question', 'action', 'neutral'].forEach(sentiment => {
            const colorInput = document.getElementById(`color${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}`);
            const hexInput = colorInput?.nextElementSibling;

            colorInput?.addEventListener('input', (e) => {
                hexInput.value = e.target.value;
                this.updatePreview();
            });

            hexInput?.addEventListener('input', (e) => {
                if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                    colorInput.value = e.target.value;
                    this.updatePreview();
                }
            });
        });
    }

    /**
     * Apply preset scheme
     */
    applyPreset(presetId) {
        const preset = this.presetSchemes[presetId];

        if (!preset) {
            logger.warn(`Preset ${presetId} not found`);
            return;
        }

        this.currentScheme = { ...preset.colors };

        // Update inputs
        Object.entries(preset.colors).forEach(([sentiment, color]) => {
            const input = document.getElementById(`color${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}`);
            const hexInput = input?.nextElementSibling;

            if (input) input.value = color;
            if (hexInput) hexInput.value = color;
        });

        this.updatePreview();

        logger.log(`Applied preset: ${preset.name}`);
    }

    /**
     * Update preview
     */
    updatePreview() {
        // Get current values
        const colors = {
            positive: document.getElementById('colorPositive')?.value || '#10b981',
            negative: document.getElementById('colorNegative')?.value || '#ef4444',
            question: document.getElementById('colorQuestion')?.value || '#3b82f6',
            action: document.getElementById('colorAction')?.value || '#f59e0b',
            neutral: document.getElementById('colorNeutral')?.value || '#6b7280'
        };

        // Update preview samples
        document.querySelectorAll('.preview-sample').forEach((sample, index) => {
            const sentiments = ['positive', 'negative', 'question', 'action'];
            const sentiment = sentiments[index];

            if (sentiment) {
                sample.style.borderLeftColor = colors[sentiment];
                const badge = sample.querySelector('.preview-badge');
                if (badge) badge.style.background = colors[sentiment];
            }
        });

        this.currentScheme = colors;
    }

    /**
     * Reset to default colors
     */
    resetColors() {
        this.applyPreset('default');
        logger.log('Reset to default colors');
    }

    /**
     * Save colors
     */
    saveColors() {
        this.updatePreview(); // Ensure current scheme is up to date

        this.saveScheme(this.currentScheme);

        logger.success('Colors saved');

        globalEvents.emit('color-scheme:updated', this.currentScheme);

        this.hide();
    }

    /**
     * Hide editor
     */
    hide() {
        const modal = document.getElementById('colorSchemeEditorModal');

        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    /**
     * Save scheme to localStorage
     */
    saveScheme(colors) {
        localStore.set('notetaker_color_scheme', colors);
    }

    /**
     * Load scheme from localStorage
     */
    loadScheme() {
        return localStore.get('notetaker_color_scheme', this.presetSchemes.default.colors);
    }

    /**
     * Get current scheme
     */
    getCurrentScheme() {
        return this.currentScheme;
    }

    /**
     * Get preset schemes
     */
    getPresets() {
        return this.presetSchemes;
    }
}

export default ColorSchemeEditor;
