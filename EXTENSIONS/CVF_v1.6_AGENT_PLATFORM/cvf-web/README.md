<div align="center">

# 🤖 CVF Agent Platform

**AI-powered Prompt Engineering with Governance**

[![Version](https://img.shields.io/badge/version-1.6.0-blue.svg)](./ROADMAP.md)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](../../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-1412%2F1415%20passing-brightgreen.svg)](./src/lib)
[![Coverage](https://img.shields.io/badge/coverage-89.77%25-yellowgreen.svg)](./coverage/coverage-summary.json)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org)

[Features](#-features) • [Quick Start](#-quick-start) • [CVF Governance](#-cvf-governance) • [Architecture](#-architecture)

</div>

---

## ✨ Features

### 🎯 Core
| Feature | Description |
|---------|-------------|
| **Template Library** | Pre-built prompts for Product, Marketing, Business |
| **AI Agent Chat** | Multi-provider: Gemini, OpenAI, Anthropic |
| **Spec Export** | Export specs with governance rules |
| **Usage Tracking** | Token & cost monitoring per provider |

### 🚦 CVF Governance (NEW!)
| Mode | Features |
|------|----------|
| **Đơn giản** | Basic phase indicator |
| **Có Quy tắc** | + Quality Score (0-100) + Accept/Reject |
| **CVF Full** | + Phase Gates + Checklists + Compliance |

### 🛠️ Technical
- 🌐 **i18n** - Vietnamese & English
- 🌙 **Dark Mode** - System-aware themes
- 📱 **Responsive** - Mobile-optimized
- ⚡ **Fast** - Lazy loading, streaming responses
- ✅ **Tested** - 1412/1415 tests passing (3 skipped)

## 📊 Quality Snapshot (2026-02-22 UTC)

| Metric | Value |
|--------|-------|
| Lint | 0 errors, 95 warnings |
| Tests | 1412/1415 passing (3 skipped) |
| Coverage | Statements 89.77% · Branches 76.42% · Functions 89.54% · Lines 91.07% |
| Source Artifacts | `eslint-report.json`, `test-results.json`, `coverage/coverage-summary.json` |

---

## 🚀 Quick Start

```bash
# Install
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm ci

# Run
npm run dev
# Open http://localhost:3000

# Test
npm run check
```

### ⚙️ Configure API Keys
Go to **Settings** (⚙️) and add your keys:

| Provider | Public proof posture |
|----------|----------------------|
| Alibaba/DashScope | Primary certified live release lane |
| DeepSeek | Certified canary lane with bounded confirmatory coverage |
| Other providers | Adapter or experimental surfaces only until separately certified |

For release-quality governance proof, run from the repository root:

```bash
python scripts/run_cvf_release_gate_bundle.py --json
```

For a non-live developer check, run from the repository root after `npm ci`:

```bash
python scripts/run_cvf_static_ci_gate.py --json
```

### 🧭 API Key Wizard (NEW)
Nếu chưa có API key, vào Home sẽ thấy banner **“API key chưa được cấu hình”**.  
Nhấn **API Key Wizard** để cấu hình nhanh.

---

## ☁️ Hosted Deployment

Tài liệu deploy lên Vercel/Netlify:  
`docs/CVF_HOSTED_DEPLOYMENT_GUIDE_V1_6.md`

---

## 🚦 CVF Governance

The platform implements **Controlled Vibe Framework** governance rules:

### 4-Phase Process
```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  🔍 Phase A │ → │  ✏️ Phase B │ → │  🔨 Phase C │ → │  ✅ Phase D │
│  Discovery  │   │   Design    │   │    Build    │   │   Review    │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

### Governance Features
- **Mode Detection** - Auto-detect from spec content
- **Quality Scoring** - AI response rated 0-100
- **Accept/Reject/Retry** - User controls AI output
- **Phase Gates** - Checklist before proceeding
- **Compliance Check** - Verify required items

---

## 📁 Architecture

```
src/
├── app/                    # Next.js pages
├── components/
│   ├── AgentChat.tsx       # Main chat interface
│   ├── PhaseGateModal.tsx  # Phase gate UI (CVF)
│   ├── SpecExport.tsx      # Spec export with modes
│   └── ...
├── lib/
│   ├── ai-providers.ts     # Gemini, OpenAI, Anthropic
│   ├── governance.ts       # Quality scoring
│   ├── cvf-checklists.ts   # Phase checklists
│   ├── quota-manager.ts    # Usage tracking
│   └── *.test.ts           # Unit tests
└── types/                  # TypeScript types
```

---

## 📊 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Watch mode tests |
| `npm run test:run` | Single run tests |

---

## 📝 Changelog

### v1.6.0 (2026-02-07)
- ✅ **CVF Governance Integration**
  - Phase 1: Mode Detection & Badge
  - Phase 2: Quality Scoring + Accept/Reject
  - Phase 3: Phase Gates + Checklists
- ✅ **Unit Tests** - Added comprehensive governance test suite
- ✅ **Usage Tracking** - Token & cost per provider

---

<div align="center">

**Made with ❤️ using the Controlled Vibe Framework**

[CVF Documentation](../../../docs) • [Skill Governance](../../../governance/skill-library/) • [Report Issue](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)

</div>
