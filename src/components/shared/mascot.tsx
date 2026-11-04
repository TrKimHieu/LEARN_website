'use client';

import dynamic from 'next/dynamic';
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { claimMascot, currentMascot, subscribeMascot, type MascotRole } from './mascot-slot';
import { cn } from '@/components/ui/cn';
import { useTheme } from '@/lib/theme';

/**
 * Mascot Circle — bản động từ Blob Studio (40 state, 25 biểu cảm).
 *
 * Vai trò người đồng hành, thay cho hình minh hoạ tĩnh (cúp, mũ, sách). Mỗi màn chỉ hiện một mascot:
 * `mascot-slot.ts` chọn cái được hiện, cái còn lại không render gì.
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
  // Giữ hình tròn trong lúc tải file vendor, màu lấy từ `color` của khung mascot.
  loading: () => <span className="block size-full rounded-full bg-current" />,
});

/**
 * Màu mascot.
 *
 * Tông sáng: thân indigo, mắt + miệng trắng. Tông tối: thân trắng ngà, mặt indigo, vì thân tối sẽ
 * chìm trên nền tối. Vendor nhận `gradient` 3 điểm dừng nên không phải sửa file vendor (ADR 006).
 *
 * `effects={false}`: hiệu ứng của vendor (vệt sao chổi, pháo giấy quanh mascot) chạy qua nhiều
 * hue ngoài bảng màu. Pháo giấy khi qua bài ở `lib/celebrate.ts` dùng bảng màu giao diện.
 */
const NAVY = '#2D3142';
const WHITE = '#FFFFFF';
const BODY_LIGHT: [string, string, string] = ['#3A4058', '#2D3142', '#181A27'];
const BODY_DARK: [string, string, string] = ['#F1F1EE', '#E3E5EC', '#C9CCD8'];

/**
 * Nền phía sau mascot, vì thân tối sẽ chìm trên nền tối.
 * - `page`: nền trang, đổi theo giao diện sáng/tối.
 * - `ink`: khối indigo ở cả hai giao diện.
 * - `color`: khối xanh dương hoặc amber ở cả hai giao diện.
 * - `color-on-phone`: khối màu đậm trên điện thoại, nền nhạt trên website (ColorBlock `softOnDesktop`).
 */
export type MascotSurface = 'page' | 'ink' | 'color' | 'color-on-phone';

const PHONE_QUERY = '(max-width: 767.98px)';

function subscribePhone(onChange: () => void) {
  const media = window.matchMedia(PHONE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

export function useIsPhone() {
  return useSyncExternalStore(
    subscribePhone,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

export function Mascot({
  state,
  size = 96,
  surface = 'page',
  /** Ghim một biểu cảm cố định thay vì để nó tự đổi. */
  expression,
  priority = 'state',
  className,
  children,
}: {
  state: MascotState;
  size?: number;
  expression?: number;
  surface?: MascotSurface;
  /** `companion` nhường chỗ cho mascot báo trạng thái trên cùng màn. */
  priority?: MascotRole;
  className?: string;
  /** Hoạ tiết đi kèm, ẩn cùng mascot khi nó không được hiện. */
  children?: React.ReactNode;
}) {
  const { resolved } = useTheme();
  const isPhone = useIsPhone();
  const onColor = surface === 'color' || (surface === 'color-on-phone' && isPhone);
  const dark = surface === 'ink' || (!onColor && resolved === 'dark');
  const body = dark ? BODY_DARK : BODY_LIGHT;

  // Chỉ nạp file vendor khi mascot sắp vào màn hình. Trước đó giữ một hình tròn đúng màu và đúng cỡ
  // nên không nhảy bố cục, và trang không phải tải mascot nằm dưới nếp gấp.
  const id = useId();
  useLayoutEffect(() => claimMascot(id, priority), [id, priority]);
  const winner = useSyncExternalStore(subscribeMascot, currentMascot, () => null);
  const shown = winner === null || winner === id;

  const box = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    if (!shown) return;
    const el = box.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shown]);

  if (!shown) return null;

  return (
    <span
      ref={box}
      aria-hidden="true"
      className={cn('relative inline-block shrink-0 select-none', className)}
      style={{ width: size, height: size, color: body[1] }}
    >
      {near ? (
        <CircleAvatar
          state={state}
          size={size}
          expression={expression}
          gradient={body}
          eyeColor={dark ? NAVY : WHITE}
          effects={false}
        />
      ) : (
        <span className="block size-full rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}
