import {
    registerClient,
    unregisterClient,
    sendMessage,
    clients,
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
        const { type, recipient, content, params } = parsedMessage;

        if (type === 'register') {
            registerClient(userId, ws, isAdmin);
            if (!isAdmin) {
                ws.send(JSON.stringify({ type: 'user-id', id: userId }));
            }
        } else if (type === 'message' && recipient && content && params) {
            sendMessage(recipient, content, params);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        usedIds.delete(userId);
        unregisterClient(userId, ws);
    });
}
