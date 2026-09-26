// CVF ACEL AKOE-P3 - Provider-Free Integrated Application Proof Runner
//
// Deterministic, local, offline proof script composing six already-accepted
// CVF owner contracts into one synthetic, reversible scenario, per
// docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_AKOE_P3_PROVIDER_FREE_INTEGRATED_APPLICATION_PROOF_2026-09-25.md
// and docs/baselines/CVF_GC018_ACEL_AKOE_P3_PROVIDER_FREE_INTEGRATED_APPLICATION_PROOF_2026-09-25.md.
//
// This script imports and composes the following owners without modifying
// or reimplementing their validation:
//   - EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/assf.behavioral.evaluation.contract.ts
//     (judgment: gradeBehavioralEvaluation, admitFixtureSet, admitBaselinePair)
//   - EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/proposal-impact-rollback.evidence.contract.ts
//     (proposal: evaluateProposalImpactRollback)
//   - EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/artifact.completion.scope.contract.ts
//     (artifact graph / scope: evaluateArtifactCompletionScope)
//   - EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store.ts
//     (execution / restart: MaoFileRunStore)
//   - EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.operator.projection.ts
//     (non-authoritative projection: buildOperationalOperatorProjection)
//   - EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract.ts
//     (risk/checkpoint identity: compileTaskGraph, MaoRiskLevel, MaoApprovalCheckpoint)
//
// No network, no provider/model/API call, no credential read. Every fixture
// identity, hash, and timestamp is a fixed literal so two runs against the
// same normalized temporary root produce byte-identical receipt JSON (after
// normalizing only the temporary root path itself). This is proof-only: it
// is never exported from the package's public API/barrel.
//
// Usage:
//   npx vite-node EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/scripts/run-acel-akoe-p3-offline-integration-proof.ts

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { createHash } from "node:crypto";

import {
  compileTaskGraph,
  type MaoAuthorityEnvelopeInput,
  type MaoTaskDefinitionInput,
} from "../src/mao/task.graph.contract";
import { MaoFileRunStore } from "../src/mao/durable.run.store";
import {
  buildOperationalOperatorProjection,
  type MaoOperationalWorkspaceItemSnapshot,
  type MaoOperationalGuardSnapshot,
} from "../src/mao/operational.operator.projection";
import { MaoEvidenceLedger } from "../src/mao/evidence.readout.contract";
import {
  evaluateArtifactCompletionScope,
  type MaoExpectedArtifact,
  type MaoObservedArtifact,
} from "../src/mao/artifact.completion.scope.contract";
import {
  gradeBehavioralEvaluation,
  admitFixtureSet,
  admitBaselinePair,
  produceBehavioralTrace,
  type BehavioralFixture,
} from "../src/mao/assf.behavioral.evaluation.contract";
import {
  evaluateProposalImpactRollback,
  type ProposalImpactRollbackEvidenceInput,
} from "../../CVF_LEARNING_PLANE_FOUNDATION/src/proposal-impact-rollback.evidence.contract";

// --- Fixed deterministic identities (never wall-clock derived) ---

const SCENARIO_ID = "acel-akoe-p3-offline-integration-proof-v1";
const SCHEMA_VERSION = "cvf.acel-akoe-p3-offline-integration-proof.v1";
const FIXED_CLOCK_ISO = "2026-09-25T00:00:00.000Z";
const TEMP_ROOT_PLACEHOLDER = "<NORMALIZED_TEMP_ROOT>";

function sha256Hex(...parts: string[]): string {
  return createHash("sha256").update(parts.join(":"), "utf8").digest("hex");
}

const STATE_HASH = sha256Hex(SCENARIO_ID, "state", "v1");
const DECISION_CONTEXT_HASH = sha256Hex(SCENARIO_ID, "decision-context", "v1");
const SOURCE_CONTENT_HASH = sha256Hex(SCENARIO_ID, "source-content", "v1");

// --- Facet 1: bounded judgment (ASSF owner) ---

// Mirrors the ASSF owner's own private `transitionKey` encoding exactly
// (length-prefixed `from`/`action`/`to` segments) so `requiredEvents` values
// match what `gradeBehavioralEvaluation` actually compares against. This is
// a read-only reimplementation of a pure string-encoding helper, not the
// owner's validation logic itself.
function transitionKeyFor(event: { from: string; action: string; to: string }): string {
  const encode = (segment: string): string => `${segment.length}:${segment}`;
  return `${encode(event.from)}|${encode(event.action)}|${encode(event.to)}`;
}

