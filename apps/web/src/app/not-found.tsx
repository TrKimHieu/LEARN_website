import Link from 'next/link';
import { LogoMark } from '@/features/shell/logo-mark';

/**
 * 404 có thương hiệu. Server component thuần, không mascot động: 404 có thể là điểm chạm
 * ĐẦU TIÊN của một phiên (gõ nhầm URL), không đáng phải đợi hydrate mới vẽ được.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-app px-4 text-center">
      <div className="relative">
        <LogoMark size={64} className="mx-auto" />
        <p className="mt-8 font-mono text-sm text-fg-subtle">Lỗi 404</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight tracking-[-0.025em] text-fg">
          Không tìm thấy trang
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-fg-subtle">
          Đường dẫn này không tồn tại, hoặc đã được đổi sang chỗ khác.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex h-10 items-center justify-center rounded-control bg-primary px-4 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover focus-ring"
        >
          Về trang tổng quan
        </Link>
      </div>
    </main>
  );
}
