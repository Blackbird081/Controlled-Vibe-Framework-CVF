"""Focused fail-closed regression tests for the public projection pre-push
gate (CLI orchestration, policy/Git validation, sandbox lifecycle,
dependency isolation, and evidence extraction) using temporary throwaway
Git fixtures only; the real public-sync clone is never used as a mutable
test fixture. External-command tests use `sys.executable` as the
configured command with small inline `-c` scripts that deterministically
succeed, exit nonzero, or sleep past a tight timeout, proving the runner
actually launches and waits on a real child process (D-02)."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

from governance.compat import run_public_projection_pre_push_gate as gate


REMOTE_URL = "https://example.invalid/public/repo.git"
BRANCH = "public-main"

BASE_CHECK_DECLARATIONS = [
    {"id": "public_root_containment", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "remote_url_match", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "branch_match", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "clean_worktree", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "head_match", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "non_empty_range", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "exact_manifest_match", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"},
    {"id": "governed_file_size", "ownerApplicability": "PUBLIC_OWNED", "family": "governed_file_size", "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE"},
    {"id": "governed_python_automation_size", "ownerApplicability": "PUBLIC_OWNED", "family": "governed_python_automation_size", "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE"},
    {"id": "guard_registry_compatibility", "ownerApplicability": "PUBLIC_OWNED", "family": "guard_registry_compatibility", "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE"},
    {"id": "pre_public_p3_readiness", "ownerApplicability": "PUBLIC_OWNED", "family": "pre_public_p3_readiness", "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE"},
]

INHERITED_DEBT_FAMILIES = {
    "governed_file_size": {
        "subjectPath": "docs/EXPORT_MANIFEST.md",
        "checkClass": "active_markdown",
        "hardThresholdLines": 1200,
        "pinnedLineCount": 1903,
        "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE",
    },
    "governed_python_automation_size": {
        "subjectPath": "scripts/score_qbs_model_assisted_reviewers.py",
        "checkClass": "python_cli_orchestrator",
        "hardThresholdLines": 800,
        "pinnedLineCount": 879,
        "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE",
    },
    "guard_registry_compatibility": {
        "subjectPaths": ["README.md", "docs/CVF_CORE_KNOWLEDGE_BASE.md"],
        "pinnedMissingGuardRegistrationRow": True,
        "requiredMarker": "CVF_PUBLIC_PROJECTION_PRE_PUSH_GATE",
        "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE",
    },
    "pre_public_p3_readiness": {
        "subjectPaths": [
            "CODEOWNERS", "CONTRIBUTING.md", "COST_AND_QUOTA.md",
            "GOVERNANCE.md", "PROVENANCE.md", "PROVIDERS.md",
        ],
        "pinnedMissingExposureClassificationReference": True,
        "disposition": "REPORT_IF_UNCHANGED_ELSE_GATE",
    },
}


def _git(root: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args],
        cwd=root,
        text=True,
        capture_output=True,
        check=True,
    )


def _init_repo(root: Path) -> None:
    root.mkdir(parents=True, exist_ok=True)
    _git(root, "init", "-q", "-b", BRANCH)
    _git(root, "config", "user.email", "test@example.invalid")
    _git(root, "config", "user.name", "Test Runner")
    _git(root, "remote", "add", "origin", REMOTE_URL)


def _write(root: Path, rel_path: str, content: str) -> None:
    full = root / rel_path
    full.parent.mkdir(parents=True, exist_ok=True)
    full.write_text(content, encoding="utf-8")


def _commit(root: Path, message: str) -> str:
    _git(root, "add", "-A")
    _git(root, "commit", "-q", "-m", message)
    return _git(root, "rev-parse", "HEAD").stdout.strip()


def _base_policy(base_head: str, head_head: str, manifest: list[str], checks: list[dict], commands: list[dict] | None = None) -> dict:
    return {
        "schemaVersion": "1.0.0",
        "policyId": "TEST_POLICY",
        "owner": {"role": "Public Projection Release Steward"},
        "expectedRemoteUrl": REMOTE_URL,
        "expectedBranch": BRANCH,
        "pinnedBaseHead": base_head,
        "authorizedCandidateHead": head_head,
        "candidateManifest": manifest,
        "inheritedDebtFamilies": INHERITED_DEBT_FAMILIES,
        "checks": checks,
        "externalCommands": {"commands": commands or []},
        "subprocessTimeoutSeconds": 30,
        "claimBoundary": "test fixture policy",
    }


def _write_policy(tmp_path: Path, policy: dict) -> Path:
    policy_path = tmp_path / "policy.json"
    policy_path.write_text(json.dumps(policy), encoding="utf-8")
    return policy_path


def _build_fixture(tmp_path: Path, commands: list[dict] | None = None) -> tuple[Path, str, str, Path]:
    """Base commit, one export-manifest-sized file, one script, then a head commit that changes exactly the files named in a manifest."""
    root = tmp_path / "public_fixture"
    _init_repo(root)

    _write(root, "docs/EXPORT_MANIFEST.md", "line\n" * 1903)
    _write(root, "scripts/score_qbs_model_assisted_reviewers.py", "# line\n" * 879)
    _write(root, "README.md", "# Public repo\n")
    for name in ("CODEOWNERS", "CONTRIBUTING.md", "COST_AND_QUOTA.md", "GOVERNANCE.md", "PROVENANCE.md", "PROVIDERS.md"):
        _write(root, name, f"{name} placeholder\n")
    _write(root, "docs/CVF_CORE_KNOWLEDGE_BASE.md", "# Knowledge base\n")
    base_head = _commit(root, "base commit")

    _write(root, "src/feature.ts", "export const x = 1;\n")
    head_head = _commit(root, "head commit")

    manifest = ["src/feature.ts"]
    checks = list(BASE_CHECK_DECLARATIONS)
    for cmd in commands or []:
        checks.append(
            {
                "id": f"{gate.EXTERNAL_COMMAND_PREFIX}{cmd['id']}",
                "ownerApplicability": "PUBLIC_OWNED",
                "family": "AD_HOC_GATE",
                "disposition": "GATE",
            }
        )

    policy = _base_policy(base_head, head_head, manifest, checks, commands)
    policy_path = _write_policy(tmp_path, policy)
    return root, base_head, head_head, policy_path


def _py_command(command_id: str, code: str, timeout_seconds: int = 30) -> dict:
    return {
        "id": command_id,
        "workingDirectory": ".",
        "argv": [sys.executable, "-c", code],
        "timeoutSeconds": timeout_seconds,
    }


# ---------------------------------------------------------------------------
# Positive case
# ---------------------------------------------------------------------------

def test_positive_pinned_inherited_debt_reports_without_gating(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is True
    assert report["gateFailureCount"] == 0
    assert set(report["inheritedDebtReported"]) == {
        "governed_file_size",
        "governed_python_automation_size",
        "guard_registry_compatibility",
        "pre_public_p3_readiness",
    }


def test_cli_help_exits_zero() -> None:
    proc = subprocess.run(
        ["python", "governance/compat/run_public_projection_pre_push_gate.py", "--help"],
        cwd=gate.REPO_ROOT,
        text=True,
        capture_output=True,
    )
    assert proc.returncode == 0
    assert "--public-root" in proc.stdout


# ---------------------------------------------------------------------------
# D-01: policy pin enforcement
# ---------------------------------------------------------------------------

def test_wrong_cli_base_fails_because_of_pin_mismatch_not_git(tmp_path: Path) -> None:
    """A --base differing from pinnedBaseHead but otherwise a valid commit
    must fail on the pin check specifically, before any Git inspection."""
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    _write(root, "src/another.ts", "export const y = 1;\n")
    other_valid_commit = _commit(root, "an unrelated but perfectly valid commit")

    with pytest.raises(gate.GateFailClosed, match="does not match policy pinnedBaseHead"):
        gate.run_gate(str(root), other_valid_commit, head_head, policy_path, timeout=30)


def test_wrong_cli_head_fails_because_of_pin_mismatch_not_git(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    _write(root, "src/another.ts", "export const y = 1;\n")
    other_valid_commit = _commit(root, "an unrelated but perfectly valid commit")

    with pytest.raises(gate.GateFailClosed, match="does not match policy authorizedCandidateHead"):
        gate.run_gate(str(root), base_head, other_valid_commit, policy_path, timeout=30)


def test_adversarial_zeroed_pins_with_correct_cli_values_fail_closed(tmp_path: Path) -> None:
    """Policy pins corrupted to 000...0 / fff...f while the CLI is given the
    real, correct base/head must never return compliant=true."""
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["pinnedBaseHead"] = "0" * 40
    policy["authorizedCandidateHead"] = "f" * 40
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="does not match policy pinnedBaseHead"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_malformed_pin_type_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["pinnedBaseHead"] = 12345  # not a string
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="not a valid commit SHA"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_non_hex_pin_format_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["authorizedCandidateHead"] = "not-a-commit-sha-at-all"
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="not a valid commit SHA"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


# ---------------------------------------------------------------------------
# D-02: external commands are actually executed
# ---------------------------------------------------------------------------

def test_external_command_success_actually_executes_and_passes(tmp_path: Path) -> None:
    marker = tmp_path / "external_command_ran.marker"
    code = f"open(r'{marker}', 'w').write('ran')"
    root, base_head, head_head, policy_path = _build_fixture(
        tmp_path, commands=[_py_command("proof_of_execution", code)]
    )
    assert not marker.exists()
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert marker.exists(), "external command must actually be launched, not merely resolved"
    assert marker.read_text(encoding="utf-8") == "ran"
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}proof_of_execution")
    assert ext_result["outcome"] == "PASS"
    assert report["compliant"] is True


def test_external_command_missing_executable_gates(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["externalCommands"]["commands"] = [
        {
            "id": "nonexistent_tool",
            "workingDirectory": ".",
            "argv": ["node_modules/.bin/cvf-tool-that-does-not-exist-anywhere.cmd", "--version"],
            "timeoutSeconds": 10,
        }
    ]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}nonexistent_tool", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}nonexistent_tool" in report["gateFailures"]


def test_external_command_actual_nonzero_exit_gates(tmp_path: Path) -> None:
    """The command genuinely launches and exits 7; this must not be
    conflated with, or substituted by, a Git subprocess failure."""
    root, base_head, head_head, policy_path = _build_fixture(
        tmp_path, commands=[_py_command("nonzero_exit_tool", "import sys; sys.exit(7)")]
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}nonzero_exit_tool" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}nonzero_exit_tool")
    assert ext_result["evidence"]["exitStatus"] == 7


def test_external_command_actual_timeout_gates(tmp_path: Path) -> None:
    """The command genuinely sleeps past a 1-second timeout; this must not
    be conflated with, or substituted by, a Git subprocess timeout."""
    root, base_head, head_head, policy_path = _build_fixture(
        tmp_path,
        commands=[_py_command("slow_tool", "import time; time.sleep(30)", timeout_seconds=1)],
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}slow_tool" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}slow_tool")
    assert ext_result["evidence"]["timeoutDisposition"] == "GATE"


def test_external_command_output_is_secret_safe_and_bounded(tmp_path: Path) -> None:
    huge_secret_like_output = "SECRET_TOKEN=" + ("x" * 5000)
    code = f"import sys; print({huge_secret_like_output!r}); sys.exit(3)"
    root, base_head, head_head, policy_path = _build_fixture(
        tmp_path, commands=[_py_command("noisy_tool", code)]
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}noisy_tool")
    stdout_tail = ext_result["evidence"]["stdoutTail"]
    assert len(stdout_tail) <= gate.MAX_CAPTURED_OUTPUT_CHARS + 100
    assert "truncated" in stdout_tail


def test_external_command_working_directory_escape_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["externalCommands"]["commands"] = [
        {
            "id": "escaping_tool",
            "workingDirectory": "../../../",
            "argv": [sys.executable, "-c", "pass"],
            "timeoutSeconds": 10,
        }
    ]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}escaping_tool", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="escapes the public root"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_duplicate_external_command_id_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    dup_cmd = _py_command("dup_tool", "pass")
    policy["externalCommands"]["commands"] = [dup_cmd, dict(dup_cmd)]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}dup_tool", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="duplicate external command id"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


# ---------------------------------------------------------------------------
# D-04: policy check registry controls actual coverage
# ---------------------------------------------------------------------------

def test_missing_classification_for_configured_external_command_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    # Configure a command but do NOT add its classification to policy["checks"].
    policy["externalCommands"]["commands"] = [_py_command("unclassified_tool", "pass")]
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="missing a classification entry"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_duplicate_check_id_in_policy_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["checks"].append(dict(policy["checks"][0]))  # duplicate first id
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="duplicate id"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_declared_check_never_executed_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    # Declares a check id the runner has no built-in or external-command
    # execution path for; nothing will ever produce this id at runtime.
    policy["checks"].append(
        {"id": "phantom_check_never_run", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="never executed"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_unknown_classification_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["checks"].append(
        {"id": "mystery_check", "ownerApplicability": "SOMETHING_UNKNOWN", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")
    with pytest.raises(gate.GateFailClosed):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


# ---------------------------------------------------------------------------
# Root/remote/branch/head/manifest/timeout/command-failure fail-closed cases
# ---------------------------------------------------------------------------

def test_wrong_public_root_fails_closed(tmp_path: Path) -> None:
    _, base_head, head_head, policy_path = _build_fixture(tmp_path)
    missing_root = tmp_path / "does_not_exist"
    with pytest.raises(gate.GateFailClosed):
        gate.run_gate(str(missing_root), base_head, head_head, policy_path, timeout=30)


def test_wrong_remote_gates(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    _git(root, "remote", "set-url", "origin", "https://example.invalid/other/repo.git")
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "remote_url_match" in report["gateFailures"]


def test_wrong_branch_gates(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    _git(root, "checkout", "-q", "-b", "not-the-expected-branch")
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "branch_match" in report["gateFailures"]


def test_dirty_tree_gates(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    _write(root, "src/feature.ts", "export const x = 2; // dirty\n")
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "clean_worktree" in report["gateFailures"]


def test_manifest_drift_extra_path_gates(tmp_path: Path) -> None:
    """Head still matches the pin; the manifest drifts because the fixture's committed manifest list is narrower than what the pinned head changed."""
    root = tmp_path / "public_fixture"
    _init_repo(root)
    _write(root, "docs/EXPORT_MANIFEST.md", "line\n" * 1903)
    _write(root, "scripts/score_qbs_model_assisted_reviewers.py", "# line\n" * 879)
    _write(root, "README.md", "# Public repo\n")
    for name in ("CODEOWNERS", "CONTRIBUTING.md", "COST_AND_QUOTA.md", "GOVERNANCE.md", "PROVENANCE.md", "PROVIDERS.md"):
        _write(root, name, f"{name} placeholder\n")
    _write(root, "docs/CVF_CORE_KNOWLEDGE_BASE.md", "# Knowledge base\n")
    base_head = _commit(root, "base commit")

    _write(root, "src/feature.ts", "export const x = 1;\n")
    _write(root, "src/unexpected-extra-file.ts", "export const z = 1;\n")
    head_head = _commit(root, "adds an unauthorized extra path alongside the expected one")

    # Manifest intentionally omits src/unexpected-extra-file.ts.
    policy = _base_policy(base_head, head_head, ["src/feature.ts"], list(BASE_CHECK_DECLARATIONS))
    policy_path = _write_policy(tmp_path, policy)

    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "exact_manifest_match" in report["gateFailures"]


