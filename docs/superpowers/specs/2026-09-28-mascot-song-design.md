# Mascot sống: cảnh và nhịp

- **Ngày:** 2026-09-28
- **Trạng thái:** Chờ người dùng duyệt spec
- **Liên quan:** HANDBOOK §13, ADR 006 (mascot động Blob Studio), ADR 015 (đơn sắc trắng đen),
  `docs/UI-GUIDE.md` §7, NFR-UX-01/02

## 1. Mục tiêu

Mascot Circle có sẵn 40 state, 25 biểu cảm, hướng nhìn (`gaze`), quay đầu (`turn`), lệnh
`blink/spin/setExpression`, chuỗi biểu cảm (`sequence`), vi chuyển động mắt (`life`) và chuyển
động khi vào state (`enter`). App hiện dùng khoảng 7 state ở 5 chỗ, mỗi chỗ gắn cứng một state lúc
render, không dùng gaze, lệnh hay chuỗi nào. Ngoài màn kết quả luyện tập, mascot không phản ứng với
việc người dùng làm.

Mục tiêu: mascot cư xử như một sinh vật sống **ở những khoảnh khắc chính** của người học — phản
ứng với sự kiện, và vẫn "sống" (nhìn, chớp mắt, buồn ngủ, giật mình) khi không có gì xảy ra.

**Phạm vi đã chốt với người dùng:** khoảnh khắc chính. Không có mascot thường trực đi theo khắp app.
§13.1 chỉ nới hẹp thêm hai vị trí; rủi ro R12 giữ nguyên.

**Không làm được và đã bỏ:** phản ứng đúng/sai ngay khi chọn đáp án. Bài luyện tập nộp cả bài một
lần và AGENTS.md cấm đáp án đúng rời server trước khi nộp. Mascot chỉ phản ứng với *việc* trả lời,
không với đúng sai, cho tới khi có kết quả.

## 2. Khoảnh khắc theo luồng

Ký hiệu: `a 400 → b` nghĩa là diễn state `a` trong 400ms rồi sang `b`. "Nền" là state mascot quay
về và giữ khi không có gì chạy.

### 2.1 Tạo khóa học, AI Job chạy — `AiJobProgress` (vị trí đã có)

| Cảnh              | Khi nào                                  | Vào cảnh             | Nền         | Ghi chú                          |
| ----------------- | ---------------------------------------- | -------------------- | ----------- | -------------------------------- |
| `aiJob.queued`    | `status === 'QUEUED'`                    | —                    | `thinking`  | Mắt nhìn xuống thanh tiến độ     |
| `aiJob.reading`   | `RUNNING` và `progress === 0`            | —                    | `searching` | Có "chờ lâu" (§3.4)              |
| `aiJob.writing`   | `RUNNING` và `progress > 0`              | —                    | `writing`   | Có "chờ lâu" (§3.4)              |
| `aiJob.succeeded` | `SUCCEEDED`, không lỗi một phần          | —                    | `celebrate` | Giữ nhịp 900ms đang có           |
| `aiJob.partial`   | `SUCCEEDED` có lỗi một phần              | —                    | `confused`  |                                  |
| `aiJob.failed`    | `FAILED` hoặc lỗi tải job                | `alerting 1200 →`    | `sad`       | Không rung mãi                   |
| `aiJob.cancelled` | `CANCELLED`                              | `powering-down 1400 →` | `idle`    |                                  |

Nhịp `aiJob.stepDone`: bắn khi `progressLabel` đổi và `progress` tăng so với lần đọc trước.

Quy tắc `reading`/`writing` dựa trên `progress` là giả định; kế hoạch triển khai phải đối chiếu với
nhãn bước worker thật publish (`lesson-generate.processor.ts`) và chỉnh nếu cần.

### 2.2 Làm bài luyện tập — trang `practice` (vị trí **mới** + thẻ kết quả đã có)

Mascot mới khoảng 40px đặt cạnh nút Nộp bài. Mascot 104px ở thẻ kết quả giữ nguyên, chuyển sang
dùng cảnh.

| Cảnh              | Khi nào                    | Vào cảnh                        | Nền        |
| ----------------- | -------------------------- | ------------------------------- | ---------- |
| `quiz.answering`  | Đang làm bài (cả làm lại)  | `waking 700 →`                  | `listening`|
| `quiz.submitting` | Đang gọi API nộp           | —                               | `thinking` |
| `quiz.passed`     | Kết quả `passed`           | `surprised 400 → celebrate 2200 →` | `proud` |
| `quiz.failed`     | Kết quả chưa đạt           | `sad 1200 →`                    | `curious`  |

