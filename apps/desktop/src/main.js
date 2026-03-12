const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// In dev mode: TASKFLOW_URL=http://localhost:3000 npm start
// In production: set TASKFLOW_URL to your deployed Vercel URL
const APP_URL = process.env.TASKFLOW_URL || 'https://task-manager-nine-topaz.vercel.app';
const isDev = APP_URL.includes('localhost');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'), // optional, falls back to Electron default if missing
    title: 'TaskFlow',
    backgroundColor: '#0d0d1a',
    show: false, // show after ready-to-show for cleaner startup
  });

  mainWindow.loadURL(APP_URL);

  // Show window once fully loaded (avoids white flash on startup)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Inject draggable title-bar region (needed because titleBarStyle: hiddenInset
  // removes the default drag area – without this the window can barely be moved)
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      #electron-drag-region {
        position: fixed;
        top: 0;
        left: 80px; /* leave room for macOS traffic-light buttons */
        right: 0;
        height: 28px;
        -webkit-app-region: drag;
        -webkit-user-select: none;
        z-index: 2147483647;
        pointer-events: auto;
      }
    `);
    mainWindow.webContents.executeJavaScript(`
      if (!document.getElementById('electron-drag-region')) {
        const el = document.createElement('div');
        el.id = 'electron-drag-region';
        document.body.appendChild(el);
      }
    `);
  });

  // Open external links in system browser instead of a new Electron window
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function buildMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    }] : []),
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'Ansicht',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
