document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. DOM Elements
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-btn');
    const addTaskModal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    const saveTaskBtn = document.getElementById('save-task-btn');
    const taskDescInput = document.getElementById('task-desc-input');
    const taskDueDateInput = document.getElementById('task-due-date');

    // 3. State
    let tasks = [];

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

    // 5. Sidebar Toggle
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // 6. API Functions
    async function fetchTasks() {
        try {
            const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
            if (handleApiError(res)) return;
            if (!res.ok) throw new Error('Failed to load tasks');
            tasks = await res.json();
            updateCalendarDisplay();
        } catch (err) {
            console.error(err);
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
                taskDueDateInput.value = '';
                addTaskModal.hide();
                fetchTasks();
            }
        } catch (err) {
            console.error(err);
        }
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
        } catch (err) {
            console.error(err);
        }
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
        } catch (err) {
            console.error(err);
        }
    }

    function updateCalendarDisplay() {
        // Pass tasks to calendar.js
        if (window.updateCalendarTasks) {
            window.updateCalendarTasks(tasks);
        }
    }

    // 7. Event Listeners
    const addTaskBtn = document.querySelector('header .btn-primary') || 
                       document.querySelector('.calendar-page-header .btn-primary');
    
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            addTaskModal.show();
        });
    }

    saveTaskBtn.addEventListener('click', () => {
        const desc = taskDescInput.value.trim();
        const dueDate = taskDueDateInput.value;
        if (desc) createTask(desc, dueDate);
    });

    // Initial Load
    fetchTasks();
});
