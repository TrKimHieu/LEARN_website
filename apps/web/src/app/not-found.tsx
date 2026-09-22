import Link from 'next/link';
import { LogoMark } from '@/components/logo-mark';

/**
 * 404 có thương hiệu — trước đây route này không tồn tại nên Next dùng trang mặc
 * định trần trụi của framework.
 *
 * Server component thuần, không dùng `EmptyState`/`Mascot`: mascot động nạp qua
 * `next/dynamic({ ssr: false })` (xem `components/mascot.tsx`), phù hợp cho nội
 * dung sau khi đã biết người dùng đăng nhập hay chưa, nhưng 404 là trang có thể
 * là điểm chạm ĐẦU TIÊN của một phiên (gõ nhầm URL, link cũ từ nơi khác) — không
 * đáng để trang này phải đợi hydrate xong mới vẽ được logo.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface-100 px-4 text-center">
      <LogoMark size={56} tone="light" />
      <div>
        <p className="font-mono text-sm font-bold text-sky-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">Không tìm thấy trang</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
          Đường dẫn này không tồn tại, hoặc đã bị đổi chỗ khác.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-medium text-navy-900 transition-all duration-200 hover:bg-sky-400 focus-ring"
        >
          Về trang chủ
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-surface-300 bg-white px-4 text-sm font-medium text-ink-700 shadow-card transition-all duration-200 hover:border-surface-400 hover:text-ink-900 focus-ring"
        >
          Vào ứng dụng
        </Link>
      </div>
    </div>
  );
}
