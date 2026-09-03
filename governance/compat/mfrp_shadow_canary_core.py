"""MFRP-P4 linkage, receipt reconciliation, comparator, and observation core."""
#!/usr/bin/env python3
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any
try:
    from agent_autorun_machine_verification import (
        RECEIPT_SCHEMA,
        VERIFIER_IDENTITY_PROFILE,
        _validate_receipt_integrity,
    )
    from agent_automation_machine_verification_readout import (
        DETERMINISTIC_PREFLIGHT_COMPLETE,
        build_machine_verification_readout,
        machine_readout_to_dict,
        read_receipt_readonly,
    )
except ModuleNotFoundError:
    from governance.compat.agent_autorun_machine_verification import (
        RECEIPT_SCHEMA,
        VERIFIER_IDENTITY_PROFILE,
        _validate_receipt_integrity,
    )
    from governance.compat.agent_automation_machine_verification_readout import (
        DETERMINISTIC_PREFLIGHT_COMPLETE,
        build_machine_verification_readout,
        machine_readout_to_dict,
        read_receipt_readonly,
    )
REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMA = "cvf.mfrp.p4ShadowCanary.v1"

# ---------------------------------------------------------------------------
# Fixed contract constants (from the accepted P4 design / baseline)
# ---------------------------------------------------------------------------
INVARIANT_ID = "P4-I1-DECLARED-AUTHORITY-AND-HARD-OBLIGATION-SURVIVAL"
NON_REPRESENTABLE_BLIND_SPOTS = ("C07", "C08", "C18")
C15_DISPOSITION = "FALSE_NEGATIVE"
ALLOWED_DIVERGENCE_CLASSES = (
    "ENVELOPE_CONSISTENT_WITH_TRUSTED",
    "MACHINE_STRICTER",
    "TRUSTED_ROUTE_STRICTER",
    "EVIDENCE_INCOMPLETE",
    "IDENTITY_OR_SOURCE_DRIFT",
    "COMPARISON_OBJECT_MISMATCH",
    "BLIND_SPOT_NOT_REPRESENTABLE",
    "UNEXPLAINED_DIVERGENCE",
)
CANONICAL_PHASES = (
    "INTAKE", "DESIGN", "SPEC", "WORK_ORDER", "BUILD", "REVIEW", "FREEZE",
)
RUNTIME_DIR = Path(".cvf/runtime/mfrp-p4-shadow-canary")
# The initial real observation binding, pinned exactly by the amended work
# order's "Actual-Seam And One-Command Contract".
TRUSTED_RETURN_PATH = (
    "docs/reviews/CVF_MFRP_P3_R1B_R2_ACTUAL_SEAM_REPLAY_REPAIR_WORKER_RETURN_2026-09-02.md"
)
TRUSTED_COMMIT = "040ebfcff081062956c543f2b1d7e9cc04533b62"
TRUSTED_BLOB = "32154bdf225e600ca0622ebb5e25c6c97c9678eb"
TRUSTED_OUTCOME = "REVIEWER_ACCEPTED_EVIDENCE_RETURN_TO_DESIGN_BOUNDED"
AUTORUN_RANGE_PARENT = "cf899df3d0f49b14b7bd347282134d0133ade7be"
AUTORUN_RANGE_HEAD = TRUSTED_COMMIT
HARD_OBLIGATION_LOCATOR = (
    "Independent Reviewer Adjudication section retains C15 FALSE_NEGATIVE, "
    "C07/C08/C18 exclusions, and P4 non-opening"
)
# Mechanically unambiguous locator per P4-RV-2: not a bare substring search
# for the token "C15" across the whole document (which the trusted return
# also uses in unrelated prose, e.g. its predicate-miss set listing and its
# fixed sentinel name), but the exact anchored disclosure sentence that
# resolves to exactly one bounded statement in the Findings / Position
# section: the predicate-miss set followed immediately by C15's
# FALSE_NEGATIVE classification.
HARD_OBLIGATION_LOCATOR_PATTERN = (
    "`C07, C08, C15, C18`. C15 is classified `FALSE_NEGATIVE`"
)
SOURCE_AUTHORITY_LOCATOR = (
    "docs/reviews/CVF_MFRP_P3_R1B_R2_ACTUAL_SEAM_REPLAY_REPAIR_WORKER_RETURN_2026-09-02.md"
    "#independent-reviewer-adjudication"
)
# Expected SHA-256 of the trusted R1B-R2 return file, per P4-RV-1: the closed
# audit manifest must carry an expected identity for every declared
# authority/evidence input, never merely check that the path exists. This is
# the same pinned value the GC-018 baseline's Opening Evidence table records
# for "accepted R1B-R2 return".
TRUSTED_RETURN_EXPECTED_SHA256 = (
    "0842f9e275eaf2e44db79f265e8e9301bd7942eda2c2c9008ae3e8a0495f17c1"
)
IGNORED_RECEIPT_DIR = Path(".cvf/runtime/autorun-receipts")

