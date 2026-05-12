# GC-018 Continuation Candidate — EA Track E: DLP Quality Benchmark

```text
GC-018 Continuation Candidate
- Candidate ID: GC018-EA-TRACK-E-2026-05-13
- Date: 2026-05-13
- Parent roadmap / wave: docs/roadmaps/CVF_EA_ENHANCEMENT_ROADMAP_2026-05-12.md
- Proposed scope: Establish an offline benchmark measuring the quality of the
  CVF DLP/Redaction engine: false positive rate (safe content blocked) and false
  negative rate (PII passed through). Synthetic corpus only — no real PII.
  Track A prerequisite: COMPLETE (commit 158309f). DLP phase latency is now
  measurable via governance-tax-logger.
- Continuation class: REALIZATION
- Active quality assessment: EA Tracks A/B/C/D all delivered clean (lint/tsc/
  test/build PASS). Track A governance tax baseline operational. Track D provider
  policy engine deployed. All hard gates PASS. No open blockers.
- Assessment date: 2026-05-13
- Weighted total: 7.0/10
- Lowest dimension: Decision value (DLP engine is functional; benchmark improves
  verifiability claim, not correctness — no known DLP failures to fix)
- Quality-first decision: EXPAND_NOW
- Why expansion is still the better move now: CVF makes a "DLP protection" claim
  but has zero precision/recall evidence for that claim. Track E converts the
  claim from documentation-only to evidence-backed. The DLP engine is pure regex
  (no AI call, no network), making the benchmark low-cost and fully offline.
  Track A is complete so DLP phase latency is now measurable as a baseline.
- Quality protection commitments:
  1. Synthetic corpus MUST NOT contain any real PII — all identifiers are
     clearly fabricated (example.com, 0912345678 test number, etc.)
  2. Corpus file committed to docs/benchmark/dlp/ (public-safe synthetic data
     only; no real email/phone/key values that could be mistaken for real PII)
  3. Benchmark script runs fully offline — no live provider call, no network
  4. Benchmark MUST NOT change DLP logic — measure only, do not fix
  5. All existing tests (66) must continue to PASS unchanged
  6. No new hard gate logic — benchmark output is evidence, not a gate
- Why now: Five EA tracks authorized/delivered (A/B/C/D complete). Track E is the
  final track. DLP is the only CVF control without a quality measurement. This
  closes the verifiability gap for the entire EA Enhancement sequence.
- Active-path impact: MINIMAL — new script + new test file + new benchmark doc;
  does not touch route.ts, guard contract, or any existing source file
- Risk if deferred: DLP protection claim remains documentation-only with no
  precision/recall evidence. Operators cannot assess DLP fitness for their data.
- Lateral alternative considered: YES
- Why not lateral shift: Alternative is to document DLP as "best-effort regex"
  and accept zero measurement. Acceptable for local dev but blocks any claim
  that CVF provides quantifiable data protection. Track E is the minimum viable
  DLP evidence layer.
- Real decision boundary improved: YES — converts DLP from assertion to
  measured control with documented precision/recall baseline
- Expected enforcement class: EVIDENCE_BASELINE (offline measurement, not a
  runtime gate; documents current DLP capability boundary)
- Required evidence if approved:
  - scripts/run_dlp_benchmark.py runs and outputs precision/recall/F1
  - src/lib/dlp-benchmark.test.ts PASS (unit tests for benchmark helpers)
  - docs/benchmark/dlp/dlp-benchmark-v1.json generated and committed
  - docs/benchmark/dlp/dlp-quality-baseline.md written with baseline metrics
  - Existing 66 tests PASS unchanged
  - npm run lint PASS (max-warnings=0)
  - npx tsc --noEmit PASS
  - npm run build PASS
  - python scripts/check_public_surface.py PASS

Depth Audit
- Risk reduction: 2 — quantifies DLP false negative/positive rates; removes
  "unknown quality" from the DLP protection claim; documents known limits
- Decision value: 1 — DLP engine is functional; benchmark adds verifiability
  evidence, not a new control. Claim improvement is real but not a hard blocker.
- Machine enforceability: 2 — benchmark is code-executed with deterministic
  synthetic corpus; metrics are reproducible on every run
- Operational efficiency: 2 — benchmark script runs in <1s (pure regex, no
  network); can be added to CI without meaningful overhead
- Portfolio priority: 1 — last of 5 EA tracks; completes the EA Enhancement
  sequence but does not unlock further work (no pending dependency)
- Total: 8/10
- Decision: CONTINUE
- Reason: Depth audit score 8/10. Portfolio priority is 1 (not 0) — completing
  the EA sequence has inherent value for coherence. All other dimensions score
  1-2. No hard-stop triggered.

Authorization Boundary
- Authorized now: YES
- Next batch name: EA-TRACK-E-PHASE-1
- Scope authorized: Offline DLP quality benchmark only. Synthetic corpus.
  Precision/recall/F1 measurement of existing DLP engine. No DLP logic changes.
- Scope NOT authorized in this GC-018:
  - Any change to DLP logic, patterns, or allowlists
  - AI-assisted DLP (model-based redaction) — separate GC-018 required
  - Real PII in corpus — absolutely prohibited
  - Hard gate addition based on benchmark results (requires separate GC-018)
  - Human review of DLP outputs — out of scope for this tranche
- Reopen trigger for DLP improvements: Baseline F1 < 0.80 AND operator reports
  false negative incident + user explicit authorization for a DLP remediation GC
```

---

## Implementation Plan — Phase E.1

### Files to create

| File | Purpose |
| --- | --- |
| `src/lib/dlp-benchmark.ts` | Benchmark runner: runs corpus through `applyDLPPatterns`, computes precision/recall/F1 |
| `src/lib/dlp-benchmark.test.ts` | Unit tests for benchmark helpers and corpus coverage |
| `docs/benchmark/dlp/dlp-corpus-v1.json` | Synthetic test corpus (true PII + false PII + adversarial) |
| `docs/benchmark/dlp/dlp-benchmark-v1.json` | Generated baseline metrics (output of benchmark run) |
| `docs/benchmark/dlp/dlp-quality-baseline.md` | Human-readable baseline doc with claim boundary |
| `scripts/run_dlp_benchmark.py` | CLI runner: imports corpus, calls TS benchmark via node, prints results |

### Files to modify

| File | Change |
| --- | --- |
| `governance/public-surface-manifest.json` | Allowlist GC-018 review doc + dlp corpus + baseline |

### Corpus design

Three categories of test cases:

| Category | Expected DLP behavior | Metric contribution |
| --- | --- | --- |
| True PII (must redact) | `wasRedacted: true`, match found | False negative if missed |
| False PII (must NOT redact) | `wasRedacted: false`, no match | False positive if blocked |
| Adversarial (encoded/obfuscated PII) | Document-only; expected: may miss | Known limit, not a gate |

### Metrics

```
precision = true_redacted / (true_redacted + false_redacted)
recall    = true_redacted / (true_redacted + false_missed)
f1        = 2 * precision * recall / (precision + recall)
```

Baseline gate (documentation threshold, not a hard code gate):
- F1 ≥ 0.80: PASS (acceptable for current regex-only engine)
- F1 < 0.80: ADVISORY (document limitation, do not block)

### Boundary (re-stated)

- Benchmark runs against `applyDLPPatterns` directly (no HTTP, no provider)
- Does NOT change DLP logic, patterns, or thresholds
- Adversarial category is documentation-only — known limits, not failures
- No real PII in corpus — all values are clearly synthetic
