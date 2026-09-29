# ADR 015 — Đơn sắc: chỉ các tông từ trắng tới đen; mascot chỉ trắng và đen

- **Ngày:** 2026-09-28
- **Trạng thái:** Đã chấp nhận
- **Đổi `[SPEC]`:** spec §14 "Suggested Visual Language", HANDBOOK §14.2 và §13.4 — đã sửa spec
  **trước** khi sửa code, đúng quy trình AGENTS.md.
- **Thay thế:** bảng màu navy/xám/sky `#5EC8F5` (spec cũ), pastel của ADR 013, mascot sky của ADR 014.

## Bối cảnh

Chủ sản phẩm yêu cầu trực tiếp: "Chỉ sử dụng tone từ trắng tới đen (có xám nhiều mức độ ở giữa)
và con mascot chỉ có trắng và đen". Đây là quyết định sản phẩm về nhận diện, không phải lựa chọn
gu của agent, nên spec được sửa theo.

## Quyết định

1. **Bảng màu:** trắng, đen và 11 mức xám trung tính `mono-50…950` (R = G = B, không hue).
   `theme.css` đặt `--color-*: initial` để **xoá toàn bộ bảng màu mặc định của Tailwind**: gõ
   `bg-blue-500` không sinh ra CSS. Đơn sắc được bảo đảm lúc build.
2. **Token ngữ nghĩa giữ tên** (`fg`, `accent`, `ok/bad/warn`, `pastel-*`, `chart-1`…) để call site
   không đổi; giá trị thành các mức xám. Nút chính: đen (sáng) / trắng ngà (tối).
3. **Trạng thái không còn dựa vào màu** — vốn đã luôn có icon + chữ (UI-GUIDE §2), nay bù thêm:
   - Lỗi: viền đen đậm (`bad-line`), nhãn lỗi **đảo màu** (nền đen chữ trắng).
   - Đáp án đúng: viền đậm liền; lựa chọn sai: viền đứt.
   - Nút phá huỷ: viền đen 2px trên nền panel, khác hẳn nút chính (khối đặc), luôn có bước xác nhận.
   - Liên kết: màu chữ chính + gạch chân (WCAG 1.4.1).
4. **Mascot trắng + đen:** tông sáng thân đen mặt trắng (chính là màu gốc bản export Blob Studio);
   tông tối đảo lại (thân trắng mặt đen) vì thân đen chìm trên nền gần đen. Logo cùng quy tắc, đổi
   bằng CSS (`fill-fg` / `fill-app`). Favicon thân đen mặt trắng, viền trắng mảnh để thấy trên tab tối.
5. Pháo giấy khi qua bài, bìa khóa học, biểu đồ chi phí: đều thành thang xám.

## Hệ quả

- Tương phản đo lại (ghi trong `theme.css`): chữ ≥ 4.82:1 trên mọi nền; viền ô nhập ≥ 3.33:1.
- `audit-a11y.mjs` 18/18 màn 0 vi phạm; quét tông tối 15 màn 0 serious/critical.
- Kiểm bằng máy: CSS build ra không còn màu hex/rgb nào có R, G, B khác nhau.
- `packages/ui` (bản sao màu cho TS) đổi theo; `feedbackColors` bị gỡ.
- Memory `feedback-own-the-design-decisions` từng ghi "giữ spec khi yêu cầu thiết kế va với spec";
  ADR này ghi rõ ngoại lệ: yêu cầu **trực tiếp, rõ ràng** của chủ sản phẩm đổi nhận diện → sửa spec
  trước, rồi làm.
