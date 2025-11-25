document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const authSection = document.getElementById('auth-section');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const taskSection = document.getElementById('task-section');
    const taskList = document.getElementById('task-list');
    const logoutBtn = document.getElementById('logout-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const upcomingListEl = document.getElementById('upcoming-list');
    const errorMessage = document.getElementById('error-message');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');

    // Sidebar toggle
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => { errorMessage.style.display = 'none'; }, 4000);
    }

    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }

    async function fetchTasks() {
        const headers = getAuthHeaders();
        if (!headers) return;
        try {
            const response = await fetch('/api/tasks', { headers });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) logout();
                throw new Error('Could not fetch tasks.');
            }
            const tasks = await response.json();
            renderTasks(tasks);
            updateDashboard(tasks);
        } catch (error) {
            showError(error.message);
        }
    }

    function renderTasks(tasks) {
        taskList.innerHTML = '';
        upcomingListEl.innerHTML = '';
        if (!tasks.length) {
            taskList.innerHTML = '<li class="list-group-item text-muted">No tasks yet.</li>';
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
            return;
        }
        tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.dataset.id = task._id;
            li.innerHTML = `
                <span class="${task.isCompleted ? 'completed' : ''}">${task.description} - Due: ${task.dueDate || 'No Date'}</span>
                <div>
                    <button class="btn btn-sm btn-outline-success toggle-btn">${task.isCompleted ? 'Undo' : 'Complete'}</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
            if (!task.isCompleted) {
                const upLi = document.createElement('li');
                upLi.textContent = `${task.description} - Due: ${task.dueDate || 'No Date'}`;
                upcomingListEl.appendChild(upLi);
            }
        });
        if (upcomingListEl.innerHTML === '') {
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
        }
    }

    function updateDashboard(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = total - completed;
    }

    taskList.addEventListener('click', async (e) => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;
        const id = li.dataset.id;
        const headers = getAuthHeaders();

        if (target.classList.contains('delete-btn')) {
            try {
                const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
                if (!res.ok) throw new Error('Failed to delete task.');
                fetchTasks();
            } catch (err) { showError(err.message); }
        }
        if (target.classList.contains('toggle-btn')) {
            const isCompleted = !li.querySelector('span').classList.contains('completed');
            try {
                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ isCompleted })
                });
                if (!res.ok) throw new Error('Failed to update task.');
                fetchTasks();
            } catch (err) { showError(err.message); }
        }
    });

    registerBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) return showError('Username and password required.');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed.');
            alert('Registration successful! Please log in.');
        } catch (err) { showError(err.message); }
    });

    loginBtn.addEventListener('click', async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        if (!username || !password) return showError('Username and password required.');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed.');
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            updateUIForAuthState();
        } catch (err) { showError(err.message); }
    });

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        updateUIForAuthState();
    }
    logoutBtn.addEventListener('click', logout);

    function updateUIForAuthState() {
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;

        if (isLoggedIn) {
            authSection.style.display = 'none';
            taskSection.style.display = 'block';
            sidebar.style.display = 'block';
            toggleBtn.style.display = 'block';
            document.body.classList.add('has-sidebar');
            document.body.classList.toggle('sidebar-collapsed', sidebar.classList.contains('collapsed'));
            fetchTasks();
        } else {
            authSection.style.display = 'block';
            taskSection.style.display = 'none';
            sidebar.style.display = 'none';
            toggleBtn.style.display = 'none';
            document.body.classList.remove('has-sidebar', 'sidebar-collapsed');
            taskList.innerHTML = '';
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
        }
    }

    updateUIForAuthState();
});