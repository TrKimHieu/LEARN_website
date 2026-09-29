'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/components/ui/cn';
import { useTheme } from '@/lib/theme';

/**
 * Mascot Circle — bản động từ Blob Studio (40 state, 25 biểu cảm).
 *
 * HANDBOOK §13.1 `[SPEC]`: mascot chỉ dùng ở hero, empty state, tiến độ AI Job
 * và trạng thái lỗi — không đặt trong section kỹ thuật, không làm ảnh chờ cho
 * mọi màn. §13.2 cho phép thêm `celebrate` khi người dùng hoàn thành bài học.
 *
 * Union dưới đây cố tình hẹp hơn 40 state của thư viện: chỉ những state ứng với
 * các vị trí spec cho phép mới có mặt, nên gõ sai tên hay dùng state ngoài phạm
 * vi sẽ hỏng typecheck ngay. Đây cũng là ranh giới kiểu bù lại cho `@ts-nocheck`
 * trong file vendor (xem docs/adr/006-mascot-dong-blob-studio.md).
 */
export type MascotState =
  // Hero (trạng thái nghỉ) và empty state — chưa có dữ liệu
  | 'sleeping'
  | 'idle'
  | 'bored'
  // Tiến độ AI Job
  | 'working'
  | 'thinking'
  | 'progress'
  | 'uploading'
  // Hoàn thành bài học (§13.2)
  | 'celebrate'
  | 'proud'
  | 'happy'
  // Lỗi
  | 'alerting'
  | 'sad'
  | 'confused';

/**
 * Nạp động: file vendor nặng ~115 KB và mascot luôn là trang trí
 * (`aria-hidden`), nên không cần nằm trong bundle đầu tiên hay render phía
 * server. Chỗ giữ đúng kích thước để không gây nhảy layout khi nó nạp xong.
 *
 * Component tự tôn trọng `prefers-reduced-motion` (tự hạ `motion` về 0), nên
 * không cần xử lý thêm ở đây.
 */
const CircleAvatar = dynamic(() => import('./mascot/CircleAvatar'), {
  ssr: false,
  loading: () => null,
});

/**
 * Màu mascot — ADR 015: **chỉ trắng và đen**.
 *
 * Tông sáng: thân đen, mắt + miệng trắng — cũng chính là màu gốc của bản export Blob Studio
 * (`DEFAULT_GRADIENT` đen tuyền). Tông tối: đảo lại (thân trắng, mặt đen), vì thân đen chìm
 * hẳn trên nền gần đen. Vendor nhận `gradient` 3 điểm dừng; truyền cùng một màu cho cả ba là
 * thân phẳng, không phải sửa file vendor (ADR 006).
 *
 * `effects={false}`: hiệu ứng của vendor (vệt sao chổi, pháo giấy quanh mascot) chạy qua
 * nhiều hue — phá quy tắc đơn sắc. Pháo giấy khi qua bài ở `lib/celebrate.ts` đã là thang xám.
 */
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const BODY_LIGHT: [string, string, string] = [BLACK, BLACK, BLACK];
const BODY_DARK: [string, string, string] = [WHITE, WHITE, WHITE];

export function Mascot({
  state,
  size = 96,
  /** Ghim một biểu cảm cố định thay vì để nó tự đổi. */
  expression,
  className,
}: {
  state: MascotState;
  size?: number;
  expression?: number;
  className?: string;
}) {
  const { resolved } = useTheme();
  const dark = resolved === 'dark';
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    >
      <CircleAvatar
        state={state}
        size={size}
        expression={expression}
        gradient={dark ? BODY_DARK : BODY_LIGHT}
        eyeColor={dark ? BLACK : WHITE}
        effects={false}
      />
    </span>
  );
}
