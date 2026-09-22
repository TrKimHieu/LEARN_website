import type { LlmGenerateParams, LlmGenerationResult, LlmProvider } from './provider';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Hạn mức mặc định rộng hơn Anthropic (4096) có chủ đích: Gemini 3.x luôn sinh "thought token"
 * và chúng tính chung vào maxOutputTokens. Để 4096 thì prompt bài học dài dễ bị cắt giữa chừng,
 * trả về text rỗng kèm finishReason=MAX_TOKENS.
 */
const DEFAULT_MAX_TOKENS = 8192;

interface GeminiPart {
  text?: string;
  /** Phần suy nghĩ nội bộ — không phải nội dung trả lời, phải lọc bỏ. */
  thought?: boolean;
}

interface GeminiResponseBody {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  modelVersion?: string;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

export interface GeminiProviderOptions {
  maxTokens?: number;
  baseUrl?: string;
  /** Ép Gemini trả JSON thuần. Mặc định bật vì mọi call site trong pipeline đều `extractJson`. */
  responseJson?: boolean;
  /** Số lần thử lại khi API trả 429/503. Mặc định 2 (tổng 3 lần gọi). */
  maxRetries?: number;
  /** Chờ cơ sở giữa các lần thử, nhân đôi sau mỗi lần. */
  retryDelayMs?: number;
  /** Tiêm fetch giả trong test. */
  fetchImpl?: typeof fetch;
  /** Tiêm hàm chờ trong test để không phải ngủ thật. */
  sleepImpl?: (ms: number) => Promise<void>;
}

/** Quá tải (503) và vượt hạn mức (429) là lỗi tạm thời — free tier gặp thường xuyên. */
const RETRYABLE_STATUS = new Set([429, 503]);

/**
 * Adapter Google Gemini (AI Studio / Generative Language API) — HANDBOOK §5.3, cùng interface với
 * `AnthropicLlmProvider` nên pipeline không phải biết đang chạy nhà cung cấp nào. Gọi thẳng REST
 * `:generateContent` bằng fetch, không thêm SDK: bề mặt cần dùng chỉ là một lần POST.
 */
export class GeminiLlmProvider implements LlmProvider {
  readonly defaultModel: string;
  private readonly apiKey: string;
  private readonly maxTokens: number;
  private readonly baseUrl: string;
  private readonly responseJson: boolean;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;

  constructor(apiKey: string, defaultModel: string, options: GeminiProviderOptions = {}) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.responseJson = options.responseJson ?? true;
    this.maxRetries = options.maxRetries ?? 2;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch;
    this.sleepImpl =
      options.sleepImpl ?? ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  }

  async generate(params: LlmGenerateParams): Promise<LlmGenerationResult> {
    const startedAt = Date.now();
    const model = params.model ?? this.defaultModel;
    const maxOutputTokens = params.maxTokens ?? this.maxTokens;

    const body = {
      contents: [{ role: 'user', parts: [{ text: params.prompt }] }],
      ...(params.system ? { systemInstruction: { parts: [{ text: params.system }] } } : {}),
      generationConfig: {
        temperature: params.temperature ?? 0.2,
        maxOutputTokens,
        ...(this.responseJson ? { responseMimeType: 'application/json' } : {}),
      },
    };

    const json = await this.post(model, body);

    const candidate = json.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .filter((part) => part.thought !== true && typeof part.text === 'string')
      .map((part) => part.text ?? '')
      .join('')
      .trim();

    if (!text) {
      const reason = candidate?.finishReason ?? json.promptFeedback?.blockReason ?? 'không rõ';
      if (reason === 'MAX_TOKENS') {
        throw new Error(
          `Gemini trả rỗng vì chạm maxOutputTokens (${maxOutputTokens}) — token suy nghĩ đã ăn hết hạn mức. Tăng maxTokens.`,
        );
      }
      throw new Error(`Gemini không trả nội dung (finishReason=${reason}).`);
    }

    const usage = json.usageMetadata ?? {};
    return {
      text,
      inputTokens: usage.promptTokenCount ?? 0,
      // Thought token được tính tiền như output — cộng vào để ước tính chi phí không bị hụt.
      outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
      latencyMs: Date.now() - startedAt,
      model: json.modelVersion ?? model,
    };
  }

  /** POST kèm thử lại cho lỗi tạm thời; lỗi cấu hình (4xx khác 429) ném ngay, không phí lượt. */
  private async post(model: string, body: unknown): Promise<GeminiResponseBody> {
    const url = `${this.baseUrl}/models/${encodeURIComponent(model)}:generateContent`;
    let lastError = new Error('Gemini: không gọi được lần nào');

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const res = await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Key đi ở header. KHÔNG nhét vào query string: URL bị ghi vào log proxy/history.
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      let json: GeminiResponseBody = {};
      try {
        json = raw ? (JSON.parse(raw) as GeminiResponseBody) : {};
      } catch {
        throw new Error(`Gemini ${res.status} trả về không phải JSON: ${raw.slice(0, 200)}`);
      }

      if (res.ok) return json;

      const status = json.error?.status ? ` ${json.error.status}` : '';
      lastError = new Error(
        `Gemini ${res.status}${status}: ${json.error?.message ?? (raw.slice(0, 200) || 'lỗi không rõ')}`,
      );
      if (!RETRYABLE_STATUS.has(res.status) || attempt === this.maxRetries) throw lastError;
      await this.sleepImpl(this.retryDelayMs * 2 ** attempt);
    }

    throw lastError;
  }
}
