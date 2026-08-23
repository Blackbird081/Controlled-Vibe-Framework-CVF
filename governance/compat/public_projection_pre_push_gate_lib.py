#!/usr/bin/env python3
"""CVF Public Projection Pre-Push Gate - Library Helper.

Amendment 2 structural extraction: cohesive non-CLI implementation moved
out of `governance/compat/run_public_projection_pre_push_gate.py` into
this module, with zero behavioral change, to satisfy the
`python_cli_orchestrator` / `python_test` governed size guard
(`governance/compat/check_python_automation_size.py`). The CLI runner
imports every symbol below; nothing in this module imports from the
runner, so there is no circular dependency.

Contains: the fail-closed exception hierarchy and `CheckResult` shared
type; public-root invariant capture/diff; the full disposable-sandbox
lifecycle (materialization, hash verification, copy-isolated dependency
linking, teardown); the four inherited-debt family checkers; and
command-output normalization/evidence-extraction helpers.
"""

from __future__ import annotations

import ctypes
import json
import os
import re
import shutil
import subprocess
import tarfile
import tempfile
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SANDBOX_HASH_VERIFICATION_SUFFIXES = (".json", ".ts", ".tsx", ".md", ".js")

# Dependency entries that must be a full physical copy directly inside the
# sandbox's own node_modules rather than a junction/hard-link to a support-
# owned copy. `next` specifically: webpack's default `resolve.symlinks: true`
# realpaths through any junction in the resolution chain (including a
# junction targeting a support-dir copy, not just one targeting the real
# repository), so only an entry with zero junctions anywhere in its path
# resolves entirely inside the sandbox from webpack's point of view.
FULL_COPY_DEPENDENCY_ENTRIES: frozenset[str] = frozenset({"next"})

MAX_CAPTURED_OUTPUT_CHARS = 2000


class GateFailClosed(Exception):
    """Raised for any fail-closed validation defect."""


@dataclass
class CheckResult:
    check_id: str
    ownerApplicability: str
    family: str
    outcome: str  # PASS | GATE | REPORT
    detail: str
    evidence: dict[str, Any] = field(default_factory=dict)


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


