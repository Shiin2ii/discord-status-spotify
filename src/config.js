import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(
  process.env.APPDATA || join(homedir(), '.config'),
  'discord-lyrics-status'
);
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

let _cache = null;

function read() {
  if (_cache) return _cache;
  try {
    if (existsSync(CONFIG_FILE)) {
      _cache = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
      return _cache;
    }
  } catch {}
  return {};
}

/**
 * Returns the Discord user token.
 * Priority: env var → AppData config.
 */
export function getToken() {
  if (process.env.DISCORD_USER_TOKEN) return process.env.DISCORD_USER_TOKEN;
  return read().userToken || null;
}

/**
 * Persist a new token to AppData.
 */
export function saveToken(token) {
  _cache = null;
  mkdirSync(CONFIG_DIR, { recursive: true });
  const updated = { ...read(), userToken: token };
  _cache = updated;
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`[Config] Token saved to ${CONFIG_FILE}`);
}
