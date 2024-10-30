import WebSocket from 'ws';

const clients = {};

export function registerClient(id, ws) {
  clients[id] = ws;
  console.log(`Client registered: ${id}`);
}

export function sendMessage(recipient, content) {
  const recipientWs = clients[recipient];
  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
    recipientWs.send(content);
  } else {
    console.log(`Recipient ${recipient} not found or not ready.`);
  }
}