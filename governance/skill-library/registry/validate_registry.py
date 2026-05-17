#!/usr/bin/env python3
"""
Validate governance registry files for CI/CD.

Checks:
- Required sections exist in user/agent governance files
- Source links in user skills resolve to .skill.md files
- Index counts match registry files
- Registry count matches source skill library count
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
SKILL_LIBRARY_PATH = ROOT_DIR / "EXTENSIONS" / "CVF_v1.5.2_SKILL_LIBRARY_FOR_END_USERS"
USER_REGISTRY_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "user-skills"
AGENT_REGISTRY_PATH = ROOT_DIR / "governance" / "skill-library" / "registry" / "agent-skills"


USER_REQUIRED_SECTIONS = [
    "## Source",
    "## Governance",
    "## UAT Binding",
]

AGENT_REQUIRED_SECTIONS = [
    "## Source",
    "## Capability",
    "## Governance",
    "## Risk Justification",
    "## UAT Binding",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def find_section_index(lines: list[str], header: str) -> int | None:
    for i, line in enumerate(lines):
        if line.strip() == header:
            return i
    return None


def extract_source_link(lines: list[str]) -> str | None:
    source_idx = find_section_index(lines, "## Source")
    if source_idx is None:
        return None
    for line in lines[source_idx + 1 :]:
        if line.startswith("## "):
            break
        match = re.search(r"\[[^\]]+\]\(([^)]+)\)", line)
        if match:
            return match.group(1).strip()
    return None


def validate_sections(path: Path, required_sections: list[str], errors: list[str]) -> None:
    content = read_text(path)
    for section in required_sections:
        if section not in content:
            errors.append(f"{path}: missing section {section}")


def validate_user_skill(path: Path, errors: list[str]) -> None:
    content = read_text(path)
    if not content.startswith("# USR-"):
        errors.append(f"{path}: header does not start with '# USR-'")

    if "| Risk Level |" not in content:
        errors.append(f"{path}: missing Risk Level row")
    if "| Autonomy |" not in content:
        errors.append(f"{path}: missing Autonomy row")

    lines = content.splitlines()
    link = extract_source_link(lines)
    if not link:
        errors.append(f"{path}: missing source link under '## Source'")
        return

    target_path = (path.parent / link).resolve()
    if not target_path.exists():
        errors.append(f"{path}: broken source link -> {link}")
        return
    if not target_path.name.endswith(".skill.md"):
        errors.append(f"{path}: source link does not target .skill.md -> {link}")


def validate_agent_skill(path: Path, errors: list[str]) -> None:
    content = read_text(path)
    if not content.startswith("# AGT-"):
        errors.append(f"{path}: header does not start with '# AGT-'")

    if "| Risk Level |" not in content:
        errors.append(f"{path}: missing Risk Level row")
    if "| Autonomy |" not in content:
        errors.append(f"{path}: missing Autonomy row")

    if not re.search(r"R[0-4]", content):
        errors.append(f"{path}: missing risk level code (R0-R4)")


def validate_index(index_path: Path, prefix: str, expected_count: int, errors: list[str]) -> None:
    if not index_path.exists():
        errors.append(f"{index_path}: missing INDEX.md")
        return

    content = read_text(index_path)
    link_count = len(re.findall(rf"\[{prefix}-\d+", content))
    if link_count != expected_count:
        errors.append(
            f"{index_path}: link count mismatch ({link_count} != {expected_count})"
        )

    total_match = re.search(r"\\*\\*Total Skills\\*\\*:\\s*(\\d+)", content)
    if not total_match:
        total_match = re.search(r"Total Skills:\\s*(\\d+)", content)
    if total_match:
        total = int(total_match.group(1))
        if total != expected_count:
            errors.append(
                f"{index_path}: Total Skills mismatch ({total} != {expected_count})"
            )


def main() -> int:
    errors: list[str] = []

    if not USER_REGISTRY_PATH.exists():
        errors.append(f"{USER_REGISTRY_PATH}: missing registry directory")
    if not AGENT_REGISTRY_PATH.exists():
        errors.append(f"{AGENT_REGISTRY_PATH}: missing registry directory")
    if not SKILL_LIBRARY_PATH.exists():
        errors.append(f"{SKILL_LIBRARY_PATH}: missing skill library directory")

    if errors:
        print("Registry validation failed (missing required paths):")
        for err in errors:
            print(f"- {err}")
        return 1

    user_files = sorted(USER_REGISTRY_PATH.glob("USR-*.gov.md"))
    agent_files = sorted(AGENT_REGISTRY_PATH.glob("AGT-*.gov.md"))
    skill_files = sorted(SKILL_LIBRARY_PATH.rglob("*.skill.md"))

    if len(user_files) != len(skill_files):
        errors.append(
            f"user registry count mismatch ({len(user_files)} != {len(skill_files)})"
        )

    for path in user_files:
        validate_sections(path, USER_REQUIRED_SECTIONS, errors)
        validate_user_skill(path, errors)

    for path in agent_files:
        validate_sections(path, AGENT_REQUIRED_SECTIONS, errors)
        validate_agent_skill(path, errors)

    validate_index(USER_REGISTRY_PATH / "INDEX.md", "USR", len(user_files), errors)
    validate_index(AGENT_REGISTRY_PATH / "INDEX.md", "AGT", len(agent_files), errors)

    if errors:
        print("Registry validation failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("Registry validation passed.")
    print(f"- User skills: {len(user_files)}")
    print(f"- Agent skills: {len(agent_files)}")
    print(f"- Source skills: {len(skill_files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
