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
    const oneOnOneBtn = document.getElementById('oneOnOneBtn');
    const groupCallBtn = document.getElementById('groupCallBtn');
    const cancelMeetingType = document.getElementById('cancelMeetingType');

    console.log('[HOME] Page loaded');

    // Show meeting type selection modal
    createMeetingBtn.addEventListener('click', () => {
        meetingTypeModal.style.display = 'flex';
    });

    // Handle 1-on-1 selection
    oneOnOneBtn.addEventListener('click', () => {
        createMeeting('1on1');
    });

    // Handle group call selection
    groupCallBtn.addEventListener('click', () => {
        createMeeting('group');
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
        const subject = encodeURIComponent('Join my video call');
        const body = encodeURIComponent(`Hi! Join me for a video call:\n\n${currentMeetingURL}\n\nThis link expires in 8 hours.`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
        console.log('[HOME] Opened email share');
    });

    // Share via SMS
    shareSMS.addEventListener('click', () => {
        const message = encodeURIComponent(`Join my video call: ${currentMeetingURL}`);

        // iOS/Android detection
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.open(`sms:?body=${message}`, '_blank');
        } else {
            // Desktop - copy and show message
            navigator.clipboard.writeText(currentMeetingURL);
            alert('Link copied! Send it via SMS from your phone.');
        }

        console.log('[HOME] SMS share triggered');
    });

    // Share via Telegram
    shareTelegram.addEventListener('click', () => {
        const message = encodeURIComponent(`Join my video call: ${currentMeetingURL}`);
        window.open(`https://t.me/share/url?url=${encodeURIComponent(currentMeetingURL)}&text=${encodeURIComponent('Join my video call')}`, '_blank');
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
