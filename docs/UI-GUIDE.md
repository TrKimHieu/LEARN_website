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
serious/critical. Đây là thứ `eslint-plugin-jsx-a11y` **không** làm được: lint chỉ đọc JSX, còn
tương phản màu chỉ tính ra được sau khi trình duyệt đã render.

## 1. Ranh giới không được vượt

| Ràng buộc                                                                | Nguồn                   |
| ------------------------------------------------------------------------ | ----------------------- |
| Bảng màu navy/xám/sky `#5EC8F5`, **không có tím**                        | spec §14.2 `[SPEC]`     |
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

Nguồn duy nhất: `packages/config/tailwind/theme.css` (Tailwind v4, khai báo bằng `@theme`, không
có `tailwind.config.js`).

- Khối đầu file là `[SPEC]` §14.2 — **không đổi giá trị nào**. Từ ADR 008, khối này chỉ còn
  **màu**: hai biến `--font-*` đã chuyển xuống khối dưới, vì spec §14.2 ràng buộc màu và nói
  "monospace cho code", chứ chưa bao giờ chỉ định font sans nào.
- Khối sau là phần bổ sung (ADR 008): sắc độ sky 50–700, navy-500, surface-300/400, bộ màu
  phản hồi success/danger/warning, `--radius-card`, `--radius-pill`, `--shadow-card`,
  `--shadow-raised`, và `--font-sans` / `--font-mono`. Phần này mở rộng được.

**Chữ (ADR 008).** Sans là **Be Vietnam Pro**, mono là **JetBrains Mono**, nạp bằng `next/font`
ở `app/layout.tsx`. Hai điều dễ dính:

- **Chỉ 4 bậc sans được nạp: 400/500/600/700.** Be Vietnam Pro là họ tĩnh, mỗi bậc × mỗi subset là
  một file woff2. Dùng `font-extrabold` (800) thì trình duyệt bôi đậm giả và chữ nhoè — nó đã bị gỡ
  khỏi toàn bộ codebase, đừng đưa lại. Cần nhấn mạnh hơn `font-bold` thì đổi **màu**, không đổi
  weight.
- **`@theme` thường, không phải `@theme inline`.** `@theme inline` ngừng phát `--font-sans` ra
  `:root` và làm hỏng âm thầm `body { font-family: var(--font-sans) }`. Lý do đầy đủ ở ADR 008.

Đổi font xong thì kiểm bằng máy, đừng tin mắt:

```bash
npm run build -w apps/web
grep -o -- "--font-sans:[^;]*;" apps/web/.next/static/css/*.css   # phải có var(--font-be-vietnam-pro) đứng đầu
```

Hai luật màu đã kiểm chứng, đừng phá:

- **Chữ trắng trên `sky-500` chỉ đạt 1.90:1 — trượt AA.** Nút primary vì thế là nền sky + chữ
  `navy-900` (9.86:1). Không tạo biến thể chữ trắng trên sky.
- **Màu không bao giờ là tín hiệu duy nhất.** Mọi trạng thái đúng/sai/cảnh báo phải có icon
  hoặc nhãn chữ đi kèm (`<Badge icon="check">`).

Thêm token mới thì thêm luôn một ô màu vào `/dev/ui` để nó không thành token mồ côi.

## 3. Thư viện đang dùng và lý do

| Gói                       | Dùng để làm gì             | Ghi chú                                      |
| ------------------------- | -------------------------- | -------------------------------------------- |
| `tailwindcss` v4          | Toàn bộ style              | CSS-first, `@theme`, không có file config JS |
| `motion`                  | Mọi chuyển động React      | Xem §4                                       |
| `lucide-react`            | Ruột của `<Icon>`          | Không import thẳng ở call site — xem §5      |
| `clsx` + `tailwind-merge` | Hàm `cn()`                 | Xem §6                                       |
| `canvas-confetti`         | Pháo giấy khi qua bài tập  | Chỉ dùng qua `lib/celebrate.ts`              |
| `eslint-plugin-jsx-a11y`  | Bắt lỗi a11y tĩnh lúc lint | Đã bật cho `apps/web/src/**/*.tsx`           |
| `@axe-core/playwright`    | Audit a11y trên màn thật   | `scripts/audit-a11y.mjs`, xem §0             |

