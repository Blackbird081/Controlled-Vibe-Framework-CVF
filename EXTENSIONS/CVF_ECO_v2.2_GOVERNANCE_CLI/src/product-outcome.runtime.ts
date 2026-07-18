import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CERTIFIED_SKILL_PACK_REGISTRY_PATH = "governance/registries/cvf-certified-skill-pack-registry.json";

export interface CertifiedSkillPackRegistry {
  registryVersion: string;
  entries: CertifiedSkillPackEntry[];
}

export interface CertifiedSkillPackEntry {
  id: string;
  name: string;
  path: string;
  domain: string;
  riskLevel: string;
  status: string;
  certifiedAt: string;
  tranche: string;
  outcomeKey: string;
}

export interface ProductOutcomeRuntimePlan {
  planVersion: "cvf.productOutcomeRuntime.v1";
  skillPackId: string;
  outcomeKey: string;
  name: string;
  domain: string;
  riskLevel: string;
  humanReviewRequired: boolean;
  status: string;
  templateId: string;
  routeOwner: "cvf-web /api/execute";
  command: string;
  inputContract: string;
  outputContract: string;
  receiptSchemaPath: string;
  failureRecoveryPath: string;
  executionBoundaryPath: string;
  authorityScopePath: string;
  workflowSpecPath: string;
  policyRefs: string[];
}

export type ProductSkillPackSelectionStatus = "selected" | "no_certified_pack_match";
export type ProductSkillPackSelectionConfidence = "exact" | "high" | "medium" | "none";
export type ProductSkillPackRequestContextBudgetTier = "minimal" | "standard" | "expanded";
export type ProductSkillPackRequestContextReadiness =
  | "ready"
  | "needs_clarification"
  | "needs_context_compaction"
  | "blocked_contaminated_brief";

export interface ProductSkillPackSelectionAlternative {
  skillPackId: string;
  outcomeKey: string;
  name: string;
  score: number;
  matchedTerms: string[];
}

export interface ProductSkillPackSelectionReadout {
  readoutVersion: "cvf.productSkillPackSelectionReadout.v1";
  request: string;
  status: ProductSkillPackSelectionStatus;
  selectedPlan?: ProductOutcomeRuntimePlan;
  requestContext: ProductSkillPackRequestContextReadout;
  confidence: ProductSkillPackSelectionConfidence;
  score: number;
  reason: string;
  matchedTerms: string[];
  alternatives: ProductSkillPackSelectionAlternative[];
  riskLevel?: string;
  humanReviewRequired?: boolean;
  userAction: string;
  boundaries: string[];
}

export interface ProductSkillPackRequestContextReadout {
  readoutVersion: "cvf.productSkillPackRequestContext.v1";
  request: string;
  budgetTier: ProductSkillPackRequestContextBudgetTier;
  readiness: ProductSkillPackRequestContextReadiness;
  approxTokens: number;
  wordCount: number;
  signalDensity: number;
  detectedSignals: string[];
  missingSignals: string[];
  contaminationFlags: string[];
  noiseFlags: string[];
  preservedPriority: string[];
  recommendedNextAction: string;
  boundaries: string[];
}

interface RuntimeBinding {
  templateId: string;
  inputContract: string;
  outputContract: string;
}

