/**
 * LyricScheduler — schedules lyric line changes using setTimeout only.
 * Guarantees at most one Discord update per lyric line.
 */
export class LyricScheduler {
  /** @type {Array<{timeMs: number, text: string}>} */
  #lyrics = [];

  /** @type {(line: {timeMs: number, text: string}) => void} */
  #onLineChange;

  /** @type {number[]} */
  #timers = [];

  /** @type {number} The anchor Date.now() when start() was last called */
  #startedAt = 0;

  /** @type {number} The Spotify progressMs at the time start() was called */
  #startProgressMs = 0;

  /**
   * @param {Array<{timeMs: number, text: string}>} lyricsArray
   * @param {(line: {timeMs: number, text: string}) => void} onLineChange
   */
  constructor(lyricsArray, onLineChange) {
    this.#lyrics = lyricsArray;
    this.#onLineChange = onLineChange;
  }

  /**
   * Start scheduling from the given playback position.
   * @param {number} progressMs - Current playback position in ms
   */
  start(progressMs) {
    this.stop(); // clear any existing timers first

    this.#startedAt = Date.now();
    this.#startProgressMs = progressMs;

    let firedImmediate = false;

    // Find the last line that has already passed — fire it immediately
    const passedLines = this.#lyrics.filter((l) => l.timeMs <= progressMs);
    if (passedLines.length > 0) {
      const current = passedLines[passedLines.length - 1];
      // Fire on next tick so callers can set up state first
      const t = setTimeout(() => this.#onLineChange(current), 0);
      this.#timers.push(t);
      firedImmediate = true;
    }

    // Schedule all future lines
    for (const line of this.#lyrics) {
      const delay = line.timeMs - progressMs;
      if (delay <= 0) continue; // already passed

      const t = setTimeout(() => {
        this.#onLineChange(line);
      }, delay);
      this.#timers.push(t);
    }

    if (!firedImmediate && this.#lyrics.length > 0) {
      console.log('[Scheduler] No past lines found — waiting for first lyric line.');
    }
  }

  /**
   * Stop all pending timers.
   */
  stop() {
    for (const t of this.#timers) {
      clearTimeout(t);
    }
    this.#timers = [];
  }

  /**
   * Restart from a new playback position (e.g. after a seek).
   * @param {number} newProgressMs
   */
  restart(newProgressMs) {
    console.log(`[Scheduler] Restarting at ${(newProgressMs / 1000).toFixed(1)}s`);
    this.start(newProgressMs);
  }

  /**
   * Estimate current playback position based on when start() was called.
   * @returns {number}
   */
  get estimatedProgressMs() {
    return this.#startProgressMs + (Date.now() - this.#startedAt);
  }
}
