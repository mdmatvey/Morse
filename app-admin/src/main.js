const wsServer = __WS_SERVER__ || window.location.host;
const ws = new WebSocket(`ws://${wsServer}/admin`);
const studentsList = document.getElementById('students-list');
const logsList = document.getElementById('logs-list');

ws.onopen = () => {
    console.log('Connected to WebSocket as admin');
    ws.send(JSON.stringify({ type: 'register' }));
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        if (data.type === 'student-list') {
            console.log('Received student list:', data.students);
            updateStudentList(data.students);
        } else if (data.type === 'connection-logs') {
            console.log('Received connection logs:', data.logs);
            updateLogsList(data.logs);
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
};

ws.onclose = () => console.log('Disconnected from WebSocket');

function updateStudentList(students) {
    studentsList.innerHTML = students.length
        ? students.map((id) => `<li>Студент-${id}</li>`).join('')
        : '<li>Нет подключенных студентов</li>';
}

function updateLogsList(logs) {
    if (!logs || logs.length === 0) {
        logsList.innerHTML = '<li>Журнал пуст</li>';
        return;
    }

    logsList.innerHTML = logs
        .map((log) => {
            const logClass = log.event === 'connect' ? 'connect' : 'disconnect';
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
