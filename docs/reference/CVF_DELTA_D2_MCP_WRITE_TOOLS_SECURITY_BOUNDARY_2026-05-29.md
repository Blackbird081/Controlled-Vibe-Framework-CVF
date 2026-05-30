# CVF Delta D2 — MCP Write Tools Security Boundary

Memory class: FULL_RECORD

Status: APPROVED

docType: security_boundary

Date: 2026-05-29

---

## Purpose

Define and approve the security boundary for two write-path MCP tools added
in Delta D2: `cvf_submit_review_receipt` and `cvf_advance_pipeline_stage`.
This document must be present and approved before any D2 code is written.

## Scope

Covers: `cvf_submit_review_receipt`, `cvf_advance_pipeline_stage`
Does not cover: `cvf_invoke_cli_stage` (D3 scope, separate sandbox spec)

---

## 1. Actor Whitelist

| Tool | Allowed caller roles | Rejected roles |
| --- | --- | --- |
| `cvf_submit_review_receipt` | `REVIEWER`, `OPERATOR` | All others → reject with `role_not_authorized` |
| `cvf_advance_pipeline_stage` | `REVIEWER`, `OPERATOR`, `AI_AGENT` | All others → reject with `role_not_authorized` |

Role is passed as `agentRole` input field. The tool validates against this
whitelist before performing any write operation.

## 2. Input Validation

### `cvf_submit_review_receipt`

Required fields — tool rejects with `validation_error` if any are missing or invalid:

| Field | Type | Constraint |
| --- | --- | --- |
| `receiptId` | string | non-empty, max 128 chars |
| `agentRole` | string | must be in actor whitelist |
| `templateId` | string | non-empty, max 128 chars |
| `decision` | enum | must be one of: `APPROVE`, `REJECT`, `NEEDS_REVISION` |
| `findings` | string[] | array (may be empty); each item max 1000 chars |
| `evidenceRefs` | string[] | array (may be empty); each item max 256 chars |
| `claimBoundary` | string | non-empty, min 10 chars |
| `qualityScore` | number (optional) | 0.0 – 1.0 if present |

### `cvf_advance_pipeline_stage`

Required fields:

| Field | Type | Constraint |
| --- | --- | --- |
| `currentStage` | string | must be valid stage: `intake_gate`, `orchestrator`, `worker`, `reviewer`, `closure_gate` |
| `stageResult` | enum | must be one of: `completed`, `failed`, `needs_review`, `escalated` |
| `agentRole` | string | must be in actor whitelist |
| `receiptRef` | string (optional) | max 256 chars if present |
| `notes` | string (optional) | max 2000 chars if present |

Stage advancement rules (standalone — no cross-package import from cvf-web):

```
intake_gate → orchestrator (on completed)
orchestrator → worker (on completed)
worker → reviewer (on completed or needs_review)
reviewer → closure_gate (on completed)
any stage → same stage (on failed or escalated, sets humanInterventionRequired=true)
```

## 3. Audit Trail

Every tool call — whether accepted or rejected — writes a machine-readable
audit record **before** performing any side effect. The record contains:

| Field | Value |
| --- | --- |
| `tool` | tool name |
| `callerRole` | `agentRole` from input |
| `inputHash` | SHA-256 of JSON-serialized input (no secrets in input) |
| `timestamp` | ISO 8601 UTC |
| `decision` | `ALLOW` or `REJECT` |
| `rejectionReason` | present only when `REJECT` |
| `auditRecordId` | unique ID returned to caller |

Audit records are written to the MCP in-memory audit store (same store used
by `getMcpToolAuditSnapshot()`). They are not written to disk, external APIs,
or the CVF governance envelope — this is local MCP session audit only.

## 4. Rejection Conditions

| Condition | Error code | Tool |
| --- | --- | --- |
| `agentRole` not in whitelist | `role_not_authorized` | both |
| Required field missing | `validation_error` | both |
| `decision` not in enum | `validation_error` | `cvf_submit_review_receipt` |
| `claimBoundary` empty or < 10 chars | `validation_error` | `cvf_submit_review_receipt` |
| `currentStage` not a valid stage | `validation_error` | `cvf_advance_pipeline_stage` |
| `stageResult` not in enum | `validation_error` | `cvf_advance_pipeline_stage` |
| `qualityScore` outside 0.0–1.0 | `validation_error` | `cvf_submit_review_receipt` |

All rejections return `accepted: false` with a non-empty `rejectionReason`.
The audit record is still written for rejected calls.

## 5. Side-Effect Boundary

### `cvf_submit_review_receipt` writes:

- One audit record to MCP in-memory audit store
- Returns structured `SubmitReviewReceiptOutput` to caller

### `cvf_submit_review_receipt` never writes:

- Raw API keys or bearer tokens
- Files to disk
- External HTTP requests
- CVF governance envelope or Evidence Receipt (that is `/api/execute` scope)
- Memory reinjection or session state mutation

### `cvf_advance_pipeline_stage` writes:

- One audit record to MCP in-memory audit store
- Returns updated `AdvancePipelineStageOutput` to caller (computed state, not persisted)

### `cvf_advance_pipeline_stage` never writes:

- Persistent pipeline state to disk or database
- Cross-session state (in-memory only, scoped to MCP server lifetime)
- Files, external APIs, or governance envelopes

## 6. No Raw Key Exposure

- Tool inputs must not contain raw API keys, bearer tokens, or signed headers
- Tool outputs must not echo any key-shaped strings
- `receiptId`, `templateId`, `claimBoundary`, `notes` are treated as plain strings
  — no credential scanning required, but max-length limits prevent bulk exfiltration
- If a caller passes a key-shaped string as `receiptId`, the tool accepts it
  as a string but does not forward it to any external system

## Approval

Security boundary approved by operator authorization 2026-05-29.
D2 code may proceed per Execution Plan in work order
`docs/work_orders/CVF_WO_DELTA_D2_MCP_WRITE_SUBMIT_TOOLS_2026-05-29.md`.

## Claim Boundary

This boundary covers only the two write-path MCP tools in D2. It does not
cover D3 process spawning (separate sandbox spec required), production
deployment, multi-user transport, or hosted readiness.

## Owner / Source

Owner: CVF public documentation surface.

Source: public-safe export from the CVF 28.05 public-sync capability batch.

## Protocol / Contract / Requirements

This artifact is retained as a bounded public reference. It must be read with
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md` before
using it as catalog evidence.

## Enforcement / Verification

Public verification is limited to the exported source, tests, and reference
paths in the public-sync repository. This artifact does not authorize broader
runtime, hosted, production, or provider-parity claims.

## Related Artifacts

- `docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`
- `docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md`
