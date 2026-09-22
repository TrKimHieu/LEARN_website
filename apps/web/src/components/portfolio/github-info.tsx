import { GITHUB_INFO } from '@/content/portfolio';
import { useLang } from '@/lib/portfolio-language';
import { SectionHeading } from './section-heading';

const RUN_LOCAL = `git clone <repo> && cd learn
cp .env.example .env
npm install
docker compose -f infra/docker-compose.yml up -d
npm run db:migrate && npm run db:seed
npm run dev`;

export function GithubInfo() {
  const lang = useLang();
  return (
    <section id="github" className="scroll-mt-16 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={GITHUB_INFO.eyebrow} title={GITHUB_INFO.title} />

        <div className="mt-8 flex flex-wrap gap-2">
          {GITHUB_INFO.stack.map((s) => (
            <span
              key={s}
              className="rounded-full border border-surface-200 px-2.5 py-1 font-mono text-xs text-ink-700"
            >
              {s}
            </span>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl bg-navy-900 p-4">
          <pre className="font-mono text-xs text-surface-100/90">{RUN_LOCAL}</pre>
        </div>

        <p className="mt-4 text-sm text-ink-500">
          {lang === 'vi'
            ? 'Repo sẽ sớm công khai trên GitHub — hiện tại xem toàn bộ mã nguồn qua bản trình bày local ở trên.'
            : 'The repo will be public on GitHub soon — for now, the source is fully available by running it locally as shown above.'}
        </p>
      </div>
    </section>
  );
}
