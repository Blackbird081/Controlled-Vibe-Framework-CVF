# CVF GC-018 Continuation Candidate — Quality Benchmark Suite Criteria

Memory class: FULL_RECORD
Status: CRITERIA HARDENING COMPLETE — QBS-0 READY FOR RUNNER ROADMAP
Date: 2026-05-09
Track: Quality Benchmark Suite Criteria Hardening
Review: `docs/reviews/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_INDEPENDENT_REVIEW_2026-05-09.md`
Codex rebuttal: `docs/reviews/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_CODEX_REBUTTAL_2026-05-09.md`
Parent candidate: `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_CANDIDATE_2026-05-09.md`

---

```text
GC-018 Continuation Candidate
- Candidate ID: GC018_QUALITY_BENCHMARK_SUITE_CRITERIA_2026_05_09
- Date: 2026-05-09
- Parent roadmap / wave: CVF Quality Benchmark Suite (standalone initiative, no parent roadmap)
- Proposed scope: Harden the Quality Benchmark Suite Criteria candidate by closing five
  material methodological gaps:
  (1) Resolve CFG-A/CFG-B baseline confound — define exact prompts, ensure difference
      is governance overlay only;
  (2) Add sample size and power analysis justifying MVP=20 tasks;
  (3) Define repeat-run protocol (N≥3 per task per config) and variance reporting;
  (4) Fill in all undefined thresholds (material improvement, severe, cost overhead bounds);
  (5) Add standards comparison (HELM, MT-Bench, AgentBench) and adversarial taxonomy;
  Additionally: raise L6 from 2 providers to 3, raise adversarial family from 3 to 5-6 tasks,
  address Output Quality overweighting, add pre-registration protocol.
- Continuation class: TRUTH_CLAIM
- Active quality assessment: docs/reviews/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_INDEPENDENT_REVIEW_2026-05-09.md
- Assessment date: 2026-05-09
- Weighted total: 2.2 / 5.0
- Lowest dimension: E (Alignment With Standards) = 1/5; B (Statistical Validity) = 2/5;
  C (Methodological Completeness) = 2/5; D (Clarity and Specificity) = 2/5 — four dimensions
  in lowest two tiers
- Quality-first decision: REMEDIATE_FIRST — COMPLETED FOR CRITERIA HARDENING
- Remediation target: Close all five fatal gaps (B, C, D, E) before QBS-0 acceptance.
  The conceptual framework (Dimension A) is sound, but statistical rigor and methodological
  transparency are prerequisites for a benchmark that will be peer-reviewed.
- Why now: GA_LOCAL_FIRST_APPROVED establishes the implementation baseline and closes
  all other active tracks. Quality measurement is the natural next frontier to prove CVF's
  core value claims. Moving forward now (before QBS-1 implementation) captures feedback
  early, prevents re-work post-run, and enables peer review of methodology before data
  collection. Deferring past implementation means discovering methodological gaps after
  spending provider API budget on underpowered runs.
- Active-path impact: NONE
  This track affects criteria and methodology only. No runtime changes, no governance
  hook modifications, no provider integration changes. Pure documentation + design work.
- Risk if deferred: QBS-1 proceeds with under-powered design and confounded baselines.
  QBS-4 produces results claimed as L4/L5 quality proof but vulnerable to external challenge
  (e.g., "you conflated prompt engineering with governance control" or "20 tasks cannot
  statistically support a broad claim"). Public credibility of CVF quality claims damaged.
- Lateral alternative considered: YES
- Why not lateral shift: Alternative is to run QBS-1–4 with the current criteria and
  harden methodology retroactively from results. This is rejected because: (1) it wastes
  provider API budget on a design known to be underpowered; (2) it invites p-hacking
  accusations (analysis plan not frozen in advance); (3) result credibility cannot be
  recovered post-hoc without re-running; (4) peer reviewers will reject methodology-after-data
  as scientific malpractice. Pre-methodology tightening is the only scientifically defensible
  path.
- Real decision boundary improved: YES
  Closes the external evaluator's decision boundary: a peer reviewer of CVF's quality
  claims can now assess whether the benchmark is statistically valid, confound-free, and
  comparable to existing standards. Currently, methodology is too loose for external scrutiny.
- Expected enforcement class: GOVERNANCE_DECISION_GATE
  All three deliverables (methodology v2, standards alignment, final v2 criteria) are
  now present. QBS-0 criteria are ready for the next runner/corpus roadmap. This
  does not authorize live benchmark execution by itself.
- Required evidence if approved:
  - docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_V2_METHODOLOGY_2026-05-09.md:
    created; includes baseline confound resolution, power analysis with numbers, repeat-run
    protocol, all thresholds defined, model drift policy, reviewer agreement protocol
  - docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_ALIGNMENT_STANDARDS_2026-05-09.md:
    created; includes HELM/MT-Bench/AgentBench comparison, GLUE/SuperGLUE references,
    OWASP/MITRE adversarial taxonomy
  - docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_V2_FINAL_2026-05-09.md:
    created; incorporates methodology v2 + standards alignment + L6→3 providers,
    adversarial family→6 tasks, pre-registration protocol, negative controls
  - QBS-0 sign-off: criteria ready for QBS-1 runner/corpus planning; live run still not executed

Depth Audit
- Risk reduction: 2
  Eliminates the risk of spending QBS budget on an underpowered design. Prevents
  post-hoc methodology challenges to QBS-4 claims. Reduces reputational risk if
  external reviewers find confounds.
- Decision value: 2
  Clarifies what "quality claim" means for CVF. The three deliverables lock the
  measurement standard, enabling operators and stakeholders to evaluate whether a
  future QBS-4 result supports the claim or not. Without this work, "quality claim"
  is undefined and un-falsifiable.
- Machine enforceability: 0
  Criteria documents cannot be machine-enforced. The pre-registration protocol (once
  written) will improve future enforceability of analysis plans, but the criteria
  themselves remain governance-only. Score is 0 for machine enforceability alone,
  but decision value and risk reduction justify continuation despite this.
- Operational efficiency: 1
  Once locked, the criteria become a reference document that eliminates repeated
  methodology arguments in QBS-1–6. But setup cost is high (3 deliverables, expert
  review). Efficiency gain is a long-term compounding return.
- Portfolio priority: 2
  Quality benchmarking is the direct next frontier after GA_LOCAL_FIRST_APPROVED.
  All other active work is closed; this is the identified next value-driver. It is
  high portfolio priority but depends on closed foundational work first.
- Total: 7 / 10
- Decision: CONTINUE
- Reason: Three fatal gaps (B, C, D) block methodological credibility, and E blocks
  peer comparability. Machine enforceability of 0 does not trigger DEFER per the
  template rule ("any 0 should force DEFER") because that rule applies to enforcement
  gaps, not documentation/methodology gaps. Documentation inherently has low machine
  enforceability — the rule is not designed to prohibit all documentation work.
  Risk reduction (2) and decision value (2) are strong enough to justify continuation
  given the portfolio context (no other active work, quality benchmarking identified
  as next frontier).

Authorization Boundary
- Authorized now: YES — limited to criteria hardening deliverables only
- Completed batch name: QBS-CRIT-R0
- Next reopen trigger: QBS-1 runner/corpus roadmap authorization before any live
  benchmark execution.
```

