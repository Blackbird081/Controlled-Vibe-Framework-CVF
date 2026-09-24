#!/usr/bin/env python3
"""ACEL G1 T3C-C1 independent read-only checker for the Group 3 observation log.

Strict, read-only consumer for the governed Group 3 immutable observation log
(`governance/sources/registry_observation_log/LOG.jsonl`) or an explicit
fixture path. Validates the exact closed `cvf.observationLogEntry` schema,
strict unpadded base64url `snapshot_content` decoding, the independently
recomputed `snapshotHashHex` and `entryHashHex` digests, the hash chain from
genesis, per-`snapshotId` write-once uniqueness, observer identity separation,
and optional freshness, per `cvf.source-record-canonicalization@1` and the T2F
Group 3 contract
(`docs/audits/CVF_ACEL_G1_T2F_OPERATIONAL_SOURCE_ESTABLISHMENT_CONTRACT_2026-09-18.md`,
"Source Group 3" and "Immutable Snapshot Identity" T2G-01 through T2G-05).

This checker never writes, never fabricates a passing result on a missing
input (`LOG_UNREACHABLE` fails closed), and never claims a Group 3 source was
created, established, admitted, or consumer-wired. Its result text is
validation-only, never `SOURCE_CREATED_PENDING_LOCAL_VERIFICATION`.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_LOG_RELATIVE = "governance/sources/registry_observation_log/LOG.jsonl"

CANON_PROFILE = "cvf.source-record-canonicalization@1"
OBSERVATION_ENTRY_DOMAIN = "cvf.observationLogEntry"
ALLOWED_REGISTRY_NAMES = ("verifier_key_registry", "issuer_registry")

# Exact, operator-verified Party B principal and the forbidden observer
# identities (Party A, Activation Approver, Local). These are the only
# identities this checker compares against; every comparison is exact-string.
VERIFIED_PARTY_B_SID = "S-1-5-21-1644666849-912006174-747199667-1009"
FORBIDDEN_OBSERVER_SIDS = (
    "S-1-5-21-1644666849-912006174-747199667-1006",  # Party A
    "S-1-5-21-1644666849-912006174-747199667-1008",  # Activation Approver
    "S-1-5-21-1644666849-912006174-747199667-1001",  # Local
)

# Published 29-byte reproducible snapshot vector (T2G-05). Design vector only,
# never a claim that a real source snapshot exists.
PUBLISHED_29_BYTE_PREIMAGE = '{"registrySnapshotVersion":2}'
PUBLISHED_29_BYTE_BASE64URL = "eyJyZWdpc3RyeVNuYXBzaG90VmVyc2lvbiI6Mn0"
PUBLISHED_29_BYTE_SHA256 = "ecaddf2e1d99632e213b69f00240de3e4414ba3be1253a40946374624dd9949e"

HEX64_RE = re.compile(r"^[0-9a-f]{64}$")
BASE64URL_STRICT_RE = re.compile(r"^[A-Za-z0-9_-]+$")
RFC3339_UTC_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|z)$")

# The record's full JSONL field set and the closed preimage field set. The
# preimage is exactly `profile` + `domain` + the eight fields below; it
# excludes `snapshot_content` (the large observed payload) and `entryHashHex`
# (the record's own stored digest).
OBSERVATION_ENTRY_FIELDS = (
    "snapshotId",
    "registryName",
    "registrySnapshotVersion",
    "snapshot_content",
    "snapshotHashHex",
    "observedAt",
    "authority",
    "observerIdentity",
    "priorEntryHashHex",
    "entryHashHex",
)
OBSERVATION_ENTRY_PREIMAGE_FIELDS = (
    "snapshotId",
    "registryName",
    "registrySnapshotVersion",
    "snapshotHashHex",
    "observedAt",
    "authority",
    "observerIdentity",
    "priorEntryHashHex",
)
OBSERVATION_ENTRY_STORED_DIGEST = "entryHashHex"


class CheckerViolation(ValueError):
    """Raised for any fail-closed validation defect; carries a stable taxonomy id."""

    def __init__(self, taxonomy_id: str, message: str) -> None:
        super().__init__(f"[{taxonomy_id}] {message}")
        self.taxonomy_id = taxonomy_id


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    violations: tuple["Violation", ...] = field(default_factory=tuple)
    entry_count: int = 0
    genesis_entry_hash_hex: str = ""
    last_entry_hash_hex: str = ""
    snapshot_ids: tuple[str, ...] = field(default_factory=tuple)


@dataclass(frozen=True)
class Violation:
    taxonomy_id: str
    message: str

    def as_dict(self) -> dict:
        return {"taxonomyId": self.taxonomy_id, "message": self.message}


def _canonical_json_bytes(obj: dict) -> bytes:
    """Exact reference canonicalization per the T2F contract.

    `json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`
    encoded as UTF-8. This is the T2F-cited Python reference implementation
    itself, not a reimplementation the writer's PowerShell output must be
    trusted to match; both are independently verified against the same
    published vectors in the focused test suite.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _decode_base64url_strict(text: str, *, field_name: str = "snapshot_content") -> bytes:
    """Strict, canonical, unpadded base64url decode.

    Rejects anything the writer would never itself emit: padding (`=`),
    whitespace, standard-base64 characters (`+`, `/`), non-ASCII, a length
    whose padding requirement is invalid, and any encoding whose re-encoding
    does not reproduce the exact input byte-for-byte (which rejects
    non-canonical encodings that happen to decode successfully).
    """
    if not isinstance(text, str) or not text:
        raise CheckerViolation("SNAPSHOT_CONTENT_UNDECODABLE", f"{field_name} is empty or not a string")
    if any(ch.isspace() for ch in text):
        raise CheckerViolation("SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL", f"{field_name} must not contain whitespace")
    if "=" in text:
        raise CheckerViolation("SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL", f"{field_name} must be unpadded (no '=')")
    if not BASE64URL_STRICT_RE.match(text):
        raise CheckerViolation(
            "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL",
            f"{field_name} must use only the unpadded URL-safe alphabet [A-Za-z0-9_-]",
        )
    padding_needed = (-len(text)) % 4
    if padding_needed == 3:
        raise CheckerViolation("SNAPSHOT_CONTENT_UNDECODABLE", f"{field_name} has an invalid base64url length")
    padded = text + ("=" * padding_needed)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode("ascii"))
    except Exception as exc:  # noqa: BLE001 - normalize into taxonomy violation
        raise CheckerViolation("SNAPSHOT_CONTENT_UNDECODABLE", f"base64url decode failed: {exc}") from exc

    reencoded = base64.urlsafe_b64encode(decoded).rstrip(b"=").decode("ascii")
    if reencoded != text:
        raise CheckerViolation(
            "SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL",
            f"{field_name} does not reproduce byte-for-byte after canonical re-encoding",
        )
    return decoded


