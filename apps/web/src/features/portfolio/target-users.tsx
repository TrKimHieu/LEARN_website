import { USERS } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { Icon } from '@/components/ui';
import { SectionHeading } from './section-heading';
import { RevealOnScroll } from '@/lib/motion';

/**
 * Trước đây 3 nhóm người dùng nằm trong `sm:grid-cols-3` bằng nhau — nhìn ra hệt
 * nhau về trọng lượng, dù spec §10.3 nói rõ "Clearly identify Learner as the
 * primary MVP user". Layout đối xứng không nói được điều spec yêu cầu.
 *
 * Đổi sang panel lệch 1+2: Learner được cột rộng, heading lớn hơn, `needs` thành
 * checklist 2 cột; hai nhóm còn lại xếp chồng ở cột hẹp dạng hàng gọn. Trọng
 * lượng thị giác tới từ kích thước và vị trí, không phải màu — đúng cách §4b mô
 * tả thứ bậc ("độ đậm + màu", không phải kẻ khung dày).
 */
export function TargetUsers() {
  const lang = useLang();
  const [primary, ...secondary] = USERS.groups;
  // `noUncheckedIndexedAccess` không biết USERS.groups luôn có ít nhất 1 phần tử
  // (nội dung tác giả viết tay, không phải dữ liệu động) — chặn sớm để giữ kiểu
  // chặt mà không cần non-null assertion.
  if (!primary) return null;

  return (
    <section id="product" className="scroll-mt-16 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={USERS.eyebrow} title={USERS.title} />
        <RevealOnScroll className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ------------------------------------------------- Learner, nổi bật */}
          <div className="rounded-panel border border-surface-200 bg-surface-100 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-bold text-ink-900">{primary.name[lang]}</h3>
              {/* `bg-sky-500/10` (thay vì token `-50` sẵn có) khiến axe-core báo sai
                  vi phạm tương phản: Tailwind v4 dựng alpha qua `oklab(... / 0.1)`,
                  và axe không giải đúng màu nền đã hoà trộn qua alpha đó — tính tay
                  ra 5.06:1 (đạt AA), nhưng công cụ báo "trượt". Đổi sang `bg-sky-50`
                  (đặc, không alpha) — cùng một hiệu ứng thị giác, khớp quy ước badge
                  còn lại trong app (`StatusBadge`, `Badge`) đều dùng nền `-50` đặc
                  chứ không alpha, và không còn phụ thuộc vào việc công cụ audit có
                  giải đúng oklab hay không. */}
              <span className="inline-block rounded-pill bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                {primary.badge[lang]}
              </span>
            </div>
            <p className="mt-3 max-w-lg text-sm text-ink-700">{primary.description[lang]}</p>
            <ul className="mt-5 grid gap-x-6 gap-y-2 text-sm text-ink-700 sm:grid-cols-2">
              {primary.needs.map((need, j) => (
                <li key={j} className="flex gap-2">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-sky-700">
                    <Icon name="check" size={14} strokeWidth={3} />
                  </span>
                  {need[lang]}
                </li>
              ))}
            </ul>
          </div>

          {/* --------------------------------------------- hai nhóm phụ, gọn */}
          <div className="flex flex-col gap-4">
            {secondary.map((group, i) => (
              <div key={i} className="flex-1 rounded-panel border border-surface-200 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink-900">{group.name[lang]}</h3>
                </div>
                {/* `ink-500` trượt AA trên nền có pha màu (UI-GUIDE §10) — `surface-200`
                    là nền pha màu, nên chữ trên nó phải là `ink-700`. */}
                <span className="mt-1 inline-block rounded-pill bg-surface-200 px-2 py-0.5 text-xs font-medium text-ink-700">
                  {group.badge[lang]}
                </span>
                <p className="mt-2.5 text-sm text-ink-500">{group.description[lang]}</p>
                <ul className="mt-3 space-y-1 text-sm text-ink-700">
                  {group.needs.map((need, j) => (
                    <li key={j} className="flex gap-2">
                      <span aria-hidden="true" className="mt-0.5 shrink-0 text-sky-700">
                        <Icon name="check" size={13} strokeWidth={3} />
                      </span>
                      {need[lang]}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
