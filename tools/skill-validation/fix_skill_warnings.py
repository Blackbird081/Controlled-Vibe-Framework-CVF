#!/usr/bin/env python
from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import List, Optional


SECTION_PATTERNS = {
    "prerequisites": [r"Prerequisites"],
    "purpose": [r"Mục đích"],
    "tips": [r"Tips"],
    "example": [r"Ví dụ thực tế"],
    "related": [r"Related Skills"],
    "version_history": [r"Version History"],
    "common_failures": [r"Common Failures", r"Lỗi Thường Gặp"],
    "next_step": [r"Next Step", r"Bước tiếp theo"],
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def has_section(text: str, key: str) -> bool:
    patterns = SECTION_PATTERNS.get(key, [])
    for pattern in patterns:
        if re.search(rf"^##\s+.*{pattern}.*$", text, re.IGNORECASE | re.MULTILINE):
            return True
    return False


def insert_before_heading(text: str, heading_patterns: List[str], block: str) -> str:
    for pattern in heading_patterns:
        match = re.search(rf"^##\s+.*{pattern}.*$", text, re.IGNORECASE | re.MULTILINE)
        if match:
            return text[:match.start()] + block + "\n\n" + text[match.start():]
    return text.rstrip() + "\n\n" + block + "\n"


def find_footer_index(text: str) -> Optional[int]:
    footer_match = re.search(r"^\*.*CVF.*\*$", text, re.IGNORECASE | re.MULTILINE)
    if footer_match:
        return footer_match.start()
    return None


def insert_before_footer(text: str, block: str) -> str:
    idx = find_footer_index(text)
    if idx is None:
        return text.rstrip() + "\n\n" + block + "\n"
    return text[:idx] + block + "\n\n" + text[idx:]


def get_title(text: str) -> str:
    for line in text.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return "Skill này"


def get_first_related_link(text: str) -> Optional[str]:
    section_match = re.search(r"^##\s+.*Related Skills.*$", text, re.IGNORECASE | re.MULTILINE)
    if not section_match:
        return None
    start = section_match.end()
    next_heading = re.search(r"^##\s+", text[start:], re.MULTILINE)
    end = start + next_heading.start() if next_heading else len(text)
    section = text[start:end]
    link_match = re.search(r"-\s+\[([^\]]+)\]\(([^)]+)\)", section)
    if not link_match:
        return None
    name, path = link_match.group(1).strip(), link_match.group(2).strip()
    return f"[{name}]({path})"


def ensure_prerequisites(text: str) -> str:
    if has_section(text, "prerequisites"):
        return text
    block = "## 📌 Prerequisites\n\nKhông yêu cầu.\n\n---"
    return insert_before_heading(text, SECTION_PATTERNS["purpose"], block)


def ensure_common_failures(text: str) -> str:
    if has_section(text, "common_failures"):
        return text
    block = (
        "## ⚠️ Common Failures\n\n"
        "| Lỗi thường gặp | Cách phòng tránh |\n"
        "|---|---|\n"
        "| Thiếu dữ liệu đầu vào quan trọng | Bổ sung đầy đủ thông tin theo Form Input |\n"
        "| Kết luận chung chung | Yêu cầu nêu rõ tiêu chí và hành động cụ thể |\n\n"
        "---"
    )
    return insert_before_heading(text, SECTION_PATTERNS["tips"] + SECTION_PATTERNS["example"], block)


def ensure_next_step(text: str) -> str:
    if has_section(text, "next_step"):
        return text
    title = get_title(text)
    related = get_first_related_link(text)
    if related:
        content = f"Sau khi hoàn thành **{title}**, tiếp tục với:\n→ {related}"
    else:
        content = "Không có bước tiếp theo bắt buộc. Tham khảo mục Related Skills nếu cần mở rộng."
    block = f"## 🔗 Next Step\n\n{content}\n\n---"
    return insert_before_footer(text, block)


def update_example_labels(text: str, title: str) -> str:
    match = re.search(r"^##\s+.*Ví dụ thực tế.*$", text, re.IGNORECASE | re.MULTILINE)
    if not match:
        return text
    start = match.end()
    next_heading = re.search(r"^##\s+", text[start:], re.MULTILINE)
    end = start + next_heading.start() if next_heading else len(text)
    section = text[start:end]
    updated = section

    if "Input mẫu" not in section:
        updated = re.sub(r"^\*\*Input\*\*:\s*$", "### Input mẫu:", updated, flags=re.MULTILINE)
        updated = re.sub(r"^Input:\s*$", "### Input mẫu:", updated, flags=re.MULTILINE)

    if "Output mẫu" not in section:
        updated = re.sub(r"^\*\*Expected Output\*\*:\s*$", "### Output mẫu:", updated, flags=re.MULTILINE)
        updated = re.sub(r"^\*\*Expected Analysis\*\*:\s*$", "### Output mẫu:", updated, flags=re.MULTILINE)
        updated = re.sub(r"^\*\*Output\*\*:\s*$", "### Output mẫu:", updated, flags=re.MULTILINE)
        updated = re.sub(r"^Output:\s*$", "### Output mẫu:", updated, flags=re.MULTILINE)

    if "Input mẫu" not in updated:
        updated = (
            updated.rstrip()
            + f"\n\n### Input mẫu:\n```\nMục tiêu: Hoàn thành {title}\nBối cảnh: Dữ liệu hiện có và giới hạn nguồn lực\nRàng buộc: Deadline 2 tuần\n```\n"
        )
    if "Output mẫu" not in updated:
        updated = (
            updated.rstrip()
            + f"\n\n### Output mẫu:\n```\nTóm tắt kết quả: {title} với khuyến nghị/ưu tiên rõ ràng.\n```\n"
        )

    return text[:start] + updated + text[end:]


def fix_file(path: Path) -> bool:
    original = read_text(path)
    text = original
    text = ensure_prerequisites(text)
    text = ensure_common_failures(text)
    text = ensure_next_step(text)

    if "finance_analytics" in str(path):
        text = update_example_labels(text, get_title(text))

    if text != original:
        write_text(path, text)
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Fix missing sections in CVF skill files.")
    parser.add_argument("--root", type=str, default=None, help="Root folder containing skill files.")
    args = parser.parse_args()

    root = Path(args.root).resolve() if args.root else Path.cwd()
    skill_files = sorted(root.rglob("*.skill.md"))
    updated = 0
    for path in skill_files:
        if fix_file(path):
            updated += 1
    print(f"Updated {updated} files.")


if __name__ == "__main__":
    main()
