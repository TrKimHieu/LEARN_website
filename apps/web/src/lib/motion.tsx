'use client';

import { MotionConfig, motion, useReducedMotion, type Variants } from 'motion/react';

/**
 * Lớp chuyển động dùng chung — xem docs/UI-GUIDE.md §Chuyển động.
 *
 * Ba quy tắc, không có ngoại lệ:
 *
 * 1. **Chuyển động chỉ để giải thích, không để trang trí.** Mỗi animation phải
 *    trả lời được "nó nói cho người dùng điều gì" (cái này mới xuất hiện / cái
 *    này vừa đổi / cái này liên quan cái kia). Không có thì bỏ.
 * 2. **Tôn trọng `prefers-reduced-motion`.** `MotionProvider` đặt
 *    `reducedMotion="user"` ở gốc cây, nên mọi `motion.*` bên dưới tự động hạ
 *    transform/scale về 0 khi người dùng bật giảm chuyển động của hệ điều hành.
 *    Không component nào được tự cài animation bằng CSS vượt mặt cơ chế này.
 * 3. **Ngắn.** 150–400ms. Dài hơn là cản trở thao tác, không phải đánh bóng.
 */

/** Ease-out mạnh ở đầu, êm ở cuối — hợp với vật thể "bay vào" màn hình. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

/** Xuất hiện: mờ dần + nhích lên. Dùng cho thẻ, khối nội dung, hàng bảng. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_OUT } },
};

/** Xuất hiện theo kiểu "bật ra" — dành riêng cho phản hồi tích cực. */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 22 },
  },
};

/**
 * Container cho danh sách: các con lần lượt hiện ra, cách nhau `stagger` giây.
 * Giữ tổng thời gian dưới ~600ms, nên danh sách dài phải giảm `stagger`.
 */
export function staggerContainer(stagger = 0.06): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger } },
  };
}

/**
 * Bọc gốc cây React. `reducedMotion="user"` là công tắc a11y toàn cục:
 * mọi `motion.*` bên dưới tự bỏ transform/scale khi hệ điều hành yêu cầu,
 * chỉ giữ lại opacity.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DURATION.base, ease: EASE_OUT }}>
      {children}
    </MotionConfig>
  );
}

/**
 * Khối nội dung xuất hiện khi được gắn vào cây. `delay` để xếp thứ tự các khối
 * lớn trên một trang; danh sách thì dùng `StaggerList` thay vì delay thủ công.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      transition={{ delay, duration: DURATION.base, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Danh sách có hiệu ứng nối tiếp. Phần tử con bọc bằng `StaggerItem`. */
export function StaggerList({
  children,
  stagger = 0.06,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}) {
  const Tag = motion[as];
  return (
    <Tag initial="hidden" animate="show" variants={staggerContainer(stagger)} className={className}>
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li';
}) {
  const Tag = motion[as];
  return (
    <Tag variants={fadeUp} className={className}>
      {children}
    </Tag>
  );
}

/**
 * Ngưỡng kích hoạt cho hai component `*OnScroll` dưới đây.
 *
 * `once: true` — chạy đúng một lần. Nội dung nhấp nháy lại mỗi lần cuộn qua là trang trí,
 * không phải giải thích, và nó phá luật 1.
 * `amount: 0.2` — đợi 20% khối lọt vào khung nhìn. Đặt 0 thì khối cao hơn màn hình sẽ
 * kích hoạt ngay khi mép trên vừa chạm đáy, tức người dùng chưa thấy gì đã chạy xong.
 */
const IN_VIEW = { once: true, amount: 0.2 } as const;

/**
 * Như `Reveal`, nhưng đợi tới lúc khối thật sự lọt vào khung nhìn.
 *
 * Vì sao cần cả hai: `Reveal` dùng `animate="show"`, tức kích hoạt **lúc mount**. Với màn
 * app ngắn, nằm gọn trên một khung hình, đó là đúng. Với trang chủ 16 section thì sai —
 * mọi thứ dưới nếp gấp chạy xong animation trước khi người dùng cuộn tới, nên ta trả đủ
 * chi phí mà không được gì.
 *
 * Quy tắc chọn: nội dung nằm trên nếp gấp → `Reveal`. Phải cuộn mới thấy → `RevealOnScroll`.
 */
export function RevealOnScroll({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={IN_VIEW}
      variants={fadeUp}
      transition={{ delay, duration: DURATION.base, ease: EASE_OUT }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** `StaggerList` phiên bản cuộn-mới-chạy. Phần tử con vẫn bọc bằng `StaggerItem`. */
export function StaggerOnScroll({
  children,
  stagger = 0.06,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  stagger?: number;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}) {
  const Tag = motion[as];
  return (
    <Tag
      initial="hidden"
      whileInView="show"
      viewport={IN_VIEW}
      variants={staggerContainer(stagger)}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * `true` khi người dùng đã bật giảm chuyển động. Dùng cho hiệu ứng **không**
 * chạy qua `motion.*` (ví dụ pháo giấy trên canvas) — những thứ `MotionConfig`
 * không với tới được.
 */
export { useReducedMotion };
