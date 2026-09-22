import type { Metadata } from 'next';
import { RegisterView } from './register-view';

export const metadata: Metadata = {
  title: 'Đăng ký',
};

export default function RegisterPage() {
  return <RegisterView />;
}
