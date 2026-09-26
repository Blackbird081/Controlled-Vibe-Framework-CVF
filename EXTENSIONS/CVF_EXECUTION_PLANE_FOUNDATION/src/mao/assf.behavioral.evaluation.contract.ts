// CVF ACEL G3-T2-R1 - ASSF Behavioral Evaluation Contract (offline, pure)
//
// Implements the normative contract at
// docs/reference/agent_system_skills/CVF_ASSF_BEHAVIORAL_EVALUATION_CONTRACT.md,
// per
// docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_G3_T2_BEHAVIORAL_EVALUATION_CONTRACT_IMPLEMENTATION_2026-09-16.md,
// docs/baselines/CVF_GC018_ACEL_G3_T2_BEHAVIORAL_EVALUATION_CONTRACT_IMPLEMENTATION_2026-09-16.md,
// and the consolidated R1 rework work order
// (ACEL-G3-T2-R1-CONSOLIDATED-SEMANTIC-REWORK).
//
// This module performs no network call, no credential read, no provider
// invocation, and no file I/O. It operates only on already-constructed
// fixture and trace objects passed to it in memory. Every exported function
// is pure and total: given structurally identical inputs it always returns
// an identical, frozen result, and no runtime input -- however malformed,
// missing, empty, unknown, or internally inconsistent -- can throw an
// uncaught exception or bypass validation through truthiness coercion.

// --- Capture mode (R1-01: exact work-order vocabulary; LIVE is unauthorized) ---

export type BehavioralCaptureMode =
  | "OFFLINE_SYNTHETIC"
  | "MOCK_REPLAY"
  | "LIVE_REFERENCE_ONLY";

const VALID_CAPTURE_MODES: readonly BehavioralCaptureMode[] = [
  "OFFLINE_SYNTHETIC",
  "MOCK_REPLAY",
  "LIVE_REFERENCE_ONLY",
];

// None of these three modes may ever be cited as proof of a real live
// provider execution in this offline tranche: OFFLINE_SYNTHETIC is
// synthetic by construction, MOCK_REPLAY is explicitly a replay, and
// LIVE_REFERENCE_ONLY is a reference recording, not a live grading claim.

// --- Fixture ---

export type BehavioralFixtureClass = "POSITIVE" | "NEGATIVE";
export type BehavioralRepeatPolicy = "DETERMINISTIC" | "STOCHASTIC";
export type BehavioralBaselineRole = "WITH" | "WITHOUT" | "NONE";
export type BehavioralCandidateSpaceMode = "COMPLETE" | "INCOMPLETE_WITH_ESCAPE";

const VALID_FIXTURE_CLASSES: readonly BehavioralFixtureClass[] = ["POSITIVE", "NEGATIVE"];
const VALID_REPEAT_POLICIES: readonly BehavioralRepeatPolicy[] = ["DETERMINISTIC", "STOCHASTIC"];
const VALID_BASELINE_ROLES: readonly BehavioralBaselineRole[] = ["WITH", "WITHOUT", "NONE"];
const VALID_CANDIDATE_SPACE_MODES: readonly BehavioralCandidateSpaceMode[] = [
  "COMPLETE",
  "INCOMPLETE_WITH_ESCAPE",
];

export interface BehavioralAllowedTransition {
  readonly from: string;
  readonly action: string;
  readonly to: string;
}

export interface BehavioralOutcomeAssertion {
  readonly field: string;
  readonly expectedValue: unknown;
}

export interface BehavioralFixture {
  readonly fixtureId: string;
  readonly fixtureClass: BehavioralFixtureClass;
  readonly repeatPolicy: BehavioralRepeatPolicy;
  readonly baselineRole: BehavioralBaselineRole;
  readonly canonicalInputBytes: string;
  readonly sourceContentHash: string;
  readonly fixtureContentHash: string;
  readonly decisionContextHash: string;
  readonly candidateSpaceMode: BehavioralCandidateSpaceMode;
  readonly noMatchOutcome: string | null;
  readonly judgmentAuthority: "EVIDENCE_ONLY";
  readonly allowedTransitions: readonly BehavioralAllowedTransition[];
  readonly requiredEvents: readonly string[];
  readonly requiredOutputObservations: readonly string[];
  readonly outcomeAssertions: readonly BehavioralOutcomeAssertion[];
  readonly evaluationClockIso: string;
}

// --- Trace ---

export interface BehavioralTraceEvent {
  readonly from: string;
  readonly action: string;
  readonly to: string;
}

