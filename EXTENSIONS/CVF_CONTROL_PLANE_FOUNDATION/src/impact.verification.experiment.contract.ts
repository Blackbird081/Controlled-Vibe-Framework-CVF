// ACEL-G6-T1 proposal-only, hermetic impact-derived verification experiment.
// This module is intentionally not exported by a production barrel and has no
// authority to alter autorun, hooks, CI, or mandatory verification gates.

export type VerificationPolicy = "FIXED_BUNDLE" | "IMPACT_DERIVED";

export type ImpactClass =
  | "DOCUMENTATION"
  | "TYPESCRIPT_SOURCE"
  | "TYPESCRIPT_TEST"
  | "GOVERNANCE_CHECKER"
  | "SESSION_CONTINUITY"
  | "PROVIDER_CONTRACT"
  | "PUBLIC_WORKFLOW"
  | "UNKNOWN";

export type VerifierId =
  | "baseline-safety"
  | "docs-governance"
  | "typescript-typecheck"
  | "focused-tests"
  | "checker-tests"
  | "active-session"
  | "provider-contract"
  | "public-workflow";

export interface SeededRegression {
  readonly id: string;
  readonly detectedBy: readonly VerifierId[];
}

export interface VerificationCase {
  readonly caseId: string;
  readonly changedPaths: readonly string[];
  readonly impactClasses: readonly ImpactClass[];
  readonly seededRegressions: readonly SeededRegression[];
  readonly authority: "LOCAL_HERMETIC_EXPERIMENT_ONLY";
}

export interface VerificationRunRecord {
  readonly runKey: string;
  readonly caseId: string;
  readonly policy: VerificationPolicy;
  readonly repetition: 1 | 2;
  readonly selectedVerifiers: readonly VerifierId[];
  readonly detectedRegressionIds: readonly string[];
  readonly missedRegressionIds: readonly string[];
  readonly deterministicCostUnits: number;
  readonly deterministicLatencyUnits: number;
  readonly fallbackReason: "UNKNOWN_IMPACT_FAIL_CLOSED" | null;
  readonly authorityPreserved: boolean;
  readonly admitted: boolean;
}

export interface VerificationExperimentReceipt {
  readonly schemaVersion: "cvf.acelG6ImpactVerificationExperiment.v1";
  readonly batchId: "ACEL-G6-T1-IMPACT-DERIVED-VERIFICATION-EXPERIMENT";
  readonly evidenceClass: "PROPOSAL_ONLY_HERMETIC";
  readonly generatedAt: "2026-09-16T00:00:00.000Z";
  readonly totalRuns: number;
  readonly uniqueRunKeys: number;
  readonly records: readonly VerificationRunRecord[];
  readonly aggregate: readonly {
    policy: VerificationPolicy;
    runCount: number;
    admittedRunCount: number;
    detectedRegressionCount: number;
    missedRegressionCount: number;
    totalCostUnits: number;
    totalLatencyUnits: number;
  }[];
  readonly claimBoundary: string;
}

export const FIXED_VERIFIER_BUNDLE: readonly VerifierId[] = Object.freeze([
  "baseline-safety",
  "docs-governance",
  "typescript-typecheck",
  "focused-tests",
  "checker-tests",
  "active-session",
  "provider-contract",
  "public-workflow",
]);

const VERIFIER_COST: Readonly<Record<VerifierId, number>> = Object.freeze({
  "baseline-safety": 1,
  "docs-governance": 2,
  "typescript-typecheck": 4,
  "focused-tests": 5,
  "checker-tests": 6,
  "active-session": 3,
  "provider-contract": 5,
  "public-workflow": 4,
});

const IMPACT_TO_VERIFIERS: Readonly<Record<ImpactClass, readonly VerifierId[]>> = Object.freeze({
  DOCUMENTATION: ["docs-governance"],
  TYPESCRIPT_SOURCE: ["typescript-typecheck", "focused-tests"],
  TYPESCRIPT_TEST: ["focused-tests"],
  GOVERNANCE_CHECKER: ["docs-governance", "checker-tests"],
  SESSION_CONTINUITY: ["active-session"],
  PROVIDER_CONTRACT: ["typescript-typecheck", "focused-tests", "provider-contract"],
  PUBLIC_WORKFLOW: ["docs-governance", "public-workflow"],
  UNKNOWN: FIXED_VERIFIER_BUNDLE,
});

export const VERIFICATION_EXPERIMENT_CASES: readonly VerificationCase[] = Object.freeze([
  makeCase("docs-baseline", ["docs/baselines/example.md"], ["DOCUMENTATION"], "missing-required-section", ["docs-governance"]),
  makeCase("ts-contract", ["EXTENSIONS/pkg/src/contract.ts"], ["TYPESCRIPT_SOURCE"], "type-contract-break", ["typescript-typecheck"]),
  makeCase("ts-test", ["EXTENSIONS/pkg/tests/contract.test.ts"], ["TYPESCRIPT_TEST"], "behavior-regression", ["focused-tests"]),
  makeCase("checker-source", ["governance/compat/check_example.py"], ["GOVERNANCE_CHECKER"], "checker-rule-regression", ["checker-tests"]),
  makeCase("checker-test", ["governance/compat/test_check_example.py"], ["GOVERNANCE_CHECKER"], "checker-fixture-regression", ["checker-tests"]),
  makeCase("session-state", ["CVF_SESSION/state/entries/example.json"], ["SESSION_CONTINUITY"], "continuity-drift", ["active-session"]),
  makeCase("provider-adapter", ["EXTENSIONS/CVF_MODEL_GATEWAY/src/adapter.ts"], ["PROVIDER_CONTRACT"], "provider-contract-regression", ["provider-contract"]),
  makeCase("unknown-owner", ["experimental/unknown.asset"], ["UNKNOWN"], "unknown-impact-regression", ["public-workflow"]),
]);

