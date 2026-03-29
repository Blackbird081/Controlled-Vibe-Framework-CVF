# CVF GC-018 Continuation Candidate — W13-T1: Agent Definition Capability Batch Contract

Memory class: FULL_RECORD

> Date: 2026-03-30
> Wave: W13 — Tranche: T1
> Role: Agent Definition capability batch aggregation — extending the W12-T1 boundary contract with a governed batch output surface
> Decision baseline: `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`
> Planning baseline: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Checklist used: `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `W13-T1-AGENT-DEF-CAP-BATCH`
- Date: `2026-03-30`
- Parent roadmap / wave: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
- Proposed scope: create `AgentDefinitionCapabilityBatchContract` in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` — a governed batch contract that aggregates `CapabilityValidationResult[]` into a canonical batch summary (counts by validation status + dominant status)
- Continuation class: `REALIZATION` — extending the W12-T1 boundary contract output surface with the same batch aggregation pattern established by W9-T1 and W10-T1

---

## Quality-First Justification Block

- Active quality assessment: `docs/assessments/CVF_POST_W7_CONTINUATION_QUALITY_ASSESSMENT_2026-03-30.md`
- Weighted total: `8.45/10 — STRONG`
- Lowest dimension: `Maintainability 7.4/10` (CPF `index.ts` / `index.test.ts` size debt)
- Quality-first decision: `EXPAND_NOW`
- Higher-value reason: no dimension is below mandatory action threshold; W13-T1 adds one small dedicated file following established patterns and does not increase existing maintainability debt
- Quality protection commitments: dedicated test file per GC-023; no additions to `index.test.ts`; test partition registry entry added; strictly additive — zero existing contract restructuring

---

## Why Now

- W12-T1 (`AgentDefinitionBoundaryContract`) explicitly deferred batch contracts as the next wave: "Agent Definition consumer pipeline bridges (batch contracts) — out of scope for the boundary convergence wave; consumer pipelines follow the same staged pattern as W8-T1 and can be a subsequent wave if needed"
- `AgentDefinitionBoundaryContract` is now canonical (CLOSED DELIVERED 2026-03-29) and serves as the FIXED_INPUT for batch aggregation
- The batch pattern is fully established by W9-T1 (`RagContextEngineConvergenceBatchContract`) and W10-T1 (`ReputationSignalBatchContract`, `TaskMarketplaceBatchContract`) — no new governance design needed
- Without a batch surface, capability validation event streams cannot be canonically aggregated — any multi-agent audit or monitoring surface must implement ad-hoc aggregation instead

---

## Active-Path Impact

`LIMITED` — adds one new contract to CPF; no changes to existing contracts, no schema restructuring, no cross-plane boundary changes

---

## Risk If Deferred

Future multi-agent orchestration work that needs to analyze capability validation patterns across multiple agents has no canonical batch aggregation anchor in the governance boundary layer; the gap grows as the agent capability validation surface expands

---

## Lateral Alternative Considered

`NO` — there is no lateral alternative for a governed batch aggregation of `CapabilityValidationResult[]`; ad-hoc aggregation in consumer code is not a governed surface and cannot serve as a canonical reference

---

## Real Decision Boundary Improved

`YES` — establishes `AgentDefinitionCapabilityBatchContract` as the canonical aggregation surface for capability validation streams; any future multi-agent analysis layer can cite this as the authoritative batch governance anchor

---

## Expected Enforcement Class

`CONTRACT_AND_TEST_GATE` — TypeScript contract with dedicated test suite; enforced in CI

---

## Required Evidence If Approved

- `AgentDefinitionCapabilityBatchContract` canonical contract in CPF with dedicated test file (GC-023 compliant; not added to `index.test.ts`)
- Export added to `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
- Test partition entry in `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- Full Lane audit: `docs/audits/CVF_W13_T1_CP1_AGENT_DEF_CAP_BATCH_AUDIT_2026-03-30.md`
- Full Lane review: `docs/reviews/CVF_GC019_W13_T1_CP1_AGENT_DEF_CAP_BATCH_REVIEW_2026-03-30.md`
- Delta: `docs/baselines/CVF_W13_T1_CP1_AGENT_DEF_CAP_BATCH_DELTA_2026-03-30.md`
- All CPF tests pass (count increases from 2144)

---

## Depth Audit

- Risk reduction: `1` — capability batch gap is real; filling it prevents ad-hoc aggregation drift in multi-agent scenarios; not currently blocking but accumulates debt with agent surface expansion
- Decision value: `2` — extends the W12-T1 governance surface to its natural batch output layer; future multi-agent analysis has a typed governance anchor; closes the W12-T1 deferred item cleanly
- Machine enforceability: `2` — TypeScript contract with CI-enforced test suite; deterministic hash IDs; all enforcement is machine-verifiable
- Operational efficiency: `1` — provides a reusable canonical batch surface; reduces repeated ad-hoc aggregation in future consumer code
- Portfolio priority: `2` — explicitly deferred by W12-T1; clean and bounded; follows the established batch extension pattern (W9-T1 → W10-T1 → W13-T1)
- Total: `8`
- Decision: `CONTINUE`
- Reason: total 8 exceeds CONTINUE threshold; no zero in Risk reduction, Decision value, or Machine enforceability; real decision boundary improvement; no lateral alternative; explicitly deferred item from W12-T1

