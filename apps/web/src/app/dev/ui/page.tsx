'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  Input,
  LoadingState,
  PageHeader,
  InlineError,
  PartialNotice,
  PasswordInput,
  ProgressBar,
  Select,
  Skeleton,
  Table,
  TableCard,
  TableEmpty,
  TableSkeleton,
  Tbody,
  Td,
  Th,
  Thead,
  Textarea,
  type BadgeTone,
  type IconName,
} from '@/components/ui';
import { Reveal, RevealOnScroll, StaggerItem, StaggerList, StaggerOnScroll } from '@/lib/motion';
import { LessonPath } from '@/components/lesson-path';
import { LogoMark } from '@/components/logo-mark';
import type { LessonSummary } from '@learn/contracts';

/**
 * Bảng mẫu giao diện — **chỉ chạy ở môi trường dev** (`/dev/ui`).
 *
 * Đây là mặt cắt duy nhất nhìn thấy toàn bộ primitive cùng lúc. Lý do tồn tại:
 *
 * - Kiểm chứng UI không cần Docker/Postgres/API. Mọi màn thật đều nằm sau
 *   `ProtectedRoute` và cần dữ liệu thật, nên trước đây muốn xem một cái nút
 *   đổi màu ra sao là phải dựng cả hạ tầng.
 * - Người (hoặc agent) sửa giao diện ở phiên sau nhìn một trang là biết đang có
 *   sẵn những gì, thay vì dựng lại component đã tồn tại.
 * - So sánh các trạng thái cạnh nhau (thường/vô hiệu/lỗi) — thứ ảnh chụp từng
 *   màn không cho thấy.
 *
 * Khi thêm primitive mới vào `components/ui/`, thêm vào đây luôn.
 */

/** Token [SPEC] §14.2 — không được đổi giá trị. */
const SPEC_TOKENS = [
  ['--color-navy-900', 'navy-900'],
  ['--color-navy-800', 'navy-800'],
  ['--color-navy-700', 'navy-700'],
  ['--color-navy-600', 'navy-600'],
  ['--color-sky-500', 'sky-500'],
  ['--color-surface-100', 'surface-100'],
  ['--color-surface-200', 'surface-200'],
  ['--color-ink-900', 'ink-900'],
  ['--color-ink-700', 'ink-700'],
  ['--color-ink-500', 'ink-500'],
  ['--color-ink-300', 'ink-300'],
] as const;

/** Token bổ sung (ADR 008) — mở rộng được, không thuộc [SPEC]. */
const EXTRA_TOKENS = [
  ['--color-sky-50', 'sky-50'],
  ['--color-sky-100', 'sky-100'],
  ['--color-sky-300', 'sky-300'],
  ['--color-sky-400', 'sky-400'],
  ['--color-sky-600', 'sky-600'],
  ['--color-sky-700', 'sky-700'],
  ['--color-navy-500', 'navy-500'],
  ['--color-surface-300', 'surface-300'],
  ['--color-surface-400', 'surface-400'],
  ['--color-success-500', 'success-500'],
  ['--color-success-700', 'success-700'],
  ['--color-danger-500', 'danger-500'],
  ['--color-danger-700', 'danger-700'],
  ['--color-warning-500', 'warning-500'],
  ['--color-warning-700', 'warning-700'],
] as const;

const ICON_NAMES: readonly IconName[] = [
  'check',
  'lock',
  'play',
  'book',
  'trophy',
  'flame',
  'target',
  'star',
  'chevron-right',
  'chevron-down',
  'chevron-left',
  'plus',
  'x',
  'alert',
  'home',
  'layers',
  'chart',
  'settings',
  'shield',
  'logout',
  'arrow-left',
  'arrow-right',
  'upload',
  'file',
  'trash',
  'edit',
  'retry',
  'search',
  'sparkles',
  'clock',
  'circle-check',
  'circle-x',
  'info',
  'eye',
  'eye-off',
  'menu',
  'external',
  'spinner',
  'grip',
];

const BADGE_TONES: readonly BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const TABLE_ROWS: ReadonlyArray<{
  title: string;
  tone: BadgeTone;
  label: string;
  lessons: number;
}> = [
  { title: 'Nhập môn thống kê', tone: 'success', label: 'Sẵn sàng', lessons: 12 },
  { title: 'Kiến trúc hệ thống', tone: 'info', label: 'Đang sinh', lessons: 4 },
  { title: 'Tiếng Anh học thuật', tone: 'danger', label: 'Lỗi', lessons: 0 },
];

