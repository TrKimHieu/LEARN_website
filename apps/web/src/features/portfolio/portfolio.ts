/**
 * Nội dung song ngữ (VI/EN) cho trang portfolio — HANDBOOK §14 + learnflow-ai-portfolio-agent-spec.md.
 * Một nguồn duy nhất, dễ cập nhật: sửa đúng 1 chỗ, cả 2 ngôn ngữ hiển thị nhất quán về cấu trúc.
 */
import type { FeatureLabel } from '@learn/ui';

export interface Bi<T = string> {
  vi: T;
  en: T;
}

export interface NavItem {
  href: string;
  label: Bi;
}

export const NAV: NavItem[] = [
  { href: '#home', label: { vi: 'Trang chủ', en: 'Home' } },
  { href: '#product', label: { vi: 'Sản phẩm', en: 'Product' } },
  { href: '#how-it-works', label: { vi: 'Cách hoạt động', en: 'How It Works' } },
  { href: '#technical', label: { vi: 'Kỹ thuật', en: 'Technical' } },
  { href: '#demo', label: { vi: 'Demo', en: 'Demo' } },
  { href: '#github', label: { vi: 'GitHub', en: 'GitHub' } },
];

export const HERO = {
  eyebrow: { vi: 'AI SaaS · Học tập', en: 'AI SaaS · Learning' },
  title: {
    vi: 'Biến tài liệu của bạn thành bài học tương tác.',
    en: 'Turn your documents into interactive learning.',
  },
  subtitle: {
    vi: 'LEARN chuyển PDF, slide và tài liệu học cá nhân thành khóa học có cấu trúc, bài học tương tác và bài tập luyện tập do AI sinh ra.',
    en: 'LEARN transforms PDFs, slides, and personal study materials into structured courses, interactive lessons, and AI-generated practice activities.',
  },
  ctaPrimary: { vi: 'Dùng thử Demo', en: 'Try the Demo' },
  ctaSecondary: { vi: 'Xem kiến trúc kỹ thuật', en: 'Explore Technical Architecture' },
} satisfies Record<string, Bi>;

export const PROBLEM = {
  eyebrow: { vi: 'Vấn đề', en: 'Problem' },
  title: {
    vi: 'Có tài liệu, nhưng thiếu cách học chủ động',
    en: 'Plenty of material, no way to learn actively',
  },
  intro: {
    vi: 'Người học có nhiều tài liệu — PDF, slide, ghi chép cá nhân — nhưng thiếu cách hiệu quả để biến chúng thành trải nghiệm học có cấu trúc và tương tác.',
    en: 'Learners often have access to a large amount of learning material — PDFs, lecture slides, personal documents — but lack an effective way to transform these resources into structured, engaging learning experiences.',
  },
  points: [
    {
      vi: 'Tài liệu học bị phân mảnh, nằm rải rác nhiều nguồn.',
      en: 'Learning materials are fragmented, scattered across many sources.',
    },
    {
      vi: 'Tài liệu tĩnh rất khó học chủ động — đọc xong không biết mình nhớ được gì.',
      en: 'Static documents are difficult to study actively — you finish reading without knowing what stuck.',
    },
    {
      vi: 'Tự soạn bài học và bài tập từ tài liệu tốn rất nhiều thời gian.',
      en: 'Manually turning material into lessons and exercises is time-consuming.',
    },
    {
      vi: 'Người học khó duy trì tiến độ ổn định vì thiếu cấu trúc và phản hồi.',
      en: 'Learners struggle to maintain consistent progress without structure and feedback.',
    },
  ] satisfies Bi[],
  goal: {
    vi: 'Mục tiêu sản phẩm: chuyển người học từ tiêu thụ nội dung thụ động sang học chủ động.',
    en: 'Product goal: move learners from passive content consumption to active learning.',
  },
} satisfies { eyebrow: Bi; title: Bi; intro: Bi; points: Bi[]; goal: Bi };

