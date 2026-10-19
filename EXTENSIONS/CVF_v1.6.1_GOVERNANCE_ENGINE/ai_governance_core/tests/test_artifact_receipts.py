"""Dedicated engine endpoints: strict context, signed challenge/evaluate, actor and risk joins, held default.

All calls are in-process: the pure handler or an ASGI client. The only child process is the default-deny import check. Handlers and the pinned
SQLite connection share the test thread, so thread ownership is honoured rather than bypassed.
"""

import asyncio
import hashlib
import hmac
import json
import os
import secrets
import subprocess
import sys
import tempfile
from pathlib import Path

import httpx
import pytest
from fastapi import FastAPI
from starlette.datastructures import Headers

from api import artifact_receipt_contract as c
from api.artifact_receipts import BoundReceiptContext, create_fixture_orchestrator, create_router, handle_bound_request
from ledger_layer.artifact_receipt_binding import BindingError, open_bound_ledger
from tests import artifact_receipt_peer as peer

CORE = Path(__file__).resolve().parents[1]
ROOTS = Path(__file__).resolve().parents[4] / ".cvf" / "runtime" / "ncr-r2-w05-bound-source-20261019" / "worker" / "py-roots"
KEY = b"cvf-bound-test-engine-key-000001"
OWNER = {"userId": "u1", "orgId": "o1", "teamId": "t1"}
NOW = 1_760_000_000_000
CHALLENGE_PATH, EVALUATE_PATH = c.ENGINE_CHALLENGE_PATH, c.ENGINE_EVALUATE_PATH
ATTEMPT = "ncr-bound-attempt-0001"


class Clock:
    def __init__(self):
        self.t = NOW

    def __call__(self):
        return self.t


class Env:
    def __init__(self, label, capacity=64):
        ROOTS.mkdir(parents=True, exist_ok=True)
        self.root = Path(tempfile.mkdtemp(prefix=f"{label}-", dir=ROOTS)).resolve()
        self.clock = Clock()
        self.ledger = open_bound_ledger(self.root)
        self.ctx = BoundReceiptContext(config=peer.make_config(self.ledger), key_reference="engine-key-1", key=KEY, ledger=self.ledger,
                                       orchestrator=create_fixture_orchestrator(self.ledger), clock_ms=self.clock, challenge_capacity=capacity)
        self.executed = []
        self.payloads = []
        orchestrator = self.ctx._orchestrator
        execute, evaluate = orchestrator.execute, orchestrator.policy_engine.evaluate
        orchestrator.execute = lambda request: (self.executed.append(request.request_id), execute(request))[1]
        orchestrator.policy_engine.evaluate = lambda payload: (self.payloads.append(dict(payload)), evaluate(payload))[1]

    @property
    def config(self):
        return self.ctx.config

    def chain(self):
        return self.ledger.read_chain()

    def wires(self, attempt=ATTEMPT, content="Heading", nonce=None, owner=None):
        evaluate = {"request_id": attempt, "artifact_id": "receipt-anchor", "payload": {"content": content}, "cvf_phase": "REVIEW", "cvf_risk_level": "R1"}
        base = {"schema": c.WIRE_SCHEMA, "owner": dict(owner or OWNER), "operationKey": c.sha256_hex("op-" + attempt), "attemptId": attempt,
                "configDigest": self.config["configDigest"], "challengeNonce": nonce or secrets.token_hex(32)}
        challenge = dict(base, kind="CHALLENGE")
        evaluate_wire = dict(base, kind="EVALUATE", requestSha256=c.sha256_hex("request"), artifactId="receipt-anchor", payloadSha256=c.bound_sha256(evaluate),
                             envelopeSha256=c.sha256_hex("envelope"), phase="REVIEW", riskLevel="R1", instanceId=self.config["instanceId"],
                             storeBindingId=self.config["storeBindingId"], evaluate=evaluate)
        return challenge, evaluate_wire

    def send(self, wire, *, path=None, raw=None, sign_over=None, key=KEY, hop="PROXY_ENGINE", kind="REQUEST", at=None, patch=None, drop=(), nonce=None):
        body = raw if raw is not None else c.canonical_bytes(wire)
        path = path or (CHALLENGE_PATH if wire is not None and wire.get("kind") == "CHALLENGE" else EVALUATE_PATH)
        headers = c.sign_message(key, hop, kind, path, sign_over if sign_over is not None else body, self.clock() if at is None else at, nonce or secrets.token_hex(32),
                                 self.config["configDigest"])
        headers.update(patch or {})
        for name in drop:
            headers.pop(name, None)
        reply = asyncio.run(handle_bound_request(self.ctx, path, Headers(headers=headers), body))
        reply.nonce = headers.get("x-cvf-bound-nonce")
        reply.path = path
        reply.signed = (headers, body)
        return reply


