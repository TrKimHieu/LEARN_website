# SRS.md — Đặc tả yêu cầu phần mềm (SRS) — Hệ thống LEARN

> Tài liệu này trình bày lại toàn bộ yêu cầu của hệ thống LEARN theo cấu trúc SRS đầy đủ
> (Giới thiệu → Tổng quan → Phạm vi → FR → NFR → Dữ liệu/nghiệp vụ → Nghiệm thu →
> Traceability). Đây **không phải nguồn sự thật thứ hai** — mọi ID yêu cầu (`FR-*`, `NFR-*`),
> trạng thái, và route thật lấy nguyên từ `docs/REQUIREMENTS.md`, vốn được đối chiếu trực tiếp
> với schema Prisma và controller thật. Khi hai tài liệu lệch nhau, `docs/REQUIREMENTS.md`
> thắng; sửa ở đó trước rồi mới đồng bộ về đây.
>
> Ràng buộc nghiệp vụ gốc, không tự ý đổi, gắn nhãn `[SPEC]`, nguồn là
> `learnflow-ai-portfolio-agent-spec.md` (đổi phải sửa spec trước — xem `AGENTS.md`).
>
> Mọi vị trí cần hình vẽ/sơ đồ được đánh dấu bằng mã **"Hình N. <mô tả>"** thay vì vẽ trực
> tiếp — người đọc tự thiết kế và chèn hình vào đúng vị trí đó.
>
> Cập nhật lần cuối: 2026-09-22.

---

## 1. Giới thiệu

### 1.a Mục đích tài liệu

Đặc tả đầy đủ, có thể kiểm chứng, những gì **hệ thống LEARN phải làm** — dùng làm căn cứ
duy nhất khi: (1) triển khai tính năng, (2) review/chấp nhận thay đổi, (3) trả lời "tính
năng X có nằm trong yêu cầu không, trạng thái hiện tại là gì". Không tính năng nào được coi
là "chắc cũng cần" nếu không truy được về một mục trong tài liệu này hoặc trong
`learnflow-ai-portfolio-agent-spec.md`.

### 1.b Phạm vi sản phẩm

Bao trùm toàn bộ hệ thống phần mềm: `apps/web` (Next.js — ứng dụng học tập + trang
portfolio marketing), `apps/api` (NestJS — REST API), `apps/worker` (NestJS standalone — xử
lý AI Job bất đồng bộ), `packages/db` (Prisma/PostgreSQL), `packages/ai` (adapter LLM),
`packages/contracts` (Zod schema dùng chung giữa web/api/worker).

**Không** bao trùm chi tiết nội dung marketing (site map, copy mẫu, bảng màu, ảnh chụp) —
phần đó thuộc `learnflow-ai-portfolio-agent-spec.md` §8–§17; tài liệu này chỉ tham chiếu tới
kết quả (FR-SITE, xem §4.h).

Hình 1. Sơ đồ kiến trúc tổng quan hệ thống (apps/web, apps/api, apps/worker, PostgreSQL,
Redis/queue, object storage S3-compatible, nhà cung cấp LLM ngoài, cổng thanh toán).

### 1.c Đối tượng đọc

Kỹ sư triển khai (người hoặc AI agent nhận việc trong repo), reviewer kỹ thuật, và người
phụ trách sản phẩm cần biết ranh giới MVP. Giả định người đọc đã đọc `AGENTS.md` trước.

### 1.d Thuật ngữ và định nghĩa

Dùng thống nhất — không thay bằng từ đồng nghĩa ở bất kỳ đâu trong code, API, UI hay tài
liệu khác:

| Thuật ngữ | Định nghĩa |
| --- | --- |
| Course | Tập hợp tài liệu học tập + bài học, thuộc sở hữu một User (`ownerId`) |
| Document | Tệp nguồn người dùng tải lên (PDF/PPTX/DOCX/TXT/MD), gắn với một Course |
| Document Chunk | Đoạn văn bản đã cắt nhỏ từ Document, đơn vị đưa vào LLM |
| AI Job | Tác vụ bất đồng bộ xử lý AI (trích xuất, sinh bài học, sinh lại) chạy trên hàng đợi |
| Generation Run | Một lượt gọi LLM cụ thể bên trong một AI Job, ghi token/chi phí/độ trễ |
| Lesson | Một đơn vị học tập được AI sinh ra (hoặc sửa tay) từ Document |
| Exercise | Hoạt động luyện tập gắn với một Lesson, chứa một hoặc nhiều Question |
| Question | Một câu hỏi cụ thể trong Exercise, có loại (`QuestionType`) |
| Submission | Một lần người dùng nộp câu trả lời cho một Exercise |
| Learning Progress | Trạng thái học của một User đối với một Lesson cụ thể |
| Subscription | Trạng thái gói dịch vụ hiện tại của một User, gắn với một Plan |
| Usage Counter | Bộ đếm mức sử dụng theo kỳ (tháng), dùng để áp hạn mức gói |
| Course Member | Vai trò chia sẻ Course cho user khác ngoài chủ sở hữu (OWNER/EDITOR/VIEWER) |

### 1.e Tài liệu tham chiếu

| Tài liệu | Vai trò |
| --- | --- |
| `learnflow-ai-portfolio-agent-spec.md` | Yêu cầu nghiệp vụ gốc `[SPEC]`, không tự ý đổi |
| `docs/REQUIREMENTS.md` | Nguồn sự thật cho ID, trạng thái, route thật của từng FR/NFR |
| `docs/HANDBOOK.md` | Quyết định kỹ thuật, schema đầy đủ, quy ước API — trả lời "làm bằng cách nào" |
| `docs/progress/STATE.md` | Trạng thái hiện tại, việc dang dở, quyết định gần nhất, next-action |
| `docs/progress/CHECKLIST.md` | Checklist master phản chiếu HANDBOOK §20 |
| `docs/adr/*.md` | Quyết định kiến trúc/kỹ thuật đã chốt (ADR), kèm lý do |
| `packages/db/prisma/schema.prisma` | Nguồn sự thật cho mô hình dữ liệu |
| `AGENTS.md` | Quy tắc làm việc bắt buộc cho mọi phiên (đọc trước khi đụng code) |

---

## 2. Tổng quan sản phẩm

### 2.a Problem Statement `[SPEC]`

Người học có nhiều tài liệu (PDF, slide, ghi chú cá nhân) nhưng thiếu cách hiệu quả để biến
chúng thành trải nghiệm học tập có cấu trúc. Nền tảng học tập truyền thống chỉ cung cấp nội
dung tĩnh — người học phải tự tổ chức bài học, tự xác định kiến thức trọng tâm, tự tạo bài
tập để tự kiểm tra. LEARN giải quyết vấn đề này bằng cách dùng AI để chuyển tài liệu thô
thành bài học có cấu trúc + bài tập tương tác + theo dõi tiến trình, đưa người học từ tiếp
nhận thụ động sang học chủ động.

### 2.b Mục tiêu sản phẩm `[SPEC]`

Hệ thống phải thể hiện được — bằng hành vi thật, không chỉ bằng copy marketing — 5 giá trị
cốt lõi:

