'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BRAND } from '@learn/ui';
import { LogoMark } from '@/features/shell/logo-mark';
import { Icon } from '@/components/ui';
import { NAV } from '@/features/portfolio/portfolio';
import { useLang } from '@/features/portfolio/portfolio-language';
import { LanguageToggle } from './language-toggle';

export function PortfolioNav() {
  const [open, setOpen] = useState(false);
  const lang = useLang();
  const items = NAV.map((n) => ({ href: n.href, label: n.label[lang] }));
  const loginLabel = lang === 'vi' ? 'Đăng nhập' : 'Login';
  const menuLabel = lang === 'vi' ? 'Mở menu' : 'Open menu';
  const closeLabel = lang === 'vi' ? 'Đóng menu' : 'Close menu';

  // Chỉ báo mục đang xem — quan sát, không chiếm quyền cuộn (không phải luật §4
  // "chuyển động để giải thích", đây chỉ đọc trạng thái). `rootMargin` co khung
  // quan sát vào giữa màn hình để mục đổi đúng lúc section đó thật sự chiếm phần
  // lớn khung nhìn, không phải ngay khi mép trên vừa chạm đỉnh.
  const [activeHref, setActiveHref] = useState(items[0]?.href ?? '');
  const activeHrefRef = useRef(activeHref);
  activeHrefRef.current = activeHref;

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.href.slice(1))).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        // Nhiều section cùng giao khung nhìn thì lấy cái ở trên cùng.
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        const href = `#${top.target.id}`;
        if (href !== activeHrefRef.current) setActiveHref(href);
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 text-surface-100 sm:px-6">
        <Link href="#home" className="shrink-0">
          <span className="inline-flex items-center gap-2">
            <LogoMark size={28} tone="dark" />
            <span className="font-semibold">{BRAND.name}</span>
          </span>
        </Link>

        {/* Hai <nav> có thể cùng nằm trong DOM (cái này chỉ ẩn bằng CSS dưới `md`,
            không gỡ khỏi cây) nên phải khác tên — UI-GUIDE §10, cùng luật đã áp cho
            sidebar/thanh-tab-đáy của AppShell. */}
        <nav
          aria-label={lang === 'vi' ? 'Điều hướng trang — máy tính' : 'Page navigation — desktop'}
          className="hidden items-center gap-6 text-sm font-medium text-surface-100/80 md:flex"
        >
          {items.map((item) => {
            const active = item.href === activeHref;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? 'location' : undefined}
                className={
                  active
                    ? 'font-semibold text-sky-400 underline decoration-2 underline-offset-4'
                    : 'hover:text-surface-100'
                }
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />
          <Link
            href="/login"
            className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-semibold text-navy-900 hover:bg-sky-400"
          >
            {loginLabel}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? closeLabel : menuLabel}
          aria-expanded={open}
          className="grid size-9 place-items-center rounded-lg border border-white/15 md:hidden"
        >
          <Icon name={open ? 'x' : 'menu'} size={18} />
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 md:hidden">
          <nav
            aria-label={lang === 'vi' ? 'Điều hướng trang — di động' : 'Page navigation — mobile'}
            className="flex flex-col gap-3 pt-3 text-sm font-medium text-surface-100/85"
          >
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={item.href === activeHref ? 'location' : undefined}
                onClick={() => setOpen(false)}
                className={item.href === activeHref ? 'font-semibold text-sky-400' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex items-center justify-between">
            <LanguageToggle />
            <Link
              href="/login"
              className="rounded-lg bg-sky-500 px-4 py-1.5 text-sm font-semibold text-navy-900"
            >
              {loginLabel}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
