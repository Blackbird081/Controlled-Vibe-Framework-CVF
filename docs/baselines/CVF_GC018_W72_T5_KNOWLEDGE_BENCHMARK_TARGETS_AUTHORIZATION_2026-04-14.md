# CVF GC-018 W72-T5 — Knowledge Benchmark Targets Authorization

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Candidate ID: GC018-W72-T5-KNOWLEDGE-BENCHMARK-TARGETS
> Doctrine intake: `docs/reference/CVF_KNOWLEDGE_PREFERENCE_BENCHMARK_CRITERIA_2026-04-14.md`
> Fast lane audit: `docs/baselines/CVF_W72_T5_KNOWLEDGE_BENCHMARK_TARGETS_GC021_FAST_LANE_AUDIT_2026-04-14.md`
> Branch: `main`

---

## Prerequisites Confirmed

| Prerequisite | Status |
|---|---|
| Doctrine criteria filed in repo truth | CONFIRMED — W72-T3 defined the 4 knowledge benchmark targets |
| Wave type declared as `implementation-capability` | CONFIRMED — bounded CPF instrumentation extension |
| No-new-surface rule confirmed | CONFIRMED — additive enum extension only |
| CPF baseline clean (2026-04-14) | CONFIRMED — tranche baseline inherited from W72-T4 |
| GC-023 compliance pre-checked | CONFIRMED — 1 source file + 1 test file delta only |
| Boundary: benchmark-only instrumentation | CONFIRMED — no runtime authority or policy default change |

---

## Authorized Scope

Authorize a narrow CPF update to `PerformanceBenchmarkHarnessContract`:

- extend `BenchmarkTarget` with:
  - `KNOWLEDGE_QUERY`
  - `KNOWLEDGE_RANKING`
  - `KNOWLEDGE_STRUCTURAL_INDEX`
  - `KNOWLEDGE_COMPILED_CONTEXT`
- add targeted tests proving `initRun()` accepts and returns each new target
- keep `evidenceClass: PROPOSAL_ONLY` unchanged
- do not run benchmarks and do not promote any preference default

This authorization closes the criteria-to-instrumentation gap created by W72-T3. It does **not**
authorize benchmark execution evidence, GC-026 tracker sync, or policy promotion.

---

## Authorization Decision

**AUTHORIZED — proceed with W72-T5 immediately.**

Guardrails:
- CPF only
- no API or behavior change outside accepted `BenchmarkTarget` values
- no new architecture surface
- no change to `governanceNote`, evidence class, or benchmark promotion rules

---

*Filed: 2026-04-14*
*Authorization: OPERATOR (GC018-W72-T5-KNOWLEDGE-BENCHMARK-TARGETS)*
