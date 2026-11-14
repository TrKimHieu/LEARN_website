'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_STATE, parseState, type ReminderPermission, type ReminderState } from './reminder';

const KEY = 'learn.reminder';
const CHANGED = 'learn:reminder-changed';

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function readPermission(): ReminderPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/**
 * Trạng thái nhắc ôn của người học trên trình duyệt này. Lưu ở localStorage (chỉ là tiện ích của từng
 * trình duyệt); nhiều chỗ dùng chung qua một sự kiện, nên bật ở Cài đặt thì bộ theo dõi ở khung app biết ngay.
 */
export function useReminder() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const permission = useSyncExternalStore(subscribe, readPermission, () => 'default' as const);
  const state = useMemo(() => parseState(raw), [raw]);

  const save = useCallback((next: ReminderState) => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* chế độ riêng tư hoặc bị chặn: nhắc ôn chỉ hoạt động trong phiên này */
    }
    window.dispatchEvent(new Event(CHANGED));
  }, []);

  /** Bật: xin quyền khi người học chủ động bấm; chỉ bật khi trình duyệt cho phép. */
  const enable = useCallback(async () => {
    if (typeof Notification === 'undefined') return;
    const result =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    window.dispatchEvent(new Event(CHANGED));
    if (result === 'granted') save({ ...DEFAULT_STATE, ...state, enabled: true });
  }, [save, state]);

  const disable = useCallback(() => save({ ...state, enabled: false }), [save, state]);

  return { state, permission, save, enable, disable };
}
