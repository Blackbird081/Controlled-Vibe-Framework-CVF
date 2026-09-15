"""Focused ROLE-SOT-MH-T1 machine-hardening cases.

Covers the two dispatch-quality controls added for ROLE-SOT-MH-T1:
execution-anchor substitution and dated-owner dependency discovery. Cases
follow the GC-018 baseline acceptance matrix plus the boundary cases the work
order requires: explanatory prose is ignored, ordinary non-dated references are
unaffected, malformed registry input fails closed, and multiple dated paths
reconcile exactly once.
"""

import importlib.util
from pathlib import Path
from unittest.mock import patch


MODULE_PATH = Path(__file__).resolve().with_name("check_work_order_dispatch_quality.py")
SPEC = importlib.util.spec_from_file_location(
    "check_work_order_dispatch_quality_mh", MODULE_PATH
)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


DISPATCH_SHA = "6d98b1a27be0b25646ceb395a6faa64c83d47219"
DATED_STANDARD = "docs/reference/CVF_WORK_ORDER_DEPENDENCY_RELEASE_EVIDENCE_STANDARD_2026-06-03.md"
OTHER_DATED_STANDARD = "docs/reference/CVF_TEXT_ENCODING_AND_SYMBOL_DISCIPLINE_STANDARD_2026-06-07.md"
UNDATED_STANDARD = "docs/reference/agent_handoff/CVF_AGENT_HANDOFF_BOUNDARY_MACHINE_CHECK_STANDARD.md"


def _anchor_packet(base_argument: str, *, execution_anchor: str = "WORKER_MUST_CAPTURE_AT_START") -> str:
    return f"""# Work Order

Status: DISPATCH_READY

Dispatch base head: `{DISPATCH_SHA}`
dispatchBaseHead: `{DISPATCH_SHA}`
executionBaseHead: {execution_anchor}
closureBaseHead: REVIEWER_TO_SET

## Verification Commands

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base {base_argument} --head HEAD
```
"""


# --- Control 1: execution-anchor substitution -------------------------------


def test_worker_capture_with_angle_execution_anchor_passes() -> None:
    issues = MODULE._validate_execution_anchor_substitution(_anchor_packet("<executionBaseHead>"))

    assert issues == []


def test_worker_capture_with_shell_execution_anchor_passes() -> None:
    issues = MODULE._validate_execution_anchor_substitution(_anchor_packet("$executionBaseHead"))

    assert issues == []


def test_worker_capture_with_dispatch_sha_fails() -> None:
    issues = MODULE._validate_execution_anchor_substitution(_anchor_packet(DISPATCH_SHA))

    assert len(issues) == 1
    assert "dispatch anchor" in issues[0]


def test_worker_capture_with_symbolic_dispatch_anchor_fails() -> None:
    issues = MODULE._validate_execution_anchor_substitution(_anchor_packet("dispatchBaseHead"))

    assert len(issues) == 1


def test_worker_capture_with_angle_dispatch_anchor_fails() -> None:
    issues = MODULE._validate_execution_anchor_substitution(_anchor_packet("<dispatchBaseHead>"))

    assert len(issues) == 1


def test_packet_without_worker_capture_anchor_is_unaffected() -> None:
    """A packet that pins a real execution anchor is outside this control."""
    text = _anchor_packet(DISPATCH_SHA, execution_anchor=f"`{DISPATCH_SHA}`")

    assert MODULE._validate_execution_anchor_substitution(text) == []


def test_dispatch_anchor_in_explanatory_prose_is_ignored() -> None:
    """Boundary case: only the real Verification Commands section is scanned."""
    text = f"""# Work Order

Status: DISPATCH_READY

Dispatch base head: `{DISPATCH_SHA}`
executionBaseHead: WORKER_MUST_CAPTURE_AT_START

## Forbidden Scope

Never write `run_agent_autorun_workflow_gate.py --phase pre-implementation
--base {DISPATCH_SHA} --head HEAD`; that reuses the dispatch anchor.

## Verification Commands

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base <executionBaseHead> --head HEAD
```
"""

    assert MODULE._validate_execution_anchor_substitution(text) == []


