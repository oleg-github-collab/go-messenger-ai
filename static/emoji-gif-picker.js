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
        this.tenorApiKey = ''; // Disabled - using custom GIF library

        // Custom GIF library (popular reactions and emotions)
        this.gifLibrary = {
            'happy': [
                'https://media.giphy.com/media/XR9Dp54ZC4dji/giphy.gif',
                'https://media.giphy.com/media/26gsjCZpPolPr3sBy/giphy.gif',
                'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif'
            ],
            'funny': [
                'https://media.giphy.com/media/3o7527pa7qs9kCG78A/giphy.gif',
                'https://media.giphy.com/media/Q7LP0tm86sBWIqjFCL/giphy.gif',
                'https://media.giphy.com/media/RdKjAkFTNZkWUGyRXF/giphy.gif'
            ],
            'love': [
                'https://media.giphy.com/media/R6gvnAxj2ISzJdbA63/giphy.gif',
                'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif',
                'https://media.giphy.com/media/42YlR8u9gV5Cw/giphy.gif'
            ],
            'dance': [
                'https://media.giphy.com/media/l41lGvinEgARjB2HC/giphy.gif',
                'https://media.giphy.com/media/BlVnrxJgTGsUw/giphy.gif',
                'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif'
            ],
            'sad': [
                'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
                'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
                'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif'
            ],
            'wow': [
                'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
                'https://media.giphy.com/media/3osxYCsLd9qgsgqpGw/giphy.gif',
                'https://media.giphy.com/media/3o7527pXtcvxqbKV7a/giphy.gif'
            ],
            'clap': [
                'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif',
                'https://media.giphy.com/media/ZdUnQS4AXEl1AERdil/giphy.gif',
                'https://media.giphy.com/media/fnK0jeA8vIh2QLq3IZ/giphy.gif'
            ],
            'party': [
                'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
                'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
                'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif'
            ]
        };

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
            { emoji: '😊', label: 'Happy', key: 'happy' },
            { emoji: '😂', label: 'Funny', key: 'funny' },
            { emoji: '❤️', label: 'Love', key: 'love' },
            { emoji: '💃', label: 'Dance', key: 'dance' },
            { emoji: '😢', label: 'Sad', key: 'sad' },
            { emoji: '😮', label: 'Wow', key: 'wow' },
            { emoji: '👏', label: 'Applause', key: 'clap' },
            { emoji: '🎉', label: 'Party', key: 'party' }
        ];

        this.gifCategoriesContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'gif-category-btn';
            btn.textContent = `${cat.emoji} ${cat.label}`;
            btn.addEventListener('click', () => {
                this.loadGifsFromLibrary(cat.key);
                this.gifSearch.value = '';
            });
            this.gifCategoriesContainer.appendChild(btn);
        });

        // Load happy GIFs by default
        this.loadGifsFromLibrary('happy');
    }

    loadGifsFromLibrary(category) {
        console.log('[EMOJI-GIF] Loading GIFs for category:', category);
        const gifs = this.gifLibrary[category] || this.gifLibrary['happy'];

        this.gifGrid.innerHTML = '';
        gifs.forEach(gifUrl => {
            const img = document.createElement('img');
            img.src = gifUrl;
            img.className = 'gif-item';
            img.alt = category + ' gif';
            img.loading = 'lazy';
            img.addEventListener('click', () => {
                this.sendGif(gifUrl);
            });
            this.gifGrid.appendChild(img);
        });

        console.log('[EMOJI-GIF] Loaded', gifs.length, 'GIFs');
    }

    async searchGifs(query) {
        console.log('[EMOJI-GIF] Searching for:', query);

        if (!query || query.trim() === '') {
            this.loadGifsFromLibrary('happy');
            return;
        }

        // Search in library by category name
        const queryLower = query.toLowerCase();
        let foundCategory = null;

        for (const [category, gifs] of Object.entries(this.gifLibrary)) {
            if (category.includes(queryLower) || queryLower.includes(category)) {
                foundCategory = category;
                break;
            }
        }

        if (foundCategory) {
            this.loadGifsFromLibrary(foundCategory);
        } else {
            // Show all GIFs if no match
            this.gifGrid.innerHTML = '';
            for (const [category, gifs] of Object.entries(this.gifLibrary)) {
                gifs.forEach(gifUrl => {
                    const img = document.createElement('img');
                    img.src = gifUrl;
                    img.className = 'gif-item';
                    img.alt = category + ' gif';
                    img.loading = 'lazy';
                    img.addEventListener('click', () => {
                        this.sendGif(gifUrl);
                    });
                    this.gifGrid.appendChild(img);
                });
            }
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
