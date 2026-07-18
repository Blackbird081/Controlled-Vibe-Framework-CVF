"""
Focused tests for CCLV-T2 check_central_facts_reference.py.

EPISTEMIC_PROCESS_NA_WITH_REASON: focused governance checker tests; no empirical
provider call, corpus claim, or runtime prediction is made.
"""

import json
import textwrap
from pathlib import Path

import pytest

from governance.compat.check_central_facts_reference import (
    CENTRAL_FACTS_REQUIRED_FIELDS,
    LOCAL_REFERENCE_SUB_FIELDS,
    _validate_file,
    _validate_json_packet,
    _validate_local_reference,
    _validate_markdown_packet,
    main,
)


# ---------------------------------------------------------------------------
# Fixtures: Markdown central facts packets
# ---------------------------------------------------------------------------

_VALID_MD_PACKET = textwrap.dedent("""\
    # My Review

    ## Central Facts Packet

    | Field | Value |
    |---|---|
    | `batchId` | `CCLV-T2` |
    | `baseHead` | `90205f79` |
    | `materialCommit` | `PENDING` |
    | `sessionSyncCommit` | `N/A with reason: split range` |
    | `expectedChangedSet` | `governance/compat/check_central_facts_reference.py` |
    | `actualChangedSet` | `governance/compat/check_central_facts_reference.py` |
    | `roadmapStatus` | `CLOSED_PASS_BOUNDED` |
    | `workOrderStatus` | `COMPLETE_PENDING_REVIEW` |
    | `completionReview` | `docs/reviews/example.md` |
    | `publicExportDisposition` | `DEFERRED_PRIVATE_ONLY` |
    | `findingRootCauseSummary` | `N/A with reason: no finding` |
    | `claimBoundary` | `doc-only; no runtime` |
""")

_MD_PACKET_MISSING_FIELDS = textwrap.dedent("""\
    # My Review

    ## Central Facts Packet

    | Field | Value |
    |---|---|
    | `batchId` | `CCLV-T2` |
    | `baseHead` | `90205f79` |
""")

_MD_NO_OPT_IN = textwrap.dedent("""\
    # Plain Review

    Nothing special here. No central packet marker.
""")


# ---------------------------------------------------------------------------
# Fixtures: JSON central facts packets
# ---------------------------------------------------------------------------

def _make_valid_json() -> str:
    data = {
        "schemaId": "cvf.closureCentralFacts.v1",
        "schemaVersion": "0.1.0",
        "fieldOrder": list(CENTRAL_FACTS_REQUIRED_FIELDS),
        "templateInstance": {f: "placeholder" for f in CENTRAL_FACTS_REQUIRED_FIELDS},
    }
    return json.dumps(data, indent=2)


def _make_json_missing_field_order_entries() -> str:
    data = {
        "schemaId": "cvf.closureCentralFacts.v1",
        "fieldOrder": ["batchId", "baseHead"],
        "templateInstance": {f: "placeholder" for f in CENTRAL_FACTS_REQUIRED_FIELDS},
    }
    return json.dumps(data, indent=2)


def _make_json_missing_template_instance_keys() -> str:
    data = {
        "schemaId": "cvf.closureCentralFacts.v1",
        "fieldOrder": list(CENTRAL_FACTS_REQUIRED_FIELDS),
        "templateInstance": {"batchId": "only-one"},
    }
    return json.dumps(data, indent=2)


# ---------------------------------------------------------------------------
# AC1: Valid Markdown template passes
# ---------------------------------------------------------------------------

def test_valid_markdown_packet_passes():
    violations = _validate_markdown_packet("test.md", _VALID_MD_PACKET)
    assert violations == [], f"Expected no violations, got: {violations}"


# ---------------------------------------------------------------------------
# AC3: Missing any of the 12 central fields is reported
# ---------------------------------------------------------------------------

def test_markdown_packet_missing_fields_reported():
    violations = _validate_markdown_packet("test.md", _MD_PACKET_MISSING_FIELDS)
    assert len(violations) == 1
    v = violations[0]
    assert v.check_id == "central_facts_packet_missing_fields"
    missing_fields = [f for f in CENTRAL_FACTS_REQUIRED_FIELDS if f not in ("batchId", "baseHead")]
    for field in missing_fields:
        assert field in v.message, f"Expected {field!r} in violation message"


# ---------------------------------------------------------------------------
# AC6: Non-applicable files (no opt-in marker) pass without forcing a packet
# ---------------------------------------------------------------------------

def test_non_applicable_markdown_passes():
    violations = _validate_markdown_packet("test.md", _MD_NO_OPT_IN)
    assert violations == []


