# Mascot sống: cảnh và nhịp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Biến mascot Circle thành một sinh vật "sống" ở các khoảnh khắc chính của người học: phản
ứng với sự kiện của app (cảnh + nhịp) và có tầng sống (nhìn, chớp mắt, ngủ gật, giật mình) khi không
có gì xảy ra.

**Architecture:** Kịch bản tính cách là dữ liệu thuần (`script.ts`); một máy trạng thái thuần
(`director.ts`) nhận đầu vào có thời gian và trả trạng thái mới; toán hướng nhìn thuần (`gaze.ts`).
`<LiveMascot>` nối chúng vào DOM và vào wrapper `<Mascot>` sẵn có; trang chỉ cầm một controller
không có state (`useMascotController`) để bắn nhịp, nên ánh mắt 60 fps không làm render lại cả trang.
File vendor `CircleAvatar.tsx` không bị sửa.

**Tech Stack:** Next 15 (App Router) · React 19.3 · TypeScript strict · vitest (môi trường node) ·
Tailwind · vendor Blob Studio `CircleAvatar`.

**Spec:** `docs/superpowers/specs/2026-09-28-mascot-song-design.md` (đọc kèm; Task 1 sửa 4 chỗ trong
spec đã được xác minh lại khi lập kế hoạch).

## Global Constraints

- TypeScript `strict: true`, `noUncheckedIndexedAccess: true`, **không dùng `any`**.
- **Không sửa** `apps/web/src/components/shared/mascot/CircleAvatar.tsx` (ADR 006).
- Module thuần được test bằng vitest (`script.ts`, `director.ts`, `gaze.ts`, `controller.ts`,
  `features/ai/ai-job-mascot.ts`, `features/learning/quiz-mascot.ts`,
  `features/courses/course-celebration.ts`) chỉ được import **giá trị** qua đường dẫn tương đối; import
  từ `@/…` phải là `import type`. Lý do: `apps/web` không có `vitest.config`, vitest không hiểu alias `@/`.
- Đơn sắc (ADR 015): giữ `effects={false}`, không thêm màu nào; mascot vẫn `aria-hidden`.
- Đáp án đúng không bao giờ tới client trước khi nộp; nhịp luyện tập **không mang payload**.
- Cảnh lỗi (`error`, `aiJob.failed`) không bao giờ dùng `happy`/`excited` (HANDBOOK §13.2).
- Thời gian (copy nguyên từ spec): ngủ gật 90 000 ms → `drowsy`, 180 000 ms → `sleeping`; `empty` ngủ
  lại sau 8 000 ms; rời tab "lâu" khi > 60 000 ms; chờ lâu AI Job 20 000 ms, giữ 1 500 ms; chặn dồn dập
  600 ms; thức dậy `waking 700`; gom thao tác 500 ms; làm mượt ánh mắt 150 ms; bán kính theo dõi
  6 × size; độ lớn ánh mắt đạt 1 ở 2 × size; ngưỡng thay đổi 0,01; ngưỡng chớp khi đích nhảy 0,8.
- Mỗi màn sản phẩm tối đa **một** mascot nhìn theo con trỏ (`tracking`), mascot phụ `tracking={false}`.
- Chữ hiển thị: không dùng `—`/`–`, tối đa một `·` mỗi dòng (UI-GUIDE, chống dấu hiệu AI).
- Commit: `type(scope): mo ta khong dau`, kết thúc bằng dòng
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Chỉ `git add` đúng các file của task.
- Lệnh test một file: `npm run test --workspace @learn/web -- <đường dẫn từ apps/web>`.
- Code mới trong `components/shared/mascot/` (trừ vendor) ≤ 6 KB gzip.

## Review Focus

- **Gõ chữ vào câu hỏi tự luận** → mascot không được gật theo từng phím; chỉ phản ứng khi *số câu đã
  trả lời* tăng. Test: Task 9, `quizBeats` với số câu không đổi trả `[]`.
- **Bấm Thử lại rồi vẫn lỗi** (react-query giữ `isError` trong lúc refetch nên `ErrorState` không
  remount) → mascot không được kẹt ở `thinking`; phải về `sad` sau 1 500 ms. Test: Task 3, "nhịp cùng
  ưu tiên cắt ngang và tự kết thúc".
- **Máy bật giảm chuyển động ngay từ lần tải đầu** → chuỗi vào cảnh không được chạy dù chỉ một khung
  hình. Test: Task 3, `initDirector` với `reducedMotion: true`; Task 6 đọc `matchMedia` đồng bộ trong
  bộ khởi tạo `useReducer`.
- **Chế độ riêng tư chặn `localStorage` hoặc StrictMode chạy effect hai lần** → không crash, không ăn
  mừng lặp, và StrictMode không được xoá mất lần ăn mừng đầu. Test: Task 10, `claimCourseCelebration`
  với storage ném lỗi / `null` và gọi lần hai.
- **AI Job nhảy thẳng từ 15% lên 34% (bài đầu xong)** → cảnh đổi `reading` → `writing` **và** nhịp
  `stepDone` vẫn diễn (nhịp tới sau khi đổi cảnh không bị nuốt). Test: Task 8 `isStepDone(15→34)`;
  Task 3 "nhịp ngay sau đổi cảnh vẫn diễn".

---

### Task 0: Dọn working tree (cần người dùng quyết)

`main` đang có rất nhiều thay đổi chưa commit của phiên 20–21 và đợt giao diện đơn sắc, **trong đó có
chính các file plan này sửa** (`components/shared/mascot.tsx`, `components/ui/states.tsx`,
`features/ai/ai-job-progress.tsx`, trang practice, trang chi tiết khóa, `app/dev/ui/page.tsx`,
`docs/UI-GUIDE.md`). Commit theo task mà không dọn trước sẽ gộp việc cũ vào commit mascot.

- [ ] **Step 1: Hỏi người dùng** (không tự làm): đề xuất commit phần đang dở thành hai commit riêng như
  memory `project_frontend_redesign` đã gợi ý (việc AI/LLM phiên 20; giao diện v3→đơn sắc), hoặc
  người dùng tự commit. Chỉ tiếp tục khi `git status --short` không còn thay đổi trên các file ở trên.
- [ ] **Step 2: Kiểm tra nền xanh**

Run: `npm run typecheck && npm run test --workspace @learn/web`
Expected: exit 0. Nếu đỏ sẵn từ trước, báo người dùng, không sửa trong plan này.

---

### Task 1: Nới `[SPEC]` §13.1 trước, ADR 016, NFR mới, chỉnh spec thiết kế

AGENTS.md: đổi ràng buộc `[SPEC]` phải sửa spec trước, đổi quyết định phải có ADR.

**Files:**
- Modify: `learnflow-ai-portfolio-agent-spec.md:631`
- Modify: `docs/HANDBOOK.md` (§13.1 dòng ~1500, §13.2 bảng ~1505, §13.4 dòng ~1549, R12 dòng ~2332)
- Create: `docs/adr/016-mascot-song-canh-va-nhip.md`
- Modify: `docs/adr/006-mascot-dong-blob-studio.md` (cuối mục "Ràng buộc `[SPEC]` không thay đổi")
- Modify: `docs/REQUIREMENTS.md` (sau dòng `NFR-UX-07`)
- Modify: `docs/superpowers/specs/2026-09-28-mascot-song-design.md`

**Interfaces:** Không có code. Sau task này, các task sau được phép đặt mascot ở "đang làm bài luyện
tập" và "hoàn thành khóa học".

- [ ] **Step 1: Sửa spec gốc** — dòng 631 của `learnflow-ai-portfolio-agent-spec.md`:

Thay:
```
- The Circle mascot (`CircleMascot/`) for hero, empty states, AI job progress, and error states. Keep it out of the technical sections.
```
bằng:
```
- The Circle mascot (`CircleMascot/`) for hero, empty states, AI job progress, error states, the practice screen (while answering and on the result), and course completion. Keep it out of the technical sections. *(Widened 2026-09-28 by product-owner decision: the mascot reacts at key learner moments. See `docs/adr/016-mascot-song-canh-va-nhip.md`.)*
```

- [ ] **Step 2: Sửa HANDBOOK §13.1** — thay đoạn:
```
`[SPEC]` **Mục đích**: mascot thuộc về phần marketing — hero, empty state, tiến độ AI Job và
trạng thái lỗi. Không đặt trong các section kỹ thuật.
```
bằng:
```
`[SPEC]` **Mục đích**: mascot đứng ở những khoảnh khắc chính của người học — hero, empty state,
tiến độ AI Job, trạng thái lỗi, màn luyện tập (đang làm bài và kết quả) và hoàn thành khóa học
(ADR 016). Không đặt trong các section kỹ thuật, admin hay đăng nhập; không có mascot thường trực
đi theo khắp app.
```

- [ ] **Step 3: Sửa HANDBOOK §13.2** — thêm 3 dòng vào cuối bảng (giữ 4 dòng cũ) và câu dẫn:
```
| `listening` | Đang làm bài luyện tập           |
| `proud`     | Qua bài / hoàn thành cả khóa học |
| `sad`       | Lắng xuống sau `alerting`        |

Ánh xạ đầy đủ theo cảnh và nhịp nằm ở `components/shared/mascot/script.ts` (ADR 016).
```

- [ ] **Step 4: Sửa HANDBOOK §13.4 và R12** — dòng `- Lạm dụng mascot ở mọi nơi — chỉ dùng ở hero,
  empty state, tiến độ AI Job và trạng thái lỗi` thành
  `- Lạm dụng mascot ở mọi nơi — chỉ dùng ở các vị trí §13.1; mỗi màn tối đa một mascot nhìn theo con trỏ`.
  Trong dòng R12, thay `Chỉ dùng ở hero, empty state, tiến độ AI Job và trạng thái lỗi (13.4)` bằng
  `Chỉ dùng ở các vị trí §13.1, không có mascot thường trực (13.4, ADR 016)`.

- [ ] **Step 5: Tạo ADR 016** — `docs/adr/016-mascot-song-canh-va-nhip.md`:
```markdown
# ADR 016 — Mascot sống: cảnh và nhịp

- **Ngày:** 2026-09-28
- **Trạng thái:** Đã chấp nhận
- **Liên quan:** HANDBOOK §13, ADR 006, ADR 015, spec thiết kế
  `docs/superpowers/specs/2026-09-28-mascot-song-design.md`

## Bối cảnh

Vendor Blob Studio cho 40 state, 25 biểu cảm, hướng nhìn, lệnh chớp mắt và chuỗi biểu cảm. App chỉ
dùng ~7 state gắn cứng lúc render, không phản ứng với việc người dùng làm. Chủ sản phẩm muốn mascot
"sống" ở các khoảnh khắc chính, **không** thành bạn đồng hành thường trực.

## Quyết định

1. Nới §13.1 `[SPEC]` thêm hai vị trí: màn luyện tập (đang làm và kết quả) và hoàn thành khóa học.
   R12 giữ nguyên tinh thần: không mascot thường trực, mỗi màn tối đa một mascot nhìn theo con trỏ.
2. Hành vi mô tả bằng **cảnh** (tình huống kéo dài, khai báo qua prop) và **nhịp** (sự kiện chớp
   nhoáng, bắn qua controller). Kịch bản là dữ liệu ở `components/shared/mascot/script.ts`; máy
   trạng thái thuần ở `director.ts`, test được không cần DOM.
3. Không phản ứng đúng/sai trước khi nộp bài: đáp án đúng không rời server trước khi nộp.

## Phương án đã loại

- Mỗi màn tự dàn cảnh: logic rải rác, tính cách không nhất quán, khó test.
- "Đạo diễn" toàn cục với event bus: chỉ đáng khi có mascot thường trực — hướng đã không chọn.

## Hệ quả

- Union `MascotState` nới thêm 9 state; vẫn hẹp hơn 40 state của vendor.
- Thêm một mascot 40px ở thanh nộp bài và một mascot ở dòng tiến độ khi xong cả khóa.
- Nếu một state trông sai khi tắt hiệu ứng màu, kịch bản dùng state dự phòng (spec §4.7).
```

- [ ] **Step 6: Ghi chú ADR 006** — thêm cuối mục "Ràng buộc `[SPEC]` không thay đổi":
```
> **Cập nhật 2026-09-28:** §13.1 đã được nới và union `MascotState` mở rộng theo ADR 016.
```

- [ ] **Step 7: Thêm NFR** — sau dòng `NFR-UX-07` trong `docs/REQUIREMENTS.md` (bảng 2 cột, nhãn
  nằm trong chữ mô tả):
```
| NFR-UX-08 | Mascot phản ứng theo ngữ cảnh ở các vị trí HANDBOOK §13.1 (cảnh + nhịp, ADR 016), tôn trọng prefers-reduced-motion — **Đang phát triển** |
```

- [ ] **Step 8: Chỉnh spec thiết kế** cho khớp điều đã xác minh khi lập kế hoạch
  (`docs/superpowers/specs/2026-09-28-mascot-song-design.md`):
  1. §2.1 bảng: `aiJob.reading` → khi `RUNNING` và `progress < 20`; `aiJob.writing` → `RUNNING` và
     `progress >= 20`. Thay câu "Quy tắc `reading`/`writing` dựa trên `progress` là giả định…" bằng:
     "Worker publish 5 (chuẩn bị dữ liệu), 15 (lập outline), rồi `20 + round(xong/tổng × 70)` sau mỗi
     bài (`lesson-generate.processor.ts`). Nhịp `aiJob.stepDone` bắn khi cả hai lần đọc đều `RUNNING`,
     `progress` tăng, `progress > 20` và `progressLabel` đổi."
  2. §2.5 và §3.7: `error.retrying` = `thinking 1500` (không giữ vô hạn), vì react-query giữ
     `isError` trong lúc refetch nên `ErrorState` không remount khi thử lại thất bại.
  3. §3.1 mức 4: "Nhìn nghỉ = `DEFAULT_GAZE` của vendor `{x: 0.345, y: 0.343}` (vendor cố ý lệch khỏi
     tâm vì nhìn thẳng trông như trừng mắt)". "Chờ lâu" (§3.4) vẫn nhìn thẳng `{0, 0}` — đó là cố ý
     nhìn người dùng.
  4. §4.3/§2.4: `attentionRef` trỏ vào **phần tử bọc** các nút; mục tiêu là nút/link gần nhất dưới con
     trỏ hoặc focus (`closest('button, a, [role="button"]')`), nên không phải sửa `Button` để nhận ref.
  5. §2.3: mascot `course.done` chạy `tracking={false}` (có thể cùng màn với `AiJobProgress`).