1. **Giảm thời gian chuẩn bị học liệu** — từ tài liệu thô ra bài học có cấu trúc trong vài
   phút thay vì hàng giờ soạn thủ công.
2. **Học chủ động** — bài tập tương tác chấm điểm ngay, không chỉ đọc tĩnh.
3. **Học có cấu trúc** — phân cấp rõ Course → Lesson → Exercise → Question.
4. **Theo dõi tiến trình** — trạng thái hoàn thành, điểm số, lịch sử học tập.
5. **AI hỗ trợ có giới hạn rõ ràng** — không claim cá nhân hoá hoàn toàn hay adaptive
   learning (xem ràng buộc nội dung ở §4 và Definition of Done ở §7.a).

### 2.c Nhóm người dùng `[SPEC]`

| Nhóm | Vai trò hệ thống | Nhu cầu chính | Trong MVP? |
| --- | --- | --- | --- |
| **Learner** (chính) | `UserRole.LEARNER` | Tải tài liệu, tạo course, sinh bài học AI, luyện tập, xem tiến trình | **Có** |
| **Content Creator** (phụ) | `LEARNER` + `CourseMemberRole` | Tạo course, review/sửa bài học AI sinh, tổ chức nội dung, chia sẻ course | Dùng chung cơ chế sở hữu Course với Learner; chia sẻ qua `CourseMember` — **Đang phát triển**, bảng dữ liệu tồn tại, chưa có luồng mời/UI |
| **Administrator** | `UserRole.ADMIN` | Quản lý user/course, theo dõi AI Job, theo dõi subscription | **Có**, chỉ xem (read-only) — không có thao tác sửa/xoá dữ liệu người dùng từ trang admin |

Không có vai trò hệ thống riêng cho "Content Creator" ở tầng `UserRole` — đây là một cách
dùng của vai trò Learner, hiện thực hoá tối thiểu qua `CourseMemberRole`.

### 2.d User Roles & Permissions

Ma trận quyền theo hành động, đối chiếu trực tiếp với NFR-SEC-04 (lọc quyền sở hữu ở tầng
repository) và FR-ADMIN-07 (admin không có quyền ghi):

| Hành động | Learner (chủ Course) | Course Member — EDITOR | Course Member — VIEWER | Admin |
| --- | --- | --- | --- | --- |
| Tạo/sửa/xoá Course của mình | ✅ | — | — | ❌ (chỉ xem) |
| Xem Course được chia sẻ | — | ✅ | ✅ | ✅ (mọi course) |
| Sửa nội dung Lesson của Course được chia sẻ | — | ✅ | ❌ | ❌ |
| Tải/xoá Document | ✅ (course của mình) | ✅ | ❌ | ❌ |
| Chạy/huỷ/chạy lại AI Job | ✅ (course của mình) | ✅ | ❌ | Chạy lại (FR-ADMIN-04) |
| Làm Exercise, xem tiến trình cá nhân | ✅ | ✅ | ✅ | ❌ (không có tiến trình cá nhân) |
| Xem danh sách user/course/AI Job/subscription toàn hệ thống | ❌ | ❌ | ❌ | ✅ (read-only) |
| Sửa/khoá/xoá user hoặc course của người khác | ❌ | ❌ | ❌ | ❌ (ngoài phạm vi MVP — FR-ADMIN-07) |

`CourseMemberRole` (OWNER/EDITOR/VIEWER) đã có trong schema nhưng **chưa có luồng mời**
(§4.b, FR-COURSE-07) — ma trận trên là thiết kế mục tiêu, chưa hoàn toàn thực thi được qua
UI ở thời điểm viết tài liệu.

### 2.e Product Scope

LEARN gồm hai phần sản phẩm tách biệt nhưng dùng chung một hệ thống nhận diện thương hiệu:

- **Track A — Ứng dụng học tập** (§4): toàn bộ luồng Course/Document/AI/Lesson/Progress/
  Subscription/Admin. Đây là trọng tâm của tài liệu này.
- **Track B — Website portfolio** (FR-SITE, §4.h): trang marketing/kỹ thuật giới thiệu sản
  phẩm cho khách hàng và nhà tuyển dụng. Yêu cầu chi tiết nằm ở
  `learnflow-ai-portfolio-agent-spec.md` §8–§17, không lặp lại ở đây.

### 2.f Assumptions & Constraints

**Giả định:**

- Người dùng có trình duyệt hiện đại (Chromium/Firefox/Safari bản gần đây), kết nối Internet
  ổn định; không hỗ trợ trình duyệt cũ (IE, các bản Safari/Chrome quá 2 năm).
- Ngôn ngữ chính của sản phẩm là tiếng Việt (`locale` mặc định `"vi"`); tiếng Anh không phải
  yêu cầu MVP.
- Người dùng tự đăng ký (self-serve), không có luồng duyệt/mời riêng ở cấp tổ chức.
- Tài liệu đầu vào chủ yếu là văn bản có lớp text (không phải ảnh scan) — xem giới hạn ở
  FR-DOC-08/09/10.

**Ràng buộc:**

- Ngân sách một AI Job bị chặn cứng bởi `AI_JOB_MAX_COST_USD` (NFR-AI-04) — không được vượt
  dù kết quả có thể chưa hoàn chỉnh.
- Giới hạn upload: 25MB/tệp, tối đa 300 trang (PDF scan giới hạn 50 trang) — NFR-SEC-07.
- Không có hạ tầng đa vùng (multi-region) hay SLA đo được ở giai đoạn MVP — không được claim
  độ tin cậy production-scale (xem §4 Ràng buộc nội dung).
- CI không được gọi LLM thật (NFR-AI-03) — mọi kiểm thử tự động chạy ở chế độ mock.
- Một User chỉ có một Subscription hiệu lực tại một thời điểm; không hỗ trợ nhiều gói cùng
  lúc hay gói theo từng Course riêng lẻ.

---

## 3. Phạm vi và ưu tiên

### 3.a MVP Scope

Trong phạm vi MVP: Authentication · Course Management · Document Management ·
AI Lesson Generation · Interactive Learning · Learning Progress ·
Subscription & Billing (chế độ demo hoặc live) · Administration (read-only) ·
Website Portfolio (Track B).

Chi tiết từng mục, kèm ID yêu cầu và trạng thái chính xác, nằm ở §4 (Functional
Requirements). Nhãn trạng thái dùng thống nhất 4 mức bắt buộc theo `AGENTS.md`:
**Có trong MVP** · **Đang phát triển** · **Đã lên kế hoạch** · **Mở rộng tương lai**.

### 3.b Out of Scope `[SPEC]`

Không triển khai trừ khi có yêu cầu tường minh mới; nếu xuất hiện trong UI/copy phải gắn
nhãn **Mở rộng tương lai**, không được ngầm định là sắp có:

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

### 3.c Future Expansion

Khác với §3.b (loại hẳn khỏi phạm vi), các mục dưới đây **đã có trong thiết kế/schema** và
được ưu tiên phát triển tiếp sau MVP — trạng thái chính xác và lý do trì hoãn nằm ở §4:

- Trích xuất PPTX/DOCX (FR-DOC-09).
- OCR cho PDF scan (FR-DOC-10).
- Kênh SSE thật cho tiến độ AI Job, thay polling (FR-AI-04).
- Nhận diện heading thật khi chunk tài liệu (FR-AI-10).
- Job định kỳ dọn AI Job treo + dead-letter queue (FR-AI-11).
- Luồng mời/chia sẻ Course qua `CourseMember` (FR-COURSE-07).
- Điều hướng trực tiếp từ lịch sử học tập tới đúng bài học (FR-PROGRESS-05).
- Phân trang cursor-based thật cho lịch sử tiến trình (FR-PROGRESS-06).
- Thanh toán Stripe Checkout thật + webhook xác minh chữ ký (FR-SUB-05, FR-SUB-06).
- Trang danh sách tài liệu độc lập ngoài trang course (FR-DOC-11).

### 3.d Core User Journey `[SPEC]`

Luồng lõi bắt buộc phải chạy được đầu-cuối qua UI thật (không chỉ qua API) để coi là đạt
MVP:

> Đăng ký/Đăng nhập → Tạo Course → Tải Document → Sinh Lesson bằng AI → Học Lesson →
> Làm Exercise → Theo dõi tiến trình

Hình 2. Sơ đồ luồng người dùng lõi (core user journey) từ đăng ký đến theo dõi tiến trình,
kèm điểm rẽ nhánh khi AI Job thất bại một phần (partial failure) hoặc chạm hạn mức gói.

---

## 4. Yêu cầu chức năng (Functional Requirements)

Mỗi yêu cầu ghi rõ trạng thái theo đúng 4 nhãn bắt buộc của `AGENTS.md`. "Route thật" đối
chiếu trực tiếp với `apps/api/src/modules/**/*.controller.ts` — không suy diễn. Đây là bản
sao đồng bộ từ `docs/REQUIREMENTS.md` §5; khi cập nhật trạng thái một FR, sửa ở
`docs/REQUIREMENTS.md` trước.

### 4.a Authentication — FR-AUTH `[SPEC §6.1]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-AUTH-01 | Đăng ký tài khoản bằng email + mật khẩu | Có trong MVP |
| FR-AUTH-02 | Đăng nhập, trả access token + set cookie refresh token | Có trong MVP |
| FR-AUTH-03 | Đổi refresh token lấy access token mới, có xoay vòng | Có trong MVP |
| FR-AUTH-04 | Đăng xuất (thu hồi refresh token hiện tại) và đăng xuất toàn bộ phiên | Có trong MVP |
| FR-AUTH-05 | Xem và sửa hồ sơ cơ bản (displayName, locale) | Có trong MVP |
| FR-AUTH-06 | Đổi mật khẩu khi đã đăng nhập | Có trong MVP |
| FR-AUTH-07 | Quên mật khẩu qua email | Đang phát triển — màn hình tồn tại, hiển thị đúng trạng thái, backend chưa có endpoint gửi email |
| FR-AUTH-08 | Mọi route ngoài trang public phải được bảo vệ (redirect nếu chưa đăng nhập) | Có trong MVP |

Route thật: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
`POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, `PATCH /auth/me`,
`POST /auth/change-password`.

### 4.b Course Management — FR-COURSE `[SPEC §6.2]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-COURSE-01 | Tạo course mới | Có trong MVP |
| FR-COURSE-02 | Xem danh sách course của user (workspace) | Có trong MVP |
| FR-COURSE-03 | Xem chi tiết một course | Có trong MVP |
| FR-COURSE-04 | Đổi tên / sửa course | Có trong MVP |
| FR-COURSE-05 | Xoá course (soft delete) | Có trong MVP |
| FR-COURSE-06 | Gắn document với course | Có trong MVP (qua module Document) |
| FR-COURSE-07 | Chia sẻ course với thành viên khác (CourseMember) | Đang phát triển — bảng dữ liệu và role tồn tại trong schema, chưa có luồng mời/UI |

Route thật: `GET /workspace`, `POST /courses`, `GET /courses/:id`, `PATCH /courses/:id`,
`DELETE /courses/:id`.

### 4.c Document Management — FR-DOC `[SPEC §6.3]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-DOC-01 | Tải tài liệu lên qua presigned URL (không đi qua API server) | Có trong MVP |
| FR-DOC-02 | Xác nhận upload thành công, kích hoạt trích xuất | Có trong MVP |
| FR-DOC-03 | Hiển thị danh sách document + trạng thái xử lý (PENDING→UPLOADED→EXTRACTING→EXTRACTED/FAILED) | Có trong MVP |
| FR-DOC-04 | Xử lý trạng thái trích xuất thất bại, hiển thị lỗi rõ ràng | Có trong MVP |
| FR-DOC-05 | Tải xuống document gốc | Có trong MVP |
| FR-DOC-06 | Xoá document (xoá cả file trên object storage) | Có trong MVP |
| FR-DOC-07 | Chặn upload trùng checksum trong cùng course | Có trong MVP |
| FR-DOC-08 | Trích xuất text từ PDF có lớp text, TXT, MD | Có trong MVP |
| FR-DOC-09 | Trích xuất PPTX, DOCX | Đã lên kế hoạch — chưa triển khai (officeparser, mammoth) |
| FR-DOC-10 | OCR cho PDF scan (không có lớp text) | Đã lên kế hoạch — hiện từ chối tường minh bằng `ScannedPdfNotSupportedError` |
| FR-DOC-11 | Trang danh sách tài liệu độc lập (ngoài trang course) | Đã lên kế hoạch |

Route thật: `POST /courses/:courseId/documents/upload-url`, `POST /documents/:id/confirm`,
`GET /courses/:courseId/documents`, `GET /documents/:id/download`,
`DELETE /documents/:id`.

Định dạng hỗ trợ thật hiện nay: `.pdf` (có lớp text), `.txt`, `.md`. `.pptx`/`.docx` nằm
trong whitelist phần mở rộng ở tầng validation nhưng **chưa có trình trích xuất** — không
quảng cáo "hỗ trợ đầy đủ 5 định dạng" ở bất kỳ nơi nào cho tới khi FR-DOC-09 hoàn tất.

### 4.d AI Lesson Generation — FR-AI `[SPEC §6.4]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-AI-01 | Tạo AI Job sinh bài học từ document đã trích xuất | Có trong MVP |
| FR-AI-02 | Xử lý theo pipeline: extract → chunk → outline → sinh Lesson → sinh Exercise/Question → validate (4 tầng) → lưu | Có trong MVP |
| FR-AI-03 | Hiển thị trạng thái tiến độ AI Job theo thời gian thực | Có trong MVP — hiện qua polling 2s, không phải SSE thật |
| FR-AI-04 | Cung cấp kênh SSE `/ai-jobs/:id/stream` cho tiến độ AI Job | Đang phát triển — endpoint tồn tại ở backend, frontend chưa dùng vì `EventSource` không gửi được header `Authorization` |
| FR-AI-05 | Huỷ AI Job đang chạy hoặc đang chờ | Có trong MVP |
| FR-AI-06 | Chạy lại (retry) AI Job thất bại, tối đa 3 lần | Có trong MVP |
| FR-AI-07 | Lưu một phần kết quả nếu chỉ một số Lesson lỗi (partialFailures), không fail toàn bộ job | Có trong MVP |
| FR-AI-08 | Đổi nhà cung cấp LLM qua biến môi trường (Anthropic / Google Gemini) | Có trong MVP |
| FR-AI-09 | Chạy AI job ở chế độ mock cho test/CI, không gọi LLM thật | Có trong MVP |
| FR-AI-10 | Nhận diện heading thật trong tài liệu (thay vì heuristic đơn giản) khi chunk | Đã lên kế hoạch |
| FR-AI-11 | Job định kỳ dọn AI Job treo, dead-letter queue | Đã lên kế hoạch |

