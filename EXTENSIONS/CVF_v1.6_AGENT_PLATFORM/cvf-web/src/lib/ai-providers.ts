'use client';

/**
 * AI Provider Library for CVF Agent Mode
 * Supports Gemini, OpenAI, and Anthropic APIs with streaming
 */

import { detectSpecMode } from '@/lib/agent-chat';

// Types
export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'alibaba' | 'openrouter' | 'deepseek';

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface AIStreamChunk {
    text: string;
    isComplete: boolean;
    error?: string;
}

export interface AIResponse {
    text: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model: string;
    finishReason?: string;
}

export interface AIProviderConfig {
    apiKey: string;
    model?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    language?: 'vi' | 'en';
}

const MOCK_AI_ENABLED = process.env.NEXT_PUBLIC_CVF_MOCK_AI === '1';

class MockProvider {
    private model: string;
    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.model = config.model || 'mock-ai';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const lastMessage = messages[messages.length - 1]?.content || '';
        const mode = detectSpecMode(lastMessage);

        const text = this.language === 'vi'
            ? this.buildVietnameseResponse(mode)
            : this.buildEnglishResponse(mode);

        if (onStream) {
            onStream({ text, isComplete: false });
            onStream({ text: '', isComplete: true });
        }

        const totalTokens = Math.max(1, Math.ceil(text.length / 4));

        return {
            text,
            model: this.model,
            usage: {
                promptTokens: Math.max(1, Math.ceil(lastMessage.length / 4)),
                completionTokens: totalTokens,
                totalTokens: totalTokens + Math.max(1, Math.ceil(lastMessage.length / 4)),
            },
            finishReason: 'stop',
        };
    }

    private buildVietnameseResponse(mode: 'simple' | 'governance' | 'full'): string {
        if (mode === 'full') {
            return `MOCK_FULL_RESPONSE

## PHASE A: Discovery Summary

### Hiểu biết của tôi
Mục tiêu là tạo kết quả có cấu trúc, rõ ràng và dùng được ngay.

### Giả định
- Giả định 1: Phạm vi tập trung vào deliverables chính.
- Giả định 2: Ưu tiên tính rõ ràng hơn độ chi tiết.

### Định nghĩa Scope
IN SCOPE:
- Phân tích và tóm tắt yêu cầu chính
- Đưa ra cấu trúc kết quả

OUT OF SCOPE:
- Tối ưu hóa triển khai chi tiết

### Ràng buộc
- Ràng buộc thời gian: triển khai nhanh

### Câu hỏi làm rõ
- Không có
`;
        }

        if (mode === 'governance') {
            return `MOCK_GOVERNANCE_RESPONSE

## Governance Response

### Tóm tắt
- Kết quả có cấu trúc rõ ràng
- Có checklist hành động

### Action Items
1. Xác nhận scope
2. Thực thi deliverables
3. Review kết quả
`;
        }

        return `MOCK_SIMPLE_RESPONSE

## Simple Response

- Kết quả gọn, dễ hiểu
- Có thể dùng ngay cho bước tiếp theo
`;
    }

    private buildEnglishResponse(mode: 'simple' | 'governance' | 'full'): string {
        if (mode === 'full') {
            return `MOCK_FULL_RESPONSE

## PHASE A: Discovery Summary

### My Understanding
The goal is to deliver structured, actionable output.

### Assumptions
- Assumption 1: Focus on primary deliverables.
- Assumption 2: Clarity is prioritized over depth.

### Scope Definition
IN SCOPE:
- Summarize the core request
- Produce a structured output

OUT OF SCOPE:
- Detailed implementation optimization

### Constraints
- Constraint: Fast turnaround

### Clarification Questions
- None
`;
        }

        if (mode === 'governance') {
            return `MOCK_GOVERNANCE_RESPONSE

## Governance Response

### Summary
- Structured output with guardrails
- Action checklist included

### Action Items
1. Confirm scope
2. Execute deliverables
3. Review outcome
`;
        }

        return `MOCK_SIMPLE_RESPONSE

## Simple Response

- Clear, concise output
- Ready for next step
`;
    }
}

