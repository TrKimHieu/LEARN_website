/**
 * Data Dictionary (SRS §3.2) sinh từ `packages/db/prisma/schema.prisma`.
 *
 * Cấu trúc bảng (field, kiểu, null, PK/FK/UQ, default) đọc thẳng từ schema nên không thể lệch
 * DB thật; chỉ phần "Mô tả" viết tay ở `DESCRIPTIONS`. Field mới trong schema mà chưa có mô tả
 * sẽ được cảnh báo khi build — sửa ở đây rồi build lại.
 */

/** Nhóm model theo cụm dữ liệu, đúng thứ tự trình bày trong tài liệu. */
export const CLUSTERS = [
  ['3.2.1 Identity & Auth', ['User', 'RefreshToken', 'PasswordResetToken']],
  ['3.2.2 Content — Course & Document', ['Course', 'CourseMember', 'Document', 'DocumentChunk']],
  ['3.2.3 AI Processing', ['AIJob', 'GenerationRun']],
  ['3.2.4 Learning Content', ['Lesson', 'Exercise', 'Question', 'AnswerOption']],
  ['3.2.5 Learning Activity', ['LearningProgress', 'Submission', 'SubmissionAnswer']],
  ['3.2.6 Billing & Quota', ['Plan', 'Subscription', 'Payment', 'PaymentEvent', 'UsageCounter']],
  ['3.2.7 Operations', ['AuditLog']],
];

/** FK chỉ ở mức logic (không khai `@relation` trong schema) — ghi rõ để dev không tưởng có ràng buộc DB. */
const LOGICAL_FK = {
  'Lesson.documentId': 'Document.id',
  'Lesson.aiJobId': 'AIJob.id',
  'CourseMember.courseId': 'Course.id',
  'CourseMember.userId': 'User.id',
  'Question.sourceChunkId': 'DocumentChunk.id',
};

