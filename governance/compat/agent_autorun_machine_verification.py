#!/usr/bin/env python3
"""Canonical P2 machine-verification receipt mechanics.

The autorun workflow gate remains the public receipt owner and re-exports this
module's private compatibility symbols. Keeping canonicalization, composition,
and structural validation together prevents AAF or other readers from forking
digest semantics.
"""

from __future__ import annotations

import hashlib
import json
from typing import Protocol, Sequence


RECEIPT_SCHEMA = "cvf.autorun.pass-receipt.v3"
VERIFIER_IDENTITY_PROFILE = "cvf.autorun.verifierIdentity.v1"
MACHINE_VERIFICATION_PROFILE = "cvf.autorun.machineVerification.v1"

_NOT_CHECKED = "NOT_CHECKED"
_LOCAL_PREDECESSOR_REASON = (
    "no external seven-phase predecessor contract exists in the local P2 composition"
)
_LOCAL_MANIFEST_REASON = (
    "no expected artifact manifest input exists in the local P2 composition"
)
_LOCAL_COMPOSITION_LIMITATION = (
    "this is a local deterministic gate envelope, not a complete seven-phase "
    "phase-return envelope"
)
_LOCAL_UNCLASSIFIED_PREDECESSOR = "seven-phase predecessor contract not checked"
_LOCAL_UNCLASSIFIED_HARD_OBLIGATION = "hard-obligation map not checked"
_LOCAL_UNCLASSIFIED_MANIFEST = "expected artifact manifest not checked"


class VerifierIdentityUnavailable(Exception):
    """Raised when a restricted-JCS value cannot be represented safely."""


class GateResultLike(Protocol):
    name: str


