# CVF Product Value Validation Guard

**Control ID:** `GC-042`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active canonical rule for proving or rejecting CVF product value before heavy capability expansion or stronger value claims.
**Applies to:** all humans and AI agents drafting product-value validation corpora, rubrics, run manifests, assessments, or using product-value claims to justify heavyweight capability work.
**Enforced by:** `governance/compat/check_product_value_validation_guard_compat.py`

## Purpose

- stop CVF from claiming product value based on code volume, test counts, demos, or polished narrative alone
- standardize one comparable evidence chain for product-value proof across future waves
- prevent heavyweight capability work, such as Docker sandbox, from being treated as urgent without stronger value evidence or an explicit external trigger

## Rule

When CVF wants to do any of the following:

- claim that CVF has proven user-facing product value
- compare CVF against a simpler non-CVF baseline
- use product-value evidence to justify a heavyweight capability tranche
- argue that Docker sandbox or similar runtime expansion is now required for user value

the canonical evidence chain must use one standardized validation structure.

### Required Validation Chain

The canonical chain must include:

1. frozen corpus packet
2. frozen rubric packet
3. governed run manifest
4. final governed assessment

Canonical starter templates:

- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`

Canonical planning anchor:

- `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`

### Minimum Evidence Discipline

The canonical product-value chain must preserve these rules:

- comparison is mandatory; CVF cannot be judged in isolation
- at least one simpler direct baseline must be included
- provider-hub validation and controlled value attribution must be distinguished, not blended into one vague score
- when scope includes multiple enabled providers, each admitted `provider + model` configuration should be treated as a governed run lane
- any claim that CVF is a model-agnostic hub must be supported by evidence across multiple run lanes; a single-lane result is scope-limited only
- corpus and rubric must be frozen before scored runs begin
- difficult or embarrassing tasks may not be removed after results are seen
- human-reviewed scoring outranks self-scoring
- red-line failures remain visible in the final assessment
- the final assessment must report `PASS`, `PARTIAL`, or `FAIL` without spin

### Anti-Vanity Rule

The following are forbidden as primary proof of product value:

- unit-test volume
- benchmark-harness existence alone
- self-evaluation from the model
- a single composite score with no gated breakdown
- cherry-picked demos
- summary claims with no raw trace-backed evidence chain

### Docker Sandbox Decision Rule

`Docker sandbox` remains deferred-by-default unless at least one of these is evidenced through product-value validation or an explicit external requirement:

- bounded code execution is necessary in multiple scenario families to achieve acceptable outcomes
- the current non-sandbox path cannot meet safety or usefulness expectations for code-execution workloads
- external compliance, enterprise, or operational requirements reject the current posture

Architectural neatness alone is not a sufficient trigger.
Ordinary provider-hub validation does not require Docker by default.

## Enforcement Surface

- repo-level compatibility enforcement runs through `governance/compat/check_product_value_validation_guard_compat.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

The compatibility gate verifies that:

- the canonical guard, roadmap, templates, policy, matrix, bootstrap, and docs index remain aligned
- changed product-value validation docs keep their required sections
- the guard chain does not drift into a weaker or more cosmetic evidence model

## Related Artifacts

- `docs/roadmaps/CVF_PRODUCT_VALUE_VALIDATION_WAVE_ROADMAP_2026-04-11.md`
- `docs/roadmaps/CVF_POST_W64_NEXT_CAPABILITY_WAVE_ROADMAP_2026-04-10.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_CORPUS_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUN_MANIFEST_TEMPLATE.md`
- `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_ASSESSMENT_TEMPLATE.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## Final Clause

If CVF cannot prove value under a skeptical comparative review, it has not yet earned the right to claim that value as canon.