const RUNTIME_BINDINGS: Record<string, RuntimeBinding> = {
  strategy_analysis: {
    templateId: "strategy_analysis",
    inputContract: "business_context, options, constraints, success_criteria",
    outputContract: "Strategy analysis with recommendation and risks",
  },
  product_brief: {
    templateId: "app_builder_complete",
    inputContract: "product_goal, target_user, problem, constraints",
    outputContract: "Product requirements document",
  },
  sop_generator: {
    templateId: "documentation",
    inputContract: "process_name, actors, steps, controls",
    outputContract: "Standard operating procedure",
  },
  proposal_writer: {
    templateId: "email_template",
    inputContract: "customer_need, scope, timeline, constraints",
    outputContract: "Proposal document",
  },
  meeting_summarizer: {
    templateId: "meeting_notes",
    inputContract: "meeting_notes, participants, desired_outcome",
    outputContract: "Meeting summary with decisions and actions",
  },
  contract_review: {
    templateId: "tos_review",
    inputContract: "contract_text, review_goal, jurisdiction_context",
    outputContract: "Contract review report",
  },
  landing_page_builder: {
    templateId: "web_build_handoff",
    inputContract: "offer, audience, proof_points, constraints",
    outputContract: "Landing page copy and build handoff",
  },
  competitor_review: {
    templateId: "competitor_review",
    inputContract: "market, competitors, offering, audience, decision_goal",
    outputContract: "Competitor review with positioning risks and next moves",
  },
  data_analysis: {
    templateId: "data_analysis",
    inputContract: "dataset_summary, question, metrics, timeframe, constraints",
    outputContract: "Data analysis readout with findings, caveats, and actions",
  },
  app_requirements_spec: {
    templateId: "app_requirements_spec",
    inputContract: "app_goal, users, core_workflows, constraints, success_criteria",
    outputContract: "App requirements specification with user workflows and acceptance criteria",
  },
};

const SELECTION_TERMS: Record<string, string[]> = {
  strategy_analysis: [
    "strategy", "strategic", "business strategy", "options", "decision", "tradeoff", "recommendation",
    "market entry", "go to market", "positioning", "prioritize",
  ],
  product_brief: [
    "product brief", "product requirements", "prd", "product idea", "feature brief", "problem statement",
    "target user", "mvp", "scope product",
  ],
  sop_generator: [
    "sop", "standard operating procedure", "procedure", "process", "operations", "checklist",
    "workflow steps", "runbook", "control",
  ],
  proposal_writer: [
    "proposal", "sales proposal", "client proposal", "scope of work", "customer need", "offer",
    "commercial", "pitch", "timeline",
  ],
  meeting_summarizer: [
    "meeting", "meeting notes", "summarize meeting", "minutes", "decisions", "action items",
    "participants", "follow up",
  ],
  contract_review: [
    "contract", "agreement", "terms", "legal", "clause", "liability", "jurisdiction", "risk review",
    "tos", "service terms",
  ],
  landing_page_builder: [
    "landing page", "web page", "homepage", "campaign page", "copy", "headline", "hero",
    "conversion", "cta",
  ],
  competitor_review: [
    "competitor", "competitors", "competitive", "competition", "market landscape", "positioning",
    "benchmark rivals", "compare alternatives", "pricing comparison",
  ],
  data_analysis: [
    "data", "dataset", "analysis", "analyze", "analytics", "metrics", "kpi", "cohort", "trend",
    "anomaly", "dashboard", "csv", "spreadsheet", "financial data", "q2",
  ],
  app_requirements_spec: [
    "app", "application", "software requirements", "requirements spec", "user stories",
    "acceptance criteria", "screens", "workflows", "backend", "frontend", "build an app",
  ],
};

const SELECTION_BOUNDARIES = [
  "read_only_cli_selection",
  "no_runtime_execution",
  "no_provider_api_call",
  "no_receipt_envelope_change",
  "no_memory_mcp_tool_or_database_execution",
];

const REQUEST_CONTEXT_BOUNDARIES = [
  "deterministic_local_readout",
  "no_llm_scoring",
  "no_runtime_context_packaging",
  "no_memory_injection",
  "no_tool_mcp_database_or_provider_execution",
];

const CONTEXT_PRESERVATION_PRIORITY = [
  "active_task_objective",
  "hard_constraints_and_invariants",
  "risk_policy_requirements",
  "exact_artifact_code_path_error_references",
  "recent_decisions",
  "minimal_supporting_evidence",
  "prior_alternatives",
  "general_narrative_history",
];

