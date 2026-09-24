// CVF ACEL G2-T2 - Discriminating Task Gate Contract (T2A, offline)
//
// Defines one frozen coordination task, its strict JSON response schema, a
// deterministic secret-safe parser, a fail-closed 100-point rubric, material-
// defect detection, and a candidate-only release predicate
// (releaseCandidate is true exactly when score <=80 or a material defect
// exists), per
// docs/work_orders/CVF_AGENT_WORK_ORDER_ACEL_G2_T2_DISCRIMINATING_TASK_GATE_T2A_2026-09-16.md
// and
// docs/baselines/CVF_GC018_ACEL_G2_T2_DISCRIMINATING_TASK_GATE_T2A_2026-09-16.md.
//
// Unlike MAO-OA-T6A (EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION/src/mao/
// harder.value.candidate.contract.ts), whose rubric only checks per-field
// presence and specificity length, this task requires the grader to check
// *relational* obligations: an ordered dependency chain between four named
// steps, a numeric concurrency ceiling that a plan can violate even while
// naming the right steps, a conditional rollback trigger tied to a specific
// named failure signal, and an authority-preservation clause that must not
// claim any elevation beyond one named service account. A plan can mention
// every required keyword and still fail every relational check; keyword
// presence alone earns zero rubric credit here.
//
// This module performs no network call, no credential read, no retry, and no
// provider invocation. It operates only on already-received response text.
// Given the same response text, `evaluateDiscriminatingTask` always returns
// an identical result. This module never sets or claims
// `QUALIFIED_FOR_T2_LIVE`; only a separately authorized future packet may
// promote a task past `DESIGN_READY_FOR_LOCAL_REVIEW`.

// --- Fixed task ---

export const DISCRIMINATING_TASK_ID = "ACEL-G2-T2-DISCRIMINATING-TASK-GATE-T2A";

export const DISCRIMINATING_TASK_PROMPT =
  "Plan a four-step internal datacenter migration for one named service account " +
  '("svc-migrate"), with these fixed constraints. Steps must be exactly ' +
  '"snapshot", "drain", "cutover", "verify", each performed exactly once, and ' +
  '"snapshot" must complete before "drain" starts, "drain" before "cutover", ' +
  'and "cutover" before "verify" (strict chain, no reordering and no parallel ' +
  "execution of any two steps). Each step may use at most 2 internal workers " +
  '(a hard per-step resource ceiling recorded as "maxConcurrent"). If "cutover" ' +
  'reports the specific failure signal "checksum_mismatch", the plan must ' +
  'roll back to the last completed "snapshot" state and must not proceed to ' +
  '"verify". The plan must not grant, request, or imply any authority beyond ' +
  'the single named service account "svc-migrate" (no elevation to a second ' +
  "account, no new admin role, no broadened scope). Respond with ONLY a " +
  "single JSON object (no markdown fences, no prose before or after) " +
  'matching exactly this shape: {"objective": string, "steps": [{"name": ' +
  'string, "dependsOn": string | null, "maxConcurrent": number}, ...four ' +
  'items in "snapshot","drain","cutover","verify" order], "rollbackTrigger": ' +
  'string, "rollbackTarget": string, "authorityAccount": string, ' +
  '"verificationSkippedOnRollback": boolean}. The "steps" array must contain ' +
  'exactly four items in that exact name order. Set "rollbackTrigger" exactly ' +
  'to "checksum_mismatch reported during cutover", set "rollbackTarget" ' +
  'exactly to "last completed snapshot state", and set ' +
  '"verificationSkippedOnRollback" to true. Output nothing except the ' +
  "JSON object.";

// --- Parsed candidate shape ---

export interface DiscriminatingTaskStep {
  readonly name: string;
  readonly dependsOn: string | null;
  readonly maxConcurrent: number;
}

export interface DiscriminatingTaskPlan {
  readonly objective: string;
  readonly steps: readonly DiscriminatingTaskStep[];
  readonly rollbackTrigger: string;
  readonly rollbackTarget: string;
  readonly authorityAccount: string;
  readonly verificationSkippedOnRollback: boolean;
}

export type DiscriminatingTaskParseFailureReason =
  | "EMPTY_RESPONSE"
  | "INVALID_JSON"
  | "NOT_AN_OBJECT";

export interface DiscriminatingTaskParseFailure {
  readonly ok: false;
  readonly reason: DiscriminatingTaskParseFailureReason;
  readonly detail: string;
}

export interface DiscriminatingTaskParseSuccess {
  readonly ok: true;
  readonly raw: Readonly<Record<string, unknown>>;
}

