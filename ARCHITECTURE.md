# CVF Architecture

> Front-door architecture view for GitHub readers.
>
> Current readout: the active system-unification wave is complete on the active reference path, while future expansion is gated by reassessment and `GC-018`.

## 1. System Shape

CVF is easiest to understand as a governance-first stack with four distinct roles:

- `Meta governance` defines why the system exists and what it should optimize for
- `Control plane` defines how execution is constrained
- `Execution channels` deliver governed experiences for coders and non-coders
- `Evidence + continuation governance` decides whether the system can safely deepen or reopen

```mermaid
flowchart TB
    subgraph META["Meta Governance Layer"]
        DOCT["Doctrine<br/>ECOSYSTEM/doctrine"]
        OPER["Operating Model<br/>ECOSYSTEM/operating-model"]
        STRAT["Strategy and Roadmaps<br/>ECOSYSTEM/strategy + docs/roadmaps"]
    end

    subgraph CTRL["Governance Control Plane"]
        CONTRACT["Shared Guard Contract<br/>EXTENSIONS/CVF_GUARD_CONTRACT"]
        RUNTIME["Canonical Governance Runtime<br/>CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL"]
        GATES["CI + Local Compat Gates<br/>governance/compat + .githooks"]
    end

    subgraph CHANNELS["Execution Channels"]
        SDK["Coder-facing SDK and governed loop"]
        WEB["Web UI and non-coder governed flows"]
        AGENTS["Multi-agent runtime and adapters"]
    end

    subgraph EVIDENCE["Evidence and Continuation Governance"]
        BASE["Baselines + Reviews + Readiness"]
        HOLD["GC-018 + post-closure reassessment"]
    end

    DOCT --> CONTRACT
    DOCT --> RUNTIME
    OPER --> WEB
    STRAT --> BASE

    CONTRACT --> SDK
    CONTRACT --> WEB
    CONTRACT --> AGENTS
    RUNTIME --> SDK
    RUNTIME --> WEB
    RUNTIME --> AGENTS
    GATES --> CONTRACT
    GATES --> RUNTIME
    GATES --> BASE

    SDK --> BASE
    WEB --> BASE
    AGENTS --> BASE
    BASE --> HOLD
```

## 2. Dependency Rules

The engineering stack is intentionally asymmetric:

- higher execution layers depend downward
- Layer 0 never depends upward
- doctrine governs engineering, but does not execute code
- evidence governs continuation, but does not replace runtime controls

```mermaid
flowchart TB
    META["Meta Layer<br/>Doctrine / Operating Model / Strategy"]

    L3["Layer 3<br/>Web Platform, APIs, non-coder surfaces"]
    L2["Layer 2<br/>Canonical runtime, orchestrator, workflow bridge"]
    L1["Layer 1<br/>Shared guard contract, skill and risk semantics"]
    L0["Layer 0<br/>Frozen baseline primitives and foundational rules"]

    EVID["Cross-cutting evidence layer<br/>baselines, reviews, release posture"]

    META -. governs .-> L3
    META -. governs .-> L2
    META -. governs .-> L1
    META -. governs .-> L0

    L3 --> L2
    L2 --> L1
    L1 --> L0

    L3 --> EVID
    L2 --> EVID
    L1 --> EVID
    EVID --> HOLD["Continuation gate<br/>GC-018 / reassessment"]
```

## 3. Active Reference Path

The current active path is the clearest expression of CVF today:

```mermaid
flowchart LR
    INTENT["User intent<br/>coder or non-coder"]
    ENTRY["Entry surface<br/>SDK / wizard / API"]
    GUARDS["Guard contract<br/>phase, role, risk, scope"]
    ORCH["Runtime orchestrator<br/>INTAKE -> DESIGN -> BUILD -> REVIEW -> FREEZE"]
    APPROVAL["Approval checkpoints"]
    EXEC["Execution and tool use"]
    REVIEW["Review and audit evidence"]
    FREEZE["Freeze artifact / receipt"]

    INTENT --> ENTRY
    ENTRY --> GUARDS
    GUARDS --> ORCH
    ORCH --> APPROVAL
    APPROVAL --> EXEC
    EXEC --> REVIEW
    REVIEW --> FREEZE
```

## 4. Interaction Model

This is the practical governed loop that CVF currently proves on the active path:

```mermaid
sequenceDiagram
    participant User
    participant Entry as SDK or Web Entry
    participant Guard as Guard Contract
    participant Runtime as Governance Runtime
    participant Tool as Tool / Model / Agent
    participant Evidence as Audit / Freeze / Baseline

    User->>Entry: submit intent
    Entry->>Guard: evaluate phase, role, risk, scope
    Guard-->>Entry: allow / block / escalate
    Entry->>Runtime: open governed execution path
    Runtime->>Runtime: orchestrate canonical phase loop
    Runtime->>Tool: execute within approved boundary
    Tool-->>Runtime: result + traces
    Runtime->>Evidence: review receipt + freeze artifact
    Evidence-->>User: reviewable outcome
```

## 5. What This Means

The architecture should be read this way:

- CVF is not just a collection of extensions
- the control plane is the point of coherence
- Web UI, SDK flows, and multi-agent paths are valuable only when they stay under the same governed semantics
- baselines, reviews, and continuation gates are part of the system boundary, not just project paperwork

## 6. Read Next

- [README](README.md)
- [Release Readiness](docs/reference/CVF_RELEASE_READINESS_STATUS_2026-03-20.md)
- [System Checkpoint](docs/reviews/CVF_INDEPENDENT_SYSTEM_CHECKPOINT_2026-03-20.md)
- [System Unification Roadmap](docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md)
- [Governance Control Matrix](docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md)
- [Detailed Architecture Map](docs/reference/CVF_ARCHITECTURE_MAP.md)
- [Architecture Separation Diagram](EXTENSIONS/ARCHITECTURE_SEPARATION_DIAGRAM.md)
