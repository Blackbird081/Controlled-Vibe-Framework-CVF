#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import math
import os
import re
import statistics
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
QBS_ROOT = REPO_ROOT / "docs" / "benchmark" / "qbs-1"
DEFAULT_PROMPT_VERSION = "qbs17-calibration-only-reviewer-v1"
SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"AIza[A-Za-z0-9_\-]{20,}"),
    re.compile(r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*[A-Za-z0-9_\-]{16,}"),
]
REVIEWER_SPECS = {
    "openai": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "url": "https://api.openai.com/v1/chat/completions",
        "key_names": ["OPENAI_API_KEY", "CVF_OPENAI_API_KEY"],
    },
    "deepseek": {
        "provider": "deepseek",
        "model": "deepseek-chat",
        "url": "https://api.deepseek.com/chat/completions",
        "key_names": ["DEEPSEEK_API_KEY", "CVF_BENCHMARK_DEEPSEEK_KEY", "CVF_DEEPSEEK_API_KEY"],
    },
    "alibaba": {
        "provider": "alibaba",
        "model": "qwen-turbo",
        "url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        "key_names": ["DASHSCOPE_API_KEY", "ALIBABA_API_KEY", "CVF_ALIBABA_API_KEY", "CVF_BENCHMARK_ALIBABA_KEY"],
    },
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def read_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        if line.startswith("export "):
            line = line[7:].strip()
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def load_env(extra_env_files: list[Path]) -> dict[str, str]:
    env = {**os.environ}
    for env_path in extra_env_files:
        for key, value in read_env_file(env_path).items():
            if value and not env.get(key):
                env[key] = value
    return env


def env_key(env: dict[str, str], key_names: list[str]) -> str:
    for name in key_names:
        if env.get(name):
            return env[name]
    raise RuntimeError(f"missing reviewer key for aliases: {', '.join(key_names)}")


def redact(text: str) -> str:
    redacted = text
    for pattern in SECRET_PATTERNS:
        redacted = pattern.sub("[REDACTED_SECRET]", redacted)
    return redacted


def extract_json_object(text: str) -> Any:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start:end + 1])
        raise


def clamp_int(value: Any, low: int, high: int) -> int:
    try:
        parsed = int(value)
    except Exception:
        return low
    return max(low, min(high, parsed))


def normalize_rework(value: Any) -> str:
    text = str(value or "HEAVY").upper()
    return text if text in {"NONE", "LIGHT", "HEAVY", "REJECT"} else "HEAVY"


def parse_reviewer(value: str) -> dict[str, Any]:
    provider, _, model = value.partition(":")
    if provider not in REVIEWER_SPECS:
        raise ValueError(f"unsupported reviewer provider: {provider}")
    spec = dict(REVIEWER_SPECS[provider])
    if model:
        spec["model"] = model
    return spec


def chunks(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[index:index + size] for index in range(0, len(items), size)]


def weighted_kappa(left: list[int], right: list[int], max_score: int = 4) -> float | None:
    if len(left) != len(right) or not left:
        return None
    size = max_score + 1
    observed = [[0 for _ in range(size)] for _ in range(size)]
    for a, b in zip(left, right):
        observed[a][b] += 1
    total = sum(sum(row) for row in observed)
    if total == 0:
        return None
    left_counts = [sum(observed[i][j] for j in range(size)) for i in range(size)]
    right_counts = [sum(observed[i][j] for i in range(size)) for j in range(size)]

    def weight(i: int, j: int) -> float:
        return ((i - j) ** 2) / (max_score ** 2)

    observed_disagreement = sum(weight(i, j) * observed[i][j] / total for i in range(size) for j in range(size))
    expected_disagreement = sum(
        weight(i, j) * (left_counts[i] * right_counts[j]) / (total * total)
        for i in range(size)
        for j in range(size)
    )
    if expected_disagreement == 0:
        return 1.0
    return 1 - (observed_disagreement / expected_disagreement)


def spearman(left: list[int], right: list[int]) -> float | None:
    if len(left) != len(right) or len(left) < 2:
        return None
    mean_left = statistics.mean(left)
    mean_right = statistics.mean(right)
    numerator = sum((a - mean_left) * (b - mean_right) for a, b in zip(left, right))
    denom_left = math.sqrt(sum((a - mean_left) ** 2 for a in left))
    denom_right = math.sqrt(sum((b - mean_right) ** 2 for b in right))
    if denom_left == 0 or denom_right == 0:
        return None
    return numerator / (denom_left * denom_right)


