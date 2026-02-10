# CVF Extensions Review — 2026-02-09

Perspective: software/security review focused on Extensions layer (v1.2–v1.6), with emphasis on v1.6 Agent Platform.

## Findings
- Auth is a stub: hardcoded `admin/admin123`, non-HttpOnly cookies, no backend check; middleware skips `/api/*`, so APIs are fully open (`src/app/login/page.tsx`, `middleware.ts`).
- AI provider keys can be abused: `/api/execute` exposes OpenAI/Claude/Gemini keys as a public proxy (no auth, no rate-limit, `budgetOk` forced true) — high risk of key leakage/abuse.
- UAT state persistence is brittle: server actions write to `governance/skill-library/uat/results` via `fs.writeFileSync`; fails on read-only deploy targets (Vercel/Netlify) and is non-atomic.
- Input handling weak: `buildPromptFromInputs` assumes string and calls `.trim()` on all values; non-string payloads throw 500 and bypass enforcement; no runtime schema.
- Risk model drift: SDK validator only accepts R0–R3 while enforcement/risk-check support R4 block; R4 contracts will be incorrectly flagged.
- Safety gates are shallow: risk inference is regex-only; budget always true; no prompt-injection/content-safety guardrails before provider call.
- Tests/tooling exist but not enforced: Vitest/Playwright scripts present; no CI wiring observed for the Extensions web app.

## Quick Recommendations
- Replace stub auth with real session/JWT + HttpOnly cookies; apply middleware to `/api/*`; remove hardcoded creds.
- Gate `/api/execute` behind auth + rate-limit; separate internal service token for provider calls; add budget metering.
- Move UAT storage to a writable store (DB/KV/S3); make writes atomic and environment-safe.
- Add Zod (or similar) runtime validation/coercion for `ExecutionRequest`; sanitize types before prompt assembly.
- Align risk model: support R4 in SDK validator; add tests to cover R0–R4 and governance alignment.
- Add safety filters (PII/PIJ/content policies) before provider invocation; reject/flag high-risk intents.
- Wire CI to run lint + vitest + minimal Playwright smoke on the v1.6 web app.
