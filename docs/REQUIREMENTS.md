# REQUIREMENTS.md — Đặc tả yêu cầu sản phẩm LEARN

> Tài liệu yêu cầu (SRS) cho **hệ thống LEARN** — không phải cho website portfolio
> (xem `learnflow-ai-portfolio-agent-spec.md` cho việc đó). Đây là điểm tham chiếu khi
> quyết định "tính năng X có nằm trong yêu cầu không", trước khi thêm/bớt scope.
>
> Quan hệ với các tài liệu khác:
>
> - Yêu cầu **nghiệp vụ gốc, không được tự ý đổi** → gắn nhãn `[SPEC]`, nguồn là
>   `learnflow-ai-portfolio-agent-spec.md`. Đổi phải sửa spec trước (xem `AGENTS.md`).
> - Yêu cầu ở đây **cụ thể hoá** spec thành hành vi hệ thống kiểm chứng được (không chỉ
>   website portfolio mà toàn bộ sản phẩm: API, worker, DB).
> - **Cách triển khai** (stack, thuật toán, schema chi tiết) → `docs/HANDBOOK.md`. Tài liệu
>   này trả lời "hệ thống phải làm được gì", HANDBOOK trả lời "làm bằng cách nào".
> - **Trạng thái đã làm tới đâu** → `docs/progress/STATE.md` + `docs/progress/CHECKLIST.md`.
>   Tài liệu này không lặp lại tiến độ chi tiết, chỉ gắn nhãn 4 mức bắt buộc theo `AGENTS.md`:
>   **Có trong MVP** · **Đang phát triển** · **Đã lên kế hoạch** · **Mở rộng tương lai**.
>
> Cập nhật lần cuối: 2026-09-22, đối chiếu trực tiếp với schema Prisma và controller thật
> trong repo tại thời điểm viết — không suy diễn từ tài liệu cũ.

---

## 1. Giới thiệu

### 1.1 Mục đích

Xác định đầy đủ, rõ ràng và có thể kiểm chứng được **hệ thống LEARN phải làm gì**, để:

- Người triển khai (con người hoặc AI agent) biết chính xác ranh giới MVP.
- Người review có tiêu chí khách quan để chấp nhận/từ chối một thay đổi.
- Không có tính năng nào được ngầm định là "chắc cũng cần" mà không có yêu cầu gốc.

### 1.2 Phạm vi tài liệu

Bao trùm toàn bộ hệ thống: `apps/web` (Next.js), `apps/api` (NestJS), `apps/worker`
(NestJS standalone), `packages/db` (Prisma), `packages/ai` (LLM adapter), `packages/contracts`
(Zod schema dùng chung). **Không** bao trùm nội dung marketing/portfolio chi tiết (site map,
copy, palette) — phần đó thuộc `learnflow-ai-portfolio-agent-spec.md` §9–§15.

### 1.3 Đối tượng đọc

Kỹ sư triển khai, reviewer kỹ thuật, và AI agent nhận việc trong repo này. Giả định người đọc
đã đọc `AGENTS.md`.

### 1.4 Thuật ngữ

Dùng thống nhất, không thay bằng từ đồng nghĩa ở bất kỳ đâu trong code, API, hay UI:

| Thuật ngữ      | Định nghĩa                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| Course         | Tập hợp tài liệu học tập + bài học, thuộc sở hữu một User                  |
| Document       | Tệp nguồn người dùng tải lên (PDF/PPTX/DOCX/TXT/MD), gắn với một Course     |
| AI Job         | Tác vụ bất đồng bộ xử lý AI (trích xuất, sinh bài học) trên hàng đợi        |
| Lesson         | Một đơn vị học tập được sinh ra (hoặc sửa tay) từ Document                 |
| Exercise       | Hoạt động luyện tập gắn với một Lesson, chứa một hoặc nhiều Question        |
| Question       | Một câu hỏi cụ thể trong Exercise, có loại (`QuestionType`)                 |
| Submission     | Một lần người dùng nộp câu trả lời cho một Exercise                        |
| Subscription   | Trạng thái gói dịch vụ hiện tại của một User                               |
| Usage Counter  | Bộ đếm mức sử dụng theo kỳ, dùng để áp hạn mức gói                         |

### 1.5 Tài liệu tham chiếu

