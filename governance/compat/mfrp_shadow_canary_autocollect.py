#!/usr/bin/env python3
"""P4-C1 automatic natural-evidence collector.

Invoked once, synchronously, from ``.githooks/post-commit`` after every
commit lands. It never rewrites, amends, or reverts the commit that just
landed; it only ever writes to the ignored runtime directory
``.cvf/runtime/mfrp-p4-shadow-canary/``. It reuses the existing P2 receipt
validator (``agent_autorun_machine_verification._validate_receipt_integrity``
via ``agent_automation_machine_verification_readout.read_receipt_readonly``)
and the existing P4 append seam
(``mfrp_shadow_canary.append_observation`` / ``build_evidence``) -- it never
forks their digest, linkage, or classification logic.

Per the GC-018 P4-C1 baseline's Order Of Record And Trust Boundary: the
trusted disposition must already be committed before this collector ever
discloses a machine outcome. This module never authors a trusted disposition
-- it only reads one that a reviewer/closer already wrote into the committed
return bytes, exactly as ``mfrp_shadow_canary_core.build_initial_observation_row``
already does for the pinned R1B-R2 row.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

try:
    import mfrp_shadow_canary as canary
    import mfrp_shadow_canary_core as canary_core
    from agent_automation_machine_verification_readout import (
        build_machine_verification_readout,
        machine_readout_to_dict,
        read_receipt_readonly,
    )
except ModuleNotFoundError:
    from governance.compat import mfrp_shadow_canary as canary
    from governance.compat import mfrp_shadow_canary_core as canary_core
    from governance.compat.agent_automation_machine_verification_readout import (
        build_machine_verification_readout,
        machine_readout_to_dict,
        read_receipt_readonly,
    )

REPO_ROOT = canary_core.REPO_ROOT
RUNTIME_DIR = REPO_ROOT / ".cvf/runtime/mfrp-p4-shadow-canary"
PENDING_JOURNAL_PATH = RUNTIME_DIR / "pending_observations.json"
SAFETY_MARKER_PATH = RUNTIME_DIR / "UNRESOLVED_SAFETY_MARKER.json"
RECEIPT_DIR = REPO_ROOT / canary_core.IGNORED_RECEIPT_DIR
AUTORUN_GATE_PATH = "governance/compat/run_agent_autorun_workflow_gate.py"
GENERATED_RECEIPT_NAME = "pre-closure.json"

REVIEWS_GLOB_PREFIX = "docs/reviews/"

OBSERVATION_BLOCK_HEADING = "## P4 Automatic Evidence Observation Block"
FIELD_ELIGIBILITY = "p4ObservationEligibility"
FIELD_PHASE = "p4ObservationPhase"
FIELD_HARD_OBLIGATION_LOCATOR = "p4HardObligationLocator"
FIELD_HARD_OBLIGATION_PATTERN = "p4HardObligationPattern"
FIELD_SOURCE_AUTHORITY_LOCATOR = "p4SourceAuthorityLocator"

_NA_PATTERN = re.compile(r"^N/A with reason\b", re.IGNORECASE)


class CollectionSkipped(Exception):
    """Non-blocking skip: population/eligibility must not change."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.detail = detail


class CollectionUnsafe(Exception):
    """A safety-marker condition: must persist an unresolved marker."""

    def __init__(self, code: str, detail: str = "") -> None:
        super().__init__(f"{code}: {detail}" if detail else code)
        self.code = code
        self.detail = detail


# ---------------------------------------------------------------------------
# Git helpers (committed-range only; never mutable worktree bytes)
# ---------------------------------------------------------------------------


def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args], cwd=REPO_ROOT, text=True, encoding="utf-8",
        errors="replace", capture_output=True,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()


def _commit_changed_paths(commit: str) -> tuple[str, ...]:
    """Paths changed by exactly this one commit relative to its first parent.

    Uses ``git diff-tree`` (never ``git status``/mutable worktree) so the
    result is fully determined by immutable commit objects. A root commit
    (no parent) falls back to the full tree listing.
    """
    code, out, _ = _run_git(
        ["diff-tree", "--no-commit-id", "--name-only", "-r", commit]
    )
    if code != 0:
        return ()
    return tuple(sorted(line for line in out.splitlines() if line))


