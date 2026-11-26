const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

const DEV_URL = 'http://localhost:5002';
const isDev = !app.isPackaged;

let mainWindow = null;
let widgetWindow = null;
let lastWidgetPos = null;

function getEntryUrl(query = '') {
  if (isDev) {
    return `${DEV_URL}${query}`;
  }
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  return `file://${indexPath}${query}`;
}

function notifyWidgetState(isOpen) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('widget:state', isOpen);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 460,
    minHeight: 560,
    title: 'timo',
    backgroundColor: '#FAFAFA',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(getEntryUrl());

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      widgetWindow.close();
    }
  });
}

function openWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.show();
    widgetWindow.focus();
    notifyWidgetState(true);
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const width = 276;
  const height = 88;
  const x = lastWidgetPos?.x ?? workArea.x + workArea.width - width - 24;
  const y = lastWidgetPos?.y ?? workArea.y + 24;

  widgetWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widgetWindow.setAlwaysOnTop(true, 'floating');
  widgetWindow.loadURL(getEntryUrl('?view=widget'));

  widgetWindow.on('moved', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      const [wx, wy] = widgetWindow.getPosition();
      lastWidgetPos = { x: wx, y: wy };
    }
  });

  widgetWindow.on('closed', () => {
    widgetWindow = null;
    notifyWidgetState(false);
  });

  notifyWidgetState(true);
}

function closeWidgetWindow() {
  if (widgetWindow && !widgetWindow.isDestroyed()) {
    widgetWindow.close();
  }
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.handle('widget:open', () => {
    openWidgetWindow();
    return true;
  });

  ipcMain.handle('widget:close', () => {
    closeWidgetWindow();
    return true;
  });

  ipcMain.handle('widget:is-open', () => {
    return Boolean(widgetWindow && !widgetWindow.isDestroyed());
  });

  ipcMain.handle('main:focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+T', () => {
    if (widgetWindow && !widgetWindow.isDestroyed()) {
      closeWidgetWindow();
    } else {
      openWidgetWindow();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