**Cố ý chưa cài:** Radix/shadcn component. `apps/web/components.json` đã cấu hình sẵn CLI, nên khi
thật sự cần hành vi khó tự viết đúng (Dialog, Popover, Tooltip, Tabs — bẫy focus, `aria-*`, phím
Esc) thì chạy được ngay:

```bash
cd apps/web && npx shadcn@latest add dialog
```

Nhưng **phải sửa màu sau khi thêm**: component của shadcn dùng quy ước `bg-background` /
`text-foreground`, những lớp đó **không tồn tại** trong theme LEARN. Đổi sang token LEARN
(`bg-white`, `text-ink-900`, `border-surface-300`, `rounded-card`) rồi mới dùng, nếu không sẽ có
hai ngôn ngữ thị giác trong cùng một app.

## 4. Chuyển động

Tất cả nằm ở `apps/web/src/lib/motion.tsx`.

- `MotionProvider` bọc gốc cây trong `app/layout.tsx`, đặt `reducedMotion="user"`. Mọi `motion.*`
  bên dưới **tự động** bỏ transform/scale khi hệ điều hành bật giảm chuyển động.
- `globals.css` có thêm khối `@media (prefers-reduced-motion: reduce)` rút mọi animation/transition
  thuần CSS về ~0ms — `MotionConfig` không với tới `animate-pulse` của Tailwind.
- Hiệu ứng **không** chạy qua `motion.*` (canvas, WebGL) phải tự hỏi `matchMedia` — xem
  `lib/celebrate.ts`.

Có sẵn: `Reveal`, `StaggerList` + `StaggerItem`, `fadeUp`, `popIn`, `staggerContainer()`,
`EASE_OUT`, `DURATION`.

Ba luật:

1. Chuyển động để **giải thích**, không để trang trí. Không trả lời được "nó nói cho người dùng
   điều gì" thì bỏ.
2. 150–400ms. Dài hơn là cản trở thao tác.
3. Danh sách dài phải giảm `stagger` để tổng thời gian dưới ~600ms.

**Bẫy đã dính một lần:** `motion` chiếm quyền thuộc tính `transform` của chính phần tử nó điều
khiển. Đặt `style={{ transform: 'translateX(...)' }}` lên một `motion.li` thì giá trị đó bị xoá
sạch khi animation vào chỗ — dáng zigzag của `lesson-path.tsx` biến mất đúng như vậy. Đặt offset
tĩnh lên một `<div>` **bên trong**.

## 4b. Hình khối: bóng nhẹ, không phải viền dày

Đổi 2026-09-19 (phiên 12). Trước đó primitive mượn ngôn ngữ nút bấm của Duolingo: `border-2` cộng
`border-b-4` tạo cạnh lún, chữ `uppercase tracking-wide`, `duration-75`. Ở một màn có nhiều thẻ,
những đường viền đó cộng lại thành lưới kẻ ô và mọi phần tử đòi sự chú ý ngang nhau.

Luật hiện tại — **bảng màu `[SPEC]` §14.2 không đổi một giá trị nào**, chỉ đổi cách dùng:

| Thứ           | Dùng                                             | Không dùng                     |
| ------------- | ------------------------------------------------ | ------------------------------ |
| Tách lớp      | `border` 1px + `shadow-card`                     | `border-2`, `border-b-4`       |
| Nổi lên       | `shadow-raised` khi hover (`<Card interactive>`) | đổi độ dày viền, `translate-y` |
| Bo góc        | `rounded-lg` (điều khiển), `rounded-card` (thẻ)  | `rounded-2xl` cho nút          |
| Thứ bậc chữ   | độ đậm + màu (`ink-900` / `ink-500`)             | chỉ tăng cỡ chữ                |
| Nhấn mạnh nút | độ tương phản của **nền**                        | `uppercase`, `font-bold`       |
| Chuyển động   | `transition-all duration-200`                    | `duration-75`                  |

