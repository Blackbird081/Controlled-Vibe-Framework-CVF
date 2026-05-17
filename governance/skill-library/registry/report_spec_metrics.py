#!/usr/bin/env python3
"""
Compute Spec Score/Quality for existing .skill.md files without modifying sources.

Scoring v2 (2026-02-08) — Calibrated rubric:
  - Section existence (40% of weight)
  - Content depth / word count (20%)
  - Concrete examples vs placeholders (15%)
  - Input constraints defined (10%)
  - Output format explicit (10%)
  - Domain-specific checks (5%)

Outputs:
- spec_metrics_report.json  (with per-skill score_breakdown)
- spec_metrics_report.csv
- spec_metrics_report.md
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


SECTION_PATTERNS: Dict[str, re.Pattern] = {
    "purpose": re.compile(r"^##\s+.*(Mục đích|Purpose)", re.IGNORECASE),
    "form_input": re.compile(r"^##\s+.*(Form Input|Input|Thông tin đầu vào)", re.IGNORECASE),
    "expected_output": re.compile(r"^##\s+.*(Expected Output|Output|Định dạng kết quả|Kết quả mong muốn)", re.IGNORECASE),
    "constraints": re.compile(r"^##\s+.*(Constraints|Execution Constraints|Ràng buộc)", re.IGNORECASE),
    "validation": re.compile(r"^##\s+.*(Validation Hooks|Validation|Cách đánh giá|Đánh giá)", re.IGNORECASE),
    "example": re.compile(r"^##\s+.*(Ví dụ|Example|Sample)", re.IGNORECASE),
}

# --- Section weight: max points if section exists + has depth ---
SECTION_MAX: Dict[str, int] = {
    "purpose": 15,
    "form_input": 25,
    "expected_output": 20,
    "constraints": 15,
    "validation": 15,
    "example": 10,
}

# Minimum word count thresholds for "adequate depth"
MIN_WORDS: Dict[str, int] = {
    "purpose": 30,
    "form_input": 40,
    "expected_output": 30,
    "constraints": 20,
    "validation": 25,
    "example": 50,
}

PLACEHOLDER_PATTERNS = [
    r"\[Tên Skill\]", r"\[Domain name\]", r"\[Trường hợp\s+\d+\]",
    r"\[Output\s+\d+\]", r"\[Lỗi\s+\d+\]", r"\[Tip\s+\d+\]",
    r"\[Tên Skill Tiếp Theo\]", r"\[path_to", r"YYYY-MM-DD",
    r"\bTODO\b", r"\bTBD\b",
]


def normalize_title(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Untitled"


def find_section_index(lines: List[str], pattern: re.Pattern) -> int:
    for idx, line in enumerate(lines):
        if pattern.search(line):
            return idx
    return -1


def extract_section_text(lines: List[str], pattern: re.Pattern) -> Optional[str]:
    """Return the text content of a section (between its heading and the next ## heading)."""
    start = find_section_index(lines, pattern)
    if start < 0:
        return None
    content_lines: List[str] = []
    for line in lines[start + 1:]:
        if line.startswith("## "):
            break
        content_lines.append(line)
    return "\n".join(content_lines).strip()


def word_count(text: Optional[str]) -> int:
    if not text:
        return 0
    return len(re.findall(r"\S+", text))


def has_form_input_table(lines: List[str], start_idx: int) -> bool:
    if start_idx < 0:
        return False
    table_lines = []
    for line in lines[start_idx + 1:]:
        if line.startswith("## "):
            break
        if "|" in line:
            table_lines.append(line)
    return len(table_lines) >= 2


def has_concrete_values(text: Optional[str]) -> bool:
    """Check if text contains concrete examples (numbers, quoted strings, specific names)."""
    if not text:
        return False
    # Look for: quoted strings, numbers with units, specific code/commands, URLs
    concrete = (
        re.search(r'"[^"]{3,}"', text)            # quoted strings
        or re.search(r"'[^']{3,}'", text)          # single-quoted
        or re.search(r"`[^`]{3,}`", text)          # backtick code
        or re.search(r"\d+\s*(GB|MB|ms|%|VND|USD|\$|giây|phút)", text, re.IGNORECASE)
        or re.search(r"https?://", text)
        or re.search(r"```", text)                 # code blocks
    )
    return concrete is not None


def has_input_constraints(text: Optional[str]) -> bool:
    """Check if input section defines types, ranges, or required fields."""
    if not text:
        return False
    signals = (
        re.search(r"(bắt buộc|required|must|phải có)", text, re.IGNORECASE)
        or re.search(r"(string|number|boolean|integer|array|object|text|url|file)", text, re.IGNORECASE)
        or re.search(r"(tối đa|tối thiểu|max|min|range|limit)", text, re.IGNORECASE)
        or has_form_input_table(text.splitlines(), 0)
    )
    return signals is not None and signals


def has_output_schema(text: Optional[str]) -> bool:
    """Check if output section has explicit format/structure definition."""
    if not text:
        return False
    signals = (
        re.search(r"(format|định dạng|cấu trúc|template|schema|mẫu)", text, re.IGNORECASE)
        or re.search(r"```", text)          # code block with format
        or re.search(r"\|.*\|.*\|", text)   # table structure
        or re.search(r"(section|phần|mục)\s*\d", text, re.IGNORECASE)
    )
    return signals is not None and signals


def count_placeholders(text: str) -> int:
    count = 0
    for pattern in PLACEHOLDER_PATTERNS:
        count += len(re.findall(pattern, text))
    return count


def compute_spec_score(lines: List[str]) -> Tuple[int, Dict[str, Any]]:
    """
    Calibrated scoring v2.

    Returns (score, breakdown) where breakdown has per-section details.
    """
    full_text = "\n".join(lines)
    breakdown: Dict[str, Any] = {}
    total_score = 0.0

    for key, pattern in SECTION_PATTERNS.items():
        max_pts = SECTION_MAX[key]
        section_text = extract_section_text(lines, pattern)
        exists = section_text is not None
        wc = word_count(section_text)
        min_wc = MIN_WORDS[key]

        if not exists:
            # Section missing → 0 points
            breakdown[key] = {
                "score": 0, "max": max_pts, "status": "MISSING",
                "reason": "Section not found"
            }
            continue

        # --- Existence: 50% of section weight ---
        section_score = max_pts * 0.50

        # --- Content depth: 30% of section weight ---
        if wc >= min_wc:
            section_score += max_pts * 0.30
            depth_status = "OK"
        elif wc >= min_wc * 0.5:
            section_score += max_pts * 0.15
            depth_status = f"Shallow ({wc}/{min_wc} words)"
        else:
            depth_status = f"Too brief ({wc}/{min_wc} words)"

        # --- Quality signals: 20% of section weight ---
        quality_bonus = 0.0
        quality_notes: List[str] = []

        if key == "form_input":
            if has_input_constraints(section_text):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("Missing input types/constraints")
            if has_form_input_table(lines, find_section_index(lines, pattern)):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("No structured input table")

        elif key == "expected_output":
            if has_output_schema(section_text):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("No explicit output format/schema")
            if has_concrete_values(section_text):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("No concrete output examples")

        elif key == "example":
            if has_concrete_values(section_text):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("Examples lack concrete values")
            if "Input mẫu" in (section_text or "") or "Output mẫu" in (section_text or ""):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("Missing Input mẫu/Output mẫu blocks")

        elif key == "validation":
            if re.search(r"(\[\s*[xX ]?\s*\]|checklist|tiêu chí)", section_text or "", re.IGNORECASE):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("No checklist or criteria items")
            if has_concrete_values(section_text):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("Validation criteria are generic")

        elif key == "constraints":
            if re.search(r"(không được|must not|forbidden|cấm)", section_text or "", re.IGNORECASE):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("No forbidden actions defined")
            if re.search(r"(timeout|giới hạn|limit|scope|phạm vi)", section_text or "", re.IGNORECASE):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("No scope/limit constraints")

        elif key == "purpose":
            if wc >= min_wc * 1.5:
                quality_bonus += max_pts * 0.10
            if has_concrete_values(section_text):
                quality_bonus += max_pts * 0.10
            else:
                quality_notes.append("Purpose is generic, lacks specificity")

        section_score += quality_bonus
        section_score = round(min(section_score, max_pts), 1)

        status = "PASS" if section_score >= max_pts * 0.8 else ("WEAK" if section_score >= max_pts * 0.5 else "POOR")
        reason = "; ".join(quality_notes) if quality_notes else (depth_status if depth_status != "OK" else "")

        breakdown[key] = {
            "score": section_score, "max": max_pts, "status": status,
            "word_count": wc, "reason": reason if reason else None
        }
        total_score += section_score

    # --- Global penalty: placeholders ---
    placeholder_count = count_placeholders(full_text)
    if placeholder_count > 0:
        penalty = min(placeholder_count * 3, 15)
        total_score -= penalty
        breakdown["_placeholders"] = {"count": placeholder_count, "penalty": -penalty}

    final_score = max(0, min(100, round(total_score)))

    # Compute missing_for_excellent
    missing_for_excellent: List[str] = []
    for key, info in breakdown.items():
        if key.startswith("_"):
            continue
        if info["status"] in ("MISSING", "WEAK", "POOR") and info.get("reason"):
            missing_for_excellent.append(info["reason"])

    breakdown["_summary"] = {
        "total_score": final_score,
        "missing_for_excellent": missing_for_excellent[:5],
    }

    return final_score, breakdown


def spec_quality(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 50:
        return "Needs Review"
    return "Not Ready"


def spec_gate(score: int) -> str:
    if score >= 85:
        return "PASS"
    if score >= 60:
        return "CLARIFY"
    return "FAIL"


def collect_skills(root: Path) -> List[Path]:
    return sorted(root.rglob("*.skill.md"))


def build_reports(skills: List[Path]) -> Tuple[List[dict], dict]:
    rows = []
    missing_counter = Counter()
    weak_counter = Counter()
    domain_quality = defaultdict(Counter)
    domain_scores = defaultdict(list)

    for skill_path in skills:
        text = skill_path.read_text(encoding="utf-8")
        lines = text.splitlines()
        title = normalize_title(text)
        domain = skill_path.parent.name.replace("_", " ").title()
        skill_id = skill_path.stem

        score, breakdown = compute_spec_score(lines)
        quality = spec_quality(score)
        gate = spec_gate(score)

        # Count missing and weak sections
        missing_sections = []
        weak_sections = []
        for key, info in breakdown.items():
            if key.startswith("_"):
                continue
            if info["status"] == "MISSING":
                missing_counter[key] += 1
                missing_sections.append(key)
            elif info["status"] in ("WEAK", "POOR"):
                weak_counter[key] += 1
                weak_sections.append(key)

        domain_quality[domain][quality] += 1
        domain_scores[domain].append(score)

        # Top reasons for improvement
        improvement_hints = breakdown.get("_summary", {}).get("missing_for_excellent", [])

        rows.append(
            {
                "skill_id": skill_id,
                "title": title,
                "domain": domain,
                "spec_score": score,
                "spec_quality": quality,
                "spec_gate": gate,
                "missing_sections": ", ".join(missing_sections) if missing_sections else "",
                "weak_sections": ", ".join(weak_sections) if weak_sections else "",
                "improvement_hints": "; ".join(improvement_hints[:3]) if improvement_hints else "",
                "score_breakdown": {k: v for k, v in breakdown.items() if not k.startswith("_")},
                "path": str(skill_path),
            }
        )

    summary = {
        "total_skills": len(rows),
        "scoring_version": "v2-calibrated (2026-02-08)",
        "missing_sections": dict(missing_counter.most_common()),
        "weak_sections": dict(weak_counter.most_common()),
        "domain_quality": {k: dict(v) for k, v in domain_quality.items()},
        "domain_avg_score": {
            k: round(sum(v) / len(v), 1) if v else 0 for k, v in domain_scores.items()
        },
        "quality_distribution": {
            "Excellent": sum(1 for r in rows if r["spec_quality"] == "Excellent"),
            "Good": sum(1 for r in rows if r["spec_quality"] == "Good"),
            "Needs Review": sum(1 for r in rows if r["spec_quality"] == "Needs Review"),
            "Not Ready": sum(1 for r in rows if r["spec_quality"] == "Not Ready"),
        },
    }
    return rows, summary


def write_json(rows: List[dict], summary: dict, output_dir: Path) -> Path:
    out_path = output_dir / "spec_metrics_report.json"
    payload = {"summary": summary, "skills": rows}
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path


def write_csv(rows: List[dict], output_dir: Path) -> Path:
    out_path = output_dir / "spec_metrics_report.csv"
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "skill_id",
                "title",
                "domain",
                "spec_score",
                "spec_quality",
                "spec_gate",
                "missing_sections",
                "weak_sections",
                "improvement_hints",
                "path",
            ],
            extrasaction="ignore",
        )
        writer.writeheader()
        writer.writerows(rows)
    return out_path


