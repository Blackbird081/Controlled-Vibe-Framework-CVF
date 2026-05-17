#!/usr/bin/env python3
"""
Validate all contracts in the CVF Community Registry

Usage:
    python validate_all.py
    python validate_all.py --file path/to/contract.yaml
"""

import sys
import yaml
import argparse
from pathlib import Path
from typing import Tuple, List


REQUIRED_FIELDS = {
    "root": ["capability_id", "domain", "description", "risk_level", "version", 
             "governance", "input_spec", "output_spec", "execution", "audit"],
    "governance": ["allowed_archetypes", "allowed_phases", "required_status"],
    "execution": ["side_effects", "rollback_possible", "idempotent"],
    "audit": ["trace_level", "required_fields"]
}

VALID_DOMAINS = ["development", "data", "devops", "security", "communication", "ai-ml", "general"]
VALID_RISKS = ["R0", "R1", "R2", "R3"]
VALID_ARCHETYPES = ["Analysis", "Execution", "Orchestration"]
VALID_PHASES = ["A", "B", "C", "D"]


def validate_contract(contract: dict, path: str = "") -> Tuple[bool, List[str]]:
    """Validate a contract and return (is_valid, errors)."""
    errors = []
    
    # Check root fields
    for field in REQUIRED_FIELDS["root"]:
        if field not in contract:
            errors.append(f"Missing required field: {field}")
    
    # Check nested required fields
    for section, fields in REQUIRED_FIELDS.items():
        if section == "root":
            continue
        if section in contract:
            for field in fields:
                if field not in contract[section]:
                    errors.append(f"Missing {section}.{field}")
    
    # Validate values
    if contract.get("risk_level") not in VALID_RISKS:
        errors.append(f"Invalid risk_level: {contract.get('risk_level')} (expected {VALID_RISKS})")
    
    if contract.get("domain") not in VALID_DOMAINS:
        errors.append(f"Invalid domain: {contract.get('domain')} (expected {VALID_DOMAINS})")
    
    # Validate governance
    gov = contract.get("governance", {})
    for archetype in gov.get("allowed_archetypes", []):
        if archetype not in VALID_ARCHETYPES:
            errors.append(f"Invalid archetype: {archetype}")
    
    for phase in gov.get("allowed_phases", []):
        if phase not in VALID_PHASES:
            errors.append(f"Invalid phase: {phase}")
    
    # Validate input_spec
    inputs = contract.get("input_spec", [])
    if not inputs:
        errors.append("input_spec must have at least 1 item")
    else:
        for i, inp in enumerate(inputs):
            if "name" not in inp:
                errors.append(f"input_spec[{i}] missing 'name'")
            if "type" not in inp:
                errors.append(f"input_spec[{i}] missing 'type'")
    
    # Validate output_spec
    outputs = contract.get("output_spec", [])
    if not outputs:
        errors.append("output_spec must have at least 1 item")
    else:
        for i, out in enumerate(outputs):
            if "name" not in out:
                errors.append(f"output_spec[{i}] missing 'name'")
            if "type" not in out:
                errors.append(f"output_spec[{i}] missing 'type'")
    
    # Risk-specific validations
    risk = contract.get("risk_level")
    if risk in ["R2", "R3"]:
        # Should have failure_info
        if "failure_info" not in contract:
            errors.append(f"R2/R3 contracts should have failure_info section")
    
    if risk == "R3":
        # Should require decisions
        if not gov.get("required_decisions"):
            errors.append("R3 contracts should have required_decisions")
    
    return len(errors) == 0, errors


def find_contracts(root: Path) -> List[Path]:
    """Find all contract YAML files."""
    return list(root.glob("**/*.contract.yaml"))


def main():
    parser = argparse.ArgumentParser(description="Validate CVF contracts")
    parser.add_argument("--file", "-f", help="Validate a specific file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show all details")
    args = parser.parse_args()
    
    registry_root = Path(__file__).parent.parent
    contracts_dir = registry_root / "contracts"
    
    if args.file:
        contracts = [Path(args.file)]
    else:
        contracts = find_contracts(contracts_dir)
    
    if not contracts:
        print("⚠️  No contracts found")
        sys.exit(0)
    
    print(f"\n🔍 Validating {len(contracts)} contract(s)...\n")
    
    valid_count = 0
    invalid_count = 0
    results = []
    
    for contract_path in contracts:
        try:
            with open(contract_path, 'r', encoding='utf-8') as f:
                contract = yaml.safe_load(f)
            
            is_valid, errors = validate_contract(contract, str(contract_path))
            
            if is_valid:
                valid_count += 1
                cap_id = contract.get("capability_id", "Unknown")
                results.append(("✅", cap_id, contract_path.name, []))
            else:
                invalid_count += 1
                cap_id = contract.get("capability_id", "Unknown")
                results.append(("❌", cap_id, contract_path.name, errors))
        
        except yaml.YAMLError as e:
            invalid_count += 1
            results.append(("❌", "YAML Error", contract_path.name, [str(e)]))
        except Exception as e:
            invalid_count += 1
            results.append(("❌", "Error", contract_path.name, [str(e)]))
    
    # Print results
    for status, cap_id, filename, errors in results:
        print(f"{status} {cap_id} ({filename})")
        if errors and (args.verbose or status == "❌"):
            for error in errors:
                print(f"   └─ {error}")
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 Results: {valid_count} valid, {invalid_count} invalid")
    
    if invalid_count > 0:
        print("\n⚠️  Some contracts have errors. Please fix them before contributing.")
        sys.exit(1)
    else:
        print("\n🎉 All contracts are valid!")
        sys.exit(0)


if __name__ == "__main__":
    main()
