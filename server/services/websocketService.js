import { WebSocket } from 'ws';

export const clients = {};
const connectedUsers = new Set();
const adminClients = new Set();
const connectionLogs = [];
const MAX_LOGS = 100; // Максимальное количество логов для хранения
export const usedIds = new Set(); // Добавлено: экспорт usedIds

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

    const logEntry = {
        event,
        userId,
        message,
        timestamp,
    };

    // Добавляем запись в начало массива
    connectionLogs.unshift(logEntry);

    // Ограничиваем размер массива логов
    if (connectionLogs.length > MAX_LOGS) {
        connectionLogs.pop();
    }

    // Отправляем обновленные логи всем админам
    sendConnectionLogsToAdmins();
}

export function registerClient(id, ws, isAdmin = false) {
    clients[id] = ws;

    if (isAdmin) {
        adminClients.add(ws);
        sendConnectedUsersToAdmins(); // Отправляем список студентов
        sendConnectionLogsToAdmins(); // Отправляем логи подключений
    } else {
        // Преобразуем id в число для единообразия
        const numericId = parseInt(id, 10);
        connectedUsers.add(numericId);
        console.log(`Client registered: ${id}`);
        // Добавляем запись о подключении в журнал
        addLogEntry('connect', id);
        sendConnectedUsersToAdmins(); // Отправляем обновленный список админам
    }
}

export function unregisterClient(id, ws) {
    delete clients[id];

    if (connectedUsers.has(parseInt(id, 10))) {
        connectedUsers.delete(parseInt(id, 10));
        console.log(`Client unregistered: ${id}`);
        // Добавляем запись об отключении в журнал
        addLogEntry('disconnect', id);
    }

    if (adminClients.has(ws)) {
        adminClients.delete(ws);
    }

    sendConnectedUsersToAdmins(); // Обновляем список студентов у админов
}

export function sendMessage(recipient, content, params) {
    const recipientWs = clients[recipient];
    if (recipientWs?.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify({ type: 'message', content, params }));
    } else {
        console.log(`Recipient ${recipient} not found or not ready`);
    }
}

// Проверяет, находится ли пользователь в сети
export function checkUserStatus(userId) {
    // Преобразуем userId в число, так как в Set храним числа
    const numericId = parseInt(userId, 10);
    return connectedUsers.has(numericId);
}

function sendConnectedUsersToAdmins() {
    const userList = Array.from(connectedUsers).map((id) => id.toString());
    const message = JSON.stringify({
        type: 'student-list',
        students: userList,
    });

    adminClients.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
            adminWs.send(message);
        }
    });
}

function sendConnectionLogsToAdmins() {
    const message = JSON.stringify({
        type: 'connection-logs',
        logs: connectionLogs,
    });

    adminClients.forEach((adminWs) => {
        if (adminWs.readyState === WebSocket.OPEN) {
            adminWs.send(message);
        }
    });
}
