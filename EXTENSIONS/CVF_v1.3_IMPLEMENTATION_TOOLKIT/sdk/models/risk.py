"""
Risk Level Model

Defines risk levels and risk assessment for CVF capabilities.
Based on CVF v1.2 CAPABILITY_RISK_MODEL.md
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional


class RiskLevel(Enum):
    """
    CVF Risk Levels (R0-R3)
    
    Each level determines required controls and approval processes.
    """
    R0 = "R0"  # Passive - No side effects
    R1 = "R1"  # Controlled - Small, bounded side effects
    R2 = "R2"  # Elevated - Has authority, may chain
    R3 = "R3"  # Critical - System changes, external impact
    
    @property
    def display_name(self) -> str:
        """Human-readable name for the risk level"""
        names = {
            "R0": "Passive",
            "R1": "Controlled", 
            "R2": "Elevated",
            "R3": "Critical",
        }
        return names.get(self.value, self.value)
    
    @property
    def required_controls(self) -> List[str]:
        """Controls required for this risk level"""
        controls_map = {
            "R0": ["Logging"],
            "R1": ["Logging", "Scope Guard"],
            "R2": ["Logging", "Scope Guard", "Explicit Approval", "Audit"],
            "R3": ["Logging", "Scope Guard", "Explicit Approval", "Audit", "Hard Gate", "Human-in-the-loop"],
        }
        return controls_map.get(self.value, [])
    
    @property
    def requires_human_approval(self) -> bool:
        """Whether this risk level requires human approval"""
        return self in [RiskLevel.R2, RiskLevel.R3]
    
    @property
    def requires_decision_artifact(self) -> bool:
        """Whether this risk level requires a decision artifact"""
        return self == RiskLevel.R3
    
    def __lt__(self, other: "RiskLevel") -> bool:
        order = {"R0": 0, "R1": 1, "R2": 2, "R3": 3}
        return order[self.value] < order[other.value]
    
    def __le__(self, other: "RiskLevel") -> bool:
        return self < other or self == other


class RiskDimension(Enum):
    """Risk assessment dimensions"""
    AUTHORITY = "authority"           # Can override decisions, auto-act
    SCOPE_EXPANSION = "scope"         # Can expand beyond initial context
    IRREVERSIBILITY = "irreversibility"  # Cannot be undone
    INTERPRETABILITY = "interpretability"  # Hard to explain/audit
    EXTERNAL_IMPACT = "external"      # Affects systems outside CVF


@dataclass
class RiskAssessment:
    """
    Complete risk assessment for a capability
    
    Evaluates risk across multiple dimensions and determines
    the overall risk level.
    """
    
    # Risk flags per dimension
    authority_risk: bool = False
    scope_expansion_risk: bool = False
    irreversibility_risk: bool = False
    interpretability_risk: bool = False
    external_impact_risk: bool = False
    
    # Additional context
    notes: str = ""
    mitigations: List[str] = field(default_factory=list)
    
    @property
    def risk_dimensions(self) -> List[RiskDimension]:
        """Get list of active risk dimensions"""
        dimensions = []
        if self.authority_risk:
            dimensions.append(RiskDimension.AUTHORITY)
        if self.scope_expansion_risk:
            dimensions.append(RiskDimension.SCOPE_EXPANSION)
        if self.irreversibility_risk:
            dimensions.append(RiskDimension.IRREVERSIBILITY)
        if self.interpretability_risk:
            dimensions.append(RiskDimension.INTERPRETABILITY)
        if self.external_impact_risk:
            dimensions.append(RiskDimension.EXTERNAL_IMPACT)
        return dimensions
    
    @property
    def calculated_risk_level(self) -> RiskLevel:
        """
        Calculate risk level based on dimensions
        
        Rules:
        - No risks → R0
        - 1 non-critical risk → R1
        - 2+ risks OR authority/external → R2
        - Irreversibility + external → R3
        """
        dims = self.risk_dimensions
        
        if not dims:
            return RiskLevel.R0
        
        # Critical combinations
        if (RiskDimension.IRREVERSIBILITY in dims and 
            RiskDimension.EXTERNAL_IMPACT in dims):
            return RiskLevel.R3
        
        # Authority or external impact alone
        if (RiskDimension.AUTHORITY in dims or 
            RiskDimension.EXTERNAL_IMPACT in dims):
            return RiskLevel.R2
        
        # Multiple dimensions
        if len(dims) >= 2:
            return RiskLevel.R2
        
        # Single non-critical dimension
        return RiskLevel.R1
    
    def validate_controls(self, controls: List[str]) -> tuple[bool, List[str]]:
        """
        Validate that required controls are in place
        
        Returns (is_valid, missing_controls)
        """
        required = self.calculated_risk_level.required_controls
        missing = [c for c in required if c not in controls]
        return len(missing) == 0, missing
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "risk_level": self.calculated_risk_level.value,
            "dimensions": [d.value for d in self.risk_dimensions],
            "authority_risk": self.authority_risk,
            "scope_expansion_risk": self.scope_expansion_risk,
            "irreversibility_risk": self.irreversibility_risk,
            "interpretability_risk": self.interpretability_risk,
            "external_impact_risk": self.external_impact_risk,
            "notes": self.notes,
            "mitigations": self.mitigations,
            "required_controls": self.calculated_risk_level.required_controls,
        }


def assess_risk(
    has_side_effects: bool = False,
    modifies_external_systems: bool = False,
    can_chain_actions: bool = False,
    is_reversible: bool = True,
    is_explainable: bool = True,
) -> RiskAssessment:
    """
    Helper function to create risk assessment from simple flags
    """
    return RiskAssessment(
        authority_risk=can_chain_actions,
        scope_expansion_risk=can_chain_actions,
        irreversibility_risk=not is_reversible,
        interpretability_risk=not is_explainable,
        external_impact_risk=modifies_external_systems,
    )
