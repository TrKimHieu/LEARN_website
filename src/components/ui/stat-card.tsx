import { cn } from './cn';
import { Icon, type IconName } from './icon';

export type StatTone = 'sky' | 'mint' | 'lemon' | 'peach' | 'success' | 'warning' | 'neutral';

// Màu của icon đứng một mình (ADR 014: không ô nền quanh icon) — điểm màu duy nhất của một ô
// số liệu. `success`/`warning` giữ để tương thích.
const TINT: Record<StatTone, string> = {
  sky: 'text-accent',
  mint: 'text-ok',
  success: 'text-ok',
  lemon: 'text-warn',
  warning: 'text-warn',
  peach: 'text-bad',
  neutral: 'text-fg-muted',
};

/**
 * Một con số — ADR 012/013. Không thẻ riêng: số liệu đặt trong `StatStrip` hoặc lưới trần.
 * `icon` tuỳ chọn đứng một mình cạnh nhãn, có màu — màu giúp phân biệt các chỉ số
 * khi lướt mắt, nghĩa vẫn nằm ở nhãn chữ. Chỉ dùng số thật.
 */
export function StatCard({
  icon,
  label,
  value,
  sub,
  tone = 'sky',
  className,
}: {
  icon?: IconName;
  label: string;
  value: string;
  sub?: string;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-2 text-[0.8125rem] text-fg-subtle">
        {icon && <Icon name={icon} size={16} filled className={cn('shrink-0', TINT[tone])} />}
        {label}
      </p>
      <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-fg">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-fg-subtle">{sub}</p>}
    </div>
  );
}

/** Dải số liệu: các ô cách nhau bằng đường kẻ dọc, xuống hàng thành lưới 2 cột trên mobile. */
export function StatStrip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-flow-col sm:auto-cols-fr sm:grid-cols-none',
        '[&>*]:bg-panel [&>*]:px-6 [&>*]:py-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
