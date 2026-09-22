import { ENGINEERING_DECISIONS } from '@/features/portfolio/portfolio';
import { usePick } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';

export function EngineeringDecisions() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={ENGINEERING_DECISIONS.eyebrow}
          title={ENGINEERING_DECISIONS.title}
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ENGINEERING_DECISIONS.items.map((item, i) => (
            <details
              key={i}
              className="group rounded-xl border border-surface-200 p-4 open:bg-surface-100"
            >
              <summary className="cursor-pointer list-none font-medium text-ink-900 marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {usePick(item.title)}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-ink-300 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-ink-500">{usePick(item.body)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
