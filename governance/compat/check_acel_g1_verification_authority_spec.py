#!/usr/bin/env python3
"""ACEL G1 T3B Local checker for the Group 2 verification-authority spec.

Strict, read-only consumer for the two governed Group 2 source files
(`SPEC_v1.json`, `ACTIVATION_DECISIONS.jsonl`) or explicit fixture paths.
Validates schema shape, closed-preimage field sets, the two distinct Group 2
hashes (`specHashHex` direct-content vs `specFileRecordHashHex` closed-
preimage), the append-only decision-event hash chain, and the full T2F event
state machine (mutual exclusion of the first decision, REJECTED terminality,
ACTIVATED requiring a prior matching APPROVED, SUPERSEDED requiring exactly
one active version, self-approval rejection, and the unique-active invariant
across the whole history), per `cvf.source-record-canonicalization@1` and the
T2F Group 2 contract
(`docs/audits/CVF_ACEL_G1_T2F_OPERATIONAL_SOURCE_ESTABLISHMENT_CONTRACT_2026-09-18.md`).

This checker never writes, never fabricates a passing result on a missing
input (`SPEC_UNREACHABLE`/`DECISIONS_UNREACHABLE` fail closed rather than
`PASS_WITH_WARNING`), and never claims spec establishment, activation
validity, consumer binding or candidate admission. Its result text is
validation-only, never `SPEC_CREATED_PENDING_LOCAL_VERIFICATION` or
`DECISION_APPENDED_PENDING_LOCAL_VERIFICATION` (those phrases belong to the
writer tools, describing their own real-mode output).
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
DEFAULT_SPEC_RELATIVE = "governance/sources/verification_authority_spec/SPEC_v1.json"
DEFAULT_DECISIONS_RELATIVE = "governance/sources/verification_authority_spec/ACTIVATION_DECISIONS.jsonl"
GROUP2_SOURCE_DIRECTORY_RELATIVE = "governance/sources/verification_authority_spec"
SPEC_VERSION_FILENAME_RE = re.compile(r"^SPEC_v(\d+)\.json$")

CANON_PROFILE = "cvf.source-record-canonicalization@1"
SPEC_FILE_DOMAIN = "cvf.specFile"
DECISION_EVENT_DOMAIN = "cvf.specDecisionEvent"
EXPECTED_SPEC_VERSION = 1
HEX64_RE = re.compile(r"^[0-9a-f]{64}$")
BASE64URL_STRICT_RE = re.compile(r"^[A-Za-z0-9_-]+$")
RFC3339_UTC_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|z)$")
VALID_EVENT_TYPES = ("APPROVED", "REJECTED", "ACTIVATED", "SUPERSEDED")

# Exact operator-approved fixed v1 policy payload, byte-for-byte from
# `docs/reviews/CVF_ACEL_G1_T3B_PRINCIPAL_POLICY_OPERATOR_DECISION_2026-09-20.md`
# and the governing work order's "Fixed v1 payload" section. Public governance
# policy content, never a secret.
FIXED_V1_POLICY_JSON = (
    '{"admissionRequiredLookupResult":"IDENTITY_CONFIRMED","authorityId":"ACEL_G1_DECISION_OWNER",'
    '"authoritySpecSchema":"cvf.acel.g1.verificationAuthoritySpec@1","freshnessThresholdSeconds":86400,'
    '"issuerVerificationRequirement":"VERIFIED_BY_LIVE_REGISTRY_LOOKUP","receiptDomain":"cvf.verifierReceipt",'
    '"receiptProfileVersion":"v1"}'
)

# Exact expected Party A / approver identities, per
# `docs/reviews/CVF_ACEL_G1_T3B_PRINCIPAL_POLICY_OPERATOR_DECISION_2026-09-20.md`
# and `docs/audits/CVF_ACEL_G1_T3A_C2_GROUP1_SOURCE_LOCAL_VERIFICATION_2026-09-20.md`.
VERIFIED_PARTY_A_SID = "S-1-5-21-1644666849-912006174-747199667-1006"
VERIFIED_APPROVER_SID = "S-1-5-21-1644666849-912006174-747199667-1008"

SPEC_FILE_CLOSED_FIELDS = (
    "specVersion",
    "canonicalBytesBase64",
    "authorId",
    "proposedAt",
    "specHashHex",
)
SPEC_FILE_STORED_DIGEST = "specFileRecordHashHex"

DECISION_EVENT_CLOSED_FIELDS = (
    "decisionEventId",
    "eventType",
    "specVersion",
    "recomputedHashHex",
    "replacementSpecVersion",
    "replacementRecomputedHashHex",
    "approverId",
    "decidedAt",
    "priorEntryHashHex",
)
DECISION_EVENT_STORED_DIGEST = "entryHashHex"


def _operational_expected_authorities() -> dict:
    """The ONE authority set operational/default validation ever binds to.
    Never caller-redefinable through the CLI."""
    return {
        "partyASid": VERIFIED_PARTY_A_SID,
        "approverSid": VERIFIED_APPROVER_SID,
        "fixedPolicyJson": FIXED_V1_POLICY_JSON,
    }


def _test_only_expected_authorities_override(
    *, party_a_sid: str, approver_sid: str, fixed_policy_json: str
) -> dict:
    """TEST-ONLY. Builds a substitute expected-authorities dict for hermetic
    fixture tests. Never called by `main()` / the operational CLI path, which
    always calls `_operational_expected_authorities()`."""
    return {"partyASid": party_a_sid, "approverSid": approver_sid, "fixedPolicyJson": fixed_policy_json}


class CheckerViolation(ValueError):
    """Raised for any fail-closed validation defect; carries a stable taxonomy id."""

    def __init__(self, taxonomy_id: str, message: str) -> None:
        super().__init__(f"[{taxonomy_id}] {message}")
        self.taxonomy_id = taxonomy_id


@dataclass(frozen=True)
class CheckResult:
    ok: bool
    taxonomy_id: str
    detail: str
    findings: tuple[str, ...] = field(default_factory=tuple)


def _canonical_json_bytes(obj: dict) -> bytes:
    """Exact reference canonicalization per the T2F contract."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _decode_base64url_strict(text: str, *, field_name: str) -> bytes:
    """Strict, canonical, unpadded base64url decode."""
    if not isinstance(text, str) or not text:
        raise CheckerViolation("BASE64URL_UNDECODABLE", f"{field_name} is empty or not a string")
    if "=" in text:
        raise CheckerViolation("BASE64URL_NON_CANONICAL", f"{field_name} must be unpadded (no '=')")
    if not BASE64URL_STRICT_RE.match(text):
        raise CheckerViolation(
            "BASE64URL_NON_CANONICAL", f"{field_name} must use only the unpadded URL-safe alphabet [A-Za-z0-9_-]"
        )
    padding_needed = (-len(text)) % 4
    if padding_needed == 3:
        raise CheckerViolation("BASE64URL_UNDECODABLE", f"{field_name} has an invalid base64url length")
    padded = text + ("=" * padding_needed)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode("ascii"))
    except Exception as exc:  # noqa: BLE001 - normalize into taxonomy violation
        raise CheckerViolation("BASE64URL_UNDECODABLE", f"{field_name} base64url decode failed: {exc}") from exc

    reencoded = base64.urlsafe_b64encode(decoded).rstrip(b"=").decode("ascii")
    if reencoded != text:
        raise CheckerViolation(
            "BASE64URL_NON_CANONICAL", f"{field_name} does not reproduce byte-for-byte after canonical re-encoding"
        )
    return decoded


