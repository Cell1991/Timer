import { describe, expect, it } from 'vitest';
import {
  computeClockSnapshot,
  formatDurationMs,
  formatStopwatchMs,
  parseDurationInput,
} from './clock';
import {
  computeFocusScore,
  generateCoachRecommendations,
} from './intelligence/coach';
import { buildDailyWorkLog, getLocalDateKey } from './intelligence/worklog';
import type { SessionRecord } from './types';

describe('computeClockSnapshot', () => {
  it('computes countdown progress and remaining time without drift', () => {
    const snap = computeClockSnapshot({
      plannedSeconds: 1500, // 25m
      accumulatedMs: 300_000, // 5m
      lastResumedAt: 1_000_000,
      now: 1_300_000, // +5m
    });

    expect(snap.elapsedMs).toBe(600_000);
    expect(snap.remainingMs).toBe(900_000);
    expect(snap.progress).toBeCloseTo(0.4, 5);
    expect(snap.isFinished).toBe(false);
  });

  it('marks finished when elapsed meets planned duration', () => {
    const snap = computeClockSnapshot({
      plannedSeconds: 60,
      accumulatedMs: 50_000,
      lastResumedAt: 10_000,
      now: 25_000,
    });

    expect(snap.remainingMs).toBe(0);
    expect(snap.progress).toBe(1);
    expect(snap.isFinished).toBe(true);
  });

  it('handles open-ended flow mode', () => {
    const snap = computeClockSnapshot({
      plannedSeconds: 0,
      accumulatedMs: 120_000,
      lastResumedAt: null,
      now: 500_000,
    });

    expect(snap.elapsedMs).toBe(120_000);
    expect(snap.isFinished).toBe(false);
  });
});

describe('time formatting', () => {
  it('formats countdown and stopwatch strings cleanly', () => {
    expect(formatDurationMs(25 * 60 * 1000)).toBe('25:00');
    expect(formatDurationMs(61_200)).toBe('01:02');
    expect(formatStopwatchMs(0)).toBe('00:00');
    expect(formatStopwatchMs(3661_000)).toBe('01:01:01');
  });

  it('parses typed duration inputs cleanly', () => {
    expect(parseDurationInput('25')).toBe(1500);
    expect(parseDurationInput('1.5')).toBe(90);
    expect(parseDurationInput('12:30')).toBe(750);
    expect(parseDurationInput('0:45')).toBe(45);
    expect(parseDurationInput('0.15')).toBe(15);
    expect(parseDurationInput('0.61')).toBe(61);
    expect(parseDurationInput('1.15')).toBe(75);
    expect(parseDurationInput('0.04')).toBe(4);
    expect(parseDurationInput('1:05:00')).toBe(3900);
    expect(parseDurationInput('4s')).toBe(4);
    expect(parseDurationInput('0m 4s')).toBe(4);
    expect(parseDurationInput('1m 30s')).toBe(90);
    expect(parseDurationInput('10 วิ')).toBe(10);
    expect(parseDurationInput('')).toBeNull();
    expect(parseDurationInput('0')).toBeNull();
    expect(parseDurationInput('12:99')).toBeNull();
  });
});

describe('intelligence coach & worklog', () => {
  const now = Date.now();
  const sampleSessions: SessionRecord[] = [
    {
      id: 's1',
      mode: 'focus',
      taskTitle: 'Design API',
      plannedSeconds: 1500,
      actualSeconds: 1500,
      startedAt: now - 1800_000,
      endedAt: now - 300_000,
      completedNormally: true,
      interruptions: [],
      ambientUsed: 'brown_noise',
    },
    {
      id: 's2',
      mode: 'focus',
      taskTitle: 'Design API',
      plannedSeconds: 1500,
      actualSeconds: 1500,
      startedAt: now - 3600_000,
      endedAt: now - 2100_000,
      completedNormally: true,
      interruptions: [],
      ambientUsed: 'brown_noise',
    },
  ];

  it('computes 100% focus score for uninterrupted completed sessions', () => {
    expect(computeFocusScore(sampleSessions)).toBe(100);
  });

  it('recommends flow state when 2+ uninterrupted focus sessions are done', () => {
    const recs = generateCoachRecommendations(sampleSessions);
    expect(recs.some((r) => r.type === 'flow_streak')).toBe(true);
  });

  it('aggregates daily worklog by task', () => {
    const log = buildDailyWorkLog(sampleSessions, [], getLocalDateKey(now));
    expect(log.totalFocusSeconds).toBe(3000);
    expect(log.sessionsCompleted).toBe(2);
    expect(log.byTask[0]?.taskTitle).toBe('Design API');
    expect(log.byTask[0]?.actualMinutes).toBe(50);
  });
});
