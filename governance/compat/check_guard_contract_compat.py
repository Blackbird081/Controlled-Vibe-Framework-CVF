#!/usr/bin/env python3
"""
CVF Cross-Channel Guard Contract Compatibility Gate

Ensures channel-specific guard types remain compatible with the
canonical cross-channel guard contract.

Usage:
  python governance/compat/check_guard_contract_compat.py
  python governance/compat/check_guard_contract_compat.py --enforce
  python governance/compat/check_guard_contract_compat.py --json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from pathlib import Path
from typing import Iterable


REPO_ROOT = Path(__file__).resolve().parents[2]

DEFAULT_CONTRACT_PATH = REPO_ROOT / "governance" / "contracts" / "cross-channel-guard-contract.ts"
DEFAULT_MCP_TYPES_PATH = REPO_ROOT / "EXTENSIONS" / "CVF_ECO_v2.5_MCP_SERVER" / "src" / "guards" / "types.ts"
DEFAULT_WEB_TYPES_PATH = (
    REPO_ROOT
    / "EXTENSIONS"
    / "CVF_v1.6_AGENT_PLATFORM"
    / "cvf-web"
    / "src"
    / "lib"
    / "guard-runtime-adapter.ts"
)
DEFAULT_ADAPTERS_DIR = REPO_ROOT / "governance" / "contracts" / "adapters"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _extract_union_values(text: str, type_name: str) -> set[str]:
    pattern = re.compile(rf"export\s+type\s+{re.escape(type_name)}\s*=\s*([^;]+);", re.S)
    match = pattern.search(text)
    if not match:
        return set()
    body = match.group(1)
    return set(re.findall(r"['\"]([^'\"]+)['\"]", body))


def _extract_object_keys(text: str, const_name: str) -> set[str]:
    idx = text.find(const_name)
    if idx == -1:
        return set()
    brace_start = text.find("{", idx)
    if brace_start == -1:
        return set()
    depth = 0
    brace_end = None
    for i in range(brace_start, len(text)):
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                brace_end = i
                break
    if brace_end is None:
        return set()
    block = text[brace_start:brace_end + 1]
    return set(re.findall(r"['\"]([^'\"]+)['\"]\s*:", block))


def _missing_subset(label: str, subset: set[str], superset: set[str]) -> list[str]:
    missing = sorted(subset - superset)
    if not missing:
        return []
    return [f"{label} has values not in canonical contract: {', '.join(missing)}"]


def _has_adapter_impl(adapters_dir: Path) -> bool:
    if not adapters_dir.exists():
        return False
    for path in adapters_dir.rglob("*.ts"):
        try:
            content = _read(path)
        except OSError:
            continue
        if "implements CVFGuardContract" in content:
            return True
    return False


def _ensure_present(label: str, values: Iterable[str]) -> list[str]:
    if values:
        return []
    return [f"{label} type not found or empty"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Cross-channel guard contract compatibility gate")
    parser.add_argument("--contract", default=str(DEFAULT_CONTRACT_PATH), help="Path to canonical contract")
    parser.add_argument("--mcp-types", default=str(DEFAULT_MCP_TYPES_PATH), help="Path to MCP guard types")
    parser.add_argument("--web-types", default=str(DEFAULT_WEB_TYPES_PATH), help="Path to Web UI guard types")
    parser.add_argument("--adapters-dir", default=str(DEFAULT_ADAPTERS_DIR), help="Path to adapters directory")
    parser.add_argument("--enforce", action="store_true", help="Return non-zero on compatibility errors")
    parser.add_argument("--json", action="store_true", help="Print JSON report")
    args = parser.parse_args()

    contract_path = Path(args.contract)
    mcp_path = Path(args.mcp_types)
    web_path = Path(args.web_types)
    adapters_dir = Path(args.adapters_dir)

    issues: list[str] = []
    warnings: list[str] = []

    for label, path in (
        ("contract", contract_path),
        ("mcp_types", mcp_path),
        ("web_types", web_path),
    ):
        if not path.exists():
            issues.append(f"Missing {label} file: {path}")

    if issues:
        report = {
            "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "status": "FAIL",
            "issues": issues,
            "warnings": warnings,
        }
        if args.json:
            print(json.dumps(report, indent=2))
        else:
            print("=== CVF Guard Contract Compat ===")
            for item in issues:
                print(f"- {item}")
        return 2 if args.enforce else 1

    contract_text = _read(contract_path)
    mcp_text = _read(mcp_path)
    web_text = _read(web_path)

    canonical_phases = _extract_union_values(contract_text, "CVFCanonicalPhase")
    canonical_risks = _extract_union_values(contract_text, "CVFCanonicalRisk")
    canonical_roles = _extract_union_values(contract_text, "CVFCanonicalRole")
    canonical_decisions = _extract_union_values(contract_text, "CVFCanonicalDecision")
    canonical_severities = _extract_union_values(contract_text, "CVFGuardSeverity")
    phase_aliases = _extract_object_keys(contract_text, "CANONICAL_PHASE_ALIASES")

    issues.extend(_ensure_present("CVFCanonicalPhase", canonical_phases))
    issues.extend(_ensure_present("CVFCanonicalRisk", canonical_risks))
    issues.extend(_ensure_present("CVFCanonicalRole", canonical_roles))
    issues.extend(_ensure_present("CVFCanonicalDecision", canonical_decisions))
    issues.extend(_ensure_present("CVFGuardSeverity", canonical_severities))

    if "function mapMcpDecision" not in contract_text:
        issues.append("mapMcpDecision function missing from contract")
    if "function mapWebUiDecision" not in contract_text:
        issues.append("mapWebUiDecision function missing from contract")

    if not _has_adapter_impl(adapters_dir):
        issues.append("No adapter implements CVFGuardContract in governance/contracts/adapters")

    mcp_phases = _extract_union_values(mcp_text, "CVFPhase")
    mcp_risks = _extract_union_values(mcp_text, "CVFRiskLevel")
    mcp_roles = _extract_union_values(mcp_text, "CVFRole")
    mcp_decisions = _extract_union_values(mcp_text, "GuardDecision")
    mcp_severities = _extract_union_values(mcp_text, "GuardSeverity")

    web_phases = _extract_union_values(web_text, "CVFPhase")
    web_risks = _extract_union_values(web_text, "CVFRiskLevel")
    web_roles = _extract_union_values(web_text, "CVFRole")
    web_decisions = _extract_union_values(web_text, "GuardDecision")
    web_severities = _extract_union_values(web_text, "GuardSeverity")

    phase_superset = canonical_phases | phase_aliases

    issues.extend(_missing_subset("MCP phases", mcp_phases, phase_superset))
    issues.extend(_missing_subset("MCP risks", mcp_risks, canonical_risks))
    issues.extend(_missing_subset("MCP roles", mcp_roles, canonical_roles))
    issues.extend(_missing_subset("MCP decisions", mcp_decisions, canonical_decisions))
    issues.extend(_missing_subset("MCP severities", mcp_severities, canonical_severities))

    issues.extend(_missing_subset("Web UI phases", web_phases, phase_superset))
    issues.extend(_missing_subset("Web UI risks", web_risks, canonical_risks))
    issues.extend(_missing_subset("Web UI roles", web_roles, canonical_roles))
    issues.extend(_missing_subset("Web UI decisions", web_decisions, canonical_decisions))
    issues.extend(_missing_subset("Web UI severities", web_severities, canonical_severities))

    status = "PASS" if not issues else "FAIL"
    report = {
        "timestamp": dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "status": status,
        "paths": {
            "contract": str(contract_path.relative_to(REPO_ROOT)).replace("\\", "/"),
            "mcp_types": str(mcp_path.relative_to(REPO_ROOT)).replace("\\", "/"),
            "web_types": str(web_path.relative_to(REPO_ROOT)).replace("\\", "/"),
            "adapters_dir": str(adapters_dir.relative_to(REPO_ROOT)).replace("\\", "/"),
        },
        "canonical": {
            "phases": sorted(canonical_phases),
            "risks": sorted(canonical_risks),
            "roles": sorted(canonical_roles),
            "decisions": sorted(canonical_decisions),
            "severities": sorted(canonical_severities),
            "phase_aliases": sorted(phase_aliases),
        },
        "mcp": {
            "phases": sorted(mcp_phases),
            "risks": sorted(mcp_risks),
            "roles": sorted(mcp_roles),
            "decisions": sorted(mcp_decisions),
            "severities": sorted(mcp_severities),
        },
        "web": {
            "phases": sorted(web_phases),
            "risks": sorted(web_risks),
            "roles": sorted(web_roles),
            "decisions": sorted(web_decisions),
            "severities": sorted(web_severities),
        },
        "issues": issues,
        "warnings": warnings,
    }

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print("=== CVF Guard Contract Compat ===")
        print(f"Status: {status}")
        if issues:
            print("Issues:")
            for item in issues:
                print(f"  - {item}")
        else:
            print("No compatibility issues found.")

    if args.enforce and issues:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
