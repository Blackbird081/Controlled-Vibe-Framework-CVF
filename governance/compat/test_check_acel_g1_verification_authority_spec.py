#!/usr/bin/env python3
"""Focused positive/negative tests for check_acel_g1_verification_authority_spec.

Runs entirely against disposable fixtures under a temporary directory. Never
touches the real Group 2 governed paths and never claims any Group 2 source
is created, approved, activated, consumer-wired or admitted.

Covers T3B-01 through T3B-10 from the governing work order's Evidence
Requirements: default non-mutation (via the checker's own fail-closed
behavior against absent real paths), exact decoded bytes, base64url round
trip, direct content and record hashes, separate APPROVED/ACTIVATED events,
chain recomputation, state/unique-active negatives, wrong
principal/elevation/path/collision negatives (exercised at the PowerShell
writer layer; this module cross-validates via the writer's own hermetic
self-test process where practical), DACL/ownership fixture checks (writer
layer), and real-source absence.
"""

from __future__ import annotations

import base64
import hashlib
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_acel_g1_verification_authority_spec as checker  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
SPEC_WRITER_SCRIPT_RELATIVE = "scripts/acel_g1_party_a_group2_spec_writer.ps1"
DECISION_WRITER_SCRIPT_RELATIVE = "scripts/acel_g1_approver_group2_decision_writer.ps1"

FIXTURE_PARTY_A_SID = "S-1-5-21-9999999999-9999999999-9999999999-1006"
FIXTURE_APPROVER_SID = "S-1-5-21-9999999999-9999999999-9999999999-1008"
FIXTURE_POLICY_JSON = '{"fixture":true,"value":42}'
# T3B-RV-2 (R1): deliberately DIFFERENT content from FIXTURE_POLICY_JSON, so
# a v2 fixture spec record's independently-recomputed specHashHex is
# genuinely distinct from v1's -- proving per-version hash binding tests
# exercise a real hash difference, not two versions that coincidentally
# share identical content/hash.
FIXTURE_V2_POLICY_JSON = '{"fixture":true,"value":43,"version":2}'


def _fixture_expected_authorities(**overrides) -> dict:
    base = checker._test_only_expected_authorities_override(
        party_a_sid=FIXTURE_PARTY_A_SID,
        approver_sid=FIXTURE_APPROVER_SID,
        fixed_policy_json=FIXTURE_POLICY_JSON,
    )
    base.update(overrides)
    return base


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _valid_spec_record(*, policy_json: str = FIXTURE_POLICY_JSON, **overrides) -> dict:
    """`policy_json` controls the record's actual content bytes (and
    therefore its independently-recomputed specHashHex); pass a distinct
    value to build a genuinely different-content fixture (e.g. a v2 record
    whose hash must differ from a v1 record's), rather than overriding
    `canonicalBytesBase64`/`specHashHex` directly and risking an internally
    inconsistent fixture."""
    policy_bytes = policy_json.encode("utf-8")
    canonical_bytes_base64 = _b64url(policy_bytes)
    spec_hash_hex = hashlib.sha256(policy_bytes).hexdigest()
    base = {
        "specVersion": 1,
        "canonicalBytesBase64": canonical_bytes_base64,
        "authorId": FIXTURE_PARTY_A_SID,
        "proposedAt": "2026-09-20T00:00:00Z",
        "specHashHex": spec_hash_hex,
    }
    base.update({k: v for k, v in overrides.items() if k != "specFileRecordHashHex"})
    preimage = {
        "profile": checker.CANON_PROFILE,
        "domain": checker.SPEC_FILE_DOMAIN,
        "specVersion": base["specVersion"],
        "canonicalBytesBase64": base["canonicalBytesBase64"],
        "authorId": base["authorId"],
        "proposedAt": base["proposedAt"],
        "specHashHex": base["specHashHex"],
    }
    record_hash = overrides.get(
        "specFileRecordHashHex", checker._sha256_hex(checker._canonical_json_bytes(preimage))
    )
    base["specFileRecordHashHex"] = record_hash
    return base


def _valid_decision_event(
    *, event_type: str, spec_version: int = 1, recomputed_hash_hex: str, approver_id: str = FIXTURE_APPROVER_SID,
    decided_at: str = "2026-09-20T01:00:00Z", prior_entry_hash_hex: str | None = None,
    replacement_spec_version: int | None = None, replacement_recomputed_hash_hex: str | None = None, **overrides
) -> dict:
    """T3B-R2 (atomic rotation): `replacement_spec_version`/
    `replacement_recomputed_hash_hex` default to `None` (JSON `null`), the
    required closed-schema shape for every event type except `SUPERSEDED`,
    which must pass both explicitly non-null."""
    base = {
        "decisionEventId": overrides.pop("decisionEventId", str(uuid.uuid4())),
        "eventType": event_type,
        "specVersion": spec_version,
        "recomputedHashHex": recomputed_hash_hex,
        "replacementSpecVersion": replacement_spec_version,
        "replacementRecomputedHashHex": replacement_recomputed_hash_hex,
        "approverId": approver_id,
        "decidedAt": decided_at,
        "priorEntryHashHex": prior_entry_hash_hex,
    }
    base.update({k: v for k, v in overrides.items() if k != "entryHashHex"})
    preimage = {
        "profile": checker.CANON_PROFILE,
        "domain": checker.DECISION_EVENT_DOMAIN,
        "decisionEventId": base["decisionEventId"],
        "eventType": base["eventType"],
        "specVersion": base["specVersion"],
        "recomputedHashHex": base["recomputedHashHex"],
        "replacementSpecVersion": base["replacementSpecVersion"],
        "replacementRecomputedHashHex": base["replacementRecomputedHashHex"],
        "approverId": base["approverId"],
        "decidedAt": base["decidedAt"],
        "priorEntryHashHex": base["priorEntryHashHex"],
    }
    entry_hash = overrides.get("entryHashHex", checker._sha256_hex(checker._canonical_json_bytes(preimage)))
    base["entryHashHex"] = entry_hash
    return base


