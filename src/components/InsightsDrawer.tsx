import { motion } from 'framer-motion';
import { Sparkles, X, Clock, Zap, Target } from 'lucide-react';
import { generateCoachRecommendations } from '../core/intelligence/coach';
import {
  buildDailyWorkLog,
  filterSessionsByDate,
} from '../core/intelligence/worklog';
import { useTimerStore } from '../store/useTimerStore';

interface InsightsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function InsightsDrawer({ open, onClose }: InsightsDrawerProps) {
  const sessions = useTimerStore((s) => s.sessions);
  const tasks = useTimerStore((s) => s.tasks);
  const setMode = useTimerStore((s) => s.setMode);

  if (!open) return null;

  const todaySessions = filterSessionsByDate(sessions);
  const workLog = buildDailyWorkLog(sessions, tasks);
  const recommendations = generateCoachRecommendations(todaySessions);
  const focusMinutes = Math.round(workLog.totalFocusSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px]">
      <div className="flex h-full w-full max-w-md flex-col bg-[#FAFAFA] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200/80 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-neutral-900" />
            <h2 className="text-sm font-semibold text-neutral-900">
              Smart Coach & Work Log
            </h2>
          </div>
          <motion.button
            type="button"
            onClick={onClose}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 24 }}
            className="cursor-pointer rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Today's Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Focus Today</span>
              </div>
              <div className="font-mono-timer mt-1.5 text-2xl font-medium text-neutral-900">
                {focusMinutes}
                <span className="ml-1 text-xs font-normal text-neutral-400">m</span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <Target className="h-3.5 w-3.5" />
                <span>Focus Score</span>
              </div>
              <div className="font-mono-timer mt-1.5 text-2xl font-medium text-neutral-900">
                {workLog.averageFocusScore}
                <span className="ml-0.5 text-xs font-normal text-neutral-400">%</span>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <Zap className="h-3.5 w-3.5" />
                <span>Distractions</span>
              </div>
              <div className="font-mono-timer mt-1.5 text-2xl font-medium text-neutral-900">
                {workLog.interruptionCount}
              </div>
            </div>
          </div>

          {/* Smart Coach Recommendations */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Smart Focus Coach
            </h3>
            <div className="space-y-2.5">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-neutral-200/80 bg-white p-4"
                >
                  <div className="text-sm font-medium text-neutral-900">
                    {rec.title}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                    {rec.message}
                  </p>
                  {rec.suggestedMode && (
                    <motion.button
                      type="button"
                      onClick={() => {
                        setMode(rec.suggestedMode!, rec.suggestedMinutes);
                        onClose();
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 24 }}
                      className="mt-3 cursor-pointer rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                    >
                      Apply suggestion
                      {rec.suggestedMinutes ? ` (${rec.suggestedMinutes}m)` : ''}
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Today's Task Breakdown */}
          <section className="space-y-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Time Log by Task ({workLog.dateKey})
            </h3>
            {workLog.byTask.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 p-6 text-center text-xs text-neutral-400">
                No time logged today yet. Start a timer to track automatically.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/80 bg-white">
                {workLog.byTask.map((item) => (
                  <div
                    key={item.taskTitle}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="truncate text-sm font-medium text-neutral-800">
                        {item.taskTitle}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}
                        {item.estimatedMinutes
                          ? ` · Est. ${item.estimatedMinutes}m`
                          : ''}
                      </div>
                    </div>
                    <div className="font-mono-timer shrink-0 text-sm font-medium text-neutral-900">
                      {item.actualMinutes}m
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
