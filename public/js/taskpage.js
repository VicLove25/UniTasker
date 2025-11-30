/**
 * UniTasker - taskpage.js
 * Frontend logic for the main task management page.
 */

document.addEventListener('DOMContentLoaded', () => {
    // === 1. Authentication Check ===
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if no token found
        window.location.href = 'index.html';
        return;
    }

    // === 2. DOM Elements ===
    const taskListContainer = document.querySelector('main.list-group');
    const logoutBtn = document.getElementById('logout-btn');
    const tabLinks = document.querySelectorAll('.nav-tabs .nav-link');
    const newTaskBtn = document.querySelector('.btn-primary'); // The "New Task" button in header
    
    // Modal Elements (We will assume you add the HTML provided in Step 2)
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskDescInput = document.getElementById('task-desc-input');

    // === 3. State Management ===
    let tasks = [];
    let currentFilter = 'All Tasks'; // Default filter

    // === 4. Helper Functions ===
    
    // Get headers for requests
    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    // Handle API Errors (e.g., token expiry)
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

    // === 5. API Interactions ===

    // FETCH TASKS
    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
            if (handleApiError(res)) return;
            
            if (!res.ok) throw new Error('Failed to load tasks');
            
            tasks = await res.json();
            renderTasks();
        } catch (err) {
            console.error(err);
            taskListContainer.innerHTML = `<div class="alert alert-danger">Error loading tasks: ${err.message}</div>`;
        }
    }

    // CREATE TASK
    async function createTask(description) {
        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ description })
            });
            if (handleApiError(res)) return;

            if (res.ok) {
                // Clear input and hide modal
                taskDescInput.value = '';
                addTaskModal.hide();
                // Refresh list
                fetchTasks();
            } else {
                alert('Failed to create task');
            }
        } catch (err) {
            console.error(err);
            alert('Error creating task');
        }
    }

    // TOGGLE COMPLETE
    async function toggleTaskStatus(id, currentStatus) {
        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ isCompleted: !currentStatus })
            });
            if (handleApiError(res)) return;

            if (res.ok) fetchTasks();
        } catch (err) {
            console.error(err);
        }
    }

    // DELETE TASK
    async functionYXdeleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        try {
            const res = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (handleApiError(res)) return;

            if (res.ok) fetchTasks();
        } catch (err) {
            console.error(err);
        }
    }

    // === 6. Render Logic ===
    function renderTasks() {
        taskListContainer.innerHTML = '';

        // Filter Tasks
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'All Tasks') return true;
            if (currentFilter === 'To Do' || currentFilter === 'In Progress') return !task.isCompleted;
            if (currentFilter === 'Completed') return task.isCompleted;
            return true;
        });

        if (filteredTasks.length === 0) {
            taskListContainer.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-clipboard-check display-4"></i>
                    <p class="mt-3">No tasks found for "${currentFilter}"</p>
                </div>`;
            return;
        }

        // Generate HTML
        filteredTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = 'list-group-item list-group-item-action p-3';
            
            // Strikethrough style for completed
            const labelClass = task.isCompleted 
                ? 'h5 mb-1 text-muted text-decoration-line-through' 
                : 'h5 mb-1';

            // Checkbox state
            const checkedAttr = task.isCompleted ? 'checked' : '';

            item.innerHTML = `
                <div class="d-flex w-100 align-items-center">
                    <div class="form-check me-3">
                        <input class="form-check-input rounded-circle task-check" 
                               type="checkbox" 
                               data-id="${task._id}" 
                               ${checkedAttr}>
                    </div>
                    <div class="flex-grow-1">
                        <label class="${labelClass}">${task.description}</label>
                        <div class="mt-1">
                            <span class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill fw-normal">General</span>
                        </div>
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

    // === 7. Event Listeners ===

    // Tab Filtering
    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Update active UI
            tabLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update filter state and re-render
            currentFilter = e.target.textContent.trim();
            renderTasks();
        });
    });

    // "New Task" Button (Opens Modal)
    newTaskBtn.addEventListener('click', () => {
        addTaskModal.show();
    });

    // Modal "Save" Button
    saveTaskBtn.addEventListener('click', () => {
        const desc = taskDescInput.value.trim();
        if (desc) createTask(desc);
    });

    // List Delegation (Clicks on checkbox or delete)
    taskListContainer.addEventListener('click', (e) => {
        // Handle Checkbox click
        if (e.target.classList.contains('task-check')) {
            const id = e.target.dataset.id;
            const currentStatus = e.target.checked; // This is the status AFTER click
            // We want to pass the OLD status to toggle it, or just pass the desired new status
            // My toggle function flips the boolean, so let's find the task object
            const task = tasks.find(t => t._id === id);
            if (task) toggleTaskStatus(id, task.isCompleted);
        }

        // Handle Delete click
        if (e.target.classList.contains('delete-task-btn')) {
            e.preventDefault();
            const id = e.target.dataset.id;
            deleteTask(id);
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    });

    // === 8. Initial Load ===
    fetchTasks();
});