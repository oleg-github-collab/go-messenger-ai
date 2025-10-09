/**
 * Chat Manager - Modular chat system for WebRTC calls
 * Handles text messages, GIF messages, and flying emoji reactions
 */

import { globalEvents } from '../core/events.js';

export class ChatManager {
    constructor(config = {}) {
        this.config = {
            flyingMessageDuration: config.flyingMessageDuration || 3000,
            maxMessages: config.maxMessages || 100,
            enableFlyingMessages: config.enableFlyingMessages !== false,
            ...config
        };

        // State
        this.isOpen = false;
        this.messages = [];
        this.unreadCount = 0;
        this.recipientId = null; // For group calls
        this.localParticipantId = null;
        this.localParticipantName = 'You';

        // DOM Elements
        this.elements = {};

        // Socket reference (will be set externally)
        this.socket = null;
    }

    /**
     * Initialize chat manager
     */
    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.setupGlobalEvents();

        console.log('[CHAT] Chat manager initialized');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            // Chat toggle button
            chatBtn: document.getElementById('chatIconBtn'),
            chatBadge: document.getElementById('chatBadge'),

            // Chat panel
            chatPanel: document.getElementById('chatPanel'),
            chatBackBtn: document.getElementById('chatBackBtn'),
            chatMessages: document.getElementById('chatMessages'),
            chatEmpty: document.getElementById('chatEmpty'),

            // Input area
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendMessageBtn'),
            emojiBtn: document.getElementById('emojiBtn'),

            // Flying messages container
            flyingContainer: document.getElementById('flyingMessagesContainer'),

