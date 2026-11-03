'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Icon, cn, type IconName } from '@/components/ui';

const ADMIN_NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin/metrics', label: 'Tổng quan', icon: 'chart' },
  { href: '/admin/users', label: 'Người dùng', icon: 'users' },
  { href: '/admin/courses', label: 'Khóa học', icon: 'layers' },
  { href: '/admin/ai-jobs', label: 'AI Job', icon: 'cpu' },
  { href: '/admin/subscriptions', label: 'Gói đăng ký', icon: 'card' },
];

/**
 * Chặn LEARNER — máy chủ đã chặn ở RolesGuard; đây là lớp UX (redirect ngay, không
 * hiện màn hình 403 vô nghĩa).
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'authed' && user?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [status, user?.role, router]);

  if (status !== 'authed' || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div>
      <nav
        aria-label="Điều hướng quản trị"
        className="-mx-4 mb-10 overflow-x-auto border-b border-line px-4 scrollbar-none sm:mx-0 sm:px-0"
      >
        <ul className="flex min-w-max gap-6">
          {ADMIN_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    '-mb-px flex h-10 items-center gap-2 whitespace-nowrap border-b-2 text-sm font-medium transition-colors duration-150 focus-ring',
                    active
                      ? 'border-fg text-fg'
                      : 'border-transparent text-fg-subtle hover:border-line-strong hover:text-fg',
                  )}
                >
                  <Icon name={item.icon} size={15} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {children}
    </div>
  );
}
