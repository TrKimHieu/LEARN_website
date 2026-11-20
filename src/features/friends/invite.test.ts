import { describe, expect, it } from 'vitest';
import { parseInvite } from './invite';

describe('parseInvite', () => {
  it('mã mời viết thường vẫn nhận, chuyển thành in hoa', () => {
    expect(parseInvite(' ketban22 ')).toEqual({ input: { code: 'KETBAN22' } });
  });

  it('có @ là email, chuẩn hoá chữ thường', () => {
    expect(parseInvite('Lan@Example.com')).toEqual({ input: { email: 'lan@example.com' } });
  });

  it('báo lỗi đúng loại khi sai dạng', () => {
    expect(parseInvite('ABC')).toEqual({ error: 'Mã mời gồm 8 ký tự chữ và số.' });
    expect(parseInvite('O0I1O0I1')).toEqual({ error: 'Mã mời gồm 8 ký tự chữ và số.' });
    expect(parseInvite('lan@')).toEqual({ error: 'Email chưa đúng.' });
  });
});