def _write_jsonl(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        for entry in entries:
            handle.write(json.dumps(entry, sort_keys=True, separators=(",", ":")) + "\n")


class SpecFileHashVectorTests(unittest.TestCase):
    """T3B-02/T3B-03/T3B-04: exact decoded bytes, base64url round trip,
    direct content and record hashes, using an independently-computed test
    vector (not merely round-tripped through the checker's own helpers)."""

    def test_exact_operator_approved_v1_policy_bytes_are_pinned(self) -> None:
        # This literal must exactly match the operator decision and work
        # order's fixed v1 payload, byte-for-byte.
        expected = (
            '{"admissionRequiredLookupResult":"IDENTITY_CONFIRMED","authorityId":"ACEL_G1_DECISION_OWNER",'
            '"authoritySpecSchema":"cvf.acel.g1.verificationAuthoritySpec@1","freshnessThresholdSeconds":86400,'
            '"issuerVerificationRequirement":"VERIFIED_BY_LIVE_REGISTRY_LOOKUP","receiptDomain":"cvf.verifierReceipt",'
            '"receiptProfileVersion":"v1"}'
        )
        self.assertEqual(checker.FIXED_V1_POLICY_JSON, expected)
        policy_bytes = checker.FIXED_V1_POLICY_JSON.encode("utf-8")
        self.assertFalse(policy_bytes.startswith(b"\xef\xbb\xbf"), "must carry no UTF-8 BOM")
        self.assertNotIn(policy_bytes[-1:], (b"\n", b"\r"), "must carry no trailing newline")

    def test_base64url_round_trip_independent_vector(self) -> None:
        raw = b'{"a":1,"b":null}'
        encoded = _b64url(raw)
        self.assertNotIn("=", encoded)
        decoded = checker._decode_base64url_strict(encoded, field_name="test")
        self.assertEqual(decoded, raw)

    def test_spec_hash_hex_is_direct_content_sha256_independent_vector(self) -> None:
        raw = b'{"hello":"world"}'
        expected_digest = hashlib.sha256(raw).hexdigest()
        self.assertEqual(checker._sha256_hex(raw), expected_digest)

    def test_spec_file_record_hash_is_closed_preimage_digest_independent_vector(self) -> None:
        preimage = {
            "profile": "cvf.source-record-canonicalization@1",
            "domain": "cvf.specFile",
            "specVersion": 1,
            "canonicalBytesBase64": "eyJhIjoxfQ",
            "authorId": "S-1-5-21-0-0-0-1",
            "proposedAt": "2026-01-01T00:00:00Z",
            "specHashHex": "a" * 64,
        }
        expected_compact = (
            '{"authorId":"S-1-5-21-0-0-0-1","canonicalBytesBase64":"eyJhIjoxfQ",'
            '"domain":"cvf.specFile","profile":"cvf.source-record-canonicalization@1",'
            '"proposedAt":"2026-01-01T00:00:00Z","specHashHex":"' + ("a" * 64) + '","specVersion":1}'
        )
        self.assertEqual(checker._canonical_json_bytes(preimage), expected_compact.encode("utf-8"))
        expected_digest = hashlib.sha256(expected_compact.encode("utf-8")).hexdigest()
        self.assertEqual(checker._sha256_hex(checker._canonical_json_bytes(preimage)), expected_digest)


class SpecFilePositiveAndNegativeTests(unittest.TestCase):
    def test_valid_spec_record_validates_and_returns_two_distinct_hashes(self) -> None:
        record = _valid_spec_record()
        spec_hash, record_hash = checker.validate_spec_file_record(
            record, expected_authorities=_fixture_expected_authorities()
        )
        self.assertRegex(spec_hash, r"^[0-9a-f]{64}$")
        self.assertRegex(record_hash, r"^[0-9a-f]{64}$")
        self.assertNotEqual(spec_hash, record_hash)

    def test_content_identical_records_share_spec_hash_but_differ_in_record_hash(self) -> None:
        record_a = _valid_spec_record(authorId=FIXTURE_PARTY_A_SID, proposedAt="2026-09-20T00:00:00Z")
        record_b = _valid_spec_record(authorId=FIXTURE_PARTY_A_SID, proposedAt="2026-09-20T05:00:00Z")
        spec_hash_a, record_hash_a = checker.validate_spec_file_record(
            record_a, expected_authorities=_fixture_expected_authorities()
        )
        spec_hash_b, record_hash_b = checker.validate_spec_file_record(
            record_b, expected_authorities=_fixture_expected_authorities()
        )
        self.assertEqual(spec_hash_a, spec_hash_b)
        self.assertNotEqual(record_hash_a, record_hash_b)

    def test_missing_field_rejected(self) -> None:
        record = _valid_spec_record()
        del record["proposedAt"]
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_FIELD_MISSING")

    def test_extra_field_rejected(self) -> None:
        record = _valid_spec_record()
        record["unexpectedField"] = "nope"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_EXTRA_FIELD")

    def test_non_positive_integer_spec_version_rejected(self) -> None:
        record = _valid_spec_record()
        record["specVersion"] = 0
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_VERSION_UNEXPECTED")

    def test_record_specversion_not_matching_own_hash_rejected(self) -> None:
        """T3B-RV-2 (R1): validate_spec_file_record alone no longer hard-pins
        every record to specVersion==1 (a v2+ record is now a legitimate
        distinct governed payload); but a record whose specVersion field was
        changed without recomputing its own preimage-bound hashes still
        fails closed on its own internal digest consistency."""
        record = _valid_spec_record()
        record["specVersion"] = 2
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_RECORD_HASH_MISMATCH")

    def test_wrong_author_id_rejected(self) -> None:
        record = _valid_spec_record(authorId="S-1-5-21-0-0-0-9999-not-party-a")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_AUTHORITY_AUTHOR_ID_MISMATCH")

    def test_policy_byte_drift_rejected(self) -> None:
        drifted_bytes = b'{"fixture":true,"value":43}'
        record = _valid_spec_record(canonicalBytesBase64=_b64url(drifted_bytes))
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_POLICY_BYTES_DRIFT")

    def test_spec_hash_mismatch_rejected(self) -> None:
        record = _valid_spec_record(specHashHex="0" * 64)
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_SPEC_HASH_MISMATCH")

    def test_record_hash_mismatch_rejected(self) -> None:
        record = _valid_spec_record()
        record["specFileRecordHashHex"] = "0" * 64
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_RECORD_HASH_MISMATCH")

    def test_malformed_base64_rejected(self) -> None:
        record = _valid_spec_record(canonicalBytesBase64="not base64!!")
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "BASE64URL_NON_CANONICAL")

    def test_padded_base64_rejected(self) -> None:
        record = _valid_spec_record()
        record["canonicalBytesBase64"] = record["canonicalBytesBase64"] + "="
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "BASE64URL_NON_CANONICAL")

    def test_profile_drift_rejected(self) -> None:
        record = _valid_spec_record()
        record["profile"] = "cvf.some-other-profile@1"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_spec_file_record(record, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_FILE_PROFILE_DRIFT")


class DecisionHistoryPositiveTests(unittest.TestCase):
    """T3B-04/T3B-07: separate APPROVED/ACTIVATED events, full chain
    recomputation, and the full hermetic author->approve->activate proof."""

    def setUp(self) -> None:
        self.spec_record = _valid_spec_record()
        self.spec_hash, _ = checker.validate_spec_file_record(
            self.spec_record, expected_authorities=_fixture_expected_authorities()
        )

    def test_genesis_approved_then_activated_chain_validates(self) -> None:
        approved = _valid_decision_event(
            event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        activated = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=approved["entryHashHex"]
        )
        result = checker.validate_decision_history(
            [approved, activated],
            spec_author_id=self.spec_record["authorId"],
            spec_hash_hex=self.spec_hash,
            expected_authorities=_fixture_expected_authorities(),
        )
        self.assertTrue(result.ok)
        self.assertIn("activated=True", result.detail)
        self.assertIn("currently active=True", result.detail)

    def test_full_v1_author_approve_activate_proof_via_run_check(self) -> None:
        """T3B-07: full end-to-end positive fixture: exactly one active
        version, two separate valid decision events."""
        approved = _valid_decision_event(
            event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        activated = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=approved["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            spec_path = tmp_path / "SPEC_v1.json"
            spec_path.write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            decisions_path = tmp_path / "ACTIVATION_DECISIONS.jsonl"
            _write_jsonl(decisions_path, [approved, activated])

            result = checker.run_check(
                spec_path=spec_path, decisions_path=decisions_path, expected_authorities=_fixture_expected_authorities()
            )
        self.assertTrue(result.ok, result.detail)
        self.assertEqual(result.taxonomy_id, "VALIDATED")
        self.assertIn("does not claim spec establishment", result.detail)

    def test_zero_decisions_is_a_valid_but_inactive_history(self) -> None:
        result = checker.validate_decision_history(
            [], spec_author_id=self.spec_record["authorId"], spec_hash_hex=self.spec_hash,
            expected_authorities=_fixture_expected_authorities(),
        )
        self.assertTrue(result.ok)
        self.assertIn("activated=False", result.detail)

    def test_v1_supersede_then_v2_activate_yields_single_active_version(self) -> None:
        """T3B-R2 (atomic rotation) required regression 1: APPROVED(v1) ->
        ACTIVATED(v1) -> APPROVED(v2) -> SUPERSEDED(v1, replacement=v2)
        passes and the full-history replay ends with v2 as the SOLE active
        version (v1 no longer active). This is the exact atomic sequence the
        R1 review's admitted probe proved unreachable under the old
        two-active-state guard; it succeeds here because SUPERSEDED itself
        performs the atomic swap, never requiring the replacement to be
        pre-activated. v1 and v2 have genuinely DIFFERENT content and
        therefore different specHashHex values, each independently resolved
        from `source_directory`'s own `SPEC_v{n}.json` files."""
        approved1 = _valid_decision_event(
            event_type="APPROVED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        activated1 = _valid_decision_event(
            event_type="ACTIVATED", spec_version=1, recomputed_hash_hex=self.spec_hash,
            prior_entry_hash_hex=approved1["entryHashHex"]
        )
        v2_record = _valid_spec_record(specVersion=2, proposedAt="2026-09-20T02:00:00Z", policy_json=FIXTURE_V2_POLICY_JSON)
        v2_hash = v2_record["specHashHex"]
        approved2 = _valid_decision_event(
            event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_hash,
            prior_entry_hash_hex=activated1["entryHashHex"]
        )
        superseded1 = _valid_decision_event(
            event_type="SUPERSEDED", spec_version=1, recomputed_hash_hex=self.spec_hash,
            replacement_spec_version=2, replacement_recomputed_hash_hex=v2_hash,
            prior_entry_hash_hex=approved2["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v2.json").write_text(json.dumps(v2_record, sort_keys=True), encoding="utf-8")
            result = checker.validate_decision_history(
                [approved1, activated1, approved2, superseded1],
                source_directory=tmp_path,
                expected_authorities=_fixture_expected_authorities(),
            )
        self.assertTrue(result.ok, getattr(result, "detail", None))
        # v1's own state remains: superseded, not currently active; v2 is
        # the sole currently active version, activated purely by rotation.
        self.assertIn("v1 currently active=False", result.detail)
        self.assertIn("total active versions across history=[2]", result.detail)

    def test_v2_event_reusing_v1_hash_rejected(self) -> None:
        """T3B-RV-2 (R1): the exact defect the independent review found --
        a v2 decision event citing v1's hash instead of its own must FAIL,
        not silently pass. This is the failing-before/passing-after proof:
        against the pre-R1 checker (which compared every entry to one
        file-wide spec_hash_hex), this fixture would have wrongly PASSED."""
        approved1 = _valid_decision_event(
            event_type="APPROVED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        activated1 = _valid_decision_event(
            event_type="ACTIVATED", spec_version=1, recomputed_hash_hex=self.spec_hash,
            prior_entry_hash_hex=approved1["entryHashHex"]
        )
        v2_record = _valid_spec_record(specVersion=2, proposedAt="2026-09-20T02:00:00Z", policy_json=FIXTURE_V2_POLICY_JSON)
        # Deliberately reuse v1's hash for the v2 event instead of v2's own.
        approved2_reused_v1_hash = _valid_decision_event(
            event_type="APPROVED", spec_version=2, recomputed_hash_hex=self.spec_hash,
            prior_entry_hash_hex=activated1["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v2.json").write_text(json.dumps(v2_record, sort_keys=True), encoding="utf-8")
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history(
                    [approved1, activated1, approved2_reused_v1_hash],
                    source_directory=tmp_path,
                    expected_authorities=_fixture_expected_authorities(),
                )
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_RECOMPUTED_HASH_SPEC_MISMATCH")

    def test_v2_event_with_missing_spec_file_rejected(self) -> None:
        """T3B-RV-2 (R1): a v2 event citing a version whose SPEC_v2.json is
        absent must fail closed, never fall back to v1's hash or any other
        version's hash."""
        approved1 = _valid_decision_event(
            event_type="APPROVED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        activated1 = _valid_decision_event(
            event_type="ACTIVATED", spec_version=1, recomputed_hash_hex=self.spec_hash,
            prior_entry_hash_hex=approved1["entryHashHex"]
        )
        approved2 = _valid_decision_event(
            event_type="APPROVED", spec_version=2, recomputed_hash_hex=("b" * 64),
            prior_entry_hash_hex=activated1["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            # SPEC_v2.json intentionally NOT written.
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history(
                    [approved1, activated1, approved2],
                    source_directory=tmp_path,
                    expected_authorities=_fixture_expected_authorities(),
                )
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_VERSION_UNREACHABLE")

    def test_path_escaping_version_resolution_rejected(self) -> None:
        """T3B-RV-2 (R1): the per-version resolver must never accept a
        caller path fragment; the version input is a strict positive
        integer only, so no traversal string can be smuggled through it."""
        with self.assertRaises(checker.CheckerViolation):
            checker.resolve_spec_path_for_version(Path("/does/not/matter"), "../../etc/passwd")  # type: ignore[arg-type]


class DecisionHistoryNegativeTests(unittest.TestCase):
    """T3B-08/T3B-10: state/unique-active negatives, wrong-hash/duplicate
    negatives."""

    def setUp(self) -> None:
        self.spec_record = _valid_spec_record()
        self.spec_hash, _ = checker.validate_spec_file_record(
            self.spec_record, expected_authorities=_fixture_expected_authorities()
        )

    def _validate(self, entries: list[dict]):
        return checker.validate_decision_history(
            entries, spec_author_id=self.spec_record["authorId"], spec_hash_hex=self.spec_hash,
            expected_authorities=_fixture_expected_authorities(),
        )

    def test_two_first_decisions_rejected(self) -> None:
        first = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        second = _valid_decision_event(
            event_type="REJECTED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=first["entryHashHex"]
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([first, second])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_MULTIPLE_FIRST_DECISIONS")

    def test_activated_without_approval_rejected(self) -> None:
        activated = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([activated])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_ACTIVATED_WITHOUT_APPROVAL")

    def test_rejected_is_terminal_no_further_activation(self) -> None:
        rejected = _valid_decision_event(
            event_type="REJECTED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None
        )
        activated = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=rejected["entryHashHex"]
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([rejected, activated])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_ACTIVATED_WITHOUT_APPROVAL")

    def test_duplicate_activation_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        activated1 = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=approved["entryHashHex"]
        )
        activated2 = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=activated1["entryHashHex"]
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved, activated1, activated2])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_DUPLICATE_ACTIVATION")

    def _v2_record_and_hash(self):
        v2_record = _valid_spec_record(specVersion=2, proposedAt="2026-09-20T02:00:00Z", policy_json=FIXTURE_V2_POLICY_JSON)
        return v2_record, v2_record["specHashHex"]

    def test_superseded_without_activation_rejected(self) -> None:
        # T3B-R2: the SUPERSEDED entry must carry well-formed, independently
        # resolvable replacement fields to reach the state-machine check at
        # all (field-shape validation is a precondition checked before the
        # old version's own activation state); v2 is approved so its
        # replacement citation resolves, but v1 itself was never ACTIVATED.
        v2_record, v2_hash = self._v2_record_and_hash()
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        approved2 = _valid_decision_event(
            event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=approved["entryHashHex"]
        )
        superseded = _valid_decision_event(
            event_type="SUPERSEDED", recomputed_hash_hex=self.spec_hash,
            replacement_spec_version=2, replacement_recomputed_hash_hex=v2_hash,
            prior_entry_hash_hex=approved2["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v2.json").write_text(json.dumps(v2_record, sort_keys=True), encoding="utf-8")
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history(
                    [approved, approved2, superseded], source_directory=tmp_path,
                    expected_authorities=_fixture_expected_authorities(),
                )
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_SUPERSEDED_WITHOUT_ACTIVATION")

    def test_duplicate_supersession_rejected(self) -> None:
        # v1 rotates legitimately to v2, then v3 is independently approved
        # and a SECOND SUPERSEDED(1, replacement=3) is attempted -- v1 is
        # already superseded, isolating DECISION_DUPLICATE_SUPERSESSION.
        v2_record, v2_hash = self._v2_record_and_hash()
        v3_record = _valid_spec_record(specVersion=3, proposedAt="2026-09-20T03:00:00Z", policy_json='{"fixture":true,"value":44,"version":3}')
        v3_hash = v3_record["specHashHex"]
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        activated = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=approved["entryHashHex"]
        )
        approved2 = _valid_decision_event(
            event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=activated["entryHashHex"]
        )
        superseded1 = _valid_decision_event(
            event_type="SUPERSEDED", recomputed_hash_hex=self.spec_hash,
            replacement_spec_version=2, replacement_recomputed_hash_hex=v2_hash,
            prior_entry_hash_hex=approved2["entryHashHex"]
        )
        approved3 = _valid_decision_event(
            event_type="APPROVED", spec_version=3, recomputed_hash_hex=v3_hash, prior_entry_hash_hex=superseded1["entryHashHex"]
        )
        superseded2 = _valid_decision_event(
            event_type="SUPERSEDED", recomputed_hash_hex=self.spec_hash,
            replacement_spec_version=3, replacement_recomputed_hash_hex=v3_hash,
            prior_entry_hash_hex=approved3["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v2.json").write_text(json.dumps(v2_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v3.json").write_text(json.dumps(v3_record, sort_keys=True), encoding="utf-8")
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history(
                    [approved, activated, approved2, superseded1, approved3, superseded2], source_directory=tmp_path,
                    expected_authorities=_fixture_expected_authorities(),
                )
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_DUPLICATE_SUPERSESSION")

    def test_self_approval_rejected(self) -> None:
        # Isolate the self-approval check (approverId == spec authorId) from
        # the separate approver-identity-binding check by using a fixture
        # authority set where the verified Party A SID and the verified
        # approver SID are the SAME value. This proves
        # DECISION_SELF_APPROVAL_REJECTED fires even when the approver's
        # identity otherwise matches the expected approver authority exactly.
        same_identity_authorities = _fixture_expected_authorities(
            partyASid=FIXTURE_APPROVER_SID, approverSid=FIXTURE_APPROVER_SID
        )
        self_approved_spec = _valid_spec_record(authorId=FIXTURE_APPROVER_SID)
        self_spec_hash, _ = checker.validate_spec_file_record(
            self_approved_spec, expected_authorities=same_identity_authorities
        )
        approved = _valid_decision_event(
            event_type="APPROVED", recomputed_hash_hex=self_spec_hash, approver_id=FIXTURE_APPROVER_SID,
            prior_entry_hash_hex=None,
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_history(
                [approved], spec_author_id=self_approved_spec["authorId"], spec_hash_hex=self_spec_hash,
                expected_authorities=same_identity_authorities,
            )
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_SELF_APPROVAL_REJECTED")

    def test_wrong_approver_identity_rejected(self) -> None:
        approved = _valid_decision_event(
            event_type="APPROVED", recomputed_hash_hex=self.spec_hash,
            approver_id="S-1-5-21-0-0-0-9999-not-the-approver", prior_entry_hash_hex=None,
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved])
        self.assertEqual(ctx.exception.taxonomy_id, "EXPECTED_AUTHORITY_APPROVER_ID_MISMATCH")

    def test_duplicate_event_id_rejected(self) -> None:
        shared_id = str(uuid.uuid4())
        first = _valid_decision_event(
            event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None,
            decisionEventId=shared_id,
        )
        second_preimage_hash = first["entryHashHex"]
        second = _valid_decision_event(
            event_type="REJECTED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=second_preimage_hash,
            decisionEventId=shared_id,
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([first, second])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_DUPLICATE_EVENT_ID")

    def test_broken_chain_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        tampered_activated = _valid_decision_event(
            event_type="ACTIVATED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex="f" * 64
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved, tampered_activated])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_CHAIN_BROKEN")

    def test_tampered_entry_hash_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        approved["entryHashHex"] = "0" * 64
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_DIGEST_MISMATCH")

    def test_wrong_recomputed_hash_vs_spec_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex="d" * 64, prior_entry_hash_hex=None)
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_RECOMPUTED_HASH_SPEC_MISMATCH")

    def test_two_active_versions_rejected(self) -> None:
        approved1 = _valid_decision_event(event_type="APPROVED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        activated1 = _valid_decision_event(
            event_type="ACTIVATED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=approved1["entryHashHex"]
        )
        v2_record = _valid_spec_record(specVersion=2, proposedAt="2026-09-20T03:00:00Z", policy_json=FIXTURE_V2_POLICY_JSON)
        approved2 = _valid_decision_event(
            event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_record["specHashHex"], prior_entry_hash_hex=activated1["entryHashHex"]
        )
        activated2 = _valid_decision_event(
            event_type="ACTIVATED", spec_version=2, recomputed_hash_hex=v2_record["specHashHex"], prior_entry_hash_hex=approved2["entryHashHex"]
        )
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(self.spec_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v2.json").write_text(json.dumps(v2_record, sort_keys=True), encoding="utf-8")
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history(
                    [approved1, activated1, approved2, activated2],
                    source_directory=tmp_path,
                    expected_authorities=_fixture_expected_authorities(),
                )
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_MULTIPLE_ACTIVE_VERSIONS")

    def test_invalid_event_type_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        approved["eventType"] = "BOGUS_EVENT"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_TYPE_INVALID")

    def test_missing_field_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        del approved["decidedAt"]
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_FIELD_MISSING")

    def test_extra_field_rejected(self) -> None:
        approved = _valid_decision_event(event_type="APPROVED", recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        approved["unexpectedField"] = "nope"
        with self.assertRaises(checker.CheckerViolation) as ctx:
            self._validate([approved])
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_EXTRA_FIELD")

    def test_duplicate_json_member_in_jsonl_line_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            decisions_path = Path(tmp) / "ACTIVATION_DECISIONS.jsonl"
            decisions_path.write_text('{"a":1,"a":2}\n', encoding="utf-8")
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.load_decisions_jsonl(decisions_path)
            self.assertEqual(ctx.exception.taxonomy_id, "DECISIONS_LINE_DUPLICATE_JSON_MEMBER")


class AtomicRotationTests(unittest.TestCase):
    """T3B-R2 (atomic rotation): discriminating positive/negative cases for
    the corrected `SUPERSEDED` event schema and replay semantics, per the
    R2 work order's Required Regressions list. Runs entirely against
    disposable fixtures; never touches the real Group 2 governed paths."""

    def setUp(self) -> None:
        self.spec_record = _valid_spec_record()
        self.spec_hash, _ = checker.validate_spec_file_record(
            self.spec_record, expected_authorities=_fixture_expected_authorities()
        )

    def _write_spec_files(self, tmp_path: Path, *records: dict) -> None:
        for record in records:
            (tmp_path / f"SPEC_v{record['specVersion']}.json").write_text(
                json.dumps(record, sort_keys=True), encoding="utf-8"
            )

    def _v1_approved_activated(self):
        approved1 = _valid_decision_event(event_type="APPROVED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=None)
        activated1 = _valid_decision_event(event_type="ACTIVATED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=approved1["entryHashHex"])
        return approved1, activated1

    def _v2_record(self):
        v2_record = _valid_spec_record(specVersion=2, proposedAt="2026-09-20T02:00:00Z", policy_json=FIXTURE_V2_POLICY_JSON)
        return v2_record, v2_record["specHashHex"]

    def _approve_v2_from(self, prior_hash: str, v2_hash: str):
        return _valid_decision_event(event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=prior_hash)

    def _supersede(self, *, old_version: int, old_hash: str, replacement_version: int, replacement_hash: str, prior_hash: str):
        return _valid_decision_event(
            event_type="SUPERSEDED", spec_version=old_version, recomputed_hash_hex=old_hash,
            replacement_spec_version=replacement_version, replacement_recomputed_hash_hex=replacement_hash,
            prior_entry_hash_hex=prior_hash,
        )

    def test_required_regression_1_atomic_rotation_ends_with_replacement_sole_active(self) -> None:
        """Required regression 1 (positive): APPROVED(v1)->ACTIVATED(v1)->
        APPROVED(v2)->SUPERSEDED(v1,replacement=v2) passes and ends with v2
        as the SOLE active version (v1 no longer active) -- the exact
        sequence the R1 review's admitted probe proved unreachable."""
        v2_record, v2_hash = self._v2_record()
        approved1, activated1 = self._v1_approved_activated()
        approved2 = self._approve_v2_from(activated1["entryHashHex"], v2_hash)
        superseded1 = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=v2_hash, prior_hash=approved2["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record, v2_record)
            result = checker.validate_decision_history(
                [approved1, activated1, approved2, superseded1],
                source_directory=tmp_path, expected_authorities=_fixture_expected_authorities(),
            )
        self.assertTrue(result.ok, getattr(result, "detail", None))
        self.assertIn("total active versions across history=[2]", result.detail)
        self.assertIn("v1 currently active=False", result.detail)

    def test_required_regression_4_ordinary_activation_while_active_still_rejected(self) -> None:
        """Required regression 4: a standalone ordinary ACTIVATED(v2) event
        while v1 is still active must still fail closed."""
        v2_record, v2_hash = self._v2_record()
        approved1, activated1 = self._v1_approved_activated()
        approved2 = self._approve_v2_from(activated1["entryHashHex"], v2_hash)
        activated2 = _valid_decision_event(event_type="ACTIVATED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=approved2["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record, v2_record)
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history([approved1, activated1, approved2, activated2], source_directory=tmp_path, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_MULTIPLE_ACTIVE_VERSIONS")

    def test_replacement_can_itself_be_superseded_later(self) -> None:
        """A replacement activated by rotation can itself later be the OLD
        argument of a subsequent SUPERSEDED event, rotating again (v1->v2,
        v2->v3), ending with v3 as the sole active version."""
        v2_record, v2_hash = self._v2_record()
        v3_record = _valid_spec_record(specVersion=3, proposedAt="2026-09-20T03:00:00Z", policy_json='{"fixture":true,"value":44,"version":3}')
        v3_hash = v3_record["specHashHex"]
        approved1, activated1 = self._v1_approved_activated()
        approved2 = self._approve_v2_from(activated1["entryHashHex"], v2_hash)
        superseded1 = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=v2_hash, prior_hash=approved2["entryHashHex"])
        approved3 = _valid_decision_event(event_type="APPROVED", spec_version=3, recomputed_hash_hex=v3_hash, prior_entry_hash_hex=superseded1["entryHashHex"])
        superseded2 = self._supersede(old_version=2, old_hash=v2_hash, replacement_version=3, replacement_hash=v3_hash, prior_hash=approved3["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record, v2_record, v3_record)
            result = checker.validate_decision_history(
                [approved1, activated1, approved2, superseded1, approved3, superseded2],
                source_directory=tmp_path, expected_authorities=_fixture_expected_authorities(),
            )
        self.assertTrue(result.ok, getattr(result, "detail", None))
        self.assertIn("total active versions across history=[3]", result.detail)

    def test_duplicate_activation_of_replacement_after_rotation_rejected(self) -> None:
        """After rotation, a later duplicate ordinary ACTIVATED(replacement)
        event must still be rejected (already active by rotation)."""
        v2_record, v2_hash = self._v2_record()
        approved1, activated1 = self._v1_approved_activated()
        approved2 = self._approve_v2_from(activated1["entryHashHex"], v2_hash)
        superseded1 = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=v2_hash, prior_hash=approved2["entryHashHex"])
        duplicate_activation = _valid_decision_event(event_type="ACTIVATED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=superseded1["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record, v2_record)
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history([approved1, activated1, approved2, superseded1, duplicate_activation], source_directory=tmp_path, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_DUPLICATE_ACTIVATION")

    # ---- Required regression 2 (negative mutation classes) ----------------

    def test_missing_replacement_fields_rejected(self) -> None:
        approved1, activated1 = self._v1_approved_activated()
        superseded_missing = _valid_decision_event(event_type="SUPERSEDED", spec_version=1, recomputed_hash_hex=self.spec_hash, prior_entry_hash_hex=activated1["entryHashHex"])
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_history([approved1, activated1, superseded_missing], spec_author_id=self.spec_record["authorId"], spec_hash_hex=self.spec_hash, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_REPLACEMENT_FIELDS_REQUIRED_FOR_SUPERSEDED")

    def test_one_null_one_nonnull_replacement_fields_rejected(self) -> None:
        approved1, activated1 = self._v1_approved_activated()
        superseded_half_null = _valid_decision_event(
            event_type="SUPERSEDED", spec_version=1, recomputed_hash_hex=self.spec_hash,
            replacement_spec_version=2, replacement_recomputed_hash_hex=None, prior_entry_hash_hex=activated1["entryHashHex"],
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_history([approved1, activated1, superseded_half_null], spec_author_id=self.spec_record["authorId"], spec_hash_hex=self.spec_hash, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_REPLACEMENT_FIELD_PAIR_INVALID")

    def test_replacement_fields_on_approved_event_rejected(self) -> None:
        approved_with_replacement = _valid_decision_event(
            event_type="APPROVED", spec_version=1, recomputed_hash_hex=self.spec_hash,
            replacement_spec_version=2, replacement_recomputed_hash_hex=("b" * 64), prior_entry_hash_hex=None,
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_history([approved_with_replacement], spec_author_id=self.spec_record["authorId"], spec_hash_hex=self.spec_hash, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_REPLACEMENT_FIELDS_ONLY_FOR_SUPERSEDED")

    def test_replacement_equal_to_old_rejected(self) -> None:
        approved1, activated1 = self._v1_approved_activated()
        superseded_equal = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=1, replacement_hash=self.spec_hash, prior_hash=activated1["entryHashHex"])
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_history([approved1, activated1, superseded_equal], spec_author_id=self.spec_record["authorId"], spec_hash_hex=self.spec_hash, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_SUPERSESSION_REPLACEMENT_NOT_GREATER")

    def test_replacement_lower_than_old_rejected(self) -> None:
        v2_record, v2_hash = self._v2_record()
        approved2 = _valid_decision_event(event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=None)
        activated2 = _valid_decision_event(event_type="ACTIVATED", spec_version=2, recomputed_hash_hex=v2_hash, prior_entry_hash_hex=approved2["entryHashHex"])
        superseded_lower = self._supersede(old_version=2, old_hash=v2_hash, replacement_version=1, replacement_hash=self.spec_hash, prior_hash=activated2["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record, v2_record)
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history([approved2, activated2, superseded_lower], source_directory=tmp_path, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_SUPERSESSION_REPLACEMENT_NOT_GREATER")

    def test_replacement_never_approved_rejected(self) -> None:
        approved1, activated1 = self._v1_approved_activated()
        superseded_citing_unapproved = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=("b" * 64), prior_hash=activated1["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record)
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history([approved1, activated1, superseded_citing_unapproved], source_directory=tmp_path, expected_authorities=_fixture_expected_authorities())
        self.assertIn(ctx.exception.taxonomy_id, ("SPEC_VERSION_UNREACHABLE", "DECISION_SUPERSESSION_REPLACEMENT_NOT_APPROVED"))

    def test_replacement_already_superseded_and_already_active_guards_present_and_ordered(self) -> None:
        """Both ALREADY_SUPERSEDED and ALREADY_ACTIVE are structurally
        unreachable via legitimate sequential replay: rotation only ever
        assigns strictly increasing version numbers, so an already-
        superseded candidate is always smaller than whatever is currently
        active, and only one version can ever be active at a time (the
        unique-active invariant this whole model enforces). Both remain
        correctly-wired defense-in-depth; confirm source presence and
        ordering: has_superseded is checked BEFORE current-active
        membership, so an already-superseded version (whose has_activated
        historical flag never resets) is reported as ALREADY_SUPERSEDED,
        never masked by ALREADY_ACTIVE."""
        import inspect

        source = inspect.getsource(checker.validate_decision_history)
        self.assertIn("DECISION_SUPERSESSION_REPLACEMENT_ALREADY_SUPERSEDED", source)
        self.assertIn("replacement_state.has_superseded", source)
        self.assertIn("DECISION_SUPERSESSION_REPLACEMENT_ALREADY_ACTIVE", source)
        self.assertIn("replacement_version in active_versions", source)
        self.assertLess(
            source.index("DECISION_SUPERSESSION_REPLACEMENT_ALREADY_SUPERSEDED"),
            source.index("DECISION_SUPERSESSION_REPLACEMENT_ALREADY_ACTIVE"),
        )

    def test_replacement_spec_file_missing_rejected(self) -> None:
        approved1, activated1 = self._v1_approved_activated()
        superseded_missing_file = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=("b" * 64), prior_hash=activated1["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record)
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history([approved1, activated1, superseded_missing_file], source_directory=tmp_path, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "SPEC_VERSION_UNREACHABLE")

    def test_replacement_cited_hash_wrong_rejected(self) -> None:
        v2_record, v2_hash = self._v2_record()
        approved1, activated1 = self._v1_approved_activated()
        approved2 = self._approve_v2_from(activated1["entryHashHex"], v2_hash)
        superseded_wrong_hash = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=("f" * 64), prior_hash=approved2["entryHashHex"])
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            self._write_spec_files(tmp_path, self.spec_record, v2_record)
            with self.assertRaises(checker.CheckerViolation) as ctx:
                checker.validate_decision_history([approved1, activated1, approved2, superseded_wrong_hash], source_directory=tmp_path, expected_authorities=_fixture_expected_authorities())
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_REPLACEMENT_RECOMPUTED_HASH_MISMATCH")

    # ---- Required regression 3 (digest dependency on both fields) --------

    def test_mutating_either_replacement_field_invalidates_digest(self) -> None:
        """Prove the digest genuinely depends on BOTH replacement fields:
        tampering `replacementSpecVersion`, tampering
        `replacementRecomputedHashHex`, or removing either field entirely
        from an already-built, valid event each independently invalidate
        the preimage/digest."""
        _, v2_hash = self._v2_record()
        approved1, activated1 = self._v1_approved_activated()
        valid_superseded = self._supersede(old_version=1, old_hash=self.spec_hash, replacement_version=2, replacement_hash=v2_hash, prior_hash=activated1["entryHashHex"])

        tampered_version = dict(valid_superseded)
        tampered_version["replacementSpecVersion"] = 3
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_event_preimage_and_digest(tampered_version)
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_DIGEST_MISMATCH")

        tampered_hash = dict(valid_superseded)
        tampered_hash["replacementRecomputedHashHex"] = "9" * 64
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_event_preimage_and_digest(tampered_hash)
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_DIGEST_MISMATCH")

        stripped = dict(valid_superseded)
        del stripped["replacementRecomputedHashHex"]
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_decision_event_preimage_and_digest(stripped)
        self.assertEqual(ctx.exception.taxonomy_id, "DECISION_EVENT_FIELD_MISSING")


class PowerShellWriterHermeticSelfTestCrossCheckTests(unittest.TestCase):
    """Runs each PowerShell writer tool's own hermetic self-test as a
    subprocess and asserts it reports full pass, cross-validating that the
    writer tools' own internal guard/state-machine assertions (built
    independently in PowerShell) agree with this Python module's
    understanding of the contract, without duplicating writer-internal
    logic here. Skips gracefully if `pwsh` is unavailable in this
    environment."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.pwsh_path = shutil.which("pwsh")

    def test_spec_writer_hermetic_self_test_passes(self) -> None:
        if not self.pwsh_path:
            self.skipTest("pwsh not available in this environment")
        result = subprocess.run(
            [self.pwsh_path, "-NoProfile", "-File", SPEC_WRITER_SCRIPT_RELATIVE],
            cwd=REPO_ROOT, capture_output=True, text=True, timeout=180,
        )
        combined = result.stdout + result.stderr
        self.assertEqual(result.returncode, 0, combined[-4000:])
        self.assertIn("0 failed", combined)

    def test_decision_writer_hermetic_self_test_passes(self) -> None:
        if not self.pwsh_path:
            self.skipTest("pwsh not available in this environment")
        result = subprocess.run(
            [self.pwsh_path, "-NoProfile", "-File", DECISION_WRITER_SCRIPT_RELATIVE],
            cwd=REPO_ROOT, capture_output=True, text=True, timeout=180,
        )
        combined = result.stdout + result.stderr
        self.assertEqual(result.returncode, 0, combined[-4000:])
        self.assertIn("0 failed", combined)

    def test_cross_language_atomic_rotation_replay_converges(self) -> None:
        """Required regression 5: one identical event history fixture
        (APPROVED(v1)->ACTIVATED(v1)->APPROVED(v2)->SUPERSEDED(v1,
        replacement=v2)), replayed independently by the Python checker and
        by the PowerShell writer's own functions (subprocess, dot-sourced
        from the writer script), must converge on the SAME final state: v2
        sole active."""
        if not self.pwsh_path:
            self.skipTest("pwsh not available in this environment")

        author_sid, approver_sid = "S-1-5-21-0-0-0-9001-x", "S-1-5-21-0-0-0-9002-x"

        def _spec(version: int, policy_json: str, proposed_at: str) -> dict:
            policy_bytes = policy_json.encode("utf-8")
            b64 = _b64url(policy_bytes)
            spec_hash = hashlib.sha256(policy_bytes).hexdigest()
            preimage = {
                "profile": checker.CANON_PROFILE, "domain": checker.SPEC_FILE_DOMAIN, "specVersion": version,
                "canonicalBytesBase64": b64, "authorId": author_sid, "proposedAt": proposed_at, "specHashHex": spec_hash,
            }
            return {
                "specVersion": version, "canonicalBytesBase64": b64, "authorId": author_sid,
                "proposedAt": proposed_at, "specHashHex": spec_hash,
                "specFileRecordHashHex": checker._sha256_hex(checker._canonical_json_bytes(preimage)),
            }

        v1_record = _spec(1, FIXTURE_POLICY_JSON, "2026-09-20T00:00:00Z")
        v2_record = _spec(2, FIXTURE_V2_POLICY_JSON, "2026-09-20T01:00:00Z")
        v1_hash, v2_hash = v1_record["specHashHex"], v2_record["specHashHex"]

        approved1 = _valid_decision_event(event_type="APPROVED", spec_version=1, recomputed_hash_hex=v1_hash, approver_id=approver_sid, prior_entry_hash_hex=None)
        activated1 = _valid_decision_event(event_type="ACTIVATED", spec_version=1, recomputed_hash_hex=v1_hash, approver_id=approver_sid, prior_entry_hash_hex=approved1["entryHashHex"])
        approved2 = _valid_decision_event(event_type="APPROVED", spec_version=2, recomputed_hash_hex=v2_hash, approver_id=approver_sid, prior_entry_hash_hex=activated1["entryHashHex"])
        superseded1 = _valid_decision_event(
            event_type="SUPERSEDED", spec_version=1, recomputed_hash_hex=v1_hash, approver_id=approver_sid,
            replacement_spec_version=2, replacement_recomputed_hash_hex=v2_hash, prior_entry_hash_hex=approved2["entryHashHex"],
        )
        entries = [approved1, activated1, approved2, superseded1]

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "SPEC_v1.json").write_text(json.dumps(v1_record, sort_keys=True), encoding="utf-8")
            (tmp_path / "SPEC_v2.json").write_text(json.dumps(v2_record, sort_keys=True), encoding="utf-8")
            python_result = checker.validate_decision_history(
                entries, source_directory=tmp_path,
                expected_authorities=_fixture_expected_authorities(partyASid=author_sid, approverSid=approver_sid),
            )
        self.assertTrue(python_result.ok, getattr(python_result, "detail", None))
        self.assertIn("total active versions across history=[2]", python_result.detail)

        # PowerShell side: independent replay via the writer's OWN
        # Get-DecisionHistoryState, dot-sourced by function extraction from
        # its committed source (never invokes real-mode or self-test).
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            (tmp_path / "entries.json").write_text(json.dumps(entries), encoding="utf-8")
            (tmp_path / "hashmap.json").write_text(json.dumps({"1": v1_hash, "2": v2_hash}), encoding="utf-8")
            func_names = "'Get-Sha256Hex','ConvertTo-JsonStringLiteral','ConvertTo-CanonicalJsonBytes','Get-PreimageDigestHex','Test-RecordHasField','New-DecisionEventPreimage','Assert-ValidReplacementFieldPair','Get-DecisionHistoryState'"
            ps_lines = [
                "$ErrorActionPreference = 'Stop'; Set-StrictMode -Version 3.0",
                f"$writerSource = Get-Content -LiteralPath '{(REPO_ROOT / DECISION_WRITER_SCRIPT_RELATIVE).as_posix()}' -Raw",
                f"$script:CanonProfile = 'cvf.source-record-canonicalization@1'; $script:DecisionEventDomain = 'cvf.specDecisionEvent'",
                "class WriterGuardFailure : System.Exception { [string] $GuardId",
                "    WriterGuardFailure([string] $g, [string] $m) : base($m) { $this.GuardId = $g } }",
                "function Stop-Writer { param([string]$GuardId,[string]$Message) throw [WriterGuardFailure]::new($GuardId, \"[$GuardId] $Message\") }",
                f"foreach ($name in @({func_names})) {{",
                "    $m = [regex]::Match($writerSource, \"(?s)function $name \\{.*?\\n\\}\\n\")",
                "    if (-not $m.Success) { throw \"missing $name\" }",
                "    Invoke-Expression $m.Value }",
                f"$entries = (Get-Content -LiteralPath '{(tmp_path / 'entries.json').as_posix()}' -Raw) | ConvertFrom-Json -DateKind String",
                f"$hashRaw = (Get-Content -LiteralPath '{(tmp_path / 'hashmap.json').as_posix()}' -Raw) | ConvertFrom-Json",
                "$hashMap = @{}; foreach ($p in $hashRaw.PSObject.Properties) { $hashMap[[int]$p.Name] = $p.Value }",
                "$r = Get-DecisionHistoryState -AllEntries $entries -SpecVersion 2 -RecomputedHashByVersion $hashMap",
                "Write-Host ('ACTIVE_VERSIONS=' + (($r.ActiveVersions | Sort-Object) -join ',')); Write-Host ('ACTIVE_COUNT=' + $r.ActiveVersionCount)",
            ]
            probe_script = tmp_path / "crosslang_probe.ps1"
            probe_script.write_text("\n".join(ps_lines), encoding="utf-8")
            ps_result = subprocess.run(
                [self.pwsh_path, "-NoProfile", "-NonInteractive", "-File", str(probe_script)],
                capture_output=True, text=True, timeout=60,
            )
            combined = ps_result.stdout + ps_result.stderr
            self.assertEqual(ps_result.returncode, 0, combined)
            self.assertIn("ACTIVE_VERSIONS=2", combined)
            self.assertIn("ACTIVE_COUNT=1", combined)


if __name__ == "__main__":
    unittest.main()
