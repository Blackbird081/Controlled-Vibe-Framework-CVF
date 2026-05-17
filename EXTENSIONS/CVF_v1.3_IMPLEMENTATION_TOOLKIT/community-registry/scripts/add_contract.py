#!/usr/bin/env python3
"""
Add a contract to the CVF Community Registry

Usage:
    python add_contract.py path/to/contract.yaml
"""

import json
import sys
import yaml
from pathlib import Path
from datetime import datetime


def load_index() -> dict:
    """Load the registry index."""
    index_path = Path(__file__).parent.parent / "REGISTRY_INDEX.json"
    with open(index_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_index(index: dict) -> None:
    """Save the registry index."""
    index_path = Path(__file__).parent.parent / "REGISTRY_INDEX.json"
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2)


def load_contract(path: str) -> dict:
    """Load and parse a contract YAML file."""
    with open(path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)


def validate_contract(contract: dict) -> list:
    """Validate a contract has required fields."""
    required = [
        "capability_id",
        "domain",
        "description",
        "risk_level",
        "version",
        "governance",
        "input_spec",
        "output_spec",
        "execution",
        "audit"
    ]
    
    errors = []
    for field in required:
        if field not in contract:
            errors.append(f"Missing required field: {field}")
    
    # Validate risk level
    if contract.get("risk_level") not in ["R0", "R1", "R2", "R3"]:
        errors.append("Invalid risk_level: must be R0, R1, R2, or R3")
    
    # Validate domain
    valid_domains = ["development", "data", "devops", "security", "communication", "ai-ml", "general"]
    if contract.get("domain") not in valid_domains:
        errors.append(f"Invalid domain: must be one of {valid_domains}")
    
    return errors


def extract_tags(contract: dict) -> list:
    """Extract tags from contract fields."""
    tags = []
    
    # Add domain as tag
    if contract.get("domain"):
        tags.append(contract["domain"])
    
    # Extract from capability_id
    cap_id = contract.get("capability_id", "")
    parts = cap_id.lower().replace("_v", " ").replace("_", " ").split()
    tags.extend([p for p in parts if len(p) > 2 and not p.isdigit()])
    
    # Extract from description
    desc = contract.get("description", "").lower()
    common_tags = ["code", "data", "file", "security", "test", "deploy", "message", "query", "analyze"]
    for tag in common_tags:
        if tag in desc and tag not in tags:
            tags.append(tag)
    
    return list(set(tags))[:8]  # Max 8 tags


def add_to_index(contract: dict, contract_path: str) -> None:
    """Add a contract to the registry index."""
    index = load_index()
    
    # Check for duplicates
    existing = [c for c in index["contracts"] if c["capability_id"] == contract["capability_id"]]
    if existing:
        print(f"⚠️  Contract {contract['capability_id']} already exists. Updating...")
        index["contracts"] = [c for c in index["contracts"] if c["capability_id"] != contract["capability_id"]]
    
    # Create index entry
    entry = {
        "capability_id": contract["capability_id"],
        "domain": contract["domain"],
        "description": contract["description"],
        "risk_level": contract["risk_level"],
        "version": contract["version"],
        "path": contract_path,
        "tags": extract_tags(contract),
        "archetypes": contract.get("governance", {}).get("allowed_archetypes", []),
        "phases": contract.get("governance", {}).get("allowed_phases", []),
        "added": datetime.now().strftime("%Y-%m-%d"),
        "downloads": 0
    }
    
    index["contracts"].append(entry)
    index["total_contracts"] = len(index["contracts"])
    index["last_updated"] = datetime.now().isoformat() + "Z"
    
    # Update domain counts
    for domain in index["domains"]:
        index["domains"][domain]["count"] = len([
            c for c in index["contracts"] if c["domain"] == domain
        ])
    
    # Update risk counts
    for risk in ["R0", "R1", "R2", "R3"]:
        index["risk_counts"][risk] = len([
            c for c in index["contracts"] if c["risk_level"] == risk
        ])
    
    save_index(index)
    print(f"✅ Added {contract['capability_id']} to registry index")


def main():
    if len(sys.argv) < 2:
        print("Usage: python add_contract.py path/to/contract.yaml")
        sys.exit(1)
    
    contract_path = sys.argv[1]
    
    # Check file exists
    if not Path(contract_path).exists():
        print(f"❌ File not found: {contract_path}")
        sys.exit(1)
    
    # Load contract
    try:
        contract = load_contract(contract_path)
    except yaml.YAMLError as e:
        print(f"❌ Invalid YAML: {e}")
        sys.exit(1)
    
    # Validate
    errors = validate_contract(contract)
    if errors:
        print("❌ Contract validation failed:")
        for error in errors:
            print(f"  - {error}")
        sys.exit(1)
    
    # Calculate relative path
    registry_root = Path(__file__).parent.parent
    try:
        rel_path = Path(contract_path).resolve().relative_to(registry_root.resolve())
        rel_path_str = str(rel_path).replace("\\", "/")
    except ValueError:
        # File is not under registry root
        rel_path_str = contract_path
    
    # Add to index
    add_to_index(contract, rel_path_str)
    
    print(f"\n📋 Contract: {contract['capability_id']}")
    print(f"   Domain: {contract['domain']}")
    print(f"   Risk Level: {contract['risk_level']}")
    print(f"   Path: {rel_path_str}")


if __name__ == "__main__":
    main()
