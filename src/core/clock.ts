/**
 * Drift-free timer computation utilities.
 * Uses wall-clock timestamps instead of counting ticks so background tab
 * throttling in browsers never causes the timer to lag behind real time.
 */

export interface ClockSnapshot {
  elapsedMs: number;
  remainingMs: number;
  progress: number; // 0 to 1
  isFinished: boolean;
}

/**
 * Computes current elapsed and remaining time given accumulated ms and last resume timestamp.
 */
export function computeClockSnapshot(params: {
  plannedSeconds: number; // 0 means open-ended flow/stopwatch
  accumulatedMs: number;
  lastResumedAt: number | null;
  now?: number;
}): ClockSnapshot {
  const now = params.now ?? Date.now();
  const activeDelta =
    params.lastResumedAt !== null ? Math.max(0, now - params.lastResumedAt) : 0;
  const rawElapsedMs = params.accumulatedMs + activeDelta;

  if (params.plannedSeconds <= 0) {
    return {
      elapsedMs: rawElapsedMs,
      remainingMs: 0,
      progress: 0,
      isFinished: false,
    };
  }

  const plannedMs = params.plannedSeconds * 1000;
  const clampedElapsedMs = Math.min(rawElapsedMs, plannedMs);
  const remainingMs = Math.max(0, plannedMs - rawElapsedMs);

  return {
    elapsedMs: clampedElapsedMs,
    remainingMs,
    progress: plannedMs > 0 ? clampedElapsedMs / plannedMs : 0,
    isFinished: rawElapsedMs >= plannedMs,
  };
}

/**
 * Formats milliseconds as MM:SS (or HH:MM:SS if >= 1 hour).
 */
export function formatDurationMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats elapsed stopwatch milliseconds (floor instead of ceil so 0ms starts at 00:00).
 */
export function formatStopwatchMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Parses user-typed duration strings like "25", "1.5", "12:30", "1:05:00",
 * "45s", "1m 30s", or "10 วิ" into total seconds (clamped between 1s and 180m).
 * Returns null if invalid.
 */
export function parseDurationInput(raw: string): number | null {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;

  const maxSeconds = 180 * 60;

  // Support unit-based formats: "10s", "0m 4s", "1m 30s", "1h 5m 10s", "10 วิ", "10 วินาที", "5 นาที"
  const unitRegex =
    /^(?:(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours|ชม\.?|ชั่วโมง))?\s*(?:(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes|น\.?|นาที))?\s*(?:(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds|วิ|วินาที))?$/;
  const hasUnit = /[hms]|วิ|นาที|ชั่วโมง|ชม/.test(trimmed);
  if (hasUnit) {
    const match = trimmed.match(unitRegex);
    if (!match) return null;
    const h = match[1] ? Number(match[1]) : 0;
    const m = match[2] ? Number(match[2]) : 0;
    const s = match[3] ? Number(match[3]) : 0;
    if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) {
      return null;
    }
    const totalSeconds = Math.round(h * 3600 + m * 60 + s);
    if (totalSeconds <= 0) return null;
    return Math.min(maxSeconds, totalSeconds);
  }

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => Number(p));
    if (parts.some((n) => !Number.isFinite(n) || n < 0)) return null;

    let totalSeconds = 0;
    if (parts.length === 2) {
      const [m = 0, s = 0] = parts;
      if (s >= 60) return null;
      totalSeconds = Math.round(m * 60 + s);
    } else if (parts.length === 3) {
      const [h = 0, m = 0, s = 0] = parts;
      if (m >= 60 || s >= 60) return null;
      totalSeconds = Math.round(h * 3600 + m * 60 + s);
    } else {
      return null;
    }

    if (totalSeconds <= 0) return null;
    return Math.min(maxSeconds, totalSeconds);
  }

  // Treat "M.SS" with 2 digits after dot (e.g. "0.15", "0.61", "1.15") as M minutes + SS seconds
  const dotMinSec = trimmed.match(/^(\d+)\.(\d{2})$/);
  if (dotMinSec) {
    const mins = Number(dotMinSec[1]);
    const secs = Number(dotMinSec[2]);
    const totalSeconds = mins * 60 + secs;
    if (totalSeconds > 0) {
      return Math.min(maxSeconds, totalSeconds);
    }
  }

  const minutes = Number(trimmed);
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  const totalSeconds = Math.round(minutes * 60);
  return Math.max(1, Math.min(maxSeconds, totalSeconds));
}
