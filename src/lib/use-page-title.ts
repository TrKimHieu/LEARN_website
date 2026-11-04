'use client';

import { useEffect } from 'react';
import { BRAND } from '@/lib/brand';

/** Trang client không dùng được `metadata` của Next; không có tiêu đề riêng thì mọi tab đều giống nhau. */
export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · ${BRAND.name}`;
  }, [title]);
}
