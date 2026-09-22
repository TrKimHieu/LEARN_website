import { HOW_IT_WORKS } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';

export function HowItWorks() {
  const lang = useLang();
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-navy-900 py-16 text-surface-100 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={HOW_IT_WORKS.eyebrow} title={HOW_IT_WORKS.title} light />
        <ol className="mt-10 grid gap-3 sm:grid-cols-3">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-500 font-mono text-xs font-bold text-navy-900">
                {i + 1}
              </span>
              <span className="text-sm font-medium">{step[lang]}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-2xl text-sm text-surface-100/60">{HOW_IT_WORKS.note[lang]}</p>
      </div>
    </section>
  );
}
