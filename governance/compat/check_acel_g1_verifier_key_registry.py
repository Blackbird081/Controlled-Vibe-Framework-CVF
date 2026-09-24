#!/usr/bin/env python3
"""ACEL G1 T3A-C2 Local checker for the Group 1 verifier-key registry.

Strict, read-only consumer for the two governed Group 1 source files
(`REGISTRY.json`, `LIFECYCLE_LOG.jsonl`) or explicit fixture paths. Validates
schema shape, closed-preimage field sets, independently recomputed digests,
the genesis lifecycle chain, key/alias uniqueness, and role/status/time
disposition, per `cvf.source-record-canonicalization@1` and the T2F Group 1
contract (`docs/audits/CVF_ACEL_G1_T2F_OPERATIONAL_SOURCE_ESTABLISHMENT_CONTRACT_2026-09-18.md`).

This checker never writes, never fabricates a passing result on a missing
input (`REGISTRY_UNREACHABLE` fails closed rather than `PASS_WITH_WARNING`),
and never claims candidate admission, key promotion or T3E consumer wiring.
Its result text is validation-only, never `SOURCE_CREATED_PENDING_LOCAL_VERIFICATION`
(that phrase belongs to the writer tool, describing its own real-mode output).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REGISTRY_RELATIVE = "governance/sources/verifier_key_registry/REGISTRY.json"
DEFAULT_LIFECYCLE_RELATIVE = "governance/sources/verifier_key_registry/LIFECYCLE_LOG.jsonl"

CANON_PROFILE = "cvf.source-record-canonicalization@1"
REGISTRY_ROW_DOMAIN = "cvf.keyRegistryRow"
LIFECYCLE_ROW_DOMAIN = "cvf.keyLifecycleReceipt"
RAW_PUBLIC_KEY_LENGTH = 32
GENESIS_PRIOR_STATUS = "NOT_PRESENT"
GENESIS_NEW_STATUS = "ACTIVE"
VALID_STATUSES = ("ACTIVE", "ROTATING", "REVOKED", "EXPIRED")
TERMINAL_STATUSES = ("REVOKED", "EXPIRED")
# T3A-C2-R3-03: the complete, closed T2F Group 1 transition graph. Genesis
# (NOT_PRESENT -> ACTIVE) is validated separately as the chain head; this
# table governs every non-genesis edge. A terminal status (REVOKED/EXPIRED)
# has no outgoing edge at all, and no status may self-transition.
ALLOWED_NON_GENESIS_TRANSITIONS = {
    ("ACTIVE", "ROTATING"),
    ("ROTATING", "REVOKED"),
    ("ROTATING", "EXPIRED"),
}
VERIFICATION_AUTHORITY_ROLE = "verificationAuthority"
REQUIRED_ALGORITHM = "Ed25519"
HEX64_RE = re.compile(r"^[0-9a-f]{64}$")
BASE64URL_STRICT_RE = re.compile(r"^[A-Za-z0-9_-]+$")
RFC3339_UTC_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|z)$"
)

# T3A-C2-R3-02: the exact, closed, independently verified T3A public
# product. This is the ONLY operational default authority; it is never
# caller-redefinable through the CLI. Byte-for-byte identical to the writer
# script's `$script:VerifiedPartyAProduct` and to
# `docs/audits/CVF_ACEL_G1_T3A_C2_CEREMONY_PRODUCT_LOCAL_VERIFICATION_2026-09-19.md`
# ("Verified Public Metadata"). Public ceremony output, never a secret.
VERIFIED_PARTY_A_PRODUCT = {
    "metadataSchema": "cvf.acel.g1.partyAPublicKeyMetadata@1",
    "metadataProfile": "ACEL_G1_T3A_PRINCIPAL_BOUND_CEREMONY",
    "keyId": "partya-44853ea9a690452c",
    "algorithm": "Ed25519",
    "principalName": "LAM-RUBY\\cvf-g1-party-a",
    "principalSid": "S-1-5-21-1644666849-912006174-747199667-1006",
    "publicKeyBytesBase64": "R5AsDnHQNXWgD5WQEpDi3VABiuPZ7E9U5Kir_bgiwNU",
    "publicKeySha256Hex": "5ae2ddf8433e5eab54001d6fa59586389b9c3ae6956e1155dac811a3cbbcab01",
    "createdAtUtc": "2026-09-19T06:41:05.5102754Z",
    "expiresAtUtc": "2027-09-19T06:41:05.5102754Z",
    "ceremonyDisposition": "CEREMONY",
    "testDisposition": "CEREMONY_PRODUCT_PENDING_LOCAL_VERIFICATION",
    "registryDisposition": "SOURCE_NOT_CREATED",
    "claimBoundary": "public metadata only; no registry row, lifecycle receipt, promotion or admission is claimed",
}


def _operational_expected_product() -> dict:
    """The ONE authority operational/default validation ever binds to:
    keyId, publicKeyBytesBase64, issuedAt, expiresAt and actor (Party A's
    own principalName), all derived from the fixed `VERIFIED_PARTY_A_PRODUCT`,
    never from a caller-supplied CLI argument. See T3A-C2-R3-02/R3-03."""
    return {
        "keyId": VERIFIED_PARTY_A_PRODUCT["keyId"],
        "publicKeyBytesBase64": VERIFIED_PARTY_A_PRODUCT["publicKeyBytesBase64"],
        "issuedAt": VERIFIED_PARTY_A_PRODUCT["createdAtUtc"],
        "expiresAt": VERIFIED_PARTY_A_PRODUCT["expiresAtUtc"],
        "actor": VERIFIED_PARTY_A_PRODUCT["principalName"],
    }


def _test_only_expected_product_override(
    *, key_id: str, public_key_base64: str, issued_at: str, expires_at: str | None, actor: str
) -> dict:
    """TEST-ONLY. Builds a substitute expected-product dict for hermetic
    fixture tests that intentionally validate against a fixture authority
    rather than the real `VERIFIED_PARTY_A_PRODUCT`. Never called by
    `main()` / the operational CLI path, which always calls
    `_operational_expected_product()`. Its name and this docstring exist so
    it can never be mistaken for an operational entry point; a regression
    test in the accompanying test suite asserts `main()` does not expose any
    argument that reaches this function."""
    return {
        "keyId": key_id,
        "publicKeyBytesBase64": public_key_base64,
        "issuedAt": issued_at,
        "expiresAt": expires_at,
        "actor": actor,
    }

REGISTRY_ROW_CLOSED_FIELDS = (
    "keyId",
    "publicKeyBytesBase64",
    "algorithm",
    "role",
    "issuedAt",
    "expiresAt",
    "revokedAt",
    "status",
    "rotatedFromKeyId",
)
REGISTRY_ROW_NULLABLE = ("expiresAt", "revokedAt", "rotatedFromKeyId")
REGISTRY_ROW_STORED_DIGEST = "rowHashHex"

LIFECYCLE_ROW_CLOSED_FIELDS = (
    "transitionId",
    "keyId",
    "registrySnapshotVersionBefore",
    "registrySnapshotVersionAfter",
    "priorStatus",
    "newStatus",
    "actor",
    "timestamp",
    "priorEntryHashHex",
)
LIFECYCLE_ROW_STORED_DIGEST = "entryHashHex"

REGISTRY_ENVELOPE_FIELDS = (
    "registrySnapshotId",
    "registrySnapshotVersion",
    "writeTimestamp",
    "rows",
)


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
    """Exact reference canonicalization per the T2F contract.

    `json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`
    encoded as UTF-8. This is the T2F-cited Python reference implementation
    itself, not a reimplementation the writer's PowerShell output must be
    trusted to match; both are independently verified against the same
    published test vector in the focused test suite.
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _sha256_hex(data: bytes) -> str:
    import hashlib

    return hashlib.sha256(data).hexdigest()


