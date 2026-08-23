# CVF Alibaba Free Quota Model Ledger

Status: ACTIVE_REFERENCE

Memory class: GOVERNED_REFERENCE_LEDGER

Last updated: 2026-08-15

Source: operator-provided Alibaba Model Studio free-quota screenshots in the
2026-08-15 session. Diagnostic results dated 2026-06-18 remain historical.

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

## Current T6 Target Note

The current free-quota target for the next governed T6 dispatch is the
`qwen3.7-flash` alias. The operator screenshot also shows the dated snapshot
`qwen3.7-flash-2026-07-15`; both rows are enabled, have 1,000,000 of 1,000,000
quota remaining, and expire on 2026-10-22. This is quota-selection evidence,
not live compatibility proof.

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
| `qwen3.7-flash-2026-07-15` | 2026-10-22 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-plus` | 2026-08-31 | 989,246 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-flash` | 2026-10-22 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source; selected T6 alias. |
| `qwen3.7-max-2026-05-17` | 2026-08-23 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-max-2026-06-08` | 2026-09-07 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `glm-5.1` | 2026-08-25 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-max-preview` | 2026-08-23 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `deepseek-v4-flash-0731` | 2026-10-30 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-max` | 2026-08-19 | 951,277 / 1,000,000 | Enabled | Current screenshot source. |
| `glm-5.2` | 2026-09-23 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `kimi-k2.7-code` | 2026-09-23 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `deepseek-v4-pro-0813` | 2026-11-12 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-max-2026-05-20` | 2026-08-19 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.7-plus-2026-05-26` | 2026-08-31 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.8-2.4t-a95b` | 2026-11-11 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |
| `qwen3.8-max` | 2026-10-31 | 1,000,000 / 1,000,000 | Enabled | Current screenshot source. |

## Diagnostic Rerun Summary

Secret-safe rerun on 2026-06-18 used key alias `DASHSCOPE_API_KEY` only as an
alias record. Raw key values were not printed or committed.

| Model code | Endpoint host | Result |
|---|---|---|
| `qwen3.7-flash` | `dashscope-intl.aliyuncs.com` | NOT_RUN_PENDING_T6 |
| `qwen3.7-plus` | `dashscope-intl.aliyuncs.com` | PASS |
| `deepseek-v4-flash` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3.6-flash-2026-04-16` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3.6-plus` | `dashscope-intl.aliyuncs.com` | PASS |
| `qwen3-32b` | `dashscope-intl.aliyuncs.com` | FAIL: free tier exhausted |

## Maintenance

Refresh this ledger when the operator supplies a newer Alibaba quota screenshot
or when a governed diagnostic proves a model's availability has changed.

## Claim Boundary

This ledger verifies only the model codes, quota balances, status labels, and
expiration dates visible in the operator-provided screenshots and the bounded
historical diagnostic results named above.
It does not guarantee future quota availability, endpoint availability, model
quality, provider parity, paid access, production readiness, public readiness,
or Model Gateway runtime correctness.
