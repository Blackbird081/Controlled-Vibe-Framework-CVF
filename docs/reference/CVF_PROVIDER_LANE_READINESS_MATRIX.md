# CVF Provider Lane Readiness Matrix

**Last updated:** 2026-05-09 (OpenAI `gpt-4o-mini` promoted to CERTIFIED)<br>
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
| DeepSeek | `deepseek-chat` | `CERTIFIED` | [20260421-114125-19515e](../audits/deepseek-canary/CVF_RECEIPT_20260421-114125-19515e.md) | 3 consecutive PASS 6/6 | Slower (62–155 s observed). User-paid billing. |
| OpenAI | `gpt-4o-mini` | `CERTIFIED` | [20260509-141626-fa4465](../evidence/provider-lane-receipts/openai/RECEIPT_20260509-141626-fa4465.json) | 3 consecutive PASS 6/6 | Operator-paid OpenAI billing; certified lane is `gpt-4o-mini`, not every OpenAI model. |

---

## Evidence Indexes

- Alibaba: [`docs/audits/alibaba-canary/INDEX.md`](../audits/alibaba-canary/INDEX.md)
- DeepSeek: [`docs/audits/deepseek-canary/INDEX.md`](../audits/deepseek-canary/INDEX.md)
- OpenAI: [`docs/audits/openai-canary/INDEX.md`](../audits/openai-canary/INDEX.md)

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
python scripts/run_cvf_provider_live_canary.py --provider openai --save-receipt
```

Check release readiness without live API calls:

```bash
python scripts/check_cvf_provider_release_readiness.py
```

Operator runbook (when to smoke, canary, save receipt, downgrade, certify):

- [`docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`](CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md)
