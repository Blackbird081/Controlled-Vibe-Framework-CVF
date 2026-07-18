# CVF LHW10-T3 Provider Health Degradation Advisory Connector Spec

Memory class: FULL_RECORD

Status: ACTIVE

docType: connector_spec

Date: 2026-05-28

Contract version: `cvf.providerHealthDegradationAdvisory.lhw10.t3.v1`

---

## Purpose

This connector binds W5 `ProviderMethodFallbackEvaluation.status` (8 values) ×
W4 `OperationalBenchmarkScorecard.clarityStatus` (3 values) × LHW9-T1
`mcpApprovalAdvisoryType` (6 values) into a provider health degradation advisory
packet for Orchestrator-readable provider health assessment.

## Scope / Applies-To

Applies to: CVF provider health degradation advisory surface.

Target: documentation-only connector spec binding W5, W4, and LHW9-T1 surfaces.

Owner: CVF session-continuity and roadmap steering surface.

## S1 — Purpose and Claim Boundary

### Purpose

This connector maps W5 provider method fallback status × W4 operational
benchmark clarity status × LHW9-T1 MCP approval advisory type → a named
`providerHealthAdvisoryType` + `fallbackRecoveryStep`.

This closes the gap where no standard maps provider fallback posture ×
benchmark clarity → a named provider health advisory type for Orchestrator
review.

### Claim Boundary

This connector is a documentation-only normalization artifact. It does not
change provider routing, execute retries, or modify the MCP approval state.

`runtimeExecutionAuthorized=false`

The connector produces an advisory packet for Orchestrator review. It does not
claim:

- Provider routing change
- Retry execution
- MCP approval state modification
- Receipt envelope extension
- Provider behavior change
- Public-sync update
- Hosted readiness
- Production readiness
- Public release readiness

This mapping is an advisory only.

Key invariant: A `provider_health_blocked_quota` or
`provider_health_unavailable` advisory suspends all pending MCP tool approvals
until provider health is restored.

## S2 — Fallback Status × Benchmark Clarity → Provider Health Advisory Mapping

Input tuple: W5 `ProviderMethodFallbackStatus` (8 values) × W4
`OperationalBenchmarkClarityStatus` (3 values) × LHW9-T1
`mcpApprovalAdvisoryType` (6 values) → `providerHealthAdvisoryType` +
`fallbackRecoveryStep`.

All input tokens are used verbatim from their source surfaces.

### Mapping Table

| W5 `ProviderMethodFallbackStatus` | W4 `clarityStatus` | LHW9-T1 `mcpApprovalAdvisoryType` | `providerHealthAdvisoryType` | `fallbackRecoveryStep` |
| --- | --- | --- | --- | --- |
| `ready` | `clear` | `mcp_advisory_clear` | `provider_health_ready` | No action required. Provider ready. |
| `ready` | `clear` | `mcp_advisory_hold_pending` | `provider_health_ready_hold_mcp` | Provider ready. Hold for MCP approval. |
| `ready` | `clear` | `mcp_advisory_satisfied_not_executable` | `provider_health_ready_mcp_blocked` | Provider ready. MCP blocked by policy. |
| `ready` | `clear` | `mcp_advisory_blocked_pre_approval` | `provider_health_ready_mcp_blocked` | Provider ready. MCP blocked before approval. |
| `ready` | `clear` | `mcp_advisory_blocked_by_policy` | `provider_health_ready_mcp_blocked` | Provider ready. MCP blocked by policy. |
| `ready` | `clear` | `mcp_advisory_incomplete` | `provider_health_ready_mcp_incomplete` | Provider ready. MCP approval incomplete. |
| `ready` | `needs_context` | any | `provider_health_ready_needs_context` | Provider ready. Benchmark needs context. |
| `ready` | `insufficient_evidence` | any | `provider_health_ready_insufficient_evidence` | Provider ready. Benchmark evidence insufficient. |
| `missing_provider_model` | `clear` | any | `provider_health_missing_model` | Provider or model not configured. Check provider registry. |
| `missing_provider_model` | `needs_context` | any | `provider_health_missing_model_needs_context` | Provider or model not configured. Benchmark needs context. |
| `missing_provider_model` | `insufficient_evidence` | any | `provider_health_missing_model_insufficient_evidence` | Provider or model not configured. Benchmark evidence insufficient. |
| `unsupported_method` | `clear` | any | `provider_health_unsupported_method` | Method not supported by provider. Check capability registry. |
| `unsupported_method` | `needs_context` | any | `provider_health_unsupported_method_needs_context` | Method not supported. Benchmark needs context. |
| `unsupported_method` | `insufficient_evidence` | any | `provider_health_unsupported_method_insufficient_evidence` | Method not supported. Benchmark evidence insufficient. |
| `fallback_available` | `clear` | any | `provider_health_fallback_available` | Fallback available. Consider fallback provider. |
| `fallback_available` | `needs_context` | any | `provider_health_fallback_available_needs_context` | Fallback available. Benchmark needs context. |
| `fallback_available` | `insufficient_evidence` | any | `provider_health_fallback_available_insufficient_evidence` | Fallback available. Benchmark evidence insufficient. |
| `fallback_unavailable` | `clear` | any | `provider_health_fallback_unavailable` | Fallback unavailable. No alternative provider. |
| `fallback_unavailable` | `needs_context` | any | `provider_health_fallback_unavailable_needs_context` | Fallback unavailable. Benchmark needs context. |
| `fallback_unavailable` | `insufficient_evidence` | any | `provider_health_fallback_unavailable_insufficient_evidence` | Fallback unavailable. Benchmark evidence insufficient. |
| `blocked_non_retryable` | `clear` | any | `provider_health_blocked_non_retryable` | Provider blocked. Non-retryable error. |
| `blocked_non_retryable` | `needs_context` | any | `provider_health_blocked_non_retryable_needs_context` | Provider blocked. Benchmark needs context. |
| `blocked_non_retryable` | `insufficient_evidence` | any | `provider_health_blocked_non_retryable_insufficient_evidence` | Provider blocked. Benchmark evidence insufficient. |
| `blocked_quota` | `clear` | any | `provider_health_blocked_quota` | Provider blocked. Quota exceeded. Suspend all pending MCP approvals. |
| `blocked_quota` | `needs_context` | any | `provider_health_blocked_quota_needs_context` | Provider blocked. Quota exceeded. Benchmark needs context. Suspend MCP. |
| `blocked_quota` | `insufficient_evidence` | any | `provider_health_blocked_quota_insufficient_evidence` | Provider blocked. Quota exceeded. Benchmark evidence insufficient. Suspend MCP. |
| `provider_unhealthy` | `clear` | any | `provider_health_unavailable` | Provider unhealthy. Suspend all pending MCP approvals. |
| `provider_unhealthy` | `needs_context` | any | `provider_health_unavailable_needs_context` | Provider unhealthy. Benchmark needs context. Suspend MCP. |
| `provider_unhealthy` | `insufficient_evidence` | any | `provider_health_unavailable_insufficient_evidence` | Provider unhealthy. Benchmark evidence insufficient. Suspend MCP. |

