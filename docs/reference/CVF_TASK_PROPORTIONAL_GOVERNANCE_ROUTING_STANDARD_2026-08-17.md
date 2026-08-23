# CVF Task-Proportional Governance Routing Standard

Memory class: governed-standard

Status: ACTIVE_T0_SHADOW_ENFORCEMENT

Date: 2026-08-17

## Purpose

Make governance cost follow task risk instead of guard count. Every newly
activated governed work order must declare one closed-shape task manifest and
receive a deterministic routing receipt before dispatch. TPGR-T0 is shadow
enforcement: it classifies and fails closed, but it does not skip, reorder, or
replace any current legacy gate.

## Scope

This standard governs CVF absorption and project-delivery tasks. It owns the
profile vocabulary, classification manifest, escalation triggers, bundle
selection explanation, and activation rule. Existing domain standards remain
owners of their substantive controls.

## Canonical Machine Surfaces

- registry: `governance/compat/CVF_TASK_GOVERNANCE_ROUTE_REGISTRY.json`;
- schema: `governance/compat/CVF_TASK_GOVERNANCE_ROUTE_MANIFEST.schema.json`;
- deterministic router: `governance/compat/route_task_governance.py`;
- activation checker: `governance/compat/check_task_governance_route.py`;
- focused tests: `governance/compat/test_route_task_governance.py` and
  `governance/compat/test_check_task_governance_route.py`.

The registry is canonical for enum values, profile ordering, protected-path
minimums, and bundle names. The schema documents the exact manifest shape; the
router additionally enforces cross-field and path contradictions.

## Mandatory Classification

The manifest declares all eight dimensions:

| Dimension | Values |
| --- | --- |
| `taskKind` | `READ_ONLY`, `DOC_CHANGE`, `PURE_LOCAL_IMPLEMENTATION`, `STATEFUL_LOCAL_IMPLEMENTATION`, `EXTERNAL_ABSORPTION`, `RUNTIME_INTEGRATION`, `LIVE_PROOF`, `PUBLIC_RELEASE`, `DESTRUCTIVE_OPERATION` |
| `authorityImpact` | `NONE`, `USES_EXISTING_OWNER`, `ENRICHES_EXISTING_OWNER`, `CREATES_OR_CHANGES_AUTHORITY` |
| `externalEffect` | `NONE`, `LOCAL_REVERSIBLE`, `NETWORK_READ`, `NETWORK_WRITE`, `PUBLIC_WRITE`, `DESTRUCTIVE` |
| `dataSensitivity` | `PUBLIC`, `PRIVATE_REPO`, `CREDENTIAL_REFERENCE`, `SECRET_VALUE`, `REGULATED` |
| `reversibility` | `READ_ONLY`, `GIT_REVERSIBLE`, `STATEFUL_REVERSIBLE`, `PARTIALLY_REVERSIBLE`, `IRREVERSIBLE` |
| `sourceScale` | `NONE`, `NAMED_FILES`, `BOUNDED_CLUSTER`, `CORPUS` |
| `delegation` | `SINGLE_ROLE`, `MULTI_ROLE_NO_COMMIT`, `MULTI_ROLE_WITH_COMMIT` |
| `novelty` | `KNOWN_PATTERN`, `OWNER_COMPOSITION`, `NEW_INTERFACE`, `NEW_AUTHORITY` |

It also declares exact path families, claims, proof, checkpoints, forbidden
effects, and source-read evidence. Selected named files or bounded clusters in
an absorption task require `selectedFilesFullyRead: true`. Corpus work requires
a prior corpus receipt reference; a terminal ledger row is not full-read proof.

## Profiles And Minimums

| Profile | Minimum posture |
| --- | --- |
| `P0_OBSERVE` | read-only evidence; no mutation |
| `P1_LIGHT` | small docs/pure local work under an existing owner |
| `P2_BOUNDED` | delegated or bounded-cluster work with independent review |
| `P3_ELEVATED` | canonical standard/checker/hook/generator/authority, state, dependency, auth, persistence, install, migration, or network change |
| `P4_CRITICAL` | provider/live, public write, push/deploy/production, secret value, regulated data, destructive or irreversible work |

