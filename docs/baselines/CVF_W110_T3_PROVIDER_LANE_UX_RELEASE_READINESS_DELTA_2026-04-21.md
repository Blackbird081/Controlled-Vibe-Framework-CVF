# CVF W110-T3 Provider Lane UX and Release Readiness — Baseline Delta

**Date:** 2026-04-21  
**Tranche:** W110-T3  
**Baseline type:** IMPLEMENTATION_DELTA  

---

## What Was Delivered

### CP1 — Provider Status UI

**New file:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-metadata.ts`

- Exports `PROVIDER_LANE_EVIDENCE` static map: `alibaba → CERTIFIED`, `deepseek → CANARY_PASS`
- Exports `LANE_BADGE_STYLE` per `LaneStatus` (color/bg classes for Tailwind)
- Source for badge labels: `Certified`, `Canary Pass`, `Experimental`, etc.
- Claim boundary: no parity claim, no "best/fastest/cheapest" language

**Modified:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/Settings.tsx`

- Added import for `PROVIDER_LANE_EVIDENCE` and `LANE_BADGE_STYLE`
- Added lane status badge in provider card header (below description text)
- Badge shows: label + pass window (e.g. `Certified 3/3 PASS`)
- Tooltip includes operator note + "User-paid provider lane" copy
- Badge renders only for lanes with canary evidence (alibaba, deepseek); others unchanged

**Modified:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/components/ProviderSwitcher.tsx`

- Added import for `PROVIDER_LANE_EVIDENCE` and `LANE_BADGE_STYLE`
- Added lane badge in compact dropdown items (below model text)
- Added lane badge in full-size grid items (between model and key status)
- When provider is selected, badge uses `bg-white/20 text-white` for contrast

### CP2 — Operator Runbook

**New file:** `docs/reference/CVF_PROVIDER_LANE_OPERATOR_RUNBOOK.md`

Seven sections:
1. When To Run Smoke
2. When To Run Full Canary
3. When To Save Receipt
4. When NOT To Save Receipt
5. Downgrade Protocol
6. DeepSeek Certification Path (operator-gated, paid, explicit consent required)
7. Release Readiness Check

### CP3 — Release Readiness Gate

**New file:** `scripts/check_cvf_provider_release_readiness.py`

- Calls `evaluate_cvf_provider_lane_certification.py --json` (no live API calls)
- Prints certified/canary-pass/degraded lane summary with receipt paths
- Exit 0 if ≥1 CERTIFIED (prints "RELEASE READY")
- Exit 0 with warning if only CANARY_PASS lanes (multi-provider operability proven)
- Exit 1 if no receipts or evaluator fails
- Confirmed output: Alibaba CERTIFIED, DeepSeek CANARY_PASS, exit 0

### CP4 — Optional DeepSeek Certification Repeat

Not executed. Operator approval required (cost + time). DeepSeek is at `CANARY_PASS` (1/3). Two more saved PASS 6/6 canaries would promote to `CERTIFIED`. Commands in runbook Section 6.

---

## Claim Boundary Preserved

> Provider lane status is evidence-backed. CVF proves governed multi-provider operability;  
> users choose provider economics.

---

## TypeScript Check

No errors in new files. Pre-existing errors in `useAgentChat.test.ts` (missing `deepseek` in test mocks) and live test files are unrelated to this tranche.
