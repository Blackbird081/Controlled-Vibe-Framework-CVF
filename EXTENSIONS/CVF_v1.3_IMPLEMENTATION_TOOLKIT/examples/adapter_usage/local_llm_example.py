#!/usr/bin/env python3
"""
Generic (Local LLM) Adapter Usage Example

Demonstrates how to use local LLMs with CVF via Ollama.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sdk import SkillContract, SkillRegistry
from sdk.adapters import GenericAdapter


def main():
    # Load contract
    contract = SkillContract.from_yaml(
        Path(__file__).parent.parent / "real_world_contracts" / "code_review.contract.yaml"
    )
    
    print(f"Loaded contract: {contract.capability_id}")
    print()
    
    # Create adapter for Ollama
    adapter = GenericAdapter(
        base_url="http://localhost:11434",  # Default Ollama port
        model="llama2",
        api_type="ollama",
        actor="local_llm"
    )
    
    # Check health
    if adapter.health_check():
        print("✅ Ollama is running")
        
        # Execute
        result = adapter.execute(
            contract=contract,
            inputs={
                "code": "def greet(name): print(f'Hello {name}')",
                "language": "python"
            }
        )
        
        print(f"Success: {result.success}")
        print(f"Duration: {result.trace.duration_ms}ms")
        
    else:
        print("❌ Ollama not running. Start with: ollama serve")
        print()
        print("Trying LM Studio (OpenAI-compatible)...")
        
        # Try LM Studio
        adapter = GenericAdapter(
            base_url="http://localhost:1234",  # Default LM Studio port
            model="local-model",
            api_type="openai_compatible",
            actor="local_llm"
        )
        
        if adapter.health_check():
            print("✅ LM Studio is running")
        else:
            print("❌ No local LLM available")
            print()
            print("To use this example, run one of:")
            print("  - Ollama: ollama serve")
            print("  - LM Studio: Start the server in LM Studio app")


if __name__ == "__main__":
    main()
