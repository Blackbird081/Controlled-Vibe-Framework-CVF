#!/usr/bin/env python
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


META_PATTERNS = {
    "domain": re.compile(r"\*\*Domain:\*\*\s*(.+)", re.IGNORECASE),
    "difficulty": re.compile(r"\*\*Difficulty:\*\*\s*(.+)", re.IGNORECASE),
    "cvf_version": re.compile(r"\*\*CVF Version:\*\*\s*(.+)", re.IGNORECASE),
    "skill_version": re.compile(r"\*\*Skill Version:\*\*\s*(.+)", re.IGNORECASE),
    "last_updated": re.compile(r"\*\*Last Updated:\*\*\s*(.+)", re.IGNORECASE),
}

SECTION_PATTERNS = {
    "prerequisites": [r"Prerequisites"],
    "purpose": [r"Mục đích"],
    "form_input": [r"Form Input"],
    "expected_output": [r"Expected Output", r"Output"],
    "evaluation": [r"Cách đánh giá", r"Checklist", r"Đánh giá"],
    "common_failures": [r"Common Failures", r"Lỗi Thường Gặp"],
    "tips": [r"Tips"],
    "example": [r"Ví dụ thực tế"],
    "related": [r"Related Skills"],
    "version_history": [r"Version History"],
    "next_step": [r"Next Step", r"Bước tiếp theo"],
}

REQUIRED_SECTIONS = ["example", "related", "version_history"]
RECOMMENDED_SECTIONS = [
    "prerequisites",
    "purpose",
    "form_input",
    "expected_output",
    "evaluation",
    "common_failures",
    "tips",
    "next_step",
]

PLACEHOLDER_PATTERNS = [
    r"\[Tên Skill\]",
    r"\[Domain name\]",
    r"\[Trường hợp\s+\d+\]",
    r"\[Output\s+\d+\]",
    r"\[Lỗi\s+\d+\]",
    r"\[Tip\s+\d+\]",
    r"\[Tên Skill Tiếp Theo\]",
    r"\[path_to",
    r"YYYY-MM-DD",
    r"\bTODO\b",
    r"\bTBD\b",
]

SEMVER_RE = re.compile(r"^\d+\.\d+\.\d+$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_meta(text: str) -> Dict[str, Optional[str]]:
    meta: Dict[str, Optional[str]] = {key: None for key in META_PATTERNS.keys()}
    for key, pattern in META_PATTERNS.items():
        match = pattern.search(text)
        if match:
            meta[key] = match.group(1).strip()
    return meta


def get_headings(text: str) -> List[str]:
    headings: List[str] = []
    for line in text.splitlines():
        match = re.match(r"^##\s+(.*)$", line.strip())
        if match:
            headings.append(match.group(1).strip())
    return headings


def has_section(headings: List[str], key: str) -> bool:
    patterns = SECTION_PATTERNS.get(key, [])
    for heading in headings:
        for pattern in patterns:
            if re.search(pattern, heading, re.IGNORECASE):
                return True
    return False


def extract_section(text: str, key: str) -> Optional[str]:
    patterns = SECTION_PATTERNS.get(key, [])
    for pattern in patterns:
        match = re.search(rf"^##\s+.*{pattern}.*$", text, re.IGNORECASE | re.MULTILINE)
        if not match:
            continue
        start = match.end()
        next_heading = re.search(r"^##\s+", text[start:], re.MULTILINE)
        end = start + next_heading.start() if next_heading else len(text)
        return text[start:end].strip()
    return None


def validate_file(path: Path) -> Tuple[List[str], List[str]]:
    text = read_text(path)
    issues: List[str] = []
    warnings: List[str] = []

    lines = text.splitlines()
    if not any(line.startswith("# ") for line in lines[:5]):
        issues.append("Missing title line (# Skill Name) near top of file.")

    meta = extract_meta(text)
    for key in ["domain", "difficulty", "cvf_version", "skill_version", "last_updated"]:
        if not meta.get(key):
            issues.append(f"Missing metadata: {key.replace('_', ' ').title()}.")

    if meta.get("cvf_version") and "v1.5.2" not in meta["cvf_version"]:
        warnings.append(f"CVF Version is '{meta['cvf_version']}', expected v1.5.2.")

    if meta.get("skill_version") and not SEMVER_RE.match(meta["skill_version"]):
        warnings.append(f"Skill Version '{meta['skill_version']}' is not semver.")

    if meta.get("last_updated"):
        if meta["last_updated"] == "YYYY-MM-DD" or not DATE_RE.match(meta["last_updated"]):
            issues.append(f"Last Updated '{meta['last_updated']}' is not a valid date (YYYY-MM-DD).")

    headings = get_headings(text)
    for section in REQUIRED_SECTIONS:
        if not has_section(headings, section):
            issues.append(f"Missing required section: {section}.")

    for section in RECOMMENDED_SECTIONS:
        if not has_section(headings, section):
            warnings.append(f"Missing recommended section: {section}.")

    related_content = extract_section(text, "related")
    if related_content is not None:
        if not re.search(r"^- \[.+\]\(.+\)", related_content, re.MULTILINE):
            warnings.append("Related Skills section has no markdown links.")

    version_content = extract_section(text, "version_history")
    if version_content is not None:
        if not re.search(r"^\|\s*\d+\.\d+\.\d+\s*\|", version_content, re.MULTILINE):
            warnings.append("Version History section missing semver rows.")

    example_content = extract_section(text, "example")
    if example_content is not None:
        if "Input mẫu" not in example_content or "Output mẫu" not in example_content:
            warnings.append("Ví dụ thực tế section missing Input mẫu/Output mẫu blocks.")

    for pattern in PLACEHOLDER_PATTERNS:
        if re.search(pattern, text):
            issues.append(f"Placeholder content detected: {pattern}")

    return issues, warnings


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Validate CVF v1.5.2 skill files.")
    parser.add_argument("--root", type=str, default=None, help="Root folder containing skill files.")
    parser.add_argument("--json", type=str, default=None, help="Write JSON report to file.")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as errors.")
    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root else Path.cwd()
    skill_files = sorted(root.rglob("*.skill.md"))

    report = []
    total_issues = 0
    total_warnings = 0

    for path in skill_files:
        issues, warnings = validate_file(path)
        if issues or warnings:
            report.append({
                "file": str(path.relative_to(root)),
                "issues": issues,
                "warnings": warnings,
            })
        total_issues += len(issues)
        total_warnings += len(warnings)

    summary = {
        "root": str(root),
        "total_files": len(skill_files),
        "files_with_findings": len(report),
        "issues": total_issues,
        "warnings": total_warnings,
    }

    if args.json:
        output_path = Path(args.json)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps({"summary": summary, "details": report}, indent=2), encoding="utf-8")

    print("CVF Skill Validation Report")
    print(f"Root: {summary['root']}")
    print(f"Files: {summary['total_files']}")
    print(f"Files with findings: {summary['files_with_findings']}")
    print(f"Issues: {summary['issues']} | Warnings: {summary['warnings']}")

    for entry in report:
        print("\n---")
        print(entry["file"])
        for issue in entry["issues"]:
            print(f"  [ERROR] {issue}")
        for warning in entry["warnings"]:
            print(f"  [WARN ] {warning}")

    if total_issues > 0 or (args.strict and total_warnings > 0):
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