`quiz.failed` bỏ `confused` đang dùng: trượt bài không phải lỗi, mascot khích lệ thử lại.

Nhịp `quiz.answered` (khi `answers` đổi) và `quiz.allAnswered` (khi số câu đã trả lời bằng số câu).
Hai nhịp này **không mang payload**.

### 2.3 Hoàn thành cả khóa học — trang chi tiết khóa (vị trí **mới**)

| Cảnh          | Khi nào   | Vào cảnh                                  | Nền     |
| ------------- | --------- | ----------------------------------------- | ------- |
| `course.done` | `allDone` | `celebrate 2400 →` chỉ lần đầu (xem dưới) | `proud` |

"Lần đầu": key `learn.mascot.courseCelebrated.<courseId>` trong `localStorage`, bọc `try/catch`.
Đọc hoặc ghi lỗi thì coi như đã ăn mừng rồi (thà thiếu một lần ăn mừng còn hơn lặp mãi).

### 2.4 Màn trống — `EmptyState` (vị trí đã có)

| Cảnh    | Nền        | Hành vi                                                                                      |
| ------- | ---------- | -------------------------------------------------------------------------------------------- |
| `empty` | `sleeping` | Con trỏ vào tầm nhìn hoặc nút hành động được trỏ/focus → `waking 700 →` `idle`. 8 giây không còn gì thu hút → ngủ lại |

`attentionRef` trỏ vào nút `action`. Khi nút được trỏ chuột hoặc focus, mascot nhìn vào tâm nút và
diễn `curious` cho tới khi rời nút.

### 2.5 Màn lỗi — `ErrorState` (vị trí đã có)

| Cảnh    | Vào cảnh          | Nền   |
| ------- | ----------------- | ----- |
| `error` | `alerting 1200 →` | `sad` |

Nhịp `error.retrying` khi bấm Thử lại: `thinking`, giữ cho tới khi cảnh đổi. Nếu vẫn lỗi, component
hiện lại cảnh `error` và diễn lại từ đầu.

### 2.6 Không có mascot (giữ nguyên)

Admin, đăng nhập/đăng ký, màn loading (skeleton), `not-found`, `global-error`, `TableEmpty`.

## 3. Tầng "đang sống"

### 3.1 Hướng nhìn — 4 mức ưu tiên, mức trên thắng

1. Hướng nhìn do màn diễn đang chạy khai báo (ví dụ `aiJob.queued` nhìn xuống `{x: 0, y: 0.8}`).
2. Mục tiêu chú ý: phần tử `attentionRef` đang được trỏ chuột **hoặc focus bàn phím** → nhìn tâm nó.
3. Con trỏ, khi nằm trong bán kính 6 × `size` tính từ tâm mascot.
4. Nhìn thẳng `{x: 0, y: 0}`.

Toán (`gaze.ts`, thuần):

- Vector hướng = hướng từ tâm mascot tới điểm đích; độ lớn tăng tuyến tính theo khoảng cách, đạt 1 ở
  2 × `size`; mỗi trục kẹp trong [-1, 1].
- Làm mượt mũ: `g += (đích − g) × (1 − e^(−dt/150))`. Vendor đặt mắt đúng giá trị truyền vào, không
  tự làm mượt.
- Chỉ đẩy giá trị mới vào React khi thay đổi > 0,01 trên một trục, tối đa một lần mỗi khung hình.
- Đích nhảy xa (chênh > 0,8) → gọi `blink()`.

Cảm ứng (không có con trỏ): chỉ mức 1, 2, 4.

**Mỗi màn chỉ một mascot nhìn theo con trỏ** (mức 3). Mascot phụ, ví dụ `EmptyState
size="compact"` 48px, chạy với `tracking={false}`: vẫn có mức 1, 2, 4 và mục 3.2–3.3.

### 3.2 Buồn ngủ và thức dậy

Chỉ ở cảnh có cờ `canDoze`: `empty` (đã ngủ sẵn, xem §2.4) và `quiz.answering`.

- "Thao tác" = `pointermove`, `keydown`, `scroll`, `touchstart` trên `document`, listener `passive`,
  gom tối đa một lần mỗi 500ms.
- 90 giây không thao tác → `drowsy`. 180 giây → `sleeping`.
- Có thao tác khi đang `drowsy`/`sleeping` → `waking 700 →` nền.

### 3.3 Rời tab và quay lại

- `visibilitychange` sang `hidden`: ghi mốc thời gian.
- Quay lại sau > 60 giây: `surprised 400 → happy 1000 →` nền, ưu tiên 0 (bỏ qua nếu đang có màn diễn
  ưu tiên cao hơn).