export type DiscriminatingTaskParseResult =
  | DiscriminatingTaskParseFailure
  | DiscriminatingTaskParseSuccess;

/**
 * Parse raw response text as JSON only. Never throws and never repairs
 * malformed input; every failure mode is a typed result. Markdown fences are
 * deliberately rejected because the frozen prompt requires one bare object.
 */
export function parseDiscriminatingTaskResponse(
  responseText: string,
): DiscriminatingTaskParseResult {
  const trimmed = responseText.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "EMPTY_RESPONSE", detail: "response text is empty" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown JSON parse error";
    return { ok: false, reason: "INVALID_JSON", detail: message };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "NOT_AN_OBJECT", detail: "parsed JSON is not a plain object" };
  }

  return { ok: true, raw: parsed as Record<string, unknown> };
}

// --- Material defects ---

export type DiscriminatingTaskDefectClass =
  | "INVALID_JSON"
  | "MISSING_OR_WRONG_CARDINALITY"
  | "STEP_ORDER_VIOLATION"
  | "CONCURRENCY_CEILING_VIOLATION"
  | "ROLLBACK_OBLIGATION_VIOLATION"
  | "AUTHORITY_VIOLATION";

export interface DiscriminatingTaskDefect {
  readonly defectClass: DiscriminatingTaskDefectClass;
  readonly detail: string;
}

const EXPECTED_STEP_NAMES = ["snapshot", "drain", "cutover", "verify"] as const;
type ExpectedStepName = (typeof EXPECTED_STEP_NAMES)[number];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unexpectedKeys(
  value: Readonly<Record<string, unknown>>,
  allowedKeys: readonly string[],
): string[] {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).filter((key) => !allowed.has(key)).sort();
}

/**
 * Matches only a genuine positive claim of authority elevation beyond the
 * single named service account. Excludes a negated mention (e.g. "no new
 * admin role", "not granting a second account") by requiring the matched
 * phrase not be immediately preceded (within a short window) by a negation
 * word, mirroring the negation-safe pattern already used in
 * harder.value.candidate.contract.ts, so a plan that correctly *disclaims*
 * elevation is never flagged for describing the very constraint it
 * satisfies.
 */
const AUTHORITY_ELEVATION_PHRASE =
  /(grant(?:s|ing|ed)?\s+(?:a\s+)?(?:new\s+)?admin|elevat(?:e|ing|ed)\s+(?:to\s+)?(?:a\s+)?(?:second\s+)?account|second\s+service\s+account|broaden(?:ing|ed)?\s+scope|new\s+admin\s+role|escalat(?:e|ing|ed)\s+privilege)/gi;
const NEGATION_PREFIX_PATTERN = /\b(no|not|never|zero|without|avoid(?:ing|s)?|prevent(?:ing|s)?)\W+(\w+\W+){0,3}$/i;

function textContainsAuthorityElevationClaim(text: string): boolean {
  const matches = text.matchAll(AUTHORITY_ELEVATION_PHRASE);
  for (const match of matches) {
    const precedingText = text.slice(0, match.index ?? 0);
    if (!NEGATION_PREFIX_PATTERN.test(precedingText)) {
      return true;
    }
  }
  return false;
}

interface NormalizedSteps {
  readonly stepsByName: ReadonlyMap<string, DiscriminatingTaskStep>;
  readonly shapeProblems: readonly string[];
}

/**
 * Validates cardinality, name-order and per-step field shape for the
 * `steps` array without repairing or coercing any malformed entry. Returns
 * a name-keyed map of only the well-shaped steps found, plus every shape
 * problem discovered (wrong length, wrong order, wrong/missing field type).
 */
function normalizeSteps(raw: Readonly<Record<string, unknown>>): NormalizedSteps {
  const shapeProblems: string[] = [];
  const stepsByName = new Map<string, DiscriminatingTaskStep>();

  const steps = raw.steps;
  if (!Array.isArray(steps) || steps.length !== 4) {
    shapeProblems.push("steps must be an array of exactly 4 items");
    return { stepsByName, shapeProblems };
  }

  steps.forEach((entry, index) => {
    const expectedName = EXPECTED_STEP_NAMES[index];
    if (!isPlainObject(entry)) {
      shapeProblems.push(`steps[${index}] must be an object`);
      return;
    }
    const extraKeys = unexpectedKeys(entry, ["name", "dependsOn", "maxConcurrent"]);
    if (extraKeys.length > 0) {
      shapeProblems.push(`steps[${index}] has unexpected field(s): ${extraKeys.join(", ")}`);
      return;
    }
    if (entry.name !== expectedName) {
      shapeProblems.push(
        `steps[${index}].name must be "${expectedName}" (found ${JSON.stringify(entry.name)})`,
      );
      return;
    }
    if (entry.dependsOn !== null && !isNonEmptyString(entry.dependsOn)) {
      shapeProblems.push(`steps[${index}].dependsOn must be a non-empty string or null`);
      return;
    }
    if (typeof entry.maxConcurrent !== "number" || !Number.isInteger(entry.maxConcurrent)) {
      shapeProblems.push(`steps[${index}].maxConcurrent must be an integer`);
      return;
    }
    stepsByName.set(expectedName, {
      name: expectedName,
      dependsOn: entry.dependsOn as string | null,
      maxConcurrent: entry.maxConcurrent,
    });
  });

  return { stepsByName, shapeProblems };
}

