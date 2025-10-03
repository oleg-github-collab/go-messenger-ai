document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    // Check if already logged in
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
        console.log('Already have token, checking if valid...');
        // Try to access home page
        fetch('/home', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        }).then(response => {
            if (response.ok) {
                window.location.href = '/home';
            } else {
                // Token invalid, clear it
                localStorage.removeItem('authToken');
            }
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        console.log('Login attempt:', username);

        // Disable button during login
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify({ username, password }),
            });

            console.log('Login response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Login response data:', data);

                if (data.success) {
                    // Store auth token in localStorage as backup
                    localStorage.setItem('authToken', data.token);
                    console.log('Token stored, redirecting to home...');

                    // Cookie is already set by server
                    // Redirect to home page
                    window.location.href = '/home';
                } else {
                    showError(data.message || 'Invalid credentials');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                }
            } else {
                const data = await response.json().catch(() => ({}));
                showError(data.message || 'Invalid username or password');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        } catch (error) {
            showError('Connection error. Please try again.');
            console.error('Login error:', error);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');

        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 4000);
    }
});