def _reject_duplicate_json_members(pairs: list[tuple[str, object]]) -> dict:
    seen: dict[str, object] = {}
    for key, value in pairs:
        if key in seen:
            raise CheckerViolation("SNAPSHOT_CONTENT_INVALID_JSON", f"duplicate JSON member '{key}'")
        seen[key] = value
    return seen


def _parse_json_strict(text: str) -> dict:
    try:
        return json.loads(text, object_pairs_hook=_reject_duplicate_json_members)
    except CheckerViolation:
        raise
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise CheckerViolation("SNAPSHOT_CONTENT_INVALID_JSON", f"snapshot_content is not valid JSON: {exc}") from exc


def _parse_snapshot_content(encoded: str) -> bytes:
    """Strictly decode `snapshot_content` and validate it is valid JSON.

    Returns the exact decoded bytes (before any JSON round-trip) so
    `snapshotHashHex` is always recomputed over the raw decoded bytes, never a
    re-serialized object. A UTF-8 BOM is rejected here because it is not part
    of the raw JSON bytes the writer emits.
    """
    decoded = _decode_base64url_strict(encoded)
    if decoded[:3] == b"\xef\xbb\xbf":
        raise CheckerViolation("SNAPSHOT_CONTENT_NON_CANONICAL_BASE64URL", "snapshot_content must not carry a UTF-8 BOM")
    try:
        text = decoded.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise CheckerViolation("SNAPSHOT_CONTENT_INVALID_JSON", f"snapshot_content is not valid UTF-8: {exc}") from exc
    _parse_json_strict(text)
    return decoded


