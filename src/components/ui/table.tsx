import { Card } from './card';
import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Skeleton } from './skeleton';
import { cn } from './cn';

/**
 * Bảng dữ liệu. `overflow-x-auto` để bảng nhiều cột cuộn ngang trong vùng của nó thay
 * vì làm tràn cả trang trên màn hẹp.
 */
export function TableCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card padded={false} className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="w-full min-w-max text-sm">{children}</table>;
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="border-b border-line bg-panel-2 text-left">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = 'left',
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-4 py-3 text-xs font-semibold text-fg-subtle',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="divide-y divide-line [&>tr]:transition-colors [&>tr:hover]:bg-panel-2">
      {children}
    </tbody>
  );
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}) {
  return (
    <td className={cn('px-4 py-3.5 text-fg-muted', align === 'right' && 'text-right', className)}>
      {children}
    </td>
  );
}

/** Khung chờ mang đúng số cột/dòng của bảng sắp hiện ra. */
export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <Card padded={false} className="overflow-hidden" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải dữ liệu</span>
      <div className="border-b border-line bg-panel-2 px-4 py-3.5">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={cn('h-4', c === 0 ? 'flex-[2]' : 'flex-1')} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Bảng không có dòng nào. Phân biệt *bộ lọc không khớp* (lối ra: nút Xoá bộ lọc) với
 * *hệ thống chưa có gì* (nói khi nào dữ liệu sẽ xuất hiện). Không mascot — đây là bảng
 * quản trị (UI-GUIDE §4c, ranh giới `[SPEC]` §13.1).
 */
export function TableEmpty({
  title,
  description,
  icon = 'search',
  onClearFilter,
  clearLabel = 'Xoá bộ lọc',
}: {
  title: string;
  description?: string;
  icon?: IconName;
  onClearFilter?: () => void;
  clearLabel?: string;
}) {
  return (
    <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center">
      <Icon name={icon} size={28} className="text-fg-subtle" />
      <p className="mt-4 text-sm font-semibold text-fg">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-fg-subtle">{description}</p>
      )}
      {onClearFilter && (
        <Button className="mt-5" variant="secondary" size="sm" onClick={onClearFilter}>
          <Icon name="x" size={15} />
          {clearLabel}
        </Button>
      )}
    </Card>
  );
}
