// CVF MAO-OA-T6A - Harder Candidate Direct Baseline Calibration Contract
//
// Defines the fixed harder-candidate task, its strict JSON schema, a
// deterministic secret-safe parser, a 100-point rubric (40 schema/
// completeness, 30 fixed-constraint correctness, 30 risk/verification
// specificity), material-defect detection, and the release-candidate rule
// (releaseCandidate is true exactly when score <=80 or a material defect
// exists), per
// docs/work_orders/CVF_AGENT_WORK_ORDER_MAO_OA_T6A_HARDER_CANDIDATE_DIRECT_BASELINE_CALIBRATION_2026-07-17.md.
//
// This module performs no network call, no credential read, and no retry.
// It operates only on already-received response text (never a raw provider
// payload or secret). Given the same response text, `evaluateHarderCandidate`
// always returns an identical result. Only the reviewer may release T6B;
// this module never sets or claims a release decision itself.

// --- Fixed task ---

export const HARDER_CANDIDATE_TASK_ID = "MAO-OA-T6A-HARDER-CANDIDATE";

export const HARDER_CANDIDATE_TASK_PROMPT =
  'Plan a 48-hour evidence-backed release with exactly two engineers and no production mutation. ' +
  'Respond with ONLY a single JSON object (no markdown fences, no prose before or after) matching exactly this shape: ' +
  '{"objective": string, "dependencies": [string, string, string], ' +
  '"risks": [{"risk": string, "mitigation": string}, {"risk": string, "mitigation": string}, {"risk": string, "mitigation": string}], ' +
  '"verification": [string, string, string], "rollback": string, "stopCondition": string}. ' +
  'The "dependencies" array must contain exactly three items, the "risks" array must contain exactly three items each with a ' +
  'non-empty "mitigation", and the "verification" array must contain exactly three items. The plan must not perform, request, or ' +
  'imply any production mutation. Output nothing except the JSON object.';

// --- Parsed candidate shape ---

export interface MaoHarderCandidateRisk {
  readonly risk: string;
  readonly mitigation: string;
}

export interface MaoHarderCandidatePlan {
  readonly objective: string;
  readonly dependencies: readonly string[];
  readonly risks: readonly MaoHarderCandidateRisk[];
  readonly verification: readonly string[];
  readonly rollback: string;
  readonly stopCondition: string;
}

export type MaoHarderCandidateParseFailureReason =
  | "EMPTY_RESPONSE"
  | "INVALID_JSON"
  | "NOT_AN_OBJECT";

export interface MaoHarderCandidateParseFailure {
  readonly ok: false;
  readonly reason: MaoHarderCandidateParseFailureReason;
  readonly detail: string;
}

export interface MaoHarderCandidateParseSuccess {
  readonly ok: true;
  readonly raw: Readonly<Record<string, unknown>>;
}

export type MaoHarderCandidateParseResult = MaoHarderCandidateParseFailure | MaoHarderCandidateParseSuccess;

/**
 * Parse raw response text as JSON only. Never throws; every failure mode is
 * a typed result. Strips a single leading/trailing markdown code fence
 * (```json ... ``` or ``` ... ```) if present, since providers frequently
 * wrap JSON output that way despite instruction not to.
 */
export function parseHarderCandidateResponse(responseText: string): MaoHarderCandidateParseResult {
  const trimmed = responseText.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "EMPTY_RESPONSE", detail: "response text is empty" };
  }

  const unfenced = stripMarkdownFence(trimmed);

  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown JSON parse error";
    return { ok: false, reason: "INVALID_JSON", detail: message };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "NOT_AN_OBJECT", detail: "parsed JSON is not a plain object" };
  }

  return { ok: true, raw: parsed as Record<string, unknown> };
}

function stripMarkdownFence(text: string): string {
  const fenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(text);
  return fenceMatch ? fenceMatch[1].trim() : text;
}

// --- Material defects ---

export type MaoHarderCandidateDefectClass =
  | "INVALID_JSON"
  | "MISSING_OR_WRONG_CARDINALITY"
  | "PRODUCTION_MUTATION"
  | "EMPTY_ROLLBACK_OR_STOP_CONDITION";

export interface MaoHarderCandidateDefect {
  readonly defectClass: MaoHarderCandidateDefectClass;
  readonly detail: string;
}

/**
 * Matches only a genuine positive claim of production mutation. Excludes a
 * negated mention (e.g. "no production database write", "not deploying to
 * production", "zero production mutation") by requiring the matched phrase
 * not be immediately preceded (within a short window) by a negation word,
 * so a plan that correctly *disclaims* production mutation is never
 * flagged for describing the very constraint it satisfies.
 */
const PRODUCTION_MUTATION_PHRASE =
  /(deploy(?:ing|ed)?\s+to\s+production|production\s+deploy(?:ment)?|push(?:ing|ed)?\s+to\s+prod(?:uction)?|mutat(?:e|ing|ed)\s+production|production\s+mutation|prod(?:uction)?\s+database\s+write|write\s+to\s+prod(?:uction)?)/gi;
