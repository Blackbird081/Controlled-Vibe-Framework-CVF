#!/usr/bin/env python3
"""Focused disposable tests for the ACEL G1 Group 4 read-only checker."""

from __future__ import annotations

import base64
import copy
import json
import subprocess
import sys
import unittest
import uuid
from dataclasses import replace
from unittest import mock
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_acel_g1_issuer_registry as checker  # noqa: E402


CONTENT = {
    "authority": checker.CONTENT_AUTHORITY,
    "issuerIdentity": "issuer-test-001",
    "policyVersion": 1,
}


def b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def content_bytes(value: dict | None = None) -> bytes:
    return checker._canonical_json_bytes(CONTENT if value is None else value)


def make_registry(*, rows: list[dict] | None = None, version: int = 1) -> tuple[dict, bytes]:
    raw_content = content_bytes()
    digest = checker._sha256_hex(raw_content)
    row = {
        "issuerIdentity": "issuer-test-001", "entryVersion": 1,
        "issuerAttestedHash": digest,
        "canonicalContentBytesBase64": b64(raw_content),
        "canonicalContentHashHex": digest, "status": "ACTIVE",
        "registeredAt": "2026-09-22T00:00:00Z",
        "correctedAt": None, "revokedAt": None,
    }
    value = {
        "registrySnapshotId": "issuer-registry-snapshot-test-0001",
        "registrySnapshotVersion": version,
        "rows": [row] if rows is None else rows,
        "writeTimestamp": "2026-09-22T00:00:01Z",
    }
    return value, checker._canonical_json_bytes(value)


def make_response(registry: checker.RegistryResult, *, prior=None, **overrides) -> dict:
    kwargs = dict(
        lookup_id=str(uuid.uuid4()), issuer_identity="issuer-test-001",
        claimed_hash=registry.rows[0]["issuerAttestedHash"],
        consumer_identity="consumer-test-001", observed_snapshot_id="snap-issuer-001",
        queried_at="2026-09-22T00:00:02Z", registry=registry,
        result="IDENTITY_CONFIRMED", entry_version=1, error_code=None,
        prior_entry_hash=prior,
    )
    kwargs.update(overrides)
    return checker.build_response(**kwargs)


def make_observation(
    registry: checker.RegistryResult,
    *,
    snapshot_id: str = "snap-issuer-001",
    observed_at: str = "2026-09-22T00:00:01Z",
    authority: str = checker.CONTENT_AUTHORITY,
    **overrides,
) -> tuple[dict, bytes]:
    record = {
        "snapshotId": snapshot_id,
        "registryName": "issuer_registry",
        "registrySnapshotVersion": registry.snapshot_version,
        "snapshot_content": b64(registry.canonical_bytes),
        "snapshotHashHex": registry.snapshot_hash_hex,
        "observedAt": observed_at,
        "authority": authority,
        "observerIdentity": checker.PARTY_B_SID,
        "priorEntryHashHex": None,
    }
    record.update(overrides)
    preimage = {
        "profile": checker.CANON_PROFILE,
        "domain": "cvf.observationLogEntry",
        **{key: record[key] for key in (
            "snapshotId", "registryName", "registrySnapshotVersion",
            "snapshotHashHex", "observedAt", "authority",
            "observerIdentity", "priorEntryHashHex",
        )},
    }
    record["entryHashHex"] = checker._sha256_hex(checker._canonical_json_bytes(preimage))
    return record, checker._canonical_json_bytes(record) + b"\n"


def make_request(**overrides) -> dict:
    value = {
        "lookupId": "00000000-0000-4000-8000-000000000099",
        "issuerIdentity": "issuer-test-001",
        "claimedIssuerHash": checker._sha256_hex(content_bytes()),
        "consumerIdentity": "consumer-test-001",
        "observedSnapshotId": "snap-issuer-001",
    }
    value.update(overrides)
    return value


def expect_taxonomy(case: unittest.TestCase, taxonomy: str, fn, *args, **kwargs):
    with case.assertRaises(checker.CheckerViolation) as ctx:
        fn(*args, **kwargs)
    case.assertEqual(ctx.exception.taxonomy_id, taxonomy)


class PublishedVectorTests(unittest.TestCase):
    def test_exact_content_vector(self):
        raw = content_bytes()
        self.assertEqual(raw, b'{"authority":"ACEL_G1_DECISION_OWNER","issuerIdentity":"issuer-test-001","policyVersion":1}')
        self.assertEqual(checker._sha256_hex(raw), "db76dcc22fcec9cc566c5b449b0aaa8eabdb657d157c62cba626aba8b26d12ca")

    def test_exact_registry_vector(self):
        raw = checker._positive_registry()
        self.assertEqual(len(raw), 618)
        self.assertEqual(checker._sha256_hex(raw), "d31e0c206da091bc408005d490e69f7aa0eae733dac4b03c67edd280034827f2")
        self.assertEqual(checker.validate_registry_bytes(raw).snapshot_version, 1)


