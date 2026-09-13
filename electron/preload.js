const { contextBridge, ipcRenderer } = require('electron');

// Expose safe desktop system APIs to the React POS renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktopApp: true,
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('app:toggle-maximize'),
  close: () => ipcRenderer.invoke('app:close'),
  printReceipt: (options) => ipcRenderer.invoke('app:print-receipt', options),
  getServerIp: () => ipcRenderer.invoke('app:get-server-ip')
});
