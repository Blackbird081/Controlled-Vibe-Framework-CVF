# CVF Architecture Separation Diagram

> **Updated 2026-03-09** — CVF Core vs CVF Full separation, Layer 0–5 + ECOSYSTEM meta layer

---

## Three-Tier Architecture

```
                    ┌─────────────────────────────────┐
                    │     Controlled Vibe Framework    │
                    │          (CVF Ecosystem)         │
                    └───────────────┬─────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
┌─────────────────────┐ ┌───────────────────────┐ ┌────────────────────────┐
│  📜 ECOSYSTEM/       │ │   🧬 CVF Core         │ │   🏛️ CVF Full          │
│  "Meta Layer"        │ │   "Git for AI Dev"    │ │   "Governance Fwk"     │
│                      │ │                       │ │                        │
│  Doctrine            │ │   Deterministic       │ │   Complete governance  │
│  Operating Model     │ │   development         │ │   ecosystem built on   │
│  Strategy            │ │   primitives          │ │   Core                 │
│                      │ │                       │ │                        │
│  WHY + WHAT          │ │   Layer 0             │ │   Layer 1 → Layer 5    │
└─────────────────────┘ └───────────────────────┘ └────────────────────────┘
        governs ─────────────────►  depends on  ◄────────────────
```

---

## CVF Core — Layer 0 (Foundation)

> **"Git for AI Development"** — Giống cách Git giải quyết version control cho code,
> CVF Core giải quyết governance control cho AI development.

```
┌──────────────────────────────────────────────────────────────────┐
│                     🧬 CVF CORE — LAYER 0                        │
│               Deterministic Development Primitives               │
│                        🔒 IMMUTABLE                              │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   v1.0 / v1.1  (FROZEN — Foundation specs)                       │
│   ├── 4-Phase Model: Discovery → Design → Build → Review        │
│   ├── Governance Principles & Checklists                         │
│   ├── Agent Archetypes: Analysis / Execution / Orchestration     │
│   ├── INPUT/OUTPUT Specs & Command Taxonomy                      │
│   └── Execution Spine + Action Units                             │
│                                                                  │
│   v3.0  Core Governance Engine (TypeScript)                      │
│   ├── ai_commit         — Deterministic commit protocol          │
│   ├── artifact_ledger   — Immutable artifact chain               │
│   ├── process_model     — Phase state machine engine             │
│   ├── skill_lifecycle   — Skill governance pipeline              │
│   └── 49 tests                                                   │
│                                                                  │
│   📌 ALL higher layers depend on Layer 0                         │
│   📌 Layer 0 NEVER depends on higher layers                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## CVF Full — Layer 1→5 (Ecosystem)

> **"AI Governance Framework"** — The complete ecosystem built on CVF Core.

```
┌──────────────────────────────────────────────────────────────────┐
│  🛡️ Layer 5 — ADAPTER HUB                                       │
│     v1.7.3  Runtime Adapter Contracts                            │
│     OpenClaw │ PicoClaw │ ZeroClaw │ Nano                        │
├──────────────────────────────────────────────────────────────────┤
│  🎯 Layer 4 — SAFETY UI                                         │
│     v1.7.2  Safety Dashboard (real-time risk view)               │
│     v2.0    Non-Coder Safety Runtime                             │
│             ModeMapper + IntentInterpreter + ConfirmationEngine  │
├──────────────────────────────────────────────────────────────────┤
│  🌐 Layer 3 — PLATFORM                                          │
│     v1.6    Agent Platform (Next.js, AI Chat, Multi-Agent)       │
│     v1.6.1  Governance Engine (Enterprise, FastAPI)              │
├──────────────────────────────────────────────────────────────────┤
│  ⚙️ Layer 2 — SAFETY RUNTIME                                    │
│     v1.7.1  5-Layer Safety Kernel (51 tests)                     │
│     v1.8    Safety Hardening — state machine, rollback (42 tests)│
│     v1.9    Deterministic Replay — context freezer (29 tests)    │
├──────────────────────────────────────────────────────────────────┤
│  🧠 Layer 1 — INTELLIGENCE & TOOLS                              │
│     v1.2    Capability Extension (Risk R0–R3, Skill Spec)        │
│     v1.2.1  External Integration (supply chain, audit ledger)    │
│     v1.3    SDK & Tooling (Python, TypeScript, CLI)              │
│     v1.5.2  Skill Library (141 skills × 12 domains)              │
│     v1.7    Controlled Intelligence (reasoning, entropy, prompt) │
│     v1.1.1  Phase Governance Protocol (state enforcement)        │
├──────────────────────────────────────────────────────────────────┤
│  🧬 Layer 0 — CVF CORE (see above)                              │
│     v1.0/v1.1 (FROZEN) + v3.0 Core Engine                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## ECOSYSTEM Meta Layer