- `learnflow-ai-portfolio-agent-spec.md` — yêu cầu nghiệp vụ gốc `[SPEC]`.
- `docs/HANDBOOK.md` — quyết định kỹ thuật, schema đầy đủ, quy ước API.
- `docs/progress/STATE.md`, `docs/progress/CHECKLIST.md` — tiến độ hiện tại.
- `packages/db/prisma/schema.prisma` — nguồn sự thật cho mô hình dữ liệu.

---

## 2. Tổng quan sản phẩm

### 2.1 Bài toán `[SPEC]`

Người học có nhiều tài liệu (PDF, slide, ghi chú cá nhân) nhưng thiếu cách hiệu quả để biến
chúng thành trải nghiệm học tập có cấu trúc. Nền tảng học tập truyền thống chỉ cung cấp nội
dung tĩnh — người học phải tự tổ chức bài học, xác định kiến thức trọng tâm, tự tạo bài tập.
LEARN giải quyết bằng cách dùng AI để chuyển tài liệu thành bài học + bài tập tương tác +
theo dõi tiến trình, đưa người học từ tiếp nhận thụ động sang học chủ động.

### 2.2 Nhóm người dùng `[SPEC]`

| Nhóm | Vai trò hệ thống | Nhu cầu chính | Trong MVP? |
| --- | --- | --- | --- |
| **Learner** (chính) | `LEARNER` | Tải tài liệu, tạo course, sinh bài học AI, luyện tập, xem tiến trình | **Có** |
| **Content Creator** (phụ) | `LEARNER` + `CourseMemberRole` | Tạo course, review/sửa bài học AI sinh, tổ chức nội dung | Dùng chung cơ chế sở hữu Course với Learner; chia sẻ course (`CourseMember`) — **Đang phát triển**, chưa có UI mời thành viên |
| **Administrator** | `ADMIN` | Quản lý user/course, theo dõi AI Job, theo dõi subscription | **Có**, chỉ xem (read-only) — không có thao tác sửa/xoá dữ liệu người dùng từ trang admin |

Không có vai trò hệ thống riêng cho "Content Creator" — spec cho phép đây là vai trò ngoài
MVP nếu phạm vi hạn chế; LEARN hiện thực hoá tối thiểu qua `CourseMemberRole`, chưa có luồng
mời/chia sẻ hoàn chỉnh ở UI.

### 2.3 Giá trị sản phẩm `[SPEC]`

Hệ thống phải thể hiện được — bằng hành vi thật, không chỉ copy marketing — 5 giá trị:
giảm thời gian chuẩn bị học liệu, học chủ động (bài tập tương tác thay vì đọc tĩnh), học có
cấu trúc (Course → Lesson → Exercise), theo dõi tiến trình, và AI hỗ trợ (không claim cá nhân
hoá hoàn toàn hay adaptive learning — xem §7 Ràng buộc nội dung).

---

## 3. Phạm vi MVP

### 3.1 Luồng lõi bắt buộc `[SPEC]`

> Đăng ký/Đăng nhập → Tạo Course → Tải Document → Sinh Lesson bằng AI → Học Lesson →
> Làm Exercise → Theo dõi tiến trình

Toàn bộ luồng này phải chạy được đầu-cuối qua UI thật (không chỉ qua API) để coi là đạt MVP.

### 3.2 Trong phạm vi (chi tiết hoá theo module ở §5)

Authentication · Course Management · Document Management · AI Lesson Generation ·
Interactive Learning · Learning Progress · Subscription & Billing (demo hoặc live) ·
Administration (read-only).

### 3.3 Ngoài phạm vi MVP `[SPEC]`

Không triển khai trừ khi có yêu cầu tường minh mới, và nếu xuất hiện trong UI/copy phải gắn
nhãn `Mở rộng tương lai`:

- Adaptive learning / cá nhân hoá lộ trình học tự động.
- AI tutor hội thoại có bộ nhớ dài hạn.
- Học xã hội (chia sẻ tiến trình, bảng xếp hạng giữa người dùng khác course).
- Chợ course công khai (marketplace).
- Ứng dụng di động native.
- Multi-tenancy doanh nghiệp.
- Gamification phức tạp (huy hiệu, streak nâng cao ngoài chuỗi ngày học cơ bản).
- Spaced repetition nâng cao.
- Chỉnh sửa course cộng tác thời gian thực.
- Huấn luyện foundation model riêng.
- Phân tích/khuyến nghị nâng cao.
- OCR cho PDF scan, trích xuất PPTX/DOCX (hiện chỉ PDF có lớp text + TXT/MD — xem §5.3).

