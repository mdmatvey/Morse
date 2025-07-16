import { WebSocket } from 'ws';

export const clients = {};
export const connectedUsers = new Set(); // хранит строки вида 'Макет-1'
const adminClients = new Set();
const connectionLogs = [];
const MAX_LOGS = 100; // Максимальное количество логов
export const usedIds = new Set();

// Форматирует время для логов
function formatTime() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
}

// Добавляет запись в журнал
function addLogEntry(event, userId) {
    const timestamp = formatTime();
    let message = '';
    if (event === 'connect') message = `${userId} подключился`;
    if (event === 'disconnect') message = `${userId} отключился`;
    const entry = { event, userId, message, timestamp };
    connectionLogs.unshift(entry);
    if (connectionLogs.length > MAX_LOGS) connectionLogs.pop();
    sendConnectionLogsToAdmins();
}

export function registerClient(id, ws, isAdmin = false) {
    clients[id] = ws;
    if (isAdmin) {
        adminClients.add(ws);
        sendConnectedUsersToAdmins();
        sendConnectionLogsToAdmins();
    } else {
        connectedUsers.add(id);
        usedIds.add(id);
        console.log(`Client registered: ${id}`);
        addLogEntry('connect', id);
        sendConnectedUsersToAdmins();
    }
}

export function unregisterClient(id, ws) {
    delete clients[id];
    if (connectedUsers.has(id)) {
        connectedUsers.delete(id);
        console.log(`Client unregistered: ${id}`);
        addLogEntry('disconnect', id);
    }
    if (adminClients.has(ws)) adminClients.delete(ws);
    sendConnectedUsersToAdmins();
}

export function sendMessage(recipient, content, params) {
    const ws = clients[recipient];
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', content, params }));
    } else {
        console.log(`Recipient ${recipient} not ready`);
    }
}

// Проверяет, онлайн ли пользователь по полному ID
export function checkUserStatus(userId) {
    return connectedUsers.has(userId);
}

function sendConnectedUsersToAdmins() {
    const students = Array.from(connectedUsers);
    const msg = JSON.stringify({ type: 'student-list', students });
    adminClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
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
