import { Badge, type BadgeTone, type IconName } from '@/components/ui';
import { humanizeCode } from '@/lib/humanize';

/**
 * Nhãn trạng thái dùng chung cho các bảng admin — AI Job, gói đăng ký, khóa
 * học. Gom về một chỗ để ba bảng không tự chọn màu mỗi nơi một kiểu.
 *
 * Mỗi trạng thái "cần chú ý" đều kèm icon, để không phân biệt chỉ bằng màu.
 */
const TONES: Record<string, BadgeTone> = {
  // AI Job
  QUEUED: 'neutral',
  RUNNING: 'info',
  SUCCEEDED: 'success',
  FAILED: 'danger',
  CANCELLED: 'neutral',
  // Gói đăng ký
  ACTIVE: 'success',
  TRIALING: 'info',
  PAST_DUE: 'warning',
  CANCELED: 'neutral',
  // Khóa học
  DRAFT: 'neutral',
  READY: 'success',
  ARCHIVED: 'neutral',
};

const ICONS: Record<string, IconName> = {
  SUCCEEDED: 'check',
  FAILED: 'alert',
  PAST_DUE: 'alert',
  ACTIVE: 'check',
  READY: 'check',
};

/**
 * Mã trạng thái là từ vựng của backend, không phải của người đọc bảng. Trước
 * đây chip đổ thẳng `PAST_DUE` / `SUCCEEDED` ra màn hình — trái luật "không đổ
 * enum thô" ở `docs/UI-GUIDE.md` §10.
 */
const LABELS: Record<string, string> = {
  // AI Job
  QUEUED: 'Đang chờ',
  RUNNING: 'Đang chạy',
  SUCCEEDED: 'Thành công',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
  // Gói đăng ký
  ACTIVE: 'Đang dùng',
  TRIALING: 'Dùng thử',
  PAST_DUE: 'Quá hạn thanh toán',
  CANCELED: 'Đã hủy',
  // Khóa học
  DRAFT: 'Bản nháp',
  READY: 'Sẵn sàng',
  ARCHIVED: 'Đã lưu trữ',
};

/** Loại AI Job — cũng là enum của API, cũng không được hiện thô. */
const JOB_TYPE_LABELS: Record<string, string> = {
  EXTRACT_DOCUMENT: 'Trích xuất tài liệu',
  GENERATE_LESSONS: 'Sinh bài học',
  REGENERATE_LESSON: 'Sinh lại một bài',
};

export function jobTypeLabel(type: string) {
  return JOB_TYPE_LABELS[type] ?? humanizeCode(type);
}

export function statusLabel(status: string) {
  return LABELS[status] ?? humanizeCode(status);
}

export function StatusChip({ status }: { status: string }) {
  return (
    <Badge tone={TONES[status] ?? 'neutral'} icon={ICONS[status]}>
      {statusLabel(status)}
    </Badge>
  );
}
