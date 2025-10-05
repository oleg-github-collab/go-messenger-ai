document.addEventListener('DOMContentLoaded', async () => {
    console.log('[GUEST] Page loaded');

    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    const joinBtnText = document.getElementById('joinBtnText');
    const guestNameInput = document.getElementById('guestName');

    // Load saved language or default to Ukrainian
    const savedLang = localStorage.getItem('preferredLanguage') || 'uk';
    languageSelect.value = savedLang;
    updateLanguage(savedLang);

    languageSelect.addEventListener('change', (e) => {
        const lang = e.target.value;
        localStorage.setItem('preferredLanguage', lang);
        updateLanguage(lang);
    });

    function updateLanguage(lang) {
        if (lang === 'uk') {
            joinBtnText.textContent = 'Приєднатися';
            guestNameInput.placeholder = 'Введіть ваше ім\'я';
        } else {
            joinBtnText.textContent = 'Join Meeting';
            guestNameInput.placeholder = 'Enter your name';
        }
    }

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'join') {
        alert('Invalid meeting link');
        return;
    }

    // Check if this user is the host
    const isHost = sessionStorage.getItem('isHost_' + roomID) === 'true';
    const hostName = sessionStorage.getItem('hostName_' + roomID);

    if (isHost) {
        console.log('[GUEST] 🔑 Host detected, bypassing guest page');
        // Store host name and redirect directly to room
        sessionStorage.setItem('guestName', hostName || 'Host');
        sessionStorage.setItem('isHost', 'true');
        window.location.href = `/room/${roomID}`;
        return;
    }

    const guestForm = document.getElementById('guestForm');

    // Fetch meeting details
    try {
        const response = await fetch(`/api/meeting/${roomID}`);
        const meeting = await response.json();

        if (meeting.host_name) {
            document.getElementById('hostName').textContent = meeting.host_name;
        }

        console.log('[GUEST] Meeting details loaded:', meeting);
    } catch (error) {
        console.error('[GUEST] Failed to load meeting details:', error);
    }

    // Handle form submission
    if (guestForm) {
        guestForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const guestName = guestNameInput.value.trim();

            if (!guestName) {
                const errorMsg = savedLang === 'uk' ? 'Будь ласка, введіть ваше ім\'я' : 'Please enter your name';
                alert(errorMsg);
                return;
            }

            console.log('[GUEST] Joining as:', guestName);

            // Store guest name in sessionStorage
            sessionStorage.setItem('guestName', guestName);
            sessionStorage.setItem('isHost', 'false');

            // Redirect to room
            console.log('[GUEST] Redirecting to:', `/room/${roomID}`);
            window.location.href = `/room/${roomID}`;
        });
    }

    // Auto-focus name input
    guestNameInput.focus();
});
