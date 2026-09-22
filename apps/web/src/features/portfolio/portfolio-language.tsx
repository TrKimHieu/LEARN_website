'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Lang = 'vi' | 'en';

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'vi',
  setLang: () => undefined,
});

const STORAGE_KEY = 'learn-portfolio-lang';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('vi');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') setLangState(saved);
    } catch {
      // localStorage có thể bị chặn (private mode) — giữ mặc định 'vi'
    }
  }, []);

  // `<html lang="vi">` khai ở root layout — đúng cho toàn app, nhưng landing page
  // có toggle VI/EN nên khi bật "en" thì thuộc tính này phải nói đúng sự thật.
  // Cleanup trả về "vi" khi rời trang: `LanguageProvider` chỉ mount ở `/`, điều
  // hướng client sang /login sẽ unmount nó — không trả lại thì "en" bị bỏ quên
  // trên một app còn lại toàn tiếng Việt.
  useEffect(() => {
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'vi';
    };
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // bỏ qua nếu không lưu được
    }
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LanguageContext).lang;
}

export function useLanguageToggle(): { lang: Lang; setLang: (l: Lang) => void } {
  return useContext(LanguageContext);
}

/** Chọn giá trị theo ngôn ngữ hiện tại — dùng với nội dung song ngữ `{vi, en}`. */
export function usePick<T>(bilingual: { vi: T; en: T }): T {
  const lang = useLang();
  return bilingual[lang];
}
