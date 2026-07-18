import importlib.util
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().with_name("check_multi_provider_execution_log.py")
SPEC = importlib.util.spec_from_file_location("check_multi_provider_execution_log", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


VALID_LOG = """
# CVF Multi-Provider Execution Log - Test

Memory class: POINTER_RECORD

Status: session execution log

## Purpose

Test log.

## Scope

Test scope.

## Target And Source

Target and source.

## Execution Surface Summary

| Lane | Provider/model | Operator-reported tool surface | Role | Evidence basis | Boundary |
|---|---|---|---|---|---|
| A | Claude Sonnet | VS_CODE_EXTENSION_CLAUDE_CODE | reviewer | OPERATOR_REPORTED + GIT_VERIFIED | bounded |
| B | DeepSeek | DIRECT_PROVIDER_SCRIPT | method proof | TEST_VERIFIED | provider method capability proof only; not governed CVF route proof |

## Execution Attribution Block

| Artifact or range | Roadmap/order author | Worker/executor | Reviewer/closer | Provider/model | Execution surface | Evidence basis | Attribution boundary |
|---|---|---|---|---|---|---|---|
| Test range | Claude lane | DeepSeek lane | Codex lane | Claude Sonnet / DeepSeek | VS_CODE_EXTENSION_CLAUDE_CODE / DIRECT_PROVIDER_SCRIPT | OPERATOR_REPORTED + GIT_VERIFIED | Mixed attribution; provider method capability proof only; not governed CVF route proof |

## Commit Evidence

Commit evidence.

## Quality Findings

Hook PASS does not prove quality.

## Cost And ROI Boundary

Cost unknown; token ledger unavailable.

## Claim Boundary

CLOSED_PASS and hook PASS do not prove production readiness.
"""


def _messages(issues: list[dict[str, str]]) -> list[str]:
    return [issue["message"] for issue in issues]


def test_valid_session_log_passes() -> None:
    assert MODULE._validate_session_log("docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_TEST.md", VALID_LOG) == []


def test_missing_tool_surface_fails() -> None:
    invalid = VALID_LOG.replace("Operator-reported tool surface", "Invocation")
    issues = MODULE._validate_session_log("docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_TEST.md", invalid)
    assert any("tool surface" in message for message in _messages(issues))


def test_direct_provider_without_method_boundary_fails() -> None:
    invalid = VALID_LOG.replace("provider method capability proof only; not governed CVF route proof", "governance proof")
    issues = MODULE._validate_session_log("docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_TEST.md", invalid)
    assert any("provider method capability proof" in message for message in _messages(issues))


def test_missing_execution_attribution_block_fails() -> None:
    invalid = VALID_LOG.replace("## Execution Attribution Block", "## Attribution")
    issues = MODULE._validate_session_log("docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_TEST.md", invalid)
    assert any("Execution Attribution Block" in message for message in _messages(issues))


def test_missing_worker_attribution_header_fails() -> None:
    invalid = VALID_LOG.replace("Worker/executor", "Executor")
    issues = MODULE._validate_session_log("docs/logs/CVF_MULTI_PROVIDER_EXECUTION_LOG_TEST.md", invalid)
    assert any("Worker/executor" in message for message in _messages(issues))


def test_standard_requires_guard_binding() -> None:
    text = """
Status: canonical execution-log standard
## Authorized Execution Surface Values
## Required Session Log Fields
## Execution Attribution Block
## PASS And Quality Boundary
## Direct Provider Proof Rule
## Cost And Quality Attribution Rule
## Finding-To-Rule Disposition
## Violation Conditions
"""
    issues = MODULE._validate_standard(MODULE.STANDARD_PATH, text)
    assert any(MODULE.THIS_SCRIPT_PATH in message for message in _messages(issues))
