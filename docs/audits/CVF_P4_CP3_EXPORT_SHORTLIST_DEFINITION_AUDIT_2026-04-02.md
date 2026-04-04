# CVF P4 CP3 Audit - Export Shortlist Definition

Memory class: FULL_RECORD

> Decision type: `GC-019` structural/publication-planning audit
> Pre-public phase: `P4`
> Date: `2026-04-02`

---

## 1. Proposal

- Change ID:
  - `GC019-P4-CP3-EXPORT-SHORTLIST-DEFINITION-2026-04-02`
- Date:
  - `2026-04-02`
- Proposed target:
  - define a first-wave shortlist inside the existing `PUBLIC_EXPORT_CANDIDATE` pool
  - stop treating all candidates as equally near-term
- proposed outputs:
  - one canonical shortlist reference for first-wave export candidates
  - one explicit hold list for broader or less package-shaped candidates
  - one rule that the shortlist still means `NEEDS_PACKAGING`, not `READY_FOR_EXPORT`
- proposed change class:
  - `boundary-definition / prioritization refinement`

## 2. Scope

- in scope:
  - select a first-wave shortlist from current `PUBLIC_EXPORT_CANDIDATE` extensions
  - explain why these candidates are earlier than the others
  - define deferred candidate groups
- out of scope:
  - any package publication
  - changing `exportReadiness`
  - code changes inside extensions
  - package manifest edits

## 3. Source-Truth Context

- the extension registry currently marks `14` extensions as `PUBLIC_EXPORT_CANDIDATE`
- all of them are still either:
  - `NEEDS_PACKAGING`
  - or `CONCEPT_ONLY`
- the multi-agent intake review already warned that this candidate pool varies drastically in maturity
- after `P4/CP2`, the docs-mirror lane is now bounded, so the next safe refinement is export prioritization rather than broad export planning

## 4. Selection Heuristic

- prioritize candidates that already look closer to standalone package units:
  - explicit package identity
  - narrower conceptual scope
  - obvious standalone API story
  - lower coupling than the large plane foundations
- de-prioritize for first wave:
  - concept-only facade layers
  - broad multi-contract foundations
  - merged surfaces that still read as larger packaging programs rather than one bounded export

## 5. Recommended Shortlist

- first-wave shortlist:
  - `CVF_GUARD_CONTRACT`
  - `CVF_v3.0_CORE_GIT_FOR_AI`
  - `CVF_v1.7.3_RUNTIME_ADAPTER_HUB`
- rationale:
  - all three already present as package-shaped units with explicit package names
  - they are easier to narrate as selective exports than the larger plane foundations
  - they appear more bounded than the broad coordination foundations or concept-only facade layer

## 6. Deferred Groups

- defer group A:
  - large foundation families:
    - `CVF_CONTROL_PLANE_FOUNDATION`
    - `CVF_EXECUTION_PLANE_FOUNDATION`
    - `CVF_GOVERNANCE_EXPANSION_FOUNDATION`
    - `CVF_LEARNING_PLANE_FOUNDATION`
  - reason:
    - exportable later, but likely require broader packaging and support commitments
- defer group B:
  - medium package candidates still needing boundary clarification:
    - `CVF_AGENT_DEFINITION`
    - `CVF_AGENT_LEDGER`
    - `CVF_MODEL_GATEWAY`
    - `CVF_POLICY_ENGINE`
    - `CVF_TRUST_SANDBOX`
    - `CVF_v1.7.1_SAFETY_RUNTIME`
    - `CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY`
  - reason:
    - plausible candidates, but first-wave priority is lower than the shortlist above
- defer group C:
  - `CVF_PLANE_FACADES`
  - reason:
    - current registry truth is `CONCEPT_ONLY`

## 7. Risk Assessment

- no shortlist:
  - `MEDIUM`
  - later packaging work will remain too broad and ambiguous
- small prioritized shortlist:
  - `LOW`
  - keeps the next export-planning wave bounded and reviewable
- attempting all `PUBLIC_EXPORT_CANDIDATE` extensions together:
  - `HIGH`
  - would create a packaging program, not one manageable packet

## 8. Recommendation

- recommended outcome:
  - `APPROVE P4/CP3`
- rationale:
  - export planning now has a concrete first wave
  - the shortlist stays consistent with current registry truth
  - this avoids the false signal that every export candidate is equally near-term

## 9. Execution Posture

- audit decision:
  - `AUDIT READY`
- ready for independent review:
  - `YES`
- notes:
  - this packet prioritizes candidates only
  - it does not authorize publication or package release