def test_preclosure_command_is_not_scanned_by_anchor_control() -> None:
    """Pre-closure validation stays owned by the existing range validator."""
    text = f"""# Work Order

Status: DISPATCH_READY

Dispatch base head: `{DISPATCH_SHA}`
executionBaseHead: WORKER_MUST_CAPTURE_AT_START

## Verification Commands

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-closure --base {DISPATCH_SHA} --head HEAD
```
"""

    assert MODULE._validate_execution_anchor_substitution(text) == []


# --- Control 3: dated-owner dependency discovery ----------------------------


def _owner_packet(discovery_section: str, *, owned: str = DATED_STANDARD) -> str:
    return f"""# Work Order

Status: DISPATCH_READY

## Write Ownership

Modify exactly:

1. `{owned}`

{discovery_section}
"""


def _discovery(rows: str) -> str:
    return f"""## Dated Owner Dependency Discovery

| Owned dated reference path | Classification | Registry evidence | Disposition |
|---|---|---|---|
{rows}
"""


def test_dated_binding_owner_registered_in_registry_passes() -> None:
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |"
        )
    )

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({DATED_STANDARD}, "")
    ):
        assert MODULE._validate_dated_owner_dependency_discovery(text) == []


def test_dated_binding_owner_absent_from_registry_fails() -> None:
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |"
        )
    )

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({OTHER_DATED_STANDARD}, "")
    ):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "is not an" in issues[0]


def test_dated_non_binding_owner_with_reason_passes() -> None:
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON: active standard "
            "is not a permanent active-window member` | registry read | ACCEPT |"
        )
    )

    with patch.object(MODULE, "_load_active_window_active_paths", return_value=(set(), "")):
        assert MODULE._validate_dated_owner_dependency_discovery(text) == []


def test_dated_non_binding_owner_with_empty_reason_fails() -> None:
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON:` | registry read | ACCEPT |"
        )
    )

    with patch.object(MODULE, "_load_active_window_active_paths", return_value=(set(), "")):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "empty reason" in issues[0]


def test_dated_owner_omitted_from_discovery_table_fails() -> None:
    text = _owner_packet(
        _discovery(
            f"| `{OTHER_DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON: unrelated` "
            "| registry read | ACCEPT |"
        )
    )

    with patch.object(MODULE, "_load_active_window_active_paths", return_value=(set(), "")):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "omits owned dated reference" in issues[0]


def test_dated_owner_without_any_discovery_table_fails() -> None:
    text = _owner_packet("")

    with patch.object(MODULE, "_load_active_window_active_paths", return_value=(set(), "")):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "lacks a" in issues[0]


def test_duplicate_contradictory_classification_fails() -> None:
    """Two rows for one owned path fail on the exactly-one-row rule, which is
    stricter than and precedes the contradictory-classification rule."""
    rows = (
        f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |\n"
        f"| `{DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON: contradictory` "
        "| registry read | ACCEPT |"
    )
    text = _owner_packet(_discovery(rows))

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({DATED_STANDARD}, "")
    ):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "2 rows" in issues[0]


def test_single_row_with_contradictory_classifications_fails() -> None:
    """One row that claims both classifications is still non-contradictory-checked."""
    rows = (
        f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` and "
        "`NOT_BINDING_REFERENCE_WITH_REASON: contradictory` | registry read | ACCEPT |"
    )
    text = _owner_packet(_discovery(rows))

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({DATED_STANDARD}, "")
    ):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "both" in issues[0]


def test_malformed_registry_fails_closed_for_binding_claim() -> None:
    """Boundary case: an unverifiable binding claim must not silently pass."""
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |"
        )
    )

    with patch.object(
        MODULE,
        "_load_active_window_active_paths",
        return_value=(set(), "`governance/compat/CVF_ACTIVE_WINDOW_REGISTRY.json` is not valid JSON"),
    ):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "cannot be verified" in issues[0]


