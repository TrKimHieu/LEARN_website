import { cn } from './cn';

/**
 * Thanh tiến độ.
 *
 * Phần lấp đầy chạy bằng `transform: scaleX` + CSS transition, không phải `motion` và
 * không phải `width`: (1) UI-GUIDE §4 ghi nhận `motion.div` đổi giá trị sau mount có thể
 * kẹt vô thời hạn ở tab nền — CSS transition thì không; (2) animate `width` gây layout
 * mỗi khung hình, `transform` chỉ composite. Khối `prefers-reduced-motion` ở globals.css
 * rút transition về ~0ms.
 */
export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'sky',
  size = 'md',
  className,
}: {
  value: number;
  max?: number;
  /** Mô tả cho trình đọc màn hình, ví dụ "Tiến độ khóa học". */
  label: string;
  tone?: 'sky' | 'success' | 'on-dark';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full',
        tone === 'on-dark' ? 'bg-white/12' : 'bg-track',
        size === 'xs' ? 'h-1.5' : size === 'sm' ? 'h-2' : 'h-2.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full w-full origin-left rounded-full transition-transform duration-500 ease-out-quint',
          'bg-chart-1',
        )}
        style={{ transform: `scaleX(${percent / 100})` }}
      />
    </div>
  );
}

/**
 * Vòng tiến độ — cho con số tổng hợp cần đọc được trong nháy mắt (khóa học, điểm).
 * Nhãn chữ ở giữa là thông tin chính; vòng chỉ nhắc lại nó bằng hình.
 */
export function ProgressRing({
  value,
  max = 100,
  size = 72,
  stroke = 7,
  label,
  tone = 'sky',
  children,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label: string;
  tone?: 'sky' | 'success' | 'on-dark';
  /** Nội dung ở tâm vòng. Mặc định là phần trăm. */
  children?: React.ReactNode;
  className?: string;
}) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const trackClass = tone === 'on-dark' ? 'stroke-white/12' : 'stroke-track';
  const barClass = tone === 'on-dark' ? 'stroke-white' : 'stroke-fg';

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative inline-grid shrink-0 place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={trackClass}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - percent / 100)}
          className={cn(barClass, 'transition-[stroke-dashoffset] duration-700 ease-out-quint')}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-center" aria-hidden="true">
        {children ?? (
          <span
            className={cn(
              'text-sm font-semibold tabular-nums',
              tone === 'on-dark' ? 'text-white' : 'text-fg',
            )}
          >
            {Math.round(percent)}%
          </span>
        )}
      </span>
    </div>
  );
}
