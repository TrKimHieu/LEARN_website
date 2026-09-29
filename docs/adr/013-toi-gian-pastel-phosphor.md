# ADR 013 — Tối giản + pastel tươi + icon Phosphor

- **Ngày:** 2026-09-28
- **Trạng thái:** Đã chấp nhận
- **Bổ sung cho:** ADR 012 (giữ bố cục, font, điều hướng trên cùng, stepper bài học).
- **Liên quan:** spec §14.2 `[SPEC]`, `docs/UI-GUIDE.md` §2, §5

## Bối cảnh

Người dùng yêu cầu "tối giản giao diện, hiện đại và thân thiện hơn, dùng palette màu pastel tươi
hơn" (skill `minimalist-skill`). Skill quy định: nền trung tính ấm, viền 1px `#EAEAEA`, gần như
không bóng, pastel chỉ làm điểm nhấn, icon nét dày (Phosphor/Radix — cấm Lucide), nhiều khoảng trắng.

Hai chỗ phải cân với ràng buộc có sẵn:

- **Spec §14.2** chỉ cho navy / xám / sky và cấm tím. "Pastel tươi" không được mở ra hue mới.
- Skill muốn nhãn **in hoa giãn chữ** — tiếng Việt có dấu viết hoa ở 11–12px khó đọc, trái với mục
  tiêu "thân thiện".

## Quyết định

1. **Nền & viền:** `app #FBFBFA`, `panel #FFF`, `line #EAEAEA`, bóng thẻ = 0 (hover chỉ
   `0 2px 8px rgb(0 0 0 / .04)`). Bo nút 6px, thẻ 12px.
2. **Bốn pastel** là sắc nhạt của hue **đã có**: sky (thương hiệu), mint (xanh lá phản hồi), lemon
   (vàng phản hồi), peach (đỏ cam phản hồi). Không tím, không hồng. Token `pastel-*` / `on-pastel-*`,
   mọi cặp chữ/nền ≥ 4.98:1 (sáng), ≥ 8:1 (tối). Dùng cho: bìa khóa học (nền pastel + nét mực mảnh +
   đúng một hình khối pastel đậm), ô icon 24px của số liệu, vòng trạng thái hoạt động, số bước ở
   màn đăng nhập, nhãn. **Không bao giờ** làm nền mảng lớn.
3. **Chữ & màu chữ:** ink-900 §14.2 cho chữ chính và nút chính (tông tối: nút trắng ngà). Link /
   accent `#1f6c9f` (sky pastel đậm).
4. **Badge:** viên thuốc pastel, **chữ thường 12px** — giữ tinh thần skill (nhãn pastel nhỏ), bỏ
   phần in hoa vì tiếng Việt.
5. **Icon: Phosphor** (`@phosphor-icons/react`, entry `/ssr`, trọng lượng Bold; `filled` → Fill),
   thay `lucide-react` (đã gỡ). Chỉ đổi ruột `components/ui/icon.tsx`; call site không đổi.
   `optimizePackageImports` trong `next.config.ts`.
6. **Khoảng trắng:** khung nội dung `max-w-5xl` (admin `max-w-6xl`), tiêu đề trang serif 2.75rem
   tracking −0.02em, khoảng cách giữa các khối 56px. Số liệu Tổng quan thành một `StatStrip` ngang.

## Hệ quả

- `audit-a11y.mjs` 18/18 màn 0 vi phạm; quét tông tối 15 màn 0 serious/critical; 390px không tràn.
- Thêm một dependency (`@phosphor-icons/react`), bớt một (`lucide-react`).
