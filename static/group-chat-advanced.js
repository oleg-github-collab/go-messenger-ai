/**
 * Advanced Group Chat for Daily.co Calls
 * Features: Reactions, Quotes, GIF picker, Mini-browser for links
 */

class GroupChatAdvanced {
    constructor(callFrame) {
        this.callFrame = callFrame;
        this.messages = [];
        this.isOpen = false;
        this.unreadCount = 0;
        this.replyingTo = null;

        this.init();
    }

    init() {
        this.createChatUI();
        this.setupEventListeners();
        this.listenForMessages();
    }

    createChatUI() {
        const chatHTML = `
            <div class="group-chat-overlay" id="groupChatOverlay">
                <div class="group-chat-container">
                    <!-- Chat Header -->
                    <div class="group-chat-header">
                        <h3>💬 Group Chat</h3>
                        <button class="group-chat-close" id="groupChatClose">✕</button>
                    </div>

                    <!-- Messages Container -->
                    <div class="group-chat-messages" id="groupChatMessages">
                        <div class="group-chat-empty">
                            <div class="chat-empty-icon">💬</div>
                            <div class="chat-empty-text">No messages yet</div>
                            <div class="chat-empty-subtitle">Start the conversation!</div>
                        </div>
                    </div>

                    <!-- Replying To Banner -->
                    <div class="chat-reply-banner" id="chatReplyBanner" style="display: none;">
                        <div class="reply-banner-content">
                            <span class="reply-banner-icon">↩️</span>
                            <div class="reply-banner-info">
                                <div class="reply-banner-name" id="replyBannerName">User</div>
                                <div class="reply-banner-text" id="replyBannerText">Message preview...</div>
                            </div>
                        </div>
                        <button class="reply-banner-cancel" id="replyBannerCancel">✕</button>
                    </div>

                    <!-- Input Area -->
                    <div class="group-chat-input-area">
                        <button class="chat-action-btn" id="chatGifBtn" title="Send GIF">
                            🎬
                        </button>
                        <button class="chat-action-btn" id="chatEmojiBtn" title="Add Emoji">
                            😊
                        </button>
                        <input
                            type="text"
                            class="group-chat-input"
                            id="groupChatInput"
                            placeholder="Type a message..."
                            autocomplete="off"
                        />
                        <button class="chat-send-btn" id="chatSendBtn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Emoji Picker -->
            <div class="chat-emoji-picker" id="chatEmojiPicker" style="display: none;">
                <div class="emoji-picker-content">
                    ${this.getEmojiCategories().map(category => `
                        <div class="emoji-category">
                            <div class="emoji-category-title">${category.name}</div>
                            <div class="emoji-grid">
                                ${category.emojis.map(emoji => `
                                    <button class="emoji-item" data-emoji="${emoji}">${emoji}</button>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
        this.injectStyles();
    }

    getEmojiCategories() {
        return [
            {
                name: 'Smileys',
                emojis: ['😊', '😂', '🤣', '❤️', '😍', '😘', '😎', '🤔', '😅', '😆', '🥰', '😉', '🙂', '😇', '🤩', '😋', '😛', '🤗', '🤭', '🤫']
            },
            {
                name: 'Gestures',
                emojis: ['👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤝', '🙏', '💪', '👋', '🤚', '✋', '🖐️', '👆', '👇', '☝️', '🖖']
            },
            {
                name: 'Emotions',
                emojis: ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '💔', '💕', '💞', '💓', '💗', '💖', '💝', '💟', '❣️']
            },
            {
                name: 'Symbols',
                emojis: ['✅', '❌', '⭐', '🔥', '💯', '⚡', '💥', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉']
            }
        ];
    }

    setupEventListeners() {
        // Toggle chat (will be connected externally via chatBtn in group-call-daily.html)

        // Close chat
        document.getElementById('groupChatClose').addEventListener('click', () => {
            this.closeChat();
        });

        // Send message
        document.getElementById('chatSendBtn').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('groupChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // GIF button
        document.getElementById('chatGifBtn').addEventListener('click', () => {
            this.showGifPicker();
        });

        // Emoji button
        document.getElementById('chatEmojiBtn').addEventListener('click', () => {
            this.toggleEmojiPicker();
        });

        // Emoji selection
        document.querySelectorAll('.emoji-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.dataset.emoji;
                this.insertEmoji(emoji);
            });
        });

        // Cancel reply
        const replyCancel = document.getElementById('replyBannerCancel');
        if (replyCancel) {
            replyCancel.addEventListener('click', () => {
                this.cancelReply();
            });
        }
    }

    listenForMessages() {
        if (!this.callFrame) return;

        this.callFrame.on('app-message', (event) => {
            if (event.data?.type === 'chat') {
                this.receiveMessage(event.data);
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const overlay = document.getElementById('groupChatOverlay');

        if (this.isOpen) {
            overlay.style.display = 'flex';
            setTimeout(() => overlay.classList.add('active'), 10);
            this.unreadCount = 0;
            this.updateUnreadBadge();
            document.getElementById('groupChatInput').focus();
        } else {
            overlay.classList.remove('active');
            setTimeout(() => overlay.style.display = 'none', 300);
        }
    }

    closeChat() {
        this.isOpen = false;
        const overlay = document.getElementById('groupChatOverlay');
        overlay.classList.remove('active');
        setTimeout(() => overlay.style.display = 'none', 300);
    }

    sendMessage() {
        const input = document.getElementById('groupChatInput');
        const text = input.value.trim();

        if (!text || !this.callFrame) return;

        const message = {
            type: 'chat',
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            text,
            sender: this.callFrame.participants().local.user_name || 'You',
            timestamp: Date.now(),
            replyTo: this.replyingTo || null
        };

        // Send via Daily.co
        this.callFrame.sendAppMessage(message, '*');

        // Add to local messages
        this.addMessage(message, true);

        // Clear input and reply state
        input.value = '';
        this.cancelReply();
    }

    receiveMessage(message) {
        this.addMessage(message, false);

        if (!this.isOpen) {
            this.unreadCount++;
            this.updateUnreadBadge();
        }
    }

    addMessage(message, isOwn) {
        this.messages.push(message);

        const messagesContainer = document.getElementById('groupChatMessages');
        const empty = messagesContainer.querySelector('.group-chat-empty');
        if (empty) empty.style.display = 'none';

        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${isOwn ? 'own' : 'other'}`;
        messageEl.dataset.messageId = message.id;

        // Check if message contains URL
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const hasUrl = urlRegex.test(message.text);

        // Reply preview
        let replyHTML = '';
        if (message.replyTo) {
            const originalMsg = this.messages.find(m => m.id === message.replyTo);
            if (originalMsg) {
                replyHTML = `
                    <div class="chat-message-reply-preview">
                        <span class="reply-preview-icon">↩️</span>
                        <div class="reply-preview-content">
                            <div class="reply-preview-name">${originalMsg.sender}</div>
                            <div class="reply-preview-text">${this.truncateText(originalMsg.text, 50)}</div>
                        </div>
                    </div>
                `;
            }
        }

        messageEl.innerHTML = `
            <div class="chat-message-avatar">
                ${message.sender.charAt(0).toUpperCase()}
            </div>
            <div class="chat-message-content">
                <div class="chat-message-header">
                    <span class="chat-message-sender">${message.sender}</span>
                    <span class="chat-message-time">${this.formatTime(message.timestamp)}</span>
                </div>
                ${replyHTML}
                <div class="chat-message-text">
                    ${this.linkifyText(message.text)}
                </div>
                <div class="chat-message-actions">
                    <button class="chat-msg-action" onclick="window.groupChat.replyToMessage('${message.id}')">
                        ↩️ Reply
                    </button>
                    <button class="chat-msg-action" onclick="window.groupChat.reactToMessage('${message.id}', '❤️')">
                        ❤️
                    </button>
                    <button class="chat-msg-action" onclick="window.groupChat.reactToMessage('${message.id}', '👍')">
                        👍
                    </button>
                </div>
            </div>
        `;

        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    linkifyText(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => {
            return `<a href="#" class="chat-link" onclick="event.preventDefault(); window.groupChat.openMiniBrowser('${url}');">${url}</a>`;
        });
    }

    replyToMessage(messageId) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        this.replyingTo = messageId;

        const banner = document.getElementById('chatReplyBanner');
        const name = document.getElementById('replyBannerName');
        const text = document.getElementById('replyBannerText');

        name.textContent = message.sender;
        text.textContent = this.truncateText(message.text, 100);
        banner.style.display = 'flex';

        document.getElementById('groupChatInput').focus();
    }

    cancelReply() {
        this.replyingTo = null;
        document.getElementById('chatReplyBanner').style.display = 'none';
    }

    reactToMessage(messageId, emoji) {
        console.log('[CHAT] React to message:', messageId, emoji);
        // Can send reaction via Daily.co app-message
        this.callFrame.sendAppMessage({
            type: 'reaction-to-message',
            messageId,
            emoji
        }, '*');
    }

    openMiniBrowser(url) {
        // Same mini-browser logic from call.js
        if (window.openMiniBrowserFromChat) {
            window.openMiniBrowserFromChat(url);
        } else {
            window.open(url, '_blank');
        }
    }

    showGifPicker() {
        if (window.EnhancedGIFPicker) {
            const picker = new window.EnhancedGIFPicker();
            picker.show((gifUrl) => {
                // Send GIF as message
                const input = document.getElementById('groupChatInput');
                input.value = '[GIF]' + gifUrl;
                this.sendMessage();
            });
        }
    }

    toggleEmojiPicker() {
        const picker = document.getElementById('chatEmojiPicker');
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    }

    insertEmoji(emoji) {
        const input = document.getElementById('groupChatInput');
        input.value += emoji;
        input.focus();
        this.toggleEmojiPicker();
    }

    updateUnreadBadge() {
        const badge = document.getElementById('chatUnreadBadge');
        if (this.unreadCount > 0) {
            badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    truncateText(text, maxLen) {
        return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Group Chat Toggle Button */
            .group-chat-toggle {
                position: fixed;
                bottom: 100px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: 2px solid rgba(255, 255, 255, 0.2);
                color: white;
                font-size: 28px;
                cursor: pointer;
                z-index: 1001;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
            }

            .group-chat-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
            }

            .chat-unread-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: 700;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.5);
            }

            /* Chat Overlay */
            .group-chat-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(10px);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                padding: 20px;
            }

