#!/usr/bin/env python3
"""
CVF Active-Archive File Management Script
==========================================
Separates recent files (<=3 days) from historical files (>3 days)
in managed CVF documentation directories.

Usage:
    python scripts/cvf_active_archive.py --dry-run     # Preview changes
    python scripts/cvf_active_archive.py --execute      # Execute archive
    python scripts/cvf_active_archive.py --restore      # Restore all archived files
    python scripts/cvf_active_archive.py --status       # Show current status

Convention:
    - Files MUST include date in filename: CVF_*_YYYY-MM-DD.md
    - Files without date use modification time as fallback
    - Permanent files (README.md, strategic docs) are never archived
"""

import os
import re
import sys
import json
import shutil
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

# ============================================================
# CONFIGURATION
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent

MANAGED_DIRS = [
    "docs/assessments",
    "docs/reviews/cvf_phase_governance",
    "docs/roadmaps",
    "ECOSYSTEM/strategy",
]

ARCHIVE_FOLDER = "archive"
AGE_THRESHOLD_DAYS = 3
MANAGED_EXTENSIONS = {".md", ".json"}

PERMANENT_FILES = {
    "README.md",
    "CVF_STRATEGIC_SUMMARY.md",
    "CVF_UNIFIED_ROADMAP_2026.md",
}

DATE_PATTERNS = [
    re.compile(r"(\d{4}-\d{2}-\d{2})"),
    re.compile(r"(\d{4}_\d{2}_\d{2})"),
]


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class FileInfo:
    path: Path
    date: datetime
    size: int


@dataclass
class ScanResult:
    active: list = field(default_factory=list)
    archive: list = field(default_factory=list)
    permanent: list = field(default_factory=list)
    already_archived: list = field(default_factory=list)


@dataclass
class DirReport:
    active_count: int = 0
    archive_count: int = 0
    permanent_count: int = 0
    already_archived_count: int = 0
    files_to_archive: list = field(default_factory=list)


# ============================================================
# CORE FUNCTIONS
# ============================================================

def extract_date_from_filename(filename: str) -> Optional[datetime]:
    """Extract date from filename using known patterns."""
    for pattern in DATE_PATTERNS:
        match = pattern.search(filename)
        if match:
            date_str = match.group(1).replace("_", "-")
            try:
                return datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                continue
    return None


def get_file_date(filepath: Path) -> datetime:
    """Get file date: from filename first, then modification time."""
    date = extract_date_from_filename(filepath.name)
    if date:
        return date
    mtime = os.path.getmtime(filepath)
    return datetime.fromtimestamp(mtime)


def is_permanent(filepath: Path) -> bool:
    """Check if file is permanent (should never be archived)."""
    return filepath.name in PERMANENT_FILES


def scan_directory(dir_path: Path, cutoff_date: datetime) -> ScanResult:
    """Scan a managed directory and classify files."""
    result = ScanResult()

    if not dir_path.exists():
        return result

    for item in dir_path.iterdir():
        if item.is_dir():
            if item.name == ARCHIVE_FOLDER:
                for archived in item.iterdir():
                    if archived.is_file():
                        result.already_archived.append(archived)
            continue

        if item.suffix.lower() not in MANAGED_EXTENSIONS:
            continue

        if is_permanent(item):
            result.permanent.append(item)
            continue

        file_date = get_file_date(item)
        info = FileInfo(path=item, date=file_date, size=item.stat().st_size)
        if file_date < cutoff_date:
            result.archive.append(info)
        else:
            result.active.append(info)

    return result


