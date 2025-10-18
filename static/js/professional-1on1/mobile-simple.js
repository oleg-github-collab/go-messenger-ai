/**
 * ПРОСТИЙ Мобільний Контролер - БЕЗ ЗАЙВОГО
 */

class SimpleMobileController {
    constructor(uiController) {
        this.ui = uiController;

        if (!this.isMobile()) {
            console.log('[MOBILE] Desktop - skip');
            return;
        }

        console.log('[MOBILE] Init...');
        this.createUI();
        this.attachEvents();
    }

    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    createUI() {
        const body = document.body;

        // Header
        const header = document.createElement('div');
        header.className = 'mobile-header';
        header.innerHTML = `<div class="mobile-timer" id="mobileTimer">0:00</div><div></div>`;
        body.appendChild(header);

        // Controls
        const controls = document.createElement('div');
        controls.className = 'mobile-controls';
        controls.innerHTML = `
            <button class="mobile-btn active" id="mobileMic">🎤</button>
            <button class="mobile-btn active" id="mobileCamera">📹</button>
            <button class="mobile-btn end" id="mobileEnd">📞</button>
        `;
        body.appendChild(controls);

        // FABs
        const fabs = document.createElement('div');
        fabs.className = 'mobile-fabs';
        fabs.innerHTML = `
            <button class="mobile-fab" id="mobileChatBtn">💬</button>
            <button class="mobile-fab" id="mobileNotesBtn">📝</button>
        `;
        body.appendChild(fabs);

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-panel-overlay';
        overlay.id = 'mobileOverlay';
        body.appendChild(overlay);

        // Toast
        const toast = document.createElement('div');
        toast.className = 'mobile-toast';
        toast.id = 'mobileToast';
        body.appendChild(toast);

        // Refs
        this.micBtn = document.getElementById('mobileMic');
        this.cameraBtn = document.getElementById('mobileCamera');
        this.endBtn = document.getElementById('mobileEnd');
        this.chatBtn = document.getElementById('mobileChatBtn');
        this.notesBtn = document.getElementById('mobileNotesBtn');
        this.overlay = overlay;
        this.toast = toast;

        this.addCloseBtns();
        console.log('[MOBILE] UI ready');
    }

    addCloseBtns() {
        const chatPanel = document.getElementById('chatPanel') || document.getElementById('chat-panel');
        const notesPanel = document.getElementById('notetakerPanel') || document.getElementById('notetaker-panel');

        [chatPanel, notesPanel].forEach(panel => {
            if (panel && !panel.querySelector('.mobile-panel-close')) {
                panel.classList.add('mobile-panel');
                const btn = document.createElement('button');
                btn.className = 'mobile-panel-close';
                btn.innerHTML = '×';
                btn.onclick = () => this.closePanel(panel);
                panel.insertBefore(btn, panel.firstChild);
            }
        });
    }

    attachEvents() {
        // Mic
        this.micBtn.onclick = async () => {
            if (!this.ui?.sdk?.hmsActions) return;

            try {
                const current = this.ui.sdk.hmsStore.getState(s => s.localPeer?.audioEnabled === true);
                const newState = !current;

                await this.ui.sdk.hmsActions.setLocalAudioEnabled(newState);

                this.micBtn.classList.toggle('active', newState);
                this.micBtn.classList.toggle('inactive', !newState);
                this.showToast(newState ? 'Mic ON' : 'Mic OFF');

                console.log('[MOBILE] Mic:', newState);
            } catch (err) {
                console.error('[MOBILE] Mic error:', err);
                this.showToast('Error');
            }
        };

        // Camera
        this.cameraBtn.onclick = async () => {
            if (!this.ui?.sdk?.hmsActions) return;

            try {
                const current = this.ui.sdk.hmsStore.getState(s => s.localPeer?.videoEnabled === true);
                const newState = !current;

                await this.ui.sdk.hmsActions.setLocalVideoEnabled(newState);

                this.cameraBtn.classList.toggle('active', newState);
                this.cameraBtn.classList.toggle('inactive', !newState);
                this.showToast(newState ? 'Camera ON' : 'Camera OFF');

                console.log('[MOBILE] Camera:', newState);
            } catch (err) {
                console.error('[MOBILE] Camera error:', err);
                this.showToast('Error');
            }
        };

        // End
        this.endBtn.onclick = () => {
            if (confirm('End call?')) {
                this.ui?.leaveRoom?.();
            }
        };

        // Chat
        this.chatBtn.onclick = () => {
            const panel = document.getElementById('chatPanel') || document.getElementById('chat-panel');
            if (panel) this.openPanel(panel);
        };

        // Notes
        this.notesBtn.onclick = () => {
            const panel = document.getElementById('notetakerPanel') || document.getElementById('notetaker-panel');
            if (panel) this.openPanel(panel);
        };

        // Overlay
        this.overlay.onclick = () => this.closeAllPanels();

        console.log('[MOBILE] Events ready');
    }

    openPanel(panel) {
        panel.classList.add('open');
        this.overlay.classList.add('active');
    }

    closePanel(panel) {
        panel.classList.remove('open');
        this.overlay.classList.remove('active');
    }

    closeAllPanels() {
        document.querySelectorAll('.mobile-panel.open').forEach(p => p.classList.remove('open'));
        this.overlay.classList.remove('active');
    }

    showToast(msg) {
        this.toast.textContent = msg;
        this.toast.classList.add('show');
        setTimeout(() => this.toast.classList.remove('show'), 2000);
    }

    cleanup() {
        document.querySelectorAll('.mobile-header, .mobile-controls, .mobile-fabs, .mobile-panel-overlay, .mobile-toast, .mobile-panel-close').forEach(el => el.remove());
    }
}

window.SimpleMobileController = SimpleMobileController;
