# CVF Multi-Provider DeepSeek Enablement Delta — 2026-04-21

## Scope

Enable DeepSeek as a first-class CVF web provider so the previously paused
multi-provider lane can resume once operator billing is available.

## Changes

- Added direct DeepSeek runtime support through the OpenAI-compatible
  chat-completions endpoint.
- Added `DEEPSEEK_API_KEY` as the canonical local environment variable.
- Added DeepSeek to provider status, provider routing, Settings UI,
  provider switcher, quick start, quota usage, pricing fallback, and API-key
  validation.
- Added `scripts/run_cvf_multi_provider_live_smoke.py` for repeatable
  Alibaba + DeepSeek live smoke checks without printing secrets.

## Live Truth

Run:

```bash
python scripts/run_cvf_multi_provider_live_smoke.py
```

Observed on 2026-04-21:

- `alibaba / qwen-turbo`: `PASS`, HTTP 200, output token matched.
- `deepseek / deepseek-chat`: `BLOCKED_BY_PROVIDER_BILLING`, HTTP 402,
  provider message: `Insufficient Balance`.

## Conclusion

Code and local configuration now allow DeepSeek multi-provider testing.
The remaining blocker is provider account balance, not CVF runtime routing or
missing credential wiring.
