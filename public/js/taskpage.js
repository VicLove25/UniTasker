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
            
            // St