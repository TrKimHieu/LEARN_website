import { BRAND } from '@/lib/brand';
import { cn } from '@/components/ui/cn';
import { LogoMark } from './logo-mark';

/**
 * Khối thương hiệu: dấu hiệu + gạch dọc mảnh + tên — nhịp "logo | tên đơn vị" của ảnh tham chiếu
 * (ADR 018). `compact` bỏ phần chữ nhưng vẫn để tên cho trình đọc màn hình. `tone="dark"` cho nền
 * tối cố định.
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
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark size={26} />
      {compact ? (
        <span className="sr-only">{BRAND.name}</span>
      ) : (
        <>
          <span
            aria-hidden
            className={cn('h-5 w-px', tone === 'dark' ? 'bg-white/40' : 'bg-fg/25')}
          />
          <span
            className={cn(
              'text-[0.9375rem] font-semibold tracking-[0.14em]',
              tone === 'dark' ? 'text-white' : 'text-fg',
            )}
          >
            {BRAND.name}
          </span>
        </>
      )}
    </span>
  );
}
