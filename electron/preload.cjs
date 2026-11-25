const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tempoDesktop', {
  isDesktop: true,
  openWidget: () => ipcRenderer.invoke('widget:open'),
  closeWidget: () => ipcRenderer.invoke('widget:close'),
  isWidgetOpen: () => ipcRenderer.invoke('widget:is-open'),
  focusMain: () => ipcRenderer.invoke('main:focus'),
  onWidgetStateChange: (callback) => {
    const listener = (_event, isOpen) => callback(isOpen);
    ipcRenderer.on('widget:state', listener);
    return () => ipcRenderer.removeListener('widget:state', listener);
  },
});
