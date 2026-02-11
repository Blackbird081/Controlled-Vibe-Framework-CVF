# Controlled Vibe Framework (CVF)

**Framework quản lý dự án theo tinh thần *vibe coding có kiểm soát*.**

> **Current Version:** v1.6.0 | **Latest:** CVF Agent Platform 🤖  
> **Assessment:** 8.8/10 (Post-Fix) | 8.5/10 (Calibrated) | 9.5/10 (Self) — [Post-Fix Review](./docs/CVF_EXPERT_REVIEW_POST_FIX_2026-02-11.md) | [Independent Review](./docs/CVF_INDEPENDENT_EXPERT_REVIEW_2026-02-08.md) | [Self-Assessment](./docs/CVF_COMPREHENSIVE_ASSESSMENT_2026-02-07.md)  
> **Remediation:** [Combined Roadmap](./docs/CVF_COMBINED_ASSESSMENT_ROADMAP_2026-02-08.md)  
> **Last Updated:** Feb 11, 2026

---

## ✅ Independent Verdict (Expert Lens)

**Current status:** CVF is mature in **architecture, governance, and code quality**, but **not yet empirically proven** for enterprise claims.

**What is already solid:**
- Layered architecture and governance model (Core/Tools/Platform)
- Risk model R0-R3 and capability lifecycle
- v1.6 agent platform with real AI integration and strong test coverage

**What still blocks 9.0+/10:**
- **Real-world validation** (pilot projects with measurable impact)
- **Real provider tests** (live API keys + CI secrets)
- **Community/Ecosystem** (npm/PyPI publish, Slack/Jira/GitHub App, public adoption)

➡️ These remaining items are tracked in **Phase 6** of the roadmap: [CVF_REMAINING_ROADMAP_2026-02-08.md](./docs/CVF_REMAINING_ROADMAP_2026-02-08.md)

**Phase 6 checklist (public validation):**
- [ ] Pilot program (2-3 real projects + metrics)
- [ ] Real AI provider tests (OpenAI/Gemini/Claude with CI secrets)
- [ ] Publish SDK to npm/PyPI
- [ ] Community launch (demo video + blog + repo onboarding)
- [ ] Third-party integrations (Slack/Jira/GitHub App)

**VS Code resources (EN/VI):**
- [CVF_IN_VSCODE_GUIDE.md](./docs/CVF_IN_VSCODE_GUIDE.md)
- [CVF_VSCODE_PLAYBOOK.md](./docs/CVF_VSCODE_PLAYBOOK.md)

---

## 🧩 Agent Usage Resources (VS Code reference)

> **Note:** These guides are agent-agnostic. VS Code is just the reference workflow.

- **Detailed guide:** [CVF_IN_VSCODE_GUIDE.md](./docs/CVF_IN_VSCODE_GUIDE.md) (EN/VI, agent-agnostic)
- **Playbook (checklists):** [CVF_VSCODE_PLAYBOOK.md](./docs/CVF_VSCODE_PLAYBOOK.md) (EN/VI, agent-agnostic)

---

## 🚀 Quick Start (4 Options)

### Option 1: Agent Platform (Newest) 🤖 RECOMMENDED

```bash
cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install
npm run dev
# → http://localhost:3000
```

**Features v1.6:**
- 🤖 **AI Agent Chat** - Gemini, OpenAI, Anthropic
- 🎯 **Multi-Agent Workflow** - Orchestrator, Architect, Builder, Reviewer
- 🛠️ **8 Agent Tools** - Web search, Code execute, Calculator, etc.
- 💾 **Chat History** - Persistent conversations
- 🌐 **Bilingual** - Vietnamese/English
- 🌙 **Dark Mode** - System-aware theme

### Option 2: Web UI (Standard)

```python
from cvf import Skill, SkillContract, RiskLevel

contract = SkillContract(
    id="email-classifier-v1",
    name="Email Classifier",
    risk_level=RiskLevel.R1,
    input_spec={"email": str},
    output_spec={"category": str, "confidence": float}
)

skill = Skill(contract)
result = skill.execute({"email": "Buy now!!!"})
```

