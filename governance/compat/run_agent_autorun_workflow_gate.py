#!/usr/bin/env python3
"""
CVF Agent Autorun Workflow Gate

Runs the phase-specific guard bundle agents must pass before dispatch,
implementation, closure, or push. The wrapper does not replace the underlying
guards; it makes the autorun stop points explicit and repeatable.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

try:
    import run_agent_commit_steward_preflight as steward
except ModuleNotFoundError:  # imported as governance.compat.run_agent_autorun_workflow_gate
    from governance.compat import run_agent_commit_steward_preflight as steward

try:
    import agent_autorun_machine_verification as machine_verification
except ModuleNotFoundError:
    from governance.compat import agent_autorun_machine_verification as machine_verification


REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RECEIPT_DIR = REPO_ROOT / ".cvf" / "runtime" / "autorun-receipts"
RECEIPT_SCHEMA = machine_verification.RECEIPT_SCHEMA
VERIFIER_IDENTITY_PROFILE = machine_verification.VERIFIER_IDENTITY_PROFILE
MACHINE_VERIFICATION_PROFILE = machine_verification.MACHINE_VERIFICATION_PROFILE
VerifierIdentityUnavailable = machine_verification.VerifierIdentityUnavailable
_jcs_bytes = machine_verification._jcs_bytes
_machine_verification_object = machine_verification._machine_verification_object
_machine_verification_digest = machine_verification._machine_verification_digest

try:
    from agent_autorun_command_catalog import (
        GateCommand,
        GateResult,
        GitStatusResult,
        PRE_PUSH_COMMANDS,
        RANGE_GATE_NAMES,
        _common_commands,
        _pre_implementation_commands,
    )
except ModuleNotFoundError:  # imported as governance.compat.run_agent_autorun_workflow_gate
    from governance.compat.agent_autorun_command_catalog import (
        GateCommand,
        GateResult,
        GitStatusResult,
        PRE_PUSH_COMMANDS,
        RANGE_GATE_NAMES,
        _common_commands,
        _pre_implementation_commands,
    )

def _execute(index: int, command: GateCommand) -> GateResult:
    started = time.perf_counter()
    proc = subprocess.run(
        list(command.command),
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return GateResult(
        index=index,
        name=command.name,
        command=command.command,
        returncode=proc.returncode,
        duration_s=time.perf_counter() - started,
        output=proc.stdout or "",
    )


def _print_result(result: GateResult, *, show_success_output: bool) -> None:
    status = "PASS" if result.returncode == 0 else "FAIL"
    print(f"[{status}] {result.name} ({result.duration_s:.2f}s)")
    if result.output and (show_success_output or result.returncode != 0):
        print(result.output.rstrip())


def _run_commands(
    commands: tuple[GateCommand, ...],
    *,
    parallel: bool,
    max_workers: int,
) -> tuple[GateResult, ...]:
    if not commands:
        return ()
    if not parallel:
        results: list[GateResult] = []
        for index, command in enumerate(commands, start=1):
            print(f"\n=== {command.name} ===")
            print(" ".join(command.command))
            result = _execute(index, command)
            _print_result(result, show_success_output=True)
            results.append(result)
        return tuple(results)

    worker_count = max(1, min(max_workers, len(commands)))
    print(
        f"\n=== parallel autorun bundle: {len(commands)} commands, "
        f"max_workers={worker_count} ==="
    )
    results: list[GateResult] = []
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        futures = [
            executor.submit(_execute, index, command)
            for index, command in enumerate(commands, start=1)
        ]
        for future in as_completed(futures):
            result = future.result()
            _print_result(result, show_success_output=False)
            results.append(result)
    return tuple(sorted(results, key=lambda item: item.index))


def _command_manifest_hash(commands: tuple[GateCommand, ...]) -> str:
    payload = [
        {"name": command.name, "command": list(command.command)}
        for command in commands
    ]
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _worktree_fingerprint(base: str, head: str) -> str:
    plan = steward.build_path_plan(base, head)
    digest = hashlib.sha256()
    for path in plan.changed_paths:
        digest.update(path.encode("utf-8", errors="replace"))
        digest.update(b"\0")
        full = REPO_ROOT / path
        if full.is_file():
            digest.update(hashlib.sha256(full.read_bytes()).digest())
        else:
            digest.update(b"<missing-or-directory>")
        digest.update(b"\0")
    return digest.hexdigest()


def _receipt_path(phase: str, receipt_dir: Path) -> Path:
    return receipt_dir / f"{phase}.json"


# --- MFRP-H0: conservative verifier-input snapshot and interpreter identity ---
#
# The v1 receipt bound only command argv (_command_manifest_hash) and the
# current path-plan's changed files (_worktree_fingerprint). Neither binds the
# byte content of a checker script edited in an earlier batch, a shared
# imported module, a tracked config/registry/fixture, or the Python
# interpreter executing the commands. H0 replaces those two fields with one
# canonicalized snapshot of every Git-tracked file plus every untracked
# non-ignored regular file, plus an explicit interpreter identity record. Any
# unsafe, unreadable, non-regular, or unstable-during-read input makes reuse
# unavailable rather than silently narrowing the snapshot.


def _normalize_repo_relative_path(raw: str) -> str | None:
    """Return a safe, forward-slash-normalized, repository-relative path, or
    None if the path is absolute, escapes the repository root, or is
    otherwise unsafe."""
    if not raw:
        return None
    candidate = raw.replace("\\", "/")
    if candidate.startswith("/") or ":" in candidate:
        return None
    parts = candidate.split("/")
    if any(part in ("", ".", "..") for part in parts):
        return None
    return candidate


def _git_ls_files(args: tuple[str, ...]) -> tuple[str, ...]:
    proc = subprocess.run(
        ["git", "ls-files", "-z", *args],
        cwd=REPO_ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if proc.returncode != 0:
        raise VerifierIdentityUnavailable(
            f"git ls-files failed (exit {proc.returncode})"
        )
    raw = proc.stdout.decode("utf-8", errors="strict")
    return tuple(part for part in raw.split("\0") if part)


def _snapshot_membership(command_argv_paths: frozenset[str]) -> frozenset[str]:
    """Union of every Git-tracked path and every untracked non-ignored
    regular-file path. Every repository-relative path directly named in
    selected command argv must already occur in that union; an ignored or
    unresolved command input makes identity unavailable rather than silently
    narrowing the snapshot or hashing ignored material."""
    try:
        tracked = _git_ls_files(())
        untracked = _git_ls_files(("--others", "--exclude-standard"))
    except VerifierIdentityUnavailable:
        raise
    members: set[str] = set()
    for raw in (*tracked, *untracked):
        normalized = _normalize_repo_relative_path(raw)
        if normalized is None:
            raise VerifierIdentityUnavailable(f"unsafe tracked path: {raw!r}")
        members.add(normalized)
    missing_argv = command_argv_paths - members
    if missing_argv:
        raise VerifierIdentityUnavailable(
            f"command file(s) absent from safe snapshot: {sorted(missing_argv)}"
        )
    return frozenset(members)


def _file_identity_record(path: str) -> dict[str, str]:
    """Hash one snapshot member with a read-instability guard: compare file
    size/mtime before and after the byte read; a change during read makes the
    input unavailable rather than silently accepted."""
    full = REPO_ROOT / path
    try:
        before = full.stat()
    except OSError as exc:
        raise VerifierIdentityUnavailable(f"missing or unreadable path: {path} ({exc})")
    if full.is_symlink() or not full.is_file():
        raise VerifierIdentityUnavailable(f"non-regular snapshot member: {path}")
    try:
        data = full.read_bytes()
        after = full.stat()
    except OSError as exc:
        raise VerifierIdentityUnavailable(f"unreadable path during read: {path} ({exc})")
    if (
        before.st_dev != after.st_dev
        or before.st_ino != after.st_ino
        or before.st_size != after.st_size
        or before.st_mtime_ns != after.st_mtime_ns
    ):
        raise VerifierIdentityUnavailable(f"unstable input during read: {path}")
    if len(data) != after.st_size:
        raise VerifierIdentityUnavailable(f"unstable input during read: {path}")
    return {"path": path, "sha256": hashlib.sha256(data).hexdigest()}


_MISSING_TRACKED_MARKER = "MISSING_TRACKED_PATH"


def _tracked_missing_record(path: str) -> dict[str, str]:
    return {"path": path, "sha256": _MISSING_TRACKED_MARKER}


def _command_argv_repo_paths(commands: tuple[GateCommand, ...]) -> frozenset[str]:
    """Every argv token across the selected commands that resolves to a real
    repository-relative file path. Each must become a safe snapshot member;
    an ignored or unresolved command file makes reuse unavailable."""
    candidates: set[str] = set()
    for command in commands:
        for token in command.command:
            normalized = _normalize_repo_relative_path(token)
            if normalized is None:
                continue
            full = REPO_ROOT / normalized
            if full.is_file():
                candidates.add(normalized)
                continue
            file_like = "/" in normalized or bool(Path(normalized).suffix)
            if file_like:
                state = "non-regular" if full.exists() else "missing"
                raise VerifierIdentityUnavailable(
                    f"{state} repository-relative command input: {normalized}"
                )
    return frozenset(candidates)


def _interpreter_identity() -> dict[str, str]:
    executable_raw = sys.executable
    if not executable_raw:
        raise VerifierIdentityUnavailable("no resolved sys.executable")
    try:
        executable = Path(executable_raw).resolve(strict=True)
        if not executable.is_file():
            raise VerifierIdentityUnavailable("interpreter executable is not a file")
        executable_bytes = executable.read_bytes()
    except OSError as exc:
        raise VerifierIdentityUnavailable(f"unreadable interpreter executable: {exc}")
    executable_path = executable.as_posix()
    version_info = sys.version_info
    version = (
        f"{version_info.major}.{version_info.minor}.{version_info.micro}."
        f"{version_info.releaselevel}.{version_info.serial}"
    )
    cache_tag = getattr(sys.implementation, "cache_tag", None) or ""
    return {
        "implementation": sys.implementation.name,
        "cacheTag": cache_tag,
        "version": version,
        "executablePath": executable_path,
        "executableSha256": hashlib.sha256(executable_bytes).hexdigest(),
    }


def _verifier_identity_preimage(
    commands: tuple[GateCommand, ...],
) -> dict[str, object]:
    """Build the canonical preimage object. Raises VerifierIdentityUnavailable
    on any unsafe, unresolved, non-regular, unreadable or unstable input."""
    argv_paths = _command_argv_repo_paths(commands)
    members = _snapshot_membership(argv_paths)
    missing_argv = argv_paths - members
    if missing_argv:
        raise VerifierIdentityUnavailable(
            f"command file(s) not resolvable as safe snapshot members: {sorted(missing_argv)}"
        )
    files: list[dict[str, str]] = []
    for path in sorted(members):
        full = REPO_ROOT / path
        if not full.exists():
            files.append(_tracked_missing_record(path))
            continue
        files.append(_file_identity_record(path))
    return {
        "profile": VERIFIER_IDENTITY_PROFILE,
        "digestAlgorithm": "sha256",
        "files": files,
        "interpreter": _interpreter_identity(),
    }


def _verifier_identity_digest(commands: tuple[GateCommand, ...]) -> str:
    """Return the verifier-identity digest, or raise
    VerifierIdentityUnavailable on any incomplete/unsafe/unstable input."""
    preimage = _verifier_identity_preimage(commands)
    return hashlib.sha256(_jcs_bytes(preimage)).hexdigest()


def _validate_receipt_integrity(payload: dict) -> tuple[bool, str]:
    return machine_verification._validate_receipt_integrity(payload)


def _receipt_context(
    phase: str,
    base: str,
    head: str,
    base_sha: str,
    head_sha: str,
    commands: tuple[GateCommand, ...],
) -> dict[str, str]:
    return {
        "phase": phase,
        "base": base,
        "head": head,
        "baseSha": base_sha,
        "headSha": head_sha,
        "commandManifestHash": _command_manifest_hash(commands),
        "worktreeFingerprint": _worktree_fingerprint(base, head),
        "verifierIdentityProfile": VERIFIER_IDENTITY_PROFILE,
    }


def _load_valid_receipt(path: Path, expected: dict[str, str]) -> tuple[bool, str]:
    if not path.is_file():
        return False, "receipt missing"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return False, f"receipt unreadable: {exc}"
    valid, reason = _validate_receipt_integrity(payload)
    if not valid:
        return False, reason
    for key, value in expected.items():
        if payload.get(key) != value:
            return False, f"receipt {key} mismatch"
    return True, "exact receipt context match"


def _write_receipt(
    path: Path,
    context: dict[str, str],
    results: tuple[GateResult, ...],
    total_duration_s: float,
    verifier_identity_digest: str,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    machine_verification = _machine_verification_object(
        context, verifier_identity_digest, results
    )
    receipt_digest = _machine_verification_digest(machine_verification)
    payload = {
        "schema": RECEIPT_SCHEMA,
        "status": "PASS",
        **context,
        "verifierIdentityDigest": verifier_identity_digest,
        "machineVerification": machine_verification,
        "receiptDigest": receipt_digest,
        "totalDurationSeconds": round(total_duration_s, 3),
        "checks": [
            {
                "name": result.name,
                "command": list(result.command),
                "durationSeconds": round(result.duration_s, 3),
                "status": "PASS",
            }
            for result in results
        ],
    }
    temp_path = path.with_suffix(".tmp")
    temp_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    temp_path.replace(path)


def _git_status_short() -> GitStatusResult:
    proc = subprocess.run(
        ["git", "status", "--short"],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return GitStatusResult(
        returncode=proc.returncode,
        stdout=proc.stdout.strip(),
        stderr=proc.stderr.strip(),
    )


def _closure_worktree_finality_failures() -> int:
    status = _git_status_short()
    if status.stderr:
        print("Git status diagnostics:")
        print(status.stderr)
    if status.returncode != 0:
        print("FAIL: git status --short failed during closure finality.")
        return 1
    if status.stdout:
        print(status.stdout)
        print(
            "FAIL: pre-closure cannot claim CLOSED while worktree changes are "
            "uncommitted, untracked, or otherwise unresolved."
        )
        return 1
    print("PASS: worktree is clean for closure claim finality.")
    return 0


def _git_rev_parse(ref: str) -> str:
    proc = subprocess.run(
        ["git", "rev-parse", "--short", ref],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stdout.strip() or f"failed to resolve {ref}")
    return proc.stdout.strip()


def _git_diff_name_status(base: str, head: str) -> str:
    proc = subprocess.run(
        ["git", "diff", "--name-status", f"{base}..{head}"],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if proc.returncode != 0:
        return proc.stdout.strip()
    return proc.stdout.strip()


def _range_shape_preflight(phase: str, base: str, head: str) -> int:
    if phase not in {"pre-closure", "pre-push"}:
        return 0

    plan = steward.build_path_plan(base, head)
    if not plan.exact_manifest_collision_risk:
        return 0

    print("\n=== committed range shape preflight ===")
    print(
        "FAIL: range mixes Agent Operation Trace exact-manifest artifacts with "
        "protected session/handoff paths."
    )
    print("This range is not valid closure evidence for a single exact-manifest batch.")
    print("Run split ranges instead: material range first, then closure/session range.")
    print(f"Recommended steward lane: {steward._recommended_mode(plan)}")
    if plan.trace_artifact_paths:
        print("Trace artifacts:")
        for path in plan.trace_artifact_paths:
            print(f"  - {path}")
    if plan.protected_session_paths:
        print("Protected session/handoff paths:")
        for path in plan.protected_session_paths:
            print(f"  - {path}")
    return 1


def _default_base_for_phase(phase: str) -> str:
    if phase in {"pre-closure", "pre-push"}:
        return "HEAD~1"
    return "HEAD"


def _run_phase(
    phase: str,
    base: str | None,
    head: str,
    *,
    serial: bool = False,
    max_workers: int = 6,
    reuse_valid_receipt: bool = False,
    receipt_dir: Path = DEFAULT_RECEIPT_DIR,
) -> int:
    total_started = time.perf_counter()
    resolved_base = base or _default_base_for_phase(phase)
    print("=== CVF Agent Autorun Workflow Gate ===")
    print(f"Phase: {phase}")
    print("Policy: docs/reference/CVF_AGENT_AUTORUN_WORKFLOW_CONTROL_STANDARD_2026-05-28.md")
    print(f"Range: {resolved_base}..{head}")

    try:
        base_sha = _git_rev_parse(resolved_base)
        head_sha = _git_rev_parse(head)
    except RuntimeError as exc:
        print(f"FAIL: could not resolve autorun gate range: {exc}")
        return 1
    print(f"Base HEAD anchor: {base_sha}")
    print(f"Head anchor: {head_sha}")

    failures = 0
    common_commands: list[GateCommand] = list(_common_commands(resolved_base, head))

    # At pre-implementation, prepend phase-specific early-diagnostic commands
    # (forbidden filesystem state plus the AAF early diagnostics wire-in) so a
    # worker sees local defects before writing material files. See
    # _pre_implementation_commands for the per-command rationale.
    if phase == "pre-implementation":
        phase_commands = _pre_implementation_commands(resolved_base, head)
        common_commands[:0] = phase_commands

    if phase in {"pre-closure", "pre-push"} and base_sha == head_sha:
        print(
            "FAIL: closure/push autorun gates require a non-empty committed "
            "range. Pass --base <baseHead> --head HEAD or run after a commit "
            "with default HEAD~1..HEAD."
        )
        failures += 1
    elif phase in {"pre-closure", "pre-push"}:
        changed = _git_diff_name_status(resolved_base, head)
        print("\n=== committed range evidence ===")
        print(changed if changed else "No committed files changed in range.")
        if not changed:
            print("FAIL: closure/push range has no committed diff evidence.")
            failures += 1
        range_shape_failures = _range_shape_preflight(phase, resolved_base, head)
        if range_shape_failures:
            print(
                f"\nVIOLATION: {phase} blocked by committed range shape before "
                "running the full guard bundle."
            )
            return 1

    common_tuple = tuple(common_commands)
    trailing_commands = PRE_PUSH_COMMANDS if phase == "pre-push" else ()
    all_commands = common_tuple + trailing_commands
    context = _receipt_context(
        phase,
        resolved_base,
        head,
        base_sha,
        head_sha,
        all_commands,
    )
    receipt_path = _receipt_path(phase, receipt_dir)
    pre_run_identity_digest: str | None
    pre_run_identity_error: str | None
    try:
        pre_run_identity_digest = _verifier_identity_digest(all_commands)
        pre_run_identity_error = None
    except VerifierIdentityUnavailable as exc:
        pre_run_identity_digest = None
        pre_run_identity_error = str(exc)

    if reuse_valid_receipt:
        if pre_run_identity_digest is None:
            print(
                f"\nReceipt reuse unavailable (verifier identity: {pre_run_identity_error}); "
                "running full autorun bundle."
            )
        else:
            expected = {**context, "verifierIdentityDigest": pre_run_identity_digest}
            valid, reason = _load_valid_receipt(receipt_path, expected)
            if valid:
                print(f"\nREUSED: {reason}: {receipt_path}")
                print(f"COMPLIANT: {phase} autorun gate passed from exact local PASS receipt.")
                return 0
            print(f"\nReceipt reuse unavailable ({reason}); running full autorun bundle.")

    results = _run_commands(
        common_tuple,
        parallel=not serial,
        max_workers=max_workers,
    )
    failures += sum(result.returncode != 0 for result in results)
    trailing_results = _run_commands(
        trailing_commands,
        parallel=False,
        max_workers=1,
    )
    failures += sum(result.returncode != 0 for result in trailing_results)
    all_results = results + trailing_results

    if phase == "pre-closure":
        print("\n=== closure worktree finality ===")
        failures += _closure_worktree_finality_failures()

    if failures:
        elapsed = time.perf_counter() - total_started
        print(
            f"\nVIOLATION: {phase} blocked by {failures} failing gate(s) "
            f"in {elapsed:.2f}s."
        )
        return 1

    elapsed = time.perf_counter() - total_started
    if pre_run_identity_digest is None:
        print(
            f"\nNo reusable receipt written (verifier identity unavailable pre-run: "
            f"{pre_run_identity_error})."
        )
        print(f"COMPLIANT: {phase} autorun gate passed in {elapsed:.2f}s.")
        return 0

    try:
        post_run_identity_digest = _verifier_identity_digest(all_commands)
    except VerifierIdentityUnavailable as exc:
        print(f"\nNo reusable receipt written (verifier identity unavailable post-run: {exc}).")
        print(f"COMPLIANT: {phase} autorun gate passed in {elapsed:.2f}s.")
        return 0

    if pre_run_identity_digest != post_run_identity_digest:
        print(
            "\nNo reusable receipt written (verifier identity drifted during "
            "execution; PASS reflects only the commands that ran)."
        )
        print(f"COMPLIANT: {phase} autorun gate passed in {elapsed:.2f}s.")
        return 0

    _write_receipt(receipt_path, context, all_results, elapsed, post_run_identity_digest)
    print(f"\nReceipt: {receipt_path}")
    print(f"COMPLIANT: {phase} autorun gate passed in {elapsed:.2f}s.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Run CVF agent autorun workflow gate")
    parser.add_argument(
        "--phase",
        choices=("pre-dispatch", "pre-implementation", "pre-closure", "pre-push"),
        required=True,
    )
    parser.add_argument(
        "--base",
        default=None,
        help="Base commit/ref for range-aware gates. Defaults to HEAD for pre-dispatch/pre-implementation and HEAD~1 for pre-closure/pre-push.",
    )
    parser.add_argument("--head", default="HEAD", help="Head commit/ref for range-aware gates.")
    parser.add_argument("--serial", action="store_true", help="Run commands serially for debugging.")
    parser.add_argument("--max-workers", type=int, default=6, help="Maximum parallel common checks.")
    parser.add_argument(
        "--reuse-valid-receipt",
        action="store_true",
        help="Reuse only an exact local PASS receipt; otherwise run the full bundle.",
    )
    parser.add_argument(
        "--receipt-dir",
        type=Path,
        default=DEFAULT_RECEIPT_DIR,
        help="Local ignored autorun receipt directory.",
    )
    args = parser.parse_args()
    return _run_phase(
        args.phase,
        args.base,
        args.head,
        serial=args.serial,
        max_workers=args.max_workers,
        reuse_valid_receipt=args.reuse_valid_receipt,
        receipt_dir=args.receipt_dir,
    )


if __name__ == "__main__":
    sys.exit(main())
