import {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowUpRight,
  BookOpen,
  BookOpenText,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  ChartBar,
  Check,
  CheckCircle,
  CircleNotch,
  Clock,
  CloudArrowUp,
  Cpu,
  CreditCard,
  CurrencyDollar,
  DotsSixVertical,
  Eye,
  EyeSlash,
  FileText,
  Fire,
  Gear,
  GraduationCap,
  House,
  Info,
  Lightning,
  List,
  ListChecks,
  Lock,
  MagnifyingGlass,
  Monitor,
  Moon,
  PencilSimple,
  Play,
  Plus,
  Pulse,
  ShieldCheck,
  SignOut,
  Sparkle,
  SquaresFour,
  Stack,
  Star,
  Sun,
  Target,
  Trash,
  TrendUp,
  Trophy,
  UploadSimple,
  User,
  Users,
  Warning,
  X,
  XCircle,
} from '@phosphor-icons/react/ssr';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/lib';

/**
 * Bộ icon — mặt tiền `<Icon name="..." />`, ruột **Phosphor** (ADR 013; trước đó Lucide).
 *
 * Vì sao đổi: nét mảnh 2px của Lucide là lựa chọn mặc định của gần như mọi giao diện sinh tự
 * động, và ở 16px nó nhạt hơn chữ đi cạnh. Phosphor Bold có nét dày đều, đọc rõ ở cỡ nhỏ và
 * cùng "sức nặng" với chữ Mona Sans 500–600. Dùng entry `/ssr` — không cần React context,
 * chạy được cả trong server component lẫn client component.
 *
 * Mặt tiền giữ nguyên nên không call site nào phải sửa: `strokeWidth` cũ được ánh xạ sang
 * `weight` (< 2 → Regular, còn lại → Bold), `filled` → Fill.
 *
 * Icon ở đây **luôn là trang trí** (`aria-hidden`) — ý nghĩa nằm ở nhãn chữ hoặc `aria-label`.
 */
const ICONS = {
  activity: Pulse,
  alert: Warning,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up-right': ArrowUpRight,
  book: BookOpen,
  'book-check': BookOpenText,
  chart: ChartBar,
  check: Check,
  'chevron-down': CaretDown,
  'chevron-left': CaretLeft,
  'chevron-right': CaretRight,
  'chevron-up': CaretUp,
  'circle-check': CheckCircle,
  'circle-x': XCircle,
  clock: Clock,
  cloud: CloudArrowUp,
  cpu: Cpu,
  card: CreditCard,
  dollar: CurrencyDollar,
  edit: PencilSimple,
  external: ArrowSquareOut,
  eye: Eye,
  'eye-off': EyeSlash,
  file: FileText,
  flame: Fire,
  grad: GraduationCap,
  grid: SquaresFour,
  grip: DotsSixVertical,
  home: House,
  info: Info,
  layers: Stack,
  list: ListChecks,
  lock: Lock,
  logout: SignOut,
  menu: List,
  monitor: Monitor,
  moon: Moon,
  play: Play,
  plus: Plus,
  retry: ArrowCounterClockwise,
  search: MagnifyingGlass,
  settings: Gear,
  shield: ShieldCheck,
  sparkles: Sparkle,
  spinner: CircleNotch,
  star: Star,
  sun: Sun,
  target: Target,
  trash: Trash,
  trend: TrendUp,
  trophy: Trophy,
  upload: UploadSimple,
  user: User,
  users: Users,
  x: X,
  zap: Lightning,
} as const satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

/** Danh sách tên — cho bảng mẫu `/dev/ui`, để icon mới không thành icon mồ côi. */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className,
  filled = false,
}: {
  name: IconName;
  size?: number;
  /** Tương thích mặt tiền cũ: < 2 → Regular, còn lại → Bold. */
  strokeWidth?: number;
  className?: string;
  /** Tô đặc (Phosphor Fill). */
  filled?: boolean;
}) {
  const Glyph = ICONS[name];
  const weight = filled ? 'fill' : strokeWidth < 2 ? 'regular' : 'bold';
  return (
    <Glyph size={size} weight={weight} className={className} aria-hidden="true" focusable="false" />
  );
}
