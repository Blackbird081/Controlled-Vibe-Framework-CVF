
Memory class: SUMMARY_RECORD


Date: `2026-03-20`
Type: baseline delta / compatibility tightening checkpoint
Parent roadmap: `docs/roadmaps/CVF_SYSTEM_UNIFICATION_REMEDIATION_ROADMAP_2026-03-19.md`
Comparison anchor: `docs/baselines/CVF_SYSTEM_UNIFICATION_CLOSURE_DELTA_2026-03-20.md`

## Purpose

- record the batch that narrows remaining legacy phase exposure on public and user-facing surfaces
- make future audits faster by separating "legacy accepted at boundary" from "legacy taught as canonical"

## Implemented Tightening

1. `CVFGuardClient` now publishes canonical phases and normalizes legacy `DISCOVERY` input to `INTAKE`.
2. `SkillRegistry` now normalizes legacy phase input instead of relying on legacy phase metadata as the preferred model.
3. `full-skill-registry` migrated intake-class skills from `DISCOVERY` to `INTAKE`.
4. Web OpenAPI docs now present only canonical phases.
5. `SpecExport` full-mode prompt now teaches `PHASE A: INTAKE` instead of `DISCOVERY`.

## Verification

- `cd EXTENSIONS/CVF_GUARD_CONTRACT && npx vitest run src/sdk/guard-sdk.test.ts src/runtime/full-skill-registry.test.ts src/runtime/agent-execution-runtime.test.ts src/runtime/providers/gemini-provider.test.ts src/runtime/providers/alibaba-dashscope-provider.test.ts` -> PASS
- `cd EXTENSIONS/CVF_GUARD_CONTRACT && npm run check` -> PASS
- `cd EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web && npx vitest run src/components/SpecExport.test.tsx` -> PASS

## Outcome

Legacy compatibility still exists where needed, but it is now more clearly confined to explicit normalization boundaries instead of public canonical guidance.
