// js/app.js – FULLY WORKING DASHBOARD LOGIC (Fixed Button Glitch)
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
    
    // Dashboard Stats
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const errorMessage = document.getElementById('error-message');

    // Add Task Modal Elements
    const addTaskBtn = document.getElementById('add-task-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskModalEl = document.getElementById('task-modal');
    let taskModal = null;
    if (taskModalEl) {
        taskModal = new bootstrap.Modal(taskModalEl);
    }
    
    const taskDescription = document.getElementById('task-description');
    const taskDueDate = document.getElementById('task-due-date');
    const modalTitle = document.getElementById('modal-title');

    let editingTaskId = null;

    // === Sidebar Toggle ===
    if (toggleBtn && sidebar) {
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
    }

    // === Helper: Show Error ===
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            setTimeout(() => errorMessage.style.display = 'none', 4000);
        } else {
            console.error("Error:", message);
            alert(message);
        }
    }

    // === Helper: Auth Headers ===
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    }

    // === Helper: Format Date ===
    function formatDate(dateString) {
        if (!dateString) return 'No Date';
        const date = new Date(dateString);
        return date.toLocaleDateString();
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
        } catch (err) { 
            console.error(err);
        }
    }

    // === Render Tasks ===
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        upcomingListEl.innerHTML = '';

        if (!tasks.length) {
            taskList.innerHTML = '<li class="list-group-item text-muted text-center p-4">No tasks yet. Click "Add Task" to start!</li>';
            upcomingListEl.innerHTML = '<li class="text-muted">No upcoming tasks</li>';
            return;
        }

        tasks.sort((a, b) => new Date(a.dueDate || 9999999999999) - new Date(b.dueDate || 9999999999999));

        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center p-3';
            li.dataset.id = task._id;
            
            const isCompletedClass = task.isCompleted ? 'text-decoration-line-through text-muted' : 'fw-bold';
            const dateDisplay = formatDate(task.dueDate);

            // UPDATED: Changed class 'toggle-btn' to 'task-complete-btn' to avoid CSS conflict
            li.innerHTML = `
                <div class="flex-grow-1 me-3">
                    <div class="${isCompletedClass} fs-5">${task.description}</div>
                    <div class="text-muted small">
                        <i class="fas fa-calendar-alt me-1"></i> Due: ${dateDisplay}
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm ${task.isCompleted ? 'btn-outline-secondary' : 'btn-success'} task-complete-btn" style="min-width: 80px;">
                        ${task.isCompleted ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                </div>
            `;
            taskList.appendChild(li);

            if (!task.isCompleted) {
                const upLi = document.createElement('li');
                upLi.className = "mb-2 border-bottom pb-1";
                upLi.innerHTML = `
                    <div class="d-flex justify-content-between">
                        <span class="fw-medium text-truncate" style="max-width: 150px;">${task.description}</span>
                        <span class="text-muted small">${dateDisplay}</span>
                    </div>
                `;
                upcomingListEl.appendChild(upLi);
            }
        });

        if (upcomingListEl.innerHTML === '') {
            upcomingListEl.innerHTML = '<li class="text-muted">No pending tasks</li>';
        }
    }

    // === Update Dashboard Stats ===
    function updateDashboard(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.isCompleted).length;
        
        if (totalTasksEl) totalTasksEl.textContent = total;
        if (completedTasksEl) completedTasksEl.textContent = completed;
        if (pendingTasksEl) pendingTasksEl.textContent = total - completed;
    }

    // === Task List Actions ===
    taskList.addEventListener('click', async e => {
        const target = e.target;
        const li = target.closest('li');
        if (!li) return;
        const id = li.dataset.id;
        const headers = getAuthHeaders();
        if (!headers) return logout();

        // DELETE
        if (target.classList.contains('delete-btn')) {
            if (!confirm('Are you sure you want to delete this task?')) return;
            try {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
                fetchTasks();
            } catch (err) { console.error(err); }
        }

        // COMPLETE / UNDO (Updated class name here too)
        if (target.classList.contains('task-complete-btn')) {
            const isCurrentlyCompleted = target.textContent.trim() === 'Undo';
            try {
                await fetch(`/api/tasks/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ isCompleted: !isCurrentlyCompleted })
                });
                fetchTasks();
            } catch (err) { console.error(err); }
        }

        // EDIT
        if (target.classList.contains('edit-btn')) {
            const descDiv = li.querySelector('.fs-5');
            const currentDesc = descDiv.textContent;
            
            editingTaskId = id;
            if (modalTitle) modalTitle.textContent = 'Edit Task';
            if (taskDescription) taskDescription.value = currentDesc;
            if (taskDueDate) taskDueDate.value = ''; 
            if (taskModal) taskModal.show();
        }
    });

    // === Add Task Modal Actions ===
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            editingTaskId = null;
            if (modalTitle) modalTitle.textContent = 'Add New Task';
            if (taskDescription) taskDescription.value = '';
            if (taskDueDate) taskDueDate.value = '';
            if (taskModal) taskModal.show();
        });
    }

    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', async () => {
            const desc = taskDescription.value.trim();
            const due = taskDueDate.value || null;
            
            if (!desc) {
                alert('Please enter a task description');
                return;
            }

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
                if (taskModal) taskModal.hide();
                fetchTasks();
            } catch (err) { 
                console.error(err);
                alert('Failed to save task.');
            }
        });
    }

    // === Login ===
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            if (!username || !password) return alert('Username and password required.');

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
            } catch (err) { 
                alert(err.message); 
            }
        });
    }

    // === Logout ===
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        updateUIForAuthState();
    }
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // === UI State Management ===
    function updateUIForAuthState() {
        const token = localStorage.getItem('token');
        const isLoggedIn = !!token;

        if (isLoggedIn) {
            const user = localStorage.getItem('username') || 'User';
            const welcomeUser = document.getElementById('welcome-user');
            if (welcomeUser) welcomeUser.textContent = user;

            if (authSection) authSection.style.display = 'none';
            if (taskSection) taskSection.style.display = 'block';
            if (sidebar) sidebar.style.display = 'block';
            if (toggleBtn) toggleBtn.style.display = 'block';
            
            document.body.classList.add('has-sidebar');
            if (sidebar && sidebar.classList.contains('collapsed')) {
                document.body.classList.add('sidebar-collapsed');
            }
            fetchTasks();
        } else {
            if (authSection) authSection.style.display = 'block';
            if (taskSection) taskSection.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
            if (toggleBtn) toggleBtn.style.display = 'none';
            document.body.classList.remove('has-sidebar', 'sidebar-collapsed');
        }
    }

    updateUIForAuthState();
});