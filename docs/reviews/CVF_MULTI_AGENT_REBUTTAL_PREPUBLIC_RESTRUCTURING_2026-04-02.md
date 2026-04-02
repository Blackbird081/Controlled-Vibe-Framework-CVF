# CVF Multi-Agent Rebuttal — Pre-Public Repository Restructuring

Memory class: FULL_RECORD

> Review mode: `MULTI_AGENT_REBUTTAL`
> Perspective: canonical rebuttal and confirmation packet responding to the independent intake review before any `P3` relocation authorization is considered
> Purpose: confirm which intake-review findings are accepted, record what was changed, and close ambiguity before later structural movement is proposed

---

## 1. Rebuttal Scope

- Rebuttal ID: `PREPUBLIC_RESTRUCTURING_REBUTTAL_2026-04-02`
- Date: `2026-04-02`
- Intake review: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md`
- Rebuttal target:
  - the five required findings `C1-C5`
  - the decision posture `GO WITH FIXES`
  - the readiness boundary before any later `P3` relocation wave

## 2. Agree / Disagree Findings

- finding 1:
  - `C1` phase-gate absence between `P0`, `P1`, and `P2`
- verdict:
  - `AGREE`
- reason:
  - this was a real governance gap
  - it has now been closed by the machine-readable phase-gate registry at `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json`
  - `CVF_PREPUBLIC_P3_READINESS.md` now treats formal closure of `P0`, `P1`, and `P2` as a hard precondition before any `P3` discussion moves toward execution

- finding 2:
  - `C2` `PUBLIC_DOCS_ONLY` roots were not necessarily mirror-safe as-is
- verdict:
  - `AGREE`
- reason:
  - the original exposure label was too easy to over-read as “ready for public mirror”
  - the lifecycle/exposure system now distinguishes `PUBLIC_DOCS_ONLY` from `READY_FOR_PUBLIC_MIRROR` by requiring `publicContentAuditStatus`
  - current posture is explicitly `CURATION_REQUIRED` for `docs` and `public`

- finding 3:
  - `C3` `PUBLIC_EXPORT_CANDIDATE` extensions had no readiness distinction
- verdict:
  - `AGREE`
- reason:
  - the intake review correctly identified that “candidate” does not equal “ready”
  - the extension registry now requires `exportReadiness` with explicit values:
  - `READY_FOR_EXPORT`
  - `NEEDS_PACKAGING`
  - `CONCEPT_ONLY`
  - this removes the ambiguity before any public-module packaging wave is considered

- finding 4:
  - `C4` root-level files had no exposure classification
- verdict:
  - `AGREE`
- reason:
  - root files are part of the publication surface and needed separate treatment from directories
  - the new root-file registry at `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json` closes this gap
  - internal operational files remain `INTERNAL_ONLY`, while selected architecture-facing files are tracked as `PUBLIC_DOCS_ONLY`

- finding 5:
  - `C5` the publication memo lacked a decision or re-assessment boundary
- verdict:
  - `AGREE`
- reason:
  - stale classification is a real governance risk
  - the publication memo now declares `Re-assessment-By: 2026-05-01`
  - `CVF_PREPUBLIC_P3_READINESS.md` also points to this date as a live condition before `P3`

## 3. Evidence Ledger

- evidence 1: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:100`
- evidence 2: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:124`
- evidence 3: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:132`
- evidence 4: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:139`
- evidence 5: `docs/reviews/CVF_MULTI_AGENT_INTAKE_REVIEW_PREPUBLIC_RESTRUCTURING_2026-04-02.md:145`
- evidence 6: `governance/compat/CVF_PREPUBLIC_PHASE_GATE_REGISTRY.json:1`
- evidence 7: `governance/compat/CVF_ROOT_FILE_EXPOSURE_REGISTRY.json:1`
- evidence 8: `governance/compat/CVF_EXTENSION_LIFECYCLE_REGISTRY.json:1`
- evidence 9: `docs/reference/CVF_PREPUBLIC_P3_READINESS.md:1`
- evidence 10: `docs/reference/CVF_PREPUBLIC_PUBLICATION_DECISION_MEMO_2026-04-02.md:1`
- evidence 11: `governance/toolkit/05_OPERATION/CVF_PREPUBLIC_P3_READINESS_GUARD.md:1`
- evidence 12: `governance/compat/check_prepublic_p3_readiness.py:1`
- evidence 13: `governance/compat/run_local_governance_hook_chain.py:1`
- evidence 14: `.github/workflows/documentation-testing.yml:1`

## 4. Decision Overrides

- prior decision:
  - `GO WITH FIXES`
- override proposal: `GO`
- why:
  - the intake review was correct to stop short of full acceptance before the five findings were resolved
  - those findings have now been incorporated into canon through `GC-039`
  - therefore the restructuring preparation package is no longer merely “directionally sound”
  - it is now ready to be treated as a governed baseline for later `P3` discussion
  - this override does **not** authorize `P3`
  - it only upgrades `P0-P2 + readiness preparation` from “go with fixes” to “accepted with fixes incorporated”

## 5. Condition Delta

- keep:
  - `P3` remains blocked pending fresh structural authorization
  - `GC-019` is still required before any physical move wave
  - publication model selection must still happen deliberately and not as a side effect of cleanup
- add:
  - `GC-039` must pass before any future `P3` authorization packet is treated as ready for discussion
  - intake review + rebuttal + readiness doc must be read together before any structural relocation proposal is drafted
  - `PUBLIC_DOCS_ONLY` and `PUBLIC_EXPORT_CANDIDATE` must continue to be interpreted as preparatory classes, not implicit publication approval
- remove:
  - remove any assumption that folder cleanup alone makes a root public-safe
  - remove any assumption that `P0-P2` completion is enough by itself to authorize movement

## 6. Final Recommendation

- final recommendation:
  - accept the intake review findings in full
  - confirm that `GC-039` has absorbed the required fixes
  - treat `P0-P2` as canonically prepared and `P3` as explicitly blocked until a later structural packet is opened
- remaining disagreement:
  - none at the preparation layer
  - future disagreement, if any, should be scoped only to:
  - whether to open `P3`
  - what publication model `P3` is trying to support
  - which folders, if any, are safe to move under that model
- next governed move:
  - do not open physical relocation yet
  - when the user chooses the time, draft a fresh `GC-019` packet for the proposed `P3` move set and run `GC-039` against that proposal first
