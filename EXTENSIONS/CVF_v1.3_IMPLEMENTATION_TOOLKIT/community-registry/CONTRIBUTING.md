# Contributing to CVF Community Registry

Thank you for contributing! This guide explains how to add new contracts to the registry.

---

## 📋 Requirements

Before submitting a contract, ensure it meets these criteria:

### Required Fields

| Field | Description |
|-------|-------------|
| `capability_id` | Unique ID, format: `NAME_v1` (uppercase, underscores) |
| `domain` | One of: development, data, devops, security, communication, ai-ml, general |
| `description` | Clear, concise description (50-200 chars) |
| `risk_level` | R0, R1, R2, or R3 with appropriate controls |
| `version` | Semantic version (e.g., "1.0") |
| `governance` | allowed_archetypes, allowed_phases, required_status |
| `input_spec` | At least 1 input field |
| `output_spec` | At least 1 output field |
| `execution` | side_effects, rollback_possible, idempotent |
| `audit` | trace_level, required_fields |

### Quality Standards

- ✅ **Descriptive** — Anyone should understand what it does
- ✅ **Scoped** — Single responsibility, not too broad
- ✅ **Safe** — Risk level matches actual impact
- ✅ **Tested** — You've validated it works
- ✅ **Documented** — Clear inputs/outputs with types

---

## 🚀 Submission Process

### Step 1: Create Your Contract

```yaml
# my_capability.contract.yaml

capability_id: "MY_CAPABILITY_v1"
domain: "development"
description: "What this capability does"
risk_level: "R1"
version: "1.0"

governance:
  allowed_archetypes: ["Execution"]
  allowed_phases: ["C"]
  required_decisions: []
  required_status: "ACTIVE"

input_spec:
  - name: "input_name"
    type: "string"
    required: true
    description: "What this input is for"

output_spec:
  - name: "result"
    type: "string"
    success_criteria: "When is this considered successful"

execution:
  side_effects: false
  rollback_possible: true
  idempotent: true

audit:
  trace_level: "Full"
  required_fields:
    - "timestamp"
    - "actor"
    - "inputs"
    - "outputs"
```

### Step 2: Validate

```bash
# Using cvf-validate CLI
python cli/cvf_validate.py validate path/to/my_capability.contract.yaml

# Using validate script
python scripts/validate_all.py --file path/to/my_capability.contract.yaml
```

### Step 3: Place in Correct Domain

```
contracts/
├── development/    # Code-related
├── data/           # Database, data processing
├── devops/         # Infrastructure, deployment
├── security/       # Security tools
├── communication/  # Messaging
├── ai-ml/          # ML operations
└── general/        # Everything else
```

### Step 4: Add to Index

```bash
python scripts/add_contract.py contracts/development/my_capability.contract.yaml
```

Or manually add entry to `REGISTRY_INDEX.json`.

### Step 5: Submit PR

1. Fork the repository
2. Create branch: `feat/add-my-capability`
3. Commit your changes
4. Open Pull Request with description

---

## 📝 Contract Naming Conventions

### Capability ID

```
<ACTION>_<OBJECT>_v<VERSION>

Examples:
- CODE_REVIEW_v1
- DATABASE_QUERY_v1
- FILE_WRITE_v1
- TEXT_ANALYSIS_v1
```

### File Name

```
<capability_id_lowercase>.contract.yaml

Examples:
- code_review.contract.yaml
- database_query.contract.yaml
```

---

## ⚠️ Risk Level Guidelines

| Risk | When to Use | Examples |
|:----:|-------------|----------|
| **R0** | Read-only, no side effects | Analysis, metrics, parsing |
| **R1** | Small bounded changes | Generate code, transform data |
| **R2** | External systems, may chain | Send message, query database |
| **R3** | System changes, irreversible | Write files, delete, deploy |

### R2/R3 Requirements

If your contract is R2 or R3, include:

```yaml
governance:
  required_decisions:
    - "EXPLICIT_APPROVAL"

failure_info:
  known_failure_modes:
    - "What could go wrong"
  worst_case_impact: "What's the worst outcome"
  human_intervention_required: true  # For R3
```

---

## 🔍 Review Process

1. **Automated Checks**
   - YAML syntax valid
   - All required fields present
   - Risk level appropriate

2. **Maintainer Review**
   - Quality standards met
   - No duplicate functionality
   - Proper categorization

3. **Merge**
   - Index updated
   - Changelog entry added

---

## 🏷️ Tagging

Add relevant tags to help discoverability:

```json
"tags": ["code", "review", "quality", "security"]
```

Common tags:
- By action: `review`, `generate`, `analyze`, `transform`, `send`
- By subject: `code`, `data`, `file`, `message`, `security`
- By technology: `sql`, `json`, `python`, `docker`

---

## ❓ Questions

- Open an issue for questions
- Tag with `question` label
- Maintainers respond within 48 hours

---

**Thank you for contributing to the CVF Community Registry!**
