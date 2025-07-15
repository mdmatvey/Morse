import {
    registerClient,
    unregisterClient,
    sendMessage,
    requestConnection,
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
    const isAdmin = req.url.includes('/admin');
    const userId = isAdmin ? `admin-${Date.now()}` : generateUniqueId();

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'register') {
            registerClient(userId, ws, isAdmin);
            if (!isAdmin)
                ws.send(JSON.stringify({ type: 'user-id', id: userId }));
        } else if (data.type === 'message') {
            sendMessage(data.recipient, data.content, data.params);
        } else if (data.type === 'connect' && !isAdmin) {
            requestConnection(userId, data.target);
        }
    });

    ws.on('close', () => {
        unregisterClient(userId, ws);
    });
}
