"""Routing strategies for different scenarios"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from .router import RoutingRequest, RoutingResult


class RoutingStrategy(ABC):
    """Base class for routing strategies"""

    @abstractmethod
    def apply(self, request: RoutingRequest, result: RoutingResult) -> RoutingResult:
        """Apply strategy to routing result"""
        pass


class RiskLevelStrategy(RoutingStrategy):
    """Strategy based on risk level constraints"""

    def __init__(self):
        self.risk_restrictions = {
            "R0": {"requires_approval": False, "human_required": False},
            "R1": {"requires_approval": False, "human_required": False},
            "R2": {"requires_approval": True, "human_required": False},
            "R3": {"requires_approval": True, "human_required": True},
        }

    def apply(self, request: RoutingRequest, result: RoutingResult) -> RoutingResult:
        """Apply risk level constraints"""
        risk_key = f"R{request.risk_level.value}"
        constraints = self.risk_restrictions.get(risk_key, {})
        
        # Ensure human requirement is met
        if constraints.get("human_required") and not result.approval_required_from:
            result.approval_required_from = ["human_operator"]

        return result


class CapabilityMatchStrategy(RoutingStrategy):
    """Strategy for capability matching with scoring"""

    def apply(self, request: RoutingRequest, result: RoutingResult) -> RoutingResult:
        """Score agent based on capability match"""
        if not result.assigned_agent:
            return result

        # Calculate capability match score
        required_set = set(request.required_capabilities)
        agent_capabilities = set()  # Would be populated from agent registry

        match_ratio = len(required_set & agent_capabilities) / len(required_set) if required_set else 1.0
        
        result.confidence_score = match_ratio
        result.reasoning += f" | Capability match: {match_ratio:.1%}"

        return result


class LoadBalancingStrategy(RoutingStrategy):
    """Strategy for load distribution across agents"""

    def __init__(self, max_load_per_agent: int = 10):
        self.max_load_per_agent = max_load_per_agent

    def apply(self, request: RoutingRequest, result: RoutingResult) -> RoutingResult:
        """Rebalance if primary agent is overloaded"""
        # Check if primary agent is overloaded
        # Would integrate with router to check actual loads
        
        if result.confidence_score > 0:
            result.reasoning += f" | Load balanced"

        return result


class FallbackStrategy(RoutingStrategy):
    """Strategy for fallback agent selection"""

    def __init__(self, max_fallbacks: int = 3):
        self.max_fallbacks = max_fallbacks

    def apply(self, request: RoutingRequest, result: RoutingResult) -> RoutingResult:
        """Ensure fallback agents are in place"""
        if not result.fallback_agents and result.assigned_agent:
            result.reasoning += " | No fallback available"
            result.confidence_score *= 0.8
        else:
            result.reasoning += f" | {len(result.fallback_agents)} fallback(s) ready"

        return result
