'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/components/ui';

const ADMIN_NAV = [
  { href: '/admin/metrics', label: 'Tổng quan' },
  { href: '/admin/users', label: 'Người dùng' },
  { href: '/admin/courses', label: 'Khóa học' },
  { href: '/admin/ai-jobs', label: 'AI Job' },
  { href: '/admin/subscriptions', label: 'Gói đăng ký' },
] as const;

/** Chặn LEARNER — HANDBOOK checklist "toàn bộ trang admin chặn LEARNER". Máy chủ đã chặn ở RolesGuard;
 * đây là lớp UX (redirect ngay, không hiện màn hình chờ 403 vô nghĩa). */
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
        className="mb-6 flex gap-1.5 overflow-x-auto border-b-2 border-surface-300 pb-3"
      >
        {ADMIN_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200',
                'focus-ring',
                active
                  ? 'bg-sky-50 font-semibold text-sky-700'
                  : 'text-ink-500 hover:bg-surface-200 hover:text-ink-900',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
