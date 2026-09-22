import Image from 'next/image';
import { SCREENSHOTS } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';
import { RevealOnScroll } from '@/lib/motion';

/**
 * Bản trước ép cả 6 ảnh vào `aspect-[4/3]` bằng `object-cover object-top` — các
 * ảnh gốc là 1440×900 (tỉ lệ 16:10), nên `object-cover` vào khung 4:3 âm thầm
 * cắt mất khoảng 11% chiều cao mỗi ảnh. Ảnh vì thế đọc ra như ô trang trí, không
 * phải bằng chứng sản phẩm thật.
 *
 * Đổi bố cục: một ảnh chính (dashboard — đại diện rõ nhất cho sản phẩm) full-
 * width ở đúng tỉ lệ gốc, năm ảnh còn lại thành dải thumbnail bên dưới. Dùng đủ
 * cả 6 file, không bịa thêm ảnh nào. `next/image` thay `<img>` trần — có kích
 * thước khai báo nên không còn giật layout khi ảnh tải xong.
 */
export function Screenshots() {
  const lang = useLang();
  const [lead, ...rest] = SCREENSHOTS.items;
  // Cùng lý do như target-users.tsx: nội dung tác giả viết tay luôn có ảnh đầu tiên.
  if (!lead) return null;

  return (
    <section className="bg-surface-100 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={SCREENSHOTS.eyebrow}
          title={SCREENSHOTS.title}
          intro={SCREENSHOTS.note}
        />
        <RevealOnScroll className="mt-8">
          <figure className="overflow-hidden rounded-panel border border-surface-200 bg-white shadow-card">
            <div className="relative aspect-[16/10] w-full border-b border-surface-200 bg-surface-200">
              <Image
                src={`/screenshots/${lead.file}`}
                alt=""
                fill
                sizes="(min-width: 1024px) 1152px, 100vw"
                className="object-cover object-top"
                loading="lazy"
              />
            </div>
            {/* `figcaption` đã mô tả ảnh; `alt=""` để trình đọc màn hình không đọc hai lần. */}
            <figcaption className="px-4 py-3 text-base text-ink-700">
              {lead.caption[lang]}
            </figcaption>
          </figure>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {rest.map((item) => (
              <figure
                key={item.file}
                className="overflow-hidden rounded-card border border-surface-200 bg-white shadow-card"
              >
                <div className="relative aspect-[16/10] w-full border-b border-surface-200 bg-surface-200">
                  <Image
                    src={`/screenshots/${item.file}`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <figcaption className="px-3 py-2.5 text-xs text-ink-500">
                  {item.caption[lang]}
                </figcaption>
              </figure>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