class RegistryCanonicalizationTests(unittest.TestCase):
    def setUp(self):
        self.value, self.raw = make_registry()

    def test_positive(self):
        result = checker.validate_registry_bytes(self.raw)
        self.assertEqual(result.snapshot_hash_hex, checker._sha256_hex(self.raw))
        self.assertEqual(len(result.rows), 1)

    def test_bom_rejected(self):
        expect_taxonomy(self, "REGISTRY_BOM_FORBIDDEN", checker.validate_registry_bytes, b"\xef\xbb\xbf" + self.raw)

    def test_terminal_newline_rejected(self):
        expect_taxonomy(self, "REGISTRY_NON_CANONICAL_JCS", checker.validate_registry_bytes, self.raw + b"\n")

    def test_pretty_print_rejected(self):
        raw = json.dumps(self.value, indent=2).encode()
        expect_taxonomy(self, "REGISTRY_NON_CANONICAL_JCS", checker.validate_registry_bytes, raw)

    def test_extra_envelope_field_rejected(self):
        self.value["extra"] = True
        expect_taxonomy(self, "REGISTRY_EXTRA_FIELD", checker.validate_registry_bytes, checker._canonical_json_bytes(self.value))

    def test_missing_envelope_field_rejected(self):
        del self.value["writeTimestamp"]
        expect_taxonomy(self, "REGISTRY_FIELD_MISSING", checker.validate_registry_bytes, checker._canonical_json_bytes(self.value))

    def test_empty_rows_rejected(self):
        self.value["rows"] = []
        expect_taxonomy(self, "REGISTRY_ROWS_INVALID", checker.validate_registry_bytes, checker._canonical_json_bytes(self.value))


class ContentProfileTests(unittest.TestCase):
    def _mutate(self, fn):
        value, _ = make_registry()
        content = copy.deepcopy(CONTENT)
        fn(content)
        raw = checker._canonical_json_bytes(content)
        value["rows"][0]["canonicalContentBytesBase64"] = b64(raw)
        value["rows"][0]["canonicalContentHashHex"] = checker._sha256_hex(raw)
        value["rows"][0]["issuerAttestedHash"] = checker._sha256_hex(raw)
        return checker._canonical_json_bytes(value)

    def test_extra_content_key_rejected(self):
        raw = self._mutate(lambda c: c.update(extra=True))
        expect_taxonomy(self, "CONTENT_EXTRA_FIELD", checker.validate_registry_bytes, raw)

    def test_missing_content_key_rejected(self):
        raw = self._mutate(lambda c: c.pop("policyVersion"))
        expect_taxonomy(self, "CONTENT_FIELD_MISSING", checker.validate_registry_bytes, raw)

    def test_authority_rejected(self):
        raw = self._mutate(lambda c: c.update(authority="OTHER"))
        expect_taxonomy(self, "CONTENT_AUTHORITY_INVALID", checker.validate_registry_bytes, raw)

    def test_issuer_alias_rejected(self):
        raw = self._mutate(lambda c: c.update(issuerIdentity="issuer-test-002"))
        expect_taxonomy(self, "CONTENT_ISSUER_MISMATCH", checker.validate_registry_bytes, raw)

    def test_policy_bool_rejected(self):
        raw = self._mutate(lambda c: c.update(policyVersion=True))
        expect_taxonomy(self, "CONTENT_POLICY_VERSION_INVALID", checker.validate_registry_bytes, raw)

    def test_policy_range_rejected(self):
        raw = self._mutate(lambda c: c.update(policyVersion=2147483648))
        expect_taxonomy(self, "CONTENT_POLICY_VERSION_INVALID", checker.validate_registry_bytes, raw)

    def test_padding_rejected(self):
        value, _ = make_registry()
        value["rows"][0]["canonicalContentBytesBase64"] += "="
        expect_taxonomy(self, "CONTENT_NON_CANONICAL_BASE64URL", checker.validate_registry_bytes, checker._canonical_json_bytes(value))

    def test_non_jcs_content_rejected(self):
        value, _ = make_registry()
        raw = b'{"policyVersion":1,"authority":"ACEL_G1_DECISION_OWNER","issuerIdentity":"issuer-test-001"}'
        digest = checker._sha256_hex(raw)
        value["rows"][0].update(canonicalContentBytesBase64=b64(raw), canonicalContentHashHex=digest, issuerAttestedHash=digest)
        expect_taxonomy(self, "CONTENT_NON_CANONICAL_JCS", checker.validate_registry_bytes, checker._canonical_json_bytes(value))

    def test_hash_mismatch_rejected(self):
        value, _ = make_registry()
        value["rows"][0]["canonicalContentHashHex"] = "0" * 64
        expect_taxonomy(self, "ROW_CONTENT_HASH_MISMATCH", checker.validate_registry_bytes, checker._canonical_json_bytes(value))

    def test_attested_mismatch_rejected(self):
        value, _ = make_registry()
        value["rows"][0]["issuerAttestedHash"] = "0" * 64
        expect_taxonomy(self, "ROW_ATTESTED_HASH_MISMATCH", checker.validate_registry_bytes, checker._canonical_json_bytes(value))