---

## Authorization Boundary

- Authorized now: `YES`
- Next batch name: `W13-T1 — Agent Definition Capability Batch Contract`
- Reopen trigger: if the scope expands beyond `AgentDefinitionCapabilityBatchContract` (e.g., additional batch surfaces for `AgentScopeResolution[]` or `AgentDefinitionAudit[]`, or consumer pipeline bridges) the expanded scope requires a separate GC-018

---

## Ownership Map

- surface: `AgentDefinitionCapabilityBatchContract`
  - current owner: NONE — does not exist yet
  - action: `CREATE` — new governed batch contract in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.capability.batch.contract.ts`
  - target owner: W13-T1 packet

- surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
  - current owner: W12-T1 (last boundary contract export block)
  - action: `ADDITIVE EXPORT` — add W13-T1 export block
  - target owner: W13-T1 packet (additive, non-destructive)

- surface: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
  - action: `ADD ENTRY` — W13-T1 partition entry for `agent.definition.capability.batch.contract.test.ts`

- surface: `AgentDefinitionBoundaryContract`
  - current owner: W12-T1 (CLOSED DELIVERED)
  - action: `KEEP AS-IS` — fixed input; no changes
  - target owner: unchanged

---

## Not In This Wave

- item: batch contracts for `AgentScopeResolution[]` or `AgentDefinitionAudit[]`
  - reason: one batch surface per GC-018; additional batch surfaces can be a subsequent wave if governance evidence supports the need
- item: consumer pipeline bridges for agent definition (full pipeline wiring)
  - reason: pipeline bridges are a separate, larger scope requiring their own GC-018 with gateway contract declaration
- item: physical merge of `CVF_ECO_v2.3_AGENT_IDENTITY` into CPF
  - reason: permanently excluded per post-W7 roadmap baseline lock; coordination package pattern is approved
- item: merge of `CVF_v1.2_CAPABILITY_EXTENSION` (docs-only) into the contract
  - reason: capability docs are not runtime contracts; incorporating them requires a separate governed wave
- item: L0-L4 risk-model migration
  - reason: permanently excluded per post-W7 roadmap baseline lock
- item: any changes to `AgentDefinitionBoundaryContract` or any other existing CPF contracts
  - reason: this wave is additive only; existing contracts are fixed inputs

---

## Dependency Declaration

- wave: W13-T1
- family: Agent Definition Capability Batch Contract

Upstream dependencies:

- dep: W12-T1 — `AgentDefinitionBoundaryContract`
  - status: FIXED (CLOSED DELIVERED 2026-03-29)
  - consumed as: `CapabilityValidationResult` is the primary input type for the batch contract; `CapabilityValidationStatus` drives the count fields; contract is a FIXED_INPUT — no changes permitted
- dep: W9-T1 — `RagContextEngineConvergenceBatchContract` (batch pattern reference)
  - status: FIXED (CLOSED DELIVERED 2026-03-29)
  - consumed as: reference batch contract pattern (`batchId ≠ batchHash`, `dominantX` field, `now` injection)
- dep: W10-T1 — `ReputationSignalBatchContract`, `TaskMarketplaceBatchContract` (batch pattern reference)
  - status: FIXED (CLOSED DELIVERED 2026-03-29)
  - consumed as: additional confirmation of the batch pattern (counts by enum class + dominant field)

Downstream dependents:

- dep: any future multi-agent orchestration or capability audit wave
  - dependency type: SOFT — `AgentDefinitionCapabilityBatchContract` will serve as the canonical aggregation anchor; not blocking any current work

W7 chain impact assessment:

- chain link: Runtime → NONE (no changes to runtime schema)
- chain link: Artifact → NONE
- chain link: Trace → NONE
- chain link: Planner → NONE
- chain link: Decision → NONE
- chain link: Eval-Builder → NONE
- chain link: Memory → NONE

Non-destabilization posture:
- rollback strategy: new contract file can be deleted; index.ts export block can be removed; no existing code changed
- destabilization threshold: ZERO — additive only; no existing contract restructured

Gateway contract declaration (G7):
- AI Gateway surfaces: NONE — this contract is a batch aggregator in the governance boundary layer, not in the AI Gateway request path
- Knowledge Layer surfaces: NONE — capability validation does not touch knowledge query surfaces

---

## Pass Conditions Compliance

| Condition | Status | Notes |
|---|---|---|
| 1 — no omnibus wave; one family per GC-018 | SATISFIED | capability batch contract only |
| 2 — W7 schema impact assessment | SATISFIED | all chain links NONE |
| 3 — Agent Definition excluded from first wave unless blocking proof | SATISFIED | W12-T1 closed the first Agent Definition wave; this is the explicitly authorized follow-on |
| 4 — gateway surfaces frozen or justified | SATISFIED | no gateway surfaces in scope |
| 5 — gateway stability declared | SATISFIED | W8-T1 + W9-T1 closed; gateway stability confirmed |
| 6 — no performance numbers as baseline truth | SATISFIED | no performance claims |
| 7 — keep/retire/merge-into ownership map included | SATISFIED | Ownership Map above |
| 8 — L0–L4 migration out of scope | SATISFIED | excluded |
| 9 — next decision cycle within 7 calendar days | SATISFIED | packet issued 2026-03-30 |
