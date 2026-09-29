# ADR 008 — Nạp webfont Be Vietnam Pro + JetBrains Mono, và khối token bổ sung

- **Ngày:** 2026-09-22
- **Trạng thái:** Đã chấp nhận — **phần chọn font sans bị thay bởi ADR 011** (Plus Jakarta Sans, 2026-09-27); phần token bổ sung vẫn hiệu lực.
- **Liên quan:** spec §14.2 (`[SPEC]`), `docs/UI-GUIDE.md` §2, `UX-UI-PRINCIPLES` §4

## Bối cảnh

Tới trước quyết định này, LEARN **không nạp một webfont nào**. `--font-sans` là chuỗi hệ thống:

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

Nghĩa là giao diện đổi mặt chữ theo từng hệ điều hành — Segoe UI trên Windows, San Francisco trên
macOS, Roboto trên Android. Với một sản phẩm portfolio, đó là chi tiết đầu tiên người xem nhận ra,
và nó nói "chưa ai chọn gì cả".

Hai biến `--font-sans` / `--font-mono` khi đó nằm **trong khối gắn nhãn `[SPEC]`** của
`packages/config/tailwind/theme.css`, khối có chú thích "giữ nguyên giá trị".

## Vấn đề trích dẫn phải sửa cùng lúc

Khối thứ hai của `theme.css` tự ghi là do "ADR 0004" quản. `app/dev/ui/page.tsx` gắn nhãn
"Màu — bổ sung (ADR 0004)". `docs/UI-GUIDE.md` §2 lặp lại lần thứ ba.

Nhưng `docs/adr/004-webhook-nguon-su-that.md` là ADR về **webhook thanh toán**. Chưa bao giờ có ADR
nào về token. Ba file đã trích dẫn một tài liệu không tồn tại.

ADR này nhận luôn vai trò đó: **nó là ADR quản khối token bổ sung.** Cả ba chỗ trích dẫn được sửa
về 008.

## `[SPEC]` §14.2 nói gì — và không nói gì

Đọc lại nguyên văn spec §14.2 (mục "Suggested Visual Language"):

> - Dark navy, neutral gray, and sky blue accents (`#5EC8F5`), matching the Circle mascot palette
>   in `CircleMascot/`. Do not introduce purple.
> - Monospace typography for code and technical metadata.

Spec ràng buộc **màu**, và với chữ thì chỉ nói "monospace cho code và metadata kỹ thuật". Nó
**không chỉ định font sans nào**, không nói tên họ chữ nào, không cấm nạp webfont.

Kết luận: giá trị `--font-sans` chưa bao giờ là ràng buộc `[SPEC]` — nó bị **xếp nhầm** vào khối
đó ở một phiên trước. Chọn font sans là một quyết định `[QĐ]` còn mở, và đây là ADR mở nó.

Lựa chọn mono vẫn thoả §14.2 vì JetBrains Mono đúng là monospace.

## Quyết định

| Vai trò | Font               | Weight nạp            |
| ------- | ------------------ | --------------------- |
| Sans    | **Be Vietnam Pro** | 400 · 500 · 600 · 700 |
| Mono    | **JetBrains Mono** | 400 · 700             |

Hai dòng `--font-*` chuyển xuống khối bổ sung, trỏ vào biến do `next/font` sinh ra, **giữ nguyên
chuỗi hệ thống cũ làm đuôi dự phòng**. Không một dòng `--color-*` nào trong khối `[SPEC]` bị chạm.

## Vì sao là hai font này

**Ràng buộc quyết định: dấu tiếng Việt.** Toàn bộ UI của LEARN là tiếng Việt. `UX-UI-PRINCIPLES`
§4.2 đã cảnh báo riêng: _"Tiếng Việt: kiểm dấu ở cỡ nhỏ và ở `line-height` chặt — dấu mũ dễ bị cắt
hoặc chạm dòng trên."_ Một font thiếu dấu sẽ bị trình duyệt ghép dấu từ font khác, và chữ vỡ thành
hai mặt chữ ngay giữa một từ.

Những cái tên thường được gợi ý cho "web hiện đại" — Geist, Outfit, Cabinet Grotesk, Satoshi —
**đều bị loại vì lý do này**: không font nào trong số đó có bộ dấu tiếng Việt đầy đủ.