def test_empty_range_gates(tmp_path: Path) -> None:
    root = tmp_path / "public_fixture"
    _init_repo(root)
    _write(root, "docs/EXPORT_MANIFEST.md", "line\n" * 1903)
    _write(root, "scripts/score_qbs_model_assisted_reviewers.py", "# line\n" * 879)
    _write(root, "README.md", "# Public repo\n")
    for name in ("CODEOWNERS", "CONTRIBUTING.md", "COST_AND_QUOTA.md", "GOVERNANCE.md", "PROVENANCE.md", "PROVIDERS.md"):
        _write(root, name, f"{name} placeholder\n")
    _write(root, "docs/CVF_CORE_KNOWLEDGE_BASE.md", "# Knowledge base\n")
    only_head = _commit(root, "only commit")

    # Policy pins base == head, so the range is legitimately empty while
    # both CLI values still match their pins.
    policy = _base_policy(only_head, only_head, [], list(BASE_CHECK_DECLARATIONS))
    policy_path = _write_policy(tmp_path, policy)

    report = gate.run_gate(str(root), only_head, only_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "non_empty_range" in report["gateFailures"]


def test_worsened_inherited_debt_gates(tmp_path: Path) -> None:
    root = tmp_path / "public_fixture"
    _init_repo(root)
    _write(root, "docs/EXPORT_MANIFEST.md", "line\n" * 1903)
    _write(root, "scripts/score_qbs_model_assisted_reviewers.py", "# line\n" * 879)
    _write(root, "README.md", "# Public repo\n")
    for name in ("CODEOWNERS", "CONTRIBUTING.md", "COST_AND_QUOTA.md", "GOVERNANCE.md", "PROVENANCE.md", "PROVIDERS.md"):
        _write(root, name, f"{name} placeholder\n")
    _write(root, "docs/CVF_CORE_KNOWLEDGE_BASE.md", "# Knowledge base\n")
    base_head = _commit(root, "base commit")

    _write(root, "docs/EXPORT_MANIFEST.md", "line\n" * 1950)
    new_head = _commit(root, "grows export manifest beyond pinned value")

    policy = _base_policy(base_head, new_head, ["docs/EXPORT_MANIFEST.md"], list(BASE_CHECK_DECLARATIONS))
    policy_path = _write_policy(tmp_path, policy)

    report = gate.run_gate(str(root), base_head, new_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "governed_file_size" in report["gateFailures"]


def test_missing_policy_file_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    missing_policy = tmp_path / "no_such_policy.json"
    with pytest.raises(gate.GateFailClosed):
        gate.run_gate(str(root), base_head, head_head, missing_policy, timeout=30)


def test_malformed_policy_json_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy_path.write_text("{ not valid json", encoding="utf-8")
    with pytest.raises(gate.GateFailClosed):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_non_git_public_root_fails_closed(tmp_path: Path) -> None:
    non_git_root = tmp_path / "not_a_git_repo"
    non_git_root.mkdir()
    _, base_head, head_head, policy_path = _build_fixture(tmp_path)
    with pytest.raises(gate.GateFailClosed):
        gate.run_gate(str(non_git_root), base_head, head_head, policy_path, timeout=30)


def test_git_command_failure_fails_closed(tmp_path: Path) -> None:
    """A genuinely invalid Git ref (matches neither pin format nor a real commit) must still fail closed via the Git-layer error path, distinct from a pin mismatch."""
    root, base_head, head_head, policy_path = _build_fixture(tmp_path)
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    fake_valid_looking_sha = "a" * 40
    policy["authorizedCandidateHead"] = fake_valid_looking_sha
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="does not resolve to a commit"):
        gate.run_gate(str(root), base_head, fake_valid_looking_sha, policy_path, timeout=30)



def test_no_circular_import_between_runner_and_helper() -> None:
    """The helper must not import the runner, and every relocated symbol the runner exposes must really originate there (bare-module-name import, matching how the runner itself imports the helper)."""
    import public_projection_pre_push_gate_lib as gate_lib_bare

    assert "run_public_projection_pre_push_gate" not in gate_lib_bare.__dict__
    for symbol in ("SandboxError", "CheckResult", "GateFailClosed"):
        assert getattr(gate, symbol) is getattr(gate_lib_bare, symbol)
    for symbol in ("_materialize_sandbox", "_isolate_dependencies", "_teardown_sandbox", "_extract_observed_counts"):
        assert getattr(gate, symbol).__module__ == "public_projection_pre_push_gate_lib"


# ---------------------------------------------------------------------------
# Amendment 1: sandbox lifecycle (materialization, hash verification,
# dependency isolation, invariant capture, teardown). Every test here uses a
# real Git fixture repo with an actual node-style package layout so the
# sandbox's git-archive extraction, junction creation, and subprocess
# execution are exercised for real - never mocked.
# ---------------------------------------------------------------------------

SANDBOX_CHECK_IDS = ("sandbox_materialization", "public_root_invariant_check", "sandbox_teardown")


def _sandboxed_py_command(command_id: str, code: str, working_directory: str = ".", timeout_seconds: int = 30) -> dict:
    return {
        "id": command_id,
        "sandboxed": True,
        "workingDirectory": working_directory,
        "argv": [sys.executable, "-c", code],
        "timeoutSeconds": timeout_seconds,
    }


def _build_sandbox_fixture(
    tmp_path: Path, commands: list[dict], sandbox_config_overrides: dict | None = None
) -> tuple[Path, str, str, Path]:
    """Fixture with a sibling package (`pkg-a`), a `next`-shaped full-copy entry, and a file-type hardlink entry, .gitignore'd post-base-commit to behave like real installed deps."""
    root = tmp_path / "public_fixture"
    _init_repo(root)

    _write(root, "docs/EXPORT_MANIFEST.md", "line\n" * 1903)
    _write(root, "scripts/score_qbs_model_assisted_reviewers.py", "# line\n" * 879)
    _write(root, "README.md", "# Public repo\n")
    for name in ("CODEOWNERS", "CONTRIBUTING.md", "COST_AND_QUOTA.md", "GOVERNANCE.md", "PROVENANCE.md", "PROVIDERS.md"):
        _write(root, name, f"{name} placeholder\n")
    _write(root, "docs/CVF_CORE_KNOWLEDGE_BASE.md", "# Knowledge base\n")

    _write(root, "EXTENSIONS/PKG_A/package.json", json.dumps({"name": "pkg-a", "version": "0.0.0"}))
    _write(root, "EXTENSIONS/PKG_A/src/index.ts", "export const a = 1;\n")

    _write(root, "APP/package.json", json.dumps({"name": "app", "version": "0.0.0"}))
    _write(root, "APP/node_modules/pkg-a/package.json", json.dumps({"name": "pkg-a", "version": "0.0.0"}))
    _write(root, "APP/node_modules/pkg-a/index.js", "module.exports = 1;\n")
    _write(root, ".gitignore", "APP/node_modules/next/\nAPP/node_modules/.package-lock.json\n")

    base_head = _commit(root, "base commit")

    _write(root, "APP/node_modules/next/package.json", json.dumps({"name": "next", "version": "0.0.0"}))
    _write(root, "APP/node_modules/next/index.js", "module.exports = 'next-fixture';\n")
    _write(root, "APP/node_modules/.package-lock.json", json.dumps({"lockfileVersion": 3}))

    _write(root, "src/feature.ts", "export const x = 1;\n")
    head_head = _commit(root, "head commit")

    manifest = ["src/feature.ts"]
    checks = list(BASE_CHECK_DECLARATIONS)
    for check_id in SANDBOX_CHECK_IDS:
        checks.append({"id": check_id, "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"})
    for cmd in commands:
        checks.append(
            {
                "id": f"{gate.EXTERNAL_COMMAND_PREFIX}{cmd['id']}",
                "ownerApplicability": "PUBLIC_OWNED",
                "family": "AD_HOC_GATE",
                "disposition": "GATE",
            }
        )

    policy = _base_policy(base_head, head_head, manifest, checks, commands)
    policy["sandboxConfig"] = {
        "sandboxedPackageDirectories": ["APP"],
        "siblingPackagesRequiringSandboxRedirect": ["pkg-a"],
        **(sandbox_config_overrides or {}),
    }
    policy_path = _write_policy(tmp_path, policy)
    return root, base_head, head_head, policy_path


def test_sandboxed_command_actually_executes_inside_sandbox_not_public_root(tmp_path: Path) -> None:
    """Marker file written relative to cwd must land under the sandbox temp
    dir, never the real fixture root - proof of real sandbox execution."""
    marker_name = "sandbox_execution_proof.txt"
    code = f"open(r'{marker_name}', 'w').write('ran-in-sandbox')"
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("proof_of_sandbox_execution", code, working_directory="APP")]
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)

    assert not (root / "APP" / marker_name).exists(), "marker must not land in the real fixture root"
    assert report["compliant"] is True
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}proof_of_sandbox_execution")
    assert ext_result["outcome"] == "PASS"
    assert ext_result["evidence"]["sandboxed"] is True