export const USERS = {
  eyebrow: { vi: 'Người dùng', en: 'Target Users' },
  title: { vi: 'Xây cho ai', en: 'Who it is for' },
  groups: [
    {
      name: { vi: 'Learner', en: 'Learner' },
      badge: { vi: 'Người dùng chính của MVP', en: 'Primary MVP user' },
      description: {
        vi: 'Sinh viên, người tự học, người học ngoại ngữ, người ôn thi hoặc luyện chứng chỉ kỹ thuật.',
        en: 'University students, self-learners, language learners, and people preparing for exams or technical certifications.',
      },
      needs: [
        {
          vi: 'Tải tài liệu lên và gom thành Course',
          en: 'Upload documents and organize them into a Course',
        },
        {
          vi: 'Để AI tự sinh bài học có cấu trúc',
          en: 'Let AI generate structured lessons automatically',
        },
        {
          vi: 'Luyện tập qua bài tập tương tác, nhận phản hồi',
          en: 'Practice through interactive exercises and get feedback',
        },
        { vi: 'Theo dõi tiến độ học của mình', en: 'Track their own learning progress' },
      ],
    },
    {
      name: { vi: 'Content Creator', en: 'Content Creator' },
      badge: { vi: 'Người dùng phụ', en: 'Secondary user' },
      description: {
        vi: 'Giáo viên, gia sư, người tạo khóa học, chuyên gia trong lĩnh vực.',
        en: 'Teachers, tutors, course creators, and subject-matter experts.',
      },
      needs: [
        {
          vi: 'Tạo Course, tải tài liệu nguồn lên',
          en: 'Create courses and upload source material',
        },
        { vi: 'Xem lại và sửa bài học do AI sinh ra', en: 'Review and edit AI-generated lessons' },
        { vi: 'Sắp xếp lại nội dung khóa học', en: 'Reorganize course content' },
      ],
    },
    {
      name: { vi: 'Administrator', en: 'Administrator' },
      badge: { vi: 'Vận hành hệ thống', en: 'System operator' },
      description: {
        vi: 'Quản lý người dùng, khóa học, theo dõi AI Job và gói đăng ký.',
        en: 'Manages users and courses, and monitors AI jobs and subscription plans.',
      },
      needs: [
        { vi: 'Xem danh sách người dùng và khóa học', en: 'View the list of users and courses' },
        { vi: 'Theo dõi AI Job và tỉ lệ thất bại', en: 'Monitor AI jobs and failure rates' },
        {
          vi: 'Xem trạng thái subscription và chi phí LLM',
          en: 'View subscription status and LLM cost',
        },
      ],
    },
  ],
} satisfies {
  eyebrow: Bi;
  title: Bi;
  groups: { name: Bi; badge: Bi; description: Bi; needs: Bi[] }[];
};

export const VALUE = {
  eyebrow: { vi: 'Giá trị', en: 'Product Value' },
  title: { vi: 'Vì sao dùng LEARN', en: 'Why LEARN' },
  items: [
    {
      title: { vi: 'Giảm thời gian chuẩn bị học', en: 'Reduce learning preparation time' },
      description: {
        vi: 'Không phải tự chuyển từng tài liệu thành bài học.',
        en: 'You do not need to manually convert every document into lessons and exercises.',
      },
    },
    {
      title: { vi: 'Học chủ động', en: 'Enable active learning' },
      description: {
        vi: 'Tài liệu tĩnh trở thành câu hỏi và hoạt động luyện tập.',
        en: 'Static documents are transformed into questions and interactive activities.',
      },
    },
    {
      title: { vi: 'Học có cấu trúc', en: 'Provide structured learning' },
      description: {
        vi: 'Tài liệu được tổ chức thành Course → Lesson → Exercise.',
        en: 'Documents are organized into courses, lessons, and exercises.',
      },
    },
    {
      title: { vi: 'Theo dõi tiến trình', en: 'Track learning progress' },
      description: {
        vi: 'Hệ thống ghi lại bài đã xong, kết quả bài tập, lịch sử học.',
        en: 'The system records completed lessons, exercise results, and learning history.',
      },
    },
    {
      title: { vi: 'AI hỗ trợ học', en: 'Enable AI-assisted learning' },
      description: {
        vi: 'AI hỗ trợ chuyển đổi nội dung và sinh bài tập — không tuyên bố cá nhân hóa hoàn toàn.',
        en: 'AI assists with content transformation and exercise generation — we do not claim fully personalized or adaptive learning.',
      },
    },
    {
      title: { vi: 'Mô hình SaaS', en: 'Support a SaaS business model' },
      description: {
        vi: 'Nhiều gói với hạn mức và tính năng khác nhau.',
        en: 'Multiple subscription plans with different usage limits and features.',
      },
    },
  ],
} satisfies { eyebrow: Bi; title: Bi; items: { title: Bi; description: Bi }[] };

