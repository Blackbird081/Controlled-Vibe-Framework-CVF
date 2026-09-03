"""Bounded read-only composition for AAF machine-verification readouts."""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

DETERMINISTIC_PREFLIGHT_COMPLETE = "DETERMINISTIC_PREFLIGHT_COMPLETE"


@dataclass(frozen=True)
class MachineVerificationReadout:
    """Mechanical evidence only; semantic review and closure remain external."""

    valid: bool
    reason: str
    receipt_identity: dict[str, str]
    not_checked_scope: tuple[str, ...]
    limitations: tuple[str, ...]
    unclassified: tuple[str, ...]
    exceptions: tuple[str, ...]
    deterministic_results: tuple[dict[str, str], ...]
    candidate_probes: tuple[str, ...]
    claim_boundary: str

    @property
    def deterministic_preflight_complete(self) -> bool:
        return self.valid


def _import_autorun_owner():
    try:
        import run_agent_autorun_workflow_gate as autorun
    except ModuleNotFoundError:
        from governance.compat import run_agent_autorun_workflow_gate as autorun
    return autorun


def read_receipt_readonly(
    receipt_path: str, repo_root: Path
) -> tuple[bool, object | None, str]:
    """Load within ``repo_root`` and validate through the canonical owner."""
    candidate = Path(receipt_path)
    if not candidate.is_absolute():
        candidate = repo_root / candidate
    try:
        resolved = candidate.resolve()
        resolved.relative_to(repo_root.resolve())
    except (ValueError, OSError):
        return False, None, "receipt path outside repository boundary"
    if not resolved.is_file():
        return False, None, "receipt path is not a file"
    try:
        payload = json.loads(resolved.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return False, None, f"receipt unreadable: {exc}"
    valid, reason = _import_autorun_owner()._validate_receipt_integrity(payload)
    return valid, payload, reason


def build_machine_verification_readout(
    valid: bool, payload: object | None, reason: str
) -> MachineVerificationReadout:
    payload_object = payload if isinstance(payload, dict) else {}
    nested = payload_object.get("machineVerification")
    mv = nested if isinstance(nested, dict) else {}

    def strings(value: object) -> tuple[str, ...]:
        if not isinstance(value, list):
            return ()
        return tuple(item for item in value if isinstance(item, str))

    def result_objects(value: object) -> tuple[dict[str, str], ...]:
        if not isinstance(value, list):
            return ()
        return tuple(
            {
                key: item
                for key, item in result.items()
                if isinstance(key, str) and isinstance(item, str)
            }
            for result in value
            if isinstance(result, dict)
        )

    not_checked_scope = strings(mv.get("notCheckedScope"))
    candidate_probes = tuple(
        f"evidence gap: {scope}; inspect its governing source only if the review claim depends on it"
        for scope in not_checked_scope
    )

    def identity(field: str, source: dict = payload_object) -> str:
        value = source.get(field, "")
        return value if isinstance(value, str) else ""

    return MachineVerificationReadout(
        valid=valid,
        reason=reason,
        receipt_identity={
            "schema": identity("schema"),
            "profile": identity("profile", mv),
            "receiptDigest": identity("receiptDigest"),
            "phase": identity("phase"),
            "baseSha": identity("baseSha"),
            "headSha": identity("headSha"),
            "commandManifestHash": identity("commandManifestHash"),
            "changedPathPlanDigest": identity("worktreeFingerprint"),
            "verifierIdentityDigest": identity("verifierIdentityDigest"),
        },
        not_checked_scope=not_checked_scope,
        limitations=strings(mv.get("limitations")),
        unclassified=strings(mv.get("unclassifiedItems")),
        exceptions=strings(mv.get("exceptions")),
        deterministic_results=result_objects(mv.get("deterministicResults")),
        candidate_probes=candidate_probes,
        claim_boundary=(
            "machine readout reports deterministic local evidence only; the "
            "reviewer retains semantic evaluation, acceptance and closure"
        ),
    )


def machine_readout_to_dict(item: MachineVerificationReadout | None) -> dict | None:
    if item is None:
        return None
    return {
        "status": (
            DETERMINISTIC_PREFLIGHT_COMPLETE
            if item.deterministic_preflight_complete
            else "RECEIPT_INVALID_FAIL_CLOSED"
        ),
        "receiptIdentity": item.receipt_identity,
        "notCheckedScope": list(item.not_checked_scope),
        "limitations": list(item.limitations),
        "unclassified": list(item.unclassified),
        "exceptions": list(item.exceptions),
        "deterministicResults": list(item.deterministic_results),
        "candidateProbes": list(item.candidate_probes),
        "claimBoundary": item.claim_boundary,
        "deterministicPreflightComplete": item.deterministic_preflight_complete,
        "reason": item.reason,
    }


def print_machine_verification_readout(item: MachineVerificationReadout | None) -> None:
    if item is None:
        return
    data = machine_readout_to_dict(item)
    assert data is not None
    print(f"\nMachine Verification Readout (MFRP-P2, L0 read-only): {data['status']}")
    print(f"  receipt identity: {item.receipt_identity}")
    print(f"  not-checked scope: {list(item.not_checked_scope)}")
    print(f"  limitations: {list(item.limitations)}")
    print(f"  UNCLASSIFIED: {list(item.unclassified)}")
    print(f"  exceptions: {list(item.exceptions)}")
    print(f"  deterministic results: {list(item.deterministic_results)}")
    print(f"  candidate probes: {list(item.candidate_probes)}")
    print(f"  claim boundary: {item.claim_boundary}")
    if not item.valid:
        print(f"  reason: {item.reason}")


def add_consume_receipt_argument(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--consume-receipt",
        metavar="PATH",
        default=None,
        help=(
            "Optionally read a repository-bounded local autorun PASS receipt and "
            "append the L0 machine-verification readout. Read-only; an absent "
            "option changes nothing."
        ),
    )
