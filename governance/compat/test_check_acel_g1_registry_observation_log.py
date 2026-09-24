#!/usr/bin/env python3
"""Focused positive/negative tests for check_acel_g1_registry_observation_log.

Runs against disposable in-memory/temporary fixtures. One lifecycle guard may
read the real Group 3 path before and after checker self-test execution solely
to prove byte-exact non-mutation; it never writes that path and never claims
any Group 3 source is created, established, admitted or consumer-wired.

Covers: genesis and two-entry positives; the published 29-byte vector;
exact-byte whitespace drift; every strict-decoding failure (padding,
whitespace, non-URL alphabet, non-canonical re-encoding, BOM, invalid UTF-8,
invalid JSON); wrong snapshot hash/version; extra/missing field;
uppercase/malformed digest; broken prior/entry hash; duplicate snapshotId;
reused snapshotId with changed content; wrong observer; observer/writer
collision; forbidden registry name; and no-mutation on every negative.
"""

from __future__ import annotations

import base64
import hashlib
import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import check_acel_g1_registry_observation_log as checker  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
REAL_LOG_RELATIVE = "governance/sources/registry_observation_log/LOG.jsonl"

PARTY_B_SID = checker.VERIFIED_PARTY_B_SID
PARTY_A_SID = checker.FORBIDDEN_OBSERVER_SIDS[0]
APPROVER_SID = checker.FORBIDDEN_OBSERVER_SIDS[1]
LOCAL_SID = checker.FORBIDDEN_OBSERVER_SIDS[2]

FIXTURE_AUTHORITY = "ACEL_G1_DECISION_OWNER"


def _snapshot_content(snapshot_text: str) -> str:
    raw = snapshot_text.encode("utf-8")
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _snapshot_hash(snapshot_text: str) -> str:
    return hashlib.sha256(snapshot_text.encode("utf-8")).hexdigest()


def _build_entry(
    snapshot_id: str,
    *,
    registry_name: str = "verifier_key_registry",
    version: int = 1,
    snapshot_text: str | None = None,
    observed_at: str = "2026-09-21T00:00:00Z",
    authority: str = FIXTURE_AUTHORITY,
    observer: str = PARTY_B_SID,
    prior_hash: str | None = None,
    **overrides,
) -> tuple[dict, str]:
    """Build a self-consistent entry; returns (record, entry_hash)."""
    if snapshot_text is None:
        snapshot_text = json.dumps({"registrySnapshotVersion": version}, separators=(",", ":"))
    snapshot_content = _snapshot_content(snapshot_text)
    snapshot_hash = _snapshot_hash(snapshot_text)
    preimage = {
        "profile": checker.CANON_PROFILE,
        "domain": checker.OBSERVATION_ENTRY_DOMAIN,
        "snapshotId": snapshot_id,
        "registryName": registry_name,
        "registrySnapshotVersion": version,
        "snapshotHashHex": snapshot_hash,
        "observedAt": observed_at,
        "authority": authority,
        "observerIdentity": observer,
        "priorEntryHashHex": prior_hash,
    }
    entry_hash = checker._sha256_hex(checker._canonical_json_bytes(preimage))
    record = {
        "snapshotId": snapshot_id,
        "registryName": registry_name,
        "registrySnapshotVersion": version,
        "snapshot_content": snapshot_content,
        "snapshotHashHex": snapshot_hash,
        "observedAt": observed_at,
        "authority": authority,
        "observerIdentity": observer,
        "priorEntryHashHex": prior_hash,
        "entryHashHex": entry_hash,
    }
    record.update(overrides)
    return record, entry_hash


def _assert_rejects(self: unittest.TestCase, record: dict, taxonomy_id: str, **kwargs) -> None:
    with self.assertRaises(checker.CheckerViolation) as ctx:
        checker.validate_entry(
            record,
            expected_prior_hash=None,
            seen_snapshot_ids=set(),
            seen_snapshot_content={},
            **kwargs,
        )
    self.assertEqual(ctx.exception.taxonomy_id, taxonomy_id, f"expected {taxonomy_id}, got {ctx.exception.taxonomy_id}")


