// js/app.mjs – FULLY WORKING WITH BACKEND + DARK MODE
document.addEventListener('DOMContentLoaded', () => {
    // === Elements ===
    const authSection = document.getElementById('auth-section');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const taskSection = document.getElementById('task-section');
    const taskList = document.getElementById('task-list');
    const upcomingListEl = document.getElementById('upcoming-list');
    const logoutBtn = document.getElementById('logout-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const errorMessage = document.getElementById('error-message');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    const addTaskBtn = document.getElementById('add-task-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskModalEl = document.getElementById('task-modal');
    const taskModal = new bootstrap.Modal(taskModalEl);
    const taskDescription = document.getElementById('task-description');
    const taskDueDate = document.getElementById('task-due-date');
    const modalTitle = document.getElementById('modal-title');

    let editingTaskId = null;

    // === Sidebar Toggle ===
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });

    // Restore sidebar collapsed state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }

    // === Dark Mode ===
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    darkModeToggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // === Error helper ===
    function showError(message) {
        if (!errorMessage) return;
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        setTimeout(() => errorMessage.classList.add('d-none'), 4000);
    }

    // === Auth headers helper ===
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }

    // === Fetch Tasks ===
    async function fetchTasks() {
        const headers = getAuthHeaders();
        if (!headers) return;
        try {
            const res = await fetch('/api/tasks', { headers });
            if (!res.ok) {
                if (res.status === 401 || res.status === 403) logout();
                throw new Error('Could not fetch tasks.');
            }
            const tasks = await res.json();
            renderTasks(tasks);
            updateDashboard(tasks);
        } catch (err) { showError(err.message); }
    }

    // === Render tasks ===
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        upcomingListEl.innerHTML = '';

        if (!tasks.length) {
            taskList.innerHTML = '<li class="list-group-item text-muted">No tasks yet.</li>';
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
            return;
        }

        tasks.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.dataset.id = task._id;
            li.innerHTML = `
                <span class="${task.isCompleted ? 'completed' : ''}">${task.description} - Due: ${task.dueDate || 'No Date'}</span>
                <div>
                    <button class="btn btn-sm btn-outline-success toggle-btn">${task.isCompleted ? 'Undo' : 'Complete'}</button>
                    <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
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

    // === Update dashboard stats ===
    function updateDashboard(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = total - completed;
    }

    // === Task actions ===
    taskList.addEventListener('click', async e => {
        const li = e.target.closest('li');
        if (!li) return;
        const id = li.dataset.id;
        const headers = getAuthHeaders();
        if (!headers) return logout();

        if (e.target.classList.contains('delete-btn')) {
            if (!confirm('Delete task?')) return;
            try {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
                fetchTasks();
            } catch (err) { showError(err.message); }
        }

        if (e.target.classList.contains('toggle-btn')) {
            const isCompleted = !li.querySelector('span').classList.contains('completed');
            try {
                await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ isCompleted })
                });
                fetchTasks();
            } catch (err) { showError(err.message); }
        }

        if (e.target.classList.contains('edit-btn')) {
            const task = { _id: id, description: li.querySelector('span').textContent.split(' - Due')[0], dueDate: li.querySelector('span').textContent.split('Due: ')[1] };
            editingTaskId = id;
            modalTitle.textContent = 'Edit Task';
            taskDescription.value = task.description;
            taskDueDate.value = task.dueDate === 'No Date' ? '' : task.dueDate;
            taskModal.show();
        }
    });

    // === Add Task Modal ===
    addTaskBtn.addEventListener('click', () => {
        editingTaskId = null;
        modalTitle.textContent = 'Add New Task';
        taskDescription.value = '';
        taskDueDate.value = '';
        taskModal.show();
    });

    saveTaskBtn.addEventListener('click', async () => {
        const desc = taskDescription.value.trim();
        const due = taskDueDate.value || null;
        if (!desc) return showError('Task description required.');

        const headers = getAuthHeaders();
        if (!headers) return logout();

        try {
            if (editingTaskId) {
                await fetch(`/api/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ description: desc, dueDate: due })
                });
            } else {
                await fetch('/api/tasks', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ description: desc, dueDate: due })
                });
            }
            taskModal.hide();
            fetchTasks();
        } catch (err) { showError(err.message); }
    });

    // === Auth: Register ===
    if (registerBtn) {
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
    }

    // === Auth: Login ===
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

    // === Logout ===
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        updateUIForAuthState();
    }
    logoutBtn.addEventListener('click', logout);

    // === Update UI based on auth state ===
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