export const FEATURES = {
  eyebrow: { vi: 'Tính năng', en: 'Core Features' },
  title: { vi: 'Sáu khối chức năng chính', en: 'Six core feature areas' },
  items: [
    {
      title: { vi: 'Document-to-Course AI', en: 'Document-to-Course AI' },
      description: {
        vi: 'Tải PDF (có text layer)/TXT/MD lên, AI trích xuất nội dung và sinh khóa học có cấu trúc. PPTX/DOCX và OCR cho PDF scan đã lên kế hoạch.',
        en: 'Upload a PDF (text layer)/TXT/MD file and AI extracts the content into a structured course. PPTX/DOCX and OCR for scanned PDFs are planned.',
      },
      status: 'Có trong MVP' as const,
    },
    {
      title: { vi: 'Interactive Lessons', en: 'Interactive Lessons' },
      description: {
        vi: 'Bài học dạng Markdown có mục lục, đọc trực tiếp trong trình duyệt.',
        en: 'Lessons rendered from Markdown with a table of contents, read directly in the browser.',
      },
      status: 'Có trong MVP' as const,
    },
    {
      title: { vi: 'AI-Generated Exercises', en: 'AI-Generated Exercises' },
      description: {
        vi: '4 loại câu hỏi (trắc nghiệm, đúng/sai, điền khuyết, tự luận ngắn), chấm điểm phía server.',
        en: '4 question types (multiple choice, true/false, fill-in-the-blank, short answer), graded server-side.',
      },
      status: 'Có trong MVP' as const,
    },
    {
      title: { vi: 'Learning Progress', en: 'Learning Progress' },
      description: {
        vi: 'Theo dõi bài đã hoàn thành, điểm cao nhất, chuỗi ngày học liên tiếp.',
        en: 'Tracks completed lessons, best scores, and daily learning streaks.',
      },
      status: 'Có trong MVP' as const,
    },
    {
      title: { vi: 'Course Organization', en: 'Course Organization' },
      description: {
        vi: 'Gom nhiều tài liệu vào một Course, theo dõi trạng thái xử lý từng tài liệu.',
        en: 'Group multiple documents into one course and track each document’s processing status.',
      },
      status: 'Có trong MVP' as const,
    },
    {
      title: { vi: 'Subscription Plans', en: 'Subscription Plans' },
      description: {
        vi: 'Free/Pro/Team với hạn mức khác nhau, áp dụng nguyên tử ở tầng server. Thanh toán hiện ở chế độ demo.',
        en: 'Free/Pro/Team plans with different usage limits, enforced atomically server-side. Payments currently run in demo mode.',
      },
      status: 'Có trong MVP' as const,
    },
  ],
} satisfies {
  eyebrow: Bi;
  title: Bi;
  items: { title: Bi; description: Bi; status: FeatureLabel }[];
};