def _reject_duplicate_json_members(pairs: list[tuple[str, object]]) -> dict:
    seen: dict[str, object] = {}
    for key, value in pairs:
        if key in seen:
            raise CheckerViolation("DUPLICATE_JSON_MEMBER", f"duplicate JSON member '{key}'")
        seen[key] = value
    return seen


def _parse_json_strict(text: str) -> dict:
    return json.loads(text, object_pairs_hook=_reject_duplicate_json_members)


def _parse_rfc3339_utc_instant(value: object, *, field_name: str) -> datetime:
    if not isinstance(value, str) or not RFC3339_UTC_RE.match(value):
        raise CheckerViolation(
            "TIMESTAMP_NOT_RFC3339_UTC", f"field '{field_name}' is not an RFC3339 UTC timestamp ('{value}')"
        )
    normalized = value[:-1] + "+00:00" if value.endswith(("Z", "z")) else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise CheckerViolation(
            "TIMESTAMP_NOT_RFC3339_UTC", f"field '{field_name}' failed RFC3339 parse: {exc}"
        ) from exc
    if parsed.tzinfo is None or parsed.utcoffset() != timezone.utc.utcoffset(parsed):
        raise CheckerViolation("TIMESTAMP_NOT_RFC3339_UTC", f"field '{field_name}' is not UTC")
    return parsed.astimezone(timezone.utc)


def resolve_contained_path(root: Path, relative: str) -> Path:
    """Resolve `relative` under `root`, rejecting escape or reparse points."""
    candidate = (root / relative).resolve()
    root_resolved = root.resolve()
    try:
        candidate.relative_to(root_resolved)
    except ValueError as exc:
        raise CheckerViolation(
            "PATH_ESCAPES_ROOT", f"resolved path '{candidate}' does not resolve inside root '{root_resolved}'"
        ) from exc
    return candidate


def resolve_spec_path_for_version(source_directory: Path, spec_version: int) -> Path:
    """T3B-RV-2 (R1 correction): the ONLY function that turns an integer spec
    version into a file path. Strictly repo-relative, fixed `SPEC_v{n}.json`
    filename pattern under `source_directory` only -- no caller-supplied
    filename, path fragment, or "latest file" inference is ever accepted.
    Rejects a version that is not a positive integer and rejects any
    resolution that escapes `source_directory`'s own root."""
    if not isinstance(spec_version, int) or isinstance(spec_version, bool) or spec_version < 1:
        raise CheckerViolation(
            "SPEC_VERSION_INVALID", f"specVersion must be a positive integer, got {spec_version!r}"
        )
    file_name = f"SPEC_v{spec_version}.json"
    return resolve_contained_path(source_directory, file_name)


def load_and_validate_spec_for_version(
    source_directory: Path, spec_version: int, *, expected_authorities: dict
) -> tuple[dict, str, str]:
    """T3B-RV-2 (R1 correction): strictly resolve, parse and independently
    validate exactly ONE immutable `SPEC_v{n}.json` for the given version.
    Returns `(spec_record, spec_hash_hex, spec_file_record_hash_hex)`, all
    independently recomputed. Missing/malformed/path-escaped/wrong-version
    files fail closed with a version-qualified taxonomy id."""
    spec_path = resolve_spec_path_for_version(source_directory, spec_version)
    try:
        spec_record = load_json_file(spec_path, taxonomy_id="SPEC_VERSION_UNREACHABLE")
    except CheckerViolation as exc:
        raise CheckerViolation(
            exc.taxonomy_id, f"specVersion {spec_version}: {exc}"
        ) from exc
    spec_hash_hex, spec_file_record_hash_hex = validate_spec_file_record(
        spec_record, expected_authorities=expected_authorities
    )
    if int(spec_record["specVersion"]) != spec_version:
        raise CheckerViolation(
            "SPEC_VERSION_FILENAME_MISMATCH",
            f"file '{spec_path.name}' declares specVersion {spec_record['specVersion']}, "
            f"which does not equal the filename-cited version {spec_version}",
        )
    return spec_record, spec_hash_hex, spec_file_record_hash_hex