export interface BehavioralTrace {
  readonly traceId: string;
  readonly fixtureId: string;
  readonly captureMode: BehavioralCaptureMode;
  readonly sourceContentHash: string;
  readonly decisionContextHash: string;
  readonly provenanceSourceCommit: string | null;
  readonly provenanceExpiry: string | null;
  readonly events: readonly BehavioralTraceEvent[];
  readonly outputObservations: readonly string[];
  readonly outcomeValues: Readonly<Record<string, unknown>>;
  readonly selfReportedPass: boolean | null;
}

// --- Result / defect vocabulary ---

export type BehavioralResult =
  | "PASS_WITH_EVIDENCE"
  | "FAIL_WITH_DEFECTS"
  | "INCOMPLETE_TRACE"
  | "UNDECLARED_TOOL_USE"
  | "STALE_REPLAY_PROVENANCE"
  | "NONEQUIVALENT_BASELINE_PAIR"
  | "INSUFFICIENT_REPEAT_EVIDENCE";

export type BehavioralDefectClass =
  | "INCOMPLETE_TRACE"
  | "UNDECLARED_TOOL_USE"
  | "STALE_REPLAY_PROVENANCE"
  | "NONEQUIVALENT_BASELINE_PAIR"
  | "INSUFFICIENT_REPEAT_EVIDENCE"
  | "SOURCE_HASH_MISMATCH"
  | "DECISION_CONTEXT_MISMATCH"
  | "OUTCOME_ASSERTION_MISMATCH"
  | "MALFORMED_INPUT";

export interface BehavioralDefect {
  readonly defectClass: BehavioralDefectClass;
  readonly detail: string;
}

export interface BehavioralEvaluation {
  readonly result: BehavioralResult;
  readonly defects: readonly BehavioralDefect[];
  readonly repeatsObserved: number;
  readonly repeatsRequired: number;
  readonly fixtureId: string;
  readonly sourceContentHash: string;
  readonly claimBoundary: string;
}

const CLAIM_BOUNDARY =
  "pure offline grading of a supplied fixture/trace pair; never certifies, " +
  "never executes a real skill/provider/agent, and never trusts a " +
  "self-reported pass field; OFFLINE_SYNTHETIC, MOCK_REPLAY and " +
  "LIVE_REFERENCE_ONLY capture modes are never live provider proof";

// --- Structural validation helpers (R1-02: fail closed, never throw) ---

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// SHA-256 is the hash algorithm this contract requires (per
// `sourceContentHash`/`fixtureContentHash` usage throughout the paired
// baseline). A canonical hash is exactly 64 lowercase hex characters.
const HASH_PATTERN = /^[0-9a-f]{64}$/;

function isCanonicalHash(value: unknown): value is string {
  return typeof value === "string" && HASH_PATTERN.test(value);
}

// Strict ISO-8601 date-time validation (R1-02: `Date.parse` alone is not
// strict, since it accepts many non-ISO-8601 formats such as "January 1,
// 2026" or partial/ambiguous strings). This pattern requires a full
// calendar date, a literal "T" separator, a full time-of-day with seconds,
// an optional fractional-seconds component, and an explicit UTC "Z" or a
// numeric "+HH:MM"/"-HH:MM" offset. After the pattern matches, the value is
// re-validated by round-tripping through `Date` and confirming the parsed
// instant, when reformatted, reproduces the same UTC calendar fields
// (rejecting calendar-invalid values such as 2026-02-30 that some `Date`
// implementations silently roll forward).
const ISO_8601_STRICT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

function parseIsoDateStrict(value: unknown): number | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const match = ISO_8601_STRICT_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);

  if (year < 1 || month < 1 || month > 12) return null;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day < 1 || day > daysInMonth[month - 1]) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;

  const epochMillis = Date.parse(value);
  if (Number.isNaN(epochMillis)) return null;

  return epochMillis;
}

// Explicit ASCII field separator for transition-triple identity. A literal
// control character is deliberately never used here (R1-05): using a
// visible printable delimiter that cannot appear inside a well-formed
// `from`/`action`/`to` token keeps the source and any generated fixtures
// safe for ordinary text tooling (e.g. `rg`) while remaining collision-safe
// via the length-prefixed encoding below.
function transitionKey(event: { from: string; action: string; to: string }): string {
  const encode = (segment: string): string => `${segment.length}:${segment}`;
  return `${encode(event.from)}|${encode(event.action)}|${encode(event.to)}`;
}

