# Complete Lifecycle Example

This example demonstrates the complete CVF capability lifecycle:

```
PROPOSED → APPROVED → ACTIVE → (execution) → audit trace
```

## Overview

We'll create a simple "Code Review" capability and walk through
each stage of its lifecycle.

---

## Step 1: Propose Capability

Create a skill contract file: `code_review.contract.yaml`

```yaml
capability_id: "CODE_REVIEW_v1"
domain: "development"
description: "Review code for quality, security, and best practices"
risk_level: "R1"
version: "1.0"

governance:
  allowed_archetypes: ["Analysis", "Execution"]
  allowed_phases: ["C", "D"]
  required_decisions: []
  required_status: "ACTIVE"

input_spec:
  - name: "code"
    type: "string"
    required: true
  - name: "language"
    type: "string"
    required: false
    default: "python"
  - name: "focus"
    type: "array"
    required: false
    default: ["quality", "security"]

output_spec:
  - name: "issues"
    type: "array"
    success_criteria: "List of identified issues with severity"
  - name: "score"
    type: "integer"
    range: [0, 100]
  - name: "recommendations"
    type: "array"

execution:
  side_effects: false
  rollback_possible: true
  idempotent: true
  execution_type: "EXECUTABLE"

audit:
  trace_level: "Full"
  required_fields: ["timestamp", "actor", "inputs", "outputs"]
```

**State: PROPOSED**

---

## Step 2: Validate Contract

```bash
python cli/cvf_validate.py validate code_review.contract.yaml
```

Expected output:
```
✅ code_review.contract.yaml: VALID
```

---

## Step 3: Approve Contract

Using the SDK:

```python
from sdk import SkillRegistry, SkillContract

# Load contract
contract = SkillContract.from_yaml("code_review.contract.yaml")

# Create registry
registry = SkillRegistry()

# Register (enters PROPOSED state)
capability = registry.register(
    contract=contract,
    owner="dev-team",
    registered_by="admin@example.com"
)

print(f"State: {capability.state}")  # PROPOSED

# Approve after review
capability.approve(
    actor="reviewer@example.com",
    reason="Contract meets all requirements"
)

print(f"State: {capability.state}")  # APPROVED
```

---

## Step 4: Activate Capability

```python
# Activate for production use
capability.activate(
    actor="admin@example.com",
    reason="Ready for production deployment"
)

print(f"State: {capability.state}")  # ACTIVE
print(f"Can execute: {capability.can_execute}")  # True
```

---

## Step 5: Execute with Adapter

```python
from sdk.adapters import ClaudeAdapter

# Create adapter
adapter = ClaudeAdapter(
    api_key="your-api-key",
    model="claude-sonnet-4-20250514"
)

# Resolve capability from registry
capability = registry.resolve(
    capability_id="CODE_REVIEW_v1",
    archetype="Execution",
    phase="C",
    controls=["Logging", "Scope Guard"]  # Required for R1
)

# Execute
result = adapter.execute(
    contract=capability.contract,
    inputs={
        "code": """
def calculate_total(items):
    total = 0
    for i in items:
        total = total + i['price'] * i['quantity']
    return total
        """,
        "language": "python",
        "focus": ["quality", "security"]
    }
)

print(f"Success: {result.success}")
print(f"Outputs: {result.outputs}")
```

---

## Step 6: Audit Trace

```python
from sdk.audit import AuditTracer

# Create tracer
tracer = AuditTracer()

# Log the execution trace
tracer.log(
    trace=result.trace,
    context={"user": "developer@example.com", "session": "abc123"},
    tags=["code-review", "python"]
)

# Query audit logs
logs = tracer.query(capability_id="CODE_REVIEW_v1", limit=10)
for log in logs:
    print(f"{log.trace.timestamp}: {log.trace.success}")

# Get statistics
stats = tracer.get_stats(capability_id="CODE_REVIEW_v1")
print(f"Success rate: {stats['success_rate']:.1%}")
```

---

## Complete Script

See [complete_example.py](./complete_example.py) for a runnable script
that demonstrates all steps.

---

## Lifecycle States Reference

| State | Can Execute | Next States | Notes |
|-------|-------------|-------------|-------|
| PROPOSED | ❌ | APPROVED | Initial state after registration |
| APPROVED | ❌ (sandbox only) | ACTIVE | Contract validated, pending activation |
| ACTIVE | ✅ | DEPRECATED, RETIRED | Production-ready |
| DEPRECATED | ✅ (with warning) | RETIRED | Not recommended for new use |
| RETIRED | ❌ | - | Terminal state, audit only |