Route thật: `POST /courses/:courseId/generate-lessons`, `GET /jobs`, `GET /jobs/:id`,
`POST /jobs/:id/cancel`, `GET /jobs/:id/stream`.

Hình 3. Sơ đồ pipeline xử lý AI Job (extract → chunk → outline → sinh Lesson → sinh
Exercise/Question → validate 4 tầng → lưu), đánh dấu điểm có thể partial-fail và điểm bị
chặn bởi `AI_JOB_MAX_COST_USD`.

### 4.e Interactive Learning — FR-LESSON `[SPEC §6.5]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-LESSON-01 | Xem danh sách Lesson của course, theo đúng thứ tự | Có trong MVP |
| FR-LESSON-02 | Mở một Lesson, hiển thị nội dung (`contentMd`) | Có trong MVP |
| FR-LESSON-03 | Bắt đầu học một Lesson (đánh dấu IN_PROGRESS) | Có trong MVP |
| FR-LESSON-04 | Sửa nội dung Lesson do AI sinh | Có trong MVP |
| FR-LESSON-05 | Sắp xếp lại thứ tự Lesson | Có trong MVP |
| FR-LESSON-06 | Xoá Lesson | Có trong MVP |
| FR-LESSON-07 | Hiển thị cảnh báo LOW_CONFIDENCE khi Lesson lệch khỏi tài liệu gốc | Có trong MVP |
| FR-LESSON-08 | Xem Exercise của Lesson, không lộ đáp án đúng trước khi nộp | Có trong MVP |
| FR-LESSON-09 | Nộp câu trả lời Exercise | Có trong MVP |
| FR-LESSON-10 | Chấm điểm tự động, trả về đúng/sai + giải thích | Có trong MVP, hỗ trợ 4 loại câu hỏi: MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER, FILL_BLANK |
| FR-LESSON-11 | Đánh dấu Lesson hoàn thành | Có trong MVP |

Route thật: `GET /courses/:courseId/lessons`, `GET /courses/:courseId/lessons/:lessonId`,
`POST /courses/:courseId/lessons/:lessonId/start`,
`PATCH /courses/:courseId/lessons/reorder`,
`PATCH /courses/:courseId/lessons/:lessonId`,
`DELETE /courses/:courseId/lessons/:lessonId`,
`GET /lessons/:lessonId/exercise`, `POST /lessons/:lessonId/exercise/submit`.

> Ghi chú kiến trúc: path Lesson/Exercise lồng dưới `/courses/:id/...` thay vì phẳng
> `/lessons/:id` như `HANDBOOK.md` §7.2 mô tả ban đầu — quyết định có chủ đích để tránh
> refactor lớn giữa lúc build frontend. Xem Open Question ở §8.d.

### 4.f Learning Progress — FR-PROGRESS `[SPEC §6.6]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-PROGRESS-01 | Lưu Lesson đã hoàn thành và kết quả Exercise | Có trong MVP |
| FR-PROGRESS-02 | Hiển thị tiến trình tổng quan (overview) của user | Có trong MVP |
| FR-PROGRESS-03 | Hiển thị tiến trình theo từng course | Có trong MVP |
| FR-PROGRESS-04 | Hiển thị lịch sử học tập cơ bản | Có trong MVP |
| FR-PROGRESS-05 | Bấm vào một dòng lịch sử để nhảy thẳng tới đúng bài học | Đang phát triển — lịch sử ghi đúng tên bài/course nhưng thiếu `courseId`/`lessonId` để điều hướng |
| FR-PROGRESS-06 | Phân trang cursor-based thật cho lịch sử (thay vì tăng limit) | Đã lên kế hoạch |

Route thật: `GET /progress/overview`, `GET /progress/courses`,
`GET /progress/course/:courseId`, `GET /progress/history`.

### 4.g Subscription & Billing — FR-SUB `[SPEC §6.7]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-SUB-01 | Hiển thị danh sách gói, giá, tính năng | Có trong MVP (Free, Pro; Team gắn nhãn Mở rộng tương lai, không có nút mua) |
| FR-SUB-02 | Gắn user với một subscription | Có trong MVP |
| FR-SUB-03 | Áp hạn mức theo gói: số course, số document/tháng, số trang/document, số AI Job/tháng | Có trong MVP, kiểm cả trước khi bắt đầu (402 QUOTA_EXCEEDED) lẫn tại thời điểm tăng bộ đếm (atomic) |
| FR-SUB-04 | Nâng cấp gói qua thanh toán demo (kích hoạt ngay, ghi Payment giả, UI cảnh báo rõ đây là demo) | Có trong MVP |
| FR-SUB-05 | Nâng cấp gói qua Stripe Checkout thật | Đã lên kế hoạch — code đường dẫn tồn tại (`BILLING_MODE=live`) nhưng Stripe SDK chưa bundle, trả lỗi tường minh nếu thiếu `STRIPE_SECRET_KEY` |
| FR-SUB-06 | Webhook Stripe xác minh chữ ký, chống xử lý trùng sự kiện | Đã lên kế hoạch — phụ thuộc FR-SUB-05 |
| FR-SUB-07 | Huỷ subscription | Có trong MVP |
| FR-SUB-08 | Xem mức sử dụng hiện tại so với hạn mức | Có trong MVP |

Route thật: `GET /plans`, `GET /subscription`, `GET /usage`,
`POST /subscription/checkout`, `POST /subscription/cancel`, `POST /webhooks/stripe`.

### 4.h Administration — FR-ADMIN `[SPEC §6.8]`

| ID | Yêu cầu | Trạng thái |
| --- | --- | --- |
| FR-ADMIN-01 | Xem danh sách user | Có trong MVP |
| FR-ADMIN-02 | Xem danh sách course | Có trong MVP |
| FR-ADMIN-03 | Xem danh sách và chi tiết AI Job (kèm GenerationRun, audit log) | Có trong MVP |
| FR-ADMIN-04 | Chạy lại AI Job từ trang admin | Có trong MVP |
| FR-ADMIN-05 | Xem trạng thái subscription toàn hệ thống | Có trong MVP |
| FR-ADMIN-06 | Xem chỉ số tổng quan (metrics) | Có trong MVP |
| FR-ADMIN-07 | Thao tác sửa/khoá/xoá user hoặc course từ trang admin | Ngoài phạm vi MVP — trang admin hiện chỉ đọc (read-only) theo đúng §6.8 spec |

