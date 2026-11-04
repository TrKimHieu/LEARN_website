import { BRAND } from '@/lib/brand';
import { cn } from '@/components/ui/cn';

/**
 * Tên thương hiệu dạng chữ, chỉ dùng ở màn đăng nhập/đăng ký. Không kèm hình mascot: mascot chỉ
 * xuất hiện khi có trạng thái để thể hiện. `tone="dark"` cho nền tối cố định.
 */
export function Brand({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-[0.9375rem] font-semibold tracking-[0.14em]',
        tone === 'dark' ? 'text-white' : 'text-fg',
        className,
      )}
    >
      {BRAND.name}
    </span>
  );
}
