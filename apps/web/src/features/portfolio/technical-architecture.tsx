import { ARCHITECTURE } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';

const LAYERS = [
  { label: { vi: 'Tầng 1 · Frontend', en: 'Layer 1 · Frontend' }, range: [0, 1] },
  { label: { vi: 'Tầng 2 · Backend API', en: 'Layer 2 · Backend API' }, range: [1, 6] },
  { label: { vi: 'Tầng 3 · Xử lý bất đồng bộ', en: 'Layer 3 · Async processing' }, range: [6, 8] },
  {
    label: { vi: 'Tầng 4 · Dữ liệu & dịch vụ ngoài', en: 'Layer 4 · Data & external services' },
    range: [8, 12],
  },
] as const;

export function TechnicalArchitecture() {
  const lang = useLang();
  return (
    <section id="technical" className="scroll-mt-16 bg-navy-900 py-16 text-surface-100 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow={ARCHITECTURE.eyebrow}
          title={ARCHITECTURE.title}
          intro={ARCHITECTURE.intro}
          light
        />
        <div className="mt-10 flex flex-col gap-3">
          {LAYERS.map((layer, li) => (
            <div key={li}>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 font-mono text-2xs font-bold uppercase tracking-[0.14em] text-sky-400">
                  {layer.label[lang]}
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {ARCHITECTURE.components.slice(layer.range[0], layer.range[1]).map((c) => (
                    <div
                      key={c.name}
                      className="rounded-lg border border-white/10 bg-navy-900/60 p-3"
                    >
                      <p className="text-sm font-semibold text-surface-100">{c.name}</p>
                      <p className="font-mono text-2xs text-sky-400">{c.code}</p>
                      <p className="mt-1 text-xs text-surface-100/65">
                        {lang === 'vi' ? c.vi : c.en}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {li < LAYERS.length - 1 && (
                <div aria-hidden="true" className="my-1 flex justify-center text-sky-400">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
