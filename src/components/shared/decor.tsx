import { cn } from '@/components/ui/cn';

/**
 * Hoạ tiết trang trí.
 *
 * Đều là trang trí thuần (`aria-hidden`, `pointer-events-none`). Chuyển động là CSS thuần
 * (keyframes ở `app/globals.css`), tắt hẳn khi hệ điều hành bật giảm chuyển động.
 *
 * Ranh giới (ADR 018 §3–4): chỉ đặt ở **lớp nền** của hero (đăng nhập, đăng ký, 404), dải đầu
 * trang trong app, và quanh mascot của empty state. Không đặt trong thẻ dữ liệu hay bảng quản trị —
 * chữ luôn nằm trên nền `panel` phẳng.
 */

/**
 * Sao bốn cánh — hoạ tiết lặp lại của ảnh tham chiếu.
 *
 * `twinkle` (ms trễ): sao co lại + mờ đi một nhịp ngắn rồi nghỉ phần lớn chu kỳ 6s. Mỗi sao một độ
 * trễ khác nhau để chúng không nhấp nháy cùng lúc. Animation đặt trên `<path>` bên trong, nên
 * `opacity-*` truyền qua `className` (độ đậm nền của từng sao) không bị keyframe ghi đè.
 */
export function Sparkle({
  size = 20,
  twinkle,
  className,
}: {
  size?: number;
  twinkle?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn('pointer-events-none shrink-0 fill-spark', className)}
    >
      <path
        d="M12 0C12.7 7.3 16.7 11.3 24 12 16.7 12.7 12.7 16.7 12 24 11.3 16.7 7.3 12.7 0 12 7.3 11.3 11.3 7.3 12 0Z"
        className={cn(
          twinkle !== undefined &&
            'animate-twinkle [transform-box:fill-box] [transform-origin:center]',
        )}
        style={twinkle !== undefined ? { animationDelay: `${twinkle}ms` } : undefined}
      />
    </svg>
  );
}

/**
 * Quỹ đạo: một hành tinh nét mảnh, một vành elip nghiêng, một vành chấm bên trong, hai "vệ tinh".
 * Kích thước theo `className` (SVG co theo chiều rộng).
 */
export function Orbit({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 320 170"
      fill="none"
      className={cn('pointer-events-none stroke-spark', className)}
    >
      <circle cx="170" cy="88" r="52" strokeOpacity="0.28" strokeWidth="1" />
      <g transform="rotate(-16 160 88)">
        <ellipse cx="160" cy="88" rx="150" ry="50" strokeOpacity="0.5" strokeWidth="1" />
        {/* Chấm chảy dọc vành: dashoffset dịch -70 = đúng 10 chu kỳ nét (1 + 6), vòng lặp liền. */}
        <ellipse
          cx="160"
          cy="88"
          rx="104"
          ry="30"
          strokeOpacity="0.45"
          strokeWidth="1.2"
          strokeDasharray="1 6"
          strokeLinecap="round"
          className="animate-orbit-flow"
        />
        <circle cx="308" cy="78" r="9" className="fill-spark" fillOpacity="0.14" stroke="none" />
        {/* Vòng toả ra từ hành tinh; nghỉ ở opacity 0 nên khi tắt chuyển động nó biến mất. */}
        <circle
          cx="308"
          cy="78"
          r="9"
          strokeWidth="1"
          opacity="0"
          className="animate-halo [transform-box:fill-box] [transform-origin:center]"
        />
        <circle cx="308" cy="78" r="5" className="fill-spark" stroke="none" />
        <circle cx="12" cy="96" r="2.5" className="fill-spark" fillOpacity="0.8" stroke="none" />
      </g>
    </svg>
  );
}

/** Lưới chấm nhỏ ở góc — nhịp "kỹ thuật" nhẹ của ảnh gốc. */
export function DotField({
  cols = 7,
  rows = 5,
  className,
}: {
  cols?: number;
  rows?: number;
  className?: string;
}) {
  const gap = 14;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={(cols - 1) * gap + 4}
      height={(rows - 1) * gap + 4}
      className={cn('pointer-events-none fill-line-strong', className)}
    >
      {Array.from({ length: rows * cols }, (_, i) => (
        <circle key={i} cx={2 + (i % cols) * gap} cy={2 + Math.floor(i / cols) * gap} r="1.6" />
      ))}
    </svg>
  );
}

/**
 * Nhãn mở đầu: gạch ngang mảnh + chữ hoa giãn rộng, coban. Một chỗ mỗi màn (tiêu đề trang /
 * hero), không phải nhãn cho từng thẻ.
 */
export function Eyebrow({
  children,
  animated = false,
  className,
}: {
  children: React.ReactNode;
  /** Gạch ngang kéo ra từ trái khi trang mở — dùng ở hero, không ở mọi tiêu đề trang. */
  animated?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('h-px w-9 origin-left bg-accent/60', animated && 'animate-draw-x')}
      />
      {children}
    </p>
  );
}
