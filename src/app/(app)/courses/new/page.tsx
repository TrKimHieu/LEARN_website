'use client';

import type { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCourseSchema, type CreateCourseInput } from '@learn/api-contracts';
import { useCreateCourse } from '@/features/courses/courses-api';
import { QuotaNotice } from '@/components/shared/quota-notice';
import {
  Button,
  Card,
  Field,
  Icon,
  InlineError,
  Input,
  PageHeader,
  Select,
  Textarea,
  cn,
  type IconName,
} from '@/components/ui';
import { errorText, isQuotaExceededError } from '@/lib/api-client';

type FormValues = z.input<typeof createCourseSchema>;

/** Ba bước thật của luồng — người dùng biết form này chỉ là bước 1. */
const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'edit', title: 'Đặt tên khóa học', body: 'Bạn đang ở bước này.' },
  { icon: 'cloud', title: 'Tải tài liệu lên', body: 'PDF hoặc tệp văn bản, ở trang khóa học.' },
  { icon: 'sparkles', title: 'Sinh bài học bằng AI', body: 'Chạy nền, xem tiến độ trực tiếp.' },
];

export default function NewCoursePage() {
  const router = useRouter();
  const createCourse = useCreateCourse();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { title: '', description: '', language: 'vi' },
  });

  async function onSubmit(input: CreateCourseInput) {
    const course = await createCourse.mutateAsync(input);
    router.replace(`/courses/${course.id}`);
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        backLink={{ href: '/courses', label: 'Khóa học' }}
        title="Tạo khóa học"
        description="Đặt tên cho khóa học, sau đó tải tài liệu lên để AI sinh bài học."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <Field label="Tên khóa học" htmlFor="title" error={errors.title?.message}>
              <Input
                id="title"
                type="text"
                placeholder="Ví dụ: Nhập môn giao thức HTTP"
                // Trang chỉ có một việc là điền form và ô đầu nằm ngay dưới tiêu đề.
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                {...register('title')}
              />
            </Field>

            <Field
              label="Mô tả"
              htmlFor="description"
              hint="Không bắt buộc. Giúp bạn nhận ra khóa học trong danh sách."
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                rows={4}
                invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : 'description-hint'}
                {...register('description')}
              />
            </Field>

            <Field
              label="Ngôn ngữ"
              htmlFor="language"
              hint="Ngôn ngữ bài học được sinh ra."
              error={errors.language?.message}
            >
              <Select
                id="language"
                invalid={Boolean(errors.language)}
                aria-describedby={errors.language ? 'language-error' : 'language-hint'}
                {...register('language')}
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">Tiếng Anh</option>
              </Select>
            </Field>

            {createCourse.isError && isQuotaExceededError(createCourse.error) && (
              <QuotaNotice
                metric={createCourse.error.meta.metric}
                limit={createCourse.error.meta.limit}
                used={createCourse.error.meta.used}
              />
            )}
            {createCourse.isError && !isQuotaExceededError(createCourse.error) && (
              <InlineError>
                {errorText(createCourse.error, 'Không tạo được khóa học, vui lòng thử lại.')}
              </InlineError>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Huỷ
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isSubmitting ? 'Đang tạo…' : 'Tạo khóa học'}
                {!isSubmitting && <Icon name="arrow-right" size={17} />}
              </Button>
            </div>
          </form>
        </Card>

        <aside aria-label="Các bước tạo khóa học">
          <ol className="space-y-6 lg:pt-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <Icon
                  name={s.icon}
                  size={20}
                  className={cn('mt-0.5 shrink-0', i === 0 ? 'text-accent' : 'text-fg-subtle')}
                />
                <div>
                  <p className="text-xs text-fg-subtle">Bước {i + 1}</p>
                  <p className="text-sm font-semibold text-fg">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-subtle">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
