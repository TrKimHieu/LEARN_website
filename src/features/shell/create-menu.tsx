'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Icon } from '@/components/ui/icon';
import { buttonClasses } from '@/components/ui/button';
import { cn } from '@/components/ui/cn';
import { CREATE_ITEMS } from './nav';

const ITEM =
  'flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-fg-muted transition-colors hover:bg-muted hover:text-fg focus-ring md:h-9';

/** Menu '＋ Tạo': disclosure như `user-menu.tsx`. `bar` ở thanh trên (Website), `dock` ở dock điện thoại. */
export function CreateMenu({ variant }: { variant: 'bar' | 'dock' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const dock = variant === 'dock';

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

  return (
    <div ref={rootRef} className={cn('relative', !dock && 'hidden md:block')}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={dock ? 'Tạo' : undefined}
        onClick={() => setOpen((v) => !v)}
        className={
          dock
            ? 'grid size-14 cursor-pointer place-items-center rounded-full bg-brand text-on-brand focus-ring-dark'
            : buttonClasses({
                variant: 'secondary',
                size: 'sm',
                className: 'cursor-pointer',
              })
        }
      >
        <Icon name="plus" size={dock ? 24 : 15} />
        {!dock && 'Tạo'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            initial={{ opacity: 0, y: dock ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-64 max-w-[calc(100vw-1rem)] rounded-card border border-line bg-panel p-1.5 shadow-overlay',
              dock
                ? 'bottom-[4.5rem] left-1/2 -translate-x-1/2'
                : 'right-0 top-11',
            )}
          >
            {CREATE_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={ITEM}
              >
                <Icon name={item.icon} size={16} />
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
