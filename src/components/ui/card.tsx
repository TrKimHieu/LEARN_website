import { cn } from './cn';

/**
 * Thẻ nội dung — viền 1px `line` + `shadow-card`. Bóng tách thẻ khỏi nền mà không vẽ
 * thêm đường kẻ; ở tông tối bóng gần như tắt nên viền gánh việc tách lớp.
 *
 * `interactive` cho thẻ bấm được: viền chuyển sang `accent-line` và bóng nâng lên khi
 * hover — đủ để thấy thẻ "nổi lên", không dịch chuyển bố cục.
 */
export function Card({
  className,
  padded = true,
  interactive = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { padded?: boolean; interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-panel shadow-card',
        padded && 'p-5 sm:p-6',
        interactive &&
          'transition-[border-color,box-shadow] duration-150 hover:border-line-strong hover:shadow-raised',
        className,
      )}
      {...rest}
    />
  );
}

/** Tiêu đề thẻ. Thứ bậc đến từ độ đậm + màu, không từ cỡ chữ. */
export function CardTitle({
  className,
  as: Tag = 'h2',
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'p' }) {
  return <Tag className={cn('text-base font-semibold text-fg', className)} {...rest} />;
}

export function CardDescription({
  className,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm leading-relaxed text-fg-subtle', className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)} {...rest} />
  );
}

/** Tiêu đề của một mục trong trang — cùng nhịp ở mọi màn. */
export function SectionTitle({
  children,
  action,
  description,
  className,
  id,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  description?: string;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-base font-semibold text-fg">
          {children}
        </h2>
        {description && <p className="mt-0.5 text-sm text-fg-subtle">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