const JUDGMENT_POSITIVE_TRANSITION = { from: "planned", action: "evaluate", to: "evaluated" } as const;
const JUDGMENT_NEGATIVE_TRANSITION = { from: "planned", action: "reject", to: "rejected" } as const;

function buildJudgmentFixture(overrides: Partial<BehavioralFixture> = {}): BehavioralFixture {
  return {
    fixtureId: "akoe-p3-judgment-fixture-1",
    fixtureClass: "POSITIVE",
    repeatPolicy: "DETERMINISTIC",
    baselineRole: "NONE",
    canonicalInputBytes: "akoe-p3-canonical-input",
    sourceContentHash: SOURCE_CONTENT_HASH,
    fixtureContentHash: sha256Hex(SCENARIO_ID, "fixture-content", "v1"),
    decisionContextHash: DECISION_CONTEXT_HASH,
    candidateSpaceMode: "INCOMPLETE_WITH_ESCAPE",
    noMatchOutcome: "ESCALATE_NO_MATCH",
    judgmentAuthority: "EVIDENCE_ONLY",
    allowedTransitions: [JUDGMENT_POSITIVE_TRANSITION],
    requiredEvents: [transitionKeyFor(JUDGMENT_POSITIVE_TRANSITION)],
    requiredOutputObservations: ["judgment-evidence-recorded"],
    outcomeAssertions: [{ field: "verdict", expectedValue: "EVIDENCE_ONLY_PASS" }],
    evaluationClockIso: FIXED_CLOCK_ISO,
    ...overrides,
  };
}

const NEGATIVE_JUDGMENT_FIXTURE: BehavioralFixture = {
  ...buildJudgmentFixture(),
  fixtureId: "akoe-p3-judgment-fixture-negative-1",
  fixtureClass: "NEGATIVE",
  allowedTransitions: [JUDGMENT_NEGATIVE_TRANSITION],
  requiredEvents: [transitionKeyFor(JUDGMENT_NEGATIVE_TRANSITION)],
  outcomeAssertions: [{ field: "verdict", expectedValue: "REJECTED" }],
};

function runJudgmentFacet() {
  const positiveFixture = buildJudgmentFixture();
  const negativeFixture = NEGATIVE_JUDGMENT_FIXTURE;

  const admission = admitFixtureSet([positiveFixture, negativeFixture]);
  const pairAdmission = admitBaselinePair(positiveFixture, undefined);

  const matchingTrace = produceBehavioralTrace({
    traceId: "akoe-p3-judgment-trace-positive-1",
    fixtureId: positiveFixture.fixtureId,
    captureMode: "OFFLINE_SYNTHETIC",
    sourceContentHash: positiveFixture.sourceContentHash,
    decisionContextHash: positiveFixture.decisionContextHash,
    events: [{ from: "planned", action: "evaluate", to: "evaluated" }],
    outputObservations: ["judgment-evidence-recorded"],
    outcomeValues: { verdict: "EVIDENCE_ONLY_PASS" },
    selfReportedPass: true,
  });
  const matchingEvaluation = gradeBehavioralEvaluation(positiveFixture, [matchingTrace]);

  // Adversarial: no-match escape path. The candidate space is
  // INCOMPLETE_WITH_ESCAPE, so a trace that legitimately uses only the
  // declared escape transition must still evaluate cleanly (evidence-only,
  // never an authorization).
  const noMatchTransition = { from: "planned", action: "escalate", to: "no_match" } as const;
  const noMatchFixture = buildJudgmentFixture({
    fixtureId: "akoe-p3-judgment-fixture-no-match-1",
    allowedTransitions: [noMatchTransition],
    requiredEvents: [transitionKeyFor(noMatchTransition)],
    requiredOutputObservations: ["judgment-no-match-recorded"],
    outcomeAssertions: [{ field: "verdict", expectedValue: "ESCALATE_NO_MATCH" }],
  });
  const noMatchTrace = produceBehavioralTrace({
    traceId: "akoe-p3-judgment-trace-no-match-1",
    fixtureId: noMatchFixture.fixtureId,
    captureMode: "OFFLINE_SYNTHETIC",
    sourceContentHash: noMatchFixture.sourceContentHash,
    decisionContextHash: noMatchFixture.decisionContextHash,
    events: [{ from: "planned", action: "escalate", to: "no_match" }],
    outputObservations: ["judgment-no-match-recorded"],
    outcomeValues: { verdict: "ESCALATE_NO_MATCH" },
  });
  const noMatchEvaluation = gradeBehavioralEvaluation(noMatchFixture, [noMatchTrace]);

  // Adversarial: self-approval attempt. A trace that reports
  // selfReportedPass=true but uses an undeclared transition must still fail;
  // the grader must never trust the self-reported field.
  const selfApprovalTrace = produceBehavioralTrace({
    traceId: "akoe-p3-judgment-trace-self-approval-1",
    fixtureId: positiveFixture.fixtureId,
    captureMode: "OFFLINE_SYNTHETIC",
    sourceContentHash: positiveFixture.sourceContentHash,
    decisionContextHash: positiveFixture.decisionContextHash,
    events: [{ from: "planned", action: "undeclared-self-approve", to: "evaluated" }],
    outputObservations: ["judgment-evidence-recorded"],
    outcomeValues: { verdict: "EVIDENCE_ONLY_PASS" },
    selfReportedPass: true,
  });
  const selfApprovalEvaluation = gradeBehavioralEvaluation(positiveFixture, [selfApprovalTrace]);

  return {
    admission,
    pairAdmission,
    matchingEvaluation,
    noMatchEvaluation,
    selfApprovalEvaluation,
    positiveFixtureId: positiveFixture.fixtureId,
    negativeFixtureId: negativeFixture.fixtureId,
    noMatchFixtureId: noMatchFixture.fixtureId,
  };
}

