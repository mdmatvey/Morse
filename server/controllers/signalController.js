import {
    registerClient,
    unregisterClient,
    sendMessage,
    clients,
    checkUserStatus,
    usedIds,
} from '../services/websocketService.js';

export function handleConnection(ws, req) {
    console.log('Client connected');

    let userId = null;
    const isAdmin = req.url.includes('/admin');

    ws.on('message', (message) => {
        const parsed = JSON.parse(message);
        const {
            type,
            userId: desiredId,
            recipient,
            content,
            params,
            checkUserId,
        } = parsed;

        if (type === 'register') {
            // Если клиент передал свой ID, используем его, иначе генерируем
            if (!isAdmin && desiredId) {
                if (usedIds.has(desiredId)) {
                    // Дублирующийся ID — можно добавить логику отказа, сейчас переписать
                    ws.send(
                        JSON.stringify({
                            type: 'user-id',
                            id: `${desiredId}-dup`,
                        }),
                    );
                    userId = `${desiredId}-dup`;
                } else {
                    userId = desiredId;
                    usedIds.add(userId);
                }
            } else {
                // для админа или fallback
                userId = isAdmin ? `admin-${Date.now()}` : generateRandomId();
            }
            registerClient(userId, ws, isAdmin);
            if (!isAdmin) {
                ws.send(JSON.stringify({ type: 'user-id', id: userId }));
            }
        } else if (type === 'message' && recipient && content && params) {
            sendMessage(recipient, content, params);
        } else if (type === 'status-check' && checkUserId) {
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
        console.log('Client disconnected:', userId);
        if (userId) {
            usedIds.delete(userId);
            unregisterClient(userId, ws);
        }
    });
}

function generateRandomId() {
    let id;
    do {
        id = Math.floor(Math.random() * 100);
    } while (usedIds.has(String(id)));
    usedIds.add(String(id));
    return String(id);
}
