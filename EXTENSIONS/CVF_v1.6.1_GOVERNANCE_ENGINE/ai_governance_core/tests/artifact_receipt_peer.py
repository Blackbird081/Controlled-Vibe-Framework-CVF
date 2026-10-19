"""Real child process for the bound-receipt proofs. Fixture only: invented keys, a disposable root, in-process ASGI, no listener.

Modes (argv[1]):
  barrier <root> <request_id> [--early-entered-mutant]   production-path peer with the deterministic READY/START_ATTEMPT/ATTEMPTING/ENTERED/COMPLETE barrier
  bridge <root>                                           owns one context and one native connection; serves canonical JSON frames on stdin/stdout
  server-default <root>                                   imports api.server with a scratch ledger env and reports that both bound routes deny by default
"""

import asyncio
import json
import os
import secrets
import sys
import time

from starlette.datastructures import Headers

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from api.artifact_receipt_contract import (  # noqa: E402
    BOUND_PROXY_PATH, BOUND_SCHEMA, ENGINE_CHALLENGE_PATH, ENGINE_EVALUATE_PATH, WIRE_SCHEMA, bound_sha256, canonical_ascii, canonical_bytes, config_digest_of,
    sha256_hex, sign_message,
)
from api.artifact_receipts import BoundReceiptContext, create_fixture_orchestrator, create_router, handle_bound_request  # noqa: E402
from ledger_layer.artifact_receipt_binding import open_bound_ledger  # noqa: E402

PEER_OWNER = {"userId": "peer-user", "orgId": "peer-org", "teamId": "peer-team"}
ENGINE_KEY = b"cvf-bound-peer-engine-key-000001"
KEY_REFERENCE = "peer-engine-key-1"


def emit(value):
    print(value, flush=True)


def make_config(ledger, timeout_ms=4000):
    body = {
        "schemaRevision": BOUND_SCHEMA, "policyRevision": "peer-policy-r1", "transformRevision": "peer-transform-1", "endpointId": "peer-endpoint", "storeId": "peer-store",
        "authReference": "peer-bundle-1", "authScope": "two-hop-peer", "identityTrust": "AUTHENTICATED_DEPLOYMENT_BINDING", "production": False,
        "webOrigin": "http://web.invalid:3000", "proxyPath": BOUND_PROXY_PATH, "engineOrigin": "http://engine.invalid:8100", "engineChallengePath": ENGINE_CHALLENGE_PATH,
        "engineEvaluatePath": ENGINE_EVALUATE_PATH, "instanceId": ledger.instance_id, "storeBindingId": ledger.store_binding_id, "timeoutMs": timeout_ms,
        "maxRequestBytes": 16384, "maxResponseBytes": 32768,
    }
    body["configDigest"] = config_digest_of(body)
    return body


def make_context(ledger, config=None, key=ENGINE_KEY, key_reference=KEY_REFERENCE):
    return BoundReceiptContext(config=config or make_config(ledger), key_reference=key_reference, key=key, ledger=ledger,
                               orchestrator=create_fixture_orchestrator(ledger))


def signed_request(config, wire, key=ENGINE_KEY):
    body = canonical_bytes(wire)
    path = ENGINE_CHALLENGE_PATH if wire["kind"] == "CHALLENGE" else ENGINE_EVALUATE_PATH
    headers = sign_message(key, "PROXY_ENGINE", "REQUEST", path, body, int(time.time() * 1000), secrets.token_hex(32), config["configDigest"])
    return path, headers, body


async def drive(context, request_id):
    """One challenge plus one evaluate through the production handler -> binding -> SqliteLedger path."""
    config = context.config
    evaluate = {"request_id": request_id, "artifact_id": "peer-artifact", "payload": {"content": "peer content"}, "cvf_phase": "REVIEW", "cvf_risk_level": "R1"}
    nonce = secrets.token_hex(32)
    base = {"schema": WIRE_SCHEMA, "owner": PEER_OWNER, "operationKey": sha256_hex(request_id), "attemptId": request_id, "configDigest": config["configDigest"],
            "challengeNonce": nonce}
    path, headers, body = signed_request(config, dict(base, kind="CHALLENGE"))
    first = await handle_bound_request(context, path, Headers(headers=headers), body)
    if first.status != 200:
        raise RuntimeError(f"challenge refused: {first.status} {first.body!r}")
    wire = dict(base, kind="EVALUATE", requestSha256=sha256_hex("peer-request"), artifactId="peer-artifact", payloadSha256=bound_sha256(evaluate),
                envelopeSha256=sha256_hex("peer-envelope"), phase="REVIEW", riskLevel="R1", instanceId=config["instanceId"], storeBindingId=config["storeBindingId"],
                evaluate=evaluate)
    path, headers, body = signed_request(config, wire)
    second = await handle_bound_request(context, path, Headers(headers=headers), body)
    if second.status != 200:
        raise RuntimeError(f"evaluate refused: {second.status} {second.body!r}")


