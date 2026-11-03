/**
 * Đọc kết quả "thành công một phần" của AIJob.
 *
 * Để ở `lib/` chứ không nằm trong component: đây là logic thuần, không dính React, và một
 * unit test cho nó thì không nên phải kéo theo cả cây component (mascot, motion, Next.js).
 */
interface PartialFailure {
  node: string;
  errors: string[];
}

/**
 * Rút danh sách phần thất bại từ `error.detail` của AIJob.
 *
 * `detail` có kiểu `unknown` trong contract (nội dung khác nhau tuỳ `code`), nên phải tự kiểm
 * từng lớp thay vì ép kiểu — dữ liệu này do worker ghi, và một job cũ có thể mang hình dạng
 * khác. Hình dạng sai thì coi như không có phần nào thất bại, không làm hỏng màn hình.
 */
export function partialFailuresOf(error: { code: string; detail: unknown } | null | undefined) {
  if (error?.code !== 'PARTIAL_FAILURES') return [];
  const detail = error.detail;
  if (typeof detail !== 'object' || detail === null) return [];
  const list = (detail as { partialFailures?: unknown }).partialFailures;
  if (!Array.isArray(list)) return [];

  return list.flatMap((item): PartialFailure[] => {
    if (typeof item !== 'object' || item === null) return [];
    const { node, errors } = item as { node?: unknown; errors?: unknown };
    if (typeof node !== 'string') return [];
    return [
      {
        node,
        errors: Array.isArray(errors)
          ? errors.filter((e): e is string => typeof e === 'string')
          : [],
      },
    ];
  });
}
