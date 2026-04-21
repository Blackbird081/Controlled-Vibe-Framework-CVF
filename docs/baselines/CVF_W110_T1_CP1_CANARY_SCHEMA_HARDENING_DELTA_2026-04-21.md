# CVF W110-T1 CP1 — Canary Schema Hardening Delta

Memory class: BASELINE_NOTE

> Date: 2026-04-21
> Tranche: W110-T1 Front-Door Live Canary Runner (Alibaba-only)
> Scope: post-CP1 validation hardening
> Status: FILED

---

## Reason

A manual rerun of `scripts/run_cvf_alibaba_live_canary.py` found one false negative on
`api_design`: Alibaba returned a valid Vietnamese checklist heading (`Danh Sách Kiểm Tra`),
while the live assertion only accepted the English word `Checklist`.

The same review also found that the runner receipt schema did not yet include
`quality_signals`, even though the W110 execution plan and operator spec defined that field.

---

## Changes

- `route.front-door-rewrite.alibaba.live.test.ts`
  - `api_design` now accepts bilingual checklist headings:
    `Checklist | Danh Sách Kiểm Tra | Kiểm Tra`
- `scripts/run_cvf_alibaba_live_canary.py`
  - receipt rows now include `quality_signals`
  - runner can resolve `ALIBABA_API_KEY` / `DASHSCOPE_API_KEY` from shell env or local
    `cvf-web/.env.local`
- `docs/reference/CVF_ALIBABA_LIVE_CANARY_RUNNER_SPEC.md`
  - documents the local env fallback and quality signal semantics
- `docs/audits/alibaba-canary/`
  - new clean receipt committed after schema hardening

---

## Verification

```powershell
python -m py_compile scripts/run_cvf_alibaba_live_canary.py
python scripts/run_cvf_alibaba_live_canary.py --save-receipt
```

Observed clean receipt: `20260421-032009-4a22b6` — `6/6 PASS` with per-scenario
`quality_signals` recorded.

---

## Decision

W110-T1 CP1 remains CLOSED. This delta tightens the canary runner evidence schema and removes a
known bilingual false negative without changing the locked scenario set or expanding provider scope.
