const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  fullscreen: () => ipcRenderer.invoke('window-fullscreen'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowState: (cb) => ipcRenderer.on('window-state', (e, s) => cb(s)),
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadData: (data) => ipcRenderer.invoke('load-data', data),
  fetchUrl: (url) => ipcRenderer.invoke('fetch-url', url)
});
