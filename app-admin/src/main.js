const wsServer = __WS_SERVER__ || window.location.host;
const ws = new WebSocket(`ws://${wsServer}/admin`);
const studentsList = document.getElementById('students-list');
const logsList = document.getElementById('logs-list');
const directionSelect = document.getElementById('direction-select');

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register' }));
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'student-list':
                updateStudentList(data.students);
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

function updateDirectionOptions(dirs) {
    // сохраняем текущее значение
    const current = directionSelect.value;
    directionSelect.innerHTML =
        `<option value="">Все</option>` +
        dirs.map((d) => `<option value="${d}">${d}</option>`).join('');
    // восстанавливаем выбор
    if (dirs.includes(current)) {
        directionSelect.value = current;
    } else {
        directionSelect.value = '';
    }
}

function updateStudentList(students) {
    if (!students || students.length === 0) {
        studentsList.innerHTML = '<li>Нет подключенных студентов</li>';
        return;
    }

    studentsList.innerHTML = students
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

    const trimmedLogs = logs.slice(-MAX_LOGS);

    logsList.innerHTML =
        (logs.length > MAX_LOGS
            ? `<li class="log-limit-warning">Показаны только последние ${MAX_LOGS} записей из ${logs.length}</li>`
            : '') +
        trimmedLogs
            .map(
                (log) =>
                    `
                <li class="log-entry ${log.event}">
                    <span class="message">${log.message}</span>
                    <span class="timestamp">${log.timestamp}</span>
                </li>`,
            )
            .join('');

    logsList.scrollTop = logsList.scrollHeight;
}
