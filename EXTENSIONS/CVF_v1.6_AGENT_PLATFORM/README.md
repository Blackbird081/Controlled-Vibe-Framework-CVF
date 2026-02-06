# CVF v1.6 Agent Platform

> **Controlled Vibe Framework - Agent Mode with AI Integration**  
> Chat trực tiếp với AI agents trong CVF workflow.

## 🚀 What's New in v1.6

| Feature | Description |
|---------|-------------|
| **Agent Mode** | Chat trực tiếp với AI (Gemini, OpenAI, Claude) |
| **User Context** | Tự động inject context cá nhân vào prompts |
| **Real-time Streaming** | Xem response từ AI real-time |
| **Multi-Provider** | Hỗ trợ nhiều AI providers |

## 📋 Roadmap

### Phase 1: Foundation ✅
- [x] User Context Section
- [ ] Architect/Builder Workflow UI
- [ ] Settings Page

### Phase 2: Agent UI
- [ ] Agent Chat Interface
- [ ] Execution Progress
- [ ] CVF → Agent Flow

### Phase 3: AI Connection
- [ ] Gemini Integration (Priority)
- [ ] OpenAI Integration
- [ ] Anthropic Integration

### Phase 4: Advanced
- [ ] Memory/Persistence
- [ ] Multi-Agent Workflow

## 🏃 Quick Start

```bash
cd cvf-web
npm install
npm run dev
```

Open http://localhost:3000

## 📁 Structure

```
CVF_v1.6_AGENT_PLATFORM/
├── cvf-web/                 # Next.js app
│   ├── src/
│   │   ├── app/            # Pages
│   │   ├── components/     # UI components
│   │   └── lib/
│   │       ├── ai/         # AI providers (NEW)
│   │       └── ...
│   └── ...
└── README.md
```

## 🔗 Related

- **v1.5 UX Platform:** ../CVF_v1.5_UX_PLATFORM (stable)
- **Skill Library:** ../CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS

---

*CVF v1.6 Agent Platform — Built with Next.js + AI*