@pytest.fixture
def make_env(request):
    created = []

    def build(label, capacity=64):
        env = Env(label, capacity)
        created.append(env)
        return env
    yield build
    for env in created:
        env.ledger.close_binding()


def error_of(reply):
    return json.loads(reply.body)["error"]


def verified_body(env, reply):
    """The response must be signed for the engine response hop over its exact bytes and echo the request nonce."""
    values = c.read_auth_headers(Headers(headers=reply.headers))
    assert (values["hop"], values["kind"], values["config"]) == ("PROXY_ENGINE", "RESPONSE", env.config["configDigest"])
    expected = c.compute_signature(KEY, c.auth_preimage("PROXY_ENGINE", "RESPONSE", reply.path, values["timestamp"], values["nonce"], env.config["configDigest"], reply.body))
    assert hmac.compare_digest(expected, values["signature"])
    body = c.parse_canonical_json(reply.body, c.MAX_RESPONSE_BYTES)
    assert body["requestNonce"] == reply.nonce
    return body


def test_every_request_is_denied_without_an_injected_context():
    headers = c.sign_message(KEY, "PROXY_ENGINE", "REQUEST", CHALLENGE_PATH, b"{}", NOW, "a" * 64, "b" * 64)
    reply = asyncio.run(handle_bound_request(None, CHALLENGE_PATH, Headers(headers=headers), b"{}"))
    assert (reply.status, error_of(reply)) == (503, "BOUND_RECEIPT_NOT_ACTIVATED")

    async def over_asgi():
        app = FastAPI()
        app.include_router(create_router(lambda: None))
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://engine.invalid") as client:
            return [(await client.post(path, content=b"{}", headers=headers)).status_code for path in (CHALLENGE_PATH, EVALUATE_PATH)], (await client.get(CHALLENGE_PATH)).status_code
    assert asyncio.run(over_asgi()) == ([503, 503], 405)


def test_context_is_built_only_from_a_measured_ledger_with_a_matching_config_and_key(make_env):
    env = make_env("ctx")
    other = make_env("ctx-other")
    base = dict(config=env.config, key_reference="engine-key-1", key=KEY, ledger=env.ledger, orchestrator=env.ctx._orchestrator)

    def rebuilt(**patch):
        return BoundReceiptContext(**dict(base, **patch))
    assert rebuilt() is not None

    def with_config(**patch):
        body = {k: v for k, v in dict(env.config, **patch).items() if k != "configDigest"}
        return dict(body, configDigest=c.config_digest_of(body))
    bad = {
        "other ledger object": dict(ledger=other.ledger), "orchestrator on another ledger": dict(orchestrator=other.ctx._orchestrator),
        "plain object ledger": dict(ledger=object()), "other instance": dict(config=with_config(instanceId="12345678-1234-4234-8234-123456789abc")),
        "other store": dict(config=with_config(storeBindingId="cd" * 32)), "digest drift": dict(config=dict(env.config, configDigest="f" * 64)),
        "weak key": dict(key=b"short"), "string key": dict(key="k" * 32), "empty key reference": dict(key_reference=""),
    }
    for name, patch in bad.items():
        with pytest.raises(c.ContractError):
            rebuilt(**patch)
        assert name


def test_challenge_issues_a_signed_measured_challenge_without_touching_the_ledger(make_env):
    env = make_env("challenge")
    challenge, _ = env.wires()
    reply = env.send(challenge)
    assert reply.status == 200
    body = verified_body(env, reply)
    assert set(body) == {"schema", "kind", "requestNonce", "challengeNonce", "configDigest", "instanceId", "storeBindingId", "backend", "policyRevision", "expiresAtMs"}
    assert body["kind"] == "CHALLENGE_RESULT" and body["backend"] == "SQLITE" and body["challengeNonce"] == challenge["challengeNonce"]
    assert (body["instanceId"], body["storeBindingId"]) == (env.ledger.instance_id, env.ledger.store_binding_id)
    assert body["expiresAtMs"] == NOW + 5000 and body["policyRevision"] == env.config["policyRevision"]
    assert env.chain() == [] and env.ledger.appended == 0 and env.executed == []


