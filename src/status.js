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
        console.error('[Status] 401 Unauthorized — token không hợp lệ hoặc đã hết hạn.');
        queue.length = 0; // drain queue
        lastText = null;
        clearToken();
        processing = false;
        _onUnauthorized?.();
        return;
      }

      if (!res.ok) {
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
