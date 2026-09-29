# ADR-010: Adapter chuẩn OpenAI Chat Completions, model chính GPT-6 luna

Trạng thái: Đã chấp nhận · 2026-09-27 · Thay cấu hình model của ADR 009

## Bối cảnh

ADR 009 chốt Gemini free tier. Đo thêm độ ổn định cùng ngày (lời gọi tuần tự, prompt `lesson@2` thật):

| Model                   | Thành công | Trung vị | Chậm nhất                         |
| ----------------------- | ---------- | -------- | --------------------------------- |
| `gemini-3.1-flash-lite` | 15/15      | 4.8 s    | 9.1 s                             |
| `gemini-3.5-flash-lite` | 10/10      | 3.5 s    | **150.7 s** (3/10 lời gọi > 90 s) |

Model dự phòng `gemini-3.5-flash-lite` của ADR 009 vì vậy không dùng được: worker cắt mỗi lời gọi ở
120 s. Người dùng quyết định chuyển sang OpenAI (trả phí, Tier 1 500 request/phút, không có hạn mức
ngày như free tier Gemini) và thử GPT-5 nano, rồi model rẻ nhất họ GPT-6.

Kết quả trên đúng pipeline (`apps/worker/src/scripts/compare-models.ts`, tài liệu mẫu
`apps/worker/fixtures/sample-vi-http.md`, mỗi dòng là một lần chạy):

| Model                   | Bài qua 4 tầng    | Lần thử / bài | Mỗi lời gọi | Cả job  | Chi phí / job |
| ----------------------- | ----------------- | ------------- | ----------- | ------- | ------------- |
| `gpt-6-luna` (low)      | 2/2 · 2/2         | 1             | 5–9 s       | 9–10 s  | ~$0.0014      |
| `gpt-5-nano` (low)      | 1/2 · 2/2         | 1–4           | 5–20 s      | 52–73 s | ~$0.006       |
| `gpt-5-nano` (medium)   | 1/2               | 2             | 18–45 s     | 126 s   | ~$0.015       |
| `gemini-3.1-flash-lite` | 2/2 · 2/2 (ADR 9) | 1             | 4–9 s       | 8–11 s  | $0 free tier  |

Đo riêng độ trễ `gpt-6-luna`: 10/10 lời gọi, 5.3–8.9 s, trung vị 6.6 s. Đọc nội dung thật: bài có
cấu trúc (heading, sơ đồ, in đậm thuật ngữ), bám nguồn, đủ loại câu hỏi (trắc nghiệm, đúng/sai, tự
luận ngắn), nói rõ khi tài liệu không nêu thông tin. GPT-5 nano thì hay để đáp án đúng dài gấp đôi
(bị luật nghiệp vụ tầng 2 chặn), chép nguyên văn tài liệu, tự thêm "A./B." vào đáp án và thêm kiến
thức ngoài (mô hình OSI). Không thử `gpt-6-sol`/`gpt-6-astra` theo yêu cầu người dùng (đắt hơn 20–100 lần).

## Quyết định

- Thêm `OpenAiCompatibleLlmProvider` (`packages/ai/src/llm/openai.ts`): gọi `POST /chat/completions`
  bằng fetch, không thêm SDK. Chọn Chat Completions thay vì Responses API (OpenAI khuyến nghị cho
  model reasoning) vì đây là chuẩn chung — cùng adapter chạy được DeepSeek, Groq, OpenRouter, Ollama
  qua `LLM_BASE_URL`.
- `LLM_PROVIDER=openai`; biến tuỳ chọn `LLM_BASE_URL`, `LLM_REASONING_EFFORT`.
- Dùng `max_completion_tokens` (mặc định 16384, **tính cả reasoning token**) và ép JSON bằng
  `response_format` kiểu `json_object`. Không gửi `temperature` trừ khi lời gọi chỉ định (model
  reasoning từ chối giá trị khác mặc định).
- Lỗi 429/500/502/503 → thử lại rồi `LlmUnavailableError` (để `FallbackLlmProvider` chuyển model);
  riêng 429 `insufficient_quota` (hết tiền) ném ngay vì thử lại hay đổi model đều vô ích.
- Cấu hình: chính `gpt-6-luna`, dự phòng `gpt-5-nano` (đã đo, ổn định dù tỉ lệ đạt thấp hơn — chỉ
  chạy khi luna lỗi), `LLM_REASONING_EFFORT=low`.

## Hệ quả

**Tốt:** chất lượng tốt nhất trong các model đã đo, nhanh ngang Gemini, không hạn mức ngày; dữ liệu
API trả phí không dùng để huấn luyện theo mặc định của OpenAI; một adapter mở ra nhiều nhà cung cấp.

**Xấu:** tốn tiền thật (~$0.0014/job — 1000 job ≈ $1.4). Mẫu đo vẫn nhỏ (một tài liệu, 2 bài/lần).

**Sẽ xem lại khi:** có tài liệu thật dài hơn/đa dạng hơn để đo lại, giá OpenAI đổi, hoặc tỉ lệ bài
bị loại trong `GenerationRun` thật tăng lên.