            .group-chat-overlay.active {
                opacity: 1;
            }

            /* Chat Container */
            .group-chat-container {
                background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(45, 45, 45, 0.95) 100%);
                border-radius: 24px;
                width: 100%;
                max-width: 600px;
                height: 80vh;
                max-height: 700px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }

            /* Chat Header */
            .group-chat-header {
                padding: 20px 24px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .group-chat-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 700;
                color: white;
            }

            .group-chat-close {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .group-chat-close:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: scale(1.1);
            }

            /* Messages Area */
            .group-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .group-chat-empty {
                text-align: center;
                padding: 60px 20px;
                color: rgba(255, 255, 255, 0.5);
            }

            .chat-empty-icon {
                font-size: 64px;
                margin-bottom: 16px;
            }

            .chat-empty-text {
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .chat-empty-subtitle {
                font-size: 14px;
                opacity: 0.7;
            }

            /* Chat Message */
            .chat-message {
                display: flex;
                gap: 12px;
                animation: messageSlideIn 0.3s ease;
            }

            @keyframes messageSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .chat-message.own {
                flex-direction: row-reverse;
            }

            .chat-message-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                color: white;
                flex-shrink: 0;
            }

            .chat-message-content {
                flex: 1;
                min-width: 0;
            }

            .chat-message-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .chat-message-sender {
                font-weight: 600;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
            }

            .chat-message-time {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.5);
            }

            .chat-message-reply-preview {
                background: rgba(255, 255, 255, 0.05);
                border-left: 3px solid #667eea;
                padding: 8px 12px;
                border-radius: 8px;
                margin-bottom: 8px;
                display: flex;
                gap: 8px;
                align-items: flex-start;
            }

            .reply-preview-icon {
                font-size: 14px;
                opacity: 0.7;
            }

            .reply-preview-content {
                flex: 1;
            }

            .reply-preview-name {
                font-size: 12px;
                font-weight: 600;
                color: #667eea;
                margin-bottom: 2px;
            }

            .reply-preview-text {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .chat-message-text {
                background: rgba(255, 255, 255, 0.08);
                padding: 12px 16px;
                border-radius: 16px;
                font-size: 15px;
                line-height: 1.5;
                color: rgba(255, 255, 255, 0.95);
                word-wrap: break-word;
            }

            .chat-message.own .chat-message-text {
                background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
            }

            .chat-link {
                color: #667eea;
                text-decoration: underline;
                cursor: pointer;
            }

            .chat-link:hover {
                color: #764ba2;
            }

            .chat-message-actions {
                display: flex;
                gap: 8px;
                margin-top: 8px;
            }

            .chat-msg-action {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 4px 12px;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                transition: all 0.2s;
            }

            .chat-msg-action:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            /* Reply Banner */
            .chat-reply-banner {
                padding: 12px 20px;
                background: rgba(102, 126, 234, 0.15);
                border-top: 2px solid #667eea;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }

            .reply-banner-content {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
                min-width: 0;
            }

            .reply-banner-icon {
                font-size: 18px;
            }

            .reply-banner-info {
                flex: 1;
                min-width: 0;
            }

            .reply-banner-name {
                font-size: 13px;
                font-weight: 600;
                color: #667eea;
                margin-bottom: 2px;
            }

            .reply-banner-text {
                font-size: 13px;
                color: rgba(255, 255, 255, 0.7);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .reply-banner-cancel {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                flex-shrink: 0;
            }

            /* Input Area */
            .group-chat-input-area {
                padding: 16px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .chat-action-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 20px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .chat-action-btn:hover {
                background: rgba(255, 255, 255, 0.12);
                transform: scale(1.05);
            }

            .group-chat-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 12px 20px;
                color: white;
                font-size: 15px;
                outline: none;
            }

            .group-chat-input::placeholder {
                color: rgba(255, 255, 255, 0.4);
            }

            .group-chat-input:focus {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .chat-send-btn {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .chat-send-btn:hover {
                transform: scale(1.1);
                box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
            }

            /* Emoji Picker */
            .chat-emoji-picker {
                position: fixed;
                bottom: 180px;
                right: 20px;
                width: 320px;
                max-height: 400px;
                background: rgba(30, 30, 30, 0.98);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
                overflow-y: auto;
                z-index: 10002;
                padding: 16px;
            }

            .emoji-category {
                margin-bottom: 20px;
            }

            .emoji-category-title {
                font-size: 13px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.6);
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .emoji-grid {
                display: grid;
                grid-template-columns: repeat(8, 1fr);
                gap: 8px;
            }

            .emoji-item {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                font-size: 24px;
                padding: 8px;
                cursor: pointer;
                transition: all 0.2s;
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .emoji-item:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }

            /* Mobile Responsive */
            @media (max-width: 768px) {
                .group-chat-container {
                    height: 100vh;
                    max-height: 100vh;
                    border-radius: 0;
                }

                .group-chat-overlay {
                    padding: 0;
                }

                .chat-emoji-picker {
                    width: calc(100% - 40px);
                    right: 20px;
                    left: 20px;
                    bottom: 160px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for global access
window.GroupChatAdvanced = GroupChatAdvanced;