def test_evaluate_commits_one_block_whose_metadata_joins_the_signed_result(make_env):
    env = make_env("evaluate")
    challenge, evaluate = env.wires()
    assert env.send(challenge).status == 200
    reply = env.send(evaluate)
    assert reply.status == 200
    body = verified_body(env, reply)
    chain = env.chain()
    assert len(chain) == 1 and env.ledger.appended == 1 and env.executed == [ATTEMPT]
    event = chain[0]["event"]
    metadata = {"operationKey": evaluate["operationKey"], "attemptId": ATTEMPT, "envelopeSha256": evaluate["envelopeSha256"], "ownerSha256": c.owner_sha256(OWNER),
                "configDigest": env.config["configDigest"], "storeBindingId": env.ledger.store_binding_id, "instanceId": env.ledger.instance_id,
                "payloadSha256": evaluate["payloadSha256"]}
    assert event["request_id"] == ATTEMPT and event["bound_receipt"] == metadata
    assert event["cvf_phase"] == "REVIEW" and event["cvf_risk_level"] == "R1"  # the requested class is recorded as requested
    assert body["ledgerReference"] == {"requestId": ATTEMPT, "blockHash": chain[0]["hash"]}
    assert (body["operationKey"], body["attemptId"], body["artifactId"], body["payloadSha256"], body["envelopeSha256"], body["owner"]) == (
        evaluate["operationKey"], ATTEMPT, "receipt-anchor", evaluate["payloadSha256"], evaluate["envelopeSha256"], OWNER)
    assert (body["configDigest"], body["instanceId"], body["storeBindingId"]) == (env.config["configDigest"], env.ledger.instance_id, env.ledger.store_binding_id)
    # The computed engine risk is reported separately and is never overwritten by the requested R1.
    assert body["declaredRisk"] == "R1" and body["engineRiskLevel"] == "R0" == body["report"]["cvf_risk_level"]
    assert body["report"]["decision_analysis"]["final_decision"] == "ALLOW" == body["executionRecord"]["final_decision"]
    assert body["report"]["cvf_enforcement"]["action"] == c.EXPECTED_ACTION["ALLOW"]
    assert body["report"]["request_summary"] == {"request_id": ATTEMPT, "artifact_id": "receipt-anchor"}
    assert body["report"]["integrity"] == {"has_ledger_reference": True} and body["executionRecord"]["ledger_attached"] is True
    # The actor comes from the authenticated owner digest in a server-created payload; the wire has no actor field to override it.
    assert env.payloads == [{"content": "Heading", "actor_id": f"owner-{c.owner_sha256(OWNER)}"}]
    assert env.ledger.committed_block(ATTEMPT, metadata) == chain[0]
    assert env.ledger.committed_block(ATTEMPT, dict(metadata, instanceId="other")) is None


def test_an_owner_change_changes_the_server_derived_actor(make_env):
    env = make_env("actor")
    other_owner = {"userId": "u2", "orgId": "o1", "teamId": "t1"}
    for owner, attempt in ((OWNER, "ncr-bound-attempt-0001"), (other_owner, "ncr-bound-attempt-0002")):
        challenge, evaluate = env.wires(attempt=attempt, owner=owner)
        assert env.send(challenge).status == 200 and env.send(evaluate).status == 200
    assert [p["actor_id"] for p in env.payloads] == [f"owner-{c.owner_sha256(OWNER)}", f"owner-{c.owner_sha256(other_owner)}"]


def refused(env, run, status, code, executed=0, blocks=0):
    reply = run(env)
    assert (reply.status, error_of(reply)) == (status, code)
    assert len(env.executed) == executed and len(env.chain()) == blocks and env.ledger.appended == blocks
    return reply


def after_challenge(env, **patch):
    challenge, evaluate = env.wires()
    assert env.send(challenge).status == 200
    return challenge, dict(evaluate, **patch)


