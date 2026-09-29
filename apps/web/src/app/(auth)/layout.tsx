import Link from 'next/link';
import { BRAND } from '@learn/ui';
import { Brand } from '@/features/shell/brand';

/**
 * Khung đăng nhập/đăng ký — ADR 012.
 *
 * Form ở trái (nơi mắt đọc trước, theo hướng đọc), một cột giải thích ở phải, cùng nền
 * sáng. Bản v3 dùng panel navy "aurora" + lưới chấm + hình lộ trình mẫu — một khối tối
 * lớn tranh sự chú ý với chính cái form người dùng đến để điền.
 *
 * Cột phải chỉ kể ba việc đã có trong MVP (AGENTS.md cấm trình bày tính năng chưa làm như
 * đã làm). Không mascot: HANDBOOK §13.1 `[SPEC]` giới hạn mascot ở hero trang giới thiệu,
 * empty state, tiến độ AI Job và lỗi.
 */
const STEPS: { title: string; body: string; tone: string }[] = [
  {
    title: 'Tải tài liệu của bạn lên',
    body: 'PDF có lớp chữ, Word, PowerPoint, TXT hoặc Markdown: giáo trình, ghi chú, slide.',
    tone: 'text-on-pastel-sky',
  },
  {
    title: 'AI dựng lộ trình bài học',
    body: 'Dàn ý, bài học và bài tập được tạo từ chính nội dung tài liệu, chạy nền.',
    tone: 'text-on-pastel-mint',
  },
  {
    title: 'Học, làm bài, xem tiến độ',
    body: 'Nộp bài là có điểm và lời giải thích; tiến độ từng khóa được lưu lại.',
    tone: 'text-on-pastel-lemon',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-app lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-h-dvh flex-col bg-panel px-6 py-6 sm:px-12 lg:border-r lg:border-line">
        <Link href="/login" className="w-fit rounded-control focus-ring">
          <Brand />
        </Link>
        <main className="flex flex-1 items-center py-12">
          <div className="mx-auto w-full max-w-[24rem]">{children}</div>
        </main>
      </div>

      <section
        aria-labelledby="auth-pitch"
        className="hidden flex-col justify-center px-12 py-16 lg:flex xl:px-20"
      >
        <div className="max-w-md">
          <h2
            id="auth-pitch"
            className="text-[2.5rem] font-semibold leading-[1.12] tracking-[-0.025em] text-fg"
          >
            {BRAND.taglineVi}
          </h2>
          <ol className="mt-12 space-y-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-4">
                <span className={`text-2xl font-semibold leading-none tabular-nums ${s.tone}`}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-fg">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-subtle">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
