# CVF Gap 8 Action Taxonomy Per-Action Rollback Detail Spec

Memory class: FULL_RECORD

Status: CLOSED_PASS

docType: connector_spec

Date: 2026-05-29

---

## Purpose

This connector is a documentation-only advisory.

## Scope / Applies To

Applies to: CVF Gap 8 per-action rollback detail advisory surface.
Target owner: Orchestrators and Governance Auditors verifying rollback
evidence quality per action category. No runtime enforcement.

---

## S1 — Purpose and Gap Citation

Source gap: CVF 25.05 Gop_y.md Gap 8 — W3 (`cvf.toolActionTaxonomy.w3.v1`)
provides `rollbackRequired: boolean` and `rollbackDeclared?: boolean` as a
gate, but does not specify what rollback evidence is required, what steps apply,
or what escalation path exists per `ToolActionSideEffect` category. Governance
Auditors cannot verify rollback quality from the boolean gate alone.

This connector maps each `ToolActionSideEffect` value →
`rollbackDetailAdvisoryType` + `minimumRollbackEvidence` +
`rollbackSteps` + `rollbackEscalationPath` as a governance planning record.

Key invariants:

- This connector does NOT modify `evaluateToolAction()` runtime behavior.
- `runtimeExecutionAuthorized=false`.
- Phase B wiring of these records into `evaluateToolAction()` is DEMAND_GATED
  via a separate work order.

Authority chain:
- Work order: `docs/work_orders/CVF_WO_GAP8_ACTION_TAXONOMY_ROLLBACK_DETAIL_2026-05-29.md`
- W3 contract: `governance/contracts/tool-action-taxonomy.ts`
  — `ToolActionSideEffect` line 16, `rollbackDeclared` line 93,
    `rollbackRequired` line 118, `rollback_plan` line 79
- CVF 25.05 review: `.private_reference/legacy/CVF 25.05/CLAUDE_REVIEW_OF_GOP_Y_2026-05-25.md`
  — Gap 8 section

---

## S2 — Per-Action Rollback Detail Mapping

`ToolActionSideEffect` × `rollbackDetailAdvisoryType` →
`minimumRollbackEvidence` + `rollbackSteps` + `rollbackEscalationPath`:

| `sideEffect` | `rollbackDetailAdvisoryType` | `minimumRollbackEvidence` | `rollbackSteps` | `rollbackEscalationPath` |
| --- | --- | --- | --- | --- |
| `read_only` | `rollback_not_required` | None | No rollback needed | N/A |
| `local_write` | `rollback_via_file_restore` | Pre-write snapshot path or git-trackable diff | 1. Restore snapshot or revert via git; 2. Verify file state | Escalate to Reviewer if snapshot missing |
| `workspace_mutation` | `rollback_via_workspace_restore` | Workspace state snapshot or git stash reference | 1. Apply stash or restore snapshot; 2. Verify workspace state | Escalate to Orchestrator if unrestorable |
| `external_mutation` | `rollback_via_external_undo` | External system undo endpoint or manual reversal evidence | 1. Call undo endpoint; 2. Verify external state reverted | Escalate to Orchestrator if endpoint unavailable |
| `install` | `rollback_via_uninstall` | Package name + version + uninstall command | 1. Run uninstall command; 2. Verify package absent | Escalate to Orchestrator if broken state remains |
| `network_egress` | `rollback_not_possible_advisory` | Sent-data log | No recall possible; log egress for audit | Mark IRREVERSIBLE; require explicit human acknowledgment before dispatch |
| `database_read` | `rollback_not_required` | None | No rollback needed | N/A |
| `database_write` | `rollback_via_transaction_or_backup` | Transaction ID or pre-write backup reference | 1. Rollback transaction if open; 2. If committed, restore from backup | Escalate to DBA if backup missing |
| `database_export` | `rollback_via_export_deletion` | Export file path + deletion confirmation | 1. Delete exported file; 2. Confirm deletion receipt | Escalate to Orchestrator if file distributed externally |
| `database_schema_mutation` | `rollback_via_migration_down` | Down-migration script reference | 1. Run down-migration; 2. Verify schema reverted | Escalate to Orchestrator if migration irreversible |
| `database_recovery` | `rollback_advisory_only` | Recovery operation log | Recovery ops are generally idempotent; log outcome | Escalate to Orchestrator if unexpected state |
| `database_admin` | `rollback_via_admin_reversal` | Admin operation log + reversal command | 1. Run reversal command; 2. Verify admin state reverted | Escalate to security team if reversal fails |
| `destructive` | `rollback_not_possible_advisory` | Pre-destruction backup reference | No rollback without backup; require backup before dispatch | Mark IRREVERSIBLE; require explicit human authorization |
| `privileged` | `rollback_via_privilege_revocation` | Privilege grant log + revocation command | 1. Revoke privilege; 2. Verify access removed | Escalate to security team if revocation fails |
| `unknown` | `rollback_detail_unavailable` | Manual review required | Block until side-effect reclassified | Escalate to Reviewer for reclassification |

