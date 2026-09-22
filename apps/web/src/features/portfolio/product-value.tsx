import { VALUE } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';
import { RevealOnScroll } from '@/lib/motion';

/**
 * 6 mục chỉ có title + description — payload mỏng nhất trang. Thẻ viền riêng cho
 * mỗi mục (bản trước: `sm:grid-cols-2 lg:grid-cols-3` của card) là thừa đồ đạc
 * cho nội dung nhẹ này. Gộp lại thành MỘT khối — một `<dl>` với đường kẻ ô, chứ
 * không phải sáu thẻ rời — để trọng lượng thị giác tới từ một cạnh ngoài duy
 * nhất, không phải sáu.
 *
 * Kỹ thuật kẻ ô: `gap-px` trên nền `surface-300` + mỗi ô nền trắng. Đường kẻ là
 * chính khoảng gap 1px lộ ra nền phía dưới — chắc chắn thẳng hàng ở mọi kích
 * thước màn hình, không cần chọn `nth-child` để tắt viền ở hàng/cột đầu.
 */
export function ProductValue() {
  const lang = useLang();
  return (
    <section className="bg-surface-100 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={VALUE.eyebrow} title={VALUE.title} />
        <RevealOnScroll className="mt-8">
          <dl className="grid gap-px overflow-hidden rounded-panel border border-surface-300 bg-surface-300 sm:grid-cols-2">
            {VALUE.items.map((item, i) => (
              <div key={i} className="bg-white p-6">
                <dt className="font-semibold text-ink-900">{item.title[lang]}</dt>
                <dd className="mt-1.5 text-sm text-ink-500">{item.description[lang]}</dd>
              </div>
            ))}
          </dl>
        </RevealOnScroll>
      </div>
    </section>
  );
}
