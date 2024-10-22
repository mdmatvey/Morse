const WebSocket = require('ws'); 

const clients = {};

function registerClient(id, ws) {
  clients[id] = ws;
  console.log(`Client registered: ${id}`);
}

function sendMessage(recipient, content) {
  const recipientWs = clients[recipient];
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(content);
  } else {
    console.log(`Recipient ${recipient} not found or not ready.`);
  }
}

module.exports = { registerClient, sendMessage };
