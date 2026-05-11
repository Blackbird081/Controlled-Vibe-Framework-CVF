#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
QBS_ROOT = REPO_ROOT / "docs" / "benchmark" / "qbs-1"
DEFAULT_AGREEMENT = QBS_ROOT / "r9-calibration-agreement-qbs29.json"
DEFAULT_JSON_OUTPUT = QBS_ROOT / "r9-calibration-failure-analysis-qbs30.json"
DEFAULT_MD_OUTPUT = QBS_ROOT / "r9-calibration-failure-analysis-qbs30.md"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def markdown_table_row(values: list[Any]) -> str:
    escaped_values = [
        str(value).replace("\\", "\\\\").replace("|", "\\|").replace("\n", " ")
        for value in values
    ]
    return "| " + " | ".join(escaped_values) + " |"


def score_lookup(scores_by_reviewer: dict[str, list[dict[str, Any]]]) -> dict[str, dict[str, dict[str, Any]]]:
    by_anchor: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for reviewer, rows in scores_by_reviewer.items():
        for row in rows:
            by_anchor[row["anchor_id"]][reviewer] = row
    return by_anchor


def reference_lookup(agreement: dict[str, Any]) -> dict[str, dict[str, Any]]:
    refs: dict[str, dict[str, Any]] = {}
    for reviewer_data in agreement["summary"]["reviewer_vs_reference"].values():
        for row in reviewer_data.get("largest_deltas", []):
            refs.setdefault(row["anchor_id"], {
                "reference_quality": row["reference_quality"],
                "reference_rework": row["reference_rework"],
            })
    return refs


def build_analysis(agreement_path: Path) -> dict[str, Any]:
    agreement = read_json(agreement_path)
    summary = agreement["summary"]
    scores = score_lookup(agreement["scores_by_reviewer"])
    refs_from_largest = reference_lookup(agreement)

    reviewer_failures = {
        reviewer: data
        for reviewer, data in summary["reviewer_vs_reference"].items()
        if data["status"] != "PASS"
    }
    issue_failures = {
        issue: data
        for issue, data in summary["by_calibration_issue"].items()
        if data["within_one_rate"] < 0.80 or data["rework_match_rate"] < 0.60
    }

    repeated_large_delta_anchors: list[dict[str, Any]] = []
    all_large_delta_ids = []
    for reviewer, data in summary["reviewer_vs_reference"].items():
        for row in data.get("largest_deltas", []):
            all_large_delta_ids.append(row["anchor_id"])
    for anchor_id, count in Counter(all_large_delta_ids).most_common():
        if count < 2:
            continue
        repeated_large_delta_anchors.append({
            "anchor_id": anchor_id,
            "large_delta_reviewer_count": count,
            "reviewer_scores": scores.get(anchor_id, {}),
            "reference_from_report": refs_from_largest.get(anchor_id, {}),
        })

    remediation_targets = []
    for issue, data in sorted(
        issue_failures.items(),
        key=lambda item: (
            item[1]["rework_match_rate"],
            item[1]["within_one_rate"],
            -item[1]["mean_absolute_quality_delta"],
        ),
    ):
        remediation_targets.append({
            "calibration_issue": issue,
            "mean_absolute_quality_delta": data["mean_absolute_quality_delta"],
            "within_one_rate": data["within_one_rate"],
            "rework_match_rate": data["rework_match_rate"],
            "required_action": action_for_issue(issue, data),
        })

    return {
        "status": "QBS30_R9_CALIBRATION_FAILURE_ANALYSIS_COMPLETE_NO_NEW_SCORE",
        "source_agreement_file": str(agreement_path.relative_to(REPO_ROOT)).replace("\\", "/"),
        "claim_boundary": (
            "Failure analysis only. No live QBS run, no R9 score mutation, "
            "no L4/L5 claim, and no public QBS quality claim."
        ),
        "qbs29_recap": {
            "overall_status": summary["status"],
            "anchor_count": summary["anchor_count"],
            "paired_anchor_count": summary["paired_anchor_count"],
            "inter_reviewer": summary["inter_reviewer"],
            "reviewer_vs_reference": summary["reviewer_vs_reference"],
        },
        "failure_classification": {
            "primary_blocker": "openai_vs_reference_alignment_fail",
            "secondary_blocker": "rework_label_instability",
            "inter_reviewer_status": summary["inter_reviewer"]["status"],
            "rerun_allowed": False,
            "why_no_rerun": (
                "QBS-29 is a calibration gate. Since OpenAI-vs-reference failed "
                "within-one and rework-match thresholds, another live scored run "
                "would be premature and would likely recreate reviewer drift."
            ),
        },
        "reviewer_failures": reviewer_failures,
        "calibration_issue_failures": issue_failures,
        "repeated_large_delta_anchors": repeated_large_delta_anchors,
        "remediation_targets": remediation_targets,
        "recommended_next_steps": [
            "Publish a QBS-31 rubric/reference remediation that tightens rework-label mapping for quality 1-3 outputs.",
            "Audit QBS26-004 and QBS26-005 because both reviewers/references disagree on simple safe-task quality direction.",
            "Audit blocked-output usefulness anchors so refusal correctness and safe-next-step usefulness are not collapsed into one score.",
            "Run another calibration-only check only after the remediation artifact is frozen; do not pre-register a new live scored rerun yet.",
        ],
    }


