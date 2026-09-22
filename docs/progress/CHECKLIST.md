# CHECKLIST.md — Checklist master triển khai

> Phản chiếu HANDBOOK §20. Chỉ đánh `[x]` khi **tiêu chí thật sự đạt** (test xanh, có minh chứng).
> Tiêu chí "ra mốc" chi tiết ở HANDBOOK §19.3.

Hướng dẫn ký hiệu: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong (có minh chứng).

---

## 20.1 Giai đoạn 0 — Khởi tạo (M0)

> M0 đã đạt tiêu chí ra mốc (HANDBOOK §19.3-M0): typecheck + lint + test xanh + API boot OK.
> Các mục `[~]` phía dưới là **đã code xong nhưng chưa kiểm chứng được** vì máy hiện tại không có Docker.

**Repo và công cụ**

- [x] `git init` (2026-09-14, chưa commit đầu tiên), thêm `.gitignore`, `.editorconfig`, `.nvmrc`
- [x] Dựng monorepo theo cấu trúc HANDBOOK §4.4
- [x] Cấu hình TypeScript `strict` dùng chung ở `packages/config`
- [~] ESLint + Prettier + husky + lint-staged — ESLint + Prettier xanh; **husky + lint-staged chưa cài**
- [x] `.env.example` đủ mọi biến HANDBOOK §22.1, giá trị rỗng
- [x] README: mô tả dự án, yêu cầu hệ thống, các bước chạy local

**Hạ tầng dev**

- [~] `infra/docker-compose.yml`: postgres 16, redis 7, minio — file có; chưa chạy (không có Docker)
- [~] Tự tạo bucket MinIO khi khởi động — có trong compose; chưa chạy thử
- [~] Script `db:migrate`, `db:seed`, `db:reset` — có script; chưa chạy trên DB thật

**Database**

- [x] Prisma schema đủ 18 model ở HANDBOOK §6.2 — `prisma generate` OK, typecheck OK
- [~] Migration đầu tiên chạy sạch trên DB rỗng — chờ Docker/DB
- [~] Seed: 2 Plan, 1 admin, 1 learner demo có dữ liệu mẫu — đã viết `seed.ts`; chạy thử khi có DB
- [~] Index đã tạo đúng như khai báo — khai báo trong schema; verify khi có DB

**CI**

- [x] Workflow: lint · typecheck · test · build · audit — `.github/workflows/ci.yml` có lint/typecheck/test/build; audit dùng npm install (thêm `npm audit` khi cần)
- [x] Cả 4 job chạy **xanh thật** — 2026-09-19 phiên 12: sửa 34 lỗi typecheck `packages/ai` tests và thêm script `build` còn thiếu của worker (trước đó `npm run typecheck` và `npm run build` ở root đều fail)
- [ ] Yêu cầu CI xanh mới merge được vào `main` — chưa có branch protection (chưa đẩy lên GitHub)

## 20.2 Giai đoạn 1 — Authentication (M1) `[SPEC]` 6.1

> Trạng thái 2026-09-14: backend đã kiểm chứng thật trên Postgres/Redis (docker compose). Frontend chưa
> test end-to-end với API thật. Các mục `[~]` còn lại = code xong, chưa có test tự động (mới test tay).
> Cập nhật 2026-09-15: register/login/refresh/reuse-detection/me giờ có **integration test tự động**
> ở `apps/api/src/modules/auth/__tests__/auth.integration.test.ts` (8 test, gọi thẳng server thật —
> xem STATE.md mục "Auth — integration test tự động" để biết lý do không bootstrap qua NestJS Testing
> trong tiến trình vitest). `PATCH /auth/me`, `change-password`, argon2id params vẫn chưa test.

**Backend**

- [x] `POST /auth/register` — test tay: đăng ký thành công (201), validate field bắt buộc (400) đúng
- [x] `POST /auth/login` — test tay: đúng mật khẩu (201), sai mật khẩu (401)
- [x] `POST /auth/refresh` có xoay vòng token — test tay: refresh qua cookie httpOnly thành công, token mới khác token cũ
- [x] `POST /auth/logout` và `/auth/logout-all` — test tay: logout xong, refresh bằng cookie cũ bị 401 ngay
- [x] `GET /auth/me` trả hồ sơ + gói + hạn mức còn lại — test tay: trả đúng user + plan FREE + usage
- [~] `PATCH /auth/me` — chưa test tay
- [~] `POST /auth/change-password` thu hồi các phiên khác — chưa test tay
- [ ] Băm argon2id đúng tham số ở HANDBOOK §10.1 — chưa verify tham số cụ thể
- [x] Phát hiện tái sử dụng refresh token, thu hồi cả family — **test thật 2026-09-15**: login →
      rotate 1 lần (token1→token2) → replay token1 đã bị thu hồi → đúng 401, và **token2 hợp lệ
      (chưa từng bị lộ) cũng bị thu hồi theo** — verify trực tiếp trong DB cả 2 dòng `RefreshToken`
      cùng `familyId` đều có `revokedAt` set, đúng ngữ nghĩa bảo mật thật của "thu hồi cả family"
      (không chỉ chặn token bị replay mà buộc toàn bộ phiên đó đăng nhập lại)
- [x] Rate limit đăng nhập 5 lần/phút/IP — test tay: 4 lần đầu 401, từ lần 5 → 429 đúng như spec
- [x] Guard cho `ADMIN` — test tay 2026-09-19, **cả hai tầng**: LEARNER vào `/admin/users` bị
      redirect về `/dashboard` (lớp UX ở `admin/layout.tsx`), và gọi thẳng
      `GET /api/v1/admin/users` bằng access token LEARNER trả `403 FORBIDDEN`
      (`RolesGuard`). Đã đi qua đủ 5 trang admin bằng `admin@learn.ai`

**Frontend**

- [x] Trang đăng ký, đăng nhập — apps/web: `/login`, `/register` (client Zod + hiển thị lỗi, `?next=`); test qua browser thật
- [x] Lưu access token trong memory, gọi refresh khi khởi động app — test qua browser: reload trang giữ session đúng qua refresh cookie
- [x] Bảo vệ route, chuyển hướng có nhớ trang đích — test qua browser: guest vào `/dashboard` bị redirect `/login`
- [x] Layout web app: sidebar, header, menu người dùng — `AppShell` dựng lại 2026-09-18 thành
      3 cột (sidebar icon + dải chỉ số + rail gói/hạn mức), tab đáy trên mobile, ẩn rail trên
      `/admin`; menu logout/logout-all giữ nguyên
- [x] Tự động refresh khi nhận 401, thử lại request một lần — test qua browser (đăng nhập → dashboard hoạt động đúng)
- [ ] Trang quên mật khẩu hoàn chỉnh — backend chưa có endpoint gửi email; trang hiện báo "đang phát triển"

## 20.3 Giai đoạn 2 — Course và Document (M2) `[SPEC]` 6.2, 6.3

> Trạng thái 2026-09-14: backend Course + Document đã kiểm chứng thật lần đầu (trước đó code có sẵn
> nhưng chưa ai chạy). 2 bug chặn hoàn toàn upload đã tìm và sửa — xem STATE.md mục M2. Frontend Course
> list/create/detail + upload đã dựng và test qua browser thật.

**Course**

- [~] Đủ 6 endpoint ở HANDBOOK §7.2 — đã test tay `POST /courses`, `GET /courses/:id`, `GET /workspace`;
  chưa test `PATCH`, `DELETE`, `POST /courses/:id/reorder`
- [~] Kiểm tra hạn mức khi tạo — có `usage.assertNotExceeded('COURSES_CREATED')`; chưa test case vượt hạn mức
- [~] Lọc quyền sở hữu ở tầng repository — có `owned()` filter theo `ownerId`; chưa test user khác không truy cập được
- [x] Trang danh sách Course có tiến độ tóm tắt — test qua browser: hiển thị đúng progress/documentCount
- [~] Trang chi tiết Course: tài liệu, bài học, job gần nhất — có tài liệu; bài học + AI job chưa (thuộc M3)
- [x] Empty state dùng mascot Circle — `sleeping.svg` — test qua browser, cả Course list và Document list

