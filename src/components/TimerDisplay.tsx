import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BellOff,
  BellRing,
  Check,
  Flag,
  Minus,
  Pause,
  PictureInPicture2,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {
  formatDurationMs,
  formatStopwatchMs,
  parseDurationInput,
} from '../core/clock';
import type { TimerMode } from '../core/types';
import { useClockTick } from '../hooks/useClockTick';
import { useTimerStore } from '../store/useTimerStore';

const RING_ACCENT: Record<TimerMode, { stroke: string; dot: string }> = {
  focus: { stroke: 'stroke-neutral-900', dot: 'bg-neutral-900' },
  short_break: { stroke: 'stroke-emerald-600', dot: 'bg-emerald-600' },
  long_break: { stroke: 'stroke-sky-600', dot: 'bg-sky-600' },
  flow: { stroke: 'stroke-neutral-900', dot: 'bg-neutral-900' },
  pomodoro: { stroke: 'stroke-neutral-900', dot: 'bg-neutral-900' },
  interval: { stroke: 'stroke-amber-500', dot: 'bg-amber-500' },
  sleep: { stroke: 'stroke-indigo-500', dot: 'bg-indigo-500' },
};

interface TimerDisplayProps {
  isPipOpen: boolean;
  onStart: () => void;
  onTogglePip: () => void;
}