# ---------------------------------------------------------------------------
# AC2: Valid JSON template passes (fieldOrder + templateInstance)
# ---------------------------------------------------------------------------

def test_valid_json_packet_passes():
    violations = _validate_json_packet("test.json", _make_valid_json())
    assert violations == [], f"Expected no violations, got: {violations}"


def test_json_missing_field_order_entries_reported():
    violations = _validate_json_packet("test.json", _make_json_missing_field_order_entries())
    assert any(v.check_id == "central_facts_json_field_order_incomplete" for v in violations)


def test_json_missing_template_instance_keys_reported():
    violations = _validate_json_packet("test.json", _make_json_missing_template_instance_keys())
    assert any(v.check_id == "central_facts_json_template_instance_incomplete" for v in violations)


def test_json_without_schema_marker_not_validated():
    plain = json.dumps({"someField": "value"})
    violations = _validate_json_packet("test.json", plain)
    assert violations == []


# ---------------------------------------------------------------------------
# AC4: Valid local reference block with existing target passes
# ---------------------------------------------------------------------------

def test_valid_local_reference_passes(tmp_path):
    target = tmp_path / "docs" / "reviews" / "evidence" / "packet.md"
    target.parent.mkdir(parents=True)
    target.write_text("# Packet\n")

    rel_target = "docs/reviews/evidence/packet.md"
    text = textwrap.dedent(f"""\
        Central Facts Reference: {rel_target}#central-facts-packet
        Local View Role: completion-review
        Local Disposition: PASS
        Local Delta: none
    """)
    violations = _validate_local_reference("review.md", text, tmp_path)
    assert violations == [], f"Unexpected violations: {violations}"


# ---------------------------------------------------------------------------
# AC5: Local reference with missing repo-local path is reported
# ---------------------------------------------------------------------------

def test_local_reference_missing_target_reported(tmp_path):
    text = textwrap.dedent("""\
        Central Facts Reference: docs/reviews/evidence/nonexistent.md
        Local View Role: completion-review
        Local Disposition: PASS
        Local Delta: none
    """)
    violations = _validate_local_reference("review.md", text, tmp_path)
    assert any(v.check_id == "local_ref_target_not_found" for v in violations)


def test_local_reference_missing_sub_fields_reported(tmp_path):
    target = tmp_path / "docs" / "reviews" / "evidence" / "packet.md"
    target.parent.mkdir(parents=True)
    target.write_text("# Packet\n")

    text = "Central Facts Reference: docs/reviews/evidence/packet.md\n"
    violations = _validate_local_reference("review.md", text, tmp_path)
    check_ids = [v.check_id for v in violations]
    assert "local_ref_missing_sub_field" in check_ids


def test_local_reference_empty_path_reported(tmp_path):
    text = "Central Facts Reference:\nLocal View Role: completion-review\nLocal Disposition: PASS\nLocal Delta: none\n"
    violations = _validate_local_reference("review.md", text, tmp_path)
    assert any(v.check_id == "local_ref_empty_path" for v in violations)


# ---------------------------------------------------------------------------
# AC7: Advisory mode exits 0; --enforce exits non-zero on violations
# ---------------------------------------------------------------------------

def test_advisory_mode_exits_zero(tmp_path, monkeypatch):
    bad_md = tmp_path / "bad.md"
    bad_md.write_text("## Central Facts Packet\n| Field | Value |\n|---|---|\n| `batchId` | `X` |\n")
    monkeypatch.chdir(tmp_path)
    ret = main(["--paths", str(bad_md)])
    assert ret == 0


def test_enforce_mode_exits_nonzero_on_violations(tmp_path, monkeypatch):
    bad_md = tmp_path / "bad.md"
    bad_md.write_text("## Central Facts Packet\n| Field | Value |\n|---|---|\n| `batchId` | `X` |\n")
    monkeypatch.chdir(tmp_path)
    ret = main(["--paths", str(bad_md), "--enforce"])
    assert ret != 0


def test_enforce_mode_exits_zero_on_clean_file(tmp_path, monkeypatch):
    clean = tmp_path / "clean.md"
    clean.write_text("# Nothing special here.\n")
    monkeypatch.chdir(tmp_path)
    ret = main(["--paths", str(clean), "--enforce"])
    assert ret == 0


# ---------------------------------------------------------------------------
# AC9 guard: Ensure no hard import that would suggest hook wiring
# ---------------------------------------------------------------------------

def test_checker_has_no_hook_chain_import():
    src = Path(__file__).parent / "check_central_facts_reference.py"
    content = src.read_text(encoding="utf-8")
    assert "run_local_governance_hook_chain" not in content, (
        "Checker must not import or reference the global hook chain (AC9: no hard wiring)"
    )
