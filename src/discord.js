import 'dotenv/config';
import DiscordRPC from 'discord-rpc';

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const RETRY_INTERVAL_MS = 10_000;
const MAX_STATE_LENGTH = 128;

DiscordRPC.register(CLIENT_ID);

const client = new DiscordRPC.Client({ transport: 'ipc' });
let isConnected = false;
let isConnecting = false;

// ── Connection management ─────────────────────────────────────────────────────

async function connect() {
  if (isConnected || isConnecting) return;
  isConnecting = true;
  try {
    await client.login({ clientId: CLIENT_ID });
    isConnected = true;
    isConnecting = false;
    console.log('[Discord] Connected to Discord RPC.');
  } catch (err) {
    isConnecting = false;
    console.warn(`[Discord] Could not connect to Discord: ${err.message}`);
    console.warn(`[Discord] Retrying in ${RETRY_INTERVAL_MS / 1000}s…`);
    setTimeout(connect, RETRY_INTERVAL_MS);
  }
}

client.on('ready', () => {
  isConnected = true;
  console.log('[Discord] RPC ready.');
});

client.on('disconnected', () => {
  isConnected = false;
  console.warn('[Discord] Disconnected. Retrying…');
  setTimeout(connect, RETRY_INTERVAL_MS);
});

// Start the connection immediately
connect();

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(text, maxLen = MAX_STATE_LENGTH) {
  if (!text) return '';
  return text.length > maxLen - 3 ? text.slice(0, maxLen - 3) + '…' : text;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Update Discord Rich Presence activity.
 *
 * @param {{
 *   details: string,
 *   state: string,
 *   startTimestamp: number,
 *   largeImageKey: string,
 *   largeImageText: string,
 * }} data
 */
export async function updateActivity(data) {
  if (!isConnected) {
    console.warn('[Discord] Not connected — skipping activity update.');
    return;
  }
  try {
    await client.setActivity({
      details: truncate(data.details, 128),
      state: truncate(data.state, 128),
      startTimestamp: data.startTimestamp,
      largeImageKey: data.largeImageKey || 'spotify',
      largeImageText: truncate(data.largeImageText, 128),
      smallImageKey: 'play',
      smallImageText: 'Now playing',
      instance: false,
    });
  } catch (err) {
    console.error('[Discord] setActivity error:', err.message);
  }
}

/**
 * Clear Discord Rich Presence activity (e.g. when Spotify is paused).
 */
export async function clearActivity() {
  if (!isConnected) return;
  try {
    await client.clearActivity();
  } catch (err) {
    console.error('[Discord] clearActivity error:', err.message);
  }
}

export function isDiscordConnected() {
  return isConnected;
}
