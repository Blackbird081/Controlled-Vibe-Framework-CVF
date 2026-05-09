# Providers

CVF is provider-agnostic. Providers are execution lanes behind a governance
boundary, not the definition of CVF itself.

## Current Public Lane Status

| Provider | Model | Public status | Boundary |
|---|---|---|---|
| Alibaba/DashScope | `qwen-turbo` / configured lane | Live lane used for release-quality proof. | Requires operator-supplied key. |
| DeepSeek | `deepseek-chat` | Confirmatory/provider-lane evidence exists. | Not a parity claim. |
| OpenAI | operator-selected | Adapter-ready direction. | No public parity claim in this repo. |
| Gemini | operator-selected | Adapter-ready direction. | No public parity claim in this repo. |
| Claude | operator-selected | Adapter-ready direction. | No public parity claim in this repo. |

## Adapter Requirements

A provider adapter should expose:

- provider id
- model id
- request id or equivalent trace id
- timeout and retry posture
- cost/token signal when available
- raw key redaction boundary
- error taxonomy
- output text or structured payload
- governance receipt metadata

## Key Handling

Use environment variables. Do not commit provider keys.

Accepted DashScope-compatible aliases:

```text
DASHSCOPE_API_KEY
ALIBABA_API_KEY
CVF_ALIBABA_API_KEY
CVF_BENCHMARK_ALIBABA_KEY
```

DeepSeek:

```text
DEEPSEEK_API_KEY
```

Other provider keys should follow the same rule: operator supplied, never
printed, never committed, never included in evidence.

