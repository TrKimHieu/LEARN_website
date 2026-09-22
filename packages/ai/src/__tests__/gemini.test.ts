import { describe, it, expect } from 'vitest';
import { GeminiLlmProvider } from '../llm/gemini';

type FetchCall = { url: string; init: RequestInit };

/** fetch giả: ghi lại request và trả body dựng sẵn — không chạm mạng. */
function stubFetch(status: number, body: unknown, calls: FetchCall[] = []) {
  const impl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

function okBody(overrides: Record<string, unknown> = {}) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text: 'phần suy nghĩ', thought: true }, { text: '{"ok":' }, { text: 'true}' }],
        },
        finishReason: 'STOP',
      },
    ],
    usageMetadata: { promptTokenCount: 16, candidatesTokenCount: 4, thoughtsTokenCount: 140 },
    modelVersion: 'gemini-3.6-flash',
    ...overrides,
  };
}

describe('GeminiLlmProvider', () => {
  it('gửi key ở header, không bao giờ ở URL', async () => {
    const { impl, calls } = stubFetch(200, okBody());
    const provider = new GeminiLlmProvider('secret-key', 'gemini-3.6-flash', { fetchImpl: impl });

    await provider.generate({ prompt: 'xin chào' });

    const call = calls[0];
    if (!call) throw new Error('fetch không được gọi');
    expect(call.url).not.toContain('secret-key');
    expect(call.url).toContain('/models/gemini-3.6-flash:generateContent');
    expect((call.init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret-key');
  });

  it('ánh xạ prompt/system/tham số sinh vào body Gemini', async () => {
    const { impl, calls } = stubFetch(200, okBody());
    const provider = new GeminiLlmProvider('k', 'gemini-3.6-flash', { fetchImpl: impl });

    await provider.generate({
      prompt: 'sinh bài học',
      system: 'bạn là trợ lý',
      temperature: 0.7,
      maxTokens: 1024,
    });

    const call = calls[0];
    if (!call) throw new Error('fetch không được gọi');
    const body = JSON.parse(String(call.init.body)) as {
      contents: Array<{ parts: Array<{ text: string }> }>;
      systemInstruction: { parts: Array<{ text: string }> };
      generationConfig: Record<string, unknown>;
    };
    expect(body.contents[0].parts[0].text).toBe('sinh bài học');
    expect(body.systemInstruction.parts[0].text).toBe('bạn là trợ lý');
    expect(body.generationConfig).toMatchObject({
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    });
  });

  it('nối text các part, bỏ part suy nghĩ, cộng thought token vào output', async () => {
    const { impl } = stubFetch(200, okBody());
    const provider = new GeminiLlmProvider('k', 'gemini-3.6-flash', { fetchImpl: impl });

    const res = await provider.generate({ prompt: 'x' });

    expect(res.text).toBe('{"ok":true}');
    expect(res.inputTokens).toBe(16);
    expect(res.outputTokens).toBe(144); // 4 nội dung + 140 suy nghĩ
    expect(res.model).toBe('gemini-3.6-flash');
  });

  it('ném lỗi kèm thông điệp của API khi HTTP lỗi', async () => {
    const { impl } = stubFetch(404, {
      error: { code: 404, message: 'This model is no longer available', status: 'NOT_FOUND' },
    });
    const provider = new GeminiLlmProvider('k', 'gemini-2.5-flash', { fetchImpl: impl });

    await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(
      /Gemini 404 NOT_FOUND: This model is no longer available/,
    );
  });

  it('nói rõ nguyên nhân khi token suy nghĩ ăn hết maxOutputTokens', async () => {
    const { impl } = stubFetch(
      200,
      okBody({ candidates: [{ content: { parts: [] }, finishReason: 'MAX_TOKENS' }] }),
    );
    const provider = new GeminiLlmProvider('k', 'gemini-3.6-flash', { fetchImpl: impl });

    await expect(provider.generate({ prompt: 'x', maxTokens: 64 })).rejects.toThrow(
      /chạm maxOutputTokens \(64\)/,
    );
  });

  it('thử lại khi 503 rồi thành công', async () => {
    const calls: FetchCall[] = [];
    const responses = [
      {
        status: 503,
        body: { error: { code: 503, message: 'high demand', status: 'UNAVAILABLE' } },
      },
      { status: 200, body: okBody() },
    ];
    const impl = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      const next = responses.shift();
      if (!next) throw new Error('gọi quá số lần dự kiến');
      return new Response(JSON.stringify(next.body), { status: next.status });
    }) as unknown as typeof fetch;

    const waits: number[] = [];
    const provider = new GeminiLlmProvider('k', 'gemini-3.5-flash', {
      fetchImpl: impl,
      sleepImpl: async (ms) => {
        waits.push(ms);
      },
    });

    const res = await provider.generate({ prompt: 'x' });

    expect(res.text).toBe('{"ok":true}');
    expect(calls).toHaveLength(2);
    expect(waits).toEqual([1000]);
  });

  it('không thử lại lỗi cấu hình 404', async () => {
    const { impl, calls } = stubFetch(404, {
      error: { code: 404, message: 'model not found', status: 'NOT_FOUND' },
    });
    const provider = new GeminiLlmProvider('k', 'gemini-2.5-flash', {
      fetchImpl: impl,
      sleepImpl: async () => {},
    });

    await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(/404/);
    expect(calls).toHaveLength(1);
  });

  it('báo lỗi rõ khi body không phải JSON', async () => {
    const { impl } = stubFetch(502, '<html>bad gateway</html>');
    const provider = new GeminiLlmProvider('k', 'gemini-3.6-flash', { fetchImpl: impl });

    await expect(provider.generate({ prompt: 'x' })).rejects.toThrow(/không phải JSON/);
  });
});
