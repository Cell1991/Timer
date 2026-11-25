import type { DailyWorkLogSummary, SessionRecord, TaskItem } from '../types';
import { computeFocusScore } from './coach';

export function getLocalDateKey(timestamp = Date.now()): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function filterSessionsByDate(
  sessions: SessionRecord[],
  dateKey = getLocalDateKey(),
): SessionRecord[] {
  return sessions.filter((s) => getLocalDateKey(s.startedAt) === dateKey);
}

export function buildDailyWorkLog(
  sessions: SessionRecord[],
  tasks: TaskItem[],
  dateKey = getLocalDateKey(),
): DailyWorkLogSummary {
  const todaySessions = filterSessionsByDate(sessions, dateKey);

  let totalFocusSeconds = 0;
  let totalBreakSeconds = 0;
  let interruptionCount = 0;
  let sessionsCompleted = 0;

  const taskMap = new Map<
    string,
    { taskTitle: string; actualSeconds: number; estimatedMinutes?: number; sessions: number }
  >();

  for (const s of todaySessions) {
    if (s.mode === 'focus' || s.mode === 'flow') {
      totalFocusSeconds += s.actualSeconds;
      interruptionCount += s.interruptions.length;
      if (s.completedNormally || s.actualSeconds >= 60) {
        sessionsCompleted += 1;
      }

      const key = s.taskTitle?.trim() || 'General (Untagged)';
      const matchedTask = tasks.find((t) => t.id === s.taskId || t.title === key);
      const entry = taskMap.get(key) ?? {
        taskTitle: key,
        actualSeconds: 0,
        estimatedMinutes: matchedTask?.estimatedMinutes,
        sessions: 0,
      };
      entry.actualSeconds += s.actualSeconds;
      entry.sessions += 1;
      taskMap.set(key, entry);
    } else {
      totalBreakSeconds += s.actualSeconds;
    }
  }

  const byTask = Array.from(taskMap.values())
    .map((item) => ({
      taskTitle: item.taskTitle,
      actualMinutes: Math.max(1, Math.round(item.actualSeconds / 60)),
      estimatedMinutes: item.estimatedMinutes,
      sessions: item.sessions,
    }))
    .sort((a, b) => b.actualMinutes - a.actualMinutes);

  return {
    dateKey,
    totalFocusSeconds,
    totalBreakSeconds,
    sessionsCompleted,
    interruptionCount,
    averageFocusScore: computeFocusScore(todaySessions),
    byTask,
  };
}
