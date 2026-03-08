#!/usr/bin/env python3
"""
Export a canonical CVF governance state registry from source markdown records.

The exported JSON is meant to be a single-source runtime snapshot that other
extensions can consume without each one reparsing the markdown records ad hoc.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AGENT_REGISTRY = REPO_ROOT / "governance" / "toolkit" / "03_CONTROL" / "CVF_AGENT_REGISTRY.md"
DEFAULT_SELF_UAT_LOG = REPO_ROOT / "governance" / "toolkit" / "04_TESTING" / "CVF_SELF_UAT_DECISION_LOG.md"
DEFAULT_OUTPUT = REPO_ROOT / "docs" / "reference" / "CVF_GOVERNANCE_STATE_REGISTRY.json"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _split_markdown_entries(markdown: str) -> list[str]:
    return [block.strip() for block in markdown.split("\n---") if block.strip()]


def _extract_operational_section(markdown: str, title: str) -> str:
    import re

    pattern = re.compile(rf"^##+\s+(?:\d+\.\s+)?{re.escape(title)}\s*$", re.IGNORECASE | re.MULTILINE)
    match = pattern.search(markdown)
    if not match:
        return markdown
    return markdown[match.end():]


def _parse_entry(block: str) -> dict[str, str]:
    entry: dict[str, str] = {}
    for raw_line in block.splitlines():
        line = raw_line.strip()
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        entry[key.strip()] = value.strip()
    return entry


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_registry(markdown: str) -> list[dict[str, object]]:
    parsed: list[dict[str, object]] = []
    for block in _split_markdown_entries(_extract_operational_section(markdown, "ACTIVE REGISTRY ENTRIES")):
        entry = _parse_entry(block)
        agent_id = entry.get("Agent ID")
        if not agent_id:
            continue
        parsed.append(
            {
                "agentId": agent_id,
                "certificationStatus": entry.get("Certification Status", ""),
                "approvedPhases": _split_csv(entry.get("Approved Phases")),
                "approvedSkills": _split_csv(entry.get("Approved Skills")),
                "lastSelfUatDate": entry.get("Last Self-UAT Date", ""),
            }
        )
    return parsed


def _parse_self_uat(markdown: str) -> list[dict[str, str]]:
    parsed: list[dict[str, str]] = []
    for block in _split_markdown_entries(_extract_operational_section(markdown, "OPERATIONAL LOG ENTRIES")):
        entry = _parse_entry(block)
        agent_id = entry.get("Agent Identifier")
        if not agent_id:
            continue
        final_result = entry.get("FINAL RESULT", "")
        if final_result == "PASS":
            status = "PASS"
        elif final_result == "FAIL":
            status = "FAIL"
        else:
            status = "NOT_TESTED"
        parsed.append(
            {
                "agentId": agent_id,
                "status": status,
                "lastRunAt": entry.get("Timestamp", ""),
            }
        )
    return parsed


def _pick_latest_uat(entries: list[dict[str, str]], agent_id: str) -> dict[str, str] | None:
    matching = [entry for entry in entries if entry.get("agentId", "").strip().upper() == agent_id.strip().upper()]
    if not matching:
        return None
    matching.sort(key=lambda item: item.get("lastRunAt", ""), reverse=True)
    latest = matching[0]
    return {
        "status": latest.get("status", "NOT_TESTED"),
        "lastRunAt": latest.get("lastRunAt", ""),
    }


def build_registry_document() -> dict[str, object]:
    registry_entries = _parse_registry(_read(DEFAULT_AGENT_REGISTRY))
    uat_entries = _parse_self_uat(_read(DEFAULT_SELF_UAT_LOG))

    agents: dict[str, dict[str, object]] = {}
    for entry in sorted(registry_entries, key=lambda item: str(item.get("agentId", ""))):
        agent_id = str(entry["agentId"])
        normalized_key = agent_id.strip().upper()
        latest_uat = _pick_latest_uat(uat_entries, agent_id)
        agents[normalized_key] = {
            "registryBinding": {
                "agentId": agent_id,
                "certificationStatus": entry.get("certificationStatus", ""),
                "approvedPhases": entry.get("approvedPhases", []),
                "approvedSkills": entry.get("approvedSkills", []),
                "lastSelfUatDate": entry.get("lastSelfUatDate", ""),
            },
            "uatBinding": latest_uat,
        }

    return {
        "schemaVersion": "2026-03-07",
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "status": "active" if agents else "template-only",
        "agentCount": len(agents),
        "sources": {
            "agentRegistry": _rel(DEFAULT_AGENT_REGISTRY),
            "selfUatDecisionLog": _rel(DEFAULT_SELF_UAT_LOG),
        },
        "agents": agents,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Export a canonical CVF governance state registry.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output JSON path")
    args = parser.parse_args()

    output = Path(args.output)
    if not output.is_absolute():
        output = (REPO_ROOT / output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    document = build_registry_document()
    output.write_text(json.dumps(document, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Exported governance state registry: {_rel(output)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