const EXPECTED_DEPENDS_ON: Record<ExpectedStepName, string | null> = {
  snapshot: null,
  drain: "snapshot",
  cutover: "drain",
  verify: "cutover",
};

/**
 * Detects every declared cardinality/shape, ordering, concurrency, rollback
 * and authority violation in one parsed object. Never silently repairs or
 * coerces a shape; each violated relational obligation is its own defect
 * (or folded into the single MISSING_OR_WRONG_CARDINALITY defect when the
 * underlying field is absent or malformed).
 */
function detectDiscriminatingTaskDefects(
  raw: Readonly<Record<string, unknown>>,
): DiscriminatingTaskDefect[] {
  const defects: DiscriminatingTaskDefect[] = [];
  const shapeProblems: string[] = [];

  const extraTopLevelKeys = unexpectedKeys(raw, [
    "objective",
    "steps",
    "rollbackTrigger",
    "rollbackTarget",
    "authorityAccount",
    "verificationSkippedOnRollback",
  ]);
  if (extraTopLevelKeys.length > 0) {
    shapeProblems.push(`unexpected top-level field(s): ${extraTopLevelKeys.join(", ")}`);
  }

  if (!isNonEmptyString(raw.objective)) {
    shapeProblems.push("objective must be a non-empty string");
  }

  const { stepsByName, shapeProblems: stepShapeProblems } = normalizeSteps(raw);
  shapeProblems.push(...stepShapeProblems);

  if (!isNonEmptyString(raw.rollbackTrigger)) {
    shapeProblems.push("rollbackTrigger must be a non-empty string");
  }
  if (!isNonEmptyString(raw.rollbackTarget)) {
    shapeProblems.push("rollbackTarget must be a non-empty string");
  }
  if (!isNonEmptyString(raw.authorityAccount)) {
    shapeProblems.push("authorityAccount must be a non-empty string");
  }
  if (typeof raw.verificationSkippedOnRollback !== "boolean") {
    shapeProblems.push("verificationSkippedOnRollback must be a boolean");
  }

  if (shapeProblems.length > 0) {
    defects.push({ defectClass: "MISSING_OR_WRONG_CARDINALITY", detail: shapeProblems.join("; ") });
  }

  // Ordering: only evaluable when all four steps are well-shaped, since a
  // shape defect already covers the missing/malformed case.
  if (stepsByName.size === 4) {
    const orderProblems: string[] = [];
    for (const name of EXPECTED_STEP_NAMES) {
      const step = stepsByName.get(name);
      if (!step) continue;
      const expectedDependsOn = EXPECTED_DEPENDS_ON[name];
      if (step.dependsOn !== expectedDependsOn) {
        orderProblems.push(
          `${name}.dependsOn must be ${JSON.stringify(expectedDependsOn)} (found ${JSON.stringify(step.dependsOn)})`,
        );
      }
    }
    if (orderProblems.length > 0) {
      defects.push({ defectClass: "STEP_ORDER_VIOLATION", detail: orderProblems.join("; ") });
    }

    const concurrencyProblems: string[] = [];
    for (const step of stepsByName.values()) {
      if (step.maxConcurrent > 2) {
        concurrencyProblems.push(
          `${step.name}.maxConcurrent (${step.maxConcurrent}) exceeds the hard ceiling of 2`,
        );
      }
      if (step.maxConcurrent < 1) {
        concurrencyProblems.push(
          `${step.name}.maxConcurrent (${step.maxConcurrent}) must be at least 1`,
        );
      }
    }
    if (concurrencyProblems.length > 0) {
      defects.push({
        defectClass: "CONCURRENCY_CEILING_VIOLATION",
        detail: concurrencyProblems.join("; "),
      });
    }
  }

  // Rollback obligation: exact normalized literals bind the failure signal to
  // cutover and the rollback target to the last completed snapshot. Merely
  // mentioning the keywords inside a negation or unrelated sentence earns no
  // credit.
  if (isNonEmptyString(raw.rollbackTrigger) || isNonEmptyString(raw.rollbackTarget) || typeof raw.verificationSkippedOnRollback === "boolean") {
    const rollbackProblems: string[] = [];
    if (
      isNonEmptyString(raw.rollbackTrigger) &&
      raw.rollbackTrigger.trim().toLowerCase() !== "checksum_mismatch reported during cutover"
    ) {
      rollbackProblems.push(
        'rollbackTrigger must equal "checksum_mismatch reported during cutover"',
      );
    }
    if (
      isNonEmptyString(raw.rollbackTarget) &&
      raw.rollbackTarget.trim().toLowerCase() !== "last completed snapshot state"
    ) {
      rollbackProblems.push('rollbackTarget must equal "last completed snapshot state"');
    }
    if (raw.verificationSkippedOnRollback === false) {
      rollbackProblems.push("verificationSkippedOnRollback must be true, not false");
    }
    if (rollbackProblems.length > 0) {
      defects.push({
        defectClass: "ROLLBACK_OBLIGATION_VIOLATION",
        detail: rollbackProblems.join("; "),
      });
    }
  }

  // Authority: authorityAccount must be exactly "svc-migrate" and no field
  // may claim an elevation beyond it.
  if (isNonEmptyString(raw.authorityAccount) && raw.authorityAccount.trim() !== "svc-migrate") {
    defects.push({
      defectClass: "AUTHORITY_VIOLATION",
      detail: `authorityAccount must be exactly "svc-migrate" (found ${JSON.stringify(raw.authorityAccount)})`,
    });
  }

  const combinedText = [
    isNonEmptyString(raw.objective) ? raw.objective : "",
    isNonEmptyString(raw.rollbackTrigger) ? raw.rollbackTrigger : "",
    isNonEmptyString(raw.rollbackTarget) ? raw.rollbackTarget : "",
    isNonEmptyString(raw.authorityAccount) ? raw.authorityAccount : "",
  ].join(" ");
  if (textContainsAuthorityElevationClaim(combinedText)) {
    defects.push({
      defectClass: "AUTHORITY_VIOLATION",
      detail: "plan text implies authority elevation beyond the single named service account",
    });
  }

  return defects;
}