function isValidTransition(value: unknown): value is BehavioralAllowedTransition {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.from) &&
    isNonEmptyString(value.action) &&
    isNonEmptyString(value.to)
  );
}

function isValidTraceEvent(value: unknown): value is BehavioralTraceEvent {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.from) &&
    isNonEmptyString(value.action) &&
    isNonEmptyString(value.to)
  );
}

function isValidOutcomeAssertion(value: unknown): value is BehavioralOutcomeAssertion {
  return isPlainObject(value) && isNonEmptyString(value.field) && "expectedValue" in value;
}

/**
 * Structurally validates a candidate fixture object without repairing or
 * coercing any malformed field. Returns the empty array only when every
 * required field is present, correctly typed, and internally consistent.
 * Never throws: every field access is guarded.
 */
function validateFixtureStructure(fixture: unknown): string[] {
  const problems: string[] = [];
  if (!isPlainObject(fixture)) {
    return ["fixture must be an object"];
  }

  if (!isNonEmptyString(fixture.fixtureId)) {
    problems.push("fixtureId must be a non-empty string");
  }
  if (
    typeof fixture.fixtureClass !== "string" ||
    !VALID_FIXTURE_CLASSES.includes(fixture.fixtureClass as BehavioralFixtureClass)
  ) {
    problems.push(`fixtureClass must be one of ${VALID_FIXTURE_CLASSES.join(", ")}`);
  }
  if (
    typeof fixture.repeatPolicy !== "string" ||
    !VALID_REPEAT_POLICIES.includes(fixture.repeatPolicy as BehavioralRepeatPolicy)
  ) {
    problems.push(`repeatPolicy must be one of ${VALID_REPEAT_POLICIES.join(", ")}`);
  }
  if (
    typeof fixture.baselineRole !== "string" ||
    !VALID_BASELINE_ROLES.includes(fixture.baselineRole as BehavioralBaselineRole)
  ) {
    problems.push(`baselineRole must be one of ${VALID_BASELINE_ROLES.join(", ")}`);
  }
  if (typeof fixture.canonicalInputBytes !== "string") {
    problems.push("canonicalInputBytes must be a string");
  }
  if (!isCanonicalHash(fixture.sourceContentHash)) {
    problems.push("sourceContentHash must be a 64-character lowercase hex SHA-256 hash");
  }
  if (!isCanonicalHash(fixture.fixtureContentHash)) {
    problems.push("fixtureContentHash must be a 64-character lowercase hex SHA-256 hash");
  }
  if (!isCanonicalHash(fixture.decisionContextHash)) {
    problems.push("decisionContextHash must be a 64-character lowercase hex SHA-256 hash");
  }
  if (
    typeof fixture.candidateSpaceMode !== "string" ||
    !VALID_CANDIDATE_SPACE_MODES.includes(
      fixture.candidateSpaceMode as BehavioralCandidateSpaceMode,
    )
  ) {
    problems.push(
      `candidateSpaceMode must be one of ${VALID_CANDIDATE_SPACE_MODES.join(", ")}`,
    );
  } else if (
    fixture.candidateSpaceMode === "COMPLETE" &&
    fixture.noMatchOutcome !== null
  ) {
    problems.push("COMPLETE candidateSpaceMode requires noMatchOutcome to be null");
  } else if (
    fixture.candidateSpaceMode === "INCOMPLETE_WITH_ESCAPE" &&
    !isNonEmptyString(fixture.noMatchOutcome)
  ) {
    problems.push(
      "INCOMPLETE_WITH_ESCAPE candidateSpaceMode requires a non-empty noMatchOutcome",
    );
  }
  if (fixture.judgmentAuthority !== "EVIDENCE_ONLY") {
    problems.push("judgmentAuthority must be EVIDENCE_ONLY");
  }
  if (
    !Array.isArray(fixture.allowedTransitions) ||
    !fixture.allowedTransitions.every(isValidTransition)
  ) {
    problems.push("allowedTransitions must be an array of {from, action, to} string triples");
  }
  if (!isStringArray(fixture.requiredEvents)) {
    problems.push("requiredEvents must be an array of strings");
  }
  if (!isStringArray(fixture.requiredOutputObservations)) {
    problems.push("requiredOutputObservations must be an array of strings");
  }
  if (
    !Array.isArray(fixture.outcomeAssertions) ||
    !fixture.outcomeAssertions.every(isValidOutcomeAssertion)
  ) {
    problems.push("outcomeAssertions must be an array of {field, expectedValue} entries");
  }
  if (parseIsoDateStrict(fixture.evaluationClockIso) === null) {
    problems.push("evaluationClockIso must be a strict ISO-8601 date-time");
  }

  return problems;
}