# ---------------------------------------------------------------------------
# Git helpers
# ---------------------------------------------------------------------------

def _run_git(args: list[str]) -> tuple[int, str, str]:
    proc = subprocess.run(
        ["git", *args], cwd=REPO_ROOT, text=True, encoding="utf-8",
        errors="replace", capture_output=True,
    )
    return proc.returncode, proc.stdout.strip(), proc.stderr.strip()

def git_head() -> str:
    code, out, _ = _run_git(["rev-parse", "HEAD"])
    if code != 0:
        raise RuntimeError("unable to resolve git HEAD")
    return out

def git_is_ancestor(ancestor: str, descendant: str) -> bool:
    code, _, _ = _run_git(["merge-base", "--is-ancestor", ancestor, descendant])
    return code == 0

def git_blob_at(commit: str, path: str) -> str | None:
    code, out, _ = _run_git(["ls-tree", commit, "--", path])
    if code != 0 or not out:
        return None
    # format: "<mode> blob <sha>\t<path>"
    parts = out.split()
    if len(parts) < 3 or parts[1] != "blob":
        return None
    return parts[2]

def git_commit_exists(commit: str) -> bool:
    code, _, _ = _run_git(["cat-file", "-e", f"{commit}^{{commit}}"])
    return code == 0

def git_commit_time(commit: str) -> float | None:
    code, out, _ = _run_git(["show", "-s", "--format=%ct", commit])
    if code != 0 or not out:
        return None
    try:
        return float(out.splitlines()[-1].strip())
    except ValueError:
        return None

def git_blob_bytes(blob_sha: str) -> bytes | None:
    proc = subprocess.run(
        ["git", "cat-file", "blob", blob_sha], cwd=REPO_ROOT,
        capture_output=True,
    )
    if proc.returncode != 0:
        return None
    return proc.stdout

# ---------------------------------------------------------------------------
# Deterministic sampling (Comparator And Sampling Contract)
# ---------------------------------------------------------------------------

