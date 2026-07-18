# CVF Alibaba Free Quota Model Ledger

Status: ACTIVE_REFERENCE

Memory class: GOVERNED_REFERENCE_LEDGER

Last updated: 2026-06-18

Source: operator-provided Alibaba Model Studio free-quota screenshots in the
2026-06-18 Codex session, plus the bounded secret-safe Alibaba diagnostic rerun
performed in the same session.

## Purpose

This ledger records Alibaba/DashScope model codes and free-quota expiration
dates so agents can choose bounded live-test models without guessing. Before an
Alibaba live run, agents must check whether the selected model is still within
its free-quota validity window.

This file is not a provider capability registry and does not make provider
quality, ranking, parity, production-readiness, or public-readiness claims.

## Scope / Applies-To

Applies to Alibaba/DashScope free-quota model selection for bounded CVF live
tests when the operator has authorized use of existing local API-key aliases.

Does not apply to production provider routing, public-facing provider claims,
provider ranking, paid quota management, or Model Gateway runtime registry
mutation.

## Scope / Target / Owner Boundary

Target: model-code and expiration-date lookup before bounded live tests.

Owner boundary: this ledger is a reference artifact. It does not replace
`EXTENSIONS/CVF_MODEL_GATEWAY/src/provider-capability-registry.ts`, runtime
source, credential-boundary code, governed work orders, or live-run receipts.
Provider capability changes require a separate governed tranche.

## Endpoint Note

For the current operator key alias used in the 2026-06-18 diagnostic rerun,
`dashscope-intl.aliyuncs.com` returned PASS for available models, while
`dashscope.aliyuncs.com` returned `401 invalid_api_key`. Future live tests
should not assume endpoint equivalence. If endpoint selection changes, record a
fresh diagnostic before interpreting failures.

## Use-Before-Live-Test Rule

1. Compare today's date to the `Expiration date` below.
2. If today is after the expiration date, do not use that model for free-quota
   proof unless the operator refreshes the quota record.
3. If a model is absent from this ledger, treat it as
   `MODEL_FREE_QUOTA_NOT_VERIFIED` until checked against the Alibaba console or
   a fresh governed source.
4. If the model is unexpired but the call fails, classify the failure by stage:
   endpoint/key, quota, model availability, provider response, or Model Gateway
   bridge behavior.
5. Do not print or commit raw API key values.

## Model List

| Model code | Expiration date | Free quota remaining at capture | Status at capture | Notes |
|---|---:|---:|---|---|
| `qwen3.6-plus-2026-04-02` | 2026-07-01 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.6-plus` | 2026-07-01 | 911,370 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.6-flash` | 2026-07-16 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.6-flash-2026-04-16` | 2026-07-16 | 998,675 / 1,000,000 | Enabled | Screenshot source; diagnostic rerun PASS on `dashscope-intl.aliyuncs.com`. |
| `qwen3.6-35b-a3b` | 2026-07-16 | 998,835 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.6-max-preview` | 2026-07-19 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.5-plus-2026-04-20` | 2026-07-22 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.6-27b` | 2026-07-22 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `deepseek-v4-flash` | 2026-07-23 | 998,902 / 1,000,000 | Enabled | Screenshot source; diagnostic rerun PASS on `dashscope-intl.aliyuncs.com`. |
| `deepseek-v4-pro` | 2026-07-23 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.7-max` | 2026-08-19 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.7-max-2026-05-20` | 2026-08-19 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.7-max-2026-05-17` | 2026-08-23 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.7-max-preview` | 2026-08-23 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `glm-5.1` | 2026-08-25 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.7-plus` | 2026-08-31 | 998,474 / 1,000,000 | Enabled | Screenshot source; diagnostic rerun PASS on `dashscope-intl.aliyuncs.com`. |
| `qwen3.7-plus-2026-05-26` | 2026-08-31 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |
| `qwen3.7-max-2026-06-08` | 2026-09-07 | 1,000,000 / 1,000,000 | Enabled | Screenshot source. |

## Diagnostic Rerun Summary

Secret-safe rerun on 2026-06-18 used key alias `DASHSCOPE_API_KEY` only as an
alias record. Raw key values were not printed or committed.

| Model code | Endpoint host | Result |
|---|---|---|
| `qwen-turbo` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3.7-plus` | `dashscope-intl.aliyuncs.com` | PASS |
| `deepseek-v4-flash` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3.6-flash-2026-04-16` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3.6-plus` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3-32b` | `dashscope-intl.aliyuncs.com` | FAIL: free tier exhausted |

## Maintenance

Refresh this ledger when the operator supplies a newer Alibaba quota screenshot
or when a governed diagnostic proves a model's availability has changed.

## Claim Boundary

This ledger verifies only the model codes and expiration dates visible in the
operator-provided screenshots and the bounded diagnostic results named above.
It does not guarantee future quota availability, endpoint availability, model
quality, provider parity, paid access, production readiness, public readiness,
or Model Gateway runtime correctness.
