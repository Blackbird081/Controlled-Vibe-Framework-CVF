"""
Capability Model

Defines capability with lifecycle states.
Based on CVF v1.2 CAPABILITY_LIFECYCLE.md
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from .skill_contract import SkillContract


class LifecycleState(Enum):
    """
    Capability lifecycle states
    
    PROPOSED → APPROVED → ACTIVE → DEPRECATED → RETIRED
    """
    PROPOSED = "PROPOSED"      # Newly proposed, not yet approved
    APPROVED = "APPROVED"      # Approved but not active (sandbox)
    ACTIVE = "ACTIVE"          # Can be executed in production
    DEPRECATED = "DEPRECATED"  # Still works but not recommended
    RETIRED = "RETIRED"        # No longer executable
    
    @property
    def can_execute(self) -> bool:
        """Whether execution is allowed in this state"""
        return self in [LifecycleState.ACTIVE, LifecycleState.DEPRECATED]
    
    @property
    def is_final(self) -> bool:
        """Whether this is a terminal state"""
        return self == LifecycleState.RETIRED
    
    def can_transition_to(self, target: "LifecycleState") -> bool:
        """Check if transition to target state is valid"""
        valid_transitions = {
            LifecycleState.PROPOSED: [LifecycleState.APPROVED],
            LifecycleState.APPROVED: [LifecycleState.ACTIVE],
            LifecycleState.ACTIVE: [LifecycleState.DEPRECATED, LifecycleState.RETIRED],
            LifecycleState.DEPRECATED: [LifecycleState.RETIRED],
            LifecycleState.RETIRED: [],  # Terminal state
        }
        return target in valid_transitions.get(self, [])


@dataclass
class LifecycleTransition:
    """Record of a lifecycle state transition"""
    from_state: LifecycleState
    to_state: LifecycleState
    timestamp: datetime
    actor: str
    reason: str


@dataclass
class Capability:
    """
    CVF Capability
    
    Represents a registered capability with its contract,
    lifecycle state, and metadata.
    """
    
    # Identity
    capability_id: str
    version: str
    
    # Contract reference
    contract: SkillContract
    
    # Lifecycle
    state: LifecycleState = LifecycleState.PROPOSED
    
    # Metadata
    owner: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    last_audit_date: Optional[datetime] = None
    
    # History
    transitions: List[LifecycleTransition] = field(default_factory=list)
    
    # Adapter reference
    adapter_id: Optional[str] = None
    
    def __post_init__(self):
        """Validate capability after initialization"""
        if not self.owner and self.state != LifecycleState.PROPOSED:
            raise ValueError("Capability must have an owner to be beyond PROPOSED state")
    
    @property
    def can_execute(self) -> bool:
        """Check if capability can be executed"""
        return self.state.can_execute
    
    @property 
    def is_drifting(self) -> bool:
        """
        Check if capability might be drifting
        
        A capability is considered drifting if:
        - Last audit is too old (> 30 days for ACTIVE)
        - No audit has ever been done
        """
        if self.state != LifecycleState.ACTIVE:
            return False
        
        if self.last_audit_date is None:
            return True
        
        days_since_audit = (datetime.now() - self.last_audit_date).days
        return days_since_audit > 30
    
    def transition_to(self, new_state: LifecycleState, actor: str, reason: str) -> bool:
        """
        Attempt to transition to a new state
        
        Returns True if transition was successful
        """
        if not self.state.can_transition_to(new_state):
            return False
        
        # Record transition
        transition = LifecycleTransition(
            from_state=self.state,
            to_state=new_state,
            timestamp=datetime.now(),
            actor=actor,
            reason=reason,
        )
        self.transitions.append(transition)
        
        # Apply transition
        self.state = new_state
        return True
    
    def approve(self, actor: str, reason: str = "Audit passed") -> bool:
        """Approve capability (PROPOSED → APPROVED)"""
        return self.transition_to(LifecycleState.APPROVED, actor, reason)
    
    def activate(self, actor: str, reason: str = "Ready for production") -> bool:
        """Activate capability (APPROVED → ACTIVE)"""
        return self.transition_to(LifecycleState.ACTIVE, actor, reason)
    
    def deprecate(self, actor: str, reason: str) -> bool:
        """Deprecate capability (ACTIVE → DEPRECATED)"""
        return self.transition_to(LifecycleState.DEPRECATED, actor, reason)
    
    def retire(self, actor: str, reason: str) -> bool:
        """Retire capability (DEPRECATED/ACTIVE → RETIRED)"""
        return self.transition_to(LifecycleState.RETIRED, actor, reason)
    
    def record_audit(self, auditor: str) -> None:
        """Record that an audit was performed"""
        self.last_audit_date = datetime.now()
    
    def check_execution_eligibility(self, archetype: str, phase: str) -> tuple[bool, str]:
        """
        Check if capability can be executed in given context
        
        Returns (is_eligible, reason)
        """
        # Check lifecycle state
        if not self.can_execute:
            return False, f"Capability is in {self.state.value} state"
        
        # Check drift
        if self.is_drifting:
            return False, "Capability needs audit (potential drift detected)"
        
        # Check governance constraints
        if not self.contract.can_execute(archetype, phase):
            return False, f"Governance does not allow {archetype} in phase {phase}"
        
        # Check deprecation warning
        if self.state == LifecycleState.DEPRECATED:
            return True, "WARNING: Capability is deprecated"
        
        return True, "OK"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert capability to dictionary"""
        return {
            "capability_id": self.capability_id,
            "version": self.version,
            "state": self.state.value,
            "owner": self.owner,
            "created_at": self.created_at.isoformat(),
            "last_audit_date": self.last_audit_date.isoformat() if self.last_audit_date else None,
            "adapter_id": self.adapter_id,
            "contract": self.contract.to_dict(),
            "can_execute": self.can_execute,
            "is_drifting": self.is_drifting,
            "transitions": [
                {
                    "from": t.from_state.value,
                    "to": t.to_state.value,
                    "timestamp": t.timestamp.isoformat(),
                    "actor": t.actor,
                    "reason": t.reason,
                }
                for t in self.transitions
            ],
        }
