import type {
  SessionRecord,
  SoundPresetRecord,
  TaskItem,
  TimerPreferences,
} from '../core/types';

export interface BootstrapPayload {
  sessions: SessionRecord[];
  tasks: TaskItem[];
  preferences: Partial<TimerPreferences> | null;
  soundPresets: SoundPresetRecord[];
}

const API_BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'http://localhost:5002/api'
    : '/api';

async function safeFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const apiClient = {
  bootstrap: () => safeFetch<BootstrapPayload>('/bootstrap'),

  saveSession: (session: SessionRecord) =>
    safeFetch<SessionRecord>('/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    }),

  clearSessions: () =>
    safeFetch<{ ok: boolean }>('/sessions', { method: 'DELETE' }),

  saveTask: (task: TaskItem) =>
    safeFetch<TaskItem>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  updateTask: (id: string, patch: Partial<TaskItem>) =>
    safeFetch<TaskItem>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteTask: (id: string) =>
    safeFetch<{ ok: boolean }>(`/tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  savePreferences: (prefs: TimerPreferences) =>
    safeFetch<TimerPreferences>('/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs),
    }),

  saveSoundPreset: (preset: SoundPresetRecord) =>
    safeFetch<SoundPresetRecord>('/presets', {
      method: 'POST',
      body: JSON.stringify(preset),
    }),

  deleteSoundPreset: (id: string) =>
    safeFetch<{ ok: boolean }>(`/presets/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
