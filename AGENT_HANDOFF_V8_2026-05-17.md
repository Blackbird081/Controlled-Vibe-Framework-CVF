# CVF Agent Handoff V8 — 2026-05-17

Memory class: FULL_RECORD

Status: ACTIVE — Steps 8–10 absorption queue authorized by operator 2026-05-17.

## Purpose

Provide Codex with complete task briefs for Steps 8–10 of the unabsorbed
knowledge absorption queue, following operator authorization on 2026-05-17
to proceed with all remaining deferred items.

## Scope

In scope:

- Step 8: ADD-B Context Profile Metadata (CPF owner surface)
- Step 9: GAP-AGENT-HANDOFF cross-agent handoff protocol (CPF owner surface)
- Step 10a: ADD-C1 Continuity Checkpoint schema (CPF owner surface)
- Step 10b: ADD-C2 Delegation/Worker/Subagent contract (CPF + EPF owner surfaces)
- Step 10c: ADD-E1 Scoped Knowledge/Code Graph provider contract (CPF owner surface)

Out of scope:

- Steps 1–7 (already complete — see `AGENT_HANDOFF_V7_2026-05-16.md`)
- Public claim changes beyond evidence page updates
- Release gate changes
- GA posture changes

## Active Boundary

Operator decision 2026-05-17: all remaining deferred items authorized.
Each step still requires its own GC-018 packet before implementation begins.
Execution bounded by GC-018 per step, GC-023 pre-flight per step, and
pre-commit hook chain (GC-023, GC-045, docs governance) on every commit.

## Latest Work / Changes

Previous handoff: `AGENT_HANDOFF_V7_2026-05-16.md`. Steps 1–7 complete at
commit `51bdfd78`. This handoff covers Steps 8–10 only.

## Claim Boundary

Each step requires its own GC-018 before implementation, is bounded to its
stated owner surface, and does not change GA posture, public claims, or
release gates beyond the evidence page update for that step. The full
absorption queue closes after Step 10c. Any future work on ADD-family items
requires a new GC-018 from a concrete new roadmap.

## Context

Continuation of absorption queue from `AGENT_HANDOFF_V7_2026-05-16.md`.
Steps 1–7 are complete. This handoff covers Steps 8–10 (the remaining
deferred items from the Claude-Codex consensus roadmap), now authorized for
implementation by operator decision 2026-05-17.

Current HEAD on governance repo: `51bdfd78`
Current HEAD on public-sync repo: `273337cf`

Source authority for all steps in this handoff:

- `docs/reviews/CVF_DEFERRED_ITEMS_SOLUTION_PROPOSALS_2026-05-17.md`
- `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md`
- `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md`

## Ordering rules (binding)

Steps must be executed in order due to dependencies:

- Step 8 (ADD-B) before Step 10c (ADD-E1) — E1 consumes ADD-B's
  `sourceRelevance` field.
- Step 9 (GAP-AGENT-HANDOFF) before Step 10b (ADD-C2) — C2 delegation
  contract depends on handoff protocol.
- Step 10a (ADD-C1) has no dependency on 8 or 9 — can run after Step 8.
- Steps 10b and 10c depend on 9 and 8 respectively.

Recommended sequence: 8 → 9 → 10a → 10b → 10c.

---

## STEP 8 — ADD-B Context Profile Metadata

### What this step is

Add a typed advisory `ContextProfile` record to the Control Plane Foundation.
This shapes how Context Builder assembles context by session type, token
budget, source relevance, and reinjection eligibility. Advisory metadata only
— no execution authority, no prompt injection, no routing change.

Trigger met: OBS-1 completed at commit `93c2754c`.

### Schema to implement

Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

New file: `src/context.profile.contract.ts`

```ts
export interface ContextProfile {
  sessionId: string;
  profileVersion: string;
  budgetHints: {
    maxTokens?: number;
    maxSources?: number;
    compressionAllowed: boolean;
  };
  sourceRelevance: Array<{
    sourceId: string;
    relevanceScore: number;
    freshnessTag: 'canon' | 'recent' | 'stale' | 'rejected';
  }>;
  reinjectionEligibility: Array<{
    sourceId: string;
    eligibleFromPhase: string;
    requiresApproval: boolean;
  }>;
  evidenceSensitivity?: 'standard' | 'redacted' | 'restricted';
}
```

Key constraints:

- Profile is advisory input; it does not override policy decisions.
- `sourceId` values must reference existing source IDs — profile does not
  create a new source registry.
- `evidenceSensitivity: 'restricted'` must trigger Policy Engine validation
  (Guard Contract integration).
- No execution authority: profile shapes context assembly; it cannot inject
  prompts, change provider routing, or approve work.

### Governance steps

#### S8.A — GC-018 authorization packet

Create `docs/baselines/CVF_GC018_ADD_B_CONTEXT_PROFILE_AUTHORIZATION_2026-05-17.md`.
Template: `docs/reference/CVF_GC018_CONTINUATION_CANDIDATE_TEMPLATE.md`.

Required fields:

