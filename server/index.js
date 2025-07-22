// /server/index.js
import http from 'http';
import { WebSocketServer } from 'ws';
import { handleConnection } from './controllers/signalController.js';
import { serveStatic, setServerIP } from './services/staticService.js';
import os from 'os';

// Читаем переменные окружения
// FORCE_LOCALHOST: если 'true', getLocalIP сразу вернёт 'localhost'
// PORT: порт, на котором будет запущен сервер (по умолчанию 1337)
const forceLocalhost = process.env.FORCE_LOCALHOST === 'true';
const port = parseInt(process.env.PORT, 10) || 1337;

const server = http.createServer();
const wss = new WebSocketServer({ server });

function getLocalIP() {
    if (forceLocalhost) {
        return 'localhost';
    }

    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const { family, internal, address } of iface) {
            if (family === 'IPv4' && !internal) {
                return address;
            }
        }
    }

    return 'localhost';
}

const localIP = getLocalIP();
setServerIP(localIP);

server.on('request', serveStatic);
wss.on('connection', (ws, req) => handleConnection(ws, req));

server.listen(port, () => {
    console.log(`Сервер запущен по адресу http://${localIP}:${port}`);
});
