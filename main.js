const { app, BrowserWindow, session, shell, Menu, ipcMain } = require('electron');
const path = require('path');

// Fixed whitelist — the renderer can only ever ask to open exactly one of
// these three bundled documents, never an arbitrary path.
const LEGAL_DOCS = {
  license: 'LICENSE',
  privacy: 'PRIVACY.md',
  terms: 'TERMS.md'
};

function installLegalDocHandler() {
  ipcMain.handle('open-legal-doc', (event, name) => {
    const filename = LEGAL_DOCS[name];
    if (!filename) return { ok: false, error: 'Unknown document' };
    const fullPath = path.join(app.getAppPath(), filename);
    shell.openPath(fullPath);
    return { ok: true };
  });
}

// The bundled Google API key is restricted (in Google Cloud Console) to only
// accept requests carrying a specific site's Referer header — that's the
// key's actual security boundary, since it's otherwise public in the app's
// source. That works fine for the web version, but a desktop app's file://
// pages send no Referer at all, and Google rejects those outright ("Requests
// from referer <empty> are blocked"). A renderer can't fix this itself —
// Referer is a forbidden header that fetch()/XHR are not allowed to set —
// but Electron's network layer can inject it before the request leaves.
const GOOGLE_API_REFERRER = 'https://visualizer-ten-drab.vercel.app/';
function installGoogleDriveRefererFix() {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://www.googleapis.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = GOOGLE_API_REFERRER;
      callback({ requestHeaders: details.requestHeaders });
    }
  );
}

// Electron denies every permission request (mic, etc.) by default once an
// app is packaged. Live mode needs the microphone, so explicitly allow only
// that — everything else (camera, geolocation, notifications, ...) stays
// denied since this app has no use for it.
function installPermissionHandler() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(permission === 'media');
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => permission === 'media');
}

// Anything the app opens that isn't itself (e.g. a "learn more" link put in
// a future About dialog) should open in the user's real browser, not a
// second app window.
function interceptExternalLinks(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: '#000000',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  });

  interceptExternalLinks(win);
  win.loadFile(path.join(__dirname, 'app', 'index.html'));
  return win;
}

app.whenReady().then(() => {
  installGoogleDriveRefererFix();
  installPermissionHandler();
  installLegalDocHandler();
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
