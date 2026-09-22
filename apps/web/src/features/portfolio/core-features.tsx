import { FEATURES } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';
import { StatusBadge } from './status-badge';
import { RevealOnScroll } from '@/lib/motion';

/**
 * 6 mục, mỗi mục mang số thứ tự VÀ một nhãn trạng thái MVP — khác hẳn payload
 * mỏng của ProductValue ngay phía trên. Giữ 6 ô nhưng bỏ viền riêng từng thẻ,
 * đổi sang MỘT container viền ngoài kẻ ô cả hai chiều — đọc ra như một bảng
 * thông số / ma trận năng lực, hợp với việc đây là mục duy nhất mang đủ 4 nhãn
 * `Có trong MVP / Đang phát triển / Đã lên kế hoạch / Mở rộng tương lai`.
 *
 * Cùng kỹ thuật `gap-px` với ProductValue nhưng cấu trúc bên trong khác hẳn
 * (số + badge + nội dung, không phải dt/dd đơn giản) nên hai section liền kề
 * không đọc ra là "lại một lưới sáu ô khác".
 */
export function CoreFeatures() {
  const lang = useLang();
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={FEATURES.eyebrow} title={FEATURES.title} />
        <RevealOnScroll className="mt-8 grid gap-px overflow-hidden rounded-panel border border-surface-300 bg-surface-300 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.items.map((item, i) => (
            <div key={i} className="bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="grid size-9 place-items-center rounded-lg bg-navy-800 font-mono text-xs font-bold text-sky-500">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <StatusBadge label={item.status} />
              </div>
              <h3 className="font-semibold text-ink-900">{item.title[lang]}</h3>
              <p className="mt-2 text-sm text-ink-500">{item.description[lang]}</p>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}
