import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, RotateCcw, X } from 'lucide-react';
import {
  computeClockSnapshot,
  formatDurationMs,
  formatStopwatchMs,
} from '../core/clock';
import type { TimerMode } from '../core/types';
import {
  connectWidgetSyncClient,
  getSnapshotFromStore,
  type SyncedTimerSnapshot,
  type WidgetAction,
} from '../services/desktopSync';

const MODE_RING: Record<TimerMode, { stroke: string; dot: string }> = {
  focus: { stroke: 'stroke-neutral-900', dot: 'bg-neutral-900' },
  short_break: { stroke: 'stroke-emerald-600', dot: 'bg-emerald-600' },
  long_break: { stroke: 'stroke-sky-600', dot: 'bg-sky-600' },
  flow: { stroke: 'stroke-amber-500', dot: 'bg-amber-500' },
};

export function DesktopWidgetView() {
  const [state, setState] = useState<SyncedTimerSnapshot>(() =>
    getSnapshotFromStore(),
  );
  const [now, setNow] = useState(() => Date.now());
  const dispatchRef = useRef<(action: WidgetAction) => void>(() => {});

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    document.body.style.overflow = 'hidden';

    const { dispatch, cleanup } = connectWidgetSyncClient((nextState) => {
      setState(nextState);
      setNow(Date.now());
    });
    dispatchRef.current = dispatch;
    return cleanup;
  }, []);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [state.status]);

  const snap = computeClockSnapshot({
    plannedSeconds: state.plannedSeconds,
    accumulatedMs: state.accumulatedMs,
    lastResumedAt: state.lastResumedAt,
    now,
  });

  const formattedTime =
    state.mode === 'flow'
      ? formatStopwatchMs(snap.elapsedMs)
      : formatDurationMs(
          state.status === 'idle'
            ? state.plannedSeconds * 1000
            : snap.remainingMs,
        );

  const ring = MODE_RING[state.mode];
  const r = 10;
  const circ = 2 * Math.PI * r;
  const progress =
    state.mode === 'flow'
      ? state.status === 'running'
        ? 0.35
        : 0
      : state.status === 'idle'
        ? 0
        : snap.progress;
  const dashOffset = circ * (1 - progress);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-transparent p-3 select-none">
      <div className="app-drag group relative flex h-[58px] w-full items-center justify-between gap-2.5 rounded-full border border-neutral-200/90 bg-[#FAFAFA]/95 px-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md">
        {/* Left: Mini Progress Ring + Crisp Timer */}
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
            <svg className="-rotate-90 h-6 w-6" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r={r}
                fill="none"
                strokeWidth="2"
                className="stroke-neutral-200"
              />
              <circle
                cx="12"
                cy="12"
                r={r}
                fill="none"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dashOffset}
                className={`transition-all duration-300 ${ring.stroke}`}
              />
            </svg>
            <span className={`absolute h-1.5 w-1.5 rounded-full ${ring.dot}`} />
          </div>

          <div className="flex min-w-0 flex-col">
            <span className="font-mono-timer text-[22px] leading-none font-medium tracking-tight text-neutral-900">
              {formattedTime}
            </span>
            {state.activeTaskTitle && (
              <span className="mt-0.5 max-w-[100px] truncate text-[9px] leading-none text-neutral-400">
                {state.activeTaskTitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Minimal Controls */}
        <div className="app-no-drag flex shrink-0 items-center gap-1">
          {state.status === 'running' ? (
            <button
              type="button"
              onClick={() => dispatchRef.current('pause')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-xs transition hover:bg-neutral-800 active:scale-95"
              title="Pause"
            >
              <Pause className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatchRef.current('startOrResume')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white shadow-xs transition hover:bg-neutral-800 active:scale-95"
              title="Start"
            >
              <Play className="h-3.5 w-3.5 translate-x-[0.5px]" />
            </button>
          )}

          {state.mode === 'flow' &&
          (state.status === 'running' || state.status === 'paused') ? (
            <button
              type="button"
              onClick={() => dispatchRef.current('completeCurrentSession')}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-emerald-600 transition hover:bg-emerald-50 active:scale-95"
              title="Finish session"
            >
              <Check className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatchRef.current('reset')}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 transition hover:border-neutral-300 hover:text-neutral-800 active:scale-95"
              title="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            onClick={() => void window.tempoDesktop?.closeWidget()}
            className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-300 opacity-0 transition group-hover:opacity-100 hover:bg-neutral-200/70 hover:text-neutral-700"
            title="Close Widget"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