### Mapping Notes

- When W5 status is `ready`, provider is healthy and `providerHealthAdvisoryType`
  depends on W4 clarity status and LHW9-T1 MCP advisory.
- When W5 status is `missing_provider_model` or `unsupported_method`, provider
  configuration is incomplete.
- When W5 status is `fallback_available`, a fallback provider exists.
- When W5 status is `fallback_unavailable`, no fallback provider exists.
- When W5 status is `blocked_non_retryable`, provider is blocked with
  non-retryable error.
- When W5 status is `blocked_quota`, provider is blocked due to quota and all
  pending MCP tool approvals must be suspended.
- When W5 status is `provider_unhealthy`, provider is unhealthy and all pending
  MCP tool approvals must be suspended.
- When W4 `clarityStatus` is `needs_context` or `insufficient_evidence`, the
  advisory type includes that clarity status.
- When W5 status is `blocked_quota` or `provider_unhealthy`, the
  `fallbackRecoveryStep` includes "Suspend all pending MCP approvals" or
  "Suspend MCP".

## S3 — Minimum Fields

A provider health degradation advisory packet must include:

- `contractVersion`: `cvf.providerHealthDegradationAdvisory.lhw10.t3.v1`
- `fallbackStatus`: from W5 `ProviderMethodFallbackEvaluation.status` (8 values)
- `clarityStatus`: from W4 `OperationalBenchmarkScorecard.clarityStatus` (3 values)
- `mcpApprovalAdvisoryType`: from LHW9-T1 (6 values)
- `providerHealthAdvisoryType`: derived from S2 mapping (new doc-only field)
- `fallbackRecoveryStep`: human-readable recovery step from S2 mapping (new
  doc-only field)
- `mcpApprovalSuspended`: `true` when `fallbackStatus` is `blocked_quota` or
  `provider_unhealthy`; `false` otherwise
- `runtimeExecutionAuthorized`: `false` (literal invariant)
- `boundaries`: array of explicit boundary statements

Example packet:

```json
{
  "contractVersion": "cvf.providerHealthDegradationAdvisory.lhw10.t3.v1",
  "fallbackStatus": "blocked_quota",
  "clarityStatus": "clear",
  "mcpApprovalAdvisoryType": "mcp_advisory_hold_pending",
  "providerHealthAdvisoryType": "provider_health_blocked_quota",
  "fallbackRecoveryStep": "Provider blocked. Quota exceeded. Suspend all pending MCP approvals.",
  "mcpApprovalSuspended": true,
  "runtimeExecutionAuthorized": false,
  "boundaries": [
    "This connector does not change provider routing, execute retries, or modify the MCP approval state.",
    "This connector produces an advisory packet for Orchestrator review only.",
    "A provider_health_blocked_quota or provider_health_unavailable advisory suspends all pending MCP tool approvals until provider health is restored."
  ]
}
```

## S4 — Boundary Table

