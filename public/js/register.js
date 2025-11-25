document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-btn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const errorMessage = document.getElementById('error-message');
    //const sidebar = document.getElementById('sidebar');
    //const toggleBtn = document.getElementById('toggle-btn');
    //const darkModeToggle = document.getElementById('dark-mode-toggle');

    //// Sidebar Toggle
    //toggleBtn.addEventListener('click', () => {
    //    sidebar.classList.toggle('collapsed');
    //    document.body.classList.toggle('sidebar-collapsed');
    //});

    //// Dark Mode Toggle
    //darkModeToggle.addEventListener('click', (e) => {
    //    e.preventDefault();
    //    document.body.classList.toggle('dark-mode');
    //    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    //});
    //if (localStorage.getItem('darkMode') === 'true') {
    //    document.body.classList.add('dark-mode');
    //}

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.style.display = 'block';
        setTimeout(() => errorMessage.style.display = 'none', 4000);
    }

    registerBtn.addEventListener('click', async () => {
        console.log("Register button clicked!");
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const email = emailInput.value.trim();
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();

        if (!username || !password) {
            return showError('Username and password are required.');
        }
        if (username.length < 3) {
            return showError('Username must be at least 3 characters.');
        }
        if (password.length < 6) {
            return showError('Password must be at least 6 characters.');
        }
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, firstName, lastName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed. Try another username.');
            alert('Account created successfully! ?? You can now log in.');
            window.location.href = 'index.html';
        } catch (err) {
            showError(err.message);
        }
    });
});