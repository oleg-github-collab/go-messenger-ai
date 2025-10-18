/**
 * Poll Integration for Enhanced Chat
 * Polls appear as special messages in chat with real-time voting
 */

// Add to EnhancedProfessionalChat class:

// Poll creation method
EnhancedProfessionalChat.prototype.createPoll = function() {
    const questionEl = document.getElementById('pollQuestion');
    const optionsContainer = document.getElementById('pollOptionsList');
    const anonymousCheckbox = document.getElementById('pollAnonymous');
    const multipleCheckbox = document.getElementById('pollMultiple');

    if (!questionEl || !optionsContainer) {
        console.error('[POLLS] Poll UI elements not found');
        return;
    }

    const question = questionEl.value.trim();
    if (!question) {
        alert('Please enter a poll question');
        return;
    }

    // Get options
    const optionInputs = optionsContainer.querySelectorAll('.poll-option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(text => text.length > 0);

    if (options.length < 2) {
        alert('Please add at least 2 options');
        return;
    }

    // Create poll message
    const pollId = `poll-${Date.now()}`;
    const pollData = {
        type: 'poll_create',
        content: {
            pollId,
            question,
            options,
            settings: {
                anonymous: anonymousCheckbox?.checked || false,
                multipleChoice: multipleCheckbox?.checked || false
            },
            createdBy: this.hmsSDK.userName || 'Host',
            votes: options.map(() => 0), // Initialize vote counts
            voters: options.map(() => []) // Track voters per option
        },
        timestamp: Date.now()
    };

    // Store poll
    this.activePolls.set(pollId, pollData.content);

    // Broadcast poll
    this.broadcastMessage(pollData);

    // Display locally
    this.displayPollMessage('You', pollData, true);

    // Clear form
    questionEl.value = '';
    optionInputs.forEach(input => input.value = '');
    if (anonymousCheckbox) anonymousCheckbox.checked = false;
    if (multipleCheckbox) multipleCheckbox.checked = false;

    // Close poll modal
    const pollModal = document.getElementById('pollModal');
    if (pollModal) {
        pollModal.classList.remove('visible');
        pollModal.style.display = 'none';
    }

    console.log('[POLLS] Poll created:', pollId);
};

// Display poll message in chat
EnhancedProfessionalChat.prototype.displayPollMessage = function(sender, messageData, isMe) {
    const pollContent = messageData.content;
    const pollId = pollContent.pollId;

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message poll-message ${isMe ? 'me' : 'other'}`;
    msgDiv.dataset.messageId = messageData.timestamp;
    msgDiv.dataset.pollId = pollId;

    const time = new Date(messageData.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const hasVoted = this.userVotedPolls.has(pollId);
    const totalVotes = pollContent.votes.reduce((sum, count) => sum + count, 0);

    // Build options HTML
    let optionsHTML = '';
    pollContent.options.forEach((option, index) => {
        const voteCount = pollContent.votes[index] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        const inputType = pollContent.settings.multipleChoice ? 'checkbox' : 'radio';

        optionsHTML += `
            <div class="poll-option" data-option-index="${index}">
                <div class="poll-option-bar">
                    <div class="poll-option-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="poll-option-content">
                    <label>
                        <input type="${inputType}"
                               name="poll-${pollId}"
                               value="${index}"
                               ${hasVoted ? 'disabled' : ''}>
                        <span class="poll-option-text">${this.escapeHtml(option)}</span>
                    </label>
                    <span class="poll-option-votes">${voteCount} (${percentage}%)</span>
                </div>
            </div>
        `;
    });

    msgDiv.innerHTML = `
        <div class="message-header">
            <span class="sender-name">${isMe ? 'You' : sender}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-poll" data-poll-id="${pollId}">
            <div class="poll-header">
                <span class="poll-icon">📊</span>
                <span class="poll-question">${this.escapeHtml(pollContent.question)}</span>
            </div>
            <div class="poll-options">
                ${optionsHTML}
            </div>
            <div class="poll-footer">
                <span class="poll-vote-count">${totalVotes} vote${totalVotes !== 1 ? 's' : ''}</span>
                ${hasVoted ?
                    '<span class="poll-voted-indicator">✓ Voted</span>' :
                    `<button class="poll-submit-btn" data-poll-id="${pollId}">Vote</button>`
                }
            </div>
        </div>
    `;

    this.chatMessages.appendChild(msgDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    // Add vote button handler if not voted
    if (!hasVoted) {
        const voteBtn = msgDiv.querySelector('.poll-submit-btn');
        if (voteBtn) {
            voteBtn.addEventListener('click', () => this.submitPollVote(pollId));
        }
    }
};

// Submit poll vote
EnhancedProfessionalChat.prototype.submitPollVote = function(pollId) {
    const poll = this.activePolls.get(pollId);
    if (!poll) {
        console.error('[POLLS] Poll not found:', pollId);
        return;
    }

    // Get selected options
    const inputs = document.querySelectorAll(`input[name="poll-${pollId}"]:checked`);
    if (inputs.length === 0) {
        alert('Please select an option');
        return;
    }

    const selectedIndices = Array.from(inputs).map(input => parseInt(input.value));

    // Validate multiple choice
    if (!poll.settings.multipleChoice && selectedIndices.length > 1) {
        alert('Only one option allowed');
        return;
    }

    // Create vote message
    const voteData = {
        type: 'poll_vote',
        content: {
            pollId,
            optionIndices: selectedIndices,
            voter: poll.settings.anonymous ? 'Anonymous' : (this.hmsSDK.userName || 'Guest')
        },
        timestamp: Date.now()
    };

    // Update local state
    this.userVotedPolls.add(pollId);
    selectedIndices.forEach(index => {
        poll.votes[index]++;
        poll.voters[index].push(voteData.content.voter);
    });
    this.activePolls.set(pollId, poll);

    // Broadcast vote
    this.broadcastMessage(voteData);

    // Update UI
    this.updatePollUI(pollId);

    console.log('[POLLS] Vote submitted:', pollId, selectedIndices);
};

// Handle incoming poll vote
EnhancedProfessionalChat.prototype.handlePollVote = function(voteData) {
    const pollId = voteData.content.pollId;
    const poll = this.activePolls.get(pollId);

    if (!poll) {
        console.warn('[POLLS] Received vote for unknown poll:', pollId);
        return;
    }

    // Update vote counts
    voteData.content.optionIndices.forEach(index => {
        poll.votes[index]++;
        poll.voters[index].push(voteData.content.voter);
    });

    this.activePolls.set(pollId, poll);

    // Update UI
    this.updatePollUI(pollId);
};

// Update poll UI with current votes
EnhancedProfessionalChat.prototype.updatePollUI = function(pollId) {
    const poll = this.activePolls.get(pollId);
    if (!poll) return;

    const pollMsg = document.querySelector(`[data-poll-id="${pollId}"]`);
    if (!pollMsg) return;

    const totalVotes = poll.votes.reduce((sum, count) => sum + count, 0);
    const hasVoted = this.userVotedPolls.has(pollId);

    // Update each option
    poll.options.forEach((option, index) => {
        const voteCount = poll.votes[index] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

        const optionEl = pollMsg.querySelector(`[data-option-index="${index}"]`);
        if (optionEl) {
            const fillBar = optionEl.querySelector('.poll-option-fill');
            const votesSpan = optionEl.querySelector('.poll-option-votes');
            const input = optionEl.querySelector('input');

            if (fillBar) fillBar.style.width = `${percentage}%`;
            if (votesSpan) votesSpan.textContent = `${voteCount} (${percentage}%)`;
            if (input && hasVoted) input.disabled = true;
        }
    });

    // Update footer
    const footer = pollMsg.querySelector('.poll-footer');
    if (footer) {
        const voteCountSpan = footer.querySelector('.poll-vote-count');
        if (voteCountSpan) {
            voteCountSpan.textContent = `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`;
        }

        // Update vote button
        if (hasVoted) {
            const voteBtn = footer.querySelector('.poll-submit-btn');
            if (voteBtn) {
                voteBtn.outerHTML = '<span class="poll-voted-indicator">✓ Voted</span>';
            }
        }
    }
};

// Add poll handling to existing handleIncomingMessage
// This extends the existing method
const originalHandleIncoming = EnhancedProfessionalChat.prototype.handleIncomingMessage;
EnhancedProfessionalChat.prototype.handleIncomingMessage = function(sender, messageString) {
    try {
        const messageData = JSON.parse(messageString);

        // Handle poll messages
        if (messageData.type === 'poll_create') {
            this.activePolls.set(messageData.content.pollId, messageData.content);
            this.displayPollMessage(sender, messageData, false);
            return;
        }

        if (messageData.type === 'poll_vote') {
            this.handlePollVote(messageData);
            return; // Don't display vote messages
        }

        // Fall through to original handler for other messages
        originalHandleIncoming.call(this, sender, messageString);
    } catch (err) {
        // Fall through to original handler
        originalHandleIncoming.call(this, sender, messageString);
    }
};

console.log('[POLLS] ✅ Poll integration loaded');
