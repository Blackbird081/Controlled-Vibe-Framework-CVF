"""Dedicated engine endpoints for the offline bound receipt (challenge and evaluate).

The router is mounted by api.server with a context resolver that always returns no context, so the deployed app denies both endpoints.
A fixture injects a BoundReceiptContext. The handler is a pure async function over raw bytes so tests exercise the exact production path
without a listener. Handlers run on the event-loop thread, which is also the thread that owns the pinned SQLite connection.
"""

import asyncio
import math
import secrets
import weakref
import time
from types import MappingProxyType

from fastapi import APIRouter, Request
from fastapi.responses import Response

from adapters.cvf_enforcement_adapter import CVFEnforcementAdapter
from adapters.cvf_risk_adapter import CVFRiskAdapter
from api.artifact_receipt_contract import (
    CHALLENGE_TTL_MS, ENGINE_CHALLENGE_PATH, ENGINE_EVALUATE_PATH, EXPECTED_ACTION, MAX_REQUEST_BYTES, MAX_RESPONSE_BYTES, WIRE_SCHEMA,
    ContractError, ReplayGuard, canonical_bytes, copy_owner, owner_sha256, parse_bound_config, parse_canonical_json, parse_wire_request,
    sign_message, verify_signed,
)
from core_orchestrator import CoreOrchestrator, GovernanceRequest
from ledger_layer.artifact_receipt_binding import BindingError, BoundSqliteLedger

MAX_PENDING_CHALLENGES = 64
_CONTEXT_TOKEN = object()
_ORCHESTRATOR_TOKEN = object()
_CONTEXTS = weakref.WeakKeyDictionary()
_ORCHESTRATOR_LEDGERS = weakref.WeakKeyDictionary()
_INGRESS_BUDGETS = weakref.WeakKeyDictionary()
_AUTH_CODES = {"AUTH_HEADERS", "HOP_KIND", "CONFIG", "EXPIRED", "SIGNATURE"}
_CONFLICT_CODES = {"REPLAY", "REPLAY_CAPACITY", "CHALLENGE_REPLAY", "CHALLENGE_CAPACITY", "CHALLENGE_USED", "ATTEMPT_ALREADY_RECORDED"}


class Reply:
    """A fully formed response. Error replies are unsigned and carry only a bounded deny code."""

    def __init__(self, status, headers, body):
        self.status = status
        self.headers = headers
        self.body = body


def _error(status, code):
    return Reply(status, {"content-type": "application/json", "cache-control": "no-store"},
                 canonical_bytes({"schema": WIRE_SCHEMA, "kind": "ERROR", "error": code}))


def _status_for(code):
    if code in _AUTH_CODES:
        return 401
    if code in _CONFLICT_CODES:
        return 409
    if code == "OVERSIZE_BODY":
        return 413
    return 422


class _SealedOrchestrator(CoreOrchestrator):
    """The base pipeline resolves its actual writer through private factory state."""

    @property
    def ledger(self):
        return _ORCHESTRATOR_LEDGERS[self]

    @ledger.setter
    def ledger(self, value):
        if _ORCHESTRATOR_LEDGERS.get(self) is not value:
            raise BindingError("CONTEXT_LEDGER_SEALED")

    def seal(self, ledger, token):
        if token is not _ORCHESTRATOR_TOKEN or self.ledger is not ledger:
            raise ContractError("CONTEXT_LEDGER")
        return self


def _new_orchestrator(ledger, **components):
    core = object.__new__(_SealedOrchestrator)
    _ORCHESTRATOR_LEDGERS[core] = ledger
    CoreOrchestrator.__init__(core, ledger=ledger, **components)
    return core


