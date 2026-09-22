# STATE.md — Trạng thái hiện tại của dự án

> Bộ nhớ chính của dự án. Mọi session mới phải đọc file này trước tiên (sau `AGENTS.md`).
> Cập nhật ngay mỗi khi có thay đổi, kể cả giữa phiên.

## Tóm tắt nhanh

| Hạng mục              | Giá trị                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mốc hiện tại**      | **M0, M1, M5 — Hoàn TẤT** ✅. **M2, M3 core đã chạy thật end-to-end qua browser** ✅. **M4 — Hoàn TẤT** ✅. **M6 — nội dung/component/ADR/ảnh chụp UI/Lighthouse/demo CTA đều xong 2026-09-15** ✅, chỉ còn video demo (ngoài phạm vi công cụ hiện có). **Redesign frontend toàn diện 7/7 giai đoạn — Hoàn TẤT 2026-09-19** ✅ (xem mục riêng bên dưới). **Hạ tầng vibe-code giao diện + đợt cải tiến — 2026-09-19** ✅ (`docs/UI-GUIDE.md`, `/dev/ui`, motion/lucide/confetti). **Đợt hoàn thiện UX + a11y — 2026-09-19** ✅ (audit 18 màn thật bằng axe-core: 0 vi phạm WCAG 2.2 AA, từ 85 vi phạm). **Logo đổi sang nhân vật Circle — 2026-09-19** ✅ (ADR 007; còn chờ xác nhận ranh giới logo/mascot của §13.1). **Đợt nâng cấp giao diện 2026-09-22 (branch `redesign/upgrade-2026-09`) — GĐ 1–6/7 xong, GĐ 7 (đánh bóng/dọn dẹp/chụp lại ảnh portfolio) CHƯA làm** ⚠️ (xem mục riêng bên dưới — bắt buộc đọc trước khi tiếp tục). |
| **Tần xuất cập nhật** | Mỗi lần xong 1 mục checklist                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Blocker**           | Không có blocker. **CI đã xanh trở lại 2026-09-19**: 34 lỗi typecheck trong `packages/ai/src/__tests__/` đã sửa (helper `at()` cho `noUncheckedIndexedAccess`), `npm run typecheck` toàn workspace exit 0. Docker Desktop: đã sửa, root cause đầy đủ ở mục "Docker Desktop" bên dưới.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Git**               | `main` đã có commit. Đợt nâng cấp giao diện 2026-09-22 làm trên branch riêng `redesign/upgrade-2026-09` (6 commit, chưa merge — xem mục riêng bên dưới). `main` đang có việc dở của người khác chưa commit (`packages/ai/src/llm/gemini.ts` + liên quan) — **đừng đụng vào**, không phải của đợt này.                                                                                                                                                                                                                                                                                                                                                                                                              |

## Lộ trình tổng thể (HANDBOOK §19)

| Tuần    | Mốc | Nội dung                                             | Trạng thái      |
| ------- | --- | ---------------------------------------------------- | --------------- |
| T0      | M0  | Nền tảng: monorepo, docker, CI, schema v1            | ✅ **HOÀN TẤT** |
| T1–T2   | M1  | Auth backend + frontend, bảo vệ route                | ✅ **HOÀN TẤT** |
| T3–T4   | M2  | Course + Document + trích xuất + chunking            | **ĐANG LÀM**    |
| T5–T7   | M3  | AI pipeline: queue, outline, lesson, validation, SSE | **ĐANG LÀM**    |
| T8–T9   | M4  | Học tương tác + tiến trình                           | ✅ **HOÀN TẤT** |
| T10–T11 | M5  | Subscription + Admin                                 | ✅ **HOÀN TẤT** |
| T12–T14 | M6  | Portfolio website 14 section + DoD                   | **ĐANG LÀM**    |

## Việc đang làm (chi tiết)

**M0 — HOÀN TẤT.** Toàn bộ mục 20.1 đã code xong. Minh chứng đạt mốc (HANDBOOK §19.3-M0):
`npm run typecheck` + `npm run lint` + `npm run test` xanh (38/38 unit test) + API boot lên được,
`GET /api/v1/health` trả `{"status":"ok"}`. Chi tiết các mục còn chờ Docker ở CHECKLIST §20.1.

**M1 — Auth (HANDBOOK §20.2).**

- **Backend — đã kiểm chứng thật với Postgres/Redis (2026-09-14):** register/login/refresh (xoay vòng
  qua cookie httpOnly)/logout (thu hồi refresh token ngay)/me đều hoạt động đúng; rate limit
  5 lần/phút/IP xác nhận bằng test thật (4 lần đầu 401, từ lần 5 → 429).
- **2 bug nghiêm trọng đã tìm và sửa trong lúc kiểm chứng** (chưa từng lộ ra vì chưa ai chạy được với DB
  thật trước đây):
  1. `tsx`/esbuild **không hỗ trợ `emitDecoratorMetadata`** → toàn bộ constructor injection của NestJS
     âm thầm nhận `undefined` cho mọi service (Prisma/Redis/S3...) dù app vẫn boot bình thường và
     `/health` (liveness) vẫn OK — chỉ lộ ra khi gọi endpoint có dùng DI thật. **Đã đổi dev/start runtime
     sang `ts-node` + `tsconfig-paths` + `nodemon`** (xem `apps/api/package.json`, `apps/api/nodemon.json`).
     ⚠️ `npm run build` (dùng `tsup`, cũng esbuild-based) **có khả năng vẫn dính lỗi này cho production
     build** — chưa kiểm chứng, cần xử lý trước khi build production thật (M6 hoặc sớm hơn).
  2. Circular import cấp file `security.ts` ↔ `services.ts` ↔ `security.module.ts` khiến kiểu
     `RedisService` bị hạ thành `Object` trong metadata. Đã sửa: `SecurityModule` import trực tiếp vào
     `AppModule` thay vì qua `CommonModule` (gỡ `imports: [SecurityModule]` khỏi `CommonModule`).
  3. `packages/contracts/package.json` có `"type": "module"` (khác các package khác) → `ts-node` (CJS)
     không `require()` được → đã gỡ field này để nhất quán CommonJS toàn repo.
- **`npm run build` (production) — đã kiểm tra và sửa xong (2026-09-14):** dính đúng lỗi DI y hệt dev
  (`health/ready` báo down hết, register 500) vì `tsup` cũng chạy trên esbuild. Ngoài ra script build cũ
  còn tự nó không chạy được (`--no-external @learn/*` không phải flag hợp lệ ở tsup CLI v8, và
  `@node-rs/argon2` — dependency native của `packages/db` — bị esbuild cố bundle nhầm gây lỗi biên dịch).
  Đã sửa cả 3: tạo `apps/api/tsup.config.ts` (dùng `noExternal`/`external` đúng cách thay vì CLI flag),
  cài `@swc/core` (tsup tự dùng plugin SWC để emit decorator metadata khi phát hiện gói này — đã verify
  bằng cách build lại và test `health/ready` + `register` trên bundle thật, cả 2 đều pass).
- **Frontend — đã kiểm chứng thật qua trình duyệt (2026-09-14):** register → tự vào dashboard → giữ
  session qua reload (refresh cookie) → đăng xuất → đăng nhập lại, tất cả test bằng browser tool thật
  (không phải chỉ curl). AuthProvider, api-client, ProtectedRoute, AppShell hoạt động đúng.
- **Bug tìm thấy trong lúc test UI:** `readError()` ở `apps/web/src/lib/api-client.ts` đọc field
  `message` (không tồn tại trong error envelope thật — API trả `detail`) và gọi `res.json()` **hai lần**
  trên cùng response (lần 2 luôn throw vì body đã đọc hết) → mọi lỗi hiển thị cho người dùng trước giờ
  đều là thông báo fallback chung chung, không phải lỗi thật từ server. Đã sửa: đọc envelope một lần,
  lấy đúng `detail`/`code`/`requestId` (cần cho HANDBOOK §12.3 — màn lỗi phải có `requestId`).

**M2 — Course và Document (HANDBOOK §20.3), đang làm (2026-09-14).**

- **Backend đã có sẵn** (courses + documents module) — **đã kiểm chứng thật lần đầu**: tạo Course,
  xem chi tiết, xin presigned upload URL đều đúng ngay từ đầu.
- **2 bug nghiêm trọng ở luồng upload tài liệu, chỉ lộ ra khi test PUT thật lên MinIO (trước giờ
  chưa ai từng thử — mọi lần trước chỉ dừng ở bước lấy presigned URL, chưa từng PUT thật):**
  1. `S3Client` (apps/api/src/common/services.ts) không set `requestChecksumCalculation`, khiến AWS
     SDK v3 tự chèn `x-amz-checksum-crc32`/`x-amz-sdk-checksum-algorithm` vào presigned URL với giá trị
     rỗng (không có body lúc ký) → PUT thật luôn bị `SignatureDoesNotMatch`. Sửa: thêm
     `requestChecksumCalculation: 'WHEN_REQUIRED'` vào S3Client config.
  2. `documents.service.ts#requestUpload` ký presigned URL với `Content-Length = env.DOCUMENT_MAX_SIZE`
     (25MB cố định) thay vì kích thước file thật (`input.sizeBytes`) → **mọi file không đúng 25MB đều
     upload thất bại** vì Content-Length header lúc PUT không khớp giá trị đã ký. Đây là bug chặn hoàn
     toàn tính năng upload, đã tồn tại từ khi code được viết. Đã sửa: dùng `input.sizeBytes`.
  - Sau khi sửa: test PUT thật lên MinIO qua UI thành công, xác nhận object nằm trong bucket
    (`mc ls`) và `Document.status` chuyển đúng sang `UPLOADED`.
- **Frontend M2 mới xây (2026-09-14):** trang Khóa học (danh sách, đủ 5 trạng thái: loading skeleton/
  empty với mascot `sleeping.svg`/error có `requestId`+nút thử lại/success), trang Tạo khóa học
  (React Hook Form + zodResolver, dùng chung schema `createCourseSchema`), trang chi tiết Course
  (thông tin + danh sách tài liệu + upload file → presigned URL → PUT S3 → confirm). Đã cài
  `@tanstack/react-query` (staleTime 30s theo HANDBOOK §12.2), `react-hook-form`, `@hookform/resolvers`.
  Copy 4 SVG mascot (`sleeping/working/celebrate/alerting`) vào `apps/web/public/mascot/`.
  **Chưa làm:** trang tài liệu riêng (`/documents`), trang generate AI (M3), trang lessons — đúng vì
  các phần đó thuộc M3+.

**M3 — AI Pipeline (HANDBOOK §8, §9), bắt đầu 2026-09-14.**

- **Trước khi bắt đầu, code đã có sẵn nhưng chưa từng chạy được**: queue (`QueueService`), chunker,
  LLM provider abstraction (mock + Anthropic), prompt outline/lesson, validator 4 tầng (schema/luật
  nghiệp vụ/bám nguồn/vệ sinh), AIJob CRUD + SSE endpoint — tất cả đã viết ở apps/api nhưng **không có
  worker nào tiêu thụ queue cả**, nên document-extract/lesson-generate job trước giờ chỉ nằm im trong
  Redis, không bao giờ được xử lý.
- **Đã tạo `apps/worker`** (NestJS standalone theo đúng quyết định HANDBOOK §4.4) — dùng ngay
  `nodemon` + `ts-node` (không dùng `tsx`, tránh lặp lại bug decorator metadata ở M1). Gồm:
  `DocumentExtractProcessor` (trích PDF/TXT/MD → chunk → ghi `DocumentChunk` → cập nhật
  `Document.status`) và `LessonGenerateProcessor` (outline → lesson+exercise song song tối đa
  `AI_MAX_CONCURRENT_CALLS` → validate 4 tầng → ghi `Lesson/Exercise/Question/AnswerOption` trong
  một transaction → cập nhật `AIJob` + publish SSE qua Redis). Tắt êm (SIGTERM/SIGINT chờ job xong).
- **Đã kiểm chứng thật end-to-end** (register → tạo course → upload TXT **và** PDF thật → worker
  trích xuất → generate-lessons → worker sinh outline+lesson qua LLM mock → validate → ghi DB):
  toàn bộ chuỗi chạy đúng, xác nhận bằng query DB trực tiếp (`DocumentChunk`, `AIJob`, `GenerationRun`,
  `Lesson`, `Exercise`, `Question`, `AnswerOption` đều đúng dữ liệu, đúng quan hệ). Tầng 3 (bám nguồn)
  xác nhận hoạt động thật — một lesson bị gắn đúng `confidence=LOW` vì nội dung mock không khớp đủ
  thuật ngữ nguồn.
- **5 bug tìm thấy và sửa khi tích hợp thật lần đầu:**
  1. `pdfjs-dist` v4 chỉ phân phối ESM (`.mjs`) — TypeScript compile CommonJS hạ `import()` thành
     `require()`, không load được (`ERR_REQUIRE_ESM`-kiểu lỗi). Sửa bằng shim
     `new Function('specifier', 'return import(specifier)')` để ép dynamic import thật, né downlevel
     — xem `apps/worker/src/extraction/pdf.ts`.
  2. `MockLlmProvider` (packages/ai) chỉ nhận dạng đúng format prompt của **lesson**, mọi prompt khác
     (kể cả outline) đều rơi vào fallback lesson-shape sai schema. Đã thêm `buildOutline()` nhận dạng
     marker `DANH SÁCH CHUNK` và sinh đúng `OutlineOutput` từ chunk id thật trong prompt.
  3. `ai.service.ts#generateLessons` — filter Prisma trên field `Json` (`inputParams`) truyền object
     trần thay vì bọc `{ equals: ... }`, khiến Prisma hiểu nhầm object là `JsonFilter` và báo
     `Unknown argument`. Đây là lỗi 500 xảy ra ngay lần gọi `generate-lessons` đầu tiên — endpoint này
     chưa từng được test trước đó.
  4. `documents.service.ts` — `ALLOWED_MIME` thiếu `text/markdown` dù HANDBOOK §8.2 yêu cầu hỗ trợ MD;
     đã thêm.
  5. `outlinePrompt()` (packages/ai) thiếu tham số `previousError` mà `lessonPrompt()` đã có — không
     nhất quán cho cơ chế retry kèm mô tả lỗi cụ thể (HANDBOOK §8.5). Đã thêm cho đối xứng.
- **Cố ý CHƯA làm ở bản này** (ghi rõ để không nhầm là đã xong):
  - Trích xuất PPTX (`officeparser`), DOCX (`mammoth`), OCR PDF scan (`tesseract.js`) — hiện
    `ScannedPdfNotSupportedError`/`UnsupportedFileError` báo lỗi rõ ràng thay vì âm thầm sai.
  - Nhận diện heading thật khi chuẩn hoá text (hiện `headingPath` luôn null) và loại mục lục —
    chunk vẫn đúng theo trang, chỉ thiếu heading path.
  - UI hiển thị tiến độ AI Job (mascot `working.svg`, thanh %, nút huỷ) — backend/worker đã publish
    SSE đúng contract, chưa có trang frontend tiêu thụ.
  - Job định kỳ (dọn Document PENDING quá hạn, xoá rawResponseKey cũ, tổng hợp UsageCounter) — HANDBOOK §9.3.
  - Dead-letter queue + trang admin xem/chạy lại job lỗi.
  - Test tự động cho worker (hiện mới test tay qua Postgres/Redis/MinIO thật, chưa có unit/integration test).

**M4 — Học tương tác và tiến trình (HANDBOOK §6.5, §6.6), bắt đầu 2026-09-14.**

- **Backend đã có sẵn từ trước** (lessons/exercises/progress service + controller, 11 unit test chấm
  điểm đã pass) — **đã kiểm chứng thật lần đầu qua browser** end-to-end: đọc bài → làm bài → nộp →
  chấm điểm server-side → cập nhật tiến độ → dashboard/lịch sử cập nhật đúng.
- **3 bug tìm thấy khi tích hợp thật** (do chính worker M3 tạo ra hoặc có sẵn từ trước, chưa ai chạy
  hết luồng để phát hiện):
  1. **Route trùng thật sự:** `CoursesController` và `LearningController` cùng khai báo
     `GET /courses/:id/lessons` (hai path pattern giống hệt nhau) → một trong hai luôn là dead code,
     không bao giờ được gọi tới (Express/Nest chỉ khớp route đăng ký trước). Đã xoá bản trùng ở
     `courses.controller.ts`/`courses.service.ts`, giữ bản đúng theo spec (có kèm tiến trình) ở
     `learning` module.
  2. **`correctAnswer` sai field cho TRUE_FALSE và SHORT_ANSWER/FILL_BLANK** — worker M3
     (`lesson-generate.processor.ts`) lưu `{answer: ...}`/`{modelAnswer: ...}` nhưng
     `exercises.service.ts#gradeAnswer` đọc `correct.value`/`correct.acceptable` → **hai loại câu hỏi
     này trước giờ luôn chấm sai (luôn tính là trả lời sai)**, chỉ MULTIPLE_CHOICE chấm đúng vì nó chấm
     qua `AnswerOption.isCorrect` chứ không qua `correctAnswer`. Đã sửa field cho khớp.
  3. **`activeStreak()` tính sai khi chuỗi đã đứt** — nếu không học hôm nay lẫn hôm qua, hàm vẫn trả về
     `1` thay vì `0` (biến `streak` khởi tạo `1` trước khi kiểm tra ngày có hợp lệ không). Đã sửa.
