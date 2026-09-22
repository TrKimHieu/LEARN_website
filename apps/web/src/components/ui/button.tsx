'use client';

import Link from 'next/link';
import { cn } from './cn';

/**
 * Nút.
 *
 * Ngôn ngữ thị giác: **bóng nhẹ thay cho viền dày**. Bản trước dùng `border-b-4` + lún
 * xuống khi bấm (`active:translate-y-1`) và chữ `uppercase` — ngôn ngữ của app game.
 * Nay dùng đường viền 1px, `shadow-card`, bo `rounded-lg` và chuyển động 200ms: trọng
 * lượng thị giác đến từ *độ tương phản của màu nền*, không phải từ độ dày của cạnh.
 *
 * Màu giữ nguyên `[SPEC]` §14.2: biến thể `primary` là nền sky + chữ navy-900 (tương phản
 * 9.86:1). Chữ trắng trên sky chỉ 1.90:1 nên **không** có biến thể đó — xem docs/UI-GUIDE.md §2.
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

// Vòng focus nằm TRONG từng biến thể, không phải BASE dùng chung: `outline` sống
// trên nền navy nên cần `focus-ring-dark` (sky-500), còn lại dùng `focus-ring`
// (sky-600) — hai class CSS riêng, gộp ở BASE thì cả hai cùng áp và cạnh tranh
// theo thứ tự nạp stylesheet thay vì theo variant nào đang dùng.
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-500 text-navy-900 shadow-card hover:bg-sky-400 active:bg-sky-600 focus-ring',
  secondary:
    'bg-white text-ink-700 border border-surface-300 shadow-card ' +
    'hover:border-surface-400 hover:text-ink-900 active:bg-surface-100 focus-ring',
  ghost: 'bg-transparent text-ink-700 hover:bg-surface-200 hover:text-ink-900 focus-ring',
  danger:
    'bg-danger-700 text-white shadow-card hover:bg-danger-500 active:bg-danger-700 focus-ring',
  // Viền mảnh trên nền tối — dùng ở hero (navy-900). Chữ `surface-100` giữ đúng
  // luật "chữ trắng trên sky chỉ 1.90:1 không tồn tại": đây không phải nền sky.
  outline:
    'border border-white/25 text-surface-100 hover:bg-white/5 active:bg-white/10 focus-ring-dark',
};

// Thang chiều cao 36/40/48 — bội số của 4 như phần còn lại của lưới.
const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

const BASE =
  'inline-flex items-center justify-center rounded-lg font-medium select-none ' +
  'transition-all duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-50';

function classes(variant: Variant, size: Size, fullWidth: boolean, className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  return <button type={type} className={classes(variant, size, fullWidth, className)} {...rest} />;
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={classes(variant, size, fullWidth, className)}>
      {children}
    </Link>
  );
}