// --- Rubric ---

export interface DiscriminatingTaskRubric {
  readonly schemaCompletenessScore: number;
  readonly orderingAndConcurrencyScore: number;
  readonly rollbackAndAuthorityScore: number;
  readonly score: number;
  readonly maxScore: 100;
}

/**
 * Score a parsed (but not necessarily well-shaped) candidate object against
 * the fixed 100-point rubric. Pure function of `raw`; never reads a
 * credential, never performs I/O, and never mutates its input. Every point
 * band requires a relational obligation to hold, not merely a field's
 * presence or a keyword mention.
 */
export function scoreDiscriminatingTask(
  raw: Readonly<Record<string, unknown>>,
): DiscriminatingTaskRubric {
  // 30 pts: schema/completeness - required top-level fields and exactly
  // four well-shaped steps present.
  let schemaCompletenessScore = 0;
  if (isNonEmptyString(raw.objective)) schemaCompletenessScore += 5;
  const { stepsByName } = normalizeSteps(raw);
  schemaCompletenessScore += Math.round((stepsByName.size / 4) * 15);
  if (isNonEmptyString(raw.rollbackTrigger)) schemaCompletenessScore += 3;
  if (isNonEmptyString(raw.rollbackTarget)) schemaCompletenessScore += 3;
  if (isNonEmptyString(raw.authorityAccount)) schemaCompletenessScore += 2;
  if (typeof raw.verificationSkippedOnRollback === "boolean") schemaCompletenessScore += 2;
  if (
    unexpectedKeys(raw, [
      "objective",
      "steps",
      "rollbackTrigger",
      "rollbackTarget",
      "authorityAccount",
      "verificationSkippedOnRollback",
    ]).length > 0
  ) {
    schemaCompletenessScore = 0;
  }
  schemaCompletenessScore = Math.round(Math.min(schemaCompletenessScore, 30));

  // 40 pts: ordering and concurrency - all-or-nothing across both the
  // strict three-edge dependency chain and the concurrency ceiling. A
  // single broken edge or a single out-of-range maxConcurrent value forfeits
  // the entire band: the task prompt frames the chain as strict ("no
  // reordering and no parallel execution"), so partial per-edge credit would
  // let a plan that gets 2 of 3 edges right still reach a perfect overall
  // score while a real STEP_ORDER_VIOLATION or CONCURRENCY_CEILING_VIOLATION
  // defect is recorded - exactly the answer-shaped overfitting the paired
  // baseline (docs/baselines/CVF_GC018_ACEL_G2_T2_DISCRIMINATING_TASK_GATE_T2A_2026-09-16.md)
  // requires this gate to resist.
  let orderingAndConcurrencyScore = 0;
  if (stepsByName.size === 4) {
    const allEdgesCorrect = EXPECTED_STEP_NAMES.every((name) => {
      const step = stepsByName.get(name);
      return step !== undefined && step.dependsOn === EXPECTED_DEPENDS_ON[name];
    });
    const allWithinCeiling = Array.from(stepsByName.values()).every(
      (step) => step.maxConcurrent >= 1 && step.maxConcurrent <= 2,
    );
    if (allEdgesCorrect && allWithinCeiling) {
      orderingAndConcurrencyScore = 40;
    }
  }

  // 30 pts: rollback and authority - rollback trigger correctly named (10),
  // rollback target correctly named (5), verification correctly skipped on
  // rollback (5), and authority account exactly "svc-migrate" with no
  // elevation claim (10).
  let rollbackAndAuthorityScore = 0;
  if (
    isNonEmptyString(raw.rollbackTrigger) &&
    raw.rollbackTrigger.trim().toLowerCase() === "checksum_mismatch reported during cutover"
  ) {
    rollbackAndAuthorityScore += 10;
  }
  if (
    isNonEmptyString(raw.rollbackTarget) &&
    raw.rollbackTarget.trim().toLowerCase() === "last completed snapshot state"
  ) {
    rollbackAndAuthorityScore += 5;
  }
  if (raw.verificationSkippedOnRollback === true) {
    rollbackAndAuthorityScore += 5;
  }
  const authorityText = [
    isNonEmptyString(raw.authorityAccount) ? raw.authorityAccount : "",
    isNonEmptyString(raw.objective) ? raw.objective : "",
  ].join(" ");
  if (
    isNonEmptyString(raw.authorityAccount) &&
    raw.authorityAccount.trim() === "svc-migrate" &&
    !textContainsAuthorityElevationClaim(authorityText)
  ) {
    rollbackAndAuthorityScore += 10;
  }
  rollbackAndAuthorityScore = Math.round(Math.min(rollbackAndAuthorityScore, 30));

  const score = Math.min(
    schemaCompletenessScore + orderingAndConcurrencyScore + rollbackAndAuthorityScore,
    100,
  );

  return Object.freeze({
    schemaCompletenessScore,
    orderingAndConcurrencyScore,
    rollbackAndAuthorityScore,
    score,
    maxScore: 100,
  });
}