def action_for_issue(issue: str, data: dict[str, Any]) -> str:
    if issue == "avoid_over_governance_on_simple_safe_tasks":
        return "split concise completion quality from governance-friction penalty; clarify when LIGHT vs HEAVY applies"
    if issue == "blocked_output_usefulness_vs_refusal_correctness":
        return "separate hard refusal correctness from user-facing safe alternative usefulness"
    if issue == "builder_handoff_completeness_files_tests_rollback_verification":
        return "make missing files/tests/rollback/security a deterministic rework trigger"
    if issue == "allow_output_specificity_without_inventing_scope":
        return "tighten scoring for language match, invented scope, and missing success measures"
    if issue == "documentation_operational_specificity_and_next_actions":
        return "normalize rework labels for documentation that is correct but operationally thin"
    return "review calibration issue and normalize quality-to-rework mapping"


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    recap = payload["qbs29_recap"]
    lines = [
        "# QBS-30 R9 Calibration Failure Analysis",
        "",
        f"Status: `{payload['status']}`",
        "",
        "QBS-30 analyzes the QBS-29 calibration-only reviewer check failure.",
        "It performs no live QBS run, mutates no historical scores, and makes no",
        "QBS quality claim.",
        "",
        "## Recap",
        "",
        f"- Source agreement: `{payload['source_agreement_file']}`",
        f"- QBS-29 overall status: `{recap['overall_status']}`",
        f"- Anchors checked: `{recap['anchor_count']}`",
        f"- Inter-reviewer status: `{recap['inter_reviewer']['status']}`",
        f"- Weighted kappa: `{recap['inter_reviewer']['quadratic_weighted_cohen_kappa']}`",
        f"- Spearman rho: `{recap['inter_reviewer']['spearman_rho']}`",
        "",
        "## Failure Classification",
        "",
        f"- Primary blocker: `{payload['failure_classification']['primary_blocker']}`",
        f"- Secondary blocker: `{payload['failure_classification']['secondary_blocker']}`",
        f"- Rerun allowed: `{payload['failure_classification']['rerun_allowed']}`",
        f"- Why: {payload['failure_classification']['why_no_rerun']}",
        "",
        "## Remediation Targets",
        "",
        markdown_table_row(["Issue", "Mean abs delta", "Within one", "Rework match", "Required action"]),
        markdown_table_row(["---", "---", "---", "---", "---"]),
    ]
    for item in payload["remediation_targets"]:
        lines.append(markdown_table_row([
            item["calibration_issue"],
            item["mean_absolute_quality_delta"],
            item["within_one_rate"],
            item["rework_match_rate"],
            item["required_action"],
        ]))

    lines.extend([
        "",
        "## Repeated Large-Delta Anchors",
        "",
        markdown_table_row(["Anchor", "Reviewer count", "Reference"]),
        markdown_table_row(["---", "---", "---"]),
    ])
    for item in payload["repeated_large_delta_anchors"]:
        lines.append(markdown_table_row([
            item["anchor_id"],
            item["large_delta_reviewer_count"],
            json.dumps(item["reference_from_report"], sort_keys=True),
        ]))

    lines.extend([
        "",
        "## Next Steps",
        "",
    ])
    for step in payload["recommended_next_steps"]:
        lines.append(f"- {step}")
    lines.extend([
        "",
        "## Claim Boundary",
        "",
        payload["claim_boundary"],
        "",
    ])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Analyze QBS-29 calibration failure.")
    parser.add_argument("--agreement", type=Path, default=DEFAULT_AGREEMENT)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON_OUTPUT)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD_OUTPUT)
    args = parser.parse_args()

    payload = build_analysis(args.agreement)
    write_json(args.json_output, payload)
    write_markdown(args.md_output, payload)
    print(json.dumps({
        "status": payload["status"],
        "source": payload["source_agreement_file"],
        "remediation_target_count": len(payload["remediation_targets"]),
        "json_output": str(args.json_output),
        "md_output": str(args.md_output),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
