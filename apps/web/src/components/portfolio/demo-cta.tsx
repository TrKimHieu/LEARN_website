import { ButtonLink } from '@/components/ui';
import { DEMO } from '@/content/portfolio';
import { useLang, usePick } from '@/lib/portfolio-language';
import { SectionHeading } from './section-heading';

export function DemoCta() {
  const lang = useLang();
  return (
    <section id="demo" className="scroll-mt-16 bg-navy-900 py-16 text-surface-100 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <SectionHeading
          eyebrow={DEMO.eyebrow}
          title={DEMO.title}
          intro={DEMO.description}
          light
          align="center"
        />
        <div className="mx-auto mt-8 max-w-sm rounded-card border-2 border-white/10 bg-white/5 p-5 text-left">
          <p className="font-mono text-2xs font-bold uppercase tracking-[0.14em] text-sky-400">
            {usePick(DEMO.credentialsLabel)}
          </p>
          <dl className="mt-3 space-y-2 font-mono text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-surface-100/60">{lang === 'vi' ? 'Email' : 'Email'}</dt>
              <dd>demo@learn.ai</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-surface-100/60">{lang === 'vi' ? 'Mật khẩu' : 'Password'}</dt>
              <dd>Demo@12345</dd>
            </div>
          </dl>
        </div>
        <div className="mt-8">
          <ButtonLink href="/login" size="lg">
            {usePick(DEMO.cta)}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
