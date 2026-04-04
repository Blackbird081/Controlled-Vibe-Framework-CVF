import type { ControlPlaneIntakeResult } from "./intake.contract";
import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type QuestionCategory =
  | "intent_clarity"
  | "domain_specificity"
  | "scope_boundary"
  | "risk_acknowledgement"
  | "context_gap";

export type QuestionPriority = "high" | "medium" | "low";

export interface ClarificationQuestion {
  questionId: string;
  category: QuestionCategory;
  priority: QuestionPriority;
  question: string;
  signal: string;
}

export interface SignalAnalysis {
  intentValid: boolean;
  domainDetected: string;
  retrievalEmpty: boolean;
  contextTruncated: boolean;
  hasWarnings: boolean;
  warningCount: number;
}

export interface ReversePromptPacket {
  packetId: string;
  createdAt: string;
  sourceRequestId: string;
  questions: ClarificationQuestion[];
  totalQuestions: number;
  highPriorityCount: number;
  signalAnalysis: SignalAnalysis;
}

export interface ReversePromptingContractDependencies {
  analyzeSignals?: (result: ControlPlaneIntakeResult) => SignalAnalysis;
  now?: () => string;
}

// --- Signal Analysis ---

function defaultAnalyzeSignals(result: ControlPlaneIntakeResult): SignalAnalysis {
  return {
    intentValid: result.intent.valid,
    domainDetected: result.intent.intent.domain ?? "general",
    retrievalEmpty: result.retrieval.chunkCount === 0,
    contextTruncated: result.packagedContext.truncated,
    hasWarnings: result.warnings.length > 0,
    warningCount: result.warnings.length,
  };
}

// --- Question Generation ---

function generateQuestions(
  analysis: SignalAnalysis,
  requestId: string,
): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  if (!analysis.intentValid) {
    questions.push({
      questionId: computeDeterministicHash(
        "w1-t5-rp",
        requestId,
        "intent_clarity",
        "invalid-intent",
      ),
      category: "intent_clarity",
      priority: "high",
      question:
        "The intent of your request could not be confidently determined. Could you describe what you are trying to accomplish in more specific terms?",
      signal: "intent.valid === false",
    });
  }

  if (
    analysis.domainDetected === "general" ||
    analysis.domainDetected === "unknown" ||
    analysis.domainDetected === "unspecified"
  ) {
    questions.push({
      questionId: computeDeterministicHash(
        "w1-t5-rp",
        requestId,
        "domain_specificity",
        "general-domain",
      ),
      category: "domain_specificity",
      priority: "high",
      question:
        "No specific domain was detected in your request (e.g. finance, security, deployment). Which domain does this request primarily belong to?",
      signal: `intent.intent.domain === "${analysis.domainDetected}"`,
    });
  }

  if (analysis.retrievalEmpty) {
    questions.push({
      questionId: computeDeterministicHash(
        "w1-t5-rp",
        requestId,
        "context_gap",
        "no-chunks",
      ),
      category: "context_gap",
      priority: "high",
      question:
        "No relevant context was found for your request in the knowledge base. Can you provide additional background, references, or example documents that should inform this decision?",
      signal: "retrieval.chunkCount === 0",
    });
  }

  if (analysis.contextTruncated) {
    questions.push({
      questionId: computeDeterministicHash(
        "w1-t5-rp",
        requestId,
        "scope_boundary",
        "truncated",
      ),
      category: "scope_boundary",
      priority: "medium",
      question:
        "The available context exceeded the token budget and was truncated. Which aspects of the request are most critical to preserve if context must be limited?",
      signal: "packagedContext.truncated === true",
    });
  }

  if (analysis.hasWarnings) {
    questions.push({
      questionId: computeDeterministicHash(
        "w1-t5-rp",
        requestId,
        "risk_acknowledgement",
        `warnings:${analysis.warningCount}`,
      ),
      category: "risk_acknowledgement",
      priority: "medium",
      question: `The intake process raised ${analysis.warningCount} warning(s). Do you acknowledge these risks and wish to proceed, or would you like to address them first?`,
      signal: `warnings.length === ${analysis.warningCount}`,
    });
  }

  return questions;
}

// --- Contract ---

export class ReversePromptingContract {
  private readonly analyzeSignals: (
    result: ControlPlaneIntakeResult,
  ) => SignalAnalysis;
  private readonly now: () => string;

  constructor(dependencies: ReversePromptingContractDependencies = {}) {
    this.analyzeSignals =
      dependencies.analyzeSignals ?? defaultAnalyzeSignals;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  generate(intakeResult: ControlPlaneIntakeResult): ReversePromptPacket {
    const createdAt = this.now();
    const signalAnalysis = this.analyzeSignals(intakeResult);
    const questions = generateQuestions(signalAnalysis, intakeResult.requestId);

    const highPriorityCount = questions.filter(
      (q) => q.priority === "high",
    ).length;

    const packetId = computeDeterministicHash(
      "w1-t5-cp1-reverse-prompting",
      `${createdAt}:${intakeResult.requestId}`,
      `questions:${questions.length}:high:${highPriorityCount}`,
    );

    return {
      packetId,
      createdAt,
      sourceRequestId: intakeResult.requestId,
      questions,
      totalQuestions: questions.length,
      highPriorityCount,
      signalAnalysis,
    };
  }
}

export function createReversePromptingContract(
  dependencies?: ReversePromptingContractDependencies,
): ReversePromptingContract {
  return new ReversePromptingContract(dependencies);
}
