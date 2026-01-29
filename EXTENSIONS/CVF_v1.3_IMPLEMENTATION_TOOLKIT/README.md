# CVF v1.3 — Implementation Toolkit

**Tagline:** *From specification to execution — CVF becomes actionable.*

## Overview

CVF v1.3 bridges the gap between v1.2's governance specifications and practical implementation.
This toolkit provides everything needed to **validate, register, and execute** capabilities
while maintaining CVF's governance-first principles.

---

## What's New in v1.3

| Component | Description | Status |
|-----------|-------------|:------:|
| **Python SDK** | Programmatic access to Skill Registry & Contracts | ✅ |
| **CLI Tool** | `cvf-validate` for contract validation | ✅ |
| **Agent Adapters** | Claude, GPT, Generic LLM adapters | ✅ |
| **CI/CD Templates** | GitHub Actions, pre-commit hooks | ✅ |
| **VS Code Extension** | Syntax highlighting, validation, snippets | ✅ NEW |
| **Dashboard** | Web UI for capability lifecycle monitoring | ✅ NEW |
| **End-to-End Examples** | Complete lifecycle demonstrations | ✅ |

---

## Installation

### Python SDK

```bash
# Install from local path
pip install -e ./sdk

# Or copy sdk/ folder to your project
```

### CLI Tool

```bash
# Add to PATH or run directly
python cli/cvf_validate.py --help
```

---

## Quick Start

### 1. Validate a Skill Contract

```bash
python cli/cvf_validate.py validate path/to/contract.yaml
```

### 2. Use the SDK

```python
from cvf_sdk import SkillRegistry, SkillContract

# Load registry
registry = SkillRegistry()

# Load and validate contract
contract = SkillContract.from_yaml("my_skill.contract.yaml")
registry.register(contract)

# Check if capability can be executed
if registry.can_execute("MY_CAPABILITY_ID", archetype="Execution", phase="C"):
    result = registry.get_adapter("claude").execute(contract, inputs={...})
```

### 3. Use Agent Adapter

```python
from cvf_sdk.adapters import ClaudeAdapter

adapter = ClaudeAdapter(api_key="...")
result = adapter.execute(contract, inputs={"query": "..."})

# Result includes audit trace
print(result.trace)
```

---

## Directory Structure

```
CVF_v1.3_IMPLEMENTATION_TOOLKIT/
├── README.md                 ← You are here
├── sdk/                      # Python SDK
│   ├── __init__.py
│   ├── models/               # Data models
│   ├── registry/             # Skill Registry
│   ├── adapters/             # Agent adapters
│   └── audit/                # Audit logging
├── cli/                      # CLI tools
│   ├── cvf_validate.py       # Main CLI
│   ├── commands/             # CLI commands
│   └── schemas/              # JSON Schemas
├── ci_cd/                    # CI/CD templates
│   ├── github_actions/
│   └── pre_commit/
├── vscode-extension/         # VS Code Extension
│   ├── package.json
│   ├── syntaxes/             # Syntax highlighting
│   ├── snippets/             # Code snippets
│   └── src/                  # Extension source
├── dashboard/                # Web Dashboard
│   ├── index.html
│   ├── css/
│   └── js/
└── examples/                 # Usage examples
    ├── complete_lifecycle/
    ├── real_world_contracts/
    └── adapter_usage/
```

---

## Core Concepts

### Skill Contract (YAML Format)

```yaml
capability_id: "CODE_REVIEW_v1"
domain: "development"
risk_level: "R1"  # Controlled
description: "Review code for quality and security issues"

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

output_spec:
  - name: "issues"
    type: "array"
  - name: "score"
    type: "integer"
    range: [0, 100]

execution:
  side_effects: false
  rollback_possible: true
  idempotent: true
  execution_type: "EXECUTABLE"

audit:
  trace_level: "Full"
  required_fields: ["timestamp", "actor", "inputs", "outputs"]
```

---

## Relationship to CVF Versions

| Version | Type | Focus |
|---------|------|-------|
| v1.0 | Core | Phase-based governance |
| v1.1 | Core Extension | Agent archetypes, execution spine |
| v1.2 | Capability Extension | Skill contracts, registry model |
| **v1.3** | **Implementation Toolkit** | **SDK, CLI, adapters, CI/CD** |

v1.3 does NOT replace v1.2. It **implements** v1.2's specifications.

---

## CVF Compliance

This toolkit is **CVF-compliant** and follows all governance rules:

- ✅ Deny-first policy for contracts
- ✅ Risk-based controls (R0-R3)
- ✅ Lifecycle enforcement (PROPOSED → ACTIVE)
- ✅ Full audit trails
- ✅ Agent-agnostic design

---

## License

MIT License — see [LICENSE](../../LICENSE)

---

**v1.3 makes CVF actionable. Governance is no longer just documentation.**