Route thật: `GET /admin/metrics`, `GET /admin/users`, `GET /admin/courses`,
`GET /admin/subscriptions`, `GET /admin/ai-jobs`, `GET /admin/ai-jobs/:id`,
`POST /admin/ai-jobs/:id/retry`, `GET /admin/ai-jobs/:id/audit-log`.

Ngoài ra, **FR-SITE — Portfolio Website (Track A của spec gốc)** `[SPEC §8–§17]`: website
marketing/kỹ thuật giới thiệu sản phẩm. Yêu cầu chi tiết (site map, copy mẫu, tiêu chí DoD)
nằm trong `learnflow-ai-portfolio-agent-spec.md`. Trạng thái tổng quát: **Có trong MVP**,
nội dung/component/ADR/ảnh chụp/Lighthouse đã hoàn tất; còn thiếu video demo do ngoài phạm
vi công cụ hiện có.

---

## 5. Yêu cầu phi chức năng (Non-functional Requirements)

Áp dụng cho toàn hệ thống, không gắn với module cụ thể. Vi phạm bất kỳ mục nào dưới đây là
**lỗi chặn release**, không phải "nợ kỹ thuật có thể hoãn", trừ khi ghi chú khác.

### 5.a Security — NFR-SEC

| ID | Yêu cầu | Cơ chế bắt buộc |
| --- | --- | --- |
| NFR-SEC-01 | Mật khẩu không lưu dạng đọc được | argon2id (memoryCost=19456, timeCost=2, parallelism=1) |
| NFR-SEC-02 | Access token không sống lâu, không lộ qua XSS | JWT 15 phút, giữ trong memory phía client, **không** localStorage |
| NFR-SEC-03 | Refresh token chống đánh cắp lặp lại | Chuỗi ngẫu nhiên 256-bit, cookie httpOnly; Secure; SameSite=Lax, 30 ngày, chỉ lưu SHA-256 hash trong DB, xoay vòng mỗi lần dùng, phát hiện tái sử dụng → thu hồi cả `familyId` |
| NFR-SEC-04 | Không rò rỉ dữ liệu chéo user (IDOR) | Lọc quyền sở hữu (`ownerId`/`CourseMember`) bắt buộc ở **tầng repository**, không phải controller |
| NFR-SEC-05 | Đáp án đúng không rời server trước khi nộp bài | `correctAnswer`/`isCorrect` không xuất hiện trong payload GET Exercise trước submit |
| NFR-SEC-06 | Input ngoài hệ thống phải qua validation | Mọi input qua Zod (`packages/contracts`), TypeScript `strict: true`, không dùng `any` |
| NFR-SEC-07 | Upload file không tin dữ liệu client khai | Whitelist phần mở rộng, đối chiếu MIME, kiểm magic bytes ở worker sau khi tải về, giới hạn 25MB, giới hạn 300 trang (PDF scan 50 trang), checksum SHA-256 chặn trùng trong cùng Course |
| NFR-SEC-08 | Khoá lưu trữ object storage không đoán được | `courses/{courseId}/documents/{documentId}.{ext}`, không dùng tên file người dùng đặt, chỉ truy cập qua presigned URL hạn ngắn, bucket không public |
| NFR-SEC-09 | Không tin giá/trạng thái thanh toán từ frontend | Giá lấy từ Plan trong DB; trạng thái thanh toán chỉ cập nhật qua webhook đã xác minh chữ ký |
| NFR-SEC-10 | Không log/commit secret | `.env` không commit; secret không xuất hiện trong log ứng dụng |
| NFR-SEC-11 | Mọi endpoint yêu cầu xác thực trừ danh sách trắng | Ngoại lệ: `/auth/register`, `/auth/login`, `/auth/refresh`, `/plans`, `/health*`, `/webhooks/stripe` |

### 5.b Performance — NFR-PERF

| ID | Yêu cầu |
| --- | --- |
| NFR-PERF-01 | Trang marketing đạt Lighthouse Performance ≥ 90 |
| NFR-PERF-02 | Danh sách phân trang kiểu cursor-based (limit/cursor → items/nextCursor), không offset-based cho dữ liệu lớn |
| NFR-PERF-03 | Cập nhật trạng thái AIJob dùng update có điều kiện (chỉ update khi status hiện tại đúng như kỳ vọng) để tránh tranh chấp giữa nhiều worker |
| NFR-PERF-04 | Tăng bộ đếm hạn mức (UsageCounter) là thao tác nguyên tử (upsert cộng dồn), không đọc-rồi-ghi hai bước |

### 5.c Reliability

| ID | Yêu cầu |
| --- | --- |
| NFR-REL-01 | AI Job thất bại được retry tối đa 3 lần trước khi chuyển FAILED cuối cùng (FR-AI-06) |
| NFR-REL-02 | Một job vượt `AI_JOB_MAX_COST_USD` (mặc định $0.50) phải dừng và báo lỗi, không âm thầm tiếp tục chi tiêu (= NFR-AI-04) |
| NFR-REL-03 | Kết quả một phần (partial success) được lưu và hiển thị đúng, không coi là fail toàn phần khi chỉ một số Lesson lỗi (FR-AI-07) |
| NFR-REL-04 | Webhook thanh toán idempotent theo `(provider, eventId)` — xử lý trùng sự kiện không gây tác dụng phụ kép |
| NFR-REL-05 | Health/readiness endpoint phản ánh đúng trạng thái phụ thuộc (DB/Redis) — API khởi động được kể cả khi hạ tầng dev chưa bật, báo "degraded" thay vì crash |

### 5.d Usability & Accessibility — NFR-UX

| ID | Yêu cầu |
| --- | --- |
| NFR-UX-01 | Mọi màn hình có dữ liệu xử lý đủ **5 trạng thái**: Loading (skeleton đúng hình dạng nội dung) · Empty (mascot + câu giải thích + hành động) · Error (theo code lỗi + nút thử lại + requestId) · Partial (ví dụ AI Job sinh 5/7 bài vẫn hiển thị, không coi là fail toàn phần) · Success |
| NFR-UX-02 | AI Job có thêm trạng thái thứ 6 — **đang chạy**: mascot + thanh tiến độ + nhãn bước hiện tại |
| NFR-UX-03 | Không tràn ngang ở mọi bề rộng từ 320px |
| NFR-UX-04 | Tương phản văn bản ≥ 4.5:1 (chữ lớn ≥ 3:1) |
| NFR-UX-05 | Điều hướng đầy đủ bằng bàn phím, focus ring luôn thấy được |
| NFR-UX-06 | Tôn trọng `prefers-reduced-motion` |
| NFR-UX-07 | Chữ nhỏ nhất 14px trên mobile |

### 5.e AI Quality & Safety — NFR-AI

