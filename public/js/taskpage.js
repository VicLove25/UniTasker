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
    
    // Filters
    const yearFilter = document.getElementById('year-filter');

    // Sidebar Logic
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
    const taskDueDateInput = document.getElementById('task-due-date');

    // 3. State
    let tasks = [];
    let currentTab = 'All Tasks'; 
    let currentYear = 'All';      

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

    // === FIX: Force UTC Timezone here too ===
    const formatDate = (dateString) => {
        if (!dateString) return '';
        // This ensures the date doesn't shift back by one day
        return new Date(dateString).toLocaleDateString(undefined, { timeZone: 'UTC' });
    };

    // 5. API Functions
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

    async function createTask(description, dueDate) {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ description, dueDate })
            });
            if (handleApiError(res)) return;
            if (res.ok) {
                taskDescInput.value = '';
                if(taskDueDateInput) taskDueDateInput.value = '';
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

    // 6. Render Logic
    function renderTasks() {
        taskListContainer.innerHTML = '';

        const filteredTasks = tasks.filter(task => {
            let matchesTab = true;
            if (currentTab === 'To Do') matchesTab = !task.isCompleted;
            if (currentTab === 'Completed') matchesTab = task.isCompleted;

            let matchesYear = true;
            if (currentYear !== 'All') {
                matchesYear = task.description.includes(currentYear);
            }

            return matchesTab && matchesYear;
        });

        // Sort by Due Date
        filteredTasks.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31'));

        if (filteredTasks.length === 0) {
            taskListContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-clipboard-check display-4"></i>
                    <p class="mt-3">No tasks found matching your filters.</p>
                </div>`;
            return;
        }

        filteredTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action p-3';
            const labelClass = task.isCompleted ? 'h5 mb-1 text-muted text-decoration-line-through' : 'h5 mb-1';
            const checkedAttr = task.isCompleted ? 'checked' : '';
            
            // Render the Fixed Date
            const dateDisplay = task.dueDate ? `<small class="text-muted"><i class="bi bi-calendar"></i> ${formatDate(task.dueDate)}</small>` : '';

            item.innerHTML = `
                <div class="d-flex w-100 align-items-center">
                    <div class="form-check me-3">
                        <input class="form-check-input rounded-circle task-check" type="checkbox" data-id="${task._id}" ${checkedAttr} style="cursor:pointer;">
                    </div>
                    <div class="flex-grow-1">
                        <label class="${labelClass}">${task.description}</label>
                        <div>${dateDisplay}</div>
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

    // 7. Event Listeners
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            tabLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.textContent.trim();
            renderTasks();
        });
    });

    if (yearFilter) {
        yearFilter.addEventListener('change', (e) => {
            currentYear = e.target.value;
            renderTasks();
        });
    }

    newTaskBtn.addEventListener('click', () => addTaskModal.show());
    
    saveTaskBtn.addEventListener('click', () => {
        const desc = taskDescInput.value.trim();
        // Grab date value safely
        const dueDate = taskDueDateInput ? taskDueDateInput.value : null; 
        if (desc) createTask(desc, dueDate);
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

    fetchTasks();
});