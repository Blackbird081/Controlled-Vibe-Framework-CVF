#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
QBS_ROOT = REPO_ROOT / "docs" / "benchmark" / "qbs-1"
DEFAULT_RUN_ID = "qbs1-powered-single-provider-20260510-alibaba-r8"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def mean(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def counter_payload(values: list[int]) -> dict[str, int]:
    return {str(key): value for key, value in sorted(Counter(values).items())}


def build_expected_outputs(bundle: dict[str, Any]) -> tuple[list[str], dict[str, dict[str, Any]]]:
    expected: list[str] = []
    metadata: dict[str, dict[str, Any]] = {}
    for row in bundle["rows"]:
        for config in row["configs"]:
            output_id = f"{row['task_id']}|r{row['repeat']}|{config}"
            expected.append(output_id)
            metadata[output_id] = {
                "task_id": row["task_id"],
                "family": row["family"],
                "risk_class": row["risk_class"],
                "expected_cvf_decision": row["expected_cvf_decision"],
                "negative_control": row["negative_control"],
                "repeat": row["repeat"],
                "config": config,
            }
    return expected, metadata


def missing_scores(
    expected: list[str],
    metadata: dict[str, dict[str, Any]],
    scores_by_reviewer: dict[str, list[dict[str, Any]]],
    prompt_records: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    expected_set = set(expected)
    alias_lookup: dict[str, dict[str, str]] = {}
    for record in prompt_records:
        for alias, output_id in record.get("alias_map", {}).items():
            alias_lookup[output_id] = {
                "task_id": record["task_id"],
                "alias": alias,
            }

    missing: list[dict[str, Any]] = []
    for reviewer, rows in sorted(scores_by_reviewer.items()):
        scored_ids = {row["output_id"] for row in rows}
        for output_id in sorted(expected_set - scored_ids):
            item = {
                "reviewer": reviewer,
                "output_id": output_id,
                **metadata[output_id],
            }
            item.update(alias_lookup.get(output_id, {}))
            missing.append(item)
    return missing


def paired_disagreements(
    metadata: dict[str, dict[str, Any]],
    scores_by_reviewer: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    by_output: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for reviewer, rows in scores_by_reviewer.items():
        for row in rows:
            by_output[row["output_id"]][reviewer] = row

    paired: list[dict[str, Any]] = []
    for output_id, by_reviewer in sorted(by_output.items()):
        if not {"openai", "deepseek"}.issubset(by_reviewer):
            continue
        openai = by_reviewer["openai"]
        deepseek = by_reviewer["deepseek"]
        item = {
            "output_id": output_id,
            **metadata[output_id],
            "openai_quality": openai["raw_quality"],
            "deepseek_quality": deepseek["raw_quality"],
            "abs_quality_diff": abs(openai["raw_quality"] - deepseek["raw_quality"]),
            "openai_rework": openai["rework"],
            "deepseek_rework": deepseek["rework"],
        }
        paired.append(item)
    return paired


def summarize_disagreement(paired: list[dict[str, Any]]) -> dict[str, Any]:
    by_family: dict[str, list[int]] = defaultdict(list)
    by_config: dict[str, list[int]] = defaultdict(list)
    by_family_config: dict[tuple[str, str], list[int]] = defaultdict(list)
    for item in paired:
        diff = item["abs_quality_diff"]
        by_family[item["family"]].append(diff)
        by_config[item["config"]].append(diff)
        by_family_config[(item["family"], item["config"])].append(diff)

    return {
        "overall": {
            "paired_score_count": len(paired),
            "abs_quality_diff_counts": counter_payload([item["abs_quality_diff"] for item in paired]),
            "mean_abs_quality_diff": mean([item["abs_quality_diff"] for item in paired]),
        },
        "by_family": [
            {
                "family": family,
                "paired_score_count": len(values),
                "mean_abs_quality_diff": mean(values),
                "abs_quality_diff_counts": counter_payload(values),
            }
            for family, values in sorted(by_family.items(), key=lambda pair: mean(pair[1]), reverse=True)
        ],
        "by_config": [
            {
                "config": config,
                "paired_score_count": len(values),
                "mean_abs_quality_diff": mean(values),
                "abs_quality_diff_counts": counter_payload(values),
            }
            for config, values in sorted(by_config.items())
        ],
        "by_family_config": [
            {
                "family": family,
                "config": config,
                "paired_score_count": len(values),
                "mean_abs_quality_diff": mean(values),
                "abs_quality_diff_counts": counter_payload(values),
            }
            for (family, config), values in sorted(
                by_family_config.items(),
                key=lambda pair: mean(pair[1]),
                reverse=True,
            )
        ],
        "largest_output_disagreements": sorted(
            paired,
            key=lambda item: (item["abs_quality_diff"], item["output_id"]),
            reverse=True,
        )[:20],
    }


def summarize_quality_deltas(scored: dict[str, Any], corpus: dict[str, Any]) -> dict[str, Any]:
    corpus_by_id = {task["task_id"]: task for task in corpus["tasks"]}
    by_task: dict[str, dict[str, Any]] = defaultdict(dict)
    for key, value in scored["task_config_scores"].items():
        task_id, config = key.split(":")
        by_task[task_id][config] = value

    task_rows: list[dict[str, Any]] = []
    for task_id, configs in sorted(by_task.items()):
        if not {"CFG-A0", "CFG-A1", "CFG-B"}.issubset(configs):
            continue
        task = corpus_by_id[task_id]
        row = {
            "task_id": task_id,
            "family": task["family"],
            "expected_cvf_decision": task["expected_cvf_decision"],
            "delta_b_vs_a1": configs["CFG-B"]["normalized_quality"] - configs["CFG-A1"]["normalized_quality"],
            "delta_b_vs_a0": configs["CFG-B"]["normalized_quality"] - configs["CFG-A0"]["normalized_quality"],
            "cfg_b_normalized_quality": configs["CFG-B"]["normalized_quality"],
            "cfg_a1_normalized_quality": configs["CFG-A1"]["normalized_quality"],
            "cfg_b_heavy_reject_rate": configs["CFG-B"]["heavy_reject_rate"],
            "cfg_a1_heavy_reject_rate": configs["CFG-A1"]["heavy_reject_rate"],
        }
        task_rows.append(row)

    by_family: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in task_rows:
        by_family[row["family"]].append(row)

    family_rows = []
    for family, rows in sorted(by_family.items()):
        deltas = [row["delta_b_vs_a1"] for row in rows]
        family_rows.append({
            "family": family,
            "task_count": len(rows),
            "median_delta_b_vs_a1": statistics.median(deltas),
            "mean_delta_b_vs_a1": mean(deltas),
            "negative_delta_task_count": sum(delta < 0 for delta in deltas),
            "positive_delta_task_count": sum(delta > 0 for delta in deltas),
            "zero_delta_task_count": sum(delta == 0 for delta in deltas),
        })

    return {
        "by_family": sorted(family_rows, key=lambda row: row["median_delta_b_vs_a1"]),
        "worst_tasks_by_delta": sorted(task_rows, key=lambda row: row["delta_b_vs_a1"])[:20],
        "best_tasks_by_delta": sorted(task_rows, key=lambda row: row["delta_b_vs_a1"], reverse=True)[:10],
    }


def analysis_status_for(run_id: str) -> str:
    if run_id.endswith("-r9"):
        return "QBS25_R9_POST_SCORE_ANALYSIS_COMPLETE_NO_NEW_SCORE"
    return "QBS21_R8_POST_SCORE_ANALYSIS_COMPLETE_NO_NEW_SCORE"


def build_report(run_id: str) -> dict[str, Any]:
    run_root = REPO_ROOT / "docs" / "benchmark" / "runs" / run_id
    bundle = read_json(run_root / "redacted-reviewer-output-bundle.json")
    reviewer_scores = read_json(run_root / "model-assisted-reviewer-scores.json")
    scored = read_json(run_root / "scored-results.json")
    agreement = read_json(run_root / "reviewer-agreement.json")
    hard_gates = read_json(run_root / "hard-gate-results.json")
    corpus = read_json(QBS_ROOT / "powered-single-provider-corpus-v1.json")

    expected, metadata = build_expected_outputs(bundle)
    scores_by_reviewer = reviewer_scores["scores_by_reviewer"]
    paired = paired_disagreements(metadata, scores_by_reviewer)

    return {
        "status": analysis_status_for(run_id),
        "run_id": run_id,
        "source_public_status": scored["public_status"],
        "claim_boundary": "Post-score analysis only. No new QBS score, no L4/L5 claim, no family-level claim, and no provider-parity claim.",
        "hard_gates": hard_gates,
        "reviewer_agreement": agreement,
        "l4_thresholds": scored["l4_thresholds"],
        "missing_scores": missing_scores(
            expected,
            metadata,
            scores_by_reviewer,
            reviewer_scores.get("prompt_blinding_records", []),
        ),
        "disagreement_summary": summarize_disagreement(paired),
        "quality_delta_summary": summarize_quality_deltas(scored, corpus),
        "recommendation": {
            "do_not_preregister_next_rerun_yet": True,
            "next_work": [
                "Repair scorer completeness so malformed or partial reviewer responses fail closed or retry before publishing paired agreement.",
                "Improve CFG-B ALLOW output quality for normal planning, builder handoff, documentation, cost/provider, and simple negative-control tasks.",
                "Audit cost/provider prompts so CFG-B avoids unsupported named-model recommendations when the task asks for general tradeoffs.",
                "Run a targeted post-remediation check before any full live rerun.",
            ],
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze QBS R8 post-score result.")
    parser.add_argument("--run-id", default=DEFAULT_RUN_ID)
    parser.add_argument("--output", type=Path, default=QBS_ROOT / "r8-post-score-analysis-qbs21.json")
    args = parser.parse_args()
    report = build_report(args.run_id)
    write_json(args.output, report)
    print(json.dumps({
        "status": report["status"],
        "run_id": report["run_id"],
        "missing_score_count": len(report["missing_scores"]),
        "agreement_status": report["reviewer_agreement"]["status"],
        "worst_family_by_median_delta": report["quality_delta_summary"]["by_family"][0],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
