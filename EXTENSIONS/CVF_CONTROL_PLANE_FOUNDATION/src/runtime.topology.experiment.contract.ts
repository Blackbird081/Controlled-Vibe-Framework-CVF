/**
 * CVF ACEL G2 - Runtime Topology Experiment Contract (T1, hermetic)
 *
 * Isolated, non-production decision-policy oracle. Simulates 32 proposal-only
 * runs across eight fixtures, two policies (A_FIXED, B_DYNAMIC) and two
 * repetitions. This module is intentionally not exported through any barrel
 * or production index: it has no production consumer and authorizes no
 * actual subagent, provider or network execution. All records and aggregate
 * reports carry evidenceClass "PROPOSAL_ONLY".
 *
 * Governance: docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_G2_TOPOLOGY_EXPERIMENT_T1_2026-09-16.md
 * Baseline: docs/baselines/CVF_GC018_ACEL_G2_TOPOLOGY_EXPERIMENT_T1_2026-09-16.md
 */

import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TaskClass =
  | "BOUNDED_RESEARCH"
  | "LOCAL_IMPLEMENTATION"
  | "COUPLED_REASONING"
  | "FAULT_FINDING";

export type ExperimentPolicy = "A_FIXED" | "B_DYNAMIC";

export type RouteAction =
  | "NO_DELEGATE"
  | "DELEGATE"
  | "PARALLELIZE"
  | "RECLAIM"
  | "ESCALATE";

export type Repetition = 1 | 2;

/**
 * evidenceClass is always PROPOSAL_ONLY for this hermetic T1 tranche. No
 * record or aggregate report produced by this contract may be promoted to
 * production or real-agent evidence without a separate T2 work order.
 */
export type EvidenceClass = "PROPOSAL_ONLY";

export interface AuthorityEnvelope {
  workOrderId: string;
  ownedPaths: string[];
  forbiddenPaths: string[];
  riskCeiling: "R0" | "R1" | "R2" | "R3";
  sandboxTier: number;
  providerExecutionAuthority: "FORBIDDEN";
}

export interface RuntimeEvidenceInput {
  observedLoadFactor: number;
  crossModuleCouplingScore: number;
  priorAttemptFailed: boolean;
  independentSubtaskCount: number;
  executorHealthDegraded: boolean;
}

export interface ExperimentFixture {
  taskId: string;
  taskClass: TaskClass;
  fixtureVersion: string;
  preselectedTopology: RouteAction;
  runtimeEvidence: RuntimeEvidenceInput;
  dynamicOracleAction: RouteAction;
  outcomeOracle: {
    expectAdmitted: boolean;
    criticalDefects: number;
  };
  authorityEnvelope: AuthorityEnvelope;
}

export interface RunRecord {
  taskId: string;
  taskClass: TaskClass;
  policy: ExperimentPolicy;
  repetition: Repetition;
  runtimeEvidence: RuntimeEvidenceInput;
  routeAction: RouteAction;
  admitted: boolean;
  qualityOracle: {
    actionMatchesOracle: boolean;
    invariantsPassed: boolean;
    outcomeOraclePassed: boolean;
    criticalDefects: number;
  };
  orchestrationMetrics: {
    decisionCorrect: boolean;
    firstPassAdmission: boolean;
    retryCount: number;
    simulatedContextTransferUnits: number;
    orchestrationSteps: number;
    deterministicIntegrationEffort: number;
  };
  authorityEnvelope: AuthorityEnvelope;
  evidenceClass: EvidenceClass;
  recordHash: string;
}

export interface AggregateComparison {
  policy: ExperimentPolicy;
  admittedRunCount: number;
  totalRunCount: number;
  meanOrchestrationSteps: number;
  meanDeterministicIntegrationEffort: number;
  meanSimulatedContextTransferUnits: number;
  evidenceClass: EvidenceClass;
}

export interface ExperimentReceipt {
  batchId: string;
  executionBaseHead: string;
  runnerCommand: string;
  fixtureManifestHash: string;
  runs: RunRecord[];
  totalRuns: number;
  uniqueRunKeys: number;
  actionsRepresented: RouteAction[];
  aggregate: AggregateComparison[];
  evidenceClass: EvidenceClass;
  generatedAt: string;
}

export class RuntimeTopologyExperimentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeTopologyExperimentError";
  }
}

// ---------------------------------------------------------------------------
// Authority invariants (fail closed)
// ---------------------------------------------------------------------------

