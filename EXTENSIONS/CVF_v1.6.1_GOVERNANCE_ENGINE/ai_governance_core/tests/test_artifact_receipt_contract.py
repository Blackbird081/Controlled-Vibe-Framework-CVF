"""Engine-side contract proofs against the SAME vector file the TypeScript side asserts independently."""

import hashlib
import json
from pathlib import Path

import pytest
from starlette.datastructures import Headers

from api import artifact_receipt_contract as c

VECTORS = json.loads((Path(__file__).resolve().parents[3] / "CVF_v1.6_AGENT_PLATFORM" / "cvf-web" / "src" / "test" / "fixtures" / "artifact-bound-receipt-v1.json")
                     .read_text(encoding="ascii"))
KEY = VECTORS["hmacKeyAscii"].encode("ascii")
CONFIG_DIGEST = VECTORS["config"]["configDigest"]
NOW = 1_760_000_000_000


def sha(data):
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode("utf-8")).hexdigest()


@pytest.mark.parametrize("case", VECTORS["canonical"], ids=lambda case: case["id"])
def test_canonical_vectors_match_exact_text_hex_digest_and_strict_round_trip(case):
    assert c.canonical_ascii(case["input"]) == case["canonicalAscii"]
    assert c.canonical_bytes(case["input"]).hex() == case["canonicalHex"]
    assert c.bound_sha256(case["input"]) == case["sha256"]
    assert c.parse_canonical_json(bytes.fromhex(case["canonicalHex"]), 1000) == case["input"]


def test_excerpt_boundary_counts_utf16_units_including_a_lone_surrogate():
    excerpt = VECTORS["excerpt"]
    source = excerpt["prefixChar"] * excerpt["prefixCount"] + excerpt["tail"]
    sliced = source.encode("utf-16-le", "surrogatepass")[: excerpt["sliceUnits"] * 2].decode("utf-16-le", "surrogatepass")
    assert len(sliced) == 500 and sliced.endswith("\ud83d")
    assert c.canonical_ascii(sliced) == excerpt["canonicalAscii"]
    assert c.bound_sha256(sliced) == excerpt["sha256"]
    request = {"request_id": "ncr-bound-attempt-1", "artifact_id": "a", "payload": {"content": sliced}, "cvf_phase": "REVIEW", "cvf_risk_level": "R1"}
    assert c.parse_evaluate_request(request)["payload"]["content"] == sliced
    over = dict(request, payload={"content": sliced + "x"})
    with pytest.raises(c.ContractError, match="EXCERPT_TOO_LONG"):
        c.parse_evaluate_request(over)
    # 251 astral characters are 502 UTF-16 units even though they are fewer than 500 code points.
    astral = dict(request, payload={"content": "\U0001F600" * 251})
    with pytest.raises(c.ContractError, match="EXCERPT_TOO_LONG"):
        c.parse_evaluate_request(astral)


@pytest.mark.parametrize("case", VECTORS["malformed"], ids=lambda case: case["id"])
def test_malformed_input_is_refused_before_any_effect(case):
    with pytest.raises(c.ContractError):
        c.parse_canonical_json(bytes.fromhex(case["rawHex"]), 1000)


def test_refusal_classes_and_byte_cap_are_specific():
    expected = {"duplicate-key": "DUPLICATE_KEY", "fraction": "FRACTIONAL_NUMBER", "exponent": "FRACTIONAL_NUMBER", "nan": "NON_FINITE_NUMBER", "invalid-utf8": "INVALID_UTF8",
                "empty": "EMPTY_BODY", "bom-prefix": "INVALID_JSON", "trailing-garbage": "INVALID_JSON", "unsafe-integer": "NOT_CANONICAL", "whitespace": "NOT_CANONICAL",
                "unsorted-keys": "NOT_CANONICAL", "uppercase-escape": "NOT_CANONICAL", "raw-non-ascii": "NOT_CANONICAL", "raw-del": "NOT_CANONICAL", "negative-zero": "NOT_CANONICAL"}
    for case in VECTORS["malformed"]:
        with pytest.raises(c.ContractError) as info:
            c.parse_canonical_json(bytes.fromhex(case["rawHex"]), 1000)
        assert info.value.code == expected[case["id"]], case["id"]
    with pytest.raises(c.ContractError, match="OVERSIZE_BODY"):
        c.parse_canonical_json(b'{"a":1}', 3)
    with pytest.raises(c.ContractError, match="EMPTY_BODY"):
        c.parse_canonical_json("not bytes", 3)


