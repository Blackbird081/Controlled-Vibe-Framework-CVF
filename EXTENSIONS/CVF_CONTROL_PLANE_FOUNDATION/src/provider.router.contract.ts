import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { GatewayProcessedRequest } from "./ai.gateway.contract";

// --- Types ---

// Provider Router implements Option B (CVF-as-Governance):
// CVF governs WHICH providers an agent is ALLOWED to use.
// CVF does NOT call providers directly.
// Doctrine basis: CVF_ARCHITECTURE_PRINCIPLES.md §2 (not a model provider),
// §9 (model-agnostic), §10 (control the rules); CVF_PRODUCT_POSITIONING.md §3 (not LLM platform).

export type ProviderDecision = "ALLOW" | "DENY" | "ESCALATE";

export type RiskLevel = "R0" | "R1" | "R2" | "R3";

export interface ProviderDefinition {
  providerId: string;
  providerName: string;
  modelFamily: string;
  maxRiskLevel: RiskLevel;
  costTier: "free" | "standard" | "premium";
  capabilities: string[];
}

export interface ProviderPolicy {
  allowedProviders: ProviderDefinition[];
  defaultProviderId: string;
  riskCeiling: RiskLevel;
  requireExplicitApproval: boolean;
  costBudgetTier?: "free" | "standard" | "premium";
  requiredCapabilities?: string[];
}

export interface ProviderSelection {
  selectionId: string;
  evaluatedAt: string;
  decision: ProviderDecision;
  selectedProviderId: string | null;
  selectedProviderName: string | null;
  rationale: string;
  deniedReason: string | null;
  fallbackChain: string[];
  requestRiskLevel: RiskLevel;
  policyRiskCeiling: RiskLevel;
  selectionHash: string;
}

export interface ProviderRouterContractDependencies {
  now?: () => string;
}

// --- Risk ordering ---

const RISK_ORDER: Record<RiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };

function riskExceeds(actual: RiskLevel, ceiling: RiskLevel): boolean {
  return RISK_ORDER[actual] > RISK_ORDER[ceiling];
}

function extractRiskLevel(request: GatewayProcessedRequest): RiskLevel {
  const raw = request.envMetadata.riskLevel;
  if (raw === "R0" || raw === "R1" || raw === "R2" || raw === "R3") {
    return raw;
  }
  return "R1";
}

// --- Contract ---

export class ProviderRouterContract {
  private readonly now: () => string;

  constructor(dependencies: ProviderRouterContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  route(
    request: GatewayProcessedRequest,
    policy: ProviderPolicy,
  ): ProviderSelection {
    const evaluatedAt = this.now();
    const requestRiskLevel = extractRiskLevel(request);

    // 1. Policy-level risk ceiling check
    if (riskExceeds(requestRiskLevel, policy.riskCeiling)) {
      return this.buildSelection(evaluatedAt, {
        decision: "DENY",
        selectedProviderId: null,
        selectedProviderName: null,
        rationale: `Request risk level ${requestRiskLevel} exceeds policy ceiling ${policy.riskCeiling}`,
        deniedReason: `Risk level ${requestRiskLevel} > ceiling ${policy.riskCeiling}`,
        fallbackChain: [],
        requestRiskLevel,
        policyRiskCeiling: policy.riskCeiling,
      });
    }

    // 2. Explicit approval check
    if (policy.requireExplicitApproval && requestRiskLevel !== "R0") {
      return this.buildSelection(evaluatedAt, {
        decision: "ESCALATE",
        selectedProviderId: null,
        selectedProviderName: null,
        rationale: `Policy requires explicit approval for non-R0 requests (risk: ${requestRiskLevel})`,
        deniedReason: null,
        fallbackChain: [],
        requestRiskLevel,
        policyRiskCeiling: policy.riskCeiling,
      });
    }

    // 3. Filter eligible providers
    const eligible = policy.allowedProviders.filter((p) => {
      if (riskExceeds(requestRiskLevel, p.maxRiskLevel)) return false;
      if (
        policy.costBudgetTier &&
        !this.costWithinBudget(p.costTier, policy.costBudgetTier)
      ) {
        return false;
      }
      if (policy.requiredCapabilities) {
        const missing = policy.requiredCapabilities.filter(
          (cap) => !p.capabilities.includes(cap),
        );
        if (missing.length > 0) return false;
      }
      return true;
    });

    if (eligible.length === 0) {
      return this.buildSelection(evaluatedAt, {
        decision: "DENY",
        selectedProviderId: null,
        selectedProviderName: null,
        rationale: `No eligible provider: ${policy.allowedProviders.length} provider(s) checked, none satisfy risk/cost/capability constraints`,
        deniedReason: "No provider matches policy constraints",
        fallbackChain: [],
        requestRiskLevel,
        policyRiskCeiling: policy.riskCeiling,
      });
    }

    // 4. Select: prefer default if eligible, else first eligible
    const defaultProvider = eligible.find(
      (p) => p.providerId === policy.defaultProviderId,
    );
    const selected = defaultProvider ?? eligible[0];
    const fallbackChain = eligible
      .filter((p) => p.providerId !== selected.providerId)
      .map((p) => p.providerId);

    return this.buildSelection(evaluatedAt, {
      decision: "ALLOW",
      selectedProviderId: selected.providerId,
      selectedProviderName: selected.providerName,
      rationale: defaultProvider
        ? `Default provider ${selected.providerName} is eligible and selected`
        : `Default provider not eligible; ${selected.providerName} selected as first eligible`,
      deniedReason: null,
      fallbackChain,
      requestRiskLevel,
      policyRiskCeiling: policy.riskCeiling,
    });
  }

  private costWithinBudget(
    providerTier: "free" | "standard" | "premium",
    budgetTier: "free" | "standard" | "premium",
  ): boolean {
    const tierOrder = { free: 0, standard: 1, premium: 2 };
    return tierOrder[providerTier] <= tierOrder[budgetTier];
  }

  private buildSelection(
    evaluatedAt: string,
    fields: Omit<ProviderSelection, "selectionId" | "evaluatedAt" | "selectionHash">,
  ): ProviderSelection {
    const selectionHash = computeDeterministicHash(
      "w64-t1-provider-router",
      evaluatedAt,
      `decision:${fields.decision}`,
      `provider:${fields.selectedProviderId ?? "none"}`,
      `risk:${fields.requestRiskLevel}`,
      `ceiling:${fields.policyRiskCeiling}`,
    );

    const selectionId = computeDeterministicHash(
      "w64-t1-provider-router-id",
      selectionHash,
      evaluatedAt,
    );

    return {
      selectionId,
      evaluatedAt,
      selectionHash,
      ...fields,
    };
  }
}

// --- Factory ---

export function createProviderRouterContract(
  dependencies?: ProviderRouterContractDependencies,
): ProviderRouterContract {
  return new ProviderRouterContract(dependencies);
}
