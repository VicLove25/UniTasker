document.addEventListener('DOMContentLoaded', () => {
    const authGuard = document.getElementById('auth-guard');
    const mainContent = document.getElementById('main-content');

    // === AUTH CHECK ===
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // User is authenticated → show app immediately
    authGuard.style.display = 'none';
    mainContent.style.display = 'block';

    // === DOM ELEMENTS ===
    const taskList = document.getElementById('task-list');
    const logoutBtn = document.getElementById('logout-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const upcomingListEl = document.getElementById('upcoming-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = new bootstrap.Modal(document.getElementById('task-modal'));
    const modalTitle = document.getElementById('modal-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date');
    const saveTaskBtn = document.getElementById('save-task-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    let editingTaskId = null;

    // === SIDEBAR & DARK MODE ===
    document.getElementById('toggle-btn').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
    });

    darkModeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    // === AUTH HELPERS ===
    function getAuthHeaders() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : null;
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }

    // === TASK OPERATIONS ===
    async function fetchTasks() {
        const headers = getAuthHeaders();
        if (!headers) return logout();

        try {
            const response = await fetch('/api/tasks', { headers });
            if (response.status === 401 || response.status === 403rinos 403) return logout();
if (!response.ok) throw new Error('Failed to fetch tasks');

const tasks = await response.json();
renderTasks(tasks);
updateDashboard(tasks);
        } catch (err) {
    console.error('Fetch tasks error:', err);
    // Optional: show user-friendly message
    // alert('Session expired or server error. Redirecting to login...');
    logout();
}
    }

function renderTasks(tasks) {
    taskList.innerHTML = '';
    upcomingListEl.innerHTML = '';

    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = '<li class="list-group-item text-muted text-center py-4">No tasks yet. Create one!</li>';
        upcomingListEl.innerHTML = '<li class="text-muted">No upcoming deadlines</li>';
        return;
    }

    // Sort by due date (earliest first)
    tasks.sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

    tasks.forEach(task => {
        const dueText = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Date';
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.dataset.id = task._id;

        li.innerHTML = `
                <span class="${task.isCompleted ? 'completed text-muted' : ''} task-text">
                    ${task.description} - Due: ${dueText}
                </span>
                <div>
                    <button class="btn btn-sm ${task.isCompleted ? 'btn-outline-secondary' : 'btn-outline-success'} toggle-btn">
                        ${task.isCompleted ? 'Undo' : 'Complete'}
                    </button>
                    <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn">Delete</button>
                </div>
            `;
        taskList.appendChild(li);

        // Add to upcoming only if not completed and has due date
        if (!task.isCompleted && task.dueDate) {
            const upLi = document.createElement('li');
            upLi.className = 'mb-2';
            upLi.textContent = `${task.description} → ${dueText}`;
            upcomingListEl.appendChild(upLi);
        }
    });

    if (upcomingListEl.children.length === 0) {
        upcomingListEl.innerHTML = '<li class="text-muted">No upcoming deadlines</li>';
    }
}

function updateDashboard(tasks) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    pendingTasksEl.textContent = total - completed;
}

// === TASK LIST EVENT DELEGATION ===
taskList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const li = btn.closest('li');
    const id = li.dataset.id;
    const headers = getAuthHeaders();

    try {
        if (btn.classList.contains('delete-btn')) {
            if (confirm('Delete this task permanently?')) {
                await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers });
                fetchTasks();
            }
        }
        else if (btn.classList.contains('toggle-btn')) {
            const isCompleted = !li.querySelector('.task-text').classList.contains('completed');
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ isCompleted })
            });
            fetchTasks();
        }
        else if (btn.classList.contains('edit-btn')) {
            editingTaskId = id;
            const fullText = li.querySelector('.task-text').textContent;
            const desc = fullText.split(' - Due: ')[0];
            const duePart = fullText.split(' - Due: ')[1];

            taskDescriptionInput.value = desc;
            taskDueDateInput.value = (duePart && duePart !== 'No Date')
                ? new Date(duePart).toISOString().split('T')[0]
                : '';
            modalTitle.textContent = 'Edit Task';
            taskModal.show();
        }
    } catch (err) {
        alert('Action failed. You may have been logged out.');
        logout();
    }
});

// === ADD / EDIT TASK ===
addTaskBtn.addEventListener('click', () => {
    editingTaskId = null;
    modalTitle.textContent = 'Add New Task';
    taskDescriptionInput.value = '';
    taskDueDateInput.value = '';
    taskModal.show();
});

saveTaskBtn.addEventListener('click', async () => {
    const description = taskDescriptionInput.value.trim();
    const dueDate = taskDueDateInput.value || null;

    if (!description) {
        taskDescriptionInput.focus();
        return alert('Please enter a task description.');
    }

    const headers = getAuthHeaders();
    const url = editingTaskId ? `/api/tasks/${editingTaskId}` : '/api/tasks';
    const method = editingTaskId ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, { method, headers, body: JSON.stringify({ description, dueDate }) });
        if (!res.ok) throw new Error('Save failed');
        taskModal.hide();
        fetchTasks();
    } catch (err) {
        alert('Failed to save task. Session may have expired.');
        logout();
    }
});

// === LOGOUT ===
logoutBtn.addEventListener('click', logout);

// === INITIAL LOAD ===
fetchTasks();
});