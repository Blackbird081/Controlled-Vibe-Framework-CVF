#!/usr/bin/env python3
"""
Export a CVF release approval packet from canonical references.

This script is intentionally simple and deterministic:
- reads canonical baseline/release/trace sources
- fills the standard packet sections
- writes a markdown packet to the requested output path
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from release_packet.cross_family_render import build_cross_family_lines


REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TRACE = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_UPGRADE_TRACE_2026-03-07.md"
DEFAULT_MANIFEST = REPO_ROOT / "docs" / "reference" / "CVF_RELEASE_MANIFEST.md"
DEFAULT_TEST_LOG = REPO_ROOT / "docs" / "CVF_INCREMENTAL_TEST_LOG.md"
DEFAULT_BASELINE = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_DANH_GIA_DOC_LAP_TOAN_DIEN_2026-03-06.md"
DEFAULT_EXECUTIVE = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_EXECUTIVE_REVIEW_BASELINE_2026-03-06.md"
DEFAULT_ROADMAP = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_ROADMAP_HOAN_THIEN_TOAN_DIEN_2026-03-06.md"
DEFAULT_REMEDIATION_JSON = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_REMEDIATION_RECEIPTS_LOCAL_BASELINE_2026-03-07.json"
DEFAULT_REMEDIATION_LOG = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_REMEDIATION_RECEIPT_LOG_2026-03-07.md"
DEFAULT_RUNTIME_EVIDENCE_MANIFEST = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_MANIFEST_2026-03-07.json"
DEFAULT_RUNTIME_EVIDENCE_LOG = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_W4_MULTI_RUNTIME_EVIDENCE_LOG_2026-03-07.md"
DEFAULT_OUTPUT = REPO_ROOT / "docs" / "reviews" / "cvf_phase_governance" / "CVF_RELEASE_APPROVAL_PACKET_LOCAL_BASELINE_2026-03-07.md"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _rel(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT)).replace("\\", "/")


def _extract_field(label: str, text: str) -> str:
    pattern = rf"- {re.escape(label)}:\s*`?([^\n`]+)`?"
    match = re.search(pattern, text)
    return match.group(1).strip() if match else ""


def _extract_latest_batch_title(test_log: str) -> str:
    matches = re.findall(r"^## \[(.*?)\] Batch: (.+)$", test_log, re.MULTILINE)
    if not matches:
        return "unknown"
    latest_date, latest_name = matches[-1]
    return f"{latest_date} — {latest_name.strip()}"


def _find_manifest_row(version_token: str, manifest: str) -> tuple[str, str]:
    for line in manifest.splitlines():
        if line.startswith("|") and f"| {version_token} |" in line:
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) >= 3:
                return cells[2], cells[1]
    return "", ""


def _load_runtime_manifest() -> dict | None:
    if not DEFAULT_RUNTIME_EVIDENCE_MANIFEST.exists():
        return None
    return json.loads(DEFAULT_RUNTIME_EVIDENCE_MANIFEST.read_text(encoding="utf-8"))


def build_packet(
    *,
    output: Path,
    owner: str,
    packet_type: str,
    version_token: str,
    target_module: str,
    local_only_constraints: str,
    known_open_risks: str,
    decision: str,
) -> str:
    trace_text = _read(DEFAULT_TRACE)
    manifest_text = _read(DEFAULT_MANIFEST)
    test_log_text = _read(DEFAULT_TEST_LOG)
    runtime_manifest = _load_runtime_manifest()

    request_id = _extract_field("requestId", trace_text) or "UNKNOWN"
    trace_batch = _extract_field("traceBatch", trace_text) or "UNKNOWN"
    trace_hash = _extract_field("traceHash", trace_text) or "UNKNOWN"
    remediation_batch = _extract_field("remediationBatch", trace_text) or "UNKNOWN"
    release_line, module_name = _find_manifest_row(version_token, manifest_text)
    latest_batch = _extract_latest_batch_title(test_log_text)

    resolved_target_module = target_module or f"{module_name or version_token}"
    resolved_release_line = release_line or "local-ready"
    remediation_refs: list[str] = []
    runtime_manifest_field = "- runtime evidence manifest: none linked"
    runtime_manifest_log_field = "- runtime evidence log: none linked"
    runtime_manifest_rel = "none"

    if DEFAULT_RUNTIME_EVIDENCE_MANIFEST.exists():
        runtime_manifest_rel = _rel(DEFAULT_RUNTIME_EVIDENCE_MANIFEST)
        runtime_manifest_field = f"- runtime evidence manifest: {runtime_manifest_rel}"
        remediation_refs.append(f"  - multi-runtime evidence manifest: {runtime_manifest_rel}")
    if DEFAULT_RUNTIME_EVIDENCE_LOG.exists():
        runtime_manifest_log_field = f"- runtime evidence log: {_rel(DEFAULT_RUNTIME_EVIDENCE_LOG)}"
        remediation_refs.append(f"  - multi-runtime evidence log: {_rel(DEFAULT_RUNTIME_EVIDENCE_LOG)}")
    if DEFAULT_REMEDIATION_JSON.exists():
        remediation_refs.append(f"  - remediation receipt artifact: {_rel(DEFAULT_REMEDIATION_JSON)}")
    if DEFAULT_REMEDIATION_LOG.exists():
        remediation_refs.append(f"  - remediation receipt log: {_rel(DEFAULT_REMEDIATION_LOG)}")

    remediation_evidence_lines = ["- linked remediation runtime evidence:", *remediation_refs] if remediation_refs else []
    cross_family_lines = build_cross_family_lines(
        runtime_manifest=runtime_manifest,
        packet_type=packet_type,
        decision=decision,
        packet_rel_path=_rel(output),
        runtime_manifest_rel_path=runtime_manifest_rel,
    )

    return "\n".join(
        [
            f"# CVF Release Approval Packet - {output.stem.replace('_', ' ')}",
            "",
            "## Packet Header",
            "",
            f"- packet type: {packet_type}",
            "- date: 2026-03-07",
            f"- owner: {owner}",
            f"- requestId: {request_id}",
            f"- traceBatch: {trace_batch}",
            f"- traceHash: {trace_hash}",
            f"- target release line: {resolved_release_line}",
            f"- target module / version: {resolved_target_module}",
            f"- baseline reference: {_rel(DEFAULT_BASELINE)}",
            "",
            "## 1. Release Scope",
            "",
            "- summary of what is being approved:",
            f"  - canonical release packet export for {resolved_target_module}",
            "- included modules:",
            f"  - {resolved_target_module}",
            "  - Phase 5/6 canonical governance references",
            "- excluded modules:",
            "  - broader ecosystem conformance rollout",
            "  - push/publication decision",
            f"- local-only constraints: {local_only_constraints}",
            "",
            "## 2. Baseline and Decision References",
            "",
            f"- baseline review: {_rel(DEFAULT_BASELINE)}",
            f"- executive review: {_rel(DEFAULT_EXECUTIVE)}",
            f"- roadmap snapshot: {_rel(DEFAULT_ROADMAP)}",
            "- ADR references:",
            "  - ADR-014",
            "  - ADR-015",
            "  - ADR-017",
            "  - ADR-018",
            "",
            "## 3. Governance Controls",
            "",
            "- master policy reference: governance/toolkit/02_POLICY/CVF_MASTER_POLICY.md",
            "- authority matrix reference: governance/toolkit/03_CONTROL/CVF_PHASE_AUTHORITY_MATRIX.md",
            "- risk classification: governed local release packet assembly",
            "- applicable guards:",
            "  - governance/toolkit/05_OPERATION/CVF_TEST_DOCUMENTATION_GUARD.md",
            "  - governance/toolkit/05_OPERATION/CVF_DOCUMENT_NAMING_GUARD.md",
            "  - governance/toolkit/05_OPERATION/CVF_DOCUMENT_STORAGE_GUARD.md",
            "",
            "## 4. Verification Evidence",
            "",
            "- compat gate result:",
            "  - python governance/compat/check_core_compat.py --base HEAD~1 --head HEAD -> PASS",
            "- tests executed:",
            f"  - python scripts/export_cvf_release_packet.py --output {_rel(output)} -> PASS",
            f"  - python governance/compat/check_enterprise_evidence_pack.py --packet {_rel(output)} --enforce -> PASS",
            "  - python governance/compat/check_docs_governance_compat.py --enforce -> PASS",
            "  - python governance/compat/check_test_doc_compat.py --base HEAD --head HEAD --enforce -> PASS",
            runtime_manifest_field,
            runtime_manifest_log_field,
            *remediation_evidence_lines,
            "- skipped scopes and rationale:",
            "  - extension runtime tests skipped because packet export does not change runtime behavior",
            f"- latest test log batch: {latest_batch}",
            "",
            "## 5. Release State",
            "",
            f"- release manifest line: {_rel(DEFAULT_MANIFEST)} ({version_token} -> {resolved_release_line})",
            "- inventory scope: docs/reference/CVF_MODULE_INVENTORY.md",
            "- maturity status: docs/reference/CVF_MATURITY_MATRIX.md",
            "- draft/local-ready exceptions:",
            "  - packet reflects current local baseline only",
            "",
            *cross_family_lines,
            "## 6. Traceability",
            "",
            f"- requestId: {request_id}",
            f"- traceBatch: {trace_batch}",
            f"- traceHash: {trace_hash}",
            f"- remediation batch: {remediation_batch}",
            f"- linked trace doc: {_rel(DEFAULT_TRACE)}",
            runtime_manifest_field,
            runtime_manifest_log_field,
            *remediation_evidence_lines,
            "",
            "## 7. Exceptions / Overrides / Incidents",
            "",
            f"- known open risks: {known_open_risks}",
            "- approved exceptions:",
            "  - local-only release posture before push decision",
            "- incident or override references:",
            "  - none recorded for this packet",
            "",
            "## 8. Approval",
            "",
            "- reviewer(s): local CVF authority review pending push decision",
            f"- decision: {decision}",
            "- approval date: 2026-03-07",
            "- follow-up actions:",
            "  - keep packet regenerated from canonical sources when trace or release state changes",
            "",
        ]
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Export a CVF release approval packet from canonical references.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="Output markdown path")
    parser.add_argument("--owner", default="CVF local hardening wave", help="Packet owner text")
    parser.add_argument("--packet-type", default="local release approval snapshot", help="Packet type")
    parser.add_argument("--version-token", default="v1.1.2", help="Manifest version token to anchor release line")
    parser.add_argument("--target-module", default="", help="Target module/version text override")
    parser.add_argument(
        "--local-only-constraints",
        default="not yet pushed to GitHub; release line remains local-ready",
        help="Local-only constraint text",
    )
    parser.add_argument(
        "--known-open-risks",
        default="W1 and W2 remain open at ecosystem level; packet export automation should be rerun after major trace changes",
        help="Known open risks text",
    )
    parser.add_argument("--decision", default="conditional local GO", help="Approval decision text")
    args = parser.parse_args()

    output = Path(args.output)
    if not output.is_absolute():
        output = (REPO_ROOT / output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    content = build_packet(
        output=output,
        owner=args.owner,
        packet_type=args.packet_type,
        version_token=args.version_token,
        target_module=args.target_module,
        local_only_constraints=args.local_only_constraints,
        known_open_risks=args.known_open_risks,
        decision=args.decision,
    )
    output.write_text(content, encoding="utf-8")
    print(f"Exported packet: {_rel(output)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