def _decode_base64url_strict(text: str) -> bytes:
    """Strict, canonical, unpadded base64url decode.

    T3A-C2-R2-01/R2-03: rejects anything the writer would never itself emit:
    standard-base64 characters (`+`, `/`), any padding (`=`), non-ASCII, and
    any length whose padding requirement is invalid. Also enforces that
    re-encoding the decoded bytes back to base64url reproduces the exact
    input string byte-for-byte, which rejects non-canonical encodings that
    happen to decode successfully (e.g. a base64 alphabet with stray bits in
    an unused tail).
    """
    import base64

    if not isinstance(text, str) or not text:
        raise CheckerViolation("PUBLIC_KEY_UNDECODABLE", "publicKeyBytesBase64 is empty or not a string")
    if "=" in text:
        raise CheckerViolation("PUBLIC_KEY_NON_CANONICAL_BASE64URL", "publicKeyBytesBase64 must be unpadded (no '=')")
    if not BASE64URL_STRICT_RE.match(text):
        raise CheckerViolation(
            "PUBLIC_KEY_NON_CANONICAL_BASE64URL",
            "publicKeyBytesBase64 must use only the unpadded URL-safe alphabet [A-Za-z0-9_-]",
        )
    padding_needed = (-len(text)) % 4
    if padding_needed == 3:
        raise CheckerViolation("PUBLIC_KEY_UNDECODABLE", "invalid base64url length")
    padded = text + ("=" * padding_needed)
    try:
        decoded = base64.urlsafe_b64decode(padded.encode("ascii"))
    except Exception as exc:  # noqa: BLE001 - normalize into taxonomy violation
        raise CheckerViolation("PUBLIC_KEY_UNDECODABLE", f"base64url decode failed: {exc}") from exc

    reencoded = base64.urlsafe_b64encode(decoded).rstrip(b"=").decode("ascii")
    if reencoded != text:
        raise CheckerViolation(
            "PUBLIC_KEY_NON_CANONICAL_BASE64URL",
            "publicKeyBytesBase64 does not reproduce byte-for-byte after canonical re-encoding",
        )
    return decoded


