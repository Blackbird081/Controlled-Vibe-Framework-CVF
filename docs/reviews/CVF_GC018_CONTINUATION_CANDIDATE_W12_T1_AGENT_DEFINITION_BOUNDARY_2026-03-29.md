# CVF GC-018 Continuation Candidate — W12-T1: Agent Definition Boundary Convergence

Memory class: FULL_RECORD

> Date: 2026-03-29
> Wave: W12 — Tranche: T1
> Role: Agent Definition boundary contract — closing the last PARTIAL item in the whitepaper merge map
> Decision baseline: `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md`
> Planning baseline: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Checklist used: `docs/reference/CVF_POST_W7_GC018_DRAFTING_CHECKLIST.md`

---

## GC-018 Continuation Candidate

- Candidate ID: `W12-T1-AGENT-DEFINITION-BOUNDARY`
- Date: `2026-03-29`
- Parent roadmap / wave: `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
- Proposed scope: create `AgentDefinitionBoundaryContract` in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION` — a governed boundary contract that establishes canonical agent definition authority: definition registration, capability scope validation, scope resolution, and definition audit
- Continuation class: `REALIZATION` — converting the existing coordination package (`CVF_AGENT_DEFINITION`) into a canonically governed boundary contract following the W8-T1 pattern (`TrustIsolationBoundaryContract` / `ModelGatewayBoundaryContract`)

### Why Now

- All prerequisite boundary contracts are now in place: W8-T1 (TrustIsolation + ModelGateway), W9-T1 (RagContextEngine), W10-T1 (ReputationSignal + TaskMarketplace) — CLOSED DELIVERED 2026-03-29
- `AgentDefinitionBoundaryContract` was explicitly deferred until "second wave after boundary work is done" in the post-W7 decision pack; that condition is now satisfied
- The whitepaper merge map (v3.1-W10T1) shows `Agent Definition` as the only remaining `PARTIAL / PROPOSAL` item; all other surfaces are `SUBSTANTIALLY DELIVERED` or `DONE`
- Without a governed boundary contract, agent identity and capability scope remain informally declared through a coordination re-export package rather than a typed, auditable governance record
- The `CVF_AGENT_DEFINITION` module already exists as a coordination umbrella; this wave adds the boundary contract layer on top of that foundation

### Active-Path Impact

`LIMITED` — adds a new contract to CPF; no changes to existing contracts, no schema restructuring, no cross-plane boundary changes

### Risk If Deferred

Any future multi-agent orchestration expansion that requires formal agent capability scope validation will have no canonical governance boundary to reference; the gap will grow as the agent surface expands

### Lateral Alternative Considered

`NO` — there is no lateral alternative for a governed agent definition boundary; the coordination package alone is insufficient because it does not provide typed governance records

### Real Decision Boundary Improved

`YES` — establishes `AgentDefinitionBoundaryContract` as the canonical reference for agent authority; future multi-agent work can cite it as the authoritative governance surface for agent capability scope

### Expected Enforcement Class

`CONTRACT_AND_TEST_GATE` — TypeScript contract with dedicated test suite; enforced in CI

### Required Evidence If Approved

- `AgentDefinitionBoundaryContract` canonical contract in CPF
- Dedicated test file (GC-023 compliant; not added to index.test.ts)
- Export added to `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
- Test partition entry in `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
- All tests pass (CPF test count increases from 2110)

---

## Depth Audit

- Risk reduction: `1` — agent definition boundary gap is real; filling it prevents governance drift in multi-agent scenarios; not currently blocking but important for future expansion
- Decision value: `2` — closes the last PARTIAL item in the whitepaper merge map; establishes canonical agent authority boundary; future waves referencing agent scope have a typed governance anchor
- Machine enforceability: `2` — TypeScript contract with CI-enforced test suite; deterministic hash IDs; all enforcement is machine-verifiable
- Operational efficiency: `1` — creates an explicit reference point for agent capability scope validation; reduces ambiguity in future multi-agent implementations
- Portfolio priority: `2` — last PARTIAL item in the merge map; closes the gap that has been consistently deferred since the original whitepaper; clean portfolio closure
- Total: `8`
- Decision: `CONTINUE`
- Reason: total 8 exceeds CONTINUE threshold; no zero in Risk reduction, Decision value, or Machine enforceability; real decision boundary improvement; no lateral alternative exists; last PARTIAL item in canonical architecture document

---

## Authorization Boundary

- Authorized now: `YES`
- Next batch name: `W12-T1 — Agent Definition Boundary Convergence`
- Reopen trigger: if the scope expands beyond `AgentDefinitionBoundaryContract` (e.g., physical module merge, L0-L4 migration, capability docs restructuring) the expanded scope requires a separate GC-018

---

## Ownership Map