- **Tính năng còn thiếu, đã thêm:** `POST /courses/:courseId/lessons/:lessonId/start` — trước đây
  không có gì đánh dấu `IN_PROGRESS` khi người dùng đọc bài (chỉ có COMPLETED khi nộp bài đạt), trong
  khi HANDBOOK yêu cầu rõ "đánh dấu bắt đầu và hoàn thành bài". Trang đọc bài tự gọi endpoint này khi
  mount nếu bài ở trạng thái `NOT_STARTED`.
- **Test thật xác nhận đúng các nhánh quan trọng:** nộp bài đúng → 100 điểm, mascot `celebrate`, status
  `COMPLETED`; nộp lại sai → 0 điểm nhưng **`bestScore` giữ nguyên 100, status vẫn `COMPLETED`**
  (không bị hạ cấp), `attemptNo` tăng đúng (1→2) — khớp chính xác yêu cầu "làm lại, giữ điểm cao nhất".
- **Frontend mới xây (2026-09-14):** trang đọc bài (Markdown sanitize 2 lớp — worker sanitize lúc sinh
  - `isomorphic-dompurify` sanitize lại lúc render vì `PATCH /lessons/:id` cho sửa tay không qua
    sanitize của worker — kèm mục lục tự trích từ heading), trang làm bài tập (đủ 4 loại câu hỏi:
    MULTIPLE_CHOICE/TRUE_FALSE/SHORT_ANSWER/FILL_BLANK, màn kết quả có mascot celebrate/sleeping theo
    pass/fail), dashboard tổng quan (số Course/bài hoàn thành/điểm TB/chuỗi ngày — dữ liệu thật, không
    còn placeholder), trang Tiến trình (progress bar per-course + lịch sử làm bài phân trang kiểu
    "xem thêm"). Nút "Sinh bài học bằng AI" ở trang Course (poll thủ công tối đa 30s do **chưa có UI
    SSE** — xem mục còn thiếu ở M3).
- **Cố ý chưa làm:** UI xem/sửa nội dung Lesson (`PATCH /lessons/:id`, C-01), sắp xếp lại thứ tự Lesson
  (C-02), xoá Lesson, guard ADMIN cho các route quản trị, phân trang thật (cursor-based) cho lịch sử —
  hiện dùng "tăng limit" đơn giản thay vì cursor theo đúng HANDBOOK §7.1.
- **Quyết định có chủ đích, lệch spec:** giữ nguyên path lồng nhau `/courses/:id/lessons/:id` (đã có
  sẵn từ trước) thay vì đổi sang `/lessons/:id` phẳng như HANDBOOK §7.2, và chưa thêm
  `/lessons/:id/complete`/`/exercises/:id/submissions`/`/courses/:id/progress`. Lý do: build frontend
  M4 là lúc rẻ nhất để đổi path (chưa có gì phụ thuộc), nhưng đổi toàn bộ route theo spec là refactor
  lớn, rủi ro cao dưới áp lực thời gian — chọn tính năng đúng + test kỹ hơn là path đúng tên. Cần
  quay lại trước khi coi DoD §20.8 là đạt.

**M5 — Subscription và Admin (HANDBOOK §11, §7.2), bắt đầu 2026-09-14.**

- **Backend hầu hết đã có sẵn** (plans/subscription/usage/billing/admin service+controller) —
  **đã kiểm chứng thật lần đầu**: plans, subscription status, usage snapshot, demo checkout, cancel,
  cả 5 endpoint admin (metrics/users/courses/ai-jobs/subscriptions), guard chặn LEARNER (403 thật ở
  server, không chỉ UI) — tất cả đều đúng, kể cả 3 bug đã tìm và sửa dưới đây.
- **4 bug tìm thấy khi tích hợp thật lần đầu:**
  1. **`DOCUMENTS_UPLOADED` không bao giờ tăng** — `documents.service.ts#requestUpload` gọi
     `assertNotExceeded` (kiểm tra trước) nhưng **quên gọi `usage.increment()`** sau khi tạo document,
     khác với `courses.service.ts`/`ai.service.ts` đều tăng đếm đúng. Hậu quả: hạn mức tài liệu/tháng
     không bao giờ chặn được — lỗ hổng thật cho phép upload vượt hạn mức vô hạn. Test thật xác nhận
     fix đúng: request upload-url → `usage.DOCUMENTS_UPLOADED.used` tăng ngay.
  2. **`admin.controller.ts#users` — `courseCount` hardcode `0`** thay vì đếm thật qua quan hệ Prisma.
     Đã sửa dùng `_count.courses`; test thật xác nhận đúng (1 course → courseCount=1).
  3. **`admin.controller.ts#metrics` — `dailyCosts` group theo `createdAt` chính xác đến mili giây**
     (cùng loại lỗi với `activeStreak` ở M4) → không bao giờ gộp được 2 dòng vào cùng 1 ngày, phá vỡ
     "biểu đồ chi phí LLM theo ngày". Đã sửa: tự gộp theo ngày (UTC) ở tầng ứng dụng. Test thật xác
     nhận: 1 GenerationRun → đúng 1 entry `{date, totalCostUsd, jobCount, totalInputTokens, ...}`.
  4. **`subscription.controller.ts` webhook — inject `@Res()` nhưng `return` object thay vì gọi
     `res.json()`** ở nhánh thành công → Nest bỏ qua return khi đã chuyển sang chế độ tự quản response,
     request treo tới timeout. Hiện là dead code (`webhookHandler` luôn throw vì chưa cấu hình Stripe
     live) nhưng đã sửa cho đúng để không vỡ khi bật live billing sau này.
  5. **Thiếu 2/5 endpoint admin theo checklist** — `adminCourseSchema`/`adminSubscriptionSchema` đã có
     sẵn trong contracts nhưng chưa có route `GET /admin/courses`/`GET /admin/subscriptions` nào cả.
     Đã thêm cả hai.
- **Frontend mới xây (2026-09-14):** trang Cài đặt (`/settings` — băng rôn demo, 4 usage bar, 3 card
  gói Free/Pro/Team đúng theo spec giá, nút nâng cấp demo + huỷ gói cuối kỳ); khu vực Quản trị
  (`/admin/*`, 5 trang: Tổng quan có biểu đồ chi phí dạng thanh ngang theo ngày, Người dùng có tìm
  kiếm, Khóa học có tìm kiếm, AI Job có lọc trạng thái + hiện tỉ lệ thất bại, Gói đăng ký) — layout
  admin tự redirect `/dashboard` nếu không phải ADMIN (lớp UX, server đã chặn thật ở RolesGuard).
- **Test thật xác nhận đúng luồng quan trọng nhất:** đăng nhập admin → nâng cấp FREE→PRO (demo) →
  usage limit đổi đúng theo gói mới → huỷ gói → `cancelAtPeriodEnd=true`, status vẫn `ACTIVE` tới hết
  kỳ; đăng nhập LEARNER → vào `/admin` bị redirect ngay, gọi thẳng `GET /admin/users` bằng token
  LEARNER → `403 FORBIDDEN` từ server.
- **Cố ý chưa làm:** Stripe live thật (đã từ chối rõ ràng bằng lỗi thay vì giả vờ — đúng tinh thần
  HANDBOOK "không tuyên bố thiếu căn cứ"), dead-letter queue UI.

**M5 — phần còn lại đã hoàn tất (2026-09-14, tiếp tục cùng ngày).** Đóng nốt 4 mục còn lại trong
next-actions #13:

- **Admin chạy lại AI job thất bại + AuditLog:** thêm `GET /admin/ai-jobs/:id` (chi tiết job, kèm
  `runs` LLM), `POST /admin/ai-jobs/:id/retry` (chỉ chấp nhận job `status=FAILED`, 409 nếu không;
  chỉ hỗ trợ `GENERATE_LESSONS` vì đây là loại duy nhất thật sự có bản ghi `AIJob` —
  `EXTRACT_DOCUMENT` chạy qua queue riêng theo `Document.status`, chưa từng tạo bản ghi `AIJob` nào,
  xác nhận qua kiểm tra code `documents.service.ts` không tạo `AIJob` khi enqueue extract), reset
  job về `QUEUED`/progress 0/error null rồi `queue.lessonGenerate.add()` lại với `inputParams` gốc;
  ghi `AuditLog{action:'ai_job.retry', entityType:'AIJob', entityId, actorId, metadata:{previousStatus,
previousError}}`. Thêm `GET /admin/ai-jobs/:id/audit-log` + trang `/admin/ai-jobs/[jobId]` (chi
  tiết job, nút "Chạy lại job" khi `FAILED`, bảng lịch sử thao tác admin).
  **Test thật với worker thật (không mock)**: ép 1 job `SUCCEEDED` thành `FAILED` bằng SQL trực tiếp,
  bấm "Chạy lại job" trên UI admin → job thật chuyển `QUEUED`→`RUNNING`(worker thật nhận qua BullMQ,
  `attempt` tăng 1→2) — nhưng **lần thử đầu FAILED thật** vì đụng đúng business-rule "trùng tiêu đề
  lesson" (course đã có 1 lesson từ lần chạy gốc, tầng validate business-rules của HANDBOOK §8 đúng
  đắn từ chối tạo lesson trùng tên) — xác nhận đây là hành vi đúng, không phải bug, bằng cách xoá
  lesson cũ rồi bấm chạy lại lần 2 → `SUCCEEDED` sạch với lesson mới. Test thêm qua curl trực tiếp:
  retry job không `FAILED` → `409`; LEARNER gọi `POST .../retry` hoặc `GET /admin/ai-jobs/:id` → `403`
  từ server thật (RolesGuard). Trang chi tiết xác nhận đúng 2 dòng `AuditLog` (2 lần bấm retry) theo
  thứ tự thời gian, đúng email admin thực hiện.
- **UI xử lý 402 QUOTA_EXCEEDED + gợi ý nâng cấp:** mở rộng `ApiClientError` (`apps/web/src/lib/api-client.ts`)
  đọc thêm `meta` từ error envelope (trước đây bị bỏ qua hoàn toàn); thêm `isQuotaExceededError()` type
  guard và component dùng chung `QuotaNotice` (`apps/web/src/components/quota-notice.tsx`) — hiện đúng
  "Bạn đã dùng X/Y ... — đã chạm hạn mức" + link `/settings`; gắn vào 3 chỗ: tạo khóa học
  (`courses/new`), tải tài liệu lên và sinh bài học AI (`courses/[courseId]`).
  **Test thật chạm đúng hạn mức** (không phải tài khoản dưới hạn mức như trước): dùng tài khoản demo,
  tạo đủ 3/3 khóa học (giới hạn FREE) rồi thử tạo khóa học thứ 4 qua UI thật → hiện đúng băng cảnh báo
  "Bạn đã dùng 3/3 khóa học", không có khóa học thừa nào bị tạo trong DB; set `UsageCounter` tài liệu
  lên đúng hạn mức 5/5 rồi tải tài liệu qua UI thật → hiện đúng băng cảnh báo, không có document thừa
  bị tạo, bộ đếm DB không tăng vượt hạn mức. Xác nhận API trả đúng envelope
  `{code:'QUOTA_EXCEEDED', meta:{metric, limit, used}}` qua curl. Phát hiện phụ trong lúc test: 2 tab
  trình duyệt cùng origin dùng chung cookie refresh token httpOnly — đăng nhập tài khoản khác ở tab
  khác sẽ ghi đè phiên của tab đầu khi tab đó tải lại trang (không phải bug ứng dụng, là đặc tính cookie
  domain-wide đúng theo thiết kế; chỉ ảnh hưởng khi test bằng nhiều tab, không ảnh hưởng người dùng
  thật dùng 1 phiên).
