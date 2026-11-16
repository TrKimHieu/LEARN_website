'use client';

import type { FeedbackQuestion, FeedbackTopic } from '@learn/api-contracts';
import { useAdminFeedback } from '@/features/admin/admin-api';
import {
  Card,
  PageHeader,
  SectionTitle,
  Table,
  TableCard,
  TableEmpty,
  TableSkeleton,
  Tbody,
  Td,
  Th,
  Thead,
  UserText,
} from '@/components/ui';
import { ErrorState } from '@/components/ui/states';
import { errorDetail, errorText } from '@/lib/api-client';
import { relativeTime } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';

const TOPIC: Record<FeedbackTopic, string> = {
  LESSON: 'Bài học',
  PRACTICE: 'Bài kiểm tra',
  LESSON_GENERATION: 'Sinh bài học',
  FLASHCARD_REVIEW: 'Ôn thẻ',
  FLASHCARD_AI: 'Thẻ AI',
  POMODORO: 'Pomodoro',
};

const QUESTION: Record<FeedbackQuestion, string> = {
  QUALITY: 'Chất lượng',
  UNDERSTANDING: 'Mức nắm bài',
  USEFULNESS: 'Hữu ích',
};

export default function AdminFeedbackPage() {
  usePageTitle('Quản trị · Góp ý');
  const feedback = useAdminFeedback();

  return (
    <section>
      <PageHeader title="Góp ý của người học" />

      {feedback.isLoading && <TableSkeleton columns={4} />}

      {feedback.isError && (
        <ErrorState
          title="Không tải được góp ý"
          description={errorText(feedback.error, 'Vui lòng thử lại.')}
          detail={errorDetail(feedback.error)}
          onRetry={() => void feedback.refetch()}
        />
      )}

      {feedback.data && feedback.data.stats.length === 0 && (
        <TableEmpty icon="star" title="Chưa có lượt góp ý nào" />
      )}

      {feedback.data && feedback.data.stats.length > 0 && (
        <TableCard>
          <Table>
            <Thead>
              <Th>Tính năng</Th>
              <Th>Câu hỏi</Th>
              <Th>Lượt</Th>
              <Th>Trung bình</Th>
              <Th>Phân bố 1 → 5</Th>
            </Thead>
            <Tbody>
              {feedback.data.stats.map((s) => (
                <tr key={`${s.topic}/${s.question}`}>
                  <Td>{TOPIC[s.topic]}</Td>
                  <Td>{QUESTION[s.question]}</Td>
                  <Td className="tabular-nums">{s.count}</Td>
                  <Td className="font-semibold tabular-nums">{s.average.toFixed(1)} / 5</Td>
                  <Td>
                    <Distribution values={s.distribution} total={s.count} />
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>
        </TableCard>
      )}

      {feedback.data && feedback.data.comments.length > 0 && (
        <section aria-labelledby="comments-title" className="mt-10">
          <SectionTitle id="comments-title">Góp ý gần đây</SectionTitle>
          <ul className="grid gap-3">
            {feedback.data.comments.map((c, i) => (
              <li key={`${c.createdAt}-${i}`}>
                <Card className="grid gap-1">
                  <p className="text-xs text-fg-subtle">
                    {TOPIC[c.topic]} · {c.score}/5 · {relativeTime(c.createdAt)}
                  </p>
                  <p className="min-w-0">
                    <UserText full>{c.comment}</UserText>
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

/** Thanh ngang 5 đoạn theo số lượt mỗi mức điểm; số lượt đi kèm ở nhãn cho trình đọc màn hình. */
function Distribution({ values, total }: { values: number[]; total: number }) {
  return (
    <div
      className="flex h-2 w-40 overflow-hidden rounded-full bg-track"
      role="img"
      aria-label={values.map((n, i) => `${i + 1} điểm: ${n} lượt`).join(', ')}
    >
      {values.map((n, i) => (
        <span
          key={i}
          style={{
            width: total ? `${(n / total) * 100}%` : 0,
            background: 'var(--brand)',
            opacity: 0.35 + i * 0.16,
          }}
        />
      ))}
    </div>
  );
}
