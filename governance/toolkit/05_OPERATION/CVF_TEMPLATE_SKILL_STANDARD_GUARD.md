# CVF Template Skill Standard Guard

**Control ID:** `GC-044`
**Guard Class:** `CONTINUITY_AND_DECISION_GUARD`
**Status:** Active canonical rule for skill/template intake quality, corpus re-screen quality, and trusted-subset admission for public non-coder value proof.
**Applies to:** all humans and AI agents importing skills from external repos, modifying front-door template/skill surfaces, drafting corpus re-screen packets, or using template/skill sets to justify public non-coder value claims.
**Enforced by:** `governance/compat/check_template_skill_standard_guard_compat.py`

## Purpose

- stop CVF from absorbing external skills or reusing legacy templates without a stable CVF-standard quality screen
- ensure template/skill quality is governed before benchmark truth or public non-coder value claims are allowed to rest on that corpus
- make the old intake rules durable for future reuse, while extending them to the stricter public non-coder front-door quality bar

## Rule

When CVF does any of the following:

- imports or normalizes a skill from another repo
- revises the front-door template/skill corpus used by non-coders
- re-screens legacy templates or mapped skills already present in CVF
- selects template/skill items for public value-proof tranches

the canonical quality rule must pass through one shared standard:

- `docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`

The earlier intake lineage remains mandatory, but no longer sufficient by itself:

- `governance/skill-library/specs/EXTERNAL_SKILL_INTAKE.md`
- `governance/toolkit/05_OPERATION/SKILL_INTAKE_GOVERNANCE.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_INTAKE_PROFILE.md`
- `docs/reference/CVF_W7_EXTERNAL_ASSET_COMPILER_GUIDE.md`

### Mandatory Canonical Outcomes

1. no skill/template may be admitted to the public non-coder front door unless it is screened against the canonical rescreen standard
2. no benchmark or value-proof tranche may use a corpus item unless that item is explicitly classified `TRUSTED_FOR_VALUE_PROOF`
3. skill/template quantity is never acceptable evidence of quality
4. external-repo reputation, popularity, or convenience may not substitute for deterministic CVF-standard classification
5. non-coder-facing skill/template surfaces must hide internal technical frames and emit an agent-ready spec/handoff packet instead of pushing implementation choices onto the user

### Legacy Alignment Rule

Legacy front-door skills/templates do **not** need to be mass-rewritten by default.

They are considered aligned to the new standard only when all three conditions are true:

1. the shared export/spec layer emits a governed non-coder packet
2. the shared execution/runtime layer injects the required hidden governance metadata without asking the user
3. the front-door audit/test surface confirms the linked template still meets the non-coder packet minimum

If any of the three conditions fails, the affected template/skill must be rewritten or downgraded from front-door use. This keeps the standard strict without creating unnecessary manual churn across the entire library.

### Silent Intake Is Forbidden

Future repo-derived skill/template intake must not happen as a silent code/content drop.

At minimum, a governed companion doc chain must exist in the same batch:

- updated corpus-quality roadmap / intake packet / assessment / review / baseline note
- handoff sync when the active front-door or trusted-subset posture changes

This guard intentionally keeps the enforcement bar high because corpus quality directly affects what non-coders experience as CVF quality.

### Scope Boundary

This guard DOES govern:

- skill/template quality for public non-coder use
- trusted-subset eligibility for benchmark truth
- future repo-derived skill/template intake quality
- legacy corpus re-screen quality

This guard does NOT govern:

- temporary provider freeze decisions
- model-choice policy for the current benchmark lane
- broader non-coder value proof as a whole

Provider freeze remains roadmap/execution policy, not a permanent guard invariant.

## Enforcement Surface

- repo-level compatibility enforcement runs through `governance/compat/check_template_skill_standard_guard_compat.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

The compatibility gate verifies that:

- the active guard, corpus standard, measurement standard, roadmap, policy, matrix, bootstrap, README surfaces, and handoff stay aligned
- future intake cannot silently drift back to pre-standard “absorb first, evaluate later”
- added skill/template surfaces are accompanied by a governed corpus-quality document trail in the same batch
- trusted-subset language remains explicit in benchmark-facing roadmaps and handoff truth

## Related Artifacts

- `docs/reference/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_STANDARD_2026-04-14.md`
- `docs/reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`
- `docs/roadmaps/CVF_TEMPLATE_SKILL_CORPUS_RESCREEN_ROADMAP_2026-04-14.md`
- `docs/roadmaps/CVF_NON_CODER_VALUE_REALIZATION_ROADMAP_2026-04-14.md`
- `docs/reference/CVF_NON_CODER_VALUE_GUARD_PROPOSAL_2026-04-14.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`

## Final Clause

If a skill or template has not passed a deterministic CVF-standard quality screen, it has not earned the right to shape what non-coders experience as CVF truth.
