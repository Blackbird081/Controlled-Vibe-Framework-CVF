#!/usr/bin/env python3
"""
Score UAT records and export reports (JSON/CSV/Markdown).
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Dict, List, Tuple


ROOT_DIR = Path(__file__).resolve().parents[3]
UAT_ROOT = ROOT_DIR / "governance" / "skill-library" / "uat" / "results"
REPORT_DIR = ROOT_DIR / "governance" / "skill-library" / "uat" / "reports"
SKILL_ROOT = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"

TODAY = date(2026, 2, 7)


@dataclass
class ScoreResult:
    skill_id: str
    title: str
    domain: str
    risk_level: str
    status: str
    badge: str  # NOT_RUN, NEEDS_UAT, VALIDATED, FAILED
    decision_score: int
    completeness_score: int
    scenario_score: int
    final_score: int
    quality: str
    uat_skill_version: str
    uat_date: str


def parse_meta(text: str) -> Tuple[str, str]:
    title = match(text, r"^#\s+(.+)$")
    domain = match(text, r">\s*\*\*Domain:\*\*\s*(.+)$")
    return title, domain


def match(text: str, pattern: str) -> str:
    found = re.search(pattern, text, re.MULTILINE)
    return found.group(1).strip() if found else ""


def parse_decision_status(text: str) -> str:
    if re.search(r"-\s*(?:\[[xX]\]|☑|✅)\s*FAIL\b", text, re.IGNORECASE):
        return "FAIL"
    if re.search(r"-\s*(?:\[[xX]\]|☑|✅)\s*SOFT FAIL\b", text, re.IGNORECASE):
        return "SOFT FAIL"
    if re.search(r"-\s*(?:\[[xX]\]|☑|✅)\s*PASS\b", text, re.IGNORECASE):
        return "PASS"
    return "Not Run"


def decision_score(status: str) -> int:
    if status == "PASS":
        return 100
    if status == "SOFT FAIL":
        return 60
    return 0


def parse_general_info_completion(text: str) -> Tuple[int, int]:
    section = extract_section(text, "0. General Information", "1. Risk Profile")
    if not section:
        return 0, 0
    lines = [line for line in section.splitlines() if line.strip().startswith("|")]
    rows = []
    for line in lines:
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 2:
            continue
        if parts[0].lower() in ("field", "agent name"):
            rows.append((parts[0], parts[1] if len(parts) > 1 else ""))
        elif parts[0].lower() in ("field",):
            continue
        else:
            rows.append((parts[0], parts[1] if len(parts) > 1 else ""))
    if not rows:
        return 0, 0
    completed = sum(1 for _, value in rows if value.strip())
    return completed, len(rows)


def parse_scenario_completion(text: str) -> Tuple[int, int]:
    section = extract_section(text, "B.3 Test Scenarios", "C. Risk Containment Validation")
    if not section:
        return 0, 0
    lines = [line for line in section.splitlines() if line.strip().startswith("|")]
    if len(lines) < 3:
        return 0, 0
    rows = []
    for line in lines[2:]:
        parts = [p.strip() for p in line.strip().strip("|").split("|")]
        if len(parts) < 5:
            continue
        result = parts[4]
        rows.append(result)
    if not rows:
        return 0, 0
    completed = sum(1 for value in rows if value.strip())
    return completed, len(rows)


def extract_section(text: str, start: str, end: str) -> str:
    pattern = rf"##\s+{re.escape(start)}(.*?)##\s+{re.escape(end)}"
    match_obj = re.search(pattern, text, re.DOTALL)
    if match_obj:
        return match_obj.group(1)
    return ""


def parse_risk_level(text: str) -> str:
    return match(text, r"\|\s*Risk Level \(from record\)\s*\|\s*([^|]+)\|") or "R1"


def quality_label(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 40:
        return "Needs Review"
    return "Not Ready"


def compute_score(text: str, skill_id: str, title: str, domain: str) -> ScoreResult:
    status = parse_decision_status(text)
    decision = decision_score(status)
    completed, total = parse_general_info_completion(text)
    completeness = int(round((completed / total) * 100)) if total else 0
    scenario_done, scenario_total = parse_scenario_completion(text)
    scenario = int(round((scenario_done / scenario_total) * 100)) if scenario_total else 0
    final_score = int(round(0.5 * decision + 0.3 * completeness + 0.2 * scenario))
    risk = parse_risk_level(text)

    # Extract UAT metadata for badge assignment
    uat_skill_ver = match(text, r"\|\s*Skill Version\s*\|\s*([^|]+)\|") or ""
    uat_date_str = match(text, r"\|\s*UAT Date\s*\|\s*([^|]+)\|") or TODAY.isoformat()

    # Badge assignment per UAT_STATUS_SPEC
    if status == "Not Run":
        badge = "NOT_RUN"
    elif status == "PASS":
        badge = "VALIDATED"
    elif status in ("FAIL", "SOFT FAIL"):
        badge = "FAILED"
    else:
        badge = "NOT_RUN"

    return ScoreResult(
        skill_id=skill_id,
        title=title or skill_id,
        domain=domain or "unknown",
        risk_level=risk,
        status=status,
        badge=badge,
        decision_score=decision,
        completeness_score=completeness,
        scenario_score=scenario,
        final_score=final_score,
        quality=quality_label(final_score),
        uat_skill_version=uat_skill_ver.strip(),
        uat_date=uat_date_str.strip(),
    )


def load_skill_domain_map() -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for path in SKILL_ROOT.rglob("*.skill.md"):
        skill_id = path.stem.replace(".skill", "")
        content = path.read_text(encoding="utf-8")
        domain = match(content, r">\s*\*\*Domain:\*\*\s*(.+)$")
        if not domain:
            domain = path.parent.name
        mapping[skill_id] = domain
    return mapping


def main() -> int:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    domain_map = load_skill_domain_map()
    results: List[ScoreResult] = []

    for path in sorted(UAT_ROOT.glob("UAT-*.md")):
        skill_id = path.stem.replace("UAT-", "")
        text = path.read_text(encoding="utf-8")
        title, domain = parse_meta(text)
        if not domain:
            domain = domain_map.get(skill_id, "unknown")
        results.append(compute_score(text, skill_id, title, domain))

    payload = {
        "generated": TODAY.isoformat(),
        "total": len(results),
        "skills": [result.__dict__ for result in results],
    }

    (REPORT_DIR / "uat_score_report.json").write_text(
        json.dumps(payload, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    with (REPORT_DIR / "uat_score_report.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow([
            "skill_id",
            "title",
            "domain",
            "risk_level",
            "status",
            "badge",
            "decision_score",
            "completeness_score",
            "scenario_score",
            "final_score",
            "quality",
            "uat_skill_version",
            "uat_date",
        ])
        for result in results:
            writer.writerow([
                result.skill_id,
                result.title,
                result.domain,
                result.risk_level,
                result.status,
                result.badge,
                result.decision_score,
                result.completeness_score,
                result.scenario_score,
                result.final_score,
                result.quality,
                result.uat_skill_version,
                result.uat_date,
            ])

    # Badge summary
    badge_counts = {"VALIDATED": 0, "FAILED": 0, "NOT_RUN": 0, "NEEDS_UAT": 0}
    for result in results:
        badge_counts[result.badge] = badge_counts.get(result.badge, 0) + 1

    domain_counts: Dict[str, int] = {}
    for result in results:
        domain_counts[result.domain] = domain_counts.get(result.domain, 0) + 1

    lines = [
        "# UAT Score Report",
        "",
        f"> **Generated:** {TODAY.isoformat()}",
        f"> **Total Skills:** {len(results)}",
        "",
        "## Badge Summary",
        "",
        "| Badge | Count | Meaning |",
        "|---|---:|---|",
        f"| ✅ VALIDATED | {badge_counts['VALIDATED']} | UAT passed, version synced |",
        f"| ❌ FAILED | {badge_counts['FAILED']} | UAT explicitly failed |",
        f"| ⚠️ NEEDS_UAT | {badge_counts['NEEDS_UAT']} | Spec changed, UAT stale |",
        f"| 🔘 NOT_RUN | {badge_counts['NOT_RUN']} | UAT not yet executed |",
        "",
        "## Domain Coverage",
        "| Domain | Skills |",
        "|---|---|",
    ]
    for domain, count in sorted(domain_counts.items()):
        lines.append(f"| {domain} | {count} |")

    lines += [
        "",
        "## Skill Scores",
        "| Skill ID | Domain | Status | Badge | Score | Quality |",
        "|---|---|---|---|---|---|",
    ]
    for result in results:
        badge_icon = {"VALIDATED": "✅", "FAILED": "❌", "NEEDS_UAT": "⚠️", "NOT_RUN": "🔘"}.get(result.badge, "🔘")
        lines.append(
            f"| {result.skill_id} | {result.domain} | {result.status} | {badge_icon} {result.badge} | {result.final_score} | {result.quality} |"
        )

    (REPORT_DIR / "uat_score_report.md").write_text("\n".join(lines), encoding="utf-8")
    print(f"Scored {len(results)} UAT records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
