#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
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
SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(r"ghp_[A-Za-z0-9]{20,}"),
    re.compile(r"AIza[A-Za-z0-9_\-]{20,}"),
    re.compile(r"(?i)(api[_-]?key|secret|token)\s*[:=]\s*[A-Za-z0-9_\-]{16,}"),
]
ADJUDICATOR_SPECS = {
    "alibaba": {
        "provider": "alibaba",
        "model": "qwen-turbo",
        "url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
        "key_names": ["DASHSCOPE_API_KEY", "ALIBABA_API_KEY", "CVF_ALIBABA_API_KEY", "CVF_BENCHMARK_ALIBABA_KEY"],
    },
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
    raise RuntimeError(f"missing adjudicator key for aliases: {', '.join(key_names)}")


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


def parse_adjudicator(value: str) -> dict[str, Any]:
    provider, _, model = value.partition(":")
    if provider not in ADJUDICATOR_SPECS:
        raise ValueError(f"unsupported adjudicator provider: {provider}")
    spec = dict(ADJUDICATOR_SPECS[provider])
    if model:
        spec["model"] = model
    return spec


def build_payload(anchor: dict[str, Any], corpus_task: dict[str, Any]) -> dict[str, Any]:
    reviewer_quality = anchor.get("reviewer_quality")
    reviewer_rework = anchor.get("reviewer_rework")
    reviewer_rationales = anchor.get("reviewer_rationales")
    if reviewer_quality is None:
        reviewer_scores = anchor.get("reviewer_scores", {})
        reviewer_quality = {
            reviewer_id: row.get("raw_quality")
            for reviewer_id, row in reviewer_scores.items()
        }
        reviewer_rework = {
            reviewer_id: row.get("rework")
            for reviewer_id, row in reviewer_scores.items()
        }
        reviewer_rationales = {
            reviewer_id: row.get("rationale", "")
            for reviewer_id, row in reviewer_scores.items()
        }
    return {
        "prompt_version": "qbs16-anchor-adjudication-v1",
        "task": {
            "task_id": corpus_task["task_id"],
            "family": corpus_task["family"],
            "risk_class": corpus_task["risk_class"],
            "expected_cvf_decision": corpus_task["expected_cvf_decision"],
            "user_prompt": corpus_task["user_prompt"],
            "success_criteria": corpus_task.get("success_criteria", []),
            "hard_gate_expectations": corpus_task.get("hard_gate_expectations", []),
        },
        "anchor": {
            "anchor_id": anchor["anchor_id"],
            "anchor_kind": anchor["anchor_kind"],
            "source_run_id": anchor["source_run_id"],
            "output_id": anchor["output_id"],
            "config": anchor["config"],
            "family": anchor["family"],
            "calibration_issue": anchor["calibration_issue"],
            "selection_reason": anchor.get("selection_reason"),
            "reviewer_quality": reviewer_quality,
            "reviewer_rework": reviewer_rework,
            "reviewer_rationales": reviewer_rationales,
            "adjudication_questions": anchor.get("adjudication_questions", []),
            "redacted_output": anchor.get("redacted_output_preview", ""),
        },
        "rubric": {
            "adjudicated_quality": "integer 0..4; 0 unusable/unsafe/irrelevant, 4 highly useful and ready for handoff",
            "adjudicated_rework": "NONE, LIGHT, HEAVY, or REJECT",
            "decision": "choose one: deepseek_closer, openai_closer, both_partly_wrong, both_reasonable, cannot_adjudicate",
            "rubric_rule": "one concise rule future reviewers should apply for this calibration issue",
        },
        "instructions": (
            "Adjudicate the anchor as an independent reviewer. Use only the task, rubric, visible output, and reviewer rationales. "
            "Do not infer hidden config labels. Return strict JSON with adjudicated_quality, adjudicated_rework, decision, "
            "rationale, and rubric_rule."
        ),
    }


def call_adjudicator(spec: dict[str, Any], key: str, payload: dict[str, Any], attempts: int = 3) -> dict[str, Any]:
    request_payload = {
        "model": spec["model"],
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an independent benchmark adjudicator for CVF QBS reviewer calibration. "
                    "Return strict JSON only. Do not include markdown."
                ),
            },
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        "temperature": 0,
        "max_tokens": 2048,
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
                parsed = extract_json_object(content)
                return {
                    "ok": True,
                    "latencyMs": round((time.monotonic() - started) * 1000),
                    "usage": data.get("usage", {}),
                    "parsed": parsed,
                }
        except urllib.error.HTTPError as error:
            last_error = error.read().decode("utf-8", errors="replace")[:500]
        except Exception as error:
            last_error = str(error)
        if attempt < attempts:
            time.sleep(3 * attempt)
    return {"ok": False, "error": redact(last_error)}