- [ ] **Step 9: Kiểm tra**

Run: `git diff --stat` — chỉ 6 file tài liệu ở trên đổi (1 file mới).

- [ ] **Step 10: Commit**
```bash
git add learnflow-ai-portfolio-agent-spec.md docs/HANDBOOK.md docs/adr/016-mascot-song-canh-va-nhip.md docs/adr/006-mascot-dong-blob-studio.md docs/REQUIREMENTS.md docs/superpowers/specs/2026-09-28-mascot-song-design.md
git commit -m "docs(spec): noi HANDBOOK 13.1 cho mascot song, ADR 016, NFR-UX-08

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Kịch bản tính cách (`script.ts`) + nới union `MascotState`

**Files:**
- Modify: `apps/web/src/components/shared/mascot.tsx` (union `MascotState`)
- Create: `apps/web/src/components/shared/mascot/script.ts`
- Test: `apps/web/src/components/shared/mascot/script.test.ts`

**Interfaces:**
- Produces (từ `script.ts`): `type MascotScene`, `type MascotBeat`, `interface Gaze { x; y }`,
  `interface Step { state: MascotState; holdMs: number; gaze?: Gaze; blink?: boolean }`,
  `type Performance = readonly Step[]`, `type Priority = 0|1|2|3|4`, `const P`,
  `interface SceneDef`, `interface BeatDef`, `const SCENES: Record<MascotScene, SceneDef>`,
  `const BEATS: Record<MascotBeat, BeatDef>`, `const TIMING`, `const WAKE`, `const RETURNED`,
  `const ERROR_SCENES`.

- [ ] **Step 1: Nới union** trong `components/shared/mascot.tsx` — thay khối `export type MascotState = …;`
  bằng:
```ts
export type MascotState =
  // Nghỉ, màn trống, ngủ gật (ADR 016)
  | 'sleeping'
  | 'drowsy'
  | 'waking'
  | 'idle'
  | 'bored'
  // Đang làm bài luyện tập
  | 'listening'
  | 'curious'
  // Tiến độ AI Job
  | 'working'
  | 'thinking'
  | 'searching'
  | 'writing'
  | 'progress'
  | 'uploading'
  | 'powering-down'
  // Hoàn thành, phản ứng vui (§13.2)
  | 'celebrate'
  | 'proud'
  | 'happy'
  | 'excited'
  | 'surprised'
  // Lỗi
  | 'alerting'
  | 'sad'
  | 'confused';
```
  Sửa comment phía trên union: câu "chỉ những state ứng với các vị trí spec cho phép" giữ nguyên, thêm
  "Danh sách vị trí: HANDBOOK §13.1 sau ADR 016."

- [ ] **Step 2: Viết test thất bại** — `script.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { BEATS, ERROR_SCENES, P, SCENES, type Performance } from './script';

const statesOf = (p: Performance | undefined) => (p ?? []).map((s) => s.state);

