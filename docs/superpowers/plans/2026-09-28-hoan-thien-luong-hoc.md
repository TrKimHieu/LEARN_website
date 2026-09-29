# Hoàn thiện luồng học — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sửa các chỗ gãy và bổ sung tính năng còn thiếu dọc luồng lõi Upload → Sinh bài → Học →
Luyện tập → Tiến trình → Tài khoản, theo phân tích trong spec.

**Architecture:** Hợp đồng trước (`packages/contracts`), rồi API (repository lọc quyền → service
→ controller), worker/`packages/ai` cho phần trích xuất và AI, cuối cùng nối UI bằng primitive có
sẵn. Logic mới viết dưới dạng hàm thuần để unit-test không cần DB.

**Tech Stack:** NestJS 10 · Prisma 6 · BullMQ · Next 15 / React 19 · TanStack Query · Zod 4 ·
vitest · mammoth · jszip · nodemailer.

**Spec:** `docs/superpowers/specs/2026-09-28-hoan-thien-luong-hoc-design.md`

## Global Constraints

- TypeScript `strict`, `noUncheckedIndexedAccess`, không `any`; mọi input ngoài qua Zod.
- Đáp án (`correctAnswer`, `isCorrect`) không có trong bất kỳ response GET exercise nào.
- Truy vấn dữ liệu người dùng lọc quyền sở hữu ở tầng repository.
- UI đơn sắc (ADR 015): chỉ primitive trong `apps/web/src/components/ui`, không thêm màu; chữ hiển
  thị không dùng `—`/`–`, tối đa một `·` mỗi dòng.
- Không commit (working tree đang chứa việc chưa commit của phiên 20–22; commit khi người dùng yêu cầu).
- Test một file: `npx vitest run <đường dẫn>` từ gốc repo.

## Review Focus

- File `.MD`/`.Txt` viết hoa đuôi → vẫn nhận (so khớp đuôi không phân biệt hoa thường).
- Markdown có code chứa `<T>`, `a < b && c > d` trong fence và inline → giữ nguyên sau sanitize.
- Bài học cũ sinh trước thay đổi, chỉ 1 exercise → luồng nộp bài/hoàn thành y như trước.
- `exerciseId` của lesson khác gửi vào submit → 404, không chấm, không ghi.
- Token reset dùng lần hai / hết hạn / sai → cùng một lỗi 400, không lộ lý do cụ thể.

---

### Task 1: MIME theo phần mở rộng (A1)

**Files:** Create `packages/contracts/src/document-types.ts` (+ export ở `index.ts`) · Modify
`packages/contracts/src/document.ts`, `apps/api/src/modules/documents/documents.service.ts`,
`apps/web/src/features/documents/documents-api.ts`, trang `courses/[courseId]/page.tsx` (ACCEPT)
· Test `packages/contracts/src/__tests__/document-types.test.ts`,
`apps/api/src/modules/documents/__tests__/resolve-mime.test.ts`

**Interfaces — Produces:**

- `DOCUMENT_TYPES: ReadonlyArray<{ ext: string; mime: string; label: string; status: 'supported' }>`
- `mimeFromFilename(name: string): string | null` (đuôi không phân biệt hoa thường)
- `DOCUMENT_ACCEPT: string` (vd `.pdf,.txt,.md,.docx,.pptx`)
- API: `resolveUploadMime(filename, declared): { ok: true; mime } | { ok: false; reason }`

- [ ] Test: `.md`→`text/markdown`, `.MD`→`text/markdown`, `notes`→null, `a.exe`→null;
      `resolveUploadMime('x.md','')` ok, `('x.md','application/octet-stream')` ok,
      `('x.md','application/pdf')` lỗi, `('x.exe','')` lỗi.
- [ ] Chạy test → FAIL. Viết code → PASS.
- [ ] Web gửi MIME từ `mimeFromFilename`, PUT kèm header `Content-Type`.

### Task 2: `sanitizeMarkdown` (B2)

**Files:** Create `packages/ai/src/validator/sanitize-markdown.ts` · Modify `validate.ts`
(contentMd dùng hàm mới) · Test `packages/ai/src/__tests__/sanitize-markdown.test.ts`