Trọng lượng thị giác phải đến từ _màu nền_, không từ độ dày cạnh. Một màn đúng chuẩn chỉ có **một**
nút `primary` nền sky; mọi thứ còn lại là `secondary` (trắng, viền mảnh) hoặc `ghost`.

Hai thứ **không** đổi theo:

- **Trang portfolio** (`components/portfolio/*`) giữ phong cách editorial riêng — eyebrow
  `font-mono uppercase tracking-[0.14em]`, hero nền navy. Đó là trang tiếp thị, không phải app.
- **Tương phản màu** vẫn theo §2: nút primary là nền sky + chữ `navy-900`, không có biến thể chữ
  trắng trên sky. Đã chạy lại `scripts/audit-a11y.mjs` sau khi đổi — 18/18 màn, 0 vi phạm.

Primitive mở rộng thêm: `Card interactive`, `CardDescription`, `LoadingState variant`
(`card`/`list`/`text` — skeleton phải khớp hình dạng nội dung sắp hiện, nếu không bố cục nhảy một
nhịp khi dữ liệu về), `EmptyState secondaryAction`, `ErrorState detail` (chỗ đặt requestId để người
dùng copy khi báo lỗi).

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
*bên trong* một trang đã có nội dung khác phía trên nó (`dashboard.tsx`, `progress.tsx`); dùng
`size` mặc định khi `EmptyState` *là* toàn bộ nội dung của màn.

## 4d. Lộ trình bài học (`components/lesson-path.tsx`)

Lộ trình là một **đồ thị hình sin**: `x = 50 − A·cos(πu)` với `u` là vị trí bài học. `cos(πu)`
bằng ±1 tại mọi số nguyên, nên **mỗi bài học rơi đúng vào một điểm cực trị** — không bài nào nằm
ở chỗ đường đang dốc nhất.

Đường được vẽ bằng cách **lấy mẫu chính hàm số** (24 điểm mỗi nửa chu kỳ) chứ không xấp xỉ bằng
Bézier, nên nó đúng là hình sin.

### Số node mỗi chu kỳ quyết định độ dốc

Đây là chỗ đã sai hai lần. Độ dốc cực đại của đồ thị (góc so với phương thẳng đứng) bằng
`atan( A_px · 2π / N / ROW )` với `N` là số node mỗi chu kỳ. Ở khung 448px:

| N (node/chu kỳ) | Biên độ | Khoảng cách dọc | Dốc tối đa | Kết quả                                       |
| --------------- | ------- | --------------- | ---------- | --------------------------------------------- |
| 4               | 26%     | 132px           | —          | ✗ node xen kẽ giữa trục và đỉnh, không ra sin |
| 2               | 16%     | 178px           | **51.8°**  | ✗ mọi node ở ±1, nhưng dốc nhất có thể        |
| **8**           | **22%** | **118px**       | **33.3°**  | ✓ thoải, đúng cảm giác của bản tham chiếu     |

Điểm mấu chốt: **đặt mọi node đúng ở ±1 là cách xếp dốc nhất có thể**, vì cả biên độ ngang phải
đi hết trong đúng một bước dọc. Muốn thoải thì phải lấy mẫu dày hơn một nửa chu kỳ.

`N = 8` lấy theo Duolingo. Đo trên ảnh chụp giao diện của họ: các node nằm ở
x ≈ 850, 906, 937, 906, 850, 794 quanh tâm 850 — đúng các mốc `sin` tại 0, ±0.707, ±1, tức 8 mốc
một chu kỳ. Node thứ 2 và thứ 6 mỗi chu kỳ vẫn rơi đúng đỉnh/đáy.

Chỉnh biên độ hay khoảng cách dọc thì **tính lại góc dốc**; vượt quá ~40° là bắt đầu đọc ra
đường gấp khúc thay vì sóng.

