import { PROBLEM } from '@/content/portfolio';
import { useLang } from '@/lib/portfolio-language';
import { SectionHeading } from './section-heading';

export function Problem() {
  // Lấy `lang` một lần rồi index — gọi hook trong callback .map() (bản trước) chỉ
  // "chạy được" vì PROBLEM.points là hằng cấp module nên số lần gọi hook ổn định
  // qua mọi lần render; đây là hướng đúng theo Rules of Hooks, khớp mẫu đã dùng ở
  // technical-architecture.tsx / database-api.tsx.
  const lang = useLang();
  return (
    <section className="bg-surface-100 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={PROBLEM.eyebrow} title={PROBLEM.title} intro={PROBLEM.intro} />
        <ol className="mt-8 grid gap-4 sm:grid-cols-2">
          {PROBLEM.points.map((point, i) => (
            <li key={i} className="flex gap-4 rounded-xl bg-white p-5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-800 font-mono text-sm font-bold text-sky-500">
                {i + 1}
              </span>
              <p className="text-sm text-ink-700">{point[lang]}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 max-w-2xl text-sm font-medium text-ink-900">{PROBLEM.goal[lang]}</p>
      </div>
    </section>
  );
}
