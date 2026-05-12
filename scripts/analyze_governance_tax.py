#!/usr/bin/env python3
"""
analyze_governance_tax.py — EA Track A: Governance Tax Analysis

Reads logs/governance-tax/governance-tax.jsonl and produces aggregate statistics
for governance overhead measurement.

Usage:
    python scripts/analyze_governance_tax.py [--log-path PATH] [--json] [--tail N]
"""

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from statistics import mean, median


DEFAULT_LOG = Path(__file__).parent.parent / 'logs' / 'governance-tax' / 'governance-tax.jsonl'


def load_records(log_path: Path, tail: int | None) -> list[dict]:
    if not log_path.exists():
        print(f'[ERROR] Log file not found: {log_path}', file=sys.stderr)
        sys.exit(1)
    records = []
    for line in log_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if line:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    if tail:
        records = records[-tail:]
    return records


def grade_distribution(records: list[dict]) -> dict:
    dist: dict[str, int] = defaultdict(int)
    for r in records:
        dist[r.get('grade', 'UNKNOWN')] += 1
    return dict(dist)


def bucket_by(records: list[dict], key: str) -> dict[str, list[float]]:
    buckets: dict[str, list[float]] = defaultdict(list)
    for r in records:
        k = r.get(key) or 'unknown'
        pct = r.get('governance_tax_pct')
        if pct is not None:
            buckets[str(k)].append(pct)
    return dict(buckets)


def summarize_bucket(values: list[float]) -> dict:
    return {
        'count': len(values),
        'mean_pct': round(mean(values), 2) if values else 0,
        'median_pct': round(median(values), 2) if values else 0,
        'max_pct': round(max(values), 2) if values else 0,
    }


def hour_key(ts: str) -> str:
    return ts[:13] if ts else 'unknown'


def run(log_path: Path, output_json: bool, tail: int | None) -> None:
    records = load_records(log_path, tail)
    if not records:
        print('[WARN] No records found in log.', file=sys.stderr)
        sys.exit(0)

    pcts = [r['governance_tax_pct'] for r in records if 'governance_tax_pct' in r]
    grades = grade_distribution(records)
    by_decision = bucket_by(records, 'decision')
    by_family = bucket_by(records, 'governance_family')
    by_provider = bucket_by(records, 'provider')
    by_hour = bucket_by(records, 'ts')
    # Re-bucket by_hour using hour prefix
    hourly: dict[str, list[float]] = defaultdict(list)
    for r in records:
        pct = r.get('governance_tax_pct')
        if pct is not None:
            hourly[hour_key(r.get('ts', ''))].append(pct)
    hourly = dict(hourly)

    # Flag RED/AMBER individual requests
    flagged = [
        {
            'request_id': r.get('request_id'),
            'ts': r.get('ts'),
            'grade': r.get('grade'),
            'governance_tax_pct': r.get('governance_tax_pct'),
            'decision': r.get('decision'),
            'provider': r.get('provider'),
            'governance_family': r.get('governance_family'),
        }
        for r in records
        if r.get('grade') in ('RED', 'AMBER')
    ]

    result = {
        'total_records': len(records),
        'overall': {
            'mean_pct': round(mean(pcts), 2) if pcts else 0,
            'median_pct': round(median(pcts), 2) if pcts else 0,
            'max_pct': round(max(pcts), 2) if pcts else 0,
            'grade_distribution': grades,
        },
        'by_decision': {k: summarize_bucket(v) for k, v in sorted(by_decision.items())},
        'by_governance_family': {k: summarize_bucket(v) for k, v in sorted(by_family.items())},
        'by_provider': {k: summarize_bucket(v) for k, v in sorted(by_provider.items())},
        'by_hour': {k: summarize_bucket(v) for k, v in sorted(hourly.items())},
        'flagged_count': len(flagged),
        'flagged': flagged[:50],  # cap output at 50 for readability
    }

    if output_json:
        print(json.dumps(result, indent=2))
        return

    print(f'\n=== Governance Tax Analysis ===')
    print(f'Records analyzed : {result["total_records"]}')
    o = result['overall']
    print(f'Mean tax pct     : {o["mean_pct"]:.2f}%')
    print(f'Median tax pct   : {o["median_pct"]:.2f}%')
    print(f'Max tax pct      : {o["max_pct"]:.2f}%')
    print(f'Grade distribution: {o["grade_distribution"]}')

    print('\n--- By Decision ---')
    for k, v in result['by_decision'].items():
        print(f'  {k:<20} n={v["count"]:>4}  mean={v["mean_pct"]:>6.2f}%  median={v["median_pct"]:>6.2f}%')

    print('\n--- By Governance Family ---')
    for k, v in result['by_governance_family'].items():
        print(f'  {k:<40} n={v["count"]:>4}  mean={v["mean_pct"]:>6.2f}%')

    print('\n--- By Provider ---')
    for k, v in result['by_provider'].items():
        print(f'  {k:<20} n={v["count"]:>4}  mean={v["mean_pct"]:>6.2f}%')

    if result['flagged_count']:
        print(f'\n--- Flagged RED/AMBER ({result["flagged_count"]} total, showing up to 50) ---')
        for f in result['flagged']:
            print(f'  [{f["grade"]}] {f["request_id"]}  {f["governance_tax_pct"]:.1f}%  {f["decision"]}  {f["provider"]}  {f["governance_family"]}')
    else:
        print('\nNo RED/AMBER requests flagged.')


def main() -> None:
    parser = argparse.ArgumentParser(description='Analyze CVF governance tax log.')
    parser.add_argument('--log-path', type=Path, default=DEFAULT_LOG,
                        help='Path to governance-tax.jsonl')
    parser.add_argument('--json', action='store_true', dest='output_json',
                        help='Output as JSON')
    parser.add_argument('--tail', type=int, default=None,
                        help='Analyze only the last N records')
    args = parser.parse_args()
    run(args.log_path, args.output_json, args.tail)


if __name__ == '__main__':
    main()
