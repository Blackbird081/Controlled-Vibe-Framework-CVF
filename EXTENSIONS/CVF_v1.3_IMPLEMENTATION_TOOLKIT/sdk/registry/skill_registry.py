"""
Skill Registry

Central registry for managing CVF capabilities.
Based on CVF v1.2 SKILL_REGISTRY_MODEL.md
"""

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import json
import yaml

from ..models.skill_contract import SkillContract
from ..models.capability import Capability, LifecycleState
from ..models.risk import RiskLevel


@dataclass
class RegistryEntry:
    """Single entry in the skill registry"""
    capability: Capability
    registered_at: datetime = field(default_factory=datetime.now)
    registered_by: str = "system"


class RegistryError(Exception):
    """Base exception for registry errors"""
    pass


class CapabilityNotFoundError(RegistryError):
    """Capability not found in registry"""
    pass


class CapabilityExistsError(RegistryError):
    """Capability already exists in registry"""
    pass


class ExecutionDeniedError(RegistryError):
    """Execution denied by registry"""
    pass


class SkillRegistry:
    """
    CVF Skill Registry
    
    Central registry for managing capabilities. Provides:
    - Capability registration and lookup
    - Lifecycle state management
    - Execution eligibility checking
    - Audit trail
    
    Registry follows deny-first policy: anything not explicitly
    allowed is denied.
    """
    
    def __init__(self, registry_path: Optional[Path] = None):
        """
        Initialize registry
        
        Args:
            registry_path: Optional path to persist registry
        """
        self._entries: Dict[str, Dict[str, RegistryEntry]] = {}  # id -> version -> entry
        self._adapters: Dict[str, Any] = {}  # adapter_id -> adapter
        self._audit_log: List[Dict] = []
        self._registry_path = registry_path
        
        if registry_path and registry_path.exists():
            self._load()
    
    def register(
        self,
        contract: SkillContract,
        owner: str = "",
        adapter_id: Optional[str] = None,
        registered_by: str = "system",
    ) -> Capability:
        """
        Register a new capability
        
        Args:
            contract: Skill contract to register
            owner: Capability owner
            adapter_id: ID of adapter to use for execution
            registered_by: Who is registering
            
        Returns:
            Registered capability in PROPOSED state
        """
        cap_id = contract.capability_id
        version = contract.version
        
        # Check if already exists
        if cap_id in self._entries and version in self._entries[cap_id]:
            raise CapabilityExistsError(
                f"Capability {cap_id} version {version} already registered"
            )
        
        # Create capability
        capability = Capability(
            capability_id=cap_id,
            version=version,
            contract=contract,
            state=LifecycleState.PROPOSED,
            owner=owner,
            adapter_id=adapter_id,
        )
        
        # Register
        if cap_id not in self._entries:
            self._entries[cap_id] = {}
        
        self._entries[cap_id][version] = RegistryEntry(
            capability=capability,
            registered_by=registered_by,
        )
        
        # Audit
        self._log_action("REGISTER", cap_id, version, registered_by)
        
        return capability
    
    def get(
        self,
        capability_id: str,
        version: Optional[str] = None,
    ) -> Capability:
        """
        Get capability by ID
        
        Args:
            capability_id: Capability ID
            version: Specific version (latest if None)
            
        Returns:
            Capability instance
        """
        if capability_id not in self._entries:
            raise CapabilityNotFoundError(f"Capability {capability_id} not found")
        
        versions = self._entries[capability_id]
        
        if version:
            if version not in versions:
                raise CapabilityNotFoundError(
                    f"Capability {capability_id} version {version} not found"
                )
            return versions[version].capability
        
        # Return latest version
        latest_version = max(versions.keys())
        return versions[latest_version].capability
    
    def get_active(self, capability_id: str) -> Optional[Capability]:
        """Get active version of capability"""
        if capability_id not in self._entries:
            return None
        
        for entry in self._entries[capability_id].values():
            if entry.capability.state == LifecycleState.ACTIVE:
                return entry.capability
        
        return None
    
    def list_capabilities(
        self,
        state: Optional[LifecycleState] = None,
        domain: Optional[str] = None,
    ) -> List[Capability]:
        """
        List capabilities with optional filters
        
        Args:
            state: Filter by lifecycle state
            domain: Filter by domain
            
        Returns:
            List of matching capabilities
        """
        results = []
        
        for versions in self._entries.values():
            for entry in versions.values():
                cap = entry.capability
                
                if state and cap.state != state:
                    continue
                if domain and cap.contract.domain != domain:
                    continue
                
                results.append(cap)
        
        return results
    
    def can_execute(
        self,
        capability_id: str,
        archetype: str,
        phase: str,
        version: Optional[str] = None,
    ) -> tuple[bool, str]:
        """
        Check if capability can be executed
        
        Args:
            capability_id: Capability ID
            archetype: Agent archetype
            phase: Current phase
            version: Specific version (latest active if None)
            
        Returns:
            (is_allowed, reason)
        """
        try:
            if version:
                capability = self.get(capability_id, version)
            else:
                capability = self.get_active(capability_id)
                if not capability:
                    return False, f"No active version of {capability_id}"
        except CapabilityNotFoundError as e:
            return False, str(e)
        
        return capability.check_execution_eligibility(archetype, phase)
    
    def resolve(
        self,
        capability_id: str,
        archetype: str,
        phase: str,
        controls: List[str],
    ) -> Capability:
        """
        Resolve capability for execution
        
        This is the main entry point for execution. It:
        1. Finds the capability
        2. Checks execution eligibility
        3. Validates controls
        4. Returns capability if all checks pass
        
        Args:
            capability_id: Capability ID
            archetype: Agent archetype
            phase: Current phase
            controls: Available controls
            
        Returns:
            Resolved capability
            
        Raises:
            ExecutionDeniedError: If execution is denied
        """
        # Get active capability
        capability = self.get_active(capability_id)
        if not capability:
            raise ExecutionDeniedError(f"No active version of {capability_id}")
        
        # Check eligibility
        can_execute, reason = capability.check_execution_eligibility(archetype, phase)
        if not can_execute:
            self._log_action("DENY", capability_id, capability.version, "registry", reason)
            raise ExecutionDeniedError(reason)
        
        # Check risk controls
        required_controls = capability.contract.risk_level.required_controls
        missing = [c for c in required_controls if c not in controls]
        if missing:
            reason = f"Missing required controls: {missing}"
            self._log_action("DENY", capability_id, capability.version, "registry", reason)
            raise ExecutionDeniedError(reason)
        
        # Log resolution
        self._log_action("RESOLVE", capability_id, capability.version, "registry")
        
        return capability
    
    def transition(
        self,
        capability_id: str,
        new_state: LifecycleState,
        actor: str,
        reason: str,
        version: Optional[str] = None,
    ) -> bool:
        """
        Transition capability to new state
        
        Args:
            capability_id: Capability ID
            new_state: Target state
            actor: Who is performing transition
            reason: Reason for transition
            version: Specific version
            
        Returns:
            True if transition successful
        """
        capability = self.get(capability_id, version)
        success = capability.transition_to(new_state, actor, reason)
        
        if success:
            self._log_action(
                f"TRANSITION:{new_state.value}",
                capability_id,
                capability.version,
                actor,
                reason,
            )
        
        return success
    
    def register_adapter(self, adapter_id: str, adapter: Any) -> None:
        """Register an adapter"""
        self._adapters[adapter_id] = adapter
    
    def get_adapter(self, adapter_id: str) -> Optional[Any]:
        """Get registered adapter"""
        return self._adapters.get(adapter_id)
    
    def _log_action(
        self,
        action: str,
        capability_id: str,
        version: str,
        actor: str,
        details: str = "",
    ) -> None:
        """Log an action to audit trail"""
        self._audit_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "capability_id": capability_id,
            "version": version,
            "actor": actor,
            "details": details,
        })
    
    def get_audit_log(
        self,
        capability_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """Get audit log entries"""
        logs = self._audit_log
        
        if capability_id:
            logs = [l for l in logs if l["capability_id"] == capability_id]
        
        return logs[-limit:]
    
    def _load(self) -> None:
        """Load registry from file"""
        if not self._registry_path:
            return
        
        with open(self._registry_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Reconstruct entries
        for cap_id, versions in data.get("capabilities", {}).items():
            self._entries[cap_id] = {}
            for version, entry_data in versions.items():
                contract = SkillContract.from_dict(entry_data["contract"])
                capability = Capability(
                    capability_id=cap_id,
                    version=version,
                    contract=contract,
                    state=LifecycleState(entry_data["state"]),
                    owner=entry_data.get("owner", ""),
                )
                self._entries[cap_id][version] = RegistryEntry(capability=capability)
        
        self._audit_log = data.get("audit_log", [])
    
    def save(self) -> None:
        """Save registry to file"""
        if not self._registry_path:
            return
        
        data = {
            "capabilities": {},
            "audit_log": self._audit_log,
        }
        
        for cap_id, versions in self._entries.items():
            data["capabilities"][cap_id] = {}
            for version, entry in versions.items():
                data["capabilities"][cap_id][version] = {
                    "contract": entry.capability.contract.to_dict(),
                    "state": entry.capability.state.value,
                    "owner": entry.capability.owner,
                    "registered_at": entry.registered_at.isoformat(),
                    "registered_by": entry.registered_by,
                }
        
        self._registry_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self._registry_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    def to_dict(self) -> Dict:
        """Convert registry to dictionary"""
        return {
            "total_capabilities": sum(len(v) for v in self._entries.values()),
            "capabilities": {
                cap_id: {
                    version: entry.capability.to_dict()
                    for version, entry in versions.items()
                }
                for cap_id, versions in self._entries.items()
            },
        }
