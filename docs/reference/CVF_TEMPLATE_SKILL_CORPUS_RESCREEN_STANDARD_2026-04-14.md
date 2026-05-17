# CVF Template Skill Corpus Rescreen Standard
Memory class: POINTER_RECORD

> Date: 2026-04-14
> Class: REFERENCE / CORPUS_STANDARD / NON_CODER_VALUE
> Status: CANONICAL RESCREEN STANDARD — active quality authority under `GC-044`
> Authority: derived from active skill-intake governance + extended for current non-coder front-door quality

---

## 0. Purpose

This document defines the long-term standard for screening and re-screening skills and templates already present in CVF.

It is not a one-time benchmark helper.

It is intended to become the stable rule for deciding whether a skill/template is:

- good enough for the public non-coder front door
- trustworthy enough for product-value proof
- legacy but still tolerable
- no longer acceptable for front-door CVF use

Enforcement posture:

- this standard is now actively governed by `governance/toolkit/05_OPERATION/CVF_TEMPLATE_SKILL_STANDARD_GUARD.md`
- future repo-derived intake and future legacy-corpus re-screen both route through the same quality rule

---

## 1. Lineage And Source Authority

This standard extends, and does not replace, the earlier intake/governance rules:

1. `governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md`
   Key inheritance:
   - intake is mapping, not admiration
   - external capability must adapt to CVF, not the reverse
   - popularity and reputation are irrelevant
   - fit decision must be deterministic

2. `governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md`
   Key inheritance:
   - non-coder first
   - AI-executable, not human-technical
   - structured input/output discipline
   - domain alignment
   - duplicate rejection and template bridge requirements

3. `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
   Key inheritance:
   - external material enters CVF as bounded intake data
   - no external material sets its own governance outcome
   - provenance, source quality, and staged normalization matter

4. `docs/reference/CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md`
   Key inheritance:
   - no raw artifact rule
   - imported material must be compiled into governed form
   - learning/example material is not runtime authority

This standard adds one layer those older docs did not fully define:

- whether the current skill/template corpus is actually good enough for public-facing non-coder value

---

## 2. Core Principle

A skill/template is CVF-standard only if it helps a non-coder move toward a useful outcome **within CVF governance boundaries**, with a form that is clear enough to execute and a result shape that is auditable and repeatable.

Short form:

- outcome-first
- governance-compatible
- bounded-input
- actionable-output
- non-coder legible
- evidence-usable

Quantity is never proof of quality.

---

## 3. Two-Layer Screening Model

Every item must pass two layers.

### Layer A — Legacy CVF Intake Fit

This preserves the original CVF skill-intake logic.

Questions:

1. Does it provide unique value?
2. Does it fit a real CVF phase/workflow?
3. Can it be expressed as structured input -> output?
4. Does it belong to a real CVF domain?
5. Can AI execute it without requiring human technical skill?
6. Can its risk/authority boundary be mapped deterministically?

If any of the above is unknown, the item cannot become trusted.

### Layer B — Front-Door Non-Coder Product Fit

This is the newer layer for the current CVF public product direction.

Questions:

1. Is the intent immediately clear to a non-coder?
2. Are the inputs bounded enough to avoid low-signal outputs?
3. Is the expected output actually usable by a non-coder?
4. Does it fit current governance without awkward bypass pressure?
5. Is it free from legacy contamination strong enough to distort benchmark truth?
6. Does it belong in the public front door at all?

---

## 4. Measurable Screening Dimensions

Each item must be scored on the dimensions below.

Allowed values:

- `PASS`
- `MIXED`
- `FAIL`

| Dimension | What it measures | Main source lineage |
|---|---|---|
| Unique Value | not redundant with existing corpus | old skill-intake governance |
| Domain / Phase Fit | natural fit with CVF workflow and domain model | old skill-intake governance |
| Risk / Authority Fit | deterministic mapping to CVF governance boundaries | external skill intake |
| Input Discipline | quality of required fields and bounded form structure | old skill-intake governance + current front-door needs |
| Output Actionability | likelihood that a non-coder can act on the result | new non-coder product layer |
| Governance Compatibility | does not pressure CVF toward bypass or fake compliance | all lineages |
| Front-Door Suitability | should be visible in the main public non-coder path | new non-coder product layer |
| Legacy Contamination Risk | how much the item reflects pre-standard or imported low-confidence quality | current rescreen need |

---

## 5. Deterministic Classification Outcome

Each item must end in exactly one class:

| Class | Required condition |
|---|---|
| `TRUSTED_FOR_VALUE_PROOF` | no `FAIL`; legacy contamination not above `MIXED`; output actionability `PASS`; governance compatibility `PASS`; front-door suitability `PASS` |
| `REVIEW_REQUIRED` | no fatal governance conflict, but at least one important `MIXED` remains |
| `LEGACY_LOW_CONFIDENCE` | technically retained, but too weak for product-value proof |
| `REJECT_FOR_NON_CODER_FRONTDOOR` | governance mismatch, non-coder mismatch, or structurally poor artifact |

No other class is allowed.

---

## 6. Auto-Reject Conditions

An item must be classified `REJECT_FOR_NON_CODER_FRONTDOOR` immediately if any of the following is true:

- requires technical execution by the user
- has no meaningful structured output
- duplicates existing capability without defensible distinction
- encourages or depends on bypassing CVF governance
- is too vague to support bounded input -> output execution
- is visible to non-coders but fundamentally serves only internal/operator behavior

This inherits the old disqualification logic and tightens it for public product use.

---

## 7. Trusted-Subset Rule

Only items classified `TRUSTED_FOR_VALUE_PROOF` may be used for:

- non-coder benchmark tranches
- template output quality proof
- knowledge-native non-coder value proof
- future public-facing claims that CVF improves non-coder outcomes

Anything else may remain in the product temporarily, but may not be used as truth-bearing evidence.

---

## 8. What A CVF-Standard Skill/Template Looks Like

A skill/template counts as CVF-standard only if all of the following are true:

1. **Outcome-first**
   It drives a real result, not just explanation.

2. **Bounded inputs**
   It captures the minimum information needed for governed execution.

3. **Actionable outputs**
   A non-coder can use the result to move forward.

4. **Governance-compatible**
   It works naturally inside CVF risk, approval, and execution rules.

5. **Front-door legible**
   A non-coder can understand when to use it and what they will get.

6. **Evidence-usable**
   It is strong enough that benchmark results say something true about CVF, not just about a messy legacy artifact.

If any one of these fails materially, the item is not CVF-standard for the front door.

---

## 9. Relationship To Existing And Future Guards

This standard should feed:

- `CVF_TEMPLATE_SKILL_STANDARD_GUARD`
- `CVF_NON_CODER_VALUE_GUARD`
- corpus rescreen roadmaps
- benchmark tranche authorization
- future intake of external skills/templates

This is important:

- the standard applies to existing corpus re-screen
- and should also apply to future intake/adoption

So from this point onward, future adopted skills/templates should be evaluated against this standard instead of older intake rules alone.

The older rules remain necessary, but no longer sufficient by themselves for public non-coder use.

---

## 10. Required Artifact Output For Any Rescreen Wave

Any rescreen tranche using this standard must produce:

1. corpus inventory
2. per-item classification matrix
3. trusted subset freeze
4. legacy quarantine note
5. handoff sync

Without all five, the wave is incomplete.

---

## 11. Final Rule

CVF does not prove public non-coder value by having many templates or skills.

CVF proves public non-coder value only when the templates and skills that reach non-coders are:

- governance-fit
- non-coder-fit
- trustworthy enough to benchmark

That is the rule this standard exists to enforce.
