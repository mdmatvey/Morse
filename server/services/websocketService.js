import { WebSocket } from 'ws';

export const clients = {}; // { userId: ws }
export const connectedUsers = new Map(); // userId -> { id, isBusy, partner }
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

function addLogEntry(event, userId, details = '') {
    // Не логируем события для пустых или undefined userId
    if (!userId || userId === 'undefined' || userId === 'null') {
        return;
    }

    let message;
    switch (event) {
        case 'connect':
            message = `${userId} подключился`;
            break;
        case 'disconnect':
            message = `${userId} отключился`;
            break;
        case 'busy':
            message = `${userId} начал работу с ${details}`;
            break;
        case 'free':
            message = `${userId} завершил работу${details ? ` с ${details}` : ''}`;
            break;
        default:
            message = `${userId}: ${event}`;
    }

    connectionLogs.unshift({
        event,
        userId,
        message,
        timestamp: formatTime(),
    });
    if (connectionLogs.length > MAX_LOGS) connectionLogs.pop();
    sendConnectionLogsToAdmins();
}

export function broadcastStudentList() {
    const list = Array.from(connectedUsers.values());
    const payload = JSON.stringify({ type: 'student-list', students: list });

    // Отправляем обычным клиентам
    Object.values(clients).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });

    // Отправляем админам
    adminClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    });
}

function sendCurrentStateToAdmin(adminWs) {
    // Отправляем текущий список студентов
    const studentList = Array.from(connectedUsers.values());
    const studentListPayload = JSON.stringify({
        type: 'student-list',
        students: studentList,
    });
    if (adminWs.readyState === WebSocket.OPEN) {
        adminWs.send(studentListPayload);
    }

    // Отправляем текущие логи
    const logsPayload = JSON.stringify({
        type: 'connection-logs',
        logs: connectionLogs,
    });
    if (adminWs.readyState === WebSocket.OPEN) {
        adminWs.send(logsPayload);
    }
}

export function registerClient(id, ws, isAdmin = false) {
    if (isAdmin) {
        // Для админов добавляем в список и отправляем текущее состояние
        adminClients.add(ws);
        sendCurrentStateToAdmin(ws);
        return;
    }

    // Проверяем, что id валидный
    if (!id || id === 'undefined' || id === 'null') {
        return;
    }

    clients[id] = ws;
    connectedUsers.set(id, { id, isBusy: false, partner: null });
    addLogEntry('connect', id);
    broadcastStudentList();
}

export function unregisterClient(id, ws) {
    // Удаляем из админов если это был админ
    adminClients.delete(ws);

    // Если id не валидный, просто выходим
    if (!id || id === 'undefined' || id === 'null') {
        return;
    }

    delete clients[id];
    if (connectedUsers.has(id)) {
        const user = connectedUsers.get(id);

        // Освобождаем партнера, если этот пользователь был занят
        if (user.isBusy && user.partner) {
            const partner = connectedUsers.get(user.partner);
            if (partner) {
                partner.isBusy = false;
                partner.partner = null;
                addLogEntry('free', user.partner, id); // Логируем освобождение партнера
            }
            addLogEntry('free', id, user.partner); // Логируем освобождение отключившегося пользователя
        }

        connectedUsers.delete(id);
        addLogEntry('disconnect', id);
        broadcastStudentList();
    }
}

export function sendMessage(recipient, content, params) {
    const ws = clients[recipient];
    if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', content, params }));
    }
}

export function setBusy(userId, partnerId) {
    const user = connectedUsers.get(userId);
    const partner = connectedUsers.get(partnerId);

    if (user && partner) {
        // Освобождаем предыдущего партнера, если он был
        if (user.partner && user.partner !== partnerId) {
            const oldPartner = connectedUsers.get(user.partner);
            if (oldPartner) {
                oldPartner.isBusy = false;
                oldPartner.partner = null;
                addLogEntry('free', user.partner, userId);
                addLogEntry('free', userId, user.partner);
            }
        }

        // Устанавливаем занятость для обоих пользователей
        user.isBusy = true;
        user.partner = partnerId;
        partner.isBusy = true;
        partner.partner = userId;

        // Логируем новую связь
        addLogEntry('busy', userId, partnerId);
        addLogEntry('busy', partnerId, userId);

        broadcastStudentList();
    }
}

export function setFree(userId) {
    const user = connectedUsers.get(userId);
    if (user && user.isBusy && user.partner) {
        const partnerId = user.partner;
        const partner = connectedUsers.get(partnerId);

        if (partner) {
            partner.isBusy = false;
            partner.partner = null;
            addLogEntry('free', partnerId, userId);
        }

        user.isBusy = false;
        user.partner = null;
        addLogEntry('free', userId, partnerId);

        broadcastStudentList();
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
