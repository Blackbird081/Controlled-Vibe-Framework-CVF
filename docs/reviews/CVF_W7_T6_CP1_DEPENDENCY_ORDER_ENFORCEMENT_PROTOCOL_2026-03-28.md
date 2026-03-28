---
tranche: W7-T6
checkpoint: CP1
title: Dependency Order Enforcement Protocol
date: 2026-03-28
status: DELIVERED
gate: P5
---

# W7-T6 / CP1 — Dependency Order Enforcement Protocol

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Gate delivered: P5 — SATISFIED
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T6_RUNTIME_ARTIFACT_TRACE_2026-03-28.md`

---

## 1. Canonical Execution Order

The W7 integration dependency order is fixed and non-negotiable:

```
Runtime → Artifact → Trace → Planner → Decision → Eval/Builder → Memory
```

This order is derived from the merge blueprint established in W7-T1 and the architecture boundary lock established in W7-T3. It cannot be rearranged by any tranche, implementation, or configuration.

---

## 2. Blocking Conditions Per Transition

Each arrow in the dependency chain represents a blocking condition. The downstream node CANNOT activate until the upstream node's required outputs exist and are validated.

| Transition | Blocking Condition |
|---|---|
| → Artifact | A Runtime execution record (`W7RuntimeRecord`) must exist with `status: completed` |
| → Trace | At least one `W7ArtifactRecord` produced by the Runtime execution must be registered |
| → Planner | A `W7TraceRecord` must exist with all required event fields populated |
| → Decision | A Planner contract output (`ControlPlaneConsumerPackage`) must be present in CPF |
| → Eval/Builder | A Decision record with `status: resolved` must exist |
| → Memory | Real Eval/Builder outputs (not synthetic) must exist; no fake-learning path permitted |

Any attempt to activate a downstream node without its upstream blocking condition being satisfied is a G7 (DEPENDENCY_ORDER_GUARD) violation.

---

## 3. G7 Enforcement Contract

G7 (DEPENDENCY_ORDER_GUARD) is the enforcement mechanism for this protocol.

**G7 trigger**: A downstream node activation is attempted without the required upstream output present.

**G7 response**:
1. Hard block — downstream node activation rejected
2. EPF `ExecutionPipelineReceipt` status: `BLOCKED_DEPENDENCY_ORDER`
3. GEF audit signal emitted with reason: `G7_DEPENDENCY_ORDER_VIOLATION`
4. LPF observability advisory: `DEPENDENCY_ORDER_VIOLATION` event logged

**G7 release**: Upstream blocking condition is satisfied → G7 automatically releases for that specific transition. No human checkpoint required (G7 is a structural guard, not an autonomy guard).

---

## 4. Violation Detection Criteria

| # | Violation | Detection Method |
|---|---|---|
| V1 | Planner activated without a Trace record | G7 checks `W7TraceRecord` existence before CPF DESIGN phase entry |
| V2 | Decision engine invoked without Planner output | G7 checks `ControlPlaneConsumerPackage` presence |
| V3 | Memory Loop activated before Decision logs are real | G7 + explicit "no fake learning" check in Memory activation gate |
| V4 | Artifact registered without a Runtime execution record | G7 checks `W7RuntimeRecord` as parent reference |
| V5 | Eval/Builder activated before Decision resolved | G7 checks Decision `status: resolved` |
| V6 | Trace produced without a parent Artifact reference | G7 checks `W7TraceRecord.artifactRef` is populated |

---

## 5. Enforcement in the W7 Tranche Sequence

The same dependency order governs the W7 delivery tranches themselves:

| Tranche | Dependency Node | Status |
|---|---|---|
| W7-T6 | Runtime + Artifact + Trace | IN EXECUTION |
| W7-T7 | Planner + Decision Engine | Requires W7-T6 closed |
| W7-T8 | Eval/Builder | Requires W7-T7 closed |
| W7-T9 | Memory Loop | Requires W7-T8 closed + real Decision logs |
| W7-T10 | Wave Closure | Requires W7-T9 closed |

P5 enforcement applies to both the implementation contracts AND the tranche sequence.

---

## 6. Gate Outcome

**P5 SATISFIED** — Dependency Order Enforcement Protocol is fully defined:
- Canonical order locked: `Runtime → Artifact → Trace → Planner → Decision → Eval/Builder → Memory`
- Blocking condition defined per transition (6 transitions)
- G7 enforcement contract specified with hard-block behavior
- 6 violation detection criteria defined
- Tranche sequence bound to the same dependency order
