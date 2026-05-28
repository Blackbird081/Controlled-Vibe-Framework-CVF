# CVF LHW5 Database Action Boundary Connector Spec

Memory class: FULL_RECORD

docType: reference

Contract version: `cvf.databaseActionBoundaryConnector.lhw5.t1.v1`

Date: 2026-05-27

Status: CLOSED_PASS_BOUNDED

---

## Purpose

This connector defines the database-action boundary packet standard: how W3
database surface/sideEffect/databaseFamily and TA1 approval state are combined
with the LHW4-T2 dispatch decision into a single boundary packet that
Orchestrator can read before dispatching any database-facing operation.

It is not a W3 or TA1 runtime extension. It is not a database driver, query
executor, or mutation authorization grant. `databaseMutationAuthorized=false`
is invariant throughout.

## Scope / Applies-To

Applies to future documentation, packet design, and implementation planning for
database-action boundary readout across W3 taxonomy, TA1 approval, and LHW4-T2
dispatch decision surfaces.

Does not apply to runtime database query execution, mutation, schema changes,
driver creation, provider behavior, receipt envelope changes, hosted readiness,
production readiness, or public release readiness.

## S1 — Purpose and Claim Boundary

This connector is a normative documentation standard binding W3 `surface=database`
+ `sideEffect` + `databaseFamily` → TA1 `approvalState` → LHW4-T2
`dispatchDecision` into a single database-action boundary packet readable by
Orchestrator before any database-facing operation.

What this connector is not: not a W3 or TA1 runtime extension; not a database
driver or query executor; not a mutation authorization grant.

Explicit statement: "`databaseMutationAuthorized=false` is invariant. The
database-action boundary packet is a governance advisory; it does not grant
query execution, mutation authority, or schema-change permission. All
`database_write`, `database_schema_mutation`, `database_admin`,
`database_recovery`, and `destructive` sideEffects map to `blocked`
`dbBoundaryDecision` unless a future tranche explicitly lifts this."

---

## S2 — W3 Database Surface → TA1 Approval → LHW4-T2 Dispatch Field Mapping

| W3 sideEffect | DatabaseActionFamily | TA1 approvalState | Dispatch decision | Database boundary signal |
| --- | --- | --- | --- | --- |
| `database_read` | `read_execution` | `not_required` | `allowed` | Read-only boundary satisfied; no approval gate required |
| `database_read` | `query_drafting` | `pending_approval` | `hold_for_approval` | Query must be reviewed before execution |
| `database_write` | `write_execution` | `blocked_by_policy` | `blocked` | Mutation blocked by policy; `databaseMutationAuthorized=false` |
| `database_schema_mutation` | `schema_mutation` | (any TA1 state) | `blocked` | Schema change blocked; always maps to `blocked` regardless of approval state |
| `database_recovery` | `backup_recovery` | (any TA1 state) | `blocked` | Recovery path remains blocked in the current boundary |
| `database_admin` | `administrative` | (any TA1 state) | `blocked` | Administrative path remains blocked in the current boundary |
| `database_export` | `export_movement` | `satisfied_but_not_executable` | `blocked` | Export approved but not executable; `runtimeExecutionAuthorized=false` |

All W3 and TA1 field and token names used verbatim from source-verified values.

---

## S3 — Database-Action Boundary Packet Minimum Fields

Every database-action boundary packet must contain the following fields. These
are documentation-only minimum requirements. `databaseMutationAuthorized=false`
is invariant. The boundary packet does not extend `GovernanceEvidenceReceipt`
or any existing receipt envelope type.

- `dbBoundaryId`: unique token for this readout (doc-only)
- `surface`: from W3 (always `database` for this connector)
- `sideEffect`: from W3 `ToolActionSideEffect`
- `databaseFamily`: from W3 `DatabaseActionFamily` when present
- `approvalState`: from TA1 `ToolActionApprovalReadout.approvalState`
- `runtimeExecutionAuthorized`: always `false` from W3/TA1 boundary
- `dbBoundaryDecision`: one of `allowed` | `hold_for_approval` | `blocked` (doc-only)
- `mutationGuard`: always `false` for any mutation sideEffect (doc-only)
- `databaseBoundarySignal`: plain-language summary of the boundary decision (doc-only)

---

## S4 — Runtime-Enforcement Boundary Table

| Behavior | Current status | Future path |
| --- | --- | --- |
| W3 database action taxonomy classification | Runtime (`governance/contracts`) | Stable |
| TA1 tool action approval readout | Runtime (`governance/contracts`) | Stable |
| LHW4-T2 authority chain readout packet | Document-only (LHW4-T2) | Future: authority chain validator |
| Database boundary packet composition | Document-only | Future: database boundary validator |
| Database query execution gate | Document-only | Future: route-level database gate |

No doc-only row is labeled Runtime. W3 and TA1 classification are proven closed
runtime surfaces (stable); boundary packet composition and gate enforcement
remain advisory documentation only.

---

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| W3 `surface` `database` token | `governance/contracts/tool-action-taxonomy.ts` | lines 9–14 | `ToolActionSurface`: `database` | `ToolActionSurface` | ACCEPT |
| W3 database `sideEffect` tokens | `governance/contracts/tool-action-taxonomy.ts` | lines 23–28 | `database_read`, `database_write`, `database_export`, `database_schema_mutation`, `database_recovery`, `database_admin` | `ToolActionSideEffect` | ACCEPT |
| W3 `destructive` sideEffect token | `governance/contracts/tool-action-taxonomy.ts` | line 29 | `destructive` | `ToolActionSideEffect` | ACCEPT |
| W3 `DatabaseActionFamily` values | `governance/contracts/tool-action-taxonomy.ts` | lines 33–41 | `schema_inspection`, `query_drafting`, `read_execution`, `write_execution`, `schema_mutation`, `export_movement`, `backup_recovery`, `administrative` | `DatabaseActionFamily` | ACCEPT |
| W3 `databaseFamily` field | `governance/contracts/tool-action-taxonomy.ts` | line 86 | `databaseFamily?: DatabaseActionFamily` | `ToolActionTaxonomyRequest` | ACCEPT |
| W3/TA1 `runtimeExecutionAuthorized: false` | `governance/contracts/tool-action-taxonomy.ts` | lines 119, 141 | `runtimeExecutionAuthorized: false` | `ToolActionTaxonomyEvaluation` / `ToolActionApprovalReadout` | ACCEPT |
| TA1 `approvalState` tokens | `governance/contracts/tool-action-taxonomy.ts` | lines 64–70 | `not_required`, `pending_approval`, `satisfied_but_not_executable`, `blocked_before_approval`, `blocked_by_policy`, `incomplete_approval` | `ToolActionApprovalState` | ACCEPT |
| LHW4-T2 `dispatchDecision` values | `docs/reference/CVF_LHW4_EXECUTION_AUTHORITY_CHAIN_READOUT_CONNECTOR_SPEC_2026-05-27.md` | line 98, S3 field list | `allowed`, `hold_for_approval`, `blocked` | LHW4-T2 authority chain packet (doc-only) | ACCEPT |

No `BLOCKED_SOURCE_NOT_FOUND` rows. All claimed items are ACCEPT.

---

## Claim Boundary

This connector is documentation-only. It does not claim W3 or TA1 runtime
extension, database query execution, mutation authorization, driver creation,
schema-change permission, receipt envelope extension, provider behavior, hosted
readiness, production readiness, or public release readiness.
