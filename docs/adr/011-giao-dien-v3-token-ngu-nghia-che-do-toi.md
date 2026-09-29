# ADR 011 — Giao diện v3: token ngữ nghĩa, chế độ tối, Plus Jakarta Sans, sidebar navy

- **Ngày:** 2026-09-27
- **Trạng thái:** Đã chấp nhận — **phần hình thức (font, sidebar, aurora, lộ trình sin) bị thay bởi ADR 012**; token ngữ nghĩa + chế độ tối vẫn hiệu lực.
- **Thay thế một phần:** ADR 008 (phần chọn font sans). Phần token bổ sung của ADR 008 vẫn giữ.
- **Liên quan:** spec §14.2 `[SPEC]`, HANDBOOK §13 `[SPEC]`, `docs/UI-GUIDE.md`

## Bối cảnh

Người dùng yêu cầu (phiên 21): "xoá toàn bộ UI hiện tại, tạo lại một bản UI mới, hiện đại hơn,
tương thích hơn, nổi bật hơn". Theo memory `feedback-own-the-design-decisions`, quyết định thiết
kế do agent chốt và giải thích, không hỏi gu. Ràng buộc không đổi: bảng màu `[SPEC]` §14.2
(navy / xám / sky `#5EC8F5`, không tím), mascot chỉ ở 4 vị trí §13.1, 5 trạng thái dữ liệu,
không bịa gamification.

Bản cũ có ba giới hạn đo được:

1. **Không có chế độ tối**, dù spec §14.2 dựng toàn bộ bảng màu quanh navy đậm và HANDBOOK §13.4
   đã kiểm mascot trên nền `#0F1720`. Component gọi thẳng `bg-white` / `text-ink-900` nên không
   đổi tông được.
2. **Rail phải 320px ở mọi màn** (chỉ chứa thẻ gói/hạn mức) làm cột nội dung chỉ còn ~736px —
   UI-GUIDE §8 cũ phải ghi luật "lưới 3–4 cột chỉ từ `2xl`" để né.
3. **Be Vietnam Pro là họ tĩnh**: mỗi độ đậm là một file, nên ADR 008 cấm `font-extrabold` —
   tiêu đề không có bậc đậm hơn 700.

## Quyết định

1. **Token ngữ nghĩa** (`app`, `panel`, `panel-2`, `muted`, `line`, `line-strong`, `track`, `fg`,
   `fg-muted`, `fg-subtle`, `accent`, `ok`, `bad`, `warn` + biến thể `-soft`/`-line`, `chart-1`)
   khai báo bằng `@theme inline` trỏ vào biến CSS thô, giá trị đổi theo `[data-theme]`. `inline`
   để utility giải biến **tại phần tử**, nên một cây con ép được tông riêng (sidebar, banner
   aurora đặt `data-theme="dark"`). Khối `[SPEC]` giữ nguyên từng giá trị.
2. **Chế độ tối**: Sáng / Tối / Hệ thống (mặc định Hệ thống). Lựa chọn lưu `localStorage` (tiện
   ích riêng của người xem), script nội tuyến trong `<head>` đặt `data-theme` trước lần vẽ đầu
   tiên nên không nháy trắng. Nền tối = `navy-900`. Mascot ở tông tối đảo sắc (thân sky, mắt
   navy) giống `LogoMark tone="dark"`.
3. **Font sans: Plus Jakarta Sans** (variable, có subset `vietnamese`) thay Be Vietnam Pro. Một
   file mỗi subset cho mọi độ đậm → tiêu đề dùng được 800. Tắt `calt`: luật ngữ cảnh của font
   đổi "2xx" thành "2×x" — sai nội dung bài học (mã HTTP, kích thước ảnh). Mono giữ JetBrains Mono.
4. **Shell mới**: sidebar navy 272px luôn tông tối (điểm nhấn thương hiệu), top bar kính mờ với
   chỉ số thật + đổi tông + menu tài khoản, tab đáy dưới `lg`. **Bỏ rail phải**, dời thẻ gói/hạn
   mức xuống chân sidebar.
5. **Hình ảnh không cần tài sản**: bìa khóa học sinh xác định từ `id` (chỉ navy + sắc độ sky),
   banner "aurora" (quầng sky mờ trên navy — "subtle gradients" của §14.2), vòng tiến độ.

## Hệ quả

- Mọi cặp chữ/nền đo bằng công thức WCAG ≥ 4.5:1 ở cả hai tông (số đo ghi ngay trong
  `theme.css`). `audit-a11y.mjs`: 18/18 màn 0 vi phạm (sáng); quét bổ sung 15 màn ở tông tối:
  0 vi phạm serious/critical.
- Màu cột biểu đồ là token riêng `chart-1` (`#1a8cc2` sáng / `#239ad2` tối) — sky-500/600 trượt
  ngưỡng tương phản 3:1 của đồ hoạ trên nền trắng (đo bằng `validate_palette.js` của skill dataviz).
- Component mới phải dùng token ngữ nghĩa; `bg-white`/`text-ink-*` ở call site là lỗi (không
  đổi theo tông). Bảng màu `[SPEC]` vẫn dùng trực tiếp cho thứ cố định màu: nút primary sky +
  chữ navy-900, sidebar navy.
- `packages/ui/src/index.ts` (bản sao màu cho TS) không đổi — không giá trị palette nào đổi.
