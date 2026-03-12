# CVF Independent Post-Fix Review (2026-03-12)
# Evidence-Backed Checkpoint Before Next Fixes

> Scope: Independent review based on the 2026-03-11 baseline
> Sources:
> - docs/roadmaps/CVF_EXECUTION_UPGRADE_ROADMAP_2026-03-11.md
> - docs/assessments/CVF_DEFINITIVE_DEEP_DIVE_ASSESSMENT_2026-03-11.md
> - Code inspection (see Evidence section)

---

## 1) Executive Summary (Independent View)

The 2026-03-11 upgrade wave materially improves guard unification, MCP bridge endpoints, and a real execution runtime scaffold. However, there are still gaps that prevent "end-to-end governed execution" from being fully closed. The remaining gaps are mostly in wiring and enforcement, not in conceptual design.

This report is saved as a checkpoint for re-verification before making further fixes.

---

## 2) What Looks Solid Now (Observed in Code)

1. Unified guard engine is now the canonical path for Web UI via re-export adapter.
2. MCP HTTP bridge endpoints exist and return guard decisions.
3. AgentExecutionRuntime exists as a real pipeline (parse → preCheck → execute → postCheck).
4. Audit persistence components (file-based + SQLite) exist as standalone modules.

---

## 3) Gaps Still Open (Independent Findings)

1. Audit persistence is not wired into the guard evaluation pipeline or HTTP endpoints.
2. /api/execute still runs direct AI execution and does not route through AgentExecutionRuntime.
3. Skill registry is sample-only; full 141 skill mapping is not wired into execution guards.
4. Cross-channel enforcement remains opt-in (endpoint exists but not mandatory for all channels).
5. Two parallel sources of truth exist for guard contracts (risk of drift).
6. Rate limiter is imported in /api/guards/evaluate but not applied.
7. Guard audit logs are likely fragmented between endpoints due to per-route engine singletons.

These gaps are primarily integration and enforcement gaps, not missing modules.

---

## 4) Evidence (Code-Level)

Each point below includes a direct file reference and a short excerpt.

### 4.1 Audit persistence exists but is not wired

File: EXTENSIONS/CVF_GUARD_CONTRACT/src/audit/trace-emitter.ts
```
* Generates traceHash values and persists audit entries to local JSON files.
* Files are stored in `logs/audit/YYYY-MM-DD/` directory.
```

File: EXTENSIONS/CVF_GUARD_CONTRACT/src/audit/sqlite-db.ts
```
* Persistent audit log storage using SQLite (better-sqlite3).
* Replaces the file-based JSON approach from Sprint 1.
```

File: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/audit-log/route.ts
```
const fullLog = guardEngine.getAuditLog();
```

Observation: audit endpoints read in-memory logs only; no calls to persistTraceEntry() or AuditDatabase.

---

### 4.2 /api/execute does not use AgentExecutionRuntime

File: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/execute/route.ts
```
import { executeAI, AIProvider, ExecutionRequest } from '@/lib/ai';
...
let aiResult = await executeAI(provider, apiKey, userPrompt);
```

Observation: execution path runs executeAI directly and bypasses AgentExecutionRuntime.

---

### 4.3 Skill registry is sample-only

File: EXTENSIONS/CVF_GUARD_CONTRACT/src/runtime/skill-registry.ts
```
// Sample Skills (CVF Core)
* Creates a SkillRegistry pre-loaded with representative CVF skills.
```

Observation: registry contains a small representative set, not the full 141 skills.

---

### 4.4 Cross-channel enforcement still opt-in

File: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/evaluate/route.ts
```
External agents call this to check if an action is ALLOWED, BLOCKED, or needs ESCALATION.
```

Observation: the bridge exists, but there is no mandatory gating for IDE/CLI/agents unless they call it.

---

### 4.5 Two sources of truth for contract

File: governance/contracts/cross-channel-guard-contract.ts
```
Canonical type definitions that unify governance enforcement across ALL channels.
```

File: EXTENSIONS/CVF_GUARD_CONTRACT/src/types.ts
```
SINGLE SOURCE OF TRUTH for all CVF guard types.
```

Observation: two "single source of truth" files increase drift risk.

---

### 4.6 Rate limiter imported but not used in /api/guards/evaluate

File: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/evaluate/route.ts
```
import { guardsRateLimiter } from '@/lib/rate-limiter';
```

Observation: no call sites to guardsRateLimiter in this route.

---

### 4.7 Audit log fragmentation risk (per-route engine)

File: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/evaluate/route.ts
```
let engine: ReturnType<typeof createGuardEngine> | null = null;
```

File: EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/src/app/api/guards/audit-log/route.ts
```
let engine: ReturnType<typeof createGuardEngine> | null = null;
```

Observation: separate route-local singletons can lead to disjoint audit logs.

---

## 5) Recommended Next Fixes (Minimal Set)

1. Wire audit persistence into guard evaluation (trace-emitter or AuditDatabase).
2. Route /api/execute through AgentExecutionRuntime.
3. Auto-generate full skill registry from the 141 skills and enforce phase/risk.
4. Consolidate guard contract into a single canonical location.
5. Enforce mandatory guard calls for non-web channels (SDK/gateway).

---

## 6) Reviewer Note

This checkpoint is intentionally conservative and evidence-based. If any of the above gaps have been addressed in code not yet reviewed, please flag and provide the specific file path so this document can be updated.

---

## 7) Test Evidence (2026-03-12)

### 7.1 CVF_GUARD_CONTRACT — Unit Tests

Command:
```
npm test
```

Result (summary):
```
Test Files 7 passed
Tests 113 passed | 5 skipped (118)
```

### 7.2 CVF_GUARD_CONTRACT — Coverage

Note: Coverage initially failed due to missing dependency. Installed compatible coverage reporter for vitest 1.6.1:
```
npm install -D @vitest/coverage-v8@1.6.1
```

Command:
```
npm run test:coverage
```

Result (summary):
```
All files: 90.01% Stmts | 92.34% Branch | 83.78% Funcs | 90.01% Lines
```

### 7.3 CVF Web UI (v1.6) — Unit Tests

Command:
```
npm run test:run
```

Result (summary):
```
Test Files 109 passed | 1 skipped (110)
Tests 1799 passed | 3 skipped (1802)
```

### 7.4 CVF Web UI (v1.6) — Coverage

Command:
```
npm run test:coverage
```

Result (summary):
```
All files: 92.01% Stmts | 80.05% Branch | 91.16% Funcs | 93.12% Lines
PASS: Branch coverage >= global threshold 80%
```

### 7.5 CVF Web UI (v1.6) — E2E (Playwright)

Command:
```
npm run test:e2e
```

Result (summary):
```
FAIL: http://localhost:3001 is already used (Playwright webServer)
Active listener: node process PID 10348
```

---
