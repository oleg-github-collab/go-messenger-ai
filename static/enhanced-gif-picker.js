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
                    <h3>🎬 Choose a GIF</h3>
                    <button class="enhanced-gif-close" id="gifCloseBtn">✕</button>
                </div>

                <div class="enhanced-gif-search">
                    <input
                        type="text"
                        id="gifSearchInput"
                        placeholder="Search for GIFs..."
                        autocomplete="off"
                    />
                    <button id="gifSearchBtn">🔍</button>
                </div>

                <div class="enhanced-gif-categories" id="gifCategories"></div>

                <div class="enhanced-gif-results" id="gifResults">
                    <div class="enhanced-gif-loading">
                        <div class="spinner"></div>
                        <p>Loading GIFs...</p>
                    </div>
                </div>

                <div class="enhanced-gif-footer">
                    <p>Powered by <strong>Tenor</strong></p>
                    <button id="gifLoadMore" style="display: none;">Load More</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.modal);

        // Add event listeners
        document.getElementById('gifCloseBtn').addEventListener('click', () => this.close());
        document.getElementById('gifBackdrop').addEventListener('click', () => this.close());
        document.getElementById('gifSearchBtn').addEventListener('click', () => this.search());
        document.getElementById('gifSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
        document.getElementById('gifLoadMore').addEventListener('click', () => this.loadMore());

        // Render categories
        this.renderCategories();

        // Add CSS
        this.injectStyles();
    }

    renderCategories() {
        const categoriesEl = document.getElementById('gifCategories');
        categoriesEl.innerHTML = this.trendingCategories.map(cat => `
            <button class="gif-category-btn" data-query="${cat.query}">
                <span class="category-emoji">${cat.emoji}</span>
                <span class="category-name">${cat.name}</span>
            </button>
        `).join('');

        // Add click handlers
        categoriesEl.querySelectorAll('.gif-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.query;
                document.getElementById('gifSearchInput').value = query;
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
                animation: fadeIn 0.2s ease;
            }

            .enhanced-gif-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
            }

            .enhanced-gif-container {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 90%;
                max-width: 700px;
                max-height: 90vh;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .enhanced-gif-header {
                padding: 20px;
                background: rgba(255, 255, 255, 0.05);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .enhanced-gif-header h3 {
                margin: 0;
                font-size: 20px;
                color: white;
            }

            .enhanced-gif-close {
                width: 36px;
                height: 36px;
                border: none;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-radius: 50%;
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .enhanced-gif-close:hover {
                background: rgba(255, 68, 68, 0.3);
                transform: scale(1.1);
            }

            .enhanced-gif-search {
                padding: 20px;
                display: flex;
                gap: 10px;
            }

            #gifSearchInput {
                flex: 1;
                padding: 12px 16px;
                border: 2px solid rgba(255, 255, 255, 0.1);
                background: rgba(255, 255, 255, 0.05);
                color: white;
                border-radius: 12px;
                font-size: 15px;
                outline: none;
                transition: all 0.2s;
            }

            #gifSearchInput:focus {
                border-color: #667eea;
                background: rgba(255, 255, 255, 0.08);
            }

            #gifSearchBtn {
                padding: 12px 20px;
                border: none;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.2s;
            }

            #gifSearchBtn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .enhanced-gif-categories {
                padding: 0 20px 15px;
                display: flex;
                gap: 8px;
                overflow-x: auto;
                scrollbar-width: thin;
            }

            .enhanced-gif-categories::-webkit-scrollbar {
                height: 6px;
            }

            .enhanced-gif-categories::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 3px;
            }

            .gif-category-btn {
                padding: 8px 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                background: rgba(255, 255, 255, 0.05);
                color: white;
                border-radius: 20px;
                font-size: 14px;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .gif-category-btn:hover {
                background: rgba(102, 126, 234, 0.3);
                border-color: #667eea;
                transform: translateY(-2px);
            }

            .category-emoji {
                font-size: 16px;
            }

            .enhanced-gif-results {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 12px;
                align-content: start;
            }

            .gif-item {
                position: relative;
                border-radius: 12px;
                overflow: hidden;
                cursor: pointer;
                aspect-ratio: 1;
                background: rgba(255, 255, 255, 0.05);
                transition: all 0.2s;
            }

            .gif-item:hover {
                transform: scale(1.05);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            }

            .gif-item img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .gif-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.2s;
            }

            .gif-item:hover .gif-overlay {
                opacity: 1;
            }

            .gif-overlay span {
                color: white;
                font-weight: 600;
                font-size: 14px;
            }

            .enhanced-gif-loading,
            .no-gifs,
            .gif-error {
                grid-column: 1 / -1;
                text-align: center;
                padding: 40px;
                color: rgba(255, 255, 255, 0.6);
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
            }

            .enhanced-gif-footer {
                padding: 16px 20px;
                background: rgba(255, 255, 255, 0.05);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: rgba(255, 255, 255, 0.5);
                font-size: 13px;
            }

            #gifLoadMore {
                padding: 8px 20px;
                border: 1px solid rgba(102, 126, 234, 0.5);
                background: rgba(102, 126, 234, 0.2);
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.2s;
            }

            #gifLoadMore:hover:not(:disabled) {
                background: rgba(102, 126, 234, 0.4);
                transform: scale(1.05);
            }

            #gifLoadMore:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            @media (max-width: 768px) {
                .enhanced-gif-container {
                    width: 95%;
                    max-height: 85vh;
                }

                .enhanced-gif-results {
                    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                    gap: 8px;
                }

                .gif-category-btn {
                    font-size: 12px;
                    padding: 6px 12px;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize global instance
window.enhancedGIFPicker = new EnhancedGIFPicker();
console.log('[GIF-PICKER] ✅ Enhanced GIF Picker ready');