def sample_size(n: int) -> int:
    if n < 0:
        raise ValueError("population count must be non-negative")
    if n == 0:
        return 0
    k = -(-n // 5)  # exact ceil(0.20 * n) == ceil(n / 5)
    return min(4, max(1, k))

def sampling_digest(
    return_path: str, blob_identity: str, receipt_identity: str
) -> str:
    domain = "\n".join([return_path, blob_identity, receipt_identity])
    return hashlib.sha256(domain.encode("utf-8")).hexdigest()

def select_sample(rows: list[dict[str, Any]]) -> list[str]:
    eligible = [
        row for row in rows
        if row.get("divergenceClass") == "ENVELOPE_CONSISTENT_WITH_TRUSTED"
    ]
    k = sample_size(len(eligible))
    ordered = sorted(eligible, key=lambda row: row["samplingDigest"])
    return [row["rowId"] for row in ordered[:k]]

# ---------------------------------------------------------------------------
# Honest Receipt Boundary: explicit return/receipt pair-linkage manifest
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class LinkageManifest:
    return_path: str
    trusted_commit: str
    trusted_blob: str
    autorun_base: str
    autorun_head: str
    receipt_path: str
    receipt_digest: str
    verifier_identity: str
    readout_identity: str
    creation_after_trusted_commit: bool
    source_authority_locator: str
    hard_obligation_locator: str

def evaluate_linkage(manifest: LinkageManifest | None) -> tuple[bool, str]:
    if manifest is None:
        return False, "no linkage manifest supplied"
    required = {
        "return_path": manifest.return_path,
        "trusted_commit": manifest.trusted_commit,
        "trusted_blob": manifest.trusted_blob,
        "autorun_base": manifest.autorun_base,
        "autorun_head": manifest.autorun_head,
        "receipt_path": manifest.receipt_path,
        "receipt_digest": manifest.receipt_digest,
        "verifier_identity": manifest.verifier_identity,
        "readout_identity": manifest.readout_identity,
        "source_authority_locator": manifest.source_authority_locator,
        "hard_obligation_locator": manifest.hard_obligation_locator,
    }
    missing = [key for key, value in required.items() if not value]
    if missing:
        return False, f"linkage manifest missing required field(s): {sorted(missing)}"
    if not manifest.creation_after_trusted_commit:
        return False, "linkage manifest lacks creation-time-after-trusted-commit evidence"
    return True, "explicit linkage manifest complete"

def derive_creation_after_trusted_commit(
    receipt_path: Path, trusted_commit: str
) -> tuple[bool, dict[str, Any]]:
    trusted_commit_time = git_commit_time(trusted_commit)
    try:
        receipt_mtime = receipt_path.stat().st_mtime
        receipt_exists = True
    except OSError:
        receipt_mtime = None
        receipt_exists = False
    evidence = {
        "method": "filesystem_mtime_vs_trusted_commit_time",
        "receiptPath": str(receipt_path),
        "receiptExists": receipt_exists,
        "receiptMtimeEpoch": receipt_mtime,
        "trustedCommit": trusted_commit,
        "trustedCommitTimeEpoch": trusted_commit_time,
    }
    if not receipt_exists or receipt_mtime is None or trusted_commit_time is None:
        evidence["derived"] = False
        evidence["reason"] = "receipt file or trusted commit time unavailable"
        return False, evidence
    after = receipt_mtime >= trusted_commit_time
    evidence["derived"] = True
    evidence["afterTrustedCommit"] = after
    return after, evidence

@dataclass(frozen=True)
class ReceiptReconciliationResult:
    reconciled: bool
    divergence_class: str | None
    reason: str
    mismatches: tuple[str, ...]
    actualReceiptIdentity: dict[str, Any]

def reconcile_linkage_with_receipt(
    manifest: LinkageManifest, actual_receipt_identity: dict[str, Any]
) -> ReceiptReconciliationResult:
    actual_base = str(actual_receipt_identity.get("baseSha", ""))
    actual_head = str(actual_receipt_identity.get("headSha", ""))
    actual_digest = str(actual_receipt_identity.get("receiptDigest", ""))
    actual_verifier = str(actual_receipt_identity.get("verifierIdentityDigest", ""))
    actual_schema = str(actual_receipt_identity.get("schema", ""))
    range_mismatches = []
    if manifest.autorun_base != actual_base:
        range_mismatches.append(
            f"autorun_base declared={manifest.autorun_base!r} actual={actual_base!r}"
        )
    if manifest.autorun_head != actual_head:
        range_mismatches.append(
            f"autorun_head declared={manifest.autorun_head!r} actual={actual_head!r}"
        )
    if range_mismatches:
        return ReceiptReconciliationResult(
            reconciled=False,
            divergence_class="COMPARISON_OBJECT_MISMATCH",
            reason=(
                "declared autorun base/head range does not bind the receipt "
                "to the declared invocation range: " + "; ".join(range_mismatches)
            ),
            mismatches=tuple(range_mismatches),
            actualReceiptIdentity=actual_receipt_identity,
        )
    identity_mismatches = []
    if manifest.receipt_digest != actual_digest:
        identity_mismatches.append(
            f"receipt_digest declared={manifest.receipt_digest!r} actual={actual_digest!r}"
        )
    if manifest.verifier_identity != actual_verifier:
        identity_mismatches.append(
            f"verifier_identity declared={manifest.verifier_identity!r} "
            f"actual={actual_verifier!r}"
        )
    if manifest.readout_identity != actual_schema:
        identity_mismatches.append(
            f"readout_identity declared={manifest.readout_identity!r} "
            f"actual={actual_schema!r}"
        )
    if identity_mismatches:
        return ReceiptReconciliationResult(
            reconciled=False,
            divergence_class="IDENTITY_OR_SOURCE_DRIFT",
            reason=(
                "declared receipt identity fields do not match the actual "
                "validated receipt payload: " + "; ".join(identity_mismatches)
            ),
            mismatches=tuple(identity_mismatches),
            actualReceiptIdentity=actual_receipt_identity,
        )
    return ReceiptReconciliationResult(
        reconciled=True,
        divergence_class=None,
        reason="declared linkage identity matches the actual validated receipt payload",
        mismatches=(),
        actualReceiptIdentity=actual_receipt_identity,
    )

def find_bound_ignored_receipt(
    return_path: str, trusted_commit: str, trusted_blob: str
) -> LinkageManifest | None:
    receipt_dir = REPO_ROOT / IGNORED_RECEIPT_DIR
    if not receipt_dir.is_dir():
        return None
    for candidate in sorted(receipt_dir.glob("*.json")):
        try:
            payload = json.loads(candidate.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(payload, dict):
            continue
        base_sha = payload.get("baseSha")
        head_sha = payload.get("headSha")
        # The only range that could honestly represent the trusted record is
        # one whose base/head bracket exactly matches the pinned autorun
        # range for this material commit.
        range_matches = (
            isinstance(base_sha, str)
            and isinstance(head_sha, str)
            and base_sha.startswith(AUTORUN_RANGE_PARENT[:9])
            and head_sha.startswith(AUTORUN_RANGE_HEAD[:9])
        )
        if not range_matches:
            continue
        # Even a range match is not linkage without an explicit binding of
        # the return path/blob/hard-obligation locator inside the same
        # receipt payload -- no such field exists in the current receipt
        # schema, so a bare range match is never sufficient by itself.
        declared_return = payload.get("boundReturnPath")
        declared_blob = payload.get("boundReturnBlob")
        if declared_return == return_path and declared_blob == trusted_blob:
            creation_after, _creation_evidence = derive_creation_after_trusted_commit(
                candidate, trusted_commit
            )
            return LinkageManifest(
                return_path=return_path,
                trusted_commit=trusted_commit,
                trusted_blob=trusted_blob,
                autorun_base=AUTORUN_RANGE_PARENT,
                autorun_head=AUTORUN_RANGE_HEAD,
                receipt_path=str(candidate.relative_to(REPO_ROOT)),
                receipt_digest=str(payload.get("receiptDigest", "")),
                verifier_identity=str(payload.get("verifierIdentityDigest", "")),
                readout_identity=str(payload.get("schema", "")),
                creation_after_trusted_commit=creation_after,
                source_authority_locator=SOURCE_AUTHORITY_LOCATOR,
                hard_obligation_locator=HARD_OBLIGATION_LOCATOR,
            )
    return None

# ---------------------------------------------------------------------------
# Comparator row construction
# ---------------------------------------------------------------------------

@dataclass
class ComparatorRow:
    rowId: str
    phaseReturnIdentity: dict[str, Any]
    receiptIdentity: dict[str, Any] | None
    pairLinkageEvidence: dict[str, Any] | None
    phase: str
    trustedOutcome: dict[str, Any]
    machineOutcome: dict[str, Any] | None
    samePayloadEvidence: dict[str, Any] | None
    trustedRecordOrderEvidence: dict[str, Any]
    blindSpotDisposition: dict[str, Any]
    divergenceClass: str
    auditReason: str
    auditDisposition: str
    costEvidence: dict[str, Any]
    controllingOutcome: str
    samplingDigest: str
    ineligibleClass: str | None = None
    closedAuditManifestPins: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "rowId": self.rowId,
            "phaseReturnIdentity": self.phaseReturnIdentity,
            "receiptIdentity": self.receiptIdentity,
            "pairLinkageEvidence": self.pairLinkageEvidence,
            "phase": self.phase,
            "trustedOutcome": self.trustedOutcome,
            "machineOutcome": self.machineOutcome,
            "samePayloadEvidence": self.samePayloadEvidence,
            "trustedRecordOrderEvidence": self.trustedRecordOrderEvidence,
            "blindSpotDisposition": self.blindSpotDisposition,
            "divergenceClass": self.divergenceClass,
            "auditReason": self.auditReason,
            "auditDisposition": self.auditDisposition,
            "costEvidence": self.costEvidence,
            "controllingOutcome": self.controllingOutcome,
            "samplingDigest": self.samplingDigest,
            "ineligibleClass": self.ineligibleClass,
            "closedAuditManifestPins": self.closedAuditManifestPins,
        }

def verify_trusted_record_order(
    trusted_commit: str, execution_base: str
) -> dict[str, Any]:
    exists = git_commit_exists(trusted_commit)
    is_ancestor = exists and git_is_ancestor(trusted_commit, execution_base)
    return {
        "trustedCommit": trusted_commit,
        "shadowDisclosureBase": execution_base,
        "commitExists": exists,
        "isAncestor": is_ancestor,
        "orderOfRecordStatus": "PROVEN" if is_ancestor else "ORDER_OF_RECORD_UNPROVEN",
    }

def _build_linked_or_ineligible_row(
    *,
    row_id: str,
    return_identity: dict[str, Any],
    trusted_outcome: dict[str, Any],
    blind_spot_disposition: dict[str, Any],
    phase: str,
    order_evidence: dict[str, Any],
    controlling_outcome: str,
    manifest: LinkageManifest | None,
    hard_obligation_locator_pattern: str,
    source_authority_locator: str,
) -> ComparatorRow:
    complete, completeness_reason = evaluate_linkage(manifest)
    return_blob_sha = return_identity.get("blob")
    committed_bytes = git_blob_bytes(return_blob_sha) if return_blob_sha else None
    closed_audit_manifest_pins = {
        "returnBlobPath": return_identity["path"],
        "returnBlobGitSha": return_blob_sha,
        "returnBlobExpectedSha256": (
            hashlib.sha256(committed_bytes).hexdigest() if committed_bytes is not None else None
        ),
        "returnBlobReadableFromCommittedObject": committed_bytes is not None,
        "hardObligationLocator": blind_spot_disposition.get("hardObligationLocator"),
        "hardObligationLocatorPattern": hard_obligation_locator_pattern,
        "sourceAuthorityLocator": source_authority_locator,
    }
    sampling_receipt_component = (
        manifest.receipt_digest if (manifest is not None and complete) else "NO_ELIGIBLE_RECEIPT"
    )
    sampling_digest_value = sampling_digest(
        return_identity["path"], return_identity["blob"], sampling_receipt_component
    )

    def ineligible_row(reason: str, divergence_class: str, extra: dict[str, Any] | None = None) -> ComparatorRow:
        pair_linkage_evidence: dict[str, Any] = {
            "linked": False,
            "reason": reason,
            "checkedIgnoredReceiptCount": _count_ignored_receipts(),
        }
        if extra:
            pair_linkage_evidence.update(extra)
        return ComparatorRow(
            rowId=row_id,
            phaseReturnIdentity=return_identity,
            receiptIdentity=(
                {
                    "path": manifest.receipt_path,
                    "digest": manifest.receipt_digest,
                    "verifierIdentity": manifest.verifier_identity,
                    "readoutIdentity": manifest.readout_identity,
                }
                if manifest is not None
                else None
            ),
            pairLinkageEvidence=pair_linkage_evidence,
            phase=phase,
            trustedOutcome=trusted_outcome,
            machineOutcome=None,
            samePayloadEvidence=None,
            trustedRecordOrderEvidence=order_evidence,
            blindSpotDisposition=blind_spot_disposition,
            divergenceClass=divergence_class,
            auditReason="none",
            auditDisposition="NOT_APPLICABLE_INELIGIBLE_ROW",
            costEvidence={
                "shadowCommandCount": 0,
                "shadowDurationSeconds": None,
                "externalCalls": 0,
                "cacheReuse": "NOT_APPLICABLE",
            },
            controllingOutcome=controlling_outcome,
            samplingDigest=sampling_digest_value,
            ineligibleClass="BLOCKED_NO_ELIGIBLE_NATURAL_PAIR",
            closedAuditManifestPins=closed_audit_manifest_pins,
        )
    if not complete:
        return ineligible_row(completeness_reason, "COMPARISON_OBJECT_MISMATCH")
    # Manifest is complete (non-empty fields, affirmative creation-order
    # evidence). Exercise the actual P2 validator/readout against the bound
    # receipt -- the same imported owner symbols used everywhere else in
    # this module, never copied or forked -- then reconcile every declared
    # linkage identity field against what the real validated payload
    # actually reports before permitting a clean classification.
    assert manifest is not None
    receipt_path = REPO_ROOT / manifest.receipt_path
    valid, payload, reason = read_receipt_readonly(str(receipt_path), REPO_ROOT)
    readout = machine_readout_to_dict(
        build_machine_verification_readout(valid, payload, reason)
    )
    actual_receipt_identity = readout["receiptIdentity"] if readout else {}
    reconciliation = reconcile_linkage_with_receipt(manifest, actual_receipt_identity)
    receipt_identity = {
        "path": manifest.receipt_path,
        "digest": manifest.receipt_digest,
        "verifierIdentity": manifest.verifier_identity,
        "readoutIdentity": manifest.readout_identity,
    }
    if not reconciliation.reconciled:
        return ineligible_row(
            reconciliation.reason,
            reconciliation.divergence_class or "COMPARISON_OBJECT_MISMATCH",
            extra={
                "reconciliation": {
                    "reconciled": False,
                    "mismatches": list(reconciliation.mismatches),
                    "actualReceiptIdentity": reconciliation.actualReceiptIdentity,
                },
            },
        )
    pair_linkage_evidence = {
        "linked": True,
        "reason": "explicit invocation manifest bound all required fields and reconciled "
                  "against the actual validated receipt payload",
        "manifest": {
            "returnPath": manifest.return_path,
            "trustedCommit": manifest.trusted_commit,
            "trustedBlob": manifest.trusted_blob,
            "autorunBase": manifest.autorun_base,
            "autorunHead": manifest.autorun_head,
            "sourceAuthorityLocator": manifest.source_authority_locator,
            "hardObligationLocator": manifest.hard_obligation_locator,
        },
        "reconciliation": {
            "reconciled": True,
            "mismatches": [],
            "actualReceiptIdentity": reconciliation.actualReceiptIdentity,
        },
    }
    machine_outcome = {
        "status": readout["status"] if readout else "RECEIPT_INVALID_FAIL_CLOSED",
        "validatorAccepted": valid,
        "validatorReason": reason,
    }
    divergence_class = (
        "ENVELOPE_CONSISTENT_WITH_TRUSTED" if valid else "UNEXPLAINED_DIVERGENCE"
    )
    return ComparatorRow(
        rowId=row_id,
        phaseReturnIdentity=return_identity,
        receiptIdentity=receipt_identity,
        pairLinkageEvidence=pair_linkage_evidence,
        phase=phase,
        trustedOutcome=trusted_outcome,
        machineOutcome=machine_outcome,
        samePayloadEvidence={"note": "no in-process P2 call chain observed by this row"},
        trustedRecordOrderEvidence=order_evidence,
        blindSpotDisposition=blind_spot_disposition,
        divergenceClass=divergence_class,
        auditReason="deterministic clean sample" if valid else "divergence",
        auditDisposition="PENDING_CHECKPOINT_SAMPLING",
        costEvidence={
            "shadowCommandCount": 1,
            "shadowDurationSeconds": None,
            "externalCalls": 0,
            "cacheReuse": "REUSED_EXISTING_RECEIPT",
        },
        controllingOutcome=controlling_outcome,
        samplingDigest=sampling_digest_value,
        ineligibleClass=None,
        closedAuditManifestPins=closed_audit_manifest_pins,
    )

def build_initial_observation_row(
    execution_base: str,
) -> ComparatorRow:
    order_evidence = verify_trusted_record_order(TRUSTED_COMMIT, execution_base)
    if order_evidence["orderOfRecordStatus"] != "PROVEN":
        raise ValueError(
            "ORDER_OF_RECORD_UNPROVEN: trusted commit is not a proven ancestor "
            "of the shadow disclosure base"
        )
    actual_blob = git_blob_at(TRUSTED_COMMIT, TRUSTED_RETURN_PATH)
    if actual_blob != TRUSTED_BLOB:
        raise ValueError(
            f"trusted blob identity mismatch at {TRUSTED_COMMIT}: "
            f"expected {TRUSTED_BLOB}, found {actual_blob!r}"
        )
    return_identity = {
        "path": TRUSTED_RETURN_PATH,
        "commit": TRUSTED_COMMIT,
        "blob": actual_blob,
    }
    trusted_outcome = {
        "disposition": TRUSTED_OUTCOME,
        "evidenceReference": (
            f"{TRUSTED_RETURN_PATH} Independent Reviewer Adjudication, lines 758-759"
        ),
    }
    blind_spot_disposition = {
        "nonRepresentable": list(NON_REPRESENTABLE_BLIND_SPOTS),
        "c15": C15_DISPOSITION,
        "hardObligationLocator": HARD_OBLIGATION_LOCATOR,
        "excludedFromSuccessDenominators": True,
    }
    manifest = find_bound_ignored_receipt(
        TRUSTED_RETURN_PATH, TRUSTED_COMMIT, actual_blob
    )
    # Honest ineligibility (no bound receipt) is handled honestly by the
    # Actual-Seam And One-Command Contract: the existing autorun gate cannot
    # generate a valid receipt for this immutable historical range without
    # evaluating the current (moved) worktree instead of the actual
    # historical tree at that range, and no ignored receipt explicitly binds
    # the trusted commit/blob. Explicit linkage that does exist is reconciled
    # against the actual validated receipt payload before it is ever allowed
    # to read clean, per P4-RV-4 -- see ``_build_linked_or_ineligible_row``.
    return _build_linked_or_ineligible_row(
        row_id="R1B-R2-INITIAL",
        return_identity=return_identity,
        trusted_outcome=trusted_outcome,
        blind_spot_disposition=blind_spot_disposition,
        phase="REVIEW",
        order_evidence=order_evidence,
        controlling_outcome=TRUSTED_OUTCOME,
        manifest=manifest,
        hard_obligation_locator_pattern=HARD_OBLIGATION_LOCATOR_PATTERN,
        source_authority_locator=SOURCE_AUTHORITY_LOCATOR,
    )

def _count_ignored_receipts() -> int:
    receipt_dir = REPO_ROOT / IGNORED_RECEIPT_DIR
    if not receipt_dir.is_dir():
        return 0
    return len(list(receipt_dir.glob("*.json")))

# ---------------------------------------------------------------------------
# P4-RV-3: bounded natural-observation / checkpoint input seam
# ---------------------------------------------------------------------------
#
# Per the reviewer-directed correction: the CLI previously accepted only
# ``--output`` and ``--execution-base``; ``build_evidence`` hard-coded the
# R1B-R2 return, always created exactly one initialization row, and always
# emitted the initialization checkpoint. There was no way to feed in a new
# natural return, a trusted outcome, a receipt/linkage manifest, or a prior
# ledger, so the linked-receipt branch of ``build_initial_observation_row``
# was unreachable dead code from the public CLI path. This section adds one
# bounded explicit input contract inside this same file (no new path, no new
# registry, no per-return review, no provider call, no second receipt
# family) that can validate and append a new eligible record, consume a
# prior bounded ledger, reject duplicate/rebound rows, and determine the
# checkpoint from declared population thresholds.
CHECKPOINT_THRESHOLDS: tuple[tuple[str, int], ...] = (
    ("final", 20),
    ("M10", 10),
    ("M5", 5),
    ("initialization", 0),
)

def checkpoint_for_population(eligible_count: int) -> str:
    if eligible_count < 0:
        raise ValueError("eligible_count must be non-negative")
    for name, threshold in CHECKPOINT_THRESHOLDS:
        if eligible_count >= threshold:
            return name
    return "initialization"

@dataclass(frozen=True)
class NewObservationInput:
    return_path: str
    trusted_commit: str
    trusted_blob: str
    trusted_outcome: str
    phase: str
    hard_obligation_locator: str
    hard_obligation_locator_pattern: str
    source_authority_locator: str
    receipt_path: str | None = None
    receipt_digest: str | None = None
    verifier_identity: str | None = None
    readout_identity: str | None = None
    autorun_base: str | None = None
    autorun_head: str | None = None
    row_id: str | None = None

    def resolved_row_id(self) -> str:
        if self.row_id:
            return self.row_id
        digest = hashlib.sha256(
            "\n".join([self.return_path, self.trusted_commit, self.trusted_blob]).encode("utf-8")
        ).hexdigest()
        return f"OBS-{digest[:16]}"

def row_identity_key(row: dict[str, Any]) -> tuple[str, str, str]:
    identity = row.get("phaseReturnIdentity", {})
    return (
        str(identity.get("path", "")),
        str(identity.get("commit", "")),
        str(identity.get("blob", "")),
    )

def receipt_identity_key(row: dict[str, Any]) -> tuple[str, str] | None:
    identity = row.get("receiptIdentity")
    if not isinstance(identity, dict):
        return None
    path = str(identity.get("path", ""))
    digest = str(identity.get("digest", ""))
    return (path, digest) if path and digest else None

class DuplicateOrReboundObservation(Exception):
    pass

def build_row_from_observation_input(
    obs: NewObservationInput,
    execution_base: str,
) -> ComparatorRow:
    order_evidence = verify_trusted_record_order(obs.trusted_commit, execution_base)
    if order_evidence["orderOfRecordStatus"] != "PROVEN":
        raise ValueError(
            "ORDER_OF_RECORD_UNPROVEN: trusted commit is not a proven ancestor "
            "of the shadow disclosure base"
        )
    actual_blob = git_blob_at(obs.trusted_commit, obs.return_path)
    if actual_blob != obs.trusted_blob:
        raise ValueError(
            f"trusted blob identity mismatch at {obs.trusted_commit}: "
            f"expected {obs.trusted_blob}, found {actual_blob!r}"
        )
    return_identity = {
        "path": obs.return_path,
        "commit": obs.trusted_commit,
        "blob": actual_blob,
    }
    trusted_outcome = {
        "disposition": obs.trusted_outcome,
        "evidenceReference": f"{obs.return_path}#trusted-outcome",
    }
    blind_spot_disposition = {
        "nonRepresentable": list(NON_REPRESENTABLE_BLIND_SPOTS),
        "c15": C15_DISPOSITION,
        "hardObligationLocator": obs.hard_obligation_locator,
        "excludedFromSuccessDenominators": True,
    }
    row_id = obs.resolved_row_id()
    manifest: LinkageManifest | None = None
    if obs.receipt_path:
        creation_after, _creation_evidence = derive_creation_after_trusted_commit(
            REPO_ROOT / obs.receipt_path, obs.trusted_commit
        )
        manifest = LinkageManifest(
            return_path=obs.return_path,
            trusted_commit=obs.trusted_commit,
            trusted_blob=actual_blob,
            autorun_base=obs.autorun_base or "",
            autorun_head=obs.autorun_head or "",
            receipt_path=obs.receipt_path,
            receipt_digest=obs.receipt_digest or "",
            verifier_identity=obs.verifier_identity or "",
            readout_identity=obs.readout_identity or "",
            creation_after_trusted_commit=creation_after,
            source_authority_locator=obs.source_authority_locator,
            hard_obligation_locator=obs.hard_obligation_locator,
        )
    # Completeness, P2 validation and receipt-field reconciliation (P4-RV-4)
    # are all performed by the shared tail -- linkage can never read
    # ``linked: true`` merely because the manifest's strings are non-empty;
    # every declared identity field must also match what the real validated
    # receipt payload actually reports.
    return _build_linked_or_ineligible_row(
        row_id=row_id,
        return_identity=return_identity,
        trusted_outcome=trusted_outcome,
        blind_spot_disposition=blind_spot_disposition,
        phase=obs.phase,
        order_evidence=order_evidence,
        controlling_outcome=obs.trusted_outcome,
        manifest=manifest,
        hard_obligation_locator_pattern=obs.hard_obligation_locator_pattern,
        source_authority_locator=obs.source_authority_locator,
    )

def append_observation(
    prior_evidence: dict[str, Any] | None,
    obs: NewObservationInput,
    execution_base: str,
) -> dict[str, Any]:
    prior_rows: list[dict[str, Any]] = (
        list(prior_evidence.get("rows", [])) if prior_evidence else []
    )
    new_row = build_row_from_observation_input(obs, execution_base)
    new_row_dict = new_row.to_dict()
    new_key = row_identity_key(new_row_dict)
    new_receipt_key = receipt_identity_key(new_row_dict)
    for existing in prior_rows:
        existing_key = row_identity_key(existing)
        if existing.get("rowId") == new_row_dict["rowId"] or existing_key == new_key:
            raise DuplicateOrReboundObservation(
                f"row {new_row_dict['rowId']!r} duplicates an existing row identity "
                f"{new_key!r}"
            )
        if existing_key[0] == new_key[0] and existing_key != new_key:
            # Same declared return path, different commit/blob: a rebound
            # resubmission attempting to re-point an already-recorded return
            # at a different immutable identity.
            raise DuplicateOrReboundObservation(
                f"return path {new_key[0]!r} was already recorded at identity "
                f"{existing_key!r}; refusing rebound resubmission at {new_key!r}"
            )
        existing_receipt_key = receipt_identity_key(existing)
        if (
            not new_row_dict.get("ineligibleClass")
            and not existing.get("ineligibleClass")
            and new_receipt_key is not None
            and existing_receipt_key is not None
            and (
                new_receipt_key[0] == existing_receipt_key[0]
                or new_receipt_key[1] == existing_receipt_key[1]
            )
        ):
            raise DuplicateOrReboundObservation(
                f"receipt identity {new_receipt_key!r} is already bound to return "
                f"{existing_key!r}; refusing reuse for {new_key!r}"
            )
    all_rows = prior_rows + [new_row_dict]
    eligible_rows = [row for row in all_rows if not row.get("ineligibleClass")]
    n_eligible = len(eligible_rows)
    checkpoint = checkpoint_for_population(n_eligible)
    return {
        "rows": all_rows,
        "newRow": new_row_dict,
        "populationCount": len(all_rows),
        "eligibleCount": n_eligible,
        "checkpoint": checkpoint,
    }
__all__ = [name for name in globals() if not name.startswith("__")]