class RegistryLifecycleTests(unittest.TestCase):
    def setUp(self):
        value, _ = make_registry()
        self.row = value["rows"][0]

    def test_duplicate_active_rejected(self):
        second = copy.deepcopy(self.row)
        second["entryVersion"] = 2
        _v, raw = make_registry(rows=[self.row, second])
        expect_taxonomy(self, "AMBIGUOUS_ACTIVE_VERSION", checker.validate_registry_bytes, raw)

    def test_duplicate_version_rejected(self):
        second = copy.deepcopy(self.row)
        second["status"] = "corrected"
        second["correctedAt"] = "2026-09-22T00:01:00Z"
        _v, raw = make_registry(rows=[self.row, second])
        expect_taxonomy(self, "ROW_VERSION_SEQUENCE_INVALID", checker.validate_registry_bytes, raw)

    def test_version_gap_rejected(self):
        second = copy.deepcopy(self.row)
        second.update(entryVersion=3, status="corrected", correctedAt="2026-09-22T00:01:00Z")
        _v, raw = make_registry(rows=[self.row, second])
        expect_taxonomy(self, "ROW_VERSION_GAP", checker.validate_registry_bytes, raw)

    def test_revocation_terminal_rejected(self):
        first = copy.deepcopy(self.row)
        first.update(status="REVOKED", revokedAt="2026-09-22T00:01:00Z")
        second = copy.deepcopy(self.row)
        second["entryVersion"] = 2
        _v, raw = make_registry(rows=[first, second])
        expect_taxonomy(self, "ROW_TERMINAL_REVOCATION_VIOLATION", checker.validate_registry_bytes, raw)

    def test_active_timestamp_fields_rejected(self):
        self.row["correctedAt"] = "2026-09-22T00:01:00Z"
        _v, raw = make_registry(rows=[self.row])
        expect_taxonomy(self, "ROW_LIFECYCLE_INVALID", checker.validate_registry_bytes, raw)

    def test_fractional_timestamp_order_uses_instants_not_text(self):
        self.row.update(
            status="corrected",
            registeredAt="2026-09-22T00:00:00.9Z",
            correctedAt="2026-09-22T00:00:00.10Z",
        )
        _v, raw = make_registry(rows=[self.row])
        expect_taxonomy(self, "ROW_LIFECYCLE_INVALID", checker.validate_registry_bytes, raw)


