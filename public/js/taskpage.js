document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. DOM Elements
    const taskListContainer = document.querySelector('main.list-group');
    const tabLinks = document.querySelectorAll('.nav-tabs .nav-link');
    const newTaskBtn = document.querySelector('.btn-primary'); 
    
    // === NEW: Sidebar Logic ===
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    if(toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // Modal Elements
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskDescInput = document.getElementById('task-desc-input');

    // 3. State
    let tasks = [];
    let currentFilter = 'All Tasks'; 

    // 4. Helpers
    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const handleApiError = (res) => {
        if (res.status === 401 || res.status === 403) {
            alert('Session expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
            return true;
        }
        return false;
    };

    // 5. API
    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
            if (handleApiError(res)) return;
            if (!res.ok) throw new Error('Failed to load tasks');
            tasks = await res.json();
            renderTasks();
        } catch (err) {
            console.error(err);
            taskListContainer.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
        }
    }

    async function createTask(description) {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ description })
            });
            if (handleApiError(res)) return;
            if (res.ok) {
                taskDescInput.value = '';
                addTaskModal.hide();
                fetchTasks();
            }
        } catch (err) { console.error(err); }
    }

    async function toggleTaskStatus(id, currentStatus) {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isCompleted: !currentStatus })
            });
            if (handleApiError(res)) return;
            if (res.ok) fetchTasks();
        } catch (err) { console.error(err); }
    }

    async function deleteTask(id) {
        if (!confirm('Delete this task?')) return;
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (handleApiError(res)) return;
            if (res.ok) fetchTasks();
        } catch (err) { console.error(err); }
    }

    // 6. Render
    function renderTasks() {
        taskListContainer.innerHTML = '';
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'All Tasks') return true;
            if (currentFilter === 'To Do') return !task.isCompleted;
            if (currentFilter === 'Completed') return task.isCompleted;
            return true;
        });

        if (filteredTasks.length === 0) {
            taskListContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-clipboard-check display-4"></i>
                    <p class="mt-3">No tasks found in "${currentFilter}"</p>
                </div>`;
            return;
        }

        filteredTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action p-3';
            const labelClass = task.isCompleted ? 'h5 mb-1 text-muted text-decoration-line-through' : 'h5 mb-1';
            const checkedAttr = task.isCompleted ? 'checked' : '';

            item.innerHTML = `
                <div class="d-flex w-100 align-items-center">
                    <div class="form-check me-3">
                        <input class="form-check-input rounded-circle task-check" type="checkbox" data-id="${task._id}" ${checkedAttr} style="cursor:pointer;">
                    </div>
                    <div class="flex-grow-1">
                        <label class="${labelClass}">${task.description}</label>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted" type="button" data-bs-toggle="dropdown">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item text-danger delete-task-btn" href="#" data-id="${task._id}">Delete</a></li>
                        </ul>
                    </div>
                </div>
            `;
            taskListContainer.appendChild(item);
        });
    }

    // 7. Listeners
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            tabLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.textContent.trim();
            renderTasks();
        });
    });

    newTaskBtn.addEventListener('click', () => addTaskModal.show());
    saveTaskBtn.addEventListener('click', () => {
        const desc = taskDescInput.value.trim();
        if (desc) createTask(desc);
    });

    taskListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('task-check')) {
            const id = e.target.dataset.id;
            const task = tasks.find(t => t._id === id);
            if (task) toggleTaskStatus(id, task.isCompleted);
        }
        if (e.target.classList.contains('delete-task-btn')) {
            e.preventDefault();
            const id = e.target.dataset.id;
            deleteTask(id);
        }
    });

    // Initial Load
    fetchTasks();
});