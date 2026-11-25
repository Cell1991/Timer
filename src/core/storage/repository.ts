import type { SessionRecord, TaskItem, TimerPreferences } from '../types';

export interface TimerRepository {
  getSessions(): SessionRecord[];
  saveSession(session: SessionRecord): void;
  clearSessions(): void;

  getTasks(): TaskItem[];
  saveTasks(tasks: TaskItem[]): void;

  getPreferences(): TimerPreferences;
  savePreferences(prefs: TimerPreferences): void;
}

const KEYS = {
  SESSIONS: 'tempo.v1.sessions',
  TASKS: 'tempo.v1.tasks',
  PREFS: 'tempo.v1.preferences',
} as const;

export const DEFAULT_PREFERENCES: TimerPreferences = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  autoPopupOnStart: false,
  adaptiveSoundEnabled: true,
  ambientPreset: 'off',
  ambientVolume: 0.65,
  ambientMix: {},
  ambientMuted: false,
  soundCueEnabled: true,
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWriteJson<T>(key: string, value: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export class LocalStorageRepository implements TimerRepository {
  getSessions(): SessionRecord[] {
    return safeReadJson<SessionRecord[]>(KEYS.SESSIONS, []);
  }

  saveSession(session: SessionRecord): void {
    const existing = this.getSessions();
    const next = [session, ...existing].slice(0, 500);
    safeWriteJson(KEYS.SESSIONS, next);
  }

  clearSessions(): void {
    safeWriteJson(KEYS.SESSIONS, []);
  }

  getTasks(): TaskItem[] {
    return safeReadJson<TaskItem[]>(KEYS.TASKS, []);
  }

  saveTasks(tasks: TaskItem[]): void {
    safeWriteJson(KEYS.TASKS, tasks);
  }

  getPreferences(): TimerPreferences {
    const saved = safeReadJson<Partial<TimerPreferences>>(KEYS.PREFS, {});
    return { ...DEFAULT_PREFERENCES, ...saved };
  }

  savePreferences(prefs: TimerPreferences): void {
    safeWriteJson(KEYS.PREFS, prefs);
  }
}

export const repository: TimerRepository = new LocalStorageRepository();
