const wsServer = __WS_SERVER__ || window.location.host;
const ws = new WebSocket(`ws://${wsServer}/admin`);

const studentsList = document.getElementById('students-list');
const logsList = document.getElementById('logs-list');
const directionSelect = document.getElementById('direction-select');
const sortSelect = document.getElementById('sort-select');

// Конфигурируем порядок статусов
const statusOrder = ['finished', 'busy', 'free'];

let currentStudents = [];

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register' }));
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'student-list':
                currentStudents = data.students;
                renderStudentList();
                break;
            case 'connection-logs':
                updateLogsList(data.logs);
                break;
            case 'radiodirections':
                updateDirectionOptions(data.directions);
                break;
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
};

ws.onclose = () => console.log('Disconnected from WebSocket');

directionSelect.addEventListener('change', () => {
    const dir = directionSelect.value;
    ws.send(JSON.stringify({ type: 'set-direction', direction: dir }));
});

sortSelect.addEventListener('change', () => {
    renderStudentList();
});

function updateDirectionOptions(dirs) {
    const current = directionSelect.value;
    directionSelect.innerHTML =
        `<option value="">Все</option>` +
        dirs.map((d) => `<option value="${d}">${d}</option>`).join('');
    directionSelect.value = dirs.includes(current) ? current : '';
}

function renderStudentList() {
    if (!currentStudents || currentStudents.length === 0) {
        studentsList.innerHTML = '<li>Нет подключенных студентов</li>';
        return;
    }

    const sorted = [...currentStudents];
    const mode = sortSelect.value;

    if (mode === 'direction') {
        // сортируем по номеру радионаправления (последнее число в id)
        sorted.sort((a, b) => {
            const na = parseInt(a.id.split('-').pop(), 10) || 0;
            const nb = parseInt(b.id.split('-').pop(), 10) || 0;
            return na - nb;
        });
    } else if (mode === 'status') {
        // сортируем по порядку в statusOrder
        sorted.sort((a, b) => {
            const sa =
                a.status === 'finished'
                    ? 'finished'
                    : a.isBusy
                      ? 'busy'
                      : 'free';
            const sb =
                b.status === 'finished'
                    ? 'finished'
                    : b.isBusy
                      ? 'busy'
                      : 'free';
            return statusOrder.indexOf(sa) - statusOrder.indexOf(sb);
        });
    }

    studentsList.innerHTML = sorted
        .map((student) => {
            let statusText, statusClass;
            if (student.status === 'finished') {
                statusText = ' (завершил обмен)';
                statusClass = 'finished';
            } else if (student.isBusy && student.partner) {
                statusText = ` (работает с ${student.partner})`;
                statusClass = 'busy';
            } else if (student.isBusy) {
                statusText = ' (занят)';
                statusClass = 'busy';
            } else {
                statusText = ' (свободен)';
                statusClass = 'free';
            }
            return `<li class="${statusClass}">${student.id}${statusText}</li>`;
        })
        .join('');
}

function updateLogsList(logs) {
    const MAX_LOGS = 200;
    if (!logs || logs.length === 0) {
        logsList.innerHTML = '<li>Журнал пуст</li>';
        return;
    }
    const trimmed = logs.slice(-MAX_LOGS);
    logsList.innerHTML =
        (logs.length > MAX_LOGS
            ? `<li class="log-limit-warning">Показаны только последние ${MAX_LOGS} записей из ${logs.length}</li>`
            : '') +
        trimmed
            .map(
                (log) => `
        <li class="log-entry ${log.event}">
            <span class="message">${log.message}</span>
            <span class="timestamp">${log.timestamp}</span>
        </li>`,
            )
            .join('');
    logsList.scrollTop = logsList.scrollHeight;
}
