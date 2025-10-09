/**
 * Emoji Picker - Modular emoji selection with categories
 * Supports multiple emoji categories, search, and recently used
 */

import { globalEvents } from '../core/events.js';

export class EmojiPicker {
    constructor(config = {}) {
        this.config = {
            maxRecent: config.maxRecent || 24,
            categories: config.categories || {
                smileys: {
                    name: '😀 Smileys',
                    icon: '😀',
                    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴']
                },
                gestures: {
                    name: '👋 Gestures',
                    icon: '👋',
                    emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳', '💪', '🦵', '🦶']
                },
                people: {
                    name: '👨 People',
                    icon: '👨',
                    emojis: ['👨', '👩', '🧑', '👦', '👧', '🧒', '👶', '👴', '👵', '🧓', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨', '👨‍🏫', '👩‍🏫', '👨‍🚀', '👩‍🚀', '👨‍🔧', '👩‍🔧', '👨‍🍳', '👩‍🍳']
                },
                animals: {
                    name: '🐶 Animals',
                    icon: '🐶',
                    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔']
                },
                food: {
                    name: '🍕 Food',
                    icon: '🍕',
                    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🥯', '🧀', '🍖', '🍗', '🥩', '🍤', '🍱', '🍣', '🍛', '🍝', '🍜', '🍲', '🍥', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛', '🍼', '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊', '🥄', '🍴', '🍽', '🥣', '🥡', '🥢', '🧂']
                },
                travel: {
                    name: '✈️ Travel',
                    icon: '✈️',
                    emojis: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '🚁', '🛩', '✈️', '🛫', '🛬', '🪂', '💺', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓']
                },
                objects: {
                    name: '⚽ Objects',
                    icon: '⚽',
                    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧗', '🚴', '🚵', '🧘', '🎖', '🏆', '🥇', '🥈', '🥉', '⚡', '🔥', '💧', '🌊', '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀', '🎁', '🎗', '🎟', '🎫', '🎖', '🏆', '📢', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉']
                },
                symbols: {
                    name: '❤️ Symbols',
                    icon: '❤️',
                    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭']
                },
                flags: {
                    name: '🇺🇦 Flags',
                    icon: '🇺🇦',
                    emojis: ['🇺🇦', '🇺🇸', '🇬🇧', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇵🇱', '🇨🇦', '🇦🇺', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇷🇺', '🇿🇦', '🇸🇪', '🇳🇴', '🇩🇰', '🇫🇮', '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇵🇹', '🇬🇷', '🇹🇷', '🇮🇱', '🇪🇬', '🇸🇦', '🇦🇪', '🇮🇷', '🇮🇶', '🇵🇰', '🇧🇩', '🇹🇭', '🇻🇳', '🇵🇭', '🇮🇩', '🇲🇾', '🇸🇬', '🇳🇿', '🇦🇷', '🇨🇱', '🇨🇴', '🇵🇪', '🇻🇪']
                }
            },
            ...config
        };

        // State
        this.isOpen = false;
        this.currentCategory = 'smileys';
        this.recentEmojis = this.loadRecent();
        this.searchQuery = '';

        // DOM Elements
        this.elements = {};

