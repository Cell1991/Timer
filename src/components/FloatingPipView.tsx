import { motion } from 'framer-motion';
import { BellOff, BellRing, Check, Pause, Play, RotateCcw } from 'lucide-react';
import { useClockTick } from '../hooks/useClockTick';
import { useTimerStore } from '../store/useTimerStore';

interface FloatingPipViewProps {
  onClosePip: () => void;
}

export function FloatingPipView({ onClosePip: _onClosePip }: FloatingPipViewProps) {
  const mode = useTimerStore((s) => s.mode);
  const status = useTimerStore((s) => s.status);
  const activeTaskTitle = useTimerStore((s) => s.activeTaskTitle);
  const startOrResume = useTimerStore((s) => s.startOrResume);
  const pause = useTimerStore((s) => s.pause);
  const reset = useTimerStore((s) => s.reset);
  const completeCurrentSession = useTimerStore((s) => s.completeCurrentSession);

  const { snapshot, formattedTime } = useClockTick();

  const progress =
    mode === 'flow'
      ? status === 'running'
        ? 0.28
        : 0
      : status === 'idle'
        ? 0
        : status === 'completed'
          ? 1
          : snapshot.progress;

  const ringSize = 42;
  const center = ringSize / 2;
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);

  const subtitle =
    status === 'completed'
      ? "Time's Up!"
      : activeTaskTitle
        ? activeTaskTitle
        : mode === 'flow'
          ? 'Stopwatch'
          : 'Timer';

  return (
    <div className="relative flex h-screen w-screen items-center justify-between gap-3 bg-[#FAFAFA] px-4 text-neutral-900 select-none">
      {/* Left: Mini Precision Watch Dial + Time */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center">
          {/* Subtle ripple when completed */}
          {status === 'completed' && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full border border-neutral-900/35"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 1.32, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeOut' }}
            />
          )}

          <svg
            className="h-full w-full -rotate-90"
            viewBox={`0 0 ${ringSize} ${ringSize}`}
            aria-hidden="true"
          >
            {/* Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth="2.75"
              className="stroke-neutral-200/90"
            />
            {/* 12 dial ticks */}
            {ticks.map((deg) => {
              const rad = (deg * Math.PI) / 180;
              const r1 = radius - 4.5;
              const r2 = radius - 3;
              return (
                <line
                  key={deg}
                  x1={center + r1 * Math.cos(rad)}
                  y1={center + r1 * Math.sin(rad)}
                  x2={center + r2 * Math.cos(rad)}
                  y2={center + r2 * Math.sin(rad)}
                  strokeWidth={deg % 90 === 0 ? 1.2 : 0.8}
                  strokeLinecap="round"
                  className={
                    deg % 90 === 0
                      ? 'stroke-neutral-400/80'
                      : 'stroke-neutral-300/70'
                  }
                />
              );
            })}
            {/* Progress arc */}
            <motion.circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={
                status === 'completed'
                  ? { strokeDashoffset: 0, opacity: [1, 0.25, 1] }
                  : { strokeDashoffset: dashOffset, opacity: 1 }
              }
              transition={
                status === 'completed'
                  ? {
                      strokeDashoffset: { duration: 0.2 },
                      opacity: { repeat: Infinity, duration: 1.1, ease: 'easeInOut' },
                    }
                  : status === 'running'
                    ? { duration: 0 }
                    : { duration: 0.2, ease: 'easeOut' }
              }
              className="stroke-neutral-900"
            />
          </svg>

          {/* Center indicator */}
          {status === 'completed' ? (
            <motion.span
              animate={{ rotate: [0, -16, 16, -12, 12, 0] }}
              transition={{
                repeat: Infinity,
                repeatDelay: 0.4,
                duration: 0.6,
              }}
              className="absolute text-neutral-900"
            >
              <BellRing className="h-3.5 w-3.5" />
            </motion.span>
          ) : (
            <motion.span
              animate={
                status === 'running'
                  ? { scale: [1, 1.35, 1], opacity: [0.9, 0.45, 0.9] }
                  : { scale: 1, opacity: 0.85 }
              }
              transition={
                status === 'running'
                  ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
                  : { duration: 0.2 }
              }
              className="absolute h-1.5 w-1.5 rounded-full bg-neutral-900"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-col">
          <span className="font-mono-timer text-[26px] leading-none font-medium tracking-tight text-neutral-900">
            {formattedTime}
          </span>
          <span
            className={`mt-1 truncate text-[10px] leading-none font-medium tracking-[0.12em] uppercase ${
              status === 'completed' ? 'text-neutral-900' : 'text-neutral-400'
            }`}
          >
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Tactile Minimal Controls */}
      <div className="flex shrink-0 items-center gap-1.5">
        {status === 'completed' ? (
          <>
            <motion.button
              type="button"
              onClick={reset}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{
                scale: { repeat: Infinity, duration: 1.1, ease: 'easeInOut' },
                default: { type: 'spring', stiffness: 450, damping: 24 },
              }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition-colors hover:bg-neutral-800"
              title="Stop Alarm"
            >
              <BellOff className="h-4 w-4" />
            </motion.button>
            <motion.button
              type="button"
              onClick={startOrResume}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 450, damping: 24 }}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
              title="Restart"
            >
              <Play className="h-3.5 w-3.5 translate-x-[0.5px]" />
            </motion.button>
          </>
        ) : (
          <>
            {status === 'running' ? (
              <motion.button
                type="button"
                onClick={pause}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition-colors hover:bg-neutral-800"
                title="Pause"
              >
                <Pause className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={startOrResume}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-white shadow-sm transition-colors hover:bg-neutral-800"
                title="Start"
              >
                <Play className="h-4 w-4 translate-x-[0.5px]" />
              </motion.button>
            )}

            {mode === 'flow' && (status === 'running' || status === 'paused') ? (
              <motion.button
                type="button"
                onClick={() => completeCurrentSession(true)}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                title="Finish session"
              >
                <Check className="h-4 w-4" />
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={reset}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-2xs transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                title="Reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
