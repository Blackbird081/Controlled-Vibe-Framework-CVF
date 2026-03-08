# Controlled Vibe Framework (CVF)

> **Developed by Tien - Tan Thuan Port@2026**

> **Controlled vibe coding — not faster, but smarter.**

🇬🇧 English | [🇻🇳 Tiếng Việt](docs/GET_STARTED.md)

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/releases)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-1764%20passing-brightgreen.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web)
[![Kernel Tests](https://img.shields.io/badge/kernel+extension%20tests-183%20passing-brightgreen.svg)](EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture)
[![Coverage](https://img.shields.io/badge/coverage-93.05%25-brightgreen.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web)
[![Kernel Coverage](https://img.shields.io/badge/kernel%20coverage-96.45%25-brightgreen.svg)](EXTENSIONS/CVF_v1.7.1_SAFETY_RUNTIME/kernel-architecture)
[![AI Safety](https://img.shields.io/badge/AI%20Safety-Kernel%20Active-green.svg)](docs/assessments/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md)
[![Agent Skills](https://img.shields.io/badge/agent%20skills-34-blue.svg)](governance/skill-library/registry/agent-skills/INDEX.md)

---

## 🔔 Testing & Quality Standard Notice (Mandatory)

Before running any tests, read:
- [Incremental Test Log](docs/CVF_INCREMENTAL_TEST_LOG.md)
- [Core Compatibility Baseline](docs/baselines/CVF_CORE_COMPAT_BASELINE.md)
- [Bug History & Troubleshooting](docs/BUG_HISTORY.md)

Run compatibility gates first:

```bash
# Core compatibility gate
python governance/compat/check_core_compat.py --base <BASE_REF> --head <HEAD_REF>

# Bug documentation gate (enforced on fix: commits)
python governance/compat/check_bug_doc_compat.py --enforce

# Test documentation gate (enforced on test: commits)
python governance/compat/check_test_doc_compat.py --enforce

# Docs governance gate (enforced on docs markdown changes)
python governance/compat/check_docs_governance_compat.py --enforce
```

Only run full regression when gate/triggers require it.

> 📋 **Bug Fix Rule:** Every `fix:` commit MUST have a corresponding entry in [`docs/BUG_HISTORY.md`](docs/BUG_HISTORY.md). See [Bug Documentation Guard](governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md).

> 🧪 **Test Log Rule:** Every `test:` commit or test file change MUST have a batch entry in [`docs/CVF_INCREMENTAL_TEST_LOG.md`](docs/CVF_INCREMENTAL_TEST_LOG.md). See [Test Documentation Guard](governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md).

> 🗄️ **Test Log Rotation Rule:** [`docs/CVF_INCREMENTAL_TEST_LOG.md`](docs/CVF_INCREMENTAL_TEST_LOG.md) is the active window, not an infinite single-file ledger. Rotate it when it exceeds the governance threshold and archive history under `docs/logs/`. See [Incremental Test Log Rotation Guard](governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md).

> 🧾 **Conformance Trace Rotation Rule:** Scoped conformance traces are also governed as active windows. For `cvf_phase_governance`, rotate [`CVF_CONFORMANCE_TRACE_2026-03-07.md`](docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md) when it crosses its threshold and archive older windows under `docs/reviews/cvf_phase_governance/logs/`. See [Conformance Trace Rotation Guard](governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md).

> 🐍 **Python Automation Size Rule:** Governed Python automation under `scripts/` and `governance/compat/` must stay within the active size thresholds or be explicitly registered as a temporary exception. Run [`governance/compat/check_python_automation_size.py`](governance/compat/check_python_automation_size.py) with `--enforce`. See [Python Automation Size Guard](governance/toolkit/05_OPERATION/CVF_PYTHON_AUTOMATION_SIZE_GUARD.md).

> ⏱️ **Conformance Performance Rule:** Canonical Wave 1 closure must use the sequential authoritative runner, and sibling packet wrappers must reuse shared bootstrap state instead of regenerating the same runtime evidence repeatedly. See [Conformance Execution Performance Guard](governance/toolkit/05_OPERATION/CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD.md).

> 🏛️ **Architecture Decision Rule:** Every `feat(governance):`, `feat(domain):`, `feat(core-value):`, `refactor(arch):`, or `docs(policy):` commit MUST have an ADR entry in [`docs/CVF_ARCHITECTURE_DECISIONS.md`](docs/CVF_ARCHITECTURE_DECISIONS.md). See [ADR Guard](governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md).

> 🧱 **Workspace Isolation Rule:** Downstream projects MUST NOT be opened or developed inside CVF root. Use isolated sibling workspace only. See [Workspace Isolation Guard](governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md).

> 🗂️ **Document Naming Rule:** Long-term governance/review records in `docs/` and `governance/` MUST follow CVF naming conventions and use `CVF_` prefix unless explicitly exempted. See [Document Naming Guard](governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md).

> 🗃️ **Document Storage Rule:** New long-term documents in `docs/` MUST be placed in the correct taxonomy folder defined by [`docs/INDEX.md`](docs/INDEX.md). See [Document Storage Guard](governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md).

> 🧭 **Docs Governance Gate:** Markdown files created or changed under `docs/` MUST pass root allowlist, taxonomy, and naming checks. Run [`governance/compat/check_docs_governance_compat.py`](governance/compat/check_docs_governance_compat.py) with `--enforce`.

> 🎯 **Depth Audit Rule:** Before deepening any roadmap phase with a new semantic layer, policy layer, or `CF-*` expansion, you MUST justify it with explicit depth-audit scoring. This applies to all phases, not only Phase 6. See [Depth Audit Guard](governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md).

> 🗺️ **Release State Rule:** Use [`docs/reference/CVF_RELEASE_MANIFEST.md`](docs/reference/CVF_RELEASE_MANIFEST.md) for current operational release state, [`docs/reference/CVF_MODULE_INVENTORY.md`](docs/reference/CVF_MODULE_INVENTORY.md) for module scope, and [`docs/VERSIONING.md`](docs/VERSIONING.md) for versioning policy semantics.

> 🧾 **Enterprise Evidence Rule:** For audit/release/onboarding packets, start from [`docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md`](docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md) and its canonical mapping/template companions.
> For packet generation on the current baseline, prefer `python scripts/export_cvf_release_packet.py --output <packet-path>`.

> 🗺️ **Architecture Check Rule:** Before proposing ANY new version, layer, extension, or module for CVF, you MUST first read [`docs/CVF_CORE_KNOWLEDGE_BASE.md`](docs/CVF_CORE_KNOWLEDGE_BASE.md) and explicitly state: the target Layer (1–5), overlap check result, what it extends, and which core principles apply. See [Architecture Check Guard](governance/toolkit/05_OPERATION/CVF_ARCHITECTURE_CHECK_GUARD.md).

> 🔒 **CVF Extension Rules (Non-negotiable):**
> **R1** — Existing CVF structure is always the standard. No redefinition without ADR + approval.
> **R2** — New additions must be compatible and additive — upgrade, never replace.
> **R3** — Naming (version/layer/guard/document) and storage placement must follow CVF conventions — no arbitrary naming or arbitrary folder placement.
> See full rules: [`docs/CVF_CORE_KNOWLEDGE_BASE.md` Section XIV](docs/CVF_CORE_KNOWLEDGE_BASE.md).

---

## 🎯 CVF In 30 Seconds

CVF helps you **control AI coding** through:

- ✅ **4-Phase Process** - Discovery → Design → Build → Review
- ✅ **Governance Toolkit** - Phase gates, risk control, authority matrix
- ✅ **141 Reusable Skills** - Across 12 domains
- ✅ **34 Agent Tools** - RAG, Data Viz, Agentic Loop, Browser Auto, MCP, Workflow Hooks, Scientific Research, Agent Teams, Context Engineering, Debugging, API Architecture, Testing, Security, Database, Frontend, Cloud Deployment, Code Review, MCP Builder, AI Multimodal, Operator Workflow & more
- ✅ **Web UI + Agent Platform** - No-code interface, multi-agent workflows

**Use CVF when:**
- You use AI (ChatGPT / Claude / Copilot) for coding
- You want AI to code **correctly and safely**
- You need governance for your team or enterprise

---

## 🚀 Quick Start

### Workspace Rule (Mandatory For Real Projects)

CVF root is reserved for framework maintenance.  
Do not open or build downstream projects directly inside this repository root.
Effective date: 2026-03-02.

Use isolated sibling workspaces instead:

```text
D:\Work\
  .Controlled-Vibe-Framework-CVF\   # CVF core (shared or cloned)
  Trading-Tools\                    # your project workspace
  Another-Project\                  # another project workspace
```

`.Controlled-Vibe-Framework-CVF` naming (leading dot) is an isolation convention to avoid accidental cross-edits. It does not need hidden mode.

### Bootstrap Isolated Workspace (Recommended For New Projects)

Use the bootstrap script to standardize sibling layout and keep terminal default at project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "D:\CVF-Workspace" `
  -ProjectName "Trading-Tools" `
  -ProjectRepo "https://github.com/Blackbird081/Trading-Tools.git"
```

What this creates:

```text
D:\CVF-Workspace\
  .Controlled-Vibe-Framework-CVF\
  Trading-Tools\
  Trading-Tools.code-workspace
```

`Trading-Tools.code-workspace` is configured with `terminal.integrated.cwd=${workspaceFolder}`.
The script also creates a downstream bootstrap record:
`<Project>/docs/CVF_BOOTSTRAP_LOG_YYYYMMDD.md`
from `governance/toolkit/05_OPERATION/CVF_PROJECT_BOOTSTRAP_LOG_TEMPLATE.md`.

### Option 1: Web UI (CVF Core Only — 2 minutes)

Use this only to run CVF itself (framework UI), not for downstream product development.

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev
```

→ Open http://localhost:3000

### Option 2: Core CVF (5 minutes)

1. Read the [Manifesto](v1.0/CVF_MANIFESTO.md)
2. Follow the [4-Phase Process](v1.0/phases/)
3. Use the [Governance Checklists](v1.0/governance/)

**→ [📖 Full Getting Started Guide](docs/GET_STARTED.md)**

### Real Project Case Study (Local)

- [Mini Game CVF Project](Mini_Game/MINI_GAME_WEBAPP_CVF_PLAN_2026-02-26.md)
- CVF docs bundle: [Mini_Game/CVF_DOCS](Mini_Game/CVF_DOCS/)
- Archive bundle (bug/test/history/fig): [Mini_Game/PROJECT_ARCHIVE](Mini_Game/PROJECT_ARCHIVE/)

---

## 💡 Why CVF?

### The Problem: Uncontrolled AI Coding

When using AI to code without a framework:

- ❌ Code you don't understand ("black box")
- ❌ Security vulnerabilities
- ❌ Accumulated technical debt
- ❌ No documentation
- ❌ Inconsistent team output

### The Solution: CVF's 4-Phase Control

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Phase A    │ →  │  Phase B    │ →  │  Phase C    │ →  │  Phase D    │
│  Discovery  │    │  Design     │    │  Build      │    │  Review     │
├─────────────┤    ├─────────────┤    ├─────────────┤    ├─────────────┤
│ YOU decide  │    │ YOU decide  │    │ AI executes │    │ YOU validate│
│ requirements│    │ architecture│    │ writes code │    │ approve/fix │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

**Outcome:** Quality code, controlled process, reusable artifacts

---

## 🎨 Features

### v1.7 Highlights ⭐ (AI Safety Runtime + Kernel Architecture)

- 🧠 **5-Layer Safety Kernel** - Domain Lock → Contract Runtime → Contamination Guard → Refusal Router → Creative Control
- 🛡️ **AI Safety Runtime** - Prompt sanitizer, entropy guard, anomaly detection, policy enforcement
- 📊 **Safety Dashboard** - Real-time risk view: 🟢Safe 🟡Attention 🟠Review 🔴Dangerous
- 🔌 **Runtime Adapter Hub** (v1.7.3) - Universal adapter contracts for multi-runtime AI safety (OpenClaw, PicoClaw, ZeroClaw, Nano)
- 🗣️ **Explainability Layer** (v1.7.3) - Human-readable action explanations in English & Vietnamese
- 🔍 **Kernel Health Dashboard** - Domain lock status, risk level (R0-R4), refusal count, pipeline latency
- 📈 **Risk Evolution Chart** - Historical risk trend visualization with hover tooltips
- 🔎 **Request Trace Viewer** - Click-to-view forensic trace (requestId, traceHash, decision)
- 📜 **Policy Selector** - Switch between Standard, Strict, and Permissive policy versions
- 🎨 **Creative Mode Indicator** - Toggle with drift warning at R2+ threshold
- 🗺️ **Domain Map** - Interactive SVG visualization of domain relationships
- 🔒 **Anti-Bypass Design** - Symbol guard, 12-step non-bypass pipeline, forensic tracing
- 🧪 **51 Kernel Tests** - Golden dataset regression, E2E, benchmark, 96%+ coverage

### v1.8–v2.0 Highlights 🚀 (NEW — Implemented)

- 🔐 **v1.8 Safety Hardening** — 7-phase state machine (INTENT→COMMIT), mutation budget enforcement, deterministic rollback, drift monitor + stability index | **42 tests**
- 📋 **v1.9 Deterministic Reproducibility** — Immutable ExecutionRecord (9 fields), Context Freezer, Replay Engine (EXACT/DRIFT/FAILED), forensic audit | **29 tests**
- 🎯 **v2.0 Non-Coder Safety Runtime** — ModeMapper (SAFE/BALANCED/CREATIVE → KernelPolicy), Intent Interpreter (NL → ParsedIntent), Confirmation Engine (R3+ hard stop), Stability Index override | **32 tests**
- 📦 **v1.2.1 External Integration** — Skill supply chain (intake→validate→certify→publish), Policy Decision Engine (6-layer precedence), blockchain-style audit ledger, R0–R3 mapping | **29 tests**

### 🛡️ Governance Integration for AI Agent (NEW)

The AI Agent automatically enforces CVF governance through **3 layers**:

| Layer | Mechanism | How |
|-------|-----------|-----|
| **System Prompt** | Rule 16 in governance context | AI is instructed to call `governance_check` tool when fixing bugs, running tests, or changing code |
| **Post-Processing** | `governance-post-check.ts` | Automatically scans AI responses; injects 🚨 **enforcement** message if `BUG_HISTORY.md` or `CVF_INCREMENTAL_TEST_LOG.md` documentation is missing |
| **Governance Checker** | Tool on Safety page + Tools page | Interactive UI: select action (Bug Fix / Test Run / Code Change) → get compliance checklist |

**Governance policies enforced:**
- 📋 [`CVF_BUG_DOCUMENTATION_GUARD.md`](governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md) — Every bug fix must be logged
- 📋 [`CVF_TEST_DOCUMENTATION_GUARD.md`](governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md) — Every test run must be documented
- 📋 [`CVF_ADR_GUARD.md`](governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md) — Every architecture/strategy decision must have an ADR entry
- 📋 [`CVF_WORKSPACE_ISOLATION_GUARD.md`](governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md) — Downstream projects must run in isolated workspace, not in CVF root
- 📋 [`BUG_HISTORY.md`](docs/BUG_HISTORY.md) — Troubleshooting knowledge base
- 📋 [`CVF_INCREMENTAL_TEST_LOG.md`](docs/CVF_INCREMENTAL_TEST_LOG.md) — Test history log
- 📋 [`CVF_ARCHITECTURE_DECISIONS.md`](docs/CVF_ARCHITECTURE_DECISIONS.md) — Architecture decision records (ADR-001 → ...)

### 🔒 Skill Preflight Enforcement in Web UI (Updated 2026-03-01)

Skill Preflight is now enforced in `cvf-web` as a runtime gate, not only a documentation rule.

- Build checklist includes mandatory Skill Preflight declaration item
- Build/Execute enforcement blocks execution when Skill Preflight declaration is missing
- `/api/governance/evaluate` requires `skill_preflight.declared=true` for BUILD phase requests
- Execution payloads can carry `skill_preflight` metadata (`record_ref`, `skill_ids`, declaration source)

Decision trace:
- [ADR-008 Baseline](docs/CVF_ARCHITECTURE_DECISIONS.md#adr-008-web-ui-skill-preflight-integration-baseline-pre-upgrade-snapshot)
- [ADR-009 Enforcement Upgrade](docs/CVF_ARCHITECTURE_DECISIONS.md#adr-009-web-ui-skill-preflight-enforcement-upgrade-framework-level-integration)


### v1.6 Features

- 🤖 **AI Agent Chat** - Gemini, OpenAI, Anthropic
- 🎯 **Multi-Agent Workflow** - Orchestrator, Architect, Builder, Reviewer
- ✅ **34 Agent Tools** - Web search, code execute, RAG retrieval, data viz, doc parser, agentic loop, browser automation, MCP connector, workflow hooks, scientific research, document converter, agent teams, progressive loader, analytics dashboard, context engineering, problem-solving, systematic debugging, MCP isolation, API architecture, full-stack testing, security & auth, database schema, frontend components, cloud deployment, code review, MCP builder, AI multimodal, operator workflow orchestrator
- 💾 **Chat History** - Persistent conversations
- 🔐 **Governance Toolkit** - Phase/role/risk control (R0–R3)
- 📝 **50 Templates** → 📚 **141 Skills** - Bi-directional linking
- 🧪 **Self-UAT** - 1-click testing
- 🌐 **Bilingual** - Vietnamese/English
- 📱 **Mobile Responsive** - Touch-optimized UI with bottom nav & swipe gestures

### Core Features (All Versions)

| Feature | Description |
|---------|-------------|
| **4-Phase Process** | Structured workflow from idea to production |
| **Governance Model** | Phase gates, risk levels (R0-R3), authority matrix |
| **Skill Library** | 141 reusable skills across 12 domains |
| **Web UI** | No-code template builder + agent chat |
| **Python SDK** | Programmatic access to CVF |
| **CI/CD Templates** | GitHub Actions, GitLab CI |

---

## 📊 Who Uses CVF?

<table>
<tr>
<td width="33%" align="center">

### 👤 Solo Developers

"CVF helps me code with AI<br>without losing direction"

[→ Solo Guide](docs/guides/solo-developer.md)

</td>
<td width="33%" align="center">

### 👥 Small Teams

"Our team is more consistent<br>and we reuse many skills"

[→ Team Setup](docs/guides/team-setup.md)

</td>
<td width="33%" align="center">

### 🏢 Enterprise

"CVF gives us full governance<br>while maintaining velocity"

[→ Enterprise](docs/guides/enterprise.md)

</td>
</tr>
</table>

---

## 🗺️ Choose Your Path

| Who are you? | Recommended Path |
|-----------|------------------|
| 🆕 **New to AI coding** | [CVF Essentials](docs/GET_STARTED.md#-solo-developer---5-phút) → Learn 4 phases → Run 1 example |
| 💻 **Solo developer** | [Web UI](docs/tutorials/web-ui-setup.md) → Pick template → Build project |
| 👥 **Team lead** | [Team Setup](docs/guides/team-setup.md) → Governance → Collaboration |
| 🏢 **Enterprise** | [Enterprise Guide](docs/guides/enterprise.md) → Pilot → Scale |
| 🛠️ **Want to contribute** | [Contributing Guide](v1.0/CONTRIBUTING.md) → Pick issue → Submit PR |

**→ [📖 Comprehensive Getting Started Guide](docs/GET_STARTED.md)**

---

## 📚 Documentation

| Category | Links |
|----------|-------|
| **🎓 Learn** | [Core Philosophy](docs/concepts/core-philosophy.md) · [4-Phase Process](docs/concepts/4-phase-process.md) · [Governance](docs/concepts/governance-model.md) |
| **🚀 Build** | [First Project](docs/tutorials/first-project.md) · [Web UI](docs/tutorials/web-ui-setup.md) · [Agent Platform](docs/tutorials/agent-platform.md) |
| **📖 Reference** | [Skills](docs/concepts/skill-system.md) · [Risk Model](docs/concepts/risk-model.md) · [Version History](docs/concepts/version-evolution.md) |
| **🧩 Skills** | [Skill Library](EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) - 141 skills across 12 domains |
| **🤖 Agent Skills** | [34 Agent Tools](governance/skill-library/registry/agent-skills/INDEX.md) · [Usage Guide v1](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/using-agentic-skills.md) · [Usage Guide v2](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/using-new-skills-v2.md) · [Agentic Patterns](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/agentic-patterns.md) |
| **⚙️ Tools** | [Python SDK](EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) · [Governance Toolkit](governance/) · [Core Compatibility Baseline](docs/baselines/CVF_CORE_COMPAT_BASELINE.md) · [Bug History](docs/BUG_HISTORY.md) · [Architecture Decisions](docs/CVF_ARCHITECTURE_DECISIONS.md) |

**Full docs:** [vibcode.netlify.app/docs](https://vibcode.netlify.app/docs) | [GitHub Wiki](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/wiki)

---

## 🏗️ Architecture

CVF has 5 layers — an AI Safety Runtime that protects non-coders:

```
┌─────────────────────────────────────────────────────────┐
│  🛡️ SAFETY UI (Layer 4)      — Non-Coder Safety         │
│     v1.7.2                    — Safety Dashboard          │
│     v2.0 🆕                   — Non-Coder Safety Runtime  │
│     ModeMapper + IntentInterpreter + ConfirmationEngine  │
├─────────────────────────────────────────────────────────┤
│  🔌 ADAPTER HUB (Layer 5)    — Runtime Adapter Contracts  │
│     v1.7.3                    — Multi-runtime AI safety   │
│     OpenClaw | PicoClaw | ZeroClaw | Nano                │
├─────────────────────────────────────────────────────────┤
│  🌐 PLATFORM (Layer 3)       — Web UI, Agent Chat         │
│     v1.6 Agent Platform      — Production runtime          │
│  🔐 v1.6.1                   — Enterprise Governance Engine│
├─────────────────────────────────────────────────────────┤
│  ⚙️ SAFETY RUNTIME (Layer 2.5) — Kernel Architecture      │
│     v1.7.1                   — 5-Layer Safety Kernel       │
│     v1.8 🆕                   — Safety Hardening (42 tests)│
│     v1.9 🆕                   — Deterministic Replay (29t) │
├─────────────────────────────────────────────────────────┤
│  🧠 INTELLIGENCE (Layer 2)    — Agent Behavior Control    │
│     v1.7                     — Reasoning, Entropy, Prompt  │
│  🛠️ TOOLS                     — Scoring, UAT, Validation  │
│     v1.3, v1.2.1 🆕           — External Integration (29t)│
│     governance/               — Python scripts, CI/CD     │
├─────────────────────────────────────────────────────────┤
│  📖 CORE (Layer 1)            — Principles, Phases, Skills│
│     v1.0, v1.1, v1.2         — Rules + 141 Skills         │
│     → Always needed. Start here.                           │
└─────────────────────────────────────────────────────────┘
```

**Read more:** [CVF Positioning](docs/reference/CVF_POSITIONING.md)

---

## 🎯 Version Guide

**Confused about versions? Use this:**

- **v1.0** - Core baseline (simple, fast)
- **v1.1** - Extended control (input/output specs, multi-agent)
- **v1.2** - Skill governance (registry, risk model)
- **v1.2.1** 📦 - **External Integration** (skill supply chain pipeline, policy decision engine, audit ledger) — **29 tests**
- **v1.3** - SDK & Tooling (Python, CLI, CI/CD)
- **v1.5** - UX & End-User orientation (FROZEN)
- **v1.5.2** - Skill Library (141 skills, ACTIVE)
- **v1.6** ⭐ - Agent Platform (AI chat, multi-agent, governance)
- **v1.6.1** 🔐 - Governance Engine (enterprise enforcement, audit, CI/CD)
- **v1.7** 🧠 - Controlled Intelligence (agent behavior control, prompt sanitizer)
- **v1.7.1** ⚙️ - Safety Runtime (5-layer kernel: domain lock, contract, contamination, refusal, creative)
- **v1.7.2** 🛡️ - Safety Dashboard (non-coder risk view)
- **v1.7.3** 🔌 - Runtime Adapter Hub (multi-runtime contracts, explainability, NLP policy)
- **v1.8** 🔐 - **Safety Hardening** (7-phase state machine, mutation budget, deterministic rollback, drift monitor) — **42 tests**
- **v1.9** 📋 - **Deterministic Reproducibility** (ExecutionRecord, context freezer, replay engine, forensic audit) — **29 tests**
- **v2.0** 🎯 - **Non-Coder Safety Runtime** (ModeMapper, IntentInterpreter, ConfirmationEngine, stability override) — **32 tests**

**Which should you use?**

→ See: [Version Comparison](docs/VERSION_COMPARISON.md) | [Decision Tree](docs/cheatsheets/version-picker.md)

---

## 🧪 Examples

### Example 1: Simple Task Manager (v1.0)

```bash
# 1. Follow 4 phases
Phase A: Define requirements
Phase B: Design architecture  
Phase C: Let AI generate code
Phase D: Review & approve

# 2. Use checklist
v1.0/governance/PHASE_C_GATE.md
```

### Example 2: API Backend (v1.6 Web UI)

```bash
# 1. Start web UI
npm run dev

# 2. Templates → "API Backend"

# 3. Fill form:
- Database: PostgreSQL
- Auth: JWT
- Risk Level: R2

# 4. Export → Use with Claude/GPT

# 5. Validate with Self-UAT
```

### Example 3: Enterprise Project (v1.1 + v1.3)

```bash
# 1. Set governance policy
governance/toolkit/02_POLICY/master-policy.md

# 2. Define phases with contracts
v1.1/architecture/CONTRACT_SPECIFICATION.md

# 3. Use SDK for automation
python -m cvf.cli validate-skill my-skill.yaml

# 4. Integrate with CI/CD
.github/workflows/cvf-validation.yml
```

---

## 🌟 Testimonials

> "CVF transformed how our team uses AI. We're 40% faster but with better quality."
> — **Team Lead, SaaS Startup**

> "The governance toolkit gives us confidence to use AI in production."
> — **CTO, Enterprise Company**

> "Finally, a framework that respects both speed AND control."
> — **Solo Developer**

_(Want to share your story? [Submit testimonial](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues/new?template=testimonial.md))_

---

## 📈 Project Status

| Metric | Status |
|--------|--------|
| **Version** | 2.0.0 (Mar 2026) |
| **Stability** | Production-ready — 6/6 integration sprints complete |
| **Quality Snapshot (2026-03-05)** | Lint: 0 errors · Web Tests: 1764 passing · Kernel+Extension Tests: **183 passing** |
| **Coverage Snapshot (2026-02-26)** | Web: Stmts 93.05% · Kernel: Stmts 96.45% Br 91.41% Fn 99.09% Ln 97.01% |
| **Extension Test Breakdown** | v1.7.1: 51 · v1.8: 42 · v1.9: 29 · v2.0: 32 · v1.2.1: 29 |
| **Skills** | 141 skills across 12 domains + 34 agent tools |
| **AI Safety** | Kernel active — 5-layer pipeline, anti-bypass, forensic tracing |
| **Active Development** | Yes — extensions + Web UI enhancements |
| **Community** | Building — Discord coming soon |

**Current Status:** 9.4/10 ([independent assessment](docs/assessments/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md)) | Kernel: 8.5/10 ([Antigravity assessment](docs/assessments/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md))
- ✅ **Excellent:** Technical quality (9.3/10), AI Safety (9.4/10), Testing (9.5/10), Governance (9/10)
- ✅ **Kernel:** 183 tests total, 96%+ coverage, anti-bypass Symbol guard, 12-step pipeline
- ✅ **Complete:** Sprint 1-6 integration, full test coverage, bilingual i18n
- ✅ **NEW:** v1.8 Safety Hardening, v1.9 Deterministic Reproducibility, v2.0 Non-Coder Runtime, v1.2.1 External Integration
- ⏳ **Pending:** Real-world validation, Community, npm/PyPI packages

[→ Get Started](docs/GET_STARTED.md)

---

## 🤝 Contributing

We welcome contributions!

**Ways to contribute:**
- 📖 Improve documentation
- 🐛 Report bugs
- ✨ Suggest features
- 🧩 Add new skills
- 🌐 Translate content
- 💬 Help in discussions

**Get started:**
1. Read [Contributing Guide](v1.0/CONTRIBUTING.md)
2. Check [Good First Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
3. Star this repo and watch for community updates

---

## 📞 Support & Community

### Get Help

- 🔍 **Search:** [Documentation](docs/GET_STARTED.md) | [Troubleshooting](docs/cheatsheets/troubleshooting.md)
- 💬 **Chat:** Discord (coming soon)
- 🐛 **Issues:** [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- 📧 **Email:** Coming soon

### Stay Updated

- ⭐ **Star this repo** to get updates
- 📢 **Follow development** via [CHANGELOG.md](CHANGELOG.md)
- 📢 **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

## 📄 License

**CC BY-NC-ND 4.0** — [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0](LICENSE)

- ✅ Read, share — allowed
- ❌ Commercial use — not allowed
- ❌ Modify and redistribute — not allowed

> The entire repository (including v1.0, v1.1, v1.2+, EXTENSIONS/, docs/, governance/, tools/) is licensed under CC BY-NC-ND 4.0.

---

## 🙏 Acknowledgments

Built with love by [@Blackbird081](https://github.com/Blackbird081) and [contributors](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/graphs/contributors).

Inspired by real-world challenges in AI-assisted development.

---

<div align="center">

### 🎯 Remember

**CVF doesn't help you go faster.**<br>
**CVF helps you avoid going wrong.**

[⭐ Star on GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF) · [📖 Get Started](docs/GET_STARTED.md) · [💬 Join Community](https://discord.gg/cvf)

</div>

---

*Last updated: March 5, 2026 | Version 2.0.0 | [Documentation](docs/GET_STARTED.md)*
