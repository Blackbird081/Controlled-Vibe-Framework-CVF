# PM-2 Streaming Evidence — qwen-turbo

Memory class: FULL_RECORD

Status: EVIDENCE

docType: evidence

Date: 2026-05-29

---

## Purpose

Live evidence packet for `streaming` method on Alibaba `qwen-turbo`.
Verifies that streaming is operational: SSE stream with `stream=True` returns
live chunks with measurable first-token latency.

## Test Details

| Field | Value |
| --- | --- |
| Provider | Alibaba DashScope |
| Model | qwen-turbo |
| Method tested | streaming |
| Request type | stream=True, SSE event-stream |
| HTTP status | 200 |
| Receipt ID | rcpt-pm2-alibaba-06f3bcac34ca |
| First-token latency | 377.2ms |
| Stream chunks | 7 |
| Decision | ALLOW |
| evidenceMode | live |
| rawSecretPrinted | false |

## Request Payload

```json
{
  "model": "qwen-turbo",
  "messages": [
    {"role": "user", "content": "Say hello in exactly 5 words."}
  ],
  "stream": true,
  "temperature": 0,
  "max_tokens": 64
}
```

## Response

"Hello, how are you today?"

## Validation

- [x] SSE stream received successfully
- [x] First-token latency measured: 377.2ms
- [x] 7 stream chunks captured
- [x] HTTP 200
- [x] No raw API key in output
- [x] evidenceMode=live

## Source Verification

- **Capability registry:** `EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts` — qwen-turbo has `stream` in supportedMethods
- **Provider adapter:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/provider-router-adapter.ts` — Alibaba provider definition
- **Script:** `scripts/run_pm2_streaming_live_proof.py`

## Claim Boundary

This evidence proves streaming on Alibaba qwen-turbo with one bounded ask.
It does not claim: all-model streaming stability, production throughput,
multi-turn streaming, or broad provider method parity.

## Decision

Retain this record as bounded provider-method evidence in the public-sync
repository. It supports method-capability visibility only, not provider parity,
hosted readiness, or production readiness.

## Evidence / Verification

Public verification is limited to this evidence record and the matching exported
source/test paths listed in
`docs/evidence/cvf-28-05-public-sync-capability-export-2026-05-30.md`.