def _parse_rfc3339_utc_instant(value: object, *, field_name: str) -> datetime:
    if not isinstance(value, str) or not RFC3339_UTC_RE.match(value):
        raise CheckerViolation("TIMESTAMP_NOT_RFC3339_UTC", f"field '{field_name}' is not an RFC3339 UTC timestamp ('{value}')")
    normalized = value[:-1] + "+00:00" if value.endswith(("Z", "z")) else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise CheckerViolation("TIMESTAMP_NOT_RFC3339_UTC", f"field '{field_name}' failed RFC3339 parse: {exc}") from exc
    if parsed.tzinfo is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise CheckerViolation("TIMESTAMP_NOT_RFC3339_UTC", f"field '{field_name}' is not UTC")
    return parsed.astimezone(timezone.utc)


def _require_non_empty_string(value: object, *, field_name: str) -> None:
    if not isinstance(value, str) or not value:
        raise CheckerViolation("ENTRY_FIELD_INVALID", f"field '{field_name}' must be a non-empty string")


def _parse_log_records(log_text: str) -> list[dict]:
    """Parse a JSONL log into a list of records.

    Rejects any leading/interior blank or whitespace-only line; a single
    optional terminal newline is framing, not an extra line. Also rejects any
    line that is not a JSON object with duplicate members.
    """
    records: list[dict] = []
    for line_number, raw in enumerate(log_text.splitlines(), start=1):
        if not raw.strip():
            raise CheckerViolation(
                "LOG_BLANK_LINE",
                f"line {line_number} is blank or whitespace-only; JSONL requires one object per line",
            )
        try:
            parsed = json.loads(raw, object_pairs_hook=_reject_duplicate_json_members)
        except CheckerViolation:
            raise
        except json.JSONDecodeError as exc:
            raise CheckerViolation("LOG_LINE_NOT_JSON", f"line {line_number} is not valid JSON: {exc}") from exc
        if not isinstance(parsed, dict):
            raise CheckerViolation("LOG_LINE_NOT_OBJECT", f"line {line_number} is not a JSON object")
        records.append(parsed)
    return records


def _validate_entry_fields(record: dict) -> None:
    missing = [f for f in OBSERVATION_ENTRY_FIELDS if f not in record]
    if missing:
        raise CheckerViolation("ENTRY_FIELD_MISSING", f"missing required field(s): {', '.join(missing)}")
    extra = [k for k in record if k not in OBSERVATION_ENTRY_FIELDS]
    if extra:
        raise CheckerViolation("ENTRY_EXTRA_FIELD", f"unexpected field(s) not on the closed list: {', '.join(sorted(extra))}")


def _validate_observer_identity(observer: object, *, registry_writer_sid: str | None, expected_observer: str | None) -> None:
    _require_non_empty_string(observer, field_name="observerIdentity")
    if observer in FORBIDDEN_OBSERVER_SIDS:
        raise CheckerViolation(
            "OBSERVER_FORBIDDEN_IDENTITY",
            f"observerIdentity '{observer}' is a forbidden identity (Party A, Activation Approver, or Local)",
        )
    if expected_observer is not None and observer != expected_observer:
        raise CheckerViolation(
            "OBSERVER_EXPECTED_MISMATCH",
            f"observerIdentity '{observer}' does not equal expected observer '{expected_observer}'",
        )
    if registry_writer_sid is not None and observer == registry_writer_sid:
        raise CheckerViolation(
            "OBSERVER_WRITER_COLLISION",
            f"observerIdentity '{observer}' collides with the selected registry writer SID",
        )