FAILURES = {
    "bad key": (lambda e: e.send(e.wires()[0], key=b"another-key-another-key-another-1"), 401, "SIGNATURE"),
    "missing header": (lambda e: e.send(e.wires()[0], drop=("x-cvf-bound-signature",)), 401, "AUTH_HEADERS"),
    "export hop": (lambda e: e.send(e.wires()[0], hop="EXPORT_PROXY"), 401, "HOP_KIND"),
    "response kind": (lambda e: e.send(e.wires()[0], kind="RESPONSE"), 401, "HOP_KIND"),
    "expired": (lambda e: e.send(e.wires()[0], at=NOW - 30001), 401, "EXPIRED"),
    "future": (lambda e: e.send(e.wires()[0], at=NOW + 1001), 401, "EXPIRED"),
    "config header": (lambda e: e.send(e.wires()[0], patch={"x-cvf-bound-config": "f" * 64}), 401, "CONFIG"),
    "tampered body": (lambda e: e.send(e.wires()[0], sign_over=b"{}"), 401, "SIGNATURE"),
    "unknown path": (lambda e: e.send(e.wires()[0], path="/api/v1/artifact-receipts/other"), 422, "PATH"),
    "oversize": (lambda e: e.send(None, raw=b" " * 16385, path=CHALLENGE_PATH), 413, "OVERSIZE_BODY"),
    "non canonical": (lambda e: e.send(None, raw=json.dumps(e.wires()[0], indent=1).encode(), path=CHALLENGE_PATH), 422, "NOT_CANONICAL"),
    "duplicate key": (lambda e: e.send(None, raw=b'{"a":1,"a":2}', path=CHALLENGE_PATH), 422, "DUPLICATE_KEY"),
    "float": (lambda e: e.send(None, raw=b'{"a":1.5}', path=CHALLENGE_PATH), 422, "FRACTIONAL_NUMBER"),
    "actor override on the wire": (lambda e: e.send(dict(e.wires()[0], actor_id="root")), 422, "WIRE_KEYS"),
    "challenge wire at evaluate path": (lambda e: e.send(e.wires()[0], path=EVALUATE_PATH), 422, "WIRE_JOIN"),
    "evaluate wire at challenge path": (lambda e: e.send(e.wires()[1], path=CHALLENGE_PATH), 422, "WIRE_JOIN"),
    "body config digest": (lambda e: e.send(dict(e.wires()[0], configDigest="f" * 64)), 422, "WIRE_JOIN"),
    "evaluate without challenge": (lambda e: e.send(e.wires()[1]), 422, "CHALLENGE_UNKNOWN"),
    "evaluate for another instance": (lambda e: e.send(after_challenge(e, instanceId="12345678-1234-4234-8234-123456789abc")[1]), 422, "STORE_MISMATCH"),
    "evaluate for another store": (lambda e: e.send(after_challenge(e, storeBindingId="cd" * 32)[1]), 422, "STORE_MISMATCH"),
    "evaluate with another owner": (lambda e: e.send(after_challenge(e, owner={"userId": "u2", "orgId": "o1", "teamId": "t1"})[1]), 422, "CHALLENGE_JOIN"),
    "evaluate with another operation": (lambda e: e.send(after_challenge(e, operationKey="e" * 64)[1]), 422, "CHALLENGE_JOIN"),
}


@pytest.mark.parametrize("name", sorted(FAILURES))
def test_refusals_run_nothing_and_commit_nothing(make_env, name):
    run, status, code = FAILURES[name]
    refused(make_env("refuse"), run, status, code)


def test_a_challenge_is_single_use_expiring_and_bounded(make_env):
    env = make_env("challenges", capacity=2)
    challenge, evaluate = env.wires()
    assert env.send(challenge).status == 200
    replay_nonce = env.send(dict(challenge, attemptId="ncr-bound-attempt-0002"), nonce=None)
    assert (replay_nonce.status, error_of(replay_nonce)) == (409, "CHALLENGE_REPLAY")
    assert env.send(evaluate).status == 200
    again = env.send(evaluate)
    assert (again.status, error_of(again)) == (409, "CHALLENGE_USED")
    assert len(env.chain()) == 1
    # A fresh challenge for the same attempt cannot produce a second effect: the attempt is already recorded.
    second, second_evaluate = env.wires(nonce=secrets.token_hex(32))
    assert env.send(second).status == 200
    recorded = env.send(second_evaluate)
    assert (recorded.status, error_of(recorded)) == (409, "ATTEMPT_ALREADY_RECORDED") and len(env.chain()) == 1 and env.executed == [ATTEMPT]
    full = env.send(env.wires(attempt="ncr-bound-attempt-0003")[0])
    assert (full.status, error_of(full)) == (409, "CHALLENGE_CAPACITY")
    env.clock.t = NOW + 40_000  # expired entries leave the bounded table once outside the accepted window
    assert env.send(env.wires(attempt="ncr-bound-attempt-0003")[0]).status == 200


def test_an_expired_challenge_is_refused_and_still_consumed(make_env):
    env = make_env("expiry")
    challenge, evaluate = env.wires()
    assert env.send(challenge).status == 200
    env.clock.t = NOW + 5001
    late = env.send(evaluate)
    assert (late.status, error_of(late)) == (422, "CHALLENGE_EXPIRED")
    assert env.send(evaluate).status == 409 and env.chain() == [] and env.executed == []


