import 'dotenv/config';
import { getCurrentTrack } from './spotify.js';
import { getLyrics } from './lyrics.js';
import { setCustomStatus, clearCustomStatus, onUnauthorized } from './status.js';
import { LyricScheduler } from './scheduler.js';
import { getToken, clearToken } from './config.js';
import { runSetup } from './setup.js';

const POLL_INTERVAL_MS = 1_000;
const SEEK_THRESHOLD_MS = 3_000;

// ── State ─────────────────────────────────────────────────────────────────────

let currentTrackId = null;
let scheduler = null;
let lastProgressMs = 0;
let lastPollTime = 0;

// ── Lyric change handler ──────────────────────────────────────────────────────

async function onLineChange(line) {
  const rawText = line.text?.trim() || '';
  const text = rawText.length >= 2 ? rawText : (rawText + ' ♪').trim().padEnd(2, '♪');

  console.log(`[Lyric] ${text}`);

  setCustomStatus(text);
}

// ── Poll loop ─────────────────────────────────────────────────────────────────

async function poll() {
  try {
    const track = await getCurrentTrack();

    const now = Date.now();

    // ── Nothing playing ──────────────────────────────────────────────────────
    if (!track || !track.isPlaying) {
      if (currentTrackId !== null) {
        console.log('[Main] Playback stopped or paused. Clearing status.');
        if (scheduler) {
          scheduler.stop();
          scheduler = null;
        }
        currentTrackId = null;
        clearCustomStatus();
      }

      lastPollTime = now;
      return;
    }

    // ── Track changed ────────────────────────────────────────────────────────
    if (track.trackId !== currentTrackId) {
      console.log(`[Main] Track changed → "${track.trackName}" by ${track.artistName}`);

      currentTrackId = track.trackId;

      if (scheduler) {
        scheduler.stop();
        scheduler = null;
      }

      const lyrics = await getLyrics(track.trackId, track.trackName, track.artistName, track.albumName, track.durationMs);

      if (lyrics && lyrics.length > 0) {
        scheduler = new LyricScheduler(lyrics, onLineChange);
        scheduler.start(track.progressMs);
      } else {
        setCustomStatus(`🎵 ${track.trackName} — ${track.artistName}`);
      }
    }

    // ── Seek detection (same track) ──────────────────────────────────────────
    else if (scheduler && lastPollTime > 0) {
      const elapsed = now - lastPollTime;
      const expectedProgress = lastProgressMs + elapsed;
      const drift = Math.abs(track.progressMs - expectedProgress);

      if (drift > SEEK_THRESHOLD_MS) {
        console.log(
          `[Main] Seek detected (drift ${(drift / 1000).toFixed(1)}s). Resyncing scheduler.`
        );
        scheduler.restart(track.progressMs);
      }
    }

    lastProgressMs = track.progressMs;
    lastPollTime = now;
  } catch (err) {
    console.error('[Main] Poll error:', err.message);
    // Never crash — just log and continue
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

let pollInterval = null;

async function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  // Reset track state so next poll re-fetches everything fresh
  currentTrackId = null;
  if (scheduler) { scheduler.stop(); scheduler = null; }
  await poll();
  pollInterval = setInterval(poll, POLL_INTERVAL_MS);
}

async function main() {
  console.log('🎵 Discord Lyrics Status starting…');

  // --reset flag: clear saved token and re-run setup
  if (process.argv.includes('--reset')) {
    console.log('[Setup] --reset: xóa token và mở lại trang thiết lập…');
    clearToken();
  }

  // Register 401 handler — re-run setup then resume
  onUnauthorized(async () => {
    console.log('\n[Setup] Token hết hạn. Mở trình duyệt để nhập token mới…');
    await runSetup();
    console.log('[Setup] ✓ Token mới đã lưu. Tiếp tục theo dõi nhạc.\n');
    await startPolling();
  });

  // First-run: no token configured → open browser setup page
  if (!getToken()) {
    console.log('[Setup] Chưa có token. Đang mở trình duyệt để thiết lập…');
    await runSetup();
    console.log('[Setup] ✓ Thiết lập xong. Bắt đầu theo dõi nhạc.\n');
  } else {
    console.log('   Token: OK  |  Nhấn Ctrl+C để dừng.\n');
  }

  await startPolling();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Main] Shutting down…');
  if (scheduler) scheduler.stop();
  clearCustomStatus();
  process.exit(0);
});

main();