def test_sandbox_materialization_matches_pinned_head(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    materialization = next(c for c in report["checks"] if c["id"] == "sandbox_materialization")
    assert materialization["outcome"] == "PASS"


def test_sandbox_dependency_isolation_redirects_sibling_package(tmp_path: Path) -> None:
    """The sandboxed process must see the sandbox's own pkg-a source (sibling-redirect junction), not the fixture's real, non-redirected node_modules copy."""
    code = (
        "import pathlib;"
        "p = pathlib.Path('node_modules/pkg-a/src/index.ts');"
        "raise SystemExit(0 if p.exists() else 7)"
    )
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("check_redirect", code, working_directory="APP")]
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}check_redirect")
    assert ext_result["outcome"] == "PASS", ext_result["detail"]


def test_real_public_root_unchanged_after_sandboxed_run(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )
    before_status = _git(root, "status", "--porcelain", "--untracked-files=all").stdout
    before_head = _git(root, "rev-parse", "HEAD").stdout
    gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    after_status = _git(root, "status", "--porcelain", "--untracked-files=all").stdout
    after_head = _git(root, "rev-parse", "HEAD").stdout
    assert before_status == after_status
    assert before_head == after_head


def test_sandbox_cleaned_up_after_run(tmp_path: Path) -> None:
    import tempfile as _tempfile
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )
    before = set(Path(_tempfile.gettempdir()).glob("cvf-pp-sandbox-*"))
    gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    after = set(Path(_tempfile.gettempdir()).glob("cvf-pp-sandbox-*"))
    assert after == before, f"sandbox directories left behind: {after - before}"


