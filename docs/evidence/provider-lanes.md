# Provider Lanes

Last refreshed: `2026-05-09`

| Provider | Public evidence | Boundary |
|---|---|---|
| Alibaba/DashScope | Latest curated `qwen-turbo` governed live canary PASS 6/6: `RECEIPT_20260509-160312-276776.json`. | Active release-quality lane when a live key is supplied. |
| DeepSeek | Latest curated `deepseek-chat` governed live canary PASS 6/6: `RECEIPT_20260509-160707-91ae8a.json`. | Model-specific governed-path evidence; no blanket provider parity claim. |
| OpenAI | Latest curated `gpt-4o-mini` governed live canary PASS 6/6: `RECEIPT_20260509-160806-7e3b5b.json`. | Model-specific governed-path evidence; no blanket provider parity claim. |
| Other providers | Adapter direction only. | No public parity claim until live evidence exists. |

Curated receipt files live under:

```text
docs/evidence/provider-lane-receipts/
```

These are minimal structured receipts used for readiness evaluation. Raw audit
history remains in the provenance repository.

Boundary: provider live canaries prove governed-path operability for named
models. They are not QBS quality benchmark scores.
