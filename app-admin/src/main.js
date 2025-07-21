const wsServer = __WS_SERVER__ || window.location.host;
const ws = new WebSocket(`ws://${wsServer}/admin`);
const studentsList = document.getElementById('students-list');
const logsList = document.getElementById('logs-list');

ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'register' }));
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        if (data.type === 'student-list') {
            updateStudentList(data.students);
        } else if (data.type === 'connection-logs') {
            updateLogsList(data.logs);
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
};

ws.onclose = () => console.log('Disconnected from WebSocket');

function updateStudentList(students) {
    if (!students || students.length === 0) {
        studentsList.innerHTML = '<li>Нет подключенных студентов</li>';
        return;
    }

    studentsList.innerHTML = students
        .map((student) => {
            let statusText, statusClass;

            if (student.isBusy && student.partner) {
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
    if (!logs || logs.length === 0) {
        logsList.innerHTML = '<li>Журнал пуст</li>';
        return;
    }

    logsList.innerHTML = logs
        .map((log) => {
            let logClass;
            switch (log.event) {
                case 'connect':
                    logClass = 'connect';
                    break;
                case 'disconnect':
                    logClass = 'disconnect';
                    break;
                case 'busy':
                    logClass = 'busy';
                    break;
                case 'free':
                    logClass = 'free';
                    break;
                default:
                    logClass = '';
            }

            return `
            <li class="log-entry ${logClass}">
                <span class="message">${log.message}</span>
                <span class="timestamp">${log.timestamp}</span>
            </li>
        `;
        })
        .join('');

    // Прокрутить лог вниз к последним записям
    logsList.scrollTop = logsList.scrollHeight;
}
