import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * Chỉ liệt kê route công khai, không cần đăng nhập: ba màn `(auth)`.
 *
 * **Không** liệt kê `/` — giờ chỉ redirect thẳng vào `/dashboard`, không còn nội
 * dung để crawler đọc. Cũng không liệt kê route trong `(app)` — chúng đứng sau
 * `ProtectedRoute`, tức chưa đăng nhập thì bị đẩy về `/login`; đưa vào sitemap là
 * mời crawler tới một URL nó không đọc được nội dung thật. Cũng không liệt kê
 * `/dev/ui` — 404 ở production (`notFound()` khi `NODE_ENV === 'production'`).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['/login', '/register', '/forgot-password'];
  return routes.map((path) => ({
    url: `${env.siteUrl}${path}`,
    lastModified: new Date(),
  }));
}
