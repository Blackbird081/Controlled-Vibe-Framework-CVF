# CVF LHW18 T1 — Failure Simulation Gap-Map Advisory Connector Spec

Contract ID: `cvf.failureSimulationGapMapAdvisory.lhw18.t1.v1`

Memory class: CONNECTOR_SPEC

Status: CLOSED_PASS_BOUNDED

Date: 2026-05-30

Wave: LHW18 T1

GC-018: `docs/baselines/CVF_GC018_LHW18_CVF_EDIT_ABSORPTION_WAVE_2026-05-30.md`

runtimeExecutionAuthorized: false

---

## Purpose

Map all 5 operator-authored failure simulation scenarios from `Failure Simulation cho CVF.md`
to their current CVF owner surfaces. Documents which scenarios are covered, which are partial,
and what the gap advisory is for each. Closes the Failure Simulation documentation gap
for the LHW18 doc-only wave scope.

## Scope / Applies To

Applies to any future CVF tranche that claims failure handling coverage. This spec is the
canonical documentation reference for scenario-level coverage mapping. Does NOT authorize
new runtime failure handlers — existing EL-2/EL-3 handlers are the current boundary.

## CVF Owner Surfaces

| Layer | Owner module |
| --- | --- |
| Worker timeout | EL-2 `worker-timeout-handler.ts` + `workerTimeoutReadout` in `/api/execute` |
| Reviewer deadlock | EL-3 `reviewer-deadlock-handler.ts` + `reviewerDeadlockReadout` in `/api/execute` |
| Human intervention flag | Delta D2 `humanInterventionRequired` in `cvf_advance_pipeline_stage` |
| Phase enforcement | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` + `cvf_advance_pipeline_stage` stage order |
| Spec review / human checkpoint | `CVF_ECO_v1.0_INTENT_VALIDATION` + operator approval flow |
| Task scope isolation | `CVF_v1.2_CAPABILITY_EXTENSION` + task-scope guard |
| Review pipeline | `CVF_GUARD_CONTRACT` + `review_gate` |
| Conflict detection | `CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL` Task Graph dependency rules |

---

## Advisory Type

`failureSimulationGapMapAdvisoryType`

---

## 5-Scenario Gap Map

### Scenario 1 — Agent Phá Architecture

**Source finding:** Dev Agent bypasses Service Layer, calls Database directly → architecture drift.

**CVF coverage:** STRONG
- Architecture spec enforcement via Phase Lock (phase C cannot modify phase B artifacts)
- Review Agent checks: does implementation match architecture?
- `cvf_advance_pipeline_stage` enforces stage transition order

**Remaining gap:** Automatic architecture drift correction is not supported — human must decide.
This is documented as intentional: CVF contains damage, does not auto-fix design decisions.

**Advisory:** `architectureViolationDetect: "PARTIAL"` — detection strong, auto-correction `N/A_INTENTIONAL`.

---

### Scenario 2 — Spec Sai

**Source finding:** Spec logic is wrong (e.g., "login without password"). CVF cannot detect
business-logic errors if the human approved the wrong spec.

**CVF coverage:** LIMITED
- `CVF_ECO_v1.0_INTENT_VALIDATION` catches structural/format errors
- Human approval checkpoint is the primary gate
- If human approves a logically wrong spec, downstream AI implements it correctly but uselessly

**Remaining gap:** Spec semantic validation (logic correctness, business-rule coherence) is a
fundamental limit of spec-driven development — not a CVF implementation gap. Documented as
`NATURAL_LIMIT` per `CVF_EDIT_ANALYSIS.md`.

**Advisory:** `specLogicErrorDetect: "NATURAL_LIMIT"` — structural check exists; semantic
validation is out of scope for governance framework.

---

### Scenario 3 — Agent Hallucination

**Source finding:** Agent imports non-existent library or calls wrong API endpoint.

**CVF coverage:** STRONG
- Task scope isolation: each agent handles 1 task → hallucination blast radius is small
- Review Agent checks: invalid imports, missing functions, logic mismatch
- Validation phase: test agent catches runtime errors
- EL-2 worker timeout catches hung execution from bad imports

**Remaining gap:** Auto-recovery from hallucination is `MEDIUM` — retry loop exists (EL-2)
but root-cause correction requires Review Agent feedback loop.

**Advisory:** `hallucinationContainment: "STRONG"` — task scope + review pipeline effective.

---

### Scenario 4 — Multi-Agent Conflict

**Source finding:** Two agents create `getUser()` and `fetchUser()` with duplicate functionality.

**CVF coverage:** PARTIAL
- Task Graph dependency rules reduce parallel conflicts
- Review Agent detects duplicate functionality
- No automated conflict resolution — human must merge or deprecate

**Remaining gap:** Conflict resolution (not just detection) requires a separate governed
implementation tranche. Current coverage: `conflict detect: MEDIUM`, `conflict resolve: LOW`.

**Advisory:** `multiAgentConflictDetect: "PARTIAL"` — detection via review pipeline; resolution
requires separate tranche. Eligible for separate runtime roadmap post-LHW.

---

### Scenario 5 — Project Scale Lớn

**Source finding:** 150 modules, 500 tasks → LLM context overflow, global architecture forgotten.

**CVF coverage:** MODERATE
- Task scope minimization: agent receives only task-relevant context
- `memory-context-packager.ts` (AIF-C) packages context per task
- LHW17 T3 advisory establishes context budget boundary

**Remaining gap:** Architecture stability at scale (`MEDIUM`) — drift still possible when
context packager cannot capture all cross-module dependencies. Addressed in LHW17 T3 advisory
and LHW18 T3 (context management strategy).

**Advisory:** `projectScaleStability: "MODERATE"` — context minimization exists; cross-module
architecture stability is a known open item for future context engine tranche.

---

## Summary Gap-Map Table

| Scenario | CVF Coverage | Advisory status | Open gap |
| --- | --- | --- | --- |
| 1 Agent phá architecture | STRONG — detect | `architectureViolationDetect: PARTIAL` | Auto-correct: `N/A_INTENTIONAL` |
| 2 Spec sai | LIMITED — structural only | `specLogicErrorDetect: NATURAL_LIMIT` | Semantic validation: out of scope |
| 3 Hallucination | STRONG — contain | `hallucinationContainment: STRONG` | Auto-recovery: MEDIUM |
| 4 Multi-agent conflict | PARTIAL — detect | `multiAgentConflictDetect: PARTIAL` | Resolution: separate tranche |
| 5 Project scale | MODERATE | `projectScaleStability: MODERATE` | Cross-module drift: LHW18 T3 |

---

## Advisory Readout Fields

```typescript
failureSimulationGapMapAdvisoryType: "cvf.failureSimulationGapMapAdvisory.lhw18.t1.v1"
failureScenarioAdvisory: {
  architectureViolationDetect: "STRONG" | "PARTIAL" | "WEAK"
  specLogicErrorDetect: "NATURAL_LIMIT"
  hallucinationContainment: "STRONG" | "PARTIAL" | "WEAK"
  multiAgentConflictDetect: "PARTIAL"
  projectScaleStability: "STRONG" | "MODERATE" | "WEAK"
  advisoryNote: string
}
```

## Related Artifacts

- GC-018: `docs/baselines/CVF_GC018_LHW18_CVF_EDIT_ABSORPTION_WAVE_2026-05-30.md`
- Source: `.private_reference/legacy/CVF Edit/Failure Simulation cho CVF.md`
- EL-2: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/worker-timeout-handler.ts`
- EL-3: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/reviewer-deadlock-handler.ts`
- Delta D2: `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/src/index.ts` (`humanInterventionRequired`)
- LHW17 T3: `docs/reference/CVF_LHW17_T3_LEARNING_PLANE_TRUTH_REPUTATION_ADVISORY_CONNECTOR_SPEC_2026-05-30.md`

## Claim Boundary

This spec is documentation-only advisory. It does not prove runtime failure handling
completeness, hosted readiness, production readiness, or public release readiness.
Multi-agent conflict resolution and architecture auto-correction are explicitly out of scope.

## Invariants

- `runtimeExecutionAuthorized=false`
- Risk model: R0-R3 (L0-L4 must NOT appear)
- No route.ts change
- No receipt-envelope extension
- No new failure handler code
- No public release readiness claim