export const SCREENSHOTS = {
  eyebrow: { vi: 'Giao diện', en: 'Screenshots' },
  title: { vi: 'Sản phẩm trông như thế nào', en: 'What the product looks like' },
  note: {
    vi: 'Toàn bộ ảnh dưới đây chụp trực tiếp từ ứng dụng đang chạy thật (Postgres/Redis/MinIO thật), không phải ảnh dựng.',
    en: 'Every screenshot below is captured directly from the real running application (real Postgres/Redis/MinIO), not a mockup.',
  },
  items: [
    {
      file: 'dashboard.png',
      caption: { vi: 'Tổng quan tiến độ học tập', en: 'Learning progress dashboard' },
    },
    {
      file: 'course-detail.png',
      caption: {
        vi: 'Chi tiết khóa học: tài liệu và bài học',
        en: 'Course detail: documents and lessons',
      },
    },
    {
      file: 'lesson.png',
      caption: { vi: 'Đọc bài học do AI sinh ra', en: 'Reading an AI-generated lesson' },
    },
    {
      file: 'practice.png',
      caption: { vi: 'Làm bài tập tương tác', en: 'Interactive exercise practice' },
    },
    {
      file: 'settings.png',
      caption: { vi: 'Gói đăng ký và hạn mức sử dụng', en: 'Subscription plan and usage limits' },
    },
    {
      file: 'admin.png',
      caption: { vi: 'Bảng điều khiển quản trị', en: 'Admin dashboard' },
    },
  ],
} satisfies { eyebrow: Bi; title: Bi; note: Bi; items: { file: string; caption: Bi }[] };

export const HOW_IT_WORKS = {
  eyebrow: { vi: 'Cách hoạt động', en: 'How It Works' },
  title: { vi: '9 bước, từ tài liệu tới bài học', en: '9 steps, from document to lesson' },
  steps: [
    { vi: 'Tải tài liệu lên', en: 'Upload Document' },
    { vi: 'Xử lý tài liệu', en: 'Document Processing' },
    { vi: 'Trích xuất văn bản', en: 'Text Extraction' },
    { vi: 'Cấu trúc hoá nội dung', en: 'Content Structuring' },
    { vi: 'AI sinh bài học', en: 'AI Lesson Generation' },
    { vi: 'Kiểm định (Validation)', en: 'Validation' },
    { vi: 'Lưu Course và Lesson', en: 'Course & Lesson Storage' },
    { vi: 'Học tương tác', en: 'Interactive Learning' },
    { vi: 'Theo dõi tiến trình', en: 'Progress Tracking' },
  ] satisfies Bi[],
  note: {
    vi: 'OCR cho PDF dạng ảnh scan đã được nhận diện đúng nhưng chưa xử lý — hệ thống báo lỗi rõ ràng thay vì giả vờ đã hỗ trợ (Đã lên kế hoạch).',
    en: 'OCR for scanned PDFs is correctly detected but not yet processed — the system returns a clear error instead of pretending to support it (Planned).',
  },
} satisfies { eyebrow: Bi; title: Bi; steps: Bi[]; note: Bi };

