import type { Metadata } from 'next';
import { RegisterView } from '@/features/auth/register-view';

export const metadata: Metadata = {
  title: 'Đăng ký',
};

export default function RegisterPage() {
  return <RegisterView />;
}