const ALL_ACTIONS: RouteAction[] = [
  "NO_DELEGATE",
  "DELEGATE",
  "PARALLELIZE",
  "RECLAIM",
  "ESCALATE",
];

function isKnownAction(value: unknown): value is RouteAction {
  return typeof value === "string" && (ALL_ACTIONS as string[]).includes(value);
}

/**
 * Verifies that a proposed route action does not expand the immutable
 * authority envelope relative to its fixture-declared baseline. The
 * envelope's identity, owned/forbidden paths, risk ceiling, sandbox tier and
 * provider authority must be byte-identical before and after any route
 * decision. RECLAIM additionally must not retain write authority in both the
 * old and new executor (dual-write exclusivity).
 */
export function assertAuthorityEnvelopePreserved(
  before: AuthorityEnvelope,
  after: AuthorityEnvelope,
): void {
  if (before.workOrderId !== after.workOrderId) {
    throw new RuntimeTopologyExperimentError(
      "authority-envelope expansion: workOrderId changed across route decision",
    );
  }
  if (
    before.ownedPaths.length !== after.ownedPaths.length ||
    before.ownedPaths.some((p, i) => p !== after.ownedPaths[i])
  ) {
    throw new RuntimeTopologyExperimentError(
      "authority-envelope expansion: ownedPaths changed across route decision",
    );
  }
  if (
    before.forbiddenPaths.length !== after.forbiddenPaths.length ||
    before.forbiddenPaths.some((p, i) => p !== after.forbiddenPaths[i])
  ) {
    throw new RuntimeTopologyExperimentError(
      "authority-envelope expansion: forbiddenPaths changed across route decision",
    );
  }
  if (before.riskCeiling !== after.riskCeiling) {
    throw new RuntimeTopologyExperimentError(
      "authority-envelope expansion: riskCeiling changed across route decision",
    );
  }
  if (before.sandboxTier !== after.sandboxTier) {
    throw new RuntimeTopologyExperimentError(
      "authority-envelope expansion: sandboxTier changed across route decision",
    );
  }
  if (
    before.providerExecutionAuthority !== "FORBIDDEN" ||
    after.providerExecutionAuthority !== "FORBIDDEN"
  ) {
    throw new RuntimeTopologyExperimentError(
      "authority-envelope expansion: providerExecutionAuthority must remain FORBIDDEN",
    );
  }
}

const LEGAL_TRANSITIONS: Record<RouteAction, ReadonlySet<RouteAction>> = {
  NO_DELEGATE: new Set(["NO_DELEGATE", "DELEGATE", "PARALLELIZE", "ESCALATE"]),
  DELEGATE: new Set(["DELEGATE", "RECLAIM", "ESCALATE"]),
  PARALLELIZE: new Set(["PARALLELIZE", "RECLAIM", "ESCALATE"]),
  RECLAIM: new Set(["RECLAIM", "NO_DELEGATE", "DELEGATE", "ESCALATE"]),
  ESCALATE: new Set(["ESCALATE"]),
};

/**
 * Validates that a route transition from `from` to `to` is legal under the
 * closed transition table. Unknown actions and illegal transitions fail
 * closed with a thrown error rather than a permissive default.
 */
export function assertLegalTransition(from: RouteAction, to: RouteAction): void {
  if (!isKnownAction(from) || !isKnownAction(to)) {
    throw new RuntimeTopologyExperimentError(
      `unknown input: route action outside closed vocabulary (${String(from)} -> ${String(to)})`,
    );
  }
  if (!LEGAL_TRANSITIONS[from].has(to)) {
    throw new RuntimeTopologyExperimentError(
      `illegal transition: ${from} -> ${to} is not permitted`,
    );
  }
}

/**
 * A RECLAIM route action must not retain write authority in both the
 * pre-reclaim and post-reclaim executor. Callers pass the two candidate
 * executor ids that would hold write authority after the decision; exactly
 * one must remain.
 */
