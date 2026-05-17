# Agent Handoff — Integrations Tab & Runtime Store

Memory class: POINTER_RECORD

Status: READY FOR EXECUTION — 2026-05-17

## Purpose

Implement an **Integrations tab** in the Settings modal so Non-coders can
connect Supabase (or any HTTP endpoint) by copy/pasting credentials, enabling
the Runtime Monitor to show live agent events on Netlify without any dev or
Netlify login involvement.

## Scope / Owner / Active Boundary

- **Owner surface:** `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/`
- **In scope:** all files listed in the roadmap below
- **Out of scope:** other dashboard pages, governance contracts, public-sync
- **Risk ceiling:** R1 (UI + local-read server routes, no destructive actions)
- **Write scope:** modify-listed

## What to read first

Full implementation specification — file-by-file, step-by-step, with exact
code shapes and test requirements:

```text
docs/roadmaps/CVF_INTEGRATIONS_TAB_RUNTIME_STORE_ROADMAP_2026-05-17.md
```

Do not start coding until you have read that document.

## Active Boundary

Owner surface: `EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/` only.
Do not modify governance contracts, CPF, public-sync, or any file outside
the cvf-web directory tree. Risk ceiling: R1.

## Latest Work / Changes

No prior implementation exists. Greenfield feature on top of:

- `src/components/Settings.tsx` — existing Settings modal (3 tabs today)
- `src/app/(dashboard)/runtime/page.tsx` — existing Runtime Monitor (poll-based, local JSONL only)

Key existing patterns to follow:

- Tab switching: `activeTab` state in `Settings.tsx` line ~268
- localStorage: `STORAGE_KEY` pattern in `Settings.tsx` — use separate key `cvf_integrations`
- Custom headers: `x-cvf-service-token` pattern in `src/app/api/execute/route.ts`
- Hydration-safe state: always init with default value, load real value in `useEffect`

## Next Action / Approval Gate

Read the roadmap, then execute Steps 1–10 in the specified order.
After all steps: run `npm run test:run`, `npm run check`, `npm run lint` —
all must pass before closing this handoff. No approval gate needed between
steps — operator has pre-authorized the full tranche.

Execution order:

```text
Steps 1-3 first (independent)
Step 4 after Step 3
Steps 5-6 after Step 1
Step 7 after Steps 3 and 4
Step 8 after Steps 1 and 5
Step 9 after Steps 4, 6, and 8
Step 10 last
```

## Done Criteria

- [ ] `npm run test:run` passes (all existing + new tests)
- [ ] `npm run check` passes (zero TypeScript errors)
- [ ] `npm run lint` passes (zero warnings)
- [ ] Settings modal shows 4 tabs including "Integrations"
- [ ] Test Connection returns correct status for each provider type
- [ ] Runtime Monitor passes integration config header when store is configured
- [ ] Fallback to local JSONL when provider is 'none' (existing behavior unchanged)

## Claim Boundary

- Allowed: Non-coder connects Supabase, Runtime Monitor shows live events
- Not allowed: billing control, multi-tenant quota, guaranteed event delivery
- Fallback guaranteed: nothing breaks when no store is configured

## Security Constraints

- Never log raw key values — log key length only
- Test files must not assert on raw key values
- `x-cvf-integration-config` header is base64 JSON — never echo in responses
- Supabase schema default policy: SELECT-only for anon key
