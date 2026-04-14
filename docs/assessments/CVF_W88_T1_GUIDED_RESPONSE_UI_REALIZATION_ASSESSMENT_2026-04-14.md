# CVF W88-T1 Guided Response UI Realization — Pre-Tranche Assessment

Memory class: SUMMARY_RECORD

> Date: 2026-04-14
> Tranche: W88-T1
> Class: PRODUCT / NON_CODER_VALUE / UI_REALIZATION
> Authorization: GC-018 filed at `docs/baselines/CVF_GC018_W88_T1_GUIDED_RESPONSE_UI_REALIZATION_AUTHORIZATION_2026-04-14.md`

---

## 1. What W87 Closed (and What It Did Not)

W87 closed the API-layer guidance gap for 3 HIGH_RISK non-coder patterns:

- `NC_003_PASSWORD_STORAGE` — safe password hashing guidance
- `NC_006_CODE_ATTRIBUTION` — code attribution and license compliance guidance
- `NC_007_API_KEY_FRONTEND` — API key security guidance

The `lookupGuidedResponse()` function in `guided.response.registry.ts` is called when enforcement status is `BLOCK` or `NEEDS_APPROVAL`, and the result is injected as `guidedResponse` into the API response body.

**W87 did NOT close the UI-realization gap.** The `guidedResponse` payload is present in API responses but is never rendered to the user in the front-door UI.

---

## 2. Exact Front-Door UI Consumer Path

The front-door execution path is:

```
User → template inputs → ProcessingScreen.tsx
         ↓
    executeReal() → POST /api/execute
         ↓
    data = await response.json()
         ↓
    enforcement.status check
         ↓
    BLOCK / NEEDS_APPROVAL → setError(data.error) ← data.guidedResponse is DROPPED HERE
```

**Key files:**
- `src/components/ProcessingScreen.tsx` — the main execution UI component; calls `/api/execute`; handles enforcement states but discards `guidedResponse`
- `src/lib/ai/types.ts` — `ExecutionResponse` type does not include `guidedResponse`

**What a user currently sees on BLOCK:**
> ⚠️ Execution blocked by CVF policy. — Using demo mode

**What a user should see on BLOCK (when guidedResponse is available):**
> A clear "Safe next step" panel with specific actionable guidance matching the blocked pattern.

---

## 3. Confirmation This Is The Highest-Value Move

| Dimension | Current State | After W88-T1 |
|---|---|---|
| Governed help at API layer | PRESENT (W87) | unchanged |
| Governed help visible to non-coder | ABSENT | PRESENT |
| BLOCK experience | bare error + demo fallback | clear safe-path guidance |
| NEEDS_APPROVAL experience | bare error message | clear approval context + guidance |
| NORMAL task experience | unchanged | unchanged |

W88-T1 converts a backend capability (guided responses) into a visible product capability. This is the highest-value move for the current 1-provider non-coder path because it requires no new backend logic, no new providers, and no guard policy changes — only UI realization of what W87 already built.

---

## 4. Implementation Plan

### Files to change
- `src/lib/ai/types.ts` — add `guidedResponse?: string` to `ExecutionResponse`
- `src/components/ProcessingScreen.tsx` — capture `data.guidedResponse` on BLOCK/NEEDS_APPROVAL; render a "Safe next step" panel

### Files to add (tests)
- `src/components/__tests__/ProcessingScreen.guided-response.test.tsx`

### Files NOT to change
- `src/app/api/execute/route.ts` — W87 output already correct
- `src/app/api/execute/guided.response.registry.ts` — W87 registry already correct
- Guard policy, enforcement logic, any backend

---

*Filed: 2026-04-14 — W88-T1 Pre-Tranche Assessment*
