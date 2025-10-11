/**
 * Advanced Group Chat Extensions
 * Features: Polls, Voice Messages, File Sharing, Threads, Mentions
 */

class GroupChatExtensions {
    constructor(chatInstance, callFrame) {
        this.chat = chatInstance;
        this.callFrame = callFrame;
        this.polls = new Map();
        this.activeRecording = null;

        this.init();
    }

    init() {
        this.addExtensionButtons();
        this.setupPollListener();
        this.setupFileListener();
        this.setupVoiceListener();
    }

    toggleChatPanel() {
        // Toggle chat via the chat instance
        if (this.chat && typeof this.chat.toggleChat === 'function') {
            this.chat.toggleChat();
        } else {
            console.error('[GroupChatExtensions] Chat instance not available or toggleChat not found');
        }
    }

    addExtensionButtons() {
        // Add buttons to chat input area
        const inputArea = document.querySelector('.group-chat-input-area');
        if (!inputArea) return;

        // Insert before GIF and Emoji buttons
        const pollBtn = this.createButton('📊', 'Create Poll', () => this.showPollModal());
        const fileBtn = this.createButton('📎', 'Share File', () => this.shareFile());
        const voiceBtn = this.createButton('🎤', 'Voice Message', () => this.toggleVoiceRecording());

        inputArea.insertBefore(voiceBtn, inputArea.firstChild);
        inputArea.insertBefore(fileBtn, inputArea.firstChild);
        inputArea.insertBefore(pollBtn, inputArea.firstChild);
    }