            // Recipient selector (for group calls)
            recipientSelect: document.getElementById('recipientSelect')
        };
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Toggle chat panel
        if (this.elements.chatBtn) {
            this.elements.chatBtn.addEventListener('click', () => this.toggleChat());
        }

        // Close chat
        if (this.elements.chatBackBtn) {
            this.elements.chatBackBtn.addEventListener('click', () => this.closeChat());
        }

        // Send message
        if (this.elements.sendBtn) {
            this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Send on Enter
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Clear unread on input focus
            this.elements.messageInput.addEventListener('focus', () => {
                this.clearUnread();
            });
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEvents() {
        // Listen for incoming messages from socket
        globalEvents.on('chat:message-received', (data) => {
            this.handleIncomingMessage(data);
        });

        // Listen for connection state
        globalEvents.on('socket:connected', () => {
            console.log('[CHAT] Socket connected');
        });

        globalEvents.on('socket:disconnected', () => {
            console.log('[CHAT] Socket disconnected');
        });
    }

    /**
     * Set socket reference
     */
    setSocket(socket) {
        this.socket = socket;
    }

    /**
     * Set local participant info
     */
    setLocalParticipant(id, name) {
        this.localParticipantId = id;
        this.localParticipantName = name;
    }

    /**
     * Toggle chat panel
     */
    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    /**
     * Open chat panel
     */
    openChat() {
        if (this.elements.chatPanel) {
            this.elements.chatPanel.classList.add('active');
            this.isOpen = true;
            this.clearUnread();

            if (this.elements.messageInput) {
                this.elements.messageInput.focus();
            }

            globalEvents.emit('chat:opened');
        }
    }

    /**
     * Close chat panel
     */
    closeChat() {
        if (this.elements.chatPanel) {
            this.elements.chatPanel.classList.remove('active');
            this.isOpen = false;
            globalEvents.emit('chat:closed');
        }
    }

    /**
     * Send message
     */
    sendMessage(customText = null) {
        const text = customText || this.elements.messageInput?.value.trim();

        if (!text) {
            console.warn('[CHAT] Empty message');
            return;
        }

        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.warn('[CHAT] Socket not ready');
            this.showError('Not connected');
            return;
        }

        const payload = {
            type: 'chat_message',
            text,
            from: this.localParticipantId || 'self',
            fromName: this.localParticipantName,
            to: this.recipientId || undefined // For group calls
        };

        console.log('[CHAT] Sending message:', payload);

        this.socket.send(JSON.stringify(payload));

        // Add to local UI immediately
        this.addMessage({
            type: 'sent',
            text,
            fromName: this.localParticipantName,
            timestamp: Date.now()
        });

        // Clear input
        if (this.elements.messageInput && !customText) {
            this.elements.messageInput.value = '';
        }

        // Emit event for notetaker
        globalEvents.emit('chat:message-sent', {
            text,
            fromId: this.localParticipantId,
            fromName: this.localParticipantName
        });
    }

    /**
     * Handle incoming message from socket
     */
    handleIncomingMessage(data) {
        console.log('[CHAT] Incoming message:', data);

        const { text, from, fromName, to } = data;

        // Check if message is for us (in group calls)
        if (to && to !== this.localParticipantId && to !== 'everyone') {
            return; // Not for us
        }

        // Add to UI
        this.addMessage({
            type: 'received',
            text,
            fromName: fromName || 'Guest',
            fromId: from,
            timestamp: Date.now()
        });

        // Show notification if chat is closed
        if (!this.isOpen) {
            this.incrementUnread();

            // Show flying message if enabled
            if (this.config.enableFlyingMessages) {
                this.showFlyingMessage(text, fromName);
            }
        }

        // Emit event for notetaker
        globalEvents.emit('chat:message-received-processed', {
            text,
            fromId: from,
            fromName: fromName || 'Guest'
        });
    }

    /**
     * Add message to chat UI
     */
    addMessage(messageData) {
        const { type, text, fromName, fromId, timestamp } = messageData;

        // Hide empty state
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'none';
        }

        // Create message element
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message-wrapper ${type}`;

        const isGif = text.startsWith('[GIF]');
        const gifUrl = isGif ? text.substring(5) : null;

        const time = new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isGif) {
            wrapper.innerHTML = `
                <div class="chat-message gif-message">
                    <div class="message-header">
                        <span class="message-author">${fromName}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-gif">
                        <img src="${gifUrl}" alt="GIF" loading="lazy" />
                    </div>
                </div>
            `;
        } else {
            wrapper.innerHTML = `
                <div class="chat-message">
                    <div class="message-header">
                        <span class="message-author">${fromName}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${this.escapeHtml(text)}</div>
                </div>
            `;
        }

        this.elements.chatMessages.appendChild(wrapper);
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;

        // Add to messages array
        this.messages.push(messageData);

        // Trim old messages
        if (this.messages.length > this.config.maxMessages) {
            this.messages.shift();
            const firstMessage = this.elements.chatMessages.firstChild;
            if (firstMessage) {
                firstMessage.remove();
            }
        }
    }

    /**
     * Show flying message notification
     */
    showFlyingMessage(text, fromName) {
        if (!this.elements.flyingContainer) return;

        const isGif = text.startsWith('[GIF]');
        const gifUrl = isGif ? text.substring(5) : null;

        const flyingMsg = document.createElement('div');
        flyingMsg.className = 'flying-message';

        if (isGif) {
            flyingMsg.innerHTML = `
                <div class="flying-message-author">${this.escapeHtml(fromName)}</div>
                <div class="flying-message-gif">
                    <img src="${gifUrl}" alt="GIF" />
                </div>
            `;
        } else {
            flyingMsg.innerHTML = `
                <div class="flying-message-author">${this.escapeHtml(fromName)}</div>
                <div class="flying-message-text">${this.escapeHtml(text)}</div>
            `;
        }

        this.elements.flyingContainer.appendChild(flyingMsg);

        // Animate in
        setTimeout(() => {
            flyingMsg.style.opacity = '1';
            flyingMsg.style.transform = 'translateY(0)';
        }, 10);

        // Remove after duration
        setTimeout(() => {
            flyingMsg.style.opacity = '0';
            flyingMsg.style.transform = 'translateY(-20px)';
            setTimeout(() => flyingMsg.remove(), 300);
        }, this.config.flyingMessageDuration);
    }

    /**
     * Increment unread count
     */
    incrementUnread() {
        this.unreadCount++;
        this.updateBadge();
    }

    /**
     * Clear unread count
     */
    clearUnread() {
        this.unreadCount = 0;
        this.updateBadge();
    }

    /**
     * Update badge display
     */
    updateBadge() {
        if (this.elements.chatBadge) {
            if (this.unreadCount > 0) {
                this.elements.chatBadge.textContent = this.unreadCount;
                this.elements.chatBadge.style.display = 'block';
            } else {
                this.elements.chatBadge.style.display = 'none';
            }
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // You can implement a toast/notification system here
        console.error('[CHAT] Error:', message);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.messages = [];
        if (this.elements.chatMessages) {
            this.elements.chatMessages.innerHTML = '';
        }
        if (this.elements.chatEmpty) {
            this.elements.chatEmpty.style.display = 'block';
        }
    }

    /**
     * Get all messages
     */
    getMessages() {
        return this.messages;
    }

    /**
     * Destroy chat manager
     */
    destroy() {
        // Remove event listeners
        globalEvents.off('chat:message-received');
        globalEvents.off('socket:connected');
        globalEvents.off('socket:disconnected');

        // Clear messages
        this.clearMessages();

        console.log('[CHAT] Chat manager destroyed');
    }
}

/**
 * Factory function to create chat manager
 */
export function createChatManager(config) {
    return new ChatManager(config);
}
