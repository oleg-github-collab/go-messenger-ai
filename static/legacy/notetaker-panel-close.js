// AI Notetaker Panel - Close button functionality
// Adds a close button to the AI Assistant panel

(function() {
    'use strict';

    // Wait for DOM to load
    document.addEventListener('DOMContentLoaded', function() {
        // Find the notetaker panel
        const notetakerGroup = document.getElementById('notetakerGroup');
        const floatingPanel = document.getElementById('notetakerFloatingPanel');

        if (!notetakerGroup) {
            console.log('[NOTETAKER-CLOSE] Panel not found');
            return;
        }

        // Find or create the header
        let header = notetakerGroup.querySelector('.notetaker-header');
        if (!header) {
            header = notetakerGroup.querySelector('.notetaker-title-row');
        }

        if (!header) {
            console.warn('[NOTETAKER-CLOSE] Header not found');
            return;
        }

        // Create close button with improved styling
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notetaker-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close AI Assistant';
        closeBtn.setAttribute('aria-label', 'Close AI Assistant');
        // Styling handled by CSS now for consistency

        // Close functionality
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('[NOTETAKER-CLOSE] Closing AI Assistant panel');

            // Stop recording if active
            if (window.notetaker && window.notetaker.isRecording) {
                console.log('[NOTETAKER-CLOSE] Stopping recording...');
                window.notetaker.toggleRecording();
            }

            // Hide panel with animation
            notetakerGroup.style.opacity = '0';
            notetakerGroup.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                notetakerGroup.style.display = 'none';
                if (floatingPanel) {
                    floatingPanel.style.display = 'none';
                }

                // Save closed state
                localStorage.setItem('notetaker_panel_closed', 'true');

                console.log('[NOTETAKER-CLOSE] Panel closed');
            }, 200);
        });

        // Add close button to header (make it relative if not already)
        const titleRow = header.classList.contains('notetaker-title-row') ? header : header.querySelector('.notetaker-title-row');
        if (titleRow) {
            if (window.getComputedStyle(titleRow).position === 'static') {
                titleRow.style.position = 'relative';
            }
            titleRow.appendChild(closeBtn);
        } else {
            if (window.getComputedStyle(header).position === 'static') {
                header.style.position = 'relative';
            }
            header.appendChild(closeBtn);
        }

        // Check if panel was closed before
        if (localStorage.getItem('notetaker_panel_closed') === 'true') {
            notetakerGroup.style.display = 'none';
            if (floatingPanel) {
                floatingPanel.style.display = 'none';
            }
        }

        // Add button to reopen panel
        createReopenButton();

        console.log('[NOTETAKER-CLOSE] Close button initialized');
    });

    function createReopenButton() {
        // Create a floating button to reopen the panel
        const reopenBtn = document.createElement('button');
        reopenBtn.id = 'reopenNotetakerBtn';
        reopenBtn.innerHTML = '🤖';
        reopenBtn.title = 'Open AI Assistant';
        reopenBtn.style.cssText = `
            position: fixed;
            bottom: 120px;
            right: 20px;
            width: 56px;
            height: 56px;
            border: none;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            z-index: 9998;
        `;

        reopenBtn.addEventListener('mouseenter', function() {
            reopenBtn.style.transform = 'scale(1.1)';
            reopenBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        });

        reopenBtn.addEventListener('mouseleave', function() {
            reopenBtn.style.transform = 'scale(1)';
            reopenBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        });

        reopenBtn.addEventListener('click', function() {
            console.log('[NOTETAKER-CLOSE] Reopening AI Assistant panel');

            const notetakerGroup = document.getElementById('notetakerGroup');
            const floatingPanel = document.getElementById('notetakerFloatingPanel');

            if (notetakerGroup) {
                notetakerGroup.style.display = 'block';
                notetakerGroup.style.opacity = '0';
                notetakerGroup.style.transform = 'translateY(-10px)';

                if (floatingPanel) {
                    floatingPanel.style.display = 'block';
                }

                setTimeout(() => {
                    notetakerGroup.style.opacity = '1';
                    notetakerGroup.style.transform = 'translateY(0)';
                }, 10);

                // Clear closed state
                localStorage.removeItem('notetaker_panel_closed');

                // Hide reopen button
                reopenBtn.style.display = 'none';
            }
        });

        document.body.appendChild(reopenBtn);

        // Show reopen button when panel is closed
        const observer = new MutationObserver(function(mutations) {
            const notetakerGroup = document.getElementById('notetakerGroup');
            const floatingPanel = document.getElementById('notetakerFloatingPanel');

            if (notetakerGroup && floatingPanel) {
                if (notetakerGroup.style.display === 'none' || floatingPanel.style.display === 'none') {
                    reopenBtn.style.display = 'flex';
                } else {
                    reopenBtn.style.display = 'none';
                }
            }
        });

        const notetakerGroup = document.getElementById('notetakerGroup');
        if (notetakerGroup) {
            observer.observe(notetakerGroup, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }
})();
