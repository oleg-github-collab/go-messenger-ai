// Role Preset Interactive Buttons Handler
(function() {
    'use strict';

    const rolePresets = [
        { id: '', name: 'General Meeting', emoji: '🎯', description: 'Standard meeting analysis' },
        { id: 'language-teacher', name: 'Language Teacher', emoji: '👨‍🏫', description: 'Grammar & vocabulary focus' },
        { id: 'therapist', name: 'Therapist', emoji: '🧠', description: 'Emotional & psychological insights' },
        { id: 'business-coach', name: 'Business Coach', emoji: '💼', description: 'Strategy & performance' },
        { id: 'medical-consultant', name: 'Medical Consultant', emoji: '⚕️', description: 'Health consultation analysis' },
        { id: 'tutor', name: 'Academic Tutor', emoji: '📚', description: 'Learning outcomes tracking' }
    ];

    function initRolePresetButtons() {
        const buttons = document.querySelectorAll('.role-preset-btn');
        const statusElement = document.getElementById('rolePresetStatus');
        const selectedNameElement = document.getElementById('selectedRoleName');
        const hiddenSelect = document.getElementById('notetakerRolePresetSelect');

        if (!buttons.length) {
            console.warn('[ROLE-PRESETS] Buttons not found, skipping initialization');
            return;
        }

        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const roleId = this.dataset.role;
                const roleName = this.querySelector('span:last-child').textContent;

                // Remove active class from all buttons
                buttons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Update hidden select
                if (hiddenSelect) {
                    hiddenSelect.value = roleId;
                    // Trigger change event for compatibility with existing code
                    const event = new Event('change', { bubbles: true });
                    hiddenSelect.dispatchEvent(event);
                }

                // Update status and selected name
                if (statusElement) {
                    statusElement.textContent = '✓ Active';
                    statusElement.style.animation = 'checkPulse 0.3s ease';
                    setTimeout(() => {
                        if (statusElement) statusElement.style.animation = '';
                    }, 300);
                }

                if (selectedNameElement) {
                    selectedNameElement.textContent = roleName;
                }

                // Sync with rolePresetsManager if available
                if (typeof rolePresetsManager !== 'undefined') {
                    if (roleId) {
                        rolePresetsManager.selectRole(roleId);
                    } else {
                        rolePresetsManager.clearSelection();
                    }
                }

                // Visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 100);

                console.log('[ROLE-PRESETS] ✅ Selected:', roleId || 'general', '-', roleName);
            });
        });

        // Restore selection from localStorage or rolePresetsManager
        const savedRole = localStorage.getItem('notetaker_role_preset') || '';
        const buttonToActivate = Array.from(buttons).find(btn => btn.dataset.role === savedRole) || buttons[0];

        if (buttonToActivate) {
            buttonToActivate.click();
        }

        console.log('[ROLE-PRESETS] 🎭 Interactive buttons initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initRolePresetButtons);
    } else {
        initRolePresetButtons();
    }

    // Also export for manual initialization
    window.initRolePresetButtons = initRolePresetButtons;
})();
