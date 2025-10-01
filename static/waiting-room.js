// Waiting Room and Join Request Handling

// Sound notification for join requests
const joinRequestSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSx+zPDTgjMGHm7A7+OZUQ0MUKXi8LJnHwU9k9ryz34rBSh3y/DciT0IEme47+mnWRMLR6Df8r9vIgUtfsvy1IU1Bxtr');

class WaitingRoomUI {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        // Create waiting room modal
        this.modal = document.createElement('div');
        this.modal.id = 'waitingRoomModal';
        this.modal.className = 'waiting-room-modal';
        this.modal.style.display = 'none';
        this.modal.innerHTML = `
            <div class="waiting-room-content">
                <div class="waiting-icon">⏳</div>
                <h2>Waiting for Host</h2>
                <p>The host will let you in soon...</p>
                <div class="waiting-spinner"></div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    show() {
        this.modal.style.display = 'flex';
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

class JoinRequestUI {
    constructor(onApprove, onReject) {
        this.onApprove = onApprove;
        this.onReject = onReject;
        this.modal = null;
        this.currentRequest = null;
        this.init();
    }

    init() {
        // Create join request modal
        this.modal = document.createElement('div');
        this.modal.id = 'joinRequestModal';
        this.modal.className = 'join-request-modal';
        this.modal.style.display = 'none';
        this.modal.innerHTML = `
            <div class="join-request-content">
                <div class="join-request-icon">🔔</div>
                <h2 id="joinRequestName">Guest wants to join</h2>
                <p>Do you want to admit them to the meeting?</p>
                <div class="join-request-buttons">
                    <button class="join-request-btn reject-btn" id="rejectJoinBtn">
                        <span>✕</span> Reject
                    </button>
                    <button class="join-request-btn approve-btn" id="approveJoinBtn">
                        <span>✓</span> Admit
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);

        // Add event listeners
        document.getElementById('approveJoinBtn').addEventListener('click', () => {
            if (this.currentRequest) {
                this.onApprove(this.currentRequest.id);
                this.hide();
            }
        });

        document.getElementById('rejectJoinBtn').addEventListener('click', () => {
            if (this.currentRequest) {
                this.onReject(this.currentRequest.id);
                this.hide();
            }
        });
    }

    show(guestData) {
        this.currentRequest = guestData;
        document.getElementById('joinRequestName').textContent = `${guestData.name} wants to join`;
        this.modal.style.display = 'flex';

        // Play sound
        try {
            joinRequestSound.play().catch(e => console.log('[SOUND] Play failed:', e));
        } catch (e) {
            console.log('[SOUND] Not available:', e);
        }

        // Auto-hide after 30 seconds
        setTimeout(() => {
            if (this.modal.style.display === 'flex') {
                this.onReject(guestData.id);
                this.hide();
            }
        }, 30000);
    }

    hide() {
        this.modal.style.display = 'none';
        this.currentRequest = null;
    }
}

// Add CSS styles
const style = document.createElement('style');
style.textContent = `
/* Waiting Room Modal */
.waiting-room-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.waiting-room-content {
    text-align: center;
    padding: 48px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 24px;
    border: 2px solid rgba(59, 130, 246, 0.3);
    max-width: 400px;
}

.waiting-icon {
    font-size: 64px;
    margin-bottom: 24px;
    animation: pulse 2s ease-in-out infinite;
}

.waiting-room-content h2 {
    font-size: 28px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
}

.waiting-room-content p {
    font-size: 16px;
    color: #94a3b8;
    margin-bottom: 32px;
}

.waiting-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(59, 130, 246, 0.2);
    border-top-color: #3b82f6;
    border-radius: 50%;
    margin: 0 auto;
    animation: spin 1s linear infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Join Request Modal */
.join-request-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    animation: fadeIn 0.3s ease;
}

.join-request-content {
    text-align: center;
    padding: 40px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 24px;
    border: 2px solid rgba(59, 130, 246, 0.5);
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3);
}

.join-request-icon {
    font-size: 56px;
    margin-bottom: 20px;
    animation: shake 0.5s ease;
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}

.join-request-content h2 {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin-bottom: 12px;
}

.join-request-content p {
    font-size: 15px;
    color: #94a3b8;
    margin-bottom: 28px;
}

.join-request-buttons {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.join-request-btn {
    padding: 14px 24px;
    border-radius: 12px;
    border: none;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.approve-btn {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.approve-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.approve-btn:active {
    transform: translateY(0);
}

.reject-btn {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 2px solid rgba(239, 68, 68, 0.3);
}

.reject-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
}

.reject-btn:active {
    transform: scale(0.95);
}

@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}

@media (max-width: 480px) {
    .waiting-room-content,
    .join-request-content {
        margin: 20px;
        padding: 32px 24px;
    }

    .join-request-buttons {
        grid-template-columns: 1fr;
    }
}
`;
document.head.appendChild(style);

// Export
window.WaitingRoomUI = WaitingRoomUI;
window.JoinRequestUI = JoinRequestUI;