---

## 4. Yêu cầu phi chức năng (NFR)

Áp dụng cho toàn hệ thống, không gắn với module cụ thể. Vi phạm bất kỳ mục nào dưới đây là
lỗi chặn release, không phải "nợ kỹ thuật có thể hoãn", trừ khi ghi chú khác.

### 4.1 Bảo mật — NFR-SEC

| ID | Yêu cầu | Cơ chế bắt buộc |
| --- | --- | --- |
| NFR-SEC-01 | Mật khẩu không lưu dạng đọc được | argon2id (memoryCost=19456, timeCost=2, parallelism=1) |
| NFR-SEC-02 | Access token không sống lâu, không lộ qua XSS | JWT 15 phút, giữ trong memory phía client, **không** localStorage |
| NFR-SEC-03 | Refresh token chống đánh cắp lặp lại | Chuỗi ngẫu nhiên 256-bit, cookie httpOnly; Secure; SameSite=Lax, 30 ngày, chỉ lưu SHA-256 hash trong DB, xoay vòng mỗi lần dùng, phát hiện tái sử dụng → thu hồi cả familyId |
| NFR-SEC-04 | Không rò rỉ dữ liệu chéo user (IDOR) | Lọc quyền sở hữu (ownerId/CourseMember) bắt buộc ở **tầng repository**, không phải controller |
| NFR-SEC-05 | Đáp án đúng không rời server trước khi nộp bài | correctAnswer/isCorrect không xuất hiện trong payload GET Exercise trước submit |
| NFR-SEC-06 | Input ngoài hệ thống phải qua validation | Mọi input qua Zod (packages/contracts), TypeScript strict: true, không dùng any |
| NFR-SEC-07 | Upload file không tin dữ liệu client khai | Whitelist phần mở rộng, đối chiếu MIME, **kiểm magic bytes ở worker sau khi tải về**, giới hạn 25MB, giới hạn 300 trang (PDF scan 50 trang), checksum SHA-256 chặn trùng trong cùng Course |
| NFR-SEC-08 | Khoá lưu trữ object storage không đoán được | courses/{courseId}/documents/{documentId}.{ext}, không dùng tên file người dùng đặt, chỉ truy cập qua presigned URL hạn ngắn, bucket không public |
| NFR-SEC-09 | Không tin giá/trạng thái thanh toán từ frontend | Giá lấy từ Plan trong DB; trạng thái thanh toán chỉ cập nhật qua webhook đã xác minh chữ ký |
| NFR-SEC-10 | Không log/commit secret | .env không commit; secret không xuất hiện trong log ứng dụng |
| NFR-SEC-11 | Mọi endpoint yêu cầu xác thực trừ danh sách trắng | Ngoại lệ: /auth/register, /auth/login, /auth/refresh, /plans, /health*, /webhooks/stripe |

### 4.2 Hiệu năng và khả năng mở rộng — NFR-PERF

| ID | Yêu cầu |
| --- | --- |
| NFR-PERF-01 | Trang marketing đạt Lighthouse Performance ≥ 90 |
| NFR-PERF-02 | Danh sách phân trang kiểu cursor-based (limit/cursor → items/nextCursor), không offset-based cho dữ liệu lớn |
| NFR-PERF-03 | Cập nhật trạng thái AIJob dùng update có điều kiện (chỉ update khi status hiện tại đúng như kỳ vọng) để tránh tranh chấp giữa nhiều worker |
| NFR-PERF-04 | Tăng bộ đếm hạn mức (UsageCounter) là thao tác nguyên tử (upsert cộng dồn), không đọc-rồi-ghi hai bước |

### 4.3 Khả dụng và trải nghiệm — NFR-UX