export function loadCertifiedSkillPackRegistry(
  path = CERTIFIED_SKILL_PACK_REGISTRY_PATH,
): CertifiedSkillPackRegistry {
  const resolvedPath = resolveWorkspacePath(path);
  if (!resolvedPath) {
    throw new Error(`Certified skill pack registry not found: ${path}`);
  }
  const payload = JSON.parse(readFileSync(resolvedPath, "utf8")) as CertifiedSkillPackRegistry;
  if (!Array.isArray(payload.entries)) {
    throw new Error(`Certified skill pack registry has no entries: ${path}`);
  }
  return payload;
}

export function listProductOutcomeRuntimePlans(
  registryPath = CERTIFIED_SKILL_PACK_REGISTRY_PATH,
): ProductOutcomeRuntimePlan[] {
  return loadCertifiedSkillPackRegistry(registryPath).entries.map(buildProductOutcomeRuntimePlan);
}

export function resolveProductOutcomeRuntimePlan(
  idOrOutcomeKey: string,
  registryPath = CERTIFIED_SKILL_PACK_REGISTRY_PATH,
): ProductOutcomeRuntimePlan | undefined {
  const normalized = idOrOutcomeKey.trim();
  return listProductOutcomeRuntimePlans(registryPath).find((plan) => {
    return plan.skillPackId === normalized || plan.outcomeKey === normalized;
  });
}

export function selectProductSkillPackForRequest(
  request: string,
  registryPath = CERTIFIED_SKILL_PACK_REGISTRY_PATH,
): ProductSkillPackSelectionReadout {
  const normalizedRequest = normalizeForSelection(request);
  const requestContext = buildProductSkillPackRequestContextReadout(request);
  const plans = listProductOutcomeRuntimePlans(registryPath);
  const scored = plans.map((plan) => scoreProductSkillPackPlan(plan, normalizedRequest, request));
  scored.sort((a, b) => b.score - a.score || a.plan.skillPackId.localeCompare(b.plan.skillPackId));

  const best = scored[0];
  if (!normalizedRequest || !best || best.score < 2) {
    return {
      readoutVersion: "cvf.productSkillPackSelectionReadout.v1",
      request,
      status: "no_certified_pack_match",
      requestContext,
      confidence: "none",
      score: 0,
      reason: "no_certified_pack_match",
      matchedTerms: [],
      alternatives: scored
        .filter((candidate) => candidate.score > 0)
        .slice(0, 3)
        .map(toSelectionAlternative),
      userAction: "Clarify the desired outcome or open a fresh intake before using a certified product skill pack.",
      boundaries: SELECTION_BOUNDARIES,
    };
  }

  const confidence = best.exact ? "exact" : best.score >= 4 ? "high" : "medium";
  return {
    readoutVersion: "cvf.productSkillPackSelectionReadout.v1",
    request,
    status: "selected",
    selectedPlan: best.plan,
    requestContext,
    confidence,
    score: best.score,
    reason: best.exact ? "exact_certified_pack_match" : "keyword_certified_pack_match",
    matchedTerms: best.matchedTerms,
    alternatives: scored
      .filter((candidate) => candidate.plan.skillPackId !== best.plan.skillPackId && candidate.score > 0)
      .slice(0, 3)
      .map(toSelectionAlternative),
    riskLevel: best.plan.riskLevel,
    humanReviewRequired: best.plan.humanReviewRequired,
    userAction: best.plan.humanReviewRequired
      ? "Use the selected certified pack only with human review before operational, financial, legal, or customer-facing reliance."
      : "Use the selected certified pack as the bounded starting workflow; keep execution inside existing CVF runtime boundaries.",
    boundaries: SELECTION_BOUNDARIES,
  };
}

