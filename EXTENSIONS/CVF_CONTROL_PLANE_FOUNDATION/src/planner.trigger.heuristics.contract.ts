import type { CVFRiskLevel } from "../../CVF_GUARD_CONTRACT/src/types";

export interface PlannerTriggerCandidate {
  candidateRef: string;
  triggerPhrases: string[];
  prerequisites?: string[];
  negativeMatches?: string[];
  riskLevel?: CVFRiskLevel;
}

export interface PlannerTriggerHeuristicsRequest {
  text: string;
  candidates: PlannerTriggerCandidate[];
  availableInputs?: string[];
  governanceChainIntact?: boolean;
}

export interface PlannerTriggerHeuristicsResult {
  candidate_refs: string[];
  confidence: number;
  missing_inputs: string[];
  clarification_needed: boolean;
  negative_matches: string[];
}

interface CandidateScore {
  candidateRef: string;
  confidence: number;
  missingInputs: string[];
  negativeMatches: string[];
  riskLevel: CVFRiskLevel;
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeList(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return Array.from(
    new Set(
      values
        .map((value) => normalizeText(value))
        .filter((value) => value.length > 0),
    ),
  );
}

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 100) / 100;
}

function scoreCandidate(
  text: string,
  availableInputs: Set<string>,
  candidate: PlannerTriggerCandidate,
): CandidateScore | null {
  const triggerPhrases = normalizeList(candidate.triggerPhrases);
  const negativeMatches = normalizeList(candidate.negativeMatches);
  const prerequisites = normalizeList(candidate.prerequisites);

  const matchedPhrases = triggerPhrases.filter((phrase) => text.includes(phrase));
  if (matchedPhrases.length === 0) {
    return null;
  }

  const negativeHits = negativeMatches.filter((phrase) => text.includes(phrase));
  if (negativeHits.length > 0) {
    return {
      candidateRef: candidate.candidateRef,
      confidence: 0,
      missingInputs: [],
      negativeMatches: negativeHits,
      riskLevel: candidate.riskLevel ?? "R1",
    };
  }

  const missingInputs = prerequisites.filter(
    (prerequisite) => !availableInputs.has(prerequisite),
  );

  const phraseCoverage =
    triggerPhrases.length === 0
      ? 0
      : triggerPhrases.length === 1 && matchedPhrases.length === 1
        ? 0.9
        : matchedPhrases.length / triggerPhrases.length;
  const specificityBoost =
    triggerPhrases.length > 1 && matchedPhrases.length === triggerPhrases.length
      ? 0.05
      : 0;
  const missingPenalty = Math.min(0.45, missingInputs.length * 0.2);

  return {
    candidateRef: candidate.candidateRef,
    confidence: clamp(phraseCoverage + specificityBoost - missingPenalty),
    missingInputs,
    negativeMatches: [],
    riskLevel: candidate.riskLevel ?? "R1",
  };
}

export class PlannerTriggerHeuristicsContract {
  evaluate(
    request: PlannerTriggerHeuristicsRequest,
  ): PlannerTriggerHeuristicsResult {
    const text = normalizeText(request.text);
    const availableInputs = new Set(normalizeList(request.availableInputs));
    const governanceChainIntact = request.governanceChainIntact !== false;

    const scores = request.candidates
      .map((candidate) => scoreCandidate(text, availableInputs, candidate))
      .filter((candidate): candidate is CandidateScore => candidate !== null);

    const negativeMatches = Array.from(
      new Set(scores.flatMap((candidate) => candidate.negativeMatches)),
    );

    const positiveScores = scores
      .filter(
        (candidate) =>
          candidate.negativeMatches.length === 0 && candidate.confidence > 0,
      )
      .sort((left, right) => right.confidence - left.confidence);

    const topCandidate = positiveScores[0];
    const fastPathEligible =
      topCandidate !== undefined &&
      topCandidate.confidence >= 0.95 &&
      topCandidate.riskLevel === "R0" &&
      topCandidate.missingInputs.length === 0 &&
      governanceChainIntact;

    const candidate_refs = fastPathEligible
      ? [topCandidate.candidateRef]
      : positiveScores.map((candidate) => candidate.candidateRef);

    const missing_inputs = Array.from(
      new Set(positiveScores.flatMap((candidate) => candidate.missingInputs)),
    );

    return {
      candidate_refs,
      confidence: topCandidate?.confidence ?? 0,
      missing_inputs,
      clarification_needed:
        candidate_refs.length === 0 || missing_inputs.length > 0,
      negative_matches: negativeMatches,
    };
  }
}

export function createPlannerTriggerHeuristicsContract(): PlannerTriggerHeuristicsContract {
  return new PlannerTriggerHeuristicsContract();
}