> **"Why + What"** — Doctrine, Operating Model, and Strategy sit above the engineering stack.
> They govern engineering but contain no code.

```
┌──────────────────────────────────────────────────────────────────┐
│                  📜 ECOSYSTEM — META LAYER                       │
│            Doctrine · Operating Model · Strategy                 │
│                     🔏 GOVERNANCE AUTHORITY                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   doctrine/              L0 — Tư tưởng & Nguyên lý (FROZEN)     │
│   ├── CVF_PRODUCT_POSITIONING.md                                 │
│   ├── CVF_ARCHITECTURE_PRINCIPLES.md                             │
│   ├── CVF_ECOSYSTEM_MAP.md                                       │
│   ├── CVF_LAYER_MODEL.md                                         │
│   └── CVF_DOCTRINE_RULES.md                                      │
│                                                                  │
│   operating-model/       L3 — VOM (Vibecode Operating Model)     │
│   ├── CVF_AGENT_OPERATING_MODEL.md    (for dev teams)            │
│   ├── CVF_BUILDER_MODEL.md            (for non-coders)           │
│   └── CVF_VOM_QUICK_START.md          (10-min onboarding)        │
│                                                                  │
│   strategy/              Roadmap & Blueprint                     │
│   ├── CVF_STRATEGIC_SUMMARY.md                                   │
│   └── CVF_UNIFIED_ROADMAP_2026.md                                │
│                                                                  │
│   📌 ECOSYSTEM defines WHY and WHAT                              │
│   📌 Engineering (Layer 0–5) implements HOW                      │
│   📌 Doctrine governs all — engineering NEVER overrides doctrine │
└──────────────────────────────────────────────────────────────────┘
```

---

## Branching Architecture View

```
CVF Ecosystem
 │
 ├─── 📜 ECOSYSTEM/ (Meta Layer) ─── "Why + What"
 │     ├── doctrine/          Architecture Principles, Positioning   [FROZEN]
 │     ├── operating-model/   Agent Model, Builder Model, Quick Start
 │     └── strategy/          Unified Roadmap, Strategic Summary
 │
 ├─── 🧬 CVF Core (Layer 0) ─── "Git for AI Development"
 │     │
 │     ├── v1.0  Manifesto, 4-Phase, Governance Principles  [FROZEN]
 │     ├── v1.1  Extended Control, I/O Specs, Multi-Agent    [FROZEN]
 │     └── v3.0  Core Governance Engine                      [ACTIVE]
 │           ├── ai_commit
 │           ├── artifact_ledger
 │           ├── process_model
 │           └── skill_lifecycle
 │
 └─── 🏛️ CVF Full (Layer 1–5) ─── "AI Governance Framework"
       │
       ├── Layer 1: Intelligence & Tools
       │     ├── v1.2   Capability Extension (Risk R0–R3)
       │     ├── v1.2.1 External Integration (29 tests)
       │     ├── v1.3   SDK & Tooling
       │     ├── v1.5.2 Skill Library (141 skills)
       │     ├── v1.7   Controlled Intelligence
       │     └── v1.1.1 Phase Governance Protocol
       │
       ├── Layer 2: Safety Runtime
       │     ├── v1.7.1 Safety Kernel (51 tests)
       │     ├── v1.8   Safety Hardening (42 tests)
       │     └── v1.9   Deterministic Replay (29 tests)
       │
       ├── Layer 3: Platform
       │     ├── v1.6   Agent Platform (Next.js, AI Chat)
       │     └── v1.6.1 Governance Engine (Enterprise)
       │
       ├── Layer 4: Safety UI
       │     ├── v1.7.2 Safety Dashboard
       │     └── v2.0   Non-Coder Safety Runtime (32 tests)
       │
       └── Layer 5: Adapter Hub
             └── v1.7.3 Runtime Adapter Contracts
```

---

## Dependency Rule

```
📜 ECOSYSTEM (Meta Layer)
     │ governs
     ▼
Layer 5  ──depends on──►  Layer 4  ──►  Layer 3  ──►  Layer 2  ──►  Layer 1
                                                                       │
                                                                       ▼
                                                              🧬 Layer 0
                                                              CVF Core
                                                              (NEVER depends up)
```

**Key rules:**
- ECOSYSTEM **governs** all layers — defines WHY and WHAT, contains no code
- Layer 0 is **immutable** — all changes through extensions only
- Higher layers **depend on** lower layers, never the reverse
- Layer 0 can run **standalone** — CVF Core works without CVF Full
- CVF Full **requires** Layer 0 as foundation

---

## Separation Matrix

