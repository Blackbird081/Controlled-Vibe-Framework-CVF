# Controlled Vibe Framework (CVF)

> **Developed by Tien - Tan Thuan Port@2026**

> **Controlled vibe coding — not faster, but smarter.**

🇬🇧 English | [🇻🇳 Tiếng Việt](docs/GET_STARTED.md)

[![Version](https://img.shields.io/badge/version-4.0.0%20Runtime-9e6b2b.svg)](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/releases)
[![License](https://img.shields.io/badge/license-CC%20BY--NC--ND%204.0-blue.svg)](LICENSE)
[![Guard Contract](https://img.shields.io/badge/Guard%20Contract-187%20tests%20pass-brightgreen.svg)](EXTENSIONS/CVF_GUARD_CONTRACT/)
[![MCP Bridge](https://img.shields.io/badge/MCP%20Bridge-4%20endpoints%20active-blue.svg)](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/)
[![Skills](https://img.shields.io/badge/skills-141%20%C3%97%2012%20domains-blue.svg)](EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/)
[![AI Safety](https://img.shields.io/badge/AI%20Safety-Kernel%20Active-green.svg)](docs/assessments/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md)
[![CI](https://img.shields.io/badge/CI-GitHub%20Actions%20ready-blue.svg)](.github/workflows/cvf-ci.yml)

---

## Table of Contents

- 👋 [Overview](#-overview)
- 🚀 [Quick Start](#-quick-start)
- 📚 [Documentation](#-documentation)
- 🏗️ [Architecture](#️-architecture)
- 🎯 [Version Guide](#-version-guide)
- 🎨 [Features](#-features)
- 📊 [Project Status](#-project-status)
- 🔔 [Governance Rules](#-governance-rules)
- 🤝 [Contributing](#-contributing)
- 📄 [License](#-license)

---

## 👋 Overview

CVF is a **governance-enforced runtime platform** for AI-assisted software development. It ensures **humans stay in control** while **AI executes within runtime-enforced boundaries**.

**Key Capabilities:**

- **Canonical Controlled Execution Loop** — `INTAKE → DESIGN → BUILD → REVIEW → FREEZE`
- **Risk Control** — 4-level risk model (R0–R3) with authority boundaries
- **141 Reusable Skills** — Across 12 domains, with bi-directional linking
- **Unified Guard System** — `CVF_GUARD_CONTRACT`: hardened default guard stack for shared channels, aligned to canonical runtime semantics
- **MCP HTTP Bridge** — External agents call `POST /api/guards/evaluate` → ALLOW/BLOCK/ESCALATE + `agentGuidance`
- **Agent Execution Runtime** — governed execution pipeline with explicit guard evaluation, review, and audit evidence
- **Multi-Provider AI** — Pluggable `ExecutionProvider`: Alibaba Qwen (`qwen-turbo`) + Google Gemini (`gemini-2.0-flash`)
- **SQLite Audit Trail** — Persistent, indexed audit log (WAL mode) with stats, filtering, pagination
- **Rate Limiting** — Sliding window 60 req/60s, 429 + Retry-After headers for API endpoints
- **Guard Dashboard UI** — Interactive governance UI for non-coders (`/(dashboard)/guards`)
- **VS Code Governance Adapter** — Prompt injection for Cursor/Windsurf/AI IDE agents
- **CI Pipeline** — GitHub Actions: guard contract tests + MCP tests + Web UI typecheck
- **Web UI + Agent Platform** — non-coder interface aligned to the canonical phase model and governed execution prompts
- **Reference Governed Loop** — reusable `CvfSdk.runReferenceGovernedLoop()` path for coder-facing end-to-end governed execution demos
- **AI Safety Kernel** — 5-layer pipeline, anti-bypass, forensic tracing

> **CVF doesn't help you go faster. CVF helps you avoid going wrong.**

---

## 🚀 Quick Start

### Option 1: Read the Quick Orientation (15 minutes)

**→ [🚀 CVF Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md)** — Understand CVF, how to use it, and where to go next.

### Option 2: Run the Web UI (2 minutes)

```bash
git clone https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git
cd Controlled-Vibe-Framework-CVF/EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web
npm install && npm run dev
```

→ Open http://localhost:3000

### Option 3: Core CVF Baseline (5 minutes)

1. Read the [Manifesto](v1.0/CVF_MANIFESTO.md)
2. Learn the [Controlled Execution Loop](docs/concepts/controlled-execution-loop.md)
3. Use the [Governance Checklists](v1.0/governance/)

**→ [📖 Full Getting Started Guide](docs/GET_STARTED.md)**

### Workspace Setup (Mandatory for Real Projects)

CVF root is the governance layer — downstream projects live in a separate workspace:

```text
D:\CVF-Workspace\
  .Controlled-Vibe-Framework-CVF\   # CVF (governance layer, dot-prefix)
  My-Project\                       # your app
  Another-App\                      # another app
```

```powershell
# Bootstrap a new workspace:
powershell -ExecutionPolicy Bypass -File .\scripts\new-cvf-workspace.ps1 `
  -WorkspaceRoot "D:\CVF-Workspace" `
  -ProjectName "My-Project"
```

See [Workspace Isolation Guard](governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md) | [ADR-020](docs/CVF_ARCHITECTURE_DECISIONS.md)

---

## 📚 Documentation

> **Start here:** [🚀 Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md) | [📖 Getting Started](docs/GET_STARTED.md) | [🧠 Core Knowledge Base](docs/CVF_CORE_KNOWLEDGE_BASE.md)

### 📘 Learning

| | |
|---|---|
| **Concepts** | [Core Philosophy](docs/concepts/core-philosophy.md) · [Controlled Execution Loop](docs/concepts/controlled-execution-loop.md) · [Legacy 4-Phase Process](docs/concepts/4-phase-process.md) · [Governance Model](docs/concepts/governance-model.md) · [Risk Model](docs/concepts/risk-model.md) · [Skill System](docs/concepts/skill-system.md) · [Version Evolution](docs/concepts/version-evolution.md) · [Hierarchical Governance Pipeline](docs/concepts/CVF_HIERARCHICAL_GOVERNANCE_PIPELINE.md) |
| **Doctrine** | [Architecture Principles](ECOSYSTEM/doctrine/CVF_ARCHITECTURE_PRINCIPLES.md) · [Product Positioning](ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md) · [Ecosystem Map](ECOSYSTEM/doctrine/CVF_ECOSYSTEM_MAP.md) · [Layer Model](ECOSYSTEM/doctrine/CVF_LAYER_MODEL.md) · [Doctrine Rules](ECOSYSTEM/doctrine/CVF_DOCTRINE_RULES.md) |
| **Operating Model** | [Agent Operating Model](ECOSYSTEM/operating-model/CVF_AGENT_OPERATING_MODEL.md) · [Builder Model (Non-Coder)](ECOSYSTEM/operating-model/CVF_BUILDER_MODEL.md) · [VOM Quick Start](ECOSYSTEM/operating-model/CVF_VOM_QUICK_START.md) |
| **Strategy** | [Strategic Summary](ECOSYSTEM/strategy/CVF_STRATEGIC_SUMMARY.md) · [Unified Roadmap 2026](ECOSYSTEM/strategy/CVF_UNIFIED_ROADMAP_2026.md) |
| **Guides** | [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md) · [Solo Developer](docs/guides/solo-developer.md) · [Team Setup](docs/guides/team-setup.md) · [Enterprise](docs/guides/enterprise.md) |
| **Tutorials** | [First Project](docs/tutorials/first-project.md) · [Web UI Setup](docs/tutorials/web-ui-setup.md) · [Agent Platform](docs/tutorials/agent-platform.md) |
| **Cheatsheets** | [Troubleshooting](docs/cheatsheets/troubleshooting.md) · [Version Picker](docs/cheatsheets/version-picker.md) |

### 📋 Governance & Records

| | |
|---|---|
| **Reference** | [Release Manifest](docs/reference/CVF_RELEASE_MANIFEST.md) · [Module Inventory](docs/reference/CVF_MODULE_INVENTORY.md) · [Maturity Matrix](docs/reference/CVF_MATURITY_MATRIX.md) · [Release Readiness](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md) · [Architecture Map](docs/reference/CVF_ARCHITECTURE_MAP.md) · [Positioning](docs/reference/CVF_POSITIONING.md) |
| **Assessments** | [Independent Review 2026-03-08](docs/assessments/CVF_INDEPENDENT_EXPERT_REVIEW_UPGRADE_WAVE_2026-03-08.md) · [Assessment 2026-02-25](docs/assessments/CVF_INDEPENDENT_ASSESSMENT_2026-02-25.md) · [Antigravity Assessment](docs/assessments/CVF_ANTIGRAVITY_INDEPENDENT_ASSESSMENT_2026-02-26.md) |
| **Baselines** | [Core Compat Baseline](docs/baselines/CVF_CORE_COMPAT_BASELINE.md) · [Version Comparison](docs/VERSION_COMPARISON.md) · [Versioning Policy](docs/VERSIONING.md) |
| **Records** | [Architecture Decisions (ADR-001→020)](docs/CVF_ARCHITECTURE_DECISIONS.md) · [Bug History](docs/BUG_HISTORY.md) · [Test Log](docs/CVF_INCREMENTAL_TEST_LOG.md) · [CHANGELOG](CHANGELOG.md) |
| **Enterprise** | [Evidence Pack](docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md) · [Control Mapping](docs/reference/CVF_CONTROL_TO_ARTIFACT_MAPPING.md) · [Approval Template](docs/reference/CVF_RELEASE_APPROVAL_PACKET_TEMPLATE.md) |

### 🧩 Skills & Tools

| | |
|---|---|
| **Skill Library** | [141 Skills × 12 Domains](EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/) |
| **Agent Skills** | [34 Agent Tools](governance/skill-library/registry/agent-skills/INDEX.md) · [Usage Guide](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/using-agentic-skills.md) · [Agentic Patterns](EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/content/en/agentic-patterns.md) |
| **SDK & Tooling** | [Python SDK](EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/) · [Governance Toolkit](governance/) · [Governance Guards](governance/toolkit/05_OPERATION/) |

### 🗂️ Full Index

See [`docs/INDEX.md`](docs/INDEX.md) for complete document taxonomy and storage rules.

**Full docs:** [vibcode.netlify.app/docs](https://vibcode.netlify.app/docs) | [GitHub Wiki](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/wiki)

---

## 🏗️ Architecture

CVF can be understood in **two scopes**:

| Scope | Identity | Layer | Focus |
|-------|----------|-------|-------|
| 🧬 **CVF Core** | "Git for AI Development" | Layer 0 | Deterministic development primitives |
| 🏛️ **CVF Full** | "AI Governance Framework" | Layer 1–5 | Complete governance ecosystem |

```
CVF
 │
 ├─── 🧬 CVF Core (Layer 0) ─── "Git for AI Development"
 │     │
 │     ├── v1.0  4-Phase Model, Governance Principles       [FROZEN]
 │     ├── v1.1  Extended Control, I/O Specs                 [FROZEN]
 │     └── v3.0  Core Governance Engine                      [ACTIVE]
 │           ├── ai_commit        (deterministic commits)
 │           ├── artifact_ledger  (immutable artifact chain)
 │           ├── process_model    (phase state machine)
 │           └── skill_lifecycle  (skill governance pipeline)
 │
 └─── 🏛️ CVF Full (Layer 1–5) ─── "AI Governance Framework"
       │
       ├── Layer 1: Intelligence & Tools
       │     v1.2 · v1.2.1 · v1.3 · v1.5.2 · v1.7 · v1.1.1
       │
       ├── Layer 2: Safety Runtime
       │     v1.7.1 Safety Kernel · v1.8 Hardening · v1.9 Replay
       │
       ├── Layer 3: Platform
       │     v1.6 Agent Platform · v1.6.1 Governance Engine
       │
       ├── Layer 4: Safety UI
       │     v1.7.2 Dashboard · v2.0 Non-Coder Runtime
       │
       ├── Layer 5: Adapter Hub
       │     v1.7.3 OpenClaw · PicoClaw · ZeroClaw · Nano
       │
       └── CVF_ECO Extensions (Track III)
             12 modules · 434 tests · Phase 2-5 complete

> **Layer 0 never depends up.** CVF Core works standalone. CVF Full requires Layer 0 as foundation.

**Read more:** [Architecture Separation Diagram](EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md) | [CVF Positioning](ECOSYSTEM/doctrine/CVF_PRODUCT_POSITIONING.md) | [Core Knowledge Base](docs/CVF_CORE_KNOWLEDGE_BASE.md) | [Unified Roadmap](ECOSYSTEM/strategy/CVF_UNIFIED_ROADMAP_2026.md) | [ECOSYSTEM Overview](ECOSYSTEM/README.md)

---

## 🎯 Version Guide

| Version | Focus | Tests |
|---------|-------|-------|
| **v1.0** | Core baseline — 4-phase process, governance | — |
| **v1.1** | Extended control — input/output specs, multi-agent | — |
| **v1.2** | Skill governance — registry, risk model | — |
| **v1.2.1** 📦 | External Integration — supply chain, policy engine, audit ledger | 29 |
| **v1.3** | SDK & Tooling — Python, CLI, CI/CD | — |
| **v1.5.2** | Skill Library — 141 skills, 12 domains | — |
| **v1.6** ⭐ | Agent Platform — AI chat, multi-agent, governance UI | 1764 |
| **v1.6.1** 🔐 | Governance Engine — enterprise enforcement, audit | — |
| **v1.7** 🧠 | Controlled Intelligence — agent behavior, prompt sanitizer | — |
| **v1.7.1** ⚙️ | Safety Runtime — 5-layer kernel architecture | 51 |
| **v1.7.2** 🛡️ | Safety Dashboard — non-coder risk view | — |
| **v1.7.3** 🔌 | Runtime Adapter Hub — multi-runtime contracts | — |
| **v1.8** 🔐 | Safety Hardening — state machine, mutation budget, rollback | 42 |
| **v1.9** 📋 | Deterministic Reproducibility — replay engine, forensic audit | 29 |
| **v2.0** 🎯 | Non-Coder Safety Runtime — ModeMapper, IntentInterpreter | 32 |
| **v3.0** 🧬 | **Core Governance Engine** — AI commit, artifact ledger, process model, skill lifecycle | 49 |
| **CVF_ECO Track** | **Ecosystem Expansion** — 12 extensions across 4 phases | 434 |
| └─ Phase 2 | Intelligence Layer — Intent, Policy, Risk, Guards, RAG | 197 |
| └─ Phase 3 | Product Packaging — SDK, Canvas, CLI | 112 |
| └─ Phase 4 | Governance Network — Identity, Graph | 66 |
| └─ Phase 5 | Economy Layer — Marketplace, Reputation | 59 |

→ [Version Comparison](docs/VERSION_COMPARISON.md) | [Decision Tree](docs/cheatsheets/version-picker.md)

---

## 🎨 Features

### v1.7+ Highlights ⭐ (AI Safety Runtime + Kernel)

- 🧠 **5-Layer Safety Kernel** — Domain Lock → Contract Runtime → Contamination Guard → Refusal Router → Creative Control
- 🛡️ **AI Safety Runtime** — Prompt sanitizer, entropy guard, anomaly detection, policy enforcement
- 📊 **Safety Dashboard** — Real-time risk view: 🟢Safe 🟡Attention 🟠Review 🔴Dangerous
- 🔌 **Runtime Adapter Hub** (v1.7.3) — Universal adapter contracts for multi-runtime AI safety
- 🔐 **Safety Hardening** (v1.8) — 7-phase state machine, mutation budget, deterministic rollback
- 📋 **Deterministic Replay** (v1.9) — Immutable ExecutionRecord, Context Freezer, Replay Engine
- 🎯 **Non-Coder Runtime** (v2.0) — ModeMapper, IntentInterpreter, ConfirmationEngine

### v1.6 Platform

- 🤖 **AI Agent Chat** — Gemini, OpenAI, Anthropic
- 🎯 **Multi-Agent Workflow** — Orchestrator, Architect, Builder, Reviewer
- ✅ **34 Agent Tools** — Web search, code execute, RAG retrieval, data viz, browser auto, MCP, agent teams & more
- 💾 **Chat History** — Persistent conversations
- 🔐 **Governance Toolkit** — canonical `INTAKE → DESIGN → BUILD → REVIEW → FREEZE` semantics, phase/role/risk control (R0–R3)
- 🌐 **Bilingual** — Vietnamese/English
- 📱 **Mobile Responsive** — Touch-optimized UI

### Governance Integration for AI Agent

| Layer | Mechanism | How |
|-------|-----------|-----|
| **System Prompt** | Rule 16 in governance context | AI calls `governance_check` tool for fixes, tests, code changes |
| **Post-Processing** | `governance-post-check.ts` | Auto-scans AI responses, injects enforcement if docs missing |
| **Governance Checker** | UI on Safety + Tools page | Interactive compliance checklist per action type |

---

## 📊 Project Status

| Metric | Status |
|--------|--------|
| **Version** | 2.0.0 (Mar 2026) |
| **Conformance** | 84/84 scenarios PASS, 18/18 critical anchors, 17/17 coverage groups |
| **Tests** | 2,430+ passing (Core + Legacy + CVF_ECO) |
| **Skills** | 141 skills × 12 domains + 34 agent tools |
| **AI Safety** | Kernel active — 5-layer pipeline, anti-bypass, forensic tracing |
| **Current System Review** | [System unification reassessment](docs/reviews/CVF_SYSTEM_UNIFICATION_REASSESSMENT_2026-03-20.md) — active reference path is now substantially aligned, with breadth caveats remaining |
| **Release Readiness** | [Local readiness status](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md) — governance-first control plane with reusable coder-facing and eight active non-coder governed reference paths, further breadth expansion still active |
| **CVF_ECO Evaluation** | [434/434 PASS](ECOSYSTEM/strategy/CVF_ECOSYSTEM_TEST_EVALUATION_REPORT_2026-03-09.md) — 100% quality gate |
| **Active Development** | Yes — `cvf-next` branch |

---

## 🔔 Governance Rules

<details>
<summary><strong>Click to expand all governance rules and gates</strong></summary>

### Compatibility Gates (Run before merge)

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

### Mandatory Guards

| Guard | Trigger | Required |
|-------|---------|----------|
| [Bug Documentation](governance/toolkit/05_OPERATION/CVF_BUG_DOCUMENTATION_GUARD.md) | `fix:` commits | Entry in [`BUG_HISTORY.md`](docs/BUG_HISTORY.md) |
| [Test Documentation](governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md) | `test:` commits | Batch in [`CVF_INCREMENTAL_TEST_LOG.md`](docs/CVF_INCREMENTAL_TEST_LOG.md) |
| [Test Log Rotation](governance/toolkit/05_OPERATION/CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD.md) | Log exceeds threshold | Rotate to `docs/logs/` |
| [Conformance Trace Rotation](governance/toolkit/05_OPERATION/CVF_CONFORMANCE_TRACE_ROTATION_GUARD.md) | Trace exceeds threshold | Rotate to `docs/reviews/*/logs/` |
| [ADR Guard](governance/toolkit/05_OPERATION/CVF_ADR_GUARD.md) | `feat(governance):`, `refactor(arch):` | Entry in [`CVF_ARCHITECTURE_DECISIONS.md`](docs/CVF_ARCHITECTURE_DECISIONS.md) |
| [Document Naming](governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md) | New governance docs | `CVF_` prefix convention |
| [Document Storage](governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md) | New docs in `docs/` | Per [`docs/INDEX.md`](docs/INDEX.md) taxonomy |
| [Diagram Validation](governance/toolkit/05_OPERATION/CVF_DIAGRAM_VALIDATION_GUARD.md) | New State Machines or Workflows | Must pass `diagram.validator.ts` check |
| [Workspace Isolation](governance/toolkit/05_OPERATION/CVF_WORKSPACE_ISOLATION_GUARD.md) | Opening projects in CVF root | Sibling workspace only |
| [Depth Audit](governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md) | Roadmap deepening | Explicit scoring before continuing |
| [Architecture Check](governance/toolkit/05_OPERATION/CVF_ARCHITECTURE_CHECK_GUARD.md) | New version/layer/extension | Read KB, state Layer + overlap |
| [Test Depth Classification](governance/toolkit/05_OPERATION/CVF_TEST_DEPTH_CLASSIFICATION_GUARD.md) | Test count reports | T1–T4 tier breakdown required |
| [Python Automation Size](governance/toolkit/05_OPERATION/CVF_PYTHON_AUTOMATION_SIZE_GUARD.md) | Scripts in `scripts/`, `governance/compat/` | Stay within size thresholds |
| [Conformance Performance](governance/toolkit/05_OPERATION/CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD.md) | Wave 1 closure | Sequential runner, shared bootstrap |
| [Extension Versioning](governance/toolkit/05_OPERATION/CVF_EXTENSION_VERSIONING_GUARD.md) | New extension folder in `EXTENSIONS/` | `CVF_{STREAM}_v{major}.{minor}_{NAME}/` format |
| [Guard Registry](governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md) | New guard created | Register in README.md + CVF_CORE_KNOWLEDGE_BASE.md |
| [Ecosystem Governance Contract](governance/toolkit/05_OPERATION/CVF_ECOSYSTEM_GOVERNANCE_CONTRACT.md) | Governance state changes | Single-source contract for all extensions |
| [Skill Rollout Policy](governance/toolkit/05_OPERATION/CVF_SKILL_ROLLOUT_POLICY.md) | Skill promotion/deprecation | 5-stage rollout lifecycle |
| [Durable Execution Policy](governance/toolkit/05_OPERATION/CVF_DURABLE_EXECUTION_POLICY.md) | Long-running workflows | Checkpoint/recovery/replay coordination |

### Extension Rules (Non-negotiable)

- **R1** — Existing CVF structure is always the standard. No redefinition without ADR + approval.
- **R2** — New additions must be compatible and additive — upgrade, never replace.
- **R3** — Naming and storage must follow CVF conventions. See [`CVF_CORE_KNOWLEDGE_BASE.md` Section XIV](docs/CVF_CORE_KNOWLEDGE_BASE.md).

### Release Navigation

- [Release Manifest](docs/reference/CVF_RELEASE_MANIFEST.md) — Current operational release state
- [Module Inventory](docs/reference/CVF_MODULE_INVENTORY.md) — Module scope
- [Enterprise Evidence Pack](docs/reference/CVF_ENTERPRISE_EVIDENCE_PACK.md) — Audit/release/onboarding packets

</details>

---

## 🤝 Contributing

We welcome contributions!

- 📖 Improve documentation
- 🐛 Report bugs
- ✨ Suggest features
- 🧩 Add new skills
- 🌐 Translate content

**Get started:**

1. Read [Contributing Guide](v1.0/CONTRIBUTING.md)
2. Check [Good First Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
3. Star this repo ⭐

---

## 📞 Support

- 🔍 [Documentation](docs/GET_STARTED.md) | [Troubleshooting](docs/cheatsheets/troubleshooting.md)
- 🐛 [GitHub Issues](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF/issues)
- 📢 [CHANGELOG](CHANGELOG.md)

---

## 📄 License

**CC BY-NC-ND 4.0** — [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0](LICENSE)

- ✅ Read, share — allowed
- ❌ Commercial use — not allowed
- ❌ Modify and redistribute — not allowed

---

<div align="center">

**🙏 Built by [@Blackbird081](https://github.com/Blackbird081)**

[⭐ Star on GitHub](https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF) · [📖 Get Started](docs/GET_STARTED.md) · [🚀 Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md)

</div>

---

*Last updated: March 20, 2026 | Version 2.0.0 | [Quick Orientation](docs/guides/CVF_QUICK_ORIENTATION.md) | [Full Docs](docs/INDEX.md)*