// --- Facet 2: atomic candidate change (Learning Plane owner) ---

function runProposalFacet() {
  const acceptedInput: ProposalImpactRollbackEvidenceInput = {
    proposalId: "akoe-p3-proposal-1",
    evaluatedAt: FIXED_CLOCK_ISO,
    sourcePin: SCENARIO_ID,
    proposalDiffHash: sha256Hex(SCENARIO_ID, "proposal-diff", "v1"),
    rawEvidenceHash: sha256Hex(SCENARIO_ID, "raw-evidence", "v1"),
    persistentKnowledgeHash: sha256Hex(SCENARIO_ID, "persistent-knowledge", "v1"),
    incumbentSkillHash: sha256Hex(SCENARIO_ID, "incumbent-skill", "v1"),
    candidateSkillHash: sha256Hex(SCENARIO_ID, "candidate-skill", "v1"),
    currentActiveSkillHash: sha256Hex(SCENARIO_ID, "incumbent-skill", "v1"),
    incumbentScore: 0.7,
    candidateScore: 0.9,
  };
  const acceptedResult = evaluateProposalImpactRollback(acceptedInput);

  // Adversarial / rejection path: candidate does not strictly improve, so
  // the incumbent must remain active and rollback evidence must be
  // preserved rather than erased.
  const rejectedInput: ProposalImpactRollbackEvidenceInput = {
    ...acceptedInput,
    proposalId: "akoe-p3-proposal-rejected-1",
    candidateSkillHash: sha256Hex(SCENARIO_ID, "candidate-skill-weaker", "v1"),
    candidateScore: 0.5,
  };
  const rejectedResult = evaluateProposalImpactRollback(rejectedInput);

  // Adversarial: malformed/incomplete evidence must fail closed rather than
  // silently accept.
  const malformedResult = evaluateProposalImpactRollback({
    ...acceptedInput,
    proposalId: "",
    incumbentSkillHash: "",
  });

  return { acceptedResult, rejectedResult, malformedResult };
}

// --- Facet 3: durable scoped artifact graph with capped scheduling (MAO owner) ---