- Quay lại ≤ 60 giây: chỉ `blink()`.

### 3.4 Chờ lâu

Cảnh `aiJob.reading` và `aiJob.writing`: 20 giây không có `stepDone` → nhịp nội bộ `aiJob.stalled`:
nhìn thẳng `{0, 0}` + `blink()`, giữ 1500ms, rồi lặp lại sau mỗi 20 giây nếu vẫn chưa có bước mới.

### 3.5 Tạm dừng khi không được nhìn thấy

`IntersectionObserver` trên phần tử bọc mascot; ra khỏi viewport → `paused` của vendor. Listener con
trỏ chỉ gắn khi mascot đang hiện.

### 3.6 Không lặp như máy

- Mỗi nhịp có 1–3 cách diễn; director chọn ngẫu nhiên (qua `rng` được truyền vào), không lặp cách
  vừa diễn nếu còn cách khác.
- Chặn dồn dập: cùng một nhịp không phản ứng lại trong 600ms (cấu hình theo nhịp).
- Ưu tiên, số lớn thắng: nhịp mới cắt ngang màn diễn đang chạy khi ưu tiên của nó **lớn hơn hoặc
  bằng**; thấp hơn thì nhịp đó bị bỏ, không xếp hàng:

| Ưu tiên | Nguồn                                                             |
| ------- | ----------------------------------------------------------------- |
| 4       | Vào cảnh kết quả (`quiz.passed`, `quiz.failed`, `course.done`, `aiJob.succeeded`) |
| 3       | Vào cảnh lỗi, `error.retrying`                                    |
| 2       | `aiJob.stepDone`, `aiJob.stalled`, `quiz.allAnswered`             |
| 1       | `quiz.answered`                                                   |
| 0       | Tầng sống (thức dậy, quay lại tab, `curious` khi chú ý)           |

Đổi cảnh luôn thắng mọi màn diễn của cảnh cũ (cảnh cũ không còn đúng nữa).

### 3.7 Cách diễn của các nhịp

| Nhịp               | Cách diễn (chọn một)                                               | Chặn dồn dập |
| ------------------ | ------------------------------------------------------------------ | ------------ |
| `quiz.answered`    | `happy 500` · `curious 500` · `listening` + `blink()`              | 600ms        |
| `quiz.allAnswered` | `excited 700 → happy 1500`                                         | 600ms        |
| `aiJob.stepDone`   | `happy 800` · `proud 800`                                          | 600ms        |
| `aiJob.stalled`    | nhìn thẳng + `blink()`, giữ 1500                                   | —            |
| `error.retrying`   | `thinking` giữ tới khi đổi cảnh                                    | 600ms        |

### 3.8 Giảm chuyển động

Khi `prefers-reduced-motion: reduce` (hoặc prop ép từ `/dev/ui`):

- Tắt mức 3 của hướng nhìn (không nhìn theo con trỏ). Mức 1, 2 vẫn chạy nhưng không làm mượt dần mà
  đặt thẳng.
- Mọi chuỗi rút về state cuối (ví dụ `quiz.passed` vào thẳng `proud`).
- Vẫn đổi state/biểu cảm: đó là thông tin, không phải trang trí. Vendor đã tự đặt `motion` về 0 nên
  thân đứng yên.

## 4. Kiến trúc

### 4.1 File

Mọi file mới nằm ở `apps/web/src/components/shared/mascot/`, vì mascot được dùng từ
`components/ui`, `features/ai` và các trang trong `app/`, và luật ranh giới cấm `features/*` import
lẫn nhau. Lint chỉ bỏ qua đúng file vendor, nên file mới vẫn được lint và typecheck đầy đủ.

| File                         | Trách nhiệm                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `components/shared/mascot.tsx` | (sửa) Wrapper cũ: thêm `gaze`, `paused`, `sequence`, ref lệnh; nới union `MascotState` |
| `mascot/CircleAvatar.tsx`    | Vendor, **không sửa**                                                                |
| `mascot/script.ts`           | Dữ liệu tính cách: bảng cảnh (§2) và bảng nhịp (§3.7). Không có logic               |
| `mascot/director.ts`         | Máy trạng thái thuần: ưu tiên, chặn dồn dập, chọn cách diễn, ngủ gật, chờ lâu, rời tab, giảm chuyển động |
| `mascot/gaze.ts`             | Toán hướng nhìn thuần (§3.1)                                                         |
| `mascot/controller.ts`       | `useMascotController()`: kênh phát nhịp, không có state React                        |
| `mascot/live-mascot.tsx`     | `<LiveMascot>`: nối director + gaze + sự kiện DOM vào `<Mascot>`                     |
| `mascot/*.test.ts`           | Test cho `script`, `director`, `gaze`                                                |

