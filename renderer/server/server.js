import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { handleConnection } from './controllers/signalController.js';

const app = express();
const server = http.createServer(app);

// Создание нового WebSocket сервера
const wss = new WebSocketServer({ server });

// Настройка статических файлов
app.use(express.static(path.join(process.cwd(), 'renderer/js'))); // Корректный путь к статическим файлам

// Обработка WebSocket-соединений
wss.on('connection', (ws) => handleConnection(ws, wss));

// Запуск сервера
server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