class ResponseLogTests(unittest.TestCase):
    def setUp(self):
        _v, raw = make_registry()
        self.registry = checker.validate_registry_bytes(raw)
        self.observation, self.observation_bytes = make_observation(self.registry)
        self.observations = checker.parse_observation_log(self.observation_bytes)
        self.r1 = make_response(self.registry, lookup_id="00000000-0000-4000-8000-000000000001")

    def line(self, row=None):
        return checker._canonical_json_bytes(self.r1 if row is None else row) + b"\n"

    def test_empty_log_valid(self):
        self.assertEqual(checker.validate_response_bytes(
            b"", registry=self.registry, observation_records=self.observations
        ).count, 0)

    def test_one_and_multi_row_valid(self):
        r2 = make_response(self.registry, prior=self.r1["entryHashHex"], lookup_id="00000000-0000-4000-8000-000000000002")
        raw = self.line() + self.line(r2)
        result = checker.validate_response_bytes(
            raw, registry=self.registry, observation_records=self.observations
        )
        self.assertEqual(result.count, 2)
        self.assertEqual(result.last_entry_hash_hex, r2["entryHashHex"])

    def test_prefix_preserved(self):
        r2 = make_response(self.registry, prior=self.r1["entryHashHex"], lookup_id="00000000-0000-4000-8000-000000000002")
        one = self.line()
        two = one + self.line(r2)
        self.assertTrue(two.startswith(one))
        checker.validate_response_bytes(
            two, registry=self.registry, observation_records=self.observations
        )

    def test_registry_bound_validation_requires_observations(self):
        expect_taxonomy(
            self, "INCOMPLETE_REQUEST", checker.validate_response_bytes,
            self.line(), registry=self.registry,
        )

    def test_hash_consistent_forged_terminal_outcome_rejected(self):
        forged = copy.deepcopy(self.r1)
        forged["result"] = "IDENTITY_UNRESOLVED"
        forged["errorCode"] = "AUTHORITY_UNRESOLVED"
        forged["entryHashHex"] = checker.response_entry_hash(forged)
        expect_taxonomy(
            self, "RESPONSE_OUTCOME_MISMATCH", checker.validate_response_bytes,
            self.line(forged), registry=self.registry,
            observation_records=self.observations,
        )

    def test_hash_consistent_confirmed_inactive_outcome_rejected(self):
        value, _raw = make_registry()
        value["rows"][0]["status"] = "registered"
        inactive = checker.validate_registry_bytes(checker._canonical_json_bytes(value))
        _observation, observation_bytes = make_observation(inactive)
        observations = checker.parse_observation_log(observation_bytes)
        forged = make_response(inactive, result="IDENTITY_CONFIRMED")
        expect_taxonomy(
            self, "RESPONSE_OUTCOME_MISMATCH", checker.validate_response_bytes,
            self.line(forged), registry=inactive,
            observation_records=observations,
        )

    def test_stored_row_replay_rejects_observation_snapshot_drift(self):
        _value, other_bytes = make_registry(version=2)
        other = checker.validate_registry_bytes(other_bytes)
        _observation, observation_bytes = make_observation(other)
        observations = checker.parse_observation_log(observation_bytes)
        expect_taxonomy(
            self, "OBSERVATION_VERSION_MISMATCH", checker.validate_response_bytes,
            self.line(), registry=self.registry,
            observation_records=observations,
        )

    def test_crlf_rejected(self):
        expect_taxonomy(self, "RESPONSE_CRLF_FORBIDDEN", checker.validate_response_bytes, self.line().replace(b"\n", b"\r\n"))

    def test_blank_line_rejected(self):
        expect_taxonomy(self, "RESPONSE_BLANK_LINE", checker.validate_response_bytes, self.line() + b"\n")

    def test_partial_line_rejected(self):
        expect_taxonomy(self, "RESPONSE_PARTIAL_LINE", checker.validate_response_bytes, self.line()[:-1])

    def test_pretty_row_rejected(self):
        raw = json.dumps(self.r1, separators=(",", ":")).encode() + b"\n"
        expect_taxonomy(self, "RESPONSE_NON_CANONICAL_JCS", checker.validate_response_bytes, raw)

    def test_chain_break_rejected(self):
        r2 = make_response(self.registry, prior=self.r1["entryHashHex"], lookup_id="00000000-0000-4000-8000-000000000002")
        r2["priorEntryHashHex"] = "0" * 64
        r2["entryHashHex"] = checker.response_entry_hash(r2)
        expect_taxonomy(self, "RESPONSE_CHAIN_BROKEN", checker.validate_response_bytes, self.line() + self.line(r2))

    def test_duplicate_identical_rejected_in_durable_log(self):
        r2 = copy.deepcopy(self.r1)
        r2["priorEntryHashHex"] = self.r1["entryHashHex"]
        r2["entryHashHex"] = checker.response_entry_hash(r2)
        expect_taxonomy(self, "RESPONSE_DUPLICATE_LOOKUP_ID", checker.validate_response_bytes, self.line() + self.line(r2))

    def test_conflicting_lookup_id_rejected(self):
        r2 = copy.deepcopy(self.r1)
        r2["consumerIdentity"] = "consumer-test-002"
        r2["priorEntryHashHex"] = self.r1["entryHashHex"]
        r2["entryHashHex"] = checker.response_entry_hash(r2)
        expect_taxonomy(self, "LOOKUP_ID_CONFLICT", checker.validate_response_bytes, self.line() + self.line(r2))

    def test_idempotent_retry_returns_stored_row_without_append(self):
        immutable = (
            self.r1["issuerIdentity"], self.r1["claimedIssuerHash"],
            self.r1["consumerIdentity"], self.r1["observedSnapshotId"],
        )
        before = self.line()
        disposition, stored = checker.resolve_lookup_id([self.r1], self.r1["lookupId"], immutable)
        self.assertEqual(disposition, "IDEMPOTENT")
        self.assertEqual(stored, self.r1)
        self.assertEqual(self.line(), before)

    def test_idempotent_tuple_drift_is_conflict(self):
        immutable = (
            self.r1["issuerIdentity"], self.r1["claimedIssuerHash"],
            "consumer-test-drift", self.r1["observedSnapshotId"],
        )
        expect_taxonomy(
            self, "LOOKUP_ID_CONFLICT", checker.resolve_lookup_id,
            [self.r1], self.r1["lookupId"], immutable,
        )

    def test_new_lookup_id_is_append_eligible(self):
        immutable = ("issuer-test-001", "0" * 64, "consumer-test-001", "snap-issuer-001")
        self.assertEqual(checker.resolve_lookup_id([], str(uuid.uuid4()), immutable), ("NEW", None))

    def test_unresolved_code_required(self):
        row = copy.deepcopy(self.r1)
        row.update(result="IDENTITY_UNRESOLVED", errorCode=None)
        row["entryHashHex"] = checker.response_entry_hash(row)
        expect_taxonomy(self, "RESPONSE_ERROR_CODE_INVALID", checker.validate_response_bytes, self.line(row))

    def test_rejected_code_null(self):
        row = copy.deepcopy(self.r1)
        row.update(result="IDENTITY_REJECTED", errorCode="AUTHORITY_UNRESOLVED")
        row["entryHashHex"] = checker.response_entry_hash(row)
        expect_taxonomy(self, "RESPONSE_ERROR_CODE_INVALID", checker.validate_response_bytes, self.line(row))

    def test_snapshot_digest_drift_rejected(self):
        row = copy.deepcopy(self.r1)
        row["registrySnapshotHashHex"] = "0" * 64
        row["entryHashHex"] = checker.response_entry_hash(row)
        expect_taxonomy(
            self, "RESPONSE_SNAPSHOT_HASH_MISMATCH", checker.validate_response_bytes,
            self.line(row), registry=self.registry,
            observation_records=self.observations,
        )