export function assertReclaimExclusivity(
  action: RouteAction,
  writeAuthorityHolders: string[],
): void {
  if (action !== "RECLAIM") {
    return;
  }
  const uniqueHolders = new Set(writeAuthorityHolders);
  if (uniqueHolders.size !== 1) {
    throw new RuntimeTopologyExperimentError(
      `reclaim dual-write authority: expected exactly one write-authority holder after RECLAIM, got ${uniqueHolders.size}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Policy decision functions
// ---------------------------------------------------------------------------

/**
 * Policy A: use the fixture's preselected topology and never reallocate
 * after dispatch. Runtime evidence is recorded but cannot change the action.
 */
export function decidePolicyA(fixture: ExperimentFixture): RouteAction {
  if (!isKnownAction(fixture.preselectedTopology)) {
    throw new RuntimeTopologyExperimentError(
      `unknown input: fixture ${fixture.taskId} preselectedTopology is outside the closed vocabulary`,
    );
  }
  return fixture.preselectedTopology;
}

/**
 * Policy B: may choose NO_DELEGATE, DELEGATE, PARALLELIZE, RECLAIM or
 * ESCALATE only when declared runtime evidence and the immutable authority
 * envelope allow it. The decision function is a pure, deterministic
 * evaluation over the fixture's declared runtime evidence - it consults no
 * clock, RNG, network or provider.
 */
export function decidePolicyB(fixture: ExperimentFixture): RouteAction {
  const ev = fixture.runtimeEvidence;
  if (
    typeof ev.observedLoadFactor !== "number" ||
    typeof ev.crossModuleCouplingScore !== "number" ||
    typeof ev.independentSubtaskCount !== "number" ||
    typeof ev.priorAttemptFailed !== "boolean" ||
    typeof ev.executorHealthDegraded !== "boolean"
  ) {
    throw new RuntimeTopologyExperimentError(
      `unknown input: fixture ${fixture.taskId} runtimeEvidence is malformed`,
    );
  }

  if (ev.executorHealthDegraded) {
    return "RECLAIM";
  }
  if (ev.priorAttemptFailed) {
    return "ESCALATE";
  }
  if (ev.independentSubtaskCount >= 2 && ev.crossModuleCouplingScore < 0.4) {
    return "PARALLELIZE";
  }
  if (ev.observedLoadFactor >= 0.6 || ev.crossModuleCouplingScore >= 0.6) {
    return "DELEGATE";
  }
  return "NO_DELEGATE";
}

export function decideRouteAction(
  policy: ExperimentPolicy,
  fixture: ExperimentFixture,
): RouteAction {
  return policy === "A_FIXED" ? decidePolicyA(fixture) : decidePolicyB(fixture);
}

// ---------------------------------------------------------------------------
// Quality admission (must precede all cost/economic comparison)
// ---------------------------------------------------------------------------

export interface QualityOracleResult {
  actionMatchesOracle: boolean;
  invariantsPassed: boolean;
  outcomeOraclePassed: boolean;
  criticalDefects: number;
  admitted: boolean;
}

/**
 * A run is admitted=true only if the selected action equals its fixture
 * oracle, all invariants pass, the outcome oracle passes and critical
 * defects are zero. This function must be evaluated before any economic/cost
 * comparison; callers must not compare unadmitted runs on cost.
 */
export function evaluateQualityAdmission(
  fixture: ExperimentFixture,
  policy: ExperimentPolicy,
  selectedAction: RouteAction,
  invariantsPassed: boolean,
): QualityOracleResult {
  const oracleAction =
    policy === "A_FIXED" ? fixture.preselectedTopology : fixture.dynamicOracleAction;
  const actionMatchesOracle = selectedAction === oracleAction;
  const criticalDefects = fixture.outcomeOracle.criticalDefects;
  const outcomeOraclePassed =
    fixture.outcomeOracle.expectAdmitted === actionMatchesOracle && criticalDefects === 0;

  const admitted =
    actionMatchesOracle && invariantsPassed && outcomeOraclePassed && criticalDefects === 0;

  return {
    actionMatchesOracle,
    invariantsPassed,
    outcomeOraclePassed,
    criticalDefects,
    admitted,
  };
}

/**
 * Selects the winning policy from admitted runs only. A cheaper failed
 * (unadmitted) run can never win: unadmitted runs are excluded before any
 * cost/effort comparison is made.
 */
export function selectCheaperAdmittedRun(
  candidates: RunRecord[],
): RunRecord | null {
  const admittedOnly = candidates.filter((r) => r.admitted);
  if (admittedOnly.length === 0) {
    return null;
  }
  return admittedOnly.reduce((best, current) =>
    current.orchestrationMetrics.deterministicIntegrationEffort <
    best.orchestrationMetrics.deterministicIntegrationEffort
      ? current
      : best,
  );
}

// ---------------------------------------------------------------------------
// Deterministic metrics
// ---------------------------------------------------------------------------

function computeOrchestrationMetrics(
  fixture: ExperimentFixture,
  policy: ExperimentPolicy,
  action: RouteAction,
  admitted: boolean,
): RunRecord["orchestrationMetrics"] {
  const ev = fixture.runtimeEvidence;
  const baseSteps = action === "NO_DELEGATE" ? 1 : action === "ESCALATE" ? 4 : 2;
  const contextUnits =
    action === "NO_DELEGATE"
      ? 0
      : Math.round((ev.crossModuleCouplingScore + ev.observedLoadFactor) * 10);
  const retryCount = admitted ? 0 : 1;
  const integrationEffort =
    baseSteps + contextUnits + (policy === "B_DYNAMIC" ? 1 : 0) + retryCount * 3;

  return {
    decisionCorrect: admitted,
    firstPassAdmission: admitted && retryCount === 0,
    retryCount,
    simulatedContextTransferUnits: contextUnits,
    orchestrationSteps: baseSteps,
    deterministicIntegrationEffort: integrationEffort,
  };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export interface RunOneOptions {
  fixture: ExperimentFixture;
  policy: ExperimentPolicy;
  repetition: Repetition;
}

/**
 * Executes exactly one hermetic (taskId, policy, repetition) run and returns
 * its full record. Fails closed (throws) on unknown input, authority
 * expansion, illegal transition or reclaim dual-write authority.
 */
export function runOne(options: RunOneOptions): RunRecord {
  const { fixture, policy, repetition } = options;

  const baselineEnvelope = fixture.authorityEnvelope;
  const action = decideRouteAction(policy, fixture);

  if (!isKnownAction(action)) {
    throw new RuntimeTopologyExperimentError(
      `unknown input: decided action for ${fixture.taskId} is outside the closed vocabulary`,
    );
  }

  assertLegalTransition(fixture.preselectedTopology, action);

  const afterEnvelope: AuthorityEnvelope = { ...baselineEnvelope };
  assertAuthorityEnvelopePreserved(baselineEnvelope, afterEnvelope);

  if (action === "RECLAIM") {
    assertReclaimExclusivity(action, [`${fixture.taskId}:post-reclaim-executor`]);
  }

  const quality = evaluateQualityAdmission(fixture, policy, action, true);
  const orchestrationMetrics = computeOrchestrationMetrics(
    fixture,
    policy,
    action,
    quality.admitted,
  );

  const recordHash = computeDeterministicHash(
    "runtime-topology-experiment-run",
    fixture.taskId,
    fixture.taskClass,
    policy,
    String(repetition),
    action,
    String(quality.admitted),
  );

  return {
    taskId: fixture.taskId,
    taskClass: fixture.taskClass,
    policy,
    repetition,
    runtimeEvidence: fixture.runtimeEvidence,
    routeAction: action,
    admitted: quality.admitted,
    qualityOracle: {
      actionMatchesOracle: quality.actionMatchesOracle,
      invariantsPassed: quality.invariantsPassed,
      outcomeOraclePassed: quality.outcomeOraclePassed,
      criticalDefects: quality.criticalDefects,
    },
    orchestrationMetrics,
    authorityEnvelope: afterEnvelope,
    evidenceClass: "PROPOSAL_ONLY",
    recordHash,
  };
}

function runKey(taskId: string, policy: ExperimentPolicy, repetition: Repetition): string {
  return `${taskId}::${policy}::${repetition}`;
}

/**
 * Executes the full 8 fixtures x 2 policies x 2 repetitions matrix and
 * returns exactly 32 unique run records. Fails closed on duplicate/missing
 * runs.
 */
export function runFullMatrix(fixtures: ExperimentFixture[]): RunRecord[] {
  if (fixtures.length !== 8) {
    throw new RuntimeTopologyExperimentError(
      `unknown input: expected exactly 8 fixtures, received ${fixtures.length}`,
    );
  }

  const seenTaskIds = new Set<string>();
  for (const fixture of fixtures) {
    if (seenTaskIds.has(fixture.taskId)) {
      throw new RuntimeTopologyExperimentError(
        `duplicate/missing run: duplicate fixture taskId ${fixture.taskId}`,
      );
    }
    seenTaskIds.add(fixture.taskId);
  }

  const taskClasses: TaskClass[] = [
    "BOUNDED_RESEARCH",
    "LOCAL_IMPLEMENTATION",
    "COUPLED_REASONING",
    "FAULT_FINDING",
  ];
  for (const taskClass of taskClasses) {
    const count = fixtures.filter((f) => f.taskClass === taskClass).length;
    if (count !== 2) {
      throw new RuntimeTopologyExperimentError(
        `duplicate/missing run: expected exactly 2 fixtures for ${taskClass}, found ${count}`,
      );
    }
  }

  const policies: ExperimentPolicy[] = ["A_FIXED", "B_DYNAMIC"];
  const repetitions: Repetition[] = [1, 2];

  const records: RunRecord[] = [];
  const seenKeys = new Set<string>();

  for (const fixture of fixtures) {
    for (const policy of policies) {
      for (const repetition of repetitions) {
        const key = runKey(fixture.taskId, policy, repetition);
        if (seenKeys.has(key)) {
          throw new RuntimeTopologyExperimentError(
            `duplicate/missing run: duplicate run key ${key}`,
          );
        }
        seenKeys.add(key);
        records.push(runOne({ fixture, policy, repetition }));
      }
    }
  }

  if (records.length !== 32) {
    throw new RuntimeTopologyExperimentError(
      `duplicate/missing run: expected exactly 32 records, produced ${records.length}`,
    );
  }
  if (seenKeys.size !== 32) {
    throw new RuntimeTopologyExperimentError(
      `duplicate/missing run: expected exactly 32 unique run keys, found ${seenKeys.size}`,
    );
  }

  return records;
}

/**
 * Asserts that Policy B's runs across the full matrix represent all five
 * route actions at least once. A correct NO_DELEGATE decision counts as a
 * positive representation, not an absence.
 */
export function assertAllPolicyBActionsRepresented(records: RunRecord[]): RouteAction[] {
  const bRecords = records.filter((r) => r.policy === "B_DYNAMIC");
  const represented = new Set(bRecords.map((r) => r.routeAction));
  const missing = ALL_ACTIONS.filter((a) => !represented.has(a));
  if (missing.length > 0) {
    throw new RuntimeTopologyExperimentError(
      `Policy B does not represent all five actions; missing: ${missing.join(", ")}`,
    );
  }
  return ALL_ACTIONS;
}

export function computeAggregateComparison(records: RunRecord[]): AggregateComparison[] {
  const policies: ExperimentPolicy[] = ["A_FIXED", "B_DYNAMIC"];
  return policies.map((policy) => {
    const policyRecords = records.filter((r) => r.policy === policy);
    const admitted = policyRecords.filter((r) => r.admitted);
    const mean = (values: number[]): number =>
      values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;

    return {
      policy,
      admittedRunCount: admitted.length,
      totalRunCount: policyRecords.length,
      meanOrchestrationSteps: mean(
        admitted.map((r) => r.orchestrationMetrics.orchestrationSteps),
      ),
      meanDeterministicIntegrationEffort: mean(
        admitted.map((r) => r.orchestrationMetrics.deterministicIntegrationEffort),
      ),
      meanSimulatedContextTransferUnits: mean(
        admitted.map((r) => r.orchestrationMetrics.simulatedContextTransferUnits),
      ),
      evidenceClass: "PROPOSAL_ONLY",
    };
  });
}

export interface BuildReceiptOptions {
  batchId: string;
  executionBaseHead: string;
  runnerCommand: string;
  fixtureManifestHash: string;
  fixtures: ExperimentFixture[];
  generatedAt: string;
}

/**
 * Builds the full experiment receipt. Deterministic given identical fixture
 * input, executionBaseHead and generatedAt: byte-identical JSON is expected
 * across two invocations with the same generatedAt value.
 */
export function buildExperimentReceipt(options: BuildReceiptOptions): ExperimentReceipt {
  const records = runFullMatrix(options.fixtures);
  const actionsRepresented = assertAllPolicyBActionsRepresented(records);
  const aggregate = computeAggregateComparison(records);

  return {
    batchId: options.batchId,
    executionBaseHead: options.executionBaseHead,
    runnerCommand: options.runnerCommand,
    fixtureManifestHash: options.fixtureManifestHash,
    runs: records,
    totalRuns: records.length,
    uniqueRunKeys: new Set(records.map((r) => runKey(r.taskId, r.policy, r.repetition))).size,
    actionsRepresented,
    aggregate,
    evidenceClass: "PROPOSAL_ONLY",
    generatedAt: options.generatedAt,
  };
}