| ID | Yêu cầu |
| --- | --- |
| NFR-AI-01 | Output AI phải qua đủ 4 tầng validation trước khi lưu: Schema (Zod) → Luật nghiệp vụ → Bám nguồn (`sourceChunkIds` tồn tại thật + lấy mẫu đối chiếu thuật ngữ) → Vệ sinh dữ liệu (sanitize Markdown) |
| NFR-AI-02 | Lesson không đạt ngưỡng bám nguồn (dưới 50% thuật ngữ mẫu khớp) vẫn được lưu nhưng đánh dấu `LOW_CONFIDENCE`, UI phải hiển thị cảnh báo — không được im lặng bỏ qua hoặc giả vờ chắc chắn |
| NFR-AI-03 | Không gọi LLM thật trong CI — dùng chế độ mock (fixture cố định); record/live chỉ dùng dev/thủ công |
| NFR-AI-04 | Một job vượt `AI_JOB_MAX_COST_USD` (mặc định $0.50) phải dừng và báo lỗi, không âm thầm tiếp tục chi tiêu |
| NFR-AI-05 | Mỗi lần gọi LLM ghi lại `GenerationRun` (token, chi phí ước tính, độ trễ) — bắt buộc để admin theo dõi chi phí |

### 5.f Observability — NFR-OPS

| ID | Yêu cầu |
| --- | --- |
| NFR-OPS-01 | Mọi request có `X-Request-Id` (sinh nếu client không gửi), xuất hiện trong log |
| NFR-OPS-02 | Response rate-limit trả `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` |
| NFR-OPS-03 | POST tạo AIJob và thanh toán bắt buộc header `Idempotency-Key` |
| NFR-OPS-04 | Lỗi trả theo RFC 7807 (`type`, `title`, `status`, `code`, `detail`), `type` phải phản ánh đúng code thực tế cho mọi nhánh lỗi, kể cả lỗi không phải `ApiError` tự định nghĩa |

### 5.g Testing — NFR-TEST

| ID | Yêu cầu | Mục tiêu |
| --- | --- | --- |
| NFR-TEST-01 | Độ phủ dòng cho `apps/api` và `packages/ai` | ≥ 70% |
| NFR-TEST-02 | Bắt buộc có test cho: chấm điểm Exercise, 4 tầng validation AI, áp hạn mức (kể cả race condition), xoay vòng + phát hiện tái sử dụng refresh token, lọc quyền sở hữu repository (IDOR), idempotency webhook thanh toán, chuyển trạng thái AIJob, cắt chunk ở biên (tài liệu 1 trang/rỗng/300 trang) | Không được thiếu bất kỳ mục nào |
| NFR-TEST-03 | 8 kịch bản E2E bắt buộc (liệt kê đầy đủ ở §7.b) | Chạy mỗi PR vào main |

---

## 6. Dữ liệu và quy tắc nghiệp vụ

### 6.a Domain Entities

Nguồn sự thật là `packages/db/prisma/schema.prisma` — bảng dưới đây chỉ tóm tắt để đối
chiếu nhanh với FR ở §4, **không** thay thế việc đọc schema khi cần chi tiết field.

```text
User 1-N Course 1-N Document 1-N DocumentChunk
User 1-N Course 1-N Lesson 1-N Exercise 1-N Question 1-N AnswerOption
User 1-N Course (qua CourseMember, vai trò chia sẻ: OWNER/EDITOR/VIEWER)
Document 1-N AIJob 1-N GenerationRun
User 1-N LearningProgress (theo Lesson)
Exercise 1-N Submission 1-N SubmissionAnswer
User 1-N Subscription N-1 Plan
Subscription 1-N Payment; PaymentEvent độc lập (khoá theo provider+eventId)
User 1-N UsageCounter
Mọi hành động nhạy cảm ghi vào AuditLog
```

Hình 4. Sơ đồ ERD đầy đủ (entity-relationship diagram) của toàn bộ mô hình dữ liệu, gồm
khoá chính/khoá ngoại và các ràng buộc `@@unique`/`@@index` chính.

### 6.b Business Rules

Quy tắc nghiệp vụ không thể suy ra trực tiếp từ tên trường, phải đọc code/spec mới biết:

| Quy tắc | Áp dụng cho | Nguồn |
| --- | --- | --- |
| Một Document trùng checksum SHA-256 trong cùng Course bị chặn upload | Document | FR-DOC-07, NFR-SEC-07 |
| Đáp án đúng (`correctAnswer`/`isCorrect`) không bao giờ trả về client trước khi nộp bài | Question, AnswerOption | NFR-SEC-05 |
| Lesson có tỉ lệ khớp thuật ngữ nguồn dưới 50% vẫn lưu nhưng gắn `LessonConfidence.LOW`, không bị chặn | Lesson | NFR-AI-02 |
| Một AI Job vượt `AI_JOB_MAX_COST_USD` bị dừng giữa chừng, không tiếp tục chi tiêu | AIJob | NFR-AI-04 |
| AI Job thất bại được retry tự động tối đa 3 lần (`attempt` field), sau đó chuyển `FAILED` vĩnh viễn | AIJob | FR-AI-06 |
| Hạn mức gói (`UsageCounter`) kiểm tra **trước khi bắt đầu** thao tác (trả 402 `QUOTA_EXCEEDED`) và tăng bằng **thao tác nguyên tử** tại thời điểm dùng, không đọc-rồi-ghi | UsageCounter, Subscription | FR-SUB-03, NFR-PERF-04 |
| Refresh token bị dùng lại sau khi đã xoay vòng (tái sử dụng) → thu hồi toàn bộ `familyId`, buộc đăng nhập lại | RefreshToken | NFR-SEC-03 |
| Course/Document/Lesson dùng soft delete (`deletedAt`), không xoá cứng dữ liệu | Course, Document (file storage xoá thật), Lesson | §4.b, §4.c, §4.e |
| Giá và trạng thái thanh toán luôn đọc từ DB (Plan, Subscription), không bao giờ tin giá trị frontend gửi lên | Plan, Subscription, Payment | NFR-SEC-09 |
| Sự kiện webhook thanh toán khoá duy nhất theo `(provider, eventId)` — xử lý lại không gây hiệu ứng phụ kép | PaymentEvent | NFR-OPS-03, NFR-REL-04 |
| `AuditLog` ghi lại mọi hành động nhạy cảm (admin retry job, thay đổi subscription…) kèm `actorId`, `entityType`, `entityId` | AuditLog | FR-ADMIN-03 |

### 6.c State Transitions

Enum trạng thái và các đường chuyển hợp lệ (giá trị thật từ schema, không suy diễn):

| Entity | Chuỗi trạng thái | Ghi chú |
| --- | --- | --- |
| Course | `DRAFT → READY → ARCHIVED` | `ARCHIVED` không cho tạo Lesson/AI Job mới |
| Document | `PENDING → UPLOADED → EXTRACTING → EXTRACTED` hoặc `→ FAILED` ở bất kỳ bước xử lý nào | `FAILED` ghi kèm `errorCode`/`errorMessage`, có thể trigger lại qua AI Job mới |
| AIJob | `QUEUED → RUNNING → SUCCEEDED` hoặc `→ FAILED` hoặc `→ CANCELLED` (từ `QUEUED`/`RUNNING`) | `FAILED` có thể retry (tăng `attempt`, quay lại `QUEUED`) tối đa 3 lần |
| Lesson | `DRAFT → PUBLISHED`; độc lập, `LessonConfidence`: `UNKNOWN → HIGH` hoặc `→ LOW` (gán một lần khi AI sinh xong, không đổi sau đó trừ khi sinh lại) | |
| LearningProgress | `NOT_STARTED → IN_PROGRESS → COMPLETED` | Không lùi trạng thái tự động; `bestScore` chỉ tăng |
| Subscription | `TRIALING → ACTIVE ⇄ PAST_DUE`, mọi trạng thái `→ CANCELED` | `cancelAtPeriodEnd=true` giữ `ACTIVE` tới hết kỳ rồi mới chuyển `CANCELED` |

