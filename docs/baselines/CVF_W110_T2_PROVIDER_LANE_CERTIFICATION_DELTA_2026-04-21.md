# CVF W110-T2 Provider Lane Certification and Selection — Baseline Delta

**Date:** 2026-04-21  
**Tranche:** W110-T2  
**Baseline type:** IMPLEMENTATION_DELTA  

---

## What Was Delivered

### CP1 — Status Taxonomy + Matrix

**New file:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.ts`

- Exports `LANE_STATUSES` const array of 7 canonical statuses: `UNCONFIGURED`, `BLOCKED`, `LIVE`, `CANARY_PASS`, `CERTIFIED`, `DEGRADED`, `EXPERIMENTAL`
- Exports `LaneStatus` type and `LaneRecord` / `ReceiptSummary` interfaces
- Exports `classifyFromReceipts(receipts)` — pure function that derives lane status from ordered receipt history (oldest first)
- Certification window: 3 consecutive PASS 6/6

**New file:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.test.ts`

- 11 unit tests covering all 5 classifiable statuses + real Alibaba/DeepSeek history fixtures
- Confirms: Alibaba `FAIL+3xPASS → CERTIFIED`, DeepSeek `8xFAIL+1xPASS → CANARY_PASS`

**New file:** `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`

- Canonical provider matrix: Alibaba (`CERTIFIED`) + DeepSeek (`CANARY_PASS`)
- Claim boundary statement: multi-provider operability proven; provider parity not claimed
- Links to evidence indexes, canary runners, certification evaluator

### CP2 — Generalized Canary Runner

**New file:** `scripts/run_cvf_provider_live_canary.py`

- Unified runner: `--provider alibaba` or `--provider deepseek`
- Optional `--model` override
- Reads API key from env vars or `.env.local`; never prints secrets
- Exit codes: 0=PASS, 1=FAIL, 2=key missing, 3=unsupported provider
- Writes receipts to provider-specific `docs/audits/<provider>-canary/` folders
- Backward compatible: existing `run_cvf_alibaba_live_canary.py` and `run_cvf_deepseek_live_canary.py` remain unchanged

### CP3 — Certification Evaluator

**New file:** `scripts/evaluate_cvf_provider_lane_certification.py`

- Reads `RECEIPT_*.json` files from each provider audit folder
- Applies same classification logic as `classifyFromReceipts()` in Python
- Prints readiness matrix table or `--json` output
- Shows consecutive pass tail count vs 3-run certification window
- Confirmed output: Alibaba `CERTIFIED` (4 receipts, 3/3 tail), DeepSeek `CANARY_PASS` (9 receipts, 1/3 tail)

### CP4 — UI/Docs Productization

**Modified:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/ai/types.ts`

- Added `laneStatus: LaneStatus` to `ProviderStatus` interface

**Modified:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/providers/route.ts`

- Added `KNOWN_LANE_STATUS` static map: `alibaba → CERTIFIED`, `deepseek → CANARY_PASS`
- Added `laneStatusFor()` helper: returns `UNCONFIGURED` when no key, else map lookup or `EXPERIMENTAL`
- All 6 provider entries now include `laneStatus` field
- Added `isDeepSeekApiKeyConfigured()` import (replaces raw `process.env.DEEPSEEK_API_KEY` check)

**Modified:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/providers/route.test.ts`

- Added 4 new tests: UNCONFIGURED for all when no keys, CERTIFIED for Alibaba, CANARY_PASS for DeepSeek, EXPERIMENTAL for OpenAI

**Modified:** `AGENT_HANDOFF.md`

- Updated multi-provider operability bullet to reflect W110-T1 PASS + W110-T2 in progress
- Updated "Next Action" section to name W110-T2 as the active tranche
- Updated bounded claim language from "multi-provider parity unclaimed" to "operability proven, parity not claimed"

**Modified:** `README.md`

- Updated multi-provider badge to show `Alibaba CERTIFIED | DeepSeek CANARY_PASS`
- Updated status table row for "Multi-provider operability"
- Added `CVF_PROVIDER_LANE_READINESS_MATRIX.md` to canonical claim boundary links

---

## Test Verification

| Test | Result |
|---|---|
| `src/lib/provider-lane-status.test.ts` (11 tests) | PASS |
| `src/lib/deepseek-env.test.ts` (4 tests) | PASS |
| `src/app/api/providers/route.test.ts` (8 tests) | PASS |
| `scripts/evaluate_cvf_provider_lane_certification.py` | Run clean — Alibaba CERTIFIED, DeepSeek CANARY_PASS |
| Pre-existing `execute/route.test.ts` failures (3 tests) | Pre-existing; not caused by this tranche |

---

## Claim Boundary Preserved

> Multi-provider operability is proven. Provider parity is not claimed.  
> Provider economics (latency, cost, reliability) remain user-selected.
