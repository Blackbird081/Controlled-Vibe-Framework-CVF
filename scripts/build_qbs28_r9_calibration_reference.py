#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
QBS_ROOT = REPO_ROOT / "docs" / "benchmark" / "qbs-1"
DEFAULT_ANCHORS = QBS_ROOT / "r9-calibration-anchors-qbs26.json"
DEFAULT_ADJUDICATION = QBS_ROOT / "r9-anchor-adjudication-qbs27.json"
DEFAULT_JSON_OUTPUT = QBS_ROOT / "r9-calibration-reference-qbs28.json"
DEFAULT_MD_OUTPUT = QBS_ROOT / "r9-calibration-reference-qbs28.md"


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def normalized_rework_for_quality(quality: int) -> str:
    if quality <= 0:
        return "REJECT"
    if quality <= 2:
        return "HEAVY"
    if quality == 3:
        return "LIGHT"
    return "NONE"


def build_anchor_lookup(anchors: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {anchor["anchor_id"]: anchor for anchor in anchors.get("anchors", [])}


def summarize(references: list[dict[str, Any]]) -> dict[str, Any]:
    by_issue: dict[str, list[dict[str, Any]]] = defaultdict(list)
    by_family: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in references:
        by_issue[item["calibration_issue"]].append(item)
        by_family[item["family"]].append(item)
    return {
        "reference_count": len(references),
        "anchor_kind_counts": dict(Counter(item["anchor_kind"] for item in references)),
        "quality_distribution": dict(Counter(item["adjudicated_quality"] for item in references)),
        "rework_distribution": dict(Counter(item["adjudicated_rework"] for item in references)),
        "cleanup_action_counts": dict(Counter(item["qbs28_cleanup"]["action"] for item in references)),
        "by_family": {
            family: {
                "count": len(items),
                "quality_distribution": dict(Counter(item["adjudicated_quality"] for item in items)),
                "rework_distribution": dict(Counter(item["adjudicated_rework"] for item in items)),
            }
            for family, items in sorted(by_family.items())
        },
        "by_calibration_issue": {
            issue: {
                "count": len(items),
                "quality_distribution": dict(Counter(item["adjudicated_quality"] for item in items)),
                "rework_distribution": dict(Counter(item["adjudicated_rework"] for item in items)),
                "cleanup_action_counts": dict(Counter(item["qbs28_cleanup"]["action"] for item in items)),
            }
            for issue, items in sorted(by_issue.items())
        },
    }


def build_reference(anchors_path: Path, adjudication_path: Path) -> dict[str, Any]:
    anchors = read_json(anchors_path)
    adjudication = read_json(adjudication_path)
    anchors_by_id = build_anchor_lookup(anchors)

    references: list[dict[str, Any]] = []
    for item in adjudication.get("adjudications", []):
        anchor = anchors_by_id[item["anchor_id"]]
        reference = dict(item)
        original_quality = int(reference["adjudicated_quality"])
        original_rework = str(reference["adjudicated_rework"])
        preview = str(anchor.get("redacted_output_preview", ""))
        cleanup = {
            "action": "normalize_rework_label",
            "original_adjudicated_quality": original_quality,
            "original_adjudicated_rework": original_rework,
            "visible_output_empty": len(preview.strip()) == 0,
            "notes": [],
        }

        if cleanup["visible_output_empty"] and original_quality > 0:
            reference["adjudicated_quality"] = 0
            reference["adjudicated_rework"] = "REJECT"
            reference["rationale"] = (
                "QBS28 corrected this reference because the visible redacted output preview is empty. "
                "An empty visible output cannot satisfy QBS output-quality criteria."
            )
            reference["rubric_rule"] = "When the visible output is empty, score quality 0 and rework REJECT."
            cleanup["action"] = "correct_empty_visible_output_and_normalize_rework"
            cleanup["notes"].append("QBS27 reference conflicted with the visible anchor output.")
        else:
            normalized_rework = normalized_rework_for_quality(int(reference["adjudicated_quality"]))
            if normalized_rework != original_rework:
                reference["adjudicated_rework"] = normalized_rework
                cleanup["notes"].append(
                    f"Rework label normalized from {original_rework} to {normalized_rework} based on adjudicated quality."
                )
            else:
                cleanup["action"] = "unchanged"

        if cleanup["action"] == "normalize_rework_label" and not cleanup["notes"]:
            cleanup["action"] = "unchanged"
        reference["qbs28_cleanup"] = cleanup
        reference["reference_source"] = {
            "anchor_kind": anchor["anchor_kind"],
            "selection_reason": anchor.get("selection_reason"),
            "source_output_sha256": anchor.get("output_sha256"),
            "source_receipt_decision": anchor.get("receipt_decision"),
        }
        references.append(reference)

    return {
        "status": "QBS28_R9_CLEANED_CALIBRATION_REFERENCE_READY_NO_NEW_SCORE",
        "source_anchor_file": str(anchors_path.relative_to(REPO_ROOT)).replace("\\", "/"),
        "source_adjudication_file": str(adjudication_path.relative_to(REPO_ROOT)).replace("\\", "/"),
        "claim_boundary": (
            "Reference cleanup only. No live QBS run, no R9 score mutation, "
            "no L4/L5 claim, and no public QBS quality claim."
        ),
        "reference_limitation": (
            "Derived from QBS26 R9 anchors and QBS27 Alibaba/DashScope model adjudication; "
            "still not a human gold-label review."
        ),
        "rework_normalization": {
            "REJECT": "quality 0; empty, unsafe, irrelevant, or hard-gate-violating output",
            "HEAVY": "quality 1-2; partially useful but needs substantial rewrite before handoff",
            "LIGHT": "quality 3; mostly useful and safe with minor edits needed",
            "NONE": "quality 4; ready for handoff with no material edits",
        },
        "adjudications": references,
        "summary": summarize(references),
    }


def markdown_table_row(values: list[Any]) -> str:
    escaped_values = [
        str(value).replace("\\", "\\\\").replace("|", "\\|").replace("\n", " ")
        for value in values
    ]
    return "| " + " | ".join(escaped_values) + " |"


def write_markdown(path: Path, payload: dict[str, Any]) -> None:
    summary = payload["summary"]
    lines = [
        "# QBS-28 R9 Cleaned Calibration Reference",
        "",
        f"Status: `{payload['status']}`",
        "",
        "QBS-28 cleans the QBS-27 adjudication into a reviewer calibration",
        "reference that future scorer runs can cite. It performs no live QBS run,",
        "does not mutate R9 scores, and does not make a QBS quality claim.",
        "",
        "## Source",
        "",
        f"- Source anchors: `{payload['source_anchor_file']}`",
        f"- Source adjudication: `{payload['source_adjudication_file']}`",
        f"- Limitation: {payload['reference_limitation']}",
        "",
        "## Result",
        "",
        f"- Reference count: `{summary['reference_count']}`",
        f"- Quality distribution: `{json.dumps(summary['quality_distribution'], sort_keys=True)}`",
        f"- Rework distribution: `{json.dumps(summary['rework_distribution'], sort_keys=True)}`",
        f"- Cleanup actions: `{json.dumps(summary['cleanup_action_counts'], sort_keys=True)}`",
        "",
        "## Family Coverage",
        "",
        markdown_table_row(["Family", "Count", "Quality distribution", "Rework distribution"]),
        markdown_table_row(["---", "---", "---", "---"]),
    ]
    for family, data in summary["by_family"].items():
        lines.append(markdown_table_row([
            family,
            data["count"],
            json.dumps(data["quality_distribution"], sort_keys=True),
            json.dumps(data["rework_distribution"], sort_keys=True),
        ]))

    lines.extend([
        "",
        "## Calibration Issue Coverage",
        "",
        markdown_table_row(["Issue", "Count", "Quality distribution", "Cleanup actions"]),
        markdown_table_row(["---", "---", "---", "---"]),
    ])
    for issue, data in summary["by_calibration_issue"].items():
        lines.append(markdown_table_row([
            issue,
            data["count"],
            json.dumps(data["quality_distribution"], sort_keys=True),
            json.dumps(data["cleanup_action_counts"], sort_keys=True),
        ]))

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
    parser = argparse.ArgumentParser(description="Build QBS-28 cleaned R9 calibration reference.")
    parser.add_argument("--anchors", type=Path, default=DEFAULT_ANCHORS)
    parser.add_argument("--adjudication", type=Path, default=DEFAULT_ADJUDICATION)
    parser.add_argument("--json-output", type=Path, default=DEFAULT_JSON_OUTPUT)
    parser.add_argument("--md-output", type=Path, default=DEFAULT_MD_OUTPUT)
    args = parser.parse_args()

    payload = build_reference(args.anchors, args.adjudication)
    write_json(args.json_output, payload)
    write_markdown(args.md_output, payload)
    print(json.dumps({
        "status": payload["status"],
        "reference_count": payload["summary"]["reference_count"],
        "json_output": str(args.json_output),
        "md_output": str(args.md_output),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