function runArtifactGraphFacet() {
  const declaredWorkItemIds = ["work-a", "work-b", "work-c", "work-d"];
  const expectedArtifacts: MaoExpectedArtifact[] = declaredWorkItemIds.map((workItemId) => ({
    workItemId,
    path: `artifacts/${workItemId}.json`,
    assignedWriterId: `writer-${workItemId}`,
  }));
  const observedArtifacts: MaoObservedArtifact[] = declaredWorkItemIds.map((workItemId) => ({
    path: `artifacts/${workItemId}.json`,
    contentHash: sha256Hex(SCENARIO_ID, "artifact", workItemId),
    writerId: `writer-${workItemId}`,
    verifiedBy: "assembly-verifier-1",
  }));

  const cappedResult = evaluateArtifactCompletionScope({
    dispatchId: "akoe-p3-dispatch-1",
    evaluatedAt: FIXED_CLOCK_ISO,
    sourcePin: SCENARIO_ID,
    assemblyVerifierId: "assembly-verifier-1",
    concurrencyCap: 2,
    declaredWorkItemIds,
    scheduledWorkItemIds: declaredWorkItemIds,
    expectedArtifacts,
    observedArtifacts,
    workerNotifications: declaredWorkItemIds.map((workItemId) => ({
      workItemId,
      workerId: `writer-${workItemId}`,
      status: "COMPLETE" as const,
    })),
  });

  // Adversarial: missing artifact (incomplete scope) must fail closed and
  // never be inferred complete from worker notification alone.
  const missingArtifactResult = evaluateArtifactCompletionScope({
    dispatchId: "akoe-p3-dispatch-missing-artifact-1",
    evaluatedAt: FIXED_CLOCK_ISO,
    sourcePin: SCENARIO_ID,
    assemblyVerifierId: "assembly-verifier-1",
    concurrencyCap: 2,
    declaredWorkItemIds,
    scheduledWorkItemIds: declaredWorkItemIds,
    expectedArtifacts,
    observedArtifacts: observedArtifacts.slice(0, declaredWorkItemIds.length - 1),
    workerNotifications: declaredWorkItemIds.map((workItemId) => ({
      workItemId,
      workerId: `writer-${workItemId}`,
      status: "COMPLETE" as const,
    })),
  });

  // Adversarial: assembly verifier mismatch (an artifact "verified" by
  // someone other than the declared assembly verifier) must fail closed.
  const assemblyVerifierMismatchResult = evaluateArtifactCompletionScope({
    dispatchId: "akoe-p3-dispatch-verifier-mismatch-1",
    evaluatedAt: FIXED_CLOCK_ISO,
    sourcePin: SCENARIO_ID,
    assemblyVerifierId: "assembly-verifier-1",
    concurrencyCap: 2,
    declaredWorkItemIds,
    scheduledWorkItemIds: declaredWorkItemIds,
    expectedArtifacts,
    observedArtifacts: observedArtifacts.map((artifact, index) =>
      index === 0 ? { ...artifact, verifiedBy: "unauthorized-verifier" } : artifact,
    ),
  });

  return { cappedResult, missingArtifactResult, assemblyVerifierMismatchResult, declaredWorkItemIds };
}

// --- Facets 4/7: execution-state persistence, restart identity, and
// non-authoritative projection (MAO durable store + projection owners) ---

