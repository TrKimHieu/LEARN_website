import { BRAND } from '@learn/ui';
import { LogoMark } from './logo-mark';

/**
 * Khối thương hiệu: dấu hiệu + tên. Dùng ở sidebar và header mobile.
 *
 * `compact` bỏ phần chữ nhưng vẫn để lại tên cho trình đọc màn hình — nếu không,
 * ở header mobile sẽ chỉ còn một hình `aria-hidden` và khối này im lặng hoàn toàn.
 */
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={28} />
      {compact ? (
        <span className="sr-only">{BRAND.name}</span>
      ) : (
        <span className="font-semibold text-ink-900">{BRAND.name}</span>
      )}
    </span>
  );
}
