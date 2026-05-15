<div align="center">

# 🎵 Discord Lyrics Status

**Real-time Spotify lyrics displayed as your Discord custom status.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)]()

**Language:** English · [Tiếng Việt](README.vi.md)

[Download](#-download) · [How it works](#-how-it-works) · [Run from source](#-run-from-source) · [Build](#-build-exe)

</div>

---

## Overview

Discord Lyrics Status reads the currently playing track from Spotify via Windows System Media Transport Controls (SMTC), fetches synced lyrics from [LRCLIB](https://lrclib.net), and updates your Discord custom status line by line — in perfect sync with the music.

No Spotify API key. No Spotify Premium. No setup beyond a single Discord token.

---

## ✨ Features

- **Real-time lyrics** — each line fires at the exact timestamp from the LRC file
- **Zero config** — first launch opens a browser setup page to enter your token
- **No dropped lines** — a sequential queue retries on rate limits instead of skipping
- **No dependencies to install** — distributed as a single standalone `.exe`
- **Free lyrics source** — [LRCLIB](https://lrclib.net), no API key required
- **No Spotify API** — reads playback via Windows SMTC, works with free accounts

---

## 📥 Download

Go to the [**Releases**](../../releases) page and download `discord-lyrics-status.exe`.

> Requires Windows 10 or 11. No additional software needed.

---

## 🚀 Quick Start

1. **Download** `discord-lyrics-status.exe` from [Releases](../../releases)
2. **Run** the `.exe` — a browser window will open automatically on first launch
3. **Enter your Discord User Token** and click *Save & Start*
4. **Play music** on Spotify — lyrics will appear on your Discord status in real time

Your token is stored locally at `%APPDATA%\discord-lyrics-status\config.json` and never sent anywhere other than Discord's own API.

---

## 🔑 Getting Your Discord User Token

> **Warning:** Your user token grants full access to your Discord account. Never share it with anyone.

1. Open [discord.com/app](https://discord.com/app) in a **browser** (not the desktop app)
2. Press `F12` to open DevTools → go to the **Network** tab
3. Perform any action (switch a server, send a message, etc.)
4. Click on any request → **Request Headers** → find the `Authorization` header
5. Copy its value — that is your user token

---

## ⚙️ How It Works

```
Spotify (desktop)
      │
      ▼
Windows SMTC          ← reads track title, artist, playback position
      │
      ▼
LRCLIB API            ← fetches synced LRC lyrics (free, no key)
      │
      ▼
LyricScheduler        ← fires each line at the correct timestamp via setTimeout
      │
      ▼
Discord PATCH API     ← updates custom status, queued & retried on rate limit
```

---

## 🛠️ Run from Source

**Requirements:** Node.js 18+, Windows 10/11, Spotify desktop app

```bash
git clone https://github.com/Shiin2ii/discord-status-spotify.git
cd discord-status-spotify
npm install
npm start
```

Alternatively, create a `.env` file to skip the browser setup:

```env
DISCORD_USER_TOKEN=your_discord_user_token_here
```

---

## 📦 Build `.exe`

Produces a standalone executable with Node.js bundled inside — no runtime required on target machines.

```bash
npm install
npm run build
# Output: dist/discord-lyrics-status.exe
```

---

## 🗂️ Project Structure

```
src/
├── index.js       — main loop, poll & orchestration
├── spotify.js     — reads playback from Windows SMTC via PowerShell
├── lyrics.js      — fetches & caches synced lyrics from LRCLIB
├── scheduler.js   — fires lyric lines at the correct timestamps
├── status.js      — updates Discord custom status (queue + retry)
├── config.js      — reads/writes token from AppData
└── setup.js       — first-run browser setup UI (Express)
build.mjs          — esbuild + pkg build script
```

---

## ❓ FAQ

**Does this work without Spotify Premium?**
Yes. It reads from Windows SMTC, not the Spotify API.

**Will this get my account banned?**
Using a user token is against Discord's ToS. Use at your own risk.

**How do I reset my token?**
Delete `%APPDATA%\discord-lyrics-status\config.json` and relaunch the app.

**Lyrics are not showing / wrong lyrics?**
LRCLIB may not have the track. The status will fall back to showing the track name and artist.

---

## 📄 License

[MIT](LICENSE) © [Shiin2ii](https://github.com/Shiin2ii)

