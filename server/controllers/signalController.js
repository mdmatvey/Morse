import {
    registerClient,
    unregisterClient,
    sendMessage,
    setBusy,
    setFree,
    setAdminDirection,
} from '../services/websocketService.js';

export function handleConnection(ws, req) {
    let userId = null;
    const isAdmin = req.url.includes('/admin');

    ws.on('message', (msg) => {
        const data = JSON.parse(msg);
        switch (data.type) {
            case 'register':
                userId = data.userId;
                const registerResult = registerClient(userId, ws, isAdmin);

                if (!isAdmin) {
                    if (registerResult.success) {
                        ws.send(
                            JSON.stringify({ type: 'user-id', id: userId }),
                        );
                    } else {
                        ws.send(
                            JSON.stringify({
                                type: 'registration-error',
                                error: registerResult.error,
                            }),
                        );
                        userId = null;
                        ws.close(4000, registerResult.error);
                        return;
                    }
                }
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
            case 'set-direction':
                // для админа: data.direction = строка, например "1"
                setAdminDirection(ws, data.direction);
                break;
        }
    });

    ws.on('close', () => {
        if (userId) unregisterClient(userId, ws);
    });
}