def validate_entry(
    record: dict,
    *,
    expected_prior_hash: str | None,
    seen_snapshot_ids: set[str],
    seen_snapshot_content: dict[str, tuple[str, str]],
    expected_observer: str | None = None,
    registry_writer_sid: str | None = None,
    now: datetime | None = None,
    freshness_seconds: int | None = None,
) -> str:
    """Validate one observation-log entry's closed preimage and recompute its
    `entryHashHex`. Returns the verified digest.

    `expected_prior_hash` is the actual prior entry's `entryHashHex`, or `None`
    for the genesis entry (whose `priorEntryHashHex` must be JSON null).
    `seen_snapshot_ids`/`seen_snapshot_content` are the caller's running sets
    across the whole log, so a duplicate `snapshotId` or a reused ID with
    changed content is rejected before append anywhere in the log.
    """

    _validate_entry_fields(record)

    snapshot_id = record["snapshotId"]
    _require_non_empty_string(snapshot_id, field_name="snapshotId")

    registry_name = record["registryName"]
    if registry_name not in ALLOWED_REGISTRY_NAMES:
        raise CheckerViolation(
            "REGISTRY_NAME_INVALID",
            f"registryName '{registry_name}' is not one of {ALLOWED_REGISTRY_NAMES}",
        )

    version = record["registrySnapshotVersion"]
    if not isinstance(version, int) or isinstance(version, bool) or version < 1:
        raise CheckerViolation(
            "REGISTRY_SNAPSHOT_VERSION_INVALID",
            "registrySnapshotVersion must be a positive integer",
        )

    snapshot_content = record["snapshot_content"]
    if not isinstance(snapshot_content, str):
        raise CheckerViolation("SNAPSHOT_CONTENT_UNDECODABLE", "snapshot_content must be a string")
    decoded_bytes = _parse_snapshot_content(snapshot_content)
    parsed_snapshot = _parse_json_strict(decoded_bytes.decode("utf-8"))

    # T2F schema: `registrySnapshotVersion` must equal the parsed snapshot
    # value and be a positive integer.
    parsed_version = parsed_snapshot.get("registrySnapshotVersion") if isinstance(parsed_snapshot, dict) else None
    if not isinstance(parsed_version, int) or isinstance(parsed_version, bool) or parsed_version < 1:
        raise CheckerViolation(
            "SNAPSHOT_VERSION_MISMATCH",
            "decoded snapshot_content must carry a positive-integer registrySnapshotVersion",
        )
    if parsed_version != version:
        raise CheckerViolation(
            "SNAPSHOT_VERSION_MISMATCH",
            f"registrySnapshotVersion '{version}' does not equal parsed snapshot value '{parsed_version}'",
        )

    snapshot_hash = record["snapshotHashHex"]
    if not isinstance(snapshot_hash, str) or not HEX64_RE.match(snapshot_hash):
        raise CheckerViolation(
            "SNAPSHOT_HASH_SHAPE_INVALID",
            "snapshotHashHex is not exactly 64 lowercase hex characters",
        )
    recomputed_snapshot_hash = _sha256_hex(decoded_bytes)
    if recomputed_snapshot_hash != snapshot_hash:
        raise CheckerViolation(
            "SNAPSHOT_HASH_MISMATCH",
            f"recomputed snapshotHashHex '{recomputed_snapshot_hash}' does not match stored '{snapshot_hash}'",
        )

    observed_at = record["observedAt"]
    parsed_observed_at = _parse_rfc3339_utc_instant(observed_at, field_name="observedAt")
    if freshness_seconds is not None and now is not None:
        age = (now - parsed_observed_at).total_seconds()
        if age > freshness_seconds:
            raise CheckerViolation(
                "SNAPSHOT_STALE",
                f"observedAt '{observed_at}' is stale by {int(age)}s beyond freshness {freshness_seconds}s",
            )

    authority = record["authority"]
    _require_non_empty_string(authority, field_name="authority")

    observer_identity = record["observerIdentity"]
    _validate_observer_identity(
        observer_identity,
        registry_writer_sid=registry_writer_sid,
        expected_observer=expected_observer,
    )

    prior_hash = record["priorEntryHashHex"]
    if expected_prior_hash is None:
        if prior_hash is not None:
            raise CheckerViolation(
                "GENESIS_PRIOR_HASH_NOT_NULL",
                "genesis entry must have priorEntryHashHex == null",
            )
    else:
        if prior_hash != expected_prior_hash:
            raise CheckerViolation(
                "CHAIN_BROKEN",
                f"priorEntryHashHex '{prior_hash}' does not match actual prior entryHashHex '{expected_prior_hash}'",
            )

    stored_digest = record[OBSERVATION_ENTRY_STORED_DIGEST]
    if not isinstance(stored_digest, str) or not HEX64_RE.match(stored_digest):
        raise CheckerViolation(
            "ENTRY_DIGEST_SHAPE_INVALID",
            "entryHashHex is not exactly 64 lowercase hex characters",
        )

    # Immutable snapshot identity: exactly one original observation per ID.
    if snapshot_id in seen_snapshot_ids:
        raise CheckerViolation(
            "DUPLICATE_SNAPSHOT_ID",
            f"snapshotId '{snapshot_id}' already appears earlier in the log; a snapshotId is write-once",
        )
    content_key = (snapshot_hash, observed_at)
    if snapshot_id in seen_snapshot_content and seen_snapshot_content[snapshot_id] != content_key:
        raise CheckerViolation(
            "DUPLICATE_SNAPSHOT_ID",
            f"snapshotId '{snapshot_id}' is reused with changed content/hash",
        )
    seen_snapshot_ids.add(snapshot_id)
    seen_snapshot_content[snapshot_id] = content_key

    preimage = {
        "profile": CANON_PROFILE,
        "domain": OBSERVATION_ENTRY_DOMAIN,
        "snapshotId": snapshot_id,
        "registryName": registry_name,
        "registrySnapshotVersion": version,
        "snapshotHashHex": snapshot_hash,
        "observedAt": observed_at,
        "authority": authority,
        "observerIdentity": observer_identity,
        "priorEntryHashHex": prior_hash,
    }
    if preimage["profile"] != CANON_PROFILE:
        raise CheckerViolation("ENTRY_PROFILE_DRIFT", "profile literal does not match canonicalization profile")

    recomputed_digest = _sha256_hex(_canonical_json_bytes(preimage))
    if recomputed_digest != stored_digest:
        raise CheckerViolation(
            "ENTRY_DIGEST_MISMATCH",
            f"recomputed entryHashHex '{recomputed_digest}' does not match stored '{stored_digest}'",
        )
    return recomputed_digest