class ObservationBindingTests(unittest.TestCase):
    def setUp(self):
        _v, raw = make_registry()
        self.registry = checker.validate_registry_bytes(raw)
        self.observation, self.observation_bytes = make_observation(self.registry)

    def test_exact_binding(self):
        row = checker.bind_registry_observation(self.registry, [self.observation], "snap-issuer-001")
        self.assertEqual(row["snapshotId"], "snap-issuer-001")

    def test_missing_and_duplicate_rejected(self):
        expect_taxonomy(self, "OBSERVATION_BINDING_UNRESOLVED", checker.bind_registry_observation, self.registry, [], "snap-issuer-001")
        expect_taxonomy(self, "OBSERVATION_BINDING_UNRESOLVED", checker.bind_registry_observation, self.registry, [self.observation, self.observation], "snap-issuer-001")

    def test_party_c_self_observation_rejected(self):
        row = copy.deepcopy(self.observation)
        row["observerIdentity"] = checker.PARTY_C_SID
        expect_taxonomy(self, "OBSERVATION_AUTHORITY_INVALID", checker.bind_registry_observation, self.registry, [row], "snap-issuer-001")

    def test_parsed_only_equality_rejected(self):
        row = copy.deepcopy(self.observation)
        pretty = json.dumps(json.loads(self.registry.canonical_bytes), indent=2).encode()
        row["snapshot_content"] = b64(pretty)
        row["snapshotHashHex"] = checker._sha256_hex(pretty)
        expect_taxonomy(self, "OBSERVATION_HASH_MISMATCH", checker.bind_registry_observation, self.registry, [row], "snap-issuer-001")

    def test_full_group3_source_validates(self):
        records = checker.parse_observation_log(self.observation_bytes)
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["entryHashHex"], self.observation["entryHashHex"])

    def test_group3_missing_field_is_source_invalid(self):
        row = copy.deepcopy(self.observation)
        del row["authority"]
        raw = checker._canonical_json_bytes(row) + b"\n"
        expect_taxonomy(self, "SOURCE_SCHEMA_INVALID", checker.parse_observation_log, raw)

    def test_group3_chain_hash_corruption_is_source_invalid(self):
        row = copy.deepcopy(self.observation)
        row["entryHashHex"] = "0" * 64
        raw = checker._canonical_json_bytes(row) + b"\n"
        expect_taxonomy(self, "SOURCE_SCHEMA_INVALID", checker.parse_observation_log, raw)