    createButton(icon, title, onClick) {
        const btn = document.createElement('button');
        btn.className = 'chat-action-btn';
        btn.title = title;
        btn.textContent = icon;
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ============================================
    // POLLS FEATURE
    // ============================================
    showPollModal() {
        const modal = document.createElement('div');
        modal.className = 'poll-modal-overlay';
        modal.innerHTML = `
            <div class="poll-modal">
                <div class="poll-modal-header">
                    <h3>📊 Create Poll</h3>
                    <button class="poll-close-btn" onclick="this.closest('.poll-modal-overlay').remove()">✕</button>
                </div>
                <div class="poll-modal-content">
                    <input type="text" class="poll-question-input" placeholder="Ask a question..." maxlength="200">
                    <div class="poll-options">
                        <input type="text" class="poll-option-input" placeholder="Option 1" maxlength="100">
                        <input type="text" class="poll-option-input" placeholder="Option 2" maxlength="100">
                    </div>
                    <button class="poll-add-option-btn" id="pollAddOption">+ Add Option</button>
                    <div class="poll-settings">
                        <label>
                            <input type="checkbox" id="pollMultiple"> Allow multiple votes
                        </label>
                        <label>
                            <input type="checkbox" id="pollAnonymous"> Anonymous voting
                        </label>
                    </div>
                </div>
                <div class="poll-modal-footer">
                    <button class="poll-cancel-btn" onclick="this.closest('.poll-modal-overlay').remove()">Cancel</button>
                    <button class="poll-send-btn" id="pollSendBtn">Send Poll</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.addPollModalStyles();

        // Event listeners
        document.getElementById('pollAddOption').addEventListener('click', () => {
            const optionsDiv = modal.querySelector('.poll-options');
            if (optionsDiv.children.length < 10) {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'poll-option-input';
                input.placeholder = `Option ${optionsDiv.children.length + 1}`;
                input.maxLength = 100;
                optionsDiv.appendChild(input);
            }
        });

        document.getElementById('pollSendBtn').addEventListener('click', () => {
            this.sendPoll(modal);
        });
    }

    sendPoll(modal) {
        const question = modal.querySelector('.poll-question-input').value.trim();
        const optionInputs = modal.querySelectorAll('.poll-option-input');
        const options = Array.from(optionInputs)
            .map(input => input.value.trim())
            .filter(opt => opt);

        if (!question || options.length < 2) {
            alert('Please enter a question and at least 2 options');
            return;
        }

        const pollId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const poll = {
            type: 'poll',
            id: pollId,
            question,
            options: options.map((text, index) => ({ id: index, text, votes: [] })),
            multiple: document.getElementById('pollMultiple').checked,
            anonymous: document.getElementById('pollAnonymous').checked,
            creator: this.callFrame.participants().local.user_name || 'Anonymous',
            timestamp: Date.now()
        };

        // Send via Daily.co
        this.callFrame.sendAppMessage(poll, '*');

        // Display locally
        this.displayPoll(poll, true);

        // Store
        this.polls.set(pollId, poll);

        modal.remove();
    }

    displayPoll(poll, isOwn) {
        const messagesContainer = document.getElementById('groupChatMessages');
        const empty = messagesContainer.querySelector('.group-chat-empty');
        if (empty) empty.style.display = 'none';

        const pollEl = document.createElement('div');
        pollEl.className = `chat-message ${isOwn ? 'own' : 'other'} poll-message`;
        pollEl.dataset.pollId = poll.id;

        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

        pollEl.innerHTML = `
            <div class="chat-message-avatar">
                ${poll.creator.charAt(0).toUpperCase()}
            </div>
            <div class="chat-message-content">
                <div class="chat-message-header">
                    <span class="chat-message-sender">${poll.creator}</span>
                    <span class="chat-message-time">${this.formatTime(poll.timestamp)}</span>
                </div>
                <div class="poll-container">
                    <div class="poll-question">📊 ${poll.question}</div>
                    <div class="poll-options-list">
                        ${poll.options.map(option => {
                            const percentage = totalVotes > 0 ? (option.votes.length / totalVotes * 100) : 0;
                            return `
                                <div class="poll-option" data-option-id="${option.id}">
                                    <div class="poll-option-bar" style="width: ${percentage}%"></div>
                                    <div class="poll-option-content">
                                        <span class="poll-option-text">${option.text}</span>
                                        <span class="poll-option-votes">${option.votes.length}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="poll-footer">
                        <span class="poll-total-votes">${totalVotes} vote${totalVotes !== 1 ? 's' : ''}</span>
                        ${poll.multiple ? '<span class="poll-badge">Multiple choice</span>' : ''}
                        ${poll.anonymous ? '<span class="poll-badge">Anonymous</span>' : ''}
                    </div>
                </div>
            </div>
        `;

        // Add click handlers for voting
        pollEl.querySelectorAll('.poll-option').forEach(optionEl => {
            optionEl.addEventListener('click', () => {
                const optionId = parseInt(optionEl.dataset.optionId);
                this.votePoll(poll.id, optionId);
            });
        });

        messagesContainer.appendChild(pollEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    votePoll(pollId, optionId) {
        const poll = this.polls.get(pollId);
        if (!poll) return;

        const userId = this.callFrame.participants().local.user_id;
        const userName = this.callFrame.participants().local.user_name || 'Anonymous';

        // Check if already voted
        const alreadyVoted = poll.options.some(opt =>
            opt.votes.some(v => v.userId === userId)
        );

        if (alreadyVoted && !poll.multiple) {
            // Remove previous votes
            poll.options.forEach(opt => {
                opt.votes = opt.votes.filter(v => v.userId !== userId);
            });
        }

        // Add new vote
        const option = poll.options.find(opt => opt.id === optionId);
        if (option) {
            const hasVoted = option.votes.some(v => v.userId === userId);
            if (hasVoted) {
                // Remove vote
                option.votes = option.votes.filter(v => v.userId !== userId);
            } else {
                // Add vote
                option.votes.push({ userId, userName: poll.anonymous ? 'Anonymous' : userName });
            }
        }

        // Broadcast update
        this.callFrame.sendAppMessage({
            type: 'poll-vote',
            pollId,
            optionId,
            poll
        }, '*');

        // Update display
        this.updatePollDisplay(pollId, poll);
    }

    updatePollDisplay(pollId, poll) {
        const pollEl = document.querySelector(`[data-poll-id="${pollId}"]`);
        if (!pollEl) return;

        const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

        poll.options.forEach(option => {
            const percentage = totalVotes > 0 ? (option.votes.length / totalVotes * 100) : 0;
            const optionEl = pollEl.querySelector(`[data-option-id="${option.id}"]`);
            if (optionEl) {
                optionEl.querySelector('.poll-option-bar').style.width = `${percentage}%`;
                optionEl.querySelector('.poll-option-votes').textContent = option.votes.length;
            }
        });

        const totalEl = pollEl.querySelector('.poll-total-votes');
        if (totalEl) {
            totalEl.textContent = `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`;
        }
    }

    // ============================================
    // FILE SHARING FEATURE
    // ============================================
    shareFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                alert('File too large. Maximum size is 10MB.');
                return;
            }

            // Convert to base64 for transmission
            const reader = new FileReader();
            reader.onload = () => {
                const fileData = {
                    type: 'file',
                    id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    data: reader.result,
                    sender: this.callFrame.participants().local.user_name || 'Anonymous',
                    timestamp: Date.now()
                };

                // Send via Daily.co
                this.callFrame.sendAppMessage(fileData, '*');

                // Display locally
                this.displayFile(fileData, true);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    }

    displayFile(fileData, isOwn) {
        const messagesContainer = document.getElementById('groupChatMessages');
        const empty = messagesContainer.querySelector('.group-chat-empty');
        if (empty) empty.style.display = 'none';

        const fileEl = document.createElement('div');
        fileEl.className = `chat-message ${isOwn ? 'own' : 'other'}`;

        const fileIcon = this.getFileIcon(fileData.fileType);
        const fileSize = this.formatFileSize(fileData.fileSize);

        fileEl.innerHTML = `
            <div class="chat-message-avatar">
                ${fileData.sender.charAt(0).toUpperCase()}
            </div>
            <div class="chat-message-content">
                <div class="chat-message-header">
                    <span class="chat-message-sender">${fileData.sender}</span>
                    <span class="chat-message-time">${this.formatTime(fileData.timestamp)}</span>
                </div>
                <div class="file-message">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-info">
                        <div class="file-name">${fileData.fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <a href="${fileData.data}" download="${fileData.fileName}" class="file-download-btn">
                        ⬇️
                    </a>
                </div>
                ${fileData.fileType.startsWith('image/') ?
                    `<img src="${fileData.data}" class="file-image-preview" alt="${fileData.fileName}">` : ''}
            </div>
        `;

        messagesContainer.appendChild(fileEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ============================================
    // VOICE MESSAGES FEATURE
    // ============================================
    async toggleVoiceRecording() {
        if (this.activeRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                this.sendVoiceMessage(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            this.activeRecording = mediaRecorder;

            // Show recording UI
            this.showRecordingIndicator();

        } catch (error) {
            console.error('[VOICE] Recording failed:', error);
            alert('Could not access microphone');
        }
    }

    stopVoiceRecording() {
        if (this.activeRecording) {
            this.activeRecording.stop();
            this.activeRecording = null;
            this.hideRecordingIndicator();
        }
    }

    showRecordingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'voiceRecordingIndicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(239, 68, 68, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 600;
            z-index: 10005;
            display: flex;
            align-items: center;
            gap: 8px;
            animation: pulse 1s infinite;
        `;
        indicator.innerHTML = `
            <span style="width: 12px; height: 12px; background: white; border-radius: 50%; animation: pulse 1s infinite;"></span>
            Recording... (Click 🎤 to stop)
        `;
        document.body.appendChild(indicator);
    }

    hideRecordingIndicator() {
        const indicator = document.getElementById('voiceRecordingIndicator');
        if (indicator) indicator.remove();
    }

    async sendVoiceMessage(blob) {
        const reader = new FileReader();
        reader.onload = () => {
            const voiceData = {
                type: 'voice',
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                data: reader.result,
                duration: 0, // Could calculate actual duration
                sender: this.callFrame.participants().local.user_name || 'Anonymous',
                timestamp: Date.now()
            };

            // Send via Daily.co
            this.callFrame.sendAppMessage(voiceData, '*');

            // Display locally
            this.displayVoiceMessage(voiceData, true);
        };
        reader.readAsDataURL(blob);
    }

    displayVoiceMessage(voiceData, isOwn) {
        const messagesContainer = document.getElementById('groupChatMessages');
        const empty = messagesContainer.querySelector('.group-chat-empty');
        if (empty) empty.style.display = 'none';

        const voiceEl = document.createElement('div');
        voiceEl.className = `chat-message ${isOwn ? 'own' : 'other'}`;

        voiceEl.innerHTML = `
            <div class="chat-message-avatar">
                ${voiceData.sender.charAt(0).toUpperCase()}
            </div>
            <div class="chat-message-content">
                <div class="chat-message-header">
                    <span class="chat-message-sender">${voiceData.sender}</span>
                    <span class="chat-message-time">${this.formatTime(voiceData.timestamp)}</span>
                </div>
                <div class="voice-message">
                    <button class="voice-play-btn" data-voice-id="${voiceData.id}">▶️</button>
                    <div class="voice-waveform">
                        🎵 Voice Message
                    </div>
                    <audio id="voice-${voiceData.id}" src="${voiceData.data}" preload="metadata"></audio>
                </div>
            </div>
        `;

        // Add play button handler
        const playBtn = voiceEl.querySelector('.voice-play-btn');
        const audio = voiceEl.querySelector('audio');

        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playBtn.textContent = '⏸️';
            } else {
                audio.pause();
                playBtn.textContent = '▶️';
            }
        });

        audio.addEventListener('ended', () => {
            playBtn.textContent = '▶️';
        });

        messagesContainer.appendChild(voiceEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // ============================================
    // LISTENERS FOR RECEIVING MESSAGES
    // ============================================
    setupPollListener() {
        this.callFrame.on('app-message', (event) => {
            if (event.data?.type === 'poll') {
                this.polls.set(event.data.id, event.data);
                this.displayPoll(event.data, false);
            } else if (event.data?.type === 'poll-vote') {
                this.polls.set(event.data.pollId, event.data.poll);
                this.updatePollDisplay(event.data.pollId, event.data.poll);
            }
        });
    }

    setupFileListener() {
        this.callFrame.on('app-message', (event) => {
            if (event.data?.type === 'file') {
                this.displayFile(event.data, false);
            }
        });
    }

    setupVoiceListener() {
        this.callFrame.on('app-message', (event) => {
            if (event.data?.type === 'voice') {
                this.displayVoiceMessage(event.data, false);
            }
        });
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.startsWith('video/')) return '🎥';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('doc')) return '📝';
        return '📎';
    }

    addPollModalStyles() {
        if (document.getElementById('pollModalStyles')) return;

        const style = document.createElement('style');
        style.id = 'pollModalStyles';
        style.textContent = `
            .poll-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 10003;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .poll-modal {
                background: linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(45, 45, 45, 0.95) 100%);
                border-radius: 20px;
                max-width: 500px;
                width: 100%;
                border: 1px solid rgba(255, 255, 255, 0.1);
                overflow: hidden;
            }

            .poll-modal-header {
                padding: 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .poll-modal-header h3 {
                margin: 0;
                color: white;
                font-size: 18px;
            }

            .poll-close-btn {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
            }

            .poll-modal-content {
                padding: 20px;
            }

            .poll-question-input {
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                color: white;
                font-size: 15px;
                margin-bottom: 16px;
            }

            .poll-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .poll-option-input {
                width: 100%;
                padding: 10px 12px;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: white;
                font-size: 14px;
            }

            .poll-add-option-btn {
                width: 100%;
                padding: 10px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
                cursor: pointer;
                margin-bottom: 16px;
            }

            .poll-settings {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .poll-settings label {
                display: flex;
                align-items: center;
                gap: 8px;
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
            }

            .poll-modal-footer {
                padding: 16px 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .poll-cancel-btn, .poll-send-btn {
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                border: none;
            }

            .poll-cancel-btn {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .poll-send-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            .poll-container {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 16px;
            }

            .poll-question {
                font-size: 16px;
                font-weight: 600;
                color: white;
                margin-bottom: 12px;
            }

            .poll-options-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }

            .poll-option {
                position: relative;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                padding: 10px 12px;
                cursor: pointer;
                overflow: hidden;
            }

            .poll-option:hover {
                background: rgba(255, 255, 255, 0.08);
            }

            .poll-option-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                background: rgba(102, 126, 234, 0.3);
                transition: width 0.3s ease;
            }

            .poll-option-content {
                position: relative;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .poll-option-text {
                color: white;
                font-size: 14px;
            }

            .poll-option-votes {
                color: rgba(255, 255, 255, 0.6);
                font-size: 13px;
                font-weight: 600;
            }

            .poll-footer {
                display: flex;
                gap: 8px;
                align-items: center;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
            }

            .poll-badge {
                background: rgba(102, 126, 234, 0.2);
                padding: 2px 8px;
                border-radius: 4px;
                font-size: 11px;
            }

            .file-message {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .file-icon {
                font-size: 32px;
            }

            .file-info {
                flex: 1;
            }

            .file-name {
                color: white;
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
            }

            .file-size {
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
            }

            .file-download-btn {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                text-decoration: none;
                cursor: pointer;
            }

            .file-image-preview {
                max-width: 100%;
                max-height: 300px;
                border-radius: 8px;
                margin-top: 8px;
            }

            .voice-message {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .voice-play-btn {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(102, 126, 234, 0.3);
                border: none;
                font-size: 18px;
                cursor: pointer;
                flex-shrink: 0;
            }

            .voice-waveform {
                flex: 1;
                color: rgba(255, 255, 255, 0.7);
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Export for global access
window.GroupChatExtensions = GroupChatExtensions;
