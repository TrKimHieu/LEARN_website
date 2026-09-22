import Image from 'next/image';
import { Mascot } from '@/components/shared/mascot';
import { ButtonLink } from '@/components/ui';
import { HERO } from '@/features/portfolio/portfolio';
import { usePick } from '@/features/portfolio/portfolio-language';

export function Hero() {
  return (
    <section id="home" className="scroll-mt-16 bg-navy-900 text-surface-100">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-sky-400">
            {usePick(HERO.eyebrow)}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {usePick(HERO.title)}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-surface-100/75">{usePick(HERO.subtitle)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/login" size="lg">
              {usePick(HERO.ctaPrimary)}
            </ButtonLink>
            {/* Neo trong cùng trang — dùng thẻ <a> thường thay vì Link. Trước đây
                đây là một <a> tự viết theo ngôn ngữ đã khai tử (border-2 border-b-4
                uppercase active:translate-y-0.5) cao h-14, đứng cạnh ButtonLink
                size="lg" cao h-12 — lệch chiều cao thấy rõ. Nay dùng đúng primitive. */}
            <ButtonLink href="#technical" variant="outline" size="lg">
              {usePick(HERO.ctaSecondary)}
            </ButtonLink>
          </div>
        </div>

        {/* -------------------------------------------- xem trước sản phẩm */}
        {/* Spec §10.1 bắt hero phải có "Product UI preview or dashboard mockup" —
            trước đây hero chỉ có mascot trên một đĩa gradient, không hề có ảnh sản
            phẩm nào. Khung cửa sổ dưới đây là phần tử LCP của trang nên tải ưu tiên
            (`priority`). Mascot giữ lại làm chi tiết phụ, neo ở góc ngoài, không đè
            lên nội dung UI trong ảnh — vẫn đúng vị trí hợp lệ theo HANDBOOK §13.1. */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="overflow-hidden rounded-panel border border-white/10 bg-navy-800 shadow-raised">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </div>
            <div className="relative aspect-[16/10] w-full bg-surface-200">
              <Image
                src="/screenshots/dashboard.png"
                alt="Bảng tổng quan LEARN: số khóa học, bài đã hoàn thành, điểm trung bình và chuỗi ngày học"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover object-top"
              />
            </div>
          </div>

          {/* Mascot có màu rất tối, đặt thẳng lên navy-900 sẽ chìm — nên lót một
              đĩa sáng phía sau để nó tách khỏi nền. `idle` cho trạng thái nghỉ của
              hero — `celebrate` chỉ dành cho lúc người dùng thật sự hoàn thành việc
              gì đó (HANDBOOK §13.2). */}
          <div className="absolute -bottom-6 -left-6 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-sky-100 shadow-raised ring-8 ring-navy-900">
            <Mascot state="idle" size={64} />
          </div>
        </div>
      </div>
    </section>
  );
}
