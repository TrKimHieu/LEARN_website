import type { Metadata } from 'next';
import { ForgotPasswordView } from './forgot-password-view';

export const metadata: Metadata = {
  title: 'Quên mật khẩu',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordView />;
}