class DurablePreparationTests(unittest.TestCase):
    def setUp(self):
        _value, self.registry_bytes = make_registry()
        self.registry = checker.validate_registry_bytes(self.registry_bytes)
        self.observation, self.observation_bytes = make_observation(self.registry)
        self.now = datetime(2026, 9, 22, 0, 0, 4, tzinfo=timezone.utc)

    def prepare(self, request=None, observation_bytes=None, response_bytes=b""):
        return checker.prepare_lookup_response(
            registry_bytes=self.registry_bytes,
            response_bytes=response_bytes,
            observation_bytes=self.observation_bytes if observation_bytes is None else observation_bytes,
            request=make_request() if request is None else request,
            evaluation_time=self.now,
        )

    def test_confirmed_and_internal_timestamp(self):
        kind, row = self.prepare()
        self.assertEqual(kind, "APPEND")
        self.assertEqual(row["result"], "IDENTITY_CONFIRMED")
        self.assertIsNone(row["errorCode"])
        self.assertEqual(row["queriedAt"], "2026-09-22T00:00:04Z")

    def test_request_supplied_timestamp_is_rejected(self):
        request = make_request(queriedAt="1999-01-01T00:00:00Z")
        expect_taxonomy(self, "MALFORMED_REQUEST", self.prepare, request)

    def test_schema_complete_hash_mismatch_receipts_rejected(self):
        kind, row = self.prepare(make_request(claimedIssuerHash="0" * 64))
        self.assertEqual(kind, "APPEND")
        self.assertEqual((row["result"], row["errorCode"]), ("IDENTITY_REJECTED", None))

    def test_stored_content_hash_mismatch_receipts_rejected(self):
        value, _raw = make_registry()
        value["rows"][0]["canonicalContentHashHex"] = "0" * 64
        raw = checker._canonical_json_bytes(value)
        registry = checker.validate_registry_bytes(raw, allow_integrity_mismatch_receipt=True)
        _obs, observation = make_observation(registry)
        kind, row = checker.prepare_lookup_response(
            registry_bytes=raw, response_bytes=b"", observation_bytes=observation,
            request=make_request(), evaluation_time=self.now,
        )
        self.assertEqual(kind, "APPEND")
        self.assertEqual((row["result"], row["errorCode"]), ("IDENTITY_REJECTED", None))

    def test_attested_hash_mismatch_receipts_rejected(self):
        value, _raw = make_registry()
        value["rows"][0]["issuerAttestedHash"] = "0" * 64
        raw = checker._canonical_json_bytes(value)
        registry = checker.validate_registry_bytes(raw, allow_integrity_mismatch_receipt=True)
        _obs, observation = make_observation(registry)
        kind, row = checker.prepare_lookup_response(
            registry_bytes=raw, response_bytes=b"", observation_bytes=observation,
            request=make_request(), evaluation_time=self.now,
        )
        self.assertEqual(kind, "APPEND")
        self.assertEqual((row["result"], row["errorCode"]), ("IDENTITY_REJECTED", None))

    def test_inactive_status_receipts_rejected(self):
        value, _raw = make_registry()
        value["rows"][0]["status"] = "registered"
        inactive_bytes = checker._canonical_json_bytes(value)
        registry = checker.validate_registry_bytes(inactive_bytes)
        _obs, obs_bytes = make_observation(registry)
        kind, row = checker.prepare_lookup_response(
            registry_bytes=inactive_bytes, response_bytes=b"", observation_bytes=obs_bytes,
            request=make_request(), evaluation_time=self.now,
        )
        self.assertEqual(kind, "APPEND")
        self.assertEqual((row["result"], row["errorCode"]), ("IDENTITY_REJECTED", None))

    def test_observation_uncertainty_precedes_status_predicate(self):
        value, _raw = make_registry()
        value["rows"][0]["status"] = "registered"
        inactive_bytes = checker._canonical_json_bytes(value)
        registry = checker.validate_registry_bytes(inactive_bytes)
        _obs, obs_bytes = make_observation(registry, authority="OTHER_AUTHORITY")
        kind, row = checker.prepare_lookup_response(
            registry_bytes=inactive_bytes, response_bytes=b"", observation_bytes=obs_bytes,
            request=make_request(), evaluation_time=self.now,
        )
        self.assertEqual(kind, "APPEND")
        self.assertEqual((row["result"], row["errorCode"]), ("IDENTITY_UNRESOLVED", "AUTHORITY_UNRESOLVED"))

    def test_missing_observation_receipts_binding_unresolved(self):
        other, other_bytes = make_observation(self.registry, snapshot_id="snap-other-001")
        self.assertNotEqual(other["snapshotId"], make_request()["observedSnapshotId"])
        kind, row = self.prepare(observation_bytes=other_bytes)
        self.assertEqual(kind, "APPEND")
        self.assertEqual((row["result"], row["errorCode"]), ("IDENTITY_UNRESOLVED", "OBSERVATION_BINDING_UNRESOLVED"))

    def test_stale_observation_receipts_freshness_unresolved(self):
        stale_at = (self.now - timedelta(seconds=checker.FRESHNESS_THRESHOLD_SECONDS + 1)).isoformat().replace("+00:00", "Z")
        _row, raw = make_observation(self.registry, observed_at=stale_at)
        kind, response = self.prepare(observation_bytes=raw)
        self.assertEqual((kind, response["result"], response["errorCode"]), ("APPEND", "IDENTITY_UNRESOLVED", "FRESHNESS_UNRESOLVED"))

    def test_wrong_authority_receipts_authority_unresolved(self):
        _row, raw = make_observation(self.registry, authority="OTHER_AUTHORITY")
        kind, response = self.prepare(observation_bytes=raw)
        self.assertEqual((kind, response["result"], response["errorCode"]), ("APPEND", "IDENTITY_UNRESOLVED", "AUTHORITY_UNRESOLVED"))

    def test_corrupt_observation_never_receipts(self):
        row = copy.deepcopy(self.observation)
        row["entryHashHex"] = "0" * 64
        raw = checker._canonical_json_bytes(row) + b"\n"
        expect_taxonomy(self, "SOURCE_SCHEMA_INVALID", self.prepare, observation_bytes=raw)

    def test_incomplete_request_never_receipts(self):
        request = make_request()
        del request["consumerIdentity"]
        expect_taxonomy(self, "INCOMPLETE_REQUEST", self.prepare, request)

    def test_missing_issuer_never_receipts(self):
        expect_taxonomy(self, "ISSUER_NOT_FOUND", self.prepare, make_request(issuerIdentity="issuer-missing"))

    def test_idempotent_retry_returns_exact_stored_row(self):
        _kind, row = self.prepare()
        response_bytes = checker._canonical_json_bytes(row) + b"\n"
        kind, stored = self.prepare(response_bytes=response_bytes)
        self.assertEqual(kind, "IDEMPOTENT")
        self.assertEqual(stored, row)

    def test_idempotent_retry_still_requires_valid_group3_source(self):
        _kind, row = self.prepare()
        response_bytes = checker._canonical_json_bytes(row) + b"\n"
        corrupt = self.observation_bytes.replace(b'"authority"', b'"authorityBroken"', 1)
        expect_taxonomy(
            self, "SOURCE_SCHEMA_INVALID", self.prepare,
            None, corrupt, response_bytes,
        )

    def test_idempotent_retry_rejects_hash_consistent_forged_outcome(self):
        _kind, row = self.prepare()
        row["result"] = "IDENTITY_UNRESOLVED"
        row["errorCode"] = "AUTHORITY_UNRESOLVED"
        row["entryHashHex"] = checker.response_entry_hash(row)
        expect_taxonomy(
            self, "RESPONSE_OUTCOME_MISMATCH", self.prepare,
            None, None, checker._canonical_json_bytes(row) + b"\n",
        )

    def test_observation_version_drift_is_hard_no_append(self):
        _value, other_bytes = make_registry(version=2)
        other = checker.validate_registry_bytes(other_bytes)
        _row, observation_bytes = make_observation(other)
        expect_taxonomy(
            self, "OBSERVATION_VERSION_MISMATCH", self.prepare,
            None, observation_bytes,
        )

    def test_observation_hash_drift_is_hard_no_append(self):
        value, _raw = make_registry()
        value["registrySnapshotId"] = "issuer-registry-snapshot-other-0001"
        other = checker.validate_registry_bytes(checker._canonical_json_bytes(value))
        _row, observation_bytes = make_observation(other)
        expect_taxonomy(
            self, "OBSERVATION_HASH_MISMATCH", self.prepare,
            None, observation_bytes,
        )

    def test_observation_byte_drift_is_hard_in_shared_classifier(self):
        value, _raw = make_registry()
        value["registrySnapshotId"] = "issuer-registry-snapshot-other-0001"
        other = checker.validate_registry_bytes(checker._canonical_json_bytes(value))
        _row, observation_bytes = make_observation(other)
        observations = checker.parse_observation_log(observation_bytes)
        hash_aligned = replace(self.registry, snapshot_hash_hex=other.snapshot_hash_hex)
        expect_taxonomy(
            self, "OBSERVATION_BYTES_MISMATCH", checker.classify_lookup_outcome,
            hash_aligned, observations,
            issuer_identity="issuer-test-001",
            claimed_hash=self.registry.rows[0]["issuerAttestedHash"],
            observed_snapshot_id="snap-issuer-001",
            evaluation_time=self.now,
        )

    def test_idempotent_tuple_conflict_never_appends(self):
        _kind, row = self.prepare()
        response_bytes = checker._canonical_json_bytes(row) + b"\n"
        expect_taxonomy(
            self, "LOOKUP_ID_CONFLICT", self.prepare,
            make_request(consumerIdentity="consumer-test-002"), None, response_bytes,
        )


