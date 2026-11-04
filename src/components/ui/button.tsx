'use client';

import Link from 'next/link';
import { cn } from './cn';
import { Icon } from './icon';

/**
 * Nút — ADR 012.
 *
 * `primary` là navy đặc + chữ trắng (18:1) ở tông sáng, sky-400 + chữ navy (11:1) ở tông
 * tối. Không gradient, không quầng sáng: trọng lượng đến từ độ tương phản của nền. Sky
 * không còn là màu nút — nó là điểm nhấn (tiến độ, mục đang chọn, vòng focus), nên khi nó
 * xuất hiện thì mắt biết đó là tín hiệu.
 *
 * Mỗi màn chỉ một `primary`. Còn lại: `secondary` (nền panel, viền), `ghost`, `link`
 * (hành động bậc ba — chữ gạch chân, không khung), `danger`. Nhấn nút lún `scale(0.98)`.
 */
type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'outline' | 'link';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
    'tactile mb-1 [--edge:var(--primary-edge)] bg-primary text-primary-fg hover:bg-primary-hover focus-ring',
  secondary:
    'tactile mb-1 [--edge:var(--line-strong)] bg-panel text-fg border border-line-strong hover:bg-panel-2 focus-ring',
  soft: 'bg-muted text-fg hover:bg-line focus-ring',
  ghost: 'bg-transparent text-fg-muted hover:bg-muted hover:text-fg focus-ring',
  danger:
    'tactile mb-1 [--edge:var(--bad-line)] bg-bad-soft text-bad border border-bad-line hover:bg-bad-soft focus-ring',
  outline: 'border border-white/25 text-white hover:bg-white/10 focus-ring-dark',
  link: 'h-auto px-0 text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent focus-ring after:absolute after:inset-x-0 after:-inset-y-3 md:after:content-none',
};

const SIZES: Record<Size, string> = {
  sm: 'h-11 md:h-9 px-3.5 text-[0.8125rem] gap-1.5',
  md: 'h-11 md:h-10 px-5 md:px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-[0.9375rem] gap-2',
};

const BASE =
  'relative inline-flex items-center justify-center rounded-control font-semibold select-none ' +
  'whitespace-nowrap cursor-pointer transition-[background-color,border-color,color,transform] ' +
  'duration-150 ease-out disabled:pointer-events-none disabled:opacity-45 ' +
  // Mũi tên "đi tiếp" nhích 2px theo hướng của nó khi hover — nói "bấm là sang bước sau".
  '[&_[data-icon=arrow-right]]:transition-transform [&_[data-icon=arrow-right]]:duration-200 ' +
  'hover:[&_[data-icon=arrow-right]]:translate-x-0.5';

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}) {
  return cn(
    BASE,
    SIZES[size],
    VARIANTS[variant],
    variant === 'link' && 'h-auto px-0',
    fullWidth && 'w-full',
    className,
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /** Hiện spinner cạnh nhãn và khoá nút — nhãn vẫn phải nói đang làm gì ("Đang lưu…"). */
  loading?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading && <Icon name="spinner" size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </Link>
  );
}

/** Nút chỉ có icon — bắt buộc `label` để có tên truy cập được. */
export function IconButton({
  icon,
  label,
  size = 'md',
  className,
  type = 'button',
  ...rest
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'grid shrink-0 cursor-pointer place-items-center rounded-control text-fg-muted transition-colors duration-150',
        'hover:bg-muted hover:text-fg disabled:pointer-events-none disabled:opacity-40 focus-ring',
        size === 'sm' ? 'size-8' : 'size-10',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 16 : 18} />
    </button>
  );
}
