# UI-GUIDE.md — Làm việc với giao diện LEARN

> Điểm vào cho mọi phiên sửa giao diện. Đọc sau `AGENTS.md`, trước khi mở file `.tsx` đầu tiên.
> Mục tiêu của file này: người (hoặc agent) mới vào không phải đoán xem repo đã có sẵn cái gì,
> và không vô tình phá ràng buộc `[SPEC]`.
>
> Cần **lý lẽ** đằng sau một luật, hoặc phải quyết định một thứ chưa có tiền lệ trong repo:
> xem `docs/UX-UI-PRINCIPLES.md` — tổng hợp nguyên tắc UX/UI kèm chỗ chúng đã thành ràng buộc ở đây.

## 0. Quy trình 3 bước cho một thay đổi giao diện

```bash
npm run dev:web                 # chỉ cần cái này — không cần Docker/Postgres/API
```

1. Mở <http://localhost:3000/dev/ui> — **bảng mẫu**. Mọi primitive, mọi trạng thái, toàn bộ
   bảng màu và lộ trình bài học nằm chung một trang. Sửa gì cũng thấy ngay ở đây trước.
2. Sửa code.
3. Chụp lại để so sánh:

```bash
node scripts/capture-ui.mjs
```

Ghi ra `docs/screenshots/ui/dev-ui-1440.png`. Thêm route để chụp màn khác, thêm cờ để đổi điều kiện:

```bash
node scripts/capture-ui.mjs login register        # nhiều route
node scripts/capture-ui.mjs --width 390 dev/ui    # bố cục hẹp
node scripts/capture-ui.mjs --reduced-motion dev/ui
```

> Trên Git Bash, **đừng** viết route có dấu `/` đứng đầu (`/dev/ui`) — MSYS sẽ dịch nó thành đường
> dẫn Windows. Viết `dev/ui` là được; script tự thêm dấu `/`.

Trước khi coi là xong:

```bash
npm run typecheck -w apps/web
npx eslint apps/web/src
npm run build -w apps/web
```

Và nếu thay đổi chạm tới màu, form, hay cấu trúc heading — chạy thêm audit a11y trên **màn thật**
(cần `npm run dev` đầy đủ + docker + DB đã seed):

```bash
node scripts/audit-a11y.mjs
```

Nó quét 18 màn bằng axe-core theo bộ luật WCAG 2.2 AA và trả exit code 1 nếu có vi phạm
serious/critical. Script chỉ quét **tông sáng** — đổi màu thì soát thêm tông tối (xem §2b). Đây là thứ `eslint-plugin-jsx-a11y` **không** làm được: lint chỉ đọc JSX, còn
tương phản màu chỉ tính ra được sau khi trình duyệt đã render.

## 1. Ranh giới không được vượt

| Ràng buộc                                                                | Nguồn                   |
| ------------------------------------------------------------------------ | ----------------------- |
| **Đơn sắc**: chỉ trắng → đen, xám trung tính ở giữa, không hue (ADR 015) | spec §14.2 `[SPEC]`     |
| Mascot chỉ ở hero · empty state · tiến độ AI Job · lỗi                   | HANDBOOK §13.1 `[SPEC]` |
| `celebrate` chỉ khi người dùng hoàn thành bài học                        | HANDBOOK §13.2          |
| Không bịa gamification (gem, tim, rương thưởng, nhiệm vụ)                | AGENTS.md               |
| Màn có dữ liệu phải đủ 5 trạng thái: Loading/Empty/Error/Partial/Success | AGENTS.md               |
| Đáp án đúng không rời server trước khi nộp bài                           | AGENTS.md / `[SPEC]`    |
| `strict: true`, không `any`, mọi input ngoài đi qua Zod                  | AGENTS.md               |

Muốn đổi một dòng `[SPEC]` thì **sửa spec trước**, rồi mới sửa code. Đổi quyết định `[QĐ]` thì
viết ADR vào `docs/adr/`.

Điều LEARN **không** có mà Duolingo có: chuỗi nhiệm vụ hằng ngày, tiền ảo, mạng/tim, bảng xếp
hạng. Dải chỉ số ở `AppShell` chỉ hiện số có thật từ `ProgressOverview`.

## 2. Token

Nguồn duy nhất: `packages/config/tailwind/theme.css` (Tailwind v4, không có `tailwind.config.js`).
Ba khối, theo thứ tự:

1. **`[SPEC]` §14.2** (ADR 015) — `white`, `black`, `mono-50…950`. Mọi màu có R = G = B. Đầu file
   đặt `--color-*: initial` nên bảng màu mặc định của Tailwind (blue, sky…) **không tồn tại**.
