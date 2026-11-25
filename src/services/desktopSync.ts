import type { TimerMode, TimerStatus } from '../core/types';
import { useTimerStore } from '../store/useTimerStore';

export interface TempoDesktopBridge {
  isDesktop: boolean;
  openWidget: () => Promise<boolean>;
  closeWidget: () => Promise<boolean>;
  isWidgetOpen: () => Promise<boolean>;
  focusMain: () => Promise<void>;
  onWidgetStateChange: (cb: (isOpen: boolean) => void) => () => void;
}

declare global {
  interface Window {
    tempoDesktop?: TempoDesktopBridge;
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.tempoDesktop?.isDesktop);
}

export interface SyncedTimerSnapshot {
  mode: TimerMode;
  status: TimerStatus;
  plannedSeconds: number;
  accumulatedMs: number;
  lastResumedAt: number | null;
  activeTaskTitle: string;
  interruptionsCount: number;
}

export type WidgetAction =
  | 'startOrResume'
  | 'pause'
  | 'reset'
  | 'logInterruption'
  | 'completeCurrentSession';

type SyncMessage =
  | { type: 'SYNC_STATE'; payload: SyncedTimerSnapshot }
  | { type: 'REQUEST_SYNC' }
  | { type: 'DISPATCH_ACTION'; action: WidgetAction };

const CHANNEL_NAME = 'tempo-timer-sync';

export function getSnapshotFromStore(): SyncedTimerSnapshot {
  const s = useTimerStore.getState();
  return {
    mode: s.mode,
    status: s.status,
    plannedSeconds: s.plannedSeconds,
    accumulatedMs: s.accumulatedMs,
    lastResumedAt: s.lastResumedAt,
    activeTaskTitle: s.activeTaskTitle,
    interruptionsCount: s.interruptions.length,
  };
}

/**
 * Runs on the main window: broadcasts store updates to any open widget window
 * and executes action commands sent back from the widget.
 */
export function initMainSyncHost(): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel(CHANNEL_NAME);

  const broadcast = () => {
    channel.postMessage({
      type: 'SYNC_STATE',
      payload: getSnapshotFromStore(),
    } satisfies SyncMessage);
  };

  const unsubscribe = useTimerStore.subscribe(broadcast);

  channel.onmessage = (event: MessageEvent<SyncMessage>) => {
    const msg = event.data;
    if (!msg) return;

    if (msg.type === 'REQUEST_SYNC') {
      broadcast();
      return;
    }

    if (msg.type === 'DISPATCH_ACTION') {
      const store = useTimerStore.getState();
      switch (msg.action) {
        case 'startOrResume':
          store.startOrResume();
          break;
        case 'pause':
          store.pause();
          break;
        case 'reset':
          store.reset();
          break;
        case 'logInterruption':
          store.logInterruption('distraction');
          break;
        case 'completeCurrentSession':
          store.completeCurrentSession(true);
          break;
      }
    }
  };

  return () => {
    unsubscribe();
    channel.close();
  };
}

/**
 * Runs on the floating widget window: subscribes to state from the main window
 * and dispatches actions back to the main window.
 */
export function connectWidgetSyncClient(
  onState: (snapshot: SyncedTimerSnapshot) => void,
): {
  dispatch: (action: WidgetAction) => void;
  cleanup: () => void;
} {
  if (typeof BroadcastChannel === 'undefined') {
    return { dispatch: () => {}, cleanup: () => {} };
  }

  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = (event: MessageEvent<SyncMessage>) => {
    const msg = event.data;
    if (msg?.type === 'SYNC_STATE') {
      onState(msg.payload);
    }
  };

  channel.postMessage({ type: 'REQUEST_SYNC' } satisfies SyncMessage);

  return {
    dispatch: (action) => {
      channel.postMessage({
        type: 'DISPATCH_ACTION',
        action,
      } satisfies SyncMessage);
    },
    cleanup: () => {
      channel.close();
    },
  };
}
