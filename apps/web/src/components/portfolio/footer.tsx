import { BRAND } from '@learn/ui';
import { LogoMark } from '@/components/logo-mark';
import { NAV } from '@/content/portfolio';
import { useLang } from '@/lib/portfolio-language';

/**
 * Trước đây footer chỉ có 2 dòng chữ, không một link nào — phần tử yếu nhất của
 * trang chủ. Thêm hàng link điều hướng (dùng lại đúng danh sách `NAV` của thanh
 * điều hướng trên cùng, không bịa thêm mục nào) và link tới `/login`.
 *
 * Không có link "Điều khoản" / "Chính sách bảo mật": trang không thu thập dữ
 * liệu cá nhân nào ngoài tài khoản demo, và bịa một trang pháp lý trống là tệ
 * hơn không có link — cùng tinh thần với quyết định bỏ CTA GitHub chết ở
 * `github-info.tsx`.
 */
export function PortfolioFooter() {
  const lang = useLang();

  return (
    <footer className="border-t border-surface-200 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2">
              <LogoMark size={24} tone="light" />
              <span className="font-semibold text-ink-900">{BRAND.name}</span>
            </span>
            <p className="mt-2 max-w-xs text-sm text-ink-500">
              {lang === 'vi' ? BRAND.taglineVi : BRAND.tagline}
            </p>
          </div>

          <nav
            aria-label={lang === 'vi' ? 'Điều hướng chân trang' : 'Footer navigation'}
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500"
          >
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="underline hover:text-ink-900">
                {item.label[lang]}
              </a>
            ))}
            <a href="/login" className="underline hover:text-ink-900">
              {lang === 'vi' ? 'Đăng nhập' : 'Login'}
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-surface-200 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.name}.
          </p>
          <p>
            {lang === 'vi'
              ? 'Dự án portfolio kỹ thuật — không phải sản phẩm thương mại đang vận hành.'
              : 'An engineering portfolio project — not a live commercial product.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
