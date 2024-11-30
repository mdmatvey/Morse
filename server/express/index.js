const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { handleConnection } = require('./controllers/signalController.js');
const os = require('os');  // Подключаем модуль os для получения информации о сети

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Функция для получения локального IP-адреса
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (let iface in interfaces) {
    for (let i = 0; i < interfaces[iface].length; i++) {
      const ifaceDetails = interfaces[iface][i];
      // Ищем IPv4 адрес, который не является адресом типа '127.0.0.1'
      if (ifaceDetails.family === 'IPv4' && !ifaceDetails.internal) {
        return ifaceDetails.address;
      }
    }
  }
  return 'localhost';  // Если не удалось найти IP, возвращаем localhost
}

const localIP = getLocalIP();  // Получаем локальный IP

// Handle WebSocket connections
wss.on('connection', (ws) => handleConnection(ws, wss));

// Start the server on port 1337
server.listen(1337, () => {
  console.log(`Сервер запущен по адресу http://${localIP}:1337`);  // Выводим локальный IP-адрес
});