def capture_public_root_invariants(root: Path, timeout: int) -> dict[str, Any]:
    """Capture HEAD, branch, and full status (including untracked) plus
    staged/unstaged diff for the real public root. Called once before the
    first sandbox is materialized and once after the last sandbox's
    teardown completes; the two captures must be byte-identical.
    """
    code, head, err = _run_git(root, ["rev-parse", "HEAD"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to capture public root HEAD for invariant check: {err or head}")
    code, branch, err = _run_git(root, ["branch", "--show-current"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to capture public root branch for invariant check: {err or branch}")
    code, status, err = _run_git(root, ["status", "--porcelain", "--untracked-files=all"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to capture public root status for invariant check: {err or status}")
    code, staged_diff, err = _run_git(root, ["diff", "--cached"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to capture public root staged diff for invariant check: {err or staged_diff}")
    code, unstaged_diff, err = _run_git(root, ["diff"], timeout)
    if code != 0:
        raise GateFailClosed(f"unable to capture public root unstaged diff for invariant check: {err or unstaged_diff}")
    return {
        "head": head,
        "branch": branch,
        "status": status,
        "stagedDiff": staged_diff,
        "unstagedDiff": unstaged_diff,
    }


def diff_public_root_invariants(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    diffs: list[str] = []
    for key in ("head", "branch", "status", "stagedDiff", "unstagedDiff"):
        if before.get(key) != after.get(key):
            diffs.append(key)
    return diffs


# ---------------------------------------------------------------------------
# Sandbox lifecycle (Amendment 1): materialization, hash verification,
# dependency isolation, and teardown for mutating package commands. Every
# function here operates strictly on paths inside a disposable sandbox
# directory (never inside `root`, the real public root, and never inside
# the private Core).
# ---------------------------------------------------------------------------


class SandboxError(GateFailClosed):
    """Raised for any sandbox lifecycle failure; always fail-closed."""


def _assert_inside(path: Path, container: Path, what: str) -> None:
    """Assert `path` itself (its own location, not what it points to if it
    is a junction/symlink) sits inside `container`. Used to verify a
    created junction was placed inside the sandbox - the junction's own
    parent-relative location, not its resolved target, which for a
    dependency-store junction is deliberately outside the sandbox.
    """
    resolved_path = path.absolute()
    resolved_container = container.resolve()
    try:
        resolved_path.relative_to(resolved_container)
    except ValueError as exc:
        raise SandboxError(f"{what} is not located inside its required container: {resolved_path} not under {resolved_container}") from exc


def _assert_target_inside(path: Path, container: Path, what: str) -> None:
    """Assert `path` resolves (following junctions/symlinks) to a location
    inside `container`. Used only for sibling-redirect junctions, whose
    target must land inside the sandbox's own extracted EXTENSIONS/ tree -
    never for third-party dependency junctions, which deliberately resolve
    outside the sandbox into the real public root's node_modules.
    """
    resolved_path = path.resolve()
    resolved_container = container.resolve()
    try:
        resolved_path.relative_to(resolved_container)
    except ValueError as exc:
        raise SandboxError(f"{what} resolves outside its required container: {resolved_path} not under {resolved_container}") from exc


def materialize_sandbox(root: Path, head: str, timeout: int) -> tuple[Path, Path]:
    """Create a fresh temp sandbox dir and a dedicated temp support dir,
    then extract `git archive <head>` from the real public root's object
    store (read-only) into the sandbox. Returns (sandbox_dir, support_dir).
    """
    token = uuid.uuid4().hex[:12]
    base_temp = Path(tempfile.gettempdir())
    sandbox_dir = base_temp / f"cvf-pp-sandbox-{token}"
    support_dir = base_temp / f"cvf-pp-sandbox-support-{token}"

    for path in (sandbox_dir, support_dir):
        if path.exists():
            raise SandboxError(f"sandbox path collision, refusing to reuse: {path}")

    try:
        sandbox_dir.mkdir(parents=True, exist_ok=False)
        support_dir.mkdir(parents=True, exist_ok=False)
    except OSError as exc:
        raise SandboxError(f"sandbox creation failed: {exc}") from exc

    archive_path = support_dir / "candidate.tar"
    try:
        with archive_path.open("wb") as handle:
            proc = subprocess.run(
                ["git", "archive", head],
                cwd=root,
                stdout=handle,
                stderr=subprocess.PIPE,
                timeout=timeout,
            )
    except subprocess.TimeoutExpired as exc:
        raise SandboxError(f"git archive timed out after {timeout}s") from exc
    except OSError as exc:
        raise SandboxError(f"git archive failed to launch: {exc}") from exc
    if proc.returncode != 0:
        raise SandboxError(f"git archive exited nonzero ({proc.returncode}): {proc.stderr.decode('utf-8', 'replace')}")

    # Extracted with Python's own tarfile module rather than shelling out to
    # an external `tar` binary: `git archive`'s pax-format entries carry
    # UTF-8 filenames, and the external `tar` observed on this platform
    # mis-decodes non-ASCII filenames (confirmed by direct comparison
    # against `git ls-tree`'s UTF-8 output) regardless of locale
    # environment variables. tarfile with `errors="utf-8"` extracts the
    # exact bytes Git wrote.
    try:
        with tarfile.open(archive_path, mode="r", errors="utf-8") as archive:
            archive.extractall(path=sandbox_dir, filter="data")
    except tarfile.TarError as exc:
        raise SandboxError(f"sandbox tar extraction failed: {exc}") from exc
    except OSError as exc:
        raise SandboxError(f"sandbox tar extraction failed: {exc}") from exc

    return sandbox_dir, support_dir


def verify_sandbox_materialization(root: Path, sandbox_dir: Path, head: str, manifest: list[str], timeout: int) -> None:
    """Fail closed if the sandbox's extracted path set or the content hash
    of any manifest path diverges from `head` as read from the real
    public root's object store.
    """
    code, out, err = _run_git(root, ["ls-tree", "-r", "--name-only", head], timeout)
    if code != 0:
        raise SandboxError(f"unable to list tree for materialization verification: {err or out}")
    expected_paths = {p for p in out.splitlines() if p.strip()}

    sandbox_paths: set[str] = set()
    for candidate in sandbox_dir.rglob("*"):
        if candidate.is_file():
            sandbox_paths.add(str(candidate.relative_to(sandbox_dir)).replace("\\", "/"))

    missing = sorted(expected_paths - sandbox_paths)
    extra = sorted(sandbox_paths - expected_paths)
    if missing or extra:
        raise SandboxError(
            "SANDBOX_MATERIALIZATION_MISMATCH: sandbox path set diverges from "
            f"authorizedCandidateHead tree: {len(missing)} missing, {len(extra)} extra"
        )

    for rel_path in manifest:
        if not rel_path.endswith(SANDBOX_HASH_VERIFICATION_SUFFIXES):
            continue
        code, expected_content, err = _run_git(root, ["show", f"{head}:{rel_path}"], timeout)
        if code != 0:
            raise SandboxError(f"unable to read pinned content for manifest path {rel_path!r}: {err}")
        sandbox_file = sandbox_dir / rel_path
        if not sandbox_file.exists():
            raise SandboxError(f"SANDBOX_MATERIALIZATION_MISMATCH: manifest path missing in sandbox: {rel_path}")
        actual_content = sandbox_file.read_text(encoding="utf-8", errors="replace").replace("\r\n", "\n")
        if actual_content.strip("\n") != expected_content.strip("\n"):
            raise SandboxError(f"SANDBOX_MATERIALIZATION_MISMATCH: content diverges for manifest path: {rel_path}")


def is_junction(path: Path) -> bool:
    """Detect a Windows directory junction (a reparse point) without relying
    on `Path.is_junction()` (Python 3.12+ only). Used to prove a
    `full_copy_entries` entry like `next` is a genuine physical directory,
    not a junction, per R-02 item 4.
    """
    if os.name != "nt" or not path.is_dir():
        return False
    attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
    if attrs == -1:
        return False
    FILE_ATTRIBUTE_REPARSE_POINT = 0x400
    return bool(attrs & FILE_ATTRIBUTE_REPARSE_POINT)


def create_junction(link_path: Path, target_path: Path, timeout: int) -> None:
    """Create a directory junction. `target_path` must be a directory;
    Windows junctions cannot target a file. Use `create_link` for entries
    of unknown or file type.
    """
    if link_path.exists():
        raise SandboxError(f"junction target already exists, refusing to overwrite: {link_path}")
    if not target_path.exists():
        raise SandboxError(f"junction source does not exist: {target_path}")
    script = (
        f"New-Item -ItemType Junction -Path '{link_path}' -Target '{target_path}' -ErrorAction Stop | Out-Null"
    )
    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired as exc:
        raise SandboxError(f"junction creation timed out after {timeout}s: {link_path}") from exc
    except OSError as exc:
        raise SandboxError(f"junction creation failed to launch: {exc}") from exc
    if proc.returncode != 0:
        raise SandboxError(
            f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: junction creation failed for {link_path}: {proc.stderr.strip()}"
        )


def create_link(link_path: Path, target_path: Path, timeout: int) -> None:
    """Create a link from `link_path` to `target_path`, where `target_path`
    is always a support-directory-owned copy (never a path inside a real
    repository - callers must copy into `support_dir` first via
    `copy_dependency_entry`): a directory junction for a directory target,
    or a hard link for a file target (Windows junctions cannot target
    files; a hard link within the same temp volume costs no extra disk
    space and, since both `target_path` and `link_path` are already
    support/sandbox-owned copies rather than real-repository files, cannot
    reach back into either real repository regardless of write behavior).
    If the hard link fails (e.g. a cross-volume temp configuration), the
    file is copied instead.
    """
    if link_path.exists():
        raise SandboxError(f"link target already exists, refusing to overwrite: {link_path}")
    if not target_path.exists():
        raise SandboxError(f"link source does not exist: {target_path}")
    if target_path.is_dir():
        create_junction(link_path, target_path, timeout)
        return
    try:
        os.link(target_path, link_path)
    except OSError:
        try:
            shutil.copy2(target_path, link_path)
        except OSError as exc:
            raise SandboxError(
                f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: hard link and copy fallback both failed for {link_path}: {exc}"
            ) from exc


def copy_dependency_entry(source_path: Path, dest_path: Path) -> None:
    """Physically copy one `node_modules` entry (file or directory tree)
    from a real repository's installed dependency store into a temporary
    support directory. This is a copy, never a hard link: a hard link
    aliases the same underlying file as the source, so a write reachable
    through the sandbox (directly, or indirectly through a build tool that
    writes into its own `node_modules`, e.g. a cache or lockfile touch)
    would mutate the real repository's dependency store even though no
    Git-tracked file changed. AC-03 requires real repositories to be
    read-only copy sources only, never live link targets, so every byte
    used by the sandbox must be independently owned by the support
    directory before anything links to it.
    """
    if dest_path.exists():
        raise SandboxError(f"dependency copy target already exists, refusing to overwrite: {dest_path}")
    if not source_path.exists():
        raise SandboxError(f"dependency copy source does not exist: {source_path}")
    try:
        if source_path.is_dir():
            shutil.copytree(source_path, dest_path, symlinks=False)
        else:
            shutil.copy2(source_path, dest_path)
    except OSError as exc:
        raise SandboxError(
            f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: dependency copy failed for {dest_path}: {exc}"
        ) from exc
    if not dest_path.exists():
        raise SandboxError(f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: dependency copy did not produce expected path: {dest_path}")


def isolate_dependencies(
    root: Path,
    sandbox_dir: Path,
    support_dir: Path,
    package_dirs: list[str],
    sibling_redirects: list[str],
    timeout: int,
    *,
    full_copy_entries: frozenset[str] = FULL_COPY_DEPENDENCY_ENTRIES,
) -> None:
    """For each sandboxed package directory, build a real (non-junctioned)
    `node_modules` directory inside the sandbox, populated entry-by-entry.

    Per AC-03, the real public root is a read-only copy source only and is
    never a live link target: every third-party package is first physically
    copied from the real public root's already-installed store into its own
    dedicated subtree of `support_dir` (a temporary directory outside both
    repository roots), and only then junctioned (directories) or hard-linked
    (files, within the same temp volume) from that support-owned copy into
    the sandbox's `node_modules`. No sandbox entry's resolved target is ever
    allowed to land inside `root` (the real public root) or the private
    Core - `_assert_target_inside` proves every dependency link resolves
    inside the sandbox-or-support boundary before it is accepted.

    Entries named in `full_copy_entries` (currently just `next`) skip the
    store-and-link path entirely and are instead physically copied straight
    into the sandbox's own `node_modules`, with no junction step at all.
    This is required for `next` specifically: webpack's default
    `resolve.symlinks: true` realpaths through a junction/hard-link during
    module resolution, so even a support-owned junction target still
    resolves outside the sandbox from webpack's point of view. A entry with
    no junction anywhere in its path has no realpath to escape through.

    Sibling `cvf-*` packages are redirected instead to the sandbox's own
    extracted EXTENSIONS/ source (never copied from the real store, since
    the sandbox's own git-archive extraction already has the pinned code),
    so relative imports resolve inside the sandbox and never back into the
    real public root.

    The sandbox `node_modules` directory itself is never a junction: if it
    were, writing or reading through it would transparently reach the real
    public root's `node_modules`, defeating isolation. Only its individual
    entries are junctions/hard links (or, for `full_copy_entries`, plain
    copies), each independently verified to resolve inside the
    sandbox-or-support boundary.
    """
    dependency_store_dir = support_dir / "dependency-store"
    try:
        dependency_store_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise SandboxError(f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: cannot create dependency store: {exc}") from exc

    for package_dir in package_dirs:
        real_node_modules = root / package_dir / "node_modules"
        sandbox_package_dir = sandbox_dir / package_dir
        sandbox_node_modules = sandbox_package_dir / "node_modules"
        store_package_dir = dependency_store_dir / package_dir
        store_node_modules = store_package_dir / "node_modules"

        if not real_node_modules.exists():
            raise SandboxError(
                f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: real public root has no installed "
                f"node_modules to use as a read-only copy source for {package_dir}"
            )
        if not sandbox_package_dir.exists():
            raise SandboxError(f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: sandbox package directory missing: {sandbox_package_dir}")

        try:
            sandbox_node_modules.mkdir(parents=True, exist_ok=True)
            store_node_modules.mkdir(parents=True, exist_ok=True)
        except OSError as exc:
            raise SandboxError(f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: cannot create node_modules directories: {exc}") from exc

        for entry in real_node_modules.iterdir():
            if entry.name in sibling_redirects:
                continue

            if entry.name in full_copy_entries:
                # `next` is copied twice, independently: once directly into
                # the sandbox's own node_modules (required so webpack's
                # module resolution for the application's own build never
                # crosses a junction), and once into the support-dir
                # dependency-store's own node_modules (required because a
                # store-resident package like eslint-config-next resolves
                # `require("next/...")` relative to its own location in the
                # store, not relative to the sandbox - Node's module
                # resolution walks up from the requiring module's own path,
                # so a copy that exists only in the sandbox is invisible to
                # a package that itself lives in the store).
                full_copy_path = sandbox_node_modules / entry.name
                copy_dependency_entry(entry, full_copy_path)
                _assert_target_inside(full_copy_path, sandbox_dir, f"full-copy dependency for {entry.name}")

                store_copy_path = store_node_modules / entry.name
                copy_dependency_entry(entry, store_copy_path)
                _assert_target_inside(store_copy_path, support_dir, f"full-copy dependency store peer for {entry.name}")
                continue

            store_entry = store_node_modules / entry.name
            copy_dependency_entry(entry, store_entry)

            link_path = sandbox_node_modules / entry.name
            if link_path.exists():
                raise SandboxError(
                    f"SANDBOX_DEPENDENCY_ISOLATION_FAILURE: sandbox node_modules entry already "
                    f"exists before linking (unexpected tracked node_modules content): {link_path}"
                )
            create_link(link_path, store_entry, timeout)
            _assert_inside(link_path, sandbox_dir, f"dependency link for {entry.name}")
            if store_entry.is_dir():
                # A directory entry is linked via a junction, whose resolved
                # target is the support-owned copy - verify it lands inside
                # the support boundary specifically.
                _assert_target_inside(link_path, support_dir, f"dependency link target for {entry.name}")
            else:
                # A file entry is a hard link (or copy fallback): its
                # resolved path is its own on-disk location, not a separate
                # target to follow, so the sandbox boundary applies, not the
                # support boundary.
                _assert_target_inside(link_path, sandbox_dir, f"dependency link target for {entry.name}")

        for sibling in sibling_redirects:
            sandbox_extensions_target = _find_sandbox_extensions_dir_for_sibling(sandbox_dir, sibling)
            if sandbox_extensions_target is None:
                continue
            sibling_link = sandbox_node_modules / sibling
            if sibling_link.exists():
                # The sandbox's git-archive extraction can legitimately
                # contain a tracked, non-junctioned copy of the sibling
                # package (this is exactly the naive topology this
                # amendment redirects away from) - remove it before
                # junctioning the sandbox-local replacement.
                shutil.rmtree(sibling_link)
            create_junction(sibling_link, sandbox_extensions_target, timeout)
            _assert_inside(sibling_link, sandbox_dir, f"sibling redirect junction for {sibling}")
            _assert_target_inside(sibling_link, sandbox_dir, f"sibling redirect target for {sibling}")


def _find_sandbox_extensions_dir_for_sibling(sandbox_dir: Path, sibling_package_name: str) -> Path | None:
    """Map an npm package name like `cvf-model-gateway` to its sandbox
    EXTENSIONS/<DIR> source directory by matching the package's own
    package.json `name` field, so the mapping does not depend on a
    hardcoded naming convention.
    """
    extensions_root = sandbox_dir / "EXTENSIONS"
    if not extensions_root.is_dir():
        return None
    for candidate in extensions_root.iterdir():
        package_json = candidate / "package.json"
        if not candidate.is_dir() or not package_json.exists():
            continue
        try:
            data = json.loads(package_json.read_text(encoding="utf-8", errors="replace"))
        except (json.JSONDecodeError, OSError):
            continue
        if data.get("name") == sibling_package_name:
            return candidate
    return None


def teardown_sandbox(sandbox_dir: Path, support_dir: Path) -> None:
    errors: list[str] = []
    for path in (sandbox_dir, support_dir):
        if not path.exists():
            continue
        try:
            shutil.rmtree(path)
        except OSError as exc:
            errors.append(f"{path}: {exc}")
    if errors or sandbox_dir.exists() or support_dir.exists():
        raise SandboxError(
            "SANDBOX_CLEANUP_FAILURE: temporary governed state may remain: " + "; ".join(errors or ["path still exists after rmtree"])
        )


# ---------------------------------------------------------------------------
# Inherited-debt family checkers: PASS/REPORT/GATE classification against a
# pinned, policy-configured subject.
# ---------------------------------------------------------------------------


def count_lines(path: Path) -> int | None:
    if not path.exists() or not path.is_file():
        return None
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        return sum(1 for _ in handle)


def check_governed_file_size(root: Path, family_cfg: dict[str, Any]) -> CheckResult:
    subject = family_cfg["subjectPath"]
    hard_threshold = int(family_cfg["hardThresholdLines"])
    pinned = int(family_cfg["pinnedLineCount"])
    actual = count_lines(root / subject)
    if actual is None:
        return CheckResult(
            "governed_file_size", "PUBLIC_OWNED", "governed_file_size", "GATE",
            f"{subject} is missing from the public candidate", {"subjectPath": subject},
        )
    if actual <= hard_threshold:
        return CheckResult(
            "governed_file_size", "PUBLIC_OWNED", "governed_file_size", "PASS",
            f"{subject} is within threshold ({actual} <= {hard_threshold})",
            {"subjectPath": subject, "actualLines": actual, "hardThresholdLines": hard_threshold},
        )
    if actual == pinned:
        return CheckResult(
            "governed_file_size", "PUBLIC_OWNED", "governed_file_size", "REPORT",
            f"{subject} exceeds threshold at exactly the pinned inherited value ({actual} lines)",
            {"subjectPath": subject, "actualLines": actual, "pinnedLineCount": pinned},
        )
    return CheckResult(
        "governed_file_size", "PUBLIC_OWNED", "governed_file_size", "GATE",
        f"{subject} regressed beyond pinned inherited debt: {actual} lines (pinned {pinned})",
        {"subjectPath": subject, "actualLines": actual, "pinnedLineCount": pinned},
    )


def check_governed_python_automation_size(root: Path, family_cfg: dict[str, Any]) -> CheckResult:
    subject = family_cfg["subjectPath"]
    hard_threshold = int(family_cfg["hardThresholdLines"])
    pinned = int(family_cfg["pinnedLineCount"])
    actual = count_lines(root / subject)
    if actual is None:
        return CheckResult(
            "governed_python_automation_size", "PUBLIC_OWNED", "governed_python_automation_size", "GATE",
            f"{subject} is missing from the public candidate", {"subjectPath": subject},
        )
    if actual <= hard_threshold:
        return CheckResult(
            "governed_python_automation_size", "PUBLIC_OWNED", "governed_python_automation_size", "PASS",
            f"{subject} is within threshold ({actual} <= {hard_threshold})",
            {"subjectPath": subject, "actualLines": actual, "hardThresholdLines": hard_threshold},
        )
    if actual == pinned:
        return CheckResult(
            "governed_python_automation_size", "PUBLIC_OWNED", "governed_python_automation_size", "REPORT",
            f"{subject} exceeds threshold at exactly the pinned inherited value ({actual} lines)",
            {"subjectPath": subject, "actualLines": actual, "pinnedLineCount": pinned},
        )
    return CheckResult(
        "governed_python_automation_size", "PUBLIC_OWNED", "governed_python_automation_size", "GATE",
        f"{subject} regressed beyond pinned inherited debt: {actual} lines (pinned {pinned})",
        {"subjectPath": subject, "actualLines": actual, "pinnedLineCount": pinned},
    )


def check_guard_registry_compatibility(root: Path, family_cfg: dict[str, Any]) -> CheckResult:
    subjects: list[str] = family_cfg["subjectPaths"]
    marker: str = family_cfg["requiredMarker"]
    pinned_missing: bool = bool(family_cfg["pinnedMissingGuardRegistrationRow"])

    missing_now: list[str] = []
    for subject in subjects:
        full = root / subject
        if not full.exists():
            return CheckResult(
                "guard_registry_compatibility", "PUBLIC_OWNED", "guard_registry_compatibility", "GATE",
                f"{subject} is missing from the public candidate", {"subjectPath": subject},
            )
        text = full.read_text(encoding="utf-8", errors="replace")
        if marker not in text:
            missing_now.append(subject)

    all_missing_now = len(missing_now) == len(subjects)
    if not missing_now:
        return CheckResult(
            "guard_registry_compatibility", "PUBLIC_OWNED", "guard_registry_compatibility", "PASS",
            f"guard-registration marker {marker!r} present in all subjects", {"subjectPaths": subjects},
        )
    if pinned_missing and all_missing_now:
        return CheckResult(
            "guard_registry_compatibility", "PUBLIC_OWNED", "guard_registry_compatibility", "REPORT",
            f"guard-registration marker {marker!r} remains absent, matching pinned inherited debt",
            {"subjectPaths": subjects, "missingNow": missing_now},
        )
    return CheckResult(
        "guard_registry_compatibility", "PUBLIC_OWNED", "guard_registry_compatibility", "GATE",
        f"guard-registration state diverges from pinned inherited debt: missing in {missing_now}",
        {"subjectPaths": subjects, "missingNow": missing_now, "pinnedMissing": pinned_missing},
    )


def check_pre_public_p3_readiness(root: Path, family_cfg: dict[str, Any]) -> CheckResult:
    subjects: list[str] = family_cfg["subjectPaths"]
    pinned_missing: bool = bool(family_cfg["pinnedMissingExposureClassificationReference"])

    absent: list[str] = []
    for subject in subjects:
        if not (root / subject).exists():
            absent.append(subject)

    if absent:
        return CheckResult(
            "pre_public_p3_readiness", "PUBLIC_OWNED", "pre_public_p3_readiness", "GATE",
            f"root exposure-classified file(s) missing from public candidate: {absent}",
            {"subjectPaths": subjects, "absent": absent},
        )

    # No exposure-classification registry is exported to the public tree
    # (it is a private-only registry per T0 Finding 3a); the check compares
    # only presence, which matches the pinned inherited state when true.
    if pinned_missing:
        return CheckResult(
            "pre_public_p3_readiness", "PUBLIC_OWNED", "pre_public_p3_readiness", "REPORT",
            "root files present with no exposure-classification reference, matching pinned inherited debt",
            {"subjectPaths": subjects},
        )
    return CheckResult(
        "pre_public_p3_readiness", "PUBLIC_OWNED", "pre_public_p3_readiness", "PASS",
        "root files present and pinned inherited debt marked resolved", {"subjectPaths": subjects},
    )


FAMILY_CHECKERS = {
    "governed_file_size": check_governed_file_size,
    "governed_python_automation_size": check_governed_python_automation_size,
    "guard_registry_compatibility": check_guard_registry_compatibility,
    "pre_public_p3_readiness": check_pre_public_p3_readiness,
}


# ---------------------------------------------------------------------------
# Command-output normalization and evidence extraction.
# ---------------------------------------------------------------------------


def truncate(text: str) -> str:
    if len(text) <= MAX_CAPTURED_OUTPUT_CHARS:
        return text
    return text[:MAX_CAPTURED_OUTPUT_CHARS] + f"... [truncated, {len(text)} chars total]"


def resolve_command_executable(cwd: Path, argv0: str, *, resolve_via_system_path: bool = False) -> Path | None:
    """Resolve argv[0] relative to the command's own working directory by
    default (never the public root itself when the command's
    workingDirectory is a subdirectory of it).

    Most configured commands in this policy are project-local binaries
    that ship inside the candidate's own node_modules/.bin, addressed
    relative to the package directory that owns that node_modules/.
    Resolving those against PATH would let an unrelated same-named
    executable elsewhere on the caller's machine silently stand in for the
    pinned candidate's tooling.

    A narrow exception exists for `resolveViaSystemPath: true` commands
    (currently only the `node` interpreter itself, invoked by the pinned
    build sequence): Node.js is a system-level build tool, not part of the
    candidate's own pinned dev dependencies, and does not ship inside
    node_modules/.bin. For that case only, PATH resolution via
    `shutil.which` is explicitly requested by the policy per-command,
    never assumed as a fallback.
    """
    if resolve_via_system_path:
        found = shutil.which(argv0)
        return Path(found) if found else None
    candidate = Path(argv0)
    resolved = candidate if candidate.is_absolute() else (cwd / candidate)
    resolved = resolved.resolve()
    if not resolved.exists() or not resolved.is_file():
        return None
    return resolved


ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")


def extract_observed_counts(output: str, expected: dict[str, Any]) -> dict[str, Any]:
    r"""Extract evidence counts (test/file counts, static page counts) from
    command output, for comparison against expectedEvidence. Per AC-04, a
    zero exit code alone is not sufficient when expectedEvidence is
    configured: a failed extraction (pattern not found) produces `None`
    for that key, which never equals a configured integer expectation, so
    the caller gates on the mismatch rather than treating extraction
    failure as silently acceptable.

    ANSI color escape codes are stripped before matching: real vitest/Next.js
    output interleaves them between label and value (for example
    `Test Files \x1b[22m \x1b[1m\x1b[32m30 passed`), which a plain `\s+`
    pattern does not span.
    """
    plain_output = ANSI_ESCAPE_RE.sub("", output)
    observed: dict[str, Any] = {}
    if "tests" in expected or "files" in expected:
        match = re.search(r"Test Files\s+(\d+)\s+passed.*?Tests\s+(\d+)\s+passed", plain_output, re.DOTALL)
        observed["files"] = int(match.group(1)) if match else None
        observed["tests"] = int(match.group(2)) if match else None
    if "staticPages" in expected:
        # Real Next.js output interleaves "using N workers" and repeats this
        # line once per progress increment (e.g. "(0/121)", "(30/121)", ...,
        # "(121/121)"); only the final, completed line has a matching
        # numerator/denominator, which the \1 backreference already selects
        # for - `.*?` (DOTALL) tolerates both the inserted worker-count text
        # and the intervening progress lines.
        match = re.search(r"Generating static pages.*?\((\d+)/\1\)", plain_output, re.DOTALL)
        observed["staticPages"] = int(match.group(1)) if match else None
    return observed