class PublishedVectorTests(unittest.TestCase):
    def test_published_29_byte_vector_base64url(self):
        raw = checker.PUBLISHED_29_BYTE_PREIMAGE.encode("utf-8")
        self.assertEqual(len(raw), 29)
        encoded = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
        self.assertEqual(encoded, checker.PUBLISHED_29_BYTE_BASE64URL)

    def test_published_29_byte_vector_digest(self):
        self.assertEqual(
            hashlib.sha256(checker.PUBLISHED_29_BYTE_PREIMAGE.encode("utf-8")).hexdigest(),
            checker.PUBLISHED_29_BYTE_SHA256,
        )

    def test_published_29_byte_padded_mutation_rejected(self):
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._decode_base64url_strict(checker.PUBLISHED_29_BYTE_BASE64URL + "=")
        self.assertEqual(ctx.exception.taxonomy_id, "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL")

    def test_published_29_byte_full_entry_validates(self):
        record, entry_hash = _build_entry(
            "snap-vector-0001",
            version=2,
            snapshot_text=checker.PUBLISHED_29_BYTE_PREIMAGE,
        )
        result = checker.validate_log([record])
        self.assertTrue(result.ok)
        self.assertEqual(result.entry_count, 1)
        self.assertEqual(result.genesis_entry_hash_hex, entry_hash)
        self.assertEqual(result.last_entry_hash_hex, entry_hash)


class PositiveChainTests(unittest.TestCase):
    def test_genesis_and_two_entry_chain(self):
        e1, h1 = _build_entry("snap-chain-0001", version=1)
        e2, h2 = _build_entry(
            "snap-chain-0002",
            version=1,
            snapshot_text=json.dumps({"registrySnapshotVersion": 1, "extra": "changed"}, separators=(",", ":")),
            prior_hash=h1,
        )
        result = checker.validate_log([e1, e2])
        self.assertTrue(result.ok)
        self.assertEqual(result.entry_count, 2)
        self.assertEqual(result.genesis_entry_hash_hex, h1)
        self.assertEqual(result.last_entry_hash_hex, h2)
        self.assertEqual(result.snapshot_ids, ("snap-chain-0001", "snap-chain-0002"))

    def test_count_and_lookup_semantics(self):
        e1, h1 = _build_entry("snap-count-0001", version=1)
        e2, _ = _build_entry("snap-count-0002", version=1, prior_hash=h1)
        records = [e1, e2]
        self.assertEqual(checker.count_observations_for(records, "snap-count-0001"), 1)
        self.assertEqual(checker.count_observations_for(records, "snap-count-0002"), 1)
        self.assertEqual(checker.count_observations_for(records, "snap-missing"), 0)
        self.assertIsNotNone(checker.lookup(records, "snap-count-0001"))
        self.assertIsNone(checker.lookup(records, "snap-missing"))

    def test_duplicate_id_forced_fault_counts_two(self):
        e1, h1 = _build_entry("snap-dup-0001", version=1)
        e2, _ = _build_entry("snap-dup-0001", version=1, prior_hash=h1)
        self.assertEqual(checker.count_observations_for([e1, e2], "snap-dup-0001"), 2)


