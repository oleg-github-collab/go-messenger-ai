/**
 * Integration Patch for Enhanced Features
 * Connects ProfessionalAINotetaker and EnhancedProfessionalChat with ProfessionalUIController
 */

(function() {
    console.log('[INTEGRATION-PATCH] Applying enhanced features integration...');

    // Wait for HMS to be fully ready before initializing enhanced features
    function waitForHMSReady(sdk, callback, maxAttempts = 20) {
        let attempts = 0;

        const checkInterval = setInterval(() => {
            attempts++;

            if (sdk && sdk.hmsActions && sdk.hmsStore && sdk.isJoined) {
                clearInterval(checkInterval);
                console.log('[INTEGRATION] HMS is ready, initializing enhanced features...');
                callback();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('[INTEGRATION] HMS not ready after', attempts, 'attempts');
            }
        }, 500);
    }

    // Store original methods
    const originalInit = ProfessionalUIController.prototype.initializeAsHost;
    const originalInitGuest = ProfessionalUIController.prototype.initializeAsGuest;

    // Override initializeAsHost to add enhanced features
    ProfessionalUIController.prototype.initializeAsHost = async function(...args) {
        // Call original initialization
        const result = await originalInit.apply(this, args);

        // Wait for HMS to be fully ready
        waitForHMSReady(this.sdk, () => {
            try {
                console.log('[INTEGRATION] Initializing enhanced features for host...');

                // Initialize Professional Notetaker
                if (typeof ProfessionalAINotetaker !== 'undefined') {
                    const roomID = this.roomCode || this.sdk.roomCode || 'default';
                    this.professionalNotetaker = new ProfessionalAINotetaker(roomID, true, this.sdk);
                    console.log('[INTEGRATION] ✅ Professional Notetaker initialized');
                } else {
                    console.warn('[INTEGRATION] ProfessionalAINotetaker not available');
                }

                // Initialize Enhanced Chat
                if (typeof EnhancedProfessionalChat !== 'undefined') {
                    this.enhancedChat = new EnhancedProfessionalChat(this.sdk);
                    console.log('[INTEGRATION] ✅ Enhanced Chat initialized');

                    // Listen to HMS notification events for messages
                    if (this.sdk.hmsNotifications) {
                        this.sdk.hmsNotifications.onNotification((notification) => {
                            if (notification.type === 'NEW_MESSAGE' && notification.data) {
                                const message = notification.data;
                                const sender = message.senderName || 'Unknown';
                                const messageString = message.message || '';

                                if (this.enhancedChat) {
                                    // Handle reactions separately
                                    try {
                                        const data = JSON.parse(messageString);
                                        if (data.type === 'reaction') {
                                            this.enhancedChat.handleIncomingReaction(data.messageId, data.emoji);
                                            return;
                                        }
                                    } catch (err) {
                                        // Not JSON, continue normally
                                    }

                                    this.enhancedChat.handleIncomingMessage(sender, messageString);
                                }
                            }
                        });
                        console.log('[INTEGRATION] ✅ HMS message listener attached');
                    }
                } else {
                    console.warn('[INTEGRATION] EnhancedProfessionalChat not available');
                }

            } catch (error) {
                console.error('[INTEGRATION] ❌ Failed to initialize enhanced features:', error);
            }
        });

        return result;
    };

    // Override initializeAsGuest to add enhanced features
    ProfessionalUIController.prototype.initializeAsGuest = async function(...args) {
        // Call original initialization
        const result = await originalInitGuest.apply(this, args);

        // Wait for HMS to be fully ready
        waitForHMSReady(this.sdk, () => {
            try {
                console.log('[INTEGRATION] Initializing enhanced features for guest...');

                // Initialize Professional Notetaker (guests can't start, but can see it)
                if (typeof ProfessionalAINotetaker !== 'undefined') {
                    const roomID = this.roomCode || this.sdk.roomCode || 'default';
                    this.professionalNotetaker = new ProfessionalAINotetaker(roomID, false, this.sdk);
                    console.log('[INTEGRATION] ✅ Professional Notetaker initialized (guest mode)');
                }

                // Initialize Enhanced Chat
                if (typeof EnhancedProfessionalChat !== 'undefined') {
                    this.enhancedChat = new EnhancedProfessionalChat(this.sdk);
                    console.log('[INTEGRATION] ✅ Enhanced Chat initialized');

                    // Listen to HMS notification events for messages
                    if (this.sdk.hmsNotifications) {
                        this.sdk.hmsNotifications.onNotification((notification) => {
                            if (notification.type === 'NEW_MESSAGE' && notification.data) {
                                const message = notification.data;
                                const sender = message.senderName || 'Unknown';
                                const messageString = message.message || '';

                                if (this.enhancedChat) {
                                    // Handle reactions separately
                                    try {
                                        const data = JSON.parse(messageString);
                                        if (data.type === 'reaction') {
                                            this.enhancedChat.handleIncomingReaction(data.messageId, data.emoji);
                                            return;
                                        }
                                    } catch (err) {
                                        // Not JSON, continue normally
                                    }

                                    this.enhancedChat.handleIncomingMessage(sender, messageString);
                                }
                            }
                        });
                        console.log('[INTEGRATION] ✅ HMS message listener attached');
                    }
                } else {
                    console.warn('[INTEGRATION] EnhancedProfessionalChat not available');
                }

            } catch (error) {
                console.error('[INTEGRATION] ❌ Failed to initialize enhanced features:', error);
            }
        });

        return result;
    };

    // Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.__PRO_UI__) {
            const ui = window.__PRO_UI__;

            if (ui.professionalNotetaker && typeof ui.professionalNotetaker.cleanup === 'function') {
                ui.professionalNotetaker.cleanup();
                console.log('[INTEGRATION] Professional Notetaker cleaned up');
            }
        }
    });

    console.log('[INTEGRATION-PATCH] ✅ Integration patch applied');
})();
