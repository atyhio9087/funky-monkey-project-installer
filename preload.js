const { contextBridge, ipcRenderer } = require('electron');

// The renderer is the same code that runs on the web and only needs
// standard browser APIs (File, fetch, Web Audio, MediaDevices) for
// everything audio/visual-related. The one thing a web page can't do is
// open a local file in the OS's own viewer, which the first-run consent
// screen needs for "view the full Privacy Policy / Terms" — so that's the
// only bridge exposed, and it's restricted to a fixed whitelist on the main
// process side (see main.js), never an arbitrary path.
contextBridge.exposeInMainWorld('appLegal', {
  open: (name) => ipcRenderer.invoke('open-legal-doc', name)
});
