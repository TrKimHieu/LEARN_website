/**
 * Định dạng hiển thị dùng chung.
 *
 * Nguyên tắc: hiện cái người đọc cần, giữ cái chính xác ở nơi tra được. Với mốc
 * thời gian gần, "3 giờ trước" trả lời đúng câu hỏi người dùng đang hỏi ("mới
 * hay cũ?"), còn "10:22:35 19/9/2026" bắt họ tự trừ ngày giờ trong đầu — NN/g
 * gọi đây là "match between system and the real world". Mốc chính xác vẫn nằm ở
 * thuộc tính `title` và `<time dateTime>` cho ai cần.
 */

const RTF = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Ngưỡng chuyển sang ngày tuyệt đối — quá mốc này thì "18 ngày trước" vô dụng. */
const ABSOLUTE_AFTER = 7 * DAY;

/**
 * "vừa xong" · "3 phút trước" · "hôm qua" · "12/9/2026".
 *
 * Trả về chuỗi rỗng nếu chuỗi ngày không hợp lệ, để chỗ gọi không phải render
 * "Invalid Date" ra màn hình.
 */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const ms = then.getTime();
  if (Number.isNaN(ms)) return '';

  const diff = now.getTime() - ms;

  // Lệch âm nhỏ (đồng hồ máy khách chạy trước máy chủ vài giây) không nên thành
  // "trong 4 giây nữa".
  if (diff < MINUTE) return 'vừa xong';
  if (diff >= ABSOLUTE_AFTER) return then.toLocaleDateString('vi-VN');

  if (diff < HOUR) return RTF.format(-Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return RTF.format(-Math.floor(diff / HOUR), 'hour');
  return RTF.format(-Math.floor(diff / DAY), 'day');
}

/** Mốc đầy đủ, dùng cho `title` và cho những chỗ cần chính xác tới phút. */
export function absoluteTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}