### 4.2 Kiểu

```ts
type MascotScene =
  | 'empty' | 'error'
  | 'aiJob.queued' | 'aiJob.reading' | 'aiJob.writing'
  | 'aiJob.succeeded' | 'aiJob.partial' | 'aiJob.failed' | 'aiJob.cancelled'
  | 'quiz.answering' | 'quiz.submitting' | 'quiz.passed' | 'quiz.failed'
  | 'course.done';

type MascotBeat =
  | 'quiz.answered' | 'quiz.allAnswered'
  | 'aiJob.stepDone'
  | 'error.retrying';
// 'aiJob.stalled' là nhịp nội bộ của director, không xuất ra ngoài.
```

`MascotState` được nới thêm: `waking`, `listening`, `searching`, `writing`, `excited`, `surprised`,
`curious`, `drowsy`, `powering-down`. State không còn chỗ dùng thì để nguyên, không dọn trong phạm vi
này.

### 4.3 Cách dùng

```tsx
const mascot = useMascotController();

<LiveMascot
  controller={mascot}
  scene={submitting ? 'quiz.submitting' : 'quiz.answering'}
  attentionRef={submitButtonRef}
  size={40}
/>

mascot.beat('quiz.answered');
```

Props của `<LiveMascot>`: `scene`, `controller?`, `attentionRef?`, `size`, `tracking?` (mặc định
`true`), `celebrateOnEnter?` (cho `course.done`), `reducedMotion?` (ép, cho `/dev/ui`), `className?`.

### 4.4 Luồng dữ liệu

- Trạng thái "sống" (máy director, hướng nhìn) nằm **trong `<LiveMascot>`**, không ở trang. Ánh mắt
  cập nhật tới 60 lần mỗi giây; giữ ở trang thì cả trang render lại. Trang chỉ cầm controller không có
  state; `beat()` đi qua kênh đăng ký vào `<LiveMascot>`.
- `director` là reducer thuần `(máy, đầu vào, now, rng) → { máy mới, hẹn giờ kế tiếp }`. Đầu vào:
  đổi cảnh, nhịp, hết giờ, thao tác, tab ẩn/hiện, `reducedMotion`. Đầu ra cho render: `state` hoặc
  `sequence`, `gaze` mức 1, cờ `blink` một lần.
- `<LiveMascot>` chỉ biến sự kiện DOM thành đầu vào, giữ một `setTimeout` duy nhất theo "hẹn giờ kế
  tiếp", và chạy vòng `requestAnimationFrame` cho làm mượt ánh mắt chỉ khi đích khác giá trị hiện tại.
- `<Mascot>` tĩnh giữ nguyên cho nơi không cần sống.

### 4.5 Chỗ nối vào

| Nơi                                    | Thay đổi                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `features/ai/ai-job-progress.tsx`      | Cảnh suy từ `status`/`progress`; so với lần đọc trước để bắn `aiJob.stepDone`            |
| `app/(app)/courses/.../practice/page.tsx` | Mascot 40px cạnh nút Nộp; `quiz.answered`/`allAnswered`; thẻ kết quả dùng cảnh `quiz.passed`/`failed` |
| `app/(app)/courses/[courseId]/page.tsx` | `<LiveMascot scene="course.done">` cạnh dòng hoàn thành khi `allDone`                    |
| `components/ui/states.tsx`             | `EmptyState` → cảnh `empty`, `attentionRef` = nút action, bản compact `tracking={false}`; `ErrorState` → cảnh `error`, `onRetry` bắn `error.retrying`. Bỏ prop `mascot` của `EmptyState` (hiện không nơi nào truyền) |
| `app/dev/ui/page.tsx`                  | Mục "Mascot sống": mỗi cảnh một ô, nút bắn từng nhịp, công tắc giảm chuyển động          |

### 4.6 Rủi ro: ref qua `next/dynamic`

`blink()` cần ref lệnh của vendor (`forwardRef`). Chưa chắc `next/dynamic` của Next 15 chuyển tiếp
ref. **Bước đầu tiên của kế hoạch** là thử điều này. Nếu không chuyển được: thay bằng `React.lazy`
+ `Suspense`, chỉ render sau khi mount — vẫn giữ chunk vendor ~115 KB ngoài bundle đầu và không
render phía server. Mọi thứ khác (cảnh, gaze, sequence, paused) đi qua props, không phụ thuộc rủi ro
này.

### 4.7 State dự phòng

