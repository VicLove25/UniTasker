// js/app.js – FULLY WORKING (sidebar fixed!)
document.addEventListener('DOMContentLoaded', () => {
    // === Elements ===
    const authSection = document.getElementById('auth-section');
    const taskSection = document.getElementById('task-section');
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const addTaskBtn = document.getElementById('add-task-btn');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskList = document.getElementById('task-list');
    const upcomingList = document.getElementById('upcoming-list');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const welcomeUser = document.getElementById('welcome-user');
    const errorMessage = document.getElementById('error-message');
    const taskModal = new bootstrap.Modal(document.getElementById('task-modal'));
    const taskDescription = document.getElementById('task-description');
    const taskDueDate = document.getElementById('task-due-date');
    const modalTitle = document.getElementById('modal-title');

    let editingTaskId = null;
    let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

    // === Helper Functions ===
    function saveTasks() { localStorage.setItem('tasks', JSON.stringify(tasks)); }

    function updateStats() {
        totalTasksEl.textContent = tasks.length;
        completedTasksEl.textContent = tasks.filter(t => t.completed).length;
        pendingTasksEl.textContent = tasks.length - tasks.filter(t => t.completed).length;
    }

    function renderTasks() {
        taskList.innerHTML = '';
        upcomingList.innerHTML = '';

        const sorted = [...tasks].sort((a, b) => (a.dueDate || '') > (b.dueDate || '') ? 1 : -1);

        sorted.forEach(task => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
            const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';

            // Main task list
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex align-items-center p-3';
            li.innerHTML = `
                <div class="form-check me-3">
                    <input class="form-check-input" type="checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold ${task.completed ? 'text-decoration-line-through text-muted' : ''}">
                        ${task.description}
                    </div>
                    <small class="text-muted">${due}</small>
                    ${isOverdue ? '<span class="badge bg-danger ms-2">Overdue</span>' : ''}
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            taskList.appendChild(li);

            // Upcoming list
            if (task.dueDate && !task.completed) {
                const item = document.createElement('li');
                item.className = 'd-flex justify-content-between py-2';
                item.innerHTML = `<span class="${isOverdue ? 'text-danger' : ''}">${task.description}</span><small>${due}</small>`;
                upcomingList.appendChild(item);
            }
        });
        updateStats();
    }

    // === Login (fake – works instantly) ===
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            if (!username || !password) {
                errorMessage.textContent = 'Please fill in both fields';
                errorMessage.classList.remove('d-none');
                return;
            }

            // Fake login success
            localStorage.setItem('token', 'fake-token-123');
            localStorage.setItem('username', username);

            // Show dashboard + sidebar
            authSection.style.display = 'none';
            taskSection.style.display = 'block';
            sidebar.style.display = 'block';
            toggleBtn.style.display = 'block';
            welcomeUser.textContent = username;

            renderTasks();
        });
    }

    // === Logout ===
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            location.reload(); // simple & clean
        });
    }

    // === Add / Edit Task ===
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            editingTaskId = null;
            modalTitle.textContent = 'Add New Task';
            taskDescription.value = '';
            taskDueDate.value = '';
            taskModal.show();
        });
    }

    saveTaskBtn.addEventListener('click', () => {
        const desc = taskDescription.value.trim();
        if (!desc) return alert('Description required');

        if (editingTaskId) {
            const task = tasks.find(t => t.id === editingTaskId);
            task.description = desc;
            task.dueDate = taskDueDate.value || null;
        } else {
            tasks.push({
                id: Date.now().toString(),
                description: desc,
                dueDate: taskDueDate.value || null,
                completed: false
            });
        }
        saveTasks();
        renderTasks();
        taskModal.hide();
    });

    // === Task Actions ===
    taskList.addEventListener('click', e => {
        const id = e.target.closest('button')?.dataset.id || e.target.closest('input')?.dataset.id;
        if (!id) return;

        if (e.target.closest('.delete-btn')) {
            if (confirm('Delete task?')) {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                renderTasks();
            }
        }
        if (e.target.closest('.edit-btn')) {
            const task = tasks.find(t => t.id === id);
            editingTaskId = id;
            modalTitle.textContent = 'Edit Task';
            taskDescription.value = task.description;
            taskDueDate.value = task.dueDate || '';
            taskModal.show();
        }
        if (e.target.type === 'checkbox') {
            const task = tasks.find(t => t.id === id);
            task.completed = e.target.checked;
            saveTasks();
            renderTasks();
        }
    });

    // === INITIAL LOAD – THIS IS THE IMPORTANT PART ===
    const token = localStorage.getItem('token');

    if (token) {
        // Already logged in → show dashboard
        authSection.style.display = 'none';
        taskSection.style.display = 'block';
        sidebar.style.display = 'block';
        toggleBtn.style.display = 'block';
        welcomeUser.textContent = localStorage.getItem('username') || 'User';
        renderTasks();
    }

    // Dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // Sidebar collapse state
    if (localStorage.getItem('sidebarCollapsed') === 'true') {
        sidebar.classList.add('collapsed');
        document.body.classList.add('sidebar-collapsed');
    }

    // SIDEBAR TOGGLE – now works perfectly!
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
});