def test_sandboxed_command_real_nonzero_exit_gates(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path,
        commands=[_sandboxed_py_command("nonzero_in_sandbox", "import sys; sys.exit(9)", working_directory="APP")],
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}nonzero_in_sandbox" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}nonzero_in_sandbox")
    assert ext_result["evidence"]["exitStatus"] == 9
    assert ext_result["evidence"]["sandboxed"] is True


def test_sandboxed_command_real_timeout_gates(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path,
        commands=[
            _sandboxed_py_command(
                "slow_in_sandbox", "import time; time.sleep(30)", working_directory="APP", timeout_seconds=1
            )
        ],
    )
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}slow_in_sandbox" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}slow_in_sandbox")
    assert ext_result["evidence"]["timeoutDisposition"] == "GATE"


def test_sandbox_source_manifest_mismatch_fails_closed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Corrupts sandbox content after extraction to prove hash verification
    itself fails closed, not merely that a later command happens to fail."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )

    real_materialize = gate._materialize_sandbox

    def _tampering_materialize(root_arg, head_arg, timeout_arg):
        sandbox_dir, support_dir = real_materialize(root_arg, head_arg, timeout_arg)
        (sandbox_dir / "src" / "feature.ts").write_text("export const x = 999;\n", encoding="utf-8")
        return sandbox_dir, support_dir

    monkeypatch.setattr(gate, "_materialize_sandbox", _tampering_materialize)

    with pytest.raises(gate.GateFailClosed, match="SANDBOX_MATERIALIZATION_MISMATCH"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_sandbox_source_path_missing_fails_closed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )

    real_materialize = gate._materialize_sandbox

    def _deleting_materialize(root_arg, head_arg, timeout_arg):
        sandbox_dir, support_dir = real_materialize(root_arg, head_arg, timeout_arg)
        (sandbox_dir / "src" / "feature.ts").unlink()
        return sandbox_dir, support_dir

    monkeypatch.setattr(gate, "_materialize_sandbox", _deleting_materialize)

    with pytest.raises(gate.GateFailClosed, match="SANDBOX_MATERIALIZATION_MISMATCH"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_sandbox_path_escape_fails_closed(tmp_path: Path) -> None:
    """A workingDirectory resolving outside the sandbox to a real existing directory (`..` traversal) must fail the container-escape check, distinct from the plain-nonexistent-path case."""
    import os as _os

    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])

    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        escape_rel = _os.path.relpath(str(root), str(sandbox_dir)).replace("\\", "/")
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)

    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    escaping_command = {
        "id": "escape_attempt",
        "sandboxed": True,
        "workingDirectory": escape_rel,
        "argv": [sys.executable, "-c", "pass"],
        "timeoutSeconds": 10,
    }
    policy["externalCommands"]["commands"] = [escaping_command]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}escape_attempt", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="escapes the sandbox"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_dependency_link_target_escape_fails_closed(tmp_path: Path) -> None:
    """_assert_target_inside must reject a junction whose resolved target lies outside the sandbox; _assert_inside (location, not target) must not."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        escaping_link = sandbox_dir / "escaping_link"
        with pytest.raises(gate.SandboxError, match="junction source does not exist"):
            gate._create_junction(escaping_link, sandbox_dir / "does_not_exist", 10)

        outside_target = root  # a real path outside the sandbox
        gate._create_junction(escaping_link, outside_target, 10)
        with pytest.raises(gate.SandboxError, match="resolves outside its required container"):
            gate._assert_target_inside(escaping_link, sandbox_dir, "test junction")
        gate._assert_inside(escaping_link, sandbox_dir, "test junction location")
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_cleanup_failure_fails_closed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )

    import shutil as real_shutil

    def _failing_teardown(sandbox_dir, support_dir):
        raise gate.SandboxError("SANDBOX_CLEANUP_FAILURE: simulated cleanup failure")

    monkeypatch.setattr(gate, "_teardown_sandbox", _failing_teardown)
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert "sandbox_teardown" in report["gateFailures"]

    import tempfile as _tempfile
    monkeypatch.undo()
    for leftover in Path(_tempfile.gettempdir()).glob("cvf-pp-sandbox-*"):
        real_shutil.rmtree(leftover, ignore_errors=True)


def test_public_root_invariant_violation_gates(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Simulates a sandboxed command mutating the real public root directly between invariant captures, proving the diff check is load-bearing."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )

    real_run_external_commands = gate._validate_external_commands

    def _mutating_validate_external_commands(root_arg, policy_arg, sandbox_dir_arg):
        (root_arg / "unauthorized_mutation.txt").write_text("should never happen", encoding="utf-8")
        return real_run_external_commands(root_arg, policy_arg, sandbox_dir_arg)

    monkeypatch.setattr(gate, "_validate_external_commands", _mutating_validate_external_commands)

    try:
        report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
        assert report["compliant"] is False
        assert "public_root_invariant_check" in report["gateFailures"]
    finally:
        stray = root / "unauthorized_mutation.txt"
        if stray.exists():
            stray.unlink()


def test_policy_check_registry_reconciles_sandbox_ids(tmp_path: Path) -> None:
    """D-04 extended to sandbox checks: a missing classification for a
    sandbox lifecycle check id must still fail closed."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(
        tmp_path, commands=[_sandboxed_py_command("noop", "pass", working_directory="APP")]
    )
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    policy["checks"] = [c for c in policy["checks"] if c["id"] != "sandbox_teardown"]
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    with pytest.raises(gate.GateFailClosed, match="never executed|lack a policy classification"):
        gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)


