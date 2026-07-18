# CVF Capability Intake Pipeline Guard

Memory class: GOVERNANCE_GUARD

Status: ACTIVE_GUARD
Date: 2026-05-22
Owner: CVF Governance Kernel

## Purpose
This guard defines the minimum certification surface for end-user skill packs before they may be treated as CVF-certified product capability packs.

## Scope / Target / Owner Boundary
In scope: static CVF-certified skill-pack intake artifacts, schema validation, and deterministic certification rejection reasons.

Out of scope: provider execution, runtime routing, receipt-envelope changes, durable memory, public publishing, hosted readiness, and public repository synchronization.

Owner: CVF governance/session-continuity surface.

## Rule
A pack is CVF-certified only when all eight required artifacts exist and pass their corresponding schema checks.

## Required Certification Artifacts
Each certified pack MUST contain exactly these eight governed artifacts:

1. `skill.meta.json`
2. `risk.profile.json`
3. `authority.scope.json`
4. `execution.boundary.json`
5. `receipt.schema.json`
6. `workflow.binding.json`
7. `workflow.spec.md`
8. `failure.recovery.md`

A `README.md` may be included for human navigation, but it is not a certification artifact.

## Acceptance Rule
A pack is certified only when `scripts/validate_skill_pack_certification.py <pack-dir>` returns `PASS` and all eight artifacts pass their corresponding schema checks.

## Rejection Rule
A pack MUST be rejected when any artifact is missing, invalid JSON, missing a required markdown section, or violates its schema. The validator must emit deterministic JSON and a named rejection reason.

## Enforcement Surface
The enforcement surface is `scripts/validate_skill_pack_certification.py` using schemas under `governance/schemas/skill-pack/`.

## Related Artifacts
- `docs/roadmaps/archive/CVF_REVIEW_CVF_PAIN_POINT_DELIVERY_GAP_ROADMAP_V2_2026-05-22.md`
- `docs/work_orders/archive/CVF_WO_T1_CAPABILITY_INTAKE_PIPELINE_2026-05-22.md`
- `docs/baselines/archive/CVF_GC018_T1_CAPABILITY_INTAKE_PIPELINE_2026-05-22.md`
- `docs/reviews/archive/CVF_T1_CAPABILITY_INTAKE_PIPELINE_COMPLETION_2026-05-22.md`

## Boundary
This guard certifies static pack readiness only. It does not invoke providers, create runtime routes, persist memory, publish public-facing material, or claim hosted readiness.

## Final Clause
Certification is static and local to the pack directory. Any runtime execution, provider behavior, memory wiring, hosted readiness, or public-facing claim requires a separate authorized tranche and evidence packet.
