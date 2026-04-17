# GC-018 Authorization — W101-T1 Knowledge-Native Execute Path Integration

**Tranche**: W101-T1 — Knowledge-Native Execute Path Integration
**Date**: 2026-04-17
**Lane**: Full Lane (GC-019)
**Risk class**: R2 — new module creation + interface extension + two production file changes
**GC-018 score**: 10/10

---

## Authorization Statement

W101-T1 is authorized as a **Full Lane R2** tranche.

The architecture gap confirmed by W93-T1: the knowledge-native stack (W71–W82) exists in CPF
but is **not wired into `/api/execute`**. `CVF_SYSTEM_PROMPT` is compiled as a static constant;
no injection path exists. This gap caused the W93 Gate 4 result to be `MIXED` rather than
`PROVEN` — benefit was demonstrable on T1 (app_builder_wizard, +2 rubric delta) but
unmeasurable on ceiling templates.

W101-T1 closes this architecture gap by introducing a **knowledge context injection path**:

- **New module**: `src/lib/knowledge-context-injector.ts` — `buildKnowledgeSystemPrompt(base, context)` helper
- **Interface extension**: `ExecutionRequest.knowledgeContext?: string` — optional pre-governed context payload
- **`executeAI` options extension**: `systemPrompt?: string` in options — allows override of `CVF_SYSTEM_PROMPT`
- **Route integration**: `route.ts` extracts `knowledgeContext`, builds enriched system prompt, passes to `executeAI`
- **Response metadata**: `knowledgeInjection: { injected, contextLength }` added to success response for observability

---

## Scope

| Item | Detail |
|------|--------|
| New file | `src/lib/knowledge-context-injector.ts` |
| New test file | `src/lib/knowledge-context-injector.test.ts` |
| Modified | `src/lib/ai/types.ts` — `ExecutionRequest` interface extension |
| Modified | `src/lib/ai/providers.ts` — `executeAI` options extension |
| Modified | `src/app/api/execute/route.ts` — knowledge context extraction + injection |
| New test file | `src/app/api/execute/route.knowledge.test.ts` |
| Enforcement logic | **UNCHANGED** |
| Guard pipeline | **UNCHANGED** |
| Provider router | **UNCHANGED** |
| Backward compatibility | **FULLY PRESERVED** — `knowledgeContext` is optional; absence = identical behavior |

---

## Pre-execution Check

- ✅ Post-W100 posture read: E2E VALUE PROVEN (1-provider); no active tranche
- ✅ W93-T1 architecture gap confirmed: `CVF_SYSTEM_PROMPT` static; no injection path exists
- ✅ Operator instruction (AGENT_HANDOFF.md): W101-T1 as next roadmap step, no provider change
- ✅ New module creation → Full Lane required (GC-021 explicitly excludes concept-to-module)
- ✅ No test count regression risk: all new tests; existing route.test.ts left intact
- ✅ No enforcement/guard/policy change — pure additive integration surface

---

## Expected Outcome

| Gate | Claim |
|------|-------|
| Architecture gap closed | Knowledge context can now flow into LLM system prompt via `/api/execute` |
| Backward compatibility | Existing callers (no `knowledgeContext` field) get identical behavior |
| Test coverage | ≥8 new unit/integration tests; 0 regressions |
| W102-T1 unblocked | Benefit revalidation benchmark can now exercise the live injection path |

---

## Authorized By

Operator roadmap instruction in AGENT_HANDOFF.md (pre-W101 posture section): W101-T1
Knowledge-Native Execute Path Integration identified as highest-priority next tranche.
Architecture gap confirmed by W93-T1 evidence. Full Lane applies per GC-021 §3.
