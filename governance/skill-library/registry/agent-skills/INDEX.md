# Agent Skills Registry Index

> Generated from v1.6 AGENT_PLATFORM
>
> Total Skills: 8

---

## Overview

This registry contains governance metadata for all agent skills (tools) defined in the CVF v1.6 AGENT_PLATFORM.

### Risk Distribution

| Risk Level | Count | Skills |
|------------|-------|--------|
| **R0 – Minimal** | 3 | Calculator, DateTime, JSON Parse |
| **R1 – Low** | 1 | File Read |
| **R2 – Medium** | 3 | Web Search, URL Fetch, File Write |
| **R3 – High** | 1 | Code Execute |
| **R4 – Critical** | 0 | — |

---

## Complete Registry

| ID | Skill Name | Risk Level | Autonomy | Roles |
|----|------------|------------|----------|-------|
| [AGT-001](AGT-001_web_search.gov.md) | Web Search | R2 | Supervised | Orchestrator, Builder |
| [AGT-002](AGT-002_code_execute.gov.md) | Code Execute | R3 | Manual | Builder |
| [AGT-003](AGT-003_calculator.gov.md) | Calculator | R0 | Auto | All |
| [AGT-004](AGT-004_datetime.gov.md) | DateTime | R0 | Auto | All |
| [AGT-005](AGT-005_json_parse.gov.md) | JSON Parse | R0 | Auto | All |
| [AGT-006](AGT-006_url_fetch.gov.md) | URL Fetch | R2 | Supervised | Orchestrator, Builder |
| [AGT-007](AGT-007_file_read.gov.md) | File Read | R1 | Auto | All |
| [AGT-008](AGT-008_file_write.gov.md) | File Write | R2 | Supervised | Orchestrator, Builder |

---

## By Category

### Safe Operations (R0)
Auto-approved, all roles, all phases:
- AGT-003: Calculator
- AGT-004: DateTime
- AGT-005: JSON Parse

### Workspace Operations (R1-R2)
- AGT-007: File Read (R1 - Auto)
- AGT-008: File Write (R2 - Supervised)

### External Operations (R2)
Requires supervision, restricted roles:
- AGT-001: Web Search
- AGT-006: URL Fetch

### High-Risk Operations (R3)
Requires approval, builder only:
- AGT-002: Code Execute

---

## Quick Reference

```
R0 (Auto):     Calculator, DateTime, JSON Parse
R1 (Auto):     File Read
R2 (Supervised): Web Search, URL Fetch, File Write
R3 (Manual):   Code Execute
```

---

## Governance Specs

See parent directory for full governance specifications:
- [CVF_SKILL_SPEC.md](../../specs/CVF_SKILL_SPEC.md)
- [CVF_RISK_AUTHORITY_MAPPING.md](../../specs/CVF_RISK_AUTHORITY_MAPPING.md)
