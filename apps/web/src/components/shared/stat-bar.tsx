'use client';

import { useProgressOverview } from '@/features/learning/learning-api';
import { Icon, type IconName } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Dải chỉ số đầu trang. Chỉ hiện số liệu ứng dụng thật sự theo dõi
 * (`ProgressOverview`): streak, số bài đã hoàn thành, điểm trung bình.
 * LEARN không có hệ thống gem/tim nên không dựng các chỉ số đó.
 */
function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: IconName;
  value: string;
  label: string;
  tone: 'flame' | 'sky' | 'star';
}) {
  // Icon ở đây là thứ duy nhất cho biết con số bên cạnh nói về cái gì, nên nó
  // là đồ hoạ mang nghĩa: WCAG 1.4.11 đòi ≥ 3:1 với nền. Bậc -500 trên nền
  // `surface-100` chỉ đạt 2.12 / 2.56 / 2.87 — bậc -700 đạt 6.08 / 5.37 / 5.09.
  const color =
    tone === 'flame' ? 'text-warning-700' : tone === 'sky' ? 'text-sky-700' : 'text-success-700';
  return (
    // Không dùng `title`: tooltip không hiện trên cảm ứng và trình đọc màn
    // hình đã có `sr-only` phía dưới.
    <div className="flex items-center gap-1.5">
      <span className={color}>
        <Icon name={icon} size={22} strokeWidth={2.5} filled={tone === 'flame'} />
      </span>
      <span className="text-sm font-bold text-ink-900">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function StatBar() {
  const { data, isPending, isError } = useProgressOverview();

  if (isPending) {
    return (
      <div className="flex items-center gap-5">
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-14" />
        <Skeleton className="h-6 w-14" />
      </div>
    );
  }

  // Lỗi tải chỉ số không được chặn cả shell — ẩn dải và để nội dung chính chạy tiếp.
  if (isError || !data) return null;

  return (
    <div className="flex items-center gap-5">
      <Stat
        icon="flame"
        tone="flame"
        value={String(data.activeStreak)}
        label={`Chuỗi ${data.activeStreak} ngày học`}
      />
      <Stat
        icon="check"
        tone="sky"
        value={`${data.completedLessons}/${data.totalLessons}`}
        label={`Đã hoàn thành ${data.completedLessons} trên ${data.totalLessons} bài`}
      />
      <Stat
        icon="star"
        tone="star"
        value={data.averageScore === null ? '—' : String(Math.round(data.averageScore))}
        label={
          data.averageScore === null ? 'Chưa có điểm trung bình' : 'Điểm trung bình các bài tập'
        }
      />
    </div>
  );
}
