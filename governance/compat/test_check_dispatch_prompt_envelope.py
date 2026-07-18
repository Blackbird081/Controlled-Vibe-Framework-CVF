"""
Focused tests for check_dispatch_prompt_envelope.py.

Tests cover:
  - PASS: dispatch-ready work order with complete envelope
  - PASS: dispatch-ready work order with N/A with reason (all cases)
  - FAIL: dispatch-ready work order missing envelope section entirely
  - FAIL: dispatch-ready work order with envelope but missing required fields
  - PASS: non-dispatch-ready work order is exempt (DRAFT, HOLD)
  - FAIL: envelope with prohibited content (scope expansion claim)
  - FAIL: envelope with prohibited content (production-ready claim)
  - PASS: envelope with all required fields in fenced code block
  - FAIL: envelope section present but no fields and no N/A
  - PASS: N/A with reason satisfies even if no fields are present

These tests import the checker module directly and call check_work_order().
No file I/O or git calls are made.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow running from repo root: governance/compat/test_check_dispatch_prompt_envelope.py
sys.path.insert(0, str(Path(__file__).resolve().parent))

from check_dispatch_prompt_envelope import (  # noqa: E402
    ENVELOPE_SECTION_MARKER,
    check_work_order,
    _is_dispatch_ready,
    _extract_envelope_section,
    _is_na_section,
    _check_required_fields,
    _check_prohibited_content,
    _check_read_first_placement,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_work_order(status: str, envelope_section: str) -> str:
    """Build a minimal work order text with the given Status and envelope."""
    return f"""# CVF Agent Work Order - Test

Memory class: POINTER_RECORD

Status: {status}

{ENVELOPE_SECTION_MARKER}

{envelope_section}

## Purpose

Test work order for envelope checker.

## Authority Chain

- Operator instruction: test

## Claim Boundary

