const ws = new WebSocket(`ws://${window.location.host}/admin`);
const list = document.getElementById('students-list');

ws.onopen = () => {
    console.log('Connected to WebSocket as admin');
    ws.send(JSON.stringify({ type: 'register' })); // Отправляем серверу, что это админ
};

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'student-list') {
            console.log('Received student list:', data.students);
            updateStudentList(data.students);
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
};

ws.onclose = () => console.log('Disconnected from WebSocket');

function updateStudentList(students) {
    list.innerHTML = students.map((id) => `<li>Студент-${id}</li>`).join('');
}