def validate_log(
    records: list[dict],
    *,
    expected_observer: str | None = None,
    registry_writer_sid: str | None = None,
    now: datetime | None = None,
    freshness_seconds: int | None = None,
) -> CheckResult:
    """Validate an entire observation log from genesis to the last entry."""
    if not records:
        raise CheckerViolation("LOG_EMPTY", "observation log contains no entries")

    seen_snapshot_ids: set[str] = set()
    seen_snapshot_content: dict[str, tuple[str, str]] = {}
    prior_hash: str | None = None
    genesis_hash: str = ""
    last_hash: str = ""

    for record in records:
        digest = validate_entry(
            record,
            expected_prior_hash=prior_hash,
            seen_snapshot_ids=seen_snapshot_ids,
            seen_snapshot_content=seen_snapshot_content,
            expected_observer=expected_observer,
            registry_writer_sid=registry_writer_sid,
            now=now,
            freshness_seconds=freshness_seconds,
        )
        if genesis_hash == "":
            genesis_hash = digest
        last_hash = digest
        prior_hash = digest

    return CheckResult(
        ok=True,
        entry_count=len(records),
        genesis_entry_hash_hex=genesis_hash,
        last_entry_hash_hex=last_hash,
        snapshot_ids=tuple(sorted(seen_snapshot_ids)),
    )


