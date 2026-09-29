import { Mascot, type MascotState } from '@/components/shared/mascot';
import { Button } from './button';
import { Card } from './card';
import { Icon } from './icon';
import { Skeleton } from './skeleton';
import { cn } from './cn';

/**
 * 5 trạng thái bắt buộc của một màn có dữ liệu (AGENTS.md): Loading · Empty · Error ·
 * Partial · Success. Bảng chọn component ở `docs/UI-GUIDE.md` §4c.
 *
 * Loading dùng skeleton, không dùng mascot — HANDBOOK §13.1 `[SPEC]` giới hạn mascot ở
 * hero, empty state, tiến độ AI Job và lỗi. Mọi trạng thái rỗng/lỗi phải nói bước tiếp.
 */

/** Skeleton khớp hình dạng nội dung sắp hiện ra — tránh bố cục nhảy khi dữ liệu về. */
export function LoadingState({
  rows = 3,
  variant = 'card',
  className,
  label = 'Đang tải',
}: {
  rows?: number;
  variant?: 'card' | 'list' | 'text';
  className?: string;
  label?: string;
}) {
  const shape = {
    card: 'h-24 w-full rounded-card',
    list: 'h-14 w-full',
    text: 'h-4 w-full',
  }[variant];

  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn(shape, variant === 'text' && i === rows - 1 && 'w-2/3')} />
      ))}
    </div>
  );
}

type Action = { label: string; onClick: () => void };

/**
 * Màn rỗng. `size="compact"` khi nó là MỤC CON của một màn đã có nội dung khác
 * (UI-GUIDE §4c) — cùng mascot, hạ xuống một hàng ngang.
 */
export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  mascot = 'sleeping',
  size = 'default',
  className,
}: {
  title: string;
  description?: string;
  action?: Action;
  secondaryAction?: Action;
  mascot?: MascotState;
  size?: 'default' | 'compact';
  className?: string;
}) {
  if (size === 'compact') {
    return (
      <Card className={cn('flex items-center gap-4 px-5 py-4', className)}>
        <Mascot state={mascot} size={48} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">{title}</p>
          {description && <p className="mt-0.5 text-sm text-fg-subtle">{description}</p>}
          {(action || secondaryAction) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {action && (
                <Button size="sm" onClick={action.onClick}>
                  {action.label}
                </Button>
              )}
              {secondaryAction && (
                <Button size="sm" variant="ghost" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <Mascot state={mascot} size={88} />
      <p className="mt-5 text-xl font-semibold text-fg">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-fg-subtle">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {action && <Button onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Lỗi tải dữ liệu — thay nội dung khi *query* hỏng. `detail` là requestId/mã lỗi để
 * người dùng copy khi báo lỗi.
 */
export function ErrorState({
  title = 'Không tải được dữ liệu',
  description,
  detail,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  detail?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Card
      role="alert"
      className={cn('flex flex-col items-center border-bad-line px-6 py-12 text-center', className)}
    >
      <Mascot state="alerting" size={88} />
      <p className="mt-5 flex items-center gap-1.5 text-base font-semibold text-bad">
        <Icon name="alert" size={17} />
        {title}
      </p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-fg-subtle">{description}</p>
      )}
      {detail && (
        <code className="mt-3 rounded-md border border-line bg-muted px-2 py-1 font-mono text-xs text-fg-subtle">
          Mã yêu cầu: {detail}
        </code>
      )}
      {onRetry && (
        <Button className="mt-6" variant="secondary" onClick={onRetry}>
          <Icon name="retry" size={16} />
          Thử lại
        </Button>
      )}
    </Card>
  );
}

/**
 * Lỗi cục bộ của một *thao tác* (mutation) — nội dung xung quanh vẫn còn. Luôn có icon:
 * màu không bao giờ là tín hiệu duy nhất (UI-GUIDE §2).
 */
export function InlineError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-control border border-bad-line bg-bad-soft',
        'px-4 py-3 text-sm leading-relaxed text-bad',
        className,
      )}
    >
      <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Partial — có dữ liệu nhưng thiếu/chưa đủ; hiện kèm dữ liệu, không thay thế nó. */
export function PartialNotice({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex items-start gap-2.5 rounded-control border border-warn-line bg-warn-soft px-4 py-3 text-sm leading-relaxed text-warn',
        className,
      )}
    >
      <Icon name="info" size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
