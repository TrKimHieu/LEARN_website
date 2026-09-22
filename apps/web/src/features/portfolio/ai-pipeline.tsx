import { AI_PIPELINE } from '@/features/portfolio/portfolio';
import { useLang, usePick } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';

const CHUNK_CHIPS = [
  { vi: '1.200 token', en: '1,200 tokens' },
  { vi: '150 token chồng lấn', en: '150-token overlap' },
  { vi: 'heading > đoạn văn > câu', en: 'heading > paragraph > sentence' },
];

export function AiPipeline() {
  const lang = useLang();
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={AI_PIPELINE.eyebrow} title={AI_PIPELINE.title} />
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-surface-200 p-5">
            <h3 className="font-semibold text-ink-900">{usePick(AI_PIPELINE.chunking.title)}</h3>
            <p className="mt-2 text-sm text-ink-500">{usePick(AI_PIPELINE.chunking.description)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CHUNK_CHIPS.map((chip) => (
                <span
                  key={chip.en}
                  className="rounded-full bg-surface-100 px-2.5 py-1 font-mono text-xs text-ink-700"
                >
                  {chip[lang]}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-surface-200 p-5">
            <h3 className="font-semibold text-ink-900">{usePick(AI_PIPELINE.generation.title)}</h3>
            <p className="mt-2 text-sm text-ink-500">
              {usePick(AI_PIPELINE.generation.description)}
            </p>
          </div>

          <div className="rounded-card border-2 border-warning-100 bg-warning-50/60 p-5 lg:col-span-2">
            <h3 className="font-semibold text-ink-900">{usePick(AI_PIPELINE.validation.title)}</h3>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {AI_PIPELINE.validation.tiers.map((tier, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-ink-700"
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-warning-100 font-mono text-xs font-bold text-warning-700">
                    {i + 1}
                  </span>
                  {usePick(tier)}
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-surface-200 p-5 lg:col-span-2">
            <h3 className="font-semibold text-ink-900">{usePick(AI_PIPELINE.retry.title)}</h3>
            <p className="mt-2 text-sm text-ink-500">{usePick(AI_PIPELINE.retry.description)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
