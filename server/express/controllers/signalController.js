// express/controllers/signalController.js
import { registerClient, unregisterClient, sendMessage, clients } from '../services/websocketService.js';  // Import clients

export function handleConnection(ws, wss) {
  console.log('Client connected');

  // Handle client messages
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    const { type, id, recipient, content } = parsedMessage;

    if (type === 'register') {
      registerClient(id, ws);
    } else if (type === 'message' && recipient && content) {
      sendMessage(recipient, content);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Unregister client on disconnect
    for (let id in clients) {
      if (clients[id] === ws) {
        unregisterClient(id);
        break;
      }
    }
  });
}
