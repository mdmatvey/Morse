import {
    registerClient,
    unregisterClient,
    sendMessage,
    setBusy,
    setFree,
} from '../services/websocketService.js';

export function handleConnection(ws, req) {
    let userId = null;
    const isAdmin = req.url.includes('/admin');

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        switch (data.type) {
            case 'register':
                userId = data.userId;
                registerClient(userId, ws, isAdmin);
                if (!isAdmin)
                    ws.send(JSON.stringify({ type: 'user-id', id: userId }));
                break;
            case 'message':
                sendMessage(data.recipient, data.content, data.params);
                break;
            case 'set-busy':
                setBusy(data.userId, data.partnerId);
                break;
            case 'set-free':
                setFree(data.userId);
                break;
        }
    });

    ws.on('close', () => {
        if (userId) unregisterClient(userId, ws);
    });
}
