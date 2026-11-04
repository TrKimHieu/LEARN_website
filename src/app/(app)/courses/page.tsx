'use client';

import { UserText } from '@/components/ui/user-text';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseSummary } from '@learn/api-contracts';
import { useCourses } from '@/features/courses/courses-api';
import {
  Badge,
  ButtonLink,
  EmptyState,
  ErrorState,
  Icon,
  ProgressBar,
  Skeleton,
} from '@/components/ui';
import { StaggerItem, StaggerList } from '@/lib/motion';
import { errorDetail, errorText } from '@/lib/api-client';
import { usePageTitle } from '@/lib/use-page-title';
import { ColorBlock, type BlockTone } from '@/components/shared/color-block';

export default function CoursesPage() {
  usePageTitle('Khóa học');
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCourses();
  const count = data?.courses.length ?? 0;
  const documentTotal = data?.courses.reduce((sum, c) => sum + c.documentCount, 0) ?? 0;

  return (
    <>
      <ColorBlock tone="brand" softOnDesktop className="mb-8 flex items-center gap-4 p-6">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[2rem] font-bold leading-tight">Khóa học của tôi</h1>
          {/* Website: một dòng số liệu. Điện thoại: các viên số liệu trong khối màu. */}
          <p className="mt-1 hidden text-sm text-fg-subtle md:block">
            {count} khóa học · {documentTotal} tài liệu
          </p>
          <div className="mt-5 flex flex-wrap gap-2 md:hidden">
            <span className="inline-flex h-11 items-center rounded-pill bg-block-ink px-5 text-sm font-semibold text-white">
              <span className="tabular-nums">{count}</span>&nbsp;khóa học
            </span>
            <span className="inline-flex h-11 items-center rounded-pill bg-white px-5 text-sm font-semibold text-ink-on-color">
              <span className="tabular-nums">{documentTotal}</span>&nbsp;tài liệu
            </span>
            <ButtonLink href="/courses/new" variant="secondary">
              <Icon name="plus" size={16} />
              Tạo khóa học
            </ButtonLink>
          </div>
        </div>
        <ButtonLink href="/courses/new" className="hidden shrink-0 md:inline-flex">
          <Icon name="plus" size={16} />
          Tạo khóa học
        </ButtonLink>
      </ColorBlock>

      {isLoading && (
        <ul
          className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Đang tải khóa học"
        >
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-64 rounded-card" />
            </li>
          ))}
        </ul>
      )}

      {isError && (
        <ErrorState
          title="Không tải được danh sách khóa học"
          description={errorText(error, 'Vui lòng thử lại.')}
          detail={errorDetail(error)}
          onRetry={() => {
            if (!isRefetching) void refetch();
          }}
        />
      )}

      {data && data.courses.length === 0 && (
        <EmptyState
          title="Chưa có khóa học nào"
          description="Tạo khóa học đầu tiên và tải tài liệu lên để AI sinh bài học cho bạn."
          action={{ label: 'Tạo khóa học đầu tiên', onClick: () => router.push('/courses/new') }}
        />
      )}

      {data && data.courses.length > 0 && (
        <StaggerList
          as="ul"
          stagger={Math.min(0.03, 0.25 / data.courses.length)}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {data.courses.map((course, index) => (
            <StaggerItem as="li" key={course.id}>
              <CourseCard course={course} index={index} />
            </StaggerItem>
          ))}
          <StaggerItem as="li" className={fillerSpan(data.courses.length)}>
            <Link
              href="/courses/new"
              className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line-strong p-5 text-center transition-colors duration-150 hover:border-brand focus-ring"
            >
              <Icon name="plus" size={20} className="text-fg-muted" />
              <span className="text-sm font-semibold text-fg">Tạo khóa học</span>
            </Link>
          </StaggerItem>
        </StaggerList>
      )}
    </>
  );
}

/**
 * Ô "Tạo khóa học" chiếm hết chỗ còn lại của hàng cuối, để lưới website không có ô trống.
 * Điện thoại đã có nút tạo trong khối màu nên ẩn ô này. Lưới: 2 cột từ `md`, 3 cột từ `xl`.
 */
function fillerSpan(count: number) {
  const md = count % 2 === 0 ? 'md:col-span-2' : 'md:col-span-1';
  const xl = ['xl:col-span-3', 'xl:col-span-2', 'xl:col-span-1'][count % 3];
  return `hidden md:block ${md} ${xl}`;
}

const CARD_TONES: BlockTone[] = ['brand', 'amber'];

const CARD_ICON: Record<BlockTone, string> = {
  brand: 'bg-brand text-on-brand',
  amber: 'bg-amber text-ink-on-color',
};

function CourseCard({ course, index }: { course: CourseSummary; index: number }) {
  const { completed, total } = course.progress;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const tone = CARD_TONES[index % CARD_TONES.length]!;
  const soft = tone === 'amber' ? 'text-ink-on-color/80' : 'text-white';

  return (
    <ColorBlock
      tone={tone}
      softOnDesktop
      className="group flex h-full min-h-52 flex-col rounded-card p-6 transition-colors duration-150 md:min-h-44 md:p-5 md:hover:shadow-raised"
    >
      {course.status === 'ARCHIVED' && (
        <Badge className="mb-2 self-start bg-panel">Đã lưu trữ</Badge>
      )}
      <span
        aria-hidden="true"
        className={`mb-3 hidden size-10 place-items-center rounded-control md:grid ${CARD_ICON[tone]}`}
      >
        <Icon name="book-check" size={20} />
      </span>
      <h2 className="line-clamp-2 font-display text-xl font-bold leading-snug md:text-[1.0625rem]">
        {/* Cả thẻ bấm được nhờ `after`; đường dẫn dùng chung cho hai khổ. */}
        <Link
          href={`/courses/${course.id}`}
          className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:after:outline-2 focus-visible:after:outline-offset-2 md:group-hover:underline"
        >
          <UserText>{course.title}</UserText>
        </Link>
      </h2>
      {course.description && (
        <p className={`mt-1 line-clamp-2 text-sm leading-relaxed md:text-fg-subtle ${soft}`}>
          <UserText>{course.description}</UserText>
        </p>
      )}
      <div className="mt-auto flex items-end justify-between gap-3 pt-6 md:pt-4">
        <p className={`text-[0.8125rem] font-medium md:text-fg-subtle ${soft}`}>
          {total > 0 ? (
            <>
              <span className="tabular-nums">
                {completed}/{total}
              </span>{' '}
              bài{percent === 100 ? ', đã xong' : ''}
            </>
          ) : (
            'Chưa có bài học'
          )}
          {' · '}
          {course.documentCount} tài liệu
        </p>
        <span
          aria-hidden="true"
          className={`grid size-12 shrink-0 place-items-center rounded-full md:hidden ${
            tone === 'amber' ? 'bg-block-ink text-white' : 'bg-white text-ink-on-color'
          }`}
        >
          <Icon name="arrow-right" size={20} />
        </span>
      </div>
      {total > 0 && (
        <ProgressBar
          size="xs"
          value={completed}
          max={total}
          tone={percent === 100 ? 'success' : 'sky'}
          label={`${course.title}: ${completed} trên ${total} bài`}
          className="mt-3 hidden md:block"
        />
      )}
    </ColorBlock>
  );
}
