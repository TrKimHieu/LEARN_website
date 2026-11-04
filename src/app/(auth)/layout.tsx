import Link from 'next/link';
import { ColorBlock } from '@/components/shared/color-block';
import { Icon, type IconName } from '@/components/ui/icon';
import { AuthMascot } from '@/features/auth/auth-mascot';
import { Brand } from '@/features/shell/brand';

/**
 * Khung đăng nhập/đăng ký. Website: form bên trái, khối xanh bên phải có mascot chào và ba bước dùng
 * app. Điện thoại: dải xanh gọn phía trên form, để người dùng vào form ngay.
 */
const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'upload',
    title: 'Tải tài liệu lên',
    body: 'PDF, Word, PowerPoint, TXT hoặc Markdown.',
  },
  {
    icon: 'layers',
    title: 'AI dựng lộ trình',
    body: 'Dàn ý, bài học, bài tập sinh từ chính nội dung tài liệu.',
  },
  {
    icon: 'trophy',
    title: 'Học và xem tiến độ',
    body: 'Nộp bài có điểm và lời giải thích, tiến độ được lưu lại.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr] bg-app lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:grid-rows-1">
      <div className="flex flex-col px-5 py-4 sm:px-12 lg:min-h-dvh lg:py-6">
        <Link href="/login" className="w-fit rounded-control focus-ring">
          <Brand />
        </Link>
        <main className="flex flex-1 items-center py-4 lg:py-10">
          <div className="mx-auto w-full max-w-[27rem] animate-rise rounded-panel border border-line bg-panel px-6 py-8 sm:px-9 sm:py-10">
            {children}
          </div>
        </main>
      </div>

      <ColorBlock
        tone="brand"
        className="order-first mx-3 mt-3 flex items-center gap-4 p-5 lg:order-last lg:my-4 lg:ml-0 lg:mr-4 lg:flex-col lg:items-stretch lg:justify-between lg:p-10 xl:p-12"
      >
        <div className="flex shrink-0 items-center gap-4">
          <AuthMascot />
          <p className="hidden animate-rise rounded-card rounded-bl-sm bg-white px-5 py-3 text-[0.9375rem] font-medium leading-relaxed text-ink-on-color lg:block">
            Chào bạn! Mình sẽ cùng bạn học từ chính tài liệu của bạn.
          </p>
        </div>
        <section aria-labelledby="auth-pitch" className="min-w-0">
          <h2
            id="auth-pitch"
            className="font-display text-lg font-bold leading-snug lg:text-[2.75rem] lg:leading-[1.08]"
          >
            Biến tài liệu của bạn thành bài học tương tác
          </h2>
          <ol className="mt-8 hidden gap-3 lg:grid xl:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.title} className="rounded-card bg-white p-4 text-ink-on-color">
                <span className="grid size-10 place-items-center rounded-control bg-amber">
                  <Icon name={s.icon} size={20} />
                </span>
                <p className="mt-3 text-sm font-bold">{s.title}</p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-on-color/75">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </ColorBlock>
    </div>
  );
}
