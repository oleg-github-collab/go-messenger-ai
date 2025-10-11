// Simple Raise Hand Implementation using Daily.co sendAppMessage
class DailyRaiseHand {
    constructor(callFrame) {
        this.callFrame = callFrame;
        this.raisedHands = new Map(); // sessionId -> { userName, timestamp }
        this.isHandRaised = false;
        this.localSessionId = callFrame.participants().local?.session_id;

        console.log('[DailyRaiseHand] Initialized for session:', this.localSessionId);

        // Listen for raise hand messages
        this.callFrame.on('app-message', (event) => {
            if (event.data?.type === 'raise-hand') {
                this.handleRaiseHand(event.data);
            }
        });

        this.initUI();
    }

    initUI() {
        // Create raised hands indicator overlay
        const indicator = document.createElement('div');
        indicator.id = 'raisedHandsIndicator';
        indicator.className = 'raised-hands-indicator';
        indicator.style.display = 'none';
        document.body.appendChild(indicator);
    }

    toggleRaiseHand() {
        this.isHandRaised = !this.isHandRaised;

        const participants = this.callFrame.participants();
        const localParticipant = participants.local;

        if (!localParticipant) {
            console.error('[DailyRaiseHand] No local participant found');
            return;
        }

        // Send raise hand event via Daily.co app message
        this.callFrame.sendAppMessage({
            type: 'raise-hand',
            raised: this.isHandRaised,
            userName: localParticipant.user_name,
            sessionId: localParticipant.session_id,
            timestamp: Date.now()
        }, '*'); // Send to all participants

        // Update local state
        if (this.isHandRaised) {
            this.raisedHands.set(localParticipant.session_id, {
                userName: localParticipant.user_name,
                timestamp: Date.now()
            });
        } else {
            this.raisedHands.delete(localParticipant.session_id);
        }

        this.updateUI();
        console.log('[DailyRaiseHand] Hand raised:', this.isHandRaised);
    }

    handleRaiseHand(data) {
        console.log('[DailyRaiseHand] Received raise hand:', data);

        if (data.raised) {
            this.raisedHands.set(data.sessionId, {
                userName: data.userName,
                timestamp: data.timestamp
            });
        } else {
            this.raisedHands.delete(data.sessionId);
        }

        this.updateUI();
    }

    updateUI() {
        // Update button state
        const btn = document.getElementById('raiseHandBtn');
        if (btn) {
            if (this.isHandRaised) {
                btn.classList.add('active');
                btn.style.background = 'rgba(16, 185, 129, 0.9)';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'rgba(255, 193, 7, 0.9)';
            }
        }

        // Update indicator
        const indicator = document.getElementById('raisedHandsIndicator');
        if (this.raisedHands.size > 0) {
            const hands = Array.from(this.raisedHands.values())
                .map(h => `<div class="raised-hand-item">✋ ${h.userName}</div>`)
                .join('');
            indicator.innerHTML = `
                <div class="raised-hands-header">Raised Hands (${this.raisedHands.size})</div>
                ${hands}
            `;
            indicator.style.display = 'block';
        } else {
            indicator.style.display = 'none';
        }
    }

    clearAllHands() {
        this.raisedHands.clear();
        this.isHandRaised = false;
        this.updateUI();
    }
}

// CSS Styles
const raiseHandStyles = document.createElement('style');
raiseHandStyles.textContent = `
.raised-hands-indicator {
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 16px;
    z-index: 1002;
    min-width: 200px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.raised-hands-header {
    font-size: 14px;
    font-weight: 600;
    color: #fbbf24;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.raised-hand-item {
    font-size: 14px;
    color: white;
    padding: 8px;
    margin-bottom: 4px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.raised-hand-item:last-child {
    margin-bottom: 0;
}

/* Button active state */
#raiseHandBtn.active {
    background: rgba(16, 185, 129, 0.9) !important;
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.4);
}

#raiseHandBtn.active:hover {
    background: rgba(16, 185, 129, 1) !important;
}
`;
document.head.appendChild(raiseHandStyles);

// Export
window.DailyRaiseHand = DailyRaiseHand;
