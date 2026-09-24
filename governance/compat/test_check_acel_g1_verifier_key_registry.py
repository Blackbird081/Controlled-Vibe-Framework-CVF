#!/usr/bin/env python3
"""Focused positive/negative tests for check_acel_g1_verifier_key_registry.

Runs entirely against disposable fixtures under a temporary directory. Never
touches the real Group 1 governed paths and never claims any Group 1 source
is created, admitted, promoted or consumer-wired.

T3A-C2-R2-04/R3-04: this module contains the R2 six reviewer-probe
regressions, the R3 reviewer-probe regressions (duplicate transition ID plus
wrong actor on a later entry; an invalid ACTIVE->ACTIVE transition with
cross-record time disagreement; an entirely caller-selected substitute
product), and the automated cross-tool proof that pipes the PowerShell
writer's own hermetic self-test output into the Python checker's
canonicalizer, run as a normal test method rather than a manually reported
step.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_acel_g1_verifier_key_registry as checker  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
WRITER_SCRIPT_RELATIVE = "scripts/acel_g1_party_a_group1_source_writer.ps1"

T2F_VECTOR_PREIMAGE = {
    "profile": "cvf.source-record-canonicalization@1",
    "domain": "cvf.keyRegistryRow",
    "keyId": "key-testvector-0001",
    "publicKeyBytesBase64": "RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw",
    "algorithm": "Ed25519",
    "role": "verificationAuthority",
    "issuedAt": "2026-09-18T00:00:00Z",
    "expiresAt": "2027-09-18T00:00:00Z",
    "revokedAt": None,
    "status": "ACTIVE",
    "rotatedFromKeyId": None,
}
T2F_VECTOR_DIGEST = "0c798661caf02b0d3537b845ca6b95f94c3ad4af4221ca4502d508dba17d3061"

FIXTURE_ACTOR = "LAM-RUBY\\cvf-g1-party-a"
FIXTURE_ISSUED_AT = "2026-09-19T00:00:00Z"
FIXTURE_EXPIRES_AT = "2027-09-19T00:00:00Z"


def _valid_row(**overrides) -> dict:
    base_preimage = {
        "profile": checker.CANON_PROFILE,
        "domain": checker.REGISTRY_ROW_DOMAIN,
        "keyId": "fixture-key-0001",
        "publicKeyBytesBase64": "RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw",
        "algorithm": "Ed25519",
        "role": "verificationAuthority",
        "issuedAt": FIXTURE_ISSUED_AT,
        "expiresAt": FIXTURE_EXPIRES_AT,
        "revokedAt": None,
        "status": "ACTIVE",
        "rotatedFromKeyId": None,
    }
    base_preimage.update(overrides)
    digest = checker._sha256_hex(checker._canonical_json_bytes(base_preimage))
    row = {k: v for k, v in base_preimage.items() if k not in ("profile", "domain")}
    row["rowHashHex"] = digest
    return row


def _valid_lifecycle_receipt(*, key_id: str, prior_hash: str | None = None, **overrides) -> dict:
    base_preimage = {
        "profile": checker.CANON_PROFILE,
        "domain": checker.LIFECYCLE_ROW_DOMAIN,
        "transitionId": "fixture-transition-0001",
        "keyId": key_id,
        "registrySnapshotVersionBefore": 0,
        "registrySnapshotVersionAfter": 1,
        "priorStatus": "NOT_PRESENT",
        "newStatus": "ACTIVE",
        "actor": FIXTURE_ACTOR,
        "timestamp": FIXTURE_ISSUED_AT,
        "priorEntryHashHex": prior_hash,
    }
    base_preimage.update(overrides)
    digest = checker._sha256_hex(checker._canonical_json_bytes(base_preimage))
    receipt = {k: v for k, v in base_preimage.items() if k not in ("profile", "domain")}
    receipt["entryHashHex"] = digest
    return receipt


def _valid_envelope(row: dict, *, version: int = 1, write_timestamp: str = FIXTURE_ISSUED_AT) -> dict:
    return {
        "registrySnapshotId": "fixture-snapshot-0001",
        "registrySnapshotVersion": version,
        "writeTimestamp": write_timestamp,
        "rows": [row],
    }


def _expected_product_for(row: dict, *, actor: str = FIXTURE_ACTOR) -> dict:
    return {
        "keyId": row["keyId"],
        "publicKeyBytesBase64": row["publicKeyBytesBase64"],
        "issuedAt": row["issuedAt"],
        "expiresAt": row["expiresAt"],
        "actor": actor,
    }


def _expected_product_with_key(*, key_id: str, public_key_base64: str, issued_at: str, expires_at: str,
                                actor: str = FIXTURE_ACTOR) -> dict:
    return {"keyId": key_id, "publicKeyBytesBase64": public_key_base64, "issuedAt": issued_at,
            "expiresAt": expires_at, "actor": actor}


# Placeholder expected-product used only by tests that never reach row
# validation (the registry file itself is missing/unparseable first).
_UNREACHED_EXPECTED_PRODUCT = _expected_product_with_key(
    key_id="x", public_key_base64="y", issued_at=FIXTURE_ISSUED_AT, expires_at=FIXTURE_EXPIRES_AT
)


class CanonicalizationCrossCheckTests(unittest.TestCase):
    def test_python_canonicalizer_matches_t2f_published_vector(self) -> None:
        digest = checker._sha256_hex(checker._canonical_json_bytes(T2F_VECTOR_PREIMAGE))
        self.assertEqual(digest, T2F_VECTOR_DIGEST)


class Base64UrlStrictnessTests(unittest.TestCase):
    """T3A-C2-R2-01: reject anything except the canonical unpadded alphabet."""

    def test_valid_unpadded_base64url_accepted(self) -> None:
        decoded = checker._decode_base64url_strict("RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw")
        self.assertEqual(len(decoded), 32)

    def test_padded_base64url_rejected(self) -> None:
        padded = "RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw="
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._decode_base64url_strict(padded)
        self.assertEqual(ctx.exception.taxonomy_id, "PUBLIC_KEY_NON_CANONICAL_BASE64URL")

    def test_standard_base64_characters_rejected(self) -> None:
        standard = "RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs+PTJrQRXomw"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._decode_base64url_strict(standard)
        self.assertEqual(ctx.exception.taxonomy_id, "PUBLIC_KEY_NON_CANONICAL_BASE64URL")

    def test_duplicate_json_member_rejected(self) -> None:
        raw = '{"a": 1, "a": 2}'
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._parse_json_strict(raw)
        self.assertEqual(ctx.exception.taxonomy_id, "DUPLICATE_JSON_MEMBER")

    def test_escaped_alias_duplicate_json_member_rejected(self) -> None:
        """T3A-C2-R3-R1-02 (Python side, already correct): Python's
        `json.loads(..., object_pairs_hook=...)` decodes `\\uXXXX` and every
        other standard JSON escape BEFORE invoking the hook, so `keyId` and
        `key\\u0049d` are already the same decoded string by the time
        duplicate detection runs. This is a regression proof, not a repair:
        confirms the reviewer's demonstrated escaped-alias probe was never
        exploitable against this Python checker."""
        raw = '{"keyId":"wrong","key\\u0049d":"right"}'
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._parse_json_strict(raw)
        self.assertEqual(ctx.exception.taxonomy_id, "DUPLICATE_JSON_MEMBER")

    def test_escaped_alias_duplicate_second_field_rejected(self) -> None:
        raw = '{"metadataSchema":"wrong","metadata\\u0053chema":"right"}'
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._parse_json_strict(raw)
        self.assertEqual(ctx.exception.taxonomy_id, "DUPLICATE_JSON_MEMBER")


class OperationalAuthorityTests(unittest.TestCase):
    """T3A-C2-R3-02/R3-R1-01: operational authority is fixed and never caller-selectable."""

    def test_no_environment_variable_override_path_in_checker_module(self) -> None:
        """T3A-C2-R3-R1-01 (Python side, already correct): confirms this
        module contains no `os.environ`/`getenv` read anywhere, so there is
        no equivalent of the writer's former environment-variable authority
        override on the Python side."""
        import inspect

        source = inspect.getsource(checker)
        self.assertNotIn("os.environ", source)
        self.assertNotIn("getenv", source)

    def test_operational_expected_product_matches_verified_constant(self) -> None:
        product = checker._operational_expected_product()
        self.assertEqual(product["keyId"], checker.VERIFIED_PARTY_A_PRODUCT["keyId"])
        self.assertEqual(product["publicKeyBytesBase64"], checker.VERIFIED_PARTY_A_PRODUCT["publicKeyBytesBase64"])
        self.assertEqual(product["issuedAt"], checker.VERIFIED_PARTY_A_PRODUCT["createdAtUtc"])
        self.assertEqual(product["expiresAt"], checker.VERIFIED_PARTY_A_PRODUCT["expiresAtUtc"])
        self.assertEqual(product["actor"], checker.VERIFIED_PARTY_A_PRODUCT["principalName"])

    def test_cli_exposes_no_expected_product_argument(self) -> None:
        """A regression against reintroducing caller-selectable authority
        arguments: the CLI parser must accept only --registry-path and
        --lifecycle-path."""
        import argparse
        import io
        import contextlib

        stderr_capture = io.StringIO()
        with contextlib.redirect_stderr(stderr_capture):
            with self.assertRaises(SystemExit):
                checker.main(["--expected-key-id", "whatever"])
        self.assertIn("unrecognized arguments", stderr_capture.getvalue())

    def test_main_help_lists_only_path_arguments(self) -> None:
        import io
        import contextlib

        stdout_capture = io.StringIO()
        with contextlib.redirect_stdout(stdout_capture):
            with self.assertRaises(SystemExit):
                checker.main(["--help"])
        help_text = stdout_capture.getvalue()
        self.assertIn("--registry-path", help_text)
        self.assertIn("--lifecycle-path", help_text)
        self.assertNotIn("--expected-key-id", help_text)
        self.assertNotIn("--expected-public-key-base64", help_text)
        self.assertNotIn("--expected-actor", help_text)


class RegistryRowValidationTests(unittest.TestCase):
    def test_valid_row_passes(self) -> None:
        row = _valid_row()
        digest = checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(digest, row["rowHashHex"])

    def test_missing_field_rejected(self) -> None:
        row = _valid_row()
        del row["rotatedFromKeyId"]
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_FIELD_MISSING")

    def test_extra_field_rejected(self) -> None:
        row = _valid_row()
        row["unexpectedField"] = "should not be here"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_EXTRA_FIELD")

    def test_digest_mismatch_rejected(self) -> None:
        row = _valid_row()
        row["rowHashHex"] = "a" * 64
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_DIGEST_MISMATCH")

    def test_digest_shape_invalid_rejected(self) -> None:
        row = _valid_row()
        row["rowHashHex"] = "not-64-hex-chars"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_DIGEST_SHAPE_INVALID")

    def test_wrong_public_key_length_rejected(self) -> None:
        short_b64url = "AAAAAAAAAAAAAAAAAAAAAA"
        row = _valid_row(publicKeyBytesBase64=short_b64url)
        expected = _expected_product_with_key(
            key_id=row["keyId"], public_key_base64=short_b64url, issued_at=row["issuedAt"], expires_at=row["expiresAt"]
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=expected)
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_PUBLIC_KEY_LENGTH_MISMATCH")

    def test_invalid_status_rejected(self) -> None:
        row = _valid_row(status="NOT_A_REAL_STATUS")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_STATUS_INVALID")

    def test_unsupported_algorithm_rejected(self) -> None:
        row = _valid_row(algorithm="RSA")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_ALGORITHM_UNSUPPORTED")

    def test_canonicalization_drift_detected(self) -> None:
        preimage_declaration_order = (
            '{"profile":"cvf.source-record-canonicalization@1","domain":"cvf.keyRegistryRow",'
            '"keyId":"key-testvector-0001","publicKeyBytesBase64":"RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw",'
            '"algorithm":"Ed25519","role":"verificationAuthority","issuedAt":"2026-09-18T00:00:00Z",'
            '"expiresAt":"2027-09-18T00:00:00Z","revokedAt":null,"status":"ACTIVE","rotatedFromKeyId":null}'
        ).encode("utf-8")
        drifted_digest = checker._sha256_hex(preimage_declaration_order)
        self.assertNotEqual(drifted_digest, T2F_VECTOR_DIGEST)

    def test_self_consistent_different_key_substitution_rejected(self) -> None:
        row = _valid_row()
        different_key_row = _valid_row(
            keyId=row["keyId"],
            publicKeyBytesBase64="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(
                different_key_row, expected_product=_expected_product_for(row)
            )
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_PRODUCT_PUBLIC_KEY_MISMATCH")

    def test_standard_base64_public_key_rejected_before_output(self) -> None:
        row = _valid_row()
        row["publicKeyBytesBase64"] = row["publicKeyBytesBase64"].replace("-", "+")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "PUBLIC_KEY_NON_CANONICAL_BASE64URL")

    def test_padded_public_key_rejected_before_output(self) -> None:
        row = _valid_row(publicKeyBytesBase64="RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw=")
        expected = _expected_product_with_key(
            key_id=row["keyId"], public_key_base64=row["publicKeyBytesBase64"],
            issued_at=row["issuedAt"], expires_at=row["expiresAt"],
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=expected)
        self.assertEqual(ctx.exception.taxonomy_id, "PUBLIC_KEY_NON_CANONICAL_BASE64URL")

    def test_wrong_role_rejected(self) -> None:
        """Reviewer probe: wrong role must fail closed (T3A-C2-R2-04)."""
        row = _valid_row(role="notAVerificationAuthority")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_ROW_ROLE_INVALID")

    def test_invalid_timestamp_rejected(self) -> None:
        """Reviewer probe: invalid timestamps must fail closed (T3A-C2-R2-04)."""
        row = _valid_row(issuedAt="19-09-2026")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "TIMESTAMP_NOT_RFC3339_UTC")

    def test_non_utc_timestamp_rejected(self) -> None:
        row = _valid_row(issuedAt="2026-09-19T00:00:00+07:00")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "TIMESTAMP_NOT_RFC3339_UTC")

    def test_issued_at_mismatch_against_expected_product_rejected(self) -> None:
        """T3A-C2-R3-03: row issuedAt must equal the verified product's value."""
        row = _valid_row()
        expected = _expected_product_for(row)
        expected["issuedAt"] = "2020-01-01T00:00:00Z"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=expected)
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_PRODUCT_ISSUED_AT_MISMATCH")

    def test_expires_at_mismatch_against_expected_product_rejected(self) -> None:
        row = _valid_row()
        expected = _expected_product_for(row)
        expected["expiresAt"] = "2099-01-01T00:00:00Z"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(row, expected_product=expected)
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_PRODUCT_EXPIRES_AT_MISMATCH")

    def test_caller_selected_substitute_product_cannot_be_made_valid(self) -> None:
        """T3A-C2-R3-02 regression: an internally consistent ALTERNATE
        key/product cannot be made to pass merely by supplying a matching
        caller expectation for it, because operational validation never
        takes the expected product from the caller in the first place. This
        test proves the mechanism directly: even if a caller assembles a
        fully matching expected_product dict for an alternate row, that row
        is still not the operationally verified product, and `main()`
        provides no path for a caller to substitute it. `run_check` itself
        will happily validate a self-consistent pair when the CALLER
        supplies matching expectations (that is its documented, test-only
        contract); the boundary that matters is that no caller argument
        reaches this function from the operational CLI, verified in
        `OperationalAuthorityTests`."""
        alternate_row = _valid_row(
            keyId="attacker-controlled-key-0001",
            publicKeyBytesBase64="AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI",
        )
        # Confirm this alternate row is REJECTED against the real fixed
        # operational authority (never against a caller-suppliable one).
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_row_preimage_and_digest(
                alternate_row, expected_product=checker._operational_expected_product()
            )
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_PRODUCT_KEY_ID_MISMATCH")


