import { cn } from './cn';
import { Icon, type IconName } from './icon';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

// Viên thuốc pastel, không viền — ADR 013. Chữ thường 12px (không in hoa giãn chữ:
// tiếng Việt có dấu viết hoa ở cỡ nhỏ khó đọc). Mọi cặp chữ/nền đã đo ≥ 4.98:1.
const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-muted text-fg-muted',
  info: 'bg-accent-soft text-accent',
  success: 'bg-ok-soft text-ok',
  warning: 'bg-warn-soft text-warn',
  // Đơn sắc (ADR 015): lỗi là khối đảo màu (nền chữ chính, chữ nền) — độ tương phản thay
  // vai trò của màu đỏ, nên nhãn lỗi vẫn nổi hẳn so với các nhãn xám nhạt còn lại.
  danger: 'bg-fg text-app',
};

/** Nhãn trạng thái. `icon` để trạng thái không chỉ được phân biệt bằng màu. */
export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: IconName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} strokeWidth={2.75} />}
      {children}
    </span>
  );
}
