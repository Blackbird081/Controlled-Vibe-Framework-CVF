# CVF v1.1.1 — Phase Governance Protocol

> **CVF Version:** v1.1.1 — Sub-extension of v1.1 (Governance Refinement)
> **Layer:** 1.5 (Development Governance)
> **Status:** Implemented
> **Integrated:** 2026-03-06 | **ADR:** ADR-014

---

## 1. Overview

CVF v1.1.1 introduces **Development Lifecycle Governance** — the missing piece between CVF Core principles and runtime execution. While CVF already controls **how AI code runs** (runtime governance), this extension controls **how AI code is built** (development governance).

```
CVF Before:      idea → agent code → commit → runtime governance
CVF After v1.1.1: idea → SPEC → STATE_MACHINE → CODE → VALIDATE → GATE → commit → runtime
```

This is a **pre-runtime verification system** that validates architectural integrity before code enters the runtime environment.

Current hardening status (2026-03-07):
- `GovernanceExecutor` supports pluggable verification modules while preserving canonical pipeline order.
- Executor can persist phase report + hash ledger into `GovernanceAuditLog` when audit logging is provided.
- `artifact_integrity` now runs first in `GOVERNANCE_PIPELINE` so untrusted artifacts fail before deeper verification work starts.
- Audit persistence now supports forensic trace metadata (`requestId`, `traceBatch`, `traceHash`, remediation linkage) for upgrade tracking.
- Runtime execution now binds `policyVersion` and default `auditPhase` from a shared governance control-plane contract instead of leaving them fully caller-defined.

---

## 2. The 9-Stage Deterministic Pipeline

Every component must follow this strict sequential lifecycle:

```
1. SPEC              → Define component specification (feature.spec.md)
2. STATE_MACHINE     → Model all states & transitions (state.machine.yaml)
3. STATE_DIAGRAM     → Generate visual diagram (state.diagram.mmd)
4. IMPLEMENTATION    → Write the code
5. STATE_VALIDATION  → Cross-check code vs state machine
6. UNIT_TESTING      → Run behavioral tests
7. SCENARIO_SIMULATION → Simulate edge cases & failure paths
8. PHASE_GATE        → Governance validation (all checks must pass)
9. COMPLETE          → Approved for merge into system
```

**No stage can be skipped.** Transitions are enforced by `PhaseProtocol.isValidTransition()`.

---

## 3. Architecture

```
/governance/
├── phase_protocol/              ← 9-stage pipeline controller
│   ├── phase.protocol.ts        ← PhaseProtocol class (strict sequential)
│   ├── phase.context.ts         ← Current stage tracking
│   └── artifact.registry.ts     ← Track required artifacts
│
├── phase_gate/                  ← Validation enforcement
│   ├── phase.gate.ts            ← evaluate() + enforce()
│   ├── gate.rules.ts            ← Validation rules
│   └── gate.result.ts           ← APPROVED/REJECTED + R0–R3 risk level
│
├── control_plane/               ← Shared runtime-governance binding
│   └── governance.control.plane.ts ← Canonical policyVersion/auditPhase contract
│
├── state_enforcement/           ← State machine verification
│   ├── state.machine.parser.ts  ← Parse YAML → StateMachine
│   ├── state.machine.validator.ts
│   ├── state.transition.checker.ts
│   └── deadlock.detector.ts     ← DFS cycle detection
│
├── diagram_validation/          ← Mermaid cross-check
│   ├── mermaid.parser.ts        ← Parse mermaid → graph + toStateMachine()
│   ├── diagram.consistency.check.ts
│   └── state.diagram.generator.ts
│
├── structural_diff/             ← Architecture drift detection
│   ├── architecture.diff.ts     ← Detect missing/extra nodes+edges
│   ├── state_vs_code.diff.ts    ← State machine vs implementation diff
│   └── drift.detector.ts        ← Combined drift report
│
├── scenario_simulator/          ← Edge case discovery
│   ├── scenario.generator.ts    ← DFS path walk (max 100 scenarios, cycle-safe)
│   ├── failure.simulator.ts     ← Simulate error conditions
│   └── execution.trace.ts       ← Record execution path
│
└── reports/                     ← Governance audit
    ├── phase.report.generator.ts ← Aggregate gate+drift+traces
    └── governance.audit.log.ts   ← Persistent audit log
```

---

## 4. Phase Gate Conditions

A development phase is APPROVED only when ALL checks pass:

| Check | Description | Critical? |
|---|---|---|
| State machine defined | `state.machine.yaml` exists | Yes |
| Transitions complete | All states have defined transitions | Yes |
| No unreachable states | Every state is reachable from initial state | Yes |
| No deadlocks | No circular dependencies without exit | Yes |
| Code paths mapped | Implementation matches state machine | No |
| Unit tests pass | All behavioral tests pass | No |
| Scenario tests pass | Edge case simulations pass | No |

Risk level derived from failed checks:

| R0 | R1 | R2 | R3 |
|---|---|---|---|
| All pass | 1 non-critical fail | 2-3 fails | 4+ fails or critical fail |

---

## 5. CVF Compatibility

| Principle | Status |
|---|---|
| Core Contract Invariance | OK — does NOT modify runtime |
| Hook-based Integration | OK — validation only, no runtime hooks |
| Non-intrusive Enforcement | OK — validates before execution, not during |
| Reversible Extension | OK — if disabled, system runs normally |
| Human authority | OK — Phase Gate requires human review |
| Audit trail | OK — reports/ generates governance audit logs |

---

## 6. What This Is NOT

- ❌ NOT a runtime governance layer (that's v1.7.x–v1.9)
- ❌ NOT a code optimizer or auto-fixer
- ❌ NOT a replacement for unit testing
- ❌ It does NOT modify CVF Core, policies, risk models, or ledger

---

## 7. Versioning

**Chain:** v1.1 (Governance Refinement) → v1.1.1 (Phase Governance Protocol)

v1.1 defined governance principles. v1.1.1 implements **development lifecycle enforcement** based on those principles.

---

*See [ADR-014](../../docs/CVF_ARCHITECTURE_DECISIONS.md) for integration rationale.*