def test_non_canonical_values_and_keys_are_refused_and_sorting_is_ordinal():
    for bad in (1.5, float("nan"), float("inf"), 2 ** 53, -(2 ** 53), object(), {"a": object()}, {chr(0xE9): 1}, {1: 2}):
        with pytest.raises((c.ContractError, ValueError)):
            c.canonical_ascii(bad)
    assert c.canonical_ascii({"b": 1, "a": 2, "B": 3, "_": 4}) == '{"B":3,"_":4,"a":2,"b":1}'
    assert c.canonical_ascii([None, True, False, 0, "x"]) == '[null,true,false,0,"x"]'


def test_config_vector_digest_and_drift_refusals():
    body = json.loads(VECTORS["config"]["canonicalBody"])
    assert c.config_digest_of(body) == CONFIG_DIGEST
    config = dict(body, configDigest=CONFIG_DIGEST)
    assert c.parse_bound_config(config) == config
    for name, patch in {
        "digest": {"configDigest": "f" * 64}, "extra": {"extra": 1}, "path": {"webOrigin": "http://web.invalid:3000/x"}, "query": {"webOrigin": "http://web.invalid:3000?x=1"},
        "userinfo": {"engineOrigin": "http://u:p@engine.invalid:8100"}, "default port": {"engineOrigin": "http://engine.invalid:80"}, "real host": {"engineOrigin": "http://example.com:8100"},
        "uppercase": {"engineOrigin": "http://ENGINE.invalid:8100"}, "ftp": {"engineOrigin": "ftp://engine.invalid:8100"}, "proxy path": {"proxyPath": "/api/governance/evaluate"},
        "challenge path": {"engineChallengePath": "/api/v1/evaluate"}, "production": {"production": True}, "trust": {"identityTrust": "DECLARED_UNATTESTED"},
        "schema": {"schemaRevision": "cvf.artifactsReceiptOperation.v1"}, "short timeout": {"timeoutMs": 999}, "long timeout": {"timeoutMs": 30001}, "bool timeout": {"timeoutMs": True},
        "request cap": {"maxRequestBytes": 16385}, "response cap": {"maxResponseBytes": 1}, "store case": {"storeBindingId": "AB" * 32}, "instance": {"instanceId": "nope"},
        "label": {"endpointId": "bad label"},
    }.items():
        with pytest.raises(c.ContractError):
            c.parse_bound_config(dict(config, **patch))
        assert name
    with pytest.raises(c.ContractError):
        c.parse_bound_config(None)


def test_operation_key_serialization_and_wire_bodies_match_the_shared_vectors():
    parts = VECTORS["operation"]["parts"]
    serialization = c.canonical_ascii(["cvf.artifactsBoundReceiptOperation.v1", parts["owner"]["userId"], parts["owner"]["orgId"], parts["owner"]["teamId"],
                                       parts["sourceRecordId"], parts["requestSha256"], "BOUND_ENGINE_RECEIPT"])
    assert serialization == VECTORS["operation"]["serialization"]
    assert sha(serialization) == VECTORS["operation"]["operationKey"]
    wire = VECTORS["wire"]
    assert c.bound_sha256(json.loads(wire["evaluate"]["canonicalAscii"])) == wire["evaluate"]["payloadSha256"]
    challenge = c.parse_wire_request(json.loads(wire["challenge"]["canonicalAscii"]))
    assert challenge["kind"] == "CHALLENGE" and sha(c.canonical_ascii(challenge)) == wire["challenge"]["sha256"]
    evaluate = c.parse_wire_request(json.loads(wire["evaluateWire"]["canonicalAscii"]))
    assert evaluate["kind"] == "EVALUATE" and c.canonical_ascii(evaluate) == wire["evaluateWire"]["canonicalAscii"]
    assert sha(wire["evaluateWire"]["canonicalAscii"]) == wire["evaluateWire"]["sha256"]


