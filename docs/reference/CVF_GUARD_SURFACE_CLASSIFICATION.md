# CVF Guard Surface Classification

Memory class: POINTER_RECORD
Status: grouped management map for the active governance guard surface after `GC-023` hardening, full `GC-030` cleanup, and foundational guard automation closure.

## Purpose

- classify the active guard inventory into stable management groups
- make future hardening easier by showing which guards share the same risk shape
- give humans and agents one short map for deciding where a new guard belongs

## Current Hardening Posture

Short answer: all active guard documents are now standardized and the remaining priority is enforcement depth, not legacy format cleanup.

What is already hardened:

- the high-risk mutable-registry family now has baseline-protection patterns where needed
- local pre-push and CI now cover the main active guard chain more completely
- `GC-030` now blocks new or materially revised guards from shipping without a minimum authoring contract
- the formerly policy-only foundational family is now automated through `check_foundational_guard_surfaces.py`

What remains as future hardening work:

- increase test depth for automation gates that still rely on broad diff heuristics
- keep hook and CI aggregation aligned whenever a new compat gate is added
- continue converting manual review guidance into deterministic repo gates where false-positive risk stays acceptable

Management rule going forward:

- every new guard must be assigned to one group below
- every materially revised guard must remain on the `GC-030` contract
- if a guard introduces a mutable policy, registry, or exception surface, baseline protection must be evaluated explicitly before merge

## Group Map

| Group | Purpose | Current guards | Primary hardening concern |
|---|---|---|---|
| `META_GUARDS` | govern how guards, guard-owned registries, and governance discovery surfaces are authored and registered | `CVF_GUARD_REGISTRY_GUARD`, `CVF_GUARD_AUTHORING_STANDARD_GUARD`, `CVF_ACTIVE_WINDOW_REGISTRY_GUARD` | orphaned or under-specified governance surfaces |
| `CONTINUITY_AND_DECISION` | govern tranche continuation, handoff truth, lane choice, session routing, tracker freshness, structural execution boundaries | `CVF_DEPTH_AUDIT_GUARD`, `CVF_STRUCTURAL_CHANGE_AUDIT_GUARD`, `CVF_AGENT_HANDOFF_GUARD`, `CVF_AGENT_HANDOFF_TRANSITION_GUARD`, `CVF_FAST_LANE_GOVERNANCE_GUARD`, `CVF_SESSION_GOVERNANCE_BOOTSTRAP_GUARD`, `CVF_PROGRESS_TRACKER_SYNC_GUARD`, `CVF_MULTI_AGENT_REVIEW_DOC_GUARD`, `CVF_BOARDROOM_RUNTIME_GUARD`, `CVF_SURFACE_SCAN_CONTINUITY_GUARD` | drift between policy, templates, hook chain, runtime checkpoints, and inherited scan state |
| `DOCS_AND_MEMORY_HYGIENE` | keep long-lived docs, naming, storage, memory class, bug/test history, archive behavior, and governed artifact writing truthful | `CVF_DOCUMENT_NAMING_GUARD`, `CVF_DOCUMENT_STORAGE_GUARD`, `CVF_MEMORY_GOVERNANCE_GUARD`, `CVF_GOVERNED_ARTIFACT_AUTHORING_GUARD`, `CVF_CANON_SUMMARY_EVIDENCE_SEPARATION_GUARD`, `CVF_BUG_DOCUMENTATION_GUARD`, `CVF_TEST_DOCUMENTATION_GUARD`, `CVF_INCREMENTAL_TEST_LOG_ROTATION_GUARD`, `CVF_ACTIVE_ARCHIVE_GUARD`, `CVF_ADR_GUARD`, `CVF_DIAGRAM_VALIDATION_GUARD` | stale reference docs, summary-only evidence, or incomplete durable evidence chains |
| `SIZE_AND_OWNERSHIP` | keep governed files maintainable and stop split surfaces from silently collapsing back together | `CVF_GOVERNED_FILE_SIZE_GUARD`, `CVF_PYTHON_AUTOMATION_SIZE_GUARD`, `CVF_TEST_PARTITION_OWNERSHIP_GUARD`, `CVF_PUBLIC_SURFACE_MAINTAINABILITY_GUARD`, `CVF_BARREL_SMOKE_OWNERSHIP_GUARD`, `CVF_SHARED_BATCH_HELPER_ADOPTION_GUARD`, `CVF_BATCH_CONTRACT_DETERMINISM_GUARD` | mutable exception or ownership registries self-authorizing their own drift, maintainability cleanup regressing after the split/helper exists, or batch identity/clock semantics drifting tranche by tranche |
| `PACKAGE_AND_RUNTIME_ALIGNMENT` | enforce package-level checks, architecture truth, extension naming, runtime-reference alignment, and pre-public lifecycle/exposure/readiness clarity | `CVF_EXTENSION_PACKAGE_CHECK_GUARD`, `CVF_ARCHITECTURE_CHECK_GUARD`, `CVF_EXTENSION_VERSIONING_GUARD`, `CVF_WORKSPACE_ISOLATION_GUARD`, `CVF_REPOSITORY_LIFECYCLE_CLASSIFICATION_GUARD`, `CVF_REPOSITORY_EXPOSURE_CLASSIFICATION_GUARD`, `CVF_PREPUBLIC_P3_READINESS_GUARD` | changes landing without the right package/runtime boundary verification or cleanup/publication waves starting before lifecycle, exposure, and P3 readiness truth are explicit |
| `QUALITY_AND_CONFORMANCE` | preserve test depth truth and conformance evidence quality | `CVF_TEST_DEPTH_CLASSIFICATION_GUARD`, `CVF_CONFORMANCE_TRACE_ROTATION_GUARD`, `CVF_CONFORMANCE_EXECUTION_PERFORMANCE_GUARD`, `CVF_BASELINE_UPDATE_GUARD` | evidence drift between claimed readiness and the actual supporting artifacts |

