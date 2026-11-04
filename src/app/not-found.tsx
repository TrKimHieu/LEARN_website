import Link from 'next/link';
import { LogoMark } from '@/features/shell/logo-mark';

/**
 * 404 có thương hiệu. Server component thuần, không mascot động: 404 có thể là điểm chạm
 * ĐẦU TIÊN của một phiên (gõ nhầm URL), không đáng phải đợi hydrate mới vẽ được.
 */
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-app px-4 text-center">
      <div className="relative animate-rise rounded-panel border border-line bg-panel px-8 py-10 shadow-overlay sm:px-12">
        <LogoMark size={56} className="mx-auto" />
        <p className="mt-8 text-sm font-semibold text-fg-subtle">Lỗi 404</p>
        <h1 className="mt-4 font-display text-[2.75rem] font-bold leading-[1.05] text-fg">
          Không tìm thấy trang
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-fg-muted">
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
