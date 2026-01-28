#!/usr/bin/env python3
"""
Claude Adapter Usage Example

Demonstrates how to use the Claude adapter with CVF.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sdk import SkillContract, SkillRegistry
from sdk.adapters import ClaudeAdapter


def main():
    # Load contract
    contract = SkillContract.from_yaml(
        Path(__file__).parent.parent / "real_world_contracts" / "code_review.contract.yaml"
    )
    
    print(f"Loaded contract: {contract.capability_id}")
    print(f"Risk Level: {contract.risk_level.value}")
    print()
    
    # Create adapter
    # Note: Set ANTHROPIC_API_KEY environment variable
    adapter = ClaudeAdapter(
        model="claude-sonnet-4-20250514",
        actor="example_script"
    )
    
    # Check health
    if not adapter.health_check():
        print("❌ Claude API not available. Set ANTHROPIC_API_KEY environment variable.")
        print()
        print("Example (mock execution):")
        print("-" * 40)
        
        # Show what would be sent
        inputs = {
            "code": "def add(a, b): return a + b",
            "language": "python",
            "focus_areas": ["quality"]
        }
        
        is_valid, errors = contract.validate_inputs(inputs)
        print(f"Inputs valid: {is_valid}")
        if not is_valid:
            print(f"Errors: {errors}")
        
        return
    
    # Execute with real API
    print("Executing code review...")
    result = adapter.execute(
        contract=contract,
        inputs={
            "code": """
def calculate_total(items):
    total = 0
    for item in items:
        total += item['price'] * item['quantity']
    return total
            """,
            "language": "python",
            "focus_areas": ["quality", "performance"]
        }
    )
    
    print(f"Success: {result.success}")
    print(f"Duration: {result.trace.duration_ms}ms")
    print()
    print("Outputs:")
    for key, value in result.outputs.items():
        print(f"  {key}: {value[:100]}..." if len(str(value)) > 100 else f"  {key}: {value}")


if __name__ == "__main__":
    main()
