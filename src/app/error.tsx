'use client';

import { ErrorState } from '@/components/ui';
import { GrainWaves } from '@/components/shared/grain-waves';

/**
 * Error boundary cấp route — lỗi RENDER chưa được bắt ở đâu khác. `detail` mang
 * `error.digest` (mã Next gắn cho log phía server) để người dùng copy khi báo lỗi.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-app px-4">
      {/* Cảnh riêng của màn lỗi — không mượn cảnh của đường dẫn đang hỏng (ADR 018). */}
      <GrainWaves variant="hero" scene="error" className="-z-10" />
      <h1 className="sr-only">Lỗi</h1>
      <div className="w-full max-w-md">
        <ErrorState
          title="Đã có lỗi xảy ra"
          description="Trang không hiển thị được. Vui lòng thử lại."
          detail={error.digest}
          onRetry={reset}
        />
      </div>
    </main>
  );
}
