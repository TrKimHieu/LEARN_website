'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/components/ui/cn';

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
 * Màu thân mascot.
 *
 * Bản export của Blob Studio để `DEFAULT_GRADIENT = ['#000000','#000000','#000000']`
 * — đen tuyền, phẳng. Trên thẻ trắng nó thành một đốm đen không thuộc bảng màu
 * nào của LEARN, còn trên `navy-900` thì chìm hẳn (đó là lý do hero phải lót một
 * đĩa sáng phía sau). Truyền gradient ở đây kéo mascot về đúng palette §14.2 mà
 * không phải sửa một dòng nào trong file vendor.
 *
 * Gradient của component chạy từ **trên-phải** (`x1=1 y1=0`) xuống **dưới-trái**,
 * nên stop đầu là điểm sáng: sky-400 → navy-700 → navy-900 đọc ra một khối cầu
 * navy được ánh sáng thương hiệu rọi vào, thay vì một hình tròn bẹt.
 *
 * Mắt giữ màu trắng mặc định — tương phản 17:1 trên navy-900.
 */
const BODY_GRADIENT: [string, string, string] = ['#7FD3F7', '#16202E', '#0B1220'];

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
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    >
      <CircleAvatar state={state} size={size} expression={expression} gradient={BODY_GRADIENT} />
    </span>
  );
}
