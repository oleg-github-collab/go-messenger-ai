document.addEventListener('DOMContentLoaded', () => {
    const createMeetingBtn = document.getElementById('createMeetingBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const shareSection = document.getElementById('shareSection');
    const closeShare = document.getElementById('closeShare');
    const meetingLinkInput = document.getElementById('meetingLink');
    const copyBtn = document.getElementById('copyBtn');
    const shareEmail = document.getElementById('shareEmail');
    const shareSMS = document.getElementById('shareSMS');
    const shareTelegram = document.getElementById('shareTelegram');
    const joinNow = document.getElementById('joinNow');

    let currentMeetingURL = '';

    // Meeting type selection elements
    const meetingTypeModal = document.getElementById('meetingTypeModal');
    const audioCallBtn = document.getElementById('audioCallBtn');
    const oneOnOneBtn = document.getElementById('oneOnOneBtn');
    const groupCallBtn = document.getElementById('groupCallBtn');
    const professionalAIBtn = document.getElementById('professionalAIBtn');
    const cancelMeetingType = document.getElementById('cancelMeetingType');

    console.log('[HOME] Page loaded');

    // Show meeting type selection modal
    createMeetingBtn.addEventListener('click', () => {
        meetingTypeModal.style.display = 'flex';
    });

    // Handle audio call selection
    audioCallBtn.addEventListener('click', () => {
        createMeeting('audio');
    });

    // Handle 1-on-1 selection
    oneOnOneBtn.addEventListener('click', () => {
        createMeeting('1on1');
    });

    // Handle group call selection
    groupCallBtn.addEventListener('click', () => {
        createMeeting('group');
    });

    // Handle Professional AI selection
    professionalAIBtn.addEventListener('click', async () => {
        const hostName = document.getElementById('hostNameInput').value.trim() || 'Oleh';
        meetingTypeModal.style.display = 'none';

        // Create room using Professional API
        createMeetingBtn.disabled = true;
        const originalHTML = createMeetingBtn.innerHTML;
        createMeetingBtn.innerHTML = '<span class="btn-icon">⏳</span> Creating AI Room...';

        try {
            const response = await fetch('/api/professional/create-room', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    host_name: hostName
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('[HOME] ✅ Professional room created:', data);

                currentMeetingURL = data.host_url;

                // Show share section with both host and guest links
                meetingLinkInput.value = data.invite_url;
                shareSection.style.display = 'block';
                createMeetingBtn.style.display = 'none';

                // Add special section for host link
                const hostLinkSection = document.createElement('div');
                hostLinkSection.className = 'host-link-section';
                hostLinkSection.innerHTML = `
                    <div style="margin-top: 20px; padding: 16px; background: rgba(79, 172, 254, 0.1); border-radius: 12px; border: 1px solid rgba(79, 172, 254, 0.3);">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #4facfe; font-weight: 600;">🎯 Your Host Link (with AI controls):</p>
                        <div style="display: flex; gap: 10px;">
                            <input type="text" value="${data.host_url}" readonly style="flex: 1; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(79,172,254,0.2); border-radius: 8px; color: white; font-size: 13px;">
                            <button onclick="navigator.clipboard.writeText('${data.host_url}'); this.textContent='✓ Copied'" style="padding: 10px 20px; background: #4facfe; border: none; border-radius: 8px; color: white; font-weight: 600; cursor: pointer;">Copy</button>
                        </div>
                    </div>
                `;
                shareSection.appendChild(hostLinkSection);

                // Auto-copy guest invite link
                navigator.clipboard.writeText(data.invite_url);
                copyBtn.textContent = '✓ Copied';

            } else {
                const errorText = await response.text();
                console.error('[HOME] ❌ Server error:', response.status, errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
        } catch (error) {
            console.error('[HOME] ❌ Room creation failed:', error);
            alert('Failed to create Professional AI room. Please login first.');
            createMeetingBtn.disabled = false;
            createMeetingBtn.innerHTML = originalHTML;
        }
    });

    // Cancel modal
    cancelMeetingType.addEventListener('click', () => {
        meetingTypeModal.style.display = 'none';
    });

    // Close modal on backdrop click
    meetingTypeModal.addEventListener('click', (e) => {
        if (e.target === meetingTypeModal) {
            meetingTypeModal.style.display = 'none';
        }
    });

    // Create meeting function
    async function createMeeting(mode) {
        const hostName = document.getElementById('hostNameInput').value.trim() || 'Host';

        meetingTypeModal.style.display = 'none';
        createMeetingBtn.disabled = true;
        const originalHTML = createMeetingBtn.innerHTML;
        createMeetingBtn.innerHTML = '<span class="btn-icon">⏳</span> Creating...';

        try {
            const response = await fetch(`/create?mode=${mode}&name=${encodeURIComponent(hostName)}`, {
                method: 'GET',
                credentials: 'include'
            });

            console.log('[HOME] Create meeting response:', response.status);

            if (response.ok) {
                const url = await response.text();
                currentMeetingURL = url;
                console.log('[HOME] ✅ Meeting URL:', url);

                // Extract room ID from URL
                const roomID = url.split('/').pop();

                // Store that current user is host of this room
                sessionStorage.setItem('isHost_' + roomID, 'true');
                sessionStorage.setItem('hostName_' + roomID, hostName);
                console.log('[HOME] 🔑 Stored host flag for room:', roomID);

                // Show share section
                meetingLinkInput.value = url;
                shareSection.style.display = 'block';
                createMeetingBtn.style.display = 'none';

                // Auto-copy to clipboard
                try {
                    await navigator.clipboard.writeText(url);
                    console.log('[HOME] URL auto-copied');
                } catch (e) {
                    console.log('[HOME] Clipboard failed:', e);
                }
            } else if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            } else {
                alert('Failed to create meeting. Please try again.');
            }
        } catch (error) {
            console.error('[HOME] Error:', error);
            alert('Connection error. Please try again.');
        } finally {
            createMeetingBtn.disabled = false;
            createMeetingBtn.innerHTML = originalHTML;
        }
    }

    // Close share section
    closeShare.addEventListener('click', () => {
        shareSection.style.display = 'none';
        createMeetingBtn.style.display = 'flex';
        currentMeetingURL = '';
    });

    // Copy link
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(currentMeetingURL);
            copyBtn.innerHTML = '<span class="icon">✓</span> Copied!';
            copyBtn.classList.add('copied');

            setTimeout(() => {
                copyBtn.innerHTML = '<span class="icon">📋</span> Copy';
                copyBtn.classList.remove('copied');
            }, 2000);

            console.log('[HOME] ✅ Link copied');
        } catch (error) {
            console.error('[HOME] Copy failed:', error);
            alert('Failed to copy link');
        }
    });

    // Share via Email
    shareEmail.addEventListener('click', () => {
        const subject = encodeURIComponent('🎥 Join my secure video call - Kaminskyi Messenger');
        const body = encodeURIComponent(`Hi! 👋\n\nI'm inviting you to join a secure video call on Kaminskyi Messenger.\n\n🔗 Join here: ${currentMeetingURL}\n\n✨ Features:\n• End-to-end encrypted video & audio\n• No registration required\n• Works on any device\n• Link expires in 8 hours\n\nSee you there!\n\n---\nPowered by Kaminskyi Messenger - Decentralized Web 3.0 Communication`);
        const mailtoLink = `mailto:?subject=${subject}&body=${body}`;

        // Force open in external browser
        if (navigator.userAgent.includes('Telegram')) {
            window.location.href = mailtoLink;
        } else {
            window.open(mailtoLink, '_system');
        }
        console.log('[HOME] Opened email share');
    });

    // Share via SMS
    shareSMS.addEventListener('click', () => {
        const message = encodeURIComponent(`🎥 Join my secure video call on Kaminskyi Messenger: ${currentMeetingURL} (Link expires in 8h)`);

        // iOS/Android detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            const smsLink = `sms:?body=${message}`;
            // Force open in external browser/app
            if (navigator.userAgent.includes('Telegram')) {
                window.location.href = smsLink;
            } else {
                window.open(smsLink, '_system');
            }
        } else {
            // Desktop - copy and show message
            navigator.clipboard.writeText(currentMeetingURL);
            alert('Link copied! Send it via SMS from your phone.');
        }

        console.log('[HOME] SMS share triggered');
    });

    // Share via Telegram
    shareTelegram.addEventListener('click', () => {
        const text = '🎥 Join my secure video call on Kaminskyi Messenger (Decentralized Web 3.0)';
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentMeetingURL)}&text=${encodeURIComponent(text)}`;

        // Force open in external browser
        window.open(telegramUrl, '_blank', 'noopener');
        console.log('[HOME] Opened Telegram share');
    });

    // Join Now
    joinNow.addEventListener('click', () => {
        window.location.href = currentMeetingURL;
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            console.log('[HOME] Logging out...');
            localStorage.removeItem('authToken');
            window.location.href = '/logout';
        }
    });
});
