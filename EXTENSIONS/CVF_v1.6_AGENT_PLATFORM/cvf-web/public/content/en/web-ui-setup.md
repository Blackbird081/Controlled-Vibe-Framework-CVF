# Tutorial: Setting Up the CVF Web UI (v1.6)

**Time:** 15 minutes  
**Level:** Beginner  
**What you'll do:** Install, configure, and run the CVF v1.6 web application  
**Prerequisites:** Node.js 18+, npm, at least one AI API key

---

## What is the CVF Web UI?

The v1.6 Agent Platform is a **Next.js web application** that makes CVF accessible without writing Markdown files manually. It provides:

- Template library with pre-built CVF workflows
- AI Chat with governance (quality scoring, phase gates)
- Multi-agent system (Orchestrator, Architect, Builder, Reviewer)
- Spec export with governance rules
- Usage tracking (tokens + cost per provider)

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
```

---

## Step 2: Get an AI API Key

You need **at least one** of these:

| Provider | Get Key At | Free Tier |
|----------|-----------|-----------|
| **Google AI (Gemini)** | [aistudio.google.com](https://aistudio.google.com/apikey) | Yes (generous) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Paid ($5 min) |
| **Anthropic (Claude)** | [console.anthropic.com](https://console.anthropic.com/) | Paid ($5 min) |

> **Recommendation:** Start with Google AI (Gemini) — it has the most generous free tier.

---

## Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env.local
```

Open `.env.local` in your editor and add your key(s):

```env
# Add at least ONE of these:
GOOGLE_AI_API_KEY=your-google-ai-key-here
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Set default provider
DEFAULT_AI_PROVIDER=gemini    # Options: openai, claude, gemini

# Optional: Demo mode (no real AI calls — useful for UI exploration)
# NEXT_PUBLIC_CVF_MOCK_AI=1
```

> **Tip:** If you just want to explore the UI without AI calls, set `NEXT_PUBLIC_CVF_MOCK_AI=1`.

---

## Step 4: Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser.

You should see the CVF Agent Platform homepage with:
- Template cards
- Navigation sidebar
- Language toggle (EN/VI)
- Dark mode toggle

---

## Step 5: Try Your First Template

1. **Click a template** (e.g., "Quick Draft" or "Build & Review")
2. **Fill in the form:**
   - Project name
   - What you want to build
   - Any constraints
3. **Choose governance mode:**
   - **Simple** — Just generates spec (no scoring)
   - **Rules** — AI responses scored 0-100 with accept/reject
   - **Full CVF** — Phase gates with checklists
4. **Click "Generate"** or "Start"
5. **Review the AI output**
6. **Export** the spec as Markdown (for use elsewhere)

### Template Overview

| Template | Phases | Best For |
|----------|--------|----------|
| **Quick Draft** | A → C | Fast prototyping, simple tasks |
| **Build & Review** | A → D | Production code with review |
| **Research & Analyze** | A → B | Understanding a topic, planning |
| **Team Collaboration** | Multi-phase | Complex projects with multiple roles |

---

## Step 6: Try Agent Chat

1. Click **"Agent Chat"** in the sidebar
2. Type a message (e.g., *"I want to build a REST API for a todo app"*)
3. The AI responds with CVF-governed output
4. Notice the **quality score** (0-100) below each response
5. You can:
   - ✅ **Accept** — Response meets quality bar
   - ❌ **Reject** — Response needs improvement
   - 🔄 **Retry** — Ask AI to try again

### Governance Modes in Chat

| Mode | What Happens |
|------|-------------|
| **Simple** | Chat only, no scoring |
| **Rules** | Each response scored 0-100, you accept/reject |
| **Full CVF** | Phase gates: must complete Phase A checklist before Phase B |

---

## Step 7: Explore Key Features

### Dark Mode
Click the moon/sun icon in the header. Follows system preference by default.

### Language Toggle
Switch between English (EN) and Vietnamese (VI) via the language selector.

### Usage Tracking
The Agent Chat tracks:
- Total tokens used
- Cost per provider
- Number of interactions

### File Upload
In Agent Chat, you can upload files (specs, code, docs) as context for the AI.

### Spec Export
After completing a template or chat session, click **Export** to download a Markdown file with your spec + governance rules.

---

## Common Issues

### "Cannot find module" or npm install fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### "API key not configured" error

Check your `.env.local` file:
- Make sure the key names match exactly (no typos)
- No spaces around `=`
- File is named `.env.local` (not `.env`)

### Port 3000 already in use

```bash
# Kill the process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# macOS/Linux:
lsof -i :3000
kill -9 <pid>

# Or use a different port:
PORT=3001 npm run dev
```

### Blank page / nothing loads

```bash
# Check for build errors
npm run build

# If successful, try production mode:
npm start
```

---

## Running Tests

The v1.6 platform has 270+ tests:

```bash
# Run unit tests (watch mode)
npm test

# Run tests once
npm run test:run

# Run with coverage report
npm run test:coverage

# Run end-to-end tests (Playwright)
npx playwright install    # First time only
npm run test:e2e
```

---

## Deployment Options

### Vercel (Easiest)

```bash
npm install -g vercel
vercel
# Follow prompts → deployed in ~2 minutes
```

Add environment variables in Vercel dashboard: Settings → Environment Variables.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Configuration is already in `netlify.toml`.

### Docker

See the [Hosted Deployment Guide](../CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md) for Docker, self-hosted, and advanced deployment options.

---

## Tech Stack Reference

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 16 |
| UI | React | 19 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| State | Zustand | 5 |
| Forms | React Hook Form + Zod | 7 + 4 |
| Testing | Vitest + Playwright | 4 + 1.51 |
| AI SDKs | Gemini, OpenAI, Anthropic | Latest |

---

## What's Next

| I want to... | Go to... |
|-------------|---------|
| Use multi-agent workflows | [Agent Platform Tutorial](agent-platform.md) |
| Create custom skills | [Custom Skills Tutorial](custom-skills.md) |
| Deploy for my team | [Deployment Guide](../CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md) |
| Understand governance modes | [Governance Model](../concepts/governance-model.md) |
| Learn CVF from scratch | [First Project Tutorial](first-project.md) |

---

*Last updated: February 15, 2026 | CVF v1.6*
