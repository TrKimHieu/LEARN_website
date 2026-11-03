import type { Metadata } from 'next';
import { ResetPasswordView } from '@/features/auth/reset-password-view';

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
  // Trang chứa mã bí mật trong URL — không lập chỉ mục.
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return <ResetPasswordView />;
}
