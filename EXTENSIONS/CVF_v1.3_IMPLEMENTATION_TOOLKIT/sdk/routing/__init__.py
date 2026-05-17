"""CVF Skill Routing Engine

Provides intelligent skill routing based on:
- Risk level (R0-R3)
- Required capabilities
- Agent compatibility
- Load balancing
- Fallback strategies
"""

from .router import SkillRouter, RoutingRequest, RoutingResult
from .strategies import (
    RiskLevelStrategy,
    CapabilityMatchStrategy,
    LoadBalancingStrategy,
    FallbackStrategy,
)

__all__ = [
    "SkillRouter",
    "RoutingRequest",
    "RoutingResult",
    "RiskLevelStrategy",
    "CapabilityMatchStrategy",
    "LoadBalancingStrategy",
    "FallbackStrategy",
]
