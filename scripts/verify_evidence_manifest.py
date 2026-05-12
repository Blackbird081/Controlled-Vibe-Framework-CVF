#!/usr/bin/env python3
"""
verify_evidence_manifest.py — EA Track C: Evidence Manifest Verifier

Reads docs/evidence/MANIFEST_SHA256.json and re-hashes every file.
Reports PASS, MISSING, or TAMPERED for each entry.

Usage:
    python scripts/verify_evidence_manifest.py [--repo-root PATH] [--json]

Exit codes:
    0  All files match
    1  One or more files missing or tampered
    2  Manifest not found
"""

import argparse
import hashlib
import json
import sys
from pathlib import Path

MANIFEST_PATH = Path('docs/evidence/MANIFEST_SHA256.json')


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


def run(repo_root: Path, output_json: bool) -> int:
    manifest_abs = repo_root / MANIFEST_PATH
    if not manifest_abs.exists():
        msg = f'Manifest not found: {MANIFEST_PATH}'
        if output_json:
            print(json.dumps({'status': 'ERROR', 'message': msg}))
        else:
            print(f'[ERROR] {msg}', file=sys.stderr)
        return 2

    manifest = json.loads(manifest_abs.read_text(encoding='utf-8'))
    files: dict[str, str] = manifest.get('files', {})

    results: list[dict] = []
    pass_count = 0
    fail_count = 0

    for rel_path, expected_hash in files.items():
        abs_path = repo_root / rel_path
        if not abs_path.exists():
            results.append({'file': rel_path, 'status': 'MISSING', 'expected': expected_hash, 'actual': None})
            fail_count += 1
            continue
        actual_hash = sha256_file(abs_path)
        if actual_hash == expected_hash:
            results.append({'file': rel_path, 'status': 'PASS', 'expected': expected_hash, 'actual': actual_hash})
            pass_count += 1
        else:
            results.append({'file': rel_path, 'status': 'TAMPERED', 'expected': expected_hash, 'actual': actual_hash})
            fail_count += 1

    overall = 'PASS' if fail_count == 0 else 'FAIL'
    summary = {
        'status': overall,
        'manifest_git_commit': manifest.get('git_commit', 'unknown'),
        'manifest_generated_at': manifest.get('generated_at', 'unknown'),
        'total': len(results),
        'pass': pass_count,
        'fail': fail_count,
        'results': results,
    }

    if output_json:
        print(json.dumps(summary, indent=2))
        return 0 if fail_count == 0 else 1

    print(f'\n=== Evidence Manifest Verification ===')
    print(f'Manifest commit : {manifest.get("git_commit", "unknown")[:12]}')
    print(f'Total files     : {len(results)}')
    print(f'PASS            : {pass_count}')
    print(f'FAIL            : {fail_count}')
    print(f'Overall         : {overall}')

    failures = [r for r in results if r['status'] != 'PASS']
    if failures:
        print('\n--- Failures ---')
        for r in failures:
            print(f'  [{r["status"]}] {r["file"]}')
            if r['status'] == 'TAMPERED':
                print(f'    expected: {r["expected"]}')
                print(f'    actual  : {r["actual"]}')
    else:
        print('\nAll files verified intact.')

    return 0 if fail_count == 0 else 1


def main() -> None:
    parser = argparse.ArgumentParser(description='Verify CVF evidence SHA-256 manifest.')
    parser.add_argument('--repo-root', type=Path, default=Path('.'),
                        help='Repository root (default: current directory)')
    parser.add_argument('--json', action='store_true', dest='output_json',
                        help='Output results as JSON')
    args = parser.parse_args()

    repo_root = args.repo_root.resolve()
    sys.exit(run(repo_root, args.output_json))


if __name__ == '__main__':
    main()
