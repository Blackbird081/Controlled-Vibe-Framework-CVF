#!/usr/bin/env python3
"""Read-only ACEL G1 Group 4 issuer-registry and response-log checker.

This module implements only the closed ASCII/no-floating-point Group 4
canonicalization domain.  It is deliberately not a general RFC 8785 engine.
It never creates, repairs, rewrites, or chmods a governed source.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import check_acel_g1_registry_observation_log as observation_checker


CANON_PROFILE = "cvf.source-record-canonicalization@1"
CONTENT_PROFILE = "ACEL_G1_ISSUER_AUTHORITY_CONTENT_V1"
CONTENT_AUTHORITY = "ACEL_G1_DECISION_OWNER"
REGISTRY_DOMAIN = "cvf.issuerRegistryRow"
RESPONSE_DOMAIN = "cvf.issuerLookupResponse"
PARTY_C_SID = "S-1-5-21-1644666849-912006174-747199667-1010"
PARTY_B_SID = "S-1-5-21-1644666849-912006174-747199667-1009"
LOCAL_SID = "S-1-5-21-1644666849-912006174-747199667-1001"
SYSTEM_SID = "S-1-5-18"
ADMINISTRATORS_SID = "S-1-5-32-544"

HEX_RE = re.compile(r"^[0-9a-f]{64}$")
IDENTITY_RE = re.compile(r"^[A-Za-z0-9._:-]+$")
BASE64URL_RE = re.compile(r"^[A-Za-z0-9_-]+$")
RFC3339_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$")

REGISTRY_KEYS = {"registrySnapshotId", "registrySnapshotVersion", "writeTimestamp", "rows"}
ROW_KEYS = {
    "issuerIdentity", "entryVersion", "issuerAttestedHash",
    "canonicalContentBytesBase64", "canonicalContentHashHex", "status",
    "registeredAt", "correctedAt", "revokedAt",
}
CONTENT_KEYS = {"authority", "issuerIdentity", "policyVersion"}
RESPONSE_KEYS = {
    "lookupId", "issuerIdentity", "claimedIssuerHash", "registrySnapshotId",
    "registrySnapshotHashHex", "registrySnapshotVersion", "entryVersion",
    "result", "errorCode", "queriedAt", "consumerIdentity",
    "observedSnapshotId", "priorEntryHashHex", "entryHashHex",
}
RESPONSE_PREIMAGE_KEYS = RESPONSE_KEYS - {"entryHashHex"}
RESULTS = {"IDENTITY_CONFIRMED", "IDENTITY_REJECTED", "IDENTITY_UNRESOLVED"}
UNRESOLVED_CODES = {
    "OBSERVATION_BINDING_UNRESOLVED", "FRESHNESS_UNRESOLVED", "AUTHORITY_UNRESOLVED"
}
STATUSES = {"registered", "ACTIVE", "corrected", "REVOKED"}
LOOKUP_REQUEST_KEYS = {
    "lookupId", "issuerIdentity", "claimedIssuerHash", "consumerIdentity",
    "observedSnapshotId",
}
FRESHNESS_THRESHOLD_SECONDS = 86400


class CheckerViolation(ValueError):
    def __init__(self, taxonomy_id: str, message: str):
        self.taxonomy_id = taxonomy_id
        super().__init__(f"{taxonomy_id}: {message}")


@dataclass(frozen=True)
class RegistryResult:
    snapshot_id: str
    snapshot_version: int
    snapshot_hash_hex: str
    rows: tuple[dict[str, Any], ...]
    canonical_bytes: bytes = field(repr=False)
    integrity_mismatch_rows: tuple[int, ...] = field(default=(), repr=False)


@dataclass(frozen=True)
class ResponseResult:
    count: int
    genesis_entry_hash_hex: str | None
    last_entry_hash_hex: str | None
    lookup_ids: tuple[str, ...]


def _fail(taxonomy_id: str, message: str) -> None:
    raise CheckerViolation(taxonomy_id, message)


def _require_exact_keys(value: Any, expected: set[str], prefix: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        _fail(f"{prefix}_SCHEMA_INVALID", "value must be an object")
    actual = set(value)
    missing = sorted(expected - actual)
    extra = sorted(actual - expected)
    if missing:
        _fail(f"{prefix}_FIELD_MISSING", ",".join(missing))
    if extra:
        _fail(f"{prefix}_EXTRA_FIELD", ",".join(extra))
    return value


def _require_text(value: Any, taxonomy: str, *, pattern: re.Pattern[str] | None = None) -> str:
    if not isinstance(value, str) or not value:
        _fail(taxonomy, "expected non-empty string")
    if pattern is not None and pattern.fullmatch(value) is None:
        _fail(taxonomy, f"invalid value {value!r}")
    return value


def _require_int(value: Any, taxonomy: str) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not (1 <= value <= 2147483647):
        _fail(taxonomy, "expected integer in 1..2147483647")
    return value


def _require_timestamp(value: Any, taxonomy: str) -> str:
    text = _require_text(value, taxonomy)
    if RFC3339_RE.fullmatch(text) is None:
        _fail(taxonomy, "timestamp must be RFC3339 UTC")
    try:
        datetime.fromisoformat(text[:-1] + "+00:00")
    except ValueError as exc:
        _fail(taxonomy, f"invalid timestamp: {exc}")
    return text


def _timestamp_datetime(value: Any, taxonomy: str) -> datetime:
    text = _require_timestamp(value, taxonomy)
    return datetime.fromisoformat(text[:-1] + "+00:00")


def _require_hex(value: Any, taxonomy: str) -> str:
    if not isinstance(value, str) or HEX_RE.fullmatch(value) is None:
        _fail(taxonomy, "expected 64 lowercase hexadecimal characters")
    return value


def _sha256_hex(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def _canonical_json_bytes(value: Any) -> bytes:
    """Canonical bytes for this closed ASCII/no-float contract domain."""
    def walk(node: Any) -> None:
        if node is None or isinstance(node, (str, bool)):
            return
        if isinstance(node, int) and not isinstance(node, bool):
            return
        if isinstance(node, list):
            for item in node:
                walk(item)
            return
        if isinstance(node, dict):
            if any(not isinstance(key, str) for key in node):
                _fail("CANONICALIZATION_SCHEMA_INVALID", "object keys must be strings")
            for item in node.values():
                walk(item)
            return
        _fail("CANONICALIZATION_TYPE_UNSUPPORTED", f"unsupported JSON type {type(node).__name__}")

    walk(value)
    try:
        text = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
        return text.encode("utf-8")
    except (TypeError, ValueError, UnicodeError) as exc:
        _fail("CANONICALIZATION_FAILED", str(exc))


def _loads_exact(raw: bytes, prefix: str, *, require_canonical: bool = True) -> Any:
    if raw.startswith(b"\xef\xbb\xbf"):
        _fail(f"{prefix}_BOM_FORBIDDEN", "UTF-8 BOM is forbidden")
    try:
        text = raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        _fail(f"{prefix}_UTF8_INVALID", str(exc))
    try:
        value = json.loads(text, parse_constant=lambda x: _fail(f"{prefix}_NUMBER_INVALID", x))
    except (json.JSONDecodeError, RecursionError) as exc:
        _fail(f"{prefix}_JSON_INVALID", str(exc))
    if require_canonical and _canonical_json_bytes(value) != raw:
        _fail(f"{prefix}_NON_CANONICAL_JCS", "bytes differ from compact sorted UTF-8 JCS")
    return value


def _decode_base64url_strict(value: Any, prefix: str) -> bytes:
    text = _require_text(value, f"{prefix}_ENCODING_INVALID")
    if "=" in text or BASE64URL_RE.fullmatch(text) is None:
        _fail(f"{prefix}_NON_CANONICAL_BASE64URL", "padding, whitespace, or invalid alphabet")
    try:
        raw = base64.urlsafe_b64decode(text + "=" * ((4 - len(text) % 4) % 4))
    except Exception as exc:  # binascii differs by Python release
        _fail(f"{prefix}_NON_CANONICAL_BASE64URL", str(exc))
    encoded = base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")
    if encoded != text:
        _fail(f"{prefix}_NON_CANONICAL_BASE64URL", "decode/re-encode differs")
    return raw


def validate_content(encoded: Any, *, expected_issuer: str) -> tuple[dict[str, Any], bytes, str]:
    raw = _decode_base64url_strict(encoded, "CONTENT")
    content = _require_exact_keys(_loads_exact(raw, "CONTENT"), CONTENT_KEYS, "CONTENT")
    if content["authority"] != CONTENT_AUTHORITY:
        _fail("CONTENT_AUTHORITY_INVALID", "authority must be ACEL_G1_DECISION_OWNER")
    issuer = _require_text(content["issuerIdentity"], "CONTENT_ISSUER_INVALID", pattern=IDENTITY_RE)
    if issuer != expected_issuer:
        _fail("CONTENT_ISSUER_MISMATCH", "content issuerIdentity differs from row")
    _require_int(content["policyVersion"], "CONTENT_POLICY_VERSION_INVALID")
    return content, raw, _sha256_hex(raw)


def validate_registry_bytes(
    raw: bytes, *, allow_integrity_mismatch_receipt: bool = False
) -> RegistryResult:
    envelope = _require_exact_keys(_loads_exact(raw, "REGISTRY"), REGISTRY_KEYS, "REGISTRY")
    snapshot_id = _require_text(envelope["registrySnapshotId"], "REGISTRY_SNAPSHOT_ID_INVALID", pattern=IDENTITY_RE)
    snapshot_version = _require_int(envelope["registrySnapshotVersion"], "REGISTRY_SNAPSHOT_VERSION_INVALID")
    _require_timestamp(envelope["writeTimestamp"], "REGISTRY_WRITE_TIMESTAMP_INVALID")
    rows = envelope["rows"]
    if not isinstance(rows, list) or not rows:
        _fail("REGISTRY_ROWS_INVALID", "rows must be a non-empty array")

    versions: dict[str, list[int]] = {}
    active: dict[str, int] = {}
    terminal: set[str] = set()
    validated: list[dict[str, Any]] = []
    integrity_mismatch_rows: list[int] = []
    for index, item in enumerate(rows):
        row = _require_exact_keys(item, ROW_KEYS, "ROW")
        issuer = _require_text(row["issuerIdentity"], "ROW_ISSUER_INVALID", pattern=IDENTITY_RE)
        version = _require_int(row["entryVersion"], "ROW_ENTRY_VERSION_INVALID")
        attested = _require_hex(row["issuerAttestedHash"], "ROW_ATTESTED_HASH_INVALID")
        stored_hash = _require_hex(row["canonicalContentHashHex"], "ROW_CONTENT_HASH_INVALID")
        _content, _content_raw, recomputed = validate_content(
            row["canonicalContentBytesBase64"], expected_issuer=issuer
        )
        if stored_hash != recomputed or attested != recomputed:
            if not allow_integrity_mismatch_receipt:
                taxonomy = "ROW_CONTENT_HASH_MISMATCH" if stored_hash != recomputed else "ROW_ATTESTED_HASH_MISMATCH"
                _fail(taxonomy, f"row {index}")
            integrity_mismatch_rows.append(index)
        status = row["status"]
        if status not in STATUSES:
            _fail("ROW_STATUS_INVALID", f"row {index}")
        registered_text = _require_timestamp(row["registeredAt"], "ROW_REGISTERED_AT_INVALID")
        registered = _timestamp_datetime(registered_text, "ROW_REGISTERED_AT_INVALID")
        corrected = row["correctedAt"]
        revoked = row["revokedAt"]
        if corrected is not None:
            corrected = _timestamp_datetime(corrected, "ROW_CORRECTED_AT_INVALID")
        if revoked is not None:
            revoked = _timestamp_datetime(revoked, "ROW_REVOKED_AT_INVALID")
        if status in {"registered", "ACTIVE"} and (corrected is not None or revoked is not None):
            _fail("ROW_LIFECYCLE_INVALID", "registered/ACTIVE row cannot carry correctedAt/revokedAt")
        if status == "corrected" and corrected is None:
            _fail("ROW_LIFECYCLE_INVALID", "corrected row requires correctedAt")
        if status == "REVOKED" and revoked is None:
            _fail("ROW_LIFECYCLE_INVALID", "REVOKED row requires revokedAt")
        if corrected is not None and corrected < registered:
            _fail("ROW_LIFECYCLE_INVALID", "correctedAt precedes registeredAt")
        if revoked is not None and revoked < registered:
            _fail("ROW_LIFECYCLE_INVALID", "revokedAt precedes registeredAt")
        if issuer in terminal:
            _fail("ROW_TERMINAL_REVOCATION_VIOLATION", issuer)
        versions.setdefault(issuer, []).append(version)
        if status == "ACTIVE":
            active[issuer] = active.get(issuer, 0) + 1
        if status == "REVOKED":
            terminal.add(issuer)
        validated.append(dict(row))

    for issuer, values in versions.items():
        if values != sorted(set(values)):
            _fail("ROW_VERSION_SEQUENCE_INVALID", issuer)
        if values != list(range(values[0], values[-1] + 1)):
            _fail("ROW_VERSION_GAP", issuer)
        if active.get(issuer, 0) > 1:
            _fail("AMBIGUOUS_ACTIVE_VERSION", issuer)
    return RegistryResult(
        snapshot_id, snapshot_version, _sha256_hex(raw), tuple(validated), raw,
        tuple(integrity_mismatch_rows),
    )


def _parse_response_lines(raw: bytes) -> list[tuple[dict[str, Any], bytes]]:
    if raw == b"":
        return []
    if raw.startswith(b"\xef\xbb\xbf"):
        _fail("RESPONSE_BOM_FORBIDDEN", "UTF-8 BOM is forbidden")
    if b"\r" in raw:
        _fail("RESPONSE_CRLF_FORBIDDEN", "CR bytes are forbidden")
    if not raw.endswith(b"\n"):
        _fail("RESPONSE_PARTIAL_LINE", "non-empty log must end with LF")
    pieces = raw[:-1].split(b"\n")
    if any(piece == b"" or piece.strip() == b"" for piece in pieces):
        _fail("RESPONSE_BLANK_LINE", "blank or whitespace-only line")
    return [(_loads_exact(piece, "RESPONSE"), piece) for piece in pieces]


def response_preimage(record: dict[str, Any]) -> dict[str, Any]:
    return {"profile": CANON_PROFILE, "domain": RESPONSE_DOMAIN, **{key: record[key] for key in RESPONSE_PREIMAGE_KEYS}}


def response_entry_hash(record: dict[str, Any]) -> str:
    return _sha256_hex(_canonical_json_bytes(response_preimage(record)))


def validate_response_record(
    record: Any,
    *,
    expected_prior: str | None,
    registry: RegistryResult | None = None,
) -> dict[str, Any]:
    row = _require_exact_keys(record, RESPONSE_KEYS, "RESPONSE")
    try:
        parsed_uuid = uuid.UUID(_require_text(row["lookupId"], "RESPONSE_LOOKUP_ID_INVALID"))
    except (ValueError, AttributeError) as exc:
        _fail("RESPONSE_LOOKUP_ID_INVALID", str(exc))
    if str(parsed_uuid) != row["lookupId"].lower():
        _fail("RESPONSE_LOOKUP_ID_NON_CANONICAL", str(row["lookupId"]))
    _require_text(row["issuerIdentity"], "RESPONSE_ISSUER_INVALID", pattern=IDENTITY_RE)
    _require_hex(row["claimedIssuerHash"], "RESPONSE_CLAIMED_HASH_INVALID")
    _require_text(row["registrySnapshotId"], "RESPONSE_SNAPSHOT_ID_INVALID", pattern=IDENTITY_RE)
    _require_hex(row["registrySnapshotHashHex"], "RESPONSE_SNAPSHOT_HASH_INVALID")
    _require_int(row["registrySnapshotVersion"], "RESPONSE_SNAPSHOT_VERSION_INVALID")
    _require_int(row["entryVersion"], "RESPONSE_ENTRY_VERSION_INVALID")
    if row["result"] not in RESULTS:
        _fail("RESPONSE_RESULT_INVALID", str(row["result"]))
    if row["result"] == "IDENTITY_UNRESOLVED":
        if row["errorCode"] not in UNRESOLVED_CODES:
            _fail("RESPONSE_ERROR_CODE_INVALID", "unresolved result requires one closed error code")
    elif row["errorCode"] is not None:
        _fail("RESPONSE_ERROR_CODE_INVALID", "confirmed/rejected errorCode must be null")
    _require_timestamp(row["queriedAt"], "RESPONSE_QUERIED_AT_INVALID")
    _require_text(row["consumerIdentity"], "RESPONSE_CONSUMER_INVALID", pattern=IDENTITY_RE)
    _require_text(row["observedSnapshotId"], "RESPONSE_OBSERVED_SNAPSHOT_ID_INVALID", pattern=IDENTITY_RE)
    if row["priorEntryHashHex"] != expected_prior:
        _fail("RESPONSE_CHAIN_BROKEN", "priorEntryHashHex mismatch")
    if row["priorEntryHashHex"] is not None:
        _require_hex(row["priorEntryHashHex"], "RESPONSE_PRIOR_HASH_INVALID")
    stored = _require_hex(row["entryHashHex"], "RESPONSE_ENTRY_HASH_INVALID")
    if stored != response_entry_hash(row):
        _fail("RESPONSE_ENTRY_HASH_MISMATCH", row["lookupId"])
    if registry is not None:
        if row["registrySnapshotId"] != registry.snapshot_id:
            _fail("RESPONSE_SNAPSHOT_ID_MISMATCH", row["lookupId"])
        if row["registrySnapshotVersion"] != registry.snapshot_version:
            _fail("RESPONSE_SNAPSHOT_VERSION_MISMATCH", row["lookupId"])
        if row["registrySnapshotHashHex"] != registry.snapshot_hash_hex:
            _fail("RESPONSE_SNAPSHOT_HASH_MISMATCH", row["lookupId"])
    return dict(row)


def validate_response_bytes(
    raw: bytes,
    *,
    registry: RegistryResult | None = None,
    observation_records: Iterable[dict[str, Any]] | None = None,
) -> ResponseResult:
    if registry is not None and observation_records is None:
        _fail("INCOMPLETE_REQUEST", "registry-bound response validation requires Group 3 observations")
    observations = tuple(observation_records or ())
    parsed = _parse_response_lines(raw)
    prior: str | None = None
    seen: dict[str, tuple[str, str, str, str]] = {}
    first: str | None = None
    lookup_ids: list[str] = []
    for value, line in parsed:
        row = validate_response_record(value, expected_prior=prior, registry=registry)
        if _canonical_json_bytes(row) != line:
            _fail("RESPONSE_NON_CANONICAL_JCS", row["lookupId"])
        if registry is not None:
            queried_at = datetime.fromisoformat(row["queriedAt"][:-1] + "+00:00")
            expected_result, expected_version, expected_error = classify_lookup_outcome(
                registry,
                observations,
                issuer_identity=row["issuerIdentity"],
                claimed_hash=row["claimedIssuerHash"],
                observed_snapshot_id=row["observedSnapshotId"],
                evaluation_time=queried_at,
            )
            actual = (row["result"], row["entryVersion"], row["errorCode"])
            expected = (expected_result, expected_version, expected_error)
            if actual != expected:
                _fail(
                    "RESPONSE_OUTCOME_MISMATCH",
                    f"{row['lookupId']}: stored {actual!r} does not equal replayed {expected!r}",
                )
        immutable = (
            row["issuerIdentity"], row["claimedIssuerHash"],
            row["consumerIdentity"], row["observedSnapshotId"],
        )
        if row["lookupId"] in seen:
            if seen[row["lookupId"]] == immutable:
                _fail("RESPONSE_DUPLICATE_LOOKUP_ID", row["lookupId"])
            _fail("LOOKUP_ID_CONFLICT", row["lookupId"])
        seen[row["lookupId"]] = immutable
        prior = row["entryHashHex"]
        first = first or prior
        lookup_ids.append(row["lookupId"])
    return ResponseResult(len(parsed), first, prior, tuple(lookup_ids))


def resolve_lookup_id(
    records: Iterable[dict[str, Any]],
    lookup_id: str,
    immutable_request: tuple[str, str, str, str],
) -> tuple[str, dict[str, Any] | None]:
    """Resolve durable-wrapper idempotency without mutating the response log."""
    matches = [record for record in records if record.get("lookupId") == lookup_id]
    if not matches:
        return "NEW", None
    if len(matches) != 1:
        _fail("RESPONSE_DUPLICATE_LOOKUP_ID", lookup_id)
    row = matches[0]
    stored = (
        row.get("issuerIdentity"), row.get("claimedIssuerHash"),
        row.get("consumerIdentity"), row.get("observedSnapshotId"),
    )
    if stored != immutable_request:
        _fail("LOOKUP_ID_CONFLICT", lookup_id)
    return "IDEMPOTENT", row


def parse_observation_log(raw: bytes) -> list[dict[str, Any]]:
    """Parse and fully validate the accepted Group 3 source contract."""
    if raw.startswith(b"\xef\xbb\xbf") or b"\r" in raw or (raw and not raw.endswith(b"\n")):
        _fail("OBSERVATION_FRAMING_INVALID", "requires no BOM/CR and terminal LF")
    if not raw:
        _fail("OBSERVATION_SOURCE_EMPTY", "Group 3 source must contain at least one record")
    try:
        text = raw.decode("utf-8", errors="strict")
        values = observation_checker._parse_log_records(text)
        observation_checker.validate_log(
            values,
            expected_observer=PARTY_B_SID,
            registry_writer_sid=PARTY_C_SID,
        )
        return values
    except (UnicodeDecodeError, observation_checker.CheckerViolation) as exc:
        _fail("SOURCE_SCHEMA_INVALID", f"Group 3 validation failed: {exc}")


def bind_registry_observation(
    registry: RegistryResult,
    observation_records: Iterable[dict[str, Any]],
    observed_snapshot_id: str,
) -> dict[str, Any]:
    matches = [r for r in observation_records if r.get("snapshotId") == observed_snapshot_id]
    if len(matches) != 1:
        _fail("OBSERVATION_BINDING_UNRESOLVED", "expected exactly one observation")
    row = matches[0]
    if row.get("registryName") != "issuer_registry":
        _fail("OBSERVATION_REGISTRY_MISMATCH", "registryName must be issuer_registry")
    if row.get("observerIdentity") != PARTY_B_SID:
        _fail("OBSERVATION_AUTHORITY_INVALID", "observer must be Party B")
    if row.get("authority") != CONTENT_AUTHORITY:
        _fail("OBSERVATION_AUTHORITY_INVALID", "authority must match the active decision-owner policy")
    if row.get("registrySnapshotVersion") != registry.snapshot_version:
        _fail("OBSERVATION_VERSION_MISMATCH", "registry version differs")
    if row.get("snapshotHashHex") != registry.snapshot_hash_hex:
        _fail("OBSERVATION_HASH_MISMATCH", "snapshot digest differs")
    decoded = _decode_base64url_strict(row.get("snapshot_content"), "OBSERVATION_CONTENT")
    if decoded != registry.canonical_bytes:
        _fail("OBSERVATION_BYTES_MISMATCH", "decoded snapshot bytes differ")
    return row


def classify_observation_binding(
    registry: RegistryResult,
    observation_records: Iterable[dict[str, Any]],
    observed_snapshot_id: str,
    *,
    evaluation_time: datetime,
    freshness_seconds: int = FRESHNESS_THRESHOLD_SECONDS,
) -> tuple[dict[str, Any] | None, str | None]:
    """Return the exact observation and an optional closed unresolved code."""
    matches = [r for r in observation_records if r.get("snapshotId") == observed_snapshot_id]
    if len(matches) == 0:
        return None, "OBSERVATION_BINDING_UNRESOLVED"
    if len(matches) != 1:
        _fail("SOURCE_SCHEMA_INVALID", "duplicate observedSnapshotId in Group 3")
    row = matches[0]
    if row.get("registryName") != "issuer_registry":
        return row, "OBSERVATION_BINDING_UNRESOLVED"
    if row.get("registrySnapshotVersion") != registry.snapshot_version:
        _fail("OBSERVATION_VERSION_MISMATCH", "observation version differs from captured registry")
    if row.get("snapshotHashHex") != registry.snapshot_hash_hex:
        _fail("OBSERVATION_HASH_MISMATCH", "observation digest differs from captured registry")
    decoded = _decode_base64url_strict(row.get("snapshot_content"), "OBSERVATION_CONTENT")
    if decoded != registry.canonical_bytes:
        _fail("OBSERVATION_BYTES_MISMATCH", "observation bytes differ from captured registry")
    if row.get("authority") != CONTENT_AUTHORITY:
        return row, "AUTHORITY_UNRESOLVED"
    observed = datetime.fromisoformat(str(row["observedAt"])[:-1] + "+00:00")
    now = evaluation_time.astimezone(timezone.utc)
    age = (now - observed).total_seconds()
    if age < 0:
        return row, "OBSERVATION_BINDING_UNRESOLVED"
    if age > freshness_seconds:
        return row, "FRESHNESS_UNRESOLVED"
    return row, None


def classify_lookup_outcome(
    registry: RegistryResult,
    observation_records: Iterable[dict[str, Any]],
    *,
    issuer_identity: str,
    claimed_hash: str,
    observed_snapshot_id: str,
    evaluation_time: datetime,
) -> tuple[str, int, str | None]:
    """Replay the closed T2F first-failure order for new and stored receipts."""
    issuer_rows = [row for row in registry.rows if row["issuerIdentity"] == issuer_identity]
    if not issuer_rows:
        _fail("ISSUER_NOT_FOUND", issuer_identity)
    active = [row for row in issuer_rows if row["status"] == "ACTIVE"]
    if len(active) > 1:
        _fail("AMBIGUOUS_ACTIVE_VERSION", issuer_identity)
    selected = active[0] if active else max(issuer_rows, key=lambda row: row["entryVersion"])
    selected_index = registry.rows.index(selected)

    # T2F steps 5-6: schema-complete cryptographic mismatch is receipt-eligible.
    if (
        selected_index in registry.integrity_mismatch_rows
        or claimed_hash != selected["issuerAttestedHash"]
        or claimed_hash != selected["canonicalContentHashHex"]
    ):
        return "IDENTITY_REJECTED", selected["entryVersion"], None

    # T2F step 7: missing/authority/freshness uncertainty precedes status.
    observation, unresolved_code = classify_observation_binding(
        registry,
        observation_records,
        observed_snapshot_id,
        evaluation_time=evaluation_time,
    )
    if unresolved_code is not None:
        return "IDENTITY_UNRESOLVED", selected["entryVersion"], unresolved_code

    # T2F step 8: an exact, current observation still cannot confirm inactive data.
    if selected["status"] != "ACTIVE":
        return "IDENTITY_REJECTED", selected["entryVersion"], None

    assert observation is not None
    snapshot_content = _decode_base64url_strict(
        observation["snapshot_content"], "OBSERVATION_CONTENT"
    )
    evaluated = evaluate_lookup(issuer_identity, claimed_hash, snapshot_content)
    if evaluated != ("IDENTITY_CONFIRMED", selected["entryVersion"], None):
        _fail("SOURCE_SCHEMA_INVALID", "bound observation did not reproduce confirmed evaluation")
    return evaluated


def evaluate_lookup(
    issuer_identity: str,
    issuer_attested_hash: str,
    snapshot_content: bytes,
) -> tuple[str, int | None, str | None]:
    """Pure three-argument T2C evaluator; returns result/version/errorCode."""
    registry = validate_registry_bytes(
        snapshot_content, allow_integrity_mismatch_receipt=True
    )
    rows = [r for r in registry.rows if r["issuerIdentity"] == issuer_identity]
    if not rows:
        return "IDENTITY_UNRESOLVED", None, "AUTHORITY_UNRESOLVED"
    active = [r for r in rows if r["status"] == "ACTIVE"]
    if len(active) > 1:
        _fail("AMBIGUOUS_ACTIVE_VERSION", issuer_identity)
    row = active[0] if active else max(rows, key=lambda candidate: candidate["entryVersion"])
    row_index = registry.rows.index(row)
    if row_index in registry.integrity_mismatch_rows:
        return "IDENTITY_REJECTED", row["entryVersion"], None
    if issuer_attested_hash != row["issuerAttestedHash"] or issuer_attested_hash != row["canonicalContentHashHex"]:
        return "IDENTITY_REJECTED", row["entryVersion"], None
    if row["status"] != "ACTIVE":
        return "IDENTITY_REJECTED", row["entryVersion"], None
    return "IDENTITY_CONFIRMED", row["entryVersion"], None


def build_response(
    *, lookup_id: str, issuer_identity: str, claimed_hash: str,
    consumer_identity: str, observed_snapshot_id: str, queried_at: str,
    registry: RegistryResult, result: str, entry_version: int,
    error_code: str | None, prior_entry_hash: str | None,
) -> dict[str, Any]:
    row: dict[str, Any] = {
        "lookupId": lookup_id,
        "issuerIdentity": issuer_identity,
        "claimedIssuerHash": claimed_hash,
        "registrySnapshotId": registry.snapshot_id,
        "registrySnapshotHashHex": registry.snapshot_hash_hex,
        "registrySnapshotVersion": registry.snapshot_version,
        "entryVersion": entry_version,
        "result": result,
        "errorCode": error_code,
        "queriedAt": queried_at,
        "consumerIdentity": consumer_identity,
        "observedSnapshotId": observed_snapshot_id,
        "priorEntryHashHex": prior_entry_hash,
    }
    row["entryHashHex"] = response_entry_hash(row)
    validate_response_record(row, expected_prior=prior_entry_hash, registry=registry)
    return row


def _response_records(
    raw: bytes,
    registry: RegistryResult,
    observation_records: Iterable[dict[str, Any]],
) -> list[dict[str, Any]]:
    validate_response_bytes(
        raw, registry=registry, observation_records=observation_records
    )
    return [value for value, _line in _parse_response_lines(raw)]


def prepare_lookup_response(
    *,
    registry_bytes: bytes,
    response_bytes: bytes,
    observation_bytes: bytes,
    request: Any,
    evaluation_time: datetime | None = None,
) -> tuple[str, dict[str, Any]]:
    """Pure durable-wrapper preparation; returns IDPOTENT or APPEND and a row.

    The caller supplies no query timestamp.  The wrapper mints `queriedAt`
    from its trusted clock (or a direct test injection) after strict request
    admission.  This function performs no filesystem mutation.
    """
    if not isinstance(request, dict):
        _fail("MALFORMED_REQUEST", "request must be an object")
    missing = sorted(LOOKUP_REQUEST_KEYS - set(request))
    if missing:
        _fail("INCOMPLETE_REQUEST", ",".join(missing))
    extra = sorted(set(request) - LOOKUP_REQUEST_KEYS)
    if extra:
        _fail("MALFORMED_REQUEST", ",".join(extra))
    req = request
    lookup_id = _require_text(req["lookupId"], "REQUEST_LOOKUP_ID_INVALID")
    try:
        parsed_uuid = uuid.UUID(lookup_id)
    except ValueError as exc:
        _fail("MALFORMED_REQUEST", f"lookupId: {exc}")
    if str(parsed_uuid) != lookup_id.lower():
        _fail("MALFORMED_REQUEST", "lookupId must use canonical UUID text")
    issuer = _require_text(req["issuerIdentity"], "MALFORMED_REQUEST", pattern=IDENTITY_RE)
    claimed = _require_hex(req["claimedIssuerHash"], "MALFORMED_REQUEST")
    consumer = _require_text(req["consumerIdentity"], "MALFORMED_REQUEST", pattern=IDENTITY_RE)
    observed_id = _require_text(req["observedSnapshotId"], "MALFORMED_REQUEST", pattern=IDENTITY_RE)

    registry = validate_registry_bytes(
        registry_bytes, allow_integrity_mismatch_receipt=True
    )
    observations = parse_observation_log(observation_bytes)
    existing = _response_records(response_bytes, registry, observations)
    immutable = (issuer, claimed, consumer, observed_id)
    idempotency, stored = resolve_lookup_id(existing, lookup_id, immutable)
    if idempotency == "IDEMPOTENT":
        assert stored is not None
        validate_response_record(
            stored,
            expected_prior=stored["priorEntryHashHex"],
            registry=registry,
        )
        return "IDEMPOTENT", stored

    now = evaluation_time or datetime.now(timezone.utc).replace(microsecond=0)
    if now.tzinfo is None or now.utcoffset() != timezone.utc.utcoffset(now):
        _fail("MALFORMED_REQUEST", "internal evaluation time must be UTC")
    result, entry_version, error_code = classify_lookup_outcome(
        registry,
        observations,
        issuer_identity=issuer,
        claimed_hash=claimed,
        observed_snapshot_id=observed_id,
        evaluation_time=now,
    )
    queried_at = now.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    prior_hash = existing[-1]["entryHashHex"] if existing else None
    row = build_response(
        lookup_id=lookup_id,
        issuer_identity=issuer,
        claimed_hash=claimed,
        consumer_identity=consumer,
        observed_snapshot_id=observed_id,
        queried_at=queried_at,
        registry=registry,
        result=result,
        entry_version=entry_version,
        error_code=error_code,
        prior_entry_hash=prior_hash,
    )
    return "APPEND", row


def _security_state(path: Path) -> dict[str, Any]:
    script = r'''param([string]$P)
$i=[System.IO.FileInfo]::new($P)
$s=[System.IO.FileSystemAclExtensions]::GetAccessControl($i,[System.Security.AccessControl.AccessControlSections]::Owner -bor [System.Security.AccessControl.AccessControlSections]::Access)
$a=@($s.GetAccessRules($true,$true,[System.Security.Principal.SecurityIdentifier]) | ForEach-Object {[ordered]@{sid=$_.IdentityReference.Value;rights=[int]$_.FileSystemRights;accessType=[int]$_.AccessControlType;isInherited=[bool]$_.IsInherited;inheritanceFlags=[int]$_.InheritanceFlags;propagationFlags=[int]$_.PropagationFlags}})
[ordered]@{ownerSid=$s.GetOwner([System.Security.Principal.SecurityIdentifier]).Value;protectionState=[bool]$s.AreAccessRulesProtected;inheritanceState=(@($a|Where-Object isInherited).Count -gt 0);aces=$a}|ConvertTo-Json -Depth 5 -Compress
'''
    proc = subprocess.run(
        ["pwsh", "-NoProfile", "-Command", script, "-P", str(path)],
        text=True, encoding="utf-8", errors="replace", capture_output=True,
    )
    if proc.returncode != 0:
        _fail("SECURITY_READ_FAILED", proc.stderr.strip() or proc.stdout.strip())
    try:
        return json.loads(proc.stdout)
    except json.JSONDecodeError as exc:
        _fail("SECURITY_READ_FAILED", str(exc))


def validate_security(path: Path, kind: str) -> dict[str, Any]:
    state = _security_state(path)
    expected_owner = PARTY_C_SID if kind == "registry" else PARTY_B_SID
    full_control = 2032127
    normalized_read = 1179785
    expected = (
        [
            (PARTY_C_SID, full_control, 0, False, 0, 0),
            (SYSTEM_SID, full_control, 0, False, 0, 0),
            (ADMINISTRATORS_SID, full_control, 0, False, 0, 0),
            (PARTY_B_SID, normalized_read, 0, False, 0, 0),
            (LOCAL_SID, normalized_read, 0, False, 0, 0),
        ]
        if kind == "registry" else
        [
            (PARTY_B_SID, full_control, 0, False, 0, 0),
            (SYSTEM_SID, full_control, 0, False, 0, 0),
            (ADMINISTRATORS_SID, full_control, 0, False, 0, 0),
            (LOCAL_SID, normalized_read, 0, False, 0, 0),
        ]
    )
    if state.get("ownerSid") != expected_owner:
        _fail("SECURITY_OWNER_MISMATCH", str(state.get("ownerSid")))
    if state.get("protectionState") is not True or state.get("inheritanceState") is not False:
        _fail("SECURITY_PROTECTION_MISMATCH", "DACL must be protected with no inherited ACE")
    aces = state.get("aces")
    if not isinstance(aces, list) or len(aces) != len(expected):
        _fail("SECURITY_ACE_SET_MISMATCH", "wrong ACE count")
    actual = [
        (
            ace.get("sid"), ace.get("rights"), ace.get("accessType"),
            ace.get("isInherited"), ace.get("inheritanceFlags"),
            ace.get("propagationFlags"),
        )
        for ace in aces
    ]
    if actual != expected:
        _fail("SECURITY_ACE_ORDER_MISMATCH", "ordered complete ACE tuple vector differs")
    if sorted(actual) != sorted(expected):
        _fail("SECURITY_ACE_SET_MISMATCH", "semantic ACE tuple multiset differs")
    state["orderedAceTuples"] = actual
    state["semanticAceMultiset"] = sorted(actual)
    return state


def _positive_registry() -> bytes:
    return (
        b'{"registrySnapshotId":"issuer-registry-snapshot-test-0001","registrySnapshotVersion":1,'
        b'"rows":[{"canonicalContentBytesBase64":"eyJhdXRob3JpdHkiOiJBQ0VMX0cxX0RFQ0lTSU9OX09XTkVSIiwiaXNzdWVySWRlbnRpdHkiOiJpc3N1ZXItdGVzdC0wMDEiLCJwb2xpY3lWZXJzaW9uIjoxfQ",'
        b'"canonicalContentHashHex":"db76dcc22fcec9cc566c5b449b0aaa8eabdb657d157c62cba626aba8b26d12ca",'
        b'"correctedAt":null,"entryVersion":1,"issuerAttestedHash":"db76dcc22fcec9cc566c5b449b0aaa8eabdb657d157c62cba626aba8b26d12ca",'
        b'"issuerIdentity":"issuer-test-001","registeredAt":"2026-09-22T00:00:00Z","revokedAt":null,"status":"ACTIVE"}],'
        b'"writeTimestamp":"2026-09-22T00:00:01Z"}'
    )


def _run_self_test() -> int:
    checks = 0
    raw = _positive_registry()
    result = validate_registry_bytes(raw)
    assert len(raw) == 618
    assert result.snapshot_hash_hex == "d31e0c206da091bc408005d490e69f7aa0eae733dac4b03c67edd280034827f2"
    assert result.rows[0]["canonicalContentHashHex"] == "db76dcc22fcec9cc566c5b449b0aaa8eabdb657d157c62cba626aba8b26d12ca"
    checks += 3
    response = build_response(
        lookup_id="808e5a61-0b1c-4bdd-b505-2c2687496b9f",
        issuer_identity="issuer-test-001",
        claimed_hash=result.rows[0]["issuerAttestedHash"],
        consumer_identity="consumer-test-001",
        observed_snapshot_id="snap-test-001",
        queried_at="2026-09-22T00:00:02Z", registry=result,
        result="IDENTITY_CONFIRMED", entry_version=1, error_code=None,
        prior_entry_hash=None,
    )
    response_raw = _canonical_json_bytes(response) + b"\n"
    observation = ({
        "snapshotId": "snap-test-001",
        "registryName": "issuer_registry",
        "registrySnapshotVersion": result.snapshot_version,
        "snapshotHashHex": result.snapshot_hash_hex,
        "snapshot_content": base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii"),
        "observedAt": "2026-09-22T00:00:01Z",
        "authority": CONTENT_AUTHORITY,
    },)
    assert validate_response_bytes(
        response_raw, registry=result, observation_records=observation
    ).count == 1
    assert evaluate_lookup("issuer-test-001", response["claimedIssuerHash"], raw)[0] == "IDENTITY_CONFIRMED"
    checks += 2
    for mutation, taxonomy in (
        (b"\xef\xbb\xbf" + raw, "REGISTRY_BOM_FORBIDDEN"),
        (raw + b"\n", "REGISTRY_NON_CANONICAL_JCS"),
        (response_raw.replace(b"\n", b"\r\n"), "RESPONSE_CRLF_FORBIDDEN"),
        (response_raw[:-1], "RESPONSE_PARTIAL_LINE"),
    ):
        try:
            if taxonomy.startswith("REGISTRY"):
                validate_registry_bytes(mutation)
            else:
                validate_response_bytes(
                    mutation, registry=result, observation_records=observation
                )
        except CheckerViolation as exc:
            assert exc.taxonomy_id == taxonomy, (exc.taxonomy_id, taxonomy)
            checks += 1
        else:
            raise AssertionError(f"mutation unexpectedly accepted: {taxonomy}")
    print(json.dumps({"result": "PASS", "checks": checks, "sourceMutation": False}, sort_keys=True))
    return 0


def _read(path: str) -> bytes:
    try:
        return Path(path).read_bytes()
    except OSError as exc:
        _fail("SOURCE_UNAVAILABLE", f"{path}: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--registry")
    parser.add_argument("--responses")
    parser.add_argument("--observation-log")
    parser.add_argument("--observed-snapshot-id")
    parser.add_argument("--prepare-request")
    parser.add_argument("--receipt-context", action="store_true")
    parser.add_argument("--check-security", action="store_true")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return _run_self_test()
    if not args.registry:
        parser.error("--registry is required unless --self-test is used")
    try:
        registry_path = Path(args.registry)
        registry_bytes = _read(args.registry)
        if args.receipt_context and (args.responses is None or args.observation_log is None):
            _fail(
                "INCOMPLETE_REQUEST",
                "--receipt-context requires --responses and --observation-log",
            )
        registry = validate_registry_bytes(
            registry_bytes,
            allow_integrity_mismatch_receipt=(args.prepare_request is not None or args.receipt_context),
        )
        response = None
        observation = None
        observation_records = None
        if args.prepare_request is not None:
            if args.responses is None or args.observation_log is None:
                _fail("INCOMPLETE_REQUEST", "preparation requires response and observation paths")
            request = _loads_exact(_read(args.prepare_request), "REQUEST")
            kind, row = prepare_lookup_response(
                registry_bytes=registry_bytes,
                response_bytes=_read(args.responses),
                observation_bytes=_read(args.observation_log),
                request=request,
            )
            line = _canonical_json_bytes(row) + b"\n"
            print(json.dumps({
                "kind": kind,
                "row": row,
                "lineBase64": base64.b64encode(line).decode("ascii"),
            }, sort_keys=True, separators=(",", ":")))
            return 0
        if args.observation_log is not None:
            observation_records = parse_observation_log(_read(args.observation_log))
        if args.responses is not None:
            if observation_records is None:
                _fail(
                    "INCOMPLETE_REQUEST",
                    "response validation requires --observation-log",
                )
            response = validate_response_bytes(
                _read(args.responses),
                registry=registry,
                observation_records=observation_records,
            )
        if args.observed_snapshot_id is not None:
            if observation_records is None:
                _fail("INCOMPLETE_REQUEST", "snapshot binding requires --observation-log")
            observation = bind_registry_observation(
                registry, observation_records, args.observed_snapshot_id
            )
        security = None
        if args.check_security:
            security = {"registry": validate_security(registry_path, "registry")}
            if args.responses is not None:
                security["responses"] = validate_security(Path(args.responses), "responses")
        print(json.dumps({
            "result": "PASS", "registrySnapshotId": registry.snapshot_id,
            "registrySnapshotVersion": registry.snapshot_version,
            "registrySnapshotHashHex": registry.snapshot_hash_hex,
            "issuerRowCount": len(registry.rows),
            "responseCount": None if response is None else response.count,
            "observedSnapshotId": None if observation is None else observation["snapshotId"],
            "securityChecked": security is not None,
        }, sort_keys=True))
        return 0
    except CheckerViolation as exc:
        print(json.dumps({"result": "FAIL", "taxonomyId": exc.taxonomy_id, "message": str(exc)}, sort_keys=True))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