### Nét đứt là kênh tín hiệu thứ hai, không phải trang trí

| Đoạn      | Nét  | Màu           |
| --------- | ---- | ------------- |
| Đã đi qua | liền | `sky-500`     |
| Chưa đi   | đứt  | `surface-400` |

Bản trước phân biệt hai trạng thái **chỉ bằng màu**, đúng thứ §2 cấm. Nét đứt đọc được cả khi in
đen trắng và với người loạn sắc, đồng thời đúng nghĩa thông thường của nó: phần chưa thành hình.

Nét mảnh (2.5px, không phải 10px) vì đây là **đồ thị**, không phải con đường — nét dày biến biểu
đồ thành dải băng và át mất node, vốn mới là thứ người dùng bấm vào.

Mỗi đoạn là một `<path>` riêng, tô theo `progressStatus` của bài phía **trên**. Không dùng
`stroke-dasharray` để cắt một đường liền: tiến độ có thể đứt quãng (xong bài 1, bỏ bài 2, xong
bài 3).

### Toạ độ và bố cục

- **`x` theo `%`, `y` theo `px`.** SVG dùng `viewBox="0 0 100 H"` + `preserveAspectRatio="none"`,
  nên biên độ tự hẹp lại trên màn nhỏ mà không cần đo bằng JS. Nét vẽ phải có
  `vector-effect="non-scaling-stroke"`, nếu không cả độ dày lẫn khoảng nét đứt bị kéo méo theo
  trục x.
- **Nhãn nằm bên cạnh node, không nằm dưới.** Đạo hàm của cos bằng 0 tại đỉnh nên đường rời node
  theo phương thẳng đứng — đúng chỗ dòng tiêu đề bắt đầu.
- **Nhãn neo vào mép khung** (`left: 0` / `right: 0`), không neo vào node với bề rộng cố định:
  trên màn 390px mỗi bên chỉ còn ~90px, neo vào node thì bị cắt chữ.
- Phép canh tâm node (`translate(-50%, -50%)`) phải ở `<li>` thường, **không** ở phần tử
  `motion` — cùng cái bẫy `transform` đã ghi ở §4.

### Bẫy: `npm run build` làm hỏng dev server đang chạy

`next build` và `next dev` dùng chung `apps/web/.next`. Chạy `npm run build` trong lúc
`npm run dev:web` đang chạy thì dev server mất chunk và mọi route trả 500
(`Cannot find module './901.js'`). Không phải lỗi code. Cách xử lý:

```bash
# dừng dev server trước, rồi:
rm -rf apps/web/.next && npm run dev:web
```

## 5. Icon

`components/ui/icon.tsx` là mặt tiền, ruột là `lucide-react`.

```tsx
<Icon name="check" size={18} />
```

Đừng `import { Check } from 'lucide-react'` ở call site. Đi qua `<Icon>` để: `IconName` là union
hẹp (gõ sai hỏng typecheck ngay), `aria-hidden` + `focusable="false"` áp ở một chỗ, và lần sau đổi
bộ icon chỉ phải sửa một file. Icon ở đây **luôn là trang trí** — ý nghĩa nằm ở nhãn chữ hoặc
`aria-label` phía gọi.

Cần hình mới: thêm một dòng vào `ICONS`, thêm tên vào mảng `ICON_NAMES` của `/dev/ui`.

## 6. `cn()`

`components/ui/cn.ts` = `clsx` + `tailwind-merge` (đã khai báo thêm nhóm `rounded-card/pill` và
`shadow-card/raised` vì chúng không nằm trong thang mặc định của Tailwind).

Nghĩa là `className` truyền từ ngoài vào **ghi đè được** lớp mặc định của primitive. Trước đây hàm
này chỉ `join(' ')` nên `<Button className="bg-white">` vẫn ra nền sky.

## 7. Mascot

`components/mascot.tsx` là wrapper có kiểu chặt quanh mã vendor Blob Studio
(`components/mascot/CircleAvatar.tsx`).

