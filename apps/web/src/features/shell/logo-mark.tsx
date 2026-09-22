import { cn } from '@/components/ui/cn';

/**
 * Dấu hiệu thương hiệu LEARN — chính là nhân vật Circle.
 *
 * Trước đây logo là chữ "L" đặt trong ô vuông bo góc, lặp lại ở 4 chỗ với 4 đoạn
 * markup riêng (sidebar, màn đăng nhập, nav trang landing, favicon). Nay cả bốn
 * chỗ dùng chung component này.
 *
 * ## Vì sao là SVG tĩnh chứ không phải `<Mascot>` động
 *
 * `components/shared/mascot.tsx` nạp bản vendor ~115 KB, `ssr: false`, và tự chớp mắt,
 * đảo mắt, nhún người. Ba lý do không dùng nó cho logo:
 *
 * 1. **Logo phải render được ở nơi không có JavaScript** — favicon là một file
 *    `.svg` tĩnh, không có React nào chạy trong đó.
 * 2. **Logo phải có mặt ngay ở lần vẽ đầu tiên.** Component động chỉ xuất hiện
 *    sau khi hydrate xong, nên góc trên bên trái sẽ trống rồi mới "nhảy" vào.
 * 3. **Logo phải đứng yên.** Một nhân vật chớp mắt trong sidebar ở *mọi* màn sẽ
 *    liên tục kéo mắt khỏi nội dung — đúng thứ HANDBOOK §13.1 muốn tránh khi nó
 *    giới hạn chỗ đặt mascot.
 *
 * Hình ở đây vì thế là bản rút gọn, cân đối của nhân vật: vẫn hình tròn ấy, vẫn
 * cặp mắt bầu dục trắng và nụ cười ấy, nhưng đối xứng và đọc được ở 16px — cách
 * mọi logo linh vật vẫn làm. Muốn thấy nhân vật *động* thì vào hero, empty
 * state, tiến độ AI Job hoặc màn lỗi, đúng bốn vị trí §13.1 cho phép.
 *
 * ## Hai tông
 *
 * Nghệ thuật gốc gần như đen nên trên nền navy nó biến mất. `tone` đảo sắc độ:
 * - `light` — dùng trên nền sáng: khối cầu navy, điểm sáng sky, mặt trắng.
 * - `dark` — dùng trên nền navy: khối cầu sky, mặt navy-900.
 *
 * Gradient chạy từ trên-phải xuống dưới-trái, cùng hướng với gradient của mascot
 * động, nên hai thứ trông như được chiếu sáng từ một nguồn.
 */

type Tone = 'light' | 'dark';

/** [điểm sáng, giữa, bóng đổ] — thứ tự stop 0% / 55% / 100%. */
const BODY: Record<Tone, [string, string, string]> = {
  light: ['#7fd3f7', '#16202e', '#0b1220'],
  dark: ['#a9e2fa', '#5ec8f5', '#1b87b8'],
};

const FACE: Record<Tone, string> = {
  light: '#ffffff',
  dark: '#0b1220',
};

export function LogoMark({
  size = 28,
  tone = 'light',
  className,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  // Gradient nằm trong `<defs>` nên id phải là duy nhất khi có nhiều logo trên
  // cùng một trang (nav + footer chẳng hạn) — nếu trùng, cái sau đè cái trước.
  const gradientId = `logo-grad-${tone}`;
  const [highlight, mid, shade] = BODY[tone];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cn('shrink-0', className)}
      // Mọi chỗ gọi đều đã có chữ "LEARN" kèm bên cạnh hoặc nhãn riêng, nên hình
      // này là trang trí — để trình đọc màn hình khỏi đọc thừa.
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={highlight} />
          <stop offset="55%" stopColor={mid} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="50" fill={`url(#${gradientId})`} />

      {/* Mắt: bầu dục dọc, giống tỉ lệ của bản vendor (rộng ~13%, cao ~19% đường
          kính) nhưng đặt đối xứng thay vì lệch theo hướng nhìn của một frame. */}
      <ellipse cx="35.5" cy="43" rx="6.5" ry="9.5" fill={FACE[tone]} />
      <ellipse cx="64.5" cy="43" rx="6.5" ry="9.5" fill={FACE[tone]} />

      {/* Miệng: cung cười, đầu nét bo tròn như `MOUTH_STROKE` của bản vendor. */}
      <path
        d="M36 63 Q50 72 64 63"
        fill="none"
        stroke={FACE[tone]}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
