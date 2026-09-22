'use client';

import { ErrorState } from '@/components/ui/states';

/**
 * Error boundary cấp route — bắt lỗi render chưa từng được bắt ở đâu khác.
 *
 * Dùng `ErrorState` — component này vốn đã đánh bóng sẵn cho lỗi tải dữ liệu
 * (`ai-job-progress.tsx`, mọi màn `(app)`) nhưng chưa từng được nối vào chỗ Next
 * gọi khi chính việc RENDER bị lỗi. `detail` là đúng chỗ `error.digest` thuộc về —
 * mã lỗi Next gắn cho log phía server, người dùng copy được khi báo lỗi.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md">
        <ErrorState
          title="Đã có lỗi xảy ra"
          description="Trang không hiển thị được. Vui lòng thử lại."
          detail={error.digest}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
