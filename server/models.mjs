import mongoose from 'mongoose';

const InterruptionEventSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    timestamp: { type: Number, required: true },
    elapsedSecondsAtEvent: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['distraction', 'meeting', 'urgent_task', 'fatigue', 'other'],
      required: true,
    },
    note: { type: String },
  },
  { _id: false },
);

/**
 * Collection: sessions
 * Stores completed timer sessions along with the ambient sound mix used.
 */
const SessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    mode: {
      type: String,
      enum: [
        'focus',
        'short_break',
        'long_break',
        'flow',
        'pomodoro',
        'interval',
        'sleep',
      ],
      required: true,
    },
    taskId: { type: String },
    taskTitle: { type: String },
    project: { type: String },
    plannedSeconds: { type: Number, required: true },
    actualSeconds: { type: Number, required: true },
    startedAt: { type: Number, required: true, index: true },
    endedAt: { type: Number, required: true },
    completedNormally: { type: Boolean, required: true },
    interruptions: { type: [InterruptionEventSchema], default: [] },
    focusRating: { type: Number, min: 1, max: 5 },
    ambientUsed: { type: String, default: 'off' },
    ambientMixUsed: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

/**
 * Collection: tasks
 * Stores user tasks linked to focus sessions.
 */
const TaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    project: { type: String },
    estimatedMinutes: { type: Number },
    completed: { type: Boolean, default: false },
    createdAt: { type: Number, required: true, index: true },
  },
  { timestamps: true },
);

/**
 * Collection: preferences
 * Stores user timer preferences and current active ambient sound mix.
 */
const PreferenceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    focusMinutes: { type: Number, default: 25 },
    shortBreakMinutes: { type: Number, default: 5 },
    longBreakMinutes: { type: Number, default: 15 },
    autoPopupOnStart: { type: Boolean, default: false },
    adaptiveSoundEnabled: { type: Boolean, default: true },
    ambientPreset: { type: String, default: 'off' },
    ambientVolume: { type: Number, default: 0.65 },
    ambientMix: { type: mongoose.Schema.Types.Mixed, default: {} },
    ambientMuted: { type: Boolean, default: false },
    soundCueEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

/**
 * Collection: sound_presets
 * Stores user-saved custom 1-click multi-sound mixes.
 */
const SoundPresetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    mix: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Number, required: true, index: true },
  },
  { timestamps: true },
);

export const SessionModel =
  mongoose.models.Session || mongoose.model('Session', SessionSchema, 'sessions');

export const TaskModel =
  mongoose.models.Task || mongoose.model('Task', TaskSchema, 'tasks');

export const PreferenceModel =
  mongoose.models.Preference ||
  mongoose.model('Preference', PreferenceSchema, 'preferences');

export const SoundPresetModel =
  mongoose.models.SoundPreset ||
  mongoose.model('SoundPreset', SoundPresetSchema, 'sound_presets');