**Document**

- [x] Cấp presigned URL có kiểm tra hạn mức và định dạng — test tay, có `assertNotExceeded('DOCUMENTS_UPLOADED')` + `ALLOWED_MIME`
- [x] Endpoint xác nhận upload → đẩy job trích xuất — test thật end-to-end: confirm → enqueue
      `document-extract` → worker xử lý → `Document.status` chuyển `EXTRACTED` (2026-09-14, xem M3)
- [x] Kiểm tra magic bytes ở worker — xem mục "Trích xuất và chunking" bên dưới
- [x] Chặn trùng bằng checksum trong cùng Course — **mới implement 2026-09-15** (trước đó
      `checksumSha256` chỉ được lưu, chưa từng được so khớp — checklist ghi "chưa test" nhưng thật ra
      là chưa viết); `requestUpload()` giờ chặn 409 nếu đã có Document khác cùng Course, cùng
      checksum, không ở trạng thái `PENDING` (bỏ qua PENDING để không chặn nhầm khi lần upload trước
      bị bỏ dở, chưa từng confirm). Test thật qua curl: upload lại đúng checksum tài liệu seed có sẵn
      → 409 kèm tên file trùng; upload checksum khác → 201 bình thường; dọn sạch document test tạo ra
      và reset counter `DOCUMENTS_UPLOADED` bị test làm tăng nhầm.
- [~] Giới hạn kích thước và số trang — có check `sizeBytes > DOCUMENT_MAX_SIZE`; chưa test case vượt giới hạn
- [ ] Upload có thanh tiến độ, có huỷ được — hiện chỉ có trạng thái "đang tải lên", chưa có progress bar/huỷ
- [ ] Hiển thị trạng thái tài liệu thời gian thực — hiện chỉ refetch qua React Query, chưa có polling/SSE
- [~] Trạng thái lỗi có thông điệp rõ và nút thử lại — có message lỗi; chưa có nút "thử lại" riêng cho từng tài liệu
- [x] Xoá tài liệu xoá cả file trên storage — `DELETE /documents/:id` (**mới viết**, HANDBOOK §7.2);
      hard delete DB row (Document không có `deletedAt` như Course/Lesson) + xoá object trên MinIO
      (best-effort, không rollback DB nếu xoá storage lỗi); `DocumentChunk` tự xoá theo
      `onDelete: Cascade`; chặn xoá khi `status=EXTRACTING` (409) để tránh worker ghi lỗi "record not
      found" giữa chừng. **Test thật end-to-end qua curl + MinIO thật** (không phải giả định): tạo
      tài liệu thật → PUT lên MinIO → confirm → worker trích xuất xong (EXTRACTED) → gọi xoá → verify
      DB row mất, object trên MinIO mất (`mc ls` xác nhận), 0 `DocumentChunk` mồ côi; test riêng
      nhánh 409 bằng cách ép status EXTRACTING rồi gọi xoá. Nhân tiện dọn 2 object mồ côi thật trên
      MinIO còn sót từ các lượt test trước (đã xác nhận không còn Document DB nào tham chiếu).

**Trích xuất và chunking** — code ở `apps/worker/src/extraction/`, test thật 2026-09-14

- [x] Trích PDF có text layer — `pdfjs-dist` (bản ESM, dùng dynamic import shim); test thật với PDF
      1 trang có text thật, trích đúng nội dung
- [~] Nhận diện PDF scan và chuyển OCR — nhận diện đúng (`isLikelyScanned`, ngưỡng <100 ký tự/trang);
  **chưa làm OCR**, hiện báo lỗi rõ ràng (`ScannedPdfNotSupportedError`) thay vì xử lý
- [~] Hỗ trợ PPTX, DOCX, TXT, MD — TXT/MD đã test thật (kể cả tiếng Việt có dấu, giữ đúng UTF-8);
  **PPTX/DOCX chưa làm** (cần `officeparser`/`mammoth`), báo `UnsupportedFileError` rõ ràng
- [~] Chuẩn hoá: bỏ header/footer lặp, nối từ gạch nối, bỏ mục lục — có nối gạch nối + gộp dòng trống
  (`normalizeText()`); **chưa làm** phát hiện header/footer lặp và bỏ mục lục
- [ ] Nhận diện heading, ghi `headingPath` — chunk vẫn có field này nhưng luôn null (chưa có heuristic)
- [x] Cắt chunk 1200 token, chồng lấn 150, tôn trọng ranh giới câu — dùng `chunkDocument()` có sẵn từ
      trước, nay verify thật qua worker
- [x] Ghi khoảng trang cho mỗi chunk — `pageFrom`/`pageTo` đúng theo trang PDF; test thật xác nhận
- [ ] Test biên: file rỗng, 1 trang, 300 trang, không có text — chưa có test tự động cho các case này
- [x] Kiểm tra magic bytes ở worker — `%PDF-` cho PDF, phát hiện byte NUL cho text/plain giả mạo

## 20.4 Giai đoạn 3 — AI Pipeline (M3) `[SPEC]` 6.4

> Trạng thái 2026-09-14: `apps/worker` mới tạo, core pipeline (extract TXT/PDF → chunk → outline →
> lesson → validate → ghi DB) đã kiểm chứng thật end-to-end với Postgres/Redis/MinIO + LLM mock.
> Xem chi tiết bug đã sửa và phần cố ý chưa làm ở STATE.md mục M3.

**Hạ tầng job**

- [~] BullMQ với 4 queue ở HANDBOOK §9.1 — có đủ 4 queue; `document-extract`/`lesson-generate` đã có
  worker tiêu thụ thật; `billing-sync`/`maintenance` chưa có worker (thuộc M5)
- [x] Worker chạy tiến trình riêng — `apps/worker`, NestJS standalone, test chạy thật + xử lý job thật
- [x] Chuyển trạng thái AIJob bằng update có điều kiện — `updateMany({where:{status:'QUEUED'}})`,
      test tay xác nhận idempotent khi document/job không còn ở trạng thái mong đợi
- [~] Retry có backoff mũ — cấu hình khi enqueue (`attempts:3, backoff: exponential`); chưa test case
  job thất bại thật để xác nhận backoff chạy đúng
- [ ] Dead-letter queue + trang admin xem được
- [ ] Job định kỳ
- [x] Tắt worker êm (chờ job hiện tại xong) — `SIGTERM`/`SIGINT` handler gọi `worker.close()`; chưa
      test tay việc chờ job đang chạy xong thật (chỉ verify code, không simulate kill giữa chừng)

**Sinh nội dung**

- [x] Interface `LlmProvider` + adapter cho nhà cung cấp — có sẵn (mock + Anthropic), worker dùng qua
      factory `createLlmProvider()` theo `LLM_MODE`
- [x] Prompt lưu thành file, có version — `outline@1`, `lesson@1`, ghi vào `GenerationRun.promptVersion`
- [x] Sinh outline — một lần gọi — test thật qua mock LLM, ghi đúng `GenerationRun` step='outline'
- [x] Sinh lesson + exercise — song song tối đa 3 — `mapLimit()` giới hạn `AI_MAX_CONCURRENT_CALLS`;
      test thật mới có 1 node nên chưa quan sát được thật sự chạy song song ≥2, cần test course nhiều chunk hơn
- [x] Dùng structured output — parse JSON qua `extractJson()` + Zod schema
- [x] Timeout 120s mỗi lần gọi, 15 phút mỗi job — implement qua `Promise.race`/deadline check; chưa
      test tay case thật sự vượt timeout
- [x] Trần chi phí mỗi job — check `costSoFar >= AI_JOB_MAX_COST_USD` trước mỗi lesson; chưa test case vượt trần
- [x] Ghi `GenerationRun` cho mọi lần gọi — test thật xác nhận đủ input/output token, cost, latency, attempt

**Validation — bốn tầng**

- [x] Tầng 1: Zod schema — `validateLessonOutput()`, đã có từ trước, nay verify thật qua worker
- [x] Tầng 2: luật nghiệp vụ (HANDBOOK §8.4) — `businessRuleViolations()`, đã có từ trước
- [x] Tầng 3: kiểm tra bám nguồn, gắn cờ `LOW_CONFIDENCE` — **test thật xác nhận hoạt động**: lesson
      mock bị gắn đúng `confidence=LOW`
