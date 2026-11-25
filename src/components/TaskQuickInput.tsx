import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';

export function TaskQuickInput() {
  const activeTaskId = useTimerStore((s) => s.activeTaskId);
  const activeTaskTitle = useTimerStore((s) => s.activeTaskTitle);
  const tasks = useTimerStore((s) => s.tasks);
  const setActiveTask = useTimerStore((s) => s.setActiveTask);
  const addTask = useTimerStore((s) => s.addTask);
  const deleteTask = useTimerStore((s) => s.deleteTask);

  const [openList, setOpenList] = useState(false);
  const [estMinutes, setEstMinutes] = useState('');

  const handleSaveTask = () => {
    const trimmed = activeTaskTitle.trim();
    if (!trimmed) return;
    const est = estMinutes ? parseInt(estMinutes, 10) : undefined;
    addTask(trimmed, est && est > 0 ? est : undefined);
    setEstMinutes('');
    setOpenList(false);
  };

  return (
    <div className="relative w-full max-w-sm">
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition focus-within:border-neutral-400">
        <input
          type="text"
          value={activeTaskTitle}
          onChange={(e) => setActiveTask(null, e.target.value)}
          onFocus={() => tasks.length > 0 && setOpenList(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveTask();
            } else if (e.key === 'Escape') {
              setOpenList(false);
            }
          }}
          placeholder="What are you focusing on? (optional)"
          className="w-full bg-transparent text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
        />

        {activeTaskTitle.trim() && !activeTaskId && (
          <button
            type="button"
            onClick={handleSaveTask}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-600 transition hover:bg-neutral-200 hover:text-neutral-900"
            title="Save as a task to track actual time"
          >
            <Plus className="h-3 w-3" />
            Save
          </button>
        )}

        {activeTaskTitle && (
          <button
            type="button"
            onClick={() => setActiveTask(null, '')}
            className="shrink-0 text-neutral-400 transition hover:text-neutral-700"
            title="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {openList && tasks.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-neutral-400">
            <span>Saved Tasks</span>
            <button
              type="button"
              onClick={() => setOpenList(false)}
              className="hover:text-neutral-700"
            >
              Close
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto">
            {tasks.slice(0, 6).map((t) => (
              <div
                key={t.id}
                className="group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-neutral-50"
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTask(t.id, t.title);
                    setOpenList(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  {activeTaskId === t.id && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-neutral-900" />
                  )}
                  <span className="truncate text-neutral-700">{t.title}</span>
                  {t.estimatedMinutes && (
                    <span className="shrink-0 text-[11px] text-neutral-400">
                      ~{t.estimatedMinutes}m
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
                  className="ml-2 opacity-0 transition group-hover:opacity-100 text-neutral-300 hover:text-red-500"
                  title="Delete task"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