export function buildProductSkillPackRequestContextReadout(request: string): ProductSkillPackRequestContextReadout {
  const normalized = normalizeForSelection(request);
  const wordCount = normalized ? normalized.split(" ").length : 0;
  const approxTokens = Math.ceil(request.length / 4);
  const detectedSignals = detectRequestContextSignals(request, normalized);
  const missingSignals = detectMissingRequestContextSignals(detectedSignals, wordCount);
  const contaminationFlags = detectRequestContaminationFlags(request, normalized);
  const noiseFlags = detectRequestNoiseFlags(request, normalized, approxTokens);
  const readiness = classifyRequestContextReadiness({
    wordCount,
    approxTokens,
    missingSignals,
    contaminationFlags,
    noiseFlags,
  });
  const budgetTier = classifyRequestContextBudgetTier(approxTokens, readiness, missingSignals.length);
  const denominator = Math.max(
    1,
    detectedSignals.length + missingSignals.length + contaminationFlags.length + noiseFlags.length,
  );

  return {
    readoutVersion: "cvf.productSkillPackRequestContext.v1",
    request,
    budgetTier,
    readiness,
    approxTokens,
    wordCount,
    signalDensity: Number((detectedSignals.length / denominator).toFixed(3)),
    detectedSignals,
    missingSignals,
    contaminationFlags,
    noiseFlags,
    preservedPriority: CONTEXT_PRESERVATION_PRIORITY,
    recommendedNextAction: recommendedRequestContextAction(readiness),
    boundaries: REQUEST_CONTEXT_BOUNDARIES,
  };
}

export function buildProductOutcomeRuntimePlan(entry: CertifiedSkillPackEntry): ProductOutcomeRuntimePlan {
  const binding = RUNTIME_BINDINGS[entry.id] ?? RUNTIME_BINDINGS[entry.outcomeKey];
  if (!binding) {
    throw new Error(`No product outcome runtime binding for certified pack: ${entry.id}`);
  }
  const riskProfile = loadSkillPackRiskProfile(entry.path);

  return {
    planVersion: "cvf.productOutcomeRuntime.v1",
    skillPackId: entry.id,
    outcomeKey: entry.outcomeKey,
    name: entry.name,
    domain: entry.domain,
    riskLevel: entry.riskLevel,
    humanReviewRequired: riskProfile?.humanReviewRequired ?? entry.riskLevel === "R2",
    status: entry.status,
    templateId: binding.templateId,
    routeOwner: "cvf-web /api/execute",
    command: `cvf run ${entry.id} --role BUILDER --receipt`,
    inputContract: binding.inputContract,
    outputContract: binding.outputContract,
    receiptSchemaPath: `${entry.path}/receipt.schema.json`,
    failureRecoveryPath: `${entry.path}/failure.recovery.md`,
    executionBoundaryPath: `${entry.path}/execution.boundary.json`,
    authorityScopePath: `${entry.path}/authority.scope.json`,
    workflowSpecPath: `${entry.path}/workflow.spec.md`,
    policyRefs: ["CVF_CAPABILITY_INTAKE_PIPELINE_GUARD", "cvf-web /api/execute"],
  };
}

export function assertProductOutcomeRuntimePlanFiles(plan: ProductOutcomeRuntimePlan): void {
  const requiredPaths = [
    plan.receiptSchemaPath,
    plan.failureRecoveryPath,
    plan.executionBoundaryPath,
    plan.authorityScopePath,
    plan.workflowSpecPath,
  ];
  const missing = requiredPaths.filter((path) => !resolveWorkspacePath(path));
  if (missing.length) {
    throw new Error(`Product outcome runtime plan has missing files for ${plan.skillPackId}: ${missing.join(", ")}`);
  }
}

function resolveWorkspacePath(path: string): string | undefined {
  if (existsSync(path)) return path;
  const fromPackage = join(process.cwd(), "..", "..", path);
  if (existsSync(fromPackage)) return fromPackage;
  return undefined;
}

interface SkillPackRiskProfile {
  humanReviewRequired?: boolean;
}

interface ScoredProductSkillPackPlan {
  plan: ProductOutcomeRuntimePlan;
  score: number;
  exact: boolean;
  matchedTerms: string[];
}

