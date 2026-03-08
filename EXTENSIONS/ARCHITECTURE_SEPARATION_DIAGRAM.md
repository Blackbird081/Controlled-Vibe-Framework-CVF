# CVF Architecture Separation Diagram

> **Updated 2026-03-08** — CVF Core vs CVF Full separation, Layer 0–5 architecture

---

## Two Scopes of CVF

```
                    ┌─────────────────────────────────┐
                    │     Controlled Vibe Framework    │
                    │             (CVF)                │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────────┐
    │       🧬 CVF Core         │   │        🏛️ CVF Full            │
    │   "Git for AI Development"│   │  "AI Governance Framework"    │
    │                           │   │                               │
    │   Deterministic           │   │   Complete governance         │
    │   development primitives  │   │   ecosystem built on Core     │
    │                           │   │                               │
    │   Layer 0                 │   │   Layer 1 → Layer 5           │
    └───────────────────────────┘   └───────────────────────────────┘
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

## Branching Architecture View

```
CVF
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
Layer 5  ──depends on──►  Layer 4  ──►  Layer 3  ──►  Layer 2  ──►  Layer 1
                                                                       │
                                                                       ▼
                                                              🧬 Layer 0
                                                              CVF Core
                                                              (NEVER depends up)
```

**Key rules:**
- Layer 0 is **immutable** — all changes through extensions only
- Higher layers **depend on** lower layers, never the reverse
- Layer 0 can run **standalone** — CVF Core works without CVF Full
- CVF Full **requires** Layer 0 as foundation

---

## Separation Matrix

| Layer | Scope | Purpose | Type | Key Tests |
|-------|-------|---------|------|-----------|
| **0** | **CVF Core** | Development primitives, governance engine | 🔒 Immutable | 49 (v3.0) |
| **1** | CVF Full | Intelligence, skills, tools, SDK | ✅ Production | Mixed |
| **2** | CVF Full | Safety kernel, hardening, replay | ✅ Production | 122 |
| **3** | CVF Full | Web platform, governance engine | ✅ Production | 1764+ |
| **4** | CVF Full | Safety UI, non-coder runtime | ✅ Production | 32 |
| **5** | CVF Full | Runtime adapter contracts | ✅ Production | — |

---

## Enterprise Thinking

| Analogy | CVF Equivalent |
|---------|----------------|
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