Test claim boundary.
"""


COMPLETE_ENVELOPE = """\
Role: Claude is worker/implementer. Codex is reviewer/closer.
Canonical packet: docs/work_orders/CVF_TEST_WORK_ORDER_2026-06-15.md.
Commit mode: WORKER_MUST_NOT_COMMIT.
Base: executionBaseHead 620dc039.
Current-time notes: no live API calls authorized; authoring-time only.
Do-not-misread notes: do not touch runtime sources.
Required first actions: read AGENTS.md, then read the work order.
Return contract: COMPLETE_PENDING_REVIEW with changed paths and HEAD unchanged.
"""

NA_ENVELOPE = "N/A with reason: operator executes this batch directly; no agent handoff is expected."

PARTIAL_ENVELOPE_MISSING_ROLE = """\
Canonical packet: docs/work_orders/CVF_TEST_WORK_ORDER_2026-06-15.md.
Commit mode: WORKER_MUST_NOT_COMMIT.
Base: executionBaseHead 620dc039.
Current-time notes: N/A with reason: authoring only.
Do-not-misread notes: N/A with reason: no common misreadings.
Required first actions: read AGENTS.md.
Return contract: COMPLETE_PENDING_REVIEW.
"""

SCOPE_EXPANSION_ENVELOPE = """\
Role: Claude is worker/implementer.
Canonical packet: docs/work_orders/CVF_TEST_WORK_ORDER_2026-06-15.md.
Commit mode: WORKER_MUST_NOT_COMMIT.
Base: executionBaseHead 620dc039.
Current-time notes: adds new scope to cover runtime wiring.
Do-not-misread notes: N/A with reason.
Required first actions: read AGENTS.md.
Return contract: COMPLETE_PENDING_REVIEW.
"""

PRODUCTION_READY_ENVELOPE = """\
Role: Claude is worker/implementer.
Canonical packet: docs/work_orders/CVF_TEST_WORK_ORDER_2026-06-15.md.
Commit mode: WORKER_MUST_NOT_COMMIT.
Base: executionBaseHead 620dc039.
Current-time notes: system is production-ready.
Do-not-misread notes: N/A with reason.
Required first actions: read AGENTS.md.
Return contract: COMPLETE_PENDING_REVIEW.
"""

FENCED_COMPLETE_ENVELOPE = """\
```text
Role: Claude is worker/implementer. Codex is reviewer/closer.
Canonical packet: docs/work_orders/CVF_TEST_2026-06-15.md.
Commit mode: WORKER_MUST_NOT_COMMIT.
Base: executionBaseHead 620dc039.
Current-time notes: authoring only.
Do-not-misread notes: N/A with reason.
Required first actions: read AGENTS.md.
Return contract: COMPLETE_PENDING_REVIEW.
```
"""

EMPTY_ENVELOPE = ""


# ---------------------------------------------------------------------------
# Tests: _is_dispatch_ready
# ---------------------------------------------------------------------------

def test_dispatch_ready_dispatch_ready_status() -> None:
    text = "Status: DISPATCH_READY\n"
    assert _is_dispatch_ready(text), "DISPATCH_READY should be recognized"


def test_dispatch_ready_dispatched_to_worker() -> None:
    text = "Status: DISPATCHED_TO_WORKER\n"
    assert _is_dispatch_ready(text), "DISPATCHED_TO_WORKER should be recognized"


def test_dispatch_ready_dispatched() -> None:
    text = "Status: DISPATCHED\n"
    assert _is_dispatch_ready(text), "DISPATCHED should be recognized"


def test_not_dispatch_ready_draft() -> None:
    text = "Status: DRAFT\n"
    assert not _is_dispatch_ready(text), "DRAFT should not be dispatch-ready"


def test_not_dispatch_ready_hold() -> None:
    text = "Status: HOLD_PENDING_OPERATOR\n"
    assert not _is_dispatch_ready(text), "HOLD status should not be dispatch-ready"


def test_not_dispatch_ready_no_status() -> None:
    text = "No status line here.\n"
    assert not _is_dispatch_ready(text), "Missing status should not be dispatch-ready"


# ---------------------------------------------------------------------------
# Tests: _extract_envelope_section
# ---------------------------------------------------------------------------

def test_extract_envelope_section_present() -> None:
    text = f"{ENVELOPE_SECTION_MARKER}\n\nsome content\n\n## Next Section\n"
    section = _extract_envelope_section(text)
    assert "some content" in section
    assert "Next Section" not in section


def test_extract_envelope_section_absent() -> None:
    text = "## Purpose\n\nNo envelope here.\n"
    section = _extract_envelope_section(text)
    assert section == ""


# ---------------------------------------------------------------------------
# Tests: _is_na_section
# ---------------------------------------------------------------------------

def test_is_na_section_true() -> None:
    assert _is_na_section("N/A with reason: operator runs directly.")
    assert _is_na_section("n/a with reason: no agent handoff expected.")


def test_is_na_section_false() -> None:
    assert not _is_na_section("Role: worker. Canonical packet: docs/...")


def test_is_na_section_field_level_na_not_standalone() -> None:
    """Field-level N/A values must NOT be treated as standalone section N/A."""
    section = (
        "Canonical packet: docs/work_orders/CVF_TEST.md.\n"
        "Commit mode: WORKER_MUST_NOT_COMMIT.\n"
        "executionBaseHead 620dc039.\n"
        "Current-time notes: N/A with reason: authoring only.\n"
        "Do-not-misread notes: N/A with reason: no issues.\n"
        "Required first actions: read AGENTS.md.\n"
        "Return contract: COMPLETE_PENDING_REVIEW.\n"
    )
    assert not _is_na_section(section), (
        "Field-level N/A with reason should not exempt the whole section"
    )


def test_is_na_section_bulleted_field_level_na_not_standalone() -> None:
    """Bulleted field-level N/A values must not exempt the whole section."""
    section = (
        "- Canonical packet: docs/work_orders/CVF_TEST.md.\n"
        "- Commit mode: WORKER_MUST_NOT_COMMIT.\n"
        "- executionBaseHead 620dc039.\n"
        "- Current-time notes: N/A with reason: authoring only.\n"
        "- Do-not-misread notes: N/A with reason: no issues.\n"
        "- Required first actions: read AGENTS.md.\n"
        "- Return contract: COMPLETE_PENDING_REVIEW.\n"
    )
    assert not _is_na_section(section), (
        "Bulleted field-level N/A with reason should not exempt the whole section"
    )


# ---------------------------------------------------------------------------
# Tests: _check_prohibited_content
# ---------------------------------------------------------------------------

def test_prohibited_scope_expansion() -> None:
    section = "Current-time notes: adds new scope to cover runtime wiring."
    violations = _check_prohibited_content(section)
    assert any("scope" in v.lower() for v in violations), f"Expected scope violation, got: {violations}"


def test_prohibited_production_ready() -> None:
    section = "Current-time notes: the system is production-ready."
    violations = _check_prohibited_content(section)
    assert any("readiness" in v.lower() for v in violations), f"Expected readiness violation, got: {violations}"


def test_negated_production_readiness_is_allowed() -> None:
    section = "Do-not-misread notes: do not claim production readiness."
    violations = _check_prohibited_content(section)
    assert violations == [], f"Expected negated readiness note to pass, got: {violations}"


def test_no_prohibited_content_clean_envelope() -> None:
    violations = _check_prohibited_content(COMPLETE_ENVELOPE)
    assert violations == [], f"Expected no violations for clean envelope, got: {violations}"


# ---------------------------------------------------------------------------
# Tests: _check_required_fields
# ---------------------------------------------------------------------------

def test_check_required_fields_all_present() -> None:
    section = COMPLETE_ENVELOPE
    missing = _check_required_fields(section)
    assert missing == [], f"Expected no missing fields, got: {missing}"


def test_check_required_fields_missing_role() -> None:
    section = PARTIAL_ENVELOPE_MISSING_ROLE
    missing = _check_required_fields(section)
    assert "Role" in missing, f"Expected 'Role' in missing, got: {missing}"


# ---------------------------------------------------------------------------
# Tests: check_work_order (integration)
# ---------------------------------------------------------------------------

def test_pass_complete_envelope() -> None:
    """PASS: dispatch-ready work order with all required envelope fields."""
    text = _make_work_order("DISPATCH_READY", COMPLETE_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"Expected no issues, got: {issues}"


def test_pass_read_first_envelope_before_mission() -> None:
    """PASS: envelope is the first section before Purpose and Mission."""
    text = f"""# CVF Agent Work Order - Test

