document.addEventListener('DOMContentLoaded', async () => {
    console.log('[GUEST] Page loaded');

    // Language selector
    const languageSelect = document.getElementById('languageSelect');
    const joinBtnText = document.getElementById('joinBtnText');
    const guestNameInput = document.getElementById('guestName');

    // Device setup elements
    const guestForm = document.getElementById('guestForm');
    const deviceSetup = document.getElementById('deviceSetup');
    const previewVideo = document.getElementById('previewVideo');
    const cameraSelect = document.getElementById('cameraSelect');
    const microphoneSelect = document.getElementById('microphoneSelect');
    const enableVideo = document.getElementById('enableVideo');
    const enableAudio = document.getElementById('enableAudio');
    const backBtn = document.getElementById('backBtn');
    const continueBtn = document.getElementById('continueBtn');

    let previewStream = null;

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
            joinBtnText.textContent = 'Далі';
            guestNameInput.placeholder = 'Введіть ваше ім\'я';
        } else {
            joinBtnText.textContent = 'Next';
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

    // Check if this user is the host - from URL params OR sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    const isHostFromURL = urlParams.get('host') === 'true';
    const hostNameFromURL = urlParams.get('name');
    const isHostFromStorage = sessionStorage.getItem('isHost_' + roomID) === 'true';
    const hostNameFromStorage = sessionStorage.getItem('hostName_' + roomID);

    const isHost = isHostFromURL || isHostFromStorage;
    const hostName = hostNameFromURL || hostNameFromStorage;

    if (isHost) {
        console.log('[GUEST] 🔑 Host detected, bypassing guest page');
        console.log('[GUEST] Host name:', hostName, 'From URL:', isHostFromURL, 'From Storage:', isHostFromStorage);

        // Store host name and redirect directly to room
        sessionStorage.setItem('guestName', hostName || 'Oleh');
        sessionStorage.setItem('isHost', 'true');
        sessionStorage.setItem('isHost_' + roomID, 'true');
        sessionStorage.setItem('hostName_' + roomID, hostName || 'Oleh');

        window.location.href = `/room/${roomID}`;
        return;
    }

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

    // Step 1: Name form submission
    if (guestForm) {
        guestForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const guestName = guestNameInput.value.trim();

            if (!guestName) {
                const errorMsg = savedLang === 'uk' ? 'Будь ласка, введіть ваше ім\'я' : 'Please enter your name';
                alert(errorMsg);
                return;
            }

            console.log('[GUEST] Name entered:', guestName);

            // Store guest name temporarily
            sessionStorage.setItem('guestName', guestName);
            sessionStorage.setItem('isHost', 'false');

            // Show device setup
            guestForm.style.display = 'none';
            deviceSetup.style.display = 'block';

            // Initialize devices
            await initializeDevices();
        });
    }

    // Initialize device selection
    async function initializeDevices() {
        try {
            console.log('[GUEST] 🎥 Initializing devices...');

            // Request permissions first
            const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // Stop temporary stream
            tempStream.getTracks().forEach(track => track.stop());

            // Get all devices
            const devices = await navigator.mediaDevices.enumerateDevices();

            const cameras = devices.filter(d => d.kind === 'videoinput');
            const microphones = devices.filter(d => d.kind === 'audioinput');

            console.log('[GUEST] Found cameras:', cameras.length, 'microphones:', microphones.length);

            // Populate camera select
            cameraSelect.innerHTML = '';
            cameras.forEach((camera, index) => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.textContent = camera.label || `Camera ${index + 1}`;
                cameraSelect.appendChild(option);
            });

            // Populate microphone select
            microphoneSelect.innerHTML = '';
            microphones.forEach((mic, index) => {
                const option = document.createElement('option');
                option.value = mic.deviceId;
                option.textContent = mic.label || `Microphone ${index + 1}`;
                microphoneSelect.appendChild(option);
            });

            // Start preview with default devices
            await updatePreview();

        } catch (error) {
            console.error('[GUEST] ❌ Failed to initialize devices:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    }

    // Update preview when device selection changes
    cameraSelect.addEventListener('change', () => updatePreview());
    microphoneSelect.addEventListener('change', () => updatePreview());
    enableVideo.addEventListener('change', () => updatePreview());
    enableAudio.addEventListener('change', () => updatePreview());

    async function updatePreview() {
        try {
            // Stop previous stream
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: enableVideo.checked ? {
                    deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined
                } : false,
                audio: enableAudio.checked ? {
                    deviceId: microphoneSelect.value ? { exact: microphoneSelect.value } : undefined
                } : false
            };

            previewStream = await navigator.mediaDevices.getUserMedia(constraints);
            previewVideo.srcObject = previewStream;

            console.log('[GUEST] ✅ Preview updated');
        } catch (error) {
            console.error('[GUEST] Failed to update preview:', error);
        }
    }

    // Back button
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Stop preview
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
                previewStream = null;
            }

            deviceSetup.style.display = 'none';
            guestForm.style.display = 'block';
        });
    }

    // Continue to meeting
    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            console.log('[GUEST] 🚀 Joining meeting...');

            // Save device preferences
            sessionStorage.setItem('cameraId', cameraSelect.value);
            sessionStorage.setItem('microphoneId', microphoneSelect.value);
            sessionStorage.setItem('enableVideo', enableVideo.checked.toString());
            sessionStorage.setItem('enableAudio', enableAudio.checked.toString());

            // Stop preview stream
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }

            // Redirect to room
            console.log('[GUEST] Redirecting to:', `/room/${roomID}`);
            window.location.href = `/room/${roomID}`;
        });
    }

    // Auto-focus name input
    guestNameInput.focus();
});
