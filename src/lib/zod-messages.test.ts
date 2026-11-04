import { describe, expect, it } from 'vitest';
import { registerSchema } from '@learn/api-contracts';
import { z } from 'zod';
import './zod-messages';

const messages = (schema: z.ZodType, value: unknown) => {
  const result = schema.safeParse(value);
  return result.success ? [] : result.error.issues.map((i) => i.message);
};

describe('thông báo lỗi biểu mẫu', () => {
  it('schema đóng gói trong contracts cũng nhận tiếng Việt', () => {
    expect(messages(registerSchema, { displayName: 'A', email: 'sai', password: '1' })).toEqual([
      'Email không hợp lệ.',
      'Cần ít nhất 8 ký tự.',
      'Cần ít nhất 2 ký tự.',
    ]);
  });

  it('ô bắt buộc để trống', () => {
    expect(messages(z.string().min(1), '')).toEqual(['Không được để trống.']);
    expect(messages(z.string(), undefined)).toEqual(['Không được để trống.']);
  });

  it('quá dài', () => {
    expect(messages(z.string().max(3), 'abcd')).toEqual(['Tối đa 3 ký tự.']);
  });

  it('message viết riêng trong schema vẫn được ưu tiên', () => {
    expect(messages(z.string().min(1, { message: 'Nhập tên.' }), '')).toEqual(['Nhập tên.']);
  });
});
