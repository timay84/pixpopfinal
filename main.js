const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;
let isQuitting = false;

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const winW = 150;
  const winH = 150;

  mainWindow = new BrowserWindow({
    width: winW,
    height: winH,
    x: screenWidth - winW - 40,
    y: screenHeight - winH - 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'floating');

  // Forward renderer console to terminal
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log('[renderer]', message);
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Context menu (works on all platforms regardless of tray support)
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: '退出', click: () => { app.quit(); } }
  ]);

  // Right-click on window to open menu
  mainWindow.webContents.on('context-menu', () => {
    contextMenu.popup({ window: mainWindow });
  });

  // System tray
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    tray.setToolTip('桌面宠物');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.error('Tray creation failed:', err.message);
  }

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

ipcMain.on('move-window', (_event, dx, dy) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const newX = Math.max(0, Math.min(screenWidth - 150, x + dx));
  const newY = Math.max(0, Math.min(screenHeight - 150, y + dy));
  mainWindow.setPosition(newX, newY);
});

ipcMain.on('app-quit', () => {
  app.quit();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