def count_observations_for(records: list[dict], snapshot_id: str) -> int:
    """Literal per-ID record count (T2G-04): always 0/1 under a correct
    write-time uniqueness guarantee, >1 only in a bypassed-duplicate fault."""
    return sum(1 for r in records if r.get("snapshotId") == snapshot_id)


def lookup(records: list[dict], snapshot_id: str) -> dict | None:
    """Literal lookup: the sole record bearing the ID, or None."""
    matches = [r for r in records if r.get("snapshotId") == snapshot_id]
    return matches[0] if len(matches) == 1 else None


def _emit_report(result: CheckResult) -> str:
    payload = {
        "schemaVersion": "cvf.registryObservationLogCheck.v1",
        "result": "PASS" if result.ok else "REJECT",
        "entryCount": result.entry_count,
        "genesisEntryHashHex": result.genesis_entry_hash_hex,
        "lastEntryHashHex": result.last_entry_hash_hex,
        "snapshotIds": list(result.snapshot_ids),
        "violations": [v.as_dict() for v in result.violations],
    }
    return json.dumps(payload, sort_keys=True, separators=(",", ":"))


def _read_log(log_path: str) -> str:
    full = Path(log_path)
    if not full.is_file():
        raise CheckerViolation("LOG_UNREACHABLE", f"observation log not reachable at '{log_path}'")
    try:
        return full.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        raise CheckerViolation("LOG_UNREADABLE", f"could not read observation log: {exc}") from exc


