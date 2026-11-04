import Link from 'next/link';
import { Brand } from '@/features/shell/brand';
import { Mascot } from '@/components/shared/mascot';

/**
 * Khung đăng nhập/đăng ký — ADR 018 (bố cục lấy từ ảnh tham chiếu của chủ sản phẩm).
 *
 * Nền sóng lam hạt nhiễu phủ cả màn. Form nằm trong MỘT thẻ trắng đặc ở cột trái — chữ và ô nhập
 * luôn trên nền phẳng, không kính mờ. Cột phải (từ `lg`) giữ đúng nhịp của ảnh gốc: quỹ đạo + lưới
 * chấm ở góc trên phải, tiêu đề serif lớn neo ở đáy trái — một tâm điểm, nhiều khoảng trắng.
 *
 * Tiêu đề là tagline spec §14.3 tách đôi: dòng dẫn nghiêng + dòng hiển thị đậm. Ba bước bên dưới chỉ
 * kể việc đã có trong MVP (AGENTS.md). Không mascot: HANDBOOK §13.1 `[SPEC]`.
 *
 * Chuyển động (CSS thuần, `globals.css`): sóng trôi + sao lấp lánh lệch nhịp + chấm quỹ đạo chảy là
 * nhịp nền liên tục; thẻ form và chữ hero nhích lên MỘT lần khi trang mở, so le 80–120ms theo thứ tự
 * đọc. Tất cả tắt khi hệ điều hành bật giảm chuyển động.
 */
const STEPS: { title: string; body: string }[] = [
  {
    title: 'Tải tài liệu lên',
    body: 'PDF, Word, PowerPoint, TXT hoặc Markdown.',
  },
  {
    title: 'AI dựng lộ trình',
    body: 'Dàn ý, bài học, bài tập sinh từ chính nội dung tài liệu.',
  },
  {
    title: 'Học và xem tiến độ',
    body: 'Nộp bài có điểm và lời giải thích, tiến độ được lưu lại.',
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-app lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-12">
        <Link href="/login" className="w-fit rounded-control focus-ring">
          <Brand />
        </Link>
        <main className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-[27rem] animate-rise rounded-panel border border-line bg-panel px-6 py-8 sm:px-9 sm:py-10">
            {children}
          </div>
        </main>
      </div>

      <section
        aria-labelledby="auth-pitch"
        className="m-4 ml-0 hidden flex-col justify-between rounded-panel bg-block-ink p-12 text-white lg:flex"
      >
        <Mascot state="happy" size={220} surface="ink" className="self-center" />
        <div>
          <h2 id="auth-pitch" className="font-display text-[3rem] font-bold leading-[1.05]">
            Biến tài liệu của bạn thành bài học tương tác
          </h2>
          <ul className="mt-8 grid grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <li key={s.title}>
                <p className="text-sm font-bold">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