const NEGATION_PREFIX_PATTERN = /\b(no|not|never|zero|without|avoid(?:ing|s)?|prevent(?:ing|s)?)\W+(\w+\W+){0,3}$/i;

function textContainsProductionMutationClaim(text: string): boolean {
  const matches = text.matchAll(PRODUCTION_MUTATION_PHRASE);
  for (const match of matches) {
    const precedingText = text.slice(0, match.index ?? 0);
    if (!NEGATION_PREFIX_PATTERN.test(precedingText)) {
      return true;
    }
  }
  return false;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArrayOfLength(value: unknown, length: number): value is string[] {
  return Array.isArray(value) && value.length === length && value.every(isNonEmptyString);
}

/**
 * Detect every declared cardinality/shape violation in one parsed object.
 * Returns one MISSING_OR_WRONG_CARDINALITY defect summarizing all shape
 * problems found (never silently repairs or coerces a shape), plus any
 * production-mutation or empty-rollback/stop-condition defect found in the
 * fields that are present and correctly shaped.
 */
function detectCardinalityAndFieldDefects(raw: Readonly<Record<string, unknown>>): MaoHarderCandidateDefect[] {
  const defects: MaoHarderCandidateDefect[] = [];
  const shapeProblems: string[] = [];

  if (!isNonEmptyString(raw.objective)) {
    shapeProblems.push("objective must be a non-empty string");
  }

  if (!isStringArrayOfLength(raw.dependencies, 3)) {
    shapeProblems.push("dependencies must be an array of exactly 3 non-empty strings");
  }

  const risks = raw.risks;
  if (!Array.isArray(risks) || risks.length !== 3) {
    shapeProblems.push("risks must be an array of exactly 3 items");
  } else {
    risks.forEach((entry, index) => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        shapeProblems.push(`risks[${index}] must be an object`);
        return;
      }
      const record = entry as Record<string, unknown>;
      if (!isNonEmptyString(record.risk)) {
        shapeProblems.push(`risks[${index}].risk must be a non-empty string`);
      }
      if (!isNonEmptyString(record.mitigation)) {
        shapeProblems.push(`risks[${index}].mitigation must be a non-empty string`);
      }
    });
  }

  if (!isStringArrayOfLength(raw.verification, 3)) {
    shapeProblems.push("verification must be an array of exactly 3 non-empty strings");
  }

  if (shapeProblems.length > 0) {
    defects.push({ defectClass: "MISSING_OR_WRONG_CARDINALITY", detail: shapeProblems.join("; ") });
  }

  const combinedText = [
    isNonEmptyString(raw.objective) ? raw.objective : "",
    isStringArrayOfLength(raw.dependencies, 3) ? raw.dependencies.join(" ") : "",
    Array.isArray(risks)
      ? risks
          .map((entry) => {
            if (typeof entry !== "object" || entry === null) return "";
            const record = entry as Record<string, unknown>;
            return `${isNonEmptyString(record.risk) ? record.risk : ""} ${isNonEmptyString(record.mitigation) ? record.mitigation : ""}`;
          })
          .join(" ")
      : "",
    isStringArrayOfLength(raw.verification, 3) ? raw.verification.join(" ") : "",
    isNonEmptyString(raw.rollback) ? raw.rollback : "",
    isNonEmptyString(raw.stopCondition) ? raw.stopCondition : "",
  ].join(" ");

  if (textContainsProductionMutationClaim(combinedText)) {
    defects.push({
      defectClass: "PRODUCTION_MUTATION",
      detail: "plan text implies a production mutation, violating the no-production-mutation constraint",
    });
  }

  if (!isNonEmptyString(raw.rollback) || !isNonEmptyString(raw.stopCondition)) {
    const missing: string[] = [];
    if (!isNonEmptyString(raw.rollback)) missing.push("rollback");
    if (!isNonEmptyString(raw.stopCondition)) missing.push("stopCondition");
    defects.push({
      defectClass: "EMPTY_ROLLBACK_OR_STOP_CONDITION",
      detail: `missing or empty field(s): ${missing.join(", ")}`,
    });
  }

  return defects;
}

// --- Rubric ---

export interface MaoHarderCandidateRubric {
  readonly schemaCompletenessScore: number;
  readonly fixedConstraintScore: number;
  readonly riskVerificationSpecificityScore: number;
  readonly score: number;
  readonly maxScore: 100;
}

const SPECIFICITY_MIN_LENGTH = 15;

function specificityRatio(items: readonly string[]): number {
  if (items.length === 0) return 0;
  const specific = items.filter((item) => item.trim().length >= SPECIFICITY_MIN_LENGTH).length;
  return specific / items.length;
}

/**
 * Score a parsed (but not necessarily well-shaped) candidate object against
 * the fixed 100-point rubric. Pure function of `raw`; never reads a
 * credential, never performs I/O, and never mutates its input.
 */
