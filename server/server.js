const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { handleConnection } = require('./controllers/signalController');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Настройка статических файлов
app.use(express.static(path.join(__dirname, '../public')));

// Обработка WebSocket-соединений
wss.on('connection', (ws) => handleConnection(ws, wss));

// Запуск сервера
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});