import { WebSocket } from 'ws';

export const clients = {};
const connectedUsers = new Set();
const adminClients = new Set();

export function registerClient(id, ws, isAdmin = false) {
    clients[id] = ws;

    if (isAdmin) {
        adminClients.add(ws);
        sendConnectedUsersToAdmins(); // Отправляем список студентов сразу после подключения
    } else {
        connectedUsers.add(id);
        console.log(`Client registered: ${id}`);
        sendConnectedUsersToAdmins(); // Отправляем обновленный список админам
    }
}

export function unregisterClient(id, ws) {
    delete clients[id];

    if (connectedUsers.has(id)) {
        connectedUsers.delete(id);
        console.log(`Client unregistered: ${id}`);
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

function sendConnectedUsersToAdmins() {
    const userList = Array.from(connectedUsers);
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
