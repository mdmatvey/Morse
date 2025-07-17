import { WebSocket } from 'ws';

export const clients = {}; // { userId: ws, ... }
export const connectedUsers = new Set(); // хранит полные строки 'Макет-1' и т.д.
const adminClients = new Set();
const connectionLogs = [];
const MAX_LOGS = 100;

export const usedIds = new Set();

// Форматирование времени
function formatTime() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
}

function addLogEntry(event, userId) {
    const timestamp = formatTime();
    const message =
        event === 'connect' ? `${userId} подключился` : `${userId} отключился`;

    connectionLogs.unshift({ event, userId, message, timestamp });
    if (connectionLogs.length > MAX_LOGS) connectionLogs.pop();
    sendConnectionLogsToAdmins();
}

// Отправить список подключённых (для админа и студентов/кленов)
export function broadcastStudentList() {
    const list = Array.from(connectedUsers);
    const msg = JSON.stringify({ type: 'student-list', students: list });
    Object.values(clients).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
}

export function registerClient(id, ws, isAdmin = false) {
    clients[id] = ws;
    connectedUsers.add(id);
    addLogEntry('connect', id);
    broadcastStudentList(); // теперь всем
    if (isAdmin) adminClients.add(ws);
}

export function unregisterClient(id, ws) {
    delete clients[id];
    if (connectedUsers.has(id)) {
        connectedUsers.delete(id);
        addLogEntry('disconnect', id);
        broadcastStudentList(); // теперь всем
    }
    if (adminClients.has(ws)) adminClients.delete(ws);
}

export function sendMessage(recipient, content, params) {
    const ws = clients[recipient];
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', content, params }));
    }
}

export function checkUserStatus(userId) {
    return connectedUsers.has(userId);
}

function sendConnectionLogsToAdmins() {
    const msg = JSON.stringify({
        type: 'connection-logs',
        logs: connectionLogs,
    });
    adminClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
}