**Produces:** `sanitizeMarkdown(md: string): string`

- [ ] Test: giữ nguyên fence ` ```ts\nconst m = new Map<string, number>();\nif (a < b && c > d) {}\n``` `;
      giữ inline `` `List<String>` ``; giữ `> trích dẫn` đầu dòng; `a < b` giữ nguyên; xoá
      `<script>alert(1)</script>` cả nội dung; xoá `<div onclick="x">hi</div>` → `hi`;
      `[x](javascript:alert(1))` → link bị vô hiệu (`[x](#)`); `&` không thành `&amp;`.
- [ ] FAIL → code → PASS; chạy lại `validate.test.ts` xanh.

### Task 3: Hiện độ tin cậy (C1)

**Files:** Modify `packages/contracts/src/lesson.ts` (thêm `lessonConfidenceSchema`, trường
`confidence` ở read + summary), `lessons.service.ts`; web: trang đọc bài (khối cảnh báo),
`features/learning/lesson-list.tsx` (nhãn "Cần kiểm tra").

- [ ] Typecheck xanh; kiểm bằng API thật ở Task 12.

### Task 4: Nhiều bài tập mỗi bài học + điểm tốt nhất (D1, D2)

**Files:** Modify `packages/contracts/src/exercise.ts`, `exercise.repository.ts`,
`submission.repository.ts`, `learning-progress.repository.ts`, `exercises.service.ts`,
`learning.controller.ts`; web `learning-api.ts`, trang practice · Test
`apps/api/src/modules/learning/__tests__/lesson-completion.test.ts`

**Produces:**

- `exerciseReadSchema.exercises: Array<{ id; title; orderIndex; difficulty; questionCount; bestScore: number|null; passed: boolean }>`
- `submitExerciseSchema.exerciseId?: uuid`; `submissionSchema.lessonCompleted: boolean`,
  `submissionSchema.exerciseId: string`
- Hàm thuần `isLessonComplete(exercises: {id; passScore}[], bestByExercise: Map<string, number>): boolean`
- Repo `ExerciseRepository.findForLesson(lessonId, exerciseId?)`, `listForLesson(lessonId)`;
  `SubmissionRepository.bestScoresForExercises(userId, exerciseIds, db)`
- `LearningProgressRepository.upsertAfterSubmission(tx, {..., lessonComplete})` (thay `passed`)

- [ ] Test `isLessonComplete`: 1 exercise đạt → true; 2 exercise, 1 đạt → false; điểm đúng bằng
      passScore → đạt; chưa nộp → false; không có exercise → false.
- [ ] FAIL → code → PASS. `findBest` sắp `score desc, attemptNo desc`.
- [ ] Web: `?exercise=` + thanh chọn bài tập + nút "Bài tập tiếp theo".

### Task 5: Lịch sử bấm được + cursor (E1, E2)

**Files:** Modify `packages/contracts/src/progress.ts`, `submission.repository.ts#recent`,
`progress.service.ts#history`, controller; web `learning-api.ts` (useInfiniteQuery), `progress/page.tsx`,
dashboard (nếu dùng history).

**Produces:** `historyItemSchema += courseId, lessonId, exerciseId, passed`;
`historyPageSchema = { items, nextCursor: string|null }`; query `cursor` (uuid, optional).

- [ ] Typecheck xanh; kiểm cursor bằng API thật ở Task 12 (trang 1 + trang 2 không trùng).

### Task 6: Nguồn của bài học (C2)

**Files:** Create contract `lessonSourceSchema` trong `lesson.ts`; Modify `lesson.repository.ts`
(`findSourcesForLesson(lessonId, courseId, chunkIds)` lọc `document.courseId`), `lessons.service.ts`,
controller (`GET courses/:courseId/lessons/:lessonId/sources`); web `learning-api.ts` + khối
"Nguồn trong tài liệu" ở trang đọc bài.

- [ ] Kiểm IDOR ở Task 12: user B gọi sources của lesson user A → 404.

### Task 7: Chunk theo heading (B1)

