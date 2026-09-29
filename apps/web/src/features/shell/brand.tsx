import { BRAND } from '@learn/ui';
import { cn } from '@/components/ui/cn';
import { LogoMark } from './logo-mark';

/**
 * Khối thương hiệu: dấu hiệu + tên. `compact` bỏ phần chữ nhưng vẫn để tên cho trình
 * đọc màn hình. `tone="dark"` cho nền navy (sidebar, màn đăng nhập).
 */
export function Brand({
  compact = false,
  tone = 'light',
  className,
}: {
  compact?: boolean;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark size={26} />
      {compact ? (
        <span className="sr-only">{BRAND.name}</span>
      ) : (
        <span
          className={cn(
            'text-[0.9375rem] font-semibold tracking-[0.06em]',
            tone === 'dark' ? 'text-white' : 'text-fg',
          )}
        >
          {BRAND.name}
        </span>
      )}
    </span>
  );
}
