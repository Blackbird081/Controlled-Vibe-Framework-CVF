# Version Evolution

[🇻🇳 Tiếng Việt](../GET_STARTED.md) | 🇬🇧 English

CVF has evolved through 6 versions, each adding a layer of capability while preserving backward compatibility. All versions prior to v1.6 are **frozen** — meaning their specifications are final and will not change.

---

## Version Timeline

```
v1.0  Foundation          ████████████░░░░░░░░░░░░░░░░░░░░
v1.1  Governance          ████████████████░░░░░░░░░░░░░░░░
v1.2  Capability          ████████████████████░░░░░░░░░░░░
v1.3  Implementation      ████████████████████████░░░░░░░░
v1.5  UX Platform         ████████████████████████████░░░░
v1.6  Agent Platform      ████████████████████████████████  ← Current
```

---

## v1.0 — Foundation

> *"Establish the core idea: controlled vibe coding through structured phases."*

**Status:** FROZEN

**What it introduced:**
- The 4-phase process: Discovery → Design → Build → Review
- Phase gates (must pass to continue)
- Basic decision logging (`DECISIONS.md`)
- CVF Manifesto and core philosophy
- Templates for project initialization
- Compliance framework outline

**Key files:**
- `v1.0/CVF_MANIFESTO.md` — The original manifesto
- `v1.0/phases/` — Phase definitions
- `v1.0/governance/` — Basic governance rules
- `v1.0/templates/` — Project templates

**Ideal for:** Understanding CVF's origins and core philosophy.

---

## v1.1 — Governance Refinement

> *"Formalize who controls what, when, and how."*

**Status:** FROZEN

**What it added:**
- 4 human roles: OBSERVER, BUILDER, ARCHITECT, GOVERNOR
- Authority-by-phase matrix (who approves what in which phase)
- 6 agent archetypes: Analysis, Decision, Planning, Execution, Supervisor, Exploration
- Agent lifecycle: 6 states (Inactive → Proposed → Validated → Active → Suspended → Retired)
- 8 governance commands: `CVF:PROPOSE`, `CVF:APPROVE`, `CVF:REJECT`, `CVF:AUDIT`, `CVF:PAUSE`, `CVF:OVERRIDE`, `CVF:ESCALATE`, `CVF:RETIRE`
- INPUT/OUTPUT specifications for every phase
- Migration guide from v1.0

**Key files:**
- `v1.1/governance/` — Full governance model
- `v1.1/agents/` — Agent archetype definitions
- `v1.1/architecture/` — System architecture
- `v1.1/MIGRATION_GUIDE.md` — Upgrading from v1.0

**Ideal for:** Teams wanting formal governance without implementation tools.

---

## v1.2 — Capability Extension

> *"Define what AI can do, how it's bounded, and how risk is managed."*

**Status:** FROZEN

**What it added:**
- Skill contracts: formal definition of AI capabilities
- Capability lifecycle management
- Risk model with 5 dimensions:
  - Authority Risk
  - Scope Expansion Risk
  - Irreversibility Risk
  - Interpretability Risk
  - External Impact Risk
- Risk levels: R0 (Passive) → R1 (Controlled) → R2 (Elevated) → R3 (Critical) → R4 (Blocked)
- Risk aggregation rules
- Capability validation framework

**Key files:**
- `EXTENSIONS/CVF_v1.2_CAPABILITY_EXTENSION/` — Full extension

**Ideal for:** Organizations needing formal risk management for AI capabilities.

---

## v1.3 — Implementation Toolkit

> *"Make CVF executable with real tools."*

**Status:** FROZEN

**What it added:**
- Python SDK for CVF operations
- CLI tools for project initialization and management
- CI/CD integration (GitHub Actions workflow)
- Automated phase gate validation
- Operator Edition (v1.3.1): simplified for hands-on operators

**Key files:**
- `EXTENSIONS/CVF_v1.3_IMPLEMENTATION_TOOLKIT/` — SDK and tools
- `EXTENSIONS/CVF_v1.3.1_OPERATOR_EDITION/` — Streamlined for operators

**Ideal for:** Developers wanting CLI/SDK integration into existing workflows.

---

## v1.4 — Usage Layer

> *"Standardize how CVF is applied across different contexts."*

**Status:** FROZEN

**What it added:**
- Usage patterns for different project types
- Context-specific application guides
- Workflow templates

**Key files:**
- `EXTENSIONS/CVF_v1.4_USAGE_LAYER/` — Usage patterns

---

## v1.5 — UX Platform

> *"Make CVF accessible to non-technical users."*

**Status:** FROZEN

**What it added:**
- End-user orientation (v1.5.1): guides for non-developers
- Skill Library for End Users (v1.5.2): 131 skills across 12 domains
- User-facing documentation and tutorials

