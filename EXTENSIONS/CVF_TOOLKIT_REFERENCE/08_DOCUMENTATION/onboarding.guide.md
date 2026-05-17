# Onboarding Guide — CVF Toolkit

## Welcome

The CVF (Competence Validation Framework) Toolkit is a governance-first integration layer for AI systems. This guide will help new developers understand the architecture, set up the project, and make their first contribution.

## Prerequisites

- Node.js >= 18.0.0
- TypeScript >= 5.3
- Git

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd "CVF Toolkit Integration Spec"

# Install dependencies
npm install

# Verify TypeScript compiles
npm run lint

# Run tests
npm test
```

## Project Structure

```
00_CANONICAL_REFERENCE/  ← CVF version lock (DO NOT MODIFY)
01_CORE_MAPPING/         ← Spec documents (governance, risk, skill, change, agent)
02_TOOLKIT_CORE/         ← TypeScript enforcement engine
03_ADAPTER_LAYER/        ← Bridges external systems → CVF core
04_EXTENSION_LAYER/      ← Domain-specific extensions (financial, dexter)
05_UAT_AND_CERTIFICATION/← Quality gates
06_VERSIONING_AND_FREEZE/← Version control and freeze protocol
07_AI_PROVIDER_ABSTRACTION/ ← AI model providers (OpenAI, Claude, Gemini)
08_DOCUMENTATION/        ← Guides and references
```

## Key Concepts

### 1. Governance-First
Every AI operation must pass through `governance.guard.ts` before execution. No bypass is allowed.

### 2. Risk Levels (R1–R4)
| Level | Description | Example | Requires |
|-------|-------------|---------|----------|
| R1 | Low risk | Data retrieval | Nothing extra |
| R2 | Moderate risk | Data analysis | UAT |
| R3 | High risk | Decision support | UAT + Approval + Freeze |
| R4 | Critical risk | Automated trading | UAT + Multi-Approval + Freeze |

### 3. Phases (P0–P6)
Skills progress through 7 sequential phases: Design → Build → Validation → UAT → Approved → Production → Frozen.

### 4. Operators
Roles: ANALYST < REVIEWER < APPROVER < ADMIN. Higher risk requires higher role.

## Your First Task

### Adding a New Skill

1. Define the skill in the appropriate extension's `skill.pack.ts`
2. Set the risk level (R1–R4)
3. Set the `domain` field
4. Register via `skillRegistry.register(...)`
5. Write UAT test cases

### Creating a New Extension

1. Copy `04_EXTENSION_LAYER/_extension.template/`
2. Rename to `{domain}.extension/`
3. Implement: risk profile, skill pack, validation rules
4. See `_extension.template/README.md` for full checklist

## Important Rules

1. **Never modify `02_TOOLKIT_CORE/` from extensions** — extend without mutation
2. **Never skip phases** — P0→P1→P2→P3→P4→P5→P6 only
3. **Risk never downgrades** — once R3 always R3 (for that context)
4. **Always audit** — every governance decision must generate an audit record
5. **Use `interfaces.ts`** — import shared types from here

## Key Files to Read First

1. `08_DOCUMENTATION/architecture.overview.md` — visual architecture
2. `08_DOCUMENTATION/api.reference.md` — function signatures
3. `02_TOOLKIT_CORE/interfaces.ts` — all type definitions
4. `02_TOOLKIT_CORE/dependency.map.md` — module dependencies
5. `01_CORE_MAPPING/governance.mapping.md` — governance spec
