'use client';

import { notFound } from 'next/navigation';

/**
 * Lỗi mẫu — **chỉ ở môi trường dev** (`/dev/error`).
 *
 * Màn lỗi cấp route (`app/error.tsx`) chỉ hiện khi một trang ném lỗi lúc render, nên không có URL
 * nào mở thẳng tới nó. Route này ném lỗi có chủ đích để soát màn đó bằng mắt và để
 * `scripts/export-design-pdf.mjs` chụp được màn thật cho tài liệu thiết kế.
 */
export default function DevErrorPage(): never {
  if (process.env.NODE_ENV === 'production') notFound();
  throw new Error('Lỗi mẫu của /dev/error — dùng để xem màn error boundary.');
}