export const DESCRIPTIONS = {
  User: {
    _: 'Tài khoản người dùng. Một email chỉ có một tài khoản; soft delete bằng deletedAt.',
    id: 'Khoá chính, uuidv7 do ứng dụng cấp (sắp xếp được theo thời gian).',
    email: 'Email đăng nhập, luôn lưu chữ thường (Zod transform).',
    passwordHash: 'Hash argon2id của mật khẩu. Không bao giờ trả ra API.',
    displayName: 'Tên hiển thị, 2–100 ký tự.',
    role: 'Vai trò hệ thống: LEARNER hoặc ADMIN.',
    locale: 'Ngôn ngữ giao diện: vi | en.',
    emailVerifiedAt: 'Thời điểm xác minh email. Chưa có luồng xác minh (luôn null ở MVP).',
    createdAt: 'Thời điểm tạo.',
    updatedAt: 'Tự cập nhật mỗi lần ghi.',
    deletedAt: 'Soft delete. Khác null = tài khoản đã xoá.',
  },
  RefreshToken: {
    _: 'Refresh token dạng opaque. Chỉ lưu SHA-256; xoay vòng mỗi lần dùng, gom theo familyId để phát hiện reuse.',
    id: 'Khoá chính.',
    userId: 'Chủ sở hữu token.',
    tokenHash: 'SHA-256 của chuỗi 256-bit gửi trong cookie refresh_token.',
    familyId: 'Chuỗi xoay vòng. Reuse một token đã revoke → revoke toàn bộ family.',
    expiresAt: 'Hết hạn sau REFRESH_TOKEN_TTL_DAYS (mặc định 30 ngày).',
    revokedAt: 'Thời điểm thu hồi (logout, xoay vòng, reset mật khẩu).',
    userAgent: 'User-Agent lúc cấp — phục vụ điều tra phiên.',
    ipAddress: 'IP lúc cấp.',
    createdAt: 'Thời điểm cấp.',
  },
  PasswordResetToken: {
    _: 'Token đặt lại mật khẩu (FR-AUTH-07). Dùng một lần, hạn PASSWORD_RESET_TTL_MIN (30 phút).',
    id: 'Khoá chính.',
    userId: 'Tài khoản cần đặt lại mật khẩu.',
    tokenHash: 'SHA-256 của token trong đường dẫn email.',
    expiresAt: 'Hạn dùng.',
    usedAt: 'Đánh dấu đã dùng — update có điều kiện nên hai request cùng token chỉ một cái qua.',
    createdAt: 'Thời điểm phát hành.',
  },
  Course: {
    _: 'Đơn vị tổ chức nội dung học, thuộc sở hữu một User. Soft delete.',
    id: 'Khoá chính.',
    ownerId: 'Chủ sở hữu. Mọi truy vấn Course đều lọc theo ownerId ở tầng repository (chống IDOR).',
    title: 'Tên Course, 1–200 ký tự.',
    description: 'Mô tả, tối đa 2000 ký tự.',
    language: 'Ngôn ngữ nội dung AI sinh ra: vi | en.',
    status: 'DRAFT → READY → ARCHIVED.',
    createdAt: 'Thời điểm tạo.',
    updatedAt: 'Tự cập nhật; dùng để sắp xếp workspace.',
    deletedAt: 'Soft delete.',
  },
  CourseMember: {
    _: 'Chia sẻ Course cho user khác (FR-COURSE-07 — Đang phát triển). Bảng đã có, chưa có luồng mời/UI.',
    id: 'Khoá chính.',
    courseId: 'Course được chia sẻ.',
    userId: 'Thành viên được chia sẻ.',
    role: 'OWNER | EDITOR | VIEWER.',
    addedAt: 'Thời điểm thêm.',
  },
  Document: {
    _: 'Tệp nguồn người dùng tải lên cho một Course. File nằm trên object storage, DB chỉ giữ metadata.',
    id: 'Khoá chính.',
    courseId: 'Course chứa tài liệu.',
    uploaderId: 'Người tải lên.',
    filename: 'Tên file đã làm sạch (ký tự lạ → "_"), tối đa 255 ký tự.',
    mimeType: 'MIME suy từ đuôi file (không tin File.type của trình duyệt).',
    sizeBytes: 'Kích thước thật, tối đa DOCUMENT_MAX_SIZE = 25 MB.',
    storageKey: 'Khoá object: {userId}/documents/{uuidv7}.{tên-file-sạch}. Không public.',
    checksumSha256: 'SHA-256 client tính trước khi upload — chặn trùng trong cùng Course.',
    pageCount: 'Số trang thật (worker điền sau khi trích xuất).',
    status: 'PENDING → UPLOADED → EXTRACTING → EXTRACTED | FAILED.',
    errorCode: 'Mã lỗi trích xuất: UNSUPPORTED_FILE, SCANNED_PDF_UNSUPPORTED, PAGE_QUOTA_EXCEEDED, EXTRACTION_FAILED.',
    errorMessage: 'Thông điệp lỗi hiển thị cho người dùng.',
    extractedAt: 'Thời điểm trích xuất xong.',
    createdAt: 'Thời điểm xin presigned URL.',
  },
  DocumentChunk: {
    _: 'Đoạn văn bản đã cắt từ Document — đơn vị đưa vào LLM và là "nguồn" để truy vết Lesson.',
    id: 'Khoá chính.',
    documentId: 'Document gốc.',
    index: 'Thứ tự chunk trong Document (unique cùng documentId).',
    content: 'Nội dung text đã chuẩn hoá.',
    tokenCount: 'Số token ước tính (mục tiêu 1.200, tối thiểu 100, chồng lấn 150).',
    pageFrom: 'Trang bắt đầu (PDF/DOCX/PPTX).',
    pageTo: 'Trang kết thúc.',
    headingPath: 'Đường dẫn heading "Cha > Con"; chunk không vắt qua hai mục.',
    createdAt: 'Thời điểm tạo.',
  },
  AIJob: {
    _: 'Tác vụ AI bất đồng bộ chạy trên BullMQ. Hiện chỉ GENERATE_LESSONS tạo bản ghi AIJob.',
    id: 'Khoá chính.',
    courseId: 'Course đích.',
    documentId: 'Document liên quan (nếu có).',
    requestedById: 'Người tạo job — dùng lọc quyền sở hữu.',
    type: 'EXTRACT_DOCUMENT | GENERATE_LESSONS | REGENERATE_LESSON.',
    status: 'QUEUED → RUNNING → SUCCEEDED | FAILED | CANCELLED.',
    progress: 'Tiến độ 0–100 (worker cập nhật theo bước).',
    progressLabel: 'Nhãn bước hiện tại, ví dụ "Đã sinh 2/3 bài học".',
    attempt: 'Số lần worker đã nhận job (tăng khi claim, tối đa 3).',
    idempotencyKey: 'Khoá duy nhất chống tạo trùng trong cùng thời điểm.',
    inputParams: 'Tham số: { documentIds[], language, difficulty }.',
    error: 'Lỗi cuối cùng { code, message, detail } hoặc partialFailures khi thành công một phần.',
    queuedAt: 'Thời điểm vào hàng đợi.',
    startedAt: 'Thời điểm worker nhận.',
    finishedAt: 'Thời điểm kết thúc (mọi trạng thái cuối).',
  },
  GenerationRun: {
    _: 'Một lượt gọi LLM trong AIJob — nguồn dữ liệu chi phí/độ trễ cho admin (NFR-AI-05).',
    id: 'Khoá chính.',
    aiJobId: 'AIJob chứa lượt gọi.',
    step: 'Bước pipeline: outline | lesson.',
    model: 'Model thực tế đã trả lời (kể cả model fallback).',
    promptVersion: 'Phiên bản prompt, ví dụ outline@2, lesson@3.',
    inputTokens: 'Token đầu vào.',
    outputTokens: 'Token đầu ra.',
    costUsd: 'Chi phí ước tính (USD), cộng dồn để chặn AI_JOB_MAX_COST_USD.',
    latencyMs: 'Độ trễ lượt gọi.',
    attempt: 'Lần thử trong bước (retry do lỗi schema/luật).',
    rawResponseKey: 'Khoá object chứa response thô (tuỳ chọn).',
    validationReport: 'Kết quả 4 tầng validation.',
    createdAt: 'Thời điểm gọi.',
  },
  Lesson: {
    _: 'Bài học do AI sinh (hoặc sửa tay), thuộc một Course, có thứ tự. Soft delete.',
    id: 'Khoá chính.',
    courseId: 'Course chứa bài học.',
    documentId: 'Document nguồn chính.',
    aiJobId: 'AIJob đã sinh ra bài học.',
    orderIndex: 'Thứ tự trong Course (unique). Bài đã xoá bị đẩy sang giá trị âm.',
    title: 'Tiêu đề 5–200 ký tự, không trùng trong cùng Course.',
    summary: 'Tóm tắt ≤ 500 ký tự.',
    contentMd: 'Nội dung Markdown đã sanitize (≤ 12.000 ký tự).',
    estimatedMinutes: 'Thời lượng đọc ước tính 1–60 phút.',
    status: 'DRAFT | PUBLISHED.',
    sourceChunkIds: 'Danh sách DocumentChunk.id mà bài học dựa vào (bắt buộc ≥ 1).',
    confidence: 'Độ bám nguồn: UNKNOWN | HIGH | LOW (LOW = < 50% thuật ngữ mẫu khớp).',
    editedByUserAt: 'Lần cuối người dùng sửa tay.',
    createdAt: 'Thời điểm tạo.',
    updatedAt: 'Tự cập nhật.',
    deletedAt: 'Soft delete.',
  },
  Exercise: {
    _: 'Bài tập của một Lesson (AI sinh 1–5 bài tập mỗi Lesson).',
    id: 'Khoá chính.',
    lessonId: 'Lesson chứa bài tập.',
    orderIndex: 'Thứ tự trong Lesson (unique).',
    title: 'Tiêu đề bài tập.',
    instruction: 'Hướng dẫn làm bài.',
    difficulty: 'EASY | MEDIUM | HARD.',
    passScore: 'Ngưỡng đạt theo thang 100 (mặc định 70).',
    createdAt: 'Thời điểm tạo.',
  },
  Question: {
    _: 'Câu hỏi trong Exercise. correctAnswer không bao giờ rời server trước khi nộp bài.',
    id: 'Khoá chính.',
    exerciseId: 'Exercise chứa câu hỏi.',
    orderIndex: 'Thứ tự trong Exercise (unique).',
    type: 'MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER | FILL_BLANK.',
    prompt: 'Nội dung câu hỏi.',
    explanation: 'Giải thích trả về sau khi nộp.',
    correctAnswer: 'Đáp án: TRUE_FALSE → {value}; SHORT_ANSWER/FILL_BLANK → {acceptable[]}; MULTIPLE_CHOICE chấm qua AnswerOption.isCorrect.',
    points: 'Số điểm của câu.',
    sourceChunkId: 'Chunk nguồn của câu hỏi.',
    createdAt: 'Thời điểm tạo.',
  },
  AnswerOption: {
    _: 'Phương án của câu MULTIPLE_CHOICE (đúng 4 phương án, đúng 1 phương án đúng).',
    id: 'Khoá chính.',
    questionId: 'Câu hỏi chứa phương án.',
    orderIndex: 'Thứ tự hiển thị.',
    label: 'Nhãn A/B/C/D.',
    content: 'Nội dung phương án.',
    isCorrect: 'Phương án đúng. Không trả ra client trước khi nộp.',
  },
  LearningProgress: {
    _: 'Trạng thái học của một User với một Lesson. Không lùi trạng thái; bestScore chỉ tăng.',
    id: 'Khoá chính.',
    userId: 'Người học.',
    courseId: 'Course (denormalize để tính tiến trình theo Course nhanh).',
    lessonId: 'Lesson (unique cùng userId).',
    status: 'NOT_STARTED → IN_PROGRESS → COMPLETED.',
    bestScore: 'Điểm cao nhất (thang 100).',
    attempts: 'Tổng số lượt nộp.',
    startedAt: 'Lần đầu mở bài.',
    completedAt: 'Thời điểm đạt COMPLETED.',
    updatedAt: 'Tự cập nhật.',
  },
  Submission: {
    _: 'Một lượt nộp bài cho một Exercise. attemptNo tính trong transaction, retry khi đụng unique.',
    id: 'Khoá chính (cũng là cursor phân trang lịch sử).',
    userId: 'Người nộp.',
    exerciseId: 'Exercise được nộp.',
    attemptNo: 'Số lượt thứ n của user với exercise (unique).',
    score: 'Điểm đạt được (thang 100).',
    maxScore: 'Điểm tối đa (100).',
    durationMs: 'Thời gian làm bài (≤ 1 giờ).',
    createdAt: 'Thời điểm nộp.',
  },
  SubmissionAnswer: {
    _: 'Câu trả lời cho từng Question trong một Submission, kèm kết quả chấm.',
    id: 'Khoá chính.',
    submissionId: 'Submission chứa câu trả lời.',
    questionId: 'Câu hỏi được trả lời.',
    rawAnswer: 'Câu trả lời thô người dùng gửi.',
    isCorrect: 'Kết quả chấm.',
    pointsEarned: 'Điểm nhận được.',
    feedback: 'Giải thích/nhận xét trả về.',
  },
  Plan: {
    _: 'Gói dịch vụ. Giá và hạn mức luôn đọc từ bảng này, không tin giá trị client gửi.',
    id: 'Khoá chính.',
    code: 'Mã gói: FREE | PRO | TEAM.',
    name: 'Tên hiển thị.',
    description: 'Mô tả.',
    priceCents: 'Giá theo cent (PRO = 900 = 9 USD/tháng).',
    currency: 'Đơn vị tiền tệ.',
    interval: 'Chu kỳ tính phí.',
    limits: 'Hạn mức: { METRIC: { limit, window: total | month | per_document } }.',
    features: 'Danh sách tính năng hiển thị ở bảng giá.',
    isActive: 'Gói còn bán/hiển thị.',
    displayOrder: 'Thứ tự hiển thị.',
    isFutureExtension: 'true = "Mở rộng tương lai" (TEAM), hiển thị nhưng không cho mua.',
    providerPriceId: 'Price ID phía Stripe (khi bật live).',
  },
  Subscription: {
    _: 'Gói hiện hành của User. Mỗi User chỉ có một Subscription hiệu lực tại một thời điểm.',
    id: 'Khoá chính.',
    userId: 'Người đăng ký.',
    planId: 'Gói.',
    status: 'TRIALING | ACTIVE | PAST_DUE | CANCELED.',
    currentPeriodStart: 'Đầu kỳ hiện tại.',
    currentPeriodEnd: 'Cuối kỳ hiện tại (demo: +30 ngày).',
    cancelAtPeriodEnd: 'true = huỷ vào cuối kỳ, vẫn ACTIVE tới lúc đó.',
    providerCustomerId: 'Customer ID phía Stripe.',
    providerSubscriptionId: 'Subscription ID phía Stripe (unique).',
    createdAt: 'Thời điểm tạo.',
    updatedAt: 'Tự cập nhật.',
  },
  Payment: {
    _: 'Bản ghi thanh toán. Chế độ demo ghi Payment giả với providerPaymentId = demo_*.',
    id: 'Khoá chính.',
    subscriptionId: 'Subscription được thanh toán.',
    amountCents: 'Số tiền (cent), lấy từ Plan.',
    currency: 'Đơn vị tiền tệ.',
    status: 'Trạng thái thanh toán (succeeded…).',
    providerPaymentId: 'ID giao dịch phía nhà cung cấp (unique).',
    paidAt: 'Thời điểm thanh toán thành công.',
    createdAt: 'Thời điểm tạo.',
  },
  PaymentEvent: {
    _: 'Sự kiện webhook thanh toán thô — ghi trước khi xử lý, idempotent theo (provider, eventId).',
    id: 'Khoá chính.',
    provider: 'Nhà cung cấp (stripe).',
    eventId: 'ID sự kiện phía nhà cung cấp.',
    type: 'Loại sự kiện.',
    payload: 'Payload JSON gốc.',
    receivedAt: 'Thời điểm nhận.',
    processedAt: 'Thời điểm xử lý xong.',
    processError: 'Lỗi xử lý (nếu có).',
  },
  UsageCounter: {
    _: 'Bộ đếm hạn mức theo kỳ tháng cho metric kiểu counter (DOCUMENTS_UPLOADED, AI_JOBS_RUN).',
    id: 'Khoá chính.',
    userId: 'Người dùng.',
    period: 'Kỳ dạng YYYY-MM.',
    metric: 'COURSES_CREATED | DOCUMENTS_UPLOADED | PAGES_PROCESSED | AI_JOBS_RUN | LLM_TOKENS.',
    value: 'Giá trị đã dùng — tăng bằng upsert cộng dồn trong transaction có advisory lock.',
  },
  AuditLog: {
    _: 'Nhật ký hành động nhạy cảm (admin retry job, đặt lại mật khẩu…). Giữ lại khi actor bị xoá.',
    id: 'Khoá chính.',
    actorId: 'Người thực hiện; null nếu user đã bị xoá (onDelete SetNull).',
    action: 'Mã hành động, ví dụ ai_job.retry, auth.password_reset.',
    entityType: 'Loại thực thể bị tác động.',
    entityId: 'ID thực thể bị tác động.',
    metadata: 'Dữ liệu kèm theo (trạng thái trước, lỗi trước…).',
    ipAddress: 'IP người thực hiện.',
    createdAt: 'Thời điểm ghi.',
  },
};