2. **Bổ sung**: bo góc `control/card/panel/pill`, `--text-2xs`, `--ease-out-quint`, `--font-*`.
3. **Ngữ nghĩa** (ADR 011) — `@theme inline` trỏ vào biến thô, giá trị đổi theo `data-theme`:

| Vai trò                      | Utility                                     | Dùng cho                                                    |
| ---------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Nền trang / thẻ              | `bg-app` · `bg-panel` · `bg-panel-2`        | nền body · thẻ · hover/hàng bảng                            |
| Nền phụ                      | `bg-muted` · `bg-track`                     | skeleton, chip xám · rãnh thanh tiến độ                     |
| Nút chính                    | `bg-primary` · `text-primary-fg` · `-hover` | ink-900 (sáng) / trắng ngà (tối)                            |
| Viền ô nhập                  | `border-line-input`                         | ≥ 3:1 với nền (WCAG 1.4.11)                                 |
| Xám nhạt (tên cũ `pastel-*`) | `bg-pastel-*` + `text-on-pastel-*`          | bìa khóa học — tên giữ từ ADR 013, giá trị là xám (ADR 015) |
| Viền                         | `border-line` · `border-line-strong`        | viền thường · viền nhấn, nét đứt                            |
| Chữ                          | `text-fg` · `text-fg-muted` · `-subtle`     | tiêu đề · thân bài · chữ phụ                                |
| Nhấn                         | `text-accent` · `bg-accent-soft`            | link, nhãn info · nền nhạt đi kèm                           |
| Phản hồi                     | `ok` / `bad` / `warn` (+ `-soft`/`-line`)   | đúng / sai / cảnh báo — luôn kèm icon                       |
| Biểu đồ                      | `bg-chart-1`                                | cột biểu đồ (đã qua validator dataviz)                      |
| Bóng                         | `shadow-card/raised/overlay/glow`           | thẻ · nổi tạm · menu · node đã xong                         |

**Đơn sắc (ADR 015):** nền `#FAFAFA`, viền `#E5E5E5`, thẻ không bóng. Token `ok/bad/warn/accent` giữ
tên nhưng là các mức xám: trạng thái phân biệt bằng **icon + chữ + độ đậm của viền**. Lỗi = viền
đen đậm, nhãn lỗi đảo màu (nền đen chữ trắng); đáp án đúng = viền liền đậm, lựa chọn sai = viền
đứt; nút phá huỷ = viền đen 2px (khác nút chính khối đặc); liên kết = màu chữ + gạch chân.

**Luật:** component dùng token ngữ nghĩa. Không gradient, không glow/blur, không mảng tối giữa
trang sáng, không màu có hue (build cũng không sinh ra được).

**Chữ (ADR 014).** Một họ sans duy nhất: **Hanken Grotesk** (tiêu đề + giao diện + bài đọc 17px),
**JetBrains Mono** cho code. **Không serif.** Tự host qua Fontsource (`@fontsource-variable/*`,
import ở `app/layout.tsx`) — không dùng `next/font/google`, vì bản đó tải font lúc dev/build và rơi
về font dự phòng khi không có mạng. Độ đậm 400/500/600. Bẫy còn giữ:

- **`calt` tắt** (`globals.css`): Plus Jakarta Sans (v3) từng đổi "2xx" thành "2×x".
- **`zero` tắt trong số đều** (`.tabular-nums`, `table`): tránh số 0 gạch chéo giữa câu tiếng Việt.
- Chữ hiển thị **không có `—`/`–`**, tối đa một `·` mỗi dòng (ADR 014).

Đổi font xong kiểm bằng máy:

```bash
npm run build -w apps/web
grep -o -- "--font-sans:[^;]*;" apps/web/.next/static/css/*.css   # phải có Hanken Grotesk Variable đứng đầu
```

Hai luật màu đã kiểm chứng, đừng phá:

- **Chữ trắng trên nền đen 18.9:1, chữ đen trên nền trắng 18.9:1** — nút chính đảo theo tông.
- **Màu không bao giờ là tín hiệu duy nhất.** Mọi trạng thái đúng/sai/cảnh báo có icon hoặc nhãn chữ.

Thêm token mới thì thêm luôn một ô màu vào `/dev/ui` (mục "Màu") để nó không thành token mồ côi.

## 2b. Chế độ tối (ADR 011)

