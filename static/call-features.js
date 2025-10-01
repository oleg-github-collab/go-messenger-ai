// Additional features for call interface: Settings, Emoji, Adaptive Quality

// Emoji data
const emojiData = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥'],
    gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏'],
    people: ['👨', '👩', '🧑', '👦', '👧', '🧒', '👶', '👴', '👵', '🧓', '👨‍⚕️', '👩‍⚕️', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻', '👨‍🎤', '👩‍🎤', '👨‍🎨', '👩‍🎨'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗'],
    food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🥚', '🍳', '🧇', '🥞', '🧈', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧀', '🍖', '🍗', '🥩', '🍤', '🍱', '🍣'],
    travel: ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡'],
    objects: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸'],
    symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️']
};

// Initialize emoji picker
function initEmojiPicker() {
    const emojiBtn = document.getElementById('emojiBtn');
    const emojiPicker = document.getElementById('emojiPicker');
    const emojiClose = document.getElementById('emojiClose');
    const emojiTabs = document.querySelectorAll('.emoji-tab');
    const emojiCategories = document.querySelectorAll('.emoji-category');
    const emojiGrid = document.getElementById('emojiGrid');
    const messageInput = document.getElementById('messageInput');

    if (!emojiBtn || !emojiPicker) return;

    // Load initial emojis
    loadEmojis('smileys');

    // Toggle picker
    emojiBtn.addEventListener('click', () => {
        emojiPicker.classList.toggle('active');
    });

    emojiClose.addEventListener('click', () => {
        emojiPicker.classList.remove('active');
    });

    // Tab switching
    emojiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            emojiTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const tabType = tab.dataset.tab;
            if (tabType === 'emoji') {
                document.getElementById('emojiContent').style.display = 'block';
                document.getElementById('gifContent').style.display = 'none';
            } else {
                document.getElementById('emojiContent').style.display = 'none';
                document.getElementById('gifContent').style.display = 'block';
                loadGifs('trending');
            }
        });
    });

    // Category switching
    emojiCategories.forEach(cat => {
        cat.addEventListener('click', () => {
            emojiCategories.forEach(c => c.classList.remove('active'));
            cat.classList.add('active');
            loadEmojis(cat.dataset.category);
        });
    });

    // Load emojis function
    function loadEmojis(category) {
        const emojis = emojiData[category] || emojiData.smileys;
        emojiGrid.innerHTML = '';

        emojis.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'emoji-item';
            btn.textContent = emoji;
            btn.addEventListener('click', () => {
                messageInput.value += emoji;
                messageInput.focus();
            });
            emojiGrid.appendChild(btn);
        });
    }

    // GIF search
    const gifSearch = document.getElementById('gifSearch');
    const gifGrid = document.getElementById('gifGrid');
    let gifSearchTimeout;

    if (gifSearch) {
        gifSearch.addEventListener('input', (e) => {
            clearTimeout(gifSearchTimeout);
            gifSearchTimeout = setTimeout(() => {
                const query = e.target.value.trim();
                loadGifs(query || 'trending');
            }, 500);
        });
    }

    // Load GIFs from Tenor API (free)
    async function loadGifs(query) {
        try {
            // Using Tenor's public demo API key
            const apiKey = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
            const limit = 20;
            const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=${limit}`;

            const response = await fetch(url);
            const data = await response.json();

            gifGrid.innerHTML = '';

            if (data.results && data.results.length > 0) {
                data.results.forEach(gif => {
                    const gifUrl = gif.media_formats.tinygif.url;
                    const div = document.createElement('div');
                    div.className = 'gif-item';
                    div.innerHTML = `<img src="${gifUrl}" alt="${gif.content_description}">`;
                    div.addEventListener('click', () => {
                        // Send GIF as message
                        sendGifMessage(gifUrl);
                        emojiPicker.classList.remove('active');
                    });
                    gifGrid.appendChild(div);
                });
            } else {
                gifGrid.innerHTML = '<p style="color: #94a3b8; text-align: center; padding: 20px;">No GIFs found</p>';
            }
        } catch (error) {
            console.error('[EMOJI] Failed to load GIFs:', error);
            gifGrid.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;">Failed to load GIFs</p>';
        }
    }

    function sendGifMessage(gifUrl) {
        // Send GIF URL as message with special marker
        if (window.sendChatMessage) {
            window.sendChatMessage(`[GIF]${gifUrl}`);
        } else {
            const messageInput = document.getElementById('messageInput');
            messageInput.value = `[GIF]${gifUrl}`;
            document.getElementById('sendMessageBtn').click();
        }
    }
}

// Initialize settings panel
function initSettingsPanel() {
    const moreOptionsBtn = document.getElementById('moreOptionsBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsClose = document.getElementById('settingsClose');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const settingsApply = document.getElementById('settingsApply');

    if (!settingsPanel) return;

    // Open settings
    if (moreOptionsBtn) {
        moreOptionsBtn.addEventListener('click', () => {
            settingsPanel.classList.add('active');
            settingsBackdrop.classList.add('active');
            updateConnectionStats();
        });
    }

    // Close settings
    const closeSettings = () => {
        settingsPanel.classList.remove('active');
        settingsBackdrop.classList.remove('active');
    };

    if (settingsClose) settingsClose.addEventListener('click', closeSettings);
    if (settingsBackdrop) settingsBackdrop.addEventListener('click', closeSettings);

    // Apply settings
    if (settingsApply) {
        settingsApply.addEventListener('click', async () => {
            const videoQuality = document.getElementById('videoQualitySelect').value;
            const frameRate = document.getElementById('frameRateSelect').value;
            const audioQuality = document.getElementById('audioQualitySelect').value;
            const echoCancellation = document.getElementById('echoCancellation').checked;
            const noiseSuppression = document.getElementById('noiseSuppression').checked;
            const autoGain = document.getElementById('autoGain').checked;

            console.log('[SETTINGS] Applying:', { videoQuality, frameRate, audioQuality });

            // Apply via WebRTC manager
            if (window.webrtc) {
                // Update audio constraints
                if (window.webrtc.currentConstraints && window.webrtc.currentConstraints.audio) {
                    window.webrtc.currentConstraints.audio.echoCancellation = echoCancellation;
                    window.webrtc.currentConstraints.audio.noiseSuppression = noiseSuppression;
                    window.webrtc.currentConstraints.audio.autoGainControl = autoGain;
                }

                // Handle adaptive quality
                if (videoQuality === 'auto') {
                    // Start adaptive quality
                    if (window.adaptiveQuality) {
                        window.adaptiveQuality.start();
                        console.log('[SETTINGS] Adaptive quality enabled');
                    }
                } else {
                    // Stop adaptive quality and apply manual settings
                    if (window.adaptiveQuality) {
                        window.adaptiveQuality.stop();
                    }
                    const fps = frameRate === 'auto' ? 30 : parseInt(frameRate);
                    await window.webrtc.changeQuality(videoQuality, fps, audioQuality);
                }
            }

            closeSettings();
        });
    }
}

// Update connection stats
async function updateConnectionStats() {
    if (!window.webrtc || !window.webrtc.peerConnection) return;

    const pc = window.webrtc.peerConnection;

    try {
        const stats = await pc.getStats();
        let latency = 0;
        let bitrate = 0;
        let packetLoss = 0;

        stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                latency = report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) : 0;
            }

            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                if (report.bytesReceived && report.timestamp) {
                    bitrate = Math.round((report.bytesReceived * 8) / 1000);
                }
                if (report.packetsLost && report.packetsReceived) {
                    const total = report.packetsLost + report.packetsReceived;
                    packetLoss = total > 0 ? ((report.packetsLost / total) * 100).toFixed(2) : 0;
                }
            }
        });

        document.getElementById('latencyStat').textContent = `${latency} ms`;
        document.getElementById('bitrateStat').textContent = `${bitrate} kbps`;
        document.getElementById('packetLossStat').textContent = `${packetLoss} %`;

    } catch (error) {
        console.error('[STATS] Failed to get stats:', error);
    }
}

// Adaptive quality based on connection
class AdaptiveQuality {
    constructor(webrtc) {
        this.webrtc = webrtc;
        this.enabled = false;
        this.statsInterval = null;
        this.qualityLevels = ['360p', '480p', '720p', '1080p'];
        this.currentQualityIndex = 2; // Start with 720p
        this.degradationPreference = 'maintain-framerate';
    }

    start() {
        if (this.enabled) return;
        this.enabled = true;

        console.log('[ADAPTIVE] Starting adaptive quality');

        this.statsInterval = setInterval(async () => {
            await this.checkConnectionAndAdapt();
        }, 5000); // Check every 5 seconds
    }

    stop() {
        this.enabled = false;
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
    }

    async checkConnectionAndAdapt() {
        if (!this.webrtc || !this.webrtc.peerConnection) return;

        try {
            const stats = await this.webrtc.peerConnection.getStats();
            let packetLoss = 0;
            let latency = 0;
            let jitter = 0;

            stats.forEach(report => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    latency = report.currentRoundTripTime ? report.currentRoundTripTime * 1000 : 0;
                }

                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    if (report.packetsLost && report.packetsReceived) {
                        const total = report.packetsLost + report.packetsReceived;
                        packetLoss = (report.packetsLost / total) * 100;
                    }
                    jitter = report.jitter || 0;
                }
            });

            // Adapt based on metrics
            if (packetLoss > 5 || latency > 300 || jitter > 30) {
                // Degrade quality
                await this.degradeQuality();
            } else if (packetLoss < 1 && latency < 100 && jitter < 10) {
                // Improve quality
                await this.improveQuality();
            }

        } catch (error) {
            console.error('[ADAPTIVE] Failed to check connection:', error);
        }
    }

    async degradeQuality() {
        if (this.currentQualityIndex > 0) {
            this.currentQualityIndex--;
            const newQuality = this.qualityLevels[this.currentQualityIndex];
            console.log(`[ADAPTIVE] Degrading quality to ${newQuality}`);
            await this.applyQuality(newQuality);
        }
    }

    async improveQuality() {
        if (this.currentQualityIndex < this.qualityLevels.length - 1) {
            this.currentQualityIndex++;
            const newQuality = this.qualityLevels[this.currentQualityIndex];
            console.log(`[ADAPTIVE] Improving quality to ${newQuality}`);
            await this.applyQuality(newQuality);
        }
    }

    async applyQuality(quality) {
        try {
            // Get current frame rate from settings or use default
            const frameRateSelect = document.getElementById('frameRateSelect');
            const frameRate = frameRateSelect && frameRateSelect.value !== 'auto'
                ? parseInt(frameRateSelect.value)
                : 30;

            const audioQualitySelect = document.getElementById('audioQualitySelect');
            const audioQuality = audioQualitySelect ? audioQualitySelect.value : 'high';

            await this.webrtc.changeQuality(quality, frameRate, audioQuality);
        } catch (error) {
            console.error('[ADAPTIVE] Failed to apply quality:', error);
        }
    }
}

// Export for use in call.js
window.initEmojiPicker = initEmojiPicker;
window.initSettingsPanel = initSettingsPanel;
window.updateConnectionStats = updateConnectionStats;
window.AdaptiveQuality = AdaptiveQuality;