Hình 5. Sơ đồ chuyển trạng thái (state diagram) của Document.

Hình 6. Sơ đồ chuyển trạng thái (state diagram) của AIJob, gồm nhánh retry và huỷ.

Hình 7. Sơ đồ chuyển trạng thái (state diagram) của Lesson/LearningProgress theo một
Course.

Hình 8. Sơ đồ chuyển trạng thái (state diagram) của Subscription/Payment.

### 6.d Data Ownership & Access

- Mọi Course thuộc về đúng một `ownerId` (User); mọi Document/Lesson/AIJob truy vết ngược
  về một Course duy nhất. Không có dữ liệu "mồ côi" không có chủ sở hữu.
- Chia sẻ quyền truy cập chéo user chỉ qua bảng `CourseMember` (OWNER/EDITOR/VIEWER) — xem
  ma trận quyền ở §2.d. Không có cơ chế chia sẻ ở cấp Document hay Lesson riêng lẻ.
- **Lọc quyền sở hữu bắt buộc thực hiện ở tầng repository** (NFR-SEC-04), không phải ở
  controller hay service — mọi truy vấn danh sách/chi tiết phải nhận `userId` gọi và lọc
  trong cùng câu query, chống IDOR (đọc chéo dữ liệu user khác bằng cách đoán ID).
- Vai trò `ADMIN` được đọc **toàn bộ** dữ liệu hệ thống nhưng **không có quyền ghi** trên dữ
  liệu người dùng (FR-ADMIN-07) — ngoại lệ duy nhất là chạy lại AI Job (FR-ADMIN-04), có ghi
  `AuditLog`.
- `AuditLog.actorId` cho phép `null` (dùng `onDelete: SetNull`) để giữ lại lịch sử hành động
  ngay cả khi user thực hiện hành động đó đã bị xoá.

---

## 7. Tiêu chí nghiệm thu (Acceptance Criteria)

### 7.a Definition of Done `[SPEC §16, §17]`

Một yêu cầu FR/NFR được coi là **đạt** khi và chỉ khi:

1. Có thể tái hiện hành vi qua UI thật hoặc gọi API thật — không chỉ qua unit test cô lập.
2. Có test tự động bảo vệ hành vi đó ở tầng phù hợp (xem NFR-TEST-02 cho danh sách bắt
   buộc).
3. Trạng thái trong tài liệu này (Có trong MVP / khác) khớp với những gì `STATE.md` ghi
   nhận — không đánh dấu "Có trong MVP" nếu `STATE.md` còn liệt kê là dở dang.
4. Không vi phạm bất kỳ mục nào ở §5 (NFR) và ràng buộc nội dung dưới đây.

**Ràng buộc nội dung** `[SPEC §15]` — áp dụng cho mọi nơi hiển thị nội dung cho người dùng
cuối (UI, marketing, tài liệu công khai):

- Không claim hệ thống hiểu hoàn hảo mọi tài liệu.
- Không claim nội dung AI sinh không có lỗi.
- Không claim cá nhân hoá học tập được đảm bảo.
- Không claim thay thế giáo viên.
- Không claim độ tin cậy production-scale nếu chưa được chứng minh (chưa có tải thực tế,
  chưa có SLA đo được).
- Luôn phân biệt tính năng **đã có** và **dự kiến** bằng đúng 4 nhãn chuẩn — không dùng từ
  ngữ mơ hồ khác ("sắp ra mắt", "coming soon" không kèm nhãn chuẩn).
- Dùng thuật ngữ thống nhất theo §1.d — không đổi "Course" thành "khóa học"/"lớp học" lẫn
  lộn trong cùng ngữ cảnh, không đổi "AI Job" thành "tác vụ" chung chung khi nói về xử lý AI.

### 7.b Acceptance Test Scenarios

8 kịch bản E2E bắt buộc theo NFR-TEST-03, chạy mỗi PR vào `main`:

1. **Đăng ký → dashboard**: đăng ký tài khoản mới bằng email/mật khẩu hợp lệ → điều hướng
   đúng vào `/dashboard`, hiển thị trạng thái Empty (chưa có course).
2. **Rate limit đăng nhập sai**: nhập sai mật khẩu nhiều lần liên tiếp → hệ thống trả lỗi
   rate-limit đúng header (NFR-OPS-02), không cho thử vô hạn.
3. **Tạo course → upload → extract**: tạo course mới → tải một Document hợp lệ qua
   presigned URL → xác nhận upload → trạng thái Document chuyển đúng
   `PENDING→UPLOADED→EXTRACTING→EXTRACTED`.
4. **Chạy AI job → thấy tiến độ → thấy lesson**: kích hoạt sinh Lesson từ Document đã trích
   xuất → UI hiển thị đúng 6 trạng thái tiến độ (NFR-UX-02) → khi xong, danh sách Lesson
   hiển thị đúng nội dung sinh ra.
5. **Mở lesson → làm bài → nộp → thấy điểm**: mở một Lesson, làm Exercise, nộp bài → nhận
   đúng/sai + giải thích ngay, đáp án đúng không lộ trước khi nộp (NFR-SEC-05).
6. **Hoàn thành → tiến trình course tăng**: đánh dấu Lesson hoàn thành → tiến trình tổng
   quan và tiến trình theo course cập nhật đúng.
7. **Chạm hạn mức Free → thấy nâng cấp**: dùng hết hạn mức gói Free (ví dụ số AI Job/tháng)
   → nhận lỗi 402 `QUOTA_EXCEEDED` → UI hiển thị lời gọi nâng cấp gói, không phải lỗi chung
   chung.
8. **Admin xem AI Job list**: đăng nhập tài khoản `ADMIN` → xem đúng danh sách AI Job toàn
   hệ thống, có thể mở chi tiết một job (GenerationRun + audit log).

### 7.c MVP Acceptance Conditions

Toàn hệ thống được coi là đạt MVP khi:

1. Toàn bộ luồng lõi ở §3.d chạy được đầu-cuối qua UI thật.
2. Mọi hàng "Có trong MVP" ở §4 đều đạt tiêu chí Definition of Done (§7.a).
3. Toàn bộ 8 kịch bản E2E ở §7.b chạy xanh trên CI.
4. Không có NFR nào ở §5 bị vi phạm ở nhánh `main`.

Trạng thái tổng hợp hiện tại nằm ở `docs/progress/STATE.md` (mục "Tóm tắt nhanh") — không
lặp lại con số ở đây vì sẽ lệch nhanh theo thời gian.

---

## 8. Traceability & Change Management

### 8.a Requirement Traceability

