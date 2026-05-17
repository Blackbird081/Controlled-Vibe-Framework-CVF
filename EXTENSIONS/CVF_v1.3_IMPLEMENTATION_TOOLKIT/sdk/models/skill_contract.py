"""
Skill Contract Model

Defines the structure and validation rules for CVF Skill Contracts.
Based on CVF v1.2 SKILL_CONTRACT_SPEC.md
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum
import yaml
import json
from pathlib import Path

from .risk import RiskLevel


class ExecutionType(Enum):
    """Capability execution types"""
    EXECUTABLE = "EXECUTABLE"
    NON_EXECUTABLE = "NON_EXECUTABLE"


class TraceLevel(Enum):
    """Audit trace levels"""
    BASIC = "Basic"
    FULL = "Full"


@dataclass
class InputField:
    """Input field specification"""
    name: str
    type: str
    required: bool = True
    default: Any = None
    validation_rule: Optional[str] = None
    
    def validate_value(self, value: Any) -> bool:
        """Validate a value against this field spec"""
        if value is None:
            return not self.required
        
        type_map = {
            "string": str,
            "integer": int,
            "number": (int, float),
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        
        expected_type = type_map.get(self.type.lower())
        if expected_type:
            return isinstance(value, expected_type)
        return True


@dataclass
class OutputField:
    """Output field specification"""
    name: str
    type: str
    success_criteria: Optional[str] = None
    failure_signals: Optional[List[str]] = None
    range: Optional[List[int]] = None


@dataclass
class GovernanceConstraints:
    """Governance constraints for capability usage"""
    allowed_archetypes: List[str] = field(default_factory=list)
    allowed_phases: List[str] = field(default_factory=list)
    required_decisions: List[str] = field(default_factory=list)
    required_status: str = "ACTIVE"
    
    def can_execute(self, archetype: str, phase: str) -> bool:
        """Check if execution is allowed for given context"""
        archetype_ok = not self.allowed_archetypes or archetype in self.allowed_archetypes
        phase_ok = not self.allowed_phases or phase in self.allowed_phases
        return archetype_ok and phase_ok


@dataclass
class ExecutionProperties:
    """Execution behavior properties"""
    side_effects: bool = False
    rollback_possible: bool = True
    idempotent: bool = True
    expected_duration: Optional[str] = None
    execution_type: ExecutionType = ExecutionType.EXECUTABLE


@dataclass
class AuditRequirements:
    """Audit and trace requirements"""
    trace_level: TraceLevel = TraceLevel.FULL
    required_fields: List[str] = field(default_factory=lambda: [
        "timestamp", "actor", "inputs", "outputs"
    ])


@dataclass
class FailureInfo:
    """Failure and risk information"""
    known_failure_modes: List[str] = field(default_factory=list)
    worst_case_impact: Optional[str] = None
    human_intervention_required: bool = False


@dataclass
class SkillContract:
    """
    CVF Skill Contract
    
    Defines the complete specification for a capability including:
    - Metadata (ID, domain, risk)
    - Governance constraints
    - Input/Output specifications
    - Execution properties
    - Audit requirements
    """
    
    # Metadata (Required)
    capability_id: str
    domain: str
    description: str
    risk_level: RiskLevel
    
    # Governance (Required)
    governance: GovernanceConstraints
    
    # Interface (Required)
    input_spec: List[InputField]
    output_spec: List[OutputField]
    
    # Execution (Required)
    execution: ExecutionProperties
    
    # Audit (Required)
    audit: AuditRequirements
    
    # Optional
    failure_info: Optional[FailureInfo] = None
    dependencies: List[str] = field(default_factory=list)
    version: str = "1.0"
    
    def __post_init__(self):
        """Validate contract after initialization"""
        self._validate()
    
    def _validate(self) -> None:
        """Validate contract meets CVF requirements"""
        errors = []
        
        # Required fields
        if not self.capability_id:
            errors.append("capability_id is required")
        if not self.domain:
            errors.append("domain is required")
        if not self.description:
            errors.append("description is required")
            
        # Risk-based validation
        if self.risk_level in [RiskLevel.R2, RiskLevel.R3]:
            if not self.governance.required_decisions:
                errors.append(f"Risk level {self.risk_level.value} requires at least one decision")
                
        # Input/Output validation
        if not self.input_spec:
            errors.append("At least one input field is required")
        if not self.output_spec:
            errors.append("At least one output field is required")
            
        if errors:
            raise ValueError(f"Contract validation failed: {errors}")
    
    def validate_inputs(self, inputs: Dict[str, Any]) -> tuple[bool, List[str]]:
        """Validate input values against spec"""
        errors = []
        
        for field_spec in self.input_spec:
            value = inputs.get(field_spec.name)
            
            if field_spec.required and value is None:
                errors.append(f"Required field '{field_spec.name}' is missing")
            elif value is not None and not field_spec.validate_value(value):
                errors.append(f"Field '{field_spec.name}' has invalid type")
                
        return len(errors) == 0, errors
    
    def can_execute(self, archetype: str, phase: str) -> bool:
        """Check if contract allows execution in given context"""
        return self.governance.can_execute(archetype, phase)
    
    @classmethod
    def from_yaml(cls, path: str | Path) -> "SkillContract":
        """Load contract from YAML file"""
        path = Path(path)
        with open(path, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
        return cls.from_dict(data)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "SkillContract":
        """Create contract from dictionary"""
        # Parse nested objects
        governance = GovernanceConstraints(
            allowed_archetypes=data.get("governance", {}).get("allowed_archetypes", []),
            allowed_phases=data.get("governance", {}).get("allowed_phases", []),
            required_decisions=data.get("governance", {}).get("required_decisions", []),
            required_status=data.get("governance", {}).get("required_status", "ACTIVE"),
        )
        
        input_spec = [
            InputField(
                name=f["name"],
                type=f["type"],
                required=f.get("required", True),
                default=f.get("default"),
                validation_rule=f.get("validation_rule"),
            )
            for f in data.get("input_spec", [])
        ]
        
        output_spec = [
            OutputField(
                name=f["name"],
                type=f["type"],
                success_criteria=f.get("success_criteria"),
                failure_signals=f.get("failure_signals"),
                range=f.get("range"),
            )
            for f in data.get("output_spec", [])
        ]
        
        execution_data = data.get("execution", {})
        execution = ExecutionProperties(
            side_effects=execution_data.get("side_effects", False),
            rollback_possible=execution_data.get("rollback_possible", True),
            idempotent=execution_data.get("idempotent", True),
            expected_duration=execution_data.get("expected_duration"),
            execution_type=ExecutionType(execution_data.get("execution_type", "EXECUTABLE")),
        )
        
        audit_data = data.get("audit", {})
        audit = AuditRequirements(
            trace_level=TraceLevel(audit_data.get("trace_level", "Full")),
            required_fields=audit_data.get("required_fields", [
                "timestamp", "actor", "inputs", "outputs"
            ]),
        )
        
        failure_data = data.get("failure_info")
        failure_info = None
        if failure_data:
            failure_info = FailureInfo(
                known_failure_modes=failure_data.get("known_failure_modes", []),
                worst_case_impact=failure_data.get("worst_case_impact"),
                human_intervention_required=failure_data.get("human_intervention_required", False),
            )
        
        return cls(
            capability_id=data["capability_id"],
            domain=data["domain"],
            description=data["description"],
            risk_level=RiskLevel(data["risk_level"]),
            governance=governance,
            input_spec=input_spec,
            output_spec=output_spec,
            execution=execution,
            audit=audit,
            failure_info=failure_info,
            dependencies=data.get("dependencies", []),
            version=data.get("version", "1.0"),
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert contract to dictionary"""
        return {
            "capability_id": self.capability_id,
            "domain": self.domain,
            "description": self.description,
            "risk_level": self.risk_level.value,
            "version": self.version,
            "governance": {
                "allowed_archetypes": self.governance.allowed_archetypes,
                "allowed_phases": self.governance.allowed_phases,
                "required_decisions": self.governance.required_decisions,
                "required_status": self.governance.required_status,
            },
            "input_spec": [
                {
                    "name": f.name,
                    "type": f.type,
                    "required": f.required,
                    "default": f.default,
                }
                for f in self.input_spec
            ],
            "output_spec": [
                {
                    "name": f.name,
                    "type": f.type,
                    "success_criteria": f.success_criteria,
                }
                for f in self.output_spec
            ],
            "execution": {
                "side_effects": self.execution.side_effects,
                "rollback_possible": self.execution.rollback_possible,
                "idempotent": self.execution.idempotent,
                "execution_type": self.execution.execution_type.value,
            },
            "audit": {
                "trace_level": self.audit.trace_level.value,
                "required_fields": self.audit.required_fields,
            },
            "dependencies": self.dependencies,
        }
    
    def to_yaml(self, path: str | Path) -> None:
        """Save contract to YAML file"""
        path = Path(path)
        with open(path, 'w', encoding='utf-8') as f:
            yaml.dump(self.to_dict(), f, default_flow_style=False, allow_unicode=True)
