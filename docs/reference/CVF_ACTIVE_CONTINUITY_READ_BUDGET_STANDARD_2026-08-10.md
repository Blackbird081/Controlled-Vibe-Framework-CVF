# CVF Active Continuity Read-Budget Standard

Memory class: CANONICAL_REFERENCE

Status: ACTIVE

Date: 2026-08-10

## Purpose

Reduce agent startup read cost by binding progressive disclosure, exact
read-budgets, and exact-hash migration debt for active continuity surfaces in
Core and future downstream workspaces. This standard is enforced by
`governance/compat/check_active_session_state.py`.

## Scope

Applies to: Core session continuity surfaces (`CVF_SESSION/ACTIVE_SESSION_BOOTSTRAP_READ_MODEL.json`,
`CVF_SESSION_MEMORY.md`, root `AGENT_HANDOFF*.md`, `CVF_SESSION/ACTIVE_SESSION_STATE.json`)
and the future downstream continuity template
(`governance/toolkit/05_OPERATION/CVF_DOWNSTREAM_AGENTS_TEMPLATE.md`). Owner
surface: `governance/compat/check_active_session_state.py` and
`governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json`. Out of
scope: compacting current Core continuity content (T2) and migrating an
existing downstream repository (T3); see section 9.

## 1. Progressive Disclosure Principle

A new or resumed agent must read continuity surfaces in this order and stop
as soon as the current facts it needs are resolved:

1. bootstrap read model (compact current-fact surface);
2. current front door and current active handoff;
3. only the current-authority paths those two surfaces name for the task at
   hand;
4. targeted state/history lookup only when a current fact is missing,
   contradictory, or the task explicitly requires historical evidence.

Full active-state aggregate reads and full historical-handoff reads are not a
default startup step. They remain available as targeted lookups.

## 2. Bootstrap-First Startup

Core and every future downstream project must route startup through a
bootstrap read model before the full state registry. The bootstrap is the
compact current-fact surface; the full state registry remains the canonical
complete source when a current fact is missing or contradictory.

## 3. Current-Only Front Doors And Handoffs

Front doors and active handoffs carry current pointers and current status
only. Closed history belongs in dated archives referenced by pointer, not
copied inline. Superseded root handoffs must be archived or removed, not
retained as parallel active text.

## 4. Archive Pointers Instead Of Copied History

When a current surface needs to reference prior closure evidence, it must
link the archived artifact path rather than restate the historical content
inline. This keeps current surfaces bounded while preserving the audit trail.

## 5. Authority Refresh On Accepted Work Order Amendments

When an accepted Work Order amendment changes current mode, active handoff,
or next allowed move, the bootstrap, front door, state registry, and active
handoff must be refreshed together so no surface carries stale authority.

## 6. Exact Line And Byte Budgets

| Surface | Maximum lines | Maximum bytes |
|---|---:|---:|
| bootstrap read model | 60 | 4,096 |
| active front door | 120 | 20,480 |
| active handoff | 220 | 32,768 |
| default required-first-read list | 12 paths | N/A |

These are the canonical budgets referenced by the migration registry contract
and by `governance/compat/check_active_session_state.py`.

## 7. Exact-Hash Migration Debt With No Growth

A surface that currently exceeds its budget may carry temporary debt only
through an exact-hash migration registry row in
`governance/compat/CVF_ACTIVE_CONTINUITY_READ_BUDGET_MIGRATION.json`. Each row
must match the current file's path, SHA-256, line count, and byte count
exactly; `approvedMaxLines`/`approvedMaxBytes` must equal the pinned current
facts; `targetMaxLines`/`targetMaxBytes` must equal the canonical budgets in
section 6. A row is rejected on hash drift, growth beyond the pinned facts,
missing fields, duplicate paths, an unknown path, an expired row, or a row for
a surface that is already compliant. Debt cannot grow; it can only shrink
toward the target budget or be removed after compaction.

## 8. Downstream No-Compaction-While-Worker-Active Safety

A downstream template update changes future/generated project instructions
only. It must not be applied by rewriting an existing downstream project's
live continuity files while a worker or reviewer checkpoint on that project is
still active. Provisioning or migrating a generated downstream bootstrap is a
separate, explicitly authorized tranche.

## 9. T2/T3 Migration Responsibilities

- T1 (this standard and its enforcement) does not compact Core's current
  oversized front door or handoff. It only creates the rule, the enforcement,
  and the bounded exact-hash debt registry for the two current Core surfaces
  named in the registry.
- T2 owns compacting Core's current front door and active handoff down to the
  target budgets in section 6 and removing the matching migration-debt rows.
- T3 owns applying the downstream progressive-startup template to an existing
  downstream project, after its active worker/reviewer checkpoint stops.

## 10. Full-State Aggregate Advisory

The full active-state aggregate is not a default startup read under this
standard. When the aggregate exceeds 131,072 bytes, the checker emits an
advisory only; this does not fail T1 enforcement, because T2 owns the
aggregate's schema/content migration.

## 11. Non-Goals

This standard does not compact Core continuity files, does not migrate an
existing downstream repository, does not change runtime governance behavior,
and does not authorize provider, network, live, deployment, or public-sync
action.

## Claim Boundary

This standard binds progressive-read routing, exact machine-enforced budgets,
and exact-hash migration debt for active continuity surfaces only. It makes
no claim about runtime governance behavior, provider/network/live behavior,
deployment, public-sync readiness, or production readiness. Enforcement is
repository-local and structural: it proves budget and migration-debt
compliance, not semantic correctness of continuity content.
