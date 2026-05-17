# 🌐 CVF Community Registry

Central repository for sharing and discovering CVF Skill Contracts across teams and projects.

---

## 🎯 Purpose

The Community Registry provides:
- **Discoverability** — Find contracts for common tasks
- **Reusability** — Don't reinvent the wheel
- **Quality** — Peer-reviewed, validated contracts
- **Standardization** — Consistent patterns across teams

---

## 📂 Structure

```
community-registry/
├── README.md               ← You are here
├── REGISTRY_INDEX.json     # Searchable catalog
├── CONTRIBUTING.md         # How to contribute
├── contracts/              # All contracts organized by domain
│   ├── development/        # Code-related
│   ├── data/               # Data operations
│   ├── devops/             # Infrastructure
│   ├── security/           # Security tools
│   ├── communication/      # Email, chat, notifications
│   ├── ai-ml/              # AI/ML operations
│   └── general/            # General utilities
└── scripts/                # Registry management
    ├── add_contract.py
    ├── search.py
    └── validate_all.py
```

---

## 🔍 Browse Contracts

### By Domain

| Domain | Description | Count |
|--------|-------------|:-----:|
| [development](contracts/development/) | Code review, refactoring, testing | 3 |
| [data](contracts/data/) | Database queries, data processing | 2 |
| [devops](contracts/devops/) | File operations, deployments | 2 |
| [security](contracts/security/) | Vulnerability scanning, auth | 1 |
| [communication](contracts/communication/) | Email, Slack, notifications | 1 |
| [ai-ml](contracts/ai-ml/) | Text analysis, embeddings | 2 |
| [general](contracts/general/) | Utilities, helpers | 1 |

### By Risk Level

| Risk | Description | Contracts |
|:----:|-------------|-----------|
| **R0** | Passive, no side effects | TEXT_ANALYSIS_v1, CODE_ANALYSIS_v1, EMBEDDING_GENERATE_v1 |
| **R1** | Controlled side effects | CODE_REVIEW_v1, UNIT_TEST_GENERATE_v1, DATA_TRANSFORM_v1 |
| **R2** | Elevated, requires approval | DATABASE_QUERY_v1, SLACK_MESSAGE_v1, DEPLOYMENT_TRIGGER_v1 |
| **R3** | Critical, human approval | FILE_WRITE_v1, VULN_REMEDIATE_v1 |

---

## 🚀 Quick Start

### Search for Contracts

```bash
# Search by keyword
python scripts/search.py "code review"

# Search by domain
python scripts/search.py --domain development

# Search by risk level
python scripts/search.py --risk R1
```

### Use a Contract

```python
from cvf_sdk import SkillContract, SkillRegistry

# Load from community registry
contract = SkillContract.from_yaml(
    "community-registry/contracts/development/code_review.contract.yaml"
)

# Register and use
registry = SkillRegistry()
registry.register(contract)
```

### Validate All Contracts

```bash
python scripts/validate_all.py
```

---

## 📝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Steps

1. **Fork** the repository
2. **Create** your contract in appropriate domain folder
3. **Validate** with `cvf-validate`
4. **Add** to index: `python scripts/add_contract.py path/to/contract.yaml`
5. **Submit** Pull Request

### Contract Requirements

- ✅ Valid YAML with all required fields
- ✅ Descriptive capability_id (e.g., `CODE_REVIEW_v1`)
- ✅ Appropriate risk_level with justification
- ✅ Clear input/output specs
- ✅ Example usage in description

---

## 📊 Registry Stats

| Metric | Value |
|--------|-------|
| Total Contracts | 12 |
| Domains | 7 |
| R0 Contracts | 3 |
| R1 Contracts | 4 |
| R2 Contracts | 3 |
| R3 Contracts | 2 |
| Contributors | 1 |

*Last updated: 2026-01-29*

---

## 🔗 Integration

### With CVF SDK

```python
from cvf_sdk import CommunityRegistry

# Initialize with registry path
community = CommunityRegistry("path/to/community-registry")

# Search
results = community.search(domain="development", risk="R1")

# Load contract
contract = community.get("CODE_REVIEW_v1")
```

### With CI/CD

```yaml
# .github/workflows/validate-contracts.yml
- name: Validate Community Contracts
  run: python community-registry/scripts/validate_all.py
```

---

## 📜 License

CC BY-NC-ND 4.0 License — All contracts are open source for non-commercial use.

---

**Questions?** Open an issue or reach out to maintainers.