| ID | Yêu cầu |
| --- | --- |
| NFR-UX-01 | Mọi màn hình có dữ liệu xử lý đủ **5 trạng thái**: Loading (skeleton đúng hình dạng nội dung) · Empty (mascot + câu giải thích + hành động) · Error (theo code lỗi + nút thử lại + requestId) · Partial (ví dụ AI Job sinh 5/7 bài vẫn hiển thị, không coi là fail toàn phần) · Success |
| NFR-UX-02 | AI Job có thêm trạng thái thứ 6 — **đang chạy**: mascot + thanh tiến độ + nhãn bước hiện tại |
| NFR-UX-03 | Không tràn ngang ở mọi bề rộng từ 320px |
| NFR-UX-04 | Tương phản văn bản ≥ 4.5:1 (chữ lớn ≥ 3:1) |
| NFR-UX-05 | Điều hướng đầy đủ bằng bàn phím, focus ring luôn thấy được |
| NFR-UX-06 | Tôn trọng prefers-reduced-motion |
| NFR-UX-07 | Chữ nhỏ nhất 14px trên mobile |

### 4.4 Độ tin cậy AI — NFR-AI

| ID | Yêu cầu |
| --- | --- |
| NFR-AI-01 | Output AI phải qua đủ 4 tầng validation trước khi lưu: Schema (Zod) → Luật nghiệp vụ → Bám nguồn (sourceChunkIds tồn tại thật + lấy mẫu đối chiếu thuật ngữ) → Vệ sinh dữ liệu (sanitize Markdown) |
| NFR-AI-02 | Lesson không đạt ngưỡng bám nguồn (dưới 50% thuật ngữ mẫu khớp) vẫn được lưu nhưng đánh dấu LOW_CONFIDENCE, UI phải hiển thị cảnh báo — không được im lặng bỏ qua hoặc giả vờ chắc chắn |
| NFR-AI-03 | Không gọi LLM thật trong CI — dùng chế độ mock (fixture cố định); record/live chỉ dùng dev/thủ công |
| NFR-AI-04 | Một job vượt AI_JOB_MAX_COST_USD (mặc định $0.50) phải dừng và báo lỗi, không âm thầm tiếp tục chi tiêu |
| NFR-AI-05 | Mỗi lần gọi LLM ghi lại GenerationRun (token, chi phí ước tính, độ trễ) — bắt buộc để admin theo dõi chi phí |

### 4.5 Khả kiểm thử — NFR-TEST

| ID | Yêu cầu | Mục tiêu |
| --- | --- | --- |
| NFR-TEST-01 | Độ phủ dòng cho apps/api và packages/ai | ≥ 70% |
| NFR-TEST-02 | Bắt buộc có test cho: chấm điểm Exercise, 4 tầng validation AI, áp hạn mức (kể cả race condition), xoay vòng + phát hiện tái sử dụng refresh token, lọc quyền sở hữu repository (IDOR), idempotency webhook thanh toán, chuyển trạng thái AIJob, cắt chunk ở biên (tài liệu 1 trang/rỗng/300 trang) | Không được thiếu bất kỳ mục nào |
| NFR-TEST-03 | 8 kịch bản E2E bắt buộc (đăng ký→dashboard, rate limit đăng nhập sai, tạo course→upload→extract, chạy AI job→thấy tiến độ→thấy lesson, mở lesson→làm bài→nộp→thấy điểm, hoàn thành→tiến trình course tăng, chạm hạn mức Free→thấy nâng cấp, admin xem AI Job list) | Chạy mỗi PR vào main |

### 4.6 Quan sát và vận hành — NFR-OPS

| ID | Yêu cầu |
| --- | --- |
| NFR-OPS-01 | Mọi request có X-Request-Id (sinh nếu client không gửi), xuất hiện trong log |
| NFR-OPS-02 | Response rate-limit trả X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After |
| NFR-OPS-03 | POST tạo AIJob và thanh toán bắt buộc header Idempotency-Key |
| NFR-OPS-04 | Lỗi trả theo RFC 7807 (type, title, status, code, detail), type phải phản ánh đúng code thực tế cho mọi nhánh lỗi, kể cả lỗi không phải ApiError tự định nghĩa |

---

## 5. Yêu cầu chức năng (FR)

Mỗi yêu cầu ghi rõ trạng thái theo 4 nhãn bắt buộc của AGENTS.md. "Route thật" liệt kê để
đối chiếu trực tiếp với apps/api/src/modules/**/*.controller.ts — không suy diễn.