- Status: AUTHORIZED FOR LOCAL IMPLEMENTATION
- Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
- Secondary surface: `EXTENSIONS/CVF_GUARD_CONTRACT/` (Policy Engine
  validator for `evidenceSensitivity`)
- Permitted implementation: `ContextProfile` type + builder helper +
  Policy Engine validator for restricted sensitivity + tests
- Source: ADD-B synthesis in
  `docs/reviews/CVF_DEFERRED_ITEMS_SOLUTION_PROPOSALS_2026-05-17.md`
- Claim boundary: advisory metadata only; no execution authority

#### S8.B — GC-023 pre-flight

```bash
wc -l EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/*.ts
```

`context.profile.contract.ts` is a new file — no risk of exceeding existing
file thresholds. If adding a builder helper to an existing file would exceed
650 lines, create `src/context.profile.builder.ts` separately.

#### S8.C — Implement

Create `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.profile.contract.ts`
with `ContextProfile` type and an `applyContextProfile` builder function:

```ts
export function applyContextProfile(
  profile: ContextProfile,
  sources: string[],
): { rankedSources: string[]; compressionAllowed: boolean; sensitivityLevel: string } {
  // rank sources by relevance, filter rejected, apply budget hints
}
```

If `evidenceSensitivity === 'restricted'`, the builder must return a flag
that triggers Guard Contract policy validation upstream.

#### S8.D — Tests (20–30 unit tests)

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.profile.contract.test.ts`

Required test cases:

1. Valid profile with all fields round-trips correctly.
2. Profile with no `budgetHints` does not crash.
3. `applyContextProfile` ranks sources by `relevanceScore` descending.
4. Sources with `freshnessTag: 'rejected'` are excluded from ranked output.
5. `compressionAllowed: false` is preserved in output.
6. Profile with `evidenceSensitivity: 'restricted'` returns sensitivity flag.
7. Profile with `evidenceSensitivity: 'standard'` does not trigger
   sensitivity flag.
8. `reinjectionEligibility` entries with `requiresApproval: true` are tagged
   correctly.
9. Empty `sourceRelevance` array returns empty ranked sources (no crash).
10. Unknown `sourceId` not in `sources` does not crash (graceful skip).
11–20+: Edge cases for budget hints overflow, invalid relevance scores,
missing optional fields.

#### S8.E — Adoption roadmap doc

Create `docs/roadmaps/CVF_ADD_B_CONTEXT_PROFILE_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`.
Memory class: SUMMARY_RECORD. GC-045 compliant. Status: COMPLETED LOCALLY.

#### S8.F — Update inventory and consensus roadmap

In `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md`:

- ADD-B row: classification `deferred` → `runtime-owned`, notes → `completed 2026-05-17`

In `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md`:

- CD-1 table ADD-B row: same update
- Work Plan: add `| 8 | ADD-B Context Profile Metadata | complete 2026-05-17 |`

#### S8.G — Append to this handoff

Append a dated completion entry to `AGENT_HANDOFF_V8_2026-05-17.md` after
finishing this step, before starting Step 9.

### Verification

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
npm test
npm run check
```

All tests pass. TypeScript strict compiles clean. Then commit:

```bash
git add docs/baselines/CVF_GC018_ADD_B_CONTEXT_PROFILE_AUTHORIZATION_2026-05-17.md \
        EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.profile.contract.ts \
        EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.profile.contract.test.ts \
        docs/roadmaps/CVF_ADD_B_CONTEXT_PROFILE_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md \
        docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md \
        docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md \
        AGENT_HANDOFF_V8_2026-05-17.md
git commit -m "feat(cpf): add ADD-B context profile metadata contract"
```

### Public-sync after Step 8 commit

Copy `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.profile.contract.ts`
and its test to public-sync. Update
`docs/evidence/cvf-16-5-runtime-absorption.md` to add ADD-B to the absorbed
lanes table. Push to GitHub.

### Claim boundary

- Advisory metadata only. No execution authority, no prompt injection.
- Profile shapes context assembly; it cannot approve work or change routing.
- No public claim change beyond evidence page.
- No release gate change.
- Step 9 (GAP-AGENT-HANDOFF) is not authorized by this packet.

---

## STEP 9 — GAP-AGENT-HANDOFF Cross-agent Handoff Protocol

### What this step is

Add `AgentHandoffRecord` to the Control Plane Foundation. This is a bridge
contract that wires the four existing CPF agent contracts
(`agent.governed.session`, `agent.definition.boundary`,
`agent.scope.resolution.batch`, `orchestration.contract`) into a structured
end-to-end handoff flow with a delegation receipt.

Trigger met: Claude ↔ Codex handoff pattern in CVF qualifies as ≥2 governed
multi-agent handoffs. Operator authorized 2026-05-17.

### Schema to implement

Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

New file: `src/agent.handoff.contract.ts`

