import { inviteFriendSchema, type InviteFriendInput } from '@learn/api-contracts';

/** Một ô nhập cho cả mã mời và email: có `@` là email. Trả lỗi tiếng Việt khi sai dạng. */
export function parseInvite(text: string): { input: InviteFriendInput } | { error: string } {
  const value = text.trim();
  const isEmail = value.includes('@');
  const parsed = inviteFriendSchema.safeParse(isEmail ? { email: value } : { code: value });
  if (parsed.success) return { input: parsed.data };
  return { error: isEmail ? 'Email chưa đúng.' : 'Mã mời gồm 8 ký tự chữ và số.' };
}
