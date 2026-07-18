# PM-1 json_mode Evidence — gpt-4o

Memory class: FULL_RECORD

Status: EVIDENCE

docType: evidence

Date: 2026-05-29

---

## Purpose

Live evidence packet for `json_mode` method on OpenAI `gpt-4o`.
Verifies that json_mode is operational: request with `response_format: {"type": "json_object"}` returns valid JSON output with HTTP 200.

This closes the OpenAI half of PM-1.

## Test Details

| Field | Value |
| --- | --- |
| Provider | OpenAI |
| Model | gpt-4o |
| Method tested | json_mode |
| Request type | response_format: {"type": "json_object"} |
| HTTP status | 200 |
| Receipt ID | rcpt-pm1-openai-15cc031a716b |
| Decision | ALLOW |
| evidenceMode | live |
| rawSecretPrinted | false |

## Request Payload

```json
{
  "model": "gpt-4o",
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
  "provider": "openai",
  "method": "json_mode",
  "status": "ok",
  "timestamp": "2023-11-01T12:00:00Z"
}
```

## Validation

- [x] Response is valid JSON — parsed successfully
- [x] Response contains expected keys (provider, method, status, timestamp)
- [x] HTTP 200
- [x] No raw API key in output
- [x] evidenceMode=live

## Source Verification

- **Capability registry:** `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` line 93 — gpt-4o supports json_mode
- **Script:** `scripts/run_pm1_json_mode_live_proof.py`

## Claim Boundary

This evidence proves json_mode on OpenAI gpt-4o with one bounded ask.
It does not claim: all-OpenAI-model json_mode, production stability, schema
validation beyond basic parse, or broad provider method parity.