export const MVP_SCOPE = {
  eyebrow: { vi: 'Phạm vi', en: 'MVP Scope' },
  title: { vi: 'Trong và ngoài phạm vi MVP', en: 'In scope and out of scope' },
  inScopeTitle: { vi: 'Trong phạm vi', en: 'In Scope' },
  outScopeTitle: { vi: 'Ngoài phạm vi (roadmap)', en: 'Out of Scope (roadmap)' },
  inScope: [
    { vi: 'Đăng ký, đăng nhập, bảo vệ route', en: 'Registration, login, protected routes' },
    { vi: 'Tạo/xem/xoá Course, gắn tài liệu', en: 'Create/view/delete courses, attach documents' },
    {
      vi: 'Upload tài liệu, theo dõi trạng thái xử lý',
      en: 'Upload documents, track processing status',
    },
    {
      vi: 'AI sinh Lesson + Exercise, validate trước khi lưu',
      en: 'AI-generated lessons + exercises, validated before saving',
    },
    {
      vi: 'Học tương tác: đọc bài, làm bài, chấm điểm, feedback',
      en: 'Interactive learning: read, answer, grade, feedback',
    },
    {
      vi: 'Theo dõi tiến trình: bài đã xong, lịch sử, chuỗi ngày',
      en: 'Progress tracking: completed lessons, history, streaks',
    },
    {
      vi: 'Hiện gói/giá/tính năng, áp hạn mức nguyên tử',
      en: 'Plan/price/feature display, atomic usage limits',
    },
    {
      vi: 'Admin: xem user/course/AI job/subscription',
      en: 'Admin: view users/courses/AI jobs/subscriptions',
    },
  ] satisfies Bi[],
  outScope: [
    { vi: 'Adaptive learning nâng cao', en: 'Advanced adaptive learning' },
    { vi: 'Lộ trình học cá nhân hoá hoàn toàn', en: 'Fully personalized learning paths' },
    {
      vi: 'AI tutor có bộ nhớ hội thoại dài',
      en: 'AI tutor with long-running conversation memory',
    },
    {
      vi: 'Social learning, marketplace công khai',
      en: 'Social learning, public course marketplace',
    },
    { vi: 'Ứng dụng mobile native', en: 'Native mobile applications' },
    { vi: 'Multi-tenancy doanh nghiệp', en: 'Enterprise multi-tenancy' },
    { vi: 'Gamification phức tạp', en: 'Complex gamification' },
    { vi: 'Spaced repetition nâng cao', en: 'Advanced spaced repetition' },
  ] satisfies Bi[],
} satisfies {
  eyebrow: Bi;
  title: Bi;
  inScopeTitle: Bi;
  outScopeTitle: Bi;
  inScope: Bi[];
  outScope: Bi[];
};

export const ARCHITECTURE = {
  eyebrow: { vi: 'Kiến trúc', en: 'Technical Architecture' },
  title: { vi: 'Monorepo, 3 tiến trình độc lập', en: 'A monorepo, three independent processes' },
  intro: {
    vi: 'Request HTTP của người dùng không bao giờ chờ LLM — mọi lệnh gọi LLM đều đi qua hàng đợi và chạy trong tiến trình worker riêng, tách khỏi API. Đây là nguyên tắc ranh giới quan trọng nhất của hệ thống.',
    en: 'A user’s HTTP request never waits on the LLM — every LLM call goes through a queue and runs in a separate worker process, decoupled from the API. This is the system’s most important boundary rule.',
  },
  components: [
    {
      name: 'Frontend Web App',
      code: 'apps/web · Next.js 15',
      vi: 'Render UI, quản lý phiên, hiển thị tiến độ',
      en: 'Renders UI, manages sessions, shows progress',
    },
    {
      name: 'Backend API',
      code: 'apps/api · NestJS 11',
      vi: 'Xác thực, phân quyền, CRUD, áp hạn mức, tạo job',
      en: 'Auth, authorization, CRUD, usage limits, job creation',
    },
    {
      name: 'Auth Module',
      code: 'modules/auth',
      vi: 'JWT + refresh token xoay vòng',
      en: 'JWT + rotating refresh tokens',
    },
    {
      name: 'Course Module',
      code: 'modules/courses',
      vi: 'CRUD Course, lọc theo quyền sở hữu',
      en: 'Course CRUD, ownership filtering',
    },
    {
      name: 'Document Module',
      code: 'modules/documents',
      vi: 'Presigned upload URL, metadata',
      en: 'Presigned upload URLs, metadata',
    },
    {
      name: 'AI Orchestrator',
      code: 'modules/ai',
      vi: 'Tạo/theo dõi AIJob — không tự xử lý file',
      en: 'Creates/tracks AIJob — never processes files itself',
    },
    {
      name: 'Background Worker',
      code: 'apps/worker',
      vi: 'Trích xuất, chunk, gọi LLM, validate, ghi DB',
      en: 'Extracts, chunks, calls the LLM, validates, writes to DB',
    },
    {
      name: 'Job Queue',
      code: 'Redis + BullMQ',
      vi: '4 hàng đợi: extract, generate, billing, maintenance',
      en: '4 queues: extract, generate, billing, maintenance',
    },
    {
      name: 'PostgreSQL',
      code: 'packages/db · Prisma',
      vi: 'Nguồn sự thật duy nhất của dữ liệu nghiệp vụ',
      en: 'Single source of truth for business data',
    },
    {
      name: 'Object Storage',
      code: 'S3-compatible (MinIO)',
      vi: 'File gốc — không phải nguồn sự thật về metadata',
      en: 'Original files — not the source of truth for metadata',
    },
    {
      name: 'LLM Provider',
      code: 'packages/ai · Anthropic Claude',
      vi: 'Sinh outline/lesson/exercise theo JSON schema; có chế độ mock cho CI',
      en: 'Generates outline/lesson/exercise as JSON; has a mock mode for CI',
    },
    {
      name: 'Payment Provider',
      code: 'subscriptions module',
      vi: 'Chế độ demo hiện tại — kích hoạt gói ngay, không gọi cổng thanh toán thật',
      en: 'Currently in demo mode — activates plans instantly, no real payment gateway',
    },
  ],
} satisfies {
  eyebrow: Bi;
  title: Bi;
  intro: Bi;
  components: { name: string; code: string; vi: string; en: string }[];
};