def test_wire_mutations_are_refused():
    wire = VECTORS["wire"]
    challenge = json.loads(wire["challenge"]["canonicalAscii"])
    evaluate = json.loads(wire["evaluateWire"]["canonicalAscii"])
    request = evaluate["evaluate"]
    longer = dict(request, payload={"content": "y" * 501})
    bad = {
        "challenge with evaluate key": dict(challenge, requestSha256="a" * 64), "unknown kind": dict(challenge, kind="LOOKUP"), "schema": dict(challenge, schema="cvf.boundReceiptWire.v2"),
        "config": dict(challenge, configDigest="x"), "nonce": dict(challenge, challengeNonce="A" * 64), "payload digest": dict(evaluate, payloadSha256="a" * 64),
        "request id": dict(evaluate, evaluate=dict(request, request_id="ncr-bound-other-attempt")), "artifact": dict(evaluate, evaluate=dict(request, artifact_id="other")),
        "phase": dict(evaluate, phase="BUILD"), "risk": dict(evaluate, riskLevel="R2"), "evaluate risk": dict(evaluate, evaluate=dict(request, cvf_risk_level="R0")),
        "extra": dict(evaluate, extra=1), "instance": dict(evaluate, instanceId="x"), "actor override": dict(evaluate, evaluate=dict(request, payload={"content": "c", "actor_id": "root"})),
        "excerpt": dict(evaluate, evaluate=longer, payloadSha256=c.bound_sha256(longer)), "owner extra": dict(evaluate, owner=dict(evaluate["owner"], role="admin")),
    }
    for name, value in bad.items():
        with pytest.raises(c.ContractError):
            c.parse_wire_request(value)
        assert name
    with pytest.raises(c.ContractError):
        c.parse_wire_request(None)


@pytest.mark.parametrize("vector", VECTORS["hmac"], ids=lambda vector: vector["id"])
def test_hmac_vectors_sign_the_exact_shared_preimage_and_cannot_cross_hops(vector):
    text = VECTORS["wire"]["challenge" if vector["id"].startswith("export") else "evaluateWire"]["canonicalAscii"]
    body = text.encode("ascii")
    assert sha(body) == vector["bodySha256"]
    args = (vector["hop"], vector["kind"], vector["path"], vector["timestampMs"], vector["nonce"], CONFIG_DIGEST, body)
    preimage = c.auth_preimage(*args)
    assert preimage == vector["preimage"]
    assert c.compute_signature(KEY, preimage) == vector["signature"]
    other_hop = "PROXY_ENGINE" if vector["hop"] == "EXPORT_PROXY" else "EXPORT_PROXY"
    other_kind = "RESPONSE" if vector["kind"] == "REQUEST" else "REQUEST"
    variants = [(other_hop,) + args[1:], (args[0], other_kind) + args[2:], args[:2] + (args[2] + "x",) + args[3:], args[:3] + (args[3] + 1,) + args[4:],
                args[:5] + ("f" * 64, body), args[:6] + (body + b" ",)]
    for variant in variants:
        assert c.compute_signature(KEY, c.auth_preimage(*variant)) != vector["signature"]