**Files:** Modify `packages/ai/src/chunker.ts` · Test `packages/ai/src/__tests__/chunker-sections.test.ts`
· Modify `document-extract.processor.ts` (dùng `chunkPages`)

**Produces:** `chunkPages(pages: {pageNumber: number; text: string}[], options?): DocumentChunk[]`;
`detectHeading(line: string): { level: number; text: string } | null`

- [ ] Test: Markdown `# A\n\npara\n\n## B\n\npara` → 2 chunk, path `A` và `A > B`; heading ngay sau
      heading không sinh chunk rỗng; heading trang 1 mang sang chunk trang 2; dòng PDF `Chương 2: Mạng`
      / `2.1 Giao thức HTTP` / `GIỚI THIỆU` nhận là heading, câu thường kết thúc bằng dấu chấm thì không;
      chunk không vắt qua hai mục; mục lớn vẫn cắt theo target tokens; `index` liên tục 0..n-1.
- [ ] FAIL → code → PASS; test chunker cũ vẫn xanh.

### Task 8: Outline bao phủ + độ khó (B1, B3)

**Files:** Modify `packages/ai/src/prompts/outline.ts` (`outline@2`), `prompts/lesson.ts`
(`lesson@3`, `difficulty`), `lesson-generate.processor.ts` (preview 400, truyền difficulty),
`packages/ai/src/__tests__/prompts.test.ts`.

- [ ] Test: outline prompt chứa luật bao phủ + heading path; lesson prompt chứa độ khó đã chọn.
- [ ] Mock LLM vẫn nhận ra prompt outline (giữ chuỗi `DANH SÁCH CHUNK (heading path`).

### Task 9: DOCX/PPTX (A2)

**Files:** Create `apps/worker/src/extraction/office.ts` · Modify `extract-text.ts`, bảng
`DOCUMENT_TYPES` (thêm docx/pptx), `REQUIREMENTS.md` FR-DOC-09 · Test
`apps/worker/src/extraction/__tests__/office.test.ts` (dựng file mẫu bằng jszip ngay trong test)

**Produces:** `extractDocx(bytes): Promise<ExtractResult>`, `extractPptx(bytes): Promise<ExtractResult>`

- [ ] Test: DOCX có Heading1 + đoạn → Markdown `# …`; PPTX 2 slide có title → 2 trang, trang 1
      bắt đầu `# Tiêu đề`; zip không phải office → `UnsupportedFileError`.

### Task 10: Quên mật khẩu (F1)

**Files:** Modify `packages/db/prisma/schema.prisma` + migration mới; Create
`apps/api/src/modules/auth/password-reset.repository.ts`, `apps/api/src/common/mail.service.ts`;
Modify `auth.service.ts`, `auth.controller.ts`, `environment.ts`, `.env.example`,
`packages/contracts/src/auth.ts`, `security.ts` (whitelist public); web `forgot-password-view.tsx`,
Create `app/(auth)/reset-password/page.tsx` + `features/auth/reset-password-view.tsx`.
Test `apps/api/src/modules/auth/__tests__/password-reset.test.ts` (hàm thuần tạo/băm token, hạn).

- [ ] Test token: 64 hex, hash SHA-256 khớp, `isResetTokenUsable` false khi đã dùng/hết hạn.
- [ ] Migration bằng `prisma migrate dev` trên Postgres thật.

### Task 11: Tài liệu yêu cầu

REQUIREMENTS: FR-DOC-09 → Có trong MVP; FR-AI-10 → Có trong MVP; FR-PROGRESS-05/06 → Có trong MVP;
FR-AUTH-07 → Có trong MVP (MAIL_MODE log/smtp); thêm FR-LESSON-12 (nguồn bài học), FR-LESSON-13
(nhiều bài tập); route thật cập nhật.

### Task 12: Kiểm chứng end-to-end

- [ ] `npm run typecheck` · `npm run test` · eslint · `npm run build -w apps/web`.
- [ ] Stack thật (`npm run dev` + docker): chạy luồng ở spec §5 qua API và qua trình duyệt.
- [ ] Cập nhật STATE / CHECKLIST / session-log.