- surface: `AgentDefinitionBoundaryContract`
  - current owner: NONE — does not exist yet
  - action: `CREATE` — new governed boundary contract in `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.definition.boundary.contract.ts`
  - target owner: W12-T1 packet

- surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
  - current owner: W8-T1 (last boundary contract export block)
  - action: `ADDITIVE EXPORT` — add W12-T1 export block
  - target owner: W12-T1 packet (additive, non-destructive)

- surface: `EXTENSIONS/CVF_AGENT_DEFINITION/`
  - current owner: B* Merge 2 coordination package
  - action: `KEEP AS-IS` — coordination package continues to exist; `AgentDefinitionBoundaryContract` is a new governance layer added alongside it, not a replacement
  - target owner: unchanged

- surface: `governance/compat/CVF_TEST_PARTITION_OWNERSHIP_REGISTRY.json`
  - action: `ADD ENTRY` — W12-T1 partition entry for `agent.definition.boundary.contract.test.ts`

---

## Not In This Wave

- item: physical merge of `CVF_ECO_v2.3_AGENT_IDENTITY` into CPF
  - reason: the coordination package pattern is the approved execution form; physical consolidation would require a separate restructuring GC-018
- item: merge of `CVF_v1.2_CAPABILITY_EXTENSION` (docs-only) into the contract
  - reason: capability docs are not runtime contracts; incorporating them requires a separate governed wave
- item: L0-L4 risk-model migration
  - reason: permanently excluded per post-W7 roadmap baseline lock
- item: Agent Definition consumer pipeline bridges (batch contracts)
  - reason: out of scope for the boundary convergence wave; consumer pipelines follow the same staged pattern as W8-T1 and can be a subsequent wave if needed
- item: any changes to `TrustIsolationBoundaryContract`, `ModelGatewayBoundaryContract`, or other existing CPF contracts
  - reason: this wave is additive only; existing boundary contracts are fixed inputs

---

## Dependency Declaration

- wave: W12-T1
- family: Agent Definition Boundary Convergence

Upstream dependencies:
- dep: W8-T1 — Trust/Isolation + Model Gateway Boundary
  - status: FIXED (CLOSED DELIVERED 2026-03-29)
  - consumed as: prerequisite boundary pattern; `TrustIsolationBoundaryContract` and `ModelGatewayBoundaryContract` as reference implementations
- dep: W9-T1 — RAG + Context Engine Convergence
  - status: FIXED (CLOSED DELIVERED 2026-03-29)
  - consumed as: confirmed that gateway assumptions are stable before agent definition scope is added
- dep: W11-T1 — Whitepaper v3.1-W10T1
  - status: FIXED (CLOSED DELIVERED 2026-03-29)
  - consumed as: updated whitepaper baseline that identifies Agent Definition as the last PARTIAL item

Downstream dependents:
- dep: any future multi-agent orchestration wave that requires agent capability scope validation
  - dependency type: SOFT — `AgentDefinitionBoundaryContract` will be the canonical governance anchor for future agent-scoped waves; not blocking any current work

W7 chain impact assessment:
- chain link: Runtime → NONE (no changes to runtime schema)
- chain link: Artifact → NONE
- chain link: Trace → NONE
- chain link: Planner → NONE
- chain link: Decision → NONE
- chain link: Eval/Builder → NONE
- chain link: Memory → NONE

Non-destabilization posture:
- rollback strategy: new contract file can be deleted; index.ts export block can be removed; no existing code changed
- destabilization threshold: ZERO — additive only; no existing contract restructured

Gateway contract declaration (G7):
- AI Gateway surfaces: NONE — this contract is in the governance boundary layer, not the AI Gateway request path
- Knowledge Layer surfaces: NONE — agent definition does not touch knowledge query surfaces

---

## Pass Conditions Compliance

| Condition | Status | Notes |
|---|---|---|
| 1 — no omnibus wave; one family per GC-018 | SATISFIED | agent definition boundary only |
| 2 — W7 schema impact assessment | SATISFIED | all chain links NONE |
| 3 — Agent Definition excluded from first wave unless blocking proof | SATISFIED | this IS the Agent Definition wave, now that all prerequisites are met |
| 4 — gateway surfaces frozen or justified | SATISFIED | no gateway surfaces in scope |
| 5 — gateway stability declared | SATISFIED | W8-T1 + W9-T1 closed; gateway stability confirmed |
| 6 — no performance numbers as baseline truth | SATISFIED | no performance claims |
| 7 — keep/retire/merge-into ownership map included | SATISFIED | Ownership Map above |
| 8 — L0–L4 migration out of scope | SATISFIED | excluded |
| 9 — next decision cycle within 7 calendar days | SATISFIED | packet issued 2026-03-29 |