def test_resolve_via_system_path_finds_real_interpreter(tmp_path: Path) -> None:
    """resolveViaSystemPath: true must resolve argv[0] via PATH rather than
    failing as a relative-path miss."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    python_exe_name = Path(sys.executable).name
    system_path_command = {
        "id": "system_path_tool",
        "sandboxed": True,
        "resolveViaSystemPath": True,
        "workingDirectory": "APP",
        "argv": [python_exe_name, "-c", "pass"],
        "timeoutSeconds": 15,
    }
    policy["externalCommands"]["commands"] = [system_path_command]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}system_path_tool", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    import os as _os
    original_path = _os.environ.get("PATH", "")
    _os.environ["PATH"] = str(Path(sys.executable).parent) + _os.pathsep + original_path
    try:
        report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    finally:
        _os.environ["PATH"] = original_path

    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}system_path_tool")
    assert ext_result["outcome"] == "PASS", ext_result["detail"]


def test_resolve_via_system_path_missing_tool_fails_closed(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    system_path_command = {
        "id": "nonexistent_system_tool",
        "sandboxed": True,
        "resolveViaSystemPath": True,
        "workingDirectory": "APP",
        "argv": ["cvf-tool-that-definitely-does-not-exist-anywhere-on-path", "--version"],
        "timeoutSeconds": 10,
    }
    policy["externalCommands"]["commands"] = [system_path_command]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}nonexistent_system_tool", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}nonexistent_system_tool" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}nonexistent_system_tool")
    assert ext_result["evidence"]["resolveViaSystemPath"] is True


def test_default_commands_still_never_resolve_via_path(tmp_path: Path) -> None:
    """A command without resolveViaSystemPath must not fall back to PATH
    even if the same-named tool is on PATH - the exception is opt-in."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    policy = json.loads(policy_path.read_text(encoding="utf-8"))
    python_exe_name = Path(sys.executable).name
    default_command = {
        "id": "should_not_resolve_via_path",
        "sandboxed": True,
        "workingDirectory": "APP",
        "argv": [python_exe_name, "-c", "pass"],
        "timeoutSeconds": 10,
    }
    policy["externalCommands"]["commands"] = [default_command]
    policy["checks"].append(
        {"id": f"{gate.EXTERNAL_COMMAND_PREFIX}should_not_resolve_via_path", "ownerApplicability": "PUBLIC_OWNED", "family": "AD_HOC_GATE", "disposition": "GATE"}
    )
    policy_path.write_text(json.dumps(policy), encoding="utf-8")

    import os as _os
    original_path = _os.environ.get("PATH", "")
    _os.environ["PATH"] = str(Path(sys.executable).parent) + _os.pathsep + original_path
    try:
        report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)
    finally:
        _os.environ["PATH"] = original_path

    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}should_not_resolve_via_path")
    assert ext_result["outcome"] == "GATE"
    assert ext_result["evidence"]["resolveViaSystemPath"] is False


