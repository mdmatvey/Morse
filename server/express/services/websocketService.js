import WebSocket from 'ws';

export const clients = {};
const connectedUsers = []; // Keep track of connected users

export function registerClient(id, ws) {
  clients[id] = ws;
  connectedUsers.push(id); // Add the client to the list of connected users
  console.log(`Client registered: ${id}`);
  broadcastUserList(); // Broadcast the updated user list
}

export function unregisterClient(id) {
  delete clients[id];
  const index = connectedUsers.indexOf(id);
  if (index !== -1) {
    connectedUsers.splice(index, 1); // Remove the client from the list of connected users
    console.log(`Client unregistered: ${id}`);
    broadcastUserList(); // Broadcast the updated user list
  }
}

export function sendMessage(recipient, content) {
  const recipientWs = clients[recipient];
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(content);
  } else {
    console.log(`Recipient ${recipient} not found or not ready.`);
  }
}

function broadcastUserList() {
  // Send the list of connected users to the main process
  process.send({
    type: 'user-list',
    users: connectedUsers
  });
}
