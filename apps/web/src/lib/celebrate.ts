import confetti from 'canvas-confetti';

/**
 * Pháo giấy cho khoảnh khắc người học vượt qua bài tập.
 *
 * Phạm vi dùng cố ý hẹp: **chỉ khi đạt điểm qua bài**. HANDBOOK §13.2 cho phép
 * ăn mừng lúc hoàn thành bài học, và ăn mừng chỉ có nghĩa khi nó hiếm — bắn
 * pháo cho mọi thao tác thì nó thành nhiễu. Không dùng cho lưu thành công, tạo
 * khóa học, hay bất cứ tác vụ thường ngày nào.
 *
 * Đây **không phải** gamification mới: không có điểm thưởng, chuỗi nhiệm vụ hay
 * vật phẩm nào được thêm vào — chỉ là phản hồi thị giác cho một sự kiện đã tồn
 * tại sẵn trong sản phẩm (AGENTS.md cấm bịa hệ thống gamification).
 */

/** Đơn sắc (ADR 015): chỉ các mức xám từ đen tới trắng, để pháo giấy không lạc khỏi bảng màu. */
const COLORS = ['#111111', '#404040', '#808080', '#bfbfbf', '#e5e5e5'];

/**
 * `canvas-confetti` vẽ thẳng lên canvas nên `MotionConfig` không với tới được;
 * phải tự hỏi hệ điều hành.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hai chùm bắn chéo từ hai mép dưới màn hình — hướng vào giữa, nơi thẻ kết quả
 * đang nằm. `zIndex` thấp hơn lớp modal để sau này có hộp thoại thì pháo không
 * phủ lên trên nó.
 */
export function celebrateSuccess(): void {
  if (prefersReducedMotion()) return;

  const common: confetti.Options = {
    particleCount: 60,
    spread: 62,
    startVelocity: 42,
    ticks: 160,
    gravity: 0.9,
    scalar: 0.9,
    colors: COLORS,
    zIndex: 40,
    disableForReducedMotion: true,
  };

  void confetti({ ...common, origin: { x: 0.1, y: 0.75 }, angle: 60 });
  void confetti({ ...common, origin: { x: 0.9, y: 0.75 }, angle: 120 });
}
