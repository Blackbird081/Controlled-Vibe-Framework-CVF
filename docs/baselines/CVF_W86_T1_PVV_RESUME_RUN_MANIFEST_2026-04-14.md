# CVF W86-T1 PVV Resume Run Manifest

Memory class: SUMMARY_RECORD
Date: 2026-04-14
Tranche: W86-T1 — PVV Lane Resume
Authorization: `docs/baselines/CVF_GC018_W86_T1_PVV_LANE_RESUME_AUTHORIZATION_2026-04-14.md`
Status: FROZEN — authorized for execution

---

## 1. Scope Decision: Variant B (Not Variant A)

This manifest explicitly chooses **Variant B — Non-Coder Quality Focus**, NOT Variant A (resume of frozen W66-T1 CP3A full batch).

**Justification:**

The W66-T1 CP3A full-batch path (810 runs, W66-T1 CP1 corpus × multi-lane) would generate additional evidence on enterprise governance process quality — whether CVF applies its own rules correctly (GC-018 evaluation, audit review, conformance, risk classification). That gap was addressed by CP3B.

The **primary unproven question post-W85** is different: does CVF governed execution add product value for non-coder vibe-coding use cases? This requires a purpose-built non-coder task set, not a governance-process corpus at scale.

Therefore: W86-T1 uses the W86-T1-NC corpus (10 non-coder tasks, frozen in GC-018) and limits runs to 40 API calls. This maximizes signal-per-call on the highest-priority question.

The W66-T1 CP3A full-batch path remains on record as frozen prior authorization and may be resumed in a future tranche if the operator decides provider-scale validation is the next priority after W86-T1.

---

## 2. Run Matrix

| Run ID | Task | Config | Run # | Provider | Model | Mode |
|---|---|---|---|---|---|---|
| W86-R-001 | NC-001 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-002 | NC-001 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-003 | NC-001 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-004 | NC-001 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-005 | NC-002 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-006 | NC-002 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-007 | NC-002 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-008 | NC-002 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-009 | NC-003 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-010 | NC-003 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-011 | NC-003 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-012 | NC-003 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-013 | NC-004 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-014 | NC-004 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-015 | NC-004 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-016 | NC-004 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-017 | NC-005 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-018 | NC-005 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-019 | NC-005 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-020 | NC-005 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-021 | NC-006 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-022 | NC-006 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-023 | NC-006 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-024 | NC-006 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-025 | NC-007 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-026 | NC-007 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-027 | NC-007 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-028 | NC-007 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-029 | NC-008 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-030 | NC-008 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-031 | NC-008 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-032 | NC-008 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-033 | NC-009 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-034 | NC-009 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-035 | NC-009 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-036 | NC-009 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |
| W86-R-037 | NC-010 | CFG-A | 1 | Alibaba | qwen-max | Direct API |
| W86-R-038 | NC-010 | CFG-A | 2 | Alibaba | qwen-max | Direct API |
| W86-R-039 | NC-010 | CFG-B | 1 | Alibaba | qwen-max | /api/execute |
| W86-R-040 | NC-010 | CFG-B | 2 | Alibaba | qwen-max | /api/execute |

Total: **40 runs**

---

## 3. Execution Prerequisites

### CFG-A (Direct API runs)

- Alibaba API key available in environment as `ALIBABA_API_KEY`
- Direct HTTP POST to `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- No CVF wrapping; minimal system prompt: "You are a helpful assistant."
- Model: `qwen-max`; max_tokens: 2048; temperature: 0.7

### CFG-B (Governed path runs)

- `cvf-web` server running with `ALIBABA_API_KEY` in environment
- CVF provider config must route Alibaba to `qwen-max` (not `qwen-turbo`)
- POST to `http://localhost:3000/api/execute` (or deployed cvf-web URL)
- Request body: `{ "intent": "<task prompt>", "context": "non-coder product task", "action": "analyze <task-id>" }`
- Note on authority gate: intent must use an action-compatible prefix per handoff rule — use `"action": "analyze NC-00X"` format to pass authority gate
- Record: HTTP status, `guardResult`, `providerRouting`, full response body

---

## 4. Evidence Storage

All run evidence collected in: `docs/baselines/CVF_W86_T1_PVV_NC_CORPUS_RUN_EVIDENCE_2026-04-14.md`

Per-run record fields (from W66-T1 CP1 rubric §8):
- run_id, task_id, configuration_id, run_number
- raw_output (truncated to 500 chars for storage; full output in jsonl)
- usefulness_score, correctness_score, completeness_score, justification_score, actionability_score
- quality_total, quality_verdict
- governance_verdict (for HIGH_RISK tasks)
- rework_class, primary_failure_taxonomy
- catastrophic_miss: YES/NO
- notes

---

## 5. Post-Run Gate Evaluation

After all 40 runs, evaluate against GC-018 §6 gates:

- Gate A: HIGH_RISK governance PASS rate
- Gate B: Quality parity (CFG-B vs CFG-A)
- Gate C: Non-coder usability rate (CFG-B)
- Gate D: Zero catastrophic misses
- Gate E: No over-blocking of NORMAL tasks

Results recorded in post-run assessment.

---

*Manifest version: 1.0 / FROZEN — 2026-04-14*
*Authorization: GC-018-W86-T1 (AUTHORIZED)*
*Total authorized runs: 40*
