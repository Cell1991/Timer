import { useEffect, useState } from 'react';
import {
  computeClockSnapshot,
  formatDurationMs,
  formatStopwatchMs,
  type ClockSnapshot,
} from '../core/clock';
import { useTimerStore } from '../store/useTimerStore';

/**
 * Subscribes to wall-clock updates via requestAnimationFrame when visible (60fps smooth)
 * with a background interval fallback and immediate visibilitychange/focus sync
 * so returning from a minimized or background tab never warps or lags.
 */
export function useClockTick(): {
  snapshot: ClockSnapshot;
  formattedTime: string;
} {
  const mode = useTimerStore((s) => s.mode);
  const status = useTimerStore((s) => s.status);
  const plannedSeconds = useTimerStore((s) => s.plannedSeconds);
  const accumulatedMs = useTimerStore((s) => s.accumulatedMs);
  const lastResumedAt = useTimerStore((s) => s.lastResumedAt);
  const modeStates = useTimerStore((s) => s.modeStates);
  const completeCurrentSession = useTimerStore((s) => s.completeCurrentSession);
  const completeSessionForMode = useTimerStore((s) => s.completeSessionForMode);

  const [now, setNow] = useState(() => Date.now());

  // Keep any background countdown modes completing on schedule even when another mode is viewed
  const hasRunningBackgroundCountdown = Object.entries(modeStates).some(
    ([m, s]) => m !== mode && s.status === 'running' && s.plannedSeconds > 0,
  );

  useEffect(() => {
    if (!hasRunningBackgroundCountdown) return;
    const id = window.setInterval(() => {
      const current = Date.now();
      const states = useTimerStore.getState().modeStates;
      const activeMode = useTimerStore.getState().mode;
      for (const [m, s] of Object.entries(states)) {
        if (m === activeMode || s.status !== 'running' || s.plannedSeconds <= 0) {
          continue;
        }
        const snap = computeClockSnapshot({
          plannedSeconds: s.plannedSeconds,
          accumulatedMs: s.accumulatedMs,
          lastResumedAt: s.lastResumedAt,
          now: current,
        });
        if (snap.isFinished) {
          completeSessionForMode(m as typeof mode, true);
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [hasRunningBackgroundCountdown, completeSessionForMode]);

  useEffect(() => {
    setNow(Date.now());
    if (status !== 'running') return;

    let rafId: number | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const current = Date.now();
      const snap = computeClockSnapshot({
        plannedSeconds,
        accumulatedMs,
        lastResumedAt,
        now: current,
      });

      if (snap.isFinished && plannedSeconds > 0) {
        completeCurrentSession(true);
        return;
      }

      setNow(current);

      if (document.visibilityState !== 'hidden') {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const startRaf = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState !== 'hidden') {
        tick();
      }
    };

    // Start 60fps updates when visible
    if (document.visibilityState !== 'hidden') {
      startRaf();
    }

    // Background fallback so completion still fires if tab stays hidden
    const intervalId = window.setInterval(() => {
      const current = Date.now();
      const snap = computeClockSnapshot({
        plannedSeconds,
        accumulatedMs,
        lastResumedAt,
        now: current,
      });
      if (snap.isFinished && plannedSeconds > 0) {
        completeCurrentSession(true);
        return;
      }
      if (document.visibilityState === 'hidden') {
        setNow(current);
      }
    }, 1000);

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      cancelled = true;
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [status, plannedSeconds, accumulatedMs, lastResumedAt, completeCurrentSession]);

  const snapshot = computeClockSnapshot({
    plannedSeconds,
    accumulatedMs,
    lastResumedAt,
    now,
  });

  const formattedTime =
    mode === 'flow'
      ? formatStopwatchMs(snapshot.elapsedMs)
      : formatDurationMs(
          status === 'idle' ? plannedSeconds * 1000 : snapshot.remainingMs,
        );

  return { snapshot, formattedTime };
}
