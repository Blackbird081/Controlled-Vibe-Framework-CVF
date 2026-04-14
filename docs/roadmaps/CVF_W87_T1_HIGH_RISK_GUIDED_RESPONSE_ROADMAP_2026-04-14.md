Memory class: SUMMARY_RECORD

# CVF W87-T1 Execution Roadmap — HIGH_RISK Guided Response Pattern
**Date:** 2026-04-14
**Authorization:** CVF_GC018_W87_T1_HIGH_RISK_GUIDED_RESPONSE_AUTHORIZATION_2026-04-14.md
**Class:** PRODUCT_VALUE / GOVERNED_RUNTIME_ENHANCEMENT

---

## Objective

Add `guidedResponse` enrichment to the `/api/execute` route for BLOCK and ESCALATE decisions on HIGH_RISK non-coder task patterns. When governance detects NC-003 (password storage), NC-006 (code attribution), or NC-007 (API key in frontend) and blocks/escalates, the response body will include a governed safe-path alternative so non-coder users can make progress without bypassing governance.

---

## Phase Plan

### Phase 1 — Schema + Route Update
1. Define `guidedResponse?: string` field on the execute route response type for BLOCK/ESCALATE decisions
2. Create a `highRiskGuidedResponses` registry mapping risk pattern identifiers to pre-authored guided response text:
   - `NC_003_PASSWORD_STORAGE` → bcrypt/argon2 + environment variable pattern guidance
   - `NC_006_CODE_ATTRIBUTION` → MIT/Apache attribution template + link-back guidance
   - `NC_007_API_KEY_FRONTEND` → `.env`/secrets manager + server-side proxy guidance
3. Inject `guidedResponse` into the route response when enforcement status is BLOCK or ESCALATE and a matching pattern is detected

### Phase 2 — Tests
4. Add tests asserting that NC-003/NC-006/NC-007 governance responses include non-empty `guidedResponse`
5. Add tests asserting NORMAL task responses do NOT include spurious `guidedResponse` (field absent or null)
6. Regression: confirm BLOCK/ESCALATE HTTP status codes unchanged (400/409)

### Phase 3 — Evidence + Closure
7. Re-run CFG-B benchmark for NC-003, NC-006, NC-007 (6 runs: 3 tasks × 2 runs)
8. File evidence packet: `docs/baselines/CVF_W87_T1_GUIDED_RESPONSE_EVIDENCE_PACKET_2026-04-14.md`
9. File post-run assessment: `docs/assessments/CVF_W87_T1_POST_RUN_QUALITY_ASSESSMENT_2026-04-14.md`
10. File GC-026 closure sync: `docs/baselines/CVF_GC026_TRACKER_SYNC_W87_T1_CLOSED_2026-04-14.md`
11. Update `AGENT_HANDOFF.md` with W87-T1 CLOSED DELIVERED entry
12. Update progress tracker: Current active tranche → NONE, last closure → W87-T1

---

## Key Files

| File | Action |
|---|---|
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts` | Add `guidedResponse` field + registry lookup on BLOCK/ESCALATE |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/guided.response.registry.ts` | New file — pre-authored guided response text per HIGH_RISK pattern |
| `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/guided.response.test.ts` | New test file — guided response presence + NORMAL absence + status code regression |
| `docs/baselines/CVF_W87_T1_GUIDED_RESPONSE_EVIDENCE_PACKET_2026-04-14.md` | Evidence packet (Phase 3) |
| `docs/assessments/CVF_W87_T1_POST_RUN_QUALITY_ASSESSMENT_2026-04-14.md` | Post-run assessment (Phase 3) |
| `docs/baselines/CVF_GC026_TRACKER_SYNC_W87_T1_CLOSED_2026-04-14.md` | GC-026 closure sync (Phase 3) |

---

## Risk Notes

- **Guided responses are pre-authored** — no live AI inference on blocked paths; no recursive governance risk
- **No guard logic changed** — existing BLOCK/ESCALATE decisions are unchanged; `guidedResponse` is additive only
- **Pattern detection** — guided response lookup uses the same risk signal already present in the enforcement status; no new detection logic required
- **Schema is optional** — `guidedResponse` is optional in the response type; NORMAL tasks carry no guided response field; backward-compatible
