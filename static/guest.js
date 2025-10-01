document.addEventListener('DOMContentLoaded', async () => {
    console.log('[GUEST] Page loaded');

    const guestForm = document.getElementById('guestForm');
    const guestNameInput = document.getElementById('guestName');
    const enableVideoCheckbox = document.getElementById('enableVideo');
    const enableAudioCheckbox = document.getElementById('enableAudio');
    const cameraSelect = document.getElementById('cameraSelect');
    const microphoneSelect = document.getElementById('microphoneSelect');
    const previewVideo = document.getElementById('previewVideo');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const joinBtn = document.getElementById('joinBtn');

    let previewStream = null;

    // Get room ID from URL
    const pathParts = window.location.pathname.split('/');
    const roomID = pathParts[pathParts.length - 1];

    if (!roomID || roomID === 'join') {
        alert('Invalid meeting link');
        return;
    }

    // Load devices
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        const microphones = devices.filter(d => d.kind === 'audioinput');

        // Populate camera select
        cameraSelect.innerHTML = '';
        cameras.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            cameraSelect.appendChild(option);
        });

        // Populate microphone select
        microphoneSelect.innerHTML = '';
        microphones.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${index + 1}`;
            microphoneSelect.appendChild(option);
        });

        // Start preview
        await startPreview();
    } catch (error) {
        console.error('[GUEST] Failed to load devices:', error);
    }

    // Start preview stream
    async function startPreview() {
        try {
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: enableVideoCheckbox.checked ? {
                    deviceId: cameraSelect.value ? { exact: cameraSelect.value } : undefined,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } : false,
                audio: enableAudioCheckbox.checked ? {
                    deviceId: microphoneSelect.value ? { exact: microphoneSelect.value } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true
                } : false
            };

            previewStream = await navigator.mediaDevices.getUserMedia(constraints);
            previewVideo.srcObject = previewStream;

            if (enableVideoCheckbox.checked) {
                previewPlaceholder.classList.add('hidden');
            } else {
                previewPlaceholder.classList.remove('hidden');
            }

            console.log('[GUEST] Preview started');
        } catch (error) {
            console.error('[GUEST] Failed to start preview:', error);
            previewPlaceholder.classList.remove('hidden');
        }
    }

    // Toggle video
    enableVideoCheckbox.addEventListener('change', async () => {
        await startPreview();
    });

    // Toggle audio
    enableAudioCheckbox.addEventListener('change', async () => {
        await startPreview();
    });

    // Change camera
    cameraSelect.addEventListener('change', async () => {
        if (enableVideoCheckbox.checked) {
            await startPreview();
        }
    });

    // Change microphone
    microphoneSelect.addEventListener('change', async () => {
        if (enableAudioCheckbox.checked) {
            await startPreview();
        }
    });

    // Update preview avatar with first letter of name
    guestNameInput.addEventListener('input', () => {
        const name = guestNameInput.value.trim();
        const avatar = document.querySelector('.preview-avatar');
        if (name) {
            avatar.textContent = name.charAt(0).toUpperCase();
        } else {
            avatar.textContent = '?';
        }
    });

    // Join meeting
    guestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const guestName = guestNameInput.value.trim();
        if (!guestName) {
            alert('Please enter your name');
            return;
        }

        joinBtn.disabled = true;
        joinBtn.textContent = 'Joining...';

        // Store guest settings
        sessionStorage.setItem('guestName', guestName);
        sessionStorage.setItem('enableVideo', enableVideoCheckbox.checked);
        sessionStorage.setItem('enableAudio', enableAudioCheckbox.checked);
        sessionStorage.setItem('cameraId', cameraSelect.value);
        sessionStorage.setItem('microphoneId', microphoneSelect.value);

        // Stop preview stream
        if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop());
        }

        // Redirect to meeting room
        window.location.href = `/room/${roomID}`;
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop());
        }
    });
});
