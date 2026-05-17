Memory class: SUMMARY_RECORD

# CVF ADD-E1 Scoped Knowledge Runtime Adoption Roadmap - 2026-05-17

Status: COMPLETED LOCALLY.

## Purpose

Complete Step 10c by adding a scoped knowledge / code graph provider contract
to the Control Plane Foundation.

## Scope

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Runtime files:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/scoped.knowledge.provider.contract.ts`
- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/scoped.knowledge.provider.contract.test.ts`
- knowledge barrel export update.

ADR:

- `docs/reference/CVF_ADR_SCOPED_KNOWLEDGE_AS_INTAKE_SUBCLASS_2026-05-17.md`

## Non-Goals

- no code execution;
- no indexing runtime or code graph engine;
- no separate source registry;
- no provider authority to classify risk or override policy;
- no release gate or GA posture change.

## Authorization

Authorized by:

- `docs/baselines/CVF_GC018_ADD_E1_SCOPED_KNOWLEDGE_AUTHORIZATION_2026-05-17.md`

## Work Plan

| Step | Work | Status |
|---|---|---|
| 1 | GC-018 authorization | complete |
| 2 | GC-023 pre-flight | complete |
| 3 | Add `ScopedKnowledgeProvider` schema | complete |
| 4 | Add scoped query and provider-action guard helpers | complete |
| 5 | Add ADD-B `ContextProfile.sourceRelevance` mapping | complete |
| 6 | Add focused tests and ADR | complete |
| 7 | Update inventory, consensus roadmap, and handoff | complete |

## Acceptance Criteria

The tranche is acceptable only if:

- provider scope declares repo paths, exclusions, and optional language filters;
- queries respect max result limits, exclusions, language filters, and rejected
  provider source class;
- provider action attempts always return a blocked result;
- provider output maps to `ContextProfile.sourceRelevance`;
- CPF tests and TypeScript checks pass.

## Verification

Executed:

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
npm test
npm run check
```

GC-023 pre-flight used PowerShell line measurement because `wc` is unavailable
in this environment. `knowledge.vault.intake.contract.ts` measured 575 lines;
the scoped provider was placed in a new file because adding the implementation
in place would push the existing contract past the governed size safety margin.

## Claim Boundary

ADD-E1 is a read-only provider contract only. It does not execute code, build
an index, classify risk, directly inject context, or override governance
decisions.