def generate_archive_index(archive_dir: Path) -> Path:
    """Generate ARCHIVE_INDEX.md in archive directory."""
    index_path = archive_dir / "ARCHIVE_INDEX.md"

    lines = [
        "# Archive Index",
        "",
        f"> Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        f"> Total archived files: {sum(1 for f in archive_dir.iterdir() if f.name != 'ARCHIVE_INDEX.md' and f.is_file())}",
        "",
        "| File | Original Date | Archived On | Size |",
        "|---|---|---|---|",
    ]

    for item in sorted(archive_dir.iterdir()):
        if item.name == "ARCHIVE_INDEX.md" or item.is_dir():
            continue
        file_date = extract_date_from_filename(item.name)
        date_str = file_date.strftime("%Y-%m-%d") if file_date else "unknown"
        size_kb = item.stat().st_size / 1024
        lines.append(f"| `{item.name}` | {date_str} | {datetime.now().strftime('%Y-%m-%d')} | {size_kb:.1f} KB |")

    lines.append("")

    with open(index_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return index_path


def do_archive(cutoff_date: datetime, execute: bool = False) -> None:
    """Main archive operation."""
    mode_str = "EXECUTE" if execute else "DRY-RUN"
    all_moved: list = []
    total_active = 0
    total_to_archive = 0
    total_permanent = 0
    total_already = 0

    print(f"\n{'='*60}")
    print(f"CVF Active-Archive Report")
    print(f"Mode: {mode_str}")
    print(f"Cutoff date: {cutoff_date.strftime('%Y-%m-%d')} (files before this -> archive)")
    print(f"{'='*60}")

    log_dirs = {}

    for dir_str in MANAGED_DIRS:
        full_path = PROJECT_ROOT / dir_str
        scan = scan_directory(full_path, cutoff_date)

        print(f"\n📁 {dir_str}/")
        print(f"   Active (stay):     {len(scan.active)} files")
        print(f"   Permanent (exempt):{len(scan.permanent)} files")
        print(f"   Already archived:  {len(scan.already_archived)} files")
        print(f"   -> To archive:     {len(scan.archive)} files")

        files_list: list = []

        if scan.archive:
            archive_dir = full_path / ARCHIVE_FOLDER

            if execute:
                archive_dir.mkdir(exist_ok=True)

            for info in scan.archive:
                dst = archive_dir / info.path.name
                action = "MOVED" if execute else "WOULD MOVE"
                size_kb = round(info.size / 1024, 1)
                print(f"     [{action}] {info.path.name} ({info.date.strftime('%Y-%m-%d')}, {size_kb} KB)")

                files_list.append({
                    "file": info.path.name,
                    "date": info.date.strftime("%Y-%m-%d"),
                    "size_kb": size_kb,
                })

                if execute:
                    shutil.move(str(info.path), str(dst))
                    all_moved.append(dst)

            if execute and archive_dir.exists():
                generate_archive_index(archive_dir)

        dir_log = {
            "active_count": len(scan.active),
            "archive_count": len(scan.archive),
            "permanent_count": len(scan.permanent),
            "already_archived_count": len(scan.already_archived),
            "files_to_archive": files_list,
        }

        total_active += len(scan.active)
        total_permanent += len(scan.permanent)
        total_already += len(scan.already_archived)
        total_to_archive += len(scan.archive)
        log_dirs[dir_str] = dir_log

    to_move = total_to_archive
    print(f"\n{'─'*60}")
    print(f"TOTALS:")
    actual_moved = len(all_moved) if execute else 0
    print(f"  Files moved/to move: {actual_moved if execute else to_move}")
    print(f"  Active files:        {total_active}")
    print(f"  Permanent files:     {total_permanent}")
    print(f"  Already archived:    {total_already}")
    print(f"{'='*60}\n")

    # Save JSON log
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "cutoff_date": cutoff_date.strftime("%Y-%m-%d"),
        "mode": "execute" if execute else "dry-run",
        "directories": log_dirs,
        "totals": {
            "moved": actual_moved if execute else 0,
            "active": total_active,
            "permanent": total_permanent,
            "already_archived": total_already,
        },
    }
    log_path = SCRIPT_DIR / f"cvf_archive_log_{datetime.now().strftime('%Y-%m-%d_%H%M%S')}.json"
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(log_data, f, indent=2, default=str)
    print(f"📋 Log saved to: {log_path.relative_to(PROJECT_ROOT)}")

    if not execute:
        print("\n💡 To execute, run: python scripts/cvf_active_archive.py --execute\n")


def do_restore() -> None:
    """Restore all archived files back to active zone."""
    total_restored = 0

    for dir_str in MANAGED_DIRS:
        full_path = PROJECT_ROOT / dir_str
        archive_dir = full_path / ARCHIVE_FOLDER

        if not archive_dir.exists():
            continue

        count = 0
        for item in archive_dir.iterdir():
            if item.name == "ARCHIVE_INDEX.md" or item.is_dir():
                continue
            dst = full_path / item.name
            shutil.move(str(item), str(dst))
            count += 1

        index_file = archive_dir / "ARCHIVE_INDEX.md"
        if index_file.exists():
            index_file.unlink()
        if archive_dir.exists() and not any(archive_dir.iterdir()):
            archive_dir.rmdir()

        print(f"   📁 {dir_str}/: {count} files restored")
        total_restored += count

    print(f"✅ Restored {total_restored} files total.")


def do_status(cutoff_date: datetime) -> None:
    """Show current status of all managed directories."""
    print(f"\n{'='*60}")
    print(f"CVF Active-Archive Status (cutoff: {cutoff_date.strftime('%Y-%m-%d')})")
    print(f"{'='*60}")

    for dir_str in MANAGED_DIRS:
        full_path = PROJECT_ROOT / dir_str
        scan = scan_directory(full_path, cutoff_date)

        print(f"\n📁 {dir_str}/")
        print(f"   active: {len(scan.active)}")
        print(f"   would_archive: {len(scan.archive)}")
        print(f"   permanent: {len(scan.permanent)}")
        print(f"   already_archived: {len(scan.already_archived)}")

    print()


# ============================================================
# CLI
# ============================================================

def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in ("--dry-run", "--execute", "--restore", "--status"):
        print("Usage:")
        print("  python scripts/cvf_active_archive.py --dry-run     # Preview changes")
        print("  python scripts/cvf_active_archive.py --execute      # Execute archive")
        print("  python scripts/cvf_active_archive.py --restore      # Restore all")
        print("  python scripts/cvf_active_archive.py --status       # Show status")
        sys.exit(1)

    mode = sys.argv[1]
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    cutoff_date = today - timedelta(days=AGE_THRESHOLD_DAYS)

    if mode == "--status":
        do_status(cutoff_date)
    elif mode == "--restore":
        print("\n⚠️  Restoring ALL archived files to active zone...")
        do_restore()
    else:
        do_archive(cutoff_date, execute=(mode == "--execute"))


if __name__ == "__main__":
    main()
