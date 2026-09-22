'use client';

import { useEffect, useRef, useState } from 'react';
import { MotionConfig, motion, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/components/ui/cn';

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
 * Như `Reveal`, nhưng đợi tới lúc khối thật sự lọt vào khung nhìn — dùng cho trang chủ 16
 * section, nơi kích hoạt lúc mount (`Reveal`) sẽ chạy xong animation trước khi người dùng
 * cuộn tới. Quy tắc chọn: nội dung nằm trên nếp gấp → `Reveal`. Phải cuộn mới thấy →
 * `RevealOnScroll`.
 *
 * **Cố ý KHÔNG dùng `motion.div` + `animate`/`whileInView` ở đây** — khác mọi component
 * khác trong file này. Lý do đo được trực tiếp, không phải suy đoán: một animation Framer
 * Motion kích hoạt LÚC MOUNT (như `Reveal`) chạy đúng trong mọi môi trường đã thử, nhưng
 * animation cần **đổi state SAU khi đã mount** rồi mới chạy (đúng thứ `whileInView` cần)
 * thì kẹt tại trạng thái ban đầu vô thời hạn trong ít nhất một môi trường thực tế đã gặp
 * (cửa sổ trình duyệt bị che khuất — có thể xảy ra với người dùng thật khi mở link bằng
 * chuột giữa vào tab nền). Test trực tiếp: một `motion.div` khác trong app (`ProgressBar`,
 * đổi giá trị qua state sau một cú click) cũng kẹt y hệt, trong khi một `<div>` thường đổi
 * `style.opacity` qua CSS transition thì luôn chạy đúng. Nên "đổi trạng thái sau mount" ở
 * đây dùng CSS transition thuần (Tailwind), không giao cho animation engine của Framer
 * Motion — pipeline đó có vẻ cần một tick nội bộ không phải lúc nào cũng có được.
 */
const FORCE_SHOW_MS = 1000;

// Callback ref: component nhận `as` là 'div' | 'ul' | 'ol', mỗi thẻ một kiểu phần tử DOM
// khác nhau — không có `RefObject<T>` cụ thể nào khớp cả ba, nhưng callback ref
// (`(node) => void`) thì khớp mọi kiểu phần tử.
function useInView(threshold = 0.2): [(node: HTMLElement | null) => void, boolean] {
  const elRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const forceShow = useForceShow();

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '-20% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const setRef = (node: HTMLElement | null) => {
    elRef.current = node;
  };

  return [setRef, inView || forceShow];
}

/**
 * Lưới an toàn: quá `FORCE_SHOW_MS` mà chưa vào khung nhìn thì ép hiện — nội dung không
 * bao giờ được phép kẹt vô hình vĩnh viễn, chỉ mất phần chuyển động.
 */
function useForceShow(): boolean {
  const [forceShow, setForceShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceShow(true), FORCE_SHOW_MS);
    return () => clearTimeout(t);
  }, []);
  return forceShow;
}

// `opacity-60`, không phải `opacity-0`: nếu paint bị treo (đã gặp thật trong ít nhất
// một môi trường — xem docblock trên `RevealOnScroll`) và transition không bao giờ
// chạy xong, nội dung vẫn đọc được ở trạng thái "chưa hiện" thay vì biến mất hẳn.
const CSS_REVEAL_HIDDEN = 'opacity-60 translate-y-2';
const CSS_REVEAL_SHOW = 'opacity-100 translate-y-0';
const CSS_REVEAL_BASE =
  'transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none';

export function RevealOnScroll({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, show] = useInView();
  return (
    <div
      ref={ref}
      className={cn(CSS_REVEAL_BASE, show ? CSS_REVEAL_SHOW : CSS_REVEAL_HIDDEN, className)}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * `StaggerList` phiên bản cuộn-mới-chạy. Không dùng `StaggerItem` (bản Framer Motion) cho
 * từng con — cùng lý do đã giải thích ở trên. Cả nhóm hiện cùng lúc bằng CSS transition,
 * không so le từng phần tử; đơn giản hơn và không phụ thuộc animation engine đang có vấn
 * đề trong một số môi trường.
 */
export function StaggerOnScroll({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'ol';
}) {
  const Tag = as;
  const [ref, show] = useInView();
  return (
    <Tag
      ref={ref}
      className={cn(CSS_REVEAL_BASE, show ? CSS_REVEAL_SHOW : CSS_REVEAL_HIDDEN, className)}
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
