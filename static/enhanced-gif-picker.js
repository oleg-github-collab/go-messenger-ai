// Enhanced GIF Picker with Tenor API integration
// Provides better GIF search and selection

class EnhancedGIFPicker {
    constructor() {
        this.apiKey = 'AIzaSyAi4L_8YQPI3WvK4nq3nk5jC5VrVkjV5tU'; // Tenor API key (public)
        this.limit = 20; // Show more GIFs
        this.currentQuery = '';
        this.offset = 0;
        this.modal = null;
        this.onSelectCallback = null;

        this.trendingCategories = [
            { name: 'Happy', emoji: '😊', query: 'happy celebration' },
            { name: 'Love', emoji: '❤️', query: 'love heart' },
            { name: 'Funny', emoji: '😂', query: 'funny laugh' },
            { name: 'Dance', emoji: '💃', query: 'dance party' },
            { name: 'Sad', emoji: '😢', query: 'sad crying' },
            { name: 'Angry', emoji: '😠', query: 'angry mad' },
            { name: 'Surprised', emoji: '😮', query: 'surprised shocked' },
            { name: 'Thumbs Up', emoji: '👍', query: 'thumbs up yes' },
            { name: 'Clap', emoji: '👏', query: 'clapping applause' },
            { name: 'Fire', emoji: '🔥', query: 'fire lit' },
            { name: 'Cool', emoji: '😎', query: 'cool awesome' },
            { name: 'Think', emoji: '🤔', query: 'thinking hmm' }
        ];

        console.log('[GIF-PICKER] Enhanced GIF Picker initialized');
    }

    show(onSelect) {
        this.onSelectCallback = onSelect;
        this.createModal();
        this.loadTrending();
    }