function loadSkillPackRiskProfile(packPath: string): SkillPackRiskProfile | undefined {
  const resolvedPath = resolveWorkspacePath(`${packPath}/risk.profile.json`);
  if (!resolvedPath) return undefined;
  try {
    const payload = JSON.parse(readFileSync(resolvedPath, "utf8")) as SkillPackRiskProfile;
    return payload && typeof payload === "object" ? payload : undefined;
  } catch {
    return undefined;
  }
}

function scoreProductSkillPackPlan(
  plan: ProductOutcomeRuntimePlan,
  normalizedRequest: string,
  rawRequest: string,
): ScoredProductSkillPackPlan {
  const identityTerms = [
    plan.skillPackId,
    plan.outcomeKey,
    plan.name,
  ].map(normalizeForSelection);
  const exact = identityTerms.some((term) => term && term === normalizedRequest)
    || [plan.skillPackId, plan.outcomeKey].includes(rawRequest.trim());
  if (exact) {
    return {
      plan,
      score: 100,
      exact: true,
      matchedTerms: [plan.skillPackId],
    };
  }

  const candidateTerms = uniqueStrings([
    ...identityTerms,
    normalizeForSelection(plan.domain),
    normalizeForSelection(plan.templateId),
    ...plan.inputContract.split(",").map(normalizeForSelection),
    ...plan.outputContract.split(/\s+/).map(normalizeForSelection),
    ...(SELECTION_TERMS[plan.skillPackId] ?? []).map(normalizeForSelection),
  ]).filter((term) => term.length > 2);

  const matchedTerms = candidateTerms.filter((term) => normalizedRequest.includes(term));
  const phraseBonus = matchedTerms.some((term) => term.includes(" ")) ? 1 : 0;
  const identityBonus = identityTerms.some((term) => term && normalizedRequest.includes(term)) ? 2 : 0;
  return {
    plan,
    score: matchedTerms.length + phraseBonus + identityBonus,
    exact: false,
    matchedTerms,
  };
}

function toSelectionAlternative(candidate: ScoredProductSkillPackPlan): ProductSkillPackSelectionAlternative {
  return {
    skillPackId: candidate.plan.skillPackId,
    outcomeKey: candidate.plan.outcomeKey,
    name: candidate.plan.name,
    score: candidate.score,
    matchedTerms: candidate.matchedTerms,
  };
}

