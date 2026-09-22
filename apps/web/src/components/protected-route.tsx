'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from './ui';

/** Chặn trang yêu cầu đăng nhập: guest → /login?next=..., loading → placeholder. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') {
      const next = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
    }
  }, [status, pathname, router]);

  if (status === 'loading') return <AppShellSkeleton />;
  if (status === 'guest') return null;
  return <>{children}</>;
}

/**
 * Khung chờ có hình dạng `AppShell` — cột trái 256px + nội dung — thay vì một dòng
 * chữ căn giữa. Đây từng là text-spinner duy nhất của cả app: mọi màn khác đều dùng
 * skeleton mang hình dạng thứ sắp hiện ra (UI-GUIDE §4c), còn màn này thì không,
 * nên chuyển trang vào `AppShell` bị giật một nhịp.
 *
 * Không import `AppShell` thật — nó cần `useAuth()` đã có `user`, thứ chưa tồn tại
 * lúc `status === 'loading'`. Bản khung này chỉ mô phỏng hình dạng, không hành vi.
 */
function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-surface-100" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải</span>
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-surface-300 bg-white px-3 py-5 md:flex">
        <Skeleton className="mb-7 h-8 w-28" />
        <div className="space-y-1.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </aside>
      <div className="md:pl-64">
        <div className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b border-surface-200 bg-surface-100/90 px-4 md:px-8">
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