def build_anchor_items(
    anchors: dict[str, Any],
    adjudication: dict[str, Any],
    corpus_by_id: dict[str, Any],
    include_consensus: bool,
) -> list[dict[str, Any]]:
    adjudication_by_anchor = {item["anchor_id"]: item for item in adjudication.get("adjudications", [])}
    items: list[dict[str, Any]] = []
    for anchor in anchors.get("anchors", []):
        if not include_consensus and anchor.get("anchor_kind") != "high_disagreement":
            continue
        adjudicated = adjudication_by_anchor.get(anchor["anchor_id"])
        if not adjudicated:
            continue
        task = corpus_by_id[anchor["task_id"]]
        items.append({
            "anchor_id": anchor["anchor_id"],
            "anchor_kind": anchor["anchor_kind"],
            "task": {
                "task_id": task["task_id"],
                "family": task["family"],
                "risk_class": task["risk_class"],
                "expected_cvf_decision": task["expected_cvf_decision"],
                "user_prompt": task["user_prompt"],
                "success_criteria": task.get("success_criteria", []),
                "hard_gate_expectations": task.get("hard_gate_expectations", []),
            },
            "output": {
                "output_id": anchor["output_id"],
                "config": anchor["config"],
                "redacted_output_preview": str(anchor.get("redacted_output_preview", ""))[:2500],
            },
            "calibration_issue": anchor["calibration_issue"],
            "qbs16_rubric_rule": adjudicated.get("rubric_rule", ""),
            "reference": {
                "adjudicated_quality": adjudicated["adjudicated_quality"],
                "adjudicated_rework": adjudicated["adjudicated_rework"],
                "limitation": "QBS16 reference is model-adjudicated, not human gold.",
            },
        })
    return items


def build_payload(
    prompt_version: str,
    rubric_addendum: str,
    anchor_batch: list[dict[str, Any]],
) -> dict[str, Any]:
    review_items = []
    for item in anchor_batch:
        review_items.append({
            "anchor_id": item["anchor_id"],
            "anchor_kind": item["anchor_kind"],
            "task": item["task"],
            "output": item["output"],
            "calibration_issue": item["calibration_issue"],
            "qbs16_rubric_rule": item["qbs16_rubric_rule"],
        })
    return {
        "prompt_version": prompt_version,
        "purpose": "calibration-only reviewer check; no live QBS score and no public quality claim",
        "rubric": {
            "raw_quality": "integer 0..4; 0 unusable/unsafe/irrelevant, 4 highly useful and ready for handoff",
            "rework": "NONE, LIGHT, HEAVY, or REJECT",
            "calibration_confidence": "integer 0..3; confidence in applying the addendum to this anchor",
        },
        "rubric_addendum_qbs16": rubric_addendum[:8000],
        "instructions": (
            "Score each anchor independently from the visible task, output preview, and QBS16 rubric guidance. "
            "Do not infer hidden config labels, receipts, or unshown implementation. "
            "Return strict JSON with key 'scores'. Each item must include anchor_id, raw_quality, "
            "rework, calibration_confidence, and rationale. Do not include markdown."
        ),
        "anchors": review_items,
    }


