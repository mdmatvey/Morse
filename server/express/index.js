import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { handleConnection } from './controllers/signalController.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files
app.use(express.static(path.join(process.cwd(), 'renderer/js')));

// Handle WebSocket connections
wss.on('connection', (ws) => handleConnection(ws, wss));

// Start the server on port 1337
server.listen(1337, () => {
  console.log('Server is running on http://localhost:1337');
});
