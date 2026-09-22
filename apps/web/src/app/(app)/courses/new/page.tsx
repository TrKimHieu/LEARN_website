'use client';

import type { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCourseSchema, type CreateCourseInput } from '@learn/contracts';
import { useCreateCourse } from '@/features/courses/courses-api';
import { QuotaNotice } from '@/components/shared/quota-notice';
import {
  Button,
  Card,
  Field,
  InlineError,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { errorText, isQuotaExceededError } from '@/lib/api-client';

type FormValues = z.input<typeof createCourseSchema>;

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
    <section className="mx-auto max-w-lg">
      <PageHeader
        title="Tạo khóa học"
        description="Đặt tên cho khóa học, sau đó tải tài liệu lên để AI sinh bài học."
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Field label="Tên khóa học" htmlFor="title" error={errors.title?.message}>
            <Input
              id="title"
              type="text"
              // Trang này chỉ có một việc duy nhất là điền form, và ô đầu tiên
              // nằm ngay dưới tiêu đề — con trỏ nhảy vào đây không làm người
              // dùng trình đọc màn hình mất dấu vị trí như khi autofocus nằm
              // giữa một trang nhiều nội dung.
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
            hint="Không bắt buộc."
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              rows={3}
              invalid={Boolean(errors.description)}
              aria-describedby={errors.description ? 'description-error' : 'description-hint'}
              {...register('description')}
            />
          </Field>

          <Field label="Ngôn ngữ" htmlFor="language" error={errors.language?.message}>
            <Select id="language" invalid={Boolean(errors.language)} {...register('language')}>
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

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo…' : 'Tạo khóa học'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Huỷ
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