### 5.1 Authentication — FR-AUTH `[SPEC §6.1]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-AUTH-01 | Đăng ký tài khoản bằng email + mật khẩu | Có trong MVP |
| FR-AUTH-02 | Đăng nhập, trả access token + set cookie refresh token | Có trong MVP |
| FR-AUTH-03 | Đổi refresh token lấy access token mới, có xoay vòng | Có trong MVP |
| FR-AUTH-04 | Đăng xuất (thu hồi refresh token hiện tại) và đăng xuất toàn bộ phiên | Có trong MVP |
| FR-AUTH-05 | Xem và sửa hồ sơ cơ bản (displayName, locale) | Có trong MVP |
| FR-AUTH-06 | Đổi mật khẩu khi đã đăng nhập | Có trong MVP |
| FR-AUTH-07 | Quên mật khẩu qua email | **Đang phát triển** — màn hình tồn tại, hiển thị đúng trạng thái "đang phát triển", backend chưa có endpoint gửi email |
| FR-AUTH-08 | Mọi route ngoài trang public phải được bảo vệ (redirect nếu chưa đăng nhập) | Có trong MVP |

Route thật: POST /auth/register, POST /auth/login, POST /auth/refresh,
POST /auth/logout, POST /auth/logout-all, GET /auth/me, PATCH /auth/me,
POST /auth/change-password.

### 5.2 Course Management — FR-COURSE `[SPEC §6.2]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-COURSE-01 | Tạo course mới | Có trong MVP |
| FR-COURSE-02 | Xem danh sách course của user (workspace) | Có trong MVP |
| FR-COURSE-03 | Xem chi tiết một course | Có trong MVP |
| FR-COURSE-04 | Đổi tên / sửa course | Có trong MVP |
| FR-COURSE-05 | Xoá course (soft delete) | Có trong MVP |
| FR-COURSE-06 | Gắn document với course | Có trong MVP (qua module Document) |
| FR-COURSE-07 | Chia sẻ course với thành viên khác (CourseMember) | **Đang phát triển** — bảng dữ liệu và role tồn tại trong schema, chưa có luồng mời/UI |

Route thật: GET /workspace, POST /courses, GET /courses/:id, PATCH /courses/:id,
DELETE /courses/:id.

### 5.3 Document Management — FR-DOC `[SPEC §6.3]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-DOC-01 | Tải tài liệu lên qua presigned URL (không đi qua API server) | Có trong MVP |
| FR-DOC-02 | Xác nhận upload thành công, kích hoạt trích xuất | Có trong MVP |
| FR-DOC-03 | Hiển thị danh sách document của course + trạng thái xử lý (PENDING→UPLOADED→EXTRACTING→EXTRACTED/FAILED) | Có trong MVP |
| FR-DOC-04 | Xử lý trạng thái trích xuất thất bại, hiển thị lỗi rõ ràng | Có trong MVP |
| FR-DOC-05 | Tải xuống document gốc | Có trong MVP |
| FR-DOC-06 | Xoá document (xoá cả file trên object storage) | Có trong MVP |
| FR-DOC-07 | Chặn upload trùng checksum trong cùng course | Có trong MVP |
| FR-DOC-08 | Trích xuất text từ PDF có lớp text, TXT, MD | Có trong MVP |
| FR-DOC-09 | Trích xuất PPTX, DOCX | **Đã lên kế hoạch** — chưa triển khai (officeparser, mammoth) |
| FR-DOC-10 | OCR cho PDF scan (không có lớp text) | **Đã lên kế hoạch** — hiện từ chối tường minh bằng ScannedPdfNotSupportedError, không giả vờ xử lý được |
| FR-DOC-11 | Trang danh sách tài liệu độc lập (ngoài trang course) | **Đã lên kế hoạch** |

Route thật: POST /courses/:courseId/documents/upload-url, POST /documents/:id/confirm,
GET /courses/:courseId/documents, GET /documents/:id/download, DELETE /documents/:id.

Định dạng hỗ trợ thật hiện nay: .pdf (có lớp text), .txt, .md. .pptx/.docx nằm trong
whitelist phần mở rộng ở tầng validation nhưng **chưa có trình trích xuất** — nộp lên sẽ dừng ở
bước xử lý, không được quảng cáo là "hỗ trợ đầy đủ 5 định dạng" ở bất kỳ nơi nào (marketing,
UI, tài liệu) cho tới khi FR-DOC-09 hoàn tất.