def test_auth_headers_must_be_present_once_and_well_formed():
    good = {"x-cvf-bound-hop": "EXPORT_PROXY", "x-cvf-bound-kind": "REQUEST", "x-cvf-bound-timestamp": "1760000000000", "x-cvf-bound-nonce": "a" * 64,
            "x-cvf-bound-config": CONFIG_DIGEST, "x-cvf-bound-signature": "b" * 64}
    values = c.read_auth_headers(Headers(headers=good))
    assert values["timestamp"] == 1_760_000_000_000 and values["hop"] == "EXPORT_PROXY"
    for name in good:
        trimmed = {k: v for k, v in good.items() if k != name}
        with pytest.raises(c.ContractError, match="AUTH_HEADERS"):
            c.read_auth_headers(Headers(headers=trimmed))
    duplicate = Headers(raw=[(k.encode(), v.encode()) for k, v in good.items()] + [(b"x-cvf-bound-nonce", b"c" * 64)])
    with pytest.raises(c.ContractError, match="AUTH_HEADERS"):
        c.read_auth_headers(duplicate)
    for patch in ({"x-cvf-bound-hop": "ENGINE"}, {"x-cvf-bound-kind": "RESPONSEX"}, {"x-cvf-bound-timestamp": "12.5"}, {"x-cvf-bound-timestamp": "12345678901234567"},
                  {"x-cvf-bound-nonce": "A" * 64}, {"x-cvf-bound-config": "x"}, {"x-cvf-bound-signature": "b" * 65}):
        with pytest.raises(c.ContractError, match="AUTH_HEADERS"):
            c.read_auth_headers(Headers(headers=dict(good, **patch)))
    assert c.timestamp_fresh(NOW - 30000, NOW) and not c.timestamp_fresh(NOW - 30001, NOW)
    assert c.timestamp_fresh(NOW + 1000, NOW) and not c.timestamp_fresh(NOW + 1001, NOW)


def _signed(path="/p", body=b'{"a":1}', at=NOW, nonce=None, hop="PROXY_ENGINE", kind="REQUEST", key=KEY):
    nonce = nonce or "d" * 64
    return c.sign_message(key, hop, kind, path, body, at, nonce, CONFIG_DIGEST), body


def test_verification_order_replay_memory_and_capacity():
    guard = c.ReplayGuard()
    headers, body = _signed()

    def verify(headers, body, now=NOW, expect_hop="PROXY_ENGINE", expect_kind="REQUEST"):
        return c.verify_signed("key-ref", KEY, guard, expect_hop, expect_kind, "/p", Headers(headers=headers), body, CONFIG_DIGEST, now)

    for label, run, code in (
        ("body", lambda: verify(headers, b'{"a":2}'), "SIGNATURE"), ("hop", lambda: verify(headers, body, expect_hop="EXPORT_PROXY"), "HOP_KIND"),
        ("kind", lambda: verify(headers, body, expect_kind="RESPONSE"), "HOP_KIND"), ("config", lambda: verify(dict(headers, **{"x-cvf-bound-config": "f" * 64}), body), "CONFIG"),
        ("expired", lambda: verify(headers, body, now=NOW + 30001), "EXPIRED"), ("future", lambda: verify(_signed(at=NOW + 1001)[0], body), "EXPIRED"),
        ("key", lambda: verify(_signed(key=b"another-key-another-key-another-1")[0], body), "SIGNATURE"),
    ):
        with pytest.raises(c.ContractError) as info:
            run()
        assert info.value.code == code, label
    assert verify(headers, body)["nonce"] == "d" * 64  # failed verification above did not consume the nonce
    with pytest.raises(c.ContractError, match="REPLAY"):
        verify(headers, body)
    full = c.ReplayGuard(capacity=3)
    for index in range(3):
        full.accept("k", "PROXY_ENGINE", "REQUEST", f"{index:064x}", CONFIG_DIGEST, NOW, NOW)
    with pytest.raises(c.ContractError, match="REPLAY_CAPACITY"):
        full.accept("k", "PROXY_ENGINE", "REQUEST", f"{9:064x}", CONFIG_DIGEST, NOW, NOW)
    full.accept("k", "PROXY_ENGINE", "REQUEST", f"{9:064x}", CONFIG_DIGEST, NOW + 40000, NOW + 40000)  # old entries left the accepted window