def create_fixture_orchestrator(ledger):
    """The same components api.server wires, over the bound ledger. Fixtures only; the deployed server never calls this."""
    from approval_layer.approval_workflow import ApprovalStep, ApprovalWorkflow, RiskLevel
    from domain_layer.domain_registry import DomainRegistry
    from enforcement_layer.action_router import ActionRouter
    from enforcement_layer.decision_matrix import DecisionMatrix
    from policy_layer.base_policy import BasePolicyEngine

    matrix = {
        RiskLevel.LOW: [ApprovalStep(role="DEVELOPER", sla_hours=24)],
        RiskLevel.MEDIUM: [ApprovalStep(role="TEAM_LEAD", sla_hours=12)],
        RiskLevel.HIGH: [ApprovalStep(role="TEAM_LEAD", sla_hours=8), ApprovalStep(role="SECURITY_OFFICER", sla_hours=4)],
        RiskLevel.CRITICAL: [ApprovalStep(role="SECURITY_OFFICER", sla_hours=4), ApprovalStep(role="EXECUTIVE_APPROVER", sla_hours=2)],
    }
    return _new_orchestrator(ledger, policy_engine=BasePolicyEngine(), decision_matrix=DecisionMatrix(rules=[]), action_router=ActionRouter(),
                               approval_workflow=ApprovalWorkflow(approval_matrix=matrix), registry=DomainRegistry()).seal(ledger, _ORCHESTRATOR_TOKEN)


def create_bound_receipt_context(*, config, key_reference, key, ledger, orchestrator=None, clock_ms=None,
                                 challenge_capacity=MAX_PENDING_CHALLENGES):
    """Private issuance boundary for a measured fixture ledger and its sealed CoreOrchestrator."""
    if type(ledger) is not BoundSqliteLedger:
        raise ContractError("CONTEXT_LEDGER")
    selected = orchestrator if orchestrator is not None else create_fixture_orchestrator(ledger)
    return BoundReceiptContext(config=config, key_reference=key_reference, key=key, ledger=ledger, orchestrator=selected,
                               clock_ms=clock_ms, challenge_capacity=challenge_capacity, _token=_CONTEXT_TOKEN)


class BoundReceiptContext:
    """An issued opaque identity; all authority lives in the factory registry."""

    __slots__ = ("__weakref__",)

    def __init__(self, *, _token=None, **kwargs):
        if _token is not _CONTEXT_TOKEN:
            raise ContractError("CONTEXT_UNISSUED")
        _CONTEXTS[self] = _ContextState(_token=_token, **kwargs)

    def __setattr__(self, _name, _value):
        raise ContractError("CONTEXT_SEALED")

    def __delattr__(self, _name):
        raise ContractError("CONTEXT_SEALED")

    @property
    def config(self):
        return _CONTEXTS[self].config

    @property
    def counters(self):
        return MappingProxyType(_CONTEXTS[self].counters)

    @property
    def _orchestrator(self):
        return _CONTEXTS[self]._orchestrator

    @property
    def _ledger(self):
        return _CONTEXTS[self]._ledger


def _context_state(value):
    # Exact type first: hostile __hash__, equality and structural properties never run.
    if type(value) is not BoundReceiptContext:
        raise ContractError("CONTEXT_UNISSUED")
    state = _CONTEXTS.get(value)
    if state is None:
        raise ContractError("CONTEXT_UNISSUED")
    return state


