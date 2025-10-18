/**
 * Enhanced Chat System for Professional Mode
 * Features: GIF picker, message reactions, reply/quote functionality
 */

class EnhancedProfessionalChat {
    constructor(hmsSDK) {
        this.hmsSDK = hmsSDK;
        this.messages = [];
        this.replyingTo = null;
        this.activePolls = new Map(); // pollId -> poll data
        this.pollVotes = new Map(); // pollId -> user's vote(s)
        this.userVotedPolls = new Set(); // Track which polls user voted in

        // UI Elements
        this.chatPanel = document.getElementById('chatPanel');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendChatBtn');

        this.initUI();
        this.initEventListeners();

        console.log('[ENHANCED-CHAT] ✅ Enhanced chat initialized');
    }

    initUI() {
        // Add GIF button next to send button
        if (this.sendBtn && this.chatInput) {
            const gifBtn = document.createElement('button');
            gifBtn.className = 'gif-btn';
            gifBtn.id = 'chatGifBtn';
            gifBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 13v-2h-4V9h4V7h-4V5h4V3h-6v10h2v-6h2v6h2zm-8-2H8V9h2V7H8V5h2V3H6v10h4v-2zm-4 6v-2h12v2H6zm0 4v-2h12v2H6z"/>
                </svg>
            `;
            gifBtn.title = 'Send GIF';

            // Insert before send button
            this.sendBtn.parentNode.insertBefore(gifBtn, this.sendBtn);
            this.gifBtn = gifBtn;
        }

        // Add reply bar (hidden by default)
        const replyBar = document.createElement('div');
        replyBar.className = 'chat-reply-bar';
        replyBar.id = 'chatReplyBar';
        replyBar.style.display = 'none';
        replyBar.innerHTML = `
            <div class="reply-content">
                <div class="reply-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                    </svg>
                    <span class="reply-to-name"></span>
                </div>
                <div class="reply-message-preview"></div>
            </div>
            <button class="reply-cancel-btn" id="cancelReplyBtn">✕</button>
        `;

        // Insert above chat input area
        const inputArea = this.chatInput.closest('.chat-input-area');
        if (inputArea) {
            inputArea.parentNode.insertBefore(replyBar, inputArea);
            this.replyBar = replyBar;
        }
    }

    initEventListeners() {
        // GIF button
        if (this.gifBtn) {
            this.gifBtn.addEventListener('click', () => this.openGIFPicker());
        }

        // Cancel reply button
        const cancelReplyBtn = document.getElementById('cancelReplyBtn');
        if (cancelReplyBtn) {
            cancelReplyBtn.addEventListener('click', () => this.cancelReply());
        }

        // Send button and Enter key
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    openGIFPicker() {
        if (!window.enhancedGIFPicker) {
            console.error('[ENHANCED-CHAT] GIF picker not available');
            return;
        }

        window.enhancedGIFPicker.show((gifUrl) => {
            this.sendGIF(gifUrl);
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        try {
            const messageData = {
                type: 'text',
                content: message,
                replyTo: this.replyingTo ? this.replyingTo.id : null,
                timestamp: Date.now()
            };

            await this.broadcastMessage(messageData);

            this.chatInput.value = '';
            this.cancelReply();

        } catch (error) {
            console.error('[ENHANCED-CHAT] ❌ Send failed:', error);
            this.showError('Failed to send message');
        }
    }

    async sendGIF(gifUrl) {
        try {
            const messageData = {
                type: 'gif',
                content: gifUrl,
                replyTo: this.replyingTo ? this.replyingTo.id : null,
                timestamp: Date.now()
            };

            await this.broadcastMessage(messageData);
            this.cancelReply();

        } catch (error) {
            console.error('[ENHANCED-CHAT] ❌ GIF send failed:', error);
            this.showError('Failed to send GIF');
        }
    }

    async broadcastMessage(messageData) {
        const messageString = JSON.stringify(messageData);

        if (this.hmsSDK && this.hmsSDK.hmsActions && typeof this.hmsSDK.hmsActions.sendBroadcastMessage === 'function') {
            await this.hmsSDK.hmsActions.sendBroadcastMessage(messageString);
        } else {
            console.warn('[ENHANCED-CHAT] HMS not ready, displaying locally');
            // Display locally as fallback
            this.displayMessage('You', messageData, true);
        }
    }

    handleIncomingMessage(sender, messageString) {
        try {
            const messageData = JSON.parse(messageString);
            this.displayMessage(sender, messageData, false);
        } catch (err) {
            // If not JSON, treat as plain text (backward compatibility)
            this.displayMessage(sender, { type: 'text', content: messageString, timestamp: Date.now() }, false);
        }
    }

    displayMessage(sender, messageData, isMe) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${isMe ? 'me' : 'other'}`;
        msgDiv.dataset.messageId = messageData.timestamp || Date.now();

        const time = new Date(messageData.timestamp || Date.now()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        let contentHTML = '';

        // Show reply reference if exists
        if (messageData.replyTo) {
            const repliedMsg = this.messages.find(m => m.id === messageData.replyTo);
            if (repliedMsg) {
                contentHTML += `
                    <div class="message-reply-ref">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                        </svg>
                        <span>${repliedMsg.sender}: ${this.truncateText(repliedMsg.content, 50)}</span>
                    </div>
                `;
            }
        }

        // Message content
        if (messageData.type === 'gif') {
            contentHTML += `
                <div class="message-gif">
                    <img src="${messageData.content}" alt="GIF" loading="lazy">
                </div>
            `;
        } else {
            contentHTML += `<div class="message-text">${this.escapeHtml(messageData.content)}</div>`;
        }

        // Reactions container
        contentHTML += `<div class="message-reactions" data-message-id="${msgDiv.dataset.messageId}"></div>`;

        msgDiv.innerHTML = `
            <div class="message-header">
                <span class="sender-name">${isMe ? 'You' : sender}</span>
                <span class="message-time">${time}</span>
            </div>
            ${contentHTML}
            <div class="message-actions">
                <button class="message-action-btn reply-btn" title="Reply">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                    </svg>
                </button>
                <button class="message-action-btn react-btn" title="React">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="15.5" cy="9.5" r="1.5"/>
                        <circle cx="8.5" cy="9.5" r="1.5"/>
                        <path d="M12 17.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8"/>
                    </svg>
                </button>
            </div>
        `;

        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // Store message
        this.messages.push({
            id: msgDiv.dataset.messageId,
            sender: sender,
            content: messageData.content,
            type: messageData.type || 'text',
            timestamp: messageData.timestamp || Date.now(),
            isMe: isMe,
            reactions: {}
        });

        // Add event listeners
        const replyBtn = msgDiv.querySelector('.reply-btn');
        const reactBtn = msgDiv.querySelector('.react-btn');

        if (replyBtn) {
            replyBtn.addEventListener('click', () => this.startReply(msgDiv.dataset.messageId, sender, messageData.content));
        }

        if (reactBtn) {
            reactBtn.addEventListener('click', (e) => this.showReactionPicker(e, msgDiv.dataset.messageId));
        }
    }

    startReply(messageId, sender, content) {
        this.replyingTo = { id: messageId, sender, content };

        if (this.replyBar) {
            this.replyBar.style.display = 'flex';
            this.replyBar.querySelector('.reply-to-name').textContent = sender;
            this.replyBar.querySelector('.reply-message-preview').textContent = this.truncateText(content, 60);
        }

        // Focus input
        if (this.chatInput) {
            this.chatInput.focus();
        }
    }

    cancelReply() {
        this.replyingTo = null;

        if (this.replyBar) {
            this.replyBar.style.display = 'none';
        }
    }

    showReactionPicker(event, messageId) {
        // Remove existing picker
        const existingPicker = document.querySelector('.reaction-picker');
        if (existingPicker) {
            existingPicker.remove();
        }

        const picker = document.createElement('div');
        picker.className = 'reaction-picker';

        const reactions = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏'];

        picker.innerHTML = reactions.map(emoji => `
            <button class="reaction-emoji-btn" data-emoji="${emoji}">${emoji}</button>
        `).join('');

        // Position picker
        const rect = event.target.closest('.message-action-btn').getBoundingClientRect();
        picker.style.position = 'fixed';
        picker.style.left = `${rect.left}px`;
        picker.style.top = `${rect.top - 50}px`;

        document.body.appendChild(picker);

        // Add event listeners
        picker.querySelectorAll('.reaction-emoji-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addReaction(messageId, btn.dataset.emoji);
                picker.remove();
            });
        });

