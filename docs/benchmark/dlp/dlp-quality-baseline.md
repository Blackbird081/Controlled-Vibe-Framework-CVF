# CVF DLP Quality Baseline — v1

Memory class: FULL_RECORD

Status: PASS

```text
Document class: EVIDENCE_BASELINE
Track: EA Track E — Phase E.1 DLP Quality Benchmark
Authorization: GC-018 (docs/reviews/CVF_GC018_TRACK_E_DLP_QUALITY_BENCHMARK_2026-05-13.md)
Date: 2026-05-13
Status: PASS
```

## Purpose

Record the public DLP quality baseline produced by EA Track E Phase E.1 so
evaluators and agents can verify CVF's DLP claim under a frozen corpus and
threshold.

## Scope

Single DLP baseline run on 2026-05-13 using the EA Track E corpus. This file
does not contain raw input samples or adversarial seed material; those are
preserved in the provenance archive.

## Target

EA Track E Phase E.1 DLP quality benchmark run identified above. The baseline
metrics, threshold, and grade are the public-facing record.

## Methodology

The benchmark loads the frozen DLP corpus, runs the CVF DLP path on each
sample, classifies outcomes into TP/FN/TN/FP plus an adversarial bound check,
and computes Precision/Recall/F1 against the PASS threshold `F1 >= 0.80`.

## Source

EA Track E Phase E.1 corpus, frozen at the run date above. The corpus seed
material is preserved in the provenance archive; the public file contains
only the metrics and run identity.

## Evidence

The numeric metrics under Baseline Metrics below are the verification body.
Re-running `python scripts/run_dlp_benchmark.py --save` reproduces the
metrics from the frozen corpus. Exit code 0 confirms PASS at the threshold.

## Findings

Baseline run produced `PASS` with `F1=0.9600`, `Precision=0.9231`,
`Recall=1.0000`, no false negatives, and adversarial cases within expected
bounds.

## Risk

- The single false positive (`FP=1`) is a known operator-acceptable type
  documented in EA Track E Phase E.1.
- Threshold `F1 >= 0.80` is a baseline gate, not a parity claim.
- Future regression must use the same frozen corpus or publish a corpus
  revision.

## Decision

Baseline `v1` accepted as the current public DLP quality reference. Future
DLP claims must cite this baseline or a later versioned baseline.

## Baseline Metrics

| Metric | Value |
| --- | --- |
| Precision | 0.9231 |
| Recall | 1.0000 |
| F1 | 0.9600 |
| True Positive (TP) | 12 |
| False Negative (FN) | 0 |
| True Negative (TN) | 7 |
| False Positive (FP) | 1 |
| Adversarial cases | 4/4 within expected bounds |
| Grade | **PASS** (F1 ≥ 0.80 threshold) |

Benchmark run: `python scripts/run_dlp_benchmark.py --save`  
Corpus: `docs/benchmark/dlp/dlp-corpus-v1.json`  
Output: `docs/benchmark/dlp/dlp-benchmark-v1.json`

---

## DLP Engine Description

The CVF DLP engine (`src/lib/dlp-filter-core.ts`) is a **pure regex engine** with:

- 6 preset patterns: Credit Card (Luhn-validated), API Key (`sk-`), Bearer Token, AWS Access Key, CCCD (Vietnam national ID), Email
- 1 allowlist: model names (`qwen*`, `claude*`, `deepseek*`, etc.), `CVF_*` constants, `@cvf.local` addresses
- Custom pattern support via `DLPPatternRecord[]` from admin policy

No AI model is involved. All redaction is deterministic and reproducible.

---

## Known Limitations (Documented — Not Gates)

### 1. CCCD false positive on 12-digit numbers

Any contiguous 12-digit sequence triggers the CCCD pattern. Version strings, order numbers, or timestamps matching this format will be redacted.

- **Example:** `202601234567` (version string) → redacted as `[REDACTED:CCCD]`
- **Severity:** Low for most use cases; may affect logs or structured data containing 12-digit non-ID numbers
- **Mitigation path:** Add context-aware validation (prefix check, date format exclusion) — requires DLP remediation GC-018

### 2. Obfuscated PII not detected

PII with spaces, separators, or encoding (Base64, leetspeak) bypasses all preset patterns. This is a known architectural limit of regex-only detection.

- **Adversarial cases:** 4 tested, 4 confirmed escaped detection (expected behavior documented)
- **Severity:** Medium if adversarial actors are in scope; Low for governance-first enterprise use
- **Mitigation path:** Model-assisted DLP layer — requires separate GC-018 for AI-in-DLP architecture

### 3. Credit card: Luhn validation reduces false positives but not perfect

The Luhn check filters most random 13-19 digit sequences, but some synthetic or ordered numbers may pass.

---

## Claim Boundary

- This baseline documents current DLP engine behavior, not a governance promise.
- F1 ≥ 0.80 is the documented advisory threshold. Dropping below 0.80 triggers a review advisory, not an automatic gate failure.
- No claim is made about adversarial obfuscation resistance (see Known Limitations §2).
- No claim is made about DLP performance on input types not covered in corpus v1.
- Baseline is valid for the corpus version and DLP engine version at commit time.
  Re-run `python scripts/run_dlp_benchmark.py --save` after any DLP pattern change.

---

## Reproducing This Baseline

```bash
# From public-sync repo root:
python scripts/run_dlp_benchmark.py
# With JSON output:
python scripts/run_dlp_benchmark.py --json
# Save/update baseline:
python scripts/run_dlp_benchmark.py --save
```

Exit code 0 = PASS (F1 ≥ 0.80), exit code 1 = ADVISORY.
