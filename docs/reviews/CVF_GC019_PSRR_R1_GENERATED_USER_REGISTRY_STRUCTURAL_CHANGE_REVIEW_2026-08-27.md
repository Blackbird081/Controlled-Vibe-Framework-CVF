# CVF GC-019 PSRR-R1 Generated User Registry Structural Change Review

Memory class: public-structural-review

Status: APPROVED_BOUNDED

docType: review

Date: 2026-08-27

## Purpose

Review the structural effect of replacing the stale generated user registry
with the deterministic 62-source projection at public commit
`d35e84e2c87ffca36a85950249dd711746ac43c3`.

## Scope / Applies To

This review applies only to the generated `user-skills` record family, its
index, generator, and focused generator test. The separate `agent-skills`
family, validator policy, workflows, product source, dependencies, merge, and
deployment are outside scope.

## Target / Source

- Target: `governance/skill-library/registry/user-skills/`.
- Source: 62 committed `.skill.md` files under `EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS/`.
- Owner: `governance/skill-library/registry/generate_user_skills.py`.
- Hosted trigger evidence: Documentation & Testing run `33051764234`, job `98448751283`.

## 1. Review Context

- Review ID: PSRR-R1-GC019.
- Audit packet reviewed: PSRR-R1 roadmap, GC-018 baseline/work order, public commit `d35e84e2`, and hosted run `33051764234`.
- Reviewer role: independent orchestrator/reviewer.

## 2. Baseline Check

- Before PSRR-R1: 62 source skills and 335 generated USR records.
- After PSRR-R1: 62 source skills, 62 generated USR records, and 62 index entries.
- Governance posture: validator unchanged and fail-closed; no source skill was deleted.

## 3. Audit Quality Assessment

- Factual accuracy: source, record, index, link, and drift counts were recomputed locally.
- Completeness: all declared source paths reached a terminal read state.
- Consumer analysis: the unchanged validator and Markdown consumers read the generated records and index.
- Overlap classification: stale records are obsolete projections, not retained source authority.
- Rollback adequacy: the single public material commit is the rollback unit.

## 4. Change-Class Assessment

- Change class: generated-family structural reconciliation.
- Physical effect: 329 stale outputs removed, 56 current outputs added, six retained names regenerated, and one index regenerated.
- Reviewer decision: approve the generated-family replacement as one atomic owner-family change.

## 5. Consumer Analysis

- `validate_registry.py` requires exact source-to-record parity and resolving source links.
- `INDEX.md` consumers require a deterministic complete list of the current records.
- No runtime import, package entrypoint, provider call, secret, or deployment consumes these Markdown records during generation.
- The separate AGT failures remain visible and are not affected by this review.

## 6. Risk Assessment

- Structural risk: bounded to removal of manifest-stale generated USR outputs.
- Runtime risk: none identified; the family is documentation/governance metadata.
- Test and CI risk: exact parity improves the USR portion; overall registry CI remains blocked by AGT defects.
- Rollback risk: low and Git-reversible at commit granularity.
- Release risk: PR merge remains blocked until all required checks pass.

## 7. Verification Plan

- Run the 10 focused generator tests.
- Run generator `--check` and require zero drift.
- Require 62 source files, 62 records, 62 index entries, and zero broken USR source links.
- Run unchanged registry validation and preserve any AGT failure without suppression.
- Run public-sync preflight and exact-SHA hosted workflows.

## 8. Rollback Plan

- Rollback unit: public commit `d35e84e2c87ffca36a85950249dd711746ac43c3` plus this review commit if necessary.
- Trigger: any USR source-link, parity, deterministic-generation, or unrelated-file preservation failure.
- Method: a normal Git revert through the public branch review process.
- Success criterion: prior branch tree restored with no partial generated output.

## 9. Independent Findings

- PSRR-R1 needed reviewer repair to remove trailing whitespace rejected by public preflight.
- Atomic per-file replacement now has an induced `os.replace` failure regression.
- Hosted run `33051764234` proves the remaining registry errors are AGT-only.

## 10. Decision Recommendation

- Recommendation: APPROVE_BOUNDED.
- Rationale: the exact current user-skill projection is deterministic,
  Git-reversible, source-linked, and independently tested.
- Required before merge: separately resolve the AGT-family required-check
  blocker and obtain a fully green exact-SHA required-check set.

## Findings / Position

The generated USR structural reconciliation is accepted as
`APPROVE_BOUNDED`. It restores exact current-source parity without weakening
validation. It does not resolve or obscure the independently failing AGT
family.

## Risk / Corrective Action

The material risk is accidental deletion outside the generator-owned USR
pattern. The generator restricts deletion to manifest-stale
`USR-*.gov.md`, preserves unrelated files, renders the full desired manifest
before mutation, and uses atomic per-file replacement. Roll back the public
material commit if any declared USR invariant fails.

## Source Verification Block

| Claimed item | Claim type | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
|---|---|---|---|---|---|---|
| generator owns USR reconciliation | source owner | `governance/skill-library/registry/generate_user_skills.py` | manifest-plan-apply functions | `build_manifest`; `compute_plan`; `apply_manifest` | user registry generator | ACCEPT |
| validator requires user parity and links | acceptance contract | `governance/skill-library/registry/validate_registry.py` | user validation functions | `validate_user_skill`; `validate_index`; `main` | registry validator | ACCEPT |
| structural change requires review artifact | guard contract | `governance/compat/check_foundational_guard_surfaces.py` | structural change audit guard | `_check_structural_change_audit_guard` | foundational guard | ACCEPT |

## Checker Source Read-Ahead Block

| Field | Evidence |
|---|---|
| applicableCheckersRead | `governance/compat/check_foundational_guard_surfaces.py`; `governance/compat/check_markdown_structural_completeness.py`; `governance/compat/check_governed_artifact_authoring.py` |
| literalTokensReviewed | `GC019`; `APPROVE_BOUNDED`; `Source Verification Block`; `Public Export Disposition`; `Claim Boundary` |
| gateRunPurpose | confirmation of structural evidence after hosted failure inspection |
| claimBoundary | generated user-registry structure only; no overall CI-green claim |

## Agent Operation Trace Block

| Field | Evidence |
|---|---|
| Actor | independent orchestrator/reviewer |
| Provider or surface | public-sync clone and GitHub Actions evidence |
| Session or invocation | PSRR-R1 GC-019 closure repair, 2026-08-27 |
| Working directory | public-sync repository root |
| Command or tool surface | Git diff/status, generator tests/check, validator, preflight, hosted run/job inspection |
| Target paths | this GC-019 public review artifact |
| Allowed scope source | private PSRR-R1-SA1 amendment commit `aa7e401a2` |
| Before status evidence | public clean at pushed material commit `d35e84e2` |
| After status evidence | one pending public review artifact before commit |
| Diff evidence | `git diff --name-status` |
| Approval boundary | one review artifact and hosted rerun; no AGT repair or merge |
| Claim boundary | bounded structural approval only |
| Agent type | independent reviewer/closer |
| Invocation ID | `psrr-r1-gc019-public-review-2026-08-27` |
| Expected manifest | this one public review artifact |
| Actual changed set | this one public review artifact |
| Manifest delta | MATCH |

## Public Export Disposition

BLOCKED_MISSING_PUBLIC_ARTIFACTS

Reason: this review is pending its public commit and fresh exact-SHA hosted proof.

## Claim Boundary

This review approves only the bounded generated user-registry structural
reconciliation. It does not claim overall registry validation or CI success,
authorize AGT-family repair, or authorize merge, deployment, secrets,
providers, dependencies, or product changes.
