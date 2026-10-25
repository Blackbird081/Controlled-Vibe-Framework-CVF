"""Offline native SDK integration, not provider or runtime acceptance proof."""

import pytest

from sdk.models.capability import LifecycleState
from sdk.models.skill_contract import SkillContract
from sdk.registry.skill_registry import CapabilityExistsError, ExecutionDeniedError, SkillRegistry
from sdk.routing.router import RiskLevel as RoutingRiskLevel
from sdk.routing.router import RoutingDecision, RoutingRequest, SkillRouter


def contract_data(risk="R0"):
    return {
        "capability_id": "offline.document.read",
        "domain": "documents",
        "description": "Read synthetic document metadata",
        "risk_level": risk,
        "version": "1.0",
        "governance": {
            "allowed_archetypes": ["analyzer"],
            "allowed_phases": ["BUILD"],
            "required_decisions": ["synthetic-approval"] if risk in ("R2", "R3") else [],
        },
        "input_spec": [{"name": "query", "type": "string", "required": True}],
        "output_spec": [{"name": "matches", "type": "array"}],
        "execution": {"side_effects": False, "idempotent": True},
        "audit": {"trace_level": "Full"},
    }


def activate(registry, contract):
    capability = registry.register(contract, owner="offline-test", registered_by="offline-test")
    for state in (LifecycleState.APPROVED, LifecycleState.ACTIVE):
        assert registry.transition(contract.capability_id, state, "offline-test", "Synthetic lifecycle")
    capability.record_audit("offline-test")
    return capability


def route_contract(capability, router, required=("document-read",)):
    # The registry and router expose distinct risk enums; map their native named levels explicitly.
    risk = RoutingRiskLevel[capability.contract.risk_level.name]
    router.register_skill(capability.capability_id, risk, list(required))
    return router.route(RoutingRequest(capability.capability_id, risk, list(required)))


def test_contract_registry_admission_and_native_routing():
    contract = SkillContract.from_dict(contract_data())
    valid, errors = contract.validate_inputs({"query": "synthetic document"})
    assert valid and not errors
    assert not contract.validate_inputs({})[0]
    assert not contract.validate_inputs({"query": 42})[0]
    registry = SkillRegistry()
    capability = registry.register(contract, owner="offline-test")
    with pytest.raises(ExecutionDeniedError, match="No active version"):
        registry.resolve(contract.capability_id, "analyzer", "BUILD", ["Logging"])
    assert not registry.transition(contract.capability_id, LifecycleState.ACTIVE, "offline-test", "Invalid shortcut")
    assert capability.state is LifecycleState.PROPOSED
    assert registry.transition(contract.capability_id, LifecycleState.APPROVED, "offline-test", "Reviewed")
    assert registry.transition(contract.capability_id, LifecycleState.ACTIVE, "offline-test", "Activated")
    with pytest.raises(ExecutionDeniedError, match="needs audit"):
        registry.resolve(contract.capability_id, "analyzer", "BUILD", ["Logging"])
    capability.record_audit("offline-test")
    resolved = registry.resolve(contract.capability_id, "analyzer", "BUILD", ["Logging"])
    assert resolved is capability
    router = SkillRouter()
    router.register_agent("offline-reader", ["document-read"])
    result = route_contract(resolved, router)
    assert result.decision is RoutingDecision.AUTO_EXECUTE
    assert result.assigned_agent == "offline-reader"
    assert result.capabilities_matched == ["document-read"]
    assert router.get_agent_status()["offline-reader"]["current_load"] == 1
    assert registry.get_audit_log()[-1]["action"] == "RESOLVE"


@pytest.mark.parametrize("archetype,phase,controls,reason", [
    ("designer", "BUILD", ["Logging"], "Governance does not allow"),
    ("analyzer", "DESIGN", ["Logging"], "Governance does not allow"),
    ("analyzer", "BUILD", [], "Missing required controls"),
])
def test_registry_refuses_disallowed_context_before_routing(archetype, phase, controls, reason):
    registry = SkillRegistry()
    capability = activate(registry, SkillContract.from_dict(contract_data()))
    with pytest.raises(ExecutionDeniedError, match=reason):
        registry.resolve(capability.capability_id, archetype, phase, controls)
    assert registry.get_audit_log()[-1]["action"] == "DENY"
    assert not any(row["action"] == "RESOLVE" for row in registry.get_audit_log())


def test_deprecation_and_terminal_retirement_refuse_active_resolution():
    registry = SkillRegistry()
    capability = activate(registry, SkillContract.from_dict(contract_data()))
    for state in (LifecycleState.DEPRECATED, LifecycleState.RETIRED):
        assert registry.transition(capability.capability_id, state, "offline-test", "Synthetic retirement")
        assert registry.get_active(capability.capability_id) is None
        with pytest.raises(ExecutionDeniedError, match="No active version"):
            registry.resolve(capability.capability_id, "analyzer", "BUILD", ["Logging"])
    assert not registry.transition(capability.capability_id, LifecycleState.ACTIVE, "offline-test", "Invalid revival")
    allowed, reason = registry.can_execute(capability.capability_id, "analyzer", "BUILD", version="1.0")
    assert not allowed and "RETIRED" in reason


def test_invalid_contract_and_duplicate_registration_do_not_replace_registry_state():
    registry = SkillRegistry()
    malformed = contract_data("R2")
    malformed["governance"]["required_decisions"] = []
    with pytest.raises(ValueError, match="requires at least one decision"):
        registry.register(SkillContract.from_dict(malformed))
    assert registry.list_capabilities() == []
    original = activate(registry, SkillContract.from_dict(contract_data()))
    audit_before = registry.get_audit_log()
    with pytest.raises(CapabilityExistsError):
        registry.register(SkillContract.from_dict(contract_data()), owner="different-synthetic-owner")
    assert registry.get(original.capability_id) is original
    assert registry.get_audit_log() == audit_before


def test_native_routing_has_no_assignment_for_missing_capability_and_retains_approval():
    registry = SkillRegistry()
    capability = activate(registry, SkillContract.from_dict(contract_data("R2")))
    resolved = registry.resolve(capability.capability_id, "analyzer", "BUILD", capability.contract.risk_level.required_controls)
    router = SkillRouter()
    router.register_agent("offline-reader", ["document-read"])
    missing = route_contract(resolved, router, required=("unavailable-capability",))
    assert missing.assigned_agent is None
    assert missing.confidence_score == 0.0
    assert router.get_agent_status()["offline-reader"]["current_load"] == 0
    result = route_contract(resolved, router)
    assert result.decision is RoutingDecision.APPROVAL_REQUIRED
    assert result.assigned_agent == "offline-reader"
    assert "approval_manager" in result.approval_required_from


def test_saved_registry_round_trip_keeps_contract_and_requires_fresh_audit(tmp_path):
    registry_file = tmp_path / "synthetic-registry.json"
    registry = SkillRegistry(registry_file)
    original = activate(registry, SkillContract.from_dict(contract_data()))
    registry.save()
    reopened = SkillRegistry(registry_file)
    restored = reopened.get(original.capability_id)
    assert restored.contract.to_dict() == original.contract.to_dict()
    assert restored.state is LifecycleState.ACTIVE
    # Native persistence does not restore audit freshness. Do not invent durable authorization.
    with pytest.raises(ExecutionDeniedError, match="needs audit"):
        reopened.resolve(restored.capability_id, "analyzer", "BUILD", ["Logging"])
    restored.record_audit("offline-test")
    assert reopened.resolve(restored.capability_id, "analyzer", "BUILD", ["Logging"]) is restored