def _range_changed_paths(base: str, head: str) -> tuple[str, ...]:
    code, out, _ = _run_git(["diff", "--name-only", f"{base}..{head}"])
    if code != 0:
        return ()
    return tuple(sorted(line for line in out.splitlines() if line))


def _reconstruct_fingerprint_from_commit(commit: str, paths: tuple[str, ...]) -> str:
    """Reconstruct the ``_worktree_fingerprint`` byte recipe from committed
    Git blobs only. Mirrors ``run_agent_autorun_workflow_gate._worktree_fingerprint``'s
    exact canonical path/byte recipe (path bytes, NUL, file-bytes-digest or
    the missing sentinel, NUL) but reads every byte through
    ``git cat-file blob`` at ``commit`` -- never ``Path.read_bytes()`` against
    the mutable worktree. This is a read-only reconstruction of the existing
    P2 recipe, not a new or forked digest routine.
    """
    digest = hashlib.sha256()
    for path in paths:
        digest.update(path.encode("utf-8", errors="replace"))
        digest.update(b"\0")
        blob_sha = canary_core.git_blob_at(commit, path)
        blob_bytes = canary_core.git_blob_bytes(blob_sha) if blob_sha else None
        if blob_bytes is not None:
            digest.update(hashlib.sha256(blob_bytes).digest())
        else:
            digest.update(b"<missing-or-directory>")
        digest.update(b"\0")
    return digest.hexdigest()


def _read_committed_text(commit: str, path: str) -> str | None:
    blob_sha = canary_core.git_blob_at(commit, path)
    if not blob_sha:
        return None
    blob_bytes = canary_core.git_blob_bytes(blob_sha)
    if blob_bytes is None:
        return None
    return blob_bytes.decode("utf-8", errors="replace")


# ---------------------------------------------------------------------------
# Observation-block parsing (mechanical only; never a semantic re-execution)
# ---------------------------------------------------------------------------


def _extract_observation_block(text: str) -> str | None:
    start = text.find(OBSERVATION_BLOCK_HEADING)
    if start < 0:
        return None
    body = text[start + len(OBSERVATION_BLOCK_HEADING):]
    next_heading = re.search(r"(?m)^## ", body)
    return body[: next_heading.start()] if next_heading else body


def _extract_field(block: str, field: str) -> str | None:
    match = re.search(rf"^\s*{re.escape(field)}\s*:\s*(.+)$", block, re.MULTILINE)
    if not match:
        return None
    return match.group(1).strip().strip("`")


def _is_present(value: str | None) -> bool:
    return bool(value) and not _NA_PATTERN.match(value)


class ParsedObservation:
    __slots__ = (
        "eligibility", "phase", "hard_obligation_locator",
        "hard_obligation_pattern", "source_authority_locator",
    )

    def __init__(
        self, eligibility: str | None, phase: str | None,
        hard_obligation_locator: str | None, hard_obligation_pattern: str | None,
        source_authority_locator: str | None,
    ) -> None:
        self.eligibility = eligibility
        self.phase = phase
        self.hard_obligation_locator = hard_obligation_locator
        self.hard_obligation_pattern = hard_obligation_pattern
        self.source_authority_locator = source_authority_locator

    @property
    def is_eligible(self) -> bool:
        return (self.eligibility or "").strip().upper() == "YES"

    @property
    def has_required_metadata(self) -> bool:
        return (
            self.phase in canary_core.CANONICAL_PHASES
            and _is_present(self.hard_obligation_locator)
            and _is_present(self.hard_obligation_pattern)
            and _is_present(self.source_authority_locator)
        )


