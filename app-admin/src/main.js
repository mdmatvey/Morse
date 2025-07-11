const ws = new WebSocket(`ws://${window.location.host}/admin`);
const list = document.getElementById('students-list');

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);
        if (data.type === 'student-list') {
            console.log('Received student list:', data.students);
            list.innerHTML = data.students
                .map((id) => `<li>Студент-${id}</li>`)
                .join('');
        }
    } catch (error) {
        console.error('Error parsing WebSocket message:', error);
    }
};

ws.onopen = () => console.log('Connected to WebSocket');
ws.onclose = () => console.log('Disconnected from WebSocket');
