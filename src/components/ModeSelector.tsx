import { motion } from 'framer-motion';
import type { TimerMode } from '../core/types';
import { useTimerStore } from '../store/useTimerStore';

const MODES: Array<{ id: TimerMode; label: string }> = [
  { id: 'focus', label: 'Timer' },
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'interval', label: 'Interval' },
  { id: 'flow', label: 'Stopwatch' },
  { id: 'sleep', label: 'Sleep' },
];

export function ModeSelector() {
  const mode = useTimerStore((s) => s.mode);
  const setMode = useTimerStore((s) => s.setMode);

  return (
    <div
      className="inline-flex flex-wrap items-center justify-center rounded-full border border-neutral-200 bg-white p-1 shadow-xs"
      role="tablist"
      aria-label="Timer mode"
    >
      {MODES.map((m) => {
        const active = mode === m.id;

        return (
          <motion.button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setMode(m.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className={`relative cursor-pointer rounded-full px-3.5 py-2 text-xs font-medium transition-colors sm:px-5 sm:text-sm ${
              active
                ? 'text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {active && (
              <motion.span
                layoutId="mode-active-pill"
                transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.8 }}
                className="absolute inset-0 rounded-full bg-neutral-900 shadow-sm"
              />
            )}
            <span className="relative z-10">{m.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
