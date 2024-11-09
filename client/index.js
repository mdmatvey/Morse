import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
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