# ---------------------------------------------------------------------------
# Amendment 1 continuation (R-02 / R-03): copy-isolated dependency links.
# Assert against real filesystem state _isolate_dependencies produces, not
# just a run_gate report.
# ---------------------------------------------------------------------------


def test_next_entry_is_physical_copy_not_junction_or_symlink(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
        next_path = sandbox_dir / "APP" / "node_modules" / "next"
        assert next_path.is_dir()
        assert not next_path.is_symlink(), "next must not be a symlink"
        assert not gate._is_junction(next_path), "next must not be a junction"
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_next_entry_resolved_path_stays_inside_sandbox(tmp_path: Path) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
        next_path = sandbox_dir / "APP" / "node_modules" / "next"
        gate._assert_target_inside(next_path, sandbox_dir, "next full copy")
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_no_dependency_entry_resolves_into_real_public_root_or_core(tmp_path: Path) -> None:
    """AC-03: no dependency link's resolved target may land inside the real
    public root or Core specifically, not merely 'outside the sandbox'."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
        node_modules = sandbox_dir / "APP" / "node_modules"
        real_root_resolved = root.resolve()
        core_resolved = gate.REPO_ROOT.resolve()
        for entry in node_modules.iterdir():
            resolved = entry.resolve()
            assert not str(resolved).startswith(str(real_root_resolved) + os.sep), (
                f"{entry.name} resolves into the real public root: {resolved}"
            )
            assert not str(resolved).startswith(str(core_resolved) + os.sep), (
                f"{entry.name} resolves into Core: {resolved}"
            )
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_dependency_link_is_not_hard_link_alias_of_real_repository_file(tmp_path: Path) -> None:
    """Mutating the sandbox's copy of a file-type dependency entry must
    never change the real public root's own installed copy."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    real_lockfile = root / "APP" / "node_modules" / ".package-lock.json"
    original_content = real_lockfile.read_text(encoding="utf-8")

    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
        sandbox_lockfile = sandbox_dir / "APP" / "node_modules" / ".package-lock.json"
        sandbox_lockfile.write_text("mutated-in-sandbox", encoding="utf-8")
        assert real_lockfile.read_text(encoding="utf-8") == original_content, (
            "mutating the sandbox copy changed the real repository's dependency store file"
        )
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_mutating_fixture_dependency_after_isolation_does_not_change_source_store(tmp_path: Path) -> None:
    """Mutating a real, already-copied dependency after isolation must not
    change the sandbox's independently-copied entry."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
        sandbox_next = sandbox_dir / "APP" / "node_modules" / "next" / "index.js"
        original_sandbox_next_content = sandbox_next.read_text(encoding="utf-8")

        real_next = root / "APP" / "node_modules" / "next" / "index.js"
        real_next.write_text("module.exports = 'mutated-after-isolation';\n", encoding="utf-8")

        assert sandbox_next.read_text(encoding="utf-8") == original_sandbox_next_content, (
            "mutating the real repository's dependency store after isolation changed the sandbox copy"
        )
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)
        real_next = root / "APP" / "node_modules" / "next" / "index.js"
        real_next.write_text("module.exports = 'next-fixture';\n", encoding="utf-8")


def test_configured_live_target_inside_real_repository_fails_closed(tmp_path: Path) -> None:
    """A junction whose resolved target is deliberately configured to land
    inside the real public root must fail closed via _assert_target_inside."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)
    try:
        live_link = sandbox_dir / "live_link_into_real_root"
        gate._create_junction(live_link, root / "APP", 10)
        with pytest.raises(gate.SandboxError, match="resolves outside its required container"):
            gate._assert_target_inside(live_link, sandbox_dir, "regression live link")
    finally:
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_dependency_copy_failure_fails_closed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)

    real_copytree = gate.shutil.copytree

    def _failing_copytree(src, dst, **kwargs):
        if Path(src).name == "next":
            raise OSError("simulated copy failure")
        return real_copytree(src, dst, **kwargs)

    monkeypatch.setattr(gate.shutil, "copytree", _failing_copytree)
    try:
        with pytest.raises(gate.SandboxError, match="SANDBOX_DEPENDENCY_ISOLATION_FAILURE"):
            gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
    finally:
        monkeypatch.undo()
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_partial_dependency_copy_fails_closed(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """A copy call that reports success without producing the destination
    path must still fail closed rather than link a nonexistent entry."""
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[])
    sandbox_dir, support_dir = gate._materialize_sandbox(root, head_head, 30)

    real_copy2 = gate.shutil.copy2

    def _silently_failing_copy2(src, dst, **kwargs):
        if Path(src).name == ".package-lock.json":
            return None  # reports success without writing the file
        return real_copy2(src, dst, **kwargs)

    monkeypatch.setattr(gate.shutil, "copy2", _silently_failing_copy2)
    try:
        with pytest.raises(gate.SandboxError, match="did not produce expected path|SANDBOX_DEPENDENCY_ISOLATION_FAILURE"):
            gate._isolate_dependencies(root, sandbox_dir, support_dir, ["APP"], ["pkg-a"], 30)
    finally:
        monkeypatch.undo()
        gate._teardown_sandbox(sandbox_dir, support_dir)


