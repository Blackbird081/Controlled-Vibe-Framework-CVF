# CVF Active Window Classification

Memory class: POINTER_RECORD

Status: canonical grouped management map for all active trace/log windows protected from generic archive cleanup.

## Purpose

- classify every canonical active trace/log window into stable management groups
- give archive tooling, rotation guards, and future contributors one shared source of truth
- keep active-window protection scalable as CVF adds more evidence chains

## Scope / Target / Owner Boundary

Local governance owns active-window classification for exact canonical dependencies; protection preserves paths, not execution readiness.

## Canonical Registry

Machine-readable source:

- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`

Governance gate:

- `governance/compat/check_active_window_registry.py`

Generic archive consumer:

- `scripts/cvf_active_archive.py`

## Group Map

| Window Class | Purpose | Typical shape | Current windows |
|---|---|---|---|
| `GLOBAL_APPEND_ONLY_LOG_WINDOW` | cross-cutting operational log window shared across repo-wide evidence workflows | active file at `docs/` root, archive chain in `docs/logs/` | `docs/CVF_INCREMENTAL_TEST_LOG.md` |
| `SCOPED_APPEND_ONLY_TRACE_WINDOW` | scope-local trace window owned by one review or governance scope | active file near the scope, archive chain in scoped `logs/` folder | `docs/reviews/cvf_phase_governance/CVF_CONFORMANCE_TRACE_2026-03-07.md` |
| `BINDING_REFERENCE_ACTIVE_WINDOW` | dated canonical reference whose exact active path remains a current authority dependency | active reference retained at its cited path and protected from generic archive cleanup | machine-readable registry is the current source for the complete member list |

## Registration Rule

Every dedicated rotation guard that defines a canonical active window must register that window in the active-window registry in the same change batch.

Registration is not optional because the registry drives:

- archive protection
- grouped management
- future auditability of active-window growth

## Management Rules

### `GLOBAL_APPEND_ONLY_LOG_WINDOW`

- use for shared log windows that many workflows may reference
- archive target should stay under `docs/logs/`
- these windows are usually high-traffic and cross-cutting

### `SCOPED_APPEND_ONLY_TRACE_WINDOW`

- use for scope-local traces that belong to one review, plane, or module lineage
- archive target should stay beside the active scope under a scoped `logs/` folder
- these windows should not be mixed into unrelated global archive chains

### `BINDING_REFERENCE_ACTIVE_WINDOW`

- use only when current governance surfaces depend on the exact dated path;
- retain the active path while it remains canonical and explicitly registered;
- archive or supersede only through a reviewed authority-routing change.

Current JEV-S1 binding reference: `docs/reference/CVF_CANONICAL_EXECUTION_PORT_INTERFACE_CONTRACT_2026-09-03.md` remains the exact active owner for the selected callback supplement; register it as BINDING_REFERENCE_ACTIVE_WINDOW while this authority binding remains current. Existing registry entries are preserved.

Current dispatch binding reference: `docs/reference/CVF_DISPATCH_RELEASE_READINESS_MACHINE_STANDARD_2026-09-25.md` remains the exact `STANDARD_PATH` of the dispatch release checker. Register it as BINDING_REFERENCE_ACTIVE_WINDOW; see `docs/reviews/CVF_SYSTEM_CHAIN_CHECKPOINT_PRESERVATION_2026-11-09.md`. No archive or execution grant follows.

Current system-chain dependency: `docs/roadmaps/CVF_CANONICAL_SYSTEM_CHAIN_COMPOSITION_ROADMAP_2026-09-02.md` remains the canonical T3/T4 owner under the operator-selected B design. Keep its exact path active while its obligations remain current; all STOP/HOLD states remain.

Current B identity dependency: `docs/reference/CVF_CANONICAL_EXECUTION_IDENTITY_AND_RECEIPT_JOIN_CONTRACT_2026-09-03.md` remains paired with the canonical execution-port owner. Retain its exact path for source admission; supplemental design does not release runtime.

## Related Artifacts

- `governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json`
- `governance/compat/check_active_window_registry.py`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_WINDOW_REGISTRY_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_ACTIVE_ARCHIVE_GUARD.md`
- `scripts/cvf_active_archive.py`

## Final Clause

Active windows are not just big files. They are governed operational surfaces and must be grouped, registered, and protected as such.

## Creation Proof Profile Owner Registration

The existing high-risk transaction standard and work-order template are binding dated owners for the creation-proof correction; preserve their exact active paths under BINDING_REFERENCE_ACTIVE_WINDOW. Registry IDs: high_risk_local_transaction_proof_standard_active_reference and agent_work_order_template_active_reference. This registration grants no implementation or machine effects.