class EvaluatorTests(unittest.TestCase):
    def setUp(self):
        _v, self.raw = make_registry()
        self.registry = checker.validate_registry_bytes(self.raw)

    def test_three_argument_confirmed(self):
        result = checker.evaluate_lookup("issuer-test-001", self.registry.rows[0]["issuerAttestedHash"], self.raw)
        self.assertEqual(result, ("IDENTITY_CONFIRMED", 1, None))

    def test_three_argument_rejected(self):
        result = checker.evaluate_lookup("issuer-test-001", "0" * 64, self.raw)
        self.assertEqual(result, ("IDENTITY_REJECTED", 1, None))

    def test_missing_issuer_unresolved(self):
        result = checker.evaluate_lookup("issuer-missing", "0" * 64, self.raw)
        self.assertEqual(result, ("IDENTITY_UNRESOLVED", None, "AUTHORITY_UNRESOLVED"))

    def test_inactive_status_is_rejected(self):
        value, _raw = make_registry()
        value["rows"][0]["status"] = "registered"
        raw = checker._canonical_json_bytes(value)
        result = checker.evaluate_lookup("issuer-test-001", value["rows"][0]["issuerAttestedHash"], raw)
        self.assertEqual(result, ("IDENTITY_REJECTED", 1, None))


class SecurityOracleTests(unittest.TestCase):
    def state(self, kind="responses"):
        full, read = 2032127, 1179785
        if kind == "registry":
            owner = checker.PARTY_C_SID
            rows = [
                (checker.PARTY_C_SID, full), (checker.SYSTEM_SID, full),
                (checker.ADMINISTRATORS_SID, full), (checker.PARTY_B_SID, read),
                (checker.LOCAL_SID, read),
            ]
        else:
            owner = checker.PARTY_B_SID
            rows = [
                (checker.PARTY_B_SID, full), (checker.SYSTEM_SID, full),
                (checker.ADMINISTRATORS_SID, full), (checker.LOCAL_SID, read),
            ]
        return {
            "ownerSid": owner, "protectionState": True, "inheritanceState": False,
            "aces": [
                {"sid": sid, "rights": rights, "accessType": 0, "isInherited": False,
                 "inheritanceFlags": 0, "propagationFlags": 0}
                for sid, rights in rows
            ],
        }

    def validate(self, state, kind="responses"):
        with mock.patch.object(checker, "_security_state", return_value=state):
            return checker.validate_security(Path("disposable"), kind)

    def test_exact_order_and_semantic_multiset_reported(self):
        result = self.validate(self.state())
        self.assertEqual(len(result["orderedAceTuples"]), 4)
        self.assertEqual(result["semanticAceMultiset"], sorted(result["orderedAceTuples"]))

    def test_order_mutation_rejected(self):
        state = self.state(); state["aces"][0], state["aces"][1] = state["aces"][1], state["aces"][0]
        expect_taxonomy(self, "SECURITY_ACE_ORDER_MISMATCH", self.validate, state)

    def test_extra_deny_inherited_owner_and_protection_rejected(self):
        extra = self.state(); extra["aces"].append(copy.deepcopy(extra["aces"][-1]))
        expect_taxonomy(self, "SECURITY_ACE_SET_MISMATCH", self.validate, extra)
        deny = self.state(); deny["aces"][0]["accessType"] = 1
        expect_taxonomy(self, "SECURITY_ACE_ORDER_MISMATCH", self.validate, deny)
        inherited = self.state(); inherited["aces"][0]["isInherited"] = True; inherited["inheritanceState"] = True
        expect_taxonomy(self, "SECURITY_PROTECTION_MISMATCH", self.validate, inherited)
        owner = self.state(); owner["ownerSid"] = checker.SYSTEM_SID
        expect_taxonomy(self, "SECURITY_OWNER_MISMATCH", self.validate, owner)
        protection = self.state(); protection["protectionState"] = False
        expect_taxonomy(self, "SECURITY_PROTECTION_MISMATCH", self.validate, protection)


