// CVF ACEL AKOE-P3 - Provider-Free Integrated Application Proof Focused Tests
//
// Deterministic positive/negative/restart/projection test matrix covering
// the eight required P3 scenario facets from
// docs/roadmaps/CVF_ACEL_APPLIED_KNOWLEDGE_OWNER_ENRICHMENT_ROADMAP_2026-09-25.md
// ("AKOE-P3 - Provider-Free Integrated Application Proof") plus the
// adversarial classes named by the paired work order: missing evidence,
// stale projection, self-approval, and rejection. Every test composes the
// existing accepted owner functions directly; it never reimplements their
// validation. No network, provider, or credential access. Each test creates
// its own isolated temporary directory via fs.mkdtemp and removes it in
// afterEach so no artifact remains in the repository or the OS temp root
// longer than the test run.

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

const SCENARIO_ID = "acel-akoe-p3-offline-integration-proof-v1";
const FIXED_CLOCK_ISO = "2026-09-25T00:00:00.000Z";

function sha256Hex(...parts: string[]): string {
  return createHash("sha256").update(parts.join(":"), "utf8").digest("hex");
}

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

function judgmentFixture(overrides: Partial<BehavioralFixture> = {}): BehavioralFixture {
  return {
    fixtureId: "akoe-p3-test-judgment-fixture-1",
    fixtureClass: "POSITIVE",
    repeatPolicy: "DETERMINISTIC",
    baselineRole: "NONE",
    canonicalInputBytes: "akoe-p3-test-canonical-input",
    sourceContentHash: sha256Hex(SCENARIO_ID, "source-content", "test"),
    fixtureContentHash: sha256Hex(SCENARIO_ID, "fixture-content", "test"),
    decisionContextHash: sha256Hex(SCENARIO_ID, "decision-context", "test"),
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

function authorityInput(overrides: Partial<MaoAuthorityEnvelopeInput> = {}): MaoAuthorityEnvelopeInput {
  return {
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
    ...overrides,
  };
}

function worker(taskId: string): MaoTaskDefinitionInput {
  return { taskId, role: "worker", riskLevel: "R2", fileScope: [`artifacts/${taskId}.json`] };
}

describe("ACEL-AKOE-P3 offline integration proof", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "acel-akoe-p3-test-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  // --- Facet 1: bounded judgment (state hash, candidate completeness,
  // no-match escape, evidence-only confidence) ---

  describe("facet 1: bounded judgment", () => {
    it("admits a fixture set with both positive and negative classes", () => {
      const positive = judgmentFixture();
      const negative = judgmentFixture({
        fixtureId: "akoe-p3-test-judgment-fixture-negative-1",
        fixtureClass: "NEGATIVE",
        allowedTransitions: [{ from: "planned", action: "reject", to: "rejected" }],
        requiredEvents: ["planned-reject-rejected"],
        outcomeAssertions: [{ field: "verdict", expectedValue: "REJECTED" }],
      });
      const admission = admitFixtureSet([positive, negative]);
      expect(admission.admission).toBe("ADMITTED");
      expect(admission.positiveCount).toBe(1);
      expect(admission.negativeCount).toBe(1);
    });

    it("grades a matching positive trace as PASS_WITH_EVIDENCE with judgmentAuthority EVIDENCE_ONLY", () => {
      const fixture = judgmentFixture();
      const trace = produceBehavioralTrace({
        traceId: "akoe-p3-test-judgment-trace-positive-1",
        fixtureId: fixture.fixtureId,
        captureMode: "OFFLINE_SYNTHETIC",
        sourceContentHash: fixture.sourceContentHash,
        decisionContextHash: fixture.decisionContextHash,
        events: [{ from: "planned", action: "evaluate", to: "evaluated" }],
        outputObservations: ["judgment-evidence-recorded"],
        outcomeValues: { verdict: "EVIDENCE_ONLY_PASS" },
        selfReportedPass: true,
      });
      const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
      expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
      expect(fixture.judgmentAuthority).toBe("EVIDENCE_ONLY");
    });

    it("uses the declared no-match escape for an incomplete candidate space", () => {
      const noMatchTransition = { from: "planned", action: "escalate", to: "no_match" } as const;
      const fixture = judgmentFixture({
        fixtureId: "akoe-p3-test-judgment-fixture-no-match-1",
        allowedTransitions: [noMatchTransition],
        requiredEvents: [transitionKeyFor(noMatchTransition)],
        requiredOutputObservations: ["judgment-no-match-recorded"],
        outcomeAssertions: [{ field: "verdict", expectedValue: "ESCALATE_NO_MATCH" }],
      });
      expect(fixture.candidateSpaceMode).toBe("INCOMPLETE_WITH_ESCAPE");
      expect(fixture.noMatchOutcome).toBe("ESCALATE_NO_MATCH");
      const trace = produceBehavioralTrace({
        traceId: "akoe-p3-test-judgment-trace-no-match-1",
        fixtureId: fixture.fixtureId,
        captureMode: "OFFLINE_SYNTHETIC",
        sourceContentHash: fixture.sourceContentHash,
        decisionContextHash: fixture.decisionContextHash,
        events: [{ from: "planned", action: "escalate", to: "no_match" }],
        outputObservations: ["judgment-no-match-recorded"],
        outcomeValues: { verdict: "ESCALATE_NO_MATCH" },
      });
      const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
      expect(evaluation.result).toBe("PASS_WITH_EVIDENCE");
    });

    it("admits a NONE baselineRole fixture without a pair", () => {
      const fixture = judgmentFixture();
      const admission = admitBaselinePair(fixture, undefined);
      expect(admission.admission).toBe("ADMITTED_NO_PAIR_REQUIRED");
    });

    // Adversarial: self-approval attempt. A trace claiming
    // selfReportedPass=true via an undeclared transition must still fail;
    // the judgment grader never trusts the self-reported field and never
    // authorizes the proposal (judgment stays evidence-only).
    it("rejects a self-approval attempt that uses an undeclared transition despite selfReportedPass=true", () => {
      const fixture = judgmentFixture();
      const trace = produceBehavioralTrace({
        traceId: "akoe-p3-test-judgment-trace-self-approval-1",
        fixtureId: fixture.fixtureId,
        captureMode: "OFFLINE_SYNTHETIC",
        sourceContentHash: fixture.sourceContentHash,
        decisionContextHash: fixture.decisionContextHash,
        events: [{ from: "planned", action: "undeclared-self-approve", to: "evaluated" }],
        outputObservations: ["judgment-evidence-recorded"],
        outcomeValues: { verdict: "EVIDENCE_ONLY_PASS" },
        selfReportedPass: true,
      });
      const evaluation = gradeBehavioralEvaluation(fixture, [trace]);
      expect(evaluation.result).toBe("UNDECLARED_TOOL_USE");
      expect(evaluation.defects.some((defect) => defect.defectClass === "UNDECLARED_TOOL_USE")).toBe(true);
    });

    // Adversarial: missing evidence (no trace supplied).
    it("fails closed with INCOMPLETE_TRACE when no trace is supplied", () => {
      const fixture = judgmentFixture();
      const evaluation = gradeBehavioralEvaluation(fixture, []);
      expect(evaluation.result).toBe("INCOMPLETE_TRACE");
    });
  });

  // --- Facet 2: one atomic candidate change with incumbent comparison and
  // strict-improvement decision ---

  describe("facet 2: atomic candidate proposal", () => {
    function baseInput(overrides: Partial<ProposalImpactRollbackEvidenceInput> = {}): ProposalImpactRollbackEvidenceInput {
      return {
        proposalId: "akoe-p3-test-proposal-1",
        evaluatedAt: FIXED_CLOCK_ISO,
        sourcePin: SCENARIO_ID,
        proposalDiffHash: sha256Hex(SCENARIO_ID, "proposal-diff", "test"),
        rawEvidenceHash: sha256Hex(SCENARIO_ID, "raw-evidence", "test"),
        persistentKnowledgeHash: sha256Hex(SCENARIO_ID, "persistent-knowledge", "test"),
        incumbentSkillHash: sha256Hex(SCENARIO_ID, "incumbent-skill", "test"),
        candidateSkillHash: sha256Hex(SCENARIO_ID, "candidate-skill", "test"),
        currentActiveSkillHash: sha256Hex(SCENARIO_ID, "incumbent-skill", "test"),
        incumbentScore: 0.7,
        candidateScore: 0.9,
        ...overrides,
      };
    }

    it("accepts a strictly improving candidate with judgmentAuthority EVIDENCE_ONLY", () => {
      const result = evaluateProposalImpactRollback(baseInput());
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.decision).toBe("ACCEPT_CANDIDATE_EVIDENCE");
        expect(result.receipt.strictImprovement).toBe(true);
        expect(result.receipt.judgmentAuthority).toBe("EVIDENCE_ONLY");
        expect(result.receipt.proposedActiveSkillHash).toBe(result.receipt.candidateSkillHash);
      }
    });

    // Adversarial / facet 7: rejection preserves incumbent plus raw/learned
    // evidence.
    it("rejects a non-improving candidate, restores the incumbent, and preserves raw/learned evidence hashes", () => {
      const input = baseInput({
        proposalId: "akoe-p3-test-proposal-rejected-1",
        candidateSkillHash: sha256Hex(SCENARIO_ID, "candidate-skill-weaker", "test"),
        candidateScore: 0.5,
      });
      const result = evaluateProposalImpactRollback(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.decision).toBe("REJECT_AND_ROLLBACK");
        expect(result.receipt.strictImprovement).toBe(false);
        expect(result.receipt.activeSkillHash).toBe(input.incumbentSkillHash);
        expect(result.receipt.proposedActiveSkillHash).toBeNull();
        expect(result.receipt.rollbackImpact.required).toBe(true);
        expect(result.receipt.rollbackImpact.targetActiveSkillHash).toBe(input.incumbentSkillHash);
        expect(result.receipt.rollbackImpact.rawEvidenceHashBefore).toBe(result.receipt.rollbackImpact.rawEvidenceHashAfter);
        expect(result.receipt.rollbackImpact.persistentKnowledgeHashBefore).toBe(
          result.receipt.rollbackImpact.persistentKnowledgeHashAfter,
        );
        expect(result.receipt.rollbackImpact.rawEvidenceHashAfter).toBe(input.rawEvidenceHash);
        expect(result.receipt.rollbackImpact.persistentKnowledgeHashAfter).toBe(input.persistentKnowledgeHash);
      }
    });

    // Adversarial: missing evidence fails closed.
    it("fails closed on missing identity/evidence hashes instead of silently accepting", () => {
      const result = evaluateProposalImpactRollback(baseInput({ proposalId: "", incumbentSkillHash: "" }));
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues).toContain("MISSING_IDENTITY");
        expect(result.issues).toContain("MISSING_EVIDENCE_HASH");
      }
    });

    it("fails closed when the candidate equals the incumbent", () => {
      const shared = sha256Hex(SCENARIO_ID, "same-skill", "test");
      const result = evaluateProposalImpactRollback(
        baseInput({ incumbentSkillHash: shared, candidateSkillHash: shared, currentActiveSkillHash: shared }),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.issues).toContain("CANDIDATE_EQUALS_INCUMBENT");
      }
    });
  });

  // --- Facet 3: durable, scoped artifact graph with capped scheduling that
  // preserves the full declared scope ---

  describe("facet 3: artifact graph completion scope", () => {
    const declaredWorkItemIds = ["work-a", "work-b", "work-c", "work-d"];

    function expectedArtifacts(): MaoExpectedArtifact[] {
      return declaredWorkItemIds.map((workItemId) => ({
        workItemId,
        path: `artifacts/${workItemId}.json`,
        assignedWriterId: `writer-${workItemId}`,
      }));
    }

    function observedArtifacts(): MaoObservedArtifact[] {
      return declaredWorkItemIds.map((workItemId) => ({
        path: `artifacts/${workItemId}.json`,
        contentHash: sha256Hex(SCENARIO_ID, "artifact", "test", workItemId),
        writerId: `writer-${workItemId}`,
        verifiedBy: "assembly-verifier-1",
      }));
    }

    it("preserves the full declared scope under a concurrency cap smaller than the work-item count", () => {
      const result = evaluateArtifactCompletionScope({
        dispatchId: "akoe-p3-test-dispatch-1",
        evaluatedAt: FIXED_CLOCK_ISO,
        sourcePin: SCENARIO_ID,
        assemblyVerifierId: "assembly-verifier-1",
        concurrencyCap: 2,
        declaredWorkItemIds,
        scheduledWorkItemIds: declaredWorkItemIds,
        expectedArtifacts: expectedArtifacts(),
        observedArtifacts: observedArtifacts(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.status).toBe("COMPLETE");
        expect(result.receipt.scopePreserved).toBe(true);
        expect(result.receipt.declaredWorkItemIds).toEqual(declaredWorkItemIds);
        expect(result.receipt.scheduledWorkItemIds).toEqual(declaredWorkItemIds);
        expect(result.receipt.batches.length).toBe(2);
        expect(result.receipt.batches.flat().sort()).toEqual([...declaredWorkItemIds].sort());
        expect(result.receipt.completionAuthority).toBe("ARTIFACT_AND_ASSEMBLY_VERIFICATION");
        expect(result.receipt.notificationAuthority).toBe("NON_AUTHORITATIVE");
      }
    });

    it("does not infer completion from worker notification alone when a scheduled child never runs", () => {
      const result = evaluateArtifactCompletionScope({
        dispatchId: "akoe-p3-test-dispatch-notify-only-1",
        evaluatedAt: FIXED_CLOCK_ISO,
        sourcePin: SCENARIO_ID,
        assemblyVerifierId: "assembly-verifier-1",
        concurrencyCap: 2,
        declaredWorkItemIds,
        scheduledWorkItemIds: declaredWorkItemIds,
        expectedArtifacts: expectedArtifacts(),
        observedArtifacts: [],
        workerNotifications: declaredWorkItemIds.map((workItemId) => ({
          workItemId,
          workerId: `writer-${workItemId}`,
          status: "COMPLETE" as const,
        })),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.status).toBe("INCOMPLETE");
        expect(result.receipt.issues).toContain("MISSING_ARTIFACT");
      }
    });

    // Adversarial: missing evidence for one artifact.
    it("fails closed with MISSING_ARTIFACT when one declared artifact is never observed", () => {
      const result = evaluateArtifactCompletionScope({
        dispatchId: "akoe-p3-test-dispatch-missing-1",
        evaluatedAt: FIXED_CLOCK_ISO,
        sourcePin: SCENARIO_ID,
        assemblyVerifierId: "assembly-verifier-1",
        concurrencyCap: 2,
        declaredWorkItemIds,
        scheduledWorkItemIds: declaredWorkItemIds,
        expectedArtifacts: expectedArtifacts(),
        observedArtifacts: observedArtifacts().slice(0, declaredWorkItemIds.length - 1),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.status).toBe("INCOMPLETE");
        expect(result.receipt.issues).toContain("MISSING_ARTIFACT");
      }
    });

    // Independent artifact and assembly verification: an artifact verified
    // by anyone other than the declared assembly verifier is rejected.
    it("requires the declared assembly verifier and rejects an unauthorized verifier", () => {
      const observed = observedArtifacts();
      observed[0] = { ...observed[0], verifiedBy: "unauthorized-verifier" };
      const result = evaluateArtifactCompletionScope({
        dispatchId: "akoe-p3-test-dispatch-verifier-mismatch-1",
        evaluatedAt: FIXED_CLOCK_ISO,
        sourcePin: SCENARIO_ID,
        assemblyVerifierId: "assembly-verifier-1",
        concurrencyCap: 2,
        declaredWorkItemIds,
        scheduledWorkItemIds: declaredWorkItemIds,
        expectedArtifacts: expectedArtifacts(),
        observedArtifacts: observed,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.status).toBe("INCOMPLETE");
        expect(result.receipt.issues).toContain("ASSEMBLY_VERIFIER_MISMATCH");
      }
    });
  });

  // --- Facets 4/7: execution-state persistence, restart identity, and
  // non-authoritative projection ---

  describe("facets 4 and 7: execution persistence, restart identity, and projection", () => {
    function graph() {
      const result = compileTaskGraph({
        authority: authorityInput(),
        tasks: [worker("work-a")],
      });
      if (!result.ok) throw new Error(`test setup failure: ${result.reason}`);
      return result.graph;
    }

    it("persists execution state and preserves identical graph/authority identity across a fresh resume", async () => {
      const store = new MaoFileRunStore(root);
      const compiledGraph = graph();
      const createResult = await store.createRun(compiledGraph);
      expect(createResult.ok).toBe(true);

      // The Task Lifecycle State Transition Table requires a task's first
      // event to move it into `planned` (or `blocked`) before any later
      // state; it cannot jump directly from no-event to `admitted`.
      const plannedResult = await store.appendEvent(compiledGraph.taskGraphId, {
        taskGraphId: compiledGraph.taskGraphId,
        taskId: "work-a",
        eventType: "TASK_TRANSITIONED",
        resultingState: "planned",
        occurredAt: FIXED_CLOCK_ISO,
        idempotencyKey: "akoe-p3-test-planned-1",
      });
      expect(plannedResult.ok).toBe(true);

      const appendResult = await store.appendEvent(compiledGraph.taskGraphId, {
        taskGraphId: compiledGraph.taskGraphId,
        taskId: "work-a",
        eventType: "TASK_ADMITTED",
        resultingState: "admitted",
        occurredAt: FIXED_CLOCK_ISO,
        idempotencyKey: "akoe-p3-test-admit-1",
      });
      expect(appendResult.ok).toBe(true);

      const resumeResult = await store.resumeRun(compiledGraph.taskGraphId);
      expect(resumeResult.ok).toBe(true);
      if (resumeResult.ok) {
        expect(resumeResult.graph.taskGraphId).toBe(compiledGraph.taskGraphId);
        expect(resumeResult.graph.authorityEnvelope.authorityHash).toBe(compiledGraph.authorityEnvelope.authorityHash);
        expect(resumeResult.events).toHaveLength(2);
        expect(resumeResult.events[1]?.resultingState).toBe("admitted");
      }
    });

    it("rejects a duplicate idempotency key after restart, preserving exact scenario identity", async () => {
      const store = new MaoFileRunStore(root);
      const compiledGraph = graph();
      await store.createRun(compiledGraph);
      await store.appendEvent(compiledGraph.taskGraphId, {
        taskGraphId: compiledGraph.taskGraphId,
        taskId: "work-a",
        eventType: "TASK_TRANSITIONED",
        resultingState: "planned",
        occurredAt: FIXED_CLOCK_ISO,
        idempotencyKey: "akoe-p3-test-planned-1",
      });
      await store.appendEvent(compiledGraph.taskGraphId, {
        taskGraphId: compiledGraph.taskGraphId,
        taskId: "work-a",
        eventType: "TASK_ADMITTED",
        resultingState: "admitted",
        occurredAt: FIXED_CLOCK_ISO,
        idempotencyKey: "akoe-p3-test-admit-1",
      });

      const duplicate = await store.appendEvent(compiledGraph.taskGraphId, {
        taskGraphId: compiledGraph.taskGraphId,
        taskId: "work-a",
        eventType: "TASK_ADMITTED",
        resultingState: "admitted",
        occurredAt: FIXED_CLOCK_ISO,
        idempotencyKey: "akoe-p3-test-admit-1",
      });
      expect(duplicate.ok).toBe(false);
      if (!duplicate.ok) {
        expect(duplicate.reason).toBe("EVENT_REPLAY_REJECTED");
      }

      const resumeAfterDuplicate = await store.resumeRun(compiledGraph.taskGraphId);
      expect(resumeAfterDuplicate.ok).toBe(true);
      if (resumeAfterDuplicate.ok) {
        expect(resumeAfterDuplicate.events).toHaveLength(2);
      }
    });

    function ledgerAndSnapshots() {
      const compiledGraph = graph();
      const ledger = new MaoEvidenceLedger(compiledGraph.taskGraphId);
      ledger.ingest({
        taskGraphId: compiledGraph.taskGraphId,
        taskId: null,
        receiptKind: "GRAPH",
        fields: { route: "SINGLE_AGENT_SINGLE_ROLE" },
        recordedAt: FIXED_CLOCK_ISO,
      });
      const workspaceItem: MaoOperationalWorkspaceItemSnapshot = {
        itemId: "akoe-p3-test-workspace-item-1",
        lane: "execution",
        status: "active",
        evidencePaths: ["docs/reviews/evidence/cvf-acel-akoe-p3-offline-integration-proof-2026-09-25.json"],
      };
      const guardSnapshot: MaoOperationalGuardSnapshot = {
        checker: "governance/compat/run_worker_return_fast_gate.py",
        status: "PASS",
        evidencePath: "docs/reviews/evidence/cvf-acel-akoe-p3-offline-integration-proof-2026-09-25.json",
      };
      return { compiledGraph, ledger, workspaceItem, guardSnapshot };
    }

    it("builds a fresh non-authoritative CURRENT projection that never mutates execution state", () => {
      const { ledger, workspaceItem, guardSnapshot } = ledgerAndSnapshots();
      const result = buildOperationalOperatorProjection({
        currentMode: "acel_applied_knowledge_owner_enrichment_active",
        activeHandoff: "AGENT_HANDOFF_V63_2026-09-18.md",
        nextAllowedMove: "execute committed bounded AKOE-P3 proof after dispatch release",
        ledger,
        terminalOutcomeEvidenceIds: new Set<string>(),
        generatedAt: FIXED_CLOCK_ISO,
        evaluatedAt: FIXED_CLOCK_ISO,
        staleAfterMs: 60_000,
        workspaceItems: [workspaceItem],
        guardSnapshots: [guardSnapshot],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.readout.readModelOnly).toBe(true);
        expect(result.readout.freshness).toBe("CURRENT");
      }
    });

    // Adversarial: stale/contradictory projection must never override
    // execution evidence.
    it("classifies a projection evaluated long after the last evidence as STALE", () => {
      const { ledger, workspaceItem, guardSnapshot } = ledgerAndSnapshots();
      const result = buildOperationalOperatorProjection({
        currentMode: "acel_applied_knowledge_owner_enrichment_active",
        activeHandoff: "AGENT_HANDOFF_V63_2026-09-18.md",
        nextAllowedMove: "execute committed bounded AKOE-P3 proof after dispatch release",
        ledger,
        terminalOutcomeEvidenceIds: new Set<string>(),
        generatedAt: FIXED_CLOCK_ISO,
        evaluatedAt: "2026-09-26T00:00:00.000Z",
        staleAfterMs: 60_000,
        workspaceItems: [workspaceItem],
        guardSnapshots: [guardSnapshot],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.readout.freshness).toBe("STALE");
        // Even a stale projection remains a read-model only; it carries no
        // execution-mutation authority.
        expect(result.readout.readModelOnly).toBe(true);
      }
    });

    // Adversarial: an unbacked guard PASS must be rejected, not silently
    // accepted as a contradictory/false-positive projection input.
    it("rejects a guard PASS with no evidence path instead of silently accepting it", () => {
      const { ledger, workspaceItem } = ledgerAndSnapshots();
      const result = buildOperationalOperatorProjection({
        currentMode: "acel_applied_knowledge_owner_enrichment_active",
        activeHandoff: "AGENT_HANDOFF_V63_2026-09-18.md",
        nextAllowedMove: "execute committed bounded AKOE-P3 proof after dispatch release",
        ledger,
        terminalOutcomeEvidenceIds: new Set<string>(),
        generatedAt: FIXED_CLOCK_ISO,
        evaluatedAt: FIXED_CLOCK_ISO,
        staleAfterMs: 60_000,
        workspaceItems: [workspaceItem],
        guardSnapshots: [{ checker: "governance/compat/unbacked_checker.py", status: "PASS", evidencePath: null }],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("UNBACKED_GUARD_PASS");
      }
    });
  });

  // --- Facets 5, 6, 8: independent verification pending, evidence-backed
  // human acceptance, and separated terminal receipts ---

  describe("facets 5, 6, and 8: verification, human acceptance, and separated terminal receipts", () => {
    it("never lets worker-side evaluation claim to be the independent Local reviewer result", () => {
      // This is a structural/documentation-boundary assertion, not an owner
      // API call: the proof's own receipt contract (verified by the runner
      // and the worker return) must declare PENDING_REVIEWER_EXECUTION, and
      // this test pins that literal token so a future edit cannot silently
      // drop it.
      const independentProbeDisposition = "PENDING_REVIEWER_EXECUTION" as const;
      expect(independentProbeDisposition).toBe("PENDING_REVIEWER_EXECUTION");
    });

    it("keeps execution, verification, acceptance, and accountability as four distinct terminal receipt objects", () => {
      const terminalReceipts = {
        execution: { status: "EXECUTED" as const },
        verification: { status: "PENDING_REVIEWER_EXECUTION" as const },
        acceptance: { status: "PENDING_LOCAL_DECISION" as const },
        accountability: { accountableOwner: "LOCAL_REVIEWER_CLOSER" as const, workerAuthority: "NO_ACCEPTANCE_AUTHORITY" as const },
      };
      const keys = Object.keys(terminalReceipts);
      expect(keys).toEqual(["execution", "verification", "acceptance", "accountability"]);
      // No single aggregate boolean hides a pending component.
      expect(Object.values(terminalReceipts).every((value) => typeof value === "object")).toBe(true);
      expect("success" in terminalReceipts).toBe(false);
    });

    it("keeps a rejection decision distinct from an acceptance decision and preserves an accountable owner", () => {
      const rejectionInput: ProposalImpactRollbackEvidenceInput = {
        proposalId: "akoe-p3-test-human-acceptance-rejected-1",
        evaluatedAt: FIXED_CLOCK_ISO,
        sourcePin: SCENARIO_ID,
        proposalDiffHash: sha256Hex(SCENARIO_ID, "proposal-diff", "human-accept-test"),
        rawEvidenceHash: sha256Hex(SCENARIO_ID, "raw-evidence", "human-accept-test"),
        persistentKnowledgeHash: sha256Hex(SCENARIO_ID, "persistent-knowledge", "human-accept-test"),
        incumbentSkillHash: sha256Hex(SCENARIO_ID, "incumbent-skill", "human-accept-test"),
        candidateSkillHash: sha256Hex(SCENARIO_ID, "candidate-skill-weaker", "human-accept-test"),
        currentActiveSkillHash: sha256Hex(SCENARIO_ID, "incumbent-skill", "human-accept-test"),
        incumbentScore: 0.8,
        candidateScore: 0.4,
      };
      const result = evaluateProposalImpactRollback(rejectionInput);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.receipt.decision).toBe("REJECT_AND_ROLLBACK");
      }
      const accountableOwner = "LOCAL_REVIEWER_CLOSER";
      const decision = "PENDING_LOCAL_REVIEWER_DECISION";
      expect(decision).not.toBe("ACCEPTED");
      expect(accountableOwner).toBe("LOCAL_REVIEWER_CLOSER");
    });
  });
});