```ts
export interface AgentHandoffRecord {
  handoffId: string;
  sourceAgentId: string;
  targetAgentId: string;
  taskId: string;
  handoffPhase: string;
  contextSnapshot: {
    closedDecisions: string[];
    openItems: string[];
    artifactRefs: string[];
    evidenceReceiptIds: string[];
  };
  delegationContractRef?: string;
  policyContinuity: {
    inheritedPolicies: string[];
    riskCeiling: 'R0' | 'R1' | 'R2' | 'R3';
    sandboxTier: number;
  };
  acceptanceCriteria: {
    requiredFinalEvidence: string[];
    returnToSourceCondition?: string;
  };
  receiptId: string;
}
```

Key constraints:

- Target agent must not act until handoff record is committed and acknowledged.
- Source agent must not consider task closed until target acknowledges.
- Target inherits source's `riskCeiling` — policy downgrade is not permitted.
- `receiptId` must be generated at handoff creation; receipt is the audit trail.
- This contract bridges existing CPF contracts; it does not replace them.
  Write an ADR documenting the relationship to all 4 existing agent contracts.

### Governance steps

#### S9.A — GC-018 authorization packet

Create `docs/baselines/CVF_GC018_GAP_AGENT_HANDOFF_AUTHORIZATION_2026-05-17.md`.

Required fields:

- Status: AUTHORIZED FOR LOCAL IMPLEMENTATION
- Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
- Permitted implementation: `AgentHandoffRecord` type + handoff builder +
  acknowledgment guard + policy continuity check + tests + ADR
- Source: GAP-AGENT-HANDOFF in solution proposals doc
- Claim boundary: bridge contract only; does not create new agent authority

#### S9.B — GC-023 pre-flight

```bash
wc -l EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/*.ts
```

`agent.handoff.contract.ts` is a new file. No risk to existing files.

#### S9.C — Implement

Create `src/agent.handoff.contract.ts` with the `AgentHandoffRecord` type
and two helper functions:

```ts
export function createAgentHandoff(input: Omit<AgentHandoffRecord, 'receiptId'>): AgentHandoffRecord
export function verifyPolicyContinuity(source: AgentHandoffRecord, targetRiskCeiling: string): boolean
```

`verifyPolicyContinuity` returns `false` if target's risk ceiling is lower
than source's — policy downgrade blocked.

#### S9.D — Tests (15–20 unit tests)

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.handoff.contract.test.ts`

Required test cases:

1. Valid handoff record round-trips with all required fields.
2. `createAgentHandoff` generates a non-empty `receiptId`.
3. `verifyPolicyContinuity` returns `true` when target ceiling equals source.
4. `verifyPolicyContinuity` returns `false` when target ceiling is lower
   (policy downgrade attempt).
5. Handoff with empty `contextSnapshot.closedDecisions` is valid.
6. Handoff with `delegationContractRef` present is valid.
7. Handoff with missing `requiredFinalEvidence` array is invalid (type guard).
8. Handoff with `returnToSourceCondition` optional field absent is valid.
9. `sandboxTier` of 0 is valid (R0 sandbox).
10. Two handoffs with same `taskId` but different `handoffId` are distinct.
11–20: Edge cases for missing fields, empty arrays, policy ceiling boundary
values (`R0`/`R3`), orphan handoff detection.

#### S9.E — ADR document

Create `docs/reference/CVF_ADR_AGENT_HANDOFF_CONTRACT_RELATIONSHIP_2026-05-17.md`.
Document the relationship between `agent.handoff.contract.ts` and the 4
existing CPF contracts. This is not GC-045 governed markdown — it is an ADR
(no structural completeness check required, but must have Purpose / Decision /
Consequences sections).

#### S9.F — Adoption roadmap doc

Create `docs/roadmaps/CVF_GAP_AGENT_HANDOFF_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`.
Memory class: SUMMARY_RECORD. GC-045 compliant. Status: COMPLETED LOCALLY.

#### S9.G — Update inventory and consensus roadmap

In `docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md`:

- GAP-AGENT-HANDOFF row: status → `runtime-owned`, notes → `completed 2026-05-17`

In `docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md`:

- CD-1 table GAP-AGENT-HANDOFF row: same update
- Work Plan: add `| 9 | GAP-AGENT-HANDOFF cross-agent handoff protocol | complete 2026-05-17 |`

#### S9.H — Append to this handoff

Append a dated completion entry to `AGENT_HANDOFF_V8_2026-05-17.md` after
finishing Step 9, before starting Step 10a.

### Verification

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
npm test
npm run check
```

Then commit:

```bash
git add docs/baselines/CVF_GC018_GAP_AGENT_HANDOFF_AUTHORIZATION_2026-05-17.md \
        EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.handoff.contract.ts \
        EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.handoff.contract.test.ts \
        docs/reference/CVF_ADR_AGENT_HANDOFF_CONTRACT_RELATIONSHIP_2026-05-17.md \
        docs/roadmaps/CVF_GAP_AGENT_HANDOFF_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md \
        docs/reviews/CVF_UNABSORBED_KNOWLEDGE_INVENTORY_2026-05-16.md \
        docs/roadmaps/CVF_UNABSORBED_KNOWLEDGE_FINAL_CONSENSUS_ROADMAP_2026-05-17.md \
        AGENT_HANDOFF_V8_2026-05-17.md
git commit -m "feat(cpf): add GAP-AGENT-HANDOFF cross-agent handoff contract"
```