def write_md(summary: dict, rows: List[dict], output_dir: Path) -> Path:
    out_path = output_dir / "spec_metrics_report.md"
    lines = [
        "# Spec Metrics Report (Calibrated v2)",
        "",
        f"- **Scoring version:** {summary.get('scoring_version', 'v2')}",
        f"- **Total skills:** {summary['total_skills']}",
        "",
        "## Quality Distribution",
        "",
        "| Quality Tier | Count |",
        "|---|---:|",
    ]
    for tier, count in summary.get("quality_distribution", {}).items():
        lines.append(f"| {tier} | {count} |")

    lines.extend([
        "",
        "## Domain Averages",
        "",
        "| Domain | Avg Spec Score | Tier |",
        "|---|---:|---|",
    ])
    for domain, score in sorted(summary["domain_avg_score"].items()):
        tier = spec_quality(round(score))
        lines.append(f"| {domain} | {score} | {tier} |")

    lines.extend([
        "",
        "## Missing Sections (Top)",
        "",
        "| Section | Count |",
        "|---|---:|",
    ])
    for section, count in summary["missing_sections"].items():
        lines.append(f"| {section} | {count} |")

    if summary.get("weak_sections"):
        lines.extend([
            "",
            "## Weak Sections (Top)",
            "",
            "| Section | Count |",
            "|---|---:|",
        ])
        for section, count in summary["weak_sections"].items():
            lines.append(f"| {section} | {count} |")

    # Skills needing attention
    needs_review = [r for r in rows if r["spec_quality"] in ("Needs Review", "Not Ready")]
    if needs_review:
        lines.extend([
            "",
            "## Skills Needing Attention",
            "",
            "| Skill | Domain | Score | Gate | Top Issue |",
            "|---|---|---:|---|---|",
        ])
        for r in sorted(needs_review, key=lambda x: x["spec_score"]):
            hint = r.get("improvement_hints", "")[:60]
            lines.append(f"| {r['title'][:40]} | {r['domain']} | {r['spec_score']} | {r['spec_gate']} | {hint} |")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Spec metrics report.")
    parser.add_argument(
        "--root",
        default="EXTENSIONS/CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS",
        help="Root directory containing .skill.md files.",
    )
    parser.add_argument(
        "--output-dir",
        default="governance/skill-library/registry/reports",
        help="Directory to store reports.",
    )
    args = parser.parse_args()

    root = Path(args.root)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    skills = collect_skills(root)
    rows, summary = build_reports(skills)

    write_json(rows, summary, output_dir)
    write_csv(rows, output_dir)
    write_md(summary, rows, output_dir)

    print(f"Spec metrics report generated for {len(rows)} skills.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
