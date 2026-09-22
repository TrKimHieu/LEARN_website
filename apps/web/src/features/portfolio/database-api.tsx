import { DATABASE_API } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';

export function DatabaseApi() {
  const lang = useLang();
  return (
    <section className="bg-surface-100 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={DATABASE_API.eyebrow} title={DATABASE_API.title} />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              {lang === 'vi' ? 'Entity chính (Prisma)' : 'Core entities (Prisma)'}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {DATABASE_API.entities.map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-surface-200 bg-white px-2.5 py-1 font-mono text-xs text-ink-700"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              {lang === 'vi' ? 'Endpoint tiêu biểu' : 'Sample endpoints'}
            </h3>
            <ul className="mt-3 space-y-2">
              {DATABASE_API.endpoints.map((ep, i) => (
                <li key={i} className="rounded-lg bg-white p-3 text-xs">
                  <p className="font-mono">
                    <span className="font-bold text-sky-700">{ep.method}</span>{' '}
                    <span className="text-ink-900">{ep.path}</span>
                  </p>
                  <p className="mt-1 text-ink-500">{lang === 'vi' ? ep.vi : ep.en}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
