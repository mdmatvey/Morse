import { WebSocket } from 'ws';

export const clients = {}; // { userId: ws }
export const connectedUsers = new Map(); // userId ->  { id, isBusy, partner, status, sentRadiograms, receivedRadiograms, sentSignals, receivedSignals }
const adminClients = new Set();
const adminSettings = new Map(); // ws -> { direction: string|null }
const connectionLogs = [];
const MAX_LOGS = 100;

// Множество всех направлений, которые когда-либо были в логах
const persistentDirections = new Set();

export const usedIds = new Set();

function formatTime() {
    const d = new Date();
    return (
        d.getHours().toString().padStart(2, '0') +
        ':' +
        d.getMinutes().toString().padStart(2, '0') +
        ':' +
        d.getSeconds().toString().padStart(2, '0')
    );
}

function addLogEntry(event, userId, details = '') {
    if (!userId || userId === 'undefined' || userId === 'null') return;
    // Не логируем события для Клен-*
    if (userId.startsWith('Клен-')) return;

    // Фиксим направление из userId
    const m1 = userId.match(/^(?:Рапира|Макет)-(\d+)$/);
    if (m1) persistentDirections.add(m1[1]);
    // Фиксим направление из details (для partner)
    const m2 = details.match(/^(?:Рапира|Макет)-(\d+)$/);
    if (m2) persistentDirections.add(m2[1]);

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
        case 'duplicate':
            message = `Попытка повторного подключения под позывным ${userId}`;
            break;
        case 'finished':
            message = `${userId}: завершил` + (details ? ` — ${details}` : '');
        default:
            break;
    }

    connectionLogs.unshift({
        event,
        userId,
        details, // добавлено поле details
        message,
        timestamp: formatTime(), // или new Date().toISOString()
    });

    if (connectionLogs.length > MAX_LOGS) connectionLogs.pop();
    sendConnectionLogsToAdmins();
}

function getAvailableDirections() {
    // Возвращаем все когда‑либо встреченные направления, отсортированные по числу
    return Array.from(persistentDirections).sort(
        (a, b) => Number(a) - Number(b),
    );
}

export function broadcastStudentList() {
    const list = Array.from(connectedUsers.values());
    const studentsMsg = JSON.stringify({
        type: 'student-list',
        students: list,
    });

    // всем клиентам
    Object.values(clients).forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(studentsMsg);
    });
    // всем админам
    adminClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(studentsMsg);
    });

    // опции селектора
    const directions = getAvailableDirections();
    const dirMsg = JSON.stringify({ type: 'radiodirections', directions });
    adminClients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(dirMsg);
    });
}

function sendCurrentStateToAdmin(adminWs) {
    // список студентов
    adminWs.send(
        JSON.stringify({
            type: 'student-list',
            students: Array.from(connectedUsers.values()),
        }),
    );
    // логи
    adminSettings.set(adminWs, { direction: null });
    adminWs.send(
        JSON.stringify({
            type: 'connection-logs',
            logs: connectionLogs,
        }),
    );
    // направления
    adminWs.send(
        JSON.stringify({
            type: 'radiodirections',
            directions: getAvailableDirections(),
        }),
    );
}

export function registerClient(id, ws, isAdmin = false) {
    if (isAdmin) {
        adminClients.add(ws);
        sendCurrentStateToAdmin(ws);
        return { success: true };
    }
    if (!id || id === 'undefined' || id === 'null') {
        return { success: false, error: 'Неверный позывной' };
    }
    if (clients[id] || connectedUsers.has(id)) {
        addLogEntry('duplicate', id);
        return { success: false, error: 'Позывной уже используется' };
    }

    clients[id] = ws;
    connectedUsers.set(id, {
        id,
        isBusy: false,
        partner: null,
        status: 'active',
        sentRadiograms: 0,
        receivedRadiograms: 0,
        sentSignals: 0,
        receivedSignals: 0,
    });
    addLogEntry('connect', id);
    broadcastStudentList();
    return { success: true };
}

export function unregisterClient(id, ws) {
    adminClients.delete(ws);
    adminSettings.delete(ws);

    if (!id || id === 'undefined' || id === 'null') return;

    delete clients[id];
    if (connectedUsers.has(id)) {
        const user = connectedUsers.get(id);

        if (user.isBusy && user.partner) {
            const partner = connectedUsers.get(user.partner);
            if (partner) {
                partner.isBusy = false;
                partner.partner = null;
                addLogEntry('free', user.partner, id);
            }
            addLogEntry('free', id, user.partner);
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

// новая функция для инкрементации счётчиков
export function incrementCounts(senderId, recipientId, keyType, messageType) {
    if (keyType !== 'auto') return;
    const sender = connectedUsers.get(senderId);
    const receiver = connectedUsers.get(recipientId);
    if (!sender || !receiver) return;

    switch (messageType) {
        case 'operational':
            sender.sentRadiograms++;
            receiver.receivedRadiograms++;
            break;
        case 'service':
            sender.sentSignals++;
            receiver.receivedSignals++;
            break;
        default:
            break;
    }
}

// новый метод завершения обмена
export function finishExchange(userId) {
    const user = connectedUsers.get(userId);
    if (!user) return;
    user.status = 'finished';

    const details = `пер. рдг: ${user.sentRadiograms}, прин. рдг.: ${user.receivedRadiograms}, пер сигн.: ${user.sentSignals}, прин сигн.: ${user.receivedSignals}`;
    addLogEntry('finished', userId, details);
    broadcastStudentList();
    sendConnectionLogsToAdmins();
}

export function setBusy(userId, partnerId) {
    const user = connectedUsers.get(userId);
    const partner = connectedUsers.get(partnerId);
    if (user && partner) {
        if (user.partner && user.partner !== partnerId) {
            const old = connectedUsers.get(user.partner);
            if (old) {
                old.isBusy = false;
                old.partner = null;
                addLogEntry('free', user.partner, userId);
                addLogEntry('free', userId, user.partner);
            }
        }
        user.isBusy = true;
        user.partner = partnerId;
        partner.isBusy = true;
        partner.partner = userId;
        addLogEntry('busy', userId, partnerId);
        addLogEntry('busy', partnerId, userId);
        broadcastStudentList();
    }
}

export function setFree(userId) {
    const user = connectedUsers.get(userId);
    if (user && user.isBusy && user.partner) {
        const pid = user.partner;
        const partner = connectedUsers.get(pid);
        if (partner) {
            partner.isBusy = false;
            partner.partner = null;
            addLogEntry('free', pid, userId);
        }
        user.isBusy = false;
        user.partner = null;
        addLogEntry('free', userId, pid);
        broadcastStudentList();
    }
}

export function setAdminDirection(ws, direction) {
    if (!adminSettings.has(ws)) return;
    adminSettings.get(ws).direction = direction;
    sendConnectionLogsToAdmin(ws);
}

function filterLogsFor(ws) {
    const { direction } = adminSettings.get(ws) || {};
    if (!direction) return connectionLogs;
    return connectionLogs.filter((log) => log.userId.endsWith(`-${direction}`));
}

export function sendConnectionLogsToAdmins() {
    adminClients.forEach((ws) => sendConnectionLogsToAdmin(ws));
}

export function sendConnectionLogsToAdmin(ws) {
    if (ws.readyState !== WebSocket.OPEN) return;
    ws.send(
        JSON.stringify({
            type: 'connection-logs',
            logs: filterLogsFor(ws),
        }),
    );
}
