# CVF Public Surface Maintainability Guard

**Control ID:** `GC-033`
**Guard Class:** `SIZE_AND_OWNERSHIP_GUARD`
**Status:** Active maintainability boundary for thin governed package public barrels.
**Applies to:** governed package public barrels, currently `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`.
**Enforced by:** `governance/compat/check_cpf_public_surface_maintainability.py`

## Purpose

- keep package public surfaces readable as CVF grows
- stop `src/index.ts` from accumulating local implementation logic again after an intentional split
- make barrel thickness and role machine-enforceable instead of stylistic preference

## Rule

Governed package public barrels must remain thin routing surfaces.

For the active CPF public barrel:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts` must stay under the active thin-barrel threshold
- non-comment lines must remain public re-export statements only
- implementation logic, local helper bodies, or hashing logic must not live in the barrel

The canonical maintainability authority is:

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_cpf_public_surface_maintainability.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`

## Related Artifacts

- `docs/reference/CVF_MAINTAINABILITY_STANDARD.md`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/index.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.coordination.barrel.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/control.plane.continuation.barrel.ts`
- `governance/compat/check_cpf_public_surface_maintainability.py`

## Final Clause

Public access should grow through stable barrels, not through re-expanded hotspot files.
