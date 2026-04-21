# CVF W110-T1 Execution Plan — Front-Door Live Canary Runner (Alibaba-only)

Memory class: SUMMARY_RECORD
Date: 2026-04-21
Authorization: CVF-W110-T1-GC018-2026-04-21 (AUTHORIZED, Depth Audit total 9/10)
Decision baseline: docs/reviews/CVF_W110_GC018_ALIBABA_LIVE_CANARY_RUNNER_2026-04-21.md

---

## Objective

Convert 6 proven Alibaba front-door scenarios into a reusable operator instrument
that runs on demand, returns structured pass/fail, and writes an evidence receipt
to `docs/audits/alibaba-canary/`. Enables regression detection before any
production-facing change propagates further on the execute path.

---

## Canonical Baseline Lock

- Parent proof surface: `route.front-door-rewrite.alibaba.live.test.ts` (395 lines)
- Scenario set: locked at 6 (see GC-018 packet)
- Provider: Alibaba DashScope, model qwen-turbo
- Runner is R0 safe — no state mutation, no new provider contracts
- No modification to existing live test files

---

## Implementation Phases

### Phase 1 — Runner Script
**Target:** `scripts/run_cvf_alibaba_live_canary.py`

Operator invocation:
```
python scripts/run_cvf_alibaba_live_canary.py
python scripts/run_cvf_alibaba_live_canary.py --save-receipt
```

Behaviour:
- Detects `ALIBABA_API_KEY` in environment; exits with clear message if absent
- Shells out to `npm run test:run -- route.front-door-rewrite.alibaba.live.test.ts`
  from the cvf-web working directory
- Parses vitest output for per-test PASS / FAIL / SKIP
- Prints human-readable summary table to stdout
- With `--save-receipt`: writes JSON receipt + MD summary to
  `docs/audits/alibaba-canary/`
- Exit code 0 = all passed; 1 = one or more failed; 2 = skipped (no API key)

### Phase 2 — Evidence Receipt Format
**Target:** `docs/audits/alibaba-canary/RECEIPT_<run-id>.json` + `.md`

JSON receipt fields:
```json
{
  "run_id": "<ISO-timestamp>-<short-hash>",
  "timestamp": "<ISO 8601>",
  "provider": "alibaba",
  "model": "qwen-turbo",
  "triggered_by": "<operator identity or 'cli'>",
  "scenarios": [
    {
      "id": "S1",
      "template_id": "app_builder_complete",
      "status": "PASS | FAIL | SKIP",
      "duration_ms": 12345,
      "quality_signals": {
        "min_output_met": true,
        "keyword_matches": ["TaskFlow", "Acceptance Criteria", "Handoff Boundaries"],
        "antipattern_clean": true
      }
    }
  ],
  "overall_status": "PASS | FAIL | SKIP",
  "pass_count": 6,
  "fail_count": 0,
  "skip_count": 0
}
```

MD summary is a human-readable table + overall verdict, suitable for audit trail.

### Phase 3 — Storage Convention
**Target directory:** `docs/audits/alibaba-canary/`

- One receipt pair (`.json` + `.md`) per run
- File names: `RECEIPT_<YYYYMMDD-HHMMSS>-<6-char-run-hash>.json / .md`
- Receipts are append-only; no overwrites
- `docs/audits/alibaba-canary/INDEX.md` is updated by runner with each new receipt

### Phase 4 — Operator Documentation
**Target:** `docs/reference/CVF_ALIBABA_LIVE_CANARY_RUNNER_SPEC.md`

Spec covers: trigger interface, scenario lock rationale, receipt format, cadence
guidance, and regression response protocol.

---

## Gates

| Gate | Condition |
|---|---|
| G1 | `ALIBABA_API_KEY` present in environment |
| G2 | All 6 scenarios exit PASS on first clean run |
| G3 | First receipt committed to `docs/audits/alibaba-canary/` |
| G4 | Runner script passes `python -m py_compile` (syntax clean) |

---

## Evidence Required for Closure (CP1)

- `scripts/run_cvf_alibaba_live_canary.py` — committed, runnable
- `docs/audits/alibaba-canary/RECEIPT_<run-id>.json` — first clean receipt
- `docs/audits/alibaba-canary/RECEIPT_<run-id>.md` — human-readable summary
- `docs/reference/CVF_ALIBABA_LIVE_CANARY_RUNNER_SPEC.md` — operator spec
- `docs/baselines/CVF_W110_T1_CP1_ALIBABA_LIVE_CANARY_RUNNER_DELTA_2026-04-21.md`

---

## Exclusions

- Multi-provider expansion: not in scope
- Web UI canary surface: not in scope
- `web_build_handoff` scenario: not in scope
- Scenario content mutation: not in scope
