import type { AmbientSoundId } from './ambientCatalog';

export type TimerMode = 'focus' | 'short_break' | 'long_break' | 'flow';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export type AmbientPreset = 'off' | 'brown_noise' | 'rain' | 'warm_drone' | AmbientSoundId;

export type AmbientMix = Partial<Record<AmbientSoundId, number>>;

export type InterruptionReason = 'distraction' | 'meeting' | 'urgent_task' | 'fatigue' | 'other';

export interface InterruptionEvent {
  id: string;
  timestamp: number;
  elapsedSecondsAtEvent: number;
  reason: InterruptionReason;
  note?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  project?: string;
  estimatedMinutes?: number;
  completed: boolean;
  createdAt: number;
}

export interface SessionRecord {
  id: string;
  mode: TimerMode;
  taskId?: string;
  taskTitle?: string;
  project?: string;
  plannedSeconds: number; // 0 for open-ended 'flow' stopwatch
  actualSeconds: number;
  startedAt: number;
  endedAt: number;
  completedNormally: boolean;
  interruptions: InterruptionEvent[];
  focusRating?: 1 | 2 | 3 | 4 | 5;
  ambientUsed: AmbientPreset;
  ambientMixUsed?: AmbientMix;
}

export interface SoundPresetRecord {
  id: string;
  name: string;
  description?: string;
  mix: AmbientMix;
  createdAt: number;
}

export interface CoachRecommendation {
  id: string;
  type: 'break_suggestion' | 'session_length' | 'fatigue_warning' | 'flow_streak';
  title: string;
  message: string;
  suggestedMinutes?: number;
  suggestedMode?: TimerMode;
}

export interface DailyWorkLogSummary {
  dateKey: string;
  totalFocusSeconds: number;
  totalBreakSeconds: number;
  sessionsCompleted: number;
  interruptionCount: number;
  averageFocusScore: number; // 0 - 100
  byTask: Array<{
    taskTitle: string;
    actualMinutes: number;
    estimatedMinutes?: number;
    sessions: number;
  }>;
}

export interface TimerPreferences {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  autoPopupOnStart: boolean;
  adaptiveSoundEnabled: boolean;
  ambientPreset: AmbientPreset;
  ambientVolume: number; // 0 to 1
  ambientMix: AmbientMix;
  ambientMuted: boolean;
  soundCueEnabled: boolean;
}
