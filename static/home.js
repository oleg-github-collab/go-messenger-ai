document.addEventListener('DOMContentLoaded', () => {
    const createMeetingBtn = document.getElementById('createMeetingBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = '/login';
        return;
    }

    createMeetingBtn.addEventListener('click', async () => {
        createMeetingBtn.disabled = true;
        createMeetingBtn.textContent = 'Creating...';

        try {
            const response = await fetch('/create', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const url = await response.text();
                // Copy to clipboard
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(url);
                }
                // Navigate to the meeting
                window.location.href = url;
            } else if (response.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            } else {
                alert('Failed to create meeting. Please try again.');
                createMeetingBtn.disabled = false;
                createMeetingBtn.innerHTML = '<span class="btn-icon">+</span> Create Meeting';
            }
        } catch (error) {
            console.error('Error creating meeting:', error);
            alert('Connection error. Please try again.');
            createMeetingBtn.disabled = false;
            createMeetingBtn.innerHTML = '<span class="btn-icon">+</span> Create Meeting';
        }
    });

    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('authToken');
            window.location.href = '/login';
        }
    });
});
