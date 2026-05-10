#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
RUNS_ROOT = REPO_ROOT / "docs" / "benchmark" / "runs"
QBS_ROOT = REPO_ROOT / "docs" / "benchmark" / "qbs-1"
DEFAULT_RUN_IDS = [
    "qbs1-powered-single-provider-20260510-alibaba-r5",
    "qbs1-powered-single-provider-20260510-alibaba-r6",
    "qbs1-powered-single-provider-20260510-alibaba-r7",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def mean(values: list[float]) -> float | None:
    return sum(values) / len(values) if values else None


def median(values: list[float]) -> float | None:
    return statistics.median(values) if values else None


def round_or_none(value: float | None, digits: int = 6) -> float | None:
    return round(value, digits) if value is not None else None


def load_family_map() -> dict[str, str]:
    corpus = read_json(QBS_ROOT / "powered-single-provider-corpus-v1.json")
    return {task["task_id"]: task["family"] for task in corpus["tasks"]}


def normalize_counter(counter: Counter[Any]) -> dict[str, int]:
    return {str(key): counter[key] for key in sorted(counter, key=lambda item: str(item))}


def summarize_reviewer_scores(rows: list[dict[str, Any]], reviewer_id: str) -> dict[str, Any]:
    by_config: dict[str, list[int]] = defaultdict(list)
    rework_by_config: dict[str, Counter[str]] = defaultdict(Counter)
    for row in rows:
        config = row["output_id"].split("|")[-1]
        by_config[config].append(int(row["raw_quality"]))
        rework_by_config[config][str(row.get("rework", "UNKNOWN"))] += 1

    return {
        "reviewer": reviewer_id,
        "overall_mean_quality": round_or_none(mean([int(row["raw_quality"]) for row in rows])),
        "overall_median_quality": median([int(row["raw_quality"]) for row in rows]),
        "by_config": {
            config: {
                "count": len(values),
                "mean_quality": round_or_none(mean(values)),
                "median_quality": median(values),
                "quality_counts": normalize_counter(Counter(values)),
                "rework_counts": normalize_counter(rework_by_config[config]),
            }
            for config, values in sorted(by_config.items())
        },
    }


def summarize_pairwise_disagreement(
    scores_by_reviewer: dict[str, list[dict[str, Any]]],
    family_by_task: dict[str, str],
) -> dict[str, Any]:
    reviewer_ids = sorted(scores_by_reviewer)
    if len(reviewer_ids) != 2:
        return {
            "status": "UNSUPPORTED_REVIEWER_COUNT",
            "reviewers": reviewer_ids,
        }

    left_id, right_id = reviewer_ids
    by_output: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for reviewer_id, rows in scores_by_reviewer.items():
        for row in rows:
            by_output[row["output_id"]][reviewer_id] = row

    pairs: list[dict[str, Any]] = []
    for output_id, reviewer_rows in by_output.items():
        if left_id not in reviewer_rows or right_id not in reviewer_rows:
            continue
        left = reviewer_rows[left_id]
        right = reviewer_rows[right_id]
        task_id = left["task_id"]
        config = output_id.split("|")[-1]
        left_quality = int(left["raw_quality"])
        right_quality = int(right["raw_quality"])
        pairs.append({
            "output_id": output_id,
            "task_id": task_id,
            "family": family_by_task.get(task_id, "unknown"),
            "config": config,
            f"{left_id}_quality": left_quality,
            f"{right_id}_quality": right_quality,
            "signed_quality_delta_left_minus_right": left_quality - right_quality,
            "absolute_quality_delta": abs(left_quality - right_quality),
            f"{left_id}_rework": left.get("rework"),
            f"{right_id}_rework": right.get("rework"),
            f"{left_id}_rationale": left.get("rationale", ""),
            f"{right_id}_rationale": right.get("rationale", ""),
        })

    abs_deltas = [row["absolute_quality_delta"] for row in pairs]
    signed_deltas = [row["signed_quality_delta_left_minus_right"] for row in pairs]
    by_config: dict[str, list[int]] = defaultdict(list)
    by_family: dict[str, list[int]] = defaultdict(list)
    for row in pairs:
        by_config[row["config"]].append(row["absolute_quality_delta"])
        by_family[row["family"]].append(row["absolute_quality_delta"])

    return {
        "reviewers": [left_id, right_id],
        "paired_score_count": len(pairs),
        "mean_absolute_quality_delta": round_or_none(mean(abs_deltas)),
        "median_absolute_quality_delta": median(abs_deltas),
        "mean_signed_quality_delta_left_minus_right": round_or_none(mean(signed_deltas)),
        "absolute_delta_counts": normalize_counter(Counter(abs_deltas)),
        "by_config": {
            config: {
                "count": len(values),
                "mean_absolute_quality_delta": round_or_none(mean(values)),
                "median_absolute_quality_delta": median(values),
                "outputs_with_delta_gte_2": sum(value >= 2 for value in values),
            }
            for config, values in sorted(by_config.items())
        },
        "by_family": {
            family: {
                "count": len(values),
                "mean_absolute_quality_delta": round_or_none(mean(values)),
                "median_absolute_quality_delta": median(values),
                "outputs_with_delta_gte_2": sum(value >= 2 for value in values),
            }
            for family, values in sorted(by_family.items())
        },
        "worst_disagreements": sorted(
            pairs,
            key=lambda row: (
                -row["absolute_quality_delta"],
                row["family"],
                row["task_id"],
                row["output_id"],
            ),
        )[:24],
    }


def summarize_run(run_id: str, family_by_task: dict[str, str]) -> dict[str, Any]:
    run_root = RUNS_ROOT / run_id
    scores = read_json(run_root / "model-assisted-reviewer-scores.json")
    scored_results = read_json(run_root / "scored-results.json")
    agreement = read_json(run_root / "reviewer-agreement.json")
    scores_by_reviewer = scores["scores_by_reviewer"]

    return {
        "run_id": run_id,
        "public_status": scored_results.get("public_status"),
        "agreement": agreement,
        "l4_thresholds": scored_results.get("l4_thresholds"),
        "l4_pass": scored_results.get("l4_pass"),
        "reviewer_score_summary": {
            reviewer_id: summarize_reviewer_scores(rows, reviewer_id)
            for reviewer_id, rows in sorted(scores_by_reviewer.items())
        },
        "pairwise_disagreement": summarize_pairwise_disagreement(scores_by_reviewer, family_by_task),
    }


def build_cross_run_summary(run_summaries: list[dict[str, Any]]) -> dict[str, Any]:
    trend = []
    for summary in run_summaries:
        thresholds = summary.get("l4_thresholds") or {}
        agreement = summary.get("agreement") or {}
        disagreement = summary.get("pairwise_disagreement") or {}
        trend.append({
            "run_id": summary["run_id"],
            "agreement_status": agreement.get("status"),
            "quadratic_weighted_cohen_kappa": agreement.get("quadratic_weighted_cohen_kappa"),
            "spearman_rho": agreement.get("spearman_rho"),
            "median_quality_delta_b_vs_a1": thresholds.get("median_quality_delta_b_vs_a1"),
            "bootstrap_95_ci_quality_delta_b_vs_a1": thresholds.get("bootstrap_95_ci_quality_delta_b_vs_a1"),
            "reviewer_agreement_passed": thresholds.get("reviewer_agreement_passed"),
            "l4_pass": summary.get("l4_pass"),
            "mean_absolute_quality_delta": disagreement.get("mean_absolute_quality_delta"),
            "median_absolute_quality_delta": disagreement.get("median_absolute_quality_delta"),
        })

    return {
        "trend": trend,
        "recommendation": (
            "Do not pre-register another live score run until reviewer calibration "
            "and residual CFG-B ALLOW output quality are updated. R7 did not improve "
            "agreement or median quality delta versus R6."
        ),
        "recommended_next_controls": [
            "Create a fixed calibration anchor set from R5/R6/R7 outputs.",
            "Revise reviewer instructions for cost/provider-selection and refusal/approval usefulness.",
            "Add a third adjudicator or human spot-check for high-disagreement anchors before claim runs.",
            "Improve CFG-B ALLOW output quality separately from scoring-method calibration.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze QBS reviewer drift across scored runs.")
    parser.add_argument("--runs", default=",".join(DEFAULT_RUN_IDS))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    run_ids = [run_id.strip() for run_id in args.runs.split(",") if run_id.strip()]
    family_by_task = load_family_map()
    run_summaries = [summarize_run(run_id, family_by_task) for run_id in run_ids]
    payload = {
        "status": "QBS14_REVIEWER_DRIFT_ANALYZED_NO_NEW_SCORE",
        "runs": run_summaries,
        "cross_run_summary": build_cross_run_summary(run_summaries),
    }

    if args.output:
        write_json(args.output, payload)
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