def test_ordinary_non_dated_reference_ownership_is_unchanged() -> None:
    """Boundary case: an undated reference owner needs no discovery table."""
    text = _owner_packet("", owned=UNDATED_STANDARD)

    with patch.object(MODULE, "_load_active_window_active_paths", return_value=(set(), "")):
        assert MODULE._validate_dated_owner_dependency_discovery(text) == []


def test_multiple_dated_paths_reconcile_exactly_once() -> None:
    """Boundary case: two dated owners produce one row each, no duplicates."""
    rows = (
        f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |\n"
        f"| `{OTHER_DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON: dated pointer` "
        "| registry read | ACCEPT |"
    )
    discovery_section = _discovery(rows)
    text = f"""# Work Order

Status: DISPATCH_READY

## Write Ownership

1. `{DATED_STANDARD}`
2. `{OTHER_DATED_STANDARD}`

## Required Artifact Manifest

| Artifact | Required worker action |
|---|---|
| `{DATED_STANDARD}` | MODIFY |
| `{OTHER_DATED_STANDARD}` | MODIFY |

{discovery_section}
"""

    assert MODULE._owned_dated_reference_paths(text) == [DATED_STANDARD, OTHER_DATED_STANDARD]

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({DATED_STANDARD}, "")
    ):
        assert MODULE._validate_dated_owner_dependency_discovery(text) == []


def test_registry_loader_reports_error_for_invalid_json() -> None:
    with patch.object(MODULE, "_read_rel", return_value="{not json"):
        active_paths, error = MODULE._load_active_window_active_paths()

    assert active_paths == set()
    assert "not valid JSON" in error


def test_registry_loader_reports_error_for_missing_windows_list() -> None:
    with patch.object(MODULE, "_read_rel", return_value='{"other": []}'):
        active_paths, error = MODULE._load_active_window_active_paths()

    assert active_paths == set()
    assert "no `windows` list" in error


def test_registry_loader_reads_real_registry() -> None:
    """The shipped registry must parse so binding claims stay verifiable."""
    active_paths, error = MODULE._load_active_window_active_paths()

    assert error == ""
    assert active_paths


# --- Integration through the dispatch-quality entrypoint --------------------


def test_anchor_and_dated_owner_controls_run_from_commit_mode_validator() -> None:
    """Both controls must be reachable from the validator the range module
    already invokes for dispatch-ready work orders."""
    text = f"""# Work Order

Status: DISPATCH_READY

Commit mode: WORKER_MUST_NOT_COMMIT
Dispatch base head: `{DISPATCH_SHA}`
dispatchBaseHead: `{DISPATCH_SHA}`
executionBaseHead: WORKER_MUST_CAPTURE_AT_START
closureBaseHead: REVIEWER_TO_SET

## Write Ownership

1. `{DATED_STANDARD}`

## Verification Commands

```powershell
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base {DISPATCH_SHA} --head HEAD
```
"""

    issues = MODULE._validate_commit_mode_and_anchor_lifecycle(text)

    assert any("dispatch anchor" in issue for issue in issues)
    assert any("Dated Owner Dependency Discovery" in issue for issue in issues)


# --- Rework generation 1: allowed-scope coverage (reviewer finding 1) -------


def _scope_packet(heading: str, owned: str = DATED_STANDARD) -> str:
    return f"""# Work Order

Status: DISPATCH_READY

## {heading}

Worker owns `{owned}`.
"""


def test_dated_owner_only_in_allowed_scope_is_detected() -> None:
    assert MODULE._owned_dated_reference_paths(_scope_packet("Allowed Scope")) == [DATED_STANDARD]


def test_dated_owner_only_in_scope_target_owner_boundary_is_detected() -> None:
    text = _scope_packet("Scope / Target / Owner Boundary")

    assert MODULE._owned_dated_reference_paths(text) == [DATED_STANDARD]


def test_required_first_reads_alone_does_not_create_write_ownership() -> None:
    """Reading a dated owner is not owning it."""
    text = _scope_packet("Required First Reads")

    assert MODULE._owned_dated_reference_paths(text) == []