def _reject_duplicate_json_members(pairs: list[tuple[str, object]]) -> dict:
    """`object_pairs_hook` for `json.loads` that fails closed on any
    duplicate JSON member instead of silently keeping the last value."""
    seen: dict[str, object] = {}
    for key, value in pairs:
        if key in seen:
            raise CheckerViolation("DUPLICATE_JSON_MEMBER", f"duplicate JSON member '{key}'")
        seen[key] = value
    return seen


def _parse_json_strict(text: str) -> dict:
    return json.loads(text, object_pairs_hook=_reject_duplicate_json_members)


def _parse_rfc3339_utc_instant(value: object, *, field_name: str) -> datetime:
    """T3A-C2-R3-03: validate AND return the parsed UTC instant, so every
    cross-record time comparison in this module compares actual instants
    (immune to differing fractional-second digit counts or Z-vs-+00:00
    spelling) rather than lexical strings."""
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


def _validate_rfc3339_utc(value: object, *, field_name: str) -> None:
    """Back-compat shape: validate only, discard the parsed instant."""
    _parse_rfc3339_utc_instant(value, field_name=field_name)


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


def _require_nullable_string(value: object, *, field_name: str, taxonomy_prefix: str) -> None:
    if value is not None and (not isinstance(value, str) or not value):
        raise CheckerViolation(
            f"{taxonomy_prefix}_INVALID", f"field '{field_name}' must be null or a non-empty string"
        )


def validate_registry_row_preimage_and_digest(row: dict, *, expected_product: dict) -> str:
    """C2-03/C2-08/T3A-C2-R2-03. Validate one registry row's closed preimage,
    strict field types/timestamps, exact role, and recompute `rowHashHex`
    independently against the exact verified public product. Returns the
    verified digest.

    `expected_product` is REQUIRED (never optional): operational validation
    is hard-bound to the independently verified T3A ceremony product rather
    than accepting any well-formed row.
    """

    _require_fields(row, REGISTRY_ROW_CLOSED_FIELDS + (REGISTRY_ROW_STORED_DIGEST,), kind="REGISTRY_ROW")
    _reject_extra_fields(row, REGISTRY_ROW_CLOSED_FIELDS, kind="REGISTRY_ROW", exclude=(REGISTRY_ROW_STORED_DIGEST,))

    _require_non_empty_string(row["keyId"], field_name="keyId", taxonomy_prefix="REGISTRY_ROW_KEY_ID")
    _require_non_empty_string(
        row["publicKeyBytesBase64"], field_name="publicKeyBytesBase64", taxonomy_prefix="REGISTRY_ROW_PUBLIC_KEY"
    )
    _require_nullable_string(
        row["expiresAt"], field_name="expiresAt", taxonomy_prefix="REGISTRY_ROW_EXPIRES_AT"
    )
    _require_nullable_string(
        row["revokedAt"], field_name="revokedAt", taxonomy_prefix="REGISTRY_ROW_REVOKED_AT"
    )
    _require_nullable_string(
        row["rotatedFromKeyId"], field_name="rotatedFromKeyId", taxonomy_prefix="REGISTRY_ROW_ROTATED_FROM_KEY_ID"
    )

    if row["algorithm"] != REQUIRED_ALGORITHM:
        raise CheckerViolation(
            "REGISTRY_ROW_ALGORITHM_UNSUPPORTED", f"algorithm '{row['algorithm']}' is not '{REQUIRED_ALGORITHM}'"
        )

    if row["role"] != VERIFICATION_AUTHORITY_ROLE:
        raise CheckerViolation(
            "REGISTRY_ROW_ROLE_INVALID", f"role '{row['role']}' is not exactly '{VERIFICATION_AUTHORITY_ROLE}'"
        )

    if row["status"] not in VALID_STATUSES:
        raise CheckerViolation("REGISTRY_ROW_STATUS_INVALID", f"status '{row['status']}' is not one of {VALID_STATUSES}")

    _validate_rfc3339_utc(row["issuedAt"], field_name="issuedAt")
    if row["expiresAt"] is not None:
        _validate_rfc3339_utc(row["expiresAt"], field_name="expiresAt")
    if row["revokedAt"] is not None:
        _validate_rfc3339_utc(row["revokedAt"], field_name="revokedAt")

    public_key_bytes = _decode_base64url_strict(row["publicKeyBytesBase64"])
    if len(public_key_bytes) != RAW_PUBLIC_KEY_LENGTH:
        raise CheckerViolation(
            "REGISTRY_ROW_PUBLIC_KEY_LENGTH_MISMATCH",
            f"decoded public key length {len(public_key_bytes)} != {RAW_PUBLIC_KEY_LENGTH}",
        )

    if row["keyId"] != expected_product["keyId"]:
        raise CheckerViolation(
            "EXPECTED_PRODUCT_KEY_ID_MISMATCH", f"row keyId '{row['keyId']}' != expected '{expected_product['keyId']}'"
        )
    if row["publicKeyBytesBase64"] != expected_product["publicKeyBytesBase64"]:
        raise CheckerViolation(
            "EXPECTED_PRODUCT_PUBLIC_KEY_MISMATCH", "row publicKeyBytesBase64 does not match expected verified product"
        )
    if row["issuedAt"] != expected_product["issuedAt"]:
        raise CheckerViolation(
            "EXPECTED_PRODUCT_ISSUED_AT_MISMATCH",
            f"row issuedAt '{row['issuedAt']}' != expected verified product issuedAt '{expected_product['issuedAt']}'",
        )
    if row["expiresAt"] != expected_product["expiresAt"]:
        raise CheckerViolation(
            "EXPECTED_PRODUCT_EXPIRES_AT_MISMATCH",
            f"row expiresAt '{row['expiresAt']}' != expected verified product expiresAt '{expected_product['expiresAt']}'",
        )

    stored_digest = row[REGISTRY_ROW_STORED_DIGEST]
    if not isinstance(stored_digest, str) or not HEX64_RE.match(stored_digest):
        raise CheckerViolation(
            "REGISTRY_ROW_DIGEST_SHAPE_INVALID", f"{REGISTRY_ROW_STORED_DIGEST} is not 64 lowercase hex characters"
        )

    preimage = {
        "profile": CANON_PROFILE,
        "domain": REGISTRY_ROW_DOMAIN,
        "keyId": row["keyId"],
        "publicKeyBytesBase64": row["publicKeyBytesBase64"],
        "algorithm": row["algorithm"],
        "role": row["role"],
        "issuedAt": row["issuedAt"],
        "expiresAt": row["expiresAt"],
        "revokedAt": row["revokedAt"],
        "status": row["status"],
        "rotatedFromKeyId": row["rotatedFromKeyId"],
    }
    if preimage.get("profile") != CANON_PROFILE:
        raise CheckerViolation("REGISTRY_ROW_PROFILE_DRIFT", "profile literal does not match canonicalization profile")

    recomputed = _sha256_hex(_canonical_json_bytes(preimage))
    if recomputed != stored_digest:
        raise CheckerViolation(
            "REGISTRY_ROW_DIGEST_MISMATCH",
            f"recomputed rowHashHex '{recomputed}' does not match stored '{stored_digest}'",
        )
    return recomputed


