"""Engine-side contract for the offline bound receipt: canonical bytes, strict codec, config, signed wire.

The Web side owns the same contract in TypeScript. Both sides are asserted against one shared vector file, so a drift in either
codec fails a test instead of silently changing signed bytes. Nothing here reads the environment, a network or a credential.
"""

import hashlib
import hmac
import json
import re
from urllib.parse import urlsplit

BOUND_SCHEMA = "cvf.artifactsBoundReceiptOperation.v1"
WIRE_SCHEMA = "cvf.boundReceiptWire.v1"
AUTH_TAG = "cvf.boundReceiptAuth.v1"
IDENTITY_TRUST = "AUTHENTICATED_DEPLOYMENT_BINDING"
BOUND_PROXY_PATH = "/api/governance/artifact-receipts"
ENGINE_CHALLENGE_PATH = "/api/v1/artifact-receipts/challenge"
ENGINE_EVALUATE_PATH = "/api/v1/artifact-receipts/evaluate"
MAX_REQUEST_BYTES = 16384
MAX_RESPONSE_BYTES = 32768
MAX_SKEW_PAST_MS = 30000
MAX_SKEW_FUTURE_MS = 1000
CHALLENGE_TTL_MS = 5000
MAX_REPLAY_ENTRIES = 1024
MAX_SAFE_INTEGER = 2 ** 53 - 1
HEADER_NAMES = {
    "hop": "x-cvf-bound-hop", "kind": "x-cvf-bound-kind", "timestamp": "x-cvf-bound-timestamp",
    "nonce": "x-cvf-bound-nonce", "config": "x-cvf-bound-config", "signature": "x-cvf-bound-signature",
}
EXPECTED_ACTION = {"ALLOW": "ALLOW", "DENY": "BLOCK", "REVIEW": "NEEDS_APPROVAL", "ESCALATE": "ESCALATE", "SANDBOX": "LOG_ONLY"}

_HASH = re.compile(r"^[a-f0-9]{64}$")
_LABEL = re.compile(r"^[A-Za-z0-9._-]{1,100}$")
_UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
_ATTEMPT = re.compile(r"^[A-Za-z0-9._-]{8,150}$")
_ARTIFACT = re.compile(r"^[A-Za-z0-9._-]{1,150}$")
_PRINCIPAL = re.compile(r"^[A-Za-z0-9_-]{1,150}$")
_ASCII_KEY = re.compile(r"^[\x20-\x7e]*$")
_FIXTURE_HOSTS = ("localhost", "127.0.0.1", "::1")


class ContractError(ValueError):
    """A deny reason. The code is a bounded upper-case token that is safe to return to a caller."""

    def __init__(self, code):
        super().__init__(code)
        self.code = code


def _check(value):
    """Protocol values only: ASCII object keys, strings, booleans, null, lists and safe integers. Floats and non-finite numbers deny."""
    if value is None or isinstance(value, (str, bool)):
        return
    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            raise ContractError("NON_CANONICAL_NUMBER")
        return
    if isinstance(value, list):
        for item in value:
            _check(item)
        return
    if isinstance(value, dict):
        for key, item in value.items():
            if not isinstance(key, str) or not _ASCII_KEY.match(key):
                raise ContractError("NON_ASCII_KEY")
            _check(item)
        return
    raise ContractError("NON_CANONICAL_VALUE")


def canonical_ascii(value):
    """Sorted keys, compact separators, ASCII only; every non-ASCII UTF-16 code unit and DEL becomes lowercase backslash-u hex."""
    _check(value)
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True, allow_nan=False)


def canonical_bytes(value):
    return canonical_ascii(value).encode("ascii")