- Ba lựa chọn Tự động / Sáng / Tối — `lib/theme.tsx` (`ThemeProvider`, `useTheme`) và
  `components/shared/theme-toggle.tsx` (`ThemeSegmented`, chỉ chữ, ở Cài đặt + menu tài khoản; không
  có công tắc trên thanh đầu). Lưu `localStorage` key `learn-theme`, mọi truy cập bọc try/catch.
- `THEME_SCRIPT` chạy nội tuyến trong `<head>` đặt `data-theme` trước lần vẽ đầu — đừng chuyển nó
  vào `useEffect`, sẽ nháy trắng với người dùng tông tối.
- **Ép tông cho cây con** vẫn làm được (`data-theme="dark"` lên phần tử), nhưng ADR 012 **không
  dùng** nó trong trang sáng — mảng tối lạc giữa trang là dấu hiệu "AI slop" đã bị loại.
- Logo đổi theo tông bằng CSS: thân `fill-fg`, mặt `fill-app` (ADR 015).
- `dark:` bám theo `data-theme`, không theo media query (`@custom-variant` ở `globals.css`).
- Mascot chỉ trắng và đen (ADR 015): thân đen mặt trắng ở tông sáng, đảo lại ở tông tối — `components/shared/mascot.tsx`.
- Soát: `node scripts/capture-ui.mjs --dark <route>`. `audit-a11y.mjs` chỉ quét tông sáng; phiên 21
  quét tông tối riêng bằng `@axe-core/playwright` + `colorScheme: 'dark'` (15 màn, 0 vi phạm
  serious/critical) — lặp lại khi đổi màu.

## 3. Thư viện đang dùng và lý do

| Gói                       | Dùng để làm gì              | Ghi chú                                      |
| ------------------------- | --------------------------- | -------------------------------------------- |
| `tailwindcss` v4          | Toàn bộ style               | CSS-first, `@theme`, không có file config JS |
| `motion`                  | Mọi chuyển động React       | Xem §4                                       |
| `@phosphor-icons/react`   | Ruột của `<Icon>` (ADR 013) | Không import thẳng ở call site — xem §5      |
| `clsx` + `tailwind-merge` | Hàm `cn()`                  | Xem §6                                       |
| `canvas-confetti`         | Pháo giấy khi qua bài tập   | Chỉ dùng qua `lib/celebrate.ts`              |
| `eslint-plugin-jsx-a11y`  | Bắt lỗi a11y tĩnh lúc lint  | Đã bật cho `apps/web/src/**/*.tsx`           |
| `@axe-core/playwright`    | Audit a11y trên màn thật    | `scripts/audit-a11y.mjs`, xem §0             |

**Cố ý chưa cài:** Radix/shadcn component. `apps/web/components.json` đã cấu hình sẵn CLI, nên khi
thật sự cần hành vi khó tự viết đúng (Dialog, Popover, Tooltip, Tabs — bẫy focus, `aria-*`, phím
Esc) thì chạy được ngay:

```bash
cd apps/web && npx shadcn@latest add dialog
```

Nhưng **phải sửa màu sau khi thêm**: component của shadcn dùng quy ước `bg-background` /
`text-foreground`, những lớp đó **không tồn tại** trong theme LEARN. Đổi sang token LEARN
(`bg-panel`, `text-fg`, `border-line`, `rounded-card` — xem §2) rồi mới dùng, nếu không sẽ có
hai ngôn ngữ thị giác trong cùng một app.

## 4. Chuyển động

Tất cả nằm ở `apps/web/src/lib/motion.tsx`.

- `MotionProvider` bọc gốc cây trong `app/layout.tsx`, đặt `reducedMotion="user"`. Mọi `motion.*`
  bên dưới **tự động** bỏ transform/scale khi hệ điều hành bật giảm chuyển động.
- `globals.css` có thêm khối `@media (prefers-reduced-motion: reduce)` rút mọi animation/transition
  thuần CSS về ~0ms — `MotionConfig` không với tới `animate-pulse` của Tailwind.
- Hiệu ứng **không** chạy qua `motion.*` (canvas, WebGL) phải tự hỏi `matchMedia` — xem
  `lib/celebrate.ts`.

Có sẵn: `Reveal`, `StaggerList` + `StaggerItem`, `RevealOnScroll`, `StaggerOnScroll`, `fadeUp`,
`popIn`, `staggerContainer()`, `EASE_OUT`, `DURATION`. `AppShell` bọc nội dung mỗi route trong
`<Reveal key={pathname}>` — chuyển trang mờ dần + nhích lên, không cần thêm ở từng trang.

`ProgressBar`/`ProgressRing` dùng **CSS transition** (`scaleX`, `stroke-dashoffset`), không phải
`motion` — cùng lý do với bẫy `whileInView` bên dưới: đổi giá trị sau mount qua `motion` có thể kẹt
ở tab nền.

