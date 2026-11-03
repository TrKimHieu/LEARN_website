'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Tông sáng/tối — ADR 011.
 *
 * Ba lựa chọn: `light` · `dark` · `system` (mặc định — theo hệ điều hành). Lựa chọn
 * là tiện ích của riêng người xem trên riêng thiết bị này, nên sống trong
 * `localStorage`; mọi lần đọc/ghi đều bọc try/catch vì cửa sổ ẩn danh hay site data
 * bị chặn sẽ làm accessor ném lỗi — khi đó app vẫn chạy, chỉ không nhớ lựa chọn.
 *
 * Tông được đặt lên `<html data-theme>` bởi `THEME_SCRIPT` chạy trong `<head>` TRƯỚC
 * lần vẽ đầu tiên, nên không có một nhịp trắng loá khi người dùng chế độ tối tải trang.
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'learn-theme';

/** Chạy nội tuyến trong `<head>` — phải là JS thuần, không phụ thuộc bundle. */
export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem('${STORAGE_KEY}');var d=p==='dark'||(p!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){document.documentElement.dataset.theme=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}})();`;

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemTheme(): ResolvedTheme {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>('system');
  const [resolved, setResolved] = useState<ResolvedTheme>('light');

  // Đồng bộ state với thứ script trong <head> đã áp.
  useEffect(() => {
    setPref(readPreference());
    setResolved(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  }, []);

  // "Hệ thống" phải theo kịp khi người dùng đổi tông hệ điều hành lúc trang đang mở.
  useEffect(() => {
    const apply = () => {
      const next = preference === 'system' ? systemTheme() : preference;
      document.documentElement.dataset.theme = next;
      setResolved(next);
    };
    apply();
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPref(next);
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // không lưu được — vẫn áp cho phiên hiện tại
    }
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference }),
    [preference, resolved, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme phải được dùng bên trong <ThemeProvider>.');
  return ctx;
}