| Layer | Scope | Purpose | Type | Key Tests |
|-------|-------|---------|------|-----------|
| **Meta** | **ECOSYSTEM** | Doctrine, operating model, strategy | 📜 Governance Authority | — |
| **0** | **CVF Core** | Development primitives, governance engine | 🔒 Immutable | 49 (v3.0) |
| **1** | CVF Full | Intelligence, skills, tools, SDK | ✅ Production | Mixed |
| **2** | CVF Full | Safety kernel, hardening, replay | ✅ Production | 122 |
| **3** | CVF Full | Web platform, governance engine | ✅ Production | 1764+ |
| **4** | CVF Full | Safety UI, non-coder runtime | ✅ Production | 32 |
| **5** | CVF Full | Runtime adapter contracts | ✅ Production | — |
| **ECO** | **Track III Extensions** | Ecosystem expansion modules | 🧬 12 extensions | **434 tests** |

---

## CVF_ECO Extensions — Test Results (2026-03-09)

**Overall: ✅ PASS — 434/434 tests, 12/12 extensions, 0 TS errors**

### Phase 2 — Intelligence Layer (197 tests)
- `CVF_ECO_v1.0_INTENT_VALIDATION` (41 tests) — Triple-S engine
- `CVF_ECO_v1.1_NL_POLICY` (46 tests) — NL Policy compiler
- `CVF_ECO_v1.2_LLM_RISK_ENGINE` (37 tests) — Risk scoring
- `CVF_ECO_v1.3_DOMAIN_GUARDS` (39 tests) — Finance/Privacy/CodeSecurity
- `CVF_ECO_v1.4_RAG_PIPELINE` (34 tests) — Document retrieval

### Phase 3 — Product Packaging (112 tests)
- `CVF_ECO_v2.0_AGENT_GUARD_SDK` (43 tests) — Unified SDK
- `CVF_ECO_v2.1_GOVERNANCE_CANVAS` (30 tests) — Metrics & reports
- `CVF_ECO_v2.2_GOVERNANCE_CLI` (39 tests) — Command-line interface

### Phase 4 — Governance Network (66 tests)
- `CVF_ECO_v2.3_AGENT_IDENTITY` (39 tests) — Agent registry & credentials
- `CVF_ECO_v2.4_GRAPH_GOVERNANCE` (27 tests) — Graph store & trust propagation

### Phase 5 — Economy Layer (59 tests)
- `CVF_ECO_v3.0_TASK_MARKETPLACE` (29 tests) — Task bidding & assignment
- `CVF_ECO_v3.1_REPUTATION` (30 tests) — Agent scoring & history

**Quality Metrics:**
- 53 source files (4,247 LOC) + 39 test files (3,780 LOC)
- Test-to-code ratio: 0.89
- All modules compile clean with TypeScript 5.9.3 (strict mode)
- Consistent 3-layer architecture: types → components → orchestrator

**Full report:** `ECOSYSTEM/strategy/CVF_ECOSYSTEM_TEST_EVALUATION_REPORT_2026-03-09.md`

---

## Enterprise Thinking

| Analogy | CVF Equivalent |
|---------|----------------|
| Company doctrine / constitution | ECOSYSTEM — defines identity, principles, strategy |
| Git kernel | CVF Core (Layer 0) — deterministic primitives |
| GitHub / GitLab | CVF Full (Layer 1–5) — ecosystem on top |
| ISO framework | CVF Core — standards that don't change |
| Certified products | Downstream projects in CVF-Workspace |

---

## Architectural Principles

### Rule 1 — CVF Core Is Immutable
v1.0/v1.1 specs are FROZEN. v3.0 engine extends but preserves Core contracts.

### Rule 2 — Layer 0 Never Depends Up
CVF Core can exist and function without any higher layer.

### Rule 3 — Extend Without Mutation
New capabilities go into Layer 1–5 extensions, never modify Layer 0.

### Rule 4 — Downstream Projects Are Separate
Apps using CVF governance live in `CVF-Workspace/`, not in CVF root (ADR-020).

### Rule 5 — ECOSYSTEM Governs, Engineering Implements (ADR-021)

Doctrine defines WHY. Engineering implements HOW. `ECOSYSTEM/` contains no code — only meta-level documents. Engineering never overrides doctrine.

### Rule 6 — CVF_ECO Extensions Follow Strict Architecture

All 12 Track III extensions implement the same 3-layer pattern:
```
types.ts → component_a.ts, component_b.ts → orchestrator.ts
```
- Consistent scaffolding (package.json + tsconfig.json + vitest.config.ts)
- 100% test coverage (434/434 tests)
- Zero TypeScript errors
- Self-contained modules with minimal external dependencies