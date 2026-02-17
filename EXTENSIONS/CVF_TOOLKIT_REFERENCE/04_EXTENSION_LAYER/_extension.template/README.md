# Extension Template

Use this template to create new domain-specific extensions for the CVF Toolkit.

## Quick Start

1. Copy this entire `_extension.template` folder
2. Rename to `{domain}.extension` (e.g., `logistics.extension`)
3. Implement all 3 required files
4. Register skills via `skill.registry`
5. Write UAT tests per risk level

## Required Files

| File | Purpose |
|------|---------|
| `{domain}.risk.profile.ts` | Map domain-specific risk factors → CVF R1–R4 |
| `{domain}.skill.pack.ts`   | Register domain skills into skill.registry |
| `{domain}.validation.rules.ts` | Domain-specific output validation |

## Checklist

- [ ] Risk profile maps to R1–R4
- [ ] All skills have explicit `domain` field
- [ ] Validation rules check output quality
- [ ] UAT test cases written per rubric
- [ ] README documents purpose and risk profile
- [ ] No imports from other extensions
- [ ] No modification to `02_TOOLKIT_CORE`
- [ ] Adapter registered if external bridge needed

## Risk Estimation Guide

| Domain Context | Suggested Risk |
|----------------|---------------|
| Read-only data fetch | R1 |
| Computation / analysis | R2 |
| Decision support with human review | R3 |
| Automated action / recommendation without human review | R4 |