### Public-sync after Step 9 commit

Copy `src/agent.handoff.contract.ts` and its test to public-sync. Update
evidence page. Push to GitHub.

### Claim boundary

- Bridge contract only. Does not create new agent authority.
- `verifyPolicyContinuity` is a validation helper; it does not enforce at
  runtime — caller is responsible for acting on the result.
- No public claim change beyond evidence page.
- Step 10b (ADD-C2) depends on this step and is not authorized here.

---

## STEP 10a — ADD-C1 Continuity / Restart / Handoff Doctrine

### What this step is

Add `ContinuityCheckpoint` schema to the Control Plane Foundation. This
standardizes how W123 continuation, roadmap closures, and long-running agent
sessions write checkpoint records — shared vocabulary, not a new execution
engine. W123 still owns execution continuity; C1 owns the record shape.

Trigger met: Operator authorized 2026-05-17. Claude ↔ Codex multi-session
pattern qualifies as active multi-agent scenario.

Note: Can start in parallel with Step 9 (different owner surfaces), but must
complete before Step 10b (which references checkpoint IDs).

### Schema to implement

Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

New file: `src/continuity.checkpoint.contract.ts`

```ts
export interface ContinuityCheckpoint {
  checkpointId: string;
  taskId: string;
  agentId: string;
  phaseBoundary: string;
  closedDecisions: Array<{
    decisionId: string;
    decision: string;
    reasoning: string;
    irrevocable: boolean;
  }>;
  openItems: Array<{
    itemId: string;
    description: string;
    nextPhase: string;
  }>;
  artifactMemory: Array<{
    path: string;
    hash: string;
    role: 'input' | 'output' | 'evidence';
  }>;
  reinjectionPolicy: 'always' | 'on-request' | 'expired';
  evidenceReceiptIds: string[];
}
```

Key constraints:

- Schema standard only. No checkpoint execution engine.
- W123 continuation files own execution continuity; C1 is the record shape
  they conform to. Document this in the ADR.
- `irrevocable: true` decisions must not appear in `openItems`.
- Existing W123 closure files should be audited to confirm they already follow
  this shape conceptually (doc audit only — no retroactive schema enforcement).

### Governance steps

#### S10a.A — GC-018 authorization packet

Create `docs/baselines/CVF_GC018_ADD_C1_CONTINUITY_AUTHORIZATION_2026-05-17.md`.

Required fields:

- Status: AUTHORIZED FOR LOCAL IMPLEMENTATION
- Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
- Permitted implementation: `ContinuityCheckpoint` type + builder helper +
  W123 doc audit (read-only) + tests + ADR
- Source: ADD-C1 synthesis in solution proposals doc
- Claim boundary: schema standard only; no runtime checkpoint engine

#### S10a.B — GC-023 pre-flight

New file, no risk to existing files.

#### S10a.C — Implement

Create `src/continuity.checkpoint.contract.ts` with `ContinuityCheckpoint`
type and a validation helper:

```ts
export function validateCheckpoint(cp: ContinuityCheckpoint): { valid: boolean; violations: string[] }
```

Validation rules:

- `checkpointId`, `taskId`, `agentId`, `phaseBoundary` must be non-empty.
- No `decisionId` in `closedDecisions` may also appear in `openItems`.
- `reinjectionPolicy: 'expired'` must have at least one `evidenceReceiptId`.

#### S10a.D — Tests (15–20 unit tests)

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/continuity.checkpoint.contract.test.ts`

Required test cases:

1. Valid checkpoint with all fields passes validation.
2. Empty `closedDecisions` and `openItems` is valid.
3. Checkpoint with `irrevocable: true` decision not in `openItems` passes.
4. Checkpoint where same ID appears in both `closedDecisions` and `openItems`
   fails validation.
5. `reinjectionPolicy: 'expired'` with empty `evidenceReceiptIds` fails.
6. `reinjectionPolicy: 'always'` with empty `evidenceReceiptIds` passes.
7. `artifactMemory` entry with `role: 'evidence'` is valid.
8. Checkpoint with empty `artifactMemory` is valid.
9. `phaseBoundary` empty string fails validation.
10. Valid checkpoint with `openItems` containing future phase reference passes.
11–20: Edge cases for missing fields, duplicate IDs, boundary string formats.

#### S10a.E — W123 doc audit (read-only)

Read current W123 continuation docs to confirm they follow the checkpoint
shape conceptually. This is a read-and-note audit — no retroactive changes
to existing files unless they actively contradict the schema. Record findings
in the ADR.

#### S10a.F — ADR document

Create `docs/reference/CVF_ADR_CONTINUITY_CHECKPOINT_AND_W123_RELATIONSHIP_2026-05-17.md`.
Must state clearly: "W123 owns execution continuity. C1 (`ContinuityCheckpoint`)
owns the record shape. W123 files are the canonical consumers."

#### S10a.G — Adoption roadmap doc

Create `docs/roadmaps/CVF_ADD_C1_CONTINUITY_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`.
Memory class: SUMMARY_RECORD. GC-045 compliant.

#### S10a.H — Update inventory and consensus roadmap

In inventory: ADD-C1 row → `runtime-owned`, `completed 2026-05-17`.

In final consensus roadmap: CD-1 table + Work Plan row
`| 10a | ADD-C1 Continuity Checkpoint schema | complete 2026-05-17 |`.

#### S10a.I — Append to this handoff

Append dated completion entry before starting Step 10b.

### Verification

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
npm test
npm run check
```

