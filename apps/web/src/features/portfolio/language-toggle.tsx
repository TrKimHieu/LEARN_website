'use client';

import { useLanguageToggle } from '@/features/portfolio/portfolio-language';

export function LanguageToggle() {
  const { lang, setLang } = useLanguageToggle();
  return (
    <div className="flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-semibold">
      {(['vi', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase transition-colors ${
            lang === l ? 'bg-sky-500 text-navy-900' : 'text-surface-100/70 hover:text-surface-100'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