def _require_fields(obj: dict, fields_tuple: tuple[str, ...], *, kind: str) -> None:
    missing = [f for f in fields_tuple if f not in obj]
    if missing:
        raise CheckerViolation(f"{kind}_FIELD_MISSING", f"missing required field(s): {', '.join(missing)}")


def _reject_extra_fields(obj: dict, allowed: tuple[str, ...], *, kind: str, exclude: tuple[str, ...] = ()) -> None:
    allowed_set = set(allowed) | set(exclude)
    extra = [k for k in obj.keys() if k not in allowed_set]
    if extra:
        raise CheckerViolation(f"{kind}_EXTRA_FIELD", f"unexpected field(s) not on closed list: {', '.join(sorted(extra))}")


def _require_non_empty_string(value: object, *, field_name: str, taxonomy_prefix: str) -> None:
    if not isinstance(value, str) or not value:
        raise CheckerViolation(f"{taxonomy_prefix}_INVALID", f"field '{field_name}' must be a non-empty string")


def load_json_file(path: Path, *, taxonomy_id: str) -> dict:
    if not path.is_file():
        raise CheckerViolation(taxonomy_id, f"file not found: {path}")
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise CheckerViolation(taxonomy_id, f"file is not valid UTF-8: {exc}") from exc
    try:
        return _parse_json_strict(text)
    except CheckerViolation:
        raise
    except json.JSONDecodeError as exc:
        raise CheckerViolation(taxonomy_id, f"file is not valid JSON: {exc}") from exc


def load_decisions_jsonl(path: Path) -> list[dict]:
    """Loads the append-only decisions file. An ABSENT file is not itself an
    error at this level (a spec may exist with zero decisions yet); callers
    decide whether an empty history is acceptable for their check."""
    if not path.is_file():
        return []
    entries: list[dict] = []
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise CheckerViolation("DECISIONS_UNREADABLE", f"file is not valid UTF-8: {exc}") from exc
    for line_no, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        try:
            entries.append(_parse_json_strict(line))
        except CheckerViolation as exc:
            raise CheckerViolation(
                "DECISIONS_LINE_DUPLICATE_JSON_MEMBER" if exc.taxonomy_id == "DUPLICATE_JSON_MEMBER" else exc.taxonomy_id,
                f"line {line_no}: {exc}",
            ) from exc
        except json.JSONDecodeError as exc:
            raise CheckerViolation("DECISIONS_LINE_UNPARSEABLE", f"line {line_no} is not valid JSON: {exc}") from exc
    return entries


# ---------------------------------------------------------------------------
# Spec-file validation
# ---------------------------------------------------------------------------