Ba luật:

1. Chuyển động để **giải thích**, không để trang trí. Không trả lời được "nó nói cho người dùng
   điều gì" thì bỏ.
2. 150–400ms. Dài hơn là cản trở thao tác.
3. Danh sách dài phải giảm `stagger` để tổng thời gian dưới ~600ms.

**Bẫy đã dính một lần:** `motion` chiếm quyền thuộc tính `transform` của chính phần tử nó điều
khiển. Đặt `style={{ transform: 'translateX(...)' }}` lên một `motion.li` thì giá trị đó bị xoá
sạch khi animation vào chỗ — dáng zigzag của `lesson-path.tsx` biến mất đúng như vậy. Đặt offset
tĩnh lên một `<div>` **bên trong**.

**Bẫy nghiêm trọng hơn — `whileInView` có thể kẹt vĩnh viễn (2026-09-22).** `RevealOnScroll` và
`StaggerOnScroll` **cố ý không dùng `motion.div` + `animate`/`whileInView`**, khác mọi component
khác ở trên. Lý do đo được trực tiếp lúc dựng trang chủ: một animation kích hoạt **lúc mount**
(`Reveal`) luôn chạy đúng, nhưng animation cần **đổi state sau khi đã mount** rồi mới chạy — đúng
thứ `whileInView` cần — có thể kẹt tại trạng thái ban đầu **vô thời hạn** trong một số môi trường
thực tế (đã gặp: cửa sổ trình duyệt bị che khuất/tab nền — `IntersectionObserver` không bao giờ bắn
callback). Test trực tiếp: một `motion.div` khác trong app (`ProgressBar`, đổi giá trị qua state
sau một cú click) cũng kẹt y hệt, trong khi một `<div>` thường đổi `style.opacity` qua CSS
transition thì luôn chạy đúng. Vì vậy `RevealOnScroll`/`StaggerOnScroll` tự quản bằng
`IntersectionObserver` + CSS transition thuần (Tailwind), cộng lưới an toàn ép hiện sau 1 giây —
nội dung không bao giờ được phép kẹt vô hình. Trạng thái "ẩn" dùng `opacity-60`, không phải
`opacity-0`, để nếu paint có kẹt ở đâu đó thì ảnh chụp màn hình vẫn đọc được nội dung. Toàn bộ chi
tiết + cách đo nằm trong docblock ngay trên `RevealOnScroll` ở `lib/motion.tsx` — đọc trước khi
"sửa lại cho giống code cũ" hay thêm một component `*OnScroll` mới dùng `whileInView`.

## 4b. Hình khối: bóng nhẹ, không phải viền dày

Đổi 2026-09-19 (phiên 12). Trước đó primitive mượn ngôn ngữ nút bấm của Duolingo: `border-2` cộng
`border-b-4` tạo cạnh lún, chữ `uppercase tracking-wide`, `duration-75`. Ở một màn có nhiều thẻ,
những đường viền đó cộng lại thành lưới kẻ ô và mọi phần tử đòi sự chú ý ngang nhau.

Luật hiện tại — **bảng màu `[SPEC]` §14.2 không đổi một giá trị nào**, chỉ đổi cách dùng:

| Thứ           | Dùng                                             | Không dùng                     |
| ------------- | ------------------------------------------------ | ------------------------------ |
| Tách lớp      | `border border-line` + `shadow-card`             | `border-2`, `border-b-4`       |
| Nổi lên       | `shadow-raised` + `border-accent-line` khi hover | đổi độ dày viền, `translate-y` |
| Bo góc        | `rounded-control` (điều khiển), `rounded-card`   | `rounded-2xl` cho nút          |
| Thứ bậc chữ   | độ đậm + màu (`fg` / `fg-subtle`)                | chỉ tăng cỡ chữ                |
| Nhấn mạnh nút | độ tương phản của **nền**                        | `uppercase`, `font-bold`       |
| Chuyển động   | `transition-all duration-200`                    | `duration-75`                  |

Trọng lượng thị giác phải đến từ _màu nền_, không từ độ dày cạnh. Một màn đúng chuẩn chỉ có **một**
nút `primary` (khối đen ở tông sáng, trắng ngà ở tông tối); mọi thứ còn lại là `secondary` (nền panel, viền), `ghost`,
`link` (hành động bậc ba — chữ gạch chân, dùng cho "Xem hết", "Tất cả khóa học") hoặc `danger`.
Nhấn nút lún `scale(0.98)`. Thẻ mặc định **không bóng**, chỉ viền `line`; bóng chỉ khi nổi tạm
(menu) hoặc khi hover thẻ bấm được. Số liệu dùng `StatCard` trong `StatStrip`, không phải thẻ icon.
`Button loading` hiện spinner + khoá nút; nhãn vẫn phải nói đang làm gì ("Đang lưu…").