def test_expected_evidence_count_mismatch_gates(tmp_path: Path) -> None:
    """Exit 0 with an evidence count not matching expectedEvidence must
    still GATE - exit code 0 alone is insufficient (R-03)."""
    code = (
        "print('Test Files  1 passed (1)');"
        "print('Tests  1 passed (1)')"
    )
    command = _sandboxed_py_command("count_mismatch", code, working_directory="APP")
    command["expectedEvidence"] = {"files": 30, "tests": 231}
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[command])
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)

    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}count_mismatch" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}count_mismatch")
    assert ext_result["outcome"] == "GATE"
    assert ext_result["evidence"]["observedEvidence"] == {"files": 1, "tests": 1}
    assert ext_result["evidence"]["evidenceCountMismatch"]["files"] == {"expected": 30, "observed": 1}


def test_expected_evidence_extraction_failure_gates(tmp_path: Path) -> None:
    """Exit 0 with output the extraction pattern cannot match (observed
    None) must GATE, proving extraction failure is not benign (R-03)."""
    code = "print('no recognizable test-summary output here')"
    command = _sandboxed_py_command("extraction_failure", code, working_directory="APP")
    command["expectedEvidence"] = {"files": 30, "tests": 231}
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[command])
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)

    assert report["compliant"] is False
    assert f"{gate.EXTERNAL_COMMAND_PREFIX}extraction_failure" in report["gateFailures"]
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}extraction_failure")
    assert ext_result["outcome"] == "GATE"
    assert ext_result["evidence"]["observedEvidence"] == {"files": None, "tests": None}