function normalizeForSelection(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function detectRequestContextSignals(rawRequest: string, normalizedRequest: string): string[] {
  const signals: string[] = [];
  if (/\b(analy[sz]e|compare|review|write|create|build|draft|summari[sz]e|plan|prioriti[sz]e|spec|design)\b/.test(normalizedRequest)) {
    signals.push("active_task_objective");
  }
  if (/\b(user|customer|audience|stakeholder|team|market|business|buyer|founder|founders|operator|developer|noncoder|non coder|b2b|saas)\b/.test(normalizedRequest)) {
    signals.push("business_goal_or_audience");
  }
  if (/\b(constraint|constraints|must|cannot|without|budget|deadline|timeline|compliance|risk|risks|scope|limit|language|tone|format)\b/.test(normalizedRequest)) {
    signals.push("constraints_or_risks");
  }
  if (/\b(success|acceptance|done when|deliverable|output|include|section|criteria)\b/.test(normalizedRequest)) {
    signals.push("acceptance_or_output_shape");
  }
  if (/(^|\s)([\w.-]+\/[\w./-]+|[\w.-]+\.(md|json|csv|tsx|ts|js|py|txt|docx|xlsx))(\s|$)/i.test(rawRequest)
    || /\b(dataset|spreadsheet|contract|meeting notes|log|trace|receipt|roadmap|registry)\b/.test(normalizedRequest)) {
    signals.push("artifact_or_evidence_reference");
  }
  return uniqueStrings(signals);
}

function detectMissingRequestContextSignals(detectedSignals: string[], wordCount: number): string[] {
  const missing: string[] = [];
  if (!detectedSignals.includes("active_task_objective")) missing.push("problem_statement_or_task_objective");
  if (!detectedSignals.includes("business_goal_or_audience")) missing.push("business_goal_or_audience");
  if (!detectedSignals.includes("constraints_or_risks") && wordCount > 3) missing.push("constraints_or_risks");
  if (!detectedSignals.includes("acceptance_or_output_shape") && wordCount > 8) missing.push("acceptance_or_output_shape");
  return missing;
}

function detectRequestContaminationFlags(rawRequest: string, normalizedRequest: string): string[] {
  const flags: string[] = [];
  if (/```/.test(rawRequest)) flags.push("contains_code_block");
  if (/<[a-z][\s\S]*>/i.test(rawRequest)) flags.push("contains_markup_or_ui_artifact");
  if (/\b(use react|use next|postgres|database schema|deploy|implementation|architecture prescription|build this now)\b/.test(normalizedRequest)) {
    flags.push("solution_biased_or_implementation_heavy");
  }
  if (/\b(pseudo mvp|continue from this mvp|existing code|html mock|ui mock)\b/.test(normalizedRequest)) {
    flags.push("continuation_from_unvalidated_artifact");
  }
  return uniqueStrings(flags);
}

function detectRequestNoiseFlags(rawRequest: string, normalizedRequest: string, approxTokens: number): string[] {
  const flags: string[] = [];
  const errorMentions = (normalizedRequest.match(/\berror\b/g) ?? []).length;
  if (approxTokens > 900) flags.push("oversized_context");
  if (errorMentions > 8 || /\b(stack trace|traceback|full log|entire log)\b/.test(normalizedRequest)) {
    flags.push("raw_log_stream");
  }
  if (approxTokens > 600 && /\b(import|function|class|const|export|return)\b/.test(normalizedRequest)) {
    flags.push("whole_file_or_code_paste");
  }
  if ((rawRequest.match(/\n/g) ?? []).length > 80) flags.push("large_multiline_paste");
  return uniqueStrings(flags);
}

function classifyRequestContextReadiness(input: {
  wordCount: number;
  approxTokens: number;
  missingSignals: string[];
  contaminationFlags: string[];
  noiseFlags: string[];
}): ProductSkillPackRequestContextReadiness {
  const severeContamination = input.contaminationFlags.includes("contains_code_block")
    || input.contaminationFlags.includes("contains_markup_or_ui_artifact")
    || input.contaminationFlags.includes("solution_biased_or_implementation_heavy");
  if (severeContamination && input.missingSignals.includes("business_goal_or_audience")) {
    return "blocked_contaminated_brief";
  }
  if (input.noiseFlags.length > 0 && (input.approxTokens > 500 || input.noiseFlags.includes("raw_log_stream"))) {
    return "needs_context_compaction";
  }
  if (input.wordCount < 4 || input.missingSignals.includes("problem_statement_or_task_objective") || input.missingSignals.length >= 3) {
    return "needs_clarification";
  }
  return "ready";
}

function classifyRequestContextBudgetTier(
  approxTokens: number,
  readiness: ProductSkillPackRequestContextReadiness,
  missingSignalCount: number,
): ProductSkillPackRequestContextBudgetTier {
  if (readiness === "needs_context_compaction" || readiness === "blocked_contaminated_brief" || approxTokens > 700) {
    return "expanded";
  }
  if (approxTokens <= 120 && missingSignalCount <= 1) return "minimal";
  return "standard";
}

function recommendedRequestContextAction(readiness: ProductSkillPackRequestContextReadiness): string {
  switch (readiness) {
    case "ready":
      return "Proceed with the selected certified pack inside existing CVF runtime boundaries.";
    case "needs_clarification":
      return "Ask for the missing problem, audience, constraints, or acceptance criteria before spending provider quota.";
    case "needs_context_compaction":
      return "Compact the request to objective, constraints, relevant evidence, current state, blockers, and next action before execution.";
    case "blocked_contaminated_brief":
      return "Run reverse-brief recovery before build or execution; separate problem, constraints, assumptions, and implementation artifacts.";
  }
}
