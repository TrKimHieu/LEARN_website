import { cn } from '@/components/ui/cn';

/**
 * Bìa khóa học sinh từ chính `id` — không cần ảnh, không cần người dùng tải lên.
 *
 * ADR 012: bìa SÁNG (nền sky-50…sky-200 / xám lạnh, hoạ tiết nét navy mảnh) ở tông sáng,
 * tối dần ở tông tối. Bản v3 dùng khối navy đặc có chữ cái to — một mảng tối giữa trang
 * sáng, bìa nào cũng đen giống nhau.
 *
 * Lý do tồn tại: lưới khóa học toàn chữ thì mọi thẻ trông như nhau và mắt phải đọc
 * từng tiêu đề mới phân biệt được. Một bìa ổn định cho mỗi khóa (cùng id → cùng hình,
 * mọi lần) cho người học một mốc nhận diện bằng hình, như bìa sách trên kệ.
 *
 * Bảng màu chỉ gồm navy + sắc độ sky của spec §14.2 — thay đổi là ở *bố cục* (vị trí
 * quầng sáng, hoạ tiết), không phải ở hue, nên không bao giờ lọt ra màu ngoài bảng.
 * Toàn bộ là trang trí: `aria-hidden`, tên khóa học luôn có ở chữ bên cạnh.
 */

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Nền bìa — [nền, màu hình khối nhấn], đơn sắc từ ADR 015: nền là 4 mức xám nhạt (token
 * `--pastel-*`, tự đổi theo `data-theme`), hình khối nhấn là 4 mức xám trung — khác nhau đủ để
 * các bìa không giống hệt nhau, không hue nào.
 */
const PASTELS = [
  ['var(--pastel-sky)', '#bfbfbf'],
  ['var(--pastel-mint)', '#a3a3a3'],
  ['var(--pastel-lemon)', '#d4d4d4'],
  ['var(--pastel-peach)', '#8c8c8c'],
] as const;

type Motif = 'rings' | 'waves' | 'grid' | 'orbit';
const MOTIFS: Motif[] = ['rings', 'waves', 'grid', 'orbit'];

/**
 * Hoạ tiết: nét mực mảnh một màu + đúng MỘT hình khối pastel đậm hơn nằm lệch — kiểu minh
 * hoạ "nét bút + một mảng màu" của ADR 013, thay khối navy đặc của v3.
 */
function MotifSvg({ motif, seed, accent }: { motif: Motif; seed: number; accent: string }) {
  const common = {
    className: 'absolute inset-0 h-full w-full',
    viewBox: '0 0 200 120',
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': true,
    fill: 'none',
  } as const;
  const ink = 'stroke-fg/25 dark:stroke-white/25';

  if (motif === 'rings') {
    const cx = 140 + (seed % 30);
    return (
      <svg {...common}>
        <circle cx={cx + 12} cy={52} r={26} fill={accent} />
        {[20, 38, 56, 74].map((r) => (
          <circle key={r} cx={cx} cy={64} r={r} className={ink} strokeWidth={1} />
        ))}
      </svg>
    );
  }
  if (motif === 'waves') {
    return (
      <svg {...common}>
        <rect x={128 + (seed % 20)} y={22} width={44} height={44} rx={6} fill={accent} />
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M-10 ${64 + i * 12} C 40 ${36 + i * 12 + (seed % 16)}, 120 ${96 + i * 8}, 210 ${56 + i * 12}`}
            className={ink}
            strokeWidth={1}
          />
        ))}
      </svg>
    );
  }
  if (motif === 'grid') {
    return (
      <svg {...common}>
        <rect x={120 + (seed % 3) * 20} y={40} width={40} height={40} fill={accent} />
        {Array.from({ length: 11 }, (_, i) => (
          <line
            key={`v${i}`}
            x1={i * 20}
            y1={0}
            x2={i * 20}
            y2={120}
            className={ink}
            strokeWidth={0.75}
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={i * 20}
            x2={200}
            y2={i * 20}
            className={ink}
            strokeWidth={0.75}
          />
        ))}
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx={132} cy={58} r={16} fill={accent} />
      <ellipse
        cx={130}
        cy={60}
        rx={78}
        ry={26}
        className={ink}
        strokeWidth={1}
        transform="rotate(-16 130 60)"
      />
      <ellipse
        cx={130}
        cy={60}
        rx={52}
        ry={16}
        className={ink}
        strokeWidth={1}
        transform="rotate(-16 130 60)"
      />
      <circle cx={60 + (seed % 30)} cy={80} r={3} className="fill-fg/40 dark:fill-white/40" />
    </svg>
  );
}

export function CourseCover({
  id,
  title,
  className,
  showInitial = true,
}: {
  id: string;
  title: string;
  className?: string;
  showInitial?: boolean;
}) {
  const h = hash(id);
  const [bg, accent] = PASTELS[h % PASTELS.length]!;
  const motif = MOTIFS[(h >>> 5) % MOTIFS.length]!;
  const initial = title.trim().charAt(0).toUpperCase() || 'L';

  return (
    <div
      aria-hidden
      className={cn('relative overflow-hidden', className)}
      style={{ backgroundColor: bg }}
    >
      <MotifSvg motif={motif} seed={h} accent={accent} />
      {showInitial && (
        <span className="font-semibold absolute bottom-3 left-4 select-none text-5xl leading-none tracking-[-0.025em] text-fg dark:text-white/90">
          {initial}
        </span>
      )}
    </div>
  );
}