        // Close picker when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closePicker(e) {
                if (!picker.contains(e.target)) {
                    picker.remove();
                    document.removeEventListener('click', closePicker);
                }
            });
        }, 100);
    }

    async addReaction(messageId, emoji) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        // Initialize reactions object if needed
        if (!message.reactions) {
            message.reactions = {};
        }

        // Toggle reaction (add or remove)
        if (message.reactions[emoji]) {
            message.reactions[emoji]++;
        } else {
            message.reactions[emoji] = 1;
        }

        // Update UI
        this.updateReactionsUI(messageId, message.reactions);

        // Broadcast reaction
        try {
            const reactionData = {
                type: 'reaction',
                messageId: messageId,
                emoji: emoji,
                timestamp: Date.now()
            };

            await this.broadcastMessage(reactionData);
        } catch (err) {
            console.error('[ENHANCED-CHAT] Failed to broadcast reaction:', err);
        }
    }

    handleIncomingReaction(messageId, emoji) {
        const message = this.messages.find(m => m.id === messageId);
        if (!message) return;

        if (!message.reactions) {
            message.reactions = {};
        }

        if (message.reactions[emoji]) {
            message.reactions[emoji]++;
        } else {
            message.reactions[emoji] = 1;
        }

        this.updateReactionsUI(messageId, message.reactions);
    }

    updateReactionsUI(messageId, reactions) {
        const reactionsContainer = document.querySelector(`.message-reactions[data-message-id="${messageId}"]`);
        if (!reactionsContainer) return;

        reactionsContainer.innerHTML = '';

        Object.entries(reactions).forEach(([emoji, count]) => {
            if (count > 0) {
                const reactionBubble = document.createElement('span');
                reactionBubble.className = 'reaction-bubble';
                reactionBubble.innerHTML = `${emoji} ${count > 1 ? count : ''}`;
                reactionsContainer.appendChild(reactionBubble);
            }
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        console.error('[ENHANCED-CHAT]', message);
        // Could show a toast notification here
    }
}

// Export for global use
window.EnhancedProfessionalChat = EnhancedProfessionalChat;
console.log('[ENHANCED-CHAT] ✅ EnhancedProfessionalChat loaded');