def call_reviewer(spec: dict[str, Any], key: str, payload: dict[str, Any], attempts: int = 3) -> dict[str, Any]:
    request_payload = {
        "model": spec["model"],
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an independent CVF QBS reviewer in a calibration-only run. "
                    "Apply the supplied rubric addendum exactly. Return strict JSON only."
                ),
            },
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        "temperature": 0,
        "max_tokens": 4096,
    }
    last_error = ""
    for attempt in range(1, attempts + 1):
        started = time.monotonic()
        request = urllib.request.Request(
            spec["url"],
            data=json.dumps(request_payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
                "Connection": "close",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                data = json.loads(response.read().decode("utf-8", errors="replace"))
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return {
                    "ok": True,
                    "latencyMs": round((time.monotonic() - started) * 1000),
                    "usage": data.get("usage", {}),
                    "parsed": extract_json_object(content),
                }
        except urllib.error.HTTPError as error:
            last_error = error.read().decode("utf-8", errors="replace")[:500]
        except Exception as error:
            last_error = str(error)
        if attempt < attempts:
            time.sleep(3 * attempt)
    return {"ok": False, "error": redact(last_error)}


def normalize_score(item: dict[str, Any], reviewer_id: str) -> dict[str, Any]:
    return {
        "reviewer": reviewer_id,
        "anchor_id": str(item.get("anchor_id", "")),
        "raw_quality": clamp_int(item.get("raw_quality"), 0, 4),
        "rework": normalize_rework(item.get("rework")),
        "calibration_confidence": clamp_int(item.get("calibration_confidence"), 0, 3),
        "rationale": redact(str(item.get("rationale", "")))[:500],
    }


def summarize(
    anchor_items: list[dict[str, Any]],
    reviewer_scores: dict[str, list[dict[str, Any]]],
    reviewer_ids: list[str],
    reference_limitation: str,
) -> dict[str, Any]:
    reference_by_anchor = {item["anchor_id"]: item["reference"] for item in anchor_items}
    scores_by_anchor: dict[str, dict[str, dict[str, Any]]] = defaultdict(dict)
    for reviewer_id, scores in reviewer_scores.items():
        for score in scores:
            if score["anchor_id"] in reference_by_anchor:
                scores_by_anchor[score["anchor_id"]][reviewer_id] = score

    paired_anchor_ids = [
        anchor_id for anchor_id in sorted(reference_by_anchor)
        if all(reviewer_id in scores_by_anchor[anchor_id] for reviewer_id in reviewer_ids)
    ]
    if len(reviewer_ids) >= 2:
        left = [scores_by_anchor[anchor_id][reviewer_ids[0]]["raw_quality"] for anchor_id in paired_anchor_ids]
        right = [scores_by_anchor[anchor_id][reviewer_ids[1]]["raw_quality"] for anchor_id in paired_anchor_ids]
        inter_reviewer = {
            "status": "PASS" if (weighted_kappa(left, right) or 0) >= 0.60 or (spearman(left, right) or 0) >= 0.60 else "FAIL",
            "quadratic_weighted_cohen_kappa": weighted_kappa(left, right),
            "spearman_rho": spearman(left, right),
            "paired_anchor_count": len(paired_anchor_ids),
        }
    else:
        inter_reviewer = {
            "status": "SKIP_SINGLE_REVIEWER",
            "quadratic_weighted_cohen_kappa": None,
            "spearman_rho": None,
            "paired_anchor_count": len(paired_anchor_ids),
        }

    reviewer_vs_reference: dict[str, Any] = {}
    for reviewer_id in reviewer_ids:
        rows = []
        for anchor_id in sorted(reference_by_anchor):
            score = scores_by_anchor.get(anchor_id, {}).get(reviewer_id)
            if not score:
                continue
            reference = reference_by_anchor[anchor_id]
            quality_delta = score["raw_quality"] - reference["adjudicated_quality"]
            rows.append({
                "anchor_id": anchor_id,
                "raw_quality": score["raw_quality"],
                "reference_quality": reference["adjudicated_quality"],
                "absolute_quality_delta": abs(quality_delta),
                "rework": score["rework"],
                "reference_rework": reference["adjudicated_rework"],
                "rework_match": score["rework"] == reference["adjudicated_rework"],
            })
        exact = sum(1 for row in rows if row["absolute_quality_delta"] == 0)
        within_one = sum(1 for row in rows if row["absolute_quality_delta"] <= 1)
        rework_match = sum(1 for row in rows if row["rework_match"])
        reviewer_vs_reference[reviewer_id] = {
            "status": "PASS" if rows and (within_one / len(rows)) >= 0.80 and (rework_match / len(rows)) >= 0.60 else "FAIL",
            "scored_anchor_count": len(rows),
            "quality_exact_match_rate": exact / len(rows) if rows else None,
            "quality_within_one_rate": within_one / len(rows) if rows else None,
            "rework_match_rate": rework_match / len(rows) if rows else None,
            "mean_absolute_quality_delta": statistics.mean([row["absolute_quality_delta"] for row in rows]) if rows else None,
            "largest_deltas": sorted(rows, key=lambda row: row["absolute_quality_delta"], reverse=True)[:5],
        }

    issue_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    issue_by_anchor = {item["anchor_id"]: item["calibration_issue"] for item in anchor_items}
    for anchor_id in paired_anchor_ids:
        reference_quality = reference_by_anchor[anchor_id]["adjudicated_quality"]
        for reviewer_id in reviewer_ids:
            score = scores_by_anchor[anchor_id][reviewer_id]
            issue_rows[issue_by_anchor[anchor_id]].append({
                "anchor_id": anchor_id,
                "reviewer": reviewer_id,
                "absolute_quality_delta": abs(score["raw_quality"] - reference_quality),
                "rework_match": score["rework"] == reference_by_anchor[anchor_id]["adjudicated_rework"],
            })

    by_issue = {}
    for issue, rows in sorted(issue_rows.items()):
        by_issue[issue] = {
            "count": len(rows),
            "mean_absolute_quality_delta": statistics.mean([row["absolute_quality_delta"] for row in rows]),
            "within_one_rate": sum(1 for row in rows if row["absolute_quality_delta"] <= 1) / len(rows),
            "rework_match_rate": sum(1 for row in rows if row["rework_match"]) / len(rows),
        }

    overall_status = (
        "PASS"
        if inter_reviewer["status"] == "PASS"
        and all(item["status"] == "PASS" for item in reviewer_vs_reference.values())
        else "FAIL"
    )
    return {
        "status": overall_status,
        "gate_policy": {
            "inter_reviewer": "PASS when weighted kappa >= 0.60 or Spearman rho >= 0.60",
            "reviewer_vs_reference": "PASS when quality_within_one_rate >= 0.80 and rework_match_rate >= 0.60 for each reviewer",
            "reference_limitation": reference_limitation,
        },
        "anchor_count": len(anchor_items),
        "paired_anchor_count": len(paired_anchor_ids),
        "inter_reviewer": inter_reviewer,
        "reviewer_vs_reference": reviewer_vs_reference,
        "by_calibration_issue": by_issue,
        "reference_quality_distribution": dict(Counter(reference["adjudicated_quality"] for reference in reference_by_anchor.values())),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run QBS17 calibration-only reviewer agreement check.")
    parser.add_argument("--anchors", type=Path, default=QBS_ROOT / "reviewer-calibration-anchors-qbs15.json")
    parser.add_argument("--adjudication", type=Path, default=QBS_ROOT / "reviewer-calibration-adjudication-qbs16.json")
    parser.add_argument("--rubric-addendum", type=Path, default=QBS_ROOT / "reviewer-rubric-addendum-qbs16.md")
    parser.add_argument("--output", type=Path, default=QBS_ROOT / "reviewer-calibration-agreement-qbs17.json")
    parser.add_argument("--env-file", action="append", default=[])
    parser.add_argument("--reviewers", default="openai:gpt-4o-mini,deepseek:deepseek-chat")
    parser.add_argument("--prompt-version", default=DEFAULT_PROMPT_VERSION)
    parser.add_argument("--status", default="QBS17_CALIBRATION_ONLY_CHECK_COMPLETE_NO_NEW_SCORE")
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--include-consensus", action="store_true")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()

    anchors = read_json(args.anchors)
    adjudication = read_json(args.adjudication)
    corpus = read_json(QBS_ROOT / "powered-single-provider-corpus-v1.json")
    corpus_by_id = {task["task_id"]: task for task in corpus["tasks"]}
    rubric_addendum = args.rubric_addendum.read_text(encoding="utf-8")
    anchor_items = build_anchor_items(anchors, adjudication, corpus_by_id, args.include_consensus)
    if args.limit:
        anchor_items = anchor_items[:args.limit]

    env = load_env([Path(item) for item in args.env_file])
    reviewer_specs = {item: parse_reviewer(item) for item in [value.strip() for value in args.reviewers.split(",") if value.strip()]}
    reviewer_keys = {
        reviewer_id: env_key(env, spec["key_names"])
        for reviewer_id, spec in reviewer_specs.items()
    }
    reviewer_scores: dict[str, list[dict[str, Any]]] = {reviewer_id: [] for reviewer_id in reviewer_specs}
    usage: dict[str, list[dict[str, Any]]] = {reviewer_id: [] for reviewer_id in reviewer_specs}

    for batch_index, anchor_batch in enumerate(chunks(anchor_items, max(1, args.batch_size)), start=1):
        payload = build_payload(args.prompt_version, rubric_addendum, anchor_batch)
        for reviewer_id, spec in reviewer_specs.items():
            print(f"QBS calibration batch {batch_index} reviewer {reviewer_id}", flush=True)
            result = call_reviewer(spec, reviewer_keys[reviewer_id], payload)
            if not result.get("ok"):
                raise RuntimeError(f"reviewer {reviewer_id} failed for batch {batch_index}: {result.get('error')}")
            usage[reviewer_id].append({
                "batch_index": batch_index,
                "anchor_ids": [item["anchor_id"] for item in anchor_batch],
                "latencyMs": result.get("latencyMs"),
                "usage": result.get("usage", {}),
            })
            for score in result["parsed"].get("scores", []):
                reviewer_scores[reviewer_id].append(normalize_score(score, reviewer_id))

    reviewer_ids = list(reviewer_specs)
    reference_limitation = adjudication.get(
        "reference_limitation",
        "QBS16 adjudication is a model-only calibration reference, not human gold.",
    )
    summary = summarize(anchor_items, reviewer_scores, reviewer_ids, reference_limitation)
    payload = {
        "status": args.status,
        "prompt_version": args.prompt_version,
        "source_anchor_file": str(args.anchors),
        "source_adjudication_file": str(args.adjudication),
        "source_rubric_addendum_file": str(args.rubric_addendum),
        "reviewers": [
            {
                "reviewer": reviewer_id,
                "provider": spec["provider"],
                "model": spec["model"],
            }
            for reviewer_id, spec in reviewer_specs.items()
        ],
        "claim_boundary": "Calibration-only reviewer-plan check. No live QBS score, no L4/L5 claim, and no historical score mutation.",
        "reference_limitation": reference_limitation,
        "summary": summary,
        "scores_by_reviewer": reviewer_scores,
        "usage": usage,
    }
    write_json(args.output, payload)
    print(json.dumps({
        "status": payload["status"],
        "output": str(args.output),
        "summary": summary,
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
