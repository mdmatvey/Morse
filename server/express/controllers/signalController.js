const { registerClient, unregisterClient, sendMessage, clients } = require('../services/websocketService.js');

// Для хранения уникальных ID
const usedIds = new Set();

// Функция для генерации уникального ID
function generateUniqueId() {
  let id;
  do {
    id = Math.floor(Math.random() * 100);  // Генерация ID от 0 до 99
  } while (usedIds.has(id));  // Проверяем, если ID уже существует, генерируем новый
  usedIds.add(id);  // Добавляем ID в список использованных
  return id;
}

function handleConnection(ws, wss) {
  console.log('Client connected');

  // Генерация уникального ID для нового пользователя
  const userId = generateUniqueId();

  // Отправка сгенерированного ID клиенту
  ws.send(JSON.stringify({ type: 'user-id', id: userId }));

  // Обработка сообщений от клиента
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    const { type, recipient, content } = parsedMessage;

    if (type === 'register') {
      registerClient(userId, ws);
    } else if (type === 'message' && recipient && content) {
      sendMessage(recipient, content);
    }
  });

  // Обработка закрытия соединения
  ws.on('close', () => {
    console.log('Client disconnected');
    // Удаляем ID из списка при отключении клиента
    usedIds.delete(userId);

    // Удаление клиента из сервера
    for (let id in clients) {
      if (clients[id] === ws) {
        unregisterClient(id);
        break;
      }
    }
  });
}

module.exports = { handleConnection }