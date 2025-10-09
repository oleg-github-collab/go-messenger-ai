/**
 * GIF Picker - Modular GIF search and selection using Tenor API
 * Supports trending GIFs, search, categories, and favorites
 */

import { globalEvents } from '../core/events.js';

export class GIFPicker {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ', // Tenor public demo key
            limit: config.limit || 50,
            categories: config.categories || [
                { emoji: '🔥', label: 'Trending', query: 'trending' },
                { emoji: '😊', label: 'Happy', query: 'happy excited' },
                { emoji: '😂', label: 'Funny', query: 'funny laugh' },
                { emoji: '❤️', label: 'Love', query: 'love heart' },
                { emoji: '💃', label: 'Dance', query: 'dance party' },
                { emoji: '😢', label: 'Sad', query: 'sad cry' },
                { emoji: '😮', label: 'Wow', query: 'wow shocked' },
                { emoji: '👏', label: 'Applause', query: 'clap applause' },
                { emoji: '🎉', label: 'Party', query: 'party celebrate' },
                { emoji: '👍', label: 'Yes', query: 'yes thumbs up' },
                { emoji: '👎', label: 'No', query: 'no thumbs down' },
                { emoji: '🙏', label: 'Thanks', query: 'thank you grateful' }
            ],
            ...config
        };

        // State
        this.isOpen = false;
        this.currentQuery = 'trending';
        this.searchTimeout = null;
        this.favorites = this.loadFavorites();

        // DOM Elements
        this.elements = {};

        // Callback when GIF is selected
        this.onSelectCallback = null;
    }

    /**
     * Initialize GIF picker
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.renderCategories();

        console.log('[GIF-PICKER] GIF picker initialized');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Main container
            container: document.getElementById('gifPickerModal'),
            backdrop: document.getElementById('gifPickerBackdrop'),
            closeBtn: document.getElementById('gifPickerClose'),

            // Search
            searchInput: document.getElementById('gifSearch'),

            // Categories
            categoriesContainer: document.getElementById('gifCategories'),

            // Grid
            grid: document.getElementById('gifGrid'),

            // Loading indicator
            loading: document.getElementById('gifLoading'),

            // Tabs
            trendingTab: document.getElementById('gifTrendingTab'),
            favoritesTab: document.getElementById('gifFavoritesTab')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close modal
        if (this.elements.closeBtn) {
            this.elements.closeBtn.addEventListener('click', () => this.hide());
        }

        if (this.elements.backdrop) {
            this.elements.backdrop.addEventListener('click', () => this.hide());
        }

        // Search input
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    const query = e.target.value.trim();
                    this.search(query || 'trending');
                }, 500);
            });
        }

        // Tab switching
        if (this.elements.trendingTab) {
            this.elements.trendingTab.addEventListener('click', () => {
                this.showTrendingTab();
            });
        }

        if (this.elements.favoritesTab) {
            this.elements.favoritesTab.addEventListener('click', () => {
                this.showFavoritesTab();
            });
        }

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.hide();
            }
        });
    }

    /**
     * Render category buttons
     */
    renderCategories() {
        if (!this.elements.categoriesContainer) return;

        this.elements.categoriesContainer.innerHTML = '';

        this.config.categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'gif-category-btn';
            btn.innerHTML = `
                <span class="category-emoji">${cat.emoji}</span>
                <span class="category-label">${cat.label}</span>
            `;
            btn.addEventListener('click', () => {
                if (this.elements.searchInput) {
                    this.elements.searchInput.value = '';
                }
                this.search(cat.query);
            });
            this.elements.categoriesContainer.appendChild(btn);
        });
    }

    /**
     * Show GIF picker modal
     */
    show(onSelectCallback) {
        this.onSelectCallback = onSelectCallback;
        this.isOpen = true;

        if (this.elements.container) {
            this.elements.container.classList.add('active');
        }

        if (this.elements.backdrop) {
            this.elements.backdrop.classList.add('active');
        }

        // Load trending GIFs by default
        this.search('trending');

        globalEvents.emit('gif-picker:opened');
    }

    /**
     * Hide GIF picker modal
     */
    hide() {
        this.isOpen = false;

        if (this.elements.container) {
            this.elements.container.classList.remove('active');
        }

        if (this.elements.backdrop) {
            this.elements.backdrop.classList.remove('active');
        }

        globalEvents.emit('gif-picker:closed');
    }

    /**
     * Search GIFs using Tenor API
     */
    async search(query) {
        this.currentQuery = query;

        if (!this.elements.grid) return;

        // Show loading
        this.showLoading();

        try {
            const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${this.config.apiKey}&limit=${this.config.limit}`;

            const response = await fetch(url);
            const data = await response.json();

            this.hideLoading();

            if (data.results && data.results.length > 0) {
                this.renderGifs(data.results);
            } else {
                this.showEmptyState('No GIFs found');
            }
        } catch (error) {
            console.error('[GIF-PICKER] Failed to load GIFs:', error);
            this.hideLoading();
            this.showEmptyState('Failed to load GIFs');
        }
    }

    /**
     * Render GIFs in grid
     */
    renderGifs(gifs) {
        if (!this.elements.grid) return;

        this.elements.grid.innerHTML = '';

        gifs.forEach(gif => {
            const gifUrl = gif.media_formats.tinygif?.url || gif.media_formats.gif?.url;
            const previewUrl = gif.media_formats.tinygif?.url || gif.media_formats.nanogif?.url;

            const item = document.createElement('div');
            item.className = 'gif-item';

            const img = document.createElement('img');
            img.src = previewUrl;
            img.alt = gif.content_description || 'GIF';
            img.loading = 'lazy';

            // Add favorite button
            const isFavorite = this.isFavorite(gifUrl);
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = `gif-favorite-btn ${isFavorite ? 'active' : ''}`;
            favoriteBtn.innerHTML = isFavorite ? '⭐' : '☆';
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFavorite(gifUrl, gif);
                favoriteBtn.classList.toggle('active');
                favoriteBtn.innerHTML = favoriteBtn.classList.contains('active') ? '⭐' : '☆';
            });

            item.appendChild(img);
            item.appendChild(favoriteBtn);

            // Click to select
            item.addEventListener('click', () => {
                this.selectGif(gifUrl);
            });

            this.elements.grid.appendChild(item);
        });
    }

    /**
     * Select GIF
     */
    selectGif(gifUrl) {
        console.log('[GIF-PICKER] GIF selected:', gifUrl);

        if (this.onSelectCallback) {
            this.onSelectCallback(gifUrl);
        }

        globalEvents.emit('gif-picker:gif-selected', { gifUrl });

        this.hide();
    }

    /**
     * Show trending tab
     */
    showTrendingTab() {
        if (this.elements.trendingTab) {
            this.elements.trendingTab.classList.add('active');
        }
        if (this.elements.favoritesTab) {
            this.elements.favoritesTab.classList.remove('active');
        }

        this.search('trending');
    }

    /**
     * Show favorites tab
     */
    showFavoritesTab() {
        if (this.elements.trendingTab) {
            this.elements.trendingTab.classList.remove('active');
        }
        if (this.elements.favoritesTab) {
            this.elements.favoritesTab.classList.add('active');
        }

        this.renderFavorites();
    }

    /**
     * Render favorite GIFs
     */
    renderFavorites() {
        if (!this.elements.grid) return;

        this.elements.grid.innerHTML = '';

        if (this.favorites.length === 0) {
            this.showEmptyState('No favorite GIFs yet');
            return;
        }

        this.favorites.forEach(fav => {
            const item = document.createElement('div');
            item.className = 'gif-item';

            const img = document.createElement('img');
            img.src = fav.url;
            img.alt = 'Favorite GIF';
            img.loading = 'lazy';

            // Favorite button (always active)
            const favoriteBtn = document.createElement('button');
            favoriteBtn.className = 'gif-favorite-btn active';
            favoriteBtn.innerHTML = '⭐';
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFavorite(fav.url);
                item.remove();

                // Show empty state if no more favorites
                if (this.favorites.length === 0) {
                    this.showEmptyState('No favorite GIFs yet');
                }
            });

            item.appendChild(img);
            item.appendChild(favoriteBtn);

            // Click to select
            item.addEventListener('click', () => {
                this.selectGif(fav.url);
            });

            this.elements.grid.appendChild(item);
        });
    }

    /**
     * Toggle favorite
     */
    toggleFavorite(gifUrl, gifData) {
        if (this.isFavorite(gifUrl)) {
            this.removeFavorite(gifUrl);
        } else {
            this.addFavorite(gifUrl, gifData);
        }
    }

    /**
     * Add to favorites
     */
    addFavorite(gifUrl, gifData) {
        this.favorites.push({
            url: gifUrl,
            description: gifData?.content_description || '',
            addedAt: Date.now()
        });

        this.saveFavorites();
        console.log('[GIF-PICKER] Added to favorites:', gifUrl);
    }

    /**
     * Remove from favorites
     */
    removeFavorite(gifUrl) {
        this.favorites = this.favorites.filter(fav => fav.url !== gifUrl);
        this.saveFavorites();
        console.log('[GIF-PICKER] Removed from favorites:', gifUrl);
    }

    /**
     * Check if GIF is favorite
     */
    isFavorite(gifUrl) {
        return this.favorites.some(fav => fav.url === gifUrl);
    }

    /**
     * Load favorites from localStorage
     */
    loadFavorites() {
        try {
            const stored = localStorage.getItem('gif_favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[GIF-PICKER] Failed to load favorites:', error);
            return [];
        }
    }

    /**
     * Save favorites to localStorage
     */
    saveFavorites() {
        try {
            localStorage.setItem('gif_favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error('[GIF-PICKER] Failed to save favorites:', error);
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        if (this.elements.grid) {
            this.elements.grid.innerHTML = '<div class="gif-loading">🔄 Loading GIFs...</div>';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        // Loading is replaced by GIFs or empty state
    }

    /**
     * Show empty state
     */
    showEmptyState(message) {
        if (this.elements.grid) {
            this.elements.grid.innerHTML = `
                <div class="gif-empty-state">
                    <div class="gif-empty-icon">🎬</div>
                    <div class="gif-empty-text">${message}</div>
                </div>
            `;
        }
    }

    /**
     * Destroy GIF picker
     */
    destroy() {
        this.hide();
        console.log('[GIF-PICKER] GIF picker destroyed');
    }
}

/**
 * Factory function to create GIF picker
 */
export function createGIFPicker(config) {
    return new GIFPicker(config);
}
