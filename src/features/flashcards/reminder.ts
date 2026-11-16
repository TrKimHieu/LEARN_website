/** Quyền thông báo của trình duyệt, thêm `unsupported` cho trình duyệt không có Notification API. */
export type ReminderPermission = NotificationPermission | 'unsupported';

export interface ReminderState {
  /** Người học đã bật nhắc ôn (khác với việc trình duyệt cho phép hay chưa). */
  enabled: boolean;
  /** Lần thông báo gần nhất; `null` khi chưa thông báo hoặc đã ôn hết thẻ kể từ đó. */
  lastNotifiedAt: string | null;
}

export const DEFAULT_STATE: ReminderState = { enabled: false, lastNotifiedAt: null };

/** Giãn cách tối thiểu giữa hai thông báo khi thẻ vẫn còn đến hạn. */
export const COOLDOWN_MS = 3 * 60 * 60 * 1000;

/**
 * Có nên thông báo ngay bây giờ không. Chỉ khi người học đã bật, trình duyệt đã cho phép và còn thẻ đến
 * hạn; đã thông báo rồi thì chờ hết `COOLDOWN_MS`, nên mỗi lần hỏi lại số thẻ không bật thêm thông báo.
 */
export function shouldNotify(input: {
  permission: ReminderPermission;
  state: ReminderState;
  dueCount: number | undefined;
  now: Date;
}): boolean {
  const { permission, state, dueCount, now } = input;
  if (!state.enabled || permission !== 'granted' || !dueCount || dueCount < 1) return false;
  if (!state.lastNotifiedAt) return true;
  return now.getTime() - new Date(state.lastNotifiedAt).getTime() >= COOLDOWN_MS;
}

export function afterNotified(state: ReminderState, now: Date): ReminderState {
  return { ...state, lastNotifiedAt: now.toISOString() };
}

/** Ôn hết thẻ thì xóa mốc thông báo, để lần thẻ đến hạn kế tiếp được nhắc ngay. */
export function settle(state: ReminderState, dueCount: number | undefined): ReminderState {
  return dueCount === 0 && state.lastNotifiedAt ? { ...state, lastNotifiedAt: null } : state;
}

export function notificationText(dueCount: number): { title: string; body: string } {
  return { title: 'Đến giờ ôn thẻ', body: `${dueCount} thẻ đến hạn` };
}

/** Đọc trạng thái đã lưu; dữ liệu thiếu hoặc hỏng thì coi như đang tắt. */
export function parseState(raw: string | null): ReminderState {
  if (!raw) return DEFAULT_STATE;
  try {
    const value = JSON.parse(raw) as Partial<ReminderState>;
    if (typeof value.enabled !== 'boolean') return DEFAULT_STATE;
    return {
      enabled: value.enabled,
      lastNotifiedAt: typeof value.lastNotifiedAt === 'string' ? value.lastNotifiedAt : null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}
