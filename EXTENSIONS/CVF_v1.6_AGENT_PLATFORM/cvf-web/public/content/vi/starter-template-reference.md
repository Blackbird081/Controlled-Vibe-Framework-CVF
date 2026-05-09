# CVF Starter Template Reference — Ví Dụ Express Server

> 📘 **Triển Khai Tham Khảo** — Đây là tài liệu học tập, không phải starter sẵn sàng cho production.

## Đây Là Gì?

CVF Starter Template Reference là một **template server Express.js + TypeScript** minh họa cách cấu trúc ứng dụng AI với các hook governance CVF. Bao gồm:

- **Express.js Server** — HTTP API với CORS, rate limiting, và health checks
- **AI Chat Endpoint** — `/api/chat` với streaming và non-streaming responses
- **Hỗ Trợ Đa Nhà Cung Cấp** — Cấu hình OpenAI, Claude, và Gemini
- **Quản Lý Phiên** — Lịch sử chat với ngữ cảnh hội thoại
- **Xử Lý Lỗi** — Phản hồi lỗi có cấu trúc với mã lỗi CVF
- **Hỗ Trợ Docker** — Dockerfile và docker-compose cho triển khai container

## Cấu Trúc Dự Án

```
src/
  ├── server.ts         → Điểm vào Express server
  ├── routes/
  │   ├── chat.ts       → Endpoint chat AI với streaming
  │   └── health.ts     → Endpoint kiểm tra sức khỏe
  ├── middleware/
  │   ├── cors.ts       → Cấu hình CORS
  │   ├── rateLimit.ts  → Giới hạn tốc độ
  │   └── errorHandler.ts → Xử lý lỗi toàn cục
  ├── services/
  │   ├── ai.service.ts → Trừu tượng nhà cung cấp AI
  │   └── session.ts    → Quản lý phiên chat
  ├── config/
  │   └── index.ts      → Cấu hình môi trường
  └── types/
      └── index.ts      → Định nghĩa type TypeScript

docker-compose.yml      → Điều phối container
Dockerfile              → Docker build đa giai đoạn
.env.example            → Mẫu biến môi trường
```

## Các Mẫu Thiết Kế Chính

### 1. Trừu Tượng Nhà Cung Cấp AI

```typescript
// services/ai.service.ts
interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  stream(messages: Message[], options?: ChatOptions): AsyncGenerator<string>;
}

// Chuyển đổi nhà cung cấp qua biến môi trường
const provider = createProvider(process.env.AI_PROVIDER); // 'openai' | 'claude' | 'gemini'
```

### 2. Streaming Responses

```typescript
// routes/chat.ts
router.post('/api/chat', async (req, res) => {
  if (req.body.stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    for await (const chunk of provider.stream(messages)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    res.end();
  } else {
    const response = await provider.chat(messages);
    res.json(response);
  }
});
```

### 3. Quản Lý Phiên

```typescript
// services/session.ts
class SessionManager {
  private sessions: Map<string, ChatSession>;

  getOrCreate(sessionId: string): ChatSession;
  addMessage(sessionId: string, message: Message): void;
  getHistory(sessionId: string): Message[];
  clear(sessionId: string): void;
}
```

## Lưu Ý Quan Trọng

### Trạng Thái Chỉ Tham Khảo

Template này chứa **~49% file chỉ tham khảo** minh họa các mẫu nhưng không kết nối với luồng server chính. Các file này được đánh dấu `@reference-only`:

- Cấu hình nhà cung cấp (Gemini, Claude cụ thể)
- Tính năng quản lý phiên nâng cao
- Định nghĩa type chi tiết cho tính năng tương lai

### Không Tích Hợp CVF Runtime

Template này **không** bao gồm CVF governance enforcement. Nó minh họa:
- ✅ Cách cấu trúc ứng dụng server AI
- ✅ Mẫu chat AI đa nhà cung cấp
- ✅ Mẫu streaming response
- ❌ Không phân loại rủi ro runtime
- ❌ Không gating phase
- ❌ Không kiểm tra vai trò operator

Để xem ví dụ governance enforcement, xem [CVF Toolkit Reference](/docs/toolkit-reference).

## Bắt Đầu (Để Học)

```bash
# Điều hướng đến template
cd EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/

# Cài đặt dependencies
npm install

# Sao chép mẫu môi trường
cp .env.example .env

# Chỉnh sửa .env với API keys của bạn
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...

# Chạy development mode
npm run dev

# Hoặc build và chạy
npm run build
npm start
```

## Khi Nào Sử Dụng

- ✅ Học cách cấu trúc Express.js AI server
- ✅ Hiểu mẫu AI đa nhà cung cấp
- ✅ Tham khảo cho triển khai streaming chat
- ✅ Điểm khởi đầu cho AI server riêng (sửa đổi theo nhu cầu)
- ❌ Không phải template sẵn sàng production
- ❌ Không enforce CVF governance — dùng [CVF Web Platform](/docs/web-ui-setup) cho production

## Vị Trí

```
EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/
```

**Liên quan:** [CVF Toolkit Reference](/docs/toolkit-reference) | [Agent Platform](/docs/agent-platform) | [Custom Skills](/docs/custom-skills)