async function runExecutionAndProjectionFacet(rootDirectory: string) {
  const authority: MaoAuthorityEnvelopeInput = {
    workOrderId:
      "docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_AKOE_P3_PROVIDER_FREE_INTEGRATED_APPLICATION_PROOF_2026-09-25.md",
    route: "SINGLE_AGENT_SINGLE_ROLE",
    riskLevel: "R2",
    budget: {
      maxInvocations: 4,
      maxConcurrentRoles: 1,
      maxRevisionDepth: 1,
      tokenCostCeiling: null,
      wallClockCeilingMs: null,
    },
    closerActorId: "local-reviewer-closer",
    approvalCheckpoints: ["PARTIAL_RESULT_ACCEPTANCE"],
  };
  const tasks: MaoTaskDefinitionInput[] = [
    { taskId: "work-a", role: "worker", riskLevel: "R2", fileScope: ["artifacts/work-a.json"] },
  ];
  const compileResult = compileTaskGraph({ authority, tasks });
  if (!compileResult.ok) {
    throw new Error(`akoe-p3 proof setup failure: task graph did not compile: ${compileResult.reason}`);
  }
  const graph = compileResult.graph;

  const store = new MaoFileRunStore(rootDirectory);
  const createResult = await store.createRun(graph);
  if (!createResult.ok) {
    throw new Error(`akoe-p3 proof setup failure: createRun failed: ${createResult.reason}`);
  }

  // The Task Lifecycle State Transition Table (task.graph.contract /
  // event.ledger.contract) requires a task's first event to move it from
  // "no prior event" into `planned` (or `blocked`) before any later state;
  // it cannot jump directly from no-event to `admitted`. `TASK_TRANSITIONED`
  // -> `planned` then `TASK_ADMITTED` -> `admitted` composes that owner rule
  // as-is rather than bypassing it.
  const plannedResult = await store.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId: "work-a",
    eventType: "TASK_TRANSITIONED",
    resultingState: "planned",
    occurredAt: FIXED_CLOCK_ISO,
    idempotencyKey: "akoe-p3-planned-1",
  });
  if (!plannedResult.ok) {
    throw new Error(`akoe-p3 proof setup failure: planned appendEvent failed: ${plannedResult.reason}`);
  }

  const appendResult = await store.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId: "work-a",
    eventType: "TASK_ADMITTED",
    resultingState: "admitted",
    occurredAt: FIXED_CLOCK_ISO,
    idempotencyKey: "akoe-p3-admit-1",
  });
  if (!appendResult.ok) {
    throw new Error(`akoe-p3 proof setup failure: appendEvent failed: ${appendResult.reason}`);
  }

  // Execution-state persistence + restart identity: a fresh resume must
  // replay to an identical graph identity and event history.
  const resumeResult = await store.resumeRun(graph.taskGraphId);

  // Adversarial: appending after a resume must extend, not fork, history;
  // duplicate idempotency key must be rejected (identity survives replay).
  const duplicateAppendResult = await store.appendEvent(graph.taskGraphId, {
    taskGraphId: graph.taskGraphId,
    taskId: "work-a",
    eventType: "TASK_ADMITTED",
    resultingState: "admitted",
    occurredAt: FIXED_CLOCK_ISO,
    idempotencyKey: "akoe-p3-admit-1",
  });

  // Non-authoritative projection: builds a read-only operator readout from
  // an independent evidence ledger. It must never be treated as execution
  // truth; the receipt records it as a separate, explicitly non-authoritative
  // field.
  const evidenceLedger = new MaoEvidenceLedger(graph.taskGraphId);
  const graphIngest = evidenceLedger.ingest({
    taskGraphId: graph.taskGraphId,
    taskId: null,
    receiptKind: "GRAPH",
    fields: { route: authority.route },
    recordedAt: FIXED_CLOCK_ISO,
  });
  const freshWorkspaceItem: MaoOperationalWorkspaceItemSnapshot = {
    itemId: "akoe-p3-workspace-item-1",
    lane: "execution",
    status: "active",
    evidencePaths: ["docs/reviews/evidence/cvf-acel-akoe-p3-offline-integration-proof-2026-09-25.json"],
  };
  const freshGuardSnapshot: MaoOperationalGuardSnapshot = {
    checker: "governance/compat/run_worker_return_fast_gate.py",
    status: "PASS",
    evidencePath: "docs/reviews/evidence/cvf-acel-akoe-p3-offline-integration-proof-2026-09-25.json",
  };
  const freshProjection = buildOperationalOperatorProjection({
    currentMode: "acel_applied_knowledge_owner_enrichment_active",
    activeHandoff: "AGENT_HANDOFF_V63_2026-09-18.md",
    nextAllowedMove: "execute committed bounded AKOE-P3 proof after dispatch release",
    ledger: evidenceLedger,
    terminalOutcomeEvidenceIds: new Set<string>(),
    generatedAt: FIXED_CLOCK_ISO,
    evaluatedAt: FIXED_CLOCK_ISO,
    staleAfterMs: 60_000,
    workspaceItems: [freshWorkspaceItem],
    guardSnapshots: [freshGuardSnapshot],
  });

  // Adversarial: stale/contradictory projection. Evaluated far after the
  // last recorded evidence (beyond staleAfterMs), the freshness class must
  // report STALE and can never override the durable execution evidence
  // above.
  const staleProjection = buildOperationalOperatorProjection({
    currentMode: "acel_applied_knowledge_owner_enrichment_active",
    activeHandoff: "AGENT_HANDOFF_V63_2026-09-18.md",
    nextAllowedMove: "execute committed bounded AKOE-P3 proof after dispatch release",
    ledger: evidenceLedger,
    terminalOutcomeEvidenceIds: new Set<string>(),
    generatedAt: FIXED_CLOCK_ISO,
    evaluatedAt: "2026-09-26T00:00:00.000Z",
    staleAfterMs: 60_000,
    workspaceItems: [freshWorkspaceItem],
    guardSnapshots: [freshGuardSnapshot],
  });

  // Adversarial: an unbacked guard PASS (no evidence path) must be rejected
  // by the projection owner rather than silently accepted.
  const unbackedGuardResult = buildOperationalOperatorProjection({
    currentMode: "acel_applied_knowledge_owner_enrichment_active",
    activeHandoff: "AGENT_HANDOFF_V63_2026-09-18.md",
    nextAllowedMove: "execute committed bounded AKOE-P3 proof after dispatch release",
    ledger: evidenceLedger,
    terminalOutcomeEvidenceIds: new Set<string>(),
    generatedAt: FIXED_CLOCK_ISO,
    evaluatedAt: FIXED_CLOCK_ISO,
    staleAfterMs: 60_000,
    workspaceItems: [freshWorkspaceItem],
    guardSnapshots: [{ checker: "governance/compat/unbacked_checker.py", status: "PASS", evidencePath: null }],
  });

  return {
    graphId: graph.taskGraphId,
    authorityHash: graph.authorityEnvelope.authorityHash,
    createResult,
    appendResult,
    resumeResult,
    duplicateAppendResult,
    graphIngest,
    freshProjection,
    staleProjection,
    unbackedGuardResult,
  };
}

