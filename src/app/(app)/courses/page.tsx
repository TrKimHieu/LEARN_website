'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CourseSummary } from '@learn/api-contracts';
import { useCourses } from '@/features/courses/courses-api';
import { CourseCover } from '@/components/shared/course-cover';
import {
  Badge,
  ButtonLink,
  EmptyState,
  ErrorState,
  Icon,
  PageHeader,
  ProgressBar,
  Skeleton,
} from '@/components/ui';
import { StaggerItem, StaggerList } from '@/lib/motion';
import { errorDetail, errorText } from '@/lib/api-client';

export default function CoursesPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCourses();
  const count = data?.courses.length ?? 0;

  return (
    <>
      <PageHeader
        title="Khóa học"
        description={
          count > 0
            ? `${count} khóa học. Mỗi khóa gom tài liệu nguồn và lộ trình bài học sinh từ đó.`
            : 'Mỗi khóa gom tài liệu nguồn và lộ trình bài học sinh từ đó.'
        }
        action={
          <ButtonLink href="/courses/new">
            <Icon name="plus" size={16} />
            Tạo khóa học
          </ButtonLink>
        }
      />

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
          stagger={Math.min(0.05, 0.4 / data.courses.length)}
          className="grid gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3"
        >
          {data.courses.map((course) => (
            <StaggerItem as="li" key={course.id}>
              <CourseCard course={course} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </>
  );
}

/**
 * Thẻ khóa học — ADR 012: không viền + bóng quanh cả thẻ. Bìa là vật thể, chữ nằm ngay
 * dưới trên nền trang (như bìa sách + tên sách), nên lưới đọc thành một kệ chứ không phải
 * một bảng ô vuông. Trạng thái "Nháp" chỉ hiện khi khác thường — "Sẵn sàng" là mặc định,
 * gắn nhãn cho nó ở mọi thẻ chỉ là nhiễu.
 */
function CourseCard({ course }: { course: CourseSummary }) {
  const { completed, total } = course.progress;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Link href={`/courses/${course.id}`} className="group block rounded-card focus-ring">
      <div className="relative overflow-hidden rounded-card border border-line">
        <CourseCover
          id={course.id}
          title={course.title}
          className="aspect-[16/9] transition-transform duration-300 ease-out-quint group-hover:scale-[1.02]"
        />
        {course.status === 'DRAFT' && (
          <Badge className="absolute left-3 top-3 bg-panel">Nháp</Badge>
        )}
        {course.status === 'ARCHIVED' && (
          <Badge className="absolute left-3 top-3 bg-panel">Đã lưu trữ</Badge>
        )}
        {total > 0 && (
          <ProgressBar
            size="xs"
            value={completed}
            max={total}
            tone={percent === 100 ? 'success' : 'sky'}
            label={`${course.title}: ${completed} trên ${total} bài`}
            className="absolute inset-x-0 bottom-0 rounded-none bg-black/10 dark:bg-white/10"
          />
        )}
      </div>

      <div className="mt-3 px-0.5">
        <h2 className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug text-fg group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
          {course.title}
        </h2>
        {course.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-fg-subtle">
            {course.description}
          </p>
        )}
        <p className="mt-2 text-[0.8125rem] text-fg-subtle">
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
      </div>
    </Link>
  );
}
