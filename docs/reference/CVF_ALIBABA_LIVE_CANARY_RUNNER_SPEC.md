# CVF Alibaba Live Canary Runner — Operator Spec

Memory class: POINTER_RECORD
Date: 2026-04-21
Tranche: CVF-W110-T1
Authorization: CVF-W110-T1-GC018-2026-04-21

---

## Purpose

The Alibaba Live Canary Runner is an operator instrument for detecting regressions
on the Alibaba execution lane before production-facing changes propagate further.
It runs 6 locked front-door scenarios against the live Alibaba API and returns a
structured evidence receipt.

The runner wraps existing proven test files — it does **not** mutate them.

---

## Trigger Interface

```bash
# Prerequisite: ALIBABA_API_KEY must be set in environment
export ALIBABA_API_KEY=sk-...

# Dry run (stdout only, no file written)
python scripts/run_cvf_alibaba_live_canary.py

# Full run with evidence receipt written to docs/audits/alibaba-canary/
python scripts/run_cvf_alibaba_live_canary.py --save-receipt
```

Exit codes:
- `0` — all 6 scenarios PASS
- `1` — one or more scenarios FAIL
- `2` — ALIBABA_API_KEY absent; all scenarios skipped

---

## Locked Scenario Set

These 6 scenarios are frozen for W110-T1. Any addition requires a new GC-018.

| ID | Template | Minimum output | Key quality signals |
|---|---|---|---|
| S1 | `app_builder_complete` | 500 chars | Requirements Overview, Acceptance Criteria, Handoff Boundaries |
| S2 | `api_design` | 450 chars | Operations/Payloads, approval/Phê Duyệt, Checklist |
| S3 | `code_review` | 400 chars | Intended Outcome, Main Risks, Builder Handoff, Checklist |
| S4 | `documentation` | 400 chars | What Document Is For, Main Flow/Steps, Checklist, SRE/P1 |
| S5 | `web_ux_redesign_system` | 600 chars | Review Gate, QA Rules/Approval, routes/auth/API |
| S6 | `data_analysis` | 450 chars | Data We Looked At, Suggests/Insight, Recommended Actions, Checklist |

Anti-pattern check (all scenarios): output must **not** match `choose frameworks`,
`pick a stack`, `run a regression analysis`, `choose API style`, etc.

---

## Evidence Receipt

Each run with `--save-receipt` writes two files to `docs/audits/alibaba-canary/`:

**`RECEIPT_<run-id>.json`** — machine-readable, contains:
- `run_id`, `timestamp`, `provider`, `model`
- per-scenario: `status`, `duration_ms`, `quality_signals`
- `overall_status`, `pass_count`, `fail_count`, `skip_count`

**`RECEIPT_<run-id>.md`** — human-readable table + overall verdict

`docs/audits/alibaba-canary/INDEX.md` is updated with each new receipt entry.

---

## Cadence Guidance

| Trigger event | Recommended action |
|---|---|
| Before merging any change to `/api/execute` route | Run canary; PASS required |
| Before any public-facing template content change | Run canary; PASS recommended |
| After provider credential rotation | Run canary; PASS required |
| Weekly regression baseline | Run canary with `--save-receipt` |
| After any Alibaba SDK/dependency upgrade | Run canary; PASS required |

---

## Regression Response Protocol

| Outcome | Operator action |
|---|---|
| All PASS | Proceed; receipt is audit evidence |
| 1–2 FAIL | Investigate before proceeding; do not merge to main without resolution |
| 3+ FAIL or all SKIP | Hard stop; escalate before any further changes to execute path |

---

## Proof Source

- Live test file: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.front-door-rewrite.alibaba.live.test.ts`
- Provider implementation: `EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/providers/alibaba-dashscope-provider.ts`
- Env helper: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/lib/alibaba-env.ts`

---

## Exclusions

- Multi-provider (Anthropic, OpenAI): not in scope for this spec
- UI trigger surface: not in scope for W110-T1
- `web_build_handoff` scenario: not locked in this tranche
- Scenario content mutation: not permitted without new GC-018