def _run_self_test() -> int:
    """Hermetic self-test against disposable in-memory fixtures only."""
    import tempfile

    print("check_acel_g1_registry_observation_log hermetic self-test")
    failures: list[str] = []

    # Published 29-byte vector (T2G-05).
    encoded = base64.urlsafe_b64encode(PUBLISHED_29_BYTE_PREIMAGE.encode("utf-8")).rstrip(b"=").decode("ascii")
    if encoded != PUBLISHED_29_BYTE_BASE64URL:
        failures.append("published 29-byte base64url does not match")
    if _sha256_hex(PUBLISHED_29_BYTE_PREIMAGE.encode("utf-8")) != PUBLISHED_29_BYTE_SHA256:
        failures.append("published 29-byte sha256 does not match")
    try:
        _decode_base64url_strict(PUBLISHED_29_BYTE_BASE64URL + "=")
        failures.append("padded 29-byte mutation was accepted")
    except CheckerViolation:
        pass

    # A minimal genesis entry round-trips through full validation.
    with tempfile.TemporaryDirectory() as tmp:
        snapshot_bytes = b'{"registrySnapshotVersion":1}'
        snapshot_content = base64.urlsafe_b64encode(snapshot_bytes).rstrip(b"=").decode("ascii")
        snapshot_hash = _sha256_hex(snapshot_bytes)
        preimage = {
            "profile": CANON_PROFILE,
            "domain": OBSERVATION_ENTRY_DOMAIN,
            "snapshotId": "snap-self-test-0001",
            "registryName": "verifier_key_registry",
            "registrySnapshotVersion": 1,
            "snapshotHashHex": snapshot_hash,
            "observedAt": "2026-09-21T00:00:00Z",
            "authority": "ACEL_G1_DECISION_OWNER",
            "observerIdentity": VERIFIED_PARTY_B_SID,
            "priorEntryHashHex": None,
        }
        entry_hash = _sha256_hex(_canonical_json_bytes(preimage))
        record = {
            "snapshotId": "snap-self-test-0001",
            "registryName": "verifier_key_registry",
            "registrySnapshotVersion": 1,
            "snapshot_content": snapshot_content,
            "snapshotHashHex": snapshot_hash,
            "observedAt": "2026-09-21T00:00:00Z",
            "authority": "ACEL_G1_DECISION_OWNER",
            "observerIdentity": VERIFIED_PARTY_B_SID,
            "priorEntryHashHex": None,
            "entryHashHex": entry_hash,
        }
        log_path = Path(tmp) / "LOG.jsonl"
        log_path.write_text(json.dumps(record, sort_keys=True, separators=(",", ":")) + "\n", encoding="utf-8")
        result = validate_log([record])
        if not result.ok or result.entry_count != 1:
            failures.append("genesis self-test entry did not validate")

    if failures:
        for failure in failures:
            print(f"  FAIL: {failure}")
        return 1
    print("  PASS: published 29-byte vector and genesis entry validated")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Read-only Group 3 observation-log verifier."
    )
    parser.add_argument("--log", help="Path to the observation log (JSONL).")
    parser.add_argument("--expected-observer", help="Exact expected observer SID (real mode: Party B SID).")
    parser.add_argument("--registry-writer-sid", help="Registry writer SID for observer/writer separation check.")
    parser.add_argument("--now", help="Current RFC3339 UTC time for freshness checks.")
    parser.add_argument("--freshness", type=int, help="Freshness threshold in seconds.")
    parser.add_argument("--count", dest="count_id", help="Read-only count of records for a snapshotId (0/1/>1).")
    parser.add_argument("--lookup", dest="lookup_id", help="Read-only lookup of the sole record for a snapshotId.")
    parser.add_argument("--self-test", action="store_true", help="Run a hermetic disposable self-test.")
    args = parser.parse_args(argv)

    if args.self_test:
        return _run_self_test()

    if args.count_id is not None or args.lookup_id is not None:
        if not args.log:
            print(json.dumps({"schemaVersion": "cvf.registryObservationLogCheck.v1", "result": "REJECT",
                              "violations": [{"taxonomyId": "LOG_UNREACHABLE", "message": "--log is required"}]},
                             sort_keys=True, separators=(",", ":")))
            return 1
        records = _parse_log_records(_read_log(args.log))
        if args.count_id is not None:
            payload = {"schemaVersion": "cvf.registryObservationLogCheck.v1", "snapshotId": args.count_id,
                       "count": count_observations_for(records, args.count_id)}
            print(json.dumps(payload, sort_keys=True, separators=(",", ":")))
            return 0
        if args.lookup_id is not None:
            found = lookup(records, args.lookup_id)
            payload = {"schemaVersion": "cvf.registryObservationLogCheck.v1", "snapshotId": args.lookup_id,
                       "count": count_observations_for(records, args.lookup_id), "record": found}
            print(json.dumps(payload, sort_keys=True, separators=(",", ":")))
            return 0

    if not args.log:
        parser.error("--log is required unless --self-test, --count, or --lookup is given")

    now: datetime | None = None
    if args.now is not None:
        now = _parse_rfc3339_utc_instant(args.now, field_name="--now")

    violations: list[Violation] = []
    result = CheckResult(ok=False)
    try:
        records = _parse_log_records(_read_log(args.log))
        result = validate_log(
            records,
            expected_observer=args.expected_observer,
            registry_writer_sid=args.registry_writer_sid,
            now=now,
            freshness_seconds=args.freshness,
        )
    except CheckerViolation as exc:
        violations.append(Violation(exc.taxonomy_id, str(exc)))

    if violations:
        result = CheckResult(ok=False, violations=tuple(violations), entry_count=result.entry_count)
        print(_emit_report(result))
        return 1

    print(_emit_report(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