export const AI_PIPELINE = {
  eyebrow: { vi: 'AI Pipeline', en: 'AI Pipeline' },
  title: { vi: 'Từ tài liệu tới bài học có kiểm định', en: 'From document to a validated lesson' },
  chunking: {
    title: { vi: 'Chunking', en: 'Chunking' },
    description: {
      vi: 'Cắt tài liệu thành các đoạn ~1.200 token, chồng lấn 150 token, ưu tiên ranh giới heading > đoạn văn > câu — không bao giờ cắt giữa câu. Mỗi chunk giữ headingPath và khoảng trang để Lesson có thể truy vết ngược về tài liệu gốc.',
      en: 'Documents are split into ~1,200-token chunks with 150-token overlap, preferring heading > paragraph > sentence boundaries — never mid-sentence. Each chunk keeps a heading path and page range so a lesson can be traced back to its source.',
    },
  },
  generation: {
    title: { vi: 'Sinh nội dung — 2 giai đoạn', en: 'Generation — two stages' },
    description: {
      vi: 'Giai đoạn A: 1 lệnh gọi LLM để lập outline (chỉ gửi heading + 200 ký tự đầu mỗi chunk). Giai đoạn B: với mỗi node outline, gọi LLM sinh Lesson + Exercise từ toàn văn chunk liên quan, tối đa 3 lệnh gọi song song mỗi job.',
      en: 'Stage A: one LLM call builds an outline (only headings + the first 200 characters of each chunk are sent). Stage B: for each outline node, an LLM call generates the lesson + exercises from the full text of its chunks, up to 3 calls in parallel per job.',
    },
  },
  validation: {
    title: { vi: 'Kiểm định 4 tầng', en: '4-tier validation' },
    tiers: [
      { vi: 'Schema — đúng cấu trúc JSON theo Zod', en: 'Schema — valid JSON structure per Zod' },
      {
        vi: 'Luật nghiệp vụ — không trùng tiêu đề, đủ số câu hỏi',
        en: 'Business rules — no duplicate titles, enough questions',
      },
      {
        vi: 'Bám nguồn — nội dung phải khớp chunk gốc',
        en: 'Source grounding — content must match the source chunks',
      },
      {
        vi: 'Làm sạch — chống injection trong Markdown/HTML',
        en: 'Sanitization — guards against injection in Markdown/HTML',
      },
    ] satisfies Bi[],
  },
  retry: {
    title: { vi: 'Retry có backoff', en: 'Retry with backoff' },
    description: {
      vi: 'Tối đa 3 lần thử với exponential backoff cho mỗi job; lỗi kèm theo phản hồi trước đó để lần thử sau tránh lặp lại lỗi cũ.',
      en: 'Up to 3 attempts with exponential backoff per job; failures carry the previous error so the next attempt avoids repeating the same mistake.',
    },
  },
} satisfies {
  eyebrow: Bi;
  title: Bi;
  chunking: { title: Bi; description: Bi };
  generation: { title: Bi; description: Bi };
  validation: { title: Bi; tiers: Bi[] };
  retry: { title: Bi; description: Bi };
};

