# Providers

CVF is provider-agnostic. Providers are execution lanes behind a governance
boundary, not the definition of CVF itself.

## Current Public Lane Status

| Provider | Model | Public status | Boundary |
|---|---|---|---|
| Alibaba/DashScope | `qwen-turbo` / configured lane | Latest governed live canary PASS 6/6 on 2026-05-09. | Requires operator-supplied key; active release-quality lane. |
| DeepSeek | `deepseek-chat` | Latest governed live canary PASS 6/6 on 2026-05-09. | Model-specific governed-path evidence; not a parity claim. |
| OpenAI | `gpt-4o-mini` | Latest governed live canary PASS 6/6 on 2026-05-09. | Model-specific governed-path evidence; not a blanket OpenAI parity claim. |
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

OpenAI:

```text
OPENAI_API_KEY
CVF_OPENAI_API_KEY
```

Gemini:

```text
GOOGLE_AI_API_KEY
GEMINI_API_KEY
CVF_GEMINI_API_KEY
```

Other provider keys should follow the same rule: operator supplied, never
printed, never committed, never included in evidence.