## Group-Level Management Rules

### `META_GUARDS`

- every new guard starts here first
- no new guard is considered active until both discoverability and authoring-standard requirements pass
- grouped registries that feed other guards or cleanup tooling also start here
- if a future guard family adds its own registry, pair it with a baseline-protection review before activation

### `CONTINUITY_AND_DECISION`

- these guards usually fail by reference drift, not by arithmetic bugs
- when editing one of these guards, always verify the full chain:
  - guard doc
  - canonical template or protocol
  - control matrix
  - bootstrap routing
  - hook and CI surfaces
- when a continuation decision depends on prior repo scanning, preserve one machine-readable scan registry instead of restating partial scan notes only in prose

### `DOCS_AND_MEMORY_HYGIENE`

- these guards protect durable truth more than execution-time safety
- changes should be reviewed together with storage placement, memory class, and append-only history expectations
- if a document claims typed evidence, source truth must be read first and shorthand narrative must not replace the typed fields
- summary canon should point to evidence rather than absorb evidence-owned typed fields

### `SIZE_AND_OWNERSHIP`

- this is the highest-risk family for silent self-authorization
- any new exception registry, ownership registry, or threshold registry in this family should default to fail-closed baseline protection
- size exceptions should never be trusted purely from current repo state
- once a hotspot barrel, smoke test, or batch helper has been intentionally cleaned up, future work should preserve that shape by default
- deterministic batch identity and nested clock propagation belong in this family once governed batch wrappers become a repeated pattern

### `PACKAGE_AND_RUNTIME_ALIGNMENT`

- these guards usually depend on touched-file classification and package/runtime boundaries
- hardening focus should be “did the right package or runtime surface actually get checked”
- pre-public repository cleanup should enter this group first through lifecycle classification before any relocation wave is authorized
- public packaging posture should also enter this group through exposure classification before any root or module is treated as safely publishable
- structural relocation preparation should stay in this group through explicit `P3` readiness, not only through coarse lifecycle/exposure tagging

### `QUALITY_AND_CONFORMANCE`

- these guards are evidence-driven and often depend on canonical reports, manifests, and rotation windows
- hardening focus should be reproducibility and status aggregation so failures cannot hide behind partial green runs

## Hardening Priority Order For Future Work

When a new guard is proposed, hardening review should happen in this order:

1. decide the group
2. decide whether the guard is runtime, checkpoint, or repo-gate oriented
3. if the guard reads mutable policy or registry state, add baseline protection or explain why it is unnecessary
4. add local and CI enforcement surfaces where appropriate
5. register the guard and satisfy `GC-030`

## Related Artifacts

- `docs/reference/CVF_GOVERNANCE_CONTROL_MATRIX.md`
- `docs/reference/CVF_SESSION_GOVERNANCE_BOOTSTRAP.md`
- `governance/toolkit/05_OPERATION/CVF_GUARD_AUTHORING_STANDARD_GUARD.md`
- `governance/toolkit/05_OPERATION/CVF_GUARD_REGISTRY_GUARD.md`
- `docs/baselines/archive/CVF_GUARD_HARDENING_BATCH2_RAPID_AUDIT_DELTA_2026-03-27.md`
- `docs/baselines/archive/CVF_GUARD_HARDENING_BATCH3_META_STANDARD_DELTA_2026-03-27.md`
