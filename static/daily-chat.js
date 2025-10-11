// Simple Daily.co Chat Implementation using sendAppMessage
class DailyChat {
    constructor(callFrame) {
        this.callFrame = callFrame;
        this.messages = [];
        this.isOpen = false;
        this.unreadCount = 0;
        this.userName = callFrame.participants().local?.user_name || 'Unknown';

        console.log('[DailyChat] Initialized for user:', this.userName);

        // Listen for app messages
        this.callFrame.on('app-message', (event) => {
            if (event.data?.type === 'chat') {
                this.handleIncomingMessage(event.data);
            }
        });

        this.initUI();
    }

    initUI() {
        // Create chat overlay
        const overlay = document.createElement('div');
        overlay.id = 'dailyChatOverlay';
        overlay.className = 'daily-chat-overlay';
        overlay.innerHTML = `
            <div class="daily-chat-container">
                <div class="daily-chat-header">
                    <h3>💬 Group Chat</h3>
                    <button class="daily-chat-close" id="dailyChatClose">✕</button>
                </div>
                <div class="daily-chat-messages" id="dailyChatMessages"></div>
                <div class="daily-chat-input-container">
                    <input type="text" id="dailyChatInput" placeholder="Type a message..." />
                    <button id="dailyChatSend">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('dailyChatClose').addEventListener('click', () => this.toggleChat());
        document.getElementById('dailyChatSend').addEventListener('click', () => this.sendMessage());
        document.getElementById('dailyChatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const overlay = document.getElementById('dailyChatOverlay');

        if (this.isOpen) {
            overlay.classList.add('active');
            this.unreadCount = 0;
            this.updateBadge();
            document.getElementById('dailyChatInput').focus();
        } else {
            overlay.classList.remove('active');
        }
    }

    sendMessage() {
        const input = document.getElementById('dailyChatInput');
        const text = input.value.trim();

        if (!text) return;

        // Send via Daily.co app message
        this.callFrame.sendAppMessage({
            type: 'chat',
            message: text,
            userName: this.userName,
            timestamp: Date.now()
        }, '*'); // '*' sends to all participants

        // Add to local messages
        this.addMessage({
            message: text,
            userName: this.userName,
            timestamp: Date.now(),
            isLocal: true
        });

        input.value = '';
    }

    handleIncomingMessage(data) {
        console.log('[DailyChat] Received message:', data);

        this.addMessage({
            message: data.message,
            userName: data.userName,
            timestamp: data.timestamp,
            isLocal: false
        });

        if (!this.isOpen) {
            this.unreadCount++;
            this.updateBadge();
        }
    }

    addMessage(msg) {
        this.messages.push(msg);

        const messagesDiv = document.getElementById('dailyChatMessages');
        const msgEl = document.createElement('div');
        msgEl.className = `daily-chat-message ${msg.isLocal ? 'local' : 'remote'}`;

        const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        msgEl.innerHTML = `
            <div class="daily-chat-message-header">
                <span class="daily-chat-message-user">${msg.userName}</span>
                <span class="daily-chat-message-time">${time}</span>
            </div>
            <div class="daily-chat-message-text">${this.escapeHtml(msg.message)}</div>
        `;

        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    updateBadge() {
        const badge = document.getElementById('chatUnreadBadge');
        if (badge) {
            if (this.unreadCount > 0) {
                badge.textContent = this.unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// CSS Styles
const chatStyles = document.createElement('style');
chatStyles.textContent = `
.daily-chat-overlay {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100%;
    background: rgba(15, 23, 42, 0.98);
    backdrop-filter: blur(20px);
    z-index: 2000;
    transition: right 0.3s ease;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.daily-chat-overlay.active {
    right: 0;
}

.daily-chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.daily-chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.daily-chat-header h3 {
    margin: 0;
    color: white;
    font-size: 18px;
}

.daily-chat-close {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
}

.daily-chat-close:hover {
    background: rgba(255, 255, 255, 0.1);
}

.daily-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.daily-chat-message {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-width: 80%;
}

.daily-chat-message.local {
    align-self: flex-end;
}

.daily-chat-message.remote {
    align-self: flex-start;
}

.daily-chat-message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.daily-chat-message-user {
    color: #60a5fa;
    font-weight: 600;
}

.daily-chat-message-time {
    color: rgba(255, 255, 255, 0.5);
}

.daily-chat-message-text {
    background: rgba(255, 255, 255, 0.1);
    padding: 10px 14px;
    border-radius: 12px;
    color: white;
    word-wrap: break-word;
}

.daily-chat-message.local .daily-chat-message-text {
    background: #3b82f6;
}

.daily-chat-input-container {
    display: flex;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.daily-chat-input-container input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 14px;
}

.daily-chat-input-container input:focus {
    outline: none;
    border-color: #3b82f6;
}

.daily-chat-input-container button {
    padding: 12px 24px;
    border-radius: 24px;
    border: none;
    background: #3b82f6;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.daily-chat-input-container button:hover {
    background: #2563eb;
}

@media (max-width: 768px) {
    .daily-chat-overlay {
        width: 100%;
        right: -100%;
    }
}
`;
document.head.appendChild(chatStyles);

// Export
window.DailyChat = DailyChat;
