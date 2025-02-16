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

export function handleConnection(ws, wss) {
    console.log('Client connected');
    const userId = generateUniqueId();

    ws.send(JSON.stringify({ type: 'user-id', id: userId }));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const { type, recipient, content, params } = parsedMessage;

        if (type === 'register') {
            registerClient(userId, ws);
        } else if (type === 'message' && recipient && content && params) {
            sendMessage(recipient, content, params);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        usedIds.delete(userId);
        for (const id in clients) {
            if (clients[id] === ws) {
                unregisterClient(id);
                break;
            }
        }
    });
}
