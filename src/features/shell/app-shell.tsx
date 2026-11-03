'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from '@/components/ui/icon';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { Reveal } from '@/lib/motion';
import { GrainWaves, Sparkle } from '@/components/shared/decor';
import { Brand } from './brand';
import { isActive, navItemsFor, NAV_ITEMS, ADMIN_ITEM } from './nav';
import { UserMenu } from './user-menu';

/**
 * Khung ứng dụng — ADR 012.
 *
 * Điều hướng trên cùng thay cho sidebar: app chỉ có 3–4 điểm đến, một cột 272px cho chừng
 * đó mục là phí chiều ngang ở mọi màn, và một khối navy lớn cạnh nội dung sáng là thứ đầu
 * tiên mắt nhìn vào — trong khi thứ cần nhìn là bài học. Header sáng, mảnh (56px), cùng
 * `max-w` với nội dung nên mép trái logo thẳng hàng mép trái tiêu đề trang.
 *
 * Dưới `md`: thanh tab đáy (vùng ngón cái), có `safe-area-inset-bottom`.
 * "Cài đặt" nằm trong menu tài khoản ở desktop, và là một tab ở mobile.
 *
 * ADR 018: nền sóng lam hạt nhiễu mức `app` phủ cả khung nhìn (`fixed` — đứng yên khi cuộn, thẻ
 * trượt qua trên nó), mỗi màn một cảnh riêng, hoà cảnh khi đổi màn. Mặt nạ của `GrainWaves` để
 * sạch cột nội dung (`clear` = nửa `max-w`), nên sóng chỉ hiện ở hai lề và dải trên cùng — chữ
 * đặt thẳng trên nền luôn đứng trên màu `app`. Header trong suốt để sóng chạy liền.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';
  const topItems = NAV_ITEMS.filter((i) => i.href !== '/settings');
  const desktopItems = isAdmin ? [...topItems, ADMIN_ITEM] : topItems;
  const mobileItems = navItemsFor(user?.role);
  const wide = pathname.startsWith('/admin');
  // max-w-5xl: dòng chữ và lưới hẹp lại, khoảng trắng hai bên lớn hơn (ADR 013). Admin giữ
  // rộng cho bảng nhiều cột.
  const container = cn('mx-auto w-full px-5 sm:px-8', wide ? 'max-w-6xl' : 'max-w-5xl');

  return (
    <div className="relative isolate min-h-dvh bg-app">
      <GrainWaves variant="app" clear={wide ? 576 : 512} className="fixed -z-10" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]">
        <div className={cn(container, 'relative h-full')}>
          <Sparkle size={22} twinkle={0} className="absolute right-[14%] top-[96px] opacity-80" />
          <Sparkle
            size={12}
            twinkle={2600}
            className="absolute right-[22%] top-[150px] opacity-60"
          />
        </div>
      </div>
      <a
        href="#main"
        className="sr-only rounded-control bg-panel px-4 py-2.5 text-sm font-medium text-accent shadow-raised focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus-ring"
      >
        Bỏ qua tới nội dung chính
      </a>

      <header className="sticky top-0 z-30 border-b border-line/70 bg-app/70 backdrop-blur-md">
        <div className={cn(container, 'flex h-14 items-center gap-6')}>
          <Link href="/dashboard" className="shrink-0 rounded-control focus-ring">
            <Brand />
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden h-full md:block">
            <ul className="flex h-full items-stretch gap-1">
              {desktopItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="flex">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center px-3 text-sm font-medium transition-colors duration-150 focus-ring',
                        active ? 'text-fg' : 'text-fg-subtle hover:text-fg',
                      )}
                    >
                      {item.label}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/courses/new"
              className={buttonClasses({
                variant: 'secondary',
                size: 'sm',
                className: 'hidden sm:inline-flex',
              })}
            >
              <Icon name="plus" size={15} />
              Khóa học mới
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className={cn(container, 'scroll-mt-20 pb-28 pt-10 outline-none sm:pt-14 md:pb-24')}
      >
        <Reveal key={pathname}>{children}</Reveal>
      </main>

      <nav
        aria-label="Điều hướng chính, thanh dưới"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto flex max-w-lg">
          {mobileItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="min-w-0 flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs font-medium leading-tight focus-ring',
                    active ? 'text-fg' : 'text-fg-subtle',
                  )}
                >
                  <Icon
                    name={item.icon}
                    size={20}
                    strokeWidth={active ? 2.25 : 1.75}
                    className={active ? 'text-accent' : undefined}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
