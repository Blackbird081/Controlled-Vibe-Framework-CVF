<!-- Text Encoding Exception: emoji headers, bullet separators, and localized Vietnamese copy follow this file's existing convention. -->

<div align="center">

# 🤖 CVF Agent Platform

**AI-powered Prompt Engineering with Governance**

[![Version](https://img.shields.io/badge/version-1.7.0-blue.svg)](./ROADMAP.md)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](../../../LICENSE)
[![Tests](https://img.shields.io/badge/tests-3256%2F3258%20passing-brightgreen.svg)](./src/lib)
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

### 🛡️ Governance Surfaces (read-only)
| Surface | Route | Description |
|---------|-------|-------------|
| **Runtime Modules** | `/governance/runtime-modules` | Read-only registry of module Web-exposure state |
| **SOT3 Evidence** | `/governance/sot3-evidence` | Read-only status view of durable SOT3 knowledge-activation evidence |
| **MAO Durable Runs** | `/governance/mao-runs` | Read-only durable MAO run discovery, task state, timeout counts, and event recency |

These three surfaces are strictly read-only: no launch, cancel, retry, or
mutation control exists on any of them. A sibling application's Controlled
Quotation, freeze, and impact/recall capability was evaluated for adoption
and deferred (`DEFER_WITH_REASON`, see `docs/reviews/CVF_WEB_INHERITANCE_T4_CONTROLLED_QUOTATION_ADOPTION_DECISION_2026-07-18.md`
in the governance repository) pending a concrete consumer route.

### 🛠️ Technical
- 🌐 **i18n** - Vietnamese & English
- 🌙 **Dark Mode** - System-aware themes
- 📱 **Responsive** - Mobile-optimized
- ⚡ **Fast** - Lazy loading, streaming responses
- ✅ **Tested** - 3256/3258 tests passing (2 skipped)

## 📊 Quality Snapshot (2026-07-18 UTC)

| Metric | Value |
|--------|-------|
| Focused suite | 33/33 passing (help-content, governance overview, SOT3 evidence, MAO runs, runtime-modules) |
| Full non-live suite | 3256/3258 passing (2 skipped), 280/280 test files |
| TypeScript | `tsc --noEmit` clean |
| Build | production build succeeds; one pre-existing unrelated warning (`source-map-support` resolution inside `CVF_LEARNING_PLANE_FOUNDATION`) |
| Browser QA | 1 provider-free Playwright invocation (mock-config), 2/2 specs passing, zero retries, zero provider calls, zero business submissions |
| Coverage | not measured this tranche; no coverage claim is made |

---

## 🚀 Quick Start

```bash
# Install
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install

# Run
npm run dev
# Open http://localhost:3000

# Test
npm run test:run
```

### ⚙️ Configure API Keys
Go to **Settings** (⚙️) and add your keys:

| Provider | Format | Get Key |
|----------|--------|---------|
| Gemini | `AI...` | [Google AI Studio](https://aistudio.google.com) |
| OpenAI | `sk-...` | [OpenAI Platform](https://platform.openai.com) |
| Anthropic | `sk-ant-...` | [Anthropic Console](https://console.anthropic.com) |

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
├── app/
│   ├── (dashboard)/governance/    # Runtime Modules, SOT3 Evidence, MAO Durable Runs (read-only)
│   ├── (dashboard)/help/          # Bilingual Help center
│   └── ...                        # Other Next.js pages
├── components/
│   ├── AgentChat.tsx       # Main chat interface
│   ├── PhaseGateModal.tsx  # Phase gate UI (CVF)
│   ├── SpecExport.tsx      # Spec export with modes
│   └── ...
├── data/
│   └── help-content.ts     # Bilingual Help content (HELP_CONTENT)
├── lib/
│   ├── ai-providers.ts     # Gemini, OpenAI, Anthropic
│   ├── governance.ts       # Quality scoring
│   ├── cvf-checklists.ts   # Phase checklists
│   ├── quota-manager.ts    # Usage tracking
│   ├── server/              # Server-only readouts (SOT3 evidence, MAO durable runs, runtime module registry)
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

### v1.7.0 (2026-07-18)
- ✅ **Governance Read-Only Surfaces** - `/governance/runtime-modules`,
  `/governance/sot3-evidence`, and `/governance/mao-runs`; all three are
  read-only status views with no mutation control
- ✅ **Help Center Update** - bilingual link cards for SOT3 Evidence and
  MAO Durable Runs with exact routes and bounded, read-only descriptions
- 🧭 **Sibling Adoption Decision** - a retained sibling application's
  Controlled Quotation, freeze, and impact/recall capability was evaluated
  and deferred pending a concrete cvf-web consumer route; no sibling source
  was copied or implemented
- ℹ️ This is a private version alignment, not a public release

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