- **Test tranh chấp bộ đếm nguyên tử:** viết script tạm (`apps/api/src/__scratch_concurrency_check.ts`,
  đã xoá sau khi chạy) gọi trực tiếp `UsageService.increment()` thật (cùng code path production) —
  bắn 20 lượt gọi đồng thời (`Promise.allSettled`) cho 1 user mới, metric `AI_JOBS_RUN` (limit FREE=10)
  trên Postgres thật. Kết quả: giá trị cuối trong DB đúng bằng 20 (không mất update nào — Postgres
  row-level lock trên `upsert` xử lý đúng dưới tranh chấp), đúng 10 lượt được chấp nhận (value≤limit),
  đúng 10 lượt bị chặn quota (value>limit) — khớp chính xác kỳ vọng toán học. **Chưa đưa vào
  `npm run test`/CI** vì `vitest.config.ts`/`ci.yml` hiện không có service Postgres (đã ghi nhận là
  khoảng trống chung cho M2–M5 ở next-actions #5) — chạy tay 1 lần là đủ bằng chứng cho hạng mục
  checklist "có test tranh chấp", không phải test tự động lặp lại được trong CI hiện tại.

**M6 — Portfolio website (HANDBOOK §14 + `learnflow-ai-portfolio-agent-spec.md`), bắt đầu 2026-09-15.**

- **Quyết định phạm vi:** trang portfolio nhúng trực tiếp vào `apps/web` tại route `/` (thay hoàn
  toàn logic auto-redirect cũ), không tách app riêng — tái dùng design token và tránh thêm mục tiêu
  deploy mới. Song ngữ VI/EN theo lựa chọn của người dùng (nút chuyển ở nav, lưu `localStorage`).
- **Đọc trước khi viết nội dung:** phát hiện 2 file HTML có sẵn trong `docs/`
  (`architecture-diagram.html`, `ai-worker-pipeline.html`) trông như tài liệu kiến trúc đã làm sẵn,
  đúng design token của dự án — nhưng đọc kỹ thấy `ai-worker-pipeline.html` mô tả dùng **Gemini
  Flash 1.5**, trong khi code thật (`packages/ai/src/llm/anthropic.ts`, `apps/worker/src/environment.ts`)
  dùng **Anthropic Claude**. Đây là tài liệu khám phá ý tưởng từ ngữ cảnh khác, không phản ánh đúng
  hệ thống đã build — **không dùng làm nguồn nội dung** để tránh vi phạm nguyên tắc "không tuyên bố
  thiếu căn cứ". Toàn bộ nội dung kỹ thuật của portfolio được viết lại, đối chiếu trực tiếp với code
  thật (`admin.controller.ts`, `usage.service.ts`, `lesson-generate.processor.ts`, HANDBOOK §4.1/§8.1).
- **Đã xây xong 14 section** (`apps/web/src/components/portfolio/*.tsx` + nội dung song ngữ tập
  trung ở `apps/web/src/content/portfolio.ts`): Hero, Problem, Target Users, Product Value, Core
  Features (có `StatusBadge` theo 4 nhãn `FEATURE_LABELS`), Screenshots (chờ ảnh thật, có fallback
  không vỡ layout khi ảnh chưa có), How It Works (9 bước đúng HANDBOOK §8.1), MVP Scope (2 cột),
  Technical Architecture (12 thành phần đúng HANDBOOK §4.1, dạng card theo tầng thay vì SVG cố định
  để không tràn ngang trên mobile), AI Pipeline (chunking/2-giai đoạn/4-tầng validate/retry — số liệu
  đối chiếu đúng code), Database & API (entity + 4 endpoint mẫu, đã sửa 1 path sai lúc soát —
  `/lessons/:lessonId/exercise/submit` chứ không phải path lồng course/lesson/exercise tôi đoán ban
  đầu), Engineering Decisions (`<details>` mở rộng, khớp 6 ADR), Demo/CTA (tài khoản demo thật
  `demo@learn.ai`), GitHub Info (chưa có remote GitHub thật — ghi rõ "repo sẽ sớm công khai" thay
  vì link chết hoặc giả vờ).
- **Mascot:** đã copy `CircleMascot/CircleAvatar.tsx` (bản animated) vào thử cho Hero nhưng **gỡ bỏ
  vì không qua được `noUncheckedIndexedAccess` của tsconfig strict** (~50 lỗi kiểu trong file
  animation gốc không viết cho cấu hình strict này) — quay lại dùng SVG tĩnh có sẵn
  (`apps/web/public/mascot/celebrate.svg`) đúng theo quyết định đã có từ M1-M5.
- **5 ADR đã viết** ở `docs/adr/` theo đúng 5 chủ đề HANDBOOK gợi ý: TypeScript toàn bộ, Monorepo,
  Tách outline/lesson, Webhook nguồn sự thật, Quyền sở hữu ở tầng repository — mỗi ADR đối chiếu
  đúng code thật (ví dụ ADR-005 trích đúng `courses.service.ts` dòng dùng `findFirst({ownerId})`).
- **Test thật đã làm được (không cần Docker):**
  - `npm run typecheck`/`lint`/`test` xanh toàn bộ (trừ lỗi có sẵn không liên quan ở
    `packages/ai/__tests__/validate.test.ts`).
  - Test qua browser thật (web dev server chạy độc lập, không cần API/DB vì trang portfolio không
    gọi API nào): responsive desktop + mobile (375px, xác nhận bằng đo `document.body.scrollWidth`
    không tràn ngang), menu mobile mở/đóng đúng, nút chuyển VI/EN đổi đúng toàn bộ nội dung (phát
    hiện và sửa 1 bug: chip thông số chunking bị hardcode tiếng Việt, không đổi theo ngôn ngữ), anchor
    nav cuộn đúng vị trí section.
- **Docker Desktop — đã sửa xong (2026-09-15, cùng ngày, xem chi tiết ở mục M3 tiếp theo).** Không
  còn bị chặn nữa. Ba việc sau **vẫn chưa làm** (không còn lý do hạ tầng, chỉ là chưa tới lượt):
  1. **Ảnh chụp UI thật** (`docs/screenshots/*.png`) — script `scripts/capture-screenshots.mjs` đã
     viết sẵn (Playwright), **chưa chạy lần nào** — API/worker/Postgres giờ đã chạy được, chỉ còn
     chạy script.
  2. **Verify sống luồng Demo** từ chính trang portfolio (bấm CTA → đăng nhập → vào app thật) — chưa
     test theo đúng đường click thật từ trang portfolio (đã test đăng nhập demo riêng, không qua CTA).
  3. **Lighthouse Performance/Accessibility** — cần `npm run build && npm start`, chưa chạy.
- **Cố ý chưa làm (roadmap portfolio):** video demo 60-90s (cần công cụ quay màn hình ngoài khả năng
  hiện có), GitHub repo public thật (chưa có remote — đã ghi rõ trên trang, không giả vờ).

**M3 (tiếp tục) — Giao diện tiến độ AI Job + huỷ job, 2026-09-15.** Đóng phần lớn nhóm "Giao diện
tiến độ" còn thiếu ở §20.4 (trước đó 1/5, mảng yếu nhất toàn checklist).

- **Sửa Docker Desktop (chặn từ đầu phiên này) — root cause thật khác hẳn nhánh điều tra ban đầu.**
  Lúc đầu nghi do WSL2 kernel cần cập nhật (`wsl --update` báo `0x80072eff`) — **sai hướng**: đọc log
  MSI cài `wsl_update_x64.msi` mới thấy lỗi thật là `LaunchConditions` — "chỉ áp dụng cho máy có
  Windows Subsystem for Linux" kiểu cũ (registry `LxssManager`), trong khi máy này chạy WSL hiện đại
  (Store/MSIX, `wsl --version` báo 2.5.9.0) không có registry key đó — MSI này **không áp dụng được
  cho máy này ngay từ đầu**, không phải vấn đề quyền admin. Đọc log thật của Docker Desktop
  (`%LOCALAPPDATA%\Docker\log\host\com.docker.backend.exe.log`) mới ra lỗi thật: backend crash lặp
  lại ở bước `rename <socket>.sock <socket>.sock.stale` — Windows Win32 API **không thể** rename/xoá
  file Unix domain socket (AF_UNIX) do WSL/Docker tạo, dù có đủ quyền NTFS (`icacls`/`takeown` xác
  nhận full control nhưng `Remove-Item`/`robocopy` vẫn báo "The file cannot be accessed by the
  system"). Xử lý: dùng `wsl -- find ... -type s -delete` xoá các socket mồ côi trong
  `AppData\Local\Docker\run\` (`sailor-ingest.sock`, `dockerInference`, `userAnalyticsOtlpHttp.sock`)
  — riêng `AppData\Local\docker-secrets-engine\engine.sock` có ACL AppContainer khiến WSL không nhìn
  thấy cả thư mục cha (`ls`/`stat` báo "No such file or directory" dù PowerShell thấy bình thường) —
  giải pháp cuối: **rename cả thư mục cha** (`Rename-Item`, một thao tác metadata không cần đụng vào
  từng file con) thay vì xoá từng file — Docker tự tạo thư mục mới sạch khi khởi động lại. Sau khi
  dọn, `docker compose up -d` chạy sạch với container đặt tên mới `learn-postgres/redis/minio`.
  **Phát hiện thêm 2 chỗ còn sót tên "learnflow" cũ khi rename M6** (không nằm trong file được
  `grep` quét lúc đó vì là file `.env` — gitignored, không có trong danh sách file rename):
  `packages/db/.env` và `.env` gốc vẫn còn `DATABASE_URL`/`S3_BUCKET` cũ — đã sửa khớp
  `learn:learn@localhost:5432/learn` và `learn-documents`. Re-seed DB sạch, tài khoản demo/admin giờ
  đúng `demo@learn.ai`/`admin@learn.ai`.
- **UI tiến độ AI Job** (`apps/web/src/components/ai-job-progress.tsx` — component mới) — % + nhãn
  bước (đọc trực tiếp `progressLabel` worker publish theo từng node, ví dụ "Đã sinh 2/3 bài học") +
  mascot theo trạng thái (`working`→`celebrate`/`alerting`) + nút Huỷ. Poll 2 giây trong lúc
  QUEUED/RUNNING qua `useAiJob()` (`apps/web/src/lib/ai-api.ts`, dùng `refetchInterval` điều kiện —
  đúng yêu cầu "fallback polling 3 giây" HANDBOOK §7.4, chọn 2s cho mượt hơn). Thay hoàn toàn logic
  cũ ở `courses/[courseId]/page.tsx` (poll thủ công `lessons.refetch()` tối đa 30s không biết tiến
  độ thật) bằng theo dõi đúng `AIJob` qua job id trả về từ `generateLessons`.
- **Huỷ AI Job — làm mới hoàn toàn cả 2 tầng (trước đó 0% có ở cả API lẫn worker):**
  - API: `POST /api/v1/ai/jobs/:id/cancel` (`ai.service.ts#cancelJob`) — cập nhật `status=CANCELLED`
    nguyên tử (chỉ khi đang QUEUED/RUNNING, 409 nếu đã ở trạng thái cuối), gỡ khỏi BullMQ nếu job
    chưa được worker nhận (best-effort).
  - Worker: `lesson-generate.processor.ts` thêm điểm kiểm tra `assertNotCancelled()`/`isCancelled()`
    trước giai đoạn outline và **trước mỗi node** trong vòng lặp `mapLimit` — worker tự dừng êm giữa
    chừng, không giết tiến trình, không ghi dở lesson nào.
  - **Test thật xác nhận cả 2 nhánh:** (a) huỷ khi job đã xong → API trả đúng `409`; (b) huỷ khi job
    đang RUNNING thật (tạm tăng `sleep` mock LLM lên 3s để bắt kịp thời điểm RUNNING, xác nhận xong
    thì revert lại 80ms) → job chuyển đúng `CANCELLED`, `progress` giữ nguyên tại điểm dừng,
    `finishedAt` được ghi, **không có Lesson nào được tạo** — kể cả qua UI thật (bấm nút "Huỷ job",
    thấy đúng mascot `alerting` + "Đã huỷ job." + nút "Thử lại").
  - **Bug thật tìm thấy trong lúc test (không liên quan trực tiếp tính năng huỷ nhưng chặn hoàn toàn
    việc test):** `idempotencyKey` ở `ai.service.ts#generateLessons` là `gen:${courseId}:${params}`
    — **cố định vĩnh viễn theo course+params**, nên sau khi 1 job SUCCEEDED, sinh bài học lại lần nữa
    với params giống hệt luôn báo lỗi `500` (`Unique constraint failed on idempotencyKey`) — không
    bao giờ tạo lại được. Logic chống trùng thật sự đã nằm đúng ở truy vấn `existing` (chỉ chặn khi
    có job QUEUED/RUNNING) — `idempotencyKey` chỉ cần chống race hiếm giữa lúc đọc `existing` và lúc
    insert, không cần duy nhất vĩnh viễn. Đã sửa: thêm `Date.now()` vào key.
- **Cơ chế "kịch bản sẵn" cho MockLlmProvider** (đúng yêu cầu: chuẩn bị input/output từng node để giả
  lập AI đã xử lý, phục vụ quay demo/chụp ảnh không cần gọi LLM thật) —
  `packages/ai/src/llm/fixtures.ts`: file JSON tuỳ chọn (biến môi trường `MOCK_FIXTURES_PATH`), mỗi
  phần tử có `match` (chuỗi con khớp nội dung chunk) + nội dung Lesson/Exercise chuẩn bị sẵn.
  `sourceChunkIds` vẫn lấy từ chunk thật trong prompt nên tầng validate bám nguồn không bị phá vỡ —
  chỉ phần "sáng tạo nội dung" là được ghi đè. File mẫu đã điền sẵn 1 ví dụ đầy đủ ở
  `apps/worker/fixtures/lessons.example.json` (comment hướng dẫn ngay trong file). **Test thật xác
  nhận hoạt động đúng**: tạo tài liệu có nội dung khớp `match`, sinh bài học → Lesson trong DB có
  đúng `title`/`summary`/`estimatedMinutes`/câu hỏi y hệt fixture, không phải nội dung mock chung
  chung. Mặc định **tắt** (`apps/worker/.env` để dòng `MOCK_FIXTURES_PATH` ở dạng comment) để không
  âm thầm ghi đè nội dung khi người dùng chưa chủ động bật.
- **Phát hiện phụ về kiến trúc env:** `apps/worker` (và `apps/api`?) đọc `.env` qua `dotenv/config`
  không tham số → chỉ tìm `.env` tại **cwd lúc chạy** (`apps/worker/`), **không phải** `.env` ở gốc
  repo như tưởng — toàn bộ session trước đó "vô tình đúng" vì mọi giá trị mặc định trong
  `environment.ts` khớp sẵn với hạ tầng dev. Đã tạo `apps/worker/.env` riêng (gitignored) cho biến
  mới `MOCK_FIXTURES_PATH`. **Chưa sửa tận gốc** kiến trúc load env này — ghi nhận ở next-actions,
  không phải bug chặn gì hiện tại vì mọi default đã khớp, nhưng dễ gây nhầm lẫn cho người sau.

**M4 (tiếp tục) — C-01/C-02 sửa nội dung + sắp xếp lại Lesson, và M6 ảnh chụp UI thật, 2026-09-15.**

- **C-01 — Sửa `contentMd` của Lesson:** backend `patchLesson()` đã có sẵn từ trước nhưng **chưa từng
  test** — sửa lại để trả `LessonRead` đầy đủ qua `getLessonRead()` thay vì object một phần, và thêm
  `editedByUserAt` vào `lessonReadSchema` + set `new Date()` mỗi lần patch. Frontend mới xây ở
  `lessons/[lessonId]/page.tsx`: nút "Sửa bài học" → form (tiêu đề/tóm tắt/nội dung Markdown) → Lưu/Huỷ,
  ẩn view đọc bình thường lúc đang sửa, hiện "✎ Đã chỉnh sửa lúc {giờ}" sau khi lưu. **Test thật qua
  browser:** sửa tiêu đề + nội dung một lesson thật, lưu thành công, nội dung mới + timestamp hiển thị
  đúng ngay, xác nhận DB có `editedByUserAt` mới.
- **C-02 — Sắp xếp lại thứ tự Lesson (hoàn toàn mới, backend chưa từng tồn tại):**
  `LessonsService#reorderLessons` — validate `lessonIds` phải là hoán vị đầy đủ (so `Set` kích thước +
  từng phần tử) rồi `$transaction` 2 bước (đẩy tạm `orderIndex` âm trước, sau đó mới gán `0..n-1`) để
  tránh đụng `@@unique([courseId, orderIndex])` giữa lúc cập nhật. Route
  `PATCH /courses/:courseId/lessons/reorder` **phải đăng ký trước** route `PATCH .../lessons/:lessonId`
  trong `learning.controller.ts` — path literal (`reorder`) bị route có tham số động nuốt mất nếu đăng
  ký sau (bug route-order kinh điển của Express/Nest, phát hiện lúc test lần đầu route trả 404). Frontend:
  nút ▲▼ ở mỗi dòng Lesson trong `courses/[courseId]/page.tsx`, đặt trong `<div>` riêng **ngoài**
  `<Link>` bọc cả dòng (tránh interactive-lồng-interactive không hợp lệ trong HTML — button lồng trong a
  không hoạt động đúng), disable đúng ở 2 đầu danh sách. **Test thật qua browser:** đổi thứ tự 2 lesson
  bằng nút ▲, xác nhận `orderIndex` trong DB đổi đúng và danh sách hiện đúng thứ tự mới ngay không cần
  reload.
- **M6 — Ảnh chụp UI thật (`scripts/capture-screenshots.mjs`), chạy lần đầu sau khi Docker đã sửa.**
  Script vốn viết sẵn từ trước nhưng gặp 2 bug khi chạy lần đầu:
  1. Selector `a[href^="/courses/"]` khớp cả link "Tạo khóa học" (`/courses/new`) — click sai chỗ,
     không bao giờ vào được trang chi tiết course thật. Sửa: thêm `:not([href="/courses/new"])` +
     `waitForURL(/\/courses\/[0-9a-f-]{20,}/)` để xác nhận đã điều hướng đúng trước khi chụp.
  2. `waitForLoadState('networkidle')` bắn **trước khi** TanStack Query (client-side, chạy sau hydrate)
     kịp fetch xong — cả 6 ảnh lần chụp đầu tiên đều là khung xương loading (`.animate-pulse`), không
     phải nội dung thật (phát hiện bằng cách đọc trực tiếp file PNG qua Read tool, không đoán). Sửa
     `shoot()`: chờ `.animate-pulse` chuyển sang `detached` (timeout 8s, catch nếu trang không có
     skeleton) + đệm thêm 300ms trước khi `page.screenshot()`.
  - **Kết quả:** 6 ảnh thật ghi vào `docs/screenshots/` + copy sang `apps/web/public/screenshots/`:
    `dashboard`, `course-detail` (thấy rõ nút ▲▼ mới thêm), `lesson` (thấy rõ nút "Sửa bài học" mới
    thêm), `practice`, `settings`, `admin`. Verify từng file bằng Read tool (không chỉ tin log script) —
    đúng nội dung thật, không phải skeleton hay trang lỗi.
  - **Verify portfolio hiển thị đúng:** section "Sản phẩm trông như thế nào" dùng `find`/`get_page_text`
    xác nhận đủ 6 caption đúng thứ tự + mỗi ảnh có accessibility role `image` (không phải icon vỡ) tại
    đúng vị trí caption tương ứng. Không chụp được screenshot trực quan sạch của riêng section này do
    công cụ chụp màn hình của trình duyệt liên tục trả về vùng trống/timeout khi cuộn tới vị trí này
    (không phải lỗi ứng dụng — đã thử lại nhiều lần, kể cả front lại tab) — coi bằng chứng DOM/accessibility
    tree là đủ xác nhận, không phải bằng chứng trực quan tuyệt đối.

**M6 (tiếp tục) — Lighthouse Performance/Accessibility, 2026-09-15.**

- **Đo thật trên production build** (`npm run build -w apps/web` rồi `next start -p 3001` — cổng 3001
  tạm thời để không đụng dev server đang chạy sẵn ở 3000 lúc test tay các mục khác trong phiên này),
  `npx lighthouse` với Chrome headless thật (không dùng số liệu giả định).
- **Lần đo đầu tiên phát hiện 1 lỗi tương phản màu thật** (Accessibility 96/100): nhãn tiêu đề mục
  (component `SectionHeading` — "VẤN ĐỀ", "NGƯỜI DÙNG", "GIÁ TRỊ", ... xuất hiện ở đầu mọi section) và
  nhãn HTTP method trong bảng API mẫu (`database-api.tsx` — "POST"/"GET") dùng `text-sky-600` in đậm cỡ
  12px trên nền trắng hoặc `surface-100` (`#f4fbff`) — tỉ lệ tương phản thật đo được chỉ 3.84–4.02,
  dưới ngưỡng WCAG AA 4.5:1 cho chữ nhỏ. Sửa cả 2 chỗ sang `text-sky-700`; đo lại xác nhận
  **Accessibility lên đúng 100/100**, không còn audit `color-contrast` nào fail.
- **Phát hiện phụ:** trang chưa từng có favicon nào (`errors-in-console` audit ghi nhận
  `GET /favicon.ico → 404` trên mọi lần tải trang) — thêm `apps/web/src/app/icon.svg` theo đúng quy
  ước Next.js App Router (tự sinh thẻ `<link rel="icon">`, không cần route handler riêng), dùng đúng
  token màu thật của `Brand` component (`navy-700` nền, `sky-500` chữ "L") thay vì màu tuỳ ý.
- **Best Practices 96/100, SEO 100/100** — không có audit nào fail liên quan tới code của dự án (lỗi
  console còn lại là do CORS giữa cổng test tạm 3001 và API cấu hình `CORS_ORIGIN` cho cổng 3000 —
  không phải bug sản phẩm, chỉ là tác dụng phụ của việc chọn cổng khác để không đụng dev server; nếu đo
  đúng trên cổng 3000 thật sẽ không còn lỗi CORS này).
- **Performance dao động 88–91 qua 3 lần đo liên tiếp** (91, 88, 89) trên cùng 1 build, không đổi code
  gì giữa các lần đo — đạt mục tiêu ≥90 ở đa số lần nhưng không ổn định tuyệt đối. Không có nguyên nhân
  cụ thể nào bị audit chỉ ra (CLS=0 hoàn hảo, LCP ~2.6s, TBT ~280ms, không có audit "opportunity" nào
  đáng kể) — biến thiên này khớp với đặc tính đo Lighthouse trên máy phát triển thông thường (không
  phải máy CI cấu hình cố định cho benchmark), không phải dấu hiệu thiếu tối ưu. **Kết luận trung
  thực:** đạt tiêu chí ở mức "gần như luôn đạt, có dao động nhỏ do môi trường đo", không khẳng định
  "luôn luôn ≥90" một cách tuyệt đối.
- Đã dừng server production tạm (`next start -p 3001`) sau khi đo xong; dev server ở cổng 3000 không
  bị ảnh hưởng trong suốt quá trình.

**M4 (tiếp tục 2) — Xoá Lesson, dọn dẹp route trùng, sửa bug reorder, 2026-09-15.**

- **Phát hiện code trùng/chết trước khi bắt đầu:** trong lúc tìm chỗ thêm route xoá, phát hiện
  `courses.service.ts`/`courses.controller.ts` đã có sẵn từ trước một cặp `reorderLessons()`/
  `POST /courses/:id/reorder` **khác hoàn toàn** với route `PATCH /courses/:courseId/lessons/reorder`
  (module `learning`) mà tôi tự viết ở lượt trước — hai method HTTP khác nhau và hai path khác nhau
  nên không đụng nhau ở tầng route-matching (khác kiểu bug "route trùng" đã gặp ở M4 lần trước), nhưng
  đối chiếu HANDBOOK §7.2 xác nhận `PATCH /courses/:id/lessons/reorder` mới là path đúng spec.
  Bản `courses.service.ts` **chưa từng được gọi từ frontend** (xác nhận bằng grep toàn bộ
  `apps/web`) và **có cùng loại bug an toàn concurrency** mà bản `learning` đã tránh (không dùng
  kỹ thuật đẩy tạm sang index âm, chỉ gán thẳng `index+1` — nếu 2 lesson hoán đổi vị trí cho nhau sẽ
  đụng `@@unique([courseId, orderIndex])` giữa lúc transaction chạy). Đã xoá sạch method + route +
  import không dùng này (`courses.service.ts`, `courses.controller.ts`) để không còn 2 cách làm cùng
  một việc, một cái đúng một cái sai, gây nhầm lẫn cho người đọc code sau này.
- **Xoá Lesson (soft delete)** — `DELETE /courses/:courseId/lessons/:lessonId`
  (`lessons.service.ts#deleteLesson`): set `deletedAt=now()` và đẩy `orderIndex` xuống dưới mọi giá
  trị hiện có của Lesson trong Course (kể cả Lesson đã xoá trước đó — tính qua
  `MIN(orderIndex)` thật rồi trừ 1) để không đụng `@@unique([courseId, orderIndex])` sau này.
  Frontend: nút "Xoá bài học" ở trang đọc bài, xác nhận **inline hai bước** ("Xoá bài học này?" →
  "Xác nhận xoá"/"Huỷ") thay vì `window.confirm()` — đổi hướng giữa chừng vì `window.confirm()`
  chặn được test bằng công cụ trình duyệt tự động (dialog gốc bị tool tự động huỷ ngầm, không có
  cách nào xác nhận qua click), và vì đây cũng là lựa chọn UX nhất quán hơn với phần còn lại của
  ứng dụng (không nơi nào khác dùng dialog gốc trình duyệt). Xoá xong tự điều hướng về trang khóa học.
  **Test thật qua browser** (không phải chỉ curl): bấm "Xoá bài học" → hiện đúng bước xác nhận → bấm
  "Xác nhận xoá" → Lesson biến mất khỏi danh sách khóa học ngay, trang tự chuyển về `/courses/:id`;
  verify trực tiếp trong DB xác nhận `deletedAt` được set, `orderIndex` chuyển đúng thành `-1`
  (dưới toàn bộ range `0..n-1` đang dùng cho Lesson hoạt động).
- **Bug thật tìm thấy khi test tổ hợp xoá + sắp xếp lại** (đúng kiểu lỗi chỉ lộ ra khi 2 tính năng
  kết hợp, không lộ ra khi test riêng từng cái): sau khi xoá 1 Lesson, gọi `reorderLessons()` cho
  2 Lesson còn lại trả về **500 thật** — nguyên nhân: bước "đẩy tạm sang orderIndex âm" trong
  `reorderLessons()` dùng base **cố định** `-1-i`, nhưng `deleteLesson()` mới thêm cũng đẩy Lesson
  bị xoá xuống đúng `orderIndex=-1` — hai bên cùng nhắm vào giá trị `-1` nên đụng unique constraint.
  Xác nhận lỗi thật bằng `curl` trực tiếp (không đoán): gọi reorder sau khi xoá → `500
INTERNAL_ERROR`. Sửa: base tạm của `reorderLessons()` giờ tính **động** từ
  `MIN(orderIndex)` thật của toàn bộ Lesson trong Course (kể cả đã xoá mềm) trừ thêm 1 — đảm bảo
  không bao giờ trùng bất kỳ giá trị `orderIndex` nào đang tồn tại, dù đã xoá bao nhiêu Lesson trước
  đó. Test lại bằng `curl` xác nhận reorder sau khi xoá chạy đúng (200, `orderIndex` mới chính xác),
  verify DB không còn giá trị `orderIndex` trùng nhau ở bất kỳ dòng nào (kể cả dòng đã xoá).
  Sau khi xác nhận cả 2 tính năng hoạt động đúng, khôi phục lại dữ liệu demo về đúng trạng thái ban
  đầu (un-delete Lesson vừa xoá thử, trả lại đúng thứ tự 3 Lesson) để không ảnh hưởng ảnh chụp UI/CTA
  demo đã làm ở lượt trước.
- **Sự cố phụ trong lúc test:** `next build` (chạy cho Lighthouse ở mục trước) và `next dev` (đang
  chạy song song để test tay) dùng chung thư mục `.next/` — build production đè lên cache dev, dev
  server báo lỗi `Cannot find module './383.js'` (webpack chunk id lệch giữa 2 lần build). Xử lý:
  dừng dev server cũ, xoá `.next/`, khởi động lại `next dev` sạch. Ghi nhận để tránh lặp lại: **không
  chạy `next build` khi `next dev` đang dùng chung thư mục app** trong cùng phiên làm việc — nếu cần
  cả hai, build production nên trỏ output riêng hoặc chạy tuần tự có dọn cache.

**M2 (tiếp tục) — Xoá Document, ưu tiên backend theo yêu cầu người dùng, 2026-09-15.** Người dùng
nêu rõ: "Quan trọng là backend, vì frontend khả năng sẽ xây lại nhiều" — từ đây ưu tiên các việc
backend thuần (endpoint, business logic, data integrity, test) hơn UI, chỉ build frontend tối thiểu
khi cần để tự kiểm chứng backend hoạt động đúng.

- **`DELETE /documents/:id`** (`documents.service.ts#remove`, HANDBOOK §7.2 "Xoá file trên storage +
  chunk trong DB") — hard delete thật (Document không có `deletedAt` như Course/Lesson nên không thể
  soft-delete theo cùng pattern); `DocumentChunk` tự xoá theo `onDelete: Cascade` có sẵn trong schema;
  thêm `S3Service#deleteObject()` (dùng `DeleteObjectCommand`, trước đó service chỉ có put/get) để
  xoá file thật trên MinIO, gọi **sau** khi xoá DB row thành công và bọc try/catch best-effort (không
  rollback DB nếu xoá storage lỗi — DB là nguồn sự thật, object mồ côi trên storage chỉ là rác không
  ảnh hưởng người dùng). Chặn xoá khi `status=EXTRACTING` (409) — đọc code
  `document-extract.processor.ts` thấy sẵn dòng comment "Document ... không tồn tại — bỏ qua (có thể
  đã bị xoá)" ở bước đầu (worker đã tự lường trước việc xoá xảy ra trước khi nó nhận job), nhưng bước
  cuối (`tx.document.update()` ghi kết quả EXTRACTED, hoặc nhánh lỗi ghi FAILED) **không** có guard
  tương tự — nếu xoá đúng lúc worker đang giữa chừng xử lý, update sẽ ném lỗi "record not found"
  không rõ ràng trong log job BullMQ. Thêm chặn 409 ở tầng API để tránh race window này thay vì để
  worker tự xử lý sai cách.
- **Test thật toàn luồng, không phải chỉ đọc code:** tạo 1 document thật qua đúng 3 bước API
  (upload-url → PUT thật lên MinIO → confirm), đợi worker trích xuất xong (`EXTRACTED`), gọi xoá →
  verify **cả 2 phía**: DB row mất hẳn (`findUnique` trả `null`), object thật biến mất khỏi MinIO
  (`mc ls` trong container), 0 `DocumentChunk` mồ côi còn sót. Test riêng nhánh chặn 409: ép 1
  document khác về `status=EXTRACTING` bằng DB trực tiếp rồi gọi xoá → xác nhận đúng `409 CONFLICT`,
  không xoá gì; reset lại status rồi xoá thật để dọn sạch dữ liệu test.
- **Dọn rác phụ tìm thấy trong lúc test:** 2 object mồ côi thật trên MinIO (`data-structures.md`,
  `ds.md`) sót lại từ các lượt test AI pipeline ở phiên trước — xác nhận không còn `Document` nào
  trong DB tham chiếu tới (query `storageKey contains`) trước khi xoá thủ công qua `mc rm`.
- Sau khi test xong, xoá sạch mọi document/dữ liệu tạo ra trong lúc test — DB quay lại đúng trạng
  thái seed ban đầu (2 user, 1 course, 3 lesson active, 1 document — verify bằng script đếm trực tiếp).

**M1 (tiếp tục) — Test reuse detection refresh token, 2026-09-15.** Việc backend an ninh còn thiếu
lâu nhất trong danh sách (ghi nhận từ lượt kiểm chứng M1 ban đầu: "đã viết rotation + reuse
detection, chưa test tay reuse case") — logic đã có sẵn từ trước (`auth.service.ts#refresh`), lượt
này chỉ verify bằng test thật, không sửa code.

- **Kịch bản test thật qua curl** (không phải đọc code rồi suy luận): đăng nhập `demo@learn.ai` lấy
  `refresh_token` (token1) → gọi `/auth/refresh` một lần hợp lệ, xoay vòng thành token2 (token1 bị
  thu hồi, đúng thiết kế rotation) → **replay token1 đã bị thu hồi** (mô phỏng kẻ tấn công lấy được
  refresh token cũ) → đúng `401` với thông điệp "Phiên đã hết hạn, vui lòng đăng nhập lại." → **thử
  tiếp token2 (token hợp lệ, phiên thật đang dùng, chưa từng bị lộ)** → **cũng nhận đúng `401`** với
  cùng thông điệp — xác nhận đây không phải chỉ chặn token bị lộ, mà chủ động buộc **toàn bộ family**
  đăng nhập lại, đúng tinh thần bảo mật của HANDBOOK §10.1 (một token bị lộ là tín hiệu cả phiên có
  thể đã bị xâm nhập, không chỉ token đó).
- **Verify tận DB, không chỉ tin response API:** query trực tiếp bảng `RefreshToken` theo `familyId`
  của phiên test — xác nhận **cả 2 dòng** (token1 gốc, token2 xoay vòng) đều có `revokedAt` set đúng
  thời điểm tương ứng (token1 revoke lúc rotate hợp lệ; token2 revoke lúc phát hiện replay) — loại
  trừ khả năng response 401 chỉ là lỗi bề mặt (vd. token không tìm thấy) mà không thật sự có
  side-effect thu hồi family trong DB.
- **Kết luận:** logic hoạt động đúng 100% như thiết kế ban đầu, không tìm thấy bug — khác với hầu hết
  các mục "test thật lần đầu" trước đó trong dự án này (M1–M5) đều lộ ra ít nhất 1 bug thật. Đáng ghi
  nhận vì đây là logic bảo mật quan trọng nhất của tầng auth mà trước giờ chưa ai từng verify bằng
  test thật.

**M5 (tiếp tục) — Implement hạn mức PAGES_PROCESSED, 2026-09-15.** Tiếp tục ưu tiên backend theo
yêu cầu người dùng. Đây là **lỗ hổng chức năng thật** (không chỉ thiếu test như 2 mục trước) —
`usage.service.ts#currentUsage('PAGES_PROCESSED')` luôn trả `0` nên `assertNotExceeded` không bao
giờ chặn gì, nghĩa là **mọi gói kể cả FREE trước giờ đều xử lý được tài liệu dài như PRO/TEAM**, chỉ
bị chặn bởi trần cứng hệ thống `UPLOAD_MAX_PAGES=300` (không phân biệt gói) — hoàn toàn không đúng
mô hình kinh doanh "nâng cấp gói để xử lý tài liệu dài hơn" của HANDBOOK §11.3.

- **Root cause đúng của việc "chưa implement"**: `PAGES_PROCESSED` có `window: "per_document"` trong
  `Plan.limits` (seed: FREE=50, PRO=300, TEAM=9999) — khác hẳn 3 metric còn lại
  (COURSES_CREATED/DOCUMENTS_UPLOADED/AI_JOBS_RUN đều `"total"`/`"month"`, cộng dồn qua
  `UsageCounter` + `UsageService.increment()`). Một hạn mức "mỗi tài liệu" không thể biết trước lúc
  xin presigned URL (chưa có `pageCount` thật — chỉ biết sau khi trích xuất xong), và không có một
  con số "used" tổng hợp hợp lý theo tháng để cộng dồn — đây là lý do thật khiến `UsageService`
  (thiết kế quanh mô hình cộng dồn theo kỳ) không phù hợp để enforce metric này, không phải do quên.
- **Implement đúng chỗ:** thêm `getPagesPerDocumentLimit(uploaderId)` (export) trong
  `document-extract.processor.ts` — tra `Subscription` đang `ACTIVE`/`TRIALING` của người upload
  (fallback `FREE` nếu không có), đọc `plan.limits.PAGES_PROCESSED.limit`. Gọi ngay sau khi biết
  `result.pageCount` thật từ `extractText()`, **trước** check `UPLOAD_MAX_PAGES` (trần cứng hệ
  thống) — nếu vượt, ném `PagesQuotaExceededError` (class mới, message rõ ràng gợi ý nâng cấp gói),
  document chuyển `FAILED` với `errorCode='PAGE_QUOTA_EXCEEDED'` (mã riêng, phân biệt được với lỗi
  extraction thường trong `errorMessage` hiển thị cho người dùng).
- **Test thật, không đoán:** viết script tạm gọi trực tiếp `getPagesPerDocumentLimit()` với DB thật
  — user demo (gói FREE thật) → đúng `50`; tạm nâng gói user demo lên PRO qua DB → đúng `300`; khôi
  phục lại gói FREE ban đầu → đúng `50` (xác nhận không có hiệu ứng phụ để lại). Không tạo PDF
  50+ trang thật để test toàn luồng (chi phí tạo file PDF hợp lệ nhiều trang bằng tay không tương
  xứng với lợi ích — phần rủi ro thật của thay đổi này là truy vấn Prisma, không phải phép so sánh
  số hay logic ném lỗi) — thay vào đó test 1 lượt upload+extract TXT thật qua worker **đang chạy
  thật** (không phải mock) để xác nhận thay đổi không phá luồng thành công hiện có
  (`pageCount=null` với TXT nên bỏ qua check mới, kết quả vẫn `EXTRACTED` bình thường).
- Dọn sạch mọi document/gói test tạo ra trong lúc test — DB + subscription khôi phục đúng trạng thái
  ban đầu.

**M2 (tiếp tục 2) — Chặn trùng document theo checksum, 2026-09-15.** Tiếp tục ưu tiên backend.

- **Đối chiếu lại checklist trước khi bắt đầu** (thói quen đã hình thành trong phiên này sau vài lần
  phát hiện mô tả checklist sai): mục ghi "chưa test" nhưng grep thẳng code xác nhận
  `checksumSha256` **chưa từng được so khớp ở đâu cả** — chỉ lưu vào DB lúc tạo Document, không có
  logic chặn nào. Sửa lại mô tả cho đúng bản chất (chưa implement, không phải chưa test) trước khi
  viết code.
- **Implement:** `documents.service.ts#requestUpload()` — trước khi tạo Document mới, tìm Document
  khác cùng `courseId` + cùng `checksumSha256` mà **không** ở trạng thái `PENDING` (loại trừ lượt
  upload trước bị bỏ dở, chưa từng `confirm` — không nên chặn nhầm việc thử lại đúng file đó). Nếu
  có, `409 CONFLICT` kèm tên file trùng trong message.
- **Test thật qua curl, không đoán:** dùng đúng checksum của tài liệu seed có sẵn
  (`typescript-intro.pdf`) thử upload lại → đúng `409` kèm đúng tên file trong message; thử checksum
  khác → `201` bình thường (không bị chặn nhầm). Dọn document test tạo ra qua endpoint xoá mới xây;
  phát hiện phụ: việc test upload (kể cả các lượt trước đó trong phiên xoá Document) đã đẩy
  `UsageCounter.DOCUMENTS_UPLOADED` của demo user lên 4/5 (sát hạn mức FREE=5) chỉ vì test, không
  phải nhu cầu thật — reset lại về 0 để không vô tình chặn nhầm việc test/demo tiếp theo trong phiên
  (quyết định có chủ đích: counter usage không có cơ chế giảm khi xoá theo thiết kế sẵn có của hệ
  thống — coi đây là dọn dẹp hiệu ứng phụ của việc test, không phải sửa hành vi nghiệp vụ).

**Auth — integration test tự động (mảng backend giá trị cao nhất còn lại), 2026-09-15.** Toàn bộ
M2–M5 trước giờ chỉ test tay qua browser/curl/psql — bắt đầu tự động hoá từ `auth` vì là nền tảng
mọi module khác phụ thuộc, và refresh-token reuse detection (vừa verify tay lượt trước) là logic
bảo mật quan trọng nhất đáng có test tự động nhất.

- **Phát hiện hạ tầng thật quan trọng, ảnh hưởng cách viết mọi integration test sau này:** thử
  cách "chuẩn" trước — bootstrap `AppModule` qua `NestFactory.create()` ngay trong tiến trình
  vitest (giống `apps/api/src/main.ts`, dùng `supertest` gọi `app.getHttpServer()`). Kết quả: DI
  của provider thường (`AuthService`, 3 tham số) chạy đúng, nhưng DI của **Guard** áp qua
  `@UseGuards(RateLimitGuard)` thì **không** — `RateLimitGuard` (2 tham số: `RedisService`,
  `SecurityService`) nhận `this.redis = undefined`, `500` thật ở mọi endpoint có `@Throttle`
  (login, register gọi lần 2). Nguyên nhân kỹ thuật: **vitest dùng esbuild (qua Vite) để biên dịch
  TS, và esbuild không emit `design:paramtypes`** — đúng lớp lỗi đã ghi nhận ở M1 với `tsx`, nhưng
  lần này lộ ra ở lớp Guard-resolution của NestJS (`GuardsContextCreator`) chứ không phải toàn bộ DI
  như trước — provider thường vẫn qua được vì lý do chưa rõ (không đáng bỏ thời gian điều tra sâu
  nội bộ NestJS/Vite lúc này, đã có đường vòng khả thi).
- **Giải pháp:** bỏ cách bootstrap-trong-tiến-trình, gọi thẳng `fetch()` vào server thật đang chạy
  bằng `ts-node` (`http://localhost:4000`, cùng tiến trình đã dùng ổn định suốt phiên làm việc qua
  curl thủ công) — không có vấn đề emit metadata ở runtime này. Đánh đổi: test cần server đang chạy
  sẵn (không tự bootstrap), nhưng đây là ràng buộc **nhất quán** với thực trạng hiện tại của dự án
  (CI cũng chưa có Postgres/Redis nên integration test vốn đã không chạy được trong CI, xem
  next-actions #5) — không phải một hạn chế MỚI do lựa chọn này gây ra.
- **Bug thứ hai tìm thấy khi chạy test 2 lần liên tiếp trong 60 giây:** `/auth/login` có rate limit
  thật `@Throttle(5, 60)` theo **IP**, dùng chung bucket Redis giữa MỌI request tới cùng IP (kể cả
  test tự động lẫn curl thủ công đã gõ suốt phiên). Test suite gọi `/auth/login` quá nhiều lần
  (ban đầu 5 lần/file) → tự đụng đúng rate limit thật của chính app khi chạy lặp lại nhanh. Đây
  **không phải bug** (rate limiter hoạt động đúng thiết kế, đã verify ở M1) mà là lỗi thiết kế test
  — sửa bằng cách tái cấu trúc: chỉ gọi `/auth/login` **2 lần** cho cả file (1 sai mật khẩu + 1
  đúng), tái dùng `accessToken`/`refreshToken` từ lần đăng nhập thành công cho mọi assertion còn lại
  (đúng cách một client thật hành xử — không đăng nhập lại mỗi khi cần token). Đánh đổi: các `it()`
  trong file có phụ thuộc thứ tự (chạy tuần tự, đúng mặc định vitest) — không lý tưởng cho unit test
  độc lập, nhưng hợp lý cho integration test tôn trọng rate limit thật.
- **8 test, bao phủ:** đăng ký thành công (kèm verify DB tạo đúng gói FREE), đăng ký trùng email
  (409), đăng nhập sai mật khẩu (401), đăng nhập đúng (201 + cookie), `/auth/me` không token (401)
  và có token hợp lệ (200 đúng hồ sơ+gói), refresh không cookie (401), và bài test quan trọng nhất:
  **rotation + reuse detection** trong 1 kịch bản (xoay vòng → replay token cũ → 401 → xác nhận
  token mới hợp lệ cũng bị thu hồi theo). Chạy thật 2 lần liên tiếp (cách nhau đủ để rate limit
  reset) đều xanh 8/8; verify `afterAll` xoá sạch user test — chạy `npm run test` toàn repo (46 test,
  tăng từ 38) xác nhận không phá test có sẵn, DB quay về đúng trạng thái seed ban đầu sau khi chạy.

### Docker Desktop — root cause đầy đủ (bổ sung 2026-09-18)

⚠️ **Giả thuyết "do tắt Docker không sạch" là SAI** — đã bác bỏ bằng thực nghiệm 2026-09-19: sau khi
tắt hoàn toàn đúng cách bằng `docker desktop stop` (exit 0, không còn tiến trình docker nào), 5 file
socket **vẫn nằm nguyên** và thử `Rename-Item` lên chúng vẫn trả đúng lỗi
`The file cannot be accessed by the system.` Tức là Docker Desktop 4.90.0 tự để lại các file này ở
trạng thái không rename được **bất kể tắt sạch hay không**, và lần khởi động kế tiếp sẽ crash-loop
nếu không dọn trước.

**Quy trình đúng: dọn hai thư mục socket NGAY SAU KHI tắt Docker**, đừng đợi tới lúc nó crash.

Hai điểm khác mà ghi chép cũ còn thiếu:

1. **Có hai ổ socket, không phải một.** Ngoài `AppData\Local\Docker
un\` (4 file) còn
   `AppData\Local\docker-secrets-engine\engine.sock`. Backend crash lần lượt: dọn xong ổ thứ
   nhất thì nó crash ở ổ thứ hai.
2. **`wsl rm` không đủ.** WSL dọn được thư mục `Docker
un\`, nhưng **không hề nhìn thấy**
   `docker-secrets-engine` (`ls` báo không tồn tại trong khi `dir` của Windows liệt kê rõ file).
   Chỉ **rename thư mục cha** từ Windows mới xử lý được ổ này.

Thêm nữa, mỗi lần backend crash lại **sinh socket mới**, nên nó tự lặp vô hạn nếu chỉ dọn từng file.

Quy trình đã chạy được (dùng cả khi sửa lẫn khi tắt máy):

```powershell
docker compose -f infra/docker-compose.yml down   # volume dữ liệu vẫn còn
docker desktop stop                                # tắt sạch, KHÔNG Stop-Process -Force
# rồi rename cả hai thư mục cha và tạo lại thư mục rỗng:
#   %LOCALAPPDATA%\Docker
un
#   %LOCALAPPDATA%\docker-secrets-engine
```

Log chẩn đoán ở `AppData\Local\Docker\log\host\com.docker.backend.exe.log` — tìm dòng
`backend crashed, dumping error to file`.

Ghi chú dọn dẹp: mỗi lần rename để lại một thư mục `*.orphan-<timestamp>` cạnh bản gốc. Chúng chỉ
chứa file socket chết, xoá được bằng WSL `rm -rf` khi rảnh.

## Redesign frontend (2026-09-18 → 2026-09-19) — HOÀN TẤT 7/7 giai đoạn

Người dùng cung cấp 5 ảnh giao diện Duolingo làm tham chiếu và chốt hướng: **học cấu trúc, giữ nhận
diện riêng**. Không đổi ràng buộc `[SPEC]` nào — bảng màu vẫn là navy/xám/sky `#5EC8F5` theo spec
dòng 625, mascot vẫn là CircleMascot.

| GĐ  | Nội dung                                                                                   |
| --- | ------------------------------------------------------------------------------------------ |
| 1   | Design token ngữ nghĩa: sắc độ dẫn xuất sky 50–700, success/danger/warning, radius, shadow |
| 2   | Primitive `components/ui/` + `AppShell` 3 cột (sidebar · dải chỉ số · rail gói)            |
| 3   | Lộ trình bài học dạng node zigzag thay danh sách phẳng (`lesson-path.tsx`)                 |
| 4   | Màn bài học + làm bài tập + màn kết quả                                                    |
| 5   | Dashboard · danh sách khóa · tiến trình · cài đặt · tạo khóa học                           |
| 6   | Auth (3 màn + layout) · landing (đồng bộ token, không đổi nội dung `[SPEC]`)               |
| 7   | Admin 6 màn + primitive bảng + `StatusChip`                                                |

**Ràng buộc đã tôn trọng, ghi lại để phiên sau không vi phạm:**

- **Không bịa gamification.** Duolingo có gem/tim/rương thưởng/nhiệm vụ hằng ngày; LEARN không có hệ
  thống đó nên dải chỉ số chỉ hiện số thật từ `ProgressOverview` (streak, bài hoàn thành, điểm TB).
- **Mascot chỉ ở 4 vị trí §13.1 `[SPEC]`** (hero, empty state, tiến độ AI Job, lỗi) + `celebrate`
  khi hoàn thành bài học (§13.2). Màn loading chung dùng skeleton, **không** dùng mascot như màn chờ
  của Duolingo — muốn đổi phải sửa spec trước.
- **Landing không đổi một chữ nội dung nào**, chỉ đồng bộ màu/nút/thẻ.

**Ba lỗi sản phẩm tìm được khi kiểm chứng và đã sửa:**

1. Màn kết quả bài tập **không hiện đáp án đúng** dù API đã trả `correctAnswer` trong
   `SubmissionResult` — người học bị chấm Sai mà không biết đáp án. Đã hiện (chỉ sau khi nộp, đúng
   `[SPEC]`).
2. Gói **Team hiện giá "Miễn phí"** chỉ vì `priceCents = 0` (giá trị giữ chỗ của gói chưa mở bán).
   Nay gói `isFutureExtension` hiện "Chưa công bố".
3. Lỗi validate form tạo khóa học **hiện bằng tiếng Anh thô của Zod**
   (`Too small: expected string to have >=1 characters`). Đã thêm message tiếng Việt vào
   `courseTitleSchema`/`courseDescriptionSchema` (`packages/contracts/src/course.ts`).

**Lưu ý layout:** cột giữa chỉ ~736px vì có rail phải, nên lưới thẻ chỉ trải 3–4 cột từ `2xl` trở
lên; đặt ở `xl` sẽ làm nhãn và tiêu đề bị cắt cụt. Màn admin ẩn hẳn rail (rail nói về gói của chính
người xem, vô nghĩa ở khu quản trị) và nới lên `max-w-7xl` để bảng nhiều cột có chỗ.

**Mascot động:** đã bật, xem `docs/adr/006-mascot-dong-blob-studio.md`. `CircleMascot/` là bản export
từ Blob Studio (blobstudio.xyz); bản dùng trong app ở `apps/web/src/components/mascot/CircleAvatar.tsx`
có header `@ts-nocheck` **phải đứng trên `'use client'`**, nếu không TypeScript bỏ qua nó. Không sửa
tay file vendor — export lại rồi dán lại header. Artwork gần như đen nên trên nền tối phải lót đĩa
sáng (hero đang lót đĩa sky).

**Chưa kiểm chứng được:** bảng AI Job có dữ liệu, trang chi tiết job (bảng lượt gọi LLM, audit log,
nút chạy lại) và panel `AiJobProgress` — database chưa có job nào nên mới chỉ thấy empty state. Chạy
một job mock sẽ kiểm chứng hết, nhưng sẽ sinh thêm bài học vào khóa demo dùng để chụp ảnh portfolio.

## Hạ tầng làm giao diện (2026-09-19) — thiết lập xong

Tài liệu đầy đủ ở **`docs/UI-GUIDE.md`**; phần dưới chỉ ghi lại _đã đổi gì_ và _vì sao_.

**Vòng lặp sửa giao diện không còn cần Docker.** Trước đây mọi màn đều nằm sau `ProtectedRoute` và
cần Postgres/MinIO/worker, nên muốn xem một cái nút cũng phải dựng cả hạ tầng.

- `/dev/ui` (`apps/web/src/app/dev/ui/page.tsx`) — bảng mẫu: toàn bộ token, primitive, 5 trạng
  thái màn hình, bộ icon, và `LessonPath` chạy bằng dữ liệu giả. Có `notFound()` khi
  `NODE_ENV === 'production'` — **đã kiểm chứng trên bản build thật**: `next start` trả 404 cho
  `/dev/ui`, 200 cho `/`.
- `scripts/capture-ui.mjs` — chụp route bất kỳ ra `docs/screenshots/ui/`, có cờ `--width`,
  `--dark`, `--reduced-motion`. Khác `capture-screenshots.mjs` (ảnh portfolio, cần đăng nhập +
  hạ tầng đầy đủ). Trên Git Bash phải viết route **không có** dấu `/` đứng đầu.
- `.claude/launch.json` — cấu hình chạy web cho công cụ preview.

**Thư viện mới (chỉ ở `apps/web`):** `motion`, `lucide-react`, `canvas-confetti`,
`clsx` + `tailwind-merge`; `eslint-plugin-jsx-a11y` ở devDependencies gốc.
`apps/web/components.json` cấu hình sẵn CLI shadcn nhưng **chưa cài component nào** — component
shadcn dùng lớp `bg-background`/`text-foreground` không tồn tại trong theme LEARN, phải đổi sang
token LEARN sau khi thêm (đã ghi rõ ở UI-GUIDE §3).

**Thay đổi hạ tầng có thể ảnh hưởng chỗ khác:**

1. `cn()` giờ là `clsx` + `tailwind-merge` thay vì `join(' ')`. Hệ quả: `className` truyền từ
   ngoài **ghi đè được** lớp mặc định của primitive — trước đây không. Nếu một màn nào đó trước
   giờ vô tình dựa vào việc lớp truyền vào _không_ ăn thua, nó sẽ đổi hình. Đã soát typecheck +
   lint + build, chưa thấy chỗ nào lệ thuộc.
2. `Icon` đổi ruột sang `lucide-react`, giữ nguyên mặt tiền `<Icon name=... />` và cả 19 tên cũ,
   thêm 20 tên mới. Hình đổi nhẹ (lucide chuẩn hoá lưới 24px) — rõ nhất ở `book` và `chart`, hai
   hình vẽ tay trước đây lệch tỉ lệ so với phần còn lại.
3. `globals.css` thêm khối `@media (prefers-reduced-motion: reduce)` rút mọi animation/transition
   thuần CSS về ~0ms. `MotionConfig` chỉ với tới component `motion.*`, không với tới
   `animate-pulse` của Tailwind — đây là lỗ hổng a11y có thật trước đó.

## Cải tiến giao diện (2026-09-19)

- **Mascot không còn là đốm đen.** Bản export Blob Studio để `DEFAULT_GRADIENT` = đen tuyền; nay
  wrapper `components/mascot.tsx` truyền gradient `sky-400 → navy-700 → navy-900`, đọc ra khối
  cầu navy được ánh sáng thương hiệu rọi vào. Không sửa một dòng nào trong file vendor.
- **Đoạn nối trên lộ trình bài học giờ mang thông tin**: tô sky khi bài phía trên đã xong, xám
  khi chưa — nhìn lướt là thấy đã đi tới đâu. Node vào theo thứ tự (stagger), có phản hồi
  hover/tap.
- **Vòng nhấn của bài đang học** đổi từ `animate-pulse` sang `motion` để nghe theo công tắc giảm
  chuyển động.
- `ProgressBar` chạy bằng lò xo thay vì `transition-[width]` — bắt được _hướng_ thay đổi, quan
  trọng nhất ở màn kết quả bài tập.
- Dashboard: dải 4 thẻ chỉ số vào theo nhịp, hai khối dưới `Reveal` lệch pha.
- **Pháo giấy khi qua bài tập** (`lib/celebrate.ts`), màu lấy từ token. Phạm vi cố ý hẹp: chỉ khi
  `result.passed`, một lần mỗi lượt nộp. Không phải gamification mới — không thêm điểm thưởng,
  nhiệm vụ hay vật phẩm nào, chỉ là phản hồi thị giác cho sự kiện đã có sẵn.
- `eslint-plugin-jsx-a11y` bắt ngay 2 lỗi lúc bật: `autoFocus` ở form tạo khóa học (giữ lại, có
  `eslint-disable` kèm lý do — trang chỉ có một việc là điền form) và `heading-has-content` ở
  `CardTitle` (dương tính giả của wrapper, đã disable kèm chú thích).

**Lỗi tự gây ra và đã sửa trong phiên, ghi lại để không lặp:** `motion` chiếm quyền thuộc tính
`transform` của phần tử nó điều khiển. Đặt `style={{ transform: 'translateX(...)' }}` lên
`motion.li` của `lesson-path.tsx` làm **dáng zigzag biến mất hoàn toàn** ngay khi animation vào
chỗ — typecheck và lint đều xanh, chỉ lộ ra khi chụp ảnh nhìn tận mắt. Offset tĩnh phải nằm ở
`<div>` bên trong.

**Chưa kiểm chứng:** pháo giấy và `ProgressBar` dạng lò xo mới chỉ chạy qua typecheck/lint/build
và bảng mẫu; chưa nhìn tận mắt trên màn kết quả bài tập thật vì Docker chưa chạy trong phiên này
(cần Postgres để đăng nhập và nộp bài). Dashboard/lesson-path thật cũng vậy — mới xem qua
`/dev/ui` với dữ liệu giả.

## Đợt hoàn thiện UX (2026-09-19, phiên 10)

Làm trên **stack đầy đủ đã chạy thật** (docker + api + worker + db đã seed), audit 18 màn thật rồi
mới sửa — không phải đoán từ code. Tiêu chí lấy từ nguồn ngoài: 10 usability heuristics của NN/g,
hướng dẫn báo lỗi trong form của NN/g, và WCAG 2.2 AA. Bảng đối chiếu luật ↔ nguồn nằm ở
`docs/UI-GUIDE.md` §10.

### Công cụ mới

`scripts/audit-a11y.mjs` — chạy axe-core trên 18 màn **đã đăng nhập** (cả learner lẫn admin) theo bộ
luật WCAG 2.2 AA, exit code 1 nếu còn vi phạm serious/critical. Bổ sung cho
`eslint-plugin-jsx-a11y`: lint chỉ đọc JSX, còn tương phản màu chỉ tính được sau khi trình duyệt
render xong.

### Kết quả a11y — đo được

|                                | Trước                | Sau      |
| ------------------------------ | -------------------- | -------- |
| `color-contrast` (serious)     | 83 phần tử / 18 màn  | 0        |
| `link-in-text-block` (serious) | 2 phần tử / 2 màn    | 0        |
| **Tổng vi phạm WCAG 2.2 AA**   | **18/18 màn có lỗi** | **0/18** |

Nguyên nhân gốc và cách sửa:

1. **`sky-700` (#1b87b8) không đủ tối cho chữ** — 4.04:1 trên trắng, 3.72:1 trên `sky-50`. Đây là màu
   của mục điều hướng đang chọn, `Badge tone="info"` và mọi liên kết, nên lỗi lặp trên **mọi** màn.
   Đổi thành `#116f97` (giữ nguyên hue 198°, chỉ hạ độ sáng): trắng 5.61 · sky-50 5.17 · sky-100 4.71.
2. **`warning-700` (#9a6b16)** — 4.33:1 trên `warning-50`. Đổi thành `#81570e` (5.88:1); chữ trắng
   trên nền này vẫn 6.36 nên ghi chú cũ trong `theme.css` vẫn đúng.
3. **`ink-300` dùng làm chữ nội dung** ở `/admin/metrics` — 2.56:1 trên trắng. `ink-300` là bậc dành
   cho viền và chữ trên nền tối. Đổi usage sang `ink-500`, **không** đổi token (`ink-300` thuộc
   `[SPEC]`).
4. **`ink-500` trên nền có pha màu** — 4.49:1 trên thẻ gói nổi bật ở `/settings`. Đổi usage sang
   `ink-700`.
5. **Liên kết nội dòng chỉ gạch chân khi hover** — vi phạm WCAG 1.4.1. Nay gạch chân mặc định, bỏ
   gạch khi hover.

⚠️ Thay đổi token ảnh hưởng toàn app: `sky-700` và `warning-700` đổi giá trị. Cả hai đều thuộc khối
**bổ sung ADR 0004**, không phải khối `[SPEC]` §14.2 — khối `[SPEC]` không đổi một giá trị nào.

### Cải tiến UX

- **Màn bài học hết là ngõ cụt.** Thêm "Bài X/N" ở banner và điều hướng bài trước/bài sau ở thanh
  đáy, nhãn mang **tên bài thật** chứ không phải "Trước/Sau" trống nghĩa. Dùng `useLessons` (cùng
  query key với màn chi tiết khóa) nên thường đã có sẵn trong cache.
- **Màn chi tiết khóa học có hành động chính.** Trước đây nút nổi bật duy nhất là "Sinh bài học bằng
  AI" — việc của người soạn nội dung; người vào để học phải tự đoán rằng các vòng tròn bấm được. Nay
  banner có "Bắt đầu học / Tiếp tục học / Xem lại" kèm tên bài sắp mở; nút sinh bài hạ xuống
  `secondary`.
- **Xoá bài học tách khỏi Sửa bài học** — `ml-auto` đẩy sang mép phải, đổi sang màu danger, thêm icon
  thùng rác. Bước xác nhận hai nhịp giữ nguyên.
- **Báo lỗi bài tập chỉ đúng chỗ sai.** Trước: một dòng đỏ ở cuối trang nói "có câu chưa trả lời",
  người dùng phải tự dò. Nay: cuộn tới đúng câu, focus vào nó, viền đỏ + "Câu này chưa được trả lời"
  ngay trong thẻ, và dòng tổng nói rõ số câu. Dấu tự gỡ ngay khi trả lời.
- **Ô mật khẩu có nút hiện/ẩn** (`PasswordInput` trong `components/ui/form.tsx`) — `aria-pressed`,
  nhãn đổi theo trạng thái, vùng bấm 32×32.
- **Enum API không còn lọt ra màn hình**: `ACTIVE` → "Đang hoạt động", `/month` → "/tháng".
- **Thời gian tương đối** ("3 giờ trước") ở dashboard/tiến trình/bài học, mốc chính xác giữ ở `title`
  và `<time dateTime>`. Màn admin **cố ý giữ mốc tuyệt đối** — người vận hành cần giờ chính xác để
  đối chiếu log.
- `scroll-mt-24` / `scroll-mb-28` cho thẻ câu hỏi để thanh dính đỉnh/đáy không che phần tử đang
  focus (WCAG 2.2 — Focus Not Obscured).

### Đã cân nhắc và cố ý KHÔNG làm

Ghi lại để phiên sau không "sửa" nhầm — lý do đầy đủ ở `docs/UI-GUIDE.md` §11:

- Phím tắt 1/2/3/4 chọn đáp án kiểu Duolingo (LEARN hiện mọi câu trên một trang → phím số mơ hồ).
- Vô hiệu hoá nút "Nộp bài" khi chưa trả lời hết (nút xám không nói được vì sao nó xám).
- Ẩn sidebar/rail khi đang làm bài tập (đổi kiến trúc điều hướng, cần chốt với chủ sản phẩm).
- Cho bấm vào dòng "Hoạt động gần đây" để nhảy tới bài: `historyItemSchema` chưa có `courseId`/
  `lessonId`, cần đổi contract + API. Đáng làm, nhưng là thay đổi backend nên để lại thành
  next-action chứ không lặng lẽ kèm vào đợt dọn giao diện.

### Kiểm chứng

- `node scripts/audit-a11y.mjs` → **0 vi phạm trên 18/18 màn**.
- Luồng bài tập lái thật qua Playwright: bấm Nộp bài khi chưa trả lời → thông báo đúng số câu, thẻ
  câu đó được đánh dấu, **focus nhảy vào radio của câu đó**; trả lời xong dấu tự gỡ; nộp lại → pháo
  giấy render (`canvas` xuất hiện) + màn kết quả.
- Nút hiện/ẩn mật khẩu: `type` đổi `password` ↔ `text`, `aria-label` đổi tương ứng.
- `npm run build -w apps/web` xanh; `npx eslint .` sạch.
- Ảnh portfolio chụp lại bằng `scripts/capture-screenshots.mjs` trên giao diện mới (6 ảnh).

**Lưu ý cho script Playwright:** `getByLabel('Mật khẩu')` nay khớp **hai** phần tử (ô nhập và nút
"Hiện mật khẩu"). Mọi selector kiểu này phải dùng `{ exact: true }` — đã sửa trong
`capture-screenshots.mjs` và `audit-a11y.mjs`.

**Bẫy môi trường:** chạy `npm run build -w apps/web` trong lúc `next dev` đang chạy sẽ **hỏng thư mục
`.next` dùng chung** (`Cannot find module './XXX.js'`, mọi route trả 500). Phải dừng dev server, xoá
`apps/web/.next`, rồi khởi động lại. Đã dính hai lần trong phiên này.

## Logo đổi sang nhân vật Circle (2026-09-19, phiên 11)

Chủ sản phẩm chốt: **toàn bộ logo ứng dụng là nhân vật Circle.** Chi tiết quyết định và phần cần
xác nhận ở `docs/adr/007-logo-la-nhan-vat-circle.md`.

- Gộp 4 đoạn markup logo riêng lẻ (sidebar · màn đăng nhập · nav landing · favicon) — trước đây mỗi
  chỗ tự vẽ chữ "L" trong ô vuông — về một component `components/logo-mark.tsx`, hai tông
  `light`/`dark`.
- **SVG tĩnh viết tay, không phải `<Mascot>` động.** Favicon là file `.svg` nên không có JavaScript;
  bản động lại `ssr: false` nên logo sẽ trống ở lần vẽ đầu rồi mới nhảy vào; và một nhân vật chớp
  mắt trong sidebar ở mọi màn thì kéo mắt khỏi nội dung.
- `app/icon.svg` **phải đồng bộ tay** với component (ghi chú nhắc nằm ngay đầu file).

⚠️ **Cần chủ sản phẩm xác nhận một điểm:** HANDBOOK §13.1 `[SPEC]` giới hạn _mascot_ ở 4 vị trí.
Phiên này đọc "logo" là vai trò khác với "mascot" (bản động vẫn chỉ ở đúng 4 vị trí đó), nên **không
sửa dòng `[SPEC]` nào**. Nếu ý của §13.1 là _hình ảnh nhân vật_ không được xuất hiện ngoài 4 vị trí
kia thì phải sửa spec trước rồi mới giữ thay đổi này.

### Lỗi tìm thấy khi làm việc này

- **Token TS lệch khỏi CSS.** `packages/ui/src/index.ts` vẫn giữ `sky.700 = #1b87b8` và
  `warning.700 = #9a6b16` — hai giá trị đã được sửa ở `theme.css` trong phiên 10 cho đạt AA nhưng
  bản sao TS thì không. Đã đồng bộ và ghi chú rõ `theme.css` là nguồn sự thật.
- **`scripts/audit-a11y.mjs` chạy đua với animation.** Vòng nhấn của bài đang học phóng to 6% theo
  chu kỳ; axe lấy mẫu trúng lúc nó nở thì báo sai một lỗi tương phản. Cùng một trang chạy ba lần thì
  hai lần sạch. Đã bật `reducedMotion: 'reduce'` cho mọi context để trang đứng yên ở trạng thái
  nghỉ — nếu không, đưa script này vào CI sẽ đỏ ngẫu nhiên.
- Hai liên kết còn gạch chân chỉ khi hover ("Quên mật khẩu", "Về trang chủ", link ở màn bài tập) —
  axe không bắt vì chúng đứng một mình chứ không nằm trong câu, nhưng để cạnh một link đã gạch chân
  thì lệch hẳn. Đã thống nhất.

## Việc kế tiếp (next-actions)

1. Commit lần đầu (git) sau khi có xác nhận.
   1b. **Cho bấm dòng "Hoạt động gần đây" để nhảy tới bài học** — cần thêm `courseId` + `lessonId` vào
   `historyItemSchema` (`packages/contracts/src/progress.ts`) và vào truy vấn lịch sử ở API. Hiện
   mỗi dòng ghi đúng tên bài và tên khóa nhưng bấm vào không đi đâu được, buộc người dùng phải tự
   tìm lại qua menu Khóa học. Là thay đổi backend nên cố ý tách khỏi đợt dọn giao diện 2026-09-19.
   1c. **Đưa `scripts/audit-a11y.mjs` vào CI** — cần Postgres + web/api/worker chạy trong `ci.yml`;
   gộp chung với mục #5 (chưa có integration test tự động) vì cùng một nguyên nhân là CI chưa có DB.
   Hiện phải chạy tay, nên hồi quy tương phản màu có thể lọt.
2. ~~M3 — UI tiến độ AI Job + huỷ job~~ — **Đã xong 2026-09-15** (mascot + %+nhãn bước + poll 2s +
   huỷ job cả 2 tầng API/worker, xem chi tiết ở mục M3 phía trên). Còn lại thuộc M3: SSE thật (hiện
   dùng polling, chưa dùng kênh SSE `/ai-jobs/:id/stream` đã có sẵn ở backend — do `EventSource`
   trình duyệt không gửi được header `Authorization`, cần đổi sang `fetch`+`ReadableStream` tự parse
   SSE nếu muốn dùng kênh này thay vì polling); trang xem/sửa Lesson đã sinh (thuộc C-01, xem #4);
   test case `LOW_CONFIDENCE` hiển thị đúng nhãn cảnh báo trên UI.
3. **M3 (còn lại, có thể hoãn):** PPTX/DOCX extraction (`officeparser`, `mammoth`), OCR PDF scan
   (`tesseract.js`, giới hạn 50 trang), nhận diện heading thật, job định kỳ (§9.3), dead-letter queue
   - trang admin.
4. ~~M4 — UI sửa nội dung Lesson (C-01) + sắp xếp lại thứ tự (C-02) + Xoá Lesson~~ — **Đã xong
   2026-09-15** (xem mục "M4 (tiếp tục)" và "M4 (tiếp tục 2)" phía trên). Còn lại thuộc M4 (không
   chặn gì, có thể hoãn): phân trang cursor-based thật cho lịch sử thay vì "tăng limit"; test case
   `SHORT_ANSWER`/`FILL_BLANK` qua UI thật (mới test MULTIPLE_CHOICE qua browser — 2 loại kia mới chỉ
   có unit test cho `gradeAnswer`, chưa test nguyên luồng nộp bài thật với 2 loại này sau khi sửa bug
   field `correctAnswer`).
5. ~~M2 — Xoá Document (xoá file trên storage) + Chặn trùng checksum~~ — **Đã xong 2026-09-15**
   (xem mục "M2 (tiếp tục)" và "M2 (tiếp tục 2)" phía trên). **M2 còn lại:** trang danh sách tài liệu
   độc lập nếu cần (frontend, hoãn theo hướng ưu tiên backend); test PATCH/DELETE **course** qua UI
   (khác Document — chưa test). ~~Integration test tự động~~ — **bắt đầu 2026-09-15** với module auth
   (xem mục "Auth — integration test tự động" phía trên); còn thiếu integration test cho
   course/document/AI pipeline (đã đặt nền móng — pattern gọi thẳng server thật qua `fetch`, xem
   comment đầu file test auth để tái dùng đúng cách, tránh lặp lại vấn đề rate-limit/DI đã gặp).
6. ~~Test reuse detection của refresh token~~ — **Đã xong 2026-09-15**, xem mục "M1 (tiếp tục) —
   Test reuse detection refresh token" phía trên. Logic hoạt động đúng như thiết kế.
7. Sớm: trang quên mật khẩu hiện dừng ở thông báo "đang phát triển" (backend chưa có endpoint gửi
   email). Màn đã dựng lại 2026-09-19 nhưng vẫn giữ đúng nhãn "đang phát triển", không giả vờ đã làm.
8. Ghi chú bảo mật: npm audit còn 13 lỗi transitive (multer không dùng, next/postcss, vitest, esbuild,
   prisma/deepmerge-ts) — fix đều là breaking, hoãn; theo dõi khi lên version mới.
9. Tạo config `npm run format`/husky + lint-staged khi chuyển sang CI gate.
10. `apps/worker` build production (`npm run build`) chưa kiểm tra — apps/api từng dính lỗi tsup/esbuild
    nghiêm trọng (xem M1), apps/worker hiện chưa có script build/tsup.config.ts nào cả, chỉ có `dev`/`start`.
11. **`packages/ai` fail `npm run typecheck` — 34 lỗi, và điều này làm CI ĐỎ.** Rộng hơn ghi chép cũ:
    `validate.test.ts` 28 lỗi (narrowing discriminated union + `noUncheckedIndexedAccess`) và
    `chunker.test.ts` 6 lỗi (`noUncheckedIndexedAccess`). `.github/workflows/ci.yml` chạy
    `npm run typecheck` **trước** lint và test, nên mọi lần push đều fail. Lọt lưới lâu vì
    `npm run test` vẫn 46/46 xanh — vitest transpile chứ không typecheck. Sửa bằng cách thu hẹp
    kiểu trong test, **không** hạ `noUncheckedIndexedAccess` và không dùng `any` (AGENTS.md cấm).
12. API paths cho Lesson/Exercise lệch khỏi HANDBOOK §7.2 (dùng `/courses/:id/lessons/:id` lồng nhau
    thay vì `/lessons/:id` phẳng; chưa có `/lessons/:id/complete`, `/exercises/:id/submissions`,
    `/courses/:id/progress`) — quyết định có chủ đích để tránh refactor lớn giữa lúc build frontend M4,
    xem thêm ở mục M4 phía trên. Cần quyết định trước khi coi DoD (§20.8) là đạt.
13. ~~M5 (còn lại)~~ — **Đã xong 2026-09-14** (chạy lại AI job + AuditLog, trang chi tiết job, UI 402
    quota + test chạm hạn mức thật, test tranh chấp bộ đếm). Còn 1 việc lộ ra khi làm việc này: đưa
    test tranh chấp `usage.increment()` vào CI thật cần Postgres service trong `ci.yml` — gộp chung
    với mục #5 (chưa có integration test tự động cho M2–M5) vì cùng nguyên nhân (CI chưa có DB).
14. ~~Chặn M6 — sửa Docker Desktop~~ — **Đã xong 2026-09-15**, tái phát và sửa lại 2026-09-18.
    ⚠️ Ghi chép 09-15 thiếu hai điểm quan trọng (có **hai** thư mục socket, và `wsl rm` không đủ
    cho thư mục thứ hai) — xem mục "Docker Desktop — root cause đầy đủ" phía trên trước khi
    chẩn đoán lại.
15. ~~M6 — chạy `scripts/capture-screenshots.mjs`~~ — **Đã xong 2026-09-15** (6 ảnh thật, xem mục
    "M4 (tiếp tục)" phía trên). ~~Verify sống luồng Demo qua CTA thật~~ — **Đã xong 2026-09-15**: bấm
    đúng nút "Dùng thử Demo" trên trang portfolio (không phải test đăng nhập tách rời) → điều hướng
    đúng `/login` → điền `demo@learn.ai`/`Demo@12345` → submit → vào thẳng `/dashboard` thật, hiện đúng
    dữ liệu tài khoản demo. ~~Lighthouse~~ — **Đã xong 2026-09-15**, xem mục "M6 (tiếp tục) — Lighthouse"
    bên dưới. **M6 còn lại:** video demo 60-90s nếu có công cụ quay màn hình ngoài phạm vi hiện có.
16. **Kiến trúc load `.env` chưa nhất quán:** `apps/api`/`apps/worker` dùng `dotenv/config` không
    tham số → chỉ đọc `.env` tại cwd lúc chạy (`apps/api/`, `apps/worker/`), không phải `.env` gốc
    repo như tài liệu HANDBOOK §22 ngụ ý. Hiện "chạy đúng" vì mọi default trong `environment.ts`
    khớp sẵn hạ tầng dev, và `packages/db/.env` + `apps/worker/.env` là các bản sao/bổ sung thủ công
    — dễ gây lệch giá trị giữa các file khi đổi cấu hình (đã từng xảy ra: sửa `.env` gốc nhưng
    `packages/db/.env` vẫn cũ, phải soát cả 2). Nên hợp nhất về 1 nguồn (ví dụ dùng
    `dotenv.config({path: '../../.env'})` từ mỗi app) khi có dịp, không chặn gì hiện tại.

17. **Kiểm chứng cụm AI Job ở trang admin** — bảng có dữ liệu, trang chi tiết job (bảng lượt gọi LLM,
    audit log, nút chạy lại) và panel `AiJobProgress` mới chỉ qua typecheck, chưa nhìn tận mắt vì DB
    chưa có job nào. Chạy một job mock (`LLM_MODE=mock` đã bật sẵn) sẽ kiểm chứng cả cụm — lưu ý nó
    sinh thêm bài học vào khóa demo dùng để chụp ảnh portfolio.
18. **Lỗi RFC 7807: `type` sai cho mọi lỗi không phải `ApiError`.** Trong
    `apps/api/src/common/errors.ts`, nhánh fallback của `AllExceptionsFilter` tính đúng `code` nhưng
    hardcode `type: 'https://learn.ai/errors/internal-error'`. Kiểm chứng thật:
    `403 FORBIDDEN` và `401 UNAUTHENTICATED` đều tự khai là `internal-error`, trong khi `404` (ném
    bằng `ApiError`) trả đúng `.../not_found`. `type` là định danh máy đọc nên đây là lỗi hợp đồng
    API. Sửa: suy `type` từ `code` y như nhánh `ApiError`, thêm test cho 401/403/500.
19. **Lịch sử `session-log.md` có khoảng trống**: các phiên làm M4/M5/M6 ngày 2026-09-15 không được
    ghi dòng nào (nhảy từ phiên 3 ngày 09-14 sang phiên 4 ngày 09-18). Không khôi phục được chính xác
    nên để nguyên; từ nay ghi ngay cuối mỗi phiên theo đúng AGENTS.md.

## Đợt audit + refactor backend/frontend — 2026-09-19 (phiên 12)

Rà soát toàn bộ luồng nghiệp vụ rồi sửa. **Không sửa một dòng `[SPEC]` nào** — bảng màu §14.2,
ranh giới mascot §13.1 và luật "đáp án không rời server trước khi nộp" giữ nguyên.

### Lỗi đúng đắn dữ liệu (nghiêm trọng)

1. **`upsertProgress()` nhận `tx` nhưng gọi `prisma.*` toàn cục** — tiến độ học ghi NGOÀI
   transaction của `submit()`. Transaction rollback vẫn để lại `LearningProgress`: bài học hiện
   "Hoàn thành" mà không có `Submission` nào. Nay dùng đúng `tx`.
2. **Đua `attemptNo`** — tính bằng `aggregate(_max)` ngoài transaction rồi `+1`. Hai lượt nộp song
   song chọn cùng số, đụng `@@unique([userId, exerciseId, attemptNo])` -> P2002 -> **500, mất bài
   làm**. Nay tính trong transaction + thử lại tối đa 3 lần khi đụng khoá.
3. **`attempts` đọc-rồi-ghi** -> `{ increment: 1 }`.

### Hiệu năng

4. **N+1 kinh điển ở `courses.listForOwner()`**: mỗi khoá học bắn 3 câu COUNT -> `1 + 3N` truy vấn
   (20 khoá = 61 round-trip). Nay 1 câu + 3 `groupBy` = **4 truy vấn cố định**.
5. **Worker ghi ~530 INSERT tuần tự trong một transaction** (4 vòng lặp lồng nhau, mỗi dòng một
   `create()`). Transaction tương tác của Prisma mặc định hết hạn 5s -> lượt sinh lớn P2028 và mất
   sạch kết quả _sau khi_ đã trả tiền LLM. Nay dựng dòng trong bộ nhớ rồi **4 `createMany`**,
   `timeout: 30s`.
6. **Trung bình điểm `findMany` toàn bộ Submission về Node rồi `reduce`** (progress + courses) ->
   `aggregate({ _avg })`. Không còn tăng tuyến tính theo số lượt nộp.
7. **`activeStreak()` tải toàn bộ Submission**: `distinct: ['createdAt']` vô nghĩa vì `createdAt`
   là timestamp mili-giây. Nay `date_trunc('day')` trong Postgres, chặn cửa sổ 366 ngày.
8. Thứ tự bài học sinh ra từng **ngẫu nhiên**: `mapLimit` chạy song song và `results.push()` theo thứ
   tự về đích, nên `orderIndex` phụ thuộc bài nào LLM trả lời nhanh hơn. Nay ghi theo chỉ số outline.
9. `submissionAnswer` N lần `create()` -> 1 `createMany`; `usage.snapshot()` `await` trong vòng `for`
   -> `Promise.all`; `cancelJob` 3 truy vấn -> 1; `startIndex` dùng `count()` (đếm cả lesson đã xoá
   mềm ở orderIndex âm) -> `MAX(orderIndex)+1` của lesson chưa xoá.

### Bảo mật

10. **`JWT_ACCESS_SECRET` có default nằm công khai trong repo** và `.min(32)` của Zod pass nó (dài 40
    ký tự). Thiếu biến ở production = ai cũng ký được token `role: 'ADMIN'`. Nay
    `insecureProductionVars()` chặn boot; áp dụng cho cả credential MinIO và `STRIPE_WEBHOOK_SECRET`
    khi `BILLING_MODE=live`.
11. **Dò tài khoản qua thời gian đăng nhập**: email không tồn tại trả về ~1ms (bỏ qua argon2), email
    có thật ~100ms. Nay luôn verify — với hash giả khi không có user.
12. Ghim `algorithms: ['HS256']` cho `jwtVerify`; `role` lạ không còn mặc nhiên rơi về `LEARNER`.
13. `ai.generateLessons` chỉ lọc `uploaderId`, **không lọc `courseId`** — dùng được tài liệu của khoá
    học khác (đúng thứ thông điệp lỗi đang hứa lại không kiểm). Đã thêm.
14. Rate limit: `INCR` + `TTL` + `EXPIRE` qua 2 round-trip có nhánh rẽ -> **một Lua script nguyên tử**.

### Hợp đồng API

15. **RFC 7807 `type` sai cho mọi lỗi không phải `ApiError`** (next-action #18 cũ) — đã sửa: suy từ
    `code` ở một chỗ duy nhất (`problemType()`).
16. **Lỗi Prisma lọt ra thành 500**: P2002 -> 409, P2025 -> 404, P2003/P2028 -> 409.
17. `REFRESH_TOKEN_TTL_DAYS` được khai báo + validate nhưng **không ai đọc** (hardcode 30 ngày 3 chỗ).
18. `me()` trả `usage: {}` cứng -> nay trả `UsageService.snapshot()` thật.
19. `changePassword` sai mật khẩu trả 403 -> 401; `register` bắt P2002 -> 409 thay vì 500.

### Hạ tầng build

20. **`npm run build` ở root hỏng**: gọi `npm run build -w apps/worker` mà worker không có script đó.
    Đã thêm `tsup` + config.
21. **Worker thiếu `@swc/core`** -> bundle không emit `design:paramtypes`, tức **DI của NestJS hỏng
    đúng như lỗi đã gặp với `tsx` ở M1**. Đã thêm; kiểm chứng `grep -c design:paramtypes dist/main.js` = 4.
22. `vitest.config.ts` không include `apps/worker` — pipeline AI hoàn toàn không có test nào chạm tới.

### Giao diện — ngôn ngữ "bóng nhẹ thay viền dày"

Chuyển primitive sang kỷ luật Vercel/Linear **trong bảng màu `[SPEC]` không đổi**: viền 1px +
`shadow-card` thay cho `border-2`/`border-b-4`; bỏ `uppercase tracking-wide`, thứ bậc bằng độ đậm +
màu chữ; `rounded-lg`; `transition-all duration-200` thay `duration-75`; nút bỏ hiệu ứng lún
`active:translate-y-1`. Sửa ở `ui/{button,card,form,badge,skeleton,states,table}.tsx` nên toàn app
đổi theo; thêm `Card interactive`, `CardDescription`, `LoadingState variant`, `EmptyState
secondaryAction`, `ErrorState detail`. **Không đụng trang portfolio** (phong cách editorial riêng).

**Kiểm chứng:** typecheck toàn workspace exit 0 (lần đầu xanh) - eslint + prettier OK - test
**77/77** (46 -> 77, thêm 31) - `npm run build` root OK - **axe-core 18/18 màn, 0 vi phạm WCAG 2.2
AA** - chụp lại `/dev/ui`, `/login`, `/register`.

### Còn lại sau phiên 12 — đã đóng hết ở phiên 13

Bốn mục hoãn ở phiên 12 nay đã làm xong, xem mục dưới.

## Đóng nốt phần hoãn + hoàn thiện 5 trạng thái — 2026-09-19 (phiên 13)

### Hạn mức giờ mới thật sự là hạn mức

`assertNotExceeded()` → tạo bản ghi → `increment()` là ba bước rời nhau, tức kiểm-tra-rồi-hành-động.
**Đo được**: một script dựng lại đúng trình tự cũ, bắn 8 request song song vào gói FREE giới hạn 3
khoá học, tạo ra **6** khoá. Thay bằng `UsageService.consume(userId, metric, work)` — một
transaction giữ `pg_advisory_xact_lock` theo `(userId, metric)`, kiểm và ghi bên trong. Chạy lại
test tương tự: đúng **3**, năm request còn lại nhận 402, không có 500 nào.

Kèm theo:

- Gọi S3 / đẩy BullMQ chuyển ra **ngoài** transaction — không giữ lock qua một lượt gọi mạng, và
  không bao giờ enqueue job trỏ tới bản ghi vừa rollback.
- `COURSES_CREATED` khai báo rõ là metric **`derived`** (đếm dòng thật, xoá khoá học trả lại suất).
  Trước đây nó vừa đếm dòng ở nhánh kiểm tra, vừa `increment()` một `UsageCounter` theo tháng mà
  **không ai đọc** — việc thừa, và khiến người đọc tưởng hạn mức reset hàng tháng.
- `DOCUMENTS_UPLOADED` trừ ở `confirm()` thay vì lúc xin presigned URL. Xin URL rồi bỏ dở là chuyện
  thường; trừ ở đó nghĩa là mất suất cho tài liệu chưa bao giờ tồn tại. `confirm()` thêm
  `status: 'PENDING'` vào `where` nên hai lần confirm song song chỉ một lần đi qua.

### Chuỗi ngày học cắt theo giờ Việt Nam

Thêm `APP_TIMEZONE` (mặc định `Asia/Ho_Chi_Minh`, validate bằng `Intl` lúc khởi động). Trước đây
cắt theo UTC nên ranh giới ngày rơi vào 07:00 giờ VN — học lúc 1 giờ đêm bị tính sang hôm trước.

Sửa luôn một lỗi của chính phiên 12: `date_trunc('day', "createdAt" AT TIME ZONE 'UTC')` trên cột
`TIMESTAMP(3)` (không mang múi giờ) cho ra `timestamptz`, rồi Postgres hiển thị nó theo biến
`TimeZone` của **phiên** — chạy máy khác ra kết quả khác. Phải nói rõ cả hai bước:
`("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE <tz>`. Đã kiểm chứng trên DB thật.

Lùi ngày làm trên chuỗi `YYYY-MM-DD` chứ không trừ 86400000ms, để múi giờ có DST không nhảy hai
ngày hoặc đứng yên.

### `reorderLessons`: 2N câu lệnh → 2

Vẫn phải đi hai lượt (ràng buộc `@@unique([courseId, orderIndex])` áp dụng ngay trong câu lệnh),
nhưng mỗi lượt giờ là **một** `UPDATE … FROM (VALUES …)` thay cho N câu `update()` nối tiếp.
Kiểm chứng trên DB thật: đảo ngược 5 bài học sau khi đã xoá mềm 1 bài → orderIndex liên tục 0..4,
bài đã xoá vẫn nằm yên ở index âm.

### Dọn nốt

- `AuditService` lấy Prisma qua DI thay vì `await import('@learn/db')` giữa đường xử lý request.
- `RateLimitGuard` bỏ `SecurityService` được tiêm vào nhưng không dùng.

### Giao diện — 5 trạng thái giờ đủ thật

- **Trạng thái PARTIAL đã tồn tại ở backend nhưng UI không hề đọc.** Worker ghi
  `error.code = 'PARTIAL_FAILURES'` lên AIJob SUCCEEDED khi một số node outline không sinh được
  bài học; `AiJobProgress` luôn báo "Hoàn tất! Bài học đã sẵn sàng." Người dùng xin 10 bài, nhận 7,
  không có gì cho biết 3 bài kia biến mất. Nay hiện danh sách phần thiếu kèm lý do, và **không**
  tự đóng sau 900ms để người dùng kịp đọc. Parser tách ra `lib/ai-job-partial.ts` (logic thuần,
  chịu được mọi hình dạng `detail` vì đó là JSON do worker ghi) + 11 test.
- **6 màn admin**: `<Skeleton className="h-48" />` (một tảng xám, sai chiều cao nên trang giật khi
  dữ liệu về) → `TableSkeleton` vẽ đúng số cột/dòng. Ô rỗng `<Card><p>Không có … nào khớp.</p></Card>`
  → `TableEmpty` **phân biệt hai tình huống**: lọc không ra kết quả (kèm nút _Xoá bộ lọc_) và hệ
  thống thật sự chưa có dữ liệu (nói rõ khi nào nó sẽ có).
- Thêm cả hai vào `/dev/ui` để không thành primitive mồ côi.

**Kiểm chứng phiên 13:** typecheck / lint / prettier / `npm run build` root đều exit 0 · test
**101/101** (77 → 101, thêm 24) · axe-core **18/18 màn, 0 vi phạm** · **không màn nào tràn ngang ở
390px** (15 route, kể cả màn đã đăng nhập — phần rộng nằm trong vùng `overflow-x-auto` của chính nó)
· hai kịch bản đua và SQL thô đều kiểm chứng trên Postgres thật.

### Còn lại (có chủ đích)

- `documents.list()` ký presigned URL cho từng dòng. Ký là HMAC cục bộ, không có I/O, nên không
  phải nút thắt hiệu năng; bỏ `downloadUrl` khỏi `DocumentList` là **đổi contract** nên không tự ý
  làm. Nếu muốn, chuyển sang chỉ ký khi bấm tải.
- Đưa `audit-a11y.mjs` + test integration vào CI — cần Postgres/Redis service trong `ci.yml`.

## Lộ trình bài học dạng đường cong — 2026-09-19 (phiên 14)

Người dùng phản hồi lộ trình "phải là đường cong uốn lượn, không nên như vậy". Đúng: bản cũ lệch
node sang ngang bằng `translateX`, nhưng đoạn nối lại là một thanh **dọc** (`h-8 w-1`) nằm trong
luồng bố cục — nó rơi thẳng xuống dưới node phía trên chứ không hề đi tới tâm node phía dưới. Nên
lộ trình nhìn ra các mẩu gãy khúc rời rạc.

Nay đường đi là một **spline SVG đi xuyên qua đúng tâm mọi node**, node đặt tuyệt đối lên trên.
Chi tiết hình học và hai lần thử sai ghi ở `docs/UI-GUIDE.md` §4d:

- Chu kỳ sóng **4 node** (`sin(iπ/2)`). Chu kỳ 6 thử trước đó hỏng vì `sin(π/3) = sin(2π/3)`, node
  2 và 3 rơi cùng một x và đoạn giữa thành đường thẳng đứng.
- Mỗi đoạn là **Bézier hai tay nắm thẳng đứng dài nửa bước dọc**. Catmull-Rom thử trước đó cho
  tiếp tuyến chỉ dài 1/6 khoảng cách, đường ngoặt gấp sát node rồi duỗi thẳng ở giữa.
- `x` theo `%`, `y` theo `px`, `preserveAspectRatio="none"` + `vector-effect="non-scaling-stroke"`
  → biên độ tự co trên màn hẹp, không cần đo bằng JS.
- **Nhãn chuyển từ dưới node sang bên cạnh**, neo vào mép khung. Đặt dưới thì đường cong đâm
  thẳng qua tiêu đề; neo vào node với bề rộng cố định thì node ở giữa trên màn 390px bị cắt chữ.
- Node bỏ `border-b-[6px]` + `active:translate-y-1`, dùng `ring-2` + `shadow-raised` cho khớp
  ngôn ngữ §4b. **Màu `[SPEC]` §14.2 giữ nguyên từng giá trị.**

**Kiểm chứng:** typecheck / lint / prettier / `npm run build` root exit 0 · test 101/101 · axe
**18/18 màn, 0 vi phạm** · chụp trên **khoá học thật đã seed** ở 1440px và 390px, không tràn ngang.

**Bẫy mới ghi lại:** `next build` và `next dev` dùng chung `apps/web/.next`. Chạy `npm run build`
trong lúc dev server đang chạy làm mọi route trả 500 (`Cannot find module './901.js'`) — không
phải lỗi code, phải dừng dev server, `rm -rf apps/web/.next` rồi chạy lại.

## Quyết định / thay đổi gần nhất

- Cấu trúc module: **Monorepo theo HANDBOOK §4.4** (`apps/web|api|worker`, `packages/*`).
- **Redesign frontend 2026-09-18/19 (7 giai đoạn)**: học cấu trúc Duolingo, giữ nguyên bảng màu
  `[SPEC]` §14.2 và CircleMascot. Token mới là **bổ sung**, khối `[SPEC]` không đổi một giá trị nào.
  Nút primary dùng nền sky + chữ navy-900 vì chữ trắng trên `#5EC8F5` chỉ đạt 1.90:1, trượt AA
  (chữ navy-900 trên nền đó đạt 9.86:1). Con số 2.67:1 / 6.7:1 ghi trước đây là sai — tính lại
  bằng công thức WCAG 2.x ngày 2026-09-19, kết luận giữ nguyên.
- **ADR 006** — bật mascot động Blob Studio bằng `@ts-nocheck` phạm vi một file vendor, thay vì hạ
  `noUncheckedIndexedAccess` toàn repo. Kiểu được giữ lại ở wrapper `components/mascot.tsx`.
- Message tiếng Việt cho `courseTitleSchema`/`courseDescriptionSchema` trong `packages/contracts`
  (trước đó lỗi Zod tiếng Anh lọt thẳng ra UI). Các schema khác — `patchLessonSchema`,
  `submitExerciseSchema`, schema auth — **vẫn chưa có**, cần quét nốt khi có dịp.
- Phạm vi: **Full plan M0–M6**.
- Tiến trình: tự động chuyển mốc khi hoàn tất mốc trước.
- Dev API chạy bằng `nodemon` + `ts-node`/`tsconfig-paths` (không dùng `tsx` nữa — esbuild của tsx
  không emit `design:paramtypes`, làm hỏng toàn bộ constructor injection của NestJS, xem M1 ở trên);
  boot không cần Redis/Postgres bật (có error-handler + health/ready báo degraded).
- `normalize` tiếng Việt để chấm điểm giờ xử lý cả `đ→d` (test phát hiện lệch).
- ESLint flat config vào `.gitignore`, ignore `generated/`, `*.config.*`, `CircleMascot/`, `next-env.d.ts`.
- Web app: token chỉ trong memory, refresh qua cookie httpOnly (cross-port localhost là same-site).
- **Đổi tên sản phẩm 2026-09-15: "LearnFlow AI" → "LEARN"** (theo yêu cầu người dùng — tên đúng vốn
  đã dùng trong `handbook.html` từ đầu, `docs/HANDBOOK.md` bị lệch tên khi soạn). Đổi toàn diện, đã
  kiểm chứng bằng `typecheck`/`lint`/`test`/build production đều xanh sau khi đổi:
  - Tên package npm workspace: `@learnflow/*` → `@learn/*` (8 package + mọi import trong
    apps/api, apps/web, apps/worker, packages/*); root `package.json` name `learnflow-ai` → `learn`.
  - `BRAND.name` (`packages/ui/src/index.ts`) → `'LEARN'` — `Brand`/`PortfolioNav`/`PortfolioFooter`
    đều đọc từ hằng số này, không hardcode chuỗi riêng.
  - Hạ tầng: container Docker (`learnflow-postgres/redis/minio` → `learn-*`), Postgres
    user/password/db (`learnflow` → `learn`), bucket MinIO (`learnflow-documents` → `learn-documents`)
    — cập nhật ở `infra/docker-compose.yml`, `.env.example`, `apps/api/src/environment.ts`,
    `apps/worker/src/environment.ts`, `packages/db/src/index.ts` (fallback URL).
  - Tài khoản demo: `admin@learnflow.ai`/`demo@learnflow.ai` → `admin@learn.ai`/`demo@learn.ai`
    (`packages/db/prisma/seed.ts` — **cần chạy lại `npm run db:seed` trên DB mới** vì DB thật hiện
    tại, nếu còn tồn tại từ trước, vẫn có user với email cũ).
  - Toàn bộ văn bản mô tả sản phẩm: `docs/HANDBOOK.md`, `README.md`, `AGENTS.md`,
    `docs/adr/002-monorepo.md`, `docs/progress/CHECKLIST.md`, nội dung trang portfolio
    (`apps/web/src/content/portfolio.ts`), 2 tài liệu kỹ thuật rời (`docs/architecture-diagram.html`,
    `docs/ai-worker-pipeline.html`), prompt LLM thật (`packages/ai/src/prompts/{outline,lesson}.ts`).
  - Cố ý **không đổi**: tên file `learnflow-ai-portfolio-agent-spec.md` (giữ nguyên để khớp đường dẫn
    người dùng đã cung cấp — chỉ sửa nội dung bên trong file).
  - Đã `npx prisma generate` (làm mới `packages/db/generated/`) và `npm install` (làm mới
    `package-lock.json` khớp tên package mới) sau khi đổi.

## Nhật ký chi tiết

Xem `docs/progress/session-log.md`.

## Nhà cung cấp LLM — thêm Google Gemini (2026-09-22)

Người dùng cung cấp API key Google AI Studio (free trial). Codebase trước đó chỉ có
`AnthropicLlmProvider`, nên đã bổ sung adapter thứ hai sau interface `LlmProvider` (HANDBOOK §441 —
đổi nhà cung cấp không sửa pipeline):

- `packages/ai/src/llm/gemini.ts` — `GeminiLlmProvider`, gọi thẳng REST `:generateContent` bằng
  `fetch`, **không thêm SDK**. Key đi ở header `x-goog-api-key`, không bao giờ ở query string.
- `LLM_PROVIDER` mở rộng thành `'anthropic' | 'google'` ở cả `apps/api` và `apps/worker`.
  `createLlmProvider()` chặn ngay nếu provider=google mà model không thuộc họ `gemini`.
- 8 unit test (`packages/ai/src/__tests__/gemini.test.ts`) dùng fetch giả, không chạm mạng.

**Ba điều học được khi kiểm chứng thật với key này:**

1. **Gemini 1.5 và cả họ 2.5 đã bị Google khoá với key/project mới.** `gemini-1.5-flash` → 404
   "not found"; `gemini-2.5-flash` / `2.5-pro` / `2.5-flash-lite` → 404 "no longer available to new
   users". Họ cũ nhất còn gọi được là **3.1**. Đừng chép model name cũ từ tài liệu.
2. **Thought token ăn vào `maxOutputTokens`.** Gemini 3.x luôn sinh phần suy nghĩ (một prompt 16
   token vẫn tốn 140 thought token) và nó tính chung hạn mức output → để 4096 như Anthropic là dễ bị
   cắt, trả text rỗng kèm `finishReason=MAX_TOKENS`. Mặc định của adapter là 8192, và lỗi này được
   dịch thành thông báo nói rõ nguyên nhân. Thought token cũng được cộng vào `outputTokens` để
   `estimateCostUsd` không ước thiếu.
3. **503 "high demand" xảy ra thường xuyên** trên model mới nhất (`gemini-3.6-flash`,
   `gemini-flash-latest` đều 503 lúc thử). Adapter thử lại 429/503 hai lần với backoff 1s/2s.

**Cấu hình đang chạy:** `LLM_PROVIDER=google`, `LLM_MODE=live`,
`LLM_MODEL_GENERATION=LLM_MODEL_FAST=gemini-3.1-flash-lite`. Smoke test thật qua
`createLlmProvider()` cho JSON hợp lệ, 34 in / 93 out token, ~6s.

⚠️ **Bẫy cấu hình đã phát hiện:** `apps/api` và `apps/worker` gọi `dotenv/config` với cwd là thư mục
của chính app, nên chúng đọc `apps/<app>/.env` — **không** đọc `.env` ở gốc repo (README đang ngầm
hiểu ngược lại). Trước đó `apps/worker/.env` chỉ có comment và `apps/api/.env` không tồn tại, tức là
cả hai app đang chạy hoàn toàn bằng giá trị default trong zod schema (kể cả `JWT_ACCESS_SECRET`
dev-only). Key LLM vì vậy đặt ở `apps/worker/.env`.

⚠️ **Giá cho model Gemini 3.x chưa đối chiếu bảng giá chính thức** — `estimateCostUsd` dùng mức
Gemini 2.5 Pro làm fallback (cố tình ước cao để chặn `AI_JOB_MAX_COST_USD` sớm còn hơn tiêu vượt).

Dọn kèm: cắt đoạn rác UTF-16LE (`# LEARN_website`) ở cuối `README.md` — nó khiến prettier coi file là
binary và `npm run lint` đỏ từ trước phiên này.

## Đợt nâng cấp giao diện 2026-09-22 — GĐ 1–6/7 xong, GĐ 7 CHƯA làm ⚠️

Yêu cầu: "redesign website thành phiên bản upgrade" theo `taste-skill:redesign-skill`. Kế hoạch đầy
đủ (7 giai đoạn, lý do từng quyết định, checklist kiểm chứng) nằm ở
`C:\Users\hocvi\.claude\plans\ti-n-h-nh-redesign-website-zesty-swan.md` — **đọc file đó trước khi
làm tiếp GĐ 7**, phần này chỉ tóm tắt.

**Branch:** `redesign/upgrade-2026-09`, tách từ `main` lúc `main` đang có việc dở chưa commit của
người khác (Gemini provider — xem mục phía trên). Chưa merge vào `main`. 6 commit, mỗi commit ứng
với một cụm giai đoạn, đọc `git log --oneline` trên branch này để thấy đúng thứ tự.

### Đã xong (GĐ 1–6), mỗi giai đoạn đã qua `typecheck` + `eslint` + `build` xanh

1. **Bộ chữ.** Nạp Be Vietnam Pro (sans, 4 weight 400/500/600/700) + JetBrains Mono qua `next/font`
   — trước đó `--font-sans` là chuỗi hệ thống, không nạp webfont nào. Cả hai đã xác minh phủ đủ dấu
   tiếng Việt. Hai dòng `--font-*` **không** còn nằm trong khối `[SPEC]` của `theme.css` — spec
   §14.2 chỉ ràng buộc màu + "monospace cho code", chưa từng chỉ định font sans (lý do đầy đủ ở
   `docs/adr/008-chu-be-vietnam-pro-jetbrains-mono.md`, ADR mới). Gỡ hết `font-extrabold` (24 chỗ) vì
   weight 800 không nằm trong ngân sách 4 bậc — họ chữ tĩnh, thêm bậc là thêm 3 file/subset.
   **Kiểm bằng máy:** `grep -o -- "--font-sans:[^;]*;" apps/web/.next/static/css/*.css` phải có
   `var(--font-be-vietnam-pro)` đứng đầu — đã xác nhận sau build.
2. **Token + sửa lỗi AA thật.** `.lesson-content a` dùng sky-500 (~1.9:1 trên trắng, trượt AA) → đổi
   sky-700. Lỗi này **không nằm trong tầm quét của `scripts/audit-a11y.mjs`** (route bài học không có
   trong `LEARNER_ROUTES`) — kiểm tay, hoặc thêm route bài học vào audit trước khi tin kết quả audit
   là đủ. Thêm thang bo góc 3 bậc + `--shadow-overlay`, `.focus-ring{,-tight,-dark}` (thay 23 chỗ gõ
   lại), `scroll-behavior: smooth`, `text-wrap`, `tabular-nums`.
3. **Primitive dùng chung (thuần thêm mới).** `InlineError` (states.tsx) thay 11 bản banner lỗi chép
   tay giống hệt nhau — bản cũ không có icon, tức chỉ dựa vào màu để báo lỗi (UI-GUIDE §2 cấm).
   `errorText()`/`errorDetail()` gom vào `lib/api-client.ts`. `RevealOnScroll`/`StaggerOnScroll` cho
   trang chủ — xem cảnh báo động cơ ở mục 5.
4. **Quét nhất quán 12 màn `(app)`.** Gộp 11 banner lỗi + 4 bản `errorText` cục bộ; sửa 2
   `TableSkeleton` sai số cột (`admin/ai-jobs` 6→7, `admin/subscriptions` 5→4); dựng lại
   `admin/ai-jobs/[jobId]` (màn lệch chuẩn nhất — thiếu `PageHeader`, thiếu nhánh lỗi cho
   `auditLog`, skeleton kiểu "tảng xám"); thêm `EmptyState size="compact"` cho mục con của màn đã có
   nội dung (luật mới, ghi vào UI-GUIDE §4c); sửa 2 chỗ trạng thái bị nuốt (`/dashboard` bỏ qua lỗi
   `courses`, `/settings` gộp 2 query độc lập thành 1 cổng ăn-cả-ngã-về-không); trải motion ra
   `/courses`/`/progress`/`/settings`/5 bảng admin; xác nhận huỷ gói theo mẫu 2 nhịp giống xoá bài
   học; 4 tàn dư viền 2px còn sót sau đợt §4b.
5. **Trang chủ portfolio — phần việc lớn nhất.** `app/page.tsx` tách server/client (metadata giờ
   xuất được — trước đó cả trang `'use client'` vì `LanguageProvider`); hero thêm khung xem trước
   sản phẩm (bịt khoảng trống spec §10.1, trước đó chỉ có mascot); phá nhịp 4 lưới `sm:grid-cols-3`
   liên tiếp (TargetUsers/ProductValue/CoreFeatures/Screenshots) thành 4 hình thái khác nhau — không
   màu mới, không bịa dữ liệu; nav có scroll-spy; footer có link thật; xoá `GITHUB_INFO.cta` vì repo
   chưa public (CTA chết còn tệ hơn không có CTA).

   ⚠️ **Phát hiện quan trọng, phải đọc trước khi động vào `lib/motion.tsx`:** `whileInView` của
   `motion` (Framer Motion) **kẹt vĩnh viễn ở trạng thái ẩn** trong ít nhất một môi trường thực tế
   đã gặp khi build phần này (cửa sổ trình duyệt bị che/tab nền — `IntersectionObserver` không bao
   giờ bắn callback, đo trực tiếp chứ không phải suy đoán). Thử kết hợp `animate` làm lưới an toàn
   cũng không ăn thua. `RevealOnScroll`/`StaggerOnScroll` hiện **không dùng `motion.div` nữa** — tự
   quản bằng `IntersectionObserver` + CSS transition thuần (Tailwind), cộng lưới an toàn ép hiện sau
   1 giây. Trạng thái "ẩn" dùng `opacity-60` chứ không phải `opacity-0`, để nếu paint có kẹt ở đâu đó
   thì ảnh chụp màn hình (`capture-ui.mjs`) vẫn đọc được nội dung thay vì trắng trơn. Toàn bộ lý do +
   cách đo nằm trong docblock ngay trên `RevealOnScroll` ở `lib/motion.tsx` — đọc nó trước khi "sửa
   lại cho giống code cũ".
6. **Hạ tầng route Next.js còn thiếu.** `not-found.tsx`, `error.tsx`, `global-error.tsx`,
   `sitemap.ts`, `robots.ts`, `metadataBase`/`openGraph`/`twitter` ở root layout, metadata riêng cho
   3 màn `(auth)` (tách server/client theo đúng mẫu trang chủ). `env.siteUrl` dùng lại `APP_URL` đã
   có sẵn trong `.env.example` (không thêm biến trùng nghĩa) — nhưng `apps/web` **không tự đọc `.env`
   gốc repo** (đúng bẫy đã ghi ở mục Gemini phía trên, giờ áp cho cả web app), nên khi deploy thật
   phải set `APP_URL` ở nơi Next.js thực sự đọc được (env của nền tảng deploy, hoặc `apps/web/.env`).

### CHƯA làm — GĐ 7 (bắt buộc trước khi coi đợt này là xong)

Đọc mục "Giai đoạn 7" trong file kế hoạch để có chi tiết đầy đủ. Tóm tắt:

- **7a — token thang chữ:** chỉ thêm nếu vòng rà soát cho thấy cỡ chữ ad-hoc lặp lại ≥ 2 lần. Chưa
  rà soát.
- **7b — dọn code chết/tài liệu cũ:** xoá `useCourseProgress` (`lib/learning-api.ts:132`, 0 call
  site — đã xác nhận trước khi bắt đầu redesign, chưa xoá), xoá 4 file mồ côi
  `apps/web/public/mascot/*.svg`, sửa mệnh đề cảnh báo lệch token đã sai trong
  `packages/ui/src/index.ts:4-8` (giá trị hiện đang khớp `theme.css`, không còn lệch).
- **7c — CHỤP LẠI ẢNH PORTFOLIO — bắt buộc, làm cuối cùng.** `apps/web/public/screenshots/*.png`
  (dùng ở trang chủ, section Screenshots) vẫn là ảnh **TRƯỚC** đợt nâng cấp — font hệ thống, UI cũ.
  Chạy `docker compose -f infra/docker-compose.yml up -d && npm run db:migrate && npm run db:seed &&
  npm run dev`, rồi `node scripts/capture-screenshots.mjs`. Nếu không làm bước này, trang chủ đang
  quảng cáo một thiết kế không còn tồn tại.
- **7d — gate cuối + checklist thủ công:** `rm -rf apps/web/.next && npm run build -w apps/web`,
  `npm run typecheck -w apps/web`, `npx eslint apps/web/src`,
  `node scripts/audit-a11y.mjs` (cần full stack — **bắt buộc chạy lại** vì đổi font làm đổi chiều
  cao dòng/bề rộng chữ, có thể ảnh hưởng tương phản ở nền có pha màu), 3 lệnh `capture-ui.mjs` (1440,
  390, `--reduced-motion`). Checklist thủ công đầy đủ nằm ở cuối file kế hoạch (mục "Kiểm chứng") —
  gồm cả việc xác nhận không dòng `--color-*` nào trong khối `[SPEC]` của `theme.css` bị đổi.

### Việc chưa làm, ngoài phạm vi GĐ 1–7 (không chặn, ghi lại để khỏi quên)

- `docs/UI-GUIDE.md` cần thêm mục cho `InlineError`, `RevealOnScroll`, luật `EmptyState
  size="compact"` mới (đã ghi luật vào §4c trong lúc làm GĐ4, nhưng §4b "Primitive mở rộng thêm" và
  §2 (token chữ) chưa cập nhật đủ — kiểm lại khi làm 7a/7b).
- Chưa merge branch vào `main`. Người yêu cầu đợt này tạm dừng phiên trước khi merge — hỏi lại trước
  khi merge, đặc biệt vì `main` đang có việc dở của người khác chưa commit.
- Ảnh chụp `docs/screenshots/ui/root-*.png` sinh ra trong lúc làm GĐ5 (`root-1440.png`,
  `root-1440-rm.png`, `root-390.png`) là ảnh **kiểm tra tạm**, không phải ảnh portfolio cuối — không
  copy sang `apps/web/public/`.