- **Không sửa tay file vendor.** Muốn đổi thì export lại từ Blob Studio rồi dán lại nguyên khối
  header `@ts-nocheck` (phải đứng **trên** `'use client'`). Xem `docs/adr/006-...`.
- `MascotState` cố tình hẹp hơn 40 state của thư viện — chỉ những state ứng với vị trí `[SPEC]`
  cho phép mới có mặt.
- Thân mascot lấy gradient `sky-400 → navy-700 → navy-900` truyền từ wrapper. Bản export gốc là
  đen tuyền (`DEFAULT_GRADIENT`), trên thẻ trắng thành một đốm đen lạc khỏi bảng màu.
- Component tự tôn trọng `prefers-reduced-motion`.

## 7b. Logo

`components/logo-mark.tsx` là **nguồn duy nhất** của dấu hiệu thương hiệu, dùng ở sidebar, header
mobile, màn đăng nhập và nav trang landing. Logo chính là nhân vật Circle.

```tsx
<LogoMark size={28} />              {/* nền sáng */}
<LogoMark size={64} tone="dark" />  {/* nền navy */}
```

- Đây là **SVG tĩnh viết tay**, không phải `<Mascot>`. Lý do đầy đủ ở
  `docs/adr/007-logo-la-nhan-vat-circle.md`: favicon không chạy JavaScript, logo phải có ở lần vẽ
  đầu tiên, và một nhân vật chớp mắt trong sidebar trên mọi màn thì kéo mắt khỏi nội dung.
- **`app/icon.svg` (favicon) phải đồng bộ tay** — nó là file tĩnh nên không dùng lại được component.
  Đổi hình thì đổi cả hai chỗ.
- 16px là cỡ nhỏ nhất bắt buộc còn đọc được; `/dev/ui` mục "Logo" hiện cả hai tông ở 5 cỡ để soát.
- Logo ≠ mascot. `<Mascot>` vẫn chỉ ở đúng bốn vị trí `[SPEC]` §13.1.

## 8. Bố cục — số liệu đã đo, đừng đoán lại

- `AppShell` 3 cột: sidebar trái 256px · nội dung · rail phải 320px (ẩn dưới `lg`).
- Cột giữa chỉ còn **~736px** khi có rail. Lưới thẻ vì thế chỉ trải 3–4 cột từ `2xl`; đặt ở `xl`
  làm nhãn và tiêu đề bị cắt cụt.
- Màn `/admin` ẩn hẳn rail (rail nói về gói của chính người xem, vô nghĩa ở khu quản trị) và nới
  lên `max-w-7xl` cho bảng nhiều cột.
- Dưới `md`, điều hướng chuyển xuống thanh tab đáy.

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

- `sky-700` là bậc sky **duy nhất** được dùng cho chữ. `sky-500`/`sky-600` chỉ dùng cho nền và đồ hoạ.
- `ink-300` là màu **viền và chữ trên nền tối**. Trên nền trắng nó chỉ đạt 2.56:1 — không bao giờ
  dùng cho chữ nội dung. Chữ mờ trên nền sáng thì dùng `ink-500`.
- `ink-500` đạt AA trên trắng và `surface-100`, nhưng **trượt trên nền có pha màu** (4.49:1 trên thẻ
  gói nổi bật). Nền có pha màu thì dùng `ink-700`.
- Chữ trắng trên `sky-500` chỉ đạt 1.90:1 — không có biến thể đó.

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
- [ ] Thử ở `--width 390` — không vỡ bố cục, không cuộn ngang
- [ ] Thử `--reduced-motion` — không còn dịch chuyển, chỉ còn mờ dần
- [ ] Trạng thái mới có icon/nhãn chữ, không chỉ dựa vào màu
- [ ] Màn có dữ liệu vẫn đủ 5 trạng thái
- [ ] Không đụng khối `[SPEC]` trong `theme.css`
- [ ] `node scripts/audit-a11y.mjs` sạch (nếu chạm tới màu / form / heading)
- [ ] Enum của API được dịch, không lọt ra màn hình dạng thô