- [x] Tầng 4: sanitize Markdown, cắt độ dài — `sanitizeLessonOutput()`, đã có từ trước
- [x] Retry có phản hồi lỗi cụ thể — `previousError` truyền lại vào prompt lần sau (cả outline lẫn lesson)
- [x] Ghi Lesson trong một transaction — `prisma.$transaction()`, test thật xác nhận Lesson+Exercise+
      Question+AnswerOption ghi đúng, đủ quan hệ
- [~] Thành công một phần: giữ phần tốt, ghi `partialFailures` — có code xử lý; chưa test case thật có
  lesson thất bại xen giữa lesson thành công

**Giao diện tiến độ**

- [~] SSE `/ai-jobs/:id/stream` có heartbeat — có sẵn ở API; worker publish đúng kênh `job:<id>`;
  frontend **chưa dùng kênh này** (`EventSource` trình duyệt không gửi được header
  `Authorization` mà route yêu cầu) — dùng polling 2s thay thế, xem mục dưới
- [x] Fallback polling 3 giây — `useAiJob()` (`apps/web/src/lib/ai-api.ts`) poll 2s qua
      `refetchInterval` điều kiện, dừng poll khi job vào trạng thái cuối; test thật qua browser
- [x] UI hiện phần trăm + nhãn bước + mascot `working.svg` — `AiJobProgress`
      (`apps/web/src/components/ai-job-progress.tsx`), đọc đúng `progressLabel` worker publish theo
      từng node (vd "Đã sinh 2/3 bài học"); test thật qua browser + curl, wire vào
      `courses/[courseId]/page.tsx` thay hoàn toàn logic poll-mù cũ
- [x] Huỷ job được — `POST /ai/jobs/:id/cancel` (nguyên tử, 409 nếu job đã ở trạng thái cuối) + worker
      tự kiểm tra `isCancelled()` trước outline và trước mỗi node trong `mapLimit`, dừng êm không ghi
      dở lesson; **test thật cả 2 nhánh**: huỷ job đã SUCCEEDED → 409; huỷ job đang RUNNING thật
      (tạm tăng độ trễ mock LLM để bắt kịp, đã revert) → chuyển đúng CANCELLED, không tạo Lesson nào,
      xác nhận cả qua curl lẫn bấm nút "Huỷ job" thật trên UI
- [x] Trạng thái lỗi dùng `alerting.svg`, có nút thử lại — `AiJobProgress` hiện đúng mascot
      `alerting` + thông điệp cho cả FAILED và CANCELLED, nút "Thử lại" xoá job đang theo dõi để hiện
      lại nút sinh bài học; test thật qua browser

**Sửa nội dung — C-01, C-02**

- [x] Sửa `contentMd` của Lesson — `PATCH /courses/:courseId/lessons/:lessonId`
      (`patchLesson()` có sẵn từ trước nhưng chưa test); thêm form sửa ở
      `lessons/[lessonId]/page.tsx` ("Sửa bài học" → title/summary/contentMd → Lưu); test thật
      qua browser: sửa tiêu đề + nội dung, lưu thành công, nội dung mới hiển thị đúng ngay
- [x] Sắp xếp lại thứ tự Lesson — `PATCH /courses/:courseId/lessons/reorder` (**mới viết**,
      `reorderLessons()` validate hoán vị đầy đủ + transaction 2 bước tránh đụng
      `@@unique([courseId, orderIndex])`); nút ▲▼ ở `courses/[courseId]/page.tsx`; test thật qua
      browser: đổi thứ tự 2 lesson, DB `orderIndex` cập nhật đúng, danh sách hiện đúng thứ tự mới
- [x] Đánh dấu `editedByUserAt` khi người dùng sửa — `patchLesson()` set `new Date()` mỗi lần
      sửa; thêm field vào `lessonReadSchema`; UI hiện "✎ Đã chỉnh sửa lúc {giờ}"; test thật xác
      nhận timestamp xuất hiện đúng sau khi lưu
- [x] Xoá Lesson — `DELETE /courses/:courseId/lessons/:lessonId` (**mới viết**, soft delete qua
      `deletedAt`); nút "Xoá bài học" ở trang đọc bài → xác nhận inline ("Xác nhận xoá"/"Huỷ") → xoá
      → điều hướng về trang khóa học. **Test thật qua browser + curl + verify DB**: xoá 1 lesson thật
      trong khóa học demo, xác nhận biến mất khỏi danh sách, `deletedAt` được set trong DB, sau đó
      khôi phục lại (xoá `deletedAt`) để giữ nguyên dữ liệu demo cho ảnh chụp/CTA. **Phát hiện và sửa
      1 bug thật khi test tổ hợp xoá + sắp xếp lại**: `reorderLessons()` dùng base tạm cố định
      `-1-i` để tránh đụng `@@unique([courseId, orderIndex])` giữa lúc cập nhật — nhưng Lesson đã xoá
      mềm vẫn giữ `orderIndex` (deleteLesson đẩy nó xuống -1) nên base cố định `-1-i` đụng ngay giá
      trị đó → `500 INTERNAL_ERROR` thật khi gọi reorder sau khi đã xoá 1 lesson. Sửa: tính base tạm
      **động** từ `MIN(orderIndex)` thật của toàn bộ Lesson (kể cả đã xoá) trừ thêm 1, đảm bảo không
      bao giờ đụng bất kỳ giá trị nào đang tồn tại. Test lại xác nhận reorder sau khi xoá hoạt động
      đúng (200, không còn 500).

## 20.5 Giai đoạn 4 — Học tương tác và tiến trình (M4) `[SPEC]` 6.5, 6.6

> Trạng thái 2026-09-14: core đã kiểm chứng thật end-to-end qua browser (đọc bài → làm bài → nộp →
> chấm điểm → tiến độ → dashboard). 3 bug tìm thấy và sửa (route trùng, `correctAnswer` sai field cho
> TRUE_FALSE/SHORT_ANSWER/FILL_BLANK, `activeStreak` tính sai) — xem STATE.md mục M4.
> Cập nhật 2026-09-15: C-01 (sửa nội dung), C-02 (sắp xếp lại) và Xoá Lesson đều đã hoàn thành và
> test thật, xem mục "Sửa nội dung — C-01, C-02" bên dưới.

- [x] Trang đọc bài, render Markdown đã sanitize — test qua browser: nội dung tiếng Việt có dấu render
      đúng; sanitize 2 lớp (worker lúc sinh + DOMPurify lúc render)
- [x] Mục lục trong bài với tài liệu dài — có trích heading tự động (`renderMarkdown` trong
      `markdown.tsx`); **chưa test tay với bài thật nhiều heading** (nội dung mock chỉ có 1 heading nên
      TOC ẩn theo đúng logic "chỉ hiện khi > 1 mục")
- [x] Đủ 4 loại câu hỏi có UI riêng — MULTIPLE_CHOICE test qua browser thật (100 điểm rồi 0 điểm);
      TRUE_FALSE/SHORT_ANSWER/FILL_BLANK có UI + unit test `gradeAnswer` nhưng **chưa test qua browser**
      (mock LLM hiện chỉ sinh câu MULTIPLE_CHOICE)
- [x] **DTO đọc bài loại bỏ `correctAnswer` và `isCorrect`** — verify qua code `exerciseReadSchema`/
      `exercises.service.ts#getExerciseRead` (không map 2 field này ra response)
- [x] Nộp bài chấm điểm phía server — test qua browser: điểm tính đúng, không tin dữ liệu client
- [x] Hiện điểm, đúng/sai từng câu, giải thích sau khi nộp — test qua browser, đúng cho cả pass/fail
- [x] Làm lại, ghi `attemptNo`, giữ điểm cao nhất — **test thật xác nhận**: nộp 2 lần (100 rồi 0),
      `attemptNo` 1→2, `bestScore` giữ nguyên 100, `status` không bị hạ cấp khỏi `COMPLETED`
