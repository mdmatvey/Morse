import { WebSocket } from 'ws';

export const clients = {};
const connectedUsers = [];

export function registerClient(id, ws) {
    clients[id] = ws;
    connectedUsers.push(id);
    console.log(`Client registered: ${id}`);
}

export function unregisterClient(id) {
    delete clients[id];
    const index = connectedUsers.indexOf(Number(id));
    if (index !== -1) {
        connectedUsers.splice(index, 1);
        console.log(`Client unregistered: ${id}`);
    }
}

export function sendMessage(recipient, content, speed) {
    const recipientWs = clients[recipient];
    if (recipientWs?.readyState === WebSocket.OPEN) {
        recipientWs.send(JSON.stringify({ type: 'message', content, speed }));
    } else {
        console.log(`Recipient ${recipient} not found or not ready`);
    }
}
