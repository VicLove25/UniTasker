document.addEventListener('DOMContentLoaded', () => {
    function initCalendar(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let current = new Date();
        let tasks = []; // Store tasks to display on calendar

        function render() {
            container.innerHTML = '';

            const header = document.createElement('div');
            header.className = 'calendar-header d-flex justify-content-between align-items-center mb-2';

            const prev = document.createElement('button');
            prev.className = 'btn btn-sm btn-outline-secondary';
            prev.textContent = '<';
            prev.addEventListener('click', () => { current.setMonth(current.getMonth() - 1); render(); });

            const next = document.createElement('button');
            next.className = 'btn btn-sm btn-outline-secondary';
            next.textContent = '>';
            next.addEventListener('click', () => { current.setMonth(current.getMonth() + 1); render(); });

            const title = document.createElement('div');
            title.className = 'fw-bold';
            title.textContent = current.toLocaleString(undefined, { month: 'long', year: 'numeric' });

            header.appendChild(prev);
            header.appendChild(title);
            header.appendChild(next);
            container.appendChild(header);

            const table = document.createElement('table');
            table.className = 'table calendar-table';

            const thead = document.createElement('thead');
            const headRow = document.createElement('tr');
            ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
                const th = document.createElement('th');
                th.className = 'text-center';
                th.textContent = d;
                headRow.appendChild(th);
            });
            thead.appendChild(headRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
            const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

            let row = document.createElement('tr');
            for (let i = 0; i < firstDay; i++) {
                row.appendChild(document.createElement('td'));
            }

            for (let d = 1; d <= daysInMonth; d++) {
                if (row.children.length === 7) {
                    tbody.appendChild(row);
                    row = document.createElement('tr');
                }
                const td = document.createElement('td');
                td.className = 'text-center align-middle position-relative';
                td.style.padding = '8px';
                
                const dateStr = d.toString().padStart(2, '0');
                const dayContent = document.createElement('div');
                dayContent.textContent = d;
                td.appendChild(dayContent);

                const today = new Date();
                if (d === today.getDate() && current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear()) {
                    td.classList.add('calendar-today', 'bg-success', 'text-white', 'rounded');
                }

                // Check if this day has tasks
                const dateKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${dateStr}`;
                const dayTasks = tasks.filter(t => {
                    if (!t.dueDate) return false;
                    const taskDate = new Date(t.dueDate).toISOString().split('T')[0];
                    return taskDate === dateKey;
                });

                if (dayTasks.length > 0) {
                    const indicator = document.createElement('div');
                    indicator.className = 'calendar-task-indicator';
                    indicator.style.width = '6px';
                    indicator.style.height = '6px';
                    indicator.style.backgroundColor = '#3c6e47';
                    indicator.style.borderRadius = '50%';
                    indicator.style.position = 'absolute';
                    indicator.style.bottom = '2px';
                    indicator.style.left = '50%';
                    indicator.style.transform = 'translateX(-50%)';
                    td.appendChild(indicator);
                    td.title = `${dayTasks.length} task(s)`;
                }

                row.appendChild(td);
            }

            while (row.children.length < 7) row.appendChild(document.createElement('td'));
            tbody.appendChild(row);
            table.appendChild(tbody);
            container.appendChild(table);
        }

        render();

        // Public method to update tasks
        window.updateCalendarTasks = function(newTasks) {
            tasks = newTasks || [];
            render();
        };
    }

    // Initialize calendars on pages that have these containers
    initCalendar('calendar');
    initCalendar('calendar-dashboard');
});
