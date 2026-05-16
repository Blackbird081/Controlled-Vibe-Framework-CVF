# Provider Lanes

Memory class: FULL_RECORD

Status: CURRENT PUBLIC PROVIDER EVIDENCE BOUNDARY

Last refreshed: `2026-05-09`

## Purpose

Tell evaluators and agents which provider lanes have published governed live
evidence, the receipt files behind each lane, and what the lane evidence does
not claim.

## Scope

Curated public provider-lane receipts as of the refresh date above. This file
does not cover internal regression suites, raw provenance history, or QBS
quality scores.

## Source

Curated receipt files live under:

```text
docs/evidence/provider-lane-receipts/
```

These are minimal structured receipts used for readiness evaluation. Raw audit
history remains in the provenance repository.

## Evidence

| Provider | Public evidence | Boundary |
| --- | --- | --- |
| Alibaba/DashScope | Latest curated `qwen-turbo` governed live canary PASS 6/6: `RECEIPT_20260509-160312-276776.json`. | Active release-quality lane when a live key is supplied. |
| DeepSeek | Latest curated `deepseek-chat` governed live canary PASS 6/6: `RECEIPT_20260509-160707-91ae8a.json`. | Model-specific governed-path evidence; no blanket provider parity claim. |
| OpenAI | Latest curated `gpt-4o-mini` governed live canary PASS 6/6: `RECEIPT_20260509-160806-7e3b5b.json`. | Model-specific governed-path evidence; no blanket provider parity claim. |
| Other providers | Adapter direction only. | No public parity claim until live evidence exists. |

## Decision

Three provider lanes (Alibaba/DashScope `qwen-turbo`, DeepSeek `deepseek-chat`,
OpenAI `gpt-4o-mini`) are treated as currently evidenced for the governed
canary path. All other providers stay at adapter direction only until live
evidence exists.

## Boundary

Provider live canaries prove governed-path operability for named models. They
are not QBS quality benchmark scores.

## Claim Boundary

This file claims only the listed receipts, dates, and PASS counts for the
named provider/model pairs. It does not claim blanket provider parity, does
not claim QBS scoring outcomes, and does not authorize new provider lanes
without fresh live evidence.
