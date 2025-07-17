import { WebSocket } from 'ws';

export const clients = {}; // { userId: ws }
export const connectedUsers = new Set(); // full IDs 'Макет-1', etc.
const adminClients = new Set();
const connectionLogs = [];
const MAX_LOGS = 100;

export const usedIds = new Set();

function formatTime() {
    const d = new Date();
    return (
        d.getHours().toString().padStart(2, '0') +
        ':' +
        d.getMinutes().toString().padStart(2, '0')
    );
}

function addLogEntry(event, userId) {
    const msg =
        event === 'connect' ? `${userId} подключился` : `${userId} отключился`;
    connectionLogs.unshift({
        event,
        userId,
        message: msg,
        timestamp: formatTime(),
    });
    if (connectionLogs.length > MAX_LOGS) connectionLogs.pop();
    sendConnectionLogsToAdmins();
}

export function broadcastStudentList() {
    const list = Array.from(connectedUsers);
    const payload = JSON.stringify({ type: 'student-list', students: list });
    Object.values(clients).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
}

export function registerClient(id, ws, isAdmin = false) {
    clients[id] = ws;
    connectedUsers.add(id);
    addLogEntry('connect', id);
    broadcastStudentList();
    if (isAdmin) adminClients.add(ws);
}

export function unregisterClient(id, ws) {
    delete clients[id];
    if (connectedUsers.delete(id)) {
        addLogEntry('disconnect', id);
        broadcastStudentList();
    }
    adminClients.delete(ws);
}

export function sendMessage(recipient, content, params) {
    const ws = clients[recipient];
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', content, params }));
    }
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
