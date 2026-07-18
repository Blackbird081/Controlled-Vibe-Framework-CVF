# CVF Governed Pack Contract Guard

Memory class: POINTER_RECORD

Status: ACTIVE — enforced by `governance/compat/check_governed_pack_contract.py`.

## Purpose

Ensure every governed pack folder keeps the minimum 3-file contract required
for workflow, execution policy, and receipt evidence surfaces.

## Scope / Target / Owner Boundary

Target: governed pack folders under
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/`.

Owner: governance compatibility guard surface.

In scope: read-only validation of pack file presence, template ID binding,
workflow section presence, and receipt schema `stepTraces` presence.

Out of scope: runtime execution semantics, provider behavior, output quality,
and pack content generation.

## Rule

For each subdirectory under
`EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/governed-packs/`:

- Rule A: `workflow.spec.md`, `execution.policy.json`, and
  `receipt.schema.json` must exist.
- Rule B: `execution.policy.json` must be valid JSON with `templateId`, and
  that value must appear as an `id:` string in a template file under
  `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/templates/`.
- Rule C: `workflow.spec.md` must contain a `## Workflow` section with at
  least one numbered item.
- Rule D: `receipt.schema.json` must be valid JSON Schema draft-07 or later
  and contain a `stepTraces` property somewhere in the schema tree.

## Enforcement Surface

- Local script: `governance/compat/check_governed_pack_contract.py`
- Local hook chain: `governance/compat/run_local_governance_hook_chain.py`
- Static CI gate: `scripts/run_cvf_static_ci_gate.py`

## Adjacent Guards

- `check_template_skill_standard_guard_compat.py` covers template and skill
  companion documentation, not governed pack folders.
- `check_guard_contract_compat.py` covers shared guard contract compatibility,
  not governed pack folder structure.

## Related Artifacts

- `docs/baselines/archive/CVF_GC018_C2_GOVERNED_PACK_CONTRACT_GUARD_2026-05-19.md`
- `docs/work_orders/archive/CVF_AGENT_WORK_ORDER_C2_GOVERNED_PACK_CONTRACT_GUARD_2026-05-19.md`
- `docs/roadmaps/archive/CVF_WORKFLOW_CHAIN_GOVERNANCE_ROADMAP_V2_2026-05-19.md`

## Final Clause

This guard is structure-only. It does not certify live runtime behavior,
provider routing, or semantic output quality for any governed pack.
