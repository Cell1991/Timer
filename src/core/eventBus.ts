import type {
  AmbientPreset,
  InterruptionEvent,
  SessionRecord,
  TimerMode,
} from './types';

export type DomainEventMap = {
  'timer:started': {
    sessionId: string;
    mode: TimerMode;
    plannedSeconds: number;
    taskTitle?: string;
    timestamp: number;
  };
  'timer:paused': {
    sessionId: string;
    elapsedSeconds: number;
    timestamp: number;
  };
  'timer:resumed': {
    sessionId: string;
    elapsedSeconds: number;
    timestamp: number;
  };
  'timer:interrupted': {
    sessionId: string;
    event: InterruptionEvent;
  };
  'timer:completed': {
    session: SessionRecord;
  };
  'timer:reset': {
    mode: TimerMode;
    timestamp: number;
  };
  'mode:changed': {
    from: TimerMode;
    to: TimerMode;
  };
  'ambient:changed': {
    preset: AmbientPreset;
  };
  'ambient:mix_changed': {
    mix: Partial<Record<string, number>>;
    muted: boolean;
  };
};

type Listener<T> = (payload: T) => void;

/**
 * Lightweight typed EventBus.
 * Decouples the timer engine from UI, Sound, PiP, and future AI/Telemetry plugins.
 */
class TypedEventBus {
  private listeners = new Map<keyof DomainEventMap, Set<Listener<never>>>();

  on<K extends keyof DomainEventMap>(
    event: K,
    listener: Listener<DomainEventMap[K]>,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => {
      set?.delete(listener as Listener<never>);
    };
  }

  emit<K extends keyof DomainEventMap>(
    event: K,
    payload: DomainEventMap[K],
  ): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of set) {
      (listener as Listener<DomainEventMap[K]>)(payload);
    }
  }
}

export const eventBus = new TypedEventBus();
