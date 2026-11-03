import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/** Đối xứng với `sitemap.ts`: chặn crawler vào route cần đăng nhập hoặc chỉ để phát triển. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/courses', '/progress', '/settings', '/admin', '/dev'],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
