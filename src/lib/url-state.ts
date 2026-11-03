'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

/**
 * Bộ lọc và ô tìm kiếm sống trong URL chứ không trong `useState`.
 *
 * Lý do là luật IA ở `docs/UX-UI-PRINCIPLES.md` §12: trạng thái quan trọng của
 * màn hình phải nằm trong URL, để F5 không mất, để gửi link cho người khác thì
 * họ thấy đúng thứ mình đang thấy, và để nút Back của trình duyệt làm đúng việc
 * người dùng nghĩ nó làm.
 *
 * `replace` chứ không `push`: mỗi lần đổi bộ lọc mà thêm một mục vào lịch sử
 * thì bấm Back mười lần mới ra khỏi màn.
 */
export function useQueryParam(key: string, fallback = ''): [string, (next: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = params.get(key) ?? fallback;

  const setValue = useCallback(
    (next: string) => {
      const draft = new URLSearchParams(params.toString());
      if (next) draft.set(key, next);
      else draft.delete(key);
      const qs = draft.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [key, params, pathname, router],
  );

  return [value, setValue];
}

/**
 * Biến thể cho ô tìm kiếm: ô nhập phản hồi ngay từng phím (dưới 100ms như §1.3
 * đòi), còn URL và lời gọi API chỉ chạy sau khi người dùng ngừng gõ. Trước đây
 * mỗi ký tự là một request tới `/admin/users?q=…`.
 */
export function useDebouncedQueryParam(
  key: string,
  delay = 300,
): [string, (next: string) => void, string] {
  const [committed, setCommitted] = useQueryParam(key);
  const [draft, setDraft] = useState(committed);

  // URL đổi từ bên ngoài (Back/Forward, dán link) thì ô nhập phải theo.
  useEffect(() => {
    setDraft(committed);
  }, [committed]);

  useEffect(() => {
    if (draft === committed) return;
    const t = setTimeout(() => setCommitted(draft), delay);
    return () => clearTimeout(t);
  }, [draft, committed, delay, setCommitted]);

  return [draft, setDraft, committed];
}
