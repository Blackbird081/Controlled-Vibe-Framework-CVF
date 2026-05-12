# CVF DLP Quality Baseline — v1

```text
Document class: EVIDENCE_BASELINE
Track: EA Track E — Phase E.1 DLP Quality Benchmark
Authorization: GC-018 (docs/reviews/CVF_GC018_TRACK_E_DLP_QUALITY_BENCHMARK_2026-05-13.md)
Date: 2026-05-13
Status: PASS
```

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
