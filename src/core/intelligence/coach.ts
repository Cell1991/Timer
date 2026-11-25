import type { CoachRecommendation, SessionRecord } from '../types';

/**
 * Pure heuristic-based Smart Focus Coach (Phase 1).
 * Designed with a clean interface so an LLM / cloud or local model
 * can enrich or replace these recommendations in Phase 2.
 */
export function computeFocusScore(sessions: SessionRecord[]): number {
  const focusSessions = sessions.filter((s) => s.mode === 'focus' || s.mode === 'flow');
  if (focusSessions.length === 0) return 100;

  let totalScore = 0;
  for (const s of focusSessions) {
    let score = s.completedNormally ? 100 : 70;
    // Penalize each logged interruption
    score -= Math.min(40, s.interruptions.length * 12);
    // Reward self-rating if provided
    if (s.focusRating) {
      score = Math.round(score * 0.7 + s.focusRating * 20 * 0.3);
    }
    totalScore += Math.max(10, Math.min(100, score));
  }

  return Math.round(totalScore / focusSessions.length);
}

export function generateCoachRecommendations(
  sessionsToday: SessionRecord[],
): CoachRecommendation[] {
  const recommendations: CoachRecommendation[] = [];
  const focusSessions = sessionsToday.filter(
    (s) => s.mode === 'focus' || s.mode === 'flow',
  );

  if (focusSessions.length === 0) {
    recommendations.push({
      id: 'start-first',
      type: 'session_length',
      title: 'Ready for your first session',
      message: 'Start a short 25-minute session to build focus momentum and let the coach learn your rhythm.',
      suggestedMinutes: 25,
      suggestedMode: 'focus',
    });
    return recommendations;
  }

  // Check consecutive focus sessions without a break
  let consecutiveFocus = 0;
  for (const s of sessionsToday) {
    if (s.mode === 'focus' || s.mode === 'flow') {
      consecutiveFocus += 1;
    } else {
      break;
    }
  }

  if (consecutiveFocus >= 3) {
    recommendations.push({
      id: 'fatigue-long-break',
      type: 'fatigue_warning',
      title: 'Time for a longer break',
      message: `You've completed ${consecutiveFocus} consecutive focus sessions without a break. Take a 15-minute break to recharge.`,
      suggestedMinutes: 15,
      suggestedMode: 'long_break',
    });
  } else if (consecutiveFocus >= 1) {
    const latest = focusSessions[0];
    if (latest && latest.actualSeconds >= 20 * 60) {
      recommendations.push({
        id: 'short-break',
        type: 'break_suggestion',
        title: 'Good time for a short break',
        message: 'Rest your eyes for 5 minutes, stretch, or grab some water to stay sharp for the next session.',
        suggestedMinutes: 5,
        suggestedMode: 'short_break',
      });
    }
  }

  // Check interruption density
  const totalInterruptions = focusSessions.reduce(
    (sum, s) => sum + s.interruptions.length,
    0,
  );
  if (totalInterruptions >= 3 && focusSessions.length >= 2) {
    recommendations.push({
      id: 'shorter-blocks',
      type: 'session_length',
      title: 'Try shorter focus blocks',
      message: `${totalInterruptions} distractions logged today. Try shortening sessions to 15–20 minutes or turning on Brown Noise to block out noise.`,
      suggestedMinutes: 20,
      suggestedMode: 'focus',
    });
  } else if (focusSessions.length >= 2 && totalInterruptions === 0) {
    recommendations.push({
      id: 'flow-streak',
      type: 'flow_streak',
      title: 'Great Flow State',
      message: 'Zero distractions in your recent sessions. Try Stopwatch mode for uninterrupted deep work.',
      suggestedMode: 'flow',
    });
  }

  return recommendations;
}
