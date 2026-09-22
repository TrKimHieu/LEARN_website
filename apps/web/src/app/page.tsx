import type { Metadata } from 'next';
import { BRAND } from '@learn/ui';
import { Landing } from '@/components/portfolio/landing';

/**
 * Trước đây file này chính là màn hình — `'use client'` cả cây, vì `LanguageProvider`
 * (toggle VI/EN) buộc cả cây phải chạy trên client. Một trang `'use client'` không xuất
 * được `metadata`, nên landing page không có `<title>`/`description` riêng, chỉ thừa
 * hưởng mặc định của root layout.
 *
 * Ranh giới client giờ tụt xuống một tầng: file này là server component, chỉ export
 * `metadata` rồi render `<Landing />`. Thân trang cũ chuyển nguyên văn sang
 * `components/portfolio/landing.tsx` — không section nào phải thêm `'use client'`,
 * không import nào đổi.
 *
 * Không đưa `LanguageProvider` lên root layout: nó chỉ `/` dùng, đẩy lên gốc sẽ ép
 * toàn bộ app vào cây client cho một provider của riêng một trang. Cũng không đọc
 * ngôn ngữ từ cookie để giữ metadata "phản ứng" — làm vậy biến `/` thành render động,
 * mất hẳn prerender tĩnh cho một trang không có dữ liệu động nào.
 */
export const metadata: Metadata = {
  title: BRAND.tagline,
  description: BRAND.taglineVi,
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.taglineVi,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.taglineVi,
  },
};

export default function HomePage() {
  return <Landing />;
}
