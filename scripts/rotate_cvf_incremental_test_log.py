#!/usr/bin/env python3
"""
Rotate docs/CVF_INCREMENTAL_TEST_LOG.md into docs/logs/ archives
when the active working window exceeds the approved thresholds.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
ACTIVE_LOG = REPO_ROOT / "docs" / "CVF_INCREMENTAL_TEST_LOG.md"
ARCHIVE_DIR = REPO_ROOT / "docs" / "logs"
EXECUTION_MARKER = "## 5) Execution Log"
ARCHIVE_INDEX_MARKER = "## 4B) Archive Index"
BATCH_HEADER_RE = re.compile(r"^## \[\d{4}-\d{2}-\d{2}\] Batch:", re.MULTILINE)
DEFAULT_MAX_LINES = 3000
DEFAULT_MAX_BATCHES = 100
DEFAULT_KEEP_BATCHES = 40


def _split_entries(body: str) -> list[str]:
    matches = list(BATCH_HEADER_RE.finditer(body))
    if not matches:
        return []

    entries: list[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(body)
        entries.append(body[start:end].strip() + "\n")
    return entries


def _next_archive_path(year: int) -> Path:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(ARCHIVE_DIR.glob(f"CVF_INCREMENTAL_TEST_LOG_ARCHIVE_{year}_PART_*.md"))
    if not existing:
        part = 1
    else:
        last = existing[-1].stem.rsplit("_", 1)[-1]
        part = int(last) + 1
    return ARCHIVE_DIR / f"CVF_INCREMENTAL_TEST_LOG_ARCHIVE_{year}_PART_{part:02d}.md"


def _build_archive_content(archive_path: Path, archived_entries: list[str], source_path: Path) -> str:
    first_batch = archived_entries[0].splitlines()[0].replace("## ", "", 1)
    last_batch = archived_entries[-1].splitlines()[0].replace("## ", "", 1)
    return "\n".join(
        [
            "# CVF Incremental Test Log Archive",
            "",
            f"- Canonical entrypoint: `{source_path.relative_to(REPO_ROOT).as_posix()}`",
            f"- Archive file: `{archive_path.relative_to(REPO_ROOT).as_posix()}`",
            f"- Archived entry count: `{len(archived_entries)}`",
            f"- Archive window: `{first_batch}` -> `{last_batch}`",
            "",
            "---",
            "",
            "".join(archived_entries).rstrip(),
            "",
        ]
    )


def _update_archive_index(preamble: str, archive_path: Path, archived_entries: list[str]) -> str:
    first_batch = archived_entries[0].splitlines()[0].replace("## ", "", 1)
    last_batch = archived_entries[-1].splitlines()[0].replace("## ", "", 1)
    new_entry = (
        f"- `{archive_path.relative_to(REPO_ROOT).as_posix()}`"
        f" — `{len(archived_entries)}` entries"
        f" — `{first_batch}` -> `{last_batch}`"
    )

    marker_start = preamble.find(ARCHIVE_INDEX_MARKER)
    if marker_start == -1:
        raise RuntimeError("Archive Index marker not found in active log.")

    next_heading_match = re.search(r"^## ", preamble[marker_start + len(ARCHIVE_INDEX_MARKER):], re.MULTILINE)
    if next_heading_match:
        marker_end = marker_start + len(ARCHIVE_INDEX_MARKER) + next_heading_match.start()
    else:
        marker_end = len(preamble)

    if marker_start >= marker_end:
        raise RuntimeError("Archive Index block could not be resolved in active log.")

    index_block = preamble[marker_start:marker_end]
    if "No archive windows yet." in index_block:
        updated_block = index_block.replace("No archive windows yet.", new_entry)
    else:
        updated_block = index_block.rstrip() + "\n" + new_entry + "\n\n"

    return preamble[:marker_start] + updated_block + preamble[marker_end:]


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Rotate CVF incremental test log")
    parser.add_argument("--max-lines", type=int, default=DEFAULT_MAX_LINES)
    parser.add_argument("--max-batches", type=int, default=DEFAULT_MAX_BATCHES)
    parser.add_argument("--keep-batches", type=int, default=DEFAULT_KEEP_BATCHES)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    content = ACTIVE_LOG.read_text(encoding="utf-8")
    marker_index = content.find(EXECUTION_MARKER)
    if marker_index == -1:
        raise RuntimeError("Execution Log marker not found in active log.")

    preamble = content[:marker_index]
    execution_body = content[marker_index + len(EXECUTION_MARKER):].lstrip("\n")
    entries = _split_entries(execution_body)
    line_count = len(content.splitlines())

    needs_rotation = args.force or line_count > args.max_lines or len(entries) > args.max_batches
    if not needs_rotation:
        print(
            "No rotation required:",
            f"lines={line_count}/{args.max_lines}, batches={len(entries)}/{args.max_batches}",
        )
        return 0

    if len(entries) <= args.keep_batches:
        raise RuntimeError(
            f"Cannot rotate while keeping {args.keep_batches} batches because only {len(entries)} batches exist."
        )

    archived_entries = entries[:-args.keep_batches]
    retained_entries = entries[-args.keep_batches:]
    year = dt.date.today().year
    archive_path = _next_archive_path(year)

    archive_content = _build_archive_content(archive_path, archived_entries, ACTIVE_LOG)
    updated_preamble = _update_archive_index(preamble, archive_path, archived_entries)
    new_active_content = updated_preamble.rstrip() + "\n\n" + EXECUTION_MARKER + "\n\n" + "".join(retained_entries)

    print(f"Rotate active log -> {archive_path.relative_to(REPO_ROOT).as_posix()}")
    print(f"Archived batches: {len(archived_entries)}")
    print(f"Retained batches: {len(retained_entries)}")

    if args.dry_run:
        print("Dry-run only. No files written.")
        return 0

    archive_path.write_text(archive_content, encoding="utf-8")
    ACTIVE_LOG.write_text(new_active_content.rstrip() + "\n", encoding="utf-8")
    print("Rotation completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
