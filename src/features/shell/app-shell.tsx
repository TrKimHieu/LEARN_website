'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Icon } from '@/components/ui/icon';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { Reveal } from '@/lib/motion';
import { isActive, navItemsFor, NAV_ITEMS, ADMIN_ITEM } from './nav';
import { UserMenu } from './user-menu';

/**
 * Khung ứng dụng — ADR 012.
 *
 * Điều hướng trên cùng thay cho sidebar: app chỉ có 3–4 điểm đến, một cột 272px cho chừng
 * đó mục là phí chiều ngang ở mọi màn.
 *
 * Website (từ `md`): thanh trên phẳng, dùng chuột. Điện thoại: dock nổi ở vùng ngón cái. Đây là hai
 * mẫu riêng, xem UI_PLATFORM_RULES.md ở gốc workspace.
 *
 * Không đặt logo hay tên ứng dụng ở đây: mascot chỉ xuất hiện khi có điều để nói (trạng thái
 * trống, tiến độ, kết quả). Một mặt cười đứng yên cạnh menu vừa vô cảm, vừa khiến màn hình có
 * hai mascot cùng lúc. Tên ứng dụng đã có ở tiêu đề tab.
 *
 * Dưới `md`: thanh tab đáy (vùng ngón cái), có `safe-area-inset-bottom`.
 * "Cài đặt" nằm trong menu tài khoản ở desktop, và là một tab ở mobile.
 *
 * Nền phẳng: màn làm việc dành màu cho dữ liệu. Sóng hạt chỉ còn ở màn đăng nhập và màn lỗi.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === 'ADMIN';
  const topItems = NAV_ITEMS.filter((i) => i.href !== '/settings');
  const desktopItems = isAdmin ? [...topItems, ADMIN_ITEM] : topItems;
  const mobileItems = navItemsFor(user?.role);
  const wide = pathname.startsWith('/admin');
  const workspace = pathname.endsWith('/practice');
  // max-w-6xl (1152px) cho màn laptop trở lên. Admin rộng hơn cho bảng nhiều cột.
  const container = cn(
    'mx-auto w-full px-5 sm:px-8',
    workspace ? 'max-w-[88rem]' : wide ? 'max-w-7xl' : 'max-w-6xl',
  );

  return (
    <div className="relative isolate min-h-dvh bg-app">
      <a
        href="#main"
        className="sr-only rounded-control bg-panel px-4 py-2.5 text-sm font-medium text-accent shadow-raised focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus-ring"
      >
        Bỏ qua tới nội dung chính
      </a>

      <header className="z-30 bg-app md:sticky md:top-0 md:border-b md:border-line md:bg-panel">
        <div className={cn(container, 'flex h-14 items-center gap-6')}>
          <nav aria-label="Điều hướng chính" className="hidden h-full md:block">
            <ul className="-ml-3 flex h-full items-stretch gap-1">
              {desktopItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="flex">
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center border-b-2 px-3 text-sm font-medium transition-colors duration-150 focus-ring',
                        active
                          ? 'border-brand font-semibold text-fg'
                          : 'border-transparent text-fg-subtle hover:text-fg',
                      )}
                    >
                      {item.label}
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
                className: cn('hidden', pathname !== '/courses' && 'md:inline-flex'),
              })}
            >
              <Icon name="plus" size={15} />
              Tạo khóa học
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className={cn(container, 'scroll-mt-20 pb-32 pt-2 outline-none md:pb-16 md:pt-8')}
      >
        <Reveal key={pathname}>{children}</Reveal>
      </main>

      {/* Thanh dock nổi trên điện thoại: mục nào cũng có icon và chữ, người mới không phải đoán. */}
      <nav
        aria-label="Điều hướng chính, thanh dưới"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-30 rounded-[1.75rem] bg-block-ink p-1.5 shadow-overlay md:hidden"
      >
        <ul className="grid grid-cols-4 gap-1">
          {mobileItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-14 flex-col items-center justify-center gap-0.5 rounded-[1.375rem] text-xs font-semibold transition-colors duration-150 focus-ring-dark',
                    active ? 'bg-brand text-on-brand' : 'text-white/75',
                  )}
                >
                  <Icon name={item.icon} size={20} strokeWidth={active ? 2.25 : 1.75} />
                  <span className="max-w-full truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
