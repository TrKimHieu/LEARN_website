import { cn } from '@/components/ui/cn';

/**
 * Dấu hiệu thương hiệu LEARN — nhân vật Circle, thân navy mặt trắng (ADR 018).
 *
 * SVG tĩnh viết tay, không phải `<Mascot>` động (ADR 007): favicon không chạy JavaScript,
 * logo phải có ở lần vẽ đầu tiên, và một nhân vật chớp mắt ở thanh điều hướng trên mọi màn
 * sẽ kéo mắt khỏi nội dung. Muốn thấy nhân vật động thì ở hero, empty state, tiến độ AI Job
 * hoặc màn lỗi — đúng bốn vị trí HANDBOOK §13.1 cho phép.
 *
 * Thân = màu chữ chính (`fill-fg`: navy ở tông sáng, lam trắng ở tông tối), mặt = màu nền
 * (`fill-app`). Đảo theo tông bằng CSS, không cần JS, nên logo vẫn có mặt
 * ngay lần vẽ đầu. `tone` được giữ trong chữ ký chỉ để các chỗ gọi cũ không vỡ.
 *
 * `app/icon.svg` (favicon) phải đồng bộ tay với file này.
 */
export function LogoMark({
  size = 28,
  className,
}: {
  size?: number;
  /** Không còn tác dụng từ ADR 014 — logo một màu ở mọi nền. */
  tone?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('shrink-0', className)}
      // Mọi chỗ gọi đều có chữ "LEARN" hoặc nhãn riêng kèm theo — hình là trang trí.
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="50" className="fill-block-ink" />
      <ellipse cx="35.5" cy="43" rx="6.5" ry="9.5" className="fill-app" />
      <ellipse cx="64.5" cy="43" rx="6.5" ry="9.5" className="fill-app" />
      <path
        d="M36 63 Q50 72 64 63"
        fill="none"
        className="stroke-app"
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