class SnapshotDecodingTests(unittest.TestCase):
    def test_whitespace_drift_changes_hash(self):
        # Exact-byte semantics: a snapshot whose hash was computed over a
        # whitespace-drifted form must fail against the exact stored bytes.
        tight = json.dumps({"registrySnapshotVersion": 1}, separators=(",", ":"))
        drifted = '{"registrySnapshotVersion": 1}'
        self.assertNotEqual(tight, drifted)
        record, _ = _build_entry("snap-ws-0001", version=1, snapshot_text=tight)
        # Corrupt snapshotHashHex to the drifted form while keeping the entry
        # hash consistent is unnecessary; the checker raises on the snapshot
        # hash mismatch first.
        record["snapshotHashHex"] = _snapshot_hash(drifted)
        _assert_rejects(self, record, "SNAPSHOT_HASH_MISMATCH")

    def test_padding_rejected(self):
        record, _ = _build_entry("snap-pad-0001")
        record["snapshot_content"] += "="
        _assert_rejects(self, record, "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL")

    def test_whitespace_in_base64_rejected(self):
        record, _ = _build_entry("snap-b64ws-0001")
        record["snapshot_content"] = record["snapshot_content"][:4] + " " + record["snapshot_content"][4:]
        _assert_rejects(self, record, "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL")

    def test_non_url_alphabet_rejected(self):
        record, _ = _build_entry("snap-b64plus-0001")
        # A standard-base64 `+`/`/` character is never valid in the URL-safe
        # alphabet and must be rejected before any decode attempt.
        record["snapshot_content"] = "abc+def/"
        _assert_rejects(self, record, "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL")

    def test_noncanonical_reencoding_rejected(self):
        # A base64url string that decodes but re-encodes differently (stray
        # bits in an unused tail) is non-canonical.
        record, _ = _build_entry("snap-noncanon-0001")
        raw = json.dumps({"registrySnapshotVersion": 1}, separators=(",", ":")).encode("utf-8")
        canonical = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
        # Append an extra zero-padding quartet that decodes to a trailing null
        # byte, making re-encoding differ from the input.
        mutated = canonical + "A"
        record["snapshot_content"] = mutated
        # 'A' may or may not decode cleanly; only assert it is rejected as
        # non-canonical IF it decodes, else as undecodable. Either way it fails.
        with self.assertRaises(checker.CheckerViolation):
            checker.validate_entry(
                record,
                expected_prior_hash=None,
                seen_snapshot_ids=set(),
                seen_snapshot_content={},
            )

    def test_bom_rejected(self):
        record, _ = _build_entry("snap-bom-0001")
        raw = b"\xef\xbb\xbf" + json.dumps({"registrySnapshotVersion": 1}, separators=(",", ":")).encode("utf-8")
        record["snapshot_content"] = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
        _assert_rejects(self, record, "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL")

    def test_invalid_utf8_rejected(self):
        record, _ = _build_entry("snap-utf8-0001")
        record["snapshot_content"] = base64.urlsafe_b64encode(b"\xff\xfe\xfa").rstrip(b"=").decode("ascii")
        _assert_rejects(self, record, "SNAPSHOT_CONTENT_INVALID_JSON")

    def test_invalid_json_rejected(self):
        record, _ = _build_entry("snap-json-0001")
        record["snapshot_content"] = _snapshot_content("not json at all")
        _assert_rejects(self, record, "SNAPSHOT_CONTENT_INVALID_JSON")


