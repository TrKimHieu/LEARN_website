import {
  MockLlmProvider,
  AnthropicLlmProvider,
  GeminiLlmProvider,
  loadMockFixtures,
  type LlmProvider,
} from '@learn/ai';
import { env } from '../environment';

/**
 * HANDBOOK §15.4 — LLM_MODE=mock cho dev/CI/E2E khi chưa có LLM_API_KEY; 'live' gọi nhà cung cấp
 * thật theo LLM_PROVIDER (anthropic | google).
 */
export function createLlmProvider(): LlmProvider {
  if (env.LLM_MODE === 'mock' || !env.LLM_API_KEY) {
    return new MockLlmProvider(1200, loadMockFixtures(env.MOCK_FIXTURES_PATH));
  }
  if (env.LLM_PROVIDER === 'google') {
    // Sai họ model là lỗi cấu hình im lặng tốn một job mới lộ ra (API trả 404 giữa pipeline),
    // nên chặn ngay lúc dựng provider.
    if (!env.LLM_MODEL_GENERATION.startsWith('gemini')) {
      throw new Error(
        `LLM_PROVIDER=google nhưng LLM_MODEL_GENERATION="${env.LLM_MODEL_GENERATION}" không phải model Gemini.`,
      );
    }
    return new GeminiLlmProvider(env.LLM_API_KEY, env.LLM_MODEL_GENERATION);
  }
  return new AnthropicLlmProvider(env.LLM_API_KEY, env.LLM_MODEL_GENERATION);
}

/** Giá ước tính mỗi 1M token — HANDBOOK §8.5 theo dõi chi phí. Provider mock luôn 0. */
const COST_PER_MILLION: Record<string, { input: number; output: number }> = {
  'claude-sonnet-5': { input: 3, output: 15 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4 },
  'gemini-2.5-pro': { input: 1.25, output: 10 },
  'gemini-2.5-flash': { input: 0.3, output: 2.5 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },
};
const DEFAULT_COST = { input: 3, output: 15 };
/**
 * Model Gemini chưa có trong bảng (3.x trở lên) — dùng mức Pro để ước tính. Cố tình ước cao:
 * chặn AI_JOB_MAX_COST_USD sớm an toàn hơn là tiêu quá hạn mức rồi mới biết.
 * ⚠️ Con số 3.x chưa được đối chiếu bảng giá chính thức.
 */
const GEMINI_FALLBACK_COST = { input: 1.25, output: 10 };

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  if (model.startsWith('mock/')) return 0;
  const rate =
    COST_PER_MILLION[model] ?? (model.startsWith('gemini') ? GEMINI_FALLBACK_COST : DEFAULT_COST);
  return (inputTokens * rate.input + outputTokens * rate.output) / 1_000_000;
}
