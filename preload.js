const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pixpop', {
  loadConfig: () => ipcRenderer.invoke('config-load'),
  saveConfig: (config) => ipcRenderer.invoke('config-save', config),
  openSettings: () => ipcRenderer.send('settings-open'),
  closeSettings: () => ipcRenderer.send('settings-close'),
  quit: () => ipcRenderer.send('app-quit'),
  sendJoystickEvent: (event) => ipcRenderer.send('joystick-event', event),
  sendOverlayCommand: (command) => ipcRenderer.send('overlay-command', command),
  onJoystickEvent: (callback) => ipcRenderer.on('joystick-event', (_event, data) => callback(data)),
  onOverlayCommand: (callback) => ipcRenderer.on('overlay-command', (_event, data) => callback(data)),
  onKeyboardActivity: (callback) => ipcRenderer.on('keyboard-activity', callback),
  onOverlayHide: (callback) => ipcRenderer.on('overlay-hide', (_event, reason) => callback(reason)),
  onOverlayShow: (callback) => ipcRenderer.on('overlay-show', callback)
});