### Option 3: Manual (Core Docs)

1. Đọc [v1.0/README.md](./v1.0/README.md)
2. Follow 4-phase process: A → B → C → D
3. Use governance checklists

---

## 📚 Architecture — 3 Tiers

CVF có 3 lớp. Chọn đúng lớp bạn cần:

```
┌─────────────────────────────────────────────────────────┐
│  PLATFORM (Layer 3)    — Web UI, Agent Chat, Dashboard  │
│  v1.5, v1.6            — Reference implementation       │
│  → Dùng khi cần UI/demo                                │
├─────────────────────────────────────────────────────────┤
│  TOOLS (Layer 2)       — Scoring, UAT, Validation       │
│  v1.3, governance/     — Python scripts, CI/CD          │
│  → Dùng khi cần automation                              │
├─────────────────────────────────────────────────────────┤
│  CORE (Layer 1)        — Principles, Phases, Skills     │
│  v1.0, v1.1, v1.2      — Quy tắc + Skill Library       │
│  → LUÔN cần. Bắt đầu từ đây.                           │
└─────────────────────────────────────────────────────────┘
```

| Bạn là ai? | Cần Tier nào? | Bắt đầu từ |
|------------|:------------:|-------------|
| 1 dev cá nhân | **Core only** | [CVF_LITE.md](./CVF_LITE.md) |
| Team nhỏ (2-5) | Core + Tools | [v1.1/QUICK_START.md](./v1.1/QUICK_START.md) |
| Muốn Web UI | Core + Tools + Platform | [v1.6 Agent Platform](#option-1-agent-platform-newest--recommended) |

> 📖 Chi tiết phân lớp: [CVF_POSITIONING.md](./docs/CVF_POSITIONING.md)

---

## 📚 Chọn Phiên Bản (Chi Tiết)

**Ghi chú trạng thái:** v1.5 UX Platform **đóng băng** (maintenance-only). Các cải tiến tiếp theo tập trung ở **v1.6**, còn **v1.5.2 Skill Library** tiếp tục được mở rộng và được **v1.6 thừa hưởng**.

### Bảng Tham Chiếu Nhanh

| Bạn cần gì? | Phiên bản | Thư mục |
|-------------|:---------:|---------|
| Project nhỏ, nhanh, đơn giản | **v1.0** | [v1.0/](./v1.0/) |
| Người mới bắt đầu vibe coding | **v1.0** | [v1.0/](./v1.0/) |
| Kiểm soát input/output rõ ràng | **v1.1** | [v1.1/](./v1.1/) |
| Multi-agent, phân vai AI | **v1.1** | [v1.1/](./v1.1/) |
| Cần audit, trace đầy đủ | **v1.1** | [v1.1/](./v1.1/) |
| Skill/Capability governance | **v1.2** | [EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/) |
| Agent-agnostic skill registry | **v1.2** | [EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/](./EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/) |
| SDK & CLI tools | **v1.3** | [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/](./EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) |
| Agent adapters (Claude/GPT) | **v1.3** | [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/](./EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) |
| CI/CD integration | **v1.3** | [EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/](./EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) |
| 👤 Operator Manual | **v1.3.1** | [EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/](./EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/) |
| 🎨 End-user UX Layer | **v1.4** | [EXTENSIONS/CVF_v1.4_USAGE_LAYER/](./EXTENSIONS/CVF_v1.4_USAGE_LAYER/) |
| 🌐 Web UI Platform | **v1.5 (FROZEN)** | [EXTENSIONS/CVF_v1.5_UX_PLATFORM/](./EXTENSIONS/CVF_v1.5_UX_PLATFORM/) |
| 📋 Skill Library (124 skills) | **v1.5.2 (ACTIVE)** | [EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/](./EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |
| 🔐 **Skill Governance Registry** | **governance** | [governance/skill-library/](./governance/skill-library/) |
| 🤖 **AI Agent Platform** | **v1.6** ⭐ | [EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/](./EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/) |

---

## 📊 So Sánh Phiên Bản

| Tính năng | v1.0 | v1.1 | v1.2 | v1.3 | v1.5 | v1.6 ⭐ |
|-----------|:----:|:----:|:----:|:----:|:----:|:------:|
| Triết lý core (Outcome > Code) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phase-based (A→D) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Governance cơ bản | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| INPUT/OUTPUT spec | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agent Archetype + Lifecycle | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Skill Contract Spec | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Skill Registry Model | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Capability Risk Model (R0-R3) | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Python SDK | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Agent Adapters (Claude/GPT) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| CI/CD Templates | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 🌐 Web UI | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 📋 Form-based Templates | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 🚦 3 Export Modes | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **🤖 AI Agent Chat** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **🎯 Multi-Agent Workflow** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **🛠️ Agent Tools (8)** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **💾 Chat History** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🚦 CVF Export Modes (v1.5.2 NEW!)

Web UI hỗ trợ 3 chế độ xuất prompt:

| Mode | CVF Power | Mô tả |
|------|:---------:|-------|
| 📝 **Simple** | ~15% | Quick prompts, không có governance rules |
| ⚠️ **With Rules** | ~35% | +Stop conditions, guardrails |
| 🚦 **CVF Full Mode** | ~80% | 4-Phase protocol đầy đủ (Discovery → Design → Build → Review) |

**CVF Full Mode includes:**
- ✅ 4-Phase Process (A→B→C→D)
- ✅ Phase Gates (điều kiện chuyển phase)
- ✅ AI Role Constraints (Executor, Decision Maker, Quality Owner)
- ✅ Forbidden/Required Actions
- ✅ Scope Control

---

## 📋 Skill Library (v1.5.2)

**124 skills** across **12 domains**:

| Domain | Skills | Description |
|--------|:------:|-------------|
| 📣 Marketing & SEO | 9 | SEO Audit, Copywriting, CRO, Pricing... |
| 🎨 Product & UX | 8 | A/B Test, Accessibility, User Flow, Personas... |
| 🔐 Security & Compliance | 6 | API Security, GDPR, Privacy Policy, Incident Response... |
| 💻 App Development | 8 | Requirements, Tech Stack, Architecture, Database, API... |
| 💹 Finance & Analytics | 8 | Pricing, unit economics, dashboards... |
| 🧑‍💼 HR & Operations | 5 | Hiring, onboarding, SOP... |
| ⚖️ Legal & Contracts | 5 | Contract review, compliance... |
| 🧪 AI/ML Evaluation | 6 | Bias, robustness, evaluation... |
| 🌐 Web Development | 5 | Landing, SaaS, Dashboard, Blog, Portfolio |
| 📊 Business Analysis | 3 | Strategy, market analysis... |
| ✍️ Content Creation | 3 | Editorial, brand voice... |
| 🧰 Technical Review | 3 | Code review, architecture... |

**New in v1.5.2:**
- ✅ Skill Versioning (1.x.x per skill)
- ✅ Prerequisites system with workflow links
- ✅ Difficulty Guide (Easy/Medium/Advanced criteria)
- ✅ Domain Refinement (Quality Pass 2) complete (12 domains)
- ✅ Validation: 114 skills pass validate_skills.py (0 issues/warnings)
- ✅ **NEW:** Ví dụ thực tế added to Advanced skills
- ✅ **NEW:** Cross-references (Next Step) added

[→ Xem chi tiết Skill Library](./EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)

---

## 📁 Cấu Trúc Repository

```
Controlled-Vibe-Framework-CVF/
│
├── README.md                  ← Bạn đang ở đây
│
├── v1.0/                      ← Core Baseline (FROZEN)
│   ├── CVF_MANIFESTO.md
│   ├── phases/                ← 4-Phase Process (A→D)
│   ├── governance/            ← Checklists, Gates
│   └── ai/                    ← AI Role Spec
│
├── v1.1/                      ← Extended Control (FROZEN)
│   ├── QUICK_START.md
│   ├── architecture/
│   ├── agents/
│   └── execution/
│
├── EXTENSIONS/                ← All Extensions (v1.2+)
│   │
│   ├── CVF_v1.2_CAPABILITY_EXTENSION/
│   │   └── Skill Registry, Risk Model
│   │
│   ├── CVF_v1.3_IMPLEMENTATION_TOOLKIT/
│   │   └── SDK, CLI, Adapters, CI/CD
│   │
│   ├── CVF_v1.3.1_OPERATOR_EDITION/
│   │   └── Operator Manual
│   │
│   ├── CVF_v1.4_USAGE_LAYER/
│   │   └── Usage Layer Spec
│   │
│   ├── CVF_v1.5_UX_PLATFORM/
│   │   ├── cvf-web/           ← Next.js Web App
│   │   └── 20_WEB_INTERFACE/
│   │
│   ├── CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
│   │   ├── app_development/   ← 8 skills
│   │   ├── marketing_seo/     ← 9 skills
│   │   └── ...
│   │
│   └── CVF_v1.6_AGENT_PLATFORM/       ⭐ NEW!
│       ├── cvf-web/           ← AI Agent Web App
│       │   ├── AgentChat      ← AI Chat Interface
│       │   ├── MultiAgent     ← 4-Agent Workflow
│       │   ├── Tools          ← 8 Agent Tools
│       │   └── i18n           ← VI/EN Support
│       └── ROADMAP.md         ← Development Plan
│
├── governance/                        🔐 GOVERNANCE LAYER
│   └── skill-library/         ← Skill Governance Registry
│       ├── specs/             ← 8 governance specs
│       ├── registry/
│       │   ├── user-skills/   ← 69 user skill records
│       │   └── agent-skills/  ← 8 agent tool records
│       └── uat/               ← UAT binding templates
│
├── tools/
│   └── skill-validation/      ← Shared validation tools
│
├── governance/
│   └── skill-library/          ← Skill Governance Registry (UAT, Risk, Authority)
│
└── docs/
    ├── QUICK_START_INTERNAL.md
    ├── CVF_FRAMEWORK_ASSESSMENT.md
    └── VERSION_COMPARISON.md
```

---

## 📖 Nguyên Tắc

- **v1.0 là baseline**, luôn hợp lệ, không thay đổi (FROZEN)
- **v1.1 là mở rộng opt-in**, không phá core v1.0 (FROZEN)
- **v1.2+ là EXTENSIONS**, mở rộng capability layer, agent-agnostic
- **Chọn phiên bản theo mức độ phức tạp** của project
- **Có thể bắt đầu với v1.0**, bật module v1.1/v1.2+ khi cần

---

## 🧭 Hướng Dẫn Theo Từng Phiên Bản

### v1.0 — Core (Đơn giản, Nhanh)

```
📂 v1.0/
├── README.md              ← Bắt đầu từ đây
├── CVF_MANIFESTO.md       ← Triết lý CVF
├── USAGE.md               ← Cách sử dụng
├── phases/
│   ├── PHASE_A_DISCOVERY.md
│   ├── PHASE_B_DESIGN.md
│   ├── PHASE_C_BUILD.md
│   └── PHASE_D_REVIEW.md
└── governance/
    ├── PROJECT_INIT_CHECKLIST.md
    └── PHASE_C_GATE.md
```

**Best for:** Project nhỏ, người mới bắt đầu, team không cần automation

### v1.1 — Extended Control

```
📂 v1.1/
├── QUICK_START.md         ← 5 phút để hiểu
├── MIGRATION_GUIDE.md     ← Từ v1.0 → v1.1
├── architecture/          ← Kiến trúc chi tiết
├── agents/                ← Agent archetypes
└── execution/             ← Execution spine
```

**Best for:** Multi-agent projects, cần audit/trace, production systems

### v1.5+ — Web UI & Skills

```
📂 EXTENSIONS/CVF_v1.5_UX_PLATFORM/cvf-web/
└── Run: npm install && npm run dev

📂 EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/
└── 69 skill files (.skill.md)
```

**Best for:** End users không biết code, teams cần template library  
**Status note:** v1.5 UX Platform đóng băng; cải tiến mới tập trung ở v1.6, còn v1.5.2 Skill Library tiếp tục mở rộng và được v1.6 dùng chung.

---

## 🎯 Triết Lý Cốt Lõi

| Nguyên tắc | Giải thích |
|------------|------------|
| **Outcome > Code** | Quan trọng là sản phẩm làm được gì |
| **Control without micromanagement** | Kiểm soát bằng cấu trúc, không can thiệp từng bước |
| **Decisions are first-class citizens** | Mọi quyết định phải được ghi lại |
| **AI là executor, không phải decision maker** | AI làm việc, user đánh giá |
| **Skills được thuần hóa, không được tự do** | AI phải follow rules (v1.2+) |

---

## 📈 What's New in v1.6.0 ⭐

### 🤖 AI Agent Platform
- ✅ **AI Agent Chat** - Chat với Gemini, OpenAI, Anthropic
- ✅ **Multi-Agent Workflow** - 4 agents: Orchestrator, Architect, Builder, Reviewer
- ✅ **8 Agent Tools** - Web Search, Code Execute, Calculator, DateTime, JSON Parse, URL Fetch, File R/W
- ✅ **Chat History** - Lưu trữ persistent conversations
- ✅ **Provider Switching** - Chuyển đổi AI providers seamlessly
- ✅ **Quality Scoring** - 0-100 score with 4 dimensions
- ✅ **Phase Gates** - CVF phase checklist modals
- ✅ **Decision Log** - Audit sidebar for governance tracking

### 🔒 Security Hardening (NEW!)
- ✅ **AES-GCM Encryption** - Web Crypto API with PBKDF2 key derivation
- ✅ **Input Validation** - All form inputs sanitized
- ✅ **Sandboxed Execution** - Safe code evaluation
- ✅ **Rate Limiting** - API protection built-in

### 🧪 Test Coverage (UPDATED)
```
✅ 23 test files | 176 tests | 0 failures
Coverage: 94.11% statements / 85.04% branches / 91.64% functions / 95.51% lines
Key modules: security.ts (28), governance.ts (13), ai-providers.ts (21), quota-manager.ts (21)
```

### 🔧 Technical Improvements
- ✅ **AgentChat Refactored** - 1042 lines → 216 lines (-79%)
- ✅ **ErrorBoundary** - Graceful error handling with retry
- ✅ **Analytics** - Event tracking for executions, retries, templates
- ✅ **i18n Complete** - 160+ translation keys (Vietnamese/English)
- ✅ **Mobile UI** - Responsive components, History/Result/Analytics tweaks
- ✅ **Shared Tools** - skill validation in `tools/skill-validation`

### 📚 Previous (v1.5.2)
- ✅ 31 form-based templates
- ✅ 114 skills across 12 domains
- ✅ 3 export modes (Simple, With Rules, CVF Full Mode)
- ✅ Domain Refinement (Quality Pass 2) complete

---

## 📋 Changelog

- Xem lịch sử thay đổi tại [CHANGELOG.md](./CHANGELOG.md)

---

## 📄 License

MIT License

---

## 🤝 Đóng Góp

Xem [CONTRIBUTING.md](./v1.0/CONTRIBUTING.md) để biết cách đóng góp.

---

**CVF không giúp bạn đi nhanh hơn. CVF giúp bạn không đi sai.**

---

*Last Updated: 2026-02-11*  
*CVF v1.6.0 — [GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF)*
