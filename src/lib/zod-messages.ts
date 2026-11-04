import { z } from 'zod';

/**
 * Thông báo mặc định của Zod là tiếng Anh và hiện thẳng dưới ô nhập. Message viết riêng trong schema
 * vẫn được ưu tiên; đây chỉ là mặc định. Áp dụng cho cả schema trong gói contracts vì dùng chung một
 * bản `zod`.
 */
z.config({
  customError: (issue) => {
    if (issue.code === 'too_small' && issue.origin === 'string') {
      return Number(issue.minimum) <= 1
        ? 'Không được để trống.'
        : `Cần ít nhất ${String(issue.minimum)} ký tự.`;
    }
    if (issue.code === 'too_big' && issue.origin === 'string') {
      return `Tối đa ${String(issue.maximum)} ký tự.`;
    }
    if (issue.code === 'invalid_format' && issue.format === 'email') return 'Email không hợp lệ.';
    if (issue.input === undefined) return 'Không được để trống.';
    return 'Giá trị không hợp lệ.';
  },
});
