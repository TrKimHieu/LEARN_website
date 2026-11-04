/**
 * Mọi chữ do người dùng hoặc AI tạo ra (tên khóa, tên bài, tên tệp, câu hỏi) hiển thị qua đây.
 *
 * - `title` cho rê chuột xem đủ khi khối cha cắt bớt bằng `truncate` hoặc `line-clamp-*`.
 * - `data-user-text` là mốc để `npm run check:long-text` thay bằng chuỗi dài nhất rồi đo tràn.
 *
 * Xuống dòng cho chuỗi không dấu cách do `overflow-wrap: anywhere` ở `globals.css` lo.
 *
 * Tên trong danh sách và đầu trang phải được khối cha cắt, nếu không lệnh kiểm tra sẽ báo. `full` dành
 * cho nội dung phải đọc đủ mới dùng được, như câu hỏi, đáp án và lời giải thích.
 */
export function UserText({ children, full = false }: { children?: string | null; full?: boolean }) {
  return (
    <span data-user-text={full ? 'full' : ''} title={children ?? undefined}>
      {children}
    </span>
  );
}