**Tương phản màu** vẫn theo §2; `audit-a11y.mjs` 18/18 màn 0 vi phạm sau ADR 015. (Trang portfolio
`components/portfolio/*` từng có phong cách riêng đã bị gỡ khỏi repo ở commit `167bd20`.)

Primitive mở rộng thêm: `Card interactive`, `CardDescription`, `LoadingState variant`
(`card`/`list`/`text` — skeleton phải khớp hình dạng nội dung sắp hiện, nếu không bố cục nhảy một
nhịp khi dữ liệu về), `EmptyState secondaryAction` + `EmptyState size="compact"` (mục con của một
màn đã có nội dung khác — xem §4c), `ErrorState detail` (chỗ đặt requestId để người dùng copy khi
báo lỗi), `InlineError` (lỗi của một _thao tác_ — mutation hỏng, không phải query; nội dung xung
quanh vẫn còn, khác `ErrorState` thay hẳn nội dung khi query hỏng), `Button variant="outline"`
(cho nền tối — hero portfolio), `RevealOnScroll`/`StaggerOnScroll` (như `Reveal`/`StaggerList`
nhưng đợi cuộn tới mới chạy — xem cảnh báo về `whileInView` ở §4).

## 4c. Năm trạng thái: dùng cái nào ở đâu

AGENTS.md bắt mọi màn có dữ liệu phải xử lý đủ **Loading · Empty · Error · Partial · Success**.
Bảng này để không phải đoán:

| Trạng thái | Màn của người học                  | Bảng quản trị                  |
| ---------- | ---------------------------------- | ------------------------------ |
| Loading    | `<LoadingState variant>`           | `<TableSkeleton columns rows>` |
| Empty      | `<EmptyState>` (có mascot)         | `<TableEmpty>` (không mascot)  |
| Error      | `<ErrorState>`                     | `<ErrorState>`                 |
| Partial    | `<PartialNotice>` bọc trên dữ liệu | `<PartialNotice>`              |

Ba luật:

1. **Khung chờ phải mang hình dạng thứ sắp hiện ra.** `<Skeleton className="h-48" />` là một tảng
   xám: nó không cho biết sắp có gì, và chiều cao thật gần như luôn khác nên trang giật một nhịp
   khi dữ liệu về. Dùng `variant` của `LoadingState` hoặc `TableSkeleton` với đúng số cột.
2. **Màn rỗng phải nói bước tiếp theo.** Và phải phân biệt _không có kết quả cho bộ lọc hiện tại_
   với _hệ thống chưa có gì_: trường hợp đầu lối ra là nút **Xoá bộ lọc** (`TableEmpty
onClearFilter`), trường hợp sau là nói khi nào dữ liệu sẽ xuất hiện. Gộp hai thứ vào một câu
   "Không có … nào khớp." là đẩy việc suy đoán sang người dùng.
3. **Partial là trạng thái có thật, không phải trường hợp hiếm.** Worker ghi
   `error.code = 'PARTIAL_FAILURES'` lên AIJob **SUCCEEDED** khi một phần outline không sinh được
   bài học. Màn nào đọc AIJob mà bỏ qua `error` sẽ báo "Hoàn tất" cho một kết quả thiếu — đúng lỗi
   đã tồn tại ở `AiJobProgress` tới tận 2026-09-19. Dùng `partialFailuresOf()` trong
   `lib/ai-job-partial.ts`.

`EmptyState` có mascot 88px — hợp với màn chính của người học, quá ồn cho bảng quản trị; ở đó
`TableEmpty` chỉ có một icon 20px. Đây là ranh giới `[SPEC]` §13.1 về vị trí mascot, không phải
sở thích.

**Mục con của một màn đã có nội dung** là trường hợp thứ ba, không nằm gọn trong bảng trên.
`dashboard.tsx` là trang có 4 thẻ số liệu + "Tiếp tục học" + "Hoạt động gần đây" — nếu mục
"Hoạt động gần đây" trống mà vẫn hiện `EmptyState` centered với mascot 88px, khối đó sẽ nặng hơn
chính trang chứa nó. Nhưng đây vẫn là màn người học, nên đưa thẳng về `TableEmpty` (icon, dành cho
bảng quản trị) là sai ngữ cảnh không kém.

