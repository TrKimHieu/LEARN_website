'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCourses } from '@/lib/courses-api';
import {
  Badge,
  ButtonLink,
  Card,
  CardTitle,
  Icon,
  PageHeader,
  ProgressBar,
  Skeleton,
  type BadgeTone,
} from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { errorDetail, errorText } from '@/lib/api-client';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Nháp',
  READY: 'Sẵn sàng',
  ARCHIVED: 'Đã lưu trữ',
};

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: 'neutral',
  READY: 'success',
  ARCHIVED: 'neutral',
};

export default function CoursesPage() {
  const router = useRouter();
  const { data, isLoading, isError, error, refetch, isRefetching } = useCourses();

  return (
    <section>
      <PageHeader
        title="Khóa học"
        action={
          <ButtonLink href="/courses/new">
            <Icon name="plus" size={18} strokeWidth={3} />
            Tạo khóa học
          </ButtonLink>
        }
      />

      {isLoading && (
        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <Skeleton className="h-40" />
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
        <ul className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {data.courses.map((course) => {
            const { completed, total } = course.progress;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <li key={course.id}>
                <Link
                  href={`/courses/${course.id}`}
                  className="block h-full rounded-card focus-ring"
                >
                  <Card className="flex h-full flex-col transition-shadow hover:shadow-raised">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                      <Badge tone={STATUS_TONE[course.status] ?? 'neutral'} className="shrink-0">
                        {STATUS_LABEL[course.status] ?? course.status}
                      </Badge>
                    </div>

                    {course.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">
                        {course.description}
                      </p>
                    )}

                    <div className="mt-auto pt-4">
                      {total > 0 ? (
                        <div className="flex items-center gap-2">
                          <ProgressBar
                            size="sm"
                            value={completed}
                            max={total}
                            label={`${course.title}: ${completed} trên ${total} bài`}
                          />
                          <span className="shrink-0 text-xs font-bold tabular-nums text-ink-700">
                            {percent}%
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-ink-500">Chưa có bài học</p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="check" size={13} strokeWidth={3} />
                          {completed}/{total} bài
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="book" size={13} />
                          {course.documentCount} tài liệu
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
