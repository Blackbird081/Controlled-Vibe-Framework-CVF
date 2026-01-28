# Real-World Contract Examples

This directory contains production-ready Skill Contract examples
at different risk levels.

## Contracts

### R1 - Code Review (`code_review.contract.yaml`)
- **Domain**: development
- **Risk**: R1 (Controlled)
- **Description**: Reviews code without modifying it
- **Key Properties**: No side effects, idempotent

### R2 - Database Query (`database_query.contract.yaml`)  
- **Domain**: data
- **Risk**: R2 (Elevated)
- **Description**: Read-only database queries
- **Key Properties**: Requires DATA_ACCESS_APPROVED decision

### R3 - File Operations (`file_operations.contract.yaml`)
- **Domain**: devops
- **Risk**: R3 (Critical)
- **Description**: Write files to filesystem
- **Key Properties**: Has side effects, requires human approval

## Risk Level Comparison

| Level | Example | Side Effects | Human Approval | Required Decisions |
|-------|---------|:------------:|:--------------:|:------------------:|
| R0 | (read-only analysis) | ❌ | ❌ | None |
| R1 | Code Review | ❌ | ❌ | None |
| R2 | Database Query | ❌ | ⚠️ | 1+ |
| R3 | File Write | ✅ | ✅ | 2+ |

## Usage

```python
from sdk import SkillContract

# Load any contract
contract = SkillContract.from_yaml("code_review.contract.yaml")

# Check risk level
print(contract.risk_level)  # R1
print(contract.risk_level.required_controls)  # ['Logging', 'Scope Guard']

# Validate inputs
is_valid, errors = contract.validate_inputs({
    "code": "print('hello')",
    "language": "python"
})
```

## Validation

```bash
# Validate all contracts
python cli/cvf_validate.py validate --all examples/real_world_contracts/

# Lint for style
python cli/cvf_validate.py lint examples/real_world_contracts/
```
