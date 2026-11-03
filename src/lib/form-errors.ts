import type { ZodError } from 'zod';

/**
 * Zod trả về một mảng issue; form thì cần biết **ô nào** sai để đánh dấu đúng
 * ô đó. Hai màn đăng nhập/đăng ký trước đây chỉ lấy `issues[0].message` rồi đổ
 * vào một banner ở cuối form: người dùng đọc "Mật khẩu phải có ít nhất 8 ký tự"
 * mà không ô nào được đánh dấu, và phải tự đoán xem lỗi thuộc về ô nào.
 *
 * Luật: báo lỗi form phải chỉ đúng chỗ sai và đưa người dùng tới đó —
 * `docs/UX-UI-PRINCIPLES.md` §8, `docs/UI-GUIDE.md` §10
 * (NN/g — 10 Design Guidelines for Reporting Errors in Forms).
 */
export function fieldErrorsFrom<T extends string>(
  error: ZodError,
  fields: readonly T[],
): Partial<Record<T, string>> {
  const out: Partial<Record<T, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== 'string') continue;
    if (!(fields as readonly string[]).includes(key)) continue;
    const field = key as T;
    // Một ô có thể vi phạm nhiều luật; chỉ hiện luật đầu để không dội chữ.
    if (out[field] === undefined) out[field] = issue.message;
  }
  return out;
}

/**
 * Đưa focus về ô sai **đầu tiên theo thứ tự trên form** (không phải theo thứ tự
 * Zod trả về), vì đó là ô người dùng sẽ sửa trước. `id` của ô trùng tên trường.
 */
export function focusFirstError<T extends string>(
  fields: readonly T[],
  errors: Partial<Record<T, string>>,
) {
  const first = fields.find((field) => errors[field] !== undefined);
  if (first === undefined) return;
  document.getElementById(first)?.focus();
}