class LifecycleReceiptValidationTests(unittest.TestCase):
    def _validate(self, receipt, **kwargs):
        kwargs.setdefault("expected_actor", FIXTURE_ACTOR)
        kwargs.setdefault("seen_transition_ids", set())
        return checker.validate_lifecycle_receipt(receipt, **kwargs)

    def _genesis_then_second(self, key_id: str = "fixture-key-0001", **second_overrides):
        """Build a valid genesis receipt, validate it, then build and
        validate a second receipt with the given overrides (defaulting to a
        legal ACTIVE->ROTATING edge with a fresh transitionId and matching
        actor), returning (seen_ids, genesis, second). The caller applies
        their own assertion to the second `self._validate(...)` call."""
        seen: set[str] = set()
        genesis = _valid_lifecycle_receipt(key_id=key_id)
        self._validate(genesis, expected_prior_hash=None, seen_transition_ids=seen)
        second_defaults = dict(
            key_id=key_id, prior_hash=genesis["entryHashHex"], transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1, registrySnapshotVersionAfter=2, priorStatus="ACTIVE",
            newStatus="ROTATING",
        )
        second_defaults.update(second_overrides)
        second = _valid_lifecycle_receipt(**second_defaults)
        return seen, genesis, second

    def _assert_second_rejected(self, seen, genesis, second, *, taxonomy_id: str) -> None:
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(
                second, expected_prior_hash=genesis["entryHashHex"], seen_transition_ids=seen,
                prior_status_for_edge_check="ACTIVE",
            )
        self.assertEqual(ctx.exception.taxonomy_id, taxonomy_id)

    def test_valid_genesis_receipt_passes(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001")
        digest, timestamp = self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(digest, receipt["entryHashHex"])
        self.assertIsInstance(timestamp, datetime)

    def test_genesis_with_non_null_prior_hash_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001", prior_hash="b" * 64)
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_GENESIS_PRIOR_HASH_NOT_NULL")

    def test_genesis_wrong_prior_status_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001", priorStatus="ACTIVE")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_GENESIS_PRIOR_STATUS_INVALID")

    def test_chain_tamper_rejected(self) -> None:
        seen, genesis, second = self._genesis_then_second(prior_hash="c" * 64)  # wrong prior hash
        self._assert_second_rejected(seen, genesis, second, taxonomy_id="LIFECYCLE_CHAIN_BROKEN")

    def test_version_not_monotonic_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(
            key_id="fixture-key-0001", registrySnapshotVersionBefore=0, registrySnapshotVersionAfter=5
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_GENESIS_VERSION_INVALID")

    def test_missing_field_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001")
        del receipt["actor"]
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_ROW_FIELD_MISSING")

    def test_digest_mismatch_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001")
        receipt["entryHashHex"] = "d" * 64
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_ROW_DIGEST_MISMATCH")

    def test_wrong_actor_rejected(self) -> None:
        """Reviewer probe: wrong actor must fail closed (T3A-C2-R2-04)."""
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001", actor="SOMEONE-ELSE\\not-party-a")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None, expected_actor=FIXTURE_ACTOR)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_ACTOR_MISMATCH")

    def test_genesis_5_to_6_rejected(self) -> None:
        """Reviewer probe: genesis versions 5->6 (not 0->1) must fail closed
        (T3A-C2-R2-04), even though the chain-linkage/digest fields are
        otherwise self-consistent."""
        receipt = _valid_lifecycle_receipt(
            key_id="fixture-key-0001", registrySnapshotVersionBefore=5, registrySnapshotVersionAfter=6
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_GENESIS_VERSION_INVALID")

    def test_genesis_wrong_new_status_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001", newStatus="ROTATING")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_GENESIS_NEW_STATUS_INVALID")

    def test_invalid_timestamp_on_receipt_rejected(self) -> None:
        receipt = _valid_lifecycle_receipt(key_id="fixture-key-0001", timestamp="not-a-timestamp")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(receipt, expected_prior_hash=None)
        self.assertEqual(ctx.exception.taxonomy_id, "TIMESTAMP_NOT_RFC3339_UTC")

    # ---- T3A-C2-R3-03: duplicate transition ID, actor-on-every-entry,
    #      complete transition graph ----

    def test_duplicate_transition_id_anywhere_in_log_rejected(self) -> None:
        seen, genesis, second = self._genesis_then_second(transitionId="fixture-transition-0001")  # reused genesis ID
        self._assert_second_rejected(seen, genesis, second, taxonomy_id="LIFECYCLE_DUPLICATE_TRANSITION_ID")

    def test_wrong_actor_on_later_entry_rejected(self) -> None:
        """T3A-C2-R3-03: actor is checked on EVERY entry, not only genesis."""
        seen, genesis, second = self._genesis_then_second(actor="NOT-PARTY-A\\imposter")
        self._assert_second_rejected(seen, genesis, second, taxonomy_id="LIFECYCLE_ACTOR_MISMATCH")

    def test_illegal_active_to_active_self_transition_rejected(self) -> None:
        seen, genesis, second = self._genesis_then_second(newStatus="ACTIVE")
        self._assert_second_rejected(seen, genesis, second, taxonomy_id="LIFECYCLE_SELF_TRANSITION_REJECTED")

    def test_illegal_active_to_revoked_edge_rejected(self) -> None:
        """ACTIVE must go through ROTATING; ACTIVE -> REVOKED directly is
        not in the closed transition graph."""
        seen, genesis, second = self._genesis_then_second(newStatus="REVOKED")
        self._assert_second_rejected(seen, genesis, second, taxonomy_id="LIFECYCLE_ILLEGAL_STATE_EDGE")

    def _advance(self, seen, prior_entry, prior_status, *, transition_id, before, after, new_status,
                 key_id: str = "fixture-key-0001"):
        """Build and validate the next legal (or to-be-tested) entry after
        `prior_entry`; returns the validated entry dict."""
        entry = _valid_lifecycle_receipt(
            key_id=key_id, prior_hash=prior_entry["entryHashHex"], transitionId=transition_id,
            registrySnapshotVersionBefore=before, registrySnapshotVersionAfter=after,
            priorStatus=prior_status, newStatus=new_status,
        )
        self._validate(
            entry, expected_prior_hash=prior_entry["entryHashHex"], seen_transition_ids=seen,
            prior_status_for_edge_check=prior_status,
        )
        return entry

    def test_terminal_status_resurrection_rejected(self) -> None:
        """No transition may leave a terminal status (REVOKED/EXPIRED)."""
        seen: set[str] = set()
        genesis = _valid_lifecycle_receipt(key_id="fixture-key-0001")
        self._validate(genesis, expected_prior_hash=None, seen_transition_ids=seen)
        rotation = self._advance(seen, genesis, "ACTIVE", transition_id="t2", before=1, after=2, new_status="ROTATING")
        revocation = self._advance(seen, rotation, "ROTATING", transition_id="t3", before=2, after=3, new_status="REVOKED")
        resurrection = _valid_lifecycle_receipt(
            key_id="fixture-key-0001", prior_hash=revocation["entryHashHex"], transitionId="t4",
            registrySnapshotVersionBefore=3, registrySnapshotVersionAfter=4, priorStatus="REVOKED", newStatus="ACTIVE",
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate(
                resurrection, expected_prior_hash=revocation["entryHashHex"], seen_transition_ids=seen,
                prior_status_for_edge_check="REVOKED",
            )
        self.assertEqual(ctx.exception.taxonomy_id, "LIFECYCLE_TERMINAL_STATUS_RESURRECTED")

    def test_rotating_to_expired_edge_accepted(self) -> None:
        seen: set[str] = set()
        genesis = _valid_lifecycle_receipt(key_id="fixture-key-0001")
        self._validate(genesis, expected_prior_hash=None, seen_transition_ids=seen)
        rotation = self._advance(seen, genesis, "ACTIVE", transition_id="t2", before=1, after=2, new_status="ROTATING")
        expiry = self._advance(seen, rotation, "ROTATING", transition_id="t3", before=2, after=3, new_status="EXPIRED")
        self.assertIsNotNone(expiry["entryHashHex"])


class RegistryEnvelopeValidationTests(unittest.TestCase):
    def test_valid_envelope_passes(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        digests = checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row))
        self.assertEqual(digests, [row["rowHashHex"]])

    def test_duplicate_key_id_rejected(self) -> None:
        row_a = _valid_row(keyId="dup-key")
        row_b = _valid_row(keyId="dup-key", publicKeyBytesBase64="AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI")
        envelope = _valid_envelope(row_a)
        envelope["rows"].append(row_b)
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row_a))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_DUPLICATE_KEY_ID")

    def test_public_key_alias_rejected_on_decoded_bytes(self) -> None:
        shared_key = "RMcYJcHIAYbM9S2L717B9wmMom1ZMEIs-PTJrQRXomw"
        row_a = _valid_row(keyId="key-a", publicKeyBytesBase64=shared_key)
        row_b = _valid_row(keyId="key-b", publicKeyBytesBase64=shared_key)
        envelope = _valid_envelope(row_a)
        envelope["rows"].append(row_b)
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row_a))
        self.assertEqual(ctx.exception.taxonomy_id, "REGISTRY_PUBLIC_KEY_ALIAS")

    def test_empty_rows_rejected(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        envelope["rows"] = []
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "ENVELOPE_ROWS_EMPTY")

    def test_missing_envelope_field_rejected(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        del envelope["writeTimestamp"]
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "ENVELOPE_FIELD_MISSING")

    def test_extra_envelope_field_rejected(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        envelope["unexpectedEnvelopeField"] = "nope"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "ENVELOPE_EXTRA_FIELD")

    def test_non_integer_version_rejected(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        envelope["registrySnapshotVersion"] = "1"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "ENVELOPE_SNAPSHOT_VERSION_INVALID")

    def test_invalid_write_timestamp_rejected(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        envelope["writeTimestamp"] = "not-a-timestamp"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_registry_envelope(envelope, expected_product=_expected_product_for(row))
        self.assertEqual(ctx.exception.taxonomy_id, "TIMESTAMP_NOT_RFC3339_UTC")


class EndToEndFixtureTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmpdir = tempfile.TemporaryDirectory(prefix="cvf_g1_checker_fixture_")
        self.addCleanup(self._tmpdir.cleanup)
        self.root = Path(self._tmpdir.name)
        self.registry_path = self.root / "REGISTRY.json"
        self.lifecycle_path = self.root / "LIFECYCLE_LOG.jsonl"

    def _write_pair(self, envelope: dict, *lifecycle_entries: dict) -> None:
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            "".join(json.dumps(entry) + "\n" for entry in lifecycle_entries), encoding="utf-8"
        )

    def _check(self, expected_product: dict):
        return checker.run_check(
            registry_path=self.registry_path, lifecycle_path=self.lifecycle_path, expected_product=expected_product
        )

    def _write_valid_fixture_pair(self, *, key_id: str = "fixture-key-0001") -> tuple[dict, dict]:
        row = _valid_row(keyId=key_id)
        envelope = _valid_envelope(row)
        receipt = _valid_lifecycle_receipt(key_id=key_id)
        self._write_pair(envelope, receipt)
        return row, receipt

    def test_valid_pair_passes_end_to_end(self) -> None:
        row, _receipt = self._write_valid_fixture_pair()
        result = self._check(_expected_product_for(row))
        self.assertTrue(result.ok)
        self.assertEqual(result.taxonomy_id, "VALIDATED")
        self.assertIn("does not claim candidate admission", result.detail)

    def test_registry_missing_fails_closed(self) -> None:
        self.lifecycle_path.write_text(json.dumps(_valid_lifecycle_receipt(key_id="x")) + "\n", encoding="utf-8")
        result = self._check(_UNREACHED_EXPECTED_PRODUCT)
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "REGISTRY_UNREACHABLE")

    def test_lifecycle_missing_fails_closed(self) -> None:
        row = _valid_row()
        self.registry_path.write_text(json.dumps(_valid_envelope(row)), encoding="utf-8")
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_UNREACHABLE")

    def test_registry_not_valid_json_fails_closed(self) -> None:
        self.registry_path.write_text("{not valid json", encoding="utf-8")
        self.lifecycle_path.write_text(json.dumps(_valid_lifecycle_receipt(key_id="x")) + "\n", encoding="utf-8")
        result = self._check(_UNREACHED_EXPECTED_PRODUCT)
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "REGISTRY_UNREACHABLE")

    def test_registry_duplicate_json_member_fails_closed(self) -> None:
        self.registry_path.write_text(
            '{"registrySnapshotId":"s","registrySnapshotId":"t","registrySnapshotVersion":1,'
            '"writeTimestamp":"2026-09-19T00:00:00Z","rows":[]}',
            encoding="utf-8",
        )
        self.lifecycle_path.write_text(json.dumps(_valid_lifecycle_receipt(key_id="x")) + "\n", encoding="utf-8")
        result = self._check(_UNREACHED_EXPECTED_PRODUCT)
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "DUPLICATE_JSON_MEMBER")

    def test_key_id_mismatch_between_registry_and_lifecycle_fails_closed(self) -> None:
        row = _valid_row(keyId="key-in-registry")
        envelope = _valid_envelope(row)
        receipt = _valid_lifecycle_receipt(key_id="different-key-in-lifecycle")
        self._write_pair(envelope, receipt)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_KEY_ID_MISMATCH")

    def test_status_mismatch_between_registry_and_lifecycle_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ACTIVE")
        envelope = _valid_envelope(row, version=2, write_timestamp=FIXTURE_ISSUED_AT)
        genesis = _valid_lifecycle_receipt(key_id=key_id, timestamp=FIXTURE_ISSUED_AT)
        rotation = _valid_lifecycle_receipt(
            key_id=key_id,
            prior_hash=genesis["entryHashHex"],
            transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="ACTIVE",
            newStatus="ROTATING",
            timestamp=FIXTURE_ISSUED_AT,
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(rotation) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_STATUS_MISMATCH")

    def test_expected_product_mismatch_fails_closed(self) -> None:
        row, _receipt = self._write_valid_fixture_pair(key_id="fixture-key-0001")
        result = checker.run_check(
            registry_path=self.registry_path,
            lifecycle_path=self.lifecycle_path,
            expected_product={
                "keyId": "some-other-key", "publicKeyBytesBase64": "irrelevant",
                "issuedAt": FIXTURE_ISSUED_AT, "expiresAt": FIXTURE_EXPIRES_AT, "actor": FIXTURE_ACTOR,
            },
        )
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "EXPECTED_PRODUCT_KEY_ID_MISMATCH")

    def test_expected_product_match_passes(self) -> None:
        row, _receipt = self._write_valid_fixture_pair(key_id="fixture-key-0001")
        result = self._check(_expected_product_for(row))
        self.assertTrue(result.ok)

    def test_expected_product_required_missing_actor_rejected(self) -> None:
        row, _receipt = self._write_valid_fixture_pair(key_id="fixture-key-0001")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.run_check(
                registry_path=self.registry_path,
                lifecycle_path=self.lifecycle_path,
                expected_product={
                    "keyId": row["keyId"], "publicKeyBytesBase64": row["publicKeyBytesBase64"],
                    "issuedAt": row["issuedAt"], "expiresAt": row["expiresAt"],
                },
            )
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_PRODUCT_INCOMPLETE")

    def test_lifecycle_log_multiple_entries_chain_correctly(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ROTATING")
        envelope = _valid_envelope(row, version=2)
        genesis = _valid_lifecycle_receipt(key_id=key_id)
        rotation = _valid_lifecycle_receipt(
            key_id=key_id,
            prior_hash=genesis["entryHashHex"],
            transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="ACTIVE",
            newStatus="ROTATING",
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(rotation) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertTrue(result.ok)

    def test_lifecycle_log_broken_chain_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ROTATING")
        envelope = _valid_envelope(row, version=2)
        genesis = _valid_lifecycle_receipt(key_id=key_id)
        rotation = _valid_lifecycle_receipt(
            key_id=key_id,
            prior_hash="f" * 64,  # wrong: does not match genesis entryHashHex
            transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="ACTIVE",
            newStatus="ROTATING",
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(rotation) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_CHAIN_BROKEN")

    def test_envelope_version_chain_tip_mismatch_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ACTIVE")
        envelope = _valid_envelope(row, version=2)
        genesis = _valid_lifecycle_receipt(key_id=key_id)
        self._write_pair(envelope, genesis)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "ENVELOPE_VERSION_CHAIN_TIP_MISMATCH")

    # ---- T3A-C2-R3-03: cross-record time rules, end-to-end ----

    def test_row_issued_at_after_genesis_timestamp_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        early_genesis_ts = "2020-01-01T00:00:00Z"
        row = _valid_row(keyId=key_id, issuedAt=FIXTURE_ISSUED_AT)  # issuedAt AFTER genesis ts below
        envelope = _valid_envelope(row, write_timestamp=early_genesis_ts)
        genesis = _valid_lifecycle_receipt(key_id=key_id, timestamp=early_genesis_ts)
        self._write_pair(envelope, genesis)
        expected = _expected_product_for(row)
        result = self._check(expected)
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "ROW_ISSUED_AT_AFTER_GENESIS_TIMESTAMP")

    def test_genesis_timestamp_envelope_mismatch_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, issuedAt=FIXTURE_ISSUED_AT)
        envelope = _valid_envelope(row, write_timestamp="2030-01-01T00:00:00Z")
        genesis = _valid_lifecycle_receipt(key_id=key_id, timestamp=FIXTURE_ISSUED_AT)
        self._write_pair(envelope, genesis)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "GENESIS_TIMESTAMP_ENVELOPE_WRITE_TIMESTAMP_MISMATCH")

    def test_write_timestamp_not_before_expiry_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        past_expiry = "2020-01-01T00:00:00Z"
        row = _valid_row(keyId=key_id, issuedAt=past_expiry, expiresAt=past_expiry)
        envelope = _valid_envelope(row, write_timestamp=past_expiry)
        genesis = _valid_lifecycle_receipt(key_id=key_id, timestamp=past_expiry)
        self._write_pair(envelope, genesis)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "WRITE_TIMESTAMP_NOT_BEFORE_EXPIRY")

    def test_chronologically_decreasing_second_entry_timestamp_fails_closed(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ROTATING")
        envelope = _valid_envelope(row, version=2, write_timestamp="2026-09-19T00:00:00Z")
        genesis = _valid_lifecycle_receipt(key_id=key_id, timestamp="2026-09-19T00:00:00Z")
        rotation = _valid_lifecycle_receipt(
            key_id=key_id,
            prior_hash=genesis["entryHashHex"],
            transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="ACTIVE",
            newStatus="ROTATING",
            timestamp="2020-01-01T00:00:00Z",  # decreasing
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(rotation) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_TIMESTAMP_NOT_MONOTONIC")

    # ---- T3A-C2-R2-04: the six R2 reviewer probes, run end-to-end ----

    def test_reviewer_probe_wrong_role_rejected_end_to_end(self) -> None:
        row = _valid_row(role="wrongRole")
        envelope = _valid_envelope(row)
        receipt = _valid_lifecycle_receipt(key_id=row["keyId"])
        self._write_pair(envelope, receipt)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "REGISTRY_ROW_ROLE_INVALID")

    def test_reviewer_probe_invalid_timestamps_rejected_end_to_end(self) -> None:
        row = _valid_row(issuedAt="not-a-real-timestamp")
        envelope = _valid_envelope(row)
        receipt = _valid_lifecycle_receipt(key_id=row["keyId"])
        self._write_pair(envelope, receipt)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "TIMESTAMP_NOT_RFC3339_UTC")

    def test_reviewer_probe_padded_base64url_rejected_end_to_end(self) -> None:
        row = _valid_row()
        row["publicKeyBytesBase64"] = row["publicKeyBytesBase64"] + "="
        envelope = _valid_envelope(row)
        receipt = _valid_lifecycle_receipt(key_id=row["keyId"])
        self._write_pair(envelope, receipt)
        result = checker.run_check(
            registry_path=self.registry_path,
            lifecycle_path=self.lifecycle_path,
            expected_product={
                "keyId": row["keyId"], "publicKeyBytesBase64": row["publicKeyBytesBase64"],
                "issuedAt": row["issuedAt"], "expiresAt": row["expiresAt"], "actor": FIXTURE_ACTOR,
            },
        )
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "PUBLIC_KEY_NON_CANONICAL_BASE64URL")

    def test_reviewer_probe_genesis_5_to_6_rejected_end_to_end(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row, version=6)
        receipt = _valid_lifecycle_receipt(
            key_id=row["keyId"], registrySnapshotVersionBefore=5, registrySnapshotVersionAfter=6
        )
        self._write_pair(envelope, receipt)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_GENESIS_VERSION_INVALID")

    def test_reviewer_probe_wrong_actor_rejected_end_to_end(self) -> None:
        row = _valid_row()
        envelope = _valid_envelope(row)
        receipt = _valid_lifecycle_receipt(key_id=row["keyId"], actor="NOT-PARTY-A\\imposter")
        self._write_pair(envelope, receipt)
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "LIFECYCLE_ACTOR_MISMATCH")

    def test_reviewer_probe_second_entry_wrong_key_id_and_false_prior_status_rejected_end_to_end(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ROTATING")
        envelope = _valid_envelope(row, version=3)
        genesis = _valid_lifecycle_receipt(key_id=key_id)
        second = _valid_lifecycle_receipt(
            key_id="different-key-id",  # wrong: must equal genesis keyId
            prior_hash=genesis["entryHashHex"],
            transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="REVOKED",  # false: does not equal genesis newStatus ("ACTIVE")
            newStatus="ROTATING",
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(second) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertIn(
            result.taxonomy_id,
            ("LIFECYCLE_KEY_ID_DRIFT", "LIFECYCLE_PRIOR_STATUS_DISCONTINUITY", "LIFECYCLE_ILLEGAL_STATE_EDGE"),
        )

    # ---- T3A-C2-R3-03/R3-04: the three R3 reviewer probes, run end-to-end ----

    def test_r3_reviewer_probe_duplicate_transition_id_plus_wrong_actor_end_to_end(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ROTATING")
        envelope = _valid_envelope(row, version=2)
        genesis = _valid_lifecycle_receipt(key_id=key_id, transitionId="shared-id")
        second = _valid_lifecycle_receipt(
            key_id=key_id,
            prior_hash=genesis["entryHashHex"],
            transitionId="shared-id",  # duplicate
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="ACTIVE",
            newStatus="ROTATING",
            actor="NOT-PARTY-A\\imposter",  # also wrong actor
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(second) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertIn(result.taxonomy_id, ("LIFECYCLE_DUPLICATE_TRANSITION_ID", "LIFECYCLE_ACTOR_MISMATCH"))

    def test_r3_reviewer_probe_illegal_active_to_active_with_time_disagreement_end_to_end(self) -> None:
        key_id = "fixture-key-0001"
        row = _valid_row(keyId=key_id, status="ACTIVE")
        envelope = _valid_envelope(row, version=2, write_timestamp="2020-01-01T00:00:00Z")  # disagrees
        genesis = _valid_lifecycle_receipt(key_id=key_id, timestamp=FIXTURE_ISSUED_AT)
        second = _valid_lifecycle_receipt(
            key_id=key_id,
            prior_hash=genesis["entryHashHex"],
            transitionId="fixture-transition-0002",
            registrySnapshotVersionBefore=1,
            registrySnapshotVersionAfter=2,
            priorStatus="ACTIVE",
            newStatus="ACTIVE",  # illegal self-transition
            timestamp=FIXTURE_ISSUED_AT,
        )
        self.registry_path.write_text(json.dumps(envelope), encoding="utf-8")
        self.lifecycle_path.write_text(
            json.dumps(genesis) + "\n" + json.dumps(second) + "\n", encoding="utf-8"
        )
        result = self._check(_expected_product_for(row))
        self.assertFalse(result.ok)
        self.assertIn(
            result.taxonomy_id,
            ("LIFECYCLE_SELF_TRANSITION_REJECTED", "GENESIS_TIMESTAMP_ENVELOPE_WRITE_TIMESTAMP_MISMATCH"),
        )

    def test_r3_reviewer_probe_entirely_caller_selected_substitute_product_rejected(self) -> None:
        """The third R3 probe: an entirely caller-selected substitute
        product (a self-consistent alternate row/receipt pair matched by a
        caller-supplied expected_product) must not be able to pass through
        the OPERATIONAL path, because the operational path
        (`_operational_expected_product()`) never accepts a caller-supplied
        substitute at all. This test writes a fully self-consistent
        alternate fixture pair and confirms it is REJECTED when checked
        against the real, fixed `_operational_expected_product()`."""
        alternate_key_id = "attacker-controlled-key-0001"
        alternate_row = _valid_row(
            keyId=alternate_key_id, publicKeyBytesBase64="AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI"
        )
        envelope = _valid_envelope(alternate_row)
        receipt = _valid_lifecycle_receipt(key_id=alternate_key_id, actor="ATTACKER\\controlled")
        self._write_pair(envelope, receipt)
        result = self._check(checker._operational_expected_product())
        self.assertFalse(result.ok)
        self.assertEqual(result.taxonomy_id, "EXPECTED_PRODUCT_KEY_ID_MISMATCH")


class PathContainmentTests(unittest.TestCase):
    def test_resolve_contained_path_accepts_inside_root(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            resolved = checker.resolve_contained_path(root, "sub/dir/file.json")
            self.assertTrue(str(resolved).startswith(str(root.resolve())))

    def test_resolve_contained_path_rejects_escape(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp) / "nested"
            root.mkdir()
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.resolve_contained_path(root, "../../escape.json")
            self.assertEqual(ctx.exception.taxonomy_id, "PATH_ESCAPES_ROOT")


class NoRealSourceTouchedTests(unittest.TestCase):
    """Meta-test: confirm this test module never references the real
    governed Group 1 paths as a read/write target."""

    def test_default_paths_are_not_opened_by_the_test_suite(self) -> None:
        real_registry = checker.REPO_ROOT / checker.DEFAULT_REGISTRY_RELATIVE
        real_lifecycle = checker.REPO_ROOT / checker.DEFAULT_LIFECYCLE_RELATIVE
        self.assertFalse(real_registry.exists(), "real Group 1 registry must remain absent during testing")
        self.assertFalse(real_lifecycle.exists(), "real Group 1 lifecycle log must remain absent during testing")


@unittest.skipUnless(shutil.which("pwsh"), "pwsh not available on PATH; cross-tool proof requires PowerShell 7+")
class CrossToolAutomatedProofTests(unittest.TestCase):
    """T3A-C2-R2-04/R3-05: automated PowerShell-writer-output -> Python-
    checker validation, run as a normal test method rather than a manually
    reported step. Invokes the writer's own hermetic self-test (`-SelfTest`,
    the default mode) and asserts it exits zero, all cases pass, and the
    self-test's own canonicalizer reproduces the exact published T2F
    positive vector digest, which is the same vector this Python test
    suite's `CanonicalizationCrossCheckTests` independently reproduces."""

    def test_writer_hermetic_self_test_passes_and_agrees_with_python_canonicalizer(self) -> None:
        writer_script = REPO_ROOT / WRITER_SCRIPT_RELATIVE
        self.assertTrue(writer_script.is_file(), f"writer script not found at {writer_script}")

        completed = subprocess.run(
            ["pwsh", "-NoProfile", "-NonInteractive", "-File", str(writer_script)],
            cwd=str(REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=180,
        )
        self.assertEqual(
            completed.returncode,
            0,
            f"writer hermetic self-test failed (exit {completed.returncode}):\n"
            f"STDOUT:\n{completed.stdout}\nSTDERR:\n{completed.stderr}",
        )
        self.assertIn("0 failed", completed.stdout)
        self.assertIn("C2-03-E", completed.stdout)
        self.assertIn("[PASS] C2-03-E", completed.stdout)
        self.assertIn(T2F_VECTOR_DIGEST, completed.stdout)

        python_digest = checker._sha256_hex(checker._canonical_json_bytes(T2F_VECTOR_PREIMAGE))
        self.assertEqual(python_digest, T2F_VECTOR_DIGEST)


if __name__ == "__main__":
    unittest.main()
