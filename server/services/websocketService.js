import { WebSocket } from 'ws';

export const clients = {};
const connectedUsers = new Set();
const adminClients = new Set();
const connectionLogs = [];
const pendingConnections = new Map(); // userId (строка) → targetId (строка)
const MAX_LOGS = 100; // Максимальное количество логов для хранения

// Функция для форматирования времени
function formatTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Добавляет новую запись в журнал активности
function addLogEntry(event, userId) {
    const timestamp = formatTime();
    let message = '';

    if (event === 'connect') {
        message = `Студент-${userId} подключился`;
    } else if (event === 'disconnect') {
        message = `Студент-${userId} отключился`;
    }

    const logEntry = { event, userId, message, timestamp };
    connectionLogs.unshift(logEntry);

    if (connectionLogs.length > MAX_LOGS) {
        connectionLogs.pop();
    }

    sendConnectionLogsToAdmins();
}

export function registerClient(id, ws, isAdmin = false) {
    const key = String(id);
    clients[key] = ws;

    if (isAdmin) {
        adminClients.add(ws);
        sendConnectedUsersToAdmins();
        sendConnectionLogsToAdmins();
    } else {
        connectedUsers.add(key);
        console.log(`Client registered: ${key}`);
        addLogEntry('connect', key);
        sendConnectedUsersToAdmins();
    }
}

export function unregisterClient(id, ws) {
    const key = String(id);
    delete clients[key];

    if (connectedUsers.has(key)) {
        connectedUsers.delete(key);
        console.log(`Client unregistered: ${key}`);
        addLogEntry('disconnect', key);
    }

    if (adminClients.has(ws)) {
        adminClients.delete(ws);
    }

    sendConnectedUsersToAdmins();
}

export function sendMessage(recipient, content, params) {
    const recipientKey = String(recipient);
    const recipientWs = clients[recipientKey];
    if (recipientWs?.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify({ type: 'message', content, params }));
    } else {
        console.log(`Recipient ${recipientKey} not found or not ready`);
    }
}

function sendConnectedUsersToAdmins() {
    const userList = Array.from(connectedUsers);
    const message = JSON.stringify({
        type: 'student-list',
        students: userList,
    });
    adminClients.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) adminWs.send(message);
    });
}

function sendConnectionLogsToAdmins() {
    const message = JSON.stringify({
        type: 'connection-logs',
        logs: connectionLogs,
    });
    adminClients.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) adminWs.send(message);
    });
}

export function requestConnection(id, target) {
    const idKey = String(id);
    const targetKey = String(target);

    pendingConnections.set(idKey, targetKey);

    // если второй участник уже ждал именно вас
    if (pendingConnections.get(targetKey) === idKey) {
        const ws1 = clients[idKey];
        const ws2 = clients[targetKey];
        [ws1, ws2].forEach((ws) =>
            ws?.send(
                JSON.stringify({ type: 'connect-status', status: 'connected' }),
            ),
        );
        pendingConnections.delete(idKey);
        pendingConnections.delete(targetKey);
    } else {
        // первый запрос — помечаем ожидание
        const ws = clients[idKey];
        ws?.send(JSON.stringify({ type: 'connect-status', status: 'waiting' }));
    }
}