def test_same_path_across_owned_sections_is_deduplicated_once() -> None:
    text = f"""# Work Order

Status: DISPATCH_READY

## Write Ownership

1. `{DATED_STANDARD}`

## Allowed Scope

Also `{DATED_STANDARD}`.

## Scope / Target / Owner Boundary

Again `{DATED_STANDARD}`.
"""

    assert MODULE._owned_dated_reference_paths(text) == [DATED_STANDARD]


def test_allowed_scope_and_scope_boundary_headings_stay_distinct() -> None:
    """Heading match is exact, so one heading does not swallow the other."""
    text = f"""# Work Order

Status: DISPATCH_READY

## Allowed Scope

Owns `{DATED_STANDARD}`.

## Scope / Target / Owner Boundary

Owns `{OTHER_DATED_STANDARD}`.
"""

    assert MODULE._owned_dated_reference_paths(text) == [DATED_STANDARD, OTHER_DATED_STANDARD]


# --- Rework generation 1: exactly one discovery row (reviewer finding 2) ----


def test_duplicate_identical_binding_rows_fail() -> None:
    rows = (
        f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |\n"
        f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |"
    )
    text = _owner_packet(_discovery(rows))

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({DATED_STANDARD}, "")
    ):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "2 rows" in issues[0]


def test_duplicate_identical_non_binding_rows_fail() -> None:
    rows = (
        f"| `{DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON: dated pointer` | read | ACCEPT |\n"
        f"| `{DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON: dated pointer` | read | ACCEPT |"
    )
    text = _owner_packet(_discovery(rows))

    with patch.object(MODULE, "_load_active_window_active_paths", return_value=(set(), "")):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "2 rows" in issues[0]


def test_exactly_one_discovery_row_passes() -> None:
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |"
        )
    )

    with patch.object(
        MODULE, "_load_active_window_active_paths", return_value=({DATED_STANDARD}, "")
    ):
        assert MODULE._validate_dated_owner_dependency_discovery(text) == []


# --- Rework generation 1: fail-closed registry schema (reviewer finding 3) --


def test_registry_with_valid_plus_non_object_entry_fails_closed() -> None:
    payload = '{"windows": [{"activePath": "docs/reference/a_2026-01-01.md"}, "not-an-object"]}'

    with patch.object(MODULE, "_read_rel", return_value=payload):
        active_paths, error = MODULE._load_active_window_active_paths()

    assert active_paths == set()
    assert "is not an object" in error


def test_registry_with_valid_plus_missing_active_path_fails_closed() -> None:
    payload = '{"windows": [{"activePath": "docs/reference/a_2026-01-01.md"}, {"other": 1}]}'

    with patch.object(MODULE, "_read_rel", return_value=payload):
        active_paths, error = MODULE._load_active_window_active_paths()

    assert active_paths == set()
    assert "lacks `activePath`" in error


def test_registry_with_valid_plus_empty_active_path_fails_closed() -> None:
    payload = '{"windows": [{"activePath": "docs/reference/a_2026-01-01.md"}, {"activePath": "   "}]}'

    with patch.object(MODULE, "_read_rel", return_value=payload):
        active_paths, error = MODULE._load_active_window_active_paths()

    assert active_paths == set()
    assert "non-string or empty" in error


def test_registry_with_valid_plus_non_string_active_path_fails_closed() -> None:
    payload = '{"windows": [{"activePath": "docs/reference/a_2026-01-01.md"}, {"activePath": 5}]}'

    with patch.object(MODULE, "_read_rel", return_value=payload):
        active_paths, error = MODULE._load_active_window_active_paths()

    assert active_paths == set()
    assert "non-string or empty" in error


def test_binding_claim_fails_when_registry_has_any_malformed_entry() -> None:
    """A single valid row must not certify a binding claim on its own."""
    payload = f'{{"windows": [{{"activePath": "{DATED_STANDARD}"}}, {{"other": 1}}]}}'
    text = _owner_packet(
        _discovery(
            f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | registry read | ACCEPT |"
        )
    )

    with patch.object(MODULE, "_read_rel", return_value=payload):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "cannot be verified" in issues[0]


# --- Rework generation 1: commented command boundary (optional correction) --


