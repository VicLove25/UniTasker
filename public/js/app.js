document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const authSection = document.getElementById('auth-section');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('login-btn');
    const taskSection = document.getElementById('task-section');
    const taskList = document.getElementById('task-list');
    const logoutBtn = document.getElementById('logout-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const upcomingListEl = document.getElementById('upcoming-list');
    const errorMessage = document.getElementById('error-message');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = new bootstrap.Modal(document.getElementById('task-modal'));
    const modalTitle = document.getElementById('modal-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    let editingTaskId = null;

    // Sidebar Toggle
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
    });

    // Dark Mode Toggle
    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        // Save preference
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
    // Load dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Show Error
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => { errorMessage.style.display = 'none'; }, 4000);
    }

    // Get Auth Headers
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }

    // Fetch Tasks
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

    // Render Tasks
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
                <span class="${task.isCompleted ? 'completed' : ''} task-text">${task.description} - Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}</span>
                <div>
                    <button class="btn btn-sm btn-outline-success toggle-btn">${task.isCompleted ? 'Undo' : 'Complete'}</button>
                    <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
            if (!task.isCompleted) {
                const upLi = document.createElement('li');
                upLi.textContent = `${task.description} - Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date'}`;
                upcomingListEl.appendChild(upLi);
            }
        });
        if (upcomingListEl.innerHTML === '') {
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
        }
    }

    // Update Dashboard
    function updateDashboard(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        const pending = total - completed;
        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        pendingTasksEl.textContent = pending;
    }

    // Task List Events
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
        } else if (target.classList.contains('toggle-btn')) {
            const isCompleted = !li.querySelector('.task-text').classList.contains('completed');
            try {
                const res = await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ isCompleted })
                });
                if (!res.ok) throw new Error('Failed to update task.');
                fetchTasks();
            } catch (err) { showError(err.message); }
        } else if (target.classList.contains('edit-btn')) {
            editingTaskId = id;
            const text = li.querySelector('.task-text').textContent.split(' - Due: ')[0];
            const due = li.querySelector('.task-text').textContent.split(' - Due: ')[1];
            taskDescriptionInput.value = text;
            taskDueDateInput.value = due !== 'No Date' ? new Date(due).toISOString().split('T')[0] : '';
            modalTitle.textContent = 'Edit Task';
            taskModal.show();
        }
    });

    // Add/Edit Task
    addTaskBtn.addEventListener('click', () => {
        editingTaskId = null;
        modalTitle.textContent = 'Add New Task';
        taskDescriptionInput.value = '';
        taskDueDateInput.value = '';
        taskModal.show();
    });

    saveTaskBtn.addEventListener('click', async () => {
        const description = taskDescriptionInput.value.trim();
        const dueDate = taskDueDateInput.value;
        if (!description) return showError('Description required.');
        const headers = getAuthHeaders();
        try {
            let res;
            if (editingTaskId) {
                res = await fetch(`/api/tasks/${editingTaskId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ description, dueDate })
                });
            } else {
                res = await fetch('/api/tasks', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ description, dueDate })
                });
            }
            if (!res.ok) throw new Error('Failed to save task.');
            taskModal.hide();
            fetchTasks();
        } catch (err) { showError(err.message); }
    });

    // Login
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

    // Logout
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        updateUIForAuthState();
    }
    logoutBtn.addEventListener('click', logout);

    // Update UI
    function updateUIForAuthState() {
        const token = localStorage.getItem('token');
        if (token) {
            authSection.style.display = 'none';
            taskSection.style.display = 'block';
            fetchTasks();
        } else {
            authSection.style.display = 'block';
            taskSection.style.display = 'none';
            taskList.innerHTML = '';
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
        }
    }

    // Initial Check
    updateUIForAuthState();
});