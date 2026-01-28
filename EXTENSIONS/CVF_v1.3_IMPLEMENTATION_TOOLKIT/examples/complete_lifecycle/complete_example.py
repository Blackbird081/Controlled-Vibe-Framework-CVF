#!/usr/bin/env python3
"""
Complete CVF Lifecycle Example

Demonstrates the full lifecycle:
PROPOSED → APPROVED → ACTIVE → execution → audit

Run this script to see CVF in action (without actual API calls).
"""

import sys
from pathlib import Path
from datetime import datetime

# Add SDK to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sdk.models import SkillContract, RiskLevel
from sdk.models.skill_contract import (
    GovernanceConstraints,
    InputField,
    OutputField,
    ExecutionProperties,
    AuditRequirements,
)
from sdk.models.capability import Capability, LifecycleState
from sdk.registry import SkillRegistry
from sdk.audit import AuditTracer
from sdk.adapters.base_adapter import AuditTrace


def create_sample_contract() -> SkillContract:
    """Create a sample Code Review contract"""
    return SkillContract(
        capability_id="CODE_REVIEW_v1",
        domain="development",
        description="Review code for quality, security, and best practices",
        risk_level=RiskLevel.R1,
        version="1.0",
        governance=GovernanceConstraints(
            allowed_archetypes=["Analysis", "Execution"],
            allowed_phases=["C", "D"],
            required_decisions=[],
            required_status="ACTIVE",
        ),
        input_spec=[
            InputField(name="code", type="string", required=True),
            InputField(name="language", type="string", required=False, default="python"),
        ],
        output_spec=[
            OutputField(name="issues", type="array"),
            OutputField(name="score", type="integer", range=[0, 100]),
        ],
        execution=ExecutionProperties(
            side_effects=False,
            rollback_possible=True,
            idempotent=True,
        ),
        audit=AuditRequirements(),
    )


def main():
    print("=" * 60)
    print("CVF Complete Lifecycle Example")
    print("=" * 60)
    print()
    
    # Step 1: Create contract
    print("Step 1: Create Skill Contract")
    print("-" * 40)
    contract = create_sample_contract()
    print(f"  Capability ID: {contract.capability_id}")
    print(f"  Domain: {contract.domain}")
    print(f"  Risk Level: {contract.risk_level.value} ({contract.risk_level.display_name})")
    print(f"  Required Controls: {contract.risk_level.required_controls}")
    print()
    
    # Step 2: Register in registry
    print("Step 2: Register Capability")
    print("-" * 40)
    registry = SkillRegistry()
    capability = registry.register(
        contract=contract,
        owner="dev-team",
        registered_by="admin@example.com",
    )
    print(f"  State: {capability.state.value}")
    print(f"  Can Execute: {capability.can_execute}")
    print()
    
    # Step 3: Approve
    print("Step 3: Approve Contract")
    print("-" * 40)
    success = capability.approve(
        actor="reviewer@example.com",
        reason="Contract meets all CVF requirements"
    )
    print(f"  Approval success: {success}")
    print(f"  State: {capability.state.value}")
    print(f"  Can Execute: {capability.can_execute}")
    print()
    
    # Step 4: Activate
    print("Step 4: Activate for Production")
    print("-" * 40)
    success = capability.activate(
        actor="admin@example.com",
        reason="Ready for production use"
    )
    print(f"  Activation success: {success}")
    print(f"  State: {capability.state.value}")
    print(f"  Can Execute: {capability.can_execute}")
    print()
    
    # Step 5: Check execution eligibility
    print("Step 5: Check Execution Eligibility")
    print("-" * 40)
    
    # Try valid context
    can_exec, reason = registry.can_execute(
        capability_id="CODE_REVIEW_v1",
        archetype="Execution",
        phase="C",
    )
    print(f"  Archetype=Execution, Phase=C: {can_exec} ({reason})")
    
    # Try invalid context
    can_exec, reason = capability.check_execution_eligibility(
        archetype="Decision",  # Not in allowed_archetypes
        phase="C",
    )
    print(f"  Archetype=Decision, Phase=C: {can_exec} ({reason})")
    print()
    
    # Step 6: Simulate execution and create trace
    print("Step 6: Simulate Execution")
    print("-" * 40)
    
    # Create mock trace (in real usage, adapter creates this)
    trace = AuditTrace(
        timestamp=datetime.now(),
        capability_id=contract.capability_id,
        version=contract.version,
        actor="claude_adapter",
        inputs={"code": "def hello(): pass", "language": "python"},
        outputs={"issues": ["Missing docstring"], "score": 85},
        success=True,
        duration_ms=1250,
    )
    print(f"  Execution success: {trace.success}")
    print(f"  Duration: {trace.duration_ms}ms")
    print(f"  Outputs: {trace.outputs}")
    print()
    
    # Step 7: Log to audit trail
    print("Step 7: Log Audit Trace")
    print("-" * 40)
    tracer = AuditTracer()
    tracer.log(
        trace=trace,
        context={"user": "developer@example.com"},
        tags=["code-review", "python"],
    )
    
    stats = tracer.get_stats(capability_id="CODE_REVIEW_v1")
    print(f"  Total executions: {stats['total_executions']}")
    print(f"  Success rate: {stats['success_rate']:.0%}")
    print(f"  Average duration: {stats['avg_duration_ms']:.0f}ms")
    print()
    
    # Step 8: Show transition history
    print("Step 8: Lifecycle History")
    print("-" * 40)
    for transition in capability.transitions:
        print(f"  {transition.from_state.value} → {transition.to_state.value}")
        print(f"    Actor: {transition.actor}")
        print(f"    Reason: {transition.reason}")
        print()
    
    print("=" * 60)
    print("✅ Lifecycle demonstration complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
