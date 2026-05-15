// LRCLIB — free, no API key, no rate limit sign-up required
// Docs: https://lrclib.net/docs
const BASE_URL = 'https://lrclib.net/api';

/** In-memory cache: trackId → lyricsArray | null */
const cache = new Map();

// ── LRC parser ────────────────────────────────────────────────────────────────

/**
 * Parse an LRC string into an array of { timeMs, text } objects.
 * Supports [mm:ss.xx] and [mm:ss.xxx] formats.
 */
function parseLRC(lrc) {
  const lines = [];
  const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]\s*(.*)$/;

  for (const rawLine of lrc.split('\n')) {
    const match = rawLine.trim().match(regex);
    if (!match) continue;

    const [, mm, ss, cs, text] = match;
    const ms =
      parseInt(mm, 10) * 60_000 +
      parseInt(ss, 10) * 1_000 +
      (cs.length === 3 ? parseInt(cs, 10) : parseInt(cs, 10) * 10);

    lines.push({ timeMs: ms, text: text.trim() });
  }

  return lines.sort((a, b) => a.timeMs - b.timeMs);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch and parse synced lyrics from LRCLIB (free, no key needed).
 * Returns an array of { timeMs, text } or null if not found.
 *
 * @param {string} trackId    Spotify/synthetic track ID (for caching only)
 * @param {string} trackName
 * @param {string} artistName
 * @param {string} albumName
 * @param {number} durationMs
 * @returns {Promise<Array<{timeMs: number, text: string}>|null>}
 */
export async function getLyrics(trackId, trackName, artistName, albumName = '', durationMs = 0) {
  if (cache.has(trackId)) {
    return cache.get(trackId);
  }

  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
    });
    if (albumName) params.set('album_name', albumName);
    if (durationMs > 0) params.set('duration', Math.round(durationMs / 1000).toString());

    const res = await fetch(`${BASE_URL}/get?${params}`);

    if (res.status === 404) {
      console.log(`[Lyrics] Not found on LRCLIB: "${trackName}" by ${artistName}`);
      cache.set(trackId, null);
      return null;
    }

    if (!res.ok) {
      throw new Error(`LRCLIB HTTP ${res.status}`);
    }

    const data = await res.json();

    if (!data?.syncedLyrics) {
      // Fall back to plain lyrics with no timestamps
      console.log(`[Lyrics] No synced lyrics for "${trackName}" — only plain available`);
      cache.set(trackId, null);
      return null;
    }

    const lines = parseLRC(data.syncedLyrics);
    console.log(`[Lyrics] Loaded ${lines.length} synced lines for "${trackName}"`);
    cache.set(trackId, lines);
    return lines;
  } catch (err) {
    console.error(`[Lyrics] Error:`, err.message);
    cache.set(trackId, null);
    return null;
  }
}