export const DATABASE_API = {
  eyebrow: { vi: 'Database & API', en: 'Database & API' },
  title: { vi: 'Lược đồ và endpoint tiêu biểu', en: 'Schema and sample endpoints' },
  entities: [
    'User',
    'Course',
    'Document',
    'DocumentChunk',
    'Lesson',
    'Exercise',
    'Submission',
    'LearningProgress',
    'AIJob',
    'GenerationRun',
    'Plan',
    'Subscription',
    'AuditLog',
  ],
  endpoints: [
    {
      method: 'POST',
      path: '/api/v1/courses/:courseId/documents/upload-url',
      vi: 'Xin presigned URL để upload thẳng lên object storage',
      en: 'Request a presigned URL to upload directly to object storage',
    },
    {
      method: 'POST',
      path: '/api/v1/ai/courses/:courseId/generate-lessons',
      vi: 'Tạo AIJob sinh bài học, trả về ngay job đang QUEUED',
      en: 'Create an AIJob to generate lessons, returns immediately as QUEUED',
    },
    {
      method: 'POST',
      path: '/api/v1/lessons/:lessonId/exercise/submit',
      vi: 'Nộp bài, chấm điểm phía server',
      en: 'Submit an exercise, graded server-side',
    },
    {
      method: 'GET',
      path: '/api/v1/admin/ai-jobs/:id',
      vi: 'Admin xem chi tiết 1 AI Job kèm log LLM',
      en: 'Admin views one AI job with its LLM call log',
    },
  ],
} satisfies {
  eyebrow: Bi;
  title: Bi;
  entities: string[];
  endpoints: { method: string; path: string; vi: string; en: string }[];
};

