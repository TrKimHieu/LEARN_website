import Link from 'next/link';
import { Brand } from '@/features/shell/brand';
import { DotField, Eyebrow, GrainWaves, Orbit, Sparkle } from '@/components/shared/decor';

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
    body: 'PDF có lớp chữ, Word, PowerPoint, TXT hoặc Markdown.',
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
    <div className="relative isolate min-h-dvh overflow-hidden bg-app">
      <GrainWaves variant="hero" className="-z-10" />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <DotField className="absolute right-[5%] top-[7%]" />
        <Orbit className="absolute right-[6%] top-[14%] w-[min(32vw,440px)]" />
        <Sparkle size={30} twinkle={0} className="absolute right-[36%] top-[30%]" />
        <Sparkle size={14} twinkle={1700} className="absolute right-[32%] top-[24%] opacity-70" />
        <Sparkle size={22} twinkle={3400} className="absolute right-[44%] top-[16%] opacity-80" />
        <Sparkle size={20} twinkle={4600} className="absolute right-[9%] top-[50%] opacity-80" />
      </div>

      <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="flex min-h-dvh flex-col px-5 py-6 sm:px-12">
          <Link href="/login" className="w-fit rounded-control focus-ring">
            <Brand />
          </Link>
          <main className="flex flex-1 items-center py-10">
            <div className="mx-auto w-full max-w-[27rem] animate-rise rounded-panel border border-line bg-panel px-6 py-8 shadow-overlay sm:px-9 sm:py-10">
              {children}
            </div>
          </main>
        </div>

        <section
          aria-labelledby="auth-pitch"
          className="hidden flex-col justify-end px-12 pb-16 pt-24 lg:flex xl:px-16 xl:pb-20"
        >
          {/* `text-fg`, không `accent`: chữ đặt thẳng trên sóng phải là navy (UI-GUIDE §2). Đo thật trên
              nền hạt: accent 12px chỉ đạt 2.1:1 (tối) / 4.2:1 (sáng). */}
          <Eyebrow animated className="animate-rise text-fg [animation-delay:120ms]">
            Khóa học từ tài liệu
          </Eyebrow>
          <h2 id="auth-pitch" className="mt-6 text-fg">
            <span className="block animate-rise font-display text-[2rem] font-normal italic leading-tight text-fg-muted [animation-delay:240ms] xl:text-[2.5rem]">
              Biến tài liệu của bạn thành
            </span>
            <span className="mt-1 block animate-rise font-display text-[4.25rem] font-bold leading-[1] tracking-[-0.01em] [animation-delay:360ms] xl:text-[5.25rem]">
              bài học tương tác.
            </span>
          </h2>
          <ol className="mt-12 grid max-w-2xl grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="animate-rise"
                style={{ animationDelay: `${520 + i * 90}ms` }}
              >
                <span className="font-display text-2xl italic leading-none text-fg">0{i + 1}</span>
                <p className="mt-3 text-sm font-semibold text-fg">{s.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-fg">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