/**
 * Structurally validates a candidate trace object against its fixture id
 * without repairing or coercing any malformed field. Never throws.
 */
function validateTraceStructure(trace: unknown, fixtureId: string): string[] {
  const problems: string[] = [];
  if (!isPlainObject(trace)) {
    return ["trace must be an object"];
  }

  if (!isNonEmptyString(trace.traceId)) {
    problems.push("traceId must be a non-empty string");
  }
  if (!isNonEmptyString(trace.fixtureId)) {
    problems.push("fixtureId must be a non-empty string");
  } else if (trace.fixtureId !== fixtureId) {
    problems.push(
      `trace.fixtureId (${JSON.stringify(trace.fixtureId)}) does not match fixture.fixtureId (${JSON.stringify(fixtureId)})`,
    );
  }
  if (
    typeof trace.captureMode !== "string" ||
    !VALID_CAPTURE_MODES.includes(trace.captureMode as BehavioralCaptureMode)
  ) {
    problems.push(`captureMode must be one of ${VALID_CAPTURE_MODES.join(", ")}`);
  }
  if (!isCanonicalHash(trace.sourceContentHash)) {
    problems.push("trace.sourceContentHash must be a 64-character lowercase hex SHA-256 hash");
  }
  if (!isCanonicalHash(trace.decisionContextHash)) {
    problems.push("trace.decisionContextHash must be a 64-character lowercase hex SHA-256 hash");
  }
  if (
    trace.provenanceSourceCommit !== null &&
    typeof trace.provenanceSourceCommit !== "string"
  ) {
    problems.push("provenanceSourceCommit must be a string or null");
  }
  if (trace.provenanceExpiry !== null && typeof trace.provenanceExpiry !== "string") {
    problems.push("provenanceExpiry must be a string or null");
  }
  if (!Array.isArray(trace.events) || !trace.events.every(isValidTraceEvent)) {
    problems.push("events must be an array of {from, action, to} string triples");
  }
  if (!isStringArray(trace.outputObservations)) {
    problems.push("outputObservations must be an array of strings");
  }
  if (!isPlainObject(trace.outcomeValues)) {
    problems.push("outcomeValues must be an object");
  }
  if (trace.selfReportedPass !== null && typeof trace.selfReportedPass !== "boolean") {
    problems.push("selfReportedPass must be a boolean or null");
  }

  return problems;
}

/**
 * Validates one trace against its fixture for structural completeness,
 * declared-transition compliance, outcome assertions, source-hash
 * consistency, and replay provenance/expiry. Assumes both `fixture` and
 * `trace` already passed `validateFixtureStructure`/`validateTraceStructure`
 * (a caller-level structural defect is reported separately and this
 * function is never reached in that case). Never throws.
 */
