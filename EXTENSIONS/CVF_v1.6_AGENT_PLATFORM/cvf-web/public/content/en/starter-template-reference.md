# CVF Starter Template Reference — Express Server Example

> 📘 **Reference Implementation** — This is a learning resource, not a production-ready starter.

## What Is This?

The CVF Starter Template Reference is an **Express.js + TypeScript server template** that demonstrates how to structure an AI application with CVF governance hooks. It includes:

- **Express.js Server** — HTTP API with CORS, rate limiting, and health checks
- **AI Chat Endpoint** — `/api/chat` with streaming and non-streaming responses
- **Multi-Provider Support** — OpenAI, Claude, and Gemini configurations
- **Session Management** — Chat history with conversation context
- **Error Handling** — Structured error responses with CVF error codes
- **Docker Support** — Dockerfile and docker-compose for containerized deployment

## Project Structure

```
src/
  ├── server.ts         → Express server entry point
  ├── routes/
  │   ├── chat.ts       → AI chat endpoint with streaming
  │   └── health.ts     → Health check endpoint
  ├── middleware/
  │   ├── cors.ts       → CORS configuration
  │   ├── rateLimit.ts  → Rate limiting
  │   └── errorHandler.ts → Global error handler
  ├── services/
  │   ├── ai.service.ts → AI provider abstraction
  │   └── session.ts    → Chat session management
  ├── config/
  │   └── index.ts      → Environment configuration
  └── types/
      └── index.ts      → TypeScript type definitions

docker-compose.yml      → Container orchestration
Dockerfile              → Multi-stage Docker build
.env.example            → Environment variable template
```

## Key Patterns Demonstrated

### 1. AI Provider Abstraction

```typescript
// services/ai.service.ts
interface AIProvider {
  chat(messages: Message[], options?: ChatOptions): Promise<ChatResponse>;
  stream(messages: Message[], options?: ChatOptions): AsyncGenerator<string>;
}

// Switch providers via environment variable
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

### 3. Session Management

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

## Important Notes

### Reference-Only Status

This template contains **~49% reference-only files** that demonstrate patterns but don't connect to the main server flow. These files are annotated with `@reference-only` tags:

- Provider configurations (Gemini, Claude specific setups)
- Advanced session management features
- Detailed type definitions for future features

### No CVF Runtime Integration

This template does **not** include CVF governance enforcement. It demonstrates:

- ✅ How to structure an AI server application
- ✅ Multi-provider AI chat patterns
- ✅ Streaming response patterns
- ❌ No risk classification at runtime
- ❌ No phase gating
- ❌ No operator role checks

For governance enforcement examples, see the [CVF Toolkit Reference](/docs/toolkit-reference).

## Getting Started (For Learning)

```bash
# Navigate to the template
cd EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# AI_PROVIDER=openai
# OPENAI_API_KEY=sk-...

# Run in development mode
npm run dev

# Or build and run
npm run build
npm start
```

## When to Use This

- ✅ Learning how to structure an Express.js AI server
- ✅ Understanding multi-provider AI patterns
- ✅ Reference for streaming chat implementations
- ✅ Starting point for your own AI server (modify as needed)
- ❌ Not a production-ready template
- ❌ Does not enforce CVF governance — use [CVF Web Platform](/docs/web-ui-setup) for production

## Location

```
EXTENSIONS/CVF_STARTER_TEMPLATE_REFERENCE/
```

**Related:** [CVF Toolkit Reference](/docs/toolkit-reference) | [Agent Platform](/docs/agent-platform) | [Custom Skills](/docs/custom-skills)