- [x] Đánh dấu bắt đầu và hoàn thành bài — thêm mới endpoint `/lessons/:id/start` (trước đây không có
      gì đánh dấu IN_PROGRESS); test qua browser: badge tự chuyển "Chưa bắt đầu" → "Đang học" khi mở bài
- [x] Mascot `celebrate.svg` khi hoàn thành — test qua browser: hiện đúng khi pass, `sleeping` khi fail
- [x] Tiến độ Course cập nhật ngay — test qua browser: dashboard + trang Tiến trình cập nhật đúng ngay
      sau khi nộp bài (React Query invalidate)
- [x] Dashboard: số Course, bài đã xong, điểm trung bình — test qua browser, dữ liệu thật chính xác
      (1 khóa học, 1/1 bài, điểm TB 100.0, chuỗi 1 ngày)
- [~] Lịch sử học có phân trang — có nút "Xem thêm" (tăng `limit`); **không phải cursor-based** như
  HANDBOOK §7.1 quy định — quyết định có chủ đích, xem STATE.md
- [~] Test cho mọi nhánh chấm điểm — 11 unit test cho `gradeAnswer` (đủ 4 loại câu hỏi, đã có từ trước);
  **chưa có integration test** cho luồng nộp bài đầy đủ qua API thật

## 20.6 Giai đoạn 5 — Subscription và Admin (M5) `[SPEC]` 6.7, 6.8

> Trạng thái 2026-09-14: backend hầu hết đã có sẵn, đã kiểm chứng thật lần đầu qua browser + API trực
> tiếp. 5 bug tìm và sửa (thiếu tăng đếm DOCUMENTS_UPLOADED, courseCount hardcode, dailyCosts group sai,
> webhook `@Res()` dead-return, thiếu 2 endpoint admin) — xem STATE.md mục M5.

**Gói và hạn mức**

- [x] `GET /plans` công khai — test thật: trả đúng 3 gói (Free/Pro/Team) đúng giá/limit theo spec
- [x] Trang giá lấy dữ liệu từ DB, gói Team gắn nhãn tương lai — test qua browser: `/settings` hiện
      đúng "Mở rộng tương lai" + nút disable "Chưa mở bán" cho Team
- [x] Hạn mức lưu trong `Plan.limits`, không hardcode — verify qua seed.ts + `usage.service.ts` đọc từ
      `plan.limits`, không có số cứng trong code nghiệp vụ
- [x] Chặn đúng ở cả 4 chỉ số — COURSES_CREATED/AI_JOBS_RUN/DOCUMENTS_UPLOADED test thật tăng đúng
      qua `UsageService` (cộng dồn theo tháng/tổng); **PAGES_PROCESSED mới implement 2026-09-15**
      (trước đó hoàn toàn không chặn gì — mọi gói kể cả FREE xử lý được tài liệu tới trần cứng toàn
      hệ thống 300 trang, không theo gói) — vì `window: "per_document"` khác hẳn 3 metric kia (không
      phải bộ đếm cộng dồn), enforce đúng chỗ ở `document-extract.processor.ts` (worker) ngay sau khi
      biết `pageCount` thật, tra `Plan.limits.PAGES_PROCESSED.limit` theo gói người upload. Test thật
      tra cứu đúng DB (không phải đoán): FREE→50, PRO→300, khôi phục lại đúng gói ban đầu sau test;
      test thêm 1 lượt upload+extract thật qua worker đang chạy để xác nhận không phá luồng thành
      công hiện có (document dưới hạn mức vẫn `EXTRACTED` bình thường)
- [x] Tăng bộ đếm nguyên tử, có test tranh chấp — dùng `upsert` + `increment` nguyên tử (đúng SQL pattern
      HANDBOOK §11.3); **test tranh chấp thật**: script bắn 20 lượt `increment()` đồng thời cho một user mới
      (limit AI_JOBS_RUN=10) → giá trị cuối trong DB đúng bằng 20 (không mất update nào), đúng 10 lượt bị
      chặn quota — script chạy tay 1 lần với DB thật rồi xoá (không commit vào vitest vì CI chưa có service
      Postgres, xem next-actions)
- [x] Lỗi 402 kèm `limit` và `used` — test thật: tạo user chạm đúng hạn mức (COURSES_CREATED 3/3,
      DOCUMENTS_UPLOADED 5/5) → API trả đúng `{code: QUOTA_EXCEEDED, meta: {metric, limit, used}}`
- [x] UI hiện mức dùng còn lại trong settings — test qua browser: 4 progress bar đúng số liệu thật
- [x] Chạm hạn mức → gợi ý nâng cấp — thêm `QuotaNotice` component, gắn vào tạo khóa học + tải tài liệu +
      sinh bài học; test qua browser thật: chạm hạn mức khóa học (3/3) và tài liệu (5/5) đều hiện đúng băng
      cảnh báo "Bạn đã dùng X/Y ... — đã chạm hạn mức" kèm link `/settings`, không tạo bản ghi thừa trong DB

**Thanh toán**

- [x] Checkout chỉ nhận `planCode`, giá lấy từ DB `[SPEC]` — verify code: `checkoutSchema` chỉ có
      `planCode`, giá lấy từ `Plan.priceCents`; test thật xác nhận nâng cấp đúng limit theo DB
- [ ] Webhook xác minh chữ ký — Stripe live chưa cấu hình (đúng chủ đích, xem STATE.md); không giả vờ
      đã tích hợp — `webhookHandler` throw lỗi rõ ràng thay vì fake success
- [ ] Ghi `PaymentEvent` trước khi xử lý, chống trùng theo `eventId` — chưa áp dụng (chờ Stripe live)
- [ ] Cập nhật Subscription theo webhook, không theo trang redirect — N/A ở chế độ demo (kích hoạt
      ngay theo đúng `[QĐ]` HANDBOOK §11.4 "Chế độ DEMO")
- [ ] Trang "thành công" chỉ poll, không tự kích hoạt gói — N/A ở chế độ demo, chưa làm trang riêng
      (redirect thẳng về `/settings?upgraded=1`, chưa xử lý query param này ở UI)
- [x] Huỷ ở cuối kỳ — test thật: `cancelAtPeriodEnd=true`, status vẫn `ACTIVE` tới `currentPeriodEnd`
- [x] Chế độ demo có băng rôn cảnh báo rõ ràng — test qua browser: băng rôn vàng hiện đúng ở `/settings`

**Admin**

- [x] 5 trang: users, courses, ai-jobs, subscriptions, metrics — cả 5 test qua browser thật (2 trang
      thiếu route `/admin/courses`+`/admin/subscriptions` đã bổ sung trong phiên này)
- [x] Bảng AI Job có lọc trạng thái và hiện tỉ lệ thất bại — test qua browser: dropdown lọc + % hiện đúng
- [x] Chạy lại job thất bại — thêm `POST /admin/ai-jobs/:id/retry` (chỉ cho job `FAILED`, 409 nếu không) + trang chi tiết `/admin/ai-jobs/[jobId]`; **test thật với worker thật**: ép 1 job `SUCCEEDED` về
      `FAILED`, bấm "Chạy lại job" → job chuyển `QUEUED`→`RUNNING`→hoàn tất thật qua BullMQ+worker thật,
      `attempt` tăng đúng; phát hiện lần thử đầu retry đụng đúng business-rule "trùng tiêu đề lesson"
      (vì course đã có lesson từ lần chạy gốc) — không phải bug, đúng hành vi validate 4 tầng của
      HANDBOOK; xoá lesson cũ rồi retry lại lần 2 → `SUCCEEDED` sạch. Test thêm: gọi retry khi job không
      `FAILED` → 409; LEARNER gọi thẳng endpoint → 403
- [x] Biểu đồ chi phí LLM theo ngày — **sửa bug gộp sai theo mili giây**; test thật: 1 GenerationRun →
      đúng 1 điểm dữ liệu/ngày, đúng tổng token
- [x] Toàn bộ trang admin chặn `LEARNER`, có test — **test thật cả 2 lớp**: UI redirect `/dashboard`
      ngay khi LEARNER vào `/admin`; gọi thẳng `GET /admin/users` bằng token LEARNER → `403 FORBIDDEN`
      từ server (RolesGuard chặn thật, không chỉ dựa UI)
