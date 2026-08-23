#!/usr/bin/env python3
"""CVF Public Projection Pre-Push Gate.

Provenance-owned, read-only evaluation of an explicitly named public-sync
candidate root. Implements the taxonomy and gate-versus-report policy in
`docs/reference/CVF_PUBLIC_PROJECTION_PRE_PUSH_PROFILE_STANDARD_2026-08-11.md`
and the machine data in
`governance/compat/CVF_PUBLIC_PROJECTION_PRE_PUSH_POLICY.json`.

This runner never writes to, stages, or commits inside the public root
itself. `--base`/`--head` are validated against the policy's pinned commit
identities before any candidate evaluation runs (this profile only ever
evaluates the exact pinned range). Configured `externalCommands` are
executed for real via `subprocess.run` with explicit argv (never
`shell=True`), an explicit contained working directory resolved inside the
public root, and an explicit per-command timeout; a missing executable,
launch error, timeout, or nonzero exit is a GATE failure. The policy's
declared check registry is reconciled against what the runner actually
executed: unexecuted declarations and unclassified executions both fail
closed.

Amendment 2 structural extraction: sandbox lifecycle, dependency isolation,
inherited-debt family checkers, and command-output evidence extraction live
in `public_projection_pre_push_gate_lib.py` (imported below); this module
keeps argument parsing, policy loading/top-level Git-level validation,
orchestration, report construction, and output/exit-code mapping.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil  # re-exported: test module monkeypatches gate.shutil.*
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
COMPAT_DIR = Path(__file__).resolve().parent
if str(COMPAT_DIR) not in sys.path:
    sys.path.insert(0, str(COMPAT_DIR))

from public_projection_pre_push_gate_lib import (  # noqa: E402
    ANSI_ESCAPE_RE,
    FAMILY_CHECKERS,
    FULL_COPY_DEPENDENCY_ENTRIES,
    MAX_CAPTURED_OUTPUT_CHARS,
    CheckResult,
    GateFailClosed,
    SandboxError,
    _assert_inside,
    _assert_target_inside,
    capture_public_root_invariants as _capture_public_root_invariants,
    check_governed_file_size as _check_governed_file_size,
    check_governed_python_automation_size as _check_governed_python_automation_size,
    check_guard_registry_compatibility as _check_guard_registry_compatibility,
    check_pre_public_p3_readiness as _check_pre_public_p3_readiness,
    count_lines as _count_lines,
    create_junction as _create_junction,
    create_link as _create_link,
    copy_dependency_entry as _copy_dependency_entry,
    diff_public_root_invariants as _diff_public_root_invariants,
    extract_observed_counts as _extract_observed_counts,
    is_junction as _is_junction,
    isolate_dependencies as _isolate_dependencies,
    materialize_sandbox as _materialize_sandbox,
    resolve_command_executable as _resolve_command_executable,
    teardown_sandbox as _teardown_sandbox,
    truncate as _truncate,
    verify_sandbox_materialization as _verify_sandbox_materialization,
)

DEFAULT_POLICY_PATH = REPO_ROOT / "governance" / "compat" / "CVF_PUBLIC_PROJECTION_PRE_PUSH_POLICY.json"
STANDARD_PATH = "docs/reference/CVF_PUBLIC_PROJECTION_PRE_PUSH_PROFILE_STANDARD_2026-08-11.md"

KNOWN_FAMILIES = (
    "governed_file_size",
    "governed_python_automation_size",
    "guard_registry_compatibility",
    "pre_public_p3_readiness",
)
KNOWN_DISPOSITIONS = ("GATE", "REPORT_IF_UNCHANGED_ELSE_GATE")
KNOWN_OWNER_APPLICABILITY = ("PUBLIC_OWNED", "PRIVATE_OWNED")
KNOWN_AD_HOC_CHECK_FAMILY = "AD_HOC_GATE"
EXTERNAL_COMMAND_PREFIX = "external_command:"


def _load_policy(policy_path: Path) -> dict[str, Any]:
    if not policy_path.exists():
        raise GateFailClosed(f"policy file not found: {policy_path}")
    try:
        data = json.loads(policy_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise GateFailClosed(f"policy file is not valid JSON: {exc}") from exc
    required_top = (
        "expectedRemoteUrl",
        "expectedBranch",
        "pinnedBaseHead",
        "authorizedCandidateHead",
        "candidateManifest",
        "inheritedDebtFamilies",
        "checks",
    )
    for key in required_top:
        if key not in data:
            raise GateFailClosed(f"policy file missing required key: {key}")
    return data


_COMMIT_SHA_RE = re.compile(r"^[0-9a-f]{7,40}$")


def _validate_pins(policy: dict[str, Any], base: str, head: str) -> None:
    """Fail closed before any candidate evaluation if the caller-supplied
    --base/--head do not match the policy's pinned commit identities.

    This must run before any Git inspection of the public root: a caller
    who controls both the policy file's in-memory values and the CLI
    arguments must not be able to make an unpinned pair of commits look
    compliant just because the Git-level checks (remote/branch/clean/
    manifest) happen to still pass against whatever they pointed at.
    """
    pinned_base = policy.get("pinnedBaseHead")
    pinned_head = policy.get("authorizedCandidateHead")

    if not isinstance(pinned_base, str) or not _COMMIT_SHA_RE.match(pinned_base):
        raise GateFailClosed(f"policy pinnedBaseHead is missing or not a valid commit SHA: {pinned_base!r}")
    if not isinstance(pinned_head, str) or not _COMMIT_SHA_RE.match(pinned_head):
        raise GateFailClosed(
            f"policy authorizedCandidateHead is missing or not a valid commit SHA: {pinned_head!r}"
        )
    if not isinstance(base, str) or not _COMMIT_SHA_RE.match(base):
        raise GateFailClosed(f"--base is not a valid commit SHA: {base!r}")
    if not isinstance(head, str) or not _COMMIT_SHA_RE.match(head):
        raise GateFailClosed(f"--head is not a valid commit SHA: {head!r}")

    if base.lower() != pinned_base.lower():
        raise GateFailClosed(
            f"--base ({base}) does not match policy pinnedBaseHead ({pinned_base}); "
            "this profile only evaluates the exact pinned range, refusing to proceed"
        )
    if head.lower() != pinned_head.lower():
        raise GateFailClosed(
            f"--head ({head}) does not match policy authorizedCandidateHead ({pinned_head}); "
            "this profile only evaluates the exact pinned candidate, refusing to proceed"
        )


def _run_git(root: Path, args: list[str], timeout: int) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(
            ["git", "-c", "core.quotepath=false", *args],
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise GateFailClosed(f"git {' '.join(args)} timed out after {timeout}s") from exc
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _resolve_public_root(raw_root: str) -> Path:
    root = Path(raw_root).resolve()
    if not root.exists() or not root.is_dir():
        raise GateFailClosed(f"--public-root does not exist or is not a directory: {root}")
    git_dir = root / ".git"
    if not git_dir.exists():
        raise GateFailClosed(f"--public-root is not a Git worktree (no .git found): {root}")
    return root


def _validate_remote(root: Path, expected_remote: str, timeout: int) -> CheckResult:
    code, out, err = _run_git(root, ["remote", "get-url", "origin"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to resolve origin remote: {err or out}")
    actual = out.strip()
    if actual != expected_remote:
        return CheckResult(
            "remote_url_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"origin remote mismatch: expected {expected_remote!r}, found {actual!r}",
            {"expected": expected_remote, "actual": actual},
        )
    return CheckResult(
        "remote_url_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
        "origin remote matches expected public URL", {"actual": actual},
    )


def _validate_branch(root: Path, expected_branch: str, timeout: int) -> CheckResult:
    code, out, err = _run_git(root, ["branch", "--show-current"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to resolve current branch: {err or out}")
    actual = out.strip()
    if actual != expected_branch:
        return CheckResult(
            "branch_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"branch mismatch: expected {expected_branch!r}, found {actual!r}",
            {"expected": expected_branch, "actual": actual},
        )
    return CheckResult(
        "branch_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
        "branch matches expected public branch", {"actual": actual},
    )


def _validate_clean(root: Path, timeout: int) -> CheckResult:
    code, out, err = _run_git(root, ["status", "--porcelain"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to resolve worktree status: {err or out}")
    if out.strip():
        dirty_lines = out.strip().splitlines()
        return CheckResult(
            "clean_worktree", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"public worktree is not clean: {len(dirty_lines)} entr(y/ies)",
            {"dirtyEntries": dirty_lines},
        )
    return CheckResult(
        "clean_worktree", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
        "public worktree is clean", {},
    )


def _validate_head(root: Path, expected_head: str, timeout: int) -> CheckResult:
    code, out, err = _run_git(root, ["rev-parse", "HEAD"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to resolve HEAD: {err or out}")
    actual = out.strip()
    if actual != expected_head:
        return CheckResult(
            "head_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"HEAD mismatch: expected {expected_head!r}, found {actual!r}",
            {"expected": expected_head, "actual": actual},
        )
    return CheckResult(
        "head_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
        "HEAD matches expected public candidate", {"actual": actual},
    )


def _validate_range_and_manifest(
    root: Path, base: str, head: str, expected_manifest: list[str], timeout: int
) -> tuple[CheckResult, CheckResult]:
    code, out, err = _run_git(root, ["cat-file", "-e", f"{base}^{{commit}}"], timeout)
    if code != 0:
        raise GateFailClosed(f"--base does not resolve to a commit in the public root: {base}")
    code, out, err = _run_git(root, ["cat-file", "-e", f"{head}^{{commit}}"], timeout)
    if code != 0:
        raise GateFailClosed(f"--head does not resolve to a commit in the public root: {head}")

    code, out, err = _run_git(root, ["diff", "--name-only", f"{base}..{head}"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to diff base..head range: {err or out}")
    actual_manifest = sorted(p for p in out.splitlines() if p.strip())

    if not actual_manifest:
        range_result = CheckResult(
            "non_empty_range", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            "base..head range is empty", {"base": base, "head": head},
        )
    else:
        range_result = CheckResult(
            "non_empty_range", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
            f"range contains {len(actual_manifest)} changed path(s)", {"count": len(actual_manifest)},
        )

    expected_sorted = sorted(expected_manifest)
    extra = sorted(set(actual_manifest) - set(expected_sorted))
    missing = sorted(set(expected_sorted) - set(actual_manifest))
    if extra or missing:
        manifest_result = CheckResult(
            "exact_manifest_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"manifest drift: {len(extra)} extra, {len(missing)} missing",
            {"extra": extra, "missing": missing},
        )
    else:
        manifest_result = CheckResult(
            "exact_manifest_match", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
            f"manifest matches exactly ({len(expected_sorted)} paths)", {"count": len(expected_sorted)},
        )
    return range_result, manifest_result


def _run_external_command(
    execution_root: Path, cmd_cfg: dict[str, Any], default_timeout: int, *, sandboxed: bool
) -> CheckResult:
    """Run one configured command. `execution_root` is either the real
    public root (non-sandboxed commands, read-only Git-adjacent inspection
    only) or the disposable sandbox directory (sandboxed commands, the only
    place a mutating package command may ever run). The container-escape
    check below applies identically in both cases: the workingDirectory
    must resolve inside whichever root was actually passed in.
    """
    command_id = cmd_cfg.get("id")
    if not command_id or not isinstance(command_id, str):
        raise GateFailClosed(f"external command entry is missing a string 'id': {cmd_cfg!r}")
    check_id = f"{EXTERNAL_COMMAND_PREFIX}{command_id}"
    container_label = "sandbox" if sandboxed else "public root"

    argv = cmd_cfg.get("argv")
    if not isinstance(argv, list) or not argv or not all(isinstance(a, str) for a in argv):
        raise GateFailClosed(f"external command {command_id!r} has an empty or invalid argv list")

    working_directory = cmd_cfg.get("workingDirectory", ".")
    cwd = (execution_root / working_directory).resolve()
    if not cwd.exists() or not cwd.is_dir():
        raise GateFailClosed(
            f"external command {command_id!r} workingDirectory does not exist inside the {container_label}: {cwd}"
        )
    try:
        cwd.relative_to(execution_root.resolve())
    except ValueError as exc:
        raise GateFailClosed(
            f"external command {command_id!r} workingDirectory escapes the {container_label}: {cwd}"
        ) from exc

    resolve_via_system_path = bool(cmd_cfg.get("resolveViaSystemPath"))
    resolved_exe = _resolve_command_executable(cwd, argv[0], resolve_via_system_path=resolve_via_system_path)
    if resolved_exe is None:
        location = "system PATH" if resolve_via_system_path else str(cwd)
        return CheckResult(
            check_id, "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"external command {command_id!r} executable not found: {argv[0]!r} under {location}",
            {"missingExecutable": argv[0], "workingDirectory": working_directory, "resolveViaSystemPath": resolve_via_system_path},
        )

    resolved_argv = [str(resolved_exe), *argv[1:]]
    timeout_seconds = int(cmd_cfg.get("timeoutSeconds", default_timeout))

    try:
        proc = subprocess.run(
            resolved_argv,
            cwd=cwd,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout_seconds,
            shell=False,
        )
    except subprocess.TimeoutExpired:
        return CheckResult(
            check_id, "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"external command {command_id!r} timed out after {timeout_seconds}s",
            {"timeoutSeconds": timeout_seconds, "timeoutDisposition": "GATE"},
        )
    except OSError as exc:
        return CheckResult(
            check_id, "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"external command {command_id!r} failed to launch: {exc}",
            {"launchError": str(exc)},
        )

    combined_output = (proc.stdout or "") + (proc.stderr or "")
    expected_evidence = cmd_cfg.get("expectedEvidence")
    observed_now: dict[str, Any] | None = None
    mismatched_now: dict[str, Any] = {}
    if isinstance(expected_evidence, dict):
        observed_now = _extract_observed_counts(combined_output, expected_evidence)
        mismatched_now = {
            key: {"expected": expected_value, "observed": observed_now.get(key)}
            for key, expected_value in expected_evidence.items()
            if observed_now.get(key) != expected_value
        }

    # Output tails are evidence for any non-clean-PASS outcome (nonzero
    # exit, or a PASS-eligible zero exit that still fails the expected-
    # evidence comparison) - a zero exit with a count mismatch needs the
    # same diagnostic output as a nonzero exit, since the mismatch itself
    # can only be explained by reading what the command actually printed.
    include_output = proc.returncode != 0 or bool(mismatched_now)
    evidence: dict[str, Any] = {
        "exitStatus": proc.returncode,
        "timeoutSeconds": timeout_seconds,
        "timeoutDisposition": "NOT_TIMED_OUT",
        "sandboxed": sandboxed,
        "stdoutTail": _truncate(proc.stdout.strip()) if include_output else "",
        "stderrTail": _truncate(proc.stderr.strip()) if include_output else "",
    }

    if observed_now is not None:
        evidence["expectedEvidence"] = expected_evidence
        evidence["observedEvidence"] = observed_now
        if mismatched_now:
            evidence["evidenceCountMismatch"] = mismatched_now
            return CheckResult(
                check_id, "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
                f"external command {command_id!r} evidence count mismatch (expected vs observed disposition MISMATCH): {mismatched_now}",
                evidence,
            )

    if proc.returncode != 0:
        return CheckResult(
            check_id, "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
            f"external command {command_id!r} exited nonzero: {proc.returncode}",
            evidence,
        )
    return CheckResult(
        check_id, "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
        f"external command {command_id!r} completed with exit 0", evidence,
    )


def _validate_external_commands(
    root: Path, policy: dict[str, Any], sandbox_dir: Path | None
) -> list[CheckResult]:
    external_cfg = policy.get("externalCommands", {})
    commands = external_cfg.get("commands", [])
    default_timeout = int(policy.get("subprocessTimeoutSeconds", 60))

    seen_ids: set[str] = set()
    for cmd_cfg in commands:
        command_id = cmd_cfg.get("id")
        if not command_id or not isinstance(command_id, str):
            raise GateFailClosed(f"external command entry is missing a string 'id': {cmd_cfg!r}")
        if command_id in seen_ids:
            raise GateFailClosed(f"duplicate external command id: {command_id!r}")
        seen_ids.add(command_id)
        if bool(cmd_cfg.get("sandboxed")) and sandbox_dir is None:
            raise GateFailClosed(
                f"external command {command_id!r} is marked sandboxed but no sandbox was materialized"
            )

    results: list[CheckResult] = []
    for cmd_cfg in commands:
        sandboxed = bool(cmd_cfg.get("sandboxed"))
        execution_root = sandbox_dir if sandboxed else root
        assert execution_root is not None  # guarded above
        results.append(_run_external_command(execution_root, cmd_cfg, default_timeout, sandboxed=sandboxed))
    return results


def _resolve_policy_checks(policy: dict[str, Any]) -> list[dict[str, Any]]:
    checks = policy["checks"]
    if not isinstance(checks, list) or not checks:
        raise GateFailClosed("policy 'checks' must be a non-empty array")

    seen_ids: set[str] = set()
    for entry in checks:
        check_id = entry.get("id")
        if not check_id or not isinstance(check_id, str):
            raise GateFailClosed(f"policy check entry is missing a string 'id': {entry!r}")
        if check_id in seen_ids:
            raise GateFailClosed(f"policy 'checks' contains a duplicate id: {check_id!r}")
        seen_ids.add(check_id)

        owner_applicability = entry.get("ownerApplicability")
        family = entry.get("family")
        disposition = entry.get("disposition")
        if owner_applicability not in KNOWN_OWNER_APPLICABILITY:
            raise GateFailClosed(
                f"check {check_id!r} has unknown ownerApplicability: {owner_applicability!r}"
            )
        if family != KNOWN_AD_HOC_CHECK_FAMILY and family not in KNOWN_FAMILIES:
            raise GateFailClosed(f"check {check_id!r} has unknown family: {family!r}")
        if disposition not in KNOWN_DISPOSITIONS and disposition != "GATE":
            raise GateFailClosed(f"check {check_id!r} has unknown disposition: {disposition!r}")

    external_command_ids = {
        f"{EXTERNAL_COMMAND_PREFIX}{cmd.get('id')}"
        for cmd in policy.get("externalCommands", {}).get("commands", [])
        if cmd.get("id")
    }
    declared_ids = seen_ids
    missing_external_declarations = external_command_ids - declared_ids
    if missing_external_declarations:
        raise GateFailClosed(
            "policy 'checks' is missing a classification entry for configured external "
            f"command(s): {sorted(missing_external_declarations)}"
        )

    return checks


def _reconcile_check_registry(policy: dict[str, Any], executed_results: list["CheckResult"]) -> None:
    """D-04: the policy's declared check registry must control actual coverage.

    Every check id the runner actually executed must have a matching policy
    declaration, and every non-external-command policy declaration for a
    check this runner knows how to execute must have actually been run.
    Unknown declared ids (neither a built-in AD_HOC_GATE/family check nor a
    configured external command) fail closed rather than being silently
    ignored.
    """
    declared_ids = {entry["id"] for entry in policy["checks"]}
    executed_ids = {r.check_id for r in executed_results}

    unexecuted = declared_ids - executed_ids
    if unexecuted:
        raise GateFailClosed(f"policy declares check id(s) that were never executed: {sorted(unexecuted)}")

    unclassified = executed_ids - declared_ids
    if unclassified:
        raise GateFailClosed(f"executed check id(s) lack a policy classification: {sorted(unclassified)}")


def run_gate(
    public_root_raw: str,
    base: str,
    head: str,
    policy_path: Path,
    timeout: int,
) -> dict[str, Any]:
    policy = _load_policy(policy_path)
    _resolve_policy_checks(policy)
    _validate_pins(policy, base, head)

    root = _resolve_public_root(public_root_raw)

    results: list[CheckResult] = []
    results.append(
        CheckResult(
            "public_root_containment", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
            f"public root resolved and contained: {root}", {"resolvedRoot": str(root)},
        )
    )
    results.append(_validate_remote(root, policy["expectedRemoteUrl"], timeout))
    results.append(_validate_branch(root, policy["expectedBranch"], timeout))
    results.append(_validate_clean(root, timeout))
    results.append(_validate_head(root, head, timeout))

    range_result, manifest_result = _validate_range_and_manifest(
        root, base, head, policy["candidateManifest"], timeout
    )
    results.append(range_result)
    results.append(manifest_result)

    commands = policy.get("externalCommands", {}).get("commands", [])
    needs_sandbox = any(bool(c.get("sandboxed")) for c in commands)
    sandbox_config = policy.get("sandboxConfig", {})

    sandbox_dir: Path | None = None
    support_dir: Path | None = None
    before_invariants: dict[str, Any] | None = None
    sandbox_evidence: dict[str, Any] = {}

    try:
        if needs_sandbox:
            before_invariants = _capture_public_root_invariants(root, timeout)
            sandbox_dir, support_dir = _materialize_sandbox(root, head, timeout)
            _verify_sandbox_materialization(root, sandbox_dir, head, policy["candidateManifest"], timeout)
            _isolate_dependencies(
                root,
                sandbox_dir,
                support_dir,
                sandbox_config.get("sandboxedPackageDirectories", []),
                sandbox_config.get("siblingPackagesRequiringSandboxRedirect", []),
                timeout,
            )
            sandbox_evidence = {
                "sandboxMaterialized": True,
                "sandboxPathHint": f"{tempfile.gettempdir()}/cvf-pp-sandbox-*",
            }
            results.append(
                CheckResult(
                    "sandbox_materialization", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
                    "sandbox materialized and verified against authorizedCandidateHead",
                    sandbox_evidence,
                )
            )

        results.extend(_validate_external_commands(root, policy, sandbox_dir))
    finally:
        if sandbox_dir is not None and support_dir is not None:
            try:
                _teardown_sandbox(sandbox_dir, support_dir)
                teardown_ok = True
                teardown_error = None
            except SandboxError as exc:
                teardown_ok = False
                teardown_error = str(exc)

            if before_invariants is not None:
                after_invariants = _capture_public_root_invariants(root, timeout)
                invariant_diffs = _diff_public_root_invariants(before_invariants, after_invariants)
                if invariant_diffs:
                    results.append(
                        CheckResult(
                            "public_root_invariant_check", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
                            f"PUBLIC_ROOT_INVARIANT_VIOLATION: public root changed during sandboxed run: {invariant_diffs}",
                            {"changedFields": invariant_diffs},
                        )
                    )
                else:
                    results.append(
                        CheckResult(
                            "public_root_invariant_check", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
                            "public root HEAD/branch/status/diff identical before and after the sandboxed run", {},
                        )
                    )

            if not teardown_ok:
                results.append(
                    CheckResult(
                        "sandbox_teardown", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "GATE",
                        f"SANDBOX_CLEANUP_FAILURE: {teardown_error}", {},
                    )
                )
            else:
                results.append(
                    CheckResult(
                        "sandbox_teardown", "PUBLIC_OWNED", KNOWN_AD_HOC_CHECK_FAMILY, "PASS",
                        "sandbox and support directory fully removed", {},
                    )
                )

    for family_id, checker in FAMILY_CHECKERS.items():
        family_cfg = policy["inheritedDebtFamilies"].get(family_id)
        if family_cfg is None:
            raise GateFailClosed(f"policy is missing inheritedDebtFamilies entry for {family_id!r}")
        results.append(checker(root, family_cfg))

    _reconcile_check_registry(policy, results)

    gate_failures = [r for r in results if r.outcome == "GATE"]
    inherited_debt_reported = [r for r in results if r.outcome == "REPORT"]
    compliant = not gate_failures

    return {
        "schemaVersion": "1.0.0",
        "policyPath": str(policy_path.relative_to(REPO_ROOT)) if policy_path.is_relative_to(REPO_ROOT) else str(policy_path),
        "standardPath": STANDARD_PATH,
        "publicRoot": str(root),
        "expectedRemoteUrl": policy["expectedRemoteUrl"],
        "expectedBranch": policy["expectedBranch"],
        "base": base,
        "head": head,
        "checks": [
            {
                "id": r.check_id,
                "ownerApplicability": r.ownerApplicability,
                "family": r.family,
                "outcome": r.outcome,
                "detail": r.detail,
                "evidence": r.evidence,
            }
            for r in results
        ],
        "gateFailureCount": len(gate_failures),
        "inheritedDebtReportedCount": len(inherited_debt_reported),
        "gateFailures": [r.check_id for r in gate_failures],
        "inheritedDebtReported": [r.check_id for r in inherited_debt_reported],
        "compliant": compliant,
    }


def _print_report(report: dict[str, Any]) -> None:
    print("=== CVF Public Projection Pre-Push Gate ===")
    print(f"Public root: {report['publicRoot']}")
    print(f"Expected remote: {report['expectedRemoteUrl']}")
    print(f"Expected branch: {report['expectedBranch']}")
    print(f"Base: {report['base']}")
    print(f"Head: {report['head']}")
    print(f"Checks run: {len(report['checks'])}")
    print(f"Gate failures: {report['gateFailureCount']}")
    print(f"Inherited debt reported: {report['inheritedDebtReportedCount']}")
    print()
    for check in report["checks"]:
        print(f"  [{check['outcome']}] {check['id']} ({check['ownerApplicability']}/{check['family']})")
        print(f"      {check['detail']}")

    if report["compliant"]:
        print("\nCOMPLIANT: public projection pre-push gate passed.")
    else:
        print("\nVIOLATION: public projection pre-push gate blocked by gate failure(s): "
              + ", ".join(report["gateFailures"]))


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(errors="replace")

    parser = argparse.ArgumentParser(
        description=(
            "Provenance-owned, read-only public-projection pre-push gate. "
            "Evaluates an explicitly named public-sync candidate root against "
            "the pinned policy without mutating the public root."
        )
    )
    parser.add_argument("--public-root", required=True, help="Path to the public-sync clone worktree to evaluate")
    parser.add_argument("--base", required=True, help="Pinned base commit inside the public root")
    parser.add_argument("--head", required=True, help="Expected current HEAD commit inside the public root")
    parser.add_argument(
        "--policy",
        default=str(DEFAULT_POLICY_PATH),
        help="Path to the policy JSON (default: governance/compat/CVF_PUBLIC_PROJECTION_PRE_PUSH_POLICY.json)",
    )
    parser.add_argument("--timeout", type=int, default=60, help="Per-command subprocess timeout in seconds")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON receipt instead of human summary")
    args = parser.parse_args()

    try:
        report = run_gate(args.public_root, args.base, args.head, Path(args.policy).resolve(), args.timeout)
    except GateFailClosed as exc:
        failure = {
            "schemaVersion": "1.0.0",
            "compliant": False,
            "failClosedReason": str(exc),
        }
        if args.json:
            print(json.dumps(failure, indent=2, ensure_ascii=False))
        else:
            print(f"FAIL_CLOSED: {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        _print_report(report)

    return 0 if report["compliant"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
