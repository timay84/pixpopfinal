const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, session } = require('electron');
const path = require('path');
const fs = require('fs');

// Keep development launches from competing for Electron's cache and tray.
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) process.exit(0);
app.setPath('cache', path.join(app.getPath('userData'), 'pixpop-cache'));

let settingsWindow;
let overlayWindow;
let tray;
let quitting = false;
let keyboardHook;

const defaultConfig = {
  baudRate: 115200,
  toy: 'ghost',
  mode: 'default',
  camera: false,
  actions: {
    N: 'ghost-float', NE: 'ghost-stars', E: 'ghost-dash', SE: 'ghost-burst',
    S: 'ghost-fall', SW: 'ghost-stars', W: 'ghost-dash', NW: 'ghost-burst',
    SINGLE: 'ghost-float', DOUBLE: 'surprise'
  }
};

function configPath() { return path.join(app.getPath('userData'), 'pixpop-config.json'); }
function readConfig() {
  try { return { ...defaultConfig, ...JSON.parse(fs.readFileSync(configPath(), 'utf8')) }; }
  catch (_) { return defaultConfig; }
}
function saveConfig(config) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2));
}

function virtualDesktopBounds() {
  const displays = screen.getAllDisplays();
  const left = Math.min(...displays.map(display => display.bounds.x));
  const top = Math.min(...displays.map(display => display.bounds.y));
  const right = Math.max(...displays.map(display => display.bounds.x + display.bounds.width));
  const bottom = Math.max(...displays.map(display => display.bounds.y + display.bounds.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

function createOverlay() {
  const { x, y, width, height } = virtualDesktopBounds();
  overlayWindow = new BrowserWindow({
    x, y, width, height, frame: false, transparent: true, resizable: false,
    movable: false, focusable: false, skipTaskbar: true, hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  overlayWindow.setAlwaysOnTop(true, 'floating');
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  overlayWindow.loadFile(path.join(__dirname, 'renderer', 'overlay.html'));
  overlayWindow.on('closed', () => { overlayWindow = null; });
}

function resizeOverlay() {
  if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.setBounds(virtualDesktopBounds());
}

function showSettings() {
  if (!settingsWindow) createSettings();
  settingsWindow.show();
  settingsWindow.focus();
  overlayWindow?.webContents.send('overlay-hide', 'settings');
}

function createSettings() {
  settingsWindow = new BrowserWindow({
    width: 1060, height: 780, minWidth: 850, minHeight: 650,
    title: 'PixPop 智能解压玩具', backgroundColor: '#0b1020',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  settingsWindow.removeMenu();
  settingsWindow.setMenuBarVisibility(false);
  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; overlayWindow?.webContents.send('overlay-show'); });
}

function startKeyboardWatcher() {
  try {
    // Optional native hook: when installed it catches keys typed in any Windows app.
    keyboardHook = require('uiohook-napi');
    keyboardHook.uIOhook.on('keydown', () => overlayWindow?.webContents.send('keyboard-activity'));
    keyboardHook.uIOhook.start();
  } catch (_) {
    console.warn('Global keyboard hook unavailable; settings-window input still works.');
  }
}

ipcMain.handle('config-load', () => readConfig());
ipcMain.handle('config-save', (_event, config) => { saveConfig(config); return config; });
ipcMain.on('settings-open', showSettings);
ipcMain.on('settings-close', () => { settingsWindow?.hide(); overlayWindow?.webContents.send('overlay-show'); });
ipcMain.on('app-quit', () => { quitting = true; app.quit(); });
ipcMain.on('joystick-event', (_event, data) => overlayWindow?.webContents.send('joystick-event', data));
ipcMain.on('overlay-command', (_event, command) => overlayWindow?.webContents.send('overlay-command', command));
ipcMain.on('overlay-mouse-events', (_event, interactive) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(!interactive, { forward: true });
  }
});

app.whenReady().then(() => {
  // Web Serial in Electron requires the main process to approve a selected device.
  session.defaultSession.on('select-serial-port', (event, portList, _webContents, callback) => {
    event.preventDefault();
    if (portList.length) callback(portList[0].portId);
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => permission === 'serial');
  session.defaultSession.setDevicePermissionHandler(({ deviceType }) => deviceType === 'serial');
  createOverlay();
  createSettings();
  settingsWindow.hide();
  const icon = nativeImage.createFromPath(path.join(__dirname, 'smallicon.png'));
  tray = new Tray(icon);
  tray.setToolTip('PixPop 智能解压玩具');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开设置', click: showSettings },
    { label: '显示玩具', click: () => overlayWindow?.webContents.send('overlay-show') },
    { label: '隐藏玩具', click: () => overlayWindow?.webContents.send('overlay-hide', 'manual') },
    { type: 'separator' },
    { label: '退出', click: () => { quitting = true; app.quit(); } }
  ]));
  tray.on('click', showSettings);
  startKeyboardWatcher();
  screen.on('display-added', resizeOverlay);
  screen.on('display-removed', resizeOverlay);
  screen.on('display-metrics-changed', resizeOverlay);
});

app.on('second-instance', () => showSettings());

app.on('before-quit', () => {
  quitting = true;
  try { keyboardHook?.uIOhook.stop(); } catch (_) {}
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin' && quitting) app.quit(); });
