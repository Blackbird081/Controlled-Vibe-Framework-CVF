# Mapping Index — Core Mapping Cross-Reference

Maps every CVF concept to its spec definition and implementation file.

## Governance Mapping

| Concept | Spec Definition | Implementation |
|---------|----------------|----------------|
| 7 Governance Pillars | `governance.mapping.md` §2 | `governance.guard.ts` |
| Operator Authorization | `governance.mapping.md` §3 | `operator.policy.ts` |
| Risk-Based Enforcement | `governance.mapping.md` §4 | `risk.classifier.ts` |
| Phase-Based Control | `governance.mapping.md` §5 | `phase.controller.ts` |
| Execution Flow P0–P6 | `governance.mapping.md` §8 | `governance.guard.ts` |

## Risk-Phase Mapping

| Concept | Spec Definition | Implementation |
|---------|----------------|----------------|
| 7-Phase Model (P0–P6) | `risk.phase.mapping.md` §5 | `phase.controller.ts` |
| Risk Levels (R1–R4) | `risk.phase.mapping.md` §4 | `risk.classifier.ts`, `interfaces.ts` |
| Risk-Phase Matrix | `risk.phase.mapping.md` §6 | `governance.guard.ts` |
| Phase Transition Rules | `risk.phase.mapping.md` §5.1 | `phase.controller.ts` |

## Skill Schema Mapping

| Concept | Spec Definition | Implementation |
|---------|----------------|----------------|
| Canonical Skill Contract | `skill.schema.mapping.md` §3 | `skill.registry.ts` |
| Skill Risk Level | `skill.schema.mapping.md` §4 | `risk.classifier.ts` |
| Phase Requirement | `skill.schema.mapping.md` §5 | `phase.controller.ts` |

## Change Control Mapping

| Concept | Spec Definition | Implementation |
|---------|----------------|----------------|
| Change Lifecycle | `change.control.mapping.md` §2 | `change.controller.ts` |
| Approval Rules | `change.control.mapping.md` §3 | `change.controller.ts` |
| Freeze Integration | `change.control.mapping.md` §4 | `freeze.protocol.ts` |

## Agent Lifecycle Mapping

| Concept | Spec Definition | Implementation |
|---------|----------------|----------------|
| Agent Registration | `agent.lifecycle.mapping.md` §2 | `cvf.agent.adapter.ts` |
| Multi-Agent Risk | `agent.lifecycle.mapping.md` §3 | `risk.classifier.ts` |
| Risk Dominance | `agent.lifecycle.mapping.md` §4 | `governance.guard.ts` |

## Coverage Summary

| Category | Concepts | Implemented | Coverage |
|----------|----------|-------------|----------|
| Governance | 5 | 5 | 100% |
| Risk-Phase | 4 | 4 | 100% |
| Skill Schema | 3 | 3 | 100% |
| Change Control | 3 | 3 | 100% |
| Agent Lifecycle | 3 | 3 | 100% |
| **Total** | **18** | **18** | **100%** |