---

## S3 — Invariants and Boundary

1. `runtimeExecutionAuthorized=false` — this connector does not enforce
   rollback at runtime or modify `evaluateToolAction()` behavior.
2. Source `rollbackDeclared` (line 93) is a boolean field on
   `ToolActionTaxonomyRequest`; it is NOT cited as proof that rollback
   steps have been verified. Callers must supply actual evidence matching
   the `minimumRollbackEvidence` for their `sideEffect` category.
3. The W3 `rollback_plan` approval evidence type (line 79) maps to the
   `minimumRollbackEvidence` column in S2 — this connector defines what
   that plan must contain per category.
4. `rollback_not_possible_advisory` categories (`network_egress`,
   `destructive`) require explicit human authorization before dispatch.
   This advisory does not block dispatch automatically — Phase B wiring
   is required to enforce that gate.
5. `rollback_not_required` categories (`read_only`, `database_read`) do
   not need `rollbackDeclared=true` at dispatch.

---

## S4 — Non-Goals

- Modifying `evaluateToolAction()` or any W3 runtime function
- Adding new `ToolActionSideEffect` values
- Enforcing rollback evidence at dispatch time (Phase B scope)
- Receipt envelope extension
- Provider behavior changes
- Hosted readiness, production readiness, or public release readiness
- Phase B runtime wiring without a separate work order and GC-018

---

## S5 — Source Verification Table

| Verified symbol | Source file | Line/section | Disposition |
| --- | --- | --- | --- |
| `ToolActionSideEffect` | `governance/contracts/tool-action-taxonomy.ts` | line 16 | ACCEPT |
| `read_only` | `governance/contracts/tool-action-taxonomy.ts` | line 17 | ACCEPT |
| `local_write` | `governance/contracts/tool-action-taxonomy.ts` | line 18 | ACCEPT |
| `workspace_mutation` | `governance/contracts/tool-action-taxonomy.ts` | line 19 | ACCEPT |
| `external_mutation` | `governance/contracts/tool-action-taxonomy.ts` | line 20 | ACCEPT |
| `install` | `governance/contracts/tool-action-taxonomy.ts` | line 21 | ACCEPT |
| `network_egress` | `governance/contracts/tool-action-taxonomy.ts` | line 22 | ACCEPT |
| `database_read` | `governance/contracts/tool-action-taxonomy.ts` | line 23 | ACCEPT |
| `database_write` | `governance/contracts/tool-action-taxonomy.ts` | line 24 | ACCEPT |
| `database_export` | `governance/contracts/tool-action-taxonomy.ts` | line 25 | ACCEPT |
| `database_schema_mutation` | `governance/contracts/tool-action-taxonomy.ts` | line 26 | ACCEPT |
| `database_recovery` | `governance/contracts/tool-action-taxonomy.ts` | line 27 | ACCEPT |
| `database_admin` | `governance/contracts/tool-action-taxonomy.ts` | line 28 | ACCEPT |
| `destructive` | `governance/contracts/tool-action-taxonomy.ts` | line 29 | ACCEPT |
| `privileged` | `governance/contracts/tool-action-taxonomy.ts` | line 30 | ACCEPT |
| `unknown` | `governance/contracts/tool-action-taxonomy.ts` | line 31 | ACCEPT |
| `rollbackDeclared` | `governance/contracts/tool-action-taxonomy.ts` | line 93 | ACCEPT |
| `rollbackRequired` | `governance/contracts/tool-action-taxonomy.ts` | line 118 | ACCEPT |
| `rollback_plan` | `governance/contracts/tool-action-taxonomy.ts` | line 79 | ACCEPT |
| `TOOL_ACTION_TAXONOMY_VERSION` | `governance/contracts/tool-action-taxonomy.ts` | line 6 | ACCEPT |

New doc-only fields (no runtime claim):

| New field | Purpose | Runtime claim blocked? |
| --- | --- | --- |
| `rollbackDetailAdvisoryType` | Names the per-action rollback detail advisory | Yes |
| `minimumRollbackEvidence` | Lists required rollback evidence per side-effect | Yes |
| `rollbackSteps` | Ordered rollback steps per side-effect category | Yes |
| `rollbackEscalationPath` | Escalation if rollback cannot be performed | Yes |

---

## Claim Boundary

This connector produces a documentation planning record. It does not modify
W3 runtime behavior, enforce rollback evidence at dispatch, claim Phase B
wiring, add new `ToolActionSideEffect` values, extend receipt envelopes, or
claim hosted readiness, production readiness, or public release readiness.

CVF 25.05 Gap 8 Phase A: CLOSED_PASS. All 15 `ToolActionSideEffect` values
individually covered with rollback detail advisory. Phase B (runtime wiring
into `evaluateToolAction()`) remains DEMAND_GATED.
