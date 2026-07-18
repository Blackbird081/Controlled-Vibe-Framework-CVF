#!/usr/bin/env python3
"""Check ERH public-surface drift workflow readiness.

This guard verifies that private ERH evidence is routed through a bounded
public-surface drift ledger before public README/catalog claims are updated.
It is snapshot-backed so local hooks do not depend on a sibling public-sync
clone being present.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[2]
CHAIN_VERSION = "cvf.erhPublicSurfaceDriftWorkflow.pd1.v1"

LEDGER_PATH = "docs/reference/CVF_ERH_PD1_PUBLIC_SURFACE_DRIFT_LEDGER_2026-06-04.md"
CHAIN_REFERENCE_PATH = "docs/reference/CVF_ERH_PD1_PUBLIC_SURFACE_DRIFT_WORKFLOW_CHAIN_2026-06-04.md"
ROADMAP_PATH = "docs/roadmaps/CVF_ERH_EXTERNAL_REVIEW_HARDENING_ROADMAP_2026-06-04.md"
SYSTEM_LOOP_REGISTRY_PATH = "docs/reference/CVF_SYSTEM_LOOP_INTERLOCK_REGISTRY_2026-06-02.json"

PUBLIC_REMOTE = "https://github.com/Blackbird081/Controlled-Vibe-Framework-CVF.git"
PUBLIC_COMMIT = "73f1da98e1a5fcc55c3124ff7c5a633193df5322"

PRIVATE_EVIDENCE_PATHS = {
    "ERH-T1C": "docs/reviews/CVF_ERH_T1C_PUBLIC_SYNC_LOCAL_CLAIM_BOUNDARY_PREP_COMPLETION_2026-06-04.md",
    "ERH-T2C": "docs/reviews/CVF_ERH_T2C_ROUTE_GOVERNANCE_PROOF_HARDENING_COMPLETION_2026-06-04.md",
    "ERH-CI1": "docs/reviews/CVF_ERH_CI1_PUBLIC_EVALUATION_WORKFLOW_CHAIN_COMPLETION_2026-06-04.md",
}

PUBLIC_ARTIFACT_PATHS = (
    "README.md",
    "GOVERNANCE.md",
    "ARCHITECTURE.md",
    "docs/INDEX.md",
    "docs/reference/CVF_PUBLIC_EVALUATION_CLAIM_BOUNDARY_2026-06-04.md",
    "docs/reference/CVF_ERH_PUBLIC_SYNC_SUMMARY_2026-06-04.md",
    "docs/reference/CVF_KNOWN_LIMITATIONS_REGISTER_2026-04-21.md",
    "docs/reference/CVF_TECHNICAL_PRODUCT_CATALOG_2026-05-18.md",
    "governance/public-surface-manifest.json",
)

ALLOWED_DRIFT_STATUSES = (
    "EXPORTED_IN_PUBLIC_SYNC",
    "EXPORTED_IN_PUBLIC_SYNC_SUMMARY",
    "PRIVATE_ONLY_DEFERRED",
    "PUBLIC_SUMMARY_UPDATE_CANDIDATE",
    "NO_PUBLIC_CLAIM",
)

LEDGER_REQUIRED_MARKERS = (
    "Public sync remote:",
    PUBLIC_REMOTE,
    "Public commit:",
    PUBLIC_COMMIT,
    "Public Surface Drift Ledger",
    "Private Evidence To Public Surface Drift Matrix",
    "Next public-sync action queue",
    "does not prove live governance behavior",
)

CHAIN_REQUIRED_MARKERS = (
    CHAIN_VERSION,
    "DRIFT_BOUNDED_WITH_UPDATE_CANDIDATES",
    "PUBLIC_SUMMARY_EXPORTED_BOUNDED",
    "PUBLIC_SUMMARY_UPDATE_CANDIDATE",
    "private evidence -> public artifact -> status",
)

CLAIM_BOUNDARY = (
    "PUBLIC_SUMMARY_EXPORTED_BOUNDED: ERH private evidence has a "
    "source-backed public-surface drift ledger and a bounded public-sync "
    "summary for ERH-T2C and ERH-CI1 at public commit 73f1da98e. Not "
    "claimed: live governance behavior, hosted freshness, production "
    "readiness, public readiness, dependency-audit hardening, auth migration, "
    "or complete route coverage."
)


def _read(path: str, repo_root: Path = REPO_ROOT) -> str:
    target = repo_root / path
    if not target.exists():
        return ""
    return target.read_text(encoding="utf-8", errors="replace")


def _marker_stage(
    stage: str,
    path: str,
    markers: tuple[str, ...] | list[str],
    repo_root: Path,
) -> dict[str, Any]:
    text = _read(path, repo_root)
    missing = [marker for marker in markers if marker not in text]
    return {
        "stage": stage,
        "path": path,
        "status": "PASS" if text and not missing else "FAIL",
        "missing": missing if text else list(markers),
    }


def _check_private_evidence(repo_root: Path) -> dict[str, Any]:
    missing = [
        path
        for path in PRIVATE_EVIDENCE_PATHS.values()
        if not (repo_root / path).exists()
    ]
    return {
        "stage": "private_erh_evidence_available",
        "path": "private ERH completion packets",
        "status": "PASS" if not missing else "FAIL",
        "missing": missing,
    }


def _check_ledger_rows(repo_root: Path) -> dict[str, Any]:
    text = _read(LEDGER_PATH, repo_root)
    required = [
        *PRIVATE_EVIDENCE_PATHS.keys(),
        *PRIVATE_EVIDENCE_PATHS.values(),
        *PUBLIC_ARTIFACT_PATHS,
        *ALLOWED_DRIFT_STATUSES,
    ]
    missing = [marker for marker in required if marker not in text]
    return {
        "stage": "drift_ledger_traceability",
        "path": LEDGER_PATH,
        "status": "PASS" if text and not missing else "FAIL",
        "missing": missing if text else required,
    }


def _check_public_sync_snapshot(repo_root: Path) -> dict[str, Any]:
    text = _read(LEDGER_PATH, repo_root)
    required = [PUBLIC_REMOTE, PUBLIC_COMMIT, *PUBLIC_ARTIFACT_PATHS]
    missing = [marker for marker in required if marker not in text]
    return {
        "stage": "public_sync_snapshot_recorded",
        "path": LEDGER_PATH,
        "status": "PASS" if text and not missing else "FAIL",
        "missing": missing if text else required,
    }


def _check_system_loop(repo_root: Path) -> dict[str, Any]:
    text = _read(SYSTEM_LOOP_REGISTRY_PATH, repo_root)
    markers = (
        "erh-public-surface-drift-workflow-chain",
        "ERH_PUBLIC_SURFACE_DRIFT_WORKFLOW",
        "check_erh_public_surface_drift_workflow.py",
    )
    missing = [marker for marker in markers if marker not in text]
    return {
        "stage": "system_loop_interlock",
        "path": SYSTEM_LOOP_REGISTRY_PATH,
        "status": "PASS" if text and not missing else "FAIL",
        "missing": missing if text else list(markers),
    }


def evaluate(repo_root: Path = REPO_ROOT) -> dict[str, Any]:
    stages = [
        _check_private_evidence(repo_root),
        _marker_stage("workflow_chain_reference", CHAIN_REFERENCE_PATH, CHAIN_REQUIRED_MARKERS, repo_root),
        _marker_stage("ledger_required_markers", LEDGER_PATH, LEDGER_REQUIRED_MARKERS, repo_root),
        _check_ledger_rows(repo_root),
        _check_public_sync_snapshot(repo_root),
        _check_system_loop(repo_root),
        _marker_stage("roadmap_pd1_status", ROADMAP_PATH, ("ERH-PD1", "PUBLIC_SURFACE_DRIFT_WORKFLOW"), repo_root),
    ]
    failures = [stage for stage in stages if stage["status"] != "PASS"]
    return {
        "chainVersion": CHAIN_VERSION,
        "verdict": "PUBLIC_SUMMARY_EXPORTED_BOUNDED" if not failures else "BLOCKED",
        "stages": stages,
        "publicSyncSnapshot": {
            "remote": PUBLIC_REMOTE,
            "commit": PUBLIC_COMMIT,
            "artifactCount": len(PUBLIC_ARTIFACT_PATHS),
        },
        "updateCandidates": ["ERH-DEP"],
        "claimBoundary": CLAIM_BOUNDARY,
    }


def _print_text(report: dict[str, Any]) -> None:
    print("=== CVF ERH Public-Surface Drift Workflow Gate ===")
    print(f"Chain: {report['chainVersion']}")
    print(f"Verdict: {report['verdict']}")
    for stage in report["stages"]:
        print(f"- {stage['stage']}: {stage['status']} ({stage['path']})")
        if stage["missing"]:
            print(f"  missing: {', '.join(stage['missing'])}")
    print("Update candidates: " + ", ".join(report["updateCandidates"]))
    print(report["claimBoundary"])


def main() -> int:
    parser = argparse.ArgumentParser(description="Check ERH public-surface drift workflow chain")
    parser.add_argument("--json", action="store_true", help="Emit JSON")
    parser.add_argument("--enforce", action="store_true", help="Exit non-zero on BLOCKED")
    args = parser.parse_args()

    report = evaluate()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        _print_text(report)
    return 1 if args.enforce and report["verdict"] == "BLOCKED" else 0


if __name__ == "__main__":
    raise SystemExit(main())
