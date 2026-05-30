# PM-1 json_mode Evidence — deepseek-chat

Memory class: FULL_RECORD

Status: EVIDENCE

docType: evidence

Date: 2026-05-29

---

## Purpose

Live evidence packet for `json_mode` method on DeepSeek `deepseek-chat`.
Verifies that json_mode is operational: request with `response_format: {"type": "json_object"}` returns valid JSON output with HTTP 200.

This closes the DeepSeek half of PM-1.

## Test Details

| Field | Value |
| --- | --- |
| Provider | DeepSeek |
| Model | deepseek-chat |
| Method tested | json_mode |
| Request type | response_format: {"type": "json_object"} |
| HTTP status | 200 |
| Receipt ID | rcpt-pm1-deepseek-9bef6e2a3cbd |
| Decision | ALLOW |
| evidenceMode | live |
| rawSecretPrinted | false |

## Request Payload

```json
{
  "model": "deepseek-chat",
  "messages": [
    {"role": "system", "content": "You are a JSON-only assistant. Always respond with valid JSON."},
    {"role": "user", "content": "Return a JSON object with keys: provider, method, status, timestamp."}
  ],
  "response_format": {"type": "json_object"},
  "temperature": 0,
  "max_tokens": 256
}
```

## Response

```json
{
  "provider": "deepseek",
  "method": "json_mode",
  "status": "ok",
  "timestamp": "2025-04-09T12:34:56Z"
}
```

## Validation

- [x] Response is valid JSON — parsed successfully
- [x] Response contains expected keys (provider, method, status, timestamp)
- [x] HTTP 200
- [x] No raw API key in output
- [x] evidenceMode=live

## Source Verification

- **Capability registry:** `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` line 80 — deepseek-chat supports json_mode
- **Adapter:** `EXTENSIONS/CVF_MODEL_GATEWAY/src/providers/deepseek/json-mode-adapter.ts` — json_mode adapter exists
- **Script:** `scripts/run_pm1_json_mode_live_proof.py`

## Claim Boundary

This evidence proves json_mode on DeepSeek deepseek-chat with one bounded ask.
It does not claim: all-DeepSeek-model json_mode, production stability, schema
validation beyond basic parse, or broad provider method parity.

## Decision

Retain this record as bounded provider-method evidence in the public-sync
repository. It supports method-capability visibility only, not provider parity,
hosted readiness, or production readiness.

## Evidence / Verification

Public verification is limited to this evidence record and the matching exported
source/test paths listed in
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`.