def _jcs_bytes(obj: object) -> bytes:
    """Restricted RFC 8785 JCS for strings, arrays, and objects only."""

    def validate(value: object) -> None:
        if isinstance(value, str):
            if any(0xD800 <= ord(character) <= 0xDFFF for character in value):
                raise VerifierIdentityUnavailable(
                    "verifier identity contains a non-I-JSON surrogate"
                )
            return
        if isinstance(value, list):
            for item in value:
                validate(item)
            return
        if isinstance(value, dict):
            for key, item in value.items():
                if not isinstance(key, str):
                    raise VerifierIdentityUnavailable(
                        "verifier identity object key is not a string"
                    )
                validate(key)
                validate(item)
            return
        raise VerifierIdentityUnavailable(
            f"unsupported verifier identity value type: {type(value).__name__}"
        )

    validate(obj)
    return json.dumps(
        obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def _machine_verification_object(
    context: dict[str, str],
    verifier_identity_digest: str,
    results: Sequence[GateResultLike],
) -> dict[str, object]:
    """Build the duration-free canonical preimage for ``receiptDigest``."""
    return {
        "profile": MACHINE_VERIFICATION_PROFILE,
        "schema": RECEIPT_SCHEMA,
        "digestAlgorithm": "sha256",
        "phaseEnvelope": {
            "phase": context["phase"],
            "baseSha": context["baseSha"],
            "headSha": context["headSha"],
            "commandManifestHash": context["commandManifestHash"],
            "changedPathPlanDigest": context["worktreeFingerprint"],
        },
        "predecessor": {
            "availability": _NOT_CHECKED,
            "reason": _LOCAL_PREDECESSOR_REASON,
        },
        "verifierIdentity": {
            "profile": VERIFIER_IDENTITY_PROFILE,
            "digest": verifier_identity_digest,
        },
        "hardObligation": {"linkPresence": _NOT_CHECKED, "failures": []},
        "manifestReconciliation": {
            "state": _NOT_CHECKED,
            "reason": _LOCAL_MANIFEST_REASON,
        },
        "deterministicResults": [
            {"name": result.name, "status": "PASS"} for result in results
        ],
        "exceptions": [],
        "unclassifiedItems": [
            _LOCAL_UNCLASSIFIED_PREDECESSOR,
            _LOCAL_UNCLASSIFIED_HARD_OBLIGATION,
            _LOCAL_UNCLASSIFIED_MANIFEST,
        ],
        "notCheckedScope": [
            "seven-phase predecessor contract",
            "hard-obligation map",
            "expected artifact manifest",
        ],
        "limitations": [_LOCAL_COMPOSITION_LIMITATION],
        "cacheDisposition": "PRODUCED_FROM_FULL_PASS",
    }


def _machine_verification_digest(machine_verification: dict[str, object]) -> str:
    return hashlib.sha256(_jcs_bytes(machine_verification)).hexdigest()


def _validate_receipt_integrity(payload: object) -> tuple[bool, str]:
    """Recompute the digest and validate the complete local v3 profile."""
    if not isinstance(payload, dict):
        return False, "receipt payload is not an object"
    if payload.get("schema") != RECEIPT_SCHEMA:
        return False, "receipt schema mismatch"
    if payload.get("status") != "PASS":
        return False, "receipt status mismatch"
    machine_verification = payload.get("machineVerification")
    if not isinstance(machine_verification, dict):
        return False, "receipt machineVerification missing or malformed"
    if machine_verification.get("profile") != MACHINE_VERIFICATION_PROFILE:
        return False, "receipt machineVerification profile mismatch"
    if payload.get("verifierIdentityProfile") != VERIFIER_IDENTITY_PROFILE:
        return False, "receipt verifierIdentityProfile mismatch"

    context_keys = (
        "phase", "base", "head", "baseSha", "headSha",
        "commandManifestHash", "worktreeFingerprint",
    )
    if any(
        not isinstance(payload.get(key), str) or not payload[key]
        for key in context_keys
    ):
        return False, "receipt context missing or malformed"

    verifier_digest = payload.get("verifierIdentityDigest")
    receipt_digest = payload.get("receiptDigest")
    if not _is_sha256(verifier_digest):
        return False, "receipt verifierIdentityDigest missing or malformed"
    if not _is_sha256(receipt_digest):
        return False, "receipt receiptDigest missing or malformed"
    try:
        recomputed = _machine_verification_digest(machine_verification)
    except VerifierIdentityUnavailable as exc:
        return False, f"receipt machineVerification canonicalization failed: {exc}"
    if recomputed != receipt_digest:
        return False, "receipt receiptDigest mismatch (tampered or stale)"

    expected_envelope = {
        "phase": payload["phase"],
        "baseSha": payload["baseSha"],
        "headSha": payload["headSha"],
        "commandManifestHash": payload["commandManifestHash"],
        "changedPathPlanDigest": payload["worktreeFingerprint"],
    }
    if machine_verification.get("schema") != RECEIPT_SCHEMA:
        return False, "receipt machineVerification schema mismatch"
    if machine_verification.get("digestAlgorithm") != "sha256":
        return False, "receipt machineVerification digest algorithm mismatch"
    if machine_verification.get("phaseEnvelope") != expected_envelope:
        return False, "receipt machineVerification phase envelope mismatch"

    predecessor = machine_verification.get("predecessor")
    if not isinstance(predecessor, dict) or predecessor.get("availability") != _NOT_CHECKED:
        return False, "receipt predecessor state missing or malformed"
    if not isinstance(predecessor.get("reason"), str) or not predecessor["reason"]:
        return False, "receipt predecessor reason missing or malformed"

    verifier_identity = machine_verification.get("verifierIdentity")
    if not isinstance(verifier_identity, dict):
        return False, "receipt machineVerification verifier identity missing"
    if verifier_identity.get("profile") != VERIFIER_IDENTITY_PROFILE:
        return False, "receipt machineVerification verifier profile mismatch"
    if verifier_identity.get("digest") != verifier_digest:
        return False, "receipt verifierIdentityDigest inconsistent with machineVerification"

    if machine_verification.get("hardObligation") != {
        "linkPresence": _NOT_CHECKED,
        "failures": [],
    }:
        return False, "receipt hard-obligation state missing or malformed"
    manifest = machine_verification.get("manifestReconciliation")
    if not isinstance(manifest, dict) or manifest.get("state") != _NOT_CHECKED:
        return False, "receipt manifest state missing or malformed"
    if not isinstance(manifest.get("reason"), str) or not manifest["reason"]:
        return False, "receipt manifest reason missing or malformed"

    results = machine_verification.get("deterministicResults")
    if not isinstance(results, list) or not results:
        return False, "receipt deterministic results missing or malformed"
    if any(
        not isinstance(item, dict)
        or not isinstance(item.get("name"), str)
        or not item["name"]
        or item.get("status") != "PASS"
        for item in results
    ):
        return False, "receipt deterministic result is not a named PASS"
    checks = payload.get("checks")
    if not isinstance(checks, list) or len(checks) != len(results):
        return False, "receipt checks missing or inconsistent"
    if any(not _check_matches_result(check, result) for check, result in zip(checks, results)):
        return False, "receipt check is not consistent with deterministic results"

    required_unclassified = [
        _LOCAL_UNCLASSIFIED_PREDECESSOR,
        _LOCAL_UNCLASSIFIED_HARD_OBLIGATION,
        _LOCAL_UNCLASSIFIED_MANIFEST,
    ]
    required_not_checked = [
        "seven-phase predecessor contract",
        "hard-obligation map",
        "expected artifact manifest",
    ]
    if machine_verification.get("unclassifiedItems") != required_unclassified:
        return False, "receipt unclassified items missing or malformed"
    if machine_verification.get("notCheckedScope") != required_not_checked:
        return False, "receipt not-checked scope missing or malformed"
    if machine_verification.get("limitations") != [_LOCAL_COMPOSITION_LIMITATION]:
        return False, "receipt limitations missing or malformed"
    exceptions = machine_verification.get("exceptions")
    if not isinstance(exceptions, list) or any(
        not isinstance(item, str) for item in exceptions
    ):
        return False, "receipt exceptions missing or malformed"
    if machine_verification.get("cacheDisposition") != "PRODUCED_FROM_FULL_PASS":
        return False, "receipt cache disposition missing or malformed"
    return True, "receipt internal integrity valid"


def _is_sha256(value: object) -> bool:
    return (
        isinstance(value, str)
        and len(value) == 64
        and all(character in "0123456789abcdef" for character in value)
    )


def _check_matches_result(check: object, result: dict[str, object]) -> bool:
    if not isinstance(check, dict) or check.get("name") != result["name"]:
        return False
    command = check.get("command")
    return (
        check.get("status") == "PASS"
        and isinstance(command, list)
        and bool(command)
        and all(isinstance(argument, str) for argument in command)
    )
