/**
 * Integration Patch for Enhanced Features
 * Connects ProfessionalAINotetaker and EnhancedProfessionalChat with ProfessionalUIController
 */

(function() {
    console.log('[INTEGRATION-PATCH] Applying enhanced features integration...');

    // Store original methods
    const originalInit = ProfessionalUIController.prototype.initializeAsHost;
    const originalInitGuest = ProfessionalUIController.prototype.initializeAsGuest;

    // Override initializeAsHost to add enhanced features
    ProfessionalUIController.prototype.initializeAsHost = async function(...args) {
        // Call original initialization
        const result = await originalInit.apply(this, args);

        // Initialize enhanced features after HMS is ready
        if (this.sdk && this.sdk.hmsStore) {
            console.log('[INTEGRATION] Initializing enhanced features for host...');

            try {
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

                    // Subscribe to HMS messages
                    if (this.sdk.hmsStore && this.sdk.hmsStore.subscribe) {
                        this.sdk.hmsStore.subscribe((message) => {
                            if (message && message.type === 'BROADCAST') {
                                const sender = message.senderName || 'Unknown';
                                const messageString = message.message || '';
                                this.enhancedChat.handleIncomingMessage(sender, messageString);
                            }
                        }, 'HMSMessage');
                    }

                    console.log('[INTEGRATION] ✅ Enhanced Chat initialized');
                } else {
                    console.warn('[INTEGRATION] EnhancedProfessionalChat not available');
                }

            } catch (error) {
                console.error('[INTEGRATION] ❌ Failed to initialize enhanced features:', error);
            }
        }

        return result;
    };

    // Override initializeAsGuest to add enhanced features
    ProfessionalUIController.prototype.initializeAsGuest = async function(...args) {
        // Call original initialization
        const result = await originalInitGuest.apply(this, args);

        // Initialize enhanced features after HMS is ready
        if (this.sdk && this.sdk.hmsStore) {
            console.log('[INTEGRATION] Initializing enhanced features for guest...');

            try {
                // Initialize Professional Notetaker (guests can't start, but can see it)
                if (typeof ProfessionalAINotetaker !== 'undefined') {
                    const roomID = this.roomCode || this.sdk.roomCode || 'default';
                    this.professionalNotetaker = new ProfessionalAINotetaker(roomID, false, this.sdk);
                    console.log('[INTEGRATION] ✅ Professional Notetaker initialized (guest mode)');
                }

                // Initialize Enhanced Chat
                if (typeof EnhancedProfessionalChat !== 'undefined') {
                    this.enhancedChat = new EnhancedProfessionalChat(this.sdk);

                    // Subscribe to HMS messages
                    if (this.sdk.hmsStore && this.sdk.hmsStore.subscribe) {
                        this.sdk.hmsStore.subscribe((message) => {
                            if (message && message.type === 'BROADCAST') {
                                const sender = message.senderName || 'Unknown';
                                const messageString = message.message || '';

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
                        }, 'HMSMessage');
                    }

                    console.log('[INTEGRATION] ✅ Enhanced Chat initialized');
                }

            } catch (error) {
                console.error('[INTEGRATION] ❌ Failed to initialize enhanced features:', error);
            }
        }

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