/**
 * Dữ liệu giả cho `LessonPath`. Đây là màn chủ đạo của sản phẩm nhưng lại nằm
 * sâu nhất (đăng nhập → khóa học → chi tiết) và cần Postgres + worker đã sinh
 * bài, nên trước đây không thể xem nó mà không dựng cả hạ tầng. Ba trạng thái
 * node và đoạn nối đã/chưa đi qua đều có mặt ở đây.
 *
 * **9 bài** chứ không phải 5: sóng có chu kỳ 8 node, nên phải đủ 9 mới thấy trọn một vòng và
 * kiểm được rằng node thứ 9 quay lại đúng vị trí của node đầu.
 */
const DEMO_LESSONS: LessonSummary[] = [
  {
    id: 'd1',
    title: 'Biến ngẫu nhiên là gì',
    orderIndex: 0,
    status: 'PUBLISHED',
    exerciseCount: 2,
    progressStatus: 'COMPLETED',
    bestScore: 9,
  },
  {
    id: 'd2',
    title: 'Kỳ vọng và phương sai',
    orderIndex: 1,
    status: 'PUBLISHED',
    exerciseCount: 3,
    progressStatus: 'COMPLETED',
    bestScore: 7,
  },
  {
    id: 'd3',
    title: 'Phân phối chuẩn',
    orderIndex: 2,
    status: 'PUBLISHED',
    exerciseCount: 2,
    progressStatus: 'IN_PROGRESS',
    bestScore: null,
  },
  {
    id: 'd4',
    title: 'Định lý giới hạn trung tâm',
    orderIndex: 3,
    status: 'DRAFT',
    exerciseCount: 0,
    progressStatus: 'NOT_STARTED',
    bestScore: null,
  },
  {
    id: 'd5',
    title: 'Khoảng tin cậy',
    orderIndex: 4,
    status: 'DRAFT',
    exerciseCount: 0,
    progressStatus: 'NOT_STARTED',
    bestScore: null,
  },
  {
    id: 'd6',
    title: 'Kiểm định giả thuyết',
    orderIndex: 5,
    status: 'DRAFT',
    exerciseCount: 2,
    progressStatus: 'NOT_STARTED',
    bestScore: null,
  },
  {
    id: 'd7',
    title: 'Hồi quy tuyến tính',
    orderIndex: 6,
    status: 'DRAFT',
    exerciseCount: 3,
    progressStatus: 'NOT_STARTED',
    bestScore: null,
  },
  {
    id: 'd8',
    title: 'Tương quan và nhân quả',
    orderIndex: 7,
    status: 'DRAFT',
    exerciseCount: 2,
    progressStatus: 'NOT_STARTED',
    bestScore: null,
  },
  {
    id: 'd9',
    title: 'Lấy mẫu và sai số',
    orderIndex: 8,
    status: 'DRAFT',
    exerciseCount: 2,
    progressStatus: 'NOT_STARTED',
    bestScore: null,
  },
];

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="size-10 shrink-0 rounded-xl border-2 border-surface-300"
        style={{ background: `var(${varName})` }}
      />
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold text-ink-900">{label}</span>
        <span className="block truncate font-mono text-2xs text-ink-500">{varName}</span>
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 border-b-2 border-surface-300 pb-1.5 text-sm font-bold uppercase tracking-widest text-ink-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function UiStyleguidePage() {
  // Công cụ nội bộ: không tồn tại trong bản build production.
  if (process.env.NODE_ENV === 'production') notFound();

  const [progress, setProgress] = useState(45);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        title="Bảng mẫu giao diện"
        description="Chỉ có ở môi trường dev. Mọi primitive trong components/ui/ nằm ở đây."
        action={
          <Badge tone="warning" icon="alert">
            dev only
          </Badge>
        }
      />

      <Section title="Logo">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex items-center gap-5">
            <LogoMark size={64} />
            <div className="flex items-end gap-3">
              <LogoMark size={40} />
              <LogoMark size={28} />
              <LogoMark size={20} />
              <LogoMark size={16} />
            </div>
          </Card>
          <Card padded={false} className="flex items-center gap-5 bg-navy-900 p-5">
            <LogoMark size={64} tone="dark" />
            <div className="flex items-end gap-3">
              <LogoMark size={40} tone="dark" />
              <LogoMark size={28} tone="dark" />
              <LogoMark size={20} tone="dark" />
              <LogoMark size={16} tone="dark" />
            </div>
          </Card>
        </div>
        <p className="mt-2 text-xs text-ink-500">
          <code className="font-mono">tone=&quot;light&quot;</code> cho nền sáng,{' '}
          <code className="font-mono">tone=&quot;dark&quot;</code> cho nền navy. 16px là cỡ nhỏ nhất
          phải còn đọc được — favicon. SVG tĩnh, không phải mascot động.
        </p>
      </Section>

      <Section title="Màu — [SPEC] §14.2, không đổi">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SPEC_TOKENS.map(([v, l]) => (
            <Swatch key={v} varName={v} label={l} />
          ))}
        </div>
      </Section>

      <Section title="Màu — bổ sung (ADR 008)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {EXTRA_TOKENS.map(([v, l]) => (
            <Swatch key={v} varName={v} label={l} />
          ))}
        </div>
      </Section>

      {/* Token không phải màu cũng phải có mẫu, nếu không nó thành token mồ côi
          y hệt một màu không ai nhìn thấy. */}
      <Section title="Bo góc và độ nổi (ADR 008)">
        <Card className="space-y-6">
          <div>
            <p className="mb-3 text-xs text-ink-500">
              Bán kính ngoài = bán kính trong + padding (UX-UI-PRINCIPLES §3.4). Điều khiển nằm
              trong thẻ, thẻ nằm trong panel.
            </p>
            <div className="flex flex-wrap gap-3">
              {(
                [
                  ['rounded-control', '0.5rem · điều khiển'],
                  ['rounded-card', '1rem · thẻ'],
                  ['rounded-panel', '1.5rem · panel'],
                  ['rounded-pill', 'pill · nhãn'],
                ] as const
              ).map(([cls, label]) => (
                <div key={cls} className="text-center">
                  <div className={`size-20 border border-surface-300 bg-surface-100 ${cls}`} />
                  <p className="mt-1.5 font-mono text-2xs text-ink-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-surface-200 pt-5">
            <p className="mb-3 text-xs text-ink-500">
              Ba bậc, một hướng nguồn sáng — thẳng từ trên xuống, không lệch ngang (UX-UI-PRINCIPLES
              §3.5).
            </p>
            <div className="flex flex-wrap gap-5">
              {(
                [
                  ['shadow-card', 'thẻ'],
                  ['shadow-raised', 'nổi tạm thời'],
                  ['shadow-overlay', 'chiếm quyền'],
                ] as const
              ).map(([cls, label]) => (
                <div key={cls} className="text-center">
                  <div className={`size-20 rounded-card bg-white ${cls}`} />
                  <p className="mt-1.5 font-mono text-2xs text-ink-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-surface-200 pt-5">
            <p className="mb-3 text-xs text-ink-500">
              Vòng focus — bấm Tab vào ba nút dưới. Nền tối dùng <code>focus-ring-dark</code> vì
              sky-600 chìm trên navy.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="focus-ring rounded-control border border-surface-300 bg-white px-3 py-2 text-sm"
              >
                focus-ring
              </button>
              <input
                aria-label="Mẫu focus-ring-tight"
                placeholder="focus-ring-tight"
                className="focus-ring-tight rounded-control border border-surface-300 px-3 py-2 text-sm outline-none"
              />
              <span className="rounded-control bg-navy-900 p-2">
                <button
                  type="button"
                  className="focus-ring-dark rounded-control border border-white/25 px-3 py-2 text-sm text-surface-100"
                >
                  focus-ring-dark
                </button>
              </span>
            </div>
          </div>
        </Card>
      </Section>

      <Section title="Chữ — thang">
        <Card className="space-y-2">
          <p className="text-2xl font-bold text-ink-900">Tiêu đề trang · 2xl bold</p>
          <p className="text-base font-bold text-ink-900">Tiêu đề thẻ · base bold</p>
          <p className="text-sm text-ink-700">Nội dung chính · sm ink-700</p>
          <p className="text-xs text-ink-500">Chú thích · xs ink-500</p>
          <p className="font-mono text-xs text-ink-700">Mã · font-mono xs</p>
          {/* Token mới (GĐ7a) — thay 7 chỗ từng viết tay text-[11px]/text-[10px] rời
              rạc: eyebrow trang chủ, mã kỹ thuật, tên token ở chính trang này. */}
          <p className="font-mono text-2xs uppercase tracking-[0.14em] text-ink-500">
            Nhãn mono cực nhỏ · text-2xs (11px)
          </p>
        </Card>
      </Section>

      {/* Ngân sách weight của ADR 008: 4 bậc sans, 2 bậc mono. Bậc nào không nạp thì trình
          duyệt bôi đậm giả và chữ nhoè — hàng dưới là để nhìn ra điều đó ngay. */}
      <Section title="Chữ — weight đã nạp (ADR 008)">
        <Card className="space-y-3">
          <p className="text-xs text-ink-500">
            Be Vietnam Pro · chỉ 400 / 500 / 600 / 700 được nạp. Không dùng{' '}
            <code>font-extrabold</code>.
          </p>
          {(
            [
              ['font-normal', '400 · regular'],
              ['font-medium', '500 · medium'],
              ['font-semibold', '600 · semibold'],
              ['font-bold', '700 · bold'],
            ] as const
          ).map(([cls, label]) => (
            <div key={cls} className="flex flex-wrap items-baseline gap-3">
              <span className="w-32 shrink-0 font-mono text-xs text-ink-500">{label}</span>
              <span className={`text-lg text-ink-900 ${cls}`}>
                Biến tài liệu thành bài học tương tác
              </span>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline gap-3 border-t border-surface-200 pt-3">
            <span className="w-32 shrink-0 font-mono text-xs text-ink-500">mono 400 / 700</span>
            <span className="font-mono text-sm text-ink-900">AIJob · SUCCEEDED · 1.200 token</span>
            <span className="font-mono text-sm font-bold text-ink-900">PARTIAL_FAILURES</span>
          </div>
        </Card>
      </Section>

      {/* UX-UI-PRINCIPLES §4.2: dấu mũ tiếng Việt dễ bị cắt ở cỡ nhỏ và line-height chặt.
          Hàng dưới gom các tổ hợp chồng dấu xấu nhất, ở đúng những cỡ chữ thật của app. */}
      <Section title="Chữ — dấu tiếng Việt">
        <Card className="space-y-3">
          <p className="text-xs text-ink-500">
            Soi dấu bị cắt hoặc chạm dòng trên. Kiểm cả ở <code>--width 390</code>.
          </p>
          {(
            [
              ['text-2xl font-bold leading-tight', '2xl bold · tiêu đề'],
              ['text-base', 'base · thân'],
              ['text-sm', 'sm · nội dung'],
              ['text-xs', 'xs · chú thích'],
            ] as const
          ).map(([cls, label]) => (
            <div key={label} className="flex flex-wrap items-baseline gap-3">
              <span className="w-32 shrink-0 font-mono text-xs text-ink-500">{label}</span>
              <span className={`text-ink-900 ${cls}`}>ể ễ ệ ộ ỗ ợ ữ ự ằ ẵ ặ ỳ ỹ Ỵ Đ đ</span>
            </div>
          ))}
          <p className="border-t border-surface-200 pt-3 text-sm leading-tight text-ink-900">
            Nguyễn Thị Mỹ Duyên đã hoàn thành “Kiểu tĩnh” — điểm 85,7 · chuỗi 12 ngày
          </p>
        </Card>
      </Section>

      <Section title="Nút">
        <Card className="space-y-4">
          {(['primary', 'secondary', 'ghost', 'danger'] as const).map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-20 shrink-0 font-mono text-xs text-ink-500">{variant}</span>
              <Button variant={variant} size="sm">
                Nhỏ
              </Button>
              <Button variant={variant} size="md">
                Vừa
              </Button>
              <Button variant={variant} size="lg">
                Lớn
              </Button>
              <Button variant={variant} disabled>
                Vô hiệu
              </Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-20 shrink-0 font-mono text-xs text-ink-500">có icon</span>
            <Button>
              <Icon name="plus" size={18} /> Tạo khóa học
            </Button>
            <Button variant="secondary">
              <Icon name="upload" size={18} /> Tải lên
            </Button>
            <Button variant="danger">
              <Icon name="trash" size={18} /> Xoá
            </Button>
          </div>
        </Card>

        {/* `outline` chỉ dùng trên nền tối (hero) — viền trắng mờ + focus-ring-dark
            vì sky-600 của focus-ring thường chìm trên navy. */}
        <Card className="mt-4 space-y-3 bg-navy-900">
          <p className="font-mono text-xs text-sky-400">outline — nền tối</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm">
              Nhỏ
            </Button>
            <Button variant="outline" size="md">
              Vừa
            </Button>
            <Button variant="outline" size="lg">
              Lớn
            </Button>
            <Button variant="outline" disabled>
              Vô hiệu
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Nhãn trạng thái">
        <Card className="flex flex-wrap gap-2">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
          <Badge tone="success" icon="check">
            Hoàn thành
          </Badge>
          <Badge tone="danger" icon="alert">
            Thất bại
          </Badge>
          <Badge tone="info" icon="clock">
            Đang chạy
          </Badge>
        </Card>
      </Section>

      <Section title="Icon">
        <Card>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {ICON_NAMES.map((name) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1 rounded-xl p-2 text-ink-700 hover:bg-surface-100"
              >
                <Icon name={name} size={22} />
                <span className="w-full truncate text-center font-mono text-2xs text-ink-500">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section title="Thẻ">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Thẻ có header</CardTitle>
              <Badge tone="info">mặc định</Badge>
            </CardHeader>
            <p className="text-sm text-ink-700">
              Viền 1px, bo góc <code className="font-mono text-xs">rounded-card</code>, bóng{' '}
              <code className="font-mono text-xs">shadow-card</code>.
            </p>
          </Card>
          <Card padded={false} className="overflow-hidden">
            <div className="bg-navy-900 px-5 py-4 text-sm font-bold text-white">
              padded=false — tự kiểm soát padding
            </div>
            <div className="p-5 text-sm text-ink-700">Dùng cho bảng và ảnh tràn viền.</div>
          </Card>
        </div>
      </Section>

      <Section title="Form">
        <Card className="max-w-md space-y-4">
          <Field label="Tiêu đề" htmlFor="sg-title" hint="Tối đa 120 ký tự.">
            <Input id="sg-title" placeholder="Nhập tiêu đề khóa học" />
          </Field>
          <Field label="Email" htmlFor="sg-mail" error="Email không hợp lệ.">
            <Input id="sg-mail" invalid defaultValue="sai@@email" />
          </Field>
          <Field label="Mật khẩu" htmlFor="sg-pass" hint="Có nút hiện/ẩn ở mép phải.">
            <PasswordInput id="sg-pass" defaultValue="matkhau-mau" autoComplete="off" />
          </Field>
          <Field label="Mô tả" htmlFor="sg-desc">
            <Textarea id="sg-desc" rows={3} placeholder="Mô tả ngắn" />
          </Field>
          <Field label="Mức độ" htmlFor="sg-level">
            <Select id="sg-level" defaultValue="basic">
              <option value="basic">Cơ bản</option>
              <option value="advanced">Nâng cao</option>
            </Select>
          </Field>
          <Field label="Bị khoá" htmlFor="sg-off">
            <Input id="sg-off" disabled defaultValue="Không sửa được" />
          </Field>
        </Card>
      </Section>

      <Section title="Tiến độ">
        <Card className="space-y-4">
          <ProgressBar value={progress} label="Ví dụ tiến độ" />
          <ProgressBar value={progress} label="Ví dụ tiến độ nhỏ" size="sm" tone="success" />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setProgress((p) => Math.max(0, p - 15))}
            >
              Giảm 15
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setProgress((p) => Math.min(100, p + 15))}
            >
              Tăng 15
            </Button>
            <span className="self-center font-mono text-xs text-ink-500">{progress}%</span>
          </div>
        </Card>
      </Section>

      <Section title="5 trạng thái màn hình">
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">Loading</p>
            <LoadingState rows={2} />
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">Loading — biến thể list / text</p>
            <div className="grid gap-4 md:grid-cols-2">
              <LoadingState rows={3} variant="list" />
              <LoadingState rows={3} variant="text" />
            </div>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">Empty</p>
            <EmptyState
              title="Chưa có khóa học nào"
              description="Tạo khóa học đầu tiên để bắt đầu."
              action={{ label: 'Tạo khóa học', onClick: () => {} }}
              secondaryAction={{ label: 'Xem khóa mẫu', onClick: () => {} }}
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">Error</p>
            <ErrorState
              description="Máy chủ không phản hồi. Kiểm tra kết nối rồi thử lại."
              detail="requestId: 01JB3K…"
              onRetry={() => {}}
            />
          </div>
          <div>
            {/* Không nằm trong "5 trạng thái" — đây là lỗi của một *mutation*, nên nội
                dung quanh nó vẫn còn. `ErrorState` mới là thứ thay chỗ khi *query* hỏng. */}
            <p className="mb-2 font-mono text-xs text-ink-500">InlineError (lỗi thao tác)</p>
            <InlineError>Không tải được tài liệu lên. Dung lượng tối đa là 20 MB.</InlineError>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">Partial</p>
            <PartialNotice>
              2/5 bài học chưa sinh xong — dữ liệu hiển thị chưa đầy đủ.
            </PartialNotice>
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">Skeleton</p>
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Bảng — khung chờ và trạng thái rỗng">
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">TableSkeleton</p>
            <TableSkeleton columns={4} rows={3} />
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">TableEmpty — do bộ lọc</p>
            <TableEmpty
              title={'Không có người dùng nào khớp "nguyen"'}
              description="Thử một phần của địa chỉ email, hoặc bỏ bộ lọc để xem toàn bộ."
              onClearFilter={() => {}}
            />
          </div>
          <div>
            <p className="mb-2 font-mono text-xs text-ink-500">TableEmpty — chưa có dữ liệu</p>
            <TableEmpty
              icon="sparkles"
              title="Chưa có job AI nào"
              description="Job sẽ xuất hiện ở đây khi có người bấm sinh bài học từ tài liệu."
            />
          </div>
        </div>
      </Section>

      <Section title="Bảng">
        <TableCard>
          <Table>
            <Thead>
              <Th>Khóa học</Th>
              <Th>Trạng thái</Th>
              <Th align="right">Bài học</Th>
            </Thead>
            <Tbody>
              {TABLE_ROWS.map((row) => (
                <tr key={row.title}>
                  <Td>{row.title}</Td>
                  <Td>
                    <Badge tone={row.tone}>{row.label}</Badge>
                  </Td>
                  <Td align="right">{row.lessons}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </TableCard>
      </Section>

      <Section title="Lộ trình bài học">
        <Card>
          <LessonPath lessons={DEMO_LESSONS} courseId="demo" onMove={() => {}} reordering={false} />
        </Card>
        <p className="mt-2 text-xs text-ink-500">
          Đoạn nối tô sky = bài phía trên đã xong. Rê chuột vào một node để thấy nút sắp xếp lại.
        </p>
      </Section>

      <Section title="Chuyển động">
        <div className="space-y-4">
          <Reveal>
            <Card>
              <p className="text-sm text-ink-700">
                <code className="font-mono text-xs">Reveal</code> — mờ dần + nhích lên khi gắn vào
                cây.
              </p>
            </Card>
          </Reveal>
          <StaggerList className="grid gap-3 sm:grid-cols-3">
            {['Một', 'Hai', 'Ba'].map((t) => (
              <StaggerItem key={t}>
                <Card>
                  <p className="text-sm font-bold text-ink-900">{t}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerList>
          <RevealOnScroll>
            <Card>
              <p className="text-sm text-ink-700">
                <code className="font-mono text-xs">RevealOnScroll</code> — như trên, nhưng đợi tới
                lúc khối lọt vào khung nhìn. Nằm cuối trang nên muốn thấy phải cuộn tới.
              </p>
            </Card>
          </RevealOnScroll>
          <StaggerOnScroll className="grid gap-3 sm:grid-cols-3">
            {['Bốn', 'Năm', 'Sáu'].map((t) => (
              <Card key={t}>
                <p className="text-sm font-bold text-ink-900">{t}</p>
              </Card>
            ))}
          </StaggerOnScroll>
          <p className="text-xs text-ink-500">
            Hai cái trên kích hoạt <strong>lúc mount</strong> — đúng cho màn app ngắn. Hai cái dưới
            đợi <strong>cuộn tới</strong> — dành cho trang chủ, nơi phần lớn nội dung nằm dưới nếp
            gấp và sẽ chạy xong trước khi ai kịp nhìn.
          </p>
          <p className="text-xs text-ink-500">
            Bật &ldquo;giảm chuyển động&rdquo; trong hệ điều hành rồi tải lại — mọi hiệu ứng trên
            đây chỉ còn mờ dần, không còn dịch chuyển.
          </p>
        </div>
      </Section>
    </div>
  );
}