    createModal() {
        // Remove existing modal if any
        if (this.modal) {
            this.modal.remove();
        }

        this.modal = document.createElement('div');
        this.modal.className = 'enhanced-gif-modal';
        this.modal.innerHTML = `
            <div class="enhanced-gif-backdrop" id="gifBackdrop"></div>
            <div class="enhanced-gif-container">
                <div class="enhanced-gif-header">
                    <div class="header-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 13v-2h-4V9h4V7h-4V5h4V3h-6v10h2v-6h2v6h2zm-8-2H8V9h2V7H8V5h2V3H6v10h4v-2zm-4 6v-2h12v2H6zm0 4v-2h12v2H6z"/>
                        </svg>
                        <span>GIF Picker</span>
                    </div>
                    <button class="enhanced-gif-close" id="gifCloseBtn" title="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div class="enhanced-gif-search">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                        type="text"
                        id="gifSearchInput"
                        placeholder="Search thousands of GIFs..."
                        autocomplete="off"
                    />
                    <button id="gifClearBtn" class="clear-btn" style="display: none;" title="Clear">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </button>
                </div>

                <div class="enhanced-gif-categories" id="gifCategories"></div>

                <div class="enhanced-gif-results" id="gifResults">
                    <div class="enhanced-gif-loading">
                        <div class="spinner"></div>
                        <p>Loading trending GIFs...</p>
                    </div>
                </div>

                <button id="gifLoadMore" class="load-more-btn" style="display: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    <span>Load More</span>
                </button>

                <div class="enhanced-gif-footer">
                    <span>Powered by</span>
                    <strong>Tenor</strong>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Add event listeners
        document.getElementById('gifCloseBtn').addEventListener('click', () => this.close());
        document.getElementById('gifBackdrop').addEventListener('click', () => this.close());

        const searchInput = document.getElementById('gifSearchInput');
        const clearBtn = document.getElementById('gifClearBtn');

        searchInput.addEventListener('input', (e) => {
            clearBtn.style.display = e.target.value ? 'flex' : 'none';
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.search();
            }
        });

        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            this.loadTrending();
        });

        document.getElementById('gifLoadMore').addEventListener('click', () => this.loadMore());

        // Render categories
        this.renderCategories();

        // Add CSS
        this.injectStyles();

        // Focus search input
        setTimeout(() => searchInput.focus(), 100);
    }

    renderCategories() {
        const categoriesEl = document.getElementById('gifCategories');
        categoriesEl.innerHTML = this.trendingCategories.map(cat => `
            <button class="gif-category-btn" data-query="${cat.query}" title="${cat.name}">
                <span class="category-emoji">${cat.emoji}</span>
            </button>
        `).join('');

        // Add click handlers with animation
        categoriesEl.querySelectorAll('.gif-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all
                categoriesEl.querySelectorAll('.gif-category-btn').forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');

                const query = btn.dataset.query;
                this.searchByQuery(query);
            });
        });
    }

    async loadTrending() {
        this.showLoading();
        try {
            const response = await fetch(
                `https://tenor.googleapis.com/v2/featured?key=${this.apiKey}&limit=${this.limit}&media_filter=gif`
            );
            const data = await response.json();
            this.displayResults(data.results);
        } catch (error) {
            console.error('[GIF-PICKER] Error loading trending:', error);
            this.showError('Failed to load trending GIFs');
        }
    }

    async search() {
        const query = document.getElementById('gifSearchInput').value.trim();
        if (!query) {
            this.loadTrending();
            return;
        }
        this.searchByQuery(query);
    }

    async searchByQuery(query) {
        this.currentQuery = query;
        this.offset = 0;
        this.showLoading();

        try {
            const response = await fetch(
                `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${this.apiKey}&limit=${this.limit}&media_filter=gif`
            );
            const data = await response.json();
            this.displayResults(data.results);
        } catch (error) {
            console.error('[GIF-PICKER] Error searching:', error);
            this.showError('Failed to search GIFs');
        }
    }

    async loadMore() {
        if (!this.currentQuery) return;

        this.offset += this.limit;
        const loadMoreBtn = document.getElementById('gifLoadMore');
        loadMoreBtn.textContent = 'Loading...';
        loadMoreBtn.disabled = true;

        try {
            const response = await fetch(
                `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(this.currentQuery)}&key=${this.apiKey}&limit=${this.limit}&pos=${this.offset}&media_filter=gif`
            );
            const data = await response.json();
            this.appendResults(data.results);
        } catch (error) {
            console.error('[GIF-PICKER] Error loading more:', error);
        } finally {
            loadMoreBtn.textContent = 'Load More';
            loadMoreBtn.disabled = false;
        }
    }

    displayResults(gifs) {
        const resultsEl = document.getElementById('gifResults');
        const loadMoreBtn = document.getElementById('gifLoadMore');

        if (!gifs || gifs.length === 0) {
            resultsEl.innerHTML = '<div class="no-gifs">No GIFs found 😢</div>';
            loadMoreBtn.style.display = 'none';
            return;
        }

        resultsEl.innerHTML = gifs.map(gif => {
            const url = gif.media_formats.tinygif?.url || gif.media_formats.gif?.url;
            return `
                <div class="gif-item" data-url="${url}">
                    <img src="${url}" alt="${gif.content_description}" loading="lazy"/>
                    <div class="gif-overlay">
                        <span>Select</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        resultsEl.querySelectorAll('.gif-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                this.selectGIF(url);
            });
        });

        loadMoreBtn.style.display = 'block';
    }

    appendResults(gifs) {
        const resultsEl = document.getElementById('gifResults');

        if (!gifs || gifs.length === 0) {
            return;
        }

        const newGIFs = gifs.map(gif => {
            const url = gif.media_formats.tinygif?.url || gif.media_formats.gif?.url;
            return `
                <div class="gif-item" data-url="${url}">
                    <img src="${url}" alt="${gif.content_description}" loading="lazy"/>
                    <div class="gif-overlay">
                        <span>Select</span>
                    </div>
                </div>
            `;
        }).join('');

        resultsEl.insertAdjacentHTML('beforeend', newGIFs);

        // Add click handlers to new items
        const newItems = resultsEl.querySelectorAll('.gif-item:not([data-bound])');
        newItems.forEach(item => {
            item.dataset.bound = 'true';
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                this.selectGIF(url);
            });
        });
    }

    selectGIF(url) {
        console.log('[GIF-PICKER] GIF selected:', url);
        if (this.onSelectCallback) {
            this.onSelectCallback(url);
        }
        this.close();
    }

    showLoading() {
        const resultsEl = document.getElementById('gifResults');
        resultsEl.innerHTML = `
            <div class="enhanced-gif-loading">
                <div class="spinner"></div>
                <p>Loading GIFs...</p>
            </div>
        `;
    }

    showError(message) {
        const resultsEl = document.getElementById('gifResults');
        resultsEl.innerHTML = `<div class="gif-error">❌ ${message}</div>`;
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
        if (document.getElementById('enhanced-gif-styles')) return;

        const style = document.createElement('style');
        style.id = 'enhanced-gif-styles';
        style.textContent = `
            .enhanced-gif-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 99999;
                animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .enhanced-gif-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.88);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
            }

            .enhanced-gif-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 720px;
                max-height: 92vh;
                background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                border-radius: 24px;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .enhanced-gif-header {
                padding: 20px 24px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }

            .header-title {
                display: flex;
                align-items: center;
                gap: 12px;
                color: white;
                font-size: 18px;
                font-weight: 600;
            }

            .header-title svg {
                color: #667eea;
                filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.4));
            }

            .enhanced-gif-close {
                width: 38px;
                height: 38px;
                padding: 0;
                border: none;
                background: rgba(255, 255, 255, 0.08);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .enhanced-gif-close:hover {
                background: rgba(255, 68, 68, 0.35);
                transform: scale(1.08) rotate(90deg);
                box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
            }

            .enhanced-gif-close:active {
                transform: scale(0.95) rotate(90deg);
            }

            .enhanced-gif-search {
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                position: relative;
            }

            .enhanced-gif-search .search-icon {
                position: absolute;
                left: 32px;
                color: rgba(255, 255, 255, 0.4);
                pointer-events: none;
                z-index: 1;
            }

            #gifSearchInput {
                flex: 1;
                padding: 14px 16px 14px 46px;
                border: 2px solid rgba(255, 255, 255, 0.12);
                background: rgba(255, 255, 255, 0.06);
                color: white;
                border-radius: 14px;
                font-size: 15px;
                outline: none;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }

            #gifSearchInput::placeholder {
                color: rgba(255, 255, 255, 0.35);
            }

            #gifSearchInput:focus {
                border-color: #667eea;
                background: rgba(255, 255, 255, 0.1);
                box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
            }

            #gifSearchInput:focus + .clear-btn {
                opacity: 1;
            }

            .clear-btn {
                position: absolute;
                right: 28px;
                width: 32px;
                height: 32px;
                padding: 0;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.7;
            }

            .clear-btn:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: scale(1.1);
                opacity: 1;
            }

            .clear-btn:active {
                transform: scale(0.95);
            }

            .enhanced-gif-categories {
                padding: 0 20px 16px;
                display: flex;
                gap: 10px;
                overflow-x: auto;
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            }

            .enhanced-gif-categories::-webkit-scrollbar {
                height: 6px;
            }

            .enhanced-gif-categories::-webkit-scrollbar-track {
                background: transparent;
            }

            .enhanced-gif-categories::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 3px;
            }

            .enhanced-gif-categories::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.25);
            }

            .gif-category-btn {
                padding: 10px 14px;
                min-width: 48px;
                border: 2px solid rgba(255, 255, 255, 0.15);
                background: rgba(255, 255, 255, 0.06);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                position: relative;
            }

            .gif-category-btn:hover {
                background: rgba(102, 126, 234, 0.25);
                border-color: rgba(102, 126, 234, 0.6);
                transform: translateY(-3px) scale(1.05);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
            }

            .gif-category-btn.active {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-color: #667eea;
                transform: translateY(-3px) scale(1.08);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
            }

            .gif-category-btn:active {
                transform: translateY(-1px) scale(1.02);
            }

            .category-emoji {
                font-size: 22px;
                line-height: 1;
            }

            .enhanced-gif-results {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                gap: 14px;
                align-content: start;
                scrollbar-width: thin;
                scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
            }

            .enhanced-gif-results::-webkit-scrollbar {
                width: 8px;
            }

            .enhanced-gif-results::-webkit-scrollbar-track {
                background: transparent;
            }

            .enhanced-gif-results::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 4px;
            }

            .enhanced-gif-results::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.25);
            }

            .gif-item {
                position: relative;
                border-radius: 14px;
                overflow: hidden;
                cursor: pointer;
                aspect-ratio: 1;
                background: rgba(255, 255, 255, 0.06);
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                border: 2px solid transparent;
            }

            .gif-item:hover {
                transform: translateY(-4px) scale(1.03);
                box-shadow: 0 12px 28px rgba(102, 126, 234, 0.5);
                border-color: rgba(102, 126, 234, 0.4);
            }

            .gif-item:active {
                transform: translateY(-2px) scale(1.01);
            }

            .gif-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            .gif-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.85) 0%, rgba(118, 75, 162, 0.85) 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .gif-item:hover .gif-overlay {
                opacity: 1;
            }

            .gif-overlay span {
                color: white;
                font-weight: 600;
                font-size: 15px;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            .enhanced-gif-loading,
            .no-gifs,
            .gif-error {
                grid-column: 1 / -1;
                text-align: center;
                padding: 50px 20px;
                color: rgba(255, 255, 255, 0.5);
            }

            .enhanced-gif-loading p,
            .no-gifs,
            .gif-error {
                font-size: 15px;
                margin: 0;
            }

            .spinner {
                width: 44px;
                height: 44px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 0.7s linear infinite;
                margin: 0 auto 20px;
            }

            #gifLoadMore {
                margin: 0 20px 20px;
                padding: 14px 24px;
                border: 2px solid rgba(102, 126, 234, 0.4);
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
                color: white;
                border-radius: 14px;
                cursor: pointer;
                font-size: 15px;
                font-weight: 600;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            #gifLoadMore svg {
                transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            }

            #gifLoadMore:hover:not(:disabled) {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
                border-color: #667eea;
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }

            #gifLoadMore:hover:not(:disabled) svg {
                transform: translateY(2px);
            }

            #gifLoadMore:active:not(:disabled) {
                transform: translateY(0);
            }

            #gifLoadMore:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }

            .enhanced-gif-footer {
                padding: 18px 24px;
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 6px;
                color: rgba(255, 255, 255, 0.4);
                font-size: 13px;
            }

            .enhanced-gif-footer strong {
                color: #667eea;
                font-weight: 700;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translate(-50%, -45%);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%);
                }
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            @media (max-width: 768px) {
                .enhanced-gif-container {
                    width: 96%;
                    max-height: 88vh;
                    border-radius: 20px;
                }

                .enhanced-gif-header {
                    padding: 16px 18px;
                }

                .header-title {
                    font-size: 16px;
                    gap: 10px;
                }

                .header-title svg {
                    width: 20px;
                    height: 20px;
                }

                .enhanced-gif-close {
                    width: 34px;
                    height: 34px;
                }

                .enhanced-gif-search {
                    padding: 12px 16px;
                }

                #gifSearchInput {
                    padding: 12px 14px 12px 42px;
                    font-size: 14px;
                }

                .clear-btn {
                    right: 24px;
                }

                .enhanced-gif-categories {
                    padding: 0 16px 14px;
                    gap: 8px;
                }

                .gif-category-btn {
                    padding: 8px 12px;
                    min-width: 44px;
                }

                .category-emoji {
                    font-size: 20px;
                }

                .enhanced-gif-results {
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                    gap: 10px;
                    padding: 16px;
                }

                #gifLoadMore {
                    margin: 0 16px 16px;
                    padding: 12px 20px;
                    font-size: 14px;
                }

                .enhanced-gif-footer {
                    padding: 14px 18px;
                }
            }

            @media (max-width: 480px) {
                .enhanced-gif-results {
                    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
                    gap: 8px;
                }

                .gif-category-btn {
                    padding: 7px 10px;
                    min-width: 40px;
                }

                .category-emoji {
                    font-size: 18px;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Export class to global scope
window.EnhancedGIFPicker = EnhancedGIFPicker;

// Initialize global instance
window.enhancedGIFPicker = new EnhancedGIFPicker();
console.log('[GIF-PICKER] ✅ Enhanced GIF Picker ready');