def validate_registry_envelope(envelope: dict, *, expected_product: dict) -> list[str]:
    """C2-04/C2-08/T3A-C2-R2-03. Validate the envelope shape and per-row
    uniqueness, including public-key-alias comparison on DECODED bytes
    (never the encoded string alone, so two different encodings of the same
    key bytes are still caught).

    Returns the list of verified row digests (one per row, in row order).
    """
    _require_fields(envelope, REGISTRY_ENVELOPE_FIELDS, kind="ENVELOPE")
    _reject_extra_fields(envelope, REGISTRY_ENVELOPE_FIELDS, kind="ENVELOPE")

    if not isinstance(envelope["registrySnapshotId"], str) or not envelope["registrySnapshotId"]:
        raise CheckerViolation("ENVELOPE_SNAPSHOT_ID_INVALID", "registrySnapshotId must be a non-empty string")

    version = envelope["registrySnapshotVersion"]
    if not isinstance(version, int) or isinstance(version, bool) or version < 1:
        raise CheckerViolation(
            "ENVELOPE_SNAPSHOT_VERSION_INVALID", "registrySnapshotVersion must be a positive integer"
        )

    _validate_rfc3339_utc(envelope["writeTimestamp"], field_name="writeTimestamp")

    rows = envelope["rows"]
    if not isinstance(rows, list) or len(rows) == 0:
        raise CheckerViolation("ENVELOPE_ROWS_EMPTY", "rows must be a non-empty array")

    seen_key_ids: set[str] = set()
    seen_public_key_bytes: dict[bytes, str] = {}
    digests: list[str] = []
    for row in rows:
        if not isinstance(row, dict):
            raise CheckerViolation("ENVELOPE_ROW_NOT_OBJECT", "each row must be a JSON object")
        key_id = row.get("keyId")
        public_key_field = row.get("publicKeyBytesBase64")
        public_key_bytes = _decode_base64url_strict(public_key_field) if isinstance(public_key_field, str) else None
        if key_id in seen_key_ids:
            raise CheckerViolation("REGISTRY_DUPLICATE_KEY_ID", f"duplicate keyId '{key_id}' in registry envelope")
        if public_key_bytes is not None and public_key_bytes in seen_public_key_bytes:
            prior_key_id = seen_public_key_bytes[public_key_bytes]
            if prior_key_id != key_id:
                raise CheckerViolation(
                    "REGISTRY_PUBLIC_KEY_ALIAS",
                    f"publicKeyBytesBase64 decoded bytes already registered under keyId "
                    f"'{prior_key_id}', cannot alias to '{key_id}'",
                )
        seen_key_ids.add(key_id)
        if public_key_bytes is not None:
            seen_public_key_bytes[public_key_bytes] = key_id
        digests.append(validate_registry_row_preimage_and_digest(row, expected_product=expected_product))

    return digests