def parse_observation_block(text: str) -> ParsedObservation | None:
    block = _extract_observation_block(text)
    if block is None:
        return None
    return ParsedObservation(
        eligibility=_extract_field(block, FIELD_ELIGIBILITY),
        phase=_extract_field(block, FIELD_PHASE),
        hard_obligation_locator=_extract_field(block, FIELD_HARD_OBLIGATION_LOCATOR),
        hard_obligation_pattern=_extract_field(block, FIELD_HARD_OBLIGATION_PATTERN),
        source_authority_locator=_extract_field(block, FIELD_SOURCE_AUTHORITY_LOCATOR),
    )


def _trusted_disposition(text: str) -> str | None:
    """Return the committed reviewer disposition, never a worker status.

    The adjudication heading and exact field are both required.  This keeps
    ``Status: COMPLETE_PENDING_REVIEW`` from collapsing the order-of-record
    boundary into a worker self-attestation.
    """
    heading = "## Independent Reviewer Adjudication"
    start = text.find(heading)
    if start < 0:
        return None
    body = text[start + len(heading):]
    match = re.search(r"^Reviewer disposition:\s*`?([^`\r\n]+?)`?\.?\s*$", body, re.MULTILINE)
    if not match:
        return None
    disposition = match.group(1).strip()
    return disposition or None


def _single_parent(commit: str) -> str:
    code, out, error = _run_git(["rev-list", "--parents", "-n", "1", commit])
    parts = out.split()
    if code != 0 or len(parts) != 2:
        raise CollectionUnsafe(
            "UNSAFE_TRUSTED_COMMIT_PARENT_AMBIGUOUS",
            error or f"expected one parent for {commit}; found {max(0, len(parts) - 1)}",
        )
    return parts[1]


def generate_current_receipt(
    trusted_commit: str, disclosure_commit: str
) -> tuple[Path, str]:
    """Generate the one current existing-family P2 receipt after trust lands."""
    parent = _single_parent(trusted_commit)
    command = [
        sys.executable,
        AUTORUN_GATE_PATH,
        "--phase", "pre-closure",
        "--base", parent,
        "--head", disclosure_commit,
    ]
    proc = subprocess.run(
        command,
        cwd=REPO_ROOT,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
    )
    if proc.returncode != 0:
        tail = (proc.stderr or proc.stdout)[-2000:]
        raise CollectionUnsafe("UNSAFE_AUTORUN_RECEIPT_GENERATION_FAILED", tail)
    receipt_path = RECEIPT_DIR / GENERATED_RECEIPT_NAME
    if not receipt_path.is_file():
        raise CollectionUnsafe(
            "UNSAFE_AUTORUN_RECEIPT_MISSING",
            f"successful autorun did not create {receipt_path}",
        )
    return receipt_path, parent


# ---------------------------------------------------------------------------
# Candidate discovery
# ---------------------------------------------------------------------------


def _candidate_review_paths(commit: str) -> tuple[str, ...]:
    changed = _commit_changed_paths(commit)
    return tuple(
        path for path in changed
        if path.startswith(REVIEWS_GLOB_PREFIX) and path.endswith(".md")
    )


def find_eligible_candidate(commit: str) -> tuple[str, ParsedObservation] | None:
    """Return the single eligible (path, parsed-block) pair, or raise
    ``CollectionSkipped`` for zero/multiple/ineligible/malformed candidates.
    Never guesses among multiple candidates.
    """
    review_paths = _candidate_review_paths(commit)
    eligible: list[tuple[str, ParsedObservation]] = []
    for path in review_paths:
        text = _read_committed_text(commit, path)
        if text is None:
            continue
        parsed = parse_observation_block(text)
        if parsed is None or not parsed.is_eligible:
            continue
        eligible.append((path, parsed))
    if not eligible:
        raise CollectionSkipped(
            "SKIPPED_NO_ELIGIBLE_CANDIDATE",
            f"{len(review_paths)} docs/reviews path(s) changed; 0 eligible",
        )
    if len(eligible) > 1:
        raise CollectionSkipped(
            "SKIPPED_MULTIPLE_CANDIDATES",
            f"{len(eligible)} eligible candidates found; refusing to guess",
        )
    path, parsed = eligible[0]
    if not parsed.has_required_metadata:
        raise CollectionSkipped(
            "SKIPPED_INVALID_METADATA",
            f"{path} missing/invalid phase or locator metadata",
        )
    return path, parsed


