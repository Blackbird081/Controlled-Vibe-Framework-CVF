"""
action_router.py

Enterprise Governance Action Router
------------------------------------

Purpose:
- Route AI decisions/actions based on governance outcome
- Enforce policy-based execution control
- Integrate with approval workflow
- Provide deterministic routing paths

Supported Routing Targets:
- EXECUTE
- BLOCK
- REQUIRE_APPROVAL
- ESCALATE
- SANDBOX
- LOG_ONLY

Author: Governance Engine
"""

from dataclasses import dataclass
from typing import Callable, Dict, Optional, Any
from datetime import datetime

from .shared_enums import GovernanceDecision, ActionTarget


# =========================
# DATA MODEL
# =========================

@dataclass
class ActionContext:
    request_id: str
    resource_id: str
    actor_id: str
    risk_score: float
    governance_decision: GovernanceDecision
    metadata: Optional[Dict[str, Any]] = None


# =========================
# ACTION ROUTER
# =========================

class ActionRouter:

    def __init__(
        self,
        approval_handler: Optional[Callable[[ActionContext], None]] = None,
        execution_handler: Optional[Callable[[ActionContext], None]] = None,
        block_handler: Optional[Callable[[ActionContext], None]] = None,
        escalation_handler: Optional[Callable[[ActionContext], None]] = None,
        sandbox_handler: Optional[Callable[[ActionContext], None]] = None,
        audit_hook: Optional[Callable[[str, dict], None]] = None
    ):
        self.approval_handler = approval_handler
        self.execution_handler = execution_handler
        self.block_handler = block_handler
        self.escalation_handler = escalation_handler
        self.sandbox_handler = sandbox_handler
        self.audit_hook = audit_hook

    # =========================
    # MAIN ROUTE ENTRY
    # =========================

    def route(self, context: ActionContext) -> ActionTarget:

        target = self._determine_target(context)

        self._audit("ACTION_ROUTED", {
            "request_id": context.request_id,
            "resource_id": context.resource_id,
            "decision": context.governance_decision.value,
            "target": target.value,
            "risk_score": context.risk_score,
            "timestamp": datetime.utcnow().isoformat()
        })

        self._dispatch(target, context)

        return target

    # =========================
    # DECISION TREE
    # =========================

    def _determine_target(self, context: ActionContext) -> ActionTarget:

        # Hard deny
        if context.governance_decision == GovernanceDecision.DENY:
            return ActionTarget.BLOCK

        # Require manual review
        if context.governance_decision == GovernanceDecision.REVIEW:
            return ActionTarget.REQUIRE_APPROVAL

        # Explicit escalation
        if context.governance_decision == GovernanceDecision.ESCALATE:
            return ActionTarget.ESCALATE

        # Sandbox execution
        if context.governance_decision == GovernanceDecision.SANDBOX:
            return ActionTarget.SANDBOX

        # Allow but risk-aware
        if context.governance_decision == GovernanceDecision.ALLOW:
            if context.risk_score >= 0.8:
                return ActionTarget.REQUIRE_APPROVAL
            elif context.risk_score >= 0.5:
                return ActionTarget.SANDBOX
            else:
                return ActionTarget.EXECUTE

        # Default safe fallback
        return ActionTarget.BLOCK

    # =========================
    # DISPATCH
    # =========================

    def _dispatch(self, target: ActionTarget, context: ActionContext):

        if target == ActionTarget.EXECUTE and self.execution_handler:
            self.execution_handler(context)

        elif target == ActionTarget.BLOCK and self.block_handler:
            self.block_handler(context)

        elif target == ActionTarget.REQUIRE_APPROVAL and self.approval_handler:
            self.approval_handler(context)

        elif target == ActionTarget.ESCALATE and self.escalation_handler:
            self.escalation_handler(context)

        elif target == ActionTarget.SANDBOX and self.sandbox_handler:
            self.sandbox_handler(context)

        else:
            self._audit("NO_HANDLER_DEFINED", {
                "target": target.value,
                "request_id": context.request_id
            })

    # =========================
    # AUDIT
    # =========================

    def _audit(self, event_type: str, payload: dict):
        if self.audit_hook:
            self.audit_hook(event_type, payload)