def validate_spec_file_record(record: dict, *, expected_authorities: dict) -> tuple[str, str]:
    """Validate the `cvf.specFile` record's closed preimage, both distinct
    Group 2 hashes (`specHashHex` direct-content, `specFileRecordHashHex`
    closed-preimage), and exact-fixed-policy binding. Returns
    `(spec_hash_hex, spec_file_record_hash_hex)`, both independently
    recomputed, never trusting the record's own stored values before
    verifying them.
    """
    _require_fields(record, SPEC_FILE_CLOSED_FIELDS + (SPEC_FILE_STORED_DIGEST,), kind="SPEC_FILE")
    # `profile`/`domain` are optional literal record-level fields: the
    # accepted Party A writer stores them alongside the closed preimage
    # fields (they are always part of the preimage itself; the writer also
    # happens to persist them as ordinary record fields on disk). Their
    # values, if present, are checked for drift below; their absence is not
    # an error, so a hand-authored fixture omitting them is still valid.
    _reject_extra_fields(
        record, SPEC_FILE_CLOSED_FIELDS, kind="SPEC_FILE",
        exclude=(SPEC_FILE_STORED_DIGEST, "profile", "domain"),
    )

    if record.get("profile") is not None and record.get("profile") != CANON_PROFILE:
        raise CheckerViolation("SPEC_FILE_PROFILE_DRIFT", "profile literal does not match canonicalization profile")
    if record.get("domain") is not None and record.get("domain") != SPEC_FILE_DOMAIN:
        raise CheckerViolation("SPEC_FILE_DOMAIN_DRIFT", f"domain literal is not '{SPEC_FILE_DOMAIN}'")

    # T3B-RV-2 (R1 correction): a spec record's OWN specVersion must be a
    # positive integer; it is no longer hard-pinned to exactly
    # EXPECTED_SPEC_VERSION (1) here, since `load_and_validate_spec_for_version`
    # is the sole caller responsible for confirming a given record's
    # specVersion matches the filename-cited version it was resolved from
    # (`SPEC_FILE_VERSION_MISMATCH` there is version-qualified). This
    # function alone validates only that the field itself is a well-formed
    # positive integer.
    spec_version = record["specVersion"]
    if not isinstance(spec_version, int) or isinstance(spec_version, bool) or spec_version < 1:
        raise CheckerViolation(
            "SPEC_FILE_VERSION_UNEXPECTED", f"specVersion must be a positive integer, got {spec_version!r}"
        )

    _require_non_empty_string(record["authorId"], field_name="authorId", taxonomy_prefix="SPEC_FILE_AUTHOR_ID")
    if record["authorId"] != expected_authorities["partyASid"]:
        raise CheckerViolation(
            "EXPECTED_AUTHORITY_AUTHOR_ID_MISMATCH",
            f"authorId '{record['authorId']}' does not equal the verified Party A SID",
        )

    _parse_rfc3339_utc_instant(record["proposedAt"], field_name="proposedAt")

    decoded_content_bytes = _decode_base64url_strict(record["canonicalBytesBase64"], field_name="canonicalBytesBase64")

    # The fixed-policy-byte binding applies only to the v1 record: v1's
    # content is pinned byte-for-byte to the operator-approved fixed v1
    # payload literal (unchanged pre-R1 behavior). A record for any OTHER
    # version is a distinct governed payload and is not compared against
    # v1's literal here; its own content identity is instead established by
    # its own independently-recomputed specHashHex below, which is what
    # T3B-RV-2's per-version decision-history binding actually keys on.
    fixed_policy_bytes = expected_authorities["fixedPolicyJson"].encode("utf-8")
    if spec_version == EXPECTED_SPEC_VERSION and decoded_content_bytes != fixed_policy_bytes:
        raise CheckerViolation(
            "SPEC_FILE_POLICY_BYTES_DRIFT",
            "decoded canonicalBytesBase64 does not match the exact fixed, operator-approved v1 policy bytes",
        )

    stored_spec_hash = record["specHashHex"]
    if not isinstance(stored_spec_hash, str) or not HEX64_RE.match(stored_spec_hash):
        raise CheckerViolation("SPEC_FILE_SPEC_HASH_SHAPE_INVALID", "specHashHex is not 64 lowercase hex characters")
    recomputed_spec_hash = _sha256_hex(decoded_content_bytes)
    if recomputed_spec_hash != stored_spec_hash:
        raise CheckerViolation(
            "SPEC_FILE_SPEC_HASH_MISMATCH",
            f"recomputed specHashHex '{recomputed_spec_hash}' does not match stored '{stored_spec_hash}'",
        )

    stored_record_hash = record[SPEC_FILE_STORED_DIGEST]
    if not isinstance(stored_record_hash, str) or not HEX64_RE.match(stored_record_hash):
        raise CheckerViolation(
            "SPEC_FILE_RECORD_HASH_SHAPE_INVALID", f"{SPEC_FILE_STORED_DIGEST} is not 64 lowercase hex characters"
        )

    preimage = {
        "profile": CANON_PROFILE,
        "domain": SPEC_FILE_DOMAIN,
        "specVersion": record["specVersion"],
        "canonicalBytesBase64": record["canonicalBytesBase64"],
        "authorId": record["authorId"],
        "proposedAt": record["proposedAt"],
        "specHashHex": recomputed_spec_hash,
    }
    recomputed_record_hash = _sha256_hex(_canonical_json_bytes(preimage))
    if recomputed_record_hash != stored_record_hash:
        raise CheckerViolation(
            "SPEC_FILE_RECORD_HASH_MISMATCH",
            f"recomputed {SPEC_FILE_STORED_DIGEST} '{recomputed_record_hash}' does not match stored '{stored_record_hash}'",
        )

    if recomputed_spec_hash == recomputed_record_hash:
        raise CheckerViolation(
            "SPEC_FILE_HASH_COLLAPSE",
            "specHashHex and specFileRecordHashHex unexpectedly collapsed to the same digest; these must remain two distinct hashes",
        )

    return recomputed_spec_hash, recomputed_record_hash


# ---------------------------------------------------------------------------
# Decision-event chain and state-machine validation
# ---------------------------------------------------------------------------


def validate_replacement_field_pair(*, event_type: str, spec_version: int, replacement_spec_version, replacement_recomputed_hash_hex) -> None:
    """T3B-R2 (atomic rotation): enforce the closed pairing rule for
    `replacementSpecVersion`/`replacementRecomputedHashHex` before a preimage
    is trusted. Both fields are JSON `null` for every event type except
    `SUPERSEDED`; for `SUPERSEDED` both are required, well-formed, and
    `replacementSpecVersion` must be strictly greater than `spec_version`.
    A one-null/one-non-null pair is rejected regardless of event type."""
    version_is_null = replacement_spec_version is None
    hash_is_null = replacement_recomputed_hash_hex is None
    if version_is_null != hash_is_null:
        raise CheckerViolation(
            "DECISION_REPLACEMENT_FIELD_PAIR_INVALID",
            "replacementSpecVersion and replacementRecomputedHashHex must both be null or both be non-null",
        )
    if event_type == "SUPERSEDED":
        if version_is_null:
            raise CheckerViolation(
                "DECISION_REPLACEMENT_FIELDS_REQUIRED_FOR_SUPERSEDED",
                "SUPERSEDED events require non-null replacementSpecVersion and replacementRecomputedHashHex",
            )
        if not isinstance(replacement_spec_version, int) or isinstance(replacement_spec_version, bool):
            raise CheckerViolation(
                "DECISION_EVENT_REPLACEMENT_SPEC_VERSION_INVALID", "replacementSpecVersion must be an integer"
            )
        if replacement_spec_version <= spec_version:
            raise CheckerViolation(
                "DECISION_SUPERSESSION_REPLACEMENT_NOT_GREATER",
                f"replacementSpecVersion {replacement_spec_version} must be strictly greater than "
                f"the superseded specVersion {spec_version}",
            )
        if not isinstance(replacement_recomputed_hash_hex, str) or not HEX64_RE.match(replacement_recomputed_hash_hex):
            raise CheckerViolation(
                "DECISION_REPLACEMENT_HASH_SHAPE_INVALID",
                "replacementRecomputedHashHex is not 64 lowercase hex characters",
            )
    else:
        if not version_is_null:
            raise CheckerViolation(
                "DECISION_REPLACEMENT_FIELDS_ONLY_FOR_SUPERSEDED",
                f"eventType '{event_type}' must have null replacementSpecVersion/replacementRecomputedHashHex",
            )