def validate_lifecycle_receipt(
    receipt: dict,
    *,
    expected_prior_hash: str | None,
    expected_actor: str,
    seen_transition_ids: set[str],
    prior_status_for_edge_check: str | None = None,
) -> tuple[str, datetime]:
    """C2-05/C2-08/T3A-C2-R2-03/T3A-C2-R3-03. Validate one lifecycle
    receipt's closed preimage, strict field types/timestamps, chain linkage,
    exact Party A actor identity (on EVERY entry, not only genesis), global
    `transitionId` uniqueness, and the closed T2F transition graph. Returns
    `(verified_entry_hash_hex, parsed_utc_timestamp)`.

    `expected_actor` is required and checked against every entry:
    T3A-C2-R3-03 requires the exact Party A actor on every entry in the log,
    not only the genesis transition. `seen_transition_ids` is the caller's
    running set across the WHOLE log; this function adds this receipt's ID
    to it and rejects if the ID was already present (duplicate transition
    ID anywhere in the log, not only against the immediately prior entry).
    `prior_status_for_edge_check` is the previous entry's `newStatus` (None
    for genesis); for a non-genesis entry this enforces the closed
    ACTIVE->ROTATING->{REVOKED,EXPIRED} graph with no self-transition and no
    edge out of a terminal status.
    """

    _require_fields(receipt, LIFECYCLE_ROW_CLOSED_FIELDS + (LIFECYCLE_ROW_STORED_DIGEST,), kind="LIFECYCLE_ROW")
    _reject_extra_fields(
        receipt, LIFECYCLE_ROW_CLOSED_FIELDS, kind="LIFECYCLE_ROW", exclude=(LIFECYCLE_ROW_STORED_DIGEST,)
    )

    _require_non_empty_string(receipt["transitionId"], field_name="transitionId", taxonomy_prefix="LIFECYCLE_TRANSITION_ID")
    _require_non_empty_string(receipt["keyId"], field_name="keyId", taxonomy_prefix="LIFECYCLE_KEY_ID")
    _require_non_empty_string(receipt["actor"], field_name="actor", taxonomy_prefix="LIFECYCLE_ACTOR")
    parsed_timestamp = _parse_rfc3339_utc_instant(receipt["timestamp"], field_name="timestamp")

    if receipt["transitionId"] in seen_transition_ids:
        raise CheckerViolation(
            "LIFECYCLE_DUPLICATE_TRANSITION_ID",
            f"transitionId '{receipt['transitionId']}' already appears earlier in the lifecycle log",
        )
    seen_transition_ids.add(receipt["transitionId"])

    if receipt["actor"] != expected_actor:
        raise CheckerViolation(
            "LIFECYCLE_ACTOR_MISMATCH",
            f"lifecycle entry actor '{receipt['actor']}' does not equal expected Party A actor '{expected_actor}'",
        )

    if receipt["priorStatus"] not in (GENESIS_PRIOR_STATUS,) + VALID_STATUSES:
        raise CheckerViolation(
            "LIFECYCLE_PRIOR_STATUS_INVALID",
            f"priorStatus '{receipt['priorStatus']}' is not '{GENESIS_PRIOR_STATUS}' or one of {VALID_STATUSES}",
        )

    stored_digest = receipt[LIFECYCLE_ROW_STORED_DIGEST]
    if not isinstance(stored_digest, str) or not HEX64_RE.match(stored_digest):
        raise CheckerViolation(
            "LIFECYCLE_ROW_DIGEST_SHAPE_INVALID", f"{LIFECYCLE_ROW_STORED_DIGEST} is not 64 lowercase hex characters"
        )

    prior_hash = receipt["priorEntryHashHex"]
    if expected_prior_hash is None:
        if prior_hash is not None:
            raise CheckerViolation(
                "LIFECYCLE_GENESIS_PRIOR_HASH_NOT_NULL",
                "genesis receipt (registrySnapshotVersionBefore == 0) must have priorEntryHashHex == null",
            )
        if receipt["priorStatus"] != GENESIS_PRIOR_STATUS:
            raise CheckerViolation(
                "LIFECYCLE_GENESIS_PRIOR_STATUS_INVALID",
                f"genesis receipt priorStatus must be '{GENESIS_PRIOR_STATUS}', got '{receipt['priorStatus']}'",
            )
        if receipt["newStatus"] != GENESIS_NEW_STATUS:
            raise CheckerViolation(
                "LIFECYCLE_GENESIS_NEW_STATUS_INVALID",
                f"genesis receipt newStatus must be '{GENESIS_NEW_STATUS}', got '{receipt['newStatus']}'",
            )
        before_genesis = receipt["registrySnapshotVersionBefore"]
        after_genesis = receipt["registrySnapshotVersionAfter"]
        if before_genesis != 0 or after_genesis != 1:
            raise CheckerViolation(
                "LIFECYCLE_GENESIS_VERSION_INVALID",
                f"genesis receipt versions must be exactly 0->1, got {before_genesis}->{after_genesis}",
            )
    else:
        if prior_hash != expected_prior_hash:
            raise CheckerViolation(
                "LIFECYCLE_CHAIN_BROKEN",
                f"priorEntryHashHex '{prior_hash}' does not match actual prior entryHashHex '{expected_prior_hash}'",
            )
        # T3A-C2-R3-03: closed transition graph for every non-genesis edge.
        # priorStatus here is `receipt`'s own claimed prior status, but the
        # graph is judged against the ACTUAL prior entry's newStatus, which
        # the caller supplies as `prior_status_for_edge_check`; the separate
        # priorStatus-equals-prior-newStatus linkage check happens in
        # run_check's chain walk, so this only judges the actual edge.
        if prior_status_for_edge_check in TERMINAL_STATUSES:
            raise CheckerViolation(
                "LIFECYCLE_TERMINAL_STATUS_RESURRECTED",
                f"prior status '{prior_status_for_edge_check}' is terminal and has no successor transition",
            )
        edge = (prior_status_for_edge_check, receipt["newStatus"])
        if edge[0] == edge[1]:
            raise CheckerViolation(
                "LIFECYCLE_SELF_TRANSITION_REJECTED",
                f"status '{edge[0]}' cannot transition to itself",
            )
        if edge not in ALLOWED_NON_GENESIS_TRANSITIONS:
            raise CheckerViolation(
                "LIFECYCLE_ILLEGAL_STATE_EDGE",
                f"transition {edge[0]} -> {edge[1]} is not in the closed T2F transition graph",
            )

    if receipt["newStatus"] not in VALID_STATUSES:
        raise CheckerViolation(
            "LIFECYCLE_NEW_STATUS_INVALID", f"newStatus '{receipt['newStatus']}' is not one of {VALID_STATUSES}"
        )

    before = receipt["registrySnapshotVersionBefore"]
    after = receipt["registrySnapshotVersionAfter"]
    if not isinstance(before, int) or isinstance(before, bool) or not isinstance(after, int) or isinstance(after, bool):
        raise CheckerViolation("LIFECYCLE_VERSION_TYPE_INVALID", "registrySnapshotVersionBefore/After must be integers")
    if after != before + 1:
        raise CheckerViolation(
            "LIFECYCLE_VERSION_NOT_MONOTONIC",
            f"registrySnapshotVersionAfter ({after}) must equal registrySnapshotVersionBefore ({before}) + 1",
        )

    preimage = {
        "profile": CANON_PROFILE,
        "domain": LIFECYCLE_ROW_DOMAIN,
        "transitionId": receipt["transitionId"],
        "keyId": receipt["keyId"],
        "registrySnapshotVersionBefore": receipt["registrySnapshotVersionBefore"],
        "registrySnapshotVersionAfter": receipt["registrySnapshotVersionAfter"],
        "priorStatus": receipt["priorStatus"],
        "newStatus": receipt["newStatus"],
        "actor": receipt["actor"],
        "timestamp": receipt["timestamp"],
        "priorEntryHashHex": receipt["priorEntryHashHex"],
    }
    recomputed = _sha256_hex(_canonical_json_bytes(preimage))
    if recomputed != stored_digest:
        raise CheckerViolation(
            "LIFECYCLE_ROW_DIGEST_MISMATCH",
            f"recomputed entryHashHex '{recomputed}' does not match stored '{stored_digest}'",
        )
    return recomputed, parsed_timestamp


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


