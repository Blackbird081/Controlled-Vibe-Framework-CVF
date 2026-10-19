# CVF Alibaba Free Quota Model Ledger

Status: ACTIVE_REFERENCE

Memory class: GOVERNED_REFERENCE_LEDGER

Last updated: 2026-10-06

Source: operator-provided Alibaba Model Studio free-quota screenshots in the
2026-10-06 session. Screenshot capture date is not established; 2026-10-06
is the source-received date. Diagnostic results dated 2026-06-18 and the prior
2026-09-10 quota snapshot remain historical.

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

## Historical T6 Target Note

The prior T6 target was the `qwen3.7-flash` alias. This is historical selection
context, not a current dispatch instruction or model-default decision. The alias
and `qwen3.7-flash-2026-07-15` snapshot have separate quota rows below.

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

Latest supplied screenshots: 17 distinct visible models (12 language models and
5 rows labeled Vision Model). The repeated `qwen3.8-max-0902` row is counted once.
All visible rows show Enabled and Stop-on-Exhaust switched on. These are console
observations, not runtime compatibility, billing or provider enforcement proof.
Balances retain the console display: K/M values are rounded, not exact counters.
The JSON numeric equivalents are approximate expansions. Vision balances use
console units; they are not asserted to be text-token balances.
Use absolute expiration dates; do not derive dates from relative days-left text.

| Model code | Model type at capture | Expiration date | Quota display remaining / total | Status | Stop-on-Exhaust |
|---|---|---:|---:|---|---|
| `qwen3.8-27b` | Large Language Model | 2026-11-16 | 999.93K / 1M | Enabled | On |
| `qwen3.7-flash-2026-07-15` | Large Language Model | 2026-10-22 | 992.79K / 1M | Enabled | On |
| `qwen3.8-flash` | Large Language Model | 2026-11-24 | 989.24K / 1M | Enabled | On |
| `kimi-k3` | Large Language Model | 2026-11-16 | 1M / 1M | Enabled | On |
| `deepseek-v4-flash-0731` | Large Language Model | 2026-10-30 | 1M / 1M | Enabled | On |
| `qwen3.8-max-0902` | Large Language Model | 2026-11-30 | 994.63K / 1M | Enabled | On |
| `deepseek-v4.1-flash` | Large Language Model | 2026-12-12 | 1M / 1M | Enabled | On |
| `glm-5.3` | Large Language Model | 2026-11-22 | 1M / 1M | Enabled | On |
| `deepseek-v4-pro-0813` | Large Language Model | 2026-11-12 | 998.37K / 1M | Enabled | On |
| `qwen3.8-2.4t-a95b` | Large Language Model | 2026-11-11 | 1M / 1M | Enabled | On |
| `qwen3.8-max` | Large Language Model | 2026-10-31 | 998.39K / 1M | Enabled | On |
| `qwen3.7-flash` | Large Language Model | 2026-10-22 | 992.25K / 1M | Enabled | On |
| `qwen-image-2.1-pro` | Vision Model | 2026-12-31 | 10 / 10 | Enabled | On |
| `qwen-image-3.0` | Vision Model | 2026-11-02 | 10 / 10 | Enabled | On |
| `wan3.0-video` | Vision Model | 2026-11-04 | 30 / 30 | Enabled | On |
| `qwen-image-3.0-pro` | Vision Model | 2026-11-02 | 10 / 10 | Enabled | On |
| `qwen-mt-image-2.0` | Vision Model | 2026-11-25 | 100 / 100 | Enabled | On |

### Historical-only rows from the 2026-09-10 snapshot

Rows absent from the latest supplied images are historical observations, not
proof of provider removal or complete account inventory. The JSON retains the
entire prior snapshot under `historicalSnapshots`; current `models` contains only
the latest visible rows. Historical diagnostics remain separate.

| Model code | Historical expiration | Historical remaining / total |
|---|---:|---:|
| `qwen3.7-plus` | 2026-08-31 | 989,246 / 1,000,000 |
| `qwen3.7-max-2026-05-17` | 2026-08-23 | 1,000,000 / 1,000,000 |
| `qwen3.7-max-2026-06-08` | 2026-09-07 | 1,000,000 / 1,000,000 |
| `glm-5.1` | 2026-08-25 | 1,000,000 / 1,000,000 |
| `qwen3.7-max-preview` | 2026-08-23 | 1,000,000 / 1,000,000 |
| `qwen3.7-max` | 2026-08-19 | 951,277 / 1,000,000 |
| `glm-5.2` | 2026-09-23 | 798,158 / 1,000,000 |
| `kimi-k2.7-code` | 2026-09-23 | 1,000,000 / 1,000,000 |
| `qwen3.7-max-2026-05-20` | 2026-08-19 | 1,000,000 / 1,000,000 |
| `qwen3.7-plus-2026-05-26` | 2026-08-31 | 1,000,000 / 1,000,000 |

## Live-Test Evidence Use

Bounded model calls supply evidence to improve the idea-review, export and
INTAKE workflow. Preserve actual requested/returned model identities and receipt
dates. Extract workflow risks such as lost qualifiers, shifted terminology,
unsupported assumptions and authority confusion; do not turn this evidence into
model rankings, preferred providers or default-model selection. Updating this
quota ledger does not authorize additional calls or change production routing.

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
