import Link from 'next/link';
import { BRAND } from '@learn/ui';
import { LogoMark } from '@/components/logo-mark';

/**
 * Khung màn đăng nhập/đăng ký: nền navy, thẻ sáng ở giữa.
 *
 * Hình tròn ở đây là **logo** (`LogoMark` — SVG tĩnh, đối xứng), không phải
 * mascot động. HANDBOOK §13.1 `[SPEC]` giới hạn *mascot* ở hero, empty state,
 * tiến độ AI Job và trạng thái lỗi; màn này không có mascot nào cả.
 * Xem `docs/adr/007-logo-la-nhan-vat-circle.md`.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <LogoMark size={64} tone="dark" className="mx-auto mb-3 block" />
          <h1 className="text-xl font-bold text-white">{BRAND.name}</h1>
          <p className="mt-1 text-sm text-ink-300">{BRAND.taglineVi}</p>
        </div>

        <div className="rounded-card bg-white p-6 shadow-raised">{children}</div>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="rounded-md text-xs font-bold text-ink-300 underline underline-offset-4 hover:text-white hover:no-underline focus-ring-dark"
          >
            Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
