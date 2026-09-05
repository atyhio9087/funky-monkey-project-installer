const { app, BrowserWindow, session, shell, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Fixed whitelist — the renderer can only ever ask to read exactly one of
// these three bundled documents, never an arbitrary path.
const LEGAL_DOCS = {
  license: 'LICENSE',
  privacy: 'PRIVACY.md',
  terms: 'TERMS.md'
};

function installLegalDocHandler() {
  // Read the raw text back to the renderer so it can be shown in an in-app
  // viewer, instead of shell.openPath() handing it to whatever external app
  // (Notepad, TextEdit, ...) the OS associates with that file type.
  ipcMain.handle('read-legal-doc', (event, name) => {
    const filename = LEGAL_DOCS[name];
    if (!filename) return { ok: false, error: 'Unknown document' };
    try {
      const fullPath = path.join(app.getAppPath(), filename);
      const content = fs.readFileSync(fullPath, 'utf8');
      return { ok: true, content };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

// Whether the user has accepted the first-run consent screen — kept as a
// small marker file in the app's own userData directory (not localStorage)
// so it's unambiguously a single persistent value the main process owns,
// survives the renderer being reloaded, and isn't affected by anything that
// might clear site data.
const CONSENT_FLAG_PATH = () => path.join(app.getPath('userData'), 'consent-accepted.json');

function installConsentHandlers() {
  ipcMain.handle('get-consent-accepted', () => {
    try {
      const data = JSON.parse(fs.readFileSync(CONSENT_FLAG_PATH(), 'utf8'));
      return data.accepted === true;
    } catch {
      return false;
    }
  });
  ipcMain.handle('set-consent-accepted', () => {
    try {
      fs.writeFileSync(CONSENT_FLAG_PATH(), JSON.stringify({ accepted: true, at: new Date().toISOString() }));
      return true;
    } catch {
      return false;
    }
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
// app is packaged. Live mode needs the microphone, and the fullscreen
// button needs the (separate, easy to overlook) "fullscreen" permission —
// Chromium routes the HTML5 Fullscreen API through the same permission
// system, and without this the app's own requestFullscreen() call silently
// rejects with "Permissions check failed". Everything else (camera,
// geolocation, notifications, ...) stays denied since this app has no use
// for it.
const ALLOWED_PERMISSIONS = new Set(['media', 'fullscreen']);
function installPermissionHandler() {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });
  session.defaultSession.setPermissionCheckHandler((webContents, permission) => ALLOWED_PERMISSIONS.has(permission));
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
  installConsentHandlers();
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
