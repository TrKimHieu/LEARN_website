import type { Metadata } from 'next';
import { Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import { BRAND } from '@learn/ui';
import { env } from '@/lib/env';
import { AuthProvider } from '@/features/auth/auth-context';
import { QueryProvider } from '@/lib/query-provider';
import { MotionProvider } from '@/lib/motion';
import './globals.css';

/**
 * Chữ — xem docs/adr/008-chu-be-vietnam-pro-jetbrains-mono.md.
 *
 * Be Vietnam Pro là họ **tĩnh** (không phải variable): mỗi weight × mỗi subset là một file
 * woff2 riêng. Ngân sách vì thế là 4 bậc sans — đủ cho thang 400/500/600/700 mà UX-UI-PRINCIPLES
 * §4.1 khuyến nghị (2–3 bậc đậm, tối đa 3). Thêm 800 là +3 file cho một weight chỉ dùng ở heading,
 * nên `font-extrabold` đã được gỡ khỏi toàn bộ codebase thay vì mở rộng ngân sách.
 *
 * `variable` mode để `packages/config/tailwind/theme.css` trỏ `--font-sans` vào đây. Next còn tự
 * sinh một họ fallback đã khớp metric (`__Be_Vietnam_Pro_Fallback_*`) — đó là thứ dập CLS trong
 * lúc swap, nên chuỗi thật sâu ba bậc: webfont → fallback khớp metric → stack hệ thống.
 */
const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: BRAND.name,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.taglineVi,
  openGraph: {
    siteName: BRAND.name,
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `className` phải nằm trên <html>, không phải <body>: `@theme` biên dịch thành rule `:root`,
  // tức chính phần tử này. Đặt xuống <body> thì `--font-sans` ở `:root` trỏ vào một biến chưa
  // được định nghĩa ở tầng đó.
  return (
    <html lang="vi" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <MotionProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