// CVF System Prompt - Dynamic based on language
export function getCVFSystemPrompt(language: 'vi' | 'en' = 'vi'): string {
    const prompts = {
        vi: `Bạn là CVF Agent - trợ lý AI theo phương pháp Controlled-Vibe Framework (CVF).

## NGUYÊN TẮC CỐT LÕI (BẮT BUỘC!)
1. KHÔNG HỎI CÂU HỎI - Tự giả định mọi thứ dựa trên best practices
2. KHÔNG GIẢI THÍCH QUY TRÌNH - Không nói về "PHASE A", "Discovery", "Design"... 
3. CHỈ TRẢ VỀ KẾT QUẢ CUỐI CÙNG - User chỉ cần thấy deliverables, không cần biết process
4. HÀNH ĐỘNG NGAY - Không đợi xác nhận, không liệt kê các bước sẽ làm

## KHI NHẬN SPEC/BÁO CÁO
- KHÔNG tóm tắt lại spec (user đã biết rồi)
- KHÔNG liệt kê các bước sẽ thực hiện
- TRỰC TIẾP đưa ra kết quả: code, tài liệu, kế hoạch cụ thể...

## TRƯỜNG HỢP ĐẶC BIỆT: "Hướng dẫn dùng CVF"
Khi user hỏi cách dùng CVF, BẮT BUỘC trả lời theo mẫu sau với 5 ví dụ theo 5 phase:

---
Chào bạn! Tôi là CVF Agent, hoạt động theo phương pháp Controlled-Vibe Framework. Đây là cách tôi có thể giúp bạn qua 5 giai đoạn:

## 🧭 Phase A: Intake (Tiếp nhận)
**Yêu cầu:** "Phân tích đối thủ cạnh tranh cho app đặt đồ ăn"
**Tôi sẽ đưa ra:** Báo cáo phân tích chi tiết.

### Phân tích Đối thủ - App Đặt Đồ Ăn
| Đối thủ | Điểm mạnh | Điểm yếu | Thị phần |
|---------|-----------|----------|----------|
| GrabFood | Hệ sinh thái lớn, tích hợp Grab | Phí cao, UI phức tạp | 45% |
| ShopeeFood | Giá rẻ, voucher nhiều | Tài xế ít vùng xa | 30% |
| Baemin | UI đẹp, marketing tốt | Khu vực giới hạn | 15% |

**Cơ hội:** Tập trung vào tốc độ giao hàng và chất lượng nhà hàng.

---

## ✏️ Phase B: Design (Thiết kế)
**Yêu cầu:** "Thiết kế màn hình đặt hàng cho app đồ ăn"
**Tôi sẽ đưa ra:** Mô tả UI chi tiết.

### Màn hình Đặt Hàng
- **Header:** Logo nhà hàng, rating, thời gian giao dự kiến
- **Menu:** Danh sách món ăn với ảnh, giá, nút "+"
- **Giỏ hàng (bottom sheet):** Số món, tổng tiền, nút "Đặt ngay"
- **Checkout:** Địa chỉ, phương thức thanh toán, ghi chú

---

## 🔨 Phase C: Build (Xây dựng)
**Yêu cầu:** "Viết API endpoint đặt hàng bằng Node.js"
**Tôi sẽ đưa ra:** Code hoàn chỉnh.

\`\`\`javascript
// POST /api/orders
app.post('/api/orders', async (req, res) => {
  const { userId, restaurantId, items, address, paymentMethod } = req.body;
  
  // Validate
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Giỏ hàng trống' });
  }
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Create order
  const order = await Order.create({
    userId, restaurantId, items, address, paymentMethod,
    total, status: 'pending', createdAt: new Date()
  });
  
  res.status(201).json({ orderId: order.id, total, estimatedTime: '30-45 phút' });
});
\`\`\`

---

## ✅ Phase D: Review (Đánh giá)
**Yêu cầu:** "Review code API đặt hàng ở trên"
**Tôi sẽ đưa ra:** Đánh giá và cải thiện.

### Code Review
| Tiêu chí | Điểm | Ghi chú |
|----------|------|---------|
| Logic | 8/10 | Rõ ràng, đúng flow |
| Error Handling | 6/10 | Cần thêm try-catch |
| Security | 5/10 | Thiếu validate userId |
| Performance | 7/10 | OK cho MVP |

**Cần cải thiện:**
- Thêm authentication middleware
- Validate paymentMethod hợp lệ
- Thêm transaction cho database

---

## 🔒 Phase E: Freeze (Khóa kết quả)
**Yêu cầu:** "Chốt bản review này để đối soát về sau"
**Tôi sẽ đưa ra:** Biên bản khóa kết quả và baseline delta.

### Freeze Record
- **Acceptance:** Đã chấp nhận sau review
- **Baseline artifact:** \`docs/baselines/...\`
- **Open follow-up:** Bổ sung test hiệu năng ở batch sau
- **Status:** Scope của lần chạy này đã được khóa

---

Hãy cho tôi biết bạn cần hỗ trợ ở Phase nào!

## OUTPUT FORMAT
- Đưa DELIVERABLES thực tế (code, PRD, wireframe description, kế hoạch...)
- Ngắn gọn, có cấu trúc, dễ sử dụng ngay
- Trả lời bằng TIẾNG VIỆT
- Dùng markdown formatting rõ ràng`,

        en: `You are CVF Agent - an AI assistant following Controlled-Vibe Framework (CVF).

## CORE PRINCIPLES (MANDATORY!)
1. NO QUESTIONS - Make all assumptions based on best practices
2. NO PROCESS EXPLANATION - Don't mention "PHASE A", "Discovery", "Design"...
3. DELIVER FINAL RESULTS ONLY - User only needs deliverables, not process
4. ACT IMMEDIATELY - Don't wait for confirmation, don't list steps you'll take

## WHEN RECEIVING SPEC/REPORT
- DON'T summarize the spec (user already knows it)
- DON'T list steps you're going to take
- DIRECTLY provide results: code, documents, concrete plans...

## OUTPUT FORMAT
- Provide ACTUAL DELIVERABLES (code, PRD, wireframe description, plans...)
- Concise, structured, immediately usable
- Respond in ENGLISH
- Use clear markdown formatting`
    };

    return prompts[language];
}