function evaluateSingleTrace(
  fixture: BehavioralFixture,
  trace: BehavioralTrace,
): BehavioralDefect[] {
  const defects: BehavioralDefect[] = [];

  const missingEvents = fixture.requiredEvents.filter(
    (required) => !trace.events.some((event) => transitionKey(event) === required),
  );
  const missingOutputs = fixture.requiredOutputObservations.filter(
    (required) => !trace.outputObservations.includes(required),
  );
  if (missingEvents.length > 0 || missingOutputs.length > 0) {
    const parts: string[] = [];
    if (missingEvents.length > 0) {
      parts.push(`missing required event(s): ${missingEvents.join(", ")}`);
    }
    if (missingOutputs.length > 0) {
      parts.push(`missing required output observation(s): ${missingOutputs.join(", ")}`);
    }
    defects.push({ defectClass: "INCOMPLETE_TRACE", detail: parts.join("; ") });
  }

  const allowedKeys = new Set(fixture.allowedTransitions.map(transitionKey));
  const undeclared = trace.events.filter((event) => !allowedKeys.has(transitionKey(event)));
  if (undeclared.length > 0) {
    const detail = undeclared
      .map((event) => `${event.from} -${event.action}-> ${event.to}`)
      .join("; ");
    defects.push({
      defectClass: "UNDECLARED_TOOL_USE",
      detail: `trace used transition(s) outside the fixture's allowed-transition table: ${detail}`,
    });
  }

  if (trace.sourceContentHash !== fixture.sourceContentHash) {
    defects.push({
      defectClass: "SOURCE_HASH_MISMATCH",
      detail: `trace.sourceContentHash (${trace.sourceContentHash}) does not match fixture.sourceContentHash (${fixture.sourceContentHash}); prior evidence is invalidated`,
    });
  }

  if (trace.decisionContextHash !== fixture.decisionContextHash) {
    defects.push({
      defectClass: "DECISION_CONTEXT_MISMATCH",
      detail: `trace.decisionContextHash (${trace.decisionContextHash}) does not match fixture.decisionContextHash (${fixture.decisionContextHash}); judgment evidence must not be applied to different state`,
    });
  }

  const outcomeMismatches = fixture.outcomeAssertions.filter(
    (assertion) =>
      JSON.stringify(trace.outcomeValues[assertion.field]) !==
      JSON.stringify(assertion.expectedValue),
  );
  if (outcomeMismatches.length > 0) {
    const detail = outcomeMismatches
      .map((assertion) => `${assertion.field} expected ${JSON.stringify(assertion.expectedValue)}`)
      .join("; ");
    defects.push({ defectClass: "OUTCOME_ASSERTION_MISMATCH", detail });
  }

  if (trace.captureMode === "MOCK_REPLAY") {
    const expiry = parseIsoDateStrict(trace.provenanceExpiry);
    const clock = parseIsoDateStrict(fixture.evaluationClockIso);
    if (!isNonEmptyString(trace.provenanceSourceCommit) || expiry === null || clock === null) {
      defects.push({
        defectClass: "STALE_REPLAY_PROVENANCE",
        detail:
          "mock/replay trace is missing provenanceSourceCommit or has a missing/malformed provenanceExpiry or evaluationClockIso",
      });
    } else if (expiry <= clock) {
      defects.push({
        defectClass: "STALE_REPLAY_PROVENANCE",
        detail: `mock/replay provenanceExpiry (${trace.provenanceExpiry}) is not strictly after evaluationClockIso (${fixture.evaluationClockIso})`,
      });
    }
  }

  return defects;
}

/**
 * Grades a fixture against one or more repeat traces. Pure function: never
 * mutates `fixture` or `traces`, never performs I/O, and never reads a
 * trace's `selfReportedPass` field to decide the result (rule 8). Baseline
 * equivalence (rule 5) is checked only when `pairedFixture` is supplied for
 * a WITH/WITHOUT fixture pair. Accepts `unknown`-typed runtime input for
 * `fixture` and `traces` (R1-02): any structurally malformed, missing,
 * empty, unknown, or internally inconsistent value fails closed to
 * `FAIL_WITH_DEFECTS` (or a more specific named result) and never throws.
 */
