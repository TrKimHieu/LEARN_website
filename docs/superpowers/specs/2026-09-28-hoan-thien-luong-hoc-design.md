# Hoàn thiện luồng học: phân tích theo hành trình người dùng và thiết kế

Ngày: 2026-09-28 · Người quyết định: agent (người dùng giao "tự phân tích, lên kế hoạch và
implement") · Trạng thái: Đã chốt, đang triển khai.

## 1. Cách phân tích

Đi lại đúng luồng lõi `[SPEC]` (REQUIREMENTS §3.1) **trên code thật** (controller, service,
repository, worker, trang web), không dựa vào nhãn trong tài liệu. Mỗi chặng hỏi: người dùng
muốn làm gì, hệ thống có cho làm không, chỗ nào gãy hoặc âm thầm sai.

> Đăng ký/Đăng nhập → Tạo Course → Tải Document → Sinh Lesson bằng AI → Học Lesson →
> Làm Exercise → Theo dõi tiến trình

## 2. Phát hiện theo chặng

| #   | Chặng        | Phát hiện (đã kiểm trong code)                                                                                                                                                                                                                                                                                                  | Mức             |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| A1  | Tải tài liệu | Web gửi `mimeType: file.type \|\| 'application/octet-stream'`. Windows/Chrome trả `file.type` rỗng cho `.md` (thường cả `.txt` khi thiếu khoá registry) → API trả 415, người dùng không tải được Markdown. Presigned PUT ký kèm `ContentType` nhưng trình duyệt không gửi header đó khi `file.type` rỗng → nguy cơ lệch chữ ký. | Chặn luồng      |
| A2  | Tải tài liệu | DOCX/PPTX (FR-DOC-09) chưa trích xuất được. Bài toán `[SPEC]` §2.1 nói rõ người học có "PDF, slide, ghi chú" nhưng slide/Word không vào được.                                                                                                                                                                                   | Thiếu tính năng |
| B1  | Sinh bài     | Chunker không nhận heading: `headingPath` luôn null, chunk cắt ngang ranh giới mục; bước outline chỉ thấy 200 ký tự đầu mỗi chunk. Đo thật (phiên 20): tài liệu 6 mục chỉ ra 2 bài. (FR-AI-10)                                                                                                                                  | Chất lượng lõi  |
| B2  | Sinh bài     | Tầng 4 validation chạy `sanitize-html` lên **Markdown**: `a < b` thành `a &lt; b`, `List<String>` trong code bị xoá như thẻ HTML, `>` đầu dòng (blockquote) bị escape. Code trong bài học hỏng.                                                                                                                                 | Lỗi dữ liệu     |
| B3  | Sinh bài     | `params.difficulty` người dùng chọn không được đưa vào prompt.                                                                                                                                                                                                                                                                  | Lỗi nhỏ         |
| C1  | Học bài      | `Lesson.confidence` có trong DB nhưng API không trả, UI không hiện. REQUIREMENTS ghi FR-LESSON-07 "Có trong MVP" và NFR-AI-02 cấm "im lặng bỏ qua".                                                                                                                                                                             | Vi phạm spec    |
| C2  | Học bài      | Không có cách xem đoạn tài liệu gốc mà bài học dựa vào (`sourceChunkIds` chỉ là id). Người học không tự kiểm được bài AI sinh, nhất là bài LOW_CONFIDENCE.                                                                                                                                                                      | Thiếu tính năng |
| D1  | Luyện tập    | AI sinh 1–5 Exercise mỗi Lesson nhưng API chỉ đọc `findFirstForLesson`: Exercise thứ 2 trở đi **không bao giờ tới tay người học**.                                                                                                                                                                                              | Chặn luồng      |
| D2  | Luyện tập    | `SubmissionRepository.findBest` trả lượt **mới nhất** (sắp theo `attemptNo desc`), không phải lượt tốt nhất. UI ghi "điểm tốt nhất" nhưng hiển thị điểm lần cuối.                                                                                                                                                               | Lỗi dữ liệu     |
| E1  | Tiến trình   | Lịch sử không bấm được (thiếu `courseId`/`lessonId`) — FR-PROGRESS-05.                                                                                                                                                                                                                                                          | Thiếu tính năng |
| E2  | Tiến trình   | "Xem thêm" lịch sử tăng `limit` thay vì phân trang cursor — FR-PROGRESS-06, NFR-PERF-02.                                                                                                                                                                                                                                        | Nợ hợp đồng     |
| F1  | Tài khoản    | Quên mật khẩu (FR-AUTH-07) chỉ là màn hình báo "đang phát triển". Người quên mật khẩu mất tài khoản.                                                                                                                                                                                                                            | Thiếu tính năng |

Đã kiểm và **không** làm: RFC 7807 `type` sai (STATE next-action #18) — đã được sửa từ trước
(`problemType()` + test trong `apps/api/src/common/__tests__/errors.test.ts`), STATE ghi cũ.

## 3. Phạm vi

Làm tất cả A1–F1 ở trên, theo thứ tự: lỗi chặn luồng và vi phạm spec trước (A1, B2, C1, D1, D2),
sau đó tính năng hoàn thiện luồng (B1+B3, C2, E1+E2, A2, F1).

Ngoài phạm vi (giữ nhãn cũ): OCR PDF scan, SSE thật cho AI Job, chia sẻ Course, Stripe live,
xem lại một lượt nộp cũ (review submission), mọi thứ trong REQUIREMENTS §3.3.

Ràng buộc giữ nguyên: đáp án không rời server trước khi nộp; lọc quyền sở hữu ở repository;
Zod cho mọi input; không `any`; 5 trạng thái màn hình; giao diện đơn sắc v4 (ADR 015) — UI mới
chỉ dùng primitive có sẵn trong `components/ui`, không thêm màu.

## 4. Thiết kế

### A1. MIME theo phần mở rộng

- `packages/contracts`: thêm `DOCUMENT_TYPES` (bảng đuôi → MIME chuẩn) và `mimeFromFilename()`.
  Nguồn sự thật duy nhất cho cả web lẫn API.
- Web: MIME gửi lên = `mimeFromFilename(file.name)`; PUT lên presigned URL gửi kèm
  `Content-Type` đúng MIME đó (khớp chữ ký). `accept` của input lấy từ cùng bảng.
- API `requestUpload`: MIME chuẩn hoá = MIME theo đuôi file; từ chối nếu đuôi không nằm trong
  bảng, hoặc client khai MIME cụ thể khác MIME theo đuôi (bỏ qua khi client khai rỗng/
  `application/octet-stream`). Worker vẫn kiểm magic bytes (NFR-SEC-07 giữ nguyên).

### A2. DOCX/PPTX

- Thư viện: `mammoth` cho DOCX (HTML có heading thật → Markdown), `jszip` cho PPTX (đọc
  `ppt/slides/slideN.xml`, lấy chữ `<a:t>` theo đoạn `<a:p>`, placeholder `title`/`ctrTitle` →
  heading). Mỗi slide là một "trang" (`pageCount` = số slide, áp hạn mức trang như PDF).
- Magic bytes: `PK\x03\x04` + có `word/document.xml` (DOCX) hoặc `ppt/presentation.xml` (PPTX).
- Đầu ra đưa về Markdown có `#` heading để B1 dùng chung.

### B1. Chunk theo heading + outline bao phủ

- `packages/ai/chunker.ts`: hàm mới `chunkPages(pages, options)` — tách mỗi trang thành các mục
  theo heading Markdown (`#`…`######`) và heading suy luận cho văn bản PDF (dòng ngắn dạng
  "Chương 3…", "1.2 Tiêu đề", dòng VIẾT HOA ngắn). Ngăn xếp heading **mang qua các trang**,
  `headingPath` = "Cha > Con". Chunk không bao giờ vắt qua hai mục; mục rỗng (heading ngay sau
  heading) không sinh chunk; mục nhỏ hơn `minTokens` gộp vào chunk trước **chỉ khi cùng mục
  cha**. `chunkDocument` giữ nguyên chữ ký (worker và test cũ vẫn chạy).
- Outline `outline@2`: preview 400 ký tự, thêm luật "mỗi mục cấp cao phải được ít nhất một bài
  học bao phủ; không bỏ chunk nào có nội dung học được; gom mục quá nhỏ với mục kề".
- B3: `lesson@3` nhận `difficulty` và đặt độ khó bài tập theo đó.

### B2. Vệ sinh Markdown không phá code

Hàm thuần `sanitizeMarkdown()` thay `sanitize-html` cho `contentMd`: tách code fence
và inline code ra giữ nguyên văn; phần còn lại xoá khối `<script|style|iframe|object|embed>` kèm
nội dung, xoá mọi thẻ HTML thô (chỉ khi có dạng thẻ thật `<tag …>`/`</tag>`), vô hiệu link
`javascript:`/`data:`/`vbscript:`; không escape `<`, `>`, `&`. Client vẫn DOMPurify (lớp 2).

### C1. Hiện độ tin cậy

`lessonReadSchema` + `lessonSummarySchema` thêm `confidence: 'UNKNOWN'|'HIGH'|'LOW'`. Trang
đọc bài: khối cảnh báo khi `LOW` (chữ + icon, đơn sắc), dẫn tới phần Nguồn (C2). Danh sách bài
có nhãn "Cần kiểm tra". Sửa tay bài học không đổi confidence (vẫn là thông tin về bản gốc AI).

### C2. Nguồn của bài học

`GET /courses/:courseId/lessons/:lessonId/sources` → `{ sources: [{ chunkId, documentId,
filename, pageFrom, pageTo, headingPath, excerpt }] }`, lọc qua course sở hữu (repository),
chỉ lấy chunk thuộc document của chính course đó, `excerpt` cắt 1200 ký tự. Trang đọc bài: mục
"Nguồn trong tài liệu" thu gọn được, tải khi mở.

### D1 + D2. Nhiều bài tập mỗi bài học

- `GET /lessons/:lessonId/exercise?exerciseId=` (mặc định bài đầu). Response thêm
  `exercises: [{ id, title, orderIndex, difficulty, questionCount, bestScore, passed }]` để điều
  hướng. Vẫn không lộ đáp án.
- `POST /lessons/:lessonId/exercise/submit` body thêm `exerciseId?` (uuid; phải thuộc lesson).
- Hoàn thành Lesson: khi **mọi** Exercise của Lesson có ít nhất một lượt đạt `passScore`
  (tính trong cùng transaction nộp bài). Không hạ cấp COMPLETED đã có. `bestScore` Lesson giữ
  nghĩa cũ (điểm cao nhất).
- Response nộp bài thêm `lessonCompleted: boolean` để UI biết đã xong cả bài hay còn bài tập.
- `findBest` → sắp `score desc, attemptNo desc`.
- Web luyện tập: đọc `?exercise=`; thanh chọn "Bài tập 1/3"; màn kết quả có "Bài tập tiếp theo"
  khi còn bài tập chưa đạt.

### E1 + E2. Lịch sử

`historyItemSchema` thêm `courseId`, `lessonId`, `exerciseId`, `passed`. `GET
/progress/history?limit=&cursor=` → `{ items, nextCursor }`, cursor = id submission, thứ tự
`(createdAt desc, id desc)`. Web: `useInfiniteQuery`, mỗi dòng là link tới bài học.

### F1. Quên mật khẩu

- Bảng `PasswordResetToken { id, userId, tokenHash (unique), expiresAt, usedAt, createdAt }`
  (migration mới). Token 256-bit ngẫu nhiên, chỉ lưu SHA-256, hạn 30 phút, dùng một lần.
- `POST /auth/forgot-password { email }` → luôn 200 (không lộ email có tồn tại), rate limit
  theo IP + email. `POST /auth/reset-password { token, newPassword }` → đổi mật khẩu, đánh dấu
  token đã dùng, huỷ mọi token reset khác, **thu hồi mọi refresh token** của user, ghi AuditLog.
- Gửi thư qua `MailService`: `MAIL_MODE=log` (mặc định, dev: in đường link ra log API, không
  in ở production) hoặc `MAIL_MODE=smtp` (`nodemailer`, cấu hình `SMTP_URL`, `MAIL_FROM`).
  Ở production mà vẫn `log` thì thư không được gửi và đường dẫn KHÔNG được in (chỉ cảnh báo) —
  không chặn khởi động, để bản demo production không cần máy chủ thư vẫn chạy; `smtp` thiếu
  `SMTP_URL` thì chặn khởi động. Việc tạo token + gửi thư chạy nền để thời gian phản hồi không
  lộ email nào tồn tại. Token nằm ở `#fragment` của đường dẫn (không vào log máy chủ).
- Web: `/forgot-password` gửi thật; `/reset-password?token=` đặt mật khẩu mới.

## 5. Kiểm chứng

- Unit (vitest): MIME theo đuôi; `sanitizeMarkdown`; `chunkPages` (heading Markdown, heading
  PDF suy luận, mang qua trang, mục rỗng, gộp mục nhỏ); DOCX/PPTX → Markdown trên file mẫu tạo
  trong test; luật hoàn thành Lesson nhiều bài tập; token reset (băm, hết hạn, dùng một lần).
- `npm run typecheck`, `npm run test`, eslint, `npm run build -w apps/web`.
- End-to-end với hạ tầng thật (Docker đã chạy lại): tải `.md` và `.docx` → trích xuất → sinh bài
  (LLM mock) → đọc bài thấy nguồn/cảnh báo → làm bài tập 2 → tiến trình → lịch sử bấm được →
  quên mật khẩu → đặt lại → đăng nhập bằng mật khẩu mới.

## 6. Phát hiện thêm khi chạy đầu-cuối (đã sửa trong cùng đợt)

| #   | Phát hiện                                                                                                                                                                                                                                                                         | Sửa                                                                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| G1  | `POST /ai/courses/:id/generate-lessons` dùng `@Body(schema)` thay vì `@Body(zodBody(schema))`: Nest gọi `schema.transform(body)` (hàm tạo schema của Zod) nên body thành object schema — `documentIds`, `language`, `difficulty` bị bỏ qua âm thầm, job luôn sinh từ mọi tài liệu | Bọc `zodBody()`; soát toàn API không còn chỗ nào khác                                      |
| G2  | Câu trắc nghiệm AI sinh lưu đáp án `{ correctIndex }`, seed lưu `{ optionId }`, web chỉ đọc `optionId` → màn kết quả không bao giờ chỉ ra đáp án đúng cho bài AI sinh                                                                                                             | Server suy `{ optionId }` từ `AnswerOption.isCorrect` khi trả kết quả (chữa cả dữ liệu cũ) |
| G3  | LLM mock đặt tiêu đề theo 4 ký tự đầu chunk id (uuidv7 trùng tiền tố) → mọi bài trùng tiêu đề, bị loại; và chép cả JSON Schema ở đuôi prompt vào nội dung → mọi bài mock bị gắn LOW                                                                                               | Tiêu đề theo mục outline; cắt ở dòng chỉ dẫn trả về                                        |
| G4  | Người dùng không có chỗ chọn độ khó (web gửi `body: {}`)                                                                                                                                                                                                                          | Ô chọn cạnh nút sinh bài                                                                   |
| G5  | Chunk của tài liệu không phân trang (MD/TXT/DOCX) ghi `pageFrom=1` → UI hiện "trang 1"                                                                                                                                                                                            | Không ghi số trang khi `pageCount` null                                                    |
