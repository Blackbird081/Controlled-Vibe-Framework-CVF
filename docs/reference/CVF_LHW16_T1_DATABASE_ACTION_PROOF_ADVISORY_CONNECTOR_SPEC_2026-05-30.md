# CVF LHW16-T1 Database Action Proof Advisory Connector Spec

Memory class: FULL_RECORD

Contract version: `cvf.databaseActionProofAdvisory.lhw16.t1.v1`

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-30

---

## Scope/Target/Owner Boundary

- **Scope:** Documentation-only connector spec. No code file. No EXTENSIONS/ change.
- **Target:** CVF governance agents that need to classify database action risk before dispatching via the W3 tool action taxonomy.
- **Owner:** `governance/contracts/tool-action-taxonomy.ts` (W3).
- **Applies-to:** Any agent or surface that evaluates a planned database action and needs a proof-of-authorization advisory before execution.

## Purpose

Close the remaining LH1 trigger for the `gridex` family (line 157) by defining
a database action proof advisory type. W3 delivered a tool/MCP/database action
taxonomy with `runtimeExecutionAuthorized=false`. `gridex`'s remaining value is
a proof-of-authorization advisory — how agents surface the evidence required
before a read-only database action can proceed, without enabling mutation.

LH1 source: `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 157
W3 owner surface: `governance/contracts/tool-action-taxonomy.ts`

Rejection label for this wave:
`gridex` live database execution is rejected from this LHW wave (doc-only scope)
— requires live route; eligible for separate live-proof roadmap post-LHW.

---

## Advisory Type Definition

### `databaseActionProofAdvisoryType`

Six values covering all database action proof postures:

| Value | Meaning |
| --- | --- |
| `read_proof_ready` | Required read-only authorization evidence is present; action may proceed |
| `read_proof_missing` | Evidence of read-only scope is absent; action must be deferred |
| `mutation_blocked` | Action involves write/update/delete; blocked by policy regardless of evidence |
| `schema_change_blocked` | Action involves DDL (schema change); blocked by policy |
| `approval_required` | Action is in an approval-required risk tier; must obtain approval before dispatch |
| `evidence_insufficient` | Partial authorization exists but does not meet the minimum evidence threshold |

### `databaseActionGuidance`

String field describing the required next step before the database action can proceed. Examples:

- `read_proof_ready` → `"Authorization evidence complete. Read-only database action may be dispatched."`
- `mutation_blocked` → `"Database mutation is blocked by CVF policy. Submit a governed work order for write access before retrying."`
- `approval_required` → `"This database action requires reviewer approval. Submit via /api/execute with REVIEWER role before dispatching."`

---

## Connector Advisory Shape

```typescript
// Advisory readout only — no database execution, no mutation.
interface DatabaseActionProofAdvisory {
  contractVersion: 'cvf.databaseActionProofAdvisory.lhw16.t1.v1';
  databaseActionProofAdvisoryType: DatabaseActionProofAdvisoryType;
  databaseActionGuidance: string;
  actionRiskTier: 'read_only' | 'write' | 'ddl' | 'unknown';
  evidencePresent: boolean;
  runtimeExecutionAuthorized: false; // invariant
}

type DatabaseActionProofAdvisoryType =
  | 'read_proof_ready'
  | 'read_proof_missing'
  | 'mutation_blocked'
  | 'schema_change_blocked'
  | 'approval_required'
  | 'evidence_insufficient';
```

---

## Integration Guidance

This advisory is designed to be evaluated alongside a W3 `ToolActionTaxonomyResult`
for a database action. The consuming agent reads:

1. `toolActionTaxonomy.actionRisk` — determines if the action is read-only, write, or DDL.
2. `toolActionTaxonomy.runtimeExecutionAuthorized` — always `false` in W3.
3. Governance receipt chain — determines if authorization evidence is present.

From these inputs the agent selects one of the six advisory type values.
No live database call is required.

---

## Invariants

- `runtimeExecutionAuthorized: false` — advisory never authorizes database execution.
- `mutation_blocked` and `schema_change_blocked` are permanent for write/DDL actions.
- No code file in this connector spec. No EXTENSIONS/ change.

---

## LH1 Trigger Closure

**Closed:** `gridex` — LH1 line 157
**Status:** ABSORBED (doc-only connector scope)
**W3 absorption already covers:** database action taxonomy, risk classification, `runtimeExecutionAuthorized=false`.
**This spec closes:** read-only database action proof-of-authorization advisory.

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next action | Handled in batch? |
| --- | --- | --- | --- | --- | --- |
| No material findings | RULE_GAP (none found) | DOCUMENTATION_ONLY_LEARNING | N/A_WITH_REASON: no defect pattern observed | None | Yes |

Runtime/provider/cost learning lane: N/A — no runtime, provider, or cost findings.

## Claim Boundary

Documentation-only. Does not claim live database execution, mutation authorization,
schema change authorization, hosted readiness, or production readiness.

## Core Principle

This connector is a documentation-only public standard unless a separate live
runtime roadmap and evidence packet explicitly promotes it.

## Allowed Actions

- Cite the connector as a schema-defined advisory or boundary standard.
- Use the connector to scope future implementation work.
- Link it from the public catalog with its bounded claim language.

## Forbidden Actions

- Do not claim runtime execution, hosted readiness, production readiness, or
  receipt-envelope mutation from this connector alone.
- Do not treat private provenance closure status as public runtime proof.

## Requirements

Public claims must cite this file together with
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md` and must
preserve the connector's documentation-only boundary.

## Exception Path

A stronger claim requires a separate governed roadmap, live or source-backed
verification, and a catalog update that names the new evidence path.

## Violation Conditions

It is a public-claim violation to use this connector as proof of live provider,
database, MCP approval, code-intelligence, hosted, or production behavior.

## Audit / Evidence Requirements

Evidence is limited to the public-sync source/reference paths and the curated
public evidence summary for this batch.

## Related / Owner Surface

- Owner: CVF public documentation surface.
- Related: `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`.