// ==================== GEMINI PROVIDER ====================
export class GeminiProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gemini-2.5-flash';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemPrompt = getCVFSystemPrompt(this.language);

        // Build contents array
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        }));

        // Add system instruction as first user message if needed
        if (systemPrompt && contents.length > 0) {
            contents[0].parts[0].text = `${systemPrompt}\n\n---\n\n${contents[0].parts[0].text}`;
        }

        const endpoint = onStream
            ? `${this.baseUrl}/models/${this.model}:streamGenerateContent?key=${this.apiKey}`
            : `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            if (onStream) {
                return await this.streamRequest(endpoint, contents, onStream);
            } else {
                return await this.standardRequest(endpoint, contents);
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Gemini API Error: ${errorMsg}`);
        }
    }

    private async standardRequest(endpoint: string, contents: Array<{ role: string; parts: { text: string }[] }>): Promise<AIResponse> {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            text,
            model: this.model,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount || 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata?.totalTokenCount || 0,
            },
            finishReason: data.candidates?.[0]?.finishReason,
        };
    }

    private async streamRequest(
        endpoint: string,
        contents: Array<{ role: string; parts: { text: string }[] }>,
        onStream: (chunk: AIStreamChunk) => void
    ): Promise<AIResponse> {
        const response = await fetch(endpoint + '&alt=sse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) {
                            fullText += text;
                            onStream({ text, isComplete: false });
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== OPENAI PROVIDER ====================
export class OpenAIProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.openai.com/v1';

    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'gpt-4o-mini';
        this.baseUrl = config.baseUrl || this.baseUrl;
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: getCVFSystemPrompt(this.language) };
        const allMessages = [systemMessage, ...messages];

        const body = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
            stream: !!onStream,
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                return {
                    text: data.choices[0]?.message?.content || '',
                    model: this.model,
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0,
                    },
                    finishReason: data.choices[0]?.finish_reason,
                };
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`OpenAI API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.choices?.[0]?.delta?.content || '';
                        if (text) {
                            fullText += text;
                            onStream({ text, isComplete: false });
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== ANTHROPIC PROVIDER ====================
export class AnthropicProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://api.anthropic.com/v1';

    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'claude-sonnet-4-20250514';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        // Filter out system messages and use as system param
        const userMessages = messages.filter(m => m.role !== 'system');

        const body = {
            model: this.model,
            max_tokens: 4096,
            system: getCVFSystemPrompt(this.language),
            messages: userMessages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content
            })),
            stream: !!onStream,
        };

        try {
            const response = await fetch(`${this.baseUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                const text = data.content?.[0]?.text || '';
                return {
                    text,
                    model: this.model,
                    usage: {
                        promptTokens: data.usage?.input_tokens || 0,
                        completionTokens: data.usage?.output_tokens || 0,
                        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
                    },
                    finishReason: data.stop_reason,
                };
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Anthropic API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'content_block_delta') {
                            const text = data.delta?.text || '';
                            if (text) {
                                fullText += text;
                                onStream({ text, isComplete: false });
                            }
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== ALIBABA DASHSCOPE PROVIDER ====================
export class AlibabaDashScopeWebProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'qwen-turbo';
        this.language = config.language || 'vi';
    }

    private isStreamingOnlyModel(): boolean {
        return /^qvq-/i.test(this.model);
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: getCVFSystemPrompt(this.language) };
        const allMessages = [systemMessage, ...messages];
        const isStreamingOnly = this.isStreamingOnlyModel();

        const body = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
            stream: !!onStream || isStreamingOnly,
            ...((!!onStream || isStreamingOnly) ? { stream_options: { include_usage: true } } : {}),
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                if (isStreamingOnly && error.error?.code === 'model_not_supported') {
                    throw new Error(
                        `Alibaba model ${this.model} is not supported on the current compatible-mode endpoint. ` +
                        'Try qvq-max or use a provider-specific endpoint/adapter that supports this snapshot model.'
                    );
                }
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream || isStreamingOnly) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                return {
                    text: data.choices[0]?.message?.content || '',
                    model: this.model,
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0,
                    },
                    finishReason: data.choices[0]?.finish_reason,
                };
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Alibaba DashScope API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let reasoningText = '';
        let buffer = '';
        let usage: AIResponse['usage'] | undefined;
        let finishReason: string | undefined;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.choices?.[0]?.delta?.content || '';
                        const reasoning = data.choices?.[0]?.delta?.reasoning_content || '';
                        if (text) {
                            fullText += text;
                            onStream?.({ text, isComplete: false });
                        }
                        if (reasoning) {
                            reasoningText += reasoning;
                        }
                        if (typeof data.choices?.[0]?.finish_reason === 'string') {
                            finishReason = data.choices[0].finish_reason;
                        }
                        if (data.usage) {
                            usage = {
                                promptTokens: data.usage?.prompt_tokens || 0,
                                completionTokens: data.usage?.completion_tokens || 0,
                                totalTokens: data.usage?.total_tokens || 0,
                            };
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream?.({ text: '', isComplete: true });

        return {
            text: fullText || reasoningText,
            model: this.model,
            usage,
            finishReason: finishReason || 'stop',
        };
    }
}

