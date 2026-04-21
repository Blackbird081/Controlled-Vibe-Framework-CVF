# CVF Provider Lane Readiness Matrix

**Last updated:** 2026-04-21  
**Computed by:** `scripts/evaluate_cvf_provider_lane_certification.py`  
**Status taxonomy:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.ts`

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
| DeepSeek | `deepseek-chat` | `CANARY_PASS` | [20260421-074637-0c0d3e](../audits/deepseek-canary/CVF_RECEIPT_20260421-074637-0c0d3e.md) | Latest PASS 6/6; 1 of 3 needed for CERTIFIED | Slower (67–240 s observed). User-paid billing. |

---

## Evidence Indexes

- Alibaba: [`docs/audits/alibaba-canary/INDEX.md`](../audits/alibaba-canary/INDEX.md)
- DeepSeek: [`docs/audits/deepseek-canary/INDEX.md`](../audits/deepseek-canary/INDEX.md)

---

## Claim Boundary

> Multi-provider operability is proven. Provider parity is not claimed.  
> Provider economics (latency, cost, reliability) remain user-selected.

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
```
