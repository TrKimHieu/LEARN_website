'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import type { AiCostMetrics, LessonSummary } from '@learn/contracts';
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  EmptyState,
  ErrorState,
  Field,
  ICON_NAMES,
  Icon,
  IconButton,
  InlineError,
  Input,
  LoadingState,
  PageHeader,
  PartialNotice,
  PasswordInput,
  ProgressBar,
  ProgressRing,
  SectionTitle,
  Select,
  StatCard,
  Table,
  TableCard,
  TableEmpty,
  TableSkeleton,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  type BadgeTone,
} from '@/components/ui';
import { CourseCover } from '@/components/shared/course-cover';
import { QuotaNotice } from '@/components/shared/quota-notice';
import { LessonList } from '@/features/learning/lesson-list';
import { CostChart } from '@/features/admin/cost-chart';
import { LogoMark } from '@/features/shell/logo-mark';
import { Brand } from '@/features/shell/brand';
import { ThemeSegmented } from '@/components/shared/theme-toggle';
import { StaggerItem, StaggerList } from '@/lib/motion';

/**
 * Bảng mẫu giao diện — **chỉ chạy ở môi trường dev** (`/dev/ui`).
 *
 * Mặt cắt duy nhất thấy mọi primitive cùng lúc, không cần Docker/Postgres/API. Đổi tông
 * sáng/tối ngay ở đầu trang để soát cả hai. Thêm primitive mới vào `components/ui/` thì
 * thêm vào đây luôn — xem docs/UI-GUIDE.md.
 */

const SPEC_TOKENS = [
  ['white', '#ffffff'],
  ['mono-50', '#fafafa'],
  ['mono-100', '#f2f2f2'],
  ['mono-200', '#e5e5e5'],
  ['mono-300', '#d4d4d4'],
  ['mono-400', '#a3a3a3'],
  ['mono-500', '#808080'],
  ['mono-600', '#666666'],
  ['mono-700', '#404040'],
  ['mono-800', '#262626'],
  ['mono-900', '#161616'],
  ['mono-950', '#0e0e0e'],
  ['black', '#000000'],
] as const;

/** Token ngữ nghĩa — ô màu đọc giá trị sống qua `var()`, nên đổi theo tông đang chọn. */
const SEMANTIC_TOKENS = [
  'app',
  'panel',
  'panel-2',
  'muted',
  'line',
  'line-strong',
  'track',
  'fg',
  'fg-muted',
  'fg-subtle',
  'accent',
  'accent-soft',
  'ok',
  'ok-soft',
  'bad',
  'bad-soft',
  'warn',
  'warn-soft',
  'chart-1',
  'primary',
  'line-input',
] as const;

const BADGE_TONES: BadgeTone[] = ['neutral', 'info', 'success', 'warning', 'danger'];

const SAMPLE_LESSONS: LessonSummary[] = [
  'Giao thức HTTP là gì',
  'Cấu trúc một request',
  'Phương thức GET và POST',
  'Mã trạng thái 2xx và 5xx',
  'Header và cookie',
  'Bộ nhớ đệm (cache)',
].map((title, i) => ({
  id: `l${i}`,
  title,
  summary: null,
  orderIndex: i,
  estimatedMinutes: 8,
  progressStatus: i < 2 ? 'COMPLETED' : i === 2 ? 'IN_PROGRESS' : 'NOT_STARTED',
  bestScore: i < 2 ? 90 - i * 10 : null,
})) as unknown as LessonSummary[];

const SAMPLE_COSTS: AiCostMetrics = [
  ['2026-09-21', 0.0012, 1],
  ['2026-09-22', 0.0041, 3],
  ['2026-09-23', 0.0, 0],
  ['2026-09-24', 0.0028, 2],
  ['2026-09-25', 0.0069, 5],
  ['2026-09-26', 0.0035, 2],
  ['2026-09-27', 0.0014, 1],
].map(([date, totalCostUsd, jobCount]) => ({
  date,
  totalCostUsd,
  jobCount,
})) as unknown as AiCostMetrics;

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 border-t border-line pt-10"
    >
      <h2 id={`${id}-title`} className="mb-5 text-xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <DevUi />;
}