export function gradeBehavioralEvaluation(
  fixture: unknown,
  traces: unknown,
  pairedFixture?: unknown,
): BehavioralEvaluation {
  const fixtureProblems = validateFixtureStructure(fixture);
  if (fixtureProblems.length > 0) {
    return Object.freeze({
      result: "FAIL_WITH_DEFECTS",
      defects: Object.freeze([
        { defectClass: "MALFORMED_INPUT" as const, detail: `malformed fixture: ${fixtureProblems.join("; ")}` },
      ]),
      repeatsObserved: 0,
      repeatsRequired: 1,
      fixtureId: isPlainObject(fixture) && isNonEmptyString(fixture.fixtureId) ? fixture.fixtureId : "",
      sourceContentHash:
        isPlainObject(fixture) && isCanonicalHash(fixture.sourceContentHash)
          ? fixture.sourceContentHash
          : "",
      claimBoundary: CLAIM_BOUNDARY,
    });
  }

  const typedFixture = fixture as BehavioralFixture;
  const base = {
    fixtureId: typedFixture.fixtureId,
    sourceContentHash: typedFixture.sourceContentHash,
    claimBoundary: CLAIM_BOUNDARY,
  };
  const repeatsRequired = typedFixture.repeatPolicy === "STOCHASTIC" ? 3 : 1;

  if (!Array.isArray(traces)) {
    return Object.freeze({
      ...base,
      result: "FAIL_WITH_DEFECTS",
      defects: Object.freeze([
        { defectClass: "MALFORMED_INPUT" as const, detail: "traces must be an array" },
      ]),
      repeatsObserved: 0,
      repeatsRequired,
    });
  }

  if (traces.length === 0) {
    return Object.freeze({
      ...base,
      result: "INCOMPLETE_TRACE",
      defects: Object.freeze([
        { defectClass: "INCOMPLETE_TRACE" as const, detail: "no trace was supplied for this fixture" },
      ]),
      repeatsObserved: 0,
      repeatsRequired,
    });
  }

  const traceStructureProblems = traces.map((trace) =>
    validateTraceStructure(trace, typedFixture.fixtureId),
  );
  const firstStructuralFailureIndex = traceStructureProblems.findIndex((problems) => problems.length > 0);
  if (firstStructuralFailureIndex !== -1) {
    return Object.freeze({
      ...base,
      result: "FAIL_WITH_DEFECTS",
      defects: Object.freeze([
        {
          defectClass: "MALFORMED_INPUT" as const,
          detail: `malformed trace at index ${firstStructuralFailureIndex}: ${traceStructureProblems[firstStructuralFailureIndex].join("; ")}`,
        },
      ]),
      repeatsObserved: 0,
      repeatsRequired,
    });
  }

  const typedTraces = traces as BehavioralTrace[];

  let typedPairedFixture: BehavioralFixture | undefined;
  if (pairedFixture !== undefined) {
    const pairedProblems = validateFixtureStructure(pairedFixture);
    if (pairedProblems.length > 0) {
      return Object.freeze({
        ...base,
        result: "FAIL_WITH_DEFECTS",
        defects: Object.freeze([
          {
            defectClass: "MALFORMED_INPUT" as const,
            detail: `malformed paired fixture: ${pairedProblems.join("; ")}`,
          },
        ]),
        repeatsObserved: 0,
        repeatsRequired,
      });
    }
    typedPairedFixture = pairedFixture as BehavioralFixture;
  }

  // Pair admission is part of the grading path, not merely an optional
  // helper. This prevents callers from bypassing the WITH/WITHOUT rule by
  // invoking the grader without first invoking `admitBaselinePair`.
  const pairAdmission = admitBaselinePair(typedFixture, typedPairedFixture);
  if (
    pairAdmission.admission !== "ADMITTED_PAIR" &&
    pairAdmission.admission !== "ADMITTED_NO_PAIR_REQUIRED"
  ) {
    return Object.freeze({
      ...base,
      result: "NONEQUIVALENT_BASELINE_PAIR",
      defects: Object.freeze([
        {
          defectClass: "NONEQUIVALENT_BASELINE_PAIR" as const,
          detail: `baseline pair admission failed: ${pairAdmission.admission}`,
        },
      ]),
      repeatsObserved: 0,
      repeatsRequired,
    });
  }

  const perTraceDefects = typedTraces.map((trace) => evaluateSingleTrace(typedFixture, trace));
  const passingRun = (defects: BehavioralDefect[]): boolean => defects.length === 0;

  let consecutivePasses = 0;
  for (const defects of perTraceDefects) {
    if (passingRun(defects)) {
      consecutivePasses += 1;
    } else {
      break;
    }
  }

  const allDefects: BehavioralDefect[] = [];
  for (const defects of perTraceDefects) {
    for (const defect of defects) {
      if (
        !allDefects.some(
          (existing) => existing.defectClass === defect.defectClass && existing.detail === defect.detail,
        )
      ) {
        allDefects.push(defect);
      }
    }
  }

  if (allDefects.length > 0) {
    const priority: BehavioralDefectClass[] = [
      "UNDECLARED_TOOL_USE",
      "STALE_REPLAY_PROVENANCE",
      "NONEQUIVALENT_BASELINE_PAIR",
      "INCOMPLETE_TRACE",
      "SOURCE_HASH_MISMATCH",
      "DECISION_CONTEXT_MISMATCH",
      "OUTCOME_ASSERTION_MISMATCH",
      "MALFORMED_INPUT",
    ];
    const leading = priority.find((cls) => allDefects.some((d) => d.defectClass === cls));
    const result: BehavioralResult =
      leading === "UNDECLARED_TOOL_USE"
        ? "UNDECLARED_TOOL_USE"
        : leading === "STALE_REPLAY_PROVENANCE"
          ? "STALE_REPLAY_PROVENANCE"
          : leading === "NONEQUIVALENT_BASELINE_PAIR"
            ? "NONEQUIVALENT_BASELINE_PAIR"
            : leading === "INCOMPLETE_TRACE"
              ? "INCOMPLETE_TRACE"
              : "FAIL_WITH_DEFECTS";

    return Object.freeze({
      ...base,
      result,
      defects: Object.freeze(allDefects),
      repeatsObserved: consecutivePasses,
      repeatsRequired,
    });
  }

  if (consecutivePasses !== repeatsRequired) {
    return Object.freeze({
      ...base,
      result: "INSUFFICIENT_REPEAT_EVIDENCE",
      defects: Object.freeze([
        {
          defectClass: "INSUFFICIENT_REPEAT_EVIDENCE" as const,
          detail: `${consecutivePasses} consecutive passing repeat(s) observed; exactly ${repeatsRequired} required for repeatPolicy ${typedFixture.repeatPolicy}`,
        },
      ]),
      repeatsObserved: consecutivePasses,
      repeatsRequired,
    });
  }

  return Object.freeze({
    ...base,
    result: "PASS_WITH_EVIDENCE",
    defects: Object.freeze([]),
    repeatsObserved: consecutivePasses,
    repeatsRequired,
  });
}

