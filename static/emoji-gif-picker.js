// emoji-gif-picker.js - Universal Emoji/GIF Picker for all chat types

class EmojiGifPicker {
    constructor(options) {
        this.panel = document.getElementById(options.panelId);
        this.emojiBtn = document.getElementById(options.emojiBtnId);
        this.gifBtn = document.getElementById(options.gifBtnId);
        this.closeBtn = document.getElementById(options.closeBtnId);
        this.messageInput = document.getElementById(options.messageInputId);
        this.sendCallback = options.sendCallback;

        this.emojiContent = this.panel.querySelector('#emojiContent');
        this.gifContent = this.panel.querySelector('#gifContent');
        this.emojiGrid = this.panel.querySelector('#emojiGrid');
        this.gifGrid = this.panel.querySelector('#gifGrid');
        this.gifSearch = this.panel.querySelector('#gifSearch');
        this.gifCategoriesContainer = this.panel.querySelector('#gifCategories');

        this.currentTab = 'emoji';
        this.tenorApiKey = 'AIzaSyDOXJT8Y-cVS4k8gQ2g31vLx5YqZSPJLwA';

        this.init();
    }

    init() {
        console.log('[EMOJI-GIF] Initializing picker...');
        this.setupEventListeners();
        this.loadEmojis();
        this.loadGifCategories();
    }