- **Be Vietnam Pro** do người Việt thiết kế (Lâm Bảo, Tony Le, ViệtAnh Nguyễn). Dấu được vẽ riêng
  cho từng tổ hợp chứ không ghép máy móc — quan trọng nhất ở các ca chồng dấu (`ể` `ỗ` `ự` `ợ` `ữ`).
  Có 9 weight nên thừa sức cho thang 400/500/600/700.
- **JetBrains Mono** đã nằm sẵn trong chuỗi fallback `--font-mono` cũ, nên đây là chuyện hiện thực
  hoá một lựa chọn đã có. Dấu tiếng Việt đầy đủ.

## Ngân sách weight: 4 bậc sans, và hệ quả bắt buộc

Be Vietnam Pro trên Google Fonts là họ **tĩnh, không phải variable**. Mỗi weight × mỗi subset là một
file woff2 riêng, nên thêm một bậc là thêm 3 file (latin + latin-ext + vietnamese).

Chốt 4 bậc: 400 thân, 500/600 cho thứ bậc tinh, 700 cho tiêu đề. Khớp `UX-UI-PRINCIPLES` §4.1
("2–3 bậc đậm; trộn nhiều weight làm hệ thống trôi").

**Hệ quả bắt buộc:** codebase đang có 24 chỗ dùng `font-extrabold` (800), trong đó có cả
`components/ui/page-header.tsx` — tức mọi tiêu đề trang. Weight 800 **không nằm trong ngân sách**,
và trình duyệt gặp weight không có sẽ tự bôi đậm giả, làm chữ nhoè.

Nên toàn bộ `font-extrabold` đã được đổi thành `font-bold` trong cùng thay đổi này. Đây không phải
đánh đổi miễn cưỡng: UI-GUIDE §4b vốn đã xếp weight rất nặng vào "ngôn ngữ đã khai tử" và nói thứ
bậc đến từ _weight + màu_, nhưng `PageHeader` vẫn ship `extrabold` — mâu thuẫn này nay khép lại.

## Vì sao `@theme` thường, không phải `@theme inline`

Tailwind v4 không có file config JS (UI-GUIDE §3), nên đây là chi tiết kỹ thuật duy nhất đáng ghi:

- **`@theme` thường** phát nguyên văn `--font-sans: var(--font-be-vietnam-pro), …` ra `:root`, và
  trình duyệt giải chuỗi `var()` lúc dùng. Đúng thứ ta cần, vì `--font-be-vietnam-pro` do next/font
  đặt lên `<html>` **lúc chạy**, không tồn tại lúc build.
- **`@theme inline`** sẽ nội tuyến giá trị vào utility `.font-sans` và **ngừng phát `--font-sans` ra
  `:root`**. Utility vẫn chạy, nhưng dòng `body { font-family: var(--font-sans) }` ở `globals.css`
  sẽ hỏng **âm thầm** — body rơi về font mặc định của trình duyệt mà không có lỗi nào.

`className` của next/font đặt trên **`<html>`, không phải `<body>`**: `@theme` biên dịch thành rule
`:root`, tức chính phần tử `html`.

Chuỗi thật vì thế sâu ba bậc — webfont → họ fallback **đã khớp metric** do next/font tự sinh
(`"Be Vietnam Pro Fallback"`, thứ dập CLS trong lúc swap) → chuỗi hệ thống cũ.

Kiểm bằng máy chứ không bằng mắt, sau `npm run build -w apps/web`:

```bash
grep -o -- "--font-sans:[^;]*;" apps/web/.next/static/css/*.css
```

Phải in ra chuỗi có `var(--font-be-vietnam-pro)` đứng đầu.

## Hệ quả

- Được: một mặt chữ duy nhất trên mọi hệ điều hành; dấu tiếng Việt do người Việt vẽ; có 500/600 để
  làm thứ bậc mà không phải nhảy cỡ chữ.
- Mất: `next/font/google` **tải font lúc build**. CI không có mạng sẽ fail cứng. Nếu điều đó thành
  ràng buộc thật, phương án thay thế là `next/font/local` với woff2 commit sẵn trong repo.
- Bảo trì: muốn thêm một weight thì phải thêm vào mảng `weight` ở `app/layout.tsx` **và** cân nhắc
  chi phí 3 file mới. Đừng thêm weight chỉ để dùng một chỗ.
- Nếu `subsets: ['vietnamese']` báo _Unknown subset_ sau này, đó là bước xác minh dấu đang fail —
  **không được bỏ subset đi cho hết lỗi**.
