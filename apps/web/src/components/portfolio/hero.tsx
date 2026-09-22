import { Mascot } from '@/components/mascot';
import { ButtonLink } from '@/components/ui';
import { HERO } from '@/content/portfolio';
import { usePick } from '@/lib/portfolio-language';

export function Hero() {
  return (
    <section id="home" className="bg-navy-900 text-surface-100">
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
            {/* Neo trong cùng trang — dùng thẻ <a> thường thay vì Link. */}
            <a
              href="#technical"
              className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-b-4 border-white/25 px-8 text-base font-bold uppercase tracking-wide text-surface-100 transition-colors hover:bg-white/5 active:translate-y-0.5 active:border-b-2 focus-ring-dark"
            >
              {usePick(HERO.ctaSecondary)}
            </a>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          {/* Mascot có màu rất tối, đặt thẳng lên navy-900 sẽ chìm — nên lót một
              đĩa sáng phía sau để nó tách khỏi nền. */}
          <div className="relative flex size-56 items-center justify-center rounded-full bg-gradient-to-br from-sky-300 to-sky-100 shadow-raised ring-8 ring-white/5 sm:size-72">
            {/* `idle` cho trạng thái nghỉ của hero — `celebrate` chỉ dành cho lúc
                người dùng thật sự hoàn thành việc gì đó (HANDBOOK §13.2). */}
            <Mascot state="idle" size={180} />
          </div>
        </div>
      </div>
    </section>
  );
}