| Boundary | Rationale | Enforcement |
| --- | --- | --- |
| No provider routing change | This is a documentation-only connector | No `.ts`/`.tsx`/`.js`/`.py` file in diff |
| No retry execution | This is a documentation-only connector | No execution surface change |
| No MCP approval state modification | This is a documentation-only connector | No MCP transport change |
| No receipt envelope extension | This is a documentation-only connector | No receipt schema change |
| No provider behavior change | This is a documentation-only connector | No provider adapter change |
| No public-sync update | This is a documentation-only connector | No public-sync repo push |
| No hosted readiness | This is a documentation-only connector | No hosted deployment |
| No production readiness | This is a documentation-only connector | No production deployment |
| No public release readiness | This is a documentation-only connector | No public release claim |
| `runtimeExecutionAuthorized=false` | Literal invariant | S3 example packet |
| This mapping is an advisory only | Orchestrator review only | S1 claim boundary |
| MCP approval suspension on quota/unhealthy | Advisory only; no runtime enforcement | S2 mapping notes |

## S5 — Source Verification Table

| Claimed item | Source file | Verified line/section | Verified path or symbol | Owning interface/function/schema | Disposition |
| --- | --- | --- | --- | --- | --- |
| `ProviderMethodFallbackStatus` type | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 46 | `export type ProviderMethodFallbackStatus` | `ProviderMethodFallbackStatus` | ACCEPT |
| `ready` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 47 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `missing_provider_model` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 48 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `unsupported_method` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 49 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `fallback_available` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 50 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `fallback_unavailable` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 51 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `blocked_non_retryable` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 52 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `blocked_quota` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 53 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `provider_unhealthy` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 54 | union type value | `ProviderMethodFallbackStatus` | ACCEPT |
| `ProviderMethodFallbackEvaluation.status` | `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-method-fallback-normalization.ts` | line 87 | `readonly status: ProviderMethodFallbackStatus` | `ProviderMethodFallbackEvaluation` | ACCEPT |
| `OperationalBenchmarkClarityStatus` type | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` | line 46 | `export type OperationalBenchmarkClarityStatus` | `OperationalBenchmarkClarityStatus` | ACCEPT |
| `clear` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` | line 46 | union type value | `OperationalBenchmarkClarityStatus` | ACCEPT |
| `needs_context` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` | line 46 | union type value | `OperationalBenchmarkClarityStatus` | ACCEPT |
| `insufficient_evidence` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` | line 46 | union type value | `OperationalBenchmarkClarityStatus` | ACCEPT |
| `OperationalBenchmarkScorecard.clarityStatus` | `EXTENSIONS/CVF_ECO_v2.2_GOVERNANCE_CLI/src/operational-benchmark-suite.ts` | line 75 | `clarityStatus` field | `OperationalBenchmarkScorecard` | ACCEPT |
| `mcpApprovalAdvisoryType` field | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S3 field list | doc-only field | LHW9-T1 connector | ACCEPT |
| `mcp_advisory_clear` | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 row 1 | `mcpApprovalAdvisoryType` value | LHW9-T1 doc-only field | ACCEPT |
| `mcp_advisory_hold_pending` | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 row 2 | `mcpApprovalAdvisoryType` value | LHW9-T1 doc-only field | ACCEPT |
| `mcp_advisory_satisfied_not_executable` | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 row 3 | `mcpApprovalAdvisoryType` value | LHW9-T1 doc-only field | ACCEPT |
| `mcp_advisory_blocked_pre_approval` | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 row 4 | `mcpApprovalAdvisoryType` value | LHW9-T1 doc-only field | ACCEPT |
| `mcp_advisory_blocked_by_policy` | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 row 5 | `mcpApprovalAdvisoryType` value | LHW9-T1 doc-only field | ACCEPT |
| `mcp_advisory_incomplete` | `docs/reference/CVF_LHW9_T1_MCP_TOOL_APPROVAL_ADVISORY_CONNECTOR_SPEC_2026-05-28.md` | S2 row 6 | `mcpApprovalAdvisoryType` value | LHW9-T1 doc-only field | ACCEPT |
| `providerHealthAdvisoryType` (new) | N/A — canonical doc-only field | S3 new fields | doc-only | Provider health degradation advisory packet | ACCEPT |
| `fallbackRecoveryStep` (new) | N/A — canonical doc-only field | S3 new fields | doc-only | Provider health degradation advisory packet | ACCEPT |
| `mcpApprovalSuspended` (new) | N/A — canonical doc-only field | S3 new fields | doc-only | Provider health degradation advisory packet | ACCEPT |
| `runtimeExecutionAuthorized=false` invariant | N/A — literal invariant | S3 example packet | literal false | Provider health degradation advisory packet | ACCEPT |

---

## Claim Boundary

This connector is a documentation-only normalization artifact. It does not
change provider routing, execute retries, modify the MCP approval state, extend
receipt envelopes, change provider behavior, update public-sync, or claim
hosted/production/public release readiness.

`runtimeExecutionAuthorized=false`
