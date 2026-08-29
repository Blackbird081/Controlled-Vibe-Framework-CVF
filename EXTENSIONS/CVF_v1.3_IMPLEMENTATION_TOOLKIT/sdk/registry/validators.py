"""
Contract and Registry Validators

Provides validation utilities for CVF contracts and registry entries.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional
import yaml
import json

from ..models.skill_contract import SkillContract
from ..models.risk import RiskLevel


@dataclass
class ValidationResult:
    """Result of a validation check"""
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    
    @property
    def has_warnings(self) -> bool:
        return len(self.warnings) > 0
    
    def to_dict(self) -> Dict:
        return {
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class ContractValidator:
    """
    Validates Skill Contracts against CVF v1.2 specification
    """
    
    REQUIRED_SECTIONS = [
        "capability_id",
        "domain",
        "description",
        "risk_level",
        "governance",
        "input_spec",
        "output_spec",
        "execution",
        "audit",
    ]
    
    VALID_RISK_LEVELS = ["R0", "R1", "R2", "R3"]
    
    VALID_ARCHETYPES = [
        "Analysis",
        "Decision",
        "Planning",
        "Execution",
        "Supervisor",
        "Exploration",
    ]
    
    VALID_PHASES = ["A", "B", "C", "D"]
    
    VALID_EXECUTION_TYPES = ["EXECUTABLE", "NON_EXECUTABLE"]
    
    VALID_TRACE_LEVELS = ["Basic", "Full"]
    
    def validate(self, contract_path: Path | str) -> ValidationResult:
        """
        Validate a contract file
        
        Args:
            contract_path: Path to YAML contract file
            
        Returns:
            ValidationResult with errors and warnings
        """
        errors = []
        warnings = []
        
        # Load file
        try:
            path = Path(contract_path)
            with open(path, 'r', encoding='utf-8') as f:
                data = yaml.safe_load(f)
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                errors=[f"Failed to load contract: {e}"],
                warnings=[],
            )
        
        # Validate structure
        errors.extend(self._validate_structure(data))
        
        if errors:
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
        
        # Validate content
        errors.extend(self._validate_metadata(data))
        errors.extend(self._validate_governance(data.get("governance", {})))
        errors.extend(self._validate_input_spec(data.get("input_spec", [])))
        errors.extend(self._validate_output_spec(data.get("output_spec", [])))
        errors.extend(self._validate_execution(data.get("execution", {})))
        errors.extend(self._validate_audit(data.get("audit", {})))
        
        # Validate risk-based requirements
        risk_errors, risk_warnings = self._validate_risk_requirements(data)
        errors.extend(risk_errors)
        warnings.extend(risk_warnings)
        
        # Check for common issues
        warnings.extend(self._check_common_issues(data))
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )
    
    def validate_dict(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate contract from dictionary"""
        errors = []
        warnings = []
        
        errors.extend(self._validate_structure(data))
        
        if errors:
            return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
        
        errors.extend(self._validate_metadata(data))
        errors.extend(self._validate_governance(data.get("governance", {})))
        errors.extend(self._validate_input_spec(data.get("input_spec", [])))
        errors.extend(self._validate_output_spec(data.get("output_spec", [])))
        errors.extend(self._validate_execution(data.get("execution", {})))
        errors.extend(self._validate_audit(data.get("audit", {})))
        
        risk_errors, risk_warnings = self._validate_risk_requirements(data)
        errors.extend(risk_errors)
        warnings.extend(risk_warnings)
        warnings.extend(self._check_common_issues(data))
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )
    
    def _validate_structure(self, data: Dict) -> List[str]:
        """Validate contract has required sections"""
        errors = []
        
        for section in self.REQUIRED_SECTIONS:
            if section not in data:
                errors.append(f"Missing required section: {section}")
        
        return errors
    
    def _validate_metadata(self, data: Dict) -> List[str]:
        """Validate metadata fields"""
        errors = []
        
        # capability_id
        cap_id = data.get("capability_id", "")
        if not cap_id:
            errors.append("capability_id cannot be empty")
        elif not cap_id.replace("_", "").replace("-", "").isalnum():
            errors.append("capability_id should only contain alphanumeric, underscore, hyphen")
        
        # domain
        if not data.get("domain"):
            errors.append("domain cannot be empty")
        
        # description
        if not data.get("description"):
            errors.append("description cannot be empty")
        
        # risk_level
        risk = data.get("risk_level", "")
        if risk not in self.VALID_RISK_LEVELS:
            errors.append(f"Invalid risk_level: {risk}. Must be one of {self.VALID_RISK_LEVELS}")
        
        return errors
    
    def _validate_governance(self, gov: Dict) -> List[str]:
        """Validate governance constraints"""
        errors = []
        
        # allowed_archetypes
        archetypes = gov.get("allowed_archetypes", [])
        for arch in archetypes:
            if arch not in self.VALID_ARCHETYPES:
                errors.append(f"Invalid archetype: {arch}")
        
        # allowed_phases
        phases = gov.get("allowed_phases", [])
        for phase in phases:
            if phase not in self.VALID_PHASES:
                errors.append(f"Invalid phase: {phase}")
        
        return errors
    
    def _validate_input_spec(self, inputs: List) -> List[str]:
        """Validate input specification"""
        errors = []
        
        if not inputs:
            errors.append("At least one input field is required")
            return errors
        
        names = set()
        for i, field in enumerate(inputs):
            if not isinstance(field, dict):
                errors.append(f"Input field {i} must be an object")
                continue
            
            name = field.get("name")
            if not name:
                errors.append(f"Input field {i} missing 'name'")
            elif name in names:
                errors.append(f"Duplicate input field name: {name}")
            else:
                names.add(name)
            
            if not field.get("type"):
                errors.append(f"Input field '{name}' missing 'type'")
        
        return errors
    
    def _validate_output_spec(self, outputs: List) -> List[str]:
        """Validate output specification"""
        errors = []
        
        if not outputs:
            errors.append("At least one output field is required")
            return errors
        
        names = set()
        for i, field in enumerate(outputs):
            if not isinstance(field, dict):
                errors.append(f"Output field {i} must be an object")
                continue
            
            name = field.get("name")
            if not name:
                errors.append(f"Output field {i} missing 'name'")
            elif name in names:
                errors.append(f"Duplicate output field name: {name}")
            else:
                names.add(name)
            
            if not field.get("type"):
                errors.append(f"Output field '{name}' missing 'type'")
        
        return errors
    
    def _validate_execution(self, exec_props: Dict) -> List[str]:
        """Validate execution properties"""
        errors = []
        
        exec_type = exec_props.get("execution_type", "EXECUTABLE")
        if exec_type not in self.VALID_EXECUTION_TYPES:
            errors.append(f"Invalid execution_type: {exec_type}")
        
        return errors
    
    def _validate_audit(self, audit: Dict) -> List[str]:
        """Validate audit requirements"""
        errors = []
        
        trace_level = audit.get("trace_level", "Full")
        if trace_level not in self.VALID_TRACE_LEVELS:
            errors.append(f"Invalid trace_level: {trace_level}")
        
        return errors
    
    def _validate_risk_requirements(self, data: Dict) -> tuple[List[str], List[str]]:
        """Validate requirements based on risk level"""
        errors = []
        warnings = []
        
        risk = data.get("risk_level", "R0")
        gov = data.get("governance", {})
        decisions = gov.get("required_decisions", [])
        
        # R2 and R3 require decisions
        if risk in ["R2", "R3"] and not decisions:
            if risk == "R3":
                errors.append("Risk level R3 requires at least one decision artifact")
            else:
                warnings.append("Risk level R2 should have required_decisions defined")
        
        # Check failure_info for high risk
        if risk in ["R2", "R3"] and not data.get("failure_info"):
            warnings.append(f"Risk level {risk} should include failure_info section")
        
        return errors, warnings
    
    def _check_common_issues(self, data: Dict) -> List[str]:
        """Check for common issues and return warnings"""
        warnings = []
        
        # Check for empty allowed lists (means all allowed)
        gov = data.get("governance", {})
        if not gov.get("allowed_archetypes"):
            warnings.append("No allowed_archetypes specified - all archetypes can use this")
        if not gov.get("allowed_phases"):
            warnings.append("No allowed_phases specified - all phases can use this")
        
        # Check for non-idempotent operations without rollback
        exec_props = data.get("execution", {})
        if not exec_props.get("idempotent", True) and not exec_props.get("rollback_possible", True):
            warnings.append("Non-idempotent operation with no rollback - high risk")
        
        return warnings


