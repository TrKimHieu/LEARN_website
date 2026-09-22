'use client';

import { useAdminCourses } from '@/features/admin/admin-api';
import { StatusChip } from '@/features/admin/status-chip';
import {
  Input,
  PageHeader,
  Table,
  TableCard,
  Tbody,
  Td,
  Th,
  TableEmpty,
  TableSkeleton,
  Thead,
} from '@/components/ui';
import { ErrorState } from '@/components/ui/states';
import { Reveal } from '@/lib/motion';
import { errorDetail, errorText } from '@/lib/api-client';
import { useDebouncedQueryParam } from '@/lib/url-state';

export default function AdminCoursesPage() {
  const [q, setQ, committedQ] = useDebouncedQueryParam('q');
  const courses = useAdminCourses(committedQ || undefined);

  return (
    <section>
      <PageHeader
        title="Khóa học"
        action={
          <>
            <label htmlFor="course-search" className="sr-only">
              Tìm khóa học theo tên
            </label>
            <Input
              id="course-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên khóa học…"
              className="w-64"
            />
          </>
        }
      />

      {courses.isLoading && <TableSkeleton columns={6} />}

      {courses.isError && (
        <ErrorState
          title="Không tải được danh sách khóa học"
          description={errorText(courses.error, 'Vui lòng thử lại.')}
          detail={errorDetail(courses.error)}
          onRetry={() => void courses.refetch()}
        />
      )}

      {courses.data &&
        courses.data.courses.length === 0 &&
        (committedQ ? (
          <TableEmpty
            title={`Không có khóa học nào khớp "${committedQ}"`}
            description="Thử một phần của tên khóa học, hoặc bỏ bộ lọc để xem toàn bộ."
            onClearFilter={() => setQ('')}
          />
        ) : (
          <TableEmpty
            icon="book"
            title="Chưa có khóa học nào"
            description="Khóa học do người dùng tạo sẽ xuất hiện ở đây."
          />
        ))}

      {courses.data && courses.data.courses.length > 0 && (
        <Reveal>
          <TableCard>
            <Table>
              <Thead>
                <Th>Tên khóa học</Th>
                <Th>Chủ sở hữu</Th>
                <Th>Trạng thái</Th>
                <Th align="right">Tài liệu</Th>
                <Th align="right">Bài học</Th>
                <Th>Cập nhật</Th>
              </Thead>
              <Tbody>
                {courses.data.courses.map((c) => (
                  <tr key={c.id}>
                    <Td className="font-medium text-ink-900">{c.title}</Td>
                    <Td>{c.ownerEmail}</Td>
                    <Td>
                      <StatusChip status={c.status} />
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {c.documentCount}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {c.lessonCount}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-500">
                      {new Date(c.updatedAt).toLocaleDateString('vi-VN')}
                    </Td>
                  </tr>
                ))}
              </Tbody>
            </Table>
          </TableCard>
        </Reveal>
      )}
    </section>
  );
}
