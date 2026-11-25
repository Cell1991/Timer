import { motion } from 'framer-motion';
import type { TimerMode } from '../core/types';
import { useTimerStore } from '../store/useTimerStore';

const MODES: Array<{ id: TimerMode; label: string }> = [
  { id: 'focus', label: 'Timer' },
  { id: 'flow', label: 'Stopwatch' },
];

export function ModeSelector() {
  const mode = useTimerStore((s) => s.mode);
  const modeStates = useTimerStore((s) => s.modeStates);
  const setMode = useTimerStore((s) => s.setMode);

  return (
    <div
      className="inline-flex items-center rounded-full border border-neutral-200 bg-white p-1.5 shadow-xs"
      role="tablist"
      aria-label="Timer mode"
    >
      {MODES.map((m) => {
        const active = mode === m.id;
        const tabStatus = modeStates[m.id].status;
        const showBgIndicator =
          !active && (tabStatus === 'running' || tabStatus === 'paused');

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
            className={`relative cursor-pointer rounded-full px-7 py-2.5 text-base font-medium transition-colors ${
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
            <span className="relative z-10 inline-flex items-center gap-2">
              {m.label}
              {showBgIndicator && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    tabStatus === 'running'
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
