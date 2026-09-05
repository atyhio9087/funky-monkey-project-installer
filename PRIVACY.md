# Privacy Policy

**Last updated: 2026-09-05**

Funky Monkey Visualizer is a local desktop application. This policy explains,
plainly, what the app does and does not do with your data.

## Summary

- The app does not collect, transmit, or store any analytics, telemetry, or
  usage data.
- The app does not have a backend server. There is no account, no sign-in,
  and nothing is uploaded to us — because there is no "us" the app talks to.
- All audio analysis (the "vibe" detection that picks the visual palette)
  runs entirely on your device, on audio you already have loaded. It never
  leaves your machine.

## What the app touches, and why

**Local audio files.** When you drop a file or pick one from disk, it is read
into memory to be played and analyzed (frequency content, loudness, etc.) for
the visualizer. It is not written anywhere else, copied, or transmitted.

**Microphone (Live mode only).** If you choose "Use microphone," the app
requests microphone access from your OS to drive the visuals from live sound
in the room. That audio is processed in memory, in real time, purely to
generate the visualization — it is never recorded to disk, retained after the
session ends, or sent anywhere, including to us. If you don't use Live mode,
the microphone is never accessed.

**Google Drive.** The "Google Drive" option lets you load audio from a
publicly shared Google Drive folder link. When you use this feature, your
device talks directly to Google's servers (`googleapis.com`) to list and
download the files you select, using a public API key bundled with the app.
This traffic goes straight from your machine to Google — it does not pass
through us, and we never see which files, folders, or links you use. That
exchange is governed by
[Google's own Privacy Policy](https://policies.google.com/privacy), not this
one. Only use folder links you have the right to access.

**Crash logs / OS diagnostics.** The app itself doesn't generate crash
reports. Your operating system may independently collect diagnostic data
about any app you run (e.g. Windows Error Reporting, macOS diagnostics) —
that is controlled by your OS settings, not by this app.

## Data retention

There is nothing to retain. The app keeps a small in-memory cache (cleared
when you close the app) of the vibe it detected for a filename during your
session, purely so replaying the same track doesn't need to re-analyze it.
Nothing is written to disk beyond your OS's normal application-settings
storage (e.g. remembered window size, if any).

## Changes to this policy

If this app starts doing anything materially different with data in a future
version, this file will be updated and the version history will say so.

## Contact

This is an independent, personal project. Questions can be raised via the
project's repository issue tracker.
