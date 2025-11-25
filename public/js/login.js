document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => errorMessage.style.display = 'none', 4000);
    }

    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!username || !password) {
            return showError('Username and password are required.');
        }

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed. Please try again.');
            }

            // Save token & username
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);

            // Redirect to main app
            window.location.href = 'index.html';

        } catch (err) {
            showError(err.message);
            passwordInput.value = ''; // Clear password on error
            passwordInput.focus();
        }
    });

    // Allow Enter key to submit
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });
    });
});