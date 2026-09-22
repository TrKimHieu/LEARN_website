import { MVP_SCOPE } from '@/features/portfolio/portfolio';
import { usePick } from '@/features/portfolio/portfolio-language';
import { SectionHeading } from './section-heading';

export function MvpScope() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={MVP_SCOPE.eyebrow} title={MVP_SCOPE.title} />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-card border-2 border-success-100 bg-success-50/60 p-5">
            <h3 className="font-bold text-success-700">{usePick(MVP_SCOPE.inScopeTitle)}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              {MVP_SCOPE.inScope.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="text-success-700">
                    ✓
                  </span>
                  {usePick(item)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border-2 border-surface-300 bg-surface-100 p-5">
            <h3 className="font-bold text-ink-500">{usePick(MVP_SCOPE.outScopeTitle)}</h3>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              {MVP_SCOPE.outScope.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true">—</span>
                  {usePick(item)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