Luật: **`EmptyState size="compact"`** — cùng component, cùng mascot (không đổi sang icon quản
trị), chỉ hạ xuống một hàng ngang 48px thay vì một khối centered 88px. Dùng khi `EmptyState` nằm
_bên trong_ một trang đã có nội dung khác phía trên nó (`dashboard.tsx`, `progress.tsx`); dùng
`size` mặc định khi `EmptyState` _là_ toàn bộ nội dung của màn.

## 4d. Lộ trình bài học (`features/learning/lesson-list.tsx`)

ADR 012 thay đồ thị hình sin (`lesson-path.tsx`, đã xoá) bằng **stepper dọc**. Lý do đo được: đồ
thị tốn 118px/bài (khóa 10 bài ≈ 1.2k px), tiêu đề bị kẹp 2 dòng trong nửa bề ngang, và nút sắp
xếp chỉ hiện khi rê chuột — trên cảm ứng coi như không có.

- Mỗi bài một hàng ~64px: mốc (glyph CheckCircle đặc = đã xong · số thứ tự viền đậm = đang học · số thứ tự viền xám = chưa học),
  tiêu đề đủ chỗ, trạng thái bằng chữ + điểm cao nhất.
- **Đường nối vẫn mang thông tin**: nét liền màu chữ khi bài phía trên đã xong, nét đứt `line-strong`
  khi chưa — đọc được cả khi không nhìn màu (UI-GUIDE §2).
- Cả hàng bấm được (link với `after:absolute after:inset-0`); nút lên/xuống `relative z-10` nằm trên
  vùng bấm đó và **luôn hiện**, đủ tương phản 3:1 (không làm mờ bằng `opacity`).
- Bài đang học có nền `accent-soft`.

### Bẫy: `npm run build` làm hỏng dev server đang chạy

`next build` và `next dev` dùng chung `apps/web/.next`. Chạy `npm run build` trong lúc
`npm run dev:web` đang chạy thì dev server mất chunk và mọi route trả 500
(`Cannot find module './901.js'`). Không phải lỗi code. Cách xử lý:

```bash
# dừng dev server trước, rồi:
rm -rf apps/web/.next && npm run dev:web
```

## 5. Icon

`components/ui/icon.tsx` là mặt tiền, ruột là **Phosphor** (ADR 013; trước đó Lucide).

```tsx
<Icon name="check" size={18} />
```

- Import từ `@phosphor-icons/react/ssr` (chạy được trong server component); kiểu `Icon` lấy từ
  `@phosphor-icons/react/lib`. `next.config.ts` bật `optimizePackageImports` cho gói này.
- Trọng lượng: mặc định **Bold**; `strokeWidth < 2` → Regular (tab chưa chọn); `filled` → Fill.
- Đừng import Phosphor ở call site. Đi qua `<Icon>` để: `IconName` là union hẹp, `aria-hidden` +
  `focusable="false"` áp một chỗ, đổi bộ icon chỉ sửa một file. Icon **luôn là trang trí**.

Cần hình mới: thêm một dòng vào `ICONS` — `/dev/ui` tự liệt kê qua `ICON_NAMES`.

## 6. `cn()`

`components/ui/cn.ts` = `clsx` + `tailwind-merge` (đã khai báo thêm nhóm `rounded-card/pill` và
`shadow-card/raised` vì chúng không nằm trong thang mặc định của Tailwind).

Nghĩa là `className` truyền từ ngoài vào **ghi đè được** lớp mặc định của primitive. Trước đây hàm
này chỉ `join(' ')` nên `<Button className="bg-white">` vẫn ra nền của biến thể mặc định.

## 7. Mascot

`components/mascot.tsx` là wrapper có kiểu chặt quanh mã vendor Blob Studio
(`components/mascot/CircleAvatar.tsx`).

- **Không sửa tay file vendor.** Muốn đổi thì export lại từ Blob Studio rồi dán lại nguyên khối
  header `@ts-nocheck` (phải đứng **trên** `'use client'`). Xem `docs/adr/006-...`.
- `MascotState` cố tình hẹp hơn 40 state của thư viện — chỉ những state ứng với vị trí `[SPEC]`
  cho phép mới có mặt.
- Mascot **chỉ trắng và đen** (ADR 015), phẳng: 3 điểm dừng `gradient` cùng một màu, `effects={false}`
  (hiệu ứng vendor chạy qua nhiều hue). Không sửa file vendor — truyền qua props của wrapper.
- Component tự tôn trọng `prefers-reduced-motion`.

## 7b. Logo