# ---------------------------------------------------------------------------
# Receipt candidate discovery and Git-blob fingerprint reconciliation
# ---------------------------------------------------------------------------


def _candidate_receipt_files() -> tuple[Path, ...]:
    if not RECEIPT_DIR.is_dir():
        return ()
    return tuple(sorted(RECEIPT_DIR.glob("*.json")))


def find_receipt_candidate(
    trusted_commit: str, disclosure_commit: str
) -> tuple[Path, str]:
    """Create and return the exact current receipt; stale phase files do not compete."""
    return generate_current_receipt(trusted_commit, disclosure_commit)


def validate_and_reconcile_receipt(
    receipt_path: Path,
    trusted_commit: str,
    disclosure_commit: str,
    expected_base: str | None = None,
) -> dict[str, Any]:
    """Validate through the real P2 owner, then independently reconstruct the
    committed-range fingerprint from Git blobs and compare it to the
    receipt's declared ``worktreeFingerprint``. Returns the validated payload
    plus reconciliation evidence, or raises ``CollectionSkipped``/
    ``CollectionUnsafe``.
    """
    valid, payload, reason = read_receipt_readonly(str(receipt_path), REPO_ROOT)
    if not valid or not isinstance(payload, dict):
        raise CollectionSkipped("SKIPPED_INVALID_RECEIPT", reason)

    base_sha = str(payload.get("baseSha", ""))
    head_sha = str(payload.get("headSha", ""))
    if not base_sha or not head_sha:
        raise CollectionSkipped("SKIPPED_INVALID_RECEIPT", "missing baseSha/headSha")
    if not canary_core.git_commit_exists(base_sha) or not canary_core.git_commit_exists(head_sha):
        raise CollectionSkipped(
            "SKIPPED_RECEIPT_ANCESTRY_UNRESOLVED",
            "receipt base/head commit does not exist in this repository",
        )
    if not canary_core.git_is_ancestor(base_sha, head_sha):
        raise CollectionSkipped(
            "SKIPPED_RECEIPT_ANCESTRY_UNRESOLVED",
            "receipt base is not an ancestor of receipt head",
        )

    expected_parent = expected_base or _single_parent(trusted_commit)
    base_matches = len(base_sha) >= 7 and expected_parent.startswith(base_sha)
    head_matches = len(head_sha) >= 7 and disclosure_commit.startswith(head_sha)
    if not base_matches or not head_matches:
        raise CollectionUnsafe(
            "UNSAFE_RECEIPT_RANGE_MISMATCH",
            f"expected {expected_parent}..{disclosure_commit}; receipt reports {base_sha}..{head_sha}",
        )

    changed_paths = _range_changed_paths(expected_parent, disclosure_commit)
    if not changed_paths:
        # A synthesized/isolated fixture receipt may declare a head commit
        # with no diff-tree parent context resolvable here; fall back to the
        # single declared review path plus receipt itself being internally
        # consistent is not sufficient on its own -- treat as ambiguous.
        raise CollectionSkipped(
            "SKIPPED_RECEIPT_RANGE_UNRESOLVED",
            "no changed paths resolvable for receipt head commit",
        )
    reconstructed = _reconstruct_fingerprint_from_commit(disclosure_commit, changed_paths)
    declared = str(payload.get("worktreeFingerprint", ""))
    if reconstructed != declared:
        raise CollectionUnsafe(
            "UNSAFE_FINGERPRINT_MISMATCH",
            f"reconstructed={reconstructed!r} declared={declared!r}",
        )

    readout = machine_readout_to_dict(
        build_machine_verification_readout(valid, payload, reason)
    )
    return {
        "payload": payload,
        "readout": readout,
        "baseSha": base_sha,
        "headSha": head_sha,
        "reconstructedFingerprint": reconstructed,
    }


# ---------------------------------------------------------------------------
# Atomic pending-journal I/O
# ---------------------------------------------------------------------------


