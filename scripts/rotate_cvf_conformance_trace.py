#!/usr/bin/env python3
"""
Rotate the active conformance trace into scoped review archives.
"""

from __future__ import annotations

import argparse
import datetime as dt
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
ACTIVE_TRACE = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_CONFORMANCE_TRACE_2026-03-07.md"
ARCHIVE_DIR = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "logs"
BATCH_HEADER_RE = re.compile(r"^## Batch \d+ - .+", re.MULTILINE)
ARCHIVE_INDEX_MARKER = "## Archive Index"
DEFAULT_MAX_LINES = 1200
DEFAULT_MAX_BATCHES = 60
DEFAULT_KEEP_BATCHES = 20


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
    existing = sorted(ARCHIVE_DIR.glob(f"CVF_CONFORMANCE_TRACE_ARCHIVE_{year}_PART_*.md"))
    if not existing:
        part = 1
    else:
        part = int(existing[-1].stem.rsplit("_", 1)[-1]) + 1
    return ARCHIVE_DIR / f"CVF_CONFORMANCE_TRACE_ARCHIVE_{year}_PART_{part:02d}.md"


def _build_archive_content(archive_path: Path, archived_entries: list[str]) -> str:
    first_batch = archived_entries[0].splitlines()[0].replace("## ", "", 1)
    last_batch = archived_entries[-1].splitlines()[0].replace("## ", "", 1)
    return "\n".join(
        [
            "# CVF Conformance Trace Archive",
            "",
            f"- Canonical active trace: `{ACTIVE_TRACE.relative_to(REPO_ROOT).as_posix()}`",
            f"- Archive file: `{archive_path.relative_to(REPO_ROOT).as_posix()}`",
            f"- Archived batch count: `{len(archived_entries)}`",
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
        f" — `{len(archived_entries)}` batches"
        f" — `{first_batch}` -> `{last_batch}`"
    )

    marker_start = preamble.find(ARCHIVE_INDEX_MARKER)
    if marker_start == -1:
        raise RuntimeError("Archive Index marker not found in active trace.")

    after_marker = preamble[marker_start:]
    split_at = after_marker.find("\n## Batch ")
    if split_at != -1:
        raise RuntimeError("Archive Index marker must live before the first batch section.")

    if "No archive windows yet." in preamble:
        return preamble.replace("No archive windows yet.", new_entry)
    return preamble.rstrip() + "\n" + new_entry + "\n\n"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(description="Rotate CVF conformance trace")
    parser.add_argument("--max-lines", type=int, default=DEFAULT_MAX_LINES)
    parser.add_argument("--max-batches", type=int, default=DEFAULT_MAX_BATCHES)
    parser.add_argument("--keep-batches", type=int, default=DEFAULT_KEEP_BATCHES)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    content = ACTIVE_TRACE.read_text(encoding="utf-8")
    matches = list(BATCH_HEADER_RE.finditer(content))
    if not matches:
        raise RuntimeError("No batch sections found in active conformance trace.")

    first_batch_index = matches[0].start()
    preamble = content[:first_batch_index]
    entries = _split_entries(content[first_batch_index:])
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
    archive_path = _next_archive_path(dt.date.today().year)
    archive_content = _build_archive_content(archive_path, archived_entries)
    updated_preamble = _update_archive_index(preamble, archive_path, archived_entries)
    new_content = updated_preamble.rstrip() + "\n\n" + "".join(retained_entries)

    print(f"Rotate active conformance trace -> {archive_path.relative_to(REPO_ROOT).as_posix()}")
    print(f"Archived batches: {len(archived_entries)}")
    print(f"Retained batches: {len(retained_entries)}")

    if args.dry_run:
        print("Dry-run only. No files written.")
        return 0

    archive_path.write_text(archive_content, encoding="utf-8")
    ACTIVE_TRACE.write_text(new_content.rstrip() + "\n", encoding="utf-8")
    print("Rotation completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
