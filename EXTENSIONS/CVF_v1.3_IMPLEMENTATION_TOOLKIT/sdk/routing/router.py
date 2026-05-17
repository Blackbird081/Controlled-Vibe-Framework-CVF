"""Skill Router - Main routing logic"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from enum import Enum
import json
from datetime import datetime


class RiskLevel(Enum):
    """Skill risk levels"""
    R0 = 0  # Read-only, no side effects
    R1 = 1  # Limited side effects, scope guarding
    R2 = 2  # Elevated permissions, explicit approval required
    R3 = 3  # System-wide impact, human-in-the-loop required


class RoutingDecision(Enum):
    """Routing decision types"""
    AUTO_EXECUTE = "auto_execute"        # R0: Can execute immediately
    SCOPE_GUARD = "scope_guard"          # R1: Execute with guard conditions
    APPROVAL_REQUIRED = "approval_required"  # R2: Explicit approval required
    HUMAN_INTERVENTION = "human_intervention"  # R3: Human must intervene


@dataclass
class RoutingRequest:
    """Request for routing a skill execution"""
    skill_id: str
    risk_level: RiskLevel
    required_capabilities: List[str]
    target_agent: Optional[str] = None
    context: Dict[str, Any] = field(default_factory=dict)
    priority: int = 5  # 1-10, higher = more urgent
    deadline: Optional[datetime] = None


@dataclass
class RoutingResult:
    """Result of routing decision"""
    decision: RoutingDecision
    assigned_agent: Optional[str]
    capabilities_matched: List[str]
    approval_required_from: Optional[List[str]] = None
    fallback_agents: List[str] = field(default_factory=list)
    confidence_score: float = 1.0
    reasoning: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "decision": self.decision.value,
            "assigned_agent": self.assigned_agent,
            "capabilities_matched": self.capabilities_matched,
            "approval_required_from": self.approval_required_from,
            "fallback_agents": self.fallback_agents,
            "confidence_score": self.confidence_score,
            "reasoning": self.reasoning,
            "timestamp": self.timestamp.isoformat(),
        }


class SkillRouter:
    """Main router for skill execution"""

    def __init__(self):
        """Initialize router"""
        self.agents: Dict[str, Dict[str, Any]] = {}
        self.skills: Dict[str, Dict[str, Any]] = {}
        self.routing_rules: Dict[str, List[Dict[str, Any]]] = {}
        self.load_distribution: Dict[str, int] = {}

    def register_agent(self, agent_id: str, capabilities: List[str], 
                      max_concurrent: int = 10, approval_roles: Optional[List[str]] = None):
        """Register an agent with capabilities"""
        self.agents[agent_id] = {
            "id": agent_id,
            "capabilities": capabilities,
            "max_concurrent": max_concurrent,
            "approval_roles": approval_roles or [],
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
        }
        self.load_distribution[agent_id] = 0

    def register_skill(self, skill_id: str, risk_level: RiskLevel,
                      required_capabilities: List[str], 
                      allowed_agents: Optional[List[str]] = None):
        """Register a skill with routing metadata"""
        self.skills[skill_id] = {
            "id": skill_id,
            "risk_level": risk_level,
            "required_capabilities": required_capabilities,
            "allowed_agents": allowed_agents,
            "created_at": datetime.utcnow().isoformat(),
        }

    def route(self, request: RoutingRequest) -> RoutingResult:
        """Route a skill execution request
        
        Routing logic:
        1. Check risk level → determine decision type
        2. Find capable agents
        3. Apply load balancing
        4. Determine approval requirements
        5. Return routing decision
        """
        # Determine routing decision based on risk level
        if request.risk_level == RiskLevel.R0:
            decision = RoutingDecision.AUTO_EXECUTE
        elif request.risk_level == RiskLevel.R1:
            decision = RoutingDecision.SCOPE_GUARD
        elif request.risk_level == RiskLevel.R2:
            decision = RoutingDecision.APPROVAL_REQUIRED
        else:  # R3
            decision = RoutingDecision.HUMAN_INTERVENTION

        # Find capable agents
        capable_agents = self._find_capable_agents(request)
        
        if not capable_agents:
            return RoutingResult(
                decision=decision,
                assigned_agent=None,
                capabilities_matched=[],
                reasoning="No capable agents available",
                confidence_score=0.0
            )

        # Select primary agent using load balancing
        primary_agent = self._select_agent_by_load(capable_agents)

        # Get fallback agents
        fallback_agents = capable_agents[1:4]  # Up to 3 fallbacks

        # Determine approval requirements
        approval_required_from = None
        if decision in [RoutingDecision.APPROVAL_REQUIRED, RoutingDecision.HUMAN_INTERVENTION]:
            approval_required_from = self._get_approval_roles(request)

        result = RoutingResult(
            decision=decision,
            assigned_agent=primary_agent,
            capabilities_matched=request.required_capabilities,
            approval_required_from=approval_required_from,
            fallback_agents=fallback_agents,
            confidence_score=0.95,
            reasoning=f"Route to {primary_agent} (R{request.risk_level.value})"
        )

        # Update load
        if primary_agent:
            self.load_distribution[primary_agent] += 1

        return result

    def _find_capable_agents(self, request: RoutingRequest) -> List[str]:
        """Find agents with required capabilities"""
        capable = []

        for agent_id, agent_info in self.agents.items():
            # Check if agent is active
            if not agent_info["active"]:
                continue

            # Check capability match
            agent_capabilities = set(agent_info["capabilities"])
            required = set(request.required_capabilities)
            if required.issubset(agent_capabilities):
                capable.append(agent_id)

            # Check target agent constraint
            if request.target_agent and agent_id != request.target_agent:
                capable = [a for a in capable if a == request.target_agent or a != agent_id]

        return capable

    def _select_agent_by_load(self, agents: List[str]) -> str:
        """Select agent with lowest load"""
        if not agents:
            return None
        return min(agents, key=lambda a: self.load_distribution.get(a, 0))

    def _get_approval_roles(self, request: RoutingRequest) -> List[str]:
        """Get approval roles needed for skill execution"""
        approval_roles = set()
        
        # Get approval roles from assigned agent
        if request.target_agent and request.target_agent in self.agents:
            approval_roles.update(self.agents[request.target_agent]["approval_roles"])

        # R2 requires explicit approval, R3 requires human intervention
        if request.risk_level == RiskLevel.R2:
            approval_roles.add("approval_manager")
        elif request.risk_level == RiskLevel.R3:
            approval_roles.add("human_operator")
            approval_roles.add("compliance_officer")

        return list(approval_roles) if approval_roles else None

    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        status = {}
        for agent_id, agent_info in self.agents.items():
            status[agent_id] = {
                "active": agent_info["active"],
                "current_load": self.load_distribution.get(agent_id, 0),
                "max_capacity": agent_info["max_concurrent"],
                "capabilities": agent_info["capabilities"],
            }
        return status

    def reset_loads(self):
        """Reset load counters (e.g., after completion)"""
        for agent_id in self.load_distribution:
            self.load_distribution[agent_id] = 0