def sha256_hex(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def bound_sha256(value):
    return sha256_hex(canonical_bytes(value))


def _no_duplicates(pairs):
    seen = {}
    for key, value in pairs:
        if key in seen:
            raise ContractError("DUPLICATE_KEY")
        seen[key] = value
    return seen


def _reject_constant(_name):
    raise ContractError("NON_FINITE_NUMBER")


def _reject_float(_text):
    raise ContractError("FRACTIONAL_NUMBER")


def parse_canonical_json(raw, max_bytes):
    """Strict parse. Duplicate keys, alternate escapes, whitespace, key order, floats and BOMs all fail canonical equality."""
    if not isinstance(raw, (bytes, bytearray)) or len(raw) == 0:
        raise ContractError("EMPTY_BODY")
    if len(raw) > max_bytes:
        raise ContractError("OVERSIZE_BODY")
    try:
        text = bytes(raw).decode("utf-8")
    except UnicodeDecodeError:
        raise ContractError("INVALID_UTF8") from None
    try:
        value = json.loads(text, object_pairs_hook=_no_duplicates, parse_float=_reject_float, parse_constant=_reject_constant)
    except ContractError:
        raise
    except (ValueError, RecursionError):
        raise ContractError("INVALID_JSON") from None
    try:
        canonical = canonical_ascii(value)
    except (ContractError, RecursionError, ValueError):
        raise ContractError("NOT_CANONICAL") from None
    if canonical != text:
        raise ContractError("NOT_CANONICAL")
    return value


def _is_record(value, keys):
    return isinstance(value, dict) and set(value.keys()) == set(keys)


def _hash(value):
    return isinstance(value, str) and _HASH.match(value) is not None


def _label(value, pattern=_LABEL):
    return isinstance(value, str) and pattern.match(value) is not None


def copy_owner(value):
    if not _is_record(value, ("userId", "orgId", "teamId")):
        return None
    if not all(isinstance(value[k], str) and _PRINCIPAL.match(value[k]) for k in ("userId", "orgId", "teamId")):
        return None
    return {"userId": value["userId"], "orgId": value["orgId"], "teamId": value["teamId"]}


def owner_sha256(owner):
    return sha256_hex(json.dumps([owner["userId"], owner["orgId"], owner["teamId"]], separators=(",", ":")))


def origin_valid(value):
    """Absolute http(s) origin only: no userinfo, path, query, fragment or default port. Fixtures use reserved .invalid or loopback names."""
    if not isinstance(value, str) or len(value) > 200 or value != value.lower():
        return False
    try:
        parts = urlsplit(value)
        port = parts.port
    except ValueError:
        return False
    if parts.scheme not in ("http", "https") or not parts.netloc or parts.path or parts.query or parts.fragment or "@" in parts.netloc:
        return False
    if (parts.scheme == "http" and port == 80) or (parts.scheme == "https" and port == 443):
        return False
    host = parts.hostname or ""
    return value == f"{parts.scheme}://{parts.netloc}" and (host.endswith(".invalid") or host in _FIXTURE_HOSTS)


CONFIG_KEYS = (
    "schemaRevision", "policyRevision", "transformRevision", "endpointId", "storeId", "authReference", "authScope", "identityTrust", "production",
    "webOrigin", "proxyPath", "engineOrigin", "engineChallengePath", "engineEvaluatePath", "instanceId", "storeBindingId", "timeoutMs",
    "maxRequestBytes", "maxResponseBytes", "configDigest",
)


def config_digest_of(body):
    return bound_sha256({key: value for key, value in body.items() if key != "configDigest"})


def parse_bound_config(value):
    """Strict config parse that recomputes the digest. Returns a copy or raises ContractError."""
    if not _is_record(value, CONFIG_KEYS):
        raise ContractError("CONFIG_SHAPE")
    checks = (
        value["schemaRevision"] == BOUND_SCHEMA, value["identityTrust"] == IDENTITY_TRUST, value["production"] is False,
        all(_label(value[k]) for k in ("policyRevision", "transformRevision", "endpointId", "storeId", "authReference", "authScope")),
        origin_valid(value["webOrigin"]), origin_valid(value["engineOrigin"]), value["proxyPath"] == BOUND_PROXY_PATH,
        value["engineChallengePath"] == ENGINE_CHALLENGE_PATH, value["engineEvaluatePath"] == ENGINE_EVALUATE_PATH,
        isinstance(value["instanceId"], str) and _UUID.match(value["instanceId"]) is not None, _hash(value["storeBindingId"]),
        isinstance(value["timeoutMs"], int) and not isinstance(value["timeoutMs"], bool) and 1000 <= value["timeoutMs"] <= 30000,
        value["maxRequestBytes"] == MAX_REQUEST_BYTES, value["maxResponseBytes"] == MAX_RESPONSE_BYTES, _hash(value["configDigest"]),
    )
    if not all(checks):
        raise ContractError("CONFIG_INVALID")
    if config_digest_of(value) != value["configDigest"]:
        raise ContractError("CONFIG_DIGEST")
    return dict(value)


def parse_evaluate_request(value):
    if not _is_record(value, ("request_id", "artifact_id", "payload", "cvf_phase", "cvf_risk_level")):
        raise ContractError("EVALUATE_SHAPE")
    payload = value["payload"]
    if (not isinstance(value["request_id"], str) or not isinstance(value["artifact_id"], str) or not _is_record(payload, ("content",))
            or not isinstance(payload["content"], str) or value["cvf_phase"] != "REVIEW" or value["cvf_risk_level"] != "R1"):
        raise ContractError("EVALUATE_INVALID")
    # The excerpt limit counts UTF-16 code units, exactly as the sender's JavaScript slice does.
    if len(payload["content"].encode("utf-16-le", "surrogatepass")) // 2 > 500:
        raise ContractError("EXCERPT_TOO_LONG")
    return {"request_id": value["request_id"], "artifact_id": value["artifact_id"], "payload": {"content": payload["content"]},
            "cvf_phase": "REVIEW", "cvf_risk_level": "R1"}


COMMON_KEYS = ("schema", "kind", "owner", "operationKey", "attemptId", "configDigest", "challengeNonce")
EVALUATE_KEYS = COMMON_KEYS + ("requestSha256", "artifactId", "payloadSha256", "envelopeSha256", "phase", "riskLevel", "instanceId", "storeBindingId", "evaluate")


def parse_wire_request(value):
    """CHALLENGE or EVALUATE request body. Returns a validated copy or raises ContractError."""
    if not isinstance(value, dict) or value.get("schema") != WIRE_SCHEMA or value.get("kind") not in ("CHALLENGE", "EVALUATE"):
        raise ContractError("WIRE_SHAPE")
    if not _is_record(value, COMMON_KEYS if value["kind"] == "CHALLENGE" else EVALUATE_KEYS):
        raise ContractError("WIRE_KEYS")
    owner = copy_owner(value["owner"])
    if (owner is None or not _hash(value["operationKey"]) or not _label(value["attemptId"], _ATTEMPT) or not _hash(value["configDigest"])
            or not _hash(value["challengeNonce"])):
        raise ContractError("WIRE_INVALID")
    base = {"schema": WIRE_SCHEMA, "kind": value["kind"], "owner": owner, "operationKey": value["operationKey"], "attemptId": value["attemptId"],
            "configDigest": value["configDigest"], "challengeNonce": value["challengeNonce"]}
    if value["kind"] == "CHALLENGE":
        return base
    evaluate = parse_evaluate_request(value["evaluate"])
    if (not _hash(value["requestSha256"]) or not _label(value["artifactId"], _ARTIFACT) or not _hash(value["payloadSha256"])
            or not _hash(value["envelopeSha256"]) or value["phase"] != "REVIEW" or value["riskLevel"] != "R1"
            or not isinstance(value["instanceId"], str) or not _UUID.match(value["instanceId"]) or not _hash(value["storeBindingId"])
            or evaluate["request_id"] != value["attemptId"] or evaluate["artifact_id"] != value["artifactId"]
            or bound_sha256(evaluate) != value["payloadSha256"]):
        raise ContractError("EVALUATE_JOIN")
    base.update({"requestSha256": value["requestSha256"], "artifactId": value["artifactId"], "payloadSha256": value["payloadSha256"],
                 "envelopeSha256": value["envelopeSha256"], "phase": "REVIEW", "riskLevel": "R1", "instanceId": value["instanceId"],
                 "storeBindingId": value["storeBindingId"], "evaluate": evaluate})
    return base


def auth_preimage(hop, kind, path, timestamp_ms, nonce, config_digest, body):
    return canonical_ascii([AUTH_TAG, hop, kind, "POST", path, timestamp_ms, nonce, config_digest, sha256_hex(body)])


def compute_signature(key, preimage):
    return hmac.new(key, preimage.encode("ascii"), hashlib.sha256).hexdigest()


def read_auth_headers(headers):
    """headers: a starlette-style object with getlist(). Each header exactly once, a bounded ASCII scalar."""
    values = {}
    for field, name in HEADER_NAMES.items():
        found = headers.getlist(name)
        if len(found) != 1:
            raise ContractError("AUTH_HEADERS")
        values[field] = found[0]
    if (values["hop"] not in ("EXPORT_PROXY", "PROXY_ENGINE") or values["kind"] not in ("REQUEST", "RESPONSE")
            or not re.match(r"^[0-9]{1,16}$", values["timestamp"]) or not _hash(values["nonce"]) or not _hash(values["config"])
            or not _hash(values["signature"])):
        raise ContractError("AUTH_HEADERS")
    values["timestamp"] = int(values["timestamp"])
    return values


def timestamp_fresh(timestamp_ms, now_ms):
    return now_ms - MAX_SKEW_PAST_MS <= timestamp_ms <= now_ms + MAX_SKEW_FUTURE_MS


class ReplayGuard:
    """Bounded replay memory. The key covers key reference, hop, kind, nonce and config. Capacity-full denies; nothing is evicted early."""

    def __init__(self, capacity=MAX_REPLAY_ENTRIES):
        self._seen = {}
        self._capacity = capacity

    def accept(self, key_reference, hop, kind, nonce, config_digest, timestamp_ms, now_ms):
        for key in [k for k, at in self._seen.items() if at < now_ms - MAX_SKEW_PAST_MS]:
            del self._seen[key]
        replay_key = "|".join((key_reference, hop, kind, nonce, config_digest))
        if replay_key in self._seen:
            raise ContractError("REPLAY")
        if len(self._seen) >= self._capacity:
            raise ContractError("REPLAY_CAPACITY")
        self._seen[replay_key] = timestamp_ms


def verify_signed(key_reference, key, guard, expect_hop, expect_kind, path, headers, body, config_digest, now_ms):
    """Verify headers, freshness, config, signature and then replay, in that order. Returns the parsed header values."""
    values = read_auth_headers(headers)
    if values["hop"] != expect_hop or values["kind"] != expect_kind:
        raise ContractError("HOP_KIND")
    if values["config"] != config_digest:
        raise ContractError("CONFIG")
    if not timestamp_fresh(values["timestamp"], now_ms):
        raise ContractError("EXPIRED")
    expected = compute_signature(key, auth_preimage(expect_hop, expect_kind, path, values["timestamp"], values["nonce"], config_digest, body))
    if not hmac.compare_digest(expected, values["signature"]):
        raise ContractError("SIGNATURE")
    guard.accept(key_reference, expect_hop, expect_kind, values["nonce"], values["config"], values["timestamp"], now_ms)
    return values


def sign_message(key, hop, kind, path, body, now_ms, nonce, config_digest):
    signature = compute_signature(key, auth_preimage(hop, kind, path, now_ms, nonce, config_digest, body))
    return {
        "content-type": "application/json", HEADER_NAMES["hop"]: hop, HEADER_NAMES["kind"]: kind, HEADER_NAMES["timestamp"]: str(now_ms),
        HEADER_NAMES["nonce"]: nonce, HEADER_NAMES["config"]: config_digest, HEADER_NAMES["signature"]: signature,
    }