Commit with message:
`feat(cpf): add ADD-C1 continuity checkpoint schema contract`

### Claim boundary

- Schema standard only. No execution engine, no checkpoint runtime.
- W123 owns execution. C1 owns the record vocabulary.
- Step 10b (ADD-C2) depends on Step 9 (AGENT-HANDOFF), not on C1.

---

## STEP 10b — ADD-C2 Delegation / Worker / Subagent Contracts

### What this step is

Add `DelegationContract` to the Control Plane Foundation. This wires the
four existing CPF agent contracts into an integration layer that enforces
explicit file ownership, bounded write scope, final-report requirements, and
subagent boundary inheritance. Most complex item in this batch (M-L effort).

Dependency: Step 9 (GAP-AGENT-HANDOFF) must be complete — handoff protocol
is a concrete use case of delegation.

### Schema to implement

Owner surface:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/` — delegation contract.
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/` — execution boundary enforcement.

New file in CPF: `src/delegation.contract.ts`

```ts
export interface DelegationContract {
  parentTaskId: string;
  workerAgentId: string;
  delegationId: string;
  ownership: {
    ownedFiles: string[];
    ownedModules: string[];
    forbiddenPaths: string[];
    writeScope: 'append-only' | 'modify-listed' | 'create-only';
  };
  inheritedBoundaries: {
    riskCeiling: 'R0' | 'R1' | 'R2' | 'R3';
    policyIds: string[];
    sandboxTier: number;
  };
  reportRequirement: {
    finalChangedFiles: 'required';
    finalEvidenceReceipts: 'required';
    interimCheckpoints: 'optional';
  };
  blockedActions: Array<{
    action: string;
    reason: string;
  }>;
}
```

Key constraints:

- `DelegationContract` is an integration layer, not a replacement for existing
  CPF contracts. Wire `agent.scope.resolution` output into
  `agent.governed.session` input via delegation contract.
- Write attempt on a path in `forbiddenPaths` must return a typed rejection.
- Missing `finalChangedFiles` on closure must block the closure with a typed
  error.
- ADR must document relationship to all 4 existing CPF contracts.

### Governance steps

#### S10b.A — GC-018 authorization packet

Create `docs/baselines/CVF_GC018_ADD_C2_DELEGATION_AUTHORIZATION_2026-05-17.md`.

Required fields:

