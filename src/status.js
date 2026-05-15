import { getToken, clearToken } from './config.js';

const API = 'https://discord.com/api/v9/users/@me/settings';

let lastText = null;
let _onUnauthorized = null;

/** Register a callback to be called when Discord returns 401. */
export function onUnauthorized(cb) {
  _onUnauthorized = cb;
}

// ── Queue ─────────────────────────────────────────────────────────────────────
// Each entry: { body, label }
// Worker sends one at a time; on 429 it waits then retries the SAME entry.
// New entries always go to the back — no lyrics are ever dropped.

const queue = [];
let processing = false;

const SUPER_PROPERTIES = Buffer.from(JSON.stringify({
  os: 'Windows',
  browser: 'Chrome',
  device: '',
  system_locale: 'en-US',
  browser_user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  browser_version: '124.0.0.0',
  os_version: '10',
  referrer: '',
  referring_domain: '',
  referrer_current: '',
  referring_domain_current: '',
  release_channel: 'stable',
  client_build_number: 9999,
  client_event_source: null,
})).toString('base64');

async function processQueue() {
  if (processing) return;
  processing = true;

  while (queue.length > 0) {
    const entry = queue[0];
    try {
      const res = await fetch(API, {
        method: 'PATCH',
        headers: {
          Authorization: entry.token,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'X-Super-Properties': SUPER_PROPERTIES,
          'X-Discord-Locale': 'en-US',
          'Origin': 'https://discord.com',
          'Referer': 'https://discord.com/channels/@me',
        },
        body: JSON.stringify(entry.body),
      });

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const wait = Math.ceil((data.retry_after ?? 1) * 1000);
        console.warn(`[Status] Rate limited — waiting ${wait}ms then retrying…`);
        await new Promise((r) => setTimeout(r, wait));
        continue; // retry same entry
      }

      if (res.status === 401) {
        // Verify if the token itself is actually invalid before clearing it.
        // The PATCH settings endpoint can return 401 for reasons unrelated to
        // the token (e.g. missing headers), so we check against /users/@me first.
        const check = await fetch('https://discord.com/api/v9/users/@me', {
          headers: { Authorization: entry.token },
        }).catch(() => null);

        if (check?.status === 401) {
          // Token is genuinely expired/invalid
          console.error('[Status] Token hết hạn. Mở lại trang thiết lập…');
          queue.length = 0;
          lastText = null;
          clearToken();
          processing = false;
          _onUnauthorized?.();
          return;
        }

        // Token is fine — PATCH failed for another reason, just skip this entry
        console.warn('[Status] PATCH settings bị từ chối (401) nhưng token vẫn hợp lệ — bỏ qua.');
      } else if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`[Status] PATCH ${res.status}: ${text}`);
      } else {
        console.log(`[Status] ✓ "${entry.label}"`);
      }
    } catch (err) {
      console.error('[Status] Fetch error:', err.message);
    }

    queue.shift(); // done with this entry
  }

  processing = false;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function setCustomStatus(text, emoji = 'musical_note') {
  const token = getToken();
  if (!token) return;
  if (text === lastText) return; // exact duplicate — skip

  lastText = text;
  queue.push({
    token,
    body: { custom_status: { text: text.slice(0, 128), emoji_name: emoji, expires_at: null } },
    label: text,
  });
  processQueue();
}

export function clearCustomStatus() {
  const token = getToken();
  if (!token) return;
  if (lastText === null) return;

  lastText = null;
  queue.push({ token, body: { custom_status: null }, label: '(clear)' });
  processQueue();
}

export function isStatusEnabled() {
  return !!getToken();
}