export const ENGINEERING_DECISIONS = {
  eyebrow: { vi: 'Quyết định kỹ thuật', en: 'Engineering Decisions' },
  title: { vi: 'Vì sao làm theo cách này', en: 'Why it was built this way' },
  items: [
    {
      title: { vi: 'Toàn bộ TypeScript, một monorepo', en: 'TypeScript everywhere, one monorepo' },
      body: {
        vi: 'Web, API và worker dùng chung packages/contracts (schema Zod) — hợp đồng dữ liệu chỉ định nghĩa một lần, cả 3 tiến trình tự động đồng bộ kiểu.',
        en: 'Web, API, and worker share packages/contracts (Zod schemas) — the data contract is defined once and all three processes stay type-safe automatically.',
      },
    },
    {
      title: { vi: 'Tách outline khỏi lesson', en: 'Separating outline from lesson generation' },
      body: {
        vi: 'Gộp lập kế hoạch và viết nội dung vào một lệnh gọi LLM luôn cho kết quả tệ hơn. Tách hai giai đoạn còn mở đường cho tính năng duyệt outline trước khi tốn tiền sinh toàn bộ (roadmap).',
        en: 'Asking one LLM call to both plan and write consistently produces worse output. Splitting the two stages also opens the door to reviewing the outline before paying to generate everything (roadmap).',
      },
    },
    {
      title: { vi: 'Worker tách khỏi API', en: 'A worker process separate from the API' },
      body: {
        vi: 'Request HTTP không bao giờ chờ LLM. Mọi lệnh gọi LLM chạy trong apps/worker, nhận job qua Redis/BullMQ — API vẫn phản hồi nhanh dù job đang chạy hàng chục giây.',
        en: 'An HTTP request never waits on the LLM. Every LLM call runs inside apps/worker, picking up jobs via Redis/BullMQ — the API stays fast even while a job runs for tens of seconds.',
      },
    },
    {
      title: {
        vi: 'Webhook là nguồn sự thật cho thanh toán',
        en: 'Webhooks are the source of truth for billing',
      },
      body: {
        vi: 'Không bao giờ tin giá hay trạng thái thanh toán do frontend gửi lên. Subscription chỉ được cập nhật qua webhook đã xác minh chữ ký (hoặc chế độ demo được đánh dấu rõ ràng).',
        en: 'Price or payment status supplied by the frontend is never trusted. A subscription only changes via a signature-verified webhook (or an explicitly labeled demo mode).',
      },
    },
    {
      title: { vi: 'Bộ đếm hạn mức tăng nguyên tử', en: 'Atomic usage counters' },
      body: {
        vi: 'Tăng hạn mức dùng upsert nguyên tử của Postgres (ON CONFLICT). Đã kiểm chứng bằng test tranh chấp thật: 20 lệnh gọi đồng thời, không mất update nào.',
        en: 'Usage counters increment via an atomic Postgres upsert (ON CONFLICT). Verified with a real concurrency test: 20 simultaneous calls, zero lost updates.',
      },
    },
    {
      title: {
        vi: 'Chỉnh sửa được, không chỉ tin tưởng AI',
        en: 'Editable output, not blind trust in AI',
      },
      body: {
        vi: 'Thay vì hứa AI luôn đúng, người tạo nội dung có thể xem lại và sửa bài học AI sinh ra — cách xử lý trung thực nhất cho một hệ thống sinh nội dung tự động.',
        en: 'Rather than promising the AI is always correct, content creators can review and edit AI-generated lessons — the most honest way to handle an automated content-generation system.',
      },
    },
  ],
} satisfies { eyebrow: Bi; title: Bi; items: { title: Bi; body: Bi }[] };

export const DEMO = {
  eyebrow: { vi: 'Demo', en: 'Demo' },
  title: { vi: 'Dùng thử ngay', en: 'Try it right now' },
  description: {
    vi: 'Đăng nhập bằng tài khoản demo có sẵn dữ liệu mẫu, hoặc tự đăng ký tài khoản mới — cả hai đều chạy trên hệ thống thật, không phải bản dựng riêng cho demo.',
    en: 'Log in with the pre-seeded demo account, or register your own — both run on the real system, not a separate demo build.',
  },
  credentialsLabel: { vi: 'Tài khoản dùng thử', en: 'Demo credentials' },
  cta: { vi: 'Vào Demo', en: 'Launch Demo' },
} satisfies { eyebrow: Bi; title: Bi; description: Bi; credentialsLabel: Bi; cta: Bi };

// Không có trường `cta` ("Xem trên GitHub"): repo chưa public (xem câu cuối
// `github-info.tsx`), nên một nút dẫn tới URL không tồn tại còn tệ hơn không có
// nút nào — AGENTS.md cấm trình bày thứ chưa làm như đã làm. Có repo public thật
// thì thêm lại trường này và render một ButtonLink trỏ đúng URL.
export const GITHUB_INFO = {
  eyebrow: { vi: 'Mã nguồn', en: 'GitHub & Project Info' },
  title: { vi: 'Xem mã nguồn, chạy local', en: 'View the source, run it locally' },
  stack: [
    'Next.js 15 · React 19',
    'NestJS 11',
    'PostgreSQL 16 · Prisma 6',
    'Redis 7 · BullMQ',
    'MinIO (S3-compatible)',
    'Anthropic Claude',
  ],
} satisfies { eyebrow: Bi; title: Bi; stack: string[] };
