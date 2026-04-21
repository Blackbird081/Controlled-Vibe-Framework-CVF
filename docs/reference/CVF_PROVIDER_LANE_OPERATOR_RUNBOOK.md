# CVF Provider Lane Operator Runbook

**Applies to:** CVF multi-provider live canary lane management  
**Taxonomy reference:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/provider-lane-status.ts`  
**Matrix reference:** `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md`

---

## Claim Boundary

> Provider lane status is evidence-backed. CVF proves governed multi-provider operability;  
> users choose provider economics. Speed, cost, and reliability are lane-specific.

---

## 1 — When To Run Smoke

A **smoke check** verifies the API key resolves and the provider endpoint returns a live response. It does NOT run the full 6-scenario canary and does NOT require saving a receipt.

Run smoke:

- after rotating or replacing a provider API key
- after changing provider env vars in `.env.local`
- before a release if provider status is referenced in release notes or the UI
- when a new key is added for the first time

How to smoke:

```bash
python scripts/run_cvf_multi_provider_live_smoke.py
```

This exits 0 if at least one provider responds. It does not spend significant credits.

---

## 2 — When To Run Full Canary

A **full canary** runs 6 locked front-door scenarios against one provider lane and records a pass/fail result per scenario.

Run the full canary:

- before promoting a lane to `CERTIFIED`
- after changing `/api/execute` provider routing or template `intentPattern`
- after modifying locked front-door templates (`app_builder_complete`, `api_design`, `code_review`, `documentation`, `web_ux_redesign_system`, `data_analysis`)
- as part of a deliberate certification sequence

Commands:

```bash
python scripts/run_cvf_provider_live_canary.py --provider alibaba
python scripts/run_cvf_provider_live_canary.py --provider deepseek
```

These print results without saving receipts. Exit codes: `0`=PASS, `1`=FAIL, `2`=key missing.

---

## 3 — When To Save Receipt

Saving a receipt writes structured JSON + a Markdown file to `docs/audits/<provider>-canary/` and appends an entry to `INDEX.md`.

Save a receipt:

- when building a certification evidence trail (3 consecutive PASS required for `CERTIFIED`)
- before a release where lane status will be referenced
- when investigating a regression after a prior PASS

Commands:

```bash
python scripts/run_cvf_provider_live_canary.py --provider alibaba --save-receipt
python scripts/run_cvf_provider_live_canary.py --provider deepseek --save-receipt
```

---

## 4 — When NOT To Save Receipt

Do not save a receipt:

- during exploratory debugging runs (output is not certification evidence)
- when testing key configuration ("is my key set correctly?")
- when the canary fails due to missing key, network error, or local setup issue unrelated to provider behavior
- during iterative template development where output structure is still changing

Non-certification runs waste nothing — just omit `--save-receipt`.

---

## 5 — Downgrade Protocol

The certification evaluator (`scripts/evaluate_cvf_provider_lane_certification.py`) determines lane status from the saved receipt history. Apply the following rules manually if immediate status update is needed:

| Event | New status |
|---|---|
| Latest saved canary FAIL after prior PASS | `DEGRADED` |
| Auth / billing / rate-limit blocks all execution | `BLOCKED` |
| API key removed or env var unset | `UNCONFIGURED` |
| Latest canary PASS but fewer than 3 consecutive | `CANARY_PASS` |
| 3 consecutive PASS 6/6 receipts saved | `CERTIFIED` |

After a status change, update `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` and the `KNOWN_LANE_STATUS` map in `src/app/api/providers/route.ts`.

---

## 6 — DeepSeek Certification Path

DeepSeek `deepseek-chat` is currently `CERTIFIED` (3 consecutive PASS 6/6 — 2026-04-21). To re-certify after a `DEGRADED` event:

**Prerequisite:** operator explicitly agrees to cost and time of two additional live canary runs. DeepSeek is significantly slower than Alibaba (observed 67–240 s per scenario) and each run costs provider credits.

**Steps (operator-approved only):**

```bash
python scripts/run_cvf_provider_live_canary.py --provider deepseek --save-receipt
# wait for run to complete (may take 20–40 minutes)
python scripts/run_cvf_provider_live_canary.py --provider deepseek --save-receipt
# wait for run to complete
python scripts/evaluate_cvf_provider_lane_certification.py
```

If both saved runs are PASS 6/6, the evaluator will report `CERTIFIED`.

**If either run fails:**

- the evaluator will report `CANARY_PASS` (if latest is still PASS) or `DEGRADED` (if latest fails)
- do not manually override the status — trust the receipt evidence
- CVF multi-provider operability remains proven regardless of DeepSeek certification status

**After promotion:** update `KNOWN_LANE_STATUS` in `src/app/api/providers/route.ts` and the readiness matrix.

---

## 7 — Release Readiness Check

Run without live API calls:

```bash
python scripts/check_cvf_provider_release_readiness.py
```

This reads saved receipts and reports lane readiness. Exit 0 if at least one lane is `CERTIFIED` or `CANARY_PASS`. Exit 1 if no receipts exist or evaluation fails.

---

## Reference

| Tool | Purpose |
|---|---|
| `scripts/run_cvf_provider_live_canary.py` | Run 6-scenario canary for one provider |
| `scripts/evaluate_cvf_provider_lane_certification.py` | Classify lane status from receipt history |
| `scripts/check_cvf_provider_release_readiness.py` | Release gate check (no live API calls) |
| `scripts/run_cvf_multi_provider_live_smoke.py` | Quick smoke test across configured providers |
| `docs/reference/CVF_PROVIDER_LANE_READINESS_MATRIX.md` | Canonical lane readiness matrix |
| `docs/audits/alibaba-canary/INDEX.md` | Alibaba receipt index |
| `docs/audits/deepseek-canary/INDEX.md` | DeepSeek receipt index |
