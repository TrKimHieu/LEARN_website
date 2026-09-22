'use client';

/**
 * Lưới cuối cùng — bắt lỗi ngay trong `app/layout.tsx` (providers, font, …).
 * Next yêu cầu file này tự vẽ `<html>`/`<body>` vì root layout, nơi đang gây lỗi,
 * không còn tin được để bọc quanh nó.
 *
 * Cố ý KHÔNG dùng `ErrorState`/`Mascot`: `Mascot` nạp qua `next/dynamic`, và nếu
 * chính hệ thống module/bundle là thứ đang hỏng thì đây không phải lúc kéo thêm
 * một chunk động nữa vào. Markup thuần, không phụ thuộc token Tailwind (khối
 * `[SPEC]` có thể chưa nạp được) — inline style để chắc chắn còn đọc được.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          background: '#f4fbff',
          color: '#0f1720',
          padding: '1rem',
        }}
      >
        <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2.5rem', lineHeight: 1, margin: 0 }} aria-hidden="true">
            🙁
          </p>
          <h1 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>
            Ứng dụng gặp lỗi nghiêm trọng
          </h1>
          <p style={{ marginTop: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
            Vui lòng tải lại trang. Nếu vẫn lỗi, quay lại sau ít phút.
          </p>
          {error.digest && (
            <code
              style={{
                display: 'inline-block',
                marginTop: '0.75rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.375rem',
                background: '#e9f4fb',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              {error.digest}
            </code>
          )}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={reset}
              style={{
                height: '2.5rem',
                padding: '0 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#5ec8f5',
                color: '#0b1220',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