File and byte counts never override a minimum. Unknown values, missing fields,
contradictions, protected-path mismatches, or self-downgrade produce
`REJECTED_ESCALATED`, select the full legacy bundle, and set the fallback
profile to at least `P3_ELEVATED`.

## Mandatory Escalation

- multi-role delegation sets at least `P2_BOUNDED`;
- corpus scope sets at least `P2_BOUNDED` plus `CORPUS_ACCOUNTING`;
- canonical standards, checkers, hooks, generators, continuity state, new
  interfaces or authority set at least `P3_ELEVATED`;
- stateful work, credentials, dependencies, auth, persistence, installation,
  migration, network read/write, or partially reversible work set at least
  `P3_ELEVATED`;
- live/provider, secret value, regulated data, public write/release,
  destructive or irreversible work sets `P4_CRITICAL`.

Escalation is monotonic. A task may regenerate a stronger route when new facts
appear; it may not self-downgrade after dispatch.

## Bundle Contract

The router explains applicability using `CORE_INTEGRITY`, `ARTIFACT_SHAPE`,
`SOURCE_PROVENANCE`, `CORPUS_ACCOUNTING`, `DELEGATION_HANDOFF`, `CODE_QUALITY`,
`STATE_AND_SECURITY`, `RUNTIME_LIVE`, `PUBLIC_RELEASE`, and `CONTINUITY`.
Every omitted bundle carries a machine reason. Bundle selection is an
explanation only during T0.

## Activation Rule

The commit introducing this standard is its shadow activation boundary. In
that commit the checker validates its registry and remains compatible with the
legacy range. In every later range, a changed work order whose status is
`DISPATCH_READY`, `READY`, `ACTIVE`, or `APPROVED_FOR_EXECUTION` must include:

    ## Task Governance Routing Manifest

    ```json
    { ... cvf.taskGovernanceManifest.v1 ... }
    ```

The JSON must route to `ROUTED_SHADOW`. Missing or rejected manifests block
dispatch. Closed historical work orders are not retroactively rewritten.

## TPGR-T0 Legacy Full-Gate Interlock

Every T0 receipt must contain:

- `selectiveExecutionAuthorized: false`;
- `legacyGateDisposition: RUN_FULL_LEGACY_BUNDLE`;
- `receiptStatus: ROUTED_SHADOW` for valid manifests.

Autorun and local hook catalogs invoke the TPGR checker in addition to their
current commands. They continue to run the complete legacy command lists.
Selective execution is unauthorized until TPGR-T2 and TPGR-T4 equivalence
evidence are independently accepted.

## Absorption Cost Rule

Immutable corpus inventory, hashes, and completeness evidence are recorded
once. Later clusters reference that receipt, recompute selected hashes, and
fully read each selected file. P1/P2 packets must not reproduce unrelated
corpus, runtime, provider, public, or destructive evidence unless a manifest
trigger selects those risks. During T0, this is a packet-authoring rule and
routing receipt; legacy gates still execute.

## Verification

```powershell
python -m pytest governance/compat/test_route_task_governance.py governance/compat/test_check_task_governance_route.py
python governance/compat/check_task_governance_route.py --base <base> --head HEAD --enforce
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-dispatch --base <base> --head HEAD
```

## Rollback

Remove the TPGR checker from command catalogs and retain the legacy full gate.
Never roll back by accepting an invalid manifest or by silently authorizing
selective execution. Registry/schema/router changes require `P3_ELEVATED`,
independent review, focused tests, and the current guard-maintenance controls.

## Claim Boundary

This standard activates classification and shadow receipts only. It grants no
task authority, runtime authority, provider call, public write, deployment, or
destructive action. It does not yet reduce the executed legacy guard bundle.