- Status: AUTHORIZED FOR LOCAL IMPLEMENTATION
- Owner surfaces: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`,
  `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/`
- Permitted implementation: `DelegationContract` type + scope enforcement
  helpers + write-scope guard + closure enforcer + tests + ADR
- Claim boundary: integration layer only; does not replace existing CPF
  agent contracts

#### S10b.B — GC-023 pre-flight

```bash
wc -l EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/*.ts
wc -l EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/*.ts
```

Both are new files. Check that EPF `index.ts` is not already at hard limit
before modifying it.

#### S10b.C — Implement

Two new files:

1. `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract.ts`

```ts
export function validateWriteScope(
  path: string,
  contract: DelegationContract,
): { allowed: boolean; reason: string }

export function validateClosureReport(
  contract: DelegationContract,
  changedFiles: string[],
  evidenceReceipts: string[],
): { valid: boolean; violations: string[] }
```

2. If EPF has a relevant enforcement surface, add a thin delegation boundary
   guard there. If not, note in ADR that EPF enforcement is deferred.

#### S10b.D — Tests (30–40 unit tests)

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/delegation.contract.test.ts`

Required test cases:

1. Valid delegation with all fields passes.
2. `validateWriteScope` allows write to path in `ownedFiles`.
3. `validateWriteScope` rejects write to path in `forbiddenPaths`.
4. `validateWriteScope` rejects write to path not in `ownedFiles` (out of scope).
5. `validateClosureReport` passes when `changedFiles` and `evidenceReceipts` non-empty.
6. `validateClosureReport` fails when `changedFiles` is empty.
7. `validateClosureReport` fails when `evidenceReceipts` is empty.
8. Delegation with `riskCeiling: 'R0'` and `sandboxTier: 0` is valid.
9. `policyIds` empty array is valid.
10–40: Edge cases for path matching, overlapping owned/forbidden paths,
multiple violations returned together, missing required fields.

#### S10b.E — ADR document

Create `docs/reference/CVF_ADR_DELEGATION_CONTRACT_AND_CPF_RELATIONSHIP_2026-05-17.md`.
Must document relationship to: `agent.governed.session.contract.ts`,
`agent.definition.boundary.contract.ts`,
`agent.scope.resolution.batch.contract.ts`, `orchestration.contract.ts`.

#### S10b.F — Adoption roadmap + inventory + consensus roadmap updates

Same pattern as previous steps. Work Plan row:
`| 10b | ADD-C2 Delegation/Worker/Subagent contract | complete 2026-05-17 |`

#### S10b.G — Append to this handoff

Append dated completion entry before starting Step 10c.

### Verification

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION && npm test && npm run check
cd ../CVF_EXECUTION_PLANE_FOUNDATION && npm test && npm run check
```

Commit: `feat(cpf): add ADD-C2 delegation contract integration layer`

### Claim boundary

- Integration layer only. Does not replace 4 existing CPF agent contracts.
- `validateWriteScope` and `validateClosureReport` are helpers; callers are
  responsible for acting on their results.
- Step 10c (ADD-E1) depends on Step 8 (ADD-B), not on this step.

---

## STEP 10c — ADD-E1 Scoped Knowledge / Code Graph Provider

### What this step is

Add `ScopedKnowledgeProvider` contract as a subclass of the existing
`knowledge.vault.intake.contract.ts` in the Control Plane Foundation.
Defines how external code-intelligence sources (code graph, cortex, indexed
reference) register, are queried, and are kept from acting beyond read-only
scope. Consumes ADD-B's `sourceRelevance` field.

Dependency: Step 8 (ADD-B Context Profile) must be complete.

### Schema to implement

Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`

Extend existing `knowledge.vault.intake.contract.ts` OR create new file
`src/scoped.knowledge.provider.contract.ts` (choose based on GC-023
pre-flight result).

```ts
export interface ScopedKnowledgeProvider {
  providerId: string;
  providerClass: 'code-graph' | 'cortex' | 'source-map' | 'indexed-reference';
  scope: {
    repoPaths: string[];
    excludePaths: string[];
    languageFilter?: string[];
  };
  metadata: {
    sourceClass: 'canon' | 'reference' | 'example' | 'rejected';
    freshness: 'live' | 'cached' | 'stale';
    confidence: number;
    lastSync: string;
  };
  queryContract: {
    readOnly: true;
    maxResultsPerQuery: number;
    cachingPolicy: string;
  };
  blockedFromActing: true;
}
```

Key constraints:

- `ScopedKnowledgeProvider` is a subclass of knowledge intake. Provider
  class `'code-graph'` maps to intake class `'external-reference'`. Do not
  create a separate source registry.
- `blockedFromActing: true` is a literal `true` type — no provider can act
  on its results.
- `providerClass: 'rejected'` in `metadata.sourceClass` means Provider
  Engine must skip this provider's output.
- Context Builder consumes provider output only through
  `ContextProfile.sourceRelevance` — not by direct injection.
- Policy Engine must block any provider attempt to override governance
  decisions or classify risk.

### Governance steps

#### S10c.A — GC-018 authorization packet

Create `docs/baselines/CVF_GC018_ADD_E1_SCOPED_KNOWLEDGE_AUTHORIZATION_2026-05-17.md`.

Required fields:

- Status: AUTHORIZED FOR LOCAL IMPLEMENTATION
- Owner surface: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/`
- Permitted implementation: `ScopedKnowledgeProvider` type as subclass of
  knowledge vault intake + query helper + Policy Engine policy-override guard
  + tests
- Claim boundary: read-only provider contract; no code execution, no governance
  override

#### S10c.B — GC-023 pre-flight

```bash
wc -l EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/knowledge.vault.intake.contract.ts
```

If under 600 lines, extend in place. If at or above 600, create new file
`src/scoped.knowledge.provider.contract.ts` and import from intake contract.

#### S10c.C — Implement

Add or create `ScopedKnowledgeProvider` type and two helpers:

```ts
export function queryProvider(
  provider: ScopedKnowledgeProvider,
  query: { path: string; maxResults: number },
): { results: string[]; source: string; freshness: string }

export function guardProviderAction(
  provider: ScopedKnowledgeProvider,
  proposedAction: string,
): { allowed: false; reason: string }
```

`guardProviderAction` always returns `allowed: false` — providers are
read-only by contract.

#### S10c.D — Tests (20–25 unit tests)

File: `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/scoped.knowledge.provider.contract.test.ts`

Required test cases:

1. Valid provider with all fields passes type check.
2. `queryProvider` returns results within `maxResultsPerQuery` limit.
3. `queryProvider` respects `excludePaths` (results don't include excluded).
4. `queryProvider` with `languageFilter` returns only matching-language results.
5. `guardProviderAction` always returns `allowed: false` regardless of action.
6. Provider with `metadata.sourceClass: 'rejected'` is skipped by query.
7. Provider with `freshness: 'stale'` is valid but tagged in output.
8. `blockedFromActing: true` is enforced at type level (TypeScript compile
   check — cannot assign `false`).
9. Provider output consumed via `ContextProfile.sourceRelevance` maps
   correctly (integration with ADD-B).
10. Empty `repoPaths` returns empty results without crash.
11–25: Edge cases for confidence values (0–1 range), missing optional fields,
multi-language filter, policy override attempt (returns blocked).

#### S10c.E — ADR document

Create `docs/reference/CVF_ADR_SCOPED_KNOWLEDGE_AS_INTAKE_SUBCLASS_2026-05-17.md`.
Must state: provider class maps to intake class; no separate registry;
Context Builder is the only consumer path; Policy Engine guards override.

#### S10c.F — Adoption roadmap + inventory + consensus roadmap updates

Work Plan row:
`| 10c | ADD-E1 Scoped Knowledge/Code Graph provider contract | complete 2026-05-17 |`

Inventory ADD-E1 row: `deferred` → `runtime-owned`, `completed 2026-05-17`.

#### S10c.G — Final handoff append + full queue closure

After Step 10c is complete, append a final summary entry to this handoff:

- All Steps 8–10 complete.
- All deferred items from the Claude-Codex consensus roadmap are now either
  `runtime-owned` or `excluded`.
- The full absorption queue (Steps 1–10) is closed.
- Update the final consensus roadmap header to reflect full queue closure.
- No further absorption steps are pending. Any future work requires a new
  GC-018 triggered by a concrete new roadmap (not these items).

### Verification

```bash
cd EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION
npm test
npm run check
```

Commit: `feat(cpf): add ADD-E1 scoped knowledge provider contract`

### Public-sync after Step 10c (final sync for this queue)

Copy all new CPF src files from Steps 8, 9, 10a, 10b, 10c and their tests
to public-sync (if not already synced per-step). Update evidence page to
add all five lanes. Push to GitHub.

### Claim boundary for Steps 10a–10c

- C1: schema standard only; no checkpoint runtime engine.
- C2: integration layer only; does not replace existing CPF agent contracts.
- E1: read-only provider contract; no code execution, no governance override.
- None of these steps change public claims, release gates, or GA posture.
- The full deferred absorption queue is closed after Step 10c.

---

## Completion checklist for Codex

After all steps in this handoff are done, verify:

- [x] Steps 8–10 all have GC-018 authorization packets in `docs/baselines/`
- [x] Steps 8–10 all have adoption roadmap docs in `docs/roadmaps/`
- [x] Steps 8–10 all have ADR docs in `docs/reference/`
- [x] Inventory has no remaining `deferred` rows (all are `runtime-owned` or `excluded`)
- [x] Final consensus roadmap Work Plan has rows 8–10c all marked complete
- [x] All CPF new files have tests and pass `npm test` + `npm run check`
- [x] Public-sync carries all new src files + updated evidence page
- [x] This handoff has a dated completion entry appended for each step
- [x] Pre-commit hook chain passes on each commit (GC-023, GC-045, docs governance)

## 2026-05-17 - Step 8 ADD-B Context Profile Metadata Completed

Status: Step 8 completed locally.

Authorization packet:

- `docs/baselines/CVF_GC018_ADD_B_CONTEXT_PROFILE_AUTHORIZATION_2026-05-17.md`

Roadmap and ADR:

- `docs/roadmaps/CVF_ADD_B_CONTEXT_PROFILE_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`
- `docs/reference/CVF_ADR_CONTEXT_PROFILE_ADVISORY_METADATA_2026-05-17.md`

Delivered:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/context.profile.contract.ts`
  defines `ContextProfile` and `applyContextProfile`;
- Context Profile exports were added through the CPF context barrel;
- focused tests were added in
  `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/context.profile.contract.test.ts`;
- inventory and final consensus roadmap now mark ADD-B `runtime-owned` /
  `completed 2026-05-17`.

Focused verification:

- Control Plane Foundation `npm test` PASS;
- Control Plane Foundation `npm run check` PASS.

Claim boundary:

- advisory metadata only;
- no execution authority, prompt injection, provider routing change, approval
  authority, source registry, release gate change, or GA posture change.

## 2026-05-17 - Step 9 GAP-AGENT-HANDOFF Completed

Status: Step 9 completed locally.

Authorization packet:

- `docs/baselines/CVF_GC018_GAP_AGENT_HANDOFF_AUTHORIZATION_2026-05-17.md`

Roadmap and ADR:

- `docs/roadmaps/CVF_GAP_AGENT_HANDOFF_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`
- `docs/reference/CVF_ADR_AGENT_HANDOFF_CONTRACT_RELATIONSHIP_2026-05-17.md`

Delivered:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/agent.handoff.contract.ts`
  defines `AgentHandoffRecord`, `createAgentHandoff`,
  `validateAgentHandoff`, and `verifyPolicyContinuity`;
- CPF coordination barrel now exports the handoff contract helpers/types;
- focused tests were added in
  `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/agent.handoff.contract.test.ts`;
- inventory and final consensus roadmap now mark GAP-AGENT-HANDOFF
  `runtime-owned` / `completed 2026-05-17`.

Focused verification:

- Control Plane Foundation `npm test` PASS;
- Control Plane Foundation `npm run check` PASS.

Claim boundary:

- bridge contract only;
- no new agent authority, runtime execution engine, replacement of existing CPF
  agent contracts, release gate change, or GA posture change;
- callers remain responsible for acting on validation helper results.

## 2026-05-17 - Step 10a ADD-C1 Continuity Checkpoint Completed

Status: Step 10a completed locally.

Authorization packet:

- `docs/baselines/CVF_GC018_ADD_C1_CONTINUITY_AUTHORIZATION_2026-05-17.md`

Roadmap and ADR:

- `docs/roadmaps/CVF_ADD_C1_CONTINUITY_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`
- `docs/reference/CVF_ADR_CONTINUITY_CHECKPOINT_AND_W123_RELATIONSHIP_2026-05-17.md`

Delivered:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/continuity.checkpoint.contract.ts`
  defines `ContinuityCheckpoint` and `validateCheckpoint`;
- CPF continuation barrel now exports the continuity checkpoint contract
  helpers/types;
- focused tests were added in
  `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/continuity.checkpoint.contract.test.ts`;
- ADR records the W123 audit finding: W123 owns execution continuity; C1 owns
  the record shape;
- inventory and final consensus roadmap now mark ADD-C1 `runtime-owned` /
  `completed 2026-05-17`.

Focused verification:

- Control Plane Foundation `npm test` PASS;
- Control Plane Foundation `npm run check` PASS.

Claim boundary:

- schema standard only;
- no checkpoint execution engine, runtime continuation behavior change,
  retroactive W123 enforcement, release gate change, or GA posture change.

## 2026-05-17 - Step 10b ADD-C2 Delegation Contract Completed

Status: Step 10b completed locally.

Authorization packet:

- `docs/baselines/CVF_GC018_ADD_C2_DELEGATION_AUTHORIZATION_2026-05-17.md`

Roadmap and ADR:

- `docs/roadmaps/CVF_ADD_C2_DELEGATION_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`
- `docs/reference/CVF_ADR_DELEGATION_CONTRACT_AND_CPF_RELATIONSHIP_2026-05-17.md`

Delivered:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/delegation.contract.ts`
  defines `DelegationContract`, write-scope validation, contract validation,
  and closure report validation;
- CPF coordination barrel exports the delegation contract helpers/types;
- `EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/delegation.boundary.guard.contract.ts`
  adds a thin delegated-write boundary helper;
- EPF dispatch barrel exports the delegated-write boundary helper/types;
- focused CPF and EPF tests were added;
- inventory and final consensus roadmap now mark ADD-C2 `runtime-owned` /
  `completed 2026-05-17`.

Focused verification:

- Control Plane Foundation `npm test` PASS;
- Control Plane Foundation `npm run check` PASS;
- Execution Plane Foundation `npm test` PASS;
- Execution Plane Foundation `npm run check` PASS.

Claim boundary:

- integration layer only;
- no replacement of existing CPF agent contracts, no new agent authority, no
  runtime execution engine, no release gate change, and no GA posture change;
- callers remain responsible for acting on validation helper results.

## 2026-05-17 - Step 10c ADD-E1 Scoped Knowledge Completed

Status: Step 10c completed locally.

Authorization packet:

- `docs/baselines/CVF_GC018_ADD_E1_SCOPED_KNOWLEDGE_AUTHORIZATION_2026-05-17.md`

Roadmap and ADR:

- `docs/roadmaps/CVF_ADD_E1_SCOPED_KNOWLEDGE_RUNTIME_ADOPTION_ROADMAP_2026-05-17.md`
- `docs/reference/CVF_ADR_SCOPED_KNOWLEDGE_AS_INTAKE_SUBCLASS_2026-05-17.md`

Delivered:

- `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/src/scoped.knowledge.provider.contract.ts`
  defines `ScopedKnowledgeProvider`, scoped query behavior, read-only provider
  action blocking, knowledge-vault intake-class mapping, and ADD-B
  `ContextProfile.sourceRelevance` mapping;
- Knowledge barrel exports were updated;
- focused tests were added in
  `EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION/tests/scoped.knowledge.provider.contract.test.ts`;
- inventory now marks ADD-E1 `runtime-owned` / completed 2026-05-17;
- final consensus roadmap now marks Step 10c complete and the full absorption
  queue closed.

Focused verification:

- Control Plane Foundation `npm test` PASS;
- Control Plane Foundation `npm run check` PASS.

Claim boundary:

- read-only provider contract only;
- no code execution, indexing runtime, direct context injection, provider
  routing change, governance override, release gate change, or GA posture
  change.

## 2026-05-17 - Full V8 Absorption Queue Closed

Status: Steps 8-10c completed locally. Full Claude-Codex consensus absorption
queue closed.

Completion state:

- Step 8 ADD-B Context Profile Metadata: complete;
- Step 9 GAP-AGENT-HANDOFF: complete;
- Step 10a ADD-C1 Continuity Checkpoint: complete;
- Step 10b ADD-C2 Delegation / Worker / Subagent contract: complete;
- Step 10c ADD-E1 Scoped Knowledge / Code Graph provider contract: complete.

Queue boundary:

- all deferred items from the Claude-Codex consensus roadmap are now either
  `runtime-owned` or `excluded`;
- no further absorption steps are pending from this queue;
- any future work requires a new concrete roadmap and fresh GC-018, not a
  continuation of these closed items.