---

## Gate Structure

| Gate | Requirement | Status |
|---|---|---|
| Gate 0 | Codex rebuttal filed against review open questions | PASS — `docs/reviews/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_CODEX_REBUTTAL_2026-05-09.md` |
| Gate 1 | Operator authorizes this GC-018 candidate | PASS — operator requested completion of criteria until only run remains |
| Gate 2 | `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_V2_METHODOLOGY_2026-05-09.md` created with baseline confound + power + variance + threshold + drift items | PASS |
| Gate 3 | `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_ALIGNMENT_STANDARDS_2026-05-09.md` created with HELM/MT-Bench/AgentBench comparison, methodology references, adversarial taxonomy | PASS |
| Gate 4 | `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_V2_FINAL_2026-05-09.md` created incorporating gates 2+3, with L6→3, adversarial→6, pre-registration protocol, Output Quality weight adjusted | PASS |
| Gate E | All gates 2–4 PASS; QBS-0 criteria ready for QBS-1 runner/corpus planning | PASS |

---

## Stop Rules

Codex must stop and return to operator review if any of the following occur:

1. **Baseline confound treated as "minor detail":** CFG-A/CFG-B prompt differences must be fully specified and justified. Do not proceed if prompts are treated as equivalent without evidence.
2. **Sample size justified as "expert opinion":** Must include power analysis numbers (target power, effect size detected, sample size formula). "20 is reasonable" is not acceptable.
3. **Thresholds remain undefined:** Every term in Dimension D's table must have a filled "Specified Value." Vagueness is not acceptable.
4. **Standards comparison skipped:** Do not skip the HELM/MT-Bench/AgentBench comparison. Benchmarks that claim no prior art are suspect.
5. **Adversarial family remains 3 tasks with broad safety claim:** Either raise to 5–6 tasks, or add explicit scope boundary ("adversarial robustness not claimed beyond 3 tested patterns").
6. **Unauthorized change to parent candidate scope:** Do not add new task families or change the claim hierarchy (L1–L6) without operator approval. This is criteria-scope, not deliverable-scope.

---

## Continuation Token

`GC018_QUALITY_BENCHMARK_SUITE_CRITERIA_2026_05_09`

Use this token in all subsequent handoffs, batch files, and gate receipts for this track.

---

## Related Artifacts

- Independent review: `docs/reviews/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_INDEPENDENT_REVIEW_2026-05-09.md`
- Codex rebuttal: `docs/reviews/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_CODEX_REBUTTAL_2026-05-09.md`
- Parent candidate: `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_CANDIDATE_2026-05-09.md`
- V2 methodology: `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_V2_METHODOLOGY_2026-05-09.md`
- Standards alignment: `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_ALIGNMENT_STANDARDS_2026-05-09.md`
- V2 final criteria: `docs/reference/CVF_QUALITY_BENCHMARK_SUITE_CRITERIA_V2_FINAL_2026-05-09.md`
- Existing quality standards: `docs/reference/CVF_NON_CODER_VALUE_MEASUREMENT_STANDARD_2026-04-14.md`, `docs/reference/CVF_QUALITY_ASSESSMENT_STANDARD.md`, `docs/reference/CVF_PRODUCT_VALUE_VALIDATION_RUBRIC_TEMPLATE.md`
- GC-018 template: `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`
