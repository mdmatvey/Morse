import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fork } from 'child_process';

// Workaround for __dirname in ES modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

let mainWindow;
let serverProcess; // To hold the server process instance

function createWindow() {
  if (new Date() > new Date('2024-12-01T00:00:00')) {
      return;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Enable nodeIntegration (not recommended for production)
      contextIsolation: false, // Disable contextIsolation (not recommended for production)
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // Quit when all windows are closed
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
});

// Listen for start and stop commands from renderer process
ipcMain.on('start-server', () => {
  if (!serverProcess) {
    // Start the server as a child process
    serverProcess = fork(path.join(__dirname, 'express/index.js'));

    // Listen for log messages from the server
    serverProcess.on('message', (message) => {
      if (message.type === 'log') {
        // Forward the log message to the renderer process
        if (mainWindow) {
          mainWindow.webContents.send('server-log', message.message);
        }
      } else if (message.type === 'user-list') {
        // Forward the updated list of users to the renderer process
        if (mainWindow) {
          mainWindow.webContents.send('user-list', message.users);
        }
      }
    });

    serverProcess.on('exit', () => {
      serverProcess = null;
    });
  }
});

const stopServer = (message) => {
  if (serverProcess) {
    serverProcess.kill(); // Stop the server process
    serverProcess = null;

    console.log(message)
  }
}

ipcMain.on('stop-server', () => {
  stopServer('Server is stopped');
});

app.on('before-quit', () => {
  stopServer('Server stopped before quitting application');
});