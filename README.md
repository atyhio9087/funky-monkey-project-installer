# Funky Monkey Visualizer (Desktop)

A desktop build of the [Funky Monkey Visualizer](../Visualizer) — the
browser-based audio visualizer — packaged as a native app for Windows,
macOS, and Linux via [Electron](https://www.electronjs.org/).

This is a separate project from the web app's repo by design: the app code
lives under `app/` (a snapshot of the web version, including its bundled
sample tracks), and everything else here (`main.js`, `preload.js`,
`package.json`, `build/`) is desktop-packaging scaffolding that doesn't
belong in the web repo.

Supports everything the web version does, running fully offline except for
one explicit, user-initiated exception:
- Local file drag-and-drop / file picker
- The built-in sample tracks
- Live microphone visualization
- Loading tracks from a public Google Drive folder link (talks directly to
  Google's servers — see [PRIVACY.md](PRIVACY.md))

## Run it locally

```bash
npm install
npm start
```

## Build an installer

Electron can only produce a real, correctly-signed installer for the OS
you're building *on* — you can't build a `.dmg` from Windows, for instance.
Build on each target platform, or use the included GitHub Actions workflow
(`.github/workflows/build.yml`, run manually from the Actions tab or by
pushing a `vX.Y.Z` tag) to build all three in CI and download them as
artifacts.

```bash
npm run dist:win      # Windows: NSIS installer (.exe)
npm run dist:mac      # macOS: .dmg (must run on macOS)
npm run dist:linux    # Linux: AppImage + .deb
npm run dist:all      # all three (only works if the current OS supports it)
```

Installers land in `dist/`.

### Windows
Produces an NSIS installer with a license/privacy acceptance screen
(`build/license-installer.txt`), a Start Menu entry, and an optional desktop
shortcut. Not code-signed — Windows SmartScreen will show an "unknown
publisher" warning on first run unless you have a code-signing certificate
to add via `win.certificateFile`/`certificatePassword` in `package.json`.

### macOS
Produces an unsigned `.dmg` (`mac.identity: null` — there's no Apple
Developer certificate configured, and `hardenedRuntime` needs one to apply,
so it's left off). The microphone usage description is still set
(`NSMicrophoneUsageDescription`) so Live mode's mic permission prompt shows
correctly. Without code signing or notarization, Gatekeeper will block it on
first launch; users can right-click → Open to bypass, or you can add a
Developer ID certificate plus notarization credentials
(`APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD`/`APPLE_TEAM_ID`) to CI/your
environment and extend the `mac` build config to notarize.

### Linux
Produces an `AppImage` (portable, no install needed) and a `.deb`.

## First-run consent screen

On first launch, the app shows a short in-app notice (not just an installer
checkbox, since macOS `.dmg` / Linux `AppImage` don't gate installation the
way Windows' NSIS installer does) covering: no telemetry, on-device-only
audio analysis, microphone use in Live mode, and that the Google Drive
feature talks directly to Google. It links out to the full
[Privacy Policy](PRIVACY.md), [Terms of Use](TERMS.md), and
[License](LICENSE), and only needs to be accepted once (stored in the app's
local storage).

## Security notes

- `nodeIntegration` is off and `contextIsolation`/`sandbox` are on — the
  renderer runs like a normal, unprivileged web page. The only bridge
  exposed via `preload.js` is `window.appLegal.open(name)`, restricted to a
  fixed whitelist of the three bundled legal documents (see `main.js`).
- Electron denies all permission requests by default once packaged; `main.js`
  explicitly allows only `media` (microphone), needed for Live mode.
- A `Content-Security-Policy` is set in `app/index.html` restricting network
  access to same-origin plus `https://www.googleapis.com` (Drive) and
  Google Fonts.

## Updating the app code

`app/index.html` is a snapshot, not a symlink — if the web version at
[../Visualizer](../Visualizer) changes, re-copy it here and re-apply this
project's additions (the consent screen markup/CSS/script near the top of
`<body>`, and the CSP `<meta>` tag in `<head>`) before rebuilding.
