export const TODAY_KEY = 'learn.today';

export function todayKey(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA');
}

/** Marks a task done in today's saved plan; no-op on another day. Swallows storage errors. */
export function markTodayDone(taskId: string): void {
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (!raw) return;
    const plan = JSON.parse(raw) as { day?: unknown; done?: unknown };
    if (plan?.day !== todayKey() || !Array.isArray(plan.done) || plan.done.includes(taskId)) return;
    localStorage.setItem(TODAY_KEY, JSON.stringify({ ...plan, done: [...plan.done, taskId] }));
  } catch {
    // storage unavailable or corrupt: progress tracking is best-effort
  }
}