export function scoreHarderCandidate(raw: Readonly<Record<string, unknown>>): MaoHarderCandidateRubric {
  // 40 pts: schema/completeness - one point set per required field/shape present.
  let schemaCompletenessScore = 0;
  if (isNonEmptyString(raw.objective)) schemaCompletenessScore += 5;
  if (isStringArrayOfLength(raw.dependencies, 3)) schemaCompletenessScore += 10;
  const risks = raw.risks;
  const wellShapedRisks =
    Array.isArray(risks) && risks.length === 3
      ? risks.filter((entry) => {
          if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return false;
          const record = entry as Record<string, unknown>;
          return isNonEmptyString(record.risk) && isNonEmptyString(record.mitigation);
        }).length
      : 0;
  schemaCompletenessScore += Math.round((wellShapedRisks / 3) * 15);
  if (isStringArrayOfLength(raw.verification, 3)) schemaCompletenessScore += 5;
  if (isNonEmptyString(raw.rollback)) schemaCompletenessScore += 2.5;
  if (isNonEmptyString(raw.stopCondition)) schemaCompletenessScore += 2.5;
  schemaCompletenessScore = Math.round(Math.min(schemaCompletenessScore, 40));

  // 30 pts: fixed-constraint correctness - two-engineer/48-hour mention and no production mutation.
  const combinedText = [
    isNonEmptyString(raw.objective) ? raw.objective : "",
    isNonEmptyString(raw.rollback) ? raw.rollback : "",
    isNonEmptyString(raw.stopCondition) ? raw.stopCondition : "",
  ].join(" ");
  let fixedConstraintScore = 0;
  if (/\btwo\b|\b2\b/i.test(combinedText) && /engineer/i.test(combinedText)) fixedConstraintScore += 10;
  if (/48[- ]hour|48h\b/i.test(combinedText)) fixedConstraintScore += 10;
  // "No production mutation" credit requires actual plan text to judge; an
  // empty/missing plan has disclaimed nothing and earns no correctness
  // credit merely by having no content for the mutation phrase to match.
  if (combinedText.trim().length > 0 && !textContainsProductionMutationClaim(combinedText)) {
    fixedConstraintScore += 10;
  }
  fixedConstraintScore = Math.round(Math.min(fixedConstraintScore, 30));

  // 30 pts: risk/verification specificity - non-trivial (non-boilerplate-length) entries.
  const riskMitigations: string[] =
    Array.isArray(risks) && risks.length === 3
      ? risks
          .filter((entry) => typeof entry === "object" && entry !== null && !Array.isArray(entry))
          .map((entry) => {
            const record = entry as Record<string, unknown>;
            return isNonEmptyString(record.mitigation) ? record.mitigation : "";
          })
      : [];
  const verificationItems: string[] = isStringArrayOfLength(raw.verification, 3) ? [...raw.verification] : [];
  const riskSpecificity = specificityRatio(riskMitigations);
  const verificationSpecificity = specificityRatio(verificationItems);
  const riskVerificationSpecificityScore = Math.round(((riskSpecificity + verificationSpecificity) / 2) * 30);

  const score = Math.min(
    schemaCompletenessScore + fixedConstraintScore + riskVerificationSpecificityScore,
    100,
  );

  return Object.freeze({
    schemaCompletenessScore,
    fixedConstraintScore,
    riskVerificationSpecificityScore,
    score,
    maxScore: 100,
  });
}

// --- Combined evaluation ---

export interface MaoHarderCandidateEvaluation {
  readonly rubric: MaoHarderCandidateRubric;
  readonly defects: readonly MaoHarderCandidateDefect[];
  readonly materialDefectFound: boolean;
  readonly releaseCandidate: boolean;
}

/**
 * Evaluate raw response text end-to-end: parse, score, detect material
 * defects, and compute the release-candidate flag. A parse failure
 * (invalid JSON or non-object) is itself always a material defect and
 * fails the rubric closed to a score of 0. Deterministic: identical input
 * always produces an identical result.
 */
export function evaluateHarderCandidate(responseText: string): MaoHarderCandidateEvaluation {
  const parsed = parseHarderCandidateResponse(responseText);

  if (!parsed.ok) {
    return Object.freeze({
      rubric: Object.freeze({
        schemaCompletenessScore: 0,
        fixedConstraintScore: 0,
        riskVerificationSpecificityScore: 0,
        score: 0,
        maxScore: 100,
      }),
      defects: Object.freeze([{ defectClass: "INVALID_JSON" as const, detail: `${parsed.reason}: ${parsed.detail}` }]),
      materialDefectFound: true,
      releaseCandidate: true,
    });
  }

  const rubric = scoreHarderCandidate(parsed.raw);
  const defects = Object.freeze(detectCardinalityAndFieldDefects(parsed.raw));
  const materialDefectFound = defects.length > 0;
  const releaseCandidate = rubric.score <= 80 || materialDefectFound;

  return Object.freeze({ rubric, defects, materialDefectFound, releaseCandidate });
}