Memory class: POINTER_RECORD

Status: DISPATCH_READY

{ENVELOPE_SECTION_MARKER}

{COMPLETE_ENVELOPE}

## Purpose

Test purpose.

## 1. Mission

Test mission.
"""
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"Expected read-first envelope to pass, got: {issues}"


def test_fail_envelope_after_mission_not_read_first() -> None:
    """FAIL: envelope after Mission is too late for delegated dispatch."""
    text = f"""# CVF Agent Work Order - Test

Memory class: POINTER_RECORD

Status: DISPATCH_READY

## 1. Mission

Test mission.

{ENVELOPE_SECTION_MARKER}

{COMPLETE_ENVELOPE}

## Claim Boundary

Test claim boundary.
"""
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert any("before `## 1. Mission`" in issue for issue in issues), issues


def test_fail_envelope_after_purpose_not_read_first() -> None:
    """FAIL: Purpose before the envelope hides the worker prompt."""
    text = f"""# CVF Agent Work Order - Test

Memory class: POINTER_RECORD

Status: DISPATCH_READY

## Purpose

Test purpose.

{ENVELOPE_SECTION_MARKER}

{COMPLETE_ENVELOPE}
"""
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert any("before `## Purpose`" in issue for issue in issues), issues
    assert any("first `##` section" in issue for issue in issues), issues


def test_fail_envelope_too_deep_even_without_mission() -> None:
    """FAIL: an envelope buried far down the file is not read-first."""
    padding = "\n".join(f"Intro line {i}" for i in range(1, 30))
    text = f"""# CVF Agent Work Order - Test

Memory class: POINTER_RECORD

Status: DISPATCH_READY

{padding}

{ENVELOPE_SECTION_MARKER}

