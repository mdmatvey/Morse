import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    if (new Date() > new Date('2024-12-01T00:00:00')) {
        return;
    }

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'renderer/js/preload.mjs'), // Путь к preload.js
            contextIsolation: true, // Включите изоляцию контекста
            nodeIntegration: true, // Отключите интеграцию Node.js
        },
    });

    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'renderer/index.html'), 
        protocol: 'file:',
        slashes: true,
    }));

    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);
