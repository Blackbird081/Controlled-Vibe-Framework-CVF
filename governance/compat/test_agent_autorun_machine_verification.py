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