// --- Facets 5/6/8: independent verification, evidence-backed human
// acceptance, and separated terminal receipts are assembled directly in the
// receipt builder below from the artifact-graph and judgment results
// already produced (there is no separate owner function for these; the
// separation itself is the proof obligation). ---

interface AcelAkoeP3Receipt {
  schemaVersion: string;
  scenarioId: string;
  generatedAt: string;
  stateHash: string;
  decisionContextHash: string;
  sourceOwnerBindings: Record<string, string>;
  judgment: {
    fixtureSetAdmission: unknown;
    baselinePairAdmission: unknown;
    positiveMatchResult: unknown;
    noMatchEscapeResult: unknown;
    selfApprovalAttemptResult: unknown;
    judgmentAuthority: "EVIDENCE_ONLY";
    canAuthorizeProposal: false;
  };
  proposal: {
    acceptedCandidateResult: unknown;
    rejectedCandidateResult: unknown;
    malformedEvidenceResult: unknown;
  };
  artifactGraph: {
    declaredWorkItemIds: string[];
    cappedSchedulingResult: unknown;
    missingArtifactResult: unknown;
    assemblyVerifierMismatchResult: unknown;
  };
  execution: {
    taskGraphId: string;
    authorityHash: string;
    createOk: boolean;
    appendOk: boolean;
    resumeOk: boolean;
    resumeIdentityMatchesCreate: boolean;
    duplicateAppendRejected: boolean;
    duplicateAppendReason: string | null;
  };
  projection: {
    freshFreshnessClass: unknown;
    freshReadModelOnly: boolean;
    staleFreshnessClass: unknown;
    staleCannotOverrideExecution: true;
    unbackedGuardOk: boolean;
    unbackedGuardReason: string | null;
  };
  verification: {
    workerVerificationResult: "WORKER_SELF_CHECK_ADVISORY_ONLY";
    independentProbeDisposition: "PENDING_REVIEWER_EXECUTION";
    claimBoundary: string;
  };
  humanAcceptance: {
    checkpointApplicable: true;
    checkpointKind: "PARTIAL_RESULT_ACCEPTANCE";
    evidenceLocator: string;
    rejectionOpportunity: "AVAILABLE_BEFORE_ACCEPTANCE";
    decision: "PENDING_LOCAL_REVIEWER_DECISION";
    accountableOwner: "LOCAL_REVIEWER_CLOSER";
  };
  rejectionPreservation: {
    incumbentSkillHash: string;
    rawEvidenceHashPreserved: boolean;
    persistentKnowledgeHashPreserved: boolean;
  };
  terminalReceipts: {
    execution: { status: "EXECUTED"; taskGraphId: string; authorityHash: string };
    verification: { status: "PENDING_REVIEWER_EXECUTION" };
    acceptance: { status: "PENDING_LOCAL_DECISION" };
    accountability: { accountableOwner: "LOCAL_REVIEWER_CLOSER"; workerAuthority: "NO_ACCEPTANCE_AUTHORITY" };
  };
  receiptSha256: string;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    const result: Record<string, unknown> = {};
    for (const [key, val] of entries) result[key] = sortKeysDeep(val);
    return result;
  }
  return value;
}

