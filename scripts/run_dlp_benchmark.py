#!/usr/bin/env python3
"""
CVF DLP Quality Benchmark Runner — EA Track E Phase 1

Loads the synthetic DLP corpus (docs/benchmark/dlp/dlp-corpus-v1.json),
runs each case through the DLP engine patterns (Python reimplementation of
the regex patterns in dlp-filter-core.ts), and reports precision/recall/F1.

Usage:
    python scripts/run_dlp_benchmark.py
    python scripts/run_dlp_benchmark.py --json
    python scripts/run_dlp_benchmark.py --save

Output saved to: docs/benchmark/dlp/dlp-benchmark-v1.json when --save is passed.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CORPUS_PATH = ROOT / "docs" / "benchmark" / "dlp" / "dlp-corpus-v1.json"
OUTPUT_PATH = ROOT / "docs" / "benchmark" / "dlp" / "dlp-benchmark-v1.json"

F1_PASS_THRESHOLD = 0.80

# Mirror of PRESET_PATTERNS from dlp-filter-core.ts
PRESET_PATTERNS = [
    {
        "id": "preset-credit-card",
        "label": "Credit Card",
        "pattern": re.compile(r"\b(?:\d[ -]*?){13,19}\b"),
        "luhn": True,
    },
    {
        "id": "preset-api-key-sk",
        "label": "API Key",
        "pattern": re.compile(r"\bsk-[a-zA-Z0-9_-]{16,}\b"),
        "luhn": False,
    },
    {
        "id": "preset-api-key-bearer",
        "label": "Bearer Token",
        "pattern": re.compile(r"\bBearer\s+[A-Za-z0-9._=-]{16,}\b"),
        "luhn": False,
    },
    {
        "id": "preset-api-key-aws",
        "label": "AWS Access Key",
        "pattern": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        "luhn": False,
    },
    {
        "id": "preset-cccd",
        "label": "CCCD",
        "pattern": re.compile(r"\b\d{12}\b"),
        "luhn": False,
    },
    {
        "id": "preset-email",
        "label": "Email",
        "pattern": re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE),
        "luhn": False,
    },
]

ALLOWLIST_PATTERNS = [
    re.compile(r"\b(?:gpt-[\w.-]+|claude[\w.-]*|gemini[\w.-]*|qwen[\w.-]*|qvq[\w.-]*|openrouter|deepseek[\w.-]*)\b", re.IGNORECASE),
    re.compile(r"\bCVF_[A-Z0-9_]+\b"),
    re.compile(r"\b[\w.+-]+@cvf\.local\b", re.IGNORECASE),
]


def is_allowlisted(value: str) -> bool:
    return any(p.search(value) for p in ALLOWLIST_PATTERNS)


def _luhn_check(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    if not 13 <= len(digits) <= 19:
        return False
    total = 0
    double = False
    for ch in reversed(digits):
        d = int(ch)
        if double:
            d *= 2
            if d > 9:
                d -= 9
        total += d
        double = not double
    return total % 10 == 0


def apply_dlp(text: str) -> bool:
    for pdef in PRESET_PATTERNS:
        for match in pdef["pattern"].finditer(text):
            val = match.group(0)
            if is_allowlisted(val):
                continue
            if pdef["luhn"] and not _luhn_check(val):
                continue
            return True
    return False


def run_benchmark(corpus: dict) -> dict:
    results = []
    tp = fn = tn = fp = 0

    for category in ("true_pii", "false_pii", "adversarial"):
        cat_data = corpus["categories"][category]
        for case in cat_data.get("cases", []):
            actual = apply_dlp(case["input"])
            expected = case["expectRedacted"]
            correct = actual == expected

            results.append({
                "id": case["id"],
                "category": category,
                "expectRedacted": expected,
                "actualRedacted": actual,
                "correct": correct,
                "note": case.get("note"),
            })

            if category == "true_pii":
                if actual:
                    tp += 1
                else:
                    fn += 1
            elif category == "false_pii":
                if not actual:
                    tn += 1
                else:
                    fp += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 1.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

    adv_results = [r for r in results if r["category"] == "adversarial"]

    return {
        "version": corpus.get("version", "v1"),
        "corpus_generated": corpus.get("generated"),
        "benchmark_run": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "metrics": {
            "truePositive": tp,
            "falseNegative": fn,
            "trueNegative": tn,
            "falsePositive": fp,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "adversarialTotal": len(adv_results),
            "adversarialPassed": sum(1 for r in adv_results if r["correct"]),
            "grade": "PASS" if f1 >= F1_PASS_THRESHOLD else "ADVISORY",
        },
        "case_results": results,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="CVF DLP Quality Benchmark")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    parser.add_argument("--save", action="store_true", help="Save results to docs/benchmark/dlp/dlp-benchmark-v1.json")
    args = parser.parse_args()

    if not CORPUS_PATH.exists():
        print(f"ERROR: Corpus not found at {CORPUS_PATH}", file=sys.stderr)
        return 1

    corpus = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
    result = run_benchmark(corpus)
    m = result["metrics"]

    if args.save:
        OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_PATH.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Saved: {OUTPUT_PATH.relative_to(ROOT)}")

    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return 0

    grade_sym = "PASS" if m["grade"] == "PASS" else "ADVISORY"
    print(f"\nCVF DLP Quality Benchmark — {result['benchmark_run']}")
    print(f"Corpus: {CORPUS_PATH.relative_to(ROOT)}")
    print(f"\nMetrics:")
    print(f"  True Positive  (TP): {m['truePositive']}")
    print(f"  False Negative (FN): {m['falseNegative']}")
    print(f"  True Negative  (TN): {m['trueNegative']}")
    print(f"  False Positive (FP): {m['falsePositive']}")
    print(f"  Precision:  {m['precision']:.4f}")
    print(f"  Recall:     {m['recall']:.4f}")
    print(f"  F1:         {m['f1']:.4f}")
    print(f"  Adversarial: {m['adversarialPassed']}/{m['adversarialTotal']} within expected bounds")
    print(f"\nGrade: {grade_sym}")

    failures = [r for r in result["case_results"] if not r["correct"] and r["category"] != "adversarial"]
    if failures:
        print(f"\nUnexpected failures ({len(failures)}):")
        for r in failures:
            print(f"  [{r['category']}] {r['id']}: expected redacted={r['expectRedacted']}, got {r['actualRedacted']}")

    return 0 if m["grade"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