**Key files:**
- `EXTENSIONS/CVF_v1.5_UX_PLATFORM/` — Platform specs
- `EXTENSIONS/CVF_v1.5.1_END_USER_ORIENTATION/` — End-user guides
- `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/` — Full skill library

**Ideal for:** Teams onboarding non-technical members to CVF workflows.

---

## v1.6 — Agent Platform (Current)

> *"Bring CVF to life as an interactive web application."*

**Status:** ACTIVE (current version)

**What it added:**
- Full web application (Next.js 16 + React 19 + TypeScript 5)
- Interactive templates for all 4 phases
- Multi-agent chat interface
- Single and multi-AI mode
- Agent handoffs and phase transitions
- 3 governance modes: Minimal, Standard, Full
- Real-time risk assessment UI
- Zustand state management
- Tailwind CSS 4 styling
- Vitest testing framework

**Tech stack:**
| Technology | Version |
|-----------|---------|
| Next.js | 16 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Zustand | 5 |
| Vitest | 4 |

**Key files:**
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/` — Platform specs
- `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/` — Web application source

**Ideal for:** Teams wanting a visual, interactive CVF experience.

---

## Version Comparison

| Feature | v1.0 | v1.1 | v1.2 | v1.3 | v1.5 | v1.6 |
|---------|:----:|:----:|:----:|:----:|:----:|:----:|
| 4-Phase Process | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Decision Logging | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Phase Gates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Formal Roles | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agent Archetypes | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commands | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| Risk Model | — | — | ✅ | ✅ | ✅ | ✅ |
| Skill Contracts | — | — | ✅ | ✅ | ✅ | ✅ |
| Python SDK/CLI | — | — | — | ✅ | ✅ | ✅ |
| CI/CD Integration | — | — | — | ✅ | ✅ | ✅ |
| End-User Guides | — | — | — | — | ✅ | ✅ |
| Skill Library (114) | — | — | — | — | ✅ | ✅ |
| Web UI | — | — | — | — | — | ✅ |
| Multi-Agent Chat | — | — | — | — | — | ✅ |
| Governance Modes | — | — | — | — | — | ✅ |

---

## Which Version Should You Use?

| If you are... | Start with | Then explore |
|--------------|-----------|--------------|
| A solo developer, just curious | **v1.0** (read manifesto) | v1.6 (try web UI) |
| A developer wanting structure | **v1.1** (governance) | v1.3 (CLI tools) |
| A team needing risk management | **v1.2** (risk model) | v1.6 (visual risk) |
| An ops/DevOps engineer | **v1.3** (SDK, CI/CD) | v1.6 (web platform) |
| A non-technical team member | **v1.6** (web UI, end-user friendly) | — |
| Everyone going forward | **v1.6** (current, all features) | — |

### Quick Recommendation

- **New to CVF?** → Start with [START_HERE.md](../../START_HERE.md) and the v1.6 web UI
- **Want to understand the philosophy?** → Read the [v1.0 Manifesto](../../v1.0/CVF_MANIFESTO.md)
- **Need formal governance?** → Study v1.1 governance model
- **Need risk controls?** → Study v1.2 risk model + [Risk Model concept](risk-model.md)
- **Want tools?** → Use v1.3 CLI/SDK
- **Want the full experience?** → Use v1.6 web platform

---

## Backward Compatibility

Each version **extends** the previous — it never breaks it.

```
v1.0 → v1.1 → v1.2 → v1.3 → v1.5 → v1.6
 +        +        +        +        +        +
 |        |        |        |        |        |
 phases   roles    risk     tools    UX      web
 gates    agents   skills   SDK     users    app
 logging  cmds     caps     CLI     library  chat
```

If you use v1.6, you automatically have access to all concepts from v1.0–v1.5.

---

## Frozen vs. Active

| Status | Meaning | Versions |
|--------|---------|----------|
| **FROZEN** | Spec is final, no changes | v1.0, v1.1, v1.2, v1.3, v1.4, v1.5 |
| **ACTIVE** | Under active development | v1.6 |

Frozen doesn't mean obsolete — it means stable and reliable. The v1.0 manifesto is as valid today as when it was written.

---

## Further Reading

- [Core Philosophy](core-philosophy.md) — The 7 principles behind every version
- [Governance Model](governance-model.md) — How roles evolved from v1.1
- [Risk Model](risk-model.md) — Risk framework from v1.2
- [Skill System](skill-system.md) — Skills from v1.2/v1.5
- [Version Comparison tables](../VERSION_COMPARISON.md) — Detailed feature comparison

---

*Last updated: February 15, 2026 | CVF v1.6*