def test_a_replayed_signed_request_is_refused_with_no_second_effect(make_env):
    env = make_env("replay")
    challenge, _ = env.wires()
    first = env.send(challenge)
    assert first.status == 200
    headers, body = first.signed
    replay = asyncio.run(handle_bound_request(env.ctx, first.path, Headers(headers=headers), body))
    assert (replay.status, error_of(replay)) == (409, "REPLAY")


def test_a_closed_or_changed_binding_denies_and_a_commit_without_a_response_is_visible_as_unknown(make_env):
    closed = make_env("closed")
    closed.ledger.close_binding()
    reply = closed.send(closed.wires()[0])
    assert (reply.status, error_of(reply)) == (409, "BINDING_CLOSED")
    with pytest.raises(BindingError):
        closed.ledger.read_chain()
    pre = make_env("changed-pre")
    challenge, evaluate = pre.wires()
    assert pre.send(challenge).status == 200

    def changed(*_args):
        raise BindingError("BINDING_CHANGED")
    pre.ledger.verify_binding = changed
    denied = pre.send(evaluate)
    assert (denied.status, error_of(denied)) == (409, "BINDING_CHANGED") and pre.executed == [] and pre.ledger.appended == 0
    # The binding fails after the commit and before signing: the effect exists, the response does not, so the caller must treat the outcome as unknown.
    post = make_env("changed-post")
    challenge, evaluate = post.wires()
    assert post.send(challenge).status == 200
    verify, calls = post.ledger.verify_binding, []

    def fail_on_final(*args):
        calls.append(1)
        if len(calls) >= 4:
            raise BindingError("BINDING_CHANGED")
        return verify(*args)
    post.ledger.verify_binding = fail_on_final
    lost = post.send(evaluate)
    assert (lost.status, error_of(lost)) == (409, "BINDING_CHANGED")
    del post.ledger.verify_binding
    assert [block["event"]["request_id"] for block in post.chain()] == [ATTEMPT] and post.ledger.appended == 1


def test_asgi_router_serves_both_endpoints_and_refuses_wrong_methods_and_oversize_declarations(make_env):
    env = make_env("asgi")
    challenge, evaluate = env.wires()

    async def run():
        app = FastAPI()
        app.include_router(create_router(lambda: env.ctx))
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://engine.invalid") as client:
            results = []
            for wire, path in ((challenge, CHALLENGE_PATH), (evaluate, EVALUATE_PATH)):
                body = c.canonical_bytes(wire)
                headers = c.sign_message(KEY, "PROXY_ENGINE", "REQUEST", path, body, env.clock(), secrets.token_hex(32), env.config["configDigest"])
                results.append(await client.post(path, content=body, headers=headers))
            results.append(await client.put(CHALLENGE_PATH, content=b"{}"))
            results.append(await client.post(CHALLENGE_PATH, content=b" " * 17000))
            return results
    first, second, put, big = asyncio.run(run())
    assert (first.status_code, second.status_code, put.status_code, big.status_code) == (200, 200, 405, 413)
    assert first.headers["x-cvf-bound-kind"] == "RESPONSE" and first.headers["cache-control"] == "no-store"
    assert json.loads(second.content)["kind"] == "EVALUATE_RESULT" and len(env.chain()) == 1


def test_default_server_denies_both_routes_and_never_initializes_active_data(make_env):
    env = make_env("server-default")
    active = CORE / "ledger_layer" / "ledger_chain.json"
    before = hashlib.sha256(active.read_bytes()).hexdigest() if active.exists() else None
    done = subprocess.run([sys.executable, str(Path(__file__).with_name("artifact_receipt_peer.py")), "server-default", str(env.root)], capture_output=True, text=True,
                          timeout=120, cwd=str(CORE), env={**os.environ, "PYTHONPATH": str(CORE)})
    assert done.returncode == 0, done.stderr
    report = json.loads(done.stdout.strip().splitlines()[-1])
    assert report["statuses"] == {CHALLENGE_PATH: [503, "BOUND_RECEIPT_NOT_ACTIVATED"], EVALUATE_PATH: [503, "BOUND_RECEIPT_NOT_ACTIVATED"]}
    assert report["routes"] == [CHALLENGE_PATH, EVALUATE_PATH] and report["restored"] is True and report["generic"] is True
    assert Path(report["ledgerPath"]).parent == env.root
    assert (hashlib.sha256(active.read_bytes()).hexdigest() if active.exists() else None) == before
