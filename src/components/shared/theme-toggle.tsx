'use client';

import { cn } from '@/components/ui/cn';
import { useTheme, type ThemePreference } from '@/lib/theme';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Tự động' },
  { value: 'light', label: 'Sáng' },
  { value: 'dark', label: 'Tối' },
];

/**
 * Bộ chọn 3 tông — nhóm radio gốc (Tab vào nhóm, mũi tên để đổi), trình bày dạng
 * segmented control chữ, không icon mặt trời/mặt trăng (ADR 012). "Tự động" đứng đầu vì
 * là mặc định. Dùng ở Cài đặt và trong menu tài khoản — không có công tắc ở top bar.
 */
export function ThemeSegmented({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();
  return (
    <fieldset className={cn('min-w-0', className)}>
      <legend className="sr-only">Giao diện</legend>
      <div className="grid grid-cols-3 gap-0.5 rounded-control bg-muted p-0.5">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={cn(
              'flex h-8 cursor-pointer items-center justify-center rounded-md text-xs font-medium transition-colors duration-150',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-fg',
              preference === o.value
                ? 'bg-panel text-fg shadow-card dark:bg-line-strong'
                : 'text-fg-subtle hover:text-fg',
            )}
          >
            <input
              type="radio"
              name="theme-preference"
              value={o.value}
              checked={preference === o.value}
              onChange={() => setPreference(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