// ─── Parser tối giản cho schema.prisma ─────────────────────────────────

const SCALARS = new Set(['String', 'Int', 'Boolean', 'DateTime', 'Json', 'Decimal', 'Float', 'BigInt', 'Bytes']);

export function parseSchema(src) {
  const enums = {};
  for (const m of src.matchAll(/^enum (\w+) \{([^}]*)\}/gm)) {
    enums[m[1]] = m[2].split('\n').map((l) => l.trim()).filter(Boolean);
  }
  const models = {};
  for (const m of src.matchAll(/^model (\w+) \{([^}]*)\}/gm)) {
    const name = m[1];
    const fields = [];
    const relations = {};
    const blockAttrs = [];
    for (const raw of m[2].split('\n')) {
      const line = raw.replace(/\/\/.*$/, '').trim();
      if (!line) continue;
      if (line.startsWith('@@')) {
        blockAttrs.push(line);
        continue;
      }
      const [fname, ftype, ...rest] = line.split(/\s+/);
      const attrs = rest.join(' ');
      const base = ftype.replace(/[?[\]]/g, '');
      const rel = /@relation\(fields: \[(\w+)\], references: \[(\w+)\](?:, onDelete: (\w+))?/.exec(attrs);
      if (rel) {
        relations[rel[1]] = { model: base, ref: rel[2], onDelete: rel[3] };
        continue;
      }
      if (!SCALARS.has(base) && !enums[base]) continue; // back-relation
      fields.push({
        name: fname,
        type: ftype,
        base,
        isEnum: Boolean(enums[base]),
        optional: ftype.endsWith('?'),
        list: ftype.endsWith('[]'),
        id: /@id\b/.test(attrs),
        unique: /@unique\b/.test(attrs),
        def: /@default\(((?:[^()]|\([^)]*\))*)\)/.exec(attrs)?.[1],
        dbType: /@db\.(\w+(?:\([^)]*\))?)/.exec(attrs)?.[1],
      });
    }
    models[name] = { fields, relations, blockAttrs };
  }
  return { models, enums };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function renderDataDictionary(schemaSrc) {
  const { models, enums } = parseSchema(schemaSrc);
  const missing = [];
  const covered = new Set(CLUSTERS.flatMap(([, names]) => names));
  for (const name of Object.keys(models)) {
    if (!covered.has(name)) missing.push(`model ${name} (chưa xếp cụm)`);
  }

  let html = '';
  for (const [title, names] of CLUSTERS) {
    html += `<h3>${esc(title)}</h3>\n`;
    for (const name of names) {
      const model = models[name];
      if (!model) {
        missing.push(`model ${name} không còn trong schema`);
        continue;
      }
      const desc = DESCRIPTIONS[name] ?? {};
      const rows = model.fields
        .map((f) => {
          const keys = [];
          if (f.id) keys.push('PK');
          const rel = model.relations[f.name];
          const logical = LOGICAL_FK[`${name}.${f.name}`];
          if (rel || logical) keys.push('FK');
          if (f.unique) keys.push('UQ');
          let type = f.dbType && f.base !== 'String' ? `${f.base}(${f.dbType.replace(/^\w+\(|\)$/g, '')})` : f.base;
          if (f.dbType === 'Text') type = 'String (Text)';
          if (f.list) type += '[]';
          if (f.isEnum) type = `enum ${type}`;
          let text = desc[f.name];
          if (!text) {
            missing.push(`${name}.${f.name}`);
            text = '—';
          }
          const notes = [];
          if (rel) notes.push(`→ ${rel.model}.${rel.ref}${rel.onDelete ? `, onDelete ${rel.onDelete}` : ''}`);
          if (logical) notes.push(`→ ${logical} (FK logic, không có ràng buộc DB)`);
          if (f.def !== undefined && !f.id) notes.push(`default ${f.def}`);
          return `<tr><td><code>${f.name}</code></td><td><code>${esc(type)}</code></td><td class="c">${f.optional ? '' : '✓'}</td><td class="c">${keys.join(', ')}</td><td>${esc(text)}${notes.length ? `<span class="note">${esc(notes.join(' · '))}</span>` : ''}</td></tr>`;
        })
        .join('\n');
      const constraints = model.blockAttrs
        .map((a) => a.replace(/^@@(\w+)\(\[([^\]]*)\]\)$/, (_, kind, cols) => `${kind === 'unique' ? 'UNIQUE' : 'INDEX'} (${cols})`))
        .map((a) => `<code>${esc(a)}</code>`)
        .join(' · ');
      html += `<div class="dd-model">
<h4><code>${name}</code></h4>
<p class="dd-desc">${esc(desc._ ?? '')}</p>
<table class="dd">
<caption>Data dictionary — ${name}</caption>
<colgroup><col style="width:19%"><col style="width:19%"><col style="width:7%"><col style="width:9%"><col></colgroup>
<thead><tr><th>Field</th><th>Type</th><th>Not Null</th><th>Key</th><th>Mô tả</th></tr></thead>
<tbody>
${rows}
</tbody></table>
${constraints ? `<p class="dd-constraints"><b>Ràng buộc &amp; index:</b> ${constraints}</p>` : ''}
</div>\n`;
    }
  }

  html += `<h3>3.2.8 Enumerations</h3>
<table class="enums"><caption>Các enum trong schema</caption>
<thead><tr><th>Enum</th><th>Giá trị</th></tr></thead><tbody>
${Object.entries(enums)
  .map(([n, vals]) => `<tr><td><code>${n}</code></td><td>${vals.map((v) => `<code>${v}</code>`).join(' · ')}</td></tr>`)
  .join('\n')}
</tbody></table>\n`;

  if (missing.length) console.warn(`Data dictionary thiếu mô tả: ${missing.join(', ')}`);
  return html;
}
