import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 600,
    title: 'Karuna Hotel POS & ERP Suite',
    icon: path.join(__dirname, '../public/favicon.ico'),
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Sleek standalone desktop software feel
  mainWindow.setMenuBarVisibility(false);

  const indexPath = path.join(__dirname, '../dist/index.html');

  // Load local production build directly (100% offline independent)
  if (fs.existsSync(indexPath) && !process.env.VITE_DEV) {
    mainWindow.loadFile(indexPath);
  } else if (process.env.POS_APP_URL) {
    mainWindow.loadURL(process.env.POS_APP_URL);
  } else {
    mainWindow.loadURL('http://127.0.0.1:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Native IPC Handlers
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle('app:toggle-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.handle('app:close', () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.handle('app:get-server-ip', () => {
  const configFile = path.join(__dirname, '../server_config.json');
  if (fs.existsSync(configFile)) {
    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
      if (config.serverIp) return config.serverIp;
    } catch (e) {}
  }
  return process.env.MASTER_SERVER_IP || '10.40.145.195';
});
ipcMain.handle('app:print-receipt', async (event, options) => {
  if (!mainWindow) return { success: false, error: 'Window not found' };
  try {
    mainWindow.webContents.print({
      silent: options?.silent || false,
      printBackground: true,
      deviceName: options?.deviceName || ''
    }, (success, failureReason) => {
      console.log('Print result:', success, failureReason);
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