class _ContextState:
    """Not exported by the context; captured references cannot be replaced through it."""

    def __init__(self, *, config, key_reference, key, ledger, orchestrator, clock_ms=None, challenge_capacity=MAX_PENDING_CHALLENGES, _token=None):
        if _token is not _CONTEXT_TOKEN:
            raise ContractError("CONTEXT_UNISSUED")
        parsed = parse_bound_config(dict(config) if isinstance(config, MappingProxyType) else config)
        if type(ledger) is not BoundSqliteLedger or type(orchestrator) is not _SealedOrchestrator or _ORCHESTRATOR_LEDGERS.get(orchestrator) is not ledger:
            raise ContractError("CONTEXT_LEDGER")
        if parsed["instanceId"] != ledger.instance_id or parsed["storeBindingId"] != ledger.verify_binding():
            raise ContractError("CONTEXT_STORE")
        if not isinstance(key, (bytes, bytearray)) or not 32 <= len(key) <= 128 or not isinstance(key_reference, str) or not key_reference:
            raise ContractError("CONTEXT_KEY")
        self.config = MappingProxyType(dict(parsed))
        self._key_reference = key_reference
        self._key = bytes(key)
        self._ledger = ledger
        self._orchestrator = orchestrator
        self._execute = orchestrator.execute
        self._clock = clock_ms or (lambda: int(time.time() * 1000))
        self._capacity = challenge_capacity
        self._guard = ReplayGuard()
        self._challenges = {}
        self.counters = {"challenges": 0, "evaluates": 0}
        self._sealed = True

    def now(self):
        return int(self._clock())

    # -- shared helpers ------------------------------------------------------
    def _sign(self, path, obj):
        body = canonical_bytes(obj)
        if len(body) > MAX_RESPONSE_BYTES:
            raise ContractError("RESPONSE_OVERSIZE")
        headers = sign_message(self._key, "PROXY_ENGINE", "RESPONSE", path, body, self.now(), secrets.token_hex(32), self.config["configDigest"])
        headers["cache-control"] = "no-store"
        return Reply(200, headers, body)

    def _purge(self, now):
        for nonce in [n for n, entry in self._challenges.items() if entry["expires"] + 30000 < now]:
            del self._challenges[nonce]

    # -- CHALLENGE -------------------------------------------------------------
    def challenge(self, path, wire, auth, now):
        self._purge(now)
        if wire["challengeNonce"] in self._challenges:
            raise ContractError("CHALLENGE_REPLAY")
        if len(self._challenges) >= self._capacity:
            raise ContractError("CHALLENGE_CAPACITY")
        store_binding_id = self._ledger.verify_binding()
        expires = now + CHALLENGE_TTL_MS
        self._challenges[wire["challengeNonce"]] = {"expires": expires, "owner": wire["owner"], "operationKey": wire["operationKey"],
                                                    "attemptId": wire["attemptId"], "used": False}
        self.counters["challenges"] += 1
        return self._sign(path, {
            "schema": WIRE_SCHEMA, "kind": "CHALLENGE_RESULT", "requestNonce": auth["nonce"], "challengeNonce": wire["challengeNonce"],
            "configDigest": self.config["configDigest"], "instanceId": self._ledger.instance_id, "storeBindingId": store_binding_id,
            "backend": self._ledger.backend, "policyRevision": self.config["policyRevision"], "expiresAtMs": expires,
        })

    # -- EVALUATE --------------------------------------------------------------
    def evaluate(self, path, wire, auth, now):
        entry = self._challenges.get(wire["challengeNonce"])
        if entry is None:
            raise ContractError("CHALLENGE_UNKNOWN")
        if entry["used"]:
            raise ContractError("CHALLENGE_USED")
        entry["used"] = True  # single use: consumed before any effect, whatever happens next
        if now >= entry["expires"]:
            raise ContractError("CHALLENGE_EXPIRED")
        if (entry["owner"] != wire["owner"] or entry["operationKey"] != wire["operationKey"] or entry["attemptId"] != wire["attemptId"]):
            raise ContractError("CHALLENGE_JOIN")
        ledger = self._ledger
        if wire["instanceId"] != ledger.instance_id or wire["storeBindingId"] != ledger.verify_binding():
            raise ContractError("STORE_MISMATCH")
        attempt_id = wire["attemptId"]
        if ledger.lookup_request_id(attempt_id) is not None:
            raise ContractError("ATTEMPT_ALREADY_RECORDED")
        owner_digest = owner_sha256(wire["owner"])
        metadata = {"operationKey": wire["operationKey"], "attemptId": attempt_id, "envelopeSha256": wire["envelopeSha256"], "ownerSha256": owner_digest,
                    "configDigest": self.config["configDigest"], "storeBindingId": ledger.store_binding_id, "instanceId": ledger.instance_id,
                    "payloadSha256": wire["payloadSha256"]}
        evaluate = wire["evaluate"]
        # The actor is derived from the authenticated owner; the wire carries no actor field, so a caller cannot override it.
        request = GovernanceRequest(request_id=attempt_id, artifact_id=evaluate["artifact_id"],
                                    payload={"content": evaluate["payload"]["content"], "actor_id": f"owner-{owner_digest}"},
                                    cvf_phase=evaluate["cvf_phase"], cvf_risk_level=evaluate["cvf_risk_level"])
        self.counters["evaluates"] += 1
        if self._orchestrator.ledger is not ledger:
            raise ContractError("CONTEXT_LEDGER")
        with ledger.bind_event_context(metadata):
            result = self._execute(request)
        if self._orchestrator.ledger is not ledger:
            raise ContractError("CONTEXT_LEDGER")
        report = result.report
        report["risk_score"] = result.execution_record.risk_score
        CVFRiskAdapter.enrich_result(report)
        CVFEnforcementAdapter.enrich_result(report, phase=evaluate["cvf_phase"])
        block = ledger.committed_block(attempt_id, metadata)
        if block is None:
            raise ContractError("LEDGER_JOIN")
        decision = report["decision_analysis"]["final_decision"]
        if (decision not in EXPECTED_ACTION or report["cvf_enforcement"]["action"] != EXPECTED_ACTION[decision]
                or result.execution_record.final_decision != decision or result.execution_record.ledger_attached is not True
                or report["integrity"]["has_ledger_reference"] is not True or report["request_summary"]["request_id"] != attempt_id
                or report["request_summary"]["artifact_id"] != evaluate["artifact_id"]):
            raise ContractError("REPORT_JOIN")
        engine_risk = report["cvf_risk_level"]
        store_binding_id = ledger.verify_binding()  # verified again immediately before signing
        return self._sign(path, {
            "schema": WIRE_SCHEMA, "kind": "EVALUATE_RESULT", "requestNonce": auth["nonce"], "operationKey": wire["operationKey"], "attemptId": attempt_id,
            "artifactId": wire["artifactId"], "payloadSha256": wire["payloadSha256"], "envelopeSha256": wire["envelopeSha256"], "owner": copy_owner(wire["owner"]),
            "configDigest": self.config["configDigest"], "instanceId": ledger.instance_id, "storeBindingId": store_binding_id, "declaredRisk": "R1",
            "engineRiskLevel": engine_risk, "ledgerReference": {"requestId": attempt_id, "blockHash": block["hash"]},
            "report": {"request_summary": {"request_id": attempt_id, "artifact_id": evaluate["artifact_id"]}, "decision_analysis": {"final_decision": decision},
                       "cvf_enforcement": {"action": report["cvf_enforcement"]["action"]}, "cvf_risk_level": engine_risk,
                       "report_metadata": {"generated_at": report["report_metadata"]["generated_at"]}, "integrity": {"has_ledger_reference": True}},
            "executionRecord": {"final_decision": decision, "ledger_attached": True},
        })