### 5.4 AI Lesson Generation — FR-AI `[SPEC §6.4]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-AI-01 | Tạo AI Job sinh bài học từ document đã trích xuất | Có trong MVP |
| FR-AI-02 | Xử lý theo pipeline: extract → chunk → outline → sinh nội dung Lesson → sinh Exercise/Question → validate (4 tầng) → lưu | Có trong MVP |
| FR-AI-03 | Hiển thị trạng thái tiến độ AI Job theo thời gian thực | Có trong MVP — hiện qua **polling 2s**, không phải SSE thật |
| FR-AI-04 | Cung cấp kênh SSE /ai-jobs/:id/stream cho tiến độ AI Job | **Đang phát triển** — endpoint đã tồn tại ở backend, frontend chưa dùng vì EventSource trình duyệt không gửi được header Authorization; cần đổi sang fetch + ReadableStream |
| FR-AI-05 | Huỷ AI Job đang chạy hoặc đang chờ | Có trong MVP |
| FR-AI-06 | Chạy lại (retry) AI Job thất bại, tối đa 3 lần | Có trong MVP |
| FR-AI-07 | Lưu một phần kết quả nếu chỉ một số Lesson lỗi (partialFailures), không fail toàn bộ job | Có trong MVP |
| FR-AI-08 | Đổi nhà cung cấp LLM qua biến môi trường (Anthropic / Google Gemini) | Có trong MVP |
| FR-AI-09 | Chạy AI job ở chế độ mock cho test/CI, không gọi LLM thật | Có trong MVP |
| FR-AI-10 | Nhận diện heading thật trong tài liệu (thay vì heuristic đơn giản) khi chunk | **Đã lên kế hoạch** |
| FR-AI-11 | Job định kỳ dọn AI Job treo, dead-letter queue | **Đã lên kế hoạch** |

Route thật: POST /courses/:courseId/generate-lessons, GET /jobs, GET /jobs/:id,
POST /jobs/:id/cancel, GET /jobs/:id/stream.

### 5.5 Interactive Learning — FR-LESSON `[SPEC §6.5]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-LESSON-01 | Xem danh sách Lesson của course, theo đúng thứ tự | Có trong MVP |
| FR-LESSON-02 | Mở một Lesson, hiển thị nội dung (contentMd) | Có trong MVP |
| FR-LESSON-03 | Bắt đầu học một Lesson (đánh dấu IN_PROGRESS) | Có trong MVP |
| FR-LESSON-04 | Sửa nội dung Lesson do AI sinh | Có trong MVP |
| FR-LESSON-05 | Sắp xếp lại thứ tự Lesson | Có trong MVP |
| FR-LESSON-06 | Xoá Lesson | Có trong MVP |
| FR-LESSON-07 | Hiển thị cảnh báo LOW_CONFIDENCE khi Lesson lệch khỏi tài liệu gốc | Có trong MVP |
| FR-LESSON-08 | Xem Exercise của Lesson, không lộ đáp án đúng trước khi nộp | Có trong MVP |
| FR-LESSON-09 | Nộp câu trả lời Exercise | Có trong MVP |
| FR-LESSON-10 | Chấm điểm tự động, trả về đúng/sai + giải thích | Có trong MVP, hỗ trợ 4 loại câu hỏi: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, FILL_BLANK |
| FR-LESSON-11 | Đánh dấu Lesson hoàn thành | Có trong MVP |

Route thật: GET /courses/:courseId/lessons, GET /courses/:courseId/lessons/:lessonId,
POST /courses/:courseId/lessons/:lessonId/start, PATCH /courses/:courseId/lessons/reorder,
PATCH /courses/:courseId/lessons/:lessonId, DELETE /courses/:courseId/lessons/:lessonId,
GET /lessons/:lessonId/exercise, POST /lessons/:lessonId/exercise/submit.

