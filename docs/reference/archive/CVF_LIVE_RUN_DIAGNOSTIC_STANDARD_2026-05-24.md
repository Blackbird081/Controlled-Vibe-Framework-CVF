# CVF Live Run Diagnostic Standard

Memory class: FULL_RECORD

Status: ACTIVE STANDARD

docType: reference

Date: 2026-05-24

---

## Purpose

Define the mandatory diagnostic standard for every CVF live run that uses a
real provider API key, service token, CLI/MCP command, hosted `/api/execute`
call, browser journey, release gate, or public/private governance proof.

This standard exists because `success=false` with no classified cause wastes
operator time, live provider quota, and token budget. It also makes end-user
CLI/MCP/API-key troubleshooting impossible.

## Scope / Target / Owner Boundary

Scope: live-run evidence and user/operator-facing diagnostics.

Target:

- live provider probes
- release-gate live proof
- hosted `/api/execute` proof
- CLI/MCP/API-key execution proof
- provider-soak and benchmark evidence
- future end-user diagnostic surfaces

Owner: every AI/agent that runs or files live evidence in this repository.

Out of scope: printing raw API keys, signed headers, raw provider bodies that
may contain secrets, or expanding provider/runtime behavior without a separate
work order.

## Mandatory Rule

Any live run that fails, partially fails, times out, returns empty output, or
reruns because of an unclear result must record a safe diagnostic object or an
explicit reason why diagnostic capture was impossible.

The diagnostic must be recorded before rerunning the same live test.

## Required Diagnostic Fields

Minimum fields:

| Field | Required | Meaning |
| --- | --- | --- |
| `stage` | yes | Where the failure occurred. |
| `class` | yes | Stable failure class. |
| `retryable` | yes | Whether retry may reasonably help. |
| `userAction` | yes | What operator/end user should do next. |
| `provider` | when known | Provider lane. |
| `model` | when known | Model lane. |
| `httpStatus` | when available | HTTP status from route or provider boundary. |
| `latencyMs` | when available | Wall-clock latency. |
| `receiptId` | when available | Governance receipt id. |
| `traceId` | when available | Envelope/trace id. |
| `safeMessage` | yes | Human-readable secret-free explanation. |

Recommended object shape:

```json
{
  "stage": "provider",
  "class": "provider_timeout",
  "retryable": true,
  "userAction": "wait_and_retry",
  "provider": "deepseek",
  "model": "deepseek-chat",
  "httpStatus": 200,
  "latencyMs": 60001,
  "receiptId": "rcpt-env-example",
  "traceId": "env-example",
  "safeMessage": "Provider call exceeded the configured timeout after governance allowed the request."
}
```

## Stable Stages

- `request_validation`
- `auth`
- `rate_limit`
- `governance`
- `routing`
- `provider`
- `output_validation`
- `storage`
- `network`
- `benchmark_model`
- `unknown`

## Stable Classes

- `invalid_input`
- `missing_api_key`
- `invalid_api_key`
- `insufficient_balance`
- `quota_exceeded`
- `rate_limited`
- `provider_timeout`
- `provider_http_error`
- `model_unavailable`
- `provider_empty_output`
- `provider_parse_error`
- `policy_blocked`
- `approval_required`
- `routing_denied`
- `routing_unresolved`
- `output_validation_failed`
- `mock_fallback`
- `receipt_missing`
- `receipt_non_live`
- `benchmark_denominator_ambiguous`
- `network_error`
- `unknown_error`

## Stable User Actions

- `check_api_key`
- `top_up_or_check_quota`
- `wait_and_retry`
- `change_model`
- `lower_risk_or_change_provider`
- `revise_request`
- `request_approval`
- `contact_admin`
- `inspect_receipt`
- `do_not_retry_without_new_evidence`
- `none`

## Secret Hygiene

Diagnostics must never include:

- raw API keys
- signed service-token headers
- bearer tokens
- full provider request body when it may contain user secrets
- unredacted environment variable values
- raw browser local-storage provider settings

Diagnostics may include:

- provider name
- model name
- HTTP status
- latency
- redacted provider error message
- receipt id
- trace id
- stable class
- user action

## Rerun Rule

Before any rerun that consumes live API quota after a failure, the agent must
answer:

1. What failed?
2. Which stage failed?
3. Is retry expected to help?
4. What exact change makes the rerun meaningful?

If the answer is "unknown", the next step must be a diagnostic capture run, not
a broad repeat of the same test.

## Benchmark Clarity Rule

If a benchmark creates more than one event per live call, evidence must report
both:

- call-level result, such as `5/5 live calls PASS`
- event-model metric denominator, such as `5/10 events`

The evidence must explain that event-model ratios are not automatically the
same as call-level pass rate.

## End-User Requirement

For CLI, MCP, hosted API, and browser surfaces, future V3 implementation must
render a user-actionable diagnostic whenever a governed execution has no
usable output. "No output" without a classified cause is not acceptable for
end-user operation.

## Claim Boundary

This standard defines mandatory diagnostic evidence behavior. It does not, by
itself, change `/api/execute` response schema, CLI/MCP rendering, provider
adapters, receipt envelopes, or public capability claims. Those require the V3
implementation work order and tests.