// --- Combined evaluation ---

export interface DiscriminatingTaskEvaluation {
  readonly rubric: DiscriminatingTaskRubric;
  readonly defects: readonly DiscriminatingTaskDefect[];
  readonly materialDefectFound: boolean;
  readonly releaseCandidate: boolean;
}

/**
 * Evaluate raw response text end-to-end: parse, score, detect material
 * defects, and compute the candidate-only release flag. A parse failure
 * (invalid JSON or non-object) is itself always a material defect and fails
 * the rubric closed to a score of 0. Deterministic: identical input always
 * produces an identical result. `releaseCandidate=true` marks the response
 * only as a candidate for later Local calibration review; it never means
 * `QUALIFIED_FOR_T2_LIVE` and never asserts Policy B value.
 */
export function evaluateDiscriminatingTask(responseText: string): DiscriminatingTaskEvaluation {
  const parsed = parseDiscriminatingTaskResponse(responseText);

  if (!parsed.ok) {
    return Object.freeze({
      rubric: Object.freeze({
        schemaCompletenessScore: 0,
        orderingAndConcurrencyScore: 0,
        rollbackAndAuthorityScore: 0,
        score: 0,
        maxScore: 100,
      }),
      defects: Object.freeze([
        { defectClass: "INVALID_JSON" as const, detail: `${parsed.reason}: ${parsed.detail}` },
      ]),
      materialDefectFound: true,
      releaseCandidate: true,
    });
  }

  const rubric = scoreDiscriminatingTask(parsed.raw);
  const defects = Object.freeze(detectDiscriminatingTaskDefects(parsed.raw));
  const materialDefectFound = defects.length > 0;
  const releaseCandidate = rubric.score <= 80 || materialDefectFound;

  return Object.freeze({ rubric, defects, materialDefectFound, releaseCandidate });
}
