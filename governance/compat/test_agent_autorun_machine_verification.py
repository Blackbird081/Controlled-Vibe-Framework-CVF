"""Focused hostile tests for the MFRP-P2 machine-verification receipt."""

import hashlib
import json
from pathlib import Path

import governance.compat.run_agent_autorun_workflow_gate as autorun


def _build_v3_receipt_payload(context, verifier_identity_digest, results=None):
    if results is None:
        results = (
            autorun.GateResult(
                index=1,
                name="sample",
                command=("python", "governance/compat/check_sample.py"),
                returncode=0,
                duration_s=0.1,
                output="",
            ),
        )
    machine_verification = autorun._machine_verification_object(
        context, verifier_identity_digest, results
    )
    return {
        "schema": autorun.RECEIPT_SCHEMA,
        "status": "PASS",
        **context,
        "verifierIdentityDigest": verifier_identity_digest,
        "machineVerification": machine_verification,
        "receiptDigest": autorun._machine_verification_digest(machine_verification),
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


# --- MFRP-P2: machine-verification receipt v3 hostile matrix ---


_MV_CONTEXT = {
    "phase": "pre-implementation",
    "base": "base",
    "head": "head",
    "baseSha": "abc",
    "headSha": "def",
    "commandManifestHash": "manifest",
    "worktreeFingerprint": "worktree",
    "verifierIdentityProfile": autorun.VERIFIER_IDENTITY_PROFILE,
}


def test_machine_verification_fixed_jcs_vector_match() -> None:
    # Published independent fixed vector for the P2 machine-verification
    # canonical preimage. The expected digest was derived by RFC 8785 JCS
    # serialization (sorted keys, compact separators, ensure_ascii=False,
    # UTF-8) of the literal object below, independent of the production
    # canonicalizer.
    preimage = {
        "profile": "cvf.autorun.machineVerification.v1",
        "schema": "cvf.autorun.pass-receipt.v3",
        "digestAlgorithm": "sha256",
        "phaseEnvelope": {
            "phase": "pre-implementation",
            "baseSha": "abc1234",
            "headSha": "def5678",
            "commandManifestHash": "manifest",
            "changedPathPlanDigest": "worktree",
        },
        "predecessor": {
            "availability": "NOT_CHECKED",
            "reason": "no seven-phase predecessor contract",
        },
        "verifierIdentity": {
            "profile": "cvf.autorun.verifierIdentity.v1",
            "digest": "0" * 64,
        },
        "hardObligation": {"linkPresence": "NOT_CHECKED", "failures": []},
        "manifestReconciliation": {
            "state": "NOT_CHECKED",
            "reason": "no expected artifact manifest",
        },
        "deterministicResults": [{"name": "check_\u03b1.py", "status": "PASS"}],
        "exceptions": [],
        "unclassifiedItems": ["predecessor contract not checked"],
        "notCheckedScope": ["seven-phase predecessor contract"],
        "limitations": ["local deterministic gate envelope"],
        "cacheDisposition": "PRODUCED_FROM_FULL_PASS",
    }
    expected_digest = "185c07637cb09d606c2bc20e7facccaf416f3f35aed83e75979a457d7b83471a"

    independent_bytes = json.dumps(
        preimage, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    assert len(independent_bytes) == 943
    assert hashlib.sha256(independent_bytes).hexdigest() == expected_digest
    assert autorun._jcs_bytes(preimage) == independent_bytes
    assert autorun._machine_verification_digest(preimage) == expected_digest


def test_self_hashed_partial_machine_verification_fails_closed() -> None:
    payload = {
        "schema": autorun.RECEIPT_SCHEMA,
        "status": "PASS",
        "phase": "pre-implementation",
        "base": "base",
        "head": "head",
        "baseSha": "abc",
        "headSha": "def",
        "commandManifestHash": "manifest",
        "worktreeFingerprint": "worktree",
        "verifierIdentityProfile": autorun.VERIFIER_IDENTITY_PROFILE,
        "verifierIdentityDigest": "a" * 64,
        "machineVerification": {
            "profile": autorun.MACHINE_VERIFICATION_PROFILE,
            "verifierIdentity": {
                "profile": autorun.VERIFIER_IDENTITY_PROFILE,
                "digest": "a" * 64,
            },
        },
    }
    payload["receiptDigest"] = autorun._machine_verification_digest(
        payload["machineVerification"]
    )

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "schema mismatch" in reason


def test_rehashed_cross_field_phase_mismatch_fails_closed() -> None:
    payload = _build_v3_receipt_payload(dict(_MV_CONTEXT), "a" * 64)
    payload["machineVerification"]["phaseEnvelope"]["phase"] = "pre-closure"
    payload["receiptDigest"] = autorun._machine_verification_digest(
        payload["machineVerification"]
    )

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "phase envelope mismatch" in reason


def test_v2_schema_forces_full_run(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    context = dict(_MV_CONTEXT)
    digest = "a" * 64
    v2_payload = {
        "schema": "cvf.autorun.pass-receipt.v2",
        "status": "PASS",
        **context,
        "verifierIdentityDigest": digest,
    }
    path.write_text(json.dumps(v2_payload), encoding="utf-8")

    valid, reason = autorun._load_valid_receipt(
        path, {**context, "verifierIdentityDigest": digest}
    )

    assert not valid
    assert reason == "receipt schema mismatch"


def test_unknown_schema_fails_closed(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    path.write_text(
        json.dumps(
            {
                "schema": "cvf.autorun.pass-receipt.v99",
                "status": "PASS",
            }
        ),
        encoding="utf-8",
    )

    valid, reason = autorun._load_valid_receipt(path, _MV_CONTEXT)

    assert not valid
    assert reason == "receipt schema mismatch"


def test_tampered_receipt_digest_rejected(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    context = dict(_MV_CONTEXT)
    digest = "a" * 64
    payload = _build_v3_receipt_payload(context, digest)
    payload["receiptDigest"] = "f" * 64  # tamper the digest
    path.write_text(json.dumps(payload), encoding="utf-8")

    valid, reason = autorun._load_valid_receipt(
        path, {**context, "verifierIdentityDigest": digest}
    )

    assert not valid
    assert "receiptDigest mismatch" in reason


def test_tampered_authority_bearing_field_rejected(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    context = dict(_MV_CONTEXT)
    digest = "a" * 64
    payload = _build_v3_receipt_payload(context, digest)
    # Tamper an authority-bearing field without updating the digest.
    payload["machineVerification"]["phaseEnvelope"]["commandManifestHash"] = "tampered"
    path.write_text(json.dumps(payload), encoding="utf-8")

    valid, reason = autorun._load_valid_receipt(
        path, {**context, "verifierIdentityDigest": digest}
    )

    assert not valid
    assert "receiptDigest mismatch" in reason


def test_inconsistent_verifier_identity_rejected(tmp_path: Path) -> None:
    path = tmp_path / "receipt.json"
    context = dict(_MV_CONTEXT)
    digest = "a" * 64
    payload = _build_v3_receipt_payload(context, digest)
    payload["machineVerification"]["verifierIdentity"]["digest"] = "b" * 64
    payload["receiptDigest"] = autorun._machine_verification_digest(
        payload["machineVerification"]
    )
    path.write_text(json.dumps(payload), encoding="utf-8")

    valid, reason = autorun._load_valid_receipt(
        path, {**context, "verifierIdentityDigest": digest}
    )

    assert not valid
    assert "verifierIdentityDigest inconsistent" in reason


def test_machine_verification_digest_excludes_duration() -> None:
    context = dict(_MV_CONTEXT)
    results = (
        autorun.GateResult(
            index=1,
            name="sample",
            command=("python", "governance/compat/check_sample.py"),
            returncode=0,
            duration_s=1.5,
            output="",
        ),
    )
    machine_verification = autorun._machine_verification_object(
        context, "a" * 64, results
    )
    digest = autorun._machine_verification_digest(machine_verification)

    serialized = json.dumps(machine_verification)
    assert "durationSeconds" not in serialized
    assert "totalDurationSeconds" not in serialized

    # A duration-only change in the result does not affect the digest.
    results_other = (
        autorun.GateResult(
            index=1,
            name="sample",
            command=("python", "governance/compat/check_sample.py"),
            returncode=0,
            duration_s=9.9,
            output="",
        ),
    )
    machine_verification_other = autorun._machine_verification_object(
        context, "a" * 64, results_other
    )
    assert autorun._machine_verification_digest(machine_verification_other) == digest


def test_manifest_absence_surfaced_unclassified() -> None:
    machine_verification = autorun._machine_verification_object(
        _MV_CONTEXT, "a" * 64, ()
    )

    assert machine_verification["manifestReconciliation"]["state"] == "NOT_CHECKED"
    assert (
        "expected artifact manifest not checked"
        in machine_verification["unclassifiedItems"]
    )
    assert "expected artifact manifest" in machine_verification["notCheckedScope"]


def test_missing_predecessor_and_obligation_remain_not_checked() -> None:
    machine_verification = autorun._machine_verification_object(
        _MV_CONTEXT, "a" * 64, ()
    )

    assert machine_verification["predecessor"]["availability"] == "NOT_CHECKED"
    assert machine_verification["hardObligation"]["linkPresence"] == "NOT_CHECKED"
    assert machine_verification["hardObligation"]["failures"] == []
    assert (
        "seven-phase predecessor contract not checked"
        in machine_verification["unclassifiedItems"]
    )
    assert "hard-obligation map not checked" in machine_verification["unclassifiedItems"]


def test_machine_verification_makes_no_semantic_readiness_claim() -> None:
    machine_verification = autorun._machine_verification_object(
        _MV_CONTEXT, "a" * 64, ()
    )

    serialized = json.dumps(machine_verification)
    for token in ("READY_WITH_EXECUTABLE_PROOF", "CLOSURE", "ACCEPTED", "ACTIVE"):
        assert token not in serialized
    assert "local deterministic gate envelope" in machine_verification["limitations"][0]


# --- MFRP-FINGERPRINT-T1 rework: committedEvidence omission-vs-malformed matrix ---


def _valid_committed_evidence(base_sha: str, head_sha: str) -> dict:
    return {
        "profile": "cvf.committedEvidenceFingerprint.v1",
        "baseSha": base_sha,
        "headSha": head_sha,
        "fingerprint": "a" * 64,
    }


def _receipt_with_committed_evidence(committed_evidence_object) -> dict:
    context = dict(_MV_CONTEXT)
    context["baseSha"] = "a" * 40
    context["headSha"] = "b" * 40
    if committed_evidence_object is not None:
        context["committedEvidence"] = committed_evidence_object
    digest = "a" * 64
    payload = _build_v3_receipt_payload(context, digest)
    return payload


def test_legacy_receipt_with_no_committed_evidence_key_anywhere_is_valid() -> None:
    payload = _receipt_with_committed_evidence(None)
    assert "committedEvidence" not in payload
    assert "committedEvidence" not in payload["machineVerification"]

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert valid, reason


def test_receipt_with_valid_matching_binding_is_accepted() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    payload = _receipt_with_committed_evidence(evidence)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert valid, reason


def test_top_level_null_committed_evidence_with_no_nested_key_is_rejected() -> None:
    payload = _receipt_with_committed_evidence(None)
    payload["committedEvidence"] = None
    assert "committedEvidence" not in payload["machineVerification"]

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "one-sided" in reason


def test_top_level_and_nested_both_null_is_rejected_not_treated_as_omission() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    payload = _receipt_with_committed_evidence(evidence)
    # Post-construction mutation only: the receiptDigest was already
    # computed over machineVerification with the valid evidence object, so
    # setting both copies to null afterward proves the validator never
    # treats a present-but-null key pair as a benign legacy omission. A
    # null value inside machineVerification cannot survive JCS
    # recanonicalization either, so the digest-mismatch/canonicalization
    # check legitimately fires first here -- that is still a structured
    # fail-closed rejection, not a fall-through to the "valid" legacy path.
    payload["committedEvidence"] = None
    payload["machineVerification"]["committedEvidence"] = None

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert isinstance(reason, str) and reason


def test_one_sided_presence_top_only_is_rejected() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    payload = _receipt_with_committed_evidence(None)
    payload["committedEvidence"] = evidence
    assert "committedEvidence" not in payload["machineVerification"]

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "one-sided" in reason


def test_one_sided_presence_nested_only_is_rejected() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    payload = _receipt_with_committed_evidence(evidence)
    # Post-construction mutation: strip only the top-level copy, leaving the
    # already-signed nested copy in place under machineVerification/receiptDigest.
    del payload["committedEvidence"]
    assert "committedEvidence" not in payload
    assert "committedEvidence" in payload["machineVerification"]

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "one-sided" in reason


def test_top_nested_mismatch_is_rejected() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    other = _valid_committed_evidence("a" * 40, "c" * 40)
    payload = _receipt_with_committed_evidence(evidence)
    payload["machineVerification"]["committedEvidence"] = other

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "mismatch" in reason


def _tamper_committed_evidence_after_signing(field: str, hostile_value) -> dict:
    """Sign a payload with a genuinely valid committedEvidence object, then
    mutate one field to a hostile (wrong-type) value at both the top-level
    and nested copies *after* signing. This is the only way a receipt with a
    non-JCS-safe field value (an int, which ``_jcs_bytes`` itself refuses to
    serialize) can exist on disk at all: it must have been hand-tampered
    post-signing, exactly like any other tampered-field attack in this
    file's existing matrix. Whether the validator's first hit is the digest
    mismatch or the committedEvidence shape check, both are correct
    structured fail-closed outcomes; the defect this proves fixed is a raw
    ``TypeError`` escaping instead of either.
    """
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    payload = _receipt_with_committed_evidence(evidence)
    payload["committedEvidence"][field] = hostile_value
    payload["machineVerification"]["committedEvidence"][field] = hostile_value
    return payload


def test_wrong_type_base_sha_integer_does_not_raise_and_is_rejected() -> None:
    payload = _tamper_committed_evidence_after_signing("baseSha", 123)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert isinstance(reason, str) and reason


def test_wrong_type_head_sha_integer_does_not_raise_and_is_rejected() -> None:
    payload = _tamper_committed_evidence_after_signing("headSha", 123)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert isinstance(reason, str) and reason


def test_wrong_type_fingerprint_integer_does_not_raise_and_is_rejected() -> None:
    payload = _tamper_committed_evidence_after_signing("fingerprint", 123)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert isinstance(reason, str) and reason


def test_missing_field_in_committed_evidence_is_rejected() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    del evidence["fingerprint"]
    payload = _receipt_with_committed_evidence(evidence)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid


def test_extra_field_in_committed_evidence_is_rejected() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    evidence["unexpected"] = "value"
    payload = _receipt_with_committed_evidence(evidence)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid


def test_unknown_profile_in_committed_evidence_is_rejected() -> None:
    evidence = _valid_committed_evidence("a" * 40, "b" * 40)
    evidence["profile"] = "cvf.committedEvidenceFingerprint.v2"
    payload = _receipt_with_committed_evidence(evidence)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid


def test_committed_evidence_base_head_not_matching_receipt_context_is_rejected() -> None:
    evidence = _valid_committed_evidence("f" * 40, "e" * 40)
    payload = _receipt_with_committed_evidence(evidence)

    valid, reason = autorun._validate_receipt_integrity(payload)

    assert not valid
    assert "does not match receipt context" in reason


def test_no_json_input_shape_raises_type_error_through_validator() -> None:
    """Hostile sweep: every deliberately malformed committedEvidence shape
    below must return a structured (False, reason) result, never let a
    TypeError escape _validate_receipt_integrity."""
    hostile_committed_evidence_values = [
        None,
        123,
        "not-a-dict",
        [],
        True,
        {"profile": "cvf.committedEvidenceFingerprint.v1", "baseSha": 123, "headSha": "b" * 40, "fingerprint": "a" * 64},
        {"profile": "cvf.committedEvidenceFingerprint.v1", "baseSha": "a" * 40, "headSha": None, "fingerprint": "a" * 64},
        {"profile": "cvf.committedEvidenceFingerprint.v1", "baseSha": "a" * 40, "headSha": "b" * 40, "fingerprint": []},
    ]
    for hostile_value in hostile_committed_evidence_values:
        payload = _receipt_with_committed_evidence(None)
        payload["committedEvidence"] = hostile_value
        payload["machineVerification"]["committedEvidence"] = hostile_value
        try:
            valid, reason = autorun._validate_receipt_integrity(payload)
        except TypeError as exc:  # pragma: no cover - defect proof
            raise AssertionError(
                f"TypeError escaped for hostile value {hostile_value!r}: {exc}"
            )
        assert isinstance(valid, bool)
        assert isinstance(reason, str) and reason