- [x] Hành động của admin ghi `AuditLog` — `retryAiJob()` ghi `AuditLog{action:'ai_job.retry', actorId,
entityType:'AIJob', entityId, metadata:{previousStatus, previousError}}`; trang chi tiết job có
      mục "Lịch sử thao tác admin" đọc từ `GET /admin/ai-jobs/:id/audit-log`; test thật: bấm retry 2 lần
      → đúng 2 dòng lịch sử, đúng thứ tự thời gian, đúng email admin thực hiện

## 20.7 Giai đoạn 6 — Definition of Done của spec (M6) `[SPEC]`

> Trạng thái 2026-09-15: nội dung/component/responsive/ADR đã xong và test qua browser thật. Docker
> Desktop đã sửa xong cùng ngày (root cause là file Unix socket mồ côi, không phải WSL kernel — xem
> STATE.md mục M3 "Sửa Docker Desktop"). Ảnh chụp UI thật **đã xong** (6 ảnh, xem mục "Bổ sung của
> đội" bên dưới). Lighthouse và verify luồng Demo qua đúng CTA **vẫn chưa làm** — xem STATE.md
> next-actions #15.

**Truyền đạt sản phẩm**

- [x] Tên sản phẩm hiển thị rõ ràng — "LEARN" ở nav + hero, test qua browser
- [x] Phát biểu vấn đề tường minh — 4 biểu hiện cụ thể đúng HANDBOOK §2.1, không dùng ngôn ngữ mơ hồ
- [x] Nhóm người dùng mục tiêu được xác định — Learner (đánh dấu rõ "người dùng chính của MVP"),
      Content Creator, Administrator
- [x] Giá trị sản phẩm dễ hiểu — 6 giá trị đúng HANDBOOK §2.3
- [x] Phạm vi MVP được định nghĩa rõ — 2 cột In Scope/Out of Scope
- [x] Các tính năng chính được trình bày — 6 thẻ đúng danh sách spec, có `StatusBadge`
- [x] Có CTA demo — "Dùng thử Demo"/"Try the Demo" dẫn `/login`, kèm tài khoản demo thật trong section
- [x] Thông tin GitHub / dự án truy cập được — chưa có remote GitHub thật nên hiện hướng dẫn chạy
      local đầy đủ thay vì link chết (trung thực, không giả vờ có repo công khai)

**Truyền đạt kỹ thuật**

- [x] Có sơ đồ kiến trúc — dạng card theo 4 tầng, đúng 12 thành phần HANDBOOK §4.1 (không dùng SVG cố
      định để tránh tràn ngang mobile)
- [x] AI pipeline được giải thích — chunking, 2 giai đoạn sinh nội dung, 4 tầng validate, retry —
      số liệu đối chiếu đúng code thật (`lesson-generate.processor.ts`)
- [x] Các module backend chính được nêu tên — đúng tên module thật (`auth`, `courses`, `documents`,
      `ai`, `learning`, `subscriptions`, `admin`)
- [x] Các entity database được tài liệu hoá — 13 entity chính từ Prisma schema
- [x] Auth và billing được giải thích ở mức tổng quan — JWT+refresh trong Architecture, chế độ demo
      billing trong Payment Provider + ADR-004
- [x] Phần đã làm được phân biệt rõ với roadmap — `StatusBadge` 4 nhãn + cột Out of Scope riêng +
      ghi chú OCR/PPTX/DOCX "đã lên kế hoạch" ngay trong Core Features và How It Works

**UI và UX**

- [x] Responsive trên desktop và mobile — test qua browser thật ở 375px và desktop, không tràn ngang
      (xác nhận bằng đo `document.body.scrollWidth === window.innerWidth`)
- [x] Điều hướng hoạt động — nav anchor cuộn đúng section, menu mobile mở/đóng đúng, test qua browser
- [x] Nút CTA hoạt động — "Dùng thử Demo"/"Vào Demo" dẫn `/login`; "Xem kiến trúc kỹ thuật" cuộn đúng
      `#technical`; test thật click-through đầy đủ (2026-09-15): bấm CTA từ portfolio → `/login` →
      đăng nhập `demo@learn.ai` → vào thẳng `/dashboard` thật
- [x] Kiểu chữ dễ đọc — dùng font hệ thống sẵn có của app, cỡ chữ theo Tailwind scale nhất quán
- [x] Độ tương phản đủ — dùng đúng token màu đã dùng xuyên suốt app (navy/sky/ink/surface)
- [x] Animation không cản trở sử dụng — chỉ có hiệu ứng hover/transition nhẹ, không auto-play gây xao
      nhãng
- [x] Không tràn ngang trên màn hình nhỏ — xác nhận thật qua đo DOM ở mobile viewport (xem trên)

**Chất lượng kỹ thuật**

- [x] Code có tổ chức — `content/portfolio.ts` (nội dung song ngữ tập trung) tách khỏi
      `components/portfolio/*.tsx` (trình bày)
- [x] Component tái sử dụng được — `SectionHeading`, `StatusBadge`, `LanguageToggle` dùng chung
      xuyên suốt 14 section
- [x] Nội dung dễ cập nhật — sửa 1 object trong `portfolio.ts` là đổi cả VI/EN, không phải sửa nhiều
      chỗ
- [x] Không lộ secret — trang không gọi API, không có biến môi trường lộ ra client
- [x] Không có tuyên bố sản phẩm thiếu căn cứ — đã phát hiện và **loại bỏ** một tài liệu tham khảo có
      sẵn (`ai-worker-pipeline.html`) vì mô tả sai LLM provider thật (Gemini thay vì Anthropic Claude
      thật) — xem STATE.md mục M6 "Đọc trước khi viết nội dung"
- [x] Hướng dẫn build và deploy có tài liệu — section GitHub Info có đúng lệnh từ HANDBOOK §16.2

**Bổ sung của đội `[QĐ]`**

- [x] Lighthouse: Performance ≥ 90, Accessibility ≥ 95 trên trang marketing — đo thật trên
      `npm run build && npm start` (cổng 3001 tạm để không đụng dev server đang chạy ở 3000), Chrome
      headless: **Accessibility 100/100** (sau khi sửa, xem dưới), **Best Practices 96**, **SEO 100**.
      **Performance dao động 88–91 qua 3 lần đo** (91/88/89) — đạt mục tiêu ≥90 ở đa số lần đo nhưng
      không ổn định 100%, do biến thiên máy local (không phải máy CI chuyên dụng), không phải do
      thiếu tối ưu cụ thể nào (CLS=0, LCP 2.6s, TBT ~280ms — không có audit performance nào bị chặn).
      **Tìm và sửa 1 lỗi thật qua lần đo đầu tiên**: nhãn tiêu đề mục (`SectionHeading` — "VẤN ĐỀ",
      "NGƯỜI DÙNG", ...) và nhãn method API (`database-api.tsx` — "POST"/"GET") dùng `text-sky-600` in
      đậm cỡ 12px trên nền trắng/`surface-100`, tỉ lệ tương phản chỉ 3.84–4.02 (yêu cầu WCAG AA 4.5:1)
      — đổi sang `text-sky-700` ở cả 2 file, đo lại xác nhận Accessibility từ 96 lên đúng 100. Cũng
      phát hiện trang chưa có favicon (404 `/favicon.ico`) — thêm `apps/web/src/app/icon.svg` (dùng
      quy ước Next.js App Router tự sinh `<link rel="icon">`), khớp đúng token màu `navy-700`/`sky-500`
      của `Brand` component.
- [x] Ảnh chụp UI là ảnh **thật**, lấy từ ứng dụng đang chạy — Docker đã sửa xong (xem STATE.md
      mục M3 "Sửa Docker Desktop"); chạy `scripts/capture-screenshots.mjs` (Playwright) thành
      công, 6 ảnh thật (dashboard, course-detail, lesson, practice, settings, admin) ghi vào
      `docs/screenshots/` + `apps/web/public/screenshots/`; sửa 2 bug trong script (selector
      `/courses/new` bị khớp nhầm; `networkidle` bắn trước khi TanStack Query render xong khiến
      ảnh chụp trúng skeleton loading) — verify từng ảnh bằng Read tool, đúng nội dung thật (kể cả
      nút ▲▼ sắp xếp và "Sửa bài học" mới thêm); verify portfolio page hiện đúng 6 ảnh + caption
      qua `find`/`get_page_text` (accessibility tree khớp `image` role, không phải ảnh vỡ)
- [ ] Video demo 60–90 giây quay luồng lõi — chưa làm, cần công cụ quay màn hình ngoài phạm vi hiện có
- [ ] Tài khoản dùng thử hoạt động và được reset định kỳ — tài khoản demo tồn tại và hoạt động (đã
      test nhiều lần qua các milestone) nhưng **chưa có cơ chế reset định kỳ tự động**
- [x] README có hướng dẫn chạy local đã kiểm chứng trên máy sạch — README gốc đã có; lệnh hiển thị lại
      trong section GitHub Info khớp với README
- [x] Ít nhất 5 ADR đã viết trong `docs/adr/` — đúng 5 ADR theo danh sách HANDBOOK §18.4 gợi ý

## 20.8 Tiêu chí thành công cuối cùng `[SPEC]`

- [ ] Người xem hiểu được trong một lần ghé thăm ngắn 8 câu hỏi (HANDBOOK §20.8)
- [ ] Website truyền đạt đồng thời: "sản phẩm hữu ích" + "hệ thống được thiết kế cẩn thận"
- [ ] Kiểm chứng bằng 3 người (không chuyên, lập trình viên, người tuyển dụng)

## 20.9 Hạ tầng làm giao diện (ngoài spec — công cụ nội bộ)

> Không thuộc `[SPEC]`. Mục tiêu: sửa giao diện được mà không cần dựng cả hạ tầng, và phiên sau
> không phải dò lại. Chi tiết ở `docs/UI-GUIDE.md`.

- [x] Bảng mẫu `/dev/ui` — token, primitive, 5 trạng thái, bộ icon, `LessonPath` dữ liệu giả
- [x] Chặn `/dev/ui` khỏi production (`notFound()`) — đã kiểm chứng trên bản build thật: 404
- [x] `scripts/capture-ui.mjs` — chụp route bất kỳ, cờ `--width` / `--dark` / `--reduced-motion`
- [x] `docs/UI-GUIDE.md` + trỏ từ `AGENTS.md` vào thứ tự đọc bắt buộc
- [x] `motion` + `MotionProvider` (`reducedMotion="user"`) ở gốc cây
- [x] Khối `@media (prefers-reduced-motion: reduce)` trong `globals.css` cho animation thuần CSS
- [x] `lucide-react` làm ruột cho `<Icon>`, giữ nguyên mặt tiền và 19 tên cũ
- [x] `cn()` = `clsx` + `tailwind-merge` (khai báo thêm nhóm token riêng của LEARN)
- [x] `eslint-plugin-jsx-a11y` bật cho `apps/web/src/**/*.tsx`, sửa hết lỗi nó bắt được
- [x] `apps/web/components.json` — shadcn CLI dùng được khi cần Radix (chưa cài component nào)
- [x] Kiểm chứng tận mắt pháo giấy + `ProgressBar` lò xo trên màn kết quả bài tập **thật**
      — xong 2026-09-19 phiên 10 (lái thật qua Playwright, `canvas` pháo giấy render)
- [x] Chụp lại bộ ảnh portfolio (`capture-screenshots.mjs`) sau khi giao diện đổi — xong
      2026-09-19 phiên 10, 6 ảnh trên giao diện mới

## 20.10 Hoàn thiện UX + accessibility (ngoài spec)

> Tiêu chí lấy từ nguồn ngoài (NN/g 10 usability heuristics, NN/g error-in-forms, WCAG 2.2 AA).
> Bảng đối chiếu luật ↔ nguồn ở `docs/UI-GUIDE.md` §10; những thứ cố ý không làm ở §11.

- [x] `scripts/audit-a11y.mjs` — axe-core trên 18 màn đã đăng nhập, bộ luật WCAG 2.2 AA
- [x] **0 vi phạm WCAG 2.2 AA trên 18/18 màn** (trước: 85 phần tử vi phạm)
- [x] `sky-700` và `warning-700` đạt AA cho chữ; khối `[SPEC]` §14.2 không đổi giá trị nào
- [x] `ink-300` không còn dùng làm chữ nội dung trên nền sáng
- [x] Liên kết nội dòng gạch chân mặc định (WCAG 1.4.1)
- [x] Vùng bấm ≥ 24×24 (WCAG 2.5.8); phần tử focus không bị thanh dính che (WCAG 2.4.11)
- [x] Màn bài học: vị trí "Bài X/N" + điều hướng bài trước/bài sau
- [x] Màn chi tiết khóa học: hành động chính "Bắt đầu / Tiếp tục học" cho người học
- [x] Hành động phá huỷ tách khỏi hành động lành tính
- [x] Báo lỗi bài tập chỉ đúng câu còn thiếu (cuộn + focus + đánh dấu tại chỗ)
- [x] Ô mật khẩu có nút hiện/ẩn (`PasswordInput`)
- [x] Enum API được dịch sang tiếng Việt trước khi hiển thị
- [x] Thời gian tương đối cho mốc gần; admin giữ mốc tuyệt đối
- [ ] Cho bấm dòng "Hoạt động gần đây" để nhảy tới bài — cần thêm `courseId`/`lessonId` vào
      `historyItemSchema` + API (thay đổi backend, xem next-action)
- [ ] Đưa `scripts/audit-a11y.mjs` vào CI — cần Postgres + web/api/worker trong `ci.yml`,
      gộp chung với mục #5 (integration test tự động) vì cùng nguyên nhân

## 20.11 Logo = nhân vật Circle (ADR 007)

- [x] `components/logo-mark.tsx` — một nguồn duy nhất, hai tông `light`/`dark`
- [x] Thay ở cả 4 chỗ: sidebar · header mobile · màn đăng nhập · nav trang landing
- [x] `app/icon.svg` (favicon) vẽ lại cùng hình, tông sáng để đọc được trên tab tối
- [x] Mục "Logo" trong `/dev/ui` — hai tông × 5 cỡ (16–64px)
- [x] Đồng bộ token TS `packages/ui/src/index.ts` với `theme.css` (đã lệch từ phiên 10)
- [x] `audit-a11y.mjs` bật `reducedMotion` để kết quả không phụ thuộc pha animation
- [ ] **Chủ sản phẩm xác nhận ranh giới logo/mascot của HANDBOOK §13.1** — nếu §13.1 cấm cả hình
      ảnh nhân vật ngoài 4 vị trí thì phải sửa spec trước (AGENTS.md)
- [x] Chụp lại ảnh portfolio sau khi đổi logo — xong 2026-09-19 phiên 11 (6 ảnh)

## 20.12 Audit + refactor backend/frontend (phiên 12 — 2026-09-19)

Chi tiết từng lỗi ở `STATE.md` mục "Đợt audit + refactor backend/frontend".

**Đúng đắn dữ liệu**

- [x] `upsertProgress()` chạy trong `tx` thật (trước đó gọi `prisma.*` toàn cục nên nằm ngoài transaction)
- [x] `attemptNo` tính trong transaction + thử lại khi đụng `@@unique` (trước đó 2 lượt nộp song song → 500)
- [x] `attempts` dùng `{ increment: 1 }` thay cho đọc-rồi-ghi

**Hiệu năng**

- [x] `courses.listForOwner()`: `1 + 3N` → 4 truy vấn cố định (`groupBy`)
- [x] Worker: ~530 `create()` tuần tự → 4 `createMany` trong transaction có `timeout: 30s`
- [x] Trung bình điểm: `findMany` toàn bảng → `aggregate({ _avg })` (progress + courses)
- [x] `activeStreak()`: gom ngày bằng `date_trunc` trong Postgres, chặn cửa sổ 366 ngày
- [x] Thứ tự bài học sinh ra bám đúng outline, không phụ thuộc tốc độ trả lời của LLM
- [x] `submissionAnswer` → `createMany`; `usage.snapshot()` song song; `cancelJob` 3 truy vấn → 1

**Bảo mật**

- [x] Chặn boot khi production còn dùng secret/credential mặc định của dev (`insecureProductionVars()`)
- [x] Đăng nhập chạy argon2 cả khi email không tồn tại (chống dò tài khoản qua timing)
- [x] Ghim `algorithms: ['HS256']`; `role` không hợp lệ bị từ chối thay vì rơi về `LEARNER`
- [x] `generateLessons` lọc tài liệu theo cả `courseId`, không chỉ `uploaderId`
- [x] Rate limit `INCR`+`EXPIRE` gộp vào một Lua script nguyên tử

**Hợp đồng API**

- [x] RFC 7807 `type` suy từ `code` ở một chỗ duy nhất — đóng next-action #18
- [x] Lỗi Prisma P2002/P2025/P2003/P2028 ánh xạ đúng status thay vì rơi hết về 500
- [x] `REFRESH_TOKEN_TTL_DAYS` thực sự được đọc (trước đó hardcode 30 ngày ở 3 chỗ)
- [x] `me()` trả usage thật; `changePassword` sai mật khẩu trả 401; `register` đua email trả 409

**Hạ tầng build & test**

- [x] `apps/worker` có script `build` + `tsup.config.ts` — `npm run build` ở root chạy được
- [x] `apps/worker` có `@swc/core` — bundle emit `design:paramtypes` (kiểm chứng: 4, trước là 0)
- [x] `vitest.config.ts` include `apps/worker/src/**` — pipeline AI có test
- [x] 31 test mới: `normalizeException`, `insecureProductionVars`, `gradeSubmission`, `buildLessonRows`

**Giao diện**

- [x] Primitive chuyển sang viền 1px + bóng nhẹ, bỏ `uppercase`, `transition-all duration-200`
- [x] Thứ bậc bằng độ đậm + màu chữ thay vì cỡ chữ
- [x] `Card interactive`, `CardDescription`, `LoadingState variant`, `EmptyState secondaryAction`, `ErrorState detail`
- [x] axe-core 18/18 màn vẫn 0 vi phạm sau khi đổi
- [x] Không sửa dòng `[SPEC]` nào; không đụng trang portfolio

**Phần hoãn ở phiên 12 — đã đóng hết ở phiên 13 (xem §20.13)**

- [x] Múi giờ cắt ngày của `activeStreak` → `APP_TIMEZONE`, mặc định `Asia/Ho_Chi_Minh`
- [x] Khoá thật cho TOCTOU hạn mức → `pg_advisory_xact_lock` trong `UsageService.consume()`
- [x] `documents` trừ hạn mức lúc `confirm()` thay vì lúc xin presigned URL
- [x] `reorderLessons` gộp N `update()` mỗi lượt thành 1 câu `UPDATE … FROM (VALUES …)`

## 20.13 Đóng phần hoãn + hoàn thiện 5 trạng thái (phiên 13 — 2026-09-19)

**Hạn mức**

- [x] `UsageService.consume(userId, metric, work)` — kiểm và ghi trong một transaction có
      `pg_advisory_xact_lock` theo `(userId, metric)`
- [x] Kiểm chứng bằng đo thật: trình tự cũ cho 8 request song song tạo **6** khoá học trên hạn mức
      3; trình tự mới cho đúng **3**, phần còn lại 402, không có 500
- [x] Gọi S3 / đẩy BullMQ nằm ngoài transaction (không giữ lock qua lượt gọi mạng, không enqueue
      job trỏ tới bản ghi đã rollback)
- [x] `COURSES_CREATED` khai báo là metric `derived`; bỏ ghi `UsageCounter` mà không ai đọc
- [x] `DOCUMENTS_UPLOADED` trừ ở `confirm()`; `confirm()` lọc thêm `status: 'PENDING'` chống confirm kép

**Múi giờ**

- [x] `APP_TIMEZONE` (mặc định `Asia/Ho_Chi_Minh`), validate bằng `Intl` lúc khởi động
- [x] Sửa `AT TIME ZONE` một-bước của phiên 12 — kết quả từng phụ thuộc biến `TimeZone` của phiên Postgres
- [x] Lùi ngày trên chuỗi lịch, không trừ 86400000ms (an toàn với DST) — 10 test

**Truy vấn**

- [x] `reorderLessons`: mỗi lượt 1 câu `UPDATE … FROM (VALUES …)` thay cho N câu
- [x] Kiểm chứng trên DB thật: đảo ngược 5 bài sau khi xoá mềm 1 bài → 0..4 liên tục, bài đã xoá yên vị
- [x] `AuditService` lấy Prisma qua DI; `RateLimitGuard` bỏ tham số thừa

**5 trạng thái màn hình**

- [x] PARTIAL của AI job: UI đọc `error.code = 'PARTIAL_FAILURES'`, liệt kê phần thiếu, không tự đóng
- [x] Parser tách ra `lib/ai-job-partial.ts`, chịu được mọi hình dạng `detail` — 11 test
- [x] `TableSkeleton` đúng số cột/dòng thay cho tảng xám `h-48` (6 màn admin)
- [x] `TableEmpty` phân biệt "lọc không ra kết quả" (có nút xoá bộ lọc) với "chưa có dữ liệu"
- [x] Cả hai có mặt ở `/dev/ui`

**Kiểm chứng**

- [x] typecheck · lint · prettier · `npm run build` root — tất cả exit 0
- [x] test **101/101** (77 → 101)
- [x] axe-core **18/18 màn, 0 vi phạm** sau khi đổi
- [x] **0/15 route tràn ngang ở 390px** (gồm cả màn đã đăng nhập và bảng admin)

**Còn lại (có chủ đích)**

- [ ] `documents.list()` ký presigned URL từng dòng — bỏ `downloadUrl` khỏi `DocumentList` là đổi
      contract, cần chốt trước
- [ ] Đưa `audit-a11y.mjs` + test integration vào CI (cần Postgres/Redis service trong `ci.yml`)

## 20.14 Lộ trình bài học dạng đường cong (phiên 14 — 2026-09-19)

- [x] Đoạn nối là spline SVG đi xuyên đúng tâm node, thay cho thanh dọc không nối vào đâu
- [x] Chu kỳ sóng 4 node — chu kỳ 6 làm node 2 và 3 trùng toạ độ x
- [x] Bézier hai tay nắm thẳng đứng nửa bước dọc — Catmull-Rom cho tiếp tuyến quá ngắn
- [x] Biên độ theo `%` nên tự co trên màn hẹp, `vector-effect` giữ nét không méo
- [x] Nhãn chuyển sang bên cạnh node và neo vào mép khung (không bị đường cong cắt, không tràn)
- [x] Nút sắp xếp ▲▼ chuyển sang phía đối diện nhãn
- [x] Node dùng `ring-2` + `shadow-raised` thay `border-b-[6px]`, khớp §4b; màu `[SPEC]` không đổi
- [x] Mỗi đoạn một `<path>` riêng để tiến độ đứt quãng vẫn hiển thị đúng
- [x] Kiểm chứng trên khoá học **thật** đã seed ở 1440px và 390px; axe 18/18 màn 0 vi phạm
- [x] Ghi lại ở `docs/UI-GUIDE.md` §4d, kèm bẫy `npm run build` làm hỏng dev server đang chạy

## 20.15 Lộ trình dạng đồ thị hình sin (phiên 15 — 2026-09-19)

- [x] ~~`x = 50 − A·cos(πu)` — node nào cũng ở ±1~~ → đổi ở phiên 16: xếp vậy là dốc nhất có thể
- [x] Vẽ bằng lấy mẫu hàm số, không xấp xỉ bằng Bézier
- [x] `NODES_PER_PERIOD = 8`, biên độ 22%, khoảng cách dọc 118px — dốc tối đa 33.3° (UI-GUIDE §4d)
- [x] Dữ liệu mẫu `/dev/ui` mở rộng lên 9 bài để thấy trọn một chu kỳ
- [x] Node 72 → 64px để không che mất phần cong ở đỉnh (vẫn trên ngưỡng chạm 44px WCAG 2.2)
- [x] Nét mảnh 10px → 2.5px cho đúng chất "đồ thị" thay vì "con đường"
- [x] Nét đứt/nét liền làm kênh tín hiệu thứ hai ngoài màu — gỡ vi phạm §2 tồn từ trước
- [x] Kiểm chứng trên khoá học thật lẫn `/dev/ui`, 1440px và 390px; axe 18/18 màn 0 vi phạm

## 20.16 Đợt nâng cấp giao diện (phiên 17 — 2026-09-22) — Hoàn TẤT 7/7 ✅

> Branch `redesign/upgrade-2026-09`, chưa merge `main`. Kế hoạch đầy đủ:
> `C:\Users\hocvi\.claude\plans\ti-n-h-nh-redesign-website-zesty-swan.md`. Chi tiết ở STATE.md
> mục "Đợt nâng cấp giao diện 2026-09-22".

- [x] GĐ1 — Nạp Be Vietnam Pro + JetBrains Mono qua `next/font`, gỡ `font-extrabold` 24 chỗ, ADR 008
- [x] GĐ2 — Sửa lỗi AA thật (`.lesson-content a` dùng sky-500), thang bo góc mới, `--shadow-overlay`,
      `.focus-ring{,-tight,-dark}`
- [x] GĐ3 — `InlineError`, `errorText`/`errorDetail` dùng chung, `RevealOnScroll`/`StaggerOnScroll`
- [x] GĐ4 — Quét nhất quán 12 màn `(app)`: 11 banner lỗi chép tay → `InlineError`, 2 `TableSkeleton`
      sai cột, dựng lại `admin/ai-jobs/[jobId]`, `EmptyState size="compact"`, 2 chỗ trạng thái bị
      nuốt, motion trải ra các màn còn lại, xác nhận huỷ gói 2 nhịp
- [x] GĐ5 — Trang chủ portfolio: server/client split, hero có khung xem trước sản phẩm (spec §10.1),
      phá nhịp 4 lưới 3-cột liên tiếp, nav scroll-spy, footer có link thật, xoá CTA GitHub chết
- [x] GĐ6 — `not-found`/`error`/`global-error`/`sitemap`/`robots`, metadata riêng 3 màn `(auth)`
- [x] Mỗi giai đoạn: `typecheck -w apps/web` + `eslint apps/web/src` + `build -w apps/web` xanh
- [x] `git diff packages/config/tailwind/theme.css` — 0 dòng `--color-*` trong khối `[SPEC]` bị đổi
- [x] **GĐ7a** — Rà soát cỡ chữ ad-hoc: `text-[11px]`/`text-[10px]` lặp lại 7 chỗ → token `--text-2xs`
- [x] **GĐ7b** — Xoá `useCourseProgress` (0 call site), xoá 4 file mồ côi `public/mascot/*.svg`,
      sửa cảnh báo lệch token đã cũ trong `packages/ui/src/index.ts` (giá trị hiện khớp)
- [x] **GĐ7c — chụp lại `apps/web/public/screenshots/*.png`** bằng `scripts/capture-screenshots.mjs`
      trên stack thật (docker + seed + dev). Sửa luôn lỗi có thật trong script: `goto('/admin')` ra
      ảnh trắng trơn vì `/admin` chỉ redirect phía client — đổi sang `goto('/admin/metrics')` thẳng
- [x] **GĐ7d** — `node scripts/audit-a11y.mjs` trên stack đầy đủ — **18/18 màn, 0 vi phạm**. Phát
      hiện + sửa: script cũ không cuộn trang nên chấm nhầm 4 section `RevealOnScroll` đang ở
      `opacity-60` chờ hiện (46 phần tử → thêm bước cuộn trước khi audit → còn 2); 2 lỗi tương phản
      thật trong `target-users.tsx` (`bg-sky-500/10` → `bg-sky-50`, `text-ink-500` → `text-ink-700`
      trên nền `surface-200`). `npm run build -w apps/web` xanh (22 route). 3 lệnh `capture-ui.mjs`
      (1440, 390, `--reduced-motion`) chạy sạch. `git diff main -- theme.css` — 0 dòng `--color-*`
- [ ] Merge `redesign/upgrade-2026-09` vào `main` (cần xác nhận — `main` đang có việc dở của người
      khác chưa commit, không phải của đợt này)

## 20.17 Tái cấu trúc feature-based (phiên 18 — 2026-09-22)

> Branch `refactor/feature-based-structure` (off `redesign/upgrade-2026-09`). Kế hoạch 7 phase do
> người dùng duyệt — nguồn HANDBOOK §16 (DevOps/CI), §19 (cấu trúc), ADR-005. Chi tiết ở STATE.md
> mục cùng tên.

**Phase 0–4 — nền (commit `f2469ac`–`a98976b`)**

- [x] Dọn root: `handbook.html`/`proposal-templates.html` → `docs/exports`, xoá `web-dev.log`
- [x] Chuẩn hoá UTF-8/line-ending theo prettier 3.9; eslint/prettier/tsconfig/vitest dồn về
      `packages/config` + shim root; vitest chạy ở root
- [x] Frontend feature-based: `apps/web/src/features/*` + `components/shared`

**Phase 5 — Backend repository per module (commit `c502436`)**

- [x] Subscriptions: `plan`/`subscription`/`payment`/`usage-counter` repo + `usage.service`/`billing.service`
- [x] Auth: `user`/`refresh-token` repo + `auth.service`
- [x] Courses/Documents: `course`/`document` repo (thêm `countOwned`, `countOwnedInCourse`…)
- [x] Learning: `lesson` (thêm `assertAccessible`, `listLightForCourse`) + `learning-progress` +
      `exercise` + `submission` repo; `exercises.service` retry P2002 + `rawAnswerOf`
- [x] AI: `ai-job`/`generation-run` repo + `ai.service`
- [x] Admin: `admin` repo/service/controller (8 endpoint)
- [x] Common: `audit` repo; SecurityModule (global) cung cấp `AuditRepository`
- [x] Quyền sở hữu lọc ở tầng repository (IDOR); service giữ `$transaction`; `health` CỐ Ý giữ `SELECT 1`
- [x] `typecheck`/`lint`/`build` xanh; `test` = 90 pass / 8 int fail pre-existing / 3 skip

**Phase 6 — Infra + CI + boundary (commit `bebb643`)**

- [x] Boundary lint: cấm module api import file nội bộ module khác (chỉ `*.module/*.repository/*.service`);
      cấm feature web import chéo (allowlist `shell`→`auth`/`settings`, `portfolio`→`shell`); chặn
      package→app và app chéo app. Cả repo 0 vi phạm
- [x] `infra/Dockerfile.{api,worker,web}` + `.dockerignore` (loại `.env` ra khỏi context)
- [~] Dockerfiles **chưa kiểm chứng build thật** (máy dev không có Docker) — cần máy có Docker hoặc CI
- [x] `.github/workflows/ci.yml` theo HANDBOOK §16.3: lint · typecheck · test:unit · build · audit ·
      `test:int` (services postgres+redis → `db:deploy` → build api → chạy `dist` → poll TCP → `test:int`)
- [~] Job e2e (playwright) **chưa nối** — chưa có `playwright.config.ts`/test thật (HANDBOOK §16.3 vẽ e2e)
- [~] Job audit chặn đang ở mức `--omit=dev --audit-level=critical` (prod 0 critical) — 7 high ở
      prod (multer/postcss/deepmerge-ts) còn nợ, fix breaking, xem STATE.md next-actions #21
- [x] `typecheck`/`lint`/`build` xanh; `test` không đổi so với baseline

**Phase 7 — đóng phiên (đang chạy)**

- [x] Verify toàn cục 3 lệnh gate (typecheck/lint/test) + build
- [x] Cập nhật 3 file progress (`STATE`/`CHECKLIST`/`session-log`) + commit docs
- [ ] Pop `stash@{0}` (WIP session khác: Gemini LLM + REQUIREMENTS/SRS + `.claude` + seed-demo-heavy)
      — KHÔNG commit nội dung stash
- [ ] (Sau này) Merge `refactor/feature-based-structure` → `main`, rồi quan sát CI lần đầu
- [ ] (Quyết định) Scope worker: migrate `apps/worker/src/processors` sang repository hay giữ `prisma`