Mọi state mới phải được xem ở tông sáng và tối với `effects={false}`. State nào trông sai thì dùng
dự phòng thay vì thêm vào union:

| State         | Dự phòng   |
| ------------- | ---------- |
| `searching`   | `thinking` |
| `writing`     | `working`  |
| `powering-down` | bỏ màn vào cảnh, vào thẳng `idle` |
| `excited`     | `happy`    |

## 5. Ràng buộc

- **Đơn sắc (ADR 015):** giữ `effects={false}`, màu thân/mặt như wrapper hiện tại.
- **Đáp án:** nhịp luyện tập không có payload; có test khóa.
- **§13.2:** cảnh lỗi (`error`, `aiJob.failed`) không dùng `happy`/`excited`; có test khóa.
- **A11y:** mascot vẫn `aria-hidden`; không bao giờ là nơi duy nhất mang thông tin; rung `alerting`
  ≤ 1,2 giây; mục tiêu chú ý nhận focus bàn phím; giảm chuyển động theo §3.8.
- **Hiệu năng:** chunk vendor vẫn nạp lười; code mới ≤ 6 KB gzip; listener `passive`, chỉ gắn khi
  mascot hiện; ra khỏi viewport thì `paused`; mỗi màn tối đa một mascot nhìn theo con trỏ.

## 6. Test và kiểm chứng

**Unit (vitest, không DOM):**

- `director`: ưu tiên và cắt ngang; đổi cảnh thắng mọi màn diễn cũ; chặn dồn dập; không lặp cách
  diễn (rng có hạt giống); màn vào cảnh rồi về nền; ngủ gật 90s/180s rồi thức; quay lại tab >60s và
  ≤60s; "chờ lâu" chỉ ở `aiJob.reading`/`writing`; giảm chuyển động rút chuỗi và tắt nhìn theo.
- `script`: mọi cảnh/nhịp chỉ trỏ tới state trong union; mỗi nhịp 1–3 cách diễn, thời gian > 0;
  luật §13.2; kiểu nhịp luyện tập không có payload.
- `gaze`: ánh xạ và kẹp; ngưỡng 6 × size; làm mượt hội tụ; cờ blink khi đích nhảy > 0,8.

**Trình duyệt:**

- `/dev/ui` mục "Mascot sống" để xem toàn bộ tính cách không cần backend.
- `node scripts/capture-ui.mjs` và `node scripts/audit-a11y.mjs` (tông tối chạy axe riêng).
- Luồng luyện tập và AI Job qua mock API tạm ở :4000 (scratchpad); console không lỗi.
- `javascript_tool` xác nhận mascot ngoài viewport đang `paused`.

**Lệnh:** `npm run typecheck`, `npm run lint`, `npm run test` xanh.

## 7. Tài liệu phải sửa (theo thứ tự)

1. `learnflow-ai-portfolio-agent-spec.md` (dòng mascot) — thêm hai vị trí.
2. HANDBOOK §13.1, §13.2, §13.4, dòng R12, các dòng checklist liên quan.
3. ADR 016 "Mascot sống: cảnh và nhịp"; ADR 006 thêm dòng union đã nới, trỏ sang 016.
4. `docs/UI-GUIDE.md` §7 viết lại (dùng `LiveMascot`, thêm cảnh/nhịp, luật một mascot nhìn theo con
   trỏ); sửa đường dẫn cũ `components/mascot.tsx` và dòng 60.
5. `docs/REQUIREMENTS.md`: NFR-UX mới "mascot phản ứng theo ngữ cảnh", nhãn `Đang phát triển` khi bắt
   đầu, `Có trong MVP` khi đạt §8.
6. `docs/progress/STATE.md`, `CHECKLIST.md`, `session-log.md` cuối phiên.

## 8. Tiêu chí hoàn thành

- 5 luồng ở §2 hành xử đúng bảng, xem được ở `/dev/ui` và trên màn thật (mock API).
- Tầng sống §3 chạy đúng, kể cả giảm chuyển động và cảm ứng.
- Typecheck, lint, test xanh; có test cho `director`, `script`, `gaze`.
- `audit-a11y` 0 vi phạm trên các màn bị đụng, cả hai tông.
- Code mới ≤ 6 KB gzip: đo bằng esbuild bundle + minify + gzip các file mới trong `mascot/` (trừ
  vendor, React đánh dấu external).
- Tài liệu §7 đã cập nhật.

## 9. Ngoài phạm vi

Mascot bạn đồng hành thường trực; âm thanh; export lại từ Blob Studio; mascot ở admin và đăng nhập;
công tắc tắt mascot trong cài đặt.