Sơ đồ truy vết 3 tầng, mỗi ID đều lần được ngược tới nguồn và tiến được tới bằng chứng thực
thi:

```text
[SPEC] learnflow-ai-portfolio-agent-spec.md (§6.x, §15–§17)
   │  quy định nghiệp vụ gốc, không tự đổi
   ▼
FR-xxx / NFR-xxx  (docs/REQUIREMENTS.md — nguồn sự thật duy nhất cho ID + trạng thái)
   │  mỗi ID gắn với route thật + trạng thái 1 trong 4 nhãn chuẩn
   ▼
Route/Controller thật (apps/api/src/modules/**/*.controller.ts)
   +
Test tự động (NFR-TEST-02 danh sách bắt buộc, NFR-TEST-03 8 kịch bản E2E)
```

Bảng ánh xạ chi tiết từng ID → route thật → trạng thái nằm nguyên trong §4 (FR) và §5 (NFR)
của chính tài liệu này (đồng bộ 1:1 với `docs/REQUIREMENTS.md`) — không lặp lại thành bảng
riêng ở đây để tránh hai nguồn dễ lệch nhau.

Hình 9. Sơ đồ truy vết yêu cầu (traceability diagram) nối `[SPEC]` → FR/NFR → route API →
test tự động, minh hoạ bằng một ví dụ cụ thể (ví dụ FR-LESSON-08/09/10 → NFR-SEC-05 →
`GET /lessons/:lessonId/exercise` → test chấm điểm).

### 8.b Requirement Status

Thống kê nhanh theo 4 nhãn chuẩn (đếm tại thời điểm viết tài liệu — xem `STATE.md` cho số
mới nhất):

| Trạng thái | Ý nghĩa | Ví dụ |
| --- | --- | --- |
| **Có trong MVP** | Đã triển khai, có route thật, có test, chạy được qua UI | Phần lớn FR-AUTH, FR-COURSE, FR-LESSON |
| **Đang phát triển** | Có một phần (schema/endpoint/UI riêng lẻ) nhưng chưa nối hoàn chỉnh | FR-AUTH-07 (quên mật khẩu), FR-AI-04 (SSE), FR-COURSE-07 (chia sẻ course) |
| **Đã lên kế hoạch** | Có trong thiết kế/schema nhưng chưa bắt đầu triển khai | FR-DOC-09/10 (PPTX/DOCX/OCR), FR-SUB-05/06 (Stripe live) |
| **Mở rộng tương lai** | Cố ý ngoài phạm vi hiện tại, không lên lịch | Toàn bộ mục ở §3.b |

Quy tắc bắt buộc: không trình bày tính năng chưa làm như đã làm; đổi nhãn của một FR/NFR chỉ
được thực hiện tại `docs/REQUIREMENTS.md` khi trạng thái **thật sự** đổi, không phải khi bắt
đầu làm.

### 8.c Change History

Các quyết định/thay đổi lớn gần nhất ảnh hưởng tới yêu cầu (đầy đủ hơn ở
`docs/progress/STATE.md` mục "Quyết định / thay đổi gần nhất" và `docs/adr/*.md`):

| Ngày | Thay đổi | Ghi chú |
| --- | --- | --- |
| 2026-09-22 | Thêm nhà cung cấp LLM Google Gemini bên cạnh Anthropic (FR-AI-08) | `packages/ai/src/llm/gemini.ts` |
| 2026-09-19 | Redesign frontend 7 giai đoạn (cấu trúc học Duolingo, giữ nguyên bảng màu `[SPEC]` §14.2 và CircleMascot) | Token mới là bổ sung, không đổi giá trị `[SPEC]` |
| 2026-09-19 | ADR 006 — bật mascot động Blob Studio bằng `@ts-nocheck` phạm vi một file vendor | Tránh hạ `noUncheckedIndexedAccess` toàn repo |
| 2026-09-19 | ADR 007 — logo đổi thành nhân vật Circle | |
| 2026-09-19 | ADR 008 — đổi font chữ sang Be Vietnam Pro + JetBrains Mono | |
| 2026-09-15 | Đổi tên sản phẩm "LearnFlow AI" → "LEARN" | Đổi toàn diện package, hạ tầng, tài khoản demo, văn bản; giữ nguyên tên file `learnflow-ai-portfolio-agent-spec.md` |
| 2026-09-15 | ADR 005 — lọc quyền sở hữu bắt buộc ở tầng repository | Nền tảng cho NFR-SEC-04 |
| — | ADR 004 — webhook là nguồn sự thật cho trạng thái thanh toán | Nền tảng cho NFR-SEC-09 |
| — | ADR 003 — tách outline và sinh lesson thành hai bước trong pipeline AI | Ảnh hưởng FR-AI-02 |
| — | ADR 002 — cấu trúc monorepo (`apps/*`, `packages/*`) | Nền tảng cho §1.b |
| — | ADR 001 — TypeScript toàn bộ, `strict: true` | Nền tảng cho NFR-SEC-06 |

### 8.d Open Questions & Decisions

Câu hỏi/quyết định chưa chốt, cần giải quyết trước khi coi các FR liên quan là hoàn toàn đạt
Definition of Done (chi tiết đầy đủ ở `docs/progress/STATE.md` mục "Việc kế tiếp"):

| Câu hỏi mở | Ảnh hưởng | Trạng thái |
| --- | --- | --- |
| Path Lesson/Exercise lồng dưới `/courses/:id/...` thay vì phẳng `/lessons/:id` như `HANDBOOK.md` §7.2 — chốt giữ nguyên hay refactor? | FR-LESSON, hợp đồng API | Chưa chốt, quyết định tạm thời là giữ nguyên |
| Chuyển tiến độ AI Job từ polling 2s sang SSE thật — cần đổi `EventSource` sang `fetch`+`ReadableStream` để gửi được header `Authorization` | FR-AI-03/04 | Đang phát triển, chưa lên lịch cụ thể |
| Lỗi RFC 7807: nhánh fallback lỗi không phải `ApiError` hardcode sai `type` (`internal-error` cho cả 401/403) | NFR-OPS-04 | Đã xác định lỗi, chưa sửa |
| Hợp nhất nguồn nạp `.env` — hiện `apps/api`/`apps/worker` chỉ đọc `.env` tại cwd của từng app, không phải `.env` gốc repo như `HANDBOOK.md` §22 ngụ ý | Vận hành, không chặn chức năng | Chưa chốt cách hợp nhất |
| Đưa `scripts/audit-a11y.mjs` và integration test course/document/AI pipeline vào CI — cần Postgres service trong `ci.yml` | NFR-UX-04, NFR-TEST | Chưa có DB trong CI, phải chạy tay |
| 13 lỗi bảo mật transitive từ `npm audit` (multer không dùng, next/postcss, vitest, esbuild, prisma/deepmerge-ts) | NFR-SEC | Hoãn vì fix đều là breaking change, theo dõi khi lên version mới |

---

*Hết tài liệu. Khi một mục ở đây lệch với `docs/REQUIREMENTS.md` hoặc `docs/progress/STATE.md`,
hai tài liệu đó thắng — sửa ở nguồn trước rồi đồng bộ lại đây.*
