# CVF Guard Authoring Standard Guard

**Control ID:** `GC-030`
**Guard Class:** `META_GUARD`
**Status:** Active mandatory authoring contract for new or materially revised governance guards.
**Applies to:** All humans and AI agents creating a new guard or materially revising an existing guard under `governance/toolkit/05_OPERATION/`.
**Enforced by:** `governance/compat/check_guard_authoring_standard.py`

## Purpose

- stop new guards from shipping without a minimal authoring contract
- force every new or materially revised guard to declare scope, enforcement path, and durable references
- prevent future guard drift from reintroducing the same discoverability and enforcement gaps that GC-023 exposed

## Rule

Every new guard, and every existing guard whose rule or enforcement surface is materially revised, MUST satisfy this authoring contract in the same change batch:

1. include a top-level title
2. include these metadata fields:
   - `Guard Class`
   - `Status`
   - `Applies to`
   - `Enforced by`
3. include these sections:
   - `## Purpose`
   - `## Rule`
   - `## Enforcement Surface`
   - `## Related Artifacts`
   - `## Final Clause`
4. ensure every path named in `Enforced by` exists in the repo
5. register the guard in both `README.md` and `docs/CVF_CORE_KNOWLEDGE_BASE.md`
6. if the guard claims a `GC-*` control ID, sync that ID with:
   - `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
   - `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`

Legacy guards that predate `GC-030` are allowed to remain in their older format until they are materially revised. Once a legacy guard is materially revised, it must be brought into `GC-030` compliance before the commit is finalized.

## Enforcement Surface

- repo-level enforcement runs through `governance/compat/check_guard_authoring_standard.py`
- local pre-push enforcement runs through `governance/compat/run_local_governance_hook_chain.py`
- CI enforcement runs through `.github/workflows/documentation-testing.yml`
- discoverability remains paired with `governance/compat/check_guard_registry.py`

`GC-030` intentionally targets new or materially revised guards so CVF can raise the standard immediately without blocking untouched legacy guard documents.

## Related Artifacts

- `governance/compat/check_guard_authoring_standard.py`
- `governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md`
- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`

## Final Clause

If a guard cannot explain what it governs, who it applies to, and how it is enforced, it is not ready to govern anything.
