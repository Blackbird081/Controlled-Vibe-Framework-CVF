#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import defaultdict
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
TARGET_FAMILIES = [
    "builder_handoff_technical_planning",
    "cost_quota_provider_selection",
    "ambiguous_noncoder_requests",
    "high_risk_security_secrets",
    "bypass_adversarial_governance",
    "negative_controls",
]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def shorten(text: str, limit: int = 1600) -> str:
    cleaned = " ".join((text or "").split())
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[: limit - 3].rstrip() + "..."


def output_lookup(run_id: str) -> dict[str, str]:
    bundle = read_json(RUNS_ROOT / run_id / "redacted-reviewer-output-bundle.json")
    outputs: dict[str, str] = {}
    for row in bundle["rows"]:
        for config, payload in row["configs"].items():
            output_id = f"{row['task_id']}|r{row['repeat']}|{config}"
            outputs[output_id] = payload.get("output", "")
    return outputs


def score_lookup(run_id: str) -> dict[str, dict[str, dict[str, Any]]]:
    scores = read_json(RUNS_ROOT / run_id / "model-assisted-reviewer-scores.json")
    by_output: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for reviewer_id, rows in scores["scores_by_reviewer"].items():
        for row in rows:
            by_output[row["output_id"]][reviewer_id] = row
    return by_output


def calibration_issue_for(family: str, output_text: str, reviewer_rows: dict[str, dict[str, Any]]) -> str:
    text = output_text.lower()
    rationales = " ".join(row.get("rationale", "") for row in reviewer_rows.values()).lower()
    combined = f"{text} {rationales}"
    if family == "cost_quota_provider_selection":
        return "cost_provider_tradeoff_and_metric_claims"
    if family == "builder_handoff_technical_planning":
        return "builder_handoff_completeness_and_specificity"
    if family == "ambiguous_noncoder_requests":
        return "clarification_specificity_without_assuming_solution"
    if family in {"high_risk_security_secrets", "bypass_adversarial_governance"}:
        if "approval" in combined:
            return "approval_refusal_usefulness"
        return "safe_refusal_boundary_and_alternative"
    if family == "negative_controls":
        return "avoid_over_governance_on_simple_safe_tasks"
    return "general_quality_calibration"


def build_anchor(
    run_id: str,
    output_id: str,
    family: str,
    output_text: str,
    reviewer_rows: dict[str, dict[str, Any]],
    anchor_kind: str,
) -> dict[str, Any]:
    reviewer_ids = sorted(reviewer_rows)
    qualities = {reviewer_id: int(reviewer_rows[reviewer_id]["raw_quality"]) for reviewer_id in reviewer_ids}
    return {
        "anchor_id": f"QBS15-{len(build_anchor.seen) + 1:03d}",
        "anchor_kind": anchor_kind,
        "source_run_id": run_id,
        "output_id": output_id,
        "task_id": output_id.split("|")[0],
        "config": output_id.split("|")[-1],
        "family": family,
        "calibration_issue": calibration_issue_for(family, output_text, reviewer_rows),
        "reviewer_quality": qualities,
        "absolute_quality_delta": max(qualities.values()) - min(qualities.values()) if qualities else None,
        "reviewer_rework": {
            reviewer_id: reviewer_rows[reviewer_id].get("rework")
            for reviewer_id in reviewer_ids
        },
        "reviewer_rationales": {
            reviewer_id: reviewer_rows[reviewer_id].get("rationale", "")
            for reviewer_id in reviewer_ids
        },
        "redacted_output_preview": shorten(output_text),
        "adjudication_required": anchor_kind == "high_disagreement",
    }


build_anchor.seen = []  # type: ignore[attr-defined]


def add_anchor(anchors: list[dict[str, Any]], seen: set[str], anchor: dict[str, Any]) -> None:
    key = f"{anchor['source_run_id']}::{anchor['output_id']}"
    if key in seen:
        return
    seen.add(key)
    build_anchor.seen.append(key)  # type: ignore[attr-defined]
    anchor["anchor_id"] = f"QBS15-{len(build_anchor.seen):03d}"  # type: ignore[attr-defined]
    anchors.append(anchor)


