# LEARN — Sổ tay triển khai kỹ thuật

> Tài liệu tham chiếu duy nhất cho đội phát triển. Mọi quyết định kỹ thuật, phạm vi,
> lịch trình và tiêu chí nghiệm thu của dự án đều nằm ở đây.

|                      |                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Phiên bản**        | 1.0                                                                                                                                      |
| **Cập nhật**         | 2026-09-13                                                                                                                               |
| **Trạng thái dự án** | Pre-implementation — mới có spec sản phẩm và mascot Circle                                                                               |
| **Nguồn ràng buộc**  | [`learnflow-ai-portfolio-agent-spec.md`](../learnflow-ai-portfolio-agent-spec.md), [`CircleMascot/README.md`](../CircleMascot/README.md) |

---

## Mục lục

|                                         |                                                         |                                                         |                                                       |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------- |
| [0. Cách đọc](#0-cách-đọc-tài-liệu-này) | [6. Mô hình dữ liệu](#6-mô-hình-dữ-liệu)                | [12. Frontend](#12-frontend-web-app)                    | [18. Quy ước kỹ thuật](#18-quy-ước-kỹ-thuật)          |
| [1. Tổng quan](#1-tổng-quan-dự-án)      | [7. API](#7-thiết-kế-api)                               | [13. Mascot Circle](#13-mascot-circle)                  | [19. Timeline & milestone](#19-timeline-và-milestone) |
| [2. Bối cảnh](#2-bối-cảnh-nghiệp-vụ)    | [8. AI Pipeline](#8-ai-pipeline)                        | [14. Portfolio website](#14-portfolio-website--track-a) | [20. Checklist](#20-checklist-triển-khai)             |
| [3. Phạm vi](#3-phạm-vi)                | [9. Background jobs](#9-background-jobs-và-queue)       | [15. Testing](#15-chiến-lược-kiểm-thử)                  | [21. Rủi ro](#21-rủi-ro-và-giảm-thiểu)                |
| [4. Kiến trúc](#4-kiến-trúc-hệ-thống)   | [10. Bảo mật](#10-authentication-và-bảo-mật)            | [16. DevOps](#16-devops-môi-trường-và-cicd)             | [22. Phụ lục](#22-phụ-lục)                            |
| [5. Tech stack](#5-technology-stack)    | [11. Subscription](#11-subscription-hạn-mức-và-billing) | [17. Observability](#17-observability-và-vận-hành)      |                                                       |

---

## 0. Cách đọc tài liệu này

Tài liệu dùng hai nhãn để phân biệt **điều bắt buộc** với **điều do đội kỹ thuật chọn**:

| Nhãn     | Ý nghĩa                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------- |
| `[SPEC]` | Ràng buộc lấy trực tiếp từ bản đặc tả sản phẩm. **Không tự ý đổi** — muốn đổi phải sửa spec trước. |
| `[QĐ]`   | Quyết định kỹ thuật của đội, kèm lý do. Đổi được, nhưng phải ghi lý do vào ADR (mục 18.4).         |

Nếu bạn chỉ có 15 phút: đọc mục **1**, **3**, **4.1**, **19**, **20**.
Nếu bạn sắp viết code: đọc thêm **5**, **6**, **7**, **18**.
Nếu bạn phụ trách AI pipeline: mục **8** là phần quan trọng nhất, đọc kèm **6.2** và **9**.

---

## 1. Tổng quan dự án

### 1.1 Sản phẩm

**LEARN** — _Turn your documents into interactive learning._

Nền tảng biến tài liệu học tập (PDF, slide bài giảng, tài liệu cá nhân) thành khóa học và
bài học tương tác bằng AI. Người dùng tải tài liệu vào một **Course**, AI phân tích rồi sinh ra
**Lesson**, **Exercise**, câu hỏi và feedback. Người học luyện tập qua trải nghiệm tương tác
lấy cảm hứng từ các ứng dụng học ngôn ngữ. `[SPEC]`

### 1.2 Hai deliverable — đừng nhầm lẫn

Đây là điểm gây hiểu nhầm nhiều nhất của dự án. Có **hai sản phẩm tách biệt**:

|                         | **Track A — Portfolio Website**                             | **Track B — Sản phẩm LEARN (MVP)**                  |
| ----------------------- | ----------------------------------------------------------- | --------------------------------------------------- |
| Là gì                   | Website giới thiệu sản phẩm + trình bày kiến trúc           | Ứng dụng học tập thật, chạy được                    |
| Đối tượng               | Khách hàng tiềm năng, nhà tuyển dụng, người review kỹ thuật | Người học                                           |
| Spec yêu cầu            | **Có** — đây là deliverable chính của bản spec              | Có, mô tả ở mục 6 của spec                          |
| Bắt buộc để spec "Done" | **Bắt buộc**                                                | Không bắt buộc chạy production, nhưng cần demo được |
| Ước lượng               | 2–3 tuần                                                    | 11–12 tuần                                          |

Track A **phụ thuộc** Track B ở một điểm: website phải có ảnh chụp UI thật hoặc mockup sát thật,
và **không được trình bày tính năng chưa làm như đã làm** `[SPEC]`. Vì vậy Track A chốt nội dung
sau khi Track B xong luồng lõi.

Nếu ngân sách thời gian eo hẹp, xem **lộ trình rút gọn ở mục 19.4**.

### 1.3 Trạng thái hiện tại của repo

```
C:\Projects\LEARN\
├── learnflow-ai-portfolio-agent-spec.md   Spec sản phẩm, 17 mục
├── CircleMascot/                           Mascot Circle — ĐÃ XONG
│   ├── CircleAvatar.tsx                     component React
│   ├── svg/states/                          40 trạng thái
│   ├── svg/expressions/                     25 biểu cảm
│   ├── svg/sprite.svg                       sprite cho HTML thuần
│   └── manifest.json                        danh sách state và biểu cảm
└── docs/HANDBOOK.md                        tài liệu này
```

**Chưa có dòng code ứng dụng nào.** Repo chưa được `git init`.

### 1.4 Từ điển thuật ngữ — dùng thống nhất mọi nơi `[SPEC]`

Thuật ngữ dưới đây phải giống nhau trong code, database, API, UI và nội dung marketing.
Không dùng từ đồng nghĩa.

| Thuật ngữ          | Định nghĩa                                               | Định danh trong code |
| ------------------ | -------------------------------------------------------- | -------------------- |
| **Course**         | Tập hợp tài liệu học của một chủ đề                      | `Course`             |
| **Document**       | File nguồn người dùng tải lên                            | `Document`           |
| **Chunk**          | Một đoạn văn bản cắt từ Document, đơn vị đầu vào cho LLM | `DocumentChunk`      |
| **Lesson**         | Một đơn vị bài học do AI sinh ra                         | `Lesson`             |
| **Exercise**       | Một hoạt động luyện tập thuộc Lesson                     | `Exercise`           |
| **Question**       | Một câu hỏi thuộc Exercise                               | `Question`           |
| **Submission**     | Một lần người học nộp bài cho Exercise                   | `Submission`         |
| **AI Job**         | Tác vụ bất đồng bộ do AI xử lý                           | `AIJob`              |
| **Generation Run** | Một lần gọi LLM trong phạm vi AI Job, có ghi chi phí     | `GenerationRun`      |
| **Subscription**   | Trạng thái gói của người dùng                            | `Subscription`       |
| **Plan**           | Gói dịch vụ và hạn mức kèm theo                          | `Plan`               |

Từ **cấm dùng** vì gây nhầm: "module" cho bài học (chỉ dùng cho khối backend), "lớp học"/"class",
"khóa" đứng một mình, "task" (dùng "job"), "quiz" (dùng "exercise").

---

## 2. Bối cảnh nghiệp vụ

### 2.1 Vấn đề `[SPEC]`

Người học có nhiều tài liệu — PDF, slide, ghi chép cá nhân — nhưng thiếu cách hiệu quả để biến
chúng thành trải nghiệm học có cấu trúc và tương tác.

Bốn biểu hiện cụ thể, phải nói rõ trên website, không được thay bằng ngôn ngữ marketing mơ hồ:

1. Tài liệu học bị phân mảnh, nằm rải rác nhiều nguồn.
2. Tài liệu tĩnh rất khó học chủ động — đọc xong không biết mình nhớ được gì.
3. Tự soạn bài học và bài tập từ tài liệu tốn rất nhiều thời gian.
4. Người học khó duy trì tiến độ ổn định vì thiếu cấu trúc và phản hồi.

Mục tiêu sản phẩm: chuyển người học từ **tiêu thụ nội dung thụ động** sang **học chủ động**.

### 2.2 Người dùng và user story

#### Learner — người dùng chính của MVP `[SPEC]`

Sinh viên, người tự học, người học ngoại ngữ, người ôn thi hoặc luyện chứng chỉ kỹ thuật.

| ID   | User story                                                                | Ưu tiên |
| ---- | ------------------------------------------------------------------------- | ------- |
| L-01 | Là người học, tôi muốn đăng ký và đăng nhập để dữ liệu học được lưu lại   | P0      |
| L-02 | Là người học, tôi muốn tạo Course để gom tài liệu cùng chủ đề             | P0      |
| L-03 | Là người học, tôi muốn tải PDF/slide lên Course                           | P0      |
| L-04 | Là người học, tôi muốn thấy tiến độ xử lý tài liệu theo thời gian thực    | P0      |
| L-05 | Là người học, tôi muốn AI sinh bài học có cấu trúc từ tài liệu của tôi    | P0      |
| L-06 | Là người học, tôi muốn đọc bài học và làm bài tập ngay trong đó           | P0      |
| L-07 | Là người học, tôi muốn biết mình đúng/sai câu nào và vì sao               | P0      |
| L-08 | Là người học, tôi muốn thấy tiến độ hoàn thành của từng Course            | P0      |
| L-09 | Là người học, tôi muốn xem lịch sử học của mình                           | P1      |
| L-10 | Là người học, tôi muốn biết mình còn bao nhiêu hạn mức trong gói hiện tại | P1      |
| L-11 | Là người học, tôi muốn làm lại một Exercise để cải thiện điểm             | P1      |
| L-12 | Là người học, tôi muốn nâng cấp gói khi chạm hạn mức                      | P1      |

#### Content Creator — người dùng phụ `[SPEC]`

Giáo viên, gia sư, người tạo khóa học. **Spec cho phép để ngoài MVP nếu phạm vi hạn chế.**

| ID   | User story                                                             | Ưu tiên      |
| ---- | ---------------------------------------------------------------------- | ------------ |
| C-01 | Là người tạo nội dung, tôi muốn xem lại và sửa bài học AI sinh ra      | P1           |
| C-02 | Là người tạo nội dung, tôi muốn sắp xếp lại thứ tự Lesson trong Course | P2           |
| C-03 | Là người tạo nội dung, tôi muốn chia sẻ Course cho người khác          | P3 — roadmap |

`[QĐ]` MVP làm **C-01 và C-02**, bỏ C-03.
Lý do: C-01 là cách trung thực nhất để xử lý việc AI sinh sai — thay vì hứa AI luôn đúng,
ta cho người dùng sửa. Đây cũng là điểm kỹ thuật đáng trình bày trên portfolio.

#### Administrator `[SPEC]`

| ID   | User story                                                   | Ưu tiên |
| ---- | ------------------------------------------------------------ | ------- |
| A-01 | Là quản trị viên, tôi muốn xem danh sách người dùng          | P0      |
| A-02 | Là quản trị viên, tôi muốn xem danh sách Course              | P0      |
| A-03 | Là quản trị viên, tôi muốn theo dõi AI Job và tỉ lệ thất bại | P0      |
| A-04 | Là quản trị viên, tôi muốn xem trạng thái subscription       | P0      |
| A-05 | Là quản trị viên, tôi muốn xem chi phí LLM theo thời gian    | P1      |
| A-06 | Là quản trị viên, tôi muốn chạy lại một AI Job thất bại      | P1      |

### 2.3 Giá trị sản phẩm `[SPEC]`

1. **Giảm thời gian chuẩn bị học** — không phải tự chuyển từng tài liệu thành bài học.
2. **Học chủ động** — tài liệu tĩnh trở thành câu hỏi và hoạt động luyện tập.
3. **Học có cấu trúc** — tài liệu được tổ chức thành Course → Lesson → Exercise.
4. **Theo dõi tiến trình** — hệ thống ghi lại bài đã xong, kết quả bài tập, lịch sử học.
5. **AI hỗ trợ học** — AI hỗ trợ chuyển đổi nội dung và sinh bài tập.
   **Không tuyên bố học cá nhân hóa hoàn toàn hay adaptive** trừ khi thực sự đã làm.
6. **Mô hình SaaS** — nhiều gói với hạn mức và tính năng khác nhau.

---

## 3. Phạm vi

### 3.1 Trong phạm vi MVP `[SPEC]`

Luồng lõi phải chạy thông suốt đầu-cuối:

```
Đăng ký/Đăng nhập → Tạo Course → Upload Document → AI sinh Lesson
  → Học Lesson → Làm Exercise → Theo dõi tiến trình
```

| #   | Nhóm chức năng      | Bắt buộc có                                                                                                             |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | **Authentication**  | Đăng ký, đăng nhập, đăng xuất, hồ sơ cơ bản, bảo vệ route                                                               |
| 2   | **Course**          | Tạo, liệt kê, xem chi tiết, đổi tên, xoá, gắn tài liệu                                                                  |
| 3   | **Document**        | Upload, hiển thị danh sách, lưu metadata, trạng thái xử lý, xử lý lỗi                                                   |
| 4   | **AI sinh bài học** | Tạo job, xử lý nội dung, sinh Lesson có cấu trúc, sinh Exercise, **validate output trước khi lưu**, hiển thị trạng thái |
| 5   | **Học tương tác**   | Mở bài, hiển thị nội dung, trả lời, nộp bài, hiện điểm, hiện feedback, đánh dấu hoàn thành                              |
| 6   | **Tiến trình**      | Lưu bài đã xong, lưu kết quả bài tập, hiện tiến độ Course, hiện lịch sử                                                 |
| 7   | **Subscription**    | Hiện gói, giá, tính năng; gắn user với subscription; **áp hạn mức**                                                     |
| 8   | **Admin**           | Xem user, xem course, xem AI job, xem trạng thái subscription                                                           |

> **Ràng buộc bảo mật `[SPEC]`:** Tuyệt đối không tin giá hay trạng thái thanh toán do
> frontend gửi lên. Xem mục 11.4.

### 3.2 Ngoài phạm vi MVP `[SPEC]`

Những mục sau là **roadmap**. Trên website phải gắn nhãn rõ, không trình bày như đã có:

- Adaptive learning nâng cao
- Lộ trình học cá nhân hóa hoàn toàn
- AI tutor có bộ nhớ hội thoại dài
- Social learning
- Marketplace khóa học công khai
- Ứng dụng mobile native
- Multi-tenancy doanh nghiệp
- Gamification phức tạp
- Thuật toán spaced repetition nâng cao
- Sửa khóa học cộng tác thời gian thực
- Huấn luyện foundation model riêng
- Analytics và hệ gợi ý phức tạp

### 3.3 Nguyên tắc nội dung — áp dụng cho cả UI lẫn marketing `[SPEC]`

**Phải cụ thể.**
Nên: _"Tải PDF lên và sinh ra bài học có cấu trúc kèm câu hỏi luyện tập."_
Tránh: _"Cách mạng hóa việc học với trí tuệ thế hệ mới."_

**Phân biệt rõ đã làm và sẽ làm.** Dùng đúng bốn nhãn: `Có trong MVP` · `Đang phát triển` ·
`Đã lên kế hoạch` · `Mở rộng tương lai`.

**Không phóng đại.** Không tuyên bố hệ thống hiểu hoàn hảo mọi tài liệu, sinh nội dung không lỗi,
đảm bảo cá nhân hóa, thay thế giáo viên, hay đạt độ tin cậy production khi chưa chứng minh.

**Không bịa số liệu**, không bịa logo khách hàng, không đưa tuyên bố hiệu năng không có đo đạc.

> **Cách thực thi:** thêm một dòng vào checklist review PR — _"Thay đổi này có tạo ra tuyên bố
> nào về sản phẩm mà code chưa làm được không?"_ Xem mục 18.5.

---

## 4. Kiến trúc hệ thống

### 4.1 Sơ đồ tổng thể

```
┌──────────────────────────────────────────────────────────────────┐
│  Trình duyệt                                                     │
│  ┌────────────────────────┐  ┌────────────────────────────────┐  │
│  │  Marketing site        │  │  Web app (đã đăng nhập)        │  │
│  │  Track A — portfolio   │  │  Track B — dashboard, học bài  │  │
│  └────────────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ HTTPS · JSON · SSE
                                  v
┌──────────────────────────────────────────────────────────────────┐
│  Backend API                                                     │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  │
│  │  Auth  │ │ Course │ │ Document │ │ Lesson │ │ Subscription │  │
│  └────────┘ └────────┘ └──────────┘ └────────┘ └──────────────┘  │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────────────┐  │
│  │ AI Orchestrator │ │ Progress     │ │ Admin                 │  │
│  └─────────────────┘ └──────────────┘ └───────────────────────┘  │
└───────┬──────────────────┬──────────────────┬────────────────────┘
        │                  │                  │
        v                  v                  v
┌───────────────┐  ┌───────────────┐  ┌────────────────────────────┐
│ PostgreSQL    │  │ Object Storage│  │ Redis  ── Job Queue        │
│ dữ liệu chính │  │ file gốc      │  │        ── cache · rate limit│
└───────────────┘  └───────────────┘  └───────────┬────────────────┘
                                                  │
                                                  v
                          ┌───────────────────────────────────────┐
                          │  AI Worker (tiến trình riêng)         │
                          │  1. Document Processing               │
                          │  2. Text Extraction / OCR             │
                          │  3. Chunking                          │
                          │  4. LLM Generation                    │
                          │  5. Output Validation                 │
                          │  6. Persist (transaction)             │
                          └──────┬───────────────────┬────────────┘
                                 │                   │
                                 v                   v
                       ┌──────────────────┐  ┌────────────────────┐
                       │  LLM Provider    │  │ PostgreSQL/Storage │
                       └──────────────────┘  └────────────────────┘

           ┌──────────────────────┐
           │  Payment Provider    │ ──webhook──> Backend API (/webhooks)
           └──────────────────────┘
```

Sơ đồ này là bản chuẩn `[SPEC]` — website ở Track A phải vẽ lại đúng các thành phần này:
Frontend Web App, Backend API, Auth Module, Course Module, Document Module, AI Orchestrator,
Background Worker, Queue/Redis, PostgreSQL, Object Storage, LLM Provider, Payment Provider.

### 4.2 Thành phần và trách nhiệm

| Thành phần            | Trách nhiệm                                                           | Không làm gì                                                |
| --------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Frontend Web App**  | Render UI, quản lý phiên, hiển thị tiến độ, xác thực form phía client | Không tính điểm, không quyết định hạn mức, không giữ secret |
| **Backend API**       | Xác thực, phân quyền, CRUD, áp hạn mức, tạo job, chấm điểm            | Không gọi LLM trực tiếp trong request HTTP                  |
| **AI Orchestrator**   | Tạo và theo dõi AIJob, quyết định tham số sinh, ghi chi phí           | Không tự xử lý file — đẩy vào queue                         |
| **Job Queue (Redis)** | Hàng đợi job, retry, backoff, dead-letter                             | Không lưu dữ liệu lâu dài                                   |
| **AI Worker**         | Trích xuất, chunk, gọi LLM, validate, ghi DB                          | Không nhận request HTTP từ người dùng                       |
| **PostgreSQL**        | Nguồn sự thật của toàn bộ dữ liệu nghiệp vụ                           | Không lưu file nhị phân                                     |
| **Object Storage**    | File gốc, raw response của LLM, ảnh export                            | Không là nguồn sự thật về metadata                          |
| **LLM Provider**      | Sinh outline, lesson, exercise theo JSON schema                       | —                                                           |
| **Payment Provider**  | Thanh toán, quản lý chu kỳ, gửi webhook                               | —                                                           |

**Nguyên tắc ranh giới quan trọng nhất:** request HTTP của người dùng **không bao giờ** chờ LLM.
Mọi việc gọi LLM đều đi qua queue. Đây là lý do tồn tại của toàn bộ tầng worker.

### 4.3 Ba luồng dữ liệu chính

**Luồng 1 — Upload tài liệu**

```
Client  --POST /documents/upload-url-->  API
        <--presigned URL + documentId--
        --PUT file (trực tiếp)-------->  Object Storage
        --POST /documents/:id/confirm->  API  -- enqueue: extract -->  Queue
                                                                        │
Worker <--------------------------------------------------------------- ┘
  tải file → xác minh checksum + magic bytes → trích text → chunk → ghi DB
  → cập nhật Document.status = EXTRACTED → publish event
```

Upload đi thẳng lên object storage bằng presigned URL, **không qua API**. Lý do: tránh giữ
file lớn trong tiến trình Node, tránh timeout, và giảm chi phí băng thông tầng API.

**Luồng 2 — Sinh bài học**

```
Client --POST /courses/:id/generate--> API
   API: kiểm tra quota → tạo AIJob(QUEUED) → trả 202 + jobId
   Client mở SSE /ai-jobs/:id/stream
   Queue → Worker:
       outline (1 lần gọi LLM)
         → với mỗi node: lesson + exercise (n lần gọi, chạy song song có giới hạn)
         → validate từng output
         → ghi toàn bộ trong MỘT transaction
       cập nhật progress sau mỗi bước → SSE đẩy về client
```

**Luồng 3 — Làm bài và chấm điểm**

```
Client --POST /exercises/:id/submit--> API
   API: lấy đáp án đúng TỪ DATABASE (không tin client)
        → chấm → tạo Submission + SubmissionAnswer
        → cập nhật LearningProgress
        → trả điểm + feedback + giải thích
```

### 4.4 Cấu trúc monorepo `[QĐ]`

```
learn/
├── apps/
│   ├── web/                  Next.js — marketing site + web app
│   ├── api/                  NestJS — REST API
│   └── worker/               NestJS standalone — AI worker
├── packages/
│   ├── db/                   Prisma schema, migration, seed, client
│   ├── contracts/            Zod schema dùng chung API ↔ web ↔ worker
│   ├── ai/                   Prompt, JSON schema, adapter LLM, validator
│   ├── ui/                   Component dùng chung + design token
│   └── config/               eslint, tsconfig, tailwind preset dùng chung
├── CircleMascot/               ĐÃ CÓ — component React + sprite HTML
├── docs/
│   ├── HANDBOOK.md           tài liệu này
│   ├── adr/                  Architecture Decision Records
│   └── screenshots/          ảnh UI thật dùng cho portfolio
├── infra/
│   ├── docker-compose.yml    postgres · redis · minio cho môi trường dev
│   └── Dockerfile.*          image cho api · worker · web
└── .github/workflows/        CI
```

Lý do dùng monorepo: `packages/contracts` cho phép một Zod schema duy nhất vừa validate request
ở API, vừa suy ra kiểu TypeScript ở frontend, vừa validate output LLM ở worker. Nếu tách repo,
ba nơi này sẽ trôi lệch nhau — và đó chính là loại lỗi khó thấy nhất trong hệ thống có AI.

---

## 5. Technology Stack

Spec ghi rõ stack là **khuyến nghị, không bắt buộc** `[SPEC]`. Dưới đây là stack đội đã chốt.

### 5.1 Bảng quyết định

| Tầng          | Chọn `[QĐ]`                                                            | Phiên bản | Lý do                                                                                        |
| ------------- | ---------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| Frontend      | **Next.js (App Router) + TypeScript**                                  | 15.x      | SSR cho marketing site tốt SEO, cùng ngôn ngữ với backend                                    |
| CSS           | **Tailwind CSS**                                                       | 4.x       | Spec khuyến nghị; token màu map thẳng từ bảng màu spec — đơn sắc trắng → đen (ADR 015; trước là navy/xám/sky) |
| Data fetching | **TanStack Query**                                                     | 5.x       | Spec khuyến nghị; xử lý cache và polling job gọn                                             |
| Backend       | **NestJS + TypeScript**                                                | 11.x      | Cấu trúc module rõ ràng, map 1-1 với các module trong spec                                   |
| ORM           | **Prisma**                                                             | 6.x       | Migration tường minh, kiểu sinh tự động                                                      |
| Database      | **PostgreSQL**                                                         | 16        | Spec yêu cầu                                                                                 |
| Queue         | **Redis + BullMQ**                                                     | Redis 7   | Spec khuyến nghị; cùng ngôn ngữ với API                                                      |
| Storage       | **S3-compatible** — MinIO khi dev, S3/R2 khi deploy                    | —         | Spec yêu cầu                                                                                 |
| LLM           | **Claude (Anthropic API)** — Sonnet cho sinh nội dung                  | —         | Structured output ổn định; xem 5.3                                                           |
| Validation    | **Zod**                                                                | 4.x       | Một schema dùng cho cả API input lẫn LLM output                                              |
| Auth          | **JWT tự triển khai** (access + refresh)                               | —         | Xem 10.1                                                                                     |
| Billing       | **Stripe Checkout + Webhook**, có DEMO mode                            | —         | Spec cho phép tích hợp thật hoặc demo có kiểm soát                                           |
| Test          | **Vitest** (unit) + **Supertest** (integration) + **Playwright** (E2E) | —         | —                                                                                            |
| Container     | **Docker + docker-compose**                                            | —         | Spec yêu cầu                                                                                 |
| CI/CD         | **GitHub Actions**                                                     | —         | —                                                                                            |

### 5.2 Vì sao TypeScript toàn bộ thay vì Python cho worker

Spec cho chọn NestJS/TS **hoặc** FastAPI/Python `[SPEC]`. Đội chọn TypeScript vì:

- Một ngôn ngữ cho cả ba app → `packages/contracts` chia sẻ được kiểu, không cần sinh client.
- Bài toán chính là điều phối I/O (tải file, gọi LLM, ghi DB), không phải tính toán số nặng —
  Node hoàn toàn đủ.
- Ít công cụ hơn nghĩa là CI nhanh hơn và ít thứ hỏng hơn cho một dự án portfolio.

**Đánh đổi đã biết:** hệ sinh thái xử lý PDF của Python (PyMuPDF, `unstructured`) mạnh hơn Node.

**Lối thoát khi cần:** nếu chất lượng trích xuất PDF trở thành nút thắt (đo bằng tiêu chí ở 8.2),
tách riêng một service Python nhỏ chỉ làm mỗi việc parse, giao tiếp qua HTTP nội bộ.
Ranh giới đã được thiết kế sẵn cho việc này — worker gọi `DocumentParser` qua interface,
không gọi thư viện trực tiếp. Ghi ADR khi đổi.

### 5.3 Chọn model LLM `[QĐ]`

| Việc                   | Model                                          | Lý do                                                               |
| ---------------------- | ---------------------------------------------- | ------------------------------------------------------------------- |
| Sinh outline khóa học  | Claude Sonnet 5 (`claude-sonnet-5`)            | Cần suy luận cấu trúc tốt, chạy 1 lần/job nên chi phí không đáng kể |
| Sinh lesson + exercise | Claude Sonnet 5                                | Chất lượng nội dung là yếu tố quyết định của sản phẩm               |
| Phân loại/gắn nhãn nhẹ | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Rẻ, nhanh, đủ dùng cho việc đơn giản                                |

Tên model đặt trong biến môi trường (`LLM_MODEL_GENERATION`, `LLM_MODEL_FAST`), **không hardcode**.
Cấu hình đang chạy thật: OpenAI `gpt-6-luna` kèm model dự phòng `LLM_MODEL_FALLBACK` — xem ADR 009, 010.
Adapter LLM đặt sau interface `LlmProvider` để đổi nhà cung cấp mà không sửa pipeline.

---

## 6. Mô hình dữ liệu

### 6.1 Sơ đồ quan hệ

```
User 1─────N Course 1─────N Document 1─────N DocumentChunk
 │            │                  │
 │            │                  └──N AIJob 1──N GenerationRun
 │            │
 │            └──N Lesson 1──N Exercise 1──N Question 1──N AnswerOption
 │                   │                          │
 │                   │                          └──N SubmissionAnswer
 │                   │                                     │
 ├──N LearningProgress ────────────────────────┐           │
 │                                             │           │
 ├──N Submission ──────────────────────────────┴───────────┘
 │
 ├──N Subscription N─────1 Plan
 │        │
 │        └──N Payment
 ├──N UsageCounter
 ├──N RefreshToken
 └──N AuditLog

PaymentEvent  (độc lập — log webhook, dùng để chống xử lý trùng)
CourseMember  (roadmap — chuẩn bị sẵn bảng, chưa dùng trong MVP)
```

Các quan hệ bắt buộc theo spec `[SPEC]`: User 1─N Course · Course 1─N Document ·
Course 1─N Lesson · Lesson 1─N Exercise · User 1─N LearningProgress · User 1─N Subscription ·
Subscription N─1 Plan · Document 1─N AIJob.

### 6.2 Định nghĩa bảng

Viết theo cú pháp Prisma. Mọi bảng đều có `id` kiểu UUID v7 `[QĐ]` — sắp xếp được theo thời gian
nên index B-tree không bị phân mảnh như UUID v4.

```prisma
// ─── Người dùng và phiên ────────────────────────────────────────────

model User {
  id              String    @id @default(uuid(7))
  email           String    @unique                 // lưu lowercase
  passwordHash    String                            // argon2id
  displayName     String
  role            UserRole  @default(LEARNER)
  locale          String    @default("vi")
  emailVerifiedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?                         // soft delete
}

enum UserRole { LEARNER ADMIN }

model RefreshToken {
  id        String    @id @default(uuid(7))
  userId    String
  tokenHash String    @unique                       // SHA-256, KHÔNG lưu token thô
  familyId  String                                  // phát hiện tái sử dụng token
  expiresAt DateTime
  revokedAt DateTime?
  userAgent String?
  ipAddress String?
  createdAt DateTime  @default(now())

  @@index([userId, familyId])
}

// ─── Khóa học và tài liệu ───────────────────────────────────────────

model Course {
  id          String       @id @default(uuid(7))
  ownerId     String
  title       String                                // 1–200 ký tự
  description String?
  language    String       @default("vi")
  status      CourseStatus @default(DRAFT)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  deletedAt   DateTime?

  @@index([ownerId, deletedAt, updatedAt])
}

enum CourseStatus { DRAFT READY ARCHIVED }

model Document {
  id             String         @id @default(uuid(7))
  courseId       String
  uploaderId     String
  filename       String
  mimeType       String
  sizeBytes      Int
  storageKey     String         @unique             // khóa trên object storage
  checksumSha256 String
  pageCount      Int?
  status         DocumentStatus @default(PENDING)
  errorCode      String?                            // mã lỗi ổn định, xem 7.3
  errorMessage   String?                            // thông điệp cho người dùng
  extractedAt    DateTime?
  createdAt      DateTime       @default(now())

  @@index([courseId, status])
  @@index([courseId, checksumSha256])               // phát hiện upload trùng
}

enum DocumentStatus { PENDING UPLOADED EXTRACTING EXTRACTED FAILED }

model DocumentChunk {
  id          String   @id @default(uuid(7))
  documentId  String
  index       Int                                   // thứ tự trong tài liệu, từ 0
  content     String   @db.Text
  tokenCount  Int
  pageFrom    Int?
  pageTo      Int?
  headingPath String?                               // "Chương 2 > 2.1 > Định nghĩa"
  createdAt   DateTime @default(now())

  @@unique([documentId, index])
  @@index([documentId])
  // embedding vector(1536) — ROADMAP, thêm khi làm RAG. Không tạo cột rỗng ở MVP.
}

// ─── AI ─────────────────────────────────────────────────────────────

model AIJob {
  id             String     @id @default(uuid(7))
  courseId       String
  documentId     String?                            // null = sinh từ cả Course
  requestedById  String
  type           AIJobType
  status         AIJobStatus @default(QUEUED)
  progress       Int         @default(0)            // 0–100
  progressLabel  String?                            // "Đang sinh bài 3/7"
  attempt        Int         @default(0)
  idempotencyKey String      @unique                // chống tạo job trùng
  inputParams    Json                               // lessonCount, difficulty, language...
  error          Json?                              // { code, message, detail }
  queuedAt       DateTime    @default(now())
  startedAt      DateTime?
  finishedAt     DateTime?

  @@index([courseId, status])
  @@index([status, queuedAt])
}

enum AIJobType   { EXTRACT_DOCUMENT GENERATE_LESSONS REGENERATE_LESSON }
enum AIJobStatus { QUEUED RUNNING SUCCEEDED FAILED CANCELLED }

model GenerationRun {
  id               String   @id @default(uuid(7))
  aiJobId          String
  step             String                           // "outline" | "lesson" | "exercise"
  model            String
  promptVersion    String                           // "outline@3"
  inputTokens      Int
  outputTokens     Int
  costUsd          Decimal  @db.Decimal(10, 6)
  latencyMs        Int
  attempt          Int      @default(1)
  rawResponseKey   String?                          // object storage, giữ 30 ngày
  validationReport Json?                            // lỗi validate nếu có
  createdAt        DateTime @default(now())

  @@index([aiJobId])
  @@index([createdAt])                              // báo cáo chi phí
}

// ─── Nội dung học ───────────────────────────────────────────────────

model Lesson {
  id               String       @id @default(uuid(7))
  courseId         String
  documentId       String?
  aiJobId          String?                          // null = người dùng tự tạo
  orderIndex       Int
  title            String
  summary          String?
  contentMd        String       @db.Text            // Markdown đã làm sạch
  estimatedMinutes Int?
  status           LessonStatus @default(DRAFT)
  sourceChunkIds   String[]                         // truy vết về tài liệu gốc
  editedByUserAt   DateTime?                        // đánh dấu người dùng đã sửa
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt
  deletedAt        DateTime?

  @@unique([courseId, orderIndex])
  @@index([courseId, status])
}

enum LessonStatus { DRAFT PUBLISHED }

model Exercise {
  id             String       @id @default(uuid(7))
  lessonId       String
  orderIndex     Int
  title          String?
  instruction    String?
  difficulty     Difficulty   @default(MEDIUM)
  passScore      Int          @default(70)          // phần trăm để tính là đạt
  createdAt      DateTime     @default(now())

  @@unique([lessonId, orderIndex])
}

enum Difficulty { EASY MEDIUM HARD }

model Question {
  id             String       @id @default(uuid(7))
  exerciseId     String
  orderIndex     Int
  type           QuestionType
  prompt         String       @db.Text
  explanation    String?      @db.Text             // hiện SAU khi nộp
  correctAnswer  Json                              // hình dạng tùy type — KHÔNG gửi ra client trước khi nộp
  points         Int          @default(1)
  sourceChunkId  String?
  createdAt      DateTime     @default(now())

  @@unique([exerciseId, orderIndex])
}

enum QuestionType { MULTIPLE_CHOICE TRUE_FALSE SHORT_ANSWER FILL_BLANK }

model AnswerOption {
  id         String  @id @default(uuid(7))
  questionId String
  orderIndex Int
  label      String                                 // "A" | "B" ...
  content    String
  isCorrect  Boolean                                // KHÔNG serialize ra client trước khi nộp

  @@unique([questionId, orderIndex])
}

// ─── Tiến trình học ─────────────────────────────────────────────────

model LearningProgress {
  id          String         @id @default(uuid(7))
  userId      String
  courseId    String
  lessonId    String
  status      ProgressStatus @default(NOT_STARTED)
  bestScore   Int?                                  // phần trăm
  attempts    Int            @default(0)
  startedAt   DateTime?
  completedAt DateTime?
  updatedAt   DateTime       @updatedAt

  @@unique([userId, lessonId])
  @@index([userId, courseId])
}

enum ProgressStatus { NOT_STARTED IN_PROGRESS COMPLETED }

model Submission {
  id         String   @id @default(uuid(7))
  userId     String
  exerciseId String
  attemptNo  Int
  score      Int                                    // phần trăm, 0–100
  maxScore   Int
  durationMs Int?
  createdAt  DateTime @default(now())

  @@unique([userId, exerciseId, attemptNo])
  @@index([userId, createdAt])                      // lịch sử học
}

model SubmissionAnswer {
  id           String  @id @default(uuid(7))
  submissionId String
  questionId   String
  rawAnswer    Json
  isCorrect    Boolean
  pointsEarned Int
  feedback     String?

  @@unique([submissionId, questionId])
}

// ─── Gói dịch vụ và thanh toán ──────────────────────────────────────

model Plan {
  id            String   @id @default(uuid(7))
  code          String   @unique                    // "FREE" | "PRO"
  name          String
  description   String?
  priceCents    Int                                 // NGUỒN SỰ THẬT về giá
  currency      String   @default("USD")
  interval      String   @default("month")
  limits        Json                                // xem 11.2
  features      String[]
  isActive      Boolean  @default(true)
  displayOrder  Int      @default(0)
  providerPriceId String?                           // stripe price id
}

model Subscription {
  id                     String             @id @default(uuid(7))
  userId                 String
  planId                 String
  status                 SubscriptionStatus @default(ACTIVE)
  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime
  cancelAtPeriodEnd      Boolean            @default(false)
  providerCustomerId     String?
  providerSubscriptionId String?            @unique
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  @@index([userId, status])
}

enum SubscriptionStatus { TRIALING ACTIVE PAST_DUE CANCELED }

model Payment {
  id                String   @id @default(uuid(7))
  subscriptionId    String
  amountCents       Int
  currency          String
  status            String                          // succeeded | failed | refunded
  providerPaymentId String   @unique
  paidAt            DateTime?
  createdAt         DateTime @default(now())
}

model PaymentEvent {
  id           String    @id @default(uuid(7))
  provider     String                               // "stripe"
  eventId      String                               // id bên nhà cung cấp
  type         String
  payload      Json
  receivedAt   DateTime  @default(now())
  processedAt  DateTime?
  processError String?

  @@unique([provider, eventId])                     // CHỐNG XỬ LÝ TRÙNG
}

model UsageCounter {
  id     String @id @default(uuid(7))
  userId String
  period String                                     // "2026-09"
  metric UsageMetric
  value  Int    @default(0)

  @@unique([userId, period, metric])
}

enum UsageMetric { COURSES_CREATED DOCUMENTS_UPLOADED PAGES_PROCESSED AI_JOBS_RUN LLM_TOKENS }

// ─── Vận hành ───────────────────────────────────────────────────────

model AuditLog {
  id         String   @id @default(uuid(7))
  actorId    String?
  action     String                                 // "course.delete"
  entityType String
  entityId   String
  metadata   Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([actorId, createdAt])
}

// ─── Roadmap — tạo bảng trước, chưa dùng ────────────────────────────

model CourseMember {
  id       String           @id @default(uuid(7))
  courseId String
  userId   String
  role     CourseMemberRole @default(VIEWER)
  addedAt  DateTime         @default(now())

  @@unique([courseId, userId])
}

enum CourseMemberRole { OWNER EDITOR VIEWER }
```

### 6.3 Quy tắc dữ liệu bắt buộc

| Quy tắc                                                                                                        | Vì sao                                                                    |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Question.correctAnswer` và `AnswerOption.isCorrect` **không bao giờ** rời server trước khi người dùng nộp bài | Người dùng mở DevTools là thấy đáp án. Dùng DTO riêng cho hai chế độ đọc. |
| `Plan.priceCents` là nguồn sự thật về giá                                                                      | `[SPEC]` không tin giá do frontend gửi                                    |
| Xoá Course và User dùng **soft delete**; Document, Lesson xoá cứng theo cascade                                | Cho phép khôi phục nhầm lẫn; tránh dữ liệu mồ côi                         |
| `PaymentEvent` phải ghi **trước khi** xử lý webhook                                                            | Nhà cung cấp có thể gửi lại cùng một sự kiện                              |
| Ghi Lesson của một AIJob trong **một transaction duy nhất**                                                    | Sinh nửa vời để lại Course hỏng, khó dọn                                  |
| Mọi truy vấn danh sách phải lọc theo `ownerId` ở tầng repository                                               | Chống IDOR — xem 10.4                                                     |

### 6.4 Migration và seed

- Mỗi thay đổi schema là một migration Prisma có tên mô tả: `20260920_add_usage_counter`.
- **Không sửa migration đã merge.** Sai thì viết migration mới sửa đè.
- Migration phá vỡ tương thích phải chia ba bước: thêm cột nullable → backfill → siết ràng buộc.
- `prisma/seed.ts` tạo: 2 Plan (FREE, PRO), 1 tài khoản admin, 1 tài khoản learner demo
  có sẵn 1 Course + 1 Document + 3 Lesson để test và quay demo.
- Seed **không được** chạy tự động trên production.

---

## 7. Thiết kế API

### 7.1 Quy ước chung

| Hạng mục    | Quy ước                                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| Base URL    | `/api/v1` — version nằm trong path                                           |
| Định dạng   | JSON. `camelCase` cho field. Thời gian là ISO-8601 UTC.                      |
| Xác thực    | `Authorization: Bearer <accessToken>`; refresh token trong cookie `httpOnly` |
| Phân trang  | Cursor-based: `?limit=20&cursor=<id>` → trả `{ items, nextCursor }`          |
| Sắp xếp     | `?sort=createdAt&order=desc` — chỉ chấp nhận field trong danh sách trắng     |
| Idempotency | Header `Idempotency-Key` bắt buộc cho POST tạo AIJob và thanh toán           |
| Rate limit  | Trả `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`              |
| Correlation | Header `X-Request-Id`, sinh nếu client không gửi, có mặt trong mọi log       |

### 7.2 Danh sách endpoint

**Auth** — `[SPEC]` mục 6.1

| Method | Path                    | Mô tả                                                 | Auth   |
| ------ | ----------------------- | ----------------------------------------------------- | ------ |
| POST   | `/auth/register`        | Đăng ký. Trả user + access token, set refresh cookie  | —      |
| POST   | `/auth/login`           | Đăng nhập                                             | —      |
| POST   | `/auth/refresh`         | Đổi refresh token lấy access token mới (có xoay vòng) | cookie |
| POST   | `/auth/logout`          | Thu hồi refresh token hiện tại                        | ✓      |
| POST   | `/auth/logout-all`      | Thu hồi toàn bộ phiên                                 | ✓      |
| GET    | `/auth/me`              | Hồ sơ + gói hiện tại + hạn mức còn lại                | ✓      |
| PATCH  | `/auth/me`              | Sửa `displayName`, `locale`                           | ✓      |
| POST   | `/auth/change-password` | Đổi mật khẩu, thu hồi mọi phiên khác                  | ✓      |

**Course** — `[SPEC]` mục 6.2

| Method | Path                    | Mô tả                                                  |
| ------ | ----------------------- | ------------------------------------------------------ |
| POST   | `/courses`              | Tạo Course. Kiểm tra hạn mức `COURSES_CREATED`         |
| GET    | `/courses`              | Danh sách Course của người dùng, kèm tiến độ tóm tắt   |
| GET    | `/courses/:id`          | Chi tiết: documents, lessons, tiến độ, AI job gần nhất |
| PATCH  | `/courses/:id`          | Đổi `title`, `description`, `status`                   |
| DELETE | `/courses/:id`          | Soft delete, cascade lessons/documents                 |
| GET    | `/courses/:id/progress` | Tiến độ chi tiết theo từng Lesson                      |

**Document** — `[SPEC]` mục 6.3

| Method | Path                                | Mô tả                                                               |
| ------ | ----------------------------------- | ------------------------------------------------------------------- |
| POST   | `/courses/:id/documents/upload-url` | Trả presigned PUT URL + `documentId`. Kiểm tra hạn mức và định dạng |
| POST   | `/documents/:id/confirm`            | Xác nhận upload xong → enqueue job trích xuất                       |
| GET    | `/courses/:id/documents`            | Danh sách tài liệu kèm trạng thái                                   |
| GET    | `/documents/:id`                    | Chi tiết + thống kê chunk                                           |
| GET    | `/documents/:id/download-url`       | Presigned GET URL, hạn 5 phút                                       |
| DELETE | `/documents/:id`                    | Xoá file trên storage + chunk trong DB                              |
| POST   | `/documents/:id/retry`              | Chạy lại việc trích xuất đã thất bại                                |

**AI** — `[SPEC]` mục 6.4

| Method | Path                      | Mô tả                                                              |
| ------ | ------------------------- | ------------------------------------------------------------------ |
| POST   | `/courses/:id/generate`   | Tạo AIJob sinh bài học. Trả `202` + `jobId`. Cần `Idempotency-Key` |
| GET    | `/ai-jobs/:id`            | Trạng thái, tiến độ, lỗi                                           |
| GET    | `/ai-jobs/:id/stream`     | **SSE** — đẩy tiến độ theo thời gian thực                          |
| POST   | `/ai-jobs/:id/cancel`     | Huỷ job đang chờ hoặc đang chạy                                    |
| GET    | `/courses/:id/ai-jobs`    | Lịch sử job của Course                                             |
| POST   | `/lessons/:id/regenerate` | Sinh lại một Lesson đơn lẻ                                         |

**Lesson và học tương tác** — `[SPEC]` mục 6.5

| Method | Path                           | Mô tả                                             |
| ------ | ------------------------------ | ------------------------------------------------- |
| GET    | `/courses/:id/lessons`         | Danh sách Lesson kèm trạng thái tiến trình        |
| GET    | `/lessons/:id`                 | Nội dung bài + exercise (**đã lược bỏ đáp án**)   |
| PATCH  | `/lessons/:id`                 | Sửa nội dung — user story C-01                    |
| PATCH  | `/courses/:id/lessons/reorder` | Sắp xếp lại — C-02                                |
| DELETE | `/lessons/:id`                 | Xoá Lesson                                        |
| POST   | `/lessons/:id/start`           | Đánh dấu bắt đầu học                              |
| POST   | `/lessons/:id/complete`        | Đánh dấu hoàn thành                               |
| POST   | `/exercises/:id/submit`        | Nộp bài → trả điểm, đúng/sai từng câu, giải thích |
| GET    | `/exercises/:id/submissions`   | Các lần nộp trước của người dùng                  |

**Tiến trình** — `[SPEC]` mục 6.6

| Method | Path                 | Mô tả                                                        |
| ------ | -------------------- | ------------------------------------------------------------ |
| GET    | `/progress/overview` | Tổng quan dashboard: số course, bài đã xong, điểm trung bình |
| GET    | `/progress/history`  | Lịch sử học, phân trang                                      |

**Subscription** — `[SPEC]` mục 6.7

| Method | Path                     | Mô tả                                                              |
| ------ | ------------------------ | ------------------------------------------------------------------ |
| GET    | `/plans`                 | Danh sách gói — **công khai**, dùng cho trang giá                  |
| GET    | `/subscription`          | Gói hiện tại + mức dùng của kỳ này                                 |
| POST   | `/subscription/checkout` | Tạo phiên thanh toán. Body chỉ nhận `planCode`, **không nhận giá** |
| POST   | `/subscription/cancel`   | Huỷ ở cuối kỳ                                                      |
| GET    | `/usage`                 | Mức dùng theo từng chỉ số                                          |
| POST   | `/webhooks/stripe`       | Nhận webhook. **Xác minh chữ ký.** Không auth                      |

**Admin** — `[SPEC]` mục 6.8. Toàn bộ yêu cầu `role = ADMIN`.

| Method | Path                       | Mô tả                                            |
| ------ | -------------------------- | ------------------------------------------------ |
| GET    | `/admin/users`             | Danh sách người dùng, tìm kiếm, lọc              |
| GET    | `/admin/courses`           | Toàn bộ Course                                   |
| GET    | `/admin/ai-jobs`           | AI Job, lọc theo trạng thái; hiện tỉ lệ thất bại |
| POST   | `/admin/ai-jobs/:id/retry` | Chạy lại job — A-06                              |
| GET    | `/admin/subscriptions`     | Trạng thái subscription                          |
| GET    | `/admin/metrics/ai-cost`   | Chi phí LLM theo ngày — A-05                     |

**Hệ thống**

| Method | Path            | Mô tả                                           |
| ------ | --------------- | ----------------------------------------------- |
| GET    | `/health`       | Liveness — không chạm DB                        |
| GET    | `/health/ready` | Readiness — kiểm tra DB, Redis, storage         |
| GET    | `/docs`         | OpenAPI UI, chỉ bật ở môi trường non-production |

### 7.3 Định dạng lỗi

Mọi lỗi trả cùng một hình dạng, dựa trên RFC 7807:

```json
{
  "type": "https://learn.ai/errors/quota-exceeded",
  "title": "Đã vượt hạn mức",
  "status": 402,
  "code": "QUOTA_EXCEEDED",
  "detail": "Gói Free cho phép 5 tài liệu mỗi tháng. Bạn đã dùng hết 5.",
  "requestId": "01J8X...",
  "meta": { "metric": "DOCUMENTS_UPLOADED", "limit": 5, "used": 5 }
}
```

`code` là chuỗi ổn định để frontend so khớp. **Không bao giờ** so khớp bằng `detail`.

| Code                    | HTTP | Khi nào                                                        |
| ----------------------- | ---- | -------------------------------------------------------------- |
| `VALIDATION_FAILED`     | 400  | Body/query không hợp lệ. `meta.fields` liệt kê lỗi từng field  |
| `UNAUTHENTICATED`       | 401  | Thiếu hoặc hết hạn access token                                |
| `FORBIDDEN`             | 403  | Đăng nhập rồi nhưng không có quyền với tài nguyên              |
| `NOT_FOUND`             | 404  | Không tồn tại, **hoặc** tồn tại nhưng không thuộc về người gọi |
| `CONFLICT`              | 409  | Vi phạm ràng buộc duy nhất, xung đột trạng thái                |
| `PAYLOAD_TOO_LARGE`     | 413  | File vượt giới hạn                                             |
| `UNSUPPORTED_FILE_TYPE` | 415  | Định dạng không hỗ trợ                                         |
| `QUOTA_EXCEEDED`        | 402  | Chạm hạn mức gói                                               |
| `RATE_LIMITED`          | 429  | Quá nhiều request                                              |
| `AI_GENERATION_FAILED`  | 422  | LLM trả về output không qua được validate sau mọi lần thử      |
| `UPSTREAM_UNAVAILABLE`  | 503  | LLM provider hoặc storage không phản hồi                       |
| `INTERNAL_ERROR`        | 500  | Ngoài dự kiến — **không lộ stack trace**                       |

> Lưu ý về `NOT_FOUND`: tài nguyên tồn tại nhưng thuộc người khác cũng trả 404, không trả 403.
> Trả 403 sẽ tiết lộ rằng id đó có thật.

### 7.4 Hợp đồng SSE cho tiến độ AI Job

```
GET /api/v1/ai-jobs/:id/stream
Content-Type: text/event-stream

event: progress
data: {"jobId":"01J8X","status":"RUNNING","progress":45,"label":"Đang sinh bài 3/7"}

event: progress
data: {"jobId":"01J8X","status":"RUNNING","progress":72,"label":"Đang kiểm tra kết quả"}

event: completed
data: {"jobId":"01J8X","status":"SUCCEEDED","lessonIds":["01J8Y","01J8Z"],"lessonCount":7}

event: failed
data: {"jobId":"01J8X","status":"FAILED","code":"AI_GENERATION_FAILED","message":"..."}
```

Quy tắc: gửi heartbeat `: ping` mỗi 15 giây để proxy không cắt kết nối. Client tự kết nối lại
với `Last-Event-ID`. **Luôn có đường lui bằng polling** `GET /ai-jobs/:id` mỗi 3 giây — một số
môi trường mạng chặn SSE.

---

## 8. AI Pipeline

Đây là phần lõi của sản phẩm và cũng là phần rủi ro nhất. Đọc kỹ.

### 8.1 Toàn cảnh `[SPEC]`

```
Upload Document
      ↓
Document Processing        ← xác minh file, magic bytes, checksum
      ↓
Text Extraction / OCR      ← PDF text layer; OCR khi là ảnh scan
      ↓
Content Structuring        ← chuẩn hoá, nhận heading, cắt chunk
      ↓
AI Lesson Generation       ← outline → lesson → exercise
      ↓
Validation                 ← schema + luật nghiệp vụ + kiểm tra bám nguồn
      ↓
Course and Lesson Storage  ← ghi trong một transaction
      ↓
Interactive Learning
      ↓
Progress Tracking
```

### 8.2 Bước 1–3: từ file thành chunk

**Trích xuất theo loại file** `[QĐ]`

| Loại                     | Cách xử lý                          | Thư viện                  |
| ------------------------ | ----------------------------------- | ------------------------- |
| PDF có text layer        | Trích trực tiếp, giữ số trang       | `pdfjs-dist`              |
| PDF scan (không có text) | OCR                                 | `tesseract.js`, `vie+eng` |
| PPTX                     | Đọc XML slide, ghép text theo slide | `officeparser`            |
| DOCX                     | Đọc XML document                    | `mammoth`                 |
| TXT / MD                 | Đọc thẳng                           | —                         |

Cách nhận PDF scan: trích text; nếu tổng ký tự chia số trang **< 100**, coi là scan và chuyển
sang OCR. OCR chậm — giới hạn 50 trang mỗi tài liệu ở MVP, vượt thì báo lỗi rõ ràng.

**Chuẩn hoá trước khi cắt chunk**

1. Bỏ header/footer lặp lại (dòng xuất hiện ở ≥ 60% số trang).
2. Nối từ bị gạch nối cuối dòng.
3. Gộp nhiều dòng trống thành một.
4. Nhận diện heading bằng heuristic: dòng ngắn, in đậm hoặc chữ hoa, hoặc khớp mẫu đánh số.
5. Bỏ mục lục (trang có mật độ dấu chấm và số trang cao).

**Cắt chunk** `[QĐ]`

| Tham số             | Giá trị                  | Lý do                                     |
| ------------------- | ------------------------ | ----------------------------------------- |
| Kích thước mục tiêu | 1.200 token              | Đủ ngữ cảnh cho một khái niệm, chưa loãng |
| Chồng lấn           | 150 token                | Giữ mạch khi khái niệm bị cắt ngang       |
| Ranh giới ưu tiên   | heading > đoạn văn > câu | Không cắt giữa câu                        |
| Chunk tối thiểu     | 100 token                | Nhỏ hơn thì gộp vào chunk trước           |

Mỗi chunk giữ `headingPath` và khoảng trang. Hai trường này chính là thứ cho phép Lesson
truy vết ngược về tài liệu gốc — nền tảng của việc kiểm tra bám nguồn ở 8.5.

**Tiêu chí đánh giá chất lượng trích xuất** (dùng để quyết định có cần đổi sang parser Python
theo mục 5.2 hay không): lấy 20 tài liệu mẫu đa dạng, trích thủ công 5 đoạn/tài liệu làm chuẩn.
Nếu **> 15% đoạn** bị mất hoặc lộn xộn thứ tự, đổi parser.

### 8.3 Bước 4: sinh nội dung

Chia hai giai đoạn, **không gộp làm một lần gọi**:

**Giai đoạn A — Outline (1 lần gọi LLM)**

Đầu vào: heading path của toàn bộ chunk + 200 ký tự đầu mỗi chunk (không gửi toàn văn).
Đầu ra: danh sách node bài học, mỗi node có tiêu đề, mô tả, và các `chunkIds` liên quan.

Vì sao tách riêng: outline quyết định cấu trúc khóa học. Gộp chung với việc viết nội dung khiến
model vừa phải lập kế hoạch vừa phải viết, và kết quả luôn tệ hơn. Tách ra cũng cho phép hiển thị
outline cho người dùng duyệt trước khi tốn tiền sinh toàn bộ — **tính năng tương lai, chưa làm ở MVP.**

**Giai đoạn B — Lesson + Exercise (n lần gọi, song song có giới hạn)**

Với mỗi node outline: gửi **toàn văn** các chunk của node đó, yêu cầu trả về lesson và exercise
trong cùng một JSON.

Giới hạn song song: **3 lần gọi cùng lúc** mỗi job `[QĐ]` — cân bằng giữa thời gian chờ và
rate limit của nhà cung cấp.

**Hình dạng output bắt buộc** — định nghĩa bằng Zod trong `packages/ai/schemas`:

```ts
const LessonOutput = z.object({
  title: z.string().min(5).max(200),
  summary: z.string().min(20).max(500),
  contentMd: z.string().min(200).max(12000),
  estimatedMinutes: z.number().int().min(1).max(60),
  sourceChunkIds: z.array(z.string()).min(1), // BẮT BUỘC — dùng cho kiểm tra bám nguồn
  exercises: z.array(ExerciseOutput).min(1).max(5),
});

const QuestionOutput = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('MULTIPLE_CHOICE'),
    prompt: z.string().min(10),
    options: z.array(z.object({ content: z.string().min(1), isCorrect: z.boolean() })).length(4),
    explanation: z.string().min(10),
    sourceChunkId: z.string(),
  }),
  // TRUE_FALSE · SHORT_ANSWER · FILL_BLANK ...
]);
```

**Quy tắc prompt**

- Prompt lưu thành file trong `packages/ai/prompts/`, **có đánh version** (`outline@3`).
  Mỗi `GenerationRun` ghi lại version đã dùng — không có nó thì không thể điều tra khi chất lượng tụt.
- Yêu cầu output JSON theo schema; dùng tính năng structured output của nhà cung cấp khi có.
- Nói rõ trong prompt: **chỉ dùng thông tin trong tài liệu được cung cấp**, không thêm kiến thức ngoài.
- Ngôn ngữ đầu ra theo `Course.language`, mặc định tiếng Việt.
- **Không** đưa dữ liệu định danh người dùng vào prompt.

### 8.4 Bước 5: Validation `[SPEC]`

Spec yêu cầu _"validate AI output trước khi lưu"_. Cụ thể hoá thành bốn tầng, chạy tuần tự:

**Tầng 1 — Schema.** Parse bằng Zod. Sai hình dạng thì thử lại ngay, không chấp nhận.

**Tầng 2 — Luật nghiệp vụ.**

| Luật                                                                  | Áp dụng cho       |
| --------------------------------------------------------------------- | ----------------- |
| Đúng một đáp án đúng                                                  | `MULTIPLE_CHOICE` |
| Không có hai lựa chọn trùng nội dung (so sánh đã chuẩn hoá)           | `MULTIPLE_CHOICE` |
| Các lựa chọn có độ dài tương đương — không để đáp án đúng dài gấp đôi | `MULTIPLE_CHOICE` |
| Không có lựa chọn kiểu "Tất cả đáp án trên"                           | `MULTIPLE_CHOICE` |
| `explanation` không được lặp nguyên văn `prompt`                      | mọi loại          |
| Tiêu đề Lesson không trùng nhau trong cùng Course                     | Lesson            |
| `contentMd` chỉ chứa Markdown an toàn, không có thẻ script            | Lesson            |

**Tầng 3 — Kiểm tra bám nguồn.** Mỗi Lesson phải khai `sourceChunkIds`, và các id này phải
thực sự tồn tại trong Document. Lấy mẫu: với mỗi Lesson, chọn ngẫu nhiên 2 thuật ngữ chuyên môn
trong `contentMd` và kiểm tra chúng có xuất hiện trong các chunk đã khai không.
Dưới 50% khớp → đánh dấu `LOW_CONFIDENCE`.

Lesson `LOW_CONFIDENCE` vẫn được lưu nhưng gắn cờ, và UI hiển thị nhãn
_"Nội dung này có thể lệch khỏi tài liệu gốc — hãy kiểm tra lại"_. Đây là cách trung thực để
xử lý ảo giác của model, thay vì giả vờ nó không tồn tại.

**Tầng 4 — Vệ sinh dữ liệu.** Sanitize Markdown, cắt độ dài quá mức, chuẩn hoá khoảng trắng.

### 8.5 Retry, timeout và chi phí

| Tình huống                          | Xử lý                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| Lỗi schema (tầng 1)                 | Thử lại tối đa **2 lần**, prompt lần sau kèm thông báo lỗi cụ thể                     |
| Lỗi luật nghiệp vụ (tầng 2)         | Thử lại **1 lần** kèm mô tả luật bị vi phạm                                           |
| Rate limit từ provider              | Backoff mũ: 2s, 8s, 30s, tối đa 5 lần                                                 |
| Timeout một lần gọi                 | 120 giây                                                                              |
| Timeout toàn job                    | 15 phút → chuyển `FAILED`, code `AI_GENERATION_TIMEOUT`                               |
| Một Lesson hỏng, các Lesson khác ổn | Vẫn lưu phần thành công, job kết thúc `SUCCEEDED` kèm `partialFailures` trong `error` |
| Toàn bộ Lesson hỏng                 | Job `FAILED`, **không ghi gì vào DB**                                                 |

**Theo dõi chi phí.** Mỗi lần gọi LLM ghi một `GenerationRun` với token vào/ra, chi phí ước tính,
độ trễ. Đây là dữ liệu cho endpoint admin `A-05` và cũng là thứ đáng đưa lên portfolio — nó cho
thấy hệ thống có ý thức về chi phí vận hành.

Chặn chi phí vượt mức: nếu một job vượt `AI_JOB_MAX_COST_USD` (mặc định `0.50`), dừng và báo lỗi.

### 8.6 Máy trạng thái AIJob

```
         ┌──────────┐
         │  QUEUED  │──────── cancel ───────┐
         └────┬─────┘                       │
              │ worker nhận                 v
         ┌────v─────┐                 ┌───────────┐
         │ RUNNING  │──── cancel ────>│ CANCELLED │
         └────┬─────┘                 └───────────┘
              │
     ┌────────┴────────┐
     v                 v
┌───────────┐    ┌──────────┐
│ SUCCEEDED │    │  FAILED  │──── retry (attempt+1) ──> QUEUED
└───────────┘    └──────────┘                           tối đa 3 lần
```

Chuyển trạng thái phải dùng update có điều kiện để tránh tranh chấp:

```sql
UPDATE "AIJob" SET status = 'RUNNING', "startedAt" = now()
WHERE id = $1 AND status = 'QUEUED';
-- 0 dòng bị ảnh hưởng = worker khác đã nhận job này, bỏ qua
```

---

## 9. Background jobs và queue

### 9.1 Danh sách queue `[QĐ]`

| Queue              | Job                          | Concurrency | Timeout | Retry         |
| ------------------ | ---------------------------- | ----------- | ------- | ------------- |
| `document-extract` | Trích text, chunk            | 4           | 10 phút | 3, backoff mũ |
| `lesson-generate`  | Sinh outline + lesson        | 2           | 15 phút | 2             |
| `billing-sync`     | Đồng bộ webhook thanh toán   | 2           | 30 giây | 5             |
| `maintenance`      | Dọn file tạm, tổng hợp usage | 1           | 5 phút  | 1             |

### 9.2 Quy tắc bắt buộc cho job

1. **Idempotent.** Chạy lại cùng một job không được tạo dữ liệu trùng. Dùng `idempotencyKey`
   và kiểm tra trạng thái trước khi làm việc.
2. **Có thể tiếp tục.** Job dài phải ghi tiến độ để lần chạy lại không bắt đầu từ số không.
3. **Không giữ state trong bộ nhớ worker.** Worker có thể bị giết bất cứ lúc nào.
4. **Mọi job ghi log kèm `jobId` và `requestId`** để truy vết xuyên suốt từ click của người dùng.
5. **Dead-letter queue.** Job thất bại hết số lần thử vào `*-dlq`, admin xem được và chạy lại thủ công.

### 9.3 Job định kỳ

| Lịch            | Việc                                                           |
| --------------- | -------------------------------------------------------------- |
| Mỗi giờ         | Dọn `Document` ở trạng thái `PENDING` quá 2 giờ (upload bỏ dở) |
| Hằng ngày 03:00 | Xoá `GenerationRun.rawResponseKey` cũ hơn 30 ngày              |
| Hằng ngày 03:30 | Tổng hợp `UsageCounter` của kỳ trước, chốt số                  |
| Đầu mỗi tháng   | Mở kỳ hạn mức mới                                              |

---

## 10. Authentication và bảo mật

### 10.1 Cơ chế xác thực `[QĐ]`

| Thành phần            | Quyết định                                                                          |
| --------------------- | ----------------------------------------------------------------------------------- |
| Băm mật khẩu          | **argon2id**, `memoryCost=19456, timeCost=2, parallelism=1`                         |
| Access token          | JWT, sống **15 phút**, giữ trong memory phía client (không localStorage)            |
| Refresh token         | Chuỗi ngẫu nhiên 256 bit, cookie `httpOnly; Secure; SameSite=Lax`, sống **30 ngày** |
| Lưu refresh token     | Chỉ lưu **SHA-256 hash** trong DB                                                   |
| Xoay vòng             | Mỗi lần refresh cấp token mới và thu hồi token cũ                                   |
| Phát hiện tái sử dụng | Dùng lại token đã thu hồi → **thu hồi cả `familyId`**, buộc đăng nhập lại           |

Vì sao access token để trong memory chứ không localStorage: XSS đọc được localStorage.
Đổi lại, người dùng F5 sẽ mất access token — giải quyết bằng việc gọi `/auth/refresh` ngay khi
app khởi động, vì refresh token nằm trong cookie `httpOnly` mà script không đọc được.

### 10.2 Phân quyền

Hai vai trò hệ thống: `LEARNER` và `ADMIN` `[SPEC]`.
Quyền trên tài nguyên dựa trên **quyền sở hữu**: `Course.ownerId === user.id`.

`[QĐ]` Áp quyền sở hữu ở **tầng repository**, không phải ở controller:

```ts
// Đúng — không thể quên
findCourseForUser(courseId: string, userId: string) {
  return this.prisma.course.findFirst({
    where: { id: courseId, ownerId: userId, deletedAt: null },
  });
}

// Sai — dễ quên ở endpoint thứ 20
findCourse(courseId) { return this.prisma.course.findUnique({ where: { id: courseId } }); }
```

Lý do: IDOR là lỗ hổng phổ biến nhất trong loại ứng dụng này. Đặt bộ lọc ở nơi thấp nhất khiến
việc quên trở nên khó, thay vì trông chờ vào kỷ luật của người viết endpoint mới.

### 10.3 Bảo mật upload file

| Kiểm tra        | Cách làm                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| Phần mở rộng    | Danh sách trắng: `.pdf .pptx .docx .txt .md`                                         |
| MIME            | Đối chiếu header với phần mở rộng                                                    |
| **Magic bytes** | Kiểm tra ở **worker sau khi tải về** — client có thể nói dối                         |
| Kích thước      | Tối đa 25 MB, ép cả ở presigned URL lẫn khi xác nhận                                 |
| Số trang        | Tối đa 300 trang; PDF scan tối đa 50 trang                                           |
| Checksum        | SHA-256; trùng trong cùng Course thì từ chối, báo "tài liệu đã tồn tại"              |
| Tên file        | Chuẩn hoá, bỏ ký tự đường dẫn; **không dùng tên do người dùng đặt làm khóa lưu trữ** |
| Khóa lưu trữ    | `courses/{courseId}/documents/{documentId}.{ext}` — không đoán được                  |
| Truy cập        | Chỉ qua presigned URL hạn ngắn. **Bucket không public.**                             |

### 10.4 Danh sách kiểm tra bảo mật

- [ ] Mọi endpoint (trừ auth, `/plans`, `/health`, webhook) yêu cầu access token hợp lệ
- [ ] Mọi truy vấn tài nguyên lọc theo `ownerId` ở tầng repository
- [ ] Đáp án đúng không xuất hiện trong bất kỳ response nào trước khi nộp bài
- [ ] Giá lấy từ `Plan.priceCents` trong DB, không lấy từ request `[SPEC]`
- [ ] Webhook thanh toán xác minh chữ ký và ghi `PaymentEvent` trước khi xử lý
- [ ] Rate limit: đăng nhập 5 lần/phút/IP; tạo AIJob 10 lần/giờ/user; API chung 100 lần/phút/user
- [ ] Helmet, CORS chỉ cho phép origin đã cấu hình
- [ ] Zod validate **mọi** input, kể cả param đường dẫn
- [ ] Prisma tham số hoá sẵn — **không nối chuỗi SQL** ở bất cứ đâu
- [ ] Markdown từ LLM được sanitize trước khi render (`rehype-sanitize`)
- [ ] Không có secret trong repo; `.env.example` chỉ chứa key rỗng
- [ ] Log không chứa mật khẩu, token, hay toàn văn tài liệu người dùng
- [ ] Thông báo lỗi đăng nhập không phân biệt "sai email" với "sai mật khẩu"
- [ ] Dependency scan chạy trong CI (`npm audit`, Dependabot)
- [ ] Header bảo mật: `X-Content-Type-Options`, `X-Frame-Options`, CSP trên web app

---

## 11. Subscription, hạn mức và billing

### 11.1 Gói dịch vụ `[QĐ]`

|                     | **Free**     | **Pro**      | **Team**              |
| ------------------- | ------------ | ------------ | --------------------- |
| Giá                 | 0            | $9 / tháng   | —                     |
| Course              | 3            | 50           | —                     |
| Tài liệu / tháng    | 5            | 100          | —                     |
| Trang / tài liệu    | 50           | 300          | —                     |
| AI Job / tháng      | 10           | 200          | —                     |
| Sửa bài học AI sinh | ✓            | ✓            | —                     |
| Hỗ trợ ưu tiên      | —            | ✓            | —                     |
| Trạng thái          | Có trong MVP | Có trong MVP | **Mở rộng tương lai** |

Gói Team hiển thị trên trang giá với nhãn `Mở rộng tương lai` — không có nút mua `[SPEC]`.

### 11.2 Cách lưu hạn mức

Hạn mức nằm trong `Plan.limits` dạng JSON, không hardcode trong code:

```json
{
  "COURSES_CREATED": { "limit": 3, "window": "total" },
  "DOCUMENTS_UPLOADED": { "limit": 5, "window": "month" },
  "PAGES_PROCESSED": { "limit": 50, "window": "per_document" },
  "AI_JOBS_RUN": { "limit": 10, "window": "month" }
}
```

Đổi hạn mức = sửa dữ liệu, không cần deploy lại.

### 11.3 Áp hạn mức

Kiểm tra ở **hai nơi**:

1. **Trước khi bắt đầu** — API trả `402 QUOTA_EXCEEDED` kèm `meta.limit` và `meta.used`
   để UI hiện thông báo hữu ích kèm nút nâng cấp.
2. **Khi tăng bộ đếm** — dùng thao tác nguyên tử, tránh tranh chấp khi người dùng bấm hai lần:

```sql
INSERT INTO "UsageCounter" ("userId", period, metric, value)
VALUES ($1, $2, $3, 1)
ON CONFLICT ("userId", period, metric)
DO UPDATE SET value = "UsageCounter".value + 1
RETURNING value;
-- so sánh giá trị trả về với hạn mức; vượt thì rollback transaction
```

### 11.4 Luồng thanh toán `[SPEC]`

> **Không bao giờ tin giá hoặc trạng thái thanh toán do frontend gửi lên.**

```
Client --POST /subscription/checkout { planCode: "PRO" }-->  API
   API: tra Plan theo code → lấy priceCents TỪ DB
        → tạo Checkout Session ở nhà cung cấp
        → trả về URL
Client --redirect--> trang thanh toán của nhà cung cấp
                          │
                          └── webhook ──> POST /webhooks/stripe
                                             1. xác minh chữ ký
                                             2. ghi PaymentEvent (unique eventId)
                                             3. nếu đã processedAt → bỏ qua
                                             4. cập nhật Subscription + Payment
                                             5. đánh dấu processedAt
```

Trang "thành công" mà người dùng quay về **không** được dùng để kích hoạt gói. Nó chỉ hiển thị
"đang xác nhận" và poll `/subscription` cho đến khi webhook cập nhật xong. Webhook là nguồn sự thật.

**Chế độ DEMO** `[QĐ]`: biến môi trường `BILLING_MODE=demo|live`. Ở chế độ demo, endpoint checkout
kích hoạt gói ngay và ghi một `Payment` giả có `providerPaymentId = "demo_*"`. UI hiển thị rõ
băng rôn _"Chế độ demo — không có giao dịch thật"_. Spec cho phép cách này, nhưng **phải nói rõ**
trên website rằng đây là demo, không được để người xem hiểu nhầm là tích hợp thanh toán thật.

---

## 12. Frontend web app

### 12.1 Bản đồ route

```
apps/web/app/
├── (marketing)/                  Track A — public, SSG
│   ├── page.tsx                  Trang chủ
│   ├── product/                  Sản phẩm
│   ├── how-it-works/             Cách hoạt động
│   ├── technical/                Kiến trúc kỹ thuật
│   ├── pricing/                  Bảng giá
│   └── demo/                     Demo / CTA
│
├── (auth)/
│   ├── login/  register/  forgot-password/
│
├── (app)/                        Track B — cần đăng nhập
│   ├── dashboard/                Tổng quan tiến độ
│   ├── courses/
│   │   ├── page.tsx              Danh sách Course
│   │   ├── new/
│   │   └── [courseId]/
│   │       ├── page.tsx          Chi tiết: tài liệu + bài học
│   │       ├── documents/        Quản lý tài liệu, upload
│   │       ├── generate/         Cấu hình và chạy AI Job
│   │       └── lessons/[lessonId]/
│   │           ├── page.tsx      Đọc bài
│   │           └── practice/     Làm bài tập
│   ├── progress/                 Lịch sử học
│   └── settings/                 Hồ sơ, gói, hạn mức
│
└── (admin)/admin/                role = ADMIN
    ├── users/  courses/  ai-jobs/  subscriptions/  metrics/
```

### 12.2 Quản lý dữ liệu và trạng thái

| Loại state            | Công cụ                                 | Ghi chú                                               |
| --------------------- | --------------------------------------- | ----------------------------------------------------- |
| Dữ liệu từ server     | TanStack Query                          | Là mặc định. `staleTime` 30s cho danh sách            |
| Trạng thái AI Job     | SSE + fallback polling                  | Xem 7.4                                               |
| Form                  | React Hook Form + Zod resolver          | Schema **dùng chung** với API từ `packages/contracts` |
| UI state (modal, tab) | `useState`                              | Không đưa vào store toàn cục                          |
| Phiên đăng nhập       | Context nhỏ + access token trong memory | Xem 10.1                                              |

Không dùng Redux/Zustand ở MVP. Gần như toàn bộ state của ứng dụng này là state của server —
thêm một store toàn cục chỉ tạo ra hai nguồn sự thật.

### 12.3 Những trạng thái UI bắt buộc phải có

Mỗi màn hình có dữ liệu phải xử lý đủ **năm** trạng thái. Thiếu bất kỳ trạng thái nào là lỗi review:

| Trạng thái | Xử lý                                                                                   |
| ---------- | --------------------------------------------------------------------------------------- |
| Loading    | Skeleton đúng hình dạng nội dung, không dùng spinner giữa trang                         |
| Empty      | Mascot Circle `sleeping.svg` + một câu giải thích + nút hành động                       |
| Error      | Thông điệp theo `code` lỗi + nút thử lại + `requestId` để báo lỗi                       |
| Partial    | AI Job sinh được 5/7 bài — hiển thị 5 bài kèm cảnh báo, không coi là thất bại toàn phần |
| Success    | Nội dung thật                                                                           |

Riêng AI Job có trạng thái thứ sáu: **đang chạy**, dùng mascot Circle `CircleMascot/svg/states/working.svg` kèm thanh tiến độ
và nhãn bước hiện tại. Người dùng chờ vài phút — khoảng thời gian đó phải cho họ biết chuyện gì
đang diễn ra, nếu không họ sẽ nghĩ hệ thống treo.

### 12.4 Hiệu năng và truy cập `[SPEC]`

- [ ] Không tràn ngang ở mọi bề rộng từ 320px trở lên
- [ ] Lighthouse Performance ≥ 90 cho trang marketing
- [ ] Tương phản văn bản ≥ 4.5:1, văn bản lớn ≥ 3:1
- [ ] Điều hướng đầy đủ bằng bàn phím, focus ring luôn thấy được
- [ ] Ảnh có `alt`; SVG trang trí có `aria-hidden`
- [ ] Tôn trọng `prefers-reduced-motion` — tắt animation khi người dùng yêu cầu
- [ ] Khối code và sơ đồ rộng có vùng cuộn riêng, không đẩy tràn cả trang
- [ ] Chữ nhỏ nhất 14px trên mobile

---

## 13. Mascot Circle

Mascot hình tròn **đã hoàn chỉnh** trong `CircleMascot/` — 25 biểu cảm, 40 trạng thái, kèm
component React và sprite HTML. Quy tắc dưới đây lấy từ `CircleMascot/README.md`, đọc kỹ trước
khi dùng.

### 13.1 Thành phần

| File                    | Dùng để                                        |
| ----------------------- | ---------------------------------------------- |
| `CircleAvatar.tsx`      | Component React — tự động anim theo state      |
| `svg/states/*.svg`      | 40 trạng thái, mỗi trạng thái một ảnh tĩnh     |
| `svg/expressions/*.svg` | 25 biểu cảm khuôn mặt                          |
| `svg/sprite.svg`        | Mọi state dưới dạng `<symbol>`, cho HTML thuần |
| `manifest.json`         | Danh sách state, nhóm, và biểu cảm nền         |

`[SPEC]` **Mục đích**: mascot thuộc về phần marketing — hero, empty state, tiến độ AI Job và
trạng thái lỗi. Không đặt trong các section kỹ thuật.

### 13.2 Ánh xạ trạng thái mascot sang trạng thái ứng dụng

| State       | Dùng khi                         |
| ----------- | -------------------------------- |
| `working`   | AI Job đang chạy                 |
| `celebrate` | Người dùng hoàn thành bài học    |
| `alerting`  | AI Job thất bại, upload hỏng     |
| `sleeping`  | Chưa có Course hoặc Document nào |

Bốn trạng thái này ánh xạ đúng vào các bước của AI pipeline ở mục 8 — dùng đúng trạng thái,
đừng lấy `excited` hay `happy` cho màn hình lỗi.

### 13.3 Nhúng

React — chỉ phụ thuộc React, không cần gì khác:

```tsx
import CircleAvatar from './CircleAvatar';

<CircleAvatar state="working" size={96} />;
```

HTML thuần — tĩnh, một khung hình:

```html
<svg width="96" height="96"><use href="CircleMascot/svg/sprite.svg#working" /></svg>
```

hoặc tham chiếu thẳng một file:

```html
<img src="CircleMascot/svg/states/working.svg" width="96" alt="working" />
```

### 13.4 Quy tắc dùng

**Nên**

- Giữ nguyên tỉ lệ; muốn đổi kích thước thì scale cả file
- Chỉ hai màu trắng và đen (ADR 015): thân đen + mặt trắng trên nền sáng, thân trắng + mặt đen trên nền tối
- Chừa khoảng trống quanh mascot ít nhất 25% chiều cao

**Không**

- Thêm viền, đổ bóng, gradient
- Xoay, nghiêng, kéo méo
- Lạm dụng mascot ở mọi nơi — chỉ dùng ở hero, empty state, tiến độ AI Job và trạng thái lỗi
- Sửa trực tiếp file `.svg` — đây là đầu ra của Blob Studio, chỉnh lại từ nguồn

---

## 14. Portfolio website — Track A

Đây là deliverable chính của bản spec. Website phải trả lời được hai nhóm câu hỏi `[SPEC]`:

**Cho khách hàng:** Sản phẩm là gì? Giải quyết vấn đề gì? Dành cho ai? Giá trị ra sao?
Hoạt động thế nào? Trông như thế nào? Có những gói nào? Dùng thử bằng cách nào?

**Cho người review kỹ thuật:** Kiến trúc ra sao? Các module chính? AI pipeline hoạt động thế nào?
Tài liệu được lưu và xử lý ra sao? Backend và frontend giao tiếp thế nào? Cấu trúc database?
Job bất đồng bộ xử lý ra sao? Auth, phân quyền, billing, bảo mật? MVP gồm gì?
Đã ra những quyết định kỹ thuật nào?

### 14.1 Điều hướng và cấu trúc `[SPEC]`

Menu chính: **Home · Product · How It Works · Technical · Demo · GitHub**

14 section bắt buộc:

| #   | Section                | Nội dung cốt lõi                                                                                                                           |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Hero                   | Tên sản phẩm, tagline, một câu giá trị, CTA chính `Try the Demo`, CTA phụ `Explore Technical Architecture`, ảnh preview UI                 |
| 2   | Problem                | Bốn biểu hiện cụ thể ở mục 2.1 — không dùng ngôn ngữ marketing mơ hồ                                                                       |
| 3   | Target Users           | Learner (ghi rõ là người dùng chính của MVP), Content Creator, Administrator                                                               |
| 4   | Product Value          | Sáu giá trị ở mục 2.3, chỉ nêu lợi ích có căn cứ                                                                                           |
| 5   | Core Features          | 6 thẻ: Document-to-Course AI · Interactive Lessons · AI-Generated Exercises · Learning Progress · Course Organization · Subscription Plans |
| 6   | Screenshots            | Ảnh UI **thật** từ `docs/screenshots/`, không dùng ảnh giả                                                                                 |
| 7   | How It Works           | Sơ đồ 9 bước của pipeline ở mục 8.1                                                                                                        |
| 8   | MVP Scope              | Hai cột: In Scope / Out of Scope — lấy từ mục 3.1 và 3.2                                                                                   |
| 9   | Technical Architecture | Sơ đồ 12 thành phần ở mục 4.1, đọc được trên mobile                                                                                        |
| 10  | AI Pipeline            | Chi tiết hơn section 7: chunking, structured output, 4 tầng validation, retry                                                              |
| 11  | Database & API         | ERD rút gọn + vài endpoint tiêu biểu                                                                                                       |
| 12  | Engineering Decisions  | Các ADR đáng chú ý — vì sao TS toàn bộ, vì sao tách outline, vì sao webhook là nguồn sự thật                                               |
| 13  | Demo / CTA             | Link demo, tài khoản dùng thử, video ngắn                                                                                                  |
| 14  | GitHub & Project Info  | Link repo, stack, hướng dẫn chạy local                                                                                                     |

### 14.2 Hướng thiết kế `[SPEC]`

**Phong cách:** AI SaaS hiện đại, cao cấp nhưng tiết chế. Bố cục sạch. Phân cấp thị giác mạnh.
Tông portfolio kỹ sư chuyên nghiệp. Phân tách rõ nội dung marketing và nội dung kỹ thuật.

**Ngôn ngữ thị giác:** đơn sắc — chỉ các tông từ trắng tới đen, xám trung tính ở giữa, không hue nào (đổi 2026-09-28 theo quyết định chủ sản phẩm, ADR 015; trước là navy + xám + sky `#5EC8F5`). Thẻ bo góc.
Gradient nhẹ. Mockup dashboard. Sơ đồ kiến trúc có đường nối rõ ràng. Font monospace cho code
và metadata kỹ thuật. Mascot Circle ở hero, empty state, tiến độ AI Job và trạng thái lỗi —
**không đặt trong các section kỹ thuật.**

**Tránh:** buzzword AI chung chung, hero quá tải, sơ đồ kiến trúc không đọc được, animation thừa,
số liệu bịa, logo khách hàng giả, tuyên bố hiệu năng không có căn cứ, trình bày tính năng roadmap
như đã hoàn thành.

### 14.3 Nội dung mẫu cho Hero `[SPEC]`

> **Turn your documents into interactive learning.**
>
> LEARN transforms PDFs, slides, and personal study materials into structured courses,
> interactive lessons, and AI-generated practice activities.

Bản tiếng Việt:

> **Biến tài liệu của bạn thành bài học tương tác.**
>
> LEARN chuyển PDF, slide và tài liệu học cá nhân thành khóa học có cấu trúc,
> bài học tương tác và bài tập luyện tập do AI sinh ra.

### 14.4 Cách trình bày phần kỹ thuật

Spec yêu cầu phần kỹ thuật **phải dễ hiểu**, tránh đổ một khối code lớn không giải thích `[SPEC]`.

`[QĐ]` Dùng ba định dạng:

1. **Sơ đồ trước, chữ sau.** Mỗi khái niệm kỹ thuật mở đầu bằng một hình.
2. **Thẻ mở rộng.** Tóm tắt hai dòng, bấm vào mới xem chi tiết — người đọc chọn độ sâu.
3. **Đoạn code ngắn có chú thích.** Tối đa 15 dòng mỗi khối, luôn kèm một câu giải thích
   _vì sao_ chứ không chỉ _là gì_.

---

## 15. Chiến lược kiểm thử

### 15.1 Tháp kiểm thử và mục tiêu

| Tầng                   | Công cụ                                             | Số lượng mục tiêu | Chạy khi                           |
| ---------------------- | --------------------------------------------------- | ----------------- | ---------------------------------- |
| Unit                   | Vitest                                              | ~150 test         | Mỗi lần lưu file, mỗi PR           |
| Integration            | Vitest + Supertest + Postgres thật (Testcontainers) | ~60 test          | Mỗi PR                             |
| E2E                    | Playwright                                          | 8 kịch bản        | Mỗi PR vào `main`, mỗi đêm         |
| Kiểm thử chất lượng AI | Bộ đánh giá riêng                                   | 20 tài liệu mẫu   | Thủ công, trước mỗi lần đổi prompt |

Độ phủ mục tiêu: **≥ 70% dòng** cho `apps/api` và `packages/ai`. Không đặt mục tiêu phủ cho
`apps/web` — test E2E có giá trị hơn nhiều so với unit test cho component.

### 15.2 Những gì bắt buộc phải có test

| Khu vực                                          | Vì sao                                               |
| ------------------------------------------------ | ---------------------------------------------------- |
| Chấm điểm Exercise                               | Sai điểm là lỗi người dùng thấy ngay và mất niềm tin |
| Bốn tầng validation của AI output                | Hàng rào duy nhất giữa model và database             |
| Áp hạn mức, đặc biệt là điều kiện tranh chấp     | Lỗ hổng doanh thu                                    |
| Xoay vòng refresh token và phát hiện tái sử dụng | Lỗ hổng bảo mật                                      |
| Lọc quyền sở hữu ở repository                    | IDOR                                                 |
| Idempotency của webhook thanh toán               | Xử lý trùng = tính tiền hai lần                      |
| Chuyển trạng thái AIJob                          | Tranh chấp giữa nhiều worker                         |
| Cắt chunk ở biên                                 | Tài liệu 1 trang, tài liệu rỗng, tài liệu 300 trang  |

### 15.3 Tám kịch bản E2E

1. Đăng ký → xác nhận vào được dashboard
2. Đăng nhập sai 5 lần → bị rate limit
3. Tạo Course → upload PDF → chờ trích xuất xong
4. Chạy AI Job (LLM đã mock) → thấy tiến độ → thấy bài học xuất hiện
5. Mở bài học → làm bài tập → nộp → thấy điểm và giải thích
6. Hoàn thành bài → tiến độ Course tăng đúng
7. Người dùng Free chạm hạn mức → thấy thông báo nâng cấp
8. Admin đăng nhập → xem được danh sách AI Job

### 15.4 Kiểm thử với LLM

**Không gọi LLM thật trong CI** — chậm, tốn tiền, và không cho kết quả ổn định.

`[QĐ]` Ba chế độ:

| Chế độ   | Cách hoạt động                            | Dùng khi                  |
| -------- | ----------------------------------------- | ------------------------- |
| `mock`   | Trả về fixture JSON cố định               | CI, unit test, E2E        |
| `record` | Gọi thật rồi ghi response vào `fixtures/` | Cập nhật fixture thủ công |
| `live`   | Gọi thật                                  | Dev và production         |

Bộ đánh giá chất lượng AI chạy tách riêng khỏi CI: 20 tài liệu mẫu, chấm theo 5 tiêu chí
(đúng cấu trúc, bám tài liệu, câu hỏi hợp lệ, ngôn ngữ đúng, độ dài hợp lý), ghi kết quả vào
`docs/ai-eval/`. Chạy lại mỗi khi đổi prompt hoặc đổi model, so với lần trước.

---

## 16. DevOps, môi trường và CI/CD

### 16.1 Môi trường

| Môi trường   | Mục đích                         | Dữ liệu     | Billing                |
| ------------ | -------------------------------- | ----------- | ---------------------- |
| `local`      | Phát triển                       | Seed        | `demo`                 |
| `preview`    | Mỗi PR một bản                   | Seed        | `demo`                 |
| `staging`    | Nghiệm thu trước khi phát hành   | Ẩn danh hoá | test key               |
| `production` | Người dùng thật / demo công khai | Thật        | theo quyết định ở 11.4 |

### 16.2 Chạy môi trường local

```bash
git clone <repo> && cd learn
cp .env.example .env          # điền LLM_API_KEY
npm install
docker compose -f infra/docker-compose.yml up -d   # postgres · redis · minio
npm run db:migrate
npm run db:seed
npm run dev                   # web :3000 · api :4000 · worker
```

`docker-compose.yml` phải chạy được trên máy sạch, không cần cài thêm gì ngoài Docker và Node.
Đây cũng là tiêu chí trong Definition of Done của spec — hướng dẫn build và deploy phải có tài liệu.

### 16.3 Pipeline CI

```
PR mở
 ├── lint        eslint + prettier check                    ~1 phút
 ├── typecheck   tsc --noEmit cho toàn bộ workspace          ~2 phút
 ├── test:unit   vitest                                      ~2 phút
 ├── test:int    vitest + testcontainers postgres            ~4 phút
 ├── build       next build + nest build                     ~3 phút
 ├── audit       npm audit --audit-level=high                ~1 phút
 └── e2e         playwright (chỉ PR vào main)                ~6 phút
```

Quy tắc: **CI đỏ thì không merge.** Không có ngoại lệ, không "để sửa sau".

### 16.4 Triển khai

| Thành phần    | Nơi chạy                        | Ghi chú                                              |
| ------------- | ------------------------------- | ---------------------------------------------------- |
| `apps/web`    | Vercel hoặc container           | Marketing site dùng SSG, web app dùng SSR            |
| `apps/api`    | Container (Railway / Fly / ECS) | ≥ 2 instance khi có traffic thật                     |
| `apps/worker` | Container riêng                 | Scale độc lập với API — đây là lý do tách tiến trình |
| PostgreSQL    | Dịch vụ quản lý                 | Bật backup tự động                                   |
| Redis         | Dịch vụ quản lý                 | Bật persistence để job không mất khi restart         |
| Storage       | S3 / R2                         | Bucket **không public**                              |

Thứ tự deploy an toàn: **migration → worker → api → web**. Worker lên trước để không có job nào
rơi vào phiên bản code cũ.

Rollback: giữ 3 phiên bản image gần nhất. Migration phá vỡ tương thích phải làm ba bước
(mục 6.4) để rollback không làm hỏng dữ liệu.

---

## 17. Observability và vận hành

### 17.1 Log

JSON có cấu trúc, một dòng một sự kiện. Mỗi dòng bắt buộc có:
`timestamp` · `level` · `requestId` · `userId` (nếu có) · `message` · `context`.

**Không bao giờ log:** mật khẩu, token, toàn văn tài liệu người dùng, nội dung prompt đầy đủ
có chứa dữ liệu cá nhân.

`requestId` đi xuyên suốt: HTTP request → job trong queue → lần gọi LLM. Không có nó thì không thể
trả lời câu hỏi _"vì sao bài học của người dùng này bị hỏng"_.

### 17.2 Chỉ số cần theo dõi

| Nhóm     | Chỉ số                                          | Ngưỡng cảnh báo        |
| -------- | ----------------------------------------------- | ---------------------- |
| API      | p95 latency, tỉ lệ lỗi 5xx                      | p95 > 500ms · lỗi > 1% |
| Queue    | Độ dài hàng đợi, thời gian chờ                  | chờ > 5 phút           |
| AI Job   | Tỉ lệ thành công, thời gian chạy, tỉ lệ retry   | thành công < 90%       |
| AI Job   | Tỉ lệ Lesson bị gắn `LOW_CONFIDENCE`            | > 20%                  |
| Chi phí  | USD/ngày, USD trung bình mỗi job                | vượt ngân sách ngày    |
| Database | Kết nối đang dùng, truy vấn chậm                | > 80% pool             |
| Business | Đăng ký mới, Course tạo mới, bài học hoàn thành | —                      |

### 17.3 Runbook sự cố

| Triệu chứng                    | Kiểm tra đầu tiên                                 | Xử lý                                                                           |
| ------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| AI Job kẹt ở `QUEUED`          | Worker còn sống không? Redis kết nối được không?  | Restart worker; job sẽ tự được nhận lại                                         |
| Tỉ lệ AI Job thất bại tăng vọt | Trang trạng thái của LLM provider; log validation | Nếu do provider: bật backoff dài hơn. Nếu do validate: xem có ai vừa đổi prompt |
| Upload thất bại                | Quyền bucket, hạn presigned URL                   | Kiểm tra lệch đồng hồ giữa các máy                                              |
| Webhook không tới              | Log của provider, log `PaymentEvent`              | Dùng CLI của provider gửi lại sự kiện                                           |
| Chi phí LLM tăng đột biến      | `GenerationRun` nhóm theo ngày và theo user       | Kiểm tra vòng lặp retry; siết `AI_JOB_MAX_COST_USD`                             |

---

## 18. Quy ước kỹ thuật

### 18.1 Git

- Nhánh: `main` luôn deploy được. Nhánh việc đặt tên `feat/…`, `fix/…`, `chore/…`, `docs/…`.
- Commit theo Conventional Commits: `feat(course): thêm endpoint sắp xếp lại lesson`.
- Một PR làm một việc. PR quá 400 dòng thay đổi nên tách ra.
- Merge bằng squash, giữ lịch sử `main` sạch.

### 18.2 Đặt tên

| Đối tượng       | Quy ước                        | Ví dụ                         |
| --------------- | ------------------------------ | ----------------------------- |
| Bảng và model   | `PascalCase`, danh từ số ít    | `DocumentChunk`               |
| Cột             | `camelCase`                    | `sourceChunkIds`              |
| Endpoint        | `kebab-case`, danh từ số nhiều | `/ai-jobs/:id/stream`         |
| File TS         | `kebab-case`                   | `lesson-generator.service.ts` |
| Component React | `PascalCase`                   | `LessonProgressCard.tsx`      |
| Biến môi trường | `SCREAMING_SNAKE_CASE`         | `LLM_MODEL_GENERATION`        |
| Enum trong DB   | `SCREAMING_SNAKE_CASE`         | `AI_GENERATION_FAILED`        |

Thuật ngữ nghiệp vụ trong tên phải khớp từ điển ở mục 1.4. Không có `Quiz`, không có `Class`.

### 18.3 Quy ước code

- TypeScript `strict: true`. **Không dùng `any`** — không qua được lint.
- Tầng: `controller` (HTTP) → `service` (nghiệp vụ) → `repository` (dữ liệu). Không nhảy tầng.
- Controller không chứa logic nghiệp vụ; service không biết gì về HTTP.
- Mọi input ngoài hệ thống đi qua Zod, kể cả response của LLM.
- Lỗi ném ra là exception có kiểu, được filter toàn cục chuyển sang định dạng ở 7.3.
- Comment giải thích **vì sao**, không giải thích **cái gì**. Code tự nói được cái gì.

### 18.4 Architecture Decision Records

Mỗi quyết định `[QĐ]` đáng kể ghi một file trong `docs/adr/` theo mẫu:

```markdown
# ADR-007: Tách outline và nội dung thành hai lần gọi LLM

Trạng thái: Đã chấp nhận · 2026-10-20

## Bối cảnh

...

## Quyết định

...

## Hệ quả

Tốt: ... | Xấu: ... | Sẽ xem lại khi: ...
```

Các ADR đầu tiên cần viết: TypeScript toàn bộ thay vì Python worker · Monorepo · Tách outline ·
Webhook là nguồn sự thật về thanh toán · Áp quyền sở hữu ở tầng repository.

Những ADR này chính là nội dung cho section 12 của portfolio website. Viết luôn khi ra quyết định
sẽ rẻ hơn nhiều so với dựng lại từ trí nhớ sau ba tháng.

### 18.5 Checklist review PR

- [ ] CI xanh toàn bộ
- [ ] Có test cho hành vi mới; test thất bại trước khi sửa, xanh sau khi sửa
- [ ] Không có `any`, không có `console.log` sót lại, không có code chết
- [ ] Truy vấn dữ liệu có lọc quyền sở hữu
- [ ] Không lộ đáp án đúng ra response
- [ ] Lỗi trả về đúng định dạng mục 7.3 với `code` ổn định
- [ ] Có xử lý đủ 5 trạng thái UI nếu là màn hình có dữ liệu
- [ ] Không có secret, không có URL production hardcode
- [ ] **Thay đổi này có tạo ra tuyên bố nào về sản phẩm mà code chưa làm được không?** `[SPEC]`
- [ ] Nếu đổi schema: có migration, và migration chạy được cả chiều tiến lẫn rollback
- [ ] Nếu đổi prompt: đã tăng version prompt và chạy lại bộ đánh giá

---

## 19. Timeline và milestone

### 19.1 Giả định

- **1 lập trình viên full-stack**, khoảng 30 giờ/tuần. Hai người song song rút được khoảng 35%,
  không phải 50% — phần lớn công việc có phụ thuộc tuần tự.
- Ngày bắt đầu giả định **2026-09-14**. Đổi ngày bắt đầu thì dịch toàn bộ mốc theo.
- Đã có sẵn tài khoản LLM provider và tài khoản thanh toán ở chế độ test.
- Con số là ước lượng, không phải cam kết. Mốc rủi ro nhất là **M3**.

### 19.2 Lịch tổng thể

| Tuần | Ngày          | Nội dung chính                                              | Mốc    |
| ---- | ------------- | ----------------------------------------------------------- | ------ |
| T0   | 14/09 – 20/09 | Khởi tạo repo, monorepo, docker, CI, schema đầu tiên        | **M0** |
| T1   | 21/09 – 27/09 | Auth backend + frontend, bảo vệ route                       |        |
| T2   | 28/09 – 04/10 | Hồ sơ, phiên, rate limit, khung UI                          | **M1** |
| T3   | 05/10 – 11/10 | CRUD Course, dashboard                                      |        |
| T4   | 12/10 – 18/10 | Upload tài liệu, storage, trích xuất, chunking              | **M2** |
| T5   | 19/10 – 25/10 | Queue, worker, khung AIJob, SSE tiến độ                     |        |
| T6   | 26/10 – 01/11 | Sinh outline, sinh lesson, structured output                |        |
| T7   | 02/11 – 08/11 | Bốn tầng validation, retry, ghi chi phí, sửa bài học        | **M3** |
| T8   | 09/11 – 15/11 | Màn đọc bài, làm bài tập, chấm điểm                         |        |
| T9   | 16/11 – 22/11 | Tiến trình, lịch sử, dashboard số liệu                      | **M4** |
| T10  | 23/11 – 29/11 | Plan, subscription, hạn mức, thanh toán                     |        |
| T11  | 30/11 – 06/12 | Trang admin, số liệu chi phí, chạy lại job                  | **M5** |
| T12  | 07/12 – 13/12 | Portfolio: hero, problem, users, value, features            |        |
| T13  | 14/12 – 20/12 | Portfolio: pipeline, kiến trúc, DB/API, quyết định kỹ thuật |        |
| T14  | 21/12 – 27/12 | Ảnh chụp UI, đánh bóng, a11y, deploy, video demo            | **M6** |

```
T0  T1  T2  T3  T4  T5  T6  T7  T8  T9  T10 T11 T12 T13 T14
│   │   │   │   │   │   │   │   │   │   │   │   │   │   │
M0  ────M1  ────M2  ────────M3  ────M4  ────M5  ────────M6
Nền  Auth  Course  ⚠ AI Pipeline  Học  Billing  Portfolio
     tảng  + Tài liệu  (rủi ro)   tập  + Admin   Website
```

### 19.3 Chi tiết từng mốc

---

#### M0 — Nền tảng sẵn sàng · hết T0 · 20/09

**Mục tiêu:** máy mới clone về và chạy được trong 10 phút.

**Bàn giao:** monorepo, docker-compose, Prisma schema v1, CI chạy, `.env.example`, README.

**Tiêu chí ra mốc**

- [ ] `npm run dev` khởi động cả web, api, worker không lỗi
- [ ] `docker compose up` dựng được postgres, redis, minio
- [ ] Migration chạy sạch trên database rỗng
- [ ] CI xanh trên PR đầu tiên
- [ ] `/health` trả 200 và `/health/ready` kiểm tra đủ ba phụ thuộc

---

#### M1 — Xác thực hoạt động · hết T2 · 04/10

**Mục tiêu:** người dùng đăng ký, đăng nhập, và thấy dashboard rỗng của mình.

**Bàn giao:** 8 endpoint auth, trang login/register, bảo vệ route, khung layout web app.

**Tiêu chí ra mốc**

- [ ] Đăng ký → đăng nhập → refresh → đăng xuất chạy đúng
- [ ] Refresh token có xoay vòng, dùng lại token cũ thì cả family bị thu hồi
- [ ] Route cần đăng nhập chuyển hướng về login và quay lại đúng trang sau khi vào
- [ ] Rate limit đăng nhập hoạt động
- [ ] Mật khẩu băm bằng argon2id, không lưu dạng thô ở bất cứ đâu
- [ ] Có test integration cho toàn bộ luồng auth

---

#### M2 — Tài liệu vào được hệ thống · hết T4 · 18/10

**Mục tiêu:** tải PDF lên, hệ thống trích được text và cắt thành chunk.

**Bàn giao:** CRUD Course, upload bằng presigned URL, worker trích xuất, hiển thị trạng thái.

**Tiêu chí ra mốc**

- [ ] Tạo, sửa, xoá, liệt kê Course; xoá là soft delete
- [ ] Upload PDF 10MB thành công qua presigned URL
- [ ] Kiểm tra magic bytes chạy ở worker và chặn được file giả phần mở rộng
- [ ] Trích xuất tạo ra chunk có `headingPath` và số trang
- [ ] PDF scan được nhận diện và chuyển sang OCR
- [ ] Tài liệu lỗi hiển thị thông báo rõ ràng + nút thử lại
- [ ] Trạng thái tài liệu cập nhật theo thời gian thực trên UI
- [ ] Đã chạy thử với **ít nhất 10 PDF thật, đa dạng** — không chỉ file mẫu đẹp

---

#### M3 — AI sinh bài học chạy end-to-end · hết T7 · 08/11 ⚠️ MỐC RỦI RO NHẤT

**Mục tiêu:** từ một PDF thật, hệ thống sinh ra bài học và bài tập dùng được.

**Bàn giao:** queue, worker sinh nội dung, 4 tầng validation, SSE tiến độ, ghi chi phí, sửa bài học.

**Tiêu chí ra mốc**

- [ ] Bấm "Sinh bài học" → trả 202 ngay, không chặn request
- [ ] SSE đẩy tiến độ; có fallback polling khi SSE bị chặn
- [ ] Outline và lesson là **hai lần gọi LLM tách biệt**
- [ ] Output không đúng schema bị từ chối và thử lại đúng số lần quy định
- [ ] Bốn tầng validation đều có test
- [ ] Lesson `LOW_CONFIDENCE` được gắn cờ và hiển thị cảnh báo trên UI
- [ ] Ghi Lesson trong một transaction — job hỏng giữa chừng không để lại dữ liệu rác
- [ ] `GenerationRun` ghi đủ token, chi phí, độ trễ, version prompt
- [ ] Job vượt trần chi phí bị dừng
- [ ] Người dùng sửa được nội dung Lesson và sắp xếp lại thứ tự
- [ ] **Bộ đánh giá 20 tài liệu chạy xong, có kết quả ghi trong `docs/ai-eval/`**

**Vì sao đây là mốc rủi ro nhất:** chất lượng đầu ra của LLM không kiểm soát trực tiếp được,
và chất lượng trích xuất PDF thay đổi rất nhiều theo tài liệu. Dành sẵn **1 tuần đệm**.
Nếu hết T7 mà bộ đánh giá chưa đạt, ưu tiên thu hẹp phạm vi (chỉ hỗ trợ PDF có text layer)
thay vì kéo dài mốc.

---

#### M4 — Vòng học khép kín · hết T9 · 22/11

**Mục tiêu:** người dùng học xong một bài và thấy tiến độ tăng lên.

**Bàn giao:** màn đọc bài, làm bài tập, chấm điểm, feedback, tiến trình, lịch sử.

**Tiêu chí ra mốc**

- [ ] Đọc bài học render Markdown đã sanitize
- [ ] Làm được đủ 4 loại câu hỏi
- [ ] **Đáp án đúng không có trong response trước khi nộp** — kiểm tra bằng DevTools
- [ ] Chấm điểm đúng, có test cho mọi loại câu hỏi
- [ ] Sau khi nộp: hiện điểm, đúng/sai từng câu, giải thích
- [ ] Làm lại được, lưu `attemptNo`, giữ điểm cao nhất
- [ ] Tiến độ Course tính đúng và cập nhật ngay
- [ ] Lịch sử học có phân trang
- [ ] **Luồng lõi của spec chạy trọn vẹn từ đăng ký đến theo dõi tiến trình**

---

#### M5 — SaaS hoàn chỉnh · hết T11 · 06/12

**Mục tiêu:** có gói dịch vụ, có hạn mức, có trang quản trị.

**Bàn giao:** Plan, Subscription, hạn mức, thanh toán (thật hoặc demo), 5 trang admin.

**Tiêu chí ra mốc**

- [ ] Trang giá lấy dữ liệu từ DB, gói Team gắn nhãn `Mở rộng tương lai`
- [ ] Hạn mức chặn đúng ở cả bốn chỉ số, báo lỗi kèm số liệu cụ thể
- [ ] Tăng bộ đếm là thao tác nguyên tử, có test điều kiện tranh chấp
- [ ] Checkout **không nhận giá từ client**
- [ ] Webhook xác minh chữ ký, ghi `PaymentEvent`, chống xử lý trùng
- [ ] Nếu dùng chế độ demo: UI có băng rôn nói rõ đây là demo
- [ ] Admin xem được user, course, AI job, subscription, chi phí LLM
- [ ] Admin chạy lại được job thất bại
- [ ] Trang admin chặn `LEARNER` — có test

---

#### M6 — Portfolio hoàn chỉnh và công khai · hết T14 · 27/12

**Mục tiêu:** website đạt toàn bộ Definition of Done của spec, demo chạy công khai.

**Bàn giao:** 14 section, sơ đồ kiến trúc, ảnh UI thật, video demo, deploy, README.

**Tiêu chí ra mốc:** xem checklist đầy đủ ở **mục 20.7**.

### 19.4 Lộ trình rút gọn — 6 tuần

Nếu chỉ cần một portfolio thuyết phục mà không cần sản phẩm production:

| Tuần | Nội dung                                                 |
| ---- | -------------------------------------------------------- |
| 1    | M0 + auth tối giản (không refresh rotation, không admin) |
| 2    | Course + upload + trích xuất, **chỉ PDF có text layer**  |
| 3    | AI pipeline: outline + lesson + validation tầng 1 và 2   |
| 4    | Đọc bài, làm bài tập, chấm điểm, tiến độ                 |
| 5–6  | Portfolio website đầy đủ 14 section                      |

**Cắt bỏ:** OCR, PPTX/DOCX, thanh toán thật (chỉ hiển thị bảng giá), trang admin, sửa bài học,
tầng validation 3 và 4, đa số test integration.

**Điều kiện bắt buộc khi rút gọn `[SPEC]`:** những phần bị cắt phải được gắn nhãn đúng trên website
(`Đang phát triển` / `Đã lên kế hoạch`). Cắt phạm vi thì được; trình bày thứ chưa làm như đã làm
thì không.

---

## 20. Checklist triển khai

Checklist này là bản đầy đủ, dùng để theo dõi tiến độ thực tế. Mục 20.7 là Definition of Done
lấy nguyên từ spec — đây là thứ quyết định dự án có được coi là hoàn thành hay không.

### 20.1 Giai đoạn 0 — Khởi tạo

**Repo và công cụ**

- [ ] `git init`, thêm `.gitignore`, `.editorconfig`, `.nvmrc`
- [ ] Dựng monorepo theo cấu trúc mục 4.4
- [ ] Cấu hình TypeScript `strict` dùng chung ở `packages/config`
- [ ] ESLint + Prettier + husky + lint-staged
- [ ] `.env.example` đủ mọi biến ở mục 22.1, giá trị để rỗng
- [ ] README: mô tả dự án, yêu cầu hệ thống, các bước chạy local

**Hạ tầng dev**

- [ ] `infra/docker-compose.yml`: postgres 16, redis 7, minio
- [ ] Tự tạo bucket MinIO khi khởi động
- [ ] Script `db:migrate`, `db:seed`, `db:reset`

**Database**

- [ ] Prisma schema đủ 18 model ở mục 6.2
- [ ] Migration đầu tiên chạy sạch trên DB rỗng
- [ ] Seed: 2 Plan, 1 admin, 1 learner demo có dữ liệu mẫu
- [ ] Index đã tạo đúng như khai báo

**CI**

- [ ] Workflow: lint · typecheck · test · build · audit
- [ ] Yêu cầu CI xanh mới merge được vào `main`

### 20.2 Giai đoạn 1 — Authentication `[SPEC]` 6.1

**Backend**

- [ ] `POST /auth/register` — kiểm tra email trùng, độ mạnh mật khẩu
- [ ] `POST /auth/login`
- [ ] `POST /auth/refresh` có xoay vòng token
- [ ] `POST /auth/logout` và `/auth/logout-all`
- [ ] `GET /auth/me` trả hồ sơ + gói + hạn mức còn lại
- [ ] `PATCH /auth/me`
- [ ] `POST /auth/change-password` thu hồi các phiên khác
- [ ] Băm argon2id đúng tham số ở 10.1
- [ ] Phát hiện tái sử dụng refresh token, thu hồi cả family
- [ ] Rate limit đăng nhập 5 lần/phút/IP
- [ ] Guard cho `ADMIN`

**Frontend**

- [ ] Trang đăng ký, đăng nhập, quên mật khẩu
- [ ] Lưu access token trong memory, gọi refresh khi khởi động app
- [ ] Bảo vệ route, chuyển hướng có nhớ trang đích
- [ ] Layout web app: sidebar, header, menu người dùng
- [ ] Tự động refresh khi nhận 401, thử lại request một lần

### 20.3 Giai đoạn 2 — Course và Document `[SPEC]` 6.2, 6.3

**Course**

- [ ] Đủ 6 endpoint ở mục 7.2
- [ ] Kiểm tra hạn mức khi tạo
- [ ] Lọc quyền sở hữu ở tầng repository
- [ ] Trang danh sách Course có tiến độ tóm tắt
- [ ] Trang chi tiết Course: tài liệu, bài học, job gần nhất
- [ ] Empty state dùng mascot Circle — `CircleMascot/svg/states/sleeping.svg`

**Document**

- [ ] Cấp presigned URL có kiểm tra hạn mức và định dạng
- [ ] Endpoint xác nhận upload → đẩy job trích xuất
- [ ] Kiểm tra magic bytes **ở worker**
- [ ] Chặn trùng bằng checksum trong cùng Course
- [ ] Giới hạn kích thước và số trang
- [ ] Upload có thanh tiến độ, có huỷ được
- [ ] Hiển thị trạng thái tài liệu thời gian thực
- [ ] Trạng thái lỗi có thông điệp rõ và nút thử lại
- [ ] Xoá tài liệu xoá cả file trên storage

**Trích xuất và chunking**

- [ ] Trích PDF có text layer
- [ ] Nhận diện PDF scan và chuyển OCR
- [ ] Hỗ trợ PPTX, DOCX, TXT, MD
- [ ] Chuẩn hoá: bỏ header/footer lặp, nối từ gạch nối, bỏ mục lục
- [ ] Nhận diện heading, ghi `headingPath`
- [ ] Cắt chunk 1200 token, chồng lấn 150, tôn trọng ranh giới câu
- [ ] Ghi khoảng trang cho mỗi chunk
- [ ] Test biên: file rỗng, 1 trang, 300 trang, không có text

### 20.4 Giai đoạn 3 — AI Pipeline `[SPEC]` 6.4

**Hạ tầng job**

- [ ] BullMQ với 4 queue ở mục 9.1
- [ ] Worker chạy tiến trình riêng
- [ ] Chuyển trạng thái AIJob bằng update có điều kiện
- [ ] Retry có backoff mũ
- [ ] Dead-letter queue + trang admin xem được
- [ ] Job định kỳ ở mục 9.3
- [ ] Tắt worker êm (chờ job hiện tại xong)

**Sinh nội dung**

- [ ] Interface `LlmProvider` + adapter cho nhà cung cấp
- [ ] Prompt lưu thành file, có version
- [ ] Sinh outline — một lần gọi
- [ ] Sinh lesson + exercise — song song tối đa 3
- [ ] Dùng structured output của nhà cung cấp
- [ ] Timeout 120s mỗi lần gọi, 15 phút mỗi job
- [ ] Trần chi phí mỗi job
- [ ] Ghi `GenerationRun` cho mọi lần gọi

**Validation — bốn tầng**

- [ ] Tầng 1: Zod schema
- [ ] Tầng 2: luật nghiệp vụ ở bảng mục 8.4
- [ ] Tầng 3: kiểm tra bám nguồn, gắn cờ `LOW_CONFIDENCE`
- [ ] Tầng 4: sanitize Markdown, cắt độ dài
- [ ] Retry có phản hồi lỗi cụ thể vào prompt lần sau
- [ ] Ghi Lesson trong một transaction
- [ ] Thành công một phần: giữ phần tốt, ghi `partialFailures`

**Giao diện tiến độ**

- [ ] SSE `/ai-jobs/:id/stream` có heartbeat
- [ ] Fallback polling 3 giây
- [ ] UI hiện phần trăm + nhãn bước + mascot Circle `CircleMascot/svg/states/working.svg`
- [ ] Huỷ job được
- [ ] Trạng thái lỗi dùng mascot Circle `CircleMascot/svg/states/alerting.svg`, có nút thử lại

**Sửa nội dung — C-01, C-02**

- [ ] Sửa `contentMd` của Lesson
- [ ] Sắp xếp lại thứ tự Lesson
- [ ] Đánh dấu `editedByUserAt` khi người dùng sửa
- [ ] Xoá Lesson

### 20.5 Giai đoạn 4 — Học tương tác và tiến trình `[SPEC]` 6.5, 6.6

- [ ] Trang đọc bài, render Markdown đã sanitize
- [ ] Mục lục trong bài với tài liệu dài
- [ ] Đủ 4 loại câu hỏi có UI riêng
- [ ] **DTO đọc bài loại bỏ `correctAnswer` và `isCorrect`**
- [ ] Nộp bài chấm điểm phía server
- [ ] Hiện điểm, đúng/sai từng câu, giải thích sau khi nộp
- [ ] Làm lại, ghi `attemptNo`, giữ điểm cao nhất
- [ ] Đánh dấu bắt đầu và hoàn thành bài
- [ ] Mascot Circle `CircleMascot/svg/states/celebrate.svg` khi hoàn thành
- [ ] Tiến độ Course cập nhật ngay
- [ ] Dashboard: số Course, bài đã xong, điểm trung bình
- [ ] Lịch sử học có phân trang
- [ ] Test cho mọi nhánh chấm điểm

### 20.6 Giai đoạn 5 — Subscription và Admin `[SPEC]` 6.7, 6.8

**Gói và hạn mức**

- [ ] `GET /plans` công khai
- [ ] Trang giá lấy dữ liệu từ DB, gói Team gắn nhãn tương lai
- [ ] Hạn mức lưu trong `Plan.limits`, không hardcode
- [ ] Chặn đúng ở cả 4 chỉ số
- [ ] Tăng bộ đếm nguyên tử, có test tranh chấp
- [ ] Lỗi 402 kèm `limit` và `used`
- [ ] UI hiện mức dùng còn lại trong settings
- [ ] Chạm hạn mức → gợi ý nâng cấp

**Thanh toán**

- [ ] Checkout chỉ nhận `planCode`, giá lấy từ DB `[SPEC]`
- [ ] Webhook xác minh chữ ký
- [ ] Ghi `PaymentEvent` trước khi xử lý, chống trùng theo `eventId`
- [ ] Cập nhật Subscription theo webhook, không theo trang redirect
- [ ] Trang "thành công" chỉ poll, không tự kích hoạt gói
- [ ] Huỷ ở cuối kỳ
- [ ] Chế độ demo có băng rôn cảnh báo rõ ràng

**Admin**

- [ ] 5 trang: users, courses, ai-jobs, subscriptions, metrics
- [ ] Bảng AI Job có lọc trạng thái và hiện tỉ lệ thất bại
- [ ] Chạy lại job thất bại
- [ ] Biểu đồ chi phí LLM theo ngày
- [ ] Toàn bộ trang admin chặn `LEARNER`, có test
- [ ] Hành động của admin ghi `AuditLog`

### 20.7 Giai đoạn 6 — Definition of Done của spec `[SPEC]`

Đây là checklist nghiệm thu chính thức, chép từ mục 16 của spec.

**Truyền đạt sản phẩm**

- [ ] Tên sản phẩm hiển thị rõ ràng
- [ ] Phát biểu vấn đề tường minh
- [ ] Nhóm người dùng mục tiêu được xác định
- [ ] Giá trị sản phẩm dễ hiểu
- [ ] Phạm vi MVP được định nghĩa rõ
- [ ] Các tính năng chính được trình bày
- [ ] Có CTA demo
- [ ] Thông tin GitHub / dự án truy cập được

**Truyền đạt kỹ thuật**

- [ ] Có sơ đồ kiến trúc
- [ ] AI pipeline được giải thích
- [ ] Các module backend chính được nêu tên
- [ ] Các entity database được tài liệu hoá
- [ ] Auth và billing được giải thích ở mức tổng quan
- [ ] Phần đã làm được phân biệt rõ với roadmap

**UI và UX**

- [ ] Responsive trên desktop và mobile
- [ ] Điều hướng hoạt động
- [ ] Nút CTA hoạt động
- [ ] Kiểu chữ dễ đọc
- [ ] Độ tương phản đủ
- [ ] Animation không cản trở sử dụng
- [ ] Không tràn ngang trên màn hình nhỏ

**Chất lượng kỹ thuật**

- [ ] Code có tổ chức
- [ ] Component tái sử dụng được
- [ ] Nội dung dễ cập nhật
- [ ] Không lộ secret
- [ ] Không có tuyên bố sản phẩm thiếu căn cứ
- [ ] Hướng dẫn build và deploy có tài liệu

**Bổ sung của đội `[QĐ]`**

- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95 trên trang marketing
- [ ] Ảnh chụp UI là ảnh **thật**, lấy từ ứng dụng đang chạy
- [ ] Video demo 60–90 giây quay luồng lõi
- [ ] Tài khoản dùng thử hoạt động và được reset định kỳ
- [ ] `logo/lockup-horizontal.svg` đã convert chữ thành outline (mục 13.4)
- [ ] README có hướng dẫn chạy local đã kiểm chứng trên máy sạch
- [ ] Ít nhất 5 ADR đã viết trong `docs/adr/`

### 20.8 Tiêu chí thành công cuối cùng `[SPEC]`

Website thành công nếu người xem hiểu được **trong một lần ghé thăm ngắn**:

1. LEARN là gì
2. Nó giải quyết vấn đề gì
3. Ai dùng nó
4. Vì sao nó có giá trị
5. MVP gồm những gì
6. AI pipeline hoạt động ra sao
7. Công nghệ và kiến trúc nào đứng sau
8. Xem hoặc dùng thử bằng cách nào

Và website phải truyền đạt được đồng thời hai thông điệp:

> Đây là một sản phẩm hữu ích.

và

> Đây là một hệ thống phần mềm được thiết kế cẩn thận.

**Cách kiểm chứng:** đưa website cho 3 người chưa biết gì về dự án — một người không chuyên
kỹ thuật, một lập trình viên, một người từng tuyển dụng. Cho mỗi người 3 phút, rồi hỏi 8 câu trên.
Câu nào không trả lời được là câu website chưa làm tốt.

---

## 21. Rủi ro và giảm thiểu

| #   | Rủi ro                                                        | Khả năng   | Mức độ       | Giảm thiểu                                                                                                                                                 |
| --- | ------------------------------------------------------------- | ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Chất lượng bài học AI sinh không dùng được**                | Cao        | Nghiêm trọng | Tách outline khỏi nội dung; 4 tầng validation; bộ đánh giá 20 tài liệu chạy sớm từ T6; cho người dùng sửa bài (C-01); gắn cờ `LOW_CONFIDENCE` thay vì giấu |
| R2  | **Trích xuất PDF kém với tài liệu thật**                      | Cao        | Nghiêm trọng | Thử 10+ PDF thật ngay ở M2, không đợi đến M3; có sẵn tiêu chí và lối thoát sang parser Python (5.2); sẵn sàng thu hẹp còn PDF có text layer                |
| R3  | Chi phí LLM vượt dự tính                                      | Trung bình | Vừa          | Ghi `GenerationRun` từ đầu; trần chi phí mỗi job; hạn mức theo gói; dùng model rẻ cho việc nhẹ                                                             |
| R4  | Mốc M3 trượt kéo theo toàn bộ lịch                            | Trung bình | Nghiêm trọng | Đã dành 1 tuần đệm; lộ trình rút gọn ở 19.4 là phương án B; Track A không phụ thuộc hoàn toàn vào M3                                                       |
| R5  | OCR quá chậm, job timeout                                     | Trung bình | Vừa          | Giới hạn 50 trang scan ở MVP; báo lỗi rõ ràng thay vì treo; tách queue riêng nếu cần                                                                       |
| R6  | Rate limit của LLM provider chặn khi demo                     | Thấp       | Vừa          | Backoff mũ; giới hạn song song 3; chuẩn bị sẵn dữ liệu demo đã sinh trước                                                                                  |
| R7  | Phạm vi phình ra (thêm tính năng ngoài MVP)                   | Cao        | Vừa          | Mục 3.2 là danh sách chốt; mọi đề xuất mới phải vào roadmap, không vào sprint đang chạy                                                                    |
| R8  | Website tuyên bố quá đà so với code                           | Trung bình | Nghiêm trọng | Dòng cuối trong checklist review PR (18.5); dùng đúng 4 nhãn trạng thái; kiểm chứng bằng 3 người ở 20.8                                                    |
| R9  | Lộ đáp án đúng ra client                                      | Trung bình | Nghiêm trọng | DTO riêng cho hai chế độ đọc; test E2E kiểm tra response không chứa đáp án                                                                                 |
| R10 | Webhook thanh toán xử lý trùng                                | Trung bình | Nghiêm trọng | `PaymentEvent` unique theo `eventId`; ghi trước khi xử lý; có test                                                                                         |
| R11 | Một người làm, nghỉ ốm là dừng dự án                          | Trung bình | Vừa          | Tài liệu này; ADR ghi ngay khi quyết định; không để kiến thức chỉ nằm trong đầu                                                                            |
| R12 | Mascot Circle lạm dụng quá mức làm loãng tông portfolio kỹ sư | Thấp       | Nhỏ          | Chỉ dùng ở hero, empty state, tiến độ AI Job và trạng thái lỗi (13.4)                                                                                      |

**Ba rủi ro đáng lo nhất là R1, R2 và R4 — cả ba đều xoay quanh AI pipeline.**
Vì vậy nguyên tắc lập lịch quan trọng nhất: **chạy thử pipeline với tài liệu thật càng sớm càng tốt.**
Đừng đợi đến khi giao diện đẹp mới thử — hãy chạy một script thô ở T4 để biết sự thật.

---

## 22. Phụ lục

### 22.1 Biến môi trường

| Biến                      | Ví dụ                       | Bắt buộc   | Ghi chú                           |
| ------------------------- | --------------------------- | ---------- | --------------------------------- |
| `NODE_ENV`                | `development`               | ✓          |                                   |
| `APP_URL`                 | `http://localhost:3000`     | ✓          | Dùng cho CORS và link trong email |
| `API_URL`                 | `http://localhost:4000`     | ✓          |                                   |
| `DATABASE_URL`            | `postgresql://...`          | ✓          |                                   |
| `REDIS_URL`               | `redis://localhost:6379`    | ✓          |                                   |
| `JWT_ACCESS_SECRET`       | —                           | ✓          | ≥ 32 byte ngẫu nhiên              |
| `JWT_ACCESS_TTL`          | `15m`                       |            |                                   |
| `REFRESH_TOKEN_TTL_DAYS`  | `30`                        |            |                                   |
| `S3_ENDPOINT`             | `http://localhost:9000`     | ✓          | MinIO khi dev                     |
| `S3_BUCKET`               | `learn-documents`           | ✓          |                                   |
| `S3_ACCESS_KEY_ID`        | —                           | ✓          |                                   |
| `S3_SECRET_ACCESS_KEY`    | —                           | ✓          |                                   |
| `S3_REGION`               | `us-east-1`                 |            |                                   |
| `LLM_PROVIDER`            | `anthropic`                 | ✓          |                                   |
| `LLM_API_KEY`             | —                           | ✓          | **Không commit**                  |
| `LLM_MODEL_GENERATION`    | `claude-sonnet-5`           | ✓          |                                   |
| `LLM_MODEL_FAST`          | `claude-haiku-4-5-20251001` |            |                                   |
| `LLM_MODE`                | `live`                      |            | `live` · `mock` · `record`        |
| `AI_JOB_MAX_COST_USD`     | `0.50`                      |            | Trần chi phí mỗi job              |
| `AI_JOB_TIMEOUT_MS`       | `900000`                    |            | 15 phút                           |
| `AI_MAX_CONCURRENT_CALLS` | `3`                         |            |                                   |
| `UPLOAD_MAX_BYTES`        | `26214400`                  |            | 25 MB                             |
| `UPLOAD_MAX_PAGES`        | `300`                       |            |                                   |
| `OCR_MAX_PAGES`           | `50`                        |            |                                   |
| `BILLING_MODE`            | `demo`                      | ✓          | `demo` · `live`                   |
| `STRIPE_SECRET_KEY`       | —                           | khi `live` |                                   |
| `STRIPE_WEBHOOK_SECRET`   | —                           | khi `live` |                                   |
| `LOG_LEVEL`               | `info`                      |            |                                   |
| `SENTRY_DSN`              | —                           |            | Tuỳ chọn                          |

**Không bao giờ commit `.env`.** `.env.example` chỉ chứa tên biến với giá trị rỗng hoặc giá trị
giả rõ ràng.

### 22.2 Lệnh thường dùng

```bash
npm run dev              # chạy web + api + worker
npm run dev:api          # chỉ api
npm run dev:worker       # chỉ worker

npm run db:migrate       # áp migration
npm run db:reset         # xoá sạch và seed lại — CHỈ DÙNG Ở LOCAL
npm run db:studio        # Prisma Studio

npm run test             # unit
npm run test:int         # integration, cần docker đang chạy
npm run test:e2e         # Playwright
npm run test:ai-eval     # bộ đánh giá chất lượng AI

npm run lint             # eslint + prettier
npm run typecheck        # tsc --noEmit toàn workspace

CircleMascot/svg/sprite.svg  # sprite mascot — dùng qua <use href>
```

### 22.3 Ai chịu trách nhiệm việc gì

Với đội một người thì bảng này là danh sách các "mũ" phải đội. Với đội nhiều người thì đây là
cách chia việc gợi ý.

| Vai trò         | Phụ trách                                      |
| --------------- | ---------------------------------------------- |
| Backend / AI    | Mục 6, 7, 8, 9, 10, 11 — đây là phần nặng nhất |
| Frontend        | Mục 12, 14                                     |
| DevOps          | Mục 16, 17                                     |
| Design / Mascot | Mục 13, 14.2                                   |
| QA              | Mục 15, 20                                     |

### 22.4 Tài liệu tham chiếu

| Tài liệu            | Đường dẫn                                                                         | Vai trò                            |
| ------------------- | --------------------------------------------------------------------------------- | ---------------------------------- |
| Spec sản phẩm       | [`learnflow-ai-portfolio-agent-spec.md`](../learnflow-ai-portfolio-agent-spec.md) | Nguồn của mọi ràng buộc `[SPEC]`   |
| Hướng dẫn mascot    | [`CircleMascot/README.md`](../CircleMascot/README.md)                             | Quy tắc dùng mascot và state       |
| Sprite mascot       | `CircleMascot/svg/sprite.svg`                                                     | Nhúng qua `<use href>`             |
| ADR                 | `docs/adr/`                                                                       | Lý do đằng sau các quyết định      |
| Kết quả đánh giá AI | `docs/ai-eval/`                                                                   | Theo dõi chất lượng theo thời gian |
| Ảnh UI              | `docs/screenshots/`                                                               | Dùng cho portfolio                 |

### 22.5 Lịch sử thay đổi tài liệu

| Phiên bản | Ngày       | Thay đổi     |
| --------- | ---------- | ------------ |
| 1.0       | 2026-09-13 | Bản đầu tiên |

---

_Tài liệu này là bản sống. Khi thực tế lệch khỏi kế hoạch — và nó sẽ lệch — hãy cập nhật tài liệu
thay vì để nó trở thành thứ không ai tin nữa. Mục dễ lỗi thời nhất là timeline ở mục 19 và
các quyết định `[QĐ]` ở mục 5._