def _capture_deadline(remaining, maximum):
    if type(remaining) not in (int, float) or not math.isfinite(remaining) or remaining <= 0:
        raise ContractError("DEADLINE")
    return time.monotonic() + min(remaining, maximum) / 1000


class _IngressBudget:
    pass


async def handle_bound_request(context, path, headers, raw_body, *, origin=None, method=None, deadline_remaining_ms=None, _ingress_budget=None):
    """Authenticate, parse and serve one bound request. No context means the endpoint is not activated."""
    if context is None:
        return _error(503, "BOUND_RECEIPT_NOT_ACTIVATED")
    try:
        context = _context_state(context)
        if origin != context.config["engineOrigin"] or method != "POST":
            raise ContractError("DESTINATION")
        if _ingress_budget is None:
            deadline = _capture_deadline(deadline_remaining_ms, context.config["timeoutMs"])
        else:
            deadline = _INGRESS_BUDGETS.get(_ingress_budget)
            if deadline is None:
                raise ContractError("DEADLINE")
        if path not in (ENGINE_CHALLENGE_PATH, ENGINE_EVALUATE_PATH):
            raise ContractError("PATH")
        if len(raw_body) > MAX_REQUEST_BYTES:
            raise ContractError("OVERSIZE_BODY")
        now = context.now()
        auth = verify_signed(context._key_reference, context._key, context._guard, "PROXY_ENGINE", "REQUEST", path, headers, raw_body,
                             context.config["configDigest"], now)
        wire = parse_wire_request(parse_canonical_json(raw_body, MAX_REQUEST_BYTES))
        expected_kind = "CHALLENGE" if path == ENGINE_CHALLENGE_PATH else "EVALUATE"
        if wire["kind"] != expected_kind or wire["configDigest"] != context.config["configDigest"]:
            raise ContractError("WIRE_JOIN")
        if time.monotonic() >= deadline:
            raise ContractError("DEADLINE")
        reply = context.challenge(path, wire, auth, now) if expected_kind == "CHALLENGE" else context.evaluate(path, wire, auth, now)
        if time.monotonic() >= deadline:
            raise ContractError("DEADLINE")
        return reply
    except ContractError as error:
        return _error(_status_for(error.code), error.code)
    except BindingError as error:
        return _error(409, error.code)
    except Exception:  # noqa: BLE001 - any other failure is an unsigned deny; the caller treats it as an unknown outcome
        return _error(500, "INTERNAL_ERROR")