    setupEventListeners() {
        // Open emoji picker
        if (this.emojiBtn) {
            this.emojiBtn.addEventListener('click', () => {
                console.log('[EMOJI-GIF] Emoji button clicked');
                this.openPicker('emoji');
            });
        }

        // Open GIF picker
        if (this.gifBtn) {
            this.gifBtn.addEventListener('click', () => {
                console.log('[EMOJI-GIF] GIF button clicked');
                this.openPicker('gif');
            });
        }

        // Close picker
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.closePicker();
            });
        }

        // Tab switching
        const tabs = this.panel.querySelectorAll('.emoji-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabType = tab.dataset.tab;
                this.switchTab(tabType);
            });
        });

        // Emoji category switching
        const categories = this.panel.querySelectorAll('.emoji-category');
        categories.forEach(cat => {
            cat.addEventListener('click', () => {
                categories.forEach(c => c.classList.remove('active'));
                cat.classList.add('active');
                const category = cat.dataset.category;
                this.loadEmojis(category);
            });
        });

        // GIF search
        if (this.gifSearch) {
            let searchTimeout;
            this.gifSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchGifs(e.target.value);
                }, 500);
            });
        }
    }

    openPicker(tab = 'emoji') {
        console.log('[EMOJI-GIF] Opening picker, tab:', tab);
        this.panel.classList.add('active');
        this.switchTab(tab);
    }

    closePicker() {
        this.panel.classList.remove('active');
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        const tabs = this.panel.querySelectorAll('.emoji-tab');
        tabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Show/hide content
        if (tab === 'emoji') {
            this.emojiContent.style.display = 'block';
            this.gifContent.style.display = 'none';
        } else {
            this.emojiContent.style.display = 'none';
            this.gifContent.style.display = 'block';
            if (!this.gifGrid.hasChildNodes()) {
                this.loadTrendingGifs();
            }
        }
    }

    loadEmojis(category = 'smileys') {
        const emojiSets = {
            smileys: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐'],
            gestures: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄'],
            people: ['👶','👧','🧒','👦','👩','🧑','👨','👩‍🦱','🧑‍🦱','👨‍🦱','👩‍🦰','🧑‍🦰','👨‍🦰','👱‍♀️','👱','👱‍♂️','👩‍🦳','🧑‍🦳','👨‍🦳','👩‍🦲','🧑‍🦲','👨‍🦲','🧔','🧔‍♀️','🧔‍♂️','👵','🧓','👴','👲','👳‍♀️','👳','👳‍♂️','🧕','👮‍♀️','👮','👮‍♂️','👷‍♀️','👷','👷‍♂️','💂‍♀️','💂','💂‍♂️','🕵️‍♀️','🕵️','🕵️‍♂️'],
            animals: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔'],
            food: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🫒','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊'],
            travel: ['🚗','🚕','🚙','🚌','🚎','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍','🛺','🚨','🚔','🚍','🚘','🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆','🚇','🚊','🚉','✈️','🛫','🛬','🛩','💺','🛰','🚀','🛸','🚁','🛶','⛵','🚤','🛥','🛳','⛴','🚢','⚓','⛽','🚧','🚦','🚥','🚏','🗺','🗿','🗽','🗼','🏰','🏯','🏟','🎡','🎢','🎠','⛲','⛱','🏖','🏝','🏜','🌋','⛰','🏔','🗻','🏕','⛺','🛖','🏠','🏡','🏘','🏚','🏗','🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛','⛪','🕌','🕍','🛕','🕋','⛩','🛤','🛣','🗾','🎑','🏞','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙','🌃','🌌','🌉','🌁'],
            objects: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏','🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹','🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸','🥌','🎿','⛷','🏂','🪂','🏋️','🤼','🤸','🤺','⛹️','🤾','🏌️','🏇','🧘','🏊','🤽','🏄','🚣','🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷','🎺','🪗','🎸','🪕','🎻','🎲','♟','🎯','🎳','🎮','🎰','🧩'],
            symbols: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉','☸️','✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','🆔','⚛️','🉑','☢️','☣️','📴','📳','🈶','🈚','🈸','🈺','🈷️','✴️','🆚','💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲','🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕','🛑','⛔','📛','🚫','💯','💢','♨️','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','〽️','⚠️','🚸','🔱','⚜️','🔰','♻️','✅','🈯','💹','❇️','✳️','❎','🌐','💠','Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗','🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺','🚼','⚧','🚻','🚮','🎦','📶','🈁','🔣','ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟']
        };

        const emojis = emojiSets[category] || emojiSets.smileys;
        this.emojiGrid.innerHTML = '';

        emojis.forEach(emoji => {
            const item = document.createElement('div');
            item.className = 'emoji-item';
            item.textContent = emoji;
            item.addEventListener('click', () => {
                this.insertEmoji(emoji);
            });
            this.emojiGrid.appendChild(item);
        });
    }

    insertEmoji(emoji) {
        if (this.messageInput) {
            const cursorPos = this.messageInput.selectionStart || 0;
            const currentValue = this.messageInput.value;
            this.messageInput.value = currentValue.substring(0, cursorPos) + emoji + currentValue.substring(cursorPos);
            this.messageInput.focus();
            this.messageInput.selectionStart = this.messageInput.selectionEnd = cursorPos + emoji.length;
        }
    }

    loadGifCategories() {
        const categories = [
            { emoji: '😊', label: 'Happy', query: 'happy excited' },
            { emoji: '😂', label: 'Funny', query: 'funny laugh' },
            { emoji: '❤️', label: 'Love', query: 'love heart' },
            { emoji: '💃', label: 'Dance', query: 'dance party' },
            { emoji: '😢', label: 'Sad', query: 'sad cry' },
            { emoji: '😮', label: 'Wow', query: 'wow shocked amazed' },
            { emoji: '👏', label: 'Applause', query: 'clap applause' },
            { emoji: '🎉', label: 'Party', query: 'party celebrate' }
        ];

        this.gifCategoriesContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'gif-category-btn';
            btn.textContent = `${cat.emoji} ${cat.label}`;
            btn.addEventListener('click', () => {
                this.searchGifs(cat.query);
                this.gifSearch.value = '';
            });
            this.gifCategoriesContainer.appendChild(btn);
        });
    }

    async loadTrendingGifs() {
        try {
            const limit = 30;
            const url = `https://tenor.googleapis.com/v2/featured?key=${this.tenorApiKey}&limit=${limit}&media_filter=gif`;

            const response = await fetch(url);
            const data = await response.json();

            this.displayGifs(data.results);
        } catch (error) {
            console.error('[EMOJI-GIF] Failed to load trending GIFs:', error);
        }
    }

    async searchGifs(query) {
        if (!query || query.trim() === '') {
            this.loadTrendingGifs();
            return;
        }

        try {
            const limit = 30;
            const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${this.tenorApiKey}&limit=${limit}&media_filter=gif`;

            const response = await fetch(url);
            const data = await response.json();

            this.displayGifs(data.results);
        } catch (error) {
            console.error('[EMOJI-GIF] Failed to search GIFs:', error);
        }
    }

    displayGifs(gifs) {
        this.gifGrid.innerHTML = '';

        if (!gifs || gifs.length === 0) {
            this.gifGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: rgba(255,255,255,0.5);">No GIFs found</div>';
            return;
        }

        gifs.forEach(gif => {
            const gifUrl = gif.media_formats.tinygif.url;

            const item = document.createElement('div');
            item.className = 'gif-item';

            const img = document.createElement('img');
            img.src = gifUrl;
            img.alt = gif.content_description || 'GIF';
            img.loading = 'lazy';

            item.appendChild(img);
            item.addEventListener('click', () => {
                this.sendGif(gifUrl);
            });

            this.gifGrid.appendChild(item);
        });
    }

    sendGif(gifUrl) {
        console.log('[EMOJI-GIF] Sending GIF:', gifUrl);
        if (this.sendCallback) {
            this.sendCallback(`[GIF]${gifUrl}`);
            this.closePicker();
        }
    }
}

// Export for use in other scripts
window.EmojiGifPicker = EmojiGifPicker;