function makeCase(
  caseId: string,
  changedPaths: readonly string[],
  impactClasses: readonly ImpactClass[],
  regressionId: string,
  detectedBy: readonly VerifierId[],
): VerificationCase {
  return Object.freeze({
    caseId,
    changedPaths: Object.freeze([...changedPaths]),
    impactClasses: Object.freeze([...impactClasses]),
    seededRegressions: Object.freeze([Object.freeze({ id: regressionId, detectedBy: Object.freeze([...detectedBy]) })]),
    authority: "LOCAL_HERMETIC_EXPERIMENT_ONLY" as const,
  });
}

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze(Array.from(new Set(values)).sort());
}

export function selectVerifiers(
  item: VerificationCase,
  policy: VerificationPolicy,
): { selected: readonly VerifierId[]; fallbackReason: VerificationRunRecord["fallbackReason"] } {
  if (policy === "FIXED_BUNDLE") {
    return { selected: FIXED_VERIFIER_BUNDLE, fallbackReason: null };
  }
  if (item.impactClasses.length === 0 || item.impactClasses.includes("UNKNOWN")) {
    return { selected: FIXED_VERIFIER_BUNDLE, fallbackReason: "UNKNOWN_IMPACT_FAIL_CLOSED" };
  }
  const selected = uniqueSorted<VerifierId>([
    "baseline-safety",
    ...item.impactClasses.flatMap((impact) => IMPACT_TO_VERIFIERS[impact]),
  ]);
  return { selected, fallbackReason: null };
}

export function executeVerificationRun(
  item: VerificationCase,
  policy: VerificationPolicy,
  repetition: 1 | 2,
): VerificationRunRecord {
  const { selected, fallbackReason } = selectVerifiers(item, policy);
  const detectedRegressionIds: string[] = [];
  const missedRegressionIds: string[] = [];
  for (const regression of item.seededRegressions) {
    const detected = regression.detectedBy.some((verifier) => selected.includes(verifier));
    (detected ? detectedRegressionIds : missedRegressionIds).push(regression.id);
  }
  const deterministicCostUnits = selected.reduce((sum, verifier) => sum + VERIFIER_COST[verifier], 0);
  const authorityPreserved = item.authority === "LOCAL_HERMETIC_EXPERIMENT_ONLY";
  const admitted = authorityPreserved && missedRegressionIds.length === 0;
  return Object.freeze({
    runKey: `${item.caseId}:${policy}:${repetition}`,
    caseId: item.caseId,
    policy,
    repetition,
    selectedVerifiers: selected,
    detectedRegressionIds: uniqueSorted(detectedRegressionIds),
    missedRegressionIds: uniqueSorted(missedRegressionIds),
    deterministicCostUnits,
    deterministicLatencyUnits: deterministicCostUnits * 2 + selected.length,
    fallbackReason,
    authorityPreserved,
    admitted,
  });
}

export function buildVerificationExperimentReceipt(
  cases: readonly VerificationCase[] = VERIFICATION_EXPERIMENT_CASES,
): VerificationExperimentReceipt {
  const records: VerificationRunRecord[] = [];
  for (const item of cases) {
    for (const policy of ["FIXED_BUNDLE", "IMPACT_DERIVED"] as const) {
      for (const repetition of [1, 2] as const) records.push(executeVerificationRun(item, policy, repetition));
    }
  }
  const keys = new Set(records.map((record) => record.runKey));
  const aggregate = (["FIXED_BUNDLE", "IMPACT_DERIVED"] as const).map((policy) => {
    const rows = records.filter((record) => record.policy === policy);
    return Object.freeze({
      policy,
      runCount: rows.length,
      admittedRunCount: rows.filter((record) => record.admitted).length,
      detectedRegressionCount: rows.reduce((sum, record) => sum + record.detectedRegressionIds.length, 0),
      missedRegressionCount: rows.reduce((sum, record) => sum + record.missedRegressionIds.length, 0),
      totalCostUnits: rows.reduce((sum, record) => sum + record.deterministicCostUnits, 0),
      totalLatencyUnits: rows.reduce((sum, record) => sum + record.deterministicLatencyUnits, 0),
    });
  });
  if (records.length !== 32 || keys.size !== 32 || records.some((record) => !record.admitted)) {
    throw new Error("verification experiment failed closed: incomplete, duplicate, or unadmitted record");
  }
  return Object.freeze({
    schemaVersion: "cvf.acelG6ImpactVerificationExperiment.v1",
    batchId: "ACEL-G6-T1-IMPACT-DERIVED-VERIFICATION-EXPERIMENT",
    evidenceClass: "PROPOSAL_ONLY_HERMETIC",
    generatedAt: "2026-09-16T00:00:00.000Z",
    totalRuns: records.length,
    uniqueRunKeys: keys.size,
    records: Object.freeze(records),
    aggregate: Object.freeze(aggregate),
    claimBoundary: "Hermetic proposal-only comparison; no production verifier selection, gate reduction, provider, runtime, public, or deployment authority.",
  });
}