def test_commented_out_pre_implementation_command_is_ignored() -> None:
    """Only executable commands are rejected; a commented example is not one."""
    text = f"""# Work Order

Status: DISPATCH_READY

Dispatch base head: `{DISPATCH_SHA}`
executionBaseHead: WORKER_MUST_CAPTURE_AT_START

## Verification Commands

```powershell
# python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base {DISPATCH_SHA} --head HEAD
python governance/compat/run_agent_autorun_workflow_gate.py --phase pre-implementation --base <executionBaseHead> --head HEAD
```
"""

    assert MODULE._validate_execution_anchor_substitution(text) == []


def test_uncommented_dispatch_anchor_command_still_fails() -> None:
    """The comment carve-out must not weaken the live control."""
    assert len(MODULE._validate_execution_anchor_substitution(_anchor_packet(DISPATCH_SHA))) == 1


# --- Rework generation 2: registry integrity for every classification ------

_MALFORMED_REGISTRY = '{"windows": [{"activePath": "docs/reference/a_2026-01-01.md"}, "bad"]}'


def _non_binding_row(path: str) -> str:
    return f"| `{path}` | `NOT_BINDING_REFERENCE_WITH_REASON: dated pointer` | read | ACCEPT |"


def _multi_owner_packet(rows: str) -> str:
    return f"""# Work Order

Status: DISPATCH_READY

## Write Ownership

1. `{DATED_STANDARD}`
2. `{OTHER_DATED_STANDARD}`

{_discovery(rows)}
"""


def test_malformed_registry_fails_even_when_owner_is_non_binding() -> None:
    """Reviewer finding R2-1: registry integrity is not a binding-only concern."""
    text = _owner_packet(_discovery(_non_binding_row(DATED_STANDARD)))

    with patch.object(MODULE, "_read_rel", return_value=_MALFORMED_REGISTRY):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "cannot be verified" in issues[0]


def test_empty_registry_fails_when_all_owners_are_non_binding() -> None:
    text = _owner_packet(_discovery(_non_binding_row(DATED_STANDARD)))

    with patch.object(MODULE, "_read_rel", return_value=""):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "cannot be verified" in issues[0]


def test_valid_registry_with_non_binding_owner_passes() -> None:
    payload = '{"windows": [{"activePath": "docs/reference/a_2026-01-01.md"}]}'
    text = _owner_packet(_discovery(_non_binding_row(DATED_STANDARD)))

    with patch.object(MODULE, "_read_rel", return_value=payload):
        assert MODULE._validate_dated_owner_dependency_discovery(text) == []


def test_malformed_registry_reports_one_deterministic_violation_for_many_owners() -> None:
    """One packet-level registry-integrity violation, not one per owner."""
    rows = _non_binding_row(DATED_STANDARD) + "\n" + _non_binding_row(OTHER_DATED_STANDARD)
    text = _multi_owner_packet(rows)

    with patch.object(MODULE, "_read_rel", return_value=_MALFORMED_REGISTRY):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "cannot be verified" in issues[0]


def test_malformed_registry_is_not_repeated_for_mixed_classifications() -> None:
    rows = (
        f"| `{DATED_STANDARD}` | `BINDING_REFERENCE_ACTIVE_WINDOW` | read | ACCEPT |\n"
        + _non_binding_row(OTHER_DATED_STANDARD)
    )
    text = _multi_owner_packet(rows)

    with patch.object(MODULE, "_read_rel", return_value=_MALFORMED_REGISTRY):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1


def test_row_specific_checks_stay_useful_with_valid_registry() -> None:
    """Registry integrity does not mask per-row defects."""
    payload = f'{{"windows": [{{"activePath": "{DATED_STANDARD}"}}]}}'
    rows = f"| `{DATED_STANDARD}` | `NOT_BINDING_REFERENCE_WITH_REASON:` | read | ACCEPT |"
    text = _owner_packet(_discovery(rows))

    with patch.object(MODULE, "_read_rel", return_value=payload):
        issues = MODULE._validate_dated_owner_dependency_discovery(text)

    assert len(issues) == 1
    assert "empty reason" in issues[0]
