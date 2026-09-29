import type { Metadata, Viewport } from 'next';
import { BRAND } from '@learn/ui';
import { env } from '@/lib/env';
import { AuthProvider } from '@/features/auth/auth-context';
import { THEME_SCRIPT, ThemeProvider } from '@/lib/theme';
import { QueryProvider } from '@/lib/query-provider';
import { MotionProvider } from '@/lib/motion';
import './globals.css';

/**
 * Chữ — ADR 014. Một họ sans duy nhất, Hanken Grotesk (variable, có subset tiếng Việt), cho
 * cả tiêu đề lẫn giao diện; JetBrains Mono cho code. Bỏ serif cho tiêu đề.
 *
 * Tự host qua Fontsource (npm), KHÔNG dùng `next/font/google`: bản Google tải font lúc
 * dev/build, nên máy/CI không có mạng ra ngoài sẽ lặng lẽ rơi về font dự phòng (đã dính ở
 * preview). File `.woff2` nằm trong `node_modules`, `@font-face` chia theo `unicode-range`
 * nên trình duyệt chỉ tải subset cần (latin, latin-ext, vietnamese).
 */
import '@fontsource-variable/hanken-grotesk';
import '@fontsource-variable/jetbrains-mono';

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#0e0e0e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `suppressHydrationWarning` vì `THEME_SCRIPT` đặt `data-theme` trước khi React hydrate —
  // lệch thuộc tính đó là cố ý.
  return (
    <html lang="vi" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <ThemeProvider>
          <MotionProvider>
            <QueryProvider>
              <AuthProvider>{children}</AuthProvider>
            </QueryProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
