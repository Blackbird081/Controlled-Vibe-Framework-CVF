---
tranche: W7-T6
checkpoint: CP2
title: Runtime + Artifact + Trace Integration Contract
date: 2026-03-28
status: DELIVERED
---

# W7-T6 / CP2 — Runtime + Artifact + Trace Integration Contract

Memory class: FULL_RECORD

> Lane: Full Lane (GC-019)
> Authorization: `docs/reviews/CVF_GC018_CONTINUATION_CANDIDATE_W7_T6_RUNTIME_ARTIFACT_TRACE_2026-03-28.md`
> Scope: EPF BUILD phase only — NO Planner, Decision Engine, or Memory in this contract

---

## 1. W7RuntimeRecord Schema

A `W7RuntimeRecord` is the canonical CVF representation of a single W7 runtime execution event.

```
W7RuntimeRecord {
  id: string                        // deterministic hash from (phase + startedAt + executorId)
  phase: 'BUILD'                    // hard-locked to EPF BUILD phase
  riskLevel: W7RiskLevel            // R0 | R1 | R2 | R3
  guardPreset: RuntimeGuardPreset   // maps to P-08..P-11 (PlannedAction presets from W7-T3)
  executorId: string                // agent or process identifier
  startedAt: string                 // ISO 8601
  completedAt?: string              // ISO 8601; absent if status !== 'completed'
  status: 'running' | 'completed' | 'failed' | 'blocked'
  artifactRefs: string[]            // IDs of W7ArtifactRecords produced
  traceRef: string                  // ID of W7TraceRecord emitted (required on completion)
  policyGateRef?: string            // EPF policy gate receipt ref (required when riskLevel >= R2)
}
```

**Hard constraint**: `phase: 'BUILD'` prevents Runtime records from being created outside EPF BUILD phase. Cross-phase access to Runtime internal state is a G4 (BOUNDARY_CROSSING_GUARD) violation.

---

## 2. W7ArtifactRecord Schema

A `W7ArtifactRecord` is the canonical CVF representation of a typed output produced by a Runtime execution.

```
W7ArtifactRecord {
  id: string                        // deterministic hash from (runtimeRef + artifactType + producedAt)
  runtimeRef: string                // parent W7RuntimeRecord ID (required — G7 blocking condition)
  artifactType: W7ArtifactType      // 'code' | 'config' | 'report' | 'spec_output' | 'test_result'
  contentRef: string                // path or URI to schema-validated content
  contentSchema: string             // schema identifier (must be a registered CVF schema)
  producedAt: string                // ISO 8601
  producedBy: string                // executor ID from parent W7RuntimeRecord
  riskLevel: W7RiskLevel
  status: 'pending_review' | 'approved' | 'rejected'
}
```

**Hard constraint**: Raw output blobs are prohibited. Every artifact must have a `contentSchema` reference pointing to a registered CVF schema. Artifacts with no `runtimeRef` are a G7 violation.

---

## 3. W7TraceRecord Schema

A `W7TraceRecord` is the canonical CVF representation of the execution evidence produced by a Runtime execution, consumed by the Planner (CPF DESIGN phase) and LPF (learning).

```
W7TraceRecord {
  id: string                        // deterministic hash from (runtimeRef + emittedAt)
  runtimeRef: string                // parent W7RuntimeRecord ID (required)
  artifactRef: string               // at least one W7ArtifactRecord ID (required — G7 blocking condition for Planner)
  events: W7TraceEvent[]            // ordered list of execution events
  emittedAt: string                 // ISO 8601
  consumedBy: ('planner' | 'lpf')[] // which downstream consumers have claimed this trace
  status: 'emitted' | 'consumed' | 'archived'
}

W7TraceEvent {
  eventType: string                 // e.g. 'execution_start', 'artifact_produced', 'policy_gate_checked'
  timestamp: string                 // ISO 8601
  detail: string                    // human-readable event description (max 200 chars)
  riskSignal?: W7RiskLevel          // present if the event carries a risk signal
}
```

**Hard constraint**: `traceRef` on `W7RuntimeRecord` MUST be populated before `status` transitions to `completed`. Incomplete traces cannot unblock the Planner.

---

## 4. Boundary Constraints

| Boundary | Rule | Enforcement |
|---|---|---|
| Phase lock | All three record types are BUILD-phase output surfaces; creation outside BUILD is rejected | G4 BOUNDARY_CROSSING_GUARD |
| Internal state | Runtime internal execution state is NOT exposed via W7RuntimeRecord (only summary fields) | G4 BOUNDARY_CROSSING_GUARD |
| Planner access | Planner reads W7TraceRecord only — not W7RuntimeRecord or W7ArtifactRecord directly | G7 blocks Planner until trace exists |
| LPF access | LPF reads W7TraceRecord for learning signals — no direct Runtime or Artifact access | G4 boundary |
| Cross-plane write | No other plane may write W7RuntimeRecord, W7ArtifactRecord, or W7TraceRecord | G3 OWNERSHIP_REGISTRY_GUARD |

---

## 5. Trace-Emission Requirement

Every W7 Runtime execution MUST emit a trace. This is non-negotiable.

Enforcement:
- `W7RuntimeRecord.status` cannot transition to `completed` unless `traceRef` is populated
- If a trace cannot be produced (e.g., Runtime failure), `status` transitions to `failed` and a minimal failure trace is still emitted with `events: [{ eventType: 'execution_failed', ... }]`
- "Traceless" completions are a G6 (TRACE_EXISTENCE_GUARD) violation

---

## 6. Review 15 Phase 1 Accept/Fix Matrix

| Proposal (Review 15) | Decision | Fix Applied |
|---|---|---|
| Runtime accessing Planner state directly | REJECT | G4 violation; Runtime is BUILD-only; Planner is CPF DESIGN |
| Artifact as raw output blob | REJECT | All artifacts require `contentSchema` + schema-validated `contentRef` |
| Runtime completing without trace | REJECT | Trace-emission is mandatory; traceless completion = G6 violation |
| Planner reading Artifact directly | FIX | Planner reads Trace only; Artifact ref is inside Trace for provenance |
| Memory Loop reading Runtime records | FIX | Memory reads LPF-processed traces only; no direct Runtime access |
| W7TraceRecord consumed by multiple systems | ACCEPT | `consumedBy` field tracks all consumers |
| Runtime risk level propagates to Artifact | ACCEPT | `W7ArtifactRecord.riskLevel` inherited from parent Runtime |
| Trace events as structured objects | ACCEPT | `W7TraceEvent[]` with typed fields |
| Failed executions still produce traces | ACCEPT | Minimal failure trace required |
| Phase hard-lock on all three record types | ACCEPT | `phase: 'BUILD'` on W7RuntimeRecord; creation time enforced |
