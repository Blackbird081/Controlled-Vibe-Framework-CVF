<!-- Memory class: POINTER_RECORD -->

# CVF Knowledge Governance — Operator Guide

> Date: 2026-04-14
> Scope: W82-T1 front-door operator reference for the knowledge-native lifecycle
> Routes: `/api/governance/knowledge/compile`, `/maintain`, `/refactor`
> UI: `/governance/knowledge` (Knowledge tab in Governance sidebar group)

---

## 1. When to Use Each Step

### Compile (Step 2 of lifecycle)

Use when you have a raw knowledge source and want to produce a governed artifact.

- Provide `contextId`, `artifactType` (`concept` / `entity` / `summary`), `sourceIds`, `citationRef`, `citationTrail`, `compiledBy`, and `content`.
- Optionally include `governDecision` (`approved` or `rejected`) in the same call to complete both Compile and Govern steps in one request.
- Output: a `CompiledKnowledgeArtifact` with `governanceStatus: "pending"` (or `"approved"` / `"rejected"` if governed inline).

### Govern (inline with Compile, or deferred)

Use to formally approve or reject a compiled artifact before it may enter the query pool.

- Pass `governDecision: { decision: "approved" }` or `{ decision: "rejected", reason: "..." }` alongside `compileRequest` in the compile call.
- Only `approved` artifacts may proceed to Maintain.
- `rejected` artifacts are recorded and must not enter the query pool.

### Maintain (Step 5 of lifecycle)

Use to evaluate an **approved** artifact for quality signals.

- Provide the full `artifact` object (must have `governanceStatus: "approved"`) and an array of `checks`.
- Check types available: `lint` (required keywords), `contradiction` (conflicting artifact IDs), `drift` (source modification date), `orphan` (active source IDs), `staleness` (max age in days).
- Output: `KnowledgeMaintenanceResult` with `hasIssues` flag and `signals` array.

### Refactor (Step 6 of lifecycle)

Use when a Maintain run returns `hasIssues: true`.

- Provide the full `KnowledgeMaintenanceResult` from the Maintain step.
- Output: `KnowledgeRefactorResult` with `proposals` array — each proposal has an `action` (`recompile` / `archive` / `review`) and `rationale`.
- This contract is **propose-only** — no artifact mutations occur.

---

## 2. What "HYBRID / NO SINGLE DEFAULT" Means for Operator Behavior

The N2 benchmark evidence closure decision is `HYBRID / NO SINGLE DEFAULT`.

For operators this means:

- There is **no unconditional default** for knowledge retrieval mode.
- **Compiled-preferred conditional (Rule 1)**: prefer compiled artifacts when available and approved.
- **Raw-source fallback (Rule 2)**: fall back to raw source retrieval when no approved compiled artifact exists for the context.
- Operators set the mode **per context** based on artifact availability, not globally.
- Do not assume "always use compiled" or "always use raw" — check `governanceStatus` before routing.

---

## 3. Auth Requirements

All routes require one of:

- **Session cookie**: valid user session from `/api/auth/login`.
- **Service token**: `x-cvf-service-token` header matching `CVF_SERVICE_TOKEN` env variable (service-to-service calls).

Missing both returns `401 Unauthorized`.

---

## 4. Known Limits (at W82-T1)

- Artifacts are **not persisted** — each request is stateless. Pass the artifact object from compile response directly to maintain request.
- No batch endpoint for the governed lifecycle — batch is available at the CPF layer (`CompiledKnowledgeArtifactBatchContract`).
- Maintain requires `governanceStatus: "approved"` — attempting to maintain a `pending` or `rejected` artifact returns `500`.
- Refactor requires `hasIssues: true` — attempting to refactor a clean result returns `500`.

---

Filed: 2026-04-14 | W82-T1 Knowledge-Native Value Realization