export function TimerDisplay({
  isPipOpen,
  onStart,
  onTogglePip,
}: TimerDisplayProps) {
  const mode = useTimerStore((s) => s.mode);
  const status = useTimerStore((s) => s.status);
  const plannedSeconds = useTimerStore((s) => s.plannedSeconds);
  const preferences = useTimerStore((s) => s.preferences);
  const pomodoroPhase = useTimerStore((s) => s.pomodoroPhase);
  const pomodoroRound = useTimerStore((s) => s.pomodoroRound);
  const intervalPhase = useTimerStore((s) => s.intervalPhase);
  const intervalRound = useTimerStore((s) => s.intervalRound);
  const intervalTotalRounds = useTimerStore((s) => s.intervalTotalRounds);
  const intervalWorkSeconds = useTimerStore((s) => s.intervalWorkSeconds);
  const intervalRestSeconds = useTimerStore((s) => s.intervalRestSeconds);
  const laps = useTimerStore((s) => s.laps);

  const pause = useTimerStore((s) => s.pause);
  const reset = useTimerStore((s) => s.reset);
  const completeCurrentSession = useTimerStore((s) => s.completeCurrentSession);
  const setMode = useTimerStore((s) => s.setMode);
  const setCustomDurationSeconds = useTimerStore(
    (s) => s.setCustomDurationSeconds,
  );
  const setIntervalConfig = useTimerStore((s) => s.setIntervalConfig);
  const recordLap = useTimerStore((s) => s.recordLap);
  const updatePreferences = useTimerStore((s) => s.updatePreferences);

  const { snapshot, formattedTime } = useClockTick();

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [draftTime, setDraftTime] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canEditTime = (status === 'idle' || status === 'completed') && mode !== 'flow';

  useEffect(() => {
    if (!canEditTime && isEditingTime) {
      setIsEditingTime(false);
    }
  }, [canEditTime, isEditingTime]);

  useEffect(() => {
    if (isEditingTime) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTime]);

  const startEditingTime = () => {
    if (!canEditTime) return;
    setDraftTime(
      status === 'completed'
        ? formatDurationMs(plannedSeconds * 1000)
        : formattedTime,
    );
    setIsEditingTime(true);
  };

  const commitTimeEdit = () => {
    const parsed = parseDurationInput(draftTime);
    if (parsed !== null) {
      setCustomDurationSeconds(parsed);
    }
    setIsEditingTime(false);
  };

  const cancelTimeEdit = () => {
    setIsEditingTime(false);
  };

  // 288px container with 8px padding around r=136 so stroke never clips at edges
  const size = 288;
  const center = size / 2;
  const radius = 136;
  const circumference = 2 * Math.PI * radius;
  const countdownProgress = status === 'idle' ? 0 : snapshot.progress;
  const strokeDashoffset = circumference * (1 - countdownProgress);

  const adjustMinutes = (delta: number) => {
    if (status !== 'idle' || mode === 'flow') return;
    if (plannedSeconds <= 60 && delta < 0) {
      setCustomDurationSeconds(Math.max(1, plannedSeconds - 10));
      return;
    }
    const currentMin = Math.round(plannedSeconds / 60);
    const nextMin = Math.max(1, Math.min(120, currentMin + delta));
    if (mode === 'focus') {
      updatePreferences({ focusMinutes: nextMin });
    } else if (mode === 'pomodoro') {
      if (pomodoroPhase === 'focus') updatePreferences({ focusMinutes: nextMin });
      else if (pomodoroPhase === 'short_break') updatePreferences({ shortBreakMinutes: nextMin });
      else updatePreferences({ longBreakMinutes: nextMin });
    }
    setMode(mode, nextMin);
  };

  const accent =
    mode === 'pomodoro' && pomodoroPhase !== 'focus'
      ? RING_ACCENT[pomodoroPhase]
      : mode === 'interval' && intervalPhase === 'rest'
        ? RING_ACCENT.short_break
        : RING_ACCENT[mode];

  const modeBadgeLabel =
    mode === 'pomodoro'
      ? `${pomodoroPhase === 'focus' ? 'FOCUS' : pomodoroPhase === 'long_break' ? 'LONG BREAK' : 'BREAK'} · ${pomodoroRound}/4`
      : mode === 'interval'
        ? `${intervalPhase === 'work' ? 'WORK' : 'REST'} · ${intervalRound}/${intervalTotalRounds}`
        : mode === 'sleep'
          ? 'SLEEP · FADE OUT'
          : mode === 'flow'
            ? 'STOPWATCH'
            : 'TIMER';

  const tickAngles = Array.from({ length: 60 }, (_, i) => i * 6);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Pomodoro Focus / Break / Long Durations above the clock */}
      {mode === 'pomodoro' && status === 'idle' && (
        <div className="inline-flex items-center divide-x divide-neutral-200/80 whitespace-nowrap text-xs">
          {[
            {
              label: 'Focus',
              value: preferences.focusMinutes,
              min: 1,
              max: 120,
              step: 5,
              onChange: (v: number) => {
                updatePreferences({ focusMinutes: v });
                if (pomodoroPhase === 'focus') setMode('pomodoro', v);
              },
            },
            {
              label: 'Break',
              value: preferences.shortBreakMinutes,
              min: 1,
              max: 60,
              step: 1,
              onChange: (v: number) => {
                updatePreferences({ shortBreakMinutes: v });
                if (pomodoroPhase === 'short_break') setMode('pomodoro', v);
              },
            },
            {
              label: 'Long',
              value: preferences.longBreakMinutes,
              min: 1,
              max: 90,
              step: 5,
              onChange: (v: number) => {
                updatePreferences({ longBreakMinutes: v });
                if (pomodoroPhase === 'long_break') setMode('pomodoro', v);
              },
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1 px-2.5 py-0.5 sm:px-3.5">
              <span className="text-neutral-400">{item.label}</span>
              <button
                type="button"
                onClick={() =>
                  item.onChange(Math.max(item.min, item.value - item.step))
                }
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                title={`Decrease ${item.label}`}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="font-mono-timer min-w-[2rem] text-center font-medium text-neutral-900">
                {item.value}m
              </span>
              <button
                type="button"
                onClick={() =>
                  item.onChange(Math.min(item.max, item.value + item.step))
                }
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                title={`Increase ${item.label}`}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Circular Minimal Clock */}
      <div
        onClick={status === 'completed' ? reset : undefined}
        role={status === 'completed' ? 'button' : undefined}
        tabIndex={status === 'completed' ? 0 : undefined}
        onKeyDown={
          status === 'completed'
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  reset();
                }
              }
            : undefined
        }
        title={status === 'completed' ? 'Click to stop alarm' : undefined}
        className={`relative flex h-[288px] w-[288px] items-center justify-center rounded-full ${
          status === 'completed'
            ? 'cursor-pointer transition-transform active:scale-[0.98]'
            : ''
        }`}
      >
        {/* Looping Ripple Aura when time is up */}
        {status === 'completed' && (
          <>
            {[0, 0.6, 1.2].map((delay) => (
              <motion.span
                key={delay}
                aria-hidden="true"
                className="pointer-events-none absolute inset-2 rounded-full border-2 border-neutral-900/30"
                initial={{ scale: 1, opacity: 0.65 }}
                animate={{ scale: 1.26, opacity: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 1.8,
                  delay,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}

        {/* Concentric SVG track, recessed groove, 60 precision ticks & gradient progress */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
          viewBox={`0 0 ${size} ${size}`}
          shapeRendering="geometricPrecision"
          aria-hidden="true"
        >
          <defs>
            {/* 1. Gradient Sweep for the active progress arc */}
            <linearGradient
              id="progress-sweep"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#a3a3a3" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#404040" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#171717" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* 5. Recessed Track: subtle outer shadow + machined groove + inner highlight */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth="11"
            className="stroke-neutral-200/45"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth="9"
            className="stroke-neutral-200/90"
          />
          <circle
            cx={center}
            cy={center}
            r={radius - 4}
            fill="none"
            strokeWidth="1"
            className="stroke-white/80"
          />

          {/* 2. Precision Dial Tick Marks (60 ticks, major every 5) */}
          <g>
            {tickAngles.map((deg, idx) => {
              const isMajor = idx % 5 === 0;
              const rad = (deg * Math.PI) / 180;
              const outerR = radius - 14;
              const innerR = isMajor ? radius - 22 : radius - 18;
              const x1 = center + innerR * Math.cos(rad);
              const y1 = center + innerR * Math.sin(rad);
              const x2 = center + outerR * Math.cos(rad);
              const y2 = center + outerR * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={isMajor ? 1.5 : 1}
                  strokeLinecap="round"
                  className={
                    isMajor ? 'stroke-neutral-400/70' : 'stroke-neutral-300/60'
                  }
                />
              );
            })}
          </g>

          {/* Active Progress Arc with Gradient Sweep */}
          {mode !== 'flow' && (
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={status === 'completed' ? '#171717' : 'url(#progress-sweep)'}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={
                status === 'completed'
                  ? { strokeDashoffset: 0, opacity: [1, 0.25, 1] }
                  : { strokeDashoffset, opacity: 1 }
              }
              transition={
                status === 'completed'
                  ? {
                      strokeDashoffset: { duration: 0.25, ease: 'easeOut' },
                      opacity: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
                    }
                  : status === 'running'
                    ? { duration: 0 }
                    : { duration: 0.25, ease: 'easeOut' }
              }
            />
          )}
        </svg>

        {/* Countdown leading tip sparkle via Framer Motion */}
        {mode !== 'flow' && (status === 'running' || status === 'paused') && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ rotate: countdownProgress * 360 }}
            transition={
              status === 'running'
                ? { duration: 0 }
                : { duration: 0.25, ease: 'easeOut' }
            }
          >
            <div
              style={{ top: `${center - radius - 8}px` }}
              className="absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center"
            >
              {/* Soft breathing halo */}
              {status === 'running' && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-neutral-900/30"
                  animate={{ scale: [1, 1.8, 1], opacity: [0.55, 0, 0.55] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.8,
                    ease: 'easeInOut',
                  }}
                />
              )}
              {/* Crisp glowing tip with bright core */}
              <span
                className={`relative flex h-4 w-4 items-center justify-center rounded-full ${accent.dot} ring-2 ring-white shadow-[0_0_12px_rgba(23,23,23,0.4)]`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>
          </motion.div>
        )}

        {/* Stopwatch 1-second hardware-accelerated orbit via Framer Motion */}
        {mode === 'flow' && status === 'running' && (
          <motion.div
            key="flow-orbit-running"
            className="pointer-events-none absolute inset-0"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: 'linear',
            }}
          >
            <span
              style={{ top: `${center - radius - 8}px` }}
              className={`absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center rounded-full ${accent.dot} ring-2 ring-white shadow-[0_0_12px_rgba(23,23,23,0.4)]`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </motion.div>
        )}

        <div className="relative z-10 flex flex-col items-center justify-center">
          <span className="mb-1.5 text-[10px] font-medium tracking-[0.2em] text-neutral-400 uppercase select-none">
            {modeBadgeLabel}
          </span>
          {isEditingTime ? (
            <input
              ref={inputRef}
              type="text"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              onBlur={commitTimeEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitTimeEdit();
                } else if (e.key === 'Escape') {
                  cancelTimeEdit();
                }
              }}
              aria-label="Edit duration (e.g. 25 or 12:30)"
              placeholder="25:00"
              className="font-mono-timer w-44 border-b-2 border-neutral-900 bg-transparent text-center text-5xl font-normal tracking-tight text-neutral-900 focus:outline-none"
            />
          ) : (
            <motion.button
              type="button"
              onClick={status === 'completed' ? reset : startEditingTime}
              disabled={!canEditTime && status !== 'completed'}
              animate={
                status === 'completed'
                  ? { scale: [1, 1.05, 1] }
                  : { scale: 1 }
              }
              transition={
                status === 'completed'
                  ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
              title={
                status === 'completed'
                  ? 'Click to stop alarm'
                  : canEditTime
                    ? 'Click to edit duration (e.g. 45 or 12:30)'
                    : undefined
              }
              className={`font-mono-timer text-5xl font-normal tracking-tight text-neutral-900 ${
                status === 'completed'
                  ? 'cursor-pointer rounded-lg px-2'
                  : canEditTime
                    ? 'cursor-text rounded-lg px-2 transition hover:bg-neutral-100/80'
                    : 'cursor-default'
              }`}
            >
              {formattedTime}
            </motion.button>
          )}

          {/* Clear looping completion badge when time is up */}
          {status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24 }}
              className="mt-3 flex items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 py-1 text-xs font-semibold tracking-wide text-white shadow-sm"
            >
              <motion.span
                animate={{ rotate: [0, -18, 18, -14, 14, -8, 8, 0] }}
                transition={{
                  repeat: Infinity,
                  repeatDelay: 0.45,
                  duration: 0.65,
                  ease: 'easeInOut',
                }}
                className="inline-flex"
              >
                <BellRing className="h-3.5 w-3.5" />
              </motion.span>
              <span>
                {mode === 'pomodoro'
                  ? pomodoroPhase === 'focus'
                    ? pomodoroRound >= 4
                      ? 'Next: Long Break'
                      : 'Next: Break'
                    : 'Next: Focus'
                  : "Time's Up!"}
              </span>
            </motion.div>
          )}

          {/* Quick time adjuster when idle */}
          {status === 'idle' && mode !== 'flow' && (
            <div className="mt-4 flex items-center gap-3">
              <motion.button
                type="button"
                onClick={() => adjustMinutes(-5)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
                title="-5 min"
              >
                <Minus className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                onClick={startEditingTime}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                title="Click to enter custom duration"
              >
                {plannedSeconds % 60 === 0
                  ? `${Math.round(plannedSeconds / 60)} min`
                  : `${Math.floor(plannedSeconds / 60)}m ${plannedSeconds % 60}s`}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => adjustMinutes(5)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
                title="+5 min"
              >
                <Plus className="h-4 w-4" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Mode-Specific Quick Controls (borderless text with subtle hairline dividers) */}
      <div className="flex min-h-[28px] items-center justify-center">
        {(mode === 'focus' || mode === 'sleep') && status === 'idle' && (
          <div className="inline-flex items-center divide-x divide-neutral-200/80">
            {(mode === 'sleep' ? [15, 30, 45, 60, 90] : [5, 15, 25, 45, 60]).map((mins) => {
              const active = plannedSeconds === mins * 60;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    if (mode === 'focus') updatePreferences({ focusMinutes: mins });
                    setMode(mode, mins);
                  }}
                  className={`relative cursor-pointer px-3.5 py-0.5 text-xs tracking-wide transition-colors ${
                    active
                      ? 'font-semibold text-neutral-900'
                      : 'font-normal text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {mins}m
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-neutral-900" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {mode === 'pomodoro' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" title={`Round ${pomodoroRound} of 4`}>
              {[1, 2, 3, 4].map((r) => (
                <span
                  key={r}
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${
                    r < pomodoroRound
                      ? 'bg-neutral-900'
                      : r === pomodoroRound
                        ? 'bg-neutral-900 ring-2 ring-neutral-300'
                        : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>
            {status === 'idle' && (
              <div className="inline-flex items-center divide-x divide-neutral-200/80 border-l border-neutral-200/80 pl-3">
                {[
                  { label: '25 / 5', f: 25, b: 5, l: 15 },
                  { label: '50 / 10', f: 50, b: 10, l: 20 },
                ].map((p) => {
                  const active =
                    preferences.focusMinutes === p.f &&
                    preferences.shortBreakMinutes === p.b;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        updatePreferences({
                          focusMinutes: p.f,
                          shortBreakMinutes: p.b,
                          longBreakMinutes: p.l,
                        });
                        setMode('pomodoro', p.f);
                      }}
                      className={`relative cursor-pointer px-3 py-0.5 text-xs tracking-wide transition-colors ${
                        active
                          ? 'font-semibold text-neutral-900'
                          : 'font-normal text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      {p.label}
                      {active && (
                        <span className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-neutral-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {mode === 'interval' && status === 'idle' && (
          <div className="inline-flex items-center divide-x divide-neutral-200/80">
            {[
              { label: '45s / 15s × 8', w: 45, r: 15, n: 8 },
              { label: '30s / 10s × 10', w: 30, r: 10, n: 10 },
              { label: '20m / 5m × 4', w: 1200, r: 300, n: 4 },
            ].map((p) => {
              const active =
                intervalWorkSeconds === p.w &&
                intervalRestSeconds === p.r &&
                intervalTotalRounds === p.n;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setIntervalConfig(p.w, p.r, p.n)}
                  className={`relative cursor-pointer px-3.5 py-0.5 text-xs tracking-wide transition-colors ${
                    active
                      ? 'font-semibold text-neutral-900'
                      : 'font-normal text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  {p.label}
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-3 -translate-x-1/2 rounded-full bg-neutral-900" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Primary Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {status === 'completed' ? (
          mode === 'pomodoro' ? (
            <>
              <motion.button
                type="button"
                onClick={onStart}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.93, y: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  scale: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
                  default: { type: 'spring', stiffness: 450, damping: 24 },
                }}
                className="flex h-14 cursor-pointer items-center gap-2.5 rounded-full bg-neutral-900 px-8 text-base font-semibold text-white shadow-md transition-colors hover:bg-neutral-800"
              >
                <Play className="h-5 w-5 translate-x-[1px]" />
                <span>
                  {pomodoroPhase === 'focus'
                    ? pomodoroRound >= 4
                      ? 'Start Long Break'
                      : 'Start Break'
                    : 'Start Focus'}
                </span>
              </motion.button>
              <motion.button
                type="button"
                onClick={reset}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.92, y: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
                title="Stop Alarm"
              >
                <BellOff className="h-5 w-5" />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                type="button"
                onClick={reset}
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.93, y: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  scale: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
                  default: { type: 'spring', stiffness: 450, damping: 24 },
                }}
                className="flex h-14 cursor-pointer items-center gap-2.5 rounded-full bg-neutral-900 px-8 text-base font-semibold text-white shadow-md transition-colors hover:bg-neutral-800"
              >
                <BellOff className="h-5 w-5" />
                <span>Stop Alarm</span>
              </motion.button>
              <motion.button
                type="button"
                onClick={onStart}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.92, y: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-900"
                title="Restart timer"
              >
                <Play className="h-5 w-5 translate-x-[1px]" />
              </motion.button>
            </>
          )
        ) : status === 'running' ? (
          <motion.button
            type="button"
            onClick={pause}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.93, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="flex h-14 cursor-pointer items-center gap-2.5 rounded-full bg-neutral-900 px-9 text-base font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            <Pause className="h-5 w-5" />
            <span>Pause</span>
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={onStart}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.93, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="flex h-14 cursor-pointer items-center gap-2.5 rounded-full bg-neutral-900 px-9 text-base font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800"
          >
            <Play className="h-5 w-5 translate-x-[1px]" />
            <span>{status === 'paused' ? 'Resume' : 'Start'}</span>
          </motion.button>
        )}

        {mode === 'flow' && status === 'running' && (
          <motion.button
            type="button"
            onClick={recordLap}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.9, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-sky-500 hover:bg-sky-500 hover:text-white"
            title="Record Lap"
          >
            <Flag className="h-5 w-5" />
          </motion.button>
        )}

        {mode === 'flow' && (status === 'running' || status === 'paused') && (
          <motion.button
            type="button"
            onClick={() => completeCurrentSession(true)}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.9, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-emerald-600 hover:bg-emerald-600 hover:text-white"
            title="Finish session"
          >
            <Check className="h-5 w-5" />
          </motion.button>
        )}

        {(status === 'running' || status === 'paused') && (
          <motion.button
            type="button"
            onClick={reset}
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.9, y: 1 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:border-rose-500 hover:bg-rose-500 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="h-5 w-5" />
          </motion.button>
        )}

        <motion.button
          type="button"
          onClick={onTogglePip}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.93, y: 1 }}
          transition={{ type: 'spring', stiffness: 450, damping: 24 }}
          className={`flex h-14 cursor-pointer items-center gap-2 rounded-full border px-6 text-base font-medium shadow-xs transition-colors ${
            isPipOpen
              ? 'border-neutral-900 bg-neutral-900 text-white'
              : 'border-neutral-300 bg-white text-neutral-800 hover:border-amber-500 hover:bg-amber-500 hover:text-white'
          }`}
          title={isPipOpen ? 'Close Pop-up mode' : 'Open Pop-up mode'}
        >
          <PictureInPicture2 className="h-5 w-5" />
          <span>Pop-up</span>
        </motion.button>
      </div>

      {/* Stopwatch Laps List */}
      {mode === 'flow' && laps.length > 0 && (
        <div className="minimal-scroll max-h-36 w-full max-w-xs space-y-1 overflow-y-auto rounded-2xl border border-neutral-200/70 bg-white/80 p-2.5 text-xs">
          {laps.map((lap) => (
            <div
              key={lap.id}
              className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-neutral-600 odd:bg-neutral-50/70"
            >
              <span className="font-medium text-neutral-400">
                Lap {lap.lapNumber}
              </span>
              <span className="font-mono-timer text-neutral-500">
                +{formatStopwatchMs(lap.splitMs)}
              </span>
              <span className="font-mono-timer font-medium text-neutral-900">
                {formatStopwatchMs(lap.totalMs)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
