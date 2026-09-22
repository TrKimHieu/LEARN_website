import { redirect } from 'next/navigation';

/**
 * Landing/portfolio marketing đã bị bỏ — `/` không còn là trang giới thiệu, chuyển
 * thẳng vào app. `/dashboard` đứng sau `ProtectedRoute` nên guest tự động bị đẩy tới
 * `/login`, đã đăng nhập thì vào thẳng dashboard.
 */
export default function HomePage() {
  redirect('/dashboard');
}