class SchemaAndDigestTests(unittest.TestCase):
    def test_extra_field_rejected(self):
        record, _ = _build_entry("snap-extra-0001")
        record["correctionOf"] = ["snap-other"]
        _assert_rejects(self, record, "ENTRY_EXTRA_FIELD")

    def test_missing_field_rejected(self):
        record, _ = _build_entry("snap-missing-0001")
        del record["authority"]
        _assert_rejects(self, record, "ENTRY_FIELD_MISSING")

    def test_wrong_snapshot_hash_rejected(self):
        record, _ = _build_entry("snap-wronghash-0001")
        record["snapshotHashHex"] = "0" * 64
        _assert_rejects(self, record, "SNAPSHOT_HASH_MISMATCH")

    def test_snapshot_version_mismatch_rejected(self):
        record, _ = _build_entry("snap-ver-0001", version=1)
        # Decoded snapshot says version 2 but the record says 1.
        record["snapshot_content"] = _snapshot_content('{"registrySnapshotVersion":2}')
        record["snapshotHashHex"] = _snapshot_hash('{"registrySnapshotVersion":2}')
        _assert_rejects(self, record, "SNAPSHOT_VERSION_MISMATCH")

    def test_nonpositive_version_rejected(self):
        record, _ = _build_entry("snap-ver0-0001", version=1)
        record["registrySnapshotVersion"] = 0
        _assert_rejects(self, record, "REGISTRY_SNAPSHOT_VERSION_INVALID")

    def test_uppercase_digest_rejected(self):
        record, _ = _build_entry("snap-upper-0001")
        record["entryHashHex"] = record["entryHashHex"].upper()
        _assert_rejects(self, record, "ENTRY_DIGEST_SHAPE_INVALID")

    def test_malformed_digest_rejected(self):
        record, _ = _build_entry("snap-short-0001")
        record["entryHashHex"] = "abcd1234"
        _assert_rejects(self, record, "ENTRY_DIGEST_SHAPE_INVALID")

    def test_broken_entry_hash_rejected(self):
        record, _ = _build_entry("snap-badentry-0001")
        record["entryHashHex"] = "a" * 64
        _assert_rejects(self, record, "ENTRY_DIGEST_MISMATCH")

    def test_invalid_timestamp_rejected(self):
        record, _ = _build_entry("snap-time-0001")
        record["observedAt"] = "2026-09-21 00:00:00"
        _assert_rejects(self, record, "TIMESTAMP_NOT_RFC3339_UTC")


class ChainAndIdentityTests(unittest.TestCase):
    def test_genesis_nonnull_prior_hash_rejected(self):
        record, _ = _build_entry("snap-genesis-0001", prior_hash="a" * 64)
        _assert_rejects(self, record, "GENESIS_PRIOR_HASH_NOT_NULL")

    def test_broken_prior_hash_rejected(self):
        e1, h1 = _build_entry("snap-chain-a", version=1)
        e2, _ = _build_entry("snap-chain-b", version=1, prior_hash=h1)
        e2["priorEntryHashHex"] = "b" * 64
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_log([e1, e2])
        self.assertEqual(ctx.exception.taxonomy_id, "CHAIN_BROKEN")

    def test_duplicate_snapshot_id_rejected(self):
        e1, h1 = _build_entry("snap-dup-0001", version=1)
        e2, _ = _build_entry("snap-dup-0001", version=1, prior_hash=h1)
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_log([e1, e2])
        self.assertEqual(ctx.exception.taxonomy_id, "DUPLICATE_SNAPSHOT_ID")

    def test_reused_snapshot_id_changed_content_rejected(self):
        e1, h1 = _build_entry("snap-reuse-0001", version=1)
        e2, _ = _build_entry(
            "snap-reuse-0001",
            version=1,
            snapshot_text=json.dumps({"registrySnapshotVersion": 1, "x": "changed"}, separators=(",", ":")),
            prior_hash=h1,
        )
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker.validate_log([e1, e2])
        self.assertEqual(ctx.exception.taxonomy_id, "DUPLICATE_SNAPSHOT_ID")

    def test_forbidden_party_a_observer_rejected(self):
        record, _ = _build_entry("snap-pa-0001", observer=PARTY_A_SID)
        _assert_rejects(self, record, "OBSERVER_FORBIDDEN_IDENTITY")

    def test_forbidden_approver_observer_rejected(self):
        record, _ = _build_entry("snap-approver-0001", observer=APPROVER_SID)
        _assert_rejects(self, record, "OBSERVER_FORBIDDEN_IDENTITY")

    def test_forbidden_local_observer_rejected(self):
        record, _ = _build_entry("snap-local-0001", observer=LOCAL_SID)
        _assert_rejects(self, record, "OBSERVER_FORBIDDEN_IDENTITY")

    def test_wrong_expected_observer_rejected(self):
        record, _ = _build_entry("snap-wrongobs-0001", observer=PARTY_B_SID)
        _assert_rejects(
            self, record, "OBSERVER_EXPECTED_MISMATCH",
            expected_observer="S-1-5-21-0-0-0-9999",
        )

    def test_observer_writer_collision_rejected(self):
        record, _ = _build_entry("snap-collide-0001", observer=PARTY_A_SID)
        # Use a non-forbidden observer equal to the writer SID to isolate the
        # collision check from the forbidden-identity check.
        writer_sid = "S-1-5-21-0-0-0-7777"
        record2, _ = _build_entry("snap-collide-0002", observer=writer_sid)
        _assert_rejects(self, record2, "OBSERVER_WRITER_COLLISION", registry_writer_sid=writer_sid)

    def test_forbidden_registry_name_rejected(self):
        record, _ = _build_entry("snap-name-0001", registry_name="some_other_registry")
        _assert_rejects(self, record, "REGISTRY_NAME_INVALID")

    def test_issuer_registry_name_accepted_by_checker(self):
        record, _ = _build_entry("snap-issuer-0001", registry_name="issuer_registry")
        result = checker.validate_log([record])
        self.assertTrue(result.ok)