def run_barrier(root, request_id, early):
    ledger = open_bound_ledger(root, reopen=True)
    try:
        context = make_context(ledger)
        emit("READY")
        if sys.stdin.readline().strip() != "START_ATTEMPT":
            raise RuntimeError("Expected START_ATTEMPT")
        if early:
            # One pipe write makes the false entry occur before the parent can observe ATTEMPTING and release its write transaction.
            os.write(sys.stdout.fileno(), f"ATTEMPTING\nENTERED:{time.perf_counter_ns()}\n".encode())
        else:
            emit("ATTEMPTING")
            original = ledger.append_event
            # The production call is unchanged; only the inherited after_acquire seam is used to announce lock acquisition.
            ledger.append_event = lambda event, **kw: original(event, after_acquire=lambda: emit(f"ENTERED:{time.perf_counter_ns()}"), **kw)
        asyncio.run(drive(context, request_id))
        emit("COMPLETE")
    finally:
        ledger.close_binding()


def frame(value):
    print(canonical_ascii(value), flush=True)


def run_bridge(root):
    ledger = open_bound_ledger(root)
    loop = asyncio.new_event_loop()
    context = None
    app = None
    try:
        frame({"kind": "MEASURED", "instanceId": ledger.instance_id, "storeBindingId": ledger.store_binding_id})
        import httpx
        from fastapi import FastAPI
        for line in sys.stdin:
            message = json.loads(line)
            kind = message["kind"]
            if kind == "CONFIGURE":
                context = BoundReceiptContext(config=message["config"], key_reference=message["keyReference"], key=bytes.fromhex(message["keyHex"]), ledger=ledger,
                                              orchestrator=create_fixture_orchestrator(ledger), challenge_capacity=message.get("challengeCapacity", 64))
                app = FastAPI()
                app.include_router(create_router(lambda: context))
                frame({"kind": "READY"})
            elif kind == "REQUEST":
                async def call(msg=message):
                    transport = httpx.ASGITransport(app=app)
                    async with httpx.AsyncClient(transport=transport, base_url="http://engine.invalid") as client:
                        return await client.post(msg["path"], headers=msg["headers"], content=bytes.fromhex(msg["bodyHex"]))
                response = loop.run_until_complete(call())
                frame({"kind": "RESPONSE", "id": message["id"], "status": response.status_code, "headers": {k: v for k, v in response.headers.items()},
                       "bodyHex": response.content.hex()})
            elif kind == "LEDGER":
                chain = ledger.read_chain()
                frame({"kind": "LEDGER", "requestIds": [block["event"]["request_id"] for block in chain], "appended": ledger.appended})
            elif kind == "CLOSE":
                break
    finally:
        ledger.close_binding()
        loop.close()
        frame({"kind": "CLOSED"})


def run_server_default(root):
    ledger_path = os.path.join(root, "server-default-ledger.json")
    previous = os.environ.get("CVF_GOVERNANCE_LEDGER_PATH")
    os.environ["CVF_GOVERNANCE_LEDGER_PATH"] = ledger_path  # bound before import so no active default is initialized
    try:
        import httpx
        import api.server as server
    finally:
        if previous is None:
            os.environ.pop("CVF_GOVERNANCE_LEDGER_PATH", None)
        else:
            os.environ["CVF_GOVERNANCE_LEDGER_PATH"] = previous

    async def run():
        statuses = {}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=server.app), base_url="http://engine.invalid") as client:
            for path in (ENGINE_CHALLENGE_PATH, ENGINE_EVALUATE_PATH):
                response = await client.post(path, content=b"{}", headers={"x-cvf-service-token": "ignored"})
                statuses[path] = [response.status_code, json.loads(response.content)["error"]]
        return statuses

    statuses = asyncio.run(run())
    routes = sorted(route.path for route in server.app.routes if "artifact-receipts" in getattr(route, "path", ""))
    generic = any(getattr(route, "path", "") == "/api/v1/evaluate" for route in server.app.routes)
    frame({"kind": "SERVER_DEFAULT", "statuses": statuses, "routes": routes, "generic": generic, "ledgerPath": ledger_path,
           "restored": os.environ.get("CVF_GOVERNANCE_LEDGER_PATH") == previous})


def main():
    mode = sys.argv[1]
    if mode == "barrier":
        run_barrier(sys.argv[2], sys.argv[3], len(sys.argv) > 4 and sys.argv[4] == "--early-entered-mutant")
    elif mode == "bridge":
        run_bridge(sys.argv[2])
    elif mode == "server-default":
        run_server_default(sys.argv[2])
    else:
        raise SystemExit(f"unknown mode {mode}")


if __name__ == "__main__":
    main()
