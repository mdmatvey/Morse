const { WebSocket } = require('ws');

const clients = {};
const connectedUsers = []; // Keep track of connected users

function registerClient(id, ws) {
  clients[id] = ws;
  connectedUsers.push(id); // Add the client to the list of connected users
  console.log(`Client registered: ${id}`);
}

function unregisterClient(id) {
  delete clients[id];
  const index = connectedUsers.indexOf(Number(id));
  if (index !== -1) {
    connectedUsers.splice(index, 1); // Remove the client from the list of connected users
    console.log(`Client unregistered: ${id}`);
  }
}

function sendMessage(recipient, content) {
  const recipientWs = clients[recipient];
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(content);
  } else {
    console.log(`Recipient ${recipient} not found or not ready.`);
  }
}

module.exports = { clients, registerClient, unregisterClient, sendMessage };