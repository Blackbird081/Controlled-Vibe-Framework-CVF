# CVF Post-W7 GC-018 Drafting Checklist

Memory class: POINTER_RECORD

> Purpose: drafting checklist for all post-W7 GC-018 continuation candidate packets — ensures consistent exclusion, dependency, and ownership discipline before any wave is authorized
> Authority: P0 governance hardening deliverable per `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md`
> Baseline: v3.0-W7T10

---

## Pre-Draft Gate

Before writing any GC-018 packet, confirm all of the following:

- [ ] GC-027 decision chain is complete: intake review → rebuttal → EA counter-review → decision pack
- [ ] `GC-032` governed artifact authoring standard is loaded before drafting begins
- [ ] `CVF_MAINTAINABILITY_STANDARD.md` is loaded if the proposed family touches public barrels, barrel smoke, shared batch helpers, or canonical summary surfaces
- [ ] Active quality assessment is loaded before drafting begins
- [ ] Quality-first posture is decided before scope drafting starts: `REMEDIATE_FIRST` or `EXPAND_NOW`
- [ ] Parent roadmap exists and is at SUMMARY_RECORD status
- [ ] Candidate family designation is confirmed (A | B | C | D)
- [ ] Wave and tranche numbers are assigned (W{N}-T{N})
- [ ] No omnibus continuation intent — this packet covers exactly one proposal family

---

## Required Sections Checklist

Every GC-018 packet for a post-W7 wave MUST include all sections below. Missing any section fails the corresponding gate.

### Packet Header (always required)
- [ ] Candidate ID — stable, unique (e.g., `W8-T1-CANDIDATE-A`)
- [ ] Date: `YYYY-MM-DD`
- [ ] Parent roadmap path
- [ ] Proposed scope: short description (one sentence)
- [ ] Continuation class: STRUCTURAL | VALIDATION_TEST | PACKAGING_ONLY | TRUTH_CLAIM | REALIZATION | MIXED | OTHER

### Justification Block (always required)
- [ ] Active quality assessment path declared
- [ ] Weighted total declared
- [ ] Lowest dimension declared
- [ ] Quality-first decision declared: `REMEDIATE_FIRST` | `EXPAND_NOW`
- [ ] If `EXPAND_NOW`: higher-value reason declared
- [ ] If `EXPAND_NOW`: quality protection commitments declared
- [ ] If `REMEDIATE_FIRST`: remediation target declared
- [ ] Why now — short justification referencing the canonical decision pack
- [ ] Active-path impact — NONE | LIMITED | MATERIAL
- [ ] Risk if deferred
- [ ] Lateral alternative considered — YES | NO
- [ ] Why not lateral shift
- [ ] Real decision boundary improved — YES | NO
- [ ] Expected enforcement class

### Depth Audit (always required — gate G1)
- [ ] Risk reduction: 0 | 1 | 2
- [ ] Decision value: 0 | 1 | 2
- [ ] Machine enforceability: 0 | 1 | 2
- [ ] Operational efficiency: 0 | 1 | 2
- [ ] Portfolio priority: 0 | 1 | 2
- [ ] Total: 0–10
- [ ] Decision: CONTINUE | REVIEW REQUIRED | DEFER
- [ ] Reason
- [ ] **Hard stop**: if Risk reduction = 0 OR Decision value = 0 OR Machine enforceability = 0 → Decision MUST be DEFER

### Ownership Map (always required — gate G2)
- [ ] keep / retire / merge-into map for all affected artifacts and contracts
- [ ] Explicit ownership transfer or retention statement per affected surface

### Exclusion Block (always required — gate G3)
- [ ] All permanent post-W7 exclusions declared (use `CVF_POST_W7_EXCLUSION_TEMPLATE.md`)
- [ ] Wave-specific additional exclusions declared
- [ ] Reviewer confirmation line included

### Dependency Declaration (always required — gate G4)
- [ ] Upstream dependencies listed with FIXED | IN_MOTION | UNKNOWN status
- [ ] Downstream dependents listed with blocking condition
- [ ] Use `CVF_POST_W7_DEPENDENCY_DECLARATION_PATTERN.md`

### W7 Chain Impact Assessment (required if touching Runtime/Artifact/Trace/Planner/Decision/Eval/Memory — gate G5)
- [ ] Each of the 7 chain links assessed: Runtime / Artifact / Trace / Planner / Decision / Eval-Builder / Memory
- [ ] Impact level per link: NONE | READ_ONLY | ADDITIVE | STRUCTURAL
- [ ] Non-destabilization posture declared

### Gateway Contract Declaration (required for Candidate A and any gateway-touching family — gate G7)
- [ ] AI Gateway contract surfaces that face the Knowledge Layer are explicitly stated
- [ ] Each surface declared as FIXED INPUT or IN SCOPE
- [ ] If in scope: justification for why that added scope is unavoidable

### Performance / Benchmark Constraint (required if touching performance numbers — gate G6)
- [ ] No benchmark numbers promoted to baseline truth before measurement evidence exists
- [ ] All performance numbers labeled PROPOSAL ONLY until Candidate C instrumentation evidence closes
- [ ] Any evidence cited as measured evidence keeps typed evidence and typed provenance fields instead of symbolic shorthand

### Authorization Boundary (always required)
- [ ] Authorized now: YES | NO
- [ ] If YES: next batch name
- [ ] If NO: reopen trigger condition

---

## Post-Draft Review Gate

Before submitting the GC-018 packet for authorization:

- [ ] Checklist above is fully satisfied
- [ ] Required evidence list is complete (artifacts + tests per phase)
- [ ] Packet file is in `docs/reviews/` with name `CVF_GC018_CONTINUATION_CANDIDATE_W{N}_T{N}_{SLUG}_{DATE}.md`
- [ ] GC-026 tracker sync is planned (not required until tranche is authorized and first CP begins)
- [ ] AGENT_HANDOFF.md updated with new tranche state

---

## Related Controls

- `docs/reference/CVF_POST_W7_EXCLUSION_TEMPLATE.md` — G3
- `docs/reference/CVF_POST_W7_DEPENDENCY_DECLARATION_PATTERN.md` — G4, G5
- `docs/reference/CVF_GOVERNED_ARTIFACT_AUTHORING_STANDARD.md` — authoring and evidence discipline
- `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md` — quality-first decision gate before fresh expansion
- `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md` — base template
- `docs/roadmaps/CVF_POST_W7_OPEN_TARGETS_UPGRADE_ROADMAP_2026-03-28.md` — gates G1–G8
- `docs/reviews/CVF_MULTI_AGENT_DECISION_PACK_POST_W7_OPEN_TARGETS_2026-03-28.md` — pass conditions 1–9
- `governance/toolkit/05_OPERATION/CVF_DEPTH_AUDIT_GUARD.md`
