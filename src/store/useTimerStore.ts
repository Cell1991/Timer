import { create } from 'zustand';
import { computeClockSnapshot } from '../core/clock';
import { eventBus } from '../core/eventBus';
import {
  DEFAULT_PREFERENCES,
  repository,
} from '../core/storage/repository';
import type { AmbientSoundId } from '../core/ambientCatalog';
import { AMBIENT_SOUND_MAP } from '../core/ambientCatalog';
import type {
  AmbientMix,
  AmbientPreset,
  InterruptionReason,
  InterruptionEvent,
  LapRecord,
  SessionRecord,
  SoundPresetRecord,
  TaskItem,
  TimerMode,
  TimerPreferences,
  TimerStatus,
} from '../core/types';
import { apiClient } from '../services/apiClient';
import { soundEngine } from '../services/soundEngine';

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getPlannedSecondsForMode(
  mode: TimerMode,
  prefs: TimerPreferences,
): number {
  switch (mode) {
    case 'focus':
    case 'pomodoro':
      return prefs.focusMinutes * 60;
    case 'short_break':
      return prefs.shortBreakMinutes * 60;
    case 'long_break':
      return prefs.longBreakMinutes * 60;
    case 'interval':
      return 45; // default 45s work sprint
    case 'sleep':
      return 30 * 60; // default 30m sleep timer
    case 'flow':
      return 0; // open-ended stopwatch
  }
}

export interface ModeTimerState {
  status: TimerStatus;
  plannedSeconds: number;
  accumulatedMs: number;
  lastResumedAt: number | null;
  activeSessionId: string | null;
  sessionStartedAt: number | null;
  interruptions: InterruptionEvent[];
}

function createInitialModeState(
  mode: TimerMode,
  prefs: TimerPreferences,
): ModeTimerState {
  return {
    status: 'idle',
    plannedSeconds: getPlannedSecondsForMode(mode, prefs),
    accumulatedMs: 0,
    lastResumedAt: null,
    activeSessionId: null,
    sessionStartedAt: null,
    interruptions: [],
  };
}

function createAllModeStates(
  prefs: TimerPreferences,
): Record<TimerMode, ModeTimerState> {
  return {
    focus: createInitialModeState('focus', prefs),
    short_break: createInitialModeState('short_break', prefs),
    long_break: createInitialModeState('long_break', prefs),
    flow: createInitialModeState('flow', prefs),
    pomodoro: createInitialModeState('pomodoro', prefs),
    interval: createInitialModeState('interval', prefs),
    sleep: createInitialModeState('sleep', prefs),
  };
}

function getPrimaryAmbientFromMix(mix: AmbientMix): AmbientPreset {
  const first = Object.entries(mix).find(([, vol]) => (vol ?? 0) > 0);
  return first ? (first[0] as AmbientPreset) : 'off';
}

interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  plannedSeconds: number;
  accumulatedMs: number;
  lastResumedAt: number | null;

  activeSessionId: string | null;
  sessionStartedAt: number | null;
  activeTaskId: string | null;
  activeTaskTitle: string;
  interruptions: InterruptionEvent[];
  modeStates: Record<TimerMode, ModeTimerState>;

  tasks: TaskItem[];
  sessions: SessionRecord[];
  preferences: TimerPreferences;
  soundPresets: SoundPresetRecord[];
  dbConnected: boolean;

  // Mode-specific state
  pomodoroPhase: 'focus' | 'short_break' | 'long_break';
  pomodoroRound: number;
  intervalPhase: 'work' | 'rest';
  intervalRound: number;
  intervalTotalRounds: number;
  intervalWorkSeconds: number;
  intervalRestSeconds: number;
  laps: LapRecord[];

  // Hydration
  hydrateFromServer: () => Promise<void>;

  // Actions
  setMode: (mode: TimerMode, customMinutes?: number) => void;
  setCustomDurationSeconds: (seconds: number) => void;
  setActiveTask: (taskId: string | null, title: string) => void;
  startOrResume: () => void;
  pause: () => void;
  reset: () => void;
  completeCurrentSession: (completedNormally: boolean) => void;
  completeSessionForMode: (mode: TimerMode, completedNormally: boolean) => void;
  logInterruption: (reason: InterruptionReason, note?: string) => void;

  // Mode-specific actions
  setIntervalConfig: (workSec: number, restSec: number, rounds: number) => void;
  recordLap: () => void;
  clearLaps: () => void;

  // Tasks
  addTask: (title: string, estimatedMinutes?: number) => TaskItem;
  toggleTaskCompleted: (id: string) => void;
  deleteTask: (id: string) => void;

  // Preferences & Ambient Mixer
  updatePreferences: (patch: Partial<TimerPreferences>) => void;
  setAmbientPreset: (preset: AmbientPreset) => void;
  toggleAmbientSound: (id: AmbientSoundId) => void;
  setAmbientSoundVolume: (id: AmbientSoundId, volume: number) => void;
  toggleAmbientMute: () => void;
  clearAmbientMix: () => void;
  applyAmbientMix: (mix: AmbientMix) => void;
  saveCustomSoundPreset: (name: string) => void;
  deleteCustomSoundPreset: (id: string) => void;
}