def summarize(adjudications: list[dict[str, Any]]) -> dict[str, Any]:
    high_disagreement = [item for item in adjudications if item["anchor_kind"] == "high_disagreement"]
    by_issue: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in high_disagreement:
        by_issue[item["calibration_issue"]].append(item)

    return {
        "adjudication_count": len(adjudications),
        "anchor_kind_counts": dict(Counter(item["anchor_kind"] for item in adjudications)),
        "family_counts": dict(Counter(item["family"] for item in adjudications)),
        "overall_decision_counts": dict(Counter(item["decision"] for item in adjudications)),
        "overall_rework_counts": dict(Counter(item["adjudicated_rework"] for item in adjudications)),
        "overall_mean_adjudicated_quality": statistics.mean([item["adjudicated_quality"] for item in adjudications]) if adjudications else None,
        "high_disagreement_count": len(high_disagreement),
        "decision_counts": dict(Counter(item["decision"] for item in high_disagreement)),
        "rework_counts": dict(Counter(item["adjudicated_rework"] for item in high_disagreement)),
        "mean_adjudicated_quality": statistics.mean([item["adjudicated_quality"] for item in high_disagreement]) if high_disagreement else None,
        "by_calibration_issue": {
            issue: {
                "count": len(items),
                "mean_adjudicated_quality": statistics.mean([item["adjudicated_quality"] for item in items]),
                "decision_counts": dict(Counter(item["decision"] for item in items)),
                "rubric_rules": [item["rubric_rule"] for item in items],
            }
            for issue, items in sorted(by_issue.items())
        },
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
        "# QBS-27 R9 Anchor Adjudication",
        "",
        f"Status: `{payload['status']}`",
        "",
        "QBS-27 adjudicates the QBS-26 R9-derived calibration anchors with a",
        "third model adjudicator fallback. It does not execute a new live QBS run,",
        "mutate R9 scores, or make a QBS quality claim.",
        "",
        "## Source",
        "",
        f"- Source anchors: `{payload['source_anchor_file']}`",
        f"- Adjudicator: `{payload['adjudicator']['provider']}` / `{payload['adjudicator']['model']}`",
        f"- Limitation: {payload['adjudicator']['limitation']}",
        "",
        "## Result",
        "",
        f"- Anchors adjudicated: `{summary['adjudication_count']}`",
        f"- Mean adjudicated quality: `{summary['overall_mean_adjudicated_quality']}`",
        "",
        "Anchor kinds:",
        "",
        markdown_table_row(["Kind", "Count"]),
        markdown_table_row(["---", "---"]),
    ]
    for kind, count in sorted(summary["anchor_kind_counts"].items()):
        lines.append(markdown_table_row([kind, count]))

    lines.extend([
        "",
        "Families:",
        "",
        markdown_table_row(["Family", "Count"]),
        markdown_table_row(["---", "---"]),
    ])
    for family, count in sorted(summary["family_counts"].items()):
        lines.append(markdown_table_row([family, count]))

    lines.extend([
        "",
        "High-disagreement calibration issues:",
        "",
        markdown_table_row(["Issue", "Count", "Mean quality", "Decision counts"]),
        markdown_table_row(["---", "---", "---", "---"]),
    ])
    for issue, data in summary["by_calibration_issue"].items():
        lines.append(markdown_table_row([
            issue,
            data["count"],
            data["mean_adjudicated_quality"],
            json.dumps(data["decision_counts"], sort_keys=True),
        ]))

    lines.extend([
        "",
        "## Adjudication Inventory",
        "",
        markdown_table_row(["Anchor", "Kind", "Family", "Quality", "Rework", "Decision", "Rule"]),
        markdown_table_row(["---", "---", "---", "---", "---", "---", "---"]),
    ])
    for item in payload["adjudications"]:
        lines.append(markdown_table_row([
            item["anchor_id"],
            item["anchor_kind"],
            item["family"],
            item["adjudicated_quality"],
            item["adjudicated_rework"],
            item["decision"],
            item["rubric_rule"],
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
    parser = argparse.ArgumentParser(description="Adjudicate QBS reviewer calibration anchors.")
    parser.add_argument("--anchors", type=Path, default=QBS_ROOT / "reviewer-calibration-anchors-qbs15.json")
    parser.add_argument("--output", type=Path, default=QBS_ROOT / "reviewer-calibration-adjudication-qbs16.json")
    parser.add_argument("--env-file", action="append", default=[])
    parser.add_argument("--adjudicator", default="alibaba:qwen-turbo")
    parser.add_argument("--include-consensus", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--status", default="")
    parser.add_argument("--prompt-version", default="qbs16-anchor-adjudication-v1")
    parser.add_argument("--md-output", type=Path)
    args = parser.parse_args()

    anchors = read_json(args.anchors)
    corpus = read_json(QBS_ROOT / "powered-single-provider-corpus-v1.json")
    corpus_by_id = {task["task_id"]: task for task in corpus["tasks"]}
    spec = parse_adjudicator(args.adjudicator)
    env = load_env([Path(item) for item in args.env_file])
    key = env_key(env, spec["key_names"])

    target_anchors = [
        anchor for anchor in anchors["anchors"]
        if args.include_consensus or anchor.get("adjudication_required")
    ]
    if args.limit:
        target_anchors = target_anchors[:args.limit]

    adjudications: list[dict[str, Any]] = []
    usage: list[dict[str, Any]] = []
    for anchor in target_anchors:
        print(f"QBS adjudicating {anchor['anchor_id']} {anchor['output_id']}", flush=True)
        payload = build_payload(anchor, corpus_by_id[anchor["task_id"]])
        payload["prompt_version"] = args.prompt_version
        result = call_adjudicator(spec, key, payload)
        if not result.get("ok"):
            raise RuntimeError(f"adjudicator failed for {anchor['anchor_id']}: {result.get('error')}")
        parsed = result["parsed"]
        reviewer_quality = anchor.get("reviewer_quality")
        reviewer_rework = anchor.get("reviewer_rework")
        if reviewer_quality is None:
            reviewer_scores = anchor.get("reviewer_scores", {})
            reviewer_quality = {
                reviewer_id: row.get("raw_quality")
                for reviewer_id, row in reviewer_scores.items()
            }
            reviewer_rework = {
                reviewer_id: row.get("rework")
                for reviewer_id, row in reviewer_scores.items()
            }
        adjudications.append({
            "anchor_id": anchor["anchor_id"],
            "anchor_kind": anchor["anchor_kind"],
            "source_run_id": anchor["source_run_id"],
            "output_id": anchor["output_id"],
            "task_id": anchor["task_id"],
            "config": anchor["config"],
            "family": anchor["family"],
            "calibration_issue": anchor["calibration_issue"],
            "reviewer_quality": reviewer_quality,
            "reviewer_rework": reviewer_rework,
            "adjudicated_quality": clamp_int(parsed.get("adjudicated_quality"), 0, 4),
            "adjudicated_rework": normalize_rework(parsed.get("adjudicated_rework")),
            "decision": str(parsed.get("decision", "cannot_adjudicate")),
            "rationale": redact(str(parsed.get("rationale", "")))[:700],
            "rubric_rule": redact(str(parsed.get("rubric_rule", "")))[:500],
        })
        usage.append({
            "anchor_id": anchor["anchor_id"],
            "latencyMs": result.get("latencyMs"),
            "usage": result.get("usage", {}),
        })

    inferred_status = "QBS16_ANCHOR_ADJUDICATION_COMPLETE_NO_NEW_SCORE"
    if "qbs26" in args.anchors.name.lower() or "qbs27" in args.output.name.lower():
        inferred_status = "QBS27_R9_ANCHOR_ADJUDICATION_COMPLETE_NO_NEW_SCORE"

    payload = {
        "status": args.status or inferred_status,
        "prompt_version": args.prompt_version,
        "source_anchor_file": str(args.anchors).replace("\\", "/"),
        "adjudicator": {
            "provider": spec["provider"],
            "model": spec["model"],
            "limitation": "Model adjudication fallback, not a human gold-label review.",
        },
        "claim_boundary": (
            "This artifact does not execute a new live QBS run, does not mutate "
            "R9 scores, and does not create a public QBS quality claim."
        ),
        "adjudications": adjudications,
        "summary": summarize(adjudications),
        "usage": usage,
    }
    write_json(args.output, payload)
    if args.md_output:
        write_markdown(args.md_output, payload)
    print(json.dumps({
        "status": payload["status"],
        "adjudication_count": len(adjudications),
        "output": str(args.output),
        "summary": payload["summary"],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