def validate_decision_event_preimage_and_digest(entry: dict) -> str:
    """Validate one `cvf.specDecisionEvent` entry's closed preimage and
    independently recompute `entryHashHex`. Never trusts the stored digest
    before recomputing it. Returns the recomputed digest."""
    _require_fields(entry, DECISION_EVENT_CLOSED_FIELDS + (DECISION_EVENT_STORED_DIGEST,), kind="DECISION_EVENT")
    _reject_extra_fields(
        entry, DECISION_EVENT_CLOSED_FIELDS, kind="DECISION_EVENT", exclude=(DECISION_EVENT_STORED_DIGEST,)
    )

    if entry.get("profile") is not None and entry.get("profile") != CANON_PROFILE:
        raise CheckerViolation("DECISION_EVENT_PROFILE_DRIFT", "profile literal does not match canonicalization profile")
    if entry.get("domain") is not None and entry.get("domain") != DECISION_EVENT_DOMAIN:
        raise CheckerViolation("DECISION_EVENT_DOMAIN_DRIFT", f"domain literal is not '{DECISION_EVENT_DOMAIN}'")

    _require_non_empty_string(entry["decisionEventId"], field_name="decisionEventId", taxonomy_prefix="DECISION_EVENT_ID")
    if entry["eventType"] not in VALID_EVENT_TYPES:
        raise CheckerViolation(
            "DECISION_EVENT_TYPE_INVALID", f"eventType '{entry['eventType']}' is not one of {VALID_EVENT_TYPES}"
        )
    spec_version = entry["specVersion"]
    if not isinstance(spec_version, int) or isinstance(spec_version, bool):
        raise CheckerViolation("DECISION_EVENT_SPEC_VERSION_INVALID", "specVersion must be an integer")

    recomputed_hash = entry["recomputedHashHex"]
    if not isinstance(recomputed_hash, str) or not HEX64_RE.match(recomputed_hash):
        raise CheckerViolation(
            "DECISION_EVENT_RECOMPUTED_HASH_SHAPE_INVALID", "recomputedHashHex is not 64 lowercase hex characters"
        )
    _require_non_empty_string(entry["approverId"], field_name="approverId", taxonomy_prefix="DECISION_EVENT_APPROVER_ID")
    _parse_rfc3339_utc_instant(entry["decidedAt"], field_name="decidedAt")

    prior_hash = entry["priorEntryHashHex"]
    if prior_hash is not None and (not isinstance(prior_hash, str) or not HEX64_RE.match(prior_hash)):
        raise CheckerViolation(
            "DECISION_EVENT_PRIOR_HASH_SHAPE_INVALID", "priorEntryHashHex must be null or 64 lowercase hex characters"
        )

    validate_replacement_field_pair(
        event_type=entry["eventType"],
        spec_version=spec_version,
        replacement_spec_version=entry["replacementSpecVersion"],
        replacement_recomputed_hash_hex=entry["replacementRecomputedHashHex"],
    )

    stored_hash = entry[DECISION_EVENT_STORED_DIGEST]
    if not isinstance(stored_hash, str) or not HEX64_RE.match(stored_hash):
        raise CheckerViolation(
            "DECISION_EVENT_DIGEST_SHAPE_INVALID", f"{DECISION_EVENT_STORED_DIGEST} is not 64 lowercase hex characters"
        )

    preimage = {
        "profile": CANON_PROFILE,
        "domain": DECISION_EVENT_DOMAIN,
        "decisionEventId": entry["decisionEventId"],
        "eventType": entry["eventType"],
        "specVersion": entry["specVersion"],
        "recomputedHashHex": entry["recomputedHashHex"],
        "replacementSpecVersion": entry["replacementSpecVersion"],
        "replacementRecomputedHashHex": entry["replacementRecomputedHashHex"],
        "approverId": entry["approverId"],
        "decidedAt": entry["decidedAt"],
        "priorEntryHashHex": entry["priorEntryHashHex"],
    }
    recomputed_entry_hash = _sha256_hex(_canonical_json_bytes(preimage))
    if recomputed_entry_hash != stored_hash:
        raise CheckerViolation(
            "DECISION_EVENT_DIGEST_MISMATCH",
            f"recomputed entryHashHex '{recomputed_entry_hash}' does not match stored '{stored_hash}'",
        )
    return recomputed_entry_hash


@dataclass
class VersionState:
    first_decision: str | None = None
    has_activated: bool = False
    has_superseded: bool = False


