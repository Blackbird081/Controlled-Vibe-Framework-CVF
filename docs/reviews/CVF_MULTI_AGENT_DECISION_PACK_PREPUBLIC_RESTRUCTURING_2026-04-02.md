# CVF Multi-Agent Decision Pack — Pre-Public Repository Restructuring

Memory class: FULL_RECORD

> Review mode: `MULTI_AGENT_DECISION_PACK`
> Purpose: final canonical decision pack for pre-public restructuring preparation after intake review and rebuttal are complete
> Decision posture: accept `P0-P2 + GC-039` as the current governed preparation baseline while keeping `P3-P5` blocked pending later authorization

---

## 1. Decision Scope

- Decision pack ID: `PREPUBLIC_RESTRUCTURING_DECISION_PACK_2026-04-02`
- Date: `2026-04-02`
- Intake review: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- Rebuttal packet: `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md`

Scope note:

- this decision pack is the canonical `GC-027` step 3 artifact for the current pre-public restructuring debate
- it does **not** authorize physical relocation
- it only freezes the preparation baseline that later `P3` discussion must start from

## 2. Decision Matrix

- candidate:
  - `Candidate A` — accept `P0-P2` lifecycle and exposure classification as the current baseline
- current decision: `GO`
- why:
  - lifecycle classification, exposure classification, root-file exposure, phase-gate closure, and publication posture are now explicit and machine-enforced
  - this is the correct minimum baseline before any structural move can be discussed safely

- candidate:
  - `Candidate B` — accept `GC-039` as the canonical pre-public `P3` readiness gate
- current decision: `GO`
- why:
  - `GC-039` closes the five intake-review findings and gives one machine-checked readiness boundary for later relocation waves
  - it is preparation governance, not movement authorization

- candidate:
  - `Candidate C` — open `P3` structural relocation now
- current decision: `HOLD`
- why:
  - the current package intentionally stops at preparation
  - physical movement still needs a fresh `GC-019` packet, explicit move scope, and a target publication model rationale

- candidate:
  - `Candidate D` — choose a final publication model now
- current decision: `HOLD`
- why:
  - the current work correctly ranks models and sets a private-by-default posture, but does not yet authorize which model CVF will actually ship under
  - that decision should be made closer to a real `P3/P4` wave

## 3. Pass Conditions

- condition 1:
  - `P0`, `P1`, and `P2` must remain `CLOSED` in `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`
- condition 2:
  - every visible root file must remain classified in `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json`
- condition 3:
  - every `PUBLIC_DOCS_ONLY` root must keep an explicit `publicContentAuditStatus`
- condition 4:
  - every `PUBLIC_EXPORT_CANDIDATE` extension must keep an explicit `exportReadiness`
- condition 5:
  - `P3` may proceed only if a fresh `GC-019` structural packet is opened and `GC-039` passes for that proposal context
- condition 6:
  - no agent may treat `PUBLIC_DOCS_ONLY` or `PUBLIC_EXPORT_CANDIDATE` as implicit approval for publication
- condition 7:
  - the publication decision memo must be re-read by `2026-05-01` or earlier if a concrete `P3` packet is drafted first

## 4. Canonical Ownership Map

- concept:
  - pre-public restructuring preparation
- keep:
  - `P0-P2` as the current preparation baseline
  - private-by-default publication posture
  - lifecycle and exposure classification as separate authority layers
- retire:
  - any assumption that folder cleanup alone is enough to decide publication or movement
- owner:
  - repository-level governance authority through `GC-037`, `GC-038`, and `GC-039`

- concept:
  - `P3` structural relocation
- keep:
  - blocked posture until explicit later authorization
  - move-scope-specific governance under `GC-019`
- retire:
  - any idea that `GC-039` by itself authorizes relocation
- owner:
  - future structural relocation packet only

- concept:
  - publication model choice
- keep:
  - ranked options and recommendation order from the publication memo
- retire:
  - any idea that current classification already settles the final product distribution model
- owner:
  - later publication decision wave, not the current preparation batch

## 5. Execution Order

- step 1:
  - accept this decision pack as the canonical `GC-027` convergence point for pre-public restructuring preparation
- step 2:
  - keep `P0-P2` and `GC-039` as the required baseline for any future relocation proposal
- step 3:
  - do not move folders yet
- step 4:
  - when the user decides timing is right, draft one bounded `GC-019` packet for the proposed `P3` move set
- step 5:
  - re-run `GC-039` and re-read the publication memo against that concrete move set before any execution begins

## 6. Next Recommended Tranche

- next tranche:
  - none opened now
- gating control:
  - future `GC-019` only, scoped to the exact `P3` move proposal
- out-of-scope items:
  - physical relocation now
  - publication model lock-in now
  - public mirror creation now
  - module export packaging now

## 7. Evidence Ledger

- evidence 1: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:100`
- evidence 2: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:124`
- evidence 3: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:132`
- evidence 4: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:139`
- evidence 5: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:145`
- evidence 6: `docs/reviews/CVF_MULTI_AGENT_REBUTTAL_PREPUBLIC_RESTRUCTURING_2026-04-02.md:1`
- evidence 7: `docs/reference/CVF_PREPUBLIC_P3_READINESS.md:14`
- evidence 8: `docs/reference/CVF_PREPUBLIC_P3_READINESS.md:85`
- evidence 9: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:13`
- evidence 10: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:166`
- evidence 11: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:67`
- evidence 12: `docs/roadmaps/CVF_PREPUBLIC_REPOSITORY_RESTRUCTURING_ROADMAP_2026-04-02.md:130`
- evidence 13: `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json:1`
- evidence 14: `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json:1`
- evidence 15: `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json:1`
- evidence 16: `governance/toolkit/05_OPERATION/CVF_PREPUBLIC_P3_READINESS_GUARD.md:1`
