'use client';

import { UserText } from '@/components/ui/user-text';
import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useAuth } from '@/features/auth/auth-context';
import { ThemeSegmented } from '@/components/shared/theme-toggle';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/components/ui/cn';
import { PlanUsage } from './plan-usage';

/** Chữ cái đầu làm avatar — ô vuông bo góc, không có ảnh đại diện thật trong hệ thống. */
export function Avatar({ name, className }: { name?: string | null; className?: string }) {
  const initial = name?.trim().split(/\s+/).pop()?.charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-8 shrink-0 place-items-center rounded-full bg-amber-soft text-sm font-semibold text-fg',
        className,
      )}
    >
      {initial}
    </span>
  );
}

const ITEM =
  'flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-fg-muted transition-colors hover:bg-muted hover:text-fg focus-ring';

/**
 * Menu tài khoản — mẫu **disclosure** (nút `aria-expanded` + khối nội dung), không phải
 * `role="menu"`: bên trong có link, nhóm radio chọn giao diện và nút. Đóng bằng Esc (focus
 * về nút) hoặc bấm ra ngoài. Gói/hạn mức và chọn giao diện ở đây thay vì chiếm chỗ cố
 * định trên màn — xem khi cần, không nhìn thấy mọi lúc.
 */
export function UserMenu() {
  const { user, logout, logoutAll } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 cursor-pointer md:h-10 items-center gap-1.5 rounded-pill border border-line bg-panel py-1 pl-1 pr-2 md:border-transparent md:bg-transparent md:hover:bg-muted transition-colors hover:bg-muted focus-ring"
      >
        <Avatar name={user?.displayName} />
        <Icon
          name="chevron-down"
          size={15}
          className={cn('text-fg-subtle transition-transform duration-150', open && 'rotate-180')}
        />
        <span className="sr-only">Tài khoản của {user?.displayName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[3.25rem] md:top-12 z-50 w-72 rounded-card border border-line bg-panel p-1.5 shadow-overlay"
          >
            <div className="px-2.5 pb-3 pt-2">
              <p className="truncate text-sm font-semibold text-fg">
                <UserText>{user?.displayName}</UserText>
              </p>
              <p className="truncate text-xs text-fg-subtle">
                <UserText>{user?.email}</UserText>
              </p>
            </div>

            <div className="border-t border-line px-2.5 py-3">
              <PlanUsage onNavigate={close} />
            </div>

            <div className="border-t border-line px-2.5 py-3">
              <p className="mb-2 text-xs text-fg-subtle">Giao diện</p>
              <ThemeSegmented />
            </div>

            <div className="space-y-0.5 border-t border-line pt-1.5">
              <Link href="/settings" onClick={close} className={ITEM}>
                <Icon name="settings" size={16} />
                Cài đặt
              </Link>
              <button type="button" onClick={() => void logout()} className={ITEM}>
                <Icon name="logout" size={16} />
                Đăng xuất
              </button>
              <button
                type="button"
                onClick={() => void logoutAll()}
                className={cn(ITEM, 'hover:bg-bad-soft hover:text-bad')}
              >
                <Icon name="lock" size={16} />
                Đăng xuất mọi thiết bị
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