`components/logo-mark.tsx` là **nguồn duy nhất** của dấu hiệu thương hiệu, dùng ở sidebar, header
mobile, màn đăng nhập và nav trang landing. Logo chính là nhân vật Circle.

```tsx
<LogoMark size={28} />              {/* nền sáng */}
<LogoMark size={64} />                {/* tự đổi theo tông, `tone` không còn tác dụng */}
```

- Đây là **SVG tĩnh viết tay**, không phải `<Mascot>`. Lý do đầy đủ ở
  `docs/adr/007-logo-la-nhan-vat-circle.md`: favicon không chạy JavaScript, logo phải có ở lần vẽ
  đầu tiên, và một nhân vật chớp mắt trong sidebar trên mọi màn thì kéo mắt khỏi nội dung.
- **`app/icon.svg` (favicon) phải đồng bộ tay** — nó là file tĩnh nên không dùng lại được component.
  Đổi hình thì đổi cả hai chỗ.
- 16px là cỡ nhỏ nhất bắt buộc còn đọc được; `/dev/ui` mục "Logo" hiện cả hai tông ở 5 cỡ để soát.
- Logo ≠ mascot. `<Mascot>` vẫn chỉ ở đúng bốn vị trí `[SPEC]` §13.1.

## 8. Bố cục — số liệu đã đo, đừng đoán lại

- `AppShell` (ADR 012): **thanh điều hướng trên cùng** 56px (logo · Tổng quan · Khóa học · Tiến trình ·
  Quản trị · nút "Khóa học mới" · menu tài khoản), cùng `max-w-6xl` (admin `max-w-7xl`) với nội
  dung nên mép trái logo thẳng hàng mép trái tiêu đề trang. Mục đang chọn: gạch chân màu chữ 2px.
- "Cài đặt", gói/hạn mức và chọn giao diện nằm trong **menu tài khoản** (desktop). Không có chip số
  liệu trên thanh đầu — số liệu ở trang Tổng quan, mỗi số một lần.
- Dưới `md`: thanh tab đáy (`min-h-14`, nhãn 12px, chừa `env(safe-area-inset-bottom)`). Thanh hành
  động dính đáy trong trang dùng `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]` dưới `lg`.
- Trang không nên tự `mx-auto max-w-*` nhỏ hơn container (lệch mép trái so với header) — trừ màn
  tập trung đọc/làm bài (bài học, bài tập).
- **Lưới 2 cột cấp trang phải có `grid-cols-1`** ở mobile, nếu không trang tràn ngang (đã dính ở
  `/dashboard`). Kiểm: ảnh `capture-ui.mjs --width 390` phải rộng đúng 780px (2×).

## 10. Luật UX đã áp dụng (và nguồn)

Những điều dưới đây không phải sở thích — mỗi cái đến từ một nguồn bên ngoài và đã được sửa trong
code. Đừng vô tình đảo ngược chúng.

| Luật                                                                                      | Nguồn                                                     |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Người dùng phải luôn biết **đang ở đâu** (banner bài học ghi "Bài 1/3")                   | NN/g H1 — Visibility of System Status                     |
| Không đổ **enum thô của API** ra màn hình (`ACTIVE`, `/month`) — phải dịch                | NN/g H2 — Match Between System and the Real World         |
| Màn nào cũng phải có **đường đi tiếp** (bài trước/bài sau, nút "Tiếp tục học")            | NN/g H3 — User Control and Freedom                        |
| Hành động **phá huỷ không đứng cạnh** hành động lành tính, và khác màu                    | NN/g — Consequential Options Close to Benign Options      |
| Báo lỗi form phải **chỉ đúng chỗ sai** và đưa người dùng tới đó (cuộn + focus + đánh dấu) | NN/g — 10 Design Guidelines for Reporting Errors in Forms |
| Ô mật khẩu luôn có **nút hiện/ẩn**                                                        | NN/g — Stop Password Masking                              |
| Mốc thời gian gần dùng **thời gian tương đối**, mốc chính xác để ở `title`                | NN/g H2                                                   |
| Mọi chữ đạt **tương phản ≥ 4.5:1**                                                        | WCAG 2.2 AA — 1.4.3 Contrast (Minimum)                    |
| Liên kết nội dòng **không chỉ phân biệt bằng màu** (luôn gạch chân)                       | WCAG 2.2 AA — 1.4.1 Use of Color                          |
| Vùng bấm **≥ 24×24px**                                                                    | WCAG 2.2 AA — 2.5.8 Target Size (Minimum)                 |
| Phần tử được focus **không bị thanh dính che** (`scroll-mt-*` / `scroll-mb-*`)            | WCAG 2.2 AA — 2.4.11 Focus Not Obscured                   |
| Có link **“Bỏ qua tới nội dung chính”** đầu tab order (`AppShell`, đích `#main`)          | WCAG 2.2 A — 2.4.1 Bypass Blocks                          |
| **Icon mang nghĩa ≥ 3:1** với nền — dải chỉ số dùng bậc -700, không phải -500             | WCAG 2.2 AA — 1.4.11 Non-text Contrast                    |
| Hai `nav` cùng trong DOM thì **tên khác nhau** (sidebar vs thanh tab đáy)                 | WCAG 2.2 A — 1.3.1 Info and Relationships                 |
| Nhãn điều hướng **≥ 12px**, không viết hoa toàn bộ                                        | UX-UI-PRINCIPLES §4                                       |
| Thanh tab đáy chừa `env(safe-area-inset-bottom)`                                          | UX-UI-PRINCIPLES §11                                      |
| **Enum của API luôn đi qua bảng dịch**, kể cả nhánh fallback (`humanizeCode`)             | NN/g H2 — Match Between System and the Real World         |
| Nút `disabled` phải có **lý do nhìn thấy được** cạnh nó, không phải `title`               | UX-UI-PRINCIPLES §7                                       |
| Lỗi form đánh dấu **đúng ô** và đưa focus tới ô đó (`lib/form-errors.ts`)                 | NN/g — Reporting Errors in Forms                          |
| Bộ lọc / ô tìm kiếm sống trong **URL**, không trong `useState` (`lib/url-state.ts`)       | UX-UI-PRINCIPLES §12                                      |
| Ô tìm kiếm **debounce 300ms** trước khi gọi API                                           | UX-UI-PRINCIPLES §14                                      |