> Ghi chú kiến trúc: path Lesson/Exercise lồng dưới /courses/:id/... thay vì phẳng
> /lessons/:id như HANDBOOK §7.2 mô tả ban đầu — quyết định có chủ đích để tránh refactor
> lớn giữa lúc build frontend (xem docs/progress/STATE.md, mục next-action #12). Cần chốt
> trước khi coi yêu cầu hợp đồng API là đạt.

### 5.6 Learning Progress — FR-PROGRESS `[SPEC §6.6]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-PROGRESS-01 | Lưu Lesson đã hoàn thành và kết quả Exercise | Có trong MVP |
| FR-PROGRESS-02 | Hiển thị tiến trình tổng quan (overview) của user | Có trong MVP |
| FR-PROGRESS-03 | Hiển thị tiến trình theo từng course | Có trong MVP |
| FR-PROGRESS-04 | Hiển thị lịch sử học tập cơ bản | Có trong MVP |
| FR-PROGRESS-05 | Bấm vào một dòng lịch sử để nhảy thẳng tới đúng bài học | **Đang phát triển** — lịch sử hiện ghi đúng tên bài/course nhưng thiếu courseId/lessonId để điều hướng |
| FR-PROGRESS-06 | Phân trang cursor-based thật cho lịch sử (thay vì tăng limit) | **Đã lên kế hoạch** |

Route thật: GET /progress/overview, GET /progress/courses, GET /progress/course/:courseId,
GET /progress/history.

### 5.7 Subscription & Billing — FR-SUB `[SPEC §6.7]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-SUB-01 | Hiển thị danh sách gói, giá, tính năng | Có trong MVP (Free, Pro; Team hiển thị nhãn Mở rộng tương lai, không có nút mua) |
| FR-SUB-02 | Gắn user với một subscription | Có trong MVP |
| FR-SUB-03 | Áp hạn mức theo gói: số course, số document/tháng, số trang/document, số AI Job/tháng | Có trong MVP, kiểm cả trước khi bắt đầu (402 QUOTA_EXCEEDED) lẫn tại thời điểm tăng bộ đếm (atomic) |
| FR-SUB-04 | Nâng cấp gói qua thanh toán demo (kích hoạt ngay, ghi Payment giả, UI cảnh báo rõ đây là demo) | Có trong MVP |
| FR-SUB-05 | Nâng cấp gói qua Stripe Checkout thật | **Đã lên kế hoạch** — code đường dẫn tồn tại (BILLING_MODE=live) nhưng Stripe SDK chưa được bundle trong repo, trả lỗi tường minh nếu bật thiếu STRIPE_SECRET_KEY |
| FR-SUB-06 | Webhook Stripe xác minh chữ ký, chống xử lý trùng sự kiện | **Đã lên kế hoạch** — phụ thuộc FR-SUB-05 |
| FR-SUB-07 | Huỷ subscription | Có trong MVP |
| FR-SUB-08 | Xem mức sử dụng hiện tại so với hạn mức | Có trong MVP |

Route thật: GET /plans, GET /subscription, GET /usage, POST /subscription/checkout,
POST /subscription/cancel, POST /webhooks/stripe.

### 5.8 Administration — FR-ADMIN `[SPEC §6.8]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-ADMIN-01 | Xem danh sách user | Có trong MVP |
| FR-ADMIN-02 | Xem danh sách course | Có trong MVP |
| FR-ADMIN-03 | Xem danh sách và chi tiết AI Job (kèm GenerationRun, audit log) | Có trong MVP |
| FR-ADMIN-04 | Chạy lại AI Job từ trang admin | Có trong MVP |
| FR-ADMIN-05 | Xem trạng thái subscription toàn hệ thống | Có trong MVP |
| FR-ADMIN-06 | Xem chỉ số tổng quan (metrics) | Có trong MVP |
| FR-ADMIN-07 | Thao tác sửa/khoá/xoá user hoặc course từ trang admin | **Ngoài phạm vi MVP** — trang admin hiện chỉ đọc (read-only) theo đúng §6.8 spec |

Route thật: GET /admin/metrics, GET /admin/users, GET /admin/courses,
GET /admin/subscriptions, GET /admin/ai-jobs, GET /admin/ai-jobs/:id,
POST /admin/ai-jobs/:id/retry, GET /admin/ai-jobs/:id/audit-log.

### 5.9 Portfolio Website (Track A) — FR-SITE `[SPEC §8–§17]`

Website marketing/kỹ thuật giới thiệu sản phẩm cho khách hàng và nhà tuyển dụng — yêu cầu chi
tiết (site map, copy mẫu, tiêu chí Definition of Done) nằm trong
learnflow-ai-portfolio-agent-spec.md, không lặp lại ở đây để tránh hai nguồn sự thật.
Trạng thái tổng quát: **Có trong MVP**, các mục nội dung/component/ADR/ảnh chụp/Lighthouse đã
hoàn tất (xem docs/progress/STATE.md, mốc M6); còn thiếu video demo do ngoài phạm vi công cụ
hiện có.

---

## 6. Mô hình dữ liệu tóm tắt

Nguồn sự thật là packages/db/prisma/schema.prisma — bảng dưới đây chỉ tóm tắt để đối chiếu
nhanh với FR ở §5, **không** thay thế việc đọc schema khi cần chi tiết field.

```text
User 1-N Course 1-N Document 1-N DocumentChunk
User 1-N Course 1-N Lesson 1-N Exercise 1-N Question 1-N AnswerOption
User 1-N Course (qua CourseMember, vai trò chia sẻ)
Document 1-N AIJob 1-N GenerationRun
User 1-N LearningProgress (theo Lesson)
Exercise 1-N Submission 1-N SubmissionAnswer
User 1-N Subscription N-1 Plan
Subscription 1-N Payment 1-N PaymentEvent
User 1-N UsageCounter
Mọi hành động nhạy cảm ghi vào AuditLog
```

Enum trạng thái quan trọng (giá trị thật từ schema, không suy diễn):

| Entity | Enum trạng thái |
| --- | --- |
| Course | DRAFT · READY · ARCHIVED |
| Document | PENDING · UPLOADED · EXTRACTING · EXTRACTED · FAILED |
| AIJob | QUEUED · RUNNING · SUCCEEDED · FAILED · CANCELLED |
| Lesson | DRAFT · PUBLISHED, độ tin cậy UNKNOWN · HIGH · LOW |
| Progress | NOT_STARTED · IN_PROGRESS · COMPLETED |
| Question | MULTIPLE_CHOICE · TRUE_FALSE · SHORT_ANSWER · FILL_BLANK |
| Subscription | theo SubscriptionStatus (xem schema) |
| UsageMetric | COURSES_CREATED · DOCUMENTS_UPLOADED · PAGES_PROCESSED · AI_JOBS_RUN · LLM_TOKENS |

---

## 7. Ràng buộc nội dung và claim `[SPEC §15]`

Áp dụng cho mọi nơi hiển thị nội dung cho người dùng cuối (UI, marketing, tài liệu công khai):

- **Không** claim hệ thống hiểu hoàn hảo mọi tài liệu.
- **Không** claim nội dung AI sinh không có lỗi.
- **Không** claim cá nhân hoá học tập được đảm bảo.
- **Không** claim thay thế giáo viên.
- **Không** claim độ tin cậy production-scale nếu chưa được chứng minh (ví dụ chưa có tải
  thực tế, chưa có SLA đo được).
- Luôn phân biệt tính năng **đã có** và **dự kiến** bằng đúng 4 nhãn ở đầu tài liệu này —
  không dùng từ ngữ mơ hồ khác ("sắp ra mắt", "coming soon" không kèm nhãn chuẩn).
- Dùng thuật ngữ thống nhất theo §1.4 — không đổi "Course" thành "khóa học"/"lớp học" lẫn lộn
  trong cùng một ngữ cảnh, không đổi "AI Job" thành "tác vụ" chung chung khi nói về xử lý AI.

---

## 8. Tiêu chí nghiệm thu (Definition of Done) `[SPEC §16, §17]`

Một yêu cầu FR/NFR được coi là **đạt** khi và chỉ khi:

1. Có thể tái hiện hành vi qua UI thật hoặc gọi API thật — không chỉ qua unit test cô lập.
2. Có test tự động bảo vệ hành vi đó ở tầng phù hợp (xem NFR-TEST-02 cho danh sách bắt buộc).
3. Trạng thái trong tài liệu này (Có trong MVP / khác) khớp với những gì STATE.md ghi
   nhận — không đánh dấu "Có trong MVP" nếu STATE.md còn liệt kê là dở dang.
4. Không vi phạm bất kỳ mục nào ở §4 (NFR) và §7 (ràng buộc nội dung).

Toàn hệ thống được coi là đạt MVP khi toàn bộ luồng lõi ở §3.1 chạy được đầu-cuối qua UI thật,
và mọi hàng "Có trong MVP" ở §5 đều đạt theo tiêu chí trên. Trạng thái tổng hợp hiện tại nằm ở
docs/progress/STATE.md (mục "Tóm tắt nhanh") — không lặp lại con số ở đây vì sẽ lệch nhanh.
