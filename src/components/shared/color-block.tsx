import Link from 'next/link';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/components/ui/cn';

export type BlockTone = 'brand' | 'amber';

/** Mỗi tông có sẵn chữ đạt tương phản: xanh dương 5.0:1, amber 11.2:1. */
const TONE: Record<BlockTone, string> = {
  brand: 'bg-brand text-on-brand',
  amber: 'bg-amber text-ink-on-color',
};

const SOFT: Record<BlockTone, string> = {
  brand: 'md:bg-brand-soft md:text-fg',
  amber: 'md:bg-amber-soft md:text-fg',
};

/** Khối màu lớn: đầu trang và thẻ nổi bật. Đường cong mờ phía sau chỉ để trang trí. */
export function ColorBlock({
  tone,
  softOnDesktop = false,
  className,
  children,
}: {
  tone: BlockTone;
  /** Màu đậm hợp màn hẹp. Trên website dùng nền nhạt cùng tông, để bề mặt lớn không gắt. */
  softOnDesktop?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative isolate overflow-hidden rounded-panel',
        TONE[tone],
        softOnDesktop && SOFT[tone],
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 400 240"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.14] md:opacity-[0.07]"
      >
        <path
          d="M-20 200C60 120 120 260 200 170S300 20 420 70"
          fill="none"
          stroke="currentColor"
          strokeWidth="26"
          strokeLinecap="round"
        />
      </svg>
      {children}
    </div>
  );
}

/** Nút tròn có mũi tên, cả vùng bấm được nhờ `after` của link cha khi đặt `stretched`. */
export function CircleArrowLink({
  href,
  label,
  tone = 'dark',
  stretched = false,
  className,
}: {
  href: string;
  label: string;
  tone?: 'dark' | 'light';
  stretched?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        'tactile mb-1 grid size-12 shrink-0 place-items-center rounded-full focus-ring',
        tone === 'dark'
          ? 'bg-block-ink text-white [--edge:#0f1220]'
          : 'bg-white text-ink-on-color [--edge:#d9d6ce]',
        stretched && 'after:absolute after:inset-0 after:rounded-[inherit]',
        className,
      )}
    >
      <Icon name="arrow-right" size={20} />
    </Link>
  );
}

/**
 * Thẻ một con số. Điện thoại: viền màu, góc tô đậm giữ icon, số lớn ở giữa. Website: thẻ nền nhạt gọn,
 * icon nhỏ cạnh nhãn, số canh trái để đọc lướt theo hàng.
 */
export function StatTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: IconName;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-card border-[1.5px] border-brand bg-brand-soft p-4 md:flex md:flex-col md:gap-3 md:border-transparent">
      <span
        aria-hidden="true"
        className="absolute -left-3 -top-3 grid size-16 place-items-center rounded-full bg-brand pl-2 pt-2 text-on-brand md:static md:size-8 md:rounded-lg md:p-0"
      >
        <Icon name={icon} size={18} />
      </span>
      <p className="min-h-[2.5em] pl-12 text-[0.8125rem] font-medium leading-snug text-fg-muted md:min-h-0 md:pl-0">
        {label}
      </p>
      <p className="mt-4 text-center font-display text-[2rem] font-bold leading-none tabular-nums text-fg md:mt-0 md:text-left md:text-[1.75rem]">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-center text-xs text-fg-subtle">{sub}</p>}
    </div>
  );
}