/**
 * Produces one deterministic trace-shaped record from a caller-supplied
 * observation set. This is the "runner" half of the runner/grader
 * separation (rule 8): it never grades, never inspects a fixture's
 * assertions, and never sets its own pass/fail verdict beyond echoing back
 * whatever `selfReportedPass` the caller supplied (which the grader then
 * ignores). No network, credential, or provider access occurs here.
 */
export function produceBehavioralTrace(input: {
  readonly traceId: string;
  readonly fixtureId: string;
  readonly captureMode: BehavioralCaptureMode;
  readonly sourceContentHash: string;
  readonly decisionContextHash: string;
  readonly provenanceSourceCommit?: string | null;
  readonly provenanceExpiry?: string | null;
  readonly events: readonly BehavioralTraceEvent[];
  readonly outputObservations: readonly string[];
  readonly outcomeValues: Readonly<Record<string, unknown>>;
  readonly selfReportedPass?: boolean | null;
}): BehavioralTrace {
  return Object.freeze({
    traceId: input.traceId,
    fixtureId: input.fixtureId,
    captureMode: input.captureMode,
    sourceContentHash: input.sourceContentHash,
    decisionContextHash: input.decisionContextHash,
    provenanceSourceCommit: input.provenanceSourceCommit ?? null,
    provenanceExpiry: input.provenanceExpiry ?? null,
    events: Object.freeze([...input.events]),
    outputObservations: Object.freeze([...input.outputObservations]),
    outcomeValues: Object.freeze({ ...input.outcomeValues }),
    selfReportedPass: input.selfReportedPass ?? null,
  });
}

// --- Fixture-set admission (R1-03: positive-plus-negative rule) ---

export type FixtureSetAdmissionResult =
  | "ADMITTED"
  | "MISSING_POSITIVE_CASE"
  | "MISSING_NEGATIVE_CASE"
  | "MALFORMED_FIXTURE_SET";

export interface FixtureSetAdmissionEvaluation {
  readonly admission: FixtureSetAdmissionResult;
  readonly positiveCount: number;
  readonly negativeCount: number;
  readonly claimBoundary: string;
}

const ADMISSION_CLAIM_BOUNDARY =
  "pure structural admission check of a fixture set's class composition; " +
  "does not grade any individual fixture and does not imply PASS_WITH_EVIDENCE " +
  "for any fixture in the set";

/**
 * Determines whether a fixture set may reach `PASS_WITH_EVIDENCE` under
 * this contract's positive-plus-negative rule: a positive-only or
 * negative-only fixture set can never be admitted, regardless of how many
 * fixtures of the one present class exist. Pure function; never mutates
 * `fixtures` and never throws on malformed input.
 */
export function admitFixtureSet(fixtures: unknown): FixtureSetAdmissionEvaluation {
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    return Object.freeze({
      admission: "MALFORMED_FIXTURE_SET",
      positiveCount: 0,
      negativeCount: 0,
      claimBoundary: ADMISSION_CLAIM_BOUNDARY,
    });
  }

  let positiveCount = 0;
  let negativeCount = 0;
  for (const candidate of fixtures) {
    const problems = validateFixtureStructure(candidate);
    if (problems.length > 0) {
      return Object.freeze({
        admission: "MALFORMED_FIXTURE_SET",
        positiveCount,
        negativeCount,
        claimBoundary: ADMISSION_CLAIM_BOUNDARY,
      });
    }
    const fixture = candidate as BehavioralFixture;
    if (fixture.fixtureClass === "POSITIVE") positiveCount += 1;
    if (fixture.fixtureClass === "NEGATIVE") negativeCount += 1;
  }

  if (positiveCount === 0) {
    return Object.freeze({
      admission: "MISSING_POSITIVE_CASE",
      positiveCount,
      negativeCount,
      claimBoundary: ADMISSION_CLAIM_BOUNDARY,
    });
  }
  if (negativeCount === 0) {
    return Object.freeze({
      admission: "MISSING_NEGATIVE_CASE",
      positiveCount,
      negativeCount,
      claimBoundary: ADMISSION_CLAIM_BOUNDARY,
    });
  }

  return Object.freeze({
    admission: "ADMITTED",
    positiveCount,
    negativeCount,
    claimBoundary: ADMISSION_CLAIM_BOUNDARY,
  });
}

