'use client';

import { useAdminUsers } from '@/lib/admin-api';
import {
  Badge,
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

export default function AdminUsersPage() {
  const [q, setQ, committedQ] = useDebouncedQueryParam('q');
  const users = useAdminUsers(committedQ || undefined);

  return (
    <section>
      <PageHeader
        title="Người dùng"
        action={
          <>
            <label htmlFor="user-search" className="sr-only">
              Tìm người dùng theo email
            </label>
            <Input
              id="user-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo email…"
              className="w-64"
            />
          </>
        }
      />

      {users.isLoading && <TableSkeleton columns={6} />}

      {users.isError && (
        <ErrorState
          title="Không tải được danh sách người dùng"
          description={errorText(users.error, 'Vui lòng thử lại.')}
          detail={errorDetail(users.error)}
          onRetry={() => void users.refetch()}
        />
      )}

      {users.data &&
        users.data.users.length === 0 &&
        (committedQ ? (
          <TableEmpty
            title={`Không có người dùng nào khớp "${committedQ}"`}
            description="Thử một phần của địa chỉ email, hoặc bỏ bộ lọc để xem toàn bộ."
            onClearFilter={() => setQ('')}
          />
        ) : (
          <TableEmpty
            icon="shield"
            title="Chưa có người dùng nào"
            description="Tài khoản sẽ xuất hiện ở đây ngay khi có người đăng ký."
          />
        ))}

      {users.data && users.data.users.length > 0 && (
        <Reveal>
          <TableCard>
            <Table>
              <Thead>
                <Th>Email</Th>
                <Th>Tên</Th>
                <Th>Vai trò</Th>
                <Th>Gói</Th>
                <Th align="right">Số khóa học</Th>
                <Th>Ngày tạo</Th>
              </Thead>
              <Tbody>
                {users.data.users.map((u) => (
                  <tr key={u.id}>
                    <Td className="font-medium text-ink-900">{u.email}</Td>
                    <Td>{u.displayName}</Td>
                    <Td>
                      <Badge
                        tone={u.role === 'ADMIN' ? 'info' : 'neutral'}
                        icon={u.role === 'ADMIN' ? 'shield' : undefined}
                      >
                        {u.role}
                      </Badge>
                    </Td>
                    <Td className="font-medium">{u.subscriptionCode ?? '—'}</Td>
                    <Td align="right" className="tabular-nums">
                      {u.courseCount}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-500">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
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
