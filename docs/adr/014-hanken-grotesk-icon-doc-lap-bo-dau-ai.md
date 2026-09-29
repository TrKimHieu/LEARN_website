# ADR 014 — Hanken Grotesk tự host, icon đứng độc lập, gỡ các dấu hiệu "AI"

- **Ngày:** 2026-09-28
- **Trạng thái:** Đã chấp nhận (màu mascot của ADR này bị thay bởi ADR 015)
- **Thay thế:** phần chữ của ADR 012 (Mona Sans + Newsreader serif)
- **Liên quan:** `docs/UI-GUIDE.md` §2, §5, §7

## Bối cảnh

Người dùng (skill `taste-skill`): "sửa những điểm trông AI; font chưa ổn, chưa hiện đại; icon
không nên có ô nền bo quanh; mascot chỉ nên có 1 màu, không gradient; ẩn nút N ở góc". Audit theo
mục 9 của skill tìm thêm: serif cho tiêu đề (dấu hiệu AI số một theo skill), gạch dài `—` trong chữ
hiển thị (bị cấm tuyệt đối), dấu `·` dùng tới 3 lần một dòng.

## Quyết định

1. **Font:** Hanken Grotesk (variable, có tiếng Việt) cho cả tiêu đề lẫn giao diện, JetBrains Mono
   cho code. Chọn bằng cách đặt 8 font sans có tiếng Việt cạnh nhau trên cùng một câu tiếng Việt:
   Geist/Satoshi không có tiếng Việt; Mona Sans có chữ "a" một tầng làm chữ non nớt; Geologica,
   Bricolage quá cá tính cho giao diện app. **Bỏ serif.** Bài đọc: cùng họ sans, 17px, dòng 1.75.
2. **Tự host qua Fontsource** (`@fontsource-variable/*`) thay `next/font/google`: bản Google tải
   font lúc dev/build, máy hoặc CI không có mạng ra ngoài lặng lẽ rơi về font dự phòng (đã dính ở
   preview của Claude Code). `@font-face` chia theo `unicode-range`, chỉ tải subset cần.
3. **Icon đứng một mình** — gỡ mọi ô nền bo quanh icon (số liệu, hoạt động, tài liệu, bảng rỗng,
   bảng giá, bước tạo khóa học, dấu "đã xong" của lộ trình dùng glyph CheckCircle Fill). Giữ nền
   cho thứ không phải icon: avatar, chữ A/B/C của đáp án, vòng số thứ tự bài.
4. **Mascot một màu phẳng**: truyền 3 điểm dừng cùng màu vào `gradient` của vendor (không sửa file
   vendor, ADR 006) và `effects={false}` (vệt sao chổi của vendor chạy qua nhiều hue).
5. **Ẩn nút dev tools "N"** của Next.js: `devIndicators: false` (chỉ ảnh hưởng dev).
6. **Chữ hiển thị:** không `—`/`–` (thay bằng dấu phẩy, dấu chấm, dấu hai chấm hoặc viết lại câu);
   tối đa một dấu `·` mỗi dòng; ô trống dùng chữ ("Chưa có", "Không có") thay vì `—`.

## Hệ quả

- `audit-a11y.mjs` 18/18 màn 0 vi phạm; quét tông tối 15 màn 0 serious/critical.
- Thêm `@fontsource-variable/hanken-grotesk`, `@fontsource-variable/jetbrains-mono`.