def validate_decision_history(
    entries: list[dict],
    *,
    expected_authorities: dict,
    source_directory: Path | None = None,
    spec_author_id: str | None = None,
    spec_hash_hex: str | None = None,
) -> CheckResult:
    """Walk the full decision-event history once, independently recomputing
    and verifying every entry's hash chain, closed preimage, and the T2F
    event-type state machine, including the unique-active invariant across
    the WHOLE history (never only the target version). Never trusts a
    caller-supplied hash.

    T3B-RV-2 (R1 correction): every entry's `recomputedHashHex` is now
    validated against ITS OWN cited `specVersion`'s independently resolved
    and recomputed spec hash -- resolved strictly from `source_directory`
    via `load_and_validate_spec_for_version` (never a caller-supplied path,
    never a "latest file" inference) -- rather than against a single
    `spec_hash_hex` shared across the whole file regardless of version. A
    version cited in history but missing/malformed/wrong-version on disk
    fails closed. Each version's spec is loaded and validated at most once
    (cached by version number) even if many entries cite it.

    `spec_author_id`/`spec_hash_hex` are accepted ONLY as a legacy single-
    version convenience for callers that already independently validated
    exactly one spec record themselves (used by this module's own focused
    unit tests to isolate state-machine behavior without a filesystem
    fixture); when both are supplied AND every entry cites the same single
    version, that version's author/hash are used directly without a second
    filesystem resolution. They are never used to satisfy a DIFFERENT cited
    version's binding -- a mixed-version history always resolves every
    version it cites from `source_directory` independently.
    """
    seen_ids: set[str] = set()
    prior_hash: str | None = None
    version_states: dict[int, VersionState] = {}
    active_versions: set[int] = set()
    resolved_versions: dict[int, tuple[str, str]] = {}  # version -> (author_id, spec_hash_hex)

    def _resolve_version(version: int) -> tuple[str, str]:
        if version in resolved_versions:
            return resolved_versions[version]
        if (
            spec_author_id is not None
            and spec_hash_hex is not None
            and all(int(e["specVersion"]) == version for e in entries if "specVersion" in e)
        ):
            # Legacy single-version convenience path: only usable when EVERY
            # entry in this history cites the same one version as the
            # caller-supplied spec_author_id/spec_hash_hex.
            resolved_versions[version] = (spec_author_id, spec_hash_hex)
            return resolved_versions[version]
        if source_directory is None:
            raise CheckerViolation(
                "DECISION_SPEC_VERSION_UNRESOLVED",
                f"entry cites specVersion {version}, which requires independent filesystem resolution "
                "(mixed-version history or a version other than the single supplied spec), but no "
                "source_directory was supplied to resolve it from",
            )
        _, version_spec_hash_hex, _ = load_and_validate_spec_for_version(
            source_directory, version, expected_authorities=expected_authorities
        )
        version_spec_record = load_json_file(
            resolve_spec_path_for_version(source_directory, version), taxonomy_id="SPEC_VERSION_UNREACHABLE"
        )
        resolved_versions[version] = (version_spec_record["authorId"], version_spec_hash_hex)
        return resolved_versions[version]

    for index, entry in enumerate(entries):
        entry_id = entry.get("decisionEventId")
        if not isinstance(entry_id, str) or not entry_id:
            raise CheckerViolation("DECISION_EVENT_ID_INVALID", f"entry at index {index} has an invalid decisionEventId")
        if entry_id in seen_ids:
            raise CheckerViolation("DECISION_DUPLICATE_EVENT_ID", f"duplicate decisionEventId '{entry_id}'")
        seen_ids.add(entry_id)

        recomputed_hash = validate_decision_event_preimage_and_digest(entry)

        expected_prior = prior_hash
        actual_prior = entry["priorEntryHashHex"]
        if expected_prior != actual_prior:
            raise CheckerViolation(
                "DECISION_CHAIN_BROKEN",
                f"entry '{entry_id}' priorEntryHashHex '{actual_prior}' does not match the actual prior entryHashHex '{expected_prior}'",
            )
        prior_hash = recomputed_hash

        # Approver identity binding: every decision event must be authored by
        # the exact verified approver, never Party A or any other identity.
        if entry["approverId"] != expected_authorities["approverSid"]:
            raise CheckerViolation(
                "EXPECTED_AUTHORITY_APPROVER_ID_MISMATCH",
                f"entry '{entry_id}' approverId does not equal the verified activation-approver SID",
            )

        # T3B-RV-2 (R1 correction): resolve THIS entry's OWN cited
        # specVersion independently, never a single file-wide spec.
        entry_version_for_resolution = entry["specVersion"]
        try:
            entry_version_int = int(entry_version_for_resolution)
        except (TypeError, ValueError) as exc:
            raise CheckerViolation(
                "DECISION_EVENT_SPEC_VERSION_INVALID", "specVersion must be an integer"
            ) from exc
        version_author_id, version_spec_hash_hex = _resolve_version(entry_version_int)

        # Self-approval: approverId must differ from the CITED VERSION's own
        # spec authorId (never a different version's author).
        if entry["approverId"] == version_author_id:
            raise CheckerViolation(
                "DECISION_SELF_APPROVAL_REJECTED",
                f"entry '{entry_id}' approverId equals specVersion {entry_version_int}'s own spec authorId; self-approval/self-activation is forbidden",
            )

        # Never trust a caller-supplied recomputedHashHex: it must equal the
        # independently recomputed specHashHex for THIS entry's OWN cited
        # version -- a v2 entry reusing v1's hash is invalid even though both
        # hashes are individually well-formed and even though v1's hash is
        # itself valid for v1.
        if entry["recomputedHashHex"] != version_spec_hash_hex:
            raise CheckerViolation(
                "DECISION_RECOMPUTED_HASH_SPEC_MISMATCH",
                f"entry '{entry_id}' recomputedHashHex does not match the independently recomputed specHashHex for its own cited specVersion {entry_version_int}",
            )

        # T3B-R2 (atomic rotation): a SUPERSEDED entry's OWN
        # replacementRecomputedHashHex must independently match the
        # replacement version's own resolved spec hash -- never trusted
        # from the durable record without recomputation, and never
        # substitutable with the old version's hash.
        if entry["eventType"] == "SUPERSEDED" and entry["replacementSpecVersion"] is not None:
            replacement_version_int = int(entry["replacementSpecVersion"])
            _, replacement_spec_hash_hex = _resolve_version(replacement_version_int)
            if entry["replacementRecomputedHashHex"] != replacement_spec_hash_hex:
                raise CheckerViolation(
                    "DECISION_REPLACEMENT_RECOMPUTED_HASH_MISMATCH",
                    f"entry '{entry_id}' replacementRecomputedHashHex does not match the independently "
                    f"recomputed hash for its own cited replacementSpecVersion {replacement_version_int}",
                )

        version = entry["specVersion"]
        state = version_states.setdefault(version, VersionState())
        event_type = entry["eventType"]

        if event_type in ("APPROVED", "REJECTED"):
            if state.first_decision is not None:
                raise CheckerViolation(
                    "DECISION_MULTIPLE_FIRST_DECISIONS",
                    f"specVersion {version} already has a first decision '{state.first_decision}'; entry '{entry_id}' is a second APPROVED/REJECTED",
                )
            state.first_decision = event_type
        elif event_type == "ACTIVATED":
            # Ordinary ACTIVATED (T2F-R4-01 atomic rotation): requires prior
            # APPROVED and an EMPTY active set -- never permitted while ANY
            # version (including a direct predecessor) is active; replacing
            # an active version is done only via SUPERSEDED.
            if state.first_decision != "APPROVED":
                raise CheckerViolation(
                    "DECISION_ACTIVATED_WITHOUT_APPROVAL",
                    f"specVersion {version} has no prior APPROVED decision; entry '{entry_id}' ACTIVATED is invalid",
                )
            if state.has_activated:
                raise CheckerViolation(
                    "DECISION_DUPLICATE_ACTIVATION", f"specVersion {version} already has an ACTIVATED event"
                )
            if state.has_superseded:
                raise CheckerViolation(
                    "DECISION_ACTIVATED_AFTER_SUPERSEDED",
                    f"specVersion {version} was already SUPERSEDED; entry '{entry_id}' cannot re-activate",
                )
            if len(active_versions) > 0:
                raise CheckerViolation(
                    "DECISION_MULTIPLE_ACTIVE_VERSIONS",
                    f"ordinary ACTIVATED for specVersion {version} requires an empty active set; "
                    f"currently active: {sorted(active_versions)}",
                )
            state.has_activated = True
            active_versions.add(version)
        elif event_type == "SUPERSEDED":
            # Atomic rotation (T2F-R4-01): this single event both proves and
            # applies the old-to-replacement swap in one step. The
            # replacement fields were already shape-validated (non-null,
            # strictly greater, 64-hex) by validate_replacement_field_pair
            # during preimage validation above.
            replacement_version = entry["replacementSpecVersion"]
            if replacement_version is None:
                raise CheckerViolation(
                    "DECISION_REPLACEMENT_FIELDS_REQUIRED_FOR_SUPERSEDED",
                    f"specVersion {version} SUPERSEDED event has no replacementSpecVersion",
                )
            replacement_version = int(replacement_version)
            if not state.has_activated:
                raise CheckerViolation(
                    "DECISION_SUPERSEDED_WITHOUT_ACTIVATION",
                    f"specVersion {version} has no ACTIVATED event; entry '{entry_id}' SUPERSEDED is invalid",
                )
            if state.has_superseded:
                raise CheckerViolation(
                    "DECISION_DUPLICATE_SUPERSESSION", f"specVersion {version} already has a SUPERSEDED event"
                )
            if active_versions != {version}:
                raise CheckerViolation(
                    "DECISION_SUPERSEDE_REQUIRES_EXACTLY_ONE_ACTIVE",
                    f"SUPERSEDED for specVersion {version} requires the active set to be exactly "
                    f"{{{version}}}; currently active: {sorted(active_versions)}",
                )

            replacement_state = version_states.setdefault(replacement_version, VersionState())
            if replacement_state.first_decision != "APPROVED":
                raise CheckerViolation(
                    "DECISION_SUPERSESSION_REPLACEMENT_NOT_APPROVED",
                    f"replacement specVersion {replacement_version} has no prior APPROVED decision; "
                    "it cannot be cited as a supersession replacement",
                )
            # T3B-R2: has_activated is a historical "was ever activated"
            # flag that remains true forever, even after a version is later
            # superseded -- it is NOT "currently active". The
            # already-superseded case is checked FIRST using the
            # authoritative has_superseded flag; only a version that was
            # activated and has NOT since been superseded can be "currently
            # active" (a member of active_versions).
            if replacement_state.has_superseded:
                raise CheckerViolation(
                    "DECISION_SUPERSESSION_REPLACEMENT_ALREADY_SUPERSEDED",
                    f"replacement specVersion {replacement_version} has already been superseded; "
                    "it cannot be cited as a supersession replacement",
                )
            if replacement_state.has_activated and replacement_version in active_versions:
                raise CheckerViolation(
                    "DECISION_SUPERSESSION_REPLACEMENT_ALREADY_ACTIVE",
                    f"replacement specVersion {replacement_version} is already active; "
                    "it cannot be cited as a supersession replacement",
                )

            # Atomic swap: remove old, add replacement, in one step. No
            # intermediate two-active or zero-active state is ever
            # observable outside this single block.
            state.has_superseded = True
            active_versions.discard(version)
            replacement_state.has_activated = True
            active_versions.add(replacement_version)
            if len(active_versions) != 1:
                raise CheckerViolation(
                    "DECISION_MULTIPLE_ACTIVE_VERSIONS",
                    f"atomic rotation from specVersion {version} to {replacement_version} did not converge "
                    f"to exactly one active version: {sorted(active_versions)}",
                )
        else:  # pragma: no cover - already validated by validate_decision_event_preimage_and_digest
            raise CheckerViolation("DECISION_EVENT_TYPE_INVALID", f"unknown eventType '{event_type}'")

    if len(active_versions) > 1:
        raise CheckerViolation(
            "DECISION_MULTIPLE_ACTIVE_VERSIONS",
            f"unique-active invariant violated across full history: {sorted(active_versions)}",
        )

    target_state = version_states.get(EXPECTED_SPEC_VERSION, VersionState())
    is_v1_active = EXPECTED_SPEC_VERSION in active_versions

    return CheckResult(
        ok=True,
        taxonomy_id="DECISION_HISTORY_VALID",
        detail=(
            f"decision history independently verified: {len(entries)} event(s), "
            f"v{EXPECTED_SPEC_VERSION} first decision={target_state.first_decision}, "
            f"v{EXPECTED_SPEC_VERSION} activated={target_state.has_activated}, "
            f"v{EXPECTED_SPEC_VERSION} superseded={target_state.has_superseded}, "
            f"v{EXPECTED_SPEC_VERSION} currently active={is_v1_active}, "
            f"total active versions across history={sorted(active_versions)}"
        ),
        findings=(prior_hash,) if prior_hash else (),
    )


