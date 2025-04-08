import {
    registerClient,
    unregisterClient,
    sendMessage,
    clients,
    checkUserStatus,
} from '../services/websocketService.js';

const usedIds = new Set();

function generateUniqueId() {
    let id;
    do {
        id = Math.floor(Math.random() * 100);
    } while (usedIds.has(id));
    usedIds.add(id);
    return id;
}

export function handleConnection(ws, req) {
    console.log('Client connected');

    const isAdmin = req.url.includes('/admin');
    const userId = isAdmin ? `admin-${Date.now()}` : generateUniqueId();

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const { type, recipient, content, params, checkUserId } = parsedMessage;

        if (type === 'register') {
            registerClient(userId, ws, isAdmin);
            if (!isAdmin) {
                ws.send(JSON.stringify({ type: 'user-id', id: userId }));
            }
        } else if (type === 'message' && recipient && content && params) {
            sendMessage(recipient, content, params);
        } else if (type === 'status-check' && checkUserId) {
            // Отвечаем на запрос проверки статуса пользователя
            const isOnline = checkUserStatus(checkUserId);
            ws.send(
                JSON.stringify({
                    type: 'status-response',
                    userId: checkUserId,
                    online: isOnline,
                }),
            );
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        usedIds.delete(userId);
        unregisterClient(userId, ws);
    });
}