def _load_pending_journal() -> dict[str, Any] | None:
    if not PENDING_JOURNAL_PATH.is_file():
        return None
    try:
        return json.loads(PENDING_JOURNAL_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def _atomic_write_json(target: Path, payload: dict[str, Any]) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(
        dir=str(target.parent), prefix=f".{target.name}.", suffix=".tmp"
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, sort_keys=True, indent=2)
            handle.write("\n")
        os.replace(tmp_name, target)
    finally:
        if os.path.exists(tmp_name):
            os.unlink(tmp_name)


def write_safety_marker(code: str, detail: str) -> None:
    _atomic_write_json(
        SAFETY_MARKER_PATH,
        {
            "schema": "cvf.mfrp.p4c1.safetyMarker.v1",
            "code": code,
            "detail": detail,
            "claimBoundary": (
                "This marker fail-closes the next pre-commit until "
                "reviewer/closer adjudication explicitly removes it. The "
                "post-commit collector never clears its own marker."
            ),
        },
    )


def safety_marker_present() -> bool:
    return SAFETY_MARKER_PATH.is_file()


# ---------------------------------------------------------------------------
# Top-level collection entrypoint
# ---------------------------------------------------------------------------


def run_collection(commit: str | None = None) -> str:
    """Run one collection attempt at disclosure ``commit`` (defaults to HEAD).

    Returns a concise status string. Never raises past this boundary in
    normal operation -- callers (the post-commit hook) must still treat any
    unexpected exception as a reason to exit 0 without blocking the commit,
    per the contract's "never blocks git commit" requirement, but this
    function itself converts every anticipated condition into a clean return
    value.
    """
    disclosure_commit = commit or canary_core.git_head()

    if safety_marker_present():
        return "P4-C1: SKIPPED_SAFETY_MARKER_ALREADY_PRESENT"

    try:
        trusted_commit = _single_parent(disclosure_commit)
        candidate = find_eligible_candidate(trusted_commit)
    except CollectionUnsafe as unsafe:
        write_safety_marker(unsafe.code, unsafe.detail)
        return f"P4-C1: {unsafe.code}"
    except CollectionSkipped as skip:
        return f"P4-C1: {skip.code}"

    return_path, parsed = candidate
    committed_text = _read_committed_text(trusted_commit, return_path)
    if committed_text is None:
        return "P4-C1: SKIPPED_UNREADABLE_COMMITTED_RETURN"

    trusted_disposition = _trusted_disposition(committed_text)
    if trusted_disposition is None:
        write_safety_marker(
            "UNSAFE_MISSING_TRUSTED_DISPOSITION",
            f"{return_path} has no reviewer/closer-owned trusted disposition "
            "in its committed bytes",
        )
        return "P4-C1: UNSAFE_MISSING_TRUSTED_DISPOSITION"

    order_evidence = canary_core.verify_trusted_record_order(
        trusted_commit, disclosure_commit
    )
    if order_evidence["orderOfRecordStatus"] != "PROVEN":
        write_safety_marker(
            "UNSAFE_ORDER_OF_RECORD_UNPROVEN",
            f"trusted commit {trusted_commit} is not an ancestor of {disclosure_commit}",
        )
        return "P4-C1: UNSAFE_ORDER_OF_RECORD_UNPROVEN"

    try:
        receipt_path, expected_base = find_receipt_candidate(
            trusted_commit, disclosure_commit
        )
    except CollectionUnsafe as unsafe:
        write_safety_marker(unsafe.code, unsafe.detail)
        return f"P4-C1: {unsafe.code}"

    try:
        reconciled = validate_and_reconcile_receipt(
            receipt_path, trusted_commit, disclosure_commit, expected_base
        )
    except CollectionSkipped as skip:
        return f"P4-C1: {skip.code}"
    except CollectionUnsafe as unsafe:
        write_safety_marker(unsafe.code, unsafe.detail)
        return f"P4-C1: {unsafe.code}"

    blob = canary_core.git_blob_at(trusted_commit, return_path)
    if blob is None:
        return "P4-C1: SKIPPED_UNREADABLE_COMMITTED_RETURN"

    receipt_rel_path = str(receipt_path.relative_to(REPO_ROOT)).replace("\\", "/")
    payload = reconciled["payload"]
    obs = canary_core.NewObservationInput(
        return_path=return_path,
        trusted_commit=trusted_commit,
        trusted_blob=blob,
        trusted_outcome=trusted_disposition,
        phase=parsed.phase or "UNCLASSIFIED",
        hard_obligation_locator=parsed.hard_obligation_locator or "",
        hard_obligation_locator_pattern=parsed.hard_obligation_pattern or "",
        source_authority_locator=parsed.source_authority_locator or "",
        receipt_path=receipt_rel_path,
        receipt_digest=str(payload.get("receiptDigest", "")),
        verifier_identity=str(payload.get("verifierIdentityDigest", "")),
        readout_identity=str(payload.get("schema", "")),
        autorun_base=reconciled["baseSha"],
        autorun_head=reconciled["headSha"],
    )

    prior_evidence = _load_pending_journal()
    try:
        append_result = canary_core.append_observation(
            prior_evidence, obs, disclosure_commit
        )
    except canary_core.DuplicateOrReboundObservation:
        return "P4-C1: SKIPPED_DUPLICATE_OR_REBOUND"
    except ValueError as exc:
        write_safety_marker("UNSAFE_ORDER_OF_RECORD_UNPROVEN", str(exc))
        return "P4-C1: UNSAFE_ORDER_OF_RECORD_UNPROVEN"

    new_row = append_result["newRow"]
    readout = reconciled["readout"]
    receipt_envelope = {
        "notCheckedScope": list(readout.get("notCheckedScope", [])),
        "limitations": list(readout.get("limitations", [])),
        "unclassified": list(readout.get("unclassified", [])),
        "exceptions": list(readout.get("exceptions", [])),
    }
    prior_envelopes = (
        dict(prior_evidence.get("receiptReadoutEnvelopeByRow", {}))
        if prior_evidence else {}
    )
    prior_envelopes[new_row["rowId"]] = receipt_envelope
    journal = {
        "schema": "cvf.mfrp.p4c1.pendingJournal.v1",
        "rows": append_result["rows"],
        "populationCount": append_result["populationCount"],
        "eligibleCount": append_result["eligibleCount"],
        "checkpoint": append_result["checkpoint"],
        "receiptReadoutEnvelopeByRow": prior_envelopes,
        "collectorCommandEvidence": {
            "phase": "pre-closure",
            "base": expected_base,
            "head": disclosure_commit,
            "receiptPath": receipt_rel_path,
            "providerCalls": 0,
        },
    }
    _atomic_write_json(
        PENDING_JOURNAL_PATH,
        journal,
    )

    immediate_triggers = canary.derive_safety_triggers(
        append_result["rows"], {"result": "PASS"}
    )
    active_triggers = sorted(name for name, active in immediate_triggers.items() if active)
    if active_triggers:
        code = "UNSAFE_" + active_triggers[0].upper()
        write_safety_marker(
            code,
            f"row {new_row['rowId']} triggered: {', '.join(active_triggers)}",
        )
        return f"P4-C1: {code}"

    if new_row.get("ineligibleClass"):
        return "P4-C1: SKIPPED_INELIGIBLE_ROW"
    return f"P4-C1: COLLECTED {new_row['rowId']}"


def main() -> int:
    """Post-commit launcher entrypoint. Always exits 0: a hook that fails
    would block the user's already-completed ``git commit``, which the
    contract forbids -- only the next pre-commit's safety-marker check may
    ever block, and only after this module has explicitly written a marker.
    """
    try:
        status = run_collection()
    except Exception as exc:  # noqa: BLE001 - never block the completed commit
        try:
            write_safety_marker(
                "UNSAFE_UNEXPECTED_COLLECTOR_ERROR",
                f"{exc.__class__.__name__}: {exc}",
            )
        except Exception:
            pass
        status = f"P4-C1: UNSAFE_UNEXPECTED_COLLECTOR_ERROR ({exc.__class__.__name__})"
    print(status)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
