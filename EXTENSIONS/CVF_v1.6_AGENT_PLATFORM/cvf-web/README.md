# CVF v1.6 Agent Platform - Web Application

> **AI expertise for everyone** — User-friendly AI-powered prompt engineering platform

## 🚀 Features

### Core Features
- **Template Library** - Pre-built prompts for various use cases
- **Category Filtering** - Browse by Product, Marketing, Business, etc.
- **Quick Reference** - Access common prompts fast
- **Execution History** - Track and revisit past generations

### AI Agent Features (v1.6+)
- **🤖 AI Agent Chat** - Chat with AI using Gemini, OpenAI, or Anthropic
- **🎯 Multi-Agent Workflow** - Orchestrate multiple agents (Architect, Builder, Reviewer)
- **🛠️ Agent Tools** - 8 built-in tools (Web Search, Code Execute, Calculator, etc.)
- **💾 Chat History** - Persistent conversation storage
- **🔄 Provider Switching** - Switch between AI providers seamlessly

### Technical Features
- **🌐 i18n** - Vietnamese and English language support
- **🌙 Dark Mode** - System-aware theme switching
- **📱 Responsive** - Mobile-optimized UI
- **⚡ Performance** - Lazy loading, code splitting
- **🔒 Security** - Input validation, sandboxed execution

---

## 📦 Installation

```bash
# Navigate to cvf-web directory
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

---

## ⚙️ Configuration

### API Keys
Go to **Settings** (⚙️ icon) to configure your AI provider API keys:

| Provider | Key Format | Get Key |
|----------|------------|---------|
| Gemini | `AI...` | [Google AI Studio](https://aistudio.google.com) |
| OpenAI | `sk-...` | [OpenAI Platform](https://platform.openai.com) |
| Anthropic | `sk-ant-...` | [Anthropic Console](https://console.anthropic.com) |

---

## 📁 Project Structure

```
cvf-web/
├── src/
│   ├── app/              # Next.js pages
│   │   ├── layout.tsx    # Root layout with providers
│   │   └── page.tsx      # Main app page
│   ├── components/       # React components
│   │   ├── AgentChat.tsx         # AI chat interface
│   │   ├── MultiAgentPanel.tsx   # Multi-agent workflow
│   │   ├── ToolsPage.tsx         # Agent tools UI
│   │   ├── MobileComponents.tsx  # Mobile UI
│   │   └── ...
│   ├── lib/              # Utilities & hooks
│   │   ├── ai-providers.ts   # AI provider integrations
│   │   ├── chat-history.tsx  # Chat persistence
│   │   ├── multi-agent.tsx   # Multi-agent logic
│   │   ├── agent-tools.tsx   # Tool definitions
│   │   ├── security.ts       # Security utilities
│   │   ├── error-handling.tsx # Error handling
│   │   ├── i18n.tsx          # Internationalization
│   │   └── theme.tsx         # Dark mode
│   └── types/            # TypeScript types
└── public/               # Static assets
```

---

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🎨 Tech Stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Hooks + Zustand
- **AI:** Gemini, OpenAI, Anthropic APIs

---

## 📝 Changelog

### v1.6.0 (2026-02-06)
- ✅ Phase 1: User Context & Settings
- ✅ Phase 2: Agent Chat Interface  
- ✅ Phase 3: AI Provider Integration
- ✅ Phase 4: Memory, Multi-Agent, Tools
- ✅ Phase 5: Complete i18n (160+ keys)
- ✅ Phase 6: Error Handling
- ✅ Phase 8: Performance (Lazy loading)
- ✅ Phase 9: Security
- ✅ Phase 10: Mobile UI

---

## 📄 License

MIT License - See [LICENSE](../../../LICENSE) for details.

---

**Made with ❤️ by the CVF Team**