**Bậc màu nào dùng cho chữ:**

- Chữ dùng token `fg` / `fg-muted` / `fg-subtle` / `accent` / `ok` / `bad` / `warn` — tất cả đã đo
  ≥ 4.5:1 trên `panel`, `app` và `muted` ở **cả hai tông** (số đo ghi trong `theme.css`).
- Trong cây con tông tối (sidebar, banner) dùng chính các token đó — chúng tự thành chữ sáng. Chữ
  trắng mờ trên banner aurora: `text-white/75` trở lên.
- Đơn sắc (ADR 015): không bậc màu nào có hue; chữ dùng `fg` / `fg-muted` / `fg-subtle`.

## 11. Cố ý KHÔNG làm

- **Phím tắt chọn đáp án (1/2/3/4) kiểu Duolingo.** Duolingo mỗi màn một câu hỏi nên phím số không
  mơ hồ. LEARN hiện mọi câu trên cùng một trang, nên "phím 2" không biết thuộc câu nào. Nhóm radio
  gốc đã đi được bằng Tab + phím mũi tên; thêm phím tắt chỉ tạo thêm nhập nhằng.
- **Vô hiệu hoá nút Nộp bài khi chưa trả lời hết.** Nút xám không nói được _vì sao_ nó xám. Giữ nút
  bấm được rồi chỉ thẳng vào câu còn thiếu thì người dùng biết phải làm gì.
- **Ẩn shell (sidebar/rail) khi đang làm bài tập.** Có lý do để làm — bớt nhiễu lúc tập trung — nhưng
  nó đổi cả kiến trúc điều hướng, cần chốt với chủ sản phẩm trước chứ không phải quyết định của một
  phiên dọn giao diện.

## 9. Checklist trước khi đóng một thay đổi giao diện

- [ ] `npm run typecheck -w apps/web` xanh
- [ ] `npx eslint apps/web/src` xanh (gồm cả luật jsx-a11y)
- [ ] `npm run build -w apps/web` xanh
- [ ] Xem lại ở `/dev/ui`; primitive mới đã được thêm vào trang đó
- [ ] Thử ở `--width 390` — không vỡ bố cục, không cuộn ngang (ảnh rộng đúng 780px)
- [ ] Thử `--dark` — chỉ dùng token ngữ nghĩa, không `bg-white`/`text-ink-*` ở call site
- [ ] Thử `--reduced-motion` — không còn dịch chuyển, chỉ còn mờ dần
- [ ] Trạng thái mới có icon/nhãn chữ, không chỉ dựa vào màu
- [ ] Màn có dữ liệu vẫn đủ 5 trạng thái
- [ ] Không đụng khối `[SPEC]` trong `theme.css`
- [ ] `node scripts/audit-a11y.mjs` sạch (nếu chạm tới màu / form / heading)
- [ ] Enum của API được dịch, không lọt ra màn hình dạng thô
