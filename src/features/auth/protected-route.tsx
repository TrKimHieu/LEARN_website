'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/auth-context';
import { Skeleton } from '@/components/ui';

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
 * Khung chờ mang hình dạng `AppShell` (ADR 012: thanh điều hướng trên cùng + nội dung) để
 * lúc vào app không giật một nhịp (UI-GUIDE §4c). Không import `AppShell` thật: nó cần
 * `user`, thứ chưa có lúc `status === 'loading'`.
 */
function AppShellSkeleton() {
  return (
    <div className="min-h-dvh bg-app" aria-busy="true" aria-live="polite">
      <span className="sr-only">Đang tải</span>
      <div className="border-b border-line bg-app">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-5 sm:px-8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="hidden h-4 w-56 md:block" />
          <Skeleton className="ml-auto size-8" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-5 pt-14 sm:px-8">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-10 w-72" />
        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <Skeleton className="h-44 rounded-card" />
          <Skeleton className="h-44 rounded-card" />
        </div>
      </div>
    </div>
  );
}
