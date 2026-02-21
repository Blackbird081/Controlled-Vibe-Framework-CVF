"""
test_enforcement.py

Tests for enforcement_layer: DecisionMatrix, ActionRouter, SharedEnums.
"""

import pytest
from enforcement_layer.shared_enums import GovernanceDecision, ActionTarget
from enforcement_layer.decision_matrix import (
    DecisionMatrix,
    PolicyRule,
    EvaluationResult,
)
from enforcement_layer.action_router import ActionRouter, ActionContext


class TestSharedEnums:
    """Test enum definitions."""

    def test_governance_decisions(self):
        assert GovernanceDecision.ALLOW.value == "ALLOW"
        assert GovernanceDecision.DENY.value == "DENY"
        assert GovernanceDecision.REVIEW.value == "REVIEW"
        assert GovernanceDecision.ESCALATE.value == "ESCALATE"
        assert GovernanceDecision.SANDBOX.value == "SANDBOX"

    def test_action_targets(self):
        assert ActionTarget.EXECUTE.value == "EXECUTE"
        assert ActionTarget.BLOCK.value == "BLOCK"
        assert ActionTarget.LOG_ONLY.value == "LOG_ONLY"


class TestDecisionMatrix:
    """Test DecisionMatrix evaluation logic."""

    def test_empty_rules_returns_allow(self):
        dm = DecisionMatrix(rules=[])
        result = dm.evaluate({"key": "value"})
        assert result.final_decision == GovernanceDecision.ALLOW
        assert result.risk_score == 0.0
        assert result.triggered_rules == []

    def test_single_rule_triggers(self):
        rule = PolicyRule(
            rule_id="R001",
            description="Block high risk",
            condition=lambda ctx: ctx.get("risk") > 80,
            decision=GovernanceDecision.DENY,
            risk_weight=0.9,
        )
        dm = DecisionMatrix(rules=[rule])
        result = dm.evaluate({"risk": 90})
        assert result.final_decision == GovernanceDecision.DENY
        assert "R001" in result.triggered_rules
        assert result.risk_score == 0.9

    def test_multiple_rules_highest_severity_wins(self):
        rules = [
            PolicyRule(
                rule_id="R001",
                description="Review",
                condition=lambda ctx: True,
                decision=GovernanceDecision.REVIEW,
                risk_weight=0.3,
            ),
            PolicyRule(
                rule_id="R002",
                description="Deny",
                condition=lambda ctx: True,
                decision=GovernanceDecision.DENY,
                risk_weight=0.5,
            ),
        ]
        dm = DecisionMatrix(rules=rules)
        result = dm.evaluate({})
        assert result.final_decision == GovernanceDecision.DENY

    def test_risk_score_clamped(self):
        rules = [
            PolicyRule(
                rule_id="R001",
                description="High weight 1",
                condition=lambda ctx: True,
                decision=GovernanceDecision.REVIEW,
                risk_weight=0.6,
            ),
            PolicyRule(
                rule_id="R002",
                description="High weight 2",
                condition=lambda ctx: True,
                decision=GovernanceDecision.REVIEW,
                risk_weight=0.8,
            ),
        ]
        dm = DecisionMatrix(rules=rules)
        result = dm.evaluate({})
        assert result.risk_score == 1.0  # clamped

    def test_unmatched_rule_not_triggered(self):
        rule = PolicyRule(
            rule_id="R001",
            description="Never triggers",
            condition=lambda ctx: False,
            decision=GovernanceDecision.DENY,
            risk_weight=0.9,
        )
        dm = DecisionMatrix(rules=[rule])
        result = dm.evaluate({})
        assert result.final_decision == GovernanceDecision.ALLOW
        assert "R001" not in result.triggered_rules


class TestActionRouter:
    """Test ActionRouter routing logic."""

    def test_deny_routes_to_block(self):
        router = ActionRouter()
        ctx = ActionContext(
            request_id="REQ-1",
            resource_id="RES-1",
            actor_id="USER-1",
            risk_score=0.5,
            governance_decision=GovernanceDecision.DENY,
        )
        target = router.route(ctx)
        assert target == ActionTarget.BLOCK

    def test_review_routes_to_require_approval(self):
        router = ActionRouter()
        ctx = ActionContext(
            request_id="REQ-1",
            resource_id="RES-1",
            actor_id="USER-1",
            risk_score=0.5,
            governance_decision=GovernanceDecision.REVIEW,
        )
        target = router.route(ctx)
        assert target == ActionTarget.REQUIRE_APPROVAL

    def test_allow_low_risk_executes(self):
        router = ActionRouter()
        ctx = ActionContext(
            request_id="REQ-1",
            resource_id="RES-1",
            actor_id="USER-1",
            risk_score=0.2,
            governance_decision=GovernanceDecision.ALLOW,
        )
        target = router.route(ctx)
        assert target == ActionTarget.EXECUTE

    def test_allow_high_risk_sandboxed(self):
        router = ActionRouter()
        ctx = ActionContext(
            request_id="REQ-1",
            resource_id="RES-1",
            actor_id="USER-1",
            risk_score=0.6,
            governance_decision=GovernanceDecision.ALLOW,
        )
        target = router.route(ctx)
        assert target == ActionTarget.SANDBOX

    def test_allow_very_high_risk_needs_approval(self):
        router = ActionRouter()
        ctx = ActionContext(
            request_id="REQ-1",
            resource_id="RES-1",
            actor_id="USER-1",
            risk_score=0.85,
            governance_decision=GovernanceDecision.ALLOW,
        )
        target = router.route(ctx)
        assert target == ActionTarget.REQUIRE_APPROVAL

    def test_audit_hook_called(self):
        events = []

        def hook(event_type, payload):
            events.append((event_type, payload))

        router = ActionRouter(audit_hook=hook)
        ctx = ActionContext(
            request_id="REQ-1",
            resource_id="RES-1",
            actor_id="USER-1",
            risk_score=0.1,
            governance_decision=GovernanceDecision.ALLOW,
        )
        router.route(ctx)
        assert len(events) >= 1
        assert events[0][0] == "ACTION_ROUTED"