// --- WITH/WITHOUT baseline pairing admission (R1-03) ---

export type BaselinePairAdmissionResult =
  | "ADMITTED_PAIR"
  | "ADMITTED_NO_PAIR_REQUIRED"
  | "MISSING_PAIR"
  | "SAME_ROLE_PAIR"
  | "MALFORMED_ROLE"
  | "NONEQUIVALENT_INPUT_BYTES"
  | "UNEXPECTED_PAIR_FOR_NONE_ROLE";

export interface BaselinePairAdmissionEvaluation {
  readonly admission: BaselinePairAdmissionResult;
  readonly claimBoundary: string;
}

const PAIR_CLAIM_BOUNDARY =
  "pure structural admission check of a WITH/WITHOUT baseline pairing; " +
  "does not grade either fixture and does not imply PASS_WITH_EVIDENCE";

/**
 * Determines whether a fixture (optionally paired with a second candidate
 * fixture) satisfies the WITH/WITHOUT baseline pairing rule: a fixture
 * declaring `baselineRole: WITH` or `WITHOUT` mandates a complementary
 * paired fixture with byte-identical `canonicalInputBytes`; a fixture
 * declaring `baselineRole: NONE` must never silently consume a comparison
 * pair. Pure function; never throws on malformed input.
 */
export function admitBaselinePair(
  fixture: unknown,
  pairedFixture: unknown,
): BaselinePairAdmissionEvaluation {
  const fixtureProblems = validateFixtureStructure(fixture);
  if (fixtureProblems.length > 0) {
    return Object.freeze({ admission: "MALFORMED_ROLE", claimBoundary: PAIR_CLAIM_BOUNDARY });
  }
  const typedFixture = fixture as BehavioralFixture;

  if (typedFixture.baselineRole === "NONE") {
    if (pairedFixture !== null && pairedFixture !== undefined) {
      return Object.freeze({
        admission: "UNEXPECTED_PAIR_FOR_NONE_ROLE",
        claimBoundary: PAIR_CLAIM_BOUNDARY,
      });
    }
    return Object.freeze({
      admission: "ADMITTED_NO_PAIR_REQUIRED",
      claimBoundary: PAIR_CLAIM_BOUNDARY,
    });
  }

  // baselineRole is WITH or WITHOUT: a complementary pair is mandatory.
  if (pairedFixture === null || pairedFixture === undefined) {
    return Object.freeze({ admission: "MISSING_PAIR", claimBoundary: PAIR_CLAIM_BOUNDARY });
  }

  const pairedProblems = validateFixtureStructure(pairedFixture);
  if (pairedProblems.length > 0) {
    return Object.freeze({ admission: "MALFORMED_ROLE", claimBoundary: PAIR_CLAIM_BOUNDARY });
  }
  const typedPaired = pairedFixture as BehavioralFixture;

  if (typedPaired.baselineRole !== "WITH" && typedPaired.baselineRole !== "WITHOUT") {
    return Object.freeze({ admission: "MALFORMED_ROLE", claimBoundary: PAIR_CLAIM_BOUNDARY });
  }

  if (typedPaired.baselineRole === typedFixture.baselineRole) {
    return Object.freeze({ admission: "SAME_ROLE_PAIR", claimBoundary: PAIR_CLAIM_BOUNDARY });
  }

  if (typedPaired.canonicalInputBytes !== typedFixture.canonicalInputBytes) {
    return Object.freeze({
      admission: "NONEQUIVALENT_INPUT_BYTES",
      claimBoundary: PAIR_CLAIM_BOUNDARY,
    });
  }

  return Object.freeze({ admission: "ADMITTED_PAIR", claimBoundary: PAIR_CLAIM_BOUNDARY });
}