describe('kịch bản mascot', () => {
  it('mỗi nhịp có 1–3 cách diễn, mỗi bước giữ > 0ms', () => {
    for (const [name, beat] of Object.entries(BEATS)) {
      expect(beat.variants.length, name).toBeGreaterThanOrEqual(1);
      expect(beat.variants.length, name).toBeLessThanOrEqual(3);
      for (const v of beat.variants) {
        expect(v.length, name).toBeGreaterThan(0);
        for (const step of v) expect(step.holdMs, name).toBeGreaterThan(0);
      }
    }
  });

  it('bước vào cảnh luôn giữ > 0ms', () => {
    for (const [name, scene] of Object.entries(SCENES)) {
      for (const step of scene.enter ?? []) expect(step.holdMs, name).toBeGreaterThan(0);
    }
  });

  it('HANDBOOK §13.2: cảnh lỗi không dùng happy/excited', () => {
    const banned = ['happy', 'excited'];
    for (const name of ERROR_SCENES) {
      const scene = SCENES[name];
      const used = [scene.base, ...statesOf(scene.enter), scene.attentionState, scene.awakeState];
      for (const s of used) expect(banned, name).not.toContain(s);
    }
    for (const v of BEATS['error.retrying'].variants) {
      for (const s of statesOf(v)) expect(banned).not.toContain(s);
    }
  });

  it('ưu tiên vào cảnh đúng bảng spec §3.6', () => {
    expect(SCENES['quiz.passed'].enterPriority).toBe(P.result);
    expect(SCENES['quiz.failed'].enterPriority).toBe(P.result);
    expect(SCENES['course.done'].enterPriority).toBe(P.result);
    expect(SCENES.error.enterPriority).toBe(P.error);
    expect(SCENES['aiJob.failed'].enterPriority).toBe(P.error);
    expect(BEATS['quiz.answered'].priority).toBe(P.answer);
    expect(BEATS['quiz.allAnswered'].priority).toBe(P.step);
    expect(BEATS['aiJob.stepDone'].priority).toBe(P.step);
    expect(BEATS['error.retrying'].priority).toBe(P.error);
  });

  it('chỉ cảnh làm bài được ngủ gật, chỉ cảnh AI đang chạy có "chờ lâu"', () => {
    const dozers = Object.entries(SCENES).filter(([, s]) => s.canDoze).map(([n]) => n);
    expect(dozers).toEqual(['quiz.answering']);
    const stallers = Object.entries(SCENES).filter(([, s]) => s.stallMs !== null).map(([n]) => n);
    expect(stallers.sort()).toEqual(['aiJob.reading', 'aiJob.writing']);
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/script.test.ts`
Expected: FAIL, "Failed to resolve import './script'".

- [ ] **Step 4: Viết `script.ts`**
```ts
import type { MascotState } from '../mascot';

/**
 * Kịch bản tính cách của mascot — ADR 016, spec
 * docs/superpowers/specs/2026-09-28-mascot-song-design.md §2–3.
 *
 * Chỉ là dữ liệu. Logic chạy nằm ở `director.ts`. Đổi cách mascot cư xử thì sửa ở đây.
 *
 * **Cảnh** là tình huống kéo dài (khai báo qua prop `scene`), **nhịp** là sự kiện chớp nhoáng
 * (bắn qua controller). Nhịp luyện tập cố ý không mang dữ liệu: mascot không được biết đúng hay
 * sai trước khi nộp bài.
 */

export type MascotScene =
  | 'empty'
  | 'error'
  | 'aiJob.queued'
  | 'aiJob.reading'
  | 'aiJob.writing'
  | 'aiJob.succeeded'
  | 'aiJob.partial'
  | 'aiJob.failed'
  | 'aiJob.cancelled'
  | 'quiz.answering'
  | 'quiz.submitting'
  | 'quiz.passed'
  | 'quiz.failed'
  | 'course.done';

export type MascotBeat = 'quiz.answered' | 'quiz.allAnswered' | 'aiJob.stepDone' | 'error.retrying';

/** Hướng nhìn, mỗi trục -1…1, y dương là nhìn xuống (hệ toạ độ SVG của vendor). */
export interface Gaze {
  x: number;
  y: number;
}

/** Một bước diễn: giữ `state` trong `holdMs`, tuỳ chọn nhìn về đâu và chớp mắt khi vào bước. */
export interface Step {
  state: MascotState;
  holdMs: number;
  gaze?: Gaze;
  blink?: boolean;
}

export type Performance = readonly Step[];

/** Số lớn thắng. Nhịp cắt ngang màn đang diễn khi ưu tiên >= màn đó. */
export type Priority = 0 | 1 | 2 | 3 | 4;

export const P = {
  presence: 0,
  answer: 1,
  step: 2,
  error: 3,
  result: 4,
} as const satisfies Record<string, Priority>;

export interface SceneDef {
  /** State mascot quay về và giữ khi không có gì chạy. */
  base: MascotState;
  /** Hướng nhìn khi đứng ở nền; bỏ trống = để tầng sống quyết. */
  baseGaze?: Gaze;
  /** Màn diễn khi vừa vào cảnh. */
  enter?: Performance;
  enterPriority: Priority;
  /** Chỉ diễn `enter` khi được yêu cầu rõ (course.done: chỉ lần đầu). */
  enterOnRequest?: boolean;
  canDoze: boolean;
  /** Bao lâu không có bước mới thì ngẩng lên nhìn người dùng; null = không áp dụng. */
  stallMs: number | null;
  /** State khi nút hành động đang được trỏ/focus. */
  attentionState?: MascotState;
  /** Chỉ cảnh `empty`: nền là ngủ, được đánh thức thì đứng ở state này. */
  awakeState?: MascotState;
}

export interface BeatDef {
  variants: readonly Performance[];
  priority: Priority;
  cooldownMs: number;
}

export const TIMING = {
  drowsyAfterMs: 90_000,
  sleepAfterMs: 180_000,
  resleepAfterMs: 8_000,
  awayLongMs: 60_000,
  stallHoldMs: 1_500,
} as const;

export const WAKE: Performance = [{ state: 'waking', holdMs: 700 }];

export const RETURNED: Performance = [
  { state: 'surprised', holdMs: 400 },
  { state: 'happy', holdMs: 1_000 },
];

export const SCENES: Record<MascotScene, SceneDef> = {
  empty: {
    base: 'sleeping',
    awakeState: 'idle',
    attentionState: 'curious',
    enterPriority: P.presence,
    canDoze: false,
    stallMs: null,
  },
  error: {
    base: 'sad',
    enter: [{ state: 'alerting', holdMs: 1_200 }],
    enterPriority: P.error,
    canDoze: false,
    stallMs: null,
  },
  'aiJob.queued': {
    base: 'thinking',
    baseGaze: { x: 0, y: 0.8 },
    enterPriority: P.step,
    canDoze: false,
    stallMs: null,
  },
  'aiJob.reading': { base: 'searching', enterPriority: P.step, canDoze: false, stallMs: 20_000 },
  'aiJob.writing': { base: 'writing', enterPriority: P.step, canDoze: false, stallMs: 20_000 },
  'aiJob.succeeded': { base: 'celebrate', enterPriority: P.result, canDoze: false, stallMs: null },
  'aiJob.partial': { base: 'confused', enterPriority: P.result, canDoze: false, stallMs: null },
  'aiJob.failed': {
    base: 'sad',
    enter: [{ state: 'alerting', holdMs: 1_200 }],
    enterPriority: P.error,
    canDoze: false,
    stallMs: null,
  },
  'aiJob.cancelled': {
    base: 'idle',
    enter: [{ state: 'powering-down', holdMs: 1_400 }],
    enterPriority: P.presence,
    canDoze: false,
    stallMs: null,
  },
  'quiz.answering': {
    base: 'listening',
    enter: WAKE,
    enterPriority: P.presence,
    canDoze: true,
    stallMs: null,
  },
  'quiz.submitting': { base: 'thinking', enterPriority: P.step, canDoze: false, stallMs: null },
  'quiz.passed': {
    base: 'proud',
    enter: [
      { state: 'surprised', holdMs: 400 },
      { state: 'celebrate', holdMs: 2_200 },
    ],
    enterPriority: P.result,
    canDoze: false,
    stallMs: null,
  },
  'quiz.failed': {
    base: 'curious',
    enter: [{ state: 'sad', holdMs: 1_200 }],
    enterPriority: P.result,
    canDoze: false,
    stallMs: null,
  },
  'course.done': {
    base: 'proud',
    enter: [{ state: 'celebrate', holdMs: 2_400 }],
    enterOnRequest: true,
    enterPriority: P.result,
    canDoze: false,
    stallMs: null,
  },
};

export const BEATS: Record<MascotBeat, BeatDef> = {
  'quiz.answered': {
    priority: P.answer,
    cooldownMs: 600,
    variants: [
      [{ state: 'happy', holdMs: 500 }],
      [{ state: 'curious', holdMs: 500 }],
      [{ state: 'listening', holdMs: 500, blink: true }],
    ],
  },
  'quiz.allAnswered': {
    priority: P.step,
    cooldownMs: 600,
    variants: [
      [
        { state: 'excited', holdMs: 700 },
        { state: 'happy', holdMs: 1_500 },
      ],
    ],
  },
  'aiJob.stepDone': {
    priority: P.step,
    cooldownMs: 600,
    variants: [[{ state: 'happy', holdMs: 800 }], [{ state: 'proud', holdMs: 800 }]],
  },
  'error.retrying': {
    priority: P.error,
    cooldownMs: 600,
    variants: [[{ state: 'thinking', holdMs: 1_500 }]],
  },
};

/** Cảnh lỗi — HANDBOOK §13.2 cấm `happy`/`excited` ở đây (có test khoá). */
export const ERROR_SCENES: readonly MascotScene[] = ['error', 'aiJob.failed'];
```

- [ ] **Step 5: Chạy test, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/script.test.ts`
Expected: PASS (5 test).

- [ ] **Step 6: Typecheck** — `npm run typecheck --workspace @learn/web` → exit 0. (Typecheck là cái
  khoá "mọi cảnh/nhịp chỉ trỏ tới state trong union".)

- [ ] **Step 7: Commit**
```bash
git add apps/web/src/components/shared/mascot.tsx apps/web/src/components/shared/mascot/script.ts apps/web/src/components/shared/mascot/script.test.ts
git commit -m "feat(mascot): kich ban canh va nhip, noi union MascotState (ADR 016)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Máy trạng thái (`director.ts`)

**Files:**
- Create: `apps/web/src/components/shared/mascot/director.ts`
- Test: `apps/web/src/components/shared/mascot/director.test.ts`

**Interfaces:**
- Consumes: mọi export của `script.ts` (Task 2).
- Produces:
  - `interface DirectorState` (các field bên dưới — chỉ `director.ts` đọc/ghi).
  - `type DirectorInput = { type: 'scene'; scene: MascotScene; celebrate?: boolean } | { type: 'beat'; beat: MascotBeat } | { type: 'tick' } | { type: 'activity' } | { type: 'near'; on: boolean } | { type: 'attention'; on: boolean } | { type: 'hidden' } | { type: 'visible' } | { type: 'reducedMotion'; on: boolean }`
  - `interface DirectorView { state: MascotState; gaze: Gaze | null; blinkNonce: number }`
  - `initDirector(scene: MascotScene, now: number, opts: { reducedMotion: boolean; celebrate?: boolean }): DirectorState`
  - `reduce(s: DirectorState, input: DirectorInput, now: number, rand: number): DirectorState` — `rand` ∈ [0,1) do bên gọi rút sẵn (reducer phải thuần để StrictMode chạy hai lần vẫn ra cùng kết quả).
  - `view(s: DirectorState): DirectorView`
  - `nextDeadline(s: DirectorState): number | null` — mốc thời gian (cùng đồng hồ với `now`) cần gửi `tick`.

- [ ] **Step 1: Viết test thất bại (phần lõi: cảnh, nhịp, ưu tiên)** — `director.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  initDirector,
  nextDeadline,
  reduce,
  view,
  type DirectorInput,
  type DirectorState,
} from './director';
import type { MascotScene } from './script';

const init = (scene: MascotScene, now = 0, opts: { reducedMotion?: boolean; celebrate?: boolean } = {}) =>
  initDirector(scene, now, { reducedMotion: false, ...opts });
const send = (s: DirectorState, input: DirectorInput, now: number, rand = 0) =>
  reduce(s, input, now, rand);
const tick = (s: DirectorState, now: number) => reduce(s, { type: 'tick' }, now, 0);
const stateAt = (s: DirectorState) => view(s).state;

describe('director: cảnh', () => {
  it('diễn chuỗi vào cảnh rồi về nền', () => {
    let s = init('quiz.passed');
    expect(stateAt(s)).toBe('surprised');
    s = tick(s, 400);
    expect(stateAt(s)).toBe('celebrate');
    s = tick(s, 2_599);
    expect(stateAt(s)).toBe('celebrate');
    s = tick(s, 2_600);
    expect(stateAt(s)).toBe('proud');
  });

  it('giảm chuyển động: vào thẳng nền, kể cả ở lần khởi tạo đầu tiên', () => {
    expect(stateAt(init('quiz.passed', 0, { reducedMotion: true }))).toBe('proud');
  });

  it('course.done chỉ ăn mừng khi được yêu cầu', () => {
    expect(stateAt(init('course.done'))).toBe('proud');
    expect(stateAt(init('course.done', 0, { celebrate: true }))).toBe('celebrate');
  });

  it('đổi cảnh cắt ngang màn diễn của cảnh cũ', () => {
    const s = send(init('quiz.passed'), { type: 'scene', scene: 'quiz.answering' }, 100);
    expect(stateAt(s)).toBe('waking');
  });

  it('gửi lại cùng cảnh không diễn lại từ đầu', () => {
    let s = tick(init('quiz.answering'), 700);
    expect(stateAt(s)).toBe('listening');
    s = send(s, { type: 'scene', scene: 'quiz.answering' }, 800);
    expect(stateAt(s)).toBe('listening');
  });

  it('nextDeadline trỏ vào lúc bước diễn kết thúc', () => {
    expect(nextDeadline(init('quiz.passed'))).toBe(400);
  });
});

describe('director: nhịp', () => {
  const answering = () => tick(init('quiz.answering'), 700);

  it('diễn một cách rồi về nền', () => {
    let s = send(answering(), { type: 'beat', beat: 'quiz.answered' }, 1_000, 0);
    expect(stateAt(s)).toBe('happy');
    s = tick(s, 1_500);
    expect(stateAt(s)).toBe('listening');
  });

  it('chặn dồn dập 600ms và không lặp cách vừa diễn', () => {
    let s = send(answering(), { type: 'beat', beat: 'quiz.answered' }, 1_000, 0);
    s = send(s, { type: 'beat', beat: 'quiz.answered' }, 1_300, 0.99);
    expect(stateAt(s)).toBe('happy'); // bị chặn, vẫn là màn đầu
    s = send(s, { type: 'beat', beat: 'quiz.answered' }, 1_600, 0);
    expect(stateAt(s)).toBe('curious'); // rand 0 nhưng không được lặp "happy"
  });

  it('nhịp ưu tiên thấp hơn bị bỏ, không xếp hàng, không tính chặn dồn dập', () => {
    let s = send(answering(), { type: 'beat', beat: 'quiz.allAnswered' }, 1_000);
    expect(stateAt(s)).toBe('excited');
    s = send(s, { type: 'beat', beat: 'quiz.answered' }, 1_100);
    expect(stateAt(s)).toBe('excited');
    s = tick(s, 3_200);
    expect(stateAt(s)).toBe('listening');
    s = send(s, { type: 'beat', beat: 'quiz.answered' }, 3_300, 0);
    expect(stateAt(s)).toBe('happy');
  });

  it('nhịp cùng ưu tiên cắt ngang và tự kết thúc (thử lại vẫn lỗi không kẹt ở thinking)', () => {
    let s = init('error');
    expect(stateAt(s)).toBe('alerting');
    s = send(s, { type: 'beat', beat: 'error.retrying' }, 200);
    expect(stateAt(s)).toBe('thinking');
    expect(nextDeadline(s)).toBe(1_700);
    s = tick(s, 1_700);
    expect(stateAt(s)).toBe('sad');
  });

  it('giảm chuyển động: chuỗi nhiều bước rút về bước cuối', () => {
    let s = send(answering(), { type: 'reducedMotion', on: true }, 800);
    s = send(s, { type: 'beat', beat: 'quiz.allAnswered' }, 1_000);
    expect(stateAt(s)).toBe('happy');
  });

  it('nhịp ngay sau đổi cảnh vẫn diễn', () => {
    let s = init('aiJob.reading');
    s = send(s, { type: 'scene', scene: 'aiJob.writing' }, 5_000);
    s = send(s, { type: 'beat', beat: 'aiJob.stepDone' }, 5_000, 0);
    expect(stateAt(s)).toBe('happy');
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/director.test.ts`
Expected: FAIL, "Failed to resolve import './director'".

- [ ] **Step 3: Viết `director.ts`**
```ts
import type { MascotState } from '../mascot';
import {
  BEATS,
  P,
  RETURNED,
  SCENES,
  TIMING,
  WAKE,
  type Gaze,
  type MascotBeat,
  type MascotScene,
  type Performance,
  type Priority,
  type Step,
} from './script';

/**
 * Máy trạng thái của mascot sống — thuần: không đọc đồng hồ, không gọi Math.random, không đụng DOM.
 * Bên gọi truyền `now` (cùng một đồng hồ, `performance.now()`) và `rand` ∈ [0, 1).
 *
 * Mọi đầu vào đều đi qua `advance` trước: dời màn diễn theo thời gian, ngủ gật, chờ lâu. Nhờ vậy
 * `tick` chỉ là "cho thời gian trôi" và trạng thái luôn đúng với `now` bất kể timer tới sớm hay muộn.
 */

interface Act {
  steps: Performance;
  index: number;
  priority: Priority;
  /** Mốc bước hiện tại kết thúc. */
  until: number;
}

export interface DirectorState {
  scene: MascotScene;
  act: Act | null;
  reducedMotion: boolean;
  lastBeatAt: Partial<Record<MascotBeat, number>>;
  lastVariant: Partial<Record<MascotBeat, number>>;
  lastActivityAt: number;
  mood: 'awake' | 'drowsy' | 'asleep';
  engaged: { near: boolean; attention: boolean };
  /** Cảnh `empty`: đang thức (được con trỏ/nút đánh thức). */
  awake: boolean;
  /** Cảnh `empty`: lúc thứ đánh thức rời đi. */
  releasedAt: number | null;
  hiddenAt: number | null;
  /** Lần cuối AI Job có bước mới (hoặc vào cảnh) — cho "chờ lâu". */
  lastStepAt: number;
  /** Tăng mỗi lần cần chớp mắt; bên render so sánh để gọi `blink()`. */
  blinkNonce: number;
}

export type DirectorInput =
  | { type: 'scene'; scene: MascotScene; celebrate?: boolean }
  | { type: 'beat'; beat: MascotBeat }
  | { type: 'tick' }
  | { type: 'activity' }
  | { type: 'near'; on: boolean }
  | { type: 'attention'; on: boolean }
  | { type: 'hidden' }
  | { type: 'visible' }
  | { type: 'reducedMotion'; on: boolean };

export interface DirectorView {
  state: MascotState;
  /** Hướng nhìn do kịch bản yêu cầu (mức 1 của spec §3.1); null = để tầng sống quyết. */
  gaze: Gaze | null;
  blinkNonce: number;
}

const enterStep = (s: DirectorState, step: Step): DirectorState =>
  step.blink ? { ...s, blinkNonce: s.blinkNonce + 1 } : s;

/** Bắt đầu một màn diễn, hoặc trả null nếu màn đang chạy có ưu tiên cao hơn. */
function startAct(
  s: DirectorState,
  steps: Performance,
  priority: Priority,
  now: number,
): DirectorState | null {
  const first = steps[0];
  if (!first) return null;
  if (s.act && priority < s.act.priority) return null;
  return enterStep({ ...s, act: { steps, index: 0, priority, until: now + first.holdMs } }, first);
}

/** Giảm chuyển động: chuỗi nhiều bước chỉ giữ bước cuối (vẫn là thông tin, bỏ phần trang trí). */
function shorten(steps: Performance, reduced: boolean): Performance {
  const last = steps[steps.length - 1];
  return reduced && last && steps.length > 1 ? [last] : steps;
}

function advance(prev: DirectorState, now: number): DirectorState {
  let s = prev;

  while (s.act && s.act.until <= now) {
    const act: Act = s.act;
    const index = act.index + 1;
    const step = act.steps[index];
    if (!step) {
      s = { ...s, act: null };
      break;
    }
    s = enterStep({ ...s, act: { ...act, index, until: act.until + step.holdMs } }, step);
  }

  const def = SCENES[s.scene];

  if (
    def.awakeState &&
    s.awake &&
    !s.engaged.near &&
    !s.engaged.attention &&
    s.releasedAt !== null &&
    now - s.releasedAt >= TIMING.resleepAfterMs
  ) {
    s = { ...s, awake: false, releasedAt: null };
  }

  if (def.canDoze) {
    const idle = now - s.lastActivityAt;
    const mood =
      idle >= TIMING.sleepAfterMs ? 'asleep' : idle >= TIMING.drowsyAfterMs ? 'drowsy' : s.mood;
    if (mood !== s.mood) s = { ...s, mood };
  }

  if (def.stallMs !== null && !s.act && now - s.lastStepAt >= def.stallMs) {
    const glance: Performance = [
      { state: def.base, holdMs: TIMING.stallHoldMs, gaze: { x: 0, y: 0 }, blink: true },
    ];
    s = startAct({ ...s, lastStepAt: now }, glance, P.step, now) ?? s;
  }

  return s;
}

function enterScene(
  prev: DirectorState,
  scene: MascotScene,
  now: number,
  celebrate: boolean,
): DirectorState {
  const def = SCENES[scene];
  const s: DirectorState = {
    ...prev,
    scene,
    act: null,
    mood: 'awake',
    lastActivityAt: now,
    lastStepAt: now,
    awake: prev.engaged.near || prev.engaged.attention,
    releasedAt: null,
  };
  if (!def.enter || prev.reducedMotion) return s;
  if (def.enterOnRequest && !celebrate) return s;
  return startAct(s, def.enter, def.enterPriority, now) ?? s;
}

function playBeat(prev: DirectorState, beat: MascotBeat, now: number, rand: number): DirectorState {
  const def = BEATS[beat];
  // Bước mới của AI Job luôn tính cho "chờ lâu", kể cả khi màn diễn của nó bị chặn.
  const s = beat === 'aiJob.stepDone' ? { ...prev, lastStepAt: now } : prev;
  const last = s.lastBeatAt[beat];
  if (last !== undefined && now - last < def.cooldownMs) return s;

  const n = def.variants.length;
  const previous = s.lastVariant[beat];
  let index = Math.min(n - 1, Math.floor(rand * n));
  if (n > 1 && previous !== undefined) {
    index = Math.min(n - 2, Math.floor(rand * (n - 1)));
    if (index >= previous) index += 1;
  }
  const variant = def.variants[index];
  if (!variant) return s;

  const started = startAct(s, shorten(variant, s.reducedMotion), def.priority, now);
  if (!started) return s;
  return {
    ...started,
    lastBeatAt: { ...started.lastBeatAt, [beat]: now },
    lastVariant: { ...started.lastVariant, [beat]: index },
  };
}

export function initDirector(
  scene: MascotScene,
  now: number,
  opts: { reducedMotion: boolean; celebrate?: boolean },
): DirectorState {
  const blank: DirectorState = {
    scene,
    act: null,
    reducedMotion: opts.reducedMotion,
    lastBeatAt: {},
    lastVariant: {},
    lastActivityAt: now,
    mood: 'awake',
    engaged: { near: false, attention: false },
    awake: false,
    releasedAt: null,
    hiddenAt: null,
    lastStepAt: now,
    blinkNonce: 0,
  };
  return enterScene(blank, scene, now, opts.celebrate ?? false);
}

export function reduce(
  prev: DirectorState,
  input: DirectorInput,
  now: number,
  rand: number,
): DirectorState {
  const s = advance(prev, now);
  const def = SCENES[s.scene];

  switch (input.type) {
    case 'tick':
      return s;

    case 'scene':
      return input.scene === s.scene ? s : enterScene(s, input.scene, now, input.celebrate ?? false);

    case 'beat':
      return playBeat(s, input.beat, now, rand);

    case 'reducedMotion':
      return { ...s, reducedMotion: input.on };

    case 'activity': {
      const next: DirectorState = { ...s, lastActivityAt: now };
      if (!def.canDoze || s.mood === 'awake') return next;
      const woke: DirectorState = { ...next, mood: 'awake' };
      return startAct(woke, WAKE, P.presence, now) ?? woke;
    }

    case 'near':
    case 'attention': {
      const engaged =
        input.type === 'near'
          ? { ...s.engaged, near: input.on }
          : { ...s.engaged, attention: input.on };
      let next: DirectorState = { ...s, engaged };
      if (!def.awakeState) return next;
      const wasEngaged = s.engaged.near || s.engaged.attention;
      if (engaged.near || engaged.attention) {
        next = { ...next, releasedAt: null };
        if (!s.awake) {
          next = { ...next, awake: true };
          next = startAct(next, WAKE, P.presence, now) ?? next;
        }
      } else if (wasEngaged) {
        next = { ...next, releasedAt: now };
      }
      return next;
    }

    case 'hidden':
      return { ...s, hiddenAt: now };

    case 'visible': {
      if (s.hiddenAt === null) return s;
      const away = now - s.hiddenAt;
      const next: DirectorState = { ...s, hiddenAt: null, lastActivityAt: now, mood: 'awake' };
      if (away <= TIMING.awayLongMs) return { ...next, blinkNonce: next.blinkNonce + 1 };
      return startAct(next, shorten(RETURNED, s.reducedMotion), P.presence, now) ?? next;
    }
  }
}

export function view(s: DirectorState): DirectorView {
  const def = SCENES[s.scene];
  const step = s.act ? s.act.steps[s.act.index] : undefined;
  if (step) return { state: step.state, gaze: step.gaze ?? def.baseGaze ?? null, blinkNonce: s.blinkNonce };

  let state: MascotState = def.base;
  if (def.awakeState) {
    if (s.awake) state = s.engaged.attention && def.attentionState ? def.attentionState : def.awakeState;
  } else if (def.canDoze && s.mood !== 'awake') {
    state = s.mood === 'asleep' ? 'sleeping' : 'drowsy';
  } else if (s.engaged.attention && def.attentionState) {
    state = def.attentionState;
  }
  return { state, gaze: def.baseGaze ?? null, blinkNonce: s.blinkNonce };
}

export function nextDeadline(s: DirectorState): number | null {
  const def = SCENES[s.scene];
  const times: number[] = [];
  if (s.act) times.push(s.act.until);
  if (def.awakeState && s.awake && s.releasedAt !== null) {
    times.push(s.releasedAt + TIMING.resleepAfterMs);
  }
  if (def.canDoze && s.mood !== 'asleep') {
    times.push(s.lastActivityAt + (s.mood === 'awake' ? TIMING.drowsyAfterMs : TIMING.sleepAfterMs));
  }
  if (def.stallMs !== null && !s.act) times.push(s.lastStepAt + def.stallMs);
  return times.length > 0 ? Math.min(...times) : null;
}
```

- [ ] **Step 4: Chạy test lõi, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/director.test.ts`
Expected: PASS (12 test).

- [ ] **Step 5: Thêm test tầng sống** — nối vào cuối `director.test.ts`:
```ts
describe('director: tầng sống', () => {
  it('ngủ gật 90s → drowsy, 180s → sleeping, có thao tác thì thức dậy', () => {
    let s = tick(init('quiz.answering'), 700);
    expect(nextDeadline(s)).toBe(90_000);
    s = tick(s, 90_000);
    expect(stateAt(s)).toBe('drowsy');
    expect(nextDeadline(s)).toBe(180_000);
    s = tick(s, 180_000);
    expect(stateAt(s)).toBe('sleeping');
    expect(nextDeadline(s)).toBeNull();
    s = send(s, { type: 'activity' }, 180_500);
    expect(stateAt(s)).toBe('waking');
    s = tick(s, 181_200);
    expect(stateAt(s)).toBe('listening');
  });

  it('cảnh không có cờ ngủ gật thì không ngủ, không hẹn giờ', () => {
    const s = init('aiJob.queued');
    expect(nextDeadline(s)).toBeNull();
    expect(stateAt(tick(s, 200_000))).toBe('thinking');
    expect(view(s).gaze).toEqual({ x: 0, y: 0.8 });
  });

  it('empty: con trỏ lại gần thì thức, trỏ nút thì tò mò, rời đi 8s thì ngủ lại', () => {
    let s = init('empty');
    expect(stateAt(s)).toBe('sleeping');
    s = send(s, { type: 'near', on: true }, 10);
    expect(stateAt(s)).toBe('waking');
    s = tick(s, 710);
    expect(stateAt(s)).toBe('idle');
    s = send(s, { type: 'attention', on: true }, 800);
    expect(stateAt(s)).toBe('curious');
    s = send(s, { type: 'attention', on: false }, 900);
    s = send(s, { type: 'near', on: false }, 2_000);
    expect(stateAt(tick(s, 9_999))).toBe('idle');
    expect(stateAt(tick(s, 10_000))).toBe('sleeping');
  });

  it('empty: focus bàn phím vào nút một mình cũng đánh thức', () => {
    const s = send(init('empty'), { type: 'attention', on: true }, 0);
    expect(stateAt(s)).toBe('waking');
  });

  it('rời tab ngắn chỉ chớp mắt, rời lâu thì giật mình rồi vui', () => {
    let s = tick(init('quiz.answering'), 700);
    const before = view(s).blinkNonce;
    s = send(s, { type: 'hidden' }, 1_000);
    s = send(s, { type: 'visible' }, 30_000);
    expect(stateAt(s)).toBe('listening');
    expect(view(s).blinkNonce).toBe(before + 1);
    s = send(s, { type: 'hidden' }, 40_000);
    s = send(s, { type: 'visible' }, 110_000);
    expect(stateAt(s)).toBe('surprised');
    s = tick(s, 110_400);
    expect(stateAt(s)).toBe('happy');
    s = tick(s, 111_400);
    expect(stateAt(s)).toBe('listening');
  });

  it('giảm chuyển động: quay lại tab sau lâu chỉ còn bước cuối', () => {
    let s = init('quiz.answering', 0, { reducedMotion: true });
    expect(stateAt(s)).toBe('listening');
    s = send(s, { type: 'hidden' }, 1_000);
    s = send(s, { type: 'visible' }, 70_000);
    expect(stateAt(s)).toBe('happy');
  });

  it('chờ lâu: 20s không có bước mới thì nhìn thẳng + chớp, có bước mới thì đếm lại', () => {
    let s = init('aiJob.writing');
    expect(nextDeadline(s)).toBe(20_000);
    s = tick(s, 20_000);
    expect(view(s)).toEqual({ state: 'writing', gaze: { x: 0, y: 0 }, blinkNonce: 1 });
    s = tick(s, 21_500);
    expect(view(s).gaze).toBeNull();
    s = send(s, { type: 'beat', beat: 'aiJob.stepDone' }, 25_000, 0);
    expect(stateAt(s)).toBe('happy');
    expect(view(tick(s, 44_999)).blinkNonce).toBe(1);
    expect(view(tick(s, 45_000)).blinkNonce).toBe(2);
  });

  it('không có "chờ lâu" khi đang xếp hàng', () => {
    expect(view(tick(init('aiJob.queued'), 60_000)).blinkNonce).toBe(0);
  });
});
```

- [ ] **Step 6: Chạy toàn bộ test director**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/director.test.ts`
Expected: PASS (20 test). Nếu một test tầng sống đỏ, sửa `director.ts` (không sửa kỳ vọng — chúng
chép từ spec §3).

- [ ] **Step 7: Typecheck + lint**

Run: `npm run typecheck --workspace @learn/web && npm run lint --workspace @learn/web`
Expected: exit 0.

- [ ] **Step 8: Commit**
```bash
git add apps/web/src/components/shared/mascot/director.ts apps/web/src/components/shared/mascot/director.test.ts
git commit -m "feat(mascot): may trang thai thuan cho canh, nhip va tang song

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Toán hướng nhìn (`gaze.ts`)

**Files:**
- Create: `apps/web/src/components/shared/mascot/gaze.ts`
- Test: `apps/web/src/components/shared/mascot/gaze.test.ts`

**Interfaces:**
- Consumes: `type Gaze` từ `script.ts`.
- Produces: `interface Point { x; y }`, `REST_GAZE: Gaze`, `rectCenter(r: { left: number; top: number; width: number; height: number }): Point`,
  `aimAt(center: Point, target: Point, size: number): Gaze`, `inRange(center: Point, p: Point, size: number): boolean`,
  `smooth(current: Gaze, target: Gaze, dtMs: number): Gaze`, `changed(a: Gaze, b: Gaze): boolean`,
  `isJump(from: Gaze, to: Gaze): boolean`,
  `pickTarget(i: { reaction: Gaze | null; attention: Gaze | null; pointer: Gaze | null; tracking: boolean; reducedMotion: boolean }): Gaze`.

- [ ] **Step 1: Viết test thất bại** — `gaze.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { REST_GAZE, aimAt, changed, inRange, isJump, pickTarget, rectCenter, smooth } from './gaze';

const C = { x: 100, y: 100 };

describe('gaze', () => {
  it('rectCenter lấy tâm hình chữ nhật', () => {
    expect(rectCenter({ left: 10, top: 20, width: 40, height: 60 })).toEqual({ x: 30, y: 50 });
  });

  it('aimAt: độ lớn tăng tuyến tính, đạt 1 ở 2 × size, y dương là nhìn xuống', () => {
    expect(aimAt(C, { x: 180, y: 100 }, 40)).toEqual({ x: 1, y: 0 });
    expect(aimAt(C, { x: 140, y: 100 }, 40)).toEqual({ x: 0.5, y: 0 });
    expect(aimAt(C, { x: 100, y: 500 }, 40)).toEqual({ x: 0, y: 1 });
    expect(aimAt(C, C, 40)).toEqual({ x: 0, y: 0 });
    const d = aimAt(C, { x: 1_000, y: 1_000 }, 40);
    expect(Math.hypot(d.x, d.y)).toBeCloseTo(1);
  });

  it('inRange: tới đúng 6 × size là trong tầm, xa hơn là ngoài', () => {
    expect(inRange(C, { x: 340, y: 100 }, 40)).toBe(true);
    expect(inRange(C, { x: 341, y: 100 }, 40)).toBe(false);
  });

  it('smooth: dt 0 đứng yên, 150ms đi ~63%, lâu thì tới đích', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 1, y: -1 };
    expect(smooth(from, to, 0)).toEqual(from);
    expect(smooth(from, to, 150).x).toBeCloseTo(1 - Math.exp(-1));
    expect(smooth(from, to, 5_000).x).toBeCloseTo(1);
  });

  it('changed dùng ngưỡng 0,01, isJump dùng ngưỡng 0,8', () => {
    expect(changed({ x: 0, y: 0 }, { x: 0.01, y: 0 })).toBe(false);
    expect(changed({ x: 0, y: 0 }, { x: 0.011, y: 0 })).toBe(true);
    expect(isJump({ x: -0.4, y: 0 }, { x: 0.4, y: 0 })).toBe(false);
    expect(isJump({ x: -0.5, y: 0 }, { x: 0.4, y: 0 })).toBe(true);
  });

  it('pickTarget theo đúng 4 mức ưu tiên', () => {
    const r = { x: 0, y: 0.8 };
    const a = { x: 1, y: 0 };
    const p = { x: -1, y: 0 };
    const base = { reaction: r, attention: a, pointer: p, tracking: true, reducedMotion: false };
    expect(pickTarget(base)).toBe(r);
    expect(pickTarget({ ...base, reaction: null })).toBe(a);
    expect(pickTarget({ ...base, reaction: null, attention: null })).toBe(p);
    expect(pickTarget({ ...base, reaction: null, attention: null, pointer: null })).toBe(REST_GAZE);
  });

  it('pickTarget: tắt theo dõi hoặc giảm chuyển động thì bỏ con trỏ', () => {
    const base = { reaction: null, attention: null, pointer: { x: 1, y: 1 }, tracking: true, reducedMotion: false };
    expect(pickTarget({ ...base, tracking: false })).toBe(REST_GAZE);
    expect(pickTarget({ ...base, reducedMotion: true })).toBe(REST_GAZE);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/gaze.test.ts`
Expected: FAIL, "Failed to resolve import './gaze'".

- [ ] **Step 3: Viết `gaze.ts`**
```ts
import type { Gaze } from './script';

/**
 * Toán hướng nhìn của mascot — spec §3.1. Thuần, không đụng DOM.
 *
 * Vendor đặt mắt đúng giá trị `gaze` truyền vào, không tự làm mượt; nên việc làm mượt nằm ở đây.
 */

export interface Point {
  x: number;
  y: number;
}

/** Bằng `DEFAULT_GAZE` của vendor: cố ý lệch khỏi tâm, vì nhìn thẳng tâm trông như trừng mắt. */
export const REST_GAZE: Gaze = { x: 0.345, y: 0.343 };

const TRACK_RANGE = 6;
const FULL_AT = 2;
const SMOOTH_MS = 150;
const EPSILON = 0.01;
const BLINK_JUMP = 0.8;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

export const rectCenter = (r: { left: number; top: number; width: number; height: number }): Point => ({
  x: r.left + r.width / 2,
  y: r.top + r.height / 2,
});

export function aimAt(center: Point, target: Point, size: number): Gaze {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return { x: 0, y: 0 };
  const magnitude = Math.min(1, dist / (FULL_AT * size));
  return { x: clamp((dx / dist) * magnitude), y: clamp((dy / dist) * magnitude) };
}

export const inRange = (center: Point, p: Point, size: number): boolean =>
  Math.hypot(p.x - center.x, p.y - center.y) <= TRACK_RANGE * size;

export function smooth(current: Gaze, target: Gaze, dtMs: number): Gaze {
  const k = 1 - Math.exp(-Math.max(0, dtMs) / SMOOTH_MS);
  return { x: current.x + (target.x - current.x) * k, y: current.y + (target.y - current.y) * k };
}

export const changed = (a: Gaze, b: Gaze): boolean =>
  Math.abs(a.x - b.x) > EPSILON || Math.abs(a.y - b.y) > EPSILON;

export const isJump = (from: Gaze, to: Gaze): boolean =>
  Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) > BLINK_JUMP;

/** Mức 1 → 4 của spec §3.1; mức trên thắng. */
export function pickTarget(i: {
  reaction: Gaze | null;
  attention: Gaze | null;
  pointer: Gaze | null;
  tracking: boolean;
  reducedMotion: boolean;
}): Gaze {
  if (i.reaction) return i.reaction;
  if (i.attention) return i.attention;
  if (i.pointer && i.tracking && !i.reducedMotion) return i.pointer;
  return REST_GAZE;
}
```

- [ ] **Step 4: Chạy, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/gaze.test.ts`
Expected: PASS (7 test).

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/shared/mascot/gaze.ts apps/web/src/components/shared/mascot/gaze.test.ts
git commit -m "feat(mascot): toan huong nhin thuan (theo con tro, lam muot, chop khi doi dich xa)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Controller phát nhịp (`controller.ts`)

**Files:**
- Create: `apps/web/src/components/shared/mascot/controller.ts`
- Test: `apps/web/src/components/shared/mascot/controller.test.ts`

**Interfaces:**
- Consumes: `type MascotBeat` từ `script.ts`.
- Produces: `interface MascotController { beat(b: MascotBeat): void; subscribe(fn: (b: MascotBeat) => void): () => void }`,
  `createMascotController(): MascotController`, `useMascotController(): MascotController` (ổn định suốt vòng đời component).

- [ ] **Step 1: Viết test thất bại** — `controller.test.ts`:
```ts
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createMascotController, type MascotController } from './controller';
import type { MascotBeat } from './script';

describe('controller', () => {
  it('đẩy nhịp tới người đăng ký, huỷ đăng ký thì thôi nhận', () => {
    const c = createMascotController();
    const fn = vi.fn();
    const off = c.subscribe(fn);
    c.beat('quiz.answered');
    off();
    c.beat('quiz.allAnswered');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('quiz.answered');
  });

  it('bắn nhịp khi chưa ai đăng ký thì bỏ qua, không ném lỗi', () => {
    expect(() => createMascotController().beat('error.retrying')).not.toThrow();
  });

  it('nhịp chỉ có tên, không mang dữ liệu (không thể lộ đúng/sai)', () => {
    expectTypeOf<Parameters<MascotController['beat']>>().toEqualTypeOf<[MascotBeat]>();
  });
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/controller.test.ts`
Expected: FAIL, "Failed to resolve import './controller'".

- [ ] **Step 3: Viết `controller.ts`**
```ts
import { useState } from 'react';
import type { MascotBeat } from './script';

/**
 * Kênh phát nhịp từ trang tới `<LiveMascot>` — cố ý **không** có state React: trang bắn nhịp mà không
 * tự render lại; trạng thái sống (ánh mắt 60 fps) nằm trọn trong `<LiveMascot>`.
 */
export interface MascotController {
  beat(b: MascotBeat): void;
  subscribe(fn: (b: MascotBeat) => void): () => void;
}

export function createMascotController(): MascotController {
  const listeners = new Set<(b: MascotBeat) => void>();
  return {
    beat(b) {
      for (const fn of listeners) fn(b);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}

export function useMascotController(): MascotController {
  const [controller] = useState(createMascotController);
  return controller;
}
```

- [ ] **Step 4: Chạy, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/components/shared/mascot/controller.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/shared/mascot/controller.ts apps/web/src/components/shared/mascot/controller.test.ts
git commit -m "feat(mascot): controller phat nhip khong giu state React

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `<LiveMascot>`, props mới cho wrapper, sân thử ở `/dev/ui`

**Files:**
- Modify: `apps/web/src/components/shared/mascot.tsx` (props `gaze`, `paused`, `handleRef`; kiểu dynamic)
- Create: `apps/web/src/components/shared/mascot/live-mascot.tsx`
- Create: `apps/web/src/app/dev/ui/mascot-playground.tsx`
- Modify: `apps/web/src/app/dev/ui/page.tsx` (thêm Section "Mascot sống" sau Section `states`)

**Interfaces:**
- Consumes: `initDirector/reduce/view/nextDeadline/DirectorInput/DirectorState` (Task 3), mọi hàm
  của `gaze.ts` (Task 4), `MascotController` (Task 5), `MascotScene/Gaze/SCENES/BEATS` (Task 2).
- Produces:
  - `Mascot` nhận thêm `gaze?: Gaze`, `paused?: boolean`, `handleRef?: React.Ref<CircleAvatarHandle>`.
  - `LiveMascot(props: { scene: MascotScene; controller?: MascotController; attentionRef?: React.RefObject<HTMLElement | null>; size: number; tracking?: boolean; celebrateOnEnter?: boolean; reducedMotion?: boolean; className?: string })`.
    `attentionRef` trỏ vào **phần tử bọc** nút hành động, phải có mặt ngay lần mount.

- [ ] **Step 1: Mở rộng wrapper `Mascot`** — trong `components/shared/mascot.tsx`:
  thêm import kiểu và đổi khai báo dynamic:
```ts
import type { CircleAvatarHandle, CircleAvatarProps } from './mascot/CircleAvatar';
import type { Gaze } from './mascot/script';

const CircleAvatar = dynamic<CircleAvatarProps & { ref?: React.Ref<CircleAvatarHandle> }>(
  () => import('./mascot/CircleAvatar'),
  { ssr: false, loading: () => null },
);
```
  (giữ nguyên comment khối phía trên). Thay chữ ký và phần render của `Mascot`:
```tsx
export function Mascot({
  state,
  size = 96,
  /** Ghim một biểu cảm cố định thay vì để nó tự đổi. */
  expression,
  /** Hướng nhìn, mỗi trục -1…1. Bỏ trống = hướng nghỉ của vendor. */
  gaze,
  /** Dừng vòng vẽ, ví dụ khi mascot ra khỏi màn hình. */
  paused,
  /** Ref lệnh của vendor (`blink`, `spin`, `setExpression`) — React 19 chuyển `ref` qua `next/dynamic`. */
  handleRef,
  className,
}: {
  state: MascotState;
  size?: number;
  expression?: number;
  gaze?: Gaze;
  paused?: boolean;
  handleRef?: React.Ref<CircleAvatarHandle>;
  className?: string;
}) {
  const { resolved } = useTheme();
  const dark = resolved === 'dark';
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 select-none', className)}
      style={{ width: size, height: size }}
    >
      <CircleAvatar
        ref={handleRef}
        state={state}
        size={size}
        expression={expression}
        gaze={gaze}
        paused={paused}
        gradient={dark ? BODY_DARK : BODY_LIGHT}
        eyeColor={dark ? BLACK : WHITE}
        effects={false}
      />
    </span>
  );
}
```
  Nếu typecheck báo `CircleAvatarProps['state']` không nhận `MascotState`: không xảy ra (vendor
  nhận `CircleState` rộng hơn). Nếu báo `ref` không hợp lệ, giữ kiểu generic như trên — đó chính là
  lý do khai báo nó.

- [ ] **Step 2: Viết `live-mascot.tsx`**
```tsx
'use client';

import { useCallback, useEffect, useReducer, useRef, useState, type RefObject } from 'react';
import { Mascot } from '../mascot';
import type { CircleAvatarHandle } from './CircleAvatar';
import type { MascotController } from './controller';
import {
  initDirector,
  nextDeadline,
  reduce,
  view,
  type DirectorInput,
  type DirectorState,
} from './director';
import { REST_GAZE, aimAt, changed, inRange, isJump, pickTarget, rectCenter, smooth, type Point } from './gaze';
import type { Gaze, MascotScene } from './script';

/**
 * Mascot sống — ADR 016, spec docs/superpowers/specs/2026-09-28-mascot-song-design.md.
 *
 * Nối máy trạng thái thuần (`director.ts`) và toán ánh mắt (`gaze.ts`) vào DOM. Mọi trạng thái sống
 * nằm trong component này để ánh mắt 60 fps chỉ render lại đúng nó, không render lại trang.
 */

type Action = { input: DirectorInput; now: number; rand: number };

const clock = () => performance.now();

const reducer = (s: DirectorState, a: Action) => reduce(s, a.input, a.now, a.rand);

/** Đọc đồng bộ để chuỗi vào cảnh không chạy dù một khung hình khi máy đã bật giảm chuyển động. */
function systemReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function useSystemReducedMotion(): boolean {
  const [on, setOn] = useState(systemReducedMotion);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setOn(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return on;
}

const ACTIVITY_EVENTS = ['pointermove', 'keydown', 'scroll', 'touchstart'] as const;
const ACTIVITY_THROTTLE_MS = 500;

export function LiveMascot({
  scene,
  controller,
  attentionRef,
  size,
  tracking = true,
  celebrateOnEnter = false,
  reducedMotion,
  className,
}: {
  scene: MascotScene;
  controller?: MascotController;
  /** Phần tử bọc nút hành động; mascot nhìn nút đang được trỏ/focus. Phải có mặt ngay lần mount. */
  attentionRef?: RefObject<HTMLElement | null>;
  size: number;
  /** Nhìn theo con trỏ. Mỗi màn chỉ một mascot được bật (UI-GUIDE §7). */
  tracking?: boolean;
  celebrateOnEnter?: boolean;
  /** Ép giảm chuyển động (dùng ở /dev/ui); bỏ trống = theo hệ điều hành. */
  reducedMotion?: boolean;
  className?: string;
}) {
  const systemReduced = useSystemReducedMotion();
  const reduced = reducedMotion ?? systemReduced;

  const [director, dispatchRaw] = useReducer(reducer, undefined, () =>
    initDirector(scene, clock(), {
      reducedMotion: reducedMotion ?? systemReducedMotion(),
      celebrate: celebrateOnEnter,
    }),
  );
  const dispatch = useCallback(
    (input: DirectorInput) => dispatchRaw({ input, now: clock(), rand: Math.random() }),
    [],
  );
  const v = view(director);

  /* ------------------------------------------------ đầu vào cho director */

  useEffect(() => {
    dispatch({ type: 'scene', scene, celebrate: celebrateOnEnter });
  }, [scene, celebrateOnEnter, dispatch]);

  useEffect(() => {
    dispatch({ type: 'reducedMotion', on: reduced });
  }, [reduced, dispatch]);

  useEffect(
    () => controller?.subscribe((beat) => dispatch({ type: 'beat', beat })),
    [controller, dispatch],
  );

  useEffect(() => {
    const at = nextDeadline(director);
    if (at === null) return;
    const t = setTimeout(() => dispatch({ type: 'tick' }), Math.max(0, at - clock()) + 1);
    return () => clearTimeout(t);
  }, [director, dispatch]);

  useEffect(() => {
    const onVisibility = () =>
      dispatch({ type: document.visibilityState === 'hidden' ? 'hidden' : 'visible' });
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [dispatch]);

  useEffect(() => {
    let last = -Infinity;
    const onActivity = () => {
      const t = clock();
      if (t - last < ACTIVITY_THROTTLE_MS) return;
      last = t;
      dispatch({ type: 'activity' });
    };
    for (const e of ACTIVITY_EVENTS) document.addEventListener(e, onActivity, { passive: true });
    return () => {
      for (const e of ACTIVITY_EVENTS) document.removeEventListener(e, onActivity);
    };
  }, [dispatch]);

  /* ------------------------------------------------ đang được nhìn thấy */

  const wrapRef = useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? true));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* ------------------------------------------------ mục tiêu chú ý */

  const [attentionEl, setAttentionEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const box = attentionRef?.current;
    if (!box) return;
    const actionable = (t: EventTarget | null) => {
      const el = t instanceof Element ? t.closest<HTMLElement>('button, a, [role="button"]') : null;
      return el && box.contains(el) ? el : null;
    };
    const onEnter = (e: Event) => {
      const el = actionable(e.target);
      if (el) setAttentionEl(el);
    };
    const onLeave = (e: Event) => {
      const related = (e as PointerEvent | FocusEvent).relatedTarget;
      setAttentionEl(actionable(related));
    };
    box.addEventListener('pointerover', onEnter);
    box.addEventListener('focusin', onEnter);
    box.addEventListener('pointerout', onLeave);
    box.addEventListener('focusout', onLeave);
    return () => {
      box.removeEventListener('pointerover', onEnter);
      box.removeEventListener('focusin', onEnter);
      box.removeEventListener('pointerout', onLeave);
      box.removeEventListener('focusout', onLeave);
    };
  }, [attentionRef]);

  useEffect(() => {
    dispatch({ type: 'attention', on: attentionEl !== null });
  }, [attentionEl, dispatch]);

  /* ------------------------------------------------ ánh mắt */

  const handleRef = useRef<CircleAvatarHandle>(null);
  const [gaze, setGaze] = useState<Gaze>(REST_GAZE);
  const gazeRef = useRef<Gaze>(REST_GAZE);
  const inputs = useRef({
    reaction: null as Gaze | null,
    attentionEl: null as HTMLElement | null,
    pointer: null as Point | null,
    tracking,
    reduced,
    size,
  });
  const loop = useRef({ frame: 0, last: 0, lastTarget: REST_GAZE, near: false });

  /** Chạy vòng làm mượt cho tới khi ánh mắt tới đích rồi tự dừng. */
  const kick = useCallback(() => {
    const L = loop.current;
    if (L.frame) return;
    L.last = clock();
    const frame = () => {
      L.frame = 0;
      const el = wrapRef.current;
      if (!el) return;
      const t = clock();
      const dt = t - L.last;
      L.last = t;
      const i = inputs.current;
      const center = rectCenter(el.getBoundingClientRect());
      const near = Boolean(i.pointer && inRange(center, i.pointer, i.size));
      if (near !== L.near) {
        L.near = near;
        dispatch({ type: 'near', on: near });
      }
      const target = pickTarget({
        reaction: i.reaction,
        attention: i.attentionEl
          ? aimAt(center, rectCenter(i.attentionEl.getBoundingClientRect()), i.size)
          : null,
        pointer: i.pointer && near ? aimAt(center, i.pointer, i.size) : null,
        tracking: i.tracking,
        reducedMotion: i.reduced,
      });
      if (isJump(L.lastTarget, target)) handleRef.current?.blink();
      L.lastTarget = target;
      const current = gazeRef.current;
      const next = i.reduced ? target : smooth(current, target, dt);
      if (changed(current, next)) {
        gazeRef.current = next;
        setGaze(next);
      }
      if (changed(next, target)) L.frame = requestAnimationFrame(frame);
    };
    L.frame = requestAnimationFrame(frame);
  }, [dispatch]);

  useEffect(() => () => cancelAnimationFrame(loop.current.frame), []);

  useEffect(() => {
    inputs.current = { ...inputs.current, reaction: v.gaze, attentionEl, tracking, reduced, size };
    kick();
  }, [v.gaze, attentionEl, tracking, reduced, size, kick]);

  useEffect(() => {
    if (!onScreen || !tracking || reduced) {
      inputs.current.pointer = null;
      kick();
      return;
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      inputs.current.pointer = { x: e.clientX, y: e.clientY };
      kick();
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      inputs.current.pointer = null;
    };
  }, [onScreen, tracking, reduced, kick]);

  /* ------------------------------------------------ chớp mắt do kịch bản */

  useEffect(() => {
    if (v.blinkNonce > 0) handleRef.current?.blink();
  }, [v.blinkNonce]);

  return (
    <span ref={wrapRef} className="inline-block shrink-0">
      <Mascot
        state={v.state}
        size={size}
        gaze={gaze}
        paused={!onScreen}
        handleRef={handleRef}
        className={className}
      />
    </span>
  );
}
```

- [ ] **Step 3: Sân thử** — tạo `app/dev/ui/mascot-playground.tsx`:
```tsx
'use client';

import { useRef, useState } from 'react';
import { Mascot } from '@/components/shared/mascot';
import type { CircleAvatarHandle } from '@/components/shared/mascot/CircleAvatar';
import { useMascotController } from '@/components/shared/mascot/controller';
import { LiveMascot } from '@/components/shared/mascot/live-mascot';
import { BEATS, SCENES, type MascotBeat, type MascotScene } from '@/components/shared/mascot/script';
import { Button, Card } from '@/components/ui';

const SCENE_LIST = Object.keys(SCENES) as MascotScene[];
const BEAT_LIST = Object.keys(BEATS) as MascotBeat[];

/** Xem toàn bộ tính cách mascot sống mà không cần backend (spec §6). */
export function MascotPlayground() {
  const mascot = useMascotController();
  const [scene, setScene] = useState<MascotScene>('empty');
  const [reduced, setReduced] = useState(false);
  const [celebrate, setCelebrate] = useState(true);
  const [run, setRun] = useState(0);
  const attentionRef = useRef<HTMLDivElement>(null);
  const probe = useRef<CircleAvatarHandle>(null);
  const [probeResult, setProbeResult] = useState('Chưa thử');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <Card className="flex flex-col items-center gap-4 p-6">
        <LiveMascot
          key={run}
          controller={mascot}
          scene={scene}
          size={160}
          celebrateOnEnter={celebrate}
          reducedMotion={reduced}
          attentionRef={attentionRef}
        />
        <p className="font-mono text-xs text-fg-subtle">{scene}</p>
        <div ref={attentionRef}>
          <Button size="sm" variant="secondary">
            Nút hành động
          </Button>
        </div>
      </Card>

      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg">Cảnh</legend>
          <div className="flex flex-wrap gap-2">
            {SCENE_LIST.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === scene ? 'primary' : 'secondary'}
                aria-pressed={s === scene}
                onClick={() => setScene(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-fg">Nhịp</legend>
          <div className="flex flex-wrap gap-2">
            {BEAT_LIST.map((b) => (
              <Button key={b} size="sm" variant="secondary" onClick={() => mascot.beat(b)}>
                {b}
              </Button>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4 text-sm text-fg">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} />
            Giảm chuyển động
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={celebrate}
              onChange={(e) => setCelebrate(e.target.checked)}
            />
            Ăn mừng khi vào course.done
          </label>
          <Button size="sm" variant="ghost" onClick={() => setRun((n) => n + 1)}>
            Diễn lại từ đầu
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Mascot state="idle" size={48} handleRef={probe} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (probe.current) {
                probe.current.blink();
                setProbeResult('Ref lệnh đã gắn, vừa gọi blink()');
              } else {
                setProbeResult('Ref lệnh chưa gắn');
              }
            }}
          >
            Thử blink() qua next/dynamic
          </Button>
          <span className="text-sm text-fg-subtle">{probeResult}</span>
        </div>
      </div>
    </div>
  );
}
```
  Trong `app/dev/ui/page.tsx`: thêm `import { MascotPlayground } from './mascot-playground';` cạnh
  các import, và ngay **sau** `</Section>` của `<Section id="states" …>` thêm:
```tsx
        <Section id="mascot" title="Mascot sống">
          <MascotPlayground />
        </Section>
```

- [ ] **Step 4: Typecheck + lint + test**

Run: `npm run typecheck --workspace @learn/web && npm run lint --workspace @learn/web && npm run test --workspace @learn/web`
Expected: exit 0. Nếu lint `react-hooks/exhaustive-deps` phàn nàn về `inputs.current` trong cleanup,
giữ nguyên logic, chép ref vào biến cục bộ đầu effect như lint gợi ý.

- [ ] **Step 5: Kiểm chứng trên trình duyệt** — `preview_start` với `{ name: "web" }` (đã có trong
  `.claude/launch.json`, không cần docker), mở `http://localhost:3000/dev/ui#mascot`:
  1. Bấm "Thử blink() qua next/dynamic" → chữ phải là `Ref lệnh đã gắn, vừa gọi blink()`. Nếu
     `Ref lệnh chưa gắn`: đổi `CircleAvatar` trong `mascot.tsx` sang
     `const CircleAvatar = lazy(() => import('./mascot/CircleAvatar'))` bọc `<Suspense fallback={null}>`
     và chỉ render sau khi mount (`const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])`),
     rồi thử lại.
  2. Bấm lần lượt 14 cảnh, rê chuột quanh mascot, trỏ và tab vào "Nút hành động", bắn từng nhịp. Đối
     chiếu với bảng spec §2 và §3.7. `read_console_messages` với `onlyErrors: true` → rỗng.
  3. **Soát đơn sắc** ở cả tông sáng và tối (nút đổi tông góc phải), `computer screenshot` từng cảnh
     `aiJob.reading` (`searching`), `aiJob.writing` (`writing`), `aiJob.cancelled` (`powering-down`) và
     nhịp `quiz.allAnswered` (`excited`). State nào có vệt/hạt lạ, thân biến mất hoặc méo khi tắt hiệu
     ứng thì sửa `script.ts` theo bảng dự phòng spec §4.7: `searching`→`thinking` (cảnh
     `aiJob.reading.base`), `writing`→`working` (`aiJob.writing.base`), `powering-down` → xoá `enter`
     của `aiJob.cancelled`, `excited`→`happy` (bước đầu của `quiz.allAnswered`), rồi chạy lại test.
  4. Tick "Giảm chuyển động" → mascot thôi nhìn theo con trỏ; `quiz.passed` vào thẳng `proud`.
  5. Cuộn mục mascot ra khỏi màn hình, chạy trong `javascript_tool`:
     `[...document.querySelectorAll('#mascot svg')].length` để chắc đang có mascot, rồi xác nhận vòng
     vẽ dừng bằng cách đo: `(() => { let n = 0; const o = new MutationObserver(() => n++); o.observe(document.querySelector('#mascot svg'), { attributes: true, subtree: true }); return new Promise(r => setTimeout(() => { o.disconnect(); r(n); }, 1000)); })()`
     → `0` khi đã cuộn khuất, > 0 khi cuộn lại vào.
  6. `computer screenshot` sân thử ở tông sáng làm bằng chứng.

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/components/shared/mascot.tsx apps/web/src/components/shared/mascot/live-mascot.tsx apps/web/src/app/dev/ui/mascot-playground.tsx apps/web/src/app/dev/ui/page.tsx apps/web/src/components/shared/mascot/script.ts
git commit -m "feat(mascot): LiveMascot noi director va anh mat vao DOM, san thu o /dev/ui

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Màn trống và màn lỗi (`states.tsx`)

**Files:**
- Modify: `apps/web/src/components/ui/states.tsx`

**Interfaces:**
- Consumes: `LiveMascot` (Task 6), `useMascotController` (Task 5).
- Produces: `EmptyState` **bỏ** prop `mascot` (không nơi nào truyền — đã `grep "mascot=" apps/web/src`
  ra rỗng); `ErrorState` giữ nguyên props.

- [ ] **Step 1: Xác nhận không ai truyền `mascot=`**

Run: `grep -rn "mascot=" apps/web/src --include=*.tsx`
Expected: không có dòng nào. Nếu có, đổi nơi đó bỏ prop trước.

- [ ] **Step 2: Sửa `states.tsx`**
  - Dòng đầu file thêm `'use client';` (ErrorState giờ dùng hook) và thay import mascot:
```ts
'use client';

import { useRef } from 'react';
import { useMascotController } from '@/components/shared/mascot/controller';
import { LiveMascot } from '@/components/shared/mascot/live-mascot';
```
  - Sửa comment đầu file: "Loading dùng skeleton, không dùng mascot — HANDBOOK §13.1 `[SPEC]` giới hạn
    vị trí mascot (ADR 016)."
  - `EmptyState`: xoá `mascot = 'sleeping',` và `mascot?: MascotState;`; đầu thân hàm thêm
    `const actionsRef = useRef<HTMLDivElement>(null);`.
    Nhánh compact: `<Mascot state={mascot} size={48} />` →
    `<LiveMascot scene="empty" size={48} tracking={false} attentionRef={actionsRef} />`, và
    `<div className="mt-3 flex flex-wrap gap-2">` → `<div ref={actionsRef} className="mt-3 flex flex-wrap gap-2">`.
    Nhánh mặc định: `<Mascot state={mascot} size={88} />` →
    `<LiveMascot scene="empty" size={88} attentionRef={actionsRef} />`, và
    `<div className="mt-6 flex flex-col gap-2 sm:flex-row">` → `<div ref={actionsRef} className="mt-6 flex flex-col gap-2 sm:flex-row">`.
  - `ErrorState`: đầu thân hàm thêm
```ts
  const mascot = useMascotController();
  const retryRef = useRef<HTMLDivElement>(null);
```
    `<Mascot state="alerting" size={88} />` →
    `<LiveMascot controller={mascot} scene="error" size={88} attentionRef={retryRef} />`, và khối nút:
```tsx
      {onRetry && (
        <div ref={retryRef} className="mt-6">
          <Button
            variant="secondary"
            onClick={() => {
              mascot.beat('error.retrying');
              onRetry();
            }}
          >
            <Icon name="retry" size={16} />
            Thử lại
          </Button>
        </div>
      )}
```

- [ ] **Step 3: Typecheck + lint + test**

Run: `npm run typecheck --workspace @learn/web && npm run lint --workspace @learn/web && npm run test --workspace @learn/web`
Expected: exit 0.

- [ ] **Step 4: Kiểm chứng** — `/dev/ui#states`: EmptyState ngủ; rê chuột lại gần thì thức; trỏ/tab
  vào "Tạo khóa học" thì nhìn nút và tò mò; rời 8 giây thì ngủ lại. Bản compact không nhìn theo con
  trỏ. ErrorState: `alerting` ~1,2 giây rồi `sad`; bấm Thử lại → `thinking` 1,5 giây rồi `sad`.
  Console không lỗi.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/ui/states.tsx
git commit -m "feat(ui): EmptyState va ErrorState dung LiveMascot (canh empty, error)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: AI Job (`ai-job-mascot.ts` + `AiJobProgress`)

**Files:**
- Create: `apps/web/src/features/ai/ai-job-mascot.ts`
- Test: `apps/web/src/features/ai/ai-job-mascot.test.ts`
- Modify: `apps/web/src/features/ai/ai-job-progress.tsx`

**Interfaces:**
- Consumes: `type MascotScene` (Task 2), `LiveMascot` (Task 6), `useMascotController` (Task 5).
- Produces: `interface JobSnapshot { status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'; progress: number; progressLabel: string | null }`,
  `WRITING_FROM = 20`, `aiJobScene(job: JobSnapshot | null, o: { loadFailed: boolean; partial: boolean }): MascotScene`,
  `isStepDone(prev: JobSnapshot | null, next: JobSnapshot): boolean`.

- [ ] **Step 1: Viết test thất bại** — `ai-job-mascot.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { aiJobScene, isStepDone, type JobSnapshot } from './ai-job-mascot';

const job = (status: JobSnapshot['status'], progress = 0, progressLabel: string | null = null): JobSnapshot => ({
  status,
  progress,
  progressLabel,
});
const ok = { loadFailed: false, partial: false };

/**
 * Worker publish 5 (chuẩn bị), 15 (lập outline), rồi 20 + round(xong/tổng × 70) sau mỗi bài
 * (`lesson-generate.processor.ts`).
 */
describe('aiJobScene', () => {
  it('đọc/lập outline trước 20%, viết bài từ 20%', () => {
    expect(aiJobScene(job('RUNNING', 5), ok)).toBe('aiJob.reading');
    expect(aiJobScene(job('RUNNING', 15), ok)).toBe('aiJob.reading');
    expect(aiJobScene(job('RUNNING', 20), ok)).toBe('aiJob.writing');
    expect(aiJobScene(job('RUNNING', 90), ok)).toBe('aiJob.writing');
  });

  it('các trạng thái còn lại', () => {
    expect(aiJobScene(null, ok)).toBe('aiJob.queued');
    expect(aiJobScene(job('QUEUED'), ok)).toBe('aiJob.queued');
    expect(aiJobScene(job('SUCCEEDED', 100), ok)).toBe('aiJob.succeeded');
    expect(aiJobScene(job('SUCCEEDED', 100), { loadFailed: false, partial: true })).toBe('aiJob.partial');
    expect(aiJobScene(job('FAILED'), ok)).toBe('aiJob.failed');
    expect(aiJobScene(job('CANCELLED'), ok)).toBe('aiJob.cancelled');
    expect(aiJobScene(null, { loadFailed: true, partial: false })).toBe('aiJob.failed');
  });
});

describe('isStepDone', () => {
  it('bài đầu xong (15 → 34) là một bước, dù cảnh cũng đổi cùng lúc', () => {
    expect(isStepDone(job('RUNNING', 15, 'Đang lập outline'), job('RUNNING', 34, 'Đã sinh 1/5 bài học'))).toBe(true);
  });

  it('bài tiếp theo xong là một bước', () => {
    expect(isStepDone(job('RUNNING', 34, 'Đã sinh 1/5 bài học'), job('RUNNING', 48, 'Đã sinh 2/5 bài học'))).toBe(true);
  });

  it('không phải bước: lần đọc đầu, polling trả y nguyên, nhãn không đổi, lập outline, đổi trạng thái', () => {
    expect(isStepDone(null, job('RUNNING', 34, 'x'))).toBe(false);
    expect(isStepDone(job('RUNNING', 34, 'x'), job('RUNNING', 34, 'x'))).toBe(false);
    expect(isStepDone(job('RUNNING', 34, 'x'), job('RUNNING', 48, 'x'))).toBe(false);
    expect(isStepDone(job('RUNNING', 5, 'a'), job('RUNNING', 15, 'b'))).toBe(false);
    expect(isStepDone(job('RUNNING', 90, 'a'), job('SUCCEEDED', 100, 'Hoàn tất'))).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/features/ai/ai-job-mascot.test.ts`
Expected: FAIL, "Failed to resolve import './ai-job-mascot'".

- [ ] **Step 3: Viết `ai-job-mascot.ts`**
```ts
import type { MascotScene } from '@/components/shared/mascot/script';

/**
 * Suy cảnh mascot từ AI Job — spec mascot sống §2.1. Tách khỏi component để test không kéo theo
 * React/Next (giống `ai-job-partial.ts`).
 *
 * Worker publish 5 (chuẩn bị dữ liệu), 15 (lập outline), rồi `20 + round(xong/tổng × 70)` sau mỗi bài
 * (`apps/worker/src/processors/lesson-generate.processor.ts`).
 */
export interface JobSnapshot {
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  progress: number;
  progressLabel: string | null;
}

/** Từ mốc này worker đang viết bài; trước đó là đọc tài liệu và lập outline. */
export const WRITING_FROM = 20;

export function aiJobScene(
  job: JobSnapshot | null,
  o: { loadFailed: boolean; partial: boolean },
): MascotScene {
  if (o.loadFailed) return 'aiJob.failed';
  if (!job) return 'aiJob.queued';
  switch (job.status) {
    case 'QUEUED':
      return 'aiJob.queued';
    case 'RUNNING':
      return job.progress >= WRITING_FROM ? 'aiJob.writing' : 'aiJob.reading';
    case 'SUCCEEDED':
      return o.partial ? 'aiJob.partial' : 'aiJob.succeeded';
    case 'CANCELLED':
      return 'aiJob.cancelled';
    case 'FAILED':
      return 'aiJob.failed';
  }
}

/** Một bài vừa sinh xong: cả hai lần đọc đều RUNNING, tiến độ tăng qua mốc viết và nhãn đổi. */
export function isStepDone(prev: JobSnapshot | null, next: JobSnapshot): boolean {
  return (
    prev !== null &&
    prev.status === 'RUNNING' &&
    next.status === 'RUNNING' &&
    next.progress > prev.progress &&
    next.progress > WRITING_FROM &&
    next.progressLabel !== prev.progressLabel
  );
}
```

- [ ] **Step 4: Chạy, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/features/ai/ai-job-mascot.test.ts`
Expected: PASS (5 test).

- [ ] **Step 5: Nối vào `ai-job-progress.tsx`**
  - Import: `import { useEffect } from 'react';` → `import { useEffect, useRef } from 'react';`;
    `import { Mascot } from '@/components/shared/mascot';` →
```ts
import { useMascotController } from '@/components/shared/mascot/controller';
import { LiveMascot } from '@/components/shared/mascot/live-mascot';
import { aiJobScene, isStepDone, type JobSnapshot } from '@/features/ai/ai-job-mascot';
```
  - Ngay sau `const partialFailures = partialFailuresOf(job.data?.error);` thêm:
```ts
  const mascot = useMascotController();
  const scene = aiJobScene(job.data ?? null, {
    loadFailed: job.isError,
    partial: partialFailures.length > 0,
  });
  const prevJob = useRef<JobSnapshot | null>(null);
  useEffect(() => {
    const d = job.data;
    if (!d) return;
    if (isStepDone(prevJob.current, d)) mascot.beat('aiJob.stepDone');
    prevJob.current = d;
  }, [job.data, mascot]);
```
  - Thay **mọi** `<Mascot state={…} size={N} />` trong file (6 chỗ: loading 88, lỗi tải 88,
    đang chạy 96, partial 88, thành công 96, huỷ/thất bại 88) bằng
    `<LiveMascot controller={mascot} scene={scene} size={N} />` với đúng `N` cũ.
  - Sửa comment đầu file: "mỗi trạng thái job dùng một state mascot riêng" →
    "cảnh mascot suy từ trạng thái job (`ai-job-mascot.ts`, ADR 016)". Xoá comment "Huỷ là hành động chủ
    động… không dùng mascot cảnh báo" và thay bằng "Huỷ là hành động chủ động, không phải lỗi: cảnh
    `aiJob.cancelled` (tắt dần rồi nghỉ)."

- [ ] **Step 6: Typecheck + lint + test**

Run: `npm run typecheck --workspace @learn/web && npm run lint --workspace @learn/web && npm run test --workspace @learn/web`
Expected: exit 0. (`job.data` có kiểu `AiJobSummary`, gán được cho `JobSnapshot` vì `status` là cùng
enum `aiJobStatusSchema`.)

- [ ] **Step 7: Commit**
```bash
git add apps/web/src/features/ai/ai-job-mascot.ts apps/web/src/features/ai/ai-job-mascot.test.ts apps/web/src/features/ai/ai-job-progress.tsx
git commit -m "feat(ai): AiJobProgress dung canh mascot va nhip stepDone theo tien do worker

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

> Không chạy AI Job thật để kiểm chứng (tốn tiền API — memory `feedback_paid_api_cheapest_only`).
> Hành vi cảnh đã có test thuần + sân thử `/dev/ui`.

---

### Task 9: Màn luyện tập (`quiz-mascot.ts` + trang practice)

**Files:**
- Create: `apps/web/src/features/learning/quiz-mascot.ts`
- Test: `apps/web/src/features/learning/quiz-mascot.test.ts`
- Modify: `apps/web/src/app/(app)/courses/[courseId]/lessons/[lessonId]/practice/page.tsx`

**Interfaces:**
- Consumes: `type MascotBeat` (Task 2), `LiveMascot` (Task 6), `useMascotController` (Task 5).
- Produces: `quizBeats(prevCount: number, count: number, total: number): MascotBeat[]`.

- [ ] **Step 1: Viết test thất bại** — `quiz-mascot.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { quizBeats } from './quiz-mascot';

describe('quizBeats', () => {
  it('trả lời thêm một câu thì gật', () => {
    expect(quizBeats(0, 1, 5)).toEqual(['quiz.answered']);
    expect(quizBeats(3, 4, 5)).toEqual(['quiz.answered']);
  });

  it('câu cuối cùng thì chỉ hào hứng, không gật chồng lên', () => {
    expect(quizBeats(4, 5, 5)).toEqual(['quiz.allAnswered']);
  });

  it('gõ chữ hay đổi đáp án (số câu không đổi) thì im', () => {
    expect(quizBeats(2, 2, 5)).toEqual([]);
  });

  it('làm lại (số câu về 0) thì im; bài chưa tải (total 0) thì im', () => {
    expect(quizBeats(5, 0, 5)).toEqual([]);
    expect(quizBeats(0, 0, 0)).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/features/learning/quiz-mascot.test.ts`
Expected: FAIL, "Failed to resolve import './quiz-mascot'".

- [ ] **Step 3: Viết `quiz-mascot.ts`**
```ts
import type { MascotBeat } from '@/components/shared/mascot/script';

/**
 * Nhịp mascot khi làm bài — spec mascot sống §2.2. Dựa trên **số câu đã trả lời**, không dựa trên
 * nội dung đáp án: gõ chữ vào câu tự luận không làm mascot gật theo từng phím, và mascot không bao
 * giờ biết đúng/sai trước khi nộp (đáp án đúng chưa tới client).
 */
export function quizBeats(prevCount: number, count: number, total: number): MascotBeat[] {
  if (total <= 0 || count <= prevCount) return [];
  return count >= total ? ['quiz.allAnswered'] : ['quiz.answered'];
}
```

- [ ] **Step 4: Chạy, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/features/learning/quiz-mascot.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Nối vào trang practice**
  - Import: `import { use, useEffect, useState } from 'react';` → `import { use, useEffect, useRef, useState } from 'react';`;
    `import { Mascot } from '@/components/shared/mascot';` →
```ts
import { useMascotController } from '@/components/shared/mascot/controller';
import { LiveMascot } from '@/components/shared/mascot/live-mascot';
import { quizBeats } from '@/features/learning/quiz-mascot';
```
  - Sau dòng `const [missingId, setMissingId] = useState<string | null>(null);` thêm (phải đứng
    trước mọi `return` sớm):
```ts
  const mascot = useMascotController();
  const submitBoxRef = useRef<HTMLDivElement>(null);
  const answeredCount = Object.keys(answers).length;
  const total = exercise.data?.questions.length ?? 0;
  const prevAnswered = useRef(0);
  useEffect(() => {
    for (const beat of quizBeats(prevAnswered.current, answeredCount, total)) mascot.beat(beat);
    prevAnswered.current = answeredCount;
  }, [answeredCount, total, mascot]);
```
  - Xoá hai dòng khai báo cũ phía dưới:
    `const answeredCount = Object.keys(answers).length;` và `const total = data.questions.length;`
    (giờ đã có ở trên; `total` từ `exercise.data` bằng `data.questions.length` vì `data = exercise.data`).
  - Trong thanh nộp bài, đầu `<div className={cn(STICKY_PANEL, 'p-3 pl-4')}>` thêm mascot, và bọc
    nút Nộp:
```tsx
        <div className={cn(STICKY_PANEL, 'p-3 pl-4')}>
          <LiveMascot
            controller={mascot}
            scene={submitExercise.isPending ? 'quiz.submitting' : 'quiz.answering'}
            attentionRef={submitBoxRef}
            size={40}
          />
          <div className="min-w-0 flex-1">
```
    và
```tsx
          <div ref={submitBoxRef}>
            <Button onClick={() => void handleSubmit()} loading={submitExercise.isPending}>
              {submitExercise.isPending ? 'Đang nộp…' : 'Nộp bài'}
            </Button>
          </div>
```
    Nếu `STICKY_PANEL` chưa có `gap-*`/`items-center`, kiểm tra ảnh chụp ở Step 7; khoảng cách
    quanh mascot tối thiểu 25% chiều cao (HANDBOOK §13.4) → dùng `gap-3` nếu thiếu.
  - Trong `ResultScreen`: `<Mascot state={result.passed ? 'celebrate' : 'confused'} size={104} />` →
    `<LiveMascot scene={result.passed ? 'quiz.passed' : 'quiz.failed'} size={104} />`. Sửa comment
    `{/* HANDBOOK §13.2: … */}` thành `{/* HANDBOOK §13.2 + ADR 016: qua bài ăn mừng rồi tự hào; chưa đạt thì khích lệ, không phải lỗi. */}`.

- [ ] **Step 6: Typecheck + lint + test**

Run: `npm run typecheck --workspace @learn/web && npm run lint --workspace @learn/web && npm run test --workspace @learn/web`
Expected: exit 0.

- [ ] **Step 7: Kiểm chứng trên stack thật** — cần docker:
  `docker compose -f infra/docker-compose.yml up -d`, `npm run dev` (web + api + worker), database
  đã seed. Nếu docker không chạy được: dừng bước này, ghi vào STATE là "chưa kiểm chứng trên stack
  thật", báo người dùng, **không** dựng mock tạm trong plan này. Có docker thì: đăng nhập bằng tài
  khoản demo trong seed (qua script/ô đăng nhập của app, không lặp lại mật khẩu trong chat), mở một
  bài có bài tập:
  1. Vào trang → `waking` rồi `listening`. Chọn đáp án câu 1 → một nhịp gật; gõ chữ vào câu tự luận
     → không gật theo phím; trả lời câu cuối → `excited` rồi `happy`.
  2. Nộp → `thinking`; kết quả đạt → `surprised`, `celebrate`, giữ `proud`; chưa đạt → `sad` rồi
     `curious`. Bấm Làm lại → quay về `listening`.
  3. Để yên 90 giây → `drowsy`. Mốc thời gian đã được `director.test.ts` khoá; ở đây chỉ xác nhận
     chuyển trạng thái thật sự xảy ra và console không lỗi.
  4. `resize_window` preset `mobile` → thanh nộp bài không tràn ngang; rồi `preset: desktop`.
  5. `computer screenshot` màn đang làm và màn kết quả.

- [ ] **Step 8: Commit**
```bash
git add apps/web/src/features/learning/quiz-mascot.ts apps/web/src/features/learning/quiz-mascot.test.ts "apps/web/src/app/(app)/courses/[courseId]/lessons/[lessonId]/practice/page.tsx"
git commit -m "feat(learning): mascot song o man luyen tap (dang lam, dang cham, ket qua)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Hoàn thành cả khóa học (`course-celebration.ts` + trang chi tiết khóa)

**Files:**
- Create: `apps/web/src/features/courses/course-celebration.ts`
- Test: `apps/web/src/features/courses/course-celebration.test.ts`
- Modify: `apps/web/src/app/(app)/courses/[courseId]/page.tsx`

**Interfaces:**
- Consumes: `LiveMascot` (Task 6).
- Produces: `celebrationKey(courseId: string): string`,
  `interface KeyValueStore { getItem(k: string): string | null; setItem(k: string, v: string): void }`,
  `claimCourseCelebration(courseId: string, store: KeyValueStore | null): boolean`.

- [ ] **Step 1: Viết test thất bại** — `course-celebration.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { celebrationKey, claimCourseCelebration, type KeyValueStore } from './course-celebration';

const memory = (): KeyValueStore => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
};

describe('claimCourseCelebration', () => {
  it('đúng một lần cho mỗi khóa', () => {
    const store = memory();
    expect(claimCourseCelebration('c1', store)).toBe(true);
    expect(claimCourseCelebration('c1', store)).toBe(false);
    expect(claimCourseCelebration('c2', store)).toBe(true);
    expect(store.getItem(celebrationKey('c1'))).toBe('1');
  });

  it('storage đọc hoặc ghi lỗi (chế độ riêng tư) thì coi như đã ăn mừng', () => {
    const readFails: KeyValueStore = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => undefined,
    };
    const writeFails: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(claimCourseCelebration('c1', readFails)).toBe(false);
    expect(claimCourseCelebration('c1', writeFails)).toBe(false);
    expect(claimCourseCelebration('c1', null)).toBe(false);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận thất bại**

Run: `npm run test --workspace @learn/web -- src/features/courses/course-celebration.test.ts`
Expected: FAIL, "Failed to resolve import './course-celebration'".

- [ ] **Step 3: Viết `course-celebration.ts`**
```ts
/**
 * Mỗi khóa chỉ ăn mừng hoàn thành một lần trên trình duyệt này — spec mascot sống §2.3.
 * Lỗi storage (chế độ riêng tư, hết chỗ) thì coi như đã ăn mừng: thà thiếu một lần còn hơn lặp mãi.
 */
export const celebrationKey = (courseId: string) => `learn.mascot.courseCelebrated.${courseId}`;

export interface KeyValueStore {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export function claimCourseCelebration(courseId: string, store: KeyValueStore | null): boolean {
  if (!store) return false;
  try {
    const key = celebrationKey(courseId);
    if (store.getItem(key) !== null) return false;
    store.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Chạy, xác nhận qua**

Run: `npm run test --workspace @learn/web -- src/features/courses/course-celebration.test.ts`
Expected: PASS (2 test).

- [ ] **Step 5: Nối vào trang chi tiết khóa**
  - Import: `import { use, useRef, useState } from 'react';` → `import { use, useEffect, useRef, useState } from 'react';`,
    thêm:
```ts
import { LiveMascot } from '@/components/shared/mascot/live-mascot';
import { claimCourseCelebration } from '@/features/courses/course-celebration';
```
  - Ngay sau `const completedCount = …;` thêm (trước mọi `return` sớm):
```ts
  const allDone = completedCount === lessonList.length && lessonList.length > 0;
  /** null = chưa quyết; ref chặn StrictMode chạy effect lần hai xoá mất lần ăn mừng đầu. */
  const [celebrate, setCelebrate] = useState<boolean | null>(null);
  const celebrationDecided = useRef<string | null>(null);
  useEffect(() => {
    if (!allDone || celebrationDecided.current === courseId) return;
    celebrationDecided.current = courseId;
    let store: Storage | null = null;
    try {
      store = window.localStorage;
    } catch {
      store = null;
    }
    setCelebrate(claimCourseCelebration(courseId, store));
  }, [allDone, courseId]);
```
  - Xoá dòng `const allDone = completedCount === lessonList.length && lessonList.length > 0;` cũ phía
    dưới (cạnh `resumeLabel`).
  - Trong `<dd className="mt-1 flex items-center gap-3">` của mục "Tiến độ", sau `<ProgressBar …/>`
    (vẫn trong `dd`) thêm:
```tsx
            {allDone && celebrate !== null && (
              <LiveMascot scene="course.done" size={40} tracking={false} celebrateOnEnter={celebrate} />
            )}
```

- [ ] **Step 6: Typecheck + lint + test**

Run: `npm run typecheck --workspace @learn/web && npm run lint --workspace @learn/web && npm run test --workspace @learn/web`
Expected: exit 0.

- [ ] **Step 7: Kiểm chứng trên stack thật** (cùng điều kiện docker như Task 9 Step 7): mở một khóa
  đã xong hết bài → lần đầu `celebrate` rồi `proud`; tải lại trang → vào thẳng `proud`. Trong
  `javascript_tool`: `localStorage.getItem('learn.mascot.courseCelebrated.<courseId>')` → `"1"`. Khóa
  chưa xong → không có mascot ở dòng tiến độ. `computer screenshot`.

- [ ] **Step 8: Commit**
```bash
git add apps/web/src/features/courses/course-celebration.ts apps/web/src/features/courses/course-celebration.test.ts "apps/web/src/app/(app)/courses/[courseId]/page.tsx"
git commit -m "feat(courses): mascot tu hao khi xong ca khoa, an mung mot lan moi khoa

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Kiểm chứng tổng, kích thước, UI-GUIDE, tiến độ dự án

**Files:**
- Modify: `docs/UI-GUIDE.md` (§ bảng ràng buộc dòng ~60, §7 Mascot, §7b dòng cuối)
- Modify: `docs/REQUIREMENTS.md` (NFR-UX-08 → `Có trong MVP` nếu đạt tiêu chí spec §8)
- Modify: `docs/progress/STATE.md`, `docs/progress/CHECKLIST.md`, `docs/progress/session-log.md`

- [ ] **Step 1: Toàn bộ lệnh**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: exit 0 cả workspace.

- [ ] **Step 2: Đo kích thước code mới**

Run (từ gốc repo):
```bash
OUT="$(mktemp -d)/live-mascot.js"
npx esbuild apps/web/src/components/shared/mascot/live-mascot.tsx --bundle --minify --format=esm --jsx=automatic --packages=external --tsconfig=apps/web/tsconfig.json --external:./mascot/CircleAvatar --outfile="$OUT"
gzip -c "$OUT" | wc -c
```
Expected: ≤ 6144 byte. `--packages=external` bỏ React/Next; `--external:./mascot/CircleAvatar` giữ
vendor ~115 KB (nạp qua `import()` động) ngoài phép đo. Con số có kèm `mascot.tsx`, `cn.ts`,
`lib/theme.tsx` (vài trăm byte) nên là cận trên. Vượt thì tìm chỗ phình trong `script.ts`/`director.ts`,
không nới trần khi chưa hỏi người dùng.

- [ ] **Step 3: Ảnh chụp và a11y**
  - `node scripts/capture-ui.mjs /dev/ui` → xem `docs/screenshots/ui/`.
  - Có docker (Task 9 Step 7): `node scripts/audit-a11y.mjs` → exit 0, 0 vi phạm serious/critical
    trên các màn đụng tới (dashboard, courses, …). Tông tối: chạy axe riêng như memory
    `project_frontend_redesign` ghi (script chỉ chạy tông sáng). Không có docker: ghi rõ vào STATE là
    chưa chạy.

- [ ] **Step 4: Viết lại UI-GUIDE §7** — thay toàn bộ nội dung `## 7. Mascot` (tới trước `## 7b`) bằng:
````markdown
## 7. Mascot

`components/shared/mascot.tsx` là wrapper có kiểu chặt quanh mã vendor Blob Studio
(`components/shared/mascot/CircleAvatar.tsx`). Mascot **sống** (ADR 016) đi qua `<LiveMascot>`.

```tsx
const mascot = useMascotController();          // kênh phát nhịp, không có state React
<LiveMascot controller={mascot} scene="quiz.answering" attentionRef={actionsRef} size={40} />
mascot.beat('quiz.answered');
```

- **Cảnh** (`scene`) là tình huống kéo dài; **nhịp** (`beat`) là sự kiện chớp nhoáng. Cả hai khai báo ở
  `components/shared/mascot/script.ts` — muốn đổi tính cách thì sửa đúng file đó (có test khoá
  §13.2 và bảng ưu tiên). Logic ở `director.ts` (thuần, có test).
- **Mỗi màn chỉ một mascot nhìn theo con trỏ.** Mascot phụ: `tracking={false}`.
- `attentionRef` trỏ vào phần tử **bọc** các nút; mascot nhìn nút đang được trỏ hoặc focus.
- Nhịp không mang dữ liệu: mascot không được biết đúng/sai trước khi nộp bài.
- `<Mascot state=…>` tĩnh vẫn dùng được cho chỗ không cần sống.
- **Không sửa tay file vendor.** Muốn đổi thì export lại từ Blob Studio rồi dán lại nguyên khối
  header `@ts-nocheck` (phải đứng **trên** `'use client'`). Xem `docs/adr/006-...`.
- `MascotState` cố tình hẹp hơn 40 state của thư viện — chỉ những state kịch bản dùng.
- Mascot **chỉ trắng và đen** (ADR 015), phẳng: 3 điểm dừng `gradient` cùng một màu, `effects={false}`.
- Giảm chuyển động: vendor tự giữ thân đứng yên; `LiveMascot` tắt nhìn theo con trỏ và rút chuỗi về
  bước cuối.
- Sân thử: `/dev/ui#mascot` (mọi cảnh, mọi nhịp, công tắc giảm chuyển động, kiểm ref lệnh).
````
  Dòng bảng ràng buộc `| Mascot chỉ ở hero · empty state · tiến độ AI Job · lỗi | HANDBOOK §13.1 \`[SPEC]\` |`
  → `| Mascot chỉ ở các vị trí HANDBOOK §13.1 (ADR 016), một mascot nhìn theo con trỏ mỗi màn | HANDBOOK §13.1 \`[SPEC]\` |`.
  Dòng cuối §7b `- Logo ≠ mascot. \`<Mascot>\` vẫn chỉ ở đúng bốn vị trí \`[SPEC]\` §13.1.` →
  `- Logo ≠ mascot. Mascot chỉ ở các vị trí \`[SPEC]\` §13.1.`

- [ ] **Step 5: REQUIREMENTS** — nếu mọi tiêu chí spec §8 đạt (kể cả kiểm chứng stack thật), đổi
  nhãn NFR-UX-08 sang `Có trong MVP`; nếu còn thiếu kiểm chứng stack thật hoặc a11y, giữ
  `Đang phát triển` và ghi rõ thiếu gì.

- [ ] **Step 6: Tiến độ dự án (AGENTS.md, bắt buộc)**
  - `STATE.md`: thêm mục "Mascot sống (ADR 016) — 2026-09-28" ở cuối: đã làm gì, commit nào, cái gì
    chưa kiểm chứng (stack thật, a11y tông tối, state dự phòng đã dùng nếu có), next-action.
  - `CHECKLIST.md`: đánh dấu các dòng mascot đã đạt (chỉ khi tiêu chí thật sự đạt).
  - `session-log.md`: thêm dòng `2026-09-28 · mascot sống: cảnh + nhịp + tầng sống · <số test> test
    xanh, typecheck/lint xanh, <kết quả a11y> · ADR 016, nới §13.1`.

- [ ] **Step 7: Commit**
```bash
git add docs/UI-GUIDE.md docs/REQUIREMENTS.md docs/progress/STATE.md docs/progress/CHECKLIST.md docs/progress/session-log.md
git commit -m "docs: UI-GUIDE muc mascot song, cap nhat STATE/CHECKLIST/session-log

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