def create_router(resolve_context):
    """Mount point for both endpoints. resolve_context() returns a BoundReceiptContext or None (deny)."""
    router = APIRouter()

    async def serve(request: Request, path: str):
        budget = None
        try:
            context = resolve_context()
            if context is None:
                return Response(content=_error(503, "BOUND_RECEIPT_NOT_ACTIVATED").body, status_code=503)
            state = _context_state(context)
            actual = request.url
            origin = f"{actual.scheme}://{actual.netloc}"
            if (origin != state.config["engineOrigin"] or request.method != "POST" or actual.path != path
                    or actual.query or actual.fragment):
                raise ContractError("DESTINATION")
            deadline = _capture_deadline(getattr(request.state, "bound_deadline_remaining_ms", None), state.config["timeoutMs"])
            budget = _IngressBudget()
            _INGRESS_BUDGETS[budget] = deadline
            declared = request.headers.get("content-length")
            if declared is not None and (not declared.isdigit() or int(declared) > MAX_REQUEST_BYTES):
                raise ContractError("OVERSIZE_BODY")
            chunks, total = [], 0
            stream = request.stream().__aiter__()
            while True:
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise ContractError("DEADLINE")
                try:
                    chunk = await asyncio.wait_for(stream.__anext__(), timeout=remaining)
                except StopAsyncIteration:
                    break
                except asyncio.TimeoutError:
                    raise ContractError("DEADLINE") from None
                total += len(chunk)
                if total > MAX_REQUEST_BYTES:
                    raise ContractError("OVERSIZE_BODY")
                chunks.append(chunk)
            reply = await handle_bound_request(context, actual.path, request.headers, b"".join(chunks), origin=origin,
                                               method=request.method, _ingress_budget=budget)
        except ContractError as error:
            reply = _error(_status_for(error.code), error.code)
        except Exception:
            reply = _error(500, "INTERNAL_ERROR")
        finally:
            if budget is not None:
                _INGRESS_BUDGETS.pop(budget, None)
        return Response(content=reply.body, status_code=reply.status, headers=reply.headers)

    @router.post(ENGINE_CHALLENGE_PATH)
    async def challenge(request: Request):
        return await serve(request, ENGINE_CHALLENGE_PATH)

    @router.post(ENGINE_EVALUATE_PATH)
    async def evaluate(request: Request):
        return await serve(request, ENGINE_EVALUATE_PATH)

    return router


__all__ = ["BoundReceiptContext", "Reply", "create_bound_receipt_context", "create_fixture_orchestrator", "create_router", "handle_bound_request"]