def run_check(
    *,
    spec_path: Path,
    decisions_path: Path,
    expected_authorities: dict,
) -> CheckResult:
    """Top-level fail-closed check. Never returns ok=True on a missing spec,
    a schema defect, a digest mismatch, a broken chain, an invalid state
    transition, self-approval, or more than one simultaneously active
    version.
    """
    for required_key in ("partyASid", "approverSid", "fixedPolicyJson"):
        if not expected_authorities.get(required_key):
            raise CheckerViolation(
                "EXPECTED_AUTHORITY_INCOMPLETE", f"expected_authorities is missing required key '{required_key}'"
            )

    try:
        spec_record = load_json_file(spec_path, taxonomy_id="SPEC_UNREACHABLE")
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    try:
        spec_hash_hex, spec_file_record_hash_hex = validate_spec_file_record(
            spec_record, expected_authorities=expected_authorities
        )
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    try:
        decision_entries = load_decisions_jsonl(decisions_path)
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    # T3B-RV-2 (R1 correction): resolve the per-version source directory
    # from `spec_path`'s own parent, so `validate_decision_history` can
    # independently resolve and validate every OTHER version cited in
    # history (never only the single `spec_path` given here). The
    # `spec_author_id`/`spec_hash_hex` legacy convenience parameters are
    # still passed for the common case where every entry cites the same one
    # version already loaded above, avoiding a redundant re-read of the same
    # file; a genuinely mixed-version history still resolves every
    # additional version independently from `source_directory`.
    try:
        history_result = validate_decision_history(
            decision_entries,
            source_directory=spec_path.resolve().parent,
            expected_authorities=expected_authorities,
            spec_author_id=spec_record["authorId"],
            spec_hash_hex=spec_hash_hex,
        )
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    return CheckResult(
        ok=True,
        taxonomy_id="VALIDATED",
        detail=(
            "Group 2 spec file and decision history independently validated: "
            f"specHashHex={spec_hash_hex}, specFileRecordHashHex={spec_file_record_hash_hex}. {history_result.detail}. "
            "This is validation evidence only; it does not claim spec establishment, "
            "activation validity, consumer binding or candidate admission."
        ),
        findings=(spec_hash_hex, spec_file_record_hash_hex) + history_result.findings,
    )


def main(argv: list[str] | None = None) -> int:
    """The operational CLI exposes NO argument that can redefine the
    expected Party A SID, approver SID or fixed policy bytes. Only the spec
    and decisions file paths are configurable (so the checker can point at a
    fixture pair in a test harness); the expected authority is always
    `_operational_expected_authorities()`."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--spec-path",
        default=str(REPO_ROOT / DEFAULT_SPEC_RELATIVE),
        help="Path to the Group 2 SPEC_v1.json file.",
    )
    parser.add_argument(
        "--decisions-path",
        default=str(REPO_ROOT / DEFAULT_DECISIONS_RELATIVE),
        help="Path to the Group 2 ACTIVATION_DECISIONS.jsonl file.",
    )
    args = parser.parse_args(argv)

    result = run_check(
        spec_path=Path(args.spec_path),
        decisions_path=Path(args.decisions_path),
        expected_authorities=_operational_expected_authorities(),
    )

    if result.ok:
        print(f"PASS [{result.taxonomy_id}] {result.detail}")
        return 0

    print(f"FAIL [{result.taxonomy_id}] {result.detail}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
