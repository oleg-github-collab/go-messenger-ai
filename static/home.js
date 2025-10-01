document.addEventListener('DOMContentLoaded', () => {
    const createMeetingBtn = document.getElementById('createMeetingBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    console.log('Home page loaded');

    createMeetingBtn.addEventListener('click', async () => {
        createMeetingBtn.disabled = true;
        createMeetingBtn.textContent = 'Creating...';

        const authToken = localStorage.getItem('authToken');
        console.log('Creating meeting, token exists:', !!authToken);

        try {
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const response = await fetch('/create', {
                method: 'GET',
                credentials: 'include', // Include cookies
                headers: headers
            });

            console.log('Create meeting response:', response.status);

            if (response.ok) {
                const url = await response.text();
                console.log('Meeting URL:', url);

                // Copy to clipboard
                if (navigator.clipboard) {
                    try {
                        await navigator.clipboard.writeText(url);
                        console.log('URL copied to clipboard');
                    } catch (e) {
                        console.log('Failed to copy to clipboard:', e);
                    }
                }

                // Navigate to the meeting
                window.location.href = url;
            } else if (response.status === 401) {
                console.log('Unauthorized, redirecting to login');
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
            console.log('Logging out...');
            localStorage.removeItem('authToken');
            // Use server logout to clear cookie
            window.location.href = '/logout';
        }
    });
});
