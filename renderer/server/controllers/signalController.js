import { registerClient, sendMessage } from '../services/websocketService.js';

export function handleConnection(ws, wss) {
  console.log('Client connected');

  // Идентификация клиента
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
  });
}