// ==================== OPENROUTER PROVIDER ====================
export class OpenRouterProvider {
    private apiKey: string;
    private model: string;
    private baseUrl = 'https://openrouter.ai/api/v1';
    private language: 'vi' | 'en';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'meta-llama/llama-4-maverick';
        this.language = config.language || 'vi';
    }

    async chat(messages: AIMessage[], onStream?: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const systemMessage: AIMessage = { role: 'system', content: getCVFSystemPrompt(this.language) };
        const allMessages = [systemMessage, ...messages];

        const body = {
            model: this.model,
            messages: allMessages.map(m => ({ role: m.role, content: m.content })),
            temperature: 0.7,
            max_tokens: 4096,
            stream: !!onStream,
        };

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://cvf.dev',
                    'X-Title': 'CVF Agent Platform',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `HTTP ${response.status}`);
            }

            if (onStream) {
                return await this.handleStream(response, onStream);
            } else {
                const data = await response.json();
                return {
                    text: data.choices[0]?.message?.content || '',
                    model: this.model,
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0,
                    },
                    finishReason: data.choices[0]?.finish_reason,
                };
            }
        } catch (error: unknown) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`OpenRouter API Error: ${errorMsg}`);
        }
    }

    private async handleStream(response: Response, onStream: (chunk: AIStreamChunk) => void): Promise<AIResponse> {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.choices?.[0]?.delta?.content || '';
                        if (text) {
                            fullText += text;
                            onStream({ text, isComplete: false });
                        }
                    } catch {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onStream({ text: '', isComplete: true });

        return {
            text: fullText,
            model: this.model,
            finishReason: 'stop',
        };
    }
}

// ==================== UNIFIED PROVIDER ====================
export function createAIProvider(provider: AIProvider, config: AIProviderConfig) {
    if (MOCK_AI_ENABLED) {
        return new MockProvider(config);
    }
    switch (provider) {
        case 'gemini':
            return new GeminiProvider(config);
        case 'openai':
            return new OpenAIProvider(config);
        case 'anthropic':
            return new AnthropicProvider(config);
        case 'alibaba':
            return new AlibabaDashScopeWebProvider(config);
        case 'openrouter':
            return new OpenRouterProvider(config);
        case 'deepseek':
            return new OpenAIProvider({
                ...config,
                model: config.model || 'deepseek-chat',
                baseUrl: 'https://api.deepseek.com',
            });
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// Hook for using AI in components
import { useState, useCallback } from 'react';
import { useSettings } from '@/components/Settings';

export function useAI() {
    const { settings } = useSettings();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = useCallback(async (
        messages: AIMessage[],
        onStream?: (chunk: AIStreamChunk) => void
    ): Promise<AIResponse | null> => {
        const provider = settings.preferences.defaultProvider;
        const apiKey = settings.providers[provider]?.apiKey;

        if (!apiKey) {
            setError('No API key configured');
            return null;
        }

        setIsLoading(true);
        setError(null);

        try {
            const aiProvider = createAIProvider(provider, { apiKey });
            const response = await aiProvider.chat(messages, onStream);
            return response;
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [settings]);

    return {
        sendMessage,
        isLoading,
        error,
        provider: settings.preferences.defaultProvider,
        hasApiKey: !!settings.providers[settings.preferences.defaultProvider]?.apiKey,
    };
}