async function buildReceipt(rootDirectory: string): Promise<AcelAkoeP3Receipt> {
  const judgment = runJudgmentFacet();
  const proposal = runProposalFacet();
  const artifactGraph = runArtifactGraphFacet();
  const executionAndProjection = await runExecutionAndProjectionFacet(rootDirectory);

  const resumeIdentityMatchesCreate =
    executionAndProjection.resumeResult.ok &&
    executionAndProjection.createResult.ok &&
    executionAndProjection.resumeResult.graph.taskGraphId === executionAndProjection.createResult.snapshot.graph.taskGraphId &&
    executionAndProjection.resumeResult.events.length === 2;

  const receiptWithoutHash: Omit<AcelAkoeP3Receipt, "receiptSha256"> = {
    schemaVersion: SCHEMA_VERSION,
    scenarioId: SCENARIO_ID,
    generatedAt: FIXED_CLOCK_ISO,
    stateHash: STATE_HASH,
    decisionContextHash: DECISION_CONTEXT_HASH,
    sourceOwnerBindings: {
      judgment: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/assf.behavioral.evaluation.contract.ts#gradeBehavioralEvaluation",
      proposal: "EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION/src/proposal-impact-rollback.evidence.contract.ts#evaluateProposalImpactRollback",
      artifactGraph: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/artifact.completion.scope.contract.ts#evaluateArtifactCompletionScope",
      execution: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/durable.run.store.ts#MaoFileRunStore",
      projection: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/operational.operator.projection.ts#buildOperationalOperatorProjection",
      taskGraph: "EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/task.graph.contract.ts#compileTaskGraph",
    },
    judgment: {
      fixtureSetAdmission: judgment.admission,
      baselinePairAdmission: judgment.pairAdmission,
      positiveMatchResult: judgment.matchingEvaluation,
      noMatchEscapeResult: judgment.noMatchEvaluation,
      selfApprovalAttemptResult: judgment.selfApprovalEvaluation,
      judgmentAuthority: "EVIDENCE_ONLY",
      canAuthorizeProposal: false,
    },
    proposal: {
      acceptedCandidateResult: proposal.acceptedResult,
      rejectedCandidateResult: proposal.rejectedResult,
      malformedEvidenceResult: proposal.malformedResult,
    },
    artifactGraph: {
      declaredWorkItemIds: artifactGraph.declaredWorkItemIds,
      cappedSchedulingResult: artifactGraph.cappedResult,
      missingArtifactResult: artifactGraph.missingArtifactResult,
      assemblyVerifierMismatchResult: artifactGraph.assemblyVerifierMismatchResult,
    },
    execution: {
      taskGraphId: executionAndProjection.graphId,
      authorityHash: executionAndProjection.authorityHash,
      createOk: executionAndProjection.createResult.ok,
      appendOk: executionAndProjection.appendResult.ok,
      resumeOk: executionAndProjection.resumeResult.ok,
      resumeIdentityMatchesCreate,
      duplicateAppendRejected: !executionAndProjection.duplicateAppendResult.ok,
      duplicateAppendReason: executionAndProjection.duplicateAppendResult.ok
        ? null
        : executionAndProjection.duplicateAppendResult.reason,
    },
    projection: {
      freshFreshnessClass: executionAndProjection.freshProjection.ok
        ? executionAndProjection.freshProjection.readout.freshness
        : null,
      freshReadModelOnly: executionAndProjection.freshProjection.ok
        ? executionAndProjection.freshProjection.readout.readModelOnly
        : false,
      staleFreshnessClass: executionAndProjection.staleProjection.ok
        ? executionAndProjection.staleProjection.readout.freshness
        : null,
      staleCannotOverrideExecution: true,
      unbackedGuardOk: executionAndProjection.unbackedGuardResult.ok,
      unbackedGuardReason: executionAndProjection.unbackedGuardResult.ok
        ? null
        : executionAndProjection.unbackedGuardResult.reason,
    },
    verification: {
      workerVerificationResult: "WORKER_SELF_CHECK_ADVISORY_ONLY",
      independentProbeDisposition: "PENDING_REVIEWER_EXECUTION",
      claimBoundary:
        "worker-produced verification is advisory only; it is never the independent Local reviewer result",
    },
    humanAcceptance: {
      checkpointApplicable: true,
      checkpointKind: "PARTIAL_RESULT_ACCEPTANCE",
      evidenceLocator: "docs/reviews/evidence/cvf-acel-akoe-p3-offline-integration-proof-2026-09-25.json",
      rejectionOpportunity: "AVAILABLE_BEFORE_ACCEPTANCE",
      decision: "PENDING_LOCAL_REVIEWER_DECISION",
      accountableOwner: "LOCAL_REVIEWER_CLOSER",
    },
    rejectionPreservation: {
      incumbentSkillHash: proposal.rejectedResult.ok ? proposal.rejectedResult.receipt.activeSkillHash : "",
      rawEvidenceHashPreserved: proposal.rejectedResult.ok
        ? proposal.rejectedResult.receipt.rollbackImpact.rawEvidenceHashBefore ===
          proposal.rejectedResult.receipt.rollbackImpact.rawEvidenceHashAfter
        : false,
      persistentKnowledgeHashPreserved: proposal.rejectedResult.ok
        ? proposal.rejectedResult.receipt.rollbackImpact.persistentKnowledgeHashBefore ===
          proposal.rejectedResult.receipt.rollbackImpact.persistentKnowledgeHashAfter
        : false,
    },
    terminalReceipts: {
      execution: {
        status: "EXECUTED",
        taskGraphId: executionAndProjection.graphId,
        authorityHash: executionAndProjection.authorityHash,
      },
      verification: { status: "PENDING_REVIEWER_EXECUTION" },
      acceptance: { status: "PENDING_LOCAL_DECISION" },
      accountability: { accountableOwner: "LOCAL_REVIEWER_CLOSER", workerAuthority: "NO_ACCEPTANCE_AUTHORITY" },
    },
  };

  const receiptSha256 = sha256Hex(stableStringify(receiptWithoutHash));
  return { ...receiptWithoutHash, receiptSha256 };
}