def load_lifecycle_log(path: Path) -> list[dict]:
    if not path.is_file():
        raise CheckerViolation("LIFECYCLE_UNREACHABLE", f"file not found: {path}")
    entries: list[dict] = []
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError as exc:
        raise CheckerViolation("LIFECYCLE_UNREADABLE", f"file is not valid UTF-8: {exc}") from exc
    for line_no, raw_line in enumerate(text.splitlines(), start=1):
        line = raw_line.strip()
        if not line:
            continue
        try:
            entries.append(_parse_json_strict(line))
        except CheckerViolation as exc:
            raise CheckerViolation(
                "LIFECYCLE_LINE_DUPLICATE_JSON_MEMBER" if exc.taxonomy_id == "DUPLICATE_JSON_MEMBER" else exc.taxonomy_id,
                f"line {line_no}: {exc}",
            ) from exc
        except json.JSONDecodeError as exc:
            raise CheckerViolation("LIFECYCLE_LINE_UNPARSEABLE", f"line {line_no} is not valid JSON: {exc}") from exc
    if not entries:
        raise CheckerViolation("LIFECYCLE_EMPTY", "lifecycle log contains no entries")
    return entries


def run_check(
    *,
    registry_path: Path,
    lifecycle_path: Path,
    expected_product: dict,
) -> CheckResult:
    """Top-level fail-closed check. Never returns ok=True on a missing input,
    a schema defect, a digest mismatch, a broken chain, a duplicate/alias
    collision, or an out-of-range role/status/time disposition.

    T3A-C2-R2-03: `expected_product` is REQUIRED, not optional. Operational
    validation is hard-bound to the independently verified T3A ceremony
    product: `keyId`, `publicKeyBytesBase64` and `actor` (the expected
    genesis-transition Party A actor identity) are all checked, never left
    to accept any well-formed row/receipt.
    """
    for required_key in ("keyId", "publicKeyBytesBase64", "issuedAt", "actor"):
        if not expected_product.get(required_key):
            raise CheckerViolation(
                "EXPECTED_PRODUCT_INCOMPLETE", f"expected_product is missing required key '{required_key}'"
            )
    if "expiresAt" not in expected_product:
        raise CheckerViolation("EXPECTED_PRODUCT_INCOMPLETE", "expected_product is missing key 'expiresAt'")

    try:
        envelope = load_json_file(registry_path, taxonomy_id="REGISTRY_UNREACHABLE")
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    try:
        row_digests = validate_registry_envelope(envelope, expected_product=expected_product)
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    if len(envelope["rows"]) != 1:
        return CheckResult(
            ok=False,
            taxonomy_id="REGISTRY_ROW_COUNT_UNEXPECTED",
            detail=f"expected exactly one Group 1 genesis row, found {len(envelope['rows'])}",
        )

    row = envelope["rows"][0]

    try:
        lifecycle_entries = load_lifecycle_log(lifecycle_path)
    except CheckerViolation as exc:
        return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))

    prior_hash: str | None = None
    prior_new_status: str | None = None
    seen_transition_ids: set[str] = set()
    verified_entry_digests: list[str] = []
    verified_timestamps: list[datetime] = []
    for entry in lifecycle_entries:
        try:
            verified_digest, verified_timestamp = validate_lifecycle_receipt(
                entry,
                expected_prior_hash=prior_hash,
                expected_actor=expected_product["actor"],
                seen_transition_ids=seen_transition_ids,
                prior_status_for_edge_check=prior_new_status,
            )
        except CheckerViolation as exc:
            return CheckResult(ok=False, taxonomy_id=exc.taxonomy_id, detail=str(exc))
        verified_entry_digests.append(verified_digest)
        verified_timestamps.append(verified_timestamp)
        prior_hash = verified_digest
        prior_new_status = entry["newStatus"]

    genesis = lifecycle_entries[0]
    genesis_timestamp = verified_timestamps[0]
    chain_tip = lifecycle_entries[-1]
    chain_tip_timestamp = verified_timestamps[-1]
    for index in range(1, len(lifecycle_entries)):
        current_entry = lifecycle_entries[index]
        previous_entry = lifecycle_entries[index - 1]
        if current_entry["keyId"] != genesis["keyId"]:
            return CheckResult(
                ok=False,
                taxonomy_id="LIFECYCLE_KEY_ID_DRIFT",
                detail=(
                    f"lifecycle entry at index {index} has keyId '{current_entry['keyId']}', "
                    f"which differs from the genesis keyId '{genesis['keyId']}'"
                ),
            )
        if current_entry["priorStatus"] != previous_entry["newStatus"]:
            return CheckResult(
                ok=False,
                taxonomy_id="LIFECYCLE_PRIOR_STATUS_DISCONTINUITY",
                detail=(
                    f"lifecycle entry at index {index} has priorStatus '{current_entry['priorStatus']}', "
                    f"which does not equal the prior entry's newStatus '{previous_entry['newStatus']}'"
                ),
            )
        if current_entry["registrySnapshotVersionBefore"] != previous_entry["registrySnapshotVersionAfter"]:
            return CheckResult(
                ok=False,
                taxonomy_id="LIFECYCLE_VERSION_DISCONTINUITY",
                detail=(
                    f"lifecycle entry at index {index} has registrySnapshotVersionBefore "
                    f"{current_entry['registrySnapshotVersionBefore']}, which does not equal the prior "
                    f"entry's registrySnapshotVersionAfter {previous_entry['registrySnapshotVersionAfter']}"
                ),
            )
        if verified_timestamps[index] < verified_timestamps[index - 1]:
            return CheckResult(
                ok=False,
                taxonomy_id="LIFECYCLE_TIMESTAMP_NOT_MONOTONIC",
                detail=(
                    f"lifecycle entry at index {index} timestamp '{current_entry['timestamp']}' precedes "
                    f"the prior entry's timestamp '{previous_entry['timestamp']}' (parsed UTC instant comparison)"
                ),
            )

    if genesis["keyId"] != row["keyId"]:
        return CheckResult(
            ok=False,
            taxonomy_id="LIFECYCLE_KEY_ID_MISMATCH",
            detail=f"genesis lifecycle keyId '{genesis['keyId']}' does not match registry row keyId '{row['keyId']}'",
        )
    if chain_tip["newStatus"] != row["status"]:
        return CheckResult(
            ok=False,
            taxonomy_id="LIFECYCLE_STATUS_MISMATCH",
            detail=(
                f"chain-tip lifecycle newStatus '{chain_tip['newStatus']}' does not match "
                f"registry row status '{row['status']}'; the row reflects the state after "
                "every recorded transition, not only the genesis transition"
            ),
        )
    if envelope["registrySnapshotVersion"] != chain_tip["registrySnapshotVersionAfter"]:
        return CheckResult(
            ok=False,
            taxonomy_id="ENVELOPE_VERSION_CHAIN_TIP_MISMATCH",
            detail=(
                f"envelope registrySnapshotVersion {envelope['registrySnapshotVersion']} does not equal "
                f"chain-tip registrySnapshotVersionAfter {chain_tip['registrySnapshotVersionAfter']}"
            ),
        )

    # T3A-C2-R3-03: cross-record time rules specific to this genesis source
    # writer/checker. row issuedAt/expiresAt must equal the verified
    # product's own values (already implied by the row's exact-product
    # binding above, re-asserted here as an explicit temporal rule);
    # issuedAt <= genesis timestamp; genesis timestamp == envelope
    # writeTimestamp; chain-tip timestamp == envelope writeTimestamp; the
    # write/tip instant must precede the non-null expiry.
    row_issued_at = _parse_rfc3339_utc_instant(row["issuedAt"], field_name="row.issuedAt")
    envelope_write_timestamp = _parse_rfc3339_utc_instant(envelope["writeTimestamp"], field_name="writeTimestamp")

    if row_issued_at > genesis_timestamp:
        return CheckResult(
            ok=False,
            taxonomy_id="ROW_ISSUED_AT_AFTER_GENESIS_TIMESTAMP",
            detail=(
                f"row issuedAt '{row['issuedAt']}' is after the genesis lifecycle timestamp "
                f"'{genesis['timestamp']}'; issuedAt must be at or before the genesis transition"
            ),
        )
    if genesis_timestamp != envelope_write_timestamp:
        return CheckResult(
            ok=False,
            taxonomy_id="GENESIS_TIMESTAMP_ENVELOPE_WRITE_TIMESTAMP_MISMATCH",
            detail=(
                f"genesis lifecycle timestamp '{genesis['timestamp']}' does not equal envelope "
                f"writeTimestamp '{envelope['writeTimestamp']}'"
            ),
        )
    if chain_tip_timestamp != envelope_write_timestamp:
        return CheckResult(
            ok=False,
            taxonomy_id="CHAIN_TIP_TIMESTAMP_ENVELOPE_WRITE_TIMESTAMP_MISMATCH",
            detail=(
                f"chain-tip lifecycle timestamp '{chain_tip['timestamp']}' does not equal envelope "
                f"writeTimestamp '{envelope['writeTimestamp']}'"
            ),
        )
    if row["expiresAt"] is not None:
        row_expires_at = _parse_rfc3339_utc_instant(row["expiresAt"], field_name="row.expiresAt")
        if envelope_write_timestamp >= row_expires_at:
            return CheckResult(
                ok=False,
                taxonomy_id="WRITE_TIMESTAMP_NOT_BEFORE_EXPIRY",
                detail=(
                    f"envelope writeTimestamp '{envelope['writeTimestamp']}' does not precede row "
                    f"expiresAt '{row['expiresAt']}'"
                ),
            )

    return CheckResult(
        ok=True,
        taxonomy_id="VALIDATED",
        detail=(
            "Group 1 registry and genesis lifecycle receipt independently validated: "
            f"rowHashHex={row_digests[0]}, entryHashHex={verified_entry_digests[0]}. "
            "This is validation evidence only; it does not claim candidate admission, "
            "key promotion or T3E consumer wiring."
        ),
        findings=tuple(row_digests + verified_entry_digests),
    )


def main(argv: list[str] | None = None) -> int:
    """T3A-C2-R3-02: the operational CLI exposes NO argument that can
    redefine the expected key ID, public key or actor. Only the registry and
    lifecycle file paths are configurable (so the checker can point at a
    fixture pair in a test harness); the expected authority is always
    `_operational_expected_product()`, derived solely from the fixed
    `VERIFIED_PARTY_A_PRODUCT` constant."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--registry-path",
        default=str(REPO_ROOT / DEFAULT_REGISTRY_RELATIVE),
        help="Path to the Group 1 registry envelope JSON file.",
    )
    parser.add_argument(
        "--lifecycle-path",
        default=str(REPO_ROOT / DEFAULT_LIFECYCLE_RELATIVE),
        help="Path to the Group 1 lifecycle log JSONL file.",
    )
    args = parser.parse_args(argv)

    result = run_check(
        registry_path=Path(args.registry_path),
        lifecycle_path=Path(args.lifecycle_path),
        expected_product=_operational_expected_product(),
    )

    if result.ok:
        print(f"PASS [{result.taxonomy_id}] {result.detail}")
        return 0

    print(f"FAIL [{result.taxonomy_id}] {result.detail}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