function DevUi() {
  const [password, setPassword] = useState('mat-khau-rat-dai');

  return (
    <div className="min-h-dvh bg-app">
      <header className="sticky top-0 z-20 border-b border-line bg-app/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Brand />
          <ThemeSegmented className="w-72" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-24 pt-10 sm:px-8">
        <PageHeader
          eyebrow="/dev/ui"
          title="Bảng mẫu giao diện"
          description="Mọi primitive và trạng thái của LEARN trên một trang. Đổi tông ở góc phải để soát chế độ tối."
        />

        <Section id="tokens" title="Màu">
          <h3 className="mb-3 text-sm font-semibold text-fg">
            Khối [SPEC] §14.2: đơn sắc trắng → đen (ADR 015)
          </h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {SPEC_TOKENS.map(([name, hex]) => (
              <li
                key={name}
                className="overflow-hidden rounded-control border border-line bg-panel"
              >
                <div className="h-12" style={{ background: hex }} />
                <p className="px-2.5 pt-2 text-xs font-semibold text-fg">{name}</p>
                <p className="px-2.5 pb-2 font-mono text-2xs text-fg-subtle">{hex}</p>
              </li>
            ))}
          </ul>
          <h3 className="mb-3 mt-8 text-sm font-semibold text-fg">
            Token ngữ nghĩa, đổi theo tông (ADR 011)
          </h3>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {SEMANTIC_TOKENS.map((name) => (
              <li
                key={name}
                className="overflow-hidden rounded-control border border-line bg-panel"
              >
                <div
                  className="h-12 border-b border-line"
                  style={{ background: `var(--${name})` }}
                />
                <p className="px-2.5 py-2 font-mono text-2xs font-semibold text-fg">{name}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="type" title="Chữ">
          <Card className="space-y-3">
            <p className="text-sm text-fg-subtle">Nhãn phụ 14px, không viết hoa</p>
            <p className="text-[2.75rem] font-semibold leading-tight tracking-[-0.025em] text-fg">
              Tiêu đề trang, Hanken Grotesk 600
            </p>
            <p className="text-base font-semibold text-fg">Tiêu đề mục, 600</p>
            <p className="lesson-content max-w-prose">
              Bài đọc 17px, dòng 1.75: Biến tài liệu của bạn thành bài học tương tác, ở cả chữ
              thường lẫn CHỮ HOA ĐẦY ĐỦ DẤU. Mã HTTP 2xx và 5xx, ảnh 1920x1080 hiện đúng như gõ.
            </p>
            <p className="max-w-prose text-base leading-relaxed text-fg-muted">
              Chữ giao diện 16px: nút, nhãn, bảng, form.
            </p>
            <p className="text-sm text-fg-subtle">Chữ phụ 14px: mô tả, siêu dữ liệu.</p>
            <code className="inline-block rounded-md border border-line bg-muted px-2 py-1 font-mono text-sm text-fg">
              GET /api/v1/courses (JetBrains Mono)
            </code>
          </Card>
        </Section>

        <Section id="brand" title="Logo">
          <div className="flex flex-wrap items-center gap-6">
            {[16, 24, 32, 48, 64].map((s) => (
              <LogoMark key={s} size={s} />
            ))}
            <div data-theme="dark" className="flex items-center gap-6 rounded-card bg-fg p-4">
              {[16, 24, 32, 48, 64].map((s) => (
                <LogoMark key={s} size={s} tone="dark" />
              ))}
            </div>
          </div>
        </Section>

        <Section id="buttons" title="Nút">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="soft">
              <Icon name="sparkles" size={16} />
              Soft
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button loading>Đang lưu…</Button>
            <Button disabled>Disabled</Button>
            <IconButton icon="settings" label="Cài đặt" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button size="sm">Nhỏ</Button>
            <Button size="md">Vừa</Button>
            <Button size="lg">Lớn</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button variant="link">Liên kết dạng nút</Button>
            <Button variant="soft">Soft</Button>
          </div>
        </Section>

        <Section id="badges" title="Nhãn">
          <div className="flex flex-wrap gap-2">
            {BADGE_TONES.map((t) => (
              <Badge key={t} tone={t}>
                {t}
              </Badge>
            ))}
            <Badge tone="success" icon="check">
              Đã trích xuất
            </Badge>
            <Badge tone="danger" icon="alert">
              Lỗi
            </Badge>
            <Badge tone="info" icon="spinner">
              Đang trích xuất
            </Badge>
          </div>
        </Section>

        <Section id="forms" title="Form">
          <Card className="grid gap-5 md:grid-cols-2">
            <Field label="Tên khóa học" htmlFor="dev-title" hint="Gợi ý hiện dưới ô.">
              <Input
                id="dev-title"
                placeholder="Ví dụ: Nhập môn HTTP"
                aria-describedby="dev-title-hint"
              />
            </Field>
            <Field label="Ô lỗi" htmlFor="dev-bad" error="Tên cần ít nhất 3 ký tự.">
              <Input id="dev-bad" invalid defaultValue="ab" aria-describedby="dev-bad-error" />
            </Field>
            <Field label="Mật khẩu" htmlFor="dev-pass">
              <PasswordInput
                id="dev-pass"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Ngôn ngữ" htmlFor="dev-lang">
              <Select id="dev-lang" defaultValue="vi">
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
              </Select>
            </Field>
            <Field label="Tìm kiếm" htmlFor="dev-search">
              <Input id="dev-search" type="search" icon="search" placeholder="Tìm theo email…" />
            </Field>
            <Field label="Mô tả" htmlFor="dev-desc">
              <Textarea id="dev-desc" rows={3} />
            </Field>
            <Field label="Vô hiệu" htmlFor="dev-disabled">
              <Input id="dev-disabled" disabled defaultValue="Không sửa được" />
            </Field>
          </Card>
        </Section>

        <Section id="cards" title="Thẻ, số liệu, tiến độ">
          <StaggerList className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StaggerItem>
              <StatCard icon="layers" label="Khóa học" value="4" />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon="book-check"
                tone="success"
                label="Bài đã xong"
                value="12/30"
                sub="40% tổng số bài"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard icon="star" label="Điểm trung bình" value="86.5" />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                icon="flame"
                tone="warning"
                label="Chuỗi ngày học"
                value="3"
                sub="ngày liên tiếp"
              />
            </StaggerItem>
          </StaggerList>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Card interactive>
              <CardTitle>Thẻ tương tác</CardTitle>
              <CardDescription className="mt-1">Rê chuột: viền accent + bóng nâng.</CardDescription>
              <ProgressBar className="mt-5" value={7} max={10} label="Ví dụ 7 trên 10" />
              <ProgressBar
                className="mt-3"
                size="sm"
                tone="success"
                value={10}
                max={10}
                label="Ví dụ xong"
              />
            </Card>
            <Card className="flex items-center justify-around">
              <ProgressRing value={3} max={8} label="3 trên 8" />
              <ProgressRing value={8} max={8} tone="success" label="8 trên 8" />
              <ProgressRing value={45} size={96} stroke={9} label="45 phần trăm" />
            </Card>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {['c1a', 'b27', 'x9', 'khoa-hoc-4'].map((id, i) => (
              <CourseCover
                key={id}
                id={id}
                title={['HTTP', 'Giải tích', 'React', 'Kinh tế vi mô'][i]!}
                className="h-28 rounded-card"
              />
            ))}
          </div>
        </Section>

        <Section id="states" title="Năm trạng thái">
          <div className="grid gap-4 lg:grid-cols-2">
            <LoadingState rows={2} variant="card" />
            <EmptyState
              title="Chưa có khóa học nào"
              description="Tạo khóa học đầu tiên và tải tài liệu lên."
              action={{ label: 'Tạo khóa học', onClick: () => undefined }}
            />
            <ErrorState
              title="Không tải được dữ liệu"
              description="Máy chủ không phản hồi."
              detail="req_01J8ZK3"
              onRetry={() => undefined}
            />
            <div className="space-y-3">
              <EmptyState
                size="compact"
                title="Chưa có lần làm bài nào"
                description="Mục con của một màn."
              />
              <InlineError>Không lưu được, vui lòng thử lại.</InlineError>
              <PartialNotice>
                <b>Chế độ demo:</b> nâng cấp gói không phát sinh giao dịch thật.
              </PartialNotice>
              <QuotaNotice metric="AI_JOBS_RUN" limit={5} used={5} />
            </div>
          </div>
        </Section>

        <Section id="table" title="Bảng quản trị">
          <TableCard>
            <Table>
              <Thead>
                <Th>Email</Th>
                <Th>Vai trò</Th>
                <Th align="right">Số khóa học</Th>
              </Thead>
              <Tbody>
                <tr>
                  <Td className="font-medium text-fg">demo@learn.ai</Td>
                  <Td>
                    <Badge>Người học</Badge>
                  </Td>
                  <Td align="right">3</Td>
                </tr>
                <tr>
                  <Td className="font-medium text-fg">admin@learn.ai</Td>
                  <Td>
                    <Badge tone="info" icon="shield">
                      Quản trị viên
                    </Badge>
                  </Td>
                  <Td align="right">0</Td>
                </tr>
              </Tbody>
            </Table>
          </TableCard>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TableSkeleton columns={4} rows={3} />
            <TableEmpty
              title='Không có người dùng nào khớp "xyz"'
              description="Bỏ bộ lọc để xem toàn bộ."
              onClearFilter={() => undefined}
            />
          </div>
        </Section>

        <Section id="chart" title="Biểu đồ chi phí (dữ liệu mẫu)">
          <Card>
            <CostChart data={SAMPLE_COSTS} />
          </Card>
        </Section>

        <Section id="path" title="Danh sách bài học (dữ liệu mẫu)">
          <SectionTitle description="Nét liền = đã đi qua, nét đứt = chưa. Mũi tên đổi thứ tự luôn hiện (UI-GUIDE §4d).">
            Lộ trình
          </SectionTitle>
          <Card
            padded={false}
            className="bg-[radial-gradient(var(--line)_1px,transparent_1px)] [background-size:22px_22px] py-4"
          >
            <LessonList
              lessons={SAMPLE_LESSONS}
              courseId="demo"
              onMove={() => undefined}
              reordering={false}
            />
          </Card>
        </Section>

        <Section id="icons" title="Icon">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-10">
            {ICON_NAMES.map((name) => (
              <li
                key={name}
                className="flex flex-col items-center gap-1.5 rounded-control border border-line bg-panel px-1 py-3 text-fg-muted"
              >
                <Icon name={name} size={20} />
                <span className="w-full truncate text-center font-mono text-2xs text-fg-subtle">
                  {name}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </main>
    </div>
  );
}
