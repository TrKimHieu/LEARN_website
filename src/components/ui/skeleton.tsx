import { cn } from './cn';

/**
 * Ô chờ nhấp nháy. Nền `muted` để gợi ý bố cục sắp tới mà không tranh sự chú ý với
 * nội dung đã tải xong. `animate-pulse` tự tắt theo `prefers-reduced-motion`.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-muted', className)} aria-hidden />;
}
