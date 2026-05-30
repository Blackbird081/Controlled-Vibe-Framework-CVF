# CVF LHW16-T3 Code Intelligence Adapter Boundary Connector Spec

Memory class: FULL_RECORD

Contract version: `cvf.codeIntelligenceAdapterBoundary.lhw16.t3.v1`

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-30

---

## Scope/Target/Owner Boundary

- **Scope:** Documentation-only connector spec. No code file. No EXTENSIONS/ change.
- **Target:** CVF governance agents that need to classify code-intelligence adapter boundary posture before dispatching a code analysis or symbol lookup request.
- **Owner:** AIF-B graph modules (`graph-schema.ts`, `ast-parser.ts`, `symbol-index.ts`).
- **Applies-to:** Any agent or surface that wants to invoke a code-intelligence capability and needs to know whether the request is within the governed read-only boundary.

## Purpose

Close the remaining LH1 trigger for the `cortex-hub` family (line 155) by
defining a code-intelligence adapter boundary advisory type. AIF-B delivered
graph schema, AST parser, and symbol index modules. `cortex-hub`'s remaining
value is a boundary advisory — how agents classify whether a code-intelligence
request is within the governed read-only adapter boundary, and what evidence is
required before dispatching.

LH1 source: `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 155
AIF-B owner surface: `EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/` (graph modules)

Rejection label for this wave:
`cortex-hub` live code-intelligence engine import is rejected from this LHW wave
(doc-only scope) — requires live route; eligible for separate live-proof roadmap
post-LHW.

---

## Advisory Type Definition

### `codeIntelligenceAdapterBoundaryType`

Six values covering all code-intelligence adapter boundary postures:

| Value | Meaning |
| --- | --- |
| `read_boundary_clear` | Request is within read-only boundary; symbol lookup or AST traversal may proceed |
| `read_boundary_exceeded` | Request requires write or mutating code operation; blocked by policy |
| `engine_import_blocked` | Request requires importing an external code-intelligence engine; blocked until authorized |
| `symbol_index_required` | Symbol index must be built before the request can be answered; defer and index first |
| `graph_context_incomplete` | Graph context required for this request is not yet resolved; defer pending resolution |
| `scope_out_of_boundary` | Request targets code outside the governed workspace scope; blocked |

### `codeIntelligenceGuidance`

String field describing the required next step before the code-intelligence request
can proceed. Examples:

- `read_boundary_clear` → `"Request is within read-only boundary. Symbol lookup or AST traversal may be dispatched."`
- `engine_import_blocked` → `"External code-intelligence engine import is blocked. Authorize engine integration with a GC-018 before retrying."`
- `symbol_index_required` → `"Symbol index must be built first. Run the AIF-B symbol indexer on the target workspace before querying."`

---

## Connector Advisory Shape

```typescript
// Advisory readout only — no code-intelligence engine execution.
interface CodeIntelligenceAdapterBoundary {
  contractVersion: 'cvf.codeIntelligenceAdapterBoundary.lhw16.t3.v1';
  codeIntelligenceAdapterBoundaryType: CodeIntelligenceAdapterBoundaryType;
  codeIntelligenceGuidance: string;
  requestedOperation: 'symbol_lookup' | 'ast_traversal' | 'dependency_graph' | 'code_mutation' | 'engine_import' | 'unknown';
  workspaceScopeVerified: boolean;
  runtimeExecutionAuthorized: false; // invariant
}

type CodeIntelligenceAdapterBoundaryType =
  | 'read_boundary_clear'
  | 'read_boundary_exceeded'
  | 'engine_import_blocked'
  | 'symbol_index_required'
  | 'graph_context_incomplete'
  | 'scope_out_of_boundary';
```

---

## Integration Guidance

This advisory is designed to be consumed before dispatching a code-intelligence
request to AIF-B graph modules. The consuming agent reads:

1. The requested operation type — symbol lookup, AST traversal, or other.
2. Whether a symbol index has been built for the target workspace.
3. Whether the workspace scope is within the governed boundary.

From these inputs the agent selects one of the six boundary type values.
No live code-intelligence engine call is required.

### Selection Priority

1. `engine_import_blocked` — request requires external engine import
2. `read_boundary_exceeded` — request is a mutating code operation
3. `scope_out_of_boundary` — target workspace outside governed scope
4. `symbol_index_required` — index not yet built
5. `graph_context_incomplete` — graph context not resolved
6. `read_boundary_clear` — all above conditions are false

---

## Invariants

- `runtimeExecutionAuthorized: false` — advisory never authorizes code-intelligence execution.
- `engine_import_blocked` is permanent until a GC-018 authorizes the specific engine.
- No code file in this connector spec. No EXTENSIONS/ change.

---

## LH1 Trigger Closure

**Closed:** `cortex-hub` — LH1 line 155
**Status:** ABSORBED (doc-only connector scope)
**AIF-B absorption already covers:** graph schema, AST parser, symbol index, task-query mapper.
**This spec closes:** code-intelligence adapter boundary advisory for governed read-only dispatch.

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next action | Handled in batch? |
| --- | --- | --- | --- | --- | --- |
| No material findings | RULE_GAP (none found) | DOCUMENTATION_ONLY_LEARNING | N/A_WITH_REASON: no defect pattern observed | None | Yes |

Runtime/provider/cost learning lane: N/A — no runtime, provider, or cost findings.

## Claim Boundary

Documentation-only. Does not claim live code-intelligence engine execution,
external engine import, code mutation authorization, hosted readiness, or
production readiness.

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
