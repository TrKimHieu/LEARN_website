'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Brand } from './brand';
import { StatBar } from './stat-bar';
import { SideRail } from './side-rail';
import { Icon, type IconName } from './ui/icon';
import { cn } from './ui/cn';

type NavItem = { href: string; label: string; icon: IconName };

const NAV_ITEMS: readonly NavItem[] = [
  { href: '/dashboard', label: 'Tổng quan', icon: 'home' },
  { href: '/courses', label: 'Khóa học', icon: 'layers' },
  { href: '/progress', label: 'Tiến trình', icon: 'chart' },
  { href: '/settings', label: 'Cài đặt', icon: 'settings' },
] as const;

const ADMIN_ITEM: NavItem = { href: '/admin', label: 'Quản trị', icon: 'shield' };

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Khung ứng dụng: điều hướng trái · nội dung giữa · cột phải.
 * Dưới `lg` cột phải ẩn, dưới `md` điều hướng chuyển xuống thanh tab đáy.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, logoutAll } = useAuth();
  const pathname = usePathname();
  const navItems = user?.role === 'ADMIN' ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  // Rail phải nói về gói và hạn mức của chính người dùng — không liên quan ở
  // khu quản trị, mà màn admin lại là bảng nhiều cột cần hết chiều ngang.
  const showRail = !pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-surface-100">
      {/* Link đầu tab order: người đi bàn phím không phải Tab qua cả sidebar
          mỗi lần đổi trang. Ẩn cho tới khi được focus. */}
      <a
        href="#main"
        className="sr-only rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-sky-700 shadow-raised focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus-ring"
      >
        Bỏ qua tới nội dung chính
      </a>

      {/* ---------------------------------------------------- sidebar trái */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-surface-300 bg-white px-3 py-5 md:flex">
        <Link href="/dashboard" className="mb-7 block rounded-xl px-2 focus-ring">
          <Brand />
        </Link>

        <nav aria-label="Điều hướng chính" className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  'focus-ring',
                  active
                    ? 'bg-sky-50 font-semibold text-sky-700'
                    : 'text-ink-500 hover:bg-surface-100 hover:text-ink-900',
                )}
              >
                <Icon name={item.icon} size={18} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ------------------------------------------------ người dùng */}
        <div className="mt-auto border-t border-surface-200 pt-3">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-surface-100">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                {user?.displayName?.[0]?.toUpperCase() ?? '?'}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold text-ink-900">
                  {user?.displayName}
                </span>
                <span className="block truncate text-xs text-ink-500">{user?.email}</span>
              </span>
              <Icon
                name="chevron-down"
                size={16}
                className="shrink-0 text-ink-300 transition-transform group-open:rotate-180"
              />
            </summary>
            <div className="mt-1 space-y-0.5 px-1 pb-1">
              <button
                type="button"
                onClick={() => void logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-700 hover:bg-surface-200"
              >
                <Icon name="logout" size={16} />
                Đăng xuất
              </button>
              <button
                type="button"
                onClick={() => void logoutAll()}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-500 hover:bg-surface-200"
              >
                Đăng xuất mọi nơi
              </button>
            </div>
          </details>
        </div>
      </aside>

      {/* ------------------------------------------------------- nội dung */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b-2 border-surface-200 bg-surface-100/90 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <Brand compact />
          </div>
          <div className="ml-auto">
            <StatBar />
          </div>
        </header>

        <div
          className={cn(
            'mx-auto flex w-full gap-8 px-4 pb-24 pt-6 md:px-8 md:pb-10',
            showRail ? 'max-w-6xl' : 'max-w-7xl',
          )}
        >
          {/* `tabIndex={-1}` để skip link đưa được focus vào đây; `scroll-mt`
              giữ phần tử vừa focus không chui xuống dưới header dính. */}
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 scroll-mt-20">
            {children}
          </main>
          {showRail && (
            <aside className="hidden w-80 shrink-0 lg:block" aria-label="Gói và hạn mức">
              <div className="sticky top-24">
                <SideRail />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ----------------------------------------------- tab đáy (mobile) */}
      {/* Nhãn khác sidebar: cả hai `nav` cùng nằm trong DOM (chỉ ẩn bằng CSS
          theo cỡ màn), trùng tên thì trình đọc màn hình đọc ra hai landmark
          không phân biệt được. `pb-[env(...)]` chừa chỗ cho thanh home. */}
      <nav
        aria-label="Điều hướng chính — thanh dưới"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t-2 border-surface-300 bg-white pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                // 12px là sàn cho chữ đọc được; bỏ `uppercase` để nhãn giữ hình
                // dáng từ và hẹp lại. `min-w-0` + căn giữa: ở 320px với 5 tab
                // (vai trò admin) nhãn xuống dòng chứ không bị cắt cụt.
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2.5',
                'text-center text-xs font-bold leading-tight',
                active ? 'text-sky-700' : 'text-ink-500',
              )}
            >
              <Icon name={item.icon} size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