/**
 * Normalize a receipt's temporary-root-dependent identifiers so two runs
 * against different mkdtemp roots compare byte-identical. The run store's
 * taskGraphId/authorityHash are derived from work-order/task content, not
 * from the filesystem root, so no substitution is needed there; this
 * function exists to keep the byte-identity contract explicit and to be the
 * single place a future root-dependent field would be normalized.
 */
function normalizeForComparison(receipt: AcelAkoeP3Receipt, actualRoot: string): AcelAkoeP3Receipt {
  const serialized = JSON.stringify(receipt).split(actualRoot.replace(/\\/g, "\\\\")).join(TEMP_ROOT_PLACEHOLDER);
  return JSON.parse(serialized) as AcelAkoeP3Receipt;
}

async function runOnce(): Promise<{ receipt: AcelAkoeP3Receipt; normalized: AcelAkoeP3Receipt }> {
  const root = await mkdtemp(join(tmpdir(), "acel-akoe-p3-proof-"));
  try {
    const receipt = await buildReceipt(root);
    const normalized = normalizeForComparison(receipt, root);
    return { receipt, normalized };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const first = await runOnce();
  const second = await runOnce();

  const firstStable = stableStringify(first.normalized);
  const secondStable = stableStringify(second.normalized);
  const byteIdentical = firstStable === secondStable;

  if (!byteIdentical) {
    console.error("FAIL: receipt is not byte-identical across two normalized runs");
    console.error("first: ", firstStable.slice(0, 400));
    console.error("second:", secondStable.slice(0, 400));
    process.exitCode = 1;
    return;
  }

  const outputPath = resolve(
    __dirname,
    "..",
    "..",
    "..",
    "docs/reviews/evidence/cvf-acel-akoe-p3-offline-integration-proof-2026-09-25.json",
  );
  mkdirSync(dirname(outputPath), { recursive: true });
  const finalJson = JSON.stringify(sortKeysDeep(first.receipt), null, 2) + "\n";
  await writeFile(outputPath, finalJson, "utf8");

  console.log("PASS: acel-akoe-p3 offline integration proof runner completed.");
  console.log(`Byte-identical across two normalized runs: ${byteIdentical}`);
  console.log(`Receipt written to: ${outputPath}`);
  console.log(`receiptSha256 (run 1): ${first.receipt.receiptSha256}`);
  console.log(`receiptSha256 (run 2): ${second.receipt.receiptSha256}`);
  console.log(`Final file exists: ${existsSync(outputPath)}`);
}

main().catch((error: unknown) => {
  console.error("FAIL: acel-akoe-p3 offline integration proof runner threw an error");
  console.error(error);
  process.exitCode = 1;
});
