"""
test_approval.py

Tests for approval_layer: ApprovalWorkflow (enterprise version).
"""

import pytest
from approval_layer.approval_workflow import (
    ApprovalWorkflow,
    ApprovalStatus,
    RiskLevel,
    ApprovalStep,
    ApprovalRequest,
)


@pytest.fixture
def approval_matrix():
    return {
        RiskLevel.LOW: [
            ApprovalStep(role="DEVELOPER", sla_hours=24),
        ],
        RiskLevel.MEDIUM: [
            ApprovalStep(role="TEAM_LEAD", sla_hours=12),
        ],
        RiskLevel.HIGH: [
            ApprovalStep(role="TEAM_LEAD", sla_hours=8),
            ApprovalStep(role="SECURITY_OFFICER", sla_hours=4),
        ],
        RiskLevel.CRITICAL: [
            ApprovalStep(role="SECURITY_OFFICER", sla_hours=4),
            ApprovalStep(role="EXECUTIVE_APPROVER", sla_hours=2),
        ],
    }


@pytest.fixture
def workflow(approval_matrix):
    return ApprovalWorkflow(approval_matrix=approval_matrix)


class TestCreateRequest:
    """Test request creation."""

    def test_creates_pending_request(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        assert req.status == ApprovalStatus.PENDING
        assert req.resource_id == "RES-1"
        assert req.requested_by == "user1"
        assert req.risk_level == RiskLevel.LOW

    def test_request_has_uuid(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        assert len(req.request_id) > 0

    def test_request_has_expiry(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        assert req.expires_at is not None


class TestSubmitDecision:
    """Test approval/rejection flow."""

    def test_approve_single_step(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        updated = workflow.submit_decision(
            req.request_id, "approver1", ApprovalStatus.APPROVED
        )
        assert updated.status == ApprovalStatus.APPROVED

    def test_reject(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        updated = workflow.submit_decision(
            req.request_id, "approver1", ApprovalStatus.REJECTED
        )
        assert updated.status == ApprovalStatus.REJECTED

    def test_multi_step_approval(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.HIGH)
        # First step
        updated = workflow.submit_decision(
            req.request_id, "lead1", ApprovalStatus.APPROVED
        )
        assert updated.status == ApprovalStatus.PENDING  # still pending, more steps
        assert updated.current_step_index == 1

        # Second step
        updated = workflow.submit_decision(
            req.request_id, "sec1", ApprovalStatus.APPROVED
        )
        assert updated.status == ApprovalStatus.APPROVED

    def test_reject_at_second_step(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.HIGH)
        workflow.submit_decision(req.request_id, "lead1", ApprovalStatus.APPROVED)
        updated = workflow.submit_decision(
            req.request_id, "sec1", ApprovalStatus.REJECTED
        )
        assert updated.status == ApprovalStatus.REJECTED

    def test_cannot_decide_after_rejection(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        workflow.submit_decision(req.request_id, "a1", ApprovalStatus.REJECTED)
        with pytest.raises(RuntimeError):
            workflow.submit_decision(req.request_id, "a2", ApprovalStatus.APPROVED)


class TestOverride:
    """Test override flow."""

    def test_override_rejected(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        workflow.submit_decision(req.request_id, "a1", ApprovalStatus.REJECTED)
        updated = workflow.override_request(req.request_id, "admin1", "Emergency override")
        assert updated.status == ApprovalStatus.OVERRIDDEN

    def test_cannot_override_pending(self, workflow):
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        with pytest.raises(RuntimeError):
            workflow.override_request(req.request_id, "admin1")


class TestAuditHook:
    """Test audit hook integration."""

    def test_hook_called_on_create(self, approval_matrix):
        events = []
        workflow = ApprovalWorkflow(
            approval_matrix=approval_matrix,
            audit_hook=lambda event, data: events.append(event),
        )
        workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        assert "REQUEST_CREATED" in events

    def test_hook_called_on_approve(self, approval_matrix):
        events = []
        workflow = ApprovalWorkflow(
            approval_matrix=approval_matrix,
            audit_hook=lambda event, data: events.append(event),
        )
        req = workflow.create_request("RES-1", "user1", RiskLevel.LOW)
        workflow.submit_decision(req.request_id, "a1", ApprovalStatus.APPROVED)
        assert "REQUEST_APPROVED" in events
