# CVF Provider Lane Readiness Matrix

Status: CURRENT_PUBLIC_REFERENCE
Memory class: FULL_RECORD

**Last updated:** 2026-07-23 (public disposition reconciled with R65 Option B and Known Limitations L-007)<br>
**Computed by:** `scripts/evaluate_cvf_provider_lane_certification.py`  
**Status taxonomy:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.ts`

---

## Purpose

Provide the public, model-specific readiness disposition for provider lanes
without converting adapter presence, one receipt, or historical evidence into
a broader certification or provider-parity claim.

## Scope And Claim Boundary

This matrix governs public documentation wording for the listed model lanes.
It does not certify every model from a provider, promise current credential
availability, prove provider parity, or authorize UI badges beyond the exact
status recorded here. Historical receipts remain evidence inputs; a reviewed
public disposition controls until a fresh governed promotion changes it.

---

## Status Key

| Status | Meaning |
|---|---|
| `UNCONFIGURED` | No usable API key or provider env available |
| `BLOCKED` | Key exists but auth / billing / rate-limit prevents execution |
| `LIVE` | Smoke request succeeds against live provider |
| `CANARY_PASS` | Locked 6-scenario canary passes in latest run |
| `CERTIFIED` | Latest 3 consecutive canary runs are PASS 6/6 |
| `DEGRADED` | Lane was PASS but latest canary now fails |
| `EXPERIMENTAL` | Integration exists but lacks full canary evidence |

---

## Provider Readiness

| Provider | Model | Status | Latest Receipt | Pass Window | Operator Note |
|---|---|---|---|---|---|
| Alibaba | `qwen-turbo` | `CERTIFIED` | [20260421-072551-422037](../audits/alibaba-canary/CVF_RECEIPT_20260421-072551-422037.md) | 3 consecutive PASS 6/6 | Fast (7–12 s). User-paid DashScope billing. |
| DeepSeek | `deepseek-chat` | `CERTIFIED` | [20260421-114125-19515e](../audits/deepseek-canary/CVF_RECEIPT_20260421-114125-19515e.md) | 3 consecutive PASS 6/6 | Slower (62–155 s observed). User-paid billing. |
| OpenAI | `gpt-4o-mini` | `EXPERIMENTAL` | [Historical receipt 20260509-141626-fa4465](../evidence/provider-lane-receipts/openai/RECEIPT_20260509-141626-fa4465.json) | Historical 3-run PASS evidence exists; current public certification remains held | Operator-paid OpenAI billing; receipt projection does not itself reverse R65 Option B or Known Limitations L-007. Fresh governed promotion is required. |

---

## Evidence Indexes

- Alibaba: [`docs/audits/alibaba-canary/INDEX.md`](../audits/alibaba-canary/INDEX.md)
- DeepSeek: [`docs/audits/deepseek-canary/INDEX.md`](../audits/deepseek-canary/INDEX.md)
- OpenAI: historical JSON receipts are present under `docs/evidence/provider-lane-receipts/openai/`; no public canary index or current certification promotion is claimed

---

## Claim Boundary

> Multi-provider operability is proven. Provider parity is not claimed.  
> Provider economics (latency, cost, reliability) remain user-selected.

Alibaba `qwen-turbo` and DeepSeek `deepseek-chat` are the two current,
unambiguous public `CERTIFIED` lanes. OpenAI has model-specific historical
canary receipts, but receipt presence alone is not authority to reverse the
reviewed R65 Option B disposition. Do not add an OpenAI certification badge or
broader UI claim until a fresh governed promotion reconciles this matrix,
Known Limitations L-007, provider documentation, and the intended public claim.

CVF governs: policy routing, evidence receipts, status classification, approval flow, trace capture.  
Provider-owned: model strength, latency, price, billing limits, outage behavior, rate limits.

---

## Update Path

Run the certification evaluator to refresh statuses:

```bash
python scripts/evaluate_cvf_provider_lane_certification.py
```

Run a provider canary to add a new receipt:

```bash
python scripts/run_cvf_provider_live_canary.py --provider alibaba --save-receipt
python scripts/run_cvf_provider_live_canary.py --provider deepseek --save-receipt
python scripts/run_cvf_provider_live_canary.py --provider openai --save-receipt
```

Check release readiness without live API calls:

```bash
python scripts/check_cvf_provider_release_readiness.py
```

Operator runbook (when to smoke, canary, save receipt, downgrade, certify):

- [`docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`](CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md)