class RegistryValidator:
    """
    Validates registry consistency and integrity
    """
    
    def __init__(self, contract_validator: Optional[ContractValidator] = None):
        self.contract_validator = contract_validator or ContractValidator()
    
    def validate_registry(self, registry_path: Path) -> ValidationResult:
        """Validate registry file"""
        errors = []
        warnings = []
        
        try:
            with open(registry_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                errors=[f"Failed to load registry: {e}"],
                warnings=[],
            )
        
        capabilities = data.get("capabilities", {})
        
        for cap_id, versions in capabilities.items():
            for version, entry in versions.items():
                # Validate contract
                contract_result = self.contract_validator.validate_dict(
                    entry.get("contract", {})
                )
                if not contract_result.is_valid:
                    for error in contract_result.errors:
                        errors.append(f"{cap_id}@{version}: {error}")
                
                warnings.extend(contract_result.warnings)
                
                # Validate state
                state = entry.get("state")
                valid_states = ["PROPOSED", "APPROVED", "ACTIVE", "DEPRECATED", "RETIRED"]
                if state not in valid_states:
                    errors.append(f"{cap_id}@{version}: Invalid state '{state}'")
                
                # Validate ownership
                if state != "PROPOSED" and not entry.get("owner"):
                    warnings.append(f"{cap_id}@{version}: No owner for {state} capability")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
        )
