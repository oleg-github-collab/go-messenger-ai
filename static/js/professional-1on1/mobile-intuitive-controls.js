/**
 * Mobile Intuitive Controls for Professional Mode
 * Handles FAB menu, bottom sheet, gestures, and onboarding
 */

class MobileIntuitiveController {
    constructor(uiController) {
        this.uiController = uiController;
        this.isBottomSheetOpen = false;
        this.isFABMenuOpen = false;
        this.touchStartY = 0;
        this.touchStartX = 0;
        this.currentSwipeDirection = null;
        this.hasSeenOnboarding = localStorage.getItem('professional_mobile_onboarding_seen') === 'true';

        this.initializeMobileUI();
    }

    initializeMobileUI() {
        console.log('[MOBILE-INTUITIVE] Initializing mobile controls...');

        // Only initialize on mobile devices
        if (!this.isMobileDevice()) {
            console.log('[MOBILE-INTUITIVE] Not a mobile device, skipping');
            return;
        }

        this.createMobileUIStructure();
        this.attachEventListeners();

        if (!this.hasSeenOnboarding) {
            setTimeout(() => this.showOnboarding(), 1000);
        }

        console.log('[MOBILE-INTUITIVE] ✅ Mobile controls initialized');
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    createMobileUIStructure() {
        const body = document.body;

        // Create main controls container
        const mainControls = document.createElement('div');
        mainControls.className = 'main-controls';
        mainControls.innerHTML = `
            <button class="primary-control mic-control" id="mobile-mic-btn" aria-label="Toggle Microphone">
                <svg class="icon-on" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <svg class="icon-off" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
            </button>
            <button class="primary-control camera-control" id="mobile-camera-btn" aria-label="Toggle Camera">
                <svg class="icon-on" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                </svg>
                <svg class="icon-off" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="1" y1="1" x2="23" y2="23"/>
                    <path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>
                </svg>
            </button>
            <button class="primary-control end-call-control" id="mobile-end-call-btn" aria-label="End Call">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
            </button>
        `;

        // Create FAB menu
        const fabMenu = document.createElement('div');
        fabMenu.className = 'fab-menu';
        fabMenu.innerHTML = `
            <div class="fab-menu-items">
                <button class="fab-item" data-action="chat" aria-label="Open Chat">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span class="fab-label">Chat</span>
                </button>
                <button class="fab-item" data-action="notetaker" aria-label="AI Notetaker">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <span class="fab-label">Notes</span>
                </button>
                <button class="fab-item" data-action="screenshare" aria-label="Share Screen">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                    <span class="fab-label">Screen</span>
                </button>
                <button class="fab-item" data-action="settings" aria-label="Settings">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m0-6l-5.2 3m10.4 0L12 13m0-6l-5.2-3m10.4 0L12 7"/>
                    </svg>
                    <span class="fab-label">More</span>
                </button>
            </div>
            <button class="fab-button" id="mobile-fab-toggle" aria-label="Toggle Menu">
                <svg class="fab-icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
                <svg class="fab-icon-close" style="display:none" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        // Create bottom sheet
        const bottomSheet = document.createElement('div');
        bottomSheet.className = 'mobile-bottom-sheet';
        bottomSheet.innerHTML = `
            <div class="bottom-sheet-handle"></div>
            <div class="bottom-sheet-content">
                <h3 class="bottom-sheet-title">Quick Settings</h3>
                <div class="quick-settings-grid">
                    <button class="quick-setting" data-setting="pip" aria-label="Picture-in-Picture">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="4" width="20" height="14" rx="2"/>
                            <rect x="13" y="11" width="7" height="6" rx="1"/>
                        </svg>
                        <span>PiP</span>
                    </button>
                    <button class="quick-setting" data-setting="layout" aria-label="Layout">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="3" y1="9" x2="21" y2="9"/>
                            <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        <span>Layout</span>
                    </button>
                    <button class="quick-setting" data-setting="quality" aria-label="Video Quality">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="7" width="20" height="10" rx="2" ry="2"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span>Quality</span>
                    </button>
                    <button class="quick-setting" data-setting="effects" aria-label="Video Effects">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                            <line x1="9" y1="9" x2="9.01" y2="9"/>
                            <line x1="15" y1="9" x2="15.01" y2="9"/>
                        </svg>
                        <span>Effects</span>
                    </button>
                    <button class="quick-setting" data-setting="audio" aria-label="Audio Settings">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                        </svg>
                        <span>Audio</span>
                    </button>
                    <button class="quick-setting" data-setting="info" aria-label="Call Info">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="16" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>Info</span>
                    </button>
                </div>
            </div>
        `;

        // Create gesture hint
        const gestureHint = document.createElement('div');
        gestureHint.className = 'gesture-hint';
        gestureHint.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span>Swipe for more</span>
        `;

        // Create status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'mobile-status-indicator';
        statusIndicator.style.display = 'none';

        // Create onboarding overlay
        const onboardingOverlay = document.createElement('div');
        onboardingOverlay.className = 'onboarding-overlay';
        onboardingOverlay.innerHTML = `
            <div class="onboarding-content">
                <div class="onboarding-step active" data-step="1">
                    <div class="onboarding-icon">👆</div>
                    <h2>Welcome to Professional Mode</h2>
                    <p>Tap the buttons at the bottom to control your microphone and camera</p>
                    <button class="onboarding-next">Next</button>
                </div>
                <div class="onboarding-step" data-step="2">
                    <div class="onboarding-icon">☰</div>
                    <h2>Quick Actions</h2>
                    <p>Use the menu button to access chat, notes, screen sharing, and more</p>
                    <button class="onboarding-next">Next</button>
                </div>
                <div class="onboarding-step" data-step="3">
                    <div class="onboarding-icon">⬆️</div>
                    <h2>Advanced Settings</h2>
                    <p>Swipe up from the bottom for quick access to video quality, effects, and audio settings</p>
                    <button class="onboarding-next">Next</button>
                </div>
                <div class="onboarding-step" data-step="4">
                    <div class="onboarding-icon">👈👉</div>
                    <h2>Swipe Gestures</h2>
                    <p>Swipe left or right anywhere on the screen for quick actions</p>
                    <button class="onboarding-finish">Get Started</button>
                </div>
                <div class="onboarding-dots">
                    <span class="dot active"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
        `;

        // Append all elements
        body.appendChild(mainControls);
        body.appendChild(fabMenu);
        body.appendChild(bottomSheet);
        body.appendChild(gestureHint);
        body.appendChild(statusIndicator);
        body.appendChild(onboardingOverlay);

        // Store references
        this.mainControls = mainControls;
        this.fabMenu = fabMenu;
        this.bottomSheet = bottomSheet;
        this.gestureHint = gestureHint;
        this.statusIndicator = statusIndicator;
        this.onboardingOverlay = onboardingOverlay;

        // Hide gesture hint after 5 seconds
        setTimeout(() => {
            gestureHint.style.opacity = '0';
            setTimeout(() => gestureHint.style.display = 'none', 300);
        }, 5000);
    }

    attachEventListeners() {
        // FAB toggle
        const fabToggle = document.getElementById('mobile-fab-toggle');
        fabToggle?.addEventListener('click', () => this.toggleFABMenu());

        // FAB menu items
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleFABAction(action);
            });
        });

        // Main controls
        document.getElementById('mobile-mic-btn')?.addEventListener('click', () => this.handleMicToggle());
        document.getElementById('mobile-camera-btn')?.addEventListener('click', () => this.handleCameraToggle());
        document.getElementById('mobile-end-call-btn')?.addEventListener('click', () => this.handleEndCall());

        // Bottom sheet gestures
        const sheetHandle = this.bottomSheet.querySelector('.bottom-sheet-handle');
        sheetHandle?.addEventListener('touchstart', (e) => this.handleSheetTouchStart(e));
        sheetHandle?.addEventListener('touchmove', (e) => this.handleSheetTouchMove(e));
        sheetHandle?.addEventListener('touchend', () => this.handleSheetTouchEnd());

        // Quick settings
        document.querySelectorAll('.quick-setting').forEach(setting => {
            setting.addEventListener('click', (e) => {
                const settingType = e.currentTarget.dataset.setting;
                this.handleQuickSetting(settingType);
            });
        });

        // Swipe gestures on video container
        const videoContainer = document.getElementById('video-container') || document.body;
        videoContainer.addEventListener('touchstart', (e) => this.handleSwipeStart(e), { passive: true });
        videoContainer.addEventListener('touchmove', (e) => this.handleSwipeMove(e), { passive: true });
        videoContainer.addEventListener('touchend', () => this.handleSwipeEnd());

        // Onboarding
        document.querySelectorAll('.onboarding-next').forEach(btn => {
            btn.addEventListener('click', () => this.nextOnboardingStep());
        });
        document.querySelector('.onboarding-finish')?.addEventListener('click', () => this.finishOnboarding());
    }

    toggleFABMenu() {
        this.isFABMenuOpen = !this.isFABMenuOpen;
        this.fabMenu.classList.toggle('open', this.isFABMenuOpen);

        const iconOpen = this.fabMenu.querySelector('.fab-icon-open');
        const iconClose = this.fabMenu.querySelector('.fab-icon-close');

        if (this.isFABMenuOpen) {
            iconOpen.style.display = 'none';
            iconClose.style.display = 'block';
        } else {
            iconOpen.style.display = 'block';
            iconClose.style.display = 'none';
        }
    }

    handleFABAction(action) {
        console.log(`[MOBILE-INTUITIVE] FAB action: ${action}`);
        this.toggleFABMenu();

        switch (action) {
            case 'chat':
                // Open chat panel
                const chatPanel = document.getElementById('chat-panel');
                if (chatPanel) {
                    chatPanel.classList.add('open');
                    this.uiController?.showChatPanel?.();
                }
                this.showStatus('Chat opened', 'success');
                break;

            case 'notetaker':
                // Open notetaker panel
                const notetakerPanel = document.getElementById('notetaker-panel');
                if (notetakerPanel) {
                    notetakerPanel.classList.add('open');
                    this.uiController?.showNotetakerPanel?.();
                }
                this.showStatus('AI Notetaker opened', 'success');
                break;

            case 'screenshare':
                // Toggle screen share
                this.uiController?.toggleScreenShare?.();
                this.showStatus('Screen share toggled', 'success');
                break;

            case 'settings':
                // Open bottom sheet
                this.openBottomSheet();
                break;
        }
    }

    async handleMicToggle() {
        if (!this.uiController?.sdk) return;

        try {
            const btn = document.getElementById('mobile-mic-btn');
            btn.classList.add('loading');

            const enabled = await this.uiController.sdk.toggleAudio();

            btn.classList.toggle('active', enabled);
            const iconOn = btn.querySelector('.icon-on');
            const iconOff = btn.querySelector('.icon-off');

            if (iconOn && iconOff) {
                iconOn.style.display = enabled ? 'block' : 'none';
                iconOff.style.display = enabled ? 'none' : 'block';
            }

            this.showStatus(enabled ? 'Mic enabled' : 'Mic muted', 'success');
        } catch (error) {
            console.error('[MOBILE-INTUITIVE] Mic toggle failed:', error);
            this.showStatus('Mic toggle failed', 'error');
        } finally {
            document.getElementById('mobile-mic-btn')?.classList.remove('loading');
        }
    }

    async handleCameraToggle() {
        if (!this.uiController?.sdk) return;

        try {
            const btn = document.getElementById('mobile-camera-btn');
            btn.classList.add('loading');

            const enabled = await this.uiController.sdk.toggleVideo();

            btn.classList.toggle('active', enabled);
            const iconOn = btn.querySelector('.icon-on');
            const iconOff = btn.querySelector('.icon-off');

            if (iconOn && iconOff) {
                iconOn.style.display = enabled ? 'block' : 'none';
                iconOff.style.display = enabled ? 'none' : 'block';
            }

            this.showStatus(enabled ? 'Camera enabled' : 'Camera off', 'success');
        } catch (error) {
            console.error('[MOBILE-INTUITIVE] Camera toggle failed:', error);
            this.showStatus('Camera toggle failed', 'error');
        } finally {
            document.getElementById('mobile-camera-btn')?.classList.remove('loading');
        }
    }

    handleEndCall() {
        if (confirm('Are you sure you want to end the call?')) {
            this.uiController?.leaveRoom?.();
            this.showStatus('Ending call...', 'warning');
        }
    }

    handleSheetTouchStart(e) {
        this.touchStartY = e.touches[0].clientY;
        this.bottomSheet.style.transition = 'none';
    }

    handleSheetTouchMove(e) {
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - this.touchStartY;

        if (this.isBottomSheetOpen) {
            // Sheet is open, allow dragging down
            if (deltaY > 0) {
                this.bottomSheet.style.transform = `translateY(${deltaY}px)`;
            }
        } else {
            // Sheet is closed, allow dragging up
            if (deltaY < 0) {
                this.bottomSheet.style.transform = `translateY(calc(100% + ${deltaY}px))`;
            }
        }
    }

    handleSheetTouchEnd() {
        const currentTransform = this.bottomSheet.style.transform;
        const translateY = parseInt(currentTransform.match(/-?\d+/)?.[0] || 0);

        this.bottomSheet.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        if (this.isBottomSheetOpen) {
            // If dragged down more than 100px, close it
            if (translateY > 100) {
                this.closeBottomSheet();
            } else {
                this.openBottomSheet();
            }
        } else {
            // If dragged up more than 100px, open it
            if (translateY < -100) {
                this.openBottomSheet();
            } else {
                this.closeBottomSheet();
            }
        }
    }

    openBottomSheet() {
        this.isBottomSheetOpen = true;
        this.bottomSheet.classList.add('open');
        this.bottomSheet.style.transform = 'translateY(0)';
    }

    closeBottomSheet() {
        this.isBottomSheetOpen = false;
        this.bottomSheet.classList.remove('open');
        this.bottomSheet.style.transform = 'translateY(100%)';
    }

    handleSwipeStart(e) {
        if (e.touches.length !== 1) return;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
    }

    handleSwipeMove(e) {
        if (!this.touchStartX || !this.touchStartY || e.touches.length !== 1) return;

        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = e.touches[0].clientY - this.touchStartY;

        // Only detect horizontal swipes (ignore vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0 && !this.currentSwipeDirection) {
                this.currentSwipeDirection = 'right';
                this.showSwipeFeedback('right');
            } else if (deltaX < 0 && !this.currentSwipeDirection) {
                this.currentSwipeDirection = 'left';
                this.showSwipeFeedback('left');
            }
        }
    }

    handleSwipeEnd() {
        if (this.currentSwipeDirection === 'right') {
            // Swipe right - open chat
            const chatPanel = document.getElementById('chat-panel');
            if (chatPanel) {
                chatPanel.classList.add('open');
                this.showStatus('Chat opened', 'success');
            }
        } else if (this.currentSwipeDirection === 'left') {
            // Swipe left - open notetaker
            const notetakerPanel = document.getElementById('notetaker-panel');
            if (notetakerPanel) {
                notetakerPanel.classList.add('open');
                this.showStatus('AI Notetaker opened', 'success');
            }
        }

        this.currentSwipeDirection = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        // Hide swipe feedback
        document.querySelectorAll('.swipe-feedback').forEach(el => el.remove());
    }

    showSwipeFeedback(direction) {
        const existing = document.querySelector('.swipe-feedback');
        if (existing) existing.remove();

        const feedback = document.createElement('div');
        feedback.className = `swipe-feedback ${direction}`;
        feedback.innerHTML = direction === 'right' ? '💬' : '📝';
        document.body.appendChild(feedback);
    }

    handleQuickSetting(type) {
        console.log(`[MOBILE-INTUITIVE] Quick setting: ${type}`);

        switch (type) {
            case 'pip':
                if (document.pictureInPictureEnabled) {
                    const videoEl = document.querySelector('#local-video') || document.querySelector('video');
                    if (videoEl && !document.pictureInPictureElement) {
                        videoEl.requestPictureInPicture();
                        this.showStatus('PiP enabled', 'success');
                    } else if (document.pictureInPictureElement) {
                        document.exitPictureInPicture();
                        this.showStatus('PiP disabled', 'success');
                    }
                }
                break;

            case 'layout':
                this.uiController?.cycleLayout?.();
                this.showStatus('Layout changed', 'success');
                break;

            case 'quality':
                this.uiController?.cycleVideoQuality?.();
                this.showStatus('Video quality changed', 'success');
                break;

            case 'effects':
                this.showStatus('Effects coming soon', 'info');
                break;

            case 'audio':
                this.showStatus('Audio settings coming soon', 'info');
                break;

            case 'info':
                this.showCallInfo();
                break;
        }
    }

    showCallInfo() {
        const duration = this.uiController?.getCallDuration?.() || 'Unknown';
        const participants = this.uiController?.getParticipantCount?.() || 1;
        this.showStatus(`Duration: ${duration} | Participants: ${participants}`, 'info', 3000);
    }

    showStatus(message, type = 'success', duration = 2000) {
        this.statusIndicator.textContent = message;
        this.statusIndicator.className = `mobile-status-indicator ${type}`;
        this.statusIndicator.style.display = 'block';

        setTimeout(() => {
            this.statusIndicator.style.display = 'none';
        }, duration);
    }

    showOnboarding() {
        this.onboardingOverlay.classList.add('active');
    }

    nextOnboardingStep() {
        const steps = this.onboardingOverlay.querySelectorAll('.onboarding-step');
        const dots = this.onboardingOverlay.querySelectorAll('.dot');
        const activeStep = this.onboardingOverlay.querySelector('.onboarding-step.active');
        const currentStep = parseInt(activeStep.dataset.step);

        if (currentStep < steps.length) {
            activeStep.classList.remove('active');
            dots[currentStep - 1].classList.remove('active');

            const nextStep = this.onboardingOverlay.querySelector(`[data-step="${currentStep + 1}"]`);
            nextStep.classList.add('active');
            dots[currentStep].classList.add('active');
        }
    }

    finishOnboarding() {
        this.onboardingOverlay.classList.remove('active');
        localStorage.setItem('professional_mobile_onboarding_seen', 'true');
        this.hasSeenOnboarding = true;
        this.showStatus('Welcome! Swipe to explore features', 'success', 3000);
    }

    cleanup() {
        // Remove all created elements
        this.mainControls?.remove();
        this.fabMenu?.remove();
        this.bottomSheet?.remove();
        this.gestureHint?.remove();
        this.statusIndicator?.remove();
        this.onboardingOverlay?.remove();
    }
}

// Export for use in UI controller
window.MobileIntuitiveController = MobileIntuitiveController;
