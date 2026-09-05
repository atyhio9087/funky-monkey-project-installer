const { contextBridge, ipcRenderer } = require('electron');

// The renderer is the same code that runs on the web and only needs
// standard browser APIs (File, fetch, Web Audio, MediaDevices) for
// everything audio/visual-related. The only things a web page can't do on
// its own are reading a bundled local file to show in the first-run consent
// screen, and persisting "the user already agreed" outside of localStorage —
// both restricted to a fixed set of operations on the main process side
// (see main.js), never an arbitrary path or value.
contextBridge.exposeInMainWorld('appLegal', {
  read: (name) => ipcRenderer.invoke('read-legal-doc', name),
  getConsentAccepted: () => ipcRenderer.invoke('get-consent-accepted'),
  setConsentAccepted: () => ipcRenderer.invoke('set-consent-accepted')
});
