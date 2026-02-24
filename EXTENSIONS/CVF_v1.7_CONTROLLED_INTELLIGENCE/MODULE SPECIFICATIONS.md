# Module Specifications — CVF 1.7.0

> Spec reflects actual implementation after enterprise hardening.

---

## 1️⃣ Governance → Policy Engine

### policy.engine.ts + policy.binding.ts
- `evaluatePolicy({ riskScore })` → returns `{ allowed, reason }`
- `bindPolicy({ sessionId, role, riskScore })` → wraps evaluatePolicy
- `controlled.reasoning.ts` calls `bindPolicy()` directly — no trust of caller

### governance.constants.ts
- `GOVERNANCE_ESCALATION_THRESHOLD = 0.70` (R2 boundary)
- `GOVERNANCE_HARD_RISK_THRESHOLD = 0.90` (R3 boundary)

### risk.mapping.ts
- R0 (0.0–0.29), R1 (0.30–0.69), R2 (0.70–0.89), R3 (0.90–1.0)

### role.mapping.ts
- Phase A → RESEARCH, PLAN
- Phase B → DESIGN
- Phase C → BUILD, TEST, DEBUG
- Phase D → REVIEW, RISK

---

## 2️⃣ Input Boundary (Hardening)

### prompt.sanitizer.ts
- Detects injection patterns: governance bypass, policy override, unrestricted mode
- Actions: STRIP (remove), BLOCK (reject), LOG (monitor)
- Runs BEFORE reasoning gate — reasoning receives sanitized input only

---

## 3️⃣ Role Transition Guard

### role.types.ts (source of truth)
```ts
enum AgentRole { PLAN, RESEARCH, DESIGN, BUILD, TEST, DEBUG, REVIEW, RISK }
```

### transition.validator.ts
Allowed transitions:
- PLAN → RESEARCH, DESIGN
- BUILD → TEST, DEBUG
- TEST → DEBUG
- DEBUG → BUILD
- REVIEW → PLAN

### recursion.guard.ts (Hardening)
- Max transition depth per session: 20
- Max same-role repetition: 3
- Oscillation detection (A→B→A→B pattern)
- Auto-locks session on violation

---

## 4️⃣ Determinism Control

### entropy.guard.ts
- Self-calculates variance from `tokenProbabilities[]` when available
- Falls back to caller `tokenVariance` (marked as "caller-provided")
- Returns `{ entropyScore, unstable, source }`

### temperature.policy.ts
- STRICT → 0.1, CONTROLLED → 0.4

### reasoning.mode.ts
- PLAN/REVIEW/RISK → STRICT
- Others → CONTROLLED

### reproducibility.snapshot.ts
- `promptHash` (djb2 algorithm)
- `modelVersion` tracking
- `snapshotId` = hash(session + role + prompt + temp + modelVersion)

---

## 5️⃣ Introspection

### self.check.ts
- `runSelfCheck()` — validates sessionId, role, riskScore, entropyScore

### reasoning.audit.ts
- Calls `bindPolicy()` directly
- Logs violations to governance audit log

### deviation.report.ts
- Severity based on keyword matching (not count)

### correction.plan.ts
- `requiresGovernanceApproval`: LOW → no, MEDIUM/HIGH → yes

---

## 6️⃣ Context Segmentation

### context.segmenter.ts (main entry)
- Wraps: pruner + forker + summary injector

### context.types.ts
- `ContextChunk`, `PhaseSummary`, `MemoryBoundary`, `ForkedSession`

---

## 7️⃣ Learning Registry

### lesson.schema.ts
```ts
interface Lesson {
  id: string
  version: string
  category: string
  description: string
  severity: 'low' | 'medium' | 'high'
  rootCause: string
  preventionRule: string
  riskLevel: string
  createdAt: Date
  active: boolean
}
```

### lesson.store.ts
- Persisted to `cvf_lessons.json`
- Load on startup, save on mutation

### lesson.signing.ts (Hardening)
- `signLesson()` → deterministic hash of all content fields
- `verifyLesson()` → check signature matches
- Detects tampering

### conflict.detector.ts
- Keyword similarity (Jaccard ≥ 40%) — not exact string match
- Root cause conflict detection across categories
- Supports Vietnamese stopwords

### lesson.injector.ts
- Injects: description + rootCause + preventionRule

---

## 8️⃣ Telemetry

All metrics persisted to `.jsonl` files with timestamps.

### mistake_rate_tracker.ts → `cvf_telemetry_mistakes.jsonl`
- Time-windowed query: `getMistakeRateInWindow(ms)`

### elegance_score_tracker.ts → `cvf_telemetry_elegance.jsonl`
- Weighted scoring + trend analysis (recent vs overall)

### verification_metrics.ts → `cvf_telemetry_verification.jsonl`
- Time-tracked + history for trend analysis

### governance_audit_log.ts → `cvf_audit.jsonl`
- Append-only, queryable by event type

### anomaly.detector.ts (Hardening)
- Monitors: mistake rate spikes, elegance degradation, verification drops
- Triggers: NORMAL → STRICT → LOCKDOWN
- Can only restrict, never grant more autonomy

---

## 9️⃣ Rollback

### rollback.manager.ts → `cvf_rollback.jsonl`
- Append snapshots, load on startup
- `getAllSnapshots()` for full history

---

## 🔒 Reasoning Pipeline

```
Input → Sanitizer → Recursion Guard → Governance → Entropy → Prompt → Snapshot
```

Step 0: Sanitize input (BLOCK if injection detected)
Step 0.5: Recursion guard (LOCK if oscillation/depth exceeded)
Step 1: Governance check via `bindPolicy()` (BLOCK if R3)
Step 2: Resolve reasoning mode + temperature
Step 3: Entropy check (BLOCK if unstable + risk elevated)
Step 4: Compose final prompt (sanitized)
Step 5: Create reproducibility snapshot

---

## 🔗 Integration with CVF Gốc

- CVF gốc = absolute standard
- Extension = agent runtime layer beneath human process layer
- See [INTEGRATION.md](INTEGRATION.md) for full mapping