{COMPLETE_ENVELOPE}
"""
    placement = _check_read_first_placement(text)
    assert any("max 25" in issue for issue in placement), placement


def test_pass_na_with_reason() -> None:
    """PASS: dispatch-ready work order with N/A with reason."""
    text = _make_work_order("DISPATCH_READY", NA_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"Expected no issues for N/A envelope, got: {issues}"


def test_pass_fenced_complete_envelope() -> None:
    """PASS: complete envelope inside a fenced code block."""
    text = _make_work_order("DISPATCH_READY", FENCED_COMPLETE_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"Expected no issues for fenced envelope, got: {issues}"


def test_pass_non_dispatch_ready_draft_no_envelope() -> None:
    """PASS: DRAFT status work order is exempt even with no envelope."""
    text = _make_work_order("DRAFT", "")
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"DRAFT work order should be exempt, got: {issues}"


def test_pass_hold_work_order_no_envelope() -> None:
    """PASS: HOLD work order is exempt even with no envelope."""
    text = _make_work_order("HOLD_PENDING_OPERATOR", "")
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"HOLD work order should be exempt, got: {issues}"


def test_fail_missing_envelope_section() -> None:
    """FAIL: dispatch-ready work order with no ## Dispatch Prompt Envelope section."""
    text = f"""# CVF Agent Work Order - Test

Memory class: POINTER_RECORD

Status: DISPATCH_READY

## Purpose

Test work order with no envelope section.
"""
    issues = check_work_order("docs/work_orders/CVF_MISSING_ENVELOPE_2026-06-15.md", text)
    assert issues, "Expected issues for missing envelope section"
    assert any("missing" in i.lower() for i in issues), f"Expected 'missing' in issue, got: {issues}"


def test_fail_envelope_missing_required_fields() -> None:
    """FAIL: dispatch-ready work order with envelope but missing Role field."""
    text = _make_work_order("DISPATCH_READY", PARTIAL_ENVELOPE_MISSING_ROLE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues, "Expected issues for missing Role field"
    assert any("Role" in i for i in issues), f"Expected 'Role' in issues, got: {issues}"


def test_fail_empty_envelope_no_na() -> None:
    """FAIL: envelope section is present but empty (no fields, no N/A)."""
    text = _make_work_order("DISPATCH_READY", EMPTY_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues, f"Expected issues for empty envelope, got: {issues}"


def test_fail_scope_expansion_in_envelope() -> None:
    """FAIL: envelope claims to add new scope."""
    text = _make_work_order("DISPATCH_READY", SCOPE_EXPANSION_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues, f"Expected issues for scope-expansion envelope, got: {issues}"
    assert any("scope" in i.lower() for i in issues), f"Expected scope issue, got: {issues}"


def test_fail_production_ready_claim_in_envelope() -> None:
    """FAIL: envelope claims production-ready status."""
    text = _make_work_order("DISPATCH_READY", PRODUCTION_READY_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues, f"Expected issues for production-ready claim, got: {issues}"
    assert any("readiness" in i.lower() for i in issues), f"Expected readiness issue, got: {issues}"


def test_pass_dispatched_to_worker_status() -> None:
    """PASS: DISPATCHED_TO_WORKER is treated as dispatch-ready."""
    text = _make_work_order("DISPATCHED_TO_WORKER", COMPLETE_ENVELOPE)
    issues = check_work_order("docs/work_orders/CVF_TEST_2026-06-15.md", text)
    assert issues == [], f"Expected no issues for DISPATCHED_TO_WORKER, got: {issues}"


# ---------------------------------------------------------------------------
# Runner (also works with pytest)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    test_functions = [
        v for k, v in sorted(globals().items())
        if k.startswith("test_") and callable(v)
    ]
    passed = 0
    failed = 0
    for fn in test_functions:
        try:
            fn()
            print(f"  PASS  {fn.__name__}")
            passed += 1
        except AssertionError as exc:
            print(f"  FAIL  {fn.__name__}: {exc}")
            failed += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  ERROR {fn.__name__}: {exc}")
            failed += 1
    total = passed + failed
    print(f"\n{passed}/{total} tests passed.")
    sys.exit(0 if failed == 0 else 1)
