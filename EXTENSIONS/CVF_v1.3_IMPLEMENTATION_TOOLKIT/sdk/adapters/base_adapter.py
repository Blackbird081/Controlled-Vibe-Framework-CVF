"""
Base Adapter

Abstract base class for agent adapters.
Based on CVF v1.2 AGENT_ADAPTER_BOUNDARY.md
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, List, Optional

from ..models.skill_contract import SkillContract
from ..models.capability import Capability


@dataclass
class AuditTrace:
    """Audit trace for an execution"""
    timestamp: datetime
    capability_id: str
    version: str
    actor: str
    inputs: Dict[str, Any]
    outputs: Optional[Dict[str, Any]] = None
    success: bool = False
    error: Optional[str] = None
    duration_ms: int = 0
    affected_resources: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "timestamp": self.timestamp.isoformat(),
            "capability_id": self.capability_id,
            "version": self.version,
            "actor": self.actor,
            "inputs": self.inputs,
            "outputs": self.outputs,
            "success": self.success,
            "error": self.error,
            "duration_ms": self.duration_ms,
            "affected_resources": self.affected_resources,
        }


@dataclass
class ExecutionResult:
    """Result of capability execution"""
    success: bool
    outputs: Dict[str, Any]
    trace: AuditTrace
    warnings: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "success": self.success,
            "outputs": self.outputs,
            "trace": self.trace.to_dict(),
            "warnings": self.warnings,
        }


class BaseAdapter(ABC):
    """
    Abstract base class for agent adapters
    
    An adapter is the boundary between CVF governance and
    the actual agent/model execution. Adapters:
    
    1. Receive approved Skill Contracts
    2. Translate contracts to agent-specific format
    3. Execute and validate outputs
    4. Return results with audit traces
    
    Adapters CANNOT:
    - Bypass CVF governance
    - Cache authority
    - Make decisions
    
    Adapters CAN be replaced without affecting CVF core.
    """
    
    def __init__(self, adapter_id: str, actor: str = "adapter"):
        """
        Initialize adapter
        
        Args:
            adapter_id: Unique identifier for this adapter
            actor: Actor name for audit traces
        """
        self.adapter_id = adapter_id
        self.actor = actor
        self._execution_count = 0
    
    @property
    @abstractmethod
    def adapter_type(self) -> str:
        """Type of adapter (e.g., 'claude', 'openai', 'generic')"""
        pass
    
    @abstractmethod
    def _execute_impl(
        self,
        contract: SkillContract,
        inputs: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute capability (implementation specific)
        
        This is the actual execution logic. Subclasses implement
        this to call their specific agent/model.
        
        Args:
            contract: Skill contract to execute
            inputs: Validated input values
            
        Returns:
            Output values
        """
        pass
    
    def execute(
        self,
        contract: SkillContract,
        inputs: Dict[str, Any],
    ) -> ExecutionResult:
        """
        Execute a capability
        
        This is the main entry point. It:
        1. Validates inputs
        2. Calls implementation
        3. Validates outputs
        4. Creates audit trace
        
        Args:
            contract: Skill contract to execute
            inputs: Input values
            
        Returns:
            ExecutionResult with outputs and trace
        """
        start_time = datetime.now()
        warnings = []
        
        # Create trace
        trace = AuditTrace(
            timestamp=start_time,
            capability_id=contract.capability_id,
            version=contract.version,
            actor=self.actor,
            inputs=inputs,
        )
        
        # Validate inputs
        inputs_valid, input_errors = contract.validate_inputs(inputs)
        if not inputs_valid:
            trace.success = False
            trace.error = f"Input validation failed: {input_errors}"
            trace.duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ExecutionResult(
                success=False,
                outputs={},
                trace=trace,
                warnings=warnings,
            )
        
        # Execute
        try:
            outputs = self._execute_impl(contract, inputs)
            trace.outputs = outputs
            trace.success = True
            self._execution_count += 1
            
        except Exception as e:
            trace.success = False
            trace.error = str(e)
            trace.duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            return ExecutionResult(
                success=False,
                outputs={},
                trace=trace,
                warnings=warnings,
            )
        
        # Validate outputs
        output_warnings = self._validate_outputs(contract, outputs)
        warnings.extend(output_warnings)
        
        trace.duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return ExecutionResult(
            success=True,
            outputs=outputs,
            trace=trace,
            warnings=warnings,
        )
    
    def _validate_outputs(
        self,
        contract: SkillContract,
        outputs: Dict[str, Any],
    ) -> List[str]:
        """Validate outputs against contract spec"""
        warnings = []
        
        for output_field in contract.output_spec:
            if output_field.name not in outputs:
                warnings.append(f"Missing expected output: {output_field.name}")
        
        return warnings
    
    def get_stats(self) -> Dict:
        """Get adapter statistics"""
        return {
            "adapter_id": self.adapter_id,
            "adapter_type": self.adapter_type,
            "execution_count": self._execution_count,
        }
    
    @abstractmethod
    def health_check(self) -> bool:
        """Check if adapter is healthy and can execute"""
        pass