        // Target input (where emoji will be inserted)
        this.targetInput = null;
    }

    /**
     * Initialize emoji picker
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.renderCategories();
        this.renderEmojis(this.currentCategory);

        console.log('[EMOJI-PICKER] Emoji picker initialized');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Toggle button
            toggleBtn: document.getElementById('emojiBtn'),

            // Container
            container: document.getElementById('emojiPicker'),
            closeBtn: document.getElementById('emojiClose'),

            // Search
            searchInput: document.getElementById('emojiSearch'),

            // Category tabs
            categoriesContainer: document.getElementById('emojiCategories'),

            // Emoji grid
            grid: document.getElementById('emojiGrid'),

            // Target input (usually message input)
            messageInput: document.getElementById('messageInput')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle picker
        if (this.elements.toggleBtn) {
            this.elements.toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });
        }

        // Close button
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }

        // Search
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.renderEmojis(this.currentCategory);
            });
        }

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (this.isOpen && this.elements.container && !this.elements.container.contains(e.target) && e.target !== this.elements.toggleBtn) {
                this.hide();
            }
        });
    }

    /**
     * Render category tabs
     */
    renderCategories() {
        if (!this.elements.categoriesContainer) return;

        this.elements.categoriesContainer.innerHTML = '';

        // Recent category (if has recent emojis)
        if (this.recentEmojis.length > 0) {
            const recentBtn = document.createElement('button');
            recentBtn.className = 'emoji-category';
            recentBtn.dataset.category = 'recent';
            recentBtn.textContent = '🕐';
            recentBtn.title = 'Recently used';
            recentBtn.addEventListener('click', () => {
                this.switchCategory('recent');
            });
            this.elements.categoriesContainer.appendChild(recentBtn);
        }

        // Other categories
        Object.keys(this.config.categories).forEach(categoryKey => {
            const category = this.config.categories[categoryKey];
            const btn = document.createElement('button');
            btn.className = 'emoji-category';
            btn.dataset.category = categoryKey;
            btn.textContent = category.icon;
            btn.title = category.name;

            if (categoryKey === this.currentCategory) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                this.switchCategory(categoryKey);
            });

            this.elements.categoriesContainer.appendChild(btn);
        });
    }

    /**
     * Switch category
     */
    switchCategory(categoryKey) {
        this.currentCategory = categoryKey;
        this.searchQuery = '';

        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }

        // Update active state
        const categoryBtns = this.elements.categoriesContainer?.querySelectorAll('.emoji-category');
        categoryBtns?.forEach(btn => {
            if (btn.dataset.category === categoryKey) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        this.renderEmojis(categoryKey);
    }

    /**
     * Render emojis for a category
     */
    renderEmojis(categoryKey) {
        if (!this.elements.grid) return;

        this.elements.grid.innerHTML = '';

        let emojisToRender = [];

        if (categoryKey === 'recent') {
            emojisToRender = this.recentEmojis;
        } else {
            const category = this.config.categories[categoryKey];
            emojisToRender = category ? category.emojis : [];
        }

        // Apply search filter
        if (this.searchQuery) {
            // Simple search: just show all emojis from all categories
            emojisToRender = [];
            Object.values(this.config.categories).forEach(cat => {
                emojisToRender.push(...cat.emojis);
            });
        }

        // Render emojis
        emojisToRender.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-item';
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                this.selectEmoji(emoji);
            });
            this.elements.grid.appendChild(btn);
        });

        // Show empty state if no emojis
        if (emojisToRender.length === 0) {
            this.elements.grid.innerHTML = '<div class="emoji-empty-state">No emojis found</div>';
        }
    }

    /**
     * Select emoji
     */
    selectEmoji(emoji) {
        console.log('[EMOJI-PICKER] Emoji selected:', emoji);

        // Insert into target input
        const targetInput = this.targetInput || this.elements.messageInput;

        if (targetInput) {
            const start = targetInput.selectionStart || 0;
            const end = targetInput.selectionEnd || 0;
            const text = targetInput.value;

            targetInput.value = text.substring(0, start) + emoji + text.substring(end);
            targetInput.selectionStart = targetInput.selectionEnd = start + emoji.length;
            targetInput.focus();
        }

        // Add to recent
        this.addToRecent(emoji);

        // Emit event
        globalEvents.emit('emoji-picker:emoji-selected', { emoji });

        // Don't close picker - allow multiple selections
    }

    /**
     * Add emoji to recent
     */
    addToRecent(emoji) {
        // Remove if already exists
        this.recentEmojis = this.recentEmojis.filter(e => e !== emoji);

        // Add to beginning
        this.recentEmojis.unshift(emoji);

        // Limit size
        if (this.recentEmojis.length > this.config.maxRecent) {
            this.recentEmojis = this.recentEmojis.slice(0, this.config.maxRecent);
        }

        this.saveRecent();
        this.renderCategories(); // Re-render to show recent tab if it's new
    }

    /**
     * Load recent emojis from localStorage
     */
    loadRecent() {
        try {
            const stored = localStorage.getItem('recent_emojis');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[EMOJI-PICKER] Failed to load recent emojis:', error);
            return [];
        }
    }

    /**
     * Save recent emojis to localStorage
     */
    saveRecent() {
        try {
            localStorage.setItem('recent_emojis', JSON.stringify(this.recentEmojis));
        } catch (error) {
            console.error('[EMOJI-PICKER] Failed to save recent emojis:', error);
        }
    }

    /**
     * Toggle picker
     */
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Show picker
     */
    show(targetInput = null) {
        this.targetInput = targetInput;
        this.isOpen = true;

        if (this.elements.container) {
            this.elements.container.classList.add('active');
        }

        globalEvents.emit('emoji-picker:opened');
    }

    /**
     * Hide picker
     */
    hide() {
        this.isOpen = false;

        if (this.elements.container) {
            this.elements.container.classList.remove('active');
        }

        globalEvents.emit('emoji-picker:closed');
    }

    /**
     * Destroy emoji picker
     */
    destroy() {
        this.hide();
        console.log('[EMOJI-PICKER] Emoji picker destroyed');
    }
}

/**
 * Factory function to create emoji picker
 */
export function createEmojiPicker(config) {
    return new EmojiPicker(config);
}