const initialPrefs = repository.getPreferences() ?? DEFAULT_PREFERENCES;
const initialModeStates = createAllModeStates(initialPrefs);

function getNextPomodoroTransition(
  phase: 'focus' | 'short_break' | 'long_break',
  round: number,
  prefs: TimerPreferences,
): {
  nextPhase: 'focus' | 'short_break' | 'long_break';
  nextRound: number;
  nextSeconds: number;
} {
  let nextPhase: 'focus' | 'short_break' | 'long_break' = 'focus';
  let nextRound = round;
  if (phase === 'focus') {
    nextPhase = round >= 4 ? 'long_break' : 'short_break';
  } else {
    nextPhase = 'focus';
    nextRound = round >= 4 ? 1 : round + 1;
  }
  const nextSeconds =
    nextPhase === 'focus'
      ? prefs.focusMinutes * 60
      : nextPhase === 'long_break'
        ? prefs.longBreakMinutes * 60
        : prefs.shortBreakMinutes * 60;
  return { nextPhase, nextRound, nextSeconds };
}

export const useTimerStore = create<TimerState>((set, get) => ({
  mode: 'focus',
  ...initialModeStates.focus,
  activeTaskId: null,
  activeTaskTitle: '',
  modeStates: initialModeStates,

  tasks: repository.getTasks(),
  sessions: repository.getSessions(),
  preferences: initialPrefs,
  soundPresets: [],
  dbConnected: false,

  pomodoroPhase: 'focus',
  pomodoroRound: 1,
  intervalPhase: 'work',
  intervalRound: 1,
  intervalTotalRounds: 8,
  intervalWorkSeconds: 45,
  intervalRestSeconds: 15,
  laps: [],

  hydrateFromServer: async () => {
    const data = await apiClient.bootstrap();
    if (!data) return;

    const mergedPrefs: TimerPreferences = data.preferences
      ? { ...DEFAULT_PREFERENCES, ...data.preferences }
      : get().preferences;

    if (data.preferences) {
      repository.savePreferences(mergedPrefs);
    }
    if (data.tasks.length > 0) {
      repository.saveTasks(data.tasks);
    }

    set((state) => ({
      dbConnected: true,
      sessions: data.sessions.length > 0 ? data.sessions : state.sessions,
      tasks: data.tasks.length > 0 ? data.tasks : state.tasks,
      preferences: mergedPrefs,
      soundPresets: data.soundPresets ?? [],
    }));
  },

  setMode: (mode, customMinutes) => {
    soundEngine.stopCompletionAlarm();
    const state = get();
    const prefs = state.preferences;
    const currentSnapshot: ModeTimerState = {
      status: state.status,
      plannedSeconds: state.plannedSeconds,
      accumulatedMs: state.accumulatedMs,
      lastResumedAt: state.lastResumedAt,
      activeSessionId: state.activeSessionId,
      sessionStartedAt: state.sessionStartedAt,
      interruptions: state.interruptions,
    };

    const nextModeStates: Record<TimerMode, ModeTimerState> = {
      ...state.modeStates,
      [state.mode]: currentSnapshot,
    };

    let targetState = nextModeStates[mode];
    if (customMinutes !== undefined) {
      targetState = {
        ...createInitialModeState(mode, prefs),
        plannedSeconds: customMinutes * 60,
      };
      nextModeStates[mode] = targetState;
    }

    if (state.mode !== mode) {
      eventBus.emit('mode:changed', { from: state.mode, to: mode });
    }

    set({
      mode,
      ...targetState,
      modeStates: nextModeStates,
    });
  },

  setCustomDurationSeconds: (seconds) => {
    soundEngine.stopCompletionAlarm();
    const state = get();
    if ((state.status !== 'idle' && state.status !== 'completed') || state.mode === 'flow') {
      return;
    }

    const clamped = Math.max(1, Math.min(180 * 60, Math.round(seconds)));
    const wholeMinutes = Math.max(1, Math.round(clamped / 60));

    const prefs = { ...state.preferences };
    if (state.mode === 'focus') prefs.focusMinutes = wholeMinutes;
    if (state.mode === 'short_break') prefs.shortBreakMinutes = wholeMinutes;
    if (state.mode === 'long_break') prefs.longBreakMinutes = wholeMinutes;
    repository.savePreferences(prefs);

    set({
      status: 'idle',
      plannedSeconds: clamped,
      accumulatedMs: 0,
      lastResumedAt: null,
      preferences: prefs,
      modeStates: {
        ...state.modeStates,
        [state.mode]: {
          ...state.modeStates[state.mode],
          status: 'idle',
          plannedSeconds: clamped,
          accumulatedMs: 0,
          lastResumedAt: null,
        },
      },
    });
  },

  setActiveTask: (taskId, title) => {
    set({ activeTaskId: taskId, activeTaskTitle: title });
  },

  startOrResume: () => {
    soundEngine.stopCompletionAlarm();
    const state = get();
    const now = Date.now();

    if (state.status === 'running') return;

    if (state.status === 'idle' || state.status === 'completed') {
      const sessionId = createId('ses');
      let nextPomodoroPhase = state.pomodoroPhase;
      let nextPomodoroRound = state.pomodoroRound;
      let plannedSeconds =
        state.mode === 'flow'
          ? 0
          : state.plannedSeconds > 0
            ? state.plannedSeconds
            : getPlannedSecondsForMode(state.mode, state.preferences);

      if (state.status === 'completed' && state.mode === 'pomodoro') {
        const next = getNextPomodoroTransition(
          state.pomodoroPhase,
          state.pomodoroRound,
          state.preferences,
        );
        nextPomodoroPhase = next.nextPhase;
        nextPomodoroRound = next.nextRound;
        plannedSeconds = next.nextSeconds;
      }

      const nextModeState: ModeTimerState = {
        status: 'running',
        plannedSeconds,
        accumulatedMs: 0,
        lastResumedAt: now,
        activeSessionId: sessionId,
        sessionStartedAt: now,
        interruptions: [],
      };

      set({
        ...nextModeState,
        ...(state.mode === 'pomodoro'
          ? { pomodoroPhase: nextPomodoroPhase, pomodoroRound: nextPomodoroRound }
          : {}),
        modeStates: {
          ...state.modeStates,
          [state.mode]: nextModeState,
        },
      });

      if (!state.preferences.ambientMuted && Object.keys(state.preferences.ambientMix).length > 0) {
        soundEngine.syncMix(
          state.preferences.ambientMix,
          state.preferences.ambientMuted,
          state.preferences.ambientVolume,
        );
      }

      eventBus.emit('timer:started', {
        sessionId,
        mode: state.mode,
        plannedSeconds,
        taskTitle: state.activeTaskTitle || undefined,
        timestamp: now,
      });
      return;
    }

    // Resume from paused
    const resumedState: ModeTimerState = {
      ...state.modeStates[state.mode],
      status: 'running',
      lastResumedAt: now,
    };

    set({
      status: 'running',
      lastResumedAt: now,
      modeStates: {
        ...state.modeStates,
        [state.mode]: resumedState,
      },
    });

    if (!state.preferences.ambientMuted && Object.keys(state.preferences.ambientMix).length > 0) {
      soundEngine.syncMix(
        state.preferences.ambientMix,
        state.preferences.ambientMuted,
        state.preferences.ambientVolume,
      );
    }

    if (state.activeSessionId) {
      eventBus.emit('timer:resumed', {
        sessionId: state.activeSessionId,
        elapsedSeconds: Math.round(state.accumulatedMs / 1000),
        timestamp: now,
      });
    }
  },

  pause: () => {
    const state = get();
    if (state.status !== 'running' || state.lastResumedAt === null) return;

    const now = Date.now();
    const accumulatedMs = state.accumulatedMs + Math.max(0, now - state.lastResumedAt);

    const pausedState: ModeTimerState = {
      ...state.modeStates[state.mode],
      status: 'paused',
      accumulatedMs,
      lastResumedAt: null,
    };
    const nextModeStates = {
      ...state.modeStates,
      [state.mode]: pausedState,
    };

    set({
      status: 'paused',
      accumulatedMs,
      lastResumedAt: null,
      modeStates: nextModeStates,
    });

    if (state.activeSessionId) {
      eventBus.emit('timer:paused', {
        sessionId: state.activeSessionId,
        elapsedSeconds: Math.round(accumulatedMs / 1000),
        timestamp: now,
      });
    }
  },

  reset: () => {
    soundEngine.stopCompletionAlarm();
    const state = get();

    // If stopping alarm after a completed Pomodoro phase, cue up the next phase in idle state
    if (state.status === 'completed' && state.mode === 'pomodoro') {
      const next = getNextPomodoroTransition(
        state.pomodoroPhase,
        state.pomodoroRound,
        state.preferences,
      );
      const nextIdleState: ModeTimerState = {
        ...createInitialModeState('pomodoro', state.preferences),
        plannedSeconds: next.nextSeconds,
      };
      set({
        ...nextIdleState,
        pomodoroPhase: next.nextPhase,
        pomodoroRound: next.nextRound,
        modeStates: { ...state.modeStates, pomodoro: nextIdleState },
      });
      eventBus.emit('timer:reset', {
        mode: state.mode,
        timestamp: Date.now(),
      });
      return;
    }

    const preservedPlanned =
      state.mode === 'flow'
        ? 0
        : state.mode === 'pomodoro'
          ? state.preferences.focusMinutes * 60
          : state.mode === 'interval'
            ? state.intervalWorkSeconds
            : state.plannedSeconds > 0
              ? state.plannedSeconds
              : getPlannedSecondsForMode(state.mode, state.preferences);
    const resetState: ModeTimerState = {
      ...createInitialModeState(state.mode, state.preferences),
      plannedSeconds: preservedPlanned,
    };
    const nextModeStates = {
      ...state.modeStates,
      [state.mode]: resetState,
    };

    set({
      ...resetState,
      modeStates: nextModeStates,
      ...(state.mode === 'pomodoro'
        ? { pomodoroPhase: 'focus', pomodoroRound: 1 }
        : {}),
      ...(state.mode === 'interval'
        ? { intervalPhase: 'work', intervalRound: 1 }
        : {}),
      ...(state.mode === 'flow' ? { laps: [] } : {}),
    });

    eventBus.emit('timer:reset', {
      mode: state.mode,
      timestamp: Date.now(),
    });
  },

  setIntervalConfig: (workSec, restSec, rounds) => {
    const state = get();
    const w = Math.max(5, Math.min(3600, Math.round(workSec)));
    const r = Math.max(5, Math.min(1800, Math.round(restSec)));
    const total = Math.max(1, Math.min(30, Math.round(rounds)));
    const isIntervalIdle = state.mode === 'interval' && state.status === 'idle';
    set({
      intervalWorkSeconds: w,
      intervalRestSeconds: r,
      intervalTotalRounds: total,
      ...(isIntervalIdle
        ? {
            plannedSeconds: w,
            intervalPhase: 'work',
            intervalRound: 1,
            modeStates: {
              ...state.modeStates,
              interval: {
                ...state.modeStates.interval,
                plannedSeconds: w,
              },
            },
          }
        : {}),
    });
  },

  recordLap: () => {
    const state = get();
    if (state.mode !== 'flow') return;
    const snap = computeClockSnapshot({
      plannedSeconds: 0,
      accumulatedMs: state.accumulatedMs,
      lastResumedAt: state.lastResumedAt,
    });
    const totalMs = snap.elapsedMs;
    const prevTotal = state.laps[0]?.totalMs ?? 0;
    const lap: LapRecord = {
      id: createId('lap'),
      lapNumber: state.laps.length + 1,
      splitMs: Math.max(0, totalMs - prevTotal),
      totalMs,
    };
    set({ laps: [lap, ...state.laps] });
  },

  clearLaps: () => {
    set({ laps: [] });
  },

  completeCurrentSession: (completedNormally) => {
    get().completeSessionForMode(get().mode, completedNormally);
  },

  completeSessionForMode: (targetMode, completedNormally) => {
    const state = get();
    const targetState =
      targetMode === state.mode
        ? {
            status: state.status,
            plannedSeconds: state.plannedSeconds,
            accumulatedMs: state.accumulatedMs,
            lastResumedAt: state.lastResumedAt,
            activeSessionId: state.activeSessionId,
            sessionStartedAt: state.sessionStartedAt,
            interruptions: state.interruptions,
          }
        : state.modeStates[targetMode];

    const now = Date.now();
    const snap = computeClockSnapshot({
      plannedSeconds: targetState.plannedSeconds,
      accumulatedMs: targetState.accumulatedMs,
      lastResumedAt: targetState.lastResumedAt,
      now,
    });

    const completedModeState: ModeTimerState = {
      status: completedNormally ? 'completed' : 'idle',
      plannedSeconds: targetState.plannedSeconds,
      accumulatedMs: completedNormally ? snap.elapsedMs : 0,
      lastResumedAt: null,
      activeSessionId: null,
      sessionStartedAt: null,
      interruptions: [],
    };
    const nextModeStates = {
      ...state.modeStates,
      [targetMode]: completedModeState,
    };

    const actualSeconds = Math.max(1, Math.round(snap.elapsedMs / 1000));
    const record: SessionRecord = {
      id: targetState.activeSessionId ?? createId('ses'),
      mode: targetMode,
      taskId: state.activeTaskId ?? undefined,
      taskTitle: state.activeTaskTitle.trim() || undefined,
      plannedSeconds: targetState.plannedSeconds,
      actualSeconds,
      startedAt: targetState.sessionStartedAt ?? now - snap.elapsedMs,
      endedAt: now,
      completedNormally,
      interruptions: targetState.interruptions,
      ambientUsed: getPrimaryAmbientFromMix(state.preferences.ambientMix),
      ambientMixUsed: state.preferences.ambientMix,
    };

    repository.saveSession(record);
    void apiClient.saveSession(record);
    const updatedSessions = repository.getSessions();

    // Auto-cycle for Interval
    if (completedNormally && targetMode === 'interval') {
      const hasMore =
        state.intervalPhase === 'work' ||
        state.intervalRound < state.intervalTotalRounds;
      if (hasMore) {
        if (state.preferences.soundCueEnabled) {
          soundEngine.playCompletionChime(
            state.intervalPhase === 'work' ? 'short_break' : 'focus',
          );
        }
        const nextPhase = state.intervalPhase === 'work' ? 'rest' : 'work';
        const nextRound =
          state.intervalPhase === 'rest'
            ? state.intervalRound + 1
            : state.intervalRound;
        const nextSeconds =
          nextPhase === 'work'
            ? state.intervalWorkSeconds
            : state.intervalRestSeconds;

        const autoState: ModeTimerState = {
          status: 'running',
          plannedSeconds: nextSeconds,
          accumulatedMs: 0,
          lastResumedAt: now,
          activeSessionId: createId('ses'),
          sessionStartedAt: now,
          interruptions: [],
        };
        set({
          sessions: updatedSessions,
          intervalPhase: nextPhase,
          intervalRound: nextRound,
          modeStates: { ...state.modeStates, interval: autoState },
          ...(state.mode === 'interval' ? autoState : {}),
        });
        eventBus.emit('timer:completed', { session: record });
        return;
      }
    }

    // Sleep mode: fade out soundscape silently (no wake-up alarm!)
    if (completedNormally && targetMode === 'sleep') {
      const mutedPrefs: TimerPreferences = {
        ...state.preferences,
        ambientMuted: true,
      };
      repository.savePreferences(mutedPrefs);
      void apiClient.savePreferences(mutedPrefs);
      soundEngine.syncMix(mutedPrefs.ambientMix, true, mutedPrefs.ambientVolume);
      set({
        preferences: mutedPrefs,
        sessions: updatedSessions,
        modeStates: nextModeStates,
        ...(targetMode === state.mode ? completedModeState : {}),
      });
      eventBus.emit('timer:completed', { session: record });
      return;
    }

    if (completedNormally && state.preferences.soundCueEnabled) {
      soundEngine.startCompletionAlarm(targetMode);
    }

    set({
      sessions: updatedSessions,
      modeStates: nextModeStates,
      ...(targetMode === state.mode ? completedModeState : {}),
    });

    eventBus.emit('timer:completed', { session: record });
  },

  logInterruption: (reason, note) => {
    const state = get();
    if (!state.activeSessionId) return;

    const snap = computeClockSnapshot({
      plannedSeconds: state.plannedSeconds,
      accumulatedMs: state.accumulatedMs,
      lastResumedAt: state.lastResumedAt,
    });

    const event: InterruptionEvent = {
      id: createId('int'),
      timestamp: Date.now(),
      elapsedSecondsAtEvent: Math.round(snap.elapsedMs / 1000),
      reason,
      note,
    };

    const next = [...state.interruptions, event];
    set({
      interruptions: next,
      modeStates: {
        ...state.modeStates,
        [state.mode]: {
          ...state.modeStates[state.mode],
          interruptions: next,
        },
      },
    });

    eventBus.emit('timer:interrupted', {
      sessionId: state.activeSessionId,
      event,
    });
  },

  addTask: (title, estimatedMinutes) => {
    const item: TaskItem = {
      id: createId('tsk'),
      title: title.trim(),
      estimatedMinutes,
      completed: false,
      createdAt: Date.now(),
    };
    const next = [item, ...get().tasks];
    repository.saveTasks(next);
    void apiClient.saveTask(item);
    set({
      tasks: next,
      activeTaskId: item.id,
      activeTaskTitle: item.title,
    });
    return item;
  },

  toggleTaskCompleted: (id) => {
    const next = get().tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
    const updated = next.find((t) => t.id === id);
    repository.saveTasks(next);
    if (updated) {
      void apiClient.updateTask(id, { completed: updated.completed });
    }
    set({ tasks: next });
  },

  deleteTask: (id) => {
    const state = get();
    const next = state.tasks.filter((t) => t.id !== id);
    repository.saveTasks(next);
    void apiClient.deleteTask(id);
    set({
      tasks: next,
      ...(state.activeTaskId === id
        ? { activeTaskId: null, activeTaskTitle: '' }
        : {}),
    });
  },

  updatePreferences: (patch) => {
    const next = { ...get().preferences, ...patch };
    repository.savePreferences(next);
    void apiClient.savePreferences(next);
    const state = get();
    const shouldUpdatePlanned = state.status === 'idle';
    const nextPlanned = getPlannedSecondsForMode(state.mode, next);

    if (
      patch.ambientVolume !== undefined ||
      patch.ambientMix !== undefined ||
      patch.ambientMuted !== undefined
    ) {
      soundEngine.syncMix(next.ambientMix, next.ambientMuted, next.ambientVolume);
    }

    set({
      preferences: next,
      ...(shouldUpdatePlanned
        ? {
            plannedSeconds: nextPlanned,
            modeStates: {
              ...state.modeStates,
              [state.mode]: {
                ...state.modeStates[state.mode],
                plannedSeconds: nextPlanned,
              },
            },
          }
        : {}),
    });
  },

  setAmbientPreset: (preset) => {
    if (preset === 'off') {
      get().clearAmbientMix();
      return;
    }
    const mappedId: AmbientSoundId =
      preset === 'rain'
        ? 'light_rain'
        : preset === 'warm_drone'
          ? 'warm_pad'
          : (preset as AmbientSoundId);
    const def = AMBIENT_SOUND_MAP[mappedId];
    if (!def) return;
    const state = get();
    const nextMix: AmbientMix = { [mappedId]: def.defaultVolume };
    const nextPrefs: TimerPreferences = {
      ...state.preferences,
      ambientPreset: preset,
      ambientMix: nextMix,
      ambientMuted: false,
    };
    repository.savePreferences(nextPrefs);
    set({ preferences: nextPrefs });
    soundEngine.syncMix(nextMix, false, nextPrefs.ambientVolume);
    eventBus.emit('ambient:changed', { preset });
  },

  toggleAmbientSound: (id) => {
    const state = get();
    const currentMix = { ...state.preferences.ambientMix };
    const isActive = (currentMix[id] ?? 0) > 0;
    if (isActive) {
      delete currentMix[id];
    } else {
      const def = AMBIENT_SOUND_MAP[id];
      currentMix[id] = def?.defaultVolume ?? 0.45;
    }

    const nextMuted = isActive ? state.preferences.ambientMuted : false;
    const primary = getPrimaryAmbientFromMix(currentMix);
    const nextPrefs: TimerPreferences = {
      ...state.preferences,
      ambientMix: currentMix,
      ambientPreset: primary,
      ambientMuted: nextMuted,
    };
    repository.savePreferences(nextPrefs);
    void apiClient.savePreferences(nextPrefs);
    set({ preferences: nextPrefs });
    soundEngine.syncMix(currentMix, nextMuted, nextPrefs.ambientVolume);
    eventBus.emit('ambient:mix_changed', { mix: currentMix, muted: nextMuted });
  },

  setAmbientSoundVolume: (id, volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const state = get();
    const currentMix = { ...state.preferences.ambientMix };
    if (clamped <= 0.01) {
      delete currentMix[id];
    } else {
      currentMix[id] = clamped;
    }

    const nextMuted = clamped > 0.01 ? false : state.preferences.ambientMuted;
    const primary = getPrimaryAmbientFromMix(currentMix);
    const nextPrefs: TimerPreferences = {
      ...state.preferences,
      ambientMix: currentMix,
      ambientPreset: primary,
      ambientMuted: nextMuted,
    };
    repository.savePreferences(nextPrefs);
    void apiClient.savePreferences(nextPrefs);
    set({ preferences: nextPrefs });
    soundEngine.syncMix(currentMix, nextMuted, nextPrefs.ambientVolume);
    eventBus.emit('ambient:mix_changed', { mix: currentMix, muted: nextMuted });
  },

  toggleAmbientMute: () => {
    const state = get();
    const nextMuted = !state.preferences.ambientMuted;
    const nextPrefs: TimerPreferences = {
      ...state.preferences,
      ambientMuted: nextMuted,
    };
    repository.savePreferences(nextPrefs);
    void apiClient.savePreferences(nextPrefs);
    set({ preferences: nextPrefs });
    soundEngine.syncMix(nextPrefs.ambientMix, nextMuted, nextPrefs.ambientVolume);
    eventBus.emit('ambient:mix_changed', {
      mix: nextPrefs.ambientMix,
      muted: nextMuted,
    });
  },

  clearAmbientMix: () => {
    const state = get();
    const nextPrefs: TimerPreferences = {
      ...state.preferences,
      ambientMix: {},
      ambientPreset: 'off',
      ambientMuted: false,
    };
    repository.savePreferences(nextPrefs);
    void apiClient.savePreferences(nextPrefs);
    set({ preferences: nextPrefs });
    soundEngine.syncMix({}, false, nextPrefs.ambientVolume);
    eventBus.emit('ambient:changed', { preset: 'off' });
    eventBus.emit('ambient:mix_changed', { mix: {}, muted: false });
  },

  applyAmbientMix: (mix) => {
    const state = get();
    const cleanMix: AmbientMix = {};
    for (const [id, vol] of Object.entries(mix)) {
      if ((vol ?? 0) > 0.01) {
        cleanMix[id as AmbientSoundId] = vol;
      }
    }
    const primary = getPrimaryAmbientFromMix(cleanMix);
    const nextPrefs: TimerPreferences = {
      ...state.preferences,
      ambientMix: cleanMix,
      ambientPreset: primary,
      ambientMuted: false,
    };
    repository.savePreferences(nextPrefs);
    void apiClient.savePreferences(nextPrefs);
    set({ preferences: nextPrefs });
    soundEngine.syncMix(cleanMix, false, nextPrefs.ambientVolume);
    eventBus.emit('ambient:mix_changed', { mix: cleanMix, muted: false });
  },

  saveCustomSoundPreset: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const state = get();
    const activeEntries = Object.entries(state.preferences.ambientMix).filter(
      ([, v]) => (v ?? 0) > 0.01,
    );
    if (activeEntries.length === 0) return;

    const description = activeEntries
      .map(([id, vol]) => {
        const label = AMBIENT_SOUND_MAP[id as AmbientSoundId]?.label ?? id;
        return `${label} ${Math.round((vol ?? 0) * 100)}%`;
      })
      .join(' · ');

    const preset: SoundPresetRecord = {
      id: createId('mix'),
      name: trimmed,
      description,
      mix: { ...state.preferences.ambientMix },
      createdAt: Date.now(),
    };
    set({ soundPresets: [preset, ...state.soundPresets] });
    void apiClient.saveSoundPreset(preset);
  },

  deleteCustomSoundPreset: (id) => {
    set((state) => ({
      soundPresets: state.soundPresets.filter((p) => p.id !== id),
    }));
    void apiClient.deleteSoundPreset(id);
  },
}));