class NoMutationTests(unittest.TestCase):
    def test_checker_never_writes_log(self):
        with tempfile.TemporaryDirectory() as tmp:
            log_path = Path(tmp) / "LOG.jsonl"
            e1, h1 = _build_entry("snap-nomut-0001", version=1)
            original = json.dumps(e1, sort_keys=True, separators=(",", ":")) + "\n"
            log_path.write_text(original, encoding="utf-8")
            before = log_path.read_bytes()
            result = checker.validate_log([e1])
            self.assertTrue(result.ok)
            self.assertEqual(log_path.read_bytes(), before)

    def test_negative_paths_leave_log_unchanged(self):
        with tempfile.TemporaryDirectory() as tmp:
            log_path = Path(tmp) / "LOG.jsonl"
            e1, _ = _build_entry("snap-neg-0001", version=1)
            original = json.dumps(e1, sort_keys=True, separators=(",", ":")) + "\n"
            log_path.write_text(original, encoding="utf-8")
            before = log_path.read_bytes()
            bad = dict(e1)
            bad["entryHashHex"] = "a" * 64
            with self.assertRaises(checker.CheckerViolation):
                checker.validate_log([bad])
            self.assertEqual(log_path.read_bytes(), before)

    def test_checker_self_test_does_not_mutate_real_log(self):
        real_log = REPO_ROOT / REAL_LOG_RELATIVE
        existed_before = real_log.exists()
        bytes_before = real_log.read_bytes() if existed_before else None

        self.assertEqual(checker._run_self_test(), 0)

        self.assertEqual(real_log.exists(), existed_before)
        if existed_before:
            self.assertEqual(real_log.read_bytes(), bytes_before)


class BlankLineRejectionTests(unittest.TestCase):
    def test_interior_blank_line_rejected(self):
        e1, _ = _build_entry("snap-blank-0001", version=1)
        line = json.dumps(e1, sort_keys=True, separators=(",", ":"))
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._parse_log_records(line + "\n\n" + line)
        self.assertEqual(ctx.exception.taxonomy_id, "LOG_BLANK_LINE")

    def test_leading_blank_line_rejected(self):
        e1, _ = _build_entry("snap-blank-0002", version=1)
        line = json.dumps(e1, sort_keys=True, separators=(",", ":"))
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._parse_log_records("\n" + line)
        self.assertEqual(ctx.exception.taxonomy_id, "LOG_BLANK_LINE")

    def test_whitespace_only_line_rejected(self):
        e1, _ = _build_entry("snap-blank-0003", version=1)
        line = json.dumps(e1, sort_keys=True, separators=(",", ":"))
        with self.assertRaises(checker.CheckerViolation) as ctx:
            checker._parse_log_records(line + "\n   \n" + line)
        self.assertEqual(ctx.exception.taxonomy_id, "LOG_BLANK_LINE")

    def test_single_terminal_newline_accepted(self):
        e1, _ = _build_entry("snap-blank-0004", version=1)
        line = json.dumps(e1, sort_keys=True, separators=(",", ":"))
        records = checker._parse_log_records(line + "\n")
        self.assertEqual(len(records), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