def test_expected_evidence_exact_match_passes(tmp_path: Path) -> None:
    """Positive counterpart: exit 0 plus an exact evidence match PASSes."""
    code = (
        "print('Test Files  30 passed (30)');"
        "print('Tests  231 passed (231)')"
    )
    command = _sandboxed_py_command("count_match", code, working_directory="APP")
    command["expectedEvidence"] = {"files": 30, "tests": 231}
    root, base_head, head_head, policy_path = _build_sandbox_fixture(tmp_path, commands=[command])
    report = gate.run_gate(str(root), base_head, head_head, policy_path, timeout=30)

    assert report["compliant"] is True
    ext_result = next(c for c in report["checks"] if c["id"] == f"{gate.EXTERNAL_COMMAND_PREFIX}count_match")
    assert ext_result["outcome"] == "PASS"
    assert ext_result["evidence"]["observedEvidence"] == {"files": 30, "tests": 231}


def test_extract_observed_counts_handles_real_ansi_and_progress_line_formats() -> None:
    """Regression for real output: vitest interleaves ANSI color codes; Next.js repeats the static-page line with extra text - both must extract the final integer."""
    vitest_output = (
        "\x1b[2m Test Files \x1b[22m \x1b[1m\x1b[32m30 passed\x1b[39m\x1b[22m\x1b[90m (30)\x1b[39m\n"
        "\x1b[2m      Tests \x1b[22m \x1b[1m\x1b[32m231 passed\x1b[39m\x1b[22m\x1b[90m (231)\x1b[39m\n"
    )
    observed = gate._extract_observed_counts(vitest_output, {"files": 30, "tests": 231})
    assert observed == {"files": 30, "tests": 231}

    next_build_output = (
        "  Generating static pages using 15 workers (0/121) ...\n"
        "  Generating static pages using 15 workers (30/121) \n"
        "  Generating static pages using 15 workers (60/121) \n"
        "  Generating static pages using 15 workers (90/121) \n"
        "\x1b[32m?\x1b[39m Generating static pages using 15 workers (121/121) in 3.8s\n"
    )
    observed_pages = gate._extract_observed_counts(next_build_output, {"staticPages": 121})
    assert observed_pages == {"staticPages": 121}
