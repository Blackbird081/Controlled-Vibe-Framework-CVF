#!/usr/bin/env python3
"""
generate_evidence_manifest.py — EA Track C: Evidence SHA-256 Manifest

Walks docs/benchmark/ and docs/evidence/, computes SHA-256 for each file,
and writes docs/evidence/MANIFEST_SHA256.json.

Usage:
    python scripts/generate_evidence_manifest.py [--repo-root PATH] [--dry-run]
"""

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

MANIFEST_PATH = Path('docs/evidence/MANIFEST_SHA256.json')

INCLUDE_DIRS = [
    'docs/benchmark',
    'docs/evidence',
]

EXCLUDE_SUFFIXES = {'.pyc', '.pyo'}
EXCLUDE_NAMES = {'MANIFEST_SHA256.json'}


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def get_head_sha(repo_root: Path) -> str:
    try:
        result = subprocess.run(
            ['git', 'rev-parse', 'HEAD'],
            cwd=repo_root,
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except Exception:
        return 'unknown'


def collect_files(repo_root: Path) -> list[Path]:
    collected: list[Path] = []
    for dir_rel in INCLUDE_DIRS:
        target = repo_root / dir_rel
        if not target.exists():
            continue
        for p in sorted(target.rglob('*')):
            if not p.is_file():
                continue
            if p.suffix in EXCLUDE_SUFFIXES:
                continue
            if p.name in EXCLUDE_NAMES:
                continue
            collected.append(p)
    return collected


def run(repo_root: Path, dry_run: bool) -> None:
    files = collect_files(repo_root)
    if not files:
        print('[WARN] No files found to manifest.', file=sys.stderr)
        sys.exit(0)

    manifest_abs = repo_root / MANIFEST_PATH
    head_sha = get_head_sha(repo_root)

    file_hashes: dict[str, str] = {}
    for p in files:
        rel = p.relative_to(repo_root).as_posix()
        digest = sha256_file(p)
        file_hashes[rel] = digest
        print(f'  {digest[:12]}…  {rel}')

    manifest = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'git_commit': head_sha,
        'file_count': len(file_hashes),
        'files': file_hashes,
    }

    if dry_run:
        print(f'\n[DRY RUN] Would write {len(file_hashes)} entries to {MANIFEST_PATH}')
        return

    manifest_abs.parent.mkdir(parents=True, exist_ok=True)
    manifest_abs.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'\nManifest written: {MANIFEST_PATH} ({len(file_hashes)} files, commit {head_sha[:12]})')


def main() -> None:
    parser = argparse.ArgumentParser(description='Generate CVF evidence SHA-256 manifest.')
    parser.add_argument('--repo-root', type=Path, default=Path('.'),
                        help='Repository root (default: current directory)')
    parser.add_argument('--dry-run', action='store_true',
                        help='Print hashes without writing manifest')
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    if not (repo_root / '.git').exists():
        print(f'[ERROR] Not a git repository: {repo_root}', file=sys.stderr)
        sys.exit(1)

    run(repo_root, args.dry_run)


if __name__ == '__main__':
    main()
