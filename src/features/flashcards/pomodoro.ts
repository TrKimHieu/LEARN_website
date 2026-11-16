export interface PomodoroSettings {
  focusMin: number;
  breakMin: number;
}

export const DEFAULT_SETTINGS: PomodoroSettings = { focusMin: 25, breakMin: 5 };

export type Phase = 'focus' | 'break';

/** Đang chạy thì giữ mốc kết thúc (`endsAt`); dừng thì giữ thời gian còn lại. Không đếm theo tick. */
export interface TimerState {
  phase: Phase;
  running: boolean;
  endsAt: number | null;
  remainingMs: number;
}

const MIN = 60_000;

function minutes(value: unknown, fallback: number, max: number): number {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(1, Math.round(n)));
}

/** Cài đặt đọc từ trình duyệt hoặc ô nhập: phút nguyên, học 1–120, nghỉ 1–60; giá trị hỏng về mặc định. */
export function normalizeSettings(raw: unknown): PomodoroSettings {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    focusMin: minutes(v.focusMin, DEFAULT_SETTINGS.focusMin, 120),
    breakMin: minutes(v.breakMin, DEFAULT_SETTINGS.breakMin, 60),
  };
}

const lengthOf = (phase: Phase, s: PomodoroSettings) =>
  (phase === 'focus' ? s.focusMin : s.breakMin) * MIN;

export function initialState(settings: PomodoroSettings, phase: Phase = 'focus'): TimerState {
  return { phase, running: false, endsAt: null, remainingMs: lengthOf(phase, settings) };
}

export function remaining(state: TimerState, now: number): number {
  return state.running && state.endsAt !== null
    ? Math.max(0, state.endsAt - now)
    : state.remainingMs;
}

export function start(state: TimerState, now: number): TimerState {
  if (state.running) return state;
  return { ...state, running: true, endsAt: now + state.remainingMs };
}

export function pause(state: TimerState, now: number): TimerState {
  if (!state.running) return state;
  return { ...state, running: false, endsAt: null, remainingMs: remaining(state, now) };
}

/** Hết giờ thì sang giai đoạn kia (dừng sẵn, chờ người học bấm bắt đầu) và báo giai đoạn vừa xong. */
export function advance(
  state: TimerState,
  settings: PomodoroSettings,
  now: number,
): { state: TimerState; finished: Phase | null } {
  if (!state.running || remaining(state, now) > 0) return { state, finished: null };
  const next: Phase = state.phase === 'focus' ? 'break' : 'focus';
  return { state: initialState(settings, next), finished: state.phase };
}

/** Đọc bộ đếm đã lưu để tải lại trang vẫn đúng giờ; dữ liệu hỏng thì bỏ. */
export function parseTimer(raw: string | null): TimerState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<TimerState>;
    const okPhase = v.phase === 'focus' || v.phase === 'break';
    const okEnds = v.endsAt === null || typeof v.endsAt === 'number';
    if (!okPhase || typeof v.running !== 'boolean' || !okEnds) return null;
    if (typeof v.remainingMs !== 'number' || v.remainingMs < 0) return null;
    return { phase: v.phase!, running: v.running, endsAt: v.endsAt ?? null, remainingMs: v.remainingMs };
  } catch {
    return null;
  }
}

export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Số phiên học đã xong trong một ngày (lịch máy người học). */
export interface DayCount {
  date: string;
  done: number;
}

export function todayKey(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** Sang ngày mới thì đếm lại từ 0; chỉ phiên học (không tính phiên nghỉ) được cộng. */
export function countFocus(day: DayCount | null, finished: Phase | null, today: string): DayCount {
  const base = day?.date === today ? day : { date: today, done: 0 };
  return finished === 'focus' ? { ...base, done: base.done + 1 } : base;
}

/** Phần đã trôi của giai đoạn hiện tại, 0 đến 1, để vẽ vòng tiến độ. */
export function elapsedFraction(state: TimerState, settings: PomodoroSettings, now: number): number {
  const total = lengthOf(state.phase, settings);
  return total <= 0 ? 0 : Math.min(1, Math.max(0, 1 - remaining(state, now) / total));
}
