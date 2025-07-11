import http from 'http';
import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/signalController.js';
import { serveStatic, setServerIP } from './services/staticService.js';
import os from 'os';

const server = http.createServer();
const wss = new WebSocketServer({ server });

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const { family, internal, address } of iface) {
            if (family === 'IPv4' && !internal) return address;
        }
    }
    return 'localhost';
}

const localIP = getLocalIP();
setServerIP(localIP); // Передаем локальный IP в staticService.js

server.on('request', serveStatic);
wss.on('connection', (ws) => handleConnection(ws, wss));

server.listen(1337, () => {
    console.log(`Сервер запущен по адресу http://${localIP}:1337`);
});