def build_anchor_set(run_ids: list[str], max_high_disagreement_per_family: int = 3) -> dict[str, Any]:
    drift = read_json(QBS_ROOT / "reviewer-drift-analysis-qbs14.json")
    corpus = read_json(QBS_ROOT / "powered-single-provider-corpus-v1.json")
    family_by_task = {task["task_id"]: task["family"] for task in corpus["tasks"]}
    drift_by_run = {run["run_id"]: run for run in drift["runs"]}
    outputs_by_run = {run_id: output_lookup(run_id) for run_id in run_ids}
    scores_by_run = {run_id: score_lookup(run_id) for run_id in run_ids}

    anchors: list[dict[str, Any]] = []
    seen: set[str] = set()
    family_counts: dict[str, int] = defaultdict(int)

    high_disagreement_candidates: list[tuple[str, dict[str, Any]]] = []
    for run_id in run_ids:
        for candidate in drift_by_run[run_id]["pairwise_disagreement"]["worst_disagreements"]:
            if candidate["family"] in TARGET_FAMILIES:
                high_disagreement_candidates.append((run_id, candidate))

    high_disagreement_candidates.sort(
        key=lambda item: (
            -int(item[1]["absolute_quality_delta"]),
            item[1]["family"],
            item[0],
            item[1]["output_id"],
        )
    )
    run_family_counts: dict[tuple[str, str], int] = defaultdict(int)
    for run_id, candidate in high_disagreement_candidates:
        family = candidate["family"]
        if family_counts[family] >= max_high_disagreement_per_family:
            continue
        if run_family_counts[(run_id, family)] >= 2:
            continue
        output_id = candidate["output_id"]
        add_anchor(
            anchors,
            seen,
            build_anchor(
                run_id=run_id,
                output_id=output_id,
                family=family,
                output_text=outputs_by_run[run_id].get(output_id, ""),
                reviewer_rows=scores_by_run[run_id][output_id],
                anchor_kind="high_disagreement",
            ),
        )
        family_counts[family] += 1
        run_family_counts[(run_id, family)] += 1

    consensus_added: dict[str, int] = defaultdict(int)
    for run_id in run_ids:
        for output_id, reviewer_rows in sorted(scores_by_run[run_id].items()):
            if len(reviewer_rows) < 2:
                continue
            task_id = output_id.split("|")[0]
            resolved_family = family_by_task.get(task_id)
            if not resolved_family:
                continue
            if resolved_family not in TARGET_FAMILIES or consensus_added[resolved_family] >= 1:
                continue
            qualities = [int(row["raw_quality"]) for row in reviewer_rows.values()]
            if max(qualities) != min(qualities):
                continue
            if qualities[0] not in {1, 3, 4}:
                continue
            add_anchor(
                anchors,
                seen,
                build_anchor(
                    run_id=run_id,
                    output_id=output_id,
                    family=resolved_family,
                    output_text=outputs_by_run[run_id].get(output_id, ""),
                    reviewer_rows=reviewer_rows,
                    anchor_kind="consensus_reference",
                ),
            )
            consensus_added[resolved_family] += 1

    return {
        "status": "QBS15_REVIEWER_CALIBRATION_ANCHORS_NO_NEW_SCORE",
        "source_runs": run_ids,
        "anchor_count": len(anchors),
        "anchor_policy": {
            "high_disagreement": "Examples where model reviewers diverged, intended for adjudication before claim runs.",
            "consensus_reference": "Examples where model reviewers agreed, intended as scale references, not final human gold labels.",
            "claim_boundary": "This set does not mutate R5/R6/R7 scores and does not create a public QBS claim.",
        },
        "calibration_axes": [
            "cost_provider_tradeoff_and_metric_claims",
            "builder_handoff_completeness_and_specificity",
            "clarification_specificity_without_assuming_solution",
            "approval_refusal_usefulness",
            "safe_refusal_boundary_and_alternative",
            "avoid_over_governance_on_simple_safe_tasks",
        ],
        "anchors": anchors,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build QBS reviewer calibration anchor set.")
    parser.add_argument("--runs", default=",".join(DEFAULT_RUN_IDS))
    parser.add_argument("--output", type=Path, default=QBS_ROOT / "reviewer-calibration-anchors-qbs15.json")
    args = parser.parse_args()

    run_ids = [run_id.strip() for run_id in args.runs.split(",") if run_id.strip()]
    payload = build_anchor_set(run_ids)
    write_json(args.output, payload)
    print(json.dumps({
        "status": payload["status"],
        "anchor_count": payload["anchor_count"],
        "output": str(args.output),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
