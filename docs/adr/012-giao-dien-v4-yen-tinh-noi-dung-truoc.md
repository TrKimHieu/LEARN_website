# ADR 012 — Giao diện v4: yên tĩnh, nội dung trước (thay phần hình thức của ADR 011)

- **Ngày:** 2026-09-27
- **Trạng thái:** Đã chấp nhận — màu nền/bóng/icon được tinh chỉnh bởi ADR 013 (tối giản + pastel + Phosphor).
- **Thay thế:** phần hình thức của ADR 011 (font, sidebar navy, banner aurora, lộ trình hình sin).
  Hạ tầng của ADR 011 vẫn giữ: token ngữ nghĩa `@theme inline`, chế độ tối Sáng/Tối/Tự động,
  `data-theme` trên cây con.
- **Liên quan:** spec §14.2 `[SPEC]`, HANDBOOK §13 `[SPEC]`, `docs/UI-GUIDE.md`

## Bối cảnh

Người dùng đánh giá bản v3 (phiên 21) là "quá xấu, không thân thiện, không tối ưu, trông rất AI
slop". Đối chiếu audit của skill `redesign-skill`, bản v3 dính đúng các dấu hiệu đó:

1. **Mảng tối ngẫu nhiên trên trang sáng** — banner navy "aurora" + quầng blur + lưới chấm ở tổng
   quan, chi tiết khóa học, cài đặt, màn đăng nhập; bìa khóa học là khối navy đặc.
2. **Eyebrow mono viết hoa giãn chữ** ("CHỦ NHẬT, 27 THÁNG 9") ở mọi màn.
3. **Cùng một số liệu hiện ba lần** trên tổng quan (chip top bar, bốn thẻ số, vòng tiến độ).
4. **Thẻ số liệu mẫu** (ô icon màu + số to), mọi thứ là thẻ viền + bóng, nút gradient phát sáng.
5. **Lộ trình hình sin**: 118px/bài, tiêu đề bị kẹp, nút sắp xếp chỉ hiện khi rê chuột.
6. Sidebar navy phát sáng cho 4 mục điều hướng; công tắc mặt trời/mặt trăng; avatar tròn; badge
   viên thuốc.

## Quyết định

1. **Chữ:** Mona Sans (giao diện) + **Newsreader** serif (tiêu đề trang, bài đọc 19px). Cả hai
   variable, có subset tiếng Việt (Geist/Outfit mà skill gợi ý không có). Tắt `zero` trong số đều
   (Mona vẽ 0 gạch chéo), giữ tắt `calt`. Độ đậm trần là 600.
2. **Màu:** nền xám lạnh trung tính (`#f7f8fa`, cùng họ slate với ink §14.2), không pha sky. Nút
   chính **navy đặc** (sáng) / sky-400 (tối). Sky chỉ còn là tín hiệu: tiến độ, mục đang chọn, vòng
   focus, bài đang học. Không gradient, không glow, không mảng tối trên trang sáng.
3. **Điều hướng trên cùng** thay sidebar (app chỉ có 3–4 điểm đến). Gói/hạn mức và chọn giao diện
   vào menu tài khoản; bỏ chip số liệu trên thanh đầu. Tab đáy giữ nguyên ở mobile.
4. **Tổng quan** trả lời "học tiếp cái gì": thẻ "Học tiếp" dẫn thẳng vào **bài** kế tiếp; mỗi số
   liệu hiện một lần.
5. **Lộ trình = stepper dọc** (`features/learning/lesson-list.tsx`), xoá `lesson-path.tsx`. Giữ ý
   nghĩa nét liền/đứt; nút lên/xuống luôn hiện.
6. **Thành phần:** số liệu trong `StatStrip` (một dải kẻ vạch) thay thẻ icon; badge góc vuông nhẹ
   không viền; avatar ô vuông bo góc; thẻ khóa học là bìa + chữ trên nền trang (như kệ sách); bìa
   sáng; chọn giao diện bằng chữ "Tự động · Sáng · Tối".

## Hệ quả

- Tương phản đo lại cho bảng mới (ghi trong `theme.css`); viền ô nhập dùng `line-input` ≥ 3:1
  (WCAG 1.4.11). `audit-a11y.mjs` 18/18 màn 0 vi phạm; quét tông tối 15 màn 0 serious/critical.
- `next/font` tải font lúc build/dev. Tiến trình preview của Claude Code không có mạng ra ngoài → dev
  server rơi về font dự phòng; chạy `npm run build -w apps/web` một lần (từ shell) để cache font.
