# CVF LHW16-T2 MCP Approval Proof Advisory Connector Spec

Memory class: FULL_RECORD

Contract version: `cvf.mcpApprovalProofAdvisory.lhw16.t2.v1`

Status: CLOSED_PASS_BOUNDED

docType: connector_spec

Date: 2026-05-30

---

## Scope/Target/Owner Boundary

- **Scope:** Documentation-only connector spec. No code file. No EXTENSIONS/ change.
- **Target:** CVF governance agents that need to classify MCP tool approval posture before dispatching a tool call.
- **Owner:** `governance/contracts/tool-action-taxonomy.ts` (W3); MCP server tools in `EXTENSIONS/CVF_ECO_v2.5_MCP_SERVER/`.
- **Applies-to:** Any agent or surface that evaluates a pending MCP tool action and needs to know whether approval evidence is complete before dispatch.

## Purpose

Close the remaining LH1 trigger for the `pancake-pos-mcp` family (line 141) by
defining an MCP approval proof advisory type. W3 delivered a tool action taxonomy
with approval states. `pancake-pos-mcp`'s remaining value is an MCP-specific
approval proof advisory — how agents surface the minimum evidence required for a
governed MCP tool call to proceed, mapping to the W3 `ToolApprovalState` values.

LH1 source: `docs/reference/CVF_LEGACY_HARVEST_CLOSEOUT_LEDGER_2026-05-25.md` line 141
W3 owner surface: `governance/contracts/tool-action-taxonomy.ts`

Rejection label for this wave:
`pancake-pos-mcp` live MCP transport execution is rejected from this LHW wave
(doc-only scope) — requires live route; eligible for separate live-proof roadmap
post-LHW.

---

## Advisory Type Definition

### `mcpApprovalProofAdvisoryType`

Six values covering all MCP approval postures:

| Value | Meaning |
| --- | --- |
| `approval_complete` | All required approval evidence is present; MCP tool call may proceed |
| `approval_pending` | Tool requires approval; approval request submitted but not yet satisfied |
| `approval_missing` | Tool requires approval; no approval record found |
| `tool_not_registered` | Tool ID is not in the CVF tool registry; dispatch blocked |
| `risk_tier_blocked` | Tool risk tier exceeds caller authority; blocked by policy |
| `receipt_chain_incomplete` | Prior receipt chain required before this tool call; missing evidence |

### `mcpApprovalGuidance`

String field describing the next step before the MCP tool call can proceed. Examples:

- `approval_complete` → `"Approval evidence is complete. MCP tool call may be dispatched."`
- `approval_missing` → `"No approval record found. Submit an approval request via cvf_submit_review_receipt before dispatching this tool."`
- `tool_not_registered` → `"Tool ID is not in the CVF registry. Register the tool with a GC-018 before dispatching."`

---

## Connector Advisory Shape

```typescript
// Advisory readout only — no MCP transport execution.
interface McpApprovalProofAdvisory {
  contractVersion: 'cvf.mcpApprovalProofAdvisory.lhw16.t2.v1';
  mcpApprovalProofAdvisoryType: McpApprovalProofAdvisoryType;
  mcpApprovalGuidance: string;
  toolId: string;
  requiredApprovalRole: string | null;
  runtimeExecutionAuthorized: false; // invariant
}

type McpApprovalProofAdvisoryType =
  | 'approval_complete'
  | 'approval_pending'
  | 'approval_missing'
  | 'tool_not_registered'
  | 'risk_tier_blocked'
  | 'receipt_chain_incomplete';
```

---

## Integration Guidance

This advisory is designed to be consumed alongside a W3/TA1 `ToolActionApprovalReadout`
for an MCP tool call. The consuming agent reads:

1. `toolActionApprovalReadout.approvalState` — current approval status from TA1.
2. `toolActionApprovalReadout.runtimeExecutionAuthorized` — always `false`.
3. The CVF tool registry — whether the tool ID is registered.

From these inputs the agent selects one of the six advisory type values.
No live MCP call is required.

---

## Invariants

- `runtimeExecutionAuthorized: false` — advisory never authorizes MCP execution.
- `tool_not_registered` blocks all further action regardless of approval state.
- No code file in this connector spec. No EXTENSIONS/ change.

---

## LH1 Trigger Closure

**Closed:** `pancake-pos-mcp` — LH1 line 141
**Status:** ABSORBED (doc-only connector scope)
**W3/TA1 absorption already covers:** MCP tool approval states, risk tiers, `runtimeExecutionAuthorized=false`.
**This spec closes:** MCP approval proof-of-authorization advisory for governed tool dispatch.

---

## Finding-To-Governance Learning Disposition

| Finding | Defect class | Learning lane | Disposition | Next action | Handled in batch? |
| --- | --- | --- | --- | --- | --- |
| No material findings | RULE_GAP (none found) | DOCUMENTATION_ONLY_LEARNING | N/A_WITH_REASON: no defect pattern observed | None | Yes |

Runtime/provider/cost learning lane: N/A — no runtime, provider, or cost findings.

## Claim Boundary

Documentation-only. Does not claim live MCP transport, tool registration authority,
approval enforcement, hosted readiness, or production readiness.

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