class ReadOnlySelfTest(unittest.TestCase):
    def test_self_test_passes_and_real_sources_unchanged(self):
        root = Path(__file__).resolve().parents[2]
        paths = [
            root / "governance/sources/issuer_registry/REGISTRY.json",
            root / "governance/sources/issuer_registry/LOOKUP_RESPONSES.jsonl",
        ]
        before = [(p.exists(), p.read_bytes() if p.exists() else None) for p in paths]
        self.assertEqual(checker._run_self_test(), 0)
        after = [(p.exists(), p.read_bytes() if p.exists() else None) for p in paths]
        self.assertEqual(before, after)

    def _run_writer_self_test(self, relative_path: str, expected_minimum: int):
        root = Path(__file__).resolve().parents[2]
        governed = [
            root / "governance/sources/issuer_registry/REGISTRY.json",
            root / "governance/sources/issuer_registry/LOOKUP_RESPONSES.jsonl",
            root / "governance/sources/registry_observation_log/LOG.jsonl",
        ]
        before = [(p.exists(), p.read_bytes() if p.exists() else None) for p in governed]
        proc = subprocess.run(
            ["pwsh", "-NoProfile", "-File", str(root / relative_path), "-SelfTest"],
            cwd=root, text=True, encoding="utf-8", errors="replace",
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=60,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout)
        report = json.loads(proc.stdout.strip().splitlines()[-1])
        self.assertEqual(report["result"], "PASS")
        self.assertGreaterEqual(report["tests"], expected_minimum)
        self.assertEqual(
            report["peerProtocol"],
            ["READY", "START_ATTEMPT", "ATTEMPTING", "PARENT_RELEASE", "ENTERED", "COMPLETE"],
        )
        self.assertFalse(report["sourceMutation"])
        after = [(p.exists(), p.read_bytes() if p.exists() else None) for p in governed]
        self.assertEqual(before, after)

    def test_party_c_real_peer_and_rollback_self_test(self):
        self._run_writer_self_test("scripts/acel_g1_party_c_group4_registry_writer.ps1", 29)

    def test_party_b_real_peer_and_rollback_self_test(self):
        self._run_writer_self_test("scripts/acel_g1_party_b_group4_lookup_response_writer.ps1", 36)


if __name__ == "__main__":
    unittest.main(verbosity=2)
