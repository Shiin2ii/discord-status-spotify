# Contributing to Discord Lyrics Status

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/Shiin2ii/discord-status-spotify.git
cd discord-status-spotify
npm install
```

Create a `.env` file:

```env
DISCORD_USER_TOKEN=your_discord_user_token_here
```

Run in dev mode (auto-restart on file changes):

```bash
npm run dev
```

## Project Structure

```
src/
├── index.js      — main loop, poll & orchestration
├── spotify.js    — reads playback from Windows SMTC via PowerShell
├── lyrics.js     — fetches & caches synced lyrics from LRCLIB
├── scheduler.js  — fires lyric lines at the correct timestamps
├── status.js     — updates Discord custom status (queue + retry)
├── config.js     — reads/writes token from AppData
└── setup.js      — first-run browser setup UI (Express)
```

## Guidelines

- Keep PRs focused — one feature or fix per PR
- Follow the existing code style (ESM, no TypeScript, no bundler for source)
- Test on Windows 10/11 with Spotify desktop running
- Do not commit `.env` or any real tokens

## Reporting Issues

Please include:
- Windows version
- Whether Spotify is playing when the issue occurs
- Console output (run `npm start` and copy the logs)

## Building

```bash
npm run build
# → dist/discord-lyrics-status.exe